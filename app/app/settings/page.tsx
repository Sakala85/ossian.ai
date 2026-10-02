import type { Metadata } from "next";
import { fmtDateLong } from "@/components/app/format";
import { Page } from "@/components/app/page-header";
import { BillingPanel } from "@/components/app/settings/billing-panel";
import { OrganisationPanel } from "@/components/app/settings/organisation-panel";
import { SecurityPanel } from "@/components/app/settings/security-panel";
import { SettingsNav } from "@/components/app/settings/settings-nav";
import { TeamPanel } from "@/components/app/settings/team-panel";
import { DEMO_PROFILE } from "@/lib/demo/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Paramètres" };

const monthF = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });

export default function SettingsPage() {
  const now = new Date();
  // First day of next month, at noon UTC to stay on the right calendar day in Paris.
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 12));
  const invoices = [1, 2, 3].map((k) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k + 1, 1, 12));
    const label = monthF.format(d);
    return { label: label[0]!.toUpperCase() + label.slice(1), amount: k === 3 ? "1 640,40 €" : "1 788,00 €" };
  });

  return (
    <Page title="Paramètres" subtitle="Organisation, équipe, abonnement et conformité de l'espace Groupe Mistral.">
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <SettingsNav />
        <div className="grid min-w-0 gap-6">
          <OrganisationPanel sites={DEMO_PROFILE.sites} />
          <TeamPanel />
          <BillingPanel nextInvoice={fmtDateLong(next)} invoices={invoices} />
          <SecurityPanel />
        </div>
      </div>
    </Page>
  );
}
