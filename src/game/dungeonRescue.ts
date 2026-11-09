/**
 * Dungeon captives and inhabitants. The card is the authority.
 * A captive stays held until the card has no remaining mob and their lock commits.
 * Healing is required only when this quest stored requireHeal.
 * Keys and lock-picking XP are spent only on that commit.
 */
import type { GameState, Item, NpcMemory, Quest } from './types';
import type {
  ActiveDungeonState,
  CardRescue,
  DungeonDwell,
  RescueKeyDef,
} from './mapEngine';
import { mobCountsAsRemaining } from './dungeonMobLedger';
import { pickPersonName } from './personNames';
import { createHashRng, hashUnit } from './seededRng';
import { applySkillXp } from './rules/skillGrowth';
import { lockpickLevel } from './lockAttempt';

const HOLDING = /niche|vault|locked|strong-room|strongroom/i;
const MANY = /row|gallery/i;
/** Gap of 6 (required 7, skill 1) is 1e-6. The rest of the curve is this calibration, not a d20. */
const HARD_PICK_SKILL_XP = 5;

export function holdingRoomName(name: string | undefined): boolean {
  return HOLDING.test(name ?? '');
}

export function cardIsClear(card: ActiveDungeonState | null | undefined): boolean {
  const mobs = (card?.nodes ?? []).flatMap((n) => n.hidden?.mobs ?? []);
  return mobs.every((m) => !mobCountsAsRemaining(m));
}

/** Chance a pickable lock opens. At or above the lock, the attempt is likely. Each level below divides by ten. */
export function rescuePickChance(skill: number, required: number): number {
  const gap = required - skill;
  if (gap <= 0) return Math.min(0.95, 0.6 + (skill - required) * 0.05);
  return 10 ** -gap;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
}

function patchCard(state: GameState, card: ActiveDungeonState): GameState {
  const places = (state.places ?? []).map((p) =>
    p.dungeonCard && (p.dungeonCard.siteName ?? p.dungeonCard.dungeonName) === (card.siteName ?? card.dungeonName)
      ? { ...p, dungeonCard: card }
      : p
  );
  return { ...state, activeDungeon: card, places };
}

function secretOpen(card: ActiveDungeonState, nodeId: string): boolean {
  const node = card.nodes.find((n) => n.id === nodeId);
  if (!node?.isSecret) return true;
  for (const n of card.nodes) {
    for (const s of n.hidden?.secrets ?? []) {
      if (s.unlocksNodeId === nodeId && s.revealed) return true;
    }
  }
  return false;
}

/** Seed people once, when the card is first built. A card that already has `dwell` is left alone. */
export function seedDungeonRescue(card: ActiveDungeonState, seedKey: string): ActiveDungeonState {
  if (card.dwell) return card;
  if (card.blueprintId !== 'dungeon-card') return card;
  const rng = createHashRng(seedKey, card.siteName ?? card.dungeonName, 'rescue');
  const taken = new Set<string>();
  const holding = card.nodes.filter((n) => holdingRoomName(n.name) && !n.hidden?.mobs?.some((m) => m.role === 'miniBoss'));
  const quiet = card.nodes.filter((n) => !n.isSecret && !(n.hidden?.mobs ?? []).length && n.tags?.includes('entry') !== true && !holdingRoomName(n.name));
  const dwell: DungeonDwell[] = [];
  const site = slug(card.siteName ?? card.dungeonName);
  for (const room of holding) {
    const many = MANY.test(room.name ?? '');
    const count = many ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const name = pickPersonName(rng, taken);
      if (!name) continue;
      dwell.push({
        id: `dwell:${site}:${room.id}:${i}`,
        name,
        kind: 'captive',
        nodeId: room.id,
        status: 'held',
        disposition: 'neutral',
      });
    }
  }
  const home = quiet.find((n) => !(n.tags ?? []).includes('entry'));
  if (home && rng() < 0.7) {
    const name = pickPersonName(rng, taken);
    if (name) {
      dwell.push({
        id: `dwell:${site}:${home.id}:in`,
        name,
        kind: 'inhabitant',
        nodeId: home.id,
        status: 'released',
        disposition: 'friendly',
      });
    }
  }
  const captives = dwell.filter((d) => d.kind === 'captive');
  if (!captives.length) return { ...card, dwell };
  const jailer = rng() < 0.5;
  const requireHeal = rng() < 0.25;
  const keys: RescueKeyDef[] = [];
  const locks = captives.map((c, i) => {
    const keyId = jailer ? `key:${site}:jailer` : `key:${site}:${c.id}`;
    if (!jailer) {
      keys.push({
        id: keyId,
        label: `key for ${c.name}`,
        captiveIds: [c.id],
        consumable: true,
        source: 'found',
        held: false,
        nodeId: c.nodeId,
      });
    }
    const requiredLevel = 2 + Math.floor(rng() * 8);
    const unpickable = !jailer && i === 0 && captives.length > 2 && rng() < 0.15;
    return { captiveId: c.id, requiredLevel, unpickable, keyId };
  });
  if (jailer) {
    keys.push({
      id: `key:${site}:jailer`,
      label: 'jailer key',
      captiveIds: captives.map((c) => c.id),
      consumable: false,
      source: 'jailer',
      held: false,
    });
  }
  const questId = `card-rescue:${site}`;
  return {
    ...card,
    dwell,
    rescue: { requireHeal, locks, keys, questId },
  };
}

function rescueQuest(card: ActiveDungeonState): Quest | null {
  const captives = (card.dwell ?? []).filter((d) => d.kind === 'captive');
  if (!captives.length || !card.rescue) return null;
  const names = captives.map((c) => c.name).join(', ');
  const rooms = captives
    .map((c) => card.nodes.find((n) => n.id === c.nodeId)?.name ?? c.nodeId)
    .filter((n, i, all) => all.indexOf(n) === i)
    .join(', ');
  return {
    id: card.rescue.questId,
    name: `Held in ${card.dungeonName}`,
    description: `${names} are held in ${rooms}.`,
    status: 'active',
    type: 'side',
    revealed: true,
    objectives: [{ id: 'free', description: `Free ${names}`, completed: false }],
    variables: card.rescue.requireHeal ? { requireHeal: true } : undefined,
  };
}

function withQuest(state: GameState, card: ActiveDungeonState): GameState {
  const quest = rescueQuest(card);
  if (!quest) return state;
  const quests = state.quests ?? [];
  if (quests.some((q) => q.id === quest.id)) return state;
  return { ...state, quests: [...quests, quest] };
}

function memoryFor(d: DungeonDwell, where: string): NpcMemory {
  return {
    npcId: d.id,
    npcName: d.name,
    disposition: d.disposition,
    facts: [],
    lastSeenTurn: 0,
    met: true,
    location: where,
    roleHint: d.kind === 'captive' ? 'captive' : 'witness',
  };
}

/** Seat dwellers who are in the current room and, if secret, already revealed. */
export function seatRescueDwellers(state: GameState): GameState {
  const card = state.activeDungeon;
  if (!card?.dwell) return state;
  let next = withQuest(state, card);
  const nodeId = card.currentNodeId;
  const here = (next.currentLocation ?? '').trim();
  const memories = [...(next.npcMemories ?? [])];
  let changed = false;
  for (const d of card.dwell) {
    const show = d.nodeId === nodeId && secretOpen(card, d.nodeId) && d.status !== 'lost';
    const idx = memories.findIndex((m) => m.npcId === d.id);
    if (!show) {
      if (idx >= 0 && memories[idx]!.location === here) {
        memories[idx] = { ...memories[idx]!, location: d.nodeId };
        changed = true;
      }
      continue;
    }
    const row = memoryFor(d, here);
    if (idx < 0) {
      memories.push(row);
      changed = true;
    } else if (memories[idx]!.location !== here) {
      memories[idx] = { ...memories[idx]!, ...row, facts: memories[idx]!.facts, stance: memories[idx]!.stance };
      changed = true;
    }
  }
  return changed ? { ...next, npcMemories: memories } : next;
}

export function dungeonCaptiveStillHeld(state: GameState, npcId: string): boolean {
  const d = state.activeDungeon?.dwell?.find((x) => x.id === npcId);
  return !!d && d.kind === 'captive' && d.status === 'held';
}

export function captiveAttackableByCardMob(state: GameState, npcId: string): boolean {
  const d = state.activeDungeon?.dwell?.find((x) => x.id === npcId);
  if (!d || d.kind !== 'captive') return true;
  return d.status === 'held';
}

function keyItem(key: RescueKeyDef): Item {
  return { id: `rescue-key:${key.id}`, name: key.label, rarity: 'Common', quantity: 1, itemType: 'quest' };
}

function holdsKey(state: GameState, key: RescueKeyDef): boolean {
  if (!key.held) return false;
  return (state.inventory ?? []).some((i) => i.id === `rescue-key:${key.id}` && (i.quantity ?? 0) > 0);
}

function syncJailer(state: GameState, card: ActiveDungeonState): { state: GameState; card: ActiveDungeonState } {
  const rescue = card.rescue;
  if (!rescue) return { state, card };
  const bossDown = card.nodes.some((n) =>
    (n.hidden?.mobs ?? []).some((m) => (m.role === 'miniBoss' || n.id === card.dungeonRules?.bossNode) && m.defeated)
  );
  if (!bossDown) return { state, card };
  let changed = false;
  const keys = rescue.keys.map((k) => {
    if (k.source !== 'jailer' || k.held) return k;
    changed = true;
    return { ...k, held: true };
  });
  if (!changed) return { state, card };
  const nextCard = { ...card, rescue: { ...rescue, keys } };
  let inventory = state.inventory ?? [];
  for (const k of keys) {
    if (k.source === 'jailer' && k.held && !inventory.some((i) => i.id === `rescue-key:${k.id}`)) {
      inventory = [...inventory, keyItem(k)];
    }
  }
  return { state: { ...state, inventory }, card: nextCard };
}

export function findRescueKey(state: GameState, keyId: string): GameState {
  const card = state.activeDungeon;
  const rescue = card?.rescue;
  if (!card || !rescue) return state;
  const keys = rescue.keys.map((k) => (k.id === keyId ? { ...k, held: true } : k));
  const key = keys.find((k) => k.id === keyId);
  if (!key) return state;
  const nextCard = { ...card, rescue: { ...rescue, keys } };
  const inventory = (state.inventory ?? []).some((i) => i.id === `rescue-key:${key.id}`)
    ? state.inventory ?? []
    : [...(state.inventory ?? []), keyItem(key)];
  return patchCard({ ...state, inventory }, nextCard);
}

function addLockpickXp(state: GameState): GameState {
  const skills = [...(state.character?.namedSkills ?? [])];
  const idx = skills.findIndex((s) => (s.id ?? '').toLowerCase().includes('lockpick'));
  const was = idx >= 0 ? skills[idx]! : { id: 'lockpicking', rank: 0, uses: 0, level: lockpickLevel(state), xp: 0 };
  const applied = applySkillXp(was.level ?? 0, was.xp ?? 0, HARD_PICK_SKILL_XP);
  const rec = { ...was, level: applied.level, xp: applied.xp, uses: (was.uses ?? 0) + 1 };
  if (idx >= 0) skills[idx] = rec;
  else skills.push(rec);
  const xp = state.character?.xp;
  return { ...state, character: { ...state.character, namedSkills: skills, xp } };
}

function finishQuest(state: GameState, card: ActiveDungeonState): GameState {
  const id = card.rescue?.questId;
  if (!id) return state;
  const captives = (card.dwell ?? []).filter((d) => d.kind === 'captive');
  const allLost = captives.length > 0 && captives.every((d) => d.status === 'lost');
  const allResolved = captives.length > 0 && captives.every((d) => d.status === 'released' || d.status === 'out' || d.status === 'lost');
  const anyHeld = captives.some((d) => d.status === 'held');
  if (anyHeld) return state;
  const quests = (state.quests ?? []).map((q) => {
    if (q.id !== id) return q;
    if (allLost) return { ...q, status: 'failed' as const, failReason: 'every captive was lost' };
    if (!allResolved) return q;
    return {
      ...q,
      status: 'completed' as const,
      objectives: (q.objectives ?? []).map((o) => ({ ...o, completed: true })),
    };
  });
  let next = { ...state, quests };
  if (!allLost && allResolved) {
    const keys = new Set(next.sandboxAwardKeys ?? []);
    keys.add(`quest-tick:${id}:free`);
    keys.add(`quest-complete:${id}`);
    next = { ...next, sandboxAwardKeys: [...keys] };
  }
  return next;
}

export interface RescueCommit {
  state: GameState;
  released: boolean;
  refused: boolean;
  note: string;
}

function commitOne(
  state: GameState,
  card: ActiveDungeonState,
  captive: DungeonDwell,
  how: 'key' | 'pick' | 'force' | 'heal',
): RescueCommit {
  const rescue = card.rescue;
  if (!rescue || captive.kind !== 'captive' || captive.status !== 'held') {
    return { state, released: false, refused: false, note: '' };
  }
  if (!cardIsClear(card)) {
    return { state, released: false, refused: true, note: 'the card is not clear' };
  }
  const lock = rescue.locks.find((l) => l.captiveId === captive.id);
  const key = rescue.keys.find((k) => k.id === lock?.keyId);
  let lockOpen = !!captive.lockOpen;
  let healed = !!captive.healed;
  let nextState = state;
  let keys = rescue.keys;
  if (how === 'heal') healed = true;
  if (how === 'force' || (how === 'pick' && lock?.unpickable)) {
    return { state, released: false, refused: true, note: 'that lock cannot be forced' };
  }
  if (how === 'pick' && lock && !lockOpen) {
    const skill = lockpickLevel(state);
    const chance = rescuePickChance(skill, lock.requiredLevel);
    const roll = hashUnit(`${state.seed ?? ''}|${captive.id}|pick|${state.turn ?? 0}`);
    if (roll >= chance) return { state, released: false, refused: false, note: 'the pick failed' };
    lockOpen = true;
    if (skill < lock.requiredLevel) nextState = addLockpickXp(state);
  }
  if (how === 'key' && key && !lockOpen) {
    if (!holdsKey(nextState, key) || !key.captiveIds.includes(captive.id)) {
      return { state: nextState, released: false, refused: true, note: 'that key does not fit' };
    }
    lockOpen = true;
    if (key.consumable) {
      keys = keys.map((k) => (k.id === key.id ? { ...k, held: false } : k));
      nextState = {
        ...nextState,
        inventory: (nextState.inventory ?? []).map((i) =>
          i.id === `rescue-key:${key.id}` ? { ...i, quantity: 0 } : i
        ),
      };
    }
  }
  const ready = lockOpen && (!rescue.requireHeal || healed);
  const dwell = (card.dwell ?? []).map((d) =>
    d.id === captive.id ? { ...d, lockOpen, healed, status: ready ? 'released' as const : d.status } : d
  );
  const nextCard = { ...card, dwell, rescue: { ...rescue, keys } };
  let patched = patchCard(nextState, nextCard);
  if (ready) patched = finishQuest(patched, nextCard);
  return { state: patched, released: ready, refused: false, note: ready ? `${captive.name} is released` : '' };
}

function aimedCaptive(state: GameState, input: string): DungeonDwell | undefined {
  const card = state.activeDungeon;
  if (!card?.dwell) return undefined;
  const hay = ` ${input.toLowerCase()} `;
  const here = card.dwell.filter((d) => d.nodeId === card.currentNodeId && d.kind === 'captive');
  const named = here.filter((d) => hay.includes(` ${d.name.toLowerCase()} `) || hay.includes(` ${d.name.toLowerCase().split(' ')[0]} `));
  if (named.length === 1) return named[0];
  if (here.length === 1 && /\b(captive|prisoner|lock|shackle|key|pick|heal|free|harm|attack|hit)\b/i.test(input)) return here[0];
  return named[0];
}

/** Apply a committed player action. A refused release changes nothing that spends a key or pays XP. */
export function commitRescueAction(state: GameState, input: string): RescueCommit {
  const card0 = state.activeDungeon;
  if (!card0?.dwell) return { state, released: false, refused: false, note: '' };
  const synced = syncJailer(state, card0);
  const state1 = patchCard(synced.state, synced.card);
  const card = state1.activeDungeon!;
  const captive = aimedCaptive(state1, input);
  const text = input.toLowerCase();
  if (/\b(search|take|find|pick up)\b/.test(text) && /\bkey\b/.test(text)) {
    const key = card.rescue?.keys.find((k) => k.nodeId === card.currentNodeId && !k.held);
    if (key) return { state: findRescueKey(state1, key.id), released: false, refused: false, note: `found ${key.label}` };
  }
  if (!captive) return { state: state1, released: false, refused: false, note: '' };
  if (/\b(attack|strike|hit|stab|harm|kill)\b/.test(text)) {
    const dwell = card.dwell.map((d) => (d.id === captive.id ? { ...d, status: 'lost' as const } : d));
    const nextCard = { ...card, dwell };
    return { state: finishQuest(patchCard(state1, nextCard), nextCard), released: false, refused: false, note: `${captive.name} is lost` };
  }
  if (/\b(heal|bandage|tend|cure|medicine)\b/.test(text)) return commitOne(state1, card, captive, 'heal');
  if (/\b(force|bash|break|kick|athletics)\b/.test(text) && /\b(lock|door|shackle|chain)\b/.test(text)) {
    return commitOne(state1, card, captive, 'force');
  }
  if (/\b(pick|lockpick|jimmy)\b/.test(text)) return commitOne(state1, card, captive, 'pick');
  if (/\b(key|unlock|free|release|unchain)\b/.test(text)) return commitOne(state1, card, captive, 'key');
  return { state: state1, released: false, refused: false, note: '' };
}

export function markEscortOut(state: GameState, captiveId: string): GameState {
  const card = state.activeDungeon;
  const dwell = card?.dwell?.map((d) => (d.id === captiveId && d.status === 'released' ? { ...d, status: 'out' as const } : d));
  if (!card || !dwell) return state;
  return patchCard(state, { ...card, dwell });
}
