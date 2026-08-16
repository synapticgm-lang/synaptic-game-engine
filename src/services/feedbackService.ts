/**
 * Player feedback → Admin Inbox (player_feedback table).
 * Fire-and-forget insert; client rate-limit 5 / UTC day.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getDistributionChannel } from '@/game/distributionChannel';

export type FeedbackType = 'bug' | 'request' | 'message' | 'praise';

export interface SubmitFeedbackInput {
  type: FeedbackType;
  subject: string;
  body: string;
  playerId?: string | null;
  campaign?: string | null;
  engineMode?: string | null;
  turn?: number | null;
  aiTrafficId?: string | null;
  payload?: Record<string, unknown> | null;
}

const RATE_KEY = 'synapticgm-feedback-rate';
const MAX_PER_DAY = 5;

function dayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function feedbackRemainingToday(): number {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (!raw) return MAX_PER_DAY;
    const parsed = JSON.parse(raw) as { day?: string; count?: number };
    if (parsed.day !== dayUtc()) return MAX_PER_DAY;
    return Math.max(0, MAX_PER_DAY - (parsed.count ?? 0));
  } catch {
    return MAX_PER_DAY;
  }
}

function bumpFeedbackRate(): void {
  const day = dayUtc();
  try {
    const raw = localStorage.getItem(RATE_KEY);
    let count = 1;
    if (raw) {
      const parsed = JSON.parse(raw) as { day?: string; count?: number };
      count = parsed.day === day ? (parsed.count ?? 0) + 1 : 1;
    }
    localStorage.setItem(RATE_KEY, JSON.stringify({ day, count }));
  } catch {
    /* ignore */
  }
}

export async function submitPlayerFeedback(
  input: SubmitFeedbackInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Cloud is not configured — feedback needs Supabase.' };
  }

  const body = input.body.trim();
  if (body.length < 8) {
    return { ok: false, error: 'Please write a bit more (at least a short sentence).' };
  }
  if (body.length > 8000) {
    return { ok: false, error: 'Message is too long (max 8000 characters).' };
  }

  if (feedbackRemainingToday() <= 0) {
    return { ok: false, error: 'Daily feedback limit reached (5). Try again tomorrow.' };
  }

  const subject = input.subject.trim().slice(0, 120);
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  const row = {
    feedback_type: input.type,
    status: 'Open',
    subject: subject || defaultSubject(input.type),
    body,
    player_id: input.playerId?.trim() || userId || 'guest',
    user_id: userId,
    campaign: input.campaign?.trim() || null,
    engine_mode: input.engineMode?.trim() || null,
    turn: typeof input.turn === 'number' ? input.turn : null,
    distribution_channel: getDistributionChannel(),
    ai_traffic_id: input.aiTrafficId?.trim() || null,
    payload: {
      ...(input.payload ?? {}),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 240) : null,
      href: typeof location !== 'undefined' ? location.href.slice(0, 240) : null,
    },
  };

  const { error } = await supabase.from('player_feedback').insert(row);
  if (error) {
    console.warn('[feedback] insert failed', error.message);
    return { ok: false, error: error.message };
  }

  bumpFeedbackRate();
  return { ok: true };
}

function defaultSubject(type: FeedbackType): string {
  switch (type) {
    case 'bug':
      return 'Bug report';
    case 'request':
      return 'Feature request';
    case 'praise':
      return 'Praise';
    default:
      return 'Message';
  }
}
