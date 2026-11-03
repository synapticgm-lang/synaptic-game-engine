/**
 * FOURSLOT — every non-origin scene shows exactly four engine-built chips.
 * Slot meaning is fixed; wording is scene-specific. Free text is never a slot
 * and is never rejected. Origin / dying / first-fight exclusive pads stay exclusive.
 *
 * Slots:
 *   1. push   — push the story on (quest step / lead / exploring step; fight: strongest attack)
 *   2. engage — main thing with who/what is present (talk / attack / study; fight: defend/help)
 *   3. own    — character's class / skills / kit / trade (fight: class trick; town: shop/train)
 *   4. back   — step back (flee / rest / leave / travel elsewhere)
 */
import type { GameState } from './types';
import {
  FREE_INPUT_DO,
  FREE_INPUT_SAY,
  isFreeInputChip,
  recordedTravelDestinations,
  wayOutMovesPlayer,
} from './sceneAffordances';
import {
  storyChip,
  actionFamily,
  isHuntChip,
  isGatherChip,
  isSeekFightChip,
  isFillerNoProgressChip,
  fillerOfferExhausted,
} from './choiceRanking';
import { barePlaceKey, isTravelDestHere } from './placeRegistry';
import { travelChipTarget } from './questPlay';
import { canOutdoorShortRest, isSafeHubRest, TABLETOP_SHORT_REST_CHIP } from './recoveryRules';
import { OUTDOOR_CAMP_CHIP, OUTDOOR_REST_CHIP, isHurtHp, isOutdoorRestPad } from './rules/wildlifeConfig';
import { canAddMaterials } from './inventory';
import { hasNodeStock } from './wilds';
import { gatherModeOk, huntModeOk } from './wildlifeActions';
import { isCrowdOnlyTalkPad, speakablePresentPeople } from './chromeAuthority';
import { peopleHere } from './scenePresence';
import { hubsForBibleId, outdoorHubTravelChoices } from './outdoorHubs';
import { originPad } from './rules/rpgOrigin';
import { isDying } from './tabletop/roundFight';
import { firstFightChoiceSet } from './rules/firstFightChoice';
import { isJourneyOnwardLine, isJourneyPad, isJourneyUnderway, journeyPads } from './travelJourney';
import { parkedThreatHere } from './placeThreats';
import { travelPadBlocked } from './padUniverse';

/** Turns after a HERE change where Travel back to the place just left is dead (FOURSLOT3). */
const ARRIVAL_BOUNCE_TURNS = 2;

export type FourSlotId = 'push' | 'engage' | 'own' | 'back';

export const FOUR_SLOT_ORDER: FourSlotId[] = ['push', 'engage', 'own', 'back'];

export type FourSlotPick = { slot: FourSlotId; label: string };

function tidy(s: string): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

function low(s: string): string {
  return tidy(s).toLowerCase();
}

/** Exclusive pads that must not be reshaped into four slots. */
export function shouldSkipFourSlot(state: GameState): boolean {
  if (state.playPhase === 'ended') return true;
  if (originPad(state)?.length) return true;
  if (isDying(state)) return true;
  const ff = firstFightChoiceSet(state);
  if (ff.active && ff.options.length) return true;
  // Road journey owns Walk on / Face / Turn back. Reshape only when hurt so Rest can land
  // (FOURSLOT2); otherwise keep the exclusive road list (gateFix9 / s85 / transitStuck).
  if (isJourneyUnderway(state) && !liveFight(state) && journeyPads(state).length > 0) {
    const hp = state.character?.hp ?? 0;
    const max = state.character?.maxHp ?? 0;
    if (!isHurtHp(hp, max)) return true;
  }
  return false;
}

function liveFight(state: GameState): boolean {
  const enc = state.activeEncounter;
  return !!(enc && (enc.hp ?? 0) > 0 && enc.phase !== 'pending' && enc.phase !== 'terminal');
}

function inSettlement(state: GameState): boolean {
  const here = low(state.currentLocation ?? '');
  if (!here) return false;
  const hubs = hubsForBibleId(state.campaignBibleId);
  return hubs.some((h) => {
    const n = low(h.name);
    return n && (here === n || here.includes(n) || n.includes(here));
  });
}

function talkTargetPresent(state: GameState, label: string): boolean {
  const t = low(label);
  const seated = peopleHere(state);
  const speakable = speakablePresentPeople(state.sceneFacts?.present);
  // Crowd / pulled-you aggregates need a real seated listener — never the aggregate token itself.
  if (isCrowdOnlyTalkPad(label)) {
    return seated.length > 0 || speakable.length > 0;
  }
  const people = speakable.length ? speakable : seated;
  if (!people.length) return false;
  for (const p of people) {
    const name = low(p);
    if (name && t.includes(name)) return true;
  }
  // Role talk when that role string is seated.
  for (const row of seated) {
    if (row && t.includes(low(row))) return true;
  }
  // Bare "Talk" / "Ask around" with no named target while someone is here.
  if (/^(?:talk|ask|press|follow up)\s*$/.test(t)) return people.length > 0;
  // Specific Answer/Talk-to-Name for someone not seated is dead (leaving courier while Mara is here).
  return false;
}

function creaturePresent(state: GameState): boolean {
  if (liveFight(state)) return true;
  if (state.sceneFacts?.pendingEncounter) return true;
  if (parkedThreatHere(state)) return true;
  // Journey meeting still standing on the road (Face the thugs) — not yet activeEncounter.
  const enc = state.journey?.encounter;
  if (enc && !liveFight(state)) return true;
  const last = state.sceneFacts?.lastKill;
  if (last && typeof last.turn === 'number' && (state.turn ?? 0) - last.turn <= 0) return false;
  return false;
}

function travelDestOf(label: string): string | null {
  // Journey onward ("Walk on" / "Press on") is not Travel-to-dest "on".
  if (isJourneyOnwardLine(label)) return null;
  return travelChipTarget(label) ?? (
    tidy(label).match(/^(?:travel|head|go|walk|return|make for|set out)\s+(?:to|toward|towards|for|into)\s+(.+)$/i)?.[1]
      ?.replace(/^(?:the|a|an)\s+/i, '')
      .trim() ?? null
  );
}

function samePlaceLabel(a: string, b: string): boolean {
  const x = barePlaceKey(a);
  const y = barePlaceKey(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

/** Just arrived (or mid-arrival window): Travel back to the place we left is a bounce loop. */
export function isImmediateBounceTravel(state: GameState, label: string): boolean {
  const dest = travelDestOf(label);
  if (!dest) return false;
  if (liveFight(state)) return false; // flee stays valid while the fight blocks ordinary Travel elsewhere
  const movedTurn = state.circling?.movedTurn;
  if (movedTurn == null) return false;
  if ((state.turn ?? 0) - movedTurn > ARRIVAL_BOUNCE_TURNS) return false;
  const prev = (state.circling?.prevPlace ?? state.previousLocationSheet?.name ?? '').trim();
  if (!prev) return false;
  return samePlaceLabel(dest, prev);
}

/** True when this chip would be a dead / illegal action right now. */
export function isFourSlotLegal(state: GameState, label: string): boolean {
  const raw = tidy(label);
  if (!raw || isFreeInputChip(raw)) return false;
  const t = low(raw);

  // Travel to HERE is always dead (OPEN9 / FOURSLOT2 canonicalPlaceKey).
  const dest = travelDestOf(raw);
  if (dest && isTravelDestHere(state, dest)) return false;
  if (/^travel\b/.test(t) && !dest) return false;
  // FOURSLOT3 — never offer Travel while fight / dying blocks travel (T37 travel-blocked).
  if (dest && travelPadBlocked(state)) return false;
  // FOURSLOT3 — Travel back to the place just left is not the immediate default.
  if (dest && isImmediateBounceTravel(state, raw)) return false;
  // Dead Travel: label names a place but does not move the player (storyChip opener / zero-gap).
  if (dest && /^travel\b/.test(t) && !wayOutMovesPlayer(state, raw)) return false;
  // Mid-journey: Travel toward the trip destination is a duplicate of Walk on.
  if (
    dest
    && isJourneyUnderway(state)
    && !liveFight(state)
    && state.journey?.to
    && (barePlaceKey(dest) === barePlaceKey(state.journey.to)
      || isTravelDestHere({ ...state, currentLocation: state.journey.to }, dest))
  ) {
    return false;
  }

  // Attack with no creature.
  if (
    /^(?:attack|press the attack|strike|fight the|engage the|face the)\b/.test(t)
    && !creaturePresent(state)
    && !liveFight(state)
  ) {
    return false;
  }

  // Talk / Answer for an absent NPC (specific name/role must be seated — not "any talk while Mara is here").
  if (/^(?:talk|ask|answer|press|follow up with|follow up:)\b/.test(t)) {
    if (!talkTargetPresent(state, raw)) return false;
  }

  // Gather: need stock + pouch space; mode must allow.
  if (isGatherChip(raw)) {
    if (!gatherModeOk(state)) return false;
    if (!hasNodeStock(state)) return false;
    if (!canAddMaterials(state, 1).ok) return false;
  }

  // Hunt: mode + outdoor wilds rules already gate emission; still refuse after death cooldown via seek rules.
  if (isHuntChip(raw) && !huntModeOk(state)) return false;

  // Rest: need a legal rest path when this is a rest chip.
  if (isOutdoorRestPad(raw) || /^rest\b/.test(t) || /^make camp\b/.test(t) || /^take a short rest\b/.test(t)) {
    if (liveFight(state)) return false;
    if (state.engineMode === 'litrpg' || state.engineMode === 'rpg') {
      if (!canOutdoorShortRest(state, raw) && !isSafeHubRest(state, raw)) return false;
    } else if (state.engineMode === 'dnd') {
      // Tabletop: short rest at a safe hub only (SRD); never invent outdoor bind-wounds.
      if (!isSafeHubRest(state, raw)) return false;
    }
  }

  // Eat with no food.
  if (/^(?:eat|consume|have a meal)\b/.test(t)) {
    const hasFood = (state.inventory ?? []).some((it) =>
      /\b(?:meal|ration|rations|bread|food|stew|meat|cake|hardtack)\b/i.test(it.name ?? '')
      && (it.quantity ?? 1) > 0
    );
    if (!hasFood) return false;
  }

  // OPEN6–9 filler family cap — LitRPG / Story RPG only.
  // Tabletop keeps REPEAT_COOLDOWN_TURNS.dnd === 0 (q44-OCD2 08:41); do not starve inspect/search there.
  if (
    (state.engineMode === 'litrpg' || state.engineMode === 'rpg')
    && isFillerNoProgressChip(raw)
    && fillerOfferExhausted(state, raw)
  ) {
    return false;
  }

  return true;
}

/**
 * Same family + same target + same state as the previous player line → repeat (dead for FOURSLOT).
 * Target = travel dest, talk name, or filler object noun; state = HERE + fight flag + HP band.
 */
export function isFourSlotRepeat(
  state: GameState,
  label: string,
  previousPlayerAction = ''
): boolean {
  const prev = tidy(previousPlayerAction);
  if (!prev) return false;
  const a = tidy(label);
  if (low(a) === low(prev)) {
    // Live fight: Attack / Defend / Use / Disengage may repeat every round (FOURSLOT3 T37).
    if (liveFight(state) && /^(?:attack|press the attack|strike|defend|use|disengage|flee|try to flee)\b/i.test(a)) {
      return false;
    }
    return true;
  }
  if (actionFamily(a) !== actionFamily(prev)) return false;
  // Live fight combat family is not a "repeat" that starves Attack out of push.
  if (liveFight(state) && /^(?:attack|press the attack|strike|defend|use|disengage|flee|try to flee)\b/i.test(a)) {
    return false;
  }
  const destA = travelDestOf(a);
  const destB = travelDestOf(prev);
  if (destA || destB) return low(destA ?? '') === low(destB ?? '');
  // Talk target token after verb.
  const talkA = a.match(/^(?:talk to|ask|answer|follow up with)\s+(.+)$/i)?.[1];
  const talkB = prev.match(/^(?:talk to|ask|answer|follow up with)\s+(.+)$/i)?.[1];
  if (talkA || talkB) return low(talkA ?? '') === low(talkB ?? '');
  // Filler Search/Open/Read on same HERE counts as repeat.
  const fam = actionFamily(a);
  if (fam === 'search' || fam === 'look' || fam === 'inspect' || fam === 'use') {
    return true;
  }
  return false;
}

function isFillerPad(label: string): boolean {
  const fam = actionFamily(label);
  return fam === 'search' || fam === 'look' || fam === 'inspect' || fam === 'wait' || fam === 'use';
}

/**
 * Classify a legal chip into one of the four slots for the current situation.
 * Returns null when the chip should not fill a slot (free-input / unknown filler).
 */
export function classifyFourSlot(state: GameState, label: string): FourSlotId | null {
  const raw = tidy(label);
  if (!raw || isFreeInputChip(raw)) return null;
  const t = low(raw);
  const fight = liveFight(state);
  const town = !fight && inSettlement(state);

  if (fight) {
    // Travel toward a place is illegal while travelPadBlocked; never classify as fight push.
    if (/^(?:travel|head toward|go to|return to)\b/.test(t)) return 'back';
    if (/\b(?:flee|disengage|withdraw|run away|retreat|back off|leave the fight)\b/.test(t)) return 'back';
    if (/\b(?:defend|help|protect|aid|cover|stabilis|guard)\b/.test(t)) return 'engage';
    if (
      /\b(?:cast|sneak|trick|channel|mark|skill|special|maneuver|smite|rage|spell)\b/.test(t)
      || /^use\b/.test(t)
    ) {
      return 'own';
    }
    if (/\b(?:attack|press|strike|fight|face|engage|hit)\b/.test(t)) return 'push';
    return 'push';
  }

  // Journey onward is push-the-story, not step-back.
  if (isJourneyOnwardLine(raw)) return 'push';

  // FOURSLOT3 — right after arrival, Travel is never the push lead (development/engage owns slot 1),
  // even when storyChip is Travel-toward-quest-site (7803 bounce / cursed-keep arrival).
  const justArrived =
    !fight
    && state.circling?.movedTurn != null
    && (state.turn ?? 0) - state.circling.movedTurn <= ARRIVAL_BOUNCE_TURNS;
  if (justArrived && /^(?:travel|head toward|go to|return to)\b/.test(t) && wayOutMovesPlayer(state, raw)) {
    return 'back';
  }

  const story = storyChip(state);
  if (story && low(story) === t) return 'push';

  // Moving Travel is push when hurt (Rest owns back) or when it is the story/quest lead.
  // Otherwise Travel / Leave / Rest stay step-back.
  const hurtNow = isHurtHp(state.character?.hp ?? 0, state.character?.maxHp ?? 0) && !fight;
  if (/^(?:travel|head toward|go to|return to)\b/.test(t) && wayOutMovesPlayer(state, raw)) {
    if (hurtNow) return 'push';
    if (story && /^travel\b/i.test(story) && !isFourSlotLegal(state, story)) return 'push';
  }

  if (
    isOutdoorRestPad(raw)
    || /^(?:rest|make camp|leave|flee|withdraw|walk away|turn back|camp)\b/.test(t)
    || /^(?:travel|go back|head toward|return to)\b/.test(t)
  ) {
    return 'back';
  }
  if (
    /^(?:honour|honor|follow up:|hear their reason|scout|continue the|resume|accept the|deliver|report)\b/.test(t)
    || /^follow the\b/.test(t)
    || /^go to the meeting\b/.test(t)
    || /^open the sealed\b/.test(t)
    || /^choose (?:warrior|berserker|sorcerer|fighter|barbarian|wizard|rogue|cleric|ranger)\b/.test(t)
  ) {
    // Class pick is progress but not the road onward — file as own when journey skipped;
    // off-road it is a push lead only when no story chip owns the slot.
    if (/^choose\b/.test(t)) return 'own';
    return 'push';
  }

  // Your own way — kit / class / trade / skill reads (before engage so Hunt/Read aren't "engage").
  // OCD: Read/Analyze person skill chips must keep a slot beside Talk (person:…:skill actionIds).
  if (
    isHuntChip(raw)
    || isGatherChip(raw)
    || isSeekFightChip(raw)
    || /^check system\b/.test(t)
    || /^(?:sneak|pick the lock|pick lock|cast|craft|train|buy|sell|browse|shop|barter|enroll|study the art)\b/.test(t)
    || /^use\b/.test(t)
    || /^(?:read|analyze)\s+\S/i.test(raw)
  ) {
    return 'own';
  }
  if (town && /^(?:buy|sell|browse|shop|train|enroll)\b/.test(t)) return 'own';

  // Engage — present person / creature / object.
  if (
    /^(?:talk|ask|answer|press|follow up with|persuade|threaten|attack|strike|fight|face|inspect|examine|study|read|open)\b/.test(t)
  ) {
    // Named-object inspect/open (affordance) stays engage — only generic surroundings filler drops.
    if (
      isFillerPad(raw)
      && /^(?:inspect|examine|study|look around|search|wait)\b/.test(t)
      && !/\b(?:panel|sign|book|door|seal|lock|crate|chest|puzzle|brush|stall|cart|altar|device)\b/.test(t)
      && !/^(?:inspect|examine|study|read|open)\s+(?:the|a|an)\s+\w+/i.test(raw)
    ) {
      return null;
    }
    return 'engage';
  }

  // Exploring step fallback → push.
  if (/^(?:look around|search|wait|listen)\b/.test(t)) return 'push';

  return null;
}

function lastPlayerAction(state: GameState): string {
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]?.role === 'player') return String(log[i]!.content ?? '');
  }
  return '';
}

/** Families of the last N player lines — used to keep same-family streak ≤2. */
function recentPlayerFamilies(state: GameState, n: number): Set<string> {
  const out: string[] = [];
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0 && out.length < n; i--) {
    if (log[i]?.role !== 'player') continue;
    const fam = actionFamily(String(log[i]!.content ?? ''));
    if (fam) out.push(fam);
  }
  // Only starve a family when the last N picks were ALL that family (streak ≥ n).
  if (out.length < n) return new Set();
  const first = out[0]!;
  if (out.every((f) => f === first)) return new Set([first]);
  return new Set();
}

function uniquePush(out: string[], seen: Set<string>, label: string): void {
  const k = low(label);
  if (!k || seen.has(k)) return;
  seen.add(k);
  out.push(tidy(label));
}

/**
 * Built-in fallbacks per slot when the candidate pool has nothing legal.
 * Only emit engine-backed labels (story / hub travel / rest / fight verbs already in candidates
 * preferred). Never invent Browse/Talk-steward/Inspect — those are dead chips with no resolver.
 */
export function fourSlotFallback(
  state: GameState,
  slot: FourSlotId,
  forbidden: Set<string>,
  candidates: string[] = []
): string | null {
  const fight = liveFight(state);
  const candSet = new Set(candidates.map((c) => low(c)));
  const tryLabel = (label: string, opts?: { requireCandidate?: boolean }): string | null => {
    const t = tidy(label);
    if (!t || forbidden.has(low(t))) return null;
    if (opts?.requireCandidate && !candSet.has(low(t))) return null;
    if (!isFourSlotLegal(state, t)) return null;
    if (isFourSlotRepeat(state, t, lastPlayerAction(state))) return null;
    return t;
  };
  // Prefer an unused legal candidate already classified for this slot.
  for (const c of candidates) {
    if (forbidden.has(low(c))) continue;
    if (classifyFourSlot(state, c) !== slot) continue;
    const hit = tryLabel(c);
    if (hit) return hit;
  }

  if (fight) {
    // Live fight verbs bind through roundCombatChips / intent — allow without candidate.
    if (slot === 'push') return tryLabel('Press the attack') ?? tryLabel('Attack');
    if (slot === 'engage') {
      return tryLabel('Defend') ?? tryLabel('Help an ally') ?? tryLabel('Use something');
    }
    if (slot === 'own') return tryLabel('Use something') ?? tryLabel('Try a skill');
    if (slot === 'back') {
      return tryLabel('Disengage') ?? tryLabel('Try to flee') ?? tryLabel('Flee');
    }
  }

  if (slot === 'push') {
    const story = storyChip(state);
    if (story) {
      const hit = tryLabel(story);
      if (hit) return hit;
    }
    for (const hub of outdoorHubTravelChoices(state, 4)) {
      const hit = tryLabel(hub);
      if (hit) return hit;
    }
    // Look/Wait are safe engine fallbacks (not dead Browse/Inspect invent).
    return tryLabel('Look around') ?? tryLabel('Wait and listen') ?? tryLabel('Wait');
  }

  if (slot === 'engage') {
    const people = speakablePresentPeople(state.sceneFacts?.present);
    for (const p of people) {
      const hit = tryLabel(`Talk to ${p}`, { requireCandidate: true });
      if (hit) return hit;
    }
    for (const p of peopleHere(state)) {
      const hit = tryLabel(`Talk to ${p}`, { requireCandidate: true });
      if (hit) return hit;
    }
    if (peopleHere(state).length) {
      const hit = tryLabel('Talk to the people here', { requireCandidate: true });
      if (hit) return hit;
    }
    if (creaturePresent(state)) {
      const hit = tryLabel('Press the attack', { requireCandidate: true })
        ?? tryLabel('Attack', { requireCandidate: true })
        ?? tryLabel('Face the thugs', { requireCandidate: true });
      if (hit) return hit;
    }
    // Never invent Inspect — Wait is the safe engage hole-fill.
    return tryLabel('Wait and listen') ?? tryLabel('Wait') ?? null;
  }

  if (slot === 'own') {
    // Prefer Hunt over Gather when both were candidates (OPEN6 crowded-alley survival).
    if (huntModeOk(state)) {
      const hit = tryLabel('Hunt the wildlife nearby', { requireCandidate: true });
      if (hit) return hit;
    }
    if (gatherModeOk(state) && hasNodeStock(state)) {
      const hit = tryLabel('Gather herbs and resources nearby', { requireCandidate: true });
      if (hit) return hit;
    }
    // Town shop/train only when already engine-backed in candidates (no Browse invent).
    if (inSettlement(state)) {
      const hit = tryLabel('Browse the nearest stall', { requireCandidate: true })
        ?? tryLabel('Ask about training', { requireCandidate: true });
      if (hit) return hit;
    }
    if (state.engineMode === 'litrpg') {
      const sys = tryLabel('Check System');
      if (sys) return sys;
    }
    return tryLabel('Look around') ?? null;
  }

  // back
  {
    const hp = state.character?.hp ?? 0;
    const max = state.character?.maxHp ?? 0;
    if (isHurtHp(hp, max) && !fight) {
      const rest =
        tryLabel(OUTDOOR_REST_CHIP)
        ?? tryLabel(OUTDOOR_CAMP_CHIP)
        ?? tryLabel(TABLETOP_SHORT_REST_CHIP)
        ?? tryLabel('Rest', { requireCandidate: true });
      if (rest) return rest;
      // No legal Rest here — step-back is the valid route to a safe spot (never Travel-HERE).
      for (const hub of outdoorHubTravelChoices(state, 6)) {
        const hit = tryLabel(hub);
        if (hit) return hit;
      }
    }
    for (const hub of outdoorHubTravelChoices(state, 6)) {
      const hit = tryLabel(hub);
      if (hit) return hit;
    }
    // Prefer a real exit Travel; Leave only when hurt + unsealed (route to a safe spot).
    for (const row of recordedTravelDestinations(state)) {
      const hit = tryLabel(`Travel toward ${row.label}`);
      if (hit) return hit;
    }
    for (const hub of outdoorHubTravelChoices(state, 4)) {
      const hit = tryLabel(hub);
      if (hit) return hit;
    }
    // Hurt + no Rest here (tabletop outdoor / closed camp): Leave is the route to a safe spot.
    // Full-HP sealed openings do not hit this branch (transitStuck Leave-unbound).
    if (isHurtHp(state.character?.hp ?? 0, state.character?.maxHp ?? 0)) {
      const leave = tryLabel('Leave the scene');
      if (leave) return leave;
    }
    return tryLabel('Wait') ?? null;
  }
}

/**
 * Assemble exactly four distinct legal slots (+ free-input chips).
 * `candidates` are preferred wording from the existing pipeline; fallbacks fill holes.
 */
export function assembleFourSlotPads(
  state: GameState,
  candidates: string[],
  opts?: { previousPlayerAction?: string }
): string[] {
  if (shouldSkipFourSlot(state)) {
    // Keep exclusive pad as-is; still ensure free-input is present off exclusive origin? Origin has none.
    return candidates.map(tidy).filter(Boolean);
  }

  const prev = opts?.previousPlayerAction ?? lastPlayerAction(state);
  const pools: Record<FourSlotId, string[]> = {
    push: [],
    engage: [],
    own: [],
    back: [],
  };

  const consider = (raw: string) => {
    const label = tidy(raw);
    if (!label || isFreeInputChip(label)) return;
    if (!isFourSlotLegal(state, label)) return;
    if (isFourSlotRepeat(state, label, prev)) return;
    const slot = classifyFourSlot(state, label);
    if (!slot) return;
    pools[slot].push(label);
  };

  const candList = candidates.map(tidy).filter(Boolean);
  for (const c of candidates) consider(c);
  // Hurt journey: seed the exclusive road list so Walk on / Turn back survive Rest reshape.
  const roadUnderway = isJourneyUnderway(state) && !liveFight(state);
  if (roadUnderway) {
    for (const p of journeyPads(state)) consider(p);
  }
  // Prefer story chip / rest when hurt even if not in candidates.
  const story = storyChip(state);
  if (story) consider(story);
  const hurt = isHurtHp(state.character?.hp ?? 0, state.character?.maxHp ?? 0) && !liveFight(state);
  if (hurt) {
    consider(OUTDOOR_REST_CHIP);
    consider(OUTDOOR_CAMP_CHIP);
    if (state.engineMode === 'dnd') consider(TABLETOP_SHORT_REST_CHIP);
    // Eat when a food item is held (inventory consistency — Eat consumes one).
    const food = (state.inventory ?? []).find((it) =>
      /\b(?:meal|ration|rations|bread|food|stew|meat|cake|hardtack)\b/i.test(it.name ?? '')
      && (it.quantity ?? 1) > 0
    );
    if (food?.name) consider(`Eat ${food.name}`);
  }
  for (const hub of outdoorHubTravelChoices(state, 4)) consider(hub);
  // Real exits (Contract Hall → Cathedral Undercroft) — never let a dead story Travel starve MOVE.
  for (const row of recordedTravelDestinations(state)) {
    const label = tidy(row.label);
    if (!label) continue;
    consider(`Travel toward ${label}`);
  }
  // Live fight: ensure all four combat meanings are candidates.
  if (liveFight(state)) {
    consider('Press the attack');
    consider('Defend');
    consider('Use something');
    consider('Disengage');
    consider('Try to flee');
  }

  // Own slot: person skill Read/Analyze before Hunt (OCD stamps person:…:skill); Hunt before Gather.
  pools.own.sort((a, b) => {
    const score = (x: string) =>
      (/^(?:read|analyze)\s+\S/i.test(x)
        ? 0
        : isHuntChip(x) || isSeekFightChip(x)
          ? 1
          : isGatherChip(x)
            ? 2
            : 3);
    return score(a) - score(b);
  });
  // Engage: keep candidate order (affordance actionIds / OCD stamp) but sink generic surroundings filler.
  pools.engage.sort((a, b) => {
    const score = (x: string) =>
      (isFillerPad(x) && !/^(?:inspect|examine|study|read|open)\s+(?:the|a|an)\s+\S/i.test(x) ? 1 : 0);
    const d = score(a) - score(b);
    if (d !== 0) return d;
    const ia = candList.findIndex((c) => low(c) === low(a));
    const ib = candList.findIndex((c) => low(c) === low(b));
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
  // Push: story / journey onward before Look filler.
  pools.push.sort((a, b) => {
    const score = (x: string) =>
      (story && low(story) === low(x) ? 0 : isJourneyOnwardLine(x) ? 0 : isFillerPad(x) ? 2 : 1);
    return score(a) - score(b);
  });
  // Back: when hurt, Rest/camp/eat before Travel; else Travel / Leave before Wait.
  // FOURSLOT2 — also sink a family that already streaked ≥2 in the last player lines.
  const recentFamilies = recentPlayerFamilies(state, 2);
  pools.back.sort((a, b) => {
    const score = (x: string) => {
      if (hurt && (isOutdoorRestPad(x) || /^rest\b/i.test(x) || /^make camp\b/i.test(x) || /^eat\b/i.test(x) || /^take a short rest\b/i.test(x))) {
        return -1;
      }
      if (/^travel\b/i.test(x) || /^leave\b/i.test(x) || isOutdoorRestPad(x)) return 0;
      if (isFillerPad(x)) return 2;
      return 1;
    };
    const famPenalty = (x: string) => (recentFamilies.has(actionFamily(x)) ? 3 : 0);
    return score(a) + famPenalty(a) - (score(b) + famPenalty(b));
  });
  // Push / engage / own: sink families already used twice in a row (max streak target ≤2).
  for (const slot of ['push', 'engage', 'own'] as FourSlotId[]) {
    pools[slot].sort((a, b) => {
      const pa = recentFamilies.has(actionFamily(a)) ? 1 : 0;
      const pb = recentFamilies.has(actionFamily(b)) ? 1 : 0;
      return pa - pb;
    });
  }

  const seen = new Set<string>();
  const picked: string[] = [];
  const picks: FourSlotPick[] = [];

  for (const slot of FOUR_SLOT_ORDER) {
    let chosen: string | null = null;
    for (const cand of pools[slot]) {
      if (seen.has(low(cand))) continue;
      chosen = cand;
      break;
    }
    if (!chosen) {
      chosen = fourSlotFallback(state, slot, seen, candList);
    }
    // Last resort: any legal unused candidate (never invent a novel label).
    if (!chosen) {
      for (const c of candList) {
        const label = tidy(c);
        if (!label || isFreeInputChip(label) || seen.has(low(label))) continue;
        if (!isFourSlotLegal(state, label)) continue;
        chosen = label;
        break;
      }
    }
    if (chosen) {
      uniquePush(picked, seen, chosen);
      picks.push({ slot, label: chosen });
    }
  }

  // Exactly four when possible — pad only with unused legal non-repeat candidates / hub travel.
  const canPad = (label: string) =>
    !!label
    && !isFreeInputChip(label)
    && isFourSlotLegal(state, label)
    && !isFourSlotRepeat(state, label, prev);

  for (const hub of outdoorHubTravelChoices(state, 6)) {
    if (picked.length >= 4) break;
    if (!canPad(hub)) continue;
    uniquePush(picked, seen, hub);
  }
  for (const c of candList) {
    if (picked.length >= 4) break;
    if (!canPad(c)) continue;
    uniquePush(picked, seen, c);
  }
  // Final gate: always attempt all 4 slots (do not stop at picked.length < 4).
  const four: string[] = [];
  const fourSeen = new Set<string>();
  for (let i = 0; i < 4; i++) {
    const slot = FOUR_SLOT_ORDER[i]!;
    const label = picked[i];
    if (label && canPad(label) && !fourSeen.has(low(label))) {
      uniquePush(four, fourSeen, label);
      continue;
    }
    const fb = fourSlotFallback(state, slot, fourSeen, candList);
    if (fb) {
      uniquePush(four, fourSeen, fb);
      continue;
    }
    for (const c of candList) {
      if (fourSeen.has(low(c)) || !canPad(c)) continue;
      uniquePush(four, fourSeen, c);
      break;
    }
  }
  for (const c of candList) {
    if (four.length >= 4) break;
    if (fourSeen.has(low(c)) || !canPad(c)) continue;
    uniquePush(four, fourSeen, c);
  }
  for (const hub of outdoorHubTravelChoices(state, 6)) {
    if (four.length >= 4) break;
    if (fourSeen.has(low(hub)) || !canPad(hub)) continue;
    uniquePush(four, fourSeen, hub);
  }
  // Safe engine fallbacks to reach 4 (Look/Wait/Check System / exit Travel).
  // Leave when hurt needs a route to a safe spot (closed camp / tabletop outdoor Rest illegal).
  // Full-HP sealed openings never take this branch — transitStuck Leave-unbound stays fixed.
  const exitTravels = recordedTravelDestinations(state).map((r) => `Travel toward ${r.label}`);
  const leaveWhenHurtRoute = hurt ? ['Leave the scene'] : [];
  const safeFill = roadUnderway
    ? [
        ...(huntModeOk(state) ? ['Hunt the wildlife nearby'] : []),
        ...(gatherModeOk(state) ? ['Gather herbs and resources nearby'] : []),
        ...(hurt ? [OUTDOOR_REST_CHIP, OUTDOOR_CAMP_CHIP] : []),
        ...(state.engineMode === 'litrpg' ? ['Check System'] : []),
      ]
    : [
        'Look around',
        'Wait and listen',
        'Wait',
        ...exitTravels,
        ...outdoorHubTravelChoices(state, 4),
        ...leaveWhenHurtRoute,
        ...(state.engineMode === 'litrpg' ? ['Check System'] : []),
        OUTDOOR_REST_CHIP,
        OUTDOOR_CAMP_CHIP,
        ...(state.engineMode === 'dnd' ? [TABLETOP_SHORT_REST_CHIP] : []),
        // Stall after Search: look/search repeats are starved — Keep watch is wait-family distinct wording.
        'Keep watch',
      ];
  for (const g of safeFill) {
    if (four.length >= 4) break;
    if (fourSeen.has(low(g)) || !canPad(g)) continue;
    // Hurt road: only keep chips the journey owner recognizes (or Rest/camp).
    if (
      roadUnderway
      && !isJourneyPad(state, g)
      && !isOutdoorRestPad(g)
      && !/^rest\b/i.test(g)
      && !/^make camp\b/i.test(g)
      && !/^take a short rest\b/i.test(g)
      && !/^check system\b/i.test(g)
    ) {
      continue;
    }
    uniquePush(four, fourSeen, g);
  }

  // Free-input always offered off exclusive pads (never counts as a slot).
  // Hurt road still offers free text (FOURSLOT2 sweep); non-hurt road skips assemble entirely.
  const out = [...four.slice(0, 4)];
  if (!out.some((c) => isFreeInputChip(c))) {
    out.push(FREE_INPUT_SAY, FREE_INPUT_DO);
  } else {
    for (const free of [FREE_INPUT_SAY, FREE_INPUT_DO]) {
      if (!out.some((c) => low(c) === low(free))) out.push(free);
    }
  }
  return out;
}

/** The four engine slots only (no free-input). */
export function fourSlotEngineLabels(pads: string[]): string[] {
  return pads.filter((c) => !isFreeInputChip(c)).slice(0, 4);
}

export function fourSlotAssignments(
  state: GameState,
  pads: string[]
): FourSlotPick[] {
  const out: FourSlotPick[] = [];
  const engine = fourSlotEngineLabels(pads);
  for (let i = 0; i < engine.length && i < 4; i++) {
    const label = engine[i]!;
    const slot = classifyFourSlot(state, label) ?? FOUR_SLOT_ORDER[i]!;
    out.push({ slot, label });
  }
  return out;
}

/**
 * Autoplay: pick only from the four slots. When HP ≤ 50% and no fight (or retreat allowed),
 * prefer the Step-back rest chip. Otherwise weighted across the four.
 */
export function pickFromFourSlots(
  state: GameState,
  offered: string[],
  rng: () => number
): string {
  const slots = fourSlotEngineLabels(offered);
  if (!slots.length) return offered[0] ?? 'Wait';
  const fight = liveFight(state);
  const hurt = isHurtHp(state.character?.hp ?? 0, state.character?.maxHp ?? 0);
  if (hurt && (!fight || slots.some((c) => /\bflee|disengage|withdraw\b/i.test(c)))) {
    const rest = slots.find((c) => isOutdoorRestPad(c) || /^rest\b/i.test(c) || /^make camp\b/i.test(c));
    if (rest) return rest;
    const flee = slots.find((c) => /\bflee|disengage|withdraw|leave\b/i.test(c));
    if (flee) return flee;
    // Prefer the back slot (index 3) when present.
    if (slots[3]) return slots[3]!;
  }
  // Weighted: push slightly preferred, then engage, own, back.
  const weights = [4, 3, 2, 2];
  let total = 0;
  for (let i = 0; i < slots.length; i++) total += weights[i] ?? 1;
  let roll = rng() * total;
  for (let i = 0; i < slots.length; i++) {
    roll -= weights[i] ?? 1;
    if (roll <= 0) return slots[i]!;
  }
  return slots[0]!;
}
