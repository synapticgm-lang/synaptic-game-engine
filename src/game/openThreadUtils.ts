/**
 * Shared open-thread helpers (no imports of director / openThreads).
 * Keeps director ↔ openThreads free of init cycles.
 */

import type { GameState, NpcMemory } from './types';
import { mentionsName, peopleHere } from './chipLegality';

/**
 * Bible hooks are GM notes shaped `Label: essay` (Secret / Moral anchor / Obstacle…).
 * Structural colon-label — not a deny-list of words. Never a player chip topic.
 */
export function isGmFacingNote(text: string): boolean {
  return /^[A-Za-z][A-Za-z0-9 /&'-]{0,40}:\s+\S/.test((text ?? '').trim());
}

/**
 * Spoken motive line → short chip topic (action phrase, never a quoted speech fragment).
 */
export function chipWantFromMotiveLine(line: string): string {
  const t = (line ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const m = t.match(/^I (?:only )?(?:want|need)\s+(.+)$/i);
  let body = (m?.[1] ?? t).trim();
  body = body.replace(/^["'“‘]|["'”’]$/g, '').trim();
  const cut = body.search(/[,.]/);
  if (cut > 8) body = body.slice(0, cut).trim();
  return body.slice(0, 80);
}

function isSheetPlaceKey(text: string): boolean {
  const t = (text ?? '').trim().toLowerCase();
  return t === 'inn' || t === 'town' || t === 'road' || t === 'camp' || t === 'cell' || t === 'dungeon';
}

/** Want used on Follow-up / Ask-about chips: player-facing topic only. */
export function npcChipWant(m: NpcMemory): string {
  const target = (m.goal?.target ?? '').trim();
  if (target && !isGmFacingNote(target) && !isSheetPlaceKey(target)) {
    return chipWantFromMotiveLine(target) || target;
  }
  const motive = chipWantFromMotiveLine(m.motiveLines?.[0] ?? '');
  if (motive && !isSheetPlaceKey(motive)) return motive;
  const need = (m.need ?? '').trim();
  if (need && !isGmFacingNote(need) && !isSheetPlaceKey(need)) {
    return chipWantFromMotiveLine(need) || need;
  }
  return '';
}

/** Whether the NPC for an agenda / npc-goal thread is in the current scene. */
export function npcGoalPersonHere(state: GameState, npcId: string, npcName?: string): boolean {
  const name = (npcName ?? (npcId.startsWith('npc:') ? npcId.slice(4) : npcId)).trim();
  if (!name && !npcId) return false;
  const here = peopleHere(state);
  for (let i = 0; i < here.length; i++) {
    const h = here[i]!;
    if (name && (mentionsName(h, name) || mentionsName(name, h))) return true;
    const bare = npcId.startsWith('npc:') ? npcId.slice(4) : npcId;
    if (bare && (mentionsName(h, bare) || mentionsName(bare, h))) return true;
  }
  return false;
}
