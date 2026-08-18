/**
 * Combat telegraph → player-facing receipt (post-commit system log).
 */

import type { OutcomeToken } from './outcomeToken';
import type { LedgerCombatRound } from './ledgerCombat';

/** Compact declared-threat + result line for Status / system log. */
export function formatCombatReceipt(args: {
  combat?: LedgerCombatRound | null;
  token?: OutcomeToken | null;
}): string | null {
  const c = args.combat ?? args.token?.combat;
  if (!c) return null;
  const threat = `${c.enemyName} (${c.enemyHpBefore} HP)`;
  const blow = `You hit with ${c.weaponName} for ${c.dealt}`;
  const after = c.enemyDead
    ? `${c.enemyName} down`
    : `${c.enemyName} now ${c.enemyHpAfter} HP`;
  const ret = c.enemyActReason?.trim() || 'No return blow';
  const you = `Your HP ${c.playerHpAfter}`;
  return `Combat: ${threat}. ${blow} → ${after}. ${ret}. ${you}.`;
}

/** Pre-writer telegraph one-liner (already in outcome token; keep for HUD chips). */
export function formatCombatTelegraph(combat: LedgerCombatRound): string {
  return `${combat.enemyName} threatens — legal counters: fight / flee / talk if safe. Declared: strike with ${combat.weaponName}.`;
}
