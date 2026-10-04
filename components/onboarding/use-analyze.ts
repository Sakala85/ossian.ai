"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DealershipProfile } from "@/lib/domain/types";
import { ANALYZE_STEPS, type AnalyzeEvent, type AnalyzeStepId } from "@/lib/onboarding/types";

export type StepStatus = "pending" | "running" | "done";

export interface FoundItem {
  key: string;
  step: AnalyzeStepId;
  text: string;
}

export interface AnalysisState {
  status: "idle" | "running" | "done" | "error";
  runId: number;
  url: string;
  startedAt: number;
  doneAt?: number;
  steps: Record<AnalyzeStepId, { status: StepStatus; detail?: string }>;
  found: FoundItem[];
  profile?: DealershipProfile;
  mode?: "ai" | "simulated";
  error?: string;
  /** Why the automatic analysis did not run (starter profile). */
  reason?: string;
}

const TIMEOUT_MS = 150_000;
/** Minimum spacing between two applied events so the checklist reads naturally. */
const PACE_MS = 240;

function initialSteps(): AnalysisState["steps"] {
  return Object.fromEntries(ANALYZE_STEPS.map((s) => [s.id, { status: "pending" as StepStatus }])) as AnalysisState["steps"];
}

const IDLE: AnalysisState = { status: "idle", runId: 0, url: "", startedAt: 0, steps: initialSteps(), found: [] };

/** "3 site(s)" → "3 sites", "1 marque(s)" → "1 marque". */
function fixPlural(t: string) {
  return t.replace(/(\d+)\s+([\p{L}-]+)\(s\)/gu, (_, n: string, w: string) => `${n} ${w}${Number(n) > 1 ? "s" : ""}`).trim();
}

/** Turns a step detail into short "found" chips (brands are split, counts kept whole). */
export function chipsFromDetail(step: AnalyzeStepId, detail: string): string[] {
  if (step === "fetch" || step === "agent") return [fixPlural(detail)];
  return detail
    .split(/\s+[·•|]\s+|;\s*/)
    .flatMap((part) => (/\d/.test(part) || !part.includes(",") ? [part] : part.split(/,\s*/)))
    .map(fixPlural)
    .filter((t) => t.length > 0 && t.length <= 48);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Streams POST /api/onboarding/analyze (NDJSON of AnalyzeEvent) into state.
 * A new `start` aborts the previous run; stale runs never write state.
 */
export function useAnalyze() {
  const [state, setState] = useState<AnalysisState>(IDLE);
  const runRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const cancel = useCallback(() => {
    runRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    setState(IDLE);
  }, []);

  const start = useCallback(async (url: string, name?: string) => {
    const runId = ++runRef.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, TIMEOUT_MS);

    setState({ status: "running", runId, url, startedAt: Date.now(), steps: initialSteps(), found: [] });
    const apply = (fn: (s: AnalysisState) => AnalysisState) => setState((s) => (s.runId === runId ? fn(s) : s));

    let last = 0;
    const pace = async () => {
      const wait = last + PACE_MS - Date.now();
      if (wait > 0) await sleep(wait);
      last = Date.now();
    };

    let finished = false;
    const handle = async (line: string) => {
      let ev: AnalyzeEvent;
      try {
        ev = JSON.parse(line) as AnalyzeEvent;
      } catch {
        return;
      }
      if (ctrl.signal.aborted || runRef.current !== runId) return;
      if (ev.type === "step") {
        await pace();
        apply((s) => {
          const prev = s.steps[ev.id] ?? { status: "pending" };
          const status: StepStatus = prev.status === "done" ? "done" : ev.status;
          const detail = ev.detail ?? prev.detail;
          let found = s.found;
          if (ev.status === "done" && ev.detail && ev.detail !== prev.detail) {
            const known = new Set(found.map((f) => f.text.toLowerCase()));
            const fresh = chipsFromDetail(ev.id, ev.detail)
              .filter((t) => !known.has(t.toLowerCase()))
              .map((text) => ({ key: `${ev.id}:${text}`, step: ev.id, text }));
            found = [...found, ...fresh];
          }
          return { ...s, steps: { ...s.steps, [ev.id]: { status, detail } }, found };
        });
      } else if (ev.type === "profile") {
        await pace();
        finished = true;
        apply((s) => ({
          ...s,
          status: "done",
          doneAt: Date.now(),
          profile: ev.profile,
          mode: ev.mode,
          reason: ev.reason,
          steps: Object.fromEntries(
            Object.entries(s.steps).map(([k, v]) => [k, { ...v, status: "done" as StepStatus }]),
          ) as AnalysisState["steps"],
        }));
      } else if (ev.type === "error") {
        finished = true;
        apply((s) => ({ ...s, status: "error", error: ev.message || "L'analyse n'a pas pu aboutir." }));
      }
    };

    try {
      const res = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(name ? { url, name } : { url }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        let msg = res.status === 400 ? "Cette adresse ne semble pas valide." : `Le service d'analyse a répondu ${res.status}.`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j?.error && res.status === 400) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (line) await handle(line);
        }
      }
      buf += decoder.decode();
      if (buf.trim()) await handle(buf.trim());
      if (!finished) throw new Error("L'analyse s'est interrompue avant la fin.");
    } catch (err) {
      if (runRef.current !== runId) return;
      if (ctrl.signal.aborted && !timedOut) return;
      const message = timedOut
        ? "L'analyse prend plus de temps que prévu."
        : err instanceof TypeError
          ? "Impossible de joindre le service d'analyse. Vérifiez votre connexion."
          : err instanceof Error
            ? err.message
            : "L'analyse n'a pas pu aboutir.";
      apply((s) => ({ ...s, status: "error", error: message }));
    } finally {
      clearTimeout(timer);
    }
  }, []);

  return { state, start, cancel };
}
