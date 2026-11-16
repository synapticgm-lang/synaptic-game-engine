/**
 * Training-capture context for gm-turn calls (client side). Data only — the server decides whether a call
 * is captured (consent, switch, rights). Nothing here changes prompts or game behaviour.
 *
 * One gameplay turn = one root turn id. The writer call gets its own call id; repair / check calls in the
 * same turn carry the writer call as parent, so they never count as extra turns.
 */
import type { GameState } from './types';

export type GmCaptureInput = {
  /** What the player sent: typed text or the button label as shown. */
  text: string;
  source: 'typed' | 'choice' | 'automated';
  /** Engine record of the picked button, when the text was one of the offered chips. */
  choice?: { label: string; actionId?: string; kind?: string; index: number } | null;
};

export type GmCaptureContext = {
  rootTurnId: string;
  turnNo: number | null;
  input: GmCaptureInput | null;
  /** The engine-resolved action the writer was asked to narrate (after grounding / mediation). */
  resolvedAction: string | null;
  /** Set by gmProxy after the turn's writer call answers; repair / check calls link to it. */
  writerCallId: string | null;
};

let active: GmCaptureContext | null = null;

function newId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function newCaptureCallId(): string {
  return newId();
}

/** The button the text matches exactly, from the pad offered this turn (structural match, not wording). */
export function describeCapturedInput(text: string, state: GameState | null | undefined, automated = false): GmCaptureInput {
  const chips = state?.offeredPad?.chips ?? [];
  const labels = state?.offeredPad?.choices ?? state?.choices ?? [];
  const trimmed = text.trim();
  const chipIndex = chips.findIndex((c) => c.label.trim() === trimmed);
  const labelIndex = chipIndex >= 0 ? chipIndex : labels.findIndex((l) => l.trim() === trimmed);
  const chip = chipIndex >= 0 ? chips[chipIndex] : null;
  const choice = labelIndex >= 0
    ? { label: labels[labelIndex] ?? chip?.label ?? trimmed, index: labelIndex, ...(chip ? { actionId: chip.actionId, kind: chip.kind } : {}) }
    : null;
  return { text, source: automated ? 'automated' : choice ? 'choice' : 'typed', choice };
}

/** Start a gameplay turn's capture context (replaces any previous one). */
export function beginGmCaptureTurn(args: {
  turnNo?: number | null;
  input: GmCaptureInput | null;
  resolvedAction?: string | null;
  rootTurnId?: string;
}): GmCaptureContext {
  active = {
    rootTurnId: args.rootTurnId ?? newId(),
    turnNo: typeof args.turnNo === 'number' ? args.turnNo : null,
    input: args.input,
    resolvedAction: args.resolvedAction ?? null,
    writerCallId: null,
  };
  return active;
}

export function currentGmCaptureContext(): GmCaptureContext | null {
  return active;
}

export function noteGmWriterCall(callId: string): void {
  if (active && !active.writerCallId) active.writerCallId = callId;
}

export function endGmCaptureTurn(): void {
  active = null;
}
