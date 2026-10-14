/**
 * Main quest complete (story RPG and LitRPG; John, 14 Oct). When a main quest finishes, the player gets an epilogue
 * and then a popup: "You have completed the main quest." with "One more turn" (carry on in the open world, save
 * kept) or "Finish and start a new game". The epilogue is engine facts only: the ending the shared gates would pick
 * (story RPG), the last choices from the journal, who is still with the player, and the LitRPG System's totals.
 */
import type { GameState, Quest } from './types';
import type { BibleId } from './pyoaTypes';
import { finishedMainQuest } from './rpgEndings';
import { selectBestEnding } from './pyoaEndingGates';
import { commitRpgEnding } from './storyRpgProgress';
import { recentChoices } from './choiceJournal';
import { originLine } from './rules/rpgOrigin';
import { approvalBandLabel, recruitedCompanions } from './rules/companions';
import { classDisplayName } from './rules/characterClass';

export const MAIN_QUEST_DONE_TITLE = 'You have completed the main quest.';
export const ONE_MORE_TURN = 'One more turn';
export const FINISH_AND_NEW_GAME = 'Finish and start a new game';

export interface MainQuestEndPrompt {
  questId: string;
  questName: string;
  epilogue: string[];
}

function rpgEpilogue(state: GameState, quest: Quest): string[] {
  const lines: string[] = [];
  const ending = selectBestEnding((state.campaignBibleId ?? '') as BibleId, state);
  lines.push(ending ? ending.terminalText : `You saw ${quest.name} through.`);
  const origin = originLine(state);
  if (origin) lines.push(origin);
  const party = recruitedCompanions(state);
  if (party.length) lines.push(`${party.map((c) => `${c.name} (${approvalBandLabel(state, c.name)})`).join(', ')} stood with you at the end.`);
  for (const c of recentChoices(state, 3)) lines.push(c.text);
  return lines;
}

function litrpgEpilogue(state: GameState, quest: Quest): string[] {
  const c = state.character;
  const cls = classDisplayName(state);
  const lines = [`[System] Main quest complete: ${quest.name}.`, `[System] Level ${c?.level ?? 1}${cls ? ` ${cls}` : ''}.`];
  if (c?.activeTitle) lines.push(`[System] Title: ${c.activeTitle}.`);
  const floors = state.litrpgFloors?.cleared ?? 0;
  if (floors) lines.push(`[System] Floors cleared: ${floors}.`);
  const party = recruitedCompanions(state);
  if (party.length) lines.push(`[System] Party: ${party.map((p) => p.name).join(', ')}.`);
  return lines;
}

/** The finished main quest the popup is about; the LitRPG tutorial quest (First Blood) is not the main quest. */
function finishedStoryQuest(state: GameState): Quest | null {
  const q = finishedMainQuest(state);
  return q && !/^tutorial-/.test(q.id) ? q : null;
}

/** The popup to show now, or null (other modes, nothing finished, already answered, run over). */
export function mainQuestEndPrompt(state: GameState | null | undefined): MainQuestEndPrompt | null {
  if (!state || (state.engineMode !== 'rpg' && state.engineMode !== 'litrpg')) return null;
  if (state.playPhase === 'ended' || state.playPhase === 'down' || state.activeEncounter || state.roundCombat) return null;
  const quest = finishedStoryQuest(state);
  if (!quest || (state.mainQuestEndSeen ?? []).includes(quest.id)) return null;
  return {
    questId: quest.id,
    questName: quest.name,
    epilogue: state.engineMode === 'rpg' ? rpgEpilogue(state, quest) : litrpgEpilogue(state, quest),
  };
}

function seen(state: GameState, questId: string): GameState {
  return { ...state, mainQuestEndSeen: Array.from(new Set([...(state.mainQuestEndSeen ?? []), questId])) };
}

/** "One more turn": the run carries on in the open world; the popup does not come back for this quest. */
export function keepPlayingAfterMainQuest(state: GameState): GameState {
  const p = mainQuestEndPrompt(state);
  return p ? seen(state, p.questId) : state;
}

/**
 * "Finish and start a new game": story RPG commits its ending through the shared gates (as the ending chip does);
 * otherwise the run ends. The caller then opens New Game; this save stays as the ended archive.
 */
export function finishMainQuest(state: GameState): { state: GameState; receipts: string[] } {
  const p = mainQuestEndPrompt(state);
  if (!p) return { state, receipts: [] };
  const marked = seen(state, p.questId);
  const ended = marked.engineMode === 'rpg' ? commitRpgEnding(marked) : null;
  if (ended) return ended;
  return { state: { ...marked, playPhase: 'ended' }, receipts: [`Ending: ${p.questName} — the main quest is complete.`] };
}
