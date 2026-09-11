/**
 * 4×T10 Live Drive — human typed questions, local thumbs, review pack.
 *
 *   npm run live-drive-t10
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  criticLiveDriveTurn,
  formatLiveDriveTurnForGemini,
  headlessOpeningContinueTurn,
  liveDriveGeminiBrief,
  pickLiveDriveLine,
  reopenCoversForLiveDrive,
  type LiveDriveTurnRecord,
} from '../../src/game/liveDrive';
import {
  buildNewGameState,
  headlessFateTurn,
  stampOpening,
  type AiAgentMode,
} from '../../src/game/fateAutoplay';
import { isOpeningEstablishmentPending } from '../../src/game/openingEstablishment';
import { createDefaultSettings } from '../../src/game/defaults';
import { mulberry32 } from '../../src/game/fatePick';
import { enableAutoplayTestLab } from '../../src/game/testLab';
import { setActiveSubscriptionTier } from '../../src/game/subscriptionTiers';
import { BUILD_STAMP } from '../../src/game/runManifest';
import { noteThumbsDownFeedback } from '../../src/game/craftBookCompiler';
import { noteThumbsUpKeeper, resetCraftKeepers } from '../../src/game/craftKeepers';
import type { EngineMode, Settings } from '../../src/game/types';

type Cell = {
  mode: EngineMode;
  bibleId: string;
  label: string;
  fileSlug: string;
  persona: AiAgentMode;
  personality: string;
};

const CELLS: Cell[] = [
  {
    mode: 'litrpg',
    bibleId: 'summoned-pact',
    label: 'LitRPG — The Summoned Pact',
    fileSlug: '01-LITRPG-summoned-pact',
    persona: 'storyfollower',
    personality: 'cold-system',
  },
  {
    mode: 'dnd',
    bibleId: 'cursed-keep',
    label: 'Tabletop — Cursed Keep',
    fileSlug: '02-DND-cursed-keep',
    persona: 'storyfollower',
    personality: 'dry-wit',
  },
  {
    mode: 'rpg',
    bibleId: 'salt-road-heist',
    label: 'Story RPG — Salt Road Heist',
    fileSlug: '03-RPG-salt-road',
    persona: 'storyfollower',
    personality: 'fireside',
  },
  {
    mode: 'pyoa',
    bibleId: 'thornferry-road',
    label: 'PYOA — Thornferry Road',
    fileSlug: '04-PYOA-thornferry',
    persona: 'storyfollower',
    personality: 'mission-lead',
  },
];

const TURNS = 10;
const SEED = 42;
const OUT_ROOT = join(process.cwd(), 'scripts/fate-autoplay/runs/gemini-paste-2026-09-11b-livedrive-t10');

function installNodeShims(): void {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  const g = globalThis as typeof globalThis & {
    localStorage?: typeof localStorage;
    window?: { localStorage: typeof localStorage };
  };
  if (!g.localStorage) g.localStorage = localStorage;
  if (!g.window) g.window = { localStorage };
}

function pendingKinds(state: { openingEstablishment?: { pending?: { kind: string }[] } }): string[] {
  return (state.openingEstablishment?.pending ?? []).map((p) => p.kind);
}

function lockedName(state: {
  openingEstablishment?: { answers?: { name?: string } };
  character: { name: string };
}): string | null {
  const a = state.openingEstablishment?.answers?.name?.trim();
  if (a) return a;
  const n = state.character.name?.trim() ?? '';
  if (!n || n === 'Unknown Survivor') return null;
  return n;
}

function applyThumbs(cell: Cell, rec: LiveDriveTurnRecord): void {
  if (rec.thumbsDown) {
    noteThumbsDownFeedback(rec.turn);
    return;
  }
  noteThumbsUpKeeper({
    mode: cell.mode,
    story: rec.gmText,
    playerAction: rec.playerInput,
    turn: rec.turn,
  });
}

async function runCell(cell: Cell, settings: Settings): Promise<{
  page1: string;
  records: LiveDriveTurnRecord[];
  thumbs: LiveDriveTurnRecord[];
}> {
  resetCraftKeepers();
  const { state: raw, bible, personalityId } = buildNewGameState({
    bibleId: cell.bibleId,
    characterName: 'Jax',
    seed: SEED,
    personality: cell.personality,
    engineMode: cell.mode,
  });
  let state = stampOpening(reopenCoversForLiveDrive(raw, bible));
  const page1 = [...state.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
  const rng = mulberry32(SEED);
  const records: LiveDriveTurnRecord[] = [];
  const prevStories: string[] = page1 ? [page1] : [];
  let scriptedIndex = 0;

  for (let i = 0; i < TURNS; i++) {
    const started = Date.now();
    const scripted = pickLiveDriveLine(cell.persona, cell.mode, scriptedIndex);
    const coverPending = isOpeningEstablishmentPending(state);
    if (coverPending) {
      const playerInput = scripted ?? 'Look around';
      if (scripted) scriptedIndex += 1;
      const next = await headlessOpeningContinueTurn(state, playerInput);
      state = next.state;
      const flags = criticLiveDriveTurn({
        story: next.gmText,
        pads: next.offeredChoices,
        player: playerInput,
        prevStories,
        coversPending: isOpeningEstablishmentPending(state),
        nameLocked: lockedName(state),
        state,
        openingContinue: true,
      });
      const rec: LiveDriveTurnRecord = {
        turn: i + 1,
        phase: 'cover',
        persona: cell.persona,
        playerInput,
        gmText: next.gmText,
        offeredChoices: next.offeredChoices,
        coversPending: pendingKinds(state),
        nameLocked: lockedName(state),
        location: state.currentLocation ?? '',
        flags,
        thumbsDown: flags.some((f) => f.severity === 'hard'),
        durationMs: Date.now() - started,
      };
      applyThumbs(cell, rec);
      records.push(rec);
      prevStories.push(next.gmText);
      continue;
    }

    const override = scripted;
    if (scripted) scriptedIndex += 1;
    const result = await headlessFateTurn(state, settings, rng, {
      bibleId: bible.id,
      personalityId,
      seed: SEED,
      mode: 'fate',
      aiAgentMode: cell.persona,
      dryRun: false,
      playerInputOverride: override,
    });
    state = result.state;
    const gmText = result.telemetry.gmText ?? '';
    const pads = result.telemetry.offeredChoices ?? [];
    const playerInput = result.telemetry.playerInput ?? override ?? '';
    const flags = criticLiveDriveTurn({
      story: gmText,
      pads,
      player: playerInput,
      prevStories,
      coversPending: false,
      nameLocked: lockedName(state),
      state,
    });
    const rec: LiveDriveTurnRecord = {
      turn: i + 1,
      phase: 'play',
      persona: cell.persona,
      playerInput,
      gmText,
      offeredChoices: pads,
      coversPending: [],
      nameLocked: lockedName(state),
      location: state.currentLocation ?? '',
      flags,
      thumbsDown: flags.some((f) => f.severity === 'hard'),
      durationMs: Date.now() - started,
    };
    applyThumbs(cell, rec);
    records.push(rec);
    prevStories.push(gmText);
  }

  return { page1, records, thumbs: records.filter((r) => r.thumbsDown) };
}

function cellPaste(cell: Cell, page1: string, records: LiveDriveTurnRecord[]): string {
  const hard = records.filter((r) => r.flags.some((f) => f.severity === 'hard')).length;
  const soft = records.filter((r) => r.flags.some((f) => f.severity === 'soft') && !r.thumbsDown).length;
  return [
    `# ${cell.label} — Live Drive T${TURNS} seed ${SEED}`,
    '',
    `Persona: **${cell.persona}**. Stamp \`${BUILD_STAMP}\`.`,
    `Harness hard flags: ${hard} · soft-only: ${soft}.`,
    '',
    '## T0 — page 1 (context, do not score as a player turn)',
    '',
    page1.trim() || '_(empty)_',
    '',
    ...records.map((r) => formatLiveDriveTurnForGemini(cell.label, r)),
  ].join('\n');
}

async function main(): Promise<void> {
  installNodeShims();
  enableAutoplayTestLab('free');
  setActiveSubscriptionTier('free');
  const settings: Settings = {
    ...createDefaultSettings(),
    subscriptionTier: 'free',
    classicMemorableImages: false,
    visualMode: 'classic',
    fastSetupChips: false,
  };
  mkdirSync(OUT_ROOT, { recursive: true });

  const parts: string[] = [
    liveDriveGeminiBrief().replace('4×T20', '4×T10').replace('2026-09-09c', BUILD_STAMP),
  ];
  const index: Array<{ cell: string; hard: number; thumbs: number }> = [];

  for (const cell of CELLS) {
    console.log(`[live-drive-t10] ${cell.label} × T${TURNS}…`);
    const { page1, records, thumbs } = await runCell(cell, settings);
    const hard = records.filter((r) => r.thumbsDown).length;
    index.push({ cell: cell.label, hard, thumbs: thumbs.length });
    const md = cellPaste(cell, page1, records);
    writeFileSync(join(OUT_ROOT, `${cell.fileSlug}__gemini-pro-PASTE.md`), md);
    writeFileSync(join(OUT_ROOT, `${cell.fileSlug}__turns.json`), JSON.stringify(records, null, 2) + '\n');
    writeFileSync(
      join(OUT_ROOT, `${cell.fileSlug}__thumbs.jsonl`),
      thumbs
        .map((t) =>
          JSON.stringify({
            rating: -1,
            turn: t.turn,
            action: t.playerInput,
            story: t.gmText,
            options: t.offeredChoices,
            comment: t.flags.map((f) => `${f.code}: ${f.note}`).join(' | '),
          })
        )
        .join('\n') + (thumbs.length ? '\n' : '')
    );
    writeFileSync(
      join(OUT_ROOT, `${cell.fileSlug}__thumbs-feed.jsonl`),
      records
        .map((t) =>
          JSON.stringify({
            feedback_type: t.thumbsDown ? 'negative' : 'positive',
            turn_number: t.turn,
            game_mode: cell.mode,
            bible_id: cell.bibleId,
            player_action: t.playerInput,
            gm_story: t.gmText,
            comment: t.flags.map((f) => `${f.code}: ${f.note}`).join(' | ') || null,
            source: 'live-drive-t10-harness',
          })
        )
        .join('\n') + '\n'
    );
    parts.push('', '---', '', md);
    console.log(`[live-drive-t10] ${cell.label} done — hard thumbs ${hard}/${TURNS}`);
  }

  writeFileSync(join(OUT_ROOT, 'ALL-MODES__gemini-pro-PASTE.md'), parts.join('\n'));
  writeFileSync(
    join(OUT_ROOT, 'INDEX.json'),
    JSON.stringify({ stamp: BUILD_STAMP, seed: SEED, turns: TURNS, cells: index, outDir: OUT_ROOT }, null, 2) + '\n'
  );
  console.log(`[live-drive-t10] paste → ${OUT_ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
