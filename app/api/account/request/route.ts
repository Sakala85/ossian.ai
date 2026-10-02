import { z } from "zod";
import { getAccount } from "@/lib/server/account";
import { notifyTeam } from "@/lib/server/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ topic: z.enum(["integration", "campaigns", "team", "help"]), detail: z.string().trim().max(500).optional() });

/** A dealership asks the Ossian team for something not self-serve yet (DMS connection, campaigns…). */
export async function POST(req: Request) {
  const account = await getAccount();
  if (!account) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  const { topic, detail } = parsed.data;
  const label = { integration: "Demande de connexion", campaigns: "Intérêt campagnes sortantes", team: "Ajout de collaborateurs", help: "Demande d'aide" }[topic];
  await notifyTeam("demande", account.dealership.name, label, {
    Détail: detail,
    Contact: account.dealership.contact_email,
    Concession: account.dealership.id,
  });
  return Response.json({ ok: true });
}
