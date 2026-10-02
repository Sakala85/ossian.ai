import { Download } from "lucide-react";
import type { Metadata } from "next";
import { LeadsBoard } from "@/components/app/leads/leads-board";
import { Page } from "@/components/app/page-header";
import { Delta, StatTile } from "@/components/app/stat-tile";
import { ToastButton } from "@/components/app/toast-button";
import { CsvButton } from "@/components/app/csv-button";
import { fmtDateShort } from "@/components/app/format";
import { LiveLeads } from "@/components/app/live/live-leads";
import { getAllCalls, getLeads } from "@/lib/demo/data";
import { LEAD_STAGES, type LeadStage } from "@/lib/domain/types";
import { getAccount } from "@/lib/server/account";
import { pct } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
  const now = new Date();
  const account = await getAccount();
  if (account) {
    const agent = account.dealership.agent_name ?? "Léa";
    return (
      <Page
        title="Leads"
        subtitle={`Projets d'achat, de reprise ou de financement qualifiés par ${agent} au téléphone. Suivez-les jusqu'à la vente.`}
        actions={
          <CsvButton
            filename={`leads-${now.toISOString().slice(0, 10)}.csv`}
            rows={account.leads.map((l) => ({
              Date: fmtDateShort(l.created_at),
              Nom: l.name,
              Téléphone: l.phone,
              "E-mail": l.email,
              Intérêt: l.interest,
              Véhicule: l.vehicle,
              Budget: l.budget,
              Reprise: l.trade_in,
              Étape: LEAD_STAGES[l.stage as LeadStage] ?? l.stage,
              Note: l.note,
            }))}
          />
        }
      >
        <LiveLeads leads={account.leads} now={now.toISOString()} />
      </Page>
    );
  }
  const leads = getLeads(now);
  const calls = getAllCalls(now);

  const callByLead: Record<string, string> = {};
  calls.forEach((c) => {
    if (c.leadId) callByLead[c.leadId] = c.id;
  });

  const month = leads.filter((l) => now.getTime() - new Date(l.createdAt).getTime() < 30 * 86_400_000);
  const avgScore = Math.round(leads.reduce((s, l) => s + l.score, 0) / Math.max(1, leads.length));
  const won = leads.filter((l) => l.stage === "gagne").length;
  const advanced = leads.filter((l) => l.stage === "essai" || l.stage === "offre" || l.stage === "gagne").length;
  const fromCalls = leads.filter((l) => l.source === "appel entrant").length;

  return (
    <Page
      title="Leads"
      subtitle="Prospects qualifiés par Léa au téléphone et transmis à vos vendeurs avec le contexte complet."
      range
      actions={
        <ToastButton variant="outline" size="sm" message="Leads exportés vers le CRM">
          <Download /> Exporter vers le CRM
        </ToastButton>
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Leads ce mois"
          value={month.length}
          delta={<Delta value={0.22} label="+22 %" />}
          hint={`${fromCalls} issus d'appels entrants`}
        />
        <StatTile label="Score moyen" value={avgScore} unit="/100" hint="Qualification automatique en fin d'appel" />
        <StatTile
          label="Taux de conversion"
          value={pct(won / Math.max(1, leads.length), 1)}
          hint={`${won} vente${won > 1 ? "s" : ""} · ${pct(advanced / Math.max(1, leads.length))} en essai ou offre`}
        />
        <StatTile
          label="Délai de premier contact"
          value="1 min 40"
          delta={<Delta value={-1} goodWhenUp={false} label="−97 %" />}
          hint="vs 4 h 12 en moyenne avant Ossian"
        />
      </div>
      <LeadsBoard leads={leads} now={now.toISOString()} callByLead={callByLead} />
    </Page>
  );
}
