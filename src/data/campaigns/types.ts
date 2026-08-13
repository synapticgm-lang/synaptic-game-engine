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

export type OpeningPromptKind = 'name' | 'location' | 'appearance' | 'kit' | 'identity' | 'species';
export type OpeningVoice = 'system' | 'inworld';

/** Who asks the opening questions — The System, an Auditor, a clerk, the tale itself. */
export interface OpeningRegistrar {
  voice: OpeningVoice;
  /** Panel label, e.g. SYSTEM, THE AUDITOR, GREYHOLLOW REGISTER */
  label: string;
  /** First-contact line, e.g. "Starting. Please confirm your name and current location." */
  startLine: string;
}

/** Asked at game start so the story does not invent who/where the player is. */
export interface OpeningPrompt {
  id: string;
  kind: OpeningPromptKind;
  question: string;
  suggestions?: string[];
}

export interface StarterItem {
  id: string;
  name: string;
  rarity: Rarity;
  itemType: ItemType;
  itemLevel: number;
  description: string;
  equipped?: boolean;
  slot?: string;
  provenance?: string;
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
  /**
   * When true, drop the generic fantasy sword/tunic/satchel and use this campaign's kit.
   * Leave unset for fantasy arrivals that should keep the default traveler pack.
   */
  replaceDefaultLoadout?: boolean;
  startingContainer?: { id: string; name: string; capacity: number };
  /** Hook before establishment questions. If omitted, the archetype intro is softened. */
  openingHook?: string;
  openingRegistrar?: OpeningRegistrar;
  openingPrompts?: OpeningPrompt[];
}
