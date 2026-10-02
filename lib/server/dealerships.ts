import { DEMO_PROFILE } from "@/lib/demo/profile";
import type { DealershipProfile } from "@/lib/domain/types";

/**
 * Resolves which dealership a phone number belongs to.
 * Demo: every number maps to the demo profile. Production: query
 * `phone_numbers` ⨝ `dealerships` in Postgres (supabase/migrations/0001_init.sql).
 */
export async function getDealershipByPhone(_calledNumber?: string): Promise<DealershipProfile> {
  return DEMO_PROFILE;
}

export function baseUrlFrom(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const u = new URL(req.url);
  return `${req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "")}://${req.headers.get("x-forwarded-host") ?? u.host}`;
}

/** Constant-time-ish shared secret check for provider webhooks. */
export function checkSecret(provided: string | null | undefined, expected: string | undefined) {
  if (!expected) return process.env.NODE_ENV !== "production"; // open in local dev only
  if (!provided || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
