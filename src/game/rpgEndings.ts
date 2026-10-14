/**
 * Story RPG endings on the shared ending gates (pyoaEndingGates: isEndingEligible, selectBestEnding,
 * commitEnding). The catalog is built from this save: the main quest the player finished, the companion
 * still with them, and how the named people they dealt with stand (npcMemories disposition, the same
 * source the Standing line reads). Every gate needs a finished main quest. The engine offers the
 * ending; the player chooses when the story ends.
 */
import type { GameState, NpcMemory, Quest } from './types';
import type { BibleId, CrisisId, EndingGateSpec, EndingId, FactId, PredicateGroup } from './pyoaTypes';

export const RPG_ENDING_CHIP = 'End the story here';

export const RPG_ENDING_FACT = {
  mainDone: 'global.rpg.main.completed',
  companion: 'global.rpg.companion',
  standing: 'global.rpg.standing.net',
} as const satisfies Record<string, FactId>;

const ON_YOUR_SIDE: ReadonlySet<NpcMemory['disposition']> = new Set(['friendly', 'allied', 'romanced']);

/** No turn deadline in story RPG: a gate opens as soon as its facts hold. */
const OPEN_WINDOW = { earliest: 0, target: 0, latest: Number.MAX_SAFE_INTEGER } as const;

/** The main quest the player has finished (the latest, when there are several). */
export function finishedMainQuest(state: GameState): Quest | null {
  const done = (state.quests ?? []).filter((q) => q.type === 'main' && q.status === 'completed');
  return done[done.length - 1] ?? null;
}

function companionName(state: GameState): string | null {
  return (state.companions ?? []).find((c) => c.recruited)?.name?.trim() || null;
}

/** People on the player's side minus people turned hostile, over the named people the player has dealt with. */
export function standingNet(state: GameState): number {
  const people = (state.npcMemories ?? []).filter((m) => (m.npcName ?? '').trim());
  return people.filter((m) => ON_YOUR_SIDE.has(m.disposition)).length - people.filter((m) => m.disposition === 'hostile').length;
}

/** The ending facts the shared gates read for a story RPG save (empty for every other mode). */
export function rpgEndingFacts(state: GameState): Record<string, unknown> {
  if (state.engineMode !== 'rpg') return {};
  const facts: Record<string, unknown> = { [RPG_ENDING_FACT.standing]: standingNet(state) };
  if (finishedMainQuest(state)) facts[RPG_ENDING_FACT.mainDone] = true;
  const companion = companionName(state);
  if (companion) facts[RPG_ENDING_FACT.companion] = companion;
  return facts;
}

/** This save's story RPG ending gates (none until a main quest is finished). */
export function rpgEndingGates(state: GameState): EndingGateSpec[] {
  if (state.engineMode !== 'rpg') return [];
  const quest = finishedMainQuest(state);
  if (!quest) return [];
  const bible = (state.campaignBibleId || 'story-rpg') as BibleId;
  const done = { factId: RPG_ENDING_FACT.mainDone, op: 'exists' } as const;
  const gate = (
    key: string,
    name: string,
    cls: EndingGateSpec['class'],
    priority: number,
    prerequisites: PredicateGroup,
    terminalText: string,
  ): EndingGateSpec => ({
    schemaVersion: 1,
    id: `${bible}:ending:${key}` as EndingId,
    bibleId: bible,
    name,
    class: cls,
    priority,
    window: OPEN_WINDOW,
    prerequisites,
    triggerCrisisId: `${bible}:crisis:main-quest` as CrisisId,
    terminalWrites: [{ factId: `global.rpg.ending.${key}`, value: true, visibility: 'known', journalText: terminalText }],
    terminalText,
    journalTeaser: name,
  });
  const companion = companionName(state);
  return [
    ...(companion
      ? [gate('with-company', 'With Company', 'triumph', 120, { all: [done, { factId: RPG_ENDING_FACT.companion, op: 'exists' }] },
        `You saw ${quest.name} through, and ${companion} was still with you at the end.`)]
      : []),
    gate('well-regarded', 'Well Regarded', 'triumph', 100, { all: [done, { factId: RPG_ENDING_FACT.standing, op: 'gte', value: 1 }] },
      `You saw ${quest.name} through, with more people on your side than against you.`),
    gate('hard-won', 'Hard Won', 'costly-victory', 90, { all: [done, { factId: RPG_ENDING_FACT.standing, op: 'lte', value: -1 }] },
      `You saw ${quest.name} through, and left more enemies than friends behind you.`),
    gate('job-done', 'The Job Done', 'triumph', 80, { all: [done] }, `You saw ${quest.name} through.`),
  ];
}
