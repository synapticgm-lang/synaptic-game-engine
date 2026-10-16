/**
 * mode-gap step 2: a LitRPG class from the shared SRD class data, offered by the System when the tutorial ends.
 * LitRPG tapes: summoned-pact s150 (private window: level and skills shown), s76 (leftover pocket: level hidden),
 * s78 (worn device: skills off). Tabletop cursed-keep ds151 and story RPG salt-road-heist ds150 never get the offer.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from '../../game/arcDirector';
import { commitOfferedPad, resolveOfferedChoices } from '../../game/playTranscript';
import { progressPanel } from '../../game/progressPanel';
import { validateActionHard } from '../../game/actionValidation';
import { mediatePlayerInput } from '../../game/inputMediation';
import { sharedLevelUp } from '../../game/rules/advancement';
import { CLASSES, PREGENS, tabletopHitDie } from '../../game/tabletop/characterBuild';
import {
  CHECK_SKILL_SRD,
  CLASS_QUICK_START_CHIP,
  classChip,
  classIdOf,
  classOfferPad,
  litrpgClassView,
  offeredClasses,
  quickStartClass,
  settleClassChoice,
  tutorialEnded,
} from '../../game/rules/characterClass';
import { skillRankOf } from '../../game/skillRanks';
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

/** The latest saved turn with no fight running (the offer waits out a fight). */
function calm(r: Replay): GameState {
  const s = [...r.turns()].reverse().map((t) => r.after(t)).find((x) => !x.activeEncounter && !x.roundCombat);
  if (!s) throw new Error('no calm turn on tape');
  return s;
}

/** The tape's own state once the tutorial is over (the turn-20 soft unlock if the tape stops short of it). */
function ended(s: GameState): GameState {
  const out = tutorialEnded(s) ? s : { ...s, tutorialProgress: { ...(s.tutorialProgress ?? { completed: {}, firstChestUncommonBiasPending: false, stickyFailScheduled: false }), fullStatusUnlocked: true } } as GameState;
  return { ...out, character: { ...out.character, classId: undefined }, classOffer: null };
}

function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  return { arc, state: commitOfferedPad({ ...arc.state, turn: (arc.state.turn ?? 0) + 1 }), status: formatArcStatusReceipts(arc) };
}

function opened(r: Replay) {
  return turn(ended(calm(r)), 'Look around');
}

describe('replay bank mode-gap 2 (LitRPG class)', () => {
  it('[litrpg s150 T2 | mode-gap 2] no class offer while the tutorial is still running', () => {
    const s = { ...L.before(2), classOffer: null } as GameState;
    expect(s.engineMode).toBe('litrpg');
    expect(tutorialEnded(s)).toBe(false);
    const r = turn(s, 'Look around');
    expect(r.state.classOffer ?? null).toBeNull();
    expect(r.status.join('\n')).not.toMatch(/^Class:/m);
    expect(resolveOfferedChoices(r.state).some((c) => /^Choose |^Quick start$/.test(c))).toBe(false);
  });

  it('[litrpg s150 | mode-gap 2] tutorial over: the System prompt offers three seeded classes plus Quick start; the chip list is untouched', () => {
    const calmState = ended(calm(L));
    const { state, status } = opened(L);
    const ids = offeredClasses(state);
    expect(state.classOffer?.choices).toEqual(ids);
    expect(new Set(ids).size).toBe(3);
    const names = ids.map((id) => litrpgClassView(id).name);
    expect(status).toContain(`Class: The System offers a class — ${names[0]}, ${names[1]} or ${names[2]}. Choose one, or Quick start.`);
    expect(classOfferPad(state)).toEqual([...ids.map(classChip), CLASS_QUICK_START_CHIP]);
    // RC-HF1: System class chips live in the one offered list (cite Order RC-HF1 / q31-RCHF1).
    const classPads = [...ids.map(classChip), CLASS_QUICK_START_CHIP];
    for (const c of classPads) expect(resolveOfferedChoices(state)).toContain(c);
    expect(resolveOfferedChoices(commitOfferedPad({ ...state, classOffer: null })).some((c) => /^Choose |^Quick start$/.test(c))).toBe(false);
    expect(calmState.classOffer).toBeNull();
    expect(opened(L).state.classOffer?.choices, 'same save, same offer').toEqual(ids);
  });

  it('[litrpg s150 | mode-gap 2] picking a chip sets the class, grants one starting-skill rank, and states it to the writer', () => {
    const { state } = opened(L);
    const id = state.classOffer!.choices[0]!;
    const chip = classChip(id);
    expect(mediatePlayerInput(chip)).toMatchObject({ action: expect.not.stringMatching(/^block$/), text: chip });
    const lastGm = [...state.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
    const hard = validateActionHard(chip, state, lastGm);
    expect(hard.valid).toBe(true);
    expect(hard.rewritten ?? chip).toBe(chip);
    const v = litrpgClassView(id);
    const before = skillRankOf(state.character, v.startingSkill);
    const r = turn(state, chip);
    expect(classIdOf(r.state.character)).toBe(id);
    expect(r.state.character.skills?.[v.startingSkill]).toBe(before + 1);
    expect(r.state.classOffer ?? null).toBeNull();
    expect(r.status.some((l) => l.startsWith(`Class: Class taken — ${v.name} (${v.role}).`))).toBe(true);
    expect(r.arc.mandate ?? JSON.stringify(r.arc)).toMatch(new RegExp(`ENGINE RESULT[^\\n]*${v.name} class`));
    expect(classOfferPad(r.state)).toBeNull();
    expect(progressPanel(r.state).className).toBe(v.name);
  });

  it('[litrpg s150 | mode-gap 2] Quick start takes the seeded ready-made class; any class can be typed by name', () => {
    const { state } = opened(L);
    const q = turn(state, CLASS_QUICK_START_CHIP).state;
    expect(classIdOf(q.character)).toBe(quickStartClass(state));
    expect(PREGENS.map((p) => p.picks.classId)).toContain(quickStartClass(state));
    const typed = turn(state, "I'll take the Paladin class").state;
    expect(classIdOf(typed.character)).toBe('paladin');
    const ignored = turn(state, 'Look around').state;
    expect(classIdOf(ignored.character), 'an ordinary action does not pick').toBeUndefined();
    expect(classOfferPad(ignored)).not.toBeNull();
  });

  it('[litrpg s150 | mode-gap 2] an offer ignored for three turns: the System assigns the Quick start class', () => {
    const { state } = opened(L);
    const later = { ...state, turn: state.classOffer!.turn + 3 };
    const r = settleClassChoice(later, 'Look around');
    expect(classIdOf(r.state.character)).toBe(quickStartClass(state));
    expect(r.receipts[0]).toMatch(/^Class: The System assigned a class — /);
    expect(r.settled, 'the player\'s own action still reaches the writer').toBe(false);
  });

  it('[litrpg s76 | mode-gap 2] a leftover pocket (level hidden): class by seed, silently — no STATUS line, no chips, nothing shown', () => {
    const s = ended(calm(P));
    expect(s.systemHousing?.housing).toBe('leftover_pocket');
    const r = turn(s, 'Look around');
    expect(classIdOf(r.state.character)).toBe(quickStartClass(s));
    expect(r.status.join('\n')).not.toMatch(/Class/);
    expect(classOfferPad(r.state)).toBeNull();
    expect(progressPanel(r.state).className).toBeNull();
    expect(progressPanel(r.state).level).toBeNull();
  });

  it('[litrpg s78 | mode-gap 2] a worn device with skills off: the class line names no skill rank', () => {
    const { state } = opened(W);
    expect(state.systemHousing?.housing).toBe('worn_device');
    const r = turn(state, classChip(state.classOffer!.choices[1]!));
    const line = r.status.find((l) => l.startsWith('Class: Class taken'));
    expect(line).toBeDefined();
    expect(line).not.toMatch(/rank|skill/i);
  });

  it('[litrpg s150 | mode-gap 2] level-up HP reads the class Hit Die (shared engine); no class keeps d8', () => {
    const s = calm(L);
    const plain = { ...s.character, classId: undefined, srd: undefined };
    expect(tabletopHitDie(plain)).toBe(8);
    expect(tabletopHitDie({ ...plain, classId: 'wizard' })).toBe(6);
    const mage = sharedLevelUp({ ...plain, classId: 'wizard' }, plain.level + 1).info;
    const warrior = sharedLevelUp({ ...plain, classId: 'fighter' }, plain.level + 1).info;
    expect(mage.taken).toBe(4);
    expect(warrior.taken).toBe(6);
    expect(sharedLevelUp(plain, plain.level + 1).info.taken).toBe(5);
  });

  it('[tabletop ds151 + rpg ds150 | mode-gap 2] no class offer outside LitRPG; the tabletop sheet keeps its own Hit Die', () => {
    for (const s of [ended(calm(T)), ended(calm(R))]) {
      expect(s.engineMode).not.toBe('litrpg');
      const r = settleClassChoice(s, 'Choose Warrior');
      expect(r.state).toBe(s);
      expect(r.receipts).toEqual([]);
      expect(classOfferPad(r.state)).toBeNull();
    }
    const tt = calm(T).character;
    if (tt.srd) expect(tabletopHitDie(tt)).toBe(CLASSES.find((c) => c.id === tt.srd!.classId)!.hitDie);
  });

  it('[data | mode-gap 2] every LitRPG starting skill is on its SRD class skill list', () => {
    for (const c of CLASSES) {
      const v = litrpgClassView(c.id);
      expect(c.skillChoices as readonly string[], c.id).toContain(CHECK_SKILL_SRD[v.startingSkill]);
    }
  });
});
