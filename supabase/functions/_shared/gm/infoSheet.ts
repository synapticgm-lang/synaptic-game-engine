/**
 * 29z9i — the info sheet: a diary the writer reads instead of raw recent turns.
 * Code writes every line from committed state and the turn record (log roles, engine receipts,
 * npc records, quests, the live fight). Never from a model summary, so it cannot invent a fact.
 * Sections: NOW, LAST, HERE, PEOPLE, PLACES, SCENE, FACTS, ASKED, OPEN. Newest first; old lines drop.
 */

import type { GameState, LogEntry, NpcMemory, SceneLedger } from './types.ts';
import { isSystemWindowLabel, realPresentPeople } from './chromeAuthority.ts';
import { presentNpcNames } from './npcRelationships.ts';
import { hallTalkTopics, openingCastNames, openingCastNote, openingCastStillHere, type HallTalkTopic } from './openingEstablishment.ts';
import { placeScale } from './placeAuthority.ts';
import { exitPlaceNames } from './placeNames.ts';
import { playerFacingLocation } from './locationName.ts';
import { writerFacts } from './systemHousing.ts';
import { openRouteView } from './questRoutes.ts';
import { activeHereSpot, isOutOfTalkingRange } from './hereSpot.ts';
import { isChromeReceipt } from './engineResult.ts';
import { crowdHere } from './sceneFacts.ts';
import { roadMeetingOnBeat, writerTravelFact } from './travelJourney.ts';
import { dungeonRoomPlace, resolvePlace } from './places.ts';

/** A receipt as the writer reads it: a travel receipt keeps only where to and a plain time fact. */
const writerReceipt = (r: string) => writerTravelFact(r) ?? r;

/**
 * Tabletop moves its quest by the step chips (tabletopQuestProgress), never by the writer, so the quest
 * record (title, step text, quest and XP receipts) stays off the writer's sheet there.
 */
const questRecordHidden = (state: GameState) => state.engineMode === 'dnd';

/** About 50 lines; SCENE (~600 chars) lives inside the raised char cap (Order M step 3). */
export const INFO_SHEET_LINE_CAP = 50;
export const INFO_SHEET_CHAR_CAP = 2000;
/** SCENE block budget inside the info sheet (Order M step 3). */
export const SCENE_CHAR_BUDGET = 600;
/** Previous slot budget inside SCENE (Order M step 6; ~1/3 of SCENE). */
export const PREVIOUS_CHAR_BUDGET = 200;

const LAST_CAP = 3;
const PEOPLE_CAP = 5;
const FACTS_CAP = 6;

const norm = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** The ledger on the place the camera is in right now. */
export function currentSceneLedger(state: GameState): SceneLedger | undefined {
  const loc = (dungeonRoomPlace(state, state.currentLocation) ?? state.currentLocation ?? '').trim();
  if (!loc) return undefined;
  return resolvePlace(state.places, loc)?.sceneLedger;
}

/**
 * Compact SCENE rows: Current (full) + Previous (pinned, ≤200). Oldest described drop first.
 */
export function formatSceneLedgerBlock(state: GameState): string[] {
  const previous: string[] = [];
  const prev = state.scenePrevious;
  if (prev) {
    const prevRows: string[] = [`prev: ${clip(prev.label, 60)}`];
    if (prev.summary) prevRows.push(`prev-sum: ${clip(prev.summary, 70)}`);
    for (const p of prev.promises.slice(0, 2)) prevRows.push(`prev-promise: ${clip(p, 60)}`);
    for (const t of prev.threats.slice(0, 1)) prevRows.push(`prev-threat: ${clip(t, 60)}`);
    for (const a of prev.asked.slice(0, 2)) prevRows.push(`prev-ask: ${clip(a.q, 60)}`);
    for (const c of prev.clues.slice(0, 2)) prevRows.push(`prev-clue: ${clip(c, 60)}`);
    if (prev.names.length) prevRows.push(`prev-met: ${clip(prev.names.slice(0, 4).join(', '), 50)}`);
    for (const row of prevRows) {
      const next = previous.length ? `${previous.join('\n')}\n${row}` : row;
      if (next.length > PREVIOUS_CHAR_BUDGET) break;
      previous.push(row);
    }
  }
  const prevBudget = previous.join('\n').length;
  const currentBudget = Math.max(120, SCENE_CHAR_BUDGET - prevBudget - (previous.length ? 1 : 0));

  const ledger = currentSceneLedger(state);
  if (!ledger && !previous.length) return [];
  const pinned: string[] = [];
  if (ledger) {
    if (ledger.present.length) pinned.push(`here: ${ledger.present.slice(0, 8).join(', ')}`);
    if (ledger.spot) pinned.push(`spot: ${ledger.spot}`);
    for (const p of ledger.promises.slice(0, 4)) pinned.push(`promise: ${clip(p, 80)}`);
    for (const t of ledger.threats.slice(0, 3)) pinned.push(`threat: ${clip(t, 80)}`);
    for (const a of ledger.asked) {
      if (!a.answered) pinned.push(`ask: ${clip(a.q, 80)}`);
      if (pinned.length > 20) break;
    }
    for (const c of ledger.clues.slice(0, 4)) pinned.push(`clue: ${clip(c, 80)}`);
    for (const s of ledger.said.slice(-6)) pinned.push(`said: "${clip(s, 70)}"`);
  }

  const described = [...(ledger?.described ?? [])];
  const rows = () => {
    const out = [...pinned];
    for (const d of described) out.push(`saw: ${clip(d.line, 70)}`);
    return out;
  };
  while (rows().join('\n').length > currentBudget && described.length) described.shift();
  let out = rows();
  while (out.join('\n').length > currentBudget) {
    let drop = -1;
    for (let i = pinned.length - 1; i >= 0; i--) {
      if (pinned[i]!.startsWith('said:')) {
        drop = i;
        break;
      }
    }
    if (drop < 0) break;
    pinned.splice(drop, 1);
    out = rows();
  }
  if (out.join('\n').length > currentBudget) {
    const kept: string[] = [];
    for (const row of out) {
      const next = kept.length ? `${kept.join('\n')}\n${row}` : row;
      if (next.length > currentBudget) break;
      kept.push(row);
    }
    out = kept;
  }
  return previous.length ? [...out, ...previous] : out;
}

const MODE_LABEL: Record<string, string> = {
  litrpg: 'LitRPG',
  dnd: 'tabletop',
  rpg: 'story RPG',
  pyoa: 'PYOA',
};

export interface InfoSheet {
  now: string;
  last: string[];
  here: string[];
  people: string[];
  places: string;
  /** Order M step 3 — current scene ledger; replaces ALREADY ON THE PAGE openers. */
  scene: string[];
  facts: string[];
  asked: string;
  open: string[];
}

/** Completed turns: each player line with the GM reply that answered it. A trailing unanswered line is this turn. */
function completedTurns(state: GameState): { player: LogEntry; gm: LogEntry }[] {
  const log = state.log ?? [];
  const out: { player: LogEntry; gm: LogEntry }[] = [];
  for (let i = 0; i < log.length; i++) {
    const p = log[i];
    if (p?.role !== 'player' || !norm(p.content)) continue;
    const gm = log.slice(i + 1).find((e) => e.role === 'gm' || e.role === 'player');
    if (gm?.role === 'gm') out.push({ player: p, gm });
  }
  return out;
}

/** Warden, commit-gate and pad-cooldown notes are telemetry (`wardenNotes`); older saves still carry them on systemLog. */
const TELEMETRY_NOTE = /^(?:Warden|Commit gate|Cooldown removed|Writer words kept|Paint blocked|Collage (?:strip|reject))\b/i;

/** Engine receipts on a GM entry (code-written STATUS / fight / check lines), never the prose or telemetry. */
function receipts(e: LogEntry): string[] {
  return (e.systemLog ?? [])
    .map(norm)
    .filter((r) => r.length > 2 && !/^status:?$/i.test(r) && !TELEMETRY_NOTE.test(r));
}

/** The receipt LAST shows: the turn's world change first, ledger figures only when nothing changed. */
function lastReceipt(e: LogEntry): string | undefined {
  const all = receipts(e);
  return all.find((r) => !isChromeReceipt(r)) ?? all[0];
}

export function peopleOnSheet(state: GameState): string[] {
  const out = new Map<string, string>();
  const add = (n?: string | null) => {
    const name = norm(n);
    if (name && !out.has(name.toLowerCase())) out.set(name.toLowerCase(), name);
  };
  realPresentPeople(presentNpcNames(state)).forEach(add);
  (state.companions ?? []).forEach((c) => add(c.name));
  add(state.activeEncounter?.name);
  if (!out.size && openingCastStillHere(state)) add(openingCastNames(state)[0]);
  return [...out.values()];
}

function systemWindowSeen(state: GameState): boolean {
  if (state.engineMode !== 'litrpg') return false;
  if ((state.sceneFacts?.props ?? []).some((p) => isSystemWindowLabel(p))) return true;
  return (state.log ?? []).some((e) => !!e.systemWindow);
}

function turnFromFacts(m: NpcMemory): number | null {
  for (const f of m.facts ?? []) {
    const hit = String(f).match(/^(?:Introduced|Seen) in play T(\d+)/i);
    if (hit) return Number(hit[1]);
  }
  return null;
}

function nowLine(state: GameState, people: string[]): string {
  const place = playerFacingLocation(state) || norm(state.currentLocation) || 'unknown place';
  const lock = state.sceneFacts?.cameraLock;
  const lockHere = lock && norm(lock.label).toLowerCase() === norm(state.currentLocation).toLowerCase() ? lock.scale : null;
  const scale = placeScale(state) ?? lockHere ?? 'scale unknown';
  // A road meeting is an event of the trip (ENGINE RESULT), not a head here.
  const meeting = roadMeetingOnBeat(state) ? ' · a meeting on the road' : '';
  const company = `${people.length ? `with ${people.length} here` : crowdHere(state) ? 'crowd here' : 'alone'}${meeting}`;
  const mode = MODE_LABEL[state.engineMode ?? ''] ?? state.engineMode ?? 'mode unknown';
  return `T${state.turn} · ${place} · ${scale} · ${company} · ${mode}`;
}

function lastLines(turns: { player: LogEntry; gm: LogEntry }[], hideRecord: boolean): string[] {
  return turns
    .slice(-LAST_CAP)
    .reverse()
    .map(({ player, gm }) => {
      const raw = lastReceipt(gm);
      const r = raw && !(hideRecord && isChromeReceipt(raw)) ? writerReceipt(raw) : undefined;
      return `T${player.turn} ${clip(norm(player.content), 60)} → ${r ? clip(r, 70) : 'no engine result'}`;
    });
}

function hereLines(state: GameState, people: string[]): string[] {
  const out = [people.length ? people.join(', ') : crowdHere(state) ? 'a crowd, nobody named' : 'nobody'];
  const cast = openingCastStillHere(state) ? openingCastNames(state)[0] : undefined;
  const castNote = cast && people.includes(cast) ? openingCastNote(state) : undefined;
  if (castNote) out.push(`${cast}: ${castNote}`);
  const spot = activeHereSpot(state);
  if (spot) {
    const away = spot.awayFrom.length ? `; out of talking range: ${spot.awayFrom.join(', ')}` : '';
    out.push(`player stands on ${spot.spot} (moved T${spot.turn})${away}`);
  }
  // A housing's rules live on the packet's SYSTEM line; HERE lists things and people.
  if (systemWindowSeen(state) && !state.systemHousing?.housing) {
    out.push('System window: only the player sees it; nobody can touch it; no surface, heat or weight');
  }
  return out;
}

function peopleLines(state: GameState, here: string[]): string[] {
  const hereKeys = new Set(here.map((h) => h.toLowerCase()));
  return (state.npcMemories ?? [])
    .filter((m) => m.met === true || m.introSpoken === true)
    .sort((a, b) => (b.lastSeenTurn ?? 0) - (a.lastSeenTurn ?? 0))
    .slice(0, PEOPLE_CAP)
    .map((m) => {
      const met = turnFromFacts(m);
      const topics = m.completedTopics ?? [];
      const topic = topics[topics.length - 1];
      const said = (m.said ?? []).filter((s, i, all) => all.findIndex((o) => o.line === s.line) === i).slice(-3);
      return [
        m.npcName,
        m.roleHint || m.sheet?.job || '',
        hereKeys.has(m.npcName.toLowerCase())
          ? 'here'
          : isOutOfTalkingRange(state, m.npcName)
            ? `${m.location || 'this place'}, out of talking range`
            : m.location || '',
        met != null ? `met T${met}` : '',
        said.length
          ? said.map((s) => `already said (${s.topic}, T${s.turn}): "${s.line}"`).join(' · ')
          : topic ? `last topic ${topic}` : 'no topic yet',
      ]
        .filter(Boolean)
        .join(' · ');
    });
}

/** The ways out the writer is handed on the PLACES line (the commit gate counts against this same list). */
export function sheetExitNames(state: GameState): string[] {
  return exitPlaceNames(state).map(norm).filter(Boolean).slice(0, 4);
}

function placesLine(state: GameState): string {
  const here = playerFacingLocation(state) || norm(state.currentLocation) || 'unknown place';
  const exits = sheetExitNames(state);
  return exits.length ? `${here} · exits: ${exits.join(', ')}` : `${here} · no named exits`;
}

const FACT_RECEIPT = /\b(?:xp|loot|found|gained|lost|quest|level|fight|flee|parley|check|took|item|gold|killed|defeated|cleared|unlocked|opened)\b/i;


const WEAPONISH = /\b(knife|blade|sword|dagger|axe|club|bat|spear|staff|pistol|gun|bow|mace|weapon)\b/i;

function isWeaponItem(item: { name?: string; itemType?: string }): boolean {
  return item.itemType === 'weapon' || WEAPONISH.test(item.name ?? '');
}

/** Equipped weapon only. An item still in the pack is not in hand. */
export function weaponInHand(state: GameState): string {
  const held = (state.inventory ?? []).filter((i) => i.equipped && isWeaponItem(i));
  return held.length ? held.map((i) => i.name).join(', ') : 'bare hands';
}

/**
 * Writer fact: loot and pack weapons are not the blow.
 * Empty when nothing is carried out of hand.
 */
export function weaponsNotInHand(state: GameState): string[] {
  return (state.inventory ?? []).filter((i) => !i.equipped && isWeaponItem(i)).map((i) => i.name);
}

export function gearAuthorityLine(state: GameState): string {
  const notHeld = weaponsNotInHand(state);
  if (!notHeld.length) return '';
  const names = notHeld.join(', ');
  return `In hand: ${weaponInHand(state)}. Not in hand (do not strike, draw, or land a blow with these): ${names}.`;
}

export function fightLootClause(inHandBefore: string): string {
  return `found after the blow; not in hand before it; not the weapon that won. In hand before the blow: ${inHandBefore}.`;
}

function factLines(state: GameState, turns: { player: LogEntry; gm: LogEntry }[], shownInLast: Set<string>): string[] {
  const facts: { turn: number; text: string }[] = [];
  const kill = state.sceneFacts?.lastKill;
  if (kill?.name && typeof kill.turn === 'number') {
    facts.push({ turn: kill.turn, text: `${kill.name} ${kill.outcome === 'victory' ? 'killed' : kill.outcome ?? 'ended'}` });
  }
  const gear = gearAuthorityLine(state);
  if (gear) facts.push({ turn: state.turn ?? 0, text: gear });
  for (const m of state.npcMemories ?? []) {
    if (m.stance?.cause && typeof m.stance.turn === 'number') {
      facts.push({ turn: m.stance.turn, text: `${m.npcName} ${m.stance.now}: ${m.stance.cause}` });
    }
  }
  const hideRecord = questRecordHidden(state);
  for (const q of hideRecord ? [] : writerFacts(state).quests) {
    if (typeof q.completedTurn === 'number') facts.push({ turn: q.completedTurn, text: `quest ${q.status}: ${q.name}` });
    else if (q.revealed && typeof q.revealedTurn === 'number') facts.push({ turn: q.revealedTurn, text: `quest found: ${q.name}` });
  }
  for (const { gm } of turns.slice(-10)) {
    for (const r of receipts(gm)) {
      if (hideRecord && isChromeReceipt(r)) continue;
      if (FACT_RECEIPT.test(r) && !shownInLast.has(r)) facts.push({ turn: gm.turn, text: clip(writerReceipt(r), 80) });
    }
  }
  const seen = new Set<string>();
  return facts
    .sort((a, b) => b.turn - a.turn)
    .filter((f) => {
      const k = f.text.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, FACTS_CAP)
    .map((f) => `T${f.turn} ${f.text}`);
}

const SPOKEN = /["“][^"”]{2,}["”]|\b(?:answer(?:s|ed)?|repl(?:y|ies|ied)|said|says)\b/i;
const ALWAYS_ASKED: HallTalkTopic[] = ['who', 'want', 'refuse'];
const TOPIC_LABEL: Record<HallTalkTopic, string> = {
  who: 'who',
  want: 'want',
  refuse: 'refuse',
  stayLeave: 'stay/leave',
  panel: 'panel',
  where: 'where',
};

function askedLine(state: GameState, turns: { player: LogEntry; gm: LogEntry }[]): string {
  const marks = new Map<HallTalkTopic, { turn: number; answered: boolean }>();
  for (const { player, gm } of turns) {
    for (const topic of hallTalkTopics(player.content)) {
      const prev = marks.get(topic);
      const answered = SPOKEN.test(gm.content ?? '');
      if (!prev || answered || !prev.answered) marks.set(topic, { turn: player.turn, answered: answered || !!prev?.answered });
    }
  }
  const order: HallTalkTopic[] = ['who', 'want', 'refuse', 'where', 'stayLeave', 'panel'];
  return order
    .filter((t) => ALWAYS_ASKED.includes(t) || marks.has(t))
    .filter((t) => t !== 'panel' || state.engineMode === 'litrpg')
    .map((t) => {
      const m = marks.get(t);
      const label = t === 'panel' && state.systemHousing ? 'system' : TOPIC_LABEL[t];
      if (!m) return `${label} not asked`;
      return `${label} asked T${m.turn}${m.answered ? ', answered' : ', no answer'}`;
    })
    .join(' · ');
}

function openLines(state: GameState): string[] {
  const out: string[] = [];
  const quests = writerFacts(state).quests;
  const quest = questRecordHidden(state)
    ? undefined
    : quests.find((q) => q.status === 'active' && q.revealed && q.type === 'main')
      ?? quests.find((q) => q.status === 'active' && q.revealed);
  if (quest) {
    // RC-N4 — name/giver only; raw objective text stays off the writer packet (player-seen story owns the step).
    const giver = norm(quest.giver ?? '');
    out.push(`quest ${quest.name}${giver ? `, given by ${giver}` : ''}`);
  }
  // TT-G1: remaining discovery routes as facts (not objective prose) so the writer cannot invent or drop them.
  // Always — even when tabletop hides the quest name record (RC-N4): routes are engine facts, not step text.
  {
    const leads = openRouteView(state)?.facts ?? [];
    for (let i = 0; i < leads.length; i++) out.push(leads[i]!);
  }
  const enc = state.activeEncounter;
  if (enc?.name) out.push(`threat ${enc.name}${typeof enc.hp === 'number' && typeof enc.maxHp === 'number' ? ` (${enc.hp}/${enc.maxHp} HP)` : ''}`);
  else if (state.sceneFacts?.pendingEncounter?.name) out.push(`threat building: ${state.sceneFacts.pendingEncounter.name}`);
  if (!out.length) out.push(questRecordHidden(state) ? 'no live threat' : 'no live quest, no live threat');
  return out;
}

export function buildInfoSheet(state: GameState): InfoSheet {
  const turns = completedTurns(state);
  const people = peopleOnSheet(state);
  const last = lastLines(turns, questRecordHidden(state));
  const shownInLast = new Set(turns.slice(-LAST_CAP).map(({ gm }) => lastReceipt(gm)).filter(Boolean) as string[]);
  return {
    now: nowLine(state, people),
    last,
    here: hereLines(state, people),
    people: peopleLines(state, people),
    places: placesLine(state),
    scene: formatSceneLedgerBlock(state),
    facts: factLines(state, turns, shownInLast),
    asked: askedLine(state, turns),
    open: openLines(state),
  };
}

function render(sheet: InfoSheet): string[] {
  const block = (title: string, rows: string[]) => (rows.length ? [`${title}:`, ...rows.map((r) => `- ${r}`)] : [`${title}: none`]);
  // SCENE sits early so the char-cap hard slice cannot drop it (Order M step 3).
  return [
    'INFO SHEET (engine record — every line is a fact; nothing else happened):',
    `NOW: ${sheet.now}`,
    ...block('LAST', sheet.last),
    `PLACES: ${sheet.places}`,
    ...block('FACTS', sheet.facts),
    `ASKED: ${sheet.asked}`,
    ...block('OPEN', sheet.open),
  ];
}

/** The sheet as writer text. HERE / PEOPLE / SCENE stay on the SCENE block, not here again. */
export function formatInfoSheet(state: GameState): string {
  const sheet = buildInfoSheet(state);
  const fits = () => {
    const lines = render(sheet);
    return lines.length <= INFO_SHEET_LINE_CAP && lines.join('\n').length <= INFO_SHEET_CHAR_CAP;
  };
  while (!fits() && sheet.facts.length) sheet.facts.pop();
  while (!fits() && sheet.last.length) sheet.last.pop();
  const text = render(sheet).join('\n');
  return text.length <= INFO_SHEET_CHAR_CAP ? text : text.slice(0, INFO_SHEET_CHAR_CAP);
}
