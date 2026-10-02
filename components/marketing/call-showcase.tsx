"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, AudioLines, Car, Check, Gauge, Languages, Moon, SprayCan, Wrench, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { OUTCOMES } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { EASE } from "./reveal";
import { SCENARIOS, type ShowcaseScenario } from "./showcase-data";

const ICONS: Record<ShowcaseScenario["icon"], LucideIcon> = {
  wrench: Wrench,
  car: Car,
  gauge: Gauge,
  shield: SprayCan,
  languages: Languages,
};

export function CallShowcase() {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const scenario = SCENARIOS[active];

  const select = (i: number) => {
    const next = (i + SCENARIOS.length) % SCENARIOS.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") select(active + 1);
    else if (e.key === "ArrowLeft") select(active - 1);
    else if (e.key === "Home") select(0);
    else if (e.key === "End") select(SCENARIOS.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className="mt-14">
      <div className="-mx-6 overflow-x-auto px-6 scrollbar-none">
        <div
          role="tablist"
          aria-label="Cas d'usage"
          onKeyDown={onKeyDown}
          className="mx-auto flex w-max items-center gap-1 rounded-full border border-border bg-card/50 p-1 backdrop-blur"
        >
          {SCENARIOS.map((s, i) => {
            const Icon = ICONS[s.icon];
            const selected = i === active;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabsRef.current[i] = el;
                }}
                id={`tab-${s.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${s.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  "relative inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition-colors",
                  selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="showcase-pill"
                    className="absolute inset-0 rounded-full bg-muted shadow-[inset_0_0_0_1px_var(--border-strong)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className={cn("relative size-3.5", selected && "text-primary")} />
                <span className="relative">{s.tab}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`panel-${scenario.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${scenario.id}`}
        tabIndex={0}
        className="mt-8 rounded-3xl focus-visible:outline-offset-4"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="grid gap-4 lg:grid-cols-[1.3fr_1fr]"
          >
            <TranscriptPanel scenario={scenario} />
            <ResultPanel scenario={scenario} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <LinkButton href="/demo" size="lg" className="group">
          <AudioLines />
          Essayer en direct
          <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
        </LinkButton>
        <p className="text-[13px] text-muted-foreground">Appelez Léa depuis votre navigateur, en 30 secondes.</p>
      </div>
    </div>
  );
}

function TranscriptPanel({ scenario }: { scenario: ShowcaseScenario }) {
  const { context } = scenario;
  return (
    <div className="ring-gradient min-w-0 rounded-2xl bg-card/70 shadow-float backdrop-blur-xl lg:min-h-[560px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="size-8 shrink-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,oklch(0.9_0.08_292),oklch(0.62_0.2_275)_55%,oklch(0.55_0.15_215))] shadow-[0_0_18px_-2px_color-mix(in_oklch,var(--primary)_70%,transparent)]"
          />
          <div className="leading-tight">
            <p className="text-[13.5px] font-medium">Léa · agent Ossian</p>
            <p className="text-xs text-muted-foreground">{context.line}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {context.afterHours && (
            <Badge tone="warning">
              <Moon /> Hors horaires
            </Badge>
          )}
          <Badge tone="neutral" className="font-mono">
            {context.language}
          </Badge>
          <span className="font-mono text-[11px] text-muted-foreground">
            {context.when} · {context.duration}
          </span>
        </div>
      </div>

      <ol className="grid gap-3 p-4 sm:p-5" aria-label="Transcription">
        {scenario.turns.map((t, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 + i * 0.09, ease: EASE }}
            className={cn("flex", t.role === "caller" ? "justify-end" : "justify-start")}
          >
            {t.role === "tool" ? (
              <div className="flex w-full items-center gap-2 py-0.5 pl-1 font-mono text-[11.5px]">
                <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                  <Check className="size-2.5" strokeWidth={3.5} />
                </span>
                <span className="text-primary">{t.name}</span>
                <span className="text-muted-foreground">→</span>
                <span className="min-w-0 truncate text-foreground">{t.result}</span>
                <span aria-hidden className="ml-2 hidden h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--border-strong)_0_4px,transparent_4px_8px)] sm:block" />
              </div>
            ) : (
              <div
                className={cn(
                  "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                  t.role === "agent"
                    ? "rounded-tl-md bg-muted text-foreground"
                    : "rounded-tr-md border border-primary/20 bg-primary-soft text-foreground",
                )}
              >
                <span className="mb-0.5 block text-[10.5px] font-medium text-muted-foreground">
                  {t.role === "agent" ? "Léa · IA" : "Client"}
                </span>
                {t.text}
              </div>
            )}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function ResultPanel({ scenario }: { scenario: ShowcaseScenario }) {
  const { result } = scenario;
  const outcome = OUTCOMES[result.outcome];
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Ce que reçoit votre équipe</p>
        <Badge tone={outcome.tone} dot>
          {outcome.label}
        </Badge>
      </div>

      <h3 className="mt-5 text-xl font-medium tracking-tight text-balance">{result.title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{result.summary}</p>

      <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border">
        {result.data.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] gap-3 bg-card px-3.5 py-2.5 text-[13px] sm:grid-cols-[130px_1fr]">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="min-w-0 font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-5 grid gap-2">
        {result.actions.map((a, i) => (
          <motion.li
            key={a}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.35 + i * 0.1, ease: EASE }}
            className="flex items-center gap-2.5 text-[13.5px]"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
              <Check className="size-3" strokeWidth={3} />
            </span>
            {a}
          </motion.li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Avatar name={result.assignee.name} size={32} />
          <div className="min-w-0 leading-tight">
            <p className="text-[13px] font-medium">Transmis à {result.assignee.name}</p>
            <p className="text-xs text-muted-foreground">{result.assignee.role} · notification + e-mail</p>
          </div>
        </div>
      </div>
    </div>
  );
}
