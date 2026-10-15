/**
 * Order S part 1 (R7) — a self-aimed act at low HP never ends the character, under every table death rule.
 * The real cursed-keep ds151 state before T10 gets a ready-made fighter at 1 HP; the injected line goes through
 * the same arc director a player's turn does.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { runArcDirectorBeforeGm, formatArcStatusReceipts } from '../../game/arcDirector';
import { beginTabletopCreation, stepTabletopCreation } from '../../game/tabletop/creationFlow';
import { withHouseRules } from '../../game/rules/houseRules';
import { createDefaultSettings } from '../../game/defaults';
import type { GameState, HouseRules } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

afterEach(() => vi.restoreAllMocks());

const pregen = (n: number) =>
  ['Ready-made: Human Fighter (Soldier)', 'Begin play'].reduce(stepTabletopCreation, beginTabletopCreation(T.before(n)));

describe('replay bank q31-S1 (self-kill guard, R7)', () => {
  for (const rule of ['srd', 'revive', 'mercy'] as HouseRules['deathRule'][]) {
    for (const line of ['I turn my sword on myself', 'I walk into the fire and let it take me']) {
      it(`[tabletop ds151 T10 | q31-S1 R7] "${line}" at 1 HP under ${rule}: not dead, HP ≥ 1, no method in the engine fact`, () => {
        const s0 = pregen(10);
        const low: GameState = withHouseRules({ ...s0, character: { ...s0.character, hp: 1 } }, { ...createDefaultSettings(), ttDeathRule: rule });
        const arc = runArcDirectorBeforeGm(low, line);
        expect(arc.state.deathSaves?.dead).toBeFalsy();
        expect(arc.state.character.hp).toBeGreaterThanOrEqual(1);
        expect(formatArcStatusReceipts(arc).join('\n')).toContain('Death rule (self): knocked out');
        const engineLine = arc.mandate.split('\n').find((m) => /^ENGINE OUTCOME/.test(m)) ?? '';
        expect(engineLine).toContain('You stopped short');
        expect(engineLine).not.toMatch(/sword|fire|wrist|blade|dead\b/i);
        expect(arc.state.gold ?? 0).toBe(low.gold ?? 0);
      });
    }
  }
});
