import type { EngineMode } from '@/game/types';
import type { CampaignArchetype } from '@/game/archetypes';
import type { Rarity, ItemType } from '@/game/types';

export type Difficulty = 'Easy' | 'Standard' | 'Hardcore';

export interface LoreSnippet {
  id: string;
  title: string;
  category: 'history' | 'world' | 'faction' | 'mechanic' | 'culture';
  body: string;
  tags: string[];
}

export interface KeyNPC {
  id: string;
  name: string;
  role: string;
  disposition: 'friendly' | 'neutral' | 'hostile' | 'ambiguous';
  description: string;
  hooks: string[];
}

export interface StarterQuest {
  id: string;
  title: string;
  description: string;
  recommendedLevel: number;
  objectives: string[];
  rewards: string;
}

export interface StarterItem {
  id: string;
  name: string;
  rarity: Rarity;
  itemType: ItemType;
  itemLevel: number;
  description: string;
}

export interface CampaignBible {
  id: string;
  title: string;
  archetype: CampaignArchetype;
  engineMode: EngineMode;
  difficulty: Difficulty;
  tagline: string;
  premise: string;
  /** Short blurb for library cards (1–2 sentences). */
  shortDescription?: string;
  /** Copyright / license note for creators (never copy closed IP). */
  licenseNote?: string;
  loreSnippets: LoreSnippet[];
  keyNPCs: KeyNPC[];
  starterQuests: StarterQuest[];
  starterItems: StarterItem[];
  /** Player-facing starting place. Never use a lore-article title here. */
  startingLocation?: string;
}
