/**
 * Shared rules engine — combat presenter (the mode profile).
 * The engine rolls the same dice in every mode; this decides what each mode shows.
 * Tabletop: every roll openly on STATUS. LitRPG: System-window receipts, no dice. Story RPG: no stat lines.
 * The writer gets the same word-only facts in every mode (no numbers): it narrates, the engine counts.
 */
import type { EngineMode } from '../types';
import type { AdvState } from '../checkRules';
import { formatDice, signed } from './dice';
import type { CombatEvent, DeathSaveResult, RoundOutcome } from './roundCombat';

type Ev = CombatEvent & { round: number };

function d20Text(d20s: number[], kept: number, adv: AdvState): string {
  return adv === 'normal' || d20s.length < 2 ? `d20 ${kept}` : `d20 (${adv === 'advantage' ? 'adv' : 'dis'}: ${d20s.join(', ')}) ${kept}`;
}

const who = (name: string, pc: boolean) => (pc ? 'you' : name);

function tabletopLine(e: Ev, pcName: string): string | null {
  switch (e.k) {
    case 'initiative':
      return null;
    case 'attack': {
      if (!e.d20s.length) {
        return `${who(e.attacker, e.pc)} ${e.with}: ${e.damage ? formatDice(e.damage) : 0} ${e.type ?? ''}${e.vulnerable ? ' ×2 (vulnerable)' : ''}; ${e.target} HP ${e.hpBefore} → ${e.hpAfter}`.replace(/ {2,}/g, ' ');
      }
      const head = `${who(e.attacker, e.pc)}${e.opportunity ? ' opportunity attack,' : ''} ${e.with} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)} = ${e.total} vs AC ${e.ac}`;
      if (!e.hit) return `${head}: ${e.nat1 ? 'miss (natural 1)' : 'miss'}`;
      const parts = [e.damage ? formatDice(e.damage) : '', e.sneak ? `Sneak Attack ${formatDice(e.sneak)}` : '', e.extra ? `${formatDice(e.extra)} poison` : '']
        .filter(Boolean)
        .join(' + ');
      const hpOf = e.target === pcName ? 'your HP' : `${e.target} HP`;
      return `${head}: ${e.crit ? 'critical hit' : 'hit'}, ${parts} ${e.type ?? ''}${e.vulnerable ? ' ×2 (vulnerable)' : ''} = ${e.dealt}; ${hpOf} ${e.hpBefore} → ${e.hpAfter}`.replace(/ {2,}/g, ' ');
    }
    case 'save':
      if (e.autoFail) return `${who(e.who, e.pc)} ${e.ability} save ${e.why}: automatic failure`;
      return `${who(e.who, e.pc)} ${e.ability} save ${e.why} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)} = ${e.total} vs DC ${e.dc}: ${e.ok ? 'success' : 'failure'}`;
    case 'check':
      return `${who(e.who, e.who === pcName)} ${e.label} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)} = ${e.total} vs ${e.label === 'Perception' ? 'your Stealth' : 'DC'} ${e.dc}: ${e.ok ? 'success' : 'failure'} (${e.why})`;
    case 'condition':
      return `${who(e.who, e.pc)} ${e.on ? 'gain' : 'lose'}${e.pc ? '' : 's'} ${e.name} (${e.why})`;
    case 'act':
      return e.action === 'other' ? null : `${who(e.who, e.pc)}: ${e.action === 'stand' ? 'stand' : e.action === 'skip' ? 'turn lost' : e.action} — ${e.detail}`;
    case 'heal':
      return `you drink ${e.item}: ${formatDice(e.roll)}; HP ${e.hpBefore} → ${e.hpAfter}`;
    case 'down':
      return e.pc ? (e.massive ? 'you are killed outright (massive damage)' : 'you drop to 0 HP: Unconscious, making death saves') : `${e.who} drops to 0 HP`;
    case 'fortitude':
      return `${e.who} stays up at 1 HP (Undead Fortitude)`;
  }
}

/** Tabletop STATUS: an Initiative line, then one "Round N —" line per round with every roll in order. */
export function tabletopCombatLines(events: Ev[], pcName: string): string[] {
  const lines: string[] = [];
  const init = events.filter((e) => e.k === 'initiative') as Array<Extract<Ev, { k: 'initiative' }>>;
  if (init.length) {
    const parts = init.map((e) => `${e.who === pcName ? 'you' : e.who} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)} = ${e.total}`);
    lines.push(`Initiative — ${parts.join('; ')}`);
  }
  const rounds = [...new Set(events.filter((e) => e.k !== 'initiative').map((e) => e.round))];
  for (const n of rounds) {
    const bits = events.filter((e) => e.round === n && e.k !== 'initiative').map((e) => tabletopLine(e, pcName)).filter(Boolean);
    if (bits.length) lines.push(`Round ${n} — ${bits.join('; ')}`);
  }
  return lines;
}

/** LitRPG: System-window receipts, outcome only. */
function litrpgLines(events: Ev[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    if (e.k === 'attack' && e.hit) out.push(e.pc ? `Hit: ${e.target} −${e.dealt} HP${e.crit ? ' (Critical)' : ''}` : `Damage taken: −${e.dealt} HP`);
    if (e.k === 'condition' && e.on) out.push(`Status effect: ${e.name}`);
  }
  return out;
}

export function presentCombatStatus(mode: EngineMode | undefined, events: Ev[], pcName: string): string[] {
  if (mode === 'dnd') return tabletopCombatLines(events, pcName);
  if (mode === 'litrpg') return litrpgLines(events);
  return [];
}

const NATURAL = /^(?:bite|claws?|slam|talons?|tentacles?|horns?|tail|life drain|fist)$/i;

/** "its slam", "a scimitar", "your greatsword" */
function weaponWords(name: string, owner: 'its' | 'your' | 'a'): string {
  const w = name.toLowerCase();
  if (owner === 'your') return `your ${w}`;
  if (NATURAL.test(w)) return `its ${w}`;
  return `${/^[aeiou]/.test(w) ? 'an' : 'a'} ${w}`;
}

function hurtWord(hpAfter: number, maxHp: number): string {
  if (hpAfter <= 0) return 'goes down';
  if (hpAfter * 2 <= maxHp) return 'is badly hurt';
  return 'is wounded';
}

/** Word-only facts for the writer, in the order things happened. Same for every mode. */
export function combatFacts(events: Ev[], pcName: string): string[] {
  const out: string[] = [];
  for (const e of events) {
    switch (e.k) {
      case 'initiative':
        break;
      case 'attack': {
        if (e.pc) {
          const spell = !e.d20s.length || /^(?:fire bolt|sacred flame)$/i.test(e.with);
          const by = spell ? e.with : weaponWords(e.with, 'your');
          if (!e.hit) out.push(`You attack ${e.target} with ${by} and miss.`);
          else out.push(`You ${e.crit ? 'land a critical blow on' : 'hit'} ${e.target} with ${by}; it ${hurtWord(e.hpAfter, e.maxHp)}.`);
        } else if (e.target === pcName) {
          const how = e.opportunity ? ' as you break away' : '';
          const by = weaponWords(e.with, 'a');
          if (!e.hit) out.push(`${e.attacker} attacks you with ${by}${how} and misses.`);
          else out.push(`${e.attacker} ${e.crit ? 'lands a critical blow on' : 'hits'} you with ${by}${how}.`);
        } else {
          out.push(`${e.attacker} ${e.hit ? 'hits' : 'misses'} ${e.target}.`);
        }
        break;
      }
      case 'save':
        if (e.why === 'Undead Fortitude') break;
        out.push(e.pc ? `You ${e.ok ? 'resist' : 'fail to resist'} ${e.why.replace(/^against /, '')}.` : `${e.who} ${e.ok ? 'avoids' : 'is caught by'} ${e.why.replace(/^against /, '')}.`);
        break;
      case 'check':
        if (e.label === 'Stealth') out.push(e.ok ? 'You slip out of sight.' : 'You try to hide but stay in plain view.');
        else if (e.ok) out.push(`${e.who} finds you.`);
        break;
      case 'condition':
        if (e.on) out.push(e.pc ? `You are ${e.name.toLowerCase()}.` : `${e.who} is ${e.name.toLowerCase()}.`);
        break;
      case 'act':
        if (e.action === 'dodge') out.push('You fight defensively, dodging.');
        else if (e.action === 'stand') out.push('You get back to your feet.');
        else if (e.action === 'skip') out.push(e.pc ? 'You cannot move or act this round.' : `${e.who} cannot act this round.`);
        else if (e.action === 'disengage') out.push(/get clear/.test(e.detail) ? 'You disengage and get clear.' : 'You step back carefully, but the foe keeps pace.');
        else if (e.action === 'flee') out.push(/cannot/.test(e.detail) ? 'You try to run but cannot move.' : 'You turn and run.');
        else if (e.action === 'help') out.push(/no ally/.test(e.detail) ? 'You look for an ally to help, but none is beside you.' : 'You distract the foe for your ally.');
        break;
      case 'heal':
        out.push(`You drink ${e.item} and feel stronger.`);
        break;
      case 'down':
        if (e.pc) out.push(e.massive ? 'The blow kills you outright.' : 'You fall unconscious.');
        break;
      case 'fortitude':
        out.push(`${e.who} should have fallen but stays on its feet.`);
        break;
    }
  }
  return out;
}

export function deathSaveLine(r: DeathSaveResult, secret = false): string {
  const tally = `${r.state.successes} success${r.state.successes === 1 ? '' : 'es'}, ${r.state.failures} failure${r.state.failures === 1 ? '' : 's'}`;
  if (secret) return 'Death save: rolled in secret';
  if (r.result === 'revived') return `Death save: d20 20 — natural 20, you regain 1 HP`;
  const tail = r.state.dead ? ' — dead' : r.state.stable ? ` — stable; you wake with 1 HP after 1d4 (${r.hoursToWake}) hours` : '';
  return `Death save: d20 ${r.d20} — ${r.result} (${tally})${tail}`;
}

export function roundOutcomeWord(o: RoundOutcome): string {
  return o === 'victory' ? 'won' : o === 'escaped' ? 'escaped' : o === 'down' ? 'down' : o === 'dead' ? 'dead' : 'ongoing';
}
