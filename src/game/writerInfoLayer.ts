import type { GameState, LoreCard } from './types';
import { computeInventoryCapacity } from './inventory';
import { playerFacingLocation } from './locationName';
import { formatTimelineForPrompt } from './timelineFormat';
import { formatHiddenRoomLedger } from './dungeonSeed';
import { placeCardFor } from './outdoorHubs';
import { formatNpcMemoriesForPrompt, presentNpcRecords } from './npcRecords';
import { listedAnonymousRoles, storyMinorRoles } from './closedScenePerson';

export const WRITER_INFO_LAYER_CHAR_CAP = 2400;

export function buildGroundTruthLedger(state: GameState, opts?: { compact?: boolean }): string {
  const compact = opts?.compact === true;
  const c = state.character;
  const invList = compact
    ? (() => {
        const names = state.inventory.map((i) => `${i.name} x${i.quantity}`);
        const shown = names.slice(0, 12).join('; ');
        const more = names.length > 12 ? `; +${names.length - 12} more` : '';
        return shown ? `${shown}${more}` : 'None';
      })()
    : state.inventory
    .map((i) => `${i.name} x${i.quantity}${i.description ? ` — ${i.description}` : ''}`)
    .join('; ') || 'None';
  const companions = (state.companions ?? [])
    .map(companion => `${companion.name} [${companion.type}; ${companion.role}; assignment: ${companion.assignment || 'none'}]`)
    .join('; ') || 'None';
  const statusList = c.conditions.length > 0 ? c.conditions.join(', ') : 'None';
  
  const mainQuests = (state.quests ?? []).filter(q => q.type === 'main');
  const sideQuests = (state.quests ?? []).filter(q => q.type === 'side' && q.status === 'active');
  
  const mainQuestStr = mainQuests.length > 0 
    ? mainQuests.map(q => `[MAIN] ${q.name} (${q.status})`).join('; ')
    : 'None active';
    
  const sideQuestStr = sideQuests.length > 0
    ? sideQuests.map(q => `[SIDE] ${q.name}`).join('; ')
    : 'None active';

  const cap = computeInventoryCapacity(state);
  const equippedGear = state.inventory.filter(i => i.equipped).map(i => `${i.name}${i.slot ? ` (${i.slot})` : ''}`).join(', ') || 'None';
  const containerInfo = cap.containerBreakdown.map(c => `${c.name} [${c.storageType}, ${c.kind}] ${c.used}/${c.capacity} slots`).join('; ') || 'None';
  const isTabletop = state.engineMode === 'dnd';
  const header = isTabletop
    ? '=== TABLETOP CHARACTER STATE (GENERIC TTRPG TERMS ONLY) ==='
    : '=== GROUND TRUTH CHARACTER & QUEST STATE ===';
  const progressLine = isTabletop
    ? `Level: ${c.level} | Do not mention Integration, Wave, Salvage, Foundation Core, or First Blood.`
    : `Level: ${c.level} | XP: ${c.xp}/${c.xpToNext}`;

  if (compact) {
    const lines = [
      header,
      `HP: ${c.hp}/${c.maxHp} | Mana: ${c.mp}/${c.maxMp} | Gold: ${state.gold ?? 0}`,
      isTabletop ? `Level: ${c.level}` : progressLine,
      `Location: ${playerFacingLocation(state)}`,
      `Equipped Gear: ${equippedGear}`,
      `Inventory: ${invList} (${cap.usedSlots}/${cap.totalSlots} slots used)`,
      ...((state.companions ?? []).length ? [`Active Companions: ${companions}`] : []),
      `Status Effects: ${statusList}`,
      `Active Main Story: ${mainQuestStr}`,
      `Active Side Quests: ${sideQuestStr}`,
      '===================================',
    ];
    return lines.join('\n');
  }

  return `${header}
HP: ${c.hp}/${c.maxHp} | Mana: ${c.mp}/${c.maxMp} | Gold: ${state.gold ?? 0}
${progressLine}
Location: ${playerFacingLocation(state)}
Equipped Gear: ${equippedGear}
Inventory: ${invList} (${cap.usedSlots}/${cap.totalSlots} slots used)
Active Companions: ${companions}
Containers: ${containerInfo}
Materials: ${state.materials.map(m => `${m.name} x${m.quantity}`).join(', ') || 'None'}${cap.hasMagicalContainer ? ' (infinite stacking)' : ''}
Status Effects: ${statusList}
Active Main Story: ${mainQuestStr}
Active Side Quests: ${sideQuestStr}
===================================`;
}

export function buildLoreContext(cards: LoreCard[]): string {
  const summaries = cards.map(c => `[${String(c.type ?? 'lore').toUpperCase()}] ${c.name} — ${c.summary}`).join('\n');
  return `=== RELEVANT WORLD LORE & TIMELINE MILESTONES ===\n${summaries}\n===================================================`;
}

function pickLoreCards(state: GameState, activeLoreCards: LoreCard[], currentName: string): LoreCard[] {
  const wanted = new Set<string>();
  for (const r of presentNpcRecords(state)) {
    for (const n of [r.npcName, ...(r.aliases ?? [])]) {
      if (n?.trim()) wanted.add(n.trim().toLowerCase());
    }
  }
  if (currentName.trim()) wanted.add(currentName.trim().toLowerCase());
  for (const q of state.quests ?? []) {
    if (q.status === 'active' && q.name?.trim()) wanted.add(q.name.trim().toLowerCase());
  }
  const fromBook = (state.lorebook ?? []).filter((card) =>
    wanted.has((card.name ?? '').trim().toLowerCase())
  );
  const seen = new Set<string>();
  const picked: LoreCard[] = [];
  for (const card of [...activeLoreCards, ...fromBook]) {
    const key = (card.name ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    picked.push({ ...card, summary: (card.summary ?? '').slice(0, 160) });
    if (picked.length >= 4) break;
  }
  return picked;
}

export function formatWriterInfoLayer(state: GameState, activeLoreCards: LoreCard[] = []): string {
  const currentName = playerFacingLocation(state);

  const here: string[] = [`Here: ${currentName}`];
  // 27g — the place card is the fact authority: plain description and exits, no engine tags.
  const card = placeCardFor(state, currentName);
  if (card?.description) here.push(`What it is: ${card.description}`);
  const things = state.locationSheet?.interactables ?? [];
  if (things.length) {
    here.push(`Things here: ${things.slice(0, 6).map((i) => `${i.name} (${i.state})`).join(', ')}`);
  }
  const sheetExits = (state.locationSheet?.exits ?? []).map((e) => e.label).filter(Boolean);
  const exits = sheetExits.length ? sheetExits : card?.exits ?? [];
  if (exits.length) {
    here.push(`Exits: ${exits.slice(0, 5).join(', ')}`);
  }

  const people = presentNpcRecords(state);
  const unnamed = Array.from(new Set([...listedAnonymousRoles(state), ...storyMinorRoles(state)]));
  const peopleSection = people.length
    ? `People here:\n${formatNpcMemoriesForPrompt(people, 4)}`
    : unnamed.length
      ? `People here: no one named. Unnamed local${unnamed.length > 1 ? 's' : ''} who may be about: ${unnamed.map((r) => `${/^[aeiou]/i.test(r) ? 'an' : 'a'} ${r}`).join(', ')} (may speak; give no name).`
      : '';

  const roomSection = state.activeDungeon
    ? formatHiddenRoomLedger(state.activeDungeon, { factsOnly: true })
    : '';

  const ledgerSection = buildGroundTruthLedger(state, { compact: true });

  const lore = pickLoreCards(state, activeLoreCards, currentName);
  const loreSection = lore.length ? buildLoreContext(lore) : '';

  const timelineSection = state.timeline?.length
    ? `Recent timeline:\n${formatTimelineForPrompt(state.timeline, 6)}`
    : '';

  const build = (withLore: boolean, withTimeline: boolean): string =>
    [
      'WORLD FACTS (this turn):',
      here.join('\n'),
      peopleSection,
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
