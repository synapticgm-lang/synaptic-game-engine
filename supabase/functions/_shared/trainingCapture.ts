/**
 * gm-turn training capture (hand-authored edge code).
 *
 * - Who: verified founder / staff / listed test accounts by default; another signed-in player only with
 *   profiles.training_capture_opt_in = true AND PLAYER_CAPTURE_ENABLED=true. Anonymous calls: never.
 * - Switch PLAYER_CAPTURE_ENABLED (edge env):
 *     unset or "founders" → founder / staff / test accounts only (the default)
 *     "true" / "players"  → also players who opted in
 *     "false" / "off"     → no capture at all
 * - What: one row per model call (writer / rewrite / repair / check), exact ordered messages of every attempt,
 *   inference settings, the SERVED host + model from the OpenRouter completion, rights from trainingRights.ts.
 *   No keys, auth headers, emails, or provider reasoning are stored.
 * - How: after the response is built, in the background (EdgeRuntime.waitUntil). A failure is logged with a
 *   status code only and never touches the turn.
 */
import { verifiedAuthUser } from './authUser.ts';
import { privilegeBasis } from './playPrivileges.ts';
import type { CaptureBasis } from './gm/trainingCaptureVocab.ts';

export type { CaptureBasis };

function switchMode(): 'off' | 'founders' | 'players' {
  const v = (Deno.env.get('PLAYER_CAPTURE_ENABLED') ?? '').trim().toLowerCase();
  if (['false', 'off', '0', 'no', 'none'].includes(v)) return 'off';
  if (['true', 'on', '1', 'yes', 'players'].includes(v)) return 'players';
  return 'founders';
}

function testEmails(): string[] {
  return (Deno.env.get('TRAINING_CAPTURE_TEST_EMAILS') ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function serviceKey(): string {
  return (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim();
}

function restUrl(path: string): string {
  return `${(Deno.env.get('SUPABASE_URL') ?? '').trim().replace(/\/$/, '')}/rest/v1/${path}`;
}

async function playerOptedIn(userId: string): Promise<boolean> {
  const key = serviceKey();
  if (!key) return false;
  try {
    const res = await fetch(restUrl(`profiles?id=eq.${encodeURIComponent(userId)}&select=training_capture_opt_in`), {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      await res.body?.cancel();
      return false;
    }
    const rows = (await res.json().catch(() => [])) as Array<{ training_capture_opt_in?: unknown }>;
    return rows[0]?.training_capture_opt_in === true;
  } catch {
    return false;
  }
}

/** Why this call may be captured, or null. Anonymous / unverified callers are never captured. */
export async function captureBasis(req: Request, userId: string | null): Promise<CaptureBasis | null> {
  const mode = switchMode();
  if (mode === 'off' || !userId) return null;
  const privileged = await privilegeBasis(req);
  if (privileged) return privileged;
  const user = await verifiedAuthUser(req);
  if (user?.email && testEmails().includes(user.email)) return 'test';
  if (mode === 'players' && (await playerOptedIn(userId))) return 'opt_in';
  return null;
}

async function insertRow(row: Record<string, unknown>): Promise<void> {
  const key = serviceKey();
  if (!key) {
    console.warn('[gm-turn] capture skipped: no service role key');
    return;
  }
  try {
    const res = await fetch(restUrl('gm_turn_captures'), {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) console.warn(`[gm-turn] capture insert failed: HTTP ${res.status}`);
    await res.body?.cancel();
  } catch {
    console.warn('[gm-turn] capture insert failed: network');
  }
}

/**
 * Decide + build + insert in the background. Never throws, never delays the response.
 * `build` runs only when the call may be captured.
 */
export function scheduleCapture(
  req: Request,
  userId: string | null,
  build: (basis: CaptureBasis, userId: string) => Record<string, unknown> | null
): void {
  const work = (async () => {
    try {
      const basis = await captureBasis(req, userId);
      if (!basis || !userId) return;
      const row = build(basis, userId);
      if (!row) {
        console.warn('[gm-turn] capture skipped: row over size cap');
        return;
      }
      await insertRow(row);
    } catch {
      console.warn('[gm-turn] capture failed');
    }
  })();
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt && typeof rt.waitUntil === 'function') rt.waitUntil(work);
}
