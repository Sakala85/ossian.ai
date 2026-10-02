"use client";

import { ArrowLeft, Check, Hash, Info, LayoutDashboard, LoaderCircle, Mic, Network, Phone, PhoneForwarded, Power, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { Orb } from "@/components/voice/orb";
import type { DealershipProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { CopyButton, OptionCard, StepHeader } from "./shared";
import {
  AREA_NUMBERS,
  EASE,
  FORWARD_CODES,
  OSSIAN_NUMBER,
  lineNumber,
  slugify,
  summaryParts,
  type AreaCode,
  type GoLive,
  type LineMode,
} from "./lib";

const DEMO_HREF = "/demo?source=onboarding";

function CheckMark({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
        done ? "border-transparent bg-success-soft text-success" : "border-border-strong bg-card",
      )}
    >
      <AnimatePresence initial={false}>
        {done && (
          <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}>
            <Check className="size-3" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Line activation panels                                              */
/* ------------------------------------------------------------------ */

function ForwardPanel({ done, onToggle }: { done: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div>
          <p className="text-xs text-muted-foreground">Numéro Ossian de votre concession</p>
          <p className="mt-0.5 font-mono text-xl font-medium tracking-tight text-foreground tabular">{OSSIAN_NUMBER.display}</p>
        </div>
        <CopyButton value={OSSIAN_NUMBER.e164} label="Copier le numéro" showLabel />
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[460px] text-sm">
          <caption className="sr-only">Codes opérateur de renvoi d&apos;appel</caption>
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th scope="col" className="px-4 pt-3 pb-2 font-medium sm:px-5">
                Renvoi
              </th>
              <th scope="col" className="px-3 pt-3 pb-2 font-medium">
                Code à composer
              </th>
              <th scope="col" className="w-12 pt-3 pb-2">
                <span className="sr-only">Copier</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {FORWARD_CODES.map((r) => (
              <tr key={r.code}>
                <td className="px-4 py-3 sm:px-5">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    {r.label}
                    {r.recommended && <Badge tone="primary">Recommandé</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.hint}</p>
                </td>
                <td className="px-3 py-3">
                  <code className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-[13px] whitespace-nowrap text-foreground">{r.code}</code>
                </td>
                <td className="pr-3 text-right sm:pr-4">
                  <CopyButton value={r.code} label="Copier le code" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-start gap-3 border-t border-border p-4 text-[13px] text-muted-foreground sm:p-5">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          <span className="font-medium text-foreground">Standard téléphonique (3CX, Ringover, Aircall, Orange Business…) :</span> configurez un
          débordement vers ce numéro.
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-border bg-subtle p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-[13px] text-muted-foreground">Composez le code depuis la ligne de la concession, puis appelez-la depuis un mobile pour vérifier.</p>
        <Button variant={done ? "secondary" : "outline"} size="sm" onClick={onToggle} aria-pressed={done} className="self-start sm:self-auto">
          {done && <Check className="text-success" />}
          {done ? "Renvoi configuré" : "J'ai configuré le renvoi"}
        </Button>
      </div>
    </div>
  );
}

function NewNumberPanel({ area, onArea, done, onToggle }: { area: AreaCode; onArea: (a: AreaCode) => void; done: boolean; onToggle: () => void }) {
  const n = AREA_NUMBERS[area];
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Indicatif</p>
          <Segmented
            value={area}
            onChange={onArea}
            options={(Object.keys(AREA_NUMBERS) as AreaCode[]).map((a) => ({ value: a, label: <span className="font-mono tabular">{a}</span> }))}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{n.region}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Votre numéro dédié</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={area}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mt-0.5 font-mono text-xl font-medium tracking-tight text-foreground tabular"
            >
              {n.display}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-4 text-[13px] text-muted-foreground">
        Réservé 7 jours, actif dès la mise en production. Affichez-le sur votre site et votre fiche Google ; la portabilité de votre numéro historique
        reste possible ensuite.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton value={n.e164} label="Copier le numéro" showLabel />
        <Button variant={done ? "secondary" : "outline"} size="sm" onClick={onToggle} aria-pressed={done}>
          {done && <Check className="text-success" />}
          {done ? "Numéro publié" : "J'ai publié ce numéro"}
        </Button>
      </div>
    </div>
  );
}

function SipPanel({ slug, done, onToggle }: { slug: string; done: boolean; onToggle: () => void }) {
  const rows = [
    { k: "Serveur SIP", v: "sip.ossian.ai" },
    { k: "Ports", v: "5060 (UDP/TCP) · 5061 (TLS)" },
    { k: "Identifiant", v: `${slug}-trunk` },
    { k: "URI de destination", v: `sip:${slug}@sip.ossian.ai` },
    { k: "Codecs", v: "G.711 A-law, Opus" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <dl className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.k} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
            <dt className="w-32 shrink-0 text-xs text-muted-foreground sm:w-40">{r.k}</dt>
            <dd className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">{r.v}</dd>
            <CopyButton value={r.v} label={`Copier ${r.k.toLowerCase()}`} />
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3 border-t border-border bg-subtle p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-[13px] text-muted-foreground">
          Compatible 3CX, Ringover, Aircall, Orange Business Talk, Alcatel OXE, Asterisk. Le mot de passe est envoyé à l&apos;administrateur du compte.
        </p>
        <Button variant={done ? "secondary" : "outline"} size="sm" onClick={onToggle} aria-pressed={done} className="self-start sm:self-auto">
          {done && <Check className="text-success" />}
          {done ? "Trunk raccordé" : "J'ai raccordé le trunk"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Success                                                             */
/* ------------------------------------------------------------------ */

function LiveSuccess({ profile, golive, onRestart }: { profile: DealershipProfile; golive: GoLive; onRestart: () => void }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  const agent = profile.agent.name || "Votre agent";
  const number = lineNumber(golive);
  const langs = profile.agent.languages.length;
  const sentence =
    golive.mode === "sip"
      ? `Dès que votre standard débordera vers Ossian, ${agent} décrochera en moins d'une seconde, 24h/24, en ${langs} langues.`
      : golive.mode === "new_number"
        ? `Votre numéro dédié est actif : ${agent} décroche en moins d'une seconde, 24h/24, en ${langs} langues.`
        : `Chaque appel renvoyé vers Ossian est désormais décroché en moins d'une seconde, 24h/24, en ${langs} langues.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex flex-col items-center py-4 text-center sm:py-10"
    >
      <div className="relative">
        <div aria-hidden className="absolute -inset-16 bg-dots opacity-70 mask-radial" />
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: EASE }}>
          <Orb size={200} state="speaking" level={0.3} />
        </motion.div>
      </div>
      <Badge tone="success" className="mt-2">
        <LiveDot className="size-1.5" />
        En production
      </Badge>
      <h1 ref={ref} tabIndex={-1} className="mt-5 font-display text-[44px] font-medium text-balance text-foreground focus:outline-none sm:text-6xl">
        {agent} est <span className="font-serif-accent">en ligne</span>.
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{sentence}</p>
      {golive.mode !== "sip" && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-1 pl-4 shadow-soft">
          <Phone className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-sm text-foreground tabular">{number}</span>
          <CopyButton value={number.replace(/\s/g, "")} label="Copier le numéro" />
        </div>
      )}
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <LinkButton href="/app" size="lg">
          <LayoutDashboard />
          Ouvrir le tableau de bord
        </LinkButton>
        <LinkButton href={DEMO_HREF} size="lg" variant="outline">
          <Mic />
          Parler à {agent}
        </LinkButton>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="mt-8 rounded-md text-[13px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Configurer une autre concession
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Step                                                                */
/* ------------------------------------------------------------------ */

const LINE_LABEL: Record<LineMode, { label: string; todo: string; done: string }> = {
  forward: { label: "Renvoi configuré", todo: "Code opérateur à composer depuis la ligne de la concession.", done: "Renvoi actif vers Ossian." },
  new_number: { label: "Numéro publié", todo: "Affichez le numéro dédié sur votre site et Google.", done: "Numéro dédié communiqué." },
  sip: { label: "Trunk SIP raccordé", todo: "Débordement de votre standard vers Ossian.", done: "Trunk SIP raccordé." },
};

export function StepGoLive({
  profile,
  golive,
  onGoliveChange,
  onTest,
  onGoLive,
  onRestart,
  onBack,
}: {
  profile: DealershipProfile;
  golive: GoLive;
  onGoliveChange: (fn: (g: GoLive) => GoLive) => void;
  onTest: () => void;
  onGoLive: () => void;
  onRestart: () => void;
  onBack: () => void;
}) {
  const [activating, setActivating] = useState(false);
  const [sending, setSending] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  if (golive.live) return <LiveSuccess profile={profile} golive={golive} onRestart={onRestart} />;

  const agent = profile.agent.name || "votre agent";
  const recipients = profile.departments.filter((d) => d.email).length;
  const line = LINE_LABEL[golive.mode];
  const set = (patch: Partial<GoLive>) => onGoliveChange((g) => ({ ...g, ...patch }));

  const items: { id: string; label: string; hint: string; done: boolean; locked?: boolean; toggle?: () => void; action?: React.ReactNode }[] = [
    { id: "profile", label: "Profil vérifié", hint: summaryParts(profile).join(" · "), done: true, locked: true },
    {
      id: "tested",
      label: "Agent testé",
      hint: golive.tested ? `Appel test avec ${agent} effectué.` : "Un appel test de 30 secondes suffit.",
      done: golive.tested,
      toggle: () => set({ tested: !golive.tested }),
      action: !golive.tested && (
        <LinkButton href={DEMO_HREF} onClick={onTest} variant="outline" size="xs">
          Tester
        </LinkButton>
      ),
    },
    {
      id: "line",
      label: line.label,
      hint: golive.forwarded ? line.done : line.todo,
      done: golive.forwarded,
      toggle: () => set({ forwarded: !golive.forwarded }),
    },
    {
      id: "team",
      label: "Équipe notifiée",
      hint: golive.teamNotified
        ? `Annonce envoyée à ${recipients > 0 ? `${recipients} service${recipients > 1 ? "s" : ""}` : "l'équipe"}.`
        : `Prévenez vos conseillers que ${agent} décroche désormais.`,
      done: golive.teamNotified,
      toggle: () => set({ teamNotified: !golive.teamNotified }),
      action: !golive.teamNotified && (
        <Button
          variant="outline"
          size="xs"
          disabled={sending}
          onClick={() => {
            setSending(true);
            later(() => {
              setSending(false);
              set({ teamNotified: true });
            }, 900);
          }}
        >
          {sending ? <LoaderCircle className="animate-spin" /> : <Send />}
          {sending ? "Envoi…" : "Envoyer l'annonce"}
        </Button>
      ),
    },
  ];
  const remaining = items.filter((i) => !i.done).length;

  const activate = () => {
    setActivating(true);
    later(() => {
      setActivating(false);
      onGoLive();
    }, 1400);
  };

  return (
    <div>
      <StepHeader
        step={6}
        title={
          <>
            Testez, puis <span className="font-serif-accent">mettez en ligne</span>.
          </>
        }
        description="Votre agent est configuré et enregistré. Appelez-le comme le ferait un client, puis renvoyez vos appels vers Ossian."
      />

      {/* Talk to the agent ----------------------------------------- */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div aria-hidden className="absolute inset-y-0 right-0 w-2/3 bg-dots opacity-60 mask-radial" />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <Orb size={120} state="listening" level={0.15} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Recommandé avant la mise en ligne</p>
            <h2 className="mt-1.5 font-display text-[28px] font-medium text-balance text-foreground sm:text-[32px]">
              Parlez à {profile.agent.name || "votre agent"} <span className="font-serif-accent">maintenant</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Essayez : « Bonjour, je voudrais un rendez-vous pour une révision jeudi matin. »</p>
            <LinkButton href={DEMO_HREF} onClick={onTest} size="lg" className="mt-5 w-full sm:w-auto">
              <Mic />
              Parler à {profile.agent.name || "l'agent"}
            </LinkButton>
          </div>
        </div>
      </div>

      {/* Line activation ------------------------------------------- */}
      <section className="mt-12" aria-labelledby="ob-line">
        <h2 id="ob-line" className="text-lg font-medium tracking-tight text-foreground">
          Activer votre ligne
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Choisissez comment vos appels arrivent jusqu&apos;à {agent}.</p>
        <div role="radiogroup" aria-label="Mode d'activation" className="mt-4 grid gap-2.5">
          <OptionCard
            selected={golive.mode === "forward"}
            onSelect={() => set({ mode: "forward" })}
            icon={<PhoneForwarded />}
            title="Renvoi d'appel depuis votre ligne actuelle"
            badge={<Badge tone="primary">Recommandé</Badge>}
            description="Vous gardez votre numéro. Les appels non décrochés (ou tous) sont renvoyés vers Ossian — 2 minutes, sans intervention technique."
          />
          <OptionCard
            selected={golive.mode === "new_number"}
            onSelect={() => set({ mode: "new_number" })}
            icon={<Hash />}
            title="Nouveau numéro dédié"
            description="Un numéro local réservé pour Ossian, à afficher sur votre site et vos fiches Google."
          />
          <OptionCard
            selected={golive.mode === "sip"}
            onSelect={() => set({ mode: "sip" })}
            icon={<Network />}
            title="Connexion SIP"
            badge={<Badge>Avancé</Badge>}
            description="Raccordement direct de votre standard IPBX ou de votre trunk SIP."
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={golive.mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="mt-4"
          >
            {golive.mode === "forward" && <ForwardPanel done={golive.forwarded} onToggle={() => set({ forwarded: !golive.forwarded })} />}
            {golive.mode === "new_number" && (
              <NewNumberPanel area={golive.area} onArea={(area) => set({ area })} done={golive.forwarded} onToggle={() => set({ forwarded: !golive.forwarded })} />
            )}
            {golive.mode === "sip" && (
              <SipPanel slug={slugify(profile.name)} done={golive.forwarded} onToggle={() => set({ forwarded: !golive.forwarded })} />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Checklist -------------------------------------------------- */}
      <section className="mt-12 rounded-xl border border-border bg-card shadow-soft" aria-labelledby="ob-checklist">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <h2 id="ob-checklist" className="text-sm font-medium text-foreground">
            Avant la mise en ligne
          </h2>
          <span className="font-mono text-xs text-muted-foreground tabular">
            {items.length - remaining} / {items.length}
          </span>
        </div>
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <button
                type="button"
                role="checkbox"
                aria-checked={it.done}
                disabled={it.locked}
                onClick={it.toggle}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left disabled:cursor-default"
              >
                <CheckMark done={it.done} />
                <span className="min-w-0">
                  <span className="block text-sm text-foreground">{it.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{it.hint}</span>
                </span>
              </button>
              {it.action}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 flex flex-col-reverse gap-4 border-t border-border pt-6 sm:flex-row sm:items-start sm:justify-between">
        <Button variant="ghost" onClick={onBack} className="self-start">
          <ArrowLeft />
          Retour
        </Button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Button size="lg" onClick={activate} disabled={activating}>
            {activating ? <LoaderCircle className="animate-spin" /> : <Power />}
            {activating ? "Activation en cours…" : "Passer en production"}
          </Button>
          <p className="text-center text-xs text-muted-foreground sm:text-right" aria-live="polite">
            {remaining > 0
              ? `${remaining} point${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""} — vous pourrez les terminer depuis le tableau de bord.`
              : "Tout est prêt."}
          </p>
        </div>
      </div>
    </div>
  );
}
