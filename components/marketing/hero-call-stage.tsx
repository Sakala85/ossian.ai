"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { CalendarCheck, Check, LoaderCircle, PhoneIncoming, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { OrbState } from "@/components/voice/orb";
import { cn } from "@/lib/utils";
import { useTimeline } from "./hooks";
import { LiveOrb } from "./live-orb";
import { EASE } from "./reveal";

/* Timeline (ms per step)
 * 0 ringing · 1 picked up · 2 agent greets · 3 caller asks · 4 DMS lookup
 * 5 agent proposes · 6 caller accepts · 7 booked · 8 hang up / reset
 */
const DURATIONS = [1100, 700, 2600, 2700, 1500, 2700, 1700, 4200, 800] as const;
const FINAL_STEP = 7;

type Line =
  | { at: number; role: "agent" | "caller"; text: string }
  | { at: number; role: "tool"; name: string; result: string };

const LINES: Line[] = [
  { at: 2, role: "agent", text: "Bonjour, je suis Léa, l'assistante virtuelle de la concession. Comment puis-je vous aider ?" },
  { at: 3, role: "caller", text: "Bonjour, je voudrais faire la révision de ma 3008, elle arrive aux 60 000…" },
  { at: 4, role: "tool", name: "check_availability", result: "3 créneaux" },
  { at: 5, role: "agent", text: "Je vous propose jeudi à 8h30, avec un véhicule de courtoisie. Cela vous convient ?" },
  { at: 6, role: "caller", text: "Parfait, jeudi 8h30." },
  { at: 7, role: "agent", text: "C'est réservé avec Karim. Vous recevez un SMS de confirmation." },
];

const ORB_STATE: OrbState[] = ["idle", "speaking", "speaking", "listening", "thinking", "speaking", "listening", "speaking", "idle"];
const STATUS: string[] = [
  "Appel entrant…",
  "Décroché",
  "Léa parle",
  "Léa écoute",
  "Léa consulte le DMS…",
  "Léa parle",
  "Léa écoute",
  "Léa parle",
  "Appel terminé",
];

export function HeroCallStage() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-80px" });
  const reduce = useReducedMotion();
  const live = useTimeline(DURATIONS, inView && !reduce);
  const step = reduce ? FINAL_STEP : live;

  return (
    <div
      ref={ref}
      className="relative mx-auto mt-14 flex max-w-5xl flex-col items-center gap-5 md:mt-16 lg:mt-12 lg:block lg:h-[500px]"
    >
      {/* Orb */}
      <div className="relative flex flex-col items-center lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
        <div className="relative size-[248px] sm:size-[300px] lg:size-[380px]">
          <div aria-hidden className="absolute inset-[14%] rounded-full bg-primary/25 blur-3xl" />
          <div
            aria-hidden
            className="absolute inset-[-6%] rounded-full border border-border [mask-image:linear-gradient(to_bottom,#000,transparent_85%)]"
          />
          <div
            aria-hidden
            className="absolute inset-[-18%] hidden rounded-full border border-border/60 [mask-image:linear-gradient(to_bottom,#000,transparent_70%)] sm:block"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.6526] sm:scale-[0.7895] lg:scale-100">
            <LiveOrb state={ORB_STATE[step]} size={380} />
          </div>
        </div>
        <div
          className="mt-1 inline-flex h-7 items-center gap-2 rounded-full border border-border bg-card/70 px-3 text-xs text-muted-foreground backdrop-blur lg:-mt-6"
          aria-live="polite"
        >
          <span
            className={cn(
              "size-1.5 rounded-full transition-colors",
              step === 0 || step === 8 ? "bg-muted-foreground" : step === 4 ? "bg-warning" : "bg-success",
            )}
          />
          <span className="tabular">{STATUS[step]}</span>
        </div>
      </div>

      {/* KPI chip */}
      <Float className="absolute top-0 right-0 z-10 sm:right-[6%] lg:top-[7%] lg:right-[4%]" delay={0.6}>
        <Appear show={step >= 1 && step <= 7}>
          <div className="ring-gradient flex items-center gap-2.5 rounded-xl bg-card/80 py-2 pr-3.5 pl-2 shadow-float backdrop-blur-xl">
            <span className="flex size-7 items-center justify-center rounded-lg bg-success-soft text-success">
              <PhoneIncoming className="size-3.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-[10.5px] text-muted-foreground">Appel entrant</span>
              <span className="block text-[13px] font-medium">
                Décroché en <span className="tabular">0,8 s</span>
              </span>
            </span>
          </div>
        </Appear>
      </Float>

      {/* Transcript + tool event */}
      <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center lg:contents">
        <Float className="w-full max-w-[360px] lg:absolute lg:top-1/2 lg:left-0 lg:w-[322px] lg:-translate-y-1/2" delay={0}>
          <TranscriptCard step={step} />
        </Float>
        <Float
          className="hidden w-full max-w-[300px] sm:block lg:absolute lg:right-0 lg:bottom-[9%] lg:w-[292px]"
          delay={1.2}
        >
          <ToolEventCard step={step} />
        </Float>
      </div>
    </div>
  );
}

/** Gentle idle bob for floating cards (disabled with reduced motion via MotionConfig). */
function Float({ className, delay, children }: { className?: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: 7, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

function Appear({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function useCallTimer(running: boolean, reset: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (reset) setSeconds(0);
  }, [reset]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return `00:${String(seconds).padStart(2, "0")}`;
}

function TranscriptCard({ step }: { step: number }) {
  const reduce = useReducedMotion();
  const timer = useCallTimer(!reduce && step >= 1 && step <= 7, step === 0);
  const visible = step === 8 ? [] : LINES.filter((l) => l.at <= step).slice(-4);

  return (
    <div className="ring-gradient overflow-hidden rounded-2xl bg-card/75 text-left shadow-float backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary">
            {step === 0 && <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />}
            <Wrench className="size-3.5" />
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-medium">Atelier · Appel entrant</p>
            <p className="font-mono text-[11px] text-muted-foreground">06 •• •• 77 31</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5">
          <span className={cn("size-1.5 rounded-full", step >= 1 && step <= 7 ? "animate-pulse bg-danger" : "bg-muted-foreground")} />
          <span className="font-mono text-[11px] text-muted-foreground tabular">{step === 0 ? "--:--" : timer}</span>
        </div>
      </div>

      <div className="relative h-[268px] px-3.5 pb-3.5 [mask-image:linear-gradient(to_bottom,transparent,#000_22%)]">
        <motion.ul layout className="flex h-full flex-col justify-end gap-2" aria-label="Transcription de l'appel en cours">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((l) => (
              <motion.li
                key={l.at}
                layout
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.45, ease: EASE }}
                className={cn("flex", l.role === "caller" ? "justify-end" : l.role === "tool" ? "justify-center" : "justify-start")}
              >
                {l.role === "tool" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-2.5 py-1 font-mono text-[10.5px] text-muted-foreground">
                    {step === 4 ? (
                      <LoaderCircle className="size-3 animate-spin text-warning" />
                    ) : (
                      <Check className="size-3 text-success" />
                    )}
                    {l.name} <span className="text-foreground">→ {l.result}</span>
                  </span>
                ) : (
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug",
                      l.role === "agent"
                        ? "rounded-tl-md bg-muted text-foreground"
                        : "rounded-tr-md border border-primary/20 bg-primary-soft text-foreground",
                    )}
                  >
                    <span className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      {l.role === "agent" ? "Léa · IA" : "Client"}
                    </span>
                    {l.role === "agent" ? <Words text={l.text} /> : l.text}
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </div>
  );
}

/** Word-by-word "streamed" text, like a live TTS transcript. */
function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.15 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: i * 0.07 }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}

const SLOTS = ["Jeu 8h30", "Ven 8h00", "Lun 9h15"];

function ToolEventCard({ step }: { step: number }) {
  const visible = step >= 4 && step <= 7;
  const phase = step >= 7 ? "booked" : "slots";

  return (
    <motion.div
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="ring-gradient h-[118px] overflow-hidden rounded-2xl bg-card/80 shadow-float backdrop-blur-xl"
    >
      <AnimatePresence mode="wait" initial={false}>
        {phase === "booked" ? (
          <motion.div
            key="booked"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="flex h-full flex-col justify-between p-4"
          >
            <div className="flex items-start gap-3">
              <motion.span
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-background"
              >
                <Check className="size-4" strokeWidth={3} />
              </motion.span>
              <div className="leading-tight">
                <p className="text-[13.5px] font-medium">RDV créé · jeudi 8h30</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Révision 60 000 km · Karim B.</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2.5 font-mono text-[10.5px] text-muted-foreground">
              <span>RDV-48211</span>
              <span className="text-success">✓ DMS · ✓ SMS</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="slots"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="flex h-full flex-col justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                {step === 4 ? <LoaderCircle className="size-4 animate-spin" /> : <CalendarCheck className="size-4" />}
              </span>
              <div className="leading-tight">
                <p className="text-[13.5px] font-medium">Agenda atelier</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step === 4 ? "Lecture des disponibilités…" : "3 créneaux disponibles"}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {SLOTS.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "flex-1 rounded-md border px-1.5 py-1 text-center font-mono text-[10.5px] transition-colors duration-300",
                    step <= 4
                      ? "animate-pulse border-border bg-muted text-transparent"
                      : step >= 6 && i === 0
                        ? "border-primary/50 bg-primary-soft text-foreground"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
