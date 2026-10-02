"use client";

import {
  CalendarCheck,
  CalendarClock,
  CalendarSearch,
  Car,
  ChevronDown,
  Info,
  MessageSquare,
  PhoneForwarded,
  UserPlus,
  UserSearch,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { TranscriptLine } from "@/lib/domain/types";
import { cn, duration } from "@/lib/utils";
import { MiniOrb } from "../mini-orb";

const TOOL_ICONS: Record<string, LucideIcon> = {
  lookup_customer: UserSearch,
  check_availability: CalendarSearch,
  book_appointment: CalendarCheck,
  get_repair_status: Wrench,
  transfer_call: PhoneForwarded,
  schedule_callback: CalendarClock,
  create_lead: UserPlus,
  search_inventory: Car,
  send_sms: MessageSquare,
};

const str = (v: unknown) => (Array.isArray(v) ? v.join(", ") : v === true ? "oui" : v === false ? "non" : String(v ?? ""));

/** One-line "key result" for a tool call. */
function keyResult(tool: NonNullable<TranscriptLine["tool"]>): string | undefined {
  const r = tool.result ?? {};
  switch (tool.name) {
    case "lookup_customer":
      return r.name ? str(r.name) : undefined;
    case "check_availability": {
      const slots = Array.isArray(r.slots) ? (r.slots as unknown[]) : [];
      return slots.length ? `${slots.length} créneaux · ${slots.slice(0, 2).map(str).join(", ")}${slots.length > 2 ? "…" : ""}` : undefined;
    }
    case "book_appointment":
      return r.confirmation ? `Confirmé · ${str(r.confirmation)}` : undefined;
    case "get_repair_status":
      return [r.status, r.ready_at && `prêt à ${str(r.ready_at)}`].filter(Boolean).map(str).join(" · ");
    case "transfer_call":
      return r.agent ? `Connecté · ${str(r.agent)}` : undefined;
    case "schedule_callback":
      return r.callback ? `${str(r.callback)}${r.owner ? ` · ${str(r.owner)}` : ""}` : undefined;
    case "create_lead":
      return r.score ? `Score ${str(r.score)}${r.assignee ? ` · ${str(r.assignee)}` : ""}` : undefined;
    case "search_inventory":
      return r.found ? `En stock · ${str(r.price)}` : "Non trouvé";
    default: {
      const first = Object.values(r)[0];
      return first !== undefined ? str(first) : undefined;
    }
  }
}

export function Transcript({
  lines,
  activeT,
  onSeek,
  partial,
}: {
  lines: TranscriptLine[];
  /** Current playback position; highlights the line being spoken. */
  activeT?: number;
  onSeek?: (t: number) => void;
  partial?: boolean;
}) {
  const activeIndex =
    activeT !== undefined && activeT > 0 ? lines.reduce((acc, l, i) => (l.role !== "tool" && l.t <= activeT ? i : acc), -1) : -1;

  return (
    <div className="grid gap-3">
      {lines.map((l, i) =>
        l.role === "tool" && l.tool ? (
          <ToolChip key={i} line={l} />
        ) : (
          <Bubble key={i} line={l} active={i === activeIndex} onSeek={onSeek} />
        ),
      )}
      {partial && (
        <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border-strong bg-subtle px-3 py-2.5 text-xs text-muted-foreground [&_svg]:mt-px [&_svg]:size-3.5 [&_svg]:shrink-0">
          <Info />
          <span>
            Transcription condensée : seuls les premiers échanges sont conservés pour cet appel. Le résumé et les données extraites
            couvrent l&apos;appel complet, et l&apos;enregistrement reste disponible ci-dessus.
          </span>
        </div>
      )}
    </div>
  );
}

function Bubble({ line, active, onSeek }: { line: TranscriptLine; active: boolean; onSeek?: (t: number) => void }) {
  const agent = line.role === "agent";
  return (
    <div className={cn("flex gap-2.5", agent ? "pr-8 sm:pr-14" : "flex-row-reverse pl-8 sm:pl-14")}>
      {agent ? (
        <MiniOrb size={24} className="mt-5" />
      ) : (
        <span className="mt-5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
          Cl
        </span>
      )}
      <div className={cn("min-w-0", !agent && "flex flex-col items-end")}>
        <div className={cn("mb-1 flex items-center gap-2 text-[11px] text-muted-foreground", !agent && "flex-row-reverse")}>
          <span className="font-medium">{agent ? "Léa" : "Client"}</span>
          <button
            type="button"
            onClick={() => onSeek?.(line.t)}
            className="font-mono tabular transition-colors hover:text-primary"
            title="Écouter depuis ce passage"
          >
            {duration(line.t)}
          </button>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed transition-shadow duration-200",
            agent ? "rounded-tl-md border border-border bg-card text-foreground" : "rounded-tr-md bg-primary-soft text-foreground",
            active && "ring-2 ring-primary/40",
          )}
        >
          {line.text}
        </div>
      </div>
    </div>
  );
}

function ToolChip({ line }: { line: TranscriptLine }) {
  const [open, setOpen] = useState(false);
  const tool = line.tool!;
  const Icon = TOOL_ICONS[tool.name] ?? Zap;
  const result = keyResult(tool);
  return (
    <div className="pl-8.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-subtle py-1 pr-2 pl-1 text-left text-xs transition-colors hover:border-border-strong hover:bg-card"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-card text-primary shadow-soft [&_svg]:size-3">
          <Icon />
        </span>
        <span className="truncate font-medium text-foreground">{line.text}</span>
        {result && (
          <>
            <span className="text-muted-foreground/60">·</span>
            <span className="truncate text-muted-foreground">{result}</span>
          </>
        )}
        <ChevronDown className={cn("size-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1.5 grid gap-2 rounded-lg border border-border bg-card p-3 font-mono text-[11.5px] sm:grid-cols-2">
          <KV title="Entrée" data={tool.input} />
          {tool.result && <KV title="Résultat" data={tool.result} />}
          <div className="text-[10.5px] text-muted-foreground sm:col-span-2">
            {tool.name} · {duration(line.t)}
          </div>
        </div>
      )}
    </div>
  );
}

function KV({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 font-sans text-[10.5px] font-medium tracking-wide text-muted-foreground uppercase">{title}</div>
      <dl className="grid gap-0.5">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">{k}</dt>
            <dd className="min-w-0 break-words text-foreground">{str(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
