/** Edge stub — ensureSpokenAnswer / stripSpeakerSilence live on the client (src/game/spokenAnswer.ts). */
import type { GameState } from './types.ts';

export type SpokenAnswer =
  | { status: 'not-asked' | 'nobody-here' }
  | { status: 'already-quoted'; speaker: string }
  | { status: 'added'; speaker: string; source: 'authored'; line: string }
  | { status: 'no-line'; speaker: string };

/** Client paints exchange beats; edge last-resort keeps the converted engine page as-is. */
export function ensureSpokenAnswer(
  prose: string,
  _state: GameState,
  _playerInput: string,
): { prose: string; answer: SpokenAnswer } {
  return { prose: (prose ?? '').replace(/\s+/g, ' ').trim(), answer: { status: 'not-asked' } };
}

export function stripSpeakerSilence(prose: string, _speaker: { label: string }): string {
  return (prose ?? '').replace(/\s+/g, ' ').trim();
}
