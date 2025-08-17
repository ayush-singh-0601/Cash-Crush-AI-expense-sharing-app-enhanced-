"use client";

import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { UpiWebPayment } from "@/components/upi-web-payment";

export function SettlementUpi({ userId, amount }) {
  const { data: user, isLoading } = useConvexQuery(api.users.getUser, { userId });

  if (isLoading) {
    return (
      <Card className="w-full bg-white/80 dark:bg-card/80 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-32 w-32 animate-pulse bg-muted rounded-md"></div>
            <div className="h-8 w-full animate-pulse bg-muted rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white/80 dark:bg-card/80 shadow-md overflow-hidden">
      <CardContent className="pt-6">
        <UpiWebPayment 
          userId={userId}
          userName={user?.name}
          userUpiId={user?.upiId}
          amount={amount}
          onPaymentComplete={() => {}}
        />
      </CardContent>
    </Card>
  );
}