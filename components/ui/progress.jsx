"use client";

import * as React from "react";

// Simple progress bar component compatible with shadcn/radix style
// Usage: <Progress value={percent} className="w-full" />
export const Progress = React.forwardRef(({ className = "", value = 0, ...props }, ref) => {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-full bg-muted h-2 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
});

Progress.displayName = "Progress";
