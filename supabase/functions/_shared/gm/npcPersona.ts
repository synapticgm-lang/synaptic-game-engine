/**
 * M5 — engine-owned NPC personality (traits, relationship, scene mood, tagged history).
 * Idea only from docs/orders/merge/proto/persona.mjs — ported into live owners, not copied.
 *
 * Bounds (John): negative states may deepen but stay clamped with floors + recovery;
 * personality maths never produce suicidal ideation, permanent death, or other extreme permanent states.
 *
 * SRD 5.2.1 Ability Check (Wizards of the Coast LLC, CC BY 4.0):
 * "To make an ability check, roll a d20 and add the relevant ability modifier. …
 * Compare the total to a target number, called the Difficulty Class (DC)."
 * Relationship yields a DC shift of −5..+5 on social (CHA/persuasion) checks via socialShift().
 */

import type { GameState, NpcMemory, NpcPersona, NpcPersonaHistoryEvent, NpcPersonaRel, NpcPersonaTraits } from './types.ts';

export const PERSONA_TRAIT_KEYS = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
  'honesty',
  'pride',
  'greed',
] as const;

export type PersonaTraitKey = (typeof PERSONA_TRAIT_KEYS)[number];

/** Tagged social events the engine may record. */
export type PersonaEventTag =
  | 'polite'
  | 'flattered'
  | 'helped'
  | 'lent_to_them'
  | 'borrowed_from'
  | 'paid_back'
  | 'bought'
  | 'insulted'
  | 'threatened'
  | 'lied_caught'
  | 'cheated'
  | 'broke_promise'
  | 'attacked'
  | 'freed'
  | 'jailed';

export interface PersonaNudgeRecord {
  /** Display name only — never an engine id. */
  npcName: string;
  tag: PersonaEventTag;
  cause: string;
  applied: Record<string, string>;
  drift?: Record<string, number>;
  moodDelta: number;
  after: NpcPersonaRel;
  /** DC shift this relationship implies right after the nudge (−5..+5). */
  socialShift: number;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Floors / ceilings — negative may deepen, never past these. */
const REL_FLOOR = -100;
const REL_CEIL = 100;
const TRAIT_FLOOR = 5;
const TRAIT_CEIL = 95;
const MOOD_FLOOR = -50;
const MOOD_CEIL = 50;
/** Soft recovery toward zero for extreme negative fondness/trust when no new harm. */
const RECOVERY_STEP = 1;

const ROLE_BIAS: Record<string, Partial<Record<PersonaTraitKey, number>>> = {
  merchant: { greed: 15, conscientiousness: 10 },
  priest: { honesty: 15, agreeableness: 10 },
  innkeeper: { extraversion: 15, agreeableness: 5 },
  elder: { conscientiousness: 10, pride: 10 },
  guardian: { agreeableness: -30, neuroticism: -10 },
  apothecary: { conscientiousness: 10, openness: 10 },
  guard: { conscientiousness: 10, neuroticism: -5 },
};

type EvSpec = {
  rel?: Partial<NpcPersonaRel>;
  drift?: Partial<Record<PersonaTraitKey, number>>;
  mood?: number;
};

const EV: Record<PersonaEventTag, EvSpec> = {
  polite: { rel: { fondness: 2 }, mood: 1 },
  flattered: { rel: { fondness: 4 }, mood: 1 },
  helped: { rel: { trust: 10, fondness: 12 }, drift: { agreeableness: 1 }, mood: 4 },
  lent_to_them: { rel: { trust: 8, fondness: 10 }, drift: { agreeableness: 1 }, mood: 3 },
  borrowed_from: { rel: { trust: 2 } },
  paid_back: { rel: { trust: 15, fondness: 5 }, mood: 3 },
  bought: { rel: { fondness: 2 } },
  insulted: { rel: { fondness: -15, trust: -5 }, drift: { agreeableness: -1, neuroticism: 1 }, mood: -10 },
  threatened: { rel: { fear: 15, fondness: -10, trust: -10 }, drift: { neuroticism: 2 }, mood: -12 },
  lied_caught: { rel: { trust: -20, fondness: -5 }, mood: -4 },
  cheated: { rel: { trust: -25, fondness: -15 }, drift: { agreeableness: -2, neuroticism: 1 }, mood: -8 },
  broke_promise: { rel: { trust: -20, fondness: -8 }, mood: -3 },
  attacked: { rel: { fear: 25, fondness: -30, trust: -30 }, drift: { agreeableness: -3, neuroticism: 3 }, mood: -30 },
  freed: { rel: { trust: 12, fondness: 15, fear: -10 }, drift: { agreeableness: 1 }, mood: 8 },
  jailed: { rel: { fear: 10, fondness: -5 }, mood: -5 },
};

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

function roleKey(m: NpcMemory): string {
  const raw = (m.sheet?.job || m.roleHint || '').toLowerCase().trim();
  if (!raw) return '';
  if (ROLE_BIAS[raw]) return raw;
  for (const k of Object.keys(ROLE_BIAS)) {
    if (raw.includes(k)) return k;
  }
  return raw.split(/\s+/)[0] || '';
}

function descriptionBlob(m: NpcMemory): string {
  return [m.sheet?.speech, m.sheet?.motive, ...(m.traits ?? []), ...(m.facts ?? []).slice(0, 4)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function wordBias(blob: string): Partial<Record<PersonaTraitKey, number>> {
  const out: Partial<Record<PersonaTraitKey, number>> = {};
  const add = (partial: Partial<Record<PersonaTraitKey, number>>) => {
    for (const [k, v] of Object.entries(partial) as [PersonaTraitKey, number][]) {
      out[k] = (out[k] || 0) + v;
    }
  };
  if (/wary|suspicious|guarded/.test(blob)) add({ agreeableness: -10, neuroticism: 10 });
  if (/cheer|jovial|warm|kind|gentle/.test(blob)) add({ extraversion: 10, agreeableness: 15 });
  if (/gruff|stern|harsh|grim/.test(blob)) add({ agreeableness: -15, conscientiousness: 5 });
  if (/shrewd|cunning|sly/.test(blob)) add({ greed: 10, honesty: -10, conscientiousness: 5 });
  if (/proud|haughty|vain/.test(blob)) add({ pride: 20 });
  if (/nervous|anxious|timid/.test(blob)) add({ neuroticism: 20, extraversion: -10 });
  if (/wise|serene|calm/.test(blob)) add({ neuroticism: -15, openness: 10 });
  if (/honest|devout|pious/.test(blob)) add({ honesty: 15 });
  if (/greedy|grasping/.test(blob)) add({ greed: 20 });
  if (/curious|dreamy/.test(blob)) add({ openness: 15 });
  return out;
}

/** Seed Big-Five + honesty/pride/greed once from id/name/role/description. Deterministic. */
export function ensurePersona(state: GameState, m: NpcMemory): NpcMemory {
  if (m.persona?.traits) return m;
  const R = mulberry(fnv1a(`${m.npcId}|${m.npcName}|${state.seed ?? ''}`));
  const bias: Partial<Record<PersonaTraitKey, number>> = {
    ...(ROLE_BIAS[roleKey(m)] || {}),
    ...wordBias(descriptionBlob(m)),
  };
  const traits = {} as NpcPersonaTraits;
  for (const k of PERSONA_TRAIT_KEYS) {
    let x = 50;
    for (let i = 0; i < 3; i++) x += (R() - 0.5) * 30;
    traits[k] = Math.round(clamp(x + (bias[k] || 0), TRAIT_FLOOR, TRAIT_CEIL));
  }
  const persona: NpcPersona = {
    traits,
    traits0: { ...traits },
    rel: { trust: 0, fondness: 0, fear: 0 },
    history: [],
  };
  return { ...m, persona };
}

export function placeMood(state: GameState, place?: string): number {
  const key = (place || state.currentLocation || '').trim() || '_';
  return state.personaMood?.[key] ?? 0;
}

export function decayPlaceMoods(state: GameState): GameState {
  const moods = state.personaMood;
  if (!moods) return state;
  const next: Record<string, number> = {};
  let changed = false;
  for (const [k, v] of Object.entries(moods)) {
    const d = r1(v * 0.8);
    if (Math.abs(d) < 0.05) {
      changed = true;
      continue;
    }
    next[k] = d;
    if (d !== v) changed = true;
  }
  return changed ? { ...state, personaMood: next } : state;
}

/** Slow recovery of extreme negative trust/fondness toward 0 when not freshly harmed. */
export function recoverPersonaFloors(m: NpcMemory): NpcMemory {
  if (!m.persona?.rel) return m;
  const rel = { ...m.persona.rel };
  let changed = false;
  if (rel.trust < -40) {
    rel.trust = r1(Math.min(0, rel.trust + RECOVERY_STEP));
    changed = true;
  }
  if (rel.fondness < -40) {
    rel.fondness = r1(Math.min(0, rel.fondness + RECOVERY_STEP));
    changed = true;
  }
  if (rel.fear > 40) {
    rel.fear = r1(Math.max(0, rel.fear - RECOVERY_STEP));
    changed = true;
  }
  if (!changed) return m;
  return { ...m, persona: { ...m.persona, rel } };
}

function mult(t: NpcPersonaTraits, key: keyof NpcPersonaRel, v: number): number {
  if (key === 'fondness' && v < 0) return (1 + (t.pride - 50) / 100) * (1 - (t.agreeableness - 50) / 200);
  if (key === 'fondness' && v > 0) return 1 + (t.agreeableness - 50) / 200 + (t.extraversion - 50) / 300;
  if (key === 'trust' && v < 0) return 1 + (t.conscientiousness - 50) / 100 + (t.neuroticism - 50) / 200;
  if (key === 'trust' && v > 0) return 1 - (t.neuroticism - 50) / 200;
  if (key === 'fear') return 1 + (t.neuroticism - 50) / 100 - (t.pride - 50) / 200;
  return 1;
}

/**
 * Apply one tagged event. Same tag lands differently per traits (innocent/honest hold up longer
 * under accusation pressure via honesty/conscientiousness multipliers on negative trust).
 */
export function nudgePersona(
  state: GameState,
  m: NpcMemory,
  tag: PersonaEventTag,
  why: string,
  scale = 1,
): { state: GameState; memory: NpcMemory; nudge: PersonaNudgeRecord | null } {
  const e = EV[tag];
  if (!e) return { state, memory: m, nudge: null };
  // Guardians are fixtures — no personality drift from player social maths.
  if (roleKey(m) === 'guardian') return { state, memory: m, nudge: null };

  let mem = ensurePersona(state, m);
  const persona = mem.persona!;
  const R = { ...persona.rel };
  const applied: Record<string, string> = {};
  for (const [k, raw] of Object.entries(e.rel || {}) as [keyof NpcPersonaRel, number][]) {
    const mlt = r1(mult(persona.traits, k, raw));
    const d = r1(raw * mlt * scale);
    R[k] = r1(clamp(R[k] + d, REL_FLOOR, REL_CEIL));
    applied[k] = `${raw}×${mlt}${scale !== 1 ? `×${scale}` : ''}=${d}`;
  }
  const traits = { ...persona.traits };
  const drift: Record<string, number> = {};
  for (const [k, v] of Object.entries(e.drift || {}) as [PersonaTraitKey, number][]) {
    traits[k] = clamp(traits[k] + v, TRAIT_FLOOR, TRAIT_CEIL);
    drift[k] = v;
  }
  let nextState = state;
  const moodDelta = e.mood ? r1(e.mood * scale) : 0;
  if (moodDelta) {
    const key = (state.currentLocation || '').trim() || '_';
    const moods = { ...(state.personaMood || {}) };
    moods[key] = r1(clamp((moods[key] ?? 0) + moodDelta, MOOD_FLOOR, MOOD_CEIL));
    nextState = { ...state, personaMood: moods };
  }
  const cause = String(why).slice(0, 80);
  const hist: NpcPersonaHistoryEvent = {
    turn: state.turn ?? 0,
    tag,
    cause,
    deltas: { ...applied },
    after: { ...R },
  };
  const history = [...(persona.history || []), hist].slice(-24);
  mem = {
    ...mem,
    persona: { traits, traits0: persona.traits0, rel: R, history },
  };
  const nudge: PersonaNudgeRecord = {
    npcName: mem.npcName,
    tag,
    cause,
    applied,
    drift: Object.keys(drift).length ? drift : undefined,
    moodDelta,
    after: { ...R },
    socialShift: socialShiftForRel(R),
  };
  return { state: nextState, memory: mem, nudge };
}

/** DC shift −5..+5 from relationship (lower DC = easier for the player). */
export function socialShiftForRel(rel: NpcPersonaRel): number {
  // Proto: round(clamp(-(trust + fondness) / 20, -5, 5)); fear reserved (×0).
  return Math.round(clamp(-(rel.trust + rel.fondness) / 20, -5, 5));
}

export function socialShift(state: GameState, m: NpcMemory | undefined | null): number {
  if (!m) return 0;
  const seeded = ensurePersona(state, m);
  return socialShiftForRel(seeded.persona!.rel);
}

const moodLvl = (v: number) =>
  v >= 40 ? 'high' : v >= 15 ? 'some' : v <= -40 ? 'very low' : v <= -15 ? 'low' : null;

/**
 * Compact manner phrase for the FactSheet (display words only — no engine ids).
 * Never emits self-harm / permanent-death / suicidal ideation language.
 */
export function personaMannerLine(state: GameState, m: NpcMemory): { manner: string; mannerCause?: string } {
  const seeded = ensurePersona(state, m);
  const t = seeded.persona!.traits;
  const R = seeded.persona!.rel;
  const mood = placeMood(state);
  const warmth = R.fondness + 0.5 * R.trust + (t.agreeableness - 50) / 2 + mood / 2;
  const bits: string[] = [];
  bits.push(
    warmth > 30 ? 'warm and open' : warmth > 5 ? 'civil' : warmth > -20 ? 'wary, curt' : 'cold and hostile in tone',
  );
  if (R.fear > 30) bits.push('nervous of the player, eager to placate');
  else if (R.fear > 12) bits.push('uneasy');
  bits.push(t.extraversion > 65 ? 'talkative' : t.extraversion < 35 ? 'terse' : 'plain-spoken');
  if (t.pride > 65) bits.push('touchy about respect');
  if (t.greed > 65) bits.push('talks price first');
  if (t.honesty < 30) bits.push('shades the truth when it suits');
  if (t.neuroticism > 70) bits.push('easily rattled');
  if (t.openness > 70) bits.push('curious, asks questions');
  if (R.trust <= -30) bits.push('will not extend credit or favours');
  else if (R.trust >= 30) bits.push('willing to do the player a favour');
  const ml = moodLvl(mood);
  if (ml) bits.push(`scene mood ${ml}`);
  const hist = seeded.persona!.history;
  const last = hist[hist.length - 1];
  return {
    manner: bits.join(', '),
    mannerCause: last ? `${last.tag.replace(/_/g, ' ')} on turn ${last.turn}` : undefined,
  };
}

/** Writer-facing full stance sentence (legacy packet stances[] path). */
export function personaStanceWriterLine(state: GameState, m: NpcMemory): string {
  const { manner, mannerCause } = personaMannerLine(state, m);
  const seeded = ensurePersona(state, m);
  const R = seeded.persona!.rel;
  const why = mannerCause ? `; last: ${mannerCause}` : '';
  return `${m.npcName}'s manner toward the player now: ${manner} (trust ${R.trust}, fondness ${R.fondness}, fear ${R.fear}${why}). Their tone must match this.`;
}

/** Map old stance / treatment verbs onto persona tags. */
export function personaTagFromAction(action: string): PersonaEventTag | null {
  const a = action.toLowerCase();
  if (/\b(free|release|unlock|untie|unchain|unshackle|rescue)\b/.test(a)) return 'freed';
  if (/\b(jail|arrest|imprison|lock\s+up|throw\s+in)\b/.test(a)) return 'jailed';
  if (/\b(attack|stab|strike|hit|punch|kick|kill|harm)\b/.test(a)) return 'attacked';
  if (/\b(threaten|intimidate|demand)\b/.test(a)) return 'threatened';
  if (/\b(insult|mock|sneer|belittle)\b/.test(a)) return 'insulted';
  if (/\b(cheat|swindle|rob)\b/.test(a)) return 'cheated';
  if (/\b(lied?|caught\s+lying|lie\s+caught)\b/.test(a)) return 'lied_caught';
  if (/\b(broke?\s+(?:a\s+)?promise|betray)\b/.test(a)) return 'broke_promise';
  if (/\b(paid?\s+back|repay|repaid)\b/.test(a)) return 'paid_back';
  if (/\b(lend|lent)\b/.test(a)) return 'lent_to_them';
  if (/\b(borrow)\b/.test(a)) return 'borrowed_from';
  if (/\b(buy|bought|purchase)\b/.test(a)) return 'bought';
  if (/\b(flatter|compliment|praise)\b/.test(a)) return 'flattered';
  if (/\b(help|aid|heal|rescue|save|kind)\b/.test(a)) return 'helped';
  if (/\b(please|thank|polite|greet|bow)\b/.test(a)) return 'polite';
  return null;
}

function mentions(input: string, m: NpcMemory): boolean {
  const hay = ` ${input.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ')} `;
  for (const n of [m.npcName, ...(m.aliases ?? [])]) {
    const full = n.toLowerCase().trim();
    if (full && hay.includes(` ${full} `)) return true;
    const given = full.split(/\s+/)[0];
    if (given && given.length >= 3 && hay.includes(` ${given} `)) return true;
  }
  return false;
}

function personaTarget(state: GameState, input: string): NpcMemory | undefined {
  const here = (state.npcMemories ?? []).filter((m) => {
    const present = state.sceneFacts?.present ?? [];
    return present.some((p) => String(p).toLowerCase() === m.npcName.toLowerCase()) || m.present;
  });
  const pool = here.length ? here : state.npcMemories ?? [];
  const named = pool.filter((m) => mentions(input, m));
  if (named.length === 1) return named[0];
  if (named.length > 1) return undefined;
  return pool.length === 1 ? pool[0] : undefined;
}

/**
 * Record this turn's persona event on the aimed-at person. Appends nudge onto state.personaNudges.
 */
export function recordPersonaFromAction(
  state: GameState,
  playerInput: string,
  opts: { engineResult?: string } = {},
): GameState {
  if (/\b(?:fail(?:s|ed|ure)?|miss(?:es|ed)?)\b/i.test(opts.engineResult ?? '')) return state;
  const tag = personaTagFromAction(playerInput);
  if (!tag) return state;
  const target = personaTarget(state, playerInput);
  if (!target) return state;
  const pc = state.character?.name?.trim() || 'the player';
  const turn = (state.turn ?? 0) + 1;
  const { state: nextState, memory, nudge } = nudgePersona(
    state,
    target,
    tag,
    `${pc} ${tag.replace(/_/g, ' ')} (T${turn})`,
  );
  if (!nudge) return nextState;
  const memories = (nextState.npcMemories ?? []).map((m) => (m.npcId === memory.npcId ? memory : m));
  const nudges = [...(nextState.personaNudges ?? []), nudge];
  return { ...nextState, npcMemories: memories, personaNudges: nudges };
}

/** Clear per-turn nudge buffer after TurnLog harvest. */
export function clearPersonaNudges(state: GameState): GameState {
  if (!state.personaNudges?.length) return state;
  const { personaNudges: _drop, ...rest } = state;
  return rest as GameState;
}
