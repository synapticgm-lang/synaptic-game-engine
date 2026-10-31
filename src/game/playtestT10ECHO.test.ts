/**
 * T10ECHO — writer input must not carry the player's act wording (traces from
 * T10COMBO T50 2026-10-31T14-1* turn-echo-player-act).
 * Fixtures: 3 per mode from summary.json echo turns.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import {
  buildClauseWriterFact,
  mustNarrateCue,
  pcSaysExactlyCue,
  convertWriterCueFact,
} from './writerCueLines';
import { buildFactSheet, formatFactSheetForWriter } from './factSheet';
import { buildCompletedEventPacket } from './completedEventPacket';
import { emptySceneFacts } from './sceneFacts';
import { openingRestatesPlayerAct } from './turnCheck';
import { writerDraftProblems, type DraftCheck } from './writerTurn';

/** Real T50 echo acts (playerInput) — rpg / litrpg / tabletop. */
const RPG = [
  'I start humming the tune of the road sign in a major key.',
  "I kick a pile of dust toward the raider's shins while shouting that his boots are louder than his sense.",
  "I stretch my arms wide and crack my neck while glaring at the empty doorway. \"If anyone's out there listening, I'm done playing hide and seek.",
] as const;
const LIT = [
  'I flick the red cloth aside and glance toward the horizon, then point to a faint trail of mud near my boots.',
  'Ask High Chanter Orel Vane about the lead',
  'I slide the loose stone back into my pocket and lean in closer to Orel Vane. "A rite is fine, but I need names before the candles burn out.',
] as const;
const TT = [
  'I kick the dust off my boots and shout, "Silas, check your six, I\'m not moving until you\'re clear.',
  'Ask a traveler about their house and guests',
  'I stretch my arms wide and crack my neck while glaring at the empty doorway.',
] as const;

function base(mode: 'rpg' | 'litrpg' | 'dnd', over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    engineMode: mode,
    character: { ...s.character, name: 'Jax' },
    turn: 20,
    sceneFacts: {
      ...emptySceneFacts(),
      present: mode === 'litrpg' ? ['High Chanter Orel Vane'] : mode === 'dnd' ? ['a traveler'] : ['Vessa'],
      crowd: 'sparse',
      crowdCount: 1,
      updatedTurn: 20,
    },
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

function assertNoActWording(writerFacing: string, act: string) {
  const low = writerFacing.toLowerCase();
  // Leading free-text / chip body must never appear (UI already shows it).
  const core = act.replace(/["\u201c].*$/, '').replace(/\s+/g, ' ').trim();
  if (core.length >= 20) {
    expect(low).not.toContain(core.slice(0, 20).toLowerCase());
  }
  if (/^ask\b/i.test(act.trim())) {
    expect(writerFacing).not.toMatch(new RegExp(act.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
}

describe('T10ECHO writer input has no player act wording', () => {
  it('mustNarrateCue / pcSaysExactlyCue never embed the act or quote', () => {
    for (const act of [...RPG, ...LIT, ...TT]) {
      const cue = mustNarrateCue(act);
      expect(cue).toMatch(/already shown; do not restate — write the consequence/i);
      expect(cue).not.toMatch(/humming|dust|stretch|flick|Ask High|Ask a traveler|loose stone/i);
      assertNoActWording(cue, act);
    }
    const say = pcSaysExactlyCue('A rite is fine, but I need names before the candles burn out.');
    expect(say).toMatch(/already shown/i);
    expect(say).not.toMatch(/rite is fine|candles burn/i);
  });

  it('rpg×3: buildClauseWriterFact + fact sheet omit act wording; convert paints consequence only', () => {
    for (const act of RPG) {
      const speech = /["\u201c]/.test(act) || /\bshout/i.test(act);
      const fact = buildClauseWriterFact(act, speech, {
        said: speech ? 'If anyone\'s out there listening' : undefined,
        presentHere: ['Vessa', 'Saltmar Raider'],
        addressee: /\braider/i.test(act) ? 'Saltmar Raider' : null,
      });
      expect(fact).toMatch(/Must narrate: \[already shown/i);
      expect(fact).not.toMatch(/I start humming|I kick a pile|I stretch my arms/i);
      assertNoActWording(fact, act);

      const state = base('rpg');
      const packet = buildCompletedEventPacket(state, act, { engineResult: fact });
      const sheetText = formatFactSheetForWriter(buildFactSheet(state, packet, act));
      expect(sheetText).toMatch(/typed: \(already shown in UI/i);
      expect(sheetText).not.toMatch(/I start humming|I kick a pile|I stretch my arms/i);

      const plain = convertWriterCueFact(fact, 'Jax');
      expect(plain).not.toMatch(/hummed the road sign|kicked a pile of dust|stretched their arms wide/i);
    }
  });

  it('litrpg×3: Ask chip + free-text facts omit act wording; Speech event keeps engine target', () => {
    for (const act of LIT) {
      const isAsk = /^Ask\b/i.test(act);
      const fact = buildClauseWriterFact(act, true, {
        said: /rite is fine/i.test(act) ? 'A rite is fine, but I need names before the candles burn out.' : undefined,
        addressee: 'High Chanter Orel Vane',
        presentHere: ['High Chanter Orel Vane', 'Maud Pike'],
      });
      expect(fact).toMatch(/NPC reaction slot open for High Chanter Orel Vane/i);
      expect(fact).not.toMatch(/I flick the red cloth|Ask High Chanter Orel Vane about the lead|I slide the loose stone/i);
      if (isAsk) expect(fact).not.toMatch(/about the lead/i);
      assertNoActWording(fact, act);

      const state = base('litrpg', {
        campaignBibleId: 'summoned-pact',
        currentLocation: 'Sevenfold Circle',
      });
      const sheetText = formatFactSheetForWriter(
        buildFactSheet(state, buildCompletedEventPacket(state, act, { engineResult: fact }), act),
      );
      expect(sheetText).not.toMatch(/I flick the red cloth|Ask High Chanter|I slide the loose stone/i);
    }
  });

  it('tabletop×3: shout + Ask traveler facts omit act wording', () => {
    for (const act of TT) {
      const isAsk = /^Ask\b/i.test(act);
      const fact = buildClauseWriterFact(act, true, {
        said: /Silas/i.test(act) ? "Silas, check your six, I'm not moving until you're clear." : undefined,
        addressee: isAsk ? 'a traveler' : null,
        presentHere: isAsk ? ['a traveler'] : ['Edda Coyne'],
      });
      expect(fact).not.toMatch(/I kick the dust off my boots|Ask a traveler about their house/i);
      if (isAsk) {
        expect(fact).toMatch(/NPC reaction slot open for a traveler/i);
        expect(fact).not.toMatch(/house and guests/i);
      }
      assertNoActWording(fact, act);
    }
  });

  it('RC7 checker + re-draft problem still catch echo without re-feeding act words', () => {
    const action = RPG[0];
    const echo =
      'Jax hummed the road sign\'s tune in a major key, and the sound carried across the quiet room. Dust hung in the light.';
    expect(openingRestatesPlayerAct(echo, action)).toBe(true);
    const state = base('rpg');
    const check: DraftCheck = {
      state,
      playerInput: action,
      intent: { kind: 'other', label: action, targets: [] },
      engineFact: buildClauseWriterFact(action, false, { presentHere: ['Vessa'] }),
      previousGm: '',
    };
    const problems = writerDraftProblems(echo, check);
    expect(problems.some((p) => /Do not restate the player's act/i.test(p))).toBe(true);
    expect(problems.join('\n')).not.toMatch(/I start humming the tune of the road sign/i);
  });
});
