/**
 * BeatContract registry — authoritative pre-GM beat definitions per flagship bible.
 * Wave 1 vertical slice: 3–5 contracts per flagship.
 * 02z — sealed HERE/CAST/VERB/CLOSED/TONE card is the writer leaf; code stays trunk.
 */

import type { GameState } from './types';
import { formatPyoaSpineTurnJob } from './pyoaSpine';
import { canHarvestAsNamedPerson, isRegisteredLocation } from './entityRegistry';
import { isPlannerUiPersonToken, realPresentPeople } from './chromeAuthority';
import { isNeverCastTitle } from './neverCast';
import { playerFacingLocation } from './locationName';
import {
  hereLocation,
  locationChangedRecently,
  openingPinNames,
  priorLocation,
  placesDiffer,
  selectRecentLogForContext,
} from './sceneContextTail';
import { isPyoaCharterClosed, isPyoaItemDestroyed } from './pyoaBranchLedger';
import { hubsForBibleId } from './outdoorHubs';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';

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
  /** 02ac registry — optional versioned template fields. */
  version?: string;
  proseHints?: string[];
  wordCountTarget?: number;
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
  if (id.includes('summoned') || id === 'summoned-pact' || id.includes('hero-awakening')) {
    return 'summoned-pact';
  }
  // Shattered Coast is DnD but must NOT inherit Keep Wraith contracts as identity —
  // still use cursed-keep beat ids for liveness; drought table is bible-aware separately.
  if (id.includes('cursed') || id.includes('keep') || id.includes('shattered') || id.includes('coast')) {
    return 'cursed-keep';
  }
  if (id.includes('cape') || id.includes('vigil') || id.includes('salt-road')) return 'cape-district-vigil';
  if (
    id.includes('thornferry') ||
    id.includes('vesper') ||
    id.includes('pyoa') ||
    id.includes('cipher') ||
    id.includes('nocturne') ||
    id.includes('giltwood')
  ) {
    return 'thornferry-road';
  }
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

/**
 * One-line TURN JOB for SNAPSHOT — clear Fate job without mandate spam (Batch G).
 */
export function resolveTurnJob(state: GameState, playerInput?: string): string {
  if (state.activeEncounter && (state.activeEncounter.phase == null || state.activeEncounter.phase === 'engaged' || state.activeEncounter.phase === 'resolving')) {
    return `Combat vs ${state.activeEncounter.name}: fight, flee, or parley — no loot AFK.`;
  }
  const spineJob = formatPyoaSpineTurnJob(state);
  if (spineJob?.trim()) return spineJob;
  const input = (playerInput ?? '').toLowerCase();
  if (/\b(travel|go to|head to|leave|exit)\b/.test(input)) {
    return 'Arrival/travel: land the move — new room pressure or honest blocked path.';
  }
  if (/\b(ask|talk|speak|parley|tell)\b/.test(input)) {
    return 'Talk: answer or refuse with a cost — no lecture stall.';
  }
  if (/\b(open|check|search)\b/.test(input) && /\b(crate|chest|box|barrel)\b/.test(input)) {
    return 'Container: one open — loot once or honest empty; then move on.';
  }
  if (/\b(attack|fight|strike|engage)\b/.test(input)) {
    return 'Combat beat: steel or consequence this turn.';
  }
  const ad = state.arcDirector;
  if (ad?.activeBeatId) {
    const c = contractById(ad.activeBeatId.replace(/-repeat$/, ''));
    if (c?.summary) return `Progress: ${c.summary}.`;
  }
  const empty = state.sceneFacts?.emptyContainers ?? [];
  if (empty.length) {
    return `Honest exhaust: ${empty[0]} is empty — exit, talk, or take a stake.`;
  }
  if (state.openingEstablishment && !state.openingEstablishment.complete) {
    return 'Opening: establish HERE from the card — one concrete, no director chrome.';
  }
  return 'Advance one concrete: arrival, talk, threat, or honest empty.';
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

/** 02z — player verb on the sealed card (ledger classify, not writer). */
export type SealedBeatVerb = 'leave' | 'travel' | 'talk' | 'inspect' | 'fight' | 'wait' | 'use';

export interface SealedBeatCard {
  here: string;
  cast: string[];
  verb: SealedBeatVerb;
  closed: string[];
  tone: string;
  exits?: string;
}

/** Last 2 camera-filtered beats for rhythm. selectRecentLogForContext still drops pre-travel. */
export const WRITER_RHYTHM_WINDOW = 2;
export const WRITER_RHYTHM_CHAR_CAP = 500;

export function classifySealedVerb(input: string | undefined): SealedBeatVerb {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return 'wait';
  if (/\b(use|drink|eat|equip|wield|draw|deploy)\b/i.test(t)) return 'use';
  if (/\b(attack|fight|strike|engage|press the attack|flee|parley)\b/i.test(t)) return 'fight';
  if (/\b(travel(?:\s+(?:toward|to|into))?|go to|head (?:to|for|toward)|return to|enter)\b/i.test(t)) {
    return 'travel';
  }
  if (/\b(leave|exit|walk away|go another direction)\b/i.test(t)) return 'leave';
  if (/\b(ask|talk|speak|tell|say|press for|listen)\b/i.test(t)) return 'talk';
  if (/\b(inspect|examine|look around|search|scout|check|study|watch)\b/i.test(t)) return 'inspect';
  if (/\b(wait|rest|stay|hold)\b/i.test(t)) return 'wait';
  return 'wait';
}

function lastPlayerAction(state: GameState, playerInput?: string): string {
  const typed = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  if (typed) return typed;
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]?.role === 'player' && log[i]?.content?.trim()) return String(log[i].content).trim();
  }
  return '';
}

function openingPinsLockedOut(state: GameState): boolean {
  if (!locationChangedRecently(state)) return false;
  const here = hereLocation(state);
  const openingWhere = (state.openingEstablishment?.answers?.where ?? '').trim();
  if (openingWhere && placesDiffer(here, openingWhere)) return true;
  const prev = priorLocation(state);
  return !!prev && placesDiffer(here, prev);
}

/** Named people actually HERE — harvest rules, not last-GM Title-Case. */
export function sealedCastNames(state: GameState): string[] {
  const bibleId = state.campaignBibleId ?? state.bibleId;
  const pinsOut = openingPinsLockedOut(state);
  const pinSet = new Set(openingPinNames(state).map((n) => n.toLowerCase()));
  const out: string[] = [];
  const seen = new Set<string>();

  const consider = (raw: string | undefined) => {
    const name = (raw ?? '').trim();
    if (!name || seen.has(name.toLowerCase())) return;
    if (isPlannerUiPersonToken(name)) return;
    if (isNeverCastTitle(name, state)) return;
    if (pinsOut && (pinSet.has(name.toLowerCase()) || /^(handler|priests?)$/i.test(name))) return;
    if (!canHarvestAsNamedPerson(name, bibleId)) return;
    seen.add(name.toLowerCase());
    out.push(name);
  };

  for (const p of realPresentPeople(state.sceneFacts?.present ?? [])) consider(p);
  if (state.companion) consider(state.companion);
  for (const c of state.companions ?? []) consider(c.name);
  return out;
}

export function sealedClosedFacts(state: GameState): string[] {
  const closed: string[] = [];
  const kill = state.sceneFacts?.lastKill;
  if (kill?.name && kill.outcome === 'victory' && !state.activeEncounter) {
    closed.push(`lastKill=${kill.name}`);
  }
  if (isPyoaCharterClosed(state) || isPyoaItemDestroyed(state, 'charter')) {
    closed.push('charter=destroyed');
  }
  for (const id of state.pyoaBranchLedger?.destroyedItems ?? []) {
    const n = String(id ?? '').trim();
    if (n && !closed.some((c) => c.toLowerCase().includes(n.toLowerCase()))) {
      closed.push(`destroyed=${n}`);
    }
  }
  return closed;
}

export function legalTravelDestinations(state: GameState): string[] {
  const here = hereLocation(state).toLowerCase();
  const dests: string[] = [];
  for (const hub of hubsForBibleId(state.campaignBibleId ?? state.bibleId)) {
    if (hub.name && hub.name.toLowerCase() !== here) dests.push(hub.name);
  }
  for (const ex of state.locationSheet?.exits ?? []) {
    const label = (ex.label ?? '').trim();
    if (label && label.toLowerCase() !== here && !dests.some((d) => d.toLowerCase() === label.toLowerCase())) {
      dests.push(label);
    }
  }
  return dests.slice(0, 6);
}

export function isLegalTravelDestination(state: GameState, name: string): boolean {
  const want = (name ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!want) return false;
  return legalTravelDestinations(state).some((d) => {
    const n = d.toLowerCase();
    return n === want || n.includes(want) || want.includes(n);
  });
}

function sealedTone(state: GameState, verb: SealedBeatVerb): string {
  const mode = state.engineMode;
  if (verb === 'fight') return 'steel';
  if (verb === 'leave' || verb === 'travel') return 'road';
  if (verb === 'inspect') return 'close';
  if (verb === 'wait') return 'still';
  if (verb === 'use') return 'tool';
  if (verb === 'talk') return mode === 'rpg' ? 'lean' : 'dry';
  if (mode === 'pyoa') return 'fork';
  if (mode === 'dnd') return 'table';
  if (mode === 'litrpg') return 'grit';
  return 'even';
}

export function buildSealedBeatCard(state: GameState, playerInput?: string): SealedBeatCard {
  const action = lastPlayerAction(state, playerInput);
  const verb = classifySealedVerb(action);
  const here = (playerFacingLocation(state) || hereLocation(state) || 'this room').replace(/\.$/, '');
  const card: SealedBeatCard = {
    here,
    cast: sealedCastNames(state),
    verb,
    closed: sealedClosedFacts(state),
    tone: sealedTone(state, verb),
  };
  if (verb === 'travel' || verb === 'leave') {
    const exits = legalTravelDestinations(state);
    if (exits.length) card.exits = exits.slice(0, 3).join(', ');
  }
  return card;
}

export function formatSealedBeatCard(card: SealedBeatCard): string {
  const lines = [
    `HERE: ${card.here || 'this room'}`,
    `CAST: ${card.cast.length ? card.cast.join(', ') : 'none'}`,
    `VERB: ${card.verb}`,
    `CLOSED: ${card.closed.length ? card.closed.join('; ') : 'none'}`,
    `TONE: ${card.tone}`,
  ];
  if (card.exits) lines.push(`EXITS: ${card.exits}`);
  return lines.join('\n');
}

/**
 * Live writer leaf (08a). Completed-event packet + last 2 GM beats + allowlist.
 * No SNAPSHOT essay, kit dump, CRAFT, or AUTHORITY rails.
 */
export function formatWriterFacingPacket(state: GameState, playerInput?: string): string {
  const packet = state.completedEvent ?? buildCompletedEventPacket(state, playerInput);
  return formatWriterFacingEvent(packet);
}

const TITLE_NAME =
  /\b((?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?\s+){0,2}[A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/g;

const NAME_ACTOR =
  /\b(?:waits?|stands?|looks? up|nods?|asks?|says?|greets?|watches?|steps?|holds?|answers?|replies?)\b/i;

function pcName(state: GameState): string {
  return (state.character?.name ?? '').trim().toLowerCase();
}

/** Harvestable named person in prose who is not on the sealed CAST. */
export function inventedCastNamesInProse(state: GameState, prose: string): string[] {
  const body = (prose ?? '').trim();
  if (!body) return [];
  const bibleId = state.campaignBibleId ?? state.bibleId;
  const cast = new Set(sealedCastNames(state).map((n) => n.toLowerCase()));
  const self = pcName(state);
  const found: string[] = [];
  const seen = new Set<string>();
  const re = new RegExp(TITLE_NAME.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const name = (m[1] ?? '').trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    if (self && name.toLowerCase() === self) continue;
    if (isPlannerUiPersonToken(name)) continue;
    if (isRegisteredLocation(name, bibleId)) continue;
    if (!canHarvestAsNamedPerson(name, bibleId)) continue;
    if (cast.has(name.toLowerCase())) continue;
    const after = body.slice(m.index + name.length, m.index + name.length + 40);
    const before = body.slice(Math.max(0, m.index - 12), m.index);
    const acts =
      NAME_ACTOR.test(after)
      || /\b(?:the|and|,)\s+$/i.test(before) && NAME_ACTOR.test(body.slice(m.index, m.index + name.length + 24));
    if (!acts) continue;
    seen.add(name.toLowerCase());
    found.push(name);
  }
  return found;
}

export function isInventedCastViolation(state: GameState, prose: string): boolean {
  return inventedCastNamesInProse(state, prose).length > 0;
}

const HERE_CLAIM =
  /\b(?:you (?:are|stand|wait|remain) (?:in|at|inside)|here in|back (?:in|at)|still (?:in|at))\s+(?:the\s+)?([^.,!?]{2,48})/i;

export function isWrongHereViolation(
  state: GameState,
  prose: string,
  playerInput?: string
): boolean {
  const body = (prose ?? '').trim();
  if (!body) return false;
  const verb = classifySealedVerb(playerInput ?? lastPlayerAction(state));
  const here = hereLocation(state);
  const bibleId = state.campaignBibleId ?? state.bibleId;
  const claimed = body.match(HERE_CLAIM)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
  if (!claimed) return false;
  const claimCore = claimed.replace(/^(the|a|an)\s+/i, '').trim();
  if (!claimCore || claimCore.length < 4) return false;
  if (here && !placesDiffer(here, claimCore) && !placesDiffer(here, claimed)) return false;
  if (here && claimed.toLowerCase().includes(here.toLowerCase())) return false;
  const travelOk = verb === 'travel' || verb === 'leave';
  if (travelOk && isLegalTravelDestination(state, claimCore)) return false;
  if (isRegisteredLocation(claimCore, bibleId) || isRegisteredLocation(claimed, bibleId)) return true;
  const prev = priorLocation(state);
  if (prev && !placesDiffer(prev, claimCore) && placesDiffer(here, prev)) return true;
  return false;
}

/** Leaf contradicts the sealed card — illegal move, not a style note. */
export function isSealedCardViolation(
  state: GameState,
  prose: string,
  playerInput?: string
): boolean {
  const body = (prose ?? '').trim();
  if (!body) return false;
  if (isInventedCastViolation(state, body)) return true;
  if (isWrongHereViolation(state, body, playerInput)) return true;
  return false;
}
