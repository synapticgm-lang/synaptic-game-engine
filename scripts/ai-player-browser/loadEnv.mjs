import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const raw of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/** .env then .env.local (local wins). Does not print values. */
export function loadProjectEnv() {
  const merged = {
    ...parseEnvFile(path.join(ROOT, '.env')),
    ...parseEnvFile(path.join(ROOT, '.env.local')),
  };
  for (const [k, v] of Object.entries(merged)) {
    if (process.env[k] == null || process.env[k] === '') process.env[k] = v;
  }
  return { root: ROOT, keys: Object.keys(merged) };
}

export function upsertEnvLocal(pairs) {
  const filePath = path.join(ROOT, '.env.local');
  const existing = parseEnvFile(filePath);
  const next = { ...existing, ...pairs };
  const lines = [
    '# Local AI-player tester — gitignored (*.local). Do not commit.',
    ...Object.entries(next).map(([k, v]) => `${k}=${v}`),
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return filePath;
}

export { ROOT };
