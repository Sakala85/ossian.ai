"use client";

import { CalendarCheck, CircleCheck, Hourglass, KeyRound, LoaderCircle, Mail, Send, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DEPARTMENTS, type DealershipProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Callout, Mono, OptionCard, RadioDot, StepActions, StepHeader } from "./shared";
import {
  CALENDAR_PROVIDERS,
  CRM_PROVIDERS,
  DMS_PROVIDERS,
  EASE,
  hostOf,
  type BookingProviderId,
  type Connections,
  type CrmId,
  type LinkStatus,
  type Provider,
  type UpdateProfile,
} from "./lib";

function StatusBadge({ status }: { status?: LinkStatus }) {
  if (status === "connected")
    return (
      <Badge tone="success" dot>
        Connecté
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge tone="warning" dot>
        En attente de validation éditeur
      </Badge>
    );
  return <Badge>Non connecté</Badge>;
}

/** Fake async action (OAuth / API key check) with a short, believable delay. */
function useFakeAction() {
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const run = (fn: () => void, ms = 1100) => {
    setBusy(true);
    timer.current = setTimeout(() => {
      setBusy(false);
      fn();
    }, ms);
  };
  return { busy, run };
}

function ProviderTile<T extends string>({
  provider,
  selected,
  status,
  onSelect,
}: {
  provider: Provider<T>;
  selected: boolean;
  status?: LinkStatus;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg border bg-card p-3 text-left transition-[border-color,box-shadow,background-color] duration-150",
        selected ? "border-primary shadow-[0_0_0_3px_var(--primary-soft)]" : "border-border hover:border-border-strong hover:bg-subtle",
      )}
    >
      <Mono>{provider.mono}</Mono>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-foreground">{provider.name}</span>
        <span
          className={cn(
            "block truncate text-[11px]",
            status === "connected"
              ? "text-success"
              : status === "pending"
                ? "text-[color-mix(in_oklch,var(--warning)_75%,var(--foreground))]"
                : "text-muted-foreground",
          )}
        >
          {status === "connected" ? "Connecté" : status === "pending" ? "En attente" : provider.kind === "dms" ? "DMS" : provider.kind === "calendar" ? "Agenda" : "CRM"}
        </span>
      </span>
    </button>
  );
}

function DmsPanel({ provider, status, onStatus }: { provider: Provider<BookingProviderId>; status?: LinkStatus; onStatus: (s?: LinkStatus) => void }) {
  const ids = useId();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const action = useFakeAction();

  const connect = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim().length < 8) {
      setError("Clé invalide : 8 caractères minimum.");
      return;
    }
    setError(null);
    action.run(() => onStatus("connected"));
  };

  return (
    <div className="rounded-xl border border-border bg-subtle p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Connecter {provider.name}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            L&apos;agent lit le planning atelier et crée les rendez-vous directement dans {provider.name}.
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === "connected" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
          <p className="flex items-center gap-2 text-[13px] text-foreground">
            <CircleCheck className="size-4 text-success" />
            Connexion vérifiée · planning synchronisé toutes les 2 minutes
          </p>
          <Button variant="ghost" size="xs" onClick={() => onStatus(undefined)}>
            Déconnecter
          </Button>
        </div>
      )}

      {status === "pending" && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-card p-3">
          <Hourglass className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--warning)_75%,var(--foreground))]" />
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="text-foreground">Demande d&apos;accès API envoyée à {provider.name}.</p>
            <p className="mt-0.5 text-muted-foreground">
              Délai habituel : 2 à 5 jours ouvrés. D&apos;ici là, les rendez-vous sont notés dans l&apos;agenda Ossian et envoyés par e-mail.
            </p>
            <Button variant="ghost" size="xs" className="mt-2 -ml-2.5" onClick={() => onStatus(undefined)}>
              Annuler la demande
            </Button>
          </div>
        </div>
      )}

      {!status && (
        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <form onSubmit={connect} className="grid content-start gap-1.5">
            <Label htmlFor={`${ids}-key`}>Clé API {provider.name}</Label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id={`${ids}-key`}
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={key}
                  placeholder="••••••••••••"
                  aria-invalid={!!error}
                  className="pl-8 font-mono text-[13px]"
                  onChange={(e) => {
                    setKey(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>
              <Button type="submit" variant="inverted" disabled={action.busy}>
                {action.busy ? <LoaderCircle className="animate-spin" /> : null}
                {action.busy ? "Vérification" : "Connecter"}
              </Button>
            </div>
            {error ? <p className="text-xs text-danger">{error}</p> : <p className="text-xs text-muted-foreground">Disponible dans l&apos;espace administrateur de votre DMS.</p>}
          </form>
          <div className="flex items-center gap-3 text-xs text-muted-foreground sm:flex-col sm:pt-6">
            <span className="h-px flex-1 bg-border sm:h-auto sm:w-px" />
            ou
            <span className="h-px flex-1 bg-border sm:h-auto sm:w-px" />
          </div>
          <div className="grid content-start gap-1.5">
            <p className="text-[13px] font-medium text-foreground">Pas de clé API ?</p>
            <Button variant="outline" onClick={() => onStatus("pending")} className="justify-start">
              <Send />
              Demander l&apos;accès à votre éditeur
            </Button>
            <p className="text-xs text-muted-foreground">Nous gérons la demande avec {provider.name} pour vous.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function OAuthPanel({
  provider,
  status,
  onStatus,
  description,
}: {
  provider: Provider<string>;
  status?: LinkStatus;
  onStatus: (s?: LinkStatus) => void;
  description: string;
}) {
  const action = useFakeAction();
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-subtle p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{provider.name}</p>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      </div>
      {status === "connected" ? (
        <Button variant="ghost" size="sm" onClick={() => onStatus(undefined)} className="self-start sm:self-auto">
          Déconnecter
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={action.busy} onClick={() => action.run(() => onStatus("connected"))} className="self-start sm:self-auto">
          {action.busy ? <LoaderCircle className="animate-spin" /> : <Mono className="size-4.5 rounded border-0 bg-transparent text-[9px]">{provider.mono}</Mono>}
          {action.busy ? "Connexion…" : `Se connecter avec ${provider.name.split(" ")[0]}`}
        </Button>
      )}
    </div>
  );
}

export function StepConnect({
  profile,
  update,
  connections,
  onConnectionsChange,
  onBack,
  onNext,
}: {
  profile: DealershipProfile;
  update: UpdateProfile;
  connections: Connections;
  onConnectionsChange: (fn: (c: Connections) => Connections) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const ids = useId();
  const c = connections;
  const host = hostOf(profile.website) || "votre-concession.fr";
  const setStatus = (id: BookingProviderId | CrmId, s?: LinkStatus) =>
    onConnectionsChange((x) => {
      const status = { ...x.status };
      if (s) status[id] = s;
      else delete status[id];
      return { ...x, status };
    });
  const dms = DMS_PROVIDERS.find((p) => p.id === c.booking);
  const cal = CALENDAR_PROVIDERS.find((p) => p.id === c.booking);
  const crm = CRM_PROVIDERS.find((p) => p.id === c.crm && p.id !== "none");

  return (
    <div>
      <StepHeader
        step={5}
        title={
          <>
            Connectez <span className="font-serif-accent">vos outils</span>.
          </>
        }
        description="Pour que chaque rendez-vous et chaque lead arrive au bon endroit. Tout est facultatif."
      />

      <Callout tone="success" icon={<ShieldCheck />} className="mb-5">
        <span className="font-medium">Rien ici ne bloque la mise en ligne.</span> Par défaut, les rendez-vous sont notés dans l&apos;agenda Ossian et
        envoyés par e-mail. Vous pourrez terminer ces connexions plus tard depuis Intégrations.
      </Callout>

      <div className="grid gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-medium tracking-tight text-foreground">Prise de rendez-vous</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Où l&apos;agent écrit les rendez-vous atelier qu&apos;il prend.</p>

          <div role="radiogroup" aria-label="Outil de prise de rendez-vous" className="mt-4 grid gap-5">
            <OptionCard
              selected={c.booking === "ossian"}
              onSelect={() => onConnectionsChange((x) => ({ ...x, booking: "ossian" }))}
              icon={<CalendarCheck />}
              title="Agenda Ossian intégré"
              badge={<Badge tone="primary">Sans intégration</Badge>}
              description="Créneaux par service, rendez-vous visibles dans le tableau de bord et envoyés par e-mail à vos conseillers."
            />

            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Logiciel DMS</p>
              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
                {DMS_PROVIDERS.map((p) => (
                  <ProviderTile
                    key={p.id}
                    provider={p}
                    selected={c.booking === p.id}
                    status={c.status[p.id]}
                    onSelect={() => onConnectionsChange((x) => ({ ...x, booking: p.id }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Agenda en ligne</p>
              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
                {CALENDAR_PROVIDERS.map((p) => (
                  <ProviderTile
                    key={p.id}
                    provider={p}
                    selected={c.booking === p.id}
                    status={c.status[p.id]}
                    onSelect={() => onConnectionsChange((x) => ({ ...x, booking: p.id }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence initial={false} mode="wait">
            {(dms || cal) && (
              <motion.div
                key={c.booking}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="pt-5">
                  {dms ? (
                    <DmsPanel provider={dms} status={c.status[dms.id]} onStatus={(s) => setStatus(dms.id, s)} />
                  ) : cal ? (
                    <OAuthPanel
                      provider={cal}
                      status={c.status[cal.id]}
                      onStatus={(s) => setStatus(cal.id, s)}
                      description="L'agent crée les rendez-vous dans l'agenda partagé de votre atelier (ex. « Atelier — RDV »)."
                    />
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium tracking-tight text-foreground">CRM</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Les projets d&apos;achat qualifiés deviennent des leads dans votre CRM.</p>
            </div>
            <span className="text-xs text-muted-foreground">facultatif</span>
          </div>
          <div role="radiogroup" aria-label="CRM" className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
            {CRM_PROVIDERS.map((p) =>
              p.id === "none" ? (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={c.crm === "none"}
                  onClick={() => onConnectionsChange((x) => ({ ...x, crm: "none" }))}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-card p-3 text-left text-[13px] font-medium transition-[border-color,box-shadow,background-color] duration-150",
                    c.crm === "none" ? "border-primary shadow-[0_0_0_3px_var(--primary-soft)]" : "border-border hover:border-border-strong hover:bg-subtle",
                  )}
                >
                  <RadioDot selected={c.crm === "none"} />
                  Aucun CRM
                </button>
              ) : (
                <ProviderTile
                  key={p.id}
                  provider={p}
                  selected={c.crm === p.id}
                  status={c.status[p.id]}
                  onSelect={() => onConnectionsChange((x) => ({ ...x, crm: p.id }))}
                />
              ),
            )}
          </div>
          <AnimatePresence initial={false} mode="wait">
            {crm && (
              <motion.div
                key={crm.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <OAuthPanel
                    provider={crm}
                    status={c.status[crm.id]}
                    onStatus={(s) => setStatus(crm.id, s)}
                    description="Création des leads VN / VO, des tâches de rappel et de l'historique d'appel."
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium tracking-tight text-foreground">Notifications</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Le résumé de chaque appel est envoyé au bon service.</p>

          {profile.departments.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {profile.departments.map((d, i) => {
                const fid = `${ids}-mail-${i}`;
                return (
                  <div key={i} className="grid gap-1.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-3">
                    <Label htmlFor={fid} className="truncate font-normal text-muted-foreground">
                      {d.label || DEPARTMENTS[d.key]}
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input
                        id={fid}
                        type="email"
                        autoComplete="off"
                        value={d.email ?? ""}
                        placeholder={`${d.key.replace("_", "-")}@${host}`}
                        className="pl-8"
                        onChange={({ target: { value } }) => update((p) => void (p.departments[i]!.email = value || undefined))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-[13px] text-muted-foreground">
              Ajoutez vos services à l&apos;étape Vérification pour router les notifications.
            </p>
          )}

          <div className="mt-5 divide-y divide-border border-t border-border">
            {(
              [
                { key: "slack", name: "Slack", mono: "SL" },
                { key: "teams", name: "Microsoft Teams", mono: "MT" },
              ] as const
            ).map((t) => (
              <label key={t.key} className="flex cursor-pointer items-center gap-3 py-3.5 last:pb-0">
                <Mono>{t.mono}</Mono>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-foreground">{t.name}</span>
                  <span className="block text-[13px] text-muted-foreground">Alertes en temps réel : leads chauds, réclamations, rappels urgents.</span>
                </span>
                <Switch
                  checked={c[t.key]}
                  label={`Alertes ${t.name}`}
                  onCheckedChange={(v) => onConnectionsChange((x) => ({ ...x, [t.key]: v }))}
                />
              </label>
            ))}
          </div>
        </Card>
      </div>

      <StepActions
        onBack={onBack}
        onNext={onNext}
        extra={
          <Button variant="ghost" onClick={onNext} className="w-full sm:w-auto">
            Terminer plus tard
          </Button>
        }
      />
    </div>
  );
}
