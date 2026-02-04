import React from "react";
import { cn } from "../../lib/utils.js";

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-brand-100 text-brand-900",
    outline: "border border-brand-200 text-brand-900",
    success: "bg-emerald-100 text-emerald-900",
    warning: "bg-amber-100 text-amber-900",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}
