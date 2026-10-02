"use client";

import { createContext, useContext } from "react";

export type Range = "7j" | "30j" | "90j";
export type ToastTone = "success" | "info" | "danger";

export type ShellApi = {
  openNav: () => void;
  openCommand: () => void;
  range: Range;
  setRange: (r: Range) => void;
  toast: (message: string, tone?: ToastTone) => void;
};

export const ShellContext = createContext<ShellApi | null>(null);

const fallback: ShellApi = {
  openNav: () => {},
  openCommand: () => {},
  range: "30j",
  setRange: () => {},
  toast: () => {},
};

export function useShell() {
  return useContext(ShellContext) ?? fallback;
}
