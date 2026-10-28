/**
 * Tabletop glue: oracle, crafting, attunement, Lay On Hands (SRD 5.2.1 CC-BY-4.0; oracle is SynapticGM's).
 * Numbers are the engine's; the writer narrates the handed fact.
 */
import type { GameState, Item } from '../types';
import { formatCp, payCoins, purseGold, purseOf } from '../rules/coins';
import { craftItemFromInput, craftRecipe, type CraftRecipe } from '../rules/downtime';
import { attunementProblem, magicItem, magicItemDef, attunedItems } from '../rules/magicItems';
import { ORACLE_MEANING, oddsInInput, oracleLine, rollOracle } from '../rules/oracle';
import { featureLeft, spendFeature } from '../rules/classFeatures';
import { SPELLS } from '../rules/spells';
import type { Rng } from '../rules/dice';
import { parsePlayerIntent } from '../intentParser';
import { takeShortRestHour } from '../recoveryRules';
import { turnRng } from '../seededRng';
import { advanceClock, isJourneyUnderway } from '../travelJourney';
import { sheetSpellcasting, srdGearRow, tabletopArmorClass, toolProficiencies } from './characterBuild';
import { featureLine } from './roundFight';

export interface DowntimeResult {
  state: GameState;
  receipts: string[];
  fact: string;
}

const ORACLE = /^\s*(?:ask the oracle|oracle)\s*[:,—-]?\s*(.+)$/i;

/** Resolve an oracle / craft / attunement / out-of-fight Lay On Hands (null = none of these). */
export function resolveDowntimeTurn(state: GameState, input: string, rng: Rng = turnRng(state, 'downtime')): DowntimeResult | null {
  if (state.engineMode !== 'dnd') return null;
  const line = (input ?? '').trim();
  const oracle = ORACLE.exec(line);
  if (oracle) {
    const entry = rollOracle(oracle[1]!.trim(), oddsInInput(oracle[1]!), rng, state.turn ?? 0);
    return {
      state: { ...state, oracleLog: [...(state.oracleLog ?? []), entry].slice(-50) },
      receipts: [oracleLine(entry)],
      fact: `The oracle answers "${entry.question}": ${ORACLE_MEANING[entry.answer]}.`,
    };
  }
  if (!state.character?.srd || (state.deathSaves && !state.deathSaves.stable && !state.deathSaves.dead)) return null;

  // Craft: intent Rest ("Make camp") stays out; else make-action + craftRecipe(item) (E-CR1).
  // Quoted speech is never a craft verb ("make it quicker" inside dialogue) — T10M pick-up/toss.
  const intent = parsePlayerIntent(line, state);
  const low = line
    .replace(/["“”][^"“”]*["“”]/g, ' ')
    .replace(/['‘’][^'‘’]*['‘’]/g, ' ')
    .toLowerCase();
  const craftAct = low.includes('craft ') || low.includes('forge ') || low.includes('brew ') || low.includes('scribe ')
    || low.includes('fletch ') || low.includes('carve ') || low.includes('sew ') || low.includes('weave ') || low.includes('make ');
  if (intent.kind !== 'rest' && craftAct) {
    const named = craftItemFromInput(line);
    if (state.activeEncounter || isJourneyUnderway(state)) {
      return refuse(state, 'Crafting', named ?? 'item', "you can't work here");
    }
    if (named) {
      const recipe = craftRecipe(named);
      if (recipe) return craftItem(state, recipe);
      return {
        state,
        receipts: [`Crafting: ${named} — not made (no crafting rule for it); nothing spent`],
        fact: `You look the job over, but ${named} is not something you can craft here. Nothing is spent.`,
      };
    }
    return {
      state,
      receipts: [`Crafting: item — not made (no crafting rule for it); nothing spent`],
      fact: 'You look the job over, but that is not something you can craft here. Nothing is spent.',
    };
  }

  if (state.activeEncounter) return null;
  // Attunement: intent use_item (`attune`) / rest naming the item, or end/break/drop attunement (E-CR2).
  const ending = low.includes('attunement') && (low.includes('end') || low.includes('break') || low.includes('drop'));
  const attuning = low.includes('attune') && !ending;
  const named = findAttuneTarget(state, line);
  if (ending) {
    if (!named) return null;
    return endAttunement(state, named);
  }
  if (attuning || (intent.kind === 'rest' && named && magicItemDef(named.name)?.attunement)) {
    return attuneTo(state, named?.name ?? line);
  }
  if (low.includes('lay on hands')) return layOnHands(state, line);
  return null;
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
  if (r.requireArcana && !ch.srd!.skillProfs.includes('Arcana')) {
    return refuse(state, 'Crafting', r.item, 'you need Arcana proficiency');
  }
  if (r.spell) {
    const sc = sheetSpellcasting(ch);
    const known = [...(sc?.cantrips ?? []), ...(sc?.prepared ?? [])];
    if (!known.includes(r.spell)) return refuse(state, 'Crafting', r.item, `you do not have ${r.spell} prepared`);
  }
  if (r.material && !(state.inventory ?? []).some((i) => i.name === r.material!.name)) {
    return refuse(state, 'Crafting', r.item, `you do not have ${r.material.name} at hand`);
  }
  const coins = purseOf(state);
  const paid = coins ? payCoins(coins, r.costCp) : null;
  if (!paid) return refuse(state, 'Crafting', r.item, `the materials cost ${formatCp(r.costCp)} and you cannot pay it`);
  const gold = purseGold(paid);
  let inv = state.inventory ?? [];
  if (r.material?.consumed) {
    inv = inv
      .map((i) => (i.name === r.material!.name ? { ...i, quantity: (i.quantity ?? 1) - 1 } : i))
      .filter((i) => (i.quantity ?? 1) > 0);
  }
  let slug = '';
  for (const ch of r.item.toLowerCase()) {
    if (ch === ' ') slug += '-';
    else if (ch !== "'" && ch !== '(' && ch !== ')') slug += ch;
  }
  const id = `tt-craft-${state.turn ?? 0}-${slug}`;
  const made = makeItem(r, id);
  const clock = advanceClock({ ...state, gold, purse: { coins: paid, gold }, inventory: inv }, 24 * r.days);
  const next: GameState = { ...clock.state, inventory: addItem(clock.state.inventory ?? [], made) };
  const days = r.days === 1 ? '1 day' : `${r.days} days`;
  const toolNote = r.requireArcana ? `Arcana, ${tool}` : tool;
  return {
    state: next,
    receipts: [`Crafting: ${made.quantity > 1 ? `${made.quantity} ` : ''}${r.item} — ${days} of work, ${formatCp(r.costCp)} in materials (${toolNote}); ${clock.note}`],
    fact: `You spend ${days} working with ${r.requireArcana ? 'your Arcana and ' : ''}${tool === 'Arcana' ? 'your arcane learning' : `your ${tool}`} and finish ${made.quantity > 1 ? `${made.quantity} ${r.item}` : `a ${r.item}`}. It is in your pack now.`,
  };
}

function makeItem(r: CraftRecipe, id: string): Item {
  const provenance = 'Crafted';
  if (r.spell) {
    const def = SPELLS[r.spell]!;
    return {
      id,
      name: r.item,
      rarity: def.level === 0 ? 'Common' : 'Uncommon',
      quantity: 1,
      itemType: 'consumable',
      description: `Spell Scroll. Read it to cast ${def.name} once without a slot; the scroll is used up.`,
      provenance,
    };
  }
  if (magicItemDef(r.item)) return { ...magicItem(r.item, id, provenance), quantity: r.quantity };
  return srdGearRow(r.item, r.quantity, id, provenance);
}

function addItem(inv: Item[], item: Item): Item[] {
  const same = inv.findIndex((i) => i.name === item.name && !i.equipped);
  if (same < 0) return [...inv, item];
  return inv.map((i, n) => (n === same ? { ...i, quantity: (i.quantity ?? 1) + item.quantity } : i));
}

/** Longest carried magic-item name mentioned in the line (intent + item resolve; no attune regex). */
function findAttuneTarget(state: GameState, line: string): Item | undefined {
  const low = line.toLowerCase();
  let best: Item | undefined;
  let bestLen = 0;
  for (const i of state.inventory ?? []) {
    if (!magicItemDef(i.name)) continue;
    const n = i.name.toLowerCase();
    if (low.includes(n) && n.length >= bestLen) {
      best = i;
      bestLen = n.length;
    }
  }
  return best;
}

function withArmorClass(state: GameState): GameState {
  const ch = state.character;
  const ac = tabletopArmorClass(ch.attributes.DEX, state.inventory ?? [], !!ch.casting?.mageArmor, ch).ac;
  return { ...state, character: { ...ch, armorClass: ac } };
}

function attuneTo(state: GameState, said: string): DowntimeResult | null {
  const item = findAttuneTarget(state, said) ?? findAttuneTarget(state, ` ${said} `);
  const name = item?.name ?? said.trim();
  if (!item && !magicItemDef(name)) return null;
  const problem = attunementProblem(state.inventory, name, state.awayAttuned?.length ?? 0);
  if (problem) return refuse(state, 'Attunement', name, problem);
  // Same Short Rest used to learn its properties cannot attune (SRD p.102–103).
  if (item && item.identifiedTurn != null && item.identifiedTurn === (state.turn ?? 0)) {
    return refuse(state, 'Attunement', name, 'you just learned its properties this rest');
  }
  // Pending combat interrupts the rest: an hour passes, no attunement.
  if (state.sceneFacts?.pendingEncounter) {
    const clock = advanceClock(state, 1);
    return {
      state: clock.state,
      receipts: [`Attunement: ${name} — not done (the rest was interrupted)`],
      fact: `You try to settle with the ${name}, but the moment breaks before the rest is done.`,
    };
  }
  const before = state.character.armorClass;
  const rest = takeShortRestHour(state);
  const next = withArmorClass({
    ...rest.state,
    inventory: (rest.state.inventory ?? []).map((i) => (i.name === name ? { ...i, attuned: true } : i)),
  });
  const after = next.character.armorClass;
  const count = attunedItems(next.inventory).length + (next.awayAttuned?.length ?? 0);
  return {
    state: next,
    receipts: [
      `Attunement: ${name} — attuned (${count} of 3)${before !== after ? `; AC ${before} → ${after}` : ''}; ${rest.note}`,
      ...rest.after,
    ],
    fact: `You spend a short rest with the ${name}, and it settles to you: you are attuned to it now.`,
  };
}

function endAttunement(state: GameState, item: Item): DowntimeResult | null {
  if (!item.attuned) return refuse(state, 'Attunement', item.name, `you are not attuned to ${item.name}`);
  if (item.cursed) return refuse(state, 'Attunement', item.name, "it's cursed; the curse must be broken first");
  const before = state.character.armorClass;
  // Voluntary end takes another Short Rest (SRD Attunement).
  const rest = takeShortRestHour(state);
  const next = withArmorClass({
    ...rest.state,
    inventory: (rest.state.inventory ?? []).map((i) => (i.id === item.id ? { ...i, attuned: false } : i)),
  });
  const after = next.character.armorClass;
  return {
    state: next,
    receipts: [
      `Attunement: ${item.name} — ended${before !== after ? `; AC ${before} → ${after}` : ''}; ${rest.note}`,
      ...rest.after,
    ],
    fact: `You let the ${item.name} go quiet over a short rest; you are no longer attuned to it.`,
  };
}

function layOnHands(state: GameState, line: string): DowntimeResult | null {
  const ch = state.character;
  if (featureLeft(ch, 'layOnHands') <= 0 && !ch.srd!.classId.toLowerCase().includes('paladin')) return null;
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
