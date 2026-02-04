import React from "react";
import { cn } from "../../lib/utils.js";

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
        checked ? "border-brand-400 bg-brand-50 text-brand-900" : "border-brand-200 bg-white text-brand-800"
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "inline-flex h-5 w-9 items-center rounded-full border transition",
          checked ? "border-brand-500 bg-brand-500" : "border-brand-200 bg-brand-50"
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow-sm transition",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
      {label}
    </button>
  );
}
