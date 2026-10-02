"use client";

import { Mail, Phone, Sparkles, Trophy, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { LEAD_STAGES, type LeadStage } from "@/lib/domain/types";
import type { DbLead } from "@/lib/server/db";
import { euro } from "@/lib/utils";
import { formatFrench } from "@/lib/voice/phone";
import { EmptyState } from "../empty-state";
import { relTime } from "../format";
import { StatTile } from "../stat-tile";
import { useShell } from "../shell-context";
import { useAccountAction } from "./use-account-action";

const phone = (p: string) => (p.startsWith("+") ? formatFrench(p) : p);
const OPEN: LeadStage[] = ["nouveau", "contacte", "essai", "offre"];

function LeadRow({ l, now }: { l: DbLead; now: string }) {
  const { update, pending } = useAccountAction();
  const details = [l.vehicle, l.budget ? `budget ${euro(l.budget)}` : null, l.trade_in ? `reprise : ${l.trade_in}` : null].filter(Boolean).join(" · ");
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
      <div className="min-w-0 flex-1 basis-64">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          {l.name}
          <Badge tone="primary">{l.interest}</Badge>
          <span className="text-xs font-normal text-muted-foreground">{relTime(l.created_at, now)}</span>
        </p>
        {details && <p className="mt-0.5 text-[13px] text-foreground">{details}</p>}
        {l.note && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{l.note}</p>}
        <p className="mt-1.5 flex flex-wrap gap-3 text-xs">
          {l.phone && (
            <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 font-mono text-primary tabular hover:underline">
              <Phone className="size-3.5" /> {phone(l.phone)}
            </a>
          )}
          {l.email && (
            <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
              <Mail className="size-3.5" /> {l.email}
            </a>
          )}
        </p>
      </div>
      <Select
        aria-label={`Étape du lead ${l.name}`}
        value={l.stage}
        disabled={pending === l.id}
        onChange={(e) => {
          const value = e.target.value as LeadStage;
          void update(l.id, { kind: "lead", value }, `${l.name} : ${LEAD_STAGES[value]}`);
        }}
        className="h-8 w-auto rounded-lg py-0 pr-8 pl-2.5 text-[13px] bg-[right_8px_center]"
      >
        {(Object.keys(LEAD_STAGES) as LeadStage[]).map((k) => (
          <option key={k} value={k}>
            {LEAD_STAGES[k]}
          </option>
        ))}
      </Select>
    </li>
  );
}

/** Sales leads qualified by the agent, with a real pipeline stage the team updates. */
export function LiveLeads({ leads, now }: { leads: DbLead[]; now: string }) {
  const { workspace } = useShell();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const shown = useMemo(() => (filter === "open" ? leads.filter((l) => OPEN.includes(l.stage as LeadStage)) : leads), [leads, filter]);
  const fresh = leads.filter((l) => l.stage === "nouveau").length;
  const won = leads.filter((l) => l.stage === "gagne").length;

  return (
    <div className="grid gap-4 md:gap-5">
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <StatTile label="À contacter" icon={<Sparkles />} value={fresh} hint="Nouveaux leads, pas encore rappelés" />
        <StatTile label="En cours" icon={<UserRoundCheck />} value={leads.filter((l) => OPEN.includes(l.stage as LeadStage)).length} hint="Nouveaux, contactés, essai, offre" />
        <StatTile label="Gagnés" icon={<Trophy />} value={won} hint={`Sur ${leads.length} lead${leads.length > 1 ? "s" : ""} au total`} />
      </div>

      {leads.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Sparkles />}
            title="Aucun lead pour l'instant"
            description={`Quand un appelant parle d'un achat, d'une reprise ou d'un financement, ${workspace.agent.name} qualifie son projet et le transmet ici et par e-mail.`}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-sm font-medium">
              Leads <span className="ml-1 font-mono text-xs text-muted-foreground tabular">{shown.length}</span>
            </h2>
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "open", label: "En cours" },
                { value: "all", label: "Tous" },
              ]}
            />
          </div>
          {shown.length ? (
            <ul className="divide-y divide-border">
              {shown.map((l) => (
                <LeadRow key={l.id} l={l} now={now} />
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-[13px] text-muted-foreground">Aucun lead en cours : tout a été traité.</p>
          )}
        </Card>
      )}
    </div>
  );
}
