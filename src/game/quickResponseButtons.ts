/**
 * PACK 12: QUICK-RESPONSE OPENING BUTTONS
 * 
 * Seed-varied contextual button banks for opening questions.
 * Enables instant client-side responses without GM wait.
 */

import type { GameState, OpeningPromptKind } from './types';
import type { CampaignBible } from '@/data/campaigns/types';
import { resolveActiveCampaignBible } from './campaignSeed';

// ═══════════════════════════════════════════════════════════════════════════
// KIT / INVENTORY BUTTON BANKS
// ═══════════════════════════════════════════════════════════════════════════

const KIT_URBAN_MODERN = [
  'Phone, keys, wallet',
  'Backpack with laptop and charger',
  'Gym bag and water bottle',
  'Just phone and earbuds',
  'Messenger bag with work stuff',
  'Purse with essentials',
  'Almost nothing',
  'Phone and a pocket knife',
];

const KIT_FANTASY_MEDIEVAL = [
  'Belt pouch with coins',
  'Travel pack and waterskin',
  'Satchel with bread and a knife',
  'Just the clothes on my back',
  'A small bag of supplies',
  'Nothing but a coin purse',
  'Empty pockets',
  'Belt pouch and a rope',
];

const KIT_SCIFI_SPACE = [
  'Datapad and ID card',
  'Utility belt with tools',
  'Survival kit in a pouch',
  'Just my uniform pockets',
  'Satchel with rations',
  'Almost nothing',
  'Tool kit and scanner',
  'Emergency beacon and knife',
];

const KIT_DYSTOPIAN = [
  'Scavenged backpack with supplies',
  'Makeshift bag with salvage',
  'Just what I could carry',
  'Almost nothing worth keeping',
  'A knife and some rope',
  'Emergency kit and water',
  'Whatever survived the fall',
  'Empty hands',
];

const KIT_ACADEMY_SCHOOL = [
  'Backpack with textbooks',
  'Messenger bag with laptop',
  'Gym bag from practice',
  'Just phone and wallet',
  'Notebooks and pens',
  'Almost nothing',
  'Phone and earbuds',
  'Lunchbox and water bottle',
];

// ═══════════════════════════════════════════════════════════════════════════
// APPEARANCE / LOOK BUTTON BANKS
// ═══════════════════════════════════════════════════════════════════════════

const LOOK_URBAN_MODERN = [
  'Jeans, jacket, street clothes',
  'Work clothes or uniform',
  'Gym clothes and sneakers',
  'Whatever I slept in',
  'Hoodie and jeans',
  'Business casual',
  'T-shirt and cargo pants',
  'Dress and comfortable shoes',
];

const LOOK_FANTASY_MEDIEVAL = [
  'Wool cloak, boots, plain shirt',
  'Local clothes, nothing fancy',
  'Travel-worn tunic and trousers',
  'Simple robe or dress',
  'Leather vest and sturdy boots',
  'Patched clothes from the road',
  'Whatever a traveler wears',
  'Hood and worn cloak',
];

const LOOK_SCIFI_SPACE = [
  'Standard-issue jumpsuit',
  'Casual station wear',
  'Maintenance coveralls',
  'Off-duty clothes',
  'Pilot\'s flight suit',
  'Civilian jacket and pants',
  'Utility uniform',
  'Whatever crew wears',
];

const LOOK_DYSTOPIAN = [
  'Patched jacket and worn jeans',
  'Scavenged clothes that fit',
  'Layer of rags over clothes',
  'Whatever survived',
  'Makeshift armor and cloth',
  'Torn shirt and pants',
  'Dust-covered travel gear',
  'Nothing clean',
];

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION BUTTON BANKS
// ═══════════════════════════════════════════════════════════════════════════

const LOCATION_URBAN = [
  'City street, walking somewhere',
  'My apartment or house',
  'A shop, cafe, or restaurant',
  'At work or school',
  'In a car or public transport',
  'A park or public space',
];

const LOCATION_FANTASY = [
  'A village or town square',
  'The road between settlements',
  'A tavern or inn',
  'Deep in the forest',
  'A merchant\'s shop',
  'The city gates',
];

const LOCATION_SCIFI = [
  'Station corridor or plaza',
  'My quarters or hab-unit',
  'A shuttle or transport',
  'The docking bay',
  'A cantina or rec area',
  'Near the airlocks',
];

// ═══════════════════════════════════════════════════════════════════════════
// BANK SELECTOR BY CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

type SettingContext = 'urban' | 'fantasy' | 'scifi' | 'dystopian' | 'academy';

function detectSettingContext(state: GameState, bible?: CampaignBible): SettingContext {
  const bibleId = bible?.id ?? state.campaignBibleId;
  
  // Direct bible mapping
  if (bibleId === 'summoned-pact' || bibleId === 'hero-awakening') return 'urban';
  if (bibleId?.includes('nocturne') || bibleId?.includes('ossuary')) return 'fantasy';
  if (bibleId?.includes('erebus') || bibleId?.includes('protocol')) return 'scifi';
  if (bibleId?.includes('ultimatum') || bibleId?.includes('directive')) return 'dystopian';
  
  // Engine mode fallback
  const mode = state.engineMode ?? bible?.engineMode;
  if (mode === 'litrpg') return 'urban';
  if (mode === 'dnd') return 'fantasy';
  if (mode === 'rpg' || mode === 'pyoa') {
    // Check for sci-fi or fantasy keywords in title/premise
    const text = (bible?.title + ' ' + bible?.premise).toLowerCase();
    if (/space|station|ship|cyber|tech|protocol/i.test(text)) return 'scifi';
    if (/wasteland|ruin|collapse|ash|dust/i.test(text)) return 'dystopian';
    return 'fantasy'; // Default for RPG/PYOA
  }
  
  return 'urban';
}

function selectKitBank(context: SettingContext): string[] {
  switch (context) {
    case 'urban': return KIT_URBAN_MODERN;
    case 'fantasy': return KIT_FANTASY_MEDIEVAL;
    case 'scifi': return KIT_SCIFI_SPACE;
    case 'dystopian': return KIT_DYSTOPIAN;
    case 'academy': return KIT_ACADEMY_SCHOOL;
  }
}

function selectLookBank(context: SettingContext): string[] {
  switch (context) {
    case 'urban': return LOOK_URBAN_MODERN;
    case 'fantasy': return LOOK_FANTASY_MEDIEVAL;
    case 'scifi': return LOOK_SCIFI_SPACE;
    case 'dystopian': return LOOK_DYSTOPIAN;
    case 'academy': return LOOK_URBAN_MODERN; // Reuse urban
  }
}

function selectLocationBank(context: SettingContext): string[] {
  switch (context) {
    case 'urban':
    case 'academy':
      return LOCATION_URBAN;
    case 'fantasy':
      return LOCATION_FANTASY;
    case 'scifi':
      return LOCATION_SCIFI;
    case 'dystopian':
      return LOCATION_FANTASY; // Reuse fantasy structure
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SEED-VARIED BUTTON PICKER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pick 3-4 varied buttons from the appropriate bank using campaign seed.
 * Always includes one "minimal/nothing" option.
 */
export function pickQuickResponseButtons(
  state: GameState,
  kind: OpeningPromptKind
): string[] {
  const bible = resolveActiveCampaignBible(state);
  const context = detectSettingContext(state, bible);
  const seed = state.seed ?? Date.now();
  
  let bank: string[];
  let mustInclude: string | null = null;
  
  switch (kind) {
    case 'kit':
      bank = selectKitBank(context);
      mustInclude = bank.find(s => /almost nothing|empty|just/i.test(s)) ?? null;
      break;
    case 'appearance':
      bank = selectLookBank(context);
      break;
    case 'location':
      bank = selectLocationBank(context);
      break;
    default:
      return [];
  }
  
  // Seed-stable selection using simple hash
  const seedStr = `${seed}-${kind}-${context}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  hash = Math.abs(hash);
  
  const indices = new Set<number>();
  
  // Always include minimal option for kit
  if (mustInclude) {
    const idx = bank.indexOf(mustInclude);
    if (idx >= 0) indices.add(idx);
  }
  
  // Pick 2-3 more using seed
  const targetCount = kind === 'kit' ? 3 : 4;
  let attempts = 0;
  while (indices.size < Math.min(targetCount, bank.length) && attempts < 20) {
    const idx = Math.abs(hash + attempts * 31) % bank.length;
    indices.add(idx);
    attempts++;
  }
  
  return Array.from(indices)
    .sort((a, b) => a - b)
    .map(i => bank[i]);
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTANT CLIENT-SIDE RESPONSE GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate instant narrative response for button clicks.
 * No GM call needed - handles acknowledgment client-side.
 */
export function generateQuickResponse(
  kind: OpeningPromptKind,
  buttonText: string,
  characterName: string
): string {
  const name = characterName || 'The designation';
  
  switch (kind) {
    case 'kit':
      if (/almost nothing|empty|just/i.test(buttonText)) {
        return `${name} carries almost nothing. Light. Free. Ready.`;
      }
      if (/phone|keys|wallet/i.test(buttonText)) {
        return `${name} pats pockets — phone, keys, wallet. The usual anchors.`;
      }
      if (/backpack|bag|pack/i.test(buttonText)) {
        return `${name} shifts the weight on their shoulder. Everything needed, nothing extra.`;
      }
      return `${name} takes stock. ${buttonText.replace(/^(I|You|They)\s+/i, '')}. Prepared as anyone can be.`;
    
    case 'appearance':
      if (/street clothes|casual|jeans/i.test(buttonText)) {
        return `${name} glances down — ${buttonText.toLowerCase()}. Nothing remarkable. Exactly right.`;
      }
      if (/work|uniform/i.test(buttonText)) {
        return `${name} wears ${buttonText.toLowerCase()}. Purpose written in fabric.`;
      }
      if (/cloak|robe|medieval/i.test(buttonText)) {
        return `${name} in ${buttonText.toLowerCase()} — travel-worn, weather-tested, home anywhere.`;
      }
      return `${name} is dressed: ${buttonText.toLowerCase()}. The look fits the moment.`;
    
    case 'location':
      if (/street|walking/i.test(buttonText)) {
        return `${name} was mid-step on pavement. Now pavement is memory.`;
      }
      if (/apartment|house|home/i.test(buttonText)) {
        return `${name} was home — door, walls, familiar space. All of it left behind.`;
      }
      if (/village|town|tavern/i.test(buttonText)) {
        return `${name} remembers ${buttonText.toLowerCase()} — voices, faces, ordinary life before the break.`;
      }
      return `${name} was ${buttonText.toLowerCase()}. That world feels distant now.`;
    
    default:
      return `${name} confirms: ${buttonText.toLowerCase()}.`;
  }
}

/**
 * Check if this is a button-eligible opening question.
 * Kit, appearance, and location support instant buttons.
 */
export function supportsQuickResponseButtons(kind: OpeningPromptKind): boolean {
  return kind === 'kit' || kind === 'appearance' || kind === 'location';
}
