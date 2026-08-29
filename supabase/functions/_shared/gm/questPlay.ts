import type { GameState, LogEntry, Quest } from './types.ts';
import {
  findSettlement,
  inferQuestTagsFromText,
  pickQuestSiteForTags,
  questFitsSettlement,
} from './worldMapAuthority.ts';

export type StarterQuestSeed = {
  id: string;
  title: string;
  description: string;
  recommendedLevel?: number;
  objectives: string[];
  rewards?: string;
  location?: string;
  type?: 'main' | 'side' | 'faction';
};

/**
 * Code banks for L2+ side/special reveal — NPC name, place, or keyword in play text.
 * Prefer these over GM invent; syncQuestsFromPlay still handles System labels.
 */
const QUEST_REVEAL_TRIGGERS: Array<{ questId: string; patterns: RegExp[] }> = [
  {
    questId: 'sp-quest-side-junk',
    patterns: [
      /\blowmarket\b/i,
      /\bfence\b/i,
      /\bearth\s+(?:object|junk|phone|shirt|kit)\b/i,
      /\botherworld\s+junk\b/i,
      /\bsera\s+quill\b/i,
      /\bthieves?\b/i,
      /\bweighing\s+cup\b/i,
      /\bharbor\s+quay\b/i,
      /\bquay\b.*\bjunk\b/i,
      /\bsell\b.*\bearth\b/i,
      /\bcontract\s+hall\b.*\bjunk\b/i,
    ],
  },
  {
    questId: 'sp-quest-side-child',
    patterns: [
      /\bmarked\s+child\b/i,
      /\bbrother\s+tam\b/i,
      /\bpanel\s+fragment\b/i,
      /\bcathedral\s+close\b/i,
      /\bchild\b.*\b(panel|blessing|mark)\b/i,
      /\bkitchen\b.*\b(child|panel|saint)\b/i,
      /\bkitchen\s+saint\b/i,
      /\borel\s+vane\b.*\bchild\b/i,
      /\bblessing\b.*\bchild\b/i,
    ],
  },
  {
    questId: 'sp-quest-special-other',
    patterns: [
      /\bother\s+circle\b/i,
      /\bsecond\s+(?:summon|circle|soul)\b/i,
      /\bcinderflow\b/i,
      /\bash\s+court\s+(?:letter|envoy)\b/i,
      /\bcinder-ash\b/i,
      /\benvoy\b.*\bash\b/i,
      /\bwest\s+wall\b.*\b(ash|scout|east)\b/i,
      /\bother\s+summoned\b/i,
      /\brival\s+polity\b/i,
    ],
  },
  {
    questId: 'sp-quest-special-ledger',
    patterns: [
      /\bqueen'?s?\s+private\s+ledger\b/i,
      /\bpalace\b/i,
      /\bwar\s+story\s+does\s+not\s+add\s+up\b/i,
      /\bpellane\s+started\s+the\s+war\b/i,
      /\bpalace\s+approach\b/i,
      /\bledger\b.*\b(palace|queen|pellane|war)\b/i,
      /\bpropaganda\b/i,
      /\btrue\s+account\b/i,
    ],
  },
  {
    questId: 'ha-quest-2',
    patterns: [
      /\bashline\s+yard\b/i,
      /\bmara\s+keene\b/i,
      /\byard\s+share\b/i,
      /\blocal\s+(?:threshold|clear)\b/i,
      /\bjob\s+board\b/i,
      /\bmara\b/i,
      /\bindependent\s+riftwards?\b/i,
      /\bstaging\s+hub\b/i,
      /\blow\s+watt\b/i,
    ],
  },
  {
    questId: 'ha-quest-side-fence',
    patterns: [
      /\bpax\b/i,
      /\bpenny\b/i,
      /\bscrap\s+fence\b/i,
      /\bvesper\b/i,
      /\bcurios?\b/i,
      /\bfake\s+(?:stamp|grade)\b/i,
      /\bhush\s+pric/i,
      /\bscrap\s+(?:alley|fence)\b/i,
    ],
  },
  {
    questId: 'ha-quest-side-rival',
    patterns: [
      /\bjoss\s+vale\b/i,
      /\bgrade-?safe\s+clear\b/i,
      /\binvite\b.*\b(clear|job)\b/i,
      /\bjoss\b/i,
      /\blicensed\s+riftward\b/i,
      /\bprove\s+you\s+belong\b/i,
    ],
  },
  {
    questId: 'ha-quest-special-name',
    patterns: [
      /\bledger\s+true\s+name\b/i,
      /\bquiet\s+hands\b/i,
      /\bapprais(?:e|al)\b/i,
      /\bwake\s+residue\b/i,
      /\bsable\b/i,
      /\bquiet\s+archive\b/i,
      /\bnamed?\s+residue\b/i,
      /\bdr\.?\s*rhee\b.*\b(quiet|sample|hands)\b/i,
    ],
  },
  {
    questId: 'ha-quest-special-second',
    patterns: [
      /\bsecond\s+residue\b/i,
      /\banother\s+(?:private\s+)?ledger\b/i,
      /\bsecond\s+wake\b/i,
      /\blampmere\b/i,
      /\bsecond\s+ledger\b/i,
      /\banother\s+wake\b/i,
    ],
  },
  // System Integration L2+
  {
    questId: 'si-quest-2',
    patterns: [
      /\briverside\b/i,
      /\belise\s+cho\b/i,
      /\bwarden\s+elise\b/i,
      /\brecruit(?:ment|ed)?\b/i,
      /\bsanctioned\s+operat/i,
    ],
  },
  {
    questId: 'si-quest-3',
    patterns: [
      /\bwave\s*(?:6|warning|is\s+coming)\b/i,
      /\bwave\s+wall\b/i,
      /\breinforced\s+plating\b/i,
    ],
  },
  {
    questId: 'si-quest-4',
    patterns: [
      /\bdead\s+zone\b/i,
      /\bphase\s*2\b/i,
      /\bmarcus\s+reyes\b/i,
      /\btunnel\b.*\bguide\b/i,
    ],
  },
  // Fabled Legacy
  {
    questId: 'fl-quest-2',
    patterns: [
      /\bmarta\b/i,
      /\bsmithy\b/i,
      /\bceremonial\s+sickle\b/i,
      /\bforge\b.*\b(marta|sickle|help)\b/i,
    ],
  },
  {
    questId: 'fl-quest-3',
    patterns: [
      /\bmissing\s+map\b/i,
      /\bmap\s+piece\b/i,
      /\bgreentooth\b/i,
      /\bhollow\s+cairn\b/i,
      /\bhermit(?:'?s)?\s+cabin\b/i,
      /\bcorvin\b.*\b(map|wound|hills)\b/i,
      /\btrailhead\b/i,
    ],
  },
  {
    questId: 'fl-quest-4',
    patterns: [
      /\bhollow\s+cairn\b/i,
      /\bgeas-?cut\b/i,
      /\bfirst\s+kings?\b/i,
      /\bopen\s+(?:the\s+)?cairn\b/i,
      /\bseal\s+(?:the\s+)?cairn\b/i,
    ],
  },
  // Gatebreak / Ascending densify
  {
    questId: 'gatebreak-ward-quest-1',
    patterns: [
      /\bsubway\s+gate\b/i,
      /\bb-?gate\b/i,
      /\bsergeant\s+rill\b/i,
      /\bward\s*9\b/i,
      /\bhold\s+ward\b/i,
    ],
  },
  {
    questId: 'ascending-spire-quest-1',
    patterns: [
      /\bspire\s+gate\b/i,
      /\bfloor\s*1\b/i,
      /\branking\s+board\b/i,
      /\bfirst\s+ascent\b/i,
      /\bfloor\s+warden\b/i,
      /\bfloor\s+law\b/i,
    ],
  },
  // Inkbound Academy
  {
    questId: 'inkbound-academy-quest-1',
    patterns: [
      /\borientation\s+trial\b/i,
      /\bclass\s+codex\b/i,
      /\bcourtyard\s+duel\b/i,
      /\bchoose\s+a\s+house\b/i,
      /\bjori\s+ashquill\b/i,
      /\bdean\s+solenne\b/i,
      /\bhouse\s+ledger\b/i,
      /\bquill\s+dorm/i,
    ],
  },
  // Void Audience
  {
    questId: 'va-quest-2',
    patterns: [
      /\bthreshold\s+inn\b/i,
      /\bpellara\b/i,
      /\binn\s+chores?\b/i,
      /\barrival\s+at\s+threshold\b/i,
    ],
  },
  {
    questId: 'va-quest-3',
    patterns: [
      /\bsoul\s+shimmer\b/i,
      /\bcaster\s+drenn\b/i,
      /\bkael\b/i,
      /\bnode\s+calibration\b/i,
      /\bthreshold\s+node\b/i,
    ],
  },
  {
    questId: 'va-quest-4',
    patterns: [
      /\bcosmic\s+favor\b/i,
      /\bvoid\s+audience\b/i,
      /\bmocker'?s?\s+voice\b/i,
      /\bgallery\s+viewing\b/i,
    ],
  },
  // Hollow Core
  {
    questId: 'hollow-core-quest-1',
    patterns: [
      /\bclaim\s+the\s+hollow\b/i,
      /\bcore\s+chamber\b/i,
      /\bwhisper-?mite\b/i,
      /\bexpand\s+to\s+3\s+rooms\b/i,
      /\bcaptain\s+bren\b/i,
      /\btheme\s+binding\b/i,
    ],
  },
  // Dungeon Transport
  {
    questId: 'dt-quest-2',
    patterns: [
      /\bscratch\b/i,
      /\bcave\s+imp\b/i,
      /\bflooded\s+(?:cavern|platform)\b/i,
      /\bdrowned\s+maw\b/i,
      /\bfloor\s*2\b/i,
    ],
  },
  {
    questId: 'dt-quest-3',
    patterns: [
      /\bsafe\s+room\b/i,
      /\brest\s+shrine\b/i,
      /\bwandering\s+merchant\b/i,
      /\bstorage\s+cache\b/i,
    ],
  },
  {
    questId: 'dt-quest-4',
    patterns: [
      /\bseam\s+crawlspace\b/i,
      /\bway\s+up\b/i,
      /\bkira\b/i,
      /\bmaintenance\s+space\b/i,
      /\bdescent\s+log\b/i,
    ],
  },
  // Cursed Keep
  {
    questId: 'ck-quest-2',
    patterns: [
      /\bfather\s+aldous\b/i,
      /\baldous\b.*\bdream/i,
      /\bgraveyard\b/i,
      /\bbloodless\b/i,
      /\bpriest'?s?\s+confession\b/i,
    ],
  },
  {
    questId: 'ck-quest-3',
    patterns: [
      /\bmira\b/i,
      /\bapothecary\b/i,
      /\bgreymark\s+journal/i,
      /\bapothecary'?s?\s+secret\b/i,
    ],
  },
];

const QUEST_SEED_LOCATIONS: Record<string, string> = {
  'sp-quest-1': 'Cathedral Close',
  'sp-quest-side-junk': 'Lowmarket',
  'sp-quest-side-child': 'Cathedral Close',
  'sp-quest-special-other': 'Cinderflow Road',
  'sp-quest-special-ledger': 'Palace Approach',
  'ha-quest-1': 'First Threshold Gate',
  'ha-quest-2': 'Ashline Yard',
  'ha-quest-side-fence': 'Scrap Fence Alley',
  'ha-quest-side-rival': 'Ashline Yard',
  'ha-quest-special-name': 'Quiet Archive',
  'ha-quest-special-second': 'Lampmere Market',
  'si-quest-1': 'Convenience Store Dungeon',
  'si-quest-2': 'Riverside Stronghold',
  'si-quest-3': 'Wave Wall',
  'si-quest-4': 'Dead Zone Border',
  'gatebreak-ward-quest-1': 'Subway Gate',
  'ascending-spire-quest-1': 'Spire Gate Plaza',
  'fl-quest-1': 'The Crooked Beam',
  'fl-quest-2': "Marta's Smithy",
  'fl-quest-3': 'Greentooth Trailhead',
  'fl-quest-4': 'Hollow Cairn Approach',
  'inkbound-academy-quest-1': 'Lecture Courtyard',
  'va-quest-1': "Auditor's Desk",
  'va-quest-2': 'Threshold Inn',
  'va-quest-3': 'Threshold Node Plaza',
  'va-quest-4': 'Resonance Stage',
  'hollow-core-quest-1': 'Core Chamber',
  'dt-quest-1': 'Floor 1 Stone Corridor',
  'dt-quest-2': 'Floor 2 Flooded Platform',
  'dt-quest-3': 'Safe Room Rest Shrine',
  'dt-quest-4': 'Seam Crawlspace',
  'ck-quest-1': 'Greyhollow Inn',
  'ck-quest-2': 'Greyhollow Church',
  'ck-quest-3': "Mira's Apothecary",
  'salt-road-heist-quest-1': 'Salt Road Waystation',
};

/** Alone Summoned Pact starter — no handlers to hear yet. */
const ALONE_CIRCLE_PRICE: StarterQuestSeed = {
  id: 'sp-quest-1',
  title: 'The Circle’s Price',
  description:
    'You arrived alone — no handlers, no welcome. Get your bearings. Find a way toward people or wait for them to find you. Learn who pulled you here and why before anyone owns your name.',
  recommendedLevel: 1,
  objectives: [
    'Get your bearings in this ruin (what stands, what way out, what the panel shows)',
    'Find a living trail — road, smoke, tracks — or wait for someone to find you',
    'When you meet their world: hear why you were summoned, then swear, refuse, or delay',
  ],
  rewards: 'Circle Blessing remains; reputation tilts when you finally meet Pellane or the street',
};

/** Rewrite starter seeds so journal matches the arrival (alone vs summoned crowd). */
export function adaptStarterQuestsForArrival(
  seeds: StarterQuestSeed[],
  alone: boolean
): StarterQuestSeed[] {
  if (!alone) return seeds;
  return seeds.map((s) => (s.id === 'sp-quest-1' ? { ...ALONE_CIRCLE_PRICE } : s));
}

function slug(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'quest';
}

function tokens(raw: string): string[] {
  return (raw.toLowerCase().match(/[a-z][a-z0-9'-]{3,}/g) ?? []).filter(
    (t) => !/^(this|that|with|from|your|their|have|been|will|into|near|quest|focus|engaged|system|dungeon|thing|does|info|whats|what|every|earth|needs|level|region|days|warning|strike|clock|coming|wave|complete|welcome|starting|please|confirm|name|current|location)$/.test(t)
  );
}

function overlap(a: string, b: string): boolean {
  const left = new Set(tokens(a));
  return tokens(b).some((t) => left.has(t) && t.length >= 5);
}

const PLACE_STOP =
  /^(the|a|an|system|earth|info|what|dungeon|thing|this|that|your|their|here|there|england's|every|mind|survive)$/i;

const JUNK_PLACE =
  /^(every mind|every human|first blood|foundation core|integration protocol|the system|micro dungeon|micro-dungeon|side street|side st\.?|cover(?:\s*\/\s*doorway)?|cover|doorway|street|chaos|disbelief|your palm|parse designation|eye level|registration|designation|protocol|visual profile|palm|grip|knife|the air|the ground|the floor|the glint|random place|nearby place|physical object|anyone yet|perpetual twilight)$/i;

const PIN_DENY =
  /\b(palm|eye level|waist height|ground level|chaos|disbelief|fear|panic|registration|designation|parse|integration|system|protocol|visual profile|tutorial|quest|salvage|foundation|core|wave|first blood|anyone yet|physical object|desperate (?:struggle|war)|engulf our|look down)\b/i;

const PLACE_TYPE_SUFFIX =
  /\b(street|st|road|rd|lane|avenue|ave|drive|way|close|terrace|place|court|square|alley|boulevard|highway|motorway|station|hospital|school|church|pub|bar|inn|hotel|cafe|café|shop|store|market|supermarket|park|farm|bridge|building|centre|center|extra|express|superstore|tesco|sainsbury|co-op|coop|cathedral|circle|vault|nave|vestry|chapel|undercroft|crypt|hall|chamber|sanctuary|sanctum|steps|aisle|narthex|cloister|wing|keep|castle|palace|temple)\b/i;

const INTERIOR_ROOM_PIN =
  /\b(nave|vestry|vault|circle|chapel|crypt|undercroft|aisle|narthex|transept|choir|cloister|sacristy|steps|chamber|wing|sanctuary|sanctum|apse|gallery)\b/i;

/** Incomplete noun phrases harvested from "to/in/at/from …" prose. */
const PLACE_FRAGMENT =
  /^(?:save anyone yet|any physical object|our desperate (?:struggle|war) against|engulf our lands|home you look down|perpetual twilight)$/i;

const DUMMY_STREET_NODE =
  /^(street|side street|side st\.?|cover(?:\s*\/\s*doorway)?|cover|doorway)$/i;

function titleCasePlace(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function clipPlace(raw: string): string {
  return raw
    .replace(/\s*\([^)]*tier[^)]*\)/gi, '')
    .replace(/\s*\([^)]*urban\s+ruin[^)]*\)/gi, '')
    .replace(/\s+\b(and|then|what|with|for|to|around|before|after|near|against|yet|anyone|our|your|their)\b[\s\S]*$/i, '')
    .trim();
}

/** Atmosphere clause harvested as a Title-Case room (John: "This Chamber Hangs Heavy"). */
const ATMOSPHERE_PLACE =
  /\b(hangs heavy|thick with|scent of|dust motes|cloying|air in this|chamber hangs|room is thick|silence presses|perfume that)\b/i;

export function isAtmospherePlaceName(name: string | undefined): boolean {
  const n = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!n) return false;
  if (ATMOSPHERE_PLACE.test(n)) return true;
  return /\b(chamber|room|hall|air)\s+(hangs|is thick|smells|presses)\b/i.test(n);
}

function isIncompletePlacePhrase(name: string): boolean {
  const n = name.replace(/\s+/g, ' ').trim();
  if (isAtmospherePlaceName(n)) return true;
  if (PLACE_FRAGMENT.test(n)) return true;
  if (/\b(against|yet|from|into|onto|toward|towards|with|without|and|or|the|a|an|to|of|for|our|your|their|by|as)$/i.test(n)) {
    return true;
  }
  if (/^(?:our|the|their|your)\s+\S+\s+(?:struggle|war|fight|battle)\b/i.test(n)) return true;
  if (/\banyone yet\b/i.test(n) || /\bphysical object\b/i.test(n)) return true;
  if (/\b(?:war|struggle) against\b/i.test(n)) return true;
  if (/^(?:save|engulf|look|asked|hands?|end)\b/i.test(n) && !PLACE_TYPE_SUFFIX.test(n)) return true;
  if (/\b(?:you|anyone|yet)\b/i.test(n) && !PLACE_TYPE_SUFFIX.test(n)) return true;
  return false;
}

function looksLikePlaceName(name: string): boolean {
  return PLACE_TYPE_SUFFIX.test(name) || INTERIOR_ROOM_PIN.test(name);
}

function pushPlace(found: string[], raw: string | undefined, opts?: { requirePlaceShape?: boolean }): void {
  const name = titleCasePlace(clipPlace(raw ?? ''));
  if (!name || PLACE_STOP.test(name) || isGenericMapPlace(name) || name.length < 3) return;
  if (opts?.requirePlaceShape && !looksLikePlaceName(name)) return;
  if (found.some((p) => p.toLowerCase() === name.toLowerCase())) return;
  found.push(name);
}

/** Pull named places from player chat, GM prose, or System lines — Tesco Extra, a Kyoto alley, anywhere. */
export function extractNamedPlaces(raw: string): string[] {
  const text = raw.replace(/\s+/g, ' ').trim();
  const found: string[] = [];
  const toward =
    /\b(?:towards?|toward|to|into|at|in|near|from)\s+(?:the\s+)?([A-Za-z][A-Za-z0-9'&-]{2,}(?:\s+[A-Za-z][A-Za-z0-9'&-]{2,}){0,3})/g;
  let m: RegExpExecArray | null;
  while ((m = toward.exec(text))) {
    pushPlace(found, m[1], { requirePlaceShape: true });
  }
  const branded =
    /\b([A-Z][A-Za-z0-9'&-]+(?:\s+[A-Z][A-Za-z0-9'&-]+){0,2})\s+(Extra|Express|Superstore|Mart|Market|Store|Shop|Cafe|Café|Station|Temple|Shrine)\b/g;
  while ((m = branded.exec(text))) {
    pushPlace(found, `${m[1]} ${m[2]}`);
  }
  const focus = text.match(/quest\s*focus:\s*(.+)$/im)?.[1];
  if (focus) {
    pushPlace(found, focus.replace(/\s+engaged\.?$/i, '').replace(/\s+micro-dungeon.*$/i, '').trim());
  }
  const locLine = text.match(/(?:^|\n)\s*location:\s*(.+)$/im)?.[1];
  if (locLine) {
    pushPlace(found, locLine.split(',')[0].trim());
  }
  return found;
}

export function harvestPlayText(log: LogEntry[] | undefined, extra: string[] = []): string {
  const parts = [...extra];
  for (const entry of (log ?? []).slice(-16)) {
    if (entry.content) parts.push(entry.content);
    if (entry.systemLog?.length) parts.push(...entry.systemLog);
  }
  return parts.join('\n');
}

function labelFromLogLine(line: string): string | null {
  const t = line.replace(/\s+/g, ' ').trim();
  const focus = t.match(/quest\s*focus:\s*(.+)$/i)?.[1];
  const started = t.match(/quest\s*(?:add|accepted|started|updated):\s*(.+)$/i)?.[1];
  const raw = (focus ?? started ?? '').replace(/\s+engaged\.?$/i, '').trim();
  return raw ? raw.slice(0, 80) : null;
}

/** Journal stays empty while the System is still asking for name/place. */
export function questsLockedDuringOpening(state: {
  openingEstablishment?: { complete?: boolean } | null;
  log?: Array<{ role: string; content: string }>;
}): boolean {
  const est = state.openingEstablishment;
  if (est && est.complete === false) return true;
  if (est?.complete === true) return false;
  const lastGm = [...(state.log ?? [])].reverse().find((e) => e.role === 'gm')?.content ?? '';
  return /confirm designation|confirm your name and current location|current designation:\s*unconfirmed/i.test(lastGm);
}

function hideSeededQuests(quests: Quest[]): Quest[] {
  let changed = false;
  const next = quests.map((q) => {
    if (q.revealed !== true && q.status === 'hidden') return q;
    changed = true;
    return { ...q, revealed: false, status: 'hidden' as const };
  });
  return changed ? next : quests;
}

/** Old / cloud saves can already have First Blood + Wave marked active on the opening beat. */
export function clampLeakedOpeningQuests(state: GameState): GameState {
  if (!questsLockedDuringOpening(state)) return state;
  const quests = hideSeededQuests(state.quests ?? []);
  return quests === state.quests ? state : { ...state, quests };
}

/** Journal tabs/lists: only revealed quests. Hidden Guide Book hooks stay out. */
export function isJournalQuest(q: Quest): boolean {
  if (q.status === 'hidden') return false;
  if (q.revealed !== true) return false;
  return q.status === 'active' || q.status === 'completed' || q.status === 'failed';
}

export function visibleJournalQuests(state: GameState): Quest[] {
  if (questsLockedDuringOpening(state)) return [];
  return (state.quests ?? []).filter(isJournalQuest);
}

export function activeDrawerQuests(state: GameState): Quest[] {
  return visibleJournalQuests(state).filter((q) => q.status === 'active');
}

/**
 * When the System names a quest in the log, or the player walks toward a place a
 * seeded quest already describes, show it in the journal. Campaign-agnostic.
 */
export function syncQuestsFromPlay(
  quests: Quest[],
  systemLog: string[],
  playerAction: string,
  opts?: { locked?: boolean }
): Quest[] {
  if (opts?.locked) return quests;
  let next = quests.map((q) => ({ ...q }));

  for (const line of systemLog) {
    const label = labelFromLogLine(line);
    if (!label) continue;
    const existing = next.find(
      (q) =>
        q.name.toLowerCase() === label.toLowerCase()
        || overlap(q.name, label)
        || overlap(q.description, label)
    );
    if (existing) {
      next = next.map((q) =>
        q.id === existing.id
          ? {
              ...q,
              revealed: true,
              status: q.status === 'hidden' ? 'active' : q.status,
              location: q.location ?? label,
            }
          : q
      );
    } else {
      next.push({
        id: `play-${slug(label)}`,
        name: label,
        description: label,
        status: 'active',
        type: 'side',
        revealed: true,
        location: label,
        objectives: [{ id: 'obj-1', description: label, completed: false }],
      });
    }
  }

  const action = playerAction.replace(/\s+/g, ' ').trim();
  const places = extractNamedPlaces(action).filter((p) => p.length >= 6 && !/earth|system|every mind/i.test(p));
  next = next.map((q) => {
    if (q.revealed || q.status === 'completed' || q.status === 'failed') return q;
    const recommended = q.recommendedLevel ?? 1;
    // L1: place-name walk toward still works.
    if (recommended <= 1) {
      const hay = `${q.name} ${q.location ?? ''}`.toLowerCase();
      const hit = places.some((p) => hay.includes(p.toLowerCase()) || overlap(q.name, p));
      if (!hit) return q;
      return { ...q, revealed: true, status: q.status === 'hidden' ? 'active' : q.status };
    }
    return q;
  });

  // L2+ sides: NPC / place / keyword banks (no GM invent required).
  next = revealQuestsFromBanks(next, action);

  return next;
}

/** Reveal hidden L2+ quests when play text matches code banks. */
export function revealQuestsFromBanks(quests: Quest[], haystack: string): Quest[] {
  const hay = haystack.replace(/\s+/g, ' ').trim();
  if (!hay) return quests;
  let next = quests;
  for (const row of QUEST_REVEAL_TRIGGERS) {
    if (!row.patterns.some((re) => re.test(hay))) continue;
    next = next.map((q) => {
      if (q.id !== row.questId) return q;
      if (q.revealed || q.status === 'completed' || q.status === 'failed') return q;
      return {
        ...q,
        revealed: true,
        status: q.status === 'hidden' ? 'active' : q.status,
        location: q.location ?? QUEST_SEED_LOCATIONS[q.id],
      };
    });
  }
  return next;
}

/**
 * 29e follow-up — reveal quests linked on the hub bank when the player arrives.
 */
export function revealQuestsFromHubLinks(
  quests: Quest[],
  linkedQuestIds: string[] | undefined,
  hubName?: string
): Quest[] {
  if (!linkedQuestIds?.length) return quests;
  const ids = new Set(linkedQuestIds);
  return quests.map((q) => {
    if (!ids.has(q.id)) return q;
    if (q.revealed || q.status === 'completed' || q.status === 'failed') return q;
    return {
      ...q,
      revealed: true,
      status: q.status === 'hidden' ? 'active' : q.status,
      location: q.location ?? hubName,
    };
  });
}

const COARSE_PLACE =
  /^(england|britain|uk|united kingdom|scotland|wales|earth|the world|europe|asia|america|usa|the united states|japan|france|germany|australia|canada)$/i;

export function isDummyStreetNodeName(name: string | undefined): boolean {
  return DUMMY_STREET_NODE.test((name ?? '').replace(/\s+/g, ' ').trim());
}

export function isGenericMapPlace(name: string | undefined): boolean {
  const n = (name ?? '').trim();
  if (!n) return true;
  if (COARSE_PLACE.test(n)) return true;
  if (JUNK_PLACE.test(n) || PIN_DENY.test(n) || PLACE_FRAGMENT.test(n)) return true;
  if (DUMMY_STREET_NODE.test(n)) return true;
  if (isIncompletePlacePhrase(n)) return true;
  if (isAtmospherePlaceName(n)) return true;
  return /^the opening of /i.test(n) || /^your surroundings$/i.test(n) || /^a cracked city street$/i.test(n);
}

/** Room-shaped pins for an indoor floor plan — nave, circle, vault, vestry, steps. */
export function isInteriorRoomName(name: string | undefined): boolean {
  const n = (name ?? '').replace(/\s+/g, ' ').trim();
  if (!n || isGenericMapPlace(n)) return false;
  if (INTERIOR_ROOM_PIN.test(n)) return true;
  if (/\b(hall|court)\b/i.test(n) && /\b(valespire|pellane|cathedral|sevenfold|crown)\b/i.test(n)) return true;
  return false;
}

export function newlyRevealedQuests(before: Quest[] | undefined, after: Quest[] | undefined): Quest[] {
  const prior = new Set(
    (before ?? []).filter((q) => q.revealed === true).map((q) => q.id)
  );
  return (after ?? []).filter((q) => q.revealed === true && !prior.has(q.id));
}

function seededQuestType(q: StarterQuestSeed): Quest['type'] {
  if (q.type) return q.type;
  if (/-side-|-special-/.test(q.id)) return 'side';
  if ((q.recommendedLevel ?? 1) >= 2) return 'side';
  return 'main';
}

function asSeededQuest(q: StarterQuestSeed): Quest {
  const type = seededQuestType(q);
  return {
    id: q.id,
    name: q.title,
    description: q.description,
    status: 'hidden',
    revealed: false,
    type,
    recommendedLevel: q.recommendedLevel,
    location: q.location ?? QUEST_SEED_LOCATIONS[q.id],
    objectives: q.objectives.map((desc, i) => ({
      id: `${q.id}-obj-${i + 1}`,
      description: desc,
      completed: false,
    })),
    rewards: { items: q.rewards ? [q.rewards] : undefined },
  };
}

/** Active revealed main-spine quest (prefer L1 starter ids). */
export function mainSpineQuest(state: GameState): Quest | null {
  const visible = visibleJournalQuests(state).filter((q) => q.status === 'active');
  if (!visible.length) return null;
  return (
    visible.find(
      (q) =>
        q.id === 'sp-quest-1'
        || q.id === 'ha-quest-1'
        || q.id === 'si-quest-1'
        || q.id === 'ck-quest-1'
        || q.id === 'salt-road-heist-quest-1'
        || q.id === 'gatebreak-ward-quest-1'
        || q.id === 'ascending-spire-quest-1'
        || q.id === 'fl-quest-1'
        || q.id === 'inkbound-academy-quest-1'
        || q.id === 'va-quest-1'
        || q.id === 'va-quest-2'
        || q.id === 'hollow-core-quest-1'
        || q.id === 'dt-quest-1'
    )
    ?? visible.find((q) => q.type === 'main')
    ?? visible[0]
  );
}

export function nextMainObjective(quest: Quest | null | undefined): string | null {
  if (!quest) return null;
  const next = (quest.objectives ?? []).find((o) => !o.completed);
  if (next?.description) return next.description;
  if (quest.whatNext?.trim()) return quest.whatNext.trim();
  return quest.description?.slice(0, 140) || null;
}

/** Last-known place pin for map / resume — from quest.location or seed bank. */
export function mainQuestPlacePin(quest: Quest | null | undefined): string | null {
  if (!quest) return null;
  const loc = (quest.location ?? QUEST_SEED_LOCATIONS[quest.id] ?? '').trim();
  return loc || null;
}

function atPlacePin(state: GameState, placePin: string | null): boolean {
  if (!placePin) return false;
  const here = (state.currentLocation ?? '').toLowerCase();
  const pin = placePin.toLowerCase();
  if (!here) return false;
  return here.includes(pin) || pin.includes(here) || here.split(/\s+/).some((w) => w.length > 3 && pin.includes(w));
}

export function resumeMainQuestFocus(state: GameState): {
  quest: Quest | null;
  nextObjective: string | null;
  placePin: string | null;
  resumeCopy: string | null;
  distanceHint: 'here' | 'nearby' | 'elsewhere' | null;
  offSpine: boolean;
} {
  const quest = mainSpineQuest(state);
  const nextObjective = nextMainObjective(quest);
  const placePin = mainQuestPlacePin(quest);
  const offSpine = Boolean(placePin && !atPlacePin(state, placePin));
  let distanceHint: 'here' | 'nearby' | 'elsewhere' | null = null;
  if (placePin) {
    distanceHint = atPlacePin(state, placePin) ? 'here' : offSpine ? 'elsewhere' : 'nearby';
  }
  const resumeCopy = quest
    ? nextObjective
      ? `Next: ${nextObjective}${placePin ? ` — pin ${placePin}` : ''}`
      : `Resume: ${quest.name}${placePin ? ` — pin ${placePin}` : ''}`
    : null;
  return {
    quest,
    nextObjective,
    placePin,
    resumeCopy,
    distanceHint,
    offSpine,
  };
}

/** Choice pad when the player is off the main-spine pin. */
export function resumeMainTravelChoice(state: GameState): string | null {
  if (state.openingEstablishment?.complete === false) return null;
  if (state.activeDungeon || state.activeEncounter) return null;
  const focus = resumeMainQuestFocus(state);
  if (!focus.quest || !focus.placePin || !focus.offSpine) return null;
  return `Return to ${focus.placePin}`;
}

/** After they finish name+place, seed the local starter hidden — never Wave/Riverside. */
export function seedLocalStarterQuest(
  quests: Quest[],
  seeds: StarterQuestSeed[] = [],
  alone = false
): Quest[] {
  const adapted = adaptStarterQuestsForArrival(seeds, alone);
  const extra = adapted.filter((s) => !quests.some((q) => q.id === s.id)).map(asSeededQuest);
  if (!extra.length) return quests;
  return [...quests, ...extra];
}

/** Reveal the first local starter after the opening scene exists. */
export function revealLocalStarterQuest(
  quests: Quest[],
  seeds: StarterQuestSeed[] = [],
  alone = false
): Quest[] {
  const adapted = adaptStarterQuestsForArrival(seeds, alone);
  const extra = adapted.filter((s) => !quests.some((q) => q.id === s.id)).map(asSeededQuest);
  const pool = [...quests, ...extra];
  const first =
    pool.find((q) => q.id === 'si-quest-1' || /first blood/i.test(q.name))
    ?? pool.find((q) => q.id === 'sp-quest-1')
    ?? pool.find((q) => (q.recommendedLevel ?? 1) <= 1 && (q.type === 'main' || !q.type));
  if (!first) return quests;
  const seed = adapted.find((s) => s.id === first.id);
  const withFirst = quests.some((q) => q.id === first.id) ? quests : [...quests, first];
  return withFirst.map((q) => {
    if (q.id !== first.id) return q;
    const fromSeed = seed
      ? {
          name: seed.title,
          description: seed.description,
          objectives: seed.objectives.map((desc, i) => ({
            id: q.objectives?.[i]?.id ?? `${seed.id}-obj-${i + 1}`,
            description: desc,
            completed: q.objectives?.[i]?.completed ?? false,
          })),
          rewards: { items: seed.rewards ? [seed.rewards] : undefined },
        }
      : {};
    return { ...q, ...fromSeed, status: 'active' as const, revealed: true };
  });
}

export function mapAnchorName(currentLocation: string | undefined, landmarks: string[]): string {
  const specific = landmarks[0];
  if (specific && isGenericMapPlace(currentLocation)) return specific;
  if (!isGenericMapPlace(currentLocation)) return currentLocation!.trim();
  return specific || currentLocation?.trim() || '';
}

/**
 * 29e — Move quest location to a biome-sane settlement when farming/fishing/etc. mismatch.
 */
export function applyBiomeSaneQuestSites(state: GameState, quests: Quest[]): Quest[] {
  const atlas = state.worldAtlas;
  if (!atlas?.settlements?.length) return quests;
  return quests.map((q) => {
    const tags = inferQuestTagsFromText(`${q.name} ${q.description} ${q.location ?? ''}`);
    if (!tags.length) return q;
    const loc = q.location?.trim();
    if (loc) {
      const site = findSettlement(atlas, loc);
      if (site && tags.every((t) => questFitsSettlement(t, site))) return q;
    }
    const pick = pickQuestSiteForTags(atlas, tags, atlas.currentRegionId);
    if (!pick) return q;
    return { ...q, location: pick.name };
  });
}
