/**
 * Tabletop creation as inn-book turns. Each step is engine-only: no writer call, no turn spent. The
 * question and the player's pick are system rows, so the writer never reads the menu. Chips come from
 * one place (the stored turn pad) so the action bar, Fate's Pick and the transcript all show the same.
 */
import type { Attributes, GameState, LogEntry, TabletopCreationStage } from '../types';
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

type CreationStage = TabletopCreationStage;

const QUICK = 'Quick start';
const BUILD = 'Build my own';
const READY = 'Ready-made: ';
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

function kitChip(cls: NonNullable<TabletopPicks['classId']>, id: 'A' | 'B' | 'coin'): string {
  const k = kitDef(cls, id);
  return k.id === 'coin' ? `${k.label} (${k.gp} GP)` : k.label;
}

export function creationChips(state: GameState): string[] {
  const c = state.tabletopCreation;
  if (!c) return [];
  switch (c.stage) {
    case 'start': return [QUICK, ...PREGENS.map((p) => READY + p.label), BUILD];
    case 'class': return CLASSES.map((k) => k.name);
    case 'species': return SPECIES.map((s) => s.name);
    case 'background': return BACKGROUNDS.map((b) => b.name);
    case 'method': return Object.values(METHOD_CHIPS);
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

/** Opens the creation page on a new tabletop save (after page 1). */
export function beginTabletopCreation(state: GameState): GameState {
  if (state.engineMode !== 'dnd' || state.character.srd) return state;
  return withPrompt({ ...state, tabletopCreation: { stage: 'start', picks: {}, restorePad: state.offeredPad ?? null } });
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

function toConfirm(state: GameState, picks: TabletopPicks): GameState {
  const sheet = resolveSheet(picks as Parameters<typeof resolveSheet>[0]);
  const applied = applyTabletopSheet(state, sheet);
  return withPrompt({ ...applied, tabletopCreation: { ...state.tabletopCreation!, stage: 'confirm', picks } });
}

function quickPicks(state: GameState, rng: Rng): TabletopPicks {
  const pick = <T>(xs: T[]) => xs[Math.floor(rng() * xs.length)];
  const classId = pick(CLASSES).id;
  return {
    classId,
    speciesId: pick(SPECIES).id,
    backgroundId: pick(BACKGROUNDS).id,
    method: 'standard-array',
    ...scoresForMethod('standard-array', classId, rng),
    kitId: 'A',
    source: 'quick',
  };
}

function finish(state: GameState): GameState {
  const restore = state.tabletopCreation?.restorePad;
  return {
    ...state,
    log: [...state.log, systemRow(state, [`${bookName(state)} closes on your entry. Play begins.`])],
    tabletopCreation: { ...state.tabletopCreation!, stage: 'done' },
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
      if (n === norm(QUICK) || /\bquick\b/.test(n)) return toConfirm(said, quickPicks(said, creationRng(said)));
      const pre = PREGENS.find((p) => n === norm(READY + p.label) || n === norm(p.label));
      if (pre) {
        const picks: TabletopPicks = { ...pre.picks, method: 'standard-array', ...scoresForMethod('standard-array', pre.picks.classId!, creationRng(said)), kitId: 'A', source: 'pregen' };
        return toConfirm(said, picks);
      }
      if (n === norm(BUILD) || /\b(build|own|custom)\b/.test(n)) return at('class', { source: 'build' });
      return again('Pick one of the options on the page.');
    }
    case 'class': {
      const k = matchName(input, CLASSES);
      return k ? at('species', { ...c.picks, classId: k.id }) : again('Choose Fighter, Rogue, Cleric or Wizard.');
    }
    case 'species': {
      const s = matchName(input, SPECIES);
      return s ? at('background', { ...c.picks, speciesId: s.id }) : again(`Choose one of: ${SPECIES.map((x) => x.name).join(', ')}.`);
    }
    case 'background': {
      const b = matchName(input, BACKGROUNDS);
      return b ? at('method', { ...c.picks, backgroundId: b.id }) : again('Choose Acolyte, Criminal, Sage or Soldier.');
    }
    case 'method': {
      const method = (Object.keys(METHOD_CHIPS) as AbilityMethod[]).find((m) => n === norm(METHOD_CHIPS[m]))
        ?? (/\bpoint/.test(n) ? 'point-buy' : /\barray\b/.test(n) ? 'standard-array' : /\b(roll|4d6|dice)\b/.test(n) ? '4d6' : undefined);
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
