/**
 * LitRPG named skills grow by use (skill library, Batch 0 Part 3 "Earning skills from play"): a use counts only
 * with stakes (the line would roll a check), and a repeat of the same line in the same scene is not counted.
 * Ranks rise at set use counts up to the cap, where the skill evolves into its library technique. An evolved
 * skill's technique pays its library cost and goes on its library cooldown when used. One notice per turn at most.
 */
import { resolveCheckContext } from '../checkMath';
import { isLedgerReadAction } from '../completedEventPacket';
import { parsePlayerIntent } from '../intentParser';
import { isTravelPad } from '../padUniverse';
import { hidesPart } from '../systemHousing';
import { isJourneyStepLine } from '../travelJourney';
import type { GameState, NamedSkillState } from '../types';
import {
  NAMED_SKILL_RANK_CAP,
  cooldownOf,
  costOf,
  dayOf,
  evolutionOf,
  libraryEntry,
  matchBaseSkill,
  namedSkillsOf,
  rankForUses,
  sceneKey,
  techniqueReady,
} from './librarySkills';

export interface SkillSettle {
  state: GameState;
  receipts: string[];
  fact?: string;
}

const normLine = (s: string) => (s ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

function libraryMessage(id: string, fallback: string): string {
  return (libraryEntry(id)?.showing.system_message ?? fallback).trim().replace(/\.$/, '');
}

/** A line that practises a scene task: not travel, not a status read, not an attack, and it would roll. */
function practiceIntentOk(state: GameState, input: string): boolean {
  const t = (input ?? '').trim();
  if (!t || isTravelPad(t) || isJourneyStepLine(t) || isLedgerReadAction(t)) return false;
  const intent = parsePlayerIntent(t, state);
  if (intent.kind === 'attack') return false;
  const ctx = resolveCheckContext(state, intent, t);
  return !ctx.autoSucceed && ctx.dc > 0;
}

function withSkills(state: GameState, namedSkills: NamedSkillState[]): GameState {
  return { ...state, character: { ...state.character, namedSkills } };
}

/**
 * Settle one turn of named-skill use before the writer. `rested`: a rest happened this turn, which refreshes
 * once-per-day techniques.
 */
export function settleSkillUse(state: GameState, input: string, opts: { rested?: boolean } = {}): SkillSettle {
  if (state.engineMode !== 'litrpg' || !state.character) return { state, receipts: [] };
  let recs = namedSkillsOf(state);
  let next = state;
  if (opts.rested && recs.some((r) => r.usedAt && cooldownOf(libraryEntry(r.evolvedTo)) === 'day')) {
    recs = recs.map((r) => (r.usedAt && cooldownOf(libraryEntry(r.evolvedTo)) === 'day' ? { ...r, usedAt: undefined } : r));
    next = withSkills(next, recs);
  }
  const base = matchBaseSkill(next, input);
  if (!base || !practiceIntentOk(next, input)) return { state: next, receipts: [] };

  const id = base.identity.id;
  const scene = sceneKey(next);
  const line = normLine(input);
  const was = recs.find((r) => r.id === id) ?? { id, rank: 0, uses: 0 };
  const rec: NamedSkillState = { ...was };
  const notices: { text: string; fact: string }[] = [];

  // The evolved technique: used when ready; pays its cost and starts its cooldown.
  const technique = libraryEntry(rec.evolvedTo);
  let character = next.character;
  if (technique && techniqueReady(next, rec)) {
    const cost = costOf(technique);
    if (cost) character = { ...character, [cost.pool]: Number(character[cost.pool] ?? 0) - cost.amount };
    if (cooldownOf(technique) !== 'none' || cost) rec.usedAt = { scene, day: dayOf(next), turn: next.turn ?? 0 };
    if (cost || cooldownOf(technique) !== 'none') {
      const spent = [cost ? `${cost.amount} ${cost.word}` : '', cooldownOf(technique) !== 'none' ? `once per ${cooldownOf(technique)}` : '']
        .filter(Boolean)
        .join(', ');
      notices.push({
        text: `Technique used: ${technique.identity.name} (${spent}).`,
        fact: `The player used the technique ${technique.identity.name}.`,
      });
    }
  }

  const repeat = was.lastUse?.line === line && was.lastUse?.scene === scene;
  if (!repeat && rec.rank < NAMED_SKILL_RANK_CAP) {
    rec.uses += 1;
    rec.lastUse = { line, scene };
    const rank = rankForUses(rec.uses);
    if (rank > rec.rank) {
      rec.rank = rank;
      const msg = libraryMessage(id, `Skill rank up: ${base.identity.name}`);
      notices.unshift({
        text: `${msg} (rank ${rank}).`,
        fact: `The System raised the skill ${base.identity.name} to rank ${rank}.`,
      });
      const evolved = rank >= NAMED_SKILL_RANK_CAP && !rec.evolvedTo ? evolutionOf(id) : null;
      if (evolved) {
        rec.evolvedTo = evolved.identity.id;
        const learned = libraryMessage(evolved.identity.id, `Technique learned: ${evolved.identity.name}`);
        notices.unshift({
          text: `${learned} (${base.identity.name} evolved).`,
          fact: `The System evolved the skill ${base.identity.name} into ${evolved.identity.name}.`,
        });
      }
    }
  }

  const updated = recs.some((r) => r.id === id) ? recs.map((r) => (r.id === id ? rec : r)) : [...recs, rec];
  next = { ...next, character: { ...character, namedSkills: updated } };
  const top = notices[0];
  if (!top || hidesPart(next.systemHousing, 'skills')) return { state: next, receipts: [] };
  return { state: next, receipts: [top.text], fact: top.fact };
}
