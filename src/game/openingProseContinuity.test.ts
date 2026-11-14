/**
 * Live check 14 Nov (PR43, gm-turn v399), System Integration:
 * (1) page 1 put the System-Issue Survival Knife in the player's hands before Registration;
 * (2) an ungendered name ("Sam") came back as "he";
 * (3) after Register the scene jumped from a traffic jam under an overpass to rubble and storefronts.
 * These check what the writer is HANDED (prompt text), not the prose it writes.
 */
import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import { buildNewGameState } from './fateAutoplay';
import { attachOpeningInstance, snapshotFromPickedHook } from './openingInstance';
import { resolveOpeningHookPick } from './openingEstablishment';
import { applyOpeningRiteTurn, ensureOpeningRite } from './openingRite';
import { applySuccessfulLiveOpening } from './liveOpening';
import { formatOpeningWriterNotes } from './openingWriterNotes';
import { buildContextPrompt, buildFactLeafSystemPrompt } from './masterPrompt';
import type { GameState, LogEntry, Settings } from './types';

const settings = { contentMode: 'adult' } as Settings;
const KNIFE = 'System-Issue Survival Knife';
const PAGE1 =
  'The engine had been dead four minutes when the registration notice arrived. Three lanes of cars stood stopped nose to tail beneath the overpass, brake lights bleeding red onto the wet asphalt. A man in the next car over scrolled his phone with his thumb.';

function siPageOne(name = 'Mara', gender?: string): GameState {
  const { state } = buildNewGameState({ bibleId: 'system-integration', characterName: name, seed: 7, personality: 'default', engineMode: 'litrpg' });
  const picked = resolveOpeningHookPick(getCampaignBibleById('system-integration')!, String(state.seed));
  const s = ensureOpeningRite(attachOpeningInstance(state, snapshotFromPickedHook(picked), picked?.text));
  return {
    ...s,
    character: { ...s.character, name, ...(gender ? { gender } : {}) },
    openingEstablishment: { ...s.openingEstablishment!, sceneWritten: false },
  } as GameState;
}

/** What the page-1 writer gets: the system prompt plus the user packet (built on the edge from state). */
function pageOnePrompt(s: GameState): string {
  return `${buildFactLeafSystemPrompt(s, settings)}\n\n${buildContextPrompt(s, formatOpeningWriterNotes(s))}`;
}

function afterPageOne(s: GameState): GameState {
  const applied = applySuccessfulLiveOpening(s, PAGE1, { pads: ['Register as Mara', 'Refuse to register', 'Look around', 'Wait and listen'] });
  const gm: LogEntry = { id: 'g1', turn: s.turn, role: 'gm', content: PAGE1, timestamp: 1 };
  return { ...applied, turn: (s.turn ?? 0) + 1, log: [...(applied.log ?? []), gm] } as GameState;
}

function registered(s: GameState): GameState {
  const done = applyOpeningRiteTurn(s, 'Register as Mara').state;
  const p: LogEntry = { id: 'p2', turn: done.turn, role: 'player', content: 'Register as Mara', timestamp: 2 };
  return { ...done, log: [...done.log, p] } as GameState;
}

describe('rite-granted kit reaches the writer only after the rite', () => {
  it('page 1 (rite open): the knife is not in hand, worn, a scene item or a ref; it is only issued on registration', () => {
    const s = siPageOne();
    expect(s.openingRite?.done).toBe(false);
    expect((s.inventory ?? []).some((i) => i.name === KNIFE)).toBe(true);
    const text = pageOnePrompt(s);
    expect(text).not.toMatch(new RegExp(`PC gear:[^\\n]*${KNIFE}`));
    expect(text).not.toMatch(new RegExp(`ITEMS:[^\\n]*${KNIFE}`));
    expect(text).not.toMatch(/kit:system-issue-survival-knife/);
    expect(text).toMatch(new RegExp(`OPENING RITE[^\\n]*not registered yet[^\\n]*${KNIFE}`, 'i'));
  });

  it('after Register (rite done): the knife is the player\'s on the writer sheet', () => {
    const text = buildContextPrompt(registered(afterPageOne(siPageOne())), 'Register as Mara');
    expect(text).toMatch(new RegExp(`PC gear:[^\\n]*${KNIFE}`));
    expect(text).not.toMatch(/not registered yet/i);
  });
});

describe('an ungendered player name gets they/them or the name, never a guessed he/she', () => {
  it('no gender given: the system prompt and the packet both say so', () => {
    const text = pageOnePrompt(siPageOne('Sam'));
    const rule = /Sam's gender is not given: call Sam by name or they\/them\/their\. Never he\/him or she\/her for Sam\./;
    expect(buildFactLeafSystemPrompt(siPageOne('Sam'), settings)).toMatch(rule);
    expect(buildContextPrompt(siPageOne('Sam'), '(opening)')).toMatch(rule);
    expect(text).toMatch(rule);
  });

  it('a given gender keeps its pronouns and gets no such line', () => {
    const text = pageOnePrompt(siPageOne('Sam', 'man'));
    expect(text).not.toMatch(/gender is not given/);
    expect(text).toMatch(/Call them Sam and he\/him\/his/);
  });
});

describe('the post-rite writer is handed the scene page 1 established', () => {
  it('Register turn: the packet carries the opening place and what page 1 showed', () => {
    const s = registered(afterPageOne(siPageOne()));
    const inst = s.openingEstablishment?.instance;
    const text = buildContextPrompt(s, 'Register as Mara');
    expect(text).toMatch(/ESTABLISHED SCENE/);
    expect(text).toContain(`${inst!.placeName} (${inst!.placeKind})`);
    expect(text).toContain('beneath the overpass');
  });

  it('once the player has moved on, page 1 is no longer handed as the scene here', () => {
    const s = registered(afterPageOne(siPageOne()));
    const moved = {
      ...s,
      currentLocation: 'Cracked Street',
      circling: { ...(s.circling ?? {}), lastLocation: 'Cracked Street', prevPlace: s.currentLocation },
    } as GameState;
    expect(buildContextPrompt(moved, 'Look around')).not.toMatch(/ESTABLISHED SCENE/);
  });
});
