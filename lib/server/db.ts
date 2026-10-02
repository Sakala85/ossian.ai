import type { DealershipProfile } from "@/lib/domain/types";

/**
 * Ossian's database API (Supabase Postgres, see supabase/migrations/0002_onboarding.sql).
 *
 * The app talks to a small set of RPC functions with the project's publishable
 * key plus a server key (OSSIAN_DB_KEY) checked inside each function. Tables
 * stay closed to anon/authenticated by RLS, and the service-role key is never
 * needed by the app.
 */

const URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const PUBLISHABLE = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SERVER_KEY = process.env.OSSIAN_DB_KEY || "";

export const dbEnabled = Boolean(URL && PUBLISHABLE && SERVER_KEY);

export class DbError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!dbEnabled) throw new DbError("Database not configured", 503);
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: PUBLISHABLE, "Content-Type": "application/json" },
    body: JSON.stringify({ p_key: SERVER_KEY, ...args }),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    let code: string | undefined;
    let message = text;
    try {
      const j = JSON.parse(text) as { code?: string; message?: string };
      code = j.code;
      message = j.message ?? text;
    } catch {}
    throw new DbError(`${fn}: ${message}`, res.status, code);
  }
  return (text ? JSON.parse(text) : null) as T;
}

/* ------------------------------------------------------------------ */
/* Types returned by the RPC functions                                 */
/* ------------------------------------------------------------------ */

export interface Activation {
  org_id: string;
  dealership_id: string;
  token: string;
  phone: { e164: string; vapi_phone_number_id: string | null } | null;
}

export interface ResolvedNumber {
  dealership_id: string;
  org_id: string;
  profile: DealershipProfile;
  fallback_number: string | null;
  contact_email: string | null;
}

export interface DbCall {
  id: string;
  provider_call_id: string | null;
  direction: "inbound" | "outbound";
  caller_number: string | null;
  caller_name: string | null;
  started_at: string;
  duration_sec: number | null;
  language: string | null;
  intent: string | null;
  outcome: string | null;
  sentiment: string | null;
  after_hours: boolean;
  summary: string | null;
  extracted: Record<string, string>;
  transcript: { role: "agent" | "caller" | "tool"; text: string; t: number }[];
  recording_url: string | null;
}

export interface DbAppointment {
  id: string;
  customer_name: string;
  phone: string;
  vehicle: { label?: string; plate?: string; mileage?: string };
  service: string;
  starts_at: string;
  duration_min: number;
  courtesy_vehicle: boolean;
  status: string;
  source: string;
  created_at: string;
}

export interface DbLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string;
  vehicle: string | null;
  budget: number | null;
  trade_in: string | null;
  stage: string;
  note: string | null;
  created_at: string;
}

export interface DbCallback {
  id: string;
  department: string;
  name: string | null;
  phone: string;
  reason: string;
  priority: "normale" | "haute";
  done_at: string | null;
  created_at: string;
}

export interface Dashboard {
  dealership: {
    id: string;
    name: string;
    agent_name: string | null;
    website: string | null;
    contact_email: string | null;
    fallback_number: string | null;
    created_at: string;
    profile: DealershipProfile;
  };
  phone: { e164: string; assigned_at: string; first_call_at: string | null } | null;
  calls: DbCall[];
  appointments: DbAppointment[];
  leads: DbLead[];
  callbacks: DbCallback[];
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export const db = {
  activate: (profile: DealershipProfile, email: string, fallback: string | null, source: "ai" | "manual" | "simulated") =>
    rpc<Activation>("ossian_activate", { p_profile: profile, p_email: email, p_fallback: fallback, p_source: source }),

  resolveNumber: (e164: string) => rpc<ResolvedNumber | null>("ossian_resolve_number", { p_e164: e164 }),

  markFirstCall: (e164: string) => rpc<boolean>("ossian_mark_first_call", { p_e164: e164 }),

  logCall: (dealershipId: string, call: Partial<Omit<DbCall, "id">>) =>
    rpc<string>("ossian_log_call", { p_dealership: dealershipId, p_call: call }),

  logEvent: (dealershipId: string, kind: "appointment" | "lead" | "callback", data: Record<string, unknown>) =>
    rpc<string>("ossian_log_event", { p_dealership: dealershipId, p_kind: kind, p_data: data }),

  dashboard: (token: string) => rpc<Dashboard | null>("ossian_dashboard", { p_token: token }),

  poolAdd: (e164: string, vapiId: string, provider: string) =>
    rpc<{ id: string; e164: string; status: string }>("ossian_pool_add", { p_e164: e164, p_vapi_id: vapiId, p_provider: provider }),

  poolStatus: () => rpc<{ available: number; assigned: number }>("ossian_pool_status", {}),
};
