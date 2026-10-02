"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Check, Globe, Play, ScanLine } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTicker } from "./hooks";
import { EASE } from "./reveal";

/* ------------------------------------------------------------------ */
/*  Step 1 — URL scan                                                  */
/* ------------------------------------------------------------------ */

const URL_TEXT = "www.votre-concession.fr";
const FOUND = [
  { label: "Horaires", value: "atelier, showroom, pièces" },
  { label: "Marques", value: "3 détectées" },
  { label: "Prestations", value: "14 avec tarifs" },
  { label: "Services & contacts", value: "6 départements" },
];
// ticks of 70ms
const T_SCAN = URL_TEXT.length + 6;
const T_ITEMS = T_SCAN + 18;
const T_TOTAL = T_ITEMS + FOUND.length * 7 + 40;

export function UrlScanMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-60px" });
  const reduce = useReducedMotion();
  const live = useTicker(70, T_TOTAL, inView && !reduce);
  const tick = reduce ? T_TOTAL - 1 : live;

  const typed = URL_TEXT.slice(0, Math.min(tick, URL_TEXT.length));
  const scanning = tick >= T_SCAN && tick < T_ITEMS + FOUND.length * 7;
  const found = tick < T_ITEMS ? 0 : Math.min(FOUND.length, Math.floor((tick - T_ITEMS) / 7) + 1);

  return (
    <div ref={ref} className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2 rounded-[10px] border border-input bg-background/60 py-1.5 pr-1.5 pl-3">
        <Globe className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-mono text-[12px]">
          <span className="text-muted-foreground">https://</span>
          {typed}
          {tick < T_SCAN && <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 animate-blink bg-foreground" />}
        </span>
        <span
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors",
            tick >= T_SCAN ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <ScanLine className="size-3" />
          Analyser
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-[10px] border border-border bg-background/40 p-3">
        {scanning && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-primary/15 to-transparent"
            initial={{ top: "-20%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
          />
        )}
        <ul className="relative grid gap-2">
          {FOUND.map((f, i) => (
            <li key={f.label} className="flex items-center gap-2 text-[12px]">
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  i < found ? "bg-success text-background" : "bg-muted",
                )}
              >
                {i < found && <Check className="size-2.5" strokeWidth={3.5} />}
              </span>
              <span className={cn("transition-colors duration-300", i < found ? "text-foreground" : "text-muted-foreground/60")}>
                {f.label}
              </span>
              <span className="ml-auto truncate text-muted-foreground">
                {i < found ? f.value : <span className="inline-block h-2 w-16 animate-pulse rounded bg-muted align-middle" />}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Agent validation                                          */
/* ------------------------------------------------------------------ */

export function AgentConfigMock() {
  const [rules, setRules] = useState({ transfer: true, sms: true, record: false });
  const toggle = (k: keyof typeof rules) => setRules((r) => ({ ...r, [k]: !r[k] }));

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3 rounded-[10px] border border-border bg-background/40 p-2.5">
        <span
          aria-hidden
          className="size-8 shrink-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,oklch(0.9_0.08_292),oklch(0.62_0.2_275)_55%,oklch(0.55_0.15_215))] shadow-[0_0_18px_-2px_color-mix(in_oklch,var(--primary)_70%,transparent)]"
        />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[12.5px] font-medium">Léa</p>
          <p className="truncate text-[11px] text-muted-foreground">Voix chaleureuse · FR, EN, ES, AR +26</p>
        </div>
        <span className="flex h-6 items-end gap-[2px]" aria-hidden>
          {[0.5, 0.9, 0.6, 1, 0.4, 0.8, 0.55].map((h, i) => (
            <motion.span
              key={i}
              className="w-[2px] rounded-full bg-primary"
              animate={{ height: [`${h * 40}%`, `${h * 100}%`, `${h * 40}%`] }}
              transition={{ duration: 0.9 + i * 0.07, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </span>
        <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Play className="size-3" />
        </span>
      </div>

      <ul className="grid gap-2 rounded-[10px] border border-border bg-background/40 p-2.5">
        {(
          [
            ["transfer", "Transfert à l'atelier en heures ouvrées"],
            ["sms", "SMS de confirmation au client"],
            ["record", "Enregistrement des appels"],
          ] as const
        ).map(([k, label]) => (
          <li key={k} className="flex items-center justify-between gap-3 text-[12px]">
            <span className={rules[k] ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            <Switch checked={rules[k]} onCheckedChange={() => toggle(k)} label={label} className="scale-[0.85]" />
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <Badge tone="success" dot>
          DMS connecté
        </Badge>
        <Badge tone="neutral">Agenda atelier</Badge>
        <Badge tone="neutral">CRM</Badge>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Call forwarding                                           */
/* ------------------------------------------------------------------ */

const MODES = [
  { key: "noanswer", label: "Non-réponse", code: "**61*", hint: "Ossian décroche après 3 sonneries" },
  { key: "busy", label: "Occupé", code: "**67*", hint: "Ossian prend le relais si la ligne est occupée" },
  { key: "always", label: "Toujours", code: "**21*", hint: "Ossian répond à tous les appels, 24h/24" },
] as const;

export function ForwardingMock() {
  const [mode, setMode] = useState<(typeof MODES)[number]["key"]>("noanswer");
  const m = MODES.find((x) => x.key === mode)!;

  return (
    <div className="flex h-full flex-col gap-3">
      <div role="group" aria-label="Type de renvoi d'appel" className="grid grid-cols-3 gap-0.5 rounded-[10px] border border-border bg-muted p-0.5">
        {MODES.map((x) => (
          <button
            key={x.key}
            type="button"
            aria-pressed={mode === x.key}
            onClick={() => setMode(x.key)}
            className={cn(
              "h-7 rounded-lg text-[11.5px] font-medium transition-all",
              mode === x.key
                ? "bg-card text-foreground shadow-[0_1px_2px_0_oklch(0_0_0/20%),0_0_0_1px_var(--border)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center rounded-[10px] border border-border bg-background/40 px-3 py-3 text-center">
        <p className="text-[10.5px] tracking-wide text-muted-foreground uppercase">Composez depuis votre ligne</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={m.code}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="mt-1.5 font-mono text-[17px] font-medium tracking-tight sm:text-lg"
          >
            <span className="text-primary">{m.code}</span>01 99 00 12 34<span className="text-primary">#</span>
          </motion.p>
        </AnimatePresence>
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">{m.hint}</p>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11.5px]">
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <span className="relative inline-flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Agent en ligne
        </span>
        <span className="text-muted-foreground">ou numéro dédié</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Connecting beam between steps                                      */
/* ------------------------------------------------------------------ */

export function StepsBeam() {
  return (
    <div aria-hidden className="pointer-events-none absolute top-5 right-0 left-5 hidden h-px overflow-hidden md:block">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--border-strong)_0%,var(--border-strong)_80%,transparent)]" />
      <motion.div
        className="absolute top-1/2 h-px w-28 -translate-y-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
        initial={{ left: "-10%" }}
        animate={{ left: "100%" }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8 }}
      />
    </div>
  );
}
