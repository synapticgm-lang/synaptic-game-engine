/**
 * Combat telegraph → player-facing receipt (post-commit system log).
 * VR1-b: roll maths come from CheckResultRecord via formatResultLine (not hand-built).
 */

import type { OutcomeToken } from './outcomeToken';
import type { LedgerCombatRound, LedgerFleeRound } from './ledgerCombat';
import { formatResultLine, outcomeFactFromRecord } from './rules/rollView';

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
  const roll = c.record ? ` ${formatResultLine(c.record)} ${outcomeFactFromRecord(c.record)}` : '';
  return `Combat: ${threat}. ${blow} → ${after}. ${ret}. ${you}.${roll}`;
}

/** Flee attempt receipt for Status / system log. */
export function formatFleeReceipt(args: { flee: LedgerFleeRound }): string {
  const f = args.flee;
  const roll = f.record ? ` ${formatResultLine(f.record)} ${outcomeFactFromRecord(f.record)}` : '';
  if (f.fled) {
    return `Flee: ${f.enemyName} (${f.enemyHpBefore} HP) left wounded on this node. ${f.fleeReason} Your HP ${f.playerHpAfter}.${roll}`;
  }
  return `Flee failed: ${f.enemyName} (${f.enemyHpBefore} HP) still engaged. ${f.fleeReason} Damage ${f.received}. Your HP ${f.playerHpAfter}.${roll}`;
}
