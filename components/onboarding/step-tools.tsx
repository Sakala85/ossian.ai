"use client";

import { Check, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CRM_PROVIDERS, DMS_PROVIDERS, type BookingProviderId, type Connections, type CrmId } from "./lib";
import { Callout, Mono, StepActions, StepHeader } from "./shared";

type Choice<T extends string> = { id: T; name: string; mono: string };

function Choices<T extends string>({ label, items, value, onChange }: { label: string; items: Choice<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="mt-4 grid gap-2 sm:grid-cols-2">
      {items.map((p) => {
        const selected = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(p.id)}
            className={cn(
              "flex min-w-0 items-center gap-3 rounded-lg border bg-card p-3 text-left transition-[border-color,box-shadow,background-color] duration-150",
              selected ? "border-primary shadow-[0_0_0_3px_var(--primary-soft)]" : "border-border hover:border-border-strong hover:bg-subtle",
            )}
          >
            <Mono>{p.mono}</Mono>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{p.name}</span>
            {selected && <Check className="size-4 shrink-0 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

const DMS_CHOICES: Choice<BookingProviderId>[] = [{ id: "ossian", name: "Aucun / je ne sais pas", mono: "—" }, ...DMS_PROVIDERS];
const CRM_CHOICES: Choice<CrmId>[] = CRM_PROVIDERS.map((p) => (p.id === "none" ? { ...p, name: "Aucun / je ne sais pas" } : p));

/** Names of the tools the dealership declared (sent to the Ossian team at activation). */
export function declaredTools(c: Connections) {
  return {
    dms: DMS_PROVIDERS.find((p) => p.id === c.booking)?.name,
    crm: CRM_PROVIDERS.find((p) => p.id === c.crm && p.id !== "none")?.name,
  };
}

/**
 * Optional: which DMS / CRM the dealership uses. Nothing is "connected" here —
 * the Ossian team sets the connection up with the dealership after activation.
 */
export function StepTools({
  connections,
  onConnectionsChange,
  onBack,
  onNext,
}: {
  connections: Connections;
  onConnectionsChange: (fn: (c: Connections) => Connections) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepHeader
        step={5}
        title={
          <>
            Vos <span className="font-serif-accent">outils</span>.
          </>
        }
        description="Facultatif. Indiquez votre logiciel atelier (DMS) et votre CRM : notre équipe prépare la connexion avec vous après l'activation."
      />

      <Callout tone="success" icon={<ShieldCheck />} className="mb-5">
        <span className="font-medium">Rien ici ne bloque la mise en ligne.</span> Sans intégration, chaque demande de rendez-vous, lead ou rappel arrive
        dans votre tableau de bord et par e-mail.
      </Callout>

      <div className="grid gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-medium tracking-tight text-foreground">Logiciel atelier (DMS)</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Pour que l&apos;agent lise votre planning et y écrive les rendez-vous.</p>
          <Choices label="Logiciel atelier" items={DMS_CHOICES} value={connections.booking} onChange={(v) => onConnectionsChange((x) => ({ ...x, booking: v }))} />
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-medium tracking-tight text-foreground">CRM</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Pour envoyer les leads ventes directement à vos vendeurs.</p>
          <Choices label="CRM" items={CRM_CHOICES} value={connections.crm} onChange={(v) => onConnectionsChange((x) => ({ ...x, crm: v }))} />
        </Card>
      </div>

      <StepActions onBack={onBack} onNext={onNext} nextLabel="Passer à l'activation" />
    </div>
  );
}
