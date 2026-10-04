/**
 * Batch 12f — Manus option 1 (talk-only E path).
 * Compact addressee envelope for callGm. Does not write A–D. No SNAPSHOT/CRAFT.
 */
import type { GameState, NarrativePerspective } from './types';
import { sealedCastNames } from './beatContract';
import { formatWriterFacingEvent, type CompletedEventPacket } from './completedEventPacket';
import { matchesLastKillName } from './combatAuthority';
import { hasMetBefore } from './npcMemory';
import { openingCastRecords } from './npcRecords';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import {
  hallTalkAsksRefuse,
  hallTalkAsksWant,
  hallTalkAsksWho,
  openingCastLabel,
  openingCastNames,
  openingSpokenIdentityQuote,
  openingWhoAskLineFromLabel,
  openingSpokenRefuse,
  openingSpokenWant,
  shortCardCost,
  shortCardOffer,
  shortCardWant,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import { shouldUseSilentMudTurn } from './freeMudPresentation';
import { resolveLitRpgFolkStamp } from '@/data/quests/litrpgMainSpines';
import { authoredTopicForState } from './manusTopicBanks';

export type ResponsePath = 'A' | 'B' | 'C' | 'D' | 'E';
export type WriterOutcome = 'accepted' | 'retry' | 'fallback';

function clip(raw: string, max: number): string {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t;
}

function livingCast(state: GameState): string[] {
  const kill = state.sceneFacts?.lastKill?.name?.toLowerCase();
  // The card's own person (the innkeep) on the ledger's present list can answer, named or not.
  const cardCast = openingCastNames(state).map((c) => c.toLowerCase());
  const here = (state.sceneFacts?.present ?? []).filter(
    (n) => typeof n === 'string' && cardCast.includes(n.trim().toLowerCase())
  );
  const cast = [...sealedCastNames(state)];
  for (const n of here) {
    if (!cast.some((c) => c.toLowerCase() === n.toLowerCase())) cast.push(n);
  }
  return cast.filter((n) => {
    const low = n.toLowerCase();
    return !kill || (low !== kill && !kill.includes(low));
  });
}

/** Named person in the line if they are on the living ledger; else the first living cast. */
export function addressedCastName(state: GameState, playerInput: string): string {
  const want = (playerInput ?? '').toLowerCase();
  const cast = livingCast(state);
  return (
    cast.find((n) => {
      const low = n.toLowerCase();
      return want.includes(low) || want.includes(low.split(/\s+/).pop() ?? '___');
    }) ?? cast[0] ?? ''
  );
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
  const who = addressedCastName(state, playerInput);
  const quote = openingSpokenIdentityQuote(who, {
    location: state.currentLocation,
    engineMode: state.engineMode,
    hay: identityHay(state),
    stamp: resolveLitRpgFolkStamp(state),
    state,
  });
  if (hallTalkAsksWho(playerInput)) return clip(quote, 180);
  if (hallTalkAsksWant(playerInput)) {
    return clip([shortCardWant(state), shortCardOffer(state)].filter(Boolean).join(' '), 180);
  }
  if (hallTalkAsksRefuse(playerInput)) return clip(shortCardCost(state), 180);
  const topic = authoredTopicForState(state, who, playerInput);
  return clip([shortCardWant(state), shortCardOffer(state)].filter(Boolean).join(' ') || topic || quote, 180);
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
  // 13b — C/D only if a skip gate still fires. After page 1 both gates are off → E.
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
  // A parley is spoken to the foe the engine resolved, not to whoever is first on the cast list.
  const foe = packet.verb === 'parleyed' ? (packet.target ?? '').trim() : '';
  const who = foe || addressedCastName(state, playerInput);
  const met = !foe && !!who && hasMetBefore(state, who);
  const fact = foe ? '' : legalAddresseeFact(state, playerInput);
  const askedAgain = /\b(?:again|repeat|remind me|one more time)\b/i.test(playerInput ?? '');
  const told = !!fact && !askedAgain && priorGmHay(state).includes(fact.slice(0, 40).toLowerCase());
  const pc = packet.pc?.name?.trim() || 'the player character';
  const beats = packet.infoSheet ? [] : (packet.recentBeats ?? []).slice(-2).map((b) => `- ${clip(b, 220)}`);
  return [
    'TALK:',
    `PLAYER SAID: ${clip(playerInput, 240) || '(empty)'}`,
    `ADDRESSEE: ${who || 'no named speaker on the ledger'}`,
    ...(met ? [`MET: ${who} already met ${pc} and gave their name. They do not introduce themselves again.`] : []),
    told
      ? `ALREADY TOLD (${pc} has heard this; do not say it again — answer with what is new, or a short plain reply): ${fact}`
      : fact
        ? `ALREADY SAID (reuse if they asked this; do not invent a different deal): ${fact}`
        : 'ALREADY SAID: (none on the card — do not invent a want or name)',
    ...(packet.infoSheet ? [] : ['LAST BEATS:', ...(beats.length ? beats : ['- (none)'])]),
    `Answer PLAYER SAID. Only ADDRESSEE may speak. ${pc} says only the words in PLAYER SAID; if PLAYER SAID is an action, give ${pc} no spoken line. Stay inside YOU MAY ONLY MENTION below.`,
  ].join('\n');
}

function openingCastIsHere(state: GameState, present: string[]): boolean {
  const here = new Set(present.map((p) => p.trim().toLowerCase()));
  return openingCastRecords(state).some((r) =>
    [r.npcName, ...(r.aliases ?? [])].some((n) => here.has(n.trim().toLowerCase()))
  );
}

function priorGmBodies(state: GameState): Set<string> {
  return new Set(
    (state.log ?? [])
      .filter((e) => e.role === 'gm')
      .map((e) => String(e.content ?? '').replace(/\s+/g, ' ').trim().toLowerCase())
  );
}

function priorGmHay(state: GameState): string {
  return [...priorGmBodies(state)].join(' ');
}

/** E talk: addressee header + existing packet. Other verbs keep the packet only. */
/** E fail / empty GM: same spoken card pool as hall talk. Never Silence-held when CAST lives. */
export function spokenTalkFallback(state: GameState, playerInput: string): string {
  const where = (state.currentLocation || 'this place').replace(/\s+/g, ' ').trim();
  const present = livingCast(state);
  const place = matchHub(hubsForBibleId(state.campaignBibleId), where)?.name ?? where;
  const who = addressedCastName(state, playerInput);
  if (!who || /\bpanel\b/i.test(who)) return 'Nobody here answered.';
  const out = spokenTalkFallbackInner(state, playerInput, who).replace(/\s+/g, ' ').trim();
  const openingLine = openingSpokenWant(state).replace(/\s+/g, ' ').trim();
  const openingBlocked =
    (state.turn ?? 0) > 3 || (present.length > 0 && !openingCastIsHere(state, present));
  const isOpening = !!openingLine && out.includes(openingLine);
  if (out && !priorGmBodies(state).has(out.toLowerCase()) && !(isOpening && openingBlocked)) return out;
  return `${who} heard you out at ${place} and did not repeat themselves. They waited for something new.`;
}

function spokenTalkFallbackInner(state: GameState, playerInput: string, who: string): string {
  const kill = state.sceneFacts?.lastKill;
  const where = (state.currentLocation || 'this room').replace(/\s+/g, ' ').trim();
  if (kill?.name && kill.remains && kill.outcome === 'victory' && matchesLastKillName(who, kill)) {
    return `${kill.name} stayed down at ${where}. They were a corpse, not a speaker. Leave, or search what they left.`;
  }
  const met = hasMetBefore(state, who);
  // 27i — opening-card lines belong to the opener only; never another NPC's want, never a reprint.
  const opener = openingCastLabel(state).trim().toLowerCase();
  const low = who.trim().toLowerCase();
  const isOpener =
    (!!opener && (low === opener || opener.includes(low) || low.includes(opener)))
    || openingCastRecords(state).some((r) =>
      [r.npcName, ...(r.aliases ?? [])].some((n) => n.trim().toLowerCase() === low)
    );
  const place = matchHub(hubsForBibleId(state.campaignBibleId), where)?.name ?? where;
  const head = who.charAt(0).toUpperCase() + who.slice(1);
  const plain = `${head} listened at ${place} and kept the answer short.`;
  const idOpts = {
    location: state.currentLocation,
    engineMode: state.engineMode,
    hay: identityHay(state),
    stamp: resolveLitRpgFolkStamp(state),
    state,
  };
  if (hallTalkAsksWho(playerInput)) {
    if (met) return `${head} had already told you who they are.`;
    return openingSpokenIdentityQuote(who, idOpts) ? openingWhoAskLineFromLabel(who, idOpts) : plain;
  }
  if (hallTalkAsksRefuse(playerInput)) {
    return isOpener && !met ? openingSpokenRefuse(state) || plain : plain;
  }
  const topic = authoredTopicForState(state, who, playerInput);
  if (isOpener && !met) return openingSpokenWant(state) || topic || plain;
  return topic || plain;
}

export function formatTalkWriterFacing(
  packet: CompletedEventPacket,
  state: GameState,
  opts?: { stricter?: boolean; perspective?: NarrativePerspective }
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
