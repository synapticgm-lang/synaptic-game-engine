/**
 * Sync GM prompt modules into supabase/functions/_shared/gm for the edge runtime.
 * Run after editing prompt sources: node scripts/sync-gm-edge-shared.mjs
 *   node scripts/sync-gm-edge-shared.mjs situationPacket.ts writerInfoLayer.ts   (copy only those)
 *   node scripts/sync-gm-edge-shared.mjs --check [files…]   (list edge copies that differ; exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir = path.join(root, 'supabase', 'functions', '_shared', 'gm');

const FILES = [
  'types.ts',
  'systemPrompt.ts',
  'sceneContextTail.ts',
  'masterPrompt.ts',
  'archetypes.ts',
  'inventory.ts',
  'panelBudget.ts',
  'situationPacket.ts',
  'craftBookCompiler.ts',
  'bindingConstraints.ts',
  'sceneFacts.ts',
  'crowdAuthority.ts',
  'hookLock.ts',
  'vignetteLock.ts',
  'travelAuthority.ts',
  'oneCameraFight.ts',
  'slotGlue.ts',
  'neverCast.ts',
  'closedFactLedger.ts',
  'chromeAuthority.ts',
  'pcNameAuthority.ts',
  'narrativePov.ts',
  'combatAuthority.ts',
  'encounterTerminalFsm.ts',
  'sceneManifest.ts',
  'introductionPermit.ts',
  'campaignContract.ts',
  'openingPointerCard.ts',
  'gmVoiceProfile.ts',
  'fluidProseRails.ts',
  'craftKeepers.ts',
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
  'entityRegistry.ts',
  'entityCast.ts',
  'closedScenePerson.ts',
  'pyoaBranchLedger.ts',
  'proseWarden.ts',
  'dungeonLifecycle.ts',
  'dungeonMobLedger.ts',
  'padUniverse.ts',
  'beatContract.ts',
  'completedEventPacket.ts',
  'systemHousing.ts',
  'semanticLoopDetector.ts',
  'beatFingerprint.ts',
  'ledgerNounObey.ts',
  'presentAuthority.ts',
  'outdoorHubs.ts',
  'hubEncounters.ts',
  'pyoaSpine.ts',
  'npcRecords.ts',
  'hereSpot.ts',
  'npcRoleRegistry.ts',
  'npcLifecycleFsm.ts',
  'writerInfoLayer.ts',
  'openRouterChat.ts',
  'proseSentences.ts',
  'skillRanks.ts',
  'floorPlan.ts',
  'placeTemplates.ts',
  'ledgerCombat.ts',
  'checkRules.ts',
  'npcRelationships.ts',
  'npcMemory.ts',
  'manusTopicBanks.ts',
  'diegeticFallbacks.ts',
  'intentParser.ts',
  'suggestionValidation.ts',
  'searchContinuity.ts',
  'infoSheet.ts',
  'checkMath.ts',
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

function edgeSource(file, srcPath) {
  const raw = fs.readFileSync(srcPath, 'utf8');
  let next = raw;
  if (file === 'systemPrompt.ts') {
    next = next
      .replace(/^export \{ KID_MODE_RULES \} from '\.\/contentModeRules';\r?\n/m, '')
      .replace(/^export \{ buildImagePromptModifier \} from '\.\/imagePromptModifier';\r?\n/m, '');
  }
  if (file === 'pyoaSpine.ts') {
    // Authored Umbra book lives on the client. Edge only needs Thornferry SNAPSHOT/TURN JOB.
    next = next.replace(
      /import umbraBook from ['"]@\/data\/pyoa\/umbraBook\.json['"];\r?\n/,
      "const umbraBook = { startId: 'up-bell-tower', nodes: [] };\n"
    );
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
  return rewriteImports(next, file);
}

/** Every edge copy: dest name → src path. */
const ENTRIES = [
  ...FILES.map((file) => ({ dest: file, src: path.join(root, 'src', 'game', file) })),
  { dest: 'comicScript.ts', src: path.join(root, 'src', 'types', 'comicScript.ts') },
  { dest: 'campaignBibleTypes.ts', src: path.join(root, 'src', 'data', 'campaigns', 'types.ts') },
  { dest: 'filterLogic.ts', src: path.join(root, 'src', 'utils', 'filterLogic.ts') },
  { dest: 'worldOutlines.ts', src: path.join(root, 'src', 'data', 'worldOutlines.ts') },
];

const args = process.argv.slice(2);
const check = args.includes('--check');
const named = args.filter((a) => a !== '--check').map((a) => path.basename(a));
const unknown = named.filter((n) => !ENTRIES.some((e) => e.dest === n));
if (unknown.length) {
  console.error('Not on the edge list:', unknown.join(', '));
  process.exit(2);
}
const picked = named.length ? ENTRIES.filter((e) => named.includes(e.dest)) : ENTRIES;

if (check) {
  const drift = picked.filter((e) => {
    const destPath = path.join(destDir, e.dest);
    if (!fs.existsSync(destPath)) return true;
    return fs.readFileSync(destPath, 'utf8') !== edgeSource(e.dest, e.src);
  });
  for (const e of drift) console.log('differs', e.dest);
  console.log(drift.length ? `${drift.length} edge cop${drift.length === 1 ? 'y differs' : 'ies differ'}` : 'edge copies match');
  process.exit(drift.length ? 1 : 0);
}

fs.mkdirSync(destDir, { recursive: true });
for (const e of picked) {
  fs.writeFileSync(path.join(destDir, e.dest), edgeSource(e.dest, e.src), 'utf8');
  console.log('synced', e.dest);
}
if (named.length) {
  console.log('Done →', destDir);
  process.exit(0);
}

fs.writeFileSync(
  path.join(destDir, 'README.md'),
  `# GM prompt shared modules (edge)

Auto-synced from \`src/game\` via \`node scripts/sync-gm-edge-shared.mjs\`.
Do not edit these copies by hand â€” change the src files and re-sync.
`,
  'utf8'
);

console.log('Done â†’', destDir);

