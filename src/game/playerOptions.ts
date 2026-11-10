/**
 * The pad a player actually sees: legal, named, and capped.
 * Tabletop declares 3 actions. LitRPG and story RPG declare 4. Free-input chips sit beside those.
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

function declaredCap(state: GameState): number {
  return state.engineMode === 'dnd' ? 3 : 4;
}

/** Drop raw ids, unreachable travel, and thread chips that only restate. Keep the cap. */
export function shapePlayerOptions(state: GameState, raw: string[]): string[] {
  const free: string[] = [];
  const seenFree = new Set<string>();
  for (const rawLabel of raw) {
    const label = (rawLabel ?? '').replace(/\s+/g, ' ').trim();
    if (!label || !isFreeInputChip(label)) continue;
    const low = label.toLowerCase();
    if (seenFree.has(low) || free.length >= 2) continue;
    seenFree.add(low);
    free.push(label);
  }
  // A tabletop round or death save has a closed legal set (SRD). Do not pad it with Look/talk.
  const round = state.engineMode === 'dnd' ? roundCombatChips(state) : null;
  if (round && round.length) return [...round, ...free];

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
    if (!chipKindOf(state, label) && !isJourneyOnwardLine(label) && !isCheckSystemChip(label) && !/^skip ahead to\b/i.test(label) && !/^ask .+ to join you$/i.test(label) && !/^free\b/i.test(label) && !/^next unexplored room$/i.test(label) && !/^open the\b/i.test(label) && !/^head back to the exit$/i.test(label)) {
      continue;
    }
    seen.add(low);
    engine.push(label);
    if (engine.length >= declaredCap(state)) break;
  }
  const fillers = ['Look around', 'Wait and listen', 'Search the area'];
  for (const filler of fillers) {
    if (engine.length >= declaredCap(state)) break;
    if (seen.has(filler.toLowerCase())) continue;
    if (chipProblem(state, filler)) continue;
    if (!chipKindOf(state, filler)) continue;
    seen.add(filler.toLowerCase());
    engine.push(filler);
  }
  return [...engine, ...free];
}
