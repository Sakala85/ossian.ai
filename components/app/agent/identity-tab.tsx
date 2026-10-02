"use client";

import { Check, Lock, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Orb } from "@/components/voice/orb";
import { LANGUAGES, type LanguageCode } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Panel } from "../form-bits";
import { VOICES, type AgentState, type SetAgent } from "./state";

const ALL_LANGS = Object.keys(LANGUAGES) as LanguageCode[];

/** Voice preview: uses the browser's speech synthesis when available, else a timed simulation. */
function useVoicePreview() {
  const [playing, setPlaying] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setPlaying(null);
  };

  useEffect(() => stop, []);

  const play = (voice: (typeof VOICES)[number], text: string) => {
    if (playing === voice.id) return stop();
    stop();
    setPlaying(voice.id);
    const fallbackMs = Math.min(9000, 1200 + text.length * 55);
    try {
      const synth = window.speechSynthesis;
      if (synth) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "fr-FR";
        u.pitch = voice.pitch;
        u.rate = voice.rate;
        const fr = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith("fr"));
        if (fr.length) u.voice = fr[VOICES.indexOf(voice) % fr.length] ?? null;
        u.onend = () => setPlaying((p) => (p === voice.id ? null : p));
        u.onerror = () => setPlaying((p) => (p === voice.id ? null : p));
        synth.speak(u);
      }
    } catch {}
    timer.current = setTimeout(() => setPlaying((p) => (p === voice.id ? null : p)), fallbackMs);
  };

  return { playing, play };
}

export function IdentityTab({ s, set }: { s: AgentState; set: SetAgent }) {
  const { playing, play } = useVoicePreview();
  const voice = VOICES.find((v) => v.id === s.voiceId) ?? VOICES[0];

  const toggleLang = (l: LanguageCode) => {
    if (l === "fr") return;
    set("languages", s.languages.includes(l) ? s.languages.filter((x) => x !== l) : [...s.languages, l]);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid min-w-0 gap-5">
        <Panel title="Identité" description="Comment l'agent se présente à vos clients.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom de l'agent">
              <Input value={s.name} onChange={(e) => set("name", e.target.value)} maxLength={24} />
            </Field>
            <div className="grid gap-1.5">
              <span className="text-[13px] font-medium">Ton</span>
              <Segmented
                value={s.tone}
                onChange={(v) => set("tone", v)}
                className="w-fit"
                options={[
                  { value: "chaleureux", label: "Chaleureux" },
                  { value: "professionnel", label: "Professionnel" },
                  { value: "dynamique", label: "Dynamique" },
                ]}
              />
            </div>
            <Field
              label="Message d'accueil"
              hint={`${s.greeting.length} caractères · environ ${Math.max(2, Math.round(s.greeting.length / 15))} secondes à l'oral`}
              className="sm:col-span-2"
            >
              <Textarea value={s.greeting} onChange={(e) => set("greeting", e.target.value)} className="min-h-20" />
            </Field>
          </div>
        </Panel>

        <Panel title="Voix" description="Écoutez un aperçu avec votre message d'accueil, puis choisissez la voix de l'agent.">
          <div className="grid gap-3 sm:grid-cols-2">
            {VOICES.map((v) => {
              const selected = v.id === s.voiceId;
              const isPlaying = playing === v.id;
              return (
                <div
                  key={v.id}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl border p-3 transition-[border-color,box-shadow,background]",
                    selected ? "border-primary/60 bg-primary-soft shadow-[0_0_0_3px_var(--primary-soft)]" : "border-border bg-card hover:border-border-strong",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => play(v, s.greeting)}
                    aria-label={isPlaying ? `Arrêter l'aperçu de ${v.name}` : `Écouter ${v.name}`}
                    className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-soft transition-transform active:scale-95 [&_svg]:size-4"
                    style={{ background: `linear-gradient(140deg, oklch(0.74 0.13 ${v.hue}), oklch(0.52 0.18 ${v.hue + 30}))` }}
                  >
                    {isPlaying ? <Pause className="fill-current" /> : <Play className="translate-x-px fill-current" />}
                    {isPlaying && <span className="absolute inset-0 animate-pulse-ring rounded-full border border-primary/50" />}
                  </button>
                  <button type="button" onClick={() => set("voiceId", v.id)} className="min-w-0 flex-1 text-left" aria-pressed={selected}>
                    <span className="flex items-center gap-2">
                      <span className="text-[13.5px] font-medium">{v.name}</span>
                      {isPlaying ? (
                        <Equalizer />
                      ) : (
                        <span className="text-[11px] text-muted-foreground">{v.accent}</span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{v.traits}</span>
                  </button>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border [&_svg]:size-3",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
                    )}
                    aria-hidden
                  >
                    {selected && <Check />}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Langues"
          description="Léa détecte la langue de l'appelant dès les premiers mots et bascule automatiquement."
          footer={`${s.languages.length} langues actives · le français reste la langue d'accueil.`}
        >
          <div className="flex flex-wrap gap-2">
            {ALL_LANGS.map((l) => {
              const on = s.languages.includes(l);
              const locked = l === "fr";
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  disabled={locked}
                  onClick={() => toggleLang(l)}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] transition-colors disabled:cursor-default",
                    on ? "border-primary/40 bg-primary-soft text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="text-[15px] leading-none">{LANGUAGES[l].flag}</span>
                  {LANGUAGES[l].label}
                  {locked ? <Lock className="size-3 text-muted-foreground" /> : on && <Check className="size-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Live preview */}
      <aside className="xl:sticky xl:top-20 xl:self-start">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="relative flex flex-col items-center bg-dots px-5 pt-6 pb-5">
            <Orb size={132} state={playing ? "speaking" : "idle"} level={playing ? 0.6 : 0} />
            <p className="mt-2 text-sm font-medium">{s.name || "Agent"}</p>
            <p className="text-xs text-muted-foreground">
              Voix {voice.name} · ton {s.tone}
            </p>
          </div>
          <div className="border-t border-border p-4">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Aperçu de l&apos;accueil</p>
            <div className="rounded-2xl rounded-tl-md border border-border bg-subtle px-3.5 py-2.5 text-[13px] leading-relaxed">
              {s.greeting || <span className="text-muted-foreground">Votre message d&apos;accueil…</span>}
            </div>
            <button
              type="button"
              onClick={() => play(voice, s.greeting)}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:opacity-80 [&_svg]:size-3.5"
            >
              {playing === voice.id ? <Pause /> : <Play />}
              {playing === voice.id ? "Arrêter" : "Écouter l'accueil"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Equalizer() {
  return (
    <span className="inline-flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 0.2, 0.4, 0.1].map((d, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-primary"
          style={{ height: "100%", animation: `eq 0.9s ${d}s ease-in-out infinite alternate`, transformOrigin: "bottom" }}
        />
      ))}
      <style>{`@keyframes eq{0%{transform:scaleY(.25)}100%{transform:scaleY(1)}}`}</style>
    </span>
  );
}
