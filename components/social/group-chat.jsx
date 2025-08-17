"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, DollarSign, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export function GroupChat({ groupId, groupName }) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  const messages = useQuery(api.social.getGroupMessages, { groupId, limit: 50 });
  const sendMessage = useMutation(api.social.sendMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendMessage({
        groupId,
        message: message.trim(),
        messageType: "text",
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const renderMessage = (msg) => {
    switch (msg.messageType) {
      case "expense_added":
        return (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Receipt className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm text-green-800">
                <span className="font-medium">{msg.user.name}</span> added an expense
              </p>
              {msg.relatedExpense && (
                <p className="text-xs text-green-600 mt-1">
                  {msg.relatedExpense.description} - {formatCurrency(msg.relatedExpense.amount)}
                </p>
              )}
            </div>
          </div>
        );

      case "settlement_made":
        return (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{msg.user.name}</span> made a settlement
              </p>
              {msg.relatedSettlement && (
                <p className="text-xs text-blue-600 mt-1">
                  {formatCurrency(msg.relatedSettlement.amount)}
                </p>
              )}
            </div>
          </div>
        );

      case "system":
        return (
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              {msg.message}
            </Badge>
          </div>
        );

      default:
        return (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={msg.user.imageUrl} />
              <AvatarFallback className="text-xs">
                {msg.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {msg.user.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <p className="text-sm text-gray-700 break-words">
                  {msg.message}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-green-600" />
          {groupName} Chat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
          <AnimatePresence initial={false}>
            {messages?.map((msg) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderMessage(msg)}
              </motion.div>
            ))}
          </AnimatePresence>

          {messages?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Start the conversation!
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim() || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
