import registry from "@/config/dealerships.json";
import { DEMO_PROFILE } from "@/lib/demo/profile";
import type { DealershipProfile } from "@/lib/domain/types";
import { toE164 } from "@/lib/voice/phone";
import { db, dbEnabled } from "./db";
import { kv } from "./store";

/**
 * Which dealership answers on a given Ossian number. Lookup order:
 *  1. Database (`phone_numbers` ⨝ `dealerships`), filled by one-click onboarding
 *  2. KV store (`npm run vapi -- connect <id> --profile profil.json`)
 *  3. `config/dealerships.json` ({ "+33XXXXXXXXX": <profile> }, committed)
 *  4. Demo dealership (simulated tools, no real transfers)
 */
export const dealershipKey = (e164: string) => `dealership:${e164}`;

export interface ResolvedDealership {
  profile: DealershipProfile;
  source: "db" | "kv" | "file" | "demo";
  dealershipId?: string;
  orgId?: string;
  fallbackNumber?: string | null;
  /** Where the dealership receives requests, leads and call reports by email. */
  contactEmail?: string | null;
}

export async function resolveDealership(calledNumber?: string | null): Promise<ResolvedDealership> {
  const e164 = toE164(calledNumber);
  if (e164) {
    if (dbEnabled) {
      try {
        const r = await db.resolveNumber(e164);
        if (r?.profile?.agent) {
          return {
            profile: r.profile,
            source: "db",
            dealershipId: r.dealership_id,
            orgId: r.org_id,
            fallbackNumber: r.fallback_number,
            contactEmail: r.contact_email,
          };
        }
      } catch (err) {
        console.error("[dealerships] database lookup failed", err);
      }
    }
    try {
      const p = await kv.get<DealershipProfile>(dealershipKey(e164));
      if (p?.agent) return { profile: p, source: "kv" };
    } catch (err) {
      console.error("[dealerships] KV lookup failed", err);
    }
    const fromFile = (registry as Record<string, DealershipProfile>)[e164];
    if (fromFile?.agent) return { profile: fromFile, source: "file" };
  }
  return { profile: DEMO_PROFILE, source: "demo" };
}

export async function getDealershipByPhone(calledNumber?: string | null): Promise<DealershipProfile> {
  return (await resolveDealership(calledNumber)).profile;
}

export function isDemoDealership(p: DealershipProfile) {
  return p.id === DEMO_PROFILE.id;
}

export function baseUrlFrom(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return requestOrigin(req);
}

/** Origin the browser actually used (redirects that set cookies must stay on it). */
export function requestOrigin(req: Request) {
  const u = new URL(req.url);
  return `${req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "")}://${req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? u.host}`;
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
