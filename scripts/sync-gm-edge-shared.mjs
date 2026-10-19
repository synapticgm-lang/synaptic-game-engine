/**
 * Sync GM prompt modules into supabase/functions/_shared/gm for the edge runtime.
 * Run after editing prompt sources: node scripts/sync-gm-edge-shared.mjs
 *   node scripts/sync-gm-edge-shared.mjs completedEventPacket.ts writerInfoLayer.ts   (copy only those)
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
  'craftBookCompiler.ts',
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
  'introductionPermit.ts',
  'campaignContract.ts',
  'openingPointerCard.ts',
  'gmVoiceProfile.ts',
  'fluidProseRails.ts',
  'craftKeepers.ts',
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
  'closedScenePerson.ts',
  'pyoaBranchLedger.ts',
  'dungeonMobLedger.ts',
  'padUniverse.ts',
  'beatContract.ts',
  'completedEventPacket.ts',
  'systemHousing.ts',
  'semanticLoopDetector.ts',
  'beatFingerprint.ts',
  'ledgerNounObey.ts',
  'outdoorHubs.ts',
  'hubEncounters.ts',
  'pyoaSpine.ts',
  'npcRecords.ts',
  'hereSpot.ts',
  'npcRoleRegistry.ts',
  'npcLifecycleFsm.ts',
  'writerInfoLayer.ts',
  'litrpgClassNames.ts',
  'openRouterChat.ts',
  'modelIds.ts',
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
  'engineResult.ts',
  'checkMath.ts',
];

function rewriteImports(source, file) {
  let next = source;
  if (file === 'types.ts') {
    // Edge inlines the anchor union; full comicScript stays client-only (q31-ECR1 ruleCount).
    next = next.replace(
      /import type \{ ComicTextAnchor \} from ['"]\.\.\/types\/comicScript['"];?\r?\n/,
      "type ComicTextAnchor =\n  | 'top-left'\n  | 'top-right'\n  | 'bottom-left'\n  | 'bottom-right'\n  | 'bottom-center';\n"
    );
  }
  next = next
    .replace(/from\s+['"]@\/data\/campaigns\/types['"]/g, "from './campaignBibleTypes.ts'")
    .replace(/import\(['"]@\/data\/campaigns\/types['"]\)/g, "import('./campaignBibleTypes.ts')")
    .replace(/from\s+['"]@\/data\/worldOutlines['"]/g, "from './worldOutlines.ts'")
    .replace(/from\s+['"]@\/utils\/filterLogic['"]/g, "from './filterLogic.ts'")
    .replace(/from\s+['"]@\/game\/types['"]/g, "from './types.ts'")
    .replace(/from\s+['"]@\/game\/archetypes['"]/g, "from './archetypes.ts'");
  const rel = file.includes('/') ? /from\s+['"](\.{1,2}\/[^'"]+)['"]/g : /from\s+['"](\.\/[^'"]+)['"]/g;
  return next.replace(rel, (_m, spec) => {
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
  if (file === 'completedEventPacket.ts') {
    // SRD stat blocks stay on the client. Speech is already on the encounter when the edge rebuilds a packet.
    next = next.replace(
      /^import \{ foeCanSpeak \} from '\.\/rules\/srdMonsters';\r?\n/m,
      "function foeCanSpeak(enc: { canSpeak?: boolean } | null | undefined): boolean { return enc?.canSpeak === true; }\n"
    );
  }
  if (file === 'checkMath.ts') {
    // Edge only needs the PlayerCheckResult type. The tabletop exploration rules (DC ladder, light, pace) pull the
    // SRD sheet builder and the mode profile, so on the edge they throw if a check ever runs there.
    next = next
      .replace(
        /^import \{ ladderDc[^\n]*'\.\/rules\/exploration';\r?\n/m,
        "type TaskKind = string;\ntype TaskRung = string;\nconst edgeOnly = (..._args: unknown[]): never => { throw new Error('tabletop exploration rules run on the client'); };\nconst ladderDc = edgeOnly, lightNote = edgeOnly, sceneLight = edgeOnly, sheetBurden = edgeOnly, sightCheck = edgeOnly, taskRung = edgeOnly;\n"
      )
      .replace(/^import \{ paceCheckAdv[^\n]*'\.\/rules\/travelPace';\r?\n/m, 'const paceCheckAdv = edgeOnly, travelPaceOf = edgeOnly;\n')
      .replace(/^import \{ modeProfile \} from '\.\/rules\/modeProfile';\r?\n/m, 'const modeProfile = edgeOnly;\n')
      // The skill library JSON lives on the client; edge checks have no named-skill bonus.
      .replace(/^import \{ namedSkillCheckMod \} from '\.\/rules\/librarySkills';\r?\n/m, 'const namedSkillCheckMod = (..._args: unknown[]): null => null;\n')
      .replace(/^import \{ titleCheckMod \} from '\.\/rules\/titles';\r?\n/m, 'const titleCheckMod = (..._args: unknown[]): null => null;\n')
      .replace(/^import \{ toolProficiencies \} from '\.\/tabletop\/characterBuild';\r?\n/m, 'const toolProficiencies = (..._args: unknown[]): string[] => [];\n')
      .replace(/function sheetExtras\(state: GameState\): boolean \{\r?\n\s*return [^\n]*\r?\n\}/, 'function sheetExtras(_state: GameState): boolean {\n  return false;\n}');
  }
  return rewriteImports(next, file);
}

/** Every edge copy: dest name → src path. */
const BASE_ENTRIES = [
  ...FILES.map((file) => ({ dest: file, src: path.join(root, 'src', 'game', file) })),
  { dest: 'campaignBibleTypes.ts', src: path.join(root, 'src', 'data', 'campaigns', 'types.ts') },
  { dest: 'filterLogic.ts', src: path.join(root, 'src', 'utils', 'filterLogic.ts') },
  { dest: 'worldOutlines.ts', src: path.join(root, 'src', 'data', 'worldOutlines.ts') },
];

// Import tree (John 17 Oct 15:56; ship-harness root fix). Copying a fixed list let a synced copy import a module the edge
// never had (G-O2: infoSheet.ts -> questRoutes.ts, bundle failed on deploy). Now every copy this run writes is followed
// through its VALUE imports (not `import type` / `export type`, read from its edge source so stubbed client-only imports
// are not followed); each reachable module that is not already on the edge is copied too, at the same path relative to
// src/game, and followed in turn. A reachable module outside src/game, or with no source, is an error (exit 2) because
// the edge could not bundle it. Copies already on the edge and not re-synced keep their current, deployed imports.
const gameDir = path.join(root, 'src', 'game');
const VALUE_IMPORT = /(?:^|\n)[ \t]*(?:import|export)\s+(?!type\b)(?:[^'";]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;
function withImportTree(start) {
  const out = [...start]; const seen = new Set(out.map((e) => e.dest)); const errors = [];
  for (let k = 0; k < out.length; k++) {
    const e = out[k];
    for (const m of edgeSource(e.dest, e.src).matchAll(VALUE_IMPORT)) {
      const dest = path.posix.normalize(path.posix.join(path.posix.dirname(e.dest), m[1].replace(/\.ts$/, ''))) + '.ts';
      if (seen.has(dest) || fs.existsSync(path.join(destDir, dest))) continue;
      seen.add(dest);
      if (dest.startsWith('../')) { errors.push(`${e.dest} imports ${m[1]} (outside src/game)`); continue; }
      const known = BASE_ENTRIES.find((b) => b.dest === dest);
      const src = known ? known.src : path.join(gameDir, ...dest.split('/'));
      if (!fs.existsSync(src)) { errors.push(`${e.dest} imports ${m[1]}: no source ${path.relative(root, src)}`); continue; }
      out.push({ dest, src, via: e.dest });
    }
  }
  return { out, errors };
}
const ENTRIES = BASE_ENTRIES;

const args = process.argv.slice(2);
const check = args.includes('--check');
const named = args.filter((a) => a !== '--check').map((a) => a.replace(/\\/g, '/').replace(/^.*_shared\/gm\//, ''));
const unknown = named.filter((n) => !ENTRIES.some((e) => e.dest === n || path.posix.basename(e.dest) === n));
if (unknown.length) {
  console.error('Not on the edge list:', unknown.join(', '));
  process.exit(2);
}
const picked = named.length ? ENTRIES.filter((e) => named.includes(e.dest) || named.includes(path.posix.basename(e.dest))) : ENTRIES;

if (check) {
  const differs = picked.filter((e) => {
    const destPath = path.join(destDir, e.dest);
    if (!fs.existsSync(destPath)) return true;
    return fs.readFileSync(destPath, 'utf8') !== edgeSource(e.dest, e.src);
  });
  // Modules the drifted copies would newly need once synced are listed as missing (via the copy that imports them).
  const tree = withImportTree(differs);
  for (const err of tree.errors) console.log('error', err);
  const drift = tree.out;
  for (const e of drift) console.log(fs.existsSync(path.join(destDir, e.dest)) ? 'differs' : 'missing', e.dest, e.via ? `(imported by ${e.via})` : '');
  if (tree.errors.length) process.exit(2);
  console.log(drift.length ? `${drift.length} edge cop${drift.length === 1 ? 'y differs' : 'ies differ'}` : 'edge copies match');
  process.exit(drift.length ? 1 : 0);
}

fs.mkdirSync(destDir, { recursive: true });
const tree = withImportTree(picked);
if (tree.errors.length) { console.error('edge import tree errors (nothing written):\n  ' + tree.errors.join('\n  ')); process.exit(2); }
for (const e of tree.out) {
  fs.mkdirSync(path.dirname(path.join(destDir, e.dest)), { recursive: true });
  fs.writeFileSync(path.join(destDir, e.dest), edgeSource(e.dest, e.src), 'utf8');
  console.log('synced', e.dest, e.via ? `(imported by ${e.via})` : '');
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

