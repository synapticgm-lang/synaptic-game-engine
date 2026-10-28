/**
 * T10AN — out of talking range: chips are Step closer (not Ask/Read), place text keeps
 * occupants, silence ≠ empty room. Evidence: LitRPG s9853 T2–T4 cellar shrine cult.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { commitTravel } from './travelJourney';
import { applyCommittedNarrative, emptySceneFacts } from './sceneFacts';
import { chipProblem, dropAbsentListenerChips, legalChips } from './chipLegality';
import { collectSceneAffordances } from './sceneAffordances';
import { engageAddressedInHereSpot, isOutOfTalkingRange, stepCloserChip } from './hereSpot';
import { presentNpcNames } from './npcRelationships';
import { peopleHere } from './scenePresence';
import { formatInfoSheet } from './infoSheet';
import { proseSaysEmpty } from './chipRules';
import { checkEmptyRoomTalk } from './turnCheck';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    ...over,
  } as NpcMemory;
}

function cellarShrine(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character, name: 'Jax' },
    turn: 3,
    currentLocation: 'the cellar shrine under Lowmarket',
    sceneFacts: {
      ...emptySceneFacts(3),
      crowd: 'present',
      noise: 'quiet',
      present: ['the denied-god cult'],
      props: ['wrapped relic'],
      lastBeat: 'people are present',
      crowdCount: 2,
    },
    npcMemories: [
      mem({
        npcName: 'the denied-god cult',
        roleHint: 'herald',
        need: 'listeners',
        goal: { motivation: 'Reputation', target: 'the news they carry' },
        location: 'the cellar shrine under Lowmarket',
        introSpoken: true,
      }),
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
      aloneArrival: false,
      card: {
        place: 'the cellar shrine under Lowmarket',
        who: 'A denied-god cult keeps the wrapped relic.',
        castNames: ['the denied-god cult'],
      },
    },
    ...over,
  } as GameState;
}

const STEP_BACK =
  'I take a slow step back toward the damp stone wall and glance at the nearest cultist. Do you have any actual answers or are we just going to stand here in the dark? I shift my weight to keep my balance on the uneven floor.';

const SILENT_PROSE =
  'The cellar shrine under Lowmarket was dark and cold, and Jax stood near the back of it. The floor sloped a little, and water had cut thin grooves in the stone. A wrapped relic sat somewhere behind the cult people, but Jax could not see it clearly. Jax took one slow step back toward the damp stone wall, then looked at the nearest person in the dark robe. Jax shifted their weight so they would not slip on the uneven floor. They asked if the cult had any real answers, or if everyone was just going to stand there in the dark. The robed people did not answer, and one of them watched Jax without moving. The water dripped somewhere in the dark behind them. The shrine stayed quiet, and no one raised a hand.';

describe('T10AN — out of talking range chips + place truth', () => {
  it('step back keeps the cult present but out of talking range (not empty occupancy)', () => {
    const commit = commitTravel(cellarShrine(), STEP_BACK);
    expect(commit.handled).toBe(true);
    expect(commit.receipt).toMatch(/out of talking range: the denied-god cult/);
    const after = commit.state;
    expect(after.sceneFacts?.hereSpot?.spot).toBe('a few steps back');
    expect(after.sceneFacts?.hereSpot?.awayFrom).toContain('the denied-god cult');
    expect(after.sceneFacts?.present).toContain('the denied-god cult');
    expect(isOutOfTalkingRange(after, 'the denied-god cult')).toBe(true);
    expect(presentNpcNames(after)).not.toContain('the denied-god cult');
    expect(peopleHere(after)).not.toContain('the denied-god cult');
    expect(formatInfoSheet(after)).toMatch(/out of talking range/);
    expect(formatInfoSheet(after)).not.toMatch(/· alone ·/);
  });

  it('silent "no one raised a hand" does not clear the cult from present while they are away', () => {
    const stepped = commitTravel(cellarShrine(), STEP_BACK).state;
    const facts = applyCommittedNarrative(stepped, SILENT_PROSE, 3, STEP_BACK);
    expect(facts.present).toContain('the denied-god cult');
    expect(facts.crowd).not.toBe('none');
    expect(facts.lastBeat).not.toMatch(/street empty/);
    expect(facts.hereSpot?.awayFrom).toContain('the denied-god cult');
  });

  it('Ask / Read cult chips are illegal; Step closer is offered instead', () => {
    const after = commitTravel(cellarShrine(), STEP_BACK).state;
    const ask = 'Ask the denied-god cult about the news they carry';
    const read = 'Read the denied-god cult';
    expect(chipProblem(after, ask)?.kind).toBe('ghost-chip');
    expect(chipProblem(after, ask)?.detail).toMatch(/out of talking range/);
    expect(chipProblem(after, read)?.kind).toBe('ghost-chip');
    const closer = stepCloserChip('the denied-god cult');
    expect(chipProblem(after, closer)).toBeNull();
    const labels = collectSceneAffordances(after).map((a) => a.label);
    expect(labels).toContain(closer);
    expect(labels.some((l) => /^Ask the denied-god cult\b/i.test(l))).toBe(false);
    expect(labels.some((l) => /^Read the denied-god cult\b/i.test(l))).toBe(false);
    const live = dropAbsentListenerChips(after, [ask, read, 'Travel toward Lowmarket'], SILENT_PROSE);
    expect(live).toContain(closer);
    expect(live).not.toContain(ask);
    expect(live).not.toContain(read);
    expect(checkEmptyRoomTalk(after, live, SILENT_PROSE).filter((f) => f.kind === 'ghost-chip')).toEqual([]);
  });

  it('individual NPC stepped away: same range rule (not LitRPG-only)', () => {
    const s = createInitialState(undefined, 'dnd') as GameState;
    const base = {
      ...s,
      engineMode: 'dnd' as const,
      campaignBibleId: 'cursed-keep',
      character: { ...s.character, name: 'Jax' },
      turn: 4,
      currentLocation: 'Greyhollow mill lane',
      sceneFacts: {
        ...emptySceneFacts(4),
        crowd: 'present',
        present: ['Nell Rudd'],
        lastBeat: 'people are present',
        crowdCount: 1,
      },
      npcMemories: [mem({ npcName: 'Nell Rudd', location: 'Greyhollow mill lane', introSpoken: true })],
      openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    } as GameState;
    const after = commitTravel(base, 'I step back from Nell and wait.').state;
    expect(after.sceneFacts?.hereSpot?.awayFrom).toContain('Nell Rudd');
    expect(after.sceneFacts?.present).toContain('Nell Rudd');
    expect(chipProblem(after, 'Talk to Nell Rudd')?.kind).toBe('ghost-chip');
    expect(legalChips(after, ['Talk to Nell Rudd', stepCloserChip('Nell Rudd')])).toEqual([
      stepCloserChip('Nell Rudd'),
    ]);
  });

  it('bare "the" in free text does not restore talking range; naming them does', () => {
    const stepped = commitTravel(cellarShrine(), 'I step back toward the wall.').state;
    expect(stepped.sceneFacts?.hereSpot?.awayFrom).toContain('the denied-god cult');
    const falseRestore = engageAddressedInHereSpot(
      stepped,
      'I look at the damp stone and the uneven floor.'
    );
    expect(falseRestore.sceneFacts?.hereSpot?.awayFrom).toContain('the denied-god cult');
    const named = engageAddressedInHereSpot(
      stepped,
      'I call out to the denied-god cult and ask again.'
    );
    expect(named.sceneFacts?.hereSpot?.awayFrom ?? []).not.toContain('the denied-god cult');
    expect(named.sceneFacts?.hereSpot?.nearby).toContain('the denied-god cult');
  });

  it('Step closer to the cult restores talking range inside the same place', () => {
    const stepped = commitTravel(cellarShrine(), 'I step back toward the wall.').state;
    const closer = stepCloserChip('the denied-god cult');
    const back = commitTravel(stepped, closer);
    expect(back.handled).toBe(true);
    expect(back.state.sceneFacts?.hereSpot?.awayFrom ?? []).not.toContain('the denied-god cult');
    expect(back.state.sceneFacts?.hereSpot?.nearby).toContain('the denied-god cult');
    expect(chipProblem(back.state, 'Ask the denied-god cult about the news they carry')).toBeNull();
  });

  it('proseSaysEmpty still sees "no one" phrases; occupancy record is the leave gate', () => {
    // Gate signal unchanged — T10AI: do not loosen empty-room detection.
    expect(proseSaysEmpty(SILENT_PROSE)).toBe(true);
  });
});
