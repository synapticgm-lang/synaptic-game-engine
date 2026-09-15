import type { GameState } from './types';
import { resolveOfferedChoices } from './playTranscript';

/** PYOA is chips only — no typed / spoken free text. */
export function isPyoaChipsOnly(state: { engineMode?: string } | null | undefined): boolean {
  return state?.engineMode === 'pyoa';
}

function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * True when this input is typed free text and must not start a PYOA turn.
 * Repair picks and listed chips stay legal.
 */
export function pyoaRejectsFreeText(state: GameState, input: string): boolean {
  if (!isPyoaChipsOnly(state)) return false;
  const text = input.trim();
  if (!text) return true;
  if (state.pendingRepair) return false;
  const n = norm(text);
  return !resolveOfferedChoices(state).some((c) => norm(c) === n);
}
