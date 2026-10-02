/** Minimal Vapi REST client (server-side, optional: needs VAPI_API_KEY on the deployment). */
const BASE = (process.env.VAPI_API_BASE || "https://api.eu.vapi.ai").replace(/\/$/, "");

export const vapiApiEnabled = Boolean(process.env.VAPI_API_KEY);

/** Names the number after the dealership and sets the fallback (the dealership's own line). Best effort. */
export async function personalizeVapiNumber(vapiPhoneNumberId: string, opts: { name: string; fallbackE164?: string | null }) {
  if (!vapiApiEnabled) return false;
  try {
    const res = await fetch(`${BASE}/phone-number/${vapiPhoneNumberId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Ossian · ${opts.name}`.slice(0, 40),
        ...(opts.fallbackE164 ? { fallbackDestination: { type: "number", number: opts.fallbackE164, message: "" } } : {}),
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.error("[vapi-api] personalize failed", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[vapi-api] personalize failed", err);
    return false;
  }
}
