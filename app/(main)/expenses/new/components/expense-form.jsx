"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ParticipantSelector } from "./participant-selector";
import { GroupSelector } from "./group-selector";
import { CategorySelector } from "./category-selector";
import { SplitSelector } from "./split-selector";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { getAllCategories } from "@/lib/expense-categories";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  category: z.string().optional(),
  date: z.date(),
  paidByUserId: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "percentage", "exact"]),
  groupId: z.string().optional(),
});

export function ExpenseForm({ type = "individual", onSuccess }) {
  const [participants, setParticipants] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [splits, setSplits] = useState([]);
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  const createExpense = useConvexMutation(api.expenses.createExpense);
  const categories = getAllCategories();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      paidByUserId: currentUser?._id || "",
      splitType: "equal",
      groupId: undefined,
    },
  });
  const amountValue = watch("amount");
  const paidByUserId = watch("paidByUserId");
  const [isSubmittingState, setIsSubmittingState] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    if (participants.length === 0 && currentUser) {
      setParticipants([
        {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          imageUrl: currentUser.imageUrl,
        },
      ]);
    }
  }, [currentUser, participants]);

  const onSubmit = async (data) => {
    try {
      const amount = parseFloat(data.amount);
      const formattedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
        paid: split.userId === data.paidByUserId,
      }));
      const totalSplitAmount = formattedSplits.reduce(
        (sum, split) => sum + split.amount,
        0
      );
      const tolerance = 0.01;

      if (Math.abs(totalSplitAmount - amount) > tolerance) {
        toast.error(
          `Split amounts don't add up to the total. Please adjust your splits.`
        );
        return;
      }
      const groupId = type === "individual" ? undefined : data.groupId;
      await createExpense.mutate({
        description: data.description,
        amount: amount,
        category: data.category || "Other",
        date: data.date.getTime(), 
        paidByUserId: data.paidByUserId,
        splitType: data.splitType,
        splits: formattedSplits,
        groupId,
      });
      toast.success("Expense created successfully!");
      reset();
      const otherParticipant = participants.find(
        (p) => p.id !== currentUser._id
      );
      const otherUserId = otherParticipant?.id;
      if (onSuccess) onSuccess(type === "individual" ? otherUserId : groupId);
    } catch (error) {
      toast.error("Failed to create expense: " + error.message);
    }
  };

  const handleAnimatedSubmit = async (data) => {
    setIsSubmittingState(true);
    setIsSuccess(false);
    try {
      await onSubmit(data);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 1500);
    } finally {
      setIsSubmittingState(false);
    }
  };

  // Receipt upload handler
  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  // Receipt analysis handler (using OCR.space API)
  const analyzeReceipt = async () => {
    if (!receiptFile) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const formData = new FormData();
    formData.append("file", receiptFile);
    formData.append("OCREngine", "2");
    try {
      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: { apikey: "helloworld" }, // Free demo key
        body: formData,
      });
      const data = await res.json();
      const text = data?.ParsedResults?.[0]?.ParsedText || "";
      // Try to extract amount and date
      const amountMatch = text.match(/\b(?:total|amount|grand total)\s*[:\-]?\s*([\d,.]+)/i);
      const dateMatch = text.match(/\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/);
      let foundAmount = amountMatch ? amountMatch[1].replace(/,/g, "") : null;
      let foundDate = dateMatch ? new Date(dateMatch[1].replace(/-/g, "/")) : null;
      setAnalysisResult({
        text,
        foundAmount,
        foundDate,
      });
      if (foundAmount) setValue("amount", foundAmount);
      if (foundDate && !isNaN(foundDate)) {
        setSelectedDate(foundDate);
        setValue("date", foundDate);
      }
      toast.success("Receipt analyzed! Fields autofilled if detected.");
    } catch (err) {
      setAnalysisResult({ error: "Failed to analyze receipt." });
      toast.error("Failed to analyze receipt.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!currentUser) return null;
  return (
    <form onSubmit={handleSubmit(handleAnimatedSubmit)} className="space-y-6">
      {/* Receipt Upload & Analysis */}
      <div className="glass premium-gradient p-4 rounded-xl shadow mb-6">
        <Label>Receipt Upload (optional)</Label>
        <div className="flex flex-col md:flex-row gap-4 items-center mt-2">
          <input
            type="file"
            accept="image/*,application/pdf"
            ref={fileInputRef}
            onChange={handleReceiptChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            aria-label="Upload receipt"
          />
          {receiptPreview && (
            <img
              src={receiptPreview}
              alt="Receipt Preview"
              className="h-24 rounded-lg shadow border object-contain"
            />
          )}
          {receiptFile && (
            <Button type="button" onClick={analyzeReceipt} disabled={isAnalyzing} className="ml-2">
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Analyze Receipt"
              )}
            </Button>
          )}
        </div>
        {analysisResult && (
          <div className="mt-2 text-xs text-muted-foreground">
            {analysisResult.error ? (
              <span className="text-red-500">{analysisResult.error}</span>
            ) : (
              <>
                <div>Extracted Text: <span className="font-mono">{analysisResult.text.slice(0, 120)}...</span></div>
                {analysisResult.foundAmount && <div>Detected Amount: <span className="font-bold">{analysisResult.foundAmount}</span></div>}
                {analysisResult.foundDate && <div>Detected Date: <span className="font-bold">{analysisResult.foundDate.toLocaleDateString()}</span></div>}
              </>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Lunch, movie tickets, etc."
              {...register("description")}
              className="focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              {...register("amount")}
              className="focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelector
              categories={categories || []}
              onChange={(categoryId) => {
                if (categoryId) {
                  setValue("category", categoryId);
                }
              }}
              className="focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    "focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setValue("date", date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {type === "group" && (
          <div className="space-y-2">
            <Label>Group</Label>
            <GroupSelector
              onChange={(group) => {
                if (!selectedGroup || selectedGroup.id !== group.id) {
                  setSelectedGroup(group);
                  setValue("groupId", group.id);
                  if (group.members && Array.isArray(group.members)) {

                    setParticipants(group.members);
                  }
                }
              }}
              className="focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
            />
            {!selectedGroup && (
              <p className="text-xs text-amber-600">
                Please select a group to continue
              </p>
            )}
          </div>
        )}
        {type === "individual" && (
          <div className="space-y-2">
            <Label>Participants</Label>
            <ParticipantSelector
              participants={participants}
              onParticipantsChange={setParticipants}
              className="focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
            />
            {participants.length <= 1 && (
              <p className="text-xs text-amber-600">
                Please add at least one other participant
              </p>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label>Paid by</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
            {...register("paidByUserId")}
          >
            <option value="">Select who paid</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.id === currentUser._id ? "You" : participant.name}
              </option>
            ))}
          </select>
          {errors.paidByUserId && (
            <p className="text-sm text-red-500">
              {errors.paidByUserId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Split type</Label>
          <Tabs
            defaultValue="equal"
            onValueChange={(value) => setValue("splitType", value)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="equal">Equal</TabsTrigger>
              <TabsTrigger value="percentage">Percentage</TabsTrigger>
              <TabsTrigger value="exact">Exact Amounts</TabsTrigger>
            </TabsList>
            <TabsContent value="equal" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Split equally among all participants
              </p>
              <SplitSelector
                type="equal"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits} 
                className="focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
              />
            </TabsContent>
            <TabsContent value="percentage" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Split by percentage
              </p>
              <SplitSelector
                type="percentage"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits} 
                className="focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
              />
            </TabsContent>
            <TabsContent value="exact" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Enter exact amounts
              </p>
              <SplitSelector
                type="exact"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitsChange={setSplits} 
                className="focus:ring-2 focus:ring-green-400 focus:scale-105 transition-all duration-200"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isSubmittingState || isSuccess}>
          {isSubmittingState ? (
            <motion.span
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="inline-block"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
            </motion.span>
          ) : isSuccess ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-block"
            >
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </motion.span>
          ) : (
            "Add Expense"
          )}
        </Button>
      </div>
    </form>
  );
}
