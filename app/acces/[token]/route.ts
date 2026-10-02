import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessCookieOptions } from "@/lib/server/account";
import { db, dbEnabled } from "@/lib/server/db";
import { requestOrigin } from "@/lib/server/dealerships";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Private dashboard link: validates the token, stores it in an httpOnly cookie, opens /app. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invalid = NextResponse.redirect(new URL("/onboarding?lien=invalide", requestOrigin(req)), 303);
  if (!dbEnabled || !/^[a-f0-9]{48}$/.test(token)) return invalid;
  const data = await db.dashboard(token).catch(() => null);
  if (!data) return invalid;
  const res = NextResponse.redirect(new URL("/app?bienvenue=1", requestOrigin(req)), 303);
  res.cookies.set(ACCESS_COOKIE, token, accessCookieOptions);
  return res;
}
