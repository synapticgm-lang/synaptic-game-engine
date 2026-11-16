/**
 * Edge privilege check for tester-window gates.
 * Testers = signed-in Google users who are not staff / verified founder emails.
 * Never trust an unverified JWT payload — gm-turn / generate-image have verify_jwt=false.
 */

import type { CaptureBasis } from './gm/trainingCaptureVocab.ts';
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

/** Subset of the capture vocabulary (trainingCaptureVocab.ts) — one name everywhere. */
export type PrivilegeBasis = Extract<CaptureBasis, 'founder' | 'staff'>;

const basisByRequest = new WeakMap<Request, Promise<PrivilegeBasis | null>>();

async function lookupBasis(req: Request): Promise<PrivilegeBasis | null> {
  if (isKeyBearer(req)) return null;
  // Shared with gm-turn's caller check: one /auth/v1/user lookup per request.
  const user = await verifiedAuthUser(req);
  if (!user) return null;
  if (user.email && founderEmailAllowlist().includes(user.email)) return 'founder';
  return (await isStaffEmail(req)) ? 'staff' : null;
}

/** Why this request is privileged (founder email / staff), or null. One lookup per request. */
export function privilegeBasis(req: Request): Promise<PrivilegeBasis | null> {
  let p = basisByRequest.get(req);
  if (!p) {
    p = lookupBasis(req);
    basisByRequest.set(req, p);
  }
  return p;
}

/** Founder / staff may use Mid/High writers and hosted images. */
export async function isPrivilegedPlayRequest(req: Request): Promise<boolean> {
  return (await privilegeBasis(req)) !== null;
}

export function freeWriterModelId(): string {
  return FREE_WRITER_OPENROUTER_MODEL;
}
