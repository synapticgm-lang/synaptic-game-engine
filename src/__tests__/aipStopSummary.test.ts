/**
 * 00:33 decision: the early-stop summaries in playBible (stopReset, stopSetup, ...) must only read state that is
 * declared before them. 90cce470 crashed the tabletop smoke with "thumbsSkipped is not defined" because stopReset
 * (built before the turn loop's try block) read a counter declared inside that block. Also: a tabletop creation
 * (setup) step before the name step is not a game reset.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import { assessGameReset, lockGameIdentity } from '../../scripts/ai-player-browser/run.mjs';

const SRC = fs.readFileSync(path.resolve(__dirname, '../../scripts/ai-player-browser/run.mjs'), 'utf8');

function walk(node, fn, parent) {
  if (!node || typeof node.type !== 'string') return;
  fn(node, parent);
  for (const k of Object.keys(node)) {
    const v = (node as any)[k];
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && walk(c, fn, node));
    else if (v && typeof v.type === 'string') walk(v, fn, node);
  }
}
const namesOf = (pat: any, out: Set<string>) => walk(pat, (n, p) => { if (n.type === 'Identifier' && !(p?.type === 'Property' && p.key === n && !p.shorthand)) out.add(n.name); });

describe('aip stop summaries read declared state', () => {
  const ast: any = parse(SRC, { ecmaVersion: 'latest', sourceType: 'module' });
  const playBible = ast.body.map((s: any) => s.declaration ?? s).find((s: any) => s.type === 'FunctionDeclaration' && s.id?.name === 'playBible');

  it('every identifier an early-stop summary reads is declared before it (playBible params, earlier lets, or module scope)', () => {
    expect(playBible).toBeTruthy();
    const moduleNames = new Set<string>();
    for (const s of ast.body) {
      const d = s.declaration ?? s;
      if (d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration') moduleNames.add(d.id.name);
      if (d.type === 'VariableDeclaration') d.declarations.forEach((x: any) => namesOf(x.id, moduleNames));
      if (s.type === 'ImportDeclaration') s.specifiers.forEach((x: any) => moduleNames.add(x.local.name));
    }
    const declared = new Set<string>([...moduleNames]);
    playBible.params.forEach((p: any) => namesOf(p, declared));
    const globals = new Set(['String', 'Number', 'Boolean', 'Math', 'Date', 'JSON', 'Object', 'Array', 'console', 'process', 'undefined', 'Promise', 'Set', 'Map', 'RegExp', 'Error']);
    const summaries: string[] = [];
    const missing: string[] = [];
    for (const stmt of playBible.body.body) {
      if (stmt.type === 'TryStatement') break; // the turn loop; helpers inside it see its own lets
      if (stmt.type === 'VariableDeclaration') {
        for (const d of stmt.declarations) {
          const isHelper = d.init && (d.init.type === 'ArrowFunctionExpression' || d.init.type === 'FunctionExpression');
          if (isHelper && /^stop/.test(d.id.name ?? '')) {
            summaries.push(d.id.name);
            const local = new Set<string>();
            d.init.params.forEach((p: any) => namesOf(p, local));
            walk(d.init.body, (n: any) => { if (n.type === 'VariableDeclarator') namesOf(n.id, local); });
            walk(d.init.body, (n: any, p: any) => {
              if (n.type !== 'Identifier') return;
              if (p?.type === 'MemberExpression' && p.property === n && !p.computed) return;
              if (p?.type === 'Property' && p.key === n && !p.shorthand) return;
              if (!declared.has(n.name) && !local.has(n.name) && !globals.has(n.name)) missing.push(`${d.id.name}: ${n.name}`);
            });
          }
          namesOf(d.id, declared);
        }
      }
    }
    expect(summaries.length, 'found the early-stop summary helpers before the turn loop').toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  it('thumbsSkipped and overlayBlockedThisTurn are declared before the turn loop try block', () => {
    const before: string[] = [];
    for (const stmt of playBible.body.body) {
      if (stmt.type === 'TryStatement') break;
      if (stmt.type === 'VariableDeclaration') stmt.declarations.forEach((d: any) => d.id?.name && before.push(d.id.name));
    }
    expect(before).toEqual(expect.arrayContaining(['thumbsSkipped', 'overlayBlockedThisTurn', 'unverified', 'harnessErrors', 'softWarnings', 'autoFightFired', 'completed']));
  });
});

describe('aip reset guard and setup steps', () => {
  it('tabletop creation (setup) then the name step is not a game reset', () => {
    let id = lockGameIdentity(null, { saveId: 's1', gmStoryCount: 1, nameStep: false, setup: true });
    id = lockGameIdentity(id, { saveId: 's1', gmStoryCount: 1, nameStep: false, setup: true });
    expect(assessGameReset(id, { saveId: 's1', gmStoryCount: 1, nameStep: true, setup: false }, 3)).toBeNull();
  });
  it('the name step coming back after real play is still a reset', () => {
    let id = lockGameIdentity(null, { saveId: 's1', gmStoryCount: 1, nameStep: true, setup: false });
    id = lockGameIdentity(id, { saveId: 's1', gmStoryCount: 3, nameStep: false, setup: false });
    expect(assessGameReset(id, { saveId: 's1', gmStoryCount: 3, nameStep: true }, 9)?.evidence).toContain('name_step');
  });
});
