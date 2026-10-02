"use client";

/* ------------------------------------------------------------------ */
/* Browser speech helpers for the live demo.                          */
/* Production telephony uses a streaming voice stack (see docs/), the */
/* browser path exists so prospects can talk to their agent anywhere. */
/* ------------------------------------------------------------------ */

type RecognitionCtor = new () => SpeechRecognitionLike;

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart?: (() => void) | null;
}

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const SPEECH_LOCALES: Record<string, string> = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
  it: "it-IT",
  de: "de-DE",
  pt: "pt-PT",
  ar: "ar-MA",
  nl: "nl-NL",
};

/**
 * One utterance of caller speech. Resolves with the final transcript, or "" on
 * silence. `onInterim` streams partial text for live captions.
 */
export function listenOnce(lang: string, onInterim: (t: string) => void, signal?: AbortSignal): Promise<string> {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return Promise.reject(new Error("unsupported"));
  return new Promise((resolve, reject) => {
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalText = "";
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]!;
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      onInterim((finalText + " " + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") done(() => resolve(finalText.trim()));
      else done(() => reject(new Error(e.error)));
    };
    rec.onend = () => done(() => resolve(finalText.trim()));
    signal?.addEventListener("abort", () => {
      try {
        rec.abort();
      } catch {}
      done(() => resolve(""));
    });
    try {
      rec.start();
    } catch (err) {
      done(() => reject(err as Error));
    }
  });
}

/* ------------------------------------------------------------------ */
/* Text-to-speech                                                      */
/* ------------------------------------------------------------------ */

const PREFERRED = [/natural/i, /neural/i, /premium/i, /enhanced/i, /google/i, /amélie|amelie|audrey|aurélie|denise|vivienne|eloise|léa|lea\b/i];

export function pickVoice(lang: string, variant: "agent" | "caller" = "agent"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const all = window.speechSynthesis.getVoices();
  const base = lang.slice(0, 2).toLowerCase();
  const candidates = all.filter((v) => v.lang.toLowerCase().startsWith(base));
  if (!candidates.length) return null;
  const score = (v: SpeechSynthesisVoice) => PREFERRED.reduce((s, re, i) => (re.test(v.name) ? s + (PREFERRED.length - i) : s), 0) + (v.lang.toLowerCase() === lang.toLowerCase() ? 2 : 0);
  const sorted = [...candidates].sort((a, b) => score(b) - score(a));
  if (variant === "caller") return sorted.find((v) => /thomas|paul|henri|male|homme|daniel|nicolas/i.test(v.name)) ?? sorted[1] ?? sorted[0]!;
  return sorted[0]!;
}

/** Wait until the browser has loaded its voice list (Chrome loads them async). */
export function voicesReady(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
  if (window.speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((resolve) => {
    const t = setTimeout(resolve, 1200);
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

/** Cleans text for speech: no markdown, symbols read naturally. */
export function speakable(text: string) {
  return text
    .replace(/[*_#`>]/g, "")
    .replace(/\s+/g, " ")
    .replace(/€/g, " euros")
    .trim();
}

/**
 * Sentence-level TTS queue. Text deltas are pushed as they stream in; complete
 * sentences are spoken immediately so the agent starts talking before the LLM
 * has finished generating. Uses ElevenLabs via /api/tts when available,
 * otherwise the browser's speechSynthesis.
 */
export class Speaker {
  private buffer = "";
  private queue: Promise<void> = Promise.resolve();
  private pending = 0;
  private audio: HTMLAudioElement | null = null;
  /** Bumped on cancel(): queued sentences from an older generation are dropped. */
  private gen = 0;
  muted = false;
  premium = false;
  lang = "fr-FR";
  rate = 1.04;
  pitch = 1;
  onLevel?: (level: number) => void;
  onActive?: (active: boolean) => void;

  push(delta: string) {
    this.buffer += delta;
    const re = /([^.!?…]+[.!?…]+)(\s+|$)/g;
    let m: RegExpExecArray | null;
    let consumed = 0;
    while ((m = re.exec(this.buffer)) && m.index === consumed && m[2]) {
      this.enqueue(m[1]!);
      consumed = re.lastIndex;
    }
    this.buffer = this.buffer.slice(consumed);
  }

  flush() {
    if (this.buffer.trim()) this.enqueue(this.buffer);
    this.buffer = "";
  }

  say(text: string, opts?: { voice?: "agent" | "caller"; lang?: string }) {
    this.enqueue(text, opts);
    return this.idle();
  }

  idle() {
    return this.queue;
  }

  get speaking() {
    return this.pending > 0;
  }

  cancel() {
    this.gen++;
    this.buffer = "";
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    this.audio?.pause();
    this.audio = null;
    this.pending = 0;
    this.queue = Promise.resolve();
    this.onActive?.(false);
    this.onLevel?.(0);
  }

  private enqueue(raw: string, opts?: { voice?: "agent" | "caller"; lang?: string }) {
    const text = speakable(raw);
    if (!text) return;
    const gen = this.gen;
    this.pending++;
    this.onActive?.(true);
    this.queue = this.queue
      .then(() => {
        if (gen !== this.gen) return;
        if (this.muted) return this.fakeSpeak(text);
        return this.premium && opts?.voice !== "caller" ? this.speakPremium(text, gen) : this.speakBrowser(text, opts);
      })
      .catch(() => {})
      .finally(() => {
        if (gen !== this.gen) return;
        this.pending = Math.max(0, this.pending - 1);
        if (this.pending === 0) {
          this.onActive?.(false);
          this.onLevel?.(0);
        }
      });
  }

  /** When muted, still pace the conversation like speech would. */
  private fakeSpeak(text: string) {
    return new Promise<void>((r) => setTimeout(r, Math.min(4000, 250 + text.length * 22)));
  }

  private speakBrowser(text: string, opts?: { voice?: "agent" | "caller"; lang?: string }) {
    return new Promise<void>((resolve) => {
      const synth = window.speechSynthesis;
      if (!synth) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      const lang = opts?.lang ?? this.lang;
      u.lang = lang;
      const v = pickVoice(lang, opts?.voice);
      if (v) u.voice = v;
      u.rate = opts?.voice === "caller" ? 1.08 : this.rate;
      u.pitch = opts?.voice === "caller" ? 0.82 : this.pitch;
      let ticker: ReturnType<typeof setInterval> | undefined;
      u.onstart = () => {
        ticker = setInterval(() => this.onLevel?.(0.35 + Math.random() * 0.55), 90);
      };
      u.onboundary = () => this.onLevel?.(0.7 + Math.random() * 0.3);
      const end = () => {
        if (ticker) clearInterval(ticker);
        this.onLevel?.(0);
        resolve();
      };
      u.onend = end;
      u.onerror = end;
      // Chrome sometimes never fires onend for long utterances; guard with a timeout.
      setTimeout(end, 1500 + text.length * 120);
      synth.speak(u);
    });
  }

  private async speakPremium(text: string, gen: number) {
    const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    if (!res.ok) return this.speakBrowser(text);
    const blob = await res.blob();
    if (gen !== this.gen) return;
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const a = new Audio(url);
      this.audio = a;
      let ticker: ReturnType<typeof setInterval> | undefined;
      a.onplay = () => {
        ticker = setInterval(() => this.onLevel?.(0.35 + Math.random() * 0.6), 90);
      };
      const end = () => {
        if (ticker) clearInterval(ticker);
        URL.revokeObjectURL(url);
        this.onLevel?.(0);
        resolve();
      };
      a.onended = end;
      a.onerror = end;
      a.play().catch(end);
    });
  }
}

/** Live microphone level (0..1) for the orb while the caller speaks. */
export async function micLevelMeter(onLevel: (l: number) => void): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  src.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  let raf = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const v of data) sum += ((v - 128) / 128) ** 2;
    onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
    raf = requestAnimationFrame(tick);
  };
  tick();
  return () => {
    cancelAnimationFrame(raf);
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
  };
}
