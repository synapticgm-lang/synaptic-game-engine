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
  'timelineFormat.ts',
  'choiceTierRules.ts',
  'contentModeRules.ts',
  'mapEngine.ts',
];

function rewriteImports(source, file) {
  let next = source;
  if (file === 'types.ts') {
    next = next.replace(
      /from\s+['"]\.\.\/types\/comicScript['"]/g,
      "from './comicScript.ts'"
    );
  }
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
  fs.writeFileSync(path.join(destDir, file), rewriteImports(next, file), 'utf8');
  console.log('synced', file);
}

// comicScript lives outside game/ — copy beside types for edge imports
{
  const srcPath = path.join(root, 'src', 'types', 'comicScript.ts');
  const raw = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(path.join(destDir, 'comicScript.ts'), rewriteImports(raw, 'comicScript.ts'), 'utf8');
  console.log('synced comicScript.ts');
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
