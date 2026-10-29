/**
 * 29z9 — a who / want / where question put to someone here is answered in their own quoted words.
 * Runs on the committed draft after the one writer call. When the draft has no quote from them, code
 * prints that person's authored line for the question. No authored line means nothing is added: an
 * earlier quote is never reused, the turn stays as written and the miss is logged. Nothing here writes
 * new dialogue.
 */
import type { GameState, NpcMemory } from './types';
import {
  hallTalkTopic,
  openingCastLabel,
  openingCastNames,
  shortCardWant,
} from './openingEstablishment';
import { openingCastRecords, resolveNpcRecord } from './npcRecords';
import { authoredTopicsFor } from './manusTopicBanks';
import { isCrowdFillerToken } from './chromeAuthority';
import { fuzzyTypedName } from './typedNameMatch';
import { motiveAnswer, motiveLinesFor, pickNpcSheet, sheetPlaceFor } from './npcSheet';
import { peopleHere } from './chipLegality';
import { matchesLastKillName } from './combatAuthority';

export type SpokenTopic = 'who' | 'want' | 'where';

export type SpokenAnswer =
  | { status: 'not-asked' | 'nobody-here' }
  | { status: 'already-quoted'; speaker: string }
  | { status: 'added'; speaker: string; source: 'authored'; line: string }
  | { status: 'no-line'; speaker: string };

type Speaker = { label: string; record?: NpcMemory; names: string[] };

const TOPIC_ALIASES: Record<SpokenTopic, RegExp> = {
  who: /^(?:who|name|introduce|intro)$/i,
  want: /^(?:want|why|job|need|offer)$/i,
  where: /^(?:where|place|here|this place)$/i,
};
const HONORIFIC = /^(?:captain|father|mother|brother|sister|sergeant|lord|lady|sir|dame|master|mistress|elder|old|young|the)$/i;
const QUOTE = /["“]([^"“”]{2,}?)["”]/g;
const QUESTION_OR_CHIP = /^(?:who|what|where|why|how|ask|look|talk|wait|inspect|travel|check|attack|flee)$/i;

function asked(playerInput: string): SpokenTopic | null {
  const topic = hallTalkTopic(playerInput);
  return topic === 'who' || topic === 'want' || topic === 'where' ? topic : null;
}

/** Words that pick this person out in prose: full name, aliases, and name parts that are not titles. */
function nameParts(label: string, record?: NpcMemory): string[] {
  const full = [label, ...(record?.aliases ?? [])].map((n) => n.trim()).filter(Boolean);
  const parts = full.flatMap((n) => n.split(/\s+/)).filter((w) => w.length >= 3 && !HONORIFIC.test(w));
  // T10AI — singular typed "engineer" / "face" still hits ledger "engineers" / "faces".
  const stems = parts.flatMap((w) => {
    if (/ies$/i.test(w) && w.length >= 5) return [w, `${w.slice(0, -3)}y`];
    if (/s$/i.test(w) && w.length >= 4 && !/ss$/i.test(w)) return [w, w.slice(0, -1)];
    return [w];
  });
  return [...new Set([...full, ...stems])];
}

const sameSpeaker = (a: string, b: string) => {
  const bare = (s: string) => s.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
  return !!bare(a) && bare(a) === bare(b);
};

function speakersHere(state: GameState): Speaker[] {
  // T10AA — same universe as turnCheck/peopleHere (road companions in sceneFacts.present
  // + presentNpcRecords). Prefer records when known; never drop a present walker because
  // another record already filled the list (T10X/Y group path kept as fallback).
  // T10AI — anonymous roles + ledger groups (exhausted faces / engineers) answer the same way.
  // SRD 5.2.1 Communicating — brief speech is free; the addressed party here may answer.
  const seen = new Set<string>();
  const out: Speaker[] = [];
  const push = (label: string, record?: NpcMemory) => {
    if (isCrowdFillerToken(label) || !isCleanName(label)) return;
    const key = label.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    const rec = record ?? resolveNpcRecord(state, label) ?? undefined;
    const prefer =
      /^(?:the|a|an)\s+/i.test(label)
        ? label
        : (state.sceneFacts?.present ?? []).find((x) => sameSpeaker(x, label) && /^(?:the|a|an)\s+/i.test(x)) ?? label;
    out.push({ label: prefer, record: rec, names: nameParts(prefer, rec) });
  };
  for (const p of peopleHere(state)) push(p);
  for (const role of state.sceneFacts?.anonymousRoles ?? []) {
    const r = (role ?? '').replace(/\s+/g, ' ').trim();
    if (r) push(/^(?:the|a|an)\s+/i.test(r) ? r : `the ${r}`);
  }
  if (out.length) return out;
  // T10DIR — SM1 occupancy only. sceneFacts.present + present:true are the seat list.
  // Do NOT location-match presentNpcRecords (that re-seated absent Nell Rudd).
  // sceneFacts.present still answers when peopleHere filtered a seated name via
  // npcPlacedElsewhere (Bertil on the road with a mismatched location stamp).
  for (const p of state.sceneFacts?.present ?? []) push(p);
  for (const m of state.npcMemories ?? []) {
    if (m.present === true && !m.shouldExit) push(m.npcName, m);
  }
  return out;
}

/** Quote one ledger/authored line as this speaker's reply (shared attach shape). */
function quotedReply(speaker: Speaker, words: string): { line: string; words: string } {
  const w = words.replace(/^["“]|["”]$/g, '').replace(/\s+/g, ' ').trim();
  return { line: `${capitalize(speaker.label)} said, "${w}"`, words: w };
}

type LedgerKind = 'need' | 'goal' | 'offer';

/**
 * T10AL — agenda fields are noun phrases ("a buyer who pays"), not dialogue. Speak them as a
 * first-person sentence so the beat is not a clipped fragment and not a turn-plays-player echo.
 */
function asSpokenAgenda(bit: string, kind: LedgerKind): string {
  const t = bit.replace(/^["“]|["”]$/g, '').replace(/\s+/g, ' ').trim();
  if (!t) return t;
  if (/^(?:I|We|You|Don't|Do not|Never|Ask|Tell|Look)\b/i.test(t)) {
    return /[.!?]$/.test(t) ? t : `${t}.`;
  }
  if (/[.!?]$/.test(t) && /^[A-Z]/.test(t)) return t;
  // Keep the article on need ("a buyer who pays"); strip only when the frame is "offer/want X".
  const bare = t.replace(/^(?:an?|the)\s+/i, '');
  if (kind === 'offer') return `I can offer ${bare}.`;
  if (kind === 'goal') return `I want ${bare}.`;
  return `I need ${t}.`;
}

const sayWordSet = (s: string) => new Set((s.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter((w) => w.length >= 3));

/** True when this speaker already spoke substantially the same words (ledger said[] / recent GM). */
function speakerAlreadyTold(state: GameState, speaker: Speaker, words: string): boolean {
  const raw = words.replace(/^["“]|["”]$/g, '').replace(/\s+/g, ' ').trim();
  // Compare the full line and the agenda core ("I need a buyer who pays" ↔ "a buyer who pays").
  const cores = [
    raw,
    raw.replace(/^(?:I need|I want|I can offer)\s+/i, '').replace(/[.!?]+$/, '').trim(),
  ].filter((c, i, a) => c.length >= 6 && a.indexOf(c) === i);
  const overlap = (line: string, needle: string) => {
    const now = sayWordSet(needle);
    if (now.size < 2) return false;
    const before = sayWordSet(line);
    if (!before.size) return false;
    let hit = 0;
    for (const w of now) if (before.has(w)) hit += 1;
    return hit / now.size >= 0.7;
  };
  const hitLine = (line: string) => cores.some((c) => overlap(line, c) || overlap(c, line));
  for (const s of speaker.record?.said ?? []) {
    if (s.line && hitLine(s.line)) return true;
  }
  for (const u of speaker.record?.motiveUsed ?? []) {
    if (u && hitLine(u)) return true;
  }
  const names = speaker.names;
  for (const e of (state.log ?? []).filter((x) => x.role === 'gm').slice(-12)) {
    const body = String(e.content ?? '');
    for (const m of body.matchAll(QUOTE)) {
      const ctx = quoteContext(body, m.index!, m.index! + m[0].length);
      if (!mentions(ctx, names)) continue;
      if (hitLine(m[1] ?? '')) return true;
    }
  }
  return false;
}

/**
 * Engine-recorded mute only (corpse / lastKill). SRD undead mute is owned by motiveLinesOf
 * (empty group lines); here lastKill is the shared corpse lock.
 * SRD 5.2.1 Communicating — brief speech is free unless they cannot speak.
 */
function engineMuteLine(state: GameState, speaker: Speaker): { line: string } | null {
  // lastKill is LastKill { name, … }, not a bare string (shared combatAuthority lock).
  const kill = state.sceneFacts?.lastKill;
  if (!kill?.name?.trim()) return null;
  if (
    !matchesLastKillName(speaker.label, kill) &&
    !speaker.names.some((n) => matchesLastKillName(n, kill))
  ) {
    return null;
  }
  return { line: `${capitalize(speaker.label)} was already down and said nothing.` };
}

/**
 * Typed ask fallback with content that fits the ask: authored topic → ledger agenda →
 * cast want → motive deflection → seed sheet. Stock motive never outranks ledger need/goal.
 * Silence only when the engine records a mute reason (lastKill). No new canned refusal bank.
 * T10X/T10Y — present groups + opening cast use the same picker.
 * T10AL — agenda noun-phrases become sentences; an already-told fact is a different reply kind
 * (next unused ledger bit / motive / ask-back), never a verbatim replay.
 * SRD 5.2.1 Communicating — brief speech is free; the addressed party answers from what they know.
 */
function spokenExchangeLine(
  state: GameState,
  speaker: Speaker,
  playerInput = '',
): { line: string; words?: string } {
  const mute = engineMuteLine(state, speaker);
  if (mute) return mute;

  const memory = speaker.record;
  const ask = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const askTopic =
    ask.match(/Follow up with[^:]+:\s*(.+)$/i)?.[1]?.trim() ??
    ask.match(/\babout\s+(.+?)[.?!]?$/i)?.[1]?.trim() ??
    '';

  // Authored topic bank (who/want/where lines) before archetype motive.
  const authored = authoredTopicsFor(speaker.label)[0];
  if (authored?.line) {
    const words = firstSentence(authored.line).replace(/^["“]|["”]$/g, '').trim();
    if (words && !speakerAlreadyTold(state, speaker, words)) return quotedReply(speaker, words);
  }

  // T10AF / T10AD — durable need/goal/offer before stock motive (Keep Gate steward need, not
  // "fair and square"). Prefer the bit that overlaps the Follow-up / about-topic when present.
  // T10AL — speak as a sentence; skip bits already told this scene (no verbatim replay).
  // T10AM — a content question (quoted ?, about-topic, or/whether) only gets a ledger bit that
  // overlaps the ask; unrelated need ("I need shelter") is not a reply to "was that the wind?".
  // Demand-to-speak ("Answer me" / waiting for an answer / bare Talk) may still use any fresh bit.
  // T10AO — a non-question ambient shout (quoted line that never names this speaker) is a reaction
  // beat, not a ledger-need dump ("I need listeners" after kicking a boulder).
  const ledgerBits = (
    [
      { kind: 'need' as const, text: (memory?.need ?? '').replace(/\s+/g, ' ').trim() },
      { kind: 'goal' as const, text: (memory?.goal?.target ?? '').replace(/\s+/g, ' ').trim() },
      { kind: 'offer' as const, text: (memory?.offer ?? '').replace(/\s+/g, ' ').trim() },
    ] satisfies { kind: LedgerKind; text: string }[]
  ).filter((b) => b.text.length >= 3);
  if (ledgerBits.length) {
    const askBody = [
      askTopic,
      ...[...ask.matchAll(QUOTE)].map((m) => (m[1] ?? '').trim()),
      ask,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const overlapsAsk = (bit: string) => {
      const bl = bit.toLowerCase();
      if (!askBody.trim()) return false;
      if (bl.includes(askTopic.toLowerCase()) && askTopic.length >= 3) return true;
      if (askTopic.length >= 3 && askTopic.toLowerCase().includes(bl)) return true;
      const words = bl.match(/[a-z0-9']{4,}/g) ?? [];
      if (!words.length) return false;
      let hit = 0;
      for (const w of words) if (askBody.includes(w)) hit += 1;
      return hit / words.length >= 0.4 || words.some((w) => w.length >= 5 && askBody.includes(w));
    };
    const fresh = ledgerBits.filter((b) => {
      const spoken = asSpokenAgenda(b.text, b.kind);
      return !speakerAlreadyTold(state, speaker, b.text) && !speakerAlreadyTold(state, speaker, spoken);
    });
    const pool = fresh.length ? fresh : [];
    // Content questions end in ? (or name an about-topic). Imperative threats with "or"
    // ("check your pockets or I will") are demands — keep ledger (T10AF Dunn T147).
    const contentQuestion =
      !!askTopic
      || (/["\u201c]/.test(ask) && /\?/.test(ask))
      || /\b(?:or|whether)\b[\s\S]{0,80}\?/i.test(ask)
      || /\bif\b[\s\S]{0,80}\?/i.test(ask);
    // Bare Talk / Ask-what chips demand any content; "Ask X about the lead" is a content question.
    const demandsSpeech =
      /\banswer me\b|\bwaiting for an answer\b/i.test(ask)
      || /^(?:talk(?:\s+to)?|speak(?:\s+to)?)\b/i.test(ask)
      || /^ask\s+(?:what|who|why|where)\b/i.test(ask);
    // Quote names this speaker (or a threat with "or") → ledger may answer; ambient shout does not.
    const namesThisSpeaker = speaker.names.some(
      (n) => n.length >= 3 && new RegExp(`\\b${esc(n)}\\b`, 'i').test(ask),
    );
    const ambientShout =
      /["\u201c]/.test(ask) && !/\?/.test(ask) && !namesThisSpeaker && !demandsSpeech;
    // T10AP — live foe not named in the line: no ledger/motive dump (T29 combat spawn + "Hey, look…").
    const liveFoe = (state.activeEncounter?.name ?? '').trim();
    const speakerIsLiveFoe =
      !!liveFoe
      && (sameSpeaker(speaker.label, liveFoe)
        || speaker.names.some((n) => sameSpeaker(n, liveFoe)));
    const namedLiveFoe =
      !!liveFoe
      && (new RegExp(`\\b${esc(liveFoe)}\\b`, 'i').test(ask)
        || speaker.names.some((n) => n.length >= 3 && new RegExp(`\\b${esc(n)}\\b`, 'i').test(ask)));
    const skipAmbientCombat =
      ambientShout
      || (speakerIsLiveFoe && !namedLiveFoe && !demandsSpeech && !contentQuestion);
    // T10AR — physical free act / arrival silence fill that never asks or names this speaker
    // must not dump ledger need ("I need a buyer who pays" after snapping a twig; s9601 T157).
    const addressedTalk =
      /^(?:ask|talk|speak|Follow up with)\b/i.test(ask)
      || /\b(?:ask(?:ing)?|tell(?:ing)?|talk(?:ing)?\s+to|speak(?:ing)?\s+to)\b/i.test(ask);
    const ambientReact =
      !namesThisSpeaker && !demandsSpeech && !contentQuestion && !addressedTalk;
    const fitRow =
      pool.find((b) => overlapsAsk(b.text))
      ?? (skipAmbientCombat || ambientReact
        ? undefined
        : !contentQuestion || demandsSpeech
          ? pool[0]
          : undefined);
    if (fitRow) return quotedReply(speaker, asSpokenAgenda(fitRow.text, fitRow.kind));
    if (skipAmbientCombat) {
      return { line: `${capitalize(speaker.label)} said nothing.` };
    }
    // Fresh ledger bits exist but none fit this content question — fall through to motive
    // (react in character) instead of dumping an unrelated need. Already-told-only → ask-back.
    if (!pool.length) {
      return quotedReply(speaker, 'I already told you that. Ask me who, or why.');
    }
  }

  // T10AP — same combat-ambient skip when there was no ledger bit block (or it fell through).
  {
    const contentQuestion =
      !!askTopic
      || (/["\u201c]/.test(ask) && /\?/.test(ask))
      || /\b(?:or|whether)\b[\s\S]{0,80}\?/i.test(ask)
      || /\bif\b[\s\S]{0,80}\?/i.test(ask);
    const demandsSpeech =
      /\banswer me\b|\bwaiting for an answer\b/i.test(ask)
      || /^(?:talk(?:\s+to)?|speak(?:\s+to)?)\b/i.test(ask)
      || /^ask\s+(?:what|who|why|where)\b/i.test(ask);
    const namesThisSpeaker = speaker.names.some(
      (n) => n.length >= 3 && new RegExp(`\\b${esc(n)}\\b`, 'i').test(ask),
    );
    const ambientShout =
      /["\u201c]/.test(ask) && !/\?/.test(ask) && !namesThisSpeaker && !demandsSpeech;
    const liveFoe = (state.activeEncounter?.name ?? '').trim();
    const speakerIsLiveFoe =
      !!liveFoe
      && (sameSpeaker(speaker.label, liveFoe)
        || speaker.names.some((n) => sameSpeaker(n, liveFoe)));
    const namedLiveFoe =
      !!liveFoe
      && (new RegExp(`\\b${esc(liveFoe)}\\b`, 'i').test(ask)
        || speaker.names.some((n) => n.length >= 3 && new RegExp(`\\b${esc(n)}\\b`, 'i').test(ask)));
    if (
      ambientShout
      || (speakerIsLiveFoe && !namedLiveFoe && !demandsSpeech && !contentQuestion)
    ) {
      return { line: `${capitalize(speaker.label)} said nothing.` };
    }
  }

  const cast = openingCastNames(state);
  const isCast =
    cast.some((n) => sameSpeaker(n, speaker.label)) ||
    sameSpeaker(openingCastLabel(state), speaker.label);
  const want = isCast ? shortCardWant(state).replace(/\s+/g, ' ').trim() : '';
  if (want && !speakerAlreadyTold(state, speaker, want)) return quotedReply(speaker, want);

  // Deflection naming what they want — only when no ledger agenda (T10AF: never append on top of silence).
  const own = motiveAnswer(state, [speaker.label, ...speaker.names]);
  if (own?.spoken?.words && !speakerAlreadyTold(state, speaker, own.spoken.words)) {
    return { line: own.line, words: own.spoken.words };
  }
  if (own?.line) {
    const q = own.line.match(/["“]([^"”]+)["”]/);
    const words = (q?.[1] ?? '').replace(/\s+/g, ' ').trim() || undefined;
    if (words && !speakerAlreadyTold(state, speaker, words)) return { line: own.line, words };
  }

  // T10AA — road walkers / empty memory: seed-stable sheet motive (same as ensureNpcSheet).
  const sheet = pickNpcSheet(speaker.label, sheetPlaceFor(state.currentLocation), {
    campaignId: state.campaignBibleId,
    roleHint: memory?.roleHint,
  });
  const words = (motiveLinesFor(sheet.motive)[0] ?? sheet.motive ?? '').replace(/\s+/g, ' ').trim();
  if (words && !speakerAlreadyTold(state, speaker, words)) return quotedReply(speaker, words);

  // T10DIR2 — present NPC with an open job/thread must move it forward when addressed, not silence.
  {
    const threads = state.openThreads ?? [];
    const hit = threads.find((t) => {
      if (t.kind === 'npc-goal') {
        return speaker.names.some((n) => n && (t.label.includes(n) || (t.entityId ?? '').includes(n)));
      }
      if (t.kind === 'quest' || t.kind === 'lead') {
        const q = (state.quests ?? []).find((row) => `quest:${row.id}` === t.entityId || row.id === (t.entityId ?? '').replace(/^quest:/, ''));
        return !!(q?.giver && speaker.names.some((n) => n && (mentionsSpeaker(q.giver!, n) || mentionsSpeaker(n, q.giver!))));
      }
      return false;
    });
    if (hit) {
      const line = (hit.label || '').replace(/\s+/g, ' ').trim();
      if (line && !speakerAlreadyTold(state, speaker, line)) {
        return quotedReply(speaker, line);
      }
    }
  }

  // No engine mute and no ledger line — still one seed motive word if pick returned empty parts.
  return { line: `${capitalize(speaker.label)} said nothing.` };
}

function mentionsSpeaker(a: string, b: string): boolean {
  const x = (a ?? '').trim().toLowerCase();
  const y = (b ?? '').trim().toLowerCase();
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

/** Name tokens that identify this speaker in a clause (full label + non-title parts). */
function speakerNameTokens(label: string): string[] {
  const bare = label.replace(/^(?:the|a|an)\s+/i, '').trim();
  if (!bare) return [];
  const parts = bare.split(/\s+/).filter((w) => w.length >= 3 && !HONORIFIC.test(w));
  return [...new Set([bare, ...parts])];
}

function clauseNamesSpeaker(clause: string, label: string): boolean {
  return speakerNameTokens(label).some((t) => new RegExp(`\\b${esc(t)}\\b`, 'i').test(clause));
}

/**
 * Content-free non-answer for this speaker: named, no quoted speech content, speech denied or empty.
 * One structural check (speech claim + empty/negation) — not a growing synonym list.
 * T10AF — match on any name token ("Bertil" / "Dunn") so "Bertil Pike" silence still strips.
 * T10AK — wordless freeze (stayed quiet / did not move their hands) is a non-answer even with no
 * speech verb. A demand-compliance act ("jabbed a finger toward the lock") does not match these
 * freeze patterns, so it stays as the answer.
 */
function isSpeakerNonAnswerClause(clause: string, label: string): boolean {
  if (!clauseNamesSpeaker(clause, label)) return false;
  // Ignore orphan quote marks left by splitting on ? inside a prior PC quote.
  const body = clause.replace(/^["\u201c\u201d'\u2018\u2019]+/, '').replace(/["\u201c\u201d'\u2018\u2019]+$/, '');
  if (/["\u201c][^"\u201d]{2,}["\u201d]/.test(body)) return false;
  // "said nothing that the parcel…" is a silence/content splice — whole clause is non-answer.
  if (/\bsaid nothing\s+(?:that|with|about|but)\b/i.test(body)) return true;
  if (/\bgave\b[\s\S]{0,40}\bnothing\b/i.test(body)) return true;
  // Wordless freeze: no speech verb required (threat beats that only "stayed quiet").
  if (
    /\b(?:went|stayed|remained)\s+(?:stiff\s+and\s+)?(?:quiet|silent)\b/i.test(body) ||
    /\bdid not (?:speak|answer|say(?:\s+a(?:\s+single)?\s+word)?)\b/i.test(body) ||
    /\bdidn['’]t (?:speak|answer|say(?:\s+a(?:\s+single)?\s+word)?)\b/i.test(body) ||
    /\bdid not move their (?:hands|feet|lips|mouth)\b/i.test(body)
  ) {
    return true;
  }
  const speech =
    /\b(?:said|say|says|answer(?:ed|s)?|spoke|speak|tell(?:s|ing)?|told|replied|reply|whisper(?:ed|s)?|offered)\b/i.test(
      body,
    );
  const empty =
    /\b(?:nothing|no answer|not\b[\s\S]{0,24}\b(?:word|answer|speak)|silent|quiet|mute|did not speak|didn't speak)\b/i.test(
      body,
    ) ||
    /\b(?:went|stayed|remained)\s+(?:stiff\s+and\s+)?(?:quiet|silent)\b/i.test(body) ||
    /\b(?:said|say|says|answer(?:ed|s)?|spoke|speak|offered)\s+no\b/i.test(body);
  return speech && empty;
}

/** Clause where this person is the subject (not merely named as the PC's object). */
function clauseSpeakerSubject(clause: string, label: string): boolean {
  const who = speakerNameTokens(label).map(esc).join('|');
  if (!who) return false;
  return new RegExp(`^\\W*(?:(?:the|a|an)\\s+)?(?:${who})\\b`, 'i').test(clause.trim());
}

/**
 * T10AK — tell/demand "start working" answered by a visible act (jabbed/pointed toward the lock),
 * not only by quoted speech. Shared by ensureSpokenAnswer and the action-followed gate.
 * Only subject-fronted addressee clauses count — never "Jax told the lockpick to stop stalling".
 */
export function demandActAnswered(playerInput: string, prose: string, speakerLabel: string): boolean {
  const act = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const body = (prose ?? '').replace(/\s+/g, ' ').trim();
  const label = (speakerLabel ?? '').trim();
  if (!act || !body || !label) return false;
  const theirBeat = splitClausesOutsideQuotes(body)
    .filter((c) => clauseSpeakerSubject(c, label))
    .join(' ');
  if (!theirBeat) return false;
  const demand =
    act.match(
      /\b(?:tell|order|command|demand(?:s|ed|ing)?)\b[\s\S]{0,48}?\bto\s+(\w+)/i,
    ) ??
    act.match(/\bstart\s+(\w+)/i) ??
    act.match(/\bstop\s+(\w+)/i);
  if (!demand) return false;
  const stem = demand[1]!.toLowerCase().replace(/(?:ing|ed|es|s)$/i, '');
  if (stem.length >= 3 && new RegExp(`\\b${esc(stem)}\\w*\\b`, 'i').test(theirBeat)) return true;
  // Directed act toward a place/object (toward the lock) — not "looked at Jax".
  const who = speakerNameTokens(label).map(esc).join('|');
  return new RegExp(
    `\\b(?:${who})\\b[^.!?]{0,100}\\b(?:toward|towards)\\s+(?:the\\s+)?[a-z]{3,}`,
    'i',
  ).test(theirBeat);
}

/** Split on .!? outside quotes so a PC "?" does not orphan the next speaker clause (T10AF T6). */
function splitClausesOutsideQuotes(prose: string): string[] {
  const raw = (prose ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return [];
  const out: string[] = [];
  let start = 0;
  let q: '"' | '\u201c' | null = null;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (q === '"') {
      if (ch === '"' || ch === '\u201d') q = null;
      continue;
    }
    if (q === '\u201c') {
      if (ch === '\u201d') q = null;
      continue;
    }
    if (ch === '"') {
      q = '"';
      continue;
    }
    if (ch === '\u201c') {
      q = '\u201c';
      continue;
    }
    if ((ch === '.' || ch === '!' || ch === '?') && (i + 1 >= raw.length || /\s/.test(raw[i + 1]!))) {
      const piece = raw.slice(start, i + 1).trim();
      if (piece) out.push(piece);
      start = i + 1;
      while (start < raw.length && /\s/.test(raw[start]!)) start += 1;
      i = start - 1;
    }
  }
  const tail = raw.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

/** Content-free silence already on the beat for this speaker (do not stack another shrug). */
function proseHasSpeakerSilence(prose: string, speaker: Speaker): boolean {
  for (const clause of splitClausesOutsideQuotes(prose)) {
    if (isSpeakerNonAnswerClause(clause, speaker.label)) return true;
  }
  return false;
}

/**
 * Drop content-free non-answer clauses for this speaker before attaching a real exchange.
 * T10AF — sentence-boundary only (never start on a prior quote's closer — that left
 * `"..." nothing at all, but his eyes` splices). Also drop orphan silence after a closed quote.
 */
/**
 * When a PC quote and an NPC non-answer share one clause (`…"?" The steward said nothing…`
 * — no period between), drop the non-answer tail after the last closed quote (T10AF / T10AD T6).
 */
function stripNonAnswerTailAfterQuote(clause: string, label: string): string {
  let lastEnd = -1;
  for (const m of clause.matchAll(/["\u201c][^"\u201d]*["\u201d]/g)) {
    lastEnd = m.index! + m[0].length;
  }
  if (lastEnd < 0) return clause;
  const head = clause.slice(0, lastEnd).trim();
  const tail = clause.slice(lastEnd).replace(/^[,;:\s]+/, '').trim();
  if (!tail) return head;
  if (isSpeakerNonAnswerClause(tail, label)) return head;
  return clause;
}

export function stripSpeakerSilence(prose: string, speaker: { label: string }): string {
  const label = (speaker.label ?? '').trim();
  if (!label) return prose;
  const parts = splitClausesOutsideQuotes(prose);
  const kept: string[] = [];
  for (const clause of parts) {
    let next = stripNonAnswerTailAfterQuote(clause, label);
    if (isSpeakerNonAnswerClause(next, label)) continue;
    // Orphan splice after a closed quote (same clause or next): `"…" nothing at all, but…`
    // never starts a new speaker sentence — drop the remnant (T10AF Dunn T147).
    next = next.replace(
      /(["\u201d])\s*(?:nothing at all|said nothing)\b(?!\s*[,:]?\s*["\u201c])[^.!?]*/gi,
      '$1',
    );
    if (
      kept.length &&
      /["\u201d]\s*$/.test(kept[kept.length - 1]!) &&
      /^(?:nothing at all|said nothing)\b/i.test(next) &&
      !clauseNamesSpeaker(next, label)
    ) {
      continue;
    }
    next = next.replace(/\s+/g, ' ').trim();
    if (next) kept.push(next);
  }
  return kept.join(' ').replace(/\s+/g, ' ').trim();
}

/** A speaker label must read as a name: one line, a few words, no question or chip word ("Greyhollow Who"). */
function isCleanName(p: string): boolean {
  if (!p || /[\n\r?!:;]/.test(p)) return false;
  const words = p.trim().split(/\s+/);
  if (words.length > 5) return false;
  return !words.some((w) => QUESTION_OR_CHIP.test(w));
}

/**
 * T10AP — typed "ask Maud" / "Maud if…" names a person who is not here. Do not fall back to the
 * nearest corpse/group; free text stays unanswered (nobody-here).
 */
function typedAbsentProperName(playerInput: string, here: Speaker[], pcName?: string | null): boolean {
  const ask = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  if (!ask) return false;
  const hit =
    ask.match(
      /\b(?:ask|tell|talk(?:\s+to)?|speak(?:\s+to)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s+if\b|\s+whether\b|\s+about\b|\b|,|\.|$)/,
    )?.[1]
    ?? ask.match(/\b([A-Z][a-z]{2,})(?:\s+if\b|\s+whether\b)/)?.[1]
    ?? '';
  const cand = hit.trim();
  if (cand.length < 3) return false;
  if (pcName && sameSpeaker(pcName, cand)) return false;
  return !here.some(
    (s) =>
      sameSpeaker(s.label, cand)
      || s.names.some((n) => sameSpeaker(n, cand) || new RegExp(`\\b${esc(n)}\\b`, 'i').test(cand)),
  );
}

/** The person the question is put to: the one the player named, else the opening lead, else the first here. */
function addressee(state: GameState, playerInput: string): { speaker: Speaker; alone: boolean } | null {
  const here = speakersHere(state);
  if (!here.length) return null;
  const said = playerInput.toLowerCase();
  const named =
    here.find((s) => s.names.some((n) => new RegExp(`\\b${esc(n.toLowerCase())}\\b`).test(said))) ??
    here.find((s) => s.label === fuzzyTypedName(playerInput, here.map((h) => h.label)));
  if (named) return { speaker: named, alone: here.length === 1 };
  // Absent proper name must not bind to the nearest present corpse/group (T10AP Maud → Rat Pack).
  if (typedAbsentProperName(playerInput, here, state.character?.name)) return null;
  const leadIds = new Set(openingCastRecords(state).map((r) => r.npcId));
  const lead = here.find((s) => s.record && leadIds.has(s.record.npcId));
  return { speaker: lead ?? here[0]!, alone: here.length === 1 };
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The sentence around a quote (outside the quote marks), used to tell who said it. */
function quoteContext(text: string, start: number, end: number): string {
  const before = text.slice(0, start);
  const lead = Math.max(before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '));
  const head = before.slice(lead + 1);
  // T10AD — leading attribution (`Jax said, "…"`) is enough. Trailing same-clause only
  // (`"…," the steward said`) — never a new sentence (`The steward said nothing…`),
  // which falsely credited the PC's quote to the alone NPC at Keep Gate T6.
  const after = text.slice(end);
  if (/^\s*[A-Z]/.test(after)) return head;
  const trail = after.match(
    /^\s*,?\s*((?:the\s+)?[A-Za-z][\w'’ -]{0,40}\s+(?:said|says|asked|asks|replied|replies|whispered|answered)\b)/i,
  );
  if (trail?.[1]) return `${head} ${trail[1].trim()}`;
  return head;
}

function mentions(context: string, names: string[]): boolean {
  return names.some((n) => new RegExp(`\\b${esc(n)}\\b`, 'i').test(context));
}

/** The sentence right before a quote — an action beat (`Sera looked him over. "…"`) attributes the line. */
function beatBefore(text: string, start: number): string {
  const before = text.slice(0, start);
  const own = Math.max(before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '));
  const head = before.slice(0, own + 1);
  const prev = Math.max(head.lastIndexOf('. ', head.length - 2), head.lastIndexOf('! ', head.length - 2), head.lastIndexOf('? ', head.length - 2));
  return head.slice(prev + 1);
}

/** Quotes in a text that belong to this speaker. An unattributed quote counts when they are the only one here. */
function quotesBy(
  text: string,
  speaker: Speaker,
  alone: boolean,
  others: Speaker[],
  pcName?: string | null,
): string[] {
  const out: string[] = [];
  const pcParts = (pcName ?? '').trim() ? nameParts(pcName!.trim()) : [];
  for (const m of text.matchAll(QUOTE)) {
    let context = quoteContext(text, m.index!, m.index! + m[0].length);
    const named = (c: string) => mentions(c, speaker.names) || others.some((o) => mentions(c, o.names));
    // T10AD — do not merge the prior beat when this clause already attributes speech
    // (`Jax said, "…"`). Merging `…to the steward…whisper` made the PC quote look like the
    // steward's answer (alone + name in beatBefore).
    if (!named(context) && !/\b(?:said|says|asked|asks|replied|replies|whispered|answered)\b/i.test(context)) {
      context = `${beatBefore(text, m.index!)} ${context}`;
    }
    const theirs = mentions(context, speaker.names);
    const someoneElse = others.some((o) => mentions(context, o.names));
    // T10AD — PC's own line (`Jax said, "…"`) is never the alone-NPC answer (Keep Gate T6).
    const pcOwns = pcParts.length > 0 && mentions(context, pcParts);
    if (theirs ? !someoneElse : alone && !someoneElse && !pcOwns) out.push(m[1]!.trim());
  }
  return out;
}

function firstSentence(words: string): string {
  const t = words.replace(/\s+/g, ' ').trim();
  const s = t.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? t;
  return /[.!?…—-]$/.test(s) ? s : `${s}.`;
}

/** Only the person's authored line for this question. An earlier quote reprinted is an echo, not an answer. */
function realLine(topic: SpokenTopic, speaker: Speaker): { line: string; source: 'authored' } | null {
  const authored = authoredTopicsFor(speaker.label).find((t) => t.aliases.some((a) => TOPIC_ALIASES[topic].test(a)));
  return authored ? { line: firstSentence(authored.line), source: 'authored' } : null;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Typed ask / talk aimed at someone here (not a physical I-act). */
function isTypedAskOrTalk(playerInput: string, state?: GameState): boolean {
  const t = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/^(?:talk(?:\s+to)?|speak(?:\s+to)?|ask)\b/i.test(t)) return true;
  // T10AF — open-thread chips ("Follow up with Osric: the delivery…") are asks.
  if (/^Follow up with\b/i.test(t)) return true;
  if (/["\u201c]/.test(t)) return true;
  // T10AC / T10P — stem forms (asking / telling) match intentParser speech markers.
  // `\bask\b` alone missed "asking Brannoc if…" (s8603 T6).
  if (/\bask(?:ing)?\b[\s\S]{0,60}\bif\b/i.test(t)) return true;
  if (
    /\bask(?:ing)?\s+(?:the\s+)?[\w'-]+(?:\s+[\w'-]+){0,2}\b/i.test(t) &&
    /\b(?:if|whether|about|what|who|where|why|how)\b/i.test(t)
  ) {
    return true;
  }
  // T10AA / T10AC / T10AD - shout/tell/call/ask(ing)/whisper at a present named person needs their reply.
  if (
    state &&
    /\b(?:ask(?:ing)?|tell(?:ing)?|shout(?:ing)?(?:\s+at)?|call(?:ing)?(?:\s+out)?(?:\s+to)?|say\s+to|whisper(?:ing)?(?:\s+to)?)\b/i.test(t)
  ) {
    const low = t.toLowerCase();
    if (speakersHere(state).some((s) => s.names.some((w) => w.length >= 3 && new RegExp(`\\b${esc(w.toLowerCase())}\\b`).test(low)))) {
      return true;
    }
  }
  // T10AI — stare / look down / address a present person or crowd still needs their reply beat
  // (LitRPG engineer stare; tabletop miller / exhausted faces).
  if (
    state &&
    /\b(?:star(?:e|ing)|glar(?:e|ing)|look(?:ing)?\s+(?:at|down)|address(?:ing)?|point(?:ing)?\s+(?:at|to|toward))\b/i.test(
      t,
    )
  ) {
    const low = t.toLowerCase();
    if (speakersHere(state).some((s) => s.names.some((w) => w.length >= 3 && new RegExp(`\\b${esc(w.toLowerCase())}\\b`).test(low)))) {
      return true;
    }
  }
  return false;
}

/**
 * T10AL — one owner per beat: if this speaker already has a said-line on the page (or the exact
 * exchange words), do not append again. Catches lastResort+seal / finishCommitted+seal doubles
 * when quote attribution is ambiguous.
 */
function proseHasSpeakerReply(prose: string, speaker: Speaker, words?: string): boolean {
  const body = (prose ?? '').replace(/\s+/g, ' ').trim();
  if (!body) return false;
  const label = esc(speaker.label);
  if (words) {
    const w = words.replace(/^["“]|["”]$/g, '').replace(/\s+/g, ' ').trim();
    if (w.length >= 3) {
      const q = esc(w);
      if (new RegExp(`${label}\\s+said,\\s*["\\u201c]${q}["\\u201d]?`, 'i').test(body)) return true;
      const now = sayWordSet(w);
      if (now.size >= 2) {
        for (const m of body.matchAll(QUOTE)) {
          const ctx = quoteContext(body, m.index!, m.index! + m[0].length);
          if (!mentions(ctx, speaker.names)) continue;
          const before = sayWordSet(m[1] ?? '');
          let hit = 0;
          for (const x of now) if (before.has(x)) hit += 1;
          if (hit / now.size >= 0.8) return true;
        }
      }
    }
  }
  return new RegExp(`${label}\\s+said,\\s*["\\u201c]`, 'i').test(body);
}

/** Drop a back-to-back identical `Name said, "…"` clone (two code paths each appended once). */
function collapseDuplicateSaid(prose: string): string {
  return (prose ?? '')
    .replace(
      /\b((?:[A-Z][\w'-]*(?:\s+[A-Z][\w'-]*){0,3})\s+said,\s*["\u201c][^"\u201d]+["\u201d]?)\s+\1(?=\s|$|[.!?])/g,
      '$1',
    )
    // T10AO — one silence owner per beat (compound physical clauses used to emit two).
    .replace(
      /\b((?:[Tt]he\s+)?[A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,3}\s+said nothing\.)(?:\s+\1)+/gi,
      '$1',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Look / Wait / travel chips are not free-act reaction beats (T10AO). */
function isPassiveObserveOrTravel(playerInput: string): boolean {
  const t = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return true;
  if (/^(?:look(?:\s+around)?|wait|listen|rest|scout|survey|scan|hold)\b/i.test(t)) return true;
  if (/^(?:travel|walk|go|head|leave|move)\b/i.test(t)) return true;
  return false;
}

function attachExchange(
  prose: string,
  speaker: Speaker,
  exchange: { line: string; words?: string },
): { prose: string; answer: SpokenAnswer } {
  let body = (prose ?? '').replace(/(?:^|\s)@+(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
  if (proseHasSpeakerReply(body, speaker, exchange.words)) {
    return { prose: collapseDuplicateSaid(body), answer: { status: 'already-quoted', speaker: speaker.label } };
  }
  const silenceOnly = !exchange.words && /\bsaid nothing\.?$/i.test(exchange.line);
  if (!silenceOnly) {
    body = stripSpeakerSilence(body, speaker);
    if (proseHasSpeakerReply(body, speaker, exchange.words)) {
      return { prose: collapseDuplicateSaid(body), answer: { status: 'already-quoted', speaker: speaker.label } };
    }
    const next = collapseDuplicateSaid(body ? `${body} ${exchange.line}` : exchange.line);
    return {
      prose: next,
      answer: {
        status: 'added',
        speaker: speaker.label,
        source: 'authored',
        line: exchange.words ? `"${exchange.words}"` : exchange.line,
      },
    };
  }
  if (proseHasSpeakerSilence(body, speaker)) {
    return { prose: collapseDuplicateSaid(body), answer: { status: 'already-quoted', speaker: speaker.label } };
  }
  return {
    prose: collapseDuplicateSaid(body ? `${body} ${exchange.line}` : exchange.line),
    answer: {
      status: 'added',
      speaker: speaker.label,
      source: 'authored',
      line: exchange.line,
    },
  };
}

/** Ensure a who / want / where answer carries the addressee's own quoted words, from the ledger only. */
export function ensureSpokenAnswer(
  prose: string,
  state: GameState,
  playerInput: string
): { prose: string; answer: SpokenAnswer } {
  const topic = asked(playerInput);
  const who = addressee(state, playerInput);
  // T10R / T10V — Talk chip / typed ask with someone here still needs an exchange beat when
  // stripUnauthorizedNpcSpeech dropped the writer's line (stub + bare `@`, or wrong crowd slot).
  if (!topic) {
    // T10AO — physical multi-clause free text opens an NPC reaction slot that converts to
    // "said nothing"; fill that silence once even when the line is not a typed ask (stare at
    // the PC name, sling+grip). Look/Wait/travel stay not-asked.
    const silenceOnPage = !!(who && proseHasSpeakerSilence(prose, who.speaker));
    const needsExchange =
      isTypedAskOrTalk(playerInput, state)
      || (silenceOnPage && !isPassiveObserveOrTravel(playerInput));
    if (!needsExchange) {
      return { prose: collapseDuplicateSaid(prose), answer: { status: 'not-asked' } };
    }
    if (!who) return { prose, answer: { status: 'nobody-here' } };
    const { speaker, alone } = who;
    const others = speakersHere(state).filter((s) => s.label !== speaker.label);
    const pc = state.character?.name ?? null;
    if (quotesBy(prose, speaker, alone, others, pc).length || proseHasSpeakerReply(prose, speaker)) {
      return { prose: collapseDuplicateSaid(prose), answer: { status: 'already-quoted', speaker: speaker.label } };
    }
    // T10AK — a visible act that answers a tell/demand is already the reply (do not stack motive).
    if (demandActAnswered(playerInput, prose, speaker.label)) {
      return { prose: collapseDuplicateSaid(prose), answer: { status: 'already-quoted', speaker: speaker.label } };
    }
    // T10S/T10U/T10X/T10Y/T10AD/T10AF — exchange needs content (ledger / cast / motive deflection).
    // Content-free silence on the page is replaced when words exist; never stacked with a stock quote.
    return attachExchange(prose, speaker, spokenExchangeLine(state, speaker, playerInput));
  }
  if (!who) return { prose, answer: { status: 'nobody-here' } };
  const { speaker, alone } = who;
  const others = speakersHere(state).filter((s) => s.label !== speaker.label);
  const pc = state.character?.name ?? null;
  if (quotesBy(prose, speaker, alone, others, pc).length || proseHasSpeakerReply(prose, speaker)) {
    return { prose: collapseDuplicateSaid(prose), answer: { status: 'already-quoted', speaker: speaker.label } };
  }
  const real = realLine(topic, speaker);
  if (!real) {
    // T10AD — typed speech (quote / whisper) still needs motive/ledger exchange when the
    // authored who/want/where bank is empty. Bare chips ("Who are you" / "Ask what they want")
    // keep the prior no-line miss so sheet-name echoes stay off.
    const typedSpeech =
      /["\u201c]/.test(playerInput) || /\bwhisper(?:ing|ed|s)?\b/i.test(playerInput);
    if (!typedSpeech) {
      return { prose, answer: { status: 'no-line', speaker: speaker.label } };
    }
    return attachExchange(prose, speaker, spokenExchangeLine(state, speaker, playerInput));
  }
  const line = `${capitalize(speaker.label)} said, "${real.line}"`;
  if (proseHasSpeakerReply(prose, speaker, real.line)) {
    return { prose: collapseDuplicateSaid(prose), answer: { status: 'already-quoted', speaker: speaker.label } };
  }
  const body = stripSpeakerSilence(prose.trim(), speaker);
  return {
    prose: collapseDuplicateSaid(body ? `${body} ${line}` : line),
    answer: { status: 'added', speaker: speaker.label, source: real.source, line },
  };
}
