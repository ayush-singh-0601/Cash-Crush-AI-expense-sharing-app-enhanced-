"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, IndianRupee } from "lucide-react";

const settlementSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  note: z.string().optional(),
  paymentType: z.enum(["youPaid", "theyPaid"]),
});

const SettlementForm = ({ entityType, entityData, onSuccess }) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const createSettlement = useConvexMutation(api.settlements.createSettlement);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: '',
      note: "",
      paymentType: 'youPaid',
    },
  });

  useEffect(() => {
    if (entityType === 'user') {
        const balance = entityData.netBalance;
        const amountToSet = balance < 0 ? Math.abs(balance).toFixed(2) : '';
        const paymentTypeToSet = balance > 0 ? 'theyPaid' : 'youPaid';
        reset({ amount: amountToSet, note: '', paymentType: paymentTypeToSet });
    }
  }, [entityType, entityData, reset]);

  useEffect(() => {
      if (entityType === 'group' && selectedGroupMemberId) {
          const member = entityData.balances.find(m => m.userId === selectedGroupMemberId);
          const balance = member?.netBalance || 0;
          const amountToSet = balance > 0 ? Math.abs(balance).toFixed(2) : '';
          const paymentTypeToSet = balance < 0 ? 'youPaid' : 'theyPaid'; // Corrected logic here
          setValue('amount', amountToSet);
          setValue('paymentType', paymentTypeToSet);
      }
  }, [selectedGroupMemberId, entityType, entityData, setValue]);

  const amount = watch("amount");
  const paymentType = watch("paymentType");

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const settlementData = {
        amount: parseFloat(data.amount),
        note: data.note,
        paidByUserId: '',
        receivedByUserId: '',
        groupId: entityType === 'group' ? entityData.group.id : undefined,
      };

      if (entityType === 'user') {
        settlementData.paidByUserId = data.paymentType === 'youPaid' ? currentUser._id : entityData.counterpart.userId;
        settlementData.receivedByUserId = data.paymentType === 'youPaid' ? entityData.counterpart.userId : currentUser._id;
      } else if (entityType === 'group') {
        if (!selectedGroupMemberId) throw new Error("No group member selected");
        settlementData.paidByUserId = data.paymentType === 'youPaid' ? currentUser._id : selectedGroupMemberId;
        settlementData.receivedByUserId = data.paymentType === 'youPaid' ? selectedGroupMemberId : currentUser._id;
      }

      await createSettlement.mutate(settlementData);
      toast.success("Settlement recorded!");
      if(onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUserSettlement = () => {
    const otherUser = entityData.counterpart;
    const netBalance = entityData.netBalance;
    return (
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">Current balance</h3>
        {netBalance === 0 ? (
          <p>You are all settled up with {otherUser.name}</p>
        ) : netBalance > 0 ? (
          <div className="flex justify-between items-center">
            <p><span className="font-medium">{otherUser.name}</span> owes you</p>
            <span className="text-xl font-bold text-green-600">₹{netBalance.toFixed(2)}</span>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <p>You owe <span className="font-medium">{otherUser.name}</span></p>
            <span className="text-xl font-bold text-red-600">₹{Math.abs(netBalance).toFixed(2)}</span>
          </div>
        )}
      </div>
    );
  };

  const renderGroupSettlement = () => (
    <div className="space-y-2">
      <Label>Who are you settling with?</Label>
      <div className="space-y-2">
        {entityData.balances.map((member) => {
          const isSelected = selectedGroupMemberId === member.userId;
          return (
            <div
              key={member.userId}
              className={`border rounded-md p-3 cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
              onClick={() => setSelectedGroupMemberId(member.userId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.imageUrl} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{member.name}</span>
                </div>
                <div className={`font-medium ${member.netBalance < 0 ? "text-green-600" : member.netBalance > 0 ? "text-red-600" : ""}`}>
                  {member.netBalance < 0 ? `Owes you ₹${Math.abs(member.netBalance).toFixed(2)}` : member.netBalance > 0 ? `You owe ₹${Math.abs(member.netBalance).toFixed(2)}` : "Settled up"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const getRecipient = () => {
      if (entityType === 'user') return entityData.counterpart;
      if (entityType === 'group' && selectedGroupMemberId) {
          return entityData.balances.find(m => m.userId === selectedGroupMemberId);
      }
      return null;
  }

  const recipient = getRecipient();

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {entityType === 'user' ? renderUserSettlement() : renderGroupSettlement()}

      {(entityType === 'user' || selectedGroupMemberId) && (
        <>
          <div className="space-y-2">
            <Label>Who paid?</Label>
            <RadioGroup value={paymentType} onValueChange={(v) => setValue('paymentType', v)} className="flex flex-col space-y-2">
              <Label className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer">
                <RadioGroupItem value="youPaid" id="youPaid" />
                <span>You paid {recipient?.name}</span>
              </Label>
              <Label className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer">
                <RadioGroupItem value="theyPaid" id="theyPaid" />
                <span>{recipient?.name} paid you</span>
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="amount" placeholder="0.00" type="number" step="0.01" className="pl-8" {...register("amount")} />
            </div>
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" placeholder="e.g. Dinner, movie tickets" {...register("note")} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Settlement'}
          </Button>
        </>
      )}
    </motion.form>
  );
};

export default SettlementForm;
