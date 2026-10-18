/**
 * Shared rules engine — combat presenter (the mode profile).
 * The engine rolls the same dice in every mode; this decides what each mode shows.
 * Tabletop: every roll openly on STATUS. LitRPG: System-window receipts, no dice. Story RPG: no stat lines.
 * The writer gets the same word-only facts in every mode (no numbers): it narrates, the engine counts.
 */
import type { EngineMode, RoundCombatState, RoundFoeState } from '../types';
import type { AdvState } from '../checkRules';
import { formatDice, signed } from './dice';
import type { CombatEvent, DeathSaveResult } from './roundCombat';
import { SPELLS } from './spells';

type Ev = CombatEvent & { round: number };

function d20Text(d20s: number[], kept: number, adv: AdvState): string {
  return adv === 'normal' || d20s.length < 2 ? `d20 ${kept}` : `d20 (${adv === 'advantage' ? 'adv' : 'dis'}: ${d20s.join(', ')}) ${kept}`;
}

/** How the tabletop STATUS shows rolls: open (every die) or hidden GM rolls (the foes' dice stay behind the screen). */
export interface TabletopView {
  hiddenFoeRolls?: boolean;
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
  const isFoeRoll =
    (e.k === 'attack' && !e.pc && !e.sidekick) ||
    (e.k === 'save' && !e.pc) ||
    (e.k === 'check' && e.label === 'Perception');
  if (view.hiddenFoeRolls && isFoeRoll) return hiddenLine(e, pcName);
  switch (e.k) {
    case 'initiative':
      return null;
    case 'attack': {
      const halfTxt = e.half ? `, halved = ${e.dealt}` : '';
      if (e.cleave) {
        return `cleave: ${e.total} also beats ${e.target} AC ${e.ac}, ${e.dealt} leftover ${e.type ?? ''} damage; ${e.target} HP ${e.hpBefore} → ${e.hpAfter}`.replace(/ {2,}/g, ' ');
      }
      if (!e.d20s.length) {
        return `${e.pc ? 'you' : e.attacker} ${e.with}: ${e.damage ? formatDice(e.damage) : 0}${halfTxt} ${e.type ?? ''}${e.vulnerable ? ' ×2 (vulnerable)' : ''}; ${e.target} HP ${e.hpBefore} → ${e.hpAfter}`.replace(/ {2,}/g, ' ');
      }
      const dieMods = `${e.bless ? ` + Bless 1d4 (${e.bless})` : ''}${e.bane ? ` − Bane 1d4 (${e.bane})` : ''}`;
      const insp = !e.inspiration ? '' : e.inspiration.mode === 'reroll' ? ` (Heroic Inspiration: rerolled d20 ${e.inspiration.first})` : ' (Heroic Inspiration: Advantage)';
      const head = `${e.pc ? 'you' : e.attacker}${e.opportunity ? ' opportunity attack,' : ''} ${e.with}${e.flank ? ' (flanking)' : ''} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)}${dieMods} = ${e.total} vs AC ${e.ac}${insp}`;
      if (!e.hit && e.half && e.damage) {
        return `${head}: miss; Potent Cantrip ${formatDice(e.damage)} halved = ${e.dealt}; ${e.target} HP ${e.hpBefore} → ${e.hpAfter}`;
      }
      if (!e.hit) return `${head}: ${e.nat1 ? 'miss (natural 1)' : 'miss'}`;
      const parts = [
        e.damage ? formatDice(e.damage) : '',
        e.sneak ? `Sneak Attack ${formatDice(e.sneak)}` : '',
        e.extra ? `${formatDice(e.extra)} poison` : '',
        ...(e.bonus ?? []).map((b) => `${b.label} ${b.roll ? formatDice(b.roll) : b.flat}`),
      ]
        .filter(Boolean)
        .join(' + ');
      const hpOf = e.target === pcName ? 'your HP' : `${e.target} HP`;
      const cut = e.reduced ? `, −${e.reduced.amount} ${e.reduced.label}${e.reduced.roll ? ` ${formatDice(e.reduced.roll)}` : ''}` : '';
      const tag = e.mastery ? ` (${e.mastery})` : '';
      return `${head}${tag}: ${e.crit ? 'critical hit' : 'hit'}, ${parts} ${e.type ?? ''}${e.vulnerable ? ' ×2 (vulnerable)' : ''}${cut} = ${e.dealt}; ${hpOf} ${e.hpBefore} → ${e.hpAfter}`.replace(/ {2,}/g, ' ');
    }
    case 'extra':
      return `${e.label}: ${e.amount} ${e.type}; ${e.who === pcName ? 'your HP' : `${e.who} HP`} ${e.hpBefore} → ${e.hpAfter}`;
    case 'save': {
      const dieMods = `${e.bless ? ` + Bless 1d4 (${e.bless})` : ''}${e.bane ? ` − Bane 1d4 (${e.bane})` : ''}`;
      const insp = !e.inspiration ? '' : e.inspiration.mode === 'reroll' ? ` (Heroic Inspiration: rerolled d20 ${e.inspiration.first})` : ' (Heroic Inspiration: Advantage)';
      if (e.autoFail) return `${e.pc ? 'you' : e.who} ${e.ability} save ${e.why}: automatic failure`;
      return `${e.pc ? 'you' : e.who} ${e.ability} save ${e.why} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)}${dieMods} = ${e.total} vs DC ${e.dc}: ${e.ok ? 'success' : 'failure'}${insp}`;
    }
    case 'cast': {
      const tags = [e.slot ? `level ${e.slot} slot` : '', e.detail ?? '', e.concentration ? 'concentration' : ''].filter(Boolean).join(', ');
      return `you cast ${e.spell}${tags ? ` (${tags})` : ''}`;
    }
    case 'concentration':
      return `you lose concentration on ${e.spell} (${e.why})`;
    case 'check':
      return `${e.who === pcName ? 'you' : e.who} ${e.label} ${d20Text(e.d20s, e.kept, e.adv)} ${signed(e.mod)} = ${e.total} vs ${e.label === 'Perception' ? 'your Stealth' : 'DC'} ${e.dc}: ${e.ok ? 'success' : 'failure'} (${e.why})`;
    case 'condition':
      return `${e.pc ? 'you' : e.who} ${e.on ? 'gain' : 'lose'}${e.pc ? '' : 's'} ${e.name}${e.why && e.why !== e.name ? ` (${e.why})` : ''}`;
    case 'act':
      if (e.action === 'feature') return e.detail;
      return e.action === 'other' ? null : `${e.pc ? 'you' : e.who}: ${e.action === 'stand' ? 'stand' : e.action === 'skip' ? 'turn lost' : e.action} — ${e.detail}`;
    case 'heal':
      if (e.who !== pcName) return `${e.who} casts ${e.item} on you: ${formatDice(e.roll)}; HP ${e.hpBefore} → ${e.hpAfter}`;
      if (e.pool != null) return `you use Lay On Hands: ${e.pool} HP from the pool; HP ${e.hpBefore} → ${e.hpAfter}`;
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

export function presentCombatStatus(mode: EngineMode | undefined, events: Ev[], pcName: string, view: TabletopView = {}): string[] {
  if (mode === 'dnd') return tabletopCombatLines(events, pcName, view);
  if (mode === 'litrpg') {
    // LitRPG: System-window receipts, outcome only.
    const out: string[] = [];
    for (let i = 0; i < events.length; i++) {
      const e = events[i]!;
      if (e.k === 'attack' && e.hit) out.push(e.pc ? `Hit: ${e.target} −${e.dealt} HP${e.crit ? ' (Critical)' : ''}` : `Damage taken: −${e.dealt} HP`);
      if (e.k === 'condition' && e.on) out.push(`Status effect: ${e.name}`);
    }
    return out;
  }
  return [];
}

const NATURAL = /^(?:bite|claws?|slam|talons?|tentacles?|horns?|tail|life drain|fist)$/i;

/** Spell marks on a foe, in words. */
const FOE_MARK: Record<string, string> = {
  Bane: 'is cursed by your Bane',
  'Guiding Bolt': 'glows with the light of your Guiding Bolt',
  Prone: 'falls prone',
  'Faerie Fire': 'is outlined in pale light',
  Restrained: 'is held fast',
  'Vicious Mockery': 'reels from your mockery',
  "Hunter's Mark": 'is marked as your quarry',
  Hex: 'is cursed by your Hex',
  'Searing Smite': 'catches fire',
  Vex: 'is left open to your next attack',
  Sap: 'is knocked off balance',
  Slowed: 'is slowed',
};

/** Class features in words (keyed by the feature name the engine's event detail starts with). */
const FEATURE_FACT: Record<string, string> = {
  Rage: 'You fly into a rage.',
  'Rage ends': 'Your rage fades.',
  'Innate Sorcery': 'Raw magic wells up in you.',
  'Reckless Attack': 'You throw caution aside and attack recklessly.',
};

/** "its slam", "a scimitar", "your greatsword" */
function weaponWords(name: string, owner: 'its' | 'your' | 'a'): string {
  const w = name.toLowerCase();
  if (owner === 'your') return `your ${w}`;
  if (NATURAL.test(w)) return `its ${w}`;
  return `${/^[aeiou]/.test(w) ? 'an' : 'a'} ${w}`;
}

function hurtWord({ hpBefore, hpAfter, maxHp }: { hpBefore: number; hpAfter: number; maxHp: number }): string {
  if (hpAfter <= 0) return 'goes down';
  if (hpAfter >= hpBefore) return 'takes no harm';
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
          out.push(`Your blow carries on into ${e.target}; it ${hurtWord(e)}.`);
        } else if (e.pc) {
          const spell = !e.d20s.length || !!e.spell || /^(?:fire bolt|sacred flame)$/i.test(e.with);
          const by = spell ? e.with : weaponWords(e.with, 'your');
          if (e.half) out.push(`${e.target} only partly escapes ${by}; it ${hurtWord(e)}.`);
          else if (!e.hit) out.push(`You attack ${e.target} with ${by} and miss.`);
          else out.push(`You ${e.crit ? 'land a critical blow on' : 'hit'} ${e.target} with ${by}; it ${hurtWord(e)}.`);
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
        else if (e.label === 'Athletics') out.push(e.ok ? `${e.who} tears free.` : `${e.who} strains against what holds it.`);
        else if (e.ok) out.push(`${e.who} finds you.`);
        break;
      case 'extra':
        out.push(e.pc ? `Even your miss clips ${e.who}; it ${hurtWord(e)}.` : `The flames burn ${e.who}; it ${hurtWord(e)}.`);
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
        else if (e.action === 'feature' && FEATURE_FACT[e.detail.split(':')[0]!]) out.push(FEATURE_FACT[e.detail.split(':')[0]!]!);
        break;
      case 'heal':
        if (e.who !== pcName) out.push(`${e.who} heals your wounds with a spell.`);
        else if (e.pool != null) out.push('You lay a hand on your own wound and holy power knits it closed.');
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

/** TT-X1 — SRD 5.2.1 Bloodied (half HP or fewer; WotC CC BY 4.0). Shared initiative; distances in feet. */
export type VisibleWound = 'unhurt' | 'hurt' | 'Bloodied' | 'near death';
export interface CombatStatusCombatant {
  label: string; initiative: number; current: boolean; distanceFt: number; wound: VisibleWound; conditions: string[]; gateName: string;
}
export interface CombatStatusBlock {
  initiativeOrder: CombatStatusCombatant[]; economyLine: string; text: string; screenReaderText: string;
}
export function visibleWound(hp: number, maxHp: number): VisibleWound {
  if (hp <= 0 || hp * 4 <= maxHp) return 'near death';
  if (hp >= maxHp) return 'unhurt';
  if (hp * 2 <= maxHp) return 'Bloodied';
  return 'hurt';
}
export function formatDistanceFt(ft: number): string {
  return ft <= 5 ? 'within 5 ft' : `about ${ft} ft`;
}
export function formatEconomyLine(e: { actionAvailable: boolean; bonusAvailable: boolean; movementFt: number; reactionAvailable: boolean }): string {
  return `${e.actionAvailable ? 'Action' : 'Action used'} · ${e.bonusAvailable ? 'Bonus action' : 'Bonus action used'} · ${e.movementFt} ft movement · ${e.reactionAvailable ? 'Reaction' : 'Reaction used'}`;
}
/** Engine-only status: shared initiative, distance, wound band, PC economy. */
export function buildCombatStatusBlock(opts: { combat: RoundCombatState; pcName: string; pcHp: number; pcMaxHp: number; currentId?: string }): CombatStatusBlock {
  const { combat, pcName, pcHp, pcMaxHp } = opts;
  const groups: Array<{ key: string; label: string; initiative: number; foes: RoundFoeState[] }> = [];
  for (let i = 0; i < combat.foes.length; i++) {
    const f = combat.foes[i]!;
    if (f.hp <= 0) continue;
    const key = f.blockId === 'engine' ? f.id : f.blockId;
    let g: (typeof groups)[0] | undefined;
    for (let gix = 0; gix < groups.length; gix++) if (groups[gix]!.key === key) { g = groups[gix]; break; }
    if (!g) {
      let label = f.name;
      const sp = label.lastIndexOf(' ');
      if (sp >= 0) {
        let digits = true;
        for (let k = sp + 1; k < label.length; k++) {
          const ch = label.charCodeAt(k);
          if (ch < 48 || ch > 57) { digits = false; break; }
        }
        if (digits) label = label.slice(0, sp);
      }
      g = { key, label, initiative: f.initiative, foes: [] };
      groups.push(g);
    }
    g.foes.push(f);
  }
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]!;
    if (g.foes.length > 1) {
      const x = g.label.lastIndexOf(' ×');
      g.label = `${x >= 0 ? g.label.slice(0, x) : g.label} ×${g.foes.length}`;
    }
  }
  type Row = { id: string; label: string; initiative: number; pc: boolean; foes: RoundFoeState[] };
  const rows: Row[] = [{ id: 'pc', label: 'you', initiative: combat.pcInitiative, pc: true, foes: [] }];
  for (let i = 0; i < groups.length; i++) rows.push({ id: groups[i]!.foes[0]!.id, label: groups[i]!.label, initiative: groups[i]!.initiative, pc: false, foes: groups[i]!.foes });
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    const ra = rows[a]!, rb = rows[b]!;
    if (rb.initiative > ra.initiative || (rb.initiative === ra.initiative && rb.pc && !ra.pc)) { rows[a] = rb; rows[b] = ra; }
  }
  const currentId = opts.currentId ?? rows[0]?.id ?? 'pc';
  const initiativeOrder: CombatStatusCombatant[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    if (r.pc) {
      const conds: string[] = [];
      for (let c = 0; c < combat.pcConditions.length; c++) conds.push(combat.pcConditions[c]!.name);
      initiativeOrder.push({ label: r.label, initiative: r.initiative, current: r.id === currentId, distanceFt: 0, wound: visibleWound(pcHp, pcMaxHp), conditions: conds, gateName: pcName });
      continue;
    }
    let sumHp = 0, sumMax = 0;
    const conds: string[] = [];
    for (let j = 0; j < r.foes.length; j++) {
      sumHp += r.foes[j]!.hp; sumMax += r.foes[j]!.maxHp;
      for (let c = 0; c < r.foes[j]!.conditions.length; c++) {
        const n = r.foes[j]!.conditions[c]!.name;
        if (!conds.includes(n)) conds.push(n);
      }
    }
    const xAt = r.label.lastIndexOf(' ×');
    initiativeOrder.push({ label: r.label, initiative: r.initiative, current: r.id === currentId, distanceFt: r.foes[0]!.distanceFt ?? 5, wound: visibleWound(sumHp, sumMax), conditions: conds, gateName: xAt >= 0 ? r.label.slice(0, xAt) : r.label });
  }
  const eco = combat.pcEconomy ?? { actionAvailable: true, bonusAvailable: true, movementFt: 0, reactionAvailable: true };
  const economyLine = formatEconomyLine(eco);
  const initParts: string[] = [];
  const foeParts: string[] = [];
  for (let i = 0; i < initiativeOrder.length; i++) {
    const c = initiativeOrder[i]!;
    initParts.push(`${c.label} ${c.initiative}${c.current ? ' ←' : ''}`);
    if (c.label !== 'you') foeParts.push(`${c.label} — ${c.wound} · ${formatDistanceFt(c.distanceFt)}${c.conditions.length ? ` (${c.conditions.join(', ')})` : ''}`);
  }
  const pcCondNames: string[] = [];
  for (let c = 0; c < combat.pcConditions.length; c++) pcCondNames.push(combat.pcConditions[c]!.name);
  const lines: string[] = [`Initiative — ${initParts.join('; ')}`];
  for (let i = 0; i < foeParts.length; i++) lines.push(foeParts[i]!);
  lines.push(`You — ${economyLine}${pcCondNames.length ? ` (${pcCondNames.join(', ')})` : ''}`);
  const text = lines.join('\n');
  return { initiativeOrder, economyLine, text, screenReaderText: text };
}
/** Fact gate: prose must not contradict the engine status block. */
export function combatStatusContradicts(prose: string, block: CombatStatusBlock): string | null {
  const low = (prose ?? '').toLowerCase();
  let hay = ' ';
  for (let i = 0; i < low.length; i++) {
    const code = low.charCodeAt(i);
    hay += (code >= 97 && code <= 122) || (code >= 48 && code <= 57) ? low[i]! : ' ';
  }
  hay += ' ';
  for (let i = 0; i < block.initiativeOrder.length; i++) {
    const c = block.initiativeOrder[i]!;
    if (c.label === 'you') continue;
    const name = c.gateName.toLowerCase();
    if (!hay.includes(` ${name} `) && !hay.includes(` ${name}s `)) continue;
    const w = c.wound;
    if (w !== 'unhurt' && hay.includes(' unhurt ')) return `Combat status contradiction: ${c.gateName} is ${w}, not unhurt.`;
    if (w !== 'Bloodied' && hay.includes(' bloodied ')) return `Combat status contradiction: ${c.gateName} is ${w}, not Bloodied.`;
    if (w !== 'near death' && hay.includes(' near death ')) return `Combat status contradiction: ${c.gateName} is ${w}, not near death.`;
    if (w !== 'hurt' && hay.includes(' hurt ') && !hay.includes(' unhurt ')) return `Combat status contradiction: ${c.gateName} is ${w}, not hurt.`;
    if (c.distanceFt <= 5) {
      if (hay.includes(' about ') && hay.includes(' ft ') && !hay.includes(' within 5 ')) return `Combat status contradiction: ${c.gateName} is within 5 ft.`;
    } else if (hay.includes(' within 5 ') && hay.includes(` ${name} `)) {
      return `Combat status contradiction: ${c.gateName} is ${formatDistanceFt(c.distanceFt).toLowerCase()}.`;
    }
  }
  return null;
}
