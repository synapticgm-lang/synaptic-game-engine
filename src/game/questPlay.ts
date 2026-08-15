import type { GameState, LogEntry, Quest } from './types';

export type StarterQuestSeed = {
  id: string;
  title: string;
  description: string;
  recommendedLevel?: number;
  objectives: string[];
  rewards?: string;
};

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
  /^(every mind|every human|first blood|foundation core|integration protocol|the system|micro dungeon|micro-dungeon|side street|side st\.?|cover(?:\s*\/\s*doorway)?|cover|doorway|street|chaos|disbelief|your palm|parse designation|eye level|registration|designation|protocol|visual profile|palm|grip|knife|the air|the ground|the floor|the glint)$/i;

const PIN_DENY =
  /\b(palm|eye level|waist height|ground level|chaos|disbelief|fear|panic|registration|designation|parse|integration|system|protocol|visual profile|tutorial|quest|salvage|foundation|core|wave|first blood)\b/i;

const PLACE_TYPE_SUFFIX =
  /\b(street|st|road|rd|lane|avenue|ave|drive|way|close|terrace|place|court|square|alley|boulevard|highway|motorway|station|hospital|school|church|pub|bar|inn|hotel|cafe|café|shop|store|market|supermarket|park|farm|bridge|building|centre|center|extra|express|superstore|tesco|sainsbury|co-op|coop)\b/i;

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
    .replace(/\s+\b(and|then|what|with|for|to|around|before|after|near)\b[\s\S]*$/i, '')
    .trim();
}

function pushPlace(found: string[], raw: string | undefined, opts?: { requirePlaceShape?: boolean }): void {
  const name = titleCasePlace(clipPlace(raw ?? ''));
  if (!name || PLACE_STOP.test(name) || JUNK_PLACE.test(name) || PIN_DENY.test(name) || name.length < 3) return;
  if (opts?.requirePlaceShape && !PLACE_TYPE_SUFFIX.test(name) && name.split(/\s+/).length < 2) return;
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
    if (recommended > 1) return q;
    const hay = `${q.name} ${q.location ?? ''}`.toLowerCase();
    const hit = places.some((p) => hay.includes(p.toLowerCase()) || overlap(q.name, p));
    if (!hit) return q;
    return { ...q, revealed: true, status: q.status === 'hidden' ? 'active' : q.status };
  });

  return next;
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
  if (JUNK_PLACE.test(n) || PIN_DENY.test(n)) return true;
  if (DUMMY_STREET_NODE.test(n)) return true;
  return /^the opening of /i.test(n) || /^your surroundings$/i.test(n) || /^a cracked city street$/i.test(n);
}

export function newlyRevealedQuests(before: Quest[] | undefined, after: Quest[] | undefined): Quest[] {
  const prior = new Set(
    (before ?? []).filter((q) => q.revealed === true).map((q) => q.id)
  );
  return (after ?? []).filter((q) => q.revealed === true && !prior.has(q.id));
}

function asSeededQuest(q: StarterQuestSeed): Quest {
  return {
    id: q.id,
    name: q.title,
    description: q.description,
    status: 'hidden',
    revealed: false,
    type: 'main',
    recommendedLevel: q.recommendedLevel,
    objectives: q.objectives.map((desc, i) => ({
      id: `${q.id}-obj-${i + 1}`,
      description: desc,
      completed: false,
    })),
    rewards: { items: q.rewards ? [q.rewards] : undefined },
  };
}

/** After they finish name+place, seed the local starter hidden — never Wave/Riverside. */
export function seedLocalStarterQuest(quests: Quest[], seeds: StarterQuestSeed[] = []): Quest[] {
  const extra = seeds.filter((s) => !quests.some((q) => q.id === s.id)).map(asSeededQuest);
  if (!extra.length) return quests;
  return [...quests, ...extra];
}

/** Reveal the first local starter after the opening scene exists. */
export function revealLocalStarterQuest(quests: Quest[], seeds: StarterQuestSeed[] = []): Quest[] {
  const extra = seeds.filter((s) => !quests.some((q) => q.id === s.id)).map(asSeededQuest);
  const pool = [...quests, ...extra];
  const first =
    pool.find((q) => q.id === 'si-quest-1' || /first blood/i.test(q.name))
    ?? pool.find((q) => (q.recommendedLevel ?? 1) <= 1 && (q.type === 'main' || !q.type));
  if (!first) return quests;
  const withFirst = quests.some((q) => q.id === first.id) ? quests : [...quests, first];
  return withFirst.map((q) =>
    q.id === first.id
      ? { ...q, status: 'active' as const, revealed: true }
      : q
  );
}

export function mapAnchorName(currentLocation: string | undefined, landmarks: string[]): string {
  const specific = landmarks[0];
  if (specific && isGenericMapPlace(currentLocation)) return specific;
  if (!isGenericMapPlace(currentLocation)) return currentLocation!.trim();
  return specific || currentLocation?.trim() || '';
}
