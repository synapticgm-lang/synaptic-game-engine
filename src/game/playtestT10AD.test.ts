/**
 * T10AD — tabletop Keep Gate: typed whisper/want to a present steward must land a
 * contentful NPC reply (motive / ledger need); pad must keep Say/Do free-input
 * (not Travel-only). Evidence: cursed-keep s8601 T6–T10 / round 9g.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { ensureSpokenAnswer } from './spokenAnswer';
import { checkActionFollowed } from './turnCheck';
import { compileChoices } from './choiceCompiler';
import { FREE_INPUT_DO, FREE_INPUT_SAY, isFreeInputChip } from './sceneAffordances';
import { emptySceneFacts } from './sceneFacts';
import { normalizeCommittedProse, type DraftCheck } from './writerTurn';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `town-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    ...over,
  } as NpcMemory;
}

function keepGate(over: Partial<GameState> = {}): GameState {
  const steward = mem({
    npcName: 'the steward',
    npcId: 'town-the-steward',
    location: 'Keep Gate',
    roleHint: 'refugee',
    need: 'a safe place to rest',
    goal: { motivation: 'Protection', target: 'who sent you through the oak' },
    introSpoken: true,
  });
  return {
    ...(createInitialState(undefined, 'dnd') as GameState),
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    character: {
      name: 'Jax',
      hp: 12,
      maxHp: 12,
      level: 1,
      xp: 0,
      attributes: { STR: 17, DEX: 13, CON: 15, INT: 8, WIS: 12, CHA: 10 },
      srd: {
        speciesId: 'human',
        classId: 'fighter',
        backgroundId: 'soldier',
        skillProfs: [],
        expertise: [],
      },
    },
    turn: 7,
    currentLocation: 'Keep Gate',
    sceneFacts: {
      ...emptySceneFacts(),
      crowd: 'present',
      noise: 'quiet',
      present: ['the steward'],
      props: [],
      lastBeat: 'people are present; outdoors',
      updatedTurn: 7,
      crowdCount: 2,
    },
    npcMemories: [steward],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    arcDirector: {
      activeBeatId: 'ck-gate-ask',
    },
    ...over,
  } as GameState;
}

function checkOf(state: GameState, playerInput: string, engineFact: string): DraftCheck {
  return {
    state,
    playerInput,
    intent: { kind: 'talk', label: 'Talk / protest', targets: [] },
    engineFact,
    previousGm: '',
  };
}

describe('T10AD steward whisper / want answer', () => {
  it('T7 whisper "What do they want from me?" lands a quoted steward reply (not ignored-action)', () => {
    const state = keepGate();
    const ask =
      'I press my back against the cold stone wall and whisper, "What do they want from me?" I keep my eyes fixed on the shadows beyond the gate.';
    // Writer miss path: wrong-slot quote stripped to silence about eyes/shadows.
    const draft =
      'Jax pressed their back against the cold stone wall of Keep Gate and whispered a question into the dark. The steward kept their eyes fixed on the shadows beyond the gate. Past the gate the shadows stayed flat and empty, and nothing moved between here and the road.';
    const fact =
      'Must narrate: whisper, "What do they want from me?". PC says exactly: "What do they want from me?" (do not rewrite). Speech event: you address the steward. NPC reaction slot open for the steward.';
    const stripped = normalizeCommittedProse(draft, checkOf(state, ask, fact));
    const out = ensureSpokenAnswer(stripped, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/the steward said,\s*["\u201c]/i);
    expect(out.prose).not.toMatch(/said nothing/i);
    const followed = checkActionFollowed(state, state, ask, out.prose);
    expect(followed.p0.some((f) => f.kind === 'ignored-action')).toBe(false);
  });

  it('T6 whisper with present steward replaces content-free silence with ledger need', () => {
    const state = keepGate({ turn: 6 });
    const ask =
      'I step closer to the steward, my voice dropping to a whisper. "Who\'s really pulling the strings here?" I glance back at the heavy wooden gate to make sure no one is watching.';
    const draft =
      'Jax stepped in close to the steward and dropped their voice to a whisper. Jax said, "Who\'s really pulling the strings here?" The steward said nothing at all and only looked at Jax.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/the steward said,\s*["\u201c]/i);
    // Ledger need/goal or seed-stable sheet motive — any quoted content beats "said nothing".
    expect(out.prose).toMatch(/["\u201c][^"\u201d]{3,}["\u201d]/);
    expect(out.prose.match(/\bsaid nothing\b/gi)?.length ?? 0).toBe(0);
  });
});

describe('T10AD free-input survives sealed-beat Travel cull', () => {
  it('compileChoices keeps Say something / Do something else when graph is travel-only', () => {
    const state = keepGate();
    const compiled = compileChoices(
      state,
      ['Travel toward Greyhollow Inn', 'Travel toward Greyhollow Church', FREE_INPUT_SAY, FREE_INPUT_DO],
      undefined,
      'I press my back against the cold stone wall and whisper, "What do they want from me?"',
    );
    expect(compiled.choices.some((c) => c === FREE_INPUT_SAY || isFreeInputChip(c))).toBe(true);
    expect(compiled.choices.some((c) => c === FREE_INPUT_DO || /do something else/i.test(c))).toBe(true);
    const onlyTravel = compiled.choices.every((c) => /^Travel toward\b/i.test(c));
    expect(onlyTravel).toBe(false);
  });
});
