import type { DealershipProfile } from "@/lib/domain/types";

/**
 * Telephony adapter for Vapi (managed real-time voice: SIP/PSTN, VAD,
 * barge-in, STT, TTS). Vapi handles the audio; the "brain" stays in our code:
 * Vapi calls our OpenAI-compatible endpoint (/api/voice/llm/chat/completions),
 * which runs the Claude runtime with Ossian's tools (lib/agent).
 *
 * Swapping to Retell, ElevenLabs Agents or a self-hosted Pipecat/LiveKit stack
 * only requires another adapter like this one.
 */

export interface VapiServerMessage {
  message: {
    type: "assistant-request" | "end-of-call-report" | "status-update" | "transcript" | "hang" | "tool-calls" | string;
    call?: { id: string; phoneNumberId?: string; customer?: { number?: string } };
    phoneNumber?: { number?: string };
    customer?: { number?: string };
    endedReason?: string;
    recordingUrl?: string;
    durationSeconds?: number;
    analysis?: { summary?: string; successEvaluation?: string };
    artifact?: { transcript?: string; messages?: { role: string; message?: string; time?: number }[] };
  };
}

const VOICES: Record<string, string> = {
  "lea-fr": process.env.ELEVENLABS_VOICE_ID || "XB0fDUnXU5powFXDhCwa",
};

export function buildVapiAssistant(profile: DealershipProfile, baseUrl: string) {
  return {
    name: `${profile.agent.name} — ${profile.name}`.slice(0, 40),
    firstMessage: profile.agent.greeting,
    firstMessageMode: "assistant-speaks-first",
    model: {
      provider: "custom-llm",
      url: `${baseUrl}/api/voice/llm`,
      model: "ossian-agent",
      metadataSendMode: "variable",
    },
    voice: {
      provider: "11labs",
      voiceId: VOICES[profile.agent.voiceId] ?? VOICES["lea-fr"],
      model: "eleven_flash_v2_5",
      stability: 0.45,
      similarityBoost: 0.8,
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: profile.agent.languages.length > 1 ? "multi" : profile.agent.languages[0] ?? "fr",
    },
    silenceTimeoutSeconds: 20,
    maxDurationSeconds: 900,
    backgroundSound: "office",
    backchannelingEnabled: true,
    recordingEnabled: profile.agent.recordCalls,
    endCallPhrases: ["très bonne journée", "bonne soirée", "have a great day", "ne quittez pas"],
    server: { url: `${baseUrl}/api/voice/vapi` },
    serverMessages: ["end-of-call-report", "status-update", "hang"],
  };
}
