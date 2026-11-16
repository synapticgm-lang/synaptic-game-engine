import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CAPTURE_BASES,
  CAPTURE_CALL_KINDS,
  CAPTURE_COMPLETION_STATUSES,
  CAPTURE_KEY_SOURCES,
  CAPTURE_STATUSES,
  TRAINING_RIGHTS,
} from './trainingCaptureVocab';
import { HOST_TRAINING_RIGHTS } from './trainingRights';

const ROOT = path.join(__dirname, '..', '..');
const MIGRATION = fs.readFileSync(path.join(ROOT, 'supabase/migrations/025_gm_turn_captures.sql'), 'utf8');
const CAPTURE_EDGE = fs.readFileSync(path.join(ROOT, 'supabase/functions/_shared/trainingCapture.ts'), 'utf8');
const PRIVILEGES_EDGE = fs.readFileSync(path.join(ROOT, 'supabase/functions/_shared/playPrivileges.ts'), 'utf8');

/** Values listed in `check (<column> in ('a', 'b', …))` in the migration. */
function checkList(column: string): string[] {
  const m = MIGRATION.match(new RegExp(`check\\s*\\(\\s*${column}\\s+in\\s*\\(([^)]*)\\)`, 'i'));
  if (!m) throw new Error(`no CHECK list for ${column}`);
  return [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]);
}

/** Body of a top-level function in a source file (up to the next top-level declaration). */
function fnBody(src: string, name: string): string {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`no function ${name}`);
  const rest = src.slice(start);
  const end = rest.slice(1).search(/\n(?:export |async |function |const |type )/);
  return end < 0 ? rest : rest.slice(0, end + 1);
}

describe('gm_turn_captures CHECK constraints match the one vocabulary', () => {
  it.each([
    ['capture_basis', CAPTURE_BASES],
    ['call_kind', CAPTURE_CALL_KINDS],
    ['rights', TRAINING_RIGHTS],
    ['key_source', CAPTURE_KEY_SOURCES],
    ['status', CAPTURE_STATUSES],
    ['completion_status', CAPTURE_COMPLETION_STATUSES],
  ] as const)('%s', (column, values) => {
    expect([...checkList(column)].sort()).toEqual([...values].sort());
  });

  it('every consent basis the edge code can return is in the vocabulary (test accounts included)', () => {
    const returned = [
      ...[...fnBody(CAPTURE_EDGE, 'captureBasis').matchAll(/return\s+'([a-z_]+)'/g)].map((m) => m[1]),
      ...[...fnBody(PRIVILEGES_EDGE, 'lookupBasis').matchAll(/(?:return|\?)\s+'([a-z_]+)'/g)].map((m) => m[1]),
    ];
    expect(returned).toEqual(expect.arrayContaining(['founder', 'staff', 'test', 'opt_in']));
    for (const basis of returned) expect(CAPTURE_BASES).toContain(basis);
  });

  it('the host rights table only uses the vocabulary', () => {
    for (const r of Object.values(HOST_TRAINING_RIGHTS)) expect(TRAINING_RIGHTS).toContain(r);
  });

  it('the edge capture code takes its types from the shared vocabulary, not its own literals', () => {
    expect(CAPTURE_EDGE).toMatch(/from '\.\/gm\/trainingCaptureVocab\.ts'/);
    expect(CAPTURE_EDGE).not.toMatch(/type CaptureBasis\s*=/);
    const rowSrc = fs.readFileSync(path.join(__dirname, 'trainingCaptureRow.ts'), 'utf8');
    expect(rowSrc).toMatch(/from '\.\/trainingCaptureVocab'/);
    expect(rowSrc).not.toMatch(/type (?:CaptureBasis|CaptureCallKind|TrainingRights)\s*=/);
  });
});
