/**
 * T10Z — writer / Must-narrate facing names for engine loot and System reward boxes.
 * Inventory keeps rarity on `item.rarity` (and may still store a prefixed catalog name);
 * the book and writer cues see a plain object the player holds, never Title-Case system chrome.
 */

const RARITY_ADJ = /^(?:Worn|Fine|Runed|Masterwork)\s+/i;
const REWARD_BOX = /^(?:Bronze|Silver|Gold|Platinum|Legendary)\s+Reward\s+Box$/i;

/** Plain noun for narration / writer cues (Pistol, not Fine Pistol; reward box, not Bronze Reward Box). */
export function proseItemName(name: string): string {
  const raw = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return raw;
  if (REWARD_BOX.test(raw)) return 'reward box';
  const stripped = raw.replace(RARITY_ADJ, '').trim();
  return stripped || raw;
}

/**
 * Rewrite Title-Case loot / reward-box chrome inside a writer-facing clause so Must narrate
 * never feeds Fine X / Bronze Reward Box as mad-lib nouns.
 */
export function plainItemChromeInText(text: string): string {
  let out = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!out) return out;
  out = out.replace(/\b(?:Bronze|Silver|Gold|Platinum|Legendary)\s+Reward\s+Box\b/gi, 'reward box');
  out = out.replace(/\b(?:Worn|Fine|Runed|Masterwork)\s+(?=[A-Z][a-z])/g, '');
  return out;
}
