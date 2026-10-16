/**
 * P-5a/c — words that belong to another setting. The world's own data — this engine mode's campaign bibles,
 * this game's bible and atlas, and the SRD 5.2.1 data — is the setting's vocabulary. A word that only other
 * settings' bibles use ("rifle", "phone" in a sword-and-sorcery tabletop game) breaks the setting's era and tech.
 * Everyday words no setting writes down ("strap") are not judged: the writer may invent within the world.
 * Judged from the setting data, not a word list.
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

type SettingState = Pick<GameState, 'campaignBibleId' | 'worldAtlas' | 'engineMode'>;

function addWords(into: Set<string>, text: string): void {
  for (const w of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    const bare = w.replace(/'s$/, '');
    into.add(bare);
    into.add(bare.replace(/e?s$/, ''));
  }
}

/** Words only other settings use: other engine modes' bibles, minus this setting's own words and the SRD. */
export function offSettingWords(state: SettingState): ReadonlySet<string> {
  const bibleId = state.campaignBibleId ?? '';
  const key = `${state.engineMode ?? ''}|${bibleId}|${state.worldAtlas ? 'atlas' : ''}`;
  const hit = cache.get(key);
  if (hit && !state.worldAtlas) return hit;
  const own = new Set<string>();
  addWords(own, JSON.stringify(SRD));
  addWords(own, [...Object.keys(SRD_WEAPONS), ...Object.keys(SRD_ARMOR)].join(' '));
  const all = bibles();
  if (!all.length) return new Set();
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

/** This word (singular or plural) belongs only to other settings. */
export function isOffSetting(words: ReadonlySet<string>, word: string): boolean {
  const w = word.toLowerCase();
  return words.has(w) && words.has(w.replace(/e?s$/, ''));
}
