import React from "react";
import { cn } from "../../lib/utils.js";

export function Button({ className, variant = "default", size = "md", ...props }) {
  const variants = {
    default: "bg-brand-700 text-white hover:bg-brand-800",
    secondary: "bg-brand-100 text-brand-900 hover:bg-brand-200",
    outline: "border border-brand-300 text-brand-900 hover:bg-brand-50",
    ghost: "text-brand-900 hover:bg-brand-50",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-medium transition disabled:opacity-50 disabled:pointer-events-none",
        variants[variant] || variants.default,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    />
  );
}
