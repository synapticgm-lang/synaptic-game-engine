import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const LAST_BEAT_KEY = 'synaptic-playtime-last-beat-ms';
const PENDING_MS_KEY = 'synaptic-playtime-pending-ms';
/** Idle / background gaps longer than this are not counted as play. */
const MAX_GAP_MS = 15 * 60 * 1000;

function storageGet(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — skip */
  }
}

/** Start or resume the play clock without adding time (hydrate, tab visible). */
export function markPlaytimeBeat(now = Date.now()): void {
  storageSet(LAST_BEAT_KEY, String(now));
}

/**
 * Convert elapsed time since the last beat into whole minutes.
 * Caps a single gap at 15 minutes so an idle tab does not invent hours.
 */
export function takePlaytimeDeltaMinutes(now = Date.now()): number {
  const prev = Number(storageGet(LAST_BEAT_KEY) ?? '');
  storageSet(LAST_BEAT_KEY, String(now));

  let pending = Number(storageGet(PENDING_MS_KEY) ?? '0') || 0;
  if (Number.isFinite(prev) && prev > 0 && now > prev) {
    const gap = now - prev;
    if (gap <= MAX_GAP_MS) pending += gap;
  }

  const minutes = Math.floor(pending / 60000);
  storageSet(PENDING_MS_KEY, String(Math.max(0, pending - minutes * 60000)));
  return minutes;
}

let trackingStarted = false;

/** Mark the clock on first call; ignore hidden-tab time when the player returns. */
export function startPlaytimeTracking(): void {
  if (trackingStarted || typeof document === 'undefined') return;
  trackingStarted = true;
  if (!storageGet(LAST_BEAT_KEY)) markPlaytimeBeat();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') markPlaytimeBeat();
  });
}

/** Increment profiles.total_playtime_minutes from real elapsed session time. */
export async function flushPlaytimeToProfile(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;
  const minutes = takePlaytimeDeltaMinutes();
  startPlaytimeTracking();
  if (minutes <= 0) return;

  const { data, error: readError } = await supabase
    .from('profiles')
    .select('total_playtime_minutes')
    .eq('id', userId)
    .maybeSingle();

  if (readError) {
    console.warn('[playtime] profile read failed', readError.message);
    return;
  }

  const current = Number(data?.total_playtime_minutes ?? 0) || 0;
  const { error } = await supabase
    .from('profiles')
    .update({
      total_playtime_minutes: current + minutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.warn('[playtime] profile update failed', error.message);
  }
}
