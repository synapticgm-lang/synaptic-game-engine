/**
 * T10SM1 single-writer allow-lists (ratchet: may only shrink).
 * Stage 0 = today's AST writers. Stages 1–2 shrink toward one owner per field.
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
  present: [
    'src/game/arcDirector.ts',
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
    'src/game/tagTrigger.ts',
    'src/game/timeline.ts',
    'src/game/travelJourney.ts',
    'src/game/useGame.ts',
    'src/game/vignetteLock.ts',
  ],
  crowd: [
    'src/game/arcDirector.ts',
    'src/game/crowdAuthority.ts',
    'src/game/fateAutoplay.ts',
    'src/game/openingPointerCard.ts',
    'src/game/sceneFacts.ts',
    'src/game/tagTrigger.ts',
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
  deathSaves: [
    'src/game/fateAutoplay.ts',
    'src/game/rules/death.ts',
    'src/game/tabletop/roundFight.ts',
  ],
  // Local DeathSaveState.dead = true inside rollDeathSave; Stage 1 routes PC death through death.ts.
  dead: ['src/game/rules/roundCombat.ts'],
  playPhase: [
    'src/game/mainQuestEnd.ts',
    'src/game/playPhase.ts',
    'src/game/pyoaEndingGates.ts',
    'src/game/pyoaSpine.ts',
    'src/game/rules/death.ts',
    'src/game/saveMigration.ts',
    'src/game/useGame.ts',
  ],
};
