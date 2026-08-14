import type { GameState, Quest, TutorialProgress } from './types';

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
    (opts.critFail || (opts.checkFailed && opts.turn >= 5 && opts.turn <= 12))
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

/**
 * GM mandate for the next missing beat. Empty when tutorial complete or late game.
 */
export function formatTutorialBeatMandate(state: GameState): string {
  const progress = ensureTutorialProgress(state);
  const turn = state.turn;
  if (turn > 40 && progress.completed.firstBoss) return '';

  const lines: string[] = [
    'TUTORIAL BEAT SHEET (code pacing — do not dump a full status sheet early):',
  ];

  if (!progress.completed.awakening) {
    lines.push('- Next focus: Awakening / registration moment (minimal sheet: name, L0/1, HP — not full attrs).');
  } else if (!progress.completed.lookAround && turn < 6) {
    lines.push('- Next focus: Establish the location (look-around). Do not spawn a dungeon boss yet.');
  } else if (!progress.completed.firstThreat && turn >= 3 && turn <= 10) {
    lines.push('- Next focus: First threat + first code-owned roll when fiction allows.');
  } else if (!progress.completed.stickyFail && turn >= 5 && turn <= 10) {
    lines.push(
      '- Next focus: Allow a fail that sticks (wound/condition) if the player presses a risky action. Do not soft-undo it.'
    );
  } else if (!progress.completed.firstLoot && turn >= 5) {
    lines.push('- Next focus: First loot opportunity when they search/open a grounded cache.');
  } else if (!progress.completed.firstQuest && turn >= 7 && turn <= 14) {
    lines.push(
      '- Next focus: Reveal the starter tutorial quest (reach exit / clear site) via story + <quest-add> if not already active+revealed.'
    );
  } else if (!progress.completed.firstRest && turn >= 10) {
    lines.push('- Optional: first rest / full status unlock when they camp or recover.');
  } else if (!progress.completed.firstBoss && state.activeDungeon?.blueprintId !== 'local-area') {
    lines.push('- Tutorial dungeon: boss remains at the seeded boss node — do not invent a second boss.');
  } else {
    return '';
  }

  if (!progress.fullStatusUnlocked) {
    lines.push(
      '- PROGRESSIVE STATUS: Do not dump full attribute blocks in System chrome yet. Minimal vitals only until rest/level/boss.'
    );
  }

  return lines.join('\n');
}

/** Ensure a tutorial spine quest exists by turn 8–12. */
export function ensureTutorialQuest(state: GameState, turn: number): Quest[] {
  const quests = [...(state.quests ?? [])];
  if (turn < 8 || turn > 16) return quests;
  const hasRevealed = quests.some((q) => q.revealed && (q.status === 'active' || q.status === 'hidden'));
  if (hasRevealed) {
    return quests.map((q) => {
      if (q.status === 'hidden' && turn >= 8 && (q.type === 'main' || !q.type)) {
        return {
          ...q,
          status: 'active' as const,
          revealed: true,
          revealedTurn: turn,
          activatedTurn: turn,
        };
      }
      return q;
    });
  }
  if (quests.some((q) => q.id === 'tutorial-first-blood')) return quests;
  quests.push({
    id: 'tutorial-first-blood',
    name: 'First Blood',
    description: 'Survive your first Integrated site: scout, loot once, and reach the exit.',
    status: 'active',
    type: 'main',
    revealed: true,
    revealedTurn: turn,
    activatedTurn: turn,
    dangerTier: 1,
    objectives: [
      { id: 'scout', description: 'Enter and scout the site', completed: !!state.activeDungeon },
      { id: 'loot', description: 'Claim one cache', completed: false },
      { id: 'exit', description: 'Reach the exit alive', completed: false },
    ],
  });
  return quests;
}
