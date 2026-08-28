/**
 * GM Response Feedback Service
 * Allows all users to rate each GM response with thumbs up/down and optional comments.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type GmFeedbackType = 'positive' | 'negative';

export interface GmFeedbackRecord {
  id: string;
  user_id: string;
  save_id: string;
  turn_number: number;
  feedback_type: GmFeedbackType;
  comment: string | null;
  created_at: string;
  updated_at: string;
  gm_story: string | null;
  player_action: string | null;
  game_mode: string | null;
  bible_id: string | null;
}

export interface SubmitGmFeedbackInput {
  saveId: string;
  turnNumber: number;
  feedbackType: GmFeedbackType;
  comment?: string | null;
  gmStory?: string | null;
  playerAction?: string | null;
  gameMode?: string | null;
  bibleId?: string | null;
}

export interface GmFeedbackResult {
  ok: boolean;
  error?: string;
  record?: GmFeedbackRecord;
}

/**
 * Submit or update GM response feedback (upsert based on user + save + turn).
 */
export async function submitGmFeedback(
  input: SubmitGmFeedbackInput
): Promise<GmFeedbackResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Feedback is not available (Supabase not configured).' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'You must be signed in to submit feedback.' };
  }

  // Validate comment length client-side
  const trimmedComment = input.comment?.trim() || null;
  if (trimmedComment && trimmedComment.length > 500) {
    return { ok: false, error: 'Comment must be 500 characters or less.' };
  }

  const payload: Partial<GmFeedbackRecord> = {
    user_id: user.id,
    save_id: input.saveId,
    turn_number: input.turnNumber,
    feedback_type: input.feedbackType,
    comment: trimmedComment,
    gm_story: input.gmStory || null,
    player_action: input.playerAction || null,
    game_mode: input.gameMode || null,
    bible_id: input.bibleId || null,
  };

  const { data, error } = await supabase
    .from('gm_response_feedback')
    .upsert(payload, {
      onConflict: 'user_id,save_id,turn_number',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to submit GM feedback:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, record: data as GmFeedbackRecord };
}

/**
 * Get user's feedback for a specific turn.
 */
export async function getGmFeedback(
  saveId: string,
  turnNumber: number
): Promise<GmFeedbackRecord | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('gm_response_feedback')
    .select('*')
    .eq('user_id', user.id)
    .eq('save_id', saveId)
    .eq('turn_number', turnNumber)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch GM feedback:', error);
    return null;
  }

  return data as GmFeedbackRecord | null;
}

/**
 * Delete user's feedback for a specific turn.
 */
export async function deleteGmFeedback(
  saveId: string,
  turnNumber: number
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Feedback is not available (Supabase not configured).' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'You must be signed in to delete feedback.' };
  }

  const { error } = await supabase
    .from('gm_response_feedback')
    .delete()
    .eq('user_id', user.id)
    .eq('save_id', saveId)
    .eq('turn_number', turnNumber);

  if (error) {
    console.error('Failed to delete GM feedback:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Admin: List all GM feedback with filters.
 */
export interface ListGmFeedbackOptions {
  feedbackType?: GmFeedbackType;
  gameMode?: string;
  limit?: number;
  offset?: number;
}

export interface ListGmFeedbackResult {
  ok: boolean;
  error?: string;
  records: GmFeedbackRecord[];
  count?: number;
}

export async function listAllGmFeedback(
  options: ListGmFeedbackOptions = {}
): Promise<ListGmFeedbackResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Feedback is not available (Supabase not configured).',
      records: [],
    };
  }

  let query = supabase
    .from('gm_response_feedback')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options.feedbackType) {
    query = query.eq('feedback_type', options.feedbackType);
  }

  if (options.gameMode) {
    query = query.eq('game_mode', options.gameMode);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to list GM feedback:', error);
    return { ok: false, error: error.message, records: [] };
  }

  return {
    ok: true,
    records: (data as GmFeedbackRecord[]) || [],
    count: count || 0,
  };
}

/**
 * Admin: Export all feedback to CSV format.
 */
export function exportGmFeedbackToCsv(records: GmFeedbackRecord[]): string {
  const headers = [
    'ID',
    'User ID',
    'Save ID',
    'Turn',
    'Feedback',
    'Comment',
    'Game Mode',
    'Bible ID',
    'Created At',
    'GM Story (truncated)',
    'Player Action (truncated)',
  ];

  const rows = records.map((r) => [
    r.id,
    r.user_id,
    r.save_id,
    r.turn_number.toString(),
    r.feedback_type,
    r.comment || '',
    r.game_mode || '',
    r.bible_id || '',
    r.created_at,
    (r.gm_story || '').slice(0, 200).replace(/"/g, '""'),
    (r.player_action || '').slice(0, 100).replace(/"/g, '""'),
  ]);

  const csvRows = [headers, ...rows].map((row) =>
    row.map((cell) => `"${cell}"`).join(',')
  );

  return csvRows.join('\n');
}
