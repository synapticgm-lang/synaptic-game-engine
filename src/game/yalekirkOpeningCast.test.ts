/**
 * PR35 — Yalekirk / Ash Court opening: mint occupancy, no bible catalog pins,
 * no forced rite completion, no invented clash, no Check System scene pad.
 */
import { describe, expect, it } from 'vitest';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { createInitialState } from './defaults';
import { assembleFourSlotPads } from './fourSlotPads';
import { deriveOpeningJournal } from './liveOpening';
import { ensureXpNarration } from './narrativeSanitize';
import {
  attachOpeningInstance,
  impliedOccupancyCount,
  impliedRoleFromWhoHere,
  snapshotFromPickedHook,
} from './openingInstance';
import { resolveOpeningPinnedNames } from './openingPin';
import { applyOpeningRiteTurn, ensureOpeningRite } from './openingRite';
import { peopleHere } from './scenePresence';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

const CATALOG_PAIR = /Orel(?:\s+Vane)?|Sera(?:\s+Quill)?|High Chanter/i;

const ASH_PICKED = {
  who: 'an Earth stranger pulled by Ash Court priests as Calamity proof',
  pressing: 'They want the Mark read aloud as evidence against Pellane before you can leave.',
  location: 'an Ash-adjacent ritual hall',
  faction: 'Ash Court priests who will swear the Crown summoned you',
  summonIntent: 'Ash Court priests want a Calamity Mark as proof the Scale rejected Pellane.',
  openingOffer:
    'Wear the Mark openly and they offer ember-ward kit and citizenship papers. Refuse and you keep Earth clothes — they may still try to keep you.',
  page1:
    'The air smells of burnt iron. You wake on your back in a jagged circle of iron dust, red light in the cracks, nowhere near Pellane’s brass. A blue panel hangs in the gloom — private, yours. Ash Court priests in soot-stained robes stand over you; one iron mask tilts down. A wrapped ember-blade sits on a stone side table — a deal, not yours yet. The lead priest’s voice comes rough through the mask: show the Mark, or give a name they can write on a tally.',
};

function ashState(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('The Summoned Pact', 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    seed: 'yalekirk-pr35',
    character: { ...s.character!, name: 'Jax', level: 1, xp: 0, xpToNext: 150 },
    currentLocation: 'an Ash-adjacent ritual hall',
    sceneFacts: { ...emptySceneFacts(0), present: ['High Chanter Orel Vane', 'Captain Sera Quill'] },
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      sceneWritten: false,
      mode: 'weave',
      aloneArrival: false,
      pinnedNpcNames: ['High Chanter Orel Vane', 'Captain Sera Quill'],
      pinnedAt: 'an Ash-adjacent ritual hall',
    },
    ...over,
  };
}

function attachAsh(over: Partial<GameState> = {}): GameState {
  return attachOpeningInstance(ashState(over), snapshotFromPickedHook(ASH_PICKED));
}

describe('PR35 Yalekirk Ash Court opening', () => {
  it('slices a long faction whoHere into a role and mints people', () => {
    const who = ASH_PICKED.faction;
    expect(impliedRoleFromWhoHere(who)).toMatch(/priest/i);
    expect(impliedOccupancyCount(who)).toBe(2);
  });

  it('mints per-game people, journals them as present, and drops catalog pins', () => {
    const state = attachAsh();
    const inst = state.openingEstablishment!.instance!;
    expect(inst.cast.length).toBeGreaterThanOrEqual(1);
    expect(inst.cast.map((c) => c.name).join(' ')).not.toMatch(CATALOG_PAIR);
    expect(inst.alone).toBe(false);

    const journal = deriveOpeningJournal(state, inst.situation);
    expect(journal.description).not.toMatch(/on your own/i);
    expect(journal.description).toMatch(new RegExp(inst.cast[0]!.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    expect(state.openingEstablishment!.pinnedNpcNames).toEqual(inst.cast.map((c) => c.name));
    expect(state.openingEstablishment!.pinnedNpcNames!.join(' ')).not.toMatch(CATALOG_PAIR);
    expect((state.sceneFacts?.present ?? []).join(' ')).not.toMatch(CATALOG_PAIR);
    for (const name of inst.cast.map((c) => c.name)) {
      expect(state.sceneFacts?.present).toContain(name);
    }
    expect(peopleHere(state).join(' ')).not.toMatch(CATALOG_PAIR);
    expect(peopleHere(state).length).toBeGreaterThanOrEqual(1);
  });

  it('does not fall back to bible keyNPCs when the hook names no one', () => {
    const state = ashState({
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        aloneArrival: false,
        pickedHookFallback: ASH_PICKED.page1,
        pinnedNpcNames: [],
      },
      sceneFacts: { ...emptySceneFacts(0), present: [] },
    });
    const pinned = resolveOpeningPinnedNames(state, summonedPact);
    expect(pinned.join(' ')).not.toMatch(CATALOG_PAIR);
    expect(pinned).toEqual([]);
  });

  it('does not force-seal the pact or grant Level 2 when the player only asks a question', () => {
    let s = ensureOpeningRite({
      ...attachAsh(),
      turn: 1,
    });
    const first = applyOpeningRiteTurn(s, 'Ask the High Chanter what they want from me');
    expect(first.state.openingRite?.done).toBeFalsy();
    expect(first.state.character.level).toBe(1);
    expect(first.receipts.join('\n')).not.toMatch(/seals the pact|Level 2|XP Gained: 150/i);

    const second = applyOpeningRiteTurn(first.state, 'Look around');
    expect(second.state.openingRite?.done).toBeFalsy();
    expect(second.state.character.level).toBe(1);
    expect(second.receipts).toEqual([]);
  });

  it('does not invent a clash for non-fight XP', () => {
    const rite = ensureXpNarration('No one was there to answer.', [
      'XP Gained: 150 (opening rite: Opening Rite: The Pact)',
    ]);
    expect(rite).not.toMatch(/clash/i);
    expect(rite).toMatch(/You gain 150 XP/);

    const fight = ensureXpNarration('The hall went quiet.', [
      'XP Gained: 25 (defeated the shade)',
    ]);
    expect(fight).toMatch(/The clash leaves you wiser — you gain 25 XP/);
  });

  it('keeps Check System out of the four scene pads', () => {
    const state = { ...attachAsh(), turn: 1, openingEstablishment: { ...attachAsh().openingEstablishment!, sceneWritten: true } };
    const pads = assembleFourSlotPads(state, [
      'Check System',
      'Look around',
      'Wait and listen',
      'Travel toward Lowmarket',
    ]);
    expect(pads.some((c) => /^Check System/i.test(c))).toBe(false);
    const scene = pads.filter((c) => !/^(?:Say something|Do something else)/i.test(c));
    expect(scene).toHaveLength(4);
  });
});
