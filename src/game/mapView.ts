import { roomHasVerticalLink, type ActiveDungeonState, type MapNode } from './mapEngine';

/** Map symbols the engine actually tracks. Nothing here is guessed from prose. */
export type MapSymbol = 'here' | 'stairs' | 'person' | 'quest' | 'danger';

export const MAP_SYMBOL_GLYPH: Record<MapSymbol | 'door', string> = {
  here: '▲',
  door: '▭',
  stairs: '≡',
  person: '●',
  quest: '★',
  danger: '!',
};

export const MAP_SYMBOL_LABEL: Record<MapSymbol | 'door', string> = {
  here: 'You are here',
  door: 'Door',
  stairs: 'Stairs',
  person: 'Someone here',
  quest: 'Quest',
  danger: 'Danger',
};

export interface MapSymbolContext {
  currentNodeId: string;
  /** People the ledger places with the player (only ever drawn on the player's room). */
  peopleHereCount?: number;
  /** Main quest pin place name. */
  questPlace?: string;
  /** A live fight in the player's room. */
  liveFight?: boolean;
}

const norm = (s: string | undefined) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Known danger in a room the player has seen: a revealed live trap or a foe that is up or parked wounded. */
export function roomHasKnownDanger(dungeon: ActiveDungeonState, node: MapNode): boolean {
  if (!dungeon.visitedNodeIds.includes(node.id)) return false;
  const h = node.hidden;
  if (!h) return false;
  if ((h.traps ?? []).some((t) => t.revealed && !t.disarmed)) return true;
  return (h.mobs ?? []).some((m) => !m.defeated && (m.spawned || (m.hpRemaining ?? 0) > 0));
}

function namesQuestPlace(node: MapNode, questPlace: string | undefined): boolean {
  const q = norm(questPlace);
  const n = norm(node.name);
  if (!q || !n) return false;
  return n === q || (n.length >= 4 && q.includes(n)) || (q.length >= 4 && n.includes(q));
}

export function roomSymbols(dungeon: ActiveDungeonState, node: MapNode, ctx: MapSymbolContext): MapSymbol[] {
  const out: MapSymbol[] = [];
  const here = node.id === ctx.currentNodeId;
  if (here) out.push('here');
  if (roomHasVerticalLink(dungeon, node)) out.push('stairs');
  if (here && (ctx.peopleHereCount ?? 0) > 0) out.push('person');
  if (namesQuestPlace(node, ctx.questPlace)) out.push('quest');
  if ((here && ctx.liveFight) || roomHasKnownDanger(dungeon, node)) out.push('danger');
  return out;
}

export interface MapViewport {
  scale: number;
  x: number;
  y: number;
}

export const MAP_ZOOM_MIN = 0.3;
export const MAP_ZOOM_MAX = 3;

const clampScale = (s: number) => Math.min(MAP_ZOOM_MAX, Math.max(MAP_ZOOM_MIN, s));

/** Fit content (natural size) inside the frame, centred, never blown past 1.5×. */
export function fitViewport(contentW: number, contentH: number, frameW: number, frameH: number, margin = 16): MapViewport {
  if (contentW <= 0 || contentH <= 0 || frameW <= 0 || frameH <= 0) return { scale: 1, x: 0, y: 0 };
  const scale = clampScale(Math.min((frameW - margin * 2) / contentW, (frameH - margin * 2) / contentH, 1.5));
  return { scale, x: (frameW - contentW * scale) / 2, y: (frameH - contentH * scale) / 2 };
}

/** Zoom by a factor around a frame point, keeping the content under that point still. */
export function zoomViewportAt(v: MapViewport, factor: number, px: number, py: number): MapViewport {
  const scale = clampScale(v.scale * factor);
  const k = scale / v.scale;
  return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
}

export function panViewport(v: MapViewport, dx: number, dy: number): MapViewport {
  return { ...v, x: v.x + dx, y: v.y + dy };
}
