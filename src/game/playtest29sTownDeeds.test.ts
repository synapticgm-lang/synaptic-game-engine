import { describe, expect, it } from 'vitest';
import type { WorldOutlineSettlement } from '@/data/worldOutlines';
import { createInitialState } from './defaults';
import type { GameState, SceneFacts } from './types';
import { applySandboxXpAwards } from './sandboxXp';
import { finishSettlementQuestCard } from './settlementQuestCards';
import { seedWorldMapPlaces } from './worldMapAuthority';
import { storedRelationshipFor } from './npcRelationships';
import { storedDisposition } from './checkRules';
import { LITRPG_MILESTONE_XP } from './xpRules';
import { HUD_BUILD_STAMP } from '@/components/Hud';
import { BUILD_STAMP } from './runManifest';

const village = (id: string, name: string): WorldOutlineSettlement => ({
  id, name, regionId: 'r1', kind: 'village', biome: 'farm', blurb: '',
});
const atlas = (settlements: WorldOutlineSettlement[]) =>
  ({ settlements, regions: [], outlineName: 'Test', description: '' }) as never;

function facts(present: string[]): SceneFacts {
  return { props: [], present, crowd: 'unknown', noise: 'unknown', lastBeat: '', updatedTurn: 0 } as unknown as SceneFacts;
}

function base(): GameState {
  const s = createInitialState('Ria', 'litrpg');
  return {
    ...s,
    engineMode: 'litrpg',
    gmStrictness: 'standard',
    currentLocation: 'Oakfield',
    places: seedWorldMapPlaces([], atlas([village('oakfield', 'Oakfield'), village('millbrook', 'Millbrook')]), { seed: 'seed-29s' }),
    locationSheet: undefined,
    activeDungeon: null,
    activeEncounter: null,
    openingEstablishment: undefined,
    sandboxAwardKeys: [],
    sceneFacts: facts(['Mara']),
    arcDirector: undefined,
    turn: 2,
  } as GameState;
}

const cardAt = (s: GameState, placeName: string) => s.places!.find((p) => p.name === placeName)!.questCards![0];

function turn(s: GameState, action: string, t: number, extra: { checkSucceeded?: boolean } = {}) {
  const r = applySandboxXpAwards(s, {
    playerAction: action,
    locationName: s.currentLocation,
    previousLocationName: s.currentLocation,
    questsBefore: [],
    questsAfter: [],
    events: [],
    turn: t,
    ...extra,
  });
  const next: GameState = {
    ...s,
    places: r.places,
    sandboxAwardKeys: r.awardKeys,
    arcDirector: r.npcRelationships ? { ...s.arcDirector, npcRelationships: r.npcRelationships } : s.arcDirector,
    turn: t,
  } as GameState;
  return { r, next };
}

const paidComplete = (notes: string[]) => notes.some((n) => n.includes('quest complete'));

/** Pick the chip at the current place, then resolve its stake on the next turn. */
function helpAt(s: GameState, placeName: string, t: number) {
  const chip = turn({ ...s, currentLocation: placeName }, cardAt(s, placeName).label, t);
  return turn(chip.next, 'I find it and bring it back', t + 1);
}

describe('29s town quests finish on the stake, not the chip', () => {
  it('picking the chip does not finish or pay', () => {
    const s = base();
    const { r } = turn(s, cardAt(s, 'Oakfield').label, 2);
    expect(r.xp).toBe(0);
    expect(r.items).toHaveLength(0);
    expect(paidComplete(r.notes)).toBe(false);
    expect(cardAt({ ...s, places: r.places }, 'Oakfield').status).toBe('open');
    expect(finishSettlementQuestCard(s, cardAt(s, 'Oakfield').id).xp).toBe(0);
  });

  it('a no-progress repeat, a failed check, or a look does not finish it', () => {
    const chip = turn(base(), cardAt(base(), 'Oakfield').label, 2).next;
    expect(paidComplete(turn(chip, cardAt(chip, 'Oakfield').label, 3).r.notes)).toBe(false);
    expect(paidComplete(turn(chip, 'I find it and bring it back', 3, { checkSucceeded: false }).r.notes)).toBe(false);
    expect(paidComplete(turn(chip, 'Look around', 3).r.notes)).toBe(false);
    // Same turn as the chip does not count either.
    expect(paidComplete(turn(chip, 'I find it and bring it back', 2).r.notes)).toBe(false);
  });

  it('resolving the stake finishes and pays once', () => {
    const { r, next } = helpAt(base(), 'Oakfield', 2);
    expect(paidComplete(r.notes)).toBe(true);
    expect(r.notes.join(' ')).toContain(String(LITRPG_MILESTONE_XP.questComplete));
    expect(r.items).toHaveLength(1);
    expect(cardAt(next, 'Oakfield').status).toBe('done');
    const again = turn(next, 'I find it and bring it back', 4);
    expect(paidComplete(again.r.notes)).toBe(false);
    expect(again.r.items).toHaveLength(0);
  });
});

describe('29s respect lives on the NPC', () => {
  it('an NPC present for the help has higher respect at a different place', () => {
    const { next } = helpAt(base(), 'Oakfield', 2);
    const mara = storedRelationshipFor(next, 'Mara')!;
    expect(mara.respect).toBe(3);
    expect(mara.trust).toBe(2);
    expect(mara.familiarity).toBe(1);
    const elsewhere = { ...next, currentLocation: 'Millbrook', sceneFacts: facts(['Mara']) } as GameState;
    expect(storedRelationshipFor(elsewhere, 'Mara')!.respect).toBeGreaterThan(0);
    expect(storedRelationshipFor(next, 'Tom')).toBeUndefined();
  });

  it('a later witnessed good deed at another place adds the smaller bump', () => {
    const first = helpAt(base(), 'Oakfield', 2).next;
    const second = helpAt({ ...first, sceneFacts: facts(['Mara', 'Tom']) } as GameState, 'Millbrook', 5).next;
    const mara = storedRelationshipFor(second, 'Mara')!;
    expect(mara.respect).toBe(4);
    expect(mara.trust).toBe(3);
    expect(mara.familiarity).toBe(1);
    const tom = storedRelationshipFor(second, 'Tom')!;
    expect(tom.respect).toBe(3);
  });

  it('one deed does not make them friendly', () => {
    const { next } = helpAt(base(), 'Oakfield', 2);
    expect(storedDisposition(storedRelationshipFor(next, 'Mara')!)).not.toBe('friendly');
  });

  it('one harm does not make them hostile, and it uses trust and fear', () => {
    const s = base();
    const hit = turn(s, 'Attack Mara', 2).next;
    const mara = storedRelationshipFor(hit, 'Mara')!;
    expect(mara.trust).toBe(-2);
    expect(mara.fear).toBe(1);
    expect(mara.respect).toBe(0);
    expect(storedDisposition(mara)).not.toBe('hostile');
    const stole = turn({ ...s, sceneFacts: facts(['Tom']) } as GameState, 'Steal bread from the stall', 2).next;
    expect(storedRelationshipFor(stole, 'Tom')!.trust).toBe(-2);
  });

  it('stamp is 2026-09-29s1', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-29s1');
    expect(BUILD_STAMP).toBe('2026-09-29s1');
  });
});
