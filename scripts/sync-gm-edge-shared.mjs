/**
 * Sync GM prompt modules into supabase/functions/_shared/gm for the edge runtime.
 * Run after editing prompt sources: node scripts/sync-gm-edge-shared.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir = path.join(root, 'supabase', 'functions', '_shared', 'gm');

const FILES = [
  'types.ts',
  'systemPrompt.ts',
  'archetypes.ts',
  'inventory.ts',
  'panelBudget.ts',
  'situationPacket.ts',
  'craftBookCompiler.ts',
  'bindingConstraints.ts',
  'sceneFacts.ts',
  'crowdAuthority.ts',
  'hookLock.ts',
  'travelAuthority.ts',
  'chromeAuthority.ts',
  'pcNameAuthority.ts',
  'combatAuthority.ts',
  'encounterTerminalFsm.ts',
  'sceneManifest.ts',
  'introductionPermit.ts',
  'campaignContract.ts',
  'gmVoiceProfile.ts',
  'fluidProseRails.ts',
  'folkVoiceExpectations.ts',
  'speechActRails.ts',
  'factLocks.ts',
  'locationName.ts',
  'timelineFormat.ts',
  'choiceTierRules.ts',
  'contentModeRules.ts',
  'mapEngine.ts',
  'seededRng.ts',
  'dungeonSeed.ts',
  'placeAuthority.ts',
  'placeUtils.ts',
  'places.ts',
  'campaignMemory.ts',
  'claimGrounding.ts',
  'tutorialBeats.ts',
  'maturity.ts',
  'customTabletopRules.ts',
  'locality.ts',
  'questPlay.ts',
  'mysteryCulprit.ts',
  'distributionChannel.ts',
  'contentFilterProfile.ts',
  'universalHardRails.ts',
  'kidModeSafety.ts',
  'offerOnlyAsk.ts',
  'dungeonPresence.ts',
  'campaignNsfw.ts',
  'worldMapAuthority.ts',
  'worldAtlas.ts',
  'narrativeHarvest.ts',
  'dungeonLifecycle.ts',
  'dungeonMobLedger.ts',
  'outdoorHubs.ts',
];

function rewriteImports(source, file) {
  let next = source;
  if (file === 'types.ts') {
    next = next.replace(
      /from\s+['"]\.\.\/types\/comicScript['"]/g,
      "from './comicScript.ts'"
    );
  }
  next = next
    .replace(/from\s+['"]@\/data\/campaigns\/types['"]/g, "from './campaignBibleTypes.ts'")
    .replace(/import\(['"]@\/data\/campaigns\/types['"]\)/g, "import('./campaignBibleTypes.ts')")
    .replace(/from\s+['"]@\/data\/worldOutlines['"]/g, "from './worldOutlines.ts'")
    .replace(/from\s+['"]@\/utils\/filterLogic['"]/g, "from './filterLogic.ts'")
    .replace(/from\s+['"]@\/game\/types['"]/g, "from './types.ts'")
    .replace(/from\s+['"]@\/game\/archetypes['"]/g, "from './archetypes.ts'");
  return next.replace(/from\s+['"](\.\/[^'"]+)['"]/g, (_m, spec) => {
    const withExt = spec.endsWith('.ts') ? spec : `${spec}.ts`;
    return `from '${withExt}'`;
  });
}

fs.mkdirSync(destDir, { recursive: true });

for (const file of FILES) {
  const srcPath = path.join(root, 'src', 'game', file);
  const raw = fs.readFileSync(srcPath, 'utf8');
  let next = raw;
  if (file === 'systemPrompt.ts') {
    next = next
      .replace(/^export \{ KID_MODE_RULES \} from '\.\/contentModeRules';\r?\n/m, '')
      .replace(/^export \{ buildImagePromptModifier \} from '\.\/imagePromptModifier';\r?\n/m, '');
  }
  if (file === 'situationPacket.ts') {
    // sandboxXp pulls parser/faction graph; edge only needs look/wait for BEAT DELTA.
    next = next
      .replace(/import \{ isLookAroundAction \} from '\.\/sandboxXp';\r?\n/, '')
      .replace(
        /lastPlayer && \(isLookAroundAction\(lastPlayer\) \|\| \/\\bwait\\b\/i\.test\(lastPlayer\)\)/,
        "lastPlayer && /\\b(look around|examine the (?:area|room|surroundings)|wait)\\b/i.test(lastPlayer)"
      );
  }
  fs.writeFileSync(path.join(destDir, file), rewriteImports(next, file), 'utf8');
  console.log('synced', file);
}

{
  const srcPath = path.join(root, 'src', 'types', 'comicScript.ts');
  const raw = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(path.join(destDir, 'comicScript.ts'), rewriteImports(raw, 'comicScript.ts'), 'utf8');
  console.log('synced comicScript.ts');
}

{
  const srcPath = path.join(root, 'src', 'data', 'campaigns', 'types.ts');
  const raw = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(path.join(destDir, 'campaignBibleTypes.ts'), rewriteImports(raw, 'campaignBibleTypes.ts'), 'utf8');
  console.log('synced campaignBibleTypes.ts');
}

{
  const srcPath = path.join(root, 'src', 'utils', 'filterLogic.ts');
  const raw = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(path.join(destDir, 'filterLogic.ts'), rewriteImports(raw, 'filterLogic.ts'), 'utf8');
  console.log('synced filterLogic.ts');
}

{
  const srcPath = path.join(root, 'src', 'data', 'worldOutlines.ts');
  const raw = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(path.join(destDir, 'worldOutlines.ts'), rewriteImports(raw, 'worldOutlines.ts'), 'utf8');
  console.log('synced worldOutlines.ts');
}

fs.writeFileSync(
  path.join(destDir, 'README.md'),
  `# GM prompt shared modules (edge)

Auto-synced from \`src/game\` via \`node scripts/sync-gm-edge-shared.mjs\`.
Do not edit these copies by hand — change the src files and re-sync.
`,
  'utf8'
);

console.log('Done →', destDir);
