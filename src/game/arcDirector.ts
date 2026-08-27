/**
 * ArcDirector — authoritative pre-GM beat selection and effect commits (Path A Wave 0–1).
 * Commits quest stages, encounters, and XP chunks BEFORE callGm.
 */

import type { ActiveEncounter, GameState, Quest } from './types';
import {
  type BeatContract,
  contractById,
  engineAllowsCombat,
  forcedEncounterBeat,
  resolveBiblePrefix,
  selectDueBeat,
} from './beatContract';
import { updateChoiceFingerprints } from './choiceCompiler';
import { ensureRunManifest, nextEventSeq } from './runManifest';
import { tickPressureClock, type PressureClockState } from './pressureClock';
import {
  formatNpcTopicMandate,
  recordNpcTopic,
  shouldForceNpcStageAdvance,
  advanceNpcTopicExhaustion,
} from './npcTopicFsm';
import { recordPyoaBranchChoice, formatPyoaBranchMandate } from './pyoaBranchLedger';
import {
  applySocialMilestone,
  detectSocialMilestone,
} from './socialMilestoneLedger';
import { pushBeatStateTx, type BeatStateTxExtras } from './stateTx';
import {
  initEncounterTerminal,
  tickEncounterTerminal,
  forceClearIfStale,
  isEncounterOnCooldown,
} from './encounterTerminalFsm';
import {
  lockPyoaBranchOnCrisis,
  exhaustDelayPads,
} from './pyoaBranchLedger';
import { countPlayerIntentStreak } from './beatFingerprint';
import { pickStatusVoiceLine } from './voiceCadenceSystem';
import { hasDurableDeltaByT12, forceFreeT12DurableDelta } from './freeT12Hook';

export interface ArcDirectorState {
  committedBeatIds?: string[];
  activeBeatId?: string | null;
  lastMandate?: string;
  turnsSinceCombatReceipt?: number;
  pressureClock?: PressureClockState;
  npcTopics?: Record<string, string[]>;
  /** 29a — topic id → committed branch label */
  topicCommits?: Record<string, string>;
  socialMilestones?: string[];
  gateDispositions?: Record<string, number>;
  choiceFingerprints?: import('./choiceCompiler').ChoiceFingerprintRecord[];
  /** 29a — paired encounterCleared receipts */
  encounterClearedReceipts?: import('./encounterTerminalFsm').EncounterClearedReceipt[];
  /** 29b — turn of last encounter clear */
  lastEncounterClearedTurn?: number;
  /** 29b — forcedSpawnKey → cooldown-until turn (no re-engage) */
  encounterCooldownUntil?: Record<string, number>;
  /** 29b — voice aside cooldown bookkeeping */
  voiceAsideLastUsed?: Record<string, number>;
  /** 29b — Free T12 durable delta forced */
  freeT12Forced?: boolean;
}

export interface ArcDirectorResult {
  state: GameState;
  mandate: string;
  beatId?: string;
  xpAwards: Array<{ amount: number; reason: string }>;
  systemReceipts: string[];
  beatCommitted: boolean;
}

function committedSet(state: GameState): Set<string> {
  return new Set(state.arcDirector?.committedBeatIds ?? []);
}

function hubSkirmishEncounter(state: GameState): ActiveEncounter {
  const lvl = state.character?.level ?? 1;
  const hp = 12 + lvl * 4;
  const name = state.engineMode === 'litrpg' ? 'Pact-Hunter Skirmisher' : 'Keep Wraith';
  return initEncounterTerminal(
    {
      name,
      level: lvl,
      hp,
      maxHp: hp,
      armorClass: 11 + lvl,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: 25 + lvl * 5,
      goldReward: 5 + lvl * 2,
    },
    state,
    { forcedSpawnKey: name, source: 'arcDirector' }
  );
}

function completeQuestObjective(
  quests: Quest[],
  questId: string,
  objectiveIndex: number
): Quest[] {
  return quests.map((q) => {
    if (q.id !== questId) return q;
    const objectives = [...(q.objectives ?? [])];
    if (objectiveIndex >= objectives.length) return q;
    objectives[objectiveIndex] = { ...objectives[objectiveIndex], completed: true };
    return { ...q, objectives, status: q.status === 'available' ? 'active' : q.status };
  });
}

function hasCombatReceipt(state: GameState): boolean {
  if (state.activeEncounter) return true;
  return (state.stateTxLog ?? []).some(
    (t) => t.kind === 'combat' || /^Encounter:/i.test(t.summary)
  );
}

function hasCrisisReceipt(state: GameState): boolean {
  const committed = state.arcDirector?.committedBeatIds ?? [];
  if (committed.some((id) => id.includes('crisis'))) return true;
  return (state.stateTxLog ?? []).some((t) => /crisis|fork|branch lock/i.test(t.summary));
}

/** B043 — enforce combat/crisis receipts by T8/T15/T12 (not just telemetry). */
export function forceLivenessBeat(
  state: GameState,
  committed: Set<string>
): BeatContract | null {
  const turn = state.turn;
  const mode = state.engineMode;

  if (mode === 'pyoa' && turn >= 12 && !hasCrisisReceipt(state) && !committed.has('pyoa-beat-crisis')) {
    return contractById('pyoa-beat-crisis') ?? null;
  }

  if (!engineAllowsCombat(state) || hasCombatReceipt(state)) return null;

  const prefix = resolveBiblePrefix(state);
  const skirmishId =
    prefix === 'summoned-pact'
      ? 'sp-beat-skirmish'
      : prefix === 'cursed-keep'
        ? 'ck-beat-hostility'
        : null;

  if (turn >= 8 && turn < 15 && skirmishId && !committed.has(skirmishId)) {
    return contractById(skirmishId) ?? null;
  }

  return null;
}

function shouldCommitBeat(
  contract: BeatContract,
  state: GameState,
  playerInput: string
): boolean {
  const turn = state.turn;
  if (turn < contract.minTurn) return false;

  const lower = playerInput.toLowerCase();
  const talkish = /\b(ask|talk|speak|listen|overhear|negotiate|tell|who|why|what|where)\b/i.test(lower);

  if (contract.id === 'sp-beat-hear-reason') {
    return talkish || turn >= 6;
  }
  if (contract.id === 'sp-beat-orient') {
    return turn >= 2 && (state.openingEstablishment?.complete === true || turn >= 4);
  }
  if (contract.kind === 'encounter') {
    return true;
  }
  if (contract.kind === 'crisis' || contract.kind === 'branch') {
    return turn >= contract.minTurn;
  }
  if (contract.kind === 'check' && state.engineMode === 'dnd') {
    return /\b(check|investigate|search|inspect|look)\b/i.test(lower) || turn >= contract.minTurn + 2;
  }
  if (contract.kind === 'leverage' || contract.kind === 'quest_stage') {
    return talkish || turn >= contract.minTurn + 2;
  }
  return turn >= contract.minTurn;
}

function applyBeatEffects(
  state: GameState,
  contract: BeatContract,
  seq: number
): { state: GameState; xp: number; receipts: string[] } {
  let next = { ...state };
  const receipts: string[] = [];
  const xp = contract.xpChunk ?? 0;
  const extras: BeatStateTxExtras = {
    beatId: contract.id,
    eventSeq: seq,
    why: `ArcDirector beat commit: ${contract.id}`,
  };

  if (contract.questId != null && contract.questObjectiveIndex != null) {
    next = {
      ...next,
      quests: completeQuestObjective(
        next.quests ?? [],
        contract.questId,
        contract.questObjectiveIndex
      ),
    };
    receipts.push(`Quest stage: ${contract.summary}`);
    extras.questStage = contract.summary;
  }

  if (contract.spawnEncounter && !next.activeEncounter) {
    const preview = hubSkirmishEncounter(next);
    const spawnKey = preview.forcedSpawnKey ?? preview.name;
    if (isEncounterOnCooldown(next, spawnKey)) {
      receipts.push(`Encounter cooldown: ${spawnKey} — skipped re-engage`);
    } else {
      next = { ...next, activeEncounter: preview };
      receipts.push(`Encounter: ${next.activeEncounter!.name}`);
      extras.encounterName = next.activeEncounter!.name;
    }
  }

  next = pushBeatStateTx(next, contract.summary, extras, state.turn + 1);

  if (xp > 0) {
    receipts.push(`Arc XP: +${xp} (${contract.summary})`);
  }

  return { state: next, xp, receipts };
}

/** Player-visible STATUS lines for arc commits (T12 hook — quest stage + XP receipt). */
export function formatArcStatusReceipts(result: ArcDirectorResult): string[] {
  const lines: string[] = [];
  for (const r of result.systemReceipts) {
    if (r.startsWith('Quest stage:')) {
      lines.push(`Quest: ${r.replace(/^Quest stage:\s*/, '')}`);
    } else if (r.startsWith('Arc XP:')) {
      const m = r.match(/Arc XP: \+(\d+) \((.+)\)/);
      if (m) lines.push(`XP Gained: ${m[1]} (arc: ${m[2]})`);
      else lines.push(r);
    } else if (r.startsWith('Encounter:')) {
      lines.push(r);
    } else if (r.startsWith('Encounter cleared:')) {
      lines.push(r);
    } else if (r.startsWith('Social:')) {
      const m = r.match(/Social: \+(\d+) XP \((.+)\)/);
      if (m) lines.push(`XP Gained: ${m[1]} (${m[2]})`);
    } else if (r.startsWith('Voice:')) {
      lines.push(r.replace(/^Voice:\s*/, ''));
    }
  }
  return lines;
}

/** Run before GM — select beat, resolve mechanics stub, commit effects. */
export function runArcDirectorBeforeGm(
  state: GameState,
  playerInput: string
): ArcDirectorResult {
  let working = ensureRunManifest(state);
  const xpAwards: Array<{ amount: number; reason: string }> = [];
  const systemReceipts: string[] = [];
  const mandates: string[] = [];
  let beatCommitted = false;
  let beatId: string | undefined;

  // 29a — tick / force-clear active encounter before new beat commits
  if (working.activeEncounter) {
    const tick = tickEncounterTerminal(working, playerInput);
    working = tick.state;
    systemReceipts.push(...tick.receipts);
    if (tick.xpAward) {
      xpAwards.push(tick.xpAward);
    }
    if (!working.activeEncounter) {
      mandates.push('ENCOUNTER TERMINAL: Threat cleared — unlock travel and ordinary pads next beat.');
      // 29b — voice line on combat clear
      const voice = pickStatusVoiceLine(working, 'xp_gain');
      if (voice) {
        systemReceipts.push(`Voice: ${voice.line}`);
        working = {
          ...working,
          arcDirector: {
            ...working.arcDirector,
            voiceAsideLastUsed: {
              ...(working.arcDirector?.voiceAsideLastUsed ?? {}),
              [voice.trigger]: working.turn,
            },
          },
        };
      }
    }
  } else {
    const stale = forceClearIfStale(working, 50);
    if (stale.forcedTerminal) {
      working = stale.state;
      systemReceipts.push(...stale.receipts);
      if (stale.xpAward) xpAwards.push(stale.xpAward);
    }
  }

  // 29b — spatial: flee/exit intent marks outdoor authority so prose can't snap back inside
  working = applyExitAuthorityOnFlee(working, playerInput);

  working = recordPyoaBranchChoice(working, playerInput);
  working = lockPyoaBranchOnCrisis(working);
  working = exhaustDelayPads(working, playerInput);
  const pyoaMandate = formatPyoaBranchMandate(working);
  if (pyoaMandate) mandates.push(pyoaMandate);

  const topicResult = recordNpcTopic(working, playerInput);
  working = topicResult.state;
  const topicMandate = topicResult.npc
    ? formatNpcTopicMandate(topicResult.npc, topicResult.topic ?? '', topicResult.exhausted)
    : null;
  if (topicMandate) mandates.push(topicMandate);
  if (topicResult.exhausted && topicResult.npc) {
    const advanced = advanceNpcTopicExhaustion(working, topicResult.npc);
    working = advanced.state;
    if (advanced.mandate) mandates.push(advanced.mandate);
  }
  if (topicResult.npc && shouldForceNpcStageAdvance(working, topicResult.npc)) {
    mandates.push(
      `NPC STAGE ADVANCE (${topicResult.npc}): Topics exhausted — move quest stage or end scene with consequence.`
    );
  }

  const social = detectSocialMilestone(playerInput, working);
  if (social) {
    working = applySocialMilestone(working, social);
    xpAwards.push({ amount: social.amount, reason: social.reason });
    systemReceipts.push(`Social: +${social.amount} XP (${social.kind})`);
  }

  const committed = committedSet(working);
  const turnsSinceCombat = working.arcDirector?.turnsSinceCombatReceipt ?? working.turn;
  const intentStreak = countPlayerIntentStreak(working);

  let contract = selectDueBeat(working, committed);
  // 29b — Free T12 durable delta (runtime, not eval-only)
  if (working.turn >= 12 && !hasDurableDeltaByT12(working)) {
    const t12 = forceFreeT12DurableDelta(working, committed);
    if (t12) {
      contract = t12;
      mandates.push('FREE T12 HOOK: Durable delta required this beat (quest stage / clear / branch / level).');
      working = {
        ...working,
        arcDirector: { ...working.arcDirector, freeT12Forced: true },
      };
    }
  }
  // 29b — hard interrupt when same-action streak ≥5
  if (intentStreak.count >= 5 && intentStreak.key !== 'empty' && !working.activeEncounter) {
    const interrupt =
      forceLivenessBeat(working, committed) ??
      forcedEncounterBeat(working, turnsSinceCombat, committed) ??
      forceFreeT12DurableDelta(working, committed);
    if (interrupt) {
      contract = interrupt;
      mandates.push(
        `STREAK INTERRUPT (${intentStreak.key} ×${intentStreak.count}): Force consequence beat — no stall clone.`
      );
    }
  }
  if (!contract || contract.kind === 'pressure') {
    contract =
      forceLivenessBeat(working, committed) ??
      forcedEncounterBeat(working, turnsSinceCombat, committed) ??
      contract;
  } else if (!hasCombatReceipt(working) && working.turn >= 15) {
    contract =
      forcedEncounterBeat(working, turnsSinceCombat, committed) ??
      forceLivenessBeat(working, committed) ??
      contract;
  }

  if (contract && (!contract.once || !committed.has(contract.id)) && shouldCommitBeat(contract, working, playerInput)) {
    const { seq, state: seqState } = nextEventSeq(working);
    working = seqState;
    const applied = applyBeatEffects(working, contract, seq);
    working = applied.state;
    if (applied.xp > 0) {
      xpAwards.push({ amount: applied.xp, reason: contract.summary });
    }
    systemReceipts.push(...applied.receipts);
    mandates.push(contract.mandate);
    beatId = contract.id;
    beatCommitted = true;

    if (contract.once) {
      const beatIds = [...(working.arcDirector?.committedBeatIds ?? []), contract.id];
      working = {
        ...working,
        arcDirector: {
          ...working.arcDirector,
          committedBeatIds: beatIds,
          activeBeatId: contract.id,
          lastMandate: contract.mandate,
          turnsSinceCombatReceipt: contract.spawnEncounter ? 0 : turnsSinceCombat,
        },
      };
    } else {
      working = {
        ...working,
        arcDirector: {
          ...working.arcDirector,
          activeBeatId: contract.id,
          lastMandate: contract.mandate,
          turnsSinceCombatReceipt: contract.spawnEncounter ? 0 : turnsSinceCombat,
        },
      };
    }

    // 29b — voice STATUS on quest/xp commits
    if (applied.xp > 0 || contract.kind === 'quest_stage' || contract.kind === 'leverage') {
      const voice = pickStatusVoiceLine(working, applied.xp > 0 ? 'xp_gain' : 'hub_change');
      if (voice) {
        systemReceipts.push(`Voice: ${voice.line}`);
        working = {
          ...working,
          arcDirector: {
            ...working.arcDirector,
            voiceAsideLastUsed: {
              ...(working.arcDirector?.voiceAsideLastUsed ?? {}),
              [voice.trigger]: working.turn,
            },
          },
        };
      }
    }
  } else if (contract && (!contract.once || !committed.has(contract.id))) {
    mandates.push(`ARC PENDING (${contract.id}): ${contract.mandate}`);
    beatId = contract.id;
  }

  if (working.arcDirector?.lastMandate && !beatCommitted) {
    mandates.push(working.arcDirector.lastMandate);
  }

  const pressureClock = tickPressureClock(
    working.arcDirector?.pressureClock,
    beatCommitted,
    working.turn
  );

  working = {
    ...working,
    arcDirector: {
      ...working.arcDirector,
      pressureClock,
    },
  };

  return {
    state: working,
    mandate: mandates.filter(Boolean).join('\n'),
    beatId,
    xpAwards,
    systemReceipts,
    beatCommitted,
  };
}

/** 29b — mark outdoor when flee/exit succeeds so scrub cannot snap back inside. */
function applyExitAuthorityOnFlee(state: GameState, playerInput: string): GameState {
  const lower = (playerInput || '').toLowerCase();
  const fleeClear =
    !state.activeEncounter &&
    state.arcDirector?.lastEncounterClearedTurn === state.turn &&
    /\b(flee|escape|retreat|run away|bolt)\b/i.test(lower);
  const exitIntent = /\b(exit|leave|step outside|go outside|head outside|into the (?:street|open))\b/i.test(
    lower
  );
  if (!fleeClear && !exitIntent) return state;
  const prev = state.sceneFacts;
  return {
    ...state,
    sceneFacts: {
      crowd: prev?.crowd ?? 'empty',
      noise: prev?.noise ?? 'quiet',
      present: prev?.present ?? [],
      props: prev?.props ?? [],
      lastBeat: prev?.lastBeat ?? '',
      updatedTurn: state.turn,
      ...prev,
      indoor: false,
      exitAuthorityTurn: state.turn,
    },
    previousSceneFacts: prev ?? state.previousSceneFacts,
  };
}

/** SNAPSHOT lines for situation packet. */
export function buildArcDirectorSnapshotLines(state: GameState): string[] {
  const lines: string[] = [];
  const ad = state.arcDirector;
  if (ad?.activeBeatId) {
    lines.push(
      `ArcDirector beat: ${ad.activeBeatId} (committed: ${(ad.committedBeatIds ?? []).join(', ') || 'none'})`
    );
  }
  if (ad?.lastMandate?.trim()) {
    lines.push(ad.lastMandate.trim());
  }
  const forced = forcedEncounterBeat(state, ad?.turnsSinceCombatReceipt ?? state.turn, new Set(ad?.committedBeatIds ?? []));
  if (forced && !(ad?.committedBeatIds ?? []).includes(forced.id)) {
    lines.push(
      `Encounter pressure: ${forced.summary} due (turns since combat: ${ad?.turnsSinceCombatReceipt ?? '?'})`
    );
  }
  return lines;
}

/** Post-commit: bump combat receipt counter, record choice fingerprints. */
export function applyArcDirectorCommit(
  previous: GameState,
  next: GameState,
  offeredChoices: string[]
): Partial<GameState> {
  const prevAd = previous.arcDirector ?? {};
  const hadCombat =
    !!next.activeEncounter ||
    (previous.activeEncounter && !next.activeEncounter) ||
    (next.stateTxLog ?? []).some((t) => t.turn === next.turn && t.kind === 'combat');

  return {
    arcDirector: {
      ...prevAd,
      ...next.arcDirector,
      turnsSinceCombatReceipt: hadCombat ? 0 : (prevAd.turnsSinceCombatReceipt ?? 0) + 1,
      choiceFingerprints: updateChoiceFingerprints(
        offeredChoices,
        next.turn,
        prevAd.choiceFingerprints
      ),
    },
  };
}

export function formatArcDirectorMandateBlock(result: ArcDirectorResult): string {
  if (!result.mandate.trim()) return '';
  return `\n--- ARC DIRECTOR (AUTHORITY — COMMITTED BEFORE PROSE) ---\n${result.mandate}\n${result.systemReceipts.length ? `Receipts: ${result.systemReceipts.join('; ')}\n` : ''}-------------------------------------------------\n`;
}

/** Keep ArcDirector objective commits when GM sync runs. */
export function preserveArcQuestProgress(
  arcQuests: Quest[] | undefined,
  syncedQuests: Quest[]
): Quest[] {
  const arcMap = new Map((arcQuests ?? []).map((q) => [q.id, q]));
  return syncedQuests.map((q) => {
    const arc = arcMap.get(q.id);
    if (!arc?.objectives?.length) return q;
    const objectives = (q.objectives ?? []).map((o, i) => ({
      ...o,
      completed: o.completed || !!arc.objectives?.[i]?.completed,
    }));
    const anyNew = objectives.some((o, i) => o.completed && !arc.objectives?.[i]?.completed);
    return {
      ...q,
      objectives,
      status:
        anyNew && q.status === 'available'
          ? 'active'
          : q.status,
    };
  });
}
