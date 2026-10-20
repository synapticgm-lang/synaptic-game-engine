/**
 * q77b-DYINGTYPED / q78-SPEECHREPLY / q78r-SPEECHREPAIR — typed free-text engine outcomes.
 * Reuses parsePlayerIntent + checkForAction/runPlayerCheck + interpretRoundTyped.
 * No word lists: intent/resolution path decides action vs speech vs refusal.
 * Talk resolves only for NPCs in the presence record (peopleHere / presentNpcRecords).
 * Named talk to someone not present → visible engine refusal (where, if the ledger knows).
 * Must-react applies only to a present addressee. Writer must not quote the player character.
 *
 * SRD 5.2.1 Communicating (Wizards of the Coast, CC BY 4.0):
 * "You can communicate however you are able to… communicating doesn’t interfere with other Activity."
 * Ability Checks when a contested social action uses CheckSpec (same source).
 */
import type { GameState } from './types';
import { checkForAction, runPlayerCheck } from './checkMath';
import { isSpeechOrProtest, parsePlayerIntent } from './intentParser';
import { chipAddressee, mentionsName, peopleHere } from './chipLegality';
import { resolveNpcRecord } from './npcRecords';
import { interpretRoundTyped } from './tabletop/roundTyped';

export type TypedFreeTextResult = {
  receipts: string[];
  facts: string[];
  /** Visible engine answer for systemLog / completedEvent.engineResult. */
  engineResult: string;
};

/** Shared tail for the writer must-react engine fact. */
export const MUST_REACT_TAIL = 'must react to what you said: reply, refuse, or visibly ignore';
/** Engine fact: writer must not invent the PC's quoted dialogue (plays-player gate). */
export const NO_PC_QUOTED_WORDS =
  'Do not write the player character\'s own quoted words — the player already spoke; NPCs react.';
const SPEECH_CUE = /\bi\s+say\b|\btell\b|\bask\b|\btalk\s+to\b/i;

export function parseMustReactNpc(engineFact: string): string | null {
  const fact = engineFact ?? '';
  const at = fact.toLowerCase().indexOf(MUST_REACT_TAIL);
  if (at < 0) return null;
  let start = at;
  while (start > 0) {
    const ch = fact[start - 1]!;
    if (ch === '.' || ch === '\n') break;
    start -= 1;
  }
  const who = fact.slice(start, at).trim();
  return who || null;
}

/** True when this name is in the engine presence set (peopleHere). */
export function isPresentForTalk(state: GameState, name: string): boolean {
  const who = (name ?? '').trim();
  if (!who) return false;
  const here = peopleHere(state);
  for (let i = 0; i < here.length; i++) {
    if (mentionsName(here[i]!, who) || mentionsName(who, here[i]!)) return true;
  }
  return false;
}

/** Named talk/ask target from a chip or typed line (engine chipAddressee — no word list). */
export function namedSpeechTarget(input: string): string | null {
  const addr = chipAddressee(input);
  if (addr?.kind === 'named' && addr.who.trim()) return addr.who.trim();
  return null;
}

/** In-fiction refusal when the named listener is not in the presence record. */
export function absentTalkRefusal(state: GameState, name: string): string {
  const who = (name ?? '').trim() || 'They';
  const mem = resolveNpcRecord(state, who);
  const where = (mem?.location ?? '').trim();
  const here = (state.currentLocation ?? '').trim();
  if (where && where.toLowerCase() !== here.toLowerCase()) {
    return `${who} is not here — last known at ${where}.`;
  }
  return `${who} is not here.`;
}

/**
 * Presence / scene focus addressee for unnamed speech — never invent a name from the typed line.
 * Prefers sceneFacts.present ∩ peopleHere, else peopleHere[0].
 */
export function speechAddresseeFromPresence(state: GameState): string | null {
  const here = peopleHere(state);
  if (!here.length) return null;
  const present = state.sceneFacts?.present ?? [];
  for (let i = 0; i < present.length; i++) {
    const focus = (present[i] ?? '').trim();
    if (!focus) continue;
    for (let j = 0; j < here.length; j++) {
      if (here[j]!.toLowerCase() === focus.toLowerCase()) return here[j]!;
    }
  }
  return here[0] ?? null;
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
    const facts = [...plan.facts];
    let who: string | null = null;
    let freeSpeech = false;
    for (let i = 0; i < plan.clauses.length; i++) {
      const c = plan.clauses[i]!;
      if (c.kind !== 'speech') continue;
      freeSpeech = true;
      if (c.addressed) { who = c.addressed; break; }
    }
    const named = namedSpeechTarget(raw);
    if (named) {
      if (!isPresentForTalk(state, named)) {
        const refusal = absentTalkRefusal(state, named);
        return { receipts: [refusal], facts: [refusal], engineResult: refusal };
      }
      const here = peopleHere(state);
      who = named;
      for (let i = 0; i < here.length; i++) {
        const p = here[i]!;
        if (p.toLowerCase() === named.toLowerCase() || mentionsName(p, named) || mentionsName(named, p)) {
          who = p;
          break;
        }
      }
      freeSpeech = true;
    } else if (!who && freeSpeech) {
      who = speechAddresseeFromPresence(state);
    }
    if (freeSpeech) {
      let hasPc = false;
      for (let i = 0; i < facts.length; i++) if (facts[i] === NO_PC_QUOTED_WORDS) { hasPc = true; break; }
      if (!hasPc) facts.push(NO_PC_QUOTED_WORDS);
      const name = (who ?? '').trim();
      if (name && name.toLowerCase() !== 'the room') {
        const line = `${name} ${MUST_REACT_TAIL}`;
        let has = false;
        for (let i = 0; i < facts.length; i++) if (facts[i] === line) { has = true; break; }
        if (!has) facts.push(line);
      }
    }
    const engineResult = facts.join(' ').trim() || plan.receipts.join(' ').trim();
    return { receipts: plan.receipts, facts, engineResult };
  }
  const intent = parsePlayerIntent(raw, state);
  const named = namedSpeechTarget(raw);
  const presenceWho = speechAddresseeFromPresence(state);
  const asSpeech =
    intent.kind === 'talk'
    || intent.kind === 'refuse'
    || isSpeechOrProtest(raw)
    || SPEECH_CUE.test(raw)
    || (!!named && raw.includes('?'))
    || (!!presenceWho && raw.includes('?'));
  if (asSpeech) {
    if (named) {
      if (!isPresentForTalk(state, named)) {
        const refusal = absentTalkRefusal(state, named);
        return { receipts: [refusal], facts: [refusal], engineResult: refusal };
      }
      const here = peopleHere(state);
      let seated = named;
      for (let i = 0; i < here.length; i++) {
        const p = here[i]!;
        if (p.toLowerCase() === named.toLowerCase() || mentionsName(p, named) || mentionsName(named, p)) {
          seated = p;
          break;
        }
      }
      const facts = [
        `Speech event: you address ${seated}. NPC reaction slot open for the writer.`,
        NO_PC_QUOTED_WORDS,
        `${seated} ${MUST_REACT_TAIL}`,
      ];
      return { receipts: [`Speech: to ${seated}`], facts, engineResult: facts.join(' ') };
    }
    const addressed = presenceWho ?? 'the room';
    const facts = [`Speech event: you address ${addressed}. NPC reaction slot open for the writer.`, NO_PC_QUOTED_WORDS];
    // q78r: must-react only when a present addressee exists.
    if (presenceWho) facts.push(`${presenceWho} ${MUST_REACT_TAIL}`);
    return { receipts: [`Speech: to ${addressed}`], facts, engineResult: facts.join(' ') };
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

/** Speech-only lines for the writer ENGINE RESULT (skip check rolls; keep absent-talk refusals). */
export function speechEngineLines(typed: TypedFreeTextResult): string[] {
  const out: string[] = [];
  for (let i = 0; i < typed.facts.length; i++) {
    const f = typed.facts[i]!;
    if (
      f.includes(MUST_REACT_TAIL)
      || f.startsWith('Speech event:')
      || f === NO_PC_QUOTED_WORDS
      || f.includes('is not here')
    ) {
      out.push(f);
    }
  }
  for (let i = 0; i < typed.receipts.length; i++) {
    const r = typed.receipts[i]!;
    if (r.startsWith('Speech:') || r.includes('is not here')) out.push(r);
  }
  return out;
}

/** Writer-facing speech facts only — skips non-speech so Look/Travel never rolls here. */
export function typedSpeechForWriter(state: GameState, input: string): string[] {
  const raw = (input ?? '').trim();
  if (!raw) return [];
  if (state.activeEncounter || state.roundCombat) {
    const plan = interpretRoundTyped(state, raw);
    let speech = false;
    for (let i = 0; i < plan.clauses.length; i++) {
      if (plan.clauses[i]!.kind === 'speech') { speech = true; break; }
    }
    if (!speech && !namedSpeechTarget(raw)) return [];
  } else {
    const intent = parsePlayerIntent(raw, state);
    const named = namedSpeechTarget(raw);
    const who = speechAddresseeFromPresence(state);
    const asSpeech =
      intent.kind === 'talk'
      || intent.kind === 'refuse'
      || isSpeechOrProtest(raw)
      || SPEECH_CUE.test(raw)
      || (!!named && raw.includes('?'))
      || (!!who && raw.includes('?'));
    if (!asSpeech) return [];
  }
  return speechEngineLines(resolveTypedFreeText(state, input));
}
