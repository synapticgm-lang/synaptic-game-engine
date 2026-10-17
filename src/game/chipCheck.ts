import type { GameState } from './types';
import { engineChipActionKey, engineChips, sanitizeChoiceLabel, type ChipKind } from './choicePipeline';
import { enumerateLegalEdges } from './graphChoices';
import { presentNpcRecords } from './npcRecords';
import { tabletopStepChip } from './tabletopQuestProgress';
import { roundCombatChips } from './tabletop/combatChips';

/**
 * tt-build-chipcheck: every chip kind names the code that resolves it. A chip whose kind is not here (or that no
 * builder made) is dead: picking it would do nothing the engine can stand behind.
 */
export const CHIP_RESOLVERS: Record<ChipKind, string> = {
  compiled: 'useGame turn (intent router)',
  beat: 'arc director beat edges',
  exit: 'graphChoices travel',
  hub: 'hub arrival',
  spine: 'spine engine',
  fallback: 'scene fallback (intent router)',
  dungeon: 'dungeon card',
  opening: 'opening offer turn',
  decision: 'storyRpgProgress',
  'quest-step': 'applyTabletopQuestTurn',
  system: 'system prompt pad',
  journey: 'travelJourney',
  shop: 'resolveShopChip (buyItem/sellItem)',
  'inspiration-reroll': 'resolveInspirationReroll (CheckResultRecord die)',
};

export type ChipCheckFlag = { kind: 'dead-chip' | 'missing-chip-kind'; detail: string };

const low = (s: string) => sanitizeChoiceLabel(s ?? '').toLowerCase();

/** The kind of the builder chip an offered label binds to (exact label first, then the same action + target). */
export function chipKindOf(state: GameState, label: string, prose = ''): ChipKind | null {
  const chips = engineChips(state, prose);
  const l = low(label);
  if (!l) return null;
  const exact = chips.find((c) => c.label.toLowerCase() === l);
  if (exact) return exact.kind;
  const action = engineChipActionKey(label);
  return (action && chips.find((c) => c.action === action)?.kind) || null;
}

function offersKind(state: GameState, offered: string[], prose: string, ...kinds: ChipKind[]): boolean {
  const pool = engineChips(state, prose).filter((c) => kinds.includes(c.kind));
  const labels = new Set(pool.map((c) => c.label.toLowerCase()));
  const actions = new Set(pool.map((c) => c.action));
  return offered.some((o) => labels.has(low(o)) || actions.has(engineChipActionKey(o)));
}

/** Dead chips and missing chip kinds for one offered list against the state it was offered in. */
export function checkChipKinds(state: GameState, offered: string[], prose = ''): ChipCheckFlag[] {
  const chips = (offered ?? []).filter((c) => low(c));
  if (!chips.length) return [];
  const out: ChipCheckFlag[] = [];
  for (const c of chips) {
    const kind = chipKindOf(state, c, prose);
    if (!kind || !CHIP_RESOLVERS[kind]) out.push({ kind: 'dead-chip', detail: `"${c}" has no resolver (no builder made it)` });
  }
  const fight = state.activeEncounter ? roundCombatChips(state) ?? [] : [];
  if (fight.length) {
    const round = new Set(fight.map(low));
    if (!chips.some((c) => round.has(low(c)))) out.push({ kind: 'missing-chip-kind', detail: 'a foe is fighting and no fight chip is offered' });
    return out;
  }
  if (enumerateLegalEdges(state).length && !offersKind(state, chips, prose, 'exit', 'journey', 'hub')) {
    out.push({ kind: 'missing-chip-kind', detail: 'this place has exits and no exit chip is offered' });
  }
  for (const npc of presentNpcRecords(state)) {
    const name = (npc.npcName ?? '').trim();
    const space = name.indexOf(' ');
    const first = (space < 0 ? name : name.slice(0, space)).toLowerCase();
    if (first && !chips.some((c) => low(c).includes(first))) {
      out.push({ kind: 'missing-chip-kind', detail: `${npc.npcName} is here and no chip talks to them` });
    }
  }
  const step = tabletopStepChip(state);
  if (step && !chips.some((c) => low(c) === low(step))) {
    out.push({ kind: 'missing-chip-kind', detail: `the open quest step "${step}" is not offered` });
  }
  return out;
}
