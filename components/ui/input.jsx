import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}, ref) {
  return (
    (<input
      ref={ref}
      type={type}
      data-slot="input"
      className={`rounded-full px-5 py-2 border border-border shadow-sm focus:ring-2 focus:ring-primary/30 focus:outline-none bg-white/90 ${className}`}
      {...props} />)
  );
}

export { Input }
