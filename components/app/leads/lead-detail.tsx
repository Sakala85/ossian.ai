"use client";

import { ArrowUpRight, Check, Mail, MessageSquare, Phone, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/domain/types";
import { cn, euro } from "@/lib/utils";
import { fmtDayLong, fmtTime, siteShort } from "../format";
import { OverlayHeader } from "../overlay";
import { useShell } from "../shell-context";
import { SOURCE_ICONS } from "./lead-card";
import { ScoreRing } from "./score-ring";

function factors(lead: Lead) {
  const note = lead.note.toLowerCase();
  return [
    { label: "Budget exprimé", ok: !!lead.budget },
    { label: "Véhicule précis identifié", ok: !lead.vehicle.toLowerCase().includes("occasion ·") || lead.interest === "VO" },
    { label: "Reprise à estimer", ok: note.includes("reprise") },
    { label: "Essai ou visite demandé", ok: note.includes("essai") || note.includes("visite") || lead.stage === "essai" },
    { label: "Financement évoqué", ok: note.includes("loa") || note.includes("lld") || note.includes("financement") },
  ];
}

export function LeadDetail({
  lead,
  callId,
  onClose,
  onStage,
}: {
  lead: Lead;
  callId?: string;
  onClose: () => void;
  onStage: (s: LeadStage) => void;
}) {
  const { toast } = useShell();
  const SourceIcon = SOURCE_ICONS[lead.source];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <OverlayHeader
        title={lead.name}
        description={
          <span className="inline-flex items-center gap-1.5">
            {lead.interest} · {lead.vehicle}
          </span>
        }
        onClose={onClose}
      />
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
          <ScoreRing score={lead.score} size={52} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium">Score de qualification</p>
            <p className="text-xs text-muted-foreground">Calculé par Léa à partir de la conversation et de l&apos;historique client.</p>
          </div>
        </div>

        <ul className="mt-3 grid gap-1.5 text-[13px] sm:grid-cols-2">
          {factors(lead).map((f) => (
            <li key={f.label} className="flex items-center gap-2 [&_svg]:size-3.5">
              <span
                className={cn(
                  "inline-flex size-4.5 items-center justify-center rounded-full",
                  f.ok ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
                )}
              >
                {f.ok ? <Check /> : <X />}
              </span>
              <span className={f.ok ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid gap-1.5">
          <label htmlFor="lead-stage" className="text-xs font-medium text-muted-foreground">
            Étape du pipeline
          </label>
          <Select id="lead-stage" value={lead.stage} onChange={(e) => onStage(e.target.value as LeadStage)} className="h-9">
            {(Object.keys(LEAD_STAGES) as LeadStage[]).map((s) => (
              <option key={s} value={s}>
                {LEAD_STAGES[s]}
              </option>
            ))}
          </Select>
        </div>

        <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border text-[13px]">
          {[
            ["Téléphone", <span key="p" className="font-mono">{lead.phone}</span>],
            ["E-mail", lead.email ?? <span key="e" className="text-muted-foreground">Non renseigné</span>],
            ["Budget", lead.budget ? euro(lead.budget) : "—"],
            ["Site", siteShort(lead.siteId)],
            [
              "Source",
              <span key="s" className="inline-flex items-center gap-1.5 capitalize [&_svg]:size-3.5">
                <SourceIcon className="text-muted-foreground" /> {lead.source}
              </span>,
            ],
            ["Créé le", `${fmtDayLong(lead.createdAt)} à ${fmtTime(lead.createdAt)}`],
            [
              "Vendeur",
              <span key="a" className="inline-flex items-center gap-2">
                <Avatar name={lead.assignee} size={20} /> {lead.assignee}
              </span>,
            ],
          ].map(([k, v]) => (
            <div key={k as string} className="flex gap-3 bg-card px-4 py-2.5">
              <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
              <dd className="min-w-0 flex-1">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Note de qualification</p>
          <p className="rounded-xl border border-border bg-subtle p-3.5 text-[13px] leading-relaxed">{lead.note}</p>
        </div>

        {callId && (
          <Link
            href={`/app/calls?id=${callId}`}
            className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:opacity-80 [&_svg]:size-3.5"
          >
            Écouter l&apos;appel d&apos;origine <ArrowUpRight />
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
        <Button size="sm" onClick={() => toast(`Appel vers ${lead.phone}…`, "info")}>
          <Phone /> Appeler
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast("SMS envoyé")}>
          <MessageSquare /> SMS
        </Button>
        {lead.email && (
          <Button variant="outline" size="sm" onClick={() => toast("Fiche véhicule envoyée par e-mail")}>
            <Mail /> E-mail
          </Button>
        )}
      </div>
    </div>
  );
}
