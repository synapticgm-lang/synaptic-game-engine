/**
 * T10DIR — sole owner of "what happens next" (story progression).
 * Pure / deterministic: seeded by turn + save seed. No AI, Date.now, or Math.random.
 *
 * SRD 5.2.1 (Basic Rules / Playing the Game — The Order of Combat / Actions):
 * "On your turn, you can move a distance up to your speed and take one action."
 * Free text is never rejected; only the engine rolls dice. Director injects engine facts
 * and chip specs — never rolls and never invents combat outcomes.
 */

import type {
  DirectorChipSpec,
  DirectorDevelopment,
  DirectorNeed,
  DirectorPlan,
  GameState,
  NpcMemory,
  OpenThread,
  PlaceEngineEvent,
  Quest,
  SceneThreadPlan,
  TimelineFact,
} from './types';
import { chipAddressee, mentionsName, peopleHere } from './chipLegality';
import { isCrowdFillerToken } from './chromeAuthority';
import { STALL_N } from './directorConstants';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { applyPlaceEngineEvent, bindPlanDirector, collectOpenThreads } from './openThreads';
import { npcChipWant, npcGoalPersonHere } from './openThreadUtils';
import { exitNpc } from './presentAuthority';
import { applyPressureAgendaAdvance, tickPressureClock } from './pressureClock';
import { ensureQuestFloor } from './questGenerator';
import { presentNpcRecords } from './npcRecords';
import { commitTravel, isJourneyUnderway, roadMeetingOver } from './travelJourney';
import { fuzzyTypedName } from './typedNameMatch';

export { STALL_N };

function turnsWithoutProgressLocal(state: GameState): number {
  const mem = state.circling;
  if (!mem) return 0;
  return Math.max(0, (state.turn ?? 0) - mem.lastProgressTurn);
}

const STALE_TURNS = 10;
const BRING_WINDOW = 5;
const MAX_FIGHT_CHIPS = 4;

export type DirectorInput = {
  playerInput?: string;
  /** Recent chip labels picked (newest last). */
  recentChips?: string[];
  /** Chip that was no-op twice — replace with next plan chip. */
  noOpChip?: string | null;
};

/** OPT-5 / T10DIR: true when progress stall, pressure deadline, or circling.stale ≥ STALL_N. */
export function stallPressureActive(state: GameState): boolean {
  if (state.engineMode === 'pyoa') return false;
  if (turnsWithoutProgressLocal(state) >= STALL_N) return true;
  // Same predicate as openThreads.stallPressureActive (shared STALL_N).
  const turn = state.turn ?? 0;
  const tsp = state.progressGovernor?.turnsSinceProgress ?? 0;
  if (tsp >= STALL_N) return true;
  const lastProgress = state.circling?.lastProgressTurn;
  if (typeof lastProgress === 'number' && turn - lastProgress >= STALL_N) return true;
  const deadline = state.arcDirector?.pressureClock?.deadlineTurn;
  if (deadline != null && turn >= deadline) return true;
  const stale = state.circling?.stale;
  if (!stale) return false;
  const places = Object.keys(stale);
  for (let i = 0; i < places.length; i++) {
    const fams = stale[places[i]!]!;
    const keys = Object.keys(fams);
    for (let j = 0; j < keys.length; j++) {
      if (turn - (fams[keys[j]!] ?? turn) >= STALL_N) return true;
    }
  }
  return false;
}

function placeIdOf(state: GameState): string {
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  if (!here) return '';
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), here);
  if (hub?.id) return hub.id;
  const places = state.places ?? [];
  for (let i = 0; i < places.length; i++) {
    const p = places[i]!;
    const n = (p.name ?? '').trim().toLowerCase();
    if (n === here.toLowerCase() || (p.id ?? '').toLowerCase() === here.toLowerCase()) {
      return p.id || p.name;
    }
  }
  return here;
}

function placeNameOf(state: GameState): string {
  return (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
}

/** Genre tags from mode + bible id (no hard-coded bible prose). */
function genreTags(state: GameState): string[] {
  const mode = state.engineMode;
  const bible = (state.campaignBibleId ?? '').toLowerCase();
  const tags: string[] = [];
  if (mode === 'dnd') tags.push('tabletop', 'fantasy');
  else if (mode === 'rpg') tags.push('story-rpg', 'heist');
  else if (mode === 'litrpg') tags.push('litrpg', 'system');
  if (bible.includes('keep') || bible.includes('cursed')) tags.push('keep', 'undead');
  if (bible.includes('salt') || bible.includes('road')) tags.push('road', 'caravan');
  if (bible.includes('summon') || bible.includes('pact')) tags.push('summon', 'pact');
  if (bible.includes('coast') || bible.includes('shatter')) tags.push('coast');
  return tags;
}

function lastDevelopment(state: GameState): { kind: string; target: string } | null {
  const d = state.directorStall?.last;
  if (!d) return null;
  return { kind: d.kind, target: d.target ?? '' };
}

function recordDevelopment(
  state: GameState,
  kind: DirectorDevelopment['kind'],
  target: string,
  fact: string,
): GameState {
  const turn = state.turn ?? 0;
  const entry = { kind, target, fact, turn };
  const hist = [...(state.directorStall?.history ?? []), entry].slice(-16);
  return {
    ...state,
    directorStall: {
      last: { kind, target },
      history: hist,
      jobAsks: state.directorStall?.jobAsks ?? {},
    },
  };
}

function appendDirectorFact(state: GameState, eventId: string, text: string): GameState {
  const turn = state.turn ?? 0;
  // Deterministic timeline stamp (no Date.now) — turn-stable for replay.
  const fact: TimelineFact = {
    id: eventId,
    turn,
    kind: 'world',
    text,
    at: turn * 1000,
  };
  return {
    ...state,
    timeline: [...(state.timeline ?? []), fact].slice(-80),
    sceneFacts: state.sceneFacts
      ? { ...state.sceneFacts, stallWorldFact: text }
      : {
          crowd: 'unknown',
          noise: 'unknown',
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: turn,
          stallWorldFact: text,
        },
  };
}

function addressedPresentName(state: GameState, playerInput: string): string | null {
  const act = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  if (!act) return null;
  const present = (state.sceneFacts?.present ?? []).filter((n) => n && !isCrowdFillerToken(n));
  if (!present.length) return null;
  const chip = chipAddressee(act);
  if (chip?.who) {
    const hit = present.find(
      (n) => mentionsName(n, chip.who) || mentionsName(chip.who, n) || n.toLowerCase() === chip.who.toLowerCase(),
    );
    if (hit) return hit;
  }
  const fuzzy = fuzzyTypedName(act, present);
  if (fuzzy) return fuzzy;
  const low = act.toLowerCase();
  for (const n of present) {
    if (mentionsName(low, n)) return n;
  }
  return null;
}

function stallDepartPresentNpc(state: GameState, turn: number, playerInput = ''): GameState {
  const present = (state.sceneFacts?.present ?? []).filter((n) => n && !isCrowdFillerToken(n));
  if (!present.length) return state;
  const keep = addressedPresentName(state, playerInput);
  const candidates = keep
    ? present.filter(
        (n) =>
          n.trim().toLowerCase() !== keep.trim().toLowerCase()
          && !mentionsName(n, keep)
          && !mentionsName(keep, n),
      )
    : present;
  if (!candidates.length) return state;
  const name = candidates[candidates.length - 1]!;
  const exited = exitNpc(state, name, 'stall-pressure');
  const fact = `Left under stall pressure T${turn}`;
  const mems = (exited.npcMemories ?? []).map((m) => {
    const n = (m.npcName ?? '').trim();
    if (!n || (!mentionsName(n, name) && !mentionsName(name, n) && n.toLowerCase() !== name.trim().toLowerCase())) {
      return m;
    }
    return {
      ...m,
      facts: m.facts?.includes(fact) ? m.facts : [...(m.facts ?? []), fact].slice(-12),
    };
  });
  return { ...exited, npcMemories: mems };
}

function pickThreatFact(state: GameState, hereName: string): string {
  const tags = genreTags(state);
  if (tags.includes('undead') || tags.includes('keep')) {
    return `Threat at ${hereName}: something stirs beyond the next door — the keep will not wait.`;
  }
  if (tags.includes('road') || tags.includes('caravan')) {
    return `Threat on the road at ${hereName}: riders or a rival crew closes distance.`;
  }
  if (tags.includes('litrpg') || tags.includes('system')) {
    return `Threat at ${hereName}: a System ping marks hostile contact nearby.`;
  }
  return `Threat at ${hereName}: a patrol or visitor interrupts the stall — the scene moves on.`;
}

function pickLeadFact(state: GameState): { fact: string; placeId?: string; npcId?: string } | null {
  const hubs = hubsForBibleId(state.campaignBibleId);
  const hereId = placeIdOf(state);
  const hereName = placeNameOf(state).toLowerCase();
  const visited = new Set(
    (state.places ?? []).filter((p) => p.lastVisitedTurn != null).map((p) => (p.name ?? '').toLowerCase()),
  );
  for (let i = 0; i < hubs.length; i++) {
    const h = hubs[i]!;
    if (h.id === hereId || h.name.toLowerCase() === hereName) continue;
    if (visited.has(h.name.toLowerCase())) continue;
    return {
      fact: `Lead: word points you toward ${h.name} — a reason to leave this stall.`,
      placeId: h.id || h.name,
    };
  }
  const present = presentNpcRecords(state).filter((m) => m.present === true || peopleHere(state).some((n) => mentionsName(n, m.npcName)));
  for (let i = 0; i < present.length; i++) {
    const m = present[i]!;
    const want = npcChipWant(m);
    if (!want) continue;
    return {
      fact: `Lead: ${m.npcName} has a concrete ask — ${want}.`,
      npcId: m.npcId || `npc:${m.npcName}`,
    };
  }
  const quests = (state.quests ?? []).filter((q) => q.revealed && q.status === 'active');
  for (let i = 0; i < quests.length; i++) {
    const q = quests[i]!;
    const obj = (q.objectives ?? []).find((o) => !o.completed && !o.optional);
    if (!obj) continue;
    return {
      fact: `Lead: open step on ${q.name} — ${obj.description}`,
      placeId: q.placeId,
    };
  }
  return null;
}

function pickNpcAct(state: GameState): { fact: string; npcId: string; name: string } | null {
  const here = peopleHere(state);
  const mems = state.npcMemories ?? [];
  for (let i = 0; i < mems.length; i++) {
    const m = mems[i]!;
    if (!m.goal?.motivation && !m.need && !m.offer) continue;
    if (!here.some((n) => mentionsName(n, m.npcName) || mentionsName(m.npcName, n))) continue;
    if (m.present === false) continue;
    const want = npcChipWant(m) || m.need || m.offer || m.goal?.target || 'their next move';
    const npcId = m.npcId || `npc:${m.npcName}`;
    return {
      npcId,
      name: m.npcName,
      fact: `NPC act: ${m.npcName} presses their agenda — ${want} — and waits for your answer.`,
    };
  }
  return null;
}

function developmentAllowed(state: GameState, kind: DirectorDevelopment['kind'], target: string): boolean {
  const last = lastDevelopment(state);
  if (!last) return true;
  // No repeating the same kind+target twice in a row.
  return !(last.kind === kind && last.target === target);
}

/**
 * Build a stall world development (engine fact). Injection itself is NOT progress —
 * progress lands only when the player acts on it (turnProgress).
 */
function injectStallDevelopment(
  state: GameState,
  playerInput: string,
): { state: GameState; development?: DirectorDevelopment; need: DirectorNeed; forwardIds: string[]; stallKind?: SceneThreadPlan['stallKind']; stallEventId?: string } {
  const turn = state.turn ?? 0;
  let working = state;
  const forwardIds: string[] = [];
  let stallKind: SceneThreadPlan['stallKind'];
  let stallEventId: string | undefined;
  let development: DirectorDevelopment | undefined;
  let need: DirectorNeed = 'none';

  const roadEnc = working.journey?.encounter;
  const roadOpen = !!roadEnc && !roadMeetingOver(roadEnc);
  if (
    isJourneyUnderway(working)
    && !working.activeEncounter
    && !working.sceneFacts?.pendingEncounter
    && !roadOpen
  ) {
    const advanced = commitTravel(working, 'Walk on');
    if (advanced.handled) {
      working = advanced.state;
      forwardIds.push(`stall-road:${turn}`);
      stallKind = 'situation';
      stallEventId = `stall-road-${turn}`;
      const fact = advanced.receipt || 'Stall pressure: the road pressed you onward.';
      working = appendDirectorFact(working, stallEventId, fact);
      if (developmentAllowed(working, 'lead', 'road')) {
        development = { kind: 'lead', fact, placeId: working.currentLocation };
        working = recordDevelopment(working, 'lead', 'road', fact);
        need = 'travel';
      }
      return { state: working, development, need, forwardIds, stallKind, stallEventId };
    }
  }

  // Prefer npc-acting → lead → threat (genre-fit), skipping last kind+target.
  const npcAct = pickNpcAct(working);
  if (npcAct && developmentAllowed(working, 'npc-acting', npcAct.npcId)) {
    stallEventId = `stall-npc-${turn}-${npcAct.npcId}`;
    stallKind = 'agenda';
    forwardIds.push(`agenda:${npcAct.npcId}`);
    working = appendDirectorFact(working, stallEventId, npcAct.fact);
    development = { kind: 'npc-acting', fact: npcAct.fact, npcId: npcAct.npcId };
    working = recordDevelopment(working, 'npc-acting', npcAct.npcId, npcAct.fact);
    need = 'npc-act';
    return { state: working, development, need, forwardIds, stallKind, stallEventId };
  }

  const lead = pickLeadFact(working);
  if (lead) {
    const target = lead.placeId || lead.npcId || 'lead';
    if (developmentAllowed(working, 'lead', target)) {
      stallEventId = `stall-lead-${turn}`;
      stallKind = 'situation';
      forwardIds.push(`lead:${target}`);
      working = appendDirectorFact(working, stallEventId, lead.fact);
      development = { kind: 'lead', fact: lead.fact, placeId: lead.placeId, npcId: lead.npcId };
      working = recordDevelopment(working, 'lead', target, lead.fact);
      need = lead.placeId ? 'travel' : 'lead';
      return { state: working, development, need, forwardIds, stallKind, stallEventId };
    }
  }

  const hereName = placeNameOf(working);
  if (hereName && !isJourneyUnderway(working) && !working.activeEncounter) {
    const target = placeIdOf(working) || hereName;
    if (developmentAllowed(working, 'threat', target)) {
      const fact = pickThreatFact(working, hereName);
      stallEventId = `stall-threat-${turn}`;
      stallKind = 'situation';
      forwardIds.push(`threat:${target}`);
      const event: PlaceEngineEvent = {
        placeId: hereName,
        kind: 'new-threat',
        detail: fact,
      };
      working = applyPlaceEngineEvent(working, event);
      working = stallDepartPresentNpc(working, turn, playerInput);
      working = appendDirectorFact(working, stallEventId, fact);
      development = { kind: 'threat', fact, placeId: target };
      working = recordDevelopment(working, 'threat', target, fact);
      need = 'threat';
      return { state: working, development, need, forwardIds, stallKind, stallEventId };
    }
  }

  // Fall through: agenda / quest floor (same as former OPT-5) when kinds were blocked by repeat.
  const prevClock = working.arcDirector?.pressureClock;
  const nextClock = tickPressureClock(prevClock, false, turn);
  working = applyPressureAgendaAdvance(
    working,
    prevClock,
    { ...nextClock, deadlineTurn: turn },
    false,
  );
  const floor = ensureQuestFloor(working);
  working = floor.state;
  if (floor.quest) {
    stallEventId = `stall-situation-${turn}-${floor.quest.id}`;
    stallKind = 'situation';
    forwardIds.push(`situation:${floor.quest.id}`);
    const fact = `Stall pressure: new situation — ${floor.quest.name}.`;
    working = appendDirectorFact(working, stallEventId, fact);
    need = 'quest-offer';
  } else if (!stallEventId && hereName) {
    stallEventId = `stall-hub-${turn}`;
    stallKind = 'situation';
    const fact = `Stall pressure: the scene at ${hereName} moves on.`;
    working = appendDirectorFact(working, stallEventId, fact);
    need = 'threat';
  }

  return { state: working, development, need, forwardIds, stallKind, stallEventId };
}

function pickForwardThread(state: GameState, threads: OpenThread[]): OpenThread | null {
  const turn = state.turn ?? 0;
  const here = placeNameOf(state).toLowerCase();
  let best: OpenThread | null = null;
  let bestScore = -1;
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    if (t.kind === 'npc-goal' && !npcGoalPersonHere(state, t.entityId || '', t.label.split(':')[0])) {
      continue;
    }
    const stale = Math.max(0, turn - (t.lastSeenTurn ?? 0));
    let prox = 0;
    if (here && t.placeId) {
      const place = t.placeId.trim().toLowerCase();
      if (place === here) prox = 50;
      else if (here.includes(place) || place.includes(here)) prox = 25;
    }
    const score = stale * 10 + prox;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    if (t.kind === 'npc-goal' && !npcGoalPersonHere(state, t.entityId || '', t.label.split(':')[0])) {
      continue;
    }
    const untouched = turn - (t.lastSeenTurn ?? 0);
    if (untouched >= STALE_TURNS) {
      const deadline = (t.lastSeenTurn ?? 0) + STALE_TURNS + BRING_WINDOW;
      if (turn <= deadline) return t;
    }
  }
  return best;
}

/** Travel chip label → destination name. */
export function travelDestFromChip(chip: string): string | null {
  const m = chip.match(
    /^(?:travel\s+(?:toward|to)|go\s+to|head\s+(?:to|toward)|walk\s+to|return\s+to|go\s+back\s+to)\s+(.+)$/i,
  );
  return m ? m[1]!.replace(/[.!?]+$/, '').trim() : null;
}

/**
 * Never a travel chip to the current place (compare by place id, then name).
 * Never ping-pong between two places more than once without a new reason.
 */
export function filterDirectorTravelChips(
  state: GameState,
  chips: string[],
  recentChips: string[] = [],
): string[] {
  const hereId = placeIdOf(state).toLowerCase();
  const hereName = placeNameOf(state).toLowerCase();
  const hubs = hubsForBibleId(state.campaignBibleId);
  const out: string[] = [];
  const recentTravel: string[] = [];
  for (let i = recentChips.length - 1; i >= 0 && recentTravel.length < 4; i--) {
    const d = travelDestFromChip(recentChips[i]!);
    if (d) recentTravel.push(d.toLowerCase());
  }
  for (let i = 0; i < chips.length; i++) {
    const chip = chips[i]!;
    const dest = travelDestFromChip(chip);
    if (!dest) {
      out.push(chip);
      continue;
    }
    const destLow = dest.toLowerCase();
    const hub = matchHub(hubs, dest);
    const destId = (hub?.id ?? '').toLowerCase();
    // Current place by id or name.
    if ((hereId && (destId === hereId || destLow === hereId)) || (hereName && destLow === hereName)) {
      continue;
    }
    // Hub id match against current hub.
    const hereHub = matchHub(hubs, state.currentLocation);
    if (hereHub && hub && hereHub.id === hub.id) continue;

    // Ping-pong: recent travel was to HERE from dest (A→B), now offering B→A again.
    if (recentTravel.length >= 1) {
      const lastDest = recentTravel[0]!;
      const hereLow = hereName;
      // Last chip went to current place; offering travel back to the place before that.
      if (lastDest === hereLow && recentTravel.length >= 2) {
        const prevDest = recentTravel[1]!;
        if (destLow === prevDest) {
          const plan = state.directorPlan;
          const newReason = plan?.need === 'travel' && plan.development?.placeId
            && (plan.development.placeId.toLowerCase() === destId
              || plan.development.placeId.toLowerCase() === destLow
              || (hub && plan.development.placeId.toLowerCase() === hub.id.toLowerCase()));
          if (!newReason) continue;
        }
      }
    }
    out.push(chip);
  }
  return out;
}

/**
 * A chip picked twice with no progress is replaced by the next plan chip.
 */
export function replaceNoOpChip(
  plan: DirectorPlan | undefined,
  chips: string[],
  noOpChip: string | null | undefined,
): string[] {
  if (!noOpChip || !chips.length) return chips;
  const key = noOpChip.replace(/\s+/g, ' ').trim().toLowerCase();
  const filtered = chips.filter((c) => c.replace(/\s+/g, ' ').trim().toLowerCase() !== key);
  const next = plan?.chips?.find((c) => c.label.replace(/\s+/g, ' ').trim().toLowerCase() !== key);
  if (next && !filtered.some((c) => c === next.label)) {
    return [next.label, ...filtered].slice(0, 6);
  }
  return filtered.length ? filtered : chips;
}

const JOB_ASK =
  /\b(?:ask|ask(?:ing)?\s+(?:\w+\s+){0,4}about)\s+(?:the\s+)?(?:job|work|task|contract|gig|errand)\b|\bwhat\s+(?:job|work|task)\b|\b(?:need|got|have)\s+(?:a\s+)?(?:job|work|task)\b/i;

export function isJobAsk(playerInput: string): boolean {
  return JOB_ASK.test((playerInput ?? '').replace(/\s+/g, ' ').trim());
}

function jobAskNpc(state: GameState, playerInput: string): NpcMemory | null {
  const who = addressedPresentName(state, playerInput) ?? chipAddressee(playerInput)?.who;
  const here = peopleHere(state);
  const mems = state.npcMemories ?? [];
  if (who) {
    for (let i = 0; i < mems.length; i++) {
      const m = mems[i]!;
      if (mentionsName(m.npcName, who) || mentionsName(who, m.npcName)) {
        if (here.some((n) => mentionsName(n, m.npcName))) return m;
      }
    }
  }
  // Fallback: first present with offer / quest-patron role.
  for (let i = 0; i < mems.length; i++) {
    const m = mems[i]!;
    if (!here.some((n) => mentionsName(n, m.npcName))) continue;
    if (m.offer || m.roleHint === 'quest-patron' || m.goal?.motivation) return m;
  }
  return null;
}

/**
 * NPC job talk → real quest offer in ≤2 asks.
 * Rewards = existing coin/item/reputation fields only (XP LOCKED).
 */
export function resolveJobTalk(
  state: GameState,
  playerInput: string,
): { state: GameState; plan: Partial<DirectorPlan>; chips: DirectorChipSpec[] } {
  if (state.engineMode === 'pyoa' || !isJobAsk(playerInput)) {
    return { state, plan: {}, chips: [] };
  }
  const npc = jobAskNpc(state, playerInput);
  if (!npc) {
    return {
      state,
      plan: { need: 'lead' },
      chips: [],
    };
  }
  const npcId = npc.npcId || `npc:${npc.npcName}`;
  const asks = { ...(state.directorStall?.jobAsks ?? {}) };
  const prior = asks[npcId] ?? 0;
  const nextAsk = prior + 1;
  asks[npcId] = nextAsk;

  const hasOffer = !!(npc.offer || npc.goal?.target || npc.need);
  // Already has a live quest from this giver?
  const existing = (state.quests ?? []).find(
    (q) => q.status === 'active' && q.giver && mentionsName(q.giver, npc.npcName),
  );

  if (existing) {
    const fact = `Quest offer: ${npc.npcName} already has you on "${existing.name}".`;
    let s: GameState = {
      ...state,
      directorStall: { ...(state.directorStall ?? { history: [] }), jobAsks: asks },
    };
    s = appendDirectorFact(s, `job-existing-${state.turn}-${npcId}`, fact);
    return {
      state: s,
      plan: {
        need: 'quest-offer',
        development: { kind: 'lead', fact, npcId, questId: existing.id },
      },
      chips: [
        { label: `Ask ${npc.npcName} about the next step`, reason: 'open-quest-step' },
        { label: `Travel toward the job site`, reason: 'quest-place' },
      ],
    };
  }

  if (hasOffer && nextAsk <= 2) {
    const goal = npcChipWant(npc) || npc.offer || npc.need || 'the job they named';
    const place =
      (npc.goal?.target && !/^(?:inn|town|road|camp)$/i.test(npc.goal.target) ? npc.goal.target : null)
      ?? placeNameOf(state);
    const reward = npc.offer?.includes('pay') || npc.offer?.includes('coin')
      ? 'coin'
      : npc.offer || 'standing';
    const questId = `dir-job-${npcId}`.slice(0, 48);
    const fact =
      `Quest offer from ${npc.npcName}: goal=${goal}; place=${place}; reward=${reward}.`;
    let s: GameState = {
      ...state,
      directorStall: { ...(state.directorStall ?? { history: [] }), jobAsks: asks },
    };
    s = appendDirectorFact(s, `job-offer-${state.turn}-${npcId}`, fact);
    return {
      state: s,
      plan: {
        need: 'quest-offer',
        development: { kind: 'lead', fact, npcId, questId, placeId: place },
      },
      chips: [
        { label: `Accept the job from ${npc.npcName}`, reason: 'quest-accept' },
        { label: `Decline the job from ${npc.npcName}`, reason: 'quest-decline' },
      ],
    };
  }

  // No offer, or second empty ask: say so once, then a concrete lead — never the same empty twice.
  const emptyKey = `empty:${npcId}`;
  const alreadyEmpty = (state.directorStall?.history ?? []).some((h) => h.target === emptyKey);
  let s: GameState = {
    ...state,
    directorStall: { ...(state.directorStall ?? { history: [] }), jobAsks: asks },
  };
  if (!alreadyEmpty && nextAsk <= 2) {
    const fact = `${npc.npcName} has no job to offer right now.`;
    s = appendDirectorFact(s, `job-empty-${state.turn}-${npcId}`, fact);
    s = recordDevelopment(s, 'lead', emptyKey, fact);
    const lead = pickLeadFact(s);
    const leadFact = lead?.fact ?? `Lead: leave ${placeNameOf(s)} and press the open quest.`;
    if (lead) s = appendDirectorFact(s, `job-lead-${state.turn}`, leadFact);
    return {
      state: s,
      plan: {
        need: 'lead',
        development: { kind: 'lead', fact: leadFact, placeId: lead?.placeId, npcId: lead?.npcId },
      },
      chips: lead?.placeId
        ? [{ label: `Travel toward ${lead.placeId}`, reason: 'job-empty-lead' }]
        : [{ label: 'Ask someone else about work', reason: 'job-empty-lead' }],
    };
  }

  // Third+ ask: only the lead chip, no second empty fact.
  const lead = pickLeadFact(s);
  return {
    state: s,
    plan: { need: 'lead' },
    chips: lead?.placeId
      ? [{ label: `Travel toward ${lead.placeId}`, reason: 'job-repeat-lead' }]
      : [{ label: 'Look for another contact', reason: 'job-repeat-lead' }],
  };
}

/** Accept chip → quest row (no XP fields touched). */
export function acceptDirectorQuestOffer(state: GameState): GameState {
  const plan = state.directorPlan;
  if (plan?.need !== 'quest-offer' || !plan.development) return state;
  const d = plan.development;
  const questId = d.questId || `dir-job-${d.npcId || 'unknown'}`.slice(0, 48);
  if ((state.quests ?? []).some((q) => q.id === questId)) return state;
  const giver =
    (state.npcMemories ?? []).find((m) => (m.npcId || `npc:${m.npcName}`) === d.npcId)?.npcName
    ?? d.npcId?.replace(/^npc:/, '')
    ?? 'Contact';
  const goal = d.fact.replace(/^Quest offer from [^:]+:\s*goal=/i, '').split(';')[0]?.trim() || 'Do the job';
  const quest: Quest = {
    id: questId,
    name: `${giver}'s job`,
    description: goal,
    status: 'active',
    revealed: true,
    giver,
    placeId: d.placeId,
    objectives: [{ id: `${questId}-1`, description: goal, completed: false }],
  };
  return { ...state, quests: [...(state.quests ?? []), quest] };
}

function chipSpecsFromNeed(
  state: GameState,
  need: DirectorNeed,
  development: DirectorDevelopment | undefined,
  forward: OpenThread | null,
): DirectorChipSpec[] {
  const chips: DirectorChipSpec[] = [];
  if (need === 'quest-offer' && development?.npcId) {
    const name =
      (state.npcMemories ?? []).find((m) => (m.npcId || `npc:${m.npcName}`) === development.npcId)?.npcName
      ?? 'them';
    chips.push(
      { label: `Accept the job from ${name}`, reason: 'director-quest-accept' },
      { label: `Decline the job from ${name}`, reason: 'director-quest-decline' },
    );
  }
  if (need === 'travel' || (development?.kind === 'lead' && development.placeId)) {
    const dest = development?.placeId;
    if (dest) {
      const hub = matchHub(hubsForBibleId(state.campaignBibleId), dest);
      const label = hub?.name ?? dest;
      const hereHub = matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
      if (!hereHub || hereHub.id !== hub?.id) {
        chips.push({ label: `Travel toward ${label}`, reason: 'director-lead-travel' });
      }
    }
  }
  if (need === 'npc-act' && development?.npcId) {
    const name =
      (state.npcMemories ?? []).find((m) => (m.npcId || `npc:${m.npcName}`) === development.npcId)?.npcName
      ?? 'them';
    chips.push({ label: `Answer ${name}`, reason: 'director-npc-act' });
  }
  if (need === 'threat') {
    chips.push({ label: 'Face the threat', reason: 'director-threat' });
    chips.push({ label: 'Look for an exit', reason: 'director-threat-exit' });
  }
  if (forward) {
    chips.push({ label: `Follow up: ${forward.label}`.slice(0, 80), reason: 'director-thread' });
  }
  return chips;
}

/**
 * Sole progression planner. Writes directorPlan (+ sceneThreadPlan / stall records / nudge fields).
 */
export function planDirector(
  state: GameState,
  input: DirectorInput = {},
): { state: GameState; plan: DirectorPlan; receipts: string[]; notes: string[] } {
  if (state.engineMode === 'pyoa') {
    const plan: DirectorPlan = { need: 'none', chips: [], turn: state.turn ?? 0 };
    return {
      state: writeDirectorPlan(state, plan, { plannedTurn: plan.turn, forwardIds: [] }),
      plan,
      receipts: [],
      notes: [],
    };
  }

  const turn = state.turn ?? 0;
  const playerInput = input.playerInput ?? '';
  const notes: string[] = [];
  const receipts: string[] = [];
  let working = state;

  // Job talk resolves before stall (≤2 asks).
  let jobChips: DirectorChipSpec[] = [];
  if (isJobAsk(playerInput)) {
    const job = resolveJobTalk(working, playerInput);
    working = job.state;
    jobChips = job.chips;
    if (job.plan.need === 'quest-offer' || job.plan.need === 'lead') {
      const plan: DirectorPlan = {
        need: (job.plan.need as DirectorNeed) ?? 'quest-offer',
        development: job.plan.development,
        chips: jobChips,
        turn,
      };
      working = writeDirectorPlan(working, plan, {
        plannedTurn: turn,
        forwardIds: job.plan.development?.questId ? [`quest:${job.plan.development.questId}`] : [],
      });
      if (plan.development?.fact) receipts.push(plan.development.fact);
      return { state: working, plan, receipts, notes };
    }
  }

  const threads = collectOpenThreads(working);
  const stall = stallPressureActive(working);
  const existing = working.sceneThreadPlan;
  if (existing && existing.plannedTurn === turn && existing.forwardIds.length && !(stall && !existing.stallKind)) {
    const plan: DirectorPlan = working.directorPlan ?? { need: 'none', chips: jobChips, turn };
    return {
      state: { ...writeDirectorPlan(working, plan, existing), openThreads: threads },
      plan,
      receipts,
      notes,
    };
  }

  if (!threads.length && !stall) {
    const plan: DirectorPlan = { need: 'none', chips: jobChips, turn };
    working = writeDirectorPlan(working, plan, { plannedTurn: turn, forwardIds: [] });
    return { state: { ...working, openThreads: [] }, plan, receipts, notes };
  }

  const best = pickForwardThread(working, threads);
  let forwardIds: string[] = [];
  let stallKind: SceneThreadPlan['stallKind'];
  let stallEventId: string | undefined;
  let need: DirectorNeed = 'none';
  let development: DirectorDevelopment | undefined;

  // Prefer open-thread bring-forward under stall (OPT-5 / ttT1b): stallKind stays 'thread'
  // when a thread is available; otherwise inject a concrete world development.
  if (stall && best) {
    forwardIds = [best.id];
    stallKind = 'thread';
    stallEventId = `stall-thread-${turn}-${best.id}`;
    const fact = `Stall pressure: open thread brought forward — ${best.label}.`;
    working = appendDirectorFact(working, stallEventId, fact);
    receipts.push(fact);
    development = { kind: 'lead', fact, placeId: best.placeId ?? undefined };
    need = 'lead';
    const hereName = placeNameOf(working);
    if (hereName && !isJourneyUnderway(working) && !working.activeEncounter) {
      const target = placeIdOf(working) || hereName;
      if (developmentAllowed(working, 'threat', target)) {
        const threatFact = pickThreatFact(working, hereName);
        working = applyPlaceEngineEvent(working, {
          placeId: hereName,
          kind: 'new-threat',
          detail: threatFact,
        });
        working = stallDepartPresentNpc(working, turn, playerInput);
        working = recordDevelopment(working, 'threat', target, threatFact);
      }
    }
  } else if (stall) {
    const inj = injectStallDevelopment(working, playerInput);
    working = inj.state;
    forwardIds = inj.forwardIds;
    stallKind = inj.stallKind;
    stallEventId = inj.stallEventId;
    need = inj.need;
    development = inj.development;
    if (development?.fact) receipts.push(development.fact);
  } else if (best) {
    forwardIds = [best.id];
  }

  // Pressure deadline engine event when a thread was already forward.
  if (stall && !stallEventId) {
    const deadline = working.arcDirector?.pressureClock?.deadlineTurn;
    if (deadline != null && turn >= deadline) {
      stallEventId = `stall-pressure-${turn}`;
      if (!stallKind && best) stallKind = 'thread';
      const fact = `Stall pressure: pressure clock deadline passed at T${deadline}.`;
      working = appendDirectorFact(working, stallEventId, fact);
      receipts.push(fact);
    }
  }

  const nextThreads: OpenThread[] = [];
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i]!;
    let lastSeen = t.lastSeenTurn;
    for (let f = 0; f < forwardIds.length; f++) {
      if (forwardIds[f] === t.id) lastSeen = turn;
    }
    nextThreads.push({ ...t, lastSeenTurn: lastSeen });
  }

  const chips = [
    ...jobChips,
    ...chipSpecsFromNeed(working, need, development, best),
  ];
  const plan: DirectorPlan = { need, development, chips, turn };
  working = writeDirectorPlan(working, plan, {
    plannedTurn: turn,
    forwardIds,
    stallKind,
    stallEventId,
  });
  working = { ...working, openThreads: nextThreads };
  notes.push(`Director need=${need}; stall=${stall ? 1 : 0}; forward=${forwardIds.length}`);
  return { state: working, plan, receipts, notes };
}

/** Sole writer of directorPlan + sceneThreadPlan (single-writer ratchet). */
export function writeDirectorPlan(
  state: GameState,
  plan: DirectorPlan,
  scene: SceneThreadPlan,
): GameState {
  return {
    ...state,
    directorPlan: plan,
    sceneThreadPlan: scene,
  };
}

/** Sole writer of circling nudge fields (anti-circling routes through director). */
export function writeDirectorNudge(
  state: GameState,
  line: string,
  nudgeCursor: number,
): GameState {
  const mem = state.circling;
  if (!mem) return state;
  const turn = state.turn ?? 0;
  const fired = [...(mem.firedNudges ?? []), line].slice(-64);
  return {
    ...state,
    circling: {
      ...mem,
      nudgedTurn: turn,
      lastNudge: line,
      nudgeCursor,
      firedNudges: fired,
      // Do NOT set lastProgressTurn — injection is not progress (T10DIR).
    },
  };
}

/**
 * Anti-circling entry: director owns progression. When stalled, planDirector injects
 * a world development; engine-fact nudges only when the director has nothing new and
 * stuck ≥ STALL_N. The old "Nudge skipped … OPT-5" dead end is deleted.
 */
export function directorNudgeIfStuck(state: GameState): {
  state: GameState;
  receipts: string[];
  notes: string[];
} {
  const mem = state.circling;
  if (!mem || state.activeEncounter) return { state, receipts: [], notes: [] };
  if (state.deathSaves || (state.character?.hp ?? 1) <= 0) return { state, receipts: [], notes: [] };
  if (state.engineMode === 'pyoa') return { state, receipts: [], notes: [] };

  const turn = state.turn ?? 0;
  if (turnsWithoutProgressLocal(state) < STALL_N) return { state, receipts: [], notes: [] };
  if (mem.nudgedTurn != null && turn - mem.nudgedTurn < STALL_N) {
    return { state, receipts: [], notes: [] };
  }

  // Stall path: director injects a concrete development (not a soft STATUS nudge).
  if (stallPressureActive(state)) {
    const planned = planDirector(state);
    if (planned.receipts.length || planned.plan.need !== 'none') {
      const withNudge = writeDirectorNudge(planned.state, planned.plan.development?.fact ?? `director:${planned.plan.need}`, 0);
      return {
        state: withNudge,
        receipts: planned.receipts,
        notes: [...planned.notes, 'Director stall development'],
      };
    }
  }

  // Engine-fact nudge rotation (dungeon / unmet NPC / quest / hub) — still fact-only.
  const fired = new Set([...(mem.firedNudges ?? []), ...(mem.lastNudge ? [mem.lastNudge] : [])]);
  const sourceCount = 4;
  const start = (mem.nudgeCursor ?? 0) % sourceCount;
  let line = '';
  let used = start;
  for (let i = 0; i < sourceCount && !line; i++) {
    const idx = (start + i) % sourceCount;
    let candidate = '';
    if (idx === 0) {
      const d = state.activeDungeon;
      if (d) {
        const node = d.nodes.find((n) => n.id === d.currentNodeId);
        const conns = node?.connections ?? [];
        for (let c = 0; c < conns.length; c++) {
          const nextNode = d.nodes.find((n) => n.id === conns[c]);
          if (nextNode && !d.visitedNodeIds.includes(nextNode.id)) {
            candidate = `Nudge: a sound carries from ${nextNode.name}.`;
            break;
          }
        }
      }
    } else if (idx === 1) {
      const people = presentNpcRecords(state).filter((p) => p.present === true);
      for (let p = 0; p < people.length; p++) {
        if (!people[p]!.met && !people[p]!.introSpoken) {
          candidate = `Nudge: ${people[p]!.npcName} comes over to you.`;
          break;
        }
      }
    } else if (idx === 2) {
      const quests = state.quests ?? [];
      for (let q = 0; q < quests.length; q++) {
        const quest = quests[q]!;
        if (quest.status !== 'active' || !quest.revealed) continue;
        const obj = (quest.objectives ?? []).find((o) => !o.completed && !o.optional);
        if (!obj) continue;
        let desc = obj.description;
        while (desc.endsWith('.') || desc.endsWith('!') || desc.endsWith('?')) desc = desc.slice(0, -1);
        candidate = `Nudge: word reaches you about ${quest.name}: ${desc}.`;
        break;
      }
    } else {
      const hubs = hubsForBibleId(state.campaignBibleId);
      const here = matchHub(hubs, state.currentLocation);
      const visited = new Set(
        (state.places ?? []).filter((p) => p.lastVisitedTurn != null).map((p) => p.name.toLowerCase()),
      );
      for (let h = 0; h < hubs.length; h++) {
        const hub = hubs[h]!;
        if (hub.id === here?.id || visited.has(hub.name.toLowerCase())) continue;
        let already = false;
        for (const f of fired) {
          if (f.includes(hub.name)) {
            already = true;
            break;
          }
        }
        if (!already) {
          candidate = `Nudge: word reaches you about ${hub.name}.`;
          break;
        }
      }
    }
    if (candidate && !fired.has(candidate)) {
      line = candidate;
      used = idx;
    }
  }

  if (!line) {
    // Last resort: force a director stall plan so the dead-end note never returns.
    const forced = planDirector({
      ...state,
      progressGovernor: {
        ...(state.progressGovernor ?? { lastProgressTurn: 0, recentDeltas: [], turnsSinceProgress: STALL_N }),
        turnsSinceProgress: STALL_N,
      },
    });
    if (forced.receipts.length) {
      return {
        state: writeDirectorNudge(forced.state, forced.plan.development?.fact ?? 'director:forced', used),
        receipts: forced.receipts,
        notes: [...forced.notes, 'Director forced development (no soft nudge)'],
      };
    }
    return { state, receipts: [], notes: ['Director: no development available this beat'] };
  }

  return {
    state: writeDirectorNudge(state, line, (used + 1) % sourceCount),
    receipts: [line],
    notes,
  };
}

/** Cap fight chips at 4 (SRD action economy — one action; pads stay small). */
export function capFightChips(chips: string[]): string[] {
  return chips.slice(0, MAX_FIGHT_CHIPS);
}

/** Apply director chip policy on a finished pad list. */
export function applyDirectorChipPolicy(
  state: GameState,
  chips: string[],
  opts: { recentChips?: string[]; noOpChip?: string | null; inFight?: boolean } = {},
): string[] {
  let next = filterDirectorTravelChips(state, chips, opts.recentChips ?? []);
  next = replaceNoOpChip(state.directorPlan, next, opts.noOpChip);
  if (opts.inFight) next = capFightChips(next);
  // Prefer director plan chips first when stall need is active.
  const plan = state.directorPlan;
  if (plan && plan.need !== 'none' && plan.chips.length) {
    const prefer = plan.chips.map((c) => c.label).filter((l) => next.includes(l) || travelDestFromChip(l));
    const merged = [...prefer];
    for (const c of next) {
      if (!merged.includes(c)) merged.push(c);
    }
    next = filterDirectorTravelChips(state, merged, opts.recentChips ?? []);
  }
  return next;
}

// Bind after planDirector is defined so openThreads.planSceneThreads can delegate.
bindPlanDirector(planDirector);
