/**
 * P-5a/c/e — what the setting allows. One general rule, no per-premise branches and no word lists:
 * allowed = the world's own data (this engine mode's campaign bibles, this game's bible and atlas)
 *         + the SRD 5.2.1 data
 *         + whatever the story's records have established (the premise's origin statements, the player's kit,
 *           registered people and things, things recorded as crossed over).
 * A word that only other settings' bibles use ("rifle" in a sword-and-sorcery game) breaks the setting, unless
 * the records have established a crossing: something from beyond this world is already part of the story
 * (a summoned person, a portal, time travel, a crashed ship, a foreign trader). Once established, it and its
 * origin are allowed from then on. Everyday words no setting writes down ("strap") are never judged.
 */
import SRD from '../data/srd/srd521.json';
import type { CampaignBible } from '../data/campaigns/types';
import { SRD_ARMOR, SRD_WEAPONS } from './rules/srdGear';
import type { GameState } from './types';

/**
 * The campaign bibles, registered by `data/campaigns` itself so this module imports no story data (a static
 * import made a cycle through tokenProse). Until they register, nothing is judged off-setting.
 */
const cache = new Map<string, Set<string>>();
let bibles: () => readonly CampaignBible[] = () => [];
export function registerSettingBibles(all: () => readonly CampaignBible[]): void {
  bibles = all;
  cache.clear();
}

type SettingState = Pick<GameState, 'campaignBibleId' | 'worldAtlas' | 'engineMode'> &
  Partial<Pick<GameState, 'crossedOver' | 'inventory' | 'sceneFacts' | 'npcMemories'>>;

function addWords(into: Set<string>, text: string): void {
  for (const w of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    const bare = w.replace(/'s$/, '');
    into.add(bare);
    into.add(bare.replace(/e?s$/, ''));
  }
}

/** Words only other settings use, before the story's records are read: the world's data and the SRD only. */
export function worldOffSettingWords(state: SettingState): ReadonlySet<string> {
  const bibleId = state.campaignBibleId ?? '';
  const key = `${state.engineMode ?? ''}|${bibleId}|${state.worldAtlas ? 'atlas' : ''}`;
  const hit = cache.get(key);
  if (hit && !state.worldAtlas) return hit;
  const all = bibles();
  if (!all.length) return new Set();
  const own = new Set<string>();
  addWords(own, JSON.stringify(SRD));
  addWords(own, [...Object.keys(SRD_WEAPONS), ...Object.keys(SRD_ARMOR)].join(' '));
  const bible = bibleId ? all.find((b) => b.id === bibleId) : undefined;
  const mode = bible?.engineMode ?? state.engineMode;
  if (bible) addWords(own, JSON.stringify(bible));
  if (state.worldAtlas) addWords(own, JSON.stringify(state.worldAtlas));
  const foreign = new Set<string>();
  for (const b of all) addWords(b.engineMode === mode ? own : foreign, JSON.stringify(b));
  for (const w of own) foreign.delete(w);
  if (!state.worldAtlas) cache.set(key, foreign);
  return foreign;
}

/** The things the story's records hold: the player's kit, registered props and people, crossed-over things. */
function recordedThings(state: SettingState): string[] {
  return [
    ...(state.inventory ?? []).map((i) => i.name),
    ...(state.sceneFacts?.props ?? []),
    ...(state.npcMemories ?? []).map((m) => m.npcName),
    ...(state.crossedOver ?? []),
  ].filter(Boolean);
}

/**
 * The records establish a crossing from beyond this world: the premise states an origin elsewhere (an opening
 * card's `summonIntent`), something is recorded as crossed over, or a recorded thing is named only by other
 * settings (the engine handed it, so the story holds it).
 */
export function recordsEstablishCrossing(state: SettingState): boolean {
  const bible = state.campaignBibleId ? bibles().find((b) => b.id === state.campaignBibleId) : undefined;
  if ((bible?.openingHooks ?? []).some((c) => typeof c === 'object' && !!c?.summonIntent?.trim())) return true;
  if (state.crossedOver?.length) return true;
  const foreign = worldOffSettingWords(state);
  return recordedThings(state).some((t) => isOffSetting(foreign, t.split(/\s+/).pop() ?? ''));
}

/** Words that break this setting now: other settings' words, unless the records have established a crossing. */
export function offSettingWords(state: SettingState): ReadonlySet<string> {
  if (recordsEstablishCrossing(state)) return new Set();
  return worldOffSettingWords(state);
}

/** This word (singular or plural) belongs only to other settings. */
export function isOffSetting(words: ReadonlySet<string>, word: string): boolean {
  const w = word.toLowerCase().replace(/'s$/, '');
  return w.length >= 3 && words.has(w) && words.has(w.replace(/e?s$/, ''));
}
