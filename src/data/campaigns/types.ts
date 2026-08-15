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

/** One possible murderer. Code picks one at New Game; the writer must honor the stamp. */
export interface MysteryCulprit {
  id: string;
  name: string;
  role: string;
  motive: string;
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
  /** Player-facing genre chip on picker cards (1–4 words, sentence case). */
  genreTag?: string;
  /** Short blurb for library cards (1–2 sentences). */
  shortDescription?: string;
  /**
   * Adult / explicit campaign. Show an NSFW chip on the picker.
   * Hidden when Kid Mode (`contentMode === 'kid'`) is on. Only set on campaigns
   * that are written as NSFW — do not mark other PYOA by default.
   */
  nsfw?: boolean;
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
  /**
   * If set, code picks one culprit at New Game (hidden from the player).
   * Writer must honor HIDDEN CULPRIT in the rails — never invent a different killer.
   */
  mysteryCulprits?: MysteryCulprit[];
  /** Picked at New Game with the culprit. Writer may hint only when the player searches. */
  mysteryCluePools?: {
    weapons: string[];
    tells: string[];
    covers: string[];
  };
  /**
   * Injected every turn (not sliced with premise). Genre-native forks, spine, ending logic.
   * Stops every PYOA playing as take-hand / shove-as-bait / hide-MacGuffin / tap-MacGuffin.
   */
  styleRail?: string;
}
