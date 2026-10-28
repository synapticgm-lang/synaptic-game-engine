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
  looksLikeParley,
  looksLikeSteal,
  resolveParleyAttempt,
  resolveStealAttempt,
} from './stealParley';
import { buildClauseWriterFact } from './writerCueLines';

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
function clauseWriterFact(step: IntentStep, speech: boolean): string {
  const clause = (step.clause ?? '').replace(/\s+/g, ' ').trim() || describeIntentStep(step);
  return buildClauseWriterFact(clause, speech, {
    said: (step.say ?? '').replace(/\s+/g, ' ').trim(),
    addressee: step.addressee?.trim() || null,
  });
}

function speechStep(step: IntentStep): StepResolution {
  const tried = describeIntentStep(step) || 'speech';
  return {
    tried,
    done: true,
    reason: 'speech (free)',
    engineResult: clauseWriterFact(step, true),
    economySlot: 'speech',
  };
}

function actionDoneStep(step: IntentStep, clause: string): StepResolution {
  const tried = describeIntentStep(step) || clause.slice(0, 80);
  return {
    tried,
    done: true,
    reason: 'action noted',
    engineResult: clauseWriterFact(step, false),
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
  // Already-classified mechanical aims stay mechanical (take / sit / slide / wink).
  if (MECHANICAL_ACTIONS.has(step.action)) return false;
  if (
    step.action === 'talk'
    || step.action === 'ask_about'
    || step.action === 'refuse'
    || step.action === 'recall'
  ) {
    return true;
  }
  // Plain persuade without a hostile/live fight stays speech; hostile path uses inHostileParley.
  if (
    (step.action === 'persuade' || step.action === 'intimidate' || step.action === 'deceive')
    && !inHostileParley
  ) {
    return true;
  }
  // SRD Communicating: explicit speech verbs / quoted say — not the broad first-person protest heuristic.
  if (/\b(shout|yell|call out|say|tell|ask|order|taunt)\b/i.test(clause)) {
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
  if (looksLikeSteal(clause, step)) {
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
    return speechStep(step);
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
  // Incomplete SRD sheet → still never reject; treat as free speech / said aloud.
  if (state.activeEncounter || state.roundCombat) {
    const canRound =
      !!state.character?.srd?.speciesId && !!state.character?.srd?.classId;
    if (!canRound) {
      return speechStep({
        ...step,
        addressee: step.addressee?.trim() || state.activeEncounter?.name || null,
      });
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
    // T10I: every clause still reaches the writer (Must narrate), even when a check fails —
    // free text is never rejected; a roll outcome alone must not drop the act.
    return {
      tried,
      done: true,
      reason: outcome,
      engineResult: `${clauseWriterFact(step, false)} ${roll}`.trim(),
      economySlot: slot,
    };
  }
  if (actionable && !canRoll) {
    // Still never "reject" — the clause is a writer fact even when no sheet can roll a check.
    const fact = `${clauseWriterFact(step, false)} Attempt noted (${intent.label}); no built character sheet to resolve a check.`;
    return { tried, done: true, reason: 'action noted (no sheet check)', engineResult: fact, economySlot: slot };
  }

  // Non-actionable physical / other clause: still a writer fact (never silent, never rejected).
  return actionDoneStep(step, clause);
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

  const ctx = sheetContextFromState(state);
  const intentRead = parsePlayerSteps(raw, ctx);
  const stepResults: StepResolution[] = [];
  let lastAddressee = ctx.lastAddressee ?? null;
  const inFight = !!(state.activeEncounter || state.roundCombat);
  let economy = freshEconomy();
  const bonusOk = bonusActionGranted(state);
  let live = state;
  const hostile = hostileParleyContext(live);

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
      stepResults.push(speechStep(step));
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
