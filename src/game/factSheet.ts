/**
 * M1 — one typed per-turn FactSheet the writer receives.
 * Port of the engine-first idea in docs/orders/merge/proto/engine.mjs factSheet() (reference only).
 * Display names only: no engine ids, internal keys, or ledger chrome labels reach this sheet.
 * Settings block is a reserved empty slot for order 6b.
 */

import type { GameState } from './types';
import type { CompletedEventPacket } from './completedEventPacket';
import { playerFacingLocation } from './locationName';
import { presentNpcRecords } from './npcRecords';
import { openCommitmentsFor, commitmentLine } from './stateTx';
import { sheetExitNames, weaponInHand } from './infoSheet';
import { writerFacts } from './systemHousing';
import { activeHereSpot } from './hereSpot';
import { placeScale } from './placeAuthority';

/** One person here, for the writer: display name + manner only. */
export interface FactSheetPerson {
  name: string;
  role?: string;
  /** Stance/manner toward the player (display word). */
  manner?: string;
  /** Why they are that way, when the engine recorded a cause. */
  mannerCause?: string;
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
  /** Reserved for order 6b — do not fill here. */
  settingsSlot: null;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const norm = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();

function questHidden(state: GameState): boolean {
  return state.engineMode === 'dnd';
}

function mannerOf(m: { stance?: { now?: string; cause?: string }; disposition?: string }): {
  manner?: string;
  mannerCause?: string;
} {
  if (m.stance?.now) return { manner: m.stance.now, mannerCause: m.stance.cause };
  if (m.disposition && m.disposition !== 'neutral') return { manner: m.disposition };
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

function gearOf(state: GameState): FactSheetGear {
  const kit = writerFacts(state);
  const worn = kit.carried.filter((i) => i.equipped).map((i) => i.name);
  const carrying = kit.carried.filter((i) => !i.equipped).map((i) => i.name);
  return {
    worn,
    carrying: carrying.slice(0, 12),
    inHand: weaponInHand(state),
    gold: typeof state.gold === 'number' ? state.gold : undefined,
  };
}

function beatSteps(packet: CompletedEventPacket): FactSheetBeatStep[] {
  const steps: FactSheetBeatStep[] = [];
  steps.push({ outcome: packet.outcome, detail: `${packet.verb}${packet.target ? ` → ${packet.target}` : ''}` });
  if (packet.engineResult) steps.push({ outcome: 'engine', detail: packet.engineResult });
  if (packet.movement) steps.push({ outcome: 'moved', detail: packet.movement });
  if (packet.justKilled && packet.lastKill?.name) {
    steps.push({ outcome: 'killed', detail: packet.lastKill.name });
  }
  if (packet.xp > 0) steps.push({ outcome: 'xp', detail: String(packet.xp) });
  for (const g of packet.gates ?? []) steps.push({ outcome: 'lock', detail: g });
  return steps;
}

/**
 * Player claims the world does not confirm. M2 (intentParser) fills this; M1 keeps the slot and
 * any claims already stamped on the completed-event extras / packet talk fields.
 */
function claimsNotTrue(_state: GameState, _typed: string): string[] {
  return [];
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
    const { manner, mannerCause } = mannerOf(r);
    return {
      name: r.npcName,
      role: r.sheet?.job || r.roleHint || undefined,
      manner,
      mannerCause: mannerCause ? clip(mannerCause, 100) : undefined,
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
  const features = [
    ...(state.sceneFacts?.props ?? []).slice(0, 6),
    ...(packet.focusNoun ? [packet.focusNoun] : []),
  ]
    .map(norm)
    .filter(Boolean)
    .filter((n, i, a) => a.findIndex((x) => x.toLowerCase() === n.toLowerCase()) === i);

  return {
    turn: packet.turn ?? state.turn ?? 0,
    place: {
      name: placeName,
      position: spot?.spot,
      scale: placeScale(state) ?? undefined,
      exits: sheetExitNames(state),
      features,
    },
    present,
    openLedger,
    gear: gearOf(state),
    beat: {
      verb: packet.verb,
      outcome: packet.outcome,
      engineResult: packet.engineResult,
      steps: beatSteps(packet),
    },
    player: {
      typed: clip(typed, 300),
      claimsNotTrue: claimsNotTrue(state, typed),
    },
    quests: questRows(state),
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
 * Writer-facing text: one FACTS block. No second context.
 * Settings slot left as a blank header for 6b.
 */
export function formatFactSheetForWriter(sheet: FactSheet): string {
  const lines: string[] = [
    'FACTS (engine-committed for this beat — every factual statement must come from here):',
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
  if (sheet.beat.engineResult) {
    lines.push(
      `ENGINE RESULT (required fact — already settled; write as finished, never restart it): ${sheet.beat.engineResult}`
    );
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
  lines.push(
    '',
    'PLAYER (attempts and claims; NOT facts):',
    `  typed: ${sheet.player.typed || '(none)'}`,
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
