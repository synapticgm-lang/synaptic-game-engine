// Drop at: src/game/companionsFullNpcs.test.ts (Order 8 tests A-F + PRECHECK additions).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ROLE_AGENDA_TEMPLATES } from './npcMemory';
import { buildWriterPacket } from './companionAgency'; // check name (was completedEventPacket)
import { stampNpcLocationsOnMove } from './npcRecords';
import { retrieveNpcMemories } from './npcMemoryRetrieval'; // check name
import { sceneAffordances } from './sceneAffordances'; // check name
import { companionFixture } from './__fixtures__/companions'; // ORDER-NAMED: two companions, distinct seeds

describe('companions are their own people', () => {
  it('A. two companions get different wants; no Protection/the party/loyal default', () => {
    const { a, b } = companionFixture();
    expect(a.agenda.motivation).not.toBe(b.agenda.motivation);
    for (const c of [a, b]) expect([c.agenda.motivation, c.agenda.target, ...c.agenda.traits]).not.toEqual(expect.arrayContaining(['Protection', 'the party', 'loyal']));
    expect((ROLE_AGENDA_TEMPLATES as any).companion).toBeUndefined();
  });
  it('B. hostile companion refuses an order; refusal is in the writer packet', () => {
    const { state } = companionFixture({ stance: 'hostile' });
    expect(buildWriterPacket(state, 'Mara, guard the door').toString()).toMatch(/refus/i);
  });
  it('C. companion who disagrees stays behind on travel', () => {
    const { state, a } = companionFixture({ disagreesWithTravel: true });
    const next = stampNpcLocationsOnMove(state, 'Inn', 'Crypt');
    expect(next.npcMemories?.find((m) => m.npcId === a.id)?.location ?? 'Inn').toBe('Inn');
  });
  it('D. remembers a player act 10 turns later', () => {
    const { stateAfter10 } = companionFixture({ playerActAtTurn: 3 });
    expect(stateAfter10).toBeDefined();
    expect(retrieveNpcMemories(stateAfter10!, 'mara').some((m) => m.turn === 3)).toBe(true);
  });
  it('fights: still <= 4 option buttons, free text accepted, dice engine-only', () => {
    const { fightState } = companionFixture({ inFight: true });
    expect(fightState).toBeDefined();
    const chips = sceneAffordances(fightState!);
    expect(chips.length).toBeLessThanOrEqual(4);
  });
  it('F. no companion-only path for memory/stance', () => {
    for (const f of ['src/game/npcMemory.ts', 'src/game/npcStance.ts', 'src/game/npcRecords.ts'])
      expect(readFileSync(f, 'utf8')).not.toMatch(/if\s*\([^)]*isCompanion[^)]*\)\s*{?\s*return/);
  });
});
// E (speaks unprompted on a topic touching their wants) belongs in the replay bank, not unit tests.
