/**
 * Architecture 1 — Retrospective Narrator (2026-09-08b).
 * Code resolves facts first; the writer only narrates a completed event in past tense.
 * 08b: shrink Title-Case gate; authored stitch; ledger-noun slots only.
 * Classifier-only validation — no Continuity-Warden LLM, no novel-token deny-lists.
 */

import type { GameState, LogEntry } from './types';
import { cleanPlaceLabel, playerFacingLocation } from './locationName';
import { realPresentPeople } from './chromeAuthority';
import { selectRecentLogForContext } from './sceneContextTail';
import { shortRoomLabel } from './mapEngine';
import {
  isDeadFoeReopenedAsLiving,
  matchesLastKillName,
  type LastKill,
} from './combatAuthority';
import { canHarvestAsNamedPerson } from './entityRegistry';

export type EventOutcome =
  | 'killed'
  | 'bloodied'
  | 'hit'
  | 'missed'
  | 'fled'
  | 'caught'
  | 'spoke'
  | 'arrived'
  | 'left'
  | 'inspected'
  | 'looted'
  | 'waited'
  | 'used'
  | 'spawned'
  | 'resolved';

export interface CompletedEventPacket {
  turn: number;
  actor: string;
  verb: string;
  target?: string;
  outcome: EventOutcome;
  damage?: number;
  hp?: { current: number; max: number };
  loot: string[];
  xp: number;
  witnesses: string[];
  location: string;
  lastKill?: LastKill;
  justKilled: boolean;
  combatLive: boolean;
  mood?: string;
  phase?: string;
  allowlist: string[];
  playerAction: string;
  recentBeats: string[];
}

const WRITER_RHYTHM_WINDOW = 2;
const WRITER_RHYTHM_CHAR_CAP = 500;

const TITLE_NAME =
  /\b((?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?\s+){0,2}[A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/g;

/** Sentence-start grammar — not a novel-token list. */
const SENTENCE_STARTERS = new Set([
  'the', 'a', 'an', 'your', 'you', 'then', 'after', 'before', 'when', 'while',
  'but', 'and', 'so', 'now', 'there', 'this', 'that', 'these', 'those', 'its',
  'his', 'her', 'their', 'our', 'my', 'once', 'still', 'next', 'last', 'first',
]);

function bibleIdOf(state: GameState): string | undefined {
  return state.campaignBibleId ?? (state as GameState & { bibleId?: string }).bibleId;
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

function classifyVerb(input: string): string {
  const t = (input ?? '').replace(/\s+/g, ' ').trim();
  if (/\b(attack|fight|strike|engage|press the attack|slash|stab|punch)\b/i.test(t)) return 'attacked';
  if (/\b(flee|run away|escape|retreat)\b/i.test(t)) return 'fled';
  if (/\b(parley|negotiate|talk (?:it|them) down)\b/i.test(t)) return 'parleyed';
  if (/\b(travel|go to|head (?:to|for|toward)|return to|enter)\b/i.test(t)) return 'traveled';
  if (/\b(leave|exit|walk away)\b/i.test(t)) return 'left';
  if (/\b(ask|talk|speak|tell|say|press for|listen)\b/i.test(t)) return 'spoke';
  if (/\b(loot|search the (?:body|corpse)|take from)\b/i.test(t)) return 'looted';
  if (/\b(use|drink|eat|equip|wield|draw)\b/i.test(t)) return 'used';
  if (/\b(inspect|examine|look around|search|scout|check|study|watch)\b/i.test(t)) return 'inspected';
  if (/\b(wait|rest|stay|hold)\b/i.test(t)) return 'waited';
  return 'acted';
}

const INTENT_REMAINDER =
  /^(?:what is going on|a direct question|what they want|what they wanted|with what you are holding|what you are holding|the surroundings|the immediate surroundings|around|the exit|leverage|for leverage|it|them|this|that)$/i;

function isIntentRemainderNoun(raw: string): boolean {
  const t = (raw ?? '').replace(/[.!?]+$/, '').replace(/^(?:the|a|an|with)\s+/i, '').trim();
  if (!t) return true;
  if (INTENT_REMAINDER.test(t)) return true;
  if (/\bwhat (?:is going on|they want|you are holding)\b/i.test(t)) return true;
  if (/\bdirect question\b/i.test(t)) return true;
  return false;
}

function livingLedgerPeople(state: GameState): string[] {
  const kill = state.sceneFacts?.lastKill;
  return realPresentPeople(state.sceneFacts?.present ?? []).filter((n) => !matchesLastKillName(n, kill));
}

function matchLedgerNoun(
  raw: string,
  state: GameState,
  opts: { allowCorpse: boolean }
): string | undefined {
  const t = (raw ?? '').replace(/[.!?]+$/, '').replace(/^(?:the|a|an)\s+/i, '').trim();
  if (!t || isIntentRemainderNoun(t)) return undefined;
  const kill = state.sceneFacts?.lastKill;
  const corpse =
    kill?.name && kill.outcome === 'victory' && kill.remains ? kill.name : undefined;
  const pool = [
    ...livingLedgerPeople(state),
    state.activeEncounter?.name?.trim(),
    opts.allowCorpse ? corpse : undefined,
  ].filter((n): n is string => !!n);
  for (const n of pool) {
    const low = n.toLowerCase();
    const want = t.toLowerCase();
    if (want === low || want.includes(low) || low.includes(want)) return n;
    const last = low.split(/\s+/).pop() ?? '';
    if (last.length >= 4 && (want === last || want.includes(last))) return n;
  }
  return undefined;
}

function extractTarget(input: string, state: GameState): string | undefined {
  const t = (input ?? '').trim();
  const verb = classifyVerb(t);
  const allowCorpse =
    verb === 'looted' || verb === 'inspected' || /\b(body|corpse|loot)\b/i.test(t);
  const named = t.match(
    /\b(?:attack|fight|strike|talk(?:\s+to)?|ask|loot|use|travel(?:\s+to)?|go to|head to|leave|inspect|examine)\s+(?:the\s+)?(.+)$/i
  );
  const raw = (named?.[1] ?? '').replace(/[.!?]+$/, '').trim();
  if (raw) {
    const matched = matchLedgerNoun(raw, state, { allowCorpse: allowCorpse && verb !== 'spoke' });
    if (matched) {
      const kill = state.sceneFacts?.lastKill;
      if (verb === 'spoke' && matchesLastKillName(matched, kill)) {
        return livingLedgerPeople(state)[0];
      }
      return matched;
    }
  }
  const enc = state.activeEncounter?.name?.trim();
  if (enc && (verb === 'attacked' || verb === 'parleyed' || verb === 'fled')) return enc;
  const kill = state.sceneFacts?.lastKill;
  if (kill?.name && allowCorpse && verb !== 'spoke') return kill.name;
  if (verb === 'spoke') return livingLedgerPeople(state)[0];
  return undefined;
}

export type PacketBuildExtras = {
  xp?: number;
  damage?: number;
  loot?: string[];
};

function liveEncounterHp(state: GameState): { current: number; max: number } | undefined {
  const enc = state.activeEncounter;
  if (enc && typeof enc.hp === 'number') {
    return { current: enc.hp, max: Math.max(1, enc.maxHp || enc.hp) };
  }
  return undefined;
}

function locationLabel(state: GameState): string {
  const raw = cleanPlaceLabel(
    playerFacingLocation(state) || String(state.currentLocation ?? '') || 'this room'
  );
  if (raw && raw.length <= 48 && !/^alone\b/i.test(raw) && !/,/.test(raw)) return raw;
  return shortRoomLabel(raw, 'this room');
}

function pushUnique(list: string[], seen: Set<string>, raw: string | undefined): void {
  const name = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!name || name.length < 2) return;
  const key = name.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(name);
  const last = name.split(/\s+/).pop() ?? '';
  if (last.length >= 5 && last.toLowerCase() !== key) {
    const lastKey = last.toLowerCase();
    if (!seen.has(lastKey)) {
      seen.add(lastKey);
      list.push(last);
    }
  }
}

/**
 * Ledger-only nouns. HERE short label, present named, encounter, lastKill corpse,
 * equipped kit, listed props, companions. No invented Title-Case.
 */
export function compileNounAllowlist(state: GameState, extras: string[] = []): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const bible = bibleIdOf(state);

  pushUnique(out, seen, locationLabel(state));

  for (const p of realPresentPeople(state.sceneFacts?.present ?? [])) {
    if (canHarvestAsNamedPerson(p, bible) || p.split(/\s+/).length >= 2) {
      pushUnique(out, seen, p);
    } else {
      pushUnique(out, seen, p);
    }
  }

  const encName = state.activeEncounter?.name?.trim() || state.sceneFacts?.pendingEncounter?.name?.trim();
  pushUnique(out, seen, encName);

  const kill = state.sceneFacts?.lastKill;
  if (kill?.name) {
    pushUnique(out, seen, kill.name);
  }

  for (const item of state.inventory ?? []) {
    if (item.equipped && item.name) pushUnique(out, seen, item.name);
  }

  for (const prop of state.sceneFacts?.props ?? []) {
    pushUnique(out, seen, prop);
  }

  for (const c of state.companions ?? []) {
    pushUnique(out, seen, c.name);
  }

  const pc = (state.character?.name ?? '').trim();
  if (pc && !/^(you|adventurer|player)$/i.test(pc)) pushUnique(out, seen, pc);

  for (const extra of extras) pushUnique(out, seen, extra);

  return out;
}

function isCombatVerb(verb: string): boolean {
  return verb === 'attacked' || verb === 'fled' || verb === 'parleyed';
}

function resolveOutcome(state: GameState, verb: string, playerInput: string): EventOutcome {
  const kill = state.sceneFacts?.lastKill;
  const justKilled =
    !!kill?.name
    && kill.outcome === 'victory'
    && kill.remains
    && kill.turn === state.turn
    && !state.activeEncounter;

  if (justKilled && isCombatVerb(verb)) return 'killed';

  const enc = state.activeEncounter;
  if (enc && isCombatVerb(verb) && typeof enc.hp === 'number' && enc.maxHp) {
    if (enc.hp <= 0) return 'killed';
    if ((verb === 'fled' || /\bflee\b/i.test(playerInput)) && enc.caught) return 'caught';
    if (verb === 'fled' || /\bflee\b/i.test(playerInput)) return 'fled';
    if (verb === 'attacked') {
      if (enc.hp < enc.maxHp * 0.5) return 'bloodied';
      return 'hit';
    }
    if (verb === 'parleyed') return 'spoke';
  }
  if (verb === 'fled') return 'fled';
  if (verb === 'spoke' || verb === 'parleyed') {
    if (justKilled && livingLedgerPeople(state).length === 0) return 'resolved';
    return 'spoke';
  }
  if (verb === 'traveled') return 'arrived';
  if (verb === 'left') return 'left';
  if (verb === 'looted') return 'looted';
  if (verb === 'inspected') return 'inspected';
  if (verb === 'used') return 'used';
  if (verb === 'waited') return 'waited';
  if (state.sceneFacts?.pendingEncounter || (state.arcDirector?.activeBeatId && /skirmish|combat|hostility/i.test(state.arcDirector.activeBeatId))) {
    if (!enc && !justKilled) return 'spawned';
  }
  return 'resolved';
}

function rhythmBeats(state: GameState): string[] {
  const tail = selectRecentLogForContext(state, Math.max(WRITER_RHYTHM_WINDOW * 4, 8));
  return tail
    .filter((e: LogEntry) => e.role === 'gm')
    .slice(-WRITER_RHYTHM_WINDOW)
    .map((e) => String(e.content ?? '').slice(0, WRITER_RHYTHM_CHAR_CAP));
}

export function buildCompletedEventPacket(
  state: GameState,
  playerInput?: string,
  extras?: PacketBuildExtras
): CompletedEventPacket {
  const action = lastPlayerAction(state, playerInput);
  const verb = classifyVerb(action);
  const target = extractTarget(action, state);
  const location = locationLabel(state);
  const kill = state.sceneFacts?.lastKill;
  const justKilled =
    !!kill?.name
    && kill.outcome === 'victory'
    && !!kill.remains
    && kill.turn === state.turn
    && !state.activeEncounter;
  const outcome = resolveOutcome(state, verb, action);
  const witnesses = realPresentPeople(state.sceneFacts?.present ?? []).filter(
    (n) => !matchesLastKillName(n, kill)
  );
  const allowExtras: string[] = [];
  if (target && !isIntentRemainderNoun(target)) allowExtras.push(target);
  const allowlist = compileNounAllowlist(state, allowExtras);
  const enc = state.activeEncounter;
  const hp = liveEncounterHp(state);
  const xp =
    extras?.xp
    ?? (justKilled || outcome === 'killed' ? 25 : 0);

  return {
    turn: state.turn,
    actor: 'you',
    verb,
    target,
    outcome,
    damage: extras?.damage,
    hp,
    loot: extras?.loot ?? [],
    xp,
    witnesses,
    location,
    lastKill: justKilled || (kill?.remains && kill.outcome === 'victory') ? kill : undefined,
    justKilled,
    combatLive: !!enc && !justKilled,
    mood: state.sceneFacts?.tension,
    phase: justKilled ? 'cleared' : enc?.phase ? enc.phase : state.sceneFacts?.pendingEncounter ? 'pending' : 'idle',
    allowlist,
    playerAction: action || '(opening)',
    recentBeats: rhythmBeats(state),
  };
}

export function attachCompletedEvent(
  state: GameState,
  playerInput?: string,
  extras?: PacketBuildExtras
): GameState {
  const packet = buildCompletedEventPacket(state, playerInput, extras);
  return { ...state, completedEvent: packet };
}

/**
 * Short past-tense instruction + packet + allowlist. Facts only.
 * No SNAPSHOT/CRAFT essays. No "don't resurrect" lecture.
 */
export function formatWriterFacingEvent(
  packet: CompletedEventPacket,
  opts?: { stricter?: boolean }
): string {
  const target = packet.target ? ` ${packet.target}` : '';
  const lines: string[] = [
    'Narrate this completed event in past tense.',
    '',
    'COMPLETED EVENT:',
    `You ${packet.verb}${target}.`,
    `Outcome: ${packet.outcome}.`,
  ];
  if (packet.damage != null) lines.push(`Damage: ${packet.damage}.`);
  if (packet.hp) lines.push(`HP: ${packet.hp.current}/${packet.hp.max}.`);
  lines.push(`Location: ${packet.location}.`);
  if (packet.justKilled && packet.lastKill?.name) {
    lines.push(`Last kill: ${packet.lastKill.name} (corpse).`);
  } else if (packet.lastKill?.name && packet.lastKill.remains) {
    lines.push(`Corpse: ${packet.lastKill.name}.`);
  }
  if (packet.xp > 0) lines.push(`XP: ${packet.xp}.`);
  if (packet.loot.length) lines.push(`Loot: ${packet.loot.join(', ')}.`);
  if (packet.witnesses.length) lines.push(`Witnesses: ${packet.witnesses.join(', ')}.`);
  if (packet.mood) lines.push(`Mood: ${packet.mood}.`);
  if (opts?.stricter) {
    lines.push('STRICT: Use only the nouns listed. Outcome is immutable.');
  }
  lines.push('');
  lines.push(`YOU MAY ONLY MENTION: ${packet.allowlist.length ? packet.allowlist.join(', ') : 'none'}.`);
  lines.push('');
  if (packet.recentBeats.length) {
    lines.push(packet.recentBeats.map((b) => `GM: ${b}`).join('\n'));
  } else {
    lines.push('GM: (opening)');
  }
  lines.push('');
  lines.push(`PLAYER: ${packet.playerAction || '(opening)'}`);
  return lines.join('\n').trim();
}

function allowlistHas(allowlist: string[], token: string): boolean {
  const t = token.trim().toLowerCase();
  if (!t) return false;
  return allowlist.some((n) => {
    const a = n.toLowerCase();
    if (a === t || a.includes(t) || t.includes(a)) return true;
    const last = a.split(/\s+/).pop() ?? '';
    return last.length >= 4 && (last === t || t.endsWith(` ${last}`));
  });
}

export function inventedTitleCaseNotOnAllowlist(prose: string, allowlist: string[]): string[] {
  const body = (prose ?? '').trim();
  if (!body) return [];
  const found: string[] = [];
  const seen = new Set<string>();
  const re = new RegExp(TITLE_NAME.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const name = (m[1] ?? '').trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    if (SENTENCE_STARTERS.has(name.toLowerCase())) continue;
    if (allowlistHas(allowlist, name)) continue;
    const before = body.slice(Math.max(0, m.index - 1), m.index);
    const atStart = m.index === 0 || /[\n.!?]\s*$/.test(body.slice(Math.max(0, m.index - 8), m.index)) || before === '';
    if (atStart && SENTENCE_STARTERS.has(name.split(/\s+/)[0]?.toLowerCase() ?? '')) continue;
    seen.add(name.toLowerCase());
    found.push(name);
  }
  return found;
}

function isInstructionVoice(text: string): boolean {
  return (
    /\bMy instruction says\b/i.test(text)
    || /\bThe instruction says\b/i.test(text)
    || /<system\b/i.test(text)
    || /\bledger[- ]honor\b/i.test(text)
    || /\bHonor the committed ledger\b/i.test(text)
    || /\bYOU MAY ONLY MENTION\b/.test(text)
    || /\bCOMPLETED EVENT:\b/.test(text)
    || /\bSTRICT:\s*Use only the nouns\b/i.test(text)
  );
}

function hasChoiceListLeak(text: string): boolean {
  if (!text?.trim()) return false;
  return (
    /(?:^|[.!?]\s+)\d+[.)]\s+[A-Z]/.test(text)
    || /\d+[.)]\s+(?:Meet|Descend|Observe|Scan|Inquire|Plunge|Turn to)\b/.test(text)
  );
}

function prematureLoot(prose: string, packet: CompletedEventPacket): boolean {
  if (packet.loot.length > 0 || packet.outcome === 'looted') return false;
  if (packet.justKilled || packet.outcome === 'killed') return false;
  if (!packet.combatLive && packet.outcome !== 'hit' && packet.outcome !== 'bloodied' && packet.outcome !== 'spawned') {
    return false;
  }
  return /\b(?:search(?:ed)? the (?:body|corpse)|found (?:an? )?(?:iron )?dagger|handful of copper|pouch of coins)\b/i.test(
    prose
  );
}

function aliveVsDeadContradiction(prose: string, packet: CompletedEventPacket): boolean {
  if (packet.justKilled || packet.outcome === 'killed') {
    return isDeadFoeReopenedAsLiving(prose, packet.lastKill, false);
  }
  if (packet.combatLive && (packet.outcome === 'hit' || packet.outcome === 'bloodied' || packet.outcome === 'missed')) {
    return /\b(?:crumpled to the stones|kicked the corpse|the (?:skirmisher|foe|hunter) was done|search(?:ed)? the body)\b/i.test(
      prose
    );
  }
  return false;
}

const HERE_CLAIM =
  /\b(?:you (?:are|stand|wait|remain) (?:in|at|inside)|here in|back (?:in|at)|still (?:in|at))\s+(?:the\s+)?([^.,!?]{2,48})/i;

function wrongHereOnPacket(prose: string, packet: CompletedEventPacket): boolean {
  const here = (packet.location ?? '').replace(/\.$/, '').trim();
  if (!here || here.length < 3) return false;
  if (packet.outcome === 'arrived' || packet.verb === 'traveled') return false;
  const claimed = prose.match(HERE_CLAIM)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
  if (!claimed || claimed.length < 4) return false;
  const claimCore = claimed.replace(/^(the|a|an)\s+/i, '').trim();
  if (!claimCore || !/[A-Z]/.test(claimCore)) return false;
  const h = here.toLowerCase();
  const c = claimCore.toLowerCase();
  if (h === c || h.includes(c) || c.includes(h)) return false;
  return true;
}

export function proseViolatesEventPacket(
  prose: string,
  packet: CompletedEventPacket
): boolean {
  const body = (prose ?? '').trim();
  if (!body) return false;
  // 08b — do not reject ordinary off-list Title-Case. DeepSeek must commit when facts hold.
  if (aliveVsDeadContradiction(body, packet)) return true;
  if (isInstructionVoice(body)) return true;
  if (hasChoiceListLeak(body)) return true;
  if (prematureLoot(body, packet)) return true;
  if (wrongHereOnPacket(body, packet)) return true;
  return false;
}

type StitchSlots = {
  where: string;
  who: string;
  corpse: string;
};

type StitchTemplate = {
  id: string;
  fingerprint: string;
  render: (s: StitchSlots) => string;
};

const STITCH_BANKS: Record<string, StitchTemplate[]> = {
  'attack-kill': [
    {
      id: 'ak1',
      fingerprint: 'went down and stayed down',
      render: (s) =>
        `The last strike killed them at ${s.where}. ${s.corpse} went down and stayed down.`,
    },
    {
      id: 'ak2',
      fingerprint: 'lay still on the stones',
      render: (s) =>
        `You finished the fight at ${s.where}. The body of ${s.corpse} lay still on the stones.`,
    },
    {
      id: 'ak3',
      fingerprint: 'Nothing in them answered after that',
      render: (s) =>
        `${s.corpse} dropped at ${s.where}. Nothing in them answered after that.`,
    },
  ],
  'attack-hit': [
    {
      id: 'ah1',
      fingerprint: 'still held their ground',
      render: (s) =>
        `Steel rang at ${s.where}. The strike found ${s.who || 'the foe'}. They still held their ground.`,
    },
    {
      id: 'ah2',
      fingerprint: 'kept the lane',
      render: (s) =>
        `You closed at ${s.where}. ${s.who || 'The foe'} took the hit and kept the lane.`,
    },
    {
      id: 'ah3',
      fingerprint: 'They were still standing after',
      render: (s) =>
        `Dust kicked up at ${s.where}. Your hit met ${s.who || 'them'}. They were still standing after.`,
    },
  ],
  'attack-miss': [
    {
      id: 'am1',
      fingerprint: 'slipped the blow',
      render: (s) => `You swung at ${s.where}. ${s.who || 'They'} slipped the blow.`,
    },
    {
      id: 'am2',
      fingerprint: 'cut only air',
      render: (s) => `The cut found only air at ${s.where}. ${s.who || 'The foe'} was still in reach.`,
    },
    {
      id: 'am3',
      fingerprint: 'the strike went wide',
      render: (s) => `You committed at ${s.where}, and the strike went wide.`,
    },
  ],
  inspect: [
    {
      id: 'in1',
      fingerprint: 'same edges it had a moment ago',
      render: (s) => `You took in ${s.where}. The room held the same edges it had a moment ago.`,
    },
    {
      id: 'in2',
      fingerprint: 'showed what was already there',
      render: (s) => `A look around ${s.where} showed what was already there.`,
    },
    {
      id: 'in3',
      fingerprint: 'Nothing new stepped forward',
      render: (s) => `You studied ${s.where}. Nothing new stepped forward.`,
    },
  ],
  'inspect-fight': [
    {
      id: 'if1',
      fingerprint: 'kept your eyes on the fight',
      render: (s) =>
        `You kept your eyes on the fight at ${s.where}. ${s.who || 'The foe'} was still in reach.`,
    },
    {
      id: 'if2',
      fingerprint: 'watched the lane without swinging',
      render: (s) => `You watched the lane without swinging at ${s.where}. The fight had not moved on.`,
    },
    {
      id: 'if3',
      fingerprint: 'reading the fight instead of striking',
      render: (s) => `You spent the beat reading the fight instead of striking at ${s.where}.`,
    },
  ],
  talk: [
    {
      id: 'tk1',
      fingerprint: 'Their answer stayed short',
      render: (s) => `${s.who} heard you at ${s.where}. Their answer stayed short.`,
    },
    {
      id: 'tk2',
      fingerprint: 'answered from where they stood',
      render: (s) => `You spoke at ${s.where}. ${s.who} answered from where they stood.`,
    },
    {
      id: 'tk3',
      fingerprint: 'did not look away',
      render: (s) => `Words passed at ${s.where}. ${s.who} did not look away.`,
    },
  ],
  'talk-empty': [
    {
      id: 'te1',
      fingerprint: 'No one listed on the ledger answered',
      render: (s) => `You spoke at ${s.where}. No one listed on the ledger answered.`,
    },
    {
      id: 'te2',
      fingerprint: 'The room did not invent a speaker',
      render: (s) => `Your question hung at ${s.where}. The room did not invent a speaker.`,
    },
    {
      id: 'te3',
      fingerprint: 'Silence held the question',
      render: (s) => `You asked at ${s.where}. Silence held the question.`,
    },
  ],
  travel: [
    {
      id: 'tr1',
      fingerprint: 'The road behind you thinned',
      render: (s) => `You reached ${s.where}. The road behind you thinned.`,
    },
    {
      id: 'tr2',
      fingerprint: 'arrival already done',
      render: (s) => `The walk ended at ${s.where}. The arrival already done, the room waited.`,
    },
    {
      id: 'tr3',
      fingerprint: 'threshold opened onto',
      render: (s) => `The threshold opened onto ${s.where}. You were through.`,
    },
  ],
  leave: [
    {
      id: 'lv1',
      fingerprint: 'The threshold closed on the last room',
      render: (s) => `You left ${s.where} behind. The threshold closed on the last room.`,
    },
    {
      id: 'lv2',
      fingerprint: 'fell behind without a speech',
      render: (s) => `The place at your back fell behind without a speech.`,
    },
    {
      id: 'lv3',
      fingerprint: 'You put the room at your back',
      render: (s) => `You put the room at your back. ${s.where} was no longer underfoot.`,
    },
  ],
  wait: [
    {
      id: 'wt1',
      fingerprint: 'did not invent a new arrival',
      render: (s) => `You waited at ${s.where}. The beat did not invent a new arrival.`,
    },
    {
      id: 'wt2',
      fingerprint: 'The wait stayed honest',
      render: (s) => `You held still at ${s.where}. The wait stayed honest.`,
    },
    {
      id: 'wt3',
      fingerprint: 'Nothing used the pause to arrive',
      render: (s) => `A breath at ${s.where}. Nothing used the pause to arrive.`,
    },
  ],
  loot: [
    {
      id: 'lt1',
      fingerprint: 'The ledger already knew what was there',
      render: (s) =>
        `You searched the body of ${s.corpse} at ${s.where}. The ledger already knew what was there.`,
    },
    {
      id: 'lt2',
      fingerprint: 'search did not invent a new prize',
      render: (s) => `Hands went through what ${s.corpse} left at ${s.where}. The search did not invent a new prize.`,
    },
    {
      id: 'lt3',
      fingerprint: 'hands found only what was already listed',
      render: (s) => `You checked the remains at ${s.where}. Your hands found only what was already listed.`,
    },
  ],
  flee: [
    {
      id: 'fl1',
      fingerprint: 'You broke contact',
      render: (s) => `You broke contact at ${s.where}. The fight thinned behind you.`,
    },
    {
      id: 'fl2',
      fingerprint: 'put distance on the fight',
      render: (s) => `You put distance on the fight at ${s.where}.`,
    },
    {
      id: 'fl3',
      fingerprint: 'The lane opened behind you',
      render: (s) => `The lane opened behind you at ${s.where}. You were out of the clinch.`,
    },
  ],
  'flee-caught': [
    {
      id: 'fc1',
      fingerprint: 'The flee failed',
      render: (s) => `The flee failed at ${s.where}. ${s.who || 'They'} were still on you.`,
    },
    {
      id: 'fc2',
      fingerprint: 'caught before the exit',
      render: (s) => `You were caught before the exit at ${s.where}.`,
    },
    {
      id: 'fc3',
      fingerprint: 'still in reach after the run',
      render: (s) => `${s.who || 'The foe'} stayed still in reach after the run at ${s.where}.`,
    },
  ],
  use: [
    {
      id: 'us1',
      fingerprint: 'used what you already carried',
      render: (s) => `You used what you already carried at ${s.where}.`,
    },
    {
      id: 'us2',
      fingerprint: 'kit did the work it was packed for',
      render: (s) => `At ${s.where} the kit did the work it was packed for.`,
    },
    {
      id: 'us3',
      fingerprint: 'No new tool appeared in your hands',
      render: (s) => `You worked with what you had at ${s.where}. No new tool appeared in your hands.`,
    },
  ],
  spawn: [
    {
      id: 'sp1',
      fingerprint: 'was in the lane now',
      render: (s) =>
        `Trouble stepped in at ${s.where}. ${s.who || 'A threat'} was in the lane now.`,
    },
    {
      id: 'sp2',
      fingerprint: 'stepped into the open',
      render: (s) => `${s.who || 'A threat'} stepped into the open at ${s.where}.`,
    },
    {
      id: 'sp3',
      fingerprint: 'The fight had a body in it',
      render: (s) => `The fight had a body in it at ${s.where}. ${s.who || 'They'} had arrived.`,
    },
  ],
  settle: [
    {
      id: 'st1',
      fingerprint: 'You still had the next move',
      render: (s) => `The moment at ${s.where} settled. You still had the next move.`,
    },
    {
      id: 'st2',
      fingerprint: 'Whatever you tried had already happened',
      render: (s) => `Dust hung at ${s.where}. Whatever you tried had already happened.`,
    },
    {
      id: 'st3',
      fingerprint: 'The room waited without a speech',
      render: (s) => `You finished the beat at ${s.where}. The room waited without a speech.`,
    },
  ],
};

export const PACKET_STITCH_FINGERPRINTS: readonly string[] = Object.values(STITCH_BANKS)
  .flat()
  .map((t) => t.fingerprint);

const OLD_LANDING_STUB =
  /You acted at landing|That beat closed\.|The next move was yours\.|The blow landed/i;

export function isPacketStitchProse(text: string): boolean {
  const body = (text ?? '').trim();
  if (!body) return false;
  if (OLD_LANDING_STUB.test(body)) return true;
  return PACKET_STITCH_FINGERPRINTS.some((fp) => body.includes(fp));
}

function stitchBankKey(packet: CompletedEventPacket): string {
  const verb = packet.verb;
  const outcome = packet.outcome;
  if (verb === 'attacked' && (outcome === 'killed' || packet.justKilled)) return 'attack-kill';
  if (verb === 'attacked' && outcome === 'missed') return 'attack-miss';
  if (verb === 'attacked') return 'attack-hit';
  if (verb === 'inspected') return packet.combatLive ? 'inspect-fight' : 'inspect';
  if (verb === 'spoke' || verb === 'parleyed') {
    return packet.witnesses.length > 0 && packet.outcome === 'spoke' ? 'talk' : 'talk-empty';
  }
  if (verb === 'traveled' || outcome === 'arrived') return 'travel';
  if (verb === 'left' || outcome === 'left') return 'leave';
  if (verb === 'waited') return 'wait';
  if (verb === 'looted' || outcome === 'looted') return 'loot';
  if (verb === 'fled') return outcome === 'caught' ? 'flee-caught' : 'flee';
  if (verb === 'used') return 'use';
  if (outcome === 'spawned') return 'spawn';
  return 'settle';
}

function ledgerStitchSlots(packet: CompletedEventPacket): StitchSlots {
  const where = packet.location || 'this room';
  const kill = packet.lastKill;
  const corpse =
    kill?.name && (packet.justKilled || packet.outcome === 'killed' || packet.outcome === 'looted' || packet.verb === 'looted')
      ? kill.name
      : 'the fallen';
  const living = packet.witnesses.filter((n) => !matchesLastKillName(n, kill));
  let who = '';
  const target = packet.target && !isIntentRemainderNoun(packet.target) ? packet.target : '';
  if (target && !(kill?.name && matchesLastKillName(target, kill) && packet.verb === 'spoke')) {
    if (kill?.name && matchesLastKillName(target, kill)) {
      who = '';
    } else {
      who = target;
    }
  } else if (living[0]) {
    who = living[0]!;
  } else if (packet.combatLive && packet.allowlist[1]) {
    const enc = packet.allowlist.find((n) => n !== packet.location && !matchesLastKillName(n, kill));
    who = enc && !isIntentRemainderNoun(enc) ? enc : '';
  }
  if (packet.verb === 'spoke' && kill?.name && matchesLastKillName(who, kill)) who = '';
  if (packet.outcome === 'spawned' && kill?.name && matchesLastKillName(who, kill)) who = '';
  return { where, who, corpse };
}

function pickStitchTemplate(bank: StitchTemplate[], recent: string[], salt: number): StitchTemplate {
  const free = bank.filter((t) => !recent.some((b) => b.includes(t.fingerprint)));
  const pool = free.length ? free : bank;
  return pool[Math.abs(salt) % pool.length]!;
}

/**
 * Authored past-tense stitch from ledger slots only.
 * Never interpolates pad/intent remainder. Outcome follows verb.
 */
export function assemblePacketStitch(
  packet: CompletedEventPacket,
  recentGm: string[] = packet.recentBeats ?? []
): string {
  const slots = ledgerStitchSlots(packet);
  const key = stitchBankKey(packet);
  const bank = STITCH_BANKS[key] ?? STITCH_BANKS.settle!;
  const picked = pickStitchTemplate(bank, recentGm, packet.turn);
  const text = picked.render(slots).replace(/\s+/g, ' ').trim();
  if (OLD_LANDING_STUB.test(text) || /what is going on|a direct question|with what you are holding/i.test(text)) {
    const alt = bank.find((t) => t.id !== picked.id) ?? STITCH_BANKS.settle![0]!;
    return alt.render(slots).replace(/\s+/g, ' ').trim();
  }
  return text;
}

/**
 * After mechanics commit: attach packet, then the writer string.
 * Fate / useGame call this before callGm — packet always exists first.
 */
export function prepareRetrospectiveWriterInput(
  state: GameState,
  playerInput: string,
  extras?: PacketBuildExtras
): { state: GameState; packet: CompletedEventPacket; writerFacing: string } {
  const packet = buildCompletedEventPacket(state, playerInput, extras);
  const next = { ...state, completedEvent: packet };
  return {
    state: next,
    packet,
    writerFacing: formatWriterFacingEvent(packet),
  };
}
