"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = { value: T; label: string; icon?: React.ReactNode; count?: number };

/** Underlined tab bar (Linear-style). Scrolls horizontally on small screens. */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: TabItem<T>[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("scrollbar-none -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
      <div role="tablist" className="flex min-w-max items-center gap-1 border-b border-border">
        {items.map((it) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(it.value)}
              className={cn(
                "relative inline-flex h-10 items-center gap-2 px-3 text-[13px] font-medium transition-colors [&_svg]:size-4",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {it.icon}
              {it.label}
              {it.count !== undefined && (
                <span className="tabular rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">{it.count}</span>
              )}
              {active && (
                <motion.span
                  layoutId={`tab-underline-${id}`}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground"
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
