/**
 * Sync GM modules into supabase/functions/_shared/gm for the edge runtime.
 *
 * The edge set is DERIVED from the real import graph of gm-turn (and every
 * edge function that imports _shared), not a hand-kept FILES list.
 *
 *   node scripts/sync-gm-edge-shared.mjs
 *   node scripts/sync-gm-edge-shared.mjs completedEventPacket.ts stateTx.ts
 *   node scripts/sync-gm-edge-shared.mjs --check [files…]
 *
 * --check: exit 1 on drift / missing / orphan; exit 2 on unresolvable imports;
 *          exit 0 and print "edge copies match" when clean.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir = path.join(root, 'supabase', 'functions', '_shared', 'gm');
const gameDir = path.join(root, 'src', 'game');
const dataDir = path.join(root, 'src', 'data');

/** Edge function / shared entry points that import _shared (create-checkout / stripe-webhook do not). */
const ENTRY_POINTS = [
  'supabase/functions/gm-turn/index.ts',
  'supabase/functions/_shared/playPrivileges.ts',
  'supabase/functions/generate-image/index.ts',
];

/**
 * Hand-authored edge stubs (not generated from src). Detected by header mark.
 * Prefer the stub over src so client-only trees (travelJourney → roadCamps → dungeonCard,
 * logger → debugLogger → gmProxy, openingEstablishment decks, …) stay capped.
 */
const HAND_STUB_HEADER = /Edge stub|edge stub|Edge Stub|Edge type stub|Runtime helpers stay client-only/;

/**
 * Stubs that must be replaced by a real src sync — the stub is missing runtime exports
 * the edge import graph now needs (EDGESYNC: stateTx lacked commitmentLine / openCommitmentsFor).
 */
const FORCE_SYNC_FROM_SRC = new Set(['stateTx.ts']);

/** Always keep; never compared as a synced copy. */
const HAND_AUTHORED_ALWAYS = new Set(['README.md']);

/** Edge dest → source outside src/game (alias rewrites land here). */
const ALIAS_SRC = {
  'campaignBibleTypes.ts': path.join(root, 'src', 'data', 'campaigns', 'types.ts'),
  'filterLogic.ts': path.join(root, 'src', 'utils', 'filterLogic.ts'),
  'worldOutlines.ts': path.join(root, 'src', 'data', 'worldOutlines.ts'),
};

/** JSON dest (under gm/) → absolute src; filled while rewriting a parent module. */
const jsonSrcByDest = new Map();

/**
 * Value import / export-from. Skips `import type` / `export type`.
 * Dynamic import('x') only when not a TS type query (`import('x').Type` / `typeof import('x')`).
 */
// Allow multi-line `import {\n  a,\n} from '…'` (exclude `;` so we do not span statements).
const VALUE_FROM =
  /(?:^|\n)[ \t]*(?:import|export)\s+(?!type\b)(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const TYPE_FROM =
  /(?:^|\n)[ \t]*(?:import|export)\s+type\s+(?:[^'"`;]*?\s+from\s+)['"]([^'"]+)['"]/g;
const DYN_IMPORT =
  /(?<!typeof\s)(?<![.\w])import\s*\(\s*['"]([^'"]+)['"]\s*\)(?!\s*\.)/g;

function collectSpecs(text, { includeType = false } = {}) {
  const out = [];
  const res = includeType ? [VALUE_FROM, TYPE_FROM, DYN_IMPORT] : [VALUE_FROM, DYN_IMPORT];
  for (const re of res) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) out.push(m[1]);
  }
  return out;
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function walkFiles(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (fs.statSync(abs).isDirectory()) out.push(...walkFiles(abs, rel));
    else out.push(toPosix(rel));
  }
  return out;
}

function srcForDest(dest) {
  if (jsonSrcByDest.has(dest)) return jsonSrcByDest.get(dest);
  if (ALIAS_SRC[dest]) return ALIAS_SRC[dest];
  return path.join(gameDir, ...dest.split('/'));
}

function jsonDestForAbs(absJson) {
  const relData = path.relative(dataDir, absJson);
  if (!relData.startsWith('..') && !path.isAbsolute(relData)) {
    return toPosix(path.join('data', relData));
  }
  const relGame = path.relative(gameDir, absJson);
  if (!relGame.startsWith('..') && !path.isAbsolute(relGame)) {
    return toPosix(relGame);
  }
  return toPosix(path.join('data', path.basename(absJson)));
}

function relImportBetween(fromDest, toDest) {
  const fromDir = path.posix.dirname(fromDest);
  let rel = path.posix.relative(fromDir === '.' ? '' : fromDir, toDest);
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

function isHandStubFile(absPath) {
  if (!fs.existsSync(absPath)) return false;
  const head = fs.readFileSync(absPath, 'utf8').slice(0, 600);
  return HAND_STUB_HEADER.test(head);
}

/**
 * Intentional edgeSource rewrites (verify still needed each EDGESYNC pass):
 * - types.ts: comicScript anchor union (client-only comic types)
 * - pyoaSpine.ts: Umbra book JSON stays client-authored
 * - completedEventPacket.ts: foeCanSpeak without pulling srdMonsters + SRD JSON
 * - checkMath.ts: exploration / library / titles / characterBuild stay client-only
 * - systemPrompt.ts: drop re-exports that pull imagePromptModifier
 */
function edgeSource(file, srcPath) {
  const raw = fs.readFileSync(srcPath, 'utf8');
  let next = raw;

  if (file === 'systemPrompt.ts') {
    next = next
      .replace(/^export \{ KID_MODE_RULES \} from '\.\/contentModeRules';\r?\n/m, '')
      .replace(/^export \{ buildImagePromptModifier \} from '\.\/imagePromptModifier';\r?\n/m, '');
  }
  if (file === 'pyoaSpine.ts') {
    next = next.replace(
      /import umbraBook from ['"]@\/data\/pyoa\/umbraBook\.json['"];\r?\n/,
      "const umbraBook = { startId: 'up-bell-tower', nodes: [] };\n"
    );
  }
  if (file === 'completedEventPacket.ts') {
    next = next.replace(
      /^import \{ foeCanSpeak \} from '\.\/rules\/srdMonsters';\r?\n/m,
      "function foeCanSpeak(enc: { canSpeak?: boolean } | null | undefined): boolean { return enc?.canSpeak === true; }\n"
    );
  }
  if (file === 'checkMath.ts') {
    next = next
      .replace(
        /^import \{ ladderDc[^\n]*'\.\/rules\/exploration';\r?\n/m,
        "type TaskKind = string;\ntype TaskRung = string;\nconst edgeOnly = (..._args: unknown[]): never => { throw new Error('tabletop exploration rules run on the client'); };\nconst ladderDc = edgeOnly, lightNote = edgeOnly, sceneLight = edgeOnly, sheetBurden = edgeOnly, sightCheck = edgeOnly, taskRung = edgeOnly;\n"
      )
      .replace(/^import \{ paceCheckAdv[^\n]*'\.\/rules\/travelPace';\r?\n/m, 'const paceCheckAdv = edgeOnly, travelPaceOf = edgeOnly;\n')
      .replace(/^import \{ modeProfile \} from '\.\/rules\/modeProfile';\r?\n/m, 'const modeProfile = edgeOnly;\n')
      .replace(/^import \{ namedSkillCheckMod \} from '\.\/rules\/librarySkills';\r?\n/m, 'const namedSkillCheckMod = (..._args: unknown[]): null => null;\n')
      .replace(/^import \{ titleCheckMod \} from '\.\/rules\/titles';\r?\n/m, 'const titleCheckMod = (..._args: unknown[]): null => null;\n')
      .replace(/^import \{ toolProficiencies \} from '\.\/tabletop\/characterBuild';\r?\n/m, 'const toolProficiencies = (..._args: unknown[]): string[] => [];\n')
      .replace(
        /function sheetExtras\(state: GameState\): boolean \{\r?\n\s*return [^\n]*\r?\n\}/,
        'function sheetExtras(_state: GameState): boolean {\n  return false;\n}'
      );
  }

  if (file === 'types.ts') {
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

  // JSON → _shared/gm/data/… with Deno import attribute (src file unchanged).
  next = next.replace(
    /((?:import|export)\s+(?!type\b)[^'"`;\n]*?\s+from\s+)['"]([^'"]+\.json)['"](\s+with\s*\{[^}]*\})?/g,
    (full, head, spec) => {
      let abs;
      if (spec.startsWith('@/')) {
        abs = path.join(root, 'src', spec.slice(2).replace(/\//g, path.sep));
      } else if (spec.startsWith('.')) {
        abs = path.resolve(path.dirname(srcPath), spec);
      } else {
        return full;
      }
      abs = path.normalize(abs);
      if (!fs.existsSync(abs)) return full;
      const destJson = jsonDestForAbs(abs);
      jsonSrcByDest.set(destJson, abs);
      const rel = relImportBetween(file, destJson);
      return `${head}'${rel}' with { type: 'json' }`;
    }
  );

  const rel = file.includes('/')
    ? /from\s+['"](\.{1,2}\/[^'"]+)['"]/g
    : /from\s+['"](\.\/[^'"]+)['"]/g;
  next = next.replace(rel, (_m, spec) => {
    if (spec.endsWith('.json')) return `from '${spec}'`;
    const withExt = spec.endsWith('.ts') ? spec : `${spec}.ts`;
    return `from '${withExt}'`;
  });
  next = next.replace(/import\((['"])(\.{1,2}\/[^'"]+)\1\)/g, (_m, q, spec) => {
    if (spec.endsWith('.json') || spec.endsWith('.ts')) return `import(${q}${spec}${q})`;
    return `import(${q}${spec}.ts${q})`;
  });

  return next;
}

/** After edgeSource: remaining client-only value imports that the edge cannot resolve. */
function clientOnlyProblems(dest, text) {
  const problems = [];
  for (const spec of collectSpecs(text)) {
    if (spec.startsWith('@/')) {
      problems.push(`unrewritten alias ${spec}`);
      continue;
    }
    if (!spec.startsWith('.')) continue;
    if (spec.endsWith('.json')) {
      const nextDest = toPosix(path.posix.normalize(path.posix.join(path.posix.dirname(dest), spec)));
      if (nextDest.startsWith('../')) problems.push(`json outside gm: ${spec}`);
      continue;
    }
    const noExt = spec.replace(/\.ts$/, '');
    const nextDest = path.posix.normalize(path.posix.join(path.posix.dirname(dest), noExt)) + '.ts';
    if (nextDest.startsWith('../')) problems.push(`outside gm: ${spec}`);
  }
  return problems;
}

function edgeContent(entry) {
  if (entry.kind === 'hand-stub') {
    return fs.readFileSync(path.join(destDir, entry.dest), 'utf8');
  }
  if (entry.dest.endsWith('.json')) return fs.readFileSync(entry.src, 'utf8');
  return edgeSource(entry.dest, entry.src);
}

function gmDestFromResolved(absFile) {
  const rel = path.relative(destDir, absFile);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return toPosix(rel);
}

function seedGmDestsFromEntries() {
  const seeds = new Set();
  const errors = [];
  const queue = ENTRY_POINTS.map((p) => path.join(root, p));
  const seen = new Set();

  while (queue.length) {
    const abs = queue.shift();
    if (seen.has(abs) || !fs.existsSync(abs)) continue;
    seen.add(abs);
    const text = fs.readFileSync(abs, 'utf8');
    const fromDir = path.dirname(abs);
    for (const spec of collectSpecs(text)) {
      if (!spec.startsWith('.')) continue;
      const resolved = path.normalize(path.resolve(fromDir, spec));
      const gmDest = gmDestFromResolved(resolved);
      if (gmDest) {
        seeds.add(gmDest.endsWith('.ts') || gmDest.endsWith('.json') ? gmDest : `${gmDest}.ts`);
        continue;
      }
      if (
        resolved.endsWith('.ts') &&
        toPosix(path.relative(root, resolved)).startsWith('supabase/functions/')
      ) {
        queue.push(resolved);
      }
    }
  }

  if (!seeds.size) errors.push('no _shared/gm imports found from entry points');
  return { seeds: [...seeds], errors };
}

function normalizeDest(raw) {
  let dest = toPosix(raw);
  if (!dest.endsWith('.ts') && !dest.endsWith('.json')) dest = `${dest}.ts`;
  return dest;
}

function childDests(parentDest, text, { includeType = false } = {}) {
  const kids = [];
  const errors = [];
  for (const spec of collectSpecs(text, { includeType })) {
    if (spec.startsWith('@/')) {
      errors.push(`${parentDest} still has unrewritten alias import ${spec}`);
      continue;
    }
    if (!spec.startsWith('.')) continue;
    let nextDest;
    if (spec.endsWith('.json')) {
      nextDest = toPosix(path.posix.normalize(path.posix.join(path.posix.dirname(parentDest), spec)));
    } else {
      const noExt = spec.replace(/\.ts$/, '');
      nextDest = path.posix.normalize(path.posix.join(path.posix.dirname(parentDest), noExt)) + '.ts';
    }
    if (nextDest.startsWith('../')) {
      errors.push(`${parentDest} imports ${spec} (outside _shared/gm)`);
      continue;
    }
    kids.push(nextDest);
  }
  return { kids, errors };
}

/**
 * Full sync set = VALUE-import closure of seeds.
 * Syncable modules use edgeSource(src). When src still pulls client-only deps after
 * rewrites, keep the existing hand stub and walk that instead (do not overwrite).
 */
function deriveEntries(seedOverride = null) {
  jsonSrcByDest.clear();
  const { seeds, errors: seedErrors } = seedGmDestsFromEntries();
  const errors = [...seedErrors];
  const notes = [];
  const out = [];
  const seen = new Set();
  const handStubDests = new Set();
  const queue = (seedOverride?.length ? seedOverride : seeds).map((d) => ({
    dest: normalizeDest(d),
    via: null,
  }));

  while (queue.length) {
    const { dest: rawDest, via } = queue.shift();
    const dest = normalizeDest(rawDest);
    if (seen.has(dest)) continue;
    seen.add(dest);

    if (dest.startsWith('../')) {
      errors.push(`${via || 'entry'} imports ${dest} (outside _shared/gm)`);
      continue;
    }

    const edgePath = path.join(destDir, dest);
    const src = srcForDest(dest);
    const hasSrc = fs.existsSync(src);
    const hasEdgeStub = isHandStubFile(edgePath);

    // JSON copies
    if (dest.endsWith('.json')) {
      if (!hasSrc && jsonSrcByDest.has(dest)) {
        /* src registered during parent rewrite */
      }
      const jsonSrc = srcForDest(dest);
      if (!fs.existsSync(jsonSrc)) {
        errors.push(`${via || 'entry'} → ${dest}: no JSON source`);
        continue;
      }
      out.push({ dest, src: jsonSrc, via: via || undefined, kind: 'json' });
      continue;
    }

    // Prefer an existing hand stub (walk its imports only) unless FORCE_SYNC_FROM_SRC.
    if (hasEdgeStub && !FORCE_SYNC_FROM_SRC.has(dest)) {
      notes.push(`hand-stub ${dest}${via ? ` (imported by ${via})` : ''}`);
      handStubDests.add(dest);
      const stubText = fs.readFileSync(edgePath, 'utf8');
      out.push({ dest, src: edgePath, via: via || undefined, kind: 'hand-stub' });
      // Hand stubs: follow value + type imports (deno check needs type targets on disk).
      const { kids, errors: childErrs } = childDests(dest, stubText, { includeType: true });
      errors.push(...childErrs);
      for (const k of kids) queue.push({ dest: k, via: dest });
      continue;
    }

    if (hasSrc) {
      const generated = edgeSource(dest, src);
      const problems = clientOnlyProblems(dest, generated);
      if (!problems.length) {
        if (FORCE_SYNC_FROM_SRC.has(dest) && hasEdgeStub) {
          notes.push(`force-sync ${dest}: replacing insufficient hand stub from src`);
        }
        out.push({ dest, src, via: via || undefined, kind: 'ts' });
        // Value closure drives runtime; also enqueue type-only locals so deno check resolves.
        const { kids, errors: childErrs } = childDests(dest, generated, { includeType: true });
        errors.push(...childErrs);
        for (const k of kids) queue.push({ dest: k, via: dest });
        continue;
      }
      // Src not edge-safe and no usable stub (or force-sync required a real copy).
      for (const p of problems) errors.push(`${dest} (via ${via || 'entry'}): ${p}`);
      continue;
    }

    // No src (e.g. only ever a hand stub, or missing module)
    if (hasEdgeStub || (fs.existsSync(edgePath) && HAND_STUB_HEADER.test(fs.readFileSync(edgePath, 'utf8').slice(0, 600)))) {
      handStubDests.add(dest);
      const stubText = fs.readFileSync(edgePath, 'utf8');
      out.push({ dest, src: edgePath, via: via || undefined, kind: 'hand-stub' });
      const { kids, errors: childErrs } = childDests(dest, stubText, { includeType: true });
      errors.push(...childErrs);
      for (const k of kids) queue.push({ dest: k, via: dest });
      continue;
    }

    errors.push(`${via || 'entry'} → ${dest}: no source ${toPosix(path.relative(root, src))}`);
  }

  return { out, errors, notes, handStubDests };
}

function orphansFor(entries, handStubDests) {
  const keep = new Set(entries.map((e) => e.dest));
  for (const h of HAND_AUTHORED_ALWAYS) keep.add(h);
  for (const h of handStubDests) keep.add(h);
  return walkFiles(destDir).filter((f) => {
    if (keep.has(f)) return false;
    // Hand-authored stubs are never orphans (even if currently unreachable).
    if (isHandStubFile(path.join(destDir, f))) return false;
    return true;
  });
}

function matchNamed(entries, named) {
  if (!named.length) return entries;
  return entries.filter(
    (e) => named.includes(e.dest) || named.includes(path.posix.basename(e.dest))
  );
}

function writeReadme() {
  fs.writeFileSync(
    path.join(destDir, 'README.md'),
    `# GM prompt shared modules (edge)

Auto-synced from \`src/game\` via \`node scripts/sync-gm-edge-shared.mjs\`.
The file set is the VALUE-import closure of gm-turn / playPrivileges / generate-image — not a hand list.
Hand stubs (header marked "Edge stub") stay when src would pull client-only modules.
Do not edit generated copies by hand — change the src files and re-sync.
`,
    'utf8'
  );
}

// --- CLI ---
const args = process.argv.slice(2);
const check = args.includes('--check');
const named = args
  .filter((a) => a !== '--check')
  .map((a) => a.replace(/\\/g, '/').replace(/^.*_shared\/gm\//, ''));

const derived = deriveEntries(named.length ? named : null);

if (derived.notes.length) {
  for (const n of derived.notes) console.log('note', n);
}

if (derived.errors.length) {
  for (const err of derived.errors) console.log('error', err);
  process.exit(2);
}

const picked = matchNamed(derived.out, named);

if (check) {
  const drift = [];
  for (const e of picked) {
    if (e.kind === 'hand-stub') continue; // hand stubs are source-of-truth on edge
    const destPath = path.join(destDir, e.dest);
    if (!fs.existsSync(destPath)) {
      drift.push({ ...e, status: 'missing' });
      continue;
    }
    if (fs.readFileSync(destPath, 'utf8') !== edgeContent(e)) {
      drift.push({ ...e, status: 'differs' });
    }
  }
  const orphanList = named.length ? [] : orphansFor(derived.out, derived.handStubDests);
  for (const e of drift) {
    console.log(e.status, e.dest, e.via ? `(imported by ${e.via})` : '');
  }
  for (const o of orphanList) console.log('orphan', o);
  const total = drift.length + orphanList.length;
  console.log(total ? `${total} edge issue${total === 1 ? '' : 's'}` : 'edge copies match');
  process.exit(total ? 1 : 0);
}

fs.mkdirSync(destDir, { recursive: true });

for (const e of picked) {
  if (e.kind === 'hand-stub') {
    console.log('kept hand-stub', e.dest, e.via ? `(imported by ${e.via})` : '');
    continue;
  }
  const destPath = path.join(destDir, e.dest);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, edgeContent(e), 'utf8');
  console.log('synced', e.dest, e.via ? `(imported by ${e.via})` : '');
}

if (!named.length) {
  for (const o of orphansFor(picked, derived.handStubDests)) {
    const abs = path.join(destDir, o);
    // Never delete a hand-stub header file even if somehow listed — belt and braces.
    if (isHandStubFile(abs)) {
      console.log('kept unreachable hand-stub', o);
      continue;
    }
    fs.unlinkSync(abs);
    console.log('deleted orphan', o);
  }
  writeReadme();
}

console.log('Done →', destDir);
