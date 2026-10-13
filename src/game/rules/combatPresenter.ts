/**
 * Shared rules engine — combat presenter (the mode profile).
 * The engine rolls the same dice in every mode; this decides what each mode shows.
 * Tabletop: every roll openly on STATUS. LitRPG: System-window receipts, no dice. Story RPG: no stat lines.
 * The writer gets the same word-only facts in every mode (no numbers): it narrates, the engine counts.
 */
import type { EngineMode } from '../types';
import type { AdvState } from '../checkRules';
import { formatDice, signed } from './dice';
import type { CombatEvent, DeathSaveResult, InspirationUse, RoundOutcome } from './roundCombat';
import { SPELLS } from './spells';

type Ev = CombatEvent & { round: number };

function d20Text(d20s: number[], kept: number, adv: AdvState): string {
  return adv === 'normal' || d20s.length < 2 ? `d20 ${kept}` : `d20 (${adv === 'advantage' ? 'adv' : 'dis'}: ${d20s.join(', ')}) ${kept}`;
}

const who = (name: string, pc: boolean) => (pc ? 'you' : name);

/** Bless and Bane dice inside a d20 line: "+ Bless 1d4 (3)", "− Bane 1d4 (2)". */
function dieMods(e: { bless?: number; bane?: number }): string {
  return `${e.bless ? ` + Bless 1d4 (${e.bless})` : ''}${e.bane ? ` − Bane 1d4 (${e.bane})` : ''}`;
}

/** How the tabletop STATUS shows rolls: open (every die) or hidden GM rolls (the foes' dice stay behind the screen). */
export interface TabletopView {
  hiddenFoeRolls?: boolean;
}

/** A roll made for the foes (not the PC and not the PC's sidekick). */
function foeRoll(e: Ev): boolean {
  if (e.k === 'attack') return !e.pc && !e.sidekick;
  if (e.k === 'save') return !e.pc;
  if (e.k === 'check') return e.label === 'Perception';
  return false;
}

function inspirationTag(e: { inspiration?: InspirationUse }): string {
  if (!e.inspiration) return '';
  return e.inspiration.mode === 'reroll' ? ` (Heroic Inspiration: rerolled d20 ${e.inspiration.first})` : ' (Heroic Inspiration: Advantage)';
}

/** A foe roll behind the screen: the result only, no die, modifier, AC or DC. */
function hiddenLine(e: Ev, pcName: string): string | null {
  if (e.k === 'attack') {
    const opp = e.opportunity ? ' opportunity attack,' : '';
    if (!e.hit) return `${e.attacker}${opp} ${e.with}: miss`;
    const hpOf = e.target === pcName ? 'your HP' : `${e.target} HP`;
    return `${e.attacker}${opp} ${e.with}: ${e.crit ? 'critical hit' : 'hit'}, ${e.dealt} ${e.type ?? ''} damage; ${hpOf} ${e.hpBefore} → ${e.hpAfter}`.replace(/ {2,}/g, ' ');
  }
  if (e.k === 'save') return `${e.who} ${e.ability} save ${e.why}: ${e.ok ? 'success' : 'failure'}`;
  if (e.k === 'check') return `${e.who} ${e.label}: ${e.why}`;
  return null;
}

function tabletopLine(e: Ev, pcName: string, view: TabletopView = {}): string | null {
  if (view.hiddenFoeRolls && foeRoll(e)) return hiddenLine(e, pcName);
  switch (e.k) {
    case 'initiative':
      return null;
    case 'attack': {
      const halfTxt = e.half ? `, halved = ${e.dealt}` : '';
      if (e.cleave) {
        return `cleave: ${e.total} also beats ${e.target} AC ${e.ac}, ${e.dealt} leftover ${e.type ?? ''} damage; ${e.target} HP ${e.hpBefore} → ${e.hpAfter}`.replace(/ {2,}/g, ' ');
      }
      if (!e.d20s.length) {
        return `${who(e.attacker, e.pc)} ${e.with}: ${e.damage ? formatDice(e.damage) : 0}${halfTxt} ${e.type ?? ''}${e.vulnerable ? ' ×2 (vulnerable)' : ''}; ${e.target} HP ${e.hpBefore} → ${e.hpAfter}`.replace(/ {2,}/g, ' ');
      }
      const head = `${who(e.attacker, e.pc)}${e.opportunity ? ' opportunity attack,' : ''} ${e.with}${e.flank ? ' (flanking)' : ''} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)}${dieMods(e)} = ${e.total} vs AC ${e.ac}${inspirationTag(e)}`;
      if (!e.hit && e.half && e.damage) {
        return `${head}: miss; Potent Cantrip ${formatDice(e.damage)} halved = ${e.dealt}; ${e.target} HP ${e.hpBefore} → ${e.hpAfter}`;
      }
      if (!e.hit) return `${head}: ${e.nat1 ? 'miss (natural 1)' : 'miss'}`;
      const parts = [e.damage ? formatDice(e.damage) : '', e.sneak ? `Sneak Attack ${formatDice(e.sneak)}` : '', e.extra ? `${formatDice(e.extra)} poison` : '']
        .filter(Boolean)
        .join(' + ');
      const hpOf = e.target === pcName ? 'your HP' : `${e.target} HP`;
      return `${head}: ${e.crit ? 'critical hit' : 'hit'}, ${parts} ${e.type ?? ''}${e.vulnerable ? ' ×2 (vulnerable)' : ''} = ${e.dealt}; ${hpOf} ${e.hpBefore} → ${e.hpAfter}`.replace(/ {2,}/g, ' ');
    }
    case 'save':
      if (e.autoFail) return `${who(e.who, e.pc)} ${e.ability} save ${e.why}: automatic failure`;
      return `${who(e.who, e.pc)} ${e.ability} save ${e.why} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)}${dieMods(e)} = ${e.total} vs DC ${e.dc}: ${e.ok ? 'success' : 'failure'}${inspirationTag(e)}`;
    case 'cast': {
      const tags = [e.slot ? `level ${e.slot} slot` : '', e.concentration ? 'concentration' : ''].filter(Boolean).join(', ');
      return `${who(e.who, true)} cast ${e.spell}${tags ? ` (${tags})` : ''}`;
    }
    case 'concentration':
      return `you lose concentration on ${e.spell} (${e.why})`;
    case 'check':
      return `${who(e.who, e.who === pcName)} ${e.label} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)} = ${e.total} vs ${e.label === 'Perception' ? 'your Stealth' : 'DC'} ${e.dc}: ${e.ok ? 'success' : 'failure'} (${e.why})`;
    case 'condition':
      return `${who(e.who, e.pc)} ${e.on ? 'gain' : 'lose'}${e.pc ? '' : 's'} ${e.name} (${e.why})`;
    case 'act':
      return e.action === 'other' ? null : `${who(e.who, e.pc)}: ${e.action === 'stand' ? 'stand' : e.action === 'skip' ? 'turn lost' : e.action} — ${e.detail}`;
    case 'heal':
      if (e.who !== pcName) return `${e.who} casts ${e.item} on you: ${formatDice(e.roll)}; HP ${e.hpBefore} → ${e.hpAfter}`;
      if (e.spell) return `you cast ${e.item}${e.slot ? ` (level ${e.slot} slot)` : ''}: ${formatDice(e.roll)}; HP ${e.hpBefore} → ${e.hpAfter}`;
      return `you drink ${e.item}: ${formatDice(e.roll)}; HP ${e.hpBefore} → ${e.hpAfter}`;
    case 'down':
      if (e.sidekick) return `${e.who} drops to 0 HP (down until the fight ends)`;
      return e.pc ? (e.massive ? 'you are killed outright (massive damage)' : 'you drop to 0 HP: Unconscious, making death saves') : `${e.who} drops to 0 HP`;
    case 'fortitude':
      return `${e.who} stays up at 1 HP (Undead Fortitude)`;
  }
}

/** Tabletop STATUS: an Initiative line, then one "Round N —" line per round with every roll in order. */
export function tabletopCombatLines(events: Ev[], pcName: string, view: TabletopView = {}): string[] {
  const lines: string[] = [];
  const init = events.filter((e) => e.k === 'initiative') as Array<Extract<Ev, { k: 'initiative' }>>;
  if (init.length) {
    const parts = init.map((e) => (e.who === pcName
      ? `you ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)} = ${e.total}`
      : view.hiddenFoeRolls ? `${e.who} rolled behind the screen` : `${e.who} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)} = ${e.total}`));
    lines.push(`Initiative — ${parts.join('; ')}`);
  }
  const rounds = [...new Set(events.filter((e) => e.k !== 'initiative').map((e) => e.round))];
  for (const n of rounds) {
    const bits = events.filter((e) => e.round === n && e.k !== 'initiative').map((e) => tabletopLine(e, pcName, view)).filter(Boolean);
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

export function presentCombatStatus(mode: EngineMode | undefined, events: Ev[], pcName: string, view: TabletopView = {}): string[] {
  if (mode === 'dnd') return tabletopCombatLines(events, pcName, view);
  if (mode === 'litrpg') return litrpgLines(events);
  return [];
}

const NATURAL = /^(?:bite|claws?|slam|talons?|tentacles?|horns?|tail|life drain|fist)$/i;

/** Spell marks on a foe, in words. */
const FOE_MARK: Record<string, string> = {
  Bane: 'is cursed by your Bane',
  'Guiding Bolt': 'glows with the light of your Guiding Bolt',
  Prone: 'falls prone',
};

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
        if (e.cleave) {
          out.push(`Your blow carries on into ${e.target}; it ${hurtWord(e.hpAfter, e.maxHp)}.`);
        } else if (e.pc) {
          const spell = !e.d20s.length || !!e.spell || /^(?:fire bolt|sacred flame)$/i.test(e.with);
          const by = spell ? e.with : weaponWords(e.with, 'your');
          if (e.half) out.push(`${e.target} only partly escapes ${by}; it ${hurtWord(e.hpAfter, e.maxHp)}.`);
          else if (!e.hit) out.push(`You attack ${e.target} with ${by} and miss.`);
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
      case 'cast': {
        const def = SPELLS[e.spell];
        out.push(`You cast ${e.spell}${def ? `: ${def.fact}` : ''}.`);
        break;
      }
      case 'concentration':
        out.push(`Your concentration breaks, and ${e.spell} fades.`);
        break;
      case 'save':
        if (e.why === 'Undead Fortitude' || /^to hold /.test(e.why)) break;
        out.push(e.pc ? `You ${e.ok ? 'resist' : 'fail to resist'} ${e.why.replace(/^against /, '')}.` : `${e.who} ${e.ok ? 'avoids' : 'is caught by'} ${e.why.replace(/^against /, '')}.`);
        break;
      case 'check':
        if (e.label === 'Stealth') out.push(e.ok ? 'You slip out of sight.' : 'You try to hide but stay in plain view.');
        else if (e.ok) out.push(`${e.who} finds you.`);
        break;
      case 'condition':
        if (e.on) out.push(e.pc ? `You are ${e.name.toLowerCase()}.` : `${e.who} ${FOE_MARK[e.name] ?? `is ${e.name.toLowerCase()}`}.`);
        break;
      case 'act':
        if (e.action === 'dodge') out.push('You fight defensively, dodging.');
        else if (e.action === 'stand') out.push(e.pc ? 'You get back to your feet.' : `${e.who} gets back to its feet.`);
        else if (e.action === 'skip') out.push(e.pc ? 'You cannot move or act this round.' : `${e.who} cannot act this round.`);
        else if (e.action === 'disengage') out.push(/get clear/.test(e.detail) ? 'You disengage and get clear.' : 'You step back carefully, but the foe keeps pace.');
        else if (e.action === 'flee') out.push(/cannot/.test(e.detail) ? 'You try to run but cannot move.' : 'You turn and run.');
        else if (e.action === 'help' && !e.pc) out.push(`${e.who} distracts the foe and gives you an opening.`);
        else if (e.action === 'help') out.push(/no ally/.test(e.detail) ? 'You look for an ally to help, but none is beside you.' : 'You distract the foe for your ally.');
        break;
      case 'heal':
        if (e.who !== pcName) out.push(`${e.who} heals your wounds with a spell.`);
        else out.push(e.spell ? `You cast ${e.item}: ${SPELLS[e.item]?.fact ?? 'your wounds ease'}.` : `You drink ${e.item} and feel stronger.`);
        break;
      case 'down':
        if (e.pc) out.push(e.massive ? 'The blow kills you outright.' : 'You fall unconscious.');
        else if (e.sidekick) out.push(`${e.who} falls and is out of the fight.`);
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
  if (secret) {
    if (r.result === 'revived') return 'Death save: you regain 1 HP';
    if (r.state.dead) return 'Death save: dead';
    if (r.state.stable) return `Death save: stable; you wake with 1 HP after ${r.hoursToWake} hours`;
    return 'Death save: rolled in secret';
  }
  const insp = r.rerolled !== undefined ? ` (Heroic Inspiration: rerolled ${r.rerolled})` : '';
  if (r.result === 'revived') return `Death save: d20 20${insp} — natural 20, you regain 1 HP`;
  const tail = r.state.dead ? ' — dead' : r.state.stable ? ` — stable; you wake with 1 HP after 1d4 (${r.hoursToWake}) hours` : '';
  return `Death save: d20 ${r.d20}${insp} — ${r.result} (${tally})${tail}`;
}

export function roundOutcomeWord(o: RoundOutcome): string {
  return o === 'victory' ? 'won' : o === 'escaped' ? 'escaped' : o === 'down' ? 'down' : o === 'dead' ? 'dead' : 'ongoing';
}
