/**
 * Hard validation gate for player actions.
 * Blocks LLM call when action references non-existent entities with high confidence.
 *
 * Conservative on purpose: look-around, opening covers, layout questions, and
 * informational asks always pass. Only invented-item / missing-companion /
 * ungrounded-named-entity (and numeric gold) cases block.
 */

import type { GameState } from './types';
import { groundPlayerAction, isRoomLayoutExploreAsk } from './intentParser';
import { isExploreOrLayoutAsk, isInformationalOrAsk } from './repairEngine';
import {
  findHardItemUseClaims,
  referencesAbsentCompanion,
} from './suggestionValidation';

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  rewritten?: string;
  severity: 'blocking' | 'warning';
}

export interface HardViolation {
  code: string;
  message: string;
  entity?: string;
}

const LOOK_AROUND =
  /\b(look around|look about|look around me|what(?:'s| is) around|survey (?:the )?(?:room|area|scene|surroundings)|inspect (?:the )?(?:room|area|surroundings)|observe(?: the)?(?: room| area| scene)?)\b/i;

const INVENTED_PRIOR_CONTAINER =
  /\b(?:the\s+)?(?:last|final|remaining)\s+(box(?:es)?|crate(?:s)?|chest(?:s)?|pouch(?:es)?|bag(?:s)?|sack(?:s)?|barrel(?:s)?|trunk(?:s)?)\b/i;

const TALK_PROPER_NAME =
  /\b(?:ask|tell|consult|command|order|speak (?:to|with)|talk (?:to|with))\s+(?:the\s+)?([A-Z][\p{L}\p{N}'-]{1,40})\b/u;

const GENERIC_TALK_ROLES = new Set([
  'guard', 'guards', 'merchant', 'innkeeper', 'bartender', 'villager', 'stranger',
  'prisoner', 'enemy', 'figure', 'crowd', 'elder', 'priest', 'herald', 'courtier',
  'acolyte', 'sage', 'attendant', 'official', 'speaker', 'system', 'registrar',
]);

function openingCoversPending(state: GameState): boolean {
  const est = state.openingEstablishment;
  if (!est) return false;
  if (est.complete === true) return false;
  return (est.pending?.length ?? 0) > 0 || !!state.pendingGeneratedOpening;
}

function nameAppearedInLastStory(name: string, storyProse: string): boolean {
  const n = name.trim();
  if (n.length < 2 || !storyProse.trim()) return false;
  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = storyProse.replace(/<[^>]+>/g, ' ');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(stripped);
}

function knownNameSet(state: GameState, storyProse: string): Set<string> {
  const names = new Set<string>();
  const add = (value?: string) => {
    const n = (value ?? '').trim().toLowerCase();
    if (n.length >= 2) names.add(n);
  };
  for (const who of state.sceneFacts?.present ?? []) add(who);
  for (const c of state.companions ?? []) add(c.name);
  for (const mem of state.npcMemories ?? []) add(mem.npcName);
  if (state.activeEncounter?.name) add(state.activeEncounter.name);
  for (const card of state.lorebook ?? []) add(card.name);
  if (state.character?.name) add(state.character.name);
  for (const token of storyProse.toLowerCase().match(/[a-z][\w'-]{3,}/g) ?? []) {
    names.add(token);
  }
  return names;
}

function knownObjectNames(state: GameState): string[] {
  const names: string[] = [];
  for (const item of state.inventory ?? []) names.push(item.name);
  for (const bag of state.containers ?? []) names.push(bag.name);
  for (const prop of state.sceneFacts?.props ?? []) names.push(prop);
  for (const it of state.locationSheet?.interactables ?? []) {
    if (it.name) names.push(it.name);
  }
  const node = state.activeDungeon?.nodes.find((n) => n.id === state.activeDungeon?.currentNodeId);
  for (const loose of node?.hidden?.looseItems ?? []) names.push(loose.label);
  return names;
}

function hasContainerType(state: GameState, type: string): boolean {
  const singular = type.replace(/e?s$/, '').toLowerCase();
  const blob = knownObjectNames(state).join(' ').toLowerCase();
  return blob.includes(singular);
}

/** Skip the hard gate for exploratory / cover / layout language. */
export function shouldSkipHardGate(input: string, state: GameState): boolean {
  const t = input.replace(/\s+/g, ' ').trim();
  if (!t) return true;
  if (openingCoversPending(state)) return true;
  if (isRoomLayoutExploreAsk(t)) return true;
  if (isInformationalOrAsk(t)) return true;
  if (isExploreOrLayoutAsk(t)) return true;
  if (LOOK_AROUND.test(t) && !/\b(use|draw|wield|unsheathe|brandish|my companion)\b/i.test(t)) {
    return true;
  }
  return false;
}

/**
 * Hard gate validation — blocks LLM call if high-confidence violations detected.
 * Returns violations that should be shown to the player (repair-style UI).
 */
export function validateActionHard(
  input: string,
  state: GameState,
  storyProse = ''
): ValidationResult {
  const trimmed = input.replace(/\s+/g, ' ').trim();
  const grounded = groundPlayerAction(trimmed, state, storyProse);

  if (shouldSkipHardGate(trimmed, state)) {
    return {
      valid: true,
      violations: [],
      rewritten: grounded.rewritten ? grounded.text : undefined,
      severity: 'warning',
    };
  }

  const violations: HardViolation[] = [];

  const invented = trimmed.match(INVENTED_PRIOR_CONTAINER);
  if (invented) {
    const type = (invented[1] ?? 'box').replace(/e?s$/, '').toLowerCase();
    if (!hasContainerType(state, type)) {
      violations.push({
        code: 'MISSING_ITEM',
        message: `You don't have: ${type}. Check your inventory or rephrase your action.`,
        entity: type,
      });
    }
  }

  const missingItems = findHardItemUseClaims(trimmed, state);
  if (missingItems.length > 0) {
    violations.push({
      code: 'MISSING_ITEM',
      message: `You don't have: ${missingItems.join(', ')}. Check your inventory or rephrase your action.`,
      entity: missingItems[0],
    });
  }

  if (referencesAbsentCompanion(trimmed, state)) {
    violations.push({
      code: 'MISSING_COMPANION',
      message: `No companion is with you right now. You'll need to recruit or summon one first.`,
    });
  }

  const talkName = trimmed.match(TALK_PROPER_NAME)?.[1];
  if (talkName && !GENERIC_TALK_ROLES.has(talkName.toLowerCase())) {
    const known = knownNameSet(state, storyProse);
    if (!known.has(talkName.toLowerCase()) && !nameAppearedInLastStory(talkName, storyProse)) {
      violations.push({
        code: 'UNGROUNDED_ENTITY',
        message: `"${talkName}" isn't present or established yet. Try looking around or describing what you mean.`,
        entity: talkName,
      });
    }
  }

  const goldMatch = trimmed.match(/\b(?:pay|spend|offer|bribe)\b[^.]{0,48}?\b(\d{1,7})\s*(?:gold|gp|coins?)\b/i);
  if (goldMatch) {
    const amount = Number(goldMatch[1]);
    if (Number.isFinite(amount) && amount > (state.gold ?? 0)) {
      violations.push({
        code: 'INSUFFICIENT_GOLD',
        message: `You only have ${state.gold ?? 0} gold, not enough for ${amount}.`,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations: violations.map((v) => v.message),
    rewritten: grounded.rewritten ? grounded.text : undefined,
    severity: violations.length > 0 ? 'blocking' : 'warning',
  };
}

/**
 * Soft validation — returns warnings but doesn't block LLM call.
 * Used for actions that might be valid but are risky/unclear.
 */
export function validateActionSoft(
  input: string,
  state: GameState,
  _storyProse = ''
): ValidationResult {
  const warnings: string[] = [];

  if (/\b(?:attack|fight|charge)\b/i.test(input)) {
    const hp = state.character?.hp ?? 0;
    const maxHp = state.character?.maxHp ?? 1;
    if (hp < maxHp * 0.3 && hp > 0) {
      warnings.push(`You're at ${hp}/${maxHp} HP — combat is risky.`);
    }
  }

  const companions = state.companions ?? [];
  const present = state.sceneFacts?.present ?? [];
  if (companions.length === 0 && present.length === 0) {
    if (/\b(?:ask|tell|speak to|talk to)\b/i.test(input)) {
      warnings.push(`You're alone right now. No one to talk to.`);
    }
  }

  if (/\b(?:swing|slash|stab)\s+(?:my|the)\s+(\w+)/i.test(input)) {
    const equipped = (state.inventory ?? []).filter((i) => i.equipped);
    if (equipped.length === 0) {
      warnings.push(`No weapon equipped. Equip one first or use unarmed attacks.`);
    }
  }

  return {
    valid: true,
    violations: warnings,
    severity: 'warning',
  };
}

/**
 * Combined validation: hard + soft.
 * Returns blocking violations first, then warnings.
 */
export function validateAction(
  input: string,
  state: GameState,
  storyProse = ''
): ValidationResult {
  const hard = validateActionHard(input, state, storyProse);
  if (!hard.valid) {
    return hard;
  }

  const soft = validateActionSoft(input, state, storyProse);
  return {
    valid: true,
    violations: soft.violations,
    rewritten: hard.rewritten,
    severity: 'warning',
  };
}
