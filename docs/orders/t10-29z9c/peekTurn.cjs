// node peekTurn.cjs <check-folder> <run-substring> <turn> <regex>
const fs = require('fs');
const path = require('path');
const [root, run, turn, re] = process.argv.slice(2);
const dir = fs.readdirSync(root).find((d) => d.includes(run) && fs.existsSync(path.join(root, d, 'turns.jsonl')));
const row = fs.readFileSync(path.join(root, dir, 'turns.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse)
  .find((t) => t.turn === Number(turn));
const s = JSON.stringify(row);
for (const m of s.matchAll(new RegExp(re, 'g'))) console.log(m[0]);
