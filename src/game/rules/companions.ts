/** Named companion join + approval (Story RPG / LitRPG). Bands only; tabletop has no recruit path. */
import type { Companion, GameState, SidekickKind } from '../types';
import type { Disposition } from '../npcRelationships';
import { presentNpcNames, shiftStoredRelationship, storedRelationshipFor, type StoredShift } from '../npcRelationships';
import { storedDisposition } from '../checkRules';
import { parsePlayerIntent, type PlayerIntent } from '../intentParser';
import { SIDEKICKS, sidekickMaxHp, sidekickProfile } from './sidekick';
import type { SidekickProfile } from './roundCombat';

/** Trust at or below these gives the first and the last warning; at or below LEAVES_AT the companion goes. */
export const APPROVAL_WARNINGS = [-20, -40] as const;
export const APPROVAL_LEAVES_AT = -50;
export const PARTY_CAP = 1;

/** Code owns these shifts (trust on the companion's record), never the writer. */
export const APPROVAL_SHIFT = {
  join: { trust: 10, familiarity: 10 },
  harmCompanion: { trust: -20, familiarity: 1 },
  harmOther: { trust: -12, familiarity: 1 },
  kindCompanion: { trust: 6, familiarity: 2 },
  kindOther: { trust: 4, familiarity: 1 },
  foughtTogether: { trust: 2, familiarity: 2 },
  /** A night's talk at a road camp (travelJourney): they know the player a little better. */
  campTalk: { trust: 2, familiarity: 3 },
} as const;

const BAND_LABEL: Record<Disposition, string> = {
  hostile: 'Hostile',
  wary: 'Wary',
  neutral: 'Neutral',
  friendly: 'Friendly',
  allied: 'Allied',
  loyal: 'Loyal',
};

const JOINS: ReadonlySet<Disposition> = new Set(['neutral', 'friendly', 'allied', 'loyal']);

export function companionsAllowed(state: Pick<GameState, 'engineMode'>): boolean {
  return state.engineMode === 'rpg' || state.engineMode === 'litrpg';
}

export function recruitedCompanions(state: Pick<GameState, 'companions'>): Companion[] {
  return (state.companions ?? []).filter((c) => c.recruited);
}

/** The approval band the player sees for this NPC (from the stored record; none yet reads Neutral). */
export function approvalBand(state: GameState, npcName: string): Disposition {
  return storedDisposition(storedRelationshipFor(state, npcName) ?? {});
}

export function approvalBandLabel(state: GameState, npcName: string): string {
  return BAND_LABEL[approvalBand(state, npcName)];
}

const fighting = (s: GameState) => !!s.activeEncounter || !!s.roundCombat;

const RECRUIT_LINE =
  /^(?:ask|invite|recruit)\s+(.+?)(?:\s+to\s+(?:join|come with|come along|travel with|ride with|fight with)\b.*)?[.!?]?$/i;

/** A present named NPC this line asks to join, or null. */
export function recruitTarget(state: GameState, input: string): string | null {
  if (!companionsAllowed(state)) return null;
  const t = (input ?? '').trim();
  const m = t.match(RECRUIT_LINE);
  if (!m) return null;
  if (!/^recruit\b/i.test(t) && !/\bto\s+(?:join|come with|come along|travel with|ride with|fight with)\b/i.test(t)) return null;
  const want = m[1]!.trim().replace(/^the\s+/i, '').toLowerCase();
  const name = presentNpcNames(state).find((n) => n.toLowerCase() === want);
  if (!name || !/^[A-Z]/.test(name)) return null;
  if ((state.companions ?? []).some((c) => c.name.toLowerCase() === want)) return null;
  return name;
}

export function recruitChip(name: string): string {
  return `Ask ${name} to join you`;
}

/** The party row's recruit chips: present named NPCs whose band is Friendly or better, while the party has room. */
export function recruitPad(state: GameState): string[] | null {
  if (!companionsAllowed(state) || fighting(state) || recruitedCompanions(state).length >= PARTY_CAP) return null;
  const taken = new Set((state.companions ?? []).map((c) => c.name.toLowerCase()));
  const names = presentNpcNames(state).filter(
    (n) => /^[A-Z]/.test(n) && !taken.has(n.toLowerCase()) && ['friendly', 'allied', 'loyal'].includes(approvalBand(state, n))
  );
  return names.length ? names.map(recruitChip) : null;
}

/** The fighting kind follows the NPC's own role (spell users cast, sharp trades help, everyone else fights). */
export function companionKind(state: GameState, npcName: string): SidekickKind {
  const key = npcName.toLowerCase();
  const mem = (state.npcMemories ?? []).find((m) => m.npcName.toLowerCase() === key);
  const role = `${mem?.roleHint ?? ''} ${mem?.sheet?.job ?? ''}`.toLowerCase();
  if (/\b(mage|wizard|witch|priest|priestess|cleric|healer|apothecar\w*|scholar|sorcer\w*|shaman|monk|archivist)\b/.test(role)) return 'spellcaster';
  if (/\b(thief|rogue|scout|fence|merchant|clerk|smuggler|spy|guide|hunter|archer|courier|broker|handler|informant)\b/.test(role)) return 'expert';
  return 'warrior';
}

function makeCompanion(state: GameState, name: string): Companion {
  const kind = companionKind(state, name);
  const level = state.character?.level || 1;
  const hp = sidekickMaxHp(kind, level);
  const r = SIDEKICKS[kind];
  return {
    id: `companion-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name,
    type: 'party',
    role: r.role.replace(/ sidekick$/, ' companion'),
    hp,
    maxHp: hp,
    maintenanceCost: 'none',
    assignment: 'At your side',
    notes: `${name} ${r.does}.`,
    sidekick: kind,
    ac: r.ac,
    level,
    recruited: true,
    approvalWarnings: 0,
  };
}

/** The companion who fights beside the PC in a one-turn engine fight (story RPG / LitRPG), at the PC's level. */
export function combatCompanion(state: GameState): { companion: Companion; profile: SidekickProfile } | null {
  if (!companionsAllowed(state)) return null;
  const c = recruitedCompanions(state).find((x) => x.sidekick && x.hp > 0);
  return c ? { companion: c, profile: sidekickProfile(c, state.character?.level || 1) } : null;
}

/** After the fight: the companion keeps its hurt; knocked out means it gets up at 1 HP when the fight ends. */
export function afterFightCompanion(state: GameState, id: string, hpAfter: number): GameState {
  const level = state.character?.level || 1;
  const companions = (state.companions ?? []).map((c) => {
    if (c.id !== id || !c.sidekick) return c;
    const maxHp = sidekickMaxHp(c.sidekick, level);
    return { ...c, level, maxHp, hp: Math.max(1, Math.min(maxHp, hpAfter)) };
  });
  return { ...state, companions };
}

export interface CompanionSettle {
  state: GameState;
  receipts: string[];
  facts: string[];
}

function writeShift(state: GameState, name: string, shift: StoredShift, kind: 'interaction' | 'milestone' | 'threat' | 'favor') {
  const turn = state.turn ?? 0;
  const r = shiftStoredRelationship(state.arcDirector?.npcRelationships, name, shift, turn, kind);
  return {
    state: { ...state, arcDirector: { ...(state.arcDirector ?? {}), npcRelationships: r.list } } as GameState,
    before: r.before,
    after: r.after,
  };
}

/** "Ask Vessa to join you": the engine decides from the NPC's band. Neutral or better joins; Wary or Hostile refuses. */
function settleRecruit(state: GameState, input: string): CompanionSettle | null {
  if (fighting(state)) return null;
  const name = recruitTarget(state, input);
  if (!name) return null;
  if (recruitedCompanions(state).length >= PARTY_CAP) {
    return {
      state,
      receipts: [`Companion: ${name} cannot join — your party is full.`],
      facts: [`${name} did not join: the player already travels with ${recruitedCompanions(state)[0]!.name}.`],
    };
  }
  const band = approvalBand(state, name);
  if (!JOINS.has(band)) {
    return {
      state,
      receipts: [`Companion: ${name} will not join you (${BAND_LABEL[band]}).`],
      facts: [`${name} refused to join the player.`],
    };
  }
  const shifted = writeShift(state, name, { ...APPROVAL_SHIFT.join, milestone: { type: 'alliance', summary: `${name} joined the player` } }, 'milestone');
  const next = { ...shifted.state, companions: [...(shifted.state.companions ?? []), makeCompanion(shifted.state, name)] };
  return {
    state: next,
    receipts: [`Companion: ${name} joined you (${BAND_LABEL[shifted.after.disposition]}).`],
    facts: [`${name} agreed to travel with the player and fight at their side.`],
  };
}

/** A night's talk at a road camp moves the travelling companion's record a little; the band shows only if it moved. */
export function settleCampTalk(state: GameState): CompanionSettle | null {
  const companion = recruitedCompanions(state)[0];
  if (!companion || !companionsAllowed(state)) return null;
  const shifted = writeShift(state, companion.name, APPROVAL_SHIFT.campTalk, 'interaction');
  const moved = shifted.after.disposition !== shifted.before.disposition;
  return {
    state: shifted.state,
    receipts: moved ? [`Companion: ${companion.name} approves (now ${BAND_LABEL[shifted.after.disposition]}).`] : [],
    facts: [],
  };
}

type ApprovalEvent = keyof Omit<typeof APPROVAL_SHIFT, 'join' | 'campTalk'>;

/** Spec E-CA: engine outcomes for approval (never stance wording). */
export type ApprovalOutcome = {
  wonFight?: boolean;
  harmed?: readonly string[];
  helped?: readonly string[];
  takenFrom?: readonly string[];
  fightFoes?: readonly string[];
};

export type ApprovalInput = { intent: PlayerIntent; outcome: ApprovalOutcome };

/** First match: harmCompanion → harmOther → kindCompanion → kindOther → foughtTogether. */
function approvalEvent(companion: Companion, input: string, approval: ApprovalInput): ApprovalEvent | null {
  const { intent, outcome } = approval;
  if (intent.targetsSelf) return null;
  const cLow = companion.name.trim().toLowerCase();
  const line = (input ?? '').toLowerCase();
  const harms = outcome.harmed ?? [];
  const helps = outcome.helped ?? [];
  const taken = outcome.takenFrom ?? [];
  const foes = outcome.fightFoes ?? [];
  let atCompanion = line.includes(cLow);
  if (!atCompanion) {
    for (const t of intent.targets) {
      const tl = t.trim().toLowerCase();
      if (tl === cLow || cLow.includes(tl) || tl.includes(cLow)) {
        atCompanion = true;
        break;
      }
    }
  }
  for (const n of harms) {
    if (n.trim().toLowerCase() === cLow && atCompanion) return 'harmCompanion';
  }
  for (const n of taken) {
    if (n.trim().toLowerCase() !== cLow) return 'harmOther';
  }
  for (const n of harms) {
    const nLow = n.trim().toLowerCase();
    if (nLow === cLow) continue;
    if (outcome.wonFight && foes.some((f) => f.trim().toLowerCase() === nLow)) continue;
    let at = line.includes(nLow);
    if (!at) {
      for (const t of intent.targets) {
        const tl = t.trim().toLowerCase();
        if (tl === nLow || nLow.includes(tl) || tl.includes(nLow)) {
          at = true;
          break;
        }
      }
    }
    if (at) return 'harmOther';
  }
  for (const n of helps) {
    if (n.trim().toLowerCase() === cLow) return 'kindCompanion';
  }
  for (const n of helps) {
    if (n.trim().toLowerCase() !== cLow) return 'kindOther';
  }
  return outcome.wonFight ? 'foughtTogether' : null;
}

/** One approval move on the companion, its warnings and its leaving. */
function settleApproval(state: GameState, companion: Companion, event: ApprovalEvent): CompanionSettle {
  const name = companion.name;
  const shift = APPROVAL_SHIFT[event];
  const kind = event.startsWith('harm') ? 'threat' : event === 'foughtTogether' ? 'interaction' : 'favor';
  const shifted = writeShift(state, name, shift, kind);
  let next = shifted.state;
  const band = BAND_LABEL[shifted.after.disposition];
  const moved = shifted.after.disposition !== shifted.before.disposition;
  const receipts: string[] = [];
  const facts: string[] = [];
  if (shift.trust < 0) {
    receipts.push(`Companion: ${name} disapproves${moved ? ` (now ${band})` : ''}.`);
    facts.push(`${name} saw what the player did and did not like it.`);
  } else if (event !== 'foughtTogether' || moved) {
    receipts.push(`Companion: ${name} approves${moved ? ` (now ${band})` : ''}.`);
    if (event !== 'foughtTogether') facts.push(`${name} saw what the player did and approved.`);
  }
  const trust = shifted.after.trust;
  const warned = companion.approvalWarnings ?? 0;
  // Never leaves without both warnings first, and at most one warning a turn.
  if (trust <= APPROVAL_LEAVES_AT && warned >= APPROVAL_WARNINGS.length) {
    next = { ...next, companions: (next.companions ?? []).filter((c) => c.id !== companion.id) };
    receipts.push(`Companion: ${name} left your party.`);
    facts.push(`${name} left the player's company and will not travel with them now.`);
    return { state: next, receipts, facts };
  }
  const owed = APPROVAL_WARNINGS.filter((w) => trust <= w).length;
  const due = Math.min(warned + 1, trust <= APPROVAL_LEAVES_AT ? APPROVAL_WARNINGS.length : owed);
  if (due > warned) {
    const last = due >= APPROVAL_WARNINGS.length;
    next = { ...next, companions: (next.companions ?? []).map((c) => (c.id === companion.id ? { ...c, approvalWarnings: due } : c)) };
    receipts.push(`Companion: ${name} warns you — ${last ? 'last warning' : 'first warning'}.`);
    facts.push(
      last
        ? `${name} told the player plainly that one more act like this and ${name} leaves.`
        : `${name} told the player plainly that ${name} does not like where this is going.`
    );
  }
  return { state: next, receipts, facts };
}

/** Recruit, or one approval event per companion from intent + engine outcome (Spec E-CA). */
export function settleCompanions(
  state: GameState,
  input: string,
  opts: { wonFight?: boolean; outcome?: ApprovalOutcome } = {}
): CompanionSettle {
  const none: CompanionSettle = { state, receipts: [], facts: [] };
  if (!companionsAllowed(state)) return none;
  const recruit = settleRecruit(state, input);
  if (recruit) return recruit;
  const intent = parsePlayerIntent(input, state);
  const outcome: ApprovalOutcome = {
    ...(opts.outcome ?? {}),
    wonFight: opts.outcome?.wonFight ?? opts.wonFight,
  };
  const approval: ApprovalInput = { intent, outcome };
  let working = state;
  const receipts: string[] = [];
  const facts: string[] = [];
  for (const c of recruitedCompanions(state)) {
    const event = approvalEvent(c, input, approval);
    if (!event) continue;
    const done = settleApproval(working, c, event);
    working = done.state;
    receipts.push(...done.receipts);
    facts.push(...done.facts);
  }
  return { state: working, receipts, facts };
}

/** The party row heading: each companion with the band (never a number). */
export function partyHeading(state: GameState): string | null {
  const party = recruitedCompanions(state);
  if (!party.length) return null;
  const who = party.map((c) => `${c.name} (${approvalBandLabel(state, c.name)})`).join(', ');
  return state.engineMode === 'litrpg' ? `System — party: ${who}` : `With you: ${who}`;
}

/** The System window's party line for LitRPG. */
export function partyWindowLine(state: GameState): string | null {
  const party = recruitedCompanions(state);
  if (!party.length) return null;
  return `Party: ${party.map((c) => `${c.name} — ${approvalBandLabel(state, c.name)}`).join(', ')}`;
}
