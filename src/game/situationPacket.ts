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

  // Revealed + active names only. Unrevealed quests stay out of the scene packet.
  const activeQuests = (state.quests ?? [])
    .filter((q) => q.status === 'active' && q.revealed === true)
    .map((q) => `${q.type.toUpperCase()}: ${q.name}`);

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
Active quests (background names only — do not force): ${s.activeQuests.join(' | ')}
NPC memories:
${npcBlock || '(none)'}
Recent facts:
${s.recentFacts.length ? s.recentFacts.join('\n') : '(none)'}
RAILS: Hard facts above + factual timeline OVERRIDE improvisation. Do not invent named threats, loot, NPCs, or interactables absent from this packet / location sheet / tags.
PLAYER ACTION FIDELITY: Resolve the player's last stated action first. Never pivot the scene to a quest location, dungeon, store, or marker unless the player mentioned it or is already there.`;
}

export function formatCampaignRails(state: GameState): string {
  if (!state.campaignPremise?.trim()) return '';
  // Strip legacy "ACTIVE OPENING QUEST (narrate...)" rails that railroad older saves.
  const premise = state.campaignPremise
    .replace(/\n*ACTIVE OPENING QUEST[\s\S]*?(?=\n[A-Z]|\n*$)/i, '')
    .replace(/\n*BACKGROUND QUEST[\s\S]*?(?=\n[A-Z]|\n*$)/i, '')
    .trim();
  return `=== CAMPAIGN GUIDE BOOK (RAILS — DO NOT CONTRADICT) ===
${premise}
Stay inside this premise. Side scenes and downtime are allowed.
PLAYER ACTION FIDELITY (BINDING): Answer the player's last action first (e.g. practice swings, ask a question, look at gear). Do NOT redirect to quest dungeons, convenience stores, or System markers unless the player engages them. Quests are background Guide Book only — not a turn-by-turn script.
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
