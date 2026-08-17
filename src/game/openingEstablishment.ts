import type { CampaignBible, OpeningMode, OpeningPrompt, OpeningPromptKind, OpeningRegistrar } from '@/data/campaigns/types';
import { resolveActiveCampaignBible } from './campaignSeed';
import type { CampaignArchetype } from './archetypes';
import type { EngineMode, GameState, Item, OpeningEstablishment, Settings } from './types';
import { extractSystemRename, interpretPlayerUtterance, isJunkSetupValue, isSetupRefusal, utteranceIsMessy } from './playerUtterance';
import { materializeWornClothes } from './wornGear';
import { seedLocalStarterQuest } from './questPlay';

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

const RANDOM_PLACE_REQUEST =
  /\b(?:a\s+)?random\s+(?:place|location|city|town|spot)\b|\b(?:pick|choose|give)\s+(?:me\s+)?(?:a\s+)?random\b|\bi\s+can'?t\s+think\s+of\s+(?:a\s+)?(?:place|location|one)\b|\bthe\s+place\s+this\s+tale\s+names\b/i;

export function isRandomPlaceRequest(raw: string): boolean {
  return RANDOM_PLACE_REQUEST.test(raw.replace(/\s+/g, ' ').trim());
}

export function pickPlaceForCampaign(state: GameState): string {
  const bible = resolveActiveCampaignBible(state);
  if (bible?.startingLocation?.trim()) return bible.startingLocation.trim();
  if (bible?.engineMode === 'rpg' || bible?.engineMode === 'pyoa' || bible?.engineMode === 'dnd') {
    return 'where this tale opens';
  }
  return pickRandom(RANDOM_PLACES);
}

function isUnusablePlace(place: string, state: GameState): boolean {
  const p = place.replace(/\s+/g, ' ').trim();
  if (!p) return true;
  if (NAME_STOP.has(p.toLowerCase())) return true;
  if (NOT_A_PLACE.test(p)) return true;
  if (isRandomPlaceRequest(p)) return true;
  if (/^the opening of /i.test(p)) return true;
  const name = (
    state.openingEstablishment?.answers?.name
    || state.character.name
    || ''
  ).trim();
  if (name && p.toLowerCase() === name.toLowerCase()) return true;
  const bible = resolveActiveCampaignBible(state);
  if (bible && p.toLowerCase() === bible.title.toLowerCase()) return true;
  return false;
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
    id: 'where',
    kind: 'location',
    question: 'Where does this open? Name a place in this world, or pick a random place.',
    suggestions: ['Random place', 'The place this tale names', 'A street I invent'],
  },
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
      'Wool cloak, boots, and a plain shirt',
      'Local clothes, nothing fancy',
      'A coat and the shoes I already owned',
    ],
  },
];

const STORY_RPG_PROMPTS: OpeningPrompt[] = [
  { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
  {
    id: 'where',
    kind: 'location',
    question: 'Where does this open? Name a place in this world, or pick a random place.',
    suggestions: ['Random place', 'The place this tale names', 'A street I invent'],
  },
  {
    id: 'look',
    kind: 'appearance',
    question: 'Describe your face and what you are wearing as this begins.',
    suggestions: [
      'Wool cloak, boots, and a plain shirt',
      'Local clothes, nothing fancy',
      'A coat and the shoes I already owned',
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
  if (engineMode === 'rpg' || engineMode === 'pyoa') {
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
  options?: { includeStartLine?: boolean; extra?: string; style?: 'inworld' | 'system' }
): string {
  const start = options?.includeStartLine && options.style === 'system' ? `${registrar.startLine}\n` : '';
  const extra = options?.extra ? `${options.extra}\n` : '';
  const body = `${start}${extra}${query}`.trim();
  const style = options?.style ?? (registrar.voice === 'system' ? 'system' : 'inworld');
  if (style === 'system') {
    return `<system>[ ${registrar.label} ]\n${body}</system>`;
  }
  return body;
}

export function resolveOpeningMode(
  bible: CampaignBible | undefined,
  engineMode: EngineMode
): OpeningMode {
  if (bible?.openingMode) return bible.openingMode;
  if (engineMode === 'pyoa' || engineMode === 'rpg' || bible?.engineMode === 'pyoa' || bible?.engineMode === 'rpg') {
    return 'scene';
  }
  return 'weave';
}

function hashOpenerSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pick a stable opener from `openingHooks` (or fall back to `openingHook`). */
export function resolveOpeningHook(bible: CampaignBible | undefined, seed?: string): string | undefined {
  const deck = (bible?.openingHooks ?? []).map((h) => h.trim()).filter(Boolean);
  if (deck.length > 0) {
    const idx = hashOpenerSeed(`${seed ?? '0'}|${bible?.id ?? 'bible'}|opener`) % deck.length;
    return deck[idx];
  }
  const single = bible?.openingHook?.trim();
  return single || undefined;
}

const BIBLE_INWORLD: Record<string, Partial<Record<OpeningPromptKind, string>>> = {
  'summoned-pact': {
    name: 'A robed figure leans over the circle. “A name. What do we call you?”',
    location: 'The stone is cold under your back. Before the light took you — which Earth place were you in? A city, a street, a home.',
    appearance: 'You look down. You are still wearing what the circle stole you in. What is it?',
    kit: 'Pockets, bag, whatever rode with you. What is actually on you? Nothing invented for a fight.',
  },
  'system-integration': {
    name: 'The panel waits on a name you already use. What should it show?',
    location: 'The street has not moved. Where are you standing — which city, which pavement or room?',
    appearance: 'You look down. You are still wearing this morning’s clothes. What are they?',
    kit: 'Phone, keys, bag — what is actually on you? Combat-grade inventions will not appear.',
  },
  'hero-awakening': {
    name: 'The private panel waits on a name this world already uses for you. What is it?',
    location: 'Where are you — which world-shape and place? Fantasy city, frontier, sky-port, modern street, ship, wilds — your call.',
    appearance: 'You look down. What folk-body and clothes are you wearing in this place?',
    kit: 'Pockets, bag, belt — what is actually on you that fits this world? Combat-grade inventions will not appear.',
    species: 'What folk or body are you in this world?',
  },
};

const DEFAULT_INWORLD: Record<OpeningPromptKind, string> = {
  name: 'Someone in the scene needs a name for you. What do they call you?',
  location: 'Where are you, exactly, as this opens?',
  appearance: 'You look down. You are still wearing what you had on when this started. What is it?',
  kit: 'Your pockets and bag are still yours. What is actually on you?',
  identity: 'Who are you in this place — what do they take you for?',
  species: 'You can feel the body you woke in. What is it?',
};

function inworldizePrompt(prompt: OpeningPrompt, bible?: CampaignBible): OpeningPrompt {
  const override = bible?.id ? BIBLE_INWORLD[bible.id]?.[prompt.kind] : undefined;
  return {
    ...prompt,
    style: prompt.style ?? 'inworld',
    question: override ?? (prompt.style === 'system' ? prompt.question : DEFAULT_INWORLD[prompt.kind] ?? prompt.question),
  };
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
  else if (engineMode === 'rpg' || engineMode === 'pyoa') prompts = STORY_RPG_PROMPTS;
  else if (engineMode === 'dnd' || archetype === 'cursed_manor') prompts = FANTASY_PROMPTS;
  else if (engineMode === 'litrpg' || SYSTEM_ARCHETYPES.has(archetype ?? 'ai_random')) prompts = SI_PROMPTS;
  else prompts = FANTASY_PROMPTS;

  const mode = resolveOpeningMode(bible, engineMode);
  const withName = prompts.some((p) => p.kind === 'name') ? prompts : [NAME_PROMPT, ...prompts];
  const styled = withName.map((p) => inworldizePrompt(p, bible));
  if (mode === 'scene') {
    return styled.map((p) => ({ ...p, required: false, style: 'inworld' as const }));
  }
  return styled.map((p) => ({ ...p, required: p.required !== false }));
}

export function seedCoverAnswers(
  bible: CampaignBible | undefined,
  character: GameState['character']
): Record<string, string> {
  const answers: Record<string, string> = {};
  if (bible?.startingLocation?.trim()) answers.where = bible.startingLocation.trim();
  if (character.name?.trim() && !GENERIC_NAMES.test(character.name.trim())) answers.name = character.name.trim();
  if (character.appearance?.trim() && !isJunkSetupValue(character.appearance)) {
    answers.wear = character.appearance.trim();
    answers.look = character.appearance.trim();
  }
  return answers;
}

export function pendingRequiredCovers(
  prompts: OpeningPrompt[],
  character: GameState['character'],
  mode: OpeningMode
): OpeningPrompt[] {
  if (mode === 'scene') return [];
  return filterOpeningPrompts(prompts.filter((p) => p.required !== false), character);
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
  characterName?: string,
  seed?: string
): { text: string; choices: string[] } {
  if (!prompts.length) {
    return { text: archetypeIntro, choices: [] };
  }
  const voice = registrar ?? resolveOpeningRegistrar(bible, bible?.engineMode ?? 'litrpg', bible?.archetype);
  const hook = (resolveOpeningHook(bible, seed) || softenAssumedPlace(archetypeIntro)).replace(/\s*What do you do\??\s*$/i, '').trim();
  const first = prompts[0];
  const designation = characterName?.trim() && !GENERIC_NAMES.test(characterName.trim())
    ? `Current designation: ${characterName}`
    : 'Current designation: unconfirmed';
  const query = formatRegistrarLine(voice, first.question, {
    includeStartLine: first.style === 'system',
    style: first.style ?? 'inworld',
    extra: first.style === 'system' ? designation : undefined,
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
  if (isRandomPlaceRequest(raw)) return null;
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
  /\b(jeans|boots|t-?shirt|tee|hoodie|jacket|coat|jumper|sweater|trainers|sneakers|docs?|doc\s*martens?|docmartin|metallica)\b/i;

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
  if (CLOTHES_NOUN.test(raw)) {
    const list = stripPlayerVoice(stripConfusion(raw))
      .replace(/\b(no|not|refused?|without|ain'?t wearing)\s+(any\s+)?underwear\b/gi, '')
      .replace(/\b(perve?|creep|weirdo|freak|sicko)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (list.length >= 6) return list;
  }
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
  if (
    (isSetupRefusal(raw) || isMetaOnly(raw) || isJunkSetupValue(raw)) &&
    !/\b(backpack|phone|keys|headphones|leatherman|wallet|multi[-\s]?tool)\b/i.test(raw)
  ) {
    return null;
  }
  const m = raw.match(
    /\b(?:i\s+have|i've got|got|carrying|in\s+my\s+(?:pockets?|bag|pack)|wallet|phone|keys|headphones|backpack|leatherman)\b/i
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
function acceptCurrentField(kind: OpeningPrompt['kind'], raw: string, state?: GameState): string | null {
  if (isMetaOnly(raw) || isSetupRefusal(raw)) return null;
  const harvested = fieldForKind(kind, harvestUtterance(raw));
  if (harvested) {
    if (kind === 'location' && state && isUnusablePlace(harvested, state)) return null;
    return harvested;
  }
  const cleaned = stripPlayerVoice(stripConfusion(raw));
  if (!cleaned || cleaned.length < 2) return null;
  if (kind === 'name') return extractGivenName(cleaned);
  if (kind === 'location') {
    if (isRandomPlaceRequest(raw) || isRandomPlaceRequest(cleaned)) {
      return state ? pickPlaceForCampaign(state) : pickRandom(RANDOM_PLACES);
    }
    const extracted = extractLocation(raw);
    if (extracted && (!state || !isUnusablePlace(extracted, state))) return extracted;
    return null;
  }
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
    if (isRandomPlaceRequest(raw)) return { text: '', cheated, mundaneNames: [] };
    const extracted = extractLocation(raw);
    if (extracted) return { text: extracted.slice(0, 80), cheated, mundaneNames: [] };
    const token = text.replace(/^the\s+/i, '').trim();
    if (
      text
      && text.split(/\s+/).length <= 8
      && !NOT_A_PLACE.test(text)
      && !isRandomPlaceRequest(text)
      && token.length >= 2
    ) {
      return { text: text.slice(0, 80), cheated, mundaneNames: [] };
    }
    return { text: '', cheated, mundaneNames: [] };
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
    const place = clean.text.slice(0, 80);
    if (!place || isUnusablePlace(place, state)) {
      return { ...state, currentLocation: pickPlaceForCampaign(state) };
    }
    return { ...state, currentLocation: place };
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
    const look = `${state.character.appearance ?? ''} ${clean.text}`.trim();
    return {
      ...state,
      inventory: materializeWornClothes(
        grantMundaneStartingItems(state.inventory, clean.mundaneNames),
        look
      ),
    };
  }
  return state;
}

function registrarAside(
  registrar: OpeningRegistrar,
  harvest: ReturnType<typeof harvestUtterance>,
  bibleId?: string
): string {
  const bits: string[] = [];
  if (harvest.askedWho) {
    if (bibleId === 'summoned-pact') {
      bits.push('The voices over the circle are waiting. They pulled you from Earth. They want a name.');
    } else if (bibleId === 'system-integration') {
      bits.push('The panel is here, in this life. It is not eating the planet. It wants a name you already use.');
    } else if (bibleId === 'hero-awakening') {
      bits.push('The Wake Ledger is private. This is still your world — they need a name you already use here.');
    } else {
      bits.push(
        registrar.voice === 'system'
          ? 'The System is a panel in this life — not a machine eating Earth.'
          : 'The scene is still moving. They are waiting on who you are.'
      );
    }
  }
  if (harvest.askedWhat) {
    if (bibleId === 'summoned-pact') {
      bits.push('You were taken from Earth. This world is not writing Earth into a System.');
    } else if (bibleId === 'system-integration') {
      bits.push('Integration is a panel over this Earth, already in progress — not Earth being ingested.');
    } else if (bibleId === 'hero-awakening') {
      bits.push('You were not summoned. You awaken where you already live — any folk, any world-shape the opening locked.');
    } else {
      bits.push('The opening has begun. The story will take the next particular in the scene, not as a form.');
    }
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
  if ((isSetupRefusal(answer) || isMetaOnly(answer)) && !harvest.appearance && !CLOTHES_NOUN.test(answer)) {
    harvest.appearance = null;
    harvest.kit = null;
    harvest.species = null;
  }
  const declined = [...(est.declinedFields ?? [])];
  const renamedTo = extractSystemRename(answer);
  if (isSetupRefusal(answer) && !harvest.appearance && !CLOTHES_NOUN.test(answer)) {
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
  if (isRandomPlaceRequest(answer)) {
    harvest.location = harvest.location && !isUnusablePlace(harvest.location, state)
      ? harvest.location
      : pickPlaceForCampaign(state);
  }
  if (harvest.location && harvest.name && harvest.location.toLowerCase() === harvest.name.toLowerCase()) {
    harvest.location = null;
  }
  if (harvest.location && isUnusablePlace(harvest.location, state)) {
    harvest.location = isRandomPlaceRequest(answer) ? pickPlaceForCampaign(state) : null;
  }
  const currentKind = est.pending[0]?.kind;
  if (currentKind && !fieldForKind(currentKind, harvest) && !isMetaOnly(answer)) {
    const accepted = acceptCurrentField(currentKind, answer, state);
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
    if (harvest.location && (isUnusablePlace(harvest.location, state) || harvest.location.toLowerCase() === (harvest.name ?? '').toLowerCase())) {
      harvest.location = isRandomPlaceRequest(answer) ? pickPlaceForCampaign(state) : null;
    }
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
  let cheated = false;

  for (const prompt of est.pending) {
    const harvested = fieldForKind(prompt.kind, harvest);
    const isCurrent = prompt.id === est.pending[0].id;
    let value = harvested;
    if (!value && isCurrent && prompt.kind !== 'name') {
      const accepted = acceptCurrentField(prompt.kind, answer, nextState);
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
  }

  const aside = registrarAside(registrar, harvest, nextState.campaignBibleId);
  const cheatLine = cheated
    ? 'That gear does not appear. Ordinary pockets only.'
    : '';
  const playerAlreadyLogged = nextState.log.some(
    (e) => e.role === 'player' && e.content === rawInput && e.turn === nextState.turn
  );

  if (stillPending.length) {
    const next = stillPending[0];
    const extra = [aside, cheatLine].filter(Boolean).join('\n');
    const parseFail = est.pending[0]?.kind === 'name' && !harvest.name
      ? 'They are still waiting for a name you will own.'
      : '';
    const gmEntry = {
      id: crypto.randomUUID(),
      turn: nextState.turn,
      role: 'gm' as const,
      content: formatRegistrarLine(registrar, parseFail || next.question, {
        extra: extra || undefined,
        style: next.style ?? 'inworld',
      }),
      timestamp: Date.now(),
    };
    return {
      generateOpening: false,
      state: {
        ...nextState,
        openingEstablishment: {
          pending: stillPending,
          answers,
          complete: false,
          registrar,
          declinedFields: declined,
          sceneWritten: est.sceneWritten,
          mode: est.mode,
        },
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
  const lockedWhere = answers.where && !isUnusablePlace(answers.where, nextState)
    ? answers.where
    : pickPlaceForCampaign(nextState);
  answers.where = lockedWhere;

  const continueNotes = est.sceneWritten
    ? 'CONTINUE the already-written scene. Locked look and kit are visible facts in this beat — do not restart, do not print a form lock line. Code owns the ledger.'
    : '';
  const writerNotes = [aside, cheatLine, continueNotes].filter(Boolean).join(' ');

  return {
    generateOpening: true,
    state: {
      ...nextState,
      currentLocation: lockedWhere,
      campaignPremise: premise,
      openingEstablishment: {
        pending: [],
        answers,
        complete: true,
        registrar,
        declinedFields: declined,
        sceneWritten: est.sceneWritten,
        mode: est.mode,
      },
      quests: seedLocalStarterQuest(
        nextState.quests ?? [],
        resolveActiveCampaignBible(nextState)?.starterQuests ?? []
      ),
      pendingGeneratedOpening: false,
      choices: est.sceneWritten ? nextState.choices : [],
      log: nextState.log,
      lastUpdated: Date.now(),
    },
    openingNotes: writerNotes || openingNotes,
  };
}

export function formatSetupComplete(
  registrar: OpeningRegistrar,
  state: GameState
): string {
  const a = state.openingEstablishment?.answers ?? {};
  const name = a.name || state.character.name || 'unconfirmed';
  let where = a.where || state.currentLocation || 'unconfirmed';
  if (isUnusablePlace(where, state)) where = pickPlaceForCampaign(state);
  const wearRaw = a.wear || a.look || state.character.appearance || 'ordinary clothes';
  const wear = CLOTHES_NOUN.test(wearRaw)
    ? stripPlayerVoice(wearRaw)
    : isJunkSetupValue(wearRaw) || isSetupRefusal(wearRaw)
      ? 'everyday street clothes'
      : stripPlayerVoice(wearRaw);
  const kit = stripPlayerVoice(a.pockets || a.kit || 'ordinary pocket contents');
  if (registrar.voice === 'system') {
    return formatRegistrarLine(
      registrar,
      `Name on the panel: ${name}. You are still in ${where}, wearing ${wear}. Ordinary kit: ${kit}.`,
      { style: 'system' }
    );
  }
  return `${name}, still in ${where}, still wearing ${wear}.`;
}

export function hasSystemVoice(text: string): boolean {
  return /<system>|\[[^\]]*(SYSTEM|AUDITOR|TALE|STORY)[^\]]*\]/i.test(text);
}

export function ensureSystemReceipt(state: GameState, narrative: string): string {
  return sanitizeOpeningNarration(narrative).trim();
}

export function buildOpeningSceneMandate(state: GameState, notes?: string): string {
  const canon = formatPlayerCanon(state) || 'Use the campaign bible. Do not invent a different premise.';
  const extra = notes?.trim() ? `\nPlayer just said/asked: ${notes.trim()}\n` : '';
  const bible = resolveActiveCampaignBible(state);
  const cover = state.openingEstablishment?.pending[0];
  const coverLine = cover
    ? `End by weaving this ONE in-world question into the scene (not a form, not [ SYSTEM ] unless the bible is a System-panel moment): ${cover.question}`
    : 'Do not ask chargen questions. The first page is playable.';
  const hookText = state.openingEstablishment?.pickedHook?.trim()
    || resolveOpeningHook(bible, state.seed);
  const hook = hookText
    ? `Hook ingredients (rewrite with artistic license — do not reprint as a script):\n${hookText}\n`
    : '';
  if (state.openingEstablishment?.sceneWritten) {
    return `=== OPENING CONTINUE (BINDING) ===
${canon}
${extra}
The opening scene is ALREADY written. Do not restart. Do not reprint a registration form. Do not write "The particulars settle" or any form-lock line.
Continue THIS scene (same place, same people) in 3–6 sentences.
Show the locked look and kit as visible facts in the camera — code already owns the ledger.
Honor the configured PERSPECTIVE for the entire beat. Spoken lines must be grammatical. Never emit "a figure" as a name, "the a", or "unlock someone".
Then 3–4 local choices grounded in the continued beat.
================================================`;
  }
  return `=== OPENING (BINDING) ===
${canon}
${extra}
${hook}
Write THIS run's first page from the campaign bible and its game rules. Unique camera each New Game — not a template, not a registration form.

Genre practice (honor the story type):
- CYOA / Choice of Games / PYOA: drop into the crisis. No name form.
- LitRPG / System apocalypse: ordinary street first, then the panel as a moment. Earth is NOT being ingested.
- Isekai summon: arrive in the circle; people talk; clothes are a look-down, origin is "where the light took you from". Do not add "not a place in this cathedral" — the scene already shows that.
- Mystery / romance / space horror: body, door, or bulkhead already in motion.

1) 4–7 sentences of story in the seeded place. Honor the configured PERSPECTIVE for the entire beat.
2) Never print Confirm designation / Visual profile / Location logged / Setup complete.
3) ${coverLine}
4) Do not grant weapons or rare items. Only kit already on the sheet.
5) Spoken lines must be grammatical. Never emit "a figure" as a name, "the a", or "unlock someone".
6) Then 3–4 local choices grounded in THAT opening.
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
  const where = a.where || state.currentLocation || 'where you already were';
  const folk = a.folk || a.form || '';
  const folkBit = folk ? ` You are ${folk}.` : '';
  const bible = resolveActiveCampaignBible(state);
  const hook = state.openingEstablishment?.pickedHook?.trim()
    || resolveOpeningHook(bible, state.seed);
  const scene = hook
    || (/system integration|every human on earth/i.test(state.campaignPremise ?? '')
      ? `You are still in ${where} — same morning, same life — while the sky stays torn and a blue panel hangs at eye level.${folkBit} People nearby are shouting.`
      : `You are in ${where}.${folkBit} The scene that was already moving is still moving.`);
  const cover = state.openingEstablishment?.pending[0]?.question;
  return cover ? `${scene}\n\n${cover}` : scene;
}
