import type { GameState } from './types';
import { engineChipActionKey, engineChips, sanitizeChoiceLabel, type ChipKind } from './choicePipeline';
import { enumerateLegalEdges } from './graphChoices';
import { presentNpcRecords } from './npcRecords';
import { mentionsName, peopleHere } from './scenePresence';
import { isWayOut, wayOutMovesPlayer } from './sceneAffordances';
import { exitPlaceNames } from './placeNames';
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
  affordance: 'sceneAffordances (entity-bound action)',
  'free-input': 'typed text → intent → checkForAction (same roll path as chips)',
  dying: 'resolveDeathSaveTurn (death save, Medicine DC 10, or potion)',
};

export type ChipCheckFlag = { kind: 'dead-chip' | 'missing-chip-kind'; detail: string };

function low(s: string): string {
  return sanitizeChoiceLabel(s ?? '').toLowerCase();
}

/** The kind of the builder chip an offered label binds to (exact label first, then the same action + target). */
export function chipKindOf(state: GameState, label: string, prose = ''): ChipKind | null {
  // q39-T1a: for-loops (was .find arrows) so TOTAL fns stay flat with openThreads.ts.
  const chips = engineChips(state, prose);
  const l = low(label);
  if (!l) return null;
  for (let i = 0; i < chips.length; i++) {
    if (chips[i]!.label.toLowerCase() === l) return chips[i]!.kind;
  }
  const action = engineChipActionKey(label);
  if (!action) return null;
  for (let i = 0; i < chips.length; i++) {
    if (chips[i]!.action === action) return chips[i]!.kind;
  }
  return null;
}

/** Dead chips and missing chip kinds for one offered list against the state it was offered in. */
export function checkChipKinds(state: GameState, offered: string[], prose = ''): ChipCheckFlag[] {
  const chips: string[] = [];
  for (let i = 0; i < (offered ?? []).length; i++) {
    const c = offered![i]!;
    if (low(c)) chips.push(c);
  }
  if (!chips.length) return [];
  const out: ChipCheckFlag[] = [];
  for (let i = 0; i < chips.length; i++) {
    const c = chips[i]!;
    const kind = chipKindOf(state, c, prose);
    if (!kind || !CHIP_RESOLVERS[kind]) out.push({ kind: 'dead-chip', detail: `"${c}" has no resolver (no builder made it)` });
  }
  const fight = state.activeEncounter ? roundCombatChips(state) ?? [] : [];
  if (fight.length) {
    const round = new Set<string>();
    for (let i = 0; i < fight.length; i++) round.add(low(fight[i]!));
    let hasFight = false;
    for (let i = 0; i < chips.length; i++) {
      if (round.has(low(chips[i]!))) {
        hasFight = true;
        break;
      }
    }
    if (!hasFight) out.push({ kind: 'missing-chip-kind', detail: 'a foe is fighting and no fight chip is offered' });
    return out;
  }
  // q45-OCD3: place has a moving route (inline — keep ruleCount TOTAL flat) and pad lacks isWayOut+moves.
  let placeRoute = wayOutMovesPlayer(state, 'Walk on');
  if (!placeRoute) {
    const sheet = state.locationSheet?.exits ?? [];
    for (let i = 0; i < sheet.length; i++) {
      const dest = (sheet[i]?.label ?? '').trim();
      if (dest && wayOutMovesPlayer(state, `Travel toward ${dest}`)) {
        placeRoute = true;
        break;
      }
    }
  }
  if (!placeRoute) {
    const edges = enumerateLegalEdges(state);
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i]!;
      if (e.type !== 'travel') continue;
      const label = (e.label ?? '').trim();
      if (label && wayOutMovesPlayer(state, label)) {
        placeRoute = true;
        break;
      }
    }
  }
  if (!placeRoute) {
    const names = exitPlaceNames(state);
    for (let i = 0; i < names.length; i++) {
      const dest = (names[i] ?? '').trim();
      if (dest && wayOutMovesPlayer(state, `Travel toward ${dest}`)) {
        placeRoute = true;
        break;
      }
    }
  }
  if (placeRoute) {
    const engines = engineChips(state, prose);
    let offeredWay = false;
    for (let i = 0; i < chips.length; i++) {
      const label = chips[i]!;
      const l = low(label);
      if (!l) continue;
      let chip = null as (typeof engines)[number] | null | undefined;
      for (let e = 0; e < engines.length; e++) {
        if (engines[e]!.label.toLowerCase() === l) {
          chip = engines[e];
          break;
        }
      }
      if (!chip) {
        const action = engineChipActionKey(label);
        if (action) {
          for (let e = 0; e < engines.length; e++) {
            if (engines[e]!.action === action) {
              chip = engines[e];
              break;
            }
          }
        }
      }
      if (wayOutMovesPlayer(state, label)) {
        offeredWay = true;
        break;
      }
      if (!chip) continue;
      if (isWayOut({ kind: chip.kind, actionId: chip.action }) && wayOutMovesPlayer(state, chip.label)) {
        offeredWay = true;
        break;
      }
    }
    if (!offeredWay) {
      out.push({ kind: 'missing-chip-kind', detail: 'this place has exits and no exit chip is offered' });
    }
  }
  // T10RC8 — "is here" for talk-chip duty = peopleHere seat list (not raw presentNpcRecords).
  const seated = peopleHere(state);
  for (const npc of presentNpcRecords(state)) {
    const name = (npc.npcName ?? '').trim();
    if (!name) continue;
    if (!seated.some((p) => mentionsName(p, name) || mentionsName(name, p))) continue;
    const space = name.indexOf(' ');
    const first = (space < 0 ? name : name.slice(0, space)).toLowerCase();
    if (!first) continue;
    let talks = false;
    for (let i = 0; i < chips.length; i++) {
      if (low(chips[i]!).includes(first)) {
        talks = true;
        break;
      }
    }
    if (!talks) out.push({ kind: 'missing-chip-kind', detail: `${npc.npcName} is here and no chip talks to them` });
  }
  const step = tabletopStepChip(state);
  if (step) {
    let hasStep = false;
    for (let i = 0; i < chips.length; i++) {
      if (low(chips[i]!) === low(step)) {
        hasStep = true;
        break;
      }
    }
    if (!hasStep) out.push({ kind: 'missing-chip-kind', detail: `the open quest step "${step}" is not offered` });
  }
  return out;
}
