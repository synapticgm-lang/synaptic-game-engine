import type { GameState, SituationPacket, WorldLedger } from './types';
import { formatTimelineForPrompt } from './timelineFormat';
import { playerFacingLocation } from './locationName';
import { formatSceneFactsForPrompt } from './sceneFacts';
import { formatHiddenRoomLedger } from './dungeonSeed';
import { dangerTierLabel, mapScaleLabel, resolveDangerTier, resolveMapScale } from './placeAuthority';
import { formatPlacesForPrompt } from './places';
import { formatCampaignMemoryForPrompt } from './campaignMemory';
import { formatTutorialBeatMandate } from './tutorialBeats';
import { formatLocalityForPrompt } from './locality';
import { formatHiddenCulpritRail } from './mysteryCulprit';

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
  for (const who of state.sceneFacts?.present ?? []) {
    presentEntities.push(who);
  }
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
  // Hidden / unrevealed quests are intentionally omitted from the packet (Pack 5).

  const coords = state.currentCoordinates
    ? `q=${state.currentCoordinates.q} r=${state.currentCoordinates.r} tier=${state.currentCoordinates.tier} z=${state.currentCoordinates.z ?? 0}`
    : undefined;

  return {
    location: playerFacingLocation(state) || (dungeon ? dungeon.dungeonName : 'unspecified'),
    coordinates: coords,
    encounter: state.activeEncounter
      ? `${state.activeEncounter.name} L${state.activeEncounter.level} HP ${state.activeEncounter.hp}/${state.activeEncounter.maxHp}`
      : 'none',
    dungeon: dungeonLine,
    presentEntities: presentEntities.length
      ? Array.from(new Set(presentEntities))
      : ['none established'],
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
  const sceneBlock = formatSceneFactsForPrompt(state.sceneFacts);
  const currentSheet = state.locationSheet;
  const prevSheet = state.previousLocationSheet;
  const danger = resolveDangerTier(state);
  const scale = resolveMapScale(state);
  const dangerLine = dangerTierLabel(danger);
  const scaleLine = mapScaleLabel(scale);
  const currentLine = `CURRENT LOCATION SHEET: ${currentSheet?.name ?? s.location} | mapScale: ${scaleLine}${dangerLine ? ` | ${dangerLine}` : ' | dangerTier: none (street/outdoors)'} | interactables: ${(currentSheet?.interactables ?? []).map((i) => `${i.name}:${i.state}`).join(', ') || 'none'} | exits: ${(currentSheet?.exits ?? []).map((e) => e.label).join(', ') || 'none'}`;
  const previousLine = prevSheet?.name
    ? `PREVIOUS LOCATION SHEET: ${prevSheet.name} | interactables: ${(prevSheet.interactables ?? []).map((i) => `${i.name}:${i.state}`).join(', ') || 'none'} | exits: ${(prevSheet.exits ?? []).map((e) => e.label).join(', ') || 'none'}`
    : 'PREVIOUS LOCATION SHEET: none';
  const placeFacts = (state.timeline ?? [])
    .filter((f) => {
      const text = f.text.toLowerCase();
      const cur = (currentSheet?.name ?? s.location).toLowerCase();
      const prev = (prevSheet?.name ?? '').toLowerCase();
      return (cur && text.includes(cur.slice(0, Math.min(12, cur.length))))
        || (prev && text.includes(prev.slice(0, Math.min(12, prev.length))));
    })
    .slice(-6)
    .map((f) => `T${f.turn}: ${f.text}`);
  const hiddenLedger = formatHiddenRoomLedger(state.activeDungeon);
  const placeRegistry = formatPlacesForPrompt(state.places, currentSheet?.name ?? s.location);
  const tutorialMandate = formatTutorialBeatMandate(state);
  const none = '(none)';
  const lines = [
    currentLine,
    previousLine,
    placeRegistry ? `PLACE REGISTRY (authority for name/tier/arc):\n${placeRegistry}` : '',
    sceneBlock || '',
    `Encounter: ${s.encounter}`,
    `Dungeon: ${s.dungeon}`,
    `Present entities: ${s.presentEntities.join(' | ')}`,
    `Active quests (revealed only — never mention hidden Guide Book hooks): ${s.activeQuests.join(' | ')}`,
    'NPC memories:',
    npcBlock || none,
    'Place-scoped facts (current + last location):',
    placeFacts.length ? placeFacts.join('\n') : none,
    'Recent facts:',
    s.recentFacts.length ? s.recentFacts.join('\n') : none,
    hiddenLedger || '',
    tutorialMandate || '',
    formatLocalityForPrompt(state) || '',
    'RAILS: Hard facts above + SCENE FACTS + factual timeline OVERRIDE improvisation. Do not invent named threats, loot tiers, NPCs, or interactables absent from this packet / location sheet / tags / HIDDEN ROOM LEDGER. Do not invent a dungeon danger tier for street/outdoors (no "Tier 2 Urban Ruin" while mapScale is local streets). Do not empty a present crowd or silence shouting without narrating time passing.',
    'PLAYER ACTION FIDELITY: Resolve the player\'s last stated action first — the named object, question, or motion. Never swap a specific search for a generic look-around. Never pivot the scene to a quest location, dungeon, store, or marker unless the player mentioned it or is already there.',
    'BEAT ANSWER (BINDING): If they ask what a named glint, sound, or object is, name it or say they need to get closer. Do not write "might be nothing." If the camera already named debris on the floor, they can grab and throw junk — empty hands only if the room is actually bare.',
    'NO LEFTOVER STOCK: Do not re-sell a knife they already hold (no "reassuring weight/grip"). New camera only.',
    'Do not write "You commit to the action" or "the result lands in [lore title]". Narrate what actually happens.',
    'Lore-article titles are not the current location. Do not name unvisited hubs, cities, or NPCs.',
    'DUAL LOCATION MEMORY: Keep continuity with CURRENT and PREVIOUS location sheets. The player just left the previous place — do not forget what was there.',
    'REFUSE / PROTEST: If the player refuses the System or a quest, acknowledge in-fiction (cold System voice). Do not break character or say "choose an action to continue." Mechanics may still advance (timer, free attack) via the outcome token.',
    'HIDDEN QUESTS: Never spoil quests with status hidden or revealed=false.',
    formatWorldLedgerBlock(state.worldLedger),
  ];
  return lines.filter((line) => line !== '').join('\n');
}

function formatWorldLedgerBlock(raw?: WorldLedger): string {
  const clock = raw?.clock ?? { day: 0, week: 0 };
  const deals = raw?.deals?.filter((d) => d.active) ?? [];
  const holdings = raw?.holdings ?? [];
  const hostiles = raw?.hostiles ?? [];
  const actors = raw?.actors ?? [];
  const hasWork = deals.length + holdings.length + hostiles.length + actors.length > 0;
  const lines = [
    `In-game calendar: day ${Number(clock.day || 0).toFixed(1)}, week ${clock.week || 0}. Time advances as the player takes turns — not while the app is closed.`,
  ];
  if (Number(clock.day || 0) < 0.4 && Number(clock.week || 0) < 1) {
    lines.push('CLOCK LOCK: this is still the same morning. Do not write hours ago, hours later, or a day passing.');
  }
  if (!hasWork) {
    lines.push('No off-screen deals, holdings, or rival clocks yet.');
    return `WORLD LEDGER (ENGINE AUTHORITY — do not invent extra off-screen results):\n${lines.join('\n')}`;
  }
  for (const d of deals) {
    lines.push(
      `DEAL ${d.name} / ${d.partnerName}: ${Math.round(d.playerShare * 100)}% of ${d.runsPerWeek}/wk ${d.risk} runs (${d.workEthic}). Paid ${d.goldPaid}g. ${d.lastWeekSummary ?? ''}`
    );
  }
  for (const h of holdings) {
    lines.push(
      `HOLDING ${h.name} [${h.kind}] order=${h.order} ethic=${h.workEthic} rank=${h.level} progress=${h.progress} treasury=${h.treasury}g heat=${h.heat}. ${h.lastWeekSummary ?? ''}`
    );
  }
  for (const h of hostiles) {
    lines.push(`RIVAL ${h.name}: pressure ${h.progress}/100 rank ${h.level} (${h.workEthic}).`);
  }
  for (const a of actors) {
    lines.push(
      `ACTOR ${a.name}: lvl ${a.level}${a.profession ? ` ${a.profession} ${a.professionLevel}` : ''} (${a.workEthic}).`
    );
  }
  lines.push(
    'Narrate a deal/holding/actor report ONLY if the player is there, asks, or a VISIT REPORT is supplied. Never invent weekly outcomes.'
  );
  return `WORLD LEDGER (ENGINE AUTHORITY — do not invent extra off-screen results):\n${lines.join('\n')}`;
}

export function formatCampaignRails(state: GameState): string {
  if (!state.campaignPremise?.trim()) return '';
  // Strip legacy "ACTIVE OPENING QUEST (narrate...)" rails that railroad older saves.
  const premise = state.campaignPremise
    .replace(/\n*ACTIVE OPENING QUEST[\s\S]*?(?=\n[A-Z]|\n*$)/i, '')
    .replace(/\n*BACKGROUND QUEST[\s\S]*?(?=\n[A-Z]|\n*$)/i, '')
    .trim();
  const answers = state.openingEstablishment?.answers;
  const canon = answers && Object.keys(answers).length
    ? `\nPLAYER CANON (AUTHORITY — facts extracted from their answers; rewrite in System/narrator voice, never quote I/my chat):\n${Object.entries(answers).map(([id, text]) => `- ${id}: ${text}`).join('\n')}`
    : '';
  const culpritRail = formatHiddenCulpritRail(state.hiddenStamps);
  const styleRail = state.campaignStyleRail?.trim();
  return `=== CAMPAIGN GUIDE BOOK (RAILS — DO NOT CONTRADICT) ===
${premise}${canon}${culpritRail ? `\n${culpritRail}` : ''}${styleRail ? `\n${styleRail}` : ''}
Stay inside this premise. Side scenes, exploration, and side quests are allowed — they must still be THIS world, not a different genre.
PREMISE CONTINUITY (BINDING): If the premise is modern Earth being Integrated, the player already lived here. They did not "arrive" as a fantasy traveler. Opening kit / worn clothes are authority. Never invent an iron shortsword or leather tunic that is not in Inventory.
SITUATION QUESTIONS: "What's going on?" is answered from this premise + the last scene (street, crystals, people, System). Not from inventory labels. Not "the sheet".
PLAYER ACTION FIDELITY (BINDING): Answer the player's last action first (e.g. search this car, ask why they have a System-issue knife, practice swings). Do NOT redirect to quest dungeons, convenience stores, or System markers unless the player engages them. Quests are background Guide Book only — not a turn-by-turn script.
===========================================================`;
}

export function formatFullMemoryBlock(state: GameState): string {
  const rails = formatCampaignRails(state);
  const situation = formatSituationForPrompt(state);
  const memoryCore = formatCampaignMemoryForPrompt(state, situation, state.currentLocation ?? '');
  const timeline = formatTimelineForPrompt(state.timeline, 12);
  return `${rails ? `${rails}\n\n` : ''}${memoryCore}

=== FACTUAL TIMELINE (NO FLUFF — AUTHORITATIVE MEMORY, TRIMMED) ===
${timeline}
=================================================
OUTCOME TOKEN RECAP: Obey the structured outcome token supplied with this turn; never invert success/fail.`;
}
