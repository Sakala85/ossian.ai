"use client";

import { MessageCircle, MessageSquare, MonitorSmartphone, Phone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CodeBlock, CopyField, Panel, RadioCards, ToggleRow } from "../form-bits";
import { MiniOrb } from "../mini-orb";
import type { AgentState, SetAgent } from "./state";

export const OSSIAN_NUMBER = "+33 4 28 29 30 31";

const FORWARD_CODES: Record<AgentState["forwarding"], (rings: string) => string> = {
  all: () => "*21*0428293031#",
  overflow: (r) => `*61*0428293031**${Number(r) * 5}#`,
  after_hours: () => "Programmé depuis votre standard (règle horaire)",
};

const WIDGET = `<script
  src="https://cdn.ossian.ai/widget.js"
  data-agent="mistral-lea"
  data-color="#6a5af9"
  async
></script>`;

export function ChannelsTab({ s, set }: { s: AgentState; set: SetAgent }) {
  return (
    <div className="grid gap-5">
      <Panel
        title={
          <span className="inline-flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" /> Téléphone
          </span>
        }
        description="Gardez vos numéros actuels : il suffit de renvoyer les appels vers votre numéro Ossian."
        action={
          <Badge tone="success" dot>
            Actif
          </Badge>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Numéro Ossian" hint="Numéro géographique lyonnais dédié à Mistral Automobiles.">
              <CopyField value={OSSIAN_NUMBER} label="Numéro Ossian" />
            </Field>
            <Field label="Code de renvoi à composer" hint="Depuis chaque ligne à renvoyer (Orange, SFR, Bouygues, IPBX).">
              <CopyField value={FORWARD_CODES[s.forwarding](s.rings)} />
            </Field>
          </div>
          <RadioCards
            name="Mode de renvoi"
            value={s.forwarding}
            onChange={(v) => set("forwarding", v)}
            options={[
              { value: "all", title: "Tous les appels", description: "Léa décroche immédiatement chaque appel, 24h/24." },
              {
                value: "overflow",
                title: "Débordement",
                description: "Vos équipes décrochent d'abord ; Léa prend le relais si personne ne répond.",
                badge: "Le plus courant",
              },
              { value: "after_hours", title: "Hors horaires", description: "Léa ne répond qu'en dehors des heures d'ouverture." },
            ]}
          />
          {s.forwarding === "overflow" && (
            <Field label="Nombre de sonneries avant reprise par Léa" className="max-w-xs">
              <Select value={s.rings} onChange={(e) => set("rings", e.target.value)}>
                <option value="2">2 sonneries (≈ 10 s)</option>
                <option value="3">3 sonneries (≈ 15 s)</option>
                <option value="4">4 sonneries (≈ 20 s)</option>
              </Select>
            </Field>
          )}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" /> SMS
            </span>
          }
          description="Confirmations, rappels et liens envoyés pendant ou après l'appel."
          action={<Switch checked={s.sms} onCheckedChange={(v) => set("sms", v)} label="Activer les SMS" />}
        >
          <div className={s.sms ? "" : "pointer-events-none opacity-50"}>
            <Field label="Nom d'expéditeur" hint="11 caractères maximum, sans espace.">
              <Input
                value={s.smsSender}
                maxLength={11}
                onChange={(e) => set("smsSender", e.target.value.toUpperCase().replace(/\s/g, ""))}
                className="font-mono"
              />
            </Field>
            <div className="mt-4 divide-y divide-border">
              <ToggleRow
                title="Rappel la veille du rendez-vous"
                description="Réduit les no-shows de 30 à 40 %."
                checked={s.smsReminder}
                onChange={(v) => set("smsReminder", v)}
              />
            </div>
          </div>
        </Panel>

        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="size-4 text-muted-foreground" /> WhatsApp
            </span>
          }
          description="Léa répond aussi aux messages WhatsApp Business, avec les mêmes règles qu'au téléphone."
          action={s.whatsapp ? <Badge tone="success" dot>Connecté</Badge> : <Badge>Non connecté</Badge>}
        >
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border-strong bg-subtle p-4">
            <p className="text-[13px] text-muted-foreground">
              Connectez votre compte WhatsApp Business pour envoyer les confirmations et poursuivre les conversations par écrit.
            </p>
            <Link href="/app/integrations" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Connecter WhatsApp Business
            </Link>
          </div>
        </Panel>
      </div>

      <Panel
        title={
          <span className="inline-flex items-center gap-2">
            <MonitorSmartphone className="size-4 text-muted-foreground" /> Chat web
          </span>
        }
        description="Un widget sur votre site : vos visiteurs écrivent ou appellent Léa en un clic."
        action={<Switch checked={s.webchat} onCheckedChange={(v) => set("webchat", v)} label="Activer le chat web" />}
      >
        <div className={s.webchat ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]" : "pointer-events-none grid gap-4 opacity-50 lg:grid-cols-[minmax(0,1fr)_260px]"}>
          <div className="min-w-0">
            <p className="mb-2 text-[13px] font-medium">Code d&apos;intégration</p>
            <CodeBlock title="index.html" code={WIDGET} />
            <p className="mt-2 text-xs text-muted-foreground">À coller avant la balise &lt;/body&gt; de votre site.</p>
          </div>
          <div className="flex min-h-48 flex-col items-end justify-end gap-2.5 overflow-hidden rounded-xl border border-border bg-dots p-4" aria-hidden>
            <div className="w-56 rounded-xl rounded-br-md border border-border bg-card p-3 shadow-float">
              <p className="text-xs font-medium">{s.name} · Mistral Automobiles</p>
              <p className="mt-1 rounded-lg bg-subtle px-2.5 py-1.5 text-xs text-muted-foreground">Bonjour ! Une question sur votre véhicule ?</p>
            </div>
            <span className="rounded-full p-1 shadow-float">
              <MiniOrb size={40} live />
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
