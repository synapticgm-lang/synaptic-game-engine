import { ask } from './gem.mjs';
const r = await ask('Write two sentences, second person present tense, about a lamplighter walking a foggy street at dusk. Plain text only.', { fresh: true });
console.log(r);

