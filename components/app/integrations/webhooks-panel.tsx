"use client";

import { Check, Send } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CopyField, Panel } from "../form-bits";
import { JsonCode } from "../json-code";
import { useShell } from "../shell-context";

const EVENTS = [
  { id: "call.completed", label: "Appel terminé", hint: "Résumé, données extraites, transcription" },
  { id: "appointment.created", label: "RDV créé", hint: "Créneau, prestation, conseiller" },
  { id: "lead.created", label: "Lead qualifié", hint: "Projet, budget, score" },
  { id: "callback.scheduled", label: "Rappel programmé", hint: "Service, échéance, priorité" },
  { id: "complaint.detected", label: "Réclamation détectée", hint: "Motif, sentiment, transcription" },
];

export function WebhooksPanel({ payload }: { payload: string }) {
  const { toast } = useShell();
  const [url, setUrl] = useState("https://hooks.mistral-automobiles.fr/ossian");
  const [events, setEvents] = useState<string[]>(["call.completed", "appointment.created", "lead.created"]);
  const [testing, setTesting] = useState(false);

  const toggle = (id: string) => setEvents((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  return (
    <Panel
      id="api"
      title="Webhooks & API"
      description="Recevez chaque appel structuré en temps réel dans vos outils, ou interrogez l'API REST."
      action={<Badge tone="success" dot>Opérationnel</Badge>}
      bodyClassName="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
    >
      <div className="grid content-start gap-5">
        <Field label="URL de destination">
          <div className="flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono text-[13px]" />
            <Button
              variant="outline"
              onClick={() => {
                setTesting(true);
                setTimeout(() => {
                  setTesting(false);
                  toast("Événement de test livré · 200 OK en 184 ms");
                }, 900);
              }}
              disabled={testing || !url}
            >
              <Send /> {testing ? "Envoi…" : "Tester"}
            </Button>
          </div>
        </Field>

        <div className="grid gap-1.5">
          <span className="text-[13px] font-medium">Événements</span>
          <ul className="grid gap-1.5">
            {EVENTS.map((e) => {
              const on = events.includes(e.id);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(e.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-subtle"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[5px] border [&_svg]:size-3",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
                      )}
                    >
                      {on && <Check />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px]">{e.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{e.hint}</span>
                    </span>
                    <code className="hidden font-mono text-[11px] text-muted-foreground sm:block">{e.id}</code>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Field label="Secret de signature" hint="En-tête Ossian-Signature (HMAC SHA-256).">
            <CopyField value="whsec_7f3a••••••••••c91e" />
          </Field>
          <Field label="Clé API" hint="Lecture seule · api.ossian.ai/v1">
            <CopyField value="osk_live_••••••••••••4b2d" />
          </Field>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Exemple de charge utile</span>
          <code className="rounded-md border border-border bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            POST · call.completed
          </code>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-subtle">
          <JsonCode json={payload} className="max-h-[440px]" />
        </div>
      </div>
    </Panel>
  );
}
