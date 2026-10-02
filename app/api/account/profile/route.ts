import { z } from "zod";
import type { DealershipProfile } from "@/lib/domain/types";
import { getAccessToken, getAccount } from "@/lib/server/account";
import { db, DbError } from "@/lib/server/db";
import { toE164 } from "@/lib/voice/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  fallback: z.string().max(40).optional(),
  profile: z
    .object({
      name: z.string().trim().min(1).max(160),
      agent: z.object({ name: z.string().trim().min(1).max(40), greeting: z.string().trim().min(1).max(600) }).passthrough(),
      sites: z.array(z.object({}).passthrough()).max(50),
      hours: z.array(z.object({}).passthrough()).max(60),
      services: z.array(z.object({}).passthrough()).max(200),
      departments: z.array(z.object({}).passthrough()).max(30),
      policies: z.array(z.string()).max(60),
      faq: z.array(z.object({}).passthrough()).max(100),
    })
    .passthrough(),
});

/** The signed-in dealership's saved profile (used by /demo to test the real agent). */
export async function GET() {
  const account = await getAccount();
  if (!account) return Response.json({ profile: null });
  return Response.json({ profile: account.dealership.profile });
}

/** Saves the signed-in dealership's profile: the agent uses it from the next call. */
export async function POST(req: Request) {
  const token = await getAccessToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_profile" }, { status: 400 });
  // undefined: unchanged · "": removed · otherwise must be a valid number.
  const raw = parsed.data.fallback?.trim();
  const fallback = raw === undefined ? null : raw === "" ? "" : toE164(raw);
  if (fallback === null && raw) return Response.json({ error: "invalid_fallback" }, { status: 400 });
  try {
    const r = await db.updateProfile(token, parsed.data.profile as unknown as DealershipProfile, fallback);
    return Response.json({ ok: true, updatedAt: r.updated_at });
  } catch (err) {
    console.error("[account/profile]", err);
    const status = err instanceof DbError && err.code === "42501" ? 401 : 500;
    return Response.json({ error: status === 401 ? "unauthorized" : "save_failed" }, { status });
  }
}
