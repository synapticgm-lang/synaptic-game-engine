/**
 * mode-gap step 3: LitRPG free stat points (the tabletop ASI engine, spent by the player through the System
 * prompt) and the System window with Class, core stats, top skills and the active title.
 * LitRPG tapes: summoned-pact s150 (private window), s76 (leftover pocket: level hidden), s78 (worn device: skills
 * off). Tabletop cursed-keep ds151 and story RPG salt-road-heist ds150 get no stat points.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from '../../game/arcDirector';
import { commitOfferedPad, resolveOfferedChoices } from '../../game/playTranscript';
import { progressPanel } from '../../game/progressPanel';
import { validateActionHard } from '../../game/actionValidation';
import { mediatePlayerInput } from '../../game/inputMediation';
import { applyCharacterXpGain } from '../../game/characterXp';
import { autoAsi, srdLevelUp } from '../../game/rules/advancement';
import { classOfferPad, litrpgClassView } from '../../game/rules/characterClass';
import {
  STAT_SYSTEM_CHOICE_CHIP,
  raiseAbilities,
  statChip,
  statPointPad,
  statPointsEarned,
  systemPromptPad,
  unspentStatPoints,
} from '../../game/rules/abilityPoints';
import {
  SYSTEM_WINDOW_MAX_LINES,
  buildLitrpgSystemWindow,
  ledgerReadChanges,
  shouldAttachLitrpgSystemWindow,
} from '../../game/litrpgSystemWindow';
import { formatWriterInfoLayer } from '../../game/writerInfoLayer';
import { abilityMod, classDef, finalScores } from '../../game/tabletop/characterBuild';
import { clampSystemHousing } from '../../game/systemHousing';
import { beginTabletopCreation, stepTabletopCreation } from '../../game/tabletop/creationFlow';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const LIT150 = '2026-10-12T17-05-53-021Z_summoned-pact_cold-system_s150';
const S76 = '2026-10-07T16-15-12-290Z_summoned-pact_cold-system_s76';
const S78 = '2026-10-10T22-29-55-148Z_summoned-pact_cold-system_s78';
const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';
const RPG_DS150 = '2026-10-13T14-15-18-792Z_salt-road-heist_chilled-gm_s150';

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

/** The tape's calm state with a class taken, then levelled once by the engine's own XP step. */
function leveled(r: Replay, classId: 'fighter' | 'wizard' = 'wizard'): GameState {
  const s = calm(r);
  const c = { ...s.character, classId, statAllocations: [] };
  const up = applyCharacterXpGain(c, Math.max(1, (c.xpToNext ?? 150) - (c.xp ?? 0)), s.engineMode, s.systemHousing);
  return { ...s, classOffer: null, character: up.character };
}

function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  return { arc, state: commitOfferedPad({ ...arc.state, turn: (arc.state.turn ?? 0) + 1 }), status: formatArcStatusReceipts(arc) };
}

describe('replay bank mode-gap 3 (LitRPG stat points + System window)', () => {
  it('[litrpg s150 | mode-gap 3] a level-up earns one free stat point; the System row offers it; the chip list is untouched', () => {
    const before = { ...calm(L), character: { ...calm(L).character, classId: 'wizard' as const, statAllocations: [] } };
    const s = leveled(L);
    expect(s.engineMode).toBe('litrpg');
    expect(s.character.level).toBe(before.character.level + 1);
    expect(unspentStatPoints(s)).toBe(unspentStatPoints(before) + 1);
    expect(statPointsEarned(s)).toBe(s.character.level - 1);
    const n = unspentStatPoints(s);
    const prompt = systemPromptPad(s, classOfferPad(s));
    expect(prompt?.heading).toBe(`System — ${n} stat point${n > 1 ? 's' : ''} to spend`);
    expect(prompt?.chips).toContain(statChip('STR'));
    expect(prompt?.chips[prompt.chips.length - 1]).toBe(STAT_SYSTEM_CHOICE_CHIP);
    expect(resolveOfferedChoices(s).some((c) => /^\+1 [A-Z]{3}$|^Let the System choose$/.test(c))).toBe(false);
  });

  it('[litrpg s150 | mode-gap 3] spending a chip raises the score, records it, prints STATUS, tells the writer, and repaints the window', () => {
    const s = leveled(L);
    const chip = statChip('DEX');
    expect(mediatePlayerInput(chip)).toMatchObject({ action: expect.not.stringMatching(/^block$/), text: chip });
    const lastGm = [...s.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
    const hard = validateActionHard(chip, s, lastGm);
    expect(hard.valid).toBe(true);
    expect(hard.rewritten ?? chip).toBe(chip);
    const dex = s.character.attributes.DEX;
    const waiting = unspentStatPoints(s);
    const r = turn(s, chip);
    expect(r.state.character.attributes.DEX).toBe(dex + 1);
    expect(r.state.character.statAllocations?.slice(-1)[0]).toEqual({ level: s.character.level, bonus: { DEX: 1 } });
    expect(unspentStatPoints(r.state)).toBe(waiting - 1);
    expect(r.status.some((l) => l.startsWith(`Stats: Spent free stat points — +1 DEX (${dex} → ${dex + 1}).`))).toBe(true);
    expect(JSON.stringify(r.arc)).toMatch(/ENGINE RESULT[^"]*free stat points into \+1 DEX/);
    expect(shouldAttachLitrpgSystemWindow({ state: r.state, systemLog: r.status })).toBe(true);
    const painted = { ...s, log: [...s.log, { id: 'w', role: 'gm', content: 'x', timestamp: 0, systemWindow: buildLitrpgSystemWindow(s)! }] } as GameState;
    const changes = ledgerReadChanges({ ...painted, character: r.state.character });
    expect(changes?.find((c) => c.startsWith('Stats'))).toBe(`Stats DEX ${dex} → ${dex + 1}, points to spend ${waiting} → ${waiting - 1}`);
  });

  it('[litrpg s150 | mode-gap 3] typed spends, the System\'s choice, CON raising HP for every level, and ordinary lines spend nothing', () => {
    const base = leveled(L);
    const two = { ...base, character: { ...base.character, level: base.character.level + 1, statAllocations: [] } };
    const pts = unspentStatPoints(two);
    expect(pts).toBeGreaterThanOrEqual(2);
    const con = two.character.attributes.CON;
    const typed = turn(two, 'Put 2 points into constitution').state;
    expect(typed.character.attributes.CON).toBe(con + 2);
    const step = (abilityMod(con + 2) - abilityMod(con)) * two.character.level;
    expect(typed.character.maxHp).toBe((two.character.maxHp ?? 0) + step);
    const sys = turn(two, STAT_SYSTEM_CHOICE_CHIP).state;
    const first = classDef('wizard').priority[0]!;
    expect(sys.character.attributes[first]).toBe(Math.min(20, two.character.attributes[first] + pts));
    expect(unspentStatPoints(sys)).toBe(0);
    expect(statPointPad(sys)).toBeNull();
    const plain = turn(two, 'Look around').state;
    expect(plain.character.attributes).toEqual(two.character.attributes);
    expect(unspentStatPoints(plain)).toBe(pts);
  });

  it('[litrpg s150 | mode-gap 3] a score at 20 is not offered and takes no point; fights wait', () => {
    const s = leveled(L);
    const capped = { ...s, character: { ...s.character, attributes: { ...s.character.attributes, STR: 20 } } };
    expect(statPointPad(capped)).not.toContain(statChip('STR'));
    expect(turn(capped, '+1 STR').state.character.attributes.STR).toBe(20);
    const fighting = { ...s, activeEncounter: { name: 'Pact-Hunter', hp: 5, maxHp: 5 } } as unknown as GameState;
    expect(statPointPad(fighting)).toBeNull();
  });

  it('[litrpg s76 | mode-gap 3] a leftover pocket (level hidden): points are spent silently by class priority; nothing shown', () => {
    const s = leveled(P, 'fighter');
    expect(s.systemHousing?.housing).toBe('leftover_pocket');
    expect(statPointPad(s)).toBeNull();
    expect(systemPromptPad(s, classOfferPad(s))).toBeNull();
    const r = turn(s, 'Look around');
    expect(unspentStatPoints(r.state)).toBe(0);
    const first = classDef('fighter').priority[0]!;
    expect(r.state.character.attributes[first]).toBeGreaterThan(s.character.attributes[first]);
    expect(r.status.join('\n')).not.toMatch(/Stats/);
    expect(progressPanel(r.state).statPointsToSpend).toBe(0);
    expect(buildLitrpgSystemWindow(r.state)!.lines.map((l) => l.split(':')[0])).toEqual(['Name', 'Pocket']);
  });

  it('[litrpg s150 | mode-gap 3] the System window shows Class, core stats, top skills and the title, in 15 lines or fewer', () => {
    const s = leveled(L);
    const lines = buildLitrpgSystemWindow(s)!.lines;
    expect(lines).toContain(`Class: ${litrpgClassView('wizard').name}`);
    const stats = lines.find((l) => l.startsWith('Stats: '))!;
    const a = s.character.attributes;
    expect(stats).toContain(`STR ${a.STR}, DEX ${a.DEX}, CON ${a.CON}, INT ${a.INT}, WIS ${a.WIS}, CHA ${a.CHA}`);
    expect(stats).toContain(`(${unspentStatPoints(s)} point`);
    expect(lines.some((l) => l.startsWith('Title:')), 'no title earned yet').toBe(false);
    const titled = { ...s, character: { ...s.character, activeTitle: 'Circle-Breaker' } };
    expect(buildLitrpgSystemWindow(titled)!.lines).toContain('Title: Circle-Breaker');
    const full = {
      ...titled,
      systemHousing: clampSystemHousing({ housing: 'private_window', parts: { skills: true, quest_list: true, pocket: true, shop: true } as never }),
      character: { ...titled.character, conditions: ['Bleeding'], mp: 3, maxMp: 5, skills: { arcana: 3, athletics: 1, stealth: 2, survival: 1 } },
      openingEstablishment: { ...(titled.openingEstablishment ?? {}), complete: false },
    } as GameState;
    const all = buildLitrpgSystemWindow(full)!.lines;
    expect(all.find((l) => l.startsWith('Skills: '))).toBe('Skills: Arcana 3, Stealth 2, Athletics 1');
    expect(all.length).toBeLessThanOrEqual(SYSTEM_WINDOW_MAX_LINES);
  });

  it('[litrpg s78 | mode-gap 3] a worn device with skills off: no Skills line; class and stats still show', () => {
    const s = leveled(W);
    expect(s.systemHousing?.housing).toBe('worn_device');
    const lines = buildLitrpgSystemWindow({ ...s, character: { ...s.character, skills: { athletics: 2 } } })!.lines;
    expect(lines.some((l) => l.startsWith('Skills:'))).toBe(false);
    expect(lines.some((l) => l.startsWith('Class: '))).toBe(true);
    expect(lines.some((l) => l.startsWith('Stats: '))).toBe(true);
  });

  it('[litrpg s150 + s76 | mode-gap 3] the writer\'s facts carry the class; a hidden-level housing does not', () => {
    expect(formatWriterInfoLayer(leveled(L))).toMatch(/^Class: Mage$/m);
    expect(formatWriterInfoLayer(leveled(P, 'fighter'))).not.toMatch(/^Class:/m);
  });

  it('[tabletop ds151 + rpg ds150 | mode-gap 3] no free stat points outside LitRPG; tabletop ASI is the same raise step', () => {
    for (const s of [calm(T), calm(R)]) {
      expect(s.engineMode).not.toBe('litrpg');
      const big = { ...s, character: { ...s.character, level: 5 } };
      expect(unspentStatPoints(big)).toBe(0);
      expect(statPointPad(big)).toBeNull();
      expect(turn(big, '+1 STR').state.character.attributes).toEqual(big.character.attributes);
    }
    expect(formatWriterInfoLayer(calm(R))).not.toMatch(/^Class:/m);
    const tt = [`Ready-made: Human Fighter (Soldier)`, 'Begin play'].reduce(stepTabletopCreation, beginTabletopCreation(T.before(10))).character;
    expect(tt.srd, 'the ready-made sheet').toBeDefined();
    let c = tt;
    for (let lvl = (tt.level ?? 1) + 1; lvl <= 3; lvl++) c = srdLevelUp(c, lvl, () => 0.5).character;
    const pre = c.attributes;
    const up = srdLevelUp(c, 4, () => 0.5);
    const bonus = autoAsi(pre, classDef(tt.srd!.classId).priority);
    if (up.info.asi) {
      expect(up.info.asi.bonus).toEqual(bonus);
      expect(up.character.attributes).toEqual(finalScores(pre, bonus));
      expect(raiseAbilities(pre, bonus).attributes).toEqual(up.character.attributes);
    } else {
      expect(up.character.attributes, 'no ASI at 4 for this class').toEqual(pre);
    }
  });
});
