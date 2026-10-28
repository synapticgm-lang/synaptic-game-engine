import { ask, lastModel } from './gem.mjs';
try { const t = await ask('Reply with exactly: PRO-OK', { model: 'Pro', timeoutMs: 180000 }); console.log('MODEL>>', (await import('./gem.mjs')).lastModel); console.log('REPLY>>', t.slice(0,300)); }
catch (e) { console.log('ERR>>', e.kind, e.message); }
