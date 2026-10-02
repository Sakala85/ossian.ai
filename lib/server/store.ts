/**
 * Tiny key-value store for short-lived server state (per-call conversation
 * history, dealership registry for pilots).
 *
 * - Upstash Redis over REST when configured (UPSTASH_REDIS_REST_URL/TOKEN, or
 *   the KV_REST_API_URL/TOKEN names injected by the Vercel Marketplace).
 * - Otherwise an in-memory Map: fine locally and for a low-traffic pilot on a
 *   warm instance, but not shared between serverless instances.
 */

interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  readonly kind: "redis" | "memory";
}

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis<T>(command: (string | number)[]): Promise<T> {
  const res = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${command[0]} failed: HTTP ${res.status}`);
  const data = (await res.json()) as { result?: T; error?: string };
  if (data.error) throw new Error(`Redis ${command[0]} failed: ${data.error}`);
  return data.result as T;
}

const redisStore: KV = {
  kind: "redis",
  async get<T>(key: string) {
    const raw = await redis<string | null>(["GET", key]);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set(key, value, ttlSeconds) {
    const cmd: (string | number)[] = ["SET", key, JSON.stringify(value)];
    if (ttlSeconds) cmd.push("EX", ttlSeconds);
    await redis(cmd);
  },
  async del(key) {
    await redis(["DEL", key]);
  },
};

const g = globalThis as unknown as { __ossianMemoryStore?: Map<string, { v: string; exp: number }> };
const mem = (g.__ossianMemoryStore ??= new Map());

const memoryStore: KV = {
  kind: "memory",
  async get<T>(key: string) {
    const e = mem.get(key);
    if (!e) return null;
    if (e.exp && e.exp < Date.now()) {
      mem.delete(key);
      return null;
    }
    return JSON.parse(e.v) as T;
  },
  async set(key, value, ttlSeconds) {
    mem.set(key, { v: JSON.stringify(value), exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
  },
  async del(key) {
    mem.delete(key);
  },
};

export const kv: KV = url && token ? redisStore : memoryStore;
