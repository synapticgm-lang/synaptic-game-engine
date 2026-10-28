/**
 * T10N — grounding + player-facing text (s3001/s3002/s3003 defects).
 * Offline only — no paid AI.
 */
import { describe, expect, it } from 'vitest';
import { mentionsName } from './chipLegality';
import { filterSystemLogForEngine, isNoisySystemLogLine } from './systemLog';
import {
  classifyTokenLine,
  lineHasWrongTimeOfDay,
  handedCountText,
  parseTokenBeat,
  type TokenBeat,
} from './tokenProse';
import { normalizeCommittedProse, type DraftCheck } from './writerTurn';
import { createInitialState } from './defaults';
import { parsePlayerIntent } from './intentParser';
import type { GameState } from './types';
import { trimSameBeatRestatements, trimRecycledSentences } from './semanticLoopDetector';
import { checkAndRepairProse, type ClauseCheckChat } from './clauseCheck';
import type { FactSheet } from './factSheet';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('t10n', 'litrpg') as GameState;
  return {
    ...s,
    ...over,
    character: { ...s.character, name: 'Jax', ...(over.character ?? {}) },
    openingEstablishment: { complete: true, sceneWritten: true, ...(over.openingEstablishment as object) },
    sceneFacts: {
      crowd: 'sparse',
      noise: 'quiet',
      present: ['the salt-burners'],
      props: [],
      lastBeat: '',
      timeOfDay: 'dusk',
      ...(over.sceneFacts as object),
    },
    worldHour: 19,
  } as GameState;
}

function checkOf(state: GameState, playerInput: string): DraftCheck {
  return {
    state,
    playerInput,
    intent: parsePlayerIntent(playerInput, state),
    engineFact: '',
    previousGm: '',
  };
}

describe('T10N grounding and player-facing text', () => {
  it('1: invented prior dawn/morning fails the time gate even under since/at hedges', () => {
    const state = base();
    const handed = handedCountText(state);
    expect(lineHasWrongTimeOfDay('their answer was the same as it had been at dawn', handed)).toBe(true);
    expect(lineHasWrongTimeOfDay('the answer has not changed since morning', handed)).toBe(true);
    expect(lineHasWrongTimeOfDay('dusk heat rises off the pans', handed)).toBe(false);
  });

  it('1: clause repair that still invents history drops the sentence', async () => {
    const sheet = {
      turn: 1,
      place: { name: 'Pellane War Camp', scale: 'outdoor', exits: [], features: [] },
      present: [{ name: 'the salt-burners', manner: 'cold' }],
      openLedger: [],
      gear: { worn: [], carrying: [], inHand: 'bare hands', gold: 0 },
      beat: { verb: 'spoke', outcome: 'spoke', engineResult: 'Talk to the salt-burners.', steps: [] },
      player: { typed: 'Talk to the salt-burners', claimsNotTrue: [] },
      quests: [],
      recent: [],
      settingsSlot: null,
    } as FactSheet;
    const prose =
      'The salt-burners said, "We told you about the name already, and the answer has not changed since morning." One of them folds their arms.';
    let calls = 0;
    const chat: ClauseCheckChat = async () => {
      calls += 1;
      if (calls === 1) {
        return {
          claims: [
            {
              c: 'We told you about the name already, and the answer has not changed since morning',
              kind: 'fact',
              support: '',
              severity: 'serious',
            },
            { c: 'One of them folds their arms', kind: 'colour', support: '' },
          ],
        };
      }
      // Probe of the rewrite — still unsupported.
      if (calls === 2) {
        return {
          claims: [
            {
              c: 'Their answer about the name was the same as it had been at dawn',
              kind: 'fact',
              support: '',
              severity: 'serious',
            },
          ],
        };
      }
      // Final re-check of dropped prose.
      return {
        claims: [{ c: 'One of them folds their arms', kind: 'colour', support: '' }],
      };
    };
    const out = await checkAndRepairProse({
      factSheet: sheet,
      prose,
      player: { typed: 'Talk to the salt-burners', claimsNotTrue: [] },
      chat,
      repair: async () =>
        'Their answer about the name was the same as it had been at dawn.',
    });
    expect(out.repaired).toBe(true);
    expect(out.prose).not.toMatch(/at dawn|since morning|told you about the name/i);
    expect(out.prose).toMatch(/folds their arms/i);
  });

  it('2: person-as-thing token splice (the @tN glow on) fails the line gate', () => {
    const state = base({ currentLocation: 'Pellane War Camp' });
    const beat = parseTokenBeat(
      JSON.stringify({
        refs: [
          { tok: 't6', id: 'here', use: 'place' },
          { tok: 't7', id: 'cast:the-salt-burners', use: 'speaker' },
        ],
        lines: [
          {
            fn: 'hook',
            text: 'At the @t6 edge, a line of wagons already faces the long road toward the @t7 glow on the skyline.',
          },
        ],
      })
    ) as TokenBeat;
    const enumRefs = [
      { tok: 't6', id: 'here', display: 'Pellane War Camp', klass: 'place' as const },
      { tok: 't7', id: 'cast:the-salt-burners', display: 'the salt-burners', klass: 'person' as const },
    ];
    // Bind refs onto beat the way accept does.
    beat.refs = beat.refs;
    const line = beat.lines[0]!;
    const v = classifyTokenLine(line, beat, enumRefs, [], handedCountText(state));
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('person-as-thing');
  });

  it('3: multi-token mentionsName needs every token (Nemi Salt ≠ salt-burners)', () => {
    expect(mentionsName('the salt-burners', 'Nemi Salt')).toBe(false);
    expect(mentionsName('Nemi Salt', 'the salt-burners')).toBe(false);
    expect(mentionsName('Father Aldous', 'Aldous')).toBe(true);
    expect(mentionsName('Talk to Nemi Salt about wares', 'Nemi Salt')).toBe(true);
  });

  it('4: done:/quest generated: are noisy STATUS lines', () => {
    expect(isNoisySystemLogLine('done: talk Commander Rusk to Commander Rusk')).toBe(true);
    expect(isNoisySystemLogLine('quest generated: gen-ds-trouble-7')).toBe(true);
    expect(isNoisySystemLogLine('Quest unlocked: System bounty: Production fails')).toBe(false);
    const shown = filterSystemLogForEngine(
      [
        'done: other Commander Rusk to Commander Rusk',
        'quest generated: gen-ds-trouble-7',
        'Quest unlocked: System bounty: Production fails',
      ],
      'litrpg'
    );
    expect(shown.join(' ')).not.toMatch(/done:|quest generated/i);
    expect(shown.some((l) => /Quest unlocked/i.test(l))).toBe(true);
  });

  it('5: same-reply place/leg run is dropped; cross-turn near-duplicate church line trimmed', () => {
    const doubled =
      'Jax pointed the staff at the empty horizon ahead on the open road from Keep Gate toward Greyhollow Church. Nothing answered along the open road from Keep Gate toward Greyhollow Church, and no one stepped out. Far ahead, the grey stone roof of Greyhollow Church sat low against the afternoon sky.';
    const same = trimSameBeatRestatements(doubled);
    expect(same.text.match(/open road from Keep Gate toward Greyhollow Church/gi)?.length).toBe(1);

    const prior =
      'Ahead, the grey stone roof of Greyhollow Church sat low against the pale afternoon sky, still a long walk off.';
    const draft =
      'Jax kicked dirt. Far ahead, the grey stone roof of Greyhollow Church sat low against the afternoon sky.';
    const cross = trimRecycledSentences(draft, [prior], 1);
    expect(cross.text).not.toMatch(/grey stone roof of Greyhollow Church/i);
  });

  it('5b: normalizeCommittedProse collapses the live T11 tabletop shape', () => {
    const state = base({
      engineMode: 'dnd',
      currentLocation: 'the open road',
      journey: {
        from: 'Keep Gate',
        to: 'Greyhollow Church',
        ground: 'open road',
        legsDone: 1,
        legsTotal: 2,
      } as GameState['journey'],
      log: [
        {
          id: 'g1',
          role: 'gm',
          content:
            'Ahead, the grey stone roof of Greyhollow Church sat low against the pale afternoon sky, still a long walk off.',
          timestamp: 1,
        },
      ],
    });
    const line =
      'I spin the quarterstaff in my grip and point it sharply at the horizon.';
    const prose =
      'Jax spun the quarterstaff once in their grip, then pointed it sharply at the empty horizon ahead on the open road from Keep Gate toward Greyhollow Church. Nothing answered along the open road from Keep Gate toward Greyhollow Church, and no one stepped out from the dark grass at the road\'s edge. Far ahead, the grey stone roof of Greyhollow Church sat low against the afternoon sky.';
    const out = normalizeCommittedProse(prose, checkOf(state, line));
    expect(out.match(/open road from Keep Gate toward Greyhollow Church/gi)?.length).toBe(1);
    expect(out).not.toMatch(/Far ahead, the grey stone roof of Greyhollow Church/i);
  });
});
