/**
 * Binding constraints builder for LLM prompt.
 * Phase 1 Quick Win: compact AUTHORITY rails from canonical state.
 *
 * Compact SNAPSHOT in the situation packet is the one truth block.
 * Extra slice: exit / prop / presence whitelists. Do not flatten prose flair.
 */

import type { GameState, SceneFacts, Item } from './types.ts';
import { formatCrowdBindingLine } from './crowdAuthority.ts';
import { formatHookBindingLine } from './hookLock.ts';
import { listInteriorExitsFromHere } from './mapEngine.ts';
import { isInteriorMap } from './placeAuthority.ts';
import { currentDungeonNode } from './dungeonSeed.ts';
import { emptySearchAuthorityLine } from './searchContinuity.ts';
import { equippedWeaponName } from './ledgerCombat.ts';

export interface BindingConstraint {
  category: 'scene' | 'inventory' | 'location' | 'time' | 'npc' | 'quest';
  rule: string;
  authority: string;
}

function capList(names: string[], max = 8): string {
  const uniq = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  return uniq.slice(0, max).join(', ');
}

function collectLooseLabels(state: GameState): string[] {
  const node = currentDungeonNode(state.activeDungeon);
  return (node?.hidden?.looseItems ?? []).map((i) => i.label).filter(Boolean);
}

/**
 * Build binding constraints from game state.
 * These are formatted as AUTHORITY rules in the prompt.
 */
export function buildBindingConstraints(state: GameState): BindingConstraint[] {
  const constraints: BindingConstraint[] = [];

  if (state.sceneFacts) {
    constraints.push(...buildSceneConstraints(state.sceneFacts, state));
  }

  constraints.push(...buildExitConstraints(state));
  constraints.push(...buildPropItemConstraints(state));
  constraints.push(...buildPresenceConstraints(state));

  if (state.inventory) {
    constraints.push(...buildInventoryConstraints(state.inventory, state));
  }

  const emptyLine = emptySearchAuthorityLine(state.sceneFacts);
  if (emptyLine) {
    constraints.push({
      category: 'inventory',
      rule: emptyLine,
      authority: 'sceneFacts.searchedEmpty',
    });
  }

  const clock = state.worldLedger?.clock;
  if (clock && Number(clock.day || 0) < 0.4 && Number(clock.week || 0) < 1) {
    constraints.push({
      category: 'time',
      rule: 'Same morning — do not skip hours or to the next day',
      authority: 'worldLedger.clock',
    });
  }

  if (state.activeEncounter) {
    constraints.push({
      category: 'scene',
      rule: `Active combat with ${state.activeEncounter.name} (${state.activeEncounter.hp}/${state.activeEncounter.maxHp} HP) — combat is still happening unless player flees or defeats them`,
      authority: 'activeEncounter',
    });
  }

  return constraints;
}

function buildExitConstraints(state: GameState): BindingConstraint[] {
  if (state.activeDungeon && isInteriorMap(state.activeDungeon)) {
    const exits = listInteriorExitsFromHere(state.activeDungeon);
    if (exits.length > 0) {
      const listed = exits.map((e) => `${e.noun}→${e.name}`).join(', ');
      return [{
        category: 'location',
        rule: `EXITS: ${listed}. Only these doors/passages exist from here — do not invent extra doors, windows, or gaps`,
        authority: 'interiorExits',
      }];
    }
    return [{
      category: 'location',
      rule: 'EXITS: none mapped from this room — do not invent extra doors, windows, or gaps',
      authority: 'interiorExits',
    }];
  }
  const sheetExits = (state.locationSheet?.exits ?? []).map((e) => e.label).filter(Boolean);
  if (sheetExits.length > 0) {
    return [{
      category: 'location',
      rule: `EXITS: ${capList(sheetExits)}. Only these exits exist — do not invent extra doors, windows, or gaps`,
      authority: 'locationSheet.exits',
    }];
  }
  return [];
}

function buildPropItemConstraints(state: GameState): BindingConstraint[] {
  const props = [...(state.sceneFacts?.props ?? [])];
  for (const it of state.locationSheet?.interactables ?? []) {
    if (it.name) props.push(it.name);
  }
  props.push(...collectLooseLabels(state));
  const carried = [
    ...(state.inventory ?? []).map((i) => i.name),
    ...(state.containers ?? []).map((c) => c.name),
  ];
  const propLine = capList(props);
  const carryLine = capList(carried);
  if (!propLine && !carryLine) {
    return [{
      category: 'inventory',
      rule: 'PROPS/ITEMS: none established — do not invent named containers ("the last box", "the remaining crate") or unowned gear',
      authority: 'sceneFacts.props',
    }];
  }
  const parts: string[] = [];
  if (propLine) parts.push(`scene: ${propLine}`);
  if (carryLine) parts.push(`carried: ${carryLine}`);
  return [{
    category: 'inventory',
    rule: `PROPS/ITEMS: ${parts.join(' | ')}. Do not invent extra named containers ("the last box") or gear absent from this list`,
    authority: 'sceneFacts.props+inventory',
  }];
}

function buildPresenceConstraints(state: GameState): BindingConstraint[] {
  const alone = state.openingEstablishment?.aloneArrival === true;
  const present = alone ? [] : [...(state.sceneFacts?.present ?? [])];
  const companions = (state.companions ?? []).map((c) => c.name);
  if (state.activeEncounter?.name) present.push(state.activeEncounter.name);
  const names = capList([...present, ...companions.map((n) => `Companion: ${n}`)]);
  if (alone && !state.activeEncounter) {
    return [{
      category: 'npc',
      rule: 'PRESENCE: alone — no NPCs, no crowd. Do not invent watchers, handlers, or people who saw the player arrive',
      authority: 'openingEstablishment.aloneArrival',
    }];
  }
  if (names) {
    return [{
      category: 'npc',
      rule: `PRESENCE: ${names} — these are here and can interact; do not claim they left without narrating departure; do not invent extra named people`,
      authority: 'sceneFacts.present',
    }];
  }
  return [{
    category: 'npc',
    rule: 'PRESENCE: none established — do not invent named NPCs or a crowd',
    authority: 'sceneFacts.present',
  }];
}

/**
 * Build scene-level constraints (crowd, noise). Time/weather/tension live in SCENE STATE.
 */
function buildSceneConstraints(facts: SceneFacts, state: GameState): BindingConstraint[] {
  const constraints: BindingConstraint[] = [];
  const alone = state.openingEstablishment?.aloneArrival === true;
  const hookRule = formatHookBindingLine(state);
  if (hookRule) {
    constraints.push({
      category: 'scene',
      rule: hookRule,
      authority: 'sceneFacts.hookLock',
    });
  }

  if (alone && !state.activeEncounter) {
    constraints.push({
      category: 'scene',
      rule: 'Scene is empty — no bystanders or crowd are present; do not suddenly introduce people without the player encountering them',
      authority: 'sceneFacts.crowd',
    });
    return constraints;
  }

  if (facts.crowd === 'present' || facts.crowd === 'sparse') {
    constraints.push({
      category: 'scene',
      rule: 'People are present in this scene — do not write an empty street, silent area, or "no one around" unless you narrate them leaving',
      authority: 'sceneFacts.crowd',
    });
    const countRule = formatCrowdBindingLine(state);
    if (countRule) {
      constraints.push({
        category: 'scene',
        rule: countRule,
        authority: 'sceneFacts.crowdCount',
      });
    }
  } else if (facts.crowd === 'none') {
    constraints.push({
      category: 'scene',
      rule: 'Scene is empty — no bystanders or crowd are present; do not suddenly introduce people without the player encountering them',
      authority: 'sceneFacts.crowd',
    });
  }

  if (facts.noise === 'shouting') {
    constraints.push({
      category: 'scene',
      rule: 'People are shouting in this scene — do not write sudden silence or calm unless you narrate the shouting stopping',
      authority: 'sceneFacts.noise',
    });
  } else if (facts.noise === 'quiet') {
    constraints.push({
      category: 'scene',
      rule: 'Scene is quiet — do not suddenly introduce shouting or loud voices without a cause',
      authority: 'sceneFacts.noise',
    });
  }

  if (facts.indoor === true) {
    constraints.push({
      category: 'location',
      rule: 'Scene is indoors — do not write that the player steps outside unless they used an exit',
      authority: 'sceneFacts.indoor',
    });
  } else if (facts.indoor === false) {
    constraints.push({
      category: 'location',
      rule: 'Scene is outdoors — do not write that the player enters a building unless they used an entrance',
      authority: 'sceneFacts.indoor',
    });
  }

  return constraints;
}

/**
 * Build inventory constraints (equipped items, lack of items).
 */
function buildInventoryConstraints(inventory: Item[], state?: GameState): BindingConstraint[] {
  const constraints: BindingConstraint[] = [];

  const equipped = inventory.filter((i) => i.equipped);
  if (equipped.length > 0) {
    const names = equipped.map((i) => i.name).slice(0, 5);
    constraints.push({
      category: 'inventory',
      rule: `Player has equipped: ${names.join(', ')} — do not claim they lack these items`,
      authority: 'inventory',
    });
  }

  const weapon = state ? equippedWeaponName(state) : 'bare hands';
  if (weapon === 'bare hands') {
    constraints.push({
      category: 'inventory',
      rule: 'Player has no declared weapon (sealed bag undeclared) — narrate fists / bare hands / improvised debris only; never invent a dagger, sword, or knife in their grip',
      authority: 'inventory.weapon',
    });
  } else {
    constraints.push({
      category: 'inventory',
      rule: `Player weapon authority: ${weapon} — do not invent a different weapon`,
      authority: 'inventory.weapon',
    });
  }

  const questItems = inventory.filter((i) => i.itemType === 'quest');
  if (questItems.length > 0) {
    const names = questItems.map((i) => i.name);
    constraints.push({
      category: 'inventory',
      rule: `Player has quest items: ${names.join(', ')} — do not lose or destroy these items without explicit player action`,
      authority: 'inventory',
    });
  }

  return constraints;
}

/**
 * Format binding constraints for prompt (compact AUTHORITY / BINDING tone).
 */
export function formatBindingConstraintsForPrompt(constraints: BindingConstraint[]): string {
  if (constraints.length === 0) {
    return '';
  }

  const lines: string[] = [
    '### BINDING CONSTRAINTS (AUTHORITY)',
    'Engine facts. Narrate richly; do not contradict these. Atmosphere is free. Do not invent extras off this list.',
  ];

  for (const item of constraints.slice(0, 10)) {
    lines.push(`**BINDING**: ${item.rule}`);
  }

  return lines.join('\n');
}

const EMPTY_STREET_CLAIM =
  /\b(empty street|no one (?:is )?(?:here|around)|deserted street)\b/i;
const CROWD_LEFT =
  /\b(crowd (?:leaves|disperses|scatters)|people (?:leave|flee|scatter))\b/i;
const SUDDEN_SILENCE =
  /\b((?:eerie |sudden |complete )silence|falls silent|the (?:street|room|hall|scene) (?:is |goes )?silent)\b/i;
const SHOUTING_STOPPED =
  /\b(shouting (?:stops|fades|quiets)|voices (?:fall silent|fade))\b/i;
const TIME_SKIP_CLAIM =
  /\b(hours? (?:later|pass(?:es|ed)?|ago)|next (?:morning|day|evening))\b/i;
const STEP_OUTSIDE =
  /\b(you (?:step|walk|go|head) (?:outside|outdoors|into (?:the )?(?:street|open)))\b/i;
const STEP_INSIDE =
  /\b(you (?:step|walk|go|enter) (?:inside|indoors|into (?:the )?(?:building|room)))\b/i;

/**
 * Check if prose contradicts binding facts (regex only — never a second LLM).
 * Atmospheric words (abandoned ruin, quiet scrape, musty oak) are not violations.
 */
export function detectConstraintViolations(
  prose: string,
  constraints: BindingConstraint[]
): string[] {
  const violations: string[] = [];

  for (const constraint of constraints) {
    if (constraint.category === 'scene') {
      if (constraint.rule.includes('People are present')) {
        if (EMPTY_STREET_CLAIM.test(prose) && !CROWD_LEFT.test(prose)) {
          violations.push(`Prose claims scene is empty, but constraint: ${constraint.rule}`);
        }
      }

      if (constraint.rule.includes('People are shouting')) {
        if (SUDDEN_SILENCE.test(prose) && !SHOUTING_STOPPED.test(prose)) {
          violations.push(`Prose claims silence, but constraint: ${constraint.rule}`);
        }
      }
    }

    if (constraint.category === 'time') {
      if (TIME_SKIP_CLAIM.test(prose)) {
        violations.push(`Prose skips time, but constraint: ${constraint.rule}`);
      }
    }

    if (constraint.category === 'location') {
      if (constraint.rule.includes('indoors')) {
        if (STEP_OUTSIDE.test(prose)) {
          violations.push(`Prose moves outdoors, but constraint: scene is indoors`);
        }
      } else if (constraint.rule.includes('outdoors')) {
        if (STEP_INSIDE.test(prose)) {
          violations.push(`Prose moves indoors, but constraint: scene is outdoors`);
        }
      }
    }
  }

  return violations;
}

/**
 * Repair factual contradictions in-place. Never strips texture or adjectives.
 */
export function repairConstraintViolations(
  prose: string,
  constraints: BindingConstraint[]
): string {
  let next = prose;

  for (const constraint of constraints) {
    if (constraint.category === 'scene' && constraint.rule.includes('People are present')) {
      if (EMPTY_STREET_CLAIM.test(next) && !CROWD_LEFT.test(next)) {
        next = next.replace(/\bempty street\b/gi, 'street');
        next = next.replace(/\bno one (?:is )?(?:here|around)\b/gi, 'people still nearby');
        next = next.replace(/\bdeserted street\b/gi, 'street');
      }
    }

    if (constraint.category === 'scene' && constraint.rule.includes('People are shouting')) {
      if (SUDDEN_SILENCE.test(next) && !SHOUTING_STOPPED.test(next)) {
        next = next.replace(/\b(?:eerie |sudden |complete )silence\b/gi, 'ongoing shouting');
        next = next.replace(/\bfalls silent\b/gi, 'keeps shouting');
        next = next.replace(
          /\bthe (street|room|hall|scene) (?:is |goes )?silent\b/gi,
          'the $1 is still loud'
        );
      }
    }

    if (constraint.category === 'time' && TIME_SKIP_CLAIM.test(next)) {
      next = next.replace(/\bhours? (?:later|pass(?:es|ed)?|ago)\b/gi, 'moments later');
      next = next.replace(/\bnext (?:morning|day|evening)\b/gi, 'a moment later');
    }

    if (constraint.category === 'location' && constraint.rule.includes('indoors') && STEP_OUTSIDE.test(next)) {
      next = next.replace(STEP_OUTSIDE, 'you stay in this room');
    } else if (
      constraint.category === 'location'
      && constraint.rule.includes('outdoors')
      && STEP_INSIDE.test(next)
    ) {
      next = next.replace(STEP_INSIDE, 'you stay where you are');
    }
  }

  return next;
}
