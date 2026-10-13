/**
 * Tabletop glue for the turns outside a fight that the shared engine settles before the writer: the logged oracle,
 * crafting, attunement and Lay On Hands. Crafting, attunement and Lay On Hands follow the System Reference Document
 * 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd, licensed under
 * CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/legalcode). The oracle is SynapticGM's own.
 * Every number here is the engine's; the writer narrates the fact it is handed.
 */
import type { GameState, Item } from '../types';
import { formatCp, payCoins, purseGold, purseOf } from '../rules/coins';
import { craftRecipe, type CraftRecipe } from '../rules/downtime';
import { attunementProblem, magicItem, magicItemDef } from '../rules/magicItems';
import { ORACLE_MEANING, oddsInInput, oracleLine, rollOracle } from '../rules/oracle';
import { featureLeft, spendFeature } from '../rules/classFeatures';
import { SPELLS } from '../rules/spells';
import type { Rng } from '../rules/dice';
import { advanceClock } from '../travelJourney';
import { sheetSpellcasting, srdGearRow, tabletopArmorClass, toolProficiencies } from './characterBuild';
import { featureLine } from './roundFight';

export interface DowntimeResult {
  state: GameState;
  receipts: string[];
  fact: string;
}

const ORACLE = /^\s*(?:ask the oracle|oracle)\s*[:,—-]?\s*(.+)$/i;
const CRAFT = /\b(craft|forge|brew|scribe|make|carve|sew|weave|fletch)\s+(?:an?\s+|some\s+|the\s+|me\s+an?\s+|myself\s+an?\s+)?(.+?)\s*[.!]?$/i;
const ATTUNE = /\battune\s+(?:myself\s+)?(?:to|with)?\s*(?:my\s+|the\s+|this\s+|a\s+)?(.+?)\s*[.!]?$/i;
const END_ATTUNE = /\b(?:end|break|drop)\s+(?:my\s+)?attunement\s+(?:to|with)\s+(?:my\s+|the\s+)?(.+?)\s*[.!]?$/i;

/** Resolve an oracle question, a craft, an attunement or an out-of-fight Lay On Hands (null = not one of these). */
export function resolveDowntimeTurn(state: GameState, input: string, rng: Rng = Math.random): DowntimeResult | null {
  if (state.engineMode !== 'dnd') return null;
  const line = (input ?? '').trim();
  const oracle = ORACLE.exec(line);
  if (oracle) return askOracle(state, oracle[1]!, rng);
  if (!state.character?.srd || state.activeEncounter) return null;
  if (state.deathSaves && !state.deathSaves.stable && !state.deathSaves.dead) return null;
  const end = END_ATTUNE.exec(line);
  if (end) return endAttunement(state, end[1]!);
  const attune = ATTUNE.exec(line);
  if (attune && !/\battunement\b/i.test(line)) return attuneTo(state, attune[1]!);
  const craft = CRAFT.exec(line);
  if (craft) {
    const recipe = craftRecipe(craft[2]!.replace(/^(?:a|an|some)\s+/i, ''));
    if (recipe) return craftItem(state, recipe);
    if (/^(?:craft|brew|scribe|forge)$/i.test(craft[1]!)) {
      return { state, receipts: [`Crafting: ${craft[2]} — not made (no crafting rule for it); nothing spent`], fact: `You look the job over, but ${craft[2]} is not something you can craft here. Nothing is spent.` };
    }
  }
  if (/\blay on hands\b/i.test(line)) return layOnHands(state, line);
  return null;
}

function askOracle(state: GameState, question: string, rng: Rng): DowntimeResult {
  const entry = rollOracle(question.trim(), oddsInInput(question), rng, state.turn ?? 0);
  return {
    state: { ...state, oracleLog: [...(state.oracleLog ?? []), entry].slice(-50) },
    receipts: [oracleLine(entry)],
    fact: `The oracle answers "${entry.question}": ${ORACLE_MEANING[entry.answer]}.`,
  };
}

function refuse(state: GameState, label: string, what: string, why: string): DowntimeResult {
  return { state, receipts: [`${label}: ${what} — not done (${why}); nothing spent`], fact: `You set about it, but ${why}. Nothing is spent.` };
}

function craftItem(state: GameState, r: CraftRecipe): DowntimeResult {
  const ch = state.character;
  const tools = toolProficiencies(ch);
  const carried = (n: string) => (state.inventory ?? []).some((i) => i.name === n);
  const tool = r.tools.find((t) => (t === 'Arcana' ? ch.srd!.skillProfs.includes('Arcana') : tools.includes(t) && carried(t)));
  if (!tool) {
    const need = r.tools.map((t) => (t === 'Arcana' ? 'Arcana proficiency' : t)).join(' or ');
    return refuse(state, 'Crafting', r.item, `you need ${need} (proficient and carried)`);
  }
  if (r.spell) {
    const sc = sheetSpellcasting(ch);
    const known = [...(sc?.cantrips ?? []), ...(sc?.prepared ?? [])];
    if (!known.includes(r.spell)) return refuse(state, 'Crafting', r.item, `you do not have ${r.spell} prepared`);
  }
  const coins = purseOf(state);
  const paid = coins ? payCoins(coins, r.costCp) : null;
  if (!paid) return refuse(state, 'Crafting', r.item, `the materials cost ${formatCp(r.costCp)} and you cannot pay it`);
  const gold = purseGold(paid);
  const id = `tt-craft-${state.turn ?? 0}-${r.item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const made = makeItem(r, id);
  const clock = advanceClock({ ...state, gold, purse: { coins: paid, gold } }, 24 * r.days);
  const next: GameState = { ...clock.state, inventory: addItem(clock.state.inventory ?? [], made) };
  const days = `${r.days} day${r.days === 1 ? '' : 's'}`;
  return {
    state: next,
    receipts: [`Crafting: ${made.quantity > 1 ? `${made.quantity} ` : ''}${r.item} — ${days} of work, ${formatCp(r.costCp)} in materials (${tool}); ${clock.note}`],
    fact: `You spend ${days} working with ${tool === 'Arcana' ? 'your arcane learning' : `your ${tool}`} and finish ${made.quantity > 1 ? `${made.quantity} ${r.item}` : `a ${r.item}`}. It is in your pack now.`,
  };
}

function makeItem(r: CraftRecipe, id: string): Item {
  const provenance = 'Crafted';
  if (r.spell) {
    const def = SPELLS[r.spell]!;
    return { id, name: r.item, rarity: def.level === 0 ? 'Common' : 'Uncommon', quantity: 1, itemType: 'consumable', description: `Spell Scroll. Read it to cast ${def.name} once without a slot; the scroll is used up.`, provenance };
  }
  if (magicItemDef(r.item)) return { ...magicItem(r.item, id, provenance), quantity: r.quantity };
  return srdGearRow(r.item, r.quantity, id, provenance);
}

function addItem(inv: Item[], item: Item): Item[] {
  const same = inv.findIndex((i) => i.name === item.name && !i.equipped);
  if (same < 0) return [...inv, item];
  return inv.map((i, n) => (n === same ? { ...i, quantity: (i.quantity ?? 1) + item.quantity } : i));
}

function findCarried(state: GameState, said: string): Item | undefined {
  const want = said.trim().toLowerCase();
  return (state.inventory ?? []).find((i) => i.name.toLowerCase() === want)
    ?? (state.inventory ?? []).find((i) => magicItemDef(i.name) && i.name.toLowerCase().includes(want));
}

function withArmorClass(state: GameState): GameState {
  const ch = state.character;
  const ac = tabletopArmorClass(ch.attributes.DEX, state.inventory ?? [], !!ch.casting?.mageArmor, ch).ac;
  return { ...state, character: { ...ch, armorClass: ac } };
}

function attuneTo(state: GameState, said: string): DowntimeResult | null {
  const item = findCarried(state, said);
  const name = item?.name ?? said.trim();
  if (!item && !magicItemDef(name)) return null;
  const problem = attunementProblem(state.inventory, name);
  if (problem) return refuse(state, 'Attunement', name, problem);
  const before = state.character.armorClass;
  const clock = advanceClock(state, 1);
  const next = withArmorClass({ ...clock.state, inventory: (clock.state.inventory ?? []).map((i) => (i.name === name ? { ...i, attuned: true } : i)) });
  const after = next.character.armorClass;
  const count = (next.inventory ?? []).filter((i) => i.attuned).length;
  return {
    state: next,
    receipts: [`Attunement: ${name} — attuned (${count} of 3)${before !== after ? `; AC ${before} → ${after}` : ''}; ${clock.note}`],
    fact: `You spend a short rest with the ${name}, and it settles to you: you are attuned to it now.`,
  };
}

function endAttunement(state: GameState, said: string): DowntimeResult | null {
  const item = findCarried(state, said);
  if (!item) return null;
  if (!item.attuned) return refuse(state, 'Attunement', item.name, `you are not attuned to ${item.name}`);
  const before = state.character.armorClass;
  const next = withArmorClass({ ...state, inventory: (state.inventory ?? []).map((i) => (i.id === item.id ? { ...i, attuned: false } : i)) });
  const after = next.character.armorClass;
  return {
    state: next,
    receipts: [`Attunement: ${item.name} — ended${before !== after ? `; AC ${before} → ${after}` : ''}`],
    fact: `You let the ${item.name} go quiet; you are no longer attuned to it.`,
  };
}

function layOnHands(state: GameState, line: string): DowntimeResult | null {
  const ch = state.character;
  if (featureLeft(ch, 'layOnHands') <= 0 && !/paladin/i.test(ch.srd!.classId)) return null;
  const pool = featureLeft(ch, 'layOnHands');
  const max = ch.maxHp || ch.hp;
  if (pool <= 0) return refuse(state, 'Class feature', 'Lay On Hands', 'your healing pool is empty until a long rest');
  if (ch.hp >= max) return refuse(state, 'Class feature', 'Lay On Hands', 'you are already at full Hit Points');
  const asked = Number(/\b(\d{1,3})\b/.exec(line)?.[1] ?? 0);
  const amount = Math.min(pool, max - ch.hp, asked > 0 ? asked : Infinity);
  const spent = spendFeature(ch, 'layOnHands', amount);
  const hp = ch.hp + amount;
  const next: GameState = { ...state, character: { ...spent, hp } };
  return {
    state: next,
    receipts: [`Class feature: Lay On Hands — ${amount} HP; HP ${ch.hp} → ${hp}`, featureLine(next.character, 'layOnHands')],
    fact: `You lay your hands on your own wounds and holy warmth closes them: you regain ${amount} Hit Points.`,
  };
}
