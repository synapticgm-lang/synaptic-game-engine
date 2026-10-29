/**
 * T10AQ — T300 resume s9501: Push-on Exhaustion-6 death page; quiet-road CAST; statue gate.
 * Evidence: 2026-10-29T06-14-00-282Z_cursed-keep_chilled-gm_s9501 T155–T157.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  commitTravel,
  journeyPads,
  roadDeathBookProse,
  travelBeatFact,
  travelEngineLines,
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
  it('travelEngineLines carries You are dead into ENGINE RESULT', () => {
    let died: ReturnType<typeof commitTravel> | null = null;
    for (let i = 0; i < 80 && !died; i++) {
      const worn = quietTrip(`aq-die-${i}`, 10, {
        character: { ...keep('x').character, exhaustion: 5 },
      });
      const push = journeyPads(worn)[1]!;
      expect(push).toMatch(/one failed save now kills you/);
      const out = commitTravel(worn, push);
      if (out.state.deathSaves?.dead) died = out;
    }
    expect(died).not.toBeNull();
    expect(travelEngineLines(died!).some((l) => /\bYou are dead\./i.test(l))).toBe(true);
    expect(travelBeatFact(died!.state)).toMatch(/You are dead\./);
    const engine = travelEngineLines(died!).join(' ');
    const page = writerEngineResult(engine, 'Jax');
    expect(page).toMatch(/You are dead\./);
    expect(page).toMatch(/forced march wore you down/i);
    expect(page).not.toMatch(/Merrit|said nothing/i);
    const sealed = roadDeathBookProse(died!.state);
    expect(sealed).toMatch(/You are dead\./);
    const phased = applyPlayPhaseAfterHp(died!.state, died!.state.character.hp ?? 0, (died!.state.turn ?? 0) + 1);
    expect(phased.playPhase).toBe('ended');
  });

  it('Push-on chip does not open an NPC reaction Speech event', () => {
    const s = quietTrip('aq-chip', 10, {
      character: { ...keep('x').character, exhaustion: 5 },
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
  it('lethal chip only at Exhaustion 5; death at level 6', () => {
    // SRD 5.2.1 Extended Travel (Gameplay Toolbox): CON save each hour past 8, DC 10 + hours past 8;
    // fail → 1 Exhaustion. Exhaustion level 6 = death. d20 tests −2 × level.
    const at2 = quietTrip('aq-ex2', 10, { character: { ...keep('x').character, exhaustion: 2 } });
    expect(journeyPads(at2)[1]).toMatch(/each failed save wears you down more/);
    const at5 = quietTrip('aq-ex5', 10, { character: { ...keep('x').character, exhaustion: 5 } });
    expect(journeyPads(at5)[1]).toMatch(/one failed save now kills you/);
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
