import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { IntegrationsView } from "@/components/app/integrations/integrations-view";
import { WebhooksPanel } from "@/components/app/integrations/webhooks-panel";
import { Page } from "@/components/app/page-header";
import { LinkButton } from "@/components/ui/button";
import { LiveIntegrations } from "@/components/app/live/live-pages";
import { INTEGRATIONS, getAllCalls } from "@/lib/demo/data";
import { getAccount } from "@/lib/server/account";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Intégrations" };

export default async function IntegrationsPage() {
  const account = await getAccount();
  if (account) return <LiveIntegrations account={account} />;
  const now = new Date();
  const calls = getAllCalls(now);
  const call = calls.find((c) => c.id === "call_7Q2K") ?? calls[0]!;

  const payload = JSON.stringify(
    {
      event: "call.completed",
      id: "evt_01JB8Q2K7ZC4",
      created_at: new Date(new Date(call.startedAt).getTime() + call.durationSec * 1000).toISOString(),
      data: {
        call_id: call.id,
        direction: call.direction,
        site_id: call.siteId,
        caller: { name: call.caller.name ?? null, phone: call.caller.phone.replace(/^0/, "+33").replace(/\s/g, ""), known: call.caller.known },
        language: call.language,
        duration_sec: call.durationSec,
        after_hours: call.afterHours,
        intent: call.intent,
        outcome: call.outcome,
        sentiment: call.sentiment,
        csat: call.csat ?? null,
        summary: call.summary,
        vehicle: call.vehicle ?? null,
        extracted: call.extracted ?? {},
        appointment: call.appointmentId
          ? { id: call.appointmentId, confirmation: "RDV-48211", advisor: "Karim Benali", courtesy_vehicle: true }
          : null,
        recording_url: `https://api.ossian.ai/v1/calls/${call.id}/recording`,
        transcript_url: `https://api.ossian.ai/v1/calls/${call.id}/transcript`,
      },
    },
    null,
    2,
  );

  return (
    <Page
      title="Intégrations"
      subtitle="Connectez Ossian à votre DMS, votre CRM et votre téléphonie : Léa lit et écrit directement dans vos outils."
      actions={
        <LinkButton href="#api" variant="outline" size="sm">
          <BookOpen /> Webhooks & API
        </LinkButton>
      }
    >
      <IntegrationsView integrations={INTEGRATIONS} />
      <div className="mt-10">
        <WebhooksPanel payload={payload} />
      </div>
    </Page>
  );
}
