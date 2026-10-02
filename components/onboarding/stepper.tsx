"use client";

import { Check, Clock, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS, TOTAL_STEPS, type StepId } from "./lib";

type Visual = "done" | "current" | "todo" | "skipped";

function Marker({ visual, n }: { visual: Visual; n: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] transition-[background-color,border-color,color,box-shadow] duration-300",
        visual === "done" && "bg-primary text-primary-foreground",
        visual === "current" && "border border-primary bg-card text-primary shadow-[0_0_0_4px_var(--primary-soft)]",
        visual === "todo" && "border border-border bg-card text-muted-foreground",
        visual === "skipped" && "border border-dashed border-border-strong bg-card text-muted-foreground",
      )}
    >
      {visual === "done" ? <Check className="size-3.5" strokeWidth={2.5} /> : visual === "skipped" ? <Minus className="size-3" /> : n}
    </span>
  );
}

/** Vertical stepper (desktop). Completed steps are clickable to go back. */
export function Stepper({
  step,
  maxStep,
  skippedAnalysis,
  live,
  onSelect,
}: {
  step: StepId;
  maxStep: StepId;
  skippedAnalysis: boolean;
  live: boolean;
  onSelect: (s: StepId) => void;
}) {
  const eta = STEPS.find((s) => s.id === step)?.eta;
  return (
    <nav aria-label="Étapes de configuration">
      <p className="mb-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Configuration</p>
      <ol className="relative">
        {STEPS.map((s, i) => {
          const skipped = skippedAnalysis && s.id === 2;
          const visual: Visual = live ? "done" : skipped ? "skipped" : s.id === step ? "current" : s.id < step ? "done" : "todo";
          const reachable = !live && !skipped && s.id !== step && s.id <= maxStep;
          const lineDone = live || s.id < step;
          return (
            <li key={s.id} className="relative pb-7 last:pb-0">
              {i < STEPS.length - 1 && (
                <span aria-hidden className="absolute top-7 bottom-1 left-[11.5px] w-px bg-border">
                  <span
                    className={cn("block h-full w-full origin-top bg-primary/70 transition-transform duration-500", lineDone ? "scale-y-100" : "scale-y-0")}
                  />
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                disabled={!reachable}
                aria-current={s.id === step && !live ? "step" : undefined}
                className={cn("group flex w-full items-start gap-3 rounded-lg text-left", reachable ? "cursor-pointer" : "cursor-default")}
              >
                <Marker visual={visual} n={s.id} />
                <span className="min-w-0 pt-[3px]">
                  <span
                    className={cn(
                      "block text-[13px] leading-[18px] font-medium transition-colors",
                      visual === "current" || visual === "done" ? "text-foreground" : "text-muted-foreground",
                      reachable && "group-hover:text-primary",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{skipped ? "Ignorée — sans site web" : s.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {!live && eta && (
        <p className="mt-8 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          Encore ~{eta}
        </p>
      )}
    </nav>
  );
}

/** Compact horizontal progress (mobile / tablet). */
export function MobileProgress({ step, live }: { step: StepId; live: boolean }) {
  const current = STEPS.find((s) => s.id === step)!;
  return (
    <div className="sticky top-14 z-20 border-b border-border bg-background/85 backdrop-blur-md lg:hidden">
      <div className="mx-auto max-w-[720px] px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate font-medium text-foreground">{live ? "Agent en ligne" : current.label}</span>
          <span className="shrink-0 font-mono text-muted-foreground tabular">
            {live ? "Terminé" : `Étape ${step} sur ${TOTAL_STEPS}`}
          </span>
        </div>
        <div
          className="mt-2 grid grid-cols-6 gap-1"
          role="progressbar"
          aria-label="Progression"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
        >
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={cn(
                "h-1 rounded-full transition-colors duration-300",
                live || s.id < step ? "bg-primary" : s.id === step ? "bg-primary/45" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
