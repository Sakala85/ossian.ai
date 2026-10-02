import { getAccount } from "@/lib/server/account";
import { formatFrench } from "@/lib/voice/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live go-live status for the signed-in dealership (polled by the success screen). */
export async function GET() {
  const account = await getAccount();
  if (!account) return Response.json({ signedIn: false });
  return Response.json({
    signedIn: true,
    name: account.dealership.name,
    phone: account.phone ? { e164: account.phone.e164, display: formatFrench(account.phone.e164) } : null,
    firstCallAt: account.phone?.first_call_at ?? null,
    calls: account.calls.length,
  });
}
