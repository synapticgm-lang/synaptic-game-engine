import type { GameEvent } from './parser';
import type { GameState, TimelineFact, TimelineFactKind } from './types';
export { formatTimelineForPrompt } from './timelineFormat';

const MAX_TIMELINE_FACTS = 40;

function uid(): string {
  return crypto.randomUUID();
}

function pushFact(
  facts: TimelineFact[],
  turn: number,
  kind: TimelineFactKind,
  text: string
): void {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return;
  // Dedupe identical fact on same turn
  if (facts.some((f) => f.turn === turn && f.text === cleaned)) return;
  facts.push({ id: uid(), turn, kind, text: cleaned, at: Date.now() });
}

/**
 * Build factual timeline entries from this turn's structured outcomes.
 * These are hard facts for the AI — not story prose.
 */
export function collectTurnTimelineFacts(params: {
  turn: number;
  playerAction: string;
  stateBefore: GameState;
  stateAfter: Pick<
    GameState,
    'currentLocation' | 'activeEncounter' | 'activeDungeon' | 'character' | 'quests'
  >;
  events: GameEvent[];
  systemLog: string[];
  newItemNames: string[];
  wardenNotes?: string[];
}): TimelineFact[] {
  const {
    turn,
    playerAction,
    stateBefore,
    stateAfter,
    events,
    systemLog,
    newItemNames,
    wardenNotes = [],
  } = params;
  const facts: TimelineFact[] = [];

  const actionSnippet = playerAction.replace(/\s+/g, ' ').trim().slice(0, 100);
  if (actionSnippet) {
    pushFact(facts, turn, 'other', `Player attempted: ${actionSnippet}`);
  }

  if (
    stateAfter.currentLocation &&
    stateAfter.currentLocation !== stateBefore.currentLocation
  ) {
    pushFact(facts, turn, 'location', `Location: ${stateAfter.currentLocation}`);
  }

  for (const e of events) {
    if (e.type === 'enemy-appear' && e.enemyName) {
      pushFact(
        facts,
        turn,
        'combat',
        `Encounter started: ${e.enemyName} (HP ${e.enemyHp ?? '?'}/${e.enemyMaxHp ?? e.enemyHp ?? '?'})`
      );
    }
    if (e.type === 'encounter-end') {
      const name = stateBefore.activeEncounter?.name ?? 'enemy';
      pushFact(facts, turn, 'combat', `Encounter ended: ${name}`);
    }
    if (e.type === 'damage' && e.amount) {
      pushFact(facts, turn, 'damage', `Player took ${e.amount} damage`);
    }
    if (e.type === 'heal' && e.amount) {
      pushFact(facts, turn, 'heal', `Player healed ${e.amount} HP`);
    }
    if (e.type === 'quest-add' && e.name) {
      pushFact(facts, turn, 'quest', `Quest started: ${e.name}`);
    }
    if (e.type === 'quest-complete' && e.id) {
      const q = stateBefore.quests.find((x) => x.id === e.id);
      pushFact(facts, turn, 'quest', `Quest completed: ${q?.name ?? e.id}`);
    }
    if (e.type === 'dungeon-load' && e.dungeonName) {
      pushFact(facts, turn, 'dungeon', `Entered dungeon: ${e.dungeonName}`);
    }
    if (e.type === 'dungeon-exit') {
      pushFact(facts, turn, 'dungeon', 'Exited dungeon');
    }
    if (e.type === 'dungeon-move' && e.nodeId) {
      pushFact(facts, turn, 'dungeon', `Moved to dungeon node: ${e.nodeId}`);
    }
    if (e.type === 'lore-card' && e.name) {
      pushFact(facts, turn, 'discovery', `Lore noted: ${e.name}`);
    }
    if (e.type === 'world-deal' && e.name) {
      pushFact(facts, turn, 'world', `Deal sealed: ${e.name}`);
    }
    if (e.type === 'world-holding' && e.name) {
      pushFact(facts, turn, 'world', `Holding claimed: ${e.name}`);
    }
    if (e.type === 'world-order' && (e.name || e.order)) {
      pushFact(facts, turn, 'world', `Standing order: ${e.name ?? 'holding'} → ${e.order ?? 'profit'}`);
    }
    if (e.type === 'world-clock' && e.name) {
      pushFact(facts, turn, 'world', `Rival clock: ${e.name}`);
    }
    if (e.type === 'world-actor' && e.name) {
      pushFact(facts, turn, 'world', `Off-screen actor: ${e.name}`);
    }
    if (e.type === 'time-pass' && e.amount) {
      pushFact(facts, turn, 'world', `Time passed: ${e.amount} day${e.amount === 1 ? '' : 's'}`);
    }
  }

  for (const name of newItemNames) {
    pushFact(facts, turn, 'item', `Gained item: ${name}`);
  }

  for (const line of systemLog) {
    if (/xp\s+gained|gained\s+\d+\s*xp/i.test(line)) {
      const n = line.match(/(\d+)/)?.[1];
      pushFact(facts, turn, 'other', n ? `XP gained: ${n}` : 'XP gained');
    }
  }

  for (const note of wardenNotes) {
    pushFact(facts, turn, 'other', `Warden: ${note}`);
  }

  return facts;
}

export function mergeTimeline(
  existing: TimelineFact[] | undefined,
  incoming: TimelineFact[]
): TimelineFact[] {
  const merged = [...(existing ?? []), ...incoming];
  if (merged.length <= MAX_TIMELINE_FACTS) return merged;
  return merged.slice(merged.length - MAX_TIMELINE_FACTS);
}
