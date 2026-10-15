/**
 * mode-gap step 4: LitRPG named skills from the skill library (docs/library/skills), grown by skill XP (SK-5),
 * evolving at Master 10 into the library's technique, with the library's costs and cooldowns, and at most one
 * notice a turn. LitRPG tapes: summoned-pact s150 (private window, skills on), s76 (leftover pocket), s78 (worn
 * device, skills off). Tabletop cursed-keep ds151 gets no named skills; Story RPG can grow skill XP (SK-5).
 * Lines are the tapes' own player lines (s76 T3 "Search the area", T6 "Wait and watch", s78 T2 "Read the device").
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from '../../game/arcDirector';
import { runPlayerCheck } from '../../game/checkMath';
import { parsePlayerIntent } from '../../game/intentParser';
import { progressPanel } from '../../game/progressPanel';
import { buildLitrpgSystemWindow, shouldAttachLitrpgSystemWindow, SYSTEM_WINDOW_MAX_LINES } from '../../game/litrpgSystemWindow';
import {
  BASE_SKILLS,
  LIBRARY_ENTRIES,
  NAMED_SKILL_EVOLVE_LEVEL,
  NAMED_SKILL_RANK_CAP,
  evolutionOf,
  libraryEntry,
  matchBaseSkill,
  techniqueReady,
} from '../../game/rules/librarySkills';
import { settleSkillUse, xpForLevel } from '../../game/rules/skillGrowth';
import type { GameState, NamedSkillState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const LIT150 = '2026-10-12T17-05-53-021Z_summoned-pact_cold-system_s150';
const S76 = '2026-10-07T16-15-12-290Z_summoned-pact_cold-system_s76';
const S78 = '2026-10-10T22-29-55-148Z_summoned-pact_cold-system_s78';
const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';
const RPG_DS150 = '2026-10-13T14-15-18-792Z_salt-road-heist_chilled-gm_s150';

const LIBRARY = join(__dirname, '..', '..', '..', 'docs', 'library', 'skills', 'data');

let L: Replay;
let P: Replay;
let W: Replay;
let T: Replay;
let R: Replay;
beforeAll(async () => {
  [L, P, W, T, R] = [
    new Replay(await replayWhole(LIT150)),
    new Replay(await replayWhole(S76)),
    new Replay(await replayWhole(S78)),
    new Replay(await replayWhole(TT_DS151)),
    new Replay(await replayWhole(RPG_DS150)),
  ];
}, 900_000);

function calm(r: Replay): GameState {
  const s = [...r.turns()].reverse().map((t) => r.after(t)).find((x) => !x.activeEncounter && !x.roundCombat);
  if (!s) throw new Error('no calm turn on tape');
  return s;
}

function turn(
  s: GameState,
  input: string,
  skillOpts: { d20?: number; success?: boolean; longShot?: boolean } = { d20: 20, success: true },
) {
  const arc = runArcDirectorBeforeGm(s, input, skillOpts);
  return { arc, state: { ...arc.state, turn: (arc.state.turn ?? 0) + 1 }, status: formatArcStatusReceipts(arc) };
}

const at = (s: GameState, place: string): GameState => ({ ...s, currentLocation: place, activeDungeon: null } as GameState);
const rec = (s: GameState, id: string) => (s.character.namedSkills ?? []).find((r) => r.id === id);
const withSkill = (s: GameState, r: NamedSkillState): GameState => ({ ...s, character: { ...s.character, namedSkills: [r] } });

/** A small JSON Schema (draft 2020-12) checker for the keywords the library schema uses. */
function schemaErrors(root: Record<string, unknown>, value: unknown): string[] {
  const errs: string[] = [];
  const type = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
  const typeOk = (t: string, v: unknown) => t === type(v) || (t === 'number' && type(v) === 'integer');
  const deref = (s: any): any => (s?.$ref ? s.$ref.replace(/^#\//, '').split('/').reduce((o: any, k: string) => o[k], root) : s);
  const ok = (s: any, v: unknown) => check(s, v, '', []).length === 0;
  function check(raw: any, v: any, path: string, out: string[]): string[] {
    if (raw === true || raw == null) return out;
    if (raw === false) { out.push(`${path}: never`); return out; }
    const { $ref, ...siblings } = raw;
    const s = $ref ? { ...deref(raw), ...siblings } : raw;
    if (s.type && !(Array.isArray(s.type) ? s.type : [s.type]).some((t: string) => typeOk(t, v))) out.push(`${path}: type ${type(v)} not ${s.type}`);
    if ('const' in s && JSON.stringify(s.const) !== JSON.stringify(v)) out.push(`${path}: const`);
    if (s.enum && !s.enum.some((e: unknown) => JSON.stringify(e) === JSON.stringify(v))) out.push(`${path}: enum ${JSON.stringify(v)}`);
    if (typeof v === 'string') {
      if (s.minLength != null && v.length < s.minLength) out.push(`${path}: minLength`);
      if (s.pattern && !new RegExp(s.pattern, 'u').test(v)) out.push(`${path}: pattern`);
    }
    if (typeof v === 'number') {
      if (s.minimum != null && v < s.minimum) out.push(`${path}: minimum`);
      if (s.maximum != null && v > s.maximum) out.push(`${path}: maximum`);
    }
    if (Array.isArray(v)) {
      if (s.minItems != null && v.length < s.minItems) out.push(`${path}: minItems`);
      if (s.maxItems != null && v.length > s.maxItems) out.push(`${path}: maxItems`);
      if (s.uniqueItems && new Set(v.map((x) => JSON.stringify(x))).size !== v.length) out.push(`${path}: uniqueItems`);
      const pre = s.prefixItems ?? [];
      v.forEach((x, i) => (i < pre.length ? check(pre[i], x, `${path}/${i}`, out) : s.items !== undefined && check(s.items, x, `${path}/${i}`, out)));
      if (s.contains && !v.some((x) => ok(s.contains, x))) out.push(`${path}: contains`);
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const k of s.required ?? []) if (!(k in v)) out.push(`${path}: missing ${k}`);
      for (const [k, x] of Object.entries(v)) {
        if (s.propertyNames && !ok(s.propertyNames, k)) out.push(`${path}: property name ${k}`);
        if (s.properties && k in s.properties) check(s.properties[k], x, `${path}/${k}`, out);
        else if (s.additionalProperties !== undefined) check(s.additionalProperties, x, `${path}/${k}`, out);
      }
    }
    for (const sub of s.allOf ?? []) check(sub, v, path, out);
    if (s.anyOf && !s.anyOf.some((sub: any) => ok(sub, v))) out.push(`${path}: anyOf`);
    if (s.oneOf && s.oneOf.filter((sub: any) => ok(sub, v)).length !== 1) out.push(`${path}: oneOf`);
    if (s.not && ok(s.not, v)) out.push(`${path}: not`);
    if (s.if && ok(s.if, v) && s.then) check(s.then, v, path, out);
    if (s.if && !ok(s.if, v) && s.else) check(s.else, v, path, out);
    return out;
  }
  return check(root, value, '', errs);
}

describe('replay bank mode-gap 4 (LitRPG named skills from the skill library)', () => {
  it('[library | mode-gap 4] every library entry passes schema v3; the engine loads Batches 2â€“5 and invents no skill', () => {
    const schema = JSON.parse(readFileSync(join(LIBRARY, 'library-entry-schema-v3.json'), 'utf8'));
    const counts: number[] = [];
    const disk: unknown[] = [];
    for (const n of [1, 2, 3, 4, 5]) {
      const entries = JSON.parse(readFileSync(join(LIBRARY, `batch${n}-entries.json`), 'utf8')) as unknown[];
      counts.push(entries.length);
      for (const e of entries) expect(schemaErrors(schema, e), (e as { identity: { id: string } }).identity.id).toEqual([]);
      if (n > 1) disk.push(...entries);
    }
    expect(counts).toEqual([24, 28, 29, 32, 33]);
    expect(LIBRARY_ENTRIES).toEqual(disk);
    expect(BASE_SKILLS.map((b) => b.identity.kind)).toEqual(BASE_SKILLS.map(() => 'skill'));
    expect(BASE_SKILLS.length).toBe(30);
    for (const b of BASE_SKILLS) {
      expect(b.balance.tier).toBe(1);
      expect(b.bookkeeping.allowed_modes).toContain('litrpg');
      const evo = evolutionOf(b.identity.id);
      if (evo) expect(evo.getting.prerequisites).toMatch(new RegExp(b.identity.name.replace(/[()]/g, '.'), 'i'));
    }
  });

  it('[library | mode-gap 4] evolution follows the library prerequisites at the cap; no line in the library means no evolution', () => {
    const into = (id: string) => evolutionOf(id)?.identity.id ?? null;
    expect(into('searching')).toBe('thorough_search');
    expect(into('jumping')).toBe('long_leap');
    expect(into('dodge')).toBe('evasive_step');
    expect(into('meditation')).toBe('calm_breath');
    expect(into('listening')).toBe('danger_sense');
    expect(into('mental_fortitude')).toBe('clear_the_mind');
    for (const none of ['balance', 'lifting_and_breaking', 'smelling', 'tasting', 'tracking', 'temperance']) expect(into(none)).toBeNull();
    expect(NAMED_SKILL_RANK_CAP).toBe(3);
    expect(NAMED_SKILL_EVOLVE_LEVEL).toBe(50);
    expect(libraryEntry('evasive_step')?.using.cooldown?.word).toBe('once per scene');
  });

  it('[litrpg s150 | mode-gap 4] the tape\'s "Search the area" grows Searching by skill XP: level 1 with one notice, STATUS, writer fact and a repainted window', () => {
    const line = P.input(3);
    expect(line).toBe('Search the area');
    const s = calm(L);
    expect(s.engineMode).toBe('litrpg');
    expect(rec(s, 'searching')).toBeUndefined();
    expect(progressPanel(s).namedSkills).toEqual([]);
    expect(matchBaseSkill(s, line)?.identity.id).toBe('searching');
    // Untrained → first success enters Novice 1 (SK-5).
    const near = withSkill(s, { id: 'searching', rank: 0, uses: 0, level: 0, xp: 0 });
    const up = turn(near, line);
    expect(rec(up.state, 'searching')).toMatchObject({ level: 1, rank: 1 });
    const notices = up.status.filter((l) => /Searching/.test(l));
    expect(notices).toEqual(['Skill up: Searching, Novice 1.']);
    expect(JSON.stringify(up.arc)).toMatch(/ENGINE RESULT[^"]*raised the skill Searching to Novice 1/);
    expect(shouldAttachLitrpgSystemWindow({ state: up.state, systemLog: up.status })).toBe(true);
    const lines = buildLitrpgSystemWindow(up.state)!.lines;
    expect(lines.find((l) => l.startsWith('Skills: '))).toMatch(/^Skills: Searching 1\b/);
    expect(lines.length).toBeLessThanOrEqual(SYSTEM_WINDOW_MAX_LINES);
    expect(progressPanel(up.state).namedSkills).toEqual([{ key: 'searching', label: 'Searching', rank: 1, note: null }]);
  });

  it('[litrpg s150 | mode-gap 4] a repeat of the same line in the same scene is not counted; travel, a status read and talk never count', () => {
    const s = calm(L);
    const search = P.input(3);
    const once = turn(s, search).state;
    const xpOnce = rec(once, 'searching')?.xp ?? 0;
    const levelOnce = rec(once, 'searching')?.level ?? 0;
    const again = turn(once, search).state;
    expect(rec(again, 'searching')?.xp).toBe(xpOnce);
    expect(rec(again, 'searching')?.level).toBe(levelOnce);
    expect(W.input(2)).toBe('Read the device');
    expect(L.input(8)).toBe('Walk on');
    for (const line of [W.input(2), L.input(8), L.input(10), L.input(21), L.input(9)]) {
      expect(turn(s, line).state.character.namedSkills ?? [], line).toEqual(s.character.namedSkills ?? []);
    }
  });

  it('[litrpg s150 | mode-gap 4] a ranked skill adds its rank to the check; before rank 1 it adds nothing', () => {
    const s = calm(L);
    const line = P.input(6);
    expect(line).toBe('Wait and watch');
    const intent = parsePlayerIntent(line, s);
    const bare = runPlayerCheck(s, intent, line, 10);
    expect(bare.record?.mods.some((m) => /Spotting/.test(m.label))).toBe(false);
    const ranked = withSkill(s, { id: 'spotting', rank: 2, uses: 5, level: 15, xp: 0 });
    const r = runPlayerCheck(ranked, intent, line, 10);
    expect(r.record?.mods.find((m) => m.label === 'Spotting 2')?.value).toBe(2);
    expect(r.modifier).toBe(bare.modifier + 2);
    expect(r.record?.advState).toBe(bare.record?.advState);
  });

  it('[litrpg s150 | mode-gap 4] at Master 10 the skill evolves into its library technique, with one notice that turn', () => {
    const s = withSkill(calm(L), {
      id: 'searching',
      rank: 3,
      uses: 0,
      level: NAMED_SKILL_EVOLVE_LEVEL - 1,
      xp: xpForLevel(NAMED_SKILL_EVOLVE_LEVEL - 1) - 1,
    });
    // On-level Master task so the last XP bar fills (a Novice search is grey at 49).
    const settled = settleSkillUse(s, P.input(3), { success: true, taskLevel: NAMED_SKILL_EVOLVE_LEVEL - 1 });
    const r = {
      state: { ...settled.state, turn: (settled.state.turn ?? 0) + 1 },
      status: settled.receipts,
    };
    expect(rec(r.state, 'searching')).toMatchObject({ level: NAMED_SKILL_EVOLVE_LEVEL, rank: 3, evolvedTo: 'thorough_search' });
    expect(r.status).toEqual(['Technique learned: Thorough Search (Searching evolved).']);
    expect(buildLitrpgSystemWindow(r.state)!.lines.find((l) => l.startsWith('Skills: '))).toMatch(/^Skills: Thorough Search\b/);
    expect(progressPanel(r.state).namedSkills[0]).toEqual({ key: 'searching', label: 'Thorough Search', rank: null, note: 'from Searching, 1 MP' });
    const capped = settleSkillUse(at(r.state, 'Ash Quay'), P.input(3), { success: true, taskLevel: NAMED_SKILL_EVOLVE_LEVEL }).state;
    expect(rec(capped, 'searching')?.level).toBe(NAMED_SKILL_EVOLVE_LEVEL);
  });

  it('[litrpg s150 | mode-gap 4] an evolved technique gives advantage, pays its library cost, and stops when it cannot be paid', () => {
    const base = withSkill(calm(L), { id: 'searching', rank: 3, uses: 9, level: 50, xp: 0, evolvedTo: 'thorough_search' });
    const line = P.input(3);
    const intent = parsePlayerIntent(line, base);
    const chk = runPlayerCheck(base, intent, line, 10);
    expect(chk.record?.mods.find((m) => m.label === 'Thorough Search')?.value).toBe(3);
    expect(chk.record?.advState).toBe('advantage');
    const r = turn(base, line);
    expect(r.state.character.mp).toBe(base.character.mp - 1);
    expect(r.status).toContain('Technique used: Thorough Search (1 MP).');
    const dry = { ...base, character: { ...base.character, mp: 0 } };
    expect(techniqueReady(dry, rec(dry, 'searching')!)).toBe(false);
    expect(runPlayerCheck(dry, intent, line, 10).record?.advState).not.toBe('advantage');
    const after = turn(dry, line);
    expect(after.state.character.mp).toBe(0);
    expect(after.status.join('\n')).not.toMatch(/Technique used/);
  });

  it('[litrpg s150 | mode-gap 4] cooldowns follow the library: once per scene comes back in a new scene; once per day after a rest or a new day', () => {
    const s = withSkill(calm(L), { id: 'dodge', rank: 3, uses: 9, level: 50, xp: 0, evolvedTo: 'evasive_step' });
    const first = turn(s, 'Dodge the blow');
    expect(first.status).toContain('Technique used: Evasive Step (once per scene).');
    expect(techniqueReady(first.state, rec(first.state, 'dodge')!)).toBe(false);
    expect(turn(first.state, 'Dodge the blow').status.join('\n')).not.toMatch(/Technique used/);
    expect(techniqueReady(at(first.state, 'Ash Quay'), rec(first.state, 'dodge')!)).toBe(true);
    const tough = withSkill(calm(L), { id: 'pain_tolerance', rank: 3, uses: 9, level: 50, xp: 0, evolvedTo: 'stay_on_your_feet' });
    const used = settleSkillUse(tough, 'Grit your teeth and push through the pain', { success: true }).state;
    const r = rec(used, 'pain_tolerance')!;
    expect(techniqueReady(at(used, 'Ash Quay'), r)).toBe(false);
    const day = Number(used.worldLedger?.clock?.day ?? 0);
    const tomorrow = { ...used, worldLedger: { ...used.worldLedger!, clock: { ...used.worldLedger!.clock, day: day + 1 } } };
    expect(techniqueReady(tomorrow, r)).toBe(true);
    const rested = settleSkillUse(used, 'Look around', { rested: true }).state;
    expect(rec(rested, 'pain_tolerance')?.usedAt).toBeUndefined();
  });

  it('[litrpg s76 + s78 | mode-gap 4] a housing with skills off grows them in secret: no notice, no fact, nothing on the window or panel', () => {
    for (const r of [P, W]) {
      const s = calm(r);
      expect(['leftover_pocket', 'worn_device']).toContain(s.systemHousing?.housing);
      const seeded = withSkill(at(s, 'Gate Market'), { id: 'searching', rank: 0, uses: 0, level: 0, xp: 0 });
      const up = turn(seeded, P.input(3));
      expect(rec(up.state, 'searching')?.level).toBe(1);
      expect(up.status.join('\n')).not.toMatch(/Searching|Skill up|Skill rank up/);
      expect(JSON.stringify(up.arc)).not.toMatch(/skill Searching/);
      expect(progressPanel(up.state).namedSkills).toEqual([]);
      expect((buildLitrpgSystemWindow(up.state)?.lines ?? []).some((l) => /Searching/.test(l))).toBe(false);
    }
  });

  it('[tabletop ds151 | mode-gap 4] tabletop writes no named skill XP; Story RPG may grow skills (SK-5)', () => {
    const ttLine = T.input(4);
    expect(ttLine).toBe('Search the area');
    const tt = withSkill(calm(T), { id: 'searching', rank: 3, uses: 9, level: 21, xp: 0, evolvedTo: 'thorough_search' });
    expect(tt.engineMode).toBe('dnd');
    const plain = { ...tt, character: { ...tt.character, namedSkills: undefined } };
    const intent = parsePlayerIntent(ttLine, tt);
    expect(runPlayerCheck(tt, intent, ttLine, 10).record).toEqual(runPlayerCheck(plain, intent, ttLine, 10).record);
    const afterTt = turn(plain, ttLine);
    expect(afterTt.state.character.namedSkills ?? []).toEqual([]);
    expect(afterTt.status.join('\n')).not.toMatch(/Skill up|Skill rank up|Technique/);
    expect(progressPanel(tt).namedSkills).toEqual([]);

    const rpgLine = R.input(2);
    expect(rpgLine).toBe('Search the area');
    const rpg = withSkill(calm(R), { id: 'searching', rank: 0, uses: 0, level: 0, xp: 0 });
    expect(rpg.engineMode).toBe('rpg');
    const afterRpg = turn(rpg, rpgLine);
    expect(rec(afterRpg.state, 'searching')?.level).toBe(1);
    expect(progressPanel(rpg).namedSkills).toEqual([]);
  });
});
