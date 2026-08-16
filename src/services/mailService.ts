/**
 * In-game mail from Admin Ops → player (player_mail table).
 * Support ID for email tickets = auth user UUID (profiles.id).
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type PlayerMailStatus = 'unread' | 'read' | 'archived';

export interface PlayerMailMessage {
  id: string;
  createdAt: string;
  subject: string;
  body: string;
  fromStaffEmail: string | null;
  status: PlayerMailStatus;
}

export async function resolveSupportUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function listMyMail(): Promise<{
  messages: PlayerMailMessage[];
  error: string | null;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { messages: [], error: 'Cloud is not configured' };
  }
  const userId = await resolveSupportUserId();
  if (!userId) return { messages: [], error: null };

  const { data, error } = await supabase
    .from('player_mail')
    .select('id, created_at, subject, body, from_staff_email, status')
    .eq('user_id', userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) return { messages: [], error: error.message };

  return {
    messages: (data ?? []).map((row) => ({
      id: String(row.id),
      createdAt: String(row.created_at ?? ''),
      subject: String(row.subject ?? ''),
      body: String(row.body ?? ''),
      fromStaffEmail: row.from_staff_email ? String(row.from_staff_email) : null,
      status: (row.status as PlayerMailStatus) || 'unread',
    })),
    error: null,
  };
}

export async function markMailRead(mailId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Cloud is not configured' };
  const { error } = await supabase
    .from('player_mail')
    .update({ status: 'read', updated_at: new Date().toISOString() })
    .eq('id', mailId);
  return { error: error?.message ?? null };
}

export function unreadMailCount(messages: PlayerMailMessage[]): number {
  return messages.filter((m) => m.status === 'unread').length;
}
