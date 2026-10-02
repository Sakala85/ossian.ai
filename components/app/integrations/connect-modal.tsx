"use client";

import { ArrowLeftRight, Check, CircleCheck, ExternalLink, KeyRound, LoaderCircle, Lock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { Integration } from "@/lib/domain/types";
import { Modal, OverlayHeader } from "../overlay";
import { Monogram } from "./monogram";

const SCOPES: Record<Integration["category"], string[]> = {
  DMS: [
    "Lire le planning atelier et les disponibilités",
    "Créer et modifier des rendez-vous",
    "Lire les fiches clients et véhicules",
    "Lire le statut des ordres de réparation",
  ],
  CRM: ["Créer des leads et des opportunités", "Mettre à jour les contacts", "Assigner des tâches aux vendeurs"],
  Agenda: ["Lire les disponibilités des conseillers", "Créer des événements (essais, rendez-vous)"],
  Téléphonie: ["Recevoir les appels renvoyés", "Transférer vers vos lignes internes", "Envoyer des SMS"],
  Messagerie: ["Envoyer des messages et des alertes", "Recevoir les réponses des clients"],
  Automatisation: ["Envoyer les événements d'appel signés (webhooks)"],
  "Avis clients": ["Envoyer des invitations à laisser un avis"],
};

const OAUTH = new Set<Integration["category"]>(["CRM", "Agenda", "Messagerie", "Avis clients"]);

type Step = "intro" | "working" | "done" | "manage";

export function ConnectModal({
  integration,
  onClose,
  onConnected,
  onDisconnect,
}: {
  integration: Integration | null;
  onClose: () => void;
  onConnected: (id: string) => void;
  onDisconnect: (id: string) => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [key, setKey] = useState("");
  const [account, setAccount] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (integration) {
      setStep(integration.status === "connecte" ? "manage" : "intro");
      setKey("");
      setAccount("");
    }
  }, [integration]);

  if (!integration) return <Modal open={false} onClose={onClose} label="" children={null} />;
  const it = integration;
  const oauth = OAUTH.has(it.category) && it.id !== "email";

  const connect = () => {
    setStep("working");
    setTimeout(() => {
      setStep("done");
      onConnected(it.id);
    }, 1600);
  };

  return (
    <Modal open={!!integration} onClose={onClose} label={`Connecter ${it.name}`} className="max-w-md">
      <OverlayHeader title={step === "manage" ? it.name : `Connecter ${it.name}`} description={it.category} onClose={onClose} />
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5">
        {/* Handshake visual */}
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="rounded-xl border border-border bg-card p-1.5 shadow-soft">
            <LogoMark className="size-9" />
          </span>
          <span className="flex items-center gap-1 text-muted-foreground [&_svg]:size-4">
            <span className="h-px w-6 bg-border-strong" />
            {step === "working" ? <LoaderCircle className="animate-spin text-primary" /> : step === "done" || step === "manage" ? <Check className="text-success" /> : <ArrowLeftRight />}
            <span className="h-px w-6 bg-border-strong" />
          </span>
          <span className="rounded-xl border border-border bg-card p-1.5 shadow-soft">
            <Monogram mono={it.mono} hue={it.hue} size={36} className="rounded-lg" />
          </span>
        </div>

        {step === "intro" && (
          <>
            <p className="text-center text-[13px] text-muted-foreground">{it.description}</p>
            <div className="mt-5 rounded-xl border border-border bg-subtle p-4">
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Ossian pourra</p>
              <ul className="grid gap-1.5 text-[13px]">
                {SCOPES[it.category].map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-success" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            {!oauth && (
              <div className="mt-5 grid gap-3">
                <Field label="Identifiant de la concession" hint="Fourni par votre éditeur (code site ou tenant).">
                  <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="ex. MISTRAL-LYON-01" />
                </Field>
                <Field label="Clé API">
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="sk_live_…"
                      className="pl-9 font-mono"
                      autoComplete="off"
                    />
                  </div>
                </Field>
              </div>
            )}
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
              <Lock /> Identifiants chiffrés (AES-256), hébergés en France. Révocable à tout moment.
            </p>
          </>
        )}

        {step === "working" && (
          <div className="py-6 text-center">
            <p className="text-sm font-medium">{oauth ? `Autorisation auprès de ${it.name}…` : "Vérification de la connexion…"}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Lecture des données de test et des droits accordés.</p>
          </div>
        )}

        {step === "done" && (
          <div className="py-2 text-center">
            <CircleCheck className="mx-auto size-8 text-success" />
            <p className="mt-3 text-sm font-medium">{it.name} est connecté</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Première synchronisation en cours. Léa utilisera ces données dès le prochain appel.
            </p>
          </div>
        )}

        {step === "manage" && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-subtle px-4 py-3 text-[13px]">
              <span className="flex items-center gap-2">
                <Badge tone="success" dot>
                  Connecté
                </Badge>
              </span>
              <span className="text-muted-foreground">{syncing ? "Synchronisation…" : "Dernière synchro il y a 4 min"}</span>
            </div>
            <ul className="grid gap-1.5 text-[13px]">
              {SCOPES[it.category].map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" /> {s}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSyncing(true);
                  setTimeout(() => setSyncing(false), 1400);
                }}
                disabled={syncing}
              >
                <RefreshCw className={syncing ? "animate-spin" : undefined} /> Synchroniser maintenant
              </Button>
              <Button variant="ghost" size="sm">
                <ExternalLink /> Journal d&apos;activité
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-subtle px-5 py-3">
        {step === "intro" && (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button size="sm" className="ml-auto" onClick={connect} disabled={!oauth && (!key.trim() || !account.trim())}>
              {oauth ? `Continuer avec ${it.name}` : "Vérifier et connecter"}
            </Button>
          </>
        )}
        {step === "working" && (
          <Button size="sm" className="ml-auto" disabled>
            <LoaderCircle className="animate-spin" /> Connexion…
          </Button>
        )}
        {step === "done" && (
          <Button size="sm" className="ml-auto" onClick={onClose}>
            Terminer
          </Button>
        )}
        {step === "manage" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger-soft hover:text-danger"
              onClick={() => {
                onDisconnect(it.id);
                onClose();
              }}
            >
              Déconnecter
            </Button>
            <Button size="sm" variant="outline" className="ml-auto" onClick={onClose}>
              Fermer
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
