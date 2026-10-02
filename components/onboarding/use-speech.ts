"use client";

import { useCallback, useEffect, useState } from "react";
import type { VoiceOption } from "./lib";

/**
 * Browser preview of the agent voices through window.speechSynthesis
 * (each persona gets its own pitch / rate and, when available, a distinct fr-FR system voice).
 */
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
    setSupported(ok);
    if (!ok) return;
    window.speechSynthesis.getVoices(); // warms up the voice list (Chrome loads it lazily)
    return () => window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback((id: string, text: string, voice: VoiceOption) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.pitch = voice.pitch;
    u.rate = voice.rate;
    const fr = synth.getVoices().filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("fr"));
    const chosen = fr.find((v) => voice.prefer.test(v.name)) ?? fr[0];
    if (chosen) u.voice = chosen;
    u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
    u.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));
    setSpeakingId(id);
    synth.speak(u);
  }, []);

  const toggle = useCallback(
    (id: string, text: string, voice: VoiceOption) => {
      if (speakingId === id) stop();
      else speak(id, text, voice);
    },
    [speakingId, speak, stop],
  );

  return { supported, speakingId, speak, stop, toggle };
}

export type Speech = ReturnType<typeof useSpeech>;
