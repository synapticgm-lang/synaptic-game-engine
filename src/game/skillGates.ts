/**
 * 29z3 — Fallout-style skill gates on the existing check skills (no new skill tree).
 * A safe / locked chest / stuck door stays shut until the character has the rank.
 * Each level-up grants one rank, so a level-up always changes what the player can do.
 */

import type { GameState } from './types';
import type { ActiveDungeonState, MapNode, SkillGate } from './mapEngine';
import { isDoorLockedFor } from './mapEngine';
import { currentDungeonNode, lootableLockedFor } from './dungeonSeed';
import { CHECK_SKILLS, skillRankOf, skillRanksOf, type CheckSkillName } from './skillRanks';

const SKILL_LABEL: Record<CheckSkillName, string> = {
  athletics: 'Athletics',
  perception: 'Perception',
  investigation: 'Investigation',
  stealth: 'Stealth',
  thievery: 'Thievery',
  persuasion: 'Persuasion',
  arcana: 'Arcana',
  survival: 'Survival',
};

/** What a rank lets the player do, in plain words. */
const SKILL_USE: Record<CheckSkillName, string> = {
  athletics: 'force stuck and barred doors',
  thievery: 'pick locks and crack safes',
  arcana: 'open warded locks and consoles',
  perception: 'spot traps and ambushes sooner',
  investigation: 'find hidden panels and clues sooner',
  stealth: 'slip past and flee more easily',
  persuasion: 'win more hard talks',
  survival: 'rest and track better on the road',
};

/** Level-up order when no lock is waiting: gate skills first, then the rest. */
const GRANT_ORDER: CheckSkillName[] = [
  'thievery',
  'athletics',
  'arcana',
  'perception',
  'persuasion',
  'stealth',
  'investigation',
  'survival',
];

export interface GateRef {
  id: string;
  label: string;
  kind: 'safe' | 'door';
  lock: SkillGate;
  nodeId: string;
}

export function skillLabel(skill: string): string {
  return SKILL_LABEL[skill as CheckSkillName] ?? skill;
}

export function skillGateBlockedLine(what: string, lock: SkillGate, state: GameState): string {
  const have = skillRankOf(state.character, lock.skill);
  return `${what} is locked. It needs ${skillLabel(lock.skill)} ${lock.rank} (you have ${have}); it stays shut.`;
}

function explorable(state: GameState): ActiveDungeonState | null {
  const d = state.activeDungeon;
  return d?.nodes?.length ? d : null;
}

/** Every lock in the current map (safes anywhere, doors into rooms not yet opened). */
export function allGates(state: GameState): GateRef[] {
  const d = explorable(state);
  if (!d) return [];
  const out: GateRef[] = [];
  for (const n of d.nodes) {
    for (const l of n.hidden?.lootables ?? []) {
      if (l.lock && !l.opened) out.push({ id: l.id, label: l.label, kind: 'safe', lock: l.lock, nodeId: n.id });
    }
    const door = n.hidden?.doorLock;
    if (door && !(n.tags ?? []).includes('door-opened')) {
      out.push({ id: `door:${n.id}`, label: `door to ${n.name}`, kind: 'door', lock: door, nodeId: n.id });
    }
  }
  return out;
}

/** Locks the player can reach right now: safes in this room, doors off this room. */
export function gatesHere(state: GameState): GateRef[] {
  const d = explorable(state);
  const here = currentDungeonNode(d);
  if (!d || !here) return [];
  const near = new Set(here.connections);
  return allGates(state).filter((g) => (g.kind === 'safe' ? g.nodeId === here.id : near.has(g.nodeId)));
}

export function gateOpenFor(state: GameState, gate: GateRef): boolean {
  return skillRankOf(state.character, gate.lock.skill) >= gate.lock.rank;
}

const CONTAINER = /\b(chest|cache|coffer|crate|stash|console|container|box|locker|safe|strongbox)\b/i;
const OPEN_ACT = /\b(open|loot|pry|unlock|pick|crack|force|search|rummage)\b/i;

/** The closed safe this line acts on, if any (named first, else the first closed one here). */
export function lootableTargetFor(state: GameState, input: string) {
  const node = currentDungeonNode(explorable(state));
  const closed = (node?.hidden?.lootables ?? []).filter((l) => !l.opened);
  if (!closed.length) return null;
  const low = (input ?? '').toLowerCase();
  const named = closed.find((l) => low.includes(l.label.toLowerCase()));
  if (named) return named;
  return OPEN_ACT.test(low) && CONTAINER.test(low) ? closed[0]! : null;
}

/** GM loot from a safe the player cannot open yet: returns the safe label to block the gain. */
export function lockedContainerBlocksGain(state: GameState, input: string): string | null {
  const node = currentDungeonNode(explorable(state));
  const closed = (node?.hidden?.lootables ?? []).filter((l) => !l.opened);
  if (!closed.length || !CONTAINER.test(input ?? '')) return null;
  const ranks = skillRanksOf(state.character);
  const target = lootableTargetFor(state, input);
  if (target) return lootableLockedFor(target, ranks) ? target.label : null;
  return closed.every((l) => lootableLockedFor(l, ranks)) ? closed[0]!.label : null;
}

export function recordGateTry(state: GameState, gate: { id: string; label: string; lock: SkillGate }): GameState {
  const tries = (state.skillGateTries ?? []).filter((t) => t.id !== gate.id);
  return {
    ...state,
    skillGateTries: [
      ...tries,
      { id: gate.id, label: gate.label, skill: gate.lock.skill, rank: gate.lock.rank, turn: state.turn ?? 0 },
    ].slice(-8),
  };
}

function pickGrantSkill(state: GameState): CheckSkillName {
  const shut = (s: string, rank: number) => skillRankOf(state.character, s as CheckSkillName) < rank;
  const tried = [...(state.skillGateTries ?? [])].reverse().find((t) => shut(t.skill, t.rank));
  if (tried && (CHECK_SKILLS as readonly string[]).includes(tried.skill)) return tried.skill as CheckSkillName;
  const seen = allGates(state)
    .filter((g) => !gateOpenFor(state, g))
    .sort((a, b) => a.lock.rank - b.lock.rank)[0];
  if (seen) return seen.lock.skill;
  const lvl = state.character?.level ?? 1;
  return GRANT_ORDER[(lvl - 2 + GRANT_ORDER.length) % GRANT_ORDER.length]!;
}

/**
 * One rank per level gained since `levelBefore`. Receipts say what the player can now do,
 * including any lock that opens now.
 */
export function grantLevelSkills(state: GameState, levelBefore: number): { state: GameState; receipts: string[] } {
  const c = state.character;
  if (!c) return { state, receipts: [] };
  const level = c.level ?? 1;
  let through = c.skillsGrantedThrough ?? Math.min(levelBefore, level);
  if (through >= level) {
    return c.skillsGrantedThrough == null
      ? { state: { ...state, character: { ...c, skillsGrantedThrough: level } }, receipts: [] }
      : { state, receipts: [] };
  }
  let next = state;
  const receipts: string[] = [];
  while (through < level) {
    through += 1;
    const openBefore = new Set(allGates(next).filter((g) => gateOpenFor(next, g)).map((g) => g.id));
    const skill = pickGrantSkill({ ...next, character: { ...next.character, level: through } });
    const rank = skillRankOf(next.character, skill) + 1;
    next = {
      ...next,
      character: { ...next.character, skills: { ...(next.character.skills ?? {}), [skill]: rank } },
    };
    receipts.push(`Level ${through}: ${skillLabel(skill)} rank ${rank} — you can now ${SKILL_USE[skill]} (rank ${rank}).`);
    const opened = allGates(next).filter((g) => gateOpenFor(next, g) && !openBefore.has(g.id));
    if (opened.length) receipts.push(`Now within reach: the ${opened.map((g) => g.label).join(', the ')}.`);
  }
  next = { ...next, character: { ...next.character, skillsGrantedThrough: level } };
  return { state: next, receipts };
}

/** What the player can do: every skill rank plus every lock in reach that would open. */
export function canDoKeys(state: GameState): string[] {
  const ranks = skillRanksOf(state.character);
  const keys = CHECK_SKILLS.map((s) => `${s}:${ranks[s]}`);
  for (const g of allGates(state)) if (gateOpenFor(state, g)) keys.push(`open:${g.id}`);
  return keys;
}

/** Writer facts: the locks in reach and whether they open for this character. */
export function gateFactLines(state: GameState): string[] {
  return gatesHere(state).map((g) => {
    const need = `${skillLabel(g.lock.skill)} ${g.lock.rank}`;
    const what = `The ${g.label}`;
    return gateOpenFor(state, g)
      ? `${what} is locked (needs ${need}); the player has the skill, so it can open.`
      : `${what} is locked (needs ${need}); the player lacks it, so it stays shut whatever they try.`;
  });
}

const OPEN_CHIP = /^(?:open|loot|pry|unlock|pick the lock|crack|force (?:open )?the)\b/i;

/** A chip that opens a lock the character cannot open yet. */
export function gateChipProblem(state: GameState, label: string): string | null {
  const t = (label ?? '').trim();
  if (!OPEN_CHIP.test(t)) return null;
  const low = t.toLowerCase();
  const ranks = skillRanksOf(state.character);
  const d = explorable(state);
  const here = currentDungeonNode(d);
  if (d && here) {
    for (const id of here.connections) {
      const n = d.nodes.find((x) => x.id === id) as MapNode | undefined;
      if (n?.hidden?.doorLock && low.includes(n.name.toLowerCase()) && isDoorLockedFor(d, id, ranks)) {
        return `"${t}" opens the door to ${n.name}, which needs ${skillLabel(n.hidden.doorLock.skill)} ${n.hidden.doorLock.rank}`;
      }
    }
  }
  const target = lootableTargetFor(state, t);
  if (target?.lock && lootableLockedFor(target, ranks)) {
    return `"${t}" opens the ${target.label}, which needs ${skillLabel(target.lock.skill)} ${target.lock.rank}`;
  }
  return null;
}

/** Tester: locks that opened this turn without the skill. */
export function locksOpenedWithoutSkill(before: GameState, after: GameState): string[] {
  const b = before.activeDungeon;
  const a = after.activeDungeon;
  if (!b?.nodes?.length || !a?.nodes?.length || b.dungeonName !== a.dungeonName) return [];
  const ranks = skillRanksOf(after.character);
  const out: string[] = [];
  for (const n of a.nodes) {
    const old = b.nodes.find((x) => x.id === n.id);
    if (!old) continue;
    for (const l of n.hidden?.lootables ?? []) {
      const was = old.hidden?.lootables.find((x) => x.id === l.id);
      if (l.lock && l.opened && was && !was.opened && lootableLockedFor(l, ranks)) {
        out.push(`the ${l.label} opened without ${skillLabel(l.lock.skill)} ${l.lock.rank}`);
      }
    }
    const door = n.hidden?.doorLock;
    if (door && a.currentNodeId === n.id && b.currentNodeId !== n.id
      && !(old.tags ?? []).includes('door-opened') && (ranks[door.skill] ?? 0) < door.rank) {
      out.push(`the door to ${n.name} opened without ${skillLabel(door.skill)} ${door.rank}`);
    }
  }
  return out;
}
