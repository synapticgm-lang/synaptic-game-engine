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
  // Stage 2: sole presence AST owner — call sites use the API; writes live here only.
  present: ['src/game/presentAuthority.ts'],
  crowd: ['src/game/presentAuthority.ts'],
  anonymousRoles: ['src/game/presentAuthority.ts'],
  leftBehind: ['src/game/presentAuthority.ts'],
  shouldExit: ['src/game/presentAuthority.ts'],
  exitReason: ['src/game/presentAuthority.ts'],
  // Stage 1: sole deathSaves writer.
  deathSaves: ['src/game/rules/death.ts'],
  // Stage 1: no assign/patch of bare `dead` (nested deathSaves.dead lives under deathSaves writes).
  dead: [],
  // Stage 1: sole playPhase writer (death.ts delegates; endings/migration call setPlayPhase).
  playPhase: ['src/game/playPhase.ts'],
};
