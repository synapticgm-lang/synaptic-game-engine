/**
 * Shared rules engine — a story RPG origin. The origins are the SRD 5.2.1 backgrounds in tabletop/characterBuild
 * (one list for every mode); a tabletop sheet keeps its own `srd.backgroundId`. The story RPG presenter offers the
 * choice once the opening is done, names it in plain words (no numbers), and ties it to the main quest as the hook.
 */
import type { GameState, TabletopBackgroundId } from '../types';
import { BACKGROUNDS, backgroundDef, seedNumber } from '../tabletop/characterBuild';
import { mulberry32 } from '../fatePick';
import { mainSpineQuest } from '../questPlay';

export const ORIGIN_QUICK_START_CHIP = 'Quick start';

/** How the story RPG says each background: the past, and why the main quest found the character. */
const ORIGIN_VIEW: Record<TabletopBackgroundId, { past: string; hook: (quest: string) => string }> = {
  acolyte: { past: 'You served in a temple', hook: (q) => `${q} reached you through the temple you served.` },
  criminal: { past: 'You worked on the wrong side of the law', hook: (q) => `${q} came to you because of the work you used to do.` },
  sage: { past: 'You spent years among books and records', hook: (q) => `${q} came to you because you know how to find what is written down.` },
  soldier: { past: 'You served under a banner', hook: (q) => `${q} came to you because you have held a line before.` },
};

export function originChip(id: TabletopBackgroundId): string {
  return `Origin: ${backgroundDef(id).name}`;
}

export function isOriginOpen(state: GameState): boolean {
  return state.engineMode === 'rpg' && !!state.openingEstablishment?.complete && !state.character?.origin && state.playPhase !== 'ended';
}

/** The origin row's chips: every SRD background and Quick start. Hidden in a fight. */
export function originPad(state: GameState): string[] | null {
  if (!isOriginOpen(state) || state.activeEncounter || state.roundCombat) return null;
  return [...BACKGROUNDS.map((b) => originChip(b.id)), ORIGIN_QUICK_START_CHIP];
}

/** Quick start: a background picked by seed (the same save always gets the same one). */
export function quickStartOrigin(state: Pick<GameState, 'seed' | 'saveId'>): TabletopBackgroundId {
  const rng = mulberry32(seedNumber(`rpg-origin:${state.seed ?? state.saveId ?? '0'}`));
  return BACKGROUNDS[Math.floor(rng() * BACKGROUNDS.length)]!.id;
}

const key = (s: string) => s.replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase();

/** The origin this line takes while the offer is open (a chip or Quick start), or null. */
export function originFromInput(state: GameState, input: string): TabletopBackgroundId | null {
  if (!isOriginOpen(state)) return null;
  const t = key(input ?? '');
  if (t === key(ORIGIN_QUICK_START_CHIP)) return quickStartOrigin(state);
  return BACKGROUNDS.find((b) => key(originChip(b.id)) === t)?.id ?? null;
}

/** The origin line the recap and the quest log show. */
export function originLine(state: GameState): string | null {
  const id = state.character?.origin;
  return id ? `${ORIGIN_VIEW[id].past}.` : null;
}

export interface OriginSettle {
  state: GameState;
  receipts: string[];
  /** The past and the hook, for the journal. */
  text?: string;
}

/** Take the origin this line picks; the hook names the main quest when there is one. Other modes: nothing. */
export function settleOrigin(state: GameState, input: string): OriginSettle {
  const id = originFromInput(state, input);
  if (!id) return { state, receipts: [] };
  const view = ORIGIN_VIEW[id];
  const quest = mainSpineQuest(state)?.name;
  const text = `${view.past}.${quest ? ` ${view.hook(quest)}` : ''}`;
  return {
    state: { ...state, character: { ...state.character, origin: id } },
    receipts: [`Origin: ${backgroundDef(id).name} — ${text}`],
    text,
  };
}
