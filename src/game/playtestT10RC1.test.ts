/**
 * T10RC1 — speech + presence + threat outcome.
 * Rebuilds T300f evidence shapes with real engine owners (no mocks).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory, TravelJourney } from './types';
import { ensureSpokenAnswer } from './spokenAnswer';
import { peopleHere } from './chipLegality';
import { speechAddressCue } from './writerCueLines';
import { isOutOfTalkingRange, TALKING_RANGE_FT } from './hereSpot';
import { resolveTypedFreeText } from './typedFreeText';
import { checkPlayCrimes } from './turnCheck';
import { lastResortStoryBody } from './completedEventPacket';
import { emptySceneFacts } from './sceneFacts';
import { ROLE_AGENDA_TEMPLATES } from './npcMemory';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc:${over.npcName}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    ...over,
  } as NpcMemory;
}

function rpgHarbor(over: Partial<GameState> = {}): GameState {
  return {
    ...(createInitialState(undefined, 'rpg') as GameState),
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...(createInitialState(undefined, 'rpg') as GameState).character, name: 'Jax' },
    turn: 283,
    currentLocation: 'Harbor Fence',
    sceneFacts: {
      ...emptySceneFacts(),
      present: ['Piers Thatch'],
      crowd: 'sparse',
      crowdCount: 1,
      updatedTurn: 283,
    },
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

function roadAt(
  distanceFt: number,
  name: string,
  kind: NonNullable<TravelJourney['encounter']>['kind'] = 'meeting',
): GameState {
  const journey: TravelJourney = {
    from: 'Lowmarket',
    to: 'West Wall',
    legsDone: 1,
    legsTotal: 3,
    ground: 'Forest path',
    terrain: 'forest',
    hoursPerLeg: 2,
    startedTurn: 1,
    encounter: {
      kind,
      level: 1,
      stretch: 1,
      dangerous: false,
      want: 'word of someone gone missing',
      distanceFt,
      name,
    },
  };
  return {
    ...(createInitialState(undefined, 'litrpg') as GameState),
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...(createInitialState(undefined, 'litrpg') as GameState).character, name: 'Jax' },
    turn: 40,
    currentLocation: 'On the road between places',
    journey,
    sceneFacts: {
      ...emptySceneFacts(),
      crowd: 'none',
      crowdCount: 0,
      present: [],
      updatedTurn: 40,
    },
    npcMemories: [mem({ npcName: name, location: 'On the road between places', present: false })],
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
  } as GameState;
}

describe('T10RC1 P1 — no telegram agenda quotes', () => {
  it('T283 Harbor Fence quest-patron: silent draft gets grammatical content, not I want…', () => {
    const t = ROLE_AGENDA_TEMPLATES['quest-patron'];
    const state = rpgHarbor({
      npcMemories: [
        mem({
          npcName: 'Piers Thatch',
          location: 'Harbor Fence',
          roleHint: 'quest-patron',
          need: t.need,
          goal: { motivation: t.motivation, target: t.target },
          offer: t.offer,
        }),
      ],
    });
    const out = ensureSpokenAnswer(
      'The fence was quiet. Piers Thatch said nothing.',
      state,
      'I look at Piers Thatch. "What do you actually want from me?"',
    );
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I want (?:the )?job they need done/i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I need /i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I can offer /i);
    expect(out.prose).toMatch(/Piers Thatch/i);
    expect(out.prose).toMatch(/pressed for|made clear they needed|held out|Piers Thatch said,\s*["\u201c].{12,}/i);
  });

  it('T177 Ysolde guide + T284 Oda gatekeeper: agenda nouns stay indirect', () => {
    const guide = ROLE_AGENDA_TEMPLATES.guide;
    const gate = ROLE_AGENDA_TEMPLATES.gatekeeper;
    const ysolde = rpgHarbor({
      turn: 177,
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Ysolde Sallow'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 177,
      },
      npcMemories: [
        mem({
          npcName: 'Ysolde Sallow',
          location: 'Harbor Fence',
          roleHint: 'guide',
          need: guide.need,
          goal: { motivation: guide.motivation, target: guide.target },
          offer: guide.offer,
        }),
      ],
    });
    const y = ensureSpokenAnswer(
      'Ysolde Sallow said nothing.',
      ysolde,
      'I look at Ysolde Sallow. "What do you want?"',
    );
    expect(y.prose).not.toMatch(/said,\s*["\u201c]I want (?:the )?next safe door/i);
    expect(y.prose).not.toMatch(/said,\s*["\u201c]I need /i);
    // Grammatical content: indirect agenda beat OR an authored/sheet spoken sentence.
    expect(y.prose).toMatch(/pressed for|made clear they needed|held out|Ysolde Sallow said,\s*["\u201c].{12,}/i);

    const oda = rpgHarbor({
      turn: 284,
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Oda Hask'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 284,
      },
      npcMemories: [
        mem({
          npcName: 'Oda Hask',
          location: 'Harbor Fence',
          roleHint: 'gatekeeper',
          need: gate.need,
          goal: { motivation: gate.motivation, target: gate.target },
          offer: gate.offer,
        }),
      ],
    });
    const o = ensureSpokenAnswer(
      'Oda Hask said nothing.',
      oda,
      'I look at Oda Hask. "What do you want?"',
    );
    expect(o.prose).not.toMatch(/said,\s*["\u201c]I want (?:the )?gate they hold/i);
    expect(o.prose).not.toMatch(/said,\s*["\u201c]I need /i);
    expect(o.prose).toMatch(/pressed for|made clear they needed|held out|Oda Hask said,\s*["\u201c].{12,}/i);
  });

  it('litrpg refugee / informant / bounty-target: no I need / I can offer quotes', () => {
    for (const role of ['refugee', 'informant', 'bounty-target'] as const) {
      const t = ROLE_AGENDA_TEMPLATES[role];
      const state = rpgHarbor({
        engineMode: 'litrpg',
        sceneFacts: {
          ...emptySceneFacts(),
          present: ['Rosel Dunmore'],
          crowd: 'sparse',
          crowdCount: 1,
          updatedTurn: 1,
        },
        npcMemories: [
          mem({
            npcName: 'Rosel Dunmore',
            location: 'Harbor Fence',
            roleHint: role,
            need: t.need,
            goal: { motivation: t.motivation, target: t.target },
            offer: t.offer,
          }),
        ],
      });
      const out = ensureSpokenAnswer(
        'Rosel Dunmore said nothing.',
        state,
        'I look at Rosel Dunmore. "What do you actually want from me?"',
      );
      // Agenda templates → indirect; sheet motive lines that are already sentences may still quote.
      expect(out.prose).not.toMatch(/said,\s*["\u201c]I (?:need|can offer) /i);
      expect(out.prose).not.toMatch(/said,\s*["\u201c]I want (?:next safe door|job they need|gate they hold)/i);
      expect(out.prose).toMatch(/pressed for|made clear they needed|held out|said,\s*["\u201c]/i);
    }
  });

  it('engine No one present + open quest thread does not append giver speech', () => {
    const state = rpgHarbor({
      sceneFacts: {
        ...emptySceneFacts(),
        present: [],
        crowd: 'none',
        crowdCount: 0,
        updatedTurn: 96,
      },
      npcMemories: [
        mem({
          npcName: 'Orel Vane',
          location: 'Harbor Fence',
          present: false,
          need: 'a buyer who pays',
          goal: { motivation: 'Knowledge', target: 'a secret worth selling' },
        }),
      ],
      openThreads: [
        {
          id: 'quest:case',
          kind: 'quest',
          label: 'Case the Caravan',
          entityId: 'quest:case',
          placeId: null,
          lastSeenTurn: 90,
          resolution: { type: 'lead-resolved', questId: 'case', lead: 'Case the Caravan' },
        },
      ],
      quests: [
        {
          id: 'case',
          name: 'Case the Caravan',
          description: 'Case the caravan before it moves.',
          type: 'side' as const,
          status: 'active' as const,
          revealed: true,
          giver: 'Orel Vane',
          objectives: [],
        },
      ],
    });
    const draft = 'No one was there to answer. The fence held its silence.';
    const out = ensureSpokenAnswer(draft, state, 'Ask Orel Vane about the job');
    expect(out.prose).toBe(draft);
    expect(out.prose).not.toMatch(/Orel Vane (?:said|pressed|made clear)/i);
  });
});

describe('T10RC1 P2 — road distanceFt is talking range', () => {
  it(`journey named traveler at ${100} / ${120} ft: no speech slot, peopleHere empty, gate agrees`, () => {
    for (const ft of [100, 120]) {
      const s = roadAt(ft, 'Rosel Dunmore', 'traveler');
      expect(ft).toBeGreaterThan(TALKING_RANGE_FT);
      expect(isOutOfTalkingRange(s, 'Rosel Dunmore')).toBe(true);
      expect(peopleHere(s)).not.toContain('Rosel Dunmore');
      expect(peopleHere(s)).not.toContain('a traveler');
      expect(speechAddressCue('Rosel Dunmore', peopleHere(s))).toMatch(/No one present to answer/);
      const crimes = checkPlayCrimes(
        s,
        s,
        'Call out to Rosel',
        'Rosel Dunmore said, "I need shelter and food."',
      );
      expect(crimes.p0.some((f) => f.kind === 'absent-speaker')).toBe(true);
      const painted = lastResortStoryBody(
        s,
        {
          engineResult:
            'Must narrate: call out. Speech event: you address Rosel Dunmore. No one present to answer.',
          playerAction: 'Call out to Rosel Dunmore',
        } as never,
        'Call out to Rosel Dunmore',
      );
      expect(painted.prose).toMatch(/No one was there to answer/i);
      expect(painted.prose).not.toMatch(/Rosel Dunmore said,/i);
    }
  });

  it('rpg Waystation empty seats: ensureSpokenAnswer does not invent cast speech', () => {
    const state = {
      ...(createInitialState(undefined, 'rpg') as GameState),
      engineMode: 'rpg',
      turn: 236,
      currentLocation: 'Salt Road Waystation',
      sceneFacts: {
        ...emptySceneFacts(),
        present: [],
        crowd: 'none',
        crowdCount: 0,
        updatedTurn: 236,
      },
      npcMemories: [
        mem({
          npcName: 'Vessa',
          location: 'Salt Road Waystation',
          present: false,
          need: 'the next safe door',
        }),
      ],
      openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    } as GameState;
    expect(peopleHere(state)).toHaveLength(0);
    const out = ensureSpokenAnswer('No one was there to answer.', state, 'Ask Vessa what they want');
    expect(out.prose).not.toMatch(/Vessa (?:said|pressed|made clear)/i);
  });
});

describe('T10RC1 P6 — threat commits leave, no bargain slot', () => {
  it('T230 knife at 120 ft: out of range fact, no reaction slot, no cut-of-the-take', () => {
    const s = roadAt(120, 'a stranger', 'meeting');
    const line =
      'I put my knife to the stranger\'s throat and hiss, "Talk, or I start cutting. I can take a cut of the take."';
    const out = resolveTypedFreeText(s, line);
    const blob = `${out.engineResult} ${(out.facts ?? []).join(' ')}`;
    expect(blob).toMatch(/close the distance|out of (?:talking )?range|ft off/i);
    expect(blob).not.toMatch(/NPC reaction slot open/i);
    expect(blob).not.toMatch(/I can offer cut of the take/i);
  });

  it('in-range failed intimidation commits refuse+leave Must-narrate, seats then unseats', () => {
    const s = {
      ...(createInitialState(undefined, 'rpg') as GameState),
      engineMode: 'rpg',
      character: {
        ...(createInitialState(undefined, 'rpg') as GameState).character,
        name: 'Jax',
        attributes: { STR: 8, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 8 },
      },
      turn: 230,
      currentLocation: 'Harbor Fence',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Silas Thorne'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 230,
      },
      npcMemories: [
        mem({
          npcName: 'Silas Thorne',
          location: 'Harbor Fence',
          roleHint: 'bounty-target',
          need: 'a way past the hunters',
          offer: 'a cut of the take',
        }),
      ],
      openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    } as GameState;
    const line =
      'I drive the flat of my blade into Silas\'s throat. "Talk before I start cutting, Thorne."';
    const out = resolveTypedFreeText(s, line);
    const blob = `${out.engineResult} ${(out.facts ?? []).join(' ')}`;
    expect(blob).toMatch(/Must narrate:.*(?:refuses the threat and leaves|yields under the threat)/i);
    expect(blob).not.toMatch(/NPC reaction slot open/i);
    const next = out.state ?? s;
    // Failed CHA 8 intimidation should leave; success keeps them hostile+present.
    if (/refuses the threat and leaves/i.test(blob)) {
      expect((next.sceneFacts?.present ?? []).some((p) => /Silas/i.test(p))).toBe(false);
    }
  });
});
