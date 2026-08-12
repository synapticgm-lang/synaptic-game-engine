import type { GameState, SituationPacket } from './types';
import { formatTimelineForPrompt } from './timelineFormat';

/**
 * Rebuild the live Situation packet from structured state.
 * This is what the GM must treat as "where we are right now."
 */
export function buildSituationPacket(state: GameState): SituationPacket {
  const dungeon = state.activeDungeon;
  const currentNode = dungeon?.nodes.find((n) => n.id === dungeon.currentNodeId);
  const dungeonLine = dungeon
    ? `${dungeon.dungeonName} @ ${currentNode?.name ?? dungeon.currentNodeId} (visited ${dungeon.visitedNodeIds.length}/${dungeon.nodes.length})`
    : 'none';

  const presentEntities: string[] = [];
  if (state.activeEncounter) {
    presentEntities.push(
      `Enemy: ${state.activeEncounter.name} HP ${state.activeEncounter.hp}/${state.activeEncounter.maxHp}`
    );
  }
  for (const c of state.companions ?? []) {
    presentEntities.push(`Companion: ${c.name}`);
  }
  // NPCs recently seen via lore cards tagged npc that appear in last timeline facts
  const recentNpcMentions = (state.timeline ?? [])
    .slice(-12)
    .filter((f) => f.kind === 'npc' || /npc|met |spoke/i.test(f.text))
    .map((f) => f.text)
    .slice(-4);
  presentEntities.push(...recentNpcMentions);

  const activeQuests = (state.quests ?? [])
    .filter((q) => q.status === 'active')
    .map((q) => {
      const obj = (q.objectives ?? [])
        .filter((o) => !o.completed)
        .map((o) => o.description)
        .slice(0, 2)
        .join('; ');
      return `${q.type.toUpperCase()}: ${q.name}${obj ? ` — ${obj}` : ''}`;
    });

  const coords = state.currentCoordinates
    ? `q=${state.currentCoordinates.q} r=${state.currentCoordinates.r} tier=${state.currentCoordinates.tier} z=${state.currentCoordinates.z ?? 0}`
    : undefined;

  return {
    location: state.currentLocation || (dungeon ? dungeon.dungeonName : 'unspecified'),
    coordinates: coords,
    encounter: state.activeEncounter
      ? `${state.activeEncounter.name} L${state.activeEncounter.level} HP ${state.activeEncounter.hp}/${state.activeEncounter.maxHp}`
      : 'none',
    dungeon: dungeonLine,
    presentEntities: presentEntities.length ? presentEntities : ['none established'],
    activeQuests: activeQuests.length ? activeQuests : ['none'],
    recentFacts: (state.timeline ?? []).slice(-8).map((f) => `T${f.turn}: ${f.text}`),
  };
}

export function formatSituationForPrompt(state: GameState): string {
  const s = buildSituationPacket(state);
  const npcBlock = (state.npcMemories ?? [])
    .slice(0, 5)
    .map((m) => `${m.npcName}[${m.disposition}]: ${m.facts.slice(-2).join('; ') || '—'}`)
    .join('\n');
  return `Location: ${s.location}${s.coordinates ? ` (${s.coordinates})` : ''}
Location sheet: ${state.locationSheet?.name ?? s.location} | interactables: ${(state.locationSheet?.interactables ?? []).map((i) => `${i.name}:${i.state}`).join(', ') || 'none'}
Encounter: ${s.encounter}
Dungeon: ${s.dungeon}
Present entities: ${s.presentEntities.join(' | ')}
Active quests: ${s.activeQuests.join(' | ')}
NPC memories:
${npcBlock || '(none)'}
Recent facts:
${s.recentFacts.length ? s.recentFacts.join('\n') : '(none)'}
RAILS: Hard facts above + factual timeline OVERRIDE improvisation. Do not invent named threats, loot, NPCs, or interactables absent from this packet / location sheet / tags.`;
}

export function formatCampaignRails(state: GameState): string {
  if (!state.campaignPremise?.trim()) return '';
  return `=== CAMPAIGN GUIDE BOOK (RAILS — DO NOT CONTRADICT) ===
${state.campaignPremise.trim()}
Stay inside this premise. Side scenes are allowed; jumping to unrelated endgames is not.
===========================================================`;
}

export function formatFullMemoryBlock(state: GameState): string {
  const rails = formatCampaignRails(state);
  const situation = formatSituationForPrompt(state);
  const timeline = formatTimelineForPrompt(state.timeline, 24);
  return `${rails ? `${rails}\n\n` : ''}=== SITUATION PACKET (CURRENT + LAST CONTEXT) ===
${situation}
=================================================

=== FACTUAL TIMELINE (NO FLUFF — AUTHORITATIVE MEMORY) ===
${timeline}
=================================================`;
}
