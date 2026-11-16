/**
 * Phase 0 — gm-turn caller checks (hand-authored edge code; not a synced copy of src/game).
 *
 * 1. Origin: a browser call must come from the live game or its Vercel previews.
 * 2. Key: the caller must send this project's Supabase key (the anon / publishable key the web
 *    client already sends as `apikey`). A signed-in user's JWT is verified with the auth server;
 *    a bad or expired JWT is treated as an anonymous player (free tier), never as a user.
 * 3. Rate limit: a small in-memory window per IP and per signed-in user (per edge isolate —
 *    best effort, no new tables). Over the limit → 429 with Retry-After (the client already
 *    turns that into RateLimitError).
 */

const LIVE_ORIGINS = new Set([
  'https://www.synapticgm.com',
  'https://synapticgm.com',
  'https://synaptic-game-engine.vercel.app',
  'https://synaptic-gm.vercel.app',
]);

/** Vercel deployment / preview hosts for this project only (not any *.vercel.app). */
const PREVIEW_HOST = /^(?:synaptic-game-engine|synaptic-gm)-[a-z0-9-]+\.vercel\.app$/;

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
    return u.protocol === 'https:' && PREVIEW_HOST.test(u.hostname);
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

function bearerToken(req: Request): string {
  return (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
}

function supabaseUrl(): string {
  return (Deno.env.get('SUPABASE_URL') ?? '').trim().replace(/\/$/, '');
}

/** Keys already checked in this isolate (true = this project's key). Bounded. */
const keyVerdicts = new Map<string, boolean>();

/** This project's anon / publishable key? Checked against the env, else once against the auth server. */
async function isProjectKey(key: string): Promise<boolean> {
  if (!key || key.length > 4096) return false;
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

/** Auth-server verified user id for a session JWT, else null. */
async function verifiedUserId(token: string, apiKey: string): Promise<string | null> {
  const url = supabaseUrl();
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: apiKey, Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      await res.body?.cancel();
      return null;
    }
    const data = (await res.json().catch(() => null)) as { id?: unknown } | null;
    return typeof data?.id === 'string' ? data.id : null;
  } catch {
    return null;
  }
}

export function clientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf;
  const xff = req.headers.get('x-forwarded-for') ?? '';
  return xff.split(',')[0]?.trim() || 'unknown';
}

export type GmTurnCaller =
  | { ok: true; userId: string | null; ip: string; hasOrigin: boolean }
  | { ok: false; status: number; error: string };

/**
 * Origin + project key + (optional) user. A call with no Origin header is not a browser call from
 * the game; the handler admits it only for a privileged (founder / staff) JWT.
 */
export async function checkGmTurnCaller(req: Request): Promise<GmTurnCaller> {
  const origin = req.headers.get('Origin')?.trim() ?? '';
  if (origin && !isAllowedOrigin(origin)) return { ok: false, status: 403, error: 'Origin not allowed.' };
  const bearer = bearerToken(req);
  const apiKey = (req.headers.get('apikey') ?? '').trim() || bearer;
  if (!(await isProjectKey(apiKey))) return { ok: false, status: 401, error: 'Missing or invalid API key.' };
  const anon = (Deno.env.get('SUPABASE_ANON_KEY') ?? '').trim();
  const anonymousBearer = !bearer || bearer === apiKey || (!!anon && bearer === anon);
  const userId = anonymousBearer ? null : await verifiedUserId(bearer, apiKey);
  return { ok: true, userId, ip: clientIp(req), hasOrigin: !!origin };
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
