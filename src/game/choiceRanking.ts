/**
 * 28j — anti-circling, game-wide (engine, not story):
 * - remembers places, rooms and the action families tried at each place, and when the game last progressed;
 * - ranks chips: the quest's next step, unvisited places, unexplored rooms and unmet people first;
 *   the way back to the previous place is labelled "Go back to …" and ranks last;
 * - rests Inspect / Wait / Look-type chips at a place where they produced nothing new recently;
 * - after 3 turns with no progress, injects one nudge built from existing engine facts.
 * 28o — circling:
 * - the exact action tried at a place with no progress is rested/demoted there (any family, not only loiter);
 * - travel back to any of the last few places ranks below fresh places, not only the previous one;
 * - stuck in place (2+ turns, no move) with no way on offered → one exit chip to the best hub;
 * - chipProgressWeights feeds the autoplay picker so ranking changes what gets picked.
 */
import type { CirclingMemory, GameState } from './types';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { isMetNpc, presentNpcRecords } from './npcRecords';

export type { CirclingMemory } from './types';

const REST_TURNS = 4;
const STUCK_TURNS = 3;

const PROGRESS_RECEIPT = /^(?:XP Gained|Loot:|Gold Gained|Quest|Fight: VICTORY|Parley check:.*success|Dungeon: (?:you moved|you opened|you found|search of .*you found (?!nothing))|Dungeon: .* is cleared|Nudge:)/i;

export function actionFamily(input: string): string {
  const a = (input ?? '').toLowerCase();
  if (/\b(inspect|examine|study)\b/.test(a)) return 'inspect';
  if (/\b(wait|ready yourself|watch|hold still|keep watch)\b/.test(a)) return 'wait';
  if (/\b(look around|look over|survey|scout|scan)\b/.test(a)) return 'look';
  if (/\b(talk|ask|speak|greet|offer)\b/.test(a)) return 'talk';
  if (/\b(travel|go to|go back|head to|walk to|return to|enter|next unexplored|go through)\b/.test(a)) return 'move';
  if (/\b(attack|fight|strike|flee|parley)\b/.test(a)) return 'fight';
  if (/\b(search|open|loot)\b/.test(a)) return 'search';
  return 'other';
}

const LOITER = new Set(['inspect', 'wait', 'look']);
const TRIED_TURNS = 6;
const TRIED_PER_PLACE = 12;
const RECENT_PLACES = 4;

function placeKey(state: GameState): string {
  return (state.currentLocation ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function actionKey(input: string): string {
  return (input ?? '').toLowerCase().replace(/[…]|\.{3}/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Turns since this exact action was tried here with no progress (null = not recently). */
function triedAgo(state: GameState, chip: string): number | null {
  const last = state.circling?.tried?.[placeKey(state)]?.[actionKey(chip)];
  if (last == null) return null;
  const ago = (state.turn ?? 0) - last;
  return ago < TRIED_TURNS ? ago : null;
}

/** Record this turn: what was tried here, and whether the game moved on. */
export function recordCirclingTurn(state: GameState, playerInput: string, receipts: string[]): GameState {
  const mem: CirclingMemory = state.circling ?? { stale: {}, lastProgressTurn: state.turn ?? 0 };
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  const moved = !!mem.lastLocation && here !== mem.lastLocation;
  const progressed = moved || receipts.some((r) => PROGRESS_RECEIPT.test(r));
  const key = placeKey(state);
  const fam = actionFamily(playerInput);
  const stale = { ...mem.stale, [key]: { ...(mem.stale[key] ?? {}) } };
  if (!progressed && LOITER.has(fam)) stale[key]![fam] = state.turn ?? 0;
  if (progressed) delete stale[key]![fam];
  const visits = { ...(mem.visits ?? {}) };
  if (moved || !mem.lastLocation) visits[key] = (visits[key] ?? 0) + 1;
  const act = actionKey(playerInput);
  const triedHere = { ...(mem.tried?.[key] ?? {}) };
  if (act) {
    if (progressed) delete triedHere[act];
    else triedHere[act] = state.turn ?? 0;
  }
  const trimmed = Object.fromEntries(
    Object.entries(triedHere).sort((a, b) => b[1] - a[1]).slice(0, TRIED_PER_PLACE)
  );
  const tried = { ...(mem.tried ?? {}), [key]: trimmed };
  const recentPlaces = moved || !mem.lastLocation
    ? [...(mem.recentPlaces ?? []).filter((p) => p !== key), key].slice(-RECENT_PLACES)
    : mem.recentPlaces ?? [];
  const recentFamilies = [...(mem.recentFamilies ?? []), fam].slice(-3);
  return {
    ...state,
    circling: {
      ...mem,
      stale,
      visits,
      tried,
      recentPlaces,
      recentFamilies,
      lastProgressTurn: progressed ? state.turn ?? 0 : mem.lastProgressTurn,
      prevPlace: moved ? mem.lastLocation : mem.prevPlace,
      lastLocation: here,
    },
  };
}

/** Turns since the last progress (XP, move, loot, quest, new fact). */
export function turnsWithoutProgress(state: GameState): number {
  const mem = state.circling;
  if (!mem) return 0;
  return Math.max(0, (state.turn ?? 0) - mem.lastProgressTurn);
}

/** After 3 stuck turns: one nudge from existing engine facts (never authored story). */
export function nudgeIfStuck(state: GameState): { state: GameState; receipts: string[]; notes: string[] } {
  const mem = state.circling;
  if (!mem || state.activeEncounter) return { state, receipts: [], notes: [] };
  const turn = state.turn ?? 0;
  if (turnsWithoutProgress(state) < STUCK_TURNS) return { state, receipts: [], notes: [] };
  if (mem.nudgedTurn != null && turn - mem.nudgedTurn < STUCK_TURNS) return { state, receipts: [], notes: [] };
  const notes: string[] = [];
  // 28l — sources rotate (room → person → quest → hub → generic) from where the last nudge left off,
  // and the same line never repeats twice in a row.
  const sources: Array<() => string> = [
    () => {
      const d = state.activeDungeon;
      if (!d) return '';
      const node = d.nodes.find((n) => n.id === d.currentNodeId);
      const next = node?.connections.map((id) => d.nodes.find((n) => n.id === id)).find((n) => n && !d.visitedNodeIds.includes(n.id));
      return next ? `Nudge: a sound carries from ${next.name}.` : '';
    },
    () => {
      const unmet = presentNpcRecords(state).find((m) => !isMetNpc(m));
      return unmet ? `Nudge: ${unmet.npcName} comes over to you.` : '';
    },
    () => {
      const quest = (state.quests ?? []).find((q) => q.status === 'active' && q.revealed);
      const obj = quest?.objectives?.find((o) => !o.completed && !o.optional);
      if (quest && obj) return `Nudge: word reaches you about ${quest.name}: ${obj.description.replace(/[.!?]+$/, '')}.`;
      return quest?.location ? `Nudge: word reaches you that ${quest.name} leads to ${quest.location}.` : '';
    },
    () => {
      const hubs = hubsForBibleId(state.campaignBibleId);
      const here = matchHub(hubs, state.currentLocation);
      const visited = new Set((state.places ?? []).filter((p) => p.lastVisitedTurn != null).map((p) => p.name.toLowerCase()));
      const fresh = hubs.filter((h) => h.id !== here?.id && !visited.has(h.name.toLowerCase()));
      const pick = fresh.find((h) => !(mem.lastNudge ?? '').includes(h.name)) ?? fresh[0];
      return pick ? `Nudge: someone nearby mentions ${pick.name}: ${pick.blurb.replace(/[.!?]+$/, '')}.` : '';
    },
    () =>
      GENERIC_NUDGES.find((g) => g !== mem.lastNudge) ?? GENERIC_NUDGES[0]!,
  ];
  const start = (mem.nudgeCursor ?? 0) % sources.length;
  let line = '';
  let used = start;
  for (let i = 0; i < sources.length && !line; i++) {
    const idx = (start + i) % sources.length;
    const candidate = sources[idx]!();
    if (candidate && candidate !== mem.lastNudge) {
      line = candidate;
      used = idx;
    }
  }
  if (!line) {
    line = GENERIC_NUDGES.find((g) => g !== mem.lastNudge) ?? GENERIC_NUDGES[0]!;
    used = sources.length - 1;
  }
  if (used === sources.length - 1) notes.push('Generic engine nudge (no bible fact to draw on)');
  return {
    state: {
      ...state,
      circling: { ...mem, nudgedTurn: turn, lastProgressTurn: turn, lastNudge: line, nudgeCursor: (used + 1) % sources.length },
    },
    receipts: [line],
    notes,
  };
}

const GENERIC_NUDGES = [
  'Nudge: a noise close by draws your attention.',
  'Nudge: something moves at the edge of your sight.',
  'Nudge: a draft carries a new smell from somewhere near.',
];

function travelDest(chip: string): string | null {
  const m = chip.match(/^(?:travel\s+(?:toward|to)|go\s+to|head\s+(?:to|toward)|walk\s+to|return\s+to|go\s+back\s+to)\s+(.+)$/i);
  return m ? m[1]!.replace(/[.!?]+$/, '').trim() : null;
}

/** The quest's next step as one chip, when the engine knows one. */
export function storyChip(state: GameState): string | null {
  if (state.activeEncounter) return null;
  const quest = (state.quests ?? []).find((q) => q.status === 'active' && q.revealed);
  if (!quest) return null;
  const hubs = hubsForBibleId(state.campaignBibleId);
  const here = (state.currentLocation ?? '').toLowerCase();
  const site = quest.location ? matchHub(hubs, quest.location) : null;
  if (site && !here.includes(site.name.toLowerCase())) return `Travel toward ${site.name}`;
  const linked = hubs.find((h) => h.linkedQuestIds?.includes(quest.id) && !here.includes(h.name.toLowerCase()));
  if (!site && linked) return `Travel toward ${linked.name}`;
  const obj = quest.objectives?.find((o) => !o.completed && !o.optional);
  if (obj) {
    const text = obj.description.replace(/[.!?]+$/, '').trim();
    return text.length <= 60 ? text : `${text.slice(0, 57).replace(/\s+\S*$/, '')}…`;
  }
  return null;
}

const samePlace = (a: string, b: string) => !!a && !!b && (a === b || a.includes(b) || b.includes(a));

/**
 * Lower = moves the game on. 0 story step · 1 fresh place / room / fight · 2 unmet person · 3 other ·
 * 4 place visited before · 5 one of the last few places · 6 loiter · 7 head back · 9 the previous place.
 * An exact action already tried here with no progress adds 5.
 */
export function chipProgressScore(state: GameState, chip: string): number {
  const lower = chip.toLowerCase();
  const story = storyChip(state);
  const mem = state.circling;
  const repeat = triedAgo(state, chip) != null ? 5 : 0;
  if (story && lower === story.toLowerCase()) return repeat;
  const dest = travelDest(chip);
  if (dest) {
    const d = dest.toLowerCase();
    const prev = (mem?.prevPlace ?? '').toLowerCase();
    if (samePlace(d, prev)) return 9 + repeat;
    if ((mem?.recentPlaces ?? []).some((p) => samePlace(d, p))) return 5 + repeat;
    const visited = (state.places ?? []).some((p) => p.lastVisitedTurn != null && p.name.toLowerCase() === d);
    return (visited ? 4 : 1) + repeat;
  }
  if (/^(?:enter|next unexplored room|fight the|open the|search the)\b/i.test(chip)) return 1 + repeat;
  const unmet = presentNpcRecords(state).filter((m) => !isMetNpc(m)).map((m) => m.npcName.toLowerCase());
  if (unmet.some((n) => lower.includes(n))) return 2 + repeat;
  const fam = actionFamily(chip);
  if (fam === 'fight') return 1 + repeat;
  if (LOITER.has(fam)) return 6 + repeat;
  if (/^head back to the exit$/i.test(chip)) return 7 + repeat;
  return 3 + repeat;
}

/** Picker weights from chipProgressScore: progress chips are likelier, repeats and yo-yo still possible. */
export function chipProgressWeights(state: GameState, choices: string[]): number[] {
  return choices.map((c) => {
    const s = chipProgressScore(state, c);
    if (s <= 0) return 8;
    if (s === 1) return 6;
    if (s === 2) return 5;
    if (s === 3) return 3;
    if (s === 4) return 2;
    if (s <= 6) return 1;
    if (s <= 8) return 0.5;
    return 0.25;
  });
}

/** Stuck in place with no way on: one travel chip to the best hub (quest-linked, then fresh, then least recent). */
function stuckExitChip(state: GameState, list: string[]): string | null {
  const mem = state.circling;
  if (!mem || state.activeDungeon || state.openingEstablishment?.complete === false) return null;
  if (turnsWithoutProgress(state) < 2) return null;
  if ((mem.recentFamilies ?? []).slice(-2).includes('move')) return null;
  if (list.some((c) => travelDest(c) || /^(?:enter|next unexplored room)\b/i.test(c))) return null;
  const hubs = hubsForBibleId(state.campaignBibleId);
  if (!hubs.length) return null;
  const here = placeKey(state);
  const hereHub = matchHub(hubs, state.currentLocation);
  const active = new Set((state.quests ?? []).filter((q) => q.status === 'active' && q.revealed).map((q) => q.id));
  const recent = mem.recentPlaces ?? [];
  const rank = (h: (typeof hubs)[number]) => {
    const name = h.name.toLowerCase();
    const visited = (state.places ?? []).some((p) => p.lastVisitedTurn != null && p.name.toLowerCase() === name);
    return (h.linkedQuestIds?.some((id) => active.has(id)) ? 0 : 4)
      + (visited ? 2 : 0)
      + (recent.some((p) => samePlace(name, p)) ? 1 : 0);
  };
  const pick = hubs
    .filter((h) => h.id !== hereHub?.id && !here.includes(h.name.toLowerCase()))
    .map((h, i) => ({ h, i, r: rank(h) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)[0]?.h;
  return pick ? `Travel toward ${pick.name}` : null;
}

/** Final chip order: move-the-story-on and new things first, stale loiter and tried repeats rested, "Go back" last. */
export function rankChoices(state: GameState, choices: string[]): { choices: string[]; notes: string[] } {
  const notes: string[] = [];
  if (state.activeEncounter || !choices.length) return { choices, notes };
  const mem = state.circling;
  const key = placeKey(state);
  const turn = state.turn ?? 0;
  const story = storyChip(state);

  let list = [...choices];
  if (story && !list.some((c) => c.toLowerCase() === story.toLowerCase())) {
    list = [story, ...list];
    notes.push(`Story chip: ${story.slice(0, 40)}`);
  }
  const exit = stuckExitChip(state, list);
  if (exit && !list.some((c) => c.toLowerCase() === exit.toLowerCase())) {
    list = [exit, ...list];
    notes.push(`Stuck exit chip: ${exit.slice(0, 40)}`);
  }

  const kept: string[] = [];
  for (const c of list) {
    const fam = actionFamily(c);
    const last = mem?.stale[key]?.[fam];
    if (LOITER.has(fam) && last != null && turn - last < REST_TURNS) {
      notes.push(`Rested chip: ${c.slice(0, 32)}`);
      continue;
    }
    const ago = triedAgo(state, c);
    if (ago != null && ago < REST_TURNS && !(story && c.toLowerCase() === story.toLowerCase())) {
      notes.push(`Rested repeat: ${c.slice(0, 32)}`);
      continue;
    }
    kept.push(c);
  }
  // Never rest below three chips.
  while (kept.length < 3 && kept.length < list.length) {
    const back = list.find((c) => !kept.includes(c));
    if (!back) break;
    kept.push(back);
  }

  const prev = (mem?.prevPlace ?? '').toLowerCase();
  const ranked = kept
    .map((c, i) => ({ c, i, s: chipProgressScore(state, c) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map(({ c }) => {
      const dest = travelDest(c);
      return dest && samePlace(dest.toLowerCase(), prev) && !/^go back to\b/i.test(c) ? `Go back to ${dest}` : c;
    });
  if (ranked.join('|') !== choices.join('|')) notes.push('Anti-circling rank');
  return { choices: ranked, notes };
}
