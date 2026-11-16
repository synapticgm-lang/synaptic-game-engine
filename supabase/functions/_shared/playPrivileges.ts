/**
 * Edge privilege check for tester-window gates.
 * Testers = signed-in Google users who are not staff / verified founder emails.
 * Never trust an unverified JWT payload — gm-turn / generate-image have verify_jwt=false.
 */

import { FREE_WRITER_OPENROUTER_MODEL } from './gm/openRouterChat.ts';
import { bearerToken, isKeyBearer, verifiedAuthUser } from './authUser.ts';

function founderEmailAllowlist(): string[] {
  const raw = Deno.env.get('FOUNDER_EMAILS') ?? '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function isStaffEmail(req: Request): Promise<boolean> {
  const url = Deno.env.get('SUPABASE_URL')?.trim();
  const anon = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  const token = bearerToken(req);
  if (!url || !anon || isKeyBearer(req, token)) return false;
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
  if (isKeyBearer(req)) return false;
  // Shared with gm-turn's caller check: one /auth/v1/user lookup per request.
  const user = await verifiedAuthUser(req);
  if (!user) return false;
  const email = user.email;
  if (email && founderEmailAllowlist().includes(email)) return true;
  return isStaffEmail(req);
}

export function freeWriterModelId(): string {
  return FREE_WRITER_OPENROUTER_MODEL;
}
