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
import { writerDraftProblems, type DraftCheck } from './writerTurn';
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

  it('T10/T25/T44: seated free-text ask keeps reply owner; no agenda stack on reaction', () => {
    const orel = (turn: number) =>
      rpg({
        turn,
        engineMode: 'litrpg',
        campaignBibleId: 'summoned-pact',
        currentLocation: turn === 25 ? 'Lowmarket' : 'West Wall',
        sceneFacts: {
          ...emptySceneFacts(),
          present: ['High Chanter Orel Vane'],
          crowd: 'sparse',
          crowdCount: 1,
          updatedTurn: turn,
        },
        npcMemories: [
          mem({
            npcName: 'High Chanter Orel Vane',
            aliases: ['Orel Vane', 'Orel'],
            need: 'a buyer who pays',
            goal: { target: 'a secret worth selling' } as NpcMemory['goal'],
          }),
        ],
      });

    // T44 — writer already reacted to the mace ask; do not append agenda.
    const t44Writer =
      "Jax crouched low and slid the heavy mace across the wet stones of West Wall until it stopped against High Chanter Orel Vane's boots. High Chanter Orel Vane looked down at the mace and did not reach for it.";
    const t44 = ensureSpokenAnswer(
      t44Writer,
      orel(44),
      'I slide the heavy mace across the wet stones toward Orel\'s boots and say, "Is this what you\'re looking for, or just another piece of trash?"',
    );
    expect(t44.prose).toMatch(/looked down at the mace/i);
    expect(t44.prose).not.toMatch(/pressed for|made clear/i);

    // T25 — shove + shout at seated Orel: reply/silence, not agenda dump.
    const t25 = ensureSpokenAnswer(
      'Jax put a shoulder into High Chanter Orel Vane and shoved straight past, and the old chanter rocked back a half step. Jax drove a boot into the door of the Weighing Cup and it banged open.',
      orel(25),
      'I shove past Orel Vane and shout, "Move or get out of the way!" while kicking open the Weighing Cup door.',
    );
    expect(t25.prose).not.toMatch(/made clear|pressed for/i);

    // T10 — whisper ask to High Chanter: no agenda as the only voiced beat.
    const t10 = ensureSpokenAnswer(
      'Jax glanced back over their shoulder toward the dark entrance of Contract Hall. Nell Rudd stopped mid-sentence.',
      orel(10),
      'I lean in closer to the High Chanter and whisper, "What\'s the price on that secret?" then I glance over my shoulder toward the dark entrance of Contract Hall.',
    );
    expect(t10.prose).not.toMatch(/pressed for a secret worth selling/i);
    expect(t10.prose).not.toMatch(/made clear that they needed a buyer who pays/i);
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
