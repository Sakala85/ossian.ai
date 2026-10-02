export type Phase = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "ended";

export type Entry =
  | { kind: "agent" | "caller"; id: string; text: string; streaming?: boolean }
  | { kind: "tool"; id: string; name: string; input: Record<string, unknown>; result?: unknown; ok?: boolean }
  | { kind: "system"; id: string; text: string; tone?: "info" | "error" };

export interface EndSummary {
  outcome: string;
  summary: string;
}
