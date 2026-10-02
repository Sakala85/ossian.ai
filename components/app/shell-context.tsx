"use client";

import { createContext, useContext } from "react";

export type Range = "7j" | "30j" | "90j";
export type ToastTone = "success" | "info" | "danger";

/** Who is looking at the dashboard: the public demo workspace, or a real dealership (private access link). */
export type Workspace = {
  name: string;
  initials: string;
  user: string;
  role: string;
  /** true for a real dealership signed in with its access link. */
  live: boolean;
  /** Line under the name in the switcher (real accounts). */
  subtitle?: string;
  agent: { name: string; online: boolean; summary: string };
};

export const DEMO_WORKSPACE: Workspace = {
  name: "Groupe Mistral",
  initials: "GM",
  user: "Claire Fontaine",
  role: "Directrice APV",
  live: false,
  agent: { name: "Léa", online: true, summary: "24h/24 · 7 langues · 3 sites" },
};

export type ShellApi = {
  workspace: Workspace;
  openNav: () => void;
  openCommand: () => void;
  range: Range;
  setRange: (r: Range) => void;
  toast: (message: string, tone?: ToastTone) => void;
};

export const ShellContext = createContext<ShellApi | null>(null);

const fallback: ShellApi = {
  workspace: DEMO_WORKSPACE,
  openNav: () => {},
  openCommand: () => {},
  range: "30j",
  setRange: () => {},
  toast: () => {},
};

export function useShell() {
  return useContext(ShellContext) ?? fallback;
}
