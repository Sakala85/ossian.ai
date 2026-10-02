"use client";

import { useEffect, useState } from "react";

/**
 * Steps through a looping timeline. `durations[i]` is how long step `i` lasts (ms).
 * Pauses (keeping its current step) while `active` is false.
 */
export function useTimeline(durations: readonly number[], active: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % durations.length), durations[step]);
    return () => window.clearTimeout(id);
  }, [step, active, durations]);
  return step;
}

/** Cycles an index 0..length-1 every `interval` ms while `active`. */
export function useCycle(length: number, interval: number, active: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % length), interval);
    return () => window.clearInterval(id);
  }, [length, interval, active]);
  return index;
}

/** Monotonic tick counter (resets to 0 after `max`) while `active`. */
export function useTicker(interval: number, max: number, active: boolean) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % max), interval);
    return () => window.clearInterval(id);
  }, [interval, max, active]);
  return tick;
}
