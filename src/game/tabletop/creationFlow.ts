/**
 * Tabletop creation as inn-book turns. Each step is engine-only: no writer call, no turn spent. The
 * question and the player's pick are system rows, so the writer never reads the menu. Chips come from
 * one place (the stored turn pad) so the action bar, Fate's Pick and the transcript all show the same.
 */
import type { Attributes, Character, GameState, LogEntry, TabletopCreationStage } from '../types';
import type { Rng } from '../fatePick';
import {
  ABILITY_KEYS,
  BACKGROUNDS,
  CLASSES,
  CLASS_KITS,
  POINT_BUY_BUDGET,
  PREGENS,
  SPECIES,
  STANDARD_ARRAY,
  applyTabletopSheet,
  backgroundBonus,
  backgroundDef,
  classDef,
  creationRng,
  fixedHitDieValue,
  formatTabletopSheet,
  kitDef,
  pointBuyCost,
  resolveSheet,
  rollLines,
  rollTotal,
  scoresForMethod,
  type AbilityMethod,
  type TabletopPicks,
} from './characterBuild';
import { houseRulesOf } from '../rules/houseRules';
import { defaultSheetId, findSheet, importSheetText, listSheets, sheetLabel, validateSheet, type SavedSheet } from './sheetLibrary';
import { srdLevelUp } from '../rules/advancement';
import { makeSidekick, sidekickOf, SIDEKICKS } from '../rules/sidekick';
import { dndXpToNext } from '../xpRules';

type CreationStage = TabletopCreationStage;

const QUICK = 'Quick start';
const BUILD = 'Build my own';
const READY = 'Ready-made: ';
const SAVED = 'Saved: ';
const KEEP = 'Keep these scores';
const BEGIN = 'Begin play';
const AGAIN = 'Start over';
const HP_ROLL = 'Roll for HP at each level';
const HP_FIXED = 'Take the fixed HP at each level';
const METHOD_CHIPS: Record<AbilityMethod, string> = {
  'point-buy': 'Point buy (27 points)',
  'standard-array': 'Standard array',
  '4d6': 'Roll 4d6, drop the lowest',
};

export function tabletopCreationPending(state: Pick<GameState, 'engineMode' | 'tabletopCreation'> | null | undefined): boolean {
  return !!state && state.engineMode === 'dnd' && !!state.tabletopCreation && state.tabletopCreation.stage !== 'done';
}

function bookName(state: GameState): string {
  return state.campaignBibleId === 'cursed-keep' ? 'The inn book' : 'The register';
}

/** The table's ability method, or null when the player chooses (Settings → Table rules). */
function tableMethod(state: GameState): AbilityMethod | null {
  const m = houseRulesOf(state).statMethod;
  return m === 'choose' ? null : m;
}

function kitChip(cls: NonNullable<TabletopPicks['classId']>, id: 'A' | 'B' | 'coin'): string {
  const k = kitDef(cls, id);
  return k.id === 'coin' ? `${k.label} (${k.gp} GP)` : k.label;
}

export function creationChips(state: GameState): string[] {
  const c = state.tabletopCreation;
  if (!c) return [];
  switch (c.stage) {
    case 'start': return [QUICK, ...listSheets().slice(0, 3).map((s) => SAVED + sheetLabel(s)), ...PREGENS.map((p) => READY + p.label), BUILD];
    case 'class': return CLASSES.map((k) => k.name);
    case 'species': return SPECIES.map((s) => s.name);
    case 'background': return BACKGROUNDS.map((b) => b.name);
    case 'method': {
      const fixed = tableMethod(state);
      return fixed ? [METHOD_CHIPS[fixed]] : Object.values(METHOD_CHIPS);
    }
    case 'scores': return [KEEP];
    case 'kit': return CLASS_KITS[c.picks.classId!].map((k) => kitChip(c.picks.classId!, k.id));
    case 'confirm': return [BEGIN, state.character.srd?.hpMethod === 'roll' ? HP_FIXED : HP_ROLL, AGAIN];
    default: return [];
  }
}

function scoreLine(scores: Attributes): string {
  return ABILITY_KEYS.map((k) => `${k} ${scores[k]}`).join(' · ');
}

function creationPrompt(state: GameState, note?: string): string[] {
  const c = state.tabletopCreation!;
  const book = bookName(state);
  const lead = note ? [note] : [];
  switch (c.stage) {
    case 'start':
      return [...lead, `${book} wants more than a name: who are you on the road? Take a quick start, a ready-made character, or build your own.`];
    case 'class':
      return [...lead, `${book} asks your calling.`, ...CLASSES.map((k) => `${k.name}: ${k.blurb}; saves ${k.saves.join(' and ')}.`)];
    case 'species':
      return [...lead, `${book} asks your people.`, ...SPECIES.map((s) => `${s.name}: ${s.size}, Speed ${s.speed} ft${s.darkvision ? `, Darkvision ${s.darkvision} ft` : ''}; ${s.traits.filter((t) => !t.startsWith('Darkvision')).slice(0, 2).map((t) => t.split(':')[0]).join(', ')}.`)];
    case 'background':
      return [...lead, `${book} asks what you did before.`, ...BACKGROUNDS.map((b) => `${b.name}: ${b.skills.join(' and ')}; ${b.tool}; feat ${b.feat}; +2/+1 among ${b.abilities.join('/')}.`)];
    case 'method':
      return [...lead, `${book} asks how your abilities are set.`, `Point buy: 27 points, each score 8–15 (14 costs 7, 15 costs 9).`, `Standard array: ${STANDARD_ARRAY.join(', ')}.`, `4d6: six rolls of four dice, the lowest die dropped, rolled in the open.`];
    case 'scores': {
      const p = c.picks;
      const bonus = backgroundBonus(p.backgroundId!, p.classId!);
      const bonusLine = ABILITY_KEYS.filter((k) => bonus[k]).map((k) => `+${bonus[k]} ${k}`).join(', ');
      const cost = p.method === 'point-buy' ? pointBuyCost(p.baseScores!) : null;
      return [
        ...lead,
        ...(p.rolls ? rollLines(p.rolls) : []),
        `Scores for a ${classDef(p.classId!).name}: ${scoreLine(p.baseScores!)}${cost != null ? ` (${cost} of ${POINT_BUY_BUDGET} points)` : ''}.`,
        `${backgroundDef(p.backgroundId!).name} adds ${bonusLine}.`,
        `Keep them, or type six scores to arrange them, e.g. STR 15 DEX 14 CON 13 INT 12 WIS 10 CHA 8.`,
      ];
    }
    case 'kit':
      return [...lead, `${book} asks what you carry.`, ...CLASS_KITS[c.picks.classId!].map((k) => `${kitChip(c.picks.classId!, k.id)}: ${k.gear.length ? `${k.gear.map((g) => (g.qty ? `${g.name} ×${g.qty}` : g.name)).join(', ')}, ${k.gp} GP` : `${k.gp} GP`}.`), `Your ${backgroundDef(c.picks.backgroundId!).name.toLowerCase()} past adds: ${backgroundDef(c.picks.backgroundId!).gear.map((g) => (g.qty ? `${g.name} ×${g.qty}` : g.name)).join(', ')}, ${backgroundDef(c.picks.backgroundId!).gp} GP.`];
    case 'confirm': {
      const die = state.character.srd ? classDef(state.character.srd.classId).hitDie : 8;
      const hp = state.character.srd?.hpMethod === 'roll'
        ? `HP at each new level: roll the Hit Die (d${die}) + CON.`
        : `HP at each new level: the fixed ${fixedHitDieValue(die)} (d${die}) + CON.`;
      return [...lead, `${book} reads your entry back.`, ...formatTabletopSheet(state), hp];
    }
    default:
      return lead;
  }
}

function systemRow(state: GameState, lines: string[]): LogEntry {
  return {
    id: `tt-create-${state.saveId}-${state.log.length}`,
    turn: state.turn,
    role: 'system',
    content: lines.join('\n'),
    timestamp: Date.now(),
  };
}

function withPrompt(state: GameState, note?: string): GameState {
  const choices = creationChips(state);
  return {
    ...state,
    log: [...state.log, systemRow(state, creationPrompt(state, note))],
    offeredPad: { turn: state.turn ?? 0, choices },
  };
}

/**
 * Opens the creation page on a new tabletop save (after page 1). A sheet picked at session zero, else the
 * player's default saved sheet, goes straight to the confirm page (Start over still reaches every option).
 */
export function beginTabletopCreation(state: GameState): GameState {
  if (state.engineMode !== 'dnd' || state.character.srd) return state;
  const opened: GameState = { ...state, tabletopCreation: { stage: 'start', picks: {}, restorePad: state.offeredPad ?? null } };
  const chosen = findSheet(state.sessionZero?.sheetId ?? defaultSheetId());
  return chosen ? fromLibrary(opened, chosen) : withPrompt(opened);
}

/** A pasted sheet rather than a chip: JSON, or at least a class line and some ability scores. */
function looksLikePastedSheet(input: string): boolean {
  const t = input.trim();
  return /^\{[\s\S]*\}$/.test(t) || (/\bclass\s*[:=-]/i.test(t) && /\b(STR|DEX|CON|INT|WIS|CHA)\b\s*[:=]?\s*\d/i.test(t));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function matchName<T extends { name: string }>(input: string, list: T[]): T | undefined {
  const n = norm(input);
  return list.find((x) => norm(x.name) === n) ?? list.find((x) => new RegExp(`\\b${norm(x.name)}\\b`).test(n));
}

/** Six scores typed as "STR 15 DEX 14 ...". */
export function parseTypedScores(input: string): Attributes | null {
  const out: Partial<Attributes> = {};
  for (const m of input.matchAll(/\b(STR|DEX|CON|INT|WIS|CHA)\b\s*[:=]?\s*(\d{1,2})\b/gi)) {
    out[m[1].toUpperCase() as keyof Attributes] = Number(m[2]);
  }
  return ABILITY_KEYS.every((k) => typeof out[k] === 'number') ? (out as Attributes) : null;
}

function typedScoresProblem(method: AbilityMethod, scores: Attributes, picks: TabletopPicks): string | null {
  const vals = ABILITY_KEYS.map((k) => scores[k]);
  if (method === 'point-buy') {
    if (vals.some((v) => v < 8 || v > 15)) return 'Point buy scores must each be 8 to 15.';
    const cost = pointBuyCost(scores)!;
    return cost > POINT_BUY_BUDGET ? `Those scores cost ${cost} points; the budget is ${POINT_BUY_BUDGET}.` : null;
  }
  const pool = method === '4d6' ? (picks.rolls ?? []).map(rollTotal) : STANDARD_ARRAY;
  const same = [...vals].sort((a, b) => a - b).join(',') === [...pool].sort((a, b) => a - b).join(',');
  return same ? null : `Use exactly these numbers: ${[...pool].sort((a, b) => b - a).join(', ')}.`;
}

/**
 * The table's starting level: the level-1 sheet climbs level by level through the same SRD level-up the game
 * uses later, taking the fixed Hit Die value each time (no HP dice before play).
 */
function atStartingLevel(state: GameState): GameState {
  const start = houseRulesOf(state).startingLevel;
  if (start <= 1 || !state.character.srd) return state;
  const hpMethod = state.character.srd.hpMethod;
  let character: Character = { ...state.character, srd: { ...state.character.srd, hpMethod: 'fixed' } };
  for (let lvl = 2; lvl <= start; lvl++) character = srdLevelUp(character, lvl).character;
  character = { ...character, hp: character.maxHp, xp: 0, xpToNext: dndXpToNext(start), srd: { ...character.srd!, hpMethod } };
  return { ...state, character };
}

function toConfirm(state: GameState, picks: TabletopPicks, note?: string, hpMethod?: 'fixed' | 'roll'): GameState {
  const sheet = resolveSheet(picks as Parameters<typeof resolveSheet>[0]);
  const fromOne = houseRulesOf(state).startingLevel > 1 ? { ...state, character: { ...state.character, level: 1 } } : state;
  const applied = atStartingLevel(applyTabletopSheet(fromOne, hpMethod ? { ...sheet, hpMethod } : sheet));
  return withPrompt({ ...applied, tabletopCreation: { ...state.tabletopCreation!, stage: 'confirm', picks } }, note);
}

/** A library or pasted sheet goes to the confirm page, re-derived from its SRD picks like any other build. */
function fromLibrary(state: GameState, sheet: SavedSheet, note?: string): GameState {
  const named = state.character.name && !/^(adventurer|survivor)$/i.test(state.character.name)
    ? state
    : { ...state, character: { ...state.character, name: sheet.name } };
  return toConfirm(named, { ...sheet.picks, source: 'library' }, note ?? `${sheetLabel(sheet)}, from your saved sheets.`, sheet.hpMethod);
}

/**
 * A sheet made on the character builder page: checked by the same validator as a pasted or library sheet, then the
 * same confirm page as the chips (Begin play, the HP choice and Start over stay on the pad). The builder's name wins.
 */
export function takeBuiltSheet(state: GameState, raw: unknown): GameState {
  if (!tabletopCreationPending(state)) return state;
  const check = validateSheet(raw);
  const said: GameState = { ...state, log: [...state.log, systemRow(state, [`› ${check.ok ? sheetLabel(check.sheet) : 'A sheet from the character builder'}`])] };
  if (!check.ok) return withPrompt(said, `That sheet cannot be used yet: ${check.problems.join(' ')}`);
  const named: GameState = { ...said, character: { ...said.character, name: check.sheet.name } };
  const fixes = check.corrections.length ? ` Changes to fit the rules: ${check.corrections.join(' ')}` : '';
  return toConfirm(named, { ...check.sheet.picks, source: 'build' }, `Built on the character page.${fixes}`, check.sheet.hpMethod);
}

function quickPicks(state: GameState, rng: Rng): TabletopPicks {
  const pick = <T>(xs: T[]) => xs[Math.floor(rng() * xs.length)];
  const classId = pick(CLASSES).id;
  const method = tableMethod(state) ?? 'standard-array';
  return {
    classId,
    speciesId: pick(SPECIES).id,
    backgroundId: pick(BACKGROUNDS).id,
    method,
    ...scoresForMethod(method, classId, rng),
    kitId: 'A',
    source: 'quick',
  };
}

function finish(state: GameState): GameState {
  const restore = state.tabletopCreation?.restorePad;
  const house = houseRulesOf(state);
  const lines = [`${bookName(state)} closes on your entry. Play begins.`];
  let next: GameState = state;
  if (house.sidekick !== 'none' && !sidekickOf(state)) {
    const sk = makeSidekick(house.sidekick, state.character.level || 1, creationRng(state));
    next = { ...next, companions: [...(next.companions ?? []), sk] };
    lines.push(`${sk.name} joins you as your sidekick (${SIDEKICKS[house.sidekick].role.toLowerCase()}): ${SIDEKICKS[house.sidekick].does}.`);
  }
  // Human Resourceful (SRD 5.2.1): Heroic Inspiration after each Long Rest; play begins rested.
  if (house.heroicInspiration && house.rulesVersion === 'srd-5.2.1' && state.character.srd?.speciesId === 'human') {
    next = { ...next, character: { ...next.character, heroicInspiration: true } };
    lines.push('Heroic Inspiration: yours (Human, Resourceful).');
  }
  return {
    ...next,
    log: [...next.log, systemRow(next, lines)],
    tabletopCreation: { ...next.tabletopCreation!, stage: 'done' },
    offeredPad: restore ?? null,
  };
}

/** One inn-book step from a chip or typed line. Unknown input re-asks the same question. */
export function stepTabletopCreation(state: GameState, input: string): GameState {
  const c = state.tabletopCreation;
  if (!c || c.stage === 'done') return state;
  const said: GameState = { ...state, log: [...state.log, systemRow(state, [`› ${input.trim()}`])] };
  const at = (stage: CreationStage, picks: TabletopPicks, note?: string) =>
    withPrompt({ ...said, tabletopCreation: { ...c, stage, picks } }, note);
  const again = (note: string) => withPrompt(said, note);
  const n = norm(input);
  switch (c.stage) {
    case 'start': {
      const saved = listSheets().find((s) => n === norm(SAVED + sheetLabel(s)));
      if (saved) return fromLibrary(said, saved);
      if (looksLikePastedSheet(input)) {
        const check = importSheetText(input);
        if (!check.ok) return again(`That sheet cannot be used yet: ${check.problems.join(' ')}`);
        const fixes = check.corrections.length ? ` Changes to fit the rules: ${check.corrections.join(' ')}` : '';
        return fromLibrary(said, check.sheet, `Your sheet checks out.${fixes}`);
      }
      if (n === norm(QUICK) || /\bquick\b/.test(n)) return toConfirm(said, quickPicks(said, creationRng(said)));
      const pre = PREGENS.find((p) => n === norm(READY + p.label) || n === norm(p.label));
      if (pre) {
        const method = tableMethod(said) ?? 'standard-array';
        const picks: TabletopPicks = { ...pre.picks, method, ...scoresForMethod(method, pre.picks.classId!, creationRng(said)), kitId: 'A', source: 'pregen' };
        return toConfirm(said, picks);
      }
      if (n === norm(BUILD) || /\b(build|own|custom)\b/.test(n)) return at('class', { source: 'build' });
      return again('Pick one of the options on the page.');
    }
    case 'class': {
      const k = matchName(input, CLASSES);
      return k ? at('species', { ...c.picks, classId: k.id }) : again(`Choose one of: ${CLASSES.map((x) => x.name).join(', ')}.`);
    }
    case 'species': {
      const s = matchName(input, SPECIES);
      return s ? at('background', { ...c.picks, speciesId: s.id }) : again(`Choose one of: ${SPECIES.map((x) => x.name).join(', ')}.`);
    }
    case 'background': {
      const b = matchName(input, BACKGROUNDS);
      if (!b) return again('Choose Acolyte, Criminal, Sage or Soldier.');
      const fixed = tableMethod(said);
      // The table sets the method: skip the question and roll or lay out the scores now.
      if (fixed) return at('scores', { ...c.picks, backgroundId: b.id, method: fixed, ...scoresForMethod(fixed, c.picks.classId!, creationRng(said)) }, `This table sets abilities by ${METHOD_CHIPS[fixed].toLowerCase()}.`);
      return at('method', { ...c.picks, backgroundId: b.id });
    }
    case 'method': {
      const fixed = tableMethod(said);
      const asked = (Object.keys(METHOD_CHIPS) as AbilityMethod[]).find((m) => n === norm(METHOD_CHIPS[m]))
        ?? (/\bpoint/.test(n) ? 'point-buy' : /\barray\b/.test(n) ? 'standard-array' : /\b(roll|4d6|dice)\b/.test(n) ? '4d6' : undefined);
      const method = fixed ?? asked;
      if (!method) return again('Choose point buy, the standard array, or 4d6.');
      return at('scores', { ...c.picks, method, ...scoresForMethod(method, c.picks.classId!, creationRng(said)) });
    }
    case 'scores': {
      if (n === norm(KEEP) || /\b(keep|ok|fine|yes)\b/.test(n)) return at('kit', c.picks);
      const typed = parseTypedScores(input);
      if (!typed) return again('Keep these scores, or type all six (STR, DEX, CON, INT, WIS, CHA).');
      const problem = typedScoresProblem(c.picks.method!, typed, c.picks);
      return problem ? again(problem) : at('scores', { ...c.picks, baseScores: typed }, 'Scores arranged.');
    }
    case 'kit': {
      const kits = CLASS_KITS[c.picks.classId!];
      const kit = kits.find((k) => n === norm(kitChip(c.picks.classId!, k.id)))
        ?? (/\b(coin|gold|gp)\b/.test(n) ? kits.find((k) => k.id === 'coin') : undefined)
        ?? (/\b(kit|gear|equipment|first)\b/.test(n) ? kits[0] : undefined);
      return kit ? toConfirm(said, { ...c.picks, kitId: kit.id }) : again('Pick one of the kits on the page.');
    }
    case 'confirm': {
      if (n === norm(BEGIN) || /\b(begin|play|confirm|done)\b/.test(n)) return finish(said);
      const hpMethod: 'roll' | 'fixed' | null = n === norm(HP_ROLL) || /\broll\b.*\b(hp|hit)/.test(n) ? 'roll'
        : n === norm(HP_FIXED) || /\b(fixed|average)\b.*\b(hp|hit)/.test(n) ? 'fixed' : null;
      if (hpMethod && said.character.srd) {
        const next = { ...said, character: { ...said.character, srd: { ...said.character.srd, hpMethod } } };
        return withPrompt(next, hpMethod === 'roll' ? 'You will roll for HP at each new level.' : 'You will take the fixed HP at each new level.');
      }
      if (n === norm(AGAIN) || /\b(over|again|restart)\b/.test(n)) return at('start', {});
      return again('Begin play, or start over.');
    }
    default:
      return state;
  }
}

/** Fate-autoplay: walks the same inn-book pages, picking each chip at random from the run's seed. */
export function autoTabletopCreation(state: GameState, rng: Rng): GameState {
  let s = beginTabletopCreation(state);
  for (let i = 0; i < 12 && tabletopCreationPending(s); i++) {
    const stage = s.tabletopCreation!.stage;
    const chips = creationChips(s);
    const pick = stage === 'scores' ? KEEP : stage === 'confirm' ? BEGIN : chips[Math.floor(rng() * chips.length)];
    s = stepTabletopCreation(s, pick);
  }
  return s;
}

/** One-line record of how the sheet was made (for run notes and the transcript). */
export function creationRecord(state: GameState): string {
  const s = state.character.srd;
  if (!s) return '';
  return `${s.source}: ${classDef(s.classId).name} / ${s.speciesId} / ${s.backgroundId} / ${s.method} / kit ${s.kitId} · scores ${ABILITY_KEYS.map((k) => `${k} ${state.character.attributes[k]}`).join(' ')} · HP ${state.character.maxHp} AC ${state.character.armorClass}`;
}
