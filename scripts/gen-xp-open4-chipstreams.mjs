/**
 * XP-D1 OPEN5 — regenerate src/__tests__/fixtures/xp-open4-chipstreams from the (git-ignored) OPEN4 T50 run folders.
 * Usage: node scripts/gen-xp-open4-chipstreams.mjs [open4-merge-logs-dir]
 * Reads <dir>/T50-litrpg-<seed>-<profile>.rundir.txt -> run folder -> turns.jsonl + snapshot.json.
 * Output is committed so tests never depend on the run folders.
 */
import fs from 'node:fs';
import path from 'node:path';

const dir =
  process.argv[2] ?? 'C:/Users/littl/OneDrive/Documents/synapticgm/game/merge-logs/xp-design/open4';
const out = path.resolve('src/__tests__/fixtures/xp-open4-chipstreams');
fs.mkdirSync(out, { recursive: true });

const runs = fs
  .readdirSync(dir)
  .map((f) => f.match(/^T50-litrpg-(\d{4})-(random|quest)\.rundir\.txt$/))
  .filter(Boolean)
  .sort((a, b) => a[1].localeCompare(b[1]));

const finals = {};
for (const m of runs) {
  const [file, seed, profile] = m;
  const runDir = fs.readFileSync(path.join(dir, file), 'utf8').trim();
  const turns = fs
    .readFileSync(path.join(runDir, 'turns.jsonl'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const lines = turns.map((t) => {
    const row = {
      turn: t.turn,
      location: t.location,
      offeredChoices: t.offeredChoices,
      playerInput: t.playerInput,
      level: t.level,
    };
    if (typeof t.progress === 'boolean') row.progress = t.progress;
    if (typeof t.xpGained === 'number') row.xpGained = t.xpGained;
    // Compact meaningful-scene inputs (open quest title + step); the rest of fillerSceneKey is place + level.
    const q = (t.openQuests ?? []).map((x) => `${x.title}:${x.step ?? ''}`).join('|');
    if (q) row.quests = q;
    return JSON.stringify(row);
  });
  fs.writeFileSync(path.join(out, `${seed}-${profile}.jsonl`), lines.join('\n') + '\n');

  const snap = JSON.parse(fs.readFileSync(path.join(runDir, 'snapshot.json'), 'utf8')).state;
  const c = snap.circling ?? {};
  finals[`${seed}-${profile}`] = {
    seed: Number(seed),
    profile,
    bibleId: turns[0]?.bibleId,
    turn: snap.turn,
    engineMode: snap.engineMode,
    currentLocation: snap.currentLocation,
    level: snap.character?.level,
    outlineId: snap.worldAtlas?.outlineId ?? null,
    openingEstablishment: { complete: snap.openingEstablishment?.complete === true },
    arcDirector: {
      turnsSinceCombatReceipt: snap.arcDirector?.turnsSinceCombatReceipt,
      lastEncounterClearedTurn: snap.arcDirector?.lastEncounterClearedTurn ?? null,
    },
    sceneFacts: {
      pendingEncounter: snap.sceneFacts?.pendingEncounter ?? null,
      lastKill: snap.sceneFacts?.lastKill ?? null,
    },
    circling: {
      recentFamilies: c.recentFamilies ?? [],
      fillerBlockedFamilies: c.fillerBlockedFamilies ?? [],
      fillerBlockSceneKey: c.fillerBlockSceneKey ?? null,
      fillerOfferSceneKey: c.fillerOfferSceneKey ?? null,
      fillerOfferCounts: c.fillerOfferCounts ?? {},
    },
  };
}
fs.writeFileSync(path.join(out, 'final-state.json'), JSON.stringify(finals, null, 1) + '\n');
console.log('wrote', runs.length, 'runs to', out);
