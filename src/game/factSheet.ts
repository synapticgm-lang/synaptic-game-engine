/**
 * M1 — one typed per-turn FactSheet the writer receives.
 * Port of the engine-first idea in docs/orders/merge/proto/engine.mjs factSheet() (reference only).
 * Display names only: no engine ids, internal keys, or ledger chrome labels reach this sheet.
 * Settings block is a reserved empty slot for order 6b.
 */

import type { GameState, NpcMemory } from './types';
import type { CompletedEventPacket } from './completedEventPacket';
import { playerFacingLocation } from './locationName';
import { presentNpcRecords } from './npcRecords';
import { openCommitmentsFor, commitmentLine } from './stateTx';
import { sheetExitNames, weaponInHand } from './infoSheet';
import { writerFacts } from './systemHousing';
import { activeHereSpot } from './hereSpot';
import { placeScale } from './placeAuthority';
import { isSystemWindowLabel } from './chromeAuthority';
import type { PlaceProp } from './types';
import { stockForMerchant } from './shopStock';
import { personaMannerLine } from './npcPersona';
import { parsePlayerSteps, sheetContextFromState } from './intentParser';

/** One person here, for the writer: display name + manner only. */
export interface FactSheetPerson {
  name: string;
  role?: string;
  /** Stance/manner toward the player (M5 persona phrase; display words only). */
  manner?: string;
  /** Why they are that way, when the engine recorded a cause. */
  mannerCause?: string;
  /** Items this person is carrying now. Display names only. */
  carried?: string[];
  /** One engine-recorded signature item. Display name only. */
  signature?: string;
  /** What this person sells today. Absent when they are not a merchant. */
  stock?: Array<{ name: string; quantity: number; price: number }>;
}

/** One open ledger entry the writer may show (loan / promise / offer). */
export interface FactSheetLedgerEntry {
  kind: 'promise' | 'deal' | 'agreement' | 'offer' | 'loan';
  /** Display line only. */
  line: string;
}

/** One engine beat step for this turn (outcome the prose must show). */
export interface FactSheetBeatStep {
  /** Short display outcome (e.g. "spoke", "moved", fight fact line). */
  outcome: string;
  detail?: string;
}

/** Gear the PC wears / carries — display names. */
export interface FactSheetGear {
  worn: string[];
  carrying: string[];
  inHand: string;
  gold?: number;
}

/** Player line vs world: attempts and claims that are not facts. */
export interface FactSheetPlayer {
  typed: string;
  /** Claims the world does not confirm (never narrate as true). */
  claimsNotTrue: string[];
}

/** Quest state the writer may know (tabletop hides the quest record). */
export interface FactSheetQuest {
  title: string;
  status: string;
  step?: string;
}

/**
 * The single fact sheet for one turn.
 * `settingsSlot` stays empty until 6b plugs player settings in.
 */
export interface FactSheet {
  turn: number;
  place: {
    name: string;
    position?: string;
    scale?: string;
    exits: string[];
    features: string[];
  };
  present: FactSheetPerson[];
  openLedger: FactSheetLedgerEntry[];
  gear: FactSheetGear;
  beat: {
    verb: string;
    outcome: string;
    engineResult?: string;
    steps: FactSheetBeatStep[];
  };
  player: FactSheetPlayer;
  quests: FactSheetQuest[];
  /** Recent timeline display lines (same guarantee the old WORLD FACTS block carried). */
  recent: string[];
  /** T10DIR — stall / world-pressure fact the writer must show this beat (also on timeline). */
  stallPressure?: string;
  /** Item names an engine transfer moved to the player this turn. */
  granted?: string[];
  /** Reserved for order 6b — do not fill here. */
  settingsSlot: null;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const norm = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();

function questHidden(state: GameState): boolean {
  return state.engineMode === 'dnd';
}

/** M5 persona manner replaces the old 5-word stance.now on the FactSheet. */
function mannerOf(state: GameState, m: NpcMemory): {
  manner?: string;
  mannerCause?: string;
} {
  const line = personaMannerLine(state, m);
  if (line.manner) {
    return {
      manner: clip(line.manner, 160),
      mannerCause: line.mannerCause ? clip(line.mannerCause, 100) : undefined,
    };
  }
  if (m.stance?.now) return { manner: m.stance.now, mannerCause: m.stance.cause };
  if (m.disposition && m.disposition !== 'neutral' && m.disposition !== 'unknown') {
    return { manner: m.disposition };
  }
  return {};
}

function openOffers(state: GameState): FactSheetLedgerEntry[] {
  const open = state.openingEstablishment;
  if (!open || open.offerTaken) return [];
  const offer = open.card?.offer;
  if (!offer) return [];
  const items = (offer.items ?? []).filter(Boolean).join(', ');
  const line = items || norm(offer.accept);
  return line ? [{ kind: 'offer', line: clip(line, 120) }] : [];
}

function questRows(state: GameState): FactSheetQuest[] {
  if (questHidden(state)) return [];
  const facts = writerFacts(state).quests;
  return facts
    .filter((q) => q.revealed || q.status === 'active' || q.status === 'completed')
    .slice(0, 4)
    .map((q) => {
      const step = (q.objectives ?? []).find((o) => !o.completed)?.description;
      return {
        title: q.name,
        status: q.status,
        step: step ? clip(step, 100) : undefined,
      };
    });
}

/**
 * The sheet lists at most `cap` carried names, and also any of those names gained this turn.
 * A 13th older item stays off the sheet. A 13th item gained this turn stays on it, so the fact
 * gate does not treat that gain as unlisted and drop the sentence.
 */
/** Names whose carried quantity rose this turn. Worn-only stacks are not gains for the sheet. */
export function inventoryGainedThisTurn(before: GameState | undefined, after: GameState): string[] {
  if (!before) return [];
  const qty = (items: GameState['inventory'] | undefined) => {
    const totals = new Map<string, { name: string; qty: number; carried: boolean }>();
    for (const item of items ?? []) {
      const name = (item.name ?? '').trim();
      const key = name.toLowerCase();
      if (!key) continue;
      const count = item.quantity ?? 1;
      const prev = totals.get(key);
      if (!prev) totals.set(key, { name, qty: count, carried: !item.equipped });
      else {
        prev.qty += count;
        if (!item.equipped) prev.carried = true;
      }
    }
    return totals;
  };
  const prior = qty(before.inventory);
  const now = qty(after.inventory);
  const gained: string[] = [];
  for (const [key, row] of now) {
    if (!row.carried) continue;
    if (row.qty <= (prior.get(key)?.qty ?? 0)) continue;
    gained.push(row.name);
  }
  return gained;
}

export function carryingForSheet(names: string[], gainedThisTurn: readonly string[] = [], cap = 12): string[] {
  const listed = names.slice(0, cap);
  const have = new Set(listed.map((name) => name.trim().toLowerCase()).filter(Boolean));
  const held = new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean));
  for (const raw of gainedThisTurn) {
    const name = raw.trim();
    const key = name.toLowerCase();
    if (!key || have.has(key) || !held.has(key)) continue;
    const display = names.find((item) => item.trim().toLowerCase() === key) ?? name;
    listed.push(display);
    have.add(key);
  }
  return listed;
}

function gearOf(state: GameState, gainedThisTurn: readonly string[] = []): FactSheetGear {
  const kit = writerFacts(state);
  const worn = kit.carried.filter((i) => i.equipped).map((i) => i.name);
  const carrying = kit.carried.filter((i) => !i.equipped).map((i) => i.name);
  return {
    worn,
    carrying: carryingForSheet(carrying, gainedThisTurn),
    inHand: weaponInHand(state),
    gold: typeof state.gold === 'number' ? state.gold : undefined,
  };
}

function beatSteps(packet: CompletedEventPacket, state?: GameState): FactSheetBeatStep[] {
  const steps: FactSheetBeatStep[] = [];
  // M2 — one FactSheet beat line per reader step when the engine recorded them.
  const readerSteps = packet.readerStepResults;
  if (readerSteps?.length) {
    for (const s of readerSteps) {
      steps.push({
        outcome: s.done ? 'done' : 'not done',
        detail: clip(`${s.tried}: ${s.reason}`, 160),
      });
    }
  } else {
    steps.push({ outcome: packet.outcome, detail: `${packet.verb}${packet.target ? ` → ${packet.target}` : ''}` });
    if (packet.engineResult) steps.push({ outcome: 'engine', detail: packet.engineResult });
  }
  // M7 — companion own-acts (refuse / disagree / stay) are engine facts on the sheet.
  for (const a of state?.companionOwnActs ?? []) {
    steps.push({ outcome: a.kind, detail: clip(a.detail, 160) });
  }
  if (packet.movement) steps.push({ outcome: 'moved', detail: packet.movement });
  if (packet.justKilled && packet.lastKill?.name) {
    steps.push({ outcome: 'killed', detail: packet.lastKill.name });
  }
  if (packet.xp > 0) steps.push({ outcome: 'xp', detail: String(packet.xp) });
  for (const g of packet.gates ?? []) steps.push({ outcome: 'lock', detail: g });
  return steps;
}

/** Display-only recent timeline lines (info-layer guarantee; no engine ids). */
function recentTimeline(state: GameState): string[] {
  return (state.timeline ?? [])
    .slice(-6)
    .map((f) => {
      if (f.verb && f.name) {
        const body =
          f.verb === 'said'
            ? `${f.name}${f.detail ? `: ${f.detail}` : ' said'}`
            : `${f.verb}: ${f.name}${f.detail ? `, ${f.detail}` : ''}`;
        return clip(norm(body), 160);
      }
      if ((f.kind === 'damage' || f.kind === 'heal') && f.name && f.detail && /^\d+$/.test(f.detail)) {
        return clip(`${f.kind}: ${f.name}, ${f.detail}`, 160);
      }
      return clip(norm(f.text), 160);
    })
    .filter(Boolean);
}

/** Scene props the writer may name — chrome windows drop when a housing replaces the floating panel. */
function filedPropLabels(props: PlaceProp[] | undefined): string[] {
  if (!props?.length) return [];
  const takeable = props.filter((p) => p.takeable && !p.summary).sort((a, b) => b.turn - a.turn);
  const fixed = props.filter((p) => !p.takeable && !p.summary);
  return [...takeable, ...fixed].slice(0, 6).map((p) => p.label);
}

function placeFeatures(state: GameState, packet: CompletedEventPacket): string[] {
  const filed = filedPropLabels(state.activeDungeon
    ? state.activeDungeon.nodes.find((n) => n.id === state.activeDungeon?.currentNodeId)?.roomProps ?? state.sceneFacts?.roomProps
    : state.sceneFacts?.roomProps);
  const raw = [
    ...(filed.length ? filed : (state.sceneFacts?.props ?? []).slice(0, 6)),
    ...(packet.focusNoun ? [packet.focusNoun] : []),
  ];
  return raw
    .map(norm)
    .filter(Boolean)
    .filter((n) => !((packet.ledgerRead || state.systemHousing) && isSystemWindowLabel(n)))
    .filter((n, i, a) => a.findIndex((x) => x.toLowerCase() === n.toLowerCase()) === i);
}

/**
 * Player claims the world does not confirm. M2 intentParser fills this from the reader claim list
 * (never steps, never facts).
 */
function claimsNotTrue(state: GameState, typed: string): string[] {
  if (!typed.trim()) return [];
  const read = parsePlayerSteps(typed, sheetContextFromState(state));
  return read.claims.map((c) => clip(c, 160)).slice(0, 8);
}

/**
 * Build the one FactSheet for this turn from committed state + completed-event packet.
 * C2: display names only — never npcId, questId, actionId, or internal enums as labels.
 */
export function buildFactSheet(
  state: GameState,
  packet: CompletedEventPacket,
  playerInput?: string
): FactSheet {
  const placeName = playerFacingLocation(state) || norm(packet.location) || 'unknown place';
  const spot = activeHereSpot(state);
  const presentPeople = presentNpcRecords(state).filter(
    (r) => !packet.lastKill?.name || r.npcName.toLowerCase() !== packet.lastKill.name.toLowerCase()
  );
  const presentNames = presentPeople.map((r) => r.npcName);
  for (const w of packet.witnesses ?? []) {
    if (!presentNames.some((n) => n.toLowerCase() === w.toLowerCase())) presentNames.push(w);
  }
  const present: FactSheetPerson[] = presentPeople.map((r) => {
    const { manner, mannerCause } = mannerOf(state, r);
    const held = r.heirloom?.holderId === r.npcId ? r.heirloom.label : undefined;
    const signature = held || r.listedSignature;
    const job = `${r.sheet?.job ?? ''} ${r.roleHint ?? ''}`;
    const stock = /\bmerchant\b/i.test(job) ? stockForMerchant(state, r.npcId, r.location ?? placeName) : undefined;
    return {
      name: r.npcName,
      role: r.sheet?.job || r.roleHint || undefined,
      manner,
      mannerCause,
      ...(signature ? { signature, carried: [signature] } : {}),
      ...(stock ? { stock } : {}),
    };
  });
  // Anonymous / opening cast labels on the packet witnesses that lack a memory row.
  for (const w of packet.witnesses ?? []) {
    if (present.some((p) => p.name.toLowerCase() === w.toLowerCase())) continue;
    present.push({ name: w });
  }

  const commitments = openCommitmentsFor(state, presentNames).map((c) => ({
    kind: (c.kind === 'deal' ? 'deal' : c.kind === 'agreement' ? 'agreement' : 'promise') as FactSheetLedgerEntry['kind'],
    line: commitmentLine(c),
  }));
  const openLedger = [...commitments, ...openOffers(state)];

  const typed = norm(playerInput ?? packet.playerAction);

  return {
    turn: packet.turn ?? state.turn ?? 0,
    place: {
      name: placeName,
      position: spot?.spot,
      scale: placeScale(state) ?? undefined,
      exits: sheetExitNames(state),
      features: placeFeatures(state, packet),
    },
    present,
    openLedger,
    gear: gearOf(state, packet.loot ?? []),
    beat: {
      verb: packet.verb,
      outcome: packet.outcome,
      engineResult:
        packet.engineResult ||
        (state.companionOwnActs?.length
          ? state.companionOwnActs.map((a) => a.detail).join(' ')
          : undefined),
      steps: beatSteps(packet, state),
    },
    player: {
      typed: clip(typed, 300),
      claimsNotTrue: claimsNotTrue(state, typed),
    },
    quests: questRows(state),
    recent: recentTimeline(state),
    stallPressure:
      (state.sceneFacts?.stallWorldFact ?? state.sceneFacts?.placeWorldFact ?? '').trim() || undefined,
    granted: (state.stateTxLog ?? [])
      .filter((t) => t.turn === (state.turn ?? 0) && /^Heirloom /.test(t.summary) && t.entity)
      .map((t) => t.entity),
    settingsSlot: null,
  };
}

/** Stable hash of the sheet for TurnLog (orders 7 / 10B read cost/time; hash ties the facts). */
export function hashFactSheet(sheet: FactSheet): string {
  const body = JSON.stringify(sheet);
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fs_${(h >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * T10TURNS — writer-facing FactSheet char budget (WORLD FACTS block only).
 * Pins trim: short ENGINE RESULT leaves this block when the leaf owns the long form.
 * Recent timeline stays here — INFO SHEET LAST is GM-log engine results, not discovery timeline.
 * Fixture growth beyond this fails the section-budget test.
 */
export const FACT_SHEET_WRITER_CHAR_BUDGET = 2200;

export type FormatFactSheetOpts = {
  /**
   * Writer leaf already prints the long ENGINE RESULT (required fact).
   * Omit only the short `ENGINE RESULT:` duplicate from WORLD FACTS.
   * Keep Recent timeline — sole owner of discovery timeline on the writer path.
   */
  writerLeaf?: boolean;
};

/**
 * Writer-facing text: one WORLD FACTS block (the info-layer guarantee, single source).
 * Settings slot left as a blank header for 6b.
 */
export function formatFactSheetForWriter(sheet: FactSheet, opts?: FormatFactSheetOpts): string {
  const leaf = !!opts?.writerLeaf;
  const lines: string[] = [
    'WORLD FACTS (this turn):',
    `Place: ${sheet.place.name}${sheet.place.position ? ` · standing on ${sheet.place.position}` : ''}${sheet.place.scale ? ` · ${sheet.place.scale}` : ''}.`,
  ];
  if (sheet.place.exits.length) lines.push(`Roads/exits: ${sheet.place.exits.join('; ')}.`);
  if (sheet.place.features.length) lines.push(`Features: ${sheet.place.features.join(', ')}.`);
  if (sheet.present.length) {
    lines.push(
      'Present:',
      ...sheet.present.map((p) => {
        const bits = [p.name, p.role, p.manner ? `manner ${p.manner}` : '', p.mannerCause ? `(${p.mannerCause})` : '']
          .filter(Boolean)
          .join(' · ');
        return `  - ${bits}`;
      })
    );
  } else {
    lines.push('Present: nobody named.');
  }
  if (sheet.openLedger.length) {
    lines.push('Open ledger:', ...sheet.openLedger.map((e) => `  - [${e.kind}] ${e.line}`));
  }
  const worn = sheet.gear.worn.length ? sheet.gear.worn.join(', ') : 'none';
  const carry = sheet.gear.carrying.length ? sheet.gear.carrying.join(', ') : 'none';
  lines.push(
    `PC gear: in hand ${sheet.gear.inHand}; worn ${worn}; carrying ${carry}${sheet.gear.gold != null ? `; gold ${sheet.gear.gold}` : ''}.`
  );
  lines.push(`Beat: ${sheet.beat.verb} → ${sheet.beat.outcome}.`);
  // T10TURNS — leaf owns the long ENGINE RESULT (required fact); keep short form only off the leaf path.
  if (sheet.beat.engineResult && !leaf) {
    lines.push(`ENGINE RESULT: ${sheet.beat.engineResult}`);
  }
  for (const s of sheet.beat.steps) {
    if (s.outcome === 'engine' || s.detail === sheet.beat.engineResult) continue;
    lines.push(`  step: ${s.outcome}${s.detail ? ` — ${s.detail}` : ''}`);
  }
  if (sheet.quests.length) {
    lines.push(
      'Quests:',
      ...sheet.quests.map((q) => `  - ${q.title} (${q.status})${q.step ? `: ${q.step}` : ''}`)
    );
  }
  // Discovery timeline — WORLD FACTS is the sole writer owner (INFO SHEET LAST ≠ this).
  if (sheet.recent.length) {
    lines.push('Recent timeline:', ...sheet.recent.map((r) => `  - ${r}`));
  }
  if (sheet.stallPressure) {
    // T10DIR2 — stall development is a Must-narrate ledger fact (same path as other engine acts).
    const stall = /^Must narrate:/i.test(sheet.stallPressure)
      ? sheet.stallPressure
      : `Must narrate: ${sheet.stallPressure}`;
    lines.push(`World pressure (must show this beat):\n${stall}`);
  }
  lines.push(
    '',
    // T10ECHO — UI already shows the typed line; do not put act wording in writer input at all.
    'PLAYER (attempts and claims; NOT facts — already shown in UI; do not restate; write the consequence):',
    `  typed: (already shown in UI — do not restate)`,
    ...(sheet.player.claimsNotTrue.length
      ? sheet.player.claimsNotTrue.map((c) => `  claims_not_true: ${c}`)
      : ['  claims_not_true: (none)']),
    '',
    'SETTINGS:',
    '(reserved — order 6b)'
  );
  return lines.join('\n');
}

/** Attach + format helper used by the writer leaf. */
export function writerFactSheetText(
  state: GameState,
  packet: CompletedEventPacket,
  playerInput?: string
): { sheet: FactSheet; text: string; hash: string } {
  const sheet = buildFactSheet(state, packet, playerInput);
  return { sheet, text: formatFactSheetForWriter(sheet), hash: hashFactSheet(sheet) };
}
