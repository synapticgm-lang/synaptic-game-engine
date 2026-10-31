/**
 * TT-C1 / OPT-1 — options from the engine scene record (mode-agnostic).
 * Slot rank is Dendry-style salience (Ian D. Millington; pattern only, not a Dendry port).
 * Tabletop CheckSpec from checkForAction / SRD 5.2.1 (Wizards of the Coast, CC BY 4.0):
 * "The DM calls for an ability check when a character attempts an action (other than an
 * attack) that has a chance of failure. When the outcome is uncertain, the dice determine
 * the result." Roll only when uncertain; a certain open (unlocked door) carries no CheckSpec.
 * Labels stay the plain action (feature-groups-plan §4). No word lists or label regexes.
 */
import type { GameState, PlaceExitRow, QuestRoute } from './types';
import { isEmptyRoomPersonSlot } from './chromeAuthority';
import { checkForAction, type CheckSpec } from './checkMath';
import { parsePlayerIntent } from './intentParser';
import { presentNpcRecords, resolveNpcRecord } from './npcRecords';
import { merchantHere } from './merchant';
import { tabletopStepChip } from './tabletopQuestProgress';
import {
  contactChip,
  standingContactsHere,
  storyRpgDecisionChip,
} from './storyRpgProgress';
import { enumerateLegalEdges } from './graphChoices';
import { exitPlaceNames } from './placeNames';
import { placeExitRows } from './placeRegistry';
import { openRouteView, presentPersonForRoute } from './questRoutes';
import { mainSpineQuest } from './questPlay';
import { mentionsName, peopleHere } from './scenePresence';
import { applyGraphExitTravel } from './mapEngine';
import { parseTravelDestination } from './outdoorHubs';
import { isJourneyOnwardLine, isJourneyPad, isJourneyStepLine, isJourneyUnderway, isTripHere, mapGapBetween } from './travelJourney';
import { travelEngineChip } from './rules/travelDay';
import { forwardThreadAffordance, isPlaceOpenForExit, npcChipWant, stallPressureActive } from './openThreads';
import { isDying } from './tabletop/roundFight';
import { originPad } from './rules/rpgOrigin';
import { travelPadBlocked } from './padUniverse';
import { capFightChips, legalFightActionsThisRound, roundCombatChips } from './tabletop/combatChips';
import { choiceCountLimitOf } from './rules/houseRules';
import { activeHereSpot, stepCloserChip } from './hereSpot';
import { isSearchTargetEmpty, normalizeSearchTarget } from './searchContinuity';

export { presentPersonForRoute } from './questRoutes';

/** How many times this actionId was picked in the current scene key (T10AA non-outcome starve). */
function pickedCountInScene(state: GameState, actionId: string): number {
  if (!actionId) return 0;
  const sk = optionSceneKeyString(computeOptionSceneKey(state));
  const hist = state.recentOfferedActions ?? [];
  let n = 0;
  for (let i = 0; i < hist.length; i++) {
    const row = hist[i]!;
    if (row.sceneKey !== sk) continue;
    if (row.pickedActionId === actionId) n += 1;
  }
  return n;
}

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

/** Sheet / hub id when the row has one; otherwise the place label. */
function exitEntityId(row: { id?: string; label?: string }): string {
  const id = (row.id ?? '').trim();
  if (id) return id;
  return (row.label ?? '').trim();
}

/**
 * T10AC — one reachable-exit list for MOVE chips and the ghost-chip gate.
 * placeExitRows (recorded from HERE) plus the open quest step's placeId when off-site
 * (T10AA Front Door travel). Never invent a parallel `place:` entity the gate cannot see.
 */
export function recordedTravelDestinations(state: GameState): PlaceExitRow[] {
  const rows = placeExitRows(state, state.currentLocation);
  const open = openRouteView(state);
  const dest = (open?.step.placeId ?? open?.step.place ?? '').trim();
  if (!dest) return rows;
  const here = (state.currentLocation ?? '').trim().toLowerCase();
  if (!here || dest.toLowerCase() === here) return rows;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    if (row.label.toLowerCase() === dest.toLowerCase()) return rows;
    if (exitEntityId(row).toLowerCase() === dest.toLowerCase()) return rows;
  }
  return [...rows, { id: dest, label: dest }];
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
    // q50b-FIGHT2: attack/flee/parley from the encounter record (fleeAvailable/parleyAvailable).
    const edges = enumerateLegalEdges(state);
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i]!;
      if (e.type !== 'attack' && e.type !== 'flee' && e.type !== 'parley') continue;
      const label = (e.label ?? '').trim();
      if (!label) continue;
      all.push({
        label,
        actionId: `fight:foe:${name}:${e.type}`,
        entityId: `foe:${name}`,
        slotKind: 'fight',
        slotCategory: 'scene',
        salience: e.type === 'attack' ? 100 : e.type === 'flee' ? 99 : 98,
        required: true,
        check: dnd ? checkForAction(state, parsePlayerIntent(label, state), label) : undefined,
      });
    }
  }
  // T10RC6 — Ask/Talk/Read chips use the same seat list as peopleHere (not bare lives-here records
  // while the place text / crowd record says nobody is here).
  const seatedHere = peopleHere(state);
  const people = presentNpcRecords(state).filter((m) =>
    seatedHere.some((p) => mentionsName(p, m.npcName) || mentionsName(m.npcName, p)),
  );
  let contactNames: Set<string> | null = null;
  if (rpg) {
    contactNames = new Set();
    const contactList = standingContactsHere(state);
    for (let n = 0; n < contactList.length; n++) contactNames.add(contactList[n]!.toLowerCase());
  }
  const openQuest = rpg ? mainSpineQuest(state) : null;
  const openStep =
    openQuest?.objectives?.find((o) => !o.completed)?.description?.trim() ?? '';
  // T10AN — out of talking range: one Step-closer chip each (Talk/Ask/Read stay off via presentNpcRecords).
  const awayFrom = activeHereSpot(state)?.awayFrom ?? [];
  for (let a = 0; a < awayFrom.length; a++) {
    const name = (awayFrom[a] ?? '').trim();
    if (!name) continue;
    const closer = stepCloserChip(name);
    all.push({
      label: closer,
      actionId: `person:spot:${name.toLowerCase().replace(/\s+/g, '-')}:closer`,
      entityId: `npc:${name}`,
      slotKind: 'person',
      slotCategory: 'move',
      salience: 86 - a,
      required: true,
      check: undefined,
    });
  }
  // T10Q — one chip family per person entity (canonical record), never title-alias duplicates.
  const seenPersonEntity = new Set<string>();
  for (let i = 0; i < people.length; i++) {
    const raw = people[i]!;
    const canonical = resolveNpcRecord(state, raw.npcName) ?? raw;
    const name = (canonical.npcName ?? '').trim();
    // T10Q5R — never chip a missing / empty-room / placeholder seat (Nobody, blank name).
    if (!name || isEmptyRoomPersonSlot(name)) continue;
    const entityId = canonical.npcId || `npc:${name}`;
    if (seenPersonEntity.has(entityId)) continue;
    seenPersonEntity.add(entityId);
    const m = canonical.npcId === raw.npcId ? raw : { ...raw, ...canonical, npcName: name, npcId: entityId };
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
      const insightId = `person:${entityId}:insight`;
      if (!personChipExhausted(state, insightId)) {
        const insight = `Read ${name}`;
        all.push({
          label: insight,
          actionId: insightId,
          entityId,
          slotKind: 'person',
          salience: 40 - i,
          required: false,
          check: checkForAction(state, parsePlayerIntent(insight, state), insight),
        });
      }
    } else if (litrpg) {
      const skillId = `person:${entityId}:skill`;
      if (!personChipExhausted(state, skillId)) {
        const skill = `Read ${name}`;
        all.push({
          label: skill,
          actionId: skillId,
          entityId,
          slotKind: 'person',
          salience: 65 - i,
          required: false,
          check: checkForAction(state, parsePlayerIntent(skill, state), skill),
        });
      }
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
      const standingId = `person:${entityId}:standing`;
      // T10AA + T10AB: Press standing with no outcome must not loop; drop after one pick in this scene or when exhausted.
      if (pickedCountInScene(state, standingId) < 1 && !personChipExhausted(state, standingId)) {
        const standing = `Press your standing with ${name}`;
        all.push({
          label: standing,
          actionId: standingId,
          entityId,
          slotKind: 'person',
          salience: 63 - i,
          required: false,
          check: undefined,
        });
      }
      if (contactNames?.has(name.toLowerCase()) && openStep) {
        const contactId = `person:${entityId}:contact`;
        if (!personChipExhausted(state, contactId)) {
          const contact = contactChip(name, openStep);
          all.push({
            label: contact,
            actionId: contactId,
            entityId,
            slotKind: 'person',
            salience: 88 - i,
            required: true,
            check: undefined,
          });
        }
      }
    }
    if (m.goal?.motivation && (m.goal.target || m.need)) {
      // Same want source as Follow-up chips (bound goal target, not role-template need).
      const about = npcChipWant(m);
      const agendaId = `person:${entityId}:agenda`;
      // T10AA + T10AB: same Ask-about with no quest tick yields to travel / next lead (Edda loop); both guards apply.
      if (about && pickedCountInScene(state, agendaId) < 1 && !personChipExhausted(state, agendaId)) {
        const agenda = `Ask ${name} about ${about}`;
        all.push({
          label: agenda,
          actionId: agendaId,
          entityId,
          slotKind: 'person',
          salience: 85 - i,
          required: true,
          check: withModeCheck ? checkForAction(state, parsePlayerIntent(agenda, state), agenda) : undefined,
        });
      }
    }
  }
  // TT-T1 — open thread forward. T10Q: skip when Ask-about already covers the same person (no duplicate action).
  const forward = forwardThreadAffordance(state);
  if (forward) {
    const askSame = all.some(
      (a) => a.actionId.endsWith(':agenda') && a.entityId === forward.entityId,
    );
    if (!askSame) {
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
  }
  const openRoutes = openRouteView(state);
  const routeRows = openRoutes?.rows ?? [];
  const hereNow = peopleHere(state);
  const herePlace = (state.currentLocation ?? '').trim().toLowerCase();
  let placeSearchHere = false;
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
      if (route?.failed) continue;
      const stepPlaceRaw = (openRoutes.step.placeId ?? openRoutes.step.place ?? '').trim();
      const stepHasPlace = !!stepPlaceRaw;
      const stepPlace = (stepPlaceRaw || route?.placeId || '').trim().toLowerCase();
      const routePlace = (route?.placeId ?? stepPlace).trim().toLowerCase();
      // Contact with nobody Friendly stays offered: pick fails once, then `failed` skips re-offer (OPT4-2).
      if (route?.kind === 'person') {
        const bound = presentPersonForRoute(state, route);
        if (!bound) continue;
        // Authored approach labels stay; rewrite only when a generic witness binds to a present speaker.
        const authored = (row.label ?? '').trim();
        const label =
          authored && mentionsName(authored, bound.name)
            ? authored
            : `Ask ${bound.name} about the lead`;
        all.push({
          label,
          actionId: row.actionId,
          entityId: bound.entityId,
          slotKind: 'quest',
          slotCategory: 'talk',
          salience: 90 - i,
          required: true,
          check: withModeCheck ? checkForAction(state, parsePlayerIntent(label, state), label) : undefined,
        });
        continue;
      }
      // T10Q — object chips only where the object is; arrival look only at its place.
      // Approach place leads (Scout camp from Waystation) stay when placeId ≠ HERE (T10N).
      if (route?.kind === 'object') {
        if (routePlace && herePlace && routePlace !== herePlace) continue;
      }
      if (route?.kind === 'place' && (route.entityId ?? '').trim() === 'place:arrival') {
        if (routePlace && herePlace && routePlace !== herePlace) continue;
      }
      // Placed open-step Search off-site → travel chip below. Placeless approach routes stay.
      if (
        route?.kind === 'place' &&
        stepHasPlace &&
        routePlace &&
        herePlace &&
        routePlace !== herePlace
      ) {
        continue;
      }
      if (route && (route.kind === 'place' || route.kind === 'object')) {
        if (routePlace && herePlace && routePlace === herePlace) placeSearchHere = true;
      }
      all.push({
        label: row.label,
        actionId: row.actionId,
        entityId: row.entityId,
        slotKind: 'quest',
        slotCategory: 'scene',
        salience: 90 - i,
        required: true,
        check: withModeCheck ? checkForAction(state, parsePlayerIntent(row.label, state), row.label) : undefined,
      });
    }
    // T10AC — off-site quest placeId is folded into recordedTravelDestinations (same list as
    // exit chips + ghost gate). Do not invent a parallel place: entityId travel chip here.
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
  // T10AC / q50e — MOVE exits from recordedTravelDestinations (placeExitRows + open quest place).
  const questTravelDest = (
    openRoutes?.step.placeId ?? openRoutes?.step.place ?? ''
  )
    .trim()
    .toLowerCase();
  const recordExits = recordedTravelDestinations(state);
  if (recordExits.length) {
    for (let i = 0; i < recordExits.length; i++) {
      const row = recordExits[i]!;
      const dest = row.label;
      if (!dest || !isPlaceOpenForExit(state, dest)) continue;
      const entityId = exitEntityId(row);
      const chip = `Travel toward ${dest}`;
      const questBoost = !!questTravelDest && dest.toLowerCase() === questTravelDest;
      all.push({
        label: chip,
        actionId: `exit:${entityId}:travel`,
        entityId,
        slotKind: 'exit',
        salience: questBoost ? 92 : visitedKeys.has(dest.toLowerCase()) ? 30 : 70,
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
      const entityId = target;
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
      const entityId = dest;
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
  // T10N — one search chip: quest "Search {HERE} for signs" already covers the same action.
  // T10AR — once THIS place is on searchedEmpty (found nothing / already searched), do not
  // re-offer Search as a fresh chip (s9601 T158→T162 / Safehouse alley loops).
  if (place && !placeSearchHere) {
    const label = 'Search the area';
    const searchKey = normalizeSearchTarget(label, place);
    if (!isSearchTargetEmpty(state.sceneFacts, searchKey)) {
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
/**
 * T10AB — once a person insight/agenda/skill/standing chip is picked in this scene, do not
 * re-offer it until place/present changes. Picking used to reset the tabletop streak so
 * "Read X" / "Ask about…" could spam with no new outcome until LOOP STOP.
 */
export function affordancePickedInScene(state: GameState, actionId: string): boolean {
  if (!actionId) return false;
  const key = optionSceneKeyString(computeOptionSceneKey(state));
  const hist = state.recentOfferedActions ?? [];
  for (let i = 0; i < hist.length; i++) {
    const row = hist[i]!;
    if (row.sceneKey === key && row.pickedActionId === actionId) return true;
  }
  return false;
}

function personChipExhausted(state: GameState, actionId: string): boolean {
  if (
    !actionId.endsWith(':insight')
    && !actionId.endsWith(':skill')
    && !actionId.endsWith(':standing')
    && !actionId.endsWith(':agenda')
    && !actionId.endsWith(':contact')
  ) {
    return false;
  }
  if (affordancePickedInScene(state, actionId)) return true;
  // Ledger topic: insight attempt already committed on the NPC this scene.
  if (actionId.endsWith(':insight') || actionId.endsWith(':skill')) {
    // No regex in this file (C1-7 / OPT1-6). actionId shape: person:<entityId>:insight|skill
    let entityId = actionId.startsWith('person:') ? actionId.slice('person:'.length) : actionId;
    if (entityId.endsWith(':insight')) entityId = entityId.slice(0, -':insight'.length);
    else if (entityId.endsWith(':skill')) entityId = entityId.slice(0, -':skill'.length);
    const mems = state.npcMemories ?? [];
    for (let i = 0; i < mems.length; i++) {
      const m = mems[i]!;
      const id = m.npcId || `npc:${m.npcName}`;
      if (id !== entityId && `npc:${m.npcName}` !== entityId) continue;
      if ((m.completedTopics ?? []).includes('insight')) return true;
    }
  }
  return false;
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
  // q73r-DYING: death-save turns keep only the dying builders already on the pad.
  // Empty MOVE refill (Travel toward …) must not reappear after a same-turn drop to 0.
  if (isDying(state)) {
    const dying: T[] = [];
    for (let i = 0; i < pad.length; i++) {
      const chip = pad[i]!;
      if (chip.kind === 'dying' || (chip.actionId ?? '').startsWith('dying:')) dying.push(chip);
    }
    return dying;
  }
  // T10W: Story RPG origin setup owns the pad until recorded (same exclusive shape as dying).
  // Empty-MOVE refill must not inject Travel toward … beside Origin / Quick start chips.
  const originOnly = originPad(state);
  if (originOnly?.length) {
    const want = new Set<string>();
    for (let i = 0; i < originOnly.length; i++) want.add(originOnly[i]!.trim().toLowerCase());
    const kept: T[] = [];
    for (let i = 0; i < pad.length; i++) {
      const chip = pad[i]!;
      const low = (chip.label ?? '').trim().toLowerCase();
      if (want.has(low)) kept.push({ ...chip, cooldownReturn: undefined });
    }
    return kept;
  }
  // q75r: one availability source — fight / road lane / dying already covered by travelPadBlocked.
  const noTravel = travelPadBlocked(state);
  const mode = state.engineMode;
  const enc = state.activeEncounter;
  const liveFight = !!enc && (enc.hp ?? 0) > 0 && enc.phase !== 'pending' && enc.phase !== 'terminal';
  let work = pad;
  if (noTravel) {
    const kept: T[] = [];
    for (let i = 0; i < work.length; i++) {
      const chip = work[i]!;
      const id = chip.actionId ?? '';
      if (chip.slotCategory === 'move' || chip.slotKind === 'exit' || chip.kind === 'exit' || id.includes(':travel')) {
        continue;
      }
      kept.push(chip);
    }
    work = kept;
  }
  // q50b-FIGHT2: flee/parley always on the LitRPG/RPG live-fight pad; cooldown never rests them.
  if (liveFight && mode !== 'dnd') {
    const foe = (enc!.name ?? 'foe').trim();
    const have = new Set<string>();
    for (let i = 0; i < pad.length; i++) {
      if (pad[i]!.actionId) have.add(pad[i]!.actionId);
      const low = (pad[i]!.label ?? '').trim().toLowerCase();
      if (low) have.add('label:' + low);
    }
    const edges = enumerateLegalEdges(state);
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i]!;
      if (e.type !== 'attack' && e.type !== 'flee' && e.type !== 'parley') continue;
      const label = (e.label ?? '').trim();
      if (!label) continue;
      const actionId = 'fight:foe:' + foe + ':' + e.type;
      const low = label.toLowerCase();
      if (have.has(actionId) || have.has('label:' + low)) continue;
      have.add(actionId);
      work = work.concat([{
        label, actionId, kind: 'affordance', slotKind: 'fight', slotCategory: 'scene',
        entityId: 'foe:' + foe, required: true, rank: e.type === 'attack' ? 100 : e.type === 'flee' ? 99 : 98,
      } as T]);
    }
  }
  // T10P / T10PUSH: live fight pad = encounter actions only (≤ choiceCountLimit) + free-input.
  // Generic scene affordances (chest / scout / contact / travel) stay off the fight page.
  // Core fight: chips (attack / flee / parley) outrank thread:foe engagement so a limit of 3
  // still keeps Press / Flee / Parley — Face-the-foe fills only leftover slots.
  if (liveFight) {
    const freeOnly: T[] = [];
    const fightOnly: T[] = [];
    const seenFight = new Set<string>();
    for (let i = 0; i < work.length; i++) {
      const chip = work[i]!;
      if (chip.kind === 'free-input') {
        freeOnly.push({ ...chip, cooldownReturn: undefined });
        continue;
      }
      const id = chip.actionId ?? '';
      const fightish =
        chip.slotKind === 'fight'
        || id.startsWith('fight:')
        || id.startsWith('thread:foe:');
      if (!fightish || !id || seenFight.has(id)) continue;
      seenFight.add(id);
      fightOnly.push({ ...chip, slotCategory: 'scene', slotKind: 'fight', cooldownReturn: undefined });
    }
    const byId = (a: T, b: T) => {
      const rank = (c: T) => {
        const id = c.actionId ?? '';
        if (id.endsWith(':attack')) return 0;
        if (id.endsWith(':flee')) return 1;
        if (id.endsWith(':parley')) return 2;
        if (id.includes(':forward') || id.startsWith('thread:foe:')) return 3;
        return 4;
      };
      return rank(a) - rank(b);
    };
    fightOnly.sort(byId);
    const capped = fightOnly.slice(0, Math.max(0, choiceCountLimitOf(state)));
    return [...capped, ...freeOnly];
  }
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
  const fightKeep: T[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < work.length; i++) {
    const chip = work[i]!;
    if (!chip.actionId) continue;
    if (seen.has(chip.actionId)) continue;
    if (chip.kind === 'free-input') {
      freeIn.push(chip);
      continue;
    }
    if (liveFight && (chip.slotKind === 'fight' || chip.actionId.startsWith('fight:'))) {
      seen.add(chip.actionId);
      fightKeep.push({ ...chip, slotCategory: 'scene', cooldownReturn: undefined });
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
    if (cat === 'move') {
      if (!noTravel) move.push(row);
    } else if (cat === 'talk') talk.push(row);
    else if (cat === 'scene') scene.push(row);
    else act.push(row);
  }
  // q75r: never refill Travel toward … while fight / road / dying blocks travel.
  if (!move.length && !noTravel) {
  // T10AC / q50e — MOVE refill from recordedTravelDestinations (same ids as the MOVE chips).
  const recordExits = recordedTravelDestinations(state);
  const raw: T[] = [];
  if (recordExits.length) {
    for (let i = 0; i < recordExits.length; i++) {
      const row = recordExits[i]!;
      const dest = row.label;
      if (!dest || !isPlaceOpenForExit(state, dest)) continue;
      const entityId = exitEntityId(row);
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
        actionId: `exit:${target}:travel`,
        kind: 'exit',
        slotKind: 'exit',
        slotCategory: 'move',
        entityId: target,
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
        actionId: `exit:${dest}:travel`,
        kind: 'exit',
        slotKind: 'exit',
        slotCategory: 'move',
        entityId: dest,
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
  // T10AR — under stall, untried talk outranks bounce-only MOVE so Waystation↔Camp travel
  // does not lead the pad while Ask/Press chips sit behind it (s9601 T160–T165).
  const recent = state.circling?.recentPlaces ?? [];
  const prev = (state.circling?.prevPlace ?? '').trim().toLowerCase();
  const bounceMoveOnly =
    move.length > 0
    && move.every((chip) => {
      const hub = parseTravelDestination(chip.label, state.campaignBibleId);
      const dest = (hub?.name ?? chip.entityId ?? '').trim().toLowerCase();
      if (!dest) return false;
      if (prev && (dest === prev || dest.includes(prev) || prev.includes(dest))) return true;
      for (let r = 0; r < recent.length; r++) {
        const p = (recent[r] ?? '').trim().toLowerCase();
        if (p && (dest === p || dest.includes(p) || p.includes(dest))) return true;
      }
      return false;
    });
  const talkFirst = stallPressureActive(state) && talk.length > 0 && bounceMoveOnly;
  // Slot order: MOVE · TALK · ACT · SCENE · rest (or TALK first under bounce stall).
  const orderedPools: T[][] = talkFirst
    ? [talk, move, act, scene]
    : [move, talk, act, scene];
  for (let slot = 0; slot < 5; slot++) {
    const pool = slot < 4 ? orderedPools[slot]! : null;
    const cands: T[] = [];
    if (pool) {
      for (let i = 0; i < pool.length; i++) {
        if (!used.has(pool[i]!.actionId)) cands.push(pool[i]!);
      }
    } else {
      for (let g = 0; g < orderedPools.length; g++) {
        const group = orderedPools[g]!;
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
      // T10AG — Walk on must not be rested while a journey is underway (class chips must not
      // crowd the chip that moves the story off the MOVE slot; s9701 T21–T22).
      if (isJourneyUnderway(state) && isJourneyOnwardLine(cands[i]!.label)) situation = true;
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
  for (let i = 0; i < fightKeep.length; i++) {
    const row = fightKeep[i]!;
    if (used.has(row.actionId)) continue;
    used.add(row.actionId);
    picked.push(row);
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
    // T10AN — out of talking range stays on present[] / awayFrom (Step closer targets them).
    const present = state.sceneFacts?.present ?? [];
    for (let p = 0; p < present.length; p++) {
      if (mentionsName(present[p]!, who) || mentionsName(who, present[p]!)) return true;
    }
    const away = activeHereSpot(state)?.awayFrom ?? [];
    for (let a = 0; a < away.length; a++) {
      if (mentionsName(away[a]!, who) || mentionsName(who, away[a]!)) return true;
    }
    return false;
  }
  if (entityId.startsWith('place:') || entityId.startsWith('object:')) {
    const name = entityId.slice(entityId.indexOf(':') + 1).trim();
    // HERE search chip — current place is always in the scene record.
    if (
      entityId.startsWith('place:') &&
      name &&
      name.toLowerCase() === (state.currentLocation ?? '').trim().toLowerCase()
    ) {
      return true;
    }
    // T10AC — travel destinations: same recordedTravelDestinations list the MOVE chips use.
    if (entityId.startsWith('place:') && name) {
      const dests = recordedTravelDestinations(state);
      const want = name.toLowerCase();
      for (let i = 0; i < dests.length; i++) {
        const row = dests[i]!;
        if (row.label.toLowerCase() === want) return true;
        if (exitEntityId(row).toLowerCase() === want) return true;
      }
    }
    const open = openRouteView(state);
    if (!open) return false;
    const rows = open.rows;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i]!.entityId === entityId) return true;
    }
    return false;
  }
  // Exit entityIds on Travel chips (hub id or place label): recorded reachable from HERE.
  {
    const dests = recordedTravelDestinations(state);
    const want = entityId.toLowerCase();
    for (let i = 0; i < dests.length; i++) {
      const row = dests[i]!;
      if (exitEntityId(row).toLowerCase() === want) return true;
      if (row.label.toLowerCase() === want) return true;
    }
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

/**
 * Prep08 / M7 check-name: fight pads stay ≤4 (M3 capFightChips); otherwise scene affordance labels.
 * Does not change the fight option cap (M6 owns steal/parley; cap stays where M3 put it).
 */
export function sceneAffordances(state: GameState): string[] {
  const round = roundCombatChips(state);
  if (round) return round;
  if (state.activeEncounter && state.activeEncounter.hp > 0 && state.activeEncounter.phase !== 'pending') {
    return capFightChips(legalFightActionsThisRound(state));
  }
  return collectSceneAffordances(state).map((a) => a.label).filter(Boolean);
}
