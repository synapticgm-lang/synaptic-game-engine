import type { CampaignBible, LoreSnippet, KeyNPC, StarterQuest, StarterItem } from './types';
import type { CampaignArchetype } from '@/game/archetypes';
import type { EngineMode, Rarity, ItemType } from '@/game/types';

/** Compact factory so we can ship many copyright-safe premade worlds. */
export function makeBible(opts: {
  id: string;
  title: string;
  archetype: CampaignArchetype;
  engineMode: EngineMode;
  difficulty: CampaignBible['difficulty'];
  tagline: string;
  shortDescription: string;
  premise: string;
  licenseNote: string;
  lore: Array<Omit<LoreSnippet, 'id'> & { id?: string }>;
  npcs: Array<Omit<KeyNPC, 'id'> & { id?: string }>;
  quests: Array<Omit<StarterQuest, 'id'> & { id?: string }>;
  items: Array<Omit<StarterItem, 'id' | 'rarity' | 'itemType' | 'itemLevel'> & {
    id?: string;
    rarity?: Rarity;
    itemType?: ItemType;
    itemLevel?: number;
  }>;
  startingLocation?: string;
}): CampaignBible {
  const p = opts.id;
  return {
    id: opts.id,
    title: opts.title,
    archetype: opts.archetype,
    engineMode: opts.engineMode,
    difficulty: opts.difficulty,
    tagline: opts.tagline,
    shortDescription: opts.shortDescription,
    premise: opts.premise,
    licenseNote: opts.licenseNote,
    loreSnippets: opts.lore.map((l, i) => ({
      id: l.id ?? `${p}-lore-${i + 1}`,
      title: l.title,
      category: l.category,
      body: l.body,
      tags: l.tags,
    })),
    keyNPCs: opts.npcs.map((n, i) => ({
      id: n.id ?? `${p}-npc-${i + 1}`,
      name: n.name,
      role: n.role,
      disposition: n.disposition,
      description: n.description,
      hooks: n.hooks,
    })),
    starterQuests: opts.quests.map((q, i) => ({
      id: q.id ?? `${p}-quest-${i + 1}`,
      title: q.title,
      description: q.description,
      recommendedLevel: q.recommendedLevel,
      objectives: q.objectives,
      rewards: q.rewards,
    })),
    starterItems: opts.items.map((it, i) => ({
      id: it.id ?? `${p}-item-${i + 1}`,
      name: it.name,
      rarity: it.rarity ?? 'Common',
      itemType: it.itemType ?? 'accessory',
      itemLevel: it.itemLevel ?? 1,
      description: it.description,
    })),
    startingLocation: opts.startingLocation,
  };
}
