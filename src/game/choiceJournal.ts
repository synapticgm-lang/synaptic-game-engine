/**
 * Story RPG journal of choices. The engine writes one entry when it commits a choice (a deed toward a named person,
 * a main-quest decision, the origin, a romance, the ending), never from prose. The quest log, the recap on return
 * and the main-quest epilogue all read this one list.
 */
import type { ChoiceJournalEntry, GameState } from './types';

/** Oldest entries drop past this many. */
export const CHOICE_JOURNAL_CAP = 60;

export function recordChoice(state: GameState, entry: Omit<ChoiceJournalEntry, 'turn'> & { turn?: number }): GameState {
  if (state.engineMode !== 'rpg') return state;
  const row: ChoiceJournalEntry = { turn: entry.turn ?? state.turn ?? 0, kind: entry.kind, text: entry.text, ...(entry.npc ? { npc: entry.npc } : {}) };
  const list = [...(state.choiceJournal ?? []), row];
  return { ...state, choiceJournal: list.slice(-CHOICE_JOURNAL_CAP) };
}

export function choiceJournal(state: Pick<GameState, 'choiceJournal'>): ChoiceJournalEntry[] {
  return state.choiceJournal ?? [];
}

/** The last `n` choices, newest last. */
export function recentChoices(state: Pick<GameState, 'choiceJournal'>, n: number): ChoiceJournalEntry[] {
  return choiceJournal(state).slice(-Math.max(0, n));
}

/** One journal row as the quest log shows it. */
export function choiceJournalLine(e: ChoiceJournalEntry): string {
  return `Turn ${e.turn}: ${e.text}`;
}
