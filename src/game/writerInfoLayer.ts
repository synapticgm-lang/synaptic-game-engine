import type { GameState, LoreCard } from './types';
import { computeInventoryCapacity, kitRefDisplay, turnUsesKit } from './inventory';
import { playerFacingLocation } from './locationName';
import { formatTimelineForPrompt } from './timelineFormat';
import { formatHiddenRoomLedger } from './dungeonSeed';
import { placeFirstSight } from './outdoorHubs';
import { isJourneyUnderway } from './travelJourney';
import { pendingFoeSign } from './combatAuthority';
import { presentNpcRecords } from './npcRecords';
import { listedAnonymousRoles, storyMinorRoles } from './closedScenePerson';
import { buildLifecycleSituationSection } from './npcLifecycleFsm';
import { gateFactLines } from './skillGates';
import { skillRanksOf } from './skillRanks';
import { gearAuthorityLine } from './infoSheet';
import { hidesPart, writerFacts } from './systemHousing';
import { litrpgClassName } from './litrpgClassNames';

export const WRITER_INFO_LAYER_CHAR_CAP = 2400;

export function buildGroundTruthLedger(state: GameState, opts?: { compact?: boolean; kitTurn?: string }): string {
  const compact = opts?.compact === true;
  const c = state.character;
  const kit = (name: string) => kitRefDisplay(name, state.engineMode === 'dnd');
  const facts = writerFacts(state, kit);
  const housed = facts.blocks.length > 0;
  // Tabletop writer facts: only the kit this turn's line uses, so there is no gear list to paste into prose.
  const kitTurn = state.engineMode === 'dnd' ? opts?.kitTurn : undefined;
  const carried = kitTurn === undefined ? facts.carried : facts.carried.filter((i) => turnUsesKit(i.name, kitTurn));
  const pocketed = facts.pocket;
  const invList = compact
    ? (() => {
        const names = carried.map((i) => `${kit(i.name)} x${i.quantity}`);
        const shown = names.slice(0, 12).join('; ');
        const more = names.length > 12 ? `; +${names.length - 12} more` : '';
        return shown ? `${shown}${more}` : 'None';
      })()
    : carried
    .map((i) => `${kit(i.name)} x${i.quantity}${i.description ? ` — ${i.description}` : ''}`)
    .join('; ') || 'None';
  const companions = (state.companions ?? [])
    .map(companion => `${companion.name} [${companion.type}; ${companion.role}; assignment: ${companion.assignment || 'none'}]`)
    .join('; ') || 'None';
  const statusList = c.conditions.length > 0 ? c.conditions.join(', ') : 'None';

  const cap = computeInventoryCapacity({ ...state, inventory: facts.carried, containers: facts.containers });
  const kitLines = (gear: string, inv: string): string[] =>
    kitTurn !== undefined && !carried.length ? [] : [gear, inv];
  const equippedGear = carried.filter(i => i.equipped).map(i => `${kit(i.name)}${i.slot ? ` (${i.slot})` : ''}`).join(', ') || 'None';
  const containerInfo = cap.containerBreakdown.map(c => `${c.name} [${c.storageType}, ${c.kind}] ${c.used}/${c.capacity} slots`).join('; ') || 'None';
  const isTabletop = state.engineMode === 'dnd';
  const header = isTabletop
    ? '=== TABLETOP CHARACTER STATE (GENERIC TTRPG TERMS ONLY) ==='
    : '=== GROUND TRUTH CHARACTER & QUEST STATE ===';
  const progressLine = isTabletop
    ? `Level: ${c.level} | Do not mention Integration, Wave, Salvage, Foundation Core, or First Blood.`
    : `Level: ${c.level} | XP: ${c.xp}/${c.xpToNext}`;
  const className = state.engineMode === 'litrpg' && !hidesPart(state.systemHousing, 'level') ? litrpgClassName(c) : null;
  const classLines = className ? [`Class: ${className}`] : [];

  // Health and mana figures live in the System window and STATUS, never in the writer's facts.
  if (housed) {
    return [
      header,
      `Gold: ${state.gold ?? 0}`,
      `Location: ${playerFacingLocation(state)}`,
      ...kitLines(
        `Equipped Gear: ${equippedGear}`,
        `Inventory: ${invList}${facts.containers.length ? ` (${cap.usedSlots}/${cap.totalSlots} slots used)` : ''}`,
      ),
      ...(gearAuthorityLine(state) ? [gearAuthorityLine(state)] : []),
      ...((state.companions ?? []).length ? [`Active Companions: ${companions}`] : []),
      ...(!compact && facts.containers.length ? [`Containers: ${containerInfo}`] : []),
      `Status Effects: ${statusList}`,
      ...facts.blocks,
      ...classLines,
      '===================================',
    ].join('\n');
  }

  const pocketLine = pocketed.length
    ? `In the pocket (stored; not worn, not in a bag, not on the body): ${pocketed.map((i) => `${kit(i.name)} x${i.quantity}`).join('; ')}`
    : '';
  const mainQuests = facts.quests.filter(q => q.type === 'main');
  const sideQuests = facts.quests.filter(q => q.type === 'side' && q.status === 'active');
  const mainQuestStr = mainQuests.length > 0
    ? mainQuests.map(q => `[MAIN] ${q.name} (${q.status})`).join('; ')
    : 'None active';
  const sideQuestStr = sideQuests.length > 0
    ? sideQuests.map(q => `[SIDE] ${q.name}`).join('; ')
    : 'None active';
  // Tabletop quests move by the step chips, never by the writer: no quest record on its sheet (infoSheet).
  const questLines = isTabletop ? [] : [`Active Main Story: ${mainQuestStr}`, `Active Side Quests: ${sideQuestStr}`];

  if (compact) {
    const lines = [
      header,
      `Gold: ${state.gold ?? 0}`,
      isTabletop ? `Level: ${c.level}` : progressLine,
      ...classLines,
      `Location: ${playerFacingLocation(state)}`,
      ...kitLines(`Equipped Gear: ${equippedGear}`, `Inventory: ${invList} (${cap.usedSlots}/${cap.totalSlots} slots used)`),
      ...(pocketLine ? [pocketLine] : []),
      ...(gearAuthorityLine(state) ? [gearAuthorityLine(state)] : []),
      ...((state.companions ?? []).length ? [`Active Companions: ${companions}`] : []),
      `Status Effects: ${statusList}`,
      ...questLines,
      '===================================',
    ];
    return lines.join('\n');
  }

  return `${header}
Gold: ${state.gold ?? 0}
${progressLine}
${classLines.map((l) => `${l}\n`).join('')}Location: ${playerFacingLocation(state)}
Equipped Gear: ${equippedGear}
Inventory: ${invList} (${cap.usedSlots}/${cap.totalSlots} slots used)
${pocketLine ? pocketLine + '\n' : ''}${gearAuthorityLine(state) ? gearAuthorityLine(state) + '\n' : ''}Active Companions: ${companions}
Containers: ${containerInfo}
Materials: ${state.materials.map(m => `${m.name} x${m.quantity}`).join(', ') || 'None'}${cap.hasMagicalContainer ? ' (infinite stacking)' : ''}
Status Effects: ${statusList}
${questLines.map((l) => `${l}\n`).join('')}===================================`;
}

export function buildLoreContext(cards: LoreCard[]): string {
  const summaries = cards.map(c => `[${String(c.type ?? 'lore').toUpperCase()}] ${c.name} — ${c.summary}`).join('\n');
  return `=== RELEVANT WORLD LORE & TIMELINE MILESTONES ===\n${summaries}\n===================================================`;
}

function pickLoreCards(state: GameState, activeLoreCards: LoreCard[], currentName: string): LoreCard[] {
  const personNames = new Set<string>();
  for (const r of presentNpcRecords(state)) {
    for (const n of [r.npcName, ...(r.aliases ?? [])]) {
      if (n?.trim()) personNames.add(n.trim().toLowerCase());
    }
  }
  const wanted = new Set<string>(personNames);
  if (currentName.trim()) wanted.add(currentName.trim().toLowerCase());
  for (const q of writerFacts(state).quests) {
    if (q.status === 'active' && q.name?.trim()) wanted.add(q.name.trim().toLowerCase());
  }
  const fromBook = (state.lorebook ?? []).filter((card) =>
    wanted.has((card.name ?? '').trim().toLowerCase())
  );
  const seen = new Set<string>();
  const picked: LoreCard[] = [];
  for (const card of [...activeLoreCards, ...fromBook]) {
    const key = (card.name ?? '').trim().toLowerCase();
    if (!key || seen.has(key) || personNames.has(key)) continue;
    seen.add(key);
    picked.push({ ...card, summary: (card.summary ?? '').slice(0, 160) });
    if (picked.length >= 4) break;
  }
  return picked;
}

export function formatWriterInfoLayer(state: GameState, activeLoreCards: LoreCard[] = [], playerInput?: string): string {
  const currentName = playerFacingLocation(state);

  const here: string[] = [`Here: ${currentName}`];
  // 27g — the place card is the fact authority; its text is a first sight, handed only the turn the player comes in.
  const sight = placeFirstSight(state, currentName);
  if (sight) here.push(`What it is: ${sight}`);
  const things = isJourneyUnderway(state) ? [] : state.locationSheet?.interactables ?? [];
  if (things.length) {
    here.push(`Things here: ${things.slice(0, 6).map((i) => `${i.name} (${i.state})`).join(', ')}`);
  }
  const people = presentNpcRecords(state);
  const unnamed = Array.from(new Set([...listedAnonymousRoles(state), ...storyMinorRoles(state)]));
  // Named people, their sheets and the exits are the SCENE block. Unnamed locals are not a SCENE row.
  const peopleSection = people.length
    ? ''
    : unnamed.length
      ? `People here: no one named. Unnamed local${unnamed.length > 1 ? 's' : ''} who may be about: ${unnamed.map((r) => `${/^[aeiou]/i.test(r) ? 'an' : 'a'} ${r}`).join(', ')} (may speak; give no name).`
      : '';

  const presentNames: string[] = [];
  for (let i = 0; i < people.length; i++) presentNames.push(people[i]!.npcName);
  const lifecycleSection = people.length
    ? buildLifecycleSituationSection(state, presentNames)
    : '';

  const threatSign = pendingFoeSign(state.sceneFacts?.pendingEncounter, state);
  const threatSection = threatSign ? `Threat building (show a sign before the foe appears):\n${threatSign}` : '';

  const gates = gateFactLines(state);
  const roomSection = [
    state.activeDungeon
      ? formatHiddenRoomLedger(state.activeDungeon, { factsOnly: true, ranks: skillRanksOf(state.character) })
      : '',
    gates.length ? `Locks:\n${gates.join('\n')}` : '',
  ].filter(Boolean).join('\n');

  const ledgerSection = buildGroundTruthLedger(state, { compact: true, kitTurn: playerInput });

  const lore = pickLoreCards(state, activeLoreCards, currentName);
  const loreSection = lore.length ? buildLoreContext(lore) : '';

  const timelineSection = state.timeline?.length
    ? `Recent timeline:\n${formatTimelineForPrompt(state.timeline, 6)}`
    : '';

  const agendaFact = state.sceneFacts?.agendaWorldFact?.trim();
  const agendaSection = agendaFact ? `Agenda (world fact):\n${agendaFact}` : '';
  // T10AB — stall pressure must reach the writer so the world acts (patrol / visitor / deadline), not only a chip.
  const stallFact =
    state.sceneFacts?.stallWorldFact?.trim()
    || state.sceneFacts?.placeWorldFact?.trim()
    || '';
  const stallSection = stallFact ? `World pressure (must show this beat):\n${stallFact}` : '';

  const build = (withLore: boolean, withTimeline: boolean): string =>
    [
      'WORLD FACTS (this turn):',
      here.join('\n'),
      peopleSection,
      lifecycleSection,
      agendaSection,
      stallSection,
      threatSection,
      roomSection,
      ledgerSection,
      withLore ? loreSection : '',
      withTimeline ? timelineSection : '',
    ]
      .filter((s) => s && s.trim())
      .join('\n\n');

  let text = build(true, true);
  if (text.length > WRITER_INFO_LAYER_CHAR_CAP) text = build(false, true);
  if (text.length > WRITER_INFO_LAYER_CHAR_CAP) text = build(false, false);
  if (text.length > WRITER_INFO_LAYER_CHAR_CAP) {
    const cut = text.slice(0, WRITER_INFO_LAYER_CHAR_CAP);
    const nl = cut.lastIndexOf('\n');
    text = nl > 0 ? cut.slice(0, nl) : cut;
  }
  return text;
}
