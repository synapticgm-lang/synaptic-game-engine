/**
 * The saved-sheet library (tabletop). A saved sheet is the player's creation picks only: class, species,
 * background, ability method, base scores and kit, all SRD 5.2.1 (CC-BY-4.0) ids. Every number on the sheet
 * (HP, AC, skills, saves, level-ups) is derived again by the engine when the sheet is used, so a library sheet,
 * a pasted sheet and one built in the inn book come out the same.
 *
 * Kept on the device (localStorage) and, when signed in, as `characters` rows named `sheet:<id>` so the run
 * snapshot upsert (keyed by the character's name) never overwrites a library sheet.
 */
import type { Attributes, GameState, TabletopPicks } from '../types';
import {
  ABILITY_KEYS,
  BACKGROUNDS,
  CLASSES,
  CLASS_KITS,
  POINT_BUY_BUDGET,
  SPECIES,
  STANDARD_ARRAY,
  pointBuyCost,
  rollTotal,
} from './characterBuild';

export interface SavedSheet {
  id: string;
  name: string;
  mode: 'dnd';
  picks: Required<Pick<TabletopPicks, 'classId' | 'speciesId' | 'backgroundId' | 'method' | 'baseScores' | 'kitId'>> &
    Pick<TabletopPicks, 'rolls'>;
  hpMethod?: 'fixed' | 'roll';
  savedAt: number;
}

export type SheetCheck =
  | { ok: true; sheet: SavedSheet; corrections: string[] }
  | { ok: false; problems: string[] };

const NAME_MAX = 40;
const ENGINE_OWNED = ['hp', 'maxHp', 'ac', 'armorClass', 'level', 'xp', 'gold', 'skills', 'saves', 'proficiency', 'initiative', 'speed'];

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const byIdOrName = <T extends { id: string; name: string }>(list: T[], v: unknown): T | undefined =>
  list.find((x) => norm(x.id) === norm(v) || norm(x.name) === norm(v));

function newId(): string {
  return `sheet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** The finished tabletop character as a library sheet (null before the sheet is made). */
export function sheetFromState(state: Pick<GameState, 'character'>, name?: string): SavedSheet | null {
  const s = state.character?.srd;
  if (!s) return null;
  return {
    id: newId(),
    name: (name ?? state.character.name ?? '').trim().slice(0, NAME_MAX) || 'Adventurer',
    mode: 'dnd',
    picks: {
      classId: s.classId,
      speciesId: s.speciesId,
      backgroundId: s.backgroundId,
      method: s.method,
      baseScores: { ...s.baseScores },
      kitId: s.kitId,
      ...(s.rolls ? { rolls: s.rolls } : {}),
    },
    ...(s.hpMethod ? { hpMethod: s.hpMethod } : {}),
    savedAt: Date.now(),
  };
}

function scoresProblem(method: SavedSheet['picks']['method'], scores: Attributes, rolls?: number[][]): string | null {
  const vals = ABILITY_KEYS.map((k) => scores[k]);
  if (method === 'point-buy') {
    if (vals.some((v) => v < 8 || v > 15)) return 'Point buy scores must each be 8 to 15.';
    const cost = pointBuyCost(scores)!;
    return cost > POINT_BUY_BUDGET ? `Those scores cost ${cost} points; point buy allows ${POINT_BUY_BUDGET}.` : null;
  }
  if (method === 'standard-array') {
    const same = [...vals].sort((a, b) => a - b).join(',') === [...STANDARD_ARRAY].sort((a, b) => a - b).join(',');
    return same ? null : `The standard array is exactly ${STANDARD_ARRAY.join(', ')}.`;
  }
  if (vals.some((v) => v < 3 || v > 18)) return 'Rolled scores must each be 3 to 18.';
  if (rolls?.length) {
    const pool = rolls.map(rollTotal).sort((a, b) => a - b).join(',');
    if ([...vals].sort((a, b) => a - b).join(',') !== pool) return 'The scores do not match the dice rolled for them.';
  }
  return null;
}

/** The method a set of scores fits when the sheet does not say (standard array, then point buy, then rolled). */
function inferMethod(scores: Attributes): SavedSheet['picks']['method'] {
  if (!scoresProblem('standard-array', scores)) return 'standard-array';
  if (!scoresProblem('point-buy', scores)) return 'point-buy';
  return '4d6';
}

function readScores(raw: Record<string, unknown>): Partial<Attributes> {
  const src = (raw.baseScores ?? raw.scores ?? raw.abilities ?? raw.attributes ?? raw) as Record<string, unknown>;
  const out: Partial<Attributes> = {};
  for (const k of ABILITY_KEYS) {
    const v = src?.[k] ?? src?.[k.toLowerCase()];
    if (v != null && v !== '' && Number.isFinite(Number(v))) out[k] = Number(v);
  }
  return out;
}

/**
 * Check a sheet from the library or a paste. Problems block it; corrections are changes the engine made to fit
 * the rules (an engine-owned number dropped, a missing kit or method filled in) and are shown line by line.
 */
export function validateSheet(raw: unknown): SheetCheck {
  if (!raw || typeof raw !== 'object') return { ok: false, problems: ['That is not a character sheet.'] };
  const r = raw as Record<string, unknown>;
  const picks = (r.picks && typeof r.picks === 'object' ? r.picks : r) as Record<string, unknown>;
  const problems: string[] = [];
  const corrections: string[] = [];

  const cls = byIdOrName(CLASSES, picks.classId ?? picks.class);
  if (!cls) problems.push(`Class ${picks.classId ?? picks.class ?? '(none)'} is not one this game has; choose ${CLASSES.map((c) => c.name).join(', ')}.`);
  const sp = byIdOrName(SPECIES, picks.speciesId ?? picks.species ?? picks.race);
  if (!sp) problems.push(`Species ${picks.speciesId ?? picks.species ?? picks.race ?? '(none)'} is not one this game has; choose ${SPECIES.map((s) => s.name).join(', ')}.`);
  const bg = byIdOrName(BACKGROUNDS, picks.backgroundId ?? picks.background);
  if (!bg) problems.push(`Background ${picks.backgroundId ?? picks.background ?? '(none)'} is not one this game has; choose ${BACKGROUNDS.map((b) => b.name).join(', ')}.`);

  const got = readScores(picks);
  const missing = ABILITY_KEYS.filter((k) => typeof got[k] !== 'number' || !Number.isInteger(got[k]));
  if (missing.length) problems.push(`Ability scores missing or not whole numbers: ${missing.join(', ')}.`);
  const scores = got as Attributes;

  const rolls = Array.isArray(picks.rolls) && picks.rolls.every((x) => Array.isArray(x) && x.length === 4 && x.every((d) => Number.isInteger(d) && d >= 1 && d <= 6))
    ? (picks.rolls as number[][])
    : undefined;
  const methodRaw = norm(picks.method);
  let method: SavedSheet['picks']['method'] | undefined =
    /point/.test(methodRaw) ? 'point-buy' : /array/.test(methodRaw) ? 'standard-array' : /4d6|roll|dice/.test(methodRaw) ? '4d6' : undefined;
  if (!missing.length) {
    if (!method) {
      method = inferMethod(scores);
      corrections.push(`Ability method not given; these scores fit ${method === '4d6' ? 'rolled scores (4d6)' : method === 'point-buy' ? 'point buy' : 'the standard array'}.`);
    }
    const bad = scoresProblem(method, scores, rolls);
    if (bad) problems.push(bad);
    if (method === '4d6' && !rolls) corrections.push('No dice record came with the rolled scores; they are kept as written.');
  }

  let kitId = picks.kitId ?? picks.kit;
  const kits = cls ? CLASS_KITS[cls.id] : [];
  const kit = kits.find((k) => norm(k.id) === norm(kitId) || norm(k.label) === norm(kitId)) ?? (/coin|gold|gp/.test(norm(kitId)) ? kits.find((k) => k.id === 'coin' || (k.id === 'B' && !k.gear.length)) : undefined);
  if (cls && !kit) {
    corrections.push(`Starting kit ${kitId ? `“${kitId}” is not a ${cls.name} kit` : 'not given'}; the first ${cls.name} kit is used.`);
  }
  kitId = kit?.id ?? 'A';

  const dropped = ENGINE_OWNED.filter((k) => r[k] != null || picks[k] != null);
  if (dropped.length) corrections.push(`The engine works out ${dropped.join(', ')} from the SRD rules; the sheet's own numbers are not used.`);

  const nameRaw = String(r.name ?? picks.name ?? '').trim();
  if (nameRaw.length > NAME_MAX) corrections.push(`Name shortened to ${NAME_MAX} characters.`);

  if (problems.length) return { ok: false, problems };
  const hp = norm(r.hpMethod);
  return {
    ok: true,
    corrections,
    sheet: {
      id: typeof r.id === 'string' && r.id.startsWith('sheet-') ? r.id : newId(),
      name: nameRaw.slice(0, NAME_MAX) || 'Adventurer',
      mode: 'dnd',
      picks: { classId: cls!.id, speciesId: sp!.id, backgroundId: bg!.id, method: method!, baseScores: { ...scores }, kitId: kitId as SavedSheet['picks']['kitId'], ...(rolls ? { rolls } : {}) },
      ...(hp === 'roll' || hp === 'fixed' ? { hpMethod: hp } : {}),
      savedAt: typeof r.savedAt === 'number' ? r.savedAt : Date.now(),
    },
  };
}

/** A pasted sheet: JSON, or plain lines like "Class: Fighter", "Species: Dwarf", "STR 15 DEX 14 …". */
export function parseSheetText(text: string): Record<string, unknown> | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  if (/^[{[]/.test(t)) {
    try {
      const v = JSON.parse(t);
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  const out: Record<string, unknown> = {};
  for (const line of t.split(/\r?\n/)) {
    const m = line.match(/^\s*(name|class|species|race|background|method|kit|hp method)\s*[:=-]\s*(.+?)\s*$/i);
    if (m) out[m[1].toLowerCase() === 'hp method' ? 'hpMethod' : m[1].toLowerCase()] = m[2];
  }
  const scores: Record<string, number> = {};
  for (const m of t.matchAll(/\b(STR|DEX|CON|INT|WIS|CHA)\b\s*[:=]?\s*(\d{1,2})\b/gi)) scores[m[1].toUpperCase()] = Number(m[2]);
  if (Object.keys(scores).length) out.scores = scores;
  return Object.keys(out).length ? out : null;
}

export function importSheetText(text: string): SheetCheck {
  const parsed = parseSheetText(text);
  return parsed ? validateSheet(parsed) : { ok: false, problems: ['Paste a sheet as JSON or as lines like “Class: Fighter”, “Species: Dwarf”, “Background: Soldier”, “STR 15 DEX 14 CON 13 INT 12 WIS 10 CHA 8”.'] };
}

/** One line for a chip or list ("Bram — Dwarf Fighter"). */
export function sheetLabel(sheet: SavedSheet): string {
  const sp = SPECIES.find((s) => s.id === sheet.picks.speciesId)?.name ?? sheet.picks.speciesId;
  const cls = CLASSES.find((c) => c.id === sheet.picks.classId)?.name ?? sheet.picks.classId;
  return `${sheet.name} — ${sp} ${cls}`;
}

// ── device storage ──────────────────────────────────────────────────────────

const LIBRARY_KEY = 'sgm-sheet-library-v1';
const DEFAULT_KEY = 'sgm-sheet-library-default-v1';

function store(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Every saved tabletop sheet on this device, newest first; damaged entries are skipped. */
export function listSheets(): SavedSheet[] {
  const raw = store()?.getItem(LIBRARY_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .map((x) => validateSheet(x))
      .filter((c): c is Extract<SheetCheck, { ok: true }> => c.ok)
      .map((c) => c.sheet)
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

function writeSheets(list: SavedSheet[]): void {
  store()?.setItem(LIBRARY_KEY, JSON.stringify(list));
}

export function saveSheet(sheet: SavedSheet): SavedSheet[] {
  const list = [sheet, ...listSheets().filter((s) => s.id !== sheet.id)];
  writeSheets(list);
  return list;
}

export function deleteSheet(id: string): SavedSheet[] {
  const list = listSheets().filter((s) => s.id !== id);
  writeSheets(list);
  if (defaultSheetId() === id) setDefaultSheet(null);
  return list;
}

export function defaultSheetId(): string | null {
  return store()?.getItem(DEFAULT_KEY) || null;
}

export function setDefaultSheet(id: string | null): void {
  const s = store();
  if (!s) return;
  if (id) s.setItem(DEFAULT_KEY, id);
  else s.removeItem(DEFAULT_KEY);
}

export function findSheet(id: string | null | undefined, list: SavedSheet[] = listSheets()): SavedSheet | null {
  return id ? list.find((s) => s.id === id) ?? null : null;
}

/** Merge cloud sheets into the device library (newest copy of each id wins). */
export function mergeSheets(cloud: SavedSheet[]): SavedSheet[] {
  const byId = new Map<string, SavedSheet>();
  for (const s of [...listSheets(), ...cloud]) {
    const have = byId.get(s.id);
    if (!have || s.savedAt > have.savedAt) byId.set(s.id, s);
  }
  const list = [...byId.values()].sort((a, b) => b.savedAt - a.savedAt);
  writeSheets(list);
  return list;
}
