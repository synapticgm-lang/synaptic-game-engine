import type {
  ComicPanel,
  GameState,
  LocationSheet,
  PendingTurnProposal,
  TurnFrameTheme,
} from './types';
import type { PlayerIntent } from './intentParser';

function summarizeDeltas(params: {
  hpDelta: number;
  gainedItems: string[];
  usedItems: string[];
  questChanges: string[];
  encounterName?: string | null;
  location?: string;
  wardenNotes: string[];
}): string[] {
  const lines: string[] = [];
  if (params.hpDelta < 0) lines.push(`HP ${params.hpDelta}`);
  if (params.hpDelta > 0) lines.push(`HP +${params.hpDelta}`);
  for (const n of params.gainedItems) lines.push(`Gain item: ${n}`);
  for (const n of params.usedItems) lines.push(`Use/consume: ${n}`);
  for (const q of params.questChanges) lines.push(q);
  if (params.encounterName) lines.push(`Encounter: ${params.encounterName}`);
  if (params.location) lines.push(`Location: ${params.location}`);
  // Warden notes stay on the proposal for DEV UI only — never player-facing chips.
  void params.wardenNotes;
  if (!lines.length) lines.push('No sheet changes (story only)');
  return lines;
}

export function buildPendingProposal(params: {
  playerAction: string;
  playerEntryId: string;
  intent: PlayerIntent;
  narrative: string;
  systemLog: string[];
  choices: string[];
  wardenNotes: string[];
  proposedState: GameState;
  hpDelta: number;
  gainedItemNames: string[];
  usedItemNames: string[];
  questChangeNotes: string[];
  comicPanels?: ComicPanel[];
  imagePrompt?: string[] | null;
  turnFrame?: TurnFrameTheme | null;
  expectedRevision?: number;
}): PendingTurnProposal {
  const { proposedState } = params;
  // Strip nested pending to avoid recursion / bloat
  const cleanProposed: GameState = { ...proposedState, pendingTurn: null };
  return {
    id: crypto.randomUUID(),
    playerAction: params.playerAction,
    playerEntryId: params.playerEntryId,
    narrative: params.narrative,
    systemLog: params.systemLog,
    choices: params.choices,
    wardenNotes: params.wardenNotes,
    intentLabel: params.intent.label,
    deltaSummary: summarizeDeltas({
      hpDelta: params.hpDelta,
      gainedItems: params.gainedItemNames,
      usedItems: params.usedItemNames,
      questChanges: params.questChangeNotes,
      encounterName: cleanProposed.activeEncounter?.name,
      location: cleanProposed.currentLocation,
      wardenNotes: params.wardenNotes,
    }),
    comicPanels: params.comicPanels,
    imagePrompt: params.imagePrompt,
    turnFrame: params.turnFrame ?? undefined,
    createdAt: Date.now(),
    expectedRevision:
      params.expectedRevision
      ?? proposedState.ledgerRevision
      ?? 0,
    proposedState: cleanProposed,
  };
}

export function getProposedState(
  pending: PendingTurnProposal | null | undefined
): GameState | null {
  return pending?.proposedState ?? null;
}

export function withEditedNarrative(
  pending: PendingTurnProposal,
  narrative: string
): PendingTurnProposal {
  const proposed = getProposedState(pending);
  if (!proposed) return { ...pending, narrative };
  const log = [...proposed.log];
  const lastGmIdx = [...log].map((e, i) => ({ e, i })).reverse().find((x) => x.e.role === 'gm')?.i;
  if (lastGmIdx != null && lastGmIdx >= 0) {
    log[lastGmIdx] = { ...log[lastGmIdx], content: narrative };
  }
  return {
    ...pending,
    narrative,
    proposedState: { ...proposed, log, pendingTurn: null },
  };
}

export function ensureLocationSheet(state: GameState): LocationSheet {
  if (state.locationSheet?.name) return state.locationSheet;
  return {
    name: state.currentLocation || 'Unknown',
    climate: '',
    timeOfDay: '',
    interactables: [],
    exits: [],
    presentNpcIds: [],
  };
}

export function touchLocationSheet(state: GameState, locationName?: string): LocationSheet {
  const base = ensureLocationSheet(state);
  if (!locationName || locationName === base.name) return base;
  return {
    ...base,
    name: locationName,
    interactables: [],
    exits: [],
    presentNpcIds: [],
  };
}
