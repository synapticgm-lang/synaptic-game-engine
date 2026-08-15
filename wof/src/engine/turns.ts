import { FREE_TURN_CAP, KID_TURN_CAP, MID_TURN_CAP, type SubTier, type TurnLedger, type TurnReason } from '../types';

const FREE_REASONS = new Set<TurnReason>([
  'idle_presence',
  'tell',
  'ah_browse',
  'mail_read',
  'combat_choice',
]);

export function turnCap(tier: SubTier, kidMode: boolean): number {
  if (kidMode) return KID_TURN_CAP;
  if (tier === 'high') return 10_000;
  if (tier === 'mid') return MID_TURN_CAP;
  return FREE_TURN_CAP;
}

export function emptyTurnLedger(accountId: string, dayUtc: string, cap: number): TurnLedger {
  return { accountId, dayUtc, spent: 0, cap };
}

export function spendTurn(ledger: TurnLedger, reason: TurnReason): { ledger: TurnLedger; spent: boolean } {
  if (FREE_REASONS.has(reason)) return { ledger, spent: false };
  if (ledger.spent >= ledger.cap) return { ledger, spent: false };
  return { ledger: { ...ledger, spent: ledger.spent + 1 }, spent: true };
}

export function canAffordRound(ledger: TurnLedger): boolean {
  return ledger.spent < ledger.cap;
}

/** Raid lobby gate: dump pick — Mid+ only. */
export function canEnterRaid(tier: SubTier, kidMode: boolean): boolean {
  if (kidMode) return false;
  return tier === 'mid' || tier === 'high';
}
