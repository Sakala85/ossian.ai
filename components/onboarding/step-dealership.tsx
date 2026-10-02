"use client";

import { ArrowRight, Check, Clock, Globe, History, Lock, MapPin, PhoneForwarded, Sparkles, Tags, Wrench, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Kbd } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { EASE, SITES_BUCKETS, STEPS, TOTAL_STEPS, nameFromUrl, normalizeUrl, timeAgo, type Draft, type StartInput } from "./lib";

const EXTRACTS = [
  { icon: MapPin, label: "Sites et adresses" },
  { icon: Clock, label: "Horaires par service" },
  { icon: Wrench, label: "Prestations et tarifs" },
  { icon: PhoneForwarded, label: "Numéros de transfert" },
  { icon: Tags, label: "Marques" },
];

export function StepDealership({
  input,
  onInputChange,
  onStart,
  onSkip,
  resume,
  onResume,
  onDismissResume,
}: {
  input: StartInput;
  onInputChange: (next: StartInput) => void;
  onStart: (input: StartInput & { url: string }) => void;
  onSkip: () => void;
  resume: Draft | null;
  onResume: () => void;
  onDismissResume: () => void;
}) {
  const ids = useId();
  const urlId = `${ids}-url`;
  const urlRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const normalized = normalizeUrl(input.url);
  const derivedName = normalized ? nameFromUrl(normalized) : "";

  useEffect(() => {
    // Autofocus on larger screens only (avoids popping the keyboard on phones).
    if (window.matchMedia("(min-width: 768px)").matches) urlRef.current?.focus({ preventScroll: true });
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.url.trim()) {
      setError("Indiquez l'adresse de votre site web.");
      urlRef.current?.focus();
      return;
    }
    if (!normalized) {
      setError("Cette adresse ne semble pas valide. Exemple : garage-dupont.fr");
      urlRef.current?.focus();
      return;
    }
    onStart({ ...input, url: normalized });
  };

  return (
    <div>
      {resume && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="mb-8 flex items-center gap-3 rounded-xl border border-border bg-card p-3 pl-4 shadow-soft"
        >
          <History className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">
              Reprendre la configuration{resume.profile.name ? ` de ${resume.profile.name}` : ""}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {STEPS.find((s) => s.id === resume.step)?.label} · étape {resume.step} sur {TOTAL_STEPS} · enregistrée {timeAgo(resume.savedAt)}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onResume}>
            Reprendre
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Ignorer" onClick={onDismissResume}>
            <X />
          </Button>
        </motion.div>
      )}

      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-soft">
        <Sparkles className="size-3.5 text-primary" />
        Configuration automatique depuis votre site
      </p>
      <h1 className="font-display text-[40px] font-medium text-balance text-foreground sm:text-5xl md:text-[64px]">
        Créons votre agent en <span className="font-serif-accent">2 minutes</span>.
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground sm:text-base">
        Indiquez le site de votre concession. Ossian en extrait vos sites, horaires, prestations et services, puis configure un
        agent prêt à décrocher — que vous pourrez appeler tout de suite.
      </p>

      <form onSubmit={submit} noValidate className="mt-10 grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor={urlId}>Site web de la concession</Label>
          <div
            className={cn(
              "flex h-14 items-center gap-3 rounded-xl border bg-card px-4 shadow-soft transition-[border-color,box-shadow] focus-within:ring-4",
              error
                ? "border-danger focus-within:ring-danger-soft"
                : "border-input focus-within:border-primary focus-within:ring-primary-soft",
            )}
          >
            <Globe className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={urlRef}
              id={urlId}
              type="text"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="garage-dupont.fr"
              value={input.url}
              onChange={(e) => {
                onInputChange({ ...input, url: e.target.value });
                if (error) setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby={error ? `${urlId}-error` : `${urlId}-hint`}
              className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:outline-none sm:text-[17px]"
            />
            {normalized && !error && (
              <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex size-5 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="size-3" strokeWidth={3} />
              </motion.span>
            )}
          </div>
          {error ? (
            <p id={`${urlId}-error`} role="alert" className="text-xs text-danger">
              {error}
            </p>
          ) : (
            <p id={`${urlId}-hint`} className="min-h-4 truncate font-mono text-xs text-muted-foreground">
              {normalized ?? "Exemple : garage-dupont.fr ou www.concession-lyon.com"}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid content-start gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={`${ids}-name`}>Nom de la concession</Label>
              <span className="text-xs text-muted-foreground">facultatif</span>
            </div>
            <Input
              id={`${ids}-name`}
              value={input.name}
              autoComplete="organization"
              placeholder={derivedName || "Garage Dupont"}
              onChange={(e) => onInputChange({ ...input, name: e.target.value })}
            />
          </div>
          <div className="grid content-start gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-medium text-foreground" id={`${ids}-sites`}>
                Nombre de sites
              </span>
              <span className="text-xs text-muted-foreground">facultatif</span>
            </div>
            <div role="radiogroup" aria-labelledby={`${ids}-sites`} className="grid h-9.5 grid-cols-4 gap-0.5 rounded-[10px] border border-border bg-muted p-0.5">
              {SITES_BUCKETS.map((b) => {
                const on = input.sites === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onInputChange({ ...input, sites: on ? null : b.value })}
                    className={cn(
                      "rounded-lg font-mono text-[13px] transition-all tabular",
                      on
                        ? "bg-card text-foreground shadow-[0_1px_2px_0_oklch(0_0_0/8%),0_0_0_1px_var(--border)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row-reverse sm:items-center sm:justify-between">
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Analyser mon site
            <ArrowRight />
            <Kbd className="ml-1 hidden border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/85 sm:inline-flex">↵</Kbd>
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="self-center rounded-md text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:self-auto"
          >
            Je n&apos;ai pas de site web
          </button>
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" />
          Nous lisons uniquement les pages publiques de votre site.
        </p>
      </form>

      <div className="mt-12 border-t border-border pt-6">
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">Ce que nous récupérons</p>
        <ul className="flex flex-wrap gap-2">
          {EXTRACTS.map(({ icon: Icon, label }, i) => (
            <motion.li
              key={label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.35, ease: EASE }}
              className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card px-3 text-[13px] text-foreground"
            >
              <Icon className="size-3.5 text-muted-foreground" />
              {label}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
