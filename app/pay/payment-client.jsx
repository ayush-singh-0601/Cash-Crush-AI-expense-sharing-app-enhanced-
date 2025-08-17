"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { UpiWebPayment } from "@/components/upi-web-payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentClient() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const amount = searchParams.get("amount");
  const [error, setError] = useState("");
  
  // Fetch user data
  const { data: user, isLoading } = useConvexQuery(
    api.users.getUserById, 
    { id: userId },
    { enabled: !!userId }
  );

  useEffect(() => {
    // Validate parameters
    if (!userId) {
      setError("Missing user ID in payment link");
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Invalid payment amount");
      return;
    }
  }, [userId, amount]);

  if (error) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-500">Payment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error}</p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              This payment link appears to be invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Loading Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="h-32 w-32 animate-pulse bg-muted rounded-md"></div>
              <div className="h-8 w-full animate-pulse bg-muted rounded-md"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-500">User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">
              The user associated with this payment link could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">UPI Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">Amount: ₹{parseFloat(amount).toFixed(2)}</p>
          </div>
          
          <UpiWebPayment 
            userId={userId}
            userName={user.name}
            userUpiId={user.upiId}
            amount={amount}
            onPaymentComplete={() => {
              // Redirect to a success page or show a success message
              window.location.href = "/payment-success";
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}