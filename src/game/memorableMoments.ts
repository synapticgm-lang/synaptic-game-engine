import type {
  BeautyMomentOffer,
  GameState,
  LogEntry,
  MemorableMomentState,
  MemorableOfferKind,
  Settings,
} from './types';
import type { GameEvent, LootVideoRequest, MilestoneRequest } from './parser';
import { storyHasBody } from './turnAsk';

/** Skip this many story turns after a splash (death/ending ignore it). */
export const MEMORABLE_COOLDOWN_TURNS = 3;
/** Opener + at most one more in the first sitting. */
export const FIRST_SESSION_HARD_CAP = 2;
export const FIRST_SESSION_SOFT_CAP = FIRST_SESSION_HARD_CAP;
export const FIRST_SESSION_TURN_HORIZON = 16;
/** Later sittings (after ~16 turns, or a new night). Death may exceed. */
export const SESSION_HARD_CAP = 3;
export const SESSION_SOFT_CAP = SESSION_HARD_CAP;
/** Treat a gap this long as a new night / sitting. */
export const SITTING_STALE_MS = 8 * 60 * 60 * 1000;

export type MemorableBeatKind =
  | 'opening'
  | 'death'
  | 'legendary'
  | 'writer-tag'
  | 'ruler-audience';

export interface ResolveMemorableInput {
  settings: Pick<Settings, 'visualMode' | 'classicMemorableImages' | 'contentMode'>;
  /** State before this turn's memorable stamp is written. */
  state: GameState;
  /** Turn number of the GM beat being illustrated. */
  turn: number;
  storyText: string;
  writerTag: MilestoneRequest | null;
  events: GameEvent[];
  lootVideo: LootVideoRequest | null;
  /** True on the dedicated opening-scene writer (New Game / last cover). */
  isOpeningSceneTurn?: boolean;
  characterHp: number;
  characterConditions: string[];
  gainedItems: Array<{ name: string; rarity?: string }>;
}

export interface DetectedBeautyOffer {
  kind: MemorableOfferKind;
  personKey?: string;
  personLabel?: string;
  imagePrompt: string;
}

export interface MemorableDecision {
  request: MilestoneRequest | null;
  nextState: MemorableMomentState;
  beat: MemorableBeatKind | null;
  /** Loot-video already covers this legendary — do not also enqueue a splash. */
  skipImageForLootVideo?: boolean;
  /** Player choice only — never auto-enqueued. */
  beautyOffer?: DetectedBeautyOffer | null;
}

export function isClassicMemorableEnabled(
  settings: Pick<Settings, 'visualMode' | 'classicMemorableImages'>
): boolean {
  return settings.visualMode === 'classic' && settings.classicMemorableImages === true;
}

export function emptyMemorableState(): MemorableMomentState {
  return {};
}

function priorStoryBody(log: LogEntry[] | undefined): boolean {
  return (log ?? []).some((entry) => entry.role === 'gm' && storyHasBody(entry.content));
}

function onCooldown(mem: MemorableMomentState, turn: number): boolean {
  const last = mem.lastSplashTurn;
  if (typeof last !== 'number') return false;
  return turn - last <= MEMORABLE_COOLDOWN_TURNS;
}

export function resolveSitting(
  mem: MemorableMomentState,
  now = Date.now()
): { count: number; startedAt: number } {
  const started = mem.sittingStartedAt;
  if (typeof started !== 'number' || now - started > SITTING_STALE_MS) {
    return { count: 0, startedAt: now };
  }
  return { count: mem.sessionSplashCount ?? 0, startedAt: started };
}

export function sittingHardCap(turn: number): number {
  return turn <= FIRST_SESSION_TURN_HORIZON ? FIRST_SESSION_HARD_CAP : SESSION_HARD_CAP;
}

export function isSittingHardBlocked(mem: MemorableMomentState, turn: number, now = Date.now()): boolean {
  const sitting = resolveSitting(mem, now);
  return sitting.count >= sittingHardCap(turn);
}

function offerBlocked(mem: MemorableMomentState, turn: number): boolean {
  if (isSittingHardBlocked(mem, turn)) return true;
  if (onCooldown(mem, turn)) return true;
  const lastOffer = mem.lastBeautyOfferTurn;
  if (typeof lastOffer === 'number' && turn - lastOffer <= MEMORABLE_COOLDOWN_TURNS) return true;
  return false;
}

const DEATH_CONDITION = /\b(dead|killed|deceased|slain|dying)\b/i;
const DEATH_PROSE =
  /\b(you (?:are|were) (?:dead|killed|slain)|you die(?:d)?\b|your (?:story|campaign) ends)\b/i;

export function detectPlayerDeath(
  hp: number,
  conditions: string[] | undefined,
  storyText: string
): boolean {
  if (hp <= 0) return true;
  if ((conditions ?? []).some((c) => DEATH_CONDITION.test(c))) return true;
  return DEATH_PROSE.test(storyText);
}

const LEGENDARY_RARITY = /^(legendary|mythic|artifact)$/i;

function isLegendaryRarity(rarity: string | undefined): boolean {
  return !!rarity && LEGENDARY_RARITY.test(rarity.trim());
}

export function synthesizeMemorablePrompt(opts: {
  beat: MemorableBeatKind | 'beauty-offer';
  storyText: string;
  location?: string;
  extra?: string;
  kidMode?: boolean;
}): string {
  const excerpt = excerptForImage(opts.storyText);
  const place = opts.location?.trim();
  const extra = opts.extra?.trim();
  if (opts.beat === 'opening') {
    return place
      ? `Wide establishing shot of ${place}. ${excerpt}`
      : `Wide establishing shot of the opening scene. ${excerpt}`;
  }
  if (opts.beat === 'death') {
    return `The fatal moment. ${excerpt}`;
  }
  if (opts.beat === 'legendary') {
    return extra
      ? `A legendary item revealed: ${extra}. ${excerpt}`
      : `A legendary prize revealed. ${excerpt}`;
  }
  if (opts.beat === 'ruler-audience') {
    return extra
      ? `First royal audience with ${extra}. ${excerpt}`
      : `A first audience with a ruler. ${excerpt}`;
  }
  if (opts.beat === 'beauty-offer') {
    const look = extra
      ? `A striking first look at ${extra}. ${excerpt}`
      : `A striking first look at someone noteworthy. ${excerpt}`;
    return opts.kidMode
      ? `Tasteful, fully clothed storybook portrait. ${look}`
      : look;
  }
  return excerpt;
}

function excerptForImage(text: string): string {
  const cleaned = (text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'A dramatic storybook scene, no text.';
  if (cleaned.length <= 280) return cleaned;
  const cut = cleaned.slice(0, 280);
  const sentence = cut.match(/^[\s\S]+?[.!?](?=\s|$)/);
  return (sentence?.[0] ?? cut).trim();
}

function pickPrompt(writerTag: MilestoneRequest | null, synthesized: string): string {
  const tagged = writerTag?.imagePrompt?.trim();
  return tagged || synthesized;
}

function nextSplashStamp(prev: MemorableMomentState, turn: number): MemorableMomentState {
  const sitting = resolveSitting(prev);
  return {
    ...prev,
    lastSplashTurn: turn,
    sessionSplashCount: sitting.count + 1,
    sittingStartedAt: sitting.startedAt,
  };
}

function stamp(
  prev: MemorableMomentState,
  turn: number,
  beat: MemorableBeatKind,
  extra?: { rulerKey?: string }
): MemorableMomentState {
  const next: MemorableMomentState = nextSplashStamp(prev, turn);
  if (beat === 'opening') next.openingSplashFired = true;
  if (beat === 'death') next.deathSplashFired = true;
  if (beat === 'legendary') next.legendarySplashFired = true;
  if (beat === 'ruler-audience' && extra?.rulerKey) {
    next.rulerNamesSplashed = uniqueKeys(prev.rulerNamesSplashed, extra.rulerKey);
  }
  return next;
}

function stampOffer(
  prev: MemorableMomentState,
  turn: number,
  extra?: { personKey?: string; rulerKey?: string }
): MemorableMomentState {
  return {
    ...prev,
    lastBeautyOfferTurn: turn,
    ...(extra?.personKey
      ? { beautyOfferedKeys: uniqueKeys(prev.beautyOfferedKeys, extra.personKey) }
      : {}),
    ...(extra?.rulerKey
      ? { rulerNamesSplashed: uniqueKeys(prev.rulerNamesSplashed, extra.rulerKey) }
      : {}),
  };
}

function uniqueKeys(list: string[] | undefined, key: string): string[] {
  const next = [...(list ?? [])];
  if (!next.includes(key)) next.push(key);
  return next;
}

function fire(
  beat: MemorableBeatKind,
  input: ResolveMemorableInput,
  prev: MemorableMomentState,
  synthesized: string,
  extras?: { skipImageForLootVideo?: boolean; rulerKey?: string }
): MemorableDecision {
  const prompt = pickPrompt(input.writerTag, synthesized);
  return {
    request: extras?.skipImageForLootVideo ? null : { imagePrompt: prompt },
    nextState: stamp(prev, input.turn, beat, { rulerKey: extras?.rulerKey }),
    beat,
    skipImageForLootVideo: extras?.skipImageForLootVideo,
  };
}

function offerDecision(
  prev: MemorableMomentState,
  turn: number,
  offer: DetectedBeautyOffer,
  extra?: { personKey?: string; rulerKey?: string }
): MemorableDecision {
  return {
    request: null,
    nextState: stampOffer(prev, turn, extra),
    beat: null,
    beautyOffer: offer,
  };
}

function detectOpening(
  input: ResolveMemorableInput,
  prev: MemorableMomentState
): string | null {
  if (prev.openingSplashFired) return null;
  if (!storyHasBody(input.storyText)) return null;
  if (input.isOpeningSceneTurn) {
    return synthesizeMemorablePrompt({
      beat: 'opening',
      storyText: input.storyText,
      location: input.state.currentLocation,
    });
  }
  if (input.state.openingEstablishment?.sceneWritten) return null;
  if (priorStoryBody(input.state.log)) return null;
  return synthesizeMemorablePrompt({
    beat: 'opening',
    storyText: input.storyText,
    location: input.state.currentLocation,
  });
}

/** Conservative realm-ruler titles only — not lord / lady / sir / captain / guildmaster. */
const RULER_TITLE =
  '(?:high\\s+king|high\\s+queen|high\\s+ruler|regent\\s+of\\s+the\\s+realm|' +
  'emperor|empress|pharaoh|sultan|monarch|sovereign|tsar|czar|shah|caliph|' +
  'maharaja|maharani|king|queen)';

const NAMED_RULER = new RegExp(
  `\\b(${RULER_TITLE})\\s+([A-Z][A-Za-z'\\-]+(?:\\s+[A-Z][A-Za-z'\\-]+)?)(?!'s)\\b`,
  'g'
);

const THE_RULER = new RegExp(`\\bthe\\s+(${RULER_TITLE})\\b(?!'s)`, 'gi');

const RULER_IN_NAME = new RegExp(`\\b${RULER_TITLE}\\b`, 'i');

const AUDIENCE_CONTEXT =
  /\b(?:audience with|granted audience|throne room|before the throne|brought before|presented to|bow(?:ed|s)? before|kneel(?:ed|s)? before|(?:his|her|your) majesty|from the (?:throne|dais))\b/i;

function normalizePersonKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function titleCaseLabel(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function isGenericRulerKey(key: string): boolean {
  return key.startsWith('the ');
}

export function detectRulerAudience(
  storyText: string,
  events: GameEvent[],
  alreadySplashed: string[] | undefined
): { key: string; label: string } | null {
  if (!AUDIENCE_CONTEXT.test(storyText)) return null;

  const seen = alreadySplashed ?? [];

  const take = (key: string, label: string): { key: string; label: string } | null => {
    if (seen.includes(key)) return null;
    if (isGenericRulerKey(key) && seen.length > 0) return null;
    return { key, label };
  };

  for (const event of events) {
    if (event.type !== 'lore-card' || event.cardType !== 'npc') continue;
    const name = event.name?.trim();
    if (!name || !RULER_IN_NAME.test(name)) continue;
    const hit = take(normalizePersonKey(name), name);
    if (hit) return hit;
  }

  const named = [...storyText.matchAll(NAMED_RULER)];
  for (const match of named) {
    const title = match[1];
    const given = match[2];
    if (!title || !given) continue;
    const label = `${titleCaseLabel(title)} ${given}`;
    const hit = take(normalizePersonKey(label), label);
    if (hit) return hit;
  }

  THE_RULER.lastIndex = 0;
  const generic = THE_RULER.exec(storyText);
  if (!generic?.[1]) return null;
  const label = `the ${titleCaseLabel(generic[1])}`;
  return take(normalizePersonKey(label), label);
}

const BEAUTY_ADJ =
  '(?:stunning(?:ly)?|breathtaking(?:ly)?|gorgeous|beautiful|handsome|' +
  'strikingly\\s+(?:beautiful|handsome|gorgeous)|heart-stoppingly\\s+beautiful|' +
  'unearthly\\s+beauty)';

const PERSON_NOUN =
  '(?:woman|man|girl|boy|lady|gentleman|stranger|visitor|elf|dwarf|orc|tiefling|' +
  'companion|courtier|princess|prince|maiden|youth|priestess|priest|sorceress|' +
  'wizard|knight|noble|guest|dancer|singer|bard|host|hostess)';

const ADJ_THEN_PERSON = new RegExp(
  `\\b${BEAUTY_ADJ}\\s+(?:young\\s+|old\\s+|tall\\s+)?(${PERSON_NOUN}|[A-Z][A-Za-z'\\-]{2,})\\b`,
  'gi'
);

const PERSON_THEN_ADJ = new RegExp(
  `\\b(she|he|they|[A-Z][A-Za-z'\\-]{2,}(?:\\s+[A-Z][A-Za-z'\\-]+)?)\\s+` +
    `(?:was|is|looked|appeared|seemed)\\s+(?:absolutely\\s+|truly\\s+|so\\s+|almost\\s+)?${BEAUTY_ADJ}\\b`,
  'g'
);

const FACE_BEAUTY = new RegExp(
  `\\b(?:her|his|their)\\s+(?:strikingly\\s+)?(?:beautiful|handsome|stunning|gorgeous)\\s+(?:face|features|eyes|look)\\b`,
  'i'
);

const BEAUTY_NOUN_PHRASE =
  /\b(?:a|an|the)\s+(?:stunning|breathtaking|striking|unearthly|rare)\s+beauty\b/i;

const SELF_BEAUTY =
  /\b(?:you look|you are|you're|you were|yourself)\s+(?:so\s+|truly\s+|absolutely\s+)?(?:stunning|beautiful|handsome|gorgeous|breathtaking)\b/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const NOT_A_PERSON =
  /^(?:day|morning|evening|night|view|sight|place|city|town|hall|room|garden|weather|song|voice|idea|thing|world|moment|reward|sum|price|offer|light|sunset|sunrise|sky|sea|forest|castle|house|door|window|this)$/i;

function isPlayerSubject(label: string, playerName: string | undefined): boolean {
  const key = normalizePersonKey(label);
  if (key === 'you' || key === 'yourself') return true;
  if (!playerName?.trim()) return false;
  return key === normalizePersonKey(playerName);
}

function isPersonLabel(label: string): boolean {
  const key = normalizePersonKey(label).replace(/^this\s+/, '');
  return !NOT_A_PERSON.test(key);
}

export function detectNoteworthyBeauty(
  storyText: string,
  playerName: string | undefined,
  alreadyOffered: string[] | undefined
): { key: string; label: string } | null {
  if (!storyHasBody(storyText)) return null;
  const hasPersonBeauty =
    new RegExp(ADJ_THEN_PERSON.source, 'i').test(storyText)
    || new RegExp(PERSON_THEN_ADJ.source, 'i').test(storyText)
    || FACE_BEAUTY.test(storyText)
    || BEAUTY_NOUN_PHRASE.test(storyText);
  if (!hasPersonBeauty) return null;

  const offered = alreadyOffered ?? [];
  const candidates: Array<{ key: string; label: string }> = [];

  ADJ_THEN_PERSON.lastIndex = 0;
  for (const match of storyText.matchAll(ADJ_THEN_PERSON)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    const label = /^[A-Z]/.test(raw) ? raw : `this ${raw.toLowerCase()}`;
    candidates.push({ key: normalizePersonKey(label), label });
  }

  PERSON_THEN_ADJ.lastIndex = 0;
  for (const match of storyText.matchAll(PERSON_THEN_ADJ)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    const pronoun = /^(she|he|they)$/i.test(raw);
    const label = pronoun ? 'someone' : raw;
    candidates.push({ key: normalizePersonKey(label), label });
  }

  if (FACE_BEAUTY.test(storyText) || BEAUTY_NOUN_PHRASE.test(storyText)) {
    candidates.push({ key: 'someone', label: 'someone' });
  }

  if (candidates.length === 0) return null;

  const other = candidates.find(
    (c) => isPersonLabel(c.label) && !isPlayerSubject(c.label, playerName) && !offered.includes(c.key)
  );
  if (!other) return null;
  if (SELF_BEAUTY.test(storyText) && other.key === 'someone' && candidates.every((c) => isPlayerSubject(c.label, playerName) || c.key === 'someone')) {
    return null;
  }
  if (playerName?.trim()) {
    const selfRe = new RegExp(
      `\\b${escapeRegExp(playerName.trim())}\\s+(?:looks?|is|was)\\s+(?:so\\s+|truly\\s+)?(?:stunning|beautiful|handsome|gorgeous|breathtaking)\\b`,
      'i'
    );
    if (selfRe.test(storyText) && isPlayerSubject(other.label, playerName)) return null;
  }
  return other;
}

/**
 * Classic memorable only. Comic mode is untouched.
 * Auto: opening + death. Legendary is loot-video only (no second still).
 * Soft beats (ruler audience, writer tag, beauty) are tap-yes offers.
 * First combat is never auto and is never offered unless the writer tagged a real milestone.
 */
export function resolveMemorableMoment(input: ResolveMemorableInput): MemorableDecision {
  const prev = input.state.memorableMoments ?? emptyMemorableState();
  const idle: MemorableDecision = { request: null, nextState: prev, beat: null };
  if (!isClassicMemorableEnabled(input.settings)) return idle;
  if (!storyHasBody(input.storyText)) return idle;

  if (!prev.deathSplashFired && detectPlayerDeath(input.characterHp, input.characterConditions, input.storyText)) {
    return fire(
      'death',
      input,
      prev,
      synthesizeMemorablePrompt({ beat: 'death', storyText: input.storyText })
    );
  }

  const openingPrompt = detectOpening(input, prev);
  if (openingPrompt) {
    return fire('opening', input, prev, openingPrompt);
  }

  const legendaryItem =
    input.gainedItems.find((item) => isLegendaryRarity(item.rarity))
    ?? (input.lootVideo && isLegendaryRarity(input.lootVideo.itemRarity)
      ? { name: input.lootVideo.itemName, rarity: input.lootVideo.itemRarity }
      : undefined);

  if (!prev.legendarySplashFired && (input.lootVideo || legendaryItem)) {
    const synthesized = synthesizeMemorablePrompt({
      beat: 'legendary',
      storyText: input.storyText,
      extra: legendaryItem?.name ?? input.lootVideo?.itemName,
    });
    if (input.lootVideo) {
      return fire('legendary', input, prev, synthesized, { skipImageForLootVideo: true });
    }
    if (!isSittingHardBlocked(prev, input.turn)) {
      return fire('legendary', input, prev, synthesized);
    }
  }

  if (offerBlocked(prev, input.turn)) {
    return idle;
  }

  const ruler = detectRulerAudience(input.storyText, input.events, prev.rulerNamesSplashed);
  if (ruler) {
    return offerDecision(
      prev,
      input.turn,
      {
        kind: 'ruler-audience',
        personKey: ruler.key,
        personLabel: ruler.label,
        imagePrompt: synthesizeMemorablePrompt({
          beat: 'ruler-audience',
          storyText: input.storyText,
          extra: ruler.label,
        }),
      },
      { rulerKey: ruler.key }
    );
  }

  if (input.writerTag?.imagePrompt?.trim()) {
    return offerDecision(prev, input.turn, {
      kind: 'writer-tag',
      imagePrompt: input.writerTag.imagePrompt.trim(),
    });
  }

  const beauty = detectNoteworthyBeauty(
    input.storyText,
    input.state.character?.name,
    prev.beautyOfferedKeys
  );
  if (beauty) {
    return offerDecision(
      prev,
      input.turn,
      {
        kind: 'beauty',
        personKey: beauty.key,
        personLabel: beauty.label,
        imagePrompt: synthesizeMemorablePrompt({
          beat: 'beauty-offer',
          storyText: input.storyText,
          extra: beauty.label,
          kidMode: input.settings.contentMode === 'kid',
        }),
      },
      { personKey: beauty.key }
    );
  }

  return idle;
}

/** Weekly memorable quota is the money gate — skip art and do not stamp cadence if it would spend. */
export function decideClassicMemorable(
  input: ResolveMemorableInput,
  canSpendMemorable: boolean
): MemorableDecision {
  const decision = resolveMemorableMoment(input);
  if (!canSpendMemorable && (decision.request || decision.beautyOffer)) {
    return {
      request: null,
      nextState: input.state.memorableMoments ?? emptyMemorableState(),
      beat: null,
    };
  }
  return decision;
}

export function memorableLogFields(decision: MemorableDecision): Partial<LogEntry> {
  return {
    ...(decision.request ? { entryKind: 'milestone' as const, imageStatus: 'pending' as const } : {}),
    ...(decision.beautyOffer
      ? {
          beautyOffer: {
            kind: decision.beautyOffer.kind,
            personKey: decision.beautyOffer.personKey,
            personLabel: decision.beautyOffer.personLabel,
            imagePrompt: decision.beautyOffer.imagePrompt,
            status: 'pending' as const,
          } satisfies BeautyMomentOffer,
        }
      : {}),
  };
}

export function applyAcceptedBeautyOffer(
  state: GameState,
  entryId: string
): { next: GameState; prompt: string } | null {
  const entry = state.log.find((item) => item.id === entryId);
  const offer = entry?.beautyOffer;
  if (!entry || !offer || offer.status !== 'pending') return null;

  const mem = state.memorableMoments ?? emptyMemorableState();
  if (isSittingHardBlocked(mem, entry.turn)) return null;

  const splash = nextSplashStamp(mem, entry.turn);
  const next: GameState = {
    ...state,
    memorableMoments: {
      ...splash,
      lastBeautyOfferTurn: entry.turn,
      ...(offer.personKey
        ? { beautyOfferedKeys: uniqueKeys(mem.beautyOfferedKeys, offer.personKey) }
        : {}),
      ...(offer.kind === 'ruler-audience' && offer.personKey
        ? { rulerNamesSplashed: uniqueKeys(mem.rulerNamesSplashed, offer.personKey) }
        : {}),
    },
    log: state.log.map((item) =>
      item.id === entryId
        ? {
            ...item,
            entryKind: 'milestone' as const,
            imageStatus: 'pending' as const,
            beautyOffer: { ...offer, status: 'accepted' as const },
          }
        : item
    ),
    lastUpdated: Date.now(),
  };
  return { next, prompt: offer.imagePrompt };
}

export function applyDismissedBeautyOffer(state: GameState, entryId: string): GameState | null {
  const entry = state.log.find((item) => item.id === entryId);
  const offer = entry?.beautyOffer;
  if (!entry || !offer || offer.status !== 'pending') return null;
  return {
    ...state,
    log: state.log.map((item) =>
      item.id === entryId
        ? { ...item, beautyOffer: { ...offer, status: 'dismissed' as const } }
        : item
    ),
    lastUpdated: Date.now(),
  };
}
