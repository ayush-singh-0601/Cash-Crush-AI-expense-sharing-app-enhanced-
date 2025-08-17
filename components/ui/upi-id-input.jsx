"use client";

import { useState } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function UpiIdInput({ initialValue = "", onSave, className }) {
  const [upiId, setUpiId] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const updateUpiId = useConvexMutation(api.users.updateUpiId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic UPI ID validation
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(upiId)) {
      toast.error("Please enter a valid UPI ID (e.g., name@upi)");
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);
    
    try {
      await updateUpiId.mutate({ upiId });
      toast.success("UPI ID saved successfully!");
      setIsSuccess(true);
      if (onSave) onSave(upiId);
      
      // Reset success state after 2 seconds
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (error) {
      toast.error("Failed to save UPI ID: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-2">
        <Label htmlFor="upiId">UPI ID</Label>
        <div className="flex gap-2">
          <Input
            id="upiId"
            placeholder="yourname@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="flex-grow focus:ring-2 focus:ring-green-400 transition-all duration-200"
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || isSuccess || !upiId}
            className="min-w-[80px]"
          >
            {isSubmitting ? (
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
              "Save"
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Your UPI ID will be used for receiving payments from other users.
        </p>
      </div>
    </form>
  );
}