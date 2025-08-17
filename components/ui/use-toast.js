"use client";

import { toast as sonnerToast } from "sonner";

// Minimal shadcn-compatible hook bridging to sonner
// Supports usage: const { toast } = useToast(); toast({ title, description, variant })
export function useToast() {
  return {
    toast: (opts = {}) => {
      if (typeof opts === "string") {
        return sonnerToast(opts);
      }
      const { title, description } = opts;
      const content = title || description || "";
      return sonnerToast(content, description ? { description } : undefined);
    },
  };
}
