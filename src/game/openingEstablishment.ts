import type { CampaignBible, OpeningHookCard, OpeningMode, OpeningPrompt, OpeningPromptKind, OpeningRegistrar } from '@/data/campaigns/types';
import { OPENING_HOOK_DECKS } from '@/data/campaigns/openingHookDecks';
import { resolveActiveCampaignBible } from './campaignSeed';
import type { CampaignArchetype } from './archetypes';
import type { EngineMode, GameState, Item, LogEntry, OpeningEstablishment, Settings } from './types';
import { extractSystemRename, interpretPlayerUtterance, isJunkSetupValue, isSetupRefusal, utteranceIsMessy } from './playerUtterance';
import { materializeWornClothes } from './wornGear';
import { seedLocalStarterQuest } from './questPlay';
import { applyUsualSelfToCharacter, loadPlayerProfile, type PlayerProfile } from './playerProfile';
import { isPlayerQuestion } from './actionResolution';
import { pickQuickResponseButtons, supportsQuickResponseButtons, generateQuickResponse } from './quickResponseButtons';
import { loadSettings } from './db';

const GENERIC_NAMES = /^(adventurer|survivor|unknown survivor|hero|wanderer|unknown)$/i;

/**
 * Pack 12: Handle instant quick-response button clicks.
 * Returns state with instant response if button was handled, null otherwise.
 */
export function tryHandleQuickResponseButton(
  state: GameState,
  answer: string
): GameState | null {
  if (!openingFastSetupChipsEnabled()) return null;
  const est = state.openingEstablishment;
  if (!est || est.complete) return null;
  
  const currentPrompt = est.pending[0];
  if (!currentPrompt) return null;
  
  // Skip "✎ Other" - let user type
  if (answer.trim() === '✎ Other' || answer.trim() === 'Other') return null;
  
  // Only handle quick-response kinds
  if (!supportsQuickResponseButtons(currentPrompt.kind)) return null;
  
  // Check if this is one of our generated buttons
  const quickButtons = pickQuickResponseButtons(state, currentPrompt.kind);
  const isQuickButton = quickButtons.some(btn => 
    btn.toLowerCase().trim() === answer.toLowerCase().trim()
  );
  
  if (!isQuickButton) return null;
  
  // Generate instant response
  const characterName = state.character.name || 'The designation';
  const gmResponse = generateQuickResponse(currentPrompt.kind, answer, characterName);
  
  // Apply the answer to state
  const answers = { ...est.answers, [currentPrompt.id]: answer };
  const pending = est.pending.slice(1);
  
  const playerEntry: LogEntry = {
    id: crypto.randomUUID(),
    turn: state.turn,
    role: 'player',
    content: answer,
    timestamp: Date.now(),
  };
  
  const nextChoices = pending.length ? establishmentChoices(pending, state) : state.choices;
  const gmEntry: LogEntry = {
    id: crypto.randomUUID(),
    turn: state.turn,
    role: 'gm',
    content: gmResponse,
    timestamp: Date.now(),
    ...(nextChoices?.length ? { offeredChoices: nextChoices.slice(0, 4) } : {}),
  };
  
  // Apply answer to character state
  let nextState = applyKindToState(state, currentPrompt, answer);
  
  return {
    ...nextState,
    openingEstablishment: {
      ...est,
      answers,
      pending,
      complete: pending.length === 0,
    },
    choices: nextChoices,
    log: [...nextState.log, playerEntry, gmEntry],
    lastUpdated: Date.now(),
  };
}

export function characterNameIsGeneric(name?: string): boolean {
  const n = name?.trim() ?? '';
  return !n || GENERIC_NAMES.test(n);
}

const NAME_PROMPT: OpeningPrompt = {
  id: 'name',
  kind: 'name',
  question: 'Confirm designation.',
  suggestions: ['Random designation'],
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
  /\b(?:a\s+)?random\s+(?:earth\s+)?(?:place|location|city|town|spot)\b|\brandom\s+earth\s+city\b|\ba city i actually know\b|\bsomewhere\s+on\s+earth\b|\bon\s+earth\b|\ban?\s+(?:earth\s+)?city\b|\b(?:pick|choose|give)\s+(?:me\s+)?(?:a\s+)?random\b|\bi\s+can'?t\s+think\s+of\s+(?:a\s+)?(?:place|location|one)\b|\bthe\s+place\s+this\s+tale\s+names\b/i;

const META_SETUP_CHIP =
  /^(?:random\s+(?:designation|name|place|earth\s+city)|a city i actually know|the place this tale names|a street i invent|fate'?s pick|🎲?\s*let fate decide)$/i;

export function isRandomPlaceRequest(raw: string): boolean {
  return RANDOM_PLACE_REQUEST.test(raw.replace(/\s+/g, ' ').trim());
}

/** Meta chip labels — never spoken dialogue on the book unless they typed a real line. */
export function isOpeningSetupChipLabel(raw: string): boolean {
  return META_SETUP_CHIP.test(raw.replace(/\s+/g, ' ').trim());
}

/** Player bubble text for opening covers — chip labels become the locked canon value. */
export function openingAnswerDisplay(raw: string, locked: string): string {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return locked;
  if (isOpeningSetupChipLabel(t)) return locked;
  if (/^random\s+(name|designation)\b/i.test(t)) return locked;
  if (isRandomPlaceRequest(t)) return locked;
  return t;
}

function appendOpeningPlayerBubble(log: LogEntry[], turn: number, display: string | null): LogEntry[] {
  if (!display?.trim()) return log;
  const normalized = display.replace(/\s+/g, ' ').trim();
  const last = log[log.length - 1];
  if (last?.role === 'player' && last.content.replace(/\s+/g, ' ').trim() === normalized) {
    return log;
  }
  return [
    ...log,
    {
      id: crypto.randomUUID(),
      turn,
      role: 'player',
      content: normalized,
      timestamp: Date.now(),
    },
  ];
}

export function isLocationishOpeningUtterance(raw: string): boolean {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (isRandomPlaceRequest(t)) return true;
  if (META_SETUP_CHIP.test(t) && !/^random\s+(?:designation|name)$/i.test(t)) return true;
  if (/\b(?:somewhere\s+on\s+earth|on\s+earth|earth\s+city|random\s+place|i\s+was\s+at\s+home)\b/i.test(t)) {
    return true;
  }
  return false;
}

export function pickEarthPlace(): string {
  return pickRandom(RANDOM_PLACES);
}

function originCoverIsEarth(state: GameState): boolean {
  if (state.campaignBibleId === 'summoned-pact') return true;
  const bible = resolveActiveCampaignBible(state);
  if (bible?.id === 'summoned-pact') return true;
  const loc =
    state.openingEstablishment?.pending.find((p) => p.kind === 'location')
    ?? bible?.openingPrompts?.find((p) => p.kind === 'location');
  if (loc && /\bearth\b/i.test(loc.question)) return true;
  if ((loc?.suggestions ?? []).some((s) => /earth/i.test(s))) return true;
  return false;
}

export function pickPlaceForCampaign(state: GameState): string {
  const bible = resolveActiveCampaignBible(state);
  if (originCoverIsEarth(state)) return pickEarthPlace();
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
  if (isOpeningSetupChipLabel(p)) return true;
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

const PLACE_SUGGESTION =
  /random\s+(?:earth\s+)?(?:place|location|city|town)|earth city|a city i actually know|a street i invent|the place this tale names/i;

/** True when Settings → fastSetupChips is on (Pack 12 opening chip banks). Default off. */
export function openingFastSetupChipsEnabled(settings?: Settings | null): boolean {
  if (settings && typeof settings.fastSetupChips === 'boolean') return settings.fastSetupChips;
  try {
    return !!loadSettings().fastSetupChips;
  } catch {
    return false;
  }
}

/** Chips for the question on screen only (`pending[0]`), never the whole cover queue. */
export function establishmentChoices(
  pending: OpeningPrompt[],
  state?: GameState,
  settings?: Settings | null
): string[] {
  const current = pending[0];
  if (!current) return [];

  // Product law: natural free-text opening by default — no phone/purse/backpack chip rows.
  if (!openingFastSetupChipsEnabled(settings)) return [];

  // Pack 12: Use seed-varied quick-response buttons for kit/appearance/location
  if (state && supportsQuickResponseButtons(current.kind)) {
    const quickButtons = pickQuickResponseButtons(state, current.kind);
    if (quickButtons.length > 0) {
      return [...quickButtons, '✎ Other'];
    }
  }

  // Fallback to original chip logic (only when fastSetupChips is on)
  const chips: string[] = [];
  if (current.kind === 'name') {
    chips.push('Random designation');
    for (const s of current.suggestions ?? []) {
      if (/random\s+(?:designation|name)/i.test(s) || PLACE_SUGGESTION.test(s)) continue;
      if (!chips.includes(s)) chips.push(s);
    }
    for (const n of RANDOM_NAMES) {
      if (chips.length >= 4) break;
      if (!chips.includes(n)) chips.push(n);
    }
  } else if (current.kind === 'location') {
    chips.push(isEarthOriginPrompt(current) ? 'Random Earth city' : 'Random place');
    for (const s of current.suggestions ?? []) {
      if (/^random\s+(?:place|earth\s+city)$/i.test(s) || /random\s+(?:designation|name)/i.test(s)) continue;
      if (!chips.includes(s)) chips.push(s);
    }
  } else {
    for (const s of current.suggestions ?? []) {
      if (!chips.includes(s)) chips.push(s);
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

/** Pick a stable opener from `openingHooks` (or catalog decks, or `openingHook`). */
export function normalizeOpeningHookCard(card: OpeningHookCard): {
  text: string;
  location?: string;
  fallback?: string;
} {
  if (typeof card === 'string') {
    const text = card.trim();
    return { text, fallback: text || undefined };
  }
  const lines: string[] = [];
  const location = card.location?.trim() || undefined;
  if (location) lines.push(`Place: ${location}`);
  if (card.faction?.trim()) lines.push(`Who is here / who summoned: ${card.faction.trim()}`);
  if (card.summonIntent?.trim()) lines.push(`Why this happened: ${card.summonIntent.trim()}`);
  if (card.openingOffer?.trim()) {
    lines.push(`Opening offer (optional — player may refuse): ${card.openingOffer.trim()}`);
  }
  for (const beat of card.beats ?? []) {
    const b = beat.trim();
    if (b) lines.push(`- ${b}`);
  }
  if (card.text?.trim()) lines.push(card.text.trim());
  const fallback =
    card.fallback?.trim()
    || card.text?.trim()
    || (location ? `You are in ${location}.` : '');
  return {
    text: lines.join('\n'),
    location,
    fallback: fallback || undefined,
  };
}

export function openingHookDeck(bible: CampaignBible | undefined): OpeningHookCard[] {
  const fromBible = (bible?.openingHooks ?? []).filter((card) => normalizeOpeningHookCard(card).text);
  if (fromBible.length > 0) return fromBible;
  const fromCatalog = OPENING_HOOK_DECKS[bible?.id ?? ''] ?? [];
  if (fromCatalog.length > 0) return fromCatalog;
  const single = bible?.openingHook?.trim();
  return single ? [single] : [];
}

export function resolveOpeningHookPick(
  bible: CampaignBible | undefined,
  seed?: string
): { text: string; location?: string; fallback?: string } | undefined {
  const deck = openingHookDeck(bible).map(normalizeOpeningHookCard).filter((h) => h.text);
  if (deck.length === 0) return undefined;
  const idx = hashOpenerSeed(`${seed ?? '0'}|${bible?.id ?? 'bible'}|opener`) % deck.length;
  return deck[idx];
}

export function resolveOpeningHook(bible: CampaignBible | undefined, seed?: string): string | undefined {
  return resolveOpeningHookPick(bible, seed)?.text;
}

const BIBLE_INWORLD: Record<string, Partial<Record<OpeningPromptKind, string>>> = {
  'summoned-pact': {
    name: 'Someone in the scene needs a name for you. What do they call you?',
    appearance: 'You look down. You are still wearing what the light stole you in. What is it?',
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

/** Alone-arrival Summoned Pact — no NPC audience; the panel asks. */
const SUMMONED_ALONE_COVERS: Partial<Record<OpeningPromptKind, string>> = {
  name: 'Your blue panel waits on a designation. What name should it show?',
  appearance: 'You look down. You are still wearing what the light stole you in. What is it?',
  kit: 'Pockets, bag, whatever rode with you. What is actually on you? Nothing invented for a fight.',
};

const ALONE_ARRIVAL_MARK =
  /\balone\b|nobody here|no summoners|no handlers|outline of a building|foundation stones|burnt husk|wall-shell|half-collapsed ruin/i;

/** Seed-picked alone dump (ruin with no summoners on page one). */
export function isAloneArrivalPick(picked?: {
  text?: string;
  location?: string;
  fallback?: string;
} | null): boolean {
  if (!picked) return false;
  return ALONE_ARRIVAL_MARK.test(
    `${picked.location ?? ''}\n${picked.text ?? ''}\n${picked.fallback ?? ''}`
  );
}

export function isAloneArrivalOpening(state: GameState): boolean {
  if (state.openingEstablishment?.aloneArrival === true) return true;
  if (state.openingEstablishment?.aloneArrival === false) return false;
  return isAloneArrivalPick({
    text: state.openingEstablishment?.pickedHook,
    location: state.currentLocation,
    fallback: state.openingEstablishment?.pickedHookFallback,
  });
}

/** Re-voice covers when the opener has no people in the room. */
export function styleCoversForAloneArrival(
  prompts: OpeningPrompt[],
  bible: CampaignBible | undefined,
  alone: boolean
): OpeningPrompt[] {
  if (!alone || bible?.id !== 'summoned-pact') return prompts;
  return prompts.map((p) => {
    const aloneQ = SUMMONED_ALONE_COVERS[p.kind];
    if (!aloneQ) return p;
    return {
      ...p,
      style: p.kind === 'name' ? 'system' : (p.style ?? 'inworld'),
      question: aloneQ,
    };
  });
}

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

export function isEarthOriginPrompt(prompt: OpeningPrompt): boolean {
  if (/\bearth\b/i.test(prompt.question)) return true;
  return (prompt.suggestions ?? []).some((s) => /earth/i.test(s));
}

/** Pull an already-written Earth origin out of the opening page so we do not ask again. */
export function harvestEarthOriginFromProse(prose: string): string | null {
  const text = prose.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const apartment = text.match(
    /\b(?:his|her|your|my|the)\s+(?:small\s+)?(?:apartment|flat|house|studio)\b(?:\s+in\s+(?:a\s+)?[\w\s,]{2,40})?/i
  );
  if (apartment?.[0]) {
    return apartment[0].replace(/^(?:his|her|your|my)\s+/i, 'a ').replace(/^the\s+/i, 'the ').trim();
  }
  if (/\b(?:was\s+at\s+home|at\s+home(?:\.|,)|\bin\s+(?:my|his|her|your)\s+(?:bedroom|kitchen|flat|house))\b/i.test(text)) {
    return 'at home';
  }
  return null;
}

export function applyHarvestedOpeningCovers(
  est: NonNullable<GameState['openingEstablishment']>,
  prose: string
): NonNullable<GameState['openingEstablishment']> {
  const answers = { ...est.answers };
  let pending = [...est.pending];
  const origin = harvestEarthOriginFromProse(prose);
  if (origin) {
    answers.where = origin;
    pending = pending.filter((p) => p.kind !== 'location' || !isEarthOriginPrompt(p));
  }
  return {
    ...est,
    answers,
    pending,
    complete: pending.length === 0,
  };
}

export function litrpgOpeningSystemPing(state: GameState): string[] {
  if (state.engineMode !== 'litrpg') return [];
  if (state.campaignBibleId === 'summoned-pact') {
    return [
      'Registration incomplete',
      'Stamp: Pactborn / Calamity Mark — unresolved',
      'Gift: Circle Blessing [???] — unidentified',
    ];
  }
  return ['Interface online', 'Awaiting designation'];
}

export function seedCoverAnswers(
  bible: CampaignBible | undefined,
  character: GameState['character'],
  pickedPlace?: string | null
): Record<string, string> {
  const answers: Record<string, string> = {};
  const earthOrigin = (bible?.openingPrompts ?? []).some(isEarthOriginPrompt);
  const cardPlace = pickedPlace?.trim();
  // Opening-hook cards own the arrival place. Do not seed bible.startingLocation
  // (e.g. Sevenfold Circle) or the continue stitch will teleport after covers.
  if (cardPlace) {
    answers.where = cardPlace;
  } else if (
    bible?.startingLocation?.trim()
    && !earthOrigin
    && openingHookDeck(bible).length === 0
  ) {
    answers.where = bible.startingLocation.trim();
  }
  if (character.name?.trim() && !characterNameIsGeneric(character.name)) answers.name = character.name.trim();
  if (character.gender?.trim()) answers.gender = character.gender.trim();
  if (character.appearance?.trim() && !isJunkSetupValue(character.appearance)) {
    answers.wear = character.appearance.trim();
    answers.look = character.appearance.trim();
  }
  return answers;
}

/**
 * After weave covers, keep the arrival place the opener already painted.
 * Never collapse a seed-picked card place back to bible.startingLocation.
 */
export function resolveLockedOpeningPlace(
  state: GameState,
  answers: Record<string, string>
): string {
  const bible = resolveActiveCampaignBible(state);
  const bibleStart = bible?.startingLocation?.trim() || '';
  const fromState = state.currentLocation?.trim() || '';
  const fromAnswers = answers.where?.trim() || '';
  const picked = resolveOpeningHookPick(bible, state.seed)?.location?.trim() || '';

  const usable = (place: string) => !!place && !isUnusablePlace(place, state);

  // Card / live location wins when answers still hold the generic bible start.
  if (usable(fromState) && (!fromAnswers || (bibleStart && fromAnswers === bibleStart && fromState !== bibleStart))) {
    return fromState;
  }
  if (usable(fromAnswers) && !(bibleStart && fromAnswers === bibleStart && usable(picked) && picked !== bibleStart)) {
    return fromAnswers;
  }
  if (usable(picked)) return picked;
  if (usable(fromState)) return fromState;
  if (usable(fromAnswers)) return fromAnswers;
  return pickPlaceForCampaign(state);
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
    // Kit is sealed — bag exists undeclared; no questionnaire blocking play.
    if (p.kind === 'kit') return false;
    if (p.kind === 'name' && character.name?.trim() && !characterNameIsGeneric(character.name)) return false;
    if (p.kind === 'appearance' && character.appearance?.trim() && !isJunkSetupValue(character.appearance)) {
      return false;
    }
    if ((p.kind === 'species' || p.kind === 'identity') && /\b(elf|dwarf|human|orc|beast)\b/i.test(character.bio ?? '')) {
      return false;
    }
    return true;
  });
}

const SEALED_BAG: Item = {
  id: 'start-bag-sealed',
  name: 'Bag',
  rarity: 'Common',
  quantity: 1,
  itemType: 'accessory',
  itemLevel: 1,
  provenance: 'On you this morning',
  description:
    'A bag from before the pull. Contents sealed until you search, dump, or someone inventories them.',
};

/** Grant a sealed Earth bag (undeclared contents) when the campaign would have asked a kit cover. */
export function ensureSealedOpeningBag(state: GameState, prompts?: OpeningPrompt[]): GameState {
  const hadKitPrompt =
    (prompts ?? state.openingEstablishment?.pending ?? []).some((p) => p.kind === 'kit')
    || (resolveActiveCampaignBible(state)?.openingPrompts ?? []).some((p) => p.kind === 'kit')
    || state.campaignBibleId === 'summoned-pact'
    || state.engineMode === 'litrpg';
  if (!hadKitPrompt) return state;
  if (state.inventory.some((i) => /^bag$/i.test(i.name))) return state;
  return { ...state, inventory: [...state.inventory, { ...SEALED_BAG, id: `start-bag-${state.saveId ?? '0'}` }] };
}

/**
 * Drop kit covers from an in-progress opening and seal the bag.
 * Mid-session saves that still have a kit questionnaire get unblocked.
 */
export function sealKitOpeningCovers(state: GameState): GameState {
  const est = state.openingEstablishment;
  if (!est || est.complete) return state;
  if (!est.pending.some((p) => p.kind === 'kit')) {
    return ensureSealedOpeningBag(state);
  }
  const pending = est.pending.filter((p) => p.kind !== 'kit');
  const withBag = ensureSealedOpeningBag(
    {
      ...state,
      openingEstablishment: {
        ...est,
        pending,
        complete: pending.length === 0,
        answers: {
          ...est.answers,
          pockets: est.answers?.pockets ?? 'sealed — undeclared until searched',
        },
      },
      choices: pending.length ? establishmentChoices(pending, state) : state.choices,
    },
    [{ id: 'pockets', kind: 'kit', question: 'sealed' }]
  );
  return withBag;
}

/** Apply Settings → Profile preferred name/gender to a stuck opening (skip name cover). */
export function mergePreferredProfileIntoOpening(
  state: GameState,
  profile: PlayerProfile = loadPlayerProfile()
): { state: GameState; applied: boolean } {
  const preferredName = profile.preferredName.trim();
  if (!preferredName) return { state, applied: false };
  const est = state.openingEstablishment;
  if (!est || est.complete) return { state, applied: false };
  const namePending = est.pending.some((p) => p.kind === 'name');
  const answerName = est.answers?.name?.trim();
  if (!namePending && answerName && !characterNameIsGeneric(answerName)) {
    return { state, applied: false };
  }
  if (!namePending && !characterNameIsGeneric(state.character.name)) {
    return { state, applied: false };
  }

  const character = applyUsualSelfToCharacter(state.character, profile);
  const answers: Record<string, string> = {
    ...(est.answers ?? {}),
    name: preferredName,
  };
  if (profile.preferredGender.trim()) answers.gender = profile.preferredGender.trim();
  const pending = filterOpeningPrompts(est.pending, character);

  return {
    applied: true,
    state: {
      ...state,
      character,
      openingEstablishment: {
        ...est,
        answers,
        pending,
        complete: pending.length === 0,
      },
      choices: pending.length ? establishmentChoices(pending, state) : state.choices,
    },
  };
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
  const lockedName = answers.name?.trim();
  const lockedGender = answers.gender?.trim() || state.character.gender?.trim();
  const identityLock =
    lockedName || lockedGender
      ? `Name and gender already locked`
        + (lockedName ? ` (name: ${lockedName})` : '')
        + (lockedGender ? ` (gender: ${lockedGender})` : '')
        + `. Do not ask. Honor matching pronouns.\n`
      : '';
  return (
    `PLAYER CANON (facts only — rewrite in System/narrator voice, never quote I/my chat):\n${lines.join('\n')}\n`
    + identityLock
    +     `Inventory and equipped gear on the sheet are the only items they have until they accept an in-scene offer. `
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
  const pickedCard = resolveOpeningHookPick(bible, seed);
  const hook = (pickedCard?.fallback || pickedCard?.text || softenAssumedPlace(archetypeIntro)).replace(/\s*What do you do\??\s*$/i, '').trim();
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
  askedWhere: boolean;
} {
  return {
    name: extractGivenName(raw),
    location: extractLocation(raw),
    appearance: extractAppearance(raw),
    kit: extractKit(raw),
    species: extractSpecies(raw),
    askedWho: /\bwho\s+are\s+you\b/i.test(raw),
    askedWhat: /\bwhat(?:'s|\s+is)\s+going\s+on\b/i.test(raw) || /\bwhy\??\s*$/i.test(raw),
    askedWhere: /\bwhere\s+am\s+i\b/i.test(raw) || /\bwhere\s+is\s+this\b/i.test(raw),
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
  if (kind === 'name' && isLocationishOpeningUtterance(raw) && !extractGivenName(raw)) return null;
  const harvested = fieldForKind(kind, harvestUtterance(raw));
  if (harvested) {
    if (kind === 'name' && isLocationishOpeningUtterance(harvested) && !extractGivenName(harvested)) return null;
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
  { re: /\bbags?\b|\beveryday\s+stuff\b/i, name: 'Bag', description: 'A bag with ordinary pocket stuff from Earth. Not System-issue gear.' },
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
    // Kit is pockets/bag — never concatenate onto appearance or the chest
    // garment becomes "Everyday Street Clothes A Bag With Everyday Stuff".
    return {
      ...state,
      inventory: grantMundaneStartingItems(state.inventory, [
        ...clean.mundaneNames,
        ...mundaneBagNamesFromKit(clean.text),
      ]),
    };
  }
  return state;
}

/** Soft bag / pockets phrases from kit covers → sheet accessories. */
function mundaneBagNamesFromKit(text: string): string[] {
  const names: string[] = [];
  if (/\bbags?\b|\bpockets?\b|\beveryday\s+stuff\b/i.test(text)) names.push('Bag');
  return names;
}

function registrarAside(
  registrar: OpeningRegistrar,
  harvest: ReturnType<typeof harvestUtterance>,
  bibleId?: string,
  lockedName?: string | null,
  lockedPlace?: string | null
): string {
  const bits: string[] = [];
  const name =
    (lockedName ?? harvest.name ?? '').trim()
    && !/^(unknown|adventurer|hero)$/i.test((lockedName ?? harvest.name ?? '').trim())
      ? (lockedName ?? harvest.name)!.trim()
      : '';
  const place = (lockedPlace ?? harvest.location ?? '').trim();

  if (harvest.askedWho) {
    if (name) {
      if (bibleId === 'summoned-pact') {
        bits.push(
          `${name}. The voices over the circle have it. They pulled you from Earth — summoners, not a System eating the planet.`
        );
      } else if (bibleId === 'system-integration') {
        bits.push(
          `${name}. The panel has it. It is here in this life — not a machine eating Earth.`
        );
      } else if (bibleId === 'hero-awakening') {
        bits.push(
          `${name}. The Wake Ledger has it. This is still your world — private registration, not a summon.`
        );
      } else {
        bits.push(
          registrar.voice === 'system'
            ? `${name}. The System panel has your designation.`
            : `${name}. They have your name. The scene keeps moving.`
        );
      }
    } else if (bibleId === 'summoned-pact') {
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

  if (harvest.askedWhere) {
    if (place) {
      bits.push(`You are here: ${place}.`);
    } else if (bibleId === 'summoned-pact') {
      bits.push('You are on the floor of the summon circle in this world — not on Earth anymore.');
    } else if (bibleId === 'system-integration') {
      bits.push('You are still on this Earth — Integration is a panel over the life you already have.');
    } else if (bibleId === 'hero-awakening') {
      bits.push('You are where you already live — the Wake Ledger opened here, not a summoning.');
    } else {
      bits.push('You are in the opening scene — the next ask will lock the particulars.');
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
  /** Scene is live — route this line to the GM as play, not another cover prompt. */
  deferToPlay?: boolean;
}> {
  const beforeSeal = state.openingEstablishment;
  // Drop kit questionnaire; sealed bag — never block with chip banks / "Pat yourself down".
  state = sealKitOpeningCovers(state);
  const sealedFinishedOpening =
    !!beforeSeal
    && !beforeSeal.complete
    && beforeSeal.pending.some((p) => p.kind === 'kit')
    && state.openingEstablishment?.complete === true;

  if (sealedFinishedOpening) {
    return {
      state,
      generateOpening: true,
      openingNotes:
        'CONTINUE the already-written scene. Kit is a sealed bag — undeclared until the player searches or dumps it. Do not ask a kit form.',
    };
  }

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
  const currentKind = est.pending[0]?.kind;
  const locationTalkOnName =
    currentKind === 'name'
    && isLocationishOpeningUtterance(answer)
    && !extractGivenName(answer);
  if (locationTalkOnName) {
    harvest.name = null;
  }
  if (isRandomPlaceRequest(answer) || locationTalkOnName) {
    harvest.location = harvest.location && !isUnusablePlace(harvest.location, state)
      ? harvest.location
      : pickPlaceForCampaign(state);
  }
  if (harvest.location && harvest.name && harvest.location.toLowerCase() === harvest.name.toLowerCase()) {
    harvest.location = null;
  }
  if (harvest.location && isUnusablePlace(harvest.location, state)) {
    harvest.location = isRandomPlaceRequest(answer) || locationTalkOnName
      ? pickPlaceForCampaign(state)
      : null;
  }
  if (currentKind === 'name' && harvest.name && isLocationishOpeningUtterance(harvest.name) && !extractGivenName(harvest.name)) {
    harvest.name = null;
  }

  const acceptsCover =
    !!(currentKind && fieldForKind(currentKind, harvest))
    || isOpeningSetupChipLabel(answer)
    || /^random\s/i.test(answer)
    || !!(
      currentKind
      && !isPlayerQuestion(answer)
      && acceptCurrentField(currentKind, answer, state)
    );
  if (est.sceneWritten && isPlayerQuestion(answer) && !acceptsCover && !locationTalkOnName) {
    return { state, generateOpening: false, deferToPlay: true };
  }

  if (currentKind && !fieldForKind(currentKind, harvest) && !isMetaOnly(answer) && !locationTalkOnName) {
    const accepted = acceptCurrentField(currentKind, answer, state);
    if (accepted) {
      if (currentKind === 'name') {
        if (!isLocationishOpeningUtterance(accepted) || extractGivenName(accepted)) {
          harvest.name = extractGivenName(accepted) ?? accepted;
        }
      }
      if (currentKind === 'location') harvest.location = accepted;
      if (currentKind === 'appearance') harvest.appearance = accepted;
      if (currentKind === 'kit') harvest.kit = accepted;
      if (currentKind === 'species' || currentKind === 'identity') harvest.species = accepted;
    }
  }
  const skipModel =
    locationTalkOnName
    || isOpeningSetupChipLabel(answer)
    || /^random\s+(name|designation)\b/i.test(answer);
  const needsRead =
    !!settings &&
    !skipModel &&
    !isMetaOnly(answer) &&
    !isSetupRefusal(answer) &&
    (utteranceIsMessy(answer) || !!(currentKind && !fieldForKind(currentKind, harvest)));
  if (needsRead) {
    const cover = est.pending[0];
    const read = await interpretPlayerUtterance({
      raw: answer,
      mode: 'opening',
      pendingKinds: cover ? [cover.kind] : [],
      pendingQuestions: cover ? [cover.question] : [],
      settings,
      forceModel: !!(currentKind && !fieldForKind(currentKind, harvest)),
    });
    const readName = read.answers.name && extractGivenName(read.answers.name)
      ? extractGivenName(read.answers.name)
      : read.answers.name && !isLocationishOpeningUtterance(read.answers.name)
        ? read.answers.name
        : null;
    harvest.name = harvest.name ?? readName;
    harvest.location = harvest.location ?? read.answers.location;
    harvest.appearance = harvest.appearance ?? read.answers.appearance;
    harvest.kit = harvest.kit ?? read.answers.kit;
    harvest.species = harvest.species ?? read.answers.species;
    harvest.askedWho = harvest.askedWho || read.askedWho;
    harvest.askedWhat = harvest.askedWhat || read.askedWhat;
    if (currentKind && !fieldForKind(currentKind, harvest) && read.meaning && !read.questionOnly && !isJunkSetupValue(read.meaning)) {
      if (currentKind === 'name') {
        const named = extractGivenName(read.meaning);
        if (named) harvest.name = harvest.name ?? named;
      }
      if (currentKind === 'location' && !isOpeningSetupChipLabel(read.meaning)) {
        harvest.location = harvest.location ?? read.meaning;
      }
      if (currentKind === 'appearance') harvest.appearance = harvest.appearance ?? read.meaning;
      if (currentKind === 'kit') harvest.kit = harvest.kit ?? read.meaning;
      if (currentKind === 'species' || currentKind === 'identity') harvest.species = harvest.species ?? read.meaning;
    }
    if (harvest.appearance && isJunkSetupValue(harvest.appearance)) harvest.appearance = null;
    if (harvest.kit && isJunkSetupValue(harvest.kit)) harvest.kit = null;
    if (harvest.location && (isUnusablePlace(harvest.location, state) || harvest.location.toLowerCase() === (harvest.name ?? '').toLowerCase())) {
      harvest.location = isRandomPlaceRequest(answer) || locationTalkOnName
        ? pickPlaceForCampaign(state)
        : null;
    }
  }
  if (currentKind === 'name' && harvest.name && (isLocationishOpeningUtterance(harvest.name) || isOpeningSetupChipLabel(harvest.name))) {
    harvest.name = extractGivenName(harvest.name);
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
  const coverId = est.pending[0]?.id;
  let resolvedCoverDisplay: string | null = null;
  const markCoverResolved = (prompt: OpeningPrompt, lockedValue: string) => {
    if (prompt.id === coverId) {
      resolvedCoverDisplay = openingAnswerDisplay(answer, lockedValue);
    }
  };

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
    if (prompt.kind === 'location' && !clean.text) {
      if (isRandomPlaceRequest(value) || isRandomPlaceRequest(answer) || isOpeningSetupChipLabel(value)) {
        const place = pickPlaceForCampaign(nextState);
        nextState = applyKindToState(nextState, prompt, place);
        answers[prompt.id] = place;
        markCoverResolved(prompt, place);
        continue;
      }
      stillPending.push(prompt);
      continue;
    }
    const locked = clean.text || (prompt.kind === 'name' ? '' : value);
    if (!locked) {
      stillPending.push(prompt);
      continue;
    }
    nextState = applyKindToState(nextState, prompt, locked);
    answers[prompt.id] = locked;
    markCoverResolved(prompt, locked);
  }

  const lockedName =
    answers.name?.trim()
    || harvest.name?.trim()
    || nextState.character.name?.trim()
    || '';
  const lockedPlace =
    answers.where?.trim()
    || harvest.location?.trim()
    || nextState.currentLocation?.trim()
    || '';
  const aside = registrarAside(
    registrar,
    harvest,
    nextState.campaignBibleId,
    lockedName,
    lockedPlace
  );
  const cheatLine = cheated
    ? 'That gear does not appear. Ordinary pockets only.'
    : '';

  if (stillPending.length) {
    const next = stillPending[0];
    const extra = [aside, cheatLine].filter(Boolean).join('\n');
    const parseFail = est.pending[0]?.kind === 'name' && !harvest.name
      ? 'They are still waiting for a name you will own.'
      : '';
    const coverChoices = establishmentChoices(stillPending, nextState);
    const gmEntry = {
      id: crypto.randomUUID(),
      turn: nextState.turn,
      role: 'gm' as const,
      content: formatRegistrarLine(registrar, parseFail || next.question, {
        extra: extra || undefined,
        style: next.style ?? 'inworld',
      }),
      timestamp: Date.now(),
      ...(coverChoices.length ? { offeredChoices: coverChoices.slice(0, 4) } : {}),
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
          pickedHook: est.pickedHook,
          pickedHookFallback: est.pickedHookFallback,
          aloneArrival: est.aloneArrival,
        },
        choices: coverChoices,
        log: [
          ...appendOpeningPlayerBubble(nextState.log, nextState.turn, resolvedCoverDisplay),
          gmEntry,
        ],
        lastUpdated: Date.now(),
      },
    };
  }

  const canonLine = Object.values(answers).join(' / ').slice(0, 400);
  const premise = nextState.campaignPremise
    ? `${nextState.campaignPremise}\n\nPLAYER CANON: ${canonLine}`.slice(0, 2400)
    : `PLAYER CANON: ${canonLine}`;
  const openingNotes = [aside, cheatLine].filter(Boolean).join(' ');
  const lockedWhere = resolveLockedOpeningPlace(nextState, answers);
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
        pickedHook: est.pickedHook,
        pickedHookFallback: est.pickedHookFallback,
        aloneArrival: est.aloneArrival,
      },
      quests: seedLocalStarterQuest(
        nextState.quests ?? [],
        resolveActiveCampaignBible(nextState)?.starterQuests ?? [],
        isAloneArrivalOpening(nextState)
      ),
      pendingGeneratedOpening: false,
      choices: est.sceneWritten ? nextState.choices : [],
      log: appendOpeningPlayerBubble(nextState.log, nextState.turn, resolvedCoverDisplay),
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
  const systemPing =
    state.engineMode === 'litrpg'
      ? 'LitRPG: emit one short <system> registration ping (readable lines, not “incomprehensible symbols”). Code also paints the Status window — glance at the panel, do not replace it with mysticism.'
      : '';
  const hookText = state.openingEstablishment?.pickedHook?.trim()
    || resolveOpeningHook(bible, state.seed);
  const hook = hookText
    ? `Hook POINTER CARD (expand into a unique first page — do not reprint as a script, do not lecture the player):\n${hookText}\n`
    : '';
  if (state.openingEstablishment?.sceneWritten) {
    return `=== OPENING CONTINUE (BINDING) ===
${canon}
${extra}
The opening scene is ALREADY written. Do not restart. Do not reprint a registration form. Do not write "The particulars settle" or any form-lock line.
Continue THIS scene (same place, same people) in 3–6 sentences.
Show the locked look and kit as visible facts in the camera — code already owns the ledger.
Honor the configured PERSPECTIVE for the entire beat. Spoken lines must be grammatical. Never emit "a figure" as a name, "the a", or "unlock someone".
The camera is HERE. Do not relocate the PC by calling this interior "a nearby building/place/hall." Nearby is for things that are not here.
Then 3–4 local choices grounded in the continued beat. At least one must change the situation — kind/help, hard/refuse, talk/ask, or walk away — not three flavours of look around.
================================================`;
  }
  return `=== OPENING (BINDING) ===
${canon}
${extra}
${hook}
Write THIS run's first page from the pointer card and the campaign bible. Unique camera each New Game — not a template, not a registration form, not a reprint of the pointers.

Genre practice (honor the story type):
- CYOA / Choice of Games / PYOA: drop into the crisis. No name form.
- LitRPG / System apocalypse: ordinary street first, then the panel as a moment. Earth is NOT being ingested.
- Isekai summon: arrive in THIS run's picked place (not always a cathedral circle — may be alone in a ruin with no summoners). People talk when people are present; clothes are a look-down; origin is the Earth place the light took you from. Camera is HERE, not Earth. If the pointer card includes an opening offer, someone in the scene can voice it — the player may refuse. Alone cards: no welcoming NPC on page one; name/look/kit covers come from the blue panel or a look-down, never “someone in the scene.”
- Mystery / romance / space horror: body, door, or bulkhead already in motion.

1) 4–7 sentences of story in the seeded place. Honor the configured PERSPECTIVE for the entire beat. Full grammatical English — no telegram fragments ("Mass summon. Politics in the first breath.").
2) Never print Confirm designation / Visual profile / Location logged / Setup complete.
3) ${coverLine}
4) Do not add weapons or rare items to the sheet. NPCs may OFFER gear as a bargain (pact, enlistment, release). Describe the offer; do not invent it onto inventory until the player accepts. Until then, only kit already on the sheet exists. Do not lecture "nobody gets a sword."
5) Spoken lines must be grammatical. Never emit "a figure" as a name, "the a", or "unlock someone".
6) The camera is HERE. Do not relocate the PC by calling this interior "a nearby building/place/hall." Nearby is for things that are not here.
7) ${systemPing}
8) Then 3–4 local choices grounded in THAT opening. At least one choice must change the situation (kind/help, hard/refuse, talk a stake, or walk away) — not three flavours of look around / wait.
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
