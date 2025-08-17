"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, CheckCircle2, IndianRupee, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { generateUpiPaymentUrl } from "@/lib/upi";

export function UpiWebPayment({ userId, userName, userUpiId, amount, onPaymentComplete }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, processing, completed, failed
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate UPI payment URL
  const upiUrl = userUpiId ? generateUpiPaymentUrl({
    pa: userUpiId,
    pn: userName || "User",
    am: amount,
    cu: "INR",
    tn: "Settlement"
  }) : "";

  const copyUpiId = () => {
    if (!userUpiId) return;
    
    navigator.clipboard.writeText(userUpiId);
    setCopied(true);
    toast.success("UPI ID copied to clipboard");
    
    setTimeout(() => setCopied(false), 2000);
  };

  const sharePaymentLink = async () => {
    if (!userId || !amount) return;

    // Create a web payment URL instead of a UPI deep link
    const webPaymentUrl = `${window.location.origin}/pay?userId=${userId}&amount=${amount}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Pay ₹${parseFloat(amount).toFixed(2)} to ${userName || 'User'}`,
          text: `Pay ₹${parseFloat(amount).toFixed(2)} to ${userName || 'User'} using UPI`,
          url: webPaymentUrl
        });
        toast.success("Payment link shared successfully");
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(webPaymentUrl);
        toast.success("Payment link copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing payment link:", error);
      toast.error("Failed to share payment link");
    }
  };

  const simulatePayment = () => {
    setIsProcessing(true);
    setPaymentStatus("processing");
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStatus("completed");
      
      // Call the onPaymentComplete callback after a short delay
      setTimeout(() => {
        if (onPaymentComplete) {
          onPaymentComplete();
        }
      }, 1500);
    }, 2000);
  };

  if (!userUpiId) {
    return (
      <Card className="w-full bg-white/80 dark:bg-card/80 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full"
            >
              <IndianRupee className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </motion.div>
            
            <p className="text-muted-foreground text-center">
              {userName || "This user"} hasn't added their UPI ID yet.
            </p>
            
            <p className="text-sm text-center">
              Please ask them to add their UPI ID in their profile settings.
            </p>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={onPaymentComplete}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white/80 dark:bg-card/80 shadow-md overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-6">
          {paymentStatus === "completed" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full"
            >
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </motion.div>
          ) : showQR ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-4 rounded-xl shadow-md"
            >
              <QRCodeCanvas 
                value={upiUrl} 
                size={200} 
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={false}
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full"
            >
              <IndianRupee className="h-8 w-8 text-green-600 dark:text-green-400" />
            </motion.div>
          )}
          
          <div className="flex flex-col items-center gap-2 w-full">
            {paymentStatus === "completed" ? (
              <p className="font-medium text-center text-green-600 dark:text-green-400">
                Payment Completed Successfully!
              </p>
            ) : (
              <p className="font-medium text-center">
                Pay ₹{parseFloat(amount).toFixed(2)} to {userName}
              </p>
            )}
            
            {paymentStatus === "pending" && (
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md w-full max-w-xs">
                <span className="text-sm font-medium truncate flex-grow text-center">
                  {userUpiId}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={copyUpiId}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            
            {paymentStatus === "pending" && (
              <div className="flex gap-2 mt-2">
                <Button 
                  variant={showQR ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowQR(!showQR)}
                >
                  {showQR ? "Hide QR Code" : "Show QR Code"}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={sharePaymentLink}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            )}
            
            {paymentStatus === "pending" && (
              <div className="w-full max-w-xs mt-4">
                <Button 
                  variant="default" 
                  size="lg"
                  className="w-full py-6 bg-green-600 hover:bg-green-700 text-white"
                  onClick={simulatePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    "Complete Payment"
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Click this button to complete your payment directly on this website
                </p>
              </div>
            )}
            
            {paymentStatus === "completed" && (
              <Button 
                variant="default" 
                size="sm"
                className="mt-4"
                onClick={onPaymentComplete}
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}