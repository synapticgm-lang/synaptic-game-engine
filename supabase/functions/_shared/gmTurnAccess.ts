/**
 * Phase 0 — gm-turn caller checks (hand-authored edge code; not a synced copy of src/game).
 *
 * Order in gm-turn (cheapest first, so junk callers cost no outgoing calls):
 *   1. Origin: a browser call must come from the live game or this project's Vercel previews.
 *   2. Per-IP rate limit (no network).
 *   3. Key: this project's Supabase key (the anon / publishable key the web client sends as `apikey`).
 *   4. User: a signed-in user's JWT, verified once per request (shared with playPrivileges).
 *   5. Per-user rate limit.
 * Rate limits are an in-memory window per edge isolate — best effort, no new tables.
 */
import { isKeyBearer, verifiedAuthUser } from './authUser.ts';

const LIVE_ORIGINS = new Set([
  'https://www.synapticgm.com',
  'https://synapticgm.com',
  'https://synaptic-game-engine.vercel.app',
]);

/**
 * John's Vercel deployments only, from the repo's GitHub deployment records:
 *   synaptic-game-engine-<hash>-synapticgm-6146s-projects.vercel.app      (per-deploy URL)
 *   synaptic-game-engine-git-<branch>-synapticgm-6146s-projects.vercel.app (per-branch URL)
 * Whole-host match (anchored both ends), https only — not a prefix or substring test.
 */
const PREVIEW_HOST = /^synaptic-game-engine-(?:[a-z0-9]{9}|git-[a-z0-9-]{1,40})-synapticgm-6146s-projects\.vercel\.app$/;

function extraOrigins(): Set<string> {
  // Optional, e.g. GM_TURN_EXTRA_ORIGINS=http://localhost:5173 for a dev project. Empty in production.
  return new Set(
    (Deno.env.get('GM_TURN_EXTRA_ORIGINS') ?? '')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean)
  );
}

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (LIVE_ORIGINS.has(origin) || extraOrigins().has(origin)) return true;
  try {
    const u = new URL(origin);
    // An Origin is scheme://host[:port] only; anything else is not a browser Origin.
    if (u.origin !== origin || u.protocol !== 'https:' || u.port) return false;
    return PREVIEW_HOST.test(u.hostname);
  } catch {
    return false;
  }
}

/** CORS echoes only an allowed Origin (never `*`). */
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')?.trim() ?? '';
  return {
    ...(isAllowedOrigin(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function supabaseUrl(): string {
  return (Deno.env.get('SUPABASE_URL') ?? '').trim().replace(/\/$/, '');
}

/** Keys already checked in this isolate (true = this project's key). Bounded. */
const keyVerdicts = new Map<string, boolean>();

/** This project's anon / publishable key? Checked against the env, else once against the auth server. */
async function isProjectKey(key: string): Promise<boolean> {
  if (!key || key.length > 1024) return false;
  const anon = (Deno.env.get('SUPABASE_ANON_KEY') ?? '').trim();
  if (anon && key === anon) return true;
  const known = keyVerdicts.get(key);
  if (known !== undefined) return known;
  const url = supabaseUrl();
  if (!url) return false;
  let ok = false;
  try {
    // /auth/v1/settings answers 200 only for a key of this project.
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    ok = res.ok;
    await res.body?.cancel();
  } catch {
    return false; // network hiccup: not cached
  }
  if (keyVerdicts.size > 64) keyVerdicts.clear();
  keyVerdicts.set(key, ok);
  return ok;
}

/**
 * Client IP for rate limiting, or null.
 * - cf-connecting-ip first: set by Cloudflare at the edge from the TCP peer; a client value is overwritten.
 * - else the LAST x-forwarded-for entry: the one our nearest proxy appended. Earlier entries are whatever
 *   the client sent, so the first entry is never trusted.
 * - else null (the caller is then limited per user / per key+agent, never in one shared bucket).
 */
export function clientIp(req: Request): string | null {
  const cf = req.headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf;
  const parts = (req.headers.get('x-forwarded-for') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1]! : null;
}

/** Rate-limit key before any auth: the IP, else a per-caller fallback (key + user agent, hashed). */
export async function preAuthRateKey(req: Request): Promise<string> {
  const ip = clientIp(req);
  if (ip) return `ip:${ip}`;
  const raw = `${req.headers.get('apikey') ?? ''}|${req.headers.get('Authorization') ?? ''}|${req.headers.get('User-Agent') ?? ''}`;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)));
  return `noip:${Array.from(digest.slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export type GmTurnCaller =
  | { ok: true; userId: string | null; hasOrigin: boolean }
  | { ok: false; status: number; error: string };

/** Origin only (no network) — run before the rate limit and the key / user checks. */
export function checkOrigin(req: Request): { ok: true; hasOrigin: boolean } | { ok: false; status: number; error: string } {
  const origin = req.headers.get('Origin')?.trim() ?? '';
  if (origin && !isAllowedOrigin(origin)) return { ok: false, status: 403, error: 'Origin not allowed.' };
  return { ok: true, hasOrigin: !!origin };
}

/**
 * Project key + (optional) verified user. Call after checkOrigin and the per-IP limit.
 * A bad or expired user JWT is an anonymous Free player, never a user.
 */
export async function checkGmTurnCaller(req: Request, hasOrigin: boolean): Promise<GmTurnCaller> {
  const apiKey = (req.headers.get('apikey') ?? '').trim()
    || (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!(await isProjectKey(apiKey))) return { ok: false, status: 401, error: 'Missing or invalid API key.' };
  const user = isKeyBearer(req) ? null : await verifiedAuthUser(req);
  return { ok: true, userId: user?.id ?? null, hasOrigin };
}

// ── Rate limit (per isolate, sliding minute) ──

const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function perMinuteLimit(): number {
  const n = Number(Deno.env.get('GM_TURN_RATE_PER_MIN') ?? '');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60;
}

/** Seconds to wait when any key is over the limit, else 0 (and the call is counted). */
export function rateLimitRetryAfter(keys: string[], now = Date.now()): number {
  const limit = perMinuteLimit();
  let wait = 0;
  for (const key of keys) {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    hits.set(key, recent);
    if (recent.length >= limit) wait = Math.max(wait, Math.ceil((WINDOW_MS - (now - recent[0]!)) / 1000));
  }
  if (wait > 0) return wait;
  for (const key of keys) hits.get(key)!.push(now);
  if (hits.size > 5_000) {
    for (const [k, list] of hits) if (!list.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return 0;
}

// ── Request body size ──

/** Largest gm-turn body accepted. Real turn bodies carry the whole GameState (~1.2 MB seen at turn 261). */
export const MAX_BODY_BYTES = 4 * 1024 * 1024;

/** The body as text, or null when it is over `max` bytes (checked while streaming, not after). */
export async function readBodyCapped(req: Request, max = MAX_BODY_BYTES): Promise<string | null> {
  const declared = Number(req.headers.get('Content-Length') ?? '');
  if (Number.isFinite(declared) && declared > max) return null;
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}
