/**
 * T10RC8 — absent speakers: seat-only attribution, catalog role labels, ghost Talk chip,
 * arrival figure = one seated person, final-page drop after append/seal.
 */
import { describe, expect, it } from 'vitest';
import type { ActiveEncounter, GameState, NpcMemory, RoadEncounter } from './types';
import { chipProblem } from './chipLegality';
import { peopleHere } from './scenePresence';
import { checkPlayCrimes } from './turnCheck';
import { ensureSpokenAnswer } from './spokenAnswer';
import { TALKING_RANGE_FT } from './hereSpot';
import {
  dropUnseatedSpeakerLines,
  runWriterTurn,
  sealPostWriterProse,
  writerDraftProblems,
  type DraftCheck,
} from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { journeyPads } from './travelJourney';
import { isEncounterRoleLabel, proseEncounterLabel } from './proseItemName';
import { autoFightSpawnPreface, pendingFoeSign } from './combatAuthority';
import { compileRefEnum } from './completedEventPacket';

function emptySceneFacts(turn: number) {
  return {
    crowd: 'none' as const,
    noise: 'unknown' as const,
    present: [] as string[],
    props: [] as string[],
    lastBeat: '',
    updatedTurn: turn,
    crowdCount: 0,
  };
}

function mem(over: Partial<NpcMemory>): NpcMemory {
  return {
    npcId: over.npcId ?? `npc:${(over.npcName ?? 'X').toLowerCase().replace(/\s+/g, '-')}`,
    npcName: over.npcName ?? 'X',
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    ...over,
  };
}

function base(over: Partial<GameState> = {}): GameState {
  return {
    character: { name: 'Jax', level: 1, xp: 0, hp: 20, maxHp: 20, attributes: {} },
    log: [],
    inventory: [],
    quests: [],
    places: [],
    npcMemories: [],
    turn: 174,
    currentLocation: 'Salt Road Waystation',
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    sceneFacts: emptySceneFacts(174),
    ...over,
  } as GameState;
}

describe('T10RC8 T174 Vessa fight-end attribution dropped when unseated', () => {
  it('final-page drop / seal removes Vessa told… when presence none', () => {
    const s = base({
      turn: 174,
      sceneFacts: emptySceneFacts(174),
      npcMemories: [
        mem({ npcName: 'Vessa', location: 'Harbor Fence', present: false }),
        mem({ npcName: 'Dunn Rudd', location: 'Consul Caravan Camp', present: false }),
      ],
    });
    const page =
      "Jax kept swinging at the Blade, and after three rounds the big man dropped to the floorboards of Salt Road Waystation and stopped moving. The room held its breath, and in the quiet Jax found Knuckle Wraps lying by the Blade's open fingers and Focus Charm on its cord nearby. Vessa told Jax that Case the Caravan will not wait and that Road Claim Bravo is closing in fast.";
    expect(checkPlayCrimes(s, s, 'Press the attack', page).p0.some((f) => f.kind === 'absent-speaker' && /Vessa/.test(f.detail))).toBe(true);
    const dropped = dropUnseatedSpeakerLines(s, page);
    expect(dropped).not.toMatch(/\bVessa\b/);
    expect(dropped).toMatch(/dropped to the floorboards/);
    const sealed = sealPostWriterProse(s, page, 'Press the attack');
    expect(sealed.prose).not.toMatch(/\bVessa\b/);
  });

  it('rewrite that still invents Absent speaker is stripped on runWriterTurn accept', () => {
    const s = base({
      turn: 174,
      sceneFacts: emptySceneFacts(174),
      npcMemories: [mem({ npcName: 'Vessa', location: 'Harbor Fence', present: false })],
    });
    const engineFact = 'Fight: VICTORY vs Consul Household Blade. Must narrate: Press the attack.';
    const check: DraftCheck = {
      state: s,
      playerInput: 'Press the attack',
      intent: parsePlayerIntent('Press the attack', s),
      engineFact,
      previousGm: '',
    };
    const raw =
      'Jax kept swinging until the big man dropped hard against the boards of Salt Road Waystation and did not rise again. The room held its breath. From the shadows beyond the bar, Vessa spoke, telling Jax that Case the Caravan will not wait.';
    expect(writerDraftProblems(raw, check).some((p) => p.startsWith('Absent speaker:'))).toBe(true);
    const out = runWriterTurn({
      firstRaw: raw,
      packet: { engineResult: engineFact, playerAction: 'Press the attack' } as never,
      check,
    });
    expect(out.prose).not.toMatch(/\bVessa\b/);
    expect(writerDraftProblems(out.prose, check).some((p) => p.startsWith('Absent speaker:'))).toBe(false);
  });
});

describe('T10RC8 catalog role label is not a character speaker name', () => {
  it('Consul Household Blade uses proseEncounterLabel / creature ref, not person said', () => {
    expect(isEncounterRoleLabel('Consul Household Blade')).toBe(true);
    expect(isEncounterRoleLabel('Col Tew')).toBe(false);
    const label = proseEncounterLabel('Consul Household Blade');
    expect(label.notCharacter).toBe(true);
    expect(label.label).not.toBe('Consul Household Blade');
    expect(label.label.toLowerCase()).toMatch(/blade/);

    const preface = autoFightSpawnPreface('Consul Household Blade', 'Salt Road Waystation', undefined, 'indoor');
    expect(preface).not.toMatch(/^Consul Household Blade\b/);

    const foe: ActiveEncounter = {
      name: 'Consul Household Blade',
      level: 1,
      hp: 12,
      maxHp: 12,
      armorClass: 12,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: 0,
      goldReward: 0,
    };
    const s = base({ activeEncounter: foe });
    const sign = pendingFoeSign({ name: 'Consul Household Blade', threatTier: 'elite' }, s);
    expect(sign).toMatch(/not a character name — common noun/i);
    expect(sign).not.toMatch(/^Consul Household Blade,/);

    const refs = compileRefEnum(s);
    const enc = refs.find((r) => r.id.startsWith('encounter:'));
    expect(enc).toBeTruthy();
    expect(enc!.klass).toBe('creature');
    expect(enc!.display).not.toBe('Consul Household Blade');
  });
});

describe('T10RC8 T177 ghost Talk chip when meeting is out of range / empty text', () => {
  it('Talk your way past the thugs is not offered and is a ghost-chip at 120 ft', () => {
    const enc: RoadEncounter = {
      kind: 'thugs',
      level: 1,
      stretch: 1,
      dangerous: false,
      count: 2,
      distanceFt: 120,
      want: 'to know who sent you',
    };
    const s = base({
      turn: 177,
      currentLocation: 'On the road between places',
      sceneFacts: {
        ...emptySceneFacts(177),
        lastBeat: 'street empty; afternoon; outdoors',
      },
      journey: {
        from: 'Salt Road Waystation',
        to: 'Safehouse Alley',
        ground: 'back streets',
        terrain: 'streets',
        legsTotal: 2,
        legsDone: 1,
        hoursPerLeg: 0.5,
        startedTurn: 175,
        encounter: enc,
      },
    }) as GameState;
    expect(enc.distanceFt!).toBeGreaterThan(TALKING_RANGE_FT);
    expect(peopleHere(s)).toEqual([]);
    const pads = journeyPads(s);
    expect(pads.some((p) => /^Talk your way past the thugs/.test(p))).toBe(false);
    expect(pads).toContain('Face the thugs');
    const emptyProse =
      'Jax stood still on the back streets. The only reply was the empty rattle of the street, because nobody was standing there to hear them at all.';
    expect(
      chipProblem(s, 'Talk your way past the thugs', emptyProse)?.kind,
    ).toBe('ghost-chip');
  });
});

describe('T10RC8 T35/T36 arrival figure links to the one seated speaker', () => {
  it('sole seat binds tall figure to Nell; unseated Nell quote is dropped on seal', () => {
    const seated = base({
      turn: 35,
      currentLocation: 'Cathedral Close',
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      sceneFacts: {
        ...emptySceneFacts(35),
        crowd: 'sparse',
        present: ['Nell Rudd'],
        crowdCount: 1,
      },
      npcMemories: [
        mem({
          npcName: 'Nell Rudd',
          location: 'Cathedral Close',
          present: true,
          need: 'someone standing up for the people who do the hard work',
          aliases: ['Nell'],
        }),
      ],
      journey: null,
    });
    expect(peopleHere(seated).some((n) => /Nell/.test(n))).toBe(true);
    const draft =
      'Jax came up the last stretch of road and stood in Cathedral Close with the afternoon light going long across the stones. Across Cathedral Close a tall figure in chanted robes waited by the door of Cathedral Undercroft, and he had not taken his eyes off Jax since they cleared the gate.';
    const out = ensureSpokenAnswer(
      draft,
      seated,
      'Talk to Nell Rudd',
    );
    expect(out.prose).toMatch(/Nell Rudd/);
    expect(out.prose).not.toMatch(/\btall figure\b/i);

    const empty = base({
      turn: 36,
      currentLocation: 'Cathedral Close',
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      sceneFacts: emptySceneFacts(36),
      npcMemories: [
        mem({ npcName: 'High Chanter Orel Vane', location: 'Cathedral Close', present: false }),
        mem({ npcName: 'Nell Rudd', location: 'Cathedral Close', present: false }),
      ],
      journey: null,
    });
    const withOrel =
      'Jax hauled back hard on the collar and dragged them both into the deep shade under the mule\'s belly. A spoked wheel of pale stone stood at the far corner of Cathedral Close, past where High Chanter Orel Vane kept his quiet ground. High Chanter Orel Vane said, "There is a rite to finish, and I will see it done"';
    const sealed = sealPostWriterProse(empty, withOrel, 'I glare at the robed figure');
    expect(sealed.prose).not.toMatch(/High Chanter Orel Vane said/i);
    expect(checkPlayCrimes(empty, empty, 'Wait', sealed.prose).p0.some((f) => f.kind === 'absent-speaker')).toBe(false);
  });
});
