/**
 * T10C — compound typed input: every clause reaches the writer; speech only to people present;
 * PC quoted words are exact facts (never rewritten by the hand-off). Offline, no paid AI.
 */
import { describe, expect, it } from 'vitest';
import { parsePlayerSteps, sheetContextFromState } from './intentParser';
import { resolveTypedFreeText } from './typedFreeText';
import { checkActionFollowed } from './turnCheck';
import type { GameState } from './types';

function base(over: Partial<GameState> = {}): GameState {
  return {
    turn: 6,
    currentLocation: 'the back streets',
    engineMode: 'litrpg',
    character: {
      name: 'Jax',
      hp: 10,
      maxHp: 12,
      xp: 0,
      level: 1,
      xpToNext: 300,
      gender: 'neutral',
      attributes: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      conditions: [],
    },
    inventory: [
      { id: 'c', name: 'The clothes you had on when the light took you', equipped: true, quantity: 1 },
      { id: 'b', name: 'Bag', equipped: false, quantity: 1 },
      { id: 'k', name: 'cloak', equipped: false, quantity: 1 },
      { id: 'p', name: 'pass', equipped: false, quantity: 1 },
    ],
    gold: 0,
    npcMemories: [
      {
        npcId: 'n',
        npcName: 'Nomi Vale',
        disposition: 'unknown',
        met: false,
        facts: [],
        said: [],
        completedTopics: [],
      },
    ],
    log: [],
    places: [],
    sceneFacts: {
      crowd: 'empty',
      noise: 'quiet',
      present: [],
      props: [],
      lastBeat: '',
      lastAddressee: 'Nomi Vale',
      updatedTurn: 6,
    },
    quests: [],
    ...over,
  } as unknown as GameState;
}

function storyBase(over: Partial<GameState> = {}): GameState {
  return base({
    engineMode: 'rpg',
    currentLocation: 'Salt Road Waystation',
    sceneFacts: {
      crowd: 'present',
      noise: 'voices',
      present: ['Vessa'],
      props: ['table'],
      lastBeat: '',
      lastAddressee: 'Vessa',
      updatedTurn: 3,
    },
    npcMemories: [
      {
        npcId: 'v',
        npcName: 'Vessa',
        disposition: 'unknown',
        met: true,
        facts: [],
        said: [],
        completedTopics: [],
      },
      {
        npcId: 'y',
        npcName: 'Yara Flint',
        disposition: 'unknown',
        met: false,
        facts: [],
        said: [],
        completedTopics: [],
      },
    ],
    inventory: [{ id: 't', name: 'crew token', equipped: false, quantity: 1, rarity: 'Common' }],
    ...over,
  });
}

describe('T10C compound typed reader/writer hand-off', () => {
  it('boot gift: reader keeps act+quote; writer facts are already-shown consequence only', () => {
    const line =
      "I take off one boot, set it on the nearest doorstep as a toll gift, and say, 'For whoever lives here, thank you for the hospitality.'";
    const s = base();
    const read = parsePlayerSteps(line, sheetContextFromState(s));
    const res = resolveTypedFreeText(s, line);
    expect(read.steps.some((st) => st.action === 'take')).toBe(true);
    expect(read.steps.some((st) => /hospitality/i.test(st.say ?? '') || /hospitality/i.test(st.clause ?? ''))).toBe(
      true,
    );
    // T10ECHO — writer facts never restate boot/gift/quote wording (UI already shows it).
    expect(res.facts.some((f) => /already shown; do not restate/i.test(f))).toBe(true);
    expect(res.facts.some((f) => /PC says exactly: \(already shown/i.test(f))).toBe(true);
    expect(res.facts.join('\n')).not.toMatch(/toll gift|thank you for the hospitality/i);
    expect(res.engineResult).not.toMatch(/Nomi Vale/i);
    expect(res.facts.some((f) => /No one present to answer/i.test(f))).toBe(true);
  });

  it('shout at empty windows: empty-scene speech is followed when prose shows nobody answers', () => {
    const line =
      "I hold both hands up toward the shuttered windows, say loudly that I'm only a traveler with no pass, and rap twice on the nearest door.";
    const s = base({ turn: 5 });
    const res = resolveTypedFreeText(s, line);
    // T10ECHO — Must narrate marks already-shown; act wording stays off writer facts.
    expect(res.facts.some((f) => /Must narrate: \[already shown/i.test(f))).toBe(true);
    expect(res.facts.join('\n')).not.toMatch(/hands up|shuttered|rap twice/i);
    expect(res.engineResult).not.toMatch(/Nomi Vale/i);
    const prose =
      "Jax lifted both hands toward the shuttered windows and called out that they were only a traveler with no pass, then rapped twice on the nearest door. The knock landed flat, and nobody answered.";
    const check = checkActionFollowed(s, s, line, prose);
    expect(check.p0.map((f) => f.kind)).not.toContain('ignored-action');
  });

  it('juggling + empty street: reader keeps act+quote; writer facts are already-shown + empty scene', () => {
    const line =
      "I sit on the curb, start juggling three pebbles, and say to the empty street, 'Best show in Valespire, no ticket needed.'";
    const s = base({ turn: 7 });
    const read = parsePlayerSteps(line, sheetContextFromState(s));
    const res = resolveTypedFreeText(s, line);
    expect(read.steps.every((st) => !/Nomi Vale/i.test(st.addressee ?? ''))).toBe(true);
    expect(res.facts.some((f) => /already shown; do not restate/i.test(f))).toBe(true);
    expect(res.facts.some((f) => /PC says exactly: \(already shown/i.test(f))).toBe(true);
    expect(res.facts.join('\n')).not.toMatch(/juggl|pebbles|Best show in Valespire/i);
    expect(res.engineResult).toMatch(/empty scene|No one present to answer/i);
    expect(res.engineResult).not.toMatch(/Nomi Vale/i);
  });

  it('name + ask Vessa + wink: each clause is a fact; Vessa reaction; wink not restated in writer input', () => {
    const line =
      "I say 'Jax,' lean on the table and ask Vessa what the cutter job pays, while giving the nearest watchman a slow wink.";
    const s = storyBase();
    const read = parsePlayerSteps(line, sheetContextFromState(s));
    const res = resolveTypedFreeText(s, line);
    expect(read.steps.length).toBeGreaterThanOrEqual(2);
    expect(res.facts.some((f) => /PC says exactly: \(already shown/i.test(f))).toBe(true);
    expect(res.facts.some((f) => /Vessa/i.test(f) && /reaction slot/i.test(f))).toBe(true);
    // T10ECHO — wink clause is already-shown Must narrate without the word "wink".
    expect(res.facts.some((f) => /Must narrate: \[already shown/i.test(f))).toBe(true);
    expect(res.facts.join('\n')).not.toMatch(/\bwink\b/i);
    expect(res.engineResult).not.toMatch(/Yara Flint/i);
  });

  it('crew token slide + exact ask who pays Yara: speech to Vessa not Yara; act wording off writer facts', () => {
    const line =
      "I slide the crew token across the table to Vessa and say, 'Nobody sent me but you, with that pouch. Now tell me who pays Yara.'";
    const s = storyBase({ turn: 9 });
    const read = parsePlayerSteps(line, sheetContextFromState(s));
    const res = resolveTypedFreeText(s, line);
    expect(res.facts.some((f) => /already shown; do not restate/i.test(f))).toBe(true);
    expect(res.facts.some((f) => /PC says exactly: \(already shown/i.test(f))).toBe(true);
    expect(res.facts.join('\n')).not.toMatch(/crew token|Nobody sent me but you/i);
    const speechTo = read.steps.filter((st) => st.action === 'talk' || !!st.say);
    expect(speechTo.every((st) => !st.addressee || /Vessa/i.test(st.addressee))).toBe(true);
    expect(res.engineResult).not.toMatch(/Speech event: you address Yara/i);
  });
});

