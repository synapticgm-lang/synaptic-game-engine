/**
 * SRD 5.2.1 action economy for the engine-first turn spine (merge M3).
 *
 * SRD 5.2.1 — Combat / Your Turn (Wizards of the Coast LLC, CC BY 4.0):
 * "On your turn, you can move a distance up to your Speed and take one Action.
 * You can take a Bonus Action only when a special ability, spell, or other feature
 * of the game states that you can do something as a Bonus Action. You can also
 * interact with one object or feature of the environment for free, during either
 * your move or your Action. You can take one Reaction on every round, and brief
 * communication costs no Action."
 *
 * Extra mechanical steps in one player message resolve as "not done: no … left this
 * round" — free text is never rejected; only the engine rolls dice.
 */
import type { IntentStep } from './intentParser.ts';

export type EconomySlot = 'action' | 'bonus' | 'movement' | 'reaction' | 'object' | 'speech';

export interface EconomyUsed {
  action: number;
  bonus: number;
  movement: number;
  reaction: number;
  object: number;
}

export function freshEconomy(): EconomyUsed {
  return { action: 0, bonus: 0, movement: 0, reaction: 0, object: 0 };
}

/** Cap for a slot this round. Speech is uncapped (free). Bonus requires a feature grant. */
export function slotCap(slot: EconomySlot, bonusGranted: boolean): number | null {
  if (slot === 'speech') return null;
  if (slot === 'bonus') return bonusGranted ? 1 : 0;
  return 1;
}

/**
 * Which economy slot a reader step spends in a fight.
 * Speech / most deals are free; trade and mechanical aims spend Action.
 * Movement (sneak / reposition) spends Movement; potions Bonus; draw/torch Object.
 */
export function slotOfStep(step: IntentStep): EconomySlot {
  const act = step.action;
  const clause = `${step.clause ?? ''} ${step.target ?? ''} ${step.topic ?? ''}`;
  // M6 — steal is a Dexterity (Sleight of Hand) Action, never free speech.
  if (act === 'take' && /\b(steal|pickpocket|filch|swipe|palm|from)\b/i.test(clause)) {
    return 'action';
  }
  // M6 — parley / persuade / intimidate / deceive aimed at calming hostiles spends Action.
  // Plain talk/ask stays free speech (SRD Communicating).
  if (
    act === 'persuade'
    || act === 'intimidate'
    || act === 'deceive'
    || /\b(parley|negotiate|talk\s+(?:it|them)\s+down|truce)\b/i.test(clause)
  ) {
    return 'action';
  }
  if (
    act === 'talk'
    || act === 'ask_about'
    || act === 'refuse'
    || act === 'recall'
  ) {
    return 'speech';
  }
  if (act === 'deal') {
    // Trade is a mechanical Action; other ledger dealings stay free speech / bookkeeping.
    return step.deal?.kind === 'trade' ? 'action' : 'speech';
  }
  if (act === 'sneak') return 'movement';
  if (act === 'move') return 'movement';
  if (act === 'use_item' || act === 'take') {
    const t = clause.toLowerCase();
    if (/\bpotion\b/.test(t) || /\bheal/.test(t)) return 'bonus';
    if (/\btorch\b|\brope\b|\bdraw\b|\bsheathe\b|\bobject\b/.test(t)) return 'object';
    return 'action';
  }
  // attack / cast / flee / rest / search / observe / buy / sell / other
  return 'action';
}

export function notDoneReason(slot: EconomySlot): string {
  if (slot === 'action') return 'not done: no action left this round';
  if (slot === 'bonus') return 'not done: no bonus action left this round';
  if (slot === 'movement') return 'not done: no movement left this round';
  if (slot === 'reaction') return 'not done: no reaction left this round';
  if (slot === 'object') return 'not done: no free object interaction left this round';
  return 'not done: no action left this round';
}

/**
 * Try to spend a slot. Speech always ok. Returns the not-done reason when the slot is spent.
 */
export function trySpendSlot(
  used: EconomyUsed,
  slot: EconomySlot,
  bonusGranted = true
): { ok: true; used: EconomyUsed } | { ok: false; reason: string; used: EconomyUsed } {
  if (slot === 'speech') return { ok: true, used };
  const cap = slotCap(slot, bonusGranted);
  if (cap == null) return { ok: true, used };
  const next = { ...used, [slot]: (used[slot] ?? 0) + 1 };
  if (next[slot]! > cap) {
    return { ok: false, reason: notDoneReason(slot), used };
  }
  return { ok: true, used: next };
}

/** Whether the PC has any feature that grants a Bonus Action this round (Rage, potion drink as BA, etc.). */
export function bonusActionGranted(state: {
  character?: { srd?: { classId?: string } | null } | null;
  inventory?: Array<{ name?: string; quantity?: number }> | null;
  roundCombat?: { raging?: boolean } | null;
}): boolean {
  const cls = state.character?.srd?.classId ?? '';
  if (cls === 'barbarian' && !state.roundCombat?.raging) return true;
  if (cls === 'monk' || cls === 'rogue' || cls === 'fighter') return true;
  const pot = (state.inventory ?? []).some(
    (i) => /\bpotion\b/i.test(i.name ?? '') && (i.quantity ?? 1) > 0
  );
  return pot;
}
