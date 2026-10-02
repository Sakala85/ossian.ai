import { DEPARTMENTS, type DealershipProfile } from "@/lib/domain/types";
import { toE164 } from "./phone";

/**
 * Telephony adapter for Vapi (managed real-time voice: PSTN/SIP, VAD,
 * barge-in, STT, TTS). Vapi handles the audio; the "brain" stays in our code:
 * Vapi calls our OpenAI-compatible endpoint (`/api/voice/llm/chat/completions`)
 * which runs the Claude runtime with Ossian's tools (lib/agent).
 *
 * Field names are checked against Vapi's OpenAPI spec (CreateAssistantDTO,
 * CustomLLMModel, DeepgramTranscriber, ElevenLabsVoice, CreateTransferCallToolDTO).
 * Swapping to another voice platform only requires another adapter like this one.
 */

/** Subset of Vapi's ServerMessage we rely on. */
export interface VapiServerMessage {
  message: {
    type: string;
    timestamp?: number;
    call?: VapiCall;
    phoneNumber?: { id?: string; number?: string };
    customer?: { number?: string; name?: string };
    endedReason?: string;
    startedAt?: string;
    endedAt?: string;
    cost?: number;
    status?: string;
    analysis?: { summary?: string; successEvaluation?: string; structuredData?: unknown };
    artifact?: {
      transcript?: string;
      recordingUrl?: string;
      stereoRecordingUrl?: string;
      messages?: { role: string; message?: string; time?: number; secondsFromStart?: number }[];
    };
  };
}

export interface VapiCall {
  id: string;
  phoneNumberId?: string;
  customer?: { number?: string; name?: string };
  phoneNumber?: { number?: string };
}

/** Body Vapi POSTs to a custom-llm `/chat/completions` (metadataSendMode "variable"). */
export interface VapiLlmRequest {
  model?: string;
  messages: { role: "system" | "user" | "assistant" | "tool" | "function"; content: string | null; tool_calls?: unknown[] }[];
  tools?: unknown[];
  call?: VapiCall;
  phoneNumber?: { id?: string; number?: string };
  customer?: { number?: string; name?: string };
  metadata?: { dealershipId?: string; calledNumber?: string };
}

const VOICE_IDS: Record<string, string> = {
  "lea-fr": process.env.ELEVENLABS_VOICE_ID || "XB0fDUnXU5powFXDhCwa",
};

/** Departments that can actually be transferred to (valid E.164 number). */
export function transferDestinations(profile: DealershipProfile) {
  return profile.departments
    .map((d) => ({ d, e164: toE164(d.phone) }))
    .filter((x): x is { d: (typeof profile.departments)[number]; e164: string } => Boolean(x.e164))
    .map(({ d, e164 }) => ({
      type: "number" as const,
      number: e164,
      description: `${d.label || DEPARTMENTS[d.key]} (${d.key}) — ${d.hours}`,
      message: "",
    }));
}

export function buildVapiAssistant(
  profile: DealershipProfile,
  baseUrl: string,
  opts: { calledNumber?: string; allowTransfers: boolean },
) {
  const secret = process.env.OSSIAN_VOICE_SECRET;
  const authHeaders = secret ? { "x-ossian-key": secret } : undefined;
  // Never transfer real callers to the demo dealership's fictional numbers.
  const destinations = opts.allowTransfers ? transferDestinations(profile) : [];
  const multilingual = profile.agent.languages.length > 1;

  return {
    name: `${profile.agent.name} · ${profile.name}`.slice(0, 40),
    firstMessage: profile.agent.greeting,
    firstMessageMode: "assistant-speaks-first",
    model: {
      provider: "custom-llm",
      // OpenAI-client base URL: Vapi appends /chat/completions.
      url: `${baseUrl}/api/voice/llm`,
      model: "ossian-agent",
      metadataSendMode: "variable",
      timeoutSeconds: 20,
      ...(authHeaders ? { headers: authHeaders } : {}),
      // Vapi-executed tools: Ossian's runtime decides, Vapi performs the telephony action.
      tools: [...(destinations.length ? [{ type: "transferCall", destinations }] : []), { type: "endCall" }],
    },
    voice: {
      provider: "11labs",
      voiceId: VOICE_IDS[profile.agent.voiceId] ?? VOICE_IDS["lea-fr"],
      model: "eleven_flash_v2_5",
      stability: 0.45,
      similarityBoost: 0.8,
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: multilingual ? "multi" : (profile.agent.languages[0] ?? "fr"),
    },
    backgroundSound: "office",
    maxDurationSeconds: 900,
    endCallPhrases: ["très bonne journée", "très bonne soirée", "have a great day"],
    artifactPlan: { recordingEnabled: profile.agent.recordCalls },
    server: { url: `${baseUrl}/api/voice/vapi`, ...(authHeaders ? { headers: authHeaders } : {}) },
    serverMessages: ["end-of-call-report", "status-update", "hang"],
    metadata: { dealershipId: profile.id, calledNumber: opts.calledNumber ?? null },
  };
}

/* ------------------------------------------------------------------ */
/* OpenAI-compatible SSE helpers for the custom-llm endpoint           */
/* ------------------------------------------------------------------ */

export function sseChunker(model = "ossian-agent") {
  const encoder = new TextEncoder();
  const id = `chatcmpl-${Date.now().toString(36)}`;
  const created = Math.floor(Date.now() / 1000);
  const frame = (delta: Record<string, unknown>, finish: string | null = null) =>
    encoder.encode(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model, choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`);
  return {
    role: () => frame({ role: "assistant" }),
    text: (content: string) => frame({ content }),
    /** Ask Vapi to run one of its built-in tools (transferCall, endCall). */
    toolCall: (name: string, args: Record<string, unknown>) =>
      frame({ tool_calls: [{ index: 0, id: `call_${Math.random().toString(36).slice(2, 12)}`, type: "function", function: { name, arguments: JSON.stringify(args) } }] }),
    finish: (reason: "stop" | "tool_calls") => frame({}, reason),
    done: () => encoder.encode("data: [DONE]\n\n"),
  };
}
