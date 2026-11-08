/**
 * q75-ROUNDTYPED — typed input during round combat.
 * SRD 5.2.1 (Wizards of the Coast, CC BY 4.0) — Communicating:
 * "You can communicate however you are able, through brief utterances and gestures, as you take your turn."
 * Brief speech costs no Action. Influence is an Action with a Charisma check.
 * Improvising an Action: GM picks a fitting D20 Test and effect. Multi-part lines spend Action / move.
 * No new word lists: reuse classifyRoundAction, parsePlayerIntent, isContestedSocialAction, runPlayerCheck.
 */
import type { GameState } from '../types';
import { isContestedSocialAction, runPlayerCheck, type PlayerCheckResult } from '../checkMath';
import { isSpeechOrProtest, parsePlayerIntent, parsePlayerSteps, sheetContextFromState, type PlayerIntent } from '../intentParser';
import { presentNpcNames } from '../npcRelationships';
import type { RoundAction } from '../rules/roundCombat';
import { spellInInput } from '../rules/spells';
import { classifyRoundAction } from './roundActionClass';

export type RoundSpeechRole = 'ally' | 'foe' | 'present' | 'none';
export type RoundSpeechReaction = 'ally-may-act' | 'foe-may-react' | 'present-may-reply' | 'none';
export type RoundTypedClause =
  | { kind: 'speech'; text: string; addressed: string | null; role: RoundSpeechRole; reaction: RoundSpeechReaction }
  | { kind: 'influence'; text: string; action: RoundAction; check: PlayerCheckResult }
  | { kind: 'srd'; text: string; action: RoundAction }
  | { kind: 'improvise'; text: string; action: RoundAction; check: PlayerCheckResult; effect: string; moveFt: number }
  | { kind: 'illegal'; text: string; reason: string };

export { classifyRoundAction };

export interface RoundTypedPlan {
  clauses: RoundTypedClause[];
  primaryAction: RoundAction;
  accepted: true;
  freeSpeechOnly: boolean;
  facts: string[];
  receipts: string[];
}

function sameEntity(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return !!x && x === y;
}

/** Live foe, living ally, someone already here, or a known person who is not. Unknown words are not people. */
function knownPersonBucket(state: GameState, name: string): RoundSpeechRole | null {
  const foes = state.roundCombat?.foes ?? [];
  for (let i = 0; i < foes.length; i++) {
    if (!sameEntity(foes[i]!.name, name)) continue;
    return foes[i]!.hp > 0 ? 'foe' : 'none';
  }
  if (state.activeEncounter && sameEntity(state.activeEncounter.name, name)) return 'foe';
  const comps = state.companions ?? [];
  for (let i = 0; i < comps.length; i++) {
    if (!sameEntity(comps[i]!.name ?? '', name)) continue;
    return (comps[i]!.hp ?? 0) > 0 ? 'ally' : 'none';
  }
  const present = presentNpcNames(state);
  for (let i = 0; i < present.length; i++) if (sameEntity(present[i]!, name)) return 'present';
  const memories = state.npcMemories ?? [];
  for (let i = 0; i < memories.length; i++) {
    const m = memories[i]!;
    const hit = sameEntity(m.npcName, name) || (m.aliases ?? []).some((a) => sameEntity(a, name));
    if (!hit) continue;
    return m.present === true ? 'present' : 'none';
  }
  return null;
}

/**
 * Who a mechanical line is aimed at, using the step reader (quote bodies are not addressees).
 * A spell or a carried item is not a person. An explicit attack or bargain object the engine
 * cannot place is still a target: it must not fall through onto a different live actor.
 */
/** Object of an attack or bargain. "with a dagger" is a weapon, not a person. No name means no explicit target. */
function grammaticalObject(line: string, kind: 'attack' | 'bargain'): string | null {
  if (kind === 'attack') {
    const hit = line.match(/\b(?:lash out|loose an arrow|attack|fight|strike|engage|slash|stab|shoot|punch|swing|hit|thrust|cut|charge)\b\s*(.*)$/i);
    if (!hit) return null;
    let rest = (hit[1] ?? '').trim().replace(/^(?:at|toward|towards)\s+/i, '');
    if (!rest || /^with\b/i.test(rest)) return null;
    rest = rest.replace(/^(?:the|a|an)\s+/i, '');
    const withAt = rest.search(/\s+with\s+/i);
    if (withAt >= 0) rest = rest.slice(0, withAt).trim();
    rest = rest.replace(/[.!?]+$/, '').trim();
    return rest || null;
  }
  const hit = line.match(/\b(?:negotiate|persuade|convince|intimidate|threaten|bargain|bribe|deceive|bluff)\b\s*(.*)$/i);
  if (!hit) return null;
  let rest = (hit[1] ?? '').trim().replace(/^with\s+/i, '').replace(/^(?:the|a|an)\s+/i, '');
  if (!rest) return null;
  const cut = rest.search(/\s+(?:to|and)\s+|:/i);
  if (cut >= 0) rest = rest.slice(0, cut).trim();
  rest = rest.replace(/[.!?]+$/, '').trim();
  return rest || null;
}

function aimedPerson(state: GameState, line: string): { name: string; role: RoundSpeechRole } | null {
  if (spellInInput(line)) return null;
  const vocative = line.match(/^([A-Za-z][\w'-]*)\s*[,!]/);
  if (vocative) {
    const vocRole = knownPersonBucket(state, vocative[1]!);
    if (vocRole === 'none') return { name: vocative[1]!, role: 'none' };
  }
  const ctx = sheetContextFromState(state);
  const extra: string[] = [];
  const foes = state.roundCombat?.foes ?? [];
  for (let i = 0; i < foes.length; i++) extra.push(foes[i]!.name);
  const memories = state.npcMemories ?? [];
  for (let i = 0; i < memories.length; i++) {
    const aliases = memories[i]!.aliases ?? [];
    for (let a = 0; a < aliases.length; a++) extra.push(aliases[a]!);
  }
  const read = parsePlayerSteps(line, { ...ctx, people: [...ctx.people, ...extra] });
  const step = read.steps[0];
  if (!step) return null;
  const mechanical = step.action === 'attack' || step.action === 'cast' || step.action === 'persuade'
    || step.action === 'intimidate' || step.action === 'deceive';
  let name = (mechanical ? (step.target || step.addressee) : step.addressee)?.trim() ?? '';
  if (!name && mechanical) {
    const known = [...extra, ...ctx.people].filter((n) => n.trim().length >= 3);
    known.sort((a, b) => b.length - a.length);
    const lowLine = line.toLowerCase();
    for (let i = 0; i < known.length; i++) {
      if (lowLine.includes(known[i]!.trim().toLowerCase())) { name = known[i]!.trim(); break; }
    }
  }
  if (!name && (step.action === 'attack' || step.action === 'persuade' || step.action === 'intimidate' || step.action === 'deceive')) {
    const spoken = grammaticalObject(line, step.action === 'attack' ? 'attack' : 'bargain');
    if (spoken && !ctx.items.some((item) => sameEntity(item, spoken))) {
      const role = knownPersonBucket(state, spoken);
      return { name: spoken, role: role ?? 'none' };
    }
  }
  if (!name) return null;
  if (ctx.items.some((item) => sameEntity(item, name))) return null;
  const role = knownPersonBucket(state, name);
  if (!role) return null;
  if (!mechanical && step.action !== 'talk') return null;
  return { name, role };
}

/** Map a typed line to SRD round resolution. Speech is always accepted. */
export function interpretRoundTyped(state: GameState, input: string): RoundTypedPlan {
  // Collapse whitespace without a regex literal (ruleCount).
  let raw = '';
  {
    const s = input ?? '';
    let gap = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s.charCodeAt(i);
      if (ch <= 32) {
        if (raw && !gap) { raw += ' '; gap = true; }
      } else {
        raw += s[i];
        gap = false;
      }
    }
    raw = raw.trim();
  }
  const facts: string[] = [];
  const receipts: string[] = [];
  if (!raw) {
    return {
      clauses: [{ kind: 'illegal', text: '', reason: 'No action was typed.' }],
      primaryAction: 'other',
      accepted: true,
      freeSpeechOnly: false,
      facts: ['Nothing was attempted this round.'],
      receipts: ['Round: empty input — no Action spent; foes still act.'],
    };
  }

  // Multi-part: "X then Y" / "X and then Y" within one turn's action economy (no regex).
  const useParts: string[] = [];
  {
    const low = raw.toLowerCase();
    const sepA = ' and then ';
    const sepB = ' then ';
    const sepC = ', then ';
    const marks: number[] = [0];
    let i = 0;
    while (i < low.length) {
      let hit = -1;
      let sepLen = 0;
      if (low.startsWith(sepA, i)) { hit = i; sepLen = sepA.length; }
      else if (low.startsWith(sepB, i)) { hit = i; sepLen = sepB.length; }
      else if (low.startsWith(sepC, i)) { hit = i; sepLen = sepC.length; }
      if (hit >= 0) {
        marks.push(hit);
        marks.push(hit + sepLen);
        i = hit + sepLen;
      } else i++;
    }
    marks.push(raw.length);
    for (let m = 0; m + 1 < marks.length; m += 2) {
      let a = marks[m]!;
      let b = marks[m + 1]!;
      while (a < b && '.,!;'.includes(raw[a]!)) a++;
      while (b > a && '.,!;'.includes(raw[b - 1]!)) b--;
      const chunk = raw.slice(a, b).trim();
      if (chunk.length >= 2) useParts.push(chunk);
    }
    if (useParts.length < 2) {
      useParts.length = 0;
      useParts.push(raw);
    }
  }

  const clauses: RoundTypedClause[] = [];
  for (let pi = 0; pi < useParts.length; pi++) {
    let trimmed = '';
    {
      const s = useParts[pi]!;
      let gap = false;
      for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i);
        if (ch <= 32) {
          if (trimmed && !gap) { trimmed += ' '; gap = true; }
        } else {
          trimmed += s[i];
          gap = false;
        }
      }
      trimmed = trimmed.trim();
    }
    const intent = parsePlayerIntent(trimmed, state);
    const srd = classifyRoundAction(trimmed);
    const low = trimmed.toLowerCase();
    let who: string | null = null;
    const enc = state.activeEncounter?.name?.trim();
    if (enc && low.includes(enc.toLowerCase())) who = enc;
    if (!who) {
      const foes = state.roundCombat?.foes ?? [];
      for (let i = 0; i < foes.length; i++) {
        const n = foes[i]!.name?.trim();
        if (n && foes[i]!.hp > 0 && low.includes(n.toLowerCase())) { who = n; break; }
      }
    }
    if (!who) {
      const present = presentNpcNames(state);
      for (let i = 0; i < present.length; i++) {
        const name = present[i]!.trim();
        if (name && low.includes(name.toLowerCase())) { who = name; break; }
      }
    }
    if (!who) {
      const comps = state.companions ?? [];
      for (let i = 0; i < comps.length; i++) {
        const name = (comps[i]!.name ?? '').trim();
        if (name && (comps[i]!.hp ?? 0) > 0 && low.includes(name.toLowerCase())) { who = name; break; }
      }
    }
    let role: RoundSpeechRole = 'none';
    if (who) {
      const wl = who.toLowerCase();
      if (state.activeEncounter?.name?.toLowerCase() === wl) role = 'foe';
      else {
        const foes = state.roundCombat?.foes ?? [];
        for (let i = 0; i < foes.length; i++) {
          if (foes[i]!.hp > 0 && foes[i]!.name.toLowerCase() === wl) { role = 'foe'; break; }
        }
      }
      if (role === 'none') {
        const comps = state.companions ?? [];
        for (let i = 0; i < comps.length; i++) {
          if ((comps[i]!.name ?? '').toLowerCase() === wl && (comps[i]!.hp ?? 0) > 0) { role = 'ally'; break; }
        }
      }
      if (role === 'none') {
        const present = presentNpcNames(state);
        for (let i = 0; i < present.length; i++) {
          if (present[i]!.toLowerCase() === wl) { role = 'present'; break; }
        }
      }
    }

    const aim = aimedPerson(state, trimmed);
    let clause: RoundTypedClause;
    if (aim && aim.role === 'none' && (srd === 'attack' || srd === 'cast' || srd === 'help' || srd === 'other' || isContestedSocialAction(intent, trimmed))) {
      clause = { kind: 'speech', text: trimmed, addressed: aim.name, role: 'none', reaction: 'none' };
    } else if (aim && aim.role !== 'foe' && (srd === 'attack' || srd === 'cast')) {
      const reaction: RoundSpeechReaction = aim.role === 'ally' ? 'ally-may-act' : 'present-may-reply';
      clause = { kind: 'speech', text: trimmed, addressed: aim.name, role: aim.role, reaction };
    } else if (srd !== 'other') {
      clause = { kind: 'srd', text: trimmed, action: srd };
    } else if (isContestedSocialAction(intent, trimmed)) {
      const talkIntent: PlayerIntent =
        intent.kind === 'talk' || intent.kind === 'refuse' ? intent : { kind: 'talk', label: 'Social', targets: [] };
      const check = runPlayerCheck(state, talkIntent, trimmed);
      clause = {
        kind: 'influence',
        text: trimmed,
        action: 'other',
        check: { ...check, skill: check.skill ?? 'persuasion', label: check.label || 'Influence (Persuasion)' },
      };
    } else {
      const freeSpeech =
        intent.kind === 'talk' || intent.kind === 'refuse' || isSpeechOrProtest(trimmed)
          ? !isContestedSocialAction(intent, trimmed)
          : role !== 'none' && intent.kind !== 'attack' && intent.kind !== 'cast' && intent.kind !== 'flee';
      if (role === 'ally' || role === 'foe' || role === 'present' || freeSpeech) {
        const r: RoundSpeechRole = role === 'none' && freeSpeech ? 'none' : role;
        const reaction: RoundSpeechReaction =
          r === 'ally' ? 'ally-may-act' : r === 'foe' ? 'foe-may-react' : r === 'present' ? 'present-may-reply' : 'none';
        clause = { kind: 'speech', text: trimmed, addressed: who, role: r, reaction };
      } else if (intent.kind === 'move' || intent.kind === 'search' || intent.kind === 'observe' || intent.kind === 'use_item' || trimmed.split(' ').length >= 4) {
        const check = runPlayerCheck(state, intent, trimmed);
        const moveFt = intent.kind === 'move' ? 15 : 0;
        const effect = intent.kind === 'move'
          ? (check.isSuccess ? 'you reach cover' : 'you do not make cover cleanly')
          : (check.isSuccess
            ? 'the improvised action works (SRD Improvising an Action — fitting D20 Test; may impose a condition at GM discretion)'
            : 'the improvised action fails');
        clause = { kind: 'improvise', text: trimmed, action: 'other', check, effect, moveFt };
      } else {
        clause = {
          kind: 'illegal',
          text: trimmed,
          reason: `That is not a legal combat action this round (${intent.label}). Try Attack, Cast, Dodge, Disengage, Hide, Help, Use an Object, Flee, speak freely, or describe an action the rules can resolve.`,
        };
      }
    }
    clauses.push(clause);
  }

  let primaryAction: RoundAction = 'speech';
  let sawMechanical = false;
  let freeSpeechOnly = clauses.length > 0;
  for (let i = 0; i < clauses.length; i++) {
    const c = clauses[i]!;
    if (c.kind !== 'speech') freeSpeechOnly = false;
    if (c.kind === 'speech') {
      const who = c.addressed && c.role !== 'none' ? ` to ${c.addressed}` : '';
      facts.push(`You speak freely${who} (no Action): "${c.text}"`);
      if (c.role === 'none' && c.addressed) {
        facts.push(`${c.addressed} is not here, so no one answers and no strike lands.`);
      }
      if (c.reaction === 'ally-may-act') facts.push(`${c.addressed} may act on that instruction on its own turn.`);
      else if (c.reaction === 'foe-may-react') facts.push(`${c.addressed} may ignore, answer, or react in character.`);
      else if (c.reaction === 'present-may-reply') facts.push(`${c.addressed} may reply, ignore, or react.`);
      receipts.push('Speech: free (SRD Communicating — no Action)');
      if (!sawMechanical) primaryAction = 'speech';
    } else if (c.kind === 'influence') {
      sawMechanical = true;
      primaryAction = 'other';
      facts.push(`You attempt an Influence action: ${c.check.label} — ${c.check.isSuccess ? 'success' : 'failure'}.`);
      receipts.push(c.check.codeResolutionText);
      facts.push(c.check.isSuccess
        ? 'The Influence check succeeds; the foe may stand down or shift stance.'
        : 'The Influence check fails; the foe keeps fighting.');
    } else if (c.kind === 'srd') {
      sawMechanical = true;
      primaryAction = c.action;
      facts.push(`You take the ${c.action} action.`);
    } else if (c.kind === 'improvise') {
      sawMechanical = true;
      primaryAction = 'other';
      facts.push(`Improvised action: ${c.text} — ${c.check.isSuccess ? 'success' : 'failure'}; ${c.effect}.`);
      receipts.push(c.check.codeResolutionText);
      if (c.moveFt > 0) {
        facts.push(`You spend ${c.moveFt} feet of movement.`);
        receipts.push(`Movement: ${c.moveFt} ft`);
      }
    } else {
      facts.push(c.reason);
      receipts.push(`Round: ${c.reason}`);
      if (!sawMechanical) primaryAction = 'other';
    }
  }
  for (let i = 0; i < clauses.length; i++) {
    if (clauses[i]!.kind === 'srd') {
      primaryAction = (clauses[i] as { action: RoundAction }).action;
      break;
    }
  }
  return { clauses, primaryAction, accepted: true, freeSpeechOnly, facts, receipts };
}
