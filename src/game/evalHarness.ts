/**
 * Wave 4 (B029–B033, B037–B040) — clean eval infrastructure under manifest.
 */

import type { GameState } from './types';
import type { RunSummary, TurnTelemetry } from './fateAutoplay';
import { BUILD_STAMP } from './runManifest';
import { verifyReplayChain, hashCanonicalState } from './replayHash';
import { countRunReceipts } from './receiptTelemetry';

export interface EvalQuarantineFlags {
  criticContamination: boolean;
  manifestMismatch: boolean;
  replayHashFail: boolean;
  livenessGateFail: boolean;
  reasons: string[];
}

export interface EvalHarnessResult {
  manifestBound: boolean;
  replayVerified: boolean;
  finalReplayHash: string;
  livenessGates: Record<string, boolean>;
  quarantine: EvalQuarantineFlags;
  cleanForAggregate: boolean;
}

/** Receipt liveness gates for summary (B043 telemetry + B037 hard gates). */
export function checkReceiptLivenessGates(state: GameState): Record<string, boolean> {
  const turn = state.turn;
  const mode = state.engineMode;
  const receipts = countRunReceipts(state);
  const committed = state.arcDirector?.committedBeatIds ?? [];
  const gates: Record<string, boolean> = {};

  if (mode === 'litrpg' || mode === 'dnd') {
    const combatCommitted = committed.some((id) => id.includes('skirmish') || id.includes('hostility'));
    gates.combatByT8 = turn < 8 || receipts.combat >= 1 || combatCommitted || !!state.activeEncounter;
    gates.combatByT15 = turn < 15 || receipts.combat >= 1 || combatCommitted;
  }
  if (mode === 'pyoa') {
    gates.crisisByT12 =
      turn < 12 ||
      receipts.crisis >= 1 ||
      committed.some((id) => id.includes('crisis'));
  }
  gates.beatCommitByT20 = turn < 20 || receipts.beatCommit >= 1;
  return gates;
}

const CRITIC_BLEED_PATTERNS: Array<{ pattern: RegExp; allowedBibles: RegExp }> = [
  { pattern: /\bLowmarket\b/i, allowedBibles: /summoned|hero|gatebreak|system|ascending|fabled|inkbound|void|hollow|dungeon/i },
  { pattern: /\bFather Aldous\b/i, allowedBibles: /cursed|keep/i },
  { pattern: /\bGreyhollow\b/i, allowedBibles: /thornferry|pyoa/i },
];

export function detectCriticContamination(telemetry: TurnTelemetry[], bibleId: string): boolean {
  for (const t of telemetry) {
    for (const { pattern, allowedBibles } of CRITIC_BLEED_PATTERNS) {
      if (pattern.test(t.gmText) && !allowedBibles.test(bibleId)) {
        return true;
      }
    }
  }
  return false;
}

export function validateEvalRun(
  state: GameState,
  summary: RunSummary,
  telemetry: TurnTelemetry[]
): EvalHarnessResult {
  const reasons: string[] = [];
  const manifestBound = summary.runManifest?.buildStamp === BUILD_STAMP;
  if (!manifestBound) {
    reasons.push(`manifest stamp ${summary.runManifest?.buildStamp ?? 'missing'} != ${BUILD_STAMP}`);
  }

  const replayRecords = state.replayHashes ?? [];
  const chain = verifyReplayChain(replayRecords);
  const replayVerified = chain.ok;
  if (!replayVerified) reasons.push(...chain.errors);

  const livenessGates = checkReceiptLivenessGates(state);
  const livenessGateFail = Object.entries(livenessGates).some(([, v]) => !v);
  if (livenessGateFail) {
    reasons.push(`liveness gates failed: ${JSON.stringify(livenessGates)}`);
  }

  const criticContamination = detectCriticContamination(telemetry, summary.bibleId);
  if (criticContamination) reasons.push('critic contamination suspected (cross-bible bleed)');

  const quarantine: EvalQuarantineFlags = {
    criticContamination,
    manifestMismatch: !manifestBound,
    replayHashFail: !replayVerified,
    livenessGateFail,
    reasons,
  };

  return {
    manifestBound,
    replayVerified,
    finalReplayHash: hashCanonicalState(state),
    livenessGates,
    quarantine,
    cleanForAggregate: reasons.length === 0,
  };
}
