"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type FaqItem = { q: string; a: string };

/** Accessible accordion (button + region, aria-expanded/controls) with a CSS grid-rows height transition. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((it, i) => {
        const expanded = open === i;
        const btnId = `${base}-q-${i}`;
        const panelId = `${base}-a-${i}`;
        return (
          <div key={it.q}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[15.5px] font-medium tracking-tight transition-colors hover:text-foreground sm:text-[16.5px]"
              >
                <span className={cn("transition-colors", expanded ? "text-foreground" : "text-foreground/85")}>{it.q}</span>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border transition-[transform,border-color,background-color] duration-300",
                    expanded
                      ? "rotate-45 border-primary/40 bg-primary-soft text-primary"
                      : "border-border text-muted-foreground group-hover:border-border-strong",
                  )}
                  aria-hidden
                >
                  <Plus className="size-3.5" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              inert={!expanded}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pr-12 pb-6 text-[14.5px] leading-relaxed text-muted-foreground">{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
