"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpiIdInput } from "@/components/ui/upi-id-input";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";

export default function ProfileUpi() {
  const { data: currentUser, isLoading } = useConvexQuery(api.users.getCurrentUser);
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    if (currentUser?.upiId) {
      setUpiId(currentUser.upiId);
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <Card className="w-full bg-white/80 dark:bg-card/80 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">UPI Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-12 w-full animate-pulse bg-muted rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white/80 dark:bg-card/80 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">UPI Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <UpiIdInput 
          initialValue={upiId} 
          onSave={setUpiId} 
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}