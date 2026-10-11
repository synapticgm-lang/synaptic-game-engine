/**
 * Replay bank harness. Rebuilds the GameState of a saved fate-autoplay run turn by turn from the
 * run's own files: new game from the run's seed/bible/personality, then each recorded player line
 * through `headlessFateTurn`, with the writer answering with that turn's recorded raw text.
 * No field is ever set by hand. Callers must mock `callGm` with `mockAiService` (see writerQueue.ts).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  buildNewGameState,
  headlessFateTurn,
  stampOpening,
  type TurnTelemetry,
} from '../../game/fateAutoplay';
import { createDefaultSettings } from '../../game/defaults';
import { mulberry32 } from '../../game/fatePick';
import { isGmVoiceProfileId } from '../../game/gmVoiceProfile';
import { enableAutoplayTestLab } from '../../game/testLab';
import { setActiveSubscriptionTier } from '../../game/subscriptionTiers';
import type { GameState, Settings } from '../../game/types';
import { checkPlayerTurn, type TurnCheck } from '../../game/turnCheck';
import { turnProgress } from '../../game/choiceRanking';

export const RUNS_ROOT = resolve(__dirname, '../../../scripts/fate-autoplay/runs');

import { writerQueue } from './writerQueue';

export type RunRow = TurnTelemetry & { turn: number; writerRaw?: string; fatePick?: string };

export interface SavedRun {
  dir: string;
  meta: { bibleId: string; engineMode: GameState['engineMode']; personalityId: string; seed: number; aiTier?: string };
  rows: RunRow[];
}

/** Same minimal localStorage the fate-autoplay CLI installs for Node. */
function installNodeShims(): void {
  const g = globalThis as unknown as { localStorage?: Storage; window?: { localStorage: Storage } };
  if (g.localStorage) return;
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
  g.localStorage = ls;
  if (!g.window) g.window = { localStorage: ls };
}

export function loadRun(runFolder: string): SavedRun {
  const dir = join(RUNS_ROOT, runFolder);
  if (!existsSync(dir)) throw new Error(`replay bank: run folder missing: ${runFolder}`);
  const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as RunRow);
  return { dir, meta, rows };
}

export interface ReplayStep {
  before: GameState;
  after: GameState;
  telemetry: TurnTelemetry;
  recorded: RunRow;
  /** Packets the engine handed the writer this turn (empty when no writer call was made). */
  writerPackets: string[];
  /** The harness tester check, computed exactly as runFateAutoplay does. */
  turnCheck?: TurnCheck;
}

const replayCache = new Map<string, Promise<ReplayStep[]>>();

/** Replays the whole run once per test file and shares the steps between its cases. */
export function replayWhole(runFolder: string): Promise<ReplayStep[]> {
  let p = replayCache.get(runFolder);
  if (!p) {
    p = replayRun(runFolder, Number.POSITIVE_INFINITY);
    replayCache.set(runFolder, p);
  }
  return p;
}

/**
 * Replays the saved run up to and including harness turn `uptoTurn` (telemetry `turn`).
 * Returns every step so a case can read the state before its failing turn and the replayed result.
 */
export async function replayRun(runFolder: string, uptoTurn: number): Promise<ReplayStep[]> {
  installNodeShims();
  const run = loadRun(runFolder);
  const tier = (run.meta.aiTier ?? 'free') as Settings['subscriptionTier'];
  enableAutoplayTestLab(tier as never);
  setActiveSubscriptionTier(tier as never);
  const settings: Settings = {
    ...createDefaultSettings(),
    subscriptionTier: tier,
    classicMemorableImages: false,
    visualMode: 'classic',
    gmVoiceProfileId: isGmVoiceProfileId(run.meta.personalityId) ? run.meta.personalityId : 'cold-system',
  } as Settings;

  const seeded = mulberry32(run.meta.seed);
  const realRandom = Math.random;
  Math.random = () => seeded();
  try {
    const { state: raw } = buildNewGameState({
      bibleId: run.meta.bibleId,
      characterName: 'Jax',
      seed: run.meta.seed,
      personality: run.meta.personalityId,
      engineMode: run.meta.engineMode,
    });
    let state = stampOpening(raw);
    const rng = mulberry32(run.meta.seed);
    const steps: ReplayStep[] = [];
    for (const row of run.rows) {
      if (row.turn > uptoTurn) break;
      if (row.error) throw new Error(`replay bank: recorded turn ${row.turn} crashed; cannot replay past it`);
      writerQueue.text = row.writerRaw ?? '';
      writerQueue.payloads = [];
      const before = state;
      const out = await headlessFateTurn(state, settings, rng, {
        bibleId: run.meta.bibleId,
        personalityId: run.meta.personalityId,
        seed: run.meta.seed,
        mode: 'fate',
        aiAgentMode: 'default',
        dryRun: false,
        playerInputOverride: row.fatePick || row.playerInput,
      });
      state = out.state;
      const tel = out.telemetry;
      const p = turnProgress(before, state, [...(tel.arcStatusReceipts ?? []), ...(tel.systemLog ?? [])]);
      tel.progress = p.progressed;
      tel.progressReasons = p.reasons;
      const turnCheck = tel.error ? undefined : checkPlayerTurn(before, state, tel);
      steps.push({ before, after: state, telemetry: tel, recorded: row, writerPackets: writerQueue.payloads, turnCheck });
    }
    return steps;
  } finally {
    Math.random = realRandom;
  }
}

/** What the Fate picker would choose from `state` under each rng seed (dry run, no writer call). */
export async function fatePicks(runFolder: string, state: GameState, rngSeeds: number[]): Promise<string[]> {
  installNodeShims();
  const run = loadRun(runFolder);
  const settings = {
    ...createDefaultSettings(),
    subscriptionTier: (run.meta.aiTier ?? 'free') as Settings['subscriptionTier'],
    classicMemorableImages: false,
    visualMode: 'classic',
  } as Settings;
  const picks: string[] = [];
  for (const s of rngSeeds) {
    const out = await headlessFateTurn(state, settings, mulberry32(s), {
      bibleId: run.meta.bibleId,
      personalityId: run.meta.personalityId,
      seed: run.meta.seed,
      mode: 'fate',
      aiAgentMode: 'default',
      dryRun: true,
    });
    picks.push(out.telemetry.fatePick);
  }
  return picks;
}

export function stepAt(steps: ReplayStep[], turn: number): ReplayStep {
  const s = steps.find((x) => x.recorded.turn === turn);
  if (!s) throw new Error(`replay bank: turn ${turn} not reached`);
  return s;
}
