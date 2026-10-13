/**
 * tt-build-8: settings and panels read one source, from real play state.
 * Tabletop is the cursed-keep ds151 tape (T4 Keep Gate); LitRPG is the summoned-pact fl151 tape.
 * Every setting a player can change now reaches the engine or the writer, or is not shown.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { withHouseRules, carryLimitOn, houseRulesOf } from '../../game/rules/houseRules';
import { modeProfile } from '../../game/rules/modeProfile';
import { formatReaderLine, readerFlags } from '../../game/completedEventPacket';
import { formatMaturityRules } from '../../game/maturity';
import { statusLinesForVerbosity } from '../../game/systemLog';
import { voiceIsStamped } from '../../game/gmVoiceProfile';
import { runRowName } from '../../game/cloudSync';
import { createDefaultSettings } from '../../game/defaults';
import type { GameState, Settings } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';
const FL151 = '2026-10-11T16-58-00-139Z_summoned-pact_cold-system_s151';

let T: Replay;
let L: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
  L = new Replay(await replayWhole(FL151));
}, 900_000);

afterEach(() => vi.restoreAllMocks());

const settings = (over: Partial<Settings> = {}): Settings => ({ ...createDefaultSettings(), ...over });
const ruled = (s: GameState, over: Partial<Settings> = {}) => withHouseRules(s, settings(over));

describe('replay bank tt-build-8 (settings and panels read one source)', () => {
  it('[tabletop ds151 T4 | tt-build-8] the tabletop carry limit is the stamped Encumbrance rule, not the LitRPG toggle', () => {
    const off = ruled(T.before(4), { ttEncumbrance: 'off' as Settings['ttEncumbrance'], strictEncumbrance: true });
    expect(houseRulesOf(off).strictEncumbrance).toBe(false);
    expect(carryLimitOn(off, settings({ strictEncumbrance: true }))).toBe(false);
    const on = ruled(T.before(4), { ttEncumbrance: 'capacity' as Settings['ttEncumbrance'] });
    expect(carryLimitOn(on, settings({ strictEncumbrance: false }))).toBe(true);
  });

  it('[litrpg fl151 T3 | tt-build-8] LitRPG reads the Strict Encumbrance toggle', () => {
    const s = L.before(3);
    expect(s.engineMode).toBe('litrpg');
    expect(carryLimitOn(s, settings({ strictEncumbrance: true }))).toBe(true);
    expect(carryLimitOn(s, settings({ strictEncumbrance: false }))).toBe(false);
  });

  it('[tabletop ds151 T4 | tt-build-8] Auto Fight is off in tabletop (the round engine owns fights) and on in LitRPG', () => {
    expect(modeProfile(T.before(4).engineMode).autoFight).toBe(false);
    expect(modeProfile(L.before(3).engineMode).autoFight).toBe(true);
    expect(modeProfile('pyoa').autoFight).toBe(false);
    expect(modeProfile('rpg').autoFight).toBe(true);
  });

  it('[tabletop ds151 T4 | tt-build-8] mild swearing and no violence detail reach the writer\'s reader line', () => {
    const base = settings({ contentMode: 'adult' as Settings['contentMode'] });
    const mild = formatReaderLine(readerFlags({ ...base, cursingLevel: 'mild', violenceLevel: 'none' }));
    expect(mild).toContain('Swearing: mild');
    expect(mild).toContain('Violence detail: none');
    const full = formatReaderLine(readerFlags({ ...base, cursingLevel: 'strong', violenceLevel: 'graphic' }));
    expect(full).not.toContain('Swearing: mild');
    expect(full).not.toContain('Violence detail: none');
  });

  it('[litrpg fl151 T3 | tt-build-8] the romance toggles reach the live writer rules', () => {
    const adult = settings({ contentMode: 'adult' as Settings['contentMode'] });
    expect(formatMaturityRules({ ...adult, romanceSubplots: false })).toContain('ROMANCE: off');
    const on = formatMaturityRules({ ...adult, romanceSubplots: true, haremContent: false });
    expect(on).toContain('only when the player steers there');
    expect(on).toContain('One love interest at a time.');
    expect(formatMaturityRules({ ...adult, romanceSubplots: true, haremContent: true })).toContain('Several love interests');
  });

  it('[tabletop ds151 T4 | tt-build-8] Stat Verbosity filters the same STATUS lines in the panel and the book', () => {
    const lines = T.turns().flatMap((n) => T.receipts(n));
    expect(lines.length).toBeGreaterThan(0);
    expect(statusLinesForVerbosity(lines, 'minimal')).toEqual([]);
    expect(statusLinesForVerbosity(lines, 'detailed')).toEqual(lines);
    const core = statusLinesForVerbosity(lines, 'core');
    expect(core.length).toBeLessThanOrEqual(lines.length);
    for (const l of core) expect(lines).toContain(l);
    expect(statusLinesForVerbosity(['Dagger hit for 4 damage.', 'Turn 4.'], 'core')).toEqual(['Dagger hit for 4 damage.']);
  });

  it('[tabletop ds151 T4 | tt-build-8] the narrator is stamped at New Game, so Settings does not offer a voice that would not apply', () => {
    expect(voiceIsStamped(T.before(4))).toBe(true);
    expect(voiceIsStamped(L.before(3))).toBe(true);
    expect(voiceIsStamped({ engineMode: 'rpg', gmPersonality: null })).toBe(false);
  });

  it('[tabletop ds151 T4 | tt-build-8] the cloud run snapshot is keyed by save, so two heroes with one name never overwrite each other', () => {
    const a = T.before(4).saveId!;
    const b = L.before(3).saveId!;
    expect(runRowName(a)).toBe(`run:${a}`);
    expect(runRowName(a)).not.toBe(runRowName(b));
    expect(runRowName(a).startsWith('sheet:')).toBe(false);
  });
});
