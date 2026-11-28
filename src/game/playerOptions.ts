/**
 * The pad a player actually sees: legal, named, and capped by finalOptions (exactly 4/4/3).
 */
import type { GameState } from './types';
import { isFreeInputChip } from './sceneAffordances';
import { chipProblem } from './chipLegality';
import { chipKindOf } from './chipCheck';
import { isCheckSystemChip } from './systemNotice';
import { isJourneyOnwardLine } from './travelJourney';
import { dungeonCardChoices, isDungeonCard } from './dungeonCard';
import { recruitPad } from './rules/companions';
import { hubsForBibleId } from './outdoorHubs';
import { roundCombatChips } from './tabletop/combatChips';
import { canSkipAheadTo } from './fastForward';
import { originPad } from './rules/rpgOrigin';
import { tabletopCreationPending } from './tabletop/creationFlow';
import { finalSceneOptions } from './finalOptions';
import { isStorytellerRetryPage } from './openingWriterNotes';

function displayChip(state: GameState, label: string): string | null {
  const m = label.match(/^(Travel toward|Skip ahead to|Head toward|Go to)\s+(.+)$/i);
  if (!m) return label;
  const dest = m[2]!.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(dest)) return label;
  const hub = hubsForBibleId(state.campaignBibleId).find((h) => h.id === dest);
  if (hub?.name) return `${m[1]} ${hub.name}`;
  const place = (state.places ?? []).find((p) => p.id === dest);
  if (place?.name && !/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(place.name)) return `${m[1]} ${place.name}`;
  return null;
}

/** Drop raw ids, unreachable travel, and thread chips that only restate. Cap via finalOptions. */
export function shapePlayerOptions(state: GameState, raw: string[]): string[] {
  // A tabletop round or death save has a closed legal set (SRD). Do not rewrite it.
  const round = state.engineMode === 'dnd' ? roundCombatChips(state) : null;
  if (round && round.length) return [...round];

  const dungeon = isDungeonCard(state.activeDungeon) && !state.activeEncounter
    ? dungeonCardChoices(state)
    : [];
  const recruit = recruitPad(state) ?? [];
  const skipDest = (state.journey?.to ?? '').trim();
  const skip = state.journey && state.journey.legsTotal > 1 && !state.activeEncounter && canSkipAheadTo(state, skipDest)
    ? [`Skip ahead to ${skipDest}`]
    : [];
  const pool = [...dungeon, ...recruit, ...skip, ...raw];
  const engine: string[] = [];
  const seen = new Set<string>();
  for (const rawLabel of pool) {
    let label = (rawLabel ?? '').replace(/\s+/g, ' ').trim();
    if (!label || isFreeInputChip(label)) continue;
    const shown = displayChip(state, label);
    if (!shown || /place_[a-z0-9-]+/i.test(shown) || /\b[a-z]+-hub-[a-z0-9-]+\b/i.test(shown)) continue;
    label = shown;
    const low = label.toLowerCase();
    if (seen.has(low)) continue;
    if (/^fight the writhing roots$/i.test(label)) {
      const foe = state.activeEncounter?.name ?? state.sceneFacts?.pendingEncounter?.name ?? '';
      if (!/root/i.test(foe)) continue;
    }
    // "Follow up: <thread>" resolves as a persuasion restatement and does not move the step.
    if (/^follow up:/i.test(label)) continue;
    if (/^skip ahead to\s+/i.test(label) && !canSkipAheadTo(state, label.replace(/^skip ahead to\s+/i, '').replace(/\.+$/, ''))) continue;
    const problem = chipProblem(state, label);
    if (problem && (problem.kind === 'impossible-chip' || problem.kind === 'ghost-chip')) continue;
    if (
      !chipKindOf(state, label)
      && !isJourneyOnwardLine(label)
      && !isCheckSystemChip(label)
      && !/^skip ahead to\b/i.test(label)
      && !/^ask .+ to join you$/i.test(label)
      && !/^free\b/i.test(label)
      && !/^next unexplored room$/i.test(label)
      && !/^open the\b/i.test(label)
      && !/^head back to the exit$/i.test(label)
    ) {
      continue;
    }
    seen.add(low);
    engine.push(label);
  }
  // Count and setup exclusion live in finalOptions (exactly 4/4/3). Free-input is the text box, not a chip.
  return finalSceneOptions(state, engine);
}

/**
 * Origin, tabletop inn-book (session-zero), and authored PYOA pads are owned by their
 * own flows and must not be rewritten here.
 */
export function isLivePadExempt(state: GameState): boolean {
  if (state.engineMode === 'pyoa') return true;
  if (originPad(state)?.length) return true;
  if (tabletopCreationPending(state)) return true;
  // Miss page owns its pad — do not reshape / refill beside Try again.
  if (isStorytellerRetryPage(state)) return true;
  return false;
}

export function shapeLiveTurnPad(state: GameState, raw: string[]): string[] {
  if (isLivePadExempt(state)) return raw;
  return shapePlayerOptions(state, raw);
}

/** After commitOfferedTurn, keep the stored pad (choices, chips, log) on the shaped list. */
export function applyShapedLivePad(state: GameState, gmEntryId?: string): GameState {
  const raw = state.choices ?? state.offeredPad?.choices ?? [];
  const choices = shapeLiveTurnPad(state, raw);
  if (choices.length === raw.length && choices.every((c, i) => c === raw[i])) return state;
  const byLow = new Map((state.offeredPad?.chips ?? []).map((c) => [c.label.trim().toLowerCase(), c]));
  const chips = choices.map((label) => {
    const prev = byLow.get(label.trim().toLowerCase());
    return prev ?? { label, actionId: 'label:' + label.trim().toLowerCase(), kind: 'compiled' as const };
  });
  const log = [...(state.log ?? [])];
  const byId = gmEntryId ? log.findIndex((e) => e?.role === 'gm' && e.id === gmEntryId) : -1;
  let at = byId;
  for (let i = log.length - 1; at < 0 && i >= 0; i--) if (log[i]?.role === 'gm') at = i;
  if (at >= 0) log[at] = { ...log[at]!, offeredChoices: choices, offeredChips: chips };
  return {
    ...state,
    log,
    choices,
    offeredPad: { turn: state.offeredPad?.turn ?? state.turn ?? 0, choices, chips },
  };
}

