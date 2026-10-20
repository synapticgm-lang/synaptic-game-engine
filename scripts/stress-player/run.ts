/**
 * q76b-STRESS / q76e-SCENARIOS — no-AI random stress player (node / vite-node).
 * Drives headlessFateTurn with dryRun stub writer (no OpenRouter / network GM).
 * q76e: ~60% games start in engine-built risky scenarios; typed 'answered' is
 * refusal/receipt/engineResult (not bare gmText); coverage stats printed.
 *
 * Invoke:
 *   node ./node_modules/vite-node/vite-node.mjs --config vite.config.ts scripts/stress-player/run.ts -- \
 *     --modes litrpg,rpg,tabletop --games N --turns M --seed S [--naughty]
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildNewGameState,
  stampOpening,
  headlessFateTurn,
  parseTestGameMode,
  isBlankCanvasBible,
  isTestExcludedBible,
  enableAutoplayTestLab,
  disableAutoplayTestLab,
  type AiAgentMode,
} from '../../src/game/fateAutoplay';
import { createDefaultSettings } from '../../src/game/defaults';
import { getCampaignBiblesByEngineMode, type CampaignBible } from '@/data/campaigns';
import { mulberry32, pickFateChoice, type Rng } from '../../src/game/fatePick';
import { resolveOfferedChoices } from '../../src/game/playTranscript';
import { checkTurnInvariants, type TurnOption } from '../../src/game/invariants/turnInvariants';
import { validateActionHard } from '../../src/game/actionValidation';
import { buildStressStubProse } from './stubWriter';
import { generateTypedLine } from './generators';
import {
  pickAndInjectScenario,
  engineAnswered,
  emptyCoverage,
  sampleCoverage,
  type CoverageBucket,
  type StressScenarioId,
} from './scenarios';
import type { EngineMode, GameState } from '../../src/game/types';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BREAKS_DIR = join(ROOT, 'scripts', 'stress-player', 'breaks');
const VITEST_DIR = join(ROOT, 'src', '__tests__', 'stressBreaks');

type ModeKey = 'litrpg' | 'rpg' | 'tabletop';

function installNodeShims(): void {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };
  const g = globalThis as typeof globalThis & {
    localStorage?: typeof localStorage;
    window?: { localStorage: typeof localStorage };
  };
  if (!g.localStorage) g.localStorage = localStorage;
  if (!g.window) g.window = { localStorage };
}

function parseArgs(argv: string[]): {
  modes: ModeKey[];
  games: number;
  turns: number;
  seed: number;
  naughty: boolean;
} {
  let modes: ModeKey[] = ['litrpg', 'rpg', 'tabletop'];
  let games = 3;
  let turns = 20;
  let seed = 1;
  let naughty = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = () => argv[++i] ?? '';
    if (a === '--modes') {
      const raw = next().split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const out: ModeKey[] = [];
      for (const m of raw) {
        if (m === 'litrpg' || m === 'rpg' || m === 'tabletop') out.push(m);
      }
      if (out.length) modes = out;
    } else if (a === '--games') games = Math.max(1, Number(next()) || 1);
    else if (a === '--turns') turns = Math.max(1, Number(next()) || 1);
    else if (a === '--seed') seed = Number(next()) || 1;
    else if (a === '--naughty') naughty = true;
    else if (a === '--help' || a === '-h') {
      console.log(`stress-player — no-AI stub writer + scenario injection

  --modes litrpg,rpg,tabletop   (never pyoa; default all three)
  --games N                     games to run (default 3)
  --turns M                     turns per game (default 20)
  --seed S                      base seed (default 1)
  --naughty                     stub may voice absent known NPCs (prove checker)
`);
      process.exit(0);
    }
  }
  return { modes, games, turns, seed, naughty };
}

function engineModeFor(m: ModeKey): EngineMode {
  const parsed = parseTestGameMode(m === 'tabletop' ? 'tabletop' : m);
  if (!parsed || parsed === 'pyoa') throw new Error(`bad mode ${m}`);
  return parsed;
}

function biblesFor(mode: EngineMode): CampaignBible[] {
  return getCampaignBiblesByEngineMode(mode).filter(
    (b) => !isBlankCanvasBible(b.id) && !isTestExcludedBible(b.id)
  );
}

function pickBible(mode: EngineMode, rng: Rng): CampaignBible {
  const all = biblesFor(mode);
  if (!all.length) throw new Error(`no bibles for ${mode}`);
  return all[Math.min(all.length - 1, Math.floor(rng() * all.length))]!;
}

function offeredOptions(state: GameState): TurnOption[] {
  const pad = state.offeredPad;
  if (pad?.chips?.length) {
    const out: TurnOption[] = [];
    for (let i = 0; i < pad.chips.length; i++) {
      const c = pad.chips[i]!;
      const check = pad.checks?.[c.label] ?? null;
      out.push({ label: c.label, kind: c.kind, check });
    }
    return out;
  }
  const labels = pad?.choices?.length ? pad.choices : resolveOfferedChoices(state);
  const out: TurnOption[] = [];
  for (let i = 0; i < labels.length; i++) out.push({ label: labels[i]! });
  return out;
}

function offeredLabels(state: GameState): string[] {
  const opts = offeredOptions(state);
  const labels: string[] = [];
  for (let i = 0; i < opts.length; i++) {
    const o = opts[i]!;
    labels.push(typeof o === 'string' ? o : o.label);
  }
  return labels;
}

function causeSlug(code: string): string {
  return code.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'break';
}

function saveBreak(opts: {
  seed: number;
  mode: ModeKey;
  bible: string;
  turn: number;
  stateBefore: GameState;
  input: string;
  typed: boolean;
  gmText: string;
  speakers: string[];
  offeredOptions: TurnOption[];
  violation: { code: string; severity: string; detail: string };
  answered: boolean;
  visibleAnswer: string;
}): string {
  mkdirSync(BREAKS_DIR, { recursive: true });
  mkdirSync(VITEST_DIR, { recursive: true });
  const cause = causeSlug(opts.violation.code);
  const base = `${cause}-${opts.seed}-${opts.turn}`;
  const jsonPath = join(BREAKS_DIR, `${base}.json`);
  const payload = {
    seed: opts.seed,
    mode: opts.mode,
    bible: opts.bible,
    turn: opts.turn,
    input: opts.input,
    typed: opts.typed,
    gmText: opts.gmText,
    speakers: opts.speakers,
    answered: opts.answered,
    visibleAnswer: opts.visibleAnswer,
    offeredOptions: opts.offeredOptions,
    violation: opts.violation,
    stateBefore: opts.stateBefore,
  };
  writeFileSync(jsonPath, JSON.stringify(payload) + '\n');
  const testPath = join(VITEST_DIR, `${base}.test.ts`);
  const relJson = `../../../scripts/stress-player/breaks/${base}.json`;
  const body = `/**
 * q76b-STRESS generated replay — skipped until the invariant is fixed.
 * Source: scripts/stress-player/breaks/${base}.json
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkTurnInvariants } from '../../game/invariants/turnInvariants';
import type { GameState } from '../../game/types';

describe.skip('stress break ${base}', () => {
  it('reproduces invariant ${opts.violation.code}', () => {
    const raw = JSON.parse(readFileSync(join(__dirname, '${relJson}'), 'utf8')) as {
      stateBefore: GameState;
      input: string;
      typed: boolean;
      gmText: string;
      speakers: string[];
      answered?: boolean;
      visibleAnswer?: string;
      offeredOptions: unknown[];
      violation: { code: string };
    };
    const hits = checkTurnInvariants(raw.stateBefore, raw.stateBefore, {
      offeredOptions: raw.offeredOptions as never,
      playerInput: raw.input,
      typed: raw.typed,
      prose: raw.gmText,
      answered: raw.answered ?? false,
      visibleAnswer: raw.visibleAnswer ?? '',
      speakers: raw.speakers,
    });
    expect(hits.some((h) => h.code === raw.violation.code)).toBe(true);
  });
});
`;
  writeFileSync(testPath, body);
  return jsonPath;
}

function addCoverage(into: CoverageBucket, sample: ReturnType<typeof sampleCoverage>): void {
  into.fight += sample.fight;
  into.dying += sample.dying;
  into.roadBlock += sample.roadBlock;
  into.typed += sample.typed;
  into.ended += sample.ended;
  into.turns += 1;
}

async function runGame(opts: {
  mode: ModeKey;
  seed: number;
  turns: number;
  rng: Rng;
  naughty: boolean;
  breaksByCode: Map<string, number>;
  coverage: CoverageBucket;
  scenariosUsed: Map<StressScenarioId, number>;
}): Promise<{ turns: number; breaks: number }> {
  const engineMode = engineModeFor(opts.mode);
  const bible = pickBible(engineMode, opts.rng);
  const settings = {
    ...createDefaultSettings(),
    subscriptionTier: 'free' as const,
    classicMemorableImages: false,
    visualMode: 'classic' as const,
  };
  const built = buildNewGameState({
    bibleId: bible.id,
    characterName: 'Jax',
    seed: opts.seed,
    personality: 'cold-system',
    engineMode,
    tabletopCreation: engineMode === 'dnd',
  });
  let state = stampOpening(built.state);
  const picked = pickAndInjectScenario(state, opts.rng);
  state = picked.state;
  opts.scenariosUsed.set(picked.id, (opts.scenariosUsed.get(picked.id) ?? 0) + 1);

  let breaks = 0;
  let done = 0;
  for (let i = 0; i < opts.turns; i++) {
    if (state.playPhase === 'ended') {
      addCoverage(opts.coverage, sampleCoverage(state, false));
      break;
    }
    const before = state;
    const labels = offeredLabels(before);
    const useChip = opts.rng() < 0.55 && labels.length > 0;
    let input: string;
    let typed = false;
    if (useChip) {
      input = pickFateChoice(labels, opts.rng);
      typed = false;
    } else {
      const g = generateTypedLine(before, opts.rng);
      input = g.text;
      typed = true;
    }
    addCoverage(opts.coverage, sampleCoverage(before, typed));

    const lastGm = [...(before.log ?? [])].reverse().find((e) => e.role === 'gm')?.content ?? '';
    const hard = typed ? validateActionHard(input, before, lastGm) : { valid: true as const, refusalBody: undefined as string | undefined };

    // Typed hard-gate refusal: engine answer is refusalBody (do not rewrite to Look around for scoring).
    if (typed && !hard.valid && hard.refusalBody) {
      const offered = offeredOptions(before);
      const ans = engineAnswered({ typed: true, refusalBody: hard.refusalBody });
      const stub = buildStressStubProse(before, input, {
        naughty: opts.naughty,
        naughtyChance: 0.15,
        roll: opts.rng(),
      });
      const violations = checkTurnInvariants(before, before, {
        offeredOptions: offered,
        playerInput: input,
        typed: true,
        prose: ans.visibleAnswer,
        answered: ans.answered,
        visibleAnswer: ans.visibleAnswer,
        speakers: stub.speakers,
      });
      for (let v = 0; v < violations.length; v++) {
        const hit = violations[v]!;
        breaks += 1;
        opts.breaksByCode.set(hit.code, (opts.breaksByCode.get(hit.code) ?? 0) + 1);
        saveBreak({
          seed: opts.seed,
          mode: opts.mode,
          bible: bible.id,
          turn: before.turn,
          stateBefore: before,
          input,
          typed: true,
          gmText: ans.visibleAnswer,
          speakers: stub.speakers,
          offeredOptions: offered,
          violation: hit,
          answered: ans.answered,
          visibleAnswer: ans.visibleAnswer,
        });
      }
      done += 1;
      continue;
    }

    const offered = offeredOptions(before);
    const result = await headlessFateTurn(before, settings, opts.rng, {
      bibleId: bible.id,
      personalityId: built.personalityId,
      seed: opts.seed,
      mode: 'fate',
      aiAgentMode: 'default' as AiAgentMode,
      dryRun: true,
      playerInputOverride: input,
    });
    state = result.state;
    done += 1;
    const stub = buildStressStubProse(state, input, {
      naughty: opts.naughty,
      naughtyChance: 0.15,
      roll: opts.rng(),
    });
    const gmText = result.telemetry.gmText ?? stub.prose;
    const speakers = stub.speakers;
    const ans = engineAnswered({
      typed,
      refusalBody: hard.refusalBody,
      systemLog: result.telemetry.systemLog,
      engineResult: state.completedEvent?.engineResult ?? null,
    });
    // Chip turns: gmText is fine as visible answer. Typed: only engine answer counts.
    const answered = typed ? ans.answered : !!(gmText && gmText.trim());
    const visibleAnswer = typed ? ans.visibleAnswer : gmText;
    const violations = checkTurnInvariants(before, state, {
      offeredOptions: offered,
      playerInput: input,
      typed,
      prose: gmText,
      answered,
      visibleAnswer,
      speakers,
    });
    for (let v = 0; v < violations.length; v++) {
      const hit = violations[v]!;
      breaks += 1;
      opts.breaksByCode.set(hit.code, (opts.breaksByCode.get(hit.code) ?? 0) + 1);
      saveBreak({
        seed: opts.seed,
        mode: opts.mode,
        bible: bible.id,
        turn: before.turn,
        stateBefore: before,
        input,
        typed,
        gmText,
        speakers,
        offeredOptions: offered,
        violation: hit,
        answered,
        visibleAnswer,
      });
    }
  }
  return { turns: done, breaks };
}

async function main(): Promise<void> {
  installNodeShims();
  const args = parseArgs(process.argv.slice(2));
  enableAutoplayTestLab('free');
  mkdirSync(BREAKS_DIR, { recursive: true });
  if (!existsSync(join(BREAKS_DIR, '.gitkeep'))) writeFileSync(join(BREAKS_DIR, '.gitkeep'), '');
  mkdirSync(VITEST_DIR, { recursive: true });
  if (!existsSync(join(VITEST_DIR, '.gitkeep'))) writeFileSync(join(VITEST_DIR, '.gitkeep'), '');

  const quiet = process.env.SGM_STRESS_VERBOSE !== '1';
  const log = console.log.bind(console);
  const info = console.info.bind(console);
  const warn = console.warn.bind(console);
  if (quiet) {
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
  }

  const breaksByCode = new Map<string, number>();
  const scenariosUsed = new Map<StressScenarioId, number>();
  const perMode = new Map<ModeKey, { games: number; turns: number; breaks: number; coverage: CoverageBucket }>();
  for (const m of args.modes) {
    perMode.set(m, { games: 0, turns: 0, breaks: 0, coverage: emptyCoverage() });
  }
  const totalCoverage = emptyCoverage();

  {
    const warmMode = args.modes[0]!;
    const warmRng = mulberry32(args.seed);
    await runGame({
      mode: warmMode,
      seed: args.seed,
      turns: 1,
      rng: warmRng,
      naughty: false,
      breaksByCode: new Map(),
      coverage: emptyCoverage(),
      scenariosUsed: new Map(),
    });
  }

  const t0 = Date.now();
  let totalTurns = 0;
  let totalBreaks = 0;
  for (let g = 0; g < args.games; g++) {
    const mode = args.modes[g % args.modes.length]!;
    const seed = args.seed + g * 10007;
    const rng = mulberry32(seed);
    const slot = perMode.get(mode)!;
    const r = await runGame({
      mode,
      seed,
      turns: args.turns,
      rng,
      naughty: args.naughty,
      breaksByCode,
      coverage: slot.coverage,
      scenariosUsed,
    });
    totalTurns += r.turns;
    totalBreaks += r.breaks;
    slot.games += 1;
    slot.turns += r.turns;
    slot.breaks += r.breaks;
  }
  for (const [, slot] of perMode) {
    totalCoverage.fight += slot.coverage.fight;
    totalCoverage.dying += slot.coverage.dying;
    totalCoverage.roadBlock += slot.coverage.roadBlock;
    totalCoverage.typed += slot.coverage.typed;
    totalCoverage.ended += slot.coverage.ended;
    totalCoverage.turns += slot.coverage.turns;
  }
  const ms = Math.max(1, Date.now() - t0);
  const tps = (totalTurns * 1000) / ms;
  disableAutoplayTestLab();
  if (quiet) {
    console.log = log;
    console.info = info;
    console.warn = warn;
  }

  const perModeOut: Record<string, unknown> = {};
  for (const [m, slot] of perMode) {
    perModeOut[m] = {
      games: slot.games,
      turns: slot.turns,
      breaks: slot.breaks,
      coverage: slot.coverage,
    };
  }

  log(JSON.stringify({
    tag: 'q76e-SCENARIOS',
    games: args.games,
    turns: totalTurns,
    turnsPerSec: Number(tps.toFixed(2)),
    ms,
    seed: args.seed,
    modes: args.modes,
    naughty: args.naughty,
    scenariosUsed: Object.fromEntries([...scenariosUsed.entries()]),
    coverage: totalCoverage,
    perMode: perModeOut,
    breaks: totalBreaks,
    breaksByCode: Object.fromEntries([...breaksByCode.entries()]),
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
