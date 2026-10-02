"use client";

import { CreditCard, Download, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/misc";
import { num, pct } from "@/lib/utils";
import { Panel } from "../form-bits";
import { useShell } from "../shell-context";

const USED = 3412;
const INCLUDED = 3600;
const BY_SITE = [
  { site: "Lyon Est", min: 1702 },
  { site: "Villeurbanne", min: 1038 },
  { site: "Bron", min: 672 },
];

export function BillingPanel({ nextInvoice, invoices }: { nextInvoice: string; invoices: { label: string; amount: string }[] }) {
  const { toast } = useShell();
  const ratio = USED / INCLUDED;

  return (
    <Panel id="facturation" title="Facturation" description="Votre abonnement, votre consommation et vos factures.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Plan */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-subtle p-5">
          <div className="flex items-center gap-2">
            <Badge tone="primary">
              <Sparkles /> Plan Performance
            </Badge>
          </div>
          <p className="mt-4 text-[28px] leading-none font-semibold tracking-[-0.03em]">
            1 490 €<span className="ml-1 text-sm font-normal text-muted-foreground">HT / mois</span>
          </p>
          <ul className="mt-4 grid gap-1.5 text-[13px] text-muted-foreground">
            <li>3 sites · numéros Ossian inclus</li>
            <li>{num(INCLUDED)} minutes d&apos;appel par mois</li>
            <li>Campagnes sortantes, intégration DMS, support prioritaire</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast("Un conseiller Ossian vous recontacte sous 24 h", "info")}>
              Changer de plan
            </Button>
          </div>
        </div>

        {/* Usage */}
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-medium">Minutes utilisées ce mois-ci</p>
            <Badge tone={ratio >= 0.9 ? "warning" : "neutral"}>{pct(ratio)} du forfait</Badge>
          </div>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.02em]">
            {num(USED)} <span className="text-sm font-normal text-muted-foreground">/ {num(INCLUDED)} min</span>
          </p>
          <Progress value={ratio * 100} tone={ratio >= 0.9 ? "warning" : "primary"} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">Au-delà du forfait : 0,29 € HT / minute. Remise à zéro le {nextInvoice}.</p>

          <ul className="mt-5 grid gap-2.5">
            {BY_SITE.map((s) => (
              <li key={s.site} className="grid grid-cols-[100px_minmax(0,1fr)_72px] items-center gap-3 text-[13px]">
                <span className="text-muted-foreground">{s.site}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-chart-1" style={{ width: `${(s.min / USED) * 100}%` }} />
                </span>
                <span className="text-right tabular">{num(s.min)} min</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-5 border-t border-border pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="grid content-start gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Prochaine facture</p>
            <p className="mt-1 text-[13.5px] font-medium">
              {nextInvoice} · <span className="tabular">1 788,00 € TTC</span>
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3">
            <span className="flex h-7 w-10 items-center justify-center rounded-md border border-border bg-subtle text-muted-foreground [&_svg]:size-4">
              <CreditCard />
            </span>
            <div className="min-w-0 flex-1 text-[13px]">
              <p className="font-medium">Visa •••• 4242</p>
              <p className="text-xs text-muted-foreground">Expire 08/28 · prélèvement automatique</p>
            </div>
            <Button variant="ghost" size="xs" onClick={() => toast("Redirection vers le portail de paiement sécurisé", "info")}>
              Modifier
            </Button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Historique</p>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {invoices.map((inv) => (
              <li key={inv.label} className="flex items-center gap-3 px-3.5 py-2.5 text-[13px]">
                <span className="flex-1">{inv.label}</span>
                <span className="tabular">{inv.amount}</span>
                <Badge tone="success">Payée</Badge>
                <button
                  type="button"
                  aria-label={`Télécharger la facture ${inv.label}`}
                  onClick={() => toast(`Facture ${inv.label} téléchargée`)}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
                >
                  <Download />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
