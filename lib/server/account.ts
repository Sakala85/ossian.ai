import { cookies } from "next/headers";
import { cache } from "react";
import { db, dbEnabled, type Dashboard } from "./db";

/**
 * Dashboard access for the pilot phase: a private link (/acces/<token>) sets an
 * httpOnly cookie; the token is stored hashed in the database. No password and
 * no email round-trip, so activation is truly one click. Supabase Auth
 * (magic links, teams) can replace it later without changing the data model.
 */
export const ACCESS_COOKIE = "ossian_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ACCESS_MAX_AGE,
};

/** The access token of this browser, if any. */
export async function getAccessToken() {
  if (!dbEnabled) return null;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return token && /^[a-f0-9]{48}$/.test(token) ? token : null;
}

/** The signed-in dealership's data, or null (public demo dashboard). Cached per request. */
export const getAccount = cache(async (): Promise<Dashboard | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await db.dashboard(token);
  } catch (err) {
    console.error("[account] dashboard lookup failed", err);
    return null;
  }
});
