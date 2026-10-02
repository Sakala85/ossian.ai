"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, Car, Check, CircleAlert, Clock, Loader2, PhoneForwarded, Search, Sparkles, Wrench, PhoneOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { TOOL_LABELS, type ToolName } from "@/lib/agent/tools";
import { cn } from "@/lib/utils";
import type { Entry } from "./types";

const ICONS: Record<string, React.ReactNode> = {
  check_availability: <Clock />,
  book_appointment: <CalendarCheck />,
  get_repair_status: <Wrench />,
  search_inventory: <Search />,
  create_lead: <Sparkles />,
  transfer_call: <PhoneForwarded />,
  schedule_callback: <Clock />,
  end_call: <PhoneOff />,
};

export function toolSummary(name: string, result: unknown): string {
  const r = (result ?? {}) as Record<string, unknown>;
  if (r.error) return String(r.error);
  switch (name) {
    case "check_availability": {
      const slots = (r.slots as { label: string }[] | undefined) ?? [];
      return slots.length ? `${slots.length} créneau${slots.length > 1 ? "x" : ""} · ${slots[0]!.label}` : "Aucun créneau";
    }
    case "book_appointment":
      return `${r.confirmation ?? ""} · ${r.when ?? ""}`;
    case "get_repair_status":
      return r.found ? `${r.reference} · ${r.status}` : "Dossier introuvable";
    case "search_inventory": {
      const res = (r.results as { label: string }[] | undefined) ?? [];
      return res.length ? `${res.length} véhicule(s) · ${res[0]!.label}` : "Aucun résultat";
    }
    case "create_lead":
      return `Score ${r.score} · ${r.assignee}`;
    case "transfer_call":
      return r.status === "ferme" ? `${r.department} fermé` : `→ ${r.department}`;
    case "schedule_callback":
      return `${r.ticket} · ${r.sla}`;
    case "end_call":
      return "Compte-rendu envoyé";
    default:
      return "OK";
  }
}

export function ToolChip({ entry }: { entry: Extract<Entry, { kind: "tool" }> }) {
  const pending = entry.result === undefined;
  return (
    <div className="flex justify-center py-0.5">
      <div
        className={cn(
          "inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-[11.5px] [&_svg]:size-3.5",
          entry.ok === false ? "border-danger/30 bg-danger-soft text-danger" : "border-border bg-subtle text-muted-foreground",
        )}
      >
        <span className={cn("inline-flex", pending ? "text-muted-foreground" : entry.ok === false ? "text-danger" : "text-primary")}>
          {pending ? <Loader2 className="animate-spin" /> : entry.ok === false ? <CircleAlert /> : ICONS[entry.name] ?? <Check />}
        </span>
        <span className="font-medium text-foreground">{TOOL_LABELS[entry.name as ToolName] ?? entry.name}</span>
        {!pending && <span className="truncate font-mono text-[10.5px]">{toolSummary(entry.name, entry.result)}</span>}
      </div>
    </div>
  );
}

export function Transcript({ entries, interim, agentName, className }: { entries: Entry[]; interim?: string; agentName: string; className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll the transcript box only (never the page).
    const el = boxRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [entries, interim]);

  return (
    <div ref={boxRef} className={cn("scrollbar-thin flex flex-col gap-2.5 overflow-y-auto", className)} aria-live="polite">
      {entries.length === 0 && !interim && (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
          <Car className="size-5 opacity-60" />
          La transcription de l&apos;appel s&apos;affichera ici, avec chaque action réalisée par {agentName} dans vos outils.
        </div>
      )}
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.div key={e.id} layout="position" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            {e.kind === "tool" ? (
              <ToolChip entry={e} />
            ) : e.kind === "system" ? (
              <p className={cn("text-center text-xs", e.tone === "error" ? "text-danger" : "text-muted-foreground")}>{e.text}</p>
            ) : (
              <div className={cn("flex", e.kind === "caller" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed",
                    e.kind === "caller" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card text-foreground",
                  )}
                >
                  {e.kind === "agent" && <div className="mb-0.5 text-[10.5px] font-medium tracking-wide text-primary uppercase">{agentName}</div>}
                  {e.text}
                  {e.streaming && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-blink bg-current" />}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {interim && (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-md border border-dashed border-primary/40 px-3.5 py-2 text-[13.5px] text-muted-foreground italic">{interim}…</div>
        </div>
      )}
    </div>
  );
}
