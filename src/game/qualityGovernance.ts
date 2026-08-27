/**
 * P0+P1 quality governance — wires Manus-calibrated modules into the live turn pipeline.
 * Extended 2026-08-28a: ArcDirector authority + ChoiceCompiler delegation.
 */

import type { GameState } from './types';
import { buildArcDirectorSnapshotLines, applyArcDirectorCommit } from './arcDirector';
import { compileChoices } from './choiceCompiler';
import { formatPressureClockSnippet } from './pressureClock';
import { hasActiveObjectives, initProgressGovernor, updateProgressGovernor } from './forwardProgressGovernor';
import {
  detectSemanticLoop,
  buildEscalationResponse,
  formatEscalationMandate,
} from './semanticLoopDetector';
import {
  extractEntityContext,
  validateEntityReferences,
  validateChoiceReference,
  rewriteInvalidReferences,
} from './typedEntityValidator';
import {
  filterCooldownChoices,
  updateCooldowns,
  checkDiversityContract,
  getDiversityContract,
  buildChoiceProfiles,
  type OptionCooldown,
} from './optionDiversityContract';
import {
  buildQuestSchema,
  formatQuestPressureMandate,
} from './questCompletionSchema';
import {
  shouldTriggerEncounter,
  buildEncounterSpec,
  formatEncounterInitiation,
} from './encounterResolution';
import {
  buildVoiceCadence,
  buildVoiceAsides,
  formatVoiceCadenceDirective,
  shouldSuppressTone,
  type VoicePersonality,
} from './voiceCadenceSystem';
import {
  detectMetaComplaint,
  buildRecoveryAction,
  initNoveltyBudget,
  checkParagraphNovelty,
  updateNoveltyBudget,
  type NarrativeNoveltyBudget,
} from './metaInputRecovery';
import {
  calculateDiscoveryXp,
  updateDiscoveryLedger,
  type DiscoveryRecord,
} from './discoveryXpLedger';
import { validateInventoryChanges, buildInventoryAuthority } from './inventoryConservation';
import { resolveVoiceIdForState } from './gmVoiceProfile';

export interface QualityGovernanceState {
  turnsSinceLastEncounter?: number;
  lastHubLocation?: string;
  metaRecoveryTurn?: number;
  optionCooldowns?: Record<string, OptionCooldown>;
  discoveryLedger?: Record<string, DiscoveryRecord>;
  noveltyBudget?: {
    recentSentences: Record<string, number>;
    recentParagraphs: Record<string, number>;
    bannedTopics: string[];
  };
  recoveryMandate?: string;
  recentXpAwards?: Array<{ amount: number; reason: string; type: string; turn: number }>;
}

function qg(state: GameState): QualityGovernanceState {
  return state.qualityGovernance ?? {};
}

function cooldownMap(state: GameState): Map<string, OptionCooldown> {
  return new Map(Object.entries(qg(state).optionCooldowns ?? {}));
}

function ledgerMap(state: GameState): Map<string, DiscoveryRecord> {
  return new Map(Object.entries(qg(state).discoveryLedger ?? {}));
}

function noveltyFromState(state: GameState): NarrativeNoveltyBudget {
  const raw = qg(state).noveltyBudget;
  if (!raw) return initNoveltyBudget();
  return {
    recentSentences: new Map(Object.entries(raw.recentSentences ?? {})),
    recentParagraphs: new Map(Object.entries(raw.recentParagraphs ?? {})),
    bannedTopics: new Set(raw.bannedTopics ?? []),
  };
}

function noveltyToRecord(budget: NarrativeNoveltyBudget): QualityGovernanceState['noveltyBudget'] {
  return {
    recentSentences: Object.fromEntries(budget.recentSentences),
    recentParagraphs: Object.fromEntries(budget.recentParagraphs),
    bannedTopics: [...budget.bannedTopics],
  };
}

function resolveVoicePersonality(state: GameState): VoicePersonality {
  const id = resolveVoiceIdForState(state);
  const map: Record<string, VoicePersonality> = {
    'cold-registrar': 'cold-registrar',
    'sarcastic-patch': 'sarcastic-patch',
    'army-quartermaster': 'army-quartermaster',
    'friendly-system': 'friendly-system',
    'cozy-brutal': 'cozy-brutal',
    'dry-wit': 'dry-wit',
    theatrical: 'theatrical',
    chilled: 'chilled',
    'fireside-chronicler': 'fireside-chronicler',
    'mission-lead': 'mission-lead',
    'friendly-guide': 'friendly-guide',
  };
  return map[id] ?? 'friendly-guide';
}

/** SNAPSHOT / situation-packet mandate lines (P0.0, P0.2, P1.1–P1.4). */
export function buildGovernanceSnapshotLines(state: GameState): string[] {
  const lines: string[] = [];
  const recovery = qg(state).recoveryMandate;
  if (recovery?.trim()) {
    lines.push(recovery.trim());
  }

  const loop = detectSemanticLoop(state);
  const activeObjective = hasActiveObjectives(state);
  if (loop.isLoop) {
    const escalation = buildEscalationResponse(loop, state.engineMode, activeObjective);
    if (escalation) {
      lines.push(formatEscalationMandate(escalation));
    }
  }

  const turnsSinceEncounter = qg(state).turnsSinceLastEncounter ?? state.turn;
  const encounterCheck = shouldTriggerEncounter(state, loop, turnsSinceEncounter);
  if (encounterCheck.shouldTrigger && encounterCheck.trigger && encounterCheck.type) {
    const spec = buildEncounterSpec(encounterCheck.trigger, encounterCheck.type, state);
    lines.push(formatEncounterInitiation(spec, state));
  }

  const activeQuests = (state.quests ?? []).filter(
    (q) => (q.status === 'active' || q.status === 'available') && q.revealed
  );
  const questSchemas = activeQuests.slice(0, 2).map((q) => buildQuestSchema(q, state));
  const questMandate = formatQuestPressureMandate(questSchemas, state.turn);
  if (questMandate) lines.push(questMandate);

  for (const arcLine of buildArcDirectorSnapshotLines(state)) {
    if (arcLine.trim()) lines.push(arcLine);
  }
  const pressure = formatPressureClockSnippet(state);
  if (pressure) lines.push(pressure);

  const personality = resolveVoicePersonality(state);
  const cadence = buildVoiceCadence(personality);
  const asides = buildVoiceAsides(personality);
  const lastGm = [...(state.log ?? [])].reverse().find((e) => e.role === 'gm')?.content ?? '';
  const suppression = shouldSuppressTone(state, lastGm);
  lines.push(formatVoiceCadenceDirective(cadence, suppression, asides));

  return lines;
}

/** Pre-GM: meta complaints → one-turn recovery mandate. */
export function processMetaInput(state: GameState, input: string): {
  state: GameState;
  handled: boolean;
} {
  const complaint = detectMetaComplaint(input);
  if (!complaint) return { state, handled: false };

  const prev = qg(state);
  if (prev.metaRecoveryTurn === state.turn) {
    return { state, handled: false };
  }

  const recovery = buildRecoveryAction({ ...complaint, turn: state.turn }, state);
  return {
    state: {
      ...state,
      qualityGovernance: {
        ...prev,
        metaRecoveryTurn: state.turn,
        recoveryMandate: recovery.recoveryPrompt,
      },
    },
    handled: recovery.action === 'regenerate_options' || recovery.action === 'clarify_scene',
  };
}

/** Post-GM prose scrub (P0.1). */
export function applyGovernanceToProse(state: GameState, prose: string): {
  prose: string;
  notes: string[];
} {
  const notes: string[] = [];
  const context = extractEntityContext(state);
  const report = validateEntityReferences(prose, context);
  let out = prose;

  if (report.shouldRegenerate || report.themCount + report.strangerCount + report.thisPlaceCount > 0) {
    out = rewriteInvalidReferences(out, context, report);
    if (report.themCount) notes.push(`Entity scrub: them×${report.themCount}`);
    if (report.strangerCount) notes.push(`Entity scrub: stranger×${report.strangerCount}`);
    if (report.thisPlaceCount) notes.push(`Entity scrub: this-place×${report.thisPlaceCount}`);
  }

  const novelty = noveltyFromState(state);
  const clone = checkParagraphNovelty(out, novelty, state.turn);
  if (!clone.novel && clone.similarity != null) {
    notes.push(`Novelty: paragraph clone (${(clone.similarity * 100).toFixed(0)}% similar)`);
  }

  return { prose: out, notes };
}

/** Choice pad filter (P0.1, P0.3). */
export function filterGovernanceChoices(state: GameState, choices: string[]): {
  choices: string[];
  notes: string[];
} {
  const notes: string[] = [];
  const context = extractEntityContext(state);
  let filtered = choices.filter((c) => {
    const v = validateChoiceReference(c, context);
    if (!v.valid) {
      notes.push(`Rejected choice: ${c.slice(0, 40)} (${v.reason})`);
      return false;
    }
    return true;
  });

  const cooldownResult = filterCooldownChoices(filtered, state.turn, cooldownMap(state));
  if (cooldownResult.removed.length) {
    notes.push(`Cooldown removed ${cooldownResult.removed.length} pad(s)`);
  }
  filtered = cooldownResult.filtered;

  const compiled = compileChoices(state, filtered, Object.fromEntries(cooldownMap(state)));
  if (compiled.notes.length) {
    notes.push(...compiled.notes);
  }
  filtered = compiled.choices;

  const contract = getDiversityContract(state);
  const profiles = buildChoiceProfiles(filtered, state, state.turn + 1);
  const diversityViolations = checkDiversityContract(profiles, contract);
  if (diversityViolations.length && filtered.length > 3) {
    notes.push(`Diversity: ${diversityViolations.length} violation(s)`);
  }

  return { choices: filtered.length ? filtered : choices.slice(0, 3), notes };
}

export interface GovernanceCommitResult {
  patches: Partial<GameState>;
  xpAward?: { amount: number; reason: string };
  systemNotes: string[];
}

/** Post-commit state updates (P0.0, P0.3, P0.4, P1.1). */
export function applyGovernanceCommit(
  previous: GameState,
  next: GameState,
  playerInput: string
): GovernanceCommitResult {
  const systemNotes: string[] = [];
  const prevQg = qg(previous);
  const qualityGovernance: QualityGovernanceState = { ...prevQg };
  const gmProse = next.log?.filter((e) => e.role === 'gm').slice(-1)[0]?.content ?? '';

  qualityGovernance.recoveryMandate = undefined;

  const progressGovernor = updateProgressGovernor(
    previous,
    next,
    previous.progressGovernor ?? initProgressGovernor()
  );

  const offered = next.choices ?? [];
  const cooldowns = updateCooldowns(offered, next.turn, cooldownMap(previous));
  qualityGovernance.optionCooldowns = Object.fromEntries(cooldowns);

  const gmProseForNovelty = gmProse;
  const novelty = updateNoveltyBudget(gmProseForNovelty, next.turn, noveltyFromState(previous));
  qualityGovernance.noveltyBudget = noveltyToRecord(novelty);

  let xpAward: GovernanceCommitResult['xpAward'];
  const ledger = ledgerMap(previous);
  const discovery = calculateDiscoveryXp(playerInput, next, ledger);
  if (discovery && discovery.amount > 0) {
    xpAward = { amount: discovery.amount, reason: discovery.reason };
    const updatedLedger = updateDiscoveryLedger([discovery], next.turn, ledger);
    qualityGovernance.discoveryLedger = Object.fromEntries(updatedLedger);
    qualityGovernance.recentXpAwards = [
      ...(prevQg.recentXpAwards ?? []).slice(-99),
      { amount: discovery.amount, reason: discovery.reason, type: discovery.type, turn: next.turn },
    ];
  }

  const invAuth = buildInventoryAuthority(previous);
  const invCheck = validateInventoryChanges(
    invAuth,
    next.inventory ?? [],
    gmProse
  );
  if (!invCheck.valid && invCheck.violations.length) {
    systemNotes.push(`Inventory: blocked ${invCheck.violations.length} conservation violation(s)`);
  }

  const hub = next.currentLocation ?? '';
  if (hub && hub !== prevQg.lastHubLocation) {
    qualityGovernance.lastHubLocation = hub;
  }

  const hadEncounter =
    !!next.activeEncounter ||
    (previous.activeEncounter && !next.activeEncounter);
  qualityGovernance.turnsSinceLastEncounter = hadEncounter
    ? 0
    : (prevQg.turnsSinceLastEncounter ?? 0) + 1;

  const arcPatch = applyArcDirectorCommit(previous, next, next.choices ?? []);

  return {
    patches: {
      progressGovernor,
      qualityGovernance,
      ...arcPatch,
      ...(invCheck.valid ? {} : { inventory: previous.inventory }),
    },
    xpAward,
    systemNotes,
  };
}
