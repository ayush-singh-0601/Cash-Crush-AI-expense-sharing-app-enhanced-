"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Home, Receipt, Share2, Download } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get payment details from URL params or localStorage
    const amount = searchParams.get("amount");
    const recipient = searchParams.get("recipient");
    const note = searchParams.get("note");
    const paymentId = searchParams.get("paymentId");

    if (amount || recipient) {
      setPaymentDetails({
        amount: amount || "0.00",
        recipient: recipient || "User",
        note: note || "Payment",
        paymentId: paymentId || `PAY-${Date.now()}`
      });
    } else {
      // Try to get from localStorage
      const stored = localStorage.getItem("lastPayment");
      if (stored) {
        try {
          setPaymentDetails(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing stored payment:", e);
        }
      }
    }
    
    setIsLoading(false);
  }, [searchParams]);

  const handleShare = async () => {
    if (!paymentDetails) return;

    const shareText = `I just made a payment of ₹${paymentDetails.amount} to ${paymentDetails.recipient} via the expense sharing app!`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Payment Successful",
          text: shareText,
          url: window.location.href
        });
        toast.success("Payment shared successfully!");
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(shareText);
        toast.success("Payment details copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing payment:", error);
      toast.error("Failed to share payment details");
    }
  };

  const handleDownloadReceipt = () => {
    if (!paymentDetails) return;

    // Create a simple receipt text
    const receiptText = `
PAYMENT RECEIPT
================

Payment ID: ${paymentDetails.paymentId}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Amount: ₹${paymentDetails.amount}
Recipient: ${paymentDetails.recipient}
Note: ${paymentDetails.note}

Status: COMPLETED

Thank you for using our expense sharing app!
    `.trim();

    // Create and download the receipt
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-receipt-${paymentDetails.paymentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Receipt downloaded successfully!");
  };

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-32 w-32 animate-pulse bg-muted rounded-md"></div>
              <div className="h-8 w-full animate-pulse bg-muted rounded-md"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <Card>
        <CardContent className="pt-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            {/* Success Icon */}
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>

            {/* Success Message */}
            <div>
              <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground">
                Your payment has been processed successfully.
              </p>
            </div>

            {/* Payment Details */}
            {paymentDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-full bg-muted/50 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="text-xl font-bold text-green-600">
                    ₹{parseFloat(paymentDetails.amount).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recipient:</span>
                  <span className="font-medium">{paymentDetails.recipient}</span>
                </div>
                
                {paymentDetails.note && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Note:</span>
                    <span className="text-sm">{paymentDetails.note}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment ID:</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {paymentDetails.paymentId}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm">{new Date().toLocaleDateString()}</span>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-full space-y-3"
            >
              <Button 
                variant="default" 
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => router.push("/")}
              >
                <Home className="h-5 w-5 mr-2" />
                Go Home
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={handleDownloadReceipt}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Receipt
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-xs text-muted-foreground text-center"
            >
              <p>
                A confirmation has been sent to your email address.
                <br />
                Keep this receipt for your records.
              </p>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-32 w-32 animate-pulse bg-muted rounded-md"></div>
              <div className="h-8 w-full animate-pulse bg-muted rounded-md"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}