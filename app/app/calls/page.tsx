import { Download } from "lucide-react";
import type { Metadata } from "next";
import { CallsView } from "@/components/app/calls/calls-view";
import { Page } from "@/components/app/page-header";
import { ToastButton } from "@/components/app/toast-button";
import { getAllCalls } from "@/lib/demo/data";
import { getAccount } from "@/lib/server/account";
import { toCallRecords } from "@/lib/server/account-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Appels" };

export default async function CallsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : undefined;
  const now = new Date();
  const account = await getAccount();
  const agent = account?.dealership.agent_name ?? "Léa";
  const calls = account ? toCallRecords(account.calls) : getAllCalls(now);

  return (
    <Page
      title="Appels"
      subtitle={`Chaque appel décroché par ${agent} : résumé, données extraites, enregistrement et transcription.`}
      range
      actions={
        <ToastButton variant="outline" size="sm" message={`Export CSV de ${calls.length} appels lancé`}>
          <Download /> Exporter CSV
        </ToastButton>
      }
    >
      <CallsView calls={calls} now={now.toISOString()} initialId={id} />
    </Page>
  );
}
