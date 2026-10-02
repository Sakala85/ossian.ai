"use client";

import { BadgeEuro, Bot, CircleDot, MessageSquare, PhoneCall, Stethoscope, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Panel, ToggleRow } from "../form-bits";
import type { AgentState, RuleKey, SetAgent } from "./state";

const RULES: { key: RuleKey; title: string; description: string; icon: React.ReactNode; legal?: boolean }[] = [
  {
    key: "noFirmPrice",
    title: "Ne jamais donner de prix ferme",
    description: "Léa annonce des tarifs « à partir de » et précise que le devis définitif est établi par un conseiller.",
    icon: <BadgeEuro />,
  },
  {
    key: "alwaysCallback",
    title: "Toujours proposer un rappel",
    description: "Si une demande ne peut pas être traitée au téléphone, Léa propose un rappel au créneau choisi par le client.",
    icon: <PhoneCall />,
  },
  {
    key: "complaintAlert",
    title: "Alerte réclamation",
    description: "Mécontentement détecté : notification immédiate au responsable après-vente, avec transcription et priorité haute.",
    icon: <TriangleAlert />,
  },
  {
    key: "noRemoteDiagnosis",
    title: "Pas de diagnostic à distance",
    description: "Pour un voyant ou un bruit, Léa donne les consignes de sécurité et propose un diagnostic à l'atelier.",
    icon: <Stethoscope />,
  },
  {
    key: "smsConfirmation",
    title: "Confirmation par SMS",
    description: "Récapitulatif envoyé après chaque rendez-vous, avec adresse et lien d'annulation.",
    icon: <MessageSquare />,
  },
  {
    key: "recordCalls",
    title: "Enregistrement des appels",
    description: "Annonce légale en début d'appel. Conservation selon votre politique de rétention (90 jours).",
    icon: <CircleDot />,
    legal: true,
  },
  {
    key: "aiDisclosure",
    title: "Mention IA",
    description: "Léa précise qu'elle est une assistante virtuelle dès sa présentation (AI Act, transparence).",
    icon: <Bot />,
    legal: true,
  },
];

export function RulesTab({ s, set }: { s: AgentState; set: SetAgent }) {
  const setRule = (k: RuleKey, v: boolean) => set("rules", { ...s.rules, [k]: v });
  return (
    <div className="grid gap-5">
      <Panel
        title="Garde-fous"
        description="Règles que Léa applique sur chaque appel, quelle que soit la demande."
        footer="Les règles marquées « Conformité » sont recommandées par notre DPO pour respecter le RGPD et l'AI Act."
      >
        <div className="divide-y divide-border">
          {RULES.map((r) => (
            <ToggleRow
              key={r.key}
              icon={r.icon}
              title={r.title}
              description={r.description}
              checked={s.rules[r.key]}
              onChange={(v) => setRule(r.key, v)}
              badge={r.legal ? <Badge tone="info">Conformité</Badge> : undefined}
            >
              {r.key === "complaintAlert" && (
                <Field label="Destinataire de l'alerte" className="max-w-md">
                  <Input type="email" value={s.complaintEmail} onChange={(e) => set("complaintEmail", e.target.value)} />
                </Field>
              )}
            </ToggleRow>
          ))}
        </div>
      </Panel>

      <Panel title="Instructions personnalisées" description="Consignes spécifiques à votre concession, en langage naturel.">
        <Textarea
          value={s.customInstructions}
          onChange={(e) => set("customInstructions", e.target.value)}
          placeholder="Ex. : « Pour les flottes d'entreprise, proposez toujours un rappel de Marc Dubois. Ne prenez pas de RDV carrosserie le samedi. »"
          className="min-h-28"
        />
      </Panel>
    </div>
  );
}
