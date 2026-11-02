/**
 * XP-D1 OPEN6 — deterministic replay over attempt-5 LitRPG finals:
 * with wilds seeded + Hunt surviving pad rebuild, how many Hunt/Gather/Seek offers
 * a 50-turn run would get, and the L2→L3 span implied under existing pay figures.
 *
 * Does not change bars. Read-only over OPEN5 fixtures + live stock seed via vitest-free math.
 *
 * Usage: node scripts/sim-open6-wilds-pace.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Use the built TS via vitest isn't available — approximate from fixture locations + known OPEN5 rules.
const OPEN5 = path.resolve('src/__tests__/fixtures/xp-open5-chipstreams');
const OUT = path.resolve(
  'C:/Users/littl/OneDrive/Documents/synapticgm/game/merge-logs/xp-design/open6/OPEN6-sim-pace.json'
);

const OUTDOOR =
  /\b(?:street|streets|alley|alleys|lane|square|plaza|market|road|roads|path|trail|camp|field|forest|woods|shore|dock|harbor|bridge|outskirt|gate|wall|close|between places|Lowmarket)\b/i;
const INDOOR = /\b(?:hall|undercroft|inn|tavern|chapel|chamber|room|keep|tower|crypt)\b/i;

function isOutdoor(loc) {
  if (/between places/i.test(loc)) return true;
  if (INDOOR.test(loc) && !OUTDOOR.test(loc)) return false;
  return OUTDOOR.test(loc) || !INDOOR.test(loc);
}

/**
 * Existing pay figures (OPEN5 report): L2 bar 187, L3 bar 233; same-level table kill ~26 at L2.
 * Quest share stays ≥50%. Fight share lift comes from Hunt/Seek reach, not higher pay.
 */
const L2_BAR = 187;
const L3_BAR = 233;
const SAME_LEVEL_KILL_L2 = 26; // from OPEN5 projected pace

const files = fs.readdirSync(OPEN5).filter((f) => f.endsWith('.jsonl'));
const report = { stamp: 'open6-sim', runs: [], notes: [] };

for (const file of files) {
  const rows = fs
    .readFileSync(path.join(OPEN5, file), 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l));
  let outdoorAfterRite = 0;
  let huntWouldOffer = 0;
  let gatherWouldOffer = 0;
  let seekWouldOffer = 0;
  let openingDone = false;
  for (const r of rows) {
    if (r.level >= 2 || /rite|accept|refuse|my name/i.test(r.playerInput ?? '')) openingDone = true;
    if (!openingDone) continue;
    if (!isOutdoor(r.location ?? '')) continue;
    outdoorAfterRite += 1;
    // OPEN6: every outdoor wilds turn offers Hunt (LitRPG); Gather when nodes exist (assume yes outdoors);
    // Seek only on drought without Hunt — with Hunt always on, Seek hands over (0 extra).
    huntWouldOffer += 1;
    gatherWouldOffer += 1;
  }
  // Implied L2→L3 if the hunt-gather profile takes ~1 hunt every 3 outdoor offers (conservative).
  const huntsTaken = Math.floor(huntWouldOffer / 3);
  const huntXp = huntsTaken * SAME_LEVEL_KILL_L2;
  // Remaining XP from quests at historical quest share ~75% of (L3-L2 bar) still needed.
  const need = L3_BAR; // XP into L3 from 0 in L2... actually L2→L3 means filling L3 bar 233 from L2 entry.
  // After rite, player is L2 with some XP; OPEN5 avg L2→L3 was 30.7 turns. With hunt XP added:
  const fightShareIfTaken = huntXp / Math.max(1, need + huntXp);
  const turnsIfOneHuntPerThreeOutdoor = outdoorAfterRite; // span proxy: outdoor density
  // Rough: historical 30.7 turns with 8% fight; adding huntXp each ~3 outdoor turns.
  // Expected L2→L3 span shrinks by huntXp / (quest XP per turn). Quest XP/turn ≈ (0.75 * 233) / 30.7 ≈ 5.7.
  const questXpPerTurn = (0.75 * L3_BAR) / 30.7;
  const impliedSpan = Math.max(15, Math.round(L3_BAR / (questXpPerTurn + SAME_LEVEL_KILL_L2 / 3)));

  report.runs.push({
    file,
    outdoorAfterRite,
    huntWouldOffer,
    gatherWouldOffer,
    seekWouldOffer,
    huntsTakenConservative: huntsTaken,
    huntXpConservative: huntXp,
    impliedFightShareVsL3Bar: Number(fightShareIfTaken.toFixed(3)),
    impliedL2toL3Turns: impliedSpan,
  });
}

const avgSpan =
  report.runs.reduce((n, r) => n + r.impliedL2toL3Turns, 0) / Math.max(1, report.runs.length);
const avgHuntOffers =
  report.runs.reduce((n, r) => n + r.huntWouldOffer, 0) / Math.max(1, report.runs.length);

report.summary = {
  avgHuntOffersPerRun: Number(avgHuntOffers.toFixed(1)),
  avgImpliedL2toL3: Number(avgSpan.toFixed(1)),
  targetL2toL3: '15-25',
  targetFightShare: '15-30%',
  leverIfStillHigh:
    avgSpan > 25
      ? 'reach (more outdoor turns / take rate on Hunt), not higher kill or quest pay'
      : 'pace model inside band if take-rate holds',
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary, null, 2));
console.log('wrote', OUT);
for (const r of report.runs) {
  console.log(
    r.file,
    'outdoor',
    r.outdoorAfterRite,
    'huntOffers',
    r.huntWouldOffer,
    'impliedL2→L3',
    r.impliedL2toL3Turns
  );
}
