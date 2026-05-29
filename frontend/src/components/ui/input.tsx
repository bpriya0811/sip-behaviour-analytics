import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-[#d8defe] bg-white/90 px-3 text-sm text-[#17215a] outline-none transition focus:border-[#7d8dff] focus:ring-4 focus:ring-[#dfe5ff]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
