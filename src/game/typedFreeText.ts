/**
 * q77b-DYINGTYPED — typed free-text engine outcomes (free play, fights, dying).
 * Reuses parsePlayerIntent + checkForAction/runPlayerCheck + interpretRoundTyped.
 * No word lists: intent/resolution path decides action vs speech vs refusal.
 * Engine records; writer voices NPC reaction slots.
 * SRD 5.2.1 Communicating / Ability Checks (Wizards of the Coast, CC BY 4.0).
 */
import type { GameState } from './types';
import { checkForAction, runPlayerCheck } from './checkMath';
import { isSpeechOrProtest, parsePlayerIntent } from './intentParser';
import { presentNpcNames } from './npcRelationships';
import { interpretRoundTyped } from './tabletop/roundTyped';

export type TypedFreeTextResult = {
  receipts: string[];
  facts: string[];
  /** Visible engine answer for systemLog / completedEvent.engineResult. */
  engineResult: string;
};

function addressedPresent(state: GameState, input: string): string | null {
  const low = (input ?? '').toLowerCase();
  const enc = state.activeEncounter?.name?.trim();
  if (enc && low.includes(enc.toLowerCase())) return enc;
  const present = presentNpcNames(state);
  for (let i = 0; i < present.length; i++) {
    const name = present[i]!.trim();
    if (name && low.includes(name.toLowerCase())) return name;
  }
  const comps = state.companions ?? [];
  for (let i = 0; i < comps.length; i++) {
    const name = (comps[i]!.name ?? '').trim();
    if (name && (comps[i]!.hp ?? 0) > 0 && low.includes(name.toLowerCase())) return name;
  }
  return null;
}

/**
 * Resolve a typed line to an engine outcome or visible refusal.
 * Live round combat reuses interpretRoundTyped; free play / dying use intent + CheckSpec.
 */
export function resolveTypedFreeText(state: GameState, input: string): TypedFreeTextResult {
  const raw = (input ?? '').trim();
  if (!raw) {
    const refusal = 'No action was typed.';
    return { receipts: [refusal], facts: [refusal], engineResult: refusal };
  }
  if (state.activeEncounter || state.roundCombat) {
    const plan = interpretRoundTyped(state, raw);
    const engineResult = plan.facts.join(' ').trim() || plan.receipts.join(' ').trim();
    return { receipts: plan.receipts, facts: plan.facts, engineResult };
  }
  const intent = parsePlayerIntent(raw, state);
  const whoNamed = addressedPresent(state, raw);
  // Free speech: talk intent, protest, say/tell/ask to a present name, or address the room.
  const asSpeech =
    intent.kind === 'talk'
    || intent.kind === 'refuse'
    || isSpeechOrProtest(raw)
    || /\bi\s+say\b|\btell\b|\bask\b|\btalk\s+to\b/i.test(raw)
    || (!!whoNamed && raw.includes('?'));
  if (asSpeech) {
    const who = whoNamed ?? 'the room';
    const fact = `Speech event: you address ${who}. NPC reaction slot open for the writer.`;
    const receipt = `Speech: to ${who}`;
    return { receipts: [receipt], facts: [fact], engineResult: fact };
  }
  const canRoll = !!state.character?.srd?.speciesId && !!state.character?.srd?.classId;
  const spec = canRoll ? checkForAction(state, intent, raw) : null;
  const actionable =
    !!spec
    || intent.kind === 'attack'
    || intent.kind === 'search'
    || intent.kind === 'observe'
    || intent.kind === 'use_item'
    || intent.kind === 'move'
    || intent.kind === 'flee'
    || intent.kind === 'rest';
  if (actionable && canRoll) {
    const check = runPlayerCheck(state, intent, raw);
    const outcome = check.isSuccess ? 'success' : 'failure';
    const fact = `Action resolved: ${check.label || intent.label} — ${outcome}.`;
    const receipts = [check.codeResolutionText || fact].filter(Boolean);
    return { receipts, facts: [fact], engineResult: fact };
  }
  if (actionable && !canRoll) {
    const refusal = `Refused: that action cannot be resolved without a built character sheet (${intent.label}).`;
    return { receipts: [refusal], facts: [refusal], engineResult: refusal };
  }
  const refusal = `Refused: that line has no engine resolution (${intent.label}).`;
  return { receipts: [refusal], facts: [refusal], engineResult: refusal };
}
