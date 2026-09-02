import type { FactionStanding, GameState, PowerScaling, SituationPacket, WorldLedger } from './types.ts';
import { formatTimelineForPrompt } from './timelineFormat.ts';
import { playerFacingLocation } from './locationName.ts';
import { formatCampaignContractForPrompt } from './campaignContract.ts';
import { formatHiddenRoomLedger } from './dungeonSeed.ts';
import {
  dangerTierLabel,
  mapScaleLabel,
  resolveDangerTier,
  resolveMapScale,
  resolveThreatTier,
  isInteriorMap,
} from './placeAuthority.ts';
import { formatPlacesForPrompt } from './places.ts';
import { formatCampaignMemoryForPrompt } from './campaignMemory.ts';
import { formatTutorialBeatMandate } from './tutorialBeats.ts';
import { formatLocalityForPrompt } from './locality.ts';
import { formatHiddenCulpritRail } from './mysteryCulprit.ts';
import { formatGraphExitToken, formatInteriorExploreAuthority, listInteriorExitsFromHere } from './mapEngine.ts';
import { formatOutdoorHubsForPrompt } from './outdoorHubs.ts';
import { formatHubArrivalForPrompt } from './hubEncounters.ts';
import { emptySearchAuthorityLine, weaponAuthorityLine } from './searchContinuity.ts';
import { countPlayerIntentStreak } from './beatFingerprint.ts';
import {
  checkProgressGovernor,
  hasActiveObjectives,
  initProgressGovernor,
} from './forwardProgressGovernor.ts';
import { buildGovernanceSnapshotLines } from './qualityGovernance.ts';
import { formatWorldAtlasBlock } from './worldAtlas.ts';
import {
  formatCrowdBindingLine,
  formatCrowdSnapshotLine,
  formatPresenceForSnapshot,
} from './crowdAuthority.ts';
import { formatWorldMapAuthorityBlock } from './worldMapAuthority.ts';
import { formatCraftSnapshotLines } from './craftBookCompiler.ts';
import { formatCoverChromeBindingLine } from './chromeAuthority.ts';
import { alignFactionNotesToHook, formatHookBindingLine, resolveHookLock } from './hookLock.ts';
import {
  formatVignetteBindingLine,
  formatVignetteSnapshotLine,
} from './vignetteLock.ts';
import { formatCameraBindingLine } from './travelAuthority.ts';
import { formatLastKillSnapshotLine } from './combatAuthority.ts';
import {
  formatLastSnapshotGistLine,
  formatPointerCardForSnapshot,
  openingInventBudgetZero,
} from './openingPointerCard.ts';
// WS-2 Wave C: NPC Memory sections
import {
  buildNpcPacket,
  formatNpcPacketSection,
} from './npcMemoryRetrieval.ts';
// WS-5 Wave B: PYOA Branch State
import {
  buildDelayedConsequencesSituationSection,
  buildJournalConsequenceHints,
} from './pyoaDelayedConsequences.ts';
import { formatPyoaSpineSnapshotLines } from './pyoaSpine.ts';
// WS-6 Wave C: Spine Map and Exhaustion
import {
  formatExhaustionSummary,
  type ContentDensityState,
} from './exhaustionCurve.ts';
// Flash Lite Input Sanitization (2026-09-02)
import { translateStateToNarrative } from './narrativeTranslator.ts';
import { buildEntityCast } from './entityCast.ts';
import { injectLoiterDelta } from './loiterDeltaDirective.ts';
import { formatPovRailsForPrompt } from './povRails.ts';

export function effectivePowerScaling(state: GameState): PowerScaling {
  return state.powerScaling ?? 'balanced';
}

function formatFactionMatrix(standings: FactionStanding[], state?: GameState): string {
  if (!standings.length) return '';
  const aligned = alignFactionNotesToHook(standings, state ? resolveHookLock(state) : undefined);
  const parts = aligned.map((f) => {
    const influence =
      typeof f.influence === 'number' && Number.isFinite(f.influence)
        ? ` influence=${f.influence}`
        : '';
    const notes = f.notes?.trim() ? ` — ${f.notes.trim()}` : '';
    return `${f.name}=${f.standing}${influence}${notes}`;
  });
  return `[FACTION MATRIX: ${parts.join('; ')}]`;
}

function formatSimulationistBlocks(state: GameState): string[] {
  const blocks: string[] = [];
  const threat = resolveThreatTier(state);
  const level = Math.max(1, state.character?.level ?? 1);
  if (threat != null) {
    blocks.push(`[ZONE THREAT: Tier ${threat} vs Player Level ${level}]`);
  }
  const factions = state.worldLedger?.factionStandings ?? [];
  const matrix = formatFactionMatrix(factions, state);
  if (matrix) blocks.push(matrix);
  blocks.push(`[POWER SCALING: ${effectivePowerScaling(state)}]`);
  return blocks;
}
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
  const alone = state.openingEstablishment?.aloneArrival === true;
  if (!alone) {
    for (const who of formatPresenceForSnapshot(state.sceneFacts?.present)) {
      presentEntities.push(who);
    }
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
  if (!alone) {
    const recentNpcMentions = (state.timeline ?? [])
      .slice(-12)
      .filter((f) => f.kind === 'npc' || /npc|met |spoke/i.test(f.text))
      .map((f) => f.text)
      .slice(-4);
    presentEntities.push(...recentNpcMentions);
  } else {
    presentEntities.push('alone — no established NPCs');
  }

  // Revealed + active names only. Unrevealed quests stay out of the scene packet.
  const activeQuests = (state.quests ?? [])
    .filter((q) => q.status === 'active' && q.revealed === true)
    .map((q) => `${q.type.toUpperCase()}: ${q.name}`);
  // Hidden / unrevealed quests are intentionally omitted from the packet (Pack 5).

  const coords = state.currentCoordinates
    ? `q=${state.currentCoordinates.q} r=${state.currentCoordinates.r} tier=${state.currentCoordinates.tier} z=${state.currentCoordinates.z ?? 0}`
    : undefined;

  // WS-7 Wave 1: Build social context if any social crises or leverage assets exist
  let socialContext: SituationPacket['socialContext'];
  const arc = state.arcDirector;
  const activeCrisis = arc?.socialCrises?.find((c) => !c.resolution);
  const availableLeverage = arc?.leverageAssets?.filter((l) => !l.exhausted) ?? [];
  const relationships = arc?.npcRelationships ?? [];

  if (activeCrisis || availableLeverage.length > 0 || relationships.length > 0) {
    socialContext = {
      crisisId: activeCrisis?.id,
      crisisName: activeCrisis?.name,
      stakes: activeCrisis?.stakes
        ? {
            gain: activeCrisis.stakes.gain,
            loss: activeCrisis.stakes.loss,
            owner: activeCrisis.stakes.owner,
            deadline: activeCrisis.stakes.deadline,
          }
        : undefined,
      leverage: availableLeverage.map((l) => ({
        type: l.type,
        targetNpc: l.targetNpc,
        exhausted: l.exhausted,
      })),
      relationships: relationships.map((r) => {
        let disposition = 'neutral';
        if (r.trust >= 60) disposition = 'ally';
        else if (r.trust <= 20) disposition = 'hostile';
        else if (r.fear && r.fear >= 40) disposition = 'intimidated';
        else if (r.respect && r.respect >= 60) disposition = 'respectful';
        
        return {
          npcName: r.npcName,
          trust: r.trust,
          disposition,
        };
      }),
    };
  }

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
    socialContext,
  };
}

/**
 * One compact truth block for the GM. Atmosphere is free; facts must match.
 */
export function formatSceneSnapshotForPrompt(state: GameState): string {
  const s = buildSituationPacket(state);
  const alone = state.openingEstablishment?.aloneArrival === true;
  const threat = resolveThreatTier(state);
  const level = Math.max(1, state.character?.level ?? 1);
  
  // Flash Lite Input Sanitization: Build CAST block first
  const castBlock = buildEntityCast(state);
  
  // Natural language state translation
  const narrativeState = translateStateToNarrative(state);
  
  const presence =
    alone && !state.activeEncounter
      ? 'alone — no established NPCs'
      : s.presentEntities.length && s.presentEntities[0] !== 'none established'
        ? s.presentEntities.slice(0, 6).join('; ')
        : 'none established';

  const crowdLabel = formatCrowdSnapshotLine(state);

  let exits = 'none established';
  if (state.activeDungeon && isInteriorMap(state.activeDungeon)) {
    const dungeon = state.activeDungeon;
    const here = dungeon.nodes.find((n) => n.id === dungeon.currentNodeId);
    const listed = listInteriorExitsFromHere(dungeon);
    exits = listed.length
      ? listed.map((e) => {
          const dest = dungeon.nodes.find((n) => n.name === e.name);
          const token = here ? formatGraphExitToken(here, dest, e.noun, e.kind) : 'doorway';
          return `${token}→${e.name}`;
        }).join(', ')
      : 'none mapped from this room';
  } else {
    const sheetExits = (state.locationSheet?.exits ?? []).map((e) => e.label).filter(Boolean);
    if (sheetExits.length) exits = sheetExits.slice(0, 8).join(', ');
  }

  const props = Array.from(new Set([
    ...(state.sceneFacts?.props ?? []),
    ...(state.locationSheet?.interactables ?? []).map((i) => i.name).filter(Boolean),
  ])).slice(0, 10);
  const inventory = (state.inventory ?? []).map((i) => i.name).filter(Boolean);
  const openAsks = (state.campaignMemory?.consequences ?? [])
    .filter((t) => t.unresolved && t.text?.trim())
    .slice(0, 4)
    .map((t) => t.text.trim());

  const scale = mapScaleLabel(resolveMapScale(state));
  const danger = dangerTierLabel(resolveDangerTier(state));
  const timeLabel = state.sceneFacts?.timeOfDay && state.sceneFacts.timeOfDay !== 'unknown'
    ? state.sceneFacts.timeOfDay
    : undefined;
  const weatherLabel = state.sceneFacts?.weather && state.sceneFacts.weather !== 'unknown'
    ? state.sceneFacts.weather
    : undefined;
  const locationTypeLabel = state.sceneFacts?.indoor !== undefined
    ? (state.sceneFacts.indoor ? 'interior' : 'exterior')
    : undefined;
  const tensionLabel = state.sceneFacts?.tension && state.sceneFacts.tension !== 'unknown'
    ? state.sceneFacts.tension
    : undefined;
  const noiseLabel = state.sceneFacts?.noise && state.sceneFacts.noise !== 'unknown'
    ? state.sceneFacts.noise
    : undefined;

  const lines = [
    '### SNAPSHOT',
    `- Location: ${s.location}`,
    threat != null
      ? `- Zone Threat: Tier ${threat} vs Player Level ${level}`
      : `- Zone Threat: none (street/outdoors or unset)`,
    `- Crowd: ${crowdLabel}`,
    `- Presence: ${presence}`,
    `- Exits: ${exits}`,
    `- Props: ${props.join(', ') || 'none established'}`,
    `- Inventory: ${inventory.length ? inventory.slice(0, 10).join(', ') : 'none'}`,
    `- Encounter: ${s.encounter}`,
    `- Active Quests (revealed): ${s.activeQuests.join('; ')}`,
    `- Power Scaling: ${effectivePowerScaling(state)}`,
    `- Map: ${scale}${danger ? ` | ${danger}` : ''}`,
  ];
  const mainQuest = (state.quests ?? []).find(
    (q) => (q.status === 'active' || q.status === 'available') && q.type === 'main'
  ) ?? (state.quests ?? []).find((q) => q.status === 'active' || q.status === 'available');
  if (mainQuest?.name) {
    const nextObj =
      (mainQuest.objectives ?? []).find((o) => !o.completed)?.description
      || mainQuest.description
      || '';
    lines.push(
      `- Quest focus: ${mainQuest.name}${nextObj ? ` — ${String(nextObj).slice(0, 120)}` : ''}`
    );
  }
  const streak = countPlayerIntentStreak(state);
  if (streak.count >= 3 && streak.key !== 'empty') {
    lines.push(
      `- Stagnation: player repeated "${streak.key}" ×${streak.count} — FORCE a concrete interrupt this beat (arrival, danger, offer change, or quest-relevant beat). Do not clone prior paragraphs.`
    );
    if (streak.count >= 5) {
      lines.push(
        `- Stagnation HARD: ${streak.count} identical intents — you MUST change location pressure or introduce a new named person/event; answering with the same stall dialogue is forbidden.`
      );
    }
  }
  
  // P0.0: Forward-Progress Governor
  const governor = state.progressGovernor ?? initProgressGovernor();
  const activeObjective = hasActiveObjectives(state);
  const progressCheck = checkProgressGovernor(state, governor, activeObjective);
  // 29d prompt diet — skip Forward-Progress mandate when ArcDirector / governance already owns interrupt
  const governanceLines = buildGovernanceSnapshotLines(state)
    .map((m) => m.trim())
    .filter(Boolean);
  const governanceBlob = governanceLines.join('\n').toLowerCase();
  if (
    progressCheck.needsProgress &&
    progressCheck.mandate &&
    !/loiter interrupt|free t12|arc beat|stagnation/i.test(governanceBlob)
  ) {
    lines.push(`- ${progressCheck.mandate}`);
  }

  for (const mandate of governanceLines) {
    lines.push(`- ${mandate.replace(/^-\s*/, '')}`);
  }

  for (const spineLine of formatPyoaSpineSnapshotLines(state)) {
    lines.push(`- ${spineLine}`);
  }

  if (timeLabel) lines.push(`- Time of Day: ${timeLabel}`);
  if (weatherLabel) lines.push(`- Weather: ${weatherLabel}`);
  if (locationTypeLabel) lines.push(`- Location Type: ${locationTypeLabel}`);
  if (tensionLabel) lines.push(`- Tension: ${tensionLabel}`);
  if (noiseLabel) lines.push(`- Noise: ${noiseLabel}`);
  if (state.sceneFacts?.lastBeat) lines.push(`- Last beat: ${state.sceneFacts.lastBeat}`);
  if (openAsks.length) lines.push(`- Open asks: ${openAsks.join('; ')}`);
  const emptySearch = emptySearchAuthorityLine(state.sceneFacts);
  if (emptySearch) lines.push(`- ${emptySearch}`);
  const lastKillLine = formatLastKillSnapshotLine(state.sceneFacts?.lastKill);
  if (lastKillLine) lines.push(`- ${lastKillLine}`);
  const vignetteSnap = formatVignetteSnapshotLine(state);
  if (vignetteSnap) lines.push(`- ${vignetteSnap}`);
  lines.push(`- ${weaponAuthorityLine(state)}`);
  lines.push('');
  // 29d — one AUTHORITY + PROSE LICENSE block (no duplicate STAGNATION / QUEST essays)
  const crowdBind = formatCrowdBindingLine(state);
  if (crowdBind) lines.push(`- ${crowdBind}`);
  const hookBind = formatHookBindingLine(state);
  if (hookBind) lines.push(`- ${hookBind}`);
  const vignetteBind = formatVignetteBindingLine(state);
  if (vignetteBind) lines.push(`- ${vignetteBind}`);
  const cameraBind = formatCameraBindingLine(state);
  if (cameraBind) lines.push(`- ${cameraBind}`);
  lines.push(`- ${formatCoverChromeBindingLine()}`);
  const lastPlayer = [...(state.log ?? [])].reverse().find((e) => e?.role === 'player')?.content ?? '';
  const gistLine = formatLastSnapshotGistLine(state);
  if (gistLine) {
    lines.push(`- ${gistLine}`);
    lines.push(
      'BEAT DELTA: Change one concrete from LAST SNAPSHOT — a fact, tactic, cost, exit, or honest empty. Do not reprint that gist.'
    );
  } else if (lastPlayer && /\b(look around|examine the (?:area|room|surroundings)|wait)\b/i.test(lastPlayer)) {
    lines.push(
      'BEAT DELTA: After look/wait, add one new fact, person tactic, cost, or honest empty — do not reprint this room\'s smell/light essay.'
    );
  }
  if (openingInventBudgetZero(state)) {
    lines.push(
      'OPENING INVENT BUDGET: 0 — no new named people, places, or why beyond the pointer card until a cover is harvested or the player travels.'
    );
  }
  const pointerBlock = formatPointerCardForSnapshot(state);
  if (pointerBlock) {
    lines.push(pointerBlock);
  }
  lines.push(
    'AUTHORITY: SNAPSHOT + ledger win on facts (kit, exits, presence, HP, crowd count, hook why, outcomes). Do not invent items, doors, named people, or numeric results absent above. Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate.'
  );
  lines.push(...formatCraftSnapshotLines(state));
  lines.push(
    'PROSE LICENSE: Full artistic freedom on sensory detail, metaphor, pacing, and NPC manner — dramatize the OUTCOME token; never invert it. Stakes stay honest (no auto-win, no invented kit).'
  );
  if (mainQuest?.name && !/quest pressure|quest focus/i.test(governanceBlob)) {
    lines.push(
      'QUEST PRESSURE: Unless mid-combat or mid-opening covers, include one concrete reminder or option tied to Quest focus this beat.'
    );
  }
  // Stagnation already listed above when streak≥3; skip duplicate INTERRUPT essay
  const pinned = state.openingEstablishment?.pinnedNpcNames ?? [];
  if (pinned.length && (state.turn ?? 0) <= 20 && !alone) {
    lines.push(
      `OPENING PIN: ${pinned.join(', ')} stay present and consequential — do not forget the opening offer or replace them with stranger/kit nouns.`
    );
  }
  // Dry-wit voice lives in VOICE cadence directive — no second VOICE CHECK line
  if (!alone || state.activeEncounter) {
    lines.push(
      'SPEAKER CONTINUITY: Named people in Presence who just spoke stay present this beat unless Time/Location changes.'
    );
  }
  
  // Apply loiter delta directive if needed
  // Reuse streak variable from line 306 (already calculated above for stagnation check)
  const snapshotBase = lines.join('\n');
  const snapshotWithLoiterDelta = injectLoiterDelta(snapshotBase, streak, state);
  
  // Prepend CAST block and narrative state
  return `${castBlock}

### CURRENT SCENE (NATURAL LANGUAGE)
${narrativeState}

${snapshotWithLoiterDelta}`;
}

export function formatSituationForPrompt(state: GameState): string {
  const s = buildSituationPacket(state);
  const alone = state.openingEstablishment?.aloneArrival === true;
  const snapshot = formatSceneSnapshotForPrompt(state);

  // WS-2 Wave C: Build NPC memory packets
  const presentNpcs = state.sceneFacts?.present?.filter(p => p && !/^(a|an|the|some)\s/i.test(p)) ?? [];
  const npcPackets = presentNpcs.slice(0, 3).map(npcId => 
    buildNpcPacket(npcId, state, {
      includeFullMemories: false,
      includeObligations: true,
      includeTopics: true,
    })
  );
  const npcMemoryBlock = npcPackets.map(p => formatNpcPacketSection(p)).join('\n\n');

  const npcBlock = (state.npcMemories ?? [])
    .slice(0, 5)
    .map((m) => `${m.npcName}[${m.disposition}]: ${m.facts.slice(-2).join('; ') || '—'}`)
    .join('\n');
  const currentSheet = state.locationSheet;
  const prevSheet = state.previousLocationSheet;
  const danger = resolveDangerTier(state);
  const scale = resolveMapScale(state);
  const dangerLine = dangerTierLabel(danger);
  const scaleLine = mapScaleLabel(scale);
  const currentLine = `CURRENT LOCATION SHEET: ${currentSheet?.name ?? s.location} | mapScale: ${scaleLine}${dangerLine ? ` | ${dangerLine}` : ' | dangerTier: none (street/outdoors)'} | interactables: ${(currentSheet?.interactables ?? []).map((i) => `${i.name}:${i.state}`).join(', ') || 'none'}`;
  const previousLine = prevSheet?.name
    ? `PREVIOUS LOCATION SHEET: ${prevSheet.name} | interactables: ${(prevSheet.interactables ?? []).map((i) => `${i.name}:${i.state}`).join(', ') || 'none'}`
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
  const contractBlock = formatCampaignContractForPrompt(state);
  const interiorExplore =
    state.activeDungeon && isInteriorMap(state.activeDungeon)
      ? formatInteriorExploreAuthority(state.activeDungeon)
      : '';
  const simulationist = formatSimulationistBlocks(state);
  const none = '(none)';
  // WS-5 Wave B: PYOA delayed consequences section
  const delayedConsequencesBlock = state.engineMode === 'pyoa' 
    ? buildDelayedConsequencesSituationSection(state)
    : '';

  // WS-6 Wave C: Exhaustion summary
  const exhaustionBlock = state.arcDirector?.contentDensityState
    ? `EXHAUSTION: ${formatExhaustionSummary(state.arcDirector.contentDensityState)}`
    : '';

  const lines = [
    snapshot,
    '',
    formatWorldMapAuthorityBlock(state),
    formatWorldAtlasBlock(state),
    contractBlock,
    currentLine,
    previousLine,
    placeRegistry ? `PLACE REGISTRY (authority for name/tier/arc):\n${placeRegistry}` : '',
    ...simulationist,
    formatOutdoorHubsForPrompt(state),
    formatHubArrivalForPrompt(state),
    `Dungeon: ${s.dungeon}`,
    interiorExplore || '',
    npcMemoryBlock ? `=== NPC MEMORY PACKETS (WS-2 AUTHORITY) ===\n${npcMemoryBlock}\n===` : '',
    'NPC memories (how they were treated sticks — no karma meter):',
    npcBlock || none,
    'Place-scoped facts (current + last location):',
    placeFacts.length ? placeFacts.join('\n') : none,
    hiddenLedger || '',
    tutorialMandate || '',
    formatLocalityForPrompt(state) || '',
    alone
      ? 'ALONE ARRIVAL: Empty ruin — no handlers or "people who saw you arrive." Do not invent voices outside or watchers at the wall.'
      : '',
    delayedConsequencesBlock || '',
    exhaustionBlock || '',
    'RAILS: SNAPSHOT + ledger + WORLD MAP are fact authority. Narrate richly inside listed settlements. Do not invent new cities, towns, shores, or continents. Do not invent named threats, loot, or doors absent above. Quest sites must fit biome. Dungeons open at allowsDungeon sites then close when cleared.',
    'HIDDEN QUESTS: Never spoil quests with status hidden or revealed=false.',
    'PROSE LICENSE: Full artistic freedom on sensory detail, metaphor, pacing, and NPC manner. Descriptive engaging language and narrative flair are required.',
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
  const summonedPactPlace =
    state.campaignBibleId === 'summoned-pact'
      ? `\nLOCATION LANGUAGE (BINDING): Camera is HERE — the seeded summon place for this run (cathedral circle, war camp, cell, arena, shrine, festival square, rival hall, treaty tent, harbor hold, ruined west-wall circle, infirmary, or an alone-arrival ruin of a random building) unless Location says otherwise. Alone-arrival cards: no summoners, handlers, or watchers on page one or later explore beats until the ledger establishes presence. Never call this interior "a nearby building." "The court" is Pellane's Crown / the people in this room, not the enemy. The enemy polity is the Ash Court. Do not use "the court" as both current room and the enemy in the same beat.`
      : '';
  return `=== CAMPAIGN GUIDE BOOK (RAILS — DO NOT CONTRADICT) ===
${premise}${canon}${culpritRail ? `\n${culpritRail}` : ''}${styleRail ? `\n${styleRail}` : ''}${summonedPactPlace}
Stay inside this premise. Side scenes, exploration, and side quests are allowed — they must still be THIS world, not a different genre.
PREMISE CONTINUITY (BINDING): If the premise is modern Earth being Integrated, the player already lived here. They did not "arrive" as a fantasy traveler. Opening kit / worn clothes are authority. Never invent an iron shortsword or leather tunic that is not in Inventory.
SITUATION QUESTIONS: "What's going on?" is answered from this premise + the last scene (street, crystals, people, System). Not from inventory labels. Not "the sheet".
PLAYER ACTION FIDELITY (BINDING): Answer the player's last action first (e.g. search this car, ask why they have a System-issue knife, practice swings). Do NOT redirect to quest dungeons, convenience stores, or System markers unless the player engages them. Quests are background Guide Book only — not a turn-by-turn script.
===========================================================`;
}

export function formatFullMemoryBlock(state: GameState, tokenBudget?: number): string {
  const rails = formatCampaignRails(state);
  const povRails = formatPovRailsForPrompt(state);
  const situation = formatSituationForPrompt(state);
  const budget = tokenBudget ?? 2000; // Default 2k, can be increased dynamically
  const memoryCore = formatCampaignMemoryForPrompt(state, situation, state.currentLocation ?? '', budget);
  const timeline = formatTimelineForPrompt(state.timeline, 12);
  return `${rails ? `${rails}\n\n` : ''}${povRails ? `${povRails}\n\n` : ''}${memoryCore}

=== FACTUAL TIMELINE (NO FLUFF — AUTHORITATIVE MEMORY, TRIMMED) ===
${timeline}
=================================================
OUTCOME TOKEN RECAP: Obey the structured outcome token supplied with this turn; never invert success/fail.
FLUIDITY: Descriptive language and narrative flair are required. Atmosphere and unnamed detail are free. Factual details (stats, inventory, exits, who is here, damage) MUST match the SNAPSHOT / data sheets / ledger — do not invent items, doors, named NPCs, or numeric results.`;
}
