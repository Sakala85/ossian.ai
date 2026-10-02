"use client";

import { Clock, Flame, Globe, Megaphone, MessageSquare, PhoneIncoming, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import type { Lead } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { age } from "../format";
import { ScoreRing } from "./score-ring";

export const SOURCE_ICONS: Record<Lead["source"], LucideIcon> = {
  "appel entrant": PhoneIncoming,
  campagne: Megaphone,
  "site web": Globe,
  SMS: MessageSquare,
};

export function LeadCard({
  lead,
  now,
  onOpen,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead;
  now: string;
  onOpen: () => void;
  dragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}) {
  const SourceIcon = SOURCE_ICONS[lead.source];
  const hot = lead.score >= 75 && (lead.stage === "nouveau" || lead.stage === "contacte");
  const closed = lead.stage === "gagne" || lead.stage === "perdu";
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        "group w-full cursor-grab rounded-lg border border-border bg-card p-3 text-left shadow-soft transition-[border-color,box-shadow,opacity,transform] hover:border-border-strong hover:shadow-[0_6px_20px_-10px_hsl(var(--shadow-color)/0.3)] active:cursor-grabbing",
        dragging && "rotate-1 opacity-50",
        lead.stage === "perdu" && "opacity-70",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-foreground">{lead.name}</span>
            {hot && <Flame className="size-3.5 shrink-0 text-primary" aria-label="Lead chaud" />}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.vehicle}</p>
        </div>
        <ScoreRing score={lead.score} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex h-5 items-center rounded-md border border-border bg-subtle px-1.5 text-[11px] font-medium text-muted-foreground">
          {lead.interest}
        </span>
        {lead.budget && (
          <span className="text-xs text-foreground tabular">
            {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(lead.budget)} €
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        <Avatar name={lead.assignee} size={18} />
        <span className="inline-flex min-w-0 items-center gap-1 [&_svg]:size-3 [&_svg]:shrink-0" title={`Source : ${lead.source}`}>
          <SourceIcon />
          <span className="truncate capitalize">{lead.source}</span>
        </span>
        <span className={cn("ml-auto inline-flex shrink-0 items-center gap-1 tabular [&_svg]:size-3", !closed && hot && "text-primary")}>
          <Clock /> {age(lead.createdAt, now)}
        </span>
      </div>
    </button>
  );
}
