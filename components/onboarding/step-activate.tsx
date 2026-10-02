"use client";

import { ArrowLeft, Building, Check, Clock, KeyRound, LayoutDashboard, LoaderCircle, Mic, PencilLine, Phone, Power, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { FirstCallStatus, ForwardingSetup, useFirstCall } from "@/components/golive/line-setup";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Orb } from "@/components/voice/orb";
import type { DealershipProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Callout, CopyButton, FormField, StepHeader } from "./shared";
import { EASE, hostOf, plural, voiceOf, type Activation, type GoLive, type ProfileSource, type StepId } from "./lib";

const DEMO_HREF = "/demo?source=onboarding";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PROGRESS = ["Création de votre compte", "Attribution de votre numéro", `Mise en ligne de l'agent`];

const ERRORS: Record<string, string> = {
  invalid_email: "Cette adresse e-mail ne semble pas valide.",
  rate_limited: "Trop de tentatives depuis cette connexion. Réessayez dans une heure.",
  invalid_profile: "Le profil de la concession est incomplet : vérifiez le nom à l'étape « Vérification ».",
};

/* ------------------------------------------------------------------ */
/* Recap                                                               */
/* ------------------------------------------------------------------ */

function RecapRow({ icon, label, value, onEdit }: { icon: React.ReactNode; label: string; value: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{value}</div>
      </div>
      {onEdit && (
        <Button variant="ghost" size="xs" onClick={onEdit} className="text-muted-foreground">
          <PencilLine /> Modifier
        </Button>
      )}
    </div>
  );
}

/** Information the agent needs to answer well, still missing from the profile. */
export function missingInfo(p: DealershipProfile) {
  const missing: string[] = [];
  if (!p.hours.length) missing.push("vos horaires");
  if (!p.services.length) missing.push("vos prestations");
  if (!p.sites.some((s) => s.phone.trim()) && !p.departments.some((d) => d.phone.trim())) missing.push("les numéros de vos services");
  return missing;
}

function Recap({ profile, onEdit }: { profile: DealershipProfile; onEdit: (s: StepId) => void }) {
  const a = profile.agent;
  const host = hostOf(profile.website);
  const cities = [...new Set(profile.sites.map((s) => s.city).filter(Boolean))];
  const hours = profile.hours[0];
  const missing = missingInfo(profile);
  return (
    <>
    {missing.length > 0 && (
      <Callout tone="warning" className="mb-3">
        <p>
          <span className="font-medium">À compléter :</span> {missing.join(", ")}. Sans ces informations, {a.name} prend les messages mais ne peut
          pas renseigner vos clients.{" "}
          <button type="button" onClick={() => onEdit(3)} className="font-medium text-foreground underline underline-offset-4">
            Compléter maintenant
          </button>
        </p>
      </Callout>
    )}
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <RecapRow
        icon={<Building />}
        label="Concession"
        value={
          <>
            <span className="font-medium">{profile.name || "Sans nom"}</span>
            {host && <span className="text-muted-foreground"> · {host}</span>}
            <span className="block text-[13px] text-muted-foreground">
              {[plural(profile.sites.length, "site"), cities.slice(0, 3).join(", "), plural(profile.services.length, "prestation")]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </>
        }
        onEdit={() => onEdit(3)}
      />
      <RecapRow
        icon={<Clock />}
        label="Horaires"
        value={
          hours ? (
            <span className="text-[13px]">
              {hours.label} : {hours.value}
              {profile.hours.length > 1 && <span className="text-muted-foreground"> · +{profile.hours.length - 1}</span>}
            </span>
          ) : (
            <span className="text-[13px] text-muted-foreground">Non renseignés</span>
          )
        }
        onEdit={() => onEdit(3)}
      />
      <RecapRow
        icon={<Mic />}
        label="Votre agent"
        value={
          <>
            <span className="font-medium">{a.name}</span>
            <span className="text-muted-foreground">
              {" "}
              · voix {voiceOf(a.voiceId).name} · {plural(a.languages.length, "langue")}
            </span>
            <span className="mt-1 block text-[13px] leading-relaxed text-pretty text-muted-foreground">« {a.greeting} »</span>
          </>
        }
        onEdit={() => onEdit(4)}
      />
    </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Success                                                             */
/* ------------------------------------------------------------------ */

function Success({ profile, activation, onRestart }: { profile: DealershipProfile; activation: Activation; onRestart: () => void }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  const agent = profile.agent.name || "Votre agent";
  const { phone } = activation;
  const firstCallAt = useFirstCall(null, Boolean(phone) && !activation.demo);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
      <div className="flex flex-col items-center pb-8 text-center sm:pt-4">
        <div className="relative">
          <div aria-hidden className="absolute -inset-16 bg-dots opacity-70 mask-radial" />
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: EASE }}>
            <Orb size={150} state={firstCallAt ? "speaking" : "listening"} level={0.25} />
          </motion.div>
        </div>
        <Badge tone="success" className="mt-2">
          <Check />
          {activation.demo ? "Agent configuré (démo)" : "Compte activé"}
        </Badge>
        <h1 ref={ref} tabIndex={-1} className="mt-4 font-display text-[40px] font-medium text-balance text-foreground focus:outline-none sm:text-[52px]">
          {agent} est <span className="font-serif-accent">prête</span>.
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {activation.demo
            ? "Ce site de démonstration n'est pas relié à une base de données : votre agent est enregistré dans ce navigateur. Testez-le dès maintenant."
            : phone
              ? "Dernière étape : renvoyez vos appels vers votre numéro Ossian. Dès le premier appel, cet écran passe au vert."
              : `Votre numéro est en cours d'attribution : vous le recevrez par e-mail à ${activation.email}, avec les codes de renvoi.`}
        </p>
      </div>

      {phone && !activation.demo && (
        <div className="grid gap-3">
          <ForwardingSetup e164={phone.e164} display={phone.display} />
          <FirstCallStatus firstCallAt={firstCallAt} agentName={agent} />
        </div>
      )}

      {activation.accessUrl && (
        <section aria-labelledby="ob-access" className="mt-6 rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <h2 id="ob-access" className="text-sm font-medium text-foreground">
                Votre accès au tableau de bord
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Ce navigateur est déjà connecté. Gardez ce lien privé pour ouvrir le tableau de bord sur un autre appareil
                {activation.emailSent ? ` (envoyé aussi à ${activation.email})` : ""}.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted py-1 pr-1 pl-3">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{activation.accessUrl}</span>
                <CopyButton value={activation.accessUrl} label="Copier le lien" />
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <LinkButton href="/app" size="lg">
          <LayoutDashboard />
          Ouvrir le tableau de bord
        </LinkButton>
        <LinkButton href={DEMO_HREF} size="lg" variant="outline">
          <Mic />
          Parler à {agent}
        </LinkButton>
      </div>
      <p className="mt-8 text-center">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-md text-[13px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Configurer une autre concession
        </button>
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Step                                                                */
/* ------------------------------------------------------------------ */

export function StepActivate({
  profile,
  source,
  golive,
  onGoliveChange,
  onActivated,
  tools,
  onEdit,
  onRestart,
  onBack,
}: {
  profile: DealershipProfile;
  source: ProfileSource | null;
  golive: GoLive;
  onGoliveChange: (fn: (g: GoLive) => GoLive) => void;
  onActivated: (a: Activation) => void;
  /** DMS / CRM declared at step 5, passed on to the Ossian team. */
  tools?: { dms?: string; crm?: string };
  onEdit: (s: StepId) => void;
  onRestart: () => void;
  onBack: () => void;
}) {
  const ids = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const agent = profile.agent.name || "votre agent";
  const sitePhone = profile.sites.find((s) => s.phone)?.phone ?? "";

  // Pre-fill the transfer number with the dealership's main line.
  useEffect(() => {
    if (!golive.fallback && sitePhone) onGoliveChange((g) => ({ ...g, fallback: sitePhone }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setPhase((p) => Math.min(p + 1, PROGRESS.length - 1)), 900);
    return () => clearInterval(t);
  }, [busy]);

  if (golive.live && golive.activation) return <Success profile={profile} activation={golive.activation} onRestart={onRestart} />;

  const set = (patch: Partial<GoLive>) => onGoliveChange((g) => ({ ...g, ...patch }));

  const activate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const email = golive.email.trim();
    if (!EMAIL_RE.test(email)) {
      setEmailError(email ? ERRORS.invalid_email! : "Indiquez l'adresse où recevoir les comptes-rendus d'appels.");
      emailRef.current?.focus();
      return;
    }
    setEmailError(null);
    setError(null);
    setPhase(0);
    setBusy(true);
    const started = Date.now();
    try {
      const res = await fetch("/api/onboarding/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fallback: golive.fallback.trim() || undefined,
          source: source === "ai" ? "ai" : "manual",
          tools,
          profile,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as Partial<Activation> & { error?: string; ok?: boolean };
      // Let the progress read naturally even when the server is fast.
      await new Promise((r) => setTimeout(r, Math.max(0, 2000 - (Date.now() - started))));
      if (res.ok && j.ok) {
        onActivated({
          email,
          phone: j.phone ?? null,
          fallback: j.fallback ?? null,
          accessUrl: j.accessUrl ?? null,
          emailSent: Boolean(j.emailSent),
          demo: false,
        });
      } else if (res.status === 503 && j.error === "not_configured") {
        onActivated({ email, phone: null, fallback: null, accessUrl: null, emailSent: false, demo: true });
      } else if (j.error === "invalid_email") {
        setEmailError(ERRORS.invalid_email!);
        emailRef.current?.focus();
      } else {
        setError(ERRORS[j.error ?? ""] ?? "L'activation n'a pas abouti. Réessayez dans un instant : rien n'a été créé en double.");
      }
    } catch {
      setError("Connexion interrompue. Vérifiez votre accès internet puis réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <StepHeader
        step={6}
        title={
          <>
            Activez {agent} en <span className="font-serif-accent">un clic</span>.
          </>
        }
        description={`${source === "ai" ? `${profile.agent.name || "Votre agent"} est configurée à partir de votre site. ` : ""}Indiquez où recevoir les comptes-rendus : nous créons votre compte et votre ligne immédiatement.`}
      />

      <Recap profile={profile} onEdit={onEdit} />

      <form onSubmit={activate} noValidate className="mt-6 rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id={`${ids}-email`}
            label="E-mail professionnel"
            hint="Comptes-rendus d'appels, demandes de RDV et leads arrivent ici."
            error={emailError}
          >
            <Input
              ref={emailRef}
              id={`${ids}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="vous@concession.fr"
              value={golive.email}
              onChange={(e) => set({ email: e.target.value })}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? `${ids}-email-error` : undefined}
              disabled={busy}
            />
          </FormField>
          <FormField
            id={`${ids}-fallback`}
            label="Numéro pour les transferts"
            optional
            hint={`Quand un client demande un conseiller, ${agent} transfère ici.`}
          >
            <Input
              id={`${ids}-fallback`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="04 72 00 00 00"
              value={golive.fallback}
              onChange={(e) => set({ fallback: e.target.value })}
              disabled={busy}
            />
          </FormField>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Callout tone="warning" className="mt-4">
                <span role="alert">{error}</span>
              </Callout>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <ul className="grid gap-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-success" /> Vous gardez votre numéro actuel
            </li>
            <li className="flex items-center gap-1.5">
              <Phone className="size-3.5 text-success" /> Désactivable à tout moment depuis votre téléphone
            </li>
          </ul>
          <Button type="submit" size="lg" disabled={busy} className="relative min-w-[220px]">
            {busy ? <LoaderCircle className="animate-spin" /> : <Power />}
            {busy ? PROGRESS[phase] : `Activer ${agent}`}
          </Button>
        </div>
        <p className="sr-only" aria-live="polite">
          {busy ? `${PROGRESS[phase]}…` : ""}
        </p>
      </form>

      <div className={cn("mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between")}>
        <Button variant="ghost" onClick={onBack} className="self-start" disabled={busy}>
          <ArrowLeft />
          Retour
        </Button>
        <LinkButton href={DEMO_HREF} variant="outline" className="self-start sm:self-auto">
          <Mic />
          Parler à {agent} avant d&apos;activer
        </LinkButton>
      </div>
    </div>
  );
}
