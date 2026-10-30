/**
 * T10RC7 — narration parroting at the root (T50 rpg Gemini evidence).
 * Facts mark the player act already shown; checker flags opening echo;
 * one agenda owner; encounter/item labels are common nouns.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import {
  actHalfClause,
  buildClauseWriterFact,
  convertWriterCueFact,
  mustNarrateCue,
  pcSaysExactlyCue,
} from './writerCueLines';
import { formatFactSheetForWriter, buildFactSheet } from './factSheet';
import { buildCompletedEventPacket, lastResortStoryBody } from './completedEventPacket';
import { checkPlayCrimes, openingRestatesPlayerAct } from './turnCheck';
import { sealPostWriterProse, writerDraftProblems, type DraftCheck } from './writerTurn';
import { ensureSpokenAnswer } from './spokenAnswer';
import { emptySceneFacts } from './sceneFacts';
import { autoFightSpawnPreface, pendingFoeSign } from './combatAuthority';
import { proseEncounterLabel, proseItemName, plainItemChromeInText } from './proseItemName';

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

function rpg(over: Partial<GameState> = {}): GameState {
  return {
    ...(createInitialState(undefined, 'rpg') as GameState),
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...(createInitialState(undefined, 'rpg') as GameState).character, name: 'Jax' },
    turn: 169,
    currentLocation: 'Salt Road Waystation',
    sceneFacts: {
      ...emptySceneFacts(),
      present: ['Vessa'],
      crowd: 'sparse',
      crowdCount: 1,
      updatedTurn: 169,
    },
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

describe('T10RC7 narration parroting at the root', () => {
  it('T169/T167/T185: facts mark the player act already shown; convert does not restate', () => {
    const line =
      'I lean against the post and start humming a tuneless, off-key song about missing socks. "If you don\'t move faster than a snail on sedatives, I\'m charging you for my time.';
    const fact = buildClauseWriterFact(line, true, {
      said: "If you don't move faster than a snail on sedatives, I'm charging you for my time.",
      presentHere: ['Vessa'],
    });
    expect(fact).toMatch(/already shown; do not restate/i);
    expect(fact).toMatch(/Must narrate:/i);
    expect(actHalfClause(line).split(/\s+/).length).toBeLessThanOrEqual(8);
    expect(mustNarrateCue(line)).toMatch(/already shown/i);
    expect(pcSaysExactlyCue("If you don't move faster")).toMatch(/already shown/i);

    const plain = convertWriterCueFact(fact, 'Jax');
    expect(plain).not.toMatch(/tuneless, off-key song about missing socks/i);
    expect(plain).not.toMatch(/If you don't move faster than a snail/i);
    expect(plain).not.toMatch(/Jax said,\s*["\u201c]If you don't move faster/i);

    const state = rpg({
      npcMemories: [mem({ npcName: 'Vessa', need: 'a buyer who pays' })],
    });
    const packet = buildCompletedEventPacket(state, line, { engineResult: fact });
    const sheet = buildFactSheet(state, packet, line);
    const text = formatFactSheetForWriter(sheet);
    expect(text).toMatch(/already shown in UI; do not restate/i);
    expect(text).toMatch(/typed \(already shown\)/i);

    const resort = lastResortStoryBody(state, packet, line);
    expect(resort.prose).not.toMatch(/tuneless, off-key song about missing socks/i);
    expect(resort.prose).not.toMatch(/If you don't move faster than a snail/i);
  });

  it('T169 echo draft: checker flags opening restatement; writerDraftProblems names it', () => {
    const action =
      'I lean against the post and start humming a tuneless, off-key song about missing socks. "If you don\'t move faster than a snail on sedatives, I\'m charging you for my time.';
    const echo =
      'Jax leaned back against the wooden post at Salt Road Waystation and let their weight settle there. Then Jax began to hum a tuneless, off-key song about missing socks. Jax said, "If you don\'t move faster than a snail on sedatives, I\'m charging you for my time." The only sound left in the waystation was the low creak of the post against Jax\'s back.';
    expect(openingRestatesPlayerAct(echo, action)).toBe(true);
    const state = rpg();
    const crimes = checkPlayCrimes(state, state, action, echo);
    expect(crimes.p0.some((f) => f.kind === 'echo-player-act')).toBe(true);

    const check: DraftCheck = {
      state,
      playerInput: action,
      intent: { kind: 'other', label: action, targets: [] },
      engineFact: buildClauseWriterFact(action, true, { said: "If you don't move faster", presentHere: ['Vessa'] }),
      previousGm: '',
    };
    const problems = writerDraftProblems(echo, check);
    expect(problems.some((p) => /Do not restate the player's act/i.test(p))).toBe(true);

    const pebble =
      'I toss a pebble at the dusty signpost and shout, "Hey! You coming or just standing there?';
    const pebbleEcho =
      'Jax picked up a small pebble and tossed it at the dusty signpost, and it clicked off the old wood and dropped into the dirt. Jax said, "Hey! You coming or just standing there?" No one was there to answer.';
    expect(openingRestatesPlayerAct(pebbleEcho, pebble)).toBe(true);

    const ok =
      'The post creaked under Jax\'s weight. Vessa\'s eyes flicked once toward the road, then away. Dust drifted in the shaft of light by the door.';
    expect(openingRestatesPlayerAct(ok, action)).toBe(false);
  });

  it('T202/T186: agenda voiced once as a full that-clause (short+full name collapse)', () => {
    const state = rpg({
      turn: 202,
      currentLocation: 'Harbor Fence',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Oda Hask'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 202,
      },
      npcMemories: [
        mem({
          npcName: 'Oda Hask',
          aliases: ['Oda'],
          need: 'eyes on the approach',
        }),
      ],
    });
    const doubled =
      'Jax kicked a loose stone into the darkness. Oda made clear they needed eyes on the approach. Oda Hask made clear they needed eyes on the approach.';
    const sealed = ensureSpokenAnswer(doubled, state, 'Talk to Oda Hask');
    const needHits = (sealed.prose.match(/made clear/gi) ?? []).length;
    expect(needHits).toBe(1);
    expect(sealed.prose).toMatch(/made clear that they needed eyes on the approach/i);
    expect(sealed.prose).not.toMatch(/Oda made clear[\s\S]*Oda Hask made clear/i);

    const ysolde = rpg({
      turn: 186,
      currentLocation: 'Consul Caravan Camp',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Ysolde Sallow'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 186,
      },
      npcMemories: [mem({ npcName: 'Ysolde Sallow', need: 'a charge who will follow' })],
    });
    const talk = ensureSpokenAnswer(
      'Jax turned to face Ysolde Sallow and asked their question straight out.',
      ysolde,
      'Talk to Ysolde Sallow',
    );
    expect(talk.prose).toMatch(/Ysolde Sallow made clear that they needed a charge who will follow/i);
    expect((talk.prose.match(/made clear/gi) ?? []).length).toBe(1);
  });

  it('T190/T216: trailing motive quote already on page is not appended again', () => {
    // Evidence: writer silence → motiveAnswer trailing `"…," Name said` → sealPostWriterProse again
    // missed already-quoted (only checked leading `Name said, "…"`) and doubled the line.
    const state = rpg({
      turn: 190,
      currentLocation: 'Harbor Fence',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Piers Thatch'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 190,
      },
      npcMemories: [
        mem({
          npcName: 'Piers Thatch',
          aliases: ['Piers'],
          motiveLines: ['When a debt goes unpaid, the property finds its way to me'],
        }),
      ],
    });
    const ask =
      'I hook the belt back on and lean against the fence post, watching the riders approach. "You think they\'ll let us pass or start shooting?" I tap my fingers against the wood.';
    const once =
      'Jax hooked the belt back onto their road clothes and leaned their weight against the fence post at Harbor Fence. "You think they\'ll let us pass or start shooting?" Jax said, then tapped their fingers on the wood. Far down the Harbor Fence rail, lanterns swung with each step. "When a debt goes unpaid, the property finds its way to me," Piers Thatch said.';
    const sealed = sealPostWriterProse(state, once, ask);
    expect((sealed.prose.match(/When a debt goes unpaid/gi) ?? []).length).toBe(1);
    expect(sealed.spoken?.status).toBe('already-quoted');

    const doubled = `${once} "When a debt goes unpaid, the property finds its way to me," Piers Thatch said.`;
    const collapsed = ensureSpokenAnswer(doubled, state, ask);
    expect((collapsed.prose.match(/When a debt goes unpaid/gi) ?? []).length).toBe(1);
  });

  it('T193/T197: ledger need voiced in recent GM is not repeated as filler', () => {
    // Evidence: Oda agenda line 7× in 50 turns — speakerAlreadyTold only scanned quotes, not
    // indirect "made clear they needed …" beats.
    const prior =
      'Jax turned to Oda Hask at the Harbor Fence and spoke to the gatekeeper directly. Oda Hask made clear they needed eyes on the approach.';
    const state = rpg({
      turn: 197,
      currentLocation: 'Harbor Fence',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Oda Hask'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 197,
      },
      log: [
        {
          id: 'g193',
          turn: 193,
          role: 'gm',
          content: prior,
          timestamp: 1,
        },
      ],
      npcMemories: [
        mem({
          npcName: 'Oda Hask',
          aliases: ['Oda'],
          need: 'eyes on the approach',
          goal: { target: 'someone who watches the fence' } as NpcMemory['goal'],
        }),
      ],
    });
    const stare =
      'I scratch the rough bark of the fence post with my thumbnail while staring at Oda Hask.';
    const draft =
      'Jax pressed their thumbnail into the rough bark of the fence post at Harbor Fence and dragged it down in a slow scratch while their eyes stayed fixed on Oda Hask.';
    const out = ensureSpokenAnswer(draft, state, stare);
    expect((out.prose.match(/eyes on the approach/gi) ?? []).length).toBe(0);
    // Direct Talk still gets a content reply (other facet or ask-back), not silence-only.
    const talk = ensureSpokenAnswer(
      'Jax turned to Oda Hask and waited for an answer.',
      state,
      'Talk to Oda Hask',
    );
    expect(talk.prose).toMatch(/Oda Hask/i);
    expect(talk.prose).not.toMatch(/made clear that they needed eyes on the approach/i);
  });

  it('T212/T172: encounter and item labels are common nouns, not character names', () => {
    const enc = proseEncounterLabel('Stonevein Ambush');
    expect(enc.notCharacter).toBe(true);
    expect(enc.label).toMatch(/^the /i);
    expect(enc.label).not.toBe('Stonevein Ambush');
    expect(enc.label.toLowerCase()).toMatch(/ambush/);

    const preface = autoFightSpawnPreface('Stonevein Ambush', 'Checkpoint Rise', undefined, 'outdoor');
    expect(preface).not.toMatch(/^Stonevein Ambush lurched/i);
    expect(preface).toMatch(/the /i);
    expect(preface).not.toMatch(/\bStonevein Ambush\b/);

    const sign = pendingFoeSign({ name: 'Stonevein Ambush', threatTier: 'trash' }, rpg({ currentLocation: 'Checkpoint Rise' }));
    expect(sign).toMatch(/not a character name — common noun/i);
    expect(sign).not.toMatch(/^Stonevein Ambush,/);

    expect(proseItemName('Jerkin')).toBe('jerkin');
    expect(proseItemName('Fine Jerkin')).toBe('jerkin');
    expect(plainItemChromeInText('kick the heavy Jerkin toward the wall')).toMatch(/the heavy jerkin/i);
    expect(plainItemChromeInText('kick the heavy Jerkin toward the wall')).not.toMatch(/\bJerkin\b/);
    // Multi-word places stay Title-Case.
    expect(plainItemChromeInText('walk the Salt Road')).toMatch(/Salt Road/);
  });
});
