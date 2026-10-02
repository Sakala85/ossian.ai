/** Normalizes a French (or already international) phone number to E.164, or null. */
export function toE164(raw: string | undefined | null, defaultCountry = "33"): string | null {
  if (!raw) return null;
  const s = raw.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(s)) return s;
  if (/^00\d{8,15}$/.test(s)) return `+${s.slice(2)}`;
  if (/^0\d{9}$/.test(s)) return `+${defaultCountry}${s.slice(1)}`;
  return null;
}

/** "+33472004850" → "04 72 00 48 50" (display only). */
export function formatFrench(e164: string) {
  const m = e164.match(/^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/);
  return m ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : e164;
}
