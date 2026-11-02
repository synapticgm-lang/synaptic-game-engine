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
import { storyChip, actionFamily, isHuntChip, isGatherChip, isSeekFightChip } from './choiceRanking';
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
  return /^(?:talk|ask|answer|press|follow up)\b/.test(t) && people.length > 0;
}

function creaturePresent(state: GameState): boolean {
  if (liveFight(state)) return true;
  if (state.sceneFacts?.pendingEncounter) return true;
  const last = state.sceneFacts?.lastKill;
  if (last && typeof last.turn === 'number' && (state.turn ?? 0) - last.turn <= 0) return false;
  return false;
}

function travelDestOf(label: string): string | null {
  return travelChipTarget(label) ?? (
    tidy(label).match(/^(?:travel|head|go|walk|return|make for|set out)\s+(?:to|toward|towards|for|into)?\s*(.+)$/i)?.[1]
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

  // Talk / Answer for an absent NPC.
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

  // Step back first so Rest/Leave/Travel are never mis-filed as push.
  if (
    isOutdoorRestPad(raw)
    || /^(?:rest|make camp|leave|flee|withdraw|walk away|turn back|camp)\b/.test(t)
    || /^(?:travel|walk on|go back|head toward|return to)\b/.test(t)
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
  ) {
    return 'push';
  }

  // Your own way — kit / class / trade (before engage so Hunt isn't "engage").
  if (
    isHuntChip(raw)
    || isGatherChip(raw)
    || isSeekFightChip(raw)
    || /^check system\b/.test(t)
    || /^(?:sneak|pick the lock|pick lock|cast|craft|train|buy|sell|browse|shop|barter|enroll|study the art)\b/.test(t)
    || /^use\b/.test(t)
  ) {
    return 'own';
  }
  if (town && /^(?:buy|sell|browse|shop|train|enroll)\b/.test(t)) return 'own';

  // Engage — present person / creature / object.
  if (
    /^(?:talk|ask|answer|press|follow up with|persuade|threaten|attack|strike|fight|face|inspect|examine|study|read|open)\b/.test(t)
  ) {
    // Open/Search filler is not engage unless it is the only object study — still classify, legality drops dead ones.
    if (isFillerPad(raw) && !/\b(?:panel|sign|book|door|seal|lock|crate|chest|puzzle)\b/.test(t)) {
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

/** Built-in fallbacks per slot when the candidate pool has nothing legal. */
export function fourSlotFallback(state: GameState, slot: FourSlotId, forbidden: Set<string>): string | null {
  const fight = liveFight(state);
  const tryLabel = (label: string): string | null => {
    const t = tidy(label);
    if (!t || forbidden.has(low(t))) return null;
    if (!isFourSlotLegal(state, t)) return null;
    if (isFourSlotRepeat(state, t, lastPlayerAction(state))) return null;
    return t;
  };

  if (fight) {
    if (slot === 'push') return tryLabel('Press the attack') ?? tryLabel('Attack');
    if (slot === 'engage') return tryLabel('Defend') ?? tryLabel('Help an ally') ?? tryLabel('Use something');
    if (slot === 'own') return tryLabel('Use something') ?? tryLabel('Try a skill');
    if (slot === 'back') return tryLabel('Disengage') ?? tryLabel('Try to flee') ?? tryLabel('Flee');
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
    return tryLabel('Look around') ?? tryLabel('Wait and listen');
  }

  if (slot === 'engage') {
    const people = speakablePresentPeople(state.sceneFacts?.present);
    for (const p of people) {
      const hit = tryLabel(`Talk to ${p}`);
      if (hit) return hit;
    }
    for (const p of peopleHere(state)) {
      const hit = tryLabel(`Talk to ${p}`);
      if (hit) return hit;
    }
    if (peopleHere(state).length) {
      const hit = tryLabel('Talk to the people here');
      if (hit) return hit;
    }
    if (creaturePresent(state)) {
      const hit = tryLabel('Press the attack') ?? tryLabel('Attack');
      if (hit) return hit;
    }
    return tryLabel('Inspect the immediate surroundings') ?? tryLabel('Look around');
  }

  if (slot === 'own') {
    if (huntModeOk(state)) {
      const hit = tryLabel('Hunt the wildlife nearby');
      if (hit) return hit;
    }
    if (gatherModeOk(state) && hasNodeStock(state)) {
      const hit = tryLabel('Gather herbs and resources nearby');
      if (hit) return hit;
    }
    if (inSettlement(state)) {
      const hit = tryLabel('Browse the nearest stall') ?? tryLabel('Ask about training');
      if (hit) return hit;
    }
    return tryLabel('Check System') ?? tryLabel('Look around');
  }

  // back
  {
    const hp = state.character?.hp ?? 0;
    const max = state.character?.maxHp ?? 0;
    if (isHurtHp(hp, max) && !fight) {
      const rest = tryLabel(OUTDOOR_REST_CHIP) ?? tryLabel('Rest');
      if (rest) return rest;
    }
    for (const hub of outdoorHubTravelChoices(state, 6)) {
      const hit = tryLabel(hub);
      if (hit) return hit;
    }
    return tryLabel('Leave the scene') ?? tryLabel('Wait');
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

  for (const c of candidates) consider(c);
  // Prefer story chip / rest when hurt even if not in candidates.
  const story = storyChip(state);
  if (story) consider(story);
  if (isHurtHp(state.character?.hp ?? 0, state.character?.maxHp ?? 0) && !liveFight(state)) {
    consider(OUTDOOR_REST_CHIP);
  }
  for (const hub of outdoorHubTravelChoices(state, 4)) consider(hub);

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
      chosen = fourSlotFallback(state, slot, seen);
    }
    // Last resort: any legal unused candidate, then a generic explore line.
    if (!chosen) {
      for (const c of candidates) {
        const label = tidy(c);
        if (!label || isFreeInputChip(label) || seen.has(low(label))) continue;
        if (!isFourSlotLegal(state, label)) continue;
        chosen = label;
        break;
      }
    }
    if (!chosen) {
      const generics = ['Look around', 'Wait and listen', 'Leave the scene', 'Check System'];
      for (const g of generics) {
        if (!seen.has(low(g))) {
          chosen = g;
          break;
        }
      }
    }
    if (chosen) {
      uniquePush(picked, seen, chosen);
      picks.push({ slot, label: chosen });
    }
  }

  // Exactly four when possible — pad with distinct generics if a slot somehow failed.
  const generics = ['Look around', 'Wait and listen', 'Leave the scene', 'Check System', 'Search the area'];
  for (const g of generics) {
    if (picked.length >= 4) break;
    if (!isFourSlotLegal(state, g) && g !== 'Check System' && g !== 'Look around' && g !== 'Wait and listen' && g !== 'Leave the scene') {
      continue;
    }
    uniquePush(picked, seen, g);
  }
  // Final gate: drop any illegal slip (Travel-HERE, absent Talk, etc.) and refill that slot.
  const four: string[] = [];
  const fourSeen = new Set<string>();
  for (let i = 0; i < Math.min(4, picked.length); i++) {
    const label = picked[i]!;
    const slot = FOUR_SLOT_ORDER[i]!;
    if (isFourSlotLegal(state, label) && !isFourSlotRepeat(state, label, prev)) {
      uniquePush(four, fourSeen, label);
      continue;
    }
    const fb = fourSlotFallback(state, slot, fourSeen);
    if (fb) uniquePush(four, fourSeen, fb);
    else {
      for (const g of generics) {
        if (fourSeen.has(low(g))) continue;
        uniquePush(four, fourSeen, g);
        break;
      }
    }
  }
  for (const g of generics) {
    if (four.length >= 4) break;
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
