import registry from "@/config/dealerships.json";
import { DEMO_PROFILE } from "@/lib/demo/profile";
import type { DealershipProfile } from "@/lib/domain/types";
import { toE164 } from "@/lib/voice/phone";
import { kv } from "./store";

/**
 * Which dealership answers on a given Ossian number.
 *
 * Pilot phase, two zero-database options (profile exported from /demo after onboarding):
 *  1. KV store: `npm run vapi -- connect <id> --profile profil.json`
 *  2. `config/dealerships.json`: { "+33XXXXXXXXX": <profile> }, committed and deployed
 * Production: `phone_numbers` ⨝ `dealerships` in Postgres (supabase/migrations).
 * Unknown numbers get the demo dealership (no real transfers, simulated tools).
 */
export const dealershipKey = (e164: string) => `dealership:${e164}`;

export async function getDealershipByPhone(calledNumber?: string | null): Promise<DealershipProfile> {
  const e164 = toE164(calledNumber);
  if (e164) {
    try {
      const p = await kv.get<DealershipProfile>(dealershipKey(e164));
      if (p?.agent) return p;
    } catch (err) {
      console.error("[dealerships] KV lookup failed", err);
    }
    const fromFile = (registry as Record<string, DealershipProfile>)[e164];
    if (fromFile?.agent) return fromFile;
  }
  return DEMO_PROFILE;
}

export function isDemoDealership(p: DealershipProfile) {
  return p.id === DEMO_PROFILE.id;
}

export function baseUrlFrom(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const u = new URL(req.url);
  return `${req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "")}://${req.headers.get("x-forwarded-host") ?? u.host}`;
}

/**
 * Shared-secret check for provider calls (Vapi webhooks and custom LLM).
 * Accepts the secret in `x-ossian-key` (what Ossian configures on Vapi),
 * `Authorization: Bearer …` (Vapi custom credential) or legacy `x-vapi-secret`.
 * Open in local development when OSSIAN_VOICE_SECRET is unset; closed in production.
 */
export function isAuthorizedProvider(req: Request) {
  const expected = process.env.OSSIAN_VOICE_SECRET;
  if (!expected) return process.env.NODE_ENV !== "production";
  const candidates = [
    req.headers.get("x-ossian-key"),
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, ""),
    req.headers.get("x-vapi-secret"),
  ];
  return candidates.some((c) => safeEqual(c, expected));
}

function safeEqual(provided: string | null | undefined, expected: string) {
  if (!provided || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
