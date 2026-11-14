import { describe, expect, it } from 'vitest';
import type { OpeningPrompt } from '@/data/campaigns/types';
import { RACE_NAME_BANKS, type RaceNameKey } from '@/data/raceNameBanks';
import { createInitialState } from './defaults';
import { applyOpeningAnswer, establishmentChoices, extractGivenName } from './openingEstablishment';
import { isDeniedPcName, isLockablePcName } from './pcNameAuthority';
import { pcNameRaceKey, pickPcDesignation, pickPcGivenName } from './pcNamePicker';
import { formatEstablishedOpeningScene, formatPcNameClashRail } from './openingWriterNotes';
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
    const { state: typed } = await applyOpeningAnswer(cover('system-integration', 'si-9'), 'Mara');
    expect(typed.openingEstablishment?.answers?.name).toBe('Mara');
  });

  it('a player name shared with a story NPC tells the writer they are different people', () => {
    const si = newGameState('system-integration', { seed: 's-2' });
    const npc = si.npcMemories![0]!.npcName;
    const given = npc.split(' ')[0]!;
    const rail = formatPcNameClashRail({ ...si, character: { ...si.character, name: given } });
    expect(rail).toContain(`${given} is the player character`);
    expect(rail).toContain(npc);
    expect(rail).toMatch(/different person/);
    expect(formatPcNameClashRail({ ...si, character: { ...si.character, name: 'Zzyzx' } })).toBe('');
  });

  it('the established scene line is campaign-neutral (no Registration on every campaign)', () => {
    const si = newGameState('hero-awakening', { seed: 's-3' });
    const inst = { placeName: 'The Yard', placeKind: 'yard', cast: [], situation: 'yard', offerChips: [], alone: true };
    const text = formatEstablishedOpeningScene({
      ...si,
      currentLocation: 'The Yard',
      openingEstablishment: { ...si.openingEstablishment!, sceneWritten: true, sceneProse: 'Page one.', instance: inst },
    } as GameState);
    expect(text).toMatch(/ESTABLISHED SCENE/);
    expect(text).not.toMatch(/Registration/);
  });
});
