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
/** A handed foe that is an animal; "beast" may name it. */
const ANIMAL_FOE = /\b(?:dogs?|wolf|wolves|rats?|hounds?|spiders?|boars?|bears?|bats?|beetles?|crawlers?|serpents?|snakes?|vermin|beasts?)\b/i;
/** A handed place description that names its work ("Crowded stalls…") hands the people who do that work. */
const PLACE_WORKERS = [
  [/\b(?:stalls?|market|shops?|buyers?|sellers?|traders?)\b/, /^(?:vendors?|merchants?)$/],
  [/\b(?:inn|tavern|taproom)\b/, /^(?:innkeeper|barkeep)$/],
  [/\b(?:cathedral|church|chapel|shrine|temple)\b/, /^(?:priests?|acolytes?|monk|pilgrims?)$/],
  [/\b(?:quays?|harbou?r|docks?|wharf)\b/, /^(?:sailors?|porter)$/],
  [/\b(?:gates?|barracks|watch(?:tower)?)\b/, /^(?:guards?|watch(?:man|men)|soldiers?)$/],
];
const LINK_WORD = /^(?:with|from|into|onto|over|under|upon|that|this|then|than|they|them|their|there|where|when|while|which|were|have|been|still|just|only|once|near|past|along|across|behind|beside|between|inside|outside|against|toward|towards|about|after|before|around|through|without|lay|sat)$/;
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

const lower = (s) => String(s ?? '').toLowerCase().replace(/[‘’]/g, "'");

/** A name of the place the player stands in: the full name, part of it, or only its words ("the close"). */
function namesHere(place, here) {
  const lp = lower(place);
  const words = lower(here).split(/\s+/);
  return lp === lower(here) || lower(here).includes(lp) || lp.replace(/^the\s+/, '').split(/\s+/).every((w) => words.includes(w));
}
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
  // The REF ENUM's here row is the label the writer paints for HERE ("Entry" for the stone outline).
  const hereNames = [...new Set([here, ...refs.filter((r) => r.id === 'here').map((r) => r.display)].filter(Boolean))];
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
    hereNames,
    noMove: /^No move this turn/m.test(packet),
    movedFrom: packet.match(/^Moved this turn: (?:on )?from (.+?) (?:to|toward) /m)?.[1]?.trim() ?? '',
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
    placeWork: lower([...packet.matchAll(/^What it is:\s*(.+)$/gm)].map((m) => m[1]).join('\n')),
    // Sheet stats the packet hands with a number ("Level: 2", "XP: 15/225") are handed labels.
    allowText: lower([...mention, ...refs.map((r) => r.display), ...[...packet.matchAll(/^([A-Z][A-Za-z]{1,12}):\s*\d/gm)].map((m) => m[1]), row.location, here, line(packet, 'Inventory:'), line(packet, 'Equipped Gear:'), ...placesExits, engineResult, receipts.join(' '), line(packet, 'OPEN:'), packet.match(/^OPEN:\n((?:- .*\n?)*)/m)?.[1] ?? ''].join(' | ')),
  };
}

const inHanded = (facts, word) => {
  const w = lower(word).replace(/s$/, '');
  return new RegExp(`\\b${w}(?:s|es)?\\b`).test(facts.handedText);
};
/** The clauses of `sentence` with offsets, cut where the exit-clause split cuts (";", ":", ", and …"). */
const clausesOf = (sentence) => {
  const out = [];
  let from = 0;
  for (const m of sentence.matchAll(/[;:]\s*|,\s*(?=(?:and|but|while|as|though|yet)\b)/gi)) {
    out.push({ from, to: m.index ?? 0, text: sentence.slice(from, m.index ?? 0) });
    from = (m.index ?? 0) + m[0].length;
  }
  out.push({ from, to: sentence.length, text: sentence.slice(from) });
  return out;
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
  const pc = packet.match(/^The player character is ([^:.,(]+)/m)?.[1]?.trim() || 'Jax';
  const who = `(?:${pc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|you)`;
  const rolls = fightRollsOf(facts.engineResult);
  const openSteps = [...packet.matchAll(/^- quest .+? - step: (.+)$/gm)].map((m) => m[1]);
  const known = ` ${wordsOf([page, facts.engineResult, row.playerInput ?? ''].join(' ')).join(' ')} `;
  const choicePose = [
    new RegExp(`\\b${who} (?:has|had|have|needs?|needed|must|was left) to (?:decide|choose)\\b`, 'i'),
    new RegExp(`\\bwhether (?:or not )?${who}\\b[^.!?]*\\bor\\b`, 'i'),
    new RegExp(`\\bwaits? for ${who} to (?:decide|choose|face|act|answer)\\b`, 'i'),
    /\bthe (?:question|choice|decision) (?:is|was|now|remains|remained) (?:whether|if|which)\b/i,
    /\b(?:a|the) (?:choice|decision)\b[^.!?]*\b(?:waits?|waited|awaits?|awaited|stood|stands|lay|lies) (?:before|for|ahead)\b/i,
  ];

  for (const { s, narration } of sentences(prose)) {
    // Exit counts: "Three roads left the shrine", "the only way out".
    const exitFact = facts.engineExits ?? (facts.placesExits.length ? facts.placesExits : null);
    // An exit claim covers its own clause, not the rest of the sentence ("…stood open, and they wanted an answer about the Crown").
    const exitClauses = s.split(/[;:]\s*|,\s*(?=(?:and|but|while|as|though|yet)\b)/i).filter((c) => EXIT_CLAIM.test(c) || EXIT_NOUN_RE.test(c) || /\b(?:another|the other)\b/i.test(c));
    if (exitFact) {
      const re = new RegExp(`\\b(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|both|single|only)\\s+(?:\\w+\\s+){0,2}?(${EXIT_NOUN})\\b`, 'gi');
      // "Exits: no way out of X leads to a mapped place" says where no way leads, not how many doors X has:
      // it hands no count (the commit gate's exitCount.handedExits reads it the same way).
      const counted = !(facts.engineExits && !facts.engineExits.length);
      // "Two doors stood open…, while two more ways out…": an added count ("more", "further") makes the counts a sum
      // (same reading as the commit gate's exitCount.wrongExitCountProblem).
      const parts = [];
      for (const m of counted ? s.matchAll(re) : []) {
        // A claim word belongs to the exit noun in its own clause: in "stalls stretched on both ways, and … no clear way
        // out" the "out" is that other way's; "Three doors stood…, and each one led somewhere" lends its "led" to the doors.
        const claims = (c) => EXIT_CLAIM.test(c) || /\b(?:left|led|leads|lead|ran|out)\b/i.test(c);
        const clauses = clausesOf(s);
        const own = clauses.find((c) => (m.index ?? 0) >= c.from && (m.index ?? 0) < c.to);
        if (!clauses.some((c) => claims(c.text) && (c === own || !EXIT_NOUN_RE.test(c.text)))) continue;
        // "without a single door opening" counts nothing; in "the taller one said the road ahead cost a fee"
        // a new noun phrase starts between the number and the way, so the number does not count it
        // ("only the exits of Lowmarket and the West Wall" is still a count: "only" leads its own noun phrase).
        if (negated(s, m.index ?? 0)) continue;
        // "The stair went down past three locked iron gates": gates passed along the way, not this place's ways onward.
        if (/\b(?:past|through|beyond|along|between|under|over|by)\s+$/i.test(s.slice(0, m.index ?? 0))) continue;
        const between = m[0].slice(m[1].length, m[0].length - m[2].length);
        if (lower(m[1]) !== 'only' && /\b(?:the|a|an|his|her|their|its|this|that|my|your)\b/i.test(between)) continue;
        // Same reading as the commit gate (exitCount.statedExitCount): "the only other way out" leaves out the way in,
        // and "the only way forward / ahead / back" is one direction, not every way out.
        if (/\b(?:other|remaining|of)\b/i.test(between)) continue;
        if (/^\s+(?:on(?!\s+(?:the|a|an|its|their|his|her)\b)|onwards?|ahead|forwards?|back)\b/i.test(s.slice((m.index ?? 0) + m[0].length))) continue;
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
        // "the only path there" / "the only road to Lowmarket" is the one way to a named exit, not the total.
        if (n === 1) {
          const rest = lower(s.slice((m.index ?? 0) + m[0].length));
          const exitNamed = (t) => exitFact.some((p) => p.length >= 4 && t.includes(lower(p)));
          if (/^\s*(?:\w+\s+){0,4}?(?:to\s+(?:get|go|reach)\s+)?there\b/.test(rest) && exitNamed(lower(s))) continue;
          if (/^\s*(?:to|toward|towards|into)\s/.test(rest) && exitNamed(rest.split(/[,;]/)[0])) continue;
          // "Cathedral Close still waited…, and the only road to it…": "it" is the exit the sentence already named.
          if (/^\s*(?:to|toward|towards|into)\s+it\b/.test(rest) && exitNamed(lower(s))) continue;
        }
        if (Number.isFinite(n)) parts.push({ n, more: /\b(?:more|further|additional)\b/i.test(between) });
      }
      const summed = parts.some((p) => p.more);
      const wrong = summed ? parts.reduce((sum, p) => sum + p.n, 0) !== exitFact.length : parts.some((p) => p.n !== exitFact.length);
      if (wrong) {
        const src = facts.engineExits ? `engine result "Exits: ${facts.exitsReceipt}" = ${exitFact.length} mapped way(s) out` : `PLACES exits = ${exitFact.length} (${exitFact.join(', ')})`;
        const conflict = facts.engineExits && facts.placesExits.length !== facts.engineExits.length ? `; packet PLACES line lists ${facts.placesExits.length}` : '';
        add('exit-count', s, `${src}${conflict}`);
      }
      // Places named as a way out that are not this turn's exits.
      if (EXIT_CLAIM.test(s) && !/\b(?:counting|watching|eyeing|checking) the exits\b/i.test(s)) {
        const clauseText = exitClauses.join(' | ');
        const taken = [];
        for (const p of facts.placeNames) {
          const lp = lower(p);
          if (p.length < 4 || facts.hereNames.some((h) => namesHere(p, h))) continue;
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
          // "The back streets led them from the Weighing Cup": the handed start of this turn's move, not a way out.
          const bare = lp.replace(/^the\s+/, '');
          if (facts.movedFrom && lower(facts.movedFrom).includes(bare)
            && /\bfrom\s+(?:the\s+)?(?:\w+\s+){0,2}$/i.test(clauseText.slice(Math.max(0, at - 30), at))) continue;
          // "the roofs of Valespire": the city the handed places sit in is the view, unless the line heads toward it.
          const settlement = facts.placeNames.filter((o) => o !== p && lower(o).startsWith(`${bare} `)).length >= 2;
          if (settlement && !/\b(?:to|toward|towards|into|out to)\s+(?:the\s+)?$/i.test(clauseText.slice(Math.max(0, at - 20), at))) continue;
          add('exit-place', s, `"${p}" named as a way out; handed exits: ${exitFact.length ? exitFact.join(', ') : 'none mapped'}`);
        }
        for (const m of exitClauses.join(' | ').matchAll(/\b(?:the|an?)\s+([a-z]+)\s+(road|trail|path|lane|gate)\b/gi)) {
          const phrase = `${m[1]} ${m[2]}`;
          // An order word ("a third path") counts the ways; it does not name one.
          if (/^(?:first|second|third|fourth|fifth|sixth|final|\w+th)$/i.test(m[1])) continue;
          if (/^(?:only|same|narrow|old|back|main|other|one|first|next|last|open|long|short|wide|far|near|whole|full)$/i.test(m[1])) continue;
          if (facts.allowText.includes(lower(phrase))) continue;
          // "the gate road ran on toward Contract Hall": the road to a handed exit is that way out, not a new one.
          const ahead = lower(clauseText.slice((m.index ?? 0) + m[0].length).split(/[,;|]/)[0]);
          const headsTo = ahead.match(/^\s+(?:\w+\s+){0,3}?(?:to|toward|towards|into)\s+(?:the\s+)?(.+)$/)?.[1] ?? '';
          if (headsTo && exitFact.some((e) => lower(e).replace(/^the\s+/, '').length >= 4 && headsTo.startsWith(lower(e).replace(/^the\s+/, '')))) continue;
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
      // A contraction is its stem word ("I'll" is "I"); a lowercase hyphen tail is not part of the name ("Earth-born" names Earth).
      const words = phrase
        .split(/\s+/)
        .map((w) => w.replace(/[’'](?:s|ll|d|m|ve|re)$/, '').replace(/(?:-[a-z]+)+$/, ''))
        .filter((w) => !/^(?:of|the|de|in)$/i.test(w));
      let test = words.filter((w) => !STOP_CAPS.has(lower(w)));
      if (atStart && test[0] === words[0]) test = test.slice(1);
      if (!test.length) continue;
      const p = test.join(' ');
      if (facts.allowText.includes(lower(p))) continue;
      if (test.every((w) => facts.allowText.includes(lower(w)))) continue;
      // "Two Worn Hand Axes" after a handed Worn Hand Axe is more of that handed thing.
      const handedWhole = (o) => new RegExp(`(?<![a-z])${lower(o).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`).test(facts.allowText);
      if (/s$/.test(p) && [p.replace(/s$/, ''), p.replace(/es$/, '')].some(handedWhole)) continue;
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
        // A gold receipt ("Gold Gained: 16") hands the coins.
        if (/^coins?$/.test(w) && /\bgold gained:?\s*\d+/.test(facts.handedText)) continue;
        const ownerNoun = before.match(/\b(\w+)[’']s\s+(?:\w+\s+){0,2}$/i)?.[1];
        if (ownerNoun && lower(ownerNoun) !== 'jax') continue;
        // "the peeling paper notices": the word only says what a handed thing is made of.
        const head = after.match(/^ ([a-z]+)\b/)?.[1];
        if (head && head.length > 3 && !LINK_WORD.test(head) && !/(?:ed|ly|ing)$/.test(head) && inHanded(facts, head)) continue;
        const owned = /\b(?:their|his|her)\s+(?:\w+\s+){0,2}$/i.test(before);
        // "gave Jax a ring" / "gave a ring to Col" hands a thing; "the bell gave one short ring" is a sound.
        const gaveTail = before.match(/\b(?:handed|gave|gives?)\s+((?:\S+\s+){0,4})$/i)?.[1];
        const gaveTo = gaveTail !== undefined
          && (/^(?:jax|him|her|them|me|you|us|over)\s/i.test(gaveTail) || /^(?!(?:A|An|The)\s)[A-Z]/.test(gaveTail) || /^\s+to\b/i.test(after));
        const foundBefore = gaveTo
          || /\b(?:found|finds?|picked up|took|takes?|hand over|pulled out|drew(?!\s+(?:closer|nearer|near|back|away|level|up|in|around|round|alongside)\b)|held out|carried|wore|wearing)\s+(?:\w+\s+){0,4}$/i.test(before);
        // "the Contract Hall and its papers": a thing's own contents, unless Jax finds or takes them.
        if (/\bits\s+(?:\w+\s+){0,2}$/i.test(before) && !foundBefore) continue;
        // "the paper on the boards" at a notice-board hall: a fitting the place's own line names holds it.
        const fitting = after.match(/^\s+(?:on|in|across|along)\s+(?:the|its)\s+([a-z-]{4,})/i)?.[1]?.replace(/s$/, '');
        if (fitting && !foundBefore && new RegExp(`\\b${fitting}\\b`).test(facts.placeWork)) continue;
        // "set the papers down flat and waited": a verb past "and" is the holder's, not the thing's.
        const found = foundBefore
          || /^\s+(?:(?!(?:and|then|but|while|as|before|after)\b)\w+\s+){0,3}?(?:lay|lying|rested|resting|sat|hidden|tucked|waited)\b/i.test(after);
        if (owned ? !jaxClause : !found) continue;
      }
      // "the fallen beasts" after a handed Rotting Feral Dog Pack is the handed animal foe, not a new one.
      if (kind === 'foe' && /^beasts?$/.test(w) && ANIMAL_FOE.test(facts.handedText)) continue;
      if (kind === 'person') {
        // "a man called Col Thatch": the role word introduces a handed name; "called" is not an action here.
        const named = after.match(/^\s+(?:called|named|known as)\s+([A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*)*)/)?.[1];
        if (named && facts.allowText.includes(lower(named))) continue;
        if (!/^\s+(?:\w+\s+)?(?:stood|said|says|watched|stepped|looked|called|asked|walked|came|sat|nodded|pointed|laughed|turned|waited|kept|held|ran|spoke|told|shouted|blocked|moved)\b/i.test(after)) continue;
        if (foeHanded && /^(?:men|man|women|woman|strangers?)$/.test(w)) continue;
        // "neither man" / "the older man" points back at a handed person here; "a man" / "a tall man" is a new one.
        const personHere = facts.refs.some((r) => r.kind === 'person' && !/^encounter:/.test(r.id));
        if (personHere && /^(?:men|man|women|woman)$/.test(w)
          && /\b(?:the|neither|either|each|both|other|those|these|one|two|three|four)\s+(?:of the\s+)?(?:[a-z]+\s+)?$/i.test(before)) continue;
        // "Two strangers stood…" with exactly two people handed here counts the people here, not new ones.
        const hereCount = facts.refs.filter((r) => r.kind === 'person' && !/^encounter:/.test(r.id)).length;
        const counted = before.match(/\b(two|three|four|both)\s+$/i)?.[1]?.toLowerCase();
        if (counted && ({ two: 2, both: 2, three: 3, four: 4 })[counted] === hereCount) continue;
        if (/\bcrowd\b/.test(facts.handedText) && /\b(?:a|an|one|some|someone|another)\s+(?:\w+\s+)?$/i.test(before)) continue;
        if (PLACE_WORKERS.some(([work, who]) => who.test(w) && work.test(facts.placeWork))) continue;
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
    const moveM = s.match(/\bJax\b[^.]{0,40}?\b(left|arrived|reached|set out|came (?:in)?to|walked (?:back )?(?:in)?to)\b/);
    // "… find Jax before they reached Cathedral Close": a move in a "before" clause had not happened yet.
    const moveLead = moveM ? s.slice(0, (moveM.index ?? 0) + moveM[0].length - moveM[1].length) : '';
    const moveNotYet = moveM && /\bbefore\s+(?:\w+\s+){0,2}$/i.test(moveLead);
    // "Jax faced being left alone at the quay": a passive verb says what happens to Jax, not that Jax moved.
    const movePassive = moveM && /\b(?:be|being|been|is|was|were|are|get|gets|got|getting)\s+$/i.test(moveLead);
    if (facts.noMove && moveM && !moveNotYet && !movePassive) {
      // Whole words only: "the courtyard stones" does not name a place called Court.
      const namesPlace = (p) => new RegExp(`(?<![\\w'-])${lower(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(lower(s));
      const named = facts.placeNames.find((p) => p.length > 3 && namesPlace(p) && !facts.hereNames.some((h) => namesHere(p, h)));
      if (named) add('move', s, `No move this turn: at ${facts.here} before and after`);
    }

    // Lap-3 kinds (same reading as the game's engineFactGate): the travel or quest record read out, the player's
    // choice posed, a fight roll told wrong, a meeting on a quiet stretch, a quote already on the page, the PC's mind decided.
    if (TRAVEL_RECORD.some((re) => re.test(narration))) add('record-read', s, 'travel record (legs / trip time) read out');
    const leak = openSteps.flatMap(stepRuns).find((run) => wordsOf(narration).join(' ').includes(run) && !known.includes(` ${run} `));
    if (leak) add('record-read', s, `open quest step "${leak}" given away; not on the page or in the engine result`);
    if (choicePose.some((re) => re.test(narration))) add('player-choice', s, "poses the player's next choice");
    if (rolls.isFight) {
      const strike = new RegExp(`\\b${who}(?:['’]s|r)?\\s+(?:\\w+\\s+){0,2}?(?:struck|strikes|hit|hits|landed|lands|connected|connects|slashed|slashes|stabbed|stabs|pierced|pierces|wounded|wounds|sliced|slices)\\b${NOT_A_FOE}`, 'i');
      if ((!rolls.pcLanded || rolls.pcCannotAct) && strike.test(narration)) add('roll', s, `a ${pc} blow the engine never landed: ${facts.engineResult.slice(0, 160)}`);
      if (rolls.foeHits > 0 && rolls.foeMisses === 0 && new RegExp(`\\b(?:missed|misses|went wide of|glanced off)\\s+${who}\\b`, 'i').test(narration)) {
        add('roll', s, `a miss on ${pc}; the engine rolled ${rolls.foeHits} hit(s) and no miss`);
      }
    }
    if (/\bquiet stretch\b/i.test(facts.engineResult)) {
      const met = narration.match(new RegExp(`\\b(?:a|an|another|one|two|three|several|some)\\s+(?:[a-z-]+\\s+){0,2}?(${[...PEOPLE, 'figure', 'figures', 'rider', 'riders', 'wagon', 'cart', 'patrol'].join('|')})\\b`, 'i'));
      if (met && !negated(narration, met.index ?? 0)) add('meeting', s, `"${met[0]}" on a quiet stretch (nobody met)`);
    }
    for (const q of s.matchAll(/["“]([^"”]+)["”]/g)) {
      if (q[1].trim().split(/\s+/).length >= 6 && pageText.includes(lower(q[1].trim()))) add('echo', s, 'a quote already on the page, spoken again');
    }
    if (new RegExp(`\\b${who}\\s+(?:decided|realized|realised|resolved|chose)\\b|\\bmade (?:the|this|that|it) (?:\\w+ )?(?:feel|seem)\\b`, 'i').test(narration)) {
      add('agency', s, `the narrator decides ${pc}'s mind`);
    }
  }
  if (rolls.isFight && rolls.foeHits > 0 && !HIT_WORDS.test(prose.replace(/["“][^"”]*["”]/g, ' '))) {
    add('roll', prose.slice(0, 160), `the engine rolled ${rolls.foeHits} hit(s) on ${pc}; the beat shows none`);
  }
  return flags;
}

const TRAVEL_RECORD = [
  /\blegs? (?:one|two|three|four|\d+) of (?:one|two|three|four|\d+)\b/i,
  /\b(?:first|second|third|fourth|final|last|next) leg of the (?:journey|trip|travel|road|route|walk)\b/i,
  /\btravel (?:leg|record|log)\b/i,
  /\bthe (?:travel|journey|trip|walk) (?:had )?(?:took|taken|added|cost)\b/i,
  /\btravel(?:l?ed)? for (?:about |nearly |some |another )?(?:\w+ )?(?:minutes?|hours?)\b/i,
  /\b(?:half|part) of the travel\b/i,
];
const NOT_A_FOE = '(?!\\s+(?:the\\s+|a\\s+)?(?:ground|floor|dirt|mud|earth|stone|stones|wall|road|nothing|air|only))';
const HIT_WORDS = /\b(?:hit|hits|struck|strikes|bit|bites|bitten|cut|cuts|wound\w*|blood\w*|pain\w*|slash\w*|gash\w*|tore|tears?|sank|sinks|pierc\w*|stab\w*|slam\w*|crack\w*|knock\w*|fell|falls?|collaps\w*|drops?|dropped|reel\w*|stagger\w*|burn\w*|sting\w*|ache\w*|hurt\w*)\b/i;
const STEP_STOP = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'onto', 'that', 'this', 'your', 'their', 'his', 'her', 'its', 'are', 'was', 'were', 'has', 'have', 'had', 'what', 'who', 'any', 'all', 'out', 'off', 'not']);
const wordsOf = (s) => (lower(s).match(/[a-z][a-z'’-]+/g) ?? []);
/** Three content words in a row from a quest step: the step's own clue. */
function stepRuns(desc) {
  const w = wordsOf(desc);
  const out = [];
  for (let i = 0; i + 3 <= w.length; i += 1) {
    const run = w.slice(i, i + 3);
    if (run.every((x) => x.length >= 3 && !STEP_STOP.has(x))) out.push(run.join(' '));
  }
  return out;
}
/** What the engine result says the PC and the foes did this turn (same reading as engineFactGate.fightRolls). */
function fightRollsOf(f) {
  return {
    isFight: /\bFight:|ENGINE OUTCOME|\battacks you\b|\bhits you\b|\bYou attack\b|\bYou hit\b|\bunconscious\b|\bdeath save\b/i.test(f),
    pcLanded: /\bYou (?:hit|land a critical blow on|cast)\b|\bYour blow carries\b|\bEven your miss clips\b|\bonly partly escapes\b/.test(f),
    pcCannotAct: /\bcannot move, speak or act\b|\bYou are dead\b|\bYour breath stops\b|\bYou cannot move or act\b/.test(f),
    foeHits: (f.match(/\b(?:hits|lands a critical blow on) you\b/g) ?? []).length,
    foeMisses: (f.match(/\battacks you\b[^.]*\band misses\b/g) ?? []).length,
  };
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
