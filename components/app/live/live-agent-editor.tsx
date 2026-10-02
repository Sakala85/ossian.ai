"use client";

import { Building, Fingerprint, LoaderCircle, Mic, PhoneForwarded } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { normalizeProfile, syncGreeting, type UpdateProfile } from "@/components/onboarding/lib";
import { StepAgent } from "@/components/onboarding/step-agent";
import { StepReview } from "@/components/onboarding/step-review";
import { useSpeech } from "@/components/onboarding/use-speech";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { DealershipProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Page } from "../page-header";
import { useShell } from "../shell-context";
import { Tabs } from "../tabs";

type Tab = "agent" | "dealership" | "transfer";

/**
 * The dealership's real agent configuration. Saving writes the profile to the
 * database: the next call is answered with it.
 */
export function LiveAgentEditor({ profile: initialProfile, fallback: initialFallback }: { profile: DealershipProfile; fallback: string }) {
  const router = useRouter();
  const { toast } = useShell();
  const ids = useId();
  const speech = useSpeech();
  const initial = useMemo(() => normalizeProfile(initialProfile, initialProfile.website), [initialProfile]);
  const [saved, setSaved] = useState({ profile: initial, fallback: initialFallback });
  const [profile, setProfile] = useState(initial);
  const [fallback, setFallback] = useState(initialFallback);
  const [tab, setTab] = useState<Tab>("agent");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update: UpdateProfile = useCallback((recipe) => {
    setProfile((prev) => {
      const next = structuredClone(prev);
      recipe(next);
      syncGreeting(prev, next);
      return next;
    });
  }, []);

  const dirty = JSON.stringify(profile) !== JSON.stringify(saved.profile) || fallback.trim() !== saved.fallback.trim();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => speech.stop, [tab, speech.stop]);

  const save = async () => {
    if (!profile.name.trim()) {
      setTab("dealership");
      setError("Indiquez le nom de la concession.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, fallback: fallback.trim() }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(
          j.error === "invalid_fallback"
            ? "Le numéro de transfert ne semble pas valide (ex. 04 72 00 00 00)."
            : "L'enregistrement n'a pas abouti. Vérifiez les champs et réessayez.",
        );
        if (j.error === "invalid_fallback") setTab("transfer");
        return;
      }
      setSaved({ profile, fallback });
      toast(`${profile.agent.name} utilisera cette configuration dès le prochain appel`);
      router.refresh();
    } catch {
      setError("Connexion interrompue. Réessayez dans un instant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Agent"
      subtitle={`Ce que ${profile.agent.name || "votre agent"} dit, sait et fait au téléphone. Les modifications s'appliquent dès l'appel suivant.`}
      actions={
        <LinkButton href="/demo" variant="outline" size="sm">
          <Mic /> Parler à {profile.agent.name || "l'agent"}
        </LinkButton>
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={[
          { value: "agent", label: "Voix & accueil", icon: <Fingerprint /> },
          { value: "dealership", label: "Concession", icon: <Building /> },
          { value: "transfer", label: "Transferts", icon: <PhoneForwarded /> },
        ]}
      />

      <div className="max-w-[760px]">
        {tab === "agent" && <StepAgent embedded profile={profile} update={update} speech={speech} />}
        {tab === "dealership" && (
          <StepReview embedded profile={profile} update={update} source={null} isAi={() => false} markEdited={() => {}} sitesBucket={null} />
        )}
        {tab === "transfer" && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-medium">Numéro de transfert</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Quand un client demande à parler à quelqu&apos;un et qu&apos;aucun service ne correspond, {profile.agent.name} transfère ici. Les numéros
              par service se règlent dans l&apos;onglet Concession, rubrique Services.
            </p>
            <Field label="Numéro" className="mt-4 max-w-xs">
              <Input
                id={`${ids}-fallback`}
                aria-label="Numéro de transfert"
                type="tel"
                inputMode="tel"
                placeholder="04 72 00 00 00"
                value={fallback}
                onChange={(e) => setFallback(e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-20 mt-8 max-w-[760px]">
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl border bg-popover/90 px-4 py-3 shadow-float backdrop-blur-xl transition-colors",
            dirty ? "border-[color-mix(in_oklch,var(--primary)_35%,var(--border))]" : "border-border",
          )}
        >
          <span className="flex items-center gap-2 text-[13px]" aria-live="polite">
            <span className={cn("size-2 rounded-full", error ? "bg-danger" : dirty ? "bg-warning" : "bg-success")} />
            {error ?? (dirty ? "Modifications non enregistrées" : "Configuration en service")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {dirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setProfile(saved.profile);
                  setFallback(saved.fallback);
                  setError(null);
                }}
              >
                Annuler
              </Button>
            )}
            <Button size="sm" onClick={save} disabled={!dirty || saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
