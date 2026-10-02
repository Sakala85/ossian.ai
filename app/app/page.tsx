import { Download, Play } from "lucide-react";
import type { Metadata } from "next";
import { BarList } from "@/components/app/bar-list";
import { INTENT_ICONS } from "@/components/app/badges";
import { parisParts } from "@/components/app/format";
import { ActivityFeed } from "@/components/app/overview/activity-feed";
import { AttentionCard, type AttentionItem } from "@/components/app/overview/attention-card";
import { CallsChart } from "@/components/app/overview/calls-chart";
import { Heatmap } from "@/components/app/overview/heatmap";
import { KpiRow } from "@/components/app/overview/kpi-row";
import { ResolutionCard } from "@/components/app/overview/resolution-card";
import { Page } from "@/components/app/page-header";
import { ToastButton } from "@/components/app/toast-button";
import { LinkButton } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AVG_WORKSHOP_TICKET,
  LEAD_VALUE,
  getAllCalls,
  getAppointments,
  getDailyStats,
  getHeatmap,
  getIntentBreakdown,
  getKpis,
  getLanguageBreakdown,
  getLeads,
} from "@/lib/demo/data";
import { INTENTS, LANGUAGES, OUTCOMES, type CallOutcome } from "@/lib/domain/types";
import { num, pct } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vue d'ensemble" };

const DAY = 86_400_000;

export default function OverviewPage() {
  const now = new Date();
  const kpis = getKpis(now);
  const daily = getDailyStats(now, 30);
  const calls = getAllCalls(now);
  const leads = getLeads(now);
  const appointments = getAppointments(now);
  const today = daily[daily.length - 1]!;

  // Day labels are derived from "now" (Paris time), not from the generator's date strings.
  const chartData = daily.map((d, i) => ({
    iso: new Date(now.getTime() - (daily.length - 1 - i) * DAY).toISOString(),
    handled: d.handledByAi,
    transferred: d.transferred,
    missed: d.missedBefore,
  }));

  const kpiData = {
    ...kpis,
    series: {
      calls: daily.map((d) => d.calls),
      appointments: daily.map((d) => d.appointments),
      leads: daily.map((d) => d.leads),
      revenue: daily.map((d) => d.appointments * AVG_WORKSHOP_TICKET + d.leads * LEAD_VALUE),
      hours: daily.map((d) => (d.calls * 3.4) / 60),
    },
  };

  // Outcomes over the last 7 days.
  const week = calls.filter((c) => now.getTime() - new Date(c.startedAt).getTime() < 7 * DAY);
  const counts = Object.fromEntries(Object.keys(OUTCOMES).map((k) => [k, 0])) as Record<CallOutcome, number>;
  week.forEach((c) => counts[c.outcome]++);

  const intents = getIntentBreakdown();
  const languages = getLanguageBreakdown();
  const nonFrench = languages.filter((l) => l.code !== "fr").reduce((s, l) => s + l.share, 0);

  // Points d'attention
  const complaint = calls.find((c) => c.intent === "reclamation");
  const hotLeads = leads
    .filter((l) => l.stage === "nouveau")
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const noShow = appointments.find((a) => a.status === "no_show");
  const attention: AttentionItem[] = [
    {
      id: "complaint",
      kind: "complaint",
      title: `Réclamation à rappeler avant 17h${complaint?.caller.name ? ` · ${complaint.caller.name}` : ""}`,
      body: "Écart de 86 € entre le devis et la facture, sans appel préalable. Le chef d'atelier doit rappeler la cliente.",
      meta: "Sentiment négatif · priorité haute",
      href: `/app/calls?id=${complaint?.id ?? ""}`,
      cta: "Voir l'appel",
    },
    {
      id: "leads",
      kind: "hot_leads",
      title: `${hotLeads.length} leads chauds non contactés`,
      body: hotLeads.map((l) => `${l.name} (${l.vehicle}, score ${l.score})`).join(" · ") || "Aucun lead en attente.",
      meta: "Délai cible : premier contact < 2 h",
      href: "/app/leads",
      cta: "Ouvrir le pipeline",
    },
    {
      id: "noshow",
      kind: "no_show",
      title: "1 no-show à reprogrammer",
      body: noShow
        ? `${noShow.customer} · ${noShow.service} (${noShow.vehicle.make} ${noShow.vehicle.model}). Léa peut proposer un nouveau créneau par SMS.`
        : "Un client ne s'est pas présenté ce matin. Léa peut proposer un nouveau créneau par SMS.",
      meta: noShow ? `Conseiller : ${noShow.advisor}` : "Atelier Lyon Est",
      href: "/app/appointments",
      cta: "Reprogrammer",
    },
  ];

  const hour = parisParts(now).hour;
  const hello = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";

  return (
    <Page
      title={`${hello} Claire`}
      crumb="Vue d'ensemble"
      subtitle={
        <>
          Léa a traité <span className="font-medium text-foreground tabular">{today.calls}</span> appels aujourd&apos;hui, dont{" "}
          <span className="font-medium text-foreground tabular">{today.afterHours}</span> en dehors des horaires et{" "}
          <span className="font-medium text-foreground tabular">{today.appointments}</span> rendez-vous pris.
        </>
      }
      range
      actions={
        <>
          <ToastButton variant="outline" size="sm" message="Rapport mensuel exporté (PDF)">
            <Download /> Exporter
          </ToastButton>
          <LinkButton href="/demo" size="sm">
            <Play /> Tester l&apos;agent
          </LinkButton>
        </>
      }
    >
      <div className="grid gap-4 md:gap-5">
        <KpiRow k={kpiData} />

        <div className="grid gap-4 md:gap-5 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <CallsChart data={chartData} />
          </div>
          <AttentionCard items={attention} />
        </div>

        <div className="grid gap-4 md:gap-5 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <Heatmap grid={getHeatmap()} />
          </div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Motifs d&apos;appel</CardTitle>
                <CardDescription>Détectés automatiquement par Léa · 30 j</CardDescription>
              </div>
            </CardHeader>
            <div className="px-3 pt-3 pb-4">
              <BarList
                items={intents.map((i) => {
                  const Icon = INTENT_ICONS[i.intent];
                  return {
                    key: i.intent,
                    label: INTENTS[i.intent],
                    icon: <Icon />,
                    value: i.share,
                    display: pct(i.share),
                    sub: num(Math.round(i.share * kpis.calls)),
                  };
                })}
              />
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-5 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <ActivityFeed calls={calls.slice(0, 7)} now={now.toISOString()} />
          </div>
          <div className="grid content-start gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-1">
            <ResolutionCard counts={counts} />
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Langues</CardTitle>
                  <CardDescription>
                    <span className="font-medium text-foreground">{pct(nonFrench)}</span> des appels dans une autre langue que le
                    français
                  </CardDescription>
                </div>
              </CardHeader>
              <div className="px-3 pt-3 pb-4">
                <BarList
                  items={languages.map((l) => ({
                    key: l.code,
                    label: LANGUAGES[l.code].label,
                    icon: <span className="text-sm leading-none">{LANGUAGES[l.code].flag}</span>,
                    value: l.share,
                    display: pct(l.share),
                  }))}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
