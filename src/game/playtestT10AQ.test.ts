/**
 * T10AQ — T300 resume s9501: Push-on Exhaustion-6 death page; quiet-road CAST; statue gate.
 * Evidence: 2026-10-29T06-14-00-282Z_cursed-keep_chilled-gm_s9501 T155–T157.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  chipWouldMarch,
  commitTravel,
  journeyPads,
  roadDeathBookProse,
  travelBeatFact,
  travelEngineLines,
  withMarchWarnPads,
  worldClock,
  writerEngineResult,
} from './travelJourney';
import { presentNpcNames } from './npcRelationships';
import { presentNpcRecords, npcNamesAt } from './npcRecords';
import { peopleHere } from './scenePresence';
import { checkActionFollowed } from './turnCheck';
import { resolveTypedFreeText } from './typedFreeText';
import { applyPlayPhaseAfterHp } from './playPhase';
import { resolveDeathSaveTurn } from './tabletop/roundFight';
import { UNDERWAY_HERE } from './locationName';
import type { GameState, NpcMemory } from './types';

function keep(seed: string, over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    seed,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    turn: 9,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
    ...over,
  } as GameState;
}

function quietTrip(seed: string, roadHours: number, over: Partial<GameState> = {}): GameState {
  for (let i = 0; i < 200; i++) {
    const t = commitTravel(keep(`${seed}-${i}`, over), 'Travel toward Blackspine Treeline');
    const j = t.state.journey;
    if (!j || j.encounter || j.legsDone >= j.legsTotal - 1) continue;
    return { ...t.state, roadDay: { since: worldClock(t.state), hours: roadHours } };
  }
  throw new Error('no quiet trip');
}

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: ['met on the road'],
    lastSeenTurn: 80,
    met: true,
    present: true,
    introSpoken: true,
    location: UNDERWAY_HERE,
    ...over,
  } as NpcMemory;
}

describe('T10AQ (a) Exhaustion-6 Push-on death owns the book page', () => {
  it('T10PUSH — Exhaustion 5 forces camp; push-on cannot reach death', () => {
    const worn = quietTrip('aq-die-force', 10, {
      character: { ...keep('x').character, exhaustion: 5 },
    });
    expect(journeyPads(worn)).toEqual(['Make camp']);
    const out = commitTravel(worn, 'Push on');
    expect(out.state.deathSaves?.dead).not.toBe(true);
    expect(out.state.character.exhaustion ?? 0).toBeLessThan(6);
    expect(out.event === 'camp' || (out.facts ?? []).some((f) => /camp/i.test(f))).toBe(true);
  });

  it('Push-on chip does not open an NPC reaction Speech event', () => {
    const s = quietTrip('aq-chip', 10, {
      character: { ...keep('x').character, exhaustion: 2 },
      sceneFacts: {
        present: ['Merrit Pike', 'thugs', 'the thugs'],
        crowd: 'present',
        crowdCount: 3,
        noise: 'quiet',
        props: [],
        lastBeat: '',
        updatedTurn: 10,
      },
      npcMemories: [
        mem({ npcName: 'Merrit Pike' }),
        mem({ npcName: 'thugs' }),
        mem({ npcName: 'the thugs' }),
      ],
    });
    const push = journeyPads(s).find((c) => /Push on/i.test(c))!;
    const typed = resolveTypedFreeText(s, push);
    expect(typed.engineResult).not.toMatch(/Speech event|NPC reaction slot/i);
    expect(typed.engineResult).toBe('');
  });
});

describe('T10AQ (b) SRD 5.2.1 Extended Travel + Exhaustion', () => {
  it('T10PUSH triad at low exhaustion; force camp at Exhaustion 5', () => {
    // SRD 5.2.1 Extended Travel: CON save each hour past 8; Exhaustion 6 = death.
    // T10PUSH never offers a path to 6 through this choice — auto-camp at 5.
    const at2 = quietTrip('aq-ex2', 10, { character: { ...keep('x').character, exhaustion: 2 } });
    expect(journeyPads(at2)).toEqual(['Push on', 'Turn back', 'Make camp']);
    const at5 = quietTrip('aq-ex5', 10, { character: { ...keep('x').character, exhaustion: 5 } });
    expect(journeyPads(at5)).toEqual(['Make camp']);
  });
});

describe('T10RC4 (7a) march warn on every spend-day move; camp default at high exhaustion', () => {
  it('T10PUSH — spent day offers triad; Exhaustion 5 forces Make camp only', () => {
    for (const ex of [3, 4]) {
      const s = quietTrip(`rc4-ex${ex}`, 10, { character: { ...keep('x').character, exhaustion: ex } });
      expect(journeyPads(s)).toEqual(['Push on', 'Turn back', 'Make camp']);
    }
    const s5 = quietTrip('rc4-ex5', 10, { character: { ...keep('x').character, exhaustion: 5 } });
    expect(journeyPads(s5)).toEqual(['Make camp']);
  });

  it('Travel toward while spent still carries march warn via withMarchWarnPads', () => {
    const s = quietTrip('rc4-toward', 10, { character: { ...keep('x').character, exhaustion: 3 } });
    const labeled = withMarchWarnPads(s, ['Travel toward Keep Gate', 'Look around']);
    const travel = labeled.find((c) => /^Travel toward Keep Gate/i.test(c))!;
    expect(travel).toMatch(/but each failed save wears you down more/);
    expect(labeled[0]).toBe('Make camp');
    expect(chipWouldMarch(s, travel)).toBe(true);
    // T10PUSH — Push on at Exhaustion 5 camps; never death through this choice.
    const worn = quietTrip('rc4-die-force', 10, { character: { ...keep('x').character, exhaustion: 5 } });
    const out = commitTravel(worn, 'Push on');
    expect(out.state.deathSaves?.dead).not.toBe(true);
    expect(out.state.character.exhaustion ?? 0).toBeLessThan(6);
  });
});

describe('T10AQ (d) quiet road does not seat past road CAST', () => {
  it('Merrit Pike / thugs stamped on UNDERWAY do not appear on a quiet stretch', () => {
    // T10AQ-fix — commitTravel clears stale sceneFacts.present / present:true on quiet UNDERWAY.
    const s = quietTrip('aq-cast', 11, {
      sceneFacts: {
        present: ['Merrit Pike', 'thugs', 'the thugs'],
        crowd: 'present',
        crowdCount: 3,
        noise: 'quiet',
        props: [],
        lastBeat: 'street empty; afternoon; outdoors',
        updatedTurn: 11,
      },
      npcMemories: [
        mem({ npcName: 'Merrit Pike' }),
        mem({ npcName: 'thugs' }),
        mem({ npcName: 'the thugs' }),
      ],
    });
    expect(s.journey?.encounter ?? null).toBeNull();
    expect(s.sceneFacts?.present ?? []).toEqual([]);
    expect(npcNamesAt(s, UNDERWAY_HERE)).toEqual([]);
    expect(presentNpcRecords(s).map((m) => m.npcName)).not.toContain('Merrit Pike');
    expect(presentNpcNames(s)).not.toContain('Merrit Pike');
    expect(peopleHere(s).some((n) => /Merrit|thugs/i.test(n))).toBe(false);
  });

  it('T10AQ-fix: intentional present ally on the road still Medicine-stabilises (SRD)', () => {
    // SRD 5.2.1 Stabilizing a Creature: DC 10 Wisdom (Medicine). Write-path clear must not
    // starve a sceneFacts.present ally set after the quiet stretch (dying beat).
    const base = quietTrip('aq-med', 8);
    const here = {
      ...base,
      character: { ...base.character, hp: 0, maxHp: 12, conditions: ['Unconscious'] },
      deathSaves: { successes: 0, failures: 0 },
      sceneFacts: {
        ...(base.sceneFacts ?? {
          crowd: 'none' as const,
          noise: 'quiet' as const,
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: base.turn ?? 0,
        }),
        present: ['Wenna Brack'],
        crowd: 'present' as const,
        crowdCount: 1,
      },
      npcMemories: [
        ...(base.npcMemories ?? []),
        {
          npcId: 'person:wenna-brack',
          npcName: 'Wenna Brack',
          disposition: 'friendly' as const,
          facts: [],
          lastSeenTurn: (base.turn ?? 0) - 1,
          present: true,
          location: UNDERWAY_HERE,
        },
      ],
    };
    const ok = resolveDeathSaveTurn(here, () => 0.5, 'Ask Wenna Brack to stabilise you')!;
    expect(ok.receipts.some((r) => r.includes('DC 10') && r.includes('success'))).toBe(true);
    expect(ok.state.character.hp).toBe(1);
  });
});

describe('T10AQ (e) statue/squirrel mime is not ignored-action', () => {
  const act =
    'I suddenly stop and pretend to be a statue, staring intensely at a squirrel until it moves.';
  const prose =
    'Jax froze all at once and held still like a statue, staring hard at a squirrel until it twitched and shot up a trunk.';

  it('gate does not P0 nobody-answers when the prose shows the mime', () => {
    const s = quietTrip('aq-statue', 11, {
      sceneFacts: {
        present: ['Merrit Pike', 'thugs'],
        crowd: 'present',
        crowdCount: 2,
        noise: 'quiet',
        props: [],
        lastBeat: '',
        updatedTurn: 11,
      },
      npcMemories: [mem({ npcName: 'Merrit Pike' }), mem({ npcName: 'thugs' })],
    });
    const check = checkActionFollowed(s, s, act, prose);
    expect(check.p0.map((f) => f.kind)).not.toContain('ignored-action');
  });

  it('variation: freeze like a statue on an empty road', () => {
    const s = quietTrip('aq-statue2', 11, {
      sceneFacts: {
        present: [],
        crowd: 'none',
        crowdCount: 0,
        noise: 'quiet',
        props: [],
        lastBeat: '',
        updatedTurn: 11,
      },
    });
    const check = checkActionFollowed(
      s,
      s,
      'I freeze like a statue and stare at a squirrel until it moves.',
      'Jax froze like a statue. The squirrel shot up a trunk.'
    );
    expect(check.p0.map((f) => f.kind)).not.toContain('ignored-action');
  });
});
