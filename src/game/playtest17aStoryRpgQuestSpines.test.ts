/**
 * Story RPG main-quest spines from Gemini Pro web (clipboard paste, 2026-09-17).
 * Mid OFF. No SNAPSHOT/CRAFT. No new combat FSM. No invented spines.
 */
import { describe, expect, it } from 'vitest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import {
  glassHarborLetters,
  hearthwickTeas,
  saltRoadHeist,
} from '@/data/campaigns/premades';
import { OPENING_HOOK_DECKS } from '@/data/campaigns/openingHookDecks';
import {
  STORY_RPG_MAIN_SPINES,
  matchStoryRpgMainSpine,
} from '@/data/quests/storyRpgMainSpines';
import { withMatchedLitRpgSpine } from '@/data/quests/litrpgMainSpines';
import { revealLocalStarterQuest } from './questPlay';

const BIBLES = [
  'salt-road-heist',
  'glass-harbor-letters',
  'embercourt-oath',
  'rainglass-case',
  'static-house',
  'driftwake-crew',
  'ashline-convoy',
  'twin-lanterns',
  'redmesa-claim',
  'cape-district-vigil',
  'wayfarers-map',
  'hearthwick-teas',
] as const;

describe('playtest17d — Story RPG quest spines', () => {
  it('Mid writer OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('has 12 bibles and 37 unique Gemini spines', () => {
    expect(new Set(STORY_RPG_MAIN_SPINES.map((s) => s.bibleId)).size).toBe(12);
    expect(STORY_RPG_MAIN_SPINES).toHaveLength(37);
    const ids = STORY_RPG_MAIN_SPINES.map((s) => s.spineId);
    expect(new Set(ids).size).toBe(37);
    for (const id of BIBLES) {
      const n = STORY_RPG_MAIN_SPINES.filter((s) => s.bibleId === id).length;
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(4);
    }
    const dump = JSON.stringify(STORY_RPG_MAIN_SPINES);
    expect(dump).not.toMatch(/\bVane\b/);
    expect(dump).not.toMatch(/Ash Compact|Tide Covenant|Hearthborn|Lanternfolk|Saltkin|Stonevein/);
  });

  it('counting-house hook reveals The Ledger Job, not Case the Caravan', () => {
    const card = OPENING_HOOK_DECKS['salt-road-heist'].find((c) => /counting-house/i.test(c.location ?? ''));
    expect(card).toBeTruthy();
    const hay = `${card?.location}\n${card?.page1}\n${card?.text}`;
    const spine = matchStoryRpgMainSpine('salt-road-heist', hay, card?.location);
    expect(spine?.spineId).toBe('sr-spine-counting-house-crack');
    expect(spine?.title).toBe('The Ledger Job');
    const quests = revealLocalStarterQuest(
      [],
      withMatchedLitRpgSpine(saltRoadHeist.starterQuests, {
        bibleId: 'salt-road-heist',
        hookBlob: hay,
        seed: '17a-sr',
        location: card?.location,
      }),
      false
    );
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('sr-spine-counting-house-crack');
    expect(visible[0]?.name).toBe('The Ledger Job');
    expect(visible[0]?.location).toBe('Alley behind the Counting-House');
    expect(visible.some((q) => /Case the Caravan/i.test(q.name))).toBe(false);
  });

  it('cafe wet-envelope hook reveals Ink in the Rain', () => {
    const card = OPENING_HOOK_DECKS['glass-harbor-letters'].find((c) => /cafe/i.test(c.location ?? ''));
    const hay = `${card?.location}\n${card?.text}`;
    const spine = matchStoryRpgMainSpine('glass-harbor-letters', hay, card?.location);
    expect(spine?.spineId).toBe('gh-spine-wet-envelope');
    const quests = revealLocalStarterQuest(
      [],
      withMatchedLitRpgSpine(glassHarborLetters.starterQuests, {
        bibleId: 'glass-harbor-letters',
        hookBlob: hay,
        seed: '17a-gh',
        location: card?.location,
      }),
      false
    );
    expect(quests.find((q) => q.revealed)?.name).toBe('Ink in the Rain');
  });

  it('hearthwick alley hook reveals The Peeping Tom', () => {
    const card = OPENING_HOOK_DECKS['hearthwick-teas'].find((c) => /alley/i.test(c.location ?? ''));
    const hay = `${card?.location}\n${card?.text}`;
    const spine = matchStoryRpgMainSpine('hearthwick-teas', hay, card?.location);
    expect(spine?.spineId).toBe('ht-spine-alley-shadow');
    const quests = revealLocalStarterQuest(
      [],
      withMatchedLitRpgSpine(hearthwickTeas.starterQuests, {
        bibleId: 'hearthwick-teas',
        hookBlob: hay,
        seed: '17a-ht',
        location: card?.location,
      }),
      false
    );
    expect(quests.find((q) => q.revealed)?.name).toBe('The Peeping Tom');
  });

  it('unknown family does not invent a spine', () => {
    const spine = matchStoryRpgMainSpine('salt-road-heist', 'A quiet plaza with pigeons and a baker.', 'quiet plaza');
    expect(spine).toBeNull();
  });
});
