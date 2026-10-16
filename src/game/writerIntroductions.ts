/**
 * P-5a/c — the writer may invent people and things that fit the world. Once a turn is accepted, the role
 * people it introduced ("a sailor coiling rope") join the cast as records at the current place, and the
 * things it introduced ("found a brass key") join the scene's props, so later turns track them like seeded ones.
 * Things stay scene props: in tabletop only SRD gear enters the inventory, through the engine.
 */
import { introducedNamedPeople, introducedRolePeople, introducedThings } from './tokenProse';
import type { GameState, NpcMemory } from './types';
import { isOffSetting, worldOffSettingWords } from './settingVocabulary';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function registerWriterIntroductions(state: GameState, narrative: string): GameState {
  const known = [
    state.character?.name ?? '',
    ...(state.npcMemories ?? []).map((m) => m.npcName),
    ...(state.sceneFacts?.present ?? []),
  ].filter(Boolean);
  const named = introducedNamedPeople(narrative, known);
  const people = introducedRolePeople(narrative);
  const things = introducedThings(narrative);
  if (!people.length && !things.length && !named.length) return state;
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
  for (const name of named) {
    const npcId = `writer:${slug(place)}:${slug(name)}`;
    if (memories.some((m) => m.npcId === npcId)) continue;
    memories.push({ npcId, npcName: name, disposition: 'neutral', facts: [`Introduced by the story at ${place} on turn ${state.turn}.`], lastSeenTurn: state.turn });
  }
  // P-5e: a thing only other settings name, which the gate let through because the story established it,
  // is recorded as crossed over, so it and its origin stay allowed from then on.
  let crossedOver = state.crossedOver;
  if (things.length) {
    const foreign = worldOffSettingWords(state);
    const crossed = things.filter((t) => isOffSetting(foreign, t.split(/\s+/).pop()!));
    const list = [...(crossedOver ?? [])];
    for (const c of crossed) if (!list.some((x) => x.toLowerCase() === c.toLowerCase())) list.push(c);
    if (list.length !== (crossedOver ?? []).length) crossedOver = list;
  }
  let sceneFacts = state.sceneFacts;
  if (sceneFacts && things.length) {
    const props = [...sceneFacts.props];
    for (const t of things) if (!props.some((p) => p.toLowerCase() === t.toLowerCase())) props.push(t);
    sceneFacts = { ...sceneFacts, props };
  }
  return { ...state, npcMemories: memories, sceneFacts, ...(crossedOver ? { crossedOver } : {}) };
}
