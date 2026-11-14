import { describe, expect, it } from 'vitest';
import type { OpeningPrompt } from '@/data/campaigns/types';
import { RACE_NAME_BANKS, type RaceNameKey } from '@/data/raceNameBanks';
import { createInitialState } from './defaults';
import { applyLedgerDeficit, applyOpeningAnswer, establishmentChoices, extractGivenName } from './openingEstablishment';
import { isDeniedPcName, isLockablePcName } from './pcNameAuthority';
import { pcNameRaceKey, pickPcDesignation, pickPcGivenName } from './pcNamePicker';
import { formatEstablishedOpeningScene, formatPcNameClashRail, formatPlayerPronounRail, personalNameTokens } from './openingWriterNotes';
import { pcPov } from './narrativePov';
import { isNameTitleWord } from './personNames';
import { fullNameAsWritten, sanitizeOpeningAnswer } from './openingEstablishment';
import { newGameState } from './newGameTestState';
import type { GameState } from './types';

const NAME_ONLY: OpeningPrompt[] = [{ id: 'name', kind: 'name', question: 'Confirm designation.', suggestions: ['Random designation'] }];

function cover(bibleId: string, seed = 'g-1'): GameState {
  const base = { ...createInitialState('Open', 'litrpg'), seed };
  return {
    ...base,
    campaignBibleId: bibleId,
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: NAME_ONLY,
      answers: {},
      complete: false,
      registrar: { voice: 'system', label: 'SYSTEM', startLine: 'Starting.' },
      sceneWritten: true,
      mode: 'weave',
    },
  } as GameState;
}

describe('per-race PC name bank', () => {
  it('every bank is a fixed table of 30–40 given names and 15–20 surnames, no repeats', () => {
    for (const [key, bank] of Object.entries(RACE_NAME_BANKS)) {
      expect(bank.given.length, key).toBeGreaterThanOrEqual(30);
      expect(bank.given.length, key).toBeLessThanOrEqual(40);
      expect(bank.surnames.length, key).toBeGreaterThanOrEqual(15);
      expect(bank.surnames.length, key).toBeLessThanOrEqual(20);
      expect(new Set(bank.given).size, key).toBe(bank.given.length);
      expect(new Set(bank.surnames).size, key).toBe(bank.surnames.length);
    }
  });

  it('every bank name can be locked as the player name and survives the name harvest', () => {
    for (const bank of Object.values(RACE_NAME_BANKS)) {
      for (const n of bank.given) {
        expect(isLockablePcName(n), n).toBe(true);
        expect(isDeniedPcName(n), n).toBe(false);
        expect(extractGivenName(n), n).toBe(n);
      }
      for (const s of bank.surnames) expect(isLockablePcName(`${bank.given[0]} ${s}`), s).toBe(true);
    }
  });

  it('picks the bank by race when known, else modern on Earth-origin campaigns and human elsewhere', () => {
    expect(pcNameRaceKey(cover('system-integration'))).toBe('modern');
    expect(pcNameRaceKey(cover('hero-awakening'))).toBe('human');
    const withSpecies = (species: string): RaceNameKey => {
      const s = cover('hero-awakening');
      return pcNameRaceKey({ ...s, openingEstablishment: { ...s.openingEstablishment!, answers: { species } } });
    };
    expect(withSpecies('Dwarf')).toBe('dwarf');
    expect(withSpecies('Half-Orc')).toBe('orc');
    expect(withSpecies('Beastfolk')).toBe('beastfolk');
    expect(withSpecies('Half-Elf')).toBe('elf');
    const s = cover('hero-awakening');
    expect(pcNameRaceKey({ ...s, character: { ...s.character, srd: { speciesId: 'tiefling' } } } as unknown as GameState)).toBe('tiefling');
    expect(pcNameRaceKey(undefined)).toBe('modern');
  });

  it('is seeded per game: same game same name, names vary across games', () => {
    const names = Array.from({ length: 20 }, (_, i) => pickPcGivenName(cover('hero-awakening', `seed-${i}`)));
    expect(new Set(names).size).toBeGreaterThan(5);
    for (let i = 0; i < 5; i++) {
      expect(pickPcGivenName(cover('hero-awakening', `seed-${i}`))).toBe(names[i]);
    }
    for (const n of names) expect(RACE_NAME_BANKS.human.given).toContain(n);
  });

  it('never offers a campaign NPC name', () => {
    const si = newGameState('system-integration', { seed: 's-1' });
    const npcWords = new Set(
      (si.npcMemories ?? []).flatMap((m) => m.npcName.toLowerCase().split(/\s+/))
    );
    expect(npcWords.size).toBeGreaterThan(0);
    // Crowd the bank: every modern name but one is an NPC, and the picker still finds the free one.
    const free = RACE_NAME_BANKS.modern.given[7]!;
    const crowded = {
      ...si,
      npcMemories: RACE_NAME_BANKS.modern.given
        .filter((n) => n !== free)
        .map((n, i) => ({ npcId: `x${i}`, npcName: `${n} Example`, disposition: 'neutral', facts: [], lastSeenTurn: 0 })),
    } as GameState;
    for (let i = 0; i < 10; i++) expect(pickPcGivenName({ ...crowded, seed: `c-${i}` })).toBe(free);
    for (let i = 0; i < 20; i++) {
      const n = pickPcGivenName({ ...si, seed: `n-${i}` });
      expect(npcWords.has(n.toLowerCase()), n).toBe(false);
    }
  });

  it('the name button on a cold SI cover is the seeded modern pick', () => {
    const state = cover('system-integration', 'si-7');
    const chips = establishmentChoices(NAME_ONLY, state);
    expect(chips.slice(0, 3)).toEqual(['Give your name', 'Refuse to give a name', 'Random designation']);
    expect(chips).toHaveLength(4);
    expect(chips[3]).toBe(pickPcGivenName(state));
    expect(RACE_NAME_BANKS.modern.given).toContain(chips[3]);
  });

  it('Random designation sets a full name from the bank; a typed name is never replaced', async () => {
    const state = cover('system-integration', 'si-9');
    const want = pickPcDesignation(state);
    const [given, ...rest] = want.split(' ');
    expect(RACE_NAME_BANKS.modern.given).toContain(given);
    expect(RACE_NAME_BANKS.modern.surnames).toContain(rest.join(' '));
    const { state: after } = await applyOpeningAnswer(state, 'Random designation');
    expect(after.openingEstablishment?.answers?.name).toBe(want);
    expect(after.openingEstablishment?.pending?.some((p) => p.kind === 'name')).toBe(false);
    expect(after.character.name).toBe(want);
    expect(pcPov(after.character).name).toBe(want);
    expect(formatPlayerPronounRail(after)).toContain(`${want}'s gender is not given`);
    const { state: typed } = await applyOpeningAnswer(cover('system-integration', 'si-9'), 'Mara');
    expect(typed.openingEstablishment?.answers?.name).toBe('Mara');
  });

  it('a player name shared with a story NPC tells the writer they are different people', () => {
    const si = newGameState('system-integration', { seed: 's-2' });
    const npc = si.npcMemories![0]!.npcName;
    // The NPC's own name word, not a leading title ("Warden Elise Cho" -> "Elise").
    const given = npc.split(' ').find((w) => !isNameTitleWord(w))!;
    const rail = formatPcNameClashRail({ ...si, character: { ...si.character, name: given } });
    expect(rail).toContain(`${given} is the player character`);
    expect(rail).toContain(npc);
    expect(rail).toMatch(/different person/);
    expect(formatPcNameClashRail({ ...si, character: { ...si.character, name: 'Zzyzx' } })).toBe('');
  });

  it('the clash note compares name words, not titles or articles, across roster, opening cast and bible NPCs', () => {
    const base = cover('hero-awakening');
    const mem = (npcName: string) => ({ npcId: npcName, npcName, disposition: 'neutral' as const, facts: [], lastSeenTurn: 0 });
    const withPc = (name: string, over: Partial<GameState> = {}) =>
      ({ ...base, ...over, character: { ...base.character, name } }) as GameState;
    const roster = { npcMemories: [mem('Warden Elise Cho'), mem('The Registrar')] };
    expect(formatPcNameClashRail(withPc('Elise', roster))).toContain('Warden Elise Cho in this story is a different person');
    expect(formatPcNameClashRail(withPc('The Smith', roster))).toBe('');
    expect(formatPcNameClashRail(withPc('Warden', roster))).toBe('');
    const cast = {
      openingEstablishment: {
        ...base.openingEstablishment!,
        instance: { placeName: 'Yard', placeKind: 'yard', cast: [{ name: 'Bram Hale', gender: 'male', role: 'guard' }], situation: '', offerChips: [], alone: false },
      },
    } as unknown as Partial<GameState>;
    expect(formatPcNameClashRail(withPc('Bram', cast))).toContain('Bram Hale');
    expect(formatPcNameClashRail(withPc('Ysolde'), ['Captain Ysolde Marr'])).toContain('Captain Ysolde Marr');
    expect(formatPcNameClashRail(withPc('Ysolde'))).toBe('');
  });

  const ACTION_LINES = [
    'Read the Panel', 'Search the Area', 'Climb the Wall', 'Use the Knife', 'Walk North', 'Open Door', 'Go West',
    'Follow Him', 'Check Status', 'Say Something', 'Talk To Rosel', 'Travel Toward Cracked Street', 'Check Your Level',
    'Pat Yourself Down', 'Do Something Else', 'Look Around', 'Run To The Door',
  ];

  it('action lines are never a full name; every bank designation is', () => {
    for (const line of ACTION_LINES) expect(fullNameAsWritten(line), line).toBeNull();
    for (const ok of ['Max Doyle', 'Brindle of the Long Grass', 'Teasel of the Ash Hollow']) expect(fullNameAsWritten(ok)).toBe(ok);
    for (const bank of Object.values(RACE_NAME_BANKS)) {
      for (const g of bank.given) for (const sur of bank.surnames) expect(fullNameAsWritten(`${g} ${sur}`)).toBe(`${g} ${sur}`);
    }
  });

  it('typing a full name on the name cover locks it; typed actions do not', async () => {
    const { state: typed } = await applyOpeningAnswer(cover('system-integration', 'si-4'), 'Max Doyle');
    expect(typed.character.name).toBe('Max Doyle');
    expect(typed.openingEstablishment?.answers?.name).toBe('Max Doyle');
    for (const line of ['Walk North', 'Read the Panel', 'Talk To Rosel']) {
      const { state: after } = await applyOpeningAnswer(cover('system-integration', 'si-4'), line);
      expect(after.character.name, line).toBe('Unknown Survivor');
      expect(after.openingEstablishment?.answers?.name, line).toBeFalsy();
    }
  });

  it('a bare action typed at the name cover is play, not a name; framed gives and real names still lock', async () => {
    for (const line of ['Run', 'Open', 'Search', 'Hide', 'Duck']) {
      const r = await applyOpeningAnswer(cover('system-integration', 'si-5'), line);
      expect(r.state.character.name, line).toBe('Unknown Survivor');
      expect(r.deferToPlay, line).toBe(true);
      expect(r.state.openingEstablishment?.pending?.[0]?.kind, line).toBe('name');
    }
    for (const [line, want] of [['Call me Run', 'Run'], ['my name is Run', 'Run'], ['Mara', 'Mara'], ['Kai', 'Kai'], ['Max Doyle', 'Max Doyle']]) {
      const r = await applyOpeningAnswer(cover('system-integration', 'si-5'), line);
      expect(r.state.character.name, line).toBe(want);
    }
    for (const bank of Object.values(RACE_NAME_BANKS)) {
      for (const n of bank.given) {
        const r = await applyOpeningAnswer(cover('system-integration', 'si-5'), n);
        expect(r.state.character.name, n).toBe(n);
      }
    }
  });

  it('the ledger name heal never takes a bare action as the name', async () => {
    const complete = (seed: string): GameState => {
      const c = cover('system-integration', seed);
      return { ...c, openingEstablishment: { ...c.openingEstablishment!, pending: [], complete: true } };
    };
    // (a) Opening complete, name still unlocked.
    for (const line of ['Run', 'Hide']) {
      const r = await applyOpeningAnswer(complete('led-1'), line);
      expect(r.state.character.name, line).toBe('Unknown Survivor');
      expect(applyLedgerDeficit(complete('led-1'), line).character.name, line).toBe('Unknown Survivor');
    }
    for (const [line, want] of [['Mara', 'Mara'], ['Call me Run', 'Run'], ['My name is Jax.', 'Jax']]) {
      expect(applyLedgerDeficit(complete('led-2'), line).character.name, line).toBe(want);
    }
    // (b) Name cover pending before page 1 is written.
    const unwritten = (): GameState => {
      const c = cover('system-integration', 'led-3');
      return { ...c, openingEstablishment: { ...c.openingEstablishment!, sceneWritten: false } };
    };
    for (const line of ['Run', 'Hide']) {
      const r = await applyOpeningAnswer(unwritten(), line);
      expect(r.state.character.name, line).toBe('Unknown Survivor');
      expect(r.state.openingEstablishment?.answers?.name, line).toBeFalsy();
      expect(r.state.openingEstablishment?.pending?.some((p) => p.kind === 'name'), line).toBe(true);
    }
  });

  it('Dr is a title, not a clash word', () => {
    expect(personalNameTokens('Dr. Yusuf Okafor')).toEqual(['yusuf', 'okafor']);
    expect(personalNameTokens('Dr Yusuf Okafor')).toEqual(['yusuf', 'okafor']);
  });

  it('a typed full name is kept whole; a typed sentence is not a name', () => {
    expect(sanitizeOpeningAnswer('name', 'Max Doyle').text).toBe('Max Doyle');
    expect(sanitizeOpeningAnswer('name', 'Brindle of the Long Grass').text).toBe('Brindle of the Long Grass');
    expect(sanitizeOpeningAnswer('name', 'my name is Mara').text).toBe('Mara');
    expect(sanitizeOpeningAnswer('name', 'what is this place').text).toBe('');
    expect(sanitizeOpeningAnswer('name', 'I refuse').text).toBe('');
  });

  it('the established scene line is campaign-neutral (no Registration on every campaign)', () => {
    const si = newGameState('hero-awakening', { seed: 's-3' });
    const inst = { placeName: 'The Yard', placeKind: 'yard', cast: [], situation: 'yard', offerChips: [], alone: true };
    const text = formatEstablishedOpeningScene({
      ...si,
      currentLocation: 'The Yard',
      openingEstablishment: { ...si.openingEstablishment!, sceneWritten: true, sceneProse: 'Page one.', instance: inst },
    } as unknown as GameState);
    expect(text).toMatch(/ESTABLISHED SCENE/);
    expect(text).not.toMatch(/Registration/);
  });
});
