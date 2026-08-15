import type { CampaignBible, OpeningPrompt, OpeningRegistrar } from '@/data/campaigns/types';
import type { CampaignArchetype } from './archetypes';
import type { EngineMode, GameState, Item, OpeningEstablishment, Settings } from './types';
import { extractSystemRename, interpretPlayerUtterance, isJunkSetupValue, isSetupRefusal, utteranceIsMessy } from './playerUtterance';
import { materializeWornClothes } from './wornGear';
import { revealLocalStarterQuest } from './questPlay';

const GENERIC_NAMES = /^(adventurer|survivor|unknown survivor|hero|wanderer|unknown)$/i;

const NAME_PROMPT: OpeningPrompt = {
  id: 'name',
  kind: 'name',
  question: 'Confirm designation.',
  suggestions: ['Random designation', 'Random place'],
};

const RANDOM_NAMES = ['Jax', 'Ren', 'Sam', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Jordan', 'Blake'];
const RANDOM_PLACES = [
  'Peterborough UK',
  'Manchester',
  'a Leeds side street',
  'Birmingham',
  'a London pavement',
  'Sheffield',
];

function pickRandom(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)] ?? list[0];
}

export function establishmentChoices(pending: OpeningPrompt[]): string[] {
  const chips: string[] = [];
  if (pending.some((p) => p.kind === 'name')) chips.push('Random designation');
  if (pending.some((p) => p.kind === 'location')) chips.push('Random place');
  for (const prompt of pending) {
    for (const s of prompt.suggestions ?? []) {
      if (!/random (designation|name|place|location)/i.test(s) && !chips.includes(s)) {
        chips.push(s);
      }
    }
  }
  return chips.slice(0, 4);
}

const SI_PROMPTS: OpeningPrompt[] = [
  NAME_PROMPT,
  {
    id: 'where',
    kind: 'location',
    question: 'Confirm current location.',
    suggestions: [
      'On a city street walking somewhere ordinary',
      'In my apartment or house',
      'In a car stuck in traffic',
      'At a shop, cafe, or work',
    ],
  },
  {
    id: 'wear',
    kind: 'appearance',
    question: 'Visual profile incomplete. Describe garments worn at Registration.',
    suggestions: [
      'Jeans, a jacket, everyday street clothes',
      'Work clothes or a uniform',
      'Gym clothes',
      'Whatever I slept in',
    ],
  },
  {
    id: 'pockets',
    kind: 'kit',
    question: 'Personal-effects scan. List items on your person. Combat-grade declarations will be rejected.',
    suggestions: [
      'Phone, keys, and wallet',
      'A backpack with everyday stuff',
      'Almost nothing in my pockets',
    ],
  },
];

const FANTASY_PROMPTS: OpeningPrompt[] = [
  { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
  {
    id: 'folk',
    kind: 'species',
    question: 'Name your people — human, elf, dwarf, or another folk of this world.',
    suggestions: ['Human', 'Elf', 'Dwarf', 'Halfling'],
  },
  {
    id: 'look',
    kind: 'appearance',
    question: 'Describe your face and what you are wearing as this begins.',
    suggestions: [
      'Travel-worn and practical',
      'Local clothes, nothing fancy',
      'Armor or a uniform I already owned',
    ],
  },
];

const SPECIES_PROMPTS: OpeningPrompt[] = [
  { id: 'name', kind: 'name', question: 'Confirm designation.' },
  {
    id: 'form',
    kind: 'species',
    question: 'Species scan incomplete. What body did you wake in?',
    suggestions: ['A small beast', 'Something with claws', 'Not human, and I can feel it'],
  },
];

const SYSTEM_ARCHETYPES = new Set<CampaignArchetype>([
  'system_apocalypse',
  'vrmmo',
  'isekai',
  'regression',
  'cyberpunk',
  'dungeon_transport',
  'tower_ascent',
  'magic_academy',
  'dungeon_core',
  'ai_random',
]);

export function resolveOpeningRegistrar(
  bible: CampaignBible | undefined,
  engineMode: EngineMode,
  archetype?: CampaignArchetype
): OpeningRegistrar {
  if (bible?.openingRegistrar) return bible.openingRegistrar;
  if (archetype === 'void_audience') {
    return {
      voice: 'inworld',
      label: 'THE AUDITOR',
      startLine: 'Speak your name. Then tell me where you died.',
    };
  }
  if (engineMode === 'dnd') {
    return {
      voice: 'inworld',
      label: 'THE TALE',
      startLine: 'Before the first page is set: confirm your name, and where this begins.',
    };
  }
  if (engineMode === 'rpg' && !SYSTEM_ARCHETYPES.has(archetype ?? 'ai_random')) {
    return {
      voice: 'inworld',
      label: 'THE STORY',
      startLine: 'Who are you, and where does this open?',
    };
  }
  return {
    voice: 'system',
    label: 'SYSTEM',
    startLine: 'Starting. Please confirm your name and current location.',
  };
}

export function formatRegistrarLine(
  registrar: OpeningRegistrar,
  query: string,
  options?: { includeStartLine?: boolean; extra?: string }
): string {
  const start = options?.includeStartLine ? `${registrar.startLine}\n` : '';
  const extra = options?.extra ? `${options.extra}\n` : '';
  const body = `${start}${extra}${query}`.trim();
  return `<system>[ ${registrar.label} ]\n${body}</system>`;
}

export function resolveOpeningPrompts(
  bible: CampaignBible | undefined,
  engineMode: EngineMode,
  archetype?: CampaignArchetype
): OpeningPrompt[] {
  let prompts: OpeningPrompt[] = [];
  if (bible?.openingPrompts?.length) prompts = bible.openingPrompts;
  else if (bible?.id === 'system-integration' || archetype === 'system_apocalypse') prompts = SI_PROMPTS;
  else if (archetype === 'monster_reincarnation') prompts = SPECIES_PROMPTS;
  else if (engineMode === 'dnd' || archetype === 'cursed_manor') prompts = FANTASY_PROMPTS;
  else if (engineMode === 'litrpg' || SYSTEM_ARCHETYPES.has(archetype ?? 'ai_random')) prompts = SI_PROMPTS;
  else prompts = FANTASY_PROMPTS;

  if (!prompts.some((p) => p.kind === 'name')) {
    return [NAME_PROMPT, ...prompts];
  }
  return prompts;
}

export function filterOpeningPrompts(
  prompts: OpeningPrompt[],
  character: GameState['character']
): OpeningPrompt[] {
  return prompts.filter((p) => {
    if (p.kind === 'name' && character.name?.trim() && !GENERIC_NAMES.test(character.name.trim())) return false;
    if (p.kind === 'appearance' && character.appearance?.trim() && !isJunkSetupValue(character.appearance)) {
      return false;
    }
    if ((p.kind === 'species' || p.kind === 'identity') && /\b(elf|dwarf|human|orc|beast)\b/i.test(character.bio ?? '')) {
      return false;
    }
    return true;
  });
}

export function applySystemRename(state: GameState, raw: string): GameState {
  const name = extractSystemRename(raw);
  if (!name) return state;
  const registrar = state.openingEstablishment?.registrar;
  if (!registrar) return state;
  return {
    ...state,
    openingEstablishment: {
      ...state.openingEstablishment,
      registrar: { ...registrar, label: name.toUpperCase() },
    },
  };
}

export function isOpeningEstablishmentPending(state: GameState): boolean {
  const est = state.openingEstablishment;
  return !!est && !est.complete && est.pending.length > 0;
}

export function formatPlayerCanon(state: GameState): string {
  const answers = state.openingEstablishment?.answers;
  if (!answers || !Object.keys(answers).length) return '';
  const lines = Object.entries(answers).map(([id, text]) => `- ${id}: ${text}`);
  return (
    `PLAYER CANON (facts only — rewrite in System/narrator voice, never quote I/my chat):\n${lines.join('\n')}\n`
    + `Inventory and equipped gear on the sheet are the only items they have. `
    + `Rejected chargen claims (legendary weapons, best armor, endgame gear) stay rejected.`
  );
}

export function buildEstablishmentIntro(
  archetypeIntro: string,
  prompts: OpeningPrompt[],
  bible?: CampaignBible,
  registrar?: OpeningRegistrar,
  characterName?: string
): { text: string; choices: string[] } {
  if (!prompts.length) {
    return { text: archetypeIntro, choices: [] };
  }
  const voice = registrar ?? resolveOpeningRegistrar(bible, bible?.engineMode ?? 'litrpg', bible?.archetype);
  const hook = (bible?.openingHook?.trim() || softenAssumedPlace(archetypeIntro)).replace(/\s*What do you do\??\s*$/i, '').trim();
  const first = prompts[0];
  const designation = characterName?.trim() && !GENERIC_NAMES.test(characterName.trim())
    ? `Current designation: ${characterName}`
    : 'Current designation: unconfirmed';
  const query = formatRegistrarLine(voice, first.question, {
    includeStartLine: true,
    extra: voice.voice === 'system' ? designation : undefined,
  });
  return {
    text: `${hook}\n\n${query}`,
    choices: establishmentChoices(prompts),
  };
}

function softenAssumedPlace(intro: string): string {
  return intro
    .replace(/\b\w+, you stand in a city that is already changing\.[^\n]*/i, 'The world around you is already changing.')
    .replace(/\s*What do you do\??\s*$/i, '')
    .trim();
}

function stripChoicePrefix(raw: string): string {
  return raw.replace(/^\s*\d+[.)]\s*/, '').replace(/\s+/g, ' ').trim();
}

const NAME_STOP = new Set([
  'my', 'name', 'its', 'it', 'is', 'who', 'are', 'you', 'im', 'i', 'am', 'in', 'at', 'on',
  'the', 'a', 'an', 'what', 'whats', 'going', 'on', 'please', 'confirm', 'uk', 'usa',
  'hello', 'hi', 'hey', 'yes', 'no', 'ok', 'okay',
]);

function titleName(raw: string): string {
  return raw
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function titlePlace(raw: string): string {
  return raw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

/** Pull a real given name out of chat, not the whole sentence. */
export function extractGivenName(raw: string): string | null {
  const text = raw.replace(/\s+/g, ' ').trim();
  const patterns = [
    /\bit(?:'s|s|\s+is)\s+([A-Za-z][A-Za-z'-]{1,20})\b/i,
    /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z'-]{1,20})\b/i,
    /\bcall\s+me\s+([A-Za-z][A-Za-z'-]{1,20})\b/i,
    /\bname[:\s]+([A-Za-z][A-Za-z'-]{1,20})\b/i,
    /\bi(?:'m|m|\s+am)\s+([A-Za-z][A-Za-z'-]{1,20})\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    const token = m?.[1]?.trim();
    if (token && !NAME_STOP.has(token.toLowerCase())) return titleName(token);
  }
  const lonely = text.match(/^([A-Za-z][A-Za-z'-]{1,20})$/);
  if (lonely && !NAME_STOP.has(lonely[1].toLowerCase())) return titleName(lonely[1]);
  return null;
}

const NOT_A_PLACE =
  /\b(jeans|boots|t-?shirt|hoodie|jacket|wallet|phone|keys|headphones|leatherman)\b/i;

export function extractLocation(raw: string): string | null {
  const text = raw.replace(/\s+/g, ' ').trim();
  const m = text.match(
    /\b(?:i(?:'m|m|\s+am)\s+(?:in|at|from)|(?:i\s+)?live\s+in|(?:i(?:'m|m)\s+)?from)\s+([A-Za-z][A-Za-z0-9\s,'-]{1,60}?)(?:\s*[.?!]|\s+(?:what|who|where|why|how)\b|$)/i
  );
  const place = m?.[1]?.replace(/\s+/g, ' ').trim();
  if (!place || NAME_STOP.has(place.toLowerCase()) || NOT_A_PLACE.test(place)) return null;
  if (place.split(/\s+/).length > 8) return titlePlace(place.split(/\s+/).slice(0, 6).join(' '));
  return titlePlace(place);
}

const CLOTHES_NOUN =
  /\b(jeans|boots|t-?shirt|tee|hoodie|jacket|coat|jumper|sweater|trainers|sneakers|docs?|doc\s*martens?|docmartin)\b/i;

/** Drop leading "what am I wearing?" and trailing "why?" — never wipe a clothes list. */
function stripConfusion(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(erm|uh+|um+|like)\s+/gi, '')
    .replace(/^(what am i wearing|what do i (?:look like|have on)|who are you|what'?s going on|what is this)\??\s*/i, '')
    .replace(/\s+\b(why|what'?s going on|who are you|what is this)\??\s*$/i, '')
    .replace(/[?]+$/g, '')
    .trim();
}

function isMetaOnly(raw: string): boolean {
  const t = raw.replace(/\s+/g, ' ').trim().replace(/[?!.,]+$/g, '');
  if (isSetupRefusal(raw)) return true;
  return /^(who are you|what'?s going on|what is this|why|huh|what|idk|i don'?t know)$/i.test(t);
}

export function extractAppearance(raw: string): string | null {
  if (isSetupRefusal(raw) || isMetaOnly(raw) || isJunkSetupValue(raw)) return null;
  const afterWearQ = raw.replace(/^[\s\S]*?\bwhat am i wearing\??\s*/i, '').trim();
  if (afterWearQ && afterWearQ !== raw.replace(/\s+/g, ' ').trim()) {
    const cleaned = stripPlayerVoice(stripConfusion(afterWearQ));
    if (cleaned.length >= 6 && (CLOTHES_NOUN.test(cleaned) || /wearing|dressed/i.test(raw))) return cleaned;
  }
  const m = raw.match(
    /\b(?:i(?:'m|m|\s+am)\s+wearing|wearing|dressed\s+in|i\s+have\s+on)\s+([^.?!]{3,100})/i
  );
  const bit = m?.[1]?.replace(/\s+/g, ' ').trim();
  if (bit && !isJunkSetupValue(bit)) return stripPlayerVoice(stripConfusion(bit));
  const list = stripPlayerVoice(stripConfusion(raw));
  if (CLOTHES_NOUN.test(raw) && list.length >= 6 && !isJunkSetupValue(list)) return list;
  return null;
}

export function extractSpecies(raw: string): string | null {
  if (isSetupRefusal(raw) || isMetaOnly(raw) || isJunkSetupValue(raw)) return null;
  const m = raw.match(/\b(human|elf|dwarf|halfling|orc|beast|goblin|tiefling|dragonborn)\b/i);
  if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  return null;
}

export function extractKit(raw: string): string | null {
  if (isSetupRefusal(raw) || isMetaOnly(raw) || isJunkSetupValue(raw)) return null;
  const m = raw.match(
    /\b(?:i\s+have|i've got|got|carrying|in\s+my\s+(?:pockets?|bag|pack)|wallet|phone|keys|headphones)\b/i
  );
  if (!m) return null;
  const cleaned = stripPlayerVoice(stripConfusion(raw));
  if (!cleaned || isJunkSetupValue(cleaned)) return null;
  return cleaned;
}

/** Turn "im wearing my jeans" into "baggy jeans and a band t-shirt" — never keep I/my. */
export function stripPlayerVoice(raw: string): string {
  let t = raw.replace(/\s+/g, ' ').trim();
  t = t.replace(/\b(?:erm|uh+|um+|like)\b/gi, ' ');
  t = t.replace(/\b(?:i(?:'m|m|\s+am)\s+wearing|wearing|dressed\s+in|i\s+have\s+on)\s+/gi, '');
  t = t.replace(/\b(?:i\s+have|i've got|got|carrying)\s+/gi, '');
  t = t.replace(/\b(?:my|i(?:'m|m)?|i\s+am)\s+/gi, '');
  t = t.replace(/\b(?:so confused|what'?s going on|who are you|what is this).*$/i, '');
  t = (t.split(/[?!]/)[0] ?? t).replace(/\s+/g, ' ').replace(/^[,.\s]+|[,.\s]+$/g, '').trim();
  return t;
}

function harvestUtterance(raw: string): {
  name: string | null;
  location: string | null;
  appearance: string | null;
  kit: string | null;
  species: string | null;
  askedWho: boolean;
  askedWhat: boolean;
} {
  return {
    name: extractGivenName(raw),
    location: extractLocation(raw),
    appearance: extractAppearance(raw),
    kit: extractKit(raw),
    species: extractSpecies(raw),
    askedWho: /\bwho\s+are\s+you\b/i.test(raw),
    askedWhat: /\bwhat(?:'s|\s+is)\s+going\s+on\b/i.test(raw) || /\bwhy\??\s*$/i.test(raw),
  };
}

function fieldForKind(kind: OpeningPrompt['kind'], harvest: ReturnType<typeof harvestUtterance>): string | null {
  if (kind === 'name') return harvest.name;
  if (kind === 'location') return harvest.location;
  if (kind === 'appearance') return harvest.appearance;
  if (kind === 'kit') return harvest.kit;
  if (kind === 'species' || kind === 'identity') return harvest.species;
  return null;
}

/** Current field takes a normal sentence if it is not only a meta question. */
function acceptCurrentField(kind: OpeningPrompt['kind'], raw: string): string | null {
  if (isMetaOnly(raw) || isSetupRefusal(raw)) return null;
  const harvested = fieldForKind(kind, harvestUtterance(raw));
  if (harvested) return harvested;
  const cleaned = stripPlayerVoice(stripConfusion(raw));
  if (!cleaned || cleaned.length < 2) return null;
  if (kind === 'name') return extractGivenName(cleaned);
  if (kind === 'location') return extractLocation(raw) ?? (cleaned.split(/\s+/).length <= 8 && !NOT_A_PLACE.test(cleaned) ? cleaned : null);
  if (kind === 'appearance' && cleaned.split(/\s+/).length >= 2 && !isJunkSetupValue(cleaned)) return cleaned;
  if (kind === 'kit' && cleaned.split(/\s+/).length >= 2 && !isJunkSetupValue(cleaned)) return cleaned;
  if ((kind === 'species' || kind === 'identity') && cleaned.split(/\s+/).length <= 8) return cleaned;
  return null;
}

const POWER_CLAIM =
  /\b(legendary|mythic|artifact|relic|god(?:like|-tier)?|best(?:\s+in\s+slot)?|strongest|highest(?:-|\s+)?(?:power|tier|rarity)|overpowered|\bop\b|plus\s*\d{2,}|nuclear|excalibur|mjolnir|infinity|unlimited|endgame|unique\s+weapon|vorpal|holy\s+avenger|dragon(?:scale|slayer)|mithril|adamant(?:ine|ite)?|plasma|laser|minigun|exosuit|power\s*armor)\b/i;

const COMBAT_GEAR_CLAIM =
  /\b(greatsword|longsword|shortsword|katana|plate\s+mail|full\s+plate|power\s*armor|battleaxe|warhammer|sniper|assault\s+rifle|rocket|grenade|wand\s+of|staff\s+of|holy\s+avenger)\b/i;

const MUNDANE_STARTING: Array<{ re: RegExp; name: string; description: string }> = [
  { re: /\bphones?\b/i, name: 'Phone', description: 'The phone you already had. Reception is dying with the rest of the grid.' },
  { re: /\b(?:house\s+)?keys?\b/i, name: 'Keys', description: 'House or car keys from this morning.' },
  { re: /\bwallets?\b/i, name: 'Wallet', description: 'Cards and a little cash. The System does not care about either yet.' },
  { re: /\bheadphones?\b/i, name: 'Headphones', description: 'The pair you had on you this morning.' },
  { re: /\b(?:leatherman|multi[-\s]?tool)\b/i, name: 'Leatherman', description: 'A pocket multi-tool. Ordinary steel. Not System-issue.' },
];

export function isPowerGameClaim(text: string): boolean {
  return POWER_CLAIM.test(text) || COMBAT_GEAR_CLAIM.test(text);
}

/** Keep place/look/pockets. Never turn a chargen sentence into loot. */
export function sanitizeOpeningAnswer(
  kind: OpeningPrompt['kind'],
  raw: string
): { text: string; cheated: boolean; mundaneNames: string[] } {
  const cheated = isPowerGameClaim(raw);
  let text = raw.replace(/\s+/g, ' ').trim();
  if (cheated) {
    text = text
      .replace(POWER_CLAIM, '')
      .replace(COMBAT_GEAR_CLAIM, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.])/g, '$1')
      .trim();
  }
  if (kind === 'name') {
    const name = extractGivenName(raw) ?? extractGivenName(text);
    return { text: (name ?? '').slice(0, 40), cheated, mundaneNames: [] };
  }
  if (kind === 'location') {
    const place = extractLocation(raw) ?? (cheated ? text.split(/[,.]/)[0]?.trim() : text);
    return { text: (place ?? '').slice(0, 80), cheated, mundaneNames: [] };
  }
  if (kind === 'appearance') {
    text = stripPlayerVoice(text) || 'ordinary clothes from this morning';
    if (isJunkSetupValue(text)) text = 'everyday street clothes';
    return { text: text.slice(0, 240), cheated, mundaneNames: [] };
  }
  if (kind === 'kit') {
    const mundaneNames = MUNDANE_STARTING.filter((m) => m.re.test(raw)).map((m) => m.name);
    text = stripPlayerVoice(text);
    if (cheated || !text) {
      text = mundaneNames.length
        ? mundaneNames.join(', ')
        : 'ordinary pocket contents from this morning';
    }
    return { text: text.slice(0, 240), cheated, mundaneNames };
  }
  return { text: text.slice(0, 280), cheated, mundaneNames: [] };
}

function grantMundaneStartingItems(inventory: Item[], names: string[]): Item[] {
  const have = new Set(inventory.map((i) => i.name.toLowerCase()));
  const extra: Item[] = [];
  for (const spec of MUNDANE_STARTING) {
    if (!names.includes(spec.name) || have.has(spec.name.toLowerCase())) continue;
    extra.push({
      id: `start-${spec.name.toLowerCase()}`,
      name: spec.name,
      rarity: 'Common',
      quantity: 1,
      itemType: 'accessory',
      itemLevel: 1,
      provenance: 'On you this morning',
      description: spec.description,
    });
  }
  return extra.length ? [...inventory, ...extra] : inventory;
}

function applyKindToState(state: GameState, prompt: OpeningPrompt, answer: string): GameState {
  const clean = sanitizeOpeningAnswer(prompt.kind, answer);
  if (prompt.kind === 'name') {
    return { ...state, character: { ...state.character, name: clean.text.slice(0, 40) } };
  }
  if (prompt.kind === 'location') {
    return { ...state, currentLocation: clean.text.slice(0, 80) };
  }
  if (prompt.kind === 'appearance') {
    const look = clean.text.slice(0, 280);
    return {
      ...state,
      character: { ...state.character, appearance: look },
      inventory: materializeWornClothes(state.inventory, look),
    };
  }
  if (prompt.kind === 'species' || prompt.kind === 'identity') {
    const folk = clean.text.slice(0, 80);
    const bio = state.character.bio?.trim()
      ? `${state.character.bio} ${folk}`.slice(0, 400)
      : folk;
    return {
      ...state,
      character: {
        ...state.character,
        bio,
        appearance: state.character.appearance?.trim() || folk,
      },
    };
  }
  if (prompt.kind === 'kit') {
    return {
      ...state,
      inventory: retouchKit(grantMundaneStartingItems(state.inventory, clean.mundaneNames), clean.text),
    };
  }
  return state;
}

function retouchKit(inventory: Item[], answer: string): Item[] {
  return inventory.map((item) => {
    if (item.itemType === 'container' || /backpack|satchel|bag/i.test(item.name)) {
      return { ...item, description: `${item.description ?? item.name}. ${answer}`.slice(0, 240) };
    }
    return item;
  });
}

function registrarAside(registrar: OpeningRegistrar, harvest: ReturnType<typeof harvestUtterance>): string {
  const bits: string[] = [];
  if (harvest.askedWho) {
    bits.push(
      registrar.voice === 'system'
        ? 'This unit is the System. You have been registered.'
        : 'I am the voice that opened this page. Answer, and the tale continues.'
    );
  }
  if (harvest.askedWhat) {
    bits.push(
      registrar.voice === 'system'
        ? 'Integration protocol is active. Earth is being written into the System. A refusal is not a visual profile. Confirm garments or everyday street clothes will be assumed.'
        : 'The opening has begun. Finish these particulars, then the scene will move.'
    );
  }
  return bits.join(' ');
}

export async function applyOpeningAnswer(
  state: GameState,
  rawInput: string,
  settings?: Settings
): Promise<{
  state: GameState;
  generateOpening: boolean;
  openingNotes?: string;
}> {
  const est = state.openingEstablishment;
  if (!est || est.complete || !est.pending.length) {
    return { state, generateOpening: false };
  }
  const answer = stripChoicePrefix(rawInput);
  if (!answer) return { state, generateOpening: false };

  const harvest = harvestUtterance(answer);
  if (harvest.appearance && (isJunkSetupValue(harvest.appearance) || !extractAppearance(answer))) {
    harvest.appearance = null;
  }
  if (harvest.kit && isJunkSetupValue(harvest.kit)) harvest.kit = null;
  if (harvest.name && isJunkSetupValue(harvest.name)) harvest.name = null;
  if (isSetupRefusal(answer) || isMetaOnly(answer)) {
    harvest.appearance = null;
    harvest.kit = null;
    harvest.species = null;
  }
  const declined = [...(est.declinedFields ?? [])];
  const renamedTo = extractSystemRename(answer);
  if (isSetupRefusal(answer)) {
    harvest.appearance = null;
    harvest.kit = null;
    harvest.askedWhat = true;
    const kind = est.pending[0]?.kind;
    if (kind === 'appearance' && declined.includes('appearance')) {
      harvest.appearance = 'everyday street clothes';
    } else if (kind === 'appearance') {
      declined.push('appearance');
    }
  }
  if (/^random\s+(name|designation)\b/i.test(answer) || /^use a random (name|designation)\b/i.test(answer)) {
    harvest.name = harvest.name ?? pickRandom(RANDOM_NAMES);
  }
  if (/^random\s+(place|location|city)\b/i.test(answer) || /^use a random (place|location)\b/i.test(answer)) {
    harvest.location = harvest.location ?? pickRandom(RANDOM_PLACES);
  }
  const currentKind = est.pending[0]?.kind;
  if (currentKind && !fieldForKind(currentKind, harvest) && !isMetaOnly(answer)) {
    const accepted = acceptCurrentField(currentKind, answer);
    if (accepted) {
      if (currentKind === 'name') harvest.name = accepted;
      if (currentKind === 'location') harvest.location = accepted;
      if (currentKind === 'appearance') harvest.appearance = accepted;
      if (currentKind === 'kit') harvest.kit = accepted;
      if (currentKind === 'species' || currentKind === 'identity') harvest.species = accepted;
    }
  }
  const needsRead =
    !!settings &&
    !isMetaOnly(answer) &&
    !isSetupRefusal(answer) &&
    (utteranceIsMessy(answer) || !!(currentKind && !fieldForKind(currentKind, harvest)));
  if (needsRead) {
    const read = await interpretPlayerUtterance({
      raw: answer,
      mode: 'opening',
      pendingKinds: est.pending.map((p) => p.kind),
      pendingQuestions: est.pending.map((p) => p.question),
      settings,
      forceModel: !!(currentKind && !fieldForKind(currentKind, harvest)),
    });
    harvest.name = harvest.name ?? read.answers.name;
    harvest.location = harvest.location ?? read.answers.location;
    harvest.appearance = harvest.appearance ?? read.answers.appearance;
    harvest.kit = harvest.kit ?? read.answers.kit;
    harvest.species = harvest.species ?? read.answers.species;
    harvest.askedWho = harvest.askedWho || read.askedWho;
    harvest.askedWhat = harvest.askedWhat || read.askedWhat;
    if (currentKind && !fieldForKind(currentKind, harvest) && read.meaning && !read.questionOnly && !isJunkSetupValue(read.meaning)) {
      if (currentKind === 'name') harvest.name = harvest.name ?? read.meaning;
      if (currentKind === 'location') harvest.location = harvest.location ?? read.meaning;
      if (currentKind === 'appearance') harvest.appearance = harvest.appearance ?? read.meaning;
      if (currentKind === 'kit') harvest.kit = harvest.kit ?? read.meaning;
      if (currentKind === 'species' || currentKind === 'identity') harvest.species = harvest.species ?? read.meaning;
    }
    if (harvest.appearance && isJunkSetupValue(harvest.appearance)) harvest.appearance = null;
    if (harvest.kit && isJunkSetupValue(harvest.kit)) harvest.kit = null;
  }
  const registrar = {
    ...(est.registrar ?? {
      voice: 'system' as const,
      label: 'SYSTEM',
      startLine: 'Starting. Please confirm your name and current location.',
    }),
    ...(renamedTo ? { label: renamedTo.toUpperCase() } : {}),
  };

  let nextState = state;
  const answers = { ...est.answers };
  const stillPending: OpeningPrompt[] = [];
  const logged: string[] = [];
  let cheated = false;

  for (const prompt of est.pending) {
    const harvested = fieldForKind(prompt.kind, harvest);
    const isCurrent = prompt.id === est.pending[0].id;
    let value = harvested;
    if (!value && isCurrent && prompt.kind !== 'name') {
      const accepted = acceptCurrentField(prompt.kind, answer);
      if (accepted) {
        const clean = sanitizeOpeningAnswer(prompt.kind, accepted);
        if (clean.text) value = clean.text;
        cheated = cheated || clean.cheated;
      }
    }
    if (prompt.kind === 'name' && !value) {
      stillPending.push(prompt);
      continue;
    }
    if (prompt.kind === 'location' && !value) {
      stillPending.push(prompt);
      continue;
    }
    if (!value) {
      stillPending.push(prompt);
      continue;
    }
    const clean = sanitizeOpeningAnswer(prompt.kind, value);
    cheated = cheated || clean.cheated;
    if (prompt.kind === 'name' && !clean.text) {
      stillPending.push(prompt);
      continue;
    }
    nextState = applyKindToState(nextState, prompt, clean.text || value);
    answers[prompt.id] = clean.text || value;
    if (prompt.kind === 'name') logged.push(`Designation logged: ${answers[prompt.id]}`);
    if (prompt.kind === 'location') logged.push(`Location logged: ${answers[prompt.id]}`);
  }

  const aside = registrarAside(registrar, harvest);
  const cheatLine = cheated
    ? 'Invalid declaration. High-tier weapons, armor, and endgame gear are rejected. Allotment unchanged.'
    : '';
  const playerAlreadyLogged = nextState.log.some(
    (e) => e.role === 'player' && e.content === rawInput && e.turn === nextState.turn
  );

  if (stillPending.length) {
    const next = stillPending[0];
    const extra = [aside, cheatLine, ...logged].filter(Boolean).join('\n');
    const parseFail = est.pending[0]?.kind === 'name' && !harvest.name
      ? 'Unable to parse designation. State your name only.'
      : '';
    const gmEntry = {
      id: crypto.randomUUID(),
      turn: nextState.turn,
      role: 'gm' as const,
      content: formatRegistrarLine(registrar, parseFail || next.question, { extra: extra || undefined }),
      timestamp: Date.now(),
    };
    return {
      generateOpening: false,
      state: {
        ...nextState,
        openingEstablishment: { pending: stillPending, answers, complete: false, registrar, declinedFields: declined },
        choices: establishmentChoices(stillPending),
        log: playerAlreadyLogged ? [...nextState.log, gmEntry] : nextState.log,
        lastUpdated: Date.now(),
      },
    };
  }

  const canonLine = Object.values(answers).join(' / ').slice(0, 400);
  const premise = nextState.campaignPremise
    ? `${nextState.campaignPremise}\n\nPLAYER CANON: ${canonLine}`.slice(0, 2400)
    : `PLAYER CANON: ${canonLine}`;
  const openingNotes = [aside, cheatLine].filter(Boolean).join(' ');

  return {
    generateOpening: true,
    state: {
      ...nextState,
      campaignPremise: premise,
      openingEstablishment: { pending: [], answers, complete: true, registrar, declinedFields: declined },
      quests: revealLocalStarterQuest(nextState.quests ?? []),
      pendingGeneratedOpening: true,
      choices: [],
      lastUpdated: Date.now(),
    },
    openingNotes,
  };
}

export function formatSetupComplete(
  registrar: OpeningRegistrar,
  state: GameState
): string {
  const a = state.openingEstablishment?.answers ?? {};
  const name = a.name || state.character.name || 'unconfirmed';
  const where = a.where || state.currentLocation || 'unconfirmed';
  const wearRaw = a.wear || a.look || state.character.appearance || 'ordinary clothes';
  const wear = isJunkSetupValue(wearRaw) || isSetupRefusal(wearRaw)
    ? 'everyday street clothes'
    : stripPlayerVoice(wearRaw);
  const kit = stripPlayerVoice(a.pockets || a.kit || 'ordinary pocket contents');
  if (registrar.voice === 'system') {
    return formatRegistrarLine(
      registrar,
      [
        'Input accepted. Thank you.',
        'Setup complete.',
        `Designation: ${name}`,
        `Location: ${where}`,
        `Visual profile: ${wear}`,
        `Personal effects: ${kit}`,
        'Registration locked. Survive.',
      ].join('\n')
    );
  }
  return formatRegistrarLine(
    registrar,
    `Those particulars are taken down. Thank you. The tale is set: ${name}, at ${where}.`
  );
}

export function hasSystemVoice(text: string): boolean {
  return /<system>|\[[^\]]*(SYSTEM|AUDITOR|TALE|STORY)[^\]]*\]/i.test(text);
}

export function ensureSystemReceipt(state: GameState, narrative: string): string {
  const cleaned = sanitizeOpeningNarration(narrative).trim();
  if (hasSystemVoice(cleaned)) return cleaned;
  const registrar = state.openingEstablishment?.registrar ?? {
    voice: 'system' as const,
    label: 'SYSTEM',
    startLine: 'Starting. Please confirm your name and current location.',
  };
  return `${formatSetupComplete(registrar, state)}\n\n${cleaned}`.trim();
}

export function buildOpeningSceneMandate(state: GameState, notes?: string): string {
  const canon = formatPlayerCanon(state) || 'The player finished establishment.';
  const extra = notes?.trim() ? `\nAlso address this in the System block: ${notes.trim()}\n` : '';
  return `=== OPENING (BINDING — YOU WRITE BOTH VOICES) ===
${canon}
${extra}
You are the System AND the narrator. Do not recap their chat.
1) SYSTEM first, in <system>...</system>: thank them, say input accepted / setup complete, log designation / location / visual profile / personal effects from CANON (already cleaned — no I/my). Then lock registration.
2) NARRATOR next: 3–5 sentences of second-person story in the place they named. Do NOT re-list clothes or pockets — the System block already logged those. Continue the street: sky, panel, crowd, noise.
Do not grant weapons, armor, or rare items because they typed them. Only ordinary pocket stuff already on the sheet.
Do not invent a different city, race, or traveler origin.
Do not ask more chargen questions.
If this is modern Integration: this Earth, already in progress; the blue panel is here; people around them are reacting.
Then give 3–4 choices grounded in THAT opening.
================================================`;
}

/** If the GM quotes the player, rewrite first-person leftovers. */
export function sanitizeOpeningNarration(text: string): string {
  return text
    .replace(/\b([Yy]ou are wearing)\s+my\b/g, '$1')
    .replace(/\b([Ww]earing)\s+my\b/g, '$1')
    .replace(/\b([Oo]n you:)\s*my\b/g, '$1')
    .replace(/\b([Ii]n your pockets:)\s*my\b/g, '$1')
    .replace(/\bmy (wallet|phone|headphones|keys|house keys|leatherman|jeans|boots|t-?shirt)\b/gi, '$1');
}

export function synthesizeOpeningScene(state: GameState): string {
  const a = state.openingEstablishment?.answers ?? {};
  const registrar = state.openingEstablishment?.registrar ?? {
    voice: 'system' as const,
    label: 'SYSTEM',
    startLine: 'Starting. Please confirm your name and current location.',
  };
  const where = a.where || state.currentLocation || 'where you already were';
  const folk = a.folk || a.form || '';
  const folkBit = folk ? ` You are ${folk}.` : '';
  const scene = /system integration|every human on earth/i.test(state.campaignPremise ?? '')
    ? (
      `The panel dims. You are still in ${where} — same morning, same life — while the sky stays torn and the blue screen hangs at eye level.${folkBit} `
      + `Concrete and air are cracking. People nearby are shouting.`
    )
    : `The particulars are locked. You are in ${where}.${folkBit} The scene that was already moving is still moving.`;
  return `${formatSetupComplete(registrar, state)}\n\n${scene}`;
}
