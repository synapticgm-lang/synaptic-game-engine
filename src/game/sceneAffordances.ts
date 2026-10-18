/**
 * TT-C1 / OPT-1 — options from the engine scene record (mode-agnostic).
 * Slot rank is Dendry-style salience (Ian D. Millington; pattern only, not a Dendry port).
 * Tabletop CheckSpec from checkForAction / SRD 5.2.1 (Wizards of the Coast, CC BY 4.0):
 * "The DM calls for an ability check when a character attempts an action (other than an
 * attack) that has a chance of failure. When the outcome is uncertain, the dice determine
 * the result." Roll only when uncertain; a certain open (unlocked door) carries no CheckSpec.
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
import { applyGraphExitTravel } from './mapEngine';
import { parseTravelDestination } from './outdoorHubs';
import { isJourneyPad, isJourneyStepLine, isJourneyUnderway, isTripHere, mapGapBetween } from './travelJourney';
import { travelEngineChip } from './rules/travelDay';
import { forwardThreadAffordance, isPlaceOpenForExit } from './openThreads';
import type { QuestRoute } from './types';
export function isWayOut(chip: {
  kind?: string;
  actionId?: string;
  action?: string;
  slotKind?: string;
}): boolean {
  const id = chip.actionId ?? chip.action ?? '';
  return (
    chip.slotKind === 'exit' ||
    chip.kind === 'exit' ||
    chip.kind === 'hub' ||
    chip.kind === 'journey' ||
    id.startsWith('exit:')
  );
}
export function wayOutMovesPlayer(state: GameState, label: string): boolean {
  if (applyGraphExitTravel(state, label) !== state) return true;
  if (isJourneyUnderway(state) && isJourneyPad(state, label)) return true;
  const hub = parseTravelDestination(label, state.campaignBibleId);
  if (!hub) return false;
  const here = (state.currentLocation ?? '').trim();
  if (!here || hub.name.toLowerCase() === here.toLowerCase()) return false;
  if (isTripHere(state, hub.name)) return false;
  return mapGapBetween(state, here, hub.name).steps > 0;
}
/** q45b-SLOT — one final-pad slot. Free-input chips are not a slot. */
export type SlotCategory = 'move' | 'talk' | 'act' | 'scene';
export type AffordanceSlotKind =
  | 'person'
  | 'quest'
  | 'exit'
  | 'shop'
  | 'fight'
  | 'object'
  | 'item';
export interface SceneAffordance {
  label: string;
  actionId: string;
  entityId: string;
  slotKind: AffordanceSlotKind;
  salience: number;
  required: boolean;
  check?: CheckSpec | null;
  cooldownReturn?: boolean;
  /** q45b-SLOT — final-pad slot. Set from the engine record, never from the label. */
  slotCategory?: SlotCategory;
}
export const REPEAT_COOLDOWN_TURNS = {
  tabletop: 0,
  dnd: 0,
  litrpg: 5,
  rpg: 5,
} as const;
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
export function collectSceneAffordances(state: GameState): SceneAffordance[] {
  const all: SceneAffordance[] = [];
  const mode = state.engineMode;
  const dnd = mode === 'dnd';
  const litrpg = mode === 'litrpg';
  const rpg = mode === 'rpg';
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
  // TT-T1 — scene planner brought an open thread forward (engine record; plain label).
  const forward = forwardThreadAffordance(state);
  if (forward) {
    all.push({
      label: forward.label,
      actionId: forward.actionId,
      entityId: forward.entityId,
      slotKind: 'quest',
      slotCategory: 'scene',
      salience: 95,
      required: true,
      check: withModeCheck
        ? checkForAction(state, parsePlayerIntent(forward.label, state), forward.label)
        : undefined,
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
        slotCategory: route?.kind === 'person' ? 'talk' : 'scene',
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
        slotCategory: 'scene',
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
      if (!dest || !isPlaceOpenForExit(state, dest)) continue;
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
      if (target && !isPlaceOpenForExit(state, target)) continue;
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
      if (!dest || !isPlaceOpenForExit(state, dest)) continue;
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
  for (let i = 0; i < all.length; i++) {
    const a = all[i]!;
    if (a.slotCategory) continue;
    const id = a.actionId;
    if (a.slotKind === 'exit') a.slotCategory = 'move';
    else if (a.slotKind === 'fight' || a.slotKind === 'shop' || a.slotKind === 'quest') a.slotCategory = 'scene';
    else if (a.slotKind === 'person') {
      const skill =
        id.endsWith(':skill') ||
        id.endsWith(':system') ||
        id.endsWith(':insight') ||
        id.endsWith(':standing');
      a.slotCategory = skill ? 'act' : 'talk';
    } else a.slotCategory = 'act';
  }
  return all;
}
export const FREE_INPUT_SAY = 'Say something…';
export const FREE_INPUT_DO = 'Do something else…';
export const FREE_INPUT_LABELS = [FREE_INPUT_SAY, FREE_INPUT_DO] as const;
export function isFreeInputChip(label: string): boolean {
  const t = (label ?? '').trim();
  return t === FREE_INPUT_SAY || t === FREE_INPUT_DO;
}
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
export function optionSceneKeyString(sk: {
  placeId: string;
  presentIds: string[];
  eventSeq: number;
}): string {
  return JSON.stringify([sk.placeId, sk.presentIds, sk.eventSeq]);
}
/** Rewrite q37-C1b NUL scene keys so a cooldown still matches after load. */
export function normalizeOfferedActionKeys(state: GameState): GameState {
  const hist = state.recentOfferedActions;
  if (!hist || !hist.length) return state;
  let changed = false;
  const next: NonNullable<GameState['recentOfferedActions']> = [];
  for (let i = 0; i < hist.length; i++) {
    const row = hist[i]!;
    const raw = row.sceneKey ?? '';
    if (!raw.includes('\u0000')) {
      next.push(row);
      continue;
    }
    changed = true;
    const parts = raw.split('\u0000');
    const placeId = parts[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]! : '0';
    const n = Number(last);
    const middle = parts.length > 2 ? parts.slice(1, -1) : [];
    let any = false;
    for (let m = 0; m < middle.length; m++) if (middle[m]) any = true;
    next.push({
      ...row,
      sceneKey: optionSceneKeyString({
        placeId,
        presentIds: any ? middle.slice() : [],
        eventSeq: Number.isFinite(n) ? n : 0,
      }),
    });
  }
  if (!changed) return state;
  return { ...state, recentOfferedActions: next };
}
export function isOptionRepeat(
  state: GameState,
  actionId: string,
  opts?: { slotKind?: AffordanceSlotKind; required?: boolean },
): boolean {
  if (!actionId) return false;
  if (opts?.slotKind === 'exit') return false;
  state = normalizeOfferedActionKeys(state);
  const sit = state.activeSituation;
  if (sit?.actionIds) {
    for (let i = 0; i < sit.actionIds.length; i++) {
      if (sit.actionIds[i] === actionId) return false;
    }
  }
  const sk = computeOptionSceneKey(state);
  const key = optionSceneKeyString(sk);
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
 * One chip on the final pad (q45b-SLOT). Keyed by actionId. Label stays the plain action.
 * slotCategory is the engine slot (move|talk|act|scene). Free-input is not a slot.
 */
export type OptionCooldownChip = {
  label: string;
  actionId: string;
  kind: string;
  slotKind?: AffordanceSlotKind;
  slotCategory?: SlotCategory;
  entityId?: string;
  required?: boolean;
  cooldownReturn?: boolean;
  rank?: number;
};
/** q45b-SLOT: MOVE, TALK, ACT, SCENE, FREE, then free-input. Empty MOVE is filled from place routes. */
export function applyOptionCooldown<T extends OptionCooldownChip>(state: GameState, pad: T[]): T[] {
  const mode = state.engineMode;
  const cd =
    mode === 'litrpg'
      ? REPEAT_COOLDOWN_TURNS.litrpg
      : mode === 'rpg'
        ? REPEAT_COOLDOWN_TURNS.rpg
        : REPEAT_COOLDOWN_TURNS.dnd;
  state = normalizeOfferedActionKeys(state);
  const sk = computeOptionSceneKey(state);
  const key = optionSceneKeyString(sk);
  const hist = state.recentOfferedActions ?? [];
  const turn = state.turn ?? 0;
  const sit = state.activeSituation?.actionIds;
  const people = presentNpcRecords(state);
  const move: T[] = [];
  const talk: T[] = [];
  const act: T[] = [];
  const scene: T[] = [];
  const freeIn: T[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < pad.length; i++) {
    const chip = pad[i]!;
    if (!chip.actionId) continue;
    if (seen.has(chip.actionId)) continue;
    if (chip.kind === 'free-input') {
      freeIn.push(chip);
      continue;
    }
    let cat = chip.slotCategory;
    if (!cat) {
      const id = chip.actionId;
      if (chip.kind === 'journey' && !isJourneyStepLine(chip.label) && !travelEngineChip(chip.label)) cat = 'scene';
      else if (isWayOut(chip) || chip.slotKind === 'exit') cat = 'move';
      else if (
        chip.slotKind === 'fight' ||
        chip.slotKind === 'shop' ||
        chip.slotKind === 'quest' ||
        chip.kind === 'shop' ||
        chip.kind === 'dungeon' ||
        chip.kind === 'quest-step' ||
        chip.kind === 'spine' ||
        chip.kind === 'decision' ||
        chip.kind === 'beat'
      ) {
        cat = 'scene';
      } else if (chip.slotKind === 'person') {
        const skill =
          id.endsWith(':skill') ||
          id.endsWith(':system') ||
          id.endsWith(':insight') ||
          id.endsWith(':standing');
        cat = skill ? 'act' : 'talk';
      } else cat = 'act';
    }
    if (cat === 'move' && !wayOutMovesPlayer(state, chip.label)) continue;
    if (cat === 'talk') {
      let here = false;
      const ent = chip.entityId ?? '';
      for (let p = 0; p < people.length; p++) {
        const m = people[p]!;
        const id = (m.npcId ?? '').trim();
        const name = (m.npcName ?? '').trim();
        if (id && (ent === id || chip.actionId.includes(id))) {
          here = true;
          break;
        }
        if (
          name &&
          (ent === `npc:${name}` ||
            chip.actionId.includes(`npc:${name}`) ||
            chip.actionId.includes(`:${name}:`) ||
            chip.actionId.endsWith(`:${name}`))
        ) {
          here = true;
          break;
        }
      }
      if (!here) continue;
    }
    seen.add(chip.actionId);
    const row = { ...chip, slotCategory: cat, cooldownReturn: undefined };
    if (cat === 'move') move.push(row);
    else if (cat === 'talk') talk.push(row);
    else if (cat === 'scene') scene.push(row);
    else act.push(row);
  }
  if (!move.length) {
  const sheet = state.locationSheet?.exits ?? [];
  const raw: T[] = [];
  if (sheet.length) {
    for (let i = 0; i < sheet.length; i++) {
      const ex = sheet[i]!;
      const dest = (ex.label ?? '').trim();
      if (!dest || !isPlaceOpenForExit(state, dest)) continue;
      const entityId = ex.id || `exit:${dest}`;
      raw.push({
        label: `Travel toward ${dest}`,
        actionId: `exit:${entityId}:travel`,
        kind: 'exit',
        slotKind: 'exit',
        slotCategory: 'move',
        entityId,
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
      if (target && !isPlaceOpenForExit(state, target)) continue;
      raw.push({
        label,
        actionId: `exit:exit:${target}:travel`,
        kind: 'exit',
        slotKind: 'exit',
        slotCategory: 'move',
        entityId: `exit:${target}`,
        required: true,
        rank: 70,
      } as T);
    }
  }
  if (!raw.length) {
    const names = exitPlaceNames(state);
    for (let i = 0; i < names.length; i++) {
      const dest = (names[i] ?? '').trim();
      if (!dest || !isPlaceOpenForExit(state, dest)) continue;
      raw.push({
        label: `Travel toward ${dest}`,
        actionId: `exit:exit:${dest}:travel`,
        kind: 'exit',
        slotKind: 'exit',
        slotCategory: 'move',
        entityId: `exit:${dest}`,
        required: true,
        rank: 70,
      } as T);
    }
  }
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i]!;
    if (seen.has(row.actionId)) continue;
    if (!wayOutMovesPlayer(state, row.label)) continue;
    seen.add(row.actionId);
    move.push(row);
  }
  }
  const picked: T[] = [];
  const used = new Set<string>();
  let talkFilled = false;
  for (let slot = 0; slot < 5; slot++) {
    const pool = slot === 0 ? move : slot === 1 ? talk : slot === 2 ? act : slot === 3 ? scene : null;
    const cands: T[] = [];
    if (pool) {
      for (let i = 0; i < pool.length; i++) {
        if (!used.has(pool[i]!.actionId)) cands.push(pool[i]!);
      }
    } else {
      const rest = [move, talk, act, scene];
      for (let g = 0; g < rest.length; g++) {
        const group = rest[g]!;
        for (let i = 0; i < group.length; i++) {
          const row = group[i]!;
          if (used.has(row.actionId)) continue;
          if (talkFilled && row.slotCategory === 'talk') continue;
          cands.push(row);
        }
      }
    }
    if (!cands.length) continue;
    for (let i = 1; i < cands.length; i++) {
      const cur = cands[i]!;
      let j = i - 1;
      while (j >= 0 && (cands[j]!.rank ?? 0) < (cur.rank ?? 0)) {
        cands[j + 1] = cands[j]!;
        j -= 1;
      }
      cands[j + 1] = cur;
    }
    const holds: boolean[] = [];
    const lasts: number[] = [];
    for (let i = 0; i < cands.length; i++) {
      const id = cands[i]!.actionId;
      let situation = false;
      if (sit) {
        for (let s = 0; s < sit.length; s++) {
          if (sit[s] === id) {
            situation = true;
            break;
          }
        }
      }
      let hold = false;
      let last = -1;
      if (cd > 0 && !situation) {
        for (let h = hist.length - 1; h >= 0; h--) {
          const row = hist[h]!;
          if (row.turn >= turn) continue;
          if (row.sceneKey !== key) continue;
          let has = false;
          for (let j = 0; j < row.actionIds.length; j++) {
            if (row.actionIds[j] === id) {
              has = true;
              break;
            }
          }
          if (!has) continue;
          last = row.turn;
          if (turn - row.turn < cd) hold = true;
          break;
        }
      }
      holds.push(hold);
      lasts.push(last);
    }
    let choice = -1;
    for (let i = 0; i < cands.length; i++) {
      if (!holds[i]) {
        choice = i;
        break;
      }
    }
    let back = false;
    if (choice < 0) {
      choice = 0;
      let bestLast = lasts[0]!;
      for (let i = 1; i < cands.length; i++) {
        if (lasts[i]! < bestLast) {
          bestLast = lasts[i]!;
          choice = i;
        }
      }
      back = true;
    }
    const row = cands[choice]!;
    used.add(row.actionId);
    if (row.slotCategory === 'talk') talkFilled = true;
    picked.push({ ...row, cooldownReturn: back ? true : undefined });
  }
  for (let i = 0; i < freeIn.length; i++) {
    picked.push({ ...freeIn[i]!, cooldownReturn: undefined });
  }
  return picked;
}
export function stampRecentOfferedActions(
  state: GameState,
  actionIds: string[],
  pickedActionId?: string | null,
): GameState {
  const sk = computeOptionSceneKey(state);
  const key = optionSceneKeyString(sk);
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
export function affordanceEntityPresent(state: GameState, entityId: string): boolean {
  if (!entityId) return false;
  if (entityId.startsWith('foe:')) {
    const enc = state.activeEncounter;
    return !!(enc && enc.hp > 0 && entityId === `foe:${(enc.name ?? 'foe').trim()}`);
  }
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
