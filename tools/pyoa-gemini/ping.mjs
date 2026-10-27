import { ask } from './gem.mjs';
const t = await ask('Reply with exactly: GEMINI-OK');
console.log('REPLY>>', t.slice(0,300));
