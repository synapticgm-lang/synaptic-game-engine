/** q72 — SCENE block + per-place visit log. Budget: SCENE <=200 tok; scene part <=300. */
import { isSystemWindowLabel } from './chromeAuthority';
import { presentNpcRecords, sheetMemoryLine } from './npcRecords';
import { exitPlaceNames } from './placeNames';
import { playerCommittedTravel } from './travelAuthority';
import type { GameState, PlaceVisitLog, TimelineFact } from './types';

const WS = /\s+/g;
const CAP = 8;

export function tokensOf(text: string): number { return Math.ceil((text ?? '').length / 4); }
function clip(s: string, n: number): string {
  const w = s.replace(WS, ' ').trim().split(' ').filter(Boolean);
  return w.length <= n ? w.join(' ') : w.slice(0, n).join(' ');
}
function placeOf(state: GameState) {
  const here = (state.currentLocation ?? '').trim();
  return (state.places ?? []).find((p) => p.name.toLowerCase() === here.toLowerCase() || (p.aliases ?? []).some((a) => a.toLowerCase() === here.toLowerCase()));
}
function people(state: GameState): Array<{ id: string; name: string }> {
  const out: Array<{ id: string; name: string }> = [];
  const seen = new Set<string>();
  const here = (state.currentLocation ?? '').trim().toLowerCase();
  const push = (id: string, name: string) => { const k = name.toLowerCase(); if (!name || seen.has(k)) return; seen.add(k); out.push({ id, name }); };
  const left = new Set((state.npcMemories ?? []).filter((m) => m.shouldExit).map((m) => m.npcName.toLowerCase()));
  for (const m of state.npcMemories ?? []) {
    if (m.shouldExit) continue;
    if ((m.location ?? '').trim().toLowerCase() === here || (state.sceneFacts?.present ?? []).some((p) => p.toLowerCase() === m.npcName.toLowerCase())) push(m.npcId, m.npcName);
  }
  for (const p of state.sceneFacts?.present ?? []) {
    if (!castNameIsOnePerson(p)) continue;
    if (!left.has(p.toLowerCase()) && !seen.has(p.toLowerCase())) push(`present:${p.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, p);
  }
  const card = state.openingEstablishment?.card;
  const where = (state.openingEstablishment?.answers?.where ?? '').replace(WS, ' ').trim().toLowerCase();
  const travelled = (state.log ?? []).some((e) => e.role === 'player' && playerCommittedTravel(e.content));
  const still = !travelled && (state.openingEstablishment?.complete !== true || (!!where && where === here));
  if (still && card) {
    for (const n of [card.cast, ...(card.castNames ?? [])]) {
      // A group label is who is present, not one person who can be quoted.
      if (n && castNameIsOnePerson(n) && !left.has(n.toLowerCase())) {
        push(`cast:${n.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, n);
      }
    }
  }
  return out.slice(0, CAP);
}

/**
 * Companions the presence record already seats.
 * Hit points are not absence: 0 does not say dead versus unconscious.
 * A memory with no location is seated only when the scene's present list already names them.
 */
function companionsHere(state: GameState): Array<{ name: string; animal: boolean }> {
  const seated = new Set(presentNpcRecords(state).map((m) => m.npcName.toLowerCase()));
  const listed = new Set((state.sceneFacts?.present ?? []).map((n) => n.trim().toLowerCase()));
  const out: Array<{ name: string; animal: boolean }> = [];
  for (const c of state.companions ?? []) {
    const name = (c?.name ?? '').trim();
    if (!name || !seated.has(name.toLowerCase())) continue;
    const mem = (state.npcMemories ?? []).find(
      (m) => m.npcName.toLowerCase() === name.toLowerCase() || (m.aliases ?? []).some((a) => a.toLowerCase() === name.toLowerCase()),
    );
    if (!mem) continue;
    if (!(mem.location ?? '').trim() && !listed.has(name.toLowerCase())) continue;
    out.push({ name, animal: c.type === 'beast' || c.type === 'mount' });
  }
  return out;
}
/** Matches slotNamesOnePerson. Kept local so the edge copy does not import the client opener. */
function castNameIsOnePerson(part: string): boolean {
  const words = part.replace(WS, ' ').trim().replace(/^(?:the|a|an)\s+/i, '').split(' ');
  if (!words[0] || /^(?:two|three|four|five|several|some|many|both|\d+)$/i.test(words[0])) return false;
  const stop = words.findIndex(
    (w, i) => i > 0 && /^(?:on|at|in|of|who|with|from|behind|beside|by|near|already|that|which|plus|for|to)$/i.test(w)
  );
  const head = (stop > 0 ? words.slice(0, stop) : words).slice(-1)[0] ?? '';
  if (/^[A-Z]/.test(head)) return true;
  return !/[^s]s$/i.test(head);
}
function keyVisit(f: TimelineFact): boolean {
  if (!f.verb) return /person:|quest |gained item|died|met:|accepted:|step:|done:|failed:/i.test(f.text);
  return f.kind === 'person' || f.kind === 'quest' || f.kind === 'item' || f.verb === 'died' || f.verb === 'met' || f.verb === 'accepted' || f.verb === 'step' || f.verb === 'done' || f.verb === 'failed' || f.verb === 'said' || f.verb === 'gained' || f.verb === 'lost' || f.verb === 'cleared' || f.verb === 'opened' || f.verb === 'sprung' || f.verb === 'found';
}

/** Merge repeated/minor events — never drop people / quest steps / items / deaths. */
export function mergeVisitEvents(events: TimelineFact[]): TimelineFact[] {
  const key: TimelineFact[] = [];
  const minor = new Map<string, { sample: TimelineFact; n: number }>();
  for (const f of events) {
    if (keyVisit(f)) { key.push(f); continue; }
    const k = `${f.verb ?? f.kind}:${(f.name ?? f.text).toLowerCase()}`;
    const prev = minor.get(k);
    if (prev) prev.n += 1; else minor.set(k, { sample: f, n: 1 });
  }
  const out = [...key];
  for (const { sample, n } of minor.values()) {
    if (n <= 1) out.push(sample);
    else out.push({ ...sample, detail: `${n}×`, text: sample.verb && sample.name ? `${sample.verb}: ${n} ${sample.name}` : `${n}× ${sample.name ?? sample.text}` });
  }
  out.sort((a, b) => a.turn - b.turn || a.at - b.at);
  return out;
}

/**
 * Stay inside `limit` by dropping compressed minor events.
 * People met, quest steps, items gained or lost, and deaths are never dropped.
 */
export function compressVisitLog(events: TimelineFact[], limit = 220): string {
  const merged = mergeVisitEvents(events);
  const keyBits: string[] = [];
  const minorBits: string[] = [];
  for (const f of merged) {
    let bit = '';
    if (f.verb === 'said' && f.name && f.detail) bit = `${f.name} said ${clip(f.detail, keyVisit(f) ? 6 : 4)}`;
    else if (f.verb && f.name) bit = `${f.verb} ${f.name}${f.detail && f.verb === 'step' ? ` ${f.detail}` : ''}`;
    else if (f.text) bit = clip(f.text.replace(/^[^:]+:\s*/, ''), keyVisit(f) ? 8 : 6);
    if (!bit) continue;
    (keyVisit(f) ? keyBits : minorBits).push(bit);
  }
  while (minorBits.length && [...keyBits, ...minorBits].join('; ').length > limit) minorBits.pop();
  let text = [...keyBits, ...minorBits].join('; ');
  if (text.length > limit && keyBits.length) {
    const room = Math.max(12, Math.floor(limit / keyBits.length) - 2);
    const clipped: string[] = [];
    for (const b of keyBits) clipped.push(b.length <= room ? b : b.slice(0, room).trim());
    text = clipped.join('; ');
  }
  return text || '(quiet stay)';
}

/** Words for a callback match: punctuation and line breaks are not part of a word. */
function callbackWords(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9']+/g, ' ').split(/\s+/).filter(Boolean);
}

function hasWordRun(hay: string[], needle: string[]): boolean {
  if (!needle.length || hay.length < needle.length) return false;
  for (let i = 0; i <= hay.length - needle.length; i++) {
    let same = true;
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) {
        same = false;
        break;
      }
    }
    if (same) return true;
  }
  return false;
}

/**
 * People the SCENE block may quote. Same list formatSceneBlock prints as PRESENT.
 */
function scenePresentPeople(state: GameState): Array<{ id: string; name: string }> {
  const meetingName = (state.journey?.encounter?.name ?? '').trim();
  const present: Array<{ id: string; name: string }> = [];
  for (const p of people(state)) {
    if (meetingName && p.name.toLowerCase() === meetingName.toLowerCase()) continue;
    present.push(p);
  }
  const withYou = companionsHere(state);
  for (let i = present.length - 1; i >= 0; i--) {
    const name = present[i]!.name.toLowerCase();
    if (withYou.some((c) => c.animal && c.name.toLowerCase() === name)) present.splice(i, 1);
  }
  for (const c of withYou) {
    if (c.animal || present.some((p) => p.name.toLowerCase() === c.name.toLowerCase())) continue;
    if (present.length >= CAP) break;
    present.push({ id: `companion:${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name: c.name });
  }
  return present;
}

/**
 * A stored quote the last-three SAID lines no longer show, when this turn's own words
 * repeat its first four complete words at least eight turns later. At most two lines,
 * and only from people present in the scene. A named person is kept ahead of an unnamed one.
 */
export function recalledSaidLines(state: GameState, playerInput: string): string[] {
  const turn = state.turn ?? 0;
  const ask = callbackWords(playerInput ?? '');
  if (!ask.length) return [];
  const here = new Set(scenePresentPeople(state).map((p) => p.name.toLowerCase()));
  const hits: { line: string; named: boolean }[] = [];
  for (const m of state.npcMemories ?? []) {
    if (!here.has(m.npcName.toLowerCase())) continue;
    const said = (m.said ?? []).filter((s, i, all) => all.findIndex((o) => o.line === s.line) === i);
    const shown = new Set(said.slice(-3).map((s) => s.line));
    const named = hasWordRun(ask, callbackWords(m.npcName));
    for (const s of said) {
      if (shown.has(s.line) || turn - s.turn < 8) continue;
      const words = callbackWords(s.line);
      if (words.length < 4 || !hasWordRun(ask, words.slice(0, 4))) continue;
      const quote = s.line.replace(WS, ' ').trim();
      hits.push({
        named,
        line: `RECALLED: ${m.npcName} already said (${s.topic}, T${s.turn}): "${quote}"`,
      });
    }
  }
  hits.sort((a, b) => Number(b.named) - Number(a.named));
  return hits.slice(0, 2).map((hit) => hit.line);
}

export function formatSceneBlock(state: GameState): string {
  const turn = state.turn ?? 0;
  const place = (state.currentLocation ?? 'somewhere').replace(WS, ' ').trim() || 'somewhere';
  const pl = placeOf(state);
  const kind = state.activeDungeon ? 'dungeon' : state.journey ? 'road' : pl?.settlementKind || (pl?.roadCamp ? 'camp' : 'place');
  const meetingName = (state.journey?.encounter?.name ?? '').trim();
  const present = scenePresentPeople(state);
  const withYou = companionsHere(state);
  const creatures: string[] = [];
  if (state.activeEncounter?.name) creatures.push(`${state.activeEncounter.name} (foe)`);
  for (const c of withYou) {
    if (!c.animal || creatures.length >= CAP) continue;
    if (creatures.some((line) => line.toLowerCase().startsWith(c.name.toLowerCase()))) continue;
    creatures.push(c.name);
  }
  for (const rec of Object.values(state.entityRecords ?? {})) {
    if (rec.kind !== 'creature' || creatures.length >= CAP) continue;
    if (rec.place && state.currentLocation && rec.place.toLowerCase() !== state.currentLocation.toLowerCase()) continue;
    if (creatures.some((c) => c.toLowerCase().startsWith(rec.name.toLowerCase()))) continue;
    creatures.push(rec.notes[0] ? `${rec.name} (${rec.notes[0]})` : rec.name);
  }
  const items: string[] = [];
  for (const p of (state.sceneFacts?.props ?? []).slice(0, CAP)) {
    if (state.systemHousing && isSystemWindowLabel(p)) continue;
    items.push(p);
  }
  for (const rec of Object.values(state.entityRecords ?? {})) {
    if (rec.kind !== 'item' || items.length >= CAP) continue;
    if ((state.inventory ?? []).some((i) => (i.name ?? '').toLowerCase() === rec.name.toLowerCase())) continue;
    if (items.some((i) => i.toLowerCase().startsWith(rec.name.toLowerCase()))) continue;
    items.push(rec.notes[0] ? `${rec.name} (${rec.notes[0]})` : rec.name);
  }
  for (const it of (state.inventory ?? []).slice(0, 2)) {
    if (items.length >= CAP) break;
    if (items.some((i) => i.toLowerCase().startsWith(it.name.toLowerCase()))) continue;
    items.push(`${it.name} (yours)`);
  }
  const exitLabels: string[] = [];
  for (const e of exitPlaceNames(state).slice(0, CAP)) exitLabels.push(`${e} (road)`);
  const said: string[] = [];
  for (const p of present) {
    const m = (state.npcMemories ?? []).find((n) => n.npcId === p.id || n.npcName.toLowerCase() === p.name.toLowerCase());
    const told = (m?.said ?? []).filter((s, i, all) => all.findIndex((o) => o.line === s.line) === i).slice(-3);
    for (const s of told) said.push(`${p.name} already said (${s.topic}, T${s.turn}): "${s.line}"`);
  }
  for (const f of [...(state.placeVisitLog?.events ?? []), ...(state.timeline ?? [])].slice(-20)) {
    if (f.kind !== 'said' || !f.name || !f.detail) continue;
    if (!said.some((o) => o.toLowerCase().startsWith(f.name!.toLowerCase() + ':'))) said.push(`${f.name}: ${clip(f.detail, 15)}`);
  }
  const recent: string[] = [];
  for (const f of state.timeline ?? []) {
    if (f.verb && f.name) {
      const body = f.verb === 'said' ? `${f.name}` : f.verb === 'step' ? `${f.name}${f.detail ? ` ${f.detail}` : ''}` : `${f.name}${f.detail ? `, ${f.detail}` : ''}`;
      recent.push(`T${f.turn} ${f.verb}: ${body}`);
    } else if ((f.kind === 'damage' || f.kind === 'heal') && f.name && f.detail && /^\d+$/.test(f.detail)) {
      recent.push(`T${f.turn} ${f.kind}: ${f.name}, ${f.detail}`);
    }
  }
  const recentShown = recent.slice(-6);
  const presentLabels: string[] = [];
  const known: string[] = [];
  for (const p of present) {
    const mem = (state.npcMemories ?? []).find((n) => n.npcId === p.id || n.npcName.toLowerCase() === p.name.toLowerCase());
    presentLabels.push(`${p.name} (person)`);
    const memory = mem ? sheetMemoryLine(mem, state.character?.name) : '';
    if (memory) known.push(memory);
  }
  const lines = [
    `SCENE T${turn} - ${place} (${kind})`,
    `PRESENT: ${presentLabels.length ? presentLabels.join(', ') : '(none)'}`,
    `Only PRESENT people${meetingName ? ' and the live road EVENT' : ''} may speak; anyone else may be mentioned or remembered, never quoted or voiced.`,
    `CREATURES: ${creatures.length ? creatures.join(', ') : '(none)'}`,
    `ITEMS: ${items.length ? items.join(', ') : '(none)'}`,
    `EXITS: ${exitLabels.length ? exitLabels.join(', ') : '(none)'}`,
    `SAID: ${said.length ? said.slice(0, CAP).join('; ') : '(none)'}`,
    `RECENT: ${recentShown.length ? recentShown.join(' | ') : '(none)'}`,
  ];
  if (meetingName) lines.push(`EVENT: ${meetingName} (meeting on the road)`);
  if (known.length) lines.push(`KNOWN: ${known.slice(0, 4).join(' | ')}`);
  const ledger = pl?.sceneLedger;
  if (ledger?.promises?.length) {
    for (const p of ledger.promises.slice(0, 4)) lines.push(`promise: ${clip(p, 16)}`);
  }
  const log = state.placeVisitLog;
  if (log?.events.length) {
    const bits = compressVisitLog(log.events, 280);
    if (bits) lines.push(`HERE SO FAR (${log.placeName}, since T${log.sinceTurn}): ${bits}`);
  }
  if (pl?.lastVisitSummary && pl.lastVisitTurns) lines.push(`LAST VISIT (T${pl.lastVisitTurns.from}-T${pl.lastVisitTurns.to}): ${pl.lastVisitSummary}`);
  return lines.join('\n');
}

export function formatSceneBlockTokens(state: GameState): number { return tokensOf(formatSceneBlock(state)); }
export function scenePartTokens(state: GameState): number { return formatSceneBlockTokens(state); }

export function ensurePlaceVisit(state: GameState): GameState {
  const place = (state.currentLocation ?? '').replace(WS, ' ').trim();
  if (!place) return state;
  const placeId = placeOf(state)?.id ?? `place:${place.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const log = state.placeVisitLog;
  if (log && log.placeId === placeId) return state;
  let next = log ? leavePlaceVisit(state) : state;
  const visit: PlaceVisitLog = { placeId, placeName: place, sinceTurn: next.turn ?? 0, events: [] };
  return { ...next, placeVisitLog: visit };
}

export function appendVisitEvent(state: GameState, fact: TimelineFact): GameState {
  const withPlace = ensurePlaceVisit(state);
  const log = withPlace.placeVisitLog;
  if (!log) return withPlace;
  return { ...withPlace, placeVisitLog: { ...log, events: [...log.events, fact] } };
}

export function leavePlaceVisit(state: GameState): GameState {
  const log = state.placeVisitLog;
  if (!log || !log.events.length) return { ...state, placeVisitLog: null };
  const summary = compressVisitLog(log.events);
  const to = state.turn ?? log.sinceTurn;
  let places = (state.places ?? []).map((p) => {
    if (p.id !== log.placeId && p.name.toLowerCase() !== log.placeName.toLowerCase()) return p;
    return { ...p, lastVisitSummary: summary, lastVisitTurns: { from: log.sinceTurn, to }, lastVisitedTurn: to };
  });
  // A visit summary stamps a place the map already has. A road label or a dungeon room is not a new place card.
  return { ...state, places, placeVisitLog: null };
}

export function formatRefRecords(state: GameState, referencedIds: string[]): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const raw of referencedIds) {
    if (lines.length >= 3) break;
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const person = (state.npcMemories ?? []).find((m) => m.npcId === id);
    if (person) {
      const memory = sheetMemoryLine(person, state.character?.name);
      const job = person.sheet?.job ? `(${person.sheet.job})` : '';
      const facts = (person.facts ?? []).filter((f) => !person.sheet?.secret || f !== person.sheet.secret).slice(-2).join('; ');
      let body = [person.npcName, job, person.disposition ? `disp ${person.disposition}` : '', person.location ? `at ${person.location}` : '', facts, memory].filter(Boolean).join(' | ');
      if (tokensOf(body) > 60) body = body.slice(0, 240);
      lines.push(`REF ${id}: ${body}`);
      continue;
    }
    const rec = state.entityRecords?.[id];
    if (rec) {
      let body = `${rec.kind} ${rec.name} | first T${rec.firstTurn} last T${rec.lastTurn}${rec.place ? ` @ ${rec.place}` : ''}${rec.notes.length ? ` | ${rec.notes.slice(-2).join('; ')}` : ''}`;
      if (tokensOf(body) > 60) body = body.slice(0, 240);
      lines.push(`REF ${id}: ${body}`);
    }
  }
  return lines.join('\n');
}

export function mentionFromScene(state: GameState): string[] {
  const names: string[] = [];
  const push = (n: string) => { const t = n.replace(WS, ' ').trim(); if (t && !names.some((x) => x.toLowerCase() === t.toLowerCase())) names.push(t); };
  push(state.currentLocation ?? '');
  for (const p of people(state)) push(p.name);
  for (const p of state.sceneFacts?.props ?? []) {
    if (state.systemHousing && isSystemWindowLabel(p)) continue;
    push(p);
  }
  for (const e of placeOf(state)?.exits ?? []) push(e);
  return names;
}
