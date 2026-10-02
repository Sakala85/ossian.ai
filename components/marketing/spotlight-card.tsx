"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Card with a soft violet spotlight that follows the pointer, plus a hover lift. */
export function SpotlightCard({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn(
        "group/card relative isolate overflow-hidden rounded-2xl border border-border bg-card/50 transition-[border-color,translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-float",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{
          background:
            "radial-gradient(460px circle at var(--mx, 50%) var(--my, 0%), color-mix(in oklch, var(--primary) 13%, transparent), transparent 65%)",
        }}
      />
      {children}
    </div>
  );
}
