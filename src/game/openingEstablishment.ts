import type { CampaignBible, OpeningPrompt, OpeningRegistrar } from '@/data/campaigns/types';
import type { CampaignArchetype } from './archetypes';
import type { EngineMode, GameState, Item, OpeningEstablishment } from './types';

const GENERIC_NAMES = /^(adventurer|survivor|unknown survivor|hero|wanderer|unknown)$/i;

const NAME_PROMPT: OpeningPrompt = {
  id: 'name',
  kind: 'name',
  question: 'Confirm designation.',
};

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
  if (registrar.voice === 'system') {
    return `[ ${registrar.label} ]\n${start}${extra}${query}`.trim();
  }
  return `${start}${extra}${query}`.trim();
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
    if (p.kind === 'appearance' && character.appearance?.trim()) return false;
    if ((p.kind === 'species' || p.kind === 'identity') && /\b(elf|dwarf|human|orc|beast)\b/i.test(character.bio ?? '')) {
      return false;
    }
    return true;
  });
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
    `PLAYER CANON (place / look / ordinary pockets — NOT a loot grant):\n${lines.join('\n')}\n`
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
    choices: first.suggestions ?? [],
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

const POWER_CLAIM =
  /\b(legendary|mythic|artifact|relic|god(?:like|-tier)?|best(?:\s+in\s+slot)?|strongest|highest(?:-|\s+)?(?:power|tier|rarity)|overpowered|\bop\b|plus\s*\d{2,}|nuclear|excalibur|mjolnir|infinity|unlimited|endgame|unique\s+weapon|vorpal|holy\s+avenger|dragon(?:scale|slayer)|mithril|adamant(?:ine|ite)?|plasma|laser|minigun|exosuit|power\s*armor)\b/i;

const COMBAT_GEAR_CLAIM =
  /\b(greatsword|longsword|shortsword|katana|plate\s+mail|full\s+plate|power\s*armor|battleaxe|warhammer|sniper|assault\s+rifle|rocket|grenade|wand\s+of|staff\s+of|holy\s+avenger)\b/i;

const MUNDANE_STARTING: Array<{ re: RegExp; name: string; description: string }> = [
  { re: /\bphones?\b/i, name: 'Phone', description: 'The phone you already had. Reception is dying with the rest of the grid.' },
  { re: /\bkeys?\b/i, name: 'Keys', description: 'House or car keys from this morning.' },
  { re: /\bwallets?\b/i, name: 'Wallet', description: 'Cards and a little cash. The System does not care about either yet.' },
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
    const name = text.split(/[,.—–-]| and | in | at | on /i)[0]?.trim() || text;
    return { text: name.slice(0, 40) || 'Adventurer', cheated, mundaneNames: [] };
  }
  if (kind === 'appearance' && (cheated || !text)) {
    text = text || 'The ordinary clothes you had on this morning';
  }
  if (kind === 'kit') {
    const mundaneNames = MUNDANE_STARTING.filter((m) => m.re.test(raw)).map((m) => m.name);
    if (cheated || !text) {
      text = mundaneNames.length
        ? mundaneNames.join(', ').toLowerCase()
        : 'Phone, keys, or whatever a normal morning actually puts in your pockets';
    }
    return { text: text.slice(0, 240), cheated, mundaneNames };
  }
  if (kind === 'location' && cheated) {
    text = text.split(/[,.]/)[0]?.trim() || 'Where you already were this morning';
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
    return {
      ...state,
      character: { ...state.character, appearance: clean.text.slice(0, 280) },
      inventory: retouchClothes(state.inventory, clean.text),
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

function retouchClothes(inventory: Item[], answer: string): Item[] {
  return inventory.map((item) => {
    if (item.slot !== 'Body' && !/clothes|tunic|jacket|shirt|armor/i.test(item.name)) return item;
    return {
      ...item,
      description: answer.slice(0, 240),
      provenance: item.provenance || 'What you were wearing when this started',
    };
  });
}

function retouchKit(inventory: Item[], answer: string): Item[] {
  return inventory.map((item) => {
    if (item.itemType === 'container' || /backpack|satchel|bag/i.test(item.name)) {
      return { ...item, description: `${item.description ?? item.name}. ${answer}`.slice(0, 240) };
    }
    return item;
  });
}

export function applyOpeningAnswer(state: GameState, rawInput: string): {
  state: GameState;
  generateOpening: boolean;
} {
  const est = state.openingEstablishment;
  if (!est || est.complete || !est.pending.length) {
    return { state, generateOpening: false };
  }
  const current = est.pending[0];
  const answer = stripChoicePrefix(rawInput);
  if (!answer) return { state, generateOpening: false };

  const clean = sanitizeOpeningAnswer(current.kind, answer);
  const afterKind = applyKindToState(state, current, answer);
  const answers = { ...est.answers, [current.id]: clean.text };
  const registrar = est.registrar ?? {
    voice: 'system' as const,
    label: 'SYSTEM',
    startLine: 'Starting. Please confirm your name and current location.',
  };
  const cheatNote = clean.cheated
    ? {
        id: crypto.randomUUID(),
        turn: afterKind.turn,
        role: 'gm' as const,
        content: formatRegistrarLine(
          registrar,
          'Invalid declaration. High-tier weapons, armor, and endgame gear are rejected. Allotment unchanged. Power is earned in play.'
        ),
        timestamp: Date.now(),
      }
    : null;
  const pending = est.pending.slice(1);
  const playerAlreadyLogged = afterKind.log.some(
    (e) => e.role === 'player' && e.content === rawInput && e.turn === afterKind.turn
  );

  if (pending.length) {
    const next = pending[0];
    const accepted = current.kind === 'name' ? `Designation logged: ${clean.text}` : undefined;
    const gmEntry = {
      id: crypto.randomUUID(),
      turn: afterKind.turn,
      role: 'gm' as const,
      content: formatRegistrarLine(registrar, next.question, { extra: accepted }),
      timestamp: Date.now(),
    };
    return {
      generateOpening: false,
      state: {
        ...afterKind,
        openingEstablishment: { pending, answers, complete: false, registrar },
        choices: next.suggestions ?? [],
        log: playerAlreadyLogged
          ? [...afterKind.log, ...(cheatNote ? [cheatNote] : []), gmEntry]
          : afterKind.log,
        lastUpdated: Date.now(),
      },
    };
  }

  const canonLine = Object.values(answers).join(' / ').slice(0, 400);
  const premise = afterKind.campaignPremise
    ? `${afterKind.campaignPremise}\n\nPLAYER CANON: ${canonLine}`.slice(0, 2400)
    : `PLAYER CANON: ${canonLine}`;

  return {
    generateOpening: true,
    state: {
      ...afterKind,
      campaignPremise: premise,
      openingEstablishment: { pending: [], answers, complete: true, registrar },
      pendingGeneratedOpening: true,
      choices: [],
      log: cheatNote ? [...afterKind.log, cheatNote] : afterKind.log,
      lastUpdated: Date.now(),
    },
  };
}

export function buildOpeningSceneMandate(state: GameState): string {
  const canon = formatPlayerCanon(state) || 'The player finished establishment.';
  return `=== OPENING SCENE (BINDING) ===
${canon}
Write 3–5 sentences that BEGIN play in the place they named, wearing what they named.
Do not grant weapons, armor, or rare items because they typed them. Only ordinary pocket stuff already on the sheet (phone, keys, campaign kit).
Do not invent a different city, race, or traveler origin.
Do not ask more chargen questions.
Do not write engine notes ("the sheet", "not a place you traveled to", "not a list of what you are carrying").
If this is modern Integration: this Earth, already in progress; the blue panel is here; people around them are reacting.
Then give 3–4 choices grounded in THAT opening.
================================================`;
}

export function synthesizeOpeningScene(state: GameState): string {
  const a = state.openingEstablishment?.answers ?? {};
  const where = a.where || state.currentLocation || 'where you already were';
  const wear = a.wear || a.look || state.character.appearance || 'the clothes you had on';
  const kit = a.pockets || a.kit || '';
  const folk = a.folk || a.form || '';
  const folkBit = folk ? ` You are ${folk}.` : '';
  const kitBit = kit ? ` On you: ${kit}.` : '';
  if (/system integration|every human on earth/i.test(state.campaignPremise ?? '')) {
    return (
      `You are still ${where} — the same morning, the same life — when the sky tears and the blue panel hangs in front of you.${folkBit} `
      + `You are wearing ${wear}.${kitBit} `
      + `Concrete and air are cracking. People nearby are shouting. The System has registered you. Survive.`
    );
  }
  return `This is where you said you are: ${where}.${folkBit} You are wearing ${wear}.${kitBit} The story starts from that, not from a blank adventurer sheet.`;
}
