/**
 * ChoiceCompiler — legal beat edges + semantic fingerprint cooldown (Wave 2 MVP).
 */

import type { GameState } from './types';
import { canonicalizeIntent } from './semanticLoopDetector';
import { filterCooldownChoices, type OptionCooldown } from './optionDiversityContract';
import { isTopicExhausted } from './npcTopicFsm';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { enumerateLegalEdges, edgesToChoiceLabels } from './choiceEdge';

export type ChoiceFingerprintFamily =
  | 'walk_away'
  | 'inspect'
  | 'charter'
  | 'gate_queue'
  | 'wait'
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
  return 'generic';
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

  let filtered = choices.filter((c) => {
    const family = classifyChoiceFamily(c);
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
        supplements.push('Press the attack', 'Try to flee', 'Parley');
      } else if (mandate.includes('crisis') || state.engineMode === 'pyoa') {
        supplements.push('Choose the risky fork', 'Buy time', 'Call for help');
      } else if (state.engineMode === 'litrpg') {
        supplements.push('Check Status', 'Ask what they want', 'Scout the exit');
      } else {
        supplements.push('Ask a direct question', 'Change position', 'Wait and watch');
      }
    }
    for (const s of supplements) {
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
