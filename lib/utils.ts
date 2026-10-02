import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// fr-FR uses a narrow no-break space (U+202F) as thousands separator, which nearly
// disappears with tight display tracking; use a regular no-break space instead.
const nbsp = (s: string) => s.replace(/\u202f/g, "\u00a0");

export const euro = (n: number, digits = 0) =>
  nbsp(new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: digits }).format(n));

export const num = (n: number, digits = 0) => nbsp(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(n));

export const pct = (n: number, digits = 0) =>
  nbsp(new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: digits }).format(n));

export function duration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
