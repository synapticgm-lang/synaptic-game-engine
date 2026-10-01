// node bumpStamp.cjs <old> <new> — exact stamp only (old not followed by a letter/digit).
const { execSync } = require('child_process');
const fs = require('fs');
const [from, to] = process.argv.slice(2);
const files = execSync(`git grep -l "${from}" -- src index.html public`, { encoding: 'utf8' }).split('\n').filter(Boolean);
const re = new RegExp(`${from.replace(/[-]/g, '\\-')}(?![a-z0-9])`, 'g');
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const next = src.replace(re, to);
  if (next !== src) {
    fs.writeFileSync(f, next);
    console.log(f);
  }
}
