import React from "react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "../convex/_generated/api";
import { UpiWebPayment } from "@/components/upi-web-payment";

export default function SettleWithUpiInfo({ userId, amount, onClose }) {
  const { data: user, isLoading } = useConvexQuery(api.users.getUserById, { id: userId });

  if (isLoading) return <div className="p-4">Loading UPI info...</div>;
  if (!user) return (
    <div className="p-4 text-red-500">User not found.</div>
  );
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">UPI Payment</h3>
        <p className="text-sm text-gray-600">Amount: ₹{parseFloat(amount).toFixed(2)}</p>
      </div>
      
      <UpiWebPayment 
        userId={userId}
        userName={user.name}
        userUpiId={user.upiId}
        amount={amount}
        onPaymentComplete={onClose}
      />
    </div>
  );
}
