/**
 * M6 — mid-visit quest / hook proposal (John 26 Oct: places stay open).
 *
 * The AI may propose new quests, side objectives, NPCs or hooks for an existing place
 * at any time. Engine rule: add-never-contradict — check against decided/done facts and
 * the world's genre/setting template; accept into ledger/quest state; cap per place/visit
 * so the book is not flooded. No paid AI calls — proposals ride existing writer output
 * (or are stubbed in tests).
 *
 * Idea only from docs/orders/merge/proto/engine.mjs proposePlace — not a code copy.
 */
import type { GameState, Quest } from './types';

/** Max new proposals accepted for one place during one visit. */
export const MID_VISIT_PROPOSAL_CAP = 2;

export type MidVisitProposalKind = 'quest' | 'side' | 'npc' | 'hook';

export interface MidVisitProposal {
  kind: MidVisitProposalKind;
  title: string;
  summary: string;
  /** Place this attaches to (defaults to currentLocation). */
  place?: string;
  /** Optional giver / NPC display name. */
  giver?: string;
  /** Genre tokens the setting must allow (e.g. fantasy, medieval). Empty = any. */
  genreTags?: string[];
}

export type MidVisitDecision =
  | { ok: true; reason: 'accepted'; state: GameState; quest?: Quest }
  | { ok: false; reason: 'contradiction' | 'cap' | 'genre'; detail: string; state: GameState };

function placeKey(state: GameState, place?: string): string {
  return (place ?? state.currentLocation ?? '').trim().toLowerCase() || '_';
}

/** How many mid-visit proposals this place has already accepted (visit-scoped). */
export function midVisitAcceptedCount(state: GameState, place?: string): number {
  const key = placeKey(state, place);
  // Prefer live mid-* quests at this place (one accept = one quest row).
  const fromQuests = (state.quests ?? []).filter(
    (q) =>
      typeof q.id === 'string'
      && q.id.startsWith('mid-')
      && (q.location ?? '').toLowerCase() === key,
  ).length;
  if (fromQuests > 0) return fromQuests;
  const visit = state.placeVisitLog;
  const sameVisit = visit && placeKey(state, visit.placeName) === key;
  if (!sameVisit) return 0;
  return (visit!.events ?? []).filter((e) => /mid-visit proposal accepted/i.test(e.text ?? e.detail ?? '')).length;
}

function decidedFactBlob(state: GameState): string {
  const done = (state.quests ?? [])
    .filter((q) => q.status === 'completed' || q.status === 'failed')
    .map((q) => `${q.name} ${q.description ?? ''}`)
    .join(' ');
  const tx = (state.stateTxLog ?? [])
    .filter((t) => t.kind === 'quest_complete' || t.kind === 'quest_fail')
    .map((t) => t.summary)
    .join(' ');
  const resolved = (state.sceneFacts?.resolvedCrises ?? []).join(' ');
  return `${done} ${tx} ${resolved}`.toLowerCase();
}

/** Setting / genre template tokens from the campaign bible id + engine mode. */
export function settingGenreTokens(state: GameState): string[] {
  const id = (state.campaignBibleId ?? '').toLowerCase();
  const mode = state.engineMode ?? 'dnd';
  const out = new Set<string>([mode]);
  if (/summoned|hero|gatebreak|litrpg|spire|inkbound|void|hollow|dungeon-transport|fabled/.test(id) || mode === 'litrpg') {
    out.add('fantasy');
    out.add('litrpg');
  }
  if (/cursed-keep|millstone|crown|blight|stillroot|shattered|dnd|tabletop/.test(id) || mode === 'dnd') {
    out.add('fantasy');
    out.add('medieval');
    out.add('tabletop');
  }
  if (/thornferry|salt|cape|rpg|story/.test(id) || mode === 'rpg') {
    out.add('fantasy');
    out.add('story');
  }
  if (/umbra|erebus|null-parameter|vesper|pyoa/.test(id) || mode === 'pyoa') {
    out.add('pyoa');
  }
  // Modern / sci-fi markers when the bible says so.
  if (/earth|integration|system-integration/.test(id)) out.add('modern');
  if (/umbra|erebus|null-parameter|swarm/.test(id)) out.add('scifi');
  return [...out];
}

function contradictsDecided(state: GameState, p: MidVisitProposal): string | null {
  const blob = decidedFactBlob(state);
  const title = (p.title ?? '').toLowerCase();
  const summary = (p.summary ?? '').toLowerCase();
  // Same finished quest title / crisis already resolved — add-never-contradict.
  if (title && blob.includes(title)) {
    return `contradicts decided fact: "${p.title}" already settled`;
  }
  for (const q of state.quests ?? []) {
    if (q.status !== 'completed' && q.status !== 'failed') continue;
    const n = (q.name ?? '').toLowerCase();
    if (n && (title.includes(n) || summary.includes(n))) {
      return `contradicts decided quest "${q.name}" (${q.status})`;
    }
  }
  for (const crisis of state.sceneFacts?.resolvedCrises ?? []) {
    const c = crisis.toLowerCase();
    if (c && (title.includes(c) || summary.includes(c))) {
      return `contradicts resolved crisis "${crisis}"`;
    }
  }
  return null;
}

function genreOk(state: GameState, p: MidVisitProposal): string | null {
  const tags = (p.genreTags ?? []).map((t) => t.toLowerCase()).filter(Boolean);
  if (!tags.length) return null;
  const setting = settingGenreTokens(state);
  const miss = tags.filter((t) => !setting.includes(t));
  if (miss.length === tags.length) {
    return `genre mismatch: proposal wants [${tags.join(', ')}] but setting is [${setting.join(', ')}]`;
  }
  return null;
}

/**
 * Validate and optionally commit a mid-visit proposal.
 * Stub-friendly: tests pass a proposal object; live path can harvest writer `<quest-add>` later.
 */
export function evaluateMidVisitProposal(state: GameState, proposal: MidVisitProposal): MidVisitDecision {
  const place = placeKey(state, proposal.place);
  const genreFail = genreOk(state, proposal);
  if (genreFail) return { ok: false, reason: 'genre', detail: genreFail, state };

  const contra = contradictsDecided(state, proposal);
  if (contra) return { ok: false, reason: 'contradiction', detail: contra, state };

  if (midVisitAcceptedCount(state, place) >= MID_VISIT_PROPOSAL_CAP) {
    return {
      ok: false,
      reason: 'cap',
      detail: `mid-visit proposal cap ${MID_VISIT_PROPOSAL_CAP} hit for ${place || 'here'}`,
      state,
    };
  }

  const turn = state.turn ?? 0;
  const id = `mid-${place.slice(0, 16) || 'place'}-${turn}-${(proposal.title || 'hook')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 24)}`;
  const quest: Quest = {
    id,
    name: proposal.title.slice(0, 80),
    description: proposal.summary.slice(0, 240),
    status: 'active',
    revealed: true,
    type: proposal.kind === 'side' ? 'side' : 'main',
    giver: proposal.giver,
    location: place,
    objectives: [{ id: `${id}-1`, description: proposal.summary.slice(0, 120), completed: false }],
  };

  const quests = [...(state.quests ?? []), quest];
  const unboundLog = [
    ...(state.questGen?.unboundLog ?? []),
    `accepted@${place}: ${proposal.title}`,
  ];
  let next: GameState = {
    ...state,
    quests,
    questGen: {
      lastTurn: turn,
      unboundLog,
    },
    ledgerRevision: Math.max(0, state.ledgerRevision ?? 0) + 1,
  };

  const visit = next.placeVisitLog;
  if (visit && placeKey(state, visit.placeName) === place) {
    next = {
      ...next,
      placeVisitLog: {
        ...visit,
        events: [
          ...(visit.events ?? []),
          {
            id: `mvp-${id}`,
            turn,
            kind: 'quest',
            text: `mid-visit proposal accepted: ${proposal.title}`,
            detail: proposal.summary.slice(0, 160),
            at: Date.now(),
            place,
          },
        ],
      },
    };
  }

  const rev = Math.max(0, state.ledgerRevision ?? 0);
  next = {
    ...next,
    stateTxLog: [
      ...(next.stateTxLog ?? []),
      {
        id: `m6-mvp-${id}`,
        rev,
        turn,
        kind: 'quest_reveal',
        summary: `Mid-visit proposal: ${proposal.title}`,
        entity: proposal.title,
        why: 'add-never-contradict; under place/visit cap',
        createdAt: Date.now(),
      },
    ].slice(-80),
  };

  return { ok: true, reason: 'accepted', state: next, quest };
}
