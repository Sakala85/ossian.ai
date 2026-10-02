import { z } from "zod";
import { getAccessToken } from "@/lib/server/account";
import { db, DbError } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("appointment"), id: z.string().uuid(), value: z.enum(["confirme", "en_attente", "honore", "no_show", "annule"]) }),
  z.object({ kind: z.literal("lead"), id: z.string().uuid(), value: z.enum(["nouveau", "contacte", "essai", "offre", "gagne", "perdu"]) }),
  z.object({ kind: z.literal("callback"), id: z.string().uuid(), value: z.enum(["done", "open"]) }),
]);

/** Follow-up from the dashboard: confirm an appointment, move a lead, tick off a callback. */
export async function POST(req: Request) {
  const token = await getAccessToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  const { kind, id, value } = parsed.data;
  try {
    const found = await db.updateItem(token, kind, id, value);
    return found ? Response.json({ ok: true }) : Response.json({ error: "not_found" }, { status: 404 });
  } catch (err) {
    console.error("[account/items]", err);
    const status = err instanceof DbError && err.code === "42501" ? 401 : 500;
    return Response.json({ error: status === 401 ? "unauthorized" : "update_failed" }, { status });
  }
}
