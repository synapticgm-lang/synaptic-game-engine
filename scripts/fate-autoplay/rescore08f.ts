import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function score(outDir: string) {
  const turnsPath = join(outDir, 'turns.jsonl');
  const summaryPath = join(outDir, 'summary.json');
  let corpseTalkPads = 0;
  let hereMoves = 0;
  let travelPicks = 0;
  let travelNoMove = 0;
  let acceptEndingRepeats = 0;
  let flavorQuotes = 0;
  let inventInRendered = 0;
  let rejectRatePct = 0;
  let zeroDeltaLoops4 = 0;
  let prevHere = '';
  let clearSeen = false;
  let streak = 0;
  let prevSig = '';
  let l2: number | null = null;
  if (existsSync(summaryPath)) {
    try {
      const s = JSON.parse(readFileSync(summaryPath, 'utf8')) as {
        flavorMetrics?: { rejectRate?: number; attempts?: number; rejects?: number };
        receiptTotals?: { combat?: number };
      };
      if (s.flavorMetrics?.rejectRate != null) {
        rejectRatePct = Math.round(s.flavorMetrics.rejectRate * 100);
      }
    } catch {
      /* skip */
    }
  }
  for (const line of readFileSync(turnsPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as {
        turn?: number;
        playerInput?: string;
        location?: string;
        currentLocation?: string;
        flavorQuote?: string;
        gmText?: string;
        systemLog?: string[];
        offeredChoices?: string[];
        xpGained?: number;
        level?: number;
      };
      const logs = (row.systemLog ?? []).join('\n');
      const hereFromReceipt = logs.match(/^HERE:\s*(.+)$/im)?.[1]?.trim() ?? '';
      const here = String(row.location ?? row.currentLocation ?? hereFromReceipt).trim();
      if (/^CLEAR:/im.test(logs) || /\bOUTCOME:\s*killed\b/i.test(logs)) clearSeen = true;
      if (clearSeen) {
        for (const pad of row.offeredChoices ?? []) {
          if (
            /\b(talk|ask|offer|speak|listen|press)\b/i.test(pad)
            && /skirmisher|lastkill|corpse|hunter/i.test(pad)
          ) {
            corpseTalkPads += 1;
          }
        }
      }
      const input = String(row.playerInput ?? '');
      const isTravel =
        /^(?:travel\s+(?:toward|to)|return\s+to|leave(?:\s+the\s+scene)?|walk\s+away)\b/i.test(
          input.trim()
        );
      if (isTravel) {
        travelPicks += 1;
        if (prevHere && here && prevHere.toLowerCase() !== here.toLowerCase()) hereMoves += 1;
        else if (prevHere && here && prevHere.toLowerCase() === here.toLowerCase()) {
          travelNoMove += 1;
        }
      } else if (prevHere && here && prevHere.toLowerCase() !== here.toLowerCase()) {
        hereMoves += 1;
      }
      if (/\baccept the ending\b/i.test(input)) acceptEndingRepeats += 1;
      const fq = String(row.flavorQuote ?? '').trim();
      if (fq) {
        flavorQuotes += 1;
        if (/\bJax\b/i.test(fq) || /\b(Lord|Lady|Sir)\s+[A-Z][a-z]+/.test(fq)) {
          inventInRendered += 1;
        }
      }
      if (
        l2 == null
        && (/Level Up!|Now level 2/i.test(logs + '\n' + String(row.gmText ?? ''))
          || (row.level != null && row.level >= 2))
      ) {
        l2 = row.turn ?? null;
      }
      const combatish = /\bENCOUNTER:\s*live\b|\bDMG:|\bCLEAR:/i.test(logs);
      const xp = Number(row.xpGained ?? 0) > 0;
      const sig = `${here.toLowerCase()}|${combatish}|${xp}`;
      if (sig === prevSig && !isTravel && !combatish && !xp) {
        streak += 1;
        if (streak === 4) zeroDeltaLoops4 += 1;
      } else {
        streak = 1;
      }
      prevSig = sig;
      if (here) prevHere = here;
    } catch {
      /* skip */
    }
  }
  const s = existsSync(summaryPath)
    ? (JSON.parse(readFileSync(summaryPath, 'utf8')) as {
        receiptTotals?: { combat?: number };
        flavorMetrics?: { attempts?: number; rejects?: number };
      })
    : {};
  return {
    corpseTalkPads,
    hereMoves,
    travelPicks,
    travelNoMove,
    acceptEndingRepeats,
    flavorQuotes,
    inventInRendered,
    rejectRatePct,
    zeroDeltaLoops4,
    l2,
    combat: s.receiptTotals?.combat ?? 0,
    attempts: s.flavorMetrics?.attempts ?? 0,
    rejects: s.flavorMetrics?.rejects ?? 0,
  };
}

const cells: Array<[string, string, string]> = [
  ['01-LITRPG', '2026-09-08T16-18-36-690Z_summoned-pact_cold-system_s42', 'litrpg'],
  ['02-DND', '2026-09-08T16-18-36-697Z_summoned-pact_chilled-gm_s42', 'dnd'],
  ['03-RPG', '2026-09-08T16-23-45-500Z_summoned-pact_chilled-gm_s42', 'rpg'],
  ['04-PYOA', '2026-09-08T16-23-45-548Z_thornferry-road_army-brief_s42', 'pyoa'],
];
const root = join(process.cwd(), 'scripts', 'fate-autoplay', 'runs');
const out: string[] = ['# 08f 4×T50 systems (rescored; zero-delta counted once per loop)', ''];
for (const [label, dir, mode] of cells) {
  const g = score(join(root, dir));
  const l2Ok = mode === 'pyoa' ? true : g.l2 != null && g.l2 <= 25;
  const spatialOk = g.travelPicks === 0 || g.hereMoves > 0;
  const pass =
    g.corpseTalkPads === 0
    && g.inventInRendered === 0
    && g.zeroDeltaLoops4 === 0
    && (mode === 'pyoa' || (l2Ok && spatialOk));
  const fallback = g.rejectRatePct >= 50 || g.inventInRendered > 0;
  const one = `${label}: ${pass ? 'PASS' : 'FAIL'} · reject=${g.rejectRatePct}% inventRendered=${g.inventInRendered} zeroDelta4=${g.zeroDeltaLoops4} flavor=${g.flavorQuotes} attempts=${g.attempts} rejects=${g.rejects} corpse=${g.corpseTalkPads} travel=${g.travelPicks}/${g.hereMoves} L2=${g.l2 ?? 'none'} combat=${g.combat}${fallback ? ' FALLBACK' : ''}`;
  console.log(one);
  out.push(`## ${label}`, '', one, '', '```json', JSON.stringify(g, null, 2), '```', '');
}
writeFileSync(join(root, 'gemini-paste-2026-09-08f-t50', 'SYSTEMS-SUMMARY-RESCORE.md'), out.join('\n'));
