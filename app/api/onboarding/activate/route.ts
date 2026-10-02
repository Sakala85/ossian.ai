import { cookies } from "next/headers";
import { z } from "zod";
import type { DealershipProfile } from "@/lib/domain/types";
import { ACCESS_COOKIE, accessCookieOptions } from "@/lib/server/account";
import { db, dbEnabled, DbError } from "@/lib/server/db";
import { baseUrlFrom } from "@/lib/server/dealerships";
import { notifyTeam } from "@/lib/server/notify";
import { sendWelcomeEmail } from "@/lib/server/welcome";
import { kv } from "@/lib/server/store";
import { formatFrench, toE164 } from "@/lib/voice/phone";
import { personalizeVapiNumber } from "@/lib/voice/vapi-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  fallback: z.string().max(40).optional(),
  source: z.enum(["ai", "manual", "simulated"]).default("ai"),
  tools: z.object({ dms: z.string().max(60).optional(), crm: z.string().max(60).optional() }).optional(),
  profile: z
    .object({
      name: z.string().trim().min(1).max(160),
      agent: z.object({ name: z.string().min(1), greeting: z.string().min(1) }).passthrough(),
    })
    .passthrough(),
});

/**
 * One-click activation: creates the account (organization + dealership + sites),
 * assigns a number from the pre-provisioned pool, and signs the browser in with
 * a private access cookie. Returns everything the success screen needs.
 */
export async function POST(req: Request) {
  if (!dbEnabled) return Response.json({ error: "not_configured" }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const emailIssue = parsed.error.issues.some((i) => i.path[0] === "email");
    return Response.json({ error: emailIssue ? "invalid_email" : "invalid_profile" }, { status: 400 });
  }
  const { email, source } = parsed.data;
  const profile = parsed.data.profile as unknown as DealershipProfile;

  // Light abuse guard: 5 activations per IP per hour.
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0]!.trim();
  const rlKey = `rl:activate:${ip}`;
  const count = ((await kv.get<number>(rlKey).catch(() => 0)) ?? 0) + 1;
  await kv.set(rlKey, count, 3600).catch(() => {});
  if (count > 5) return Response.json({ error: "rate_limited" }, { status: 429 });

  const fallback = toE164(parsed.data.fallback) ?? toE164(profile.sites?.[0]?.phone);

  try {
    const a = await db.activate(profile, email, fallback, source);
    (await cookies()).set(ACCESS_COOKIE, a.token, accessCookieOptions);

    if (a.phone?.vapi_phone_number_id) {
      await personalizeVapiNumber(a.phone.vapi_phone_number_id, { name: profile.name, fallbackE164: fallback });
    }
    const accessUrl = `${baseUrlFrom(req)}/acces/${a.token}`;
    const [emailSent] = await Promise.all([
      sendWelcomeEmail({ to: email, dealership: profile.name, agent: profile.agent.name, phone: a.phone?.e164 ?? null, accessUrl }),
      notifyTeam("activation", profile.name, a.phone ? "Nouvelle concession activée" : "Activation en attente de numéro (stock vide)", {
        Email: email,
        Site: profile.website,
        Numéro: a.phone ? formatFrench(a.phone.e164) : "à attribuer",
        Secours: fallback ? formatFrench(fallback) : undefined,
        DMS: parsed.data.tools?.dms,
        CRM: parsed.data.tools?.crm,
      }),
    ]);

    return Response.json({
      ok: true,
      dealershipId: a.dealership_id,
      accessUrl,
      emailSent,
      phone: a.phone ? { e164: a.phone.e164, display: formatFrench(a.phone.e164) } : null,
      fallback: fallback ? formatFrench(fallback) : null,
    });
  } catch (err) {
    console.error("[onboarding/activate]", err);
    if (err instanceof DbError && err.message.includes("invalid_email")) return Response.json({ error: "invalid_email" }, { status: 400 });
    return Response.json({ error: "activation_failed" }, { status: 500 });
  }
}
