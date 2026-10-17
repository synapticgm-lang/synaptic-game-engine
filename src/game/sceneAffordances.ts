/**
 * TT-C1 / OPT-1 — options from the engine scene record (mode-agnostic).
 *
 * Slot allocation follows Dendry-style precondition cards ranked by salience
 * (Ian D. Millington; pattern only — not a Dendry port).
 *
 * Mode adapters (same entities, different third actions — OPT-1 / q42-OPT1m):
 * - Tabletop: CheckSpec from checkForAction / SRD 5.2.1 (Wizards of the Coast, CC BY 4.0):
 *   "The DM calls for an ability check when a character attempts an action (other than an
 *   attack) that has a chance of failure. When the outcome is uncertain, the dice determine
 *   the result." Roll only when uncertain; a certain open (unlocked door) carries no CheckSpec.
 * - LitRPG: skill actions (tier CheckSpec via checkForAction) and system actions on the same
 *   entities (Analyze — System ledger voice; no SRD tag).
 * - Story RPG: standing and contact actions on the same people (contact favour ticks a step).
 *
 * Labels stay the plain action (feature-groups-plan §4). No word lists or label regexes.
 */
import type { GameState } from './types';
import { checkForAction, type CheckSpec } from './checkMath';
import { parsePlayerIntent } from './intentParser';
import { presentNpcRecords } from './npcRecords';
import { merchantHere } from './merchant';
import { tabletopStepChip } from './tabletopQuestProgress';
import {
  contactChip,
  standingContactsHere,
  storyRpgDecisionChip,
} from './storyRpgProgress';
import { enumerateLegalEdges } from './graphChoices';
import { exitPlaceNames } from './placeNames';
import { openRouteView } from './questRoutes';
import { mainSpineQuest } from './questPlay';
import { mentionsName, peopleHere } from './chipLegality';
import type { QuestRoute } from './types';

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
  /** LitRPG/RPG cooldown floor: restored so the turn keeps ≥2 chips (OPT1-8). */
  cooldownReturn?: boolean;
}

/**
 * John 17 Oct 12:48 / mode switch 12:49 — turns before the same actionId may return
 * in an unchanged scene (tabletop 0 = situation-aware streak only; LitRPG/RPG 5).
 */
export const REPEAT_COOLDOWN_TURNS = {
  tabletop: 0,
  dnd: 0,
  litrpg: 5,
  rpg: 5,
} as const;

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
  const mode = state.engineMode;
  const dnd = mode === 'dnd';
  const litrpg = mode === 'litrpg';
  const rpg = mode === 'rpg';
  // Tabletop SRD / LitRPG skill-tier CheckSpec; Story RPG carries none (no roll tag).
  const withModeCheck = dnd || litrpg;

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
  let contactNames: Set<string> | null = null;
  if (rpg) {
    contactNames = new Set();
    const contactList = standingContactsHere(state);
    for (let n = 0; n < contactList.length; n++) contactNames.add(contactList[n]!.toLowerCase());
  }
  const openQuest = rpg ? mainSpineQuest(state) : null;
  const openStep =
    openQuest?.objectives?.find((o) => !o.completed)?.description?.trim() ?? '';

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
      check: withModeCheck ? checkForAction(state, parsePlayerIntent(talk, state), talk) : undefined,
    });

    // Mode third action on the same person entity (OPT-1 / q42-OPT1m).
    if (dnd) {
      const insight = `Read ${name}`;
      all.push({
        label: insight,
        actionId: `person:${entityId}:insight`,
        entityId,
        slotKind: 'person',
        salience: 40 - i,
        required: false,
        check: checkForAction(state, parsePlayerIntent(insight, state), insight),
      });
    } else if (litrpg) {
      // Salience above object pads so skill/system thirds survive the optional cap.
      const skill = `Read ${name}`;
      all.push({
        label: skill,
        actionId: `person:${entityId}:skill`,
        entityId,
        slotKind: 'person',
        salience: 65 - i,
        required: false,
        check: checkForAction(state, parsePlayerIntent(skill, state), skill),
      });
      const system = `Analyze ${name}`;
      all.push({
        label: system,
        actionId: `person:${entityId}:system`,
        entityId,
        slotKind: 'person',
        salience: 64 - i,
        required: false,
        check: null,
      });
    } else if (rpg) {
      const standing = `Press your standing with ${name}`;
      all.push({
        label: standing,
        actionId: `person:${entityId}:standing`,
        entityId,
        slotKind: 'person',
        salience: 63 - i,
        required: false,
        check: undefined,
      });
      if (contactNames?.has(name.toLowerCase()) && openStep) {
        const contact = contactChip(name, openStep);
        all.push({
          label: contact,
          actionId: `person:${entityId}:contact`,
          entityId,
          slotKind: 'person',
          salience: 88 - i,
          required: true,
          check: undefined,
        });
      }
    }

    // OPT3-2 / OPT-2 agenda hook: a present NPC's goal yields at least one OPT-1 affordance.
    if (m.goal?.motivation && (m.goal.target || m.need)) {
      const about = (m.need ?? m.goal.target).trim();
      if (about) {
        const agenda = `Ask ${name} about ${about}`;
        all.push({
          label: agenda,
          actionId: `person:${entityId}:agenda`,
          entityId,
          slotKind: 'person',
          salience: 85 - i,
          required: true,
          check: withModeCheck ? checkForAction(state, parsePlayerIntent(agenda, state), agenda) : undefined,
        });
      }
    }
  }

  // TT-G1 / OPT-4: open step routes expand as affordances (decision approaches included).
  // Person routes only when that person is in the scene record (OPT-1 presence; no ghost Ask).
  const openRoutes = openRouteView(state);
  const routeRows = openRoutes?.rows ?? [];
  const hereNow = peopleHere(state);
  if (routeRows.length && openRoutes) {
    const stepRoutes = openRoutes.step.routes ?? [];
    for (let i = 0; i < routeRows.length; i++) {
      const row = routeRows[i]!;
      let route: QuestRoute | null = null;
      for (let r = 0; r < stepRoutes.length; r++) {
        if ((stepRoutes[r]!.label ?? '').trim() === row.label) {
          route = stepRoutes[r]!;
          break;
        }
      }
      if (route?.kind === 'person') {
        const eid = (route.entityId ?? '').trim();
        const who = eid.toLowerCase().startsWith('npc:') ? eid.slice(4).trim() : eid;
        if (who) {
          let present = false;
          for (let h = 0; h < hereNow.length; h++) {
            if (mentionsName(hereNow[h]!, who) || mentionsName(who, hereNow[h]!)) {
              present = true;
              break;
            }
          }
          if (!present) continue;
        }
      }
      all.push({
        label: row.label,
        actionId: row.actionId,
        entityId: row.entityId,
        slotKind: 'quest',
        salience: 90 - i,
        required: true,
        check: withModeCheck ? checkForAction(state, parsePlayerIntent(row.label, state), row.label) : undefined,
      });
    }
  } else {
    const step = tabletopStepChip(state) ?? storyRpgDecisionChip(state);
    if (step) {
      all.push({
        label: step,
        actionId: 'quest:open-step:act',
        entityId: 'quest:open-step',
        slotKind: 'quest',
        salience: 90,
        required: true,
        check: withModeCheck ? checkForAction(state, parsePlayerIntent(step, state), step) : undefined,
      });
    }
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
        check: dnd || litrpg ? null : undefined,
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
        check: dnd || litrpg ? null : undefined,
      });
    }
  }
  let sawExit = false;
  for (let i = 0; i < all.length; i++) {
    if (all[i]!.slotKind === 'exit') {
      sawExit = true;
      break;
    }
  }
  if (!sawExit) {
    const names = exitPlaceNames(state);
    for (let i = 0; i < names.length; i++) {
      const dest = (names[i] ?? '').trim();
      if (!dest) continue;
      const entityId = `exit:${dest}`;
      all.push({
        label: `Travel toward ${dest}`,
        actionId: `exit:${entityId}:travel`,
        entityId,
        slotKind: 'exit',
        salience: visitedKeys.has(dest.toLowerCase()) ? 30 : 70,
        required: true,
        check: dnd || litrpg ? null : undefined,
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
      if (rpg) check = undefined;
      else if (!act.uncertain) check = null;
      else check = withModeCheck ? checkForAction(state, parsePlayerIntent(label, state), label) : undefined;
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
      check: withModeCheck ? checkForAction(state, parsePlayerIntent(label, state), label) : undefined,
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
      check: dnd || litrpg ? null : undefined,
    });
  }

  // Plan §4 item 5 / TT-C1: "Search the area" is an Investigation affordance on the place
  // (SRD 5.2.1 Ability Checks — Wizards of the Coast, CC BY 4.0), not an orphan cover pad.
  const place = (state.currentLocation ?? '').trim();
  if (place) {
    const label = 'Search the area';
    const entityId = `place:${place}`;
    all.push({
      label,
      actionId: `object:${entityId}:search`,
      entityId,
      slotKind: 'object',
      salience: 50,
      required: false,
      check: dnd ? checkForAction(state, parsePlayerIntent(label, state), label) : undefined,
    });
  }

  return all;
}

/** TT-C1 item 4 / OPT-1 — free chips never count against the affordance cap. */
export const FREE_INPUT_SAY = 'Say something…';
export const FREE_INPUT_DO = 'Do something else…';
export const FREE_INPUT_LABELS = [FREE_INPUT_SAY, FREE_INPUT_DO] as const;

export function isFreeInputChip(label: string): boolean {
  const t = (label ?? '').trim();
  return t === FREE_INPUT_SAY || t === FREE_INPUT_DO;
}

/**
 * True when scene affordances cover the old generic Scout/Ready/Wait/family pads (OPT-1 item 4).
 * Place-search alone does not replace doorway/Wait fallbacks — only entity-bound cards do
 * (person, exit, quest, shop, fight, object other than place:search, item).
 */
export function affordancesCoverGenerics(state: GameState): boolean {
  const all = collectSceneAffordances(state);
  for (let i = 0; i < all.length; i++) {
    const a = all[i]!;
    if (a.actionId === `object:place:${(state.currentLocation ?? '').trim()}:search`) continue;
    if (a.entityId.startsWith('place:') && a.actionId.endsWith(':search')) continue;
    return true;
  }
  return false;
}

/** Scene fingerprint for repeat suppression (record fields only — never label/prose). */
export function computeOptionSceneKey(state: GameState): {
  placeId: string;
  presentIds: string[];
  eventSeq: number;
} {
  const placeId = (state.currentLocation ?? '').trim();
  const presentIds: string[] = [];
  const people = presentNpcRecords(state);
  for (let i = 0; i < people.length; i++) {
    const m = people[i]!;
    presentIds.push((m.npcId || m.npcName || '').trim());
  }
  presentIds.sort();
  return { placeId, presentIds, eventSeq: state.optionSceneKey?.eventSeq ?? 0 };
}

/**
 * OPT-1 item 3 / John 17 Oct 08:41 — same actionId offered again with unchanged scene and no
 * activeSituation that lists it is a repeat. Situation-listed ids are never repeats.
 * Cooldown (John 17 Oct 12:48, mode switch 12:49): LitRPG/RPG use REPEAT_COOLDOWN_TURNS
 * (actionId + scene key); tabletop keeps only the streak rule. Exit slotKind never suppressed.
 */
export function isOptionRepeat(
  state: GameState,
  actionId: string,
  opts?: { slotKind?: AffordanceSlotKind; required?: boolean },
): boolean {
  if (!actionId) return false;
  if (opts?.slotKind === 'exit') return false;
  const sit = state.activeSituation;
  if (sit?.actionIds) {
    for (let i = 0; i < sit.actionIds.length; i++) {
      if (sit.actionIds[i] === actionId) return false;
    }
  }
  const sk = computeOptionSceneKey(state);
  const key = `${sk.placeId}\0${sk.presentIds.join('\0')}\0${sk.eventSeq}`;
  const hist = state.recentOfferedActions ?? [];
  const turn = state.turn ?? 0;
  const mode = state.engineMode;
  const cd =
    mode === 'litrpg'
      ? REPEAT_COOLDOWN_TURNS.litrpg
      : mode === 'rpg'
        ? REPEAT_COOLDOWN_TURNS.rpg
        : REPEAT_COOLDOWN_TURNS.dnd;

  if (cd > 0) {
    for (let i = hist.length - 1; i >= 0; i--) {
      const row = hist[i]!;
      if (row.sceneKey !== key) continue;
      let has = false;
      for (let j = 0; j < row.actionIds.length; j++) {
        if (row.actionIds[j] === actionId) {
          has = true;
          break;
        }
      }
      if (!has) continue;
      return turn - row.turn < cd;
    }
    return false;
  }

  // Tabletop: 08:41 streak ≥5 on optional chips only (required keep their slot).
  if (opts?.required) return false;
  let streak = 0;
  for (let i = hist.length - 1; i >= 0; i--) {
    const row = hist[i]!;
    if (row.sceneKey !== key) break;
    if (row.pickedActionId === actionId) break;
    let has = false;
    for (let j = 0; j < row.actionIds.length; j++) {
      if (row.actionIds[j] === actionId) {
        has = true;
        break;
      }
    }
    if (!has) break;
    streak += 1;
  }
  return streak >= 5;
}

/**
 * One chip on the final pad (q44-OCD2). Keyed by actionId. Label stays the plain action.
 * slotKind / required are engine fields so exits and the tabletop streak need no label match.
 */
export type OptionCooldownChip = {
  label: string;
  actionId: string;
  kind: string;
  slotKind?: AffordanceSlotKind;
  required?: boolean;
  cooldownReturn?: boolean;
  /** Lower loses its slot when a missing way-out must fit a full pad. */
  rank?: number;
};

/** Assembled pad size. A missing way-out appends under this and replaces the lowest rank at it. */
export const WAY_OUT_PAD_CAP = 48;

/**
 * q44-OCD2 (John 17 Oct 17:58) — ONE cooldown for the whole pad.
 * REPEAT_COOLDOWN_TURNS: tabletop 0, litrpg 5, rpg 5.
 * A chip offered in the last N turns of an unchanged scene (same place, same people,
 * same eventSeq, no activeSituation listing that actionId) is held back.
 * Exempt: exit / travel (slotKind exit, kind exit|hub|journey), free-input, and
 * actionIds an active situation calls for. A scene-key change ignores older rows.
 * If fewer than 2 non-free chips would remain, the least-recently offered held chip(s)
 * return with cooldownReturn. Tabletop does not use N; it keeps only the 08:41
 * situation-aware streak (isOptionRepeat when cooldown is 0).
 * q44b-OCD2x: when this place has exits or travel routes (location-sheet exits, else
 * graph travel edges, else exitPlaceNames — the same lists the exit/travel chips read),
 * the pad keeps at least one way-out (kind/slotKind/actionId, never a label word list).
 * If none survived, the least-recently offered route for this place is added. At
 * WAY_OUT_PAD_CAP it takes the lowest-ranked non-free, non-situation slot.
 */
export function applyOptionCooldown<T extends OptionCooldownChip>(state: GameState, pad: T[]): T[] {
  const mode = state.engineMode;
  const cd =
    mode === 'litrpg'
      ? REPEAT_COOLDOWN_TURNS.litrpg
      : mode === 'rpg'
        ? REPEAT_COOLDOWN_TURNS.rpg
        : REPEAT_COOLDOWN_TURNS.dnd;
  const sk = computeOptionSceneKey(state);
  const key = `${sk.placeId}\0${sk.presentIds.join('\0')}\0${sk.eventSeq}`;
  const hist = state.recentOfferedActions ?? [];
  const turn = state.turn ?? 0;
  const sit = state.activeSituation?.actionIds;
  const keep: T[] = [];
  const cooled: T[] = [];
  const cooledLast: number[] = [];

  for (let i = 0; i < pad.length; i++) {
    const chip = pad[i]!;
    const travel =
      chip.slotKind === 'exit' ||
      chip.kind === 'exit' ||
      chip.kind === 'hub' ||
      chip.kind === 'journey' ||
      chip.actionId.startsWith('exit:');
    if (chip.kind === 'free-input' || travel) {
      keep.push({ ...chip, cooldownReturn: undefined });
      continue;
    }
    let situation = false;
    if (sit) {
      for (let s = 0; s < sit.length; s++) {
        if (sit[s] === chip.actionId) {
          situation = true;
          break;
        }
      }
    }
    if (situation) {
      keep.push({ ...chip, cooldownReturn: undefined });
      continue;
    }

    let hold = false;
    let last = 0;
    if (cd > 0) {
      for (let h = hist.length - 1; h >= 0; h--) {
        const row = hist[h]!;
        if (row.turn >= turn) continue;
        if (row.sceneKey !== key) continue;
        let has = false;
        for (let j = 0; j < row.actionIds.length; j++) {
          if (row.actionIds[j] === chip.actionId) {
            has = true;
            break;
          }
        }
        if (!has) continue;
        if (turn - row.turn < cd) {
          hold = true;
          last = row.turn;
        }
        break;
      }
    } else {
      hold = isOptionRepeat(state, chip.actionId, {
        slotKind: chip.slotKind,
        required: chip.required,
      });
    }
    if (!hold) keep.push({ ...chip, cooldownReturn: undefined });
    else {
      cooled.push(chip);
      cooledLast.push(last);
    }
  }

  let nonFree = 0;
  for (let i = 0; i < keep.length; i++) {
    if (keep[i]!.kind !== 'free-input') nonFree += 1;
  }
  while (nonFree < 2 && cooled.length > 0) {
    let best = 0;
    for (let i = 1; i < cooled.length; i++) {
      if (cooledLast[i]! < cooledLast[best]!) best = i;
    }
    const row = cooled[best]!;
    cooled.splice(best, 1);
    cooledLast.splice(best, 1);
    keep.push({ ...row, cooldownReturn: true });
    nonFree += 1;
  }

  // q44b-OCD2x — one way out when this place has a route. Same data as the exit chips.
  let way = false;
  for (let i = 0; i < keep.length; i++) {
    const chip = keep[i]!;
    if (
      chip.slotKind === 'exit' ||
      chip.kind === 'exit' ||
      chip.kind === 'hub' ||
      chip.kind === 'journey' ||
      chip.actionId.startsWith('exit:')
    ) {
      way = true;
      break;
    }
  }
  if (!way) {
    const cands: T[] = [];
    const sheet = state.locationSheet?.exits ?? [];
    if (sheet.length) {
      for (let i = 0; i < sheet.length; i++) {
        const ex = sheet[i]!;
        const dest = (ex.label ?? '').trim();
        if (!dest) continue;
        const entityId = ex.id || `exit:${dest}`;
        cands.push({
          label: `Travel toward ${dest}`,
          actionId: `exit:${entityId}:travel`,
          kind: 'exit',
          slotKind: 'exit',
          required: true,
          rank: 70,
        } as T);
      }
    } else {
      const edges = enumerateLegalEdges(state);
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i]!;
        if (e.type !== 'travel') continue;
        const label = (e.label ?? '').trim();
        if (!label) continue;
        const target = (e.target ?? label).trim();
        cands.push({
          label,
          actionId: `exit:exit:${target}:travel`,
          kind: 'exit',
          slotKind: 'exit',
          required: true,
          rank: 70,
        } as T);
      }
    }
    if (!cands.length) {
      const names = exitPlaceNames(state);
      for (let i = 0; i < names.length; i++) {
        const dest = (names[i] ?? '').trim();
        if (!dest) continue;
        cands.push({
          label: `Travel toward ${dest}`,
          actionId: `exit:exit:${dest}:travel`,
          kind: 'exit',
          slotKind: 'exit',
          required: true,
          rank: 70,
        } as T);
      }
    }
    if (cands.length) {
      const prefix = `${sk.placeId}\0`;
      let best = 0;
      let bestTurn = Number.POSITIVE_INFINITY;
      for (let i = 0; i < cands.length; i++) {
        let last = -1;
        for (let h = 0; h < hist.length; h++) {
          const row = hist[h]!;
          if (row.sceneKey !== sk.placeId && !row.sceneKey.startsWith(prefix)) continue;
          const ids = row.actionIds;
          let has = false;
          for (let j = 0; j < ids.length; j++) {
            if (ids[j] === cands[i]!.actionId) {
              has = true;
              break;
            }
          }
          if (has && row.turn > last) last = row.turn;
        }
        if (last < bestTurn) {
          best = i;
          bestTurn = last;
        }
      }
      if (keep.length >= WAY_OUT_PAD_CAP) {
        let victim = -1;
        let victimRank = Number.POSITIVE_INFINITY;
        for (let i = 0; i < keep.length; i++) {
          const chip = keep[i]!;
          if (chip.kind === 'free-input') continue;
          if (
            chip.slotKind === 'exit' ||
            chip.kind === 'exit' ||
            chip.kind === 'hub' ||
            chip.kind === 'journey' ||
            chip.actionId.startsWith('exit:')
          ) {
            continue;
          }
          let situation = false;
          if (sit) {
            for (let s = 0; s < sit.length; s++) {
              if (sit[s] === chip.actionId) {
                situation = true;
                break;
              }
            }
          }
          if (situation) continue;
          const rank = chip.rank ?? 0;
          if (victim < 0 || rank < victimRank || (rank === victimRank && i > victim)) {
            victim = i;
            victimRank = rank;
          }
        }
        if (victim >= 0) keep.splice(victim, 1);
      }
      keep.push({ ...cands[best]!, cooldownReturn: undefined });
    }
  }
  return keep;
}

/** Record this turn's offered action ids (+ optional pick) for repeat / OPT-7. */
export function stampRecentOfferedActions(
  state: GameState,
  actionIds: string[],
  pickedActionId?: string | null,
): GameState {
  const sk = computeOptionSceneKey(state);
  const key = `${sk.placeId}\0${sk.presentIds.join('\0')}\0${sk.eventSeq}`;
  const row = {
    turn: state.turn ?? 0,
    sceneKey: key,
    actionIds: actionIds.slice(),
    pickedActionId: pickedActionId ?? undefined,
  };
  const prev = state.recentOfferedActions ?? [];
  const next = prev.length >= 24 ? [...prev.slice(-23), row] : [...prev, row];
  return { ...state, optionSceneKey: sk, recentOfferedActions: next };
}

/**
 * Dendry-style slot allocation: required kinds always win a slot; remaining by salience.
 * At most one exit chip. Person Talk chips: all when ≤2 named NPCs; when more, top 2.
 * Optional `state` applies the tabletop 08:41 streak only (cooldown 0).
 * LitRPG/RPG 5-turn hold lives in applyOptionCooldown, not here (q44-OCD2).
 */
export function allocateAffordanceSlots(
  affordances: SceneAffordance[],
  optionalCap = AFFORDANCE_OPTIONAL_CAP,
  state?: GameState,
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

  // Tabletop streak only. LitRPG/RPG cooldown is applyOptionCooldown on the final pad.
  const tabletopStreak = !!state && state.engineMode !== 'litrpg' && state.engineMode !== 'rpg';

  const picked: SceneAffordance[] = [];
  const seenAction = new Set<string>();

  for (let i = 0; i < personSlots.length; i++) {
    const row = personSlots[i]!;
    if (seenAction.has(row.actionId)) continue;
    if (
      tabletopStreak &&
      state &&
      isOptionRepeat(state, row.actionId, { slotKind: row.slotKind, required: row.required })
    ) {
      continue;
    }
    seenAction.add(row.actionId);
    picked.push(row);
  }
  for (let i = 0; i < otherRequired.length; i++) {
    const row = otherRequired[i]!;
    if (seenAction.has(row.actionId)) continue;
    if (
      tabletopStreak &&
      state &&
      isOptionRepeat(state, row.actionId, { slotKind: row.slotKind, required: row.required })
    ) {
      continue;
    }
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
    if (
      tabletopStreak &&
      state &&
      isOptionRepeat(state, row.actionId, { slotKind: row.slotKind, required: row.required })
    ) {
      continue;
    }
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
  // Mode thirds / System chrome are not people-in-the-room; always legal while bound.
  if (
    entityId.startsWith('system:') ||
    entityId.startsWith('skill:') ||
    entityId.startsWith('study:') ||
    entityId.startsWith('check:')
  ) {
    return true;
  }
  if (entityId.startsWith('npc:') || entityId.startsWith('contact:') || entityId.startsWith('standing:')) {
    const who = entityId.slice(entityId.indexOf(':') + 1).trim();
    if (!who) return false;
    // Generic contact ids (contact:quest-s1) are not named people — legal while the route is open.
    if (entityId.startsWith('contact:') && !who.includes(' ')) {
      return !!openRouteView(state);
    }
    const here = peopleHere(state);
    for (let h = 0; h < here.length; h++) {
      if (mentionsName(here[h]!, who) || mentionsName(who, here[h]!)) return true;
    }
    return false;
  }
  if (entityId.startsWith('place:') || entityId.startsWith('object:')) {
    const open = openRouteView(state);
    if (!open) return false;
    const rows = open.rows;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i]!.entityId === entityId) return true;
    }
    return false;
  }
  if (entityId.startsWith('quest-route:') || entityId.startsWith('quest:')) {
    const open = openRouteView(state);
    if (!open) return false;
    if (entityId.startsWith('quest-route:')) {
      const rows = open.rows;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i]!.entityId === entityId || rows[i]!.actionId === entityId) return true;
      }
      return false;
    }
    return !(open.step.routes?.length) && !!(tabletopStepChip(state) ?? storyRpgDecisionChip(state));
  }
  const all = collectSceneAffordances(state);
  for (let i = 0; i < all.length; i++) {
    if (all[i]!.entityId === entityId) return true;
  }
  return false;
}
