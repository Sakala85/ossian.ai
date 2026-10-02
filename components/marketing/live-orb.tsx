"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Orb, type OrbState } from "@/components/voice/orb";
import { cn } from "@/lib/utils";

/**
 * The voice Orb, mounted only while on screen (its canvas loop stops when unmounted),
 * with a simulated speech-like audio level when speaking / listening.
 */
export function LiveOrb({ state, size, className }: { state: OrbState; size: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "160px" });
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!inView || (state !== "speaking" && state !== "listening")) {
      setLevel(0);
      return;
    }
    let t = 0;
    const id = window.setInterval(() => {
      t += 1;
      // syllable rhythm (~4 Hz) modulated by noise, quieter while listening
      const syllable = Math.abs(Math.sin(t * 0.85)) * (0.55 + Math.random() * 0.45);
      setLevel((state === "speaking" ? 0.9 : 0.6) * syllable);
    }, 110);
    return () => window.clearInterval(id);
  }, [state, inView]);

  return (
    <div ref={ref} className={cn("relative", className)} style={{ width: size, height: size }}>
      {inView && <Orb state={state} level={level} size={size} />}
    </div>
  );
}
