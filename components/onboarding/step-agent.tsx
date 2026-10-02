"use client";

import { Check, Clock, MessageSquareText, PhoneForwarded, PhoneOff, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { LANGUAGES, type AgentConfig, type DealershipProfile, type LanguageCode } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { OptionCard, StepActions, StepHeader } from "./shared";
import { VOICES, buildGreeting, voiceOf, type UpdateProfile } from "./lib";
import type { Speech } from "./use-speech";

const TONES: { value: AgentConfig["tone"]; label: string; hint: string }[] = [
  { value: "chaleureux", label: "Chaleureux", hint: "Souriant et rassurant, comme la meilleure hôtesse d'accueil de la concession." },
  { value: "professionnel", label: "Professionnel", hint: "Précis et posé, avec une politesse irréprochable." },
  { value: "dynamique", label: "Dynamique", hint: "Efficace et énergique, sans jamais être insistant." },
];

const TRANSFER: { value: AgentConfig["transferPolicy"]; title: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "business_hours",
    title: "Aux heures d'ouverture",
    description: "Transfère vers le bon service quand il est ouvert, programme un rappel sinon.",
    icon: <Clock />,
  },
  {
    value: "always_offer",
    title: "Toujours proposer un conseiller",
    description: "Propose systématiquement de parler à quelqu'un, avec rappel si le service est fermé.",
    icon: <PhoneForwarded />,
  },
  {
    value: "never",
    title: "Jamais",
    description: "L'agent traite toutes les demandes et programme un rappel quand il le faut.",
    icon: <PhoneOff />,
  },
];

function Equalizer({ active }: { active: boolean }) {
  return (
    <span aria-hidden className="flex h-4 items-center gap-[3px]">
      {[0.55, 1, 0.7, 0.4].map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-current"
          initial={false}
          animate={active ? { height: ["30%", `${h * 100}%`, "45%", `${h * 80}%`, "30%"] } : { height: `${h * 60}%` }}
          transition={active ? { duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" } : { duration: 0.2 }}
        />
      ))}
    </span>
  );
}

function Block({ title, description, children, aside }: { title: string; description?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium tracking-tight text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </Card>
  );
}

export function StepAgent({
  profile,
  update,
  speech,
  onBack,
  onNext,
}: {
  profile: DealershipProfile;
  update: UpdateProfile;
  speech: Speech;
  onBack: () => void;
  onNext: () => void;
}) {
  const ids = useId();
  const a = profile.agent;
  const currentVoice = voiceOf(a.voiceId);
  const tone = TONES.find((t) => t.value === a.tone) ?? TONES[0]!;

  const chooseVoice = (id: string) =>
    update((d) => {
      const prev = voiceOf(d.agent.voiceId);
      const next = voiceOf(id);
      // Follow the persona name unless the user picked a custom one.
      if (!d.agent.name.trim() || d.agent.name === prev.name) d.agent.name = next.name;
      d.agent.voiceId = id;
    });

  const toggleLang = (l: LanguageCode) =>
    update((d) => {
      const on = d.agent.languages.includes(l);
      if (on && d.agent.languages.length === 1) return;
      d.agent.languages = on ? d.agent.languages.filter((x) => x !== l) : [...d.agent.languages, l];
    });

  const greetingId = `${ids}-greeting`;

  return (
    <div>
      <StepHeader
        step={4}
        title={
          <>
            Donnez une <span className="font-serif-accent">voix</span> à votre agent.
          </>
        }
        description="Nom, voix, ton et langues : vos clients entendront la concession, pas un robot."
      />

      <div className="grid gap-4">
        <Block title="Voix" description="Écoutez le message d'accueil avec chaque voix.">
          <div className="mb-5 grid gap-1.5 sm:max-w-xs">
            <Label htmlFor={`${ids}-name`}>Prénom de l&apos;agent</Label>
            <Input
              id={`${ids}-name`}
              value={a.name}
              maxLength={24}
              placeholder={currentVoice.name}
              onChange={(e) => update((d) => void (d.agent.name = e.target.value))}
            />
          </div>
          <div role="radiogroup" aria-label="Voix de l'agent" className="grid gap-3 sm:grid-cols-2">
            {VOICES.map((v) => {
              const selected = v.id === a.voiceId;
              const playing = speech.speakingId === `voice:${v.id}`;
              const sample = buildGreeting(profile.name, selected ? a.name || v.name : v.name, v.id);
              return (
                <div
                  key={v.id}
                  className={cn(
                    "relative rounded-xl border bg-card p-4 transition-[border-color,box-shadow,background-color] duration-150",
                    selected ? "border-primary shadow-[0_0_0_3px_var(--primary-soft)]" : "border-border hover:border-border-strong hover:bg-subtle",
                  )}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${v.name}, voix ${v.trait.toLowerCase()}, ${v.lang}`}
                    onClick={() => chooseVoice(v.id)}
                    className="absolute inset-0 rounded-xl"
                  />
                  <div className="pointer-events-none flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        selected || playing ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Equalizer active={playing} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {v.name} <span className="font-normal text-muted-foreground">— {v.trait.toLowerCase()}</span>
                      </span>
                      <span className="block text-xs text-muted-foreground">{v.lang}</span>
                    </span>
                    {selected && (
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </motion.span>
                    )}
                  </div>
                  <p className="pointer-events-none mt-2.5 text-xs leading-relaxed text-muted-foreground">{v.description}</p>
                  <Button
                    variant={playing ? "secondary" : "outline"}
                    size="xs"
                    className="relative z-10 mt-3"
                    disabled={!speech.supported}
                    title={speech.supported ? undefined : "Lecture non disponible dans ce navigateur"}
                    onClick={() => speech.toggle(`voice:${v.id}`, sample, v)}
                    aria-label={playing ? `Arrêter l'écoute de ${v.name}` : `Écouter ${v.name}`}
                  >
                    {playing ? <Square className="size-3" /> : <Play className="size-3" />}
                    {playing ? "Arrêter" : "Écouter"}
                  </Button>
                </div>
              );
            })}
          </div>
          {!speech.supported && (
            <p className="mt-3 text-xs text-muted-foreground">L&apos;aperçu audio n&apos;est pas disponible dans ce navigateur.</p>
          )}
        </Block>

        <Block title="Ton" description={tone.hint}>
          <Segmented
            value={a.tone}
            onChange={(v) => update((d) => void (d.agent.tone = v))}
            options={TONES.map((t) => ({ value: t.value, label: t.label }))}
            className="max-w-full overflow-x-auto"
          />
        </Block>

        <Block
          title="Langues"
          description="L'agent détecte la langue de l'appelant et bascule automatiquement."
          aside={<span className="shrink-0 font-mono text-xs text-muted-foreground tabular">{a.languages.length} / {Object.keys(LANGUAGES).length}</span>}
        >
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LANGUAGES) as LanguageCode[]).map((l) => {
              const on = a.languages.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleLang(l)}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] transition-[background-color,border-color,color] duration-150",
                    on
                      ? "border-[color-mix(in_oklch,var(--primary)_35%,transparent)] bg-primary-soft text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
                  )}
                >
                  <span aria-hidden className="text-sm leading-none">
                    {LANGUAGES[l].flag}
                  </span>
                  {LANGUAGES[l].label}
                  {on && <Check className="size-3 text-primary" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </Block>

        <Block
          title="Message d'accueil"
          description="La première phrase entendue par vos clients."
          aside={
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                disabled={!speech.supported}
                onClick={() => speech.toggle("greeting", a.greeting, currentVoice)}
                aria-label={speech.speakingId === "greeting" ? "Arrêter l'écoute" : "Écouter le message d'accueil"}
              >
                {speech.speakingId === "greeting" ? <Square className="size-3" /> : <Volume2 />}
                <span className="hidden sm:inline">{speech.speakingId === "greeting" ? "Arrêter" : "Écouter"}</span>
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => update((d) => void (d.agent.greeting = buildGreeting(d.name, d.agent.name || voiceOf(d.agent.voiceId).name, d.agent.voiceId)))}
              >
                <RotateCcw />
                Régénérer
              </Button>
            </div>
          }
        >
          <div className="relative">
            <MessageSquareText className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" aria-hidden />
            <Textarea
              id={greetingId}
              aria-label="Message d'accueil"
              value={a.greeting}
              maxLength={300}
              className="min-h-24 pl-9 text-[15px]"
              onChange={(e) => update((d) => void (d.agent.greeting = e.target.value))}
            />
          </div>
          <p className="mt-1.5 text-right font-mono text-[11px] text-muted-foreground tabular">{a.greeting.length} / 300</p>
        </Block>

        <Block title="Transfert vers un conseiller" description="Quand l'agent passe la main à un humain.">
          <div role="radiogroup" aria-label="Politique de transfert" className="grid gap-2.5">
            {TRANSFER.map((t) => (
              <OptionCard
                key={t.value}
                selected={a.transferPolicy === t.value}
                onSelect={() => update((d) => void (d.agent.transferPolicy = t.value))}
                title={t.title}
                description={t.description}
                icon={t.icon}
              />
            ))}
          </div>
        </Block>

        <Block title="Options">
          <div className="divide-y divide-border">
            <label className="flex cursor-pointer items-start justify-between gap-4 pb-4">
              <span>
                <span className="block text-sm text-foreground">SMS de confirmation</span>
                <span className="block text-[13px] text-muted-foreground">Envoie un récapitulatif par SMS après chaque rendez-vous pris.</span>
              </span>
              <Switch
                checked={a.smsConfirmation}
                label="SMS de confirmation"
                onCheckedChange={(v) => update((d) => void (d.agent.smsConfirmation = v))}
              />
            </label>
            <label className="flex cursor-pointer items-start justify-between gap-4 pt-4">
              <span>
                <span className="block text-sm text-foreground">Enregistrement des appels</span>
                <span className="block text-[13px] text-muted-foreground">
                  Pour le contrôle qualité et les résumés. Les appelants en sont informés (RGPD).
                </span>
              </span>
              <Switch checked={a.recordCalls} label="Enregistrement des appels" onCheckedChange={(v) => update((d) => void (d.agent.recordCalls = v))} />
            </label>
          </div>
        </Block>

        <Block title="Consignes particulières" description="Facultatif — des règles propres à votre concession.">
          <Textarea
            aria-label="Consignes particulières"
            value={a.customInstructions ?? ""}
            placeholder="Ex. : ne proposez pas de rendez-vous carrosserie le samedi ; orientez les demandes de flotte vers Marc Dubois."
            className="min-h-20"
            onChange={(e) => update((d) => void (d.agent.customInstructions = e.target.value || undefined))}
          />
        </Block>
      </div>

      <StepActions onBack={onBack} onNext={onNext} />
    </div>
  );
}
