/**
 * ChoiceCompiler — legal beat edges + semantic fingerprint cooldown (Wave 2 MVP).
 */

import type { GameState } from './types';
import { canonicalizeIntent } from './semanticLoopDetector';
import { filterCooldownChoices, type OptionCooldown } from './optionDiversityContract';
import { isTopicExhausted } from './npcTopicFsm';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { enumerateLegalEdges, edgesToChoiceLabels } from './choiceEdge';
import { isEncounterEngaged, fleeAvailable, parleyAvailable } from './encounterTerminalFsm';
import { countPlayerIntentStreak, countLoiterFamilyStreak } from './beatFingerprint';
import { isPyoaBranchLocked } from './pyoaBranchLedger';

export type ChoiceFingerprintFamily =
  | 'walk_away'
  | 'inspect'
  | 'charter'
  | 'gate_queue'
  | 'wait'
  | 'travel'
  | 'generic';

export interface ChoiceFingerprintRecord {
  family: ChoiceFingerprintFamily;
  turn: number;
  count: number;
}

export interface GateDisposition {
  target: string;
  cooldownUntilTurn: number;
  kind: 'reject' | 'transform';
  message: string;
}

/** B024 — Hub gate disposition types */
export type HubGateType =
  | 'entrance'   // First arrival at hub
  | 'loiter'     // Standing around/waiting
  | 'vendor'     // Merchant/shop interaction
  | 'quest'      // Quest-related interaction
  | 'travel';    // Leaving hub

export interface HubBeatRecord {
  hubId: string;
  gateType: HubGateType;
  turn: number;
  count: number;
}

const HUB_BEAT_CAPS: Record<HubGateType, number> = {
  entrance: 1,   // Only arrive once
  loiter: 3,     // Max 3 wait/loiter beats
  vendor: 2,     // Max 2 merchant interactions
  quest: 999,    // Quest interactions unlimited
  travel: 999,   // Travel unlimited
};

const LITRPG_HUB_EXIT_DEADLINE = 50; // LitRPG must leave hub by turn 50 if loitering

const FAMILY_LIMIT = 3;
const FAMILY_WINDOW = 50;
const FAMILY_COOLDOWN = 8;

function classifyChoiceFamily(choice: string): ChoiceFingerprintFamily {
  const lower = choice.toLowerCase();
  if (/\b(walk away|leave|go another|step back)\b/.test(lower)) return 'walk_away';
  if (/\b(inspect|examine|check|study|investigate|look at)\b/.test(lower)) return 'inspect';
  if (/\b(charter|millstone)\b/.test(lower)) return 'charter';
  if (/\b(gate|queue|registration|registrar)\b/.test(lower)) return 'gate_queue';
  if (/\b(wait|stand around|do nothing)\b/.test(lower)) return 'wait';
  if (/\b(travel|go to|head to|move to)\b/.test(lower)) return 'travel';
  return 'generic';
}

function isStallFamily(family: ChoiceFingerprintFamily): boolean {
  return (
    family === 'wait' ||
    family === 'walk_away' ||
    family === 'inspect' ||
    family === 'gate_queue' ||
    family === 'travel'
  );
}

function fingerprintUsage(
  records: ChoiceFingerprintRecord[],
  family: ChoiceFingerprintFamily,
  turn: number
): number {
  return records.filter(
    (r) => r.family === family && turn - r.turn <= FAMILY_WINDOW
  ).reduce((s, r) => s + r.count, 0);
}

function familyOnCooldown(
  records: ChoiceFingerprintRecord[],
  family: ChoiceFingerprintFamily,
  turn: number
): boolean {
  const recent = records
    .filter((r) => r.family === family)
    .sort((a, b) => b.turn - a.turn);
  if (!recent.length) return false;
  const usage = fingerprintUsage(records, family, turn);
  if (usage < FAMILY_LIMIT) return false;
  const last = recent[0];
  return turn - last.turn < FAMILY_COOLDOWN;
}

export function updateChoiceFingerprints(
  choices: string[],
  turn: number,
  prev: ChoiceFingerprintRecord[] | undefined
): ChoiceFingerprintRecord[] {
  const records = [...(prev ?? [])].filter((r) => turn - r.turn <= FAMILY_WINDOW);
  for (const c of choices) {
    const family = classifyChoiceFamily(c);
    const idx = records.findIndex((r) => r.family === family && r.turn === turn);
    if (idx >= 0) {
      records[idx] = { ...records[idx], count: records[idx].count + 1 };
    } else {
      records.push({ family, turn, count: 1 });
    }
  }
  return records.slice(-40);
}

export interface CompileChoicesResult {
  choices: string[];
  notes: string[];
  gateBlocked?: GateDisposition;
}

function gateTravelTarget(input: string): string | null {
  const m = input.match(/(?:travel to|go to|head to|move to)\s+(?:the\s+)?(.+)/i);
  return m?.[1]?.trim().slice(0, 60) ?? null;
}

const GATE_TARGET_PATTERNS =
  /\b(gate|queue|circle|registrar|registration|sevenfold|palace approach|contract hall)\b/i;

/** B024 — Classify hub gate type from input */
export function classifyHubGate(input: string): HubGateType {
  const lower = input.toLowerCase();
  if (/\b(arrive|enter|approach|reach)\b/.test(lower)) return 'entrance';
  if (/\b(wait|stand|loiter|do nothing)\b/.test(lower)) return 'loiter';
  if (/\b(buy|sell|trade|merchant|shop|vendor)\b/.test(lower)) return 'vendor';
  if (/\b(quest|mission|ask about|talk to)\b/.test(lower)) return 'quest';
  if (/\b(travel|leave|go to|head to)\b/.test(lower)) return 'travel';
  return 'loiter'; // Default to loiter
}

/** B024 — Check hub beat cap exhaustion */
export function isHubBeatCapped(
  state: GameState,
  hubId: string,
  gateType: HubGateType
): boolean {
  const records = state.arcDirector?.hubBeatRecords ?? [];
  const count = records
    .filter(r => r.hubId === hubId && r.gateType === gateType)
    .reduce((sum, r) => sum + r.count, 0);
  return count >= HUB_BEAT_CAPS[gateType];
}

/** B024 — Record hub beat usage */
export function recordHubBeat(
  state: GameState,
  hubId: string,
  gateType: HubGateType
): GameState {
  const records = state.arcDirector?.hubBeatRecords ?? [];
  const existing = records.find(r => 
    r.hubId === hubId && r.gateType === gateType && r.turn === state.turn
  );
  
  let nextRecords: HubBeatRecord[];
  if (existing) {
    nextRecords = records.map(r =>
      r === existing ? { ...r, count: r.count + 1 } : r
    );
  } else {
    nextRecords = [
      ...records,
      { hubId, gateType, turn: state.turn, count: 1 }
    ].slice(-40); // Keep last 40 records
  }
  
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      hubBeatRecords: nextRecords,
    },
  };
}

/** B024 — Check if LitRPG hub exit deadline exceeded */
export function shouldForceLitrpgHubExit(state: GameState): boolean {
  if (state.engineMode !== 'litrpg') return false;
  
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
  if (!hub) return false;
  
  const records = state.arcDirector?.hubBeatRecords ?? [];
  const hubRecords = records.filter(r => r.hubId === hub.id);
  if (!hubRecords.length) return false;
  
  // Count non-travel beats
  const loiterBeats = hubRecords.filter(r => 
    r.gateType === 'loiter' || r.gateType === 'vendor'
  );
  const totalLoiter = loiterBeats.reduce((sum, r) => sum + r.count, 0);
  
  // Force exit if too much loitering
  if (totalLoiter >= 4 && state.turn >= LITRPG_HUB_EXIT_DEADLINE) {
    return true;
  }
  
  return false;
}

/** Gate disposition matrix (B024) — reject/transform hub gate travel loops. */
export function checkGateDisposition(
  state: GameState,
  playerInput: string
): GateDisposition | null {
  const target = gateTravelTarget(playerInput);
  if (!target) return null;
  const lower = target.toLowerCase();
  if (!GATE_TARGET_PATTERNS.test(lower)) return null;

  const gates = state.arcDirector?.gateDispositions ?? {};
  const key = lower.replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const until = gates[key];
  if (until != null && state.turn < until) {
    return {
      target,
      cooldownUntilTurn: until,
      kind: 'reject',
      message: `Gate queue cooling down — try a different route or talk to someone present (until T${until}).`,
    };
  }
  if (hubBeatExhausted(state, `Travel toward ${target}`)) {
    return {
      target,
      cooldownUntilTurn: state.turn + 8,
      kind: 'transform',
      message: `Hub beats exhausted at this location — pick a crisis fork or talk path instead of ${target}.`,
    };
  }
  
  // B024 — Check typed gate caps
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
  if (hub) {
    const gateType = classifyHubGate(playerInput);
    if (isHubBeatCapped(state, hub.id, gateType)) {
      return {
        target,
        cooldownUntilTurn: state.turn + 6,
        kind: 'transform',
        message: `Hub ${gateType} beats capped — try a different action or leave this location.`,
      };
    }
  }
  
  return null;
}

export function recordGateRejection(state: GameState, target: string): GameState {
  const key = target.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const cooldownUntilTurn = state.turn + 6;
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      gateDispositions: {
        ...(state.arcDirector?.gateDispositions ?? {}),
        [key]: cooldownUntilTurn,
      },
    },
  };
}

function hubBeatExhausted(state: GameState, choice: string): boolean {
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
  if (!hub) return false;
  const keys = state.sandboxAwardKeys ?? [];
  const hubBeatKeys = keys.filter((k) => k.startsWith(`hub-beat:${hub.id}:`));
  if (hubBeatKeys.length < 2) return false;
  const lower = choice.toLowerCase();
  // I10 — after two hub beats at this hub, drop repeat travel/queue pads.
  if (/\b(gate|queue|registration|travel toward|return to)\b/.test(lower)) {
    return true;
  }
  return false;
}

/** Filter/supplement choice pad from legal edges + fingerprint cooldown. */
export function compileChoices(
  state: GameState,
  choices: string[],
  optionCooldowns?: Record<string, OptionCooldown>
): CompileChoicesResult {
  const notes: string[] = [];
  const turn = state.turn;
  const fingerprints = state.arcDirector?.choiceFingerprints ?? [];
  const cooldownMap = new Map(Object.entries(optionCooldowns ?? state.qualityGovernance?.optionCooldowns ?? {}));
  const legalEdges = enumerateLegalEdges(state);
  const edgeLabels = edgesToChoiceLabels(legalEdges);

  const engaged = isEncounterEngaged(state);
  const streak = countPlayerIntentStreak(state);
  const loiter = countLoiterFamilyStreak(state);
  const hardStreak = streak.count >= 5 && streak.key !== 'empty';
  const hardLoiter = loiter.count >= 4 && loiter.key === 'loiter';
  const stallInterrupt = hardStreak || hardLoiter;
  const pyoaLocked = state.engineMode === 'pyoa' && isPyoaBranchLocked(state);
  let filtered = choices.filter((c) => {
    const lower = c.toLowerCase();
    if (pyoaLocked && /\b(buy time|call for help|wait and watch|wait)\b/.test(lower)) {
      notes.push(`Branch lock drop: ${c.slice(0, 32)}`);
      return false;
    }
    if (engaged) {
      // 29a combat pad lock — no travel / merchant / Earth junk / generic hub inspect
      if (/\b(travel toward|go to|head to|browse|merchant|shop|earth junk|phone|headphones|leatherman|keys from earth)\b/.test(lower)) {
        notes.push(`Encounter lock: ${c.slice(0, 32)}`);
        return false;
      }
      if (/\b(inspect|examine|check|study)\b/.test(lower) && !/\b(enemy|threat|wraith|hunter|wound|blade|guard|raider|bandit)\b/.test(lower)) {
        notes.push(`Encounter lock inspect: ${c.slice(0, 32)}`);
        return false;
      }
      if (/\b(flee|run away|escape|retreat)\b/.test(lower) && !fleeAvailable(state.activeEncounter)) {
        notes.push('Flee exhausted');
        return false;
      }
      if (/\b(parley|negotiate)\b/.test(lower) && !parleyAvailable(state.activeEncounter)) {
        notes.push('Parley exhausted');
        return false;
      }
    }
    const family = classifyChoiceFamily(c);
    // 29b/29c — hard same-action + loiter interrupt: strip stall/travel families
    if (stallInterrupt && isStallFamily(family)) {
      notes.push(`Streak interrupt drop: ${family}`);
      return false;
    }
    if (family !== 'generic' && familyOnCooldown(fingerprints, family, turn)) {
      notes.push(`Cooldown family: ${family}`);
      return false;
    }
    // Drop exhausted inspect targets
    const intent = canonicalizeIntent(c, turn);
    if (intent.action === 'inspect' && intent.target) {
      const ledger = state.qualityGovernance?.discoveryLedger ?? {};
      const evidenceKey = `object:${intent.target.toLowerCase()}@${(state.currentLocation ?? 'unknown').toLowerCase()}`;
      if (ledger[evidenceKey]?.inspectionCount >= 1) {
        notes.push(`Inspect exhausted: ${intent.target}`);
        return false;
      }
    }
    if (hubBeatExhausted(state, c)) {
      notes.push(`Hub beat exhausted: ${c.slice(0, 32)}`);
      return false;
    }
    return true;
  });

  if (stallInterrupt) {
    notes.push(
      hardLoiter
        ? `Hard loiter interrupt: ×${loiter.count}`
        : `Hard streak interrupt: ${streak.key}×${streak.count}`
    );
  }

  const cooldownResult = filterCooldownChoices(filtered, turn, cooldownMap);
  filtered = cooldownResult.filtered;
  if (cooldownResult.removed.length) {
    notes.push(`Pad cooldown removed ${cooldownResult.removed.length}`);
  }

  // B018–B021 — pad primarily from legal beat edges when available
  if (legalEdges.length >= 3) {
    for (const label of edgeLabels) {
      if (filtered.some((f) => f.toLowerCase() === label.toLowerCase())) continue;
      filtered.push(label);
      if (filtered.length >= 6) break;
    }
    notes.push(`Legal edges: ${legalEdges.length}`);
  } else if (filtered.length < 3) {
    const supplements: string[] = [];
    for (const label of edgeLabels) {
      if (!filtered.some((f) => f.toLowerCase() === label.toLowerCase())) {
        supplements.push(label);
      }
    }
    if (!supplements.length) {
      const mandate = state.arcDirector?.lastMandate ?? '';
      if (state.activeEncounter) {
        supplements.push('Press the attack');
        if (fleeAvailable(state.activeEncounter)) supplements.push('Try to flee');
        if (parleyAvailable(state.activeEncounter)) supplements.push('Parley');
      } else if (mandate.includes('crisis') || state.engineMode === 'pyoa') {
        if (pyoaLocked) {
          supplements.push('Choose the risky fork', 'Face the crisis now', 'Press for leverage');
        } else {
          supplements.push('Choose the risky fork', 'Buy time', 'Call for help');
        }
      } else if (state.engineMode === 'litrpg') {
        supplements.push('Check Status', 'Ask what they want', 'Scout the exit');
      } else if (stallInterrupt) {
        // 29b/29c — no wait/walk-away/travel refill under hard streak/loiter
        supplements.push('Ask a direct question', 'Press for leverage', 'Scout the exit');
      } else {
        supplements.push('Ask a direct question', 'Change position', 'Wait and watch');
      }
    }
    for (const s of supplements) {
      if (stallInterrupt) {
        const fam = classifyChoiceFamily(s);
        if (isStallFamily(fam)) continue;
      }
      if (!filtered.some((f) => f.toLowerCase() === s.toLowerCase())) {
        filtered.push(s);
      }
      if (filtered.length >= 3) break;
    }
    notes.push(supplements.length ? 'Supplemented from edges/fallback' : 'Supplemented legal beat edges');
  }

  return {
    choices: filtered.length ? filtered.slice(0, 6) : edgeLabels.slice(0, 3),
    notes,
  };
}

export function playerInputGateBlock(
  state: GameState,
  input: string
): { blocked: boolean; message?: string; state: GameState } {
  const gate = checkGateDisposition(state, input);
  if (!gate) return { blocked: false, state };
  const next = recordGateRejection(state, gate.target);
  return { blocked: true, message: gate.message, state: next };
}
