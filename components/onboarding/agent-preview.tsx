"use client";

import { Building, Globe, Phone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { LiveDot } from "@/components/ui/misc";
import { Orb, type OrbState } from "@/components/voice/orb";
import { LANGUAGES, type DealershipProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { hostOf, voiceOf } from "./lib";

/** Value that softly re-enters whenever it changes — makes edits feel live. */
function Live({ value, className }: { value: string | number; className?: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={String(value)}
        initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22 }}
        className={cn("inline-block", className)}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

const TONE_LABEL = { chaleureux: "chaleureux", professionnel: "professionnel", dynamique: "dynamique" } as const;

export function AgentPreview({
  profile,
  displayName,
  greeting,
  ready,
  analyzing,
  orbState,
  live,
  line,
}: {
  profile: DealershipProfile;
  /** Name shown before the profile exists (typed name or derived from URL). */
  displayName: string;
  greeting: string;
  ready: boolean;
  analyzing: boolean;
  orbState: OrbState;
  live: boolean;
  line?: string;
}) {
  const a = profile.agent;
  const voice = voiceOf(a.voiceId);
  const langs = a.languages;
  const host = hostOf(profile.website);
  const stats = [
    { label: "Sites", value: profile.sites.length },
    { label: "Prestations", value: profile.services.length },
    { label: "Services", value: profile.departments.length },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Aperçu de l&apos;agent</span>
        {live ? (
          <Badge tone="success">
            <LiveDot className="size-1.5" />
            En ligne
          </Badge>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Mise à jour en direct
          </span>
        )}
      </div>

      <div className="relative flex flex-col items-center px-5 pt-5 pb-5 text-center">
        <div aria-hidden className="absolute inset-0 bg-dots opacity-60 mask-radial" />
        <Orb size={112} state={orbState} level={orbState === "speaking" ? 0.55 : 0.2} className="relative" />
        <p className="relative mt-2 text-lg font-medium tracking-tight text-foreground">
          <Live value={a.name || "Votre agent"} />
        </p>
        <p className="relative mt-0.5 text-xs text-muted-foreground">
          <Live value={`Voix ${voice.name} · ton ${TONE_LABEL[a.tone]}`} />
        </p>
        <div className="relative mt-3 flex flex-wrap justify-center gap-1" aria-label={`${langs.length} langues`}>
          {langs.slice(0, 7).map((l) => (
            <motion.span
              key={l}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              title={LANGUAGES[l]?.label}
              className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-card px-1 text-[13px] leading-none"
            >
              {LANGUAGES[l]?.flag ?? l}
            </motion.span>
          ))}
          {langs.length > 7 && (
            <span className="inline-flex h-6 items-center rounded-md border border-border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
              +{langs.length - 7}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Message d&apos;accueil</p>
        <p className="text-[13px] leading-relaxed text-pretty text-foreground">« {greeting} »</p>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-border border-t border-border">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse px-3 py-3 text-center">
            <dt className="text-[11px] text-muted-foreground">{s.label}</dt>
            <dd className="relative font-mono text-lg font-medium text-foreground tabular">
              {ready ? (
                <Live value={s.value} />
              ) : analyzing ? (
                <span className="mx-auto block h-5 w-6 animate-pulse rounded bg-muted" />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-1.5 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-2">
          <Building className="size-3.5 shrink-0" />
          <span className="truncate">{displayName || "Votre concession"}</span>
        </span>
        {host && (
          <span className="flex min-w-0 items-center gap-2">
            <Globe className="size-3.5 shrink-0" />
            <span className="truncate font-mono">{host}</span>
          </span>
        )}
        {line && (
          <span className="flex min-w-0 items-center gap-2">
            <Phone className="size-3.5 shrink-0" />
            <span className="truncate font-mono tabular">{line}</span>
          </span>
        )}
      </div>
    </div>
  );
}
