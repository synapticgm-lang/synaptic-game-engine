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
import { canOutdoorShortRest, isSafeHubRest } from './recoveryRules';
import { OUTDOOR_REST_CHIP, isHurtHp, isOutdoorRestPad } from './rules/wildlifeConfig';
import { canAddMaterials } from './inventory';
import { hasNodeStock } from './wilds';
import { gatherModeOk, huntModeOk } from './wildlifeActions';
import { speakablePresentPeople } from './chromeAuthority';
import { peopleHere } from './scenePresence';
import { hubsForBibleId, outdoorHubTravelChoices } from './outdoorHubs';
import { originPad } from './rules/rpgOrigin';
import { isDying } from './tabletop/roundFight';
import { firstFightChoiceSet } from './rules/firstFightChoice';
import { isJourneyOnwardLine, isJourneyUnderway, journeyPads } from './travelJourney';
import { parkedThreatHere } from './placeThreats';

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
  // Road journey owns the pad (Walk on / Face / Turn back). Reshaping invents Look/Inspect
  // and drops onward chips — same exclusive class as origin / first-fight.
  if (isJourneyUnderway(state) && !liveFight(state) && journeyPads(state).length > 0) return true;
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
  if (/^talk to the people here\b/.test(t) || /^ask the people here\b/.test(t)) {
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

/** True when this chip would be a dead / illegal action right now. */
export function isFourSlotLegal(state: GameState, label: string): boolean {
  const raw = tidy(label);
  if (!raw || isFreeInputChip(raw)) return false;
  const t = low(raw);

  // Travel to HERE is always dead (OPEN8 chapel-watch / OPEN9 place key).
  const dest = travelDestOf(raw);
  if (dest) {
    if (isTravelDestHere(state, dest)) return false;
    const hereBare = barePlaceKey(state.currentLocation);
    const destBare = barePlaceKey(dest);
    if (hereBare && destBare && (hereBare === destBare || hereBare.includes(destBare) || destBare.includes(hereBare))) {
      return false;
    }
  }
  if (/^travel\b/.test(t) && !dest) return false;

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
  if (isOutdoorRestPad(raw) || /^rest\b/.test(t) || /^make camp\b/.test(t)) {
    if (liveFight(state)) return false;
    if (state.engineMode === 'litrpg' || state.engineMode === 'rpg') {
      if (!canOutdoorShortRest(state, raw) && !isSafeHubRest(state, raw)) return false;
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

  // OPEN6–9 filler family cap — never re-offer exhausted Search/Look/Inspect/Wait as a slot.
  if (isFillerNoProgressChip(raw) && fillerOfferExhausted(state, raw)) return false;

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
  if (low(a) === low(prev)) return true;
  if (actionFamily(a) !== actionFamily(prev)) return false;
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

  // Step back first so Rest/Leave/Travel are never mis-filed as push.
  if (
    isOutdoorRestPad(raw)
    || /^(?:rest|make camp|leave|flee|withdraw|walk away|turn back|camp)\b/.test(t)
    || /^(?:travel|go back|head toward|return to)\b/.test(t)
  ) {
    return 'back';
  }

  const story = storyChip(state);
  if (story && low(story) === t) return 'push';
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
      const rest = tryLabel(OUTDOOR_REST_CHIP) ?? tryLabel('Rest', { requireCandidate: true });
      if (rest) return rest;
    }
    for (const hub of outdoorHubTravelChoices(state, 6)) {
      const hit = tryLabel(hub);
      if (hit) return hit;
    }
    return tryLabel('Leave the scene') ?? tryLabel('Wait') ?? null;
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
  // Prefer story chip / rest when hurt even if not in candidates.
  const story = storyChip(state);
  if (story) consider(story);
  if (isHurtHp(state.character?.hp ?? 0, state.character?.maxHp ?? 0) && !liveFight(state)) {
    consider(OUTDOOR_REST_CHIP);
  }
  for (const hub of outdoorHubTravelChoices(state, 4)) consider(hub);

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
  // Back: Travel / Leave before Wait filler.
  pools.back.sort((a, b) => {
    const score = (x: string) =>
      (/^travel\b/i.test(x) || /^leave\b/i.test(x) || isOutdoorRestPad(x) ? 0 : isFillerPad(x) ? 2 : 1);
    return score(a) - score(b);
  });

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
  // Safe engine fallbacks to reach 4 (Look/Wait/Leave/Check System bind as fallback/system —
  // never Browse/Talk-steward/Inspect invent). Skip exhausted filler.
  const safeFill = [
    'Look around',
    'Wait and listen',
    'Wait',
    'Leave the scene',
    ...(state.engineMode === 'litrpg' ? ['Check System'] : []),
    OUTDOOR_REST_CHIP,
  ];
  for (const g of safeFill) {
    if (four.length >= 4) break;
    if (fourSeen.has(low(g)) || !canPad(g)) continue;
    uniquePush(four, fourSeen, g);
  }

  // Free-input always offered (never counts as a slot).
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
