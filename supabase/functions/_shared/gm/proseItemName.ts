/**
 * T10Z — writer / Must-narrate facing names for engine loot and System reward boxes.
 * Inventory keeps rarity on `item.rarity` (and may still store a prefixed catalog name);
 * the book and writer cues see a plain object the player holds, never Title-Case system chrome.
 * T10RC7 — catalog item / encounter labels are common nouns (not character names).
 */

const RARITY_ADJ = /^(?:Worn|Fine|Runed|Masterwork)\s+/i;
const REWARD_BOX = /^(?:Bronze|Silver|Gold|Platinum|Legendary)\s+Reward\s+Box$/i;

/** Plain common-noun for narration / writer cues (the jerkin, not Jerkin; reward box, not Bronze Reward Box). */
export function proseItemName(name: string): string {
  const raw = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return raw;
  if (REWARD_BOX.test(raw)) return 'reward box';
  const stripped = raw.replace(RARITY_ADJ, '').trim();
  if (!stripped) return raw;
  // T10RC7 — Title-Case template nouns stay lowercase common nouns in book/writer facts.
  return stripped.replace(/\b([A-Z][a-z]+)\b/g, (w) => w.toLowerCase());
}

/**
 * Writer / Must-narrate facing label for a catalog encounter (foeName / Ambush title).
 * Not a character name — common-noun description + explicit flag for the converter.
 */
export function proseEncounterLabel(name: string): { label: string; notCharacter: true } {
  const raw = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return { label: 'the threat', notCharacter: true };
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return { label: `the ${words[0]!.toLowerCase()}`, notCharacter: true };
  }
  // "Stonevein Ambush" → "the ambushers from Stonevein" (last word = kind, rest = place/tag).
  const kind = words[words.length - 1]!.toLowerCase();
  const place = words.slice(0, -1).join(' ');
  const plural =
    /(?:ambush|raid|patrol|band|crew|cell|pack|horde)$/i.test(kind)
      ? kind.replace(/s$/i, '') + 'ers'
      : kind;
  return { label: `the ${plural} from ${place}`, notCharacter: true };
}

/** Writer-facing fact line: common-noun encounter label, flagged not a character. */
export function encounterWriterFact(name: string): string {
  const { label } = proseEncounterLabel(name);
  return `${label} (not a character name — common noun)`;
}

/**
 * Rewrite Title-Case loot / reward-box chrome inside a writer-facing clause so Must narrate
 * never feeds Fine X / Bronze Reward Box as mad-lib nouns or person slots.
 */
export function plainItemChromeInText(text: string): string {
  let out = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!out) return out;
  out = out.replace(/\b(?:Bronze|Silver|Gold|Platinum|Legendary)\s+Reward\s+Box\b/gi, 'reward box');
  out = out.replace(/\b(?:Worn|Fine|Runed|Masterwork)\s+(?=[A-Z][a-z])/g, '');
  // T10RC7 — single Title-Case template noun after an article/adj (the Jerkin → the jerkin).
  // Multi-word places (the Salt Road) keep capitals: next token is also Title-Case.
  out = out.replace(
    /\b((?:the|a|an|this|that|your|my|their|his|her|heavy)\s+)([A-Z][a-z]{2,})\b(?!\s+[A-Z])/g,
    (_m, art: string, noun: string) => `${art}${noun.toLowerCase()}`,
  );
  return out;
}
