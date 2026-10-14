/**
 * Multi lap 40 — tester telemetry's xpGained is the turn's whole XP gain (fight and arrival XP included),
 * a townsperson cast as the antagonist reads as a threat wherever they stand, and an "Approach" is an
 * outdoor road even when it belongs to a palace.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { pickNpcSheet } from '../../game/npcSheet';
import { placeScale } from '../../game/placeAuthority';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const DS150 = '2026-10-12T17-05-53-021Z_summoned-pact_cold-system_s150';
const DS151 = '2026-10-12T17-05-53-067Z_summoned-pact_cold-system_s151';

let A: Replay;
let B: Replay;
beforeAll(async () => {
  A = new Replay(await replayWhole(DS150));
  B = new Replay(await replayWhole(DS151));
}, 600_000);

const xpGain = (R: Replay, n: number) => {
  const b = R.before(n).character;
  const a = R.after(n).character;
  if (a.level === b.level) return a.xp - b.xp;
  return b.xpToNext - b.xp + a.xp;
};

describe('replay bank m40 lap 40', () => {
  it('[ds150 T7,T13 | m40 telemetry] xpGained is the whole XP the turn paid, fights included (whole run)', () => {
    expect(A.input(13), 'replay fights the thugs on T13').toBe('Face the thugs');
    expect(xpGain(A, 13), 'the fight pays more than the sandbox share').toBeGreaterThan(25);
    expect(A.after(13).character.xp, 'T7 talk-past 40 + T13 fight 40 + First Kill 25 (earned XP)').toBe(105);
    expect(A.after(A.turns()[A.turns().length - 1]).character.level, 'earned XP: no level-up in 21 turns').toBe(1);
    for (const R of [A, B]) {
      for (const n of R.turns()) expect(R.at(n).telemetry.xpGained ?? 0, `T${n}`).toBe(xpGain(R, n));
    }
  });

  it('[ds150 T19, ds151 T19 | m40 persona] a townsperson cast as the antagonist never rolls a cheerful or trusting persona', () => {
    expect(A.after(19).currentLocation, 'ds150 reaches the Undercroft on T19').toBe('Cathedral Undercroft');
    expect(B.after(19).currentLocation, 'ds151 talks in Contract Hall on T19').toBe('Contract Hall');
    const met = [A, B].flatMap((R) => (R.after(R.turns()[R.turns().length - 1]).npcMemories ?? []).filter((m) => m.sheet).map((m) => m.npcName));
    expect(met.length, 'replays met townsfolk with sheets').toBeGreaterThan(0);
    const cheer = /\b(?:trusting|hopeful|cheerful|playful|bright|optimistic|enthusiastic|bold|hearty|charming|teasing|impulsive)\b/i;
    for (const name of met) {
      for (const place of ['dungeon', 'town', 'inn', 'road'] as const) {
        const sheet = pickNpcSheet(name, place, { campaignId: 'summoned-pact', roleHint: 'antagonist' });
        expect(sheet.speech, `${name} @ ${place}`).not.toMatch(cheer);
        expect(sheet.motive, `${name} @ ${place}`).not.toMatch(/lift others' spirits/i);
      }
    }
  });

  it('[ds151 T18 | m40 camera] a palace "Approach" reads outdoor; the hall at its end stays indoor', () => {
    expect(B.after(18).currentLocation, 'replay reaches Contract Hall on T18').toBe('Contract Hall');
    const at = (place: string) => placeScale({ ...B.after(18), currentLocation: place });
    expect(at('Contract Hall')).toBe('indoor');
    expect(at('Palace Approach')).toBe('outdoor');
    expect(at('the ledger stair on the Palace Approach')).toBe('outdoor');
  });
});
