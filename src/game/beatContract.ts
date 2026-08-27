/**
 * BeatContract registry — authoritative pre-GM beat definitions per flagship bible.
 * Wave 1 vertical slice: 3–5 contracts per mode flagship.
 */

import type { EngineMode, GameState } from './types';

export type BeatKind =
  | 'quest_stage'
  | 'encounter'
  | 'crisis'
  | 'check'
  | 'leverage'
  | 'branch'
  | 'pressure';

export interface BeatContract {
  id: string;
  biblePrefix: string;
  kind: BeatKind;
  /** Minimum turn before this beat may fire. */
  minTurn: number;
  /** Once committed, never repeat. */
  once: boolean;
  summary: string;
  mandate: string;
  /** Quest objective index to complete (0-based) when kind=quest_stage. */
  questObjectiveIndex?: number;
  questId?: string;
  xpChunk?: number;
  spawnEncounter?: boolean;
}

const CONTRACTS: BeatContract[] = [
  // Summoned Pact — LitRPG
  {
    id: 'sp-beat-orient',
    biblePrefix: 'summoned-pact',
    kind: 'quest_stage',
    minTurn: 2,
    once: true,
    summary: 'Circle\'s Price: bearings established',
    mandate: 'ARC BEAT (orient): Player has their bearings. Advance Circle\'s Price stage — name the ruin/room, one exit, one panel cue. Do not re-ask for name if locked.',
    questId: 'sp-quest-1',
    questObjectiveIndex: 0,
    xpChunk: 0,
  },
  {
    id: 'sp-beat-hear-reason',
    biblePrefix: 'summoned-pact',
    kind: 'quest_stage',
    minTurn: 4,
    once: true,
    summary: 'Circle\'s Price: reason heard (stage 2)',
    mandate: 'ARC BEAT (hear-reason): Someone names why Pellane/the Circle wanted you. Complete stage-2 receipt — faction tilt or System ping. No inspect stall.',
    questId: 'sp-quest-1',
    questObjectiveIndex: 1,
    xpChunk: 45,
  },
  {
    id: 'sp-beat-hub-pressure',
    biblePrefix: 'summoned-pact',
    kind: 'pressure',
    minTurn: 6,
    once: true,
    summary: 'Hub pressure: gate or registrar deadline',
    mandate: 'ARC BEAT (hub-pressure): A registrar, guild guard, or gate queue moves — cost, deadline, or forced choice. Not atmosphere only.',
    xpChunk: 0,
  },
  {
    id: 'sp-beat-skirmish',
    biblePrefix: 'summoned-pact',
    kind: 'encounter',
    minTurn: 8,
    once: true,
    summary: 'Hub skirmish committed',
    mandate: 'ARC BEAT (skirmish): Combat round is LIVE in ledger. Narrate the fight beat — bandits, pact-hunter, or void critter. Offer fight/flee/negotiate.',
    spawnEncounter: true,
    xpChunk: 20,
  },
  // Cursed Keep — DnD
  {
    id: 'ck-beat-objective',
    biblePrefix: 'cursed-keep',
    kind: 'quest_stage',
    minTurn: 2,
    once: true,
    summary: 'Keep objective seeded',
    mandate: 'ARC BEAT (keep-objective): Name the keep curse hook and one NPC with a clue. Dry wit optional; dice stakes next.',
    questId: 'ck-quest-1',
    questObjectiveIndex: 0,
  },
  {
    id: 'ck-beat-check',
    biblePrefix: 'cursed-keep',
    kind: 'check',
    minTurn: 5,
    once: true,
    summary: 'Seeded check committed',
    mandate: 'ARC BEAT (check): One visible d20 check with consequence — perception, insight, or stealth at the keep.',
    xpChunk: 15,
  },
  {
    id: 'ck-beat-hostility',
    biblePrefix: 'cursed-keep',
    kind: 'encounter',
    minTurn: 12,
    once: true,
    summary: 'Keep hostility terminal',
    mandate: 'ARC BEAT (hostility): Combat or hazard resolves with clue change. No passive vigil.',
    spawnEncounter: true,
    xpChunk: 25,
  },
  // Cape District Vigil — Story RPG
  {
    id: 'rpg-beat-demand',
    biblePrefix: 'cape-district-vigil',
    kind: 'quest_stage',
    minTurn: 3,
    once: true,
    summary: 'Vigil demand issued',
    mandate: 'ARC BEAT (demand): A named NPC makes an irreversible ask — exposure, bribe, or witness. Leverage delta required.',
    questObjectiveIndex: 0,
    xpChunk: 20,
  },
  {
    id: 'rpg-beat-leverage',
    biblePrefix: 'cape-district-vigil',
    kind: 'leverage',
    minTurn: 6,
    once: true,
    summary: 'Leverage delta committed',
    mandate: 'ARC BEAT (leverage): Relationship or secret shifts — not stranger mush. One boundary crossed or held.',
    xpChunk: 30,
  },
  {
    id: 'rpg-beat-consequence',
    biblePrefix: 'cape-district-vigil',
    kind: 'quest_stage',
    minTurn: 10,
    once: true,
    summary: 'Irreversible consequence',
    mandate: 'ARC BEAT (consequence): A vigil choice locks — ally, enemy, or scandal. Walk-away pads exhausted.',
    questObjectiveIndex: 1,
    xpChunk: 40,
  },
  // Thornferry Road — PYOA
  {
    id: 'pyoa-beat-crisis',
    biblePrefix: 'thornferry-road',
    kind: 'crisis',
    minTurn: 4,
    once: true,
    summary: 'Crisis fork opened',
    mandate: 'ARC BEAT (crisis): Time pressure — flood, debt, or charter dispute. Two forks with different costs.',
    xpChunk: 15,
  },
  {
    id: 'pyoa-beat-branch',
    biblePrefix: 'thornferry-road',
    kind: 'branch',
    minTurn: 8,
    once: true,
    summary: 'Branch lock committed',
    mandate: 'ARC BEAT (branch): Player path locks in ledger — ally/betray/solo. Millstone Charter cannot be the whole turn.',
    xpChunk: 25,
  },
  {
    id: 'pyoa-beat-ending',
    biblePrefix: 'thornferry-road',
    kind: 'crisis',
    minTurn: 20,
    once: true,
    summary: 'Crisis closure or ending beat',
    mandate: 'ARC BEAT (closure): Route toward an ending receipt or closed crisis — not infinite charter inspect.',
    xpChunk: 35,
  },
];

export function resolveBiblePrefix(state: GameState): string {
  const id = (state.campaignBibleId ?? '').toLowerCase();
  if (id.includes('summoned') || id === 'summoned-pact') return 'summoned-pact';
  if (id.includes('cursed') || id.includes('keep')) return 'cursed-keep';
  if (id.includes('cape') || id.includes('vigil') || id.includes('salt-road')) return 'cape-district-vigil';
  if (id.includes('thornferry') || id.includes('pyoa')) return 'thornferry-road';
  // Engine-mode fallback when bible unset
  const mode = state.engineMode;
  if (mode === 'litrpg') return 'summoned-pact';
  if (mode === 'dnd') return 'cursed-keep';
  if (mode === 'rpg') return 'cape-district-vigil';
  if (mode === 'pyoa') return 'thornferry-road';
  return '';
}

export function contractsForState(state: GameState): BeatContract[] {
  const prefix = resolveBiblePrefix(state);
  if (!prefix) return [];
  return CONTRACTS.filter((c) => c.biblePrefix === prefix);
}

export function contractById(id: string): BeatContract | undefined {
  return CONTRACTS.find((c) => c.id === id);
}

/** Pick the next due contract not yet committed. */
export function selectDueBeat(state: GameState, committed: Set<string>): BeatContract | null {
  const turn = state.turn;
  const openingDone = state.openingEstablishment?.complete === true;
  if (!openingDone && turn < 3) return null;

  for (const c of contractsForState(state)) {
    if (c.once && committed.has(c.id)) continue;
    if (turn < c.minTurn) continue;
    return c;
  }
  return null;
}

/** Force encounter beat when combat drought exceeds threshold. */
export function forcedEncounterBeat(
  state: GameState,
  turnsSinceCombat: number,
  committed?: Set<string>
): BeatContract | null {
  const mode = state.engineMode;
  if (mode !== 'litrpg' && mode !== 'dnd') return null;
  if (state.activeEncounter) return null;
  if (turnsSinceCombat < 15) return null;
  const prefix = resolveBiblePrefix(state);
  const skirmishId = prefix === 'summoned-pact' ? 'sp-beat-skirmish' : prefix === 'cursed-keep' ? 'ck-beat-hostility' : null;
  if (!skirmishId) return null;
  if (committed?.has(skirmishId)) {
    // Repeat pressure — synthetic encounter mandate without re-committing once beat
    return {
      id: `${skirmishId}-repeat`,
      biblePrefix: prefix,
      kind: 'encounter',
      minTurn: 15,
      once: false,
      summary: 'Combat drought pressure encounter',
      mandate: 'ARC BEAT (combat drought): A second hub threat forces a fight or costly escape — combat round required.',
      spawnEncounter: true,
      xpChunk: 15,
    };
  }
  return contractById(skirmishId) ?? null;
}

export function engineAllowsCombat(state: GameState): boolean {
  return state.engineMode === 'litrpg' || state.engineMode === 'dnd';
}
