#!/usr/bin/env node
/**
 * q71-TRAINLOG — prove writerDataset.mjs row builder still produces the same keys
 * for a fixed run-folder fixture (no new required field). Does not append to the live dataset.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve('.');
const fixture = join(root, 'scripts', 'fixtures', 'writer-dataset-trainlog');
const outDir = resolve('data', 'writer-dataset');
const outTurns = join(outDir, 'turns.jsonl');
const backup = join(outDir, 'turns.jsonl.trainlog-bak');

mkdirSync(fixture, { recursive: true });
mkdirSync(join(fixture, 'writer-prompts'), { recursive: true });

const meta = {
  bibleId: 'summoned-pact',
  seed: 1,
  engineMode: 'litrpg',
  writer: { model: 'deepseek/deepseek-v4.1-flash' },
  runManifest: { buildStamp: 'test-stamp' },
};
writeFileSync(join(fixture, 'meta.json'), JSON.stringify(meta) + '\n');
writeFileSync(
  join(fixture, 'turns.jsonl'),
  JSON.stringify({
    turn: 1,
    playerInput: 'Look around',
    location: 'Hall',
    gmText: 'You look.',
    teacher_model: 'deepseek/deepseek-v4.1-flash',
    training_ok: true,
    writerUsage: { tokensIn: 10, tokensOut: 5, tokensCached: 0, modelId: 'deepseek/deepseek-v4.1-flash' },
  }) + '\n'
);
writeFileSync(join(fixture, 'writer-prompts', 'turn-00.txt'), 'packet\n');
writeFileSync(
  join(fixture, 'factcheck.json'),
  JSON.stringify({ score: 100, perTurn: [{ turn: 1, flags: [], packet: 'turn-00.txt' }] }) + '\n'
);
writeFileSync(join(fixture, 'thumbs.json'), JSON.stringify({ turns: [] }) + '\n');

mkdirSync(outDir, { recursive: true });
const hadOut = existsSync(outTurns);
if (hadOut) {
  writeFileSync(outTurns, readFileSync(outTurns));
  writeFileSync(outTurns, '');
}

const res = spawnSync(process.execPath, [join('scripts', 'writerDataset.mjs'), fixture], {
  cwd: root,
  encoding: 'utf8',
});
if (res.status !== 0) {
  console.error(res.stdout || '');
  console.error(res.stderr || '');
  if (hadOut && existsSync(backup)) writeFileSync(outTurns, readFileSync(backup));
  process.exit(res.status ?? 1);
}

const outAudit = join(outDir, 'audit.jsonl');
const accepted = existsSync(outTurns) ? readFileSync(outTurns, 'utf8').trim() : '';
if (accepted) {
  console.error('source-less fixture was written to the eligible file');
  process.exit(1);
}
const auditText = existsSync(outAudit) ? readFileSync(outAudit, 'utf8').trim() : '';
const line = auditText.split(/\r?\n/).filter(Boolean).pop();
if (!line) {
  console.error('source-less fixture produced no audit row');
  process.exit(1);
}
const row = JSON.parse(line);
const required = [
  'pairKey',
  'runId',
  'turn',
  'mode',
  'bible',
  'writerId',
  'writerModel',
  'good',
  'training_ok',
  'teacher_model',
  'provider',
  'admitted',
  'admission_status',
  'admission_reasons',
];
const missing = required.filter((k) => !(k in row));
if (missing.length) {
  console.error('writerDataset row missing keys:', missing.join(', '));
  process.exit(1);
}
if (row.admitted !== false || row.admission_status !== 'audit') {
  console.error('source-less fixture was admitted', row.admission_status);
  process.exit(1);
}
if (!row.admission_reasons.includes('missing source') || !row.admission_reasons.includes('stored training_ok is not consent')) {
  console.error('audit reasons', row.admission_reasons);
  process.exit(1);
}
if (row.training_ok === true) {
  console.error('a turn with no writer call was given a trainable licence flag');
  process.exit(1);
}
for (const banned of ['messages', 'job', 'judge_scores', 'engine_facts', 'playerInput', 'prose', 'writerPacket', 'writerPacketFile', 'location']) {
  if (banned in row) {
    console.error(`audit row copied ${banned}`);
    process.exit(1);
  }
}
if (auditText.includes('Look around') || auditText.includes('You look.') || auditText.includes('packet')) {
  console.error('audit row copied private text');
  process.exit(1);
}
console.log('writerDataset row keys OK; source-less row stayed in audit');

if (hadOut && existsSync(backup)) writeFileSync(outTurns, readFileSync(backup));
else if (!hadOut && existsSync(outTurns)) writeFileSync(outTurns, '');
if (existsSync(backup)) rmSync(backup);
if (existsSync(outAudit)) rmSync(outAudit);
rmSync(fixture, { recursive: true, force: true });
