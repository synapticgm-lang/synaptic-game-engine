/**
 * T10SM1 single-writer allow-lists (ratchet: may only shrink).
 * Stage 0 = today's AST writers. Stage 1 shrinks death fields. Stage 2 shrinks presence.
 */

export const PRESENCE_FIELDS = [
  'present',
  'crowd',
  'anonymousRoles',
  'leftBehind',
  'shouldExit',
  'exitReason',
] as const;

export const DEATH_FIELDS = ['deathSaves', 'dead', 'playPhase'] as const;

export const GUARDED_FIELDS = [...PRESENCE_FIELDS, ...DEATH_FIELDS] as const;

export type GuardedField = (typeof GUARDED_FIELDS)[number];

export const ALLOW_LISTS: Record<GuardedField, readonly string[]> = {
  // Stage 2 shrinks toward presentAuthority.ts only.
  // Fix 0: drop pure-copy sites (arcDirector/tagTrigger `present: prev?.present ?? []`
  // before `...prev`) — scanner ignores same-field stateish reads (+ optional ??).
  present: [
    'src/game/combatAuthority.ts',
    'src/game/crowdAuthority.ts',
    'src/game/encounterTerminalFsm.ts',
    'src/game/errorRepairWarden.ts',
    'src/game/fateAutoplay.ts',
    'src/game/hereSpot.ts',
    'src/game/narrativeHarvest.ts',
    'src/game/npcMemory.ts',
    'src/game/npcRecords.ts',
    'src/game/openThreads.ts',
    'src/game/openingPin.ts',
    'src/game/openingPointerCard.ts',
    'src/game/presentAuthority.ts',
    'src/game/saveMigration.ts',
    'src/game/sceneFacts.ts',
    'src/game/stealParley.ts',
    'src/game/tabletopQuestProgress.ts',
    'src/game/timeline.ts',
    'src/game/travelJourney.ts',
    'src/game/useGame.ts',
    'src/game/vignetteLock.ts',
  ],
  crowd: [
    'src/game/crowdAuthority.ts',
    'src/game/fateAutoplay.ts',
    'src/game/openingPointerCard.ts',
    'src/game/sceneFacts.ts',
    'src/game/travelJourney.ts',
  ],
  anonymousRoles: ['src/game/closedScenePerson.ts', 'src/game/presentAuthority.ts'],
  leftBehind: ['src/game/presentAuthority.ts'],
  shouldExit: [
    'src/game/encounterTerminalFsm.ts',
    'src/game/npcMemory.ts',
    'src/game/openThreads.ts',
  ],
  exitReason: [
    'src/game/encounterTerminalFsm.ts',
    'src/game/npcLifecycleFsm.ts',
    'src/game/npcMemory.ts',
    'src/game/openThreads.ts',
  ],
  // Stage 1: sole deathSaves writer.
  deathSaves: ['src/game/rules/death.ts'],
  // Stage 1: no assign/patch of bare `dead` (nested deathSaves.dead lives under deathSaves writes).
  dead: [],
  // Stage 1: sole playPhase writer (death.ts delegates; endings/migration call setPlayPhase).
  playPhase: ['src/game/playPhase.ts'],
};
