import type {
  BeautyMomentOffer,
  GameState,
  LogEntry,
  MemorableMomentState,
  MemorableOfferKind,
  Settings,
  StoryPlate,
} from './types';
import type { ActiveDungeonState } from './mapEngine';
import type { GameEvent, LootVideoRequest, MilestoneRequest } from './parser';
import { storyHasBody } from './turnAsk';
import { isUnsalvageableKidImagePrompt, prepareKidSafeImagePrompt, stripKidUnsafeImageLexicon } from './visualCanon';

/** Skip this many story turns after a splash (death/ending ignore it). */
export const MEMORABLE_COOLDOWN_TURNS = 3;
/** Opener + at most one more in the first sitting. Death, first-dungeon-boss, and PYOA ending may exceed. */
export const FIRST_SESSION_HARD_CAP = 2;
export const FIRST_SESSION_SOFT_CAP = FIRST_SESSION_HARD_CAP;
export const FIRST_SESSION_TURN_HORIZON = 16;
/** Later sittings (after ~16 turns, or a new night). Death, first-dungeon-boss, and PYOA ending may exceed. */
export const SESSION_HARD_CAP = 3;
export const SESSION_SOFT_CAP = SESSION_HARD_CAP;
/** PYOA rails forbid ending in the opening hour — refuse a writer tag before this turn. */
export const PYOA_ENDING_MIN_TURN = 8;
/** Treat a gap this long as a new night / sitting. */
export const SITTING_STALE_MS = 8 * 60 * 60 * 1000;

export type MemorableBeatKind =
  | 'opening'
  | 'death'
  | 'ending'
  | 'legendary'
  | 'dungeon-boss'
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
  /** Ledger / auto-fight kill this turn — required for dungeon-boss splash. */
  defeatedEnemyName?: string | null;
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
  /** A book-worthy beat was detected but weekly quota blocked the spend. */
  skippedForCapacity?: boolean;
}

export function isClassicMemorableEnabled(
  settings: Pick<Settings, 'visualMode' | 'classicMemorableImages'>
): boolean {
  return settings.visualMode === 'classic' && settings.classicMemorableImages === true;
}

export function emptyMemorableState(): MemorableMomentState {
  return {};
}

/** Caption on the plate — tied to why the picture fired, never the word Milestone. */
export function plateCopyForBeat(
  beat: MemorableBeatKind | MemorableOfferKind,
  opts?: { kid?: boolean }
): { title: string; toast: string } {
  const kid = opts?.kid === true;
  const title =
    beat === 'opening'
      ? 'Chapter One'
      : beat === 'death'
        ? kid
          ? 'A quiet rest'
          : 'The book closes'
        : beat === 'ending'
          ? 'The last page'
          : beat === 'dungeon-boss'
            ? kid
              ? 'The first victory'
              : 'First Blood'
            : beat === 'legendary'
              ? 'A legendary find'
              : beat === 'ruler-audience'
                ? 'An audience granted'
                : beat === 'beauty'
                  ? 'A sight to remember'
                  : 'A moment worth keeping';
  return {
    title,
    toast:
      beat === 'opening'
        ? 'Achievement unlocked — So it begins'
        : `Achievement unlocked — ${title}`,
  };
}

const LEGACY_MILESTONE_LABEL = /^(?:✦\s*)?milestone(?:\s*✦)?$/i;

export function splashPlateLabel(entry: Pick<LogEntry, 'splashTitle' | 'turn'>): string {
  const titled = entry.splashTitle?.trim();
  // Opening splash on old saves / live-behind builds had no splashTitle — never say Milestone.
  if (titled && !LEGACY_MILESTONE_LABEL.test(titled)) return titled;
  if (typeof entry.turn === 'number' && entry.turn <= 1) return 'Chapter One';
  return 'A moment worth keeping';
}

/** Compact fail line under the plate title. Story stays; no black "Milestone" slab. */
export function splashUnavailableLine(
  entry: Pick<LogEntry, 'splashTitle' | 'turn' | 'imageFailMessage'>
): string {
  const detail = entry.imageFailMessage?.trim();
  if (detail && !/milestone/i.test(detail)) return detail;
  return `${splashPlateLabel(entry)} art unavailable — the story continues.`;
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

function kidModeOn(settings: Pick<Settings, 'contentMode'> | undefined): boolean {
  return settings?.contentMode === 'kid';
}

export function synthesizeMemorablePrompt(opts: {
  beat: MemorableBeatKind | 'beauty-offer';
  storyText: string;
  location?: string;
  extra?: string;
  kidMode?: boolean;
}): string {
  const kid = opts.kidMode === true;
  const excerpt = kid
    ? (stripKidUnsafeImageLexicon(excerptForImage(opts.storyText)) || 'A bright storybook scene, no text.')
    : excerptForImage(opts.storyText);
  const place = opts.location?.trim();
  const extra = kid
    ? stripKidUnsafeImageLexicon(opts.extra?.trim() ?? '')
    : opts.extra?.trim();
  if (opts.beat === 'opening') {
    const shot = place
      ? `Wide establishing shot of ${place}. ${excerpt}`
      : `Wide establishing shot of the opening scene. ${excerpt}`;
    return kid
      ? `Kid-safe establishing shot, bright and welcoming, no frightening imagery. ${shot}`
      : shot;
  }
  if (opts.beat === 'death') {
    return kid
      ? `Kid-safe storybook close: the hero at rest after a hard journey, lights dimming like a book ending. No injury shown, no blood, no corpse. ${excerpt}`
      : `The fatal moment. ${excerpt}`;
  }
  if (opts.beat === 'ending') {
    const at = place ? ` at ${place}` : '';
    return kid
      ? `Kid-safe closing plate: the storybook last page${at}, everyone fully clothed, no blood, no corpse, no frightening imagery. ${excerpt}`
      : `The campaign's closing plate${at}. ${excerpt}`;
  }
  if (opts.beat === 'dungeon-boss') {
    if (kid) {
      const foe = extra || "the first dungeon's final foe";
      return `Storybook victory: ${foe} slumped asleep or knocked out on the floor, hero standing triumphant. No blood, no wounds, no corpse close-up. ${excerpt}`;
    }
    return extra
      ? `The first dungeon's final foe falls: ${extra}. ${excerpt}`
      : `The first dungeon's final foe falls. ${excerpt}`;
  }
  if (opts.beat === 'legendary') {
    const reveal = extra
      ? `A legendary item revealed: ${extra}. ${excerpt}`
      : `A legendary prize revealed. ${excerpt}`;
    return kid ? `Kid-safe wonder, no gore. ${reveal}` : reveal;
  }
  if (opts.beat === 'ruler-audience') {
    const audience = extra
      ? `First royal audience with ${extra}. ${excerpt}`
      : `A first audience with a ruler. ${excerpt}`;
    return kid
      ? `Kid-safe courtly scene, everyone fully clothed, no frightening imagery. ${audience}`
      : audience;
  }
  if (opts.beat === 'beauty-offer') {
    const look = extra
      ? `A striking first look at ${extra}. ${excerpt}`
      : `A striking first look at someone noteworthy. ${excerpt}`;
    return kid
      ? `Kid-safe, tasteful, fully clothed, non-suggestive storybook portrait. ${look}`
      : look;
  }
  return kid ? `Kid-safe storybook moment, fully clothed, no blood. ${excerpt}` : excerpt;
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

function appendStoryPlate(
  prev: MemorableMomentState,
  beat: MemorableBeatKind | MemorableOfferKind,
  turn: number,
  kid?: boolean
): StoryPlate[] {
  const title = plateCopyForBeat(beat, { kid }).title;
  const plate: StoryPlate = { id: `${beat}-${turn}`, beat, title, turn };
  const list = prev.storyPlates ?? [];
  if (list.some((p) => p.id === plate.id)) return list;
  return [...list, plate];
}

function stamp(
  prev: MemorableMomentState,
  turn: number,
  beat: MemorableBeatKind,
  extra?: { rulerKey?: string; dungeonBossKey?: string; kid?: boolean }
): MemorableMomentState {
  const next: MemorableMomentState = nextSplashStamp(prev, turn);
  if (beat === 'opening') next.openingSplashFired = true;
  if (beat === 'death') next.deathSplashFired = true;
  if (beat === 'ending') next.endingSplashFired = true;
  if (beat === 'legendary') next.legendarySplashFired = true;
  if (beat === 'dungeon-boss') {
    next.firstDungeonBossSplashFired = true;
    if (extra?.dungeonBossKey) {
      next.dungeonBossSplashKeys = uniqueKeys(prev.dungeonBossSplashKeys, extra.dungeonBossKey);
    }
  }
  if (beat === 'ruler-audience' && extra?.rulerKey) {
    next.rulerNamesSplashed = uniqueKeys(prev.rulerNamesSplashed, extra.rulerKey);
  }
  next.storyPlates = appendStoryPlate(prev, beat, turn, extra?.kid);
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
  extras?: { skipImageForLootVideo?: boolean; rulerKey?: string; dungeonBossKey?: string }
): MemorableDecision {
  const stamped = stamp(prev, input.turn, beat, {
    rulerKey: extras?.rulerKey,
    dungeonBossKey: extras?.dungeonBossKey,
    kid: kidModeOn(input.settings),
  });
  const idleStamp: MemorableDecision = {
    request: null,
    nextState: stamped,
    beat,
    skipImageForLootVideo: extras?.skipImageForLootVideo,
  };
  if (extras?.skipImageForLootVideo) return idleStamp;

  // Kid Mode: never send the writer's raw tag — use the rewritten kid-safe beat.
  const raw = kidModeOn(input.settings) ? synthesized : pickPrompt(input.writerTag, synthesized);
  if (kidModeOn(input.settings)) {
    const prepared = prepareKidSafeImagePrompt(raw, { skipIfUnsalvageable: true });
    if (prepared.skip) return idleStamp;
    return { ...idleStamp, request: { imagePrompt: prepared.prompt } };
  }
  return { ...idleStamp, request: { imagePrompt: raw } };
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

/** Locked First Blood convenience-store graph from `buildConvenienceStoreDungeon`. */
export const FIRST_DUNGEON_BLUEPRINT_ID = 'first-blood-store';
const FIRST_DUNGEON_BOSS_NAME = 'corrupted stockboy';

function isDesignatedBossNode(dungeon: ActiveDungeonState, nodeId: string): boolean {
  if (dungeon.dungeonRules?.bossNode === nodeId) return true;
  const node = dungeon.nodes.find((n) => n.id === nodeId);
  return (node?.tags ?? []).some((tag) => {
    const t = tag.toLowerCase();
    return t === 'boss' || t === 'boss_room';
  });
}

function normalizeMobLabel(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function dungeonHasCorruptedStockboy(dungeon: ActiveDungeonState): boolean {
  for (const node of dungeon.nodes) {
    for (const mob of node.hidden?.mobs ?? []) {
      if (normalizeMobLabel(mob.name) === FIRST_DUNGEON_BOSS_NAME) return true;
    }
  }
  return false;
}

function pinFirstDungeonGraph(
  prev: MemorableMomentState,
  dungeon: ActiveDungeonState | null | undefined
): MemorableMomentState {
  if (prev.firstDungeonBlueprintId) return prev;
  if (!dungeon || dungeon.blueprintId === 'local-area') return prev;
  return { ...prev, firstDungeonBlueprintId: dungeon.blueprintId };
}

export function firstDungeonBossAlreadyConsumed(mem: MemorableMomentState): boolean {
  if (mem.firstDungeonBossSplashFired) return true;
  return (mem.dungeonBossSplashKeys?.length ?? 0) > 0;
}

/**
 * Campaign’s first dungeon graph: First Blood store (`first-blood-store`) /
 * Corrupted Stockboy, or the first non-street dungeon pinned on entry.
 * Street maps (`local-area`) never count. If the tutorial first-boss beat is
 * already done, a later graph cannot qualify (old saves / messy detection).
 */
export function isCampaignFirstDungeonGraph(
  dungeon: ActiveDungeonState | null | undefined,
  mem?: MemorableMomentState,
  tutorialFirstBossDone?: boolean
): boolean {
  if (!dungeon || dungeon.blueprintId === 'local-area') return false;
  if (dungeon.blueprintId === FIRST_DUNGEON_BLUEPRINT_ID) return true;
  if (dungeonHasCorruptedStockboy(dungeon)) return true;
  if (tutorialFirstBossDone) return false;
  const pinned = mem?.firstDungeonBlueprintId;
  if (pinned) return dungeon.blueprintId === pinned;
  return true;
}

/**
 * Final boss of the locked dungeon graph — not trash, not mid-dungeon elites.
 * First Blood’s Corrupted Stockboy is a miniBoss on bossNode; generated dungeons use role `boss`.
 */
export function detectDungeonFinalBossDefeat(
  dungeon: ActiveDungeonState | null | undefined,
  defeatedEnemyName: string | null | undefined,
  alreadySplashed: string[] | undefined
): { key: string; label: string } | null {
  const name = defeatedEnemyName?.trim();
  if (!name || !dungeon || dungeon.blueprintId === 'local-area') return null;

  const needle = normalizeMobLabel(name);
  const seen = alreadySplashed ?? [];

  for (const node of dungeon.nodes) {
    for (const mob of node.hidden?.mobs ?? []) {
      const isFinal =
        mob.role === 'boss' || (mob.role === 'miniBoss' && isDesignatedBossNode(dungeon, node.id));
      if (!isFinal) continue;
      const label = mob.name.trim();
      if (normalizeMobLabel(label) !== needle) continue;
      const key = `${dungeon.blueprintId}:${mob.id}`;
      if (seen.includes(key)) return null;
      return { key, label };
    }
  }
  return null;
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
      kidMode: kidModeOn(input.settings),
    });
  }
  if (input.state.openingEstablishment?.sceneWritten) return null;
  if (priorStoryBody(input.state.log)) return null;
  return synthesizeMemorablePrompt({
    beat: 'opening',
    storyText: input.storyText,
    location: input.state.currentLocation,
    kidMode: kidModeOn(input.settings),
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
 * Writer-declared PYOA close only. No prose guess, no LitRPG / tabletop / Story RPG,
 * no opening-hour tag, no mid-route "you could stop here".
 */
export function detectPyoaCampaignEnding(
  input: Pick<
    ResolveMemorableInput,
    'state' | 'turn' | 'events' | 'isOpeningSceneTurn' | 'storyText'
  >,
  prev: MemorableMomentState
): boolean {
  if (prev.endingSplashFired) return false;
  if (input.state.engineMode !== 'pyoa') return false;
  if (input.isOpeningSceneTurn) return false;
  const est = input.state.openingEstablishment;
  if (est && !est.complete) return false;
  if (input.turn < PYOA_ENDING_MIN_TURN) return false;
  if (!storyHasBody(input.storyText)) return false;
  return input.events.some((event) => event.type === 'campaign-ending');
}

/**
 * Classic memorable only. Comic mode is untouched.
 * Auto: opening + death + first-dungeon final-boss + PYOA true ending only.
 * Later dungeon bosses never auto — writer tag can still become a tap-yes offer.
 * Legendary is loot-video only (no second still). First combat / trash / boss reveal never auto.
 */
export function resolveMemorableMoment(input: ResolveMemorableInput): MemorableDecision {
  const prev = pinFirstDungeonGraph(
    input.state.memorableMoments ?? emptyMemorableState(),
    input.state.activeDungeon
  );
  const idle: MemorableDecision = { request: null, nextState: prev, beat: null };
  if (!isClassicMemorableEnabled(input.settings)) return idle;
  if (!storyHasBody(input.storyText)) return idle;

  if (!prev.deathSplashFired && detectPlayerDeath(input.characterHp, input.characterConditions, input.storyText)) {
    return fire(
      'death',
      input,
      prev,
      synthesizeMemorablePrompt({
        beat: 'death',
        storyText: input.storyText,
        kidMode: kidModeOn(input.settings),
      })
    );
  }

  const openingPrompt = detectOpening(input, prev);
  if (openingPrompt) {
    return fire('opening', input, prev, openingPrompt);
  }

  const dungeon = input.state.activeDungeon;
  if (
    !firstDungeonBossAlreadyConsumed(prev)
    && isCampaignFirstDungeonGraph(
      dungeon,
      prev,
      input.state.tutorialProgress?.completed?.firstBoss
    )
  ) {
    const bossKill = detectDungeonFinalBossDefeat(
      dungeon,
      input.defeatedEnemyName,
      prev.dungeonBossSplashKeys
    );
    if (bossKill) {
      return fire(
        'dungeon-boss',
        input,
        prev,
        synthesizeMemorablePrompt({
          beat: 'dungeon-boss',
          storyText: input.storyText,
          extra: bossKill.label,
          location: input.state.currentLocation,
          kidMode: kidModeOn(input.settings),
        }),
        {
          skipImageForLootVideo: Boolean(input.lootVideo),
          dungeonBossKey: bossKill.key,
        }
      );
    }
  }

  if (detectPyoaCampaignEnding(input, prev)) {
    return fire(
      'ending',
      input,
      prev,
      synthesizeMemorablePrompt({
        beat: 'ending',
        storyText: input.storyText,
        location: input.state.currentLocation,
        kidMode: kidModeOn(input.settings),
      }),
      { skipImageForLootVideo: Boolean(input.lootVideo) }
    );
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
      kidMode: kidModeOn(input.settings),
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
    const rulerPrompt = synthesizeMemorablePrompt({
      beat: 'ruler-audience',
      storyText: input.storyText,
      extra: ruler.label,
      kidMode: kidModeOn(input.settings),
    });
    if (kidModeOn(input.settings) && isUnsalvageableKidImagePrompt(rulerPrompt)) {
      return idle;
    }
    return offerDecision(
      prev,
      input.turn,
      {
        kind: 'ruler-audience',
        personKey: ruler.key,
        personLabel: ruler.label,
        imagePrompt: kidModeOn(input.settings)
          ? prepareKidSafeImagePrompt(rulerPrompt, { skipIfUnsalvageable: true }).prompt
          : rulerPrompt,
      },
      { rulerKey: ruler.key }
    );
  }

  if (input.writerTag?.imagePrompt?.trim()) {
    let writerPrompt = input.writerTag.imagePrompt.trim();
    if (kidModeOn(input.settings)) {
      const prepared = prepareKidSafeImagePrompt(writerPrompt, { skipIfUnsalvageable: true });
      if (prepared.skip) return idle;
      writerPrompt = `Kid-safe storybook moment, fully clothed, no blood. ${prepared.prompt}`;
    }
    return offerDecision(prev, input.turn, {
      kind: 'writer-tag',
      imagePrompt: writerPrompt,
    });
  }

  const beauty = detectNoteworthyBeauty(
    input.storyText,
    input.state.character?.name,
    prev.beautyOfferedKeys
  );
  if (beauty) {
    const rawLook = synthesizeMemorablePrompt({
      beat: 'beauty-offer',
      storyText: input.storyText,
      extra: beauty.label,
      kidMode: false,
    });
    if (kidModeOn(input.settings) && isUnsalvageableKidImagePrompt(rawLook)) {
      return idle;
    }
    const beautyPrompt = synthesizeMemorablePrompt({
      beat: 'beauty-offer',
      storyText: input.storyText,
      extra: beauty.label,
      kidMode: kidModeOn(input.settings),
    });
    if (kidModeOn(input.settings)) {
      const prepared = prepareKidSafeImagePrompt(beautyPrompt, { skipIfUnsalvageable: true });
      if (prepared.skip) return idle;
      return offerDecision(
        prev,
        input.turn,
        {
          kind: 'beauty',
          personKey: beauty.key,
          personLabel: beauty.label,
          imagePrompt: prepared.prompt,
        },
        { personKey: beauty.key }
      );
    }
    return offerDecision(
      prev,
      input.turn,
      {
        kind: 'beauty',
        personKey: beauty.key,
        personLabel: beauty.label,
        imagePrompt: beautyPrompt,
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
    const prev = input.state.memorableMoments ?? emptyMemorableState();
    if (decision.beat === 'dungeon-boss') {
      return {
        request: null,
        beat: null,
        skippedForCapacity: true,
        nextState: {
          ...prev,
          firstDungeonBlueprintId:
            decision.nextState.firstDungeonBlueprintId ?? prev.firstDungeonBlueprintId,
          firstDungeonBossSplashFired: true,
          dungeonBossSplashKeys: decision.nextState.dungeonBossSplashKeys ?? prev.dungeonBossSplashKeys,
        },
      };
    }
    if (decision.beat === 'ending') {
      return {
        request: null,
        beat: null,
        skippedForCapacity: true,
        nextState: {
          ...prev,
          endingSplashFired: true,
        },
      };
    }
    return {
      request: null,
      nextState: prev,
      beat: null,
      skippedForCapacity: true,
    };
  }
  return decision;
}

export function memorableLogFields(decision: MemorableDecision): Partial<LogEntry> {
  const copy = decision.beat && decision.request ? plateCopyForBeat(decision.beat) : null;
  return {
    ...(decision.request
      ? {
          entryKind: 'milestone' as const,
          imageStatus: 'pending' as const,
          splashTitle: copy?.title,
          splashToast: copy?.toast,
        }
      : {}),
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
  const offerBeat = offer.kind ?? 'beauty';
  const copy = plateCopyForBeat(offerBeat);
  const next: GameState = {
    ...state,
    memorableMoments: {
      ...splash,
      lastBeautyOfferTurn: entry.turn,
      storyPlates: appendStoryPlate(splash, offerBeat, entry.turn),
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
            splashTitle: copy.title,
            splashToast: copy.toast,
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
