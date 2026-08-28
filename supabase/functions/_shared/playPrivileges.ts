/**
 * Edge privilege check for tester-window gates.
 * Testers = signed-in Google users who are not staff / verified founder emails.
 * Never trust an unverified JWT payload — gm-turn / generate-image have verify_jwt=false.
 */

const FREE_WRITER_OPENROUTER = 'google/gemini-2.5-flash-lite';

function founderEmailAllowlist(): string[] {
  const raw = Deno.env.get('FOUNDER_EMAILS') ?? '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function bearerToken(req: Request): string | null {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return token || null;
}

function isAnonJwt(token: string): boolean {
  const anon = (Deno.env.get('SUPABASE_ANON_KEY') ?? '').trim();
  return !!anon && token === anon;
}

/** Auth-server verified user (rejects forged payloads). */
async function verifiedUserEmail(token: string): Promise<string | null> {
  const url = Deno.env.get('SUPABASE_URL')?.trim();
  const anon = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  if (!url || !anon || !token || isAnonJwt(token)) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null) as { email?: unknown } | null;
    return typeof data?.email === 'string' ? data.email.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

async function isStaffEmail(req: Request): Promise<boolean> {
  const url = Deno.env.get('SUPABASE_URL')?.trim();
  const anon = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  const token = bearerToken(req);
  if (!url || !anon || !token || isAnonJwt(token)) return false;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/is_staff_email`, {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => false);
    return data === true;
  } catch {
    return false;
  }
}

/** Founder / staff may use Mid/High writers and hosted images. */
export async function isPrivilegedPlayRequest(req: Request): Promise<boolean> {
  const token = bearerToken(req);
  if (!token || isAnonJwt(token)) return false;
  const email = await verifiedUserEmail(token);
  if (email && founderEmailAllowlist().includes(email)) return true;
  return isStaffEmail(req);
}

export function freeWriterModelId(): string {
  return FREE_WRITER_OPENROUTER;
}
