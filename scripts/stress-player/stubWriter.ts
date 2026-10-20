/**
 * q76b-STRESS — deterministic stub writer (no model). Voices only peopleHere.
 * Lives under scripts/ so ruleCount TOTAL (src/game) does not grow. No third-party library.
 */
import type { GameState } from '../../src/game/types';
import { peopleHere } from '../../src/game/chipLegality';

export type StressStubBeat = { prose: string; speakers: string[] };

/** Plain prose from location / props / engineResult / input. Speakers ⊆ present. */
export function buildStressStubProse(state: GameState, playerInput: string): StressStubBeat {
  const here = (state.currentLocation ?? 'here').trim() || 'here';
  const present = peopleHere(state);
  const props = state.sceneFacts?.props ?? [];
  let propBit = 'the room';
  for (let i = 0; i < props.length; i++) {
    const p = String(props[i]).trim();
    if (p) { propBit = p; break; }
  }
  const factBits: string[] = [];
  const factParts = String(state.completedEvent?.engineResult ?? '').split(' ');
  for (let i = 0; i < factParts.length; i++) if (factParts[i]) factBits.push(factParts[i]!);
  const fact = factBits.join(' ').trim().slice(0, 220);
  const actBits: string[] = [];
  const actParts = String(playerInput ?? '').split(' ');
  for (let i = 0; i < actParts.length; i++) if (actParts[i]) actBits.push(actParts[i]!);
  let act = actBits.join(' ').trim() || 'Look around';
  if (act.length >= 4 && act.slice(0, 4).toLowerCase() === 'you ') act = act.slice(4);
  const speakers: string[] = [];
  const lines = [`At ${here}, you ${act}.`, fact || `The scene held at ${here}; ${propBit} stayed in place.`];
  if (present.length) {
    speakers.push(present[0]!);
    lines.push(`${present[0]!} answered from where they stood.`);
  }
  return { prose: lines.join(' '), speakers };
}
