#!/usr/bin/env node
/**
 * Ossian × Vapi — setup helper (no dependencies, Node ≥ 20).
 *
 *   npm run vapi -- check                                   Test the deployed Ossian endpoints
 *   npm run vapi -- numbers                                 List the Vapi phone numbers
 *   npm run vapi -- connect <phoneNumberId> [options]       Route a Vapi number to Ossian
 *   npm run vapi -- import-vonage <+33…> --credential <id>  Import a Vonage number, then connect it
 *   npm run vapi -- pool-add <phoneNumberId>                Connect a Vapi number and add it to the self-serve pool
 *   npm run vapi -- pool-status                             Numbers available / assigned in the pool
 *
 * Options for connect / import-vonage:
 *   --fallback <+33…>    Number Vapi forwards to if Ossian is unreachable (the dealership's reception)
 *   --profile <file>     Dealership profile JSON (exported from /demo after onboarding), stored in Redis
 *   --pool               (import-vonage) add the imported number to the self-serve pool
 *
 * Self-serve pool: every number in the pool is handed to the next dealership that
 * activates on /onboarding (or immediately to one that activated while the pool was
 * empty). Keep 2–3 numbers available at all times.
 *
 * Environment (read from the shell or .env.local):
 *   VAPI_API_KEY          Vapi private API key
 *   VAPI_API_BASE         https://api.eu.vapi.ai (default, EU region) or https://api.vapi.ai
 *   OSSIAN_BASE_URL       https://ossian-ai.vercel.app (default)
 *   OSSIAN_VOICE_SECRET   Shared secret, identical to the one set on Vercel
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL / KV_REST_API_TOKEN) for --profile
 *   SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, OSSIAN_DB_KEY  for pool-add / pool-status (same values as on Vercel)
 */
import { existsSync, readFileSync } from "node:fs";

// --- env -------------------------------------------------------------------
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]] && m[2] !== "") process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const VAPI = (process.env.VAPI_API_BASE || "https://api.eu.vapi.ai").replace(/\/$/, "");
const OSSIAN = (process.env.OSSIAN_BASE_URL || "https://ossian-ai.vercel.app").replace(/\/$/, "");
const SECRET = process.env.OSSIAN_VOICE_SECRET;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB_KEY = process.env.OSSIAN_DB_KEY;

const [cmd, ...rest] = process.argv.slice(2);
const positional = rest.filter((a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"));
const opt = (name) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};

const die = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`✔ ${msg}`);

function e164(raw) {
  const s = String(raw ?? "").replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(s)) return s;
  if (/^0\d{9}$/.test(s)) return `+33${s.slice(1)}`;
  return null;
}

async function vapi(method, path, body) {
  if (!process.env.VAPI_API_KEY) die("VAPI_API_KEY manquant");
  const res = await fetch(`${VAPI}${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) die(`Vapi ${method} ${path} → HTTP ${res.status}\n${text}`);
  return text ? JSON.parse(text) : null;
}

async function storeProfile(number, file) {
  if (!REDIS_URL || !REDIS_TOKEN) die("--profile nécessite UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN (ou KV_REST_API_*)");
  const profile = JSON.parse(readFileSync(file, "utf8"));
  if (!profile?.agent || !profile?.name) die(`${file} n'est pas un profil Ossian valide`);
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", `dealership:${number}`, JSON.stringify(profile)]),
  });
  if (!res.ok) die(`Redis SET → HTTP ${res.status}`);
  ok(`Profil « ${profile.name} » associé à ${number}`);
}

async function rpc(fn, args = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY || !DB_KEY) die("SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY et OSSIAN_DB_KEY sont nécessaires (mêmes valeurs que sur Vercel)");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ p_key: DB_KEY, ...args }),
  });
  const text = await res.text();
  if (!res.ok) die(`Supabase ${fn} → HTTP ${res.status}\n${text}`);
  return text ? JSON.parse(text) : null;
}

async function poolAdd(phoneNumberId) {
  const current = await vapi("GET", `/phone-number/${phoneNumberId}`);
  const number = e164(current.number);
  if (!number) die(`Le numéro Vapi ${phoneNumberId} n'a pas de numéro E.164 (SIP ?)`);
  await vapi("PATCH", `/phone-number/${phoneNumberId}`, { ...(current.assistantId ? { assistantId: null } : {}), server: serverConfig() });
  ok(`${number} → ${OSSIAN}/api/voice/vapi`);
  const r = await rpc("ossian_pool_add", { p_e164: number, p_vapi_id: phoneNumberId, p_provider: current.provider === "vonage" ? "vonage" : "vapi" });
  if (r.assigned_to) {
    const d = r.assigned_to;
    const fallback = e164(d.fallback);
    await vapi("PATCH", `/phone-number/${phoneNumberId}`, {
      name: `Ossian · ${d.name}`.slice(0, 40),
      ...(fallback ? { fallbackDestination: { type: "number", number: fallback, message: "" } } : {}),
    });
    ok(`Attribué immédiatement à « ${d.name} », qui attendait un numéro.`);
    console.log(`  → Prévenez ${d.email ?? "la concession"} : son numéro ${number} et les codes de renvoi apparaissent déjà dans son tableau de bord.`);
  } else {
    ok(`Ajouté au stock (statut : ${r.status}).`);
  }
  const s = await rpc("ossian_pool_status");
  console.log(`\nStock : ${s.available} disponible(s), ${s.assigned} attribué(s).`);
}

function serverConfig() {
  if (!SECRET) die("OSSIAN_VOICE_SECRET manquant (même valeur que sur Vercel)");
  return { url: `${OSSIAN}/api/voice/vapi`, headers: { "x-ossian-key": SECRET }, timeoutSeconds: 20 };
}

async function connect(phoneNumberId) {
  const current = await vapi("GET", `/phone-number/${phoneNumberId}`);
  const fallback = e164(opt("fallback"));
  if (opt("fallback") && !fallback) die(`Numéro de secours invalide : ${opt("fallback")}`);
  const patch = {
    // assistant-request is only sent to the server when no assistant is pinned on the number.
    ...(current.assistantId ? { assistantId: null } : {}),
    server: serverConfig(),
    ...(fallback ? { fallbackDestination: { type: "number", number: fallback, message: "" } } : {}),
  };
  const updated = await vapi("PATCH", `/phone-number/${phoneNumberId}`, patch);
  ok(`${updated.number ?? current.number ?? phoneNumberId} → ${OSSIAN}/api/voice/vapi`);
  if (fallback) ok(`Secours si Ossian ne répond pas : ${fallback}`);
  const number = e164(updated.number ?? current.number);
  if (opt("profile")) {
    if (!number) die("Impossible de lire le numéro E.164 du numéro Vapi");
    await storeProfile(number, opt("profile"));
  }
  console.log("\nAppelez le numéro pour tester. Logs : dashboard Vapi → Logs → Calls.");
}

async function check() {
  if (!SECRET) console.warn("⚠ OSSIAN_VOICE_SECRET absent : le test échouera si le secret est défini sur Vercel.");
  const headers = { "Content-Type": "application/json", ...(SECRET ? { "x-ossian-key": SECRET } : {}) };

  const a = await fetch(`${OSSIAN}/api/voice/vapi`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: { type: "assistant-request", call: { id: "check" }, phoneNumber: { number: "+33100000000" } } }),
  });
  if (!a.ok) die(`assistant-request → HTTP ${a.status} (secret OSSIAN_VOICE_SECRET identique des deux côtés ?)`);
  const { assistant } = await a.json();
  ok(`assistant-request : « ${assistant.name} » — accueil : ${assistant.firstMessage}`);
  ok(`LLM : ${assistant.model.url}/chat/completions · voix ${assistant.voice.provider}/${assistant.voice.model} · STT ${assistant.transcriber.provider}/${assistant.transcriber.model} (${assistant.transcriber.language})`);

  const t0 = Date.now();
  const l = await fetch(`${assistant.model.url}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "ossian-agent",
      call: { id: `check-${Date.now()}` },
      customer: { number: "+33612345678" },
      phoneNumber: { number: "+33100000000" },
      messages: [
        { role: "assistant", content: assistant.firstMessage },
        { role: "user", content: "Bonjour, je voudrais prendre rendez-vous pour la révision de ma Peugeot 3008." },
      ],
    }),
  });
  if (!l.ok || !l.body) die(`custom LLM → HTTP ${l.status}`);
  let first = 0;
  let text = "";
  const reader = l.body.getReader();
  const dec = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
      const delta = JSON.parse(line.slice(6)).choices?.[0]?.delta ?? {};
      if (delta.content) {
        first ||= Date.now() - t0;
        text += delta.content;
      }
      if (delta.tool_calls) text += ` [outil Vapi : ${delta.tool_calls[0].function.name}]`;
    }
  }
  ok(`Réponse en ${first} ms (premier mot) : ${text.trim()}`);
}

// --- commands --------------------------------------------------------------
switch (cmd) {
  case "check":
    await check();
    break;
  case "numbers": {
    const list = await vapi("GET", "/phone-number");
    if (!list.length) console.log("Aucun numéro. Importez-en un (Vonage, Twilio, Telnyx ou SIP) dans le dashboard Vapi.");
    for (const n of list) console.log(`${n.id}  ${n.number ?? n.sipUri ?? "?"}  [${n.provider}]  server=${n.server?.url ?? "—"}  assistant=${n.assistantId ?? "—"}`);
    break;
  }
  case "connect":
    if (!positional[0]) die("Usage : connect <phoneNumberId> [--fallback +33…] [--profile profil.json]");
    await connect(positional[0]);
    break;
  case "import-vonage": {
    const number = e164(positional[0]);
    if (!number || !opt("credential")) die("Usage : import-vonage <+33…> --credential <vonageCredentialId> [--fallback +33…] [--profile profil.json]");
    const created = await vapi("POST", "/phone-number", { provider: "vonage", number: number.replace(/^\+/, ""), credentialId: opt("credential"), name: `Ossian ${number}` });
    ok(`Numéro Vonage importé : ${created.id}`);
    if (rest.includes("--pool")) await poolAdd(created.id);
    else await connect(created.id);
    break;
  }
  case "pool-add":
    if (!positional[0]) die("Usage : pool-add <phoneNumberId>   (ids : npm run vapi -- numbers)");
    await poolAdd(positional[0]);
    break;
  case "pool-status": {
    const s = await rpc("ossian_pool_status");
    console.log(`Stock : ${s.available} numéro(s) disponible(s), ${s.assigned} attribué(s).`);
    if (s.available < 2) console.log("⚠ Moins de 2 numéros disponibles : ajoutez-en avec pool-add pour que les prochaines activations soient instantanées.");
    break;
  }
  default:
    console.log(readFileSync(new URL(import.meta.url), "utf8").split("/**")[1].split("*/")[0].replace(/^ \* ?/gm, "").trim());
}
