/**
 * Shared rules engine — exploration: task DCs, light and vision.
 * From the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at
 * https://www.dndbeyond.com/srd, licensed under CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/legalcode):
 * the Typical Difficulty Classes table (Very easy 5 … Nearly impossible 30) and the Lock (DC 15);
 * Vision and Light (Bright Light, Dim Light = Lightly Obscured = Disadvantage on sight Perception, Darkness =
 * Heavily Obscured = Blinded when trying to see; Darkness outdoors at night and in an unlit dungeon; twilight and
 * dawn are Dim Light); Darkvision (Dim as Bright, Darkness as Dim); the Blinded condition; the Torch, Lamp,
 * Lanterns and Candle; and the adventuring packs that carry them.
 * Which rung a task sits on, and "dangerous ground (threat tier 3+) is one rung harder", are this game's table calls,
 * not SRD text. Lit rooms in a settlement count as Bright Light (lamps and hearths).
 */
import type { GameState, GmStrictness } from '../types';
import { difficultyRow } from '../difficultyRules';
import { isInteriorPlace, isUndergroundPlace, resolveThreatTier } from '../placeAuthority';
import { sheetSpellcasting, speciesDef } from '../tabletop/characterBuild';

/** The sheet's own Disadvantage on a check (untrained armor, heavy load); checkMath reads it with light and pace. */
export { sheetBurden } from '../tabletop/characterBuild';

export const DC_LADDER = {
  'very easy': 5,
  easy: 10,
  medium: 15,
  hard: 20,
  'very hard': 25,
  'nearly impossible': 30,
} as const;

export type TaskRung = keyof typeof DC_LADDER;
const RUNGS = Object.keys(DC_LADDER) as TaskRung[];

/** The kind of task a check is, for its rung on the ladder. */
export type TaskKind =
  | 'lock'
  | 'social-minor'
  | 'social-risky'
  | 'refuse'
  | 'arcana'
  | 'stealth'
  | 'strike'
  | 'search'
  | 'notice'
  | 'athletics'
  | 'survival'
  | 'general';

const BASE_RUNG: Record<TaskKind, TaskRung> = {
  lock: 'medium',
  'social-minor': 'easy',
  'social-risky': 'medium',
  refuse: 'easy',
  arcana: 'medium',
  stealth: 'medium',
  strike: 'medium',
  search: 'medium',
  notice: 'easy',
  athletics: 'medium',
  survival: 'easy',
  general: 'medium',
};

/** Physical tasks that the ground itself makes harder. */
const GROUND_TASKS = new Set<TaskKind>(['lock', 'stealth', 'athletics']);
const DANGEROUS_TIER = 3;

/** The task's rung: its base, one harder for a physical task on dangerous ground. */
export function taskRung(state: Pick<GameState, 'journey' | 'locationSheet' | 'currentLocation' | 'places'>, kind: TaskKind): TaskRung {
  const base = BASE_RUNG[kind];
  const tier = GROUND_TASKS.has(kind) ? resolveThreatTier(state as GameState) ?? 1 : 1;
  if (tier < DANGEROUS_TIER) return base;
  return RUNGS[Math.min(RUNGS.length - 1, RUNGS.indexOf(base) + 1)]!;
}

/** The DC for a rung under GM Strictness (the shared difficulty table's shift), never under 5. */
export function ladderDc(rung: TaskRung, strictness: GmStrictness | undefined): number {
  return Math.max(5, DC_LADDER[rung] + difficultyRow(strictness).checkDcShift);
}

export type LightLevel = 'bright' | 'dim' | 'dark';

type LightState = Pick<GameState, 'activeDungeon' | 'currentLocation' | 'locationSheet' | 'sceneFacts' | 'inventory' | 'character'>;

/** The light where the PC stands, before any light they carry. */
export function ambientLight(state: LightState): { level: LightLevel; why: string } {
  const here = state.locationSheet?.name ?? state.currentLocation ?? '';
  if (state.activeDungeon || isUndergroundPlace(here)) return { level: 'dark', why: 'in an unlit dungeon' };
  if (isInteriorPlace(here)) return { level: 'bright', why: 'in a lit room' };
  const slot = state.sceneFacts?.timeOfDay;
  if (slot === 'night') return { level: 'dark', why: 'at night' };
  if (slot === 'dawn' || slot === 'dusk' || slot === 'evening') return { level: 'dim', why: slot === 'dawn' ? 'at dawn' : 'at twilight' };
  return { level: 'bright', why: 'in daylight' };
}

const LIGHT_ITEM = /\b(torch(?:es)?|lamp|lantern|candles?)\b/i;
const PACK_LIGHT: Array<[RegExp, string]> = [
  [/dungeoneer|explorer/i, 'torch'],
  [/burglar/i, 'hooded lantern'],
  [/entertainer/i, 'bullseye lantern'],
  [/priest|scholar/i, 'lamp'],
];

/** The light source the PC carries (an item, a pack that holds one, or the Light cantrip), if any. */
export function carriedLight(state: Pick<GameState, 'inventory' | 'character'>): string | null {
  for (const item of state.inventory ?? []) {
    const own = item.name.match(LIGHT_ITEM);
    if (own) return own[1]!.toLowerCase().replace(/es$|s$/, '');
    if (/\bpack\b/i.test(item.name)) {
      const hit = PACK_LIGHT.find(([re]) => re.test(item.name));
      if (hit) return hit[1];
    }
  }
  const spells = state.character?.srd ? sheetSpellcasting(state.character) : null;
  if (spells?.cantrips.includes('Light')) return 'Light cantrip';
  return null;
}

export function pcDarkvision(state: Pick<GameState, 'character'>): number {
  const id = state.character?.srd?.speciesId;
  return id ? speciesDef(id)?.darkvision ?? 0 : 0;
}

export interface SceneLight {
  ambient: LightLevel;
  why: string;
  /** The light the PC carries, lit because the place is not bright. */
  lit: string | null;
  /** What the PC sees by: their light, Darkvision, or the place's own light. */
  seen: LightLevel;
  darkvision: number;
  /** Darkness and no light carried: a foe without Darkvision cannot see the PC either. */
  darkness: boolean;
}

/** The light the engine plays a tabletop scene in. */
export function sceneLight(state: LightState): SceneLight {
  const { level, why } = ambientLight(state);
  const lit = level === 'bright' ? null : carriedLight(state);
  const dv = pcDarkvision(state);
  const seen: LightLevel = lit ? 'bright' : dv > 0 ? (level === 'dark' ? 'dim' : 'bright') : level;
  return { ambient: level, why, lit, seen, darkvision: dv, darkness: level === 'dark' && !lit };
}

/** A sight-based Perception check in this light: normal, Disadvantage (Dim Light) or no roll (Blinded). */
export function sightCheck(light: SceneLight): 'normal' | 'disadvantage' | 'blind' {
  return light.seen === 'dark' ? 'blind' : light.seen === 'dim' ? 'disadvantage' : 'normal';
}

/** Words for what the light did to a roll ("dim light at twilight", "darkness at night, you can't see"). */
export function lightNote(light: SceneLight): string {
  const what = light.ambient === 'dark' ? 'darkness' : 'dim light';
  if (light.seen === 'dark') return `${what} ${light.why}, you can't see`;
  if (light.darkvision && !light.lit && light.ambient === 'dark') return `${what} ${light.why}, dim by Darkvision`;
  return `${what} ${light.why}`;
}

/**
 * VR1-b: CheckSpec for an exploration task (SRD 5.2.1 Typical Difficulty Classes, WotC CC BY 4.0).
 * DC from taskRung + ladderDc; rollers attach this to CheckResultRecord.spec.
 */
export function explorationCheckSpec(
  state: Pick<GameState, 'journey' | 'locationSheet' | 'currentLocation' | 'places' | 'gmStrictness'>,
  kind: TaskKind,
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA',
  skill?: string,
  adv: 'advantage' | 'disadvantage' | 'normal' = 'normal',
) {
  const dc = ladderDc(taskRung(state, kind), state.gmStrictness);
  return { kind: (skill ? 'skill' : 'ability') as 'ability' | 'skill', ability, ...(skill ? { skill } : {}), dc, dcShown: false as const, adv };
}
