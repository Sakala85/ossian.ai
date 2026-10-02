"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  className,
  label,
}: {
  checked: boolean;
  onCheckedChange?: (v: boolean) => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-5.5 w-9.5 shrink-0 items-center rounded-full border border-transparent transition-colors",
        checked ? "bg-primary" : "bg-border-strong",
        className,
      )}
    >
      <span
        className={cn(
          "size-4.5 rounded-full bg-white shadow-[0_1px_3px_0_oklch(0_0_0/25%)] transition-transform duration-200",
          checked ? "translate-x-[17px]" : "translate-x-[1px]",
        )}
      />
    </button>
  );
}
