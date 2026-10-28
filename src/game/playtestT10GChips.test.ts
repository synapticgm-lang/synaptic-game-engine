/**
 * T10G — Salt Road T3–T7 origin pad exclusive (no travel mix / dead travel);
 * Cursed Keep T3 Ask Mayor Helga Brask chip resolves like typed ask (addressee, not empty scene).
 * Fixtures mirror runs:
 *   2026-10-28T00-26-10-657Z_salt-road-heist_chilled-gm_s1029
 *   2026-10-28T00-26-08-062Z_cursed-keep_chilled-gm_s1027
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveOfferedChoices, commitOfferedPad } from './playTranscript';
import { checkChipKinds } from './chipCheck';
import { engineChips } from './choicePipeline';
import { originChip, ORIGIN_QUICK_START_CHIP, settleOrigin } from './rules/rpgOrigin';
import { BACKGROUNDS } from './tabletop/characterBuild';
import { parsePlayerSteps, sheetContextFromState } from './intentParser';
import { resolveTypedFreeText } from './typedFreeText';
import type { GameState } from './types';

/** Salt Road after covers, origin still open — live T3 mix was Travel|Origin|Travel. */
function saltOriginOpen(turn = 3): GameState {
  const state = createInitialState(undefined, 'rpg') as GameState;
  state.campaignBibleId = 'salt-road-heist';
  state.engineMode = 'rpg';
  state.seed = '1029';
  state.turn = turn;
  state.currentLocation = 'Salt Road Waystation';
  state.openingEstablishment = {
    ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
    complete: true,
    pending: [],
    answers: { ...(state.openingEstablishment?.answers ?? {}), name: 'Jax' },
  };
  state.character = { ...state.character, name: 'Jax', origin: undefined };
  state.activeEncounter = null;
  state.roundCombat = null;
  state.choices = [
    'Travel toward Consul Caravan Camp',
    'Origin: Acolyte',
    'Travel toward Safehouse Alley',
  ];
  return state;
}

/**
 * Cursed Keep T3: Mayor Helga Brask is here by npc memory location (presentNpcRecords)
 * but sceneFacts.present still stamps only Father Aldous / bystanders — the live empty-scene miss.
 */
function cursedKeepAskChipState(): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  s.engineMode = 'dnd';
  s.campaignBibleId = 'cursed-keep';
  s.seed = '1027';
  s.turn = 3;
  s.character = { ...s.character, name: 'Jax' };
  s.openingEstablishment = {
    pending: [],
    answers: { name: 'Jax' },
    complete: true,
  };
  s.currentLocation = 'Greyhollow Graveyard';
  s.sceneFacts = {
    crowd: 'sparse',
    noise: 'quiet',
    present: ['Father Aldous', 'bystanders', 'Aldous'],
    props: [],
    lastBeat: 'people are present',
    updatedTurn: 3,
  };
  s.npcMemories = [
    {
      npcId: 'ck-npc-1',
      npcName: 'Father Aldous',
      disposition: 'neutral',
      facts: [],
      lastSeenTurn: 1,
      present: true,
      location: 'Greyhollow Graveyard',
    },
    {
      npcId: 'ck-npc-mayor',
      npcName: 'Mayor Helga Brask',
      disposition: 'neutral',
      facts: [],
      lastSeenTurn: 2,
      present: true,
      location: 'Greyhollow Graveyard',
    },
  ];
  s.offeredPad = {
    turn: 3,
    choices: [
      'Travel toward Greyhollow Inn',
      'Ask Mayor Helga Brask about the lead',
      'Read Father Aldous',
      'Examine the mud around the opened graves',
      'Say something…',
      'Do something else…',
    ],
    chips: [
      {
        label: 'Ask Mayor Helga Brask about the lead',
        actionId: 'quest-route:ck-spine-mayor-problem:ck-spine-mayor-problem-obj-1:ck-spine-mayor-problem-s1-person',
        kind: 'affordance',
        slotCategory: 'talk',
      },
    ],
  };
  return s;
}

describe('T10G origin + Ask chip addressee', () => {
  it('Salt T3–T7: origin chips present; scene options allowed beside them (T10T)', () => {
    const open = saltOriginOpen(3);
    const offered = resolveOfferedChoices(open);
    expect(offered).toEqual(expect.arrayContaining([
      ...BACKGROUNDS.map((b) => originChip(b.id)),
      ORIGIN_QUICK_START_CHIP,
    ]));
    expect(offered.some((c) => !/^Origin:/i.test(c) && c !== ORIGIN_QUICK_START_CHIP)).toBe(true);

    const committed = commitOfferedPad({ ...open, offeredPad: null });
    const labels = committed.offeredPad?.choices ?? [];
    expect(labels).toEqual(expect.arrayContaining([
      ...BACKGROUNDS.map((b) => originChip(b.id)),
      ORIGIN_QUICK_START_CHIP,
    ]));
    expect(engineChips(committed).some((c) => /^Origin:/i.test(c.label))).toBe(true);
    expect(engineChips(committed).some((c) => !/^Origin:/i.test(c.label) && c.label !== ORIGIN_QUICK_START_CHIP)).toBe(
      true,
    );
    expect(checkChipKinds(committed, labels).filter((f) => f.kind === 'dead-chip')).toEqual([]);

    const walking = commitOfferedPad({
      ...open,
      turn: 5,
      choices: ['Travel toward Harbor Fence', 'Origin: Criminal', 'Travel toward Bribe Market'],
      offeredPad: null,
    });
    // T10T — travel may appear beside origin; dead-chip travel from exclusive cull is gone.
    expect(checkChipKinds(walking, walking.offeredPad?.choices ?? []).filter((f) => f.kind === 'dead-chip')).toEqual(
      [],
    );

    const settled = settleOrigin(open, 'Origin: Soldier');
    expect(settled.state.character.origin).toBe('soldier');
    const after = resolveOfferedChoices({
      ...settled.state,
      turn: 8,
      choices: ['Look around', 'Wait and listen', 'Ask what they want'],
      offeredPad: null,
    });
    expect(after.some((c) => /^Origin:/i.test(c) || c === ORIGIN_QUICK_START_CHIP)).toBe(false);
  });

  it('CK T3: Ask Mayor Helga Brask chip = typed ask IntentStep (addressee, not empty scene)', () => {
    const state = cursedKeepAskChipState();
    const chip = 'Ask Mayor Helga Brask about the lead';
    const typed = 'ask Mayor Brask where they lead';
    const ctx = sheetContextFromState(state);
    expect(ctx.present.some((p) => /Mayor Helga Brask/i.test(p))).toBe(true);

    const chipSteps = parsePlayerSteps(chip, ctx).steps;
    const typedSteps = parsePlayerSteps(typed, ctx).steps;
    expect(chipSteps[0]?.action).toBe('ask_about');
    expect(chipSteps[0]?.addressee).toMatch(/Helga Brask|Mayor Helga Brask/i);
    expect(typedSteps[0]?.addressee).toMatch(/Helga Brask|Mayor Helga Brask/i);

    const chipRes = resolveTypedFreeText(state, chip);
    const typedRes = resolveTypedFreeText(state, typed);
    expect(chipRes.engineResult).toMatch(/Speech event: you address (?:Mayor )?Helga Brask/i);
    expect(chipRes.engineResult).not.toMatch(/address the empty scene/i);
    expect(typedRes.engineResult).toMatch(/Speech event: you address (?:Mayor )?Helga Brask/i);
    expect(typedRes.engineResult).not.toMatch(/address the empty scene/i);
  });
});
