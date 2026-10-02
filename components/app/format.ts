import { DEMO_PROFILE } from "@/lib/demo/profile";

/**
 * Date helpers for the dashboard. Everything is rendered in the dealership's
 * time zone (Europe/Paris) so server and client output are identical.
 */
const TZ = "Europe/Paris";
const make = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, ...o });

const timeF = make({ hour: "2-digit", minute: "2-digit" });
const dayShortF = make({ weekday: "short", day: "numeric", month: "short" });
const dayLongF = make({ weekday: "long", day: "numeric", month: "long" });
const dateShortF = make({ day: "numeric", month: "short" });
const dateLongF = make({ day: "numeric", month: "long", year: "numeric" });
const weekdayShortF = make({ weekday: "short" });
const partsF = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type DateLike = string | number | Date;
const toDate = (d: DateLike) => (d instanceof Date ? d : new Date(d));

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Wall-clock parts in Paris. `weekday` is 0 = lundi … 6 = dimanche. */
export function parisParts(d: DateLike) {
  const p = Object.fromEntries(partsF.formatToParts(toDate(d)).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
    weekday: WEEKDAYS.indexOf(p.weekday ?? "Mon"),
  };
}

export const capitalize = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

export const fmtTime = (d: DateLike) => timeF.format(toDate(d));
export const fmtDayShort = (d: DateLike) => dayShortF.format(toDate(d));
export const fmtDayLong = (d: DateLike) => capitalize(dayLongF.format(toDate(d)));
export const fmtDateShort = (d: DateLike) => dateShortF.format(toDate(d));
export const fmtDateLong = (d: DateLike) => dateLongF.format(toDate(d));
export const fmtWeekdayShort = (d: DateLike) => weekdayShortF.format(toDate(d));

export function dayKey(d: DateLike) {
  const p = parisParts(d);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

const DAY = 86_400_000;

/** "à l'instant", "il y a 9 min", "il y a 3 h", "hier, 14:32", "lun. 14:32", "28 sept." */
export function relTime(d: DateLike, now: DateLike) {
  const t = toDate(d).getTime();
  const n = toDate(now).getTime();
  const min = Math.round((n - t) / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (dayKey(t) === dayKey(n)) return `il y a ${Math.floor(min / 60)} h`;
  if (dayKey(t) === dayKey(n - DAY)) return `hier, ${fmtTime(t)}`;
  if (n - t < 6 * DAY) return `${fmtWeekdayShort(t)} ${fmtTime(t)}`;
  return fmtDateShort(t);
}

/** Group label for day separators. */
export function dayLabel(d: DateLike, now: DateLike) {
  const n = toDate(now).getTime();
  const k = dayKey(d);
  if (k === dayKey(n)) return "Aujourd'hui";
  if (k === dayKey(n - DAY)) return "Hier";
  return fmtDayLong(d);
}

/** Compact age: "12 min", "3 h", "2 j", "3 sem." */
export function age(d: DateLike, now: DateLike) {
  const min = Math.max(0, Math.round((toDate(now).getTime() - toDate(d).getTime()) / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const days = Math.floor(h / 24);
  if (days < 14) return `${days} j`;
  return `${Math.floor(days / 7)} sem.`;
}

/** "9h", "9h15" from minutes since midnight. */
export function hm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

const SITE_SHORT: Record<string, string> = {
  "lyon-est": "Lyon Est",
  villeurbanne: "Villeurbanne",
  bron: "Bron",
};

export const SITES = DEMO_PROFILE.sites.map((s) => ({ id: s.id, name: s.name, short: SITE_SHORT[s.id] ?? s.name }));
export const siteShort = (id: string) => SITE_SHORT[id] ?? id;

/** Compact euro: 12 400 € → "12,4 k€" */
export function euroCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n / 1_000_000)} M€`;
  if (Math.abs(n) >= 10_000) return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n / 1000)} k€`;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

/** Signed percentage delta: 0.124 → "+12 %" */
export function signedPct(n: number, digits = 0) {
  const s = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: digits, signDisplay: "exceptZero" });
  return s.format(n);
}
