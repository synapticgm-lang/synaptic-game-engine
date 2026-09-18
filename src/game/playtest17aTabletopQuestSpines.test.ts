/**
 * Tabletop main-quest spines from Gemini Pro web (2026-09-17).
 * Mid OFF. No SNAPSHOT/CRAFT. No new combat FSM. No invented spines.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { cursedKeep } from '@/data/campaigns/cursedKeep';
import { millstoneRoad, verdantBlight } from '@/data/campaigns/premades';
import { OPENING_HOOK_DECKS } from '@/data/campaigns/openingHookDecks';
import {
  TABLETOP_MAIN_SPINES,
  matchTabletopMainSpine,
} from '@/data/quests/tabletopMainSpines';
import { withMatchedLitRpgSpine } from '@/data/quests/litrpgMainSpines';
import { revealLocalStarterQuest } from './questPlay';

const BIBLES = [
  'cursed-keep',
  'millstone-road',
  'broken-crown-keep',
  'verdant-blight',
  'stillroot-veil',
  'shattered-coast',
] as const;

describe('playtest17e — Tabletop quest spines', () => {
  it('HUD/BUILD are 17e, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-18a');
    expect(BUILD_STAMP).toBe('2026-09-18a');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('has 6 bibles and 24 unique Gemini spines', () => {
    expect(new Set(TABLETOP_MAIN_SPINES.map((s) => s.bibleId)).size).toBe(6);
    expect(TABLETOP_MAIN_SPINES).toHaveLength(24);
    const ids = TABLETOP_MAIN_SPINES.map((s) => s.spineId);
    expect(new Set(ids).size).toBe(24);
    for (const id of BIBLES) {
      expect(TABLETOP_MAIN_SPINES.filter((s) => s.bibleId === id)).toHaveLength(4);
    }
    const dump = JSON.stringify(TABLETOP_MAIN_SPINES);
    expect(dump).not.toMatch(/\bVane\b/);
    expect(dump).not.toMatch(/Ash Compact|Tide Covenant|Hearthborn|Lanternfolk|Saltkin|Stonevein/);
    expect(dump).not.toMatch(/Forgotten Realms|Waterdeep|Barovia|Phandelver|Illithid|Owlbear/);
  });

  it('well-at-midnight hook reveals The Tainted Waters, not The Woodcutter\'s Plea', () => {
    const card = OPENING_HOOK_DECKS['cursed-keep'].find((c) => /well at midnight/i.test(c.location ?? ''));
    expect(card).toBeTruthy();
    const hay = `${card?.location}\n${card?.page1}\n${card?.text}`;
    const spine = matchTabletopMainSpine('cursed-keep', hay, card?.location);
    expect(spine?.spineId).toBe('ck-spine-midnight-well');
    expect(spine?.title).toBe('The Tainted Waters');
    const quests = revealLocalStarterQuest(
      [],
      withMatchedLitRpgSpine(cursedKeep.starterQuests, {
        bibleId: 'cursed-keep',
        hookBlob: hay,
        seed: '17e-ck',
        location: card?.location,
      }),
      false
    );
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('ck-spine-midnight-well');
    expect(visible[0]?.name).toBe('The Tainted Waters');
    expect(visible[0]?.location).toBe('Midnight Well');
    expect(visible.some((q) => /Woodcutter/i.test(q.name))).toBe(false);
  });

  it('muddy-road hook reveals Discarded Steel, not Deliver to Millstone Ford', () => {
    const card = OPENING_HOOK_DECKS['millstone-road'].find((c) => /muddy road/i.test(c.location ?? ''));
    const hay = `${card?.location}\n${card?.text}`;
    const spine = matchTabletopMainSpine('millstone-road', hay, card?.location);
    expect(spine?.spineId).toBe('mr-spine-muddy-loss');
    const quests = revealLocalStarterQuest(
      [],
      withMatchedLitRpgSpine(millstoneRoad.starterQuests, {
        bibleId: 'millstone-road',
        hookBlob: hay,
        seed: '17e-mr',
        location: card?.location,
      }),
      false
    );
    expect(quests.find((q) => q.revealed)?.name).toBe('Discarded Steel');
    expect(quests.some((q) => q.revealed && /Deliver to Millstone/i.test(q.name))).toBe(false);
  });

  it('blight farm-lane hook reveals The Boy in the Wood', () => {
    const card = OPENING_HOOK_DECKS['verdant-blight'].find((c) => /farm lane/i.test(c.location ?? ''));
    const hay = `${card?.location}\n${card?.text}`;
    const spine = matchTabletopMainSpine('verdant-blight', hay, card?.location);
    expect(spine?.spineId).toBe('vb-spine-walking-oaks');
    const quests = revealLocalStarterQuest(
      [],
      withMatchedLitRpgSpine(verdantBlight.starterQuests, {
        bibleId: 'verdant-blight',
        hookBlob: hay,
        seed: '17e-vb',
        location: card?.location,
      }),
      false
    );
    expect(quests.find((q) => q.revealed)?.name).toBe('The Boy in the Wood');
  });

  it('unknown family does not invent a spine', () => {
    const spine = matchTabletopMainSpine('cursed-keep', 'A quiet plaza with pigeons and a baker.', 'quiet plaza');
    expect(spine).toBeNull();
  });

  it('washed-out Greyhollow road keeps the old starter', () => {
    const card = OPENING_HOOK_DECKS['cursed-keep'].find((c) => /washed-out road/i.test(c.location ?? ''));
    const hay = `${card?.location}\n${card?.page1}\n${card?.text}`;
    expect(matchTabletopMainSpine('cursed-keep', hay, card?.location)).toBeNull();
    const quests = revealLocalStarterQuest(
      [],
      withMatchedLitRpgSpine(cursedKeep.starterQuests, {
        bibleId: 'cursed-keep',
        hookBlob: hay,
        seed: '17e-ck-miss',
        location: card?.location,
      }),
      false
    );
    expect(quests.find((q) => q.revealed)?.id).toBe('ck-quest-1');
  });
});
