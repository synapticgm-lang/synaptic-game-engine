/**
 * Pad legality, slot classification, and Fate pick helpers.
 * Scene option count and final pad list live in finalOptions (finalSceneOptions).
 * Free text is never a slot and is never rejected.
 *
 * Slot ids (for Fate weighting / classification):
 *   1. push   — push the story on
 *   2. engage — main thing with who/what is present
 *   3. own    — class / skills / kit / trade
 *   4. back   — step back (flee / rest / leave / travel)
 */
import type { GameState } from './types';
import {
  isFreeInputChip,
  wayOutMovesPlayer,
} from './sceneAffordances';
import {
  storyChip,
  actionFamily,
  isHuntChip,
  isGatherChip,
  isSeekFightChip,
} from './choiceRanking';
import { barePlaceKey, isTravelDestHere } from './placeRegistry';
import { travelChipTarget } from './questPlay';
import { canOutdoorShortRest, isSafeHubRest } from './recoveryRules';
import { isHurtHp, isOutdoorRestPad } from './rules/wildlifeConfig';
import { canAddMaterials } from './inventory';
import { hasNodeStock } from './wilds';
import { gatherModeOk, huntModeOk } from './wildlifeActions';
import { isCrowdOnlyTalkPad, speakablePresentPeople } from './chromeAuthority';
import { peopleHere } from './scenePresence';
import { openingOfferPads } from './openingEstablishment';
import { hubsForBibleId } from './outdoorHubs';
import { originPad } from './rules/rpgOrigin';
import { isDying } from './tabletop/roundFight';
import { firstFightChoiceSet } from './rules/firstFightChoice';
import { isJourneyOnwardLine, isJourneyUnderway, journeyPads } from './travelJourney';
import { parkedThreatHere } from './placeThreats';
import { excludedPadFamilies, isLeaveFamilyPad, isTravelPad, travelPadBlocked } from './padUniverse';

/** Turns after a HERE change where Travel back to the place just left is dead (FOURSLOT3). */
const ARRIVAL_BOUNCE_TURNS = 2;
/** FOURSLOT4 — after this many consecutive Travel/Leave picks, Travel is illegal (engine loop guard). */
export const TRAVEL_STREAK_CAP = 2;
/** FOURSLOT5 — Look/Wait/Read/Inspect/Search filler streak cap (tabletop tavern loiter). */
export const FILLER_STREAK_CAP = 2;

function isFillerFamilyChip(label: string): boolean {
  const fam = actionFamily(label);
  return fam === 'look' || fam === 'wait' || fam === 'inspect' || fam === 'search' || fam === 'use';
}

/** Consecutive Look/Wait/Read/Inspect/Search player picks at the end of the log. */
export function consecutiveFillerFamilyPicks(state: GameState): number {
  const log = state.log ?? [];
  let n = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    if (isFillerFamilyChip(e.content ?? '')) n += 1;
    else break;
  }
  return n;
}

export type FourSlotId = 'push' | 'engage' | 'own' | 'back';

export const FOUR_SLOT_ORDER: FourSlotId[] = ['push', 'engage', 'own', 'back'];

export type FourSlotPick = { slot: FourSlotId; label: string };

function tidy(s: string): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

function low(s: string): string {
  return tidy(s).toLowerCase();
}

/** Travel / Leave / Walk-on family — harness + engine streak share this. */
export function isTravelFamilyChip(label: string): boolean {
  const t = low(label);
  if (!t) return false;
  if (/^leave(?:\s+the\s+scene)?$/.test(t)) return true;
  if (/^(?:travel|head toward|go to|return to|walk (?:on|toward|back|away)|turn back|make for|set out)\b/.test(t)) {
    return true;
  }
  return false;
}

/** Consecutive Travel/Leave player picks at the end of the log (FOURSLOT4 loop guard). */
export function consecutiveTravelFamilyPicks(state: GameState): number {
  const log = state.log ?? [];
  let n = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    if (isTravelFamilyChip(e.content ?? '')) n += 1;
    else break;
  }
  return n;
}

/** Last Travel arrived and circling has not recorded progress since that move. */
export function recentTravelNoDevelopment(state: GameState): boolean {
  const moved = state.circling?.movedTurn;
  if (moved == null) return false;
  const turn = state.turn ?? 0;
  if (turn - moved > 4) return false;
  const lastProgress = state.circling?.lastProgressTurn ?? 0;
  return lastProgress < moved;
}

/** Exclusive pads that must not be reshaped into four slots. */
export function shouldSkipFourSlot(state: GameState): boolean {
  if (state.playPhase === 'ended') return true;
  // Forced session-zero / death-save / first-fight triad — only these stay exclusive.
  if (originPad(state)?.length) return true;
  if (isDying(state)) return true;
  const ff = firstFightChoiceSet(state);
  if (ff.active && ff.options.length) return true;
  // FOURSLOT6 — traveler road meetings (journey.encounter) still fill four slots. Only a drought
  // foe parked as pendingEncounter / parkedThreat keeps the exclusive Walk on / Face list (s85).
  // Hurt still reshapes so Rest can land.
  if (isJourneyUnderway(state) && !liveFight(state) && journeyPads(state).length > 0) {
    if (state.sceneFacts?.pendingEncounter || parkedThreatHere(state)) {
      const hp = state.character?.hp ?? 0;
      const max = state.character?.maxHp ?? 0;
      if (!isHurtHp(hp, max)) return true;
    }
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

/**
 * Person / role token for a Talk/Ask/Answer/Read-person chip (FOURSLOT6 echo + presence).
 * Strips "about …" / "regarding …" so Ask X about Y and Talk to X share a target.
 */
export function talkChipTarget(label: string): string | null {
  const raw = tidy(label);
  if (!raw) return null;
  const m = raw.match(
    /^(?:talk to|ask|answer|press|follow up with|follow up:|read|analyze)\s+(.+)$/i
  );
  if (!m?.[1]) return null;
  let who = tidy(m[1]);
  who = who
    .replace(/\s+(?:about|regarding|re|for|on)\s+.+$/i, '')
    .replace(/[:：].+$/, '')
    .trim();
  if (!who) return null;
  // Bare surroundings reads are not person targets.
  if (/^(?:the\s+)?(?:area|scene|room|signs?|board|panel|trail|report|threat signs)\b/i.test(who)) {
    return null;
  }
  return who;
}

/**
 * FOURSLOT6 — authoritative Talk/Ask seats: when sceneFacts.present is a non-empty occupancy
 * lock, chips may only name those people (+ companions / live foe / road meeting). Opening-cast
 * leftovers and location-stamped memories must not resurrect absent Talk targets (7903 / 8103).
 */
function authoritativeTalkSeats(state: GameState): string[] {
  const lock = (state.sceneFacts?.present ?? []).map((n) => tidy(n)).filter(Boolean);
  if (lock.length) {
    const out = new Map<string, string>();
    const add = (n?: string | null) => {
      const name = tidy(n ?? '');
      if (!name) return;
      // Crowd / pulled-you aggregates are occupancy chrome, never Talk seats (FOURSLOT2).
      if (!speakablePresentPeople([name]).length) return;
      out.set(low(name), name);
    };
    for (const n of lock) add(n);
    for (const c of state.companions ?? []) add(c.name);
    add(state.activeEncounter?.name);
    add(state.pendingFirstFight?.encounter?.name);
    // Road meeting is a live seat even when present[] is the stretch cast.
    if (isJourneyUnderway(state)) {
      for (const p of peopleHere(state)) add(p);
    }
    return [...out.values()];
  }
  return peopleHere(state);
}

function nameMatchesSeat(seat: string, target: string): boolean {
  const name = low(seat);
  const tl = low(target);
  if (!name || !tl) return false;
  if (name === tl || name.includes(tl) || tl.includes(name)) return true;
  const bare = name.replace(/^(?:the|a|an)\s+/, '');
  const tb = tl.replace(/^(?:the|a|an)\s+/, '');
  if (bare && (bare === tb || bare.includes(tb) || tb.includes(bare))) return true;
  // "Innkeep Mara" ↔ "the innkeep" (role title token).
  const seatTokens = bare.split(/[\s'’-]+/).filter(Boolean);
  const targetTokens = tb.split(/[\s'’-]+/).filter(Boolean);
  if (seatTokens[0] && targetTokens[0] && seatTokens[0] === targetTokens[0]) return true;
  return false;
}

function talkTargetPresent(state: GameState, label: string): boolean {
  const t = low(label);
  const seated = authoritativeTalkSeats(state);
  if (isCrowdOnlyTalkPad(label)) {
    // Aggregate Talk needs a real seated listener — never the aggregate token alone.
    return peopleHere(state).length > 0 && speakablePresentPeople(state.sceneFacts?.present).length > 0;
  }
  if (!seated.length) return false;
  const target = talkChipTarget(label);
  if (target) {
    return seated.some((p) => nameMatchesSeat(p, target));
  }
  for (const p of seated) {
    const name = low(p);
    if (name && t.includes(name)) return true;
  }
  // Bare "Talk" / "Ask around" with no named target while someone is here.
  if (/^(?:talk|ask|press|follow up)\s*$/.test(t)) return seated.length > 0;
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

/**
 * FOURSLOT4 — Travel to a place already in the recent triangle/pair with no development since
 * arrival (Stillroot Inn ↔ Graveyard ↔ Peat Camp; Choked ↔ Moot). Flee during a fight stays valid.
 */
export function isNoDevelopmentRecentTravel(state: GameState, label: string): boolean {
  const dest = travelDestOf(label);
  if (!dest) return false;
  if (liveFight(state)) return false;
  if (!recentTravelNoDevelopment(state) && consecutiveTravelFamilyPicks(state) < 1) return false;
  const recent = state.circling?.recentPlaces ?? [];
  if (!recent.length) return false;
  return recent.some((p) => samePlaceLabel(dest, p));
}

/** True when this chip would be a dead / illegal action right now. */
export function isFourSlotLegal(state: GameState, label: string): boolean {
  const raw = tidy(label);
  if (!raw || isFreeInputChip(raw)) return false;
  // 02i/02w — closed pad universe: never refill Travel/Leave after starve (assemble runs after seal).
  // Talk/use/ask stay on authoritativeTalkSeats / other gates — sealed-cast talk starve must not
  // wipe present Talk chips (FOURSLOT unit "Talk only when NPC is present").
  {
    const excluded = excludedPadFamilies(state);
    if (excluded.has('travel') && isTravelPad(raw)) return false;
    if (excluded.has('leave') && isLeaveFamilyPad(raw)) return false;
  }
  const t = low(raw);

  // Travel to HERE is always dead (OPEN9 / FOURSLOT2 canonicalPlaceKey).
  const dest = travelDestOf(raw);
  if (dest && isTravelDestHere(state, dest)) return false;
  if (/^travel\b/.test(t) && !dest) return false;
  // FOURSLOT3 — never offer Travel while fight / dying blocks travel (T37 travel-blocked).
  if (dest && travelPadBlocked(state)) return false;
  // FOURSLOT3 — Travel back to the place just left is not the immediate default.
  if (dest && isImmediateBounceTravel(state, raw)) return false;
  // FOURSLOT4 — engine loop guard: after TRAVEL_STREAK_CAP Travel/Leave picks, starve Travel/Leave
  // (flee during a live fight stays valid via travelPadBlocked branch above failing first).
  if (
    !liveFight(state)
    && isTravelFamilyChip(raw)
    && consecutiveTravelFamilyPicks(state) >= TRAVEL_STREAK_CAP
  ) {
    return false;
  }
  // FOURSLOT4 — no-development recent-place Travel (triangle / pair treadmill).
  if (dest && isNoDevelopmentRecentTravel(state, raw)) return false;
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

  // Talk / Answer / Read-person for an absent NPC (specific name/role must be seated).
  if (
    /^(?:talk|ask|answer|press|follow up with|follow up:)\b/.test(t)
    || (/^(?:read|analyze)\s+\S/i.test(raw) && talkChipTarget(raw))
  ) {
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

  // H3 / John 27 Nov: repeats stay on the pad (ranked lower in pickFromFourSlots). Never starve
  // Search/Inspect/Look via offer-cap or streak — that left LitRPG/RPG short after Search while
  // tabletop (no exhaust gate) stayed exact. finalSceneOptions refill needs these chips legal.
  return true;
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

const GENERIC_FILLER_PAD = /^(?:look around|wait and listen|wait|search the area|travel toward\b|leave the scene)/i;

/**
 * While the opening offer is still open, its accept / refuse choices hold slots: they replace
 * generic fillers (Look around / Wait / travel) first, then the last pads. The pad count stays the same.
 */
export function keepOpeningOfferInSlots(state: GameState, pads: string[]): string[] {
  const offer = openingOfferPads(state);
  if (!offer.length || !pads.length || liveFight(state)) return pads;
  const out = [...pads];
  const has = (l: string) => out.some((c) => low(c) === low(l));
  for (const label of offer) {
    if (has(label)) continue;
    let at = -1;
    for (let i = out.length - 1; i >= 0; i--) {
      if (GENERIC_FILLER_PAD.test(out[i]!) && !offer.some((o) => low(o) === low(out[i]!))) {
        at = i;
        break;
      }
    }
    if (at < 0) {
      for (let i = out.length - 1; i >= 0; i--) {
        if (!offer.some((o) => low(o) === low(out[i]!))) {
          at = i;
          break;
        }
      }
    }
    if (at < 0) break;
    out[at] = label;
  }
  return out;
}

/** What the action bar shows: no free-input pads (free typing has its own box). */
export function visibleActionChips(actions: string[]): string[] {
  return actions.filter((c) => !isFreeInputChip(c));
}

/** Scene engine labels only (no free-input). Pad count is owned by finalOptions.sceneOptionCount. */
export function fourSlotEngineLabels(pads: string[]): string[] {
  return pads.filter((c) => !isFreeInputChip(c));
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
 * FOURSLOT4 — cap consecutive Travel/Leave; prefer slot-1 Engage/push when Travel would loop.
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
  const travelStreak = consecutiveTravelFamilyPicks(state);
  const fillerStreak = consecutiveFillerFamilyPicks(state);
  const nonTravel = slots.filter((c) => !isTravelFamilyChip(c));
  const nonFiller = slots.filter((c) => !isFillerFamilyChip(c));
  // FOURSLOT5 — after FILLER_STREAK_CAP Look/Wait/Read, pick a real lead.
  if (fillerStreak >= FILLER_STREAK_CAP && nonFiller.length) {
    return nonFiller[0]!;
  }
  // Engine + harness: after TRAVEL_STREAK_CAP Travel picks, never pick another Travel/Leave.
  if (travelStreak >= TRAVEL_STREAK_CAP && nonTravel.length) {
    return nonTravel[0]!;
  }
  if (hurt && (!fight || slots.some((c) => /\bflee|disengage|withdraw\b/i.test(c)))) {
    const rest = slots.find(
      (c) =>
        isOutdoorRestPad(c)
        || /^rest\b/i.test(c)
        || /^make camp\b/i.test(c)
        || /^take a short rest\b/i.test(c)
    );
    if (rest) return rest;
    // FOURSLOT4 — after ≥1 Travel while hurt, prefer a real lead (Fight/Talk/quest) over Leave/Travel.
    if (travelStreak >= 1 && nonTravel.length) {
      return nonTravel[0]!;
    }
    const flee = slots.find((c) => /\bflee|disengage|withdraw\b/i.test(c));
    if (flee) return flee;
    // Prefer the back slot (index 3) when present — but not when it is Travel after a streak.
    if (slots[3] && !(travelStreak >= 1 && isTravelFamilyChip(slots[3]!))) return slots[3]!;
    if (nonTravel.length) return nonTravel[0]!;
  }
  // Weighted: push slightly preferred, then engage, own, back.
  // FOURSLOT4 — zero Travel weight once a Travel was just picked (lazy player stops travelling).
  const weights = slots.map((c, i) => {
    const base = [4, 3, 2, 2][i] ?? 1;
    if (travelStreak >= 1 && isTravelFamilyChip(c)) return 0.15;
    return base;
  });
  let total = 0;
  for (const w of weights) total += w;
  if (!(total > 0)) return nonTravel[0] ?? slots[0]!;
  let roll = rng() * total;
  for (let i = 0; i < slots.length; i++) {
    roll -= weights[i] ?? 1;
    if (roll <= 0) return slots[i]!;
  }
  return slots[0]!;
}
