#!/usr/bin/env node
/**
 * Fact checker for a fate-autoplay run. Data only, no AI judge.
 *
 * For each turn it compares the committed prose (turns.jsonl `gmText`) with the facts the engine
 * handed the writer that turn: the writer packet (writer-prompts/turn-NN.txt, NN = turn - 1),
 * the engine result, receipts, location and place cards.
 *
 * Usage: node scripts/factCheck.mjs <run folder | run folder name> [--out <dir>] [--turn N]
 * Writes factcheck.json and factcheck.md into --out (default: the run folder).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RUNS = resolve('scripts/fate-autoplay/runs');

const NUM_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, both: 2, single: 1, only: 1,
};
/** A count in prose starts on one of these; "one" alone is not a count, but it can end one ("twenty-one"). */
const COUNT_START = '\\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety';
const COUNT_PART = `one|${COUNT_START.replace('\\d+|', '')}|hundred|thousand`;
/** One whole number phrase ("twenty-five", "two hundred twenty-five") is one number, not one per word. */
const COUNT_RE = new RegExp(`\\b((?:${COUNT_START})(?:(?:-|\\s+)(?:${COUNT_PART}))*)\\b`, 'gi');
const WORD_FOR = Object.fromEntries(Object.entries(NUM_WORDS).filter(([w]) => !['both', 'single', 'only'].includes(w)).map(([w, n]) => [n, w]));

const EXIT_NOUN = '(?:roads?|exits?|ways? out|ways?|paths?|doors?|doorways?|lanes?|streets?|routes?|gates?|tracks?|trails?|passages?|stairs?)';
const EXIT_NOUN_RE = new RegExp(`\\b${EXIT_NOUN}\\b`, 'i');
const EXIT_CLAIM = new RegExp(`\\b(?:ways? out|exits?|${EXIT_NOUN}\\s+(?:left|led|leads|lead|ran|runs|went|go|goes)\\b|led (?:back )?to|leads (?:back )?to|out of (?:the|this) [a-z]+ led)`, 'i');

const ITEMS = [
  'boots', 'boot', 'papers', 'paper', 'coin', 'coins', 'purse', 'pouch', 'sword', 'blade', 'dagger', 'knife', 'axe', 'bow',
  'arrows', 'shield', 'helmet', 'helm', 'cloak', 'coat', 'gloves', 'ring', 'amulet', 'key', 'keys', 'map', 'letter', 'scroll',
  'potion', 'rope', 'torch', 'lantern', 'backpack', 'pack', 'satchel', 'bread', 'waterskin', 'flask', 'badge', 'token', 'charter',
  'spear', 'club', 'mace', 'hammer', 'crossbow', 'armor', 'armour', 'jerkin', 'tunic', 'hat', 'hood', 'belt', 'phone',
];
/** Worn pieces a handed "clothes" kit row already covers. */
const GARMENTS = new Set(['boots', 'boot', 'belt', 'coat', 'cloak', 'hat', 'hood', 'gloves', 'tunic', 'jerkin']);
/** Other words for a carried bag; a handed "Bag" inventory row covers them. */
const BAG_WORDS = new Set(['pack', 'backpack', 'satchel']);
const PEOPLE = [
  'guard', 'guards', 'priest', 'priests', 'merchant', 'merchants', 'vendor', 'vendors', 'soldier', 'soldiers', 'traveler',
  'travelers', 'stranger', 'strangers', 'woman', 'women', 'man', 'men', 'boy', 'girl', 'child', 'children', 'clerk', 'monk',
  'beggar', 'beggars', 'innkeeper', 'barkeep', 'sailor', 'sailors', 'farmer', 'pilgrim', 'pilgrims', 'acolyte', 'acolytes',
  'watchman', 'watchmen', 'captain', 'knight', 'noble', 'servant', 'porter', 'fence', 'smith', 'healer', 'scribe', 'handler',
];
const FOES = [
  'thug', 'thugs', 'bandit', 'bandits', 'wolf', 'wolves', 'rat', 'rats', 'cutthroat', 'cutthroats', 'highwayman', 'highwaymen',
  'goblin', 'goblins', 'skeleton', 'skeletons', 'zombie', 'zombies', 'ghoul', 'ghouls', 'spider', 'spiders', 'raider', 'raiders',
  'brigand', 'brigands', 'cultist', 'cultists', 'beast', 'beasts', 'hound', 'hounds', 'wraith', 'cutter', 'cutters', 'thief', 'thieves',
];
const STOP_CAPS = new Set(['i', 'jax', 'system', 'he', 'she', 'they', 'them', 'their', 'it', 'its', 'you', 'your', 'a', 'an', 'the', 'and', 'but', 'then', 'when', 'while', 'as', 'if', 'so', 'no', 'not', 'yes']);

function parseArgs(argv) {
  const a = { run: '', out: '', turn: 0 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') a.out = argv[++i];
    else if (argv[i] === '--turn') a.turn = Number(argv[++i]);
    else if (!a.run) a.run = argv[i];
  }
  return a;
}

function runDir(arg) {
  if (existsSync(arg)) return resolve(arg);
  const direct = join(RUNS, arg);
  if (existsSync(direct)) return direct;
  const m = readdirSync(RUNS).filter((d) => d.includes(arg)).sort();
  if (!m.length) throw new Error(`run not found: ${arg}`);
  return join(RUNS, m[m.length - 1]);
}

const lower = (s) => String(s ?? '').toLowerCase();
/** Sentences with their quoted speech blanked out, so a speaker's words are not read as narration. */
function sentences(text) {
  const src = String(text ?? '');
  const masked = src.replace(/["“][^"”]*["”]/g, (q) => ' '.repeat(q.length));
  const out = [];
  const re = /[^]*?(?:[.!?]["”’']?(?=\s|$)|$)/g;
  for (const m of src.matchAll(re)) {
    if (!m[0].trim()) continue;
    const lead = m[0].length - m[0].trimStart().length;
    const start = (m.index ?? 0) + lead;
    const s = m[0].trim();
    out.push({ s, narration: masked.slice(start, start + s.length) });
  }
  return out;
}
const toNum = (tok) => {
  if (/^\d+$/.test(tok)) return Number(tok);
  const words = lower(tok).split(/[\s-]+/).filter(Boolean);
  if (words.length === 1) return NUM_WORDS[words[0]] ?? NaN;
  let total = 0;
  let cur = 0;
  for (const w of words) {
    if (w === 'hundred') cur = (cur || 1) * 100;
    else if (w === 'thousand') { total += (cur || 1) * 1000; cur = 0; }
    else if (NUM_WORDS[w] != null) cur += NUM_WORDS[w];
    else return NaN;
  }
  return total + cur;
};

function line(packet, label) {
  const m = packet.match(new RegExp(`^${label}\\s*(.*)$`, 'm'));
  return m ? m[1].trim() : '';
}

/** The packet with its writing instructions removed, so only handed facts remain. */
function factSections(packet) {
  return packet
    .replace(/^TOKEN PROSE[\s\S]*?(?=^REF ENUM)/m, '')
    .split('\n')
    .filter((l) => !/^(?:READER:|Narrate this|Plain speech:|ACTION:|# source:|HERE is already|Shape \(|refs\.use|Name entities|The player character is)/.test(l))
    .join('\n');
}

/** Facts the engine handed the writer for one turn. */
function factsFor(row, packet) {
  const receipts = [...new Set([...(row.arcStatusReceipts ?? []), ...(row.systemLog ?? [])].map(String))];
  const engineResult = (packet.match(/ENGINE RESULT[^:]*\):\s*([\s\S]*?)\n(?:READER|SYSTEM|Location|YOU MAY|No move|TOKEN)/) ?? [])[1]?.trim() ?? String(row.engineFact ?? '');
  const mention = line(packet, 'YOU MAY ONLY MENTION:').split(/,\s*/).map((s) => s.replace(/\.$/, '').trim()).filter(Boolean);
  const refs = [...packet.matchAll(/^t\d+\s+(\S+)\s+(\w+)\s+"([^"]+)"/gm)].map((m) => ({ id: m[1], kind: m[2], display: m[3] }));
  const placesLine = line(packet, 'PLACES:');
  const here = (placesLine.split('·')[0] || line(packet, 'Here:') || String(row.location ?? '')).trim();
  const placesExits = (placesLine.match(/exits:\s*(.+)$/)?.[1] ?? '').split(/,\s*/).map((s) => s.trim()).filter(Boolean);
  const exitsReceipt = [engineResult, ...receipts].join('\n').match(/Exits:\s*([^\n]*?)\.(?=\s|$)/)?.[1] ?? null;
  const notPlace = refs.filter((r) => r.kind !== 'place').map((r) => lower(r.display));
  const isPersonOrThing = (name) => notPlace.some((d) => d === lower(name) || d.includes(lower(name)) || lower(name).includes(d));
  const placeNames = [...new Set([
    ...refs.filter((r) => r.kind === 'place').map((r) => r.display),
    ...mention.filter((m) => !isPersonOrThing(m) && lower(m) !== 'jax'),
    ...(row.placeCards ?? []).flatMap((c) => [c.name, ...(c.exits ?? [])]),
  ].filter(Boolean))].sort((a, b) => b.length - a.length);
  let engineExits = null;
  if (exitsReceipt != null) {
    // The receipt names the place it stands in before "lead to"; only the list after it is the ways out.
    const listed = exitsReceipt.match(/\blead(?:s)? to\s+(.+)$/i)?.[1];
    if (/no way out/i.test(exitsReceipt)) engineExits = [];
    else if (listed) engineExits = [...new Set(listed.split(/,\s*/).map((s) => s.trim()).filter(Boolean))];
    else {
      engineExits = placeNames.filter((p) => p.length > 3 && lower(p) !== lower(here) && lower(exitsReceipt).includes(lower(p)));
      engineExits = [...new Set(engineExits)].filter((p, _, all) => !all.some((q) => q !== p && lower(q).includes(lower(p))));
    }
  }
  const cardNames = (row.placeCards ?? []).flatMap((c) => [c.name, ...(c.exits ?? [])]).join(', ');
  const handedText = lower([factSections(packet), engineResult, receipts.join('\n'), row.location, cardNames].join('\n'));
  return {
    here,
    noMove: /^No move this turn/m.test(packet),
    mention,
    refs,
    placeNames,
    placesExits,
    engineExits,
    exitsReceipt,
    engineResult,
    receipts,
    level: Number(line(packet, 'Level:')) || null,
    xp: line(packet, 'XP:') || null,
    inventory: line(packet, 'Inventory:'),
    handedText,
    // Sheet stats the packet hands with a number ("Level: 2", "XP: 15/225") are handed labels.
    allowText: lower([...mention, ...refs.map((r) => r.display), ...[...packet.matchAll(/^([A-Z][A-Za-z]{1,12}):\s*\d/gm)].map((m) => m[1]), row.location, here, line(packet, 'Inventory:'), line(packet, 'Equipped Gear:'), ...placesExits, engineResult, receipts.join(' '), line(packet, 'OPEN:'), packet.match(/^OPEN:\n((?:- .*\n?)*)/m)?.[1] ?? ''].join(' | ')),
  };
}

const inHanded = (facts, word) => {
  const w = lower(word).replace(/s$/, '');
  return new RegExp(`\\b${w}(?:s|es)?\\b`).test(facts.handedText);
};
const negated = (sentence, idx) => /\b(?:no|not|without|never|nor|any)\s+(?:\w+\s+){0,2}$/i.test(sentence.slice(Math.max(0, idx - 30), idx));

/** `page`: the story already on the page before this turn (page 1 and earlier beats); a count it told is established. */
export function checkTurn(row, packet, page = '') {
  const facts = factsFor(row, packet);
  const pageText = lower(page);
  const prose = String(row.gmText ?? '');
  const flags = [];
  const add = (kind, quote, missing) => {
    if (!flags.some((f) => f.kind === kind && f.quote === quote && f.missing === missing)) flags.push({ kind, quote, missing });
  };

  for (const { s, narration } of sentences(prose)) {
    // Exit counts: "Three roads left the shrine", "the only way out".
    const exitFact = facts.engineExits ?? (facts.placesExits.length ? facts.placesExits : null);
    // An exit claim covers its own clause, not the rest of the sentence ("…stood open, and they wanted an answer about the Crown").
    const exitClauses = s.split(/[;:]\s*|,\s*(?=(?:and|but|while|as|though|yet)\b)/i).filter((c) => EXIT_CLAIM.test(c) || EXIT_NOUN_RE.test(c) || /\b(?:another|the other)\b/i.test(c));
    if (exitFact) {
      const re = new RegExp(`\\b(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|both|single|only)\\s+(?:\\w+\\s+){0,2}?(${EXIT_NOUN})\\b`, 'gi');
      for (const m of s.matchAll(re)) {
        if (!EXIT_CLAIM.test(s) && !/\b(?:left|led|leads|lead|ran|out)\b/i.test(s)) continue;
        // "the only way out" is one; "the only ways out are the four doors" leaves the count to the number,
        // and "only the exits of Lowmarket and the West Wall" counts the places it lists.
        let n = toNum(m[1]);
        if (lower(m[1]) === 'only' && /s$|^ways out$/i.test(m[2])) {
          const rest = s.slice((m.index ?? 0) + m[0].length);
          if (new RegExp(`\\b(?:${COUNT_START}|one)\\b`, 'i').test(rest)) continue;
          n = facts.placeNames.filter((p, _, all) => lower(rest).includes(lower(p)) && !all.some((q) => q !== p && lower(q).includes(lower(p)) && lower(rest).includes(lower(q)))).length;
          if (!n) continue;
        }
        // "One passage led…, another…" lists the ways one by one; it is not a total of one.
        if (lower(m[1]) === 'one' && /\b(?:another|the other|a second|a third)\b/i.test(s)) continue;
        if (Number.isFinite(n) && n !== exitFact.length) {
          const src = facts.engineExits ? `engine result "Exits: ${facts.exitsReceipt}" = ${exitFact.length} mapped way(s) out` : `PLACES exits = ${exitFact.length} (${exitFact.join(', ')})`;
          const conflict = facts.engineExits && facts.placesExits.length !== facts.engineExits.length ? `; packet PLACES line lists ${facts.placesExits.length}` : '';
          add('exit-count', s, `${src}${conflict}`);
        }
      }
      // Places named as a way out that are not this turn's exits.
      if (EXIT_CLAIM.test(s) && !/\b(?:counting|watching|eyeing|checking) the exits\b/i.test(s)) {
        const hereWords = lower(facts.here).split(/\s+/);
        const clauseText = exitClauses.join(' | ');
        const taken = [];
        for (const p of facts.placeNames) {
          const lp = lower(p);
          if (p.length < 4 || lp === lower(facts.here) || lower(facts.here).includes(lp)) continue;
          if (lp.replace(/^the\s+/, '').split(/\s+/).every((w) => hereWords.includes(w))) continue;
          // A capitalised name is the place only when written capitalised ("Close", not "kept their clothes close").
          const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const nameRe = /[A-Z]/.test(p)
            ? new RegExp(`\\b(?:[Tt]he\\s+)?${esc(p.replace(/^the\s+/i, ''))}\\b`)
            : new RegExp(`\\b${esc(lp)}\\b`, 'i');
          const hit = clauseText.match(nameRe);
          const at = hit?.index ?? -1;
          if (at < 0 || taken.some(([a, b]) => at < b && at + hit[0].length > a)) continue;
          taken.push([at, at + hit[0].length]);
          if (exitFact.some((e) => lower(e).includes(lp.replace(/^the\s+/, '')) || lp.includes(lower(e)))) continue;
          add('exit-place', s, `"${p}" named as a way out; handed exits: ${exitFact.length ? exitFact.join(', ') : 'none mapped'}`);
        }
        for (const m of exitClauses.join(' | ').matchAll(/\b(?:the|an?)\s+([a-z]+)\s+(road|trail|path|lane|gate)\b/gi)) {
          const phrase = `${m[1]} ${m[2]}`;
          // An order word ("a third path") counts the ways; it does not name one.
          if (/^(?:first|second|third|fourth|fifth|sixth|final|\w+th)$/i.test(m[1])) continue;
          if (/^(?:only|same|narrow|old|back|main|other|one|first|next|last|open|long|short|wide|far|near|whole|full)$/i.test(m[1])) continue;
          if (facts.allowText.includes(lower(phrase))) continue;
          add('exit-place', s, `"${phrase}" is no handed place or exit`);
        }
      }
    }

    // Names: capitalized phrases the writer was not handed.
    const caps = [...s.matchAll(/(?:^|[\s"“(])((?:[A-Z][a-z’'-]+)(?:\s+(?:of|the|de|in)?\s*[A-Z][a-z’'-]+)*)/g)];
    for (const m of caps) {
      const phrase = m[1].replace(/[’']s$/, '');
      const start = (m.index ?? 0) + m[0].indexOf(m[1]);
      const atStart = start === 0 || /["“(]$/.test(s.slice(0, start).trim().slice(-1));
      // A contraction is its stem word ("I'll" is "I").
      const words = phrase.split(/\s+/).map((w) => w.replace(/[’'](?:s|ll|d|m|ve|re)$/, '')).filter((w) => !/^(?:of|the|de|in)$/i.test(w));
      let test = words.filter((w) => !STOP_CAPS.has(lower(w)));
      if (atStart && test[0] === words[0]) test = test.slice(1);
      if (!test.length) continue;
      const p = test.join(' ');
      if (facts.allowText.includes(lower(p))) continue;
      if (test.every((w) => facts.allowText.includes(lower(w)))) continue;
      add('name', s, `"${p}" is not in the mention list, refs, receipts or open quests`);
    }

    // Items, people and foes the packet never handed. Quoted speech is the speaker's, not a fact.
    const jaxClause = /^\s*Jax\b/.test(narration);
    const foeHanded = FOES.some((f) => new RegExp(`\\b${f}\\b`).test(facts.handedText)) || /chance meeting|encounter|fight/.test(facts.handedText);
    for (const t of narration.matchAll(/\b[a-z][a-z-]+\b/gi)) {
      const w = lower(t[0]);
      const idx = t.index ?? 0;
      const before = narration.slice(0, idx);
      const after = narration.slice(idx + w.length, idx + w.length + 30);
      const kind = ITEMS.includes(w) ? 'item' : FOES.includes(w) ? 'foe' : PEOPLE.includes(w) ? 'person' : null;
      if (!kind || inHanded(facts, w) || negated(narration, idx)) continue;
      if (kind === 'item') {
        if (/^\s+of\b/i.test(after)) continue;
        if (GARMENTS.has(w) && /\bclothes\b/.test(facts.handedText)) continue;
        if (BAG_WORDS.has(w) && /\bbag\b/.test(facts.allowText)) continue;
        const ownerNoun = before.match(/\b(\w+)[’']s\s+(?:\w+\s+){0,2}$/i)?.[1];
        if (ownerNoun && lower(ownerNoun) !== 'jax') continue;
        const owned = /\b(?:their|his|her)\s+(?:\w+\s+){0,2}$/i.test(before);
        const found = /\b(?:found|finds?|picked up|took|takes?|handed|hand over|gave|gives?|pulled out|drew|held out|carried|wore|wearing)\s+(?:\w+\s+){0,4}$/i.test(before)
          || /^\s+(?:\w+\s+){0,3}?(?:lay|lying|rested|resting|sat|hidden|tucked|waited)\b/i.test(after);
        if (owned ? !jaxClause : !found) continue;
      }
      if (kind === 'person') {
        if (!/^\s+(?:\w+\s+)?(?:stood|said|says|watched|stepped|looked|called|asked|walked|came|sat|nodded|pointed|laughed|turned|waited|kept|held|ran|spoke|told|shouted|blocked|moved)\b/i.test(after)) continue;
        if (foeHanded && /^(?:men|man|women|woman|strangers?)$/.test(w)) continue;
        if (/\bcrowd\b/.test(facts.handedText) && /\b(?:a|an|one|some|someone|another)\s+(?:\w+\s+)?$/i.test(before)) continue;
      }
      add(kind, s, `"${w}" is not in the inventory, refs, people, receipts or engine result`);
    }

    // Numbers the engine never handed ("the three", "6 rounds", "level 3", "40 XP").
    for (const m of s.matchAll(COUNT_RE)) {
      const n = toNum(m[1]);
      const after = s.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 24);
      if (new RegExp(`^\\s+(?:\\w+\\s+){0,2}?${EXIT_NOUN}\\b`, 'i').test(after)) continue;
      if (/^\s*(?:o'clock|times?|steps?|paces?|breaths?|heartbeats?|fingers?|hands|eyes|arms|feet)\b/i.test(after)) continue;
      if (/^\s+of (?:them|us|you)\b/i.test(after)) continue;
      const said = new RegExp(`\\b(?:${n}|${WORD_FOR[n] ?? '_'})\\b`);
      const handed = said.test(facts.handedText) || lower(facts.handedText).includes(lower(m[1])) || said.test(pageText);
      if (!handed) add('number', s, `${m[1]} appears in no handed fact`);
    }

    // XP / level lines in prose against the sheet.
    const lv = s.match(/\blevel\s+(\d+|one|two|three|four|five)\b/i);
    if (lv && facts.level != null && toNum(lv[1]) !== facts.level && !new RegExp(`level\\s*\\(?${toNum(lv[1])}\\b|level ${lv[1]}`, 'i').test(facts.handedText)) {
      add('level', s, `sheet Level ${facts.level}`);
    }

    // A move narrated on a no-move turn.
    if (facts.noMove && /\bJax\b[^.]{0,40}\b(?:left|arrived|reached|set out|came (?:in)?to|walked (?:back )?(?:in)?to)\b/.test(s)) {
      const named = facts.placeNames.find((p) => p.length > 3 && lower(s).includes(lower(p)) && lower(p) !== lower(facts.here) && !lower(facts.here).includes(lower(p)));
      if (named) add('move', s, `No move this turn: at ${facts.here} before and after`);
    }
  }
  return flags;
}

/** The opening page the run's transcript prints as Turn 0 (turns.jsonl starts after it). */
export function pageOne(dir) {
  const tf = join(dir, 'transcript.md');
  if (!existsSync(tf)) return '';
  return readFileSync(tf, 'utf8').match(/^## Turn 0\b[^\n]*\n+([\s\S]*?)\n#/m)?.[1]?.trim() ?? '';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.run) {
    console.error('usage: node scripts/factCheck.mjs <run> [--out dir] [--turn N]');
    process.exit(2);
  }
  const dir = runDir(args.run);
  const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const turns = [];
  let page = pageOne(dir);
  for (const row of rows) {
    const before = page;
    page += `\n${row.gmText ?? ''}`;
    if (args.turn && row.turn !== args.turn) continue;
    if (!row.gmText) continue;
    const pf = join(dir, 'writer-prompts', `turn-${String(row.turn - 1).padStart(2, '0')}.txt`);
    const packet = existsSync(pf) ? readFileSync(pf, 'utf8') : '';
    const flags = checkTurn(row, packet, before);
    turns.push({ turn: row.turn, input: row.playerInput, location: row.location, packet: existsSync(pf) ? basename(pf) : null, flags });
  }
  const flagged = turns.filter((t) => t.flags.length).length;
  const byKind = {};
  for (const t of turns) for (const f of t.flags) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
  const score = turns.length ? Math.round((100 * (turns.length - flagged)) / turns.length) : 100;
  const report = { run: basename(dir), turns: turns.length, flaggedTurns: flagged, flags: turns.reduce((a, t) => a + t.flags.length, 0), byKind, score, perTurn: turns };

  const out = args.out ? resolve(args.out) : dir;
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'factcheck.json'), JSON.stringify(report, null, 2));
  const md = [
    `# Fact check: ${report.run}`,
    '',
    `Score ${score}/100: ${turns.length - flagged} of ${turns.length} turns have no flag (${report.flags} flags).`,
    '',
    `By kind: ${Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}.`,
    '',
    ...turns.filter((t) => t.flags.length).flatMap((t) => [
      `## T${t.turn} (${t.input})`,
      ...t.flags.map((f) => `- **${f.kind}**: "${f.quote}" (${f.missing})`),
      '',
    ]),
  ].join('\n');
  writeFileSync(join(out, 'factcheck.md'), md);
  console.log(`${report.run}: score ${score}, ${flagged}/${turns.length} turns flagged, ${report.flags} flags → ${out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
