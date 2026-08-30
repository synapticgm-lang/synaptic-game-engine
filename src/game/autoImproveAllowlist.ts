/**
 * Files the Fate auto-improve loop may edit without human approval.
 * Keep tight — continuity/craft owners only.
 */
export const AUTO_IMPROVE_PATCH_ALLOWLIST = [
  'src/game/proseWarden.ts',
  'src/game/craftBookCompiler.ts',
  'src/game/chromeAuthority.ts',
  'src/game/crowdAuthority.ts',
  'src/game/pcNameAuthority.ts',
  'src/game/choiceCompiler.ts',
  'src/game/choicePipeline.ts',
  'src/game/hookLock.ts',
  'src/game/openingEstablishment.ts',
  'src/game/semanticLoopDetector.ts',
  'src/game/optionDiversityContract.ts',
  'src/game/qualityGovernance.ts',
] as const;

export type AutoImprovePatchPath = (typeof AUTO_IMPROVE_PATCH_ALLOWLIST)[number];
