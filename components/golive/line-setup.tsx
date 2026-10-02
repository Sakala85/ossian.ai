"use client";

import { Check, Info, PhoneCall } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/onboarding/shared";
import { Badge } from "@/components/ui/badge";
import { LiveDot } from "@/components/ui/misc";
import { forwardingCodes } from "@/lib/voice/forwarding";
import { cn } from "@/lib/utils";

const POLL_MS = 4000;
const POLL_FOR_MS = 45 * 60_000;

/**
 * Polls /api/onboarding/status until the dealership's number receives its first
 * call (recorded by the Vapi webhook), which proves the line is live.
 */
export function useFirstCall(initial: string | null, enabled = true) {
  const [firstCallAt, setFirstCallAt] = useState(initial);
  useEffect(() => {
    if (!enabled || firstCallAt) return;
    const started = Date.now();
    let stop = false;
    const tick = async () => {
      if (stop || document.hidden) return;
      try {
        const r = await fetch("/api/onboarding/status", { cache: "no-store" });
        const j = (await r.json()) as { firstCallAt?: string | null };
        if (!stop && j.firstCallAt) setFirstCallAt(j.firstCallAt);
      } catch {}
    };
    const id = setInterval(() => {
      if (Date.now() - started > POLL_FOR_MS) clearInterval(id);
      else void tick();
    }, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [enabled, firstCallAt]);
  return firstCallAt;
}

const timeFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" });

function when(iso: string) {
  const d = new Date(iso);
  const sameDay = dayFmt.format(d) === dayFmt.format(new Date());
  return sameDay ? `aujourd'hui à ${timeFmt.format(d)}` : `le ${dayFmt.format(d)} à ${timeFmt.format(d)}`;
}

/** "Waiting for the first call" → "Line live" banner. */
export function FirstCallStatus({ firstCallAt, agentName, className }: { firstCallAt: string | null; agentName: string; className?: string }) {
  return (
    <div aria-live="polite" className={cn("rounded-xl border px-4 py-3.5 transition-colors duration-500", firstCallAt ? "border-[color-mix(in_oklch,var(--success)_28%,transparent)] bg-success-soft" : "border-border bg-subtle", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {firstCallAt ? (
          <motion.div key="ok" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <Check className="size-4" strokeWidth={3} />
            </span>
            <div className="min-w-0 text-[13px] leading-relaxed">
              <p className="font-medium text-foreground">Ligne active : premier appel reçu {when(firstCallAt)}.</p>
              <p className="text-muted-foreground">{agentName} décroche désormais pour vous. Les comptes-rendus arrivent dans le tableau de bord.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="wait" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
            <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
              <PhoneCall className="size-3.5" />
              <span className="absolute -top-0.5 -right-0.5">
                <LiveDot />
              </span>
            </span>
            <div className="min-w-0 text-[13px] leading-relaxed">
              <p className="font-medium text-foreground">En attente du premier appel…</p>
              <p className="text-muted-foreground">
                Appelez votre numéro habituel depuis un portable et laissez sonner : si {agentName} décroche, tout est en place. Cet écran se met à
                jour tout seul.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The dealership's Ossian number plus the forwarding codes to dial. */
export function ForwardingSetup({ e164, display, className }: { e164: string; display: string; className?: string }) {
  const codes = forwardingCodes(e164);
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-soft", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div>
          <p className="text-xs text-muted-foreground">Votre numéro Ossian</p>
          <p className="mt-0.5 font-mono text-2xl font-medium tracking-tight text-foreground tabular">{display}</p>
        </div>
        <CopyButton value={display.replace(/\s/g, "")} label="Copier le numéro" showLabel />
      </div>
      <p className="px-4 pt-4 text-[13px] text-muted-foreground sm:px-5">
        Depuis le téléphone de la concession, composez <span className="font-medium text-foreground">un</span> de ces codes puis appuyez sur
        appel. Vous gardez votre numéro : seuls les appels renvoyés arrivent chez Ossian.
      </p>
      <ul className="mt-2 divide-y divide-border">
        {codes.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                {c.label}
                {c.recommended && <Badge tone="primary">Recommandé</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">{c.hint}</p>
              <code className="mt-1.5 inline-block rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[13px] text-foreground sm:hidden">
                {c.code}
              </code>
            </div>
            <code className="hidden rounded-md border border-border bg-muted px-2 py-1 font-mono text-[13px] whitespace-nowrap text-foreground sm:block">
              {c.code}
            </code>
            <CopyButton value={c.code} label="Copier le code" />
          </li>
        ))}
      </ul>
      <div className="flex items-start gap-3 border-t border-border bg-subtle p-4 text-[13px] text-muted-foreground sm:p-5">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          <span className="font-medium text-foreground">Ligne fixe ou standard (box, Orange Pro, 3CX, Ringover, Aircall…) :</span> créez un renvoi
          « sur non-réponse » vers {display} dans l&apos;espace client de l&apos;opérateur ou l&apos;administration du standard.
        </p>
      </div>
    </div>
  );
}
