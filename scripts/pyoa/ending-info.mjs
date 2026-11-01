import { readFileSync } from 'node:fs';
import { lintBook } from './lint-book.mjs';
const book = JSON.parse(readFileSync('content/pyoa/umbra/base.json','utf8'));
const r = lintBook(book);
for (const n of book.nodes.filter(n=>n.endingId)) {
  const inE = book.nodes.filter(m=>m.exits.some(e=>e.to===n.id)).map(m=>m.id);
  console.log(n.id, '\n  from:', inE.join(', '), '\n  poss:', JSON.stringify(r.possible[n.id]));
  console.log('  page:', n.page.slice(0,400));
}
