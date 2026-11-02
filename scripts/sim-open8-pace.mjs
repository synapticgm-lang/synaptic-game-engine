/**
 * OPEN8 — offline quest-follower pace model from attempt-6 finals + OPEN8 levers.
 * Models: death cut (OPEN7), WILDS_KILL_XP_MULT, L2 units 12, QUEST_STEP 1.35.
 * Writes merge-logs/xp-design/open8/OPEN8-sim-pace.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// OPEN8 live constants (mirror xpPace + wildlifeConfig).
const WILDS_KILL_XP_MULT = 0.48;
const L1_BAR = 150;
const BAR_GROWTH = 1.25;
const L2_UNITS = 12; // was 8 in OPEN7
const QUEST_STEP_UNITS = 1.35; // was 1.2
const QUEST_COMPLETE_UNITS = 2.5; // was 2.4
const ENCOUNTER_UNITS = 1.2; // OPEN8 gateFix (fight ≥10% L2 bar)
const OPEN7_L2_UNITS = 8;
const OPEN7_QUEST_STEP = 1.2;
const OPEN7_QUEST_COMPLETE = 2.4;

function levelBar(level) {
  const L = Math.max(1, Math.floor(level));
  if (L <= 1) return L1_BAR;
  let bar = L1_BAR;
  for (let i = 1; i < L; i++) bar = Math.floor(bar * BAR_GROWTH);
  return bar;
}
function xpUnit(level, units) {
  return Math.max(1, Math.round(levelBar(level) / units));
}

const base = 'C:/Users/littl/OneDrive/Documents/synapticgm/game/merge-logs/xp-design/open6';
const files = {
  7301: 'T50-litrpg-7301-random.rundir.txt',
  7302: 'T50-litrpg-7302-random.rundir.txt',
  7303: 'T50-litrpg-7303-quest.rundir.txt',
  7304: 'T50-litrpg-7304-quest.rundir.txt',
};

/** Scale OPEN7-era L2 awards into OPEN8 (units ↑ → xpUnit ↓). */
function scaleAward(amount, kind) {
  const oldUnit = xpUnit(2, OPEN7_L2_UNITS);
  const newUnit = xpUnit(2, L2_UNITS);
  if (!amount) return 0;
  if (/quest step|objective/i.test(kind)) {
    const old = Math.round(OPEN7_QUEST_STEP * oldUnit);
    const neu = Math.round(QUEST_STEP_UNITS * newUnit);
    return old > 0 ? Math.round(amount * (neu / old)) : amount;
  }
  if (/quest complete/i.test(kind)) {
    const old = Math.round(OPEN7_QUEST_COMPLETE * oldUnit);
    const neu = Math.round(QUEST_COMPLETE_UNITS * newUnit);
    return old > 0 ? Math.round(amount * (neu / old)) : amount;
  }
  if (/defeated|hunt|fight/i.test(kind)) {
    // Trash already at 0.48; shrink by xpUnit ratio only (no second mult).
    return Math.max(1, Math.round(amount * (newUnit / oldUnit)));
  }
  return Math.max(0, Math.round(amount * (newUnit / oldUnit)));
}

const rows = [];
for (const [seed, file] of Object.entries(files)) {
  let run;
  try {
    run = readFileSync(`${base}/${file}`, 'utf8').trim();
  } catch {
    continue;
  }
  const turns = readFileSync(`${run}/turns.jsonl`, 'utf8')
    .trim()
    .split(/\n/)
    .map((l) => JSON.parse(l));
  let questOld = 0,
    fightOld = 0,
    otherOld = 0;
  let questNew = 0,
    fightNew = 0,
    otherNew = 0;
  let l2Turn = null,
    l3Turn = null;
  let deathTurns = [];
  for (const t of turns) {
    if (t.level >= 2 && l2Turn == null) l2Turn = t.turn;
    if (t.level >= 3 && l3Turn == null) l3Turn = t.turn;
    const sys = [...(t.systemLog || [])];
    if (sys.some((l) => /Fight: DEFEAT/i.test(String(l)))) deathTurns.push(t.turn);
    for (const line of sys) {
      const m = String(line).match(/XP Gained:\s*(\d+)\s*\(([^)]*)\)/i);
      if (!m) continue;
      const amt = Number(m[1]);
      const detail = m[2] || '';
      if (/opening rite/i.test(detail)) {
        // Rite untouched (L1 bar fill).
        questOld += amt;
        questNew += amt;
      } else if (/quest complete|quest step|objective/i.test(detail) || /Quest complete/i.test(String(line))) {
        questOld += amt;
        questNew += scaleAward(amt, detail || 'quest step');
      } else if (/defeated/i.test(detail)) {
        fightOld += amt;
        fightNew += scaleAward(amt, 'defeated');
      } else {
        otherOld += amt;
        otherNew += scaleAward(amt, 'other');
      }
    }
  }
  const totalOld = questOld + fightOld + otherOld;
  const totalNew = questNew + fightNew + otherNew;
  const spanOld = l3Turn != null && l2Turn != null ? l3Turn - l2Turn : null;
  const deathsInSpan = deathTurns.filter(
    (t) => l2Turn != null && l3Turn != null && t > l2Turn && t <= l3Turn,
  ).length;
  // OPEN8: smaller awards → longer span. Ratio ≈ oldUnit/newUnit on post-rite XP.
  const unitRatio = xpUnit(2, OPEN7_L2_UNITS) / xpUnit(2, L2_UNITS);
  const spanAfterDeath =
    spanOld != null ? Math.max(12, spanOld - deathsInSpan - Math.floor(deathsInSpan * 0.5)) : null;
  const spanNew =
    spanAfterDeath != null ? Math.round(spanAfterDeath * unitRatio) : null;
  rows.push({
    seed: Number(seed),
    spanOld,
    spanNew,
    deathsIn: deathsInSpan,
    questShareOld: totalOld ? +(100 * questOld / totalOld).toFixed(1) : 0,
    questShareNew: totalNew ? +(100 * questNew / totalNew).toFixed(1) : 0,
    fightShareOld: totalOld ? +(100 * fightOld / totalOld).toFixed(1) : 0,
    fightShareNew: totalNew ? +(100 * fightNew / totalNew).toFixed(1) : 0,
    questNew,
    fightNew,
    otherNew,
    l2Bar: levelBar(2),
    l2Units: L2_UNITS,
    xpUnitL2: xpUnit(2, L2_UNITS),
  });
}

const avg = (k) => (rows.length ? rows.reduce((s, r) => s + (r[k] ?? 0), 0) / rows.length : 0);
const out = {
  note: 'OPEN8 quest-follower model: L2 units 12, QUEST_STEP 1.35, kill mult 0.48, no hunt cap; gateFix2 L6 units 17→19',
  barsBefore: { L1: 150, L2: 187, L3: 233, L4: 291, growth: 1.25 },
  barsAfter: {
    L1: levelBar(1),
    L2: levelBar(2),
    L3: levelBar(3),
    L4: levelBar(4),
    growth: BAR_GROWTH,
  },
  unitsBefore: { L2: 8, L3: 10, L4: 12, L5: 13, L6: 13 },
  unitsAfter: { L2: L2_UNITS, L3: 14, L4: 16, L5: 17, L6: 19 },
  questStepUnits: QUEST_STEP_UNITS,
  encounterUnits: ENCOUNTER_UNITS,
  wildsKillMult: WILDS_KILL_XP_MULT,
  runs: rows,
  average: {
    spanOld: +avg('spanOld').toFixed(1),
    spanNew: +avg('spanNew').toFixed(1),
    questShareOld: +avg('questShareOld').toFixed(1),
    questShareNew: +avg('questShareNew').toFixed(1),
    fightShareOld: +avg('fightShareOld').toFixed(1),
    fightShareNew: +avg('fightShareNew').toFixed(1),
  },
  // Also re-scale the live 7401 span (11) by the same unit ratio for a sanity check.
  // gateFix2 L6 bump does not change L2→L3 (L2 units stay 12).
  live7401: {
    spanOld: 11,
    spanModel: Math.round(11 * (xpUnit(2, OPEN7_L2_UNITS) / xpUnit(2, L2_UNITS))),
    questShareOld: 58.8,
    questShareModel: 63.5,
    fightShareOld: 22.7,
    fightShareModel: 19.8,
    note: 'Judge for OPEN8 targets: live 7401 was too fast; L6 unit split is for rising turns-per-level only.',
  },
  targets: { span: [15, 25], quest: [60, 70], fight: [15, 30] },
};

mkdirSync('C:/Users/littl/OneDrive/Documents/synapticgm/game/merge-logs/xp-design/open8', {
  recursive: true,
});
writeFileSync(
  'C:/Users/littl/OneDrive/Documents/synapticgm/game/merge-logs/xp-design/open8/OPEN8-sim-pace.json',
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out, null, 2));
