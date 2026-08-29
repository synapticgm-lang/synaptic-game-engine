import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';

const { mockSupabase } = vi.hoisted(() => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })),
    })),
  };
  return { mockSupabase };
});

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: mockSupabase,
}));

import {
  submitGmFeedback,
  getGmFeedback,
  deleteGmFeedback,
  exportGmFeedbackToCsv,
  type GmFeedbackRecord,
} from '@/services/gmFeedbackService';

describe('playtest30h — GM response feedback system', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stamp is 2026-08-30h', () => {
    expect(BUILD_STAMP >= '2026-08-30h').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-30h').toBe(true);
  });

  it('migration creates gm_response_feedback table with comment field', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const migrationPath = path.resolve(__dirname, '../../supabase/migrations/020_gm_response_feedback.sql');
    const migration = await fs.readFile(migrationPath, 'utf-8');
    
    expect(migration).toContain('create table public.gm_response_feedback');
    expect(migration).toContain('comment text');
    expect(migration).toContain('feedback_type text not null');
    expect(migration).toContain("check (feedback_type in ('positive', 'negative'))");
    expect(migration).toContain('unique(user_id, save_id, turn_number)');
  });

  it('021 keys feedback per log entry so opening / turn 0 can rate separately', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const migrationPath = path.resolve(__dirname, '../../supabase/migrations/021_gm_feedback_log_entry.sql');
    const migration = await fs.readFile(migrationPath, 'utf-8');
    expect(migration).toContain('log_entry_id');
    expect(migration).toContain('unique (user_id, save_id, log_entry_id)');
    expect(migration).toContain('Testers cannot read other people');
  });

  it('submitGmFeedback validates comment length', async () => {
    const longComment = 'a'.repeat(501);
    const result = await submitGmFeedback({
      saveId: 'test-save',
      turnNumber: 1,
      feedbackType: 'positive',
      comment: longComment,
      gmStory: 'GM story',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('500 characters');
  });

  it('submitGmFeedback trims and nullifies empty comments', async () => {
    mockSupabase.from.mockReturnValue({
      upsert: vi.fn((payload) => {
        expect(payload.comment).toBe(null);
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { ...payload, id: 'test-id', created_at: new Date().toISOString() },
              error: null,
            })),
          })),
        };
      }),
    });

    const result = await submitGmFeedback({
      saveId: 'test-save',
      turnNumber: 1,
      feedbackType: 'positive',
      comment: '   ',
      gmStory: 'GM story',
    });

    expect(result.ok).toBe(true);
  });

  it('submitGmFeedback preserves non-empty trimmed comments', async () => {
    mockSupabase.from.mockReturnValue({
      upsert: vi.fn((payload) => {
        expect(payload.comment).toBe('This was good');
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { ...payload, id: 'test-id', created_at: new Date().toISOString() },
              error: null,
            })),
          })),
        };
      }),
    });

    const result = await submitGmFeedback({
      saveId: 'test-save',
      turnNumber: 1,
      feedbackType: 'negative',
      comment: '  This was good  ',
      gmStory: 'GM story',
    });

    expect(result.ok).toBe(true);
  });

  it('exportGmFeedbackToCsv includes comment column', () => {
    const records: GmFeedbackRecord[] = [
      {
        id: 'test-id-1',
        user_id: 'user-1',
        save_id: 'save-1',
        turn_number: 5,
        feedback_type: 'positive',
        comment: 'Great turn!',
        created_at: '2026-08-30T12:00:00Z',
        updated_at: '2026-08-30T12:00:00Z',
        gm_story: 'The dragon roars',
        player_action: 'I attack',
        game_mode: 'litrpg',
        bible_id: 'summoned-pact',
      },
      {
        id: 'test-id-2',
        user_id: 'user-2',
        save_id: 'save-2',
        turn_number: 10,
        feedback_type: 'negative',
        comment: null,
        created_at: '2026-08-30T13:00:00Z',
        updated_at: '2026-08-30T13:00:00Z',
        gm_story: 'You see a door',
        player_action: 'I open it',
        game_mode: 'dnd',
        bible_id: 'cursed-keep',
      },
    ];

    const csv = exportGmFeedbackToCsv(records);
    const lines = csv.split('\n');
    
    expect(lines[0]).toContain('Comment');
    expect(lines[1]).toContain('"Great turn!"');
    expect(lines[2]).toContain('""'); // Empty comment
  });

  it('GmResponseFeedback component exists', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const componentPath = path.resolve(__dirname, '../components/GmResponseFeedback.tsx');
    const component = await fs.readFile(componentPath, 'utf-8');
    
    expect(component).toContain('export function GmResponseFeedback');
    expect(component).toContain('ThumbsUp');
    expect(component).toContain('ThumbsDown');
    expect(component).toContain('comment');
    expect(component).toContain('MAX_COMMENT_LENGTH');
    expect(component).toContain('500');
    expect(component).toContain('min-h-11');
    expect(component).not.toMatch(/isTestLabEnabled|isFounderPlayAccount|isStaffEmail|isTesterCohort/);
    expect(component).not.toMatch(/from ['"]@\/game\/testLab['"]/);
    expect(component).toContain('logEntryId');
  });

  it('NarrativeView passes saveId and bibleId to GmResponseFeedback', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const narrativePath = path.resolve(__dirname, '../components/NarrativeView.tsx');
    const narrative = await fs.readFile(narrativePath, 'utf-8');
    
    expect(narrative).toContain('import { GmResponseFeedback }');
    expect(narrative).toContain('<GmResponseFeedback');
    expect(narrative).toContain('saveId={saveId}');
    expect(narrative).toContain('bibleId={bibleId}');
    expect(narrative).toContain('logEntryId={entry.id}');
    expect(narrative).not.toMatch(/isTestLabEnabled|play_access|isStaff/);
  });

  it('CenterPanel classic LogRow also mounts thumbs and uses campaignBibleId', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const centerPath = path.resolve(__dirname, '../components/CenterPanel.tsx');
    const center = await fs.readFile(centerPath, 'utf-8');
    
    expect(center).toContain('saveId={state.saveId}');
    expect(center).toContain('bibleId={state.campaignBibleId}');
    expect(center).toContain('import { GmResponseFeedback }');
    expect(center).toContain('<GmResponseFeedback');
    expect(center).toContain('logEntryId={entry.id}');
    expect(center).not.toMatch(/isTestLabEnabled|play_access|isStaff/);
  });

  it('CenterPanel passes saveId and bibleId to NarrativeView', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const centerPath = path.resolve(__dirname, '../components/CenterPanel.tsx');
    const center = await fs.readFile(centerPath, 'utf-8');
    
    expect(center).toContain('saveId={state.saveId}');
    expect(center).toContain('bibleId={state.campaignBibleId}');
  });

  it('admin review component exists', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const adminPath = path.resolve(__dirname, '../components/admin/GmFeedbackReview.tsx');
    const admin = await fs.readFile(adminPath, 'utf-8');
    
    expect(admin).toContain('export function GmFeedbackReview');
    expect(admin).toContain('listAllGmFeedback');
    expect(admin).toContain('exportGmFeedbackToCsv');
    expect(admin).toContain('ThumbsUp');
    expect(admin).toContain('ThumbsDown');
    expect(admin).toContain('Comment');
  });

  it('RLS policies allow users to manage their own feedback', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const migrationPath = path.resolve(__dirname, '../../supabase/migrations/020_gm_response_feedback.sql');
    const migration = await fs.readFile(migrationPath, 'utf-8');
    
    expect(migration).toContain('Users can insert their own feedback');
    expect(migration).toContain('Users can update their own feedback');
    expect(migration).toContain('Users can view their own feedback');
    expect(migration).toContain('auth.uid() = user_id');
  });

  it('RLS policies allow admin to view all feedback', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const migrationPath = path.resolve(__dirname, '../../supabase/migrations/020_gm_response_feedback.sql');
    const migration = await fs.readFile(migrationPath, 'utf-8');
    
    expect(migration).toContain('Admins can view all feedback');
    expect(migration).toContain('public.is_staff_email()');
  });
});
