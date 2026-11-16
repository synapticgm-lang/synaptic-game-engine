/**
 * One auth-server user lookup per request, shared by gm-turn's caller check and playPrivileges.
 * Never trusts an unverified JWT payload: the token is checked with GET /auth/v1/user.
 */

type AuthUser = { id: string; email: string | null };

const lookups = new WeakMap<Request, Promise<AuthUser | null>>();

export function bearerToken(req: Request): string {
  return (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
}

/** True when the bearer is a project key (anon / publishable), i.e. no signed-in user. */
export function isKeyBearer(req: Request, token = bearerToken(req)): boolean {
  if (!token) return true;
  const anon = (Deno.env.get('SUPABASE_ANON_KEY') ?? '').trim();
  const apiKey = (req.headers.get('apikey') ?? '').trim();
  return (!!anon && token === anon) || (!!apiKey && token === apiKey);
}

async function lookup(req: Request): Promise<AuthUser | null> {
  const url = (Deno.env.get('SUPABASE_URL') ?? '').trim().replace(/\/$/, '');
  const anon = (Deno.env.get('SUPABASE_ANON_KEY') ?? '').trim();
  const token = bearerToken(req);
  if (!url || !anon || isKeyBearer(req, token)) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      await res.body?.cancel();
      return null;
    }
    const data = (await res.json().catch(() => null)) as { id?: unknown; email?: unknown } | null;
    if (typeof data?.id !== 'string') return null;
    return { id: data.id, email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : null };
  } catch {
    return null;
  }
}

/** The verified user behind this request's bearer JWT, or null. At most one fetch per request. */
export function verifiedAuthUser(req: Request): Promise<AuthUser | null> {
  let p = lookups.get(req);
  if (!p) {
    p = lookup(req);
    lookups.set(req, p);
  }
  return p;
}
