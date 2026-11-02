/**
 * XP-D1 OPEN6 — regenerate src/__tests__/fixtures/xp-open5-chipstreams from OPEN5 T50 rundirs.
 * Usage: node scripts/gen-xp-open5-chipstreams.mjs [open5-merge-logs-dir]
 */
import fs from 'node:fs';
import path from 'node:path';

const dir =
  process.argv[2] ?? 'C:/Users/littl/OneDrive/Documents/synapticgm/game/merge-logs/xp-design/open5-wildlife';
const out = path.resolve('src/__tests__/fixtures/xp-open5-chipstreams');
fs.mkdirSync(out, { recursive: true });

const files = fs
  .readdirSync(dir)
  .filter((f) => /^T50-litrpg-\d{4}-.+\.rundir\.txt$/.test(f))
  .sort();

const finals = {};
for (const file of files) {
  const m = file.match(/^T50-litrpg-(\d{4})-(.+)\.rundir\.txt$/);
  if (!m) continue;
  const [, seed, profile] = m;
  const runDir = fs.readFileSync(path.join(dir, file), 'utf8').trim();
  if (!fs.existsSync(path.join(runDir, 'turns.jsonl'))) {
    console.warn('missing turns', runDir);
    continue;
  }
  const turns = fs
    .readFileSync(path.join(runDir, 'turns.jsonl'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const key = `${seed}-${profile}`;
  const lines = turns.map((t) =>
    JSON.stringify({
      turn: t.turn,
      location: t.location,
      offeredChoices: t.offeredChoices ?? [],
      playerInput: t.playerInput,
      level: t.level,
      progress: t.progress,
      xpGained: t.xpGained,
    })
  );
  fs.writeFileSync(path.join(out, `${key}.jsonl`), lines.join('\n') + '\n');
  const snap = JSON.parse(fs.readFileSync(path.join(runDir, 'snapshot.json'), 'utf8')).state;
  finals[key] = {
    seed: Number(seed),
    profile,
    bibleId: turns[0]?.bibleId,
    turn: snap.turn,
    engineMode: snap.engineMode,
    currentLocation: snap.currentLocation,
    level: snap.character?.level,
    wildsByPlace: snap.wildsByPlace ?? null,
    regionLevelBands: snap.regionLevelBands ?? null,
  };
  console.log('wrote', key, turns.length, 'turns');
}
fs.writeFileSync(path.join(out, 'final-state.json'), JSON.stringify(finals, null, 1) + '\n');
console.log('done', Object.keys(finals).length, '→', out);
