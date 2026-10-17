/**
 * TT-C1 / OPT-1 — options from the engine scene record (mode-agnostic).
 *
 * Slot allocation follows Dendry-style precondition cards ranked by salience
 * (Ian D. Millington; pattern only — not a Dendry port).
 *
 * Tabletop adapter only: CheckSpec from checkForAction / SRD 5.2.1
 * (Wizards of the Coast, CC BY 4.0): "The DM calls for an ability check when a
 * character attempts an action (other than an attack) that has a chance of failure.
 * When the outcome is uncertain, the dice determine the result." Roll only when
 * uncertain; a certain open (unlocked door) carries no CheckSpec / no tag.
 *
 * LitRPG / Story RPG: same entity pass, no CheckSpec here (G-H adapters later).
 * No word lists or label regexes — kinds and actions come from record fields.
 */
import type { GameState } from './types';
import { checkForAction, type CheckSpec } from './checkMath';
import { parsePlayerIntent } from './intentParser';
import { presentNpcRecords } from './npcRecords';
import { merchantHere } from './merchant';
import { tabletopStepChip } from './tabletopQuestProgress';
import { storyRpgDecisionChip } from './storyRpgProgress';
import { enumerateLegalEdges } from './graphChoices';

/** Required vs optional slot families (OPT-1 item 2). */
export type AffordanceSlotKind =
  | 'person'
  | 'quest'
  | 'exit'
  | 'shop'
  | 'fight'
  | 'object'
  | 'item';

/** One scene affordance before EngineChip wrapping (kind `affordance` in choicePipeline). */
export interface SceneAffordance {
  label: string;
  /** Bound action id — stable key for repeat / legality (not the display label). */
  actionId: string;
  entityId: string;
  slotKind: AffordanceSlotKind;
  /** Higher wins among optional cards. */
  salience: number;
  /** Required kinds always keep a slot (plan §4 item 4 / OPT-1 item 2). */
  required: boolean;
  check?: CheckSpec | null;
}

/** Optional-slot ceiling after required kinds are placed (TT-C1 mix 3–5). */
export const AFFORDANCE_OPTIONAL_CAP = 5;

const OBJECT_VERBS: Record<string, { verb: string; uncertain: boolean; prefix: string }[]> = {
  door: [
    { verb: 'listen', uncertain: true, prefix: 'Listen at ' },
    { verb: 'force', uncertain: true, prefix: 'Force ' },
    { verb: 'open', uncertain: false, prefix: 'Open ' },
  ],
  chest: [
    { verb: 'search', uncertain: true, prefix: 'Search ' },
    { verb: 'open', uncertain: true, prefix: 'Open ' },
  ],
  hazard: [{ verb: 'notice', uncertain: true, prefix: 'Notice ' }],
  secret: [{ verb: 'investigate', uncertain: true, prefix: 'Investigate ' }],
  prop: [{ verb: 'inspect', uncertain: true, prefix: 'Inspect ' }],
};

/**
 * One pass over the engine record: people, quest step, exits, objects, merchant, foe, own items.
 */
export function collectSceneAffordances(state: GameState): SceneAffordance[] {
  const all: SceneAffordance[] = [];
  const dnd = state.engineMode === 'dnd';

  const enc = state.activeEncounter;
  if (enc && enc.hp > 0) {
    const name = (enc.name ?? 'foe').trim();
    const label = 'Press the attack';
    all.push({
      label,
      actionId: `fight:foe:${name}:attack`,
      entityId: `foe:${name}`,
      slotKind: 'fight',
      salience: 100,
      required: true,
      check: dnd ? checkForAction(state, parsePlayerIntent(label, state), label) : undefined,
    });
  }

  const people = presentNpcRecords(state);
  for (let i = 0; i < people.length; i++) {
    const m = people[i]!;
    const name = (m.npcName ?? '').trim();
    if (!name) continue;
    const entityId = m.npcId || `npc:${name}`;
    const talk = `Talk to ${name}`;
    all.push({
      label: talk,
      actionId: `person:${entityId}:talk`,
      entityId,
      slotKind: 'person',
      salience: 80 - i,
      required: true,
      check: dnd ? checkForAction(state, parsePlayerIntent(talk, state), talk) : undefined,
    });
    const insight = `Read ${name}`;
    all.push({
      label: insight,
      actionId: `person:${entityId}:insight`,
      entityId,
      slotKind: 'person',
      salience: 40 - i,
      required: false,
      check: dnd ? checkForAction(state, parsePlayerIntent(insight, state), insight) : undefined,
    });
  }

  const step = tabletopStepChip(state) ?? storyRpgDecisionChip(state);
  if (step) {
    all.push({
      label: step,
      actionId: 'quest:open-step:act',
      entityId: 'quest:open-step',
      slotKind: 'quest',
      salience: 90,
      required: true,
      check: dnd ? checkForAction(state, parsePlayerIntent(step, state), step) : undefined,
    });
  }

  const merchant = merchantHere(state);
  if (merchant) {
    const name = (merchant.npcName ?? 'merchant').trim();
    const entityId = merchant.npcId || `npc:${name}`;
    all.push({
      label: `Trade with ${name}`,
      actionId: `shop:${entityId}:trade`,
      entityId,
      slotKind: 'shop',
      salience: 75,
      required: true,
      check: undefined,
    });
  }

  const visitedKeys = new Set<string>();
  const visits = state.circling?.visits;
  if (visits) {
    for (const place of Object.keys(visits)) {
      if ((visits[place] ?? 0) > 0) visitedKeys.add(place.trim().toLowerCase());
    }
  }
  const d = state.activeDungeon;
  if (d?.visitedNodeIds?.length && d.nodes?.length) {
    for (let i = 0; i < d.nodes.length; i++) {
      const n = d.nodes[i]!;
      if (!d.visitedNodeIds.includes(n.id)) continue;
      visitedKeys.add((n.id ?? '').toLowerCase());
      visitedKeys.add((n.name ?? '').toLowerCase());
    }
  }

  const sheetExits = state.locationSheet?.exits ?? [];
  if (sheetExits.length) {
    for (let i = 0; i < sheetExits.length; i++) {
      const ex = sheetExits[i]!;
      const dest = (ex.label ?? '').trim();
      if (!dest) continue;
      const entityId = ex.id || `exit:${dest}`;
      const chip = `Travel toward ${dest}`;
      all.push({
        label: chip,
        actionId: `exit:${entityId}:travel`,
        entityId,
        slotKind: 'exit',
        salience: visitedKeys.has(dest.toLowerCase()) ? 30 : 70,
        required: true,
        check: dnd ? null : undefined,
      });
    }
  } else {
    const edges = enumerateLegalEdges(state);
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i]!;
      if (e.type !== 'travel') continue;
      const label = (e.label ?? '').trim();
      if (!label) continue;
      const target = (e.target ?? label).trim();
      const entityId = `exit:${target}`;
      all.push({
        label,
        actionId: `exit:${entityId}:travel`,
        entityId,
        slotKind: 'exit',
        salience: visitedKeys.has(target.toLowerCase()) ? 30 : 70,
        required: true,
        check: dnd ? null : undefined,
      });
    }
  }

  const sheetItems = state.locationSheet?.interactables ?? [];
  const seenProp = new Set<string>();
  for (let i = 0; i < sheetItems.length; i++) {
    const it = sheetItems[i]!;
    const name = (it.name ?? '').trim();
    if (!name) continue;
    seenProp.add(name.toLowerCase());
    const kind = it.kind ?? 'prop';
    const entityId = it.id || `obj:${name}`;
    const locked = kind === 'door' && (it.state === 'locked' || it.state === 'stuck');
    const acts = OBJECT_VERBS[kind] ?? OBJECT_VERBS.prop!;
    for (let a = 0; a < acts.length; a++) {
      const act = acts[a]!;
      if (kind === 'door' && act.verb === 'force' && !locked) continue;
      if (kind === 'door' && act.verb === 'open' && locked) continue;
      const label = `${act.prefix}${name}`;
      let check: CheckSpec | null | undefined;
      if (!dnd) check = undefined;
      else if (!act.uncertain) check = null;
      else check = checkForAction(state, parsePlayerIntent(label, state), label);
      all.push({
        label,
        actionId: `object:${entityId}:${act.verb}`,
        entityId,
        slotKind: 'object',
        salience: 55 - i - a,
        required: false,
        check,
      });
    }
  }
  const props = state.sceneFacts?.props ?? [];
  for (let i = 0; i < props.length; i++) {
    const name = (props[i] ?? '').trim();
    if (!name || seenProp.has(name.toLowerCase())) continue;
    const entityId = `prop:${name}`;
    const label = `Inspect ${name}`;
    all.push({
      label,
      actionId: `object:${entityId}:inspect`,
      entityId,
      slotKind: 'object',
      salience: 45 - i,
      required: false,
      check: dnd ? checkForAction(state, parsePlayerIntent(label, state), label) : undefined,
    });
  }

  const inv = state.inventory ?? [];
  for (let i = 0; i < inv.length; i++) {
    const item = inv[i]!;
    if (item.equipped || item.itemType === 'quest' || item.itemType !== 'consumable') continue;
    const name = (item.name ?? '').trim();
    if (!name) continue;
    const entityId = item.id || `item:${name}`;
    const label = `Use ${name}`;
    all.push({
      label,
      actionId: `item:${entityId}:use`,
      entityId,
      slotKind: 'item',
      salience: 35 - i,
      required: false,
      check: dnd ? null : undefined,
    });
  }

  return all;
}

/**
 * Dendry-style slot allocation: required kinds always win a slot; remaining by salience.
 * At most one exit chip. Person Talk chips: all when ≤2 named NPCs; when more, top 2.
 */
export function allocateAffordanceSlots(
  affordances: SceneAffordance[],
  optionalCap = AFFORDANCE_OPTIONAL_CAP,
): SceneAffordance[] {
  const talkPeople: SceneAffordance[] = [];
  const exits: SceneAffordance[] = [];
  const otherRequired: SceneAffordance[] = [];
  const optional: SceneAffordance[] = [];
  for (let i = 0; i < affordances.length; i++) {
    const a = affordances[i]!;
    if (a.slotKind === 'person' && a.actionId.endsWith(':talk')) talkPeople.push(a);
    else if (a.slotKind === 'exit' && a.required) exits.push(a);
    else if (a.required) otherRequired.push(a);
    else optional.push(a);
  }
  for (let i = 1; i < talkPeople.length; i++) {
    const cur = talkPeople[i]!;
    let j = i - 1;
    while (j >= 0 && talkPeople[j]!.salience < cur.salience) {
      talkPeople[j + 1] = talkPeople[j]!;
      j -= 1;
    }
    talkPeople[j + 1] = cur;
  }
  for (let i = 1; i < exits.length; i++) {
    const cur = exits[i]!;
    let j = i - 1;
    while (j >= 0 && exits[j]!.salience < cur.salience) {
      exits[j + 1] = exits[j]!;
      j -= 1;
    }
    exits[j + 1] = cur;
  }
  for (let i = 1; i < optional.length; i++) {
    const cur = optional[i]!;
    let j = i - 1;
    while (j >= 0 && optional[j]!.salience < cur.salience) {
      optional[j + 1] = optional[j]!;
      j -= 1;
    }
    optional[j + 1] = cur;
  }
  const personSlots = talkPeople.length <= 2 ? talkPeople : talkPeople.slice(0, 2);
  const exitSlot = exits.length ? [exits[0]!] : [];

  const picked: SceneAffordance[] = [];
  const seenAction = new Set<string>();
  for (let i = 0; i < personSlots.length; i++) {
    const row = personSlots[i]!;
    if (seenAction.has(row.actionId)) continue;
    seenAction.add(row.actionId);
    picked.push(row);
  }
  for (let i = 0; i < otherRequired.length; i++) {
    const row = otherRequired[i]!;
    if (seenAction.has(row.actionId)) continue;
    seenAction.add(row.actionId);
    picked.push(row);
  }
  for (let i = 0; i < exitSlot.length; i++) {
    const row = exitSlot[i]!;
    if (seenAction.has(row.actionId)) continue;
    seenAction.add(row.actionId);
    picked.push(row);
  }
  let optionalTaken = 0;
  for (let i = 0; i < optional.length; i++) {
    if (optionalTaken >= optionalCap) break;
    const row = optional[i]!;
    if (seenAction.has(row.actionId)) continue;
    if (row.slotKind === 'exit' && exitSlot.length) continue;
    seenAction.add(row.actionId);
    picked.push(row);
    optionalTaken += 1;
  }

  let hasActor = false;
  for (let i = 0; i < picked.length; i++) {
    const p = picked[i]!;
    if (p.slotKind === 'person' || p.slotKind === 'object') {
      hasActor = true;
      break;
    }
  }
  if (!hasActor) return picked;
  const trimmed: SceneAffordance[] = [];
  let sawExit = false;
  for (let i = 0; i < picked.length; i++) {
    const p = picked[i]!;
    if (p.slotKind === 'exit') {
      if (sawExit) continue;
      sawExit = true;
    }
    trimmed.push(p);
  }
  return trimmed;
}

/** True when an entity id from an affordance chip is still in the engine record. */
export function affordanceEntityPresent(state: GameState, entityId: string): boolean {
  if (!entityId) return false;
  if (entityId.startsWith('foe:')) {
    const enc = state.activeEncounter;
    return !!(enc && enc.hp > 0 && entityId === `foe:${(enc.name ?? 'foe').trim()}`);
  }
  if (entityId.startsWith('quest:')) return !!(tabletopStepChip(state) ?? storyRpgDecisionChip(state));
  const all = collectSceneAffordances(state);
  for (let i = 0; i < all.length; i++) {
    if (all[i]!.entityId === entityId) return true;
  }
  return false;
}
