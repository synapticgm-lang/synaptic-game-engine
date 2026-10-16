/**
 * tt-build-questtargets — a quest's targets are put in the world when the quest is made.
 * - Each step's item or person is placed where the step is taken. A step inside a place ("inside", "the great
 *   hall") goes into a room of that place's dungeon card, built then, or the card already stored there, so
 *   quests that share a dungeon share its rooms.
 * - A step ticks only when the engine records the player finding or meeting its target at its spot: the step's
 *   own action, a search there, naming it, or talking to the person. A chip or an arrival alone ticks nothing.
 * - The dungeon card lives on its place record: leaving parks it there (rooms cleared, loot taken, targets
 *   found), going back reopens it, and a card is never auto-closed.
 * - q31-L1 / RC-2: the action class comes from `parsePlayerIntent` (and the step's verb/object chip), not
 *   local verb word lists. K, G-m57 and QV reuse `actionMatchesObjective`.
 */
import type { GameState, Quest, QuestObjective, QuestTarget } from './types';
import { ensureDungeonCard, isDungeonCard } from './dungeonCard';
import { createHashRng } from './seededRng';
import { stepChip } from './choiceRanking';
import { peopleHere } from './chipLegality';
import { isGiverName } from './questGiver';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { parsePlayerIntent, type IntentKind } from './intentParser';

const chipKey = (s: string) => (s ?? '').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase();
const bare = (s: string) => chipKey(s).replace(/^(?:the|a|an)\s+/, '');
const words = (s: string) => ` ${chipKey(s).replace(/[^a-z0-9' ]+/g, ' ')} `;

/** Intent classes that find or inspect a placed thing (search / look / examine / investigate). */
const FIND_KINDS: ReadonlySet<IntentKind> = new Set(['search', 'observe']);
/** Intent classes that meet a person. */
const MEET_KINDS: ReadonlySet<IntentKind> = new Set(['talk']);

/** The player stands at a known place (a hub by any of its names, or a room inside it). */
export function atPlace(state: GameState, place: string): boolean {
  const hubs = hubsForBibleId(state.campaignBibleId);
  const name = (s: string) => bare(matchHub(hubs, s)?.name ?? s);
  const here = name(state.currentLocation ?? '');
  const p = name(place);
  return !!here && !!p && (here === p || here.includes(p));
}

/**
 * Place a step's target. One inside a place goes into a room of its dungeon card: the room its anchor names
 * ("hall"), else a seeded room past the entry, so walking in never finds it.
 */
export function placeQuestTarget(
  state: GameState,
  quest: Quest,
  step: QuestObjective,
  target: QuestTarget
): { state: GameState; target: QuestTarget } {
  if (!step.room || !target.place) return { state, target };
  const { state: next, card } = ensureDungeonCard(state, target.place);
  const rooms = card.nodes.filter((n) => n.id !== card.currentNodeId && !(n.tags ?? []).some((t) => t === 'entry' || t === 'stair'));
  const named = step.room === 'inside' ? [] : rooms.filter((n) => words(n.name ?? '').includes(` ${step.room!.toLowerCase()} `));
  const pool = named.length ? named : rooms;
  const rng = createHashRng(`${state.seed ?? state.saveId ?? 'quest'}:${quest.id}:${step.id}`, 'quest-target');
  const room = pool[Math.floor(rng() * pool.length)];
  return { state: next, target: room ? { ...target, place: card.siteName ?? card.dungeonName, nodeId: room.id } : target };
}

/**
 * Where the player stands against a target: at it (true), outside the door of the place whose room holds it
 * ('door', the step's chip is the way in), or away (false). A person must be here to be met.
 */
export function targetSpot(state: GameState, step: QuestObjective): boolean | 'door' {
  const t = step.target;
  if (!t || t.foundTurn != null) return false;
  if (t.nodeId || step.room) {
    const d = state.activeDungeon;
    if (isDungeonCard(d) && (d.siteName ?? d.dungeonName) === t.place) return d.currentNodeId === t.nodeId;
    return !!t.place && atPlace(state, t.place) && 'door';
  }
  if (t.place && !atPlace(state, t.place)) return false;
  const here = peopleHere(state);
  const withPeople = t.kind === 'person' ? [t.name] : step.people ?? [];
  return !withPeople.length || withPeople.some((p) => here.some((n) => isGiverName(n, p)));
}

/**
 * Shared objective matcher (K, G-m57, QV): the player's action finds or meets this step's target.
 * Drive from the structured verb/object chip, `parsePlayerIntent` class, and named object — not verb word lists.
 * Callers still require `targetSpot` (the engine place/person record) before a tick.
 */
export function actionMatchesObjective(step: QuestObjective, action: string): boolean {
  const t = step.target;
  if (!t || !(action ?? '').trim()) return false;
  const intent = parsePlayerIntent(action);
  const said = words(action);
  const objectBare = bare(step.object ?? t.name);
  const named =
    (!!objectBare && said.includes(words(objectBare)))
    || intent.targets.some((x) => {
      const b = bare(x);
      return !!b && (b === objectBare || said.includes(words(b)) || words(objectBare).includes(words(b)));
    })
    || (t.kind === 'person'
      && words(t.name)
        .trim()
        .split(' ')
        .some((w) => w.length >= 4 && said.includes(` ${w} `)));
  if (t.kind === 'person') return named && (MEET_KINDS.has(intent.kind) || !!t.place);
  // Item / find: naming the object, or a find/inspect class action at the spot (spot is the caller's gate).
  return named || FIND_KINDS.has(intent.kind);
}

/** The engine's find / meet this turn: every active quest's open step whose target the player takes at its spot. */
export function findQuestTargets(
  state: GameState,
  playerInput: string
): { state: GameState; receipts: string[]; facts: string[] } {
  const action = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const receipts: string[] = [];
  const facts: string[] = [];
  if (!action) return { state, receipts, facts };
  const quests = (state.quests ?? []).map((q) => {
    if (q.status !== 'active') return q;
    let hit = false;
    const objectives = (q.objectives ?? []).map((o) => {
      if (o.completed || targetSpot(state, o) !== true || !actionMatchesObjective(o, action)) return o;
      hit = true;
      receipts.push(`Quest stage: ${q.name} — ${stepChip(o) ?? o.description}`);
      const d = o.description.trim();
      facts.push(`You ${d.charAt(0).toLowerCase()}${d.slice(1)}`);
      return { ...o, completed: true, target: { ...o.target!, foundTurn: state.turn ?? 0 } };
    });
    if (!hit) return q;
    const done = objectives.every((o) => o.completed || o.optional);
    return { ...q, objectives, ...(done ? { status: 'completed' as const } : {}) };
  });
  return receipts.length ? { state: { ...state, quests }, receipts, facts } : { state, receipts, facts };
}
