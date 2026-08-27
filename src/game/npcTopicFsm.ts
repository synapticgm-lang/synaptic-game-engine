/**
 * NPC topic FSM — track exhausted dialogue topics; force stage advance when drained.
 */

import type { GameState } from './types';
import { canonicalizeIntent } from './semanticLoopDetector';

export type NpcTopicFsmState = Record<string, string[]>;

function npcKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
}

function extractNpcFromInput(input: string, state: GameState): string | null {
  const m = input.match(/(?:talk to|speak with|ask|greet)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (m) return m[1].trim();
  const present = state.sceneFacts?.present ?? [];
  if (present.length === 1) return present[0];
  return null;
}

function topicKey(input: string): string {
  const intent = canonicalizeIntent(input, 0);
  return `${intent.action}:${intent.target || 'general'}`.slice(0, 48);
}

export function isTopicExhausted(
  npc: string,
  topic: string,
  fsm: NpcTopicFsmState | undefined
): boolean {
  const topics = fsm?.[npcKey(npc)] ?? [];
  return topics.includes(topic);
}

export function recordNpcTopic(
  state: GameState,
  input: string
): { state: GameState; exhausted: boolean; npc?: string; topic?: string } {
  const npc = extractNpcFromInput(input, state);
  if (!npc) return { state, exhausted: false };

  const topic = topicKey(input);
  const key = npcKey(npc);
  const prev = state.arcDirector?.npcTopics ?? {};
  const used = prev[key] ?? [];

  if (used.includes(topic)) {
    return { state, exhausted: true, npc, topic };
  }

  const nextTopics = { ...prev, [key]: [...used, topic].slice(-12) };
  return {
    state: {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        npcTopics: nextTopics,
      },
    },
    exhausted: false,
    npc,
    topic,
  };
}

export function formatNpcTopicMandate(
  npc: string,
  topic: string,
  exhausted: boolean
): string | null {
  if (!exhausted) return null;
  return `NPC TOPIC EXHAUSTED (${npc} / ${topic}): Do not repeat this dialogue basin — advance quest stage, introduce new fact, or end the conversation with consequence.`;
}

/** After 3+ topics with same NPC, mandate stage advance. */
export function shouldForceNpcStageAdvance(state: GameState, npc: string): boolean {
  const used = state.arcDirector?.npcTopics?.[npcKey(npc)] ?? [];
  return used.length >= 3;
}
