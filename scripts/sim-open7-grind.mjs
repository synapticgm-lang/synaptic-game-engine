/**
 * OPEN7 addendum — offline grinder clock (starter stock → L6–7).
 * Pure XP maths: prefers highest non-gray slot each kill; reports gray cliff.
 * Run: node scripts/sim-open7-grind.mjs
 */
import { writeFileSync } from 'fs';

// Mirror xpPace killScale / bars (keep in sync with src/game/rules/xpPace.ts + wildlifeConfig).
const WILDS_KILL_XP_MULT = 0.48;
const L1_BAR = 150;
const BAR_GROWTH = 1.25;
const ENCOUNTER_UNITS_L2_PLUS = 1.15;

function levelBar(level) {
  const L = Math.max(1, Math.floor(level));
  if (L <= 1) return L1_BAR;
  let bar = L1_BAR;
  for (let i = 2; i <= L; i++) bar = Math.floor(bar * BAR_GROWTH);
  return bar;
}
function xpUnit(level) {
  return levelBar(level) / (level <= 1 ? 3 : 10);
}
function zeroDifference(CL) {
  if (CL <= 7) return 5;
  if (CL <= 9) return 6;
  if (CL <= 11) return 7;
  if (CL <= 15) return 8;
  if (CL <= 19) return 9;
  if (CL <= 29) return 11;
  if (CL <= 39) return 12;
  if (CL <= 44) return 13;
  if (CL <= 49) return 14;
  if (CL <= 54) return 15;
  if (CL <= 59) return 16;
  return 17;
}
function grayLevel(CL) {
  if (CL <= 5) return 0;
  if (CL <= 39) return CL - Math.floor(CL / 10) - 5;
  if (CL <= 59) return CL - Math.floor(CL / 5) - 1;
  return CL - 9;
}
function killScale(P, M) {
  if (M <= grayLevel(P)) return 0;
  const baseRatio = (M * 5 + 45) / (P * 5 + 45);
  const diff = M >= P ? 1 + 0.05 * Math.min(M - P, 4) : 1 - (P - M) / zeroDifference(P);
  return Math.max(0, baseRatio * diff);
}
function killXp(P, M, elite = false) {
  const units = P >= 2 ? ENCOUNTER_UNITS_L2_PLUS : 1;
  const amount = Math.round(units * xpUnit(P) * killScale(P, M) * (elite ? 2 : 1) * WILDS_KILL_XP_MULT);
  return amount;
}

const stock = [
  { level: 1, elite: false, name: 'spawn' },
  { level: 2, elite: false, name: 'spawn+1' },
  { level: 3, elite: false, name: 'spawn+2' },
  { level: 3, elite: true, name: 'mini-boss' },
];

let level = 2;
let xp = 0;
let xpToNext = levelBar(2);
let kills = 0;
const log = [];
while (level < 7 && kills < 500) {
  const prey = [...stock]
    .filter((s) => s.level > grayLevel(level))
    .sort((a, b) => b.level - a.level || Number(b.elite) - Number(a.elite))[0];
  if (!prey) {
    log.push({ event: 'all-gray', level, kills });
    break;
  }
  const gain = killXp(level, prey.level, prey.elite);
  if (gain <= 0) {
    log.push({ event: 'zero-pay', level, prey: prey.name, kills });
    break;
  }
  xp += gain;
  kills += 1;
  while (xp >= xpToNext && level < 30) {
    xp -= xpToNext;
    level += 1;
    xpToNext = levelBar(level);
    log.push({ event: 'level-up', level, kills, lastPrey: prey.name, lastGain: gain });
  }
}

const grayCliff = {};
for (let P = 1; P <= 10; P++) {
  grayCliff[P] = stock
    .filter((s) => s.level <= grayLevel(P))
    .map((s) => s.name);
}

const out = {
  killsToL7: kills,
  finalLevel: level,
  xpRemainder: xp,
  xpToNext,
  grayCliff,
  milestones: log.filter((e) => e.event === 'level-up'),
  note: 'Assumes infinite refill of starter stock; real sim also refills via WILDS_RESPAWN_HOURS.',
};
writeFileSync(
  new URL('../../../merge-logs/xp-design/open7/OPEN7-sim-grind.json', import.meta.url),
  JSON.stringify(out, null, 2)
);
console.log(JSON.stringify(out, null, 2));
