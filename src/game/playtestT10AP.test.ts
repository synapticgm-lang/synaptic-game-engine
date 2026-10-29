/**
 * T10AP — after victory/escape the foe leaves talkable presence; Face opens a real blow;
 * absent typed names (Maud) do not bind to the nearest corpse; ambient shout skips motive dump.
 * Evidence: LitRPG s9701 T28–T31, T54–T62.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { tickEncounterTerminal } from './encounterTerminalFsm';
import { resolveEngineFight } from './engineFight';
import { collectSceneAffordances } from './sceneAffordances';
import { chipProblem, legalChips } from './chipLegality';
import { peopleHere } from './scenePresence';
import { ensureSpokenAnswer } from './spokenAnswer';
import { emptySceneFacts } from './sceneFacts';
import { isLastKillTalkPad } from './combatAuthority';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    introSpoken: true,
    ...over,
  } as NpcMemory;
}

function litrpgLowmarket(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character, name: 'Jax', hp: 20, maxHp: 20 },
    turn: 55,
    currentLocation: 'Lowmarket',
    sceneFacts: {
      ...emptySceneFacts(55),
      crowd: 'present',
      noise: 'loud',
      present: ['Integration Rat Pack'],
      props: ['thread'],
      lastBeat: 'fight',
      crowdCount: 1,
    },
    npcMemories: [
      mem({
        npcName: 'Integration Rat Pack',
        roleHint: 'informant',
        need: 'a buyer who pays',
        goal: { motivation: 'Knowledge', target: 'a secret worth selling' },
        location: 'Lowmarket',
      }),
    ],
    activeEncounter: {
      name: 'Integration Rat Pack',
      hp: 8,
      maxHp: 8,
      phase: 'engaged',
      encounterId: 'enc-rats',
    },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

function banditRuin(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character, name: 'Jax', hp: 20, maxHp: 20 },
    turn: 30,
    currentLocation: 'the stone outline of a building that is gone',
    sceneFacts: {
      ...emptySceneFacts(30),
      crowd: 'present',
      noise: 'quiet',
      present: ['Wardline Bandit'],
      props: [],
      lastBeat: 'fight',
      crowdCount: 1,
    },
    npcMemories: [
      mem({
        npcName: 'Wardline Bandit',
        roleHint: 'informant',
        need: 'coin',
        goal: { motivation: 'Knowledge', target: 'a secret worth selling' },
        location: 'the stone outline of a building that is gone',
      }),
    ],
    activeEncounter: {
      name: 'Wardline Bandit',
      hp: 12,
      maxHp: 12,
      phase: 'engaged',
      encounterId: 'enc-bandit',
    },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

describe('T10AP encounter leave + Face blow + absent name', () => {
  it('victory: foe leaves talkable set; Read/Analyze/Talk/Ask are illegal; lastKill remains for body', () => {
    const won = tickEncounterTerminal(litrpgLowmarket(), 'Press the attack', { enemyDead: true }).state;
    expect(won.activeEncounter).toBeNull();
    expect(won.sceneFacts?.lastKill?.name).toBe('Integration Rat Pack');
    expect(won.sceneFacts?.present ?? []).not.toContain('Integration Rat Pack');
    expect(won.npcMemories?.find((m) => m.npcName === 'Integration Rat Pack')?.shouldExit).toBe(true);
    expect(peopleHere(won).some((p) => /Integration Rat Pack/i.test(p))).toBe(false);
    const labels = collectSceneAffordances(won).map((a) => a.label);
    expect(labels.some((l) => /Talk to Integration Rat Pack/i.test(l))).toBe(false);
    expect(labels.some((l) => /Ask Integration Rat Pack/i.test(l))).toBe(false);
    expect(labels.some((l) => /Read Integration Rat Pack/i.test(l))).toBe(false);
    expect(labels.some((l) => /Analyze Integration Rat Pack/i.test(l))).toBe(false);
    expect(isLastKillTalkPad('Talk to Integration Rat Pack', won.sceneFacts?.lastKill)).toBe(true);
    expect(isLastKillTalkPad('Read Integration Rat Pack', won.sceneFacts?.lastKill)).toBe(true);
    expect(isLastKillTalkPad('Analyze Integration Rat Pack', won.sceneFacts?.lastKill)).toBe(true);
    expect(chipProblem(won, 'Talk to Integration Rat Pack')?.kind).toBe('impossible-chip');
    expect(
      legalChips(won, [
        'Talk to Integration Rat Pack',
        'Ask Integration Rat Pack about a secret worth selling',
        'Read Integration Rat Pack',
        'Analyze Integration Rat Pack',
        'Travel toward West Wall',
      ]),
    ).toEqual(['Travel toward West Wall']);
  });

  it('escape: foe leaves talkable set with no lastKill (Wardline Bandit ghost chips)', () => {
    const fled = tickEncounterTerminal(banditRuin(), 'Try to flee', { fleeSucceeded: true }).state;
    expect(fled.activeEncounter).toBeNull();
    expect(fled.sceneFacts?.lastKill).toBeUndefined();
    expect(fled.sceneFacts?.present ?? []).not.toContain('Wardline Bandit');
    expect(fled.npcMemories?.find((m) => m.npcName === 'Wardline Bandit')?.shouldExit).toBe(true);
    expect(peopleHere(fled).some((p) => /Wardline Bandit/i.test(p))).toBe(false);
    const labels = collectSceneAffordances(fled).map((a) => a.label);
    expect(labels.some((l) => /Wardline Bandit/i.test(l))).toBe(false);
    expect(chipProblem(fled, 'Ask Wardline Bandit about a secret worth selling')?.kind).toBe('ghost-chip');
  });

  it('Face Wardline Bandit resolves an engine fight (blow / exchange), not narrate-only', () => {
    const fight = resolveEngineFight(banditRuin(), 'Face Wardline Bandit');
    expect(fight).not.toBeNull();
    expect(fight!.facts).toMatch(/ENGINE OUTCOME|Fight:|VICTORY|forces the fight|escaped|down/i);
    expect(fight!.facts).not.toMatch(/^Must narrate:\s*Face Wardline Bandit/i);
    expect(fight!.receipts.some((r) => /Fight:|Encounter|HP|damage|VICTORY|forces the fight|escaped/i.test(r))).toBe(
      true,
    );
  });

  it('typed ask Maud with only a corpse here does not bind to the rat pack (nobody-here)', () => {
    const after = tickEncounterTerminal(litrpgLowmarket(), 'Press the attack', { enemyDead: true }).state;
    const line =
      'I wipe the rat blood off my palms onto my trousers and ask Maud if she saw which way they came from.';
    const out = ensureSpokenAnswer(
      'Jax wiped the rat blood off their palms onto their trousers.',
      after,
      line,
    );
    expect(out.answer.status).toBe('nobody-here');
    expect(out.prose).not.toMatch(/Integration Rat Pack was already down and said nothing/i);
  });

  it('ambient shout that never names the live foe does not dump a first-person motive quote', () => {
    const s = banditRuin({
      npcMemories: [
        mem({
          npcName: 'Wardline Bandit',
          roleHint: 'informant',
          need: 'a tip for coin',
          location: 'the stone outline of a building that is gone',
          sheet: {
            job: 'bandit',
            motive: 'Stay free of the law',
            fear: 'Capture',
            speech: 'evasive',
            secret: '',
            place: 'road',
          },
        }),
      ],
    });
    const player =
      'I slam the empty box shut and point at the ghostly outline of the ruins. Hey, look closely at that space where the walls used to be, something\'s not right here.';
    const out = ensureSpokenAnswer(
      'Jax slammed the empty box shut, and the lid clapped loud in the bare stone room.',
      s,
      player,
    );
    expect(out.prose).not.toMatch(/nobody remembered I passed this way/i);
    expect(out.prose).not.toMatch(/It would be better for both of us/i);
  });

  it('tabletop variation: victory clears talk pads for a different bible foe', () => {
    const s = createInitialState(undefined, 'dnd') as GameState;
    const state = {
      ...s,
      engineMode: 'dnd' as const,
      campaignBibleId: 'cursed-keep',
      character: { ...s.character, name: 'Jax', hp: 12, maxHp: 12 },
      turn: 20,
      currentLocation: 'Greyhollow mill lane',
      sceneFacts: {
        ...emptySceneFacts(20),
        crowd: 'present' as const,
        noise: 'quiet' as const,
        present: ['Cave Rat'],
        props: [],
        lastBeat: 'fight',
        crowdCount: 1,
      },
      npcMemories: [mem({ npcName: 'Cave Rat', location: 'Greyhollow mill lane' })],
      activeEncounter: {
        name: 'Cave Rat',
        hp: 4,
        maxHp: 4,
        phase: 'engaged' as const,
        encounterId: 'enc-rat',
      },
      openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    } as unknown as GameState;
    const won = tickEncounterTerminal(state, 'Attack', { enemyDead: true }).state;
    expect(won.npcMemories?.[0]?.shouldExit).toBe(true);
    expect(collectSceneAffordances(won).some((a) => /Cave Rat/i.test(a.label))).toBe(false);
  });
});
