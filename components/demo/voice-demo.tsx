"use client";

import type Anthropic from "@anthropic-ai/sdk";
import { ArrowUp, Headphones, Keyboard, Mic, Phone, PhoneOff, RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/misc";
import { Orb, type OrbState } from "@/components/voice/orb";
import type { AgentEvent } from "@/lib/agent/events";
import { getDemoCalls } from "@/lib/demo/calls";
import { DEMO_PROFILE } from "@/lib/demo/profile";
import { LANGUAGES, type DealershipProfile, type LanguageCode } from "@/lib/domain/types";
import { clearProfile, hasCustomProfile, loadProfile } from "@/lib/profile-store";
import { cn } from "@/lib/utils";
import { getRecognitionCtor, listenOnce, micLevelMeter, Speaker, SPEECH_LOCALES, voicesReady } from "@/lib/voice/speech";
import { ActionsPanel } from "./actions-panel";
import { Transcript } from "./transcript";
import type { EndSummary, Entry, Phase } from "./types";

const SUGGESTIONS: Record<string, { label: string; text: string }[]> = {
  fr: [
    { label: "Révision", text: "Bonjour, je voudrais prendre rendez-vous pour la révision de ma Peugeot 3008, elle a 60 000 kilomètres." },
    { label: "Suivi atelier", text: "Bonjour, je voulais savoir si ma voiture est prête, c'est la GH-482-TL." },
    { label: "Essai VN", text: "Bonjour, j'aimerais essayer la nouvelle Peugeot E-3008, c'est possible ce week-end ?" },
    { label: "Occasion", text: "Bonsoir, la Toyota Yaris hybride de 2021 que vous avez en occasion est toujours disponible ?" },
    { label: "Pièces", text: "Vous avez des plaquettes de frein avant pour une Clio 4 diesel ?" },
    { label: "Réclamation", text: "Je suis très mécontente, ma facture est plus chère que le devis et personne ne m'a appelée." },
  ],
  en: [
    { label: "Warning light", text: "Hi, the engine warning light just came on in my car, can I book a check tomorrow morning?" },
    { label: "Test drive", text: "Hello, I'd like to test drive the Toyota RAV4 hybrid this Saturday." },
  ],
  es: [{ label: "Neumáticos", text: "Hola, quería cambiar los neumáticos de mi Toyota Yaris Cross, ¿tienen hueco esta semana?" }],
};

const PLAYBACKS = ["call_7Q2K", "call_8M1P", "call_3R7D", "call_9K4C", "call_5T9A"];

let uid = 0;
const nid = () => `e${++uid}`;

function useTimer(running: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!running) return;
    setS(0);
    const t = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Short two-tone ring generated with WebAudio (no asset). */
function ring(times = 1) {
  try {
    const ctx = new AudioContext();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    g.gain.value = 0;
    for (let i = 0; i < times; i++) {
      const t0 = ctx.currentTime + i * 1.1;
      for (const f of [440, 480]) {
        const o = ctx.createOscillator();
        o.frequency.value = f;
        o.connect(g);
        o.start(t0);
        o.stop(t0 + 0.7);
      }
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.05, t0 + 0.05);
      g.gain.setValueAtTime(0.05, t0 + 0.6);
      g.gain.linearRampToValueAtTime(0, t0 + 0.7);
    }
    setTimeout(() => ctx.close().catch(() => {}), times * 1100 + 200);
  } catch {}
  return new Promise((r) => setTimeout(r, times * 1100));
}

export function VoiceDemo() {
  const [profile, setProfile] = useState<DealershipProfile>(DEMO_PROFILE);
  const [custom, setCustom] = useState(false);
  const [mode, setMode] = useState<"ai" | "simulated" | null>(null);
  const [premiumVoice, setPremiumVoice] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [lang, setLang] = useState<LanguageCode>("fr");
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [muted, setMuted] = useState(false);
  const [draft, setDraft] = useState("");
  const [end, setEnd] = useState<EndSummary | null>(null);
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);

  const history = useRef<Anthropic.Beta.BetaMessageParam[]>([]);
  const speaker = useRef<Speaker | null>(null);
  const active = useRef(false);
  const listenAbort = useRef<AbortController | null>(null);
  const reqAbort = useRef<AbortController | null>(null);
  const stopMeter = useRef<(() => void) | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const inputModeRef = useRef(inputMode);
  const langRef = useRef(lang);
  const busy = useRef(false);
  const playRun = useRef("");
  inputModeRef.current = inputMode;
  langRef.current = lang;

  const setP = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /* ---------- init ---------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (hasCustomProfile()) {
      setProfile(loadProfile());
      setCustom(true);
    }
    const qLang = params.get("lang") as LanguageCode | null;
    if (qLang && qLang in LANGUAGES) setLang(qLang);
    const ok = Boolean(getRecognitionCtor());
    setSupported(ok);
    if (!ok) setInputMode("text");
    fetch("/api/agent")
      .then((r) => r.json())
      .then((d: { mode: "ai" | "simulated" }) => setMode(d.mode))
      .catch(() => setMode("simulated"));
    fetch("/api/tts")
      .then((r) => r.json())
      .then((d: { enabled: boolean }) => setPremiumVoice(d.enabled))
      .catch(() => {});
    const s = new Speaker();
    s.onLevel = (l) => setLevel(l);
    speaker.current = s;
    void voicesReady();
    return () => {
      active.current = false;
      s.cancel();
      listenAbort.current?.abort();
      reqAbort.current?.abort();
      stopMeter.current?.();
    };
  }, []);

  useEffect(() => {
    if (!speaker.current) return;
    speaker.current.muted = muted;
    speaker.current.premium = premiumVoice;
    speaker.current.lang = SPEECH_LOCALES[lang] ?? "fr-FR";
  }, [muted, premiumVoice, lang]);

  const push = (e: Entry) => setEntries((xs) => [...xs, e]);
  const patch = (id: string, fn: (e: Entry) => Entry) => setEntries((xs) => xs.map((x) => (x.id === id ? fn(x) : x)));

  /* ---------- one conversational turn ---------- */
  const sendTurn = useCallback(
    async (text: string) => {
      const sp = speaker.current!;
      busy.current = true;
      push({ kind: "caller", id: nid(), text });
      setP("thinking");
      let agentId: string | null = null;
      let spokeThisTurn = false;
      let endAfter: EndSummary | null = null;
      const ctrl = new AbortController();
      reqAbort.current = ctrl;
      sp.onActive = (a) => {
        if (a && active.current) setP("speaking");
      };
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, history: history.current, userText: text }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            const ev = JSON.parse(line) as AgentEvent;
            switch (ev.type) {
              case "text": {
                if (!agentId) {
                  agentId = nid();
                  const id = agentId;
                  push({ kind: "agent", id, text: ev.delta.trimStart(), streaming: true });
                } else {
                  const id = agentId;
                  patch(id, (e) => (e.kind === "agent" ? { ...e, text: e.text + ev.delta } : e));
                }
                spokeThisTurn = true;
                sp.push(ev.delta);
                break;
              }
              case "tool_call": {
                if (agentId) {
                  const id = agentId;
                  patch(id, (e) => (e.kind === "agent" ? { ...e, streaming: false } : e));
                  sp.flush();
                  agentId = null;
                }
                push({ kind: "tool", id: ev.id, name: ev.name, input: ev.input });
                if (!spokeThisTurn && langRef.current === "fr" && ["check_availability", "get_repair_status", "search_inventory"].includes(ev.name)) {
                  spokeThisTurn = true;
                  sp.push(ev.name === "check_availability" ? "Je regarde le planning. " : ev.name === "search_inventory" ? "Je regarde notre stock. " : "Je consulte votre dossier. ");
                }
                break;
              }
              case "tool_result":
                patch(ev.id, (e) => (e.kind === "tool" ? { ...e, result: ev.result, ok: ev.ok } : e));
                break;
              case "end_call":
                endAfter = { outcome: ev.outcome, summary: ev.summary };
                break;
              case "messages":
                history.current = [...history.current, ...ev.messages];
                break;
              case "done":
                setMode(ev.mode);
                break;
              case "error":
                push({ kind: "system", id: nid(), text: `⚠︎ ${ev.message}`, tone: "error" });
                break;
            }
          }
        }
      } catch (err) {
        if (!ctrl.signal.aborted) push({ kind: "system", id: nid(), text: "Connexion interrompue. Réessayez.", tone: "error" });
      } finally {
        if (agentId) {
          const id = agentId;
          patch(id, (e) => (e.kind === "agent" ? { ...e, streaming: false } : e));
        }
        sp.flush();
      }
      await sp.idle();
      busy.current = false;
      if (endAfter) {
        setEnd(endAfter);
        hangup(false);
      } else if (active.current) {
        setP(inputModeRef.current === "voice" ? "listening" : "idle");
      }
    },
    [profile],
  );

  /* ---------- listening loop ---------- */
  const listenLoop = useCallback(async () => {
    let silences = 0;
    while (active.current && inputModeRef.current === "voice") {
      if (busy.current) {
        silences = 0;
        await new Promise((r) => setTimeout(r, 120));
        continue;
      }
      setP("listening");
      const ctrl = new AbortController();
      listenAbort.current = ctrl;
      let text = "";
      try {
        text = await listenOnce(SPEECH_LOCALES[langRef.current] ?? "fr-FR", setInterim, ctrl.signal);
      } catch (err) {
        const msg = (err as Error).message;
        push({
          kind: "system",
          id: nid(),
          text: msg === "not-allowed" ? "Micro refusé : autorisez-le dans le navigateur ou passez en mode texte." : `Reconnaissance vocale indisponible (${msg}). Passage en mode texte.`,
          tone: "error",
        });
        setInputMode("text");
        setP("idle");
        return;
      }
      setInterim("");
      if (!active.current || inputModeRef.current !== "voice") return;
      if (!text) {
        if (++silences === 3) {
          silences = 0;
          await speaker.current!.say("Vous êtes toujours là ? Je vous écoute.");
        }
        continue;
      }
      silences = 0;
      await sendTurn(text);
    }
  }, [sendTurn, setP]);

  /* ---------- call lifecycle ---------- */
  const startCall = useCallback(
    async (opts?: { firstUtterance?: string }) => {
      if (active.current) return;
      speaker.current?.cancel();
      active.current = true;
      history.current = [];
      setEntries([]);
      setEnd(null);
      setPlaying(null);
      setP("connecting");
      if (inputModeRef.current === "voice") {
        micLevelMeter((l) => {
          if (phaseRef.current === "listening") setLevel(l);
        })
          .then((stop) => (stopMeter.current = stop))
          .catch(() => {});
      }
      await ring(1);
      if (!active.current) return;
      const greeting = profile.agent.greeting;
      push({ kind: "agent", id: nid(), text: greeting });
      speaker.current!.onActive = (a) => a && active.current && setP("speaking");
      await speaker.current!.say(greeting);
      if (!active.current) return;
      if (opts?.firstUtterance) await sendTurn(opts.firstUtterance);
      if (active.current && inputModeRef.current === "voice") void listenLoop();
      else if (active.current) setP("idle");
    },
    [listenLoop, profile, sendTurn, setP],
  );

  const hangup = useCallback(
    (cancelSpeech = true) => {
      active.current = false;
      listenAbort.current?.abort();
      if (cancelSpeech) {
        reqAbort.current?.abort();
        speaker.current?.cancel();
      }
      stopMeter.current?.();
      stopMeter.current = null;
      setInterim("");
      setLevel(0);
      setP("ended");
    },
    [setP],
  );

  const interrupt = () => {
    if (phaseRef.current !== "speaking") return;
    speaker.current?.cancel();
  };

  const sendText = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setDraft("");
    if (!active.current) {
      await startCall({ firstUtterance: t });
      return;
    }
    if (busy.current) return;
    // The running listen loop (voice mode) waits while the turn is busy, then resumes.
    listenAbort.current?.abort();
    await sendTurn(t);
  };

  /* ---------- scripted playback of a real call ---------- */
  const playCall = async (id: string) => {
    hangup();
    const call = getDemoCalls().find((c) => c.id === id);
    if (!call) return;
    const sp = speaker.current!;
    sp.cancel();
    setEntries([]);
    setEnd(null);
    setPlaying(id);
    active.current = true;
    const myRun = id + Date.now();
    playRun.current = myRun;
    setP("connecting");
    await ring(1);
    const loc = SPEECH_LOCALES[call.language] ?? "fr-FR";
    const swap = (t: string) => t.replace(/Mistral Automobiles|Mistral Occasions/g, profile.name).replace(/Léa/g, profile.agent.name);
    for (const line of call.transcript) {
      if (playRun.current !== myRun) return;
      if (line.role === "tool" && line.tool) {
        setP("thinking");
        const tid = nid();
        push({ kind: "tool", id: tid, name: line.tool.name, input: line.tool.input });
        await new Promise((r) => setTimeout(r, 700));
        patch(tid, (e) => (e.kind === "tool" ? { ...e, result: line.tool!.result, ok: true } : e));
        continue;
      }
      const text = swap(line.text);
      push({ kind: line.role === "agent" ? "agent" : "caller", id: nid(), text });
      setP(line.role === "agent" ? "speaking" : "listening");
      await sp.say(text, { voice: line.role === "agent" ? "agent" : "caller", lang: loc });
    }
    if (playRun.current !== myRun) return;
    setEnd({ outcome: call.outcome, summary: swap(call.summary) });
    active.current = false;
    setPlaying(null);
    setP("ended");
  };
  const stopAll = () => {
    playRun.current = "";
    setPlaying(null);
    hangup();
  };

  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ossian-profil-${profile.id || "concession"}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const resetProfile = () => {
    clearProfile();
    setProfile(DEMO_PROFILE);
    setCustom(false);
    stopAll();
    setEntries([]);
    setEnd(null);
    setP("idle");
  };

  const inCall = phase !== "idle" && phase !== "ended";
  const timer = useTimer(inCall);
  const orbState: OrbState = phase === "listening" ? "listening" : phase === "thinking" || phase === "connecting" ? "thinking" : phase === "speaking" ? "speaking" : "idle";
  const agentName = profile.agent.name;
  const statusText = {
    idle: active.current ? `${agentName} attend votre message` : "Prête à répondre",
    connecting: "Appel en cours…",
    listening: `${agentName} vous écoute…`,
    thinking: `${agentName} réfléchit…`,
    speaking: `${agentName} parle — touchez l'orbe pour l'interrompre`,
    ended: "Appel terminé",
  }[phase];
  const suggestions = SUGGESTIONS[lang] ?? SUGGESTIONS.fr!;

  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-[-20%] left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.55_0.2_280/0.22),transparent)] blur-2xl" />
        <div className="bg-grid mask-radial absolute inset-0 opacity-40" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex h-14 items-center gap-3 border-b border-border px-4 backdrop-blur md:px-6">
        <Link href="/" aria-label="Accueil Ossian">
          <Logo />
        </Link>
        <span className="hidden h-5 w-px bg-border sm:block" />
        <span className="hidden text-sm text-muted-foreground sm:block">Démo interactive</span>
        <div className="ml-auto flex items-center gap-2">
          {mode && (
            <Badge tone={mode === "ai" ? "success" : "warning"} dot title={mode === "ai" ? "Réponses générées en temps réel par Claude" : "Ajoutez ANTHROPIC_API_KEY pour activer l'IA générative"}>
              {mode === "ai" ? "IA en direct" : "Mode simulé"}
            </Badge>
          )}
          <Link href="/onboarding" className={buttonVariants({ variant: "outline", size: "sm", className: "hidden md:inline-flex" })}>
            <Sparkles /> Créer mon agent
          </Link>
          <Link href="/app" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Tableau de bord
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] gap-4 p-4 md:p-6 xl:grid-cols-12">
        {/* Left: agent + suggestions */}
        <aside className="order-3 flex flex-col gap-4 xl:order-1 xl:col-span-3">
          <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Concession</span>
              {custom ? (
                <button onClick={resetProfile} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <RotateCcw className="size-3" /> Profil démo
                </button>
              ) : (
                <Badge tone="neutral">Démo</Badge>
              )}
            </div>
            <div className="text-[15px] font-medium">{profile.name}</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {profile.sites.length} site{profile.sites.length > 1 ? "s" : ""} · {profile.brands.slice(0, 3).join(", ")}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.agent.languages.slice(0, 7).map((l) => (
                <span key={l} title={LANGUAGES[l]?.label} className="rounded-md border border-border bg-subtle px-1.5 py-0.5 text-[11px]">
                  {LANGUAGES[l]?.flag} {l.toUpperCase()}
                </span>
              ))}
            </div>
            {custom && (
              <div className="mt-3 flex items-center justify-between gap-2 text-[12px]">
                <span className="text-primary">Profil personnalisé généré par l&apos;onboarding.</span>
                <button onClick={exportProfile} className="shrink-0 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline" title="Pour rattacher ce profil à un numéro (npm run vapi -- connect … --profile)">
                  Exporter (JSON)
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur">
            <div className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">Essayez de dire…</div>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendText(s.text)}
                  disabled={phase === "thinking" || !!playing}
                  className="group rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors hover:border-border hover:bg-subtle disabled:opacity-50"
                >
                  <div className="text-[12px] font-medium text-primary">{s.label}</div>
                  <div className="line-clamp-2 text-[12.5px] text-muted-foreground group-hover:text-foreground">« {s.text} »</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Headphones className="size-3.5" /> Écouter un appel type
            </div>
            <div className="flex flex-col gap-1">
              {PLAYBACKS.map((id) => {
                const c = getDemoCalls().find((x) => x.id === id)!;
                return (
                  <button
                    key={id}
                    onClick={() => (playing === id ? stopAll() : playCall(id))}
                    className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-subtle", playing === id && "bg-primary-soft")}
                  >
                    <span className="text-base leading-none">{LANGUAGES[c.language].flag}</span>
                    <span className="flex-1 truncate">{c.summary.split(".")[0]}</span>
                    <span className="text-[11px] text-muted-foreground">{playing === id ? "Stop" : "▶"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center: call stage + transcript */}
        <section className="order-1 flex flex-col gap-4 xl:order-2 xl:col-span-5">
          <div className="ring-gradient relative overflow-hidden rounded-2xl bg-card/60 shadow-float backdrop-blur">
            <div className="flex items-center justify-between px-5 pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                {inCall ? <LiveDot /> : <span className="size-2 rounded-full bg-border-strong" />}
                {inCall ? "En ligne" : phase === "ended" ? "Terminé" : "Hors ligne"}
              </span>
              <span className="font-mono tabular">{inCall ? timer : "00:00"}</span>
            </div>
            <div className="flex flex-col items-center px-6 pt-2 pb-6">
              <button onClick={interrupt} aria-label="Interrompre l'agent" className="rounded-full outline-none" disabled={phase !== "speaking"}>
                <Orb state={orbState} level={level} size={240} className="max-sm:scale-90" />
              </button>
              <h1 className="mt-1 text-2xl font-medium tracking-tight">{agentName}</h1>
              <p className="text-[13px] text-muted-foreground">Assistante virtuelle · {profile.name}</p>
              <p className={cn("mt-3 h-5 text-[13px]", phase === "thinking" ? "shimmer-text" : "text-muted-foreground")}>{playing ? "Lecture d'un appel enregistré" : statusText}</p>

              <div className="mt-5 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={muted ? "Activer le son" : "Couper le son"}
                  onClick={() => setMuted((m) => !m)}
                  className="rounded-full"
                >
                  {muted ? <VolumeX /> : <Volume2 />}
                </Button>
                {inCall || playing ? (
                  <button
                    onClick={stopAll}
                    className="inline-flex h-14 items-center gap-2 rounded-full bg-danger px-6 text-[15px] font-medium text-white shadow-[0_10px_30px_-10px_oklch(0.6_0.21_25/0.7)] transition-transform active:scale-95"
                  >
                    <PhoneOff className="size-5" /> Raccrocher
                  </button>
                ) : (
                  <button
                    onClick={() => startCall()}
                    className="inline-flex h-14 items-center gap-2 rounded-full bg-success px-6 text-[15px] font-medium text-[oklch(0.18_0.03_160)] shadow-[0_10px_30px_-10px_oklch(0.74_0.15_158/0.8)] transition-transform hover:brightness-105 active:scale-95"
                  >
                    <Phone className="size-5" /> {phase === "ended" ? "Rappeler" : `Appeler ${agentName}`}
                  </button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={inputMode === "voice" ? "Passer en mode texte" : "Passer en mode vocal"}
                  disabled={!supported}
                  onClick={() => {
                    const next = inputMode === "voice" ? "text" : "voice";
                    setInputMode(next);
                    inputModeRef.current = next;
                    if (next === "text") {
                      listenAbort.current?.abort();
                      if (active.current && phaseRef.current === "listening") setP("idle");
                    } else if (active.current && !busy.current) void listenLoop();
                  }}
                  className="rounded-full"
                >
                  {inputMode === "voice" ? <Keyboard /> : <Mic />}
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[12px] text-muted-foreground">
                <span>Vous parlez</span>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as LanguageCode)}
                  className="rounded-md border border-border bg-subtle px-1.5 py-0.5 text-[12px] text-foreground outline-none"
                  aria-label="Langue de l'appelant"
                >
                  {(["fr", "en", "es", "it", "de", "pt", "ar"] as LanguageCode[]).map((l) => (
                    <option key={l} value={l}>
                      {LANGUAGES[l].flag} {LANGUAGES[l].label}
                    </option>
                  ))}
                </select>
                {!supported && <span className="text-warning">· micro non pris en charge par ce navigateur (Chrome, Edge ou Safari recommandés)</span>}
              </div>
            </div>
          </div>

          <div className="flex min-h-[340px] flex-1 flex-col rounded-2xl border border-border bg-card/60 backdrop-blur">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-[13px] font-medium">Transcription en direct</span>
              <span className="text-[11px] text-muted-foreground">{entries.filter((e) => e.kind === "tool").length} action(s)</span>
            </div>
            <Transcript entries={entries} interim={interim} agentName={agentName} className="h-[360px] flex-1 p-4" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendText(draft);
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={inputMode === "voice" && inCall ? "Ou écrivez votre message…" : `Écrivez à ${agentName}…`}
                className="h-10 flex-1 rounded-xl border border-input bg-background/60 px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary-soft"
                aria-label="Message"
                disabled={!!playing}
              />
              <Button type="submit" size="icon" aria-label="Envoyer" disabled={!draft.trim() || phase === "thinking"} className="rounded-xl">
                <ArrowUp />
              </Button>
            </form>
          </div>
        </section>

        {/* Right: what the team receives */}
        <aside className="order-2 xl:order-3 xl:col-span-4">
          <div className="rounded-2xl border border-border bg-card/40 p-4 backdrop-blur xl:sticky xl:top-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-medium">En temps réel dans vos outils</span>
              <span className="text-[11px] text-muted-foreground">DMS · CRM · SMS · e-mail</span>
            </div>
            <ActionsPanel entries={entries} end={end} agentName={agentName} />
            <div className="mt-4 rounded-xl border border-border bg-subtle p-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">En production</span>, {agentName} répond sur votre numéro (renvoi d&apos;appel ou
              débordement), avec une voix neurale et une latence inférieure à une seconde.{" "}
              <Link href="/onboarding" className="text-primary hover:underline">
                Configurer votre concession →
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
