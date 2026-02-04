import React from "react";
import { cn } from "../../lib/utils.js";

export function Label({ className, ...props }) {
  return <label className={cn("text-sm font-medium text-brand-900", className)} {...props} />;
}
