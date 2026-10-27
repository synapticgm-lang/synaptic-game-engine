/**
 * M7 — companions are full persona NPCs (a travelling relationship), not a second entity kind.
 * Being a companion is consent to travel together; wants / fears / voice / memory use the same
 * npcMemory + npcPersona + topic paths as any other NPC.
 *
 * SRD 5.2.1 glossary Attitude (Wizards of the Coast LLC, CC BY 4.0):
 * "Friendly / Indifferent / Hostile" — a Hostile companion may refuse an order or stay behind.
 * Dice stay engine-only; XP companion splits are untouched.
 */

import type { DoranMotivation, GameState, NpcAttitude, NpcMemory } from './types.ts';
import { ensurePersona, nudgePersona, type PersonaEventTag } from './npcPersona.ts';

function memoryNamed(state: GameState, name: string): NpcMemory | undefined {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;
  return (state.npcMemories ?? []).find(
    (m) => m.npcName.toLowerCase() === key || (m.aliases ?? []).some((a) => a.toLowerCase() === key),
  );
}

export type CompanionTravelDecision = 'comes' | 'refuses' | 'stays';

export type CompanionOwnAct = {
  /** Display name only. */
  name: string;
  /** disagree | refuse | act-alone | stay | come */
  kind: 'disagree' | 'refuse' | 'act-alone' | 'stay' | 'come';
  /** Writer-facing line (no engine ids). */
  detail: string;
};

const MOTIVATIONS: readonly DoranMotivation[] = [
  'Knowledge',
  'Comfort',
  'Reputation',
  'Serenity',
  'Conquest',
  'Wealth',
  'Ability',
  'Equipment',
  // Protection is valid Doran; the shared "Protection / the party / loyal" trio is what we retire.
  'Protection',
];

const TRAIT_PAIRS: readonly (readonly [string, string])[] = [
  ['curious', 'exacting'],
  ['proud', 'careful'],
  ['wary', 'practical'],
  ['warm', 'steady'],
  ['sharp', 'restless'],
  ['patient', 'grave'],
  ['shrewd', 'quiet'],
  ['bold', 'plain'],
];

const TARGETS: readonly string[] = [
  'a debt they mean to settle',
  'the craft they left unfinished',
  'news worth carrying home',
  'a name cleared of blame',
  'safe passage for their kin',
  'a relic they once swore to find',
  'coin enough to start over',
  'the truth behind a rumour',
];

const NEEDS: readonly string[] = [
  'a partner who listens',
  'time to work their own plan',
  'proof the road is worth it',
  'someone who keeps their word',
  'a say in where the party goes',
  'space to speak their mind',
];

const OFFERS: readonly string[] = [
  'their skill on the road',
  'a hard-won tip',
  'a spare hand in a scrape',
  'quiet counsel',
  'a contact in the next town',
];

const SPEECH: readonly string[] = [
  'plain',
  'formal',
  'edged',
  'low-voice',
  'prices-first',
  'plain-craft',
];

function fnv1a(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry(seed: number): () => number {
  let h = seed || 1;
  return () => {
    h += 0x6d2b79f5;
    let x = Math.imul(h ^ (h >>> 15), h | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(R: () => number, list: readonly T[]): T {
  return list[Math.floor(R() * list.length) % list.length]!;
}

/** Shared default the M7 order retires (Protection / the party / loyal, blunt). */
export function isStaleCompanionDefault(m: NpcMemory): boolean {
  const traits = m.traits ?? [];
  return (
    m.goal?.motivation === 'Protection' &&
    (m.goal?.target ?? '').toLowerCase() === 'the party' &&
    traits.some((t) => t.toLowerCase() === 'loyal')
  );
}

/**
 * Per-person agenda seeded like M5 persona (id|name|seed) — never the shared companion template.
 * Protection alone is allowed; the Protection+the party+loyal trio is not.
 */
export function personalAgendaFromSeed(src: {
  npcId?: string;
  npcName?: string;
  seed?: string;
  disposition?: NpcMemory['disposition'] | 'ambiguous';
}): {
  goal: NonNullable<NpcMemory['goal']>;
  need: string;
  offer: string;
  attitude: NpcAttitude;
  traits: string[];
  speechRegister: string;
} {
  const R = mulberry(fnv1a(`${src.npcId ?? ''}|${src.npcName ?? ''}|${src.seed ?? ''}|agenda`));
  let motivation = pick(R, MOTIVATIONS);
  let target = pick(R, TARGETS);
  let traits = [...pick(R, TRAIT_PAIRS)];
  // Never emit the retired shared default trio.
  if (motivation === 'Protection' && /the party/i.test(target) && traits.includes('loyal')) {
    motivation = 'Reputation';
    target = pick(R, TARGETS);
    traits = [...pick(R, TRAIT_PAIRS)];
  }
  if (traits.some((t) => t === 'loyal') && traits.some((t) => t === 'blunt')) {
    traits = [...pick(R, TRAIT_PAIRS)];
  }
  const attitude: NpcAttitude =
    src.disposition === 'friendly' || src.disposition === 'allied' || src.disposition === 'romanced'
      ? 'friendly'
      : src.disposition === 'hostile'
        ? 'hostile'
        : 'indifferent';
  return {
    goal: { motivation, target },
    need: pick(R, NEEDS),
    offer: pick(R, OFFERS),
    attitude,
    traits,
    speechRegister: pick(R, SPEECH),
  };
}

/** Fill persona + personal agenda on a companion memory (migrate stale defaults in place). */
export function ensureCompanionPerson(state: GameState, m: NpcMemory): NpcMemory {
  let next = ensurePersona(state, m);
  const needsAgenda =
    !next.goal?.motivation ||
    !next.goal.target ||
    !next.need ||
    !next.offer ||
    !next.attitude ||
    !next.traits?.length ||
    !next.speechRegister ||
    isStaleCompanionDefault(next);
  if (needsAgenda) {
    const fresh = personalAgendaFromSeed({
      npcId: next.npcId,
      npcName: next.npcName,
      seed: state.seed,
      disposition: next.disposition,
    });
    next = {
      ...next,
      goal: isStaleCompanionDefault(next) || !next.goal?.motivation ? fresh.goal : next.goal,
      need: isStaleCompanionDefault(next) || !next.need ? fresh.need : next.need,
      offer: isStaleCompanionDefault(next) || !next.offer ? fresh.offer : next.offer,
      attitude: next.attitude ?? fresh.attitude,
      traits: isStaleCompanionDefault(next) || !next.traits?.length ? fresh.traits : next.traits.slice(0, 2),
      speechRegister: next.speechRegister ?? fresh.speechRegister,
    };
  }
  return next;
}

/** Migrate every recruited companion row onto a personal sheet (no DB migration). */
export function migrateCompanionPeople(state: GameState): GameState {
  const names = new Set(
    [state.companion, ...(state.companions ?? []).map((c) => c?.name)]
      .filter((n): n is string => !!n)
      .map((n) => n.toLowerCase()),
  );
  if (!names.size) return state;
  const memories = state.npcMemories ?? [];
  let changed = false;
  const next = memories.map((m) => {
    const hit =
      names.has(m.npcName.toLowerCase()) ||
      (m.aliases ?? []).some((a) => names.has(a.toLowerCase()));
    if (!hit) return m;
    const ensured = ensureCompanionPerson(state, m);
    if (ensured !== m) changed = true;
    return ensured;
  });
  return changed ? { ...state, npcMemories: next } : state;
}

/**
 * Consent to travel: Hostile / afraid / low trust+fondness stay or refuse; otherwise they come.
 * Record location is unchanged when they stay or refuse.
 */
export function companionTravelConsent(state: GameState, m: NpcMemory): CompanionTravelDecision {
  const person = ensureCompanionPerson(state, m);
  const rel = person.persona?.rel ?? { trust: 0, fondness: 0, fear: 0 };
  if (
    person.attitude === 'hostile' ||
    person.disposition === 'hostile' ||
    person.stance?.now === 'hostile' ||
    person.stance?.now === 'afraid'
  ) {
    return 'stays';
  }
  if (rel.trust + rel.fondness <= -25 || rel.fear >= 45) return 'refuses';
  // Strong private want tied to the place they are in → may stay behind.
  const here = (state.currentLocation ?? '').toLowerCase();
  const want = (person.goal?.target ?? '').toLowerCase();
  if (here && want && want.includes(here) && (person.persona?.traits.conscientiousness ?? 50) > 70) {
    return 'stays';
  }
  return 'comes';
}

export function companionOwnActsOf(state: GameState): CompanionOwnAct[] {
  return state.companionOwnActs ?? [];
}

/** Parse a player order aimed at a companion ("Mara, guard the door" / "tell Bram to wait"). */
function orderTarget(state: GameState, input: string): NpcMemory | null {
  const line = (input ?? '').trim();
  if (!line) return null;
  const names = [state.companion, ...(state.companions ?? []).map((c) => c?.name)].filter(
    (n): n is string => !!n,
  );
  for (const name of names) {
    const re = new RegExp(
      `(?:^|\\b)(${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b\\s*[,:]\\s*|\\b(?:tell|order|ask|have|make)\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i',
    );
    if (!re.test(line)) continue;
    const m = memoryNamed(state, name);
    if (m) return m;
  }
  return null;
}

/**
 * Engine-decided companion acts from persona + wants (disagree / refuse / act alone).
 * Writes companionOwnActs for FactSheet + TurnLog; does not roll dice.
 */
export function applyCompanionOwnActions(state: GameState, input: string): GameState {
  const migrated = migrateCompanionPeople(state);
  const target = orderTarget(migrated, input);
  if (!target) {
    return migrated.companionOwnActs?.length ? { ...migrated, companionOwnActs: [] } : migrated;
  }
  const person = ensureCompanionPerson(migrated, target);
  const rel = person.persona?.rel ?? { trust: 0, fondness: 0, fear: 0 };
  const acts: CompanionOwnAct[] = [];
  const hostile =
    person.attitude === 'hostile' ||
    person.disposition === 'hostile' ||
    person.stance?.now === 'hostile' ||
    rel.fondness <= -30 ||
    rel.trust <= -30;

  if (hostile) {
    acts.push({
      name: person.npcName,
      kind: 'refuse',
      detail: `${person.npcName} refuses the order.`,
    });
  } else if (rel.fondness + rel.trust < 0 || (person.persona?.traits.agreeableness ?? 50) < 35) {
    acts.push({
      name: person.npcName,
      kind: 'disagree',
      detail: `${person.npcName} disagrees and will not go along quietly.`,
    });
  } else if ((person.persona?.traits.openness ?? 50) > 70 && person.goal?.target) {
    acts.push({
      name: person.npcName,
      kind: 'act-alone',
      detail: `${person.npcName} acts on their own toward ${person.goal.target}.`,
    });
  }

  const memories = (migrated.npcMemories ?? []).map((m) => (m.npcId === person.npcId ? person : m));
  return { ...migrated, npcMemories: memories, companionOwnActs: acts };
}

/**
 * Writer / FactSheet facing text for a companion order (prep08 buildWriterPacket check-name).
 * Refusal / disagreement appears as beat lines the writer must honour.
 * Kept free of FactSheet imports to avoid a cycle with npcRecords travel consent.
 */
export function buildWriterPacket(state: GameState, order: string): { toString(): string; text: string } {
  const next = applyCompanionOwnActions(state, order);
  const acts = companionOwnActsOf(next);
  const lines = [
    'WORLD FACTS (this turn):',
    `PLAYER typed: ${order}`,
    ...acts.map((a) => `  step: ${a.kind} — ${a.detail}`),
  ];
  if (acts.length) {
    lines.push(`ENGINE RESULT: ${acts.map((a) => a.detail).join(' ')}`);
  }
  const text = lines.join('\n');
  return { text, toString: () => text };
}

/** Map legacy companion-approval events onto M5 persona tags (same relationship ledger). */
export function approvalPersonaTag(
  event: 'harmCompanion' | 'harmOther' | 'kindCompanion' | 'kindOther' | 'foughtTogether' | 'join' | 'campTalk',
): PersonaEventTag | null {
  switch (event) {
    case 'harmCompanion':
    case 'harmOther':
      return 'threatened';
    case 'kindCompanion':
    case 'kindOther':
    case 'foughtTogether':
    case 'join':
    case 'campTalk':
      return 'helped';
    default:
      return null;
  }
}

/** Apply a persona nudge for a companion approval event (feeds trust/fondness/fear). */
export function nudgeCompanionApproval(
  state: GameState,
  companionName: string,
  event: 'harmCompanion' | 'harmOther' | 'kindCompanion' | 'kindOther' | 'foughtTogether' | 'join' | 'campTalk',
  why: string,
): GameState {
  const tag = approvalPersonaTag(event);
  if (!tag) return state;
  const m = memoryNamed(state, companionName);
  if (!m) return state;
  const scale = event === 'foughtTogether' || event === 'campTalk' ? 0.4 : event === 'join' ? 0.8 : 1;
  const r = nudgePersona(state, ensureCompanionPerson(state, m), tag, why, scale);
  if (!r.nudge) return r.state;
  const memories = (r.state.npcMemories ?? []).map((row) => (row.npcId === r.memory.npcId ? r.memory : row));
  const nudges = [...(r.state.personaNudges ?? []), {
    npcName: r.nudge.npcName,
    tag: r.nudge.tag,
    cause: r.nudge.cause,
    applied: r.nudge.applied,
    drift: r.nudge.drift,
    moodDelta: r.nudge.moodDelta,
    after: r.nudge.after,
    socialShift: r.nudge.socialShift,
  }];
  return { ...r.state, npcMemories: memories, personaNudges: nudges };
}
