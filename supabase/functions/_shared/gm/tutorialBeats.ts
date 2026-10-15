import type { GameState, Quest, TutorialProgress } from './types.ts';
import { isExplorableDungeon } from './placeAuthority.ts';

/** First-session LitRPG beat sheet (Pack 3). */
export type TutorialBeatId =
  | 'awakening'
  | 'lookAround'
  | 'firstThreat'
  | 'stickyFail'
  | 'firstLoot'
  | 'firstQuest'
  | 'firstRest'
  | 'firstBoss';

export function emptyTutorialProgress(): TutorialProgress {
  return {
    completed: {},
    firstChestUncommonBiasPending: true,
    fullStatusUnlocked: false,
    stickyFailScheduled: false,
  };
}

export function ensureTutorialProgress(state: GameState): TutorialProgress {
  return state.tutorialProgress ?? emptyTutorialProgress();
}

function mark(
  progress: TutorialProgress,
  beat: TutorialBeatId,
  extra?: Partial<TutorialProgress>
): TutorialProgress {
  return {
    ...progress,
    ...extra,
    completed: { ...progress.completed, [beat]: true },
  };
}

/** Advance beats from turn outcomes (code-owned). */
export function advanceTutorialBeats(
  state: GameState,
  opts: {
    turn: number;
    playerAction: string;
    narrative: string;
    systemLog: string[];
    checkFailed?: boolean;
    ledgerChanged?: boolean;
    critFail?: boolean;
    gainedLoot?: boolean;
    quests?: Quest[];
    bossCleared?: boolean;
    rested?: boolean;
    leveled?: boolean;
  }
): { progress: TutorialProgress; systemNotes: string[] } {
  let progress = ensureTutorialProgress(state);
  const notes: string[] = [];
  const blob = `${opts.playerAction}\n${opts.narrative}\n${opts.systemLog.join('\n')}`.toLowerCase();

  if (!progress.completed.awakening && (opts.turn >= 1 || state.openingEstablishment?.complete)) {
    progress = mark(progress, 'awakening');
  }

  if (
    !progress.completed.lookAround &&
    /\b(look|survey|scan|examine|inspect|where am i|take stock)\b/i.test(opts.playerAction)
  ) {
    progress = mark(progress, 'lookAround');
  }

  if (
    !progress.completed.firstThreat &&
    (state.activeEncounter || /\b(enemy|hostile|creature|combat|attack)\b/i.test(blob))
  ) {
    progress = mark(progress, 'firstThreat');
  }

  if (
    !progress.completed.stickyFail &&
    (opts.critFail || (opts.checkFailed && opts.ledgerChanged && opts.turn >= 5 && opts.turn <= 12))
  ) {
    progress = mark(progress, 'stickyFail', { stickyFailScheduled: true });
    notes.push('Tutorial: first sticky failure registered — wounds/conditions persist.');
  }

  if (opts.gainedLoot && !progress.completed.firstLoot) {
    progress = mark(progress, 'firstLoot', { firstChestUncommonBiasPending: false });
  } else if (opts.gainedLoot && progress.firstChestUncommonBiasPending) {
    progress = { ...progress, firstChestUncommonBiasPending: false };
  }

  const revealedQuest = (opts.quests ?? state.quests).find(
    (q) => q.revealed && q.status === 'active' && q.type === 'main'
  );
  if (!progress.completed.firstQuest && revealedQuest && opts.turn >= 6) {
    progress = mark(progress, 'firstQuest');
  }

  if (opts.rested || /\b(rest|camp|sleep|recover|meditat)/i.test(opts.playerAction)) {
    progress = mark(progress, 'firstRest', { fullStatusUnlocked: true });
  }

  if (opts.bossCleared) {
    progress = mark(progress, 'firstBoss', { fullStatusUnlocked: true });
  }

  if (opts.leveled) {
    progress = { ...progress, fullStatusUnlocked: true };
  }

  // Soft unlock full sheet by turn 20 even if rest skipped
  if (!progress.fullStatusUnlocked && opts.turn >= 20) {
    progress = { ...progress, fullStatusUnlocked: true };
  }

  return { progress, systemNotes: notes };
}

/** Ensure a tutorial spine quest exists by turn 8–12. */
export function ensureTutorialQuest(state: GameState, turn: number): Quest[] {
  const quests = [...(state.quests ?? [])];
  if (turn < 8 || turn > 16) return quests;
  const hasRevealed = quests.some((q) => q.revealed && q.status === 'active');
  if (hasRevealed) return quests;
  if (quests.some((q) => q.id === 'tutorial-first-blood' || /first blood/i.test(q.name))) return quests;
  quests.push({
    id: 'tutorial-first-blood',
    name: 'First Blood',
    description:
      'A nearby convenience store is a Tier 1 micro-dungeon. Clear the rooms, the mini-boss, and claim the Foundation Core.',
    status: 'active',
    type: 'main',
    revealed: true,
    revealedTurn: turn,
    activatedTurn: turn,
    dangerTier: 1,
    objectives: [
      { id: 'enter', description: 'Enter the convenience store micro-dungeon', completed: isExplorableDungeon(state.activeDungeon) },
      { id: 'mobs', description: 'Defeat the dungeon mobs (estimated 4-6 Tier 1 creatures)', completed: false },
      { id: 'boss', description: 'Defeat the mini-boss: [Corrupted Stockboy] (Level 3)', completed: false },
      { id: 'core', description: 'Claim the dungeon drop: [Foundation Core]', completed: false },
    ],
  });
  return quests;
}
