/** Paris-local date helpers (servers run in UTC; dealerships live in Europe/Paris). */

export const TZ = "Europe/Paris";

export interface LocalParts {
  date: string; // YYYY-MM-DD
  weekday: number; // 0 = Sunday
  hour: number;
  minute: number;
}

export function parisParts(d = new Date()): LocalParts {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday!);
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: wd, hour: Number(p.hour), minute: Number(p.minute) };
}

/** Adds days to a YYYY-MM-DD string. */
export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const x = new Date(Date.UTC(y!, m! - 1, d! + days));
  return x.toISOString().slice(0, 10);
}

export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** "jeudi 9 octobre" */
export function frenchDate(date: string) {
  const [, m, d] = date.split("-").map(Number);
  return `${DAYS[weekdayOf(date)]} ${d === 1 ? "1er" : d} ${MONTHS[m! - 1]}`;
}

/** 510 -> "8h30" */
export function frenchTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, "0")}`;
}

export function nowLabel(d = new Date()) {
  const p = parisParts(d);
  return `${frenchDate(p.date)} ${p.date.slice(0, 4)}, ${frenchTime(p.hour * 60 + p.minute)} (heure de Paris)`;
}

/** The UTC instant at which it is `minutes` past midnight on `date` (YYYY-MM-DD) in Paris. */
export function parisToUtc(date: string, minutes: number) {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y!, m! - 1, d!, 0, minutes);
  const p = parisParts(new Date(guess));
  const local = Date.UTC(Number(p.date.slice(0, 4)), Number(p.date.slice(5, 7)) - 1, Number(p.date.slice(8, 10)), p.hour, p.minute);
  return new Date(guess - (local - guess));
}
