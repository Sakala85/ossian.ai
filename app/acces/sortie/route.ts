import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/server/account";
import { requestOrigin } from "@/lib/server/dealerships";

export const dynamic = "force-dynamic";

/** Signs this browser out of the dealership dashboard (the access link keeps working). */
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/", requestOrigin(req)), 303);
  res.cookies.delete(ACCESS_COOKIE);
  return res;
}
