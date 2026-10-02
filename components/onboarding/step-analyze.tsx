"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building,
  Check,
  Clock,
  Globe,
  Info,
  LoaderCircle,
  PhoneForwarded,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/misc";
import { Orb } from "@/components/voice/orb";
import type { DealershipProfile } from "@/lib/domain/types";
import { ANALYZE_STEPS, type AnalyzeStepId } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";
import { EASE, TOTAL_STEPS, hostOf, plural, summaryParts, type ProfileSource } from "./lib";
import { chipsFromDetail, type AnalysisState, type FoundItem, type StepStatus } from "./use-analyze";

const STEP_ICONS: Record<AnalyzeStepId, typeof Globe> = {
  fetch: Globe,
  identity: Building,
  hours: Clock,
  services: Wrench,
  routing: PhoneForwarded,
  agent: Sparkles,
};

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "running") return <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden />;
  if (status === "done")
    return (
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        className="flex size-5 items-center justify-center rounded-full bg-success-soft text-success"
        aria-hidden
      >
        <Check className="size-3" strokeWidth={3} />
      </motion.span>
    );
  return (
    <span className="flex size-5 items-center justify-center" aria-hidden>
      <span className="size-1.5 rounded-full bg-border-strong" />
    </span>
  );
}

function feedFromProfile(p: DealershipProfile): FoundItem[] {
  const items: FoundItem[] = [
    ...p.brands.slice(0, 6).map((b) => ({ key: `identity:${b}`, step: "identity" as const, text: b })),
    { key: "identity:sites", step: "identity", text: plural(p.sites.length, "site") },
    { key: "hours", step: "hours", text: plural(p.hours.length, "plage horaire", "plages horaires") },
    { key: "services", step: "services", text: plural(p.services.length, "prestation") },
    { key: "routing", step: "routing", text: plural(p.departments.length, "service joignable", "services joignables") },
    { key: "agent", step: "agent", text: `Agent « ${p.agent.name} » prêt` },
  ];
  return items;
}

const STATUS_LABEL: Record<StepStatus, string> = { pending: "en attente", running: "en cours", done: "terminé" };

export function StepAnalyze({
  analysis,
  url,
  ready,
  profile,
  source,
  autoAdvanceMs,
  onContinue,
  onRetry,
  onUseDemo,
  onEditUrl,
}: {
  analysis: AnalysisState;
  url: string;
  ready: boolean;
  profile: DealershipProfile;
  source: ProfileSource | null;
  /** Duration of the pending auto-advance, or null when none is scheduled. */
  autoAdvanceMs: number | null;
  onContinue: () => void;
  onRetry: () => void;
  onUseDemo: () => void;
  onEditUrl: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const restored = analysis.status === "idle" && ready;
  const phase: "running" | "done" | "error" | "empty" =
    analysis.status === "running" ? "running" : analysis.status === "error" ? "error" : analysis.status === "done" || restored ? "done" : "empty";
  const host = hostOf(analysis.url || url || profile.website);

  // Elapsed counter while running.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);
  const elapsed = phase === "running" && analysis.startedAt ? Math.max(0, Math.floor((now - analysis.startedAt) / 1000)) : 0;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const statusOf = (id: AnalyzeStepId): StepStatus => (restored ? "done" : (analysis.steps[id]?.status ?? "pending"));
  const doneCount = ANALYZE_STEPS.filter((s) => statusOf(s.id) === "done").length;
  const runningCount = ANALYZE_STEPS.filter((s) => statusOf(s.id) === "running").length;
  const pct = phase === "done" ? 100 : Math.round(((doneCount + runningCount * 0.45) / ANALYZE_STEPS.length) * 100);
  const found = restored ? feedFromProfile(profile) : analysis.found;
  const mode = analysis.mode ?? (source === "simulated" ? "simulated" : source === "ai" ? "ai" : undefined);

  const title =
    phase === "running" ? (
      <>
        Nous lisons <span className="font-serif-accent">votre site</span>…
      </>
    ) : phase === "done" ? (
      <>
        Analyse <span className="font-serif-accent">terminée</span>.
      </>
    ) : phase === "error" ? (
      "L'analyse n'a pas abouti."
    ) : (
      "Aucune analyse en cours."
    );

  return (
    <div>
      <header className="mb-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        <div className="relative shrink-0">
          <Orb size={112} state={phase === "running" ? "thinking" : "idle"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 font-mono text-xs text-muted-foreground tabular">
            02 <span className="text-border-strong">/</span> {String(TOTAL_STEPS).padStart(2, "0")}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-[32px] font-medium text-balance focus:outline-none sm:text-[40px]">
            {title}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground" aria-live="polite">
            {phase === "running" && (
              <>
                <span className="font-mono text-[13px] text-foreground">{host}</span>
                <span className="mx-2 text-border-strong">·</span>
                <span className="font-mono text-[13px] tabular">{elapsed} s</span>
                <span className="hidden sm:inline"> — généralement moins d&apos;une minute</span>
              </>
            )}
            {phase === "done" && "Toutes les informations restent modifiables à l'étape suivante."}
            {phase === "error" && "Pas d'inquiétude : vous pouvez réessayer ou continuer avec un profil de démonstration."}
            {phase === "empty" && "Revenez à l'étape précédente pour analyser le site de votre concession."}
          </p>
        </div>
      </header>

      <AnimatePresence initial={false} mode="popLayout">
        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="mb-6 rounded-xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="size-4.5" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-foreground">
                  Nous avons trouvé : <span className="tabular">{summaryParts(profile).join(" · ")}</span>
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">Vérifiez-les avant de choisir la voix de votre agent.</p>
                {mode === "simulated" && (
                  <Badge tone="info" className="mt-3">
                    <Info />
                    Mode démo : profil généré sans clé API
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={onContinue} className="relative w-full overflow-hidden sm:w-auto">
                {autoAdvanceMs != null && (
                  <motion.span
                    aria-hidden
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: autoAdvanceMs / 1000, ease: "linear" }}
                    className="absolute inset-0 origin-left bg-primary-foreground/15"
                  />
                )}
                <span className="relative inline-flex items-center gap-2">
                  Vérifier les informations
                  <ArrowRight className="size-4" />
                </span>
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mb-6 rounded-xl border border-border bg-card p-5 shadow-soft"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                <TriangleAlert className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-foreground">Nous n&apos;avons pas pu analyser {host || "ce site"}.</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{analysis.error}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button variant="ghost" onClick={onEditUrl}>
                Modifier l&apos;adresse
              </Button>
              <Button variant="outline" onClick={onRetry}>
                <RotateCcw />
                Réessayer
              </Button>
              <Button onClick={onUseDemo}>
                Continuer avec le profil de démonstration
                <ArrowRight />
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "empty" && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Button variant="outline" onClick={onEditUrl}>
              <ArrowLeft />
              Indiquer mon site web
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {phase !== "empty" && (
        <motion.div layout="position" className="rounded-xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between gap-3 px-5 pt-4 text-xs">
            <span className="truncate font-mono text-muted-foreground">{host}</span>
            <span className="shrink-0 font-mono text-muted-foreground tabular">{pct} %</span>
          </div>
          <div className="px-5 pt-2.5">
            <Progress value={pct} tone={phase === "error" ? "warning" : phase === "done" ? "success" : "primary"} />
          </div>
          <ol className="mt-2 divide-y divide-border px-5 pb-1">
            {ANALYZE_STEPS.map((s) => {
              const status = statusOf(s.id);
              const raw = restored ? undefined : analysis.steps[s.id]?.detail;
              const detail = raw ? chipsFromDetail(s.id, raw).join(" · ") : undefined;
              return (
                <li key={s.id} className="flex items-start gap-3 py-3">
                  <span className="pt-px">
                    <StatusIcon status={status} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm leading-5",
                        status === "running" && "font-medium shimmer-text",
                        status === "done" && "text-foreground",
                        status === "pending" && "text-muted-foreground",
                      )}
                    >
                      {s.label}
                      <span className="sr-only"> — {STATUS_LABEL[status]}</span>
                    </p>
                    <AnimatePresence initial={false}>
                      {detail && status === "done" && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.25, ease: EASE }}
                          className="overflow-hidden text-xs text-muted-foreground"
                        >
                          <span className="block pt-0.5">{detail}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ol>
        </motion.div>
      )}

      {phase !== "empty" && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Trouvé sur votre site</p>
            <span className="font-mono text-xs text-muted-foreground tabular">{found.length}</span>
          </div>
          <ul className="flex min-h-8 flex-wrap gap-2" aria-live="polite">
            <AnimatePresence initial={false}>
              {found.map((f) => {
                const Icon = STEP_ICONS[f.step];
                return (
                  <motion.li
                    key={f.key}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="inline-flex h-8 max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 text-[13px] text-foreground shadow-soft"
                  >
                    <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
                    <span className="truncate">{f.text}</span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {phase === "running" &&
              Array.from({ length: found.length ? 1 : 3 }).map((_, i) => (
                <li key={`sk-${i}`} aria-hidden className="h-8 animate-pulse rounded-full bg-muted" style={{ width: [96, 128, 84][i] }} />
              ))}
          </ul>
        </div>
      )}

      {phase === "running" && (
        <div className="mt-10 border-t border-border pt-6">
          <Button variant="ghost" onClick={onEditUrl}>
            <ArrowLeft />
            Modifier l&apos;adresse
          </Button>
        </div>
      )}
    </div>
  );
}
