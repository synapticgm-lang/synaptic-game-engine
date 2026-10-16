/**
 * Replay-case-staging R4 (Order M step 4 + Wire-in H): a motive line said on T9 must not reprint on T10.
 * Tape: distill-1 broken-crown s5109. Pin with the Order B seam.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { alreadySaidLines, classifyTokenLine, type TokenBeat } from '../../game/tokenProse';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const S5109 = 'distill-1/2026-10-15T09-40-34-319Z_broken-crown-keep_chilled-gm_s5109';
const PACK =
  'That pack was the last of my errands, and you handled it fine, so tonight you have earned a meal and a dry corner more than another job.';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(S5109));
}, 600_000);

describe('replay bank tt15features R4 motive said once', () => {
  it('[R4 s5109 T9/T10 | Order M step 4] Jarek\'s T9 pack line is on the ledger; reprinting it fails the gate', () => {
    expect(T.prose(9)).toContain(PACK.slice(0, 40));
    const after9 = T.after(9);
    const here = (after9.currentLocation ?? '').toLowerCase();
    const ledger =
      (after9.places ?? []).find((p) => (p.name ?? '').toLowerCase() === here)?.sceneLedger ??
      (after9.places ?? []).find((p) => p.sceneLedger)?.sceneLedger;
    expect(
      ledger?.said.some((s) => s.includes('pack was the last of my errands')) ?? false,
      'ledger said holds the T9 quote'
    ).toBe(true);

    const before10 = T.before(10);
    const said = alreadySaidLines(before10, { playerAction: T.input(10) } as never);
    const scene = said.get('*said*') ?? [];
    expect(scene.some((s) => s.includes('pack was the last of my errands')), 'gate pool before T10').toBe(true);

    const enumRefs = [{ tok: 't1', id: 'present:jarek-finn', klass: 'person', display: 'Jarek Finn' }] as never;
    const beat = { refs: [{ tok: 't1', use: 'speaker', id: 'present:jarek-finn' }], lines: [] } as unknown as TokenBeat;
    const speech = (text: string) => ({ fn: 'speech', speaker_tok: 't1', spoken: true, text }) as never;
    const narr = (text: string) => ({ fn: 'action', text }) as never;
    expect(classifyTokenLine(speech(PACK), beat, enumRefs, [], undefined, said).reason).toBe('said-again');
    // Narration that embeds the earlier quote (the live T10 shape).
    const embed = `Jarek Finn kept talking. "${PACK}"`;
    expect(classifyTokenLine(narr(embed), beat, enumRefs, [], undefined, said).reason, `scene=${scene[0]?.slice(0, 40)}`).toBe(
      'said-again'
    );
  });
});

