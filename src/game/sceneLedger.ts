/**
 * Order M — scene ledger stamp + exit/leapfrog. Never calls closeDungeon.
 */
import type { GameState, PlaceRecord, SceneLedger, ScenePrevious, TimelineFact } from './types';
import { dungeonRoomPlace, dungeonTitle, placeIdFromName, resolvePlace } from './places';
import { activeHereSpot } from './hereSpot';
import { presentNpcRecords } from './npcRecords';
import { splitProseSentences } from './proseSentences';
import { isRoadLabel, isTripHere } from './travelJourney';
import { placesDiffer } from './sceneContextTail';
import { mergeTimeline } from './timeline';
import { commitmentLine, openCommitmentsFor } from './stateTx';
import { registerPlayablePlace } from './outdoorHubs';

const SAID_CAP = 40;
const DESCRIBED_CAP = 24;
const DUNGEON_CARD = 'dungeon-card';

/** Scene exit / leapfrog before stamp. Never closeDungeon. Travel is its own scene. */
export function advanceSceneLedger(before: GameState, after: GameState): GameState {
  const from = (dungeonRoomPlace(before, before.currentLocation) ?? before.currentLocation ?? '').trim();
  const to = (dungeonRoomPlace(after, after.currentLocation) ?? after.currentLocation ?? '').trim();
  const leftDungeon = !!before.activeDungeon && !after.activeDungeon;
  const moved = placesDiffer(from, to);
  if (!moved && !leftDungeon) return after;
  if (!from && !to) return after;

  const turn = after.turn ?? before.turn ?? 0;
  let places = [...(after.places ?? [])];
  let previous = after.scenePrevious;
  let timeline = after.timeline;
  const fromIsRoad = !!from && (isRoadLabel(from) || isTripHere(before, from));
  const toIsRoad = !!to && (isRoadLabel(to) || isTripHere(after, to));

  const fromKey = from || to;
  const leftRow =
    (!fromIsRoad && from
      ? resolvePlace(places, from) ?? resolvePlace(before.places ?? [], from)
      : undefined) ??
    (leftDungeon && !moved
      ? resolvePlace(places, to) ?? resolvePlace(before.places ?? [], to)
      : undefined);

  let leftCompact: ScenePrevious | undefined;
  if (leftRow?.sceneLedger) {
    const ledger = leftRow.sceneLedger;
    const label = leftRow.name || fromKey;
    const asked: ScenePrevious['asked'] = [];
    for (const a of ledger.asked) if (!a.answered) asked.push(a);
    const bits: string[] = [];
    if (ledger.promises[0]) bits.push('promise open');
    if (ledger.threats[0]) bits.push('threat');
    if (ledger.clues[0]) bits.push('clue');
    if (asked[0]) bits.push('ask open');
    leftCompact = {
      label,
      promises: [...ledger.promises],
      threats: [...ledger.threats],
      clues: [...ledger.clues],
      asked,
      names: ledger.present.slice(0, 8),
      summary: bits.length ? `Left ${label}: ${bits.join(', ')}` : `Left ${label}`,
    };
    const condensed: SceneLedger = {
      openedTurn: turn,
      said: [],
      described: [],
      promises: [...ledger.promises],
      threats: [...ledger.threats],
      clues: [...ledger.clues],
      asked: [...ledger.asked],
      present: [...ledger.present],
      spot: '',
    };
    const next: PlaceRecord[] = [];
    let hit = false;
    for (const p of places) {
      if (p.id === leftRow.id) {
        hit = true;
        next.push({ ...p, sceneLedger: condensed, arcSummary: leftCompact.summary });
      } else next.push(p);
    }
    if (!hit) next.push({ ...leftRow, sceneLedger: condensed, arcSummary: leftCompact.summary });
    places = next;
  }

  const arrivingFromRoad = fromIsRoad && !!to && !toIsRoad;
  if (arrivingFromRoad) {
    const origin = previous ?? leftCompact;
    if (origin) {
      previous = {
        ...origin,
        label: `${origin.label} + road to ${to}`,
        summary: origin.summary.includes('road') ? origin.summary : `${origin.summary}; via road`,
      };
    }
  } else {
    if (previous) {
      const at = Date.now();
      const facts: TimelineFact[] = [];
      const texts: string[] = [previous.summary];
      for (const p of previous.promises) texts.push(`scene promise: ${p}`);
      for (const t of previous.threats) texts.push(`scene threat: ${t}`);
      for (const c of previous.clues) texts.push(`scene clue: ${c}`);
      for (const a of previous.asked) texts.push(`scene ask: ${a.q}`);
      for (const n of previous.names) texts.push(`scene met: ${n}`);
      for (const text of texts) {
        let cleaned = '';
        let gap = false;
        for (const ch of text) {
          if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
            if (cleaned && !gap) {
              cleaned += ' ';
              gap = true;
            }
          } else {
            cleaned += ch;
            gap = false;
          }
        }
        cleaned = cleaned.trim();
        if (!cleaned) continue;
        let dup = false;
        for (const f of facts) if (f.text === cleaned) dup = true;
        if (dup) continue;
        facts.push({ id: crypto.randomUUID(), turn, kind: 'scene', text: cleaned, at });
      }
      timeline = mergeTimeline(timeline, facts);
    }
    previous = leftCompact;
  }

  return { ...after, places, scenePrevious: previous, timeline };
}

/** Stamp the current place's ledger from engine records + accepted beat. */
export function stampSceneLedger(state: GameState, narrative: string, maskRefs: readonly string[] = []): GameState {
  const loc = (dungeonRoomPlace(state, state.currentLocation) ?? state.currentLocation ?? '').trim();
  if (!loc || isRoadLabel(loc) || isTripHere(state, loc)) return state;
  // q49-MAP: register HERE through the same place-card / atlas path before stamping the ledger.
  const registered = registerPlayablePlace(state, loc);
  let places = [...(registered.places ?? [])];
  let place = resolvePlace(places, loc);
  if (!place) {
    const row: PlaceRecord = { id: placeIdFromName(loc), name: loc };
    places = [...places, row];
    place = row;
  }
  state = { ...registered, places };
  const prev = place.sceneLedger;
  const turn = state.turn ?? prev?.openedTurn ?? 0;
  const reopening = !!prev && !prev.said.length && !prev.described.length;
  const locKey = loc.toLowerCase();

  const present: string[] = [];
  const seen = new Set<string>();
  const push: string[] = [];
  for (const p of state.sceneFacts?.present ?? []) push.push(p);
  for (const r of presentNpcRecords(state)) push.push(r.npcName);

  const clues = [...(prev?.clues ?? [])];
  const d = state.activeDungeon;
  const title = dungeonTitle(d?.dungeonName).toLowerCase();
  const site = (d?.siteName ?? '').trim().toLowerCase();
  if (d && d.blueprintId === DUNGEON_CARD && (title === locKey || site === locKey)) {
    let node: (typeof d.nodes)[number] | undefined;
    for (const n of d.nodes) if (n.id === d.currentNodeId) node = n;
    for (const m of node?.hidden?.mobs ?? []) if (!m.defeated) push.push(m.name);
    for (const s of node?.hidden?.secrets ?? []) {
      const clue = (s.revealed ? s.clue : '')?.trim() ?? '';
      if (clue && !clues.includes(clue)) clues.push(clue);
    }
  }
  for (const name of push) {
    const t = name.trim();
    const k = t.toLowerCase();
    if (!t || k === 'bystanders' || seen.has(k)) continue;
    seen.add(k);
    present.push(t);
  }

  const said = [...(prev?.said ?? [])];
  for (const m of state.npcMemories ?? []) {
    if (!seen.has(m.npcName.trim().toLowerCase())) continue;
    for (const line of m.said ?? []) {
      const text = line.line.trim();
      if (text && !said.includes(text)) said.push(text);
    }
  }

  const threats: string[] = [];
  const asked: SceneLedger['asked'] = [];
  for (const c of state.campaignMemory?.consequences ?? []) {
    const text = c.text.trim();
    const low = text.toLowerCase();
    if (low.startsWith('open ask')) asked.push({ q: text, answered: !c.unresolved });
    else if (low.startsWith('open thread') && (low.includes('threat') || low.includes('warn'))) threats.push(text);
  }
  const owedTo = [...present];
  for (const n of state.scenePrevious?.names ?? []) owedTo.push(n);
  const promises: string[] = [];
  for (const c of openCommitmentsFor(state, owedTo)) promises.push(commitmentLine(c));

  const described = [...(prev?.described ?? [])];
  for (const raw of splitProseSentences(narrative ?? '')) {
    for (const q of ['"', '“'] as const) {
      const open = raw.indexOf(q);
      if (open < 0) continue;
      const closeCh = q === '"' ? '"' : '”';
      const close = raw.indexOf(closeCh, open + 1);
      if (close <= open + 12) continue;
      const text = raw.slice(open + 1, close).trim();
      if (text.length >= 12 && !said.includes(text)) said.push(text);
      break;
    }
    let line = '';
    let gap = false;
    for (const ch of raw) {
      if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
        if (line && !gap) {
          line += ' ';
          gap = true;
        }
      } else {
        line += ch;
        gap = false;
      }
    }
    line = line.trim();
    if (line.length < 12) continue;
    let masked = line;
    for (const ref of maskRefs) {
      const needle = ref.trim().toLowerCase();
      if (needle.length < 3) continue;
      const low = masked.toLowerCase();
      let at = low.indexOf(needle);
      if (at < 0) continue;
      let out = '';
      let from = 0;
      while (at >= 0) {
        out += masked.slice(from, at);
        from = at + needle.length;
        at = low.indexOf(needle, from);
      }
      masked = (out + masked.slice(from)).trim();
    }
    let key = '';
    gap = false;
    for (const ch of masked.toLowerCase()) {
      if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
        if (key && !gap) {
          key += ' ';
          gap = true;
        }
      } else {
        key += ch;
        gap = false;
      }
    }
    key = key.trim().slice(0, 48);
    if (!key) continue;
    let dup = false;
    for (const row of described) {
      if (row.key === key || row.line === line) dup = true;
    }
    if (!dup) described.push({ key, line });
  }
  while (said.length > SAID_CAP) said.shift();
  while (described.length > DESCRIBED_CAP) described.shift();

  const spot = activeHereSpot(state)?.spot ?? prev?.spot ?? '';
  const sceneLedger: SceneLedger = {
    openedTurn: reopening ? turn : (prev?.openedTurn ?? turn),
    said,
    promises,
    threats,
    clues,
    asked,
    present,
    described,
    spot,
  };
  const nextPlaces = [];
  for (const p of places) nextPlaces.push(p.id === place.id ? { ...p, sceneLedger } : p);
  return { ...state, places: nextPlaces };
}
