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
  computeOptionSceneKey,
  isFreeInputChip,
  optionSceneKeyString,
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
import { isOnCooldown } from './optionDiversityContract';
import { namedTalkTopicSpent } from './npcTopicFsm';
import { isCrowdOnlyTalkPad, speakablePresentPeople } from './chromeAuthority';
import { peopleHere } from './scenePresence';
import { hubsForBibleId, outdoorHubTravelChoices } from './outdoorHubs';
import { originPad } from './rules/rpgOrigin';
import { isDying } from './tabletop/roundFight';
import { firstFightChoiceSet } from './rules/firstFightChoice';
import { isJourneyOnwardLine, isJourneyPad, isJourneyUnderway, journeyPads } from './travelJourney';
import { parkedThreatHere } from './placeThreats';
import { excludedPadFamilies, isLeaveFamilyPad, isTravelPad, travelPadBlocked } from './padUniverse';

/** Turns after a HERE change where Travel back to the place just left is dead (FOURSLOT3). */
const ARRIVAL_BOUNCE_TURNS = 2;
/** FOURSLOT4 — after this many consecutive Travel/Leave picks, Travel is illegal (engine loop guard). */
export const TRAVEL_STREAK_CAP = 2;
/** FOURSLOT5 — Look/Wait/Read/Inspect/Search filler streak cap (tabletop tavern loiter). */
export const FILLER_STREAK_CAP = 2;
/** FOURSLOT6 — any same-family streak cap for slots 1–3 (talk / fight / move / …). */
export const FAMILY_STREAK_CAP = 2;

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

  // OPEN6–9 filler family cap — LitRPG / Story RPG only.
  // Tabletop keeps REPEAT_COOLDOWN_TURNS.dnd === 0 (q44-OCD2 08:41); do not starve inspect/search there.
  if (
    (state.engineMode === 'litrpg' || state.engineMode === 'rpg')
    && isFillerNoProgressChip(raw)
    && fillerOfferExhausted(state, raw)
  ) {
    return false;
  }

  // FOURSLOT5 — after FILLER_STREAK_CAP Look/Wait/Read picks, starve filler so slot 1 must be a
  // real lead (all modes, including tabletop tavern loiter). Assemble last-resort may still
  // plant one Look/Wait when no other legal chip can reach four (FOURSLOT6 only-legal-option).
  if (isFillerFamilyChip(raw) && consecutiveFillerFamilyPicks(state) >= FILLER_STREAK_CAP) {
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
  const prev = tidy(previousPlayerAction) || lastPlayerAction(state);
  if (!prev) return false;
  const a = tidy(label);
  // FOURSLOT6 — Rest/camp while still hurt is never an echo starve (8102 after partial heal).
  const hurtNow = isHurtHp(state.character?.hp ?? 0, state.character?.maxHp ?? 0) && !liveFight(state);
  if (
    hurtNow
    && (isOutdoorRestPad(a) || /^rest\b/i.test(a) || /^make camp\b/i.test(a) || /^take a short rest\b/i.test(a))
  ) {
    return false;
  }
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
  // FOURSLOT6 — Talk/Ask echo: same person target after strip of "about …" (8103 Ask Grash / 8102 Ask Idra).
  const talkA = talkChipTarget(a);
  const talkB = talkChipTarget(prev);
  if (talkA || talkB) {
    const x = low(talkA ?? '');
    const y = low(talkB ?? '');
    if (!x || !y) return false;
    return x === y || x.includes(y) || y.includes(x);
  }
  // Filler Search/Open/Read on same HERE counts as repeat.
  const fam = actionFamily(a);
  if (fam === 'search' || fam === 'look' || fam === 'inspect' || fam === 'use') {
    return true;
  }
  return false;
}

/** Consecutive player picks of one actionFamily at the end of the log (FOURSLOT6 streak cap). */
export function consecutiveSameFamilyPicks(state: GameState, family: string): number {
  const want = (family ?? '').toLowerCase();
  if (!want) return 0;
  const log = state.log ?? [];
  let n = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    if (actionFamily(e.content ?? '') === want) n += 1;
    else break;
  }
  return n;
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

/** FOURSLOT6 — families that must leave slots 1–3 after FAMILY_STREAK_CAP picks (live fight exempt). */
function streakStarvedFamilies(state: GameState): Set<string> {
  if (liveFight(state)) return new Set();
  return recentPlayerFamilies(state, FAMILY_STREAK_CAP);
}

function familyStarvedForFrontSlots(state: GameState, label: string): boolean {
  const starved = streakStarvedFamilies(state);
  if (starved.size && starved.has(actionFamily(label))) return true;
  // FOURSLOT5/6 — Look/Wait/Read/Inspect/Search leave slots 1–3 after FILLER_STREAK_CAP.
  if (
    consecutiveFillerFamilyPicks(state) >= FILLER_STREAK_CAP
    && isFillerFamilyChip(label)
  ) {
    return true;
  }
  return false;
}

function uniquePush(out: string[], seen: Set<string>, label: string): void {
  const k = low(label);
  if (!k || seen.has(k)) return;
  seen.add(k);
  out.push(tidy(label));
}

/** Check System / Check notices is inbox chrome, never a scene pad. */
function isSystemInboxChip(label: string): boolean {
  return /^(?:check system|check notices)\b/i.test((label ?? '').trim());
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
    if (namedTalkTopicSpent(state, t)) return null;
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
  // Option cooldown holds in the same scene. A scene change lets the chip return.
  const offeredCooldown = new Map(Object.entries(state.qualityGovernance?.optionCooldowns ?? {}));
  const sceneNow = optionSceneKeyString(computeOptionSceneKey(state));
  const lastScene = (state.recentOfferedActions ?? []).at(-1)?.sceneKey ?? '';
  const sameScene = !lastScene || lastScene === sceneNow;
  const cooledHere = (label: string) =>
    sameScene && isOnCooldown(label, state.turn ?? 0, offeredCooldown).onCooldown;
  const pools: Record<FourSlotId, string[]> = {
    push: [],
    engage: [],
    own: [],
    back: [],
  };

  const consider = (raw: string) => {
    const label = tidy(raw);
    if (!label || isFreeInputChip(label)) return;
    if (cooledHere(label) || namedTalkTopicSpent(state, label)) return;
    if (!isFourSlotLegal(state, label)) return;
    if (isFourSlotRepeat(state, label, prev)) return;
    const slot = classifyFourSlot(state, label);
    if (!slot) return;
    pools[slot].push(label);
  };

  const candList = candidates.map(tidy).filter((c) => !!c && !isSystemInboxChip(c));
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
  // FOURSLOT4 — when Travel is streak-starved or arrival had no development, force a real lead
  // into the pools (quest step / Talk / fight / Look) so slot 1 is never empty Travel.
  // FOURSLOT5 — same when filler streak is at the cap (tavern Look/Wait/Read loop).
  const fillerStreak = consecutiveFillerFamilyPicks(state);
  if (
    !liveFight(state)
    && (consecutiveTravelFamilyPicks(state) >= 1
      || recentTravelNoDevelopment(state)
      || fillerStreak >= FILLER_STREAK_CAP)
  ) {
    if (story && !isTravelFamilyChip(story) && !isFillerFamilyChip(story)) consider(story);
    for (const p of peopleHere(state)) {
      if (!p || isCrowdOnlyTalkPad(`Talk to ${p}`)) continue;
      consider(`Talk to ${p}`);
    }
    if (creaturePresent(state)) {
      consider('Press the attack');
      const foeName = state.activeEncounter?.name ?? state.sceneFacts?.pendingEncounter?.name ?? '';
      if (/root/i.test(foeName)) consider('Fight the writhing roots');
      consider('Face the threat');
    }
    // After a filler streak, do not refill with Look — manufacture a real lead or Travel.
    if (fillerStreak < FILLER_STREAK_CAP) {
      consider('Look around');
      consider('Search the area');
    } else {
      for (const hub of outdoorHubTravelChoices(state, 4)) consider(hub);
      for (const row of recordedTravelDestinations(state)) {
        consider(`Travel toward ${row.label}`);
      }
    }
    if (hurt) {
      consider(TABLETOP_SHORT_REST_CHIP);
      consider(OUTDOOR_REST_CHIP);
    }
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
  const frontStarve = streakStarvedFamilies(state);

  for (const slot of FOUR_SLOT_ORDER) {
    const starveFront = slot !== 'back' && frontStarve.size > 0;
    let chosen: string | null = null;
    for (const cand of pools[slot]) {
      if (seen.has(low(cand))) continue;
      if (starveFront && familyStarvedForFrontSlots(state, cand)) continue;
      chosen = cand;
      break;
    }
    if (!chosen) {
      const fb = fourSlotFallback(state, slot, seen, candList);
      if (fb && !(starveFront && familyStarvedForFrontSlots(state, fb))) chosen = fb;
      else if (fb && !starveFront) chosen = fb;
    }
    // Last resort: any legal unused candidate (never invent a novel label).
    if (!chosen) {
      for (const c of candList) {
        const label = tidy(c);
        if (!label || isFreeInputChip(label) || seen.has(low(label))) continue;
        if (!isFourSlotLegal(state, label)) continue;
        if (starveFront && familyStarvedForFrontSlots(state, label)) continue;
        chosen = label;
        break;
      }
    }
    // Only-legal-option: allow a streaked family when nothing else fills the slot.
    if (!chosen) {
      for (const cand of pools[slot]) {
        if (seen.has(low(cand))) continue;
        chosen = cand;
        break;
      }
    }
    if (!chosen) {
      chosen = fourSlotFallback(state, slot, seen, candList);
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
    && !isSystemInboxChip(label)
    && isFourSlotLegal(state, label)
    && !isFourSlotRepeat(state, label, prev)
    && !namedTalkTopicSpent(state, label);
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
  // Safe engine fallbacks to reach 4 (Look/Wait / exit Travel).
  // Leave when hurt needs a route to a safe spot (closed camp / tabletop outdoor Rest illegal).
  // Full-HP sealed openings never take this branch — transitStuck Leave-unbound stays fixed.
  const exitTravels = recordedTravelDestinations(state).map((r) => `Travel toward ${r.label}`);
  const leaveWhenHurtRoute = hurt ? ['Leave the scene'] : [];
  // FOURSLOT6 — after filler/family streak, manufacture Talk / Travel / quest lead before Look/Wait.
  const seatedTalk = peopleHere(state)
    .filter((p) => p && !isCrowdOnlyTalkPad(`Talk to ${p}`))
    .map((p) => `Talk to ${p}`);
  const fillerStarved = consecutiveFillerFamilyPicks(state) >= FILLER_STREAK_CAP;
  const safeFill = roadUnderway
    ? [
        ...(huntModeOk(state) ? ['Hunt the wildlife nearby'] : []),
        ...(gatherModeOk(state) ? ['Gather herbs and resources nearby'] : []),
        ...(hurt ? [OUTDOOR_REST_CHIP, OUTDOOR_CAMP_CHIP] : []),
        ...seatedTalk,
              ]
    : [
        ...seatedTalk,
        ...exitTravels,
        ...outdoorHubTravelChoices(state, 4),
        ...leaveWhenHurtRoute,
                OUTDOOR_REST_CHIP,
        OUTDOOR_CAMP_CHIP,
        ...(state.engineMode === 'dnd' ? [TABLETOP_SHORT_REST_CHIP] : []),
        // Look/Wait only when filler streak has not already starved them.
        ...(!fillerStarved
          ? ['Look around', 'Wait and listen', 'Wait', 'Keep watch']
          : ['Study the report', 'Report back to the guide']),
      ];
  for (const g of safeFill) {
    if (four.length >= 4) break;
    if (fourSeen.has(low(g)) || !canPad(g) || cooledHere(g) || namedTalkTopicSpent(state, g)) continue;
    // Hurt road: only keep chips the journey owner recognizes (or Rest/camp).
    if (
      roadUnderway
      && !isJourneyPad(state, g)
      && !isOutdoorRestPad(g)
      && !/^rest\b/i.test(g)
      && !/^make camp\b/i.test(g)
      && !/^take a short rest\b/i.test(g)
      && !/^check system\b/i.test(g)
      && !/^talk to\b/i.test(g)
    ) {
      continue;
    }
    // FOURSLOT6 — do not refill front slots with a streak-starved family unless only option.
    if (
      four.length < 3
      && familyStarvedForFrontSlots(state, g)
      && four.some((c) => !familyStarvedForFrontSlots(state, c))
    ) {
      continue;
    }
    uniquePush(four, fourSeen, g);
  }
  // Absolute last resort: any unused legal candidate / seated Talk / hub Travel to hit 4.
  if (four.length < 4) {
    const lastResort = [
      ...seatedTalk,
      ...outdoorHubTravelChoices(state, 6),
      ...exitTravels,
      ...candList,
      'Study the report',
          ];
    for (const g of lastResort) {
      if (four.length >= 4) break;
      if (fourSeen.has(low(g)) || !canPad(g) || cooledHere(g) || namedTalkTopicSpent(state, g)) continue;
      uniquePush(four, fourSeen, g);
    }
  }
  // FOURSLOT6 — only-legal-option: when still short after every non-filler manufacture, allow one
  // Look/Wait despite the filler streak (order: starve slots 1–3 unless only legal option).
  if (four.length < 4 && consecutiveFillerFamilyPicks(state) >= FILLER_STREAK_CAP) {
    for (const g of ['Look around', 'Wait and listen', 'Wait', 'Keep watch']) {
      if (four.length >= 4) break;
      if (fourSeen.has(low(g))) continue;
      if (isFourSlotRepeat(state, g, prev)) continue;
      if (isFreeInputChip(g)) continue;
      uniquePush(four, fourSeen, g);
    }
  }

  // FOURSLOT5 — hurt + no fight: Rest must occupy a slot whenever it is legal (Leave is only
  // the route when Rest is impossible). Replace Wait/Leave in slot 4 if needed.
  if (hurt && !liveFight(state)) {
    const hasRest = four.some(
      (c) => isOutdoorRestPad(c) || /^rest\b/i.test(c) || /^make camp\b/i.test(c) || /^take a short rest\b/i.test(c)
    );
    if (!hasRest) {
      const restChip =
        (state.engineMode === 'dnd' ? TABLETOP_SHORT_REST_CHIP : null)
        ?? OUTDOOR_REST_CHIP;
      const campOk = canPad(OUTDOOR_CAMP_CHIP) ? OUTDOOR_CAMP_CHIP : null;
      const pick =
        (canPad(restChip) ? restChip : null)
        ?? campOk
        ?? (state.engineMode === 'dnd' && canPad(TABLETOP_SHORT_REST_CHIP) ? TABLETOP_SHORT_REST_CHIP : null);
      if (pick) {
        // Prefer replacing Wait / Keep watch / Leave in the last slot.
        let replaced = false;
        for (let i = four.length - 1; i >= 0; i--) {
          const c = four[i]!;
          if (/^(?:wait|keep watch|leave)\b/i.test(c) || isFillerPad(c)) {
            fourSeen.delete(low(c));
            four[i] = pick;
            fourSeen.add(low(pick));
            replaced = true;
            break;
          }
        }
        if (!replaced && four.length < 4) {
          uniquePush(four, fourSeen, pick);
        } else if (!replaced && four.length >= 4) {
          fourSeen.delete(low(four[3]!));
          four[3] = pick;
          fourSeen.add(low(pick));
        }
      }
    }
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
