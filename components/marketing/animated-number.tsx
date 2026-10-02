"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const formatters = new Map<number, Intl.NumberFormat>();
function formatNumber(n: number, decimals: number) {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formatters.set(decimals, f);
  }
  return f.format(n).replace(/\u202f/g, "\u00a0");
}

/**
 * Number that tweens to `value` — first when it scrolls into view, then on every change.
 * `format` (client callers only) overrides prefix/suffix/decimals formatting.
 */
export function AnimatedNumber({
  value,
  from = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.4,
  format,
  className,
}: {
  value: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const reduce = useReducedMotion();
  const current = useRef(from);
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        current.current = v;
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const render = (n: number) => (format ? format(n) : `${prefix}${formatNumber(n, decimals)}${suffix}`);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      <span className="sr-only">{render(value)}</span>
      <span aria-hidden>{render(display)}</span>
    </span>
  );
}
