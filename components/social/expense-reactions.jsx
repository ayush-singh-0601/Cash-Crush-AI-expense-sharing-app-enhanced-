"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJI_OPTIONS = ["😂", "❤️", "👍", "😮", "😢", "😡", "🎉", "💰", "🤑", "😅"];

export function ExpenseReactions({ expenseId }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const reactions = useQuery(api.social.getExpenseReactions, { expenseId });
  const addReaction = useMutation(api.social.addReaction);
  const removeReaction = useMutation(api.social.removeReaction);

  const handleReactionClick = async (emoji) => {
    try {
      await addReaction({ expenseId, emoji });
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleReactionRemove = async () => {
    try {
      await removeReaction({ expenseId });
    } catch (error) {
      console.error("Failed to remove reaction:", error);
    }
  };

  if (!reactions) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Existing Reactions */}
      <AnimatePresence>
        {reactions.map((reactionGroup) => (
          <motion.div
            key={reactionGroup.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <span className="text-lg mr-1">{reactionGroup.emoji}</span>
                  <span className="text-sm font-medium text-blue-700">
                    {reactionGroup.count}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Reacted with {reactionGroup.emoji}
                  </div>
                  <div className="flex flex-wrap gap-2 max-w-48">
                    {reactionGroup.users.map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.imageUrl} />
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600">{user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Reaction Button */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top">
          <div className="grid grid-cols-5 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-xl hover:bg-gray-100 rounded-lg"
                onClick={() => handleReactionClick(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
