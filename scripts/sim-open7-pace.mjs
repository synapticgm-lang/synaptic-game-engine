import { readFileSync, writeFileSync } from 'fs';

const MULT = 0.55;
const L2_FULL = 26; // typical OPEN6 pre-cap same-band kill at L2

const base = 'C:/Users/littl/OneDrive/Documents/synapticgm/game/merge-logs/xp-design/open6';
const files = {
  7301: 'T50-litrpg-7301-random.rundir.txt',
  7302: 'T50-litrpg-7302-random.rundir.txt',
  7303: 'T50-litrpg-7303-quest.rundir.txt',
  7304: 'T50-litrpg-7304-quest.rundir.txt',
};

const rows = [];
for (const [seed, file] of Object.entries(files)) {
  const run = readFileSync(`${base}/${file}`, 'utf8').trim();
  const turns = readFileSync(`${run}/turns.jsonl`, 'utf8').trim().split(/\n/).map((l) => JSON.parse(l));
  let quest = 0, fight = 0, other = 0;
  let l2Turn = null, l3Turn = null;
  let deathTurns = [];
  let huntWinPays = [];
  for (const t of turns) {
    if (t.level >= 2 && l2Turn == null) l2Turn = t.turn;
    if (t.level >= 3 && l3Turn == null) l3Turn = t.turn;
    const sys = [...(t.systemLog || [])];
    if (sys.some((l) => /Fight: DEFEAT/i.test(String(l)))) deathTurns.push(t.turn);
    const isHunt = /hunt the wildlife/i.test(t.playerInput || '');
    for (const line of sys) {
      const m = String(line).match(/XP Gained:\s*(\d+)\s*\(([^)]*)\)/i);
      if (!m) continue;
      const amt = Number(m[1]);
      const detail = m[2] || '';
      if (/opening rite|quest complete|quest step|objective/i.test(detail) || /Quest complete/i.test(String(line))) {
        quest += amt;
      } else if (/defeated/i.test(detail)) {
        fight += amt;
        if (isHunt) huntWinPays.push(amt);
      } else if (/Achievement/i.test(detail)) {
        other += amt;
      } else {
        other += amt;
      }
    }
  }
  // New hunt pay: full kills * MULT; floor-1 kills become L2_FULL * MULT
  let huntNew = 0;
  for (const amt of huntWinPays) {
    huntNew += amt <= 1 ? Math.round(L2_FULL * MULT) : Math.round(amt * MULT);
  }
  const huntOld = huntWinPays.reduce((a, b) => a + b, 0);
  const fightNew = fight - huntOld + huntNew;
  const totalOld = quest + fight + other;
  const totalNew = quest + fightNew + other;
  const spanOld = l3Turn != null && l2Turn != null ? l3Turn - l2Turn : null;
  // Remove death turns inside L2→L3 and assume cooldown replaces ~2 death-rehunt cycles with quest progress
  const deathsInSpan = deathTurns.filter((t) => l2Turn != null && l3Turn != null && t > l2Turn && t <= l3Turn).length;
  const spanNew = spanOld != null ? Math.max(12, spanOld - deathsInSpan - Math.floor(deathsInSpan * 0.5)) : null;
  // Faster bar from higher post-cap pay: estimate turns saved = extra hunt XP / avg XP per turn (~10)
  const extraHunt = huntNew - huntOld;
  const spanAdj = spanNew != null ? Math.max(12, Math.round(spanNew - extraHunt / 12)) : null;
  rows.push({
    seed: Number(seed),
    l2: l2Turn,
    l3: l3Turn,
    spanOld,
    spanNew: spanAdj,
    deathsInSpan,
    quest,
    fightOld: fight,
    fightNew,
    other,
    huntWins: huntWinPays.length,
    huntOld,
    huntNew,
    questShareOld: totalOld ? +(100 * quest / totalOld).toFixed(1) : 0,
    questShareNew: totalNew ? +(100 * quest / totalNew).toFixed(1) : 0,
    fightShareOld: totalOld ? +(100 * fight / totalOld).toFixed(1) : 0,
    fightShareNew: totalNew ? +(100 * fightNew / totalNew).toFixed(1) : 0,
  });
}
const avg = (k) => rows.reduce((s, r) => s + (r[k] ?? 0), 0) / rows.length;
const out = {
  mult: MULT,
  runs: rows,
  average: {
    spanOld: +avg('spanOld').toFixed(1),
    spanNew: +avg('spanNew').toFixed(1),
    questShareOld: +avg('questShareOld').toFixed(1),
    questShareNew: +avg('questShareNew').toFixed(1),
    fightShareOld: +avg('fightShareOld').toFixed(1),
    fightShareNew: +avg('fightShareNew').toFixed(1),
  },
  targets: { span: [15, 25], quest: [60, 70], fight: [15, 30] },
};
writeFileSync('C:/Users/littl/OneDrive/Documents/synapticgm/game/merge-logs/xp-design/open7/OPEN7-sim-pace.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
