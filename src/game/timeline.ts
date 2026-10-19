import type { GameEvent } from './parser';
import type { GameState, TimelineFact, TimelineFactKind } from './types';
export { formatTimelineForPrompt } from './timelineFormat';

const MAX_TIMELINE_FACTS = 40;
const WS = /\s+/g;

function uid(): string { return crypto.randomUUID(); }

function pushFact(facts: TimelineFact[], turn: number, kind: TimelineFactKind, text: string): void {
  const cleaned = text.replace(WS, ' ').trim();
  if (!cleaned) return;
  for (let i = 0; i < facts.length; i++) {
    if (facts[i]!.turn === turn && facts[i]!.text === cleaned) return;
  }
  facts.push({ id: uid(), turn, kind, text: cleaned, at: Date.now() });
}

/** fight2d — one `person: <name> - <detail>` tag at source; no duplicate in the same HERE. */
export function recordPersonSeen(state: GameState, name: string, detail: string): GameState {
  const who = (name ?? '').replace(WS, ' ').trim();
  const note = (detail ?? '').replace(WS, ' ').trim();
  if (!who || !note) return state;
  const place = (state.currentLocation ?? '').replace(WS, ' ').trim();
  const turn = state.turn ?? 0;
  const text = `person: ${who} - ${note}`;
  const timeline = [...(state.timeline ?? [])];
  const whoKey = who.toLowerCase();
  const hereKey = place.toLowerCase();
  for (let i = 0; i < timeline.length; i++) {
    const f = timeline[i]!;
    if (f.kind === 'person' && (f.name ?? '').toLowerCase() === whoKey && (f.place ?? '').replace(WS, ' ').trim().toLowerCase() === hereKey) return state;
  }
  timeline.push({ id: uid(), turn, kind: 'person', text, name: who, detail: note, ...(place ? { place } : {}), at: Date.now() });
  return { ...state, timeline: timeline.length <= MAX_TIMELINE_FACTS ? timeline : timeline.slice(timeline.length - MAX_TIMELINE_FACTS) };
}

/** Factual timeline entries from this turn's structured outcomes (not story prose). */
export function collectTurnTimelineFacts(params: {
  turn: number;
  playerAction: string;
  stateBefore: GameState;
  stateAfter: Pick<GameState, 'currentLocation' | 'activeEncounter' | 'activeDungeon' | 'character' | 'quests'>;
  events: GameEvent[];
  systemLog: string[];
  newItemNames: string[];
  wardenNotes?: string[];
  sceneBeat?: string;
}): TimelineFact[] {
  const { turn, playerAction, stateBefore, stateAfter, events, systemLog, newItemNames, wardenNotes = [], sceneBeat } = params;
  const facts: TimelineFact[] = [];
  const actionSnippet = playerAction.replace(WS, ' ').trim().slice(0, 100);
  if (actionSnippet) pushFact(facts, turn, 'other', `Player attempted: ${actionSnippet}`);
  if (stateAfter.currentLocation && stateAfter.currentLocation !== stateBefore.currentLocation) {
    pushFact(facts, turn, 'location', `Location: ${stateAfter.currentLocation}`);
  }
  for (const e of events) {
    if (e.type === 'enemy-appear' && e.enemyName) {
      pushFact(facts, turn, 'combat', `Encounter started: ${e.enemyName} (HP ${e.enemyHp ?? '?'}/${e.enemyMaxHp ?? e.enemyHp ?? '?'})`);
    }
    if (e.type === 'encounter-end') pushFact(facts, turn, 'combat', `Encounter ended: ${stateBefore.activeEncounter?.name ?? 'enemy'}`);
    if (e.type === 'damage' && e.amount) pushFact(facts, turn, 'damage', `Player took ${e.amount} damage`);
    if (e.type === 'heal' && e.amount) pushFact(facts, turn, 'heal', `Player healed ${e.amount} HP`);
    if (e.type === 'quest-add' && e.name) pushFact(facts, turn, 'quest', `Quest started: ${e.name}`);
    if (e.type === 'quest-complete' && e.id) {
      let qName = e.id;
      for (let i = 0; i < stateBefore.quests.length; i++) {
        if (stateBefore.quests[i]!.id === e.id) { qName = stateBefore.quests[i]!.name ?? e.id; break; }
      }
      pushFact(facts, turn, 'quest', `Quest completed: ${qName}`);
    }
    if (e.type === 'dungeon-load' && e.dungeonName) pushFact(facts, turn, 'dungeon', `Entered dungeon: ${e.dungeonName}`);
    if (e.type === 'dungeon-exit') pushFact(facts, turn, 'dungeon', 'Exited dungeon');
    if (e.type === 'dungeon-move' && e.nodeId) pushFact(facts, turn, 'dungeon', `Moved to dungeon node: ${e.nodeId}`);
    if (e.type === 'lore-card' && e.name) pushFact(facts, turn, 'discovery', `Lore noted: ${e.name}`);
    if (e.type === 'world-deal' && e.name) pushFact(facts, turn, 'world', `Deal sealed: ${e.name}`);
    if (e.type === 'world-holding' && e.name) pushFact(facts, turn, 'world', `Holding claimed: ${e.name}`);
    if (e.type === 'world-order' && (e.name || e.order)) pushFact(facts, turn, 'world', `Standing order: ${e.name ?? 'holding'} → ${e.order ?? 'profit'}`);
    if (e.type === 'world-clock' && e.name) pushFact(facts, turn, 'world', `Rival clock: ${e.name}`);
    if (e.type === 'world-actor' && e.name) pushFact(facts, turn, 'world', `Off-screen actor: ${e.name}`);
    if (e.type === 'time-pass' && e.amount) pushFact(facts, turn, 'world', `Time passed: ${e.amount} day${e.amount === 1 ? '' : 's'}`);
  }
  for (const name of newItemNames) pushFact(facts, turn, 'item', `Gained item: ${name}`);
  for (const line of systemLog) {
    if (/xp\s+gained|gained\s+\d+\s*xp/i.test(line)) {
      const n = line.match(/(\d+)/)?.[1];
      pushFact(facts, turn, 'other', n ? `XP gained: ${n}` : 'XP gained');
    }
  }
  for (const note of wardenNotes) pushFact(facts, turn, 'other', `Warden: ${note}`);
  if (sceneBeat) pushFact(facts, turn, 'scene', sceneBeat);
  return facts;
}

export function mergeTimeline(existing: TimelineFact[] | undefined, incoming: TimelineFact[]): TimelineFact[] {
  const merged = [...(existing ?? []), ...incoming];
  if (merged.length <= MAX_TIMELINE_FACTS) return merged;
  return merged.slice(merged.length - MAX_TIMELINE_FACTS);
}
