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
  isSpeechOrProtest,
  parsePlayerIntent,
  parsePlayerSteps,
  sheetContextFromState,
  type IntentRead,
  type IntentStep,
  type StepResolution,
} from './intentParser';
import { interpretRoundTyped } from './tabletop/roundTyped';

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
};

const NOTHING = 'nothing the world can act on';

function speechStep(step: IntentStep, who: string): StepResolution {
  const tried = describeIntentStep(step) || 'speech';
  const fact = `Speech event: you address ${who}. NPC reaction slot open for the writer.`;
  return { tried, done: true, reason: 'speech (free)', engineResult: fact, economySlot: 'speech' };
}

function isSpeechStep(step: IntentStep, clause: string): boolean {
  if (step.unplacedMove) return false;
  // Deal is mechanical ledger work — not free speech alone.
  if (step.action === 'deal') return false;
  if (
    step.action === 'talk'
    || step.action === 'ask_about'
    || step.action === 'persuade'
    || step.action === 'intimidate'
    || step.action === 'deceive'
    || step.action === 'refuse'
    || step.action === 'recall'
  ) {
    return true;
  }
  // SRD Communicating: shouts / orders / trash talk are free speech even when the coarse kind is other.
  if (/\b(shout|yell|call out|say|tell|ask|order|taunt)\b/i.test(clause) || isSpeechOrProtest(clause)) {
    return !/\b(attack|flee|strike|cast|drink|equip|walk to|go to|move to|swing)\b/i.test(clause);
  }
  if (step.say && !/\b(attack|flee|strike|cast|drink|equip|walk|go to|move to)\b/i.test(clause)) {
    return true;
  }
  return false;
}

function resolveOneStep(state: GameState, step: IntentStep, fullText: string): StepResolution {
  const clause = (step.clause ?? fullText).trim() || fullText;
  const tried = describeIntentStep(step) || clause.slice(0, 80);
  const slot = slotOfStep(step);

  if (step.unplacedMove || ((step.action === 'move' || step.action === 'sneak') && !step.destination)) {
    return {
      tried,
      done: false,
      reason: 'not done: no destination named',
      engineResult: 'Move not done: no destination named.',
      economySlot: slot,
    };
  }

  if (isSpeechStep(step, clause)) {
    const who = step.addressee?.trim() || 'the room';
    return speechStep(step, who);
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
      const who = step.addressee?.trim() || state.activeEncounter?.name || 'the room';
      return speechStep(step, who);
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
    return {
      tried,
      done: true,
      reason: outcome,
      engineResult: check.codeResolutionText || fact,
      economySlot: slot,
    };
  }
  if (actionable && !canRoll) {
    // Still never "reject" the line — record that the sheet cannot resolve it yet; words stand.
    const fact = `Attempt noted (${intent.label}); no built character sheet to resolve the check. Words said aloud.`;
    return { tried, done: false, reason: 'not done: no character sheet', engineResult: fact, economySlot: slot };
  }

  // Non-actionable clause that still reached a step (e.g. other): words said aloud.
  const who = step.addressee?.trim() || 'the room';
  const fact = `Words said aloud to ${who}.`;
  return { tried, done: true, reason: 'said aloud', engineResult: fact, economySlot: 'speech' };
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

  // Fight path with no reader steps yet: still never reject — whole line through round resolver.
  if (inFight && intentRead.steps.length === 0) {
    const plan = interpretRoundTyped(state, raw);
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
    };
  }

  for (let i = 0; i < intentRead.steps.length; i++) {
    const step = intentRead.steps[i]!;
    const clause = (step.clause ?? raw).trim() || raw;
    // Speech is free — classify before spending a mechanical slot.
    if (isSpeechStep(step, clause) && !step.unplacedMove) {
      const who = step.addressee?.trim() || 'the room';
      stepResults.push(speechStep(step, who));
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
    const result = resolveOneStep(state, step, raw);
    stepResults.push({ ...result, economySlot: result.economySlot ?? slot });
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
  };
}

/** Legacy single-intent peek (chips / other callers). */
export function peekSingleIntent(state: GameState, input: string) {
  return parsePlayerIntent(input, state);
}
