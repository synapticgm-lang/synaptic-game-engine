/**
 * Batch 12f — Manus option 1 (talk-only E path).
 * Compact addressee envelope for callGm. Does not write A–D. No SNAPSHOT/CRAFT.
 */
import type { GameState } from './types';
import { realPresentPeople } from './chromeAuthority';
import { formatWriterFacingEvent, type CompletedEventPacket } from './completedEventPacket';
import { matchesLastKillName } from './combatAuthority';
import { hasMetBefore } from './npcMemory';
import {
  hallTalkAsksRefuse,
  hallTalkAsksWant,
  hallTalkAsksWho,
  openingAlreadyToldLine,
  openingCastLabel,
  openingSpokenIdentityQuote,
  openingSpokenRefuse,
  openingSpokenWant,
  shortCardCost,
  shortCardOffer,
  shortCardWant,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import { shouldUseSilentMudTurn } from './freeMudPresentation';

export type ResponsePath = 'A' | 'B' | 'C' | 'D' | 'E';
export type WriterOutcome = 'accepted' | 'retry' | 'fallback';

function clip(raw: string, max: number): string {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t;
}

/** Named person in the line if they are on the living ledger. */
export function addressedCastName(state: GameState, playerInput: string): string {
  const want = (playerInput ?? '').toLowerCase();
  const kill = state.sceneFacts?.lastKill?.name?.toLowerCase();
  const pool = realPresentPeople(state.sceneFacts?.present ?? []).filter((n) => {
    const low = n.toLowerCase();
    return !kill || (low !== kill && !kill.includes(low));
  });
  for (const n of pool) {
    const low = n.toLowerCase();
    if (want.includes(low) || want.includes(low.split(/\s+/).pop() ?? '___')) return n;
  }
  return openingCastLabel(state);
}

function identityHay(state: GameState): string {
  return [
    state.openingEstablishment?.pickedHookFallback,
    state.openingEstablishment?.pickedHook,
    state.currentLocation,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Card/ledger line the addressee already owns — never invent a deal. */
export function legalAddresseeFact(state: GameState, playerInput: string): string {
  const quote = openingSpokenIdentityQuote(openingCastLabel(state), {
    location: state.currentLocation,
    engineMode: state.engineMode,
    hay: identityHay(state),
  });
  if (hallTalkAsksWho(playerInput)) return clip(quote, 180);
  if (hallTalkAsksWant(playerInput)) {
    return clip([shortCardWant(state), shortCardOffer(state)].filter(Boolean).join(' '), 180);
  }
  if (hallTalkAsksRefuse(playerInput)) return clip(shortCardCost(state), 180);
  return clip([shortCardWant(state), shortCardOffer(state)].filter(Boolean).join(' ') || quote, 180);
}

export function classifyResponsePath(opts: {
  state: GameState;
  playerInput: string;
  subscriptionTier?: string;
  freeOpeningTurn?: boolean;
}): ResponsePath {
  const { state, playerInput } = opts;
  const complete = state.openingEstablishment?.complete === true;
  const sceneWritten = state.openingEstablishment?.sceneWritten === true;
  if (shouldStitchOpeningContinue(state, playerInput)) {
    return complete ? 'C' : 'B';
  }
  if (
    shouldUseSilentMudTurn({
      subscriptionTier: opts.subscriptionTier,
      openingComplete: complete,
      freeOpeningTurn: opts.freeOpeningTurn,
      playerInput,
    })
  ) {
    return 'D';
  }
  if (!sceneWritten && !complete) return 'A';
  return 'E';
}

export function buildTalkEnvelope(
  state: GameState,
  playerInput: string,
  packet: CompletedEventPacket
): string {
  const who = addressedCastName(state, playerInput);
  const fact = legalAddresseeFact(state, playerInput);
  const beats = (packet.recentBeats ?? []).slice(-2).map((b) => `- ${clip(b, 220)}`);
  return [
    'TALK:',
    `PLAYER SAID: ${clip(playerInput, 240) || '(empty)'}`,
    `ADDRESSEE: ${who || 'no named speaker on the ledger'}`,
    fact
      ? `ALREADY SAID (reuse if they asked this; do not invent a different deal): ${fact}`
      : 'ALREADY SAID: (none on the card — do not invent a want or name)',
    'LAST BEATS:',
    ...(beats.length ? beats : ['- (none)']),
    'Answer PLAYER SAID. Only ADDRESSEE may speak. Stay inside YOU MAY ONLY MENTION below.',
  ].join('\n');
}

/** E talk: addressee header + existing packet. Other verbs keep the packet only. */
/** E fail / empty GM: same spoken card pool as hall talk. Never Silence-held when CAST lives. */
export function spokenTalkFallback(state: GameState, playerInput: string): string {
  const kill = state.sceneFacts?.lastKill;
  const who = addressedCastName(state, playerInput);
  const where = (state.currentLocation || 'this room').replace(/\s+/g, ' ').trim();
  if (kill?.name && kill.remains && kill.outcome === 'victory' && matchesLastKillName(who, kill)) {
    return `${kill.name} stayed down at ${where}. They were a corpse, not a speaker. Leave, or search what they left.`;
  }
  if (!who || /\bpanel\b/i.test(who)) {
    return `Your question hung at ${where}. The room did not invent a speaker.`;
  }
  const met = hasMetBefore(state, who);
  if (hallTalkAsksWho(playerInput)) {
    return met || /already said|already answered/i.test((state.log ?? []).slice(-2).map((e) => e.content).join(' '))
      ? openingAlreadyToldLine(state, 'who')
      : openingSpokenIdentityQuote(who, {
          location: state.currentLocation,
          engineMode: state.engineMode,
          hay: identityHay(state),
        })
        ? `${who.charAt(0).toUpperCase() + who.slice(1)} answers you. ${openingSpokenIdentityQuote(who, {
            location: state.currentLocation,
            engineMode: state.engineMode,
            hay: identityHay(state),
          })}`
        : openingAlreadyToldLine(state, 'who');
  }
  if (hallTalkAsksRefuse(playerInput)) {
    const first = openingSpokenRefuse(state);
    return met ? openingAlreadyToldLine(state, 'refuse') : first;
  }
  const first = openingSpokenWant(state);
  if (met) return openingAlreadyToldLine(state, 'want');
  return first;
}

export function formatTalkWriterFacing(
  packet: CompletedEventPacket,
  state: GameState,
  opts?: { stricter?: boolean }
): string {
  const base = formatWriterFacingEvent(packet, opts);
  const spoke = packet.outcome === 'spoke' || packet.verb === 'spoke';
  if (!spoke) return base;
  return `${buildTalkEnvelope(state, packet.playerAction, packet)}\n\n${base}`;
}

export function tallyResponsePaths(
  turns: Array<{ responsePath?: ResponsePath; writerOutcome?: WriterOutcome }>
): {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  E_accepted: number;
  E_retry: number;
  E_fallback: number;
} {
  const out = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    E_accepted: 0,
    E_retry: 0,
    E_fallback: 0,
  };
  for (const t of turns) {
    const p = t.responsePath;
    if (p === 'A' || p === 'B' || p === 'C' || p === 'D' || p === 'E') out[p] += 1;
    if (p === 'E') {
      if (t.writerOutcome === 'accepted') out.E_accepted += 1;
      if (t.writerOutcome === 'retry') out.E_retry += 1;
      if (t.writerOutcome === 'fallback') out.E_fallback += 1;
    }
  }
  return out;
}
