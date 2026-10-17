/**
 * LK-1 — locks and alarms (all modes). One resolve path: key, pick (SK-4), fail time +
 * earshot noise (SK-3), three-fail tool break, spot/disarm alarm. No parallel checker.
 * CR-1 — camp rob sequences SK-3 per watcher, then LK-1 lock, then LK-1 alarm.
 */
import type { GameState, Item, PlaceRecord } from './types';
import type { ActiveDungeonState, LockAlarm, LockKind, SkillGate } from './mapEngine';
import type { PlayerCheckResult, SkillTierName } from './checkMath';
import { runPlayerCheck } from './checkMath';
import { currentDungeonNode } from './dungeonSeed';
import { lootableTargetFor } from './skillGates';
import { advanceClock } from './travelJourney';
import { individualStealth } from './rules/roundCombat';
import { peopleHere } from './chipLegality';
import type { PlayerIntent } from './intentParser';
import { chestProfileForGrade, rollLoot } from './lootTableRegistry';
import { gainLootMoney, lootMoneyText } from './rules/coins';
import { formatResultLine, outcomeFactFromRecord } from './rules/rollView';

export type LockSpec = SkillGate & { kind: LockKind; dc: number; tier: SkillTierName; tryHours: number };

const ALARM = { spotDc: 14, disarmDc: 15, sounds: true as const };

/** Kind defaults (data, not prose). Safe / guarded are harder and carry an alarm. */
export const LOCK_KIND_DEFAULTS: Record<LockKind, Omit<LockSpec, 'skill' | 'rank'> & Partial<Pick<SkillGate, 'skill' | 'rank'>>> = {
  door: { kind: 'door', dc: 15, tier: 'Apprentice', tryHours: 0.1 },
  chest: { kind: 'chest', dc: 15, tier: 'Apprentice', tryHours: 0.1, skill: 'thievery', rank: 1 },
  safe: { kind: 'safe', dc: 20, tier: 'Expert', tryHours: 0.25, skill: 'thievery', rank: 2, alarm: ALARM },
  guarded: { kind: 'guarded', dc: 18, tier: 'Journeyman', tryHours: 0.2, skill: 'thievery', rank: 1, alarm: ALARM },
};

export function normalizeLock(gate: SkillGate, fallbackKind: LockKind = 'chest'): LockSpec {
  const kind = gate.kind ?? fallbackKind;
  const base = LOCK_KIND_DEFAULTS[kind];
  return {
    skill: gate.skill ?? base.skill ?? 'thievery',
    rank: gate.rank ?? base.rank ?? 0,
    kind,
    dc: gate.dc ?? base.dc,
    tier: (gate.tier ?? base.tier) as SkillTierName,
    key: gate.key ?? base.key,
    alarm: gate.alarm ?? base.alarm,
    tryHours: gate.tryHours ?? base.tryHours,
  };
}

export function defaultLockForKind(kind: LockKind): LockSpec {
  const d = LOCK_KIND_DEFAULTS[kind];
  return normalizeLock({
    skill: (d.skill ?? 'thievery') as SkillGate['skill'],
    rank: d.rank ?? 0,
    kind: d.kind, dc: d.dc, tier: d.tier, key: d.key,
    alarm: d.alarm as LockAlarm | undefined,
    tryHours: d.tryHours,
  }, kind);
}

export function pickToolsOf(state: GameState): Item | null {
  const inv = state.inventory ?? [];
  for (let i = 0; i < inv.length; i++) {
    const n = (inv[i]!.name ?? '').toLowerCase();
    if (n.includes('broken')) continue;
    if (n.includes("thieves' tools") || n.includes('thieves tools') || n.includes('lockpick') || n.includes('lock pick') || n.endsWith('picks') || n === 'picks') {
      return inv[i]!;
    }
  }
  return null;
}

export function toolMinSkillLevel(item: Item): number {
  const n = (item.name ?? '').toLowerCase();
  if (n.includes('master')) return 41;
  if (n.includes('expert')) return 31;
  if (n.includes('journeyman')) return 21;
  return 0;
}

export function lockpickLevel(state: GameState): number {
  const skills = state.character.namedSkills ?? [];
  for (let i = 0; i < skills.length; i++) {
    const id = (skills[i]!.id ?? '').toLowerCase();
    if ((id.includes('lockpick') || id.includes('thiev')) && typeof skills[i]!.level === 'number') {
      return skills[i]!.level!;
    }
  }
  const raw = state.character.skills?.thievery;
  return raw != null ? Math.floor(Number(raw) || 0) : 0;
}

export function lockTargetFor(state: GameState, action: string): { id: string; label: string; lock: LockSpec; nodeId: string } | null {
  const loot = lootableTargetFor(state, action);
  if (loot?.lock) {
    const node = currentDungeonNode(state.activeDungeon);
    const lab = (loot.label ?? '').toLowerCase();
    const kind: LockKind = lab.includes('safe') || lab.includes('strongbox') || lab.includes('vault') ? 'safe' : 'chest';
    return { id: loot.id, label: loot.label, lock: normalizeLock(loot.lock, kind), nodeId: node?.id ?? '' };
  }
  const d = state.activeDungeon;
  const here = d?.currentNodeId;
  if (!d || !here) return null;
  const act = (action ?? '').toLowerCase();
  const alarmAct = ((act.includes('spot') || act.includes('search for') || act.includes('look for') || act.includes('check for') || act.includes('find')
    || act.includes('disarm') || act.includes('disable') || act.includes('cut'))
    && (act.includes('alarm') || act.includes('wire') || act.includes('device')));
  // LK-1 / CR-1: alarm spot/disarm still targets an opened lock whose alarm is armed.
  if (alarmAct) {
    for (let i = 0; i < d.nodes.length; i++) {
      const n = d.nodes[i]!;
      const lootables = n.hidden?.lootables ?? [];
      for (let j = 0; j < lootables.length; j++) {
        const l = lootables[j]!;
        if (!l.lock?.alarm) continue;
        if (state.lockAttempts?.[l.id]?.alarmDisarmed) continue;
        if (act.includes((l.label ?? '').toLowerCase()) || n.id === here) {
          const lab = (l.label ?? '').toLowerCase();
          const kind: LockKind = lab.includes('safe') || lab.includes('strongbox') || lab.includes('vault') ? 'safe' : (l.lock.kind ?? 'chest');
          return { id: l.id, label: l.label, lock: normalizeLock(l.lock, kind), nodeId: n.id };
        }
      }
    }
  }
  let hereNode = null as (typeof d.nodes)[0] | null;
  for (let i = 0; i < d.nodes.length; i++) if (d.nodes[i]!.id === here) { hereNode = d.nodes[i]!; break; }
  const conns = hereNode?.connections ?? [];
  for (let i = 0; i < conns.length; i++) {
    let n = null as (typeof d.nodes)[0] | null;
    for (let j = 0; j < d.nodes.length; j++) if (d.nodes[j]!.id === conns[i]) { n = d.nodes[j]!; break; }
    const door = n?.hidden?.doorLock;
    if (!n || !door || (n.tags ?? []).includes('door-opened')) continue;
    if (act.includes((n.name ?? '').toLowerCase()) || act.includes('door')) {
      return { id: `door:${n.id}`, label: `door to ${n.name}`, lock: normalizeLock(door, 'door'), nodeId: n.id };
    }
  }
  return null;
}

export interface LockAttemptRolls {
  pick?: PlayerCheckResult;
  spotD20?: number;
  disarmD20?: number;
  stealthTotal?: number;
}

export interface LockAttemptResult {
  state: GameState;
  receipts: string[];
  opened: boolean;
  refused?: boolean;
  alarmSounded?: boolean;
  noticed?: boolean;
  toolsBroken?: boolean;
}

function openAndClearFails(state: GameState, id: string, nodeId: string): GameState {
  const d = state.activeDungeon;
  const nodes = d ? [...d.nodes] : [];
  if (d && id.startsWith('door:')) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      if (n.id !== nodeId) continue;
      nodes[i] = { ...n, tags: Array.from(new Set([...(n.tags ?? []), 'door-opened'])) };
    }
  } else if (d) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      if (!n.hidden?.lootables) continue;
      let hit = false;
      const lootables = [...n.hidden.lootables];
      for (let j = 0; j < lootables.length; j++) {
        if (lootables[j]!.id !== id) continue;
        hit = true;
        lootables[j] = { ...lootables[j]!, opened: true };
      }
      if (hit) nodes[i] = { ...n, hidden: { ...n.hidden, lootables } };
    }
  }
  const cur = state.lockAttempts?.[id] ?? { failsInRow: 0 };
  return {
    ...state,
    activeDungeon: d ? { ...d, nodes } : d,
    lockAttempts: { ...(state.lockAttempts ?? {}), [id]: { ...cur, failsInRow: 0 } },
  };
}

/**
 * Resolve a lock / alarm action. Uses SK-4 for picks, SK-3 for fail noise, world clock for try time.
 */
export function resolveLockAttempt(
  state: GameState,
  action: string,
  rolls: LockAttemptRolls = {},
): LockAttemptResult | null {
  const target = lockTargetFor(state, action);
  if (!target) return null;
  const { id, label, lock, nodeId } = target;
  const mem = state.lockAttempts?.[id] ?? { failsInRow: 0 };
  const receipts: string[] = [];
  const act = (action ?? '').toLowerCase();
  const pickAct = act.includes('pick the lock') || act.includes('lockpick') || act.includes('jimmy') || act.includes('pick it');
  const unlockAct = act.includes('unlock') || act.includes('open') || act.includes('use the key') || act.includes('turn the key') || act.includes('key');
  const spotAct = (act.includes('spot') || act.includes('search for') || act.includes('look for') || act.includes('check for') || act.includes('find'))
    && (act.includes('alarm') || act.includes('wire') || act.includes('device'));
  const disarmAct = (act.includes('disarm') || act.includes('disable') || act.includes('cut'))
    && (act.includes('alarm') || act.includes('wire') || act.includes('device'));

  if (lock.key) {
    const want = lock.key.toLowerCase();
    const inv = state.inventory ?? [];
      let keyItem: Item | null = null;
    for (let i = 0; i < inv.length; i++) {
      const n = (inv[i]!.name ?? '').toLowerCase();
      const iid = (inv[i]!.id ?? '').toLowerCase();
      if (n === want || iid === want || n.includes(want)) { keyItem = inv[i]!; break; }
    }
    if (keyItem && (unlockAct || pickAct)) {
      receipts.push(`Lock: the ${label} opens with the ${keyItem.name}.`);
      return { state: openAndClearFails(state, id, nodeId), receipts, opened: true };
    }
  }

  if (lock.alarm && spotAct) {
    const intent: PlayerIntent = { kind: 'observe', label: 'Spot alarm', targets: ['alarm'] };
    const check = runPlayerCheck(state, intent, action, rolls.spotD20);
    const ok = check.totalScore >= lock.alarm.spotDc;
    receipts.push(ok ? `Lock: you spot an alarm on the ${label}.` : `Lock: you find no alarm on the ${label}.`);
    if (check.record) receipts.push(formatResultLine(check.record), outcomeFactFromRecord(check.record));
    if (!ok) return { state, receipts, opened: false };
    const cur = state.lockAttempts?.[id] ?? { failsInRow: 0 };
    return {
      state: { ...state, lockAttempts: { ...(state.lockAttempts ?? {}), [id]: { ...cur, alarmSpotted: true } } },
      receipts,
      opened: false,
    };
  }

  if (lock.alarm && disarmAct) {
    if (!mem.alarmSpotted) {
      receipts.push(`Lock: you have not spotted an alarm on the ${label}.`);
      return { state, receipts, opened: false, refused: true };
    }
    if (!pickToolsOf(state)) {
      receipts.push(`Lock: you need Thieves' Tools.`);
      return { state, receipts, opened: false, refused: true };
    }
    const intent: PlayerIntent = { kind: 'search', label: 'Disarm alarm', targets: ['alarm'] };
    const check = runPlayerCheck(state, intent, 'disarm the alarm with thieves tools', rolls.disarmD20);
    const ok = check.totalScore >= lock.alarm.disarmDc;
    receipts.push(ok ? `Lock: you disarm the alarm on the ${label}.` : `Lock: the disarm fails on the ${label}.`);
    if (check.record) receipts.push(formatResultLine(check.record), outcomeFactFromRecord(check.record));
    if (!ok) return { state, receipts, opened: false };
    const cur = state.lockAttempts?.[id] ?? { failsInRow: 0 };
    return {
      state: { ...state, lockAttempts: { ...(state.lockAttempts ?? {}), [id]: { ...cur, alarmDisarmed: true } } },
      receipts,
      opened: false,
    };
  }

  if (!pickAct && !unlockAct) return null;

  const tools = pickToolsOf(state);
  if (!tools) {
    receipts.push(`Lock: you need Thieves' Tools.`);
    return { state, receipts, opened: false, refused: true };
  }
  if (state.engineMode !== 'dnd' && toolMinSkillLevel(tools) > 0 && lockpickLevel(state) < toolMinSkillLevel(tools)) {
    receipts.push(`Lock: you lack the skill for these tools.`);
    return { state, receipts, opened: false, refused: true };
  }

  const intent: PlayerIntent = { kind: 'search', label: 'Pick', targets: ['lock'] };
  const check = rolls.pick ?? runPlayerCheck(state, intent, `pick the lock on the ${label}`);
  const success = state.engineMode === 'dnd' ? check.totalScore >= (lock.dc ?? 15) : check.isSuccess;
  if (success) {
    receipts.push(`Lock: you pick the ${label}.`);
    if (check.record) receipts.push(formatResultLine(check.record), outcomeFactFromRecord(check.record));
    return { state: openAndClearFails(state, id, nodeId), receipts, opened: true };
  }

  const clock = advanceClock(state, lock.tryHours);
  const fails = (mem.failsInRow ?? 0) + 1;
  let next: GameState = {
    ...clock.state,
    lockAttempts: { ...(clock.state.lockAttempts ?? {}), [id]: { ...mem, failsInRow: fails } },
  };
  receipts.push(`Lock: the pick on the ${label} fails (${clock.note}).`);
  if (check.record) receipts.push(formatResultLine(check.record), outcomeFactFromRecord(check.record));

  let alarmSounded = false;
  let noticed = false;
  if (lock.alarm && !mem.alarmSpotted && !mem.alarmDisarmed && lock.alarm.sounds) {
    alarmSounded = true;
    noticed = true;
    next = { ...next, lockAttempts: { ...(next.lockAttempts ?? {}), [id]: { ...next.lockAttempts![id]!, alarmSounded: true } } };
    receipts.push(`Lock: the alarm on the ${label} sounds.`);
  } else {
    const names = peopleHere(next);
    const watchers: { name: string; passivePerception: number }[] = [];
    for (let i = 0; i < names.length; i++) {
      let pp = 12;
      const mems = next.npcMemories ?? [];
      for (let j = 0; j < mems.length; j++) {
        if (mems[j]!.npcName === names[i]) {
          pp = Number((mems[j] as { passivePerception?: number }).passivePerception ?? 12);
          break;
        }
      }
      watchers.push({ name: names[i]!, passivePerception: pp });
    }
    if (watchers.length) {
      const stealthTotal = rolls.stealthTotal ?? Math.max(1, check.totalScore - 5);
      noticed = individualStealth([{ name: next.character.name || 'you', stealthTotal }], watchers).noticed;
      if (noticed) receipts.push(`Lock: the noise alerts someone nearby.`);
    }
  }

  let toolsBroken = false;
  if (fails >= 3) {
    toolsBroken = true;
    const kept: Item[] = [];
    const inv = next.inventory ?? [];
    for (let i = 0; i < inv.length; i++) if (inv[i]!.id !== tools.id) kept.push(inv[i]!);
    next = {
      ...next,
      inventory: kept,
      lockAttempts: { ...(next.lockAttempts ?? {}), [id]: { ...next.lockAttempts![id]!, failsInRow: 0 } },
    };
    receipts.push(`Lock: your picks snap${state.engineMode === 'dnd' ? ' (GM ruling)' : ''}.`);
  }

  return { state: next, receipts, opened: false, alarmSounded, noticed, toolsBroken };
}

export type CampRobOutcome = 'noticed' | 'lock-fail' | 'alarm' | 'robbed' | 'refused';

export interface CampRobRolls {
  stealthTotals?: number[];
  pick?: PlayerCheckResult;
  spotD20?: number;
  disarmD20?: number;
}

export interface CampRobResult {
  state: GameState;
  receipts: string[];
  outcome: CampRobOutcome;
  steps: string[];
  wake?: boolean;
}

function campStashOf(d: ActiveDungeonState): { id: string; label: string; nodeId: string; grade: number } | null {
  let best: { id: string; label: string; nodeId: string; grade: number } | null = null;
  for (let i = 0; i < d.nodes.length; i++) {
    const n = d.nodes[i]!;
    const loot = n.hidden?.lootables;
    if (!loot) continue;
    for (let j = 0; j < loot.length; j++) {
      const l = loot[j]!;
      if (l.opened) continue;
      const grade = l.loot?.grade ?? 0;
      const stash = (l.label ?? '').toLowerCase().includes('stash');
      if (stash || !best || grade > best.grade) {
        best = { id: l.id, label: l.label, nodeId: n.id, grade };
        if (stash) return best;
      }
    }
  }
  return best;
}

function syncCampCard(state: GameState, placeId: string): GameState {
  const d = state.activeDungeon;
  if (!d) return state;
  const places = state.places ?? [];
  const out: PlaceRecord[] = [];
  for (let i = 0; i < places.length; i++) {
    const p = places[i]!;
    out.push(p.id === placeId ? { ...p, dungeonCard: d } : p);
  }
  return { ...state, places: out };
}

/** CR-1: stealth×watchers → LK-1 lock → LK-1 alarm; first fail stops; noticed wakes camp (no loot). */
export function resolveCampRob(
  state: GameState,
  place: PlaceRecord,
  rolls: CampRobRolls = {},
): CampRobResult | null {
  const camp = place.roadCamp;
  const card = place.dungeonCard;
  if (!camp || !card) return null;
  const watchers: { name: string; passivePerception: number }[] = [];
  for (let i = 0; i < camp.people.length; i++) {
    const name = camp.people[i]!;
    let pp = 12;
    const mems = state.npcMemories ?? [];
    for (let j = 0; j < mems.length; j++) {
      if (mems[j]!.npcName === name) {
        pp = Number((mems[j] as { passivePerception?: number }).passivePerception ?? 12);
        break;
      }
    }
    watchers.push({ name, passivePerception: pp });
  }
  if (!watchers.length) return null;

  const stashNode = campStashOf(card);
  if (!stashNode) return null;
  let next: GameState = {
    ...state,
    activeDungeon: { ...card, currentNodeId: stashNode.nodeId, visitedNodeIds: Array.from(new Set([...(card.visitedNodeIds ?? []), stashNode.nodeId])) },
  };
  const receipts: string[] = [];
  const steps: string[] = [];
  const sneaker = next.character.name || 'you';

  for (let i = 0; i < watchers.length; i++) {
    const w = watchers[i]!;
    steps.push(`stealth:${w.name}`);
    let total = rolls.stealthTotals?.[i];
    if (total == null) {
      const intent: PlayerIntent = { kind: 'flee', label: 'Stealth', targets: [w.name] };
      total = runPlayerCheck(next, intent, `sneak past ${w.name}`).totalScore;
    }
    const seen = individualStealth([{ name: sneaker, stealthTotal: total }], [w]).noticed;
    receipts.push(`Camp rob: Stealth vs ${w.name} (total ${total} vs PP ${w.passivePerception}) — ${seen ? 'noticed' : 'clear'}.`);
    if (seen) {
      return { state: syncCampCard(next, place.id), receipts, outcome: 'noticed', steps, wake: true };
    }
  }

  const pickAct = `pick the lock on the ${stashNode.label}`;
  const preLock = lockTargetFor(next, pickAct);
  if (!preLock) {
    receipts.push(`Camp rob: no lock on the ${stashNode.label}.`);
    return { state: syncCampCard(next, place.id), receipts, outcome: 'refused', steps };
  }
  const stashAlarm = preLock.lock.alarm;
  steps.push('lock');
  const lockTry = resolveLockAttempt(next, pickAct, { pick: rolls.pick });
  if (!lockTry) {
    receipts.push(`Camp rob: no lock on the ${stashNode.label}.`);
    return { state: syncCampCard(next, place.id), receipts, outcome: 'refused', steps };
  }
  next = lockTry.state;
  receipts.push(...lockTry.receipts);
  if (lockTry.refused) {
    return { state: syncCampCard(next, place.id), receipts, outcome: 'refused', steps };
  }
  if (!lockTry.opened) {
    const wake = !!(lockTry.noticed || lockTry.alarmSounded);
    return {
      state: syncCampCard(next, place.id),
      receipts,
      outcome: lockTry.alarmSounded ? 'alarm' : 'lock-fail',
      steps,
      ...(wake ? { wake: true } : {}),
    };
  }

  if (stashAlarm && !next.lockAttempts?.[stashNode.id]?.alarmDisarmed) {
    steps.push('alarm');
    if (!next.lockAttempts?.[stashNode.id]?.alarmSpotted) {
      const spot = resolveLockAttempt(next, `spot the alarm on the ${stashNode.label}`, { spotD20: rolls.spotD20 });
      if (spot) {
        next = spot.state;
        receipts.push(...spot.receipts);
      }
    }
    if (!next.lockAttempts?.[stashNode.id]?.alarmSpotted) {
      receipts.push(`Camp rob: the alarm on the ${stashNode.label} sounds.`);
      return { state: syncCampCard(next, place.id), receipts, outcome: 'alarm', steps, wake: true };
    }
    const disarm = resolveLockAttempt(next, `disarm the alarm on the ${stashNode.label}`, { disarmD20: rolls.disarmD20 });
    if (!disarm || disarm.refused) {
      receipts.push(...(disarm?.receipts ?? [`Camp rob: could not disarm the alarm.`]));
      return { state: syncCampCard(disarm?.state ?? next, place.id), receipts, outcome: 'alarm', steps, wake: true };
    }
    next = disarm.state;
    receipts.push(...disarm.receipts);
    if (!next.lockAttempts?.[stashNode.id]?.alarmDisarmed) {
      receipts.push(`Camp rob: the alarm on the ${stashNode.label} sounds.`);
      return { state: syncCampCard(next, place.id), receipts, outcome: 'alarm', steps, wake: true };
    }
  }

  let openedGrade = stashNode.grade;
  const nodes = next.activeDungeon?.nodes ?? [];
  for (let i = 0; i < nodes.length; i++) {
    const lootables = nodes[i]!.hidden?.lootables ?? [];
    for (let j = 0; j < lootables.length; j++) {
      if (lootables[j]!.id === stashNode.id) {
        openedGrade = lootables[j]!.loot?.grade ?? openedGrade;
      }
    }
  }
  const grade = openedGrade > 0 ? openedGrade : 2;
  const provenance = `Stolen from ${place.name}`;
  const loot = rollLoot({
    profile: chestProfileForGrade(grade),
    state: next,
    seed: `${next.seed ?? 'seed'}:camp-rob:${place.id}:${stashNode.id}`,
  });
  const items = [];
  for (let i = 0; i < loot.items.length; i++) {
    items.push({ ...loot.items[i]!, provenance });
  }
  next = gainLootMoney({
    ...next,
    inventory: [...(next.inventory ?? []), ...items],
    lootPity: loot.nextPity != null
      ? { byTier: { ...(next.lootPity?.byTier ?? {}), [loot.pityTier]: loot.nextPity } }
      : next.lootPity,
  }, loot.gold, loot.coins);
  receipts.push(`Camp rob: you open the ${stashNode.label}.`);
  if (items.length) receipts.push(`Loot: ${items.map((it) => `[${it.rarity}] ${it.name}`).join(', ')} (${provenance})`);
  const money = lootMoneyText(loot.gold, loot.coins);
  if (money) receipts.push(`Gold Gained: ${money}`);
  if (!items.length && !money) receipts.push(`Camp rob: the ${stashNode.label} was empty.`);

  return { state: syncCampCard(next, place.id), receipts, outcome: 'robbed', steps };
}
