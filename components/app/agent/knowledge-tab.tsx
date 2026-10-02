"use client";

import { Globe, LoaderCircle, Plus, RefreshCw, Trash } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { IconAction, Panel } from "../form-bits";
import { useShell } from "../shell-context";
import type { AgentState, SetAgent } from "./state";

const cellInput = "h-8 rounded-lg text-[13px]";

export function KnowledgeTab({ s, set }: { s: AgentState; set: SetAgent }) {
  const { toast } = useShell();
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState("il y a 2 jours");

  const resync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncedAt("à l'instant");
      toast("Site web analysé : 3 tarifs et 1 horaire mis à jour");
    }, 1800);
  };

  const update = <T,>(arr: T[], i: number, patch: Partial<T>) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x));

  return (
    <div className="grid gap-5">
      <Panel
        title="Source"
        description="Léa apprend votre activité à partir de votre site web. Vos modifications manuelles ci-dessous sont prioritaires."
        bodyClassName="pt-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={s.website} onChange={(e) => set("website", e.target.value)} className="pl-9" aria-label="Site web" />
          </div>
          <Button variant="outline" onClick={resync} disabled={syncing}>
            {syncing ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
            {syncing ? "Analyse en cours…" : "Resynchroniser depuis le site web"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Dernière synchronisation {syncedAt} · 42 pages lues</p>
      </Panel>

      <Panel
        title="Horaires"
        description="Utilisés pour répondre aux clients et décider quand transférer à un humain."
        action={
          <Button variant="ghost" size="xs" onClick={() => set("hours", [...s.hours, { label: "", value: "" }])}>
            <Plus /> Ajouter
          </Button>
        }
      >
        <div className="grid gap-2">
          {s.hours.map((h, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
              <Input
                value={h.label}
                placeholder="Service"
                onChange={(e) => set("hours", update(s.hours, i, { label: e.target.value }))}
                className={`${cellInput} font-medium max-sm:col-span-2`}
                aria-label="Service"
              />
              <Input
                value={h.value}
                placeholder="Lun–ven 9h–18h"
                onChange={(e) => set("hours", update(s.hours, i, { value: e.target.value }))}
                className={cellInput}
                aria-label="Horaires"
              />
              <IconAction label="Supprimer" onClick={() => set("hours", s.hours.filter((_, j) => j !== i))}>
                <Trash />
              </IconAction>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Prestations & tarifs indicatifs"
        description="Léa annonce des prix « à partir de » et propose la durée adaptée au planning atelier."
        action={
          <Button variant="ghost" size="xs" onClick={() => set("services", [...s.services, { name: "", durationMin: 60, priceFrom: 0 }])}>
            <Plus /> Ajouter
          </Button>
        }
        bodyClassName="px-0 pb-2"
      >
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-y border-border bg-subtle text-left text-xs text-muted-foreground">
                <th className="py-2 pr-2 pl-5 font-medium">Prestation</th>
                <th className="w-28 px-2 py-2 font-medium">Durée (min)</th>
                <th className="w-32 px-2 py-2 font-medium">À partir de (€)</th>
                <th className="w-12 py-2 pr-5 pl-2" />
              </tr>
            </thead>
            <tbody>
              {s.services.map((sv, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="py-1.5 pr-2 pl-5">
                    <Input
                      value={sv.name}
                      onChange={(e) => set("services", update(s.services, i, { name: e.target.value }))}
                      className={`${cellInput} border-transparent bg-transparent shadow-none hover:border-input`}
                      aria-label="Nom de la prestation"
                    />
                    {sv.description && <p className="px-3 pb-1 text-xs text-muted-foreground">{sv.description}</p>}
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      min={0}
                      step={15}
                      value={sv.durationMin}
                      onChange={(e) => set("services", update(s.services, i, { durationMin: Number(e.target.value) }))}
                      className={`${cellInput} text-right tabular`}
                      aria-label="Durée en minutes"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      min={0}
                      value={sv.priceFrom ?? 0}
                      onChange={(e) => set("services", update(s.services, i, { priceFrom: Number(e.target.value) }))}
                      className={`${cellInput} text-right tabular`}
                      aria-label="Prix à partir de"
                    />
                  </td>
                  <td className="py-1.5 pr-5 pl-2">
                    <IconAction label="Supprimer" onClick={() => set("services", s.services.filter((_, j) => j !== i))}>
                      <Trash />
                    </IconAction>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Politiques"
          description="Courtoisie, paiement, garantie… Léa les cite quand c'est pertinent."
          action={
            <Button variant="ghost" size="xs" onClick={() => set("policies", [...s.policies, ""])}>
              <Plus /> Ajouter
            </Button>
          }
        >
          <ul className="grid gap-2">
            {s.policies.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <Textarea
                  value={p}
                  onChange={(e) => set("policies", s.policies.map((x, j) => (j === i ? e.target.value : x)))}
                  className="min-h-0 py-2 text-[13px]"
                  rows={2}
                  aria-label={`Politique ${i + 1}`}
                />
                <IconAction label="Supprimer" onClick={() => set("policies", s.policies.filter((_, j) => j !== i))}>
                  <Trash />
                </IconAction>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Questions fréquentes"
          description="Réponses exactes que Léa doit donner."
          action={
            <Button variant="ghost" size="xs" onClick={() => set("faq", [...s.faq, { q: "", a: "" }])}>
              <Plus /> Ajouter
            </Button>
          }
        >
          <ul className="grid gap-3">
            {s.faq.map((f, i) => (
              <li key={i} className="rounded-xl border border-border bg-subtle p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={f.q}
                    placeholder="Question"
                    onChange={(e) => set("faq", update(s.faq, i, { q: e.target.value }))}
                    className={`${cellInput} font-medium`}
                    aria-label="Question"
                  />
                  <IconAction label="Supprimer" onClick={() => set("faq", s.faq.filter((_, j) => j !== i))}>
                    <Trash />
                  </IconAction>
                </div>
                <Textarea
                  value={f.a}
                  placeholder="Réponse"
                  onChange={(e) => set("faq", update(s.faq, i, { a: e.target.value }))}
                  className="mt-2 min-h-0 py-2 text-[13px]"
                  rows={2}
                  aria-label="Réponse"
                />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
