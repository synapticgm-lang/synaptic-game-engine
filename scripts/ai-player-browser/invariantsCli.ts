/**
 * q76c-WIRE-AUDIT — one-shot CLI for the mega harness (vite-node).
 * Reads { before, after, turn } JSON path from argv[2]; prints InvariantViolation[].
 * No OpenRouter. Credits: checkTurnInvariants (q76a); vite-node (MIT) as the runner.
 */
import { readFileSync } from 'node:fs';
import { checkTurnInvariants } from '../../src/game/invariants/turnInvariants';
import type { GameState } from '../../src/game/types';
import type { TurnInvariantInput } from '../../src/game/invariants/turnInvariants';

const path = process.argv[2];
if (!path) {
  process.stderr.write('usage: invariantsCli.ts <payload.json>\n');
  process.exit(2);
}
const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const raw = JSON.parse(text) as {
  before: GameState;
  after: GameState;
  turn: TurnInvariantInput;
};
const hits = checkTurnInvariants(raw.before, raw.after, raw.turn);
process.stdout.write(JSON.stringify(hits));
