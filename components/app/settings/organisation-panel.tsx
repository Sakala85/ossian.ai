"use client";

import { Building, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { Site } from "@/lib/domain/types";
import { Panel } from "../form-bits";
import { useShell } from "../shell-context";

const OSSIAN_NUMBERS = ["+33 4 28 29 30 31", "+33 4 28 29 30 32", "+33 4 28 29 30 33"];

export function OrganisationPanel({ sites }: { sites: Site[] }) {
  const { toast } = useShell();
  const [org, setOrg] = useState({
    legal: "Mistral Automobiles SAS",
    siret: "512 345 678 00027",
    vat: "FR42 512345678",
    address: "48 avenue Jean Mermoz, 69008 Lyon",
    tz: "Europe/Paris",
  });
  const set = (k: keyof typeof org) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setOrg((o) => ({ ...o, [k]: e.target.value }));

  return (
    <Panel
      id="organisation"
      title="Organisation"
      description="Informations légales du groupe, utilisées pour la facturation et les mentions RGPD."
      footer={
        <div className="flex items-center justify-between gap-3">
          <span>Ces informations apparaissent sur vos factures.</span>
          <Button size="xs" onClick={() => toast("Informations de l'organisation enregistrées")}>
            Enregistrer
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Raison sociale">
          <Input value={org.legal} onChange={set("legal")} />
        </Field>
        <Field label="SIRET">
          <Input value={org.siret} onChange={set("siret")} className="font-mono text-[13px]" />
        </Field>
        <Field label="Adresse du siège">
          <Input value={org.address} onChange={set("address")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="N° de TVA">
            <Input value={org.vat} onChange={set("vat")} className="font-mono text-[13px]" />
          </Field>
          <Field label="Fuseau horaire">
            <Select value={org.tz} onChange={set("tz")}>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Europe/Brussels">Europe/Bruxelles</option>
              <option value="Indian/Reunion">La Réunion</option>
            </Select>
          </Field>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[13px] font-medium">
            Sites <span className="font-normal text-muted-foreground">· {sites.length}</span>
          </p>
          <Button variant="outline" size="xs" onClick={() => toast("Ajout d'un site : notre équipe active un nouveau numéro sous 24 h", "info")}>
            <Plus /> Ajouter un site
          </Button>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border">
          {sites.map((s, i) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-card px-4 py-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-subtle text-muted-foreground [&_svg]:size-4">
                <Building />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.address}, {s.city} · <span className="font-mono">{s.phone}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {s.brands.map((b) => (
                  <span key={b} className="rounded-md border border-border bg-subtle px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {b}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 sm:w-48 sm:justify-end">
                <span className="font-mono text-xs text-muted-foreground">{OSSIAN_NUMBERS[i] ?? "—"}</span>
                <Badge tone="success" dot>
                  Actif
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
