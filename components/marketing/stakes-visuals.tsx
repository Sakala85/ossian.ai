"use client";

import { motion } from "motion/react";
import { EASE } from "./reveal";

/** Horizontal fill that grows to `percent` when scrolled into view. */
export function GrowBar({ percent }: { percent: number }) {
  return (
    <motion.span
      className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,color-mix(in_oklch,var(--primary)_55%,transparent),var(--primary))]"
      initial={{ width: "0%" }}
      whileInView={{ width: `${percent}%` }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
    />
  );
}
