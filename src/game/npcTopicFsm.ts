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
  const m = input.match(/(?:talk to|speak with|ask|greet|listen to|press)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (m) return m[1].trim();
  const present = state.sceneFacts?.present ?? [];
  // 29c — Listen / Press / Wait dialogue pads bind to the sole present NPC
  if (present.length === 1) return present[0];
  if (present.length > 0 && /\b(listen|press|wait|ask|talk)\b/i.test(input)) {
    return present[0];
  }
  return null;
}

function topicKey(input: string): string {
  const intent = canonicalizeIntent(input, 0);
  const lower = (input || '').toLowerCase();
  // 29c — collapse Listen/Press/Wait dialogue purgatory into one basin
  if (/\b(listen|press for|wait and watch|wait)\b/.test(lower)) {
    return `dialogue:${intent.target || 'general'}`.slice(0, 48);
  }
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

/** After 2+ dialogue-basin topics with same NPC, mandate stage advance (29c tighter). */
export function shouldForceNpcStageAdvance(state: GameState, npc: string): boolean {
  const used = state.arcDirector?.npcTopics?.[npcKey(npc)] ?? [];
  return used.length >= 2;
}

/** B022–B023 — full topic exhaustion → quest stage advance or close branch. */
export function advanceNpcTopicExhaustion(
  state: GameState,
  npc: string
): { state: GameState; mandate?: string } {
  const key = npcKey(npc);
  const used = state.arcDirector?.npcTopics?.[key] ?? [];
  if (used.length < 2) return { state };

  let next = state;
  let mandate: string | undefined;

  const quests = next.quests ?? [];
  const activeMain = quests.find(
    (q) => q.status === 'active' && q.type === 'main' && (q.objectives ?? []).some((o) => !o.completed)
  );
  if (activeMain?.objectives?.length) {
    const idx = activeMain.objectives.findIndex((o) => !o.completed);
    if (idx >= 0 && used.length >= 3) {
      const objectives = [...activeMain.objectives];
      objectives[idx] = { ...objectives[idx], completed: true };
      next = {
        ...next,
        quests: quests.map((q) =>
          q.id === activeMain.id ? { ...q, objectives, status: 'active' } : q
        ),
      };
      mandate = `NPC TOPIC SUITE (${npc}): Dialogue basin exhausted — quest stage advanced locally.`;
    }
  }

  // 29a — monotonic topic commit (no reopen)
  const commitKey = key;
  const commits = { ...(next.arcDirector?.topicCommits ?? {}) };
  if (!commits[commitKey] && used.length >= 2) {
    commits[commitKey] = mandate?.includes('quest stage')
      ? 'questStageAdvanced'
      : used.some((t) => /leverage|feed/i.test(t))
        ? 'leverageAccepted'
        : 'refusalFinal';
    next = {
      ...next,
      arcDirector: {
        ...next.arcDirector,
        topicCommits: commits,
      },
    };
    if (!mandate) {
      mandate = `NPC TOPIC COMMIT (${npc}): ${commits[commitKey]} — do not reopen this dialogue basin.`;
    }
  }

  if (!mandate) {
    mandate = `NPC TOPIC SUITE (${npc}): Topics exhausted — close dialogue branch with consequence, not repeat lines.`;
  }

  return { state: next, mandate };
}
