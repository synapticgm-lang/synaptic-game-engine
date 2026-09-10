/**
 * 2026-09-10a — Live Drive Gemini owners at source (not rewrite paste).
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { rewriteChromeSpeakerTags } from './chromeAuthority';
import { establishmentChoices } from './openingEstablishment';
import { resolveOfferedChoices } from './playTranscript';
import { stitchOpeningContinue } from './openingStitch';
import { compileGraphChoiceLabels } from './graphChoices';
import { composeFreeMudTurn, mudDisplayBody } from './freeMudPresentation';
import { buildCompletedEventPacket } from './completedEventPacket';
import { createInitialState } from './defaults';
import { initEncounterTerminal } from './encounterTerminalFsm';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

function summoned(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    seed: '10a-circle',
    currentLocation: 'The Sevenfold Circle under bombardment',
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: [
        { id: 'name', kind: 'name', question: 'A slate tilts toward you. First word they will accept: your name.' },
      ],
      answers: { where: 'The Sevenfold Circle under bombardment' },
      complete: false,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHookFallback:
        'A blast shudders the flagstones. Two Scale priests scramble back. A younger handler drops to one knee, shouting that the Mark is wrong.',
    },
    quests: [
      {
        id: 'circles-price',
        name: "Circle's Price",
        type: 'main',
        status: 'active',
        revealed: true,
        description: 'Bearings',
        objectives: [{ id: 'o1', description: 'Get your bearings', completed: false }],
      },
    ],
    sceneFacts: {
      ...emptySceneFacts(2),
      present: ["Circle's Price", 'Wren Holt'],
    },
    ...over,
  };
}

describe('playtest10a — live-drive source locks', () => {
  it('HUD/BUILD are 2026-09-10a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-10a');
    expect(BUILD_STAMP).toBe('2026-09-10a');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('quest titles fail harvest; Wren Holt stays', () => {
    expect(canHarvestAsNamedPerson("Circle's Price", 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Greyhollow Quest', 'cursed-keep')).toBe(false);
    expect(canHarvestAsNamedPerson('Wren Holt', 'thornferry-road')).toBe(true);
    expect(canHarvestAsNamedPerson('Father Karel', 'summoned-pact')).toBe(true);
  });

  it('chrome keeps panel wants a name (cover ask, not a speaker)', () => {
    const kept = rewriteChromeSpeakerTags('The panel wants a name to write. It does not say why.');
    expect(kept).toMatch(/panel wants a name/i);
    expect(kept).not.toMatch(/the work requires/i);
  });

  it('pending name cover never compiles play pads', () => {
    const state = summoned();
    expect(establishmentChoices(state.openingEstablishment!.pending, state)).toEqual([
      'Give your name',
      'Refuse to give a name',
    ]);
    const pads = resolveOfferedChoices(state);
    expect(pads).toEqual(['Give your name', 'Refuse to give a name']);
    expect(pads.join(' ')).not.toMatch(/Check Status|Wait and watch|Inspect the panel/i);
  });

  it('cover continue grounds in this card, not shared indoor-summon spice', () => {
    const text = stitchOpeningContinue(summoned(), 'Whats going on? My name why do you want that');
    expect(text).toMatch(/panel wants a name|does not say why/i);
    expect(text).toMatch(/priests|handler|Mark/i);
    expect(text).not.toMatch(/still on the table/i);
  });

  it('live encounter pads are combat only', () => {
    const base = summoned({
      openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true },
      character: { ...summoned().character, name: 'Jax' },
    });
    const enc = initEncounterTerminal(
      {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 17,
        maxHp: 20,
        armorClass: 12,
        strength: 12,
        dexterity: 12,
        constitution: 12,
        xpReward: 25,
        goldReward: 5,
      },
      base
    );
    const fight = {
      ...base,
      activeEncounter: enc,
      sceneFacts: { ...emptySceneFacts(8), present: ['Pact-Hunter Skirmisher'], tension: 'combat' as const },
    };
    const pads = compileGraphChoiceLabels(fight);
    expect(pads.some((p) => /press the attack/i.test(p))).toBe(true);
    expect(pads.some((p) => /inspect|wait and watch|take a stake|circle's price/i.test(p))).toBe(false);
  });

  it('Silent display is authored stitch, not HERE/ACT/CAST dump', () => {
    const state = summoned({
      openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true },
      character: { ...summoned().character, name: 'Jax' },
      sceneFacts: { ...emptySceneFacts(4), present: ['Wren Holt'] },
    });
    const packet = buildCompletedEventPacket(state, 'Inspect the panel');
    expect(packet.witnesses.some((w) => /circle's price/i.test(w))).toBe(false);
    const turn = composeFreeMudTurn(packet, { silent: true, gold: 0 });
    const body = mudDisplayBody(turn);
    expect(body).not.toMatch(/^HERE:/m);
    expect(body).not.toMatch(/^CAST:/m);
    expect(body.trim().split(/[.!?]/)[0]!.length).toBeGreaterThan(8);
    expect(turn.receiptLines.some((l) => /^HERE:/i.test(l))).toBe(true);
  });
});
