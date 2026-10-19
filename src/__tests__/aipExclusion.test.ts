/**
 * q51b-AIP2 acceptance: tester exclusion + dataset source filter.
 * No network.
 */
import { describe, expect, it } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

async function load(rel: string) {
  return import(/* @vite-ignore */ pathToFileURL(resolve(rel)).href);
}

describe('q51b-AIP2 aipExclusion', () => {
  it('tester filter drops tester rows from a stats sample', async () => {
    const { filterStatsSample, TESTER_ACCOUNTS } = await load(
      'scripts/ai-player-browser/testerAccounts.mjs',
    ) as {
      filterStatsSample: (rows: Record<string, unknown>[]) => Record<string, unknown>[];
      TESTER_ACCOUNTS: ReadonlyArray<{ email: string; user_id: string | null }>;
    };
    const founderId = TESTER_ACCOUNTS.find((a) => a.email === 'synapticgm@gmail.com')?.user_id;
    const sample = [
      { user_id: 'player-uuid-1', email: 'alice@example.com', game_mode: 'dnd', turns: 10 },
      { user_id: founderId, email: 'synapticgm@gmail.com', game_mode: 'dnd', turns: 3 },
      { user_id: 'player-uuid-2', email: 'bob@example.com', game_mode: 'litrpg', turns: 5 },
      { user_id: 'x', email: 'ai-player@synapticgm.com', game_mode: 'dnd', turns: 99 },
      { user_id: 'y', save_id: 'aitest-run-1', game_mode: 'rpg', turns: 7 },
    ];
    const kept = filterStatsSample(sample);
    expect(kept.map((r) => r.email ?? r.save_id)).toEqual([
      'alice@example.com',
      'bob@example.com',
    ]);
  });

  it('tester filter drops tester rows from a training-export sample', async () => {
    const { filterTrainingExportSample } = await load(
      'scripts/ai-player-browser/testerAccounts.mjs',
    ) as {
      filterTrainingExportSample: (rows: Record<string, unknown>[]) => Record<string, unknown>[];
    };
    const sample = [
      {
        user_id: 'player-uuid-1',
        save_id: 'save-real',
        feedback_type: 'positive',
        source: 'player',
      },
      {
        user_id: 'a0e79445-461a-4e52-9d5d-fbc03db3214a',
        save_id: 'save-founder',
        feedback_type: 'negative',
      },
      {
        user_id: 'ai-unknown',
        save_id: 'aitest-abc',
        feedback_type: 'positive',
        meta: { source: 'ai-tester:deepseek/deepseek-v4-pro', player_licence: 'open' },
      },
      {
        user_id: 'player-uuid-2',
        save_id: 'save-real-2',
        feedback_type: 'positive',
        source: 'ai-tester:google/gemini-2.5-pro',
      },
    ];
    const kept = filterTrainingExportSample(sample);
    expect(kept).toHaveLength(1);
    expect(kept[0]?.save_id).toBe('save-real');
  });

  it('admitTesterRun admits open, rejects restricted and non-tester rows', async () => {
    const { admitTesterRun } = await load(
      'scripts/ai-player-browser/testerSourceFilter.mjs',
    ) as {
      admitTesterRun: (meta: { source?: string; player_licence?: string } | null) => boolean;
    };

    expect(
      admitTesterRun({
        source: 'ai-tester:deepseek/deepseek-v4-pro',
        player_licence: 'open',
      }),
    ).toBe(true);

    expect(
      admitTesterRun({
        source: 'ai-tester:google/gemini-2.5-pro',
        player_licence: 'restricted',
      }),
    ).toBe(false);

    expect(
      admitTesterRun({
        source: 'ai-tester:anthropic/claude-sonnet-4.6',
        player_licence: 'restricted',
      }),
    ).toBe(false);

    expect(
      admitTesterRun({
        source: 'player',
        player_licence: 'open',
      }),
    ).toBe(false);

    expect(admitTesterRun({ source: 'fate-autoplay', player_licence: 'open' })).toBe(false);
    expect(admitTesterRun(null)).toBe(false);
    expect(admitTesterRun({ source: 'ai-tester:deepseek/deepseek-v4-pro' })).toBe(false);
  });

  it('gmFeedbackService excludeTesterRows matches testerAccounts.mjs on the same sample', async () => {
    const { excludeTesterRows: fromMjs } = await load(
      'scripts/ai-player-browser/testerAccounts.mjs',
    ) as {
      excludeTesterRows: (rows: Record<string, unknown>[]) => Record<string, unknown>[];
    };
    const { excludeTesterRows: fromService, exportGmFeedbackToCsv } = await import(
      '@/services/gmFeedbackService'
    );
    const sample: Record<string, unknown>[] = [
      { user_id: 'player-1', save_id: 'save-a', feedback_type: 'positive' },
      { user_id: 'a0e79445-461a-4e52-9d5d-fbc03db3214a', save_id: 'save-b', feedback_type: 'negative' },
      { user_id: 'x', save_id: 'aitest-1', feedback_type: 'positive' },
      { user_id: 'y', email: 'ai-player@synapticgm.com', save_id: 'save-c', feedback_type: 'positive' },
    ];
    expect(fromService(sample).map((r) => r.save_id)).toEqual(
      fromMjs(sample).map((r) => r.save_id),
    );
    const csv = exportGmFeedbackToCsv(
      sample.map((r, i) => ({
        id: `id-${i}`,
        user_id: String(r.user_id),
        save_id: String(r.save_id),
        turn_number: 1,
        feedback_type: (r.feedback_type as 'positive' | 'negative') || 'positive',
        comment: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        gm_story: null,
        player_action: null,
        game_mode: 'dnd',
        bible_id: null,
        email: r.email,
      })) as Parameters<typeof exportGmFeedbackToCsv>[0],
    );
    expect(csv).toContain('save-a');
    expect(csv).not.toContain('aitest-1');
    expect(csv).not.toContain('a0e79445-461a-4e52-9d5d-fbc03db3214a');
  });
});
