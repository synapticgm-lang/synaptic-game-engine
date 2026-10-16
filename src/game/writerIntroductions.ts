/**
 * P-5a/c — the writer may invent people and things that fit the world. Once a turn is accepted, the role
 * people it introduced ("a sailor coiling rope") join the cast as records at the current place, and the
 * things it introduced ("found a brass key") join the scene's props, so later turns track them like seeded ones.
 * Things stay scene props: in tabletop only SRD gear enters the inventory, through the engine.
 */
import { introducedRolePeople, introducedThings } from './tokenProse';
import type { GameState, NpcMemory } from './types';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function registerWriterIntroductions(state: GameState, narrative: string): GameState {
  const people = introducedRolePeople(narrative);
  const things = introducedThings(narrative);
  if (!people.length && !things.length) return state;
  const place = state.currentLocation ?? 'here';
  const memories = [...(state.npcMemories ?? [])];
  for (const role of people) {
    const npcId = `writer:${slug(place)}:${slug(role)}`;
    const at = memories.findIndex((m) => m.npcId === npcId);
    if (at >= 0) {
      memories[at] = { ...memories[at]!, lastSeenTurn: state.turn };
      continue;
    }
    const rec: NpcMemory = {
      npcId,
      npcName: `the ${role}`,
      disposition: 'neutral',
      facts: [`Introduced by the story at ${place} on turn ${state.turn}.`],
      lastSeenTurn: state.turn,
    };
    memories.push(rec);
  }
  let sceneFacts = state.sceneFacts;
  if (sceneFacts && things.length) {
    const props = [...sceneFacts.props];
    for (const t of things) if (!props.some((p) => p.toLowerCase() === t.toLowerCase())) props.push(t);
    sceneFacts = { ...sceneFacts, props };
  }
  return { ...state, npcMemories: memories, sceneFacts };
}
