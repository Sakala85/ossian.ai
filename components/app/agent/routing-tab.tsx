"use client";

import { Clock, PhoneForwarded, ShieldCheck, Users } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Panel, RadioCards, ToggleRow } from "../form-bits";
import type { AgentState, SetAgent } from "./state";

export function RoutingTab({ s, set }: { s: AgentState; set: SetAgent }) {
  const updateDept = (i: number, patch: Partial<AgentState["departments"][number]>) =>
    set(
      "departments",
      s.departments.map((d, j) => (j === i ? { ...d, ...patch } : d)),
    );

  return (
    <div className="grid gap-5">
      <Panel title="Politique de transfert" description="Quand Léa doit-elle passer la main à un collaborateur ?">
        <RadioCards
          name="Politique de transfert"
          value={s.transferPolicy}
          onChange={(v) => set("transferPolicy", v)}
          options={[
            {
              value: "business_hours",
              title: "Pendant les horaires",
              icon: <Clock />,
              description: "Transfert vers le bon service quand il est ouvert. En dehors, Léa traite seule et programme un rappel.",
              badge: "Recommandé",
            },
            {
              value: "always_offer",
              title: "Toujours proposer",
              icon: <Users />,
              description: "Léa propose systématiquement un humain si le client le souhaite, même pour une demande simple.",
            },
            {
              value: "never",
              title: "Autonomie complète",
              icon: <ShieldCheck />,
              description: "Aucun transfert en direct : Léa traite, crée le RDV ou le lead et programme un rappel si besoin.",
            },
          ]}
        />
      </Panel>

      <Panel
        title="Services & numéros de transfert"
        description="Léa transfère vers le bon interlocuteur avec une fiche contexte (motif, véhicule, client)."
        bodyClassName="px-0 pb-0"
      >
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-y border-border bg-subtle text-left text-xs text-muted-foreground">
                <th className="w-16 py-2 pr-2 pl-5 font-medium">Actif</th>
                <th className="px-2 py-2 font-medium">Service</th>
                <th className="w-44 px-2 py-2 font-medium">Numéro de transfert</th>
                <th className="w-56 py-2 pr-5 pl-2 font-medium">Horaires de transfert</th>
              </tr>
            </thead>
            <tbody>
              {s.departments.map((d, i) => (
                <tr key={d.key} className={cn("border-b border-border last:border-b-0", !d.enabled && "opacity-60")}>
                  <td className="py-2.5 pr-2 pl-5">
                    <Switch checked={d.enabled} onCheckedChange={(v) => updateDept(i, { enabled: v })} label={`Activer ${d.label}`} />
                  </td>
                  <td className="px-2 py-2.5">
                    <p className="font-medium">{d.label}</p>
                    {d.email && <p className="text-xs text-muted-foreground">{d.email}</p>}
                  </td>
                  <td className="px-2 py-2.5">
                    <Input
                      value={d.phone}
                      onChange={(e) => updateDept(i, { phone: e.target.value })}
                      className="h-8 rounded-lg font-mono text-[12.5px]"
                      aria-label={`Numéro ${d.label}`}
                    />
                  </td>
                  <td className="py-2.5 pr-5 pl-2">
                    <Input
                      value={d.hours}
                      onChange={(e) => updateDept(i, { hours: e.target.value })}
                      className="h-8 rounded-lg text-[13px]"
                      aria-label={`Horaires ${d.label}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Comportement du transfert">
        <div className="divide-y divide-border">
          <ToggleRow
            icon={<PhoneForwarded />}
            title="Transfert chaud avec contexte"
            description="Léa résume la demande au collaborateur avant de connecter l'appel. Le client n'a rien à répéter."
            checked={s.warmTransfer}
            onChange={(v) => set("warmTransfer", v)}
          />
          <div className="grid gap-4 py-4 last:pb-0 sm:grid-cols-2">
            <Field label="Si personne ne décroche après">
              <Select value={s.ringTimeout} onChange={(e) => set("ringTimeout", e.target.value)}>
                <option value="15">15 secondes</option>
                <option value="20">20 secondes</option>
                <option value="30">30 secondes</option>
              </Select>
            </Field>
            <Field label="Alors Léa…">
              <Select value={s.noAnswer} onChange={(e) => set("noAnswer", e.target.value as AgentState["noAnswer"])}>
                <option value="callback">Reprend l&apos;appel et programme un rappel</option>
                <option value="message">Prend un message détaillé</option>
                <option value="voicemail">Bascule sur la messagerie du service</option>
              </Select>
            </Field>
          </div>
        </div>
      </Panel>
    </div>
  );
}
