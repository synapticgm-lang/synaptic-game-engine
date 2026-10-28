/**
 * q77b-DYINGTYPED + M2 multi-step + M3 action economy — typed free-text engine outcomes.
 * Reuses parsePlayerSteps + checkForAction/runPlayerCheck + interpretRoundTyped.
 * Free text is NEVER rejected. Speech is always a free step; only mechanical aims resolve as actions.
 * In fights, SRD 5.2.1 action economy caps mechanical steps (extra steps → "not done", still recorded).
 * If nothing actionable: "nothing the world can act on" and the words are still said aloud.
 * SRD 5.2.1 Communicating / Combat Your Turn (Wizards of the Coast, CC BY 4.0).
 */
import type { GameState } from './types';
import {
  bonusActionGranted,
  freshEconomy,
  slotOfStep,
  trySpendSlot,
  type EconomyUsed,
} from './actionEconomy';
import { checkForAction, runPlayerCheck } from './checkMath';
import {
  describeIntentStep,
  intentFromStep,
  parsePlayerIntent,
  parsePlayerSteps,
  sheetContextFromState,
  type IntentRead,
  type IntentStep,
  type StepResolution,
} from './intentParser';
import { interpretRoundTyped } from './tabletop/roundTyped';
import {
  isNonLootableTakeTarget,
  looksLikeParley,
  looksLikeSteal,
  resolveParleyAttempt,
  resolvePersonThreatAttempt,
  resolveStealAttempt,
} from './stealParley';
import { engageAddressedInHereSpot } from './hereSpot';
import { isLedgerReadAction } from './completedEventPacket';
import { ledgerChangeFact, ledgerReadChanges, ledgerSheetLine } from './litrpgSystemWindow';
import { buildClauseWriterFact } from './writerCueLines';
import { proseSaysEmpty } from './chipRules';
import { listenersOnEmptyText, peopleHere } from './scenePresence';

function isPersonInsightLabel(clause: string): boolean {
  return /^read\s+\S/i.test((clause ?? '').trim());
}

/** Mark Insight attempted on the named person so Read chips retire for this scene (T10AB). */
function markInsightAttempt(state: GameState, whoRaw: string, success: boolean): GameState {
  const raw = (whoRaw ?? '').replace(/^read\s+/i, '').replace(/\s+/g, ' ').trim();
  const want = raw.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
  if (!want) return state;
  const mems = state.npcMemories ?? [];
  let hit = false;
  const next = mems.map((m) => {
    const n = (m.npcName ?? '').replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
    const id = (m.npcId ?? '').toLowerCase();
    if (n !== want && !n.startsWith(want) && !want.startsWith(n) && id !== want && !id.endsWith(want)) {
      return m;
    }
    hit = true;
    const topics = [...(m.completedTopics ?? [])];
    if (!topics.includes('insight')) topics.push('insight');
    const facts = [...(m.facts ?? [])];
    const line = success
      ? `Insight read: you caught a tell.`
      : `Insight read: they gave nothing away.`;
    if (!facts.includes(line)) facts.push(line);
    return { ...m, completedTopics: topics, facts };
  });
  return hit ? { ...state, npcMemories: next } : state;
}

export type TypedFreeTextResult = {
  receipts: string[];
  facts: string[];
  /** Visible engine answer for systemLog / completedEvent.engineResult. */
  engineResult: string;
  /** M2 — full reader output for TurnLog / FactSheet. */
  intentRead?: IntentRead;
  stepResults?: StepResolution[];
  /** Carry-over addressee for the next turn's reader. */
  lastAddressee?: string | null;
  /** M3 — slots spent resolving this message (fights). */
  economyUsed?: EconomyUsed;
  /** M6 — state after steal / parley ledger commits (persona, inventory, encounter). */
  state?: GameState;
};

const NOTHING = 'nothing the world can act on';

/** Mechanical step kinds — never free speech via the broad protest heuristic. */
const MECHANICAL_ACTIONS = new Set([
  'take',
  'move',
  'attack',
  'search',
  'use_item',
  'sneak',
  'buy',
  'cast',
  'flee',
  'rest',
  'observe',
]);

/**
 * Writer-facing fact for one clause — strings live in writerCueLines (T10E shared shape).
 * SRD 5.2.1 Communicating — brief speech is free; the engine does not invent the PC's line.
 */
function clauseWriterFact(step: IntentStep, speech: boolean, presentHere: string[] = []): string {
  const clause = (step.clause ?? '').replace(/\s+/g, ' ').trim() || describeIntentStep(step);
  return buildClauseWriterFact(clause, speech, {
    said: (step.say ?? '').replace(/\s+/g, ' ').trim(),
    addressee: step.addressee?.trim() || null,
    presentHere,
  });
}

/**
 * Listen pool for speech / reaction cues. Same peopleHere truth as chips (T10AJ), and the same
 * empty-room strip chips already use (listenersOnEmptyText) when the act itself says the place
 * is empty — so "shout into the empty street" does not invent opening-cast reactors.
 */
function presentNames(state: GameState, clause = ''): string[] {
  if (proseSaysEmpty(clause)) return listenersOnEmptyText(state);
  return peopleHere(state);
}

function speechStep(step: IntentStep, presentHere: string[] = []): StepResolution {
  const tried = describeIntentStep(step) || 'speech';
  return {
    tried,
    done: true,
    reason: 'speech (free)',
    engineResult: clauseWriterFact(step, true, presentHere),
    economySlot: 'speech',
  };
}

function actionDoneStep(step: IntentStep, clause: string, presentHere: string[] = []): StepResolution {
  const tried = describeIntentStep(step) || clause.slice(0, 80);
  return {
    tried,
    done: true,
    reason: 'action noted',
    engineResult: clauseWriterFact(step, false, presentHere),
    economySlot: 'action',
  };
}

function isSpeechStep(step: IntentStep, clause: string, inHostileParley = false): boolean {
  if (step.unplacedMove) return false;
  // Deal is mechanical ledger work — not free speech alone.
  if (step.action === 'deal') return false;
  // M6 — steal is never free speech.
  if (looksLikeSteal(clause, step)) return false;
  // M6 — parley / social Influence against hostiles spends Action (still never rejected).
  if (inHostileParley && looksLikeParley(clause, step)) return false;
  // Already-classified mechanical aims stay mechanical (take / sit / slide / wink),
  // unless the player also typed a quoted utterance (T10R — quote + NPC reply).
  if (MECHANICAL_ACTIONS.has(step.action) && !(step.say && step.say.trim())) return false;
  if (
    step.action === 'talk'
    || step.action === 'ask_about'
    || step.action === 'refuse'
    || step.action === 'recall'
  ) {
    return true;
  }
  // T10AB — grab/collar/blade intimidate is Athletics + Intimidation, not free speech.
  if (
    step.action === 'intimidate'
    && /\b(grab|collar|grapple|pin|throat|blade|dagger|sword|knife|drag|haul|seize|cut\s+off)\b/i.test(
      clause,
    )
  ) {
    return false;
  }
  // Plain persuade without a hostile/live fight stays speech; hostile path uses inHostileParley.
  if (
    (step.action === 'persuade' || step.action === 'intimidate' || step.action === 'deceive')
    && !inHostileParley
  ) {
    return true;
  }
  // SRD Communicating: explicit speech verbs / quoted say — not the broad first-person protest heuristic.
  // Stem forms (asking / telling) match the intentParser speech marker (T10P).
  if (/\b(shout(?:ing)?|yell(?:ing)?|call(?:ing)?\s+out|say|said|tell(?:ing)?|ask(?:ing)?|order|taunt)\b/i.test(clause)) {
    return !/\b(attack|flee|strike|cast|drink|equip|walk to|go to|move to|swing)\b/i.test(clause);
  }
  if (step.say && !/\b(attack|flee|strike|cast|drink|equip|walk|go to|move to)\b/i.test(clause)) {
    return true;
  }
  return false;
}

type StepOut = StepResolution & { state?: GameState };

function hostileParleyContext(state: GameState): boolean {
  const enc = state.activeEncounter;
  if (enc && enc.hp > 0 && enc.phase !== 'terminal') return true;
  if (state.sceneFacts?.pendingEncounter) return true;
  return (state.npcMemories ?? []).some(
    (m) =>
      (m.disposition === 'hostile' || m.attitude === 'hostile')
      && (state.sceneFacts?.present ?? []).some(
        (p) => p.toLowerCase() === (m.npcName ?? '').toLowerCase(),
      ),
  );
}

function resolveOneStep(state: GameState, step: IntentStep, fullText: string): StepOut {
  const clause = (step.clause ?? fullText).trim() || fullText;
  const tried = describeIntentStep(step) || clause.slice(0, 80);
  const slot = slotOfStep(step);
  const hostile = hostileParleyContext(state);
  const here = presentNames(state, clause);

  if (step.unplacedMove || ((step.action === 'move' || step.action === 'sneak') && !step.destination)) {
    return {
      tried,
      done: false,
      reason: 'not done: no destination named',
      engineResult: 'Move not done: no destination named.',
      economySlot: slot,
    };
  }

  // M6 — STEAL: Dexterity (Sleight of Hand) vs Passive Wisdom (Perception).
  if (looksLikeSteal(clause, step, state)) {
    const steal = resolveStealAttempt(state, clause, step);
    const outcome = steal.taken
      ? 'taken unnoticed'
      : steal.guardedHold
        ? 'attempt resolved; guardian holds item'
        : steal.noticed
          ? 'noticed; not taken'
          : 'not taken';
    return {
      tried,
      done: true,
      reason: outcome,
      engineResult: steal.facts.join(' ') || steal.receipts.join(' '),
      economySlot: 'action',
      state: steal.state,
    };
  }

  // T10AB — grab/collar/blade-threat on a present person: Athletics grapple + Intimidation (SRD).
  // Runs before hostile-only parley so a collar grab is not a soft social shrug with no grapple.
  const threatTarget = step.addressee?.trim() || step.target?.trim() || '';
  const grabThreat =
    /\b(grab|collar|grapple|pin|throat|blade|dagger|drag|haul|seize)\b/i.test(clause)
    || (step.action === 'take' && isNonLootableTakeTarget(threatTarget || step.target, state));
  if (
    threatTarget
    && (grabThreat
      || step.action === 'intimidate'
      || (step.action === 'attack' && grabThreat))
  ) {
    const threat = resolvePersonThreatAttempt(state, clause, {
      ...step,
      action: 'intimidate',
      addressee: threatTarget,
      target: threatTarget,
      tone: step.tone === 'friendly' ? 'threatening' : (step.tone ?? 'threatening'),
    });
    return {
      tried,
      done: true,
      reason: threat.success ? 'threat resolved' : 'threat resisted',
      engineResult: [...threat.facts, ...threat.receipts, clauseWriterFact(step, false, here)].filter(Boolean).join(' '),
      economySlot: 'action',
      state: threat.state,
    };
  }

  // M6 — PARLEY against hostiles / before a fight: social Influence check (never reject free text).
  if (hostile && looksLikeParley(clause, step)) {
    const parley = resolveParleyAttempt(state, clause, step);
    return {
      tried,
      done: true,
      reason: parley.success ? (parley.endedFight ? 'parley ended fight' : 'parley success') : 'parley failed',
      engineResult: parley.facts.join(' ') || parley.receipts.join(' '),
      economySlot: 'action',
      state: parley.state,
    };
  }

  if (isSpeechStep(step, clause, hostile)) {
    return speechStep(step, here);
  }

  if (step.action === 'deal' && step.deal) {
    const who = step.addressee?.trim() || 'someone here';
    const d = step.deal;
    const fact = `Deal attempted: ${d.kind}${d.amount != null ? ` ${d.amount}` : ''} with ${who}${d.dueDays != null ? ` due in ${d.dueDays} days` : ''}.`;
    return {
      tried,
      done: true,
      reason: 'deal recorded',
      engineResult: fact,
      economySlot: slot,
    };
  }

  // Live fight: mechanical clause goes through the existing round resolver (engine rolls).
  // Incomplete SRD sheet → still never reject; speech stays speech, acts stay acts (T10P —
  // do not force Face/attack chips into empty speech stubs that invent "spoke the warning").
  if (state.activeEncounter || state.roundCombat) {
    const canRound =
      !!state.character?.srd?.speciesId && !!state.character?.srd?.classId;
    if (!canRound) {
      if (isSpeechStep(step, clause, hostile)) {
        return speechStep({
          ...step,
          addressee: step.addressee?.trim() || state.activeEncounter?.name || null,
        }, here);
      }
      return actionDoneStep(step, clause, here);
    }
    const plan = interpretRoundTyped(state, clause);
    const engineResult = plan.facts.join(' ').trim() || plan.receipts.join(' ').trim() || tried;
    return {
      tried,
      done: plan.accepted,
      reason: plan.freeSpeechOnly ? 'speech (free)' : 'round action',
      engineResult,
      economySlot: plan.freeSpeechOnly ? 'speech' : slot,
    };
  }

  const intent = intentFromStep(step);
  const canRoll = !!state.character?.srd?.speciesId && !!state.character?.srd?.classId;
  const spec = canRoll ? checkForAction(state, intent, clause) : null;
  const actionable =
    !!spec
    || intent.kind === 'attack'
    || intent.kind === 'search'
    || intent.kind === 'observe'
    || intent.kind === 'use_item'
    || intent.kind === 'move'
    || intent.kind === 'flee'
    || intent.kind === 'rest'
    || intent.kind === 'cast';

  if (actionable && canRoll) {
    const check = runPlayerCheck(state, intent, clause);
    const outcome = check.isSuccess ? 'success' : 'failure';
    const fact = `Action resolved: ${check.label || intent.label} — ${outcome}.`;
    const roll = check.codeResolutionText || fact;
    // T10AB — Insight Read retires the person chip and records a durable social outcome.
    let nextState = state;
    if (/^insight$/i.test(check.label ?? '') || isPersonInsightLabel(clause)) {
      nextState = markInsightAttempt(state, step.addressee || step.target || clause, check.isSuccess);
    }
    // T10I: every clause still reaches the writer (Must narrate), even when a check fails —
    // free text is never rejected; a roll outcome alone must not drop the act.
    return {
      tried,
      done: true,
      reason: outcome,
      engineResult: `${clauseWriterFact(step, false, here)} ${roll}`.trim(),
      economySlot: slot,
      state: nextState !== state ? nextState : undefined,
    };
  }
  if (actionable && !canRoll) {
    // Still never "reject" — the clause is a writer fact even when no sheet can roll a check.
    const fact = `${clauseWriterFact(step, false, here)} Attempt noted (${intent.label}); no built character sheet to resolve a check.`;
    return { tried, done: true, reason: 'action noted (no sheet check)', engineResult: fact, economySlot: slot };
  }

  // Non-actionable physical / other clause: still a writer fact (never silent, never rejected).
  return actionDoneStep(step, clause, here);
}

/**
 * Resolve a typed line to ordered engine outcomes. Never rejects free text.
 * In fights, SRD action economy is applied across steps (M3).
 */
export function resolveTypedFreeText(state: GameState, input: string): TypedFreeTextResult {
  const raw = (input ?? '').trim();
  if (!raw) {
    const line = 'No action was typed.';
    return {
      receipts: [line],
      facts: [line],
      engineResult: line,
      intentRead: { steps: [], claims: [], systemText: [], scale: 'normal' },
      stepResults: [],
      lastAddressee: state.sceneFacts?.lastAddressee ?? null,
      economyUsed: freshEconomy(),
    };
  }

  // T10U — named address restores talking range before the listen pool is stamped.
  const engaged = engageAddressedInHereSpot(state, raw);
  const ctx = sheetContextFromState(engaged);
  const intentRead = parsePlayerSteps(raw, ctx);
  const stepResults: StepResolution[] = [];
  let lastAddressee = ctx.lastAddressee ?? null;
  const inFight = !!(engaged.activeEncounter || engaged.roundCombat);
  let economy = freshEconomy();
  const bonusOk = bonusActionGranted(engaged);
  let live = engaged;
  const hostile = hostileParleyContext(live);

  // T10V — System ping / panel read: the engine's plate answers (location, mark, quest track).
  // Free text is never rejected; the readout is code-owned, not a writer "nothing happened".
  if (isLedgerReadAction(raw) && ledgerSheetLine(live)) {
    const changes = ledgerReadChanges(live);
    const fact = `${ledgerChangeFact(changes)} System readout: ${ledgerSheetLine(live)}`;
    const one: StepResolution = {
      tried: raw.slice(0, 80),
      done: true,
      reason: 'system readout',
      engineResult: fact,
      economySlot: 'action',
    };
    return {
      receipts: [`done: system readout`],
      facts: [fact],
      engineResult: fact,
      intentRead,
      stepResults: [one],
      lastAddressee,
      economyUsed: economy,
      state: live,
    };
  }

  // Fight path with no reader steps yet: still never reject — whole line through round resolver.
  // M6: steal / parley still resolve as engine actions even with an empty reader cut.
  if (inFight && intentRead.steps.length === 0) {
    if (looksLikeSteal(raw) || (hostile && looksLikeParley(raw))) {
      const synthetic: IntentStep = {
        action: looksLikeSteal(raw) ? 'take' : 'persuade',
        clause: raw,
        addressee: live.activeEncounter?.name ?? null,
      };
      const one = resolveOneStep(live, synthetic, raw);
      if (one.state) live = one.state;
      return {
        receipts: [one.done ? `done: ${one.tried}` : `not done: ${one.tried}`],
        facts: [one.engineResult],
        engineResult: one.engineResult,
        intentRead,
        stepResults: [one],
        lastAddressee,
        economyUsed: economy,
        state: live,
      };
    }
    const plan = interpretRoundTyped(live, raw);
    const engineResult = plan.facts.join(' ').trim() || plan.receipts.join(' ').trim();
    const slot = plan.freeSpeechOnly ? 'speech' as const : 'action' as const;
    if (!plan.freeSpeechOnly) {
      const spend = trySpendSlot(economy, 'action', bonusOk);
      economy = spend.ok ? spend.used : economy;
    }
    return {
      receipts: plan.receipts,
      facts: plan.facts,
      engineResult,
      intentRead,
      stepResults: [
        {
          tried: raw.slice(0, 80),
          done: true,
          reason: plan.freeSpeechOnly ? 'speech (free)' : 'round action',
          engineResult,
          economySlot: slot,
        },
      ],
      lastAddressee,
      economyUsed: economy,
      state: live,
    };
  }

  for (let i = 0; i < intentRead.steps.length; i++) {
    const step = intentRead.steps[i]!;
    const clause = (step.clause ?? raw).trim() || raw;
    const hostNow = hostileParleyContext(live);
    // Speech is free — classify before spending a mechanical slot.
    if (isSpeechStep(step, clause, hostNow) && !step.unplacedMove) {
      stepResults.push(speechStep(step, presentNames(live, clause)));
      if (step.addressee) lastAddressee = step.addressee;
      continue;
    }
    const slot = slotOfStep(step);
    // SRD 5.2.1 Combat Your Turn: mechanical slots once per round; speech free.
    if (inFight && slot !== 'speech') {
      const spend = trySpendSlot(economy, slot, bonusOk);
      if (!spend.ok) {
        const tried = describeIntentStep(step) || clause.slice(0, 80);
        stepResults.push({
          tried,
          done: false,
          reason: spend.reason,
          engineResult: spend.reason,
          economySlot: slot,
        });
        if (step.addressee) lastAddressee = step.addressee;
        continue;
      }
      economy = spend.used;
    }
    const result = resolveOneStep(live, step, raw);
    if (result.state) live = result.state;
    const { state: _s, ...row } = result;
    stepResults.push({ ...row, economySlot: row.economySlot ?? slot });
    if (step.addressee) lastAddressee = step.addressee;
  }

  if (!stepResults.length) {
    // Claims / system only, or empty actionable: words still said aloud; world does not act.
    const said = `Words said aloud. ${NOTHING}.`;
    const result: StepResolution = {
      tried: NOTHING,
      done: false,
      reason: NOTHING,
      engineResult: said,
      economySlot: 'speech',
    };
    stepResults.push(result);
    return {
      receipts: [`Speech: aloud`, result.engineResult],
      facts: [result.engineResult],
      engineResult: result.engineResult,
      intentRead,
      stepResults,
      lastAddressee,
      economyUsed: economy,
      state: live,
    };
  }

  const receipts = stepResults.map((r) =>
    r.done ? `done: ${r.tried}` : `not done: ${r.tried} (${r.reason})`
  );
  const facts = stepResults.map((r) => r.engineResult);
  return {
    receipts,
    facts,
    engineResult: facts.join(' '),
    intentRead,
    stepResults,
    lastAddressee,
    economyUsed: economy,
    state: live,
  };
}

/** Legacy single-intent peek (chips / other callers). */
export function peekSingleIntent(state: GameState, input: string) {
  return parsePlayerIntent(input, state);
}
