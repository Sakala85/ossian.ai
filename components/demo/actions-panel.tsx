"use client";

import { AnimatePresence, motion } from "motion/react";
import { BellRing, CalendarCheck, ClipboardCheck, MessageSquareText, PhoneForwarded, Sparkles, Wrench, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OUTCOMES, type CallOutcome } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import type { EndSummary, Entry } from "./types";

type ToolEntry = Extract<Entry, { kind: "tool" }>;

function Row({ k, v }: { k: string; v?: React.ReactNode }) {
  if (v === undefined || v === null || v === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-4 text-[12.5px]">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate text-right font-medium text-foreground">{v}</span>
    </div>
  );
}

function ActionCard({ icon, title, system, tone = "primary", children }: { icon: React.ReactNode; title: string; system: string; tone?: "primary" | "success" | "warning" | "info"; children: React.ReactNode }) {
  const toneCls = { primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", info: "bg-info-soft text-info" }[tone];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-border bg-card p-3.5 shadow-soft"
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className={cn("inline-flex size-7 items-center justify-center rounded-lg [&_svg]:size-4", toneCls)}>{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium">{title}</div>
          <div className="text-[11px] text-muted-foreground">{system}</div>
        </div>
        <span className="text-[10.5px] text-muted-foreground tabular">à l&apos;instant</span>
      </div>
      <div className="grid gap-1">{children}</div>
    </motion.div>
  );
}

function renderAction(e: ToolEntry) {
  const r = (e.result ?? {}) as Record<string, unknown>;
  const i = e.input;
  if (e.ok === false || r.error) return null;
  switch (e.name) {
    case "book_appointment":
      return (
        <ActionCard key={e.id} icon={<CalendarCheck />} title="Rendez-vous créé" system="Planning atelier (DMS) · SMS client" tone="success">
          <Row k="Client" v={String(i.customer_name ?? "")} />
          <Row k="Véhicule" v={String(i.vehicle ?? "")} />
          <Row k="Prestation" v={String(i.service ?? "")} />
          <Row k="Créneau" v={String(r.when ?? "")} />
          <Row k="Conseiller" v={String(r.advisor ?? "")} />
          <Row k="Référence" v={<span className="font-mono">{String(r.confirmation ?? "")}</span>} />
          {Boolean(r.courtesy_vehicle) && <Row k="Courtoisie" v="Réservé" />}
        </ActionCard>
      );
    case "create_lead":
      return (
        <ActionCard key={e.id} icon={<Sparkles />} title="Lead qualifié" system="CRM · vendeur notifié" tone="primary">
          <Row k="Prospect" v={String(i.name ?? "")} />
          <Row k="Projet" v={`${String(i.interest ?? "")} · ${String(i.vehicle_of_interest ?? "")}`} />
          <Row k="Budget" v={i.budget ? `${Number(i.budget).toLocaleString("fr-FR")} €` : undefined} />
          <Row k="Reprise" v={i.trade_in ? String(i.trade_in) : undefined} />
          <Row k="Assigné à" v={String(r.assignee ?? "")} />
          <Row
            k="Score"
            v={
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${Number(r.score ?? 0)}%` }} />
                </span>
                {String(r.score ?? "")}
              </span>
            }
          />
        </ActionCard>
      );
    case "transfer_call":
      return (
        <ActionCard key={e.id} icon={<PhoneForwarded />} title={r.status === "ferme" ? "Service fermé" : "Transfert avec fiche contexte"} system="Standard · poste du service" tone="info">
          <Row k="Service" v={String(r.department ?? "")} />
          <Row k="Motif" v={String(i.reason ?? "")} />
          {r.status === "ferme" ? <Row k="Horaires" v={String(r.hours ?? "")} /> : <Row k="Numéro" v={String(r.number ?? "")} />}
        </ActionCard>
      );
    case "schedule_callback":
      return (
        <ActionCard key={e.id} icon={<BellRing />} title="Rappel programmé" system={r.alert_sent ? "Alerte e-mail + Slack envoyée" : "Tâche créée"} tone="warning">
          <Row k="Pour" v={String(r.owner ?? "")} />
          <Row k="Motif" v={String(i.reason ?? "")} />
          <Row k="Priorité" v={String(i.priority ?? "")} />
          <Row k="Délai" v={String(r.sla ?? "")} />
        </ActionCard>
      );
    case "get_repair_status":
      return r.found ? (
        <ActionCard key={e.id} icon={<Wrench />} title="Ordre de réparation consulté" system="DMS · lecture seule" tone="info">
          <Row k="OR" v={<span className="font-mono">{String(r.reference ?? "")}</span>} />
          <Row k="Statut" v={String(r.status ?? "")} />
          <Row k="Disponible" v={String(r.ready ?? "")} />
        </ActionCard>
      ) : null;
    default:
      return null;
  }
}

export function ActionsPanel({ entries, end, agentName }: { entries: Entry[]; end: EndSummary | null; agentName: string }) {
  const tools = entries.filter((e): e is ToolEntry => e.kind === "tool" && e.result !== undefined);
  const cards = tools.map(renderAction).filter(Boolean);
  const outcome = end ? OUTCOMES[end.outcome as CallOutcome] : undefined;

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {end && (
          <motion.div
            key="summary"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ring-gradient rounded-xl bg-card p-4 shadow-float"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary [&_svg]:size-4">
                <ClipboardCheck />
              </span>
              <div className="flex-1 text-[13px] font-medium">Compte-rendu d&apos;appel</div>
              {outcome && <Badge tone={outcome.tone}>{outcome.label}</Badge>}
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{end.summary}</p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MessageSquareText className="size-3.5" /> Envoyé à l&apos;équipe par e-mail et visible dans le tableau de bord
            </div>
          </motion.div>
        )}
        {cards.reverse()}
      </AnimatePresence>
      {cards.length === 0 && !end && (
        <div className="rounded-xl border border-dashed border-border p-5 text-center">
          <Zap className="mx-auto mb-2 size-5 text-primary" />
          <p className="text-[13px] font-medium">Ce que reçoivent vos équipes</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            Rendez-vous écrits dans le planning, leads envoyés au CRM, rappels et alertes : chaque action de {agentName} apparaît ici en temps réel.
          </p>
        </div>
      )}
    </div>
  );
}
