/**
 * Order M steps 1–2 — the scene ledger on the current PlaceRecord.
 * Written by the engine from records that already exist. No model summary.
 * The dungeon card stays the room store; this reads its current room into present and clues.
 */
import type { GameState, SceneLedger } from './types';
import { dungeonRoomPlace, dungeonTitle, resolvePlace } from './places';
import { activeHereSpot } from './hereSpot';
import { presentNpcRecords } from './npcRecords';
import { handedRefs } from './completedEventPacket';
import { splitProseSentences } from './proseSentences';

const SAID_CAP = 40;
const DESCRIBED_CAP = 24;
const DUNGEON_CARD = 'dungeon-card';

/** Stamp the current place's ledger from this turn's engine records and the accepted beat. */
export function stampSceneLedger(state: GameState, narrative: string): GameState {
  const loc = (dungeonRoomPlace(state, state.currentLocation) ?? state.currentLocation ?? '').trim();
  if (!loc) return state;
  const place = resolvePlace(state.places, loc);
  if (!place) return state;
  const prev = place.sceneLedger;
  const turn = state.turn ?? prev?.openedTurn ?? 0;
  const locKey = loc.toLowerCase();

  const present: string[] = [];
  const seen = new Set<string>();
  const queue: string[] = [];
  for (const p of state.sceneFacts?.present ?? []) queue.push(p);
  for (const r of presentNpcRecords(state)) queue.push(r.npcName);

  const clues = [...(prev?.clues ?? [])];
  const d = state.activeDungeon;
  const title = dungeonTitle(d?.dungeonName).toLowerCase();
  const site = (d?.siteName ?? '').trim().toLowerCase();
  if (d && d.blueprintId === DUNGEON_CARD && (title === locKey || site === locKey)) {
    let node: (typeof d.nodes)[number] | undefined;
    for (const n of d.nodes) if (n.id === d.currentNodeId) node = n;
    for (const m of node?.hidden?.mobs ?? []) if (!m.defeated) queue.push(m.name);
    for (const s of node?.hidden?.secrets ?? []) {
      const clue = (s.revealed ? s.clue : '')?.trim() ?? '';
      if (clue && !clues.includes(clue)) clues.push(clue);
    }
  }
  for (const name of queue) {
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
  while (said.length > SAID_CAP) said.shift();

  const promises: string[] = [];
  const threats: string[] = [];
  const asked: SceneLedger['asked'] = [];
  for (const c of state.campaignMemory?.consequences ?? []) {
    const text = c.text.trim();
    const low = text.toLowerCase();
    if (low.startsWith('open ask')) asked.push({ q: text, answered: !c.unresolved });
    else if (low.startsWith('open thread')) {
      if (low.includes('threat') || low.includes('warn')) threats.push(text);
      else promises.push(text);
    }
  }

  const described = [...(prev?.described ?? [])];
  const refs = handedRefs(state);
  for (const raw of splitProseSentences(narrative ?? '')) {
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
    for (const ref of refs) {
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
  while (described.length > DESCRIBED_CAP) described.shift();

  const spot = activeHereSpot(state)?.spot ?? prev?.spot ?? '';
  const sceneLedger: SceneLedger = {
    openedTurn: prev?.openedTurn ?? turn,
    said,
    promises,
    threats,
    clues,
    asked,
    present,
    described,
    spot,
  };
  const places = [];
  for (const p of state.places ?? []) places.push(p.id === place.id ? { ...p, sceneLedger } : p);
  return { ...state, places };
}
