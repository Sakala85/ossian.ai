"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Check, MessageSquare, Phone, PhoneOutgoing, Send, Sparkles } from "lucide-react";
import { useRef } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { useCycle } from "./hooks";
import { EASE } from "./reveal";

const VIEW = { once: true, margin: "0px 0px -10% 0px" } as const;

/** Small "app window" frame used by every bento mock. */
function Window({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/90 shadow-float backdrop-blur", className)}>{children}</div>
  );
}

/* ------------------------------------------------------------------ */
/*  1 · Workshop calendar                                              */
/* ------------------------------------------------------------------ */

const DAYS = ["Lun 5", "Mar 6", "Mer 7", "Jeu 8", "Ven 9"];
const HOURS = ["8h", "9h", "10h", "11h"];
const ROW = 34;
const BUSY = [
  { d: 0, s: 0, h: 1, label: "Vidange · 208" },
  { d: 0, s: 1.5, h: 2, label: "Freinage · C3" },
  { d: 1, s: 0.5, h: 1.5, label: "Diag. · Yaris" },
  { d: 1, s: 2.5, h: 1.25, label: "Pneus ×4" },
  { d: 2, s: 0, h: 2, label: "Révision · C5" },
  { d: 2, s: 2.5, h: 1, label: "Batterie" },
  { d: 3, s: 2, h: 1.5, label: "Clim · 2008" },
  { d: 4, s: 0, h: 1, label: "Géométrie" },
  { d: 4, s: 1.25, h: 2.5, label: "Distribution" },
];

export function CalendarMock() {
  return (
    <div className="grid h-full gap-3 sm:grid-cols-[1fr_200px]">
      <Window className="flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <p className="text-[12px] font-medium">
            Atelier <span className="text-muted-foreground">· semaine 41</span>
          </p>
          <Badge tone="success" dot className="h-5 text-[10.5px]">
            Synchronisé DMS
          </Badge>
        </div>
        <div className="grid flex-1 grid-cols-[28px_repeat(5,1fr)] px-2 pt-1.5 pb-2">
          <div />
          {DAYS.map((d, i) => (
            <p key={d} className={cn("pb-1.5 text-center text-[10.5px]", i === 3 ? "font-medium text-primary" : "text-muted-foreground")}>
              {d}
            </p>
          ))}
          <div className="relative" style={{ height: ROW * HOURS.length }}>
            {HOURS.map((h, i) => (
              <span key={h} className="absolute right-1.5 font-mono text-[9.5px] text-muted-foreground" style={{ top: i * ROW - 5 }}>
                {h}
              </span>
            ))}
          </div>
          {DAYS.map((d, di) => (
            <div
              key={d}
              className="relative border-l border-border bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_33px,var(--border)_33px,var(--border)_34px)]"
              style={{ height: ROW * HOURS.length }}
            >
              {BUSY.filter((b) => b.d === di).map((b) => (
                <div
                  key={b.label}
                  className="absolute inset-x-0.5 overflow-hidden rounded-[5px] border border-border bg-muted px-1 py-0.5 text-[9.5px] leading-tight text-muted-foreground"
                  style={{ top: b.s * ROW + 1, height: b.h * ROW - 3 }}
                >
                  <span className="hidden truncate sm:block">{b.label}</span>
                </div>
              ))}
              {di === 3 && (
                <motion.div
                  className="absolute inset-x-0.5 z-10 overflow-hidden rounded-[5px] border border-primary/60 bg-primary-soft px-1 py-0.5 text-[9.5px] leading-tight text-foreground shadow-[0_0_24px_-4px_color-mix(in_oklch,var(--primary)_70%,transparent)]"
                  style={{ top: 0.5 * ROW + 1, height: 1.25 * ROW - 3 }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={VIEW}
                  transition={{ duration: 0.5, delay: 0.7, ease: EASE }}
                >
                  <span className="block truncate font-medium">Révision</span>
                  <span className="hidden truncate text-muted-foreground sm:block">3008 · Karim B.</span>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </Window>

      <Window className="hidden flex-col p-3 sm:flex">
        <div className="flex items-center gap-1.5 text-[11px] text-primary">
          <Sparkles className="size-3" />
          Réservé par Ossian
        </div>
        <p className="mt-1.5 text-[13px] font-medium">Jeudi 8h30 · Révision</p>
        <dl className="mt-3 grid gap-1.5 text-[11px]">
          {[
            ["Client", "N. Garnier"],
            ["Véhicule", "3008 Hybrid"],
            ["Km", "61 200"],
            ["Conseiller", "Karim B."],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="truncate">{v}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-auto grid gap-1.5 border-t border-border pt-2.5 text-[11px]">
          {["Véhicule de courtoisie", "SMS de confirmation"].map((t, i) => (
            <motion.li
              key={t}
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={VIEW}
              transition={{ duration: 0.4, delay: 1.1 + i * 0.2, ease: EASE }}
            >
              <Check className="size-3 text-success" strokeWidth={3} />
              {t}
            </motion.li>
          ))}
        </ul>
      </Window>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  2 · Lead qualification                                             */
/* ------------------------------------------------------------------ */

export function LeadMock() {
  const R = 19;
  return (
    <Window className="mx-auto flex h-full max-w-[340px] flex-col p-3.5">
      <div className="flex items-center gap-3">
        <Avatar name="Thomas Lefèvre" size={34} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[13px] font-medium">Thomas L.</p>
          <p className="text-[11px] text-muted-foreground">Appel entrant · il y a 3 min</p>
        </div>
        <div className="relative size-12" role="img" aria-label="Score du lead : 86 sur 100">
          <svg viewBox="0 0 48 48" className="size-12 -rotate-90">
            <circle cx="24" cy="24" r={R} fill="none" stroke="var(--muted)" strokeWidth="4" />
            <motion.circle
              cx="24"
              cy="24"
              r={R}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 0.86 }}
              viewport={VIEW}
              transition={{ duration: 1.3, delay: 0.3, ease: EASE }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-semibold tabular">86</span>
        </div>
      </div>
      <dl className="mt-3.5 grid gap-1.5 border-t border-border pt-3 text-[11.5px]">
        {[
          ["Intérêt", "Peugeot E-3008 GT"],
          ["Reprise", "Golf 7 · 2018 · 98 000 km"],
          ["Budget", "≈ 45 000 € · LOA"],
          ["Essai", "Samedi 10h"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="truncate text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <Badge tone="primary">Lead chaud · VN</Badge>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <ArrowRight className="size-3" /> Inès F. · CRM
        </span>
      </div>
    </Window>
  );
}

/* ------------------------------------------------------------------ */
/*  3 · Warm transfer                                                  */
/* ------------------------------------------------------------------ */

export function TransferMock() {
  return (
    <div className="mx-auto flex h-full max-w-[340px] flex-col gap-3">
      <div className="flex items-center justify-between gap-1 px-1">
        <Node label="Client">
          <Phone className="size-3.5" />
        </Node>
        <Wire />
        <span className="flex size-10 items-center justify-center rounded-xl border border-border-strong bg-card shadow-float">
          <LogoMark className="size-6" />
        </span>
        <Wire delay={0.9} />
        <Node label="Atelier">
          <Avatar name="Sophie Martin" size={26} />
        </Node>
      </div>
      <Window className="flex-1 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-medium">Fiche contexte</p>
          <Badge tone="info" className="h-5 text-[10.5px]">
            Transfert chaud
          </Badge>
        </div>
        <dl className="mt-2.5 grid gap-1.5 text-[11.5px]">
          {[
            ["Motif", "Bruit au freinage"],
            ["Client", "Connu · 4 passages"],
            ["Véhicule", "Clio V · 2021"],
            ["Urgence", "À voir sous 48 h"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="truncate">{v}</dd>
            </div>
          ))}
        </dl>
      </Window>
    </div>
  );
}

function Node({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        {children}
      </span>
      <span className="text-[10.5px] text-muted-foreground">{label}</span>
    </span>
  );
}

function Wire({ delay = 0 }: { delay?: number }) {
  return (
    <span className="relative mb-5 h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--border-strong)_0_4px,transparent_4px_8px)]">
      <motion.span
        className="absolute inset-0"
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 1.8, delay, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      >
        <span className="absolute top-1/2 right-0 size-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_2px_color-mix(in_oklch,var(--primary)_60%,transparent)]" />
      </motion.span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  4 · Languages                                                      */
/* ------------------------------------------------------------------ */

const HELLOS = [
  { w: "Bonjour", l: "Français", code: "FR" },
  { w: "Hello", l: "English", code: "EN" },
  { w: "Hola", l: "Español", code: "ES" },
  { w: "Ciao", l: "Italiano", code: "IT" },
  { w: "Hallo", l: "Deutsch", code: "DE" },
  { w: "مرحبا", l: "العربية", code: "AR", rtl: true },
  { w: "Olá", l: "Português", code: "PT" },
  { w: "Merhaba", l: "Türkçe", code: "TR" },
];

export function LanguagesMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const i = useCycle(HELLOS.length, 1700, inView && !reduce);
  const h = HELLOS[i];

  return (
    <div ref={ref} className="relative flex h-full flex-col items-center justify-center overflow-hidden">
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        {[1, 2, 3].map((k) => (
          <span key={k} className="absolute rounded-full border border-border" style={{ width: 90 + k * 70, height: 90 + k * 70 }} />
        ))}
      </div>
      <div className="relative flex h-[84px] items-center justify-center" aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={h.w}
            dir={h.rtl ? "rtl" : undefined}
            lang={h.code.toLowerCase()}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: EASE }}
            className={cn("text-[54px] leading-none", h.rtl ? "font-sans font-medium" : "font-serif-accent")}
          >
            {h.w}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="relative mt-2 font-mono text-[11px] text-muted-foreground">
        Langue détectée · <span className="text-foreground">{h.l}</span>
      </p>
      <div className="relative mt-5 flex flex-wrap justify-center gap-1">
        {HELLOS.map((x, k) => (
          <span
            key={x.code}
            className={cn(
              "rounded-md border px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-300",
              k === i ? "border-primary/50 bg-primary-soft text-foreground" : "border-border text-muted-foreground",
            )}
          >
            {x.code}
          </span>
        ))}
        <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">+22</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  5 · Multi-site                                                     */
/* ------------------------------------------------------------------ */

const SITES = [
  { name: "Concession Lyon Est", brands: "Peugeot · Citroën", calls: 42 },
  { name: "Atelier Villeurbanne", brands: "Toyota", calls: 31 },
  { name: "Occasions Bron", brands: "Toutes marques", calls: 18 },
];

export function MultiSiteMock() {
  return (
    <Window className="mx-auto flex h-full max-w-[340px] flex-col p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium">Vue groupe</p>
        <span className="font-mono text-[10.5px] text-muted-foreground">3 sites · aujourd&apos;hui</span>
      </div>
      <ul className="mt-3 grid gap-3">
        {SITES.map((s, i) => (
          <li key={s.name}>
            <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
              <span className="truncate">
                {s.name} <span className="text-muted-foreground">· {s.brands}</span>
              </span>
              <span className="font-mono text-muted-foreground tabular">{s.calls}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-[color-mix(in_oklch,var(--primary)_75%,var(--foreground))]"
                initial={{ width: 0 }}
                whileInView={{ width: `${(s.calls / 42) * 100}%` }}
                viewport={VIEW}
                transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: EASE }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        {[
          ["91", "appels"],
          ["100 %", "décrochés"],
          ["27", "RDV"],
        ].map(([v, l]) => (
          <div key={l}>
            <p className="font-mono text-[13px] font-medium tabular">{v}</p>
            <p className="text-[10.5px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
    </Window>
  );
}

/* ------------------------------------------------------------------ */
/*  6 · Outbound campaigns                                             */
/* ------------------------------------------------------------------ */

const CAMPAIGNS = [
  { name: "Rappels d'entretien", meta: "412 clients", result: "38 % de RDV", progress: 72, icon: PhoneOutgoing },
  { name: "Relances de devis", meta: "96 devis", result: "41 % acceptés", progress: 100, icon: Send },
  { name: "Satisfaction J+3", meta: "230 clients", result: "4,7 / 5", progress: 54, icon: MessageSquare },
  { name: "No-show de la veille", meta: "18 RDV", result: "61 % reprogrammés", progress: 33, icon: PhoneOutgoing },
];

export function OutboundMock() {
  return (
    <Window className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <p className="text-[12px] font-medium">Campagnes</p>
        <div className="flex gap-1">
          {["Voix", "SMS", "WhatsApp"].map((c) => (
            <span key={c} className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {c}
            </span>
          ))}
        </div>
      </div>
      <ul className="grid flex-1 content-around px-3.5 py-2">
        {CAMPAIGNS.map((c, i) => (
          <li key={c.name} className="grid grid-cols-[22px_1fr_auto] items-center gap-x-2.5 gap-y-1">
            <span className="row-span-2 flex size-[22px] items-center justify-center rounded-md bg-muted text-muted-foreground">
              <c.icon className="size-3" />
            </span>
            <span className="truncate text-[11.5px]">
              {c.name} <span className="text-muted-foreground">· {c.meta}</span>
            </span>
            <span className="text-right font-mono text-[10.5px] text-foreground">{c.result}</span>
            <span className="col-span-2 h-1 overflow-hidden rounded-full bg-muted">
              <motion.span
                className={cn("block h-full rounded-full", c.progress === 100 ? "bg-success" : "bg-primary")}
                initial={{ width: 0 }}
                whileInView={{ width: `${c.progress}%` }}
                viewport={VIEW}
                transition={{ duration: 1.1, delay: 0.2 + i * 0.12, ease: EASE }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Window>
  );
}

/* ------------------------------------------------------------------ */
/*  7 · Dashboard & transcripts                                        */
/* ------------------------------------------------------------------ */

const SERIES = [38, 44, 41, 52, 49, 61, 58, 55, 67, 72, 64, 78, 83, 80];

function sparkPath(values: number[], w: number, h: number) {
  const max = Math.max(...values);
  const min = Math.min(...values) * 0.8;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - ((v - min) / (max - min)) * (h - 6) - 3] as const);
  // smooth with cubic segments
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return { line: d, area: `${d} L ${w} ${h} L 0 ${h} Z` };
}

export function DashboardMock() {
  const W = 300;
  const H = 64;
  const { line, area } = sparkPath(SERIES, W, H);

  return (
    <Window className="flex h-full flex-col overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          ["Appels", "1 284"],
          ["Traités par l'IA", "94 %"],
          ["RDV pris", "312"],
        ].map(([l, v]) => (
          <div key={l} className="px-3 py-2">
            <p className="truncate text-[10.5px] text-muted-foreground">{l}</p>
            <p className="font-mono text-[14px] font-medium tabular">{v}</p>
          </div>
        ))}
      </div>
      <div className="px-3 pt-2">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-16 w-full" aria-hidden>
          <defs>
            <linearGradient id="mkt-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--chart-1)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={area}
            fill="url(#mkt-spark)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={VIEW}
            transition={{ duration: 0.8, delay: 0.9 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={VIEW}
            transition={{ duration: 1.6, ease: EASE }}
          />
        </svg>
      </div>
      <ul className="mt-auto grid gap-1.5 border-t border-border px-3 py-2.5 text-[11px]">
        <li className="flex gap-2">
          <span className="w-9 shrink-0 font-mono text-muted-foreground">00:21</span>
          <span className="truncate">
            <span className="text-primary">Léa</span> · Je vous propose jeudi 8h30 avec un véhicule…
          </span>
        </li>
        <li className="flex gap-2">
          <span className="w-9 shrink-0 font-mono text-muted-foreground">00:30</span>
          <span className="truncate">
            <span className="text-muted-foreground">Client</span> · Jeudi 8h30 c&apos;est parfait.
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-9 shrink-0" />
          <Badge tone="success" className="h-5 text-[10.5px]">
            RDV pris
          </Badge>
          <Badge tone="neutral" className="h-5 text-[10.5px]">
            Sentiment positif
          </Badge>
        </li>
      </ul>
    </Window>
  );
}
