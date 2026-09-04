/**
 * P0+P1 quality governance — wires Manus-calibrated modules into the live turn pipeline.
 * Extended 2026-08-28a: ArcDirector authority + ChoiceCompiler delegation.
 */

import type { GameState } from './types';
import {
  applyCraftLearning,
  compileCraftRules,
  consumeThumbsDownSignal,
  proseIgnoresCraft,
  stampCraftApplied,
  type CraftSignal,
} from './craftBookCompiler';
import { isDeniedPcName } from './pcNameAuthority';
import { detectHookContradiction, resolveHookLock } from './hookLock';
import { buildArcDirectorSnapshotLines, applyArcDirectorCommit } from './arcDirector';
import { compileChoices } from './choiceCompiler';
import { closedUniverseFallbacks, excludedPadFamilies, isExcludedPadLabel } from './padUniverse';
import { formatPressureClockSnippet } from './pressureClock';
import { hasActiveObjectives, initProgressGovernor, updateProgressGovernor } from './forwardProgressGovernor';
import {
  detectSemanticLoop,
  buildEscalationResponse,
  formatEscalationMandate,
  playerAsksRepeat,
  filterRecycledStallChoices,
  detectLeadingCollage,
  stripRecycledPrefix,
  recentGmBeatTexts,
  detectAtmosphereReprint,
  detectSameRoomEssayHard,
} from './semanticLoopDetector';
import { classifyBeatCommit, repairRejectedBeat, codedSceneMove, isVerbatimStallStub, isDirectorChromeLeak, scrubDirectorChrome, isStitchBankFingerprint, isTokenSaladLeak } from './beatCommitGate';
import { hasNumberedChoiceLeak, hasQuestTrackerLeak, stripChoiceList } from './parser';
import { hasCombatSpawnLogInBody } from './combatAuthority';
import { detectHubRoleMadlib } from './chromeAuthority';
import { isBannedFallbackStub } from './sealedManifest';
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
  buildAuthorityVoiceHint,
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
  isDiscoveryExhausted,
  type DiscoveryRecord,
} from './discoveryXpLedger';
import { validateInventoryChanges, buildInventoryAuthority } from './inventoryConservation';
import { resolveVoiceIdForState } from './gmVoiceProfile';
import {
  checkNpcRoleDeadlines,
  formatNpcExitMandate,
  trackNpcRoleObligation,
} from './npcTopicFsm';
import {
  recordHubBeat,
  classifyHubGate,
  shouldForceLitrpgHubExit,
} from './choiceCompiler';
import {
  cleanupBranchMemoryAtConvergence,
  formatConvergenceMandate,
} from './pyoaBranchLedger';
import { hubsForBibleId, matchHub } from './outdoorHubs';
// WS-2 Wave C: NPC Memory Validation
import {
  verifyMemoryGrounding,
  type MemoryGroundingCheck,
} from './npcMemoryRetrieval';
// WS-4 Wave D: Encounter Receipts
import {
  checkDrought as checkEncounterDrought,
} from './encounterDensity';
// WS-5 Wave B: Branch Lock Enforcement
import {
  getPendingConsequences,
} from './pyoaDelayedConsequences';
// WS-6 Wave C: Exhaustion Gates
import {
  checkDurableDeltaTiming,
  hasRepeatDominance,
  hasTerminalLoop,
  type ContentDensityState,
} from './exhaustionCurve';

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
  /** Last-turn craft flags (collage / atmosphere / name / pad / hook). */
  craftSignals?: CraftSignal[];
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

/** SNAPSHOT / situation-packet mandate lines (P0.0, P0.2, P1.1–P1.4, Wave 2). */
export function buildGovernanceSnapshotLines(state: GameState): string[] {
  const lines: string[] = [];
  const recovery = qg(state).recoveryMandate;
  if (recovery?.trim()) {
    lines.push(recovery.trim());
  }

  // B023 Wave 2 — NPC role deadlines
  const { exits } = checkNpcRoleDeadlines(state);
  if (exits.length > 0) {
    const exitMandate = formatNpcExitMandate(exits);
    if (exitMandate) lines.push(exitMandate);
  }

  // B024 Wave 2 — LitRPG hub exit deadline
  if (shouldForceLitrpgHubExit(state)) {
    lines.push(
      'HUB EXIT DEADLINE: LitRPG loiter threshold exceeded — force player to leave hub (travel, quest departure, or crisis).'
    );
  }

  // B025 Wave 2 — PYOA convergence
  const convergenceMandate = formatConvergenceMandate(state);
  if (convergenceMandate) {
    lines.push(convergenceMandate);
  }

  // WS-6 Wave C: Exhaustion gates
  if (state.arcDirector?.contentDensityState) {
    const densityState = state.arcDirector.contentDensityState;
    const droughtCheck = checkDurableDeltaTiming(densityState.densityEvents, 12);
    
    if (droughtCheck.isDrought) {
      lines.push(
        `DURABLE DELTA DROUGHT: ${droughtCheck.turnsSinceDurableDelta} turns without progress — force quest tick, clear, or level.`
      );
    }

    if (hasRepeatDominance(densityState.densityEvents, state.turn, 100)) {
      lines.push(
        'REPEAT DOMINANCE: >50% stale reuse — force unused content or exit to new location.'
      );
    }

    if (hasTerminalLoop(densityState.densityEvents)) {
      lines.push(
        'TERMINAL LOOP VIOLATION: Cannot revisit defeated boss/closed wing/ended crisis — hard block.'
      );
    }

    if (densityState.exhaustionPressure === 'RED' || densityState.exhaustionPressure === 'ORANGE') {
      lines.push(
        `EXHAUSTION ${densityState.exhaustionPressure}: ${densityState.recommendedIntervention}`
      );
    }
  }

  // LAST PAD chip labels stay compiler-only (padUniverse / ChoiceCompiler / Fate).

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
  const authorityHint = buildAuthorityVoiceHint(state, personality);
  lines.push(formatVoiceCadenceDirective(cadence, suppression, asides, authorityHint));

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
export function applyGovernanceToProse(
  state: GameState,
  prose: string,
  playerInput = ''
): {
  prose: string;
  notes: string[];
  rejectClone?: boolean;
} {
  const notes: string[] = [];
  const context = extractEntityContext(state);
  const report = validateEntityReferences(prose, context);
  let out = prose;

  if (report.shouldRegenerate || report.themCount + report.strangerCount + report.thisPlaceCount > 0) {
    out = rewriteInvalidReferences(out, context, report);
    if (report.themCount) notes.push(`Entity scrub: them×${report.themCount} (pronouns kept — no kit rewrite)`);
    if (report.strangerCount) notes.push(`Entity scrub: stranger×${report.strangerCount}`);
    if (report.thisPlaceCount) notes.push(`Entity scrub: this-place×${report.thisPlaceCount}`);
  }

  // WS-2 Wave C: Verify memory grounding for present NPCs
  const presentNpcs = state.sceneFacts?.present?.filter(p => p && !/^(a|an|the|some)\s/i.test(p)) ?? [];
  if (presentNpcs.length > 0) {
    const npcMemories = state.arcDirector?.npcMemories ?? [];
    for (const npcId of presentNpcs) {
      const ledger = npcMemories.find(m => m.npcId === npcId);
      if (ledger) {
        const groundingCheck = verifyMemoryGrounding(out, ledger.memories);
        if (!groundingCheck.valid) {
          notes.push(`Memory grounding: ${npcId} — ${groundingCheck.errors.length} violation(s)`);
        }
        if (groundingCheck.warnings.length > 0) {
          notes.push(`Memory warning: ${npcId} — ${groundingCheck.warnings[0]}`);
        }
      }
    }
  }

  const novelty = noveltyFromState(state);
  const clone = checkParagraphNovelty(out, novelty, state.turn);
  let rejectClone = false;
  if (!clone.novel && clone.similarity != null) {
    notes.push(`Novelty: paragraph clone (${(clone.similarity * 100).toFixed(0)}% similar)`);
    if (!playerAsksRepeat(playerInput) && clone.similarity >= 0.85) {
      rejectClone = true;
      notes.push('Beat recycle reject');
    }
  }

  // Prefix / stitch collage — 30R whole-beat ≥0.85 misses recycled openings + new tails.
  if (!playerAsksRepeat(playerInput)) {
    const collage = detectLeadingCollage(out, recentGmBeatTexts(state));
    if (collage.hit && collage.tailHasNewContent) {
      const stripped = stripRecycledPrefix(out, collage);
      if (stripped !== out) {
        out = stripped;
        notes.push(
          collage.kind === 'stitch'
            ? 'Collage strip: stitch of prior beats'
            : 'Collage strip: recycled prefix'
        );
      }
    } else if (collage.hit) {
      rejectClone = true;
      notes.push('Collage reject: no new tail');
    }
    if (!rejectClone && detectAtmosphereReprint(out, recentGmBeatTexts(state))) {
      rejectClone = true;
      notes.push('Atmosphere reprint: same-room essay, no delta');
    }
    if (!rejectClone && detectSameRoomEssayHard(out, recentGmBeatTexts(state), playerInput)) {
      rejectClone = true;
      notes.push('Same-room essay HARD: loiter recycle without delta');
    }
  }

  // Batch F — CRAFT applied but Flash Lite ignored (boost + reject/stitch; Mid writer OFF).
  {
    const compiled = compileCraftRules(state, playerInput);
    if (compiled.replacedModeLine && compiled.ruleIds.length) {
      const ignore = proseIgnoresCraft(
        compiled.ruleIds,
        out,
        recentGmBeatTexts(state),
        compiled.when
      );
      if (ignore.ignored) {
        rejectClone = true;
        notes.push(`CRAFT ignore: ${ignore.ids.join(',')}`);
        const repaired = repairRejectedBeat(state, out, ['craft-ignore']);
        if (repaired.repaired) {
          out = repaired.prose;
          notes.push(...repaired.notes);
        }
      }
    }
  }

  const gate = classifyBeatCommit(state, out, playerInput);
  if (!gate.accept) {
    rejectClone = true;
    notes.push(`Commit gate: ${gate.reasons.join(',')}`);
    const repaired = repairRejectedBeat(state, out, gate.reasons);
    if (repaired.repaired) {
      out = repaired.prose;
      notes.push(...repaired.notes);
    }
  }

  // Batch E/G/U — never commit verbatim stall / director chrome / stitch bank as story.
  {
    const scrub = scrubDirectorChrome(out);
    if (scrub.scrubbed) {
      out = scrub.prose;
      notes.push('Director chrome scrubbed from prose');
      if (!out.trim() || isDirectorChromeLeak(out) || isVerbatimStallStub(out) || isStitchBankFingerprint(out)) {
        rejectClone = true;
        out = codedSceneMove(state);
        notes.push('Director/stitch chrome — coded scene move');
      }
    }
  }
  if (hasNumberedChoiceLeak(out)) {
    const stripped = stripChoiceList(out);
    if (stripped.trim().length >= 16) {
      out = stripped;
      notes.push('Choice leak stripped from GM body');
    }
    if (hasNumberedChoiceLeak(out)) {
      rejectClone = true;
      notes.push('Choice leak reject: numbered chip in GM body');
    }
  }
  if (hasQuestTrackerLeak(out)) {
    rejectClone = true;
    notes.push('Quest tracker leak reject');
    out = codedSceneMove(state);
  }
  if (hasCombatSpawnLogInBody(out) || detectHubRoleMadlib(out)) {
    rejectClone = true;
    notes.push('Spawn log / hub-role mad-lib reject');
    const repaired = repairRejectedBeat(state, out, ['recycle-without-delta']);
    if (repaired.repaired) out = repaired.prose;
  }
  if (isStitchBankFingerprint(out)) {
    rejectClone = true;
    notes.push('Stitch bank fingerprint reject');
    out = codedSceneMove(state);
  }
  if (isTokenSaladLeak(out)) {
    rejectClone = true;
    notes.push('Token-salad leak reject');
    out = codedSceneMove(state);
  }
  if (isBannedFallbackStub(out) || isVerbatimStallStub(out) || isDirectorChromeLeak(out) || isStitchBankFingerprint(out) || isTokenSaladLeak(out)) {
    rejectClone = true;
    notes.push('Banned stall/fallback/director/stitch stub — reject');
    out = codedSceneMove(state);
  }

  return { prose: out, notes, rejectClone };
}

export function collectCraftSignals(opts: {
  previous: GameState;
  prose: string;
  playerInput: string;
  notes?: string[];
  nextChoices?: string[];
}): CraftSignal[] {
  const found = new Set<CraftSignal>();
  const blob = (opts.notes ?? []).join('\n');
  if (/collage/i.test(blob)) found.add('collage');
  if (/atmosphere reprint|same-room essay/i.test(blob)) found.add('atmosphere');
  if (/CRAFT ignore/i.test(blob)) {
    found.add('atmosphere');
    found.add('collage');
  }
  if (/recycle pad|rejected choice/i.test(blob)) found.add('pad_irrelevant');

  const recent = recentGmBeatTexts(opts.previous);
  if (!playerAsksRepeat(opts.playerInput)) {
    const collage = detectLeadingCollage(opts.prose, recent);
    if (collage.hit) found.add('collage');
    if (detectAtmosphereReprint(opts.prose, recent)) found.add('atmosphere');
  }
  const nameToken = opts.playerInput.replace(/\s+/g, ' ').trim();
  if (nameToken && isDeniedPcName(nameToken)) found.add('name_deny');
  if (detectHookContradiction(opts.prose, resolveHookLock(opts.previous))) {
    found.add('hook_contradiction');
  }
  if (
    consumeThumbsDownSignal(opts.previous.turn)
    || (opts.previous.log ?? []).some((e) => e?.role === 'gm' && e.gmFeedback === 'down')
  ) {
    found.add('thumbs_down');
  }
  const lastOffered =
    [...(opts.previous.log ?? [])].reverse().find((e) => e?.role === 'gm')?.offeredChoices
    ?? opts.previous.choices
    ?? [];
  const nowPad = opts.nextChoices ?? [];
  const stall = (s: string) => /\b(wait|inspect|examine|look around|buy time)\b/i.test(s);
  if (lastOffered.filter(stall).length >= 2 && nowPad.filter(stall).length >= 2) {
    found.add('pad_irrelevant');
  }
  return [...found];
}

/** Choice pad filter (P0.1, P0.3). */
export function filterGovernanceChoices(
  state: GameState,
  choices: string[],
  playerInput = ''
): {
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

  const compiled = compileChoices(state, filtered, Object.fromEntries(cooldownMap(state)), playerInput);
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

  const recycled = filterRecycledStallChoices(filtered, state, playerInput);
  if (recycled.removed.length) {
    notes.push(`Recycle pad dropped ${recycled.removed.length}`);
    filtered = recycled.filtered;
  }

  filtered = filtered.filter((c) => !isExcludedPadLabel(c, excludedPadFamilies(state)));
  if (filtered.length) return { choices: filtered, notes };
  // 02i — never re-merge raw Travel/Leave from the pre-compile list
  const universe = closedUniverseFallbacks(state, excludedPadFamilies(state));
  return { choices: universe.slice(0, 3), notes };
}

export interface GovernanceCommitResult {
  patches: Partial<GameState>;
  xpAward?: { amount: number; reason: string };
  systemNotes: string[];
}

/** Post-commit state updates (P0.0, P0.3, P0.4, P1.1, Wave 2). */
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

  // B023 Wave 2 — Track NPC role obligations
  let nextWithNpc = trackNpcRoleObligation(next, '', playerInput);
  
  // B023 Wave 2 — Apply NPC exit deadlines
  const { state: afterExits, exits } = checkNpcRoleDeadlines(nextWithNpc);
  if (exits.length > 0) {
    systemNotes.push(`NPC exits: ${exits.join(', ')}`);
  }
  nextWithNpc = afterExits;

  // B024 Wave 2 — Record hub beat
  const hub = matchHub(hubsForBibleId(nextWithNpc.campaignBibleId), nextWithNpc.currentLocation);
  if (hub) {
    const gateType = classifyHubGate(playerInput);
    nextWithNpc = recordHubBeat(nextWithNpc, hub.id, gateType);
  }

  // B025 Wave 2 — Clean up branch memory at convergence
  nextWithNpc = cleanupBranchMemoryAtConvergence(nextWithNpc);

  const progressGovernor = updateProgressGovernor(
    previous,
    nextWithNpc,
    previous.progressGovernor ?? initProgressGovernor()
  );

  const offered = nextWithNpc.choices ?? [];
  const cooldowns = updateCooldowns(offered, nextWithNpc.turn, cooldownMap(previous));
  qualityGovernance.optionCooldowns = Object.fromEntries(cooldowns);

  const gmProseForNovelty = gmProse;
  const novelty = updateNoveltyBudget(gmProseForNovelty, nextWithNpc.turn, noveltyFromState(previous));
  qualityGovernance.noveltyBudget = noveltyToRecord(novelty);

  let xpAward: GovernanceCommitResult['xpAward'];
  const ledger = ledgerMap(previous);
  const discovery = calculateDiscoveryXp(playerInput, nextWithNpc, ledger);
  if (discovery && discovery.amount > 0) {
    const [typePart, ctxPart] = (discovery.discoveryKey ?? '').split('@');
    const [, target] = typePart.split(':');
    const type = typePart.split(':')[0] as import('./discoveryXpLedger').DiscoveryType;
    if (
      discovery.discoveryKey
      && isDiscoveryExhausted(target, type, ctxPart || 'unknown', ledger)
    ) {
      systemNotes.push(`Discovery blocked: ${discovery.reason} (evidence-id exhausted)`);
    } else {
      xpAward = { amount: discovery.amount, reason: discovery.reason };
      const updatedLedger = updateDiscoveryLedger([discovery], nextWithNpc.turn, ledger);
      qualityGovernance.discoveryLedger = Object.fromEntries(updatedLedger);
      qualityGovernance.recentXpAwards = [
        ...(prevQg.recentXpAwards ?? []).slice(-99),
        { amount: discovery.amount, reason: discovery.reason, type: discovery.type, turn: nextWithNpc.turn },
      ];
    }
  }

  const invAuth = buildInventoryAuthority(previous);
  const invCheck = validateInventoryChanges(
    invAuth,
    nextWithNpc.inventory ?? [],
    gmProse
  );
  if (!invCheck.valid && invCheck.violations.length) {
    systemNotes.push(`Inventory: blocked ${invCheck.violations.length} conservation violation(s)`);
  }

  const hubLoc = nextWithNpc.currentLocation ?? '';
  if (hubLoc && hubLoc !== prevQg.lastHubLocation) {
    qualityGovernance.lastHubLocation = hubLoc;
  }

  const hadEncounter =
    !!nextWithNpc.activeEncounter ||
    (previous.activeEncounter && !nextWithNpc.activeEncounter);
  qualityGovernance.turnsSinceLastEncounter = hadEncounter
    ? 0
    : (prevQg.turnsSinceLastEncounter ?? 0) + 1;

  const arcPatch = applyArcDirectorCommit(previous, nextWithNpc, nextWithNpc.choices ?? []);

  const compiled = compileCraftRules(previous, playerInput);
  const signals = collectCraftSignals({
    previous,
    prose: gmProse,
    playerInput,
    notes: systemNotes,
    nextChoices: nextWithNpc.choices ?? next.choices,
  });
  qualityGovernance.craftSignals = signals;
  const craftLedger = applyCraftLearning(
    previous.craftLedger,
    signals,
    previous.engineMode ?? 'rpg',
    compiled.ruleIds
  );

  // Merge nextWithNpc updates into final patches
  const finalPatches: Partial<GameState> = {
    progressGovernor,
    qualityGovernance,
    craftLedger,
    ...arcPatch,
    ...(invCheck.valid ? {} : { inventory: previous.inventory }),
  };
  const logForStamp = finalPatches.log ?? nextWithNpc.log ?? next.log;
  const stampedLog = stampCraftApplied(logForStamp, compiled.ruleIds);
  if (stampedLog !== logForStamp) finalPatches.log = stampedLog;
  
  // Carry forward Wave 2 state updates
  if (nextWithNpc.arcDirector !== next.arcDirector) {
    finalPatches.arcDirector = nextWithNpc.arcDirector;
  }
  if (nextWithNpc.pyoaBranchLedger !== next.pyoaBranchLedger) {
    finalPatches.pyoaBranchLedger = nextWithNpc.pyoaBranchLedger;
  }

  return {
    patches: finalPatches,
    xpAward,
    systemNotes,
  };
}
