import type { GameState } from './types';
import { armedTrapOnNode } from './ledgerTrap';
import { parkInventoryOnNode } from './looseItems';

const REMOTE_VERBS = /\b(throw|toss|fling|hurl|lob|pitch|chuck)\b/i;
const AMBIENT_PROJECTILES = /\b(rock|stone|coin|pebble|brick|bottle|shard|clod)\b/i;

export type TokenDResult =
  | { kind: 'none' }
  | { kind: 'ambient'; projectile: string; trapId: string }
  | { kind: 'inventory'; itemName: string; itemId: string; trapId: string };

/** Remote verb + projectile + armed trap — not room-wide throw spam. */
export function classifyRemoteThrow(state: GameState, actionText: string): TokenDResult {
  const trap = armedTrapOnNode(state);
  if (!trap) return { kind: 'none' };
  const t = actionText.trim();
  if (!REMOTE_VERBS.test(t)) return { kind: 'none' };

  const ambient = t.match(AMBIENT_PROJECTILES);
  if (ambient) {
    return { kind: 'ambient', projectile: ambient[1]!.toLowerCase(), trapId: trap.id };
  }

  for (const item of state.inventory ?? []) {
    const name = item.name.trim();
    if (name.length < 2) continue;
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
    if (re.test(t)) {
      return { kind: 'inventory', itemName: name, itemId: item.id, trapId: trap.id };
    }
  }
  return { kind: 'none' };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Spend armed trap on ambient bypass — 0 HP, hazard gone. */
export function resolveAmbientTrapBypass(state: GameState, trapId: string): GameState {
  const dungeon = state.activeDungeon;
  if (!dungeon) return state;
  const nodeId = dungeon.currentNodeId;
  const nodes = dungeon.nodes.map((n) => {
    if (n.id !== nodeId || !n.hidden) return n;
    return {
      ...n,
      hidden: {
        ...n.hidden,
        traps: n.hidden.traps.map((t) =>
          t.id === trapId ? { ...t, disarmed: true, revealed: true } : t
        ),
      },
    };
  });
  return { ...state, activeDungeon: { ...dungeon, nodes } };
}

/** Inventory projectile lands on floor; trap spent without HP if armed. */
export function resolveInventoryTrapThrow(
  state: GameState,
  token: Extract<TokenDResult, { kind: 'inventory' }>
): GameState {
  let next = parkInventoryOnNode(state, token.itemId, token.itemName);
  next = resolveAmbientTrapBypass(next, token.trapId);
  return next;
}
