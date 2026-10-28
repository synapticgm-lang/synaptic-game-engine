/**
 * Shared rules engine — a character's class. One class list for every mode: the SRD 5.2.1 classes in
 * tabletop/characterBuild (Hit Die, skill list). A tabletop sheet carries its class on `srd.classId`;
 * a LitRPG character with no sheet carries it on `character.classId`.
 *
 * LitRPG presenter: the System names the class, gives its role and one starting skill rank, and offers
 * the choice when the tutorial ends. A housing that hides the level gets its class by seed, silently.
 */
import type { Character, GameState, TabletopClassId } from '../types';
import { CLASSES, PREGENS, classDef, seedNumber } from '../tabletop/characterBuild';
import { mulberry32 } from '../fatePick';
import { hidesPart } from '../systemHousing';
import { skillRankOf, type CheckSkillName } from '../skillRanks';
import { skillLabel } from '../skillGates';
import { LITRPG_CLASS, type LitrpgClassEntry } from '../litrpgClassNames';

export interface LitrpgClassView extends LitrpgClassEntry {
  id: TabletopClassId;
}

/** The SRD skill each check skill stands for (thievery is Sleight of Hand). */
export const CHECK_SKILL_SRD: Record<CheckSkillName, string> = {
  athletics: 'Athletics',
  perception: 'Perception',
  investigation: 'Investigation',
  stealth: 'Stealth',
  thievery: 'Sleight of Hand',
  persuasion: 'Persuasion',
  insight: 'Insight',
  arcana: 'Arcana',
  survival: 'Survival',
};

export const CLASS_QUICK_START_CHIP = 'Quick start';
const OFFER_SIZE = 3;
/** Turns an open offer waits before the System assigns the Quick start class. */
const OFFER_PATIENCE = 3;

export function litrpgClassView(id: TabletopClassId): LitrpgClassView {
  return { id, ...LITRPG_CLASS[id] };
}

export function classIdOf(c: Pick<Character, 'srd' | 'classId'> | null | undefined): TabletopClassId | undefined {
  return c?.srd?.classId ?? c?.classId;
}

/** The class as the mode shows it: the System name in LitRPG, the SRD name elsewhere. */
export function classDisplayName(state: Pick<GameState, 'engineMode' | 'character'>): string | null {
  const id = classIdOf(state.character);
  if (!id) return null;
  return state.engineMode === 'litrpg' ? LITRPG_CLASS[id].name : classDef(id).name;
}

/** The tutorial is over: full status unlocked (rest, level-up, boss, or the turn-20 soft unlock). */
export function tutorialEnded(state: Pick<GameState, 'tutorialProgress' | 'turn' | 'character'>): boolean {
  const p = state.tutorialProgress;
  return !!p?.fullStatusUnlocked || !!p?.completed?.firstBoss || (state.turn ?? 0) >= 20 || (state.character?.level ?? 1) >= 2;
}

function classRng(state: Pick<GameState, 'seed' | 'saveId'>, salt: string) {
  return mulberry32(seedNumber(`litrpg-class:${salt}:${state.seed ?? state.saveId ?? '0'}`));
}

/** The classes the System offers, picked by seed (the same save always gets the same three). */
export function offeredClasses(state: Pick<GameState, 'seed' | 'saveId'>): TabletopClassId[] {
  const rng = classRng(state, 'offer');
  const pool = CLASSES.map((c) => c.id);
  const out: TabletopClassId[] = [];
  while (out.length < OFFER_SIZE && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
  return out;
}

/** Quick start: one of the ready-made characters' classes, picked by seed. */
export function quickStartClass(state: Pick<GameState, 'seed' | 'saveId'>): TabletopClassId {
  const rng = classRng(state, 'quick');
  return PREGENS[Math.floor(rng() * PREGENS.length)]!.picks.classId!;
}

export function classChip(id: TabletopClassId): string {
  return `Choose ${LITRPG_CLASS[id].name}`;
}

export function isClassOfferOpen(state: GameState): boolean {
  return state.engineMode === 'litrpg' && !classIdOf(state.character) && !!state.classOffer?.choices?.length;
}

/** The System prompt's chips while the offer is open: the offered classes and Quick start. */
export function classOfferPad(state: GameState): string[] | null {
  if (!isClassOfferOpen(state) || state.activeEncounter || state.roundCombat) return null;
  return [...state.classOffer!.choices.map(classChip), CLASS_QUICK_START_CHIP];
}

const PICK_VERB = /\b(?:choose|chose|pick|take|select|become|accept|be|class)\b/i;

/** The class this line takes while the offer is open: an offered chip, any class named with a pick verb, or Quick start. */
export function classFromInput(state: GameState, input: string): TabletopClassId | 'quick' | null {
  if (!isClassOfferOpen(state)) return null;
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (/^quick start\b/i.test(t) || /\blet the system (?:choose|pick|decide)\b/i.test(t)) return 'quick';
  const chip = state.classOffer!.choices.find((id) => classChip(id).toLowerCase() === t.toLowerCase().replace(/[.!]+$/, ''));
  if (chip) return chip;
  if (!PICK_VERB.test(t)) return null;
  for (const c of CLASSES) {
    const names = [LITRPG_CLASS[c.id].name, c.name];
    if (names.some((n) => new RegExp(`\\b${n}\\b`, 'i').test(t))) return c.id;
  }
  return null;
}

/** Puts the class on the character and grants one rank in its starting skill (the engine's rank, as a level-up grants). */
export function applyCharacterClass(state: GameState, id: TabletopClassId): { state: GameState; skill: CheckSkillName; rank: number } {
  const c = state.character;
  const skill = LITRPG_CLASS[id].startingSkill;
  const rank = skillRankOf(c, skill) + 1;
  return {
    state: {
      ...state,
      classOffer: null,
      character: { ...c, classId: id, skills: { ...(c.skills ?? {}), [skill]: rank } },
    },
    skill,
    rank,
  };
}

export interface ClassSettle {
  state: GameState;
  receipts: string[];
  /** Engine fact for the writer when a class was taken this turn. */
  fact?: string;
  /** The player's line was the class pick (not talk to anyone in the scene). */
  settled: boolean;
}

function joinOr(names: string[]): string {
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

function takeClass(state: GameState, id: TabletopClassId, how: 'chosen' | 'assigned'): ClassSettle {
  const applied = applyCharacterClass(state, id);
  const v = LITRPG_CLASS[id];
  const skillShown = !hidesPart(state.systemHousing, 'skills');
  const skillPart = skillShown ? ` Starting skill: ${skillLabel(applied.skill)} rank ${applied.rank}.` : '';
  const verb = how === 'chosen' ? 'Class taken' : 'The System assigned a class';
  return {
    state: applied.state,
    receipts: [`Class: ${verb} — ${v.name} (${v.role}).${skillPart}`],
    fact: `The System granted the player the ${v.name} class (${v.role}).${skillShown ? ` Their ${skillLabel(applied.skill)} rose to rank ${applied.rank}.` : ''}`,
    settled: how === 'chosen',
  };
}

/**
 * LitRPG class, before the writer: take the class this line picks, or open the System's offer when the tutorial
 * has ended. A housing that hides the level takes the Quick start class silently. Other modes: nothing.
 */
export function settleClassChoice(state: GameState, input: string): ClassSettle {
  const none: ClassSettle = { state, receipts: [], settled: false };
  if (state.engineMode !== 'litrpg' || classIdOf(state.character)) return none;
  if (isClassOfferOpen(state)) {
    const pick = classFromInput(state, input);
    if (pick) return takeClass(state, pick === 'quick' ? quickStartClass(state) : pick, 'chosen');
    if ((state.turn ?? 0) - state.classOffer!.turn >= OFFER_PATIENCE && !state.activeEncounter && !state.roundCombat) {
      return takeClass(state, quickStartClass(state), 'assigned');
    }
    return none;
  }
  if (!tutorialEnded(state) || state.activeEncounter || state.roundCombat) return none;
  if (hidesPart(state.systemHousing, 'level')) {
    return { state: applyCharacterClass(state, quickStartClass(state)).state, receipts: [], settled: false };
  }
  const choices = offeredClasses(state);
  return {
    state: { ...state, classOffer: { turn: state.turn ?? 0, choices } },
    receipts: [`Class: The System offers a class — ${joinOr(choices.map((id) => LITRPG_CLASS[id].name))}. Choose one, or Quick start.`],
    settled: false,
  };
}
