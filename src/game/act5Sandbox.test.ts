/**
 * Act-5 all-LitRPG sandbox floor — hubs ≥6, faction seed, uniqueness per bible.
 */
import { describe, expect, it } from 'vitest';
import { hubsForBibleId } from './outdoorHubs';
import { pickHubArrivalBeat, resolveHubArrival } from './hubEncounters';
import {
  FACTION_CONTACTS,
  mutateFactionOnQuestEvent,
  seedFactionStandingsForBible,
} from './factionStandings';
import { revealQuestsFromBanks, seedLocalStarterQuest } from './questPlay';
import { createInitialState } from './defaults';
import { inkboundAcademy, hollowCore, ascendingSpire, gatebreakWard } from '@/data/campaigns/premades';
import { voidAudience } from '@/data/campaigns/voidAudience';
import { dungeonTransport } from '@/data/campaigns/dungeonTransport';
import { systemIntegration } from '@/data/campaigns/systemIntegration';
import { fabledLegacy } from '@/data/campaigns/fabledLegacy';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { heroAwakening } from '@/data/campaigns/heroAwakening';
import { blankCanvas } from '@/data/campaigns/premades';

const LITRPG_IDS = [
  'summoned-pact',
  'hero-awakening',
  'system-integration',
  'gatebreak-ward',
  'ascending-spire',
  'fabled-legacy',
  'inkbound-academy',
  'void-audience',
  'hollow-core',
  'dungeon-transport',
] as const;

const BIBLES = {
  'summoned-pact': summonedPact,
  'hero-awakening': heroAwakening,
  'system-integration': systemIntegration,
  'gatebreak-ward': gatebreakWard,
  'ascending-spire': ascendingSpire,
  'fabled-legacy': fabledLegacy,
  'inkbound-academy': inkboundAcademy,
  'void-audience': voidAudience,
  'hollow-core': hollowCore,
  'dungeon-transport': dungeonTransport,
} as const;

describe('Act-5 all LitRPG sandbox floor', () => {
  it('every LitRPG premade (except blank) has ≥6 hubs and faction seed', () => {
    for (const id of LITRPG_IDS) {
      const hubs = hubsForBibleId(id);
      expect(hubs.length, id + ' hubs').toBeGreaterThanOrEqual(6);
      expect(hubs.length, id + ' hub cap').toBeLessThanOrEqual(12);
      expect(hubs.some((h) => /fable|albion|fallout|megaton|whiterun/i.test(h.name))).toBe(false);
      const factions = seedFactionStandingsForBible(BIBLES[id]);
      expect(factions.length, id + ' factions').toBeGreaterThanOrEqual(2);
    }
    expect(hubsForBibleId('blank-canvas')).toEqual([]);
    expect(seedFactionStandingsForBible(blankCanvas)).toEqual([]);
  });

  it('Inkbound hubs are campus — not Lowmarket / Valespire clones', () => {
    const names = hubsForBibleId('inkbound-academy').map((h) => h.name);
    expect(names).toContain('Quill Dormitory');
    expect(names).toContain('House Ledger Hall');
    expect(names.some((n) => /lowmarket|valespire|cinderflow|ashline/i.test(n))).toBe(false);
  });

  it('Void / Hollow / Transport hubs match their motifs', () => {
    expect(hubsForBibleId('void-audience').some((h) => /Threshold|Auditor|Resonance|Gallery/i.test(h.name))).toBe(true);
    expect(hubsForBibleId('hollow-core').some((h) => /Core|Hollow|Excavation|Spawn/i.test(h.name))).toBe(true);
    expect(hubsForBibleId('dungeon-transport').some((h) => /Safe Room|Transit|Seam|Floor/i.test(h.name))).toBe(true);
  });

  it('floored zeros resolve arrival beats with bible contacts', () => {
    const ink = {
      ...createInitialState('Act5', 'litrpg'),
      campaignBibleId: 'inkbound-academy',
      openingEstablishment: { pending: [], answers: {}, complete: true, sceneWritten: true },
      currentLocation: 'Quill Dormitory',
      sandboxAwardKeys: [] as string[],
    };
    const resolved = resolveHubArrival(ink, ink.currentLocation);
    expect(resolved?.hub.id).toBe('ia-hub-dorm');
    expect(resolved?.beat.pressure.length).toBeGreaterThan(10);
    expect(FACTION_CONTACTS.some((c) => c.name === 'Jori Ashquill')).toBe(true);
    expect(FACTION_CONTACTS.some((c) => c.name === 'Whisper-Mite')).toBe(true);
    expect(FACTION_CONTACTS.some((c) => c.name === 'Scratch')).toBe(true);
  });

  it('densified SI / FL quest events move bible factions', () => {
    const si = seedFactionStandingsForBible(systemIntegration);
    const afterSi = mutateFactionOnQuestEvent(si, 'si-quest-2', 'complete');
    expect(afterSi.find((f) => f.id === 'riverside-stronghold')!.influence).toBeGreaterThan(0);

    const fl = seedFactionStandingsForBible(fabledLegacy);
    const afterFl = mutateFactionOnQuestEvent(fl, 'fl-quest-1', 'complete');
    expect(afterFl.find((f) => f.id === 'mossford-village')!.influence).toBeGreaterThan(0);
  });

  it('Inkbound / Void side reveals fire from bible keywords', () => {
    let ia = seedLocalStarterQuest([], inkboundAcademy.starterQuests);
    ia = revealQuestsFromBanks(ia, 'Jori Ashquill talks about the Orientation Trial and Class Codex');
    expect(ia.find((q) => q.id === 'inkbound-academy-quest-1')!.revealed).toBe(true);

    let va = seedLocalStarterQuest([], voidAudience.starterQuests);
    va = revealQuestsFromBanks(va, 'Pellara offers Threshold Inn chores');
    expect(va.find((q) => q.id === 'va-quest-2')!.revealed).toBe(true);
  });

  it('Tier-1 Inkbound soft pool skips threat; Hollow border includes threat', () => {
    const dorm = hubsForBibleId('inkbound-academy').find((h) => h.id === 'ia-hub-dorm')!;
    const softKinds = [0, 1, 2].map((v) => pickHubArrivalBeat(dorm, v, 'inkbound-academy')!.kind);
    expect(softKinds.every((k) => k !== 'threat')).toBe(true);
    const border = hubsForBibleId('hollow-core').find((h) => h.id === 'hc-hub-border')!;
    const hot = [0, 1, 2].map((v) => pickHubArrivalBeat(border, v, 'hollow-core')!.kind);
    expect(hot).toContain('threat');
  });
});
