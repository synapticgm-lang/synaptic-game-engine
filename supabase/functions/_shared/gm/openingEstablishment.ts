/** Edge stub — hall-talk owners live on the client. Lets completedEventPacket boot. */

import type { GameState } from './types.ts';
import { resolveNpcRecord } from './npcRecords.ts';

export function hallTalkAsksWhere(raw: string): boolean {
  return (
    /\bwhere am(?: i)?\b|\bwhere are we\b|\bwhere is this\b/i.test(raw ?? '')
    || /\bdon'?t know (?:of )?this\b|\bnever heard of (?:this|the)\b|\bwhat is this (?:place|circle|hall|room)\b/i.test(
      raw ?? ''
    )
  );
}

export function hallTalkAsksWho(raw: string): boolean {
  return /\bwho (?:is|are) (?:it|that|you)\b|\bwhat'?s yours\b/i.test(raw ?? '');
}

export function hallTalkAsksWant(raw: string): boolean {
  const t = raw ?? '';
  if (/\bask\b.+\bwhat they want\b/i.test(t) && !/\bask what they want\b/i.test(t)) return false;
  if (/\bi want to (?:leave|go|walk|run)\b/i.test(t) && !/\bwhat\b/i.test(t)) return false;
  return (
    /\bwhat\b.{0,32}\bwant\b/i.test(t)
    || /\bask what they want\b/i.test(t)
    || /\bwhat they want\b/i.test(t)
    || /\bwhat'?s going on\b/i.test(t)
    || /\bwhy should i(?: help)?\b/i.test(t)
    || /\bwhat(?:'s| is|s)\b.{0,24}\b(?:actual(?:ly)? )?deal\b/i.test(t)
  );
}

export function hallTalkAsksRefuse(raw: string): boolean {
  const t = raw ?? '';
  if (!t.trim()) return false;
  if (/\brefuse to (?:give|say)\b/i.test(t)) return false;
  return (
    /\bwhat happens if i refuse\b/i.test(t)
    || /\b(?:if|when|should) i refuse\b/i.test(t)
    || (/\brefuse\b/i.test(t) && !/\brefuse to (?:give|say)\b/i.test(t))
  );
}

export function hallTalkAsksPanel(raw: string): boolean {
  const t = raw ?? '';
  if (!t.trim()) return false;
  return (
    /\bblue\s+(?:screen|panel|window)\b/i.test(t)
    || /\bsystem\s+(?:panel|screen|window|interface|display)\b/i.test(t)
    || /\b(?:inspect|examine|read|check|look at|study)\b.{0,48}\b(?:panel|screen|interface|system)\b/i.test(t)
    || /\bwhat(?:'s| is) (?:the |this )?(?:blue )?(?:screen|panel)\b/i.test(t)
  );
}

export function hallTalkAsksStayLeave(raw: string): boolean {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/\b(leave the scene|leave through|walk away|travel|attack|flee)\b/i.test(t)) return false;
  return (
    /\b(?:can|may|should|do) i (?:leave|stay)\b/i.test(t)
    || /\bdo i need to stay\b/i.test(t)
    || /\bstay on the (?:ship|boat|deck|hold)\b/i.test(t)
    || /\bcan i (?:ever )?(?:go|get) (?:home|back)\b/i.test(t)
    || /\bget back home\b/i.test(t)
    || /\bto earth\b/i.test(t)
    || (/\bor (?:can i )?leave\b/i.test(t) && /\b(?:stay|ship|need)\b/i.test(t))
  );
}

export function playerAskedWhyPulled(raw: string): boolean {
  const p = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!p) return false;
  return (
    /\bwho summoned\b|\byou summoned me\b|\bwhy .{0,48}(?:summon|pull|want|here|bought|mark|rite)\b|\bwhat(?:'s| is) going on\b|\bwhat they want\b|\bask what they want\b|\bget back home\b|\bto earth\b|\bcargo run\b|\bcan i ever get (?:back )?home\b/i.test(
      p
    )
  );
}

export function isHallTalkPlayerLine(raw: string): boolean {
  const p = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!p) return false;
  if (/\b(travel|attack|flee)\b/i.test(p)) return false;
  if (/\b(leave the scene|leave through|walk away)\b/i.test(p) && !hallTalkAsksStayLeave(p)) {
    return false;
  }
  if (
    /\b(leave|exit)\b/i.test(p)
    && !hallTalkAsksStayLeave(p)
    && !hallTalkAsksWant(p)
    && !hallTalkAsksRefuse(p)
    && !playerAskedWhyPulled(p)
  ) {
    return false;
  }
  return (
    hallTalkAsksWhere(p)
    || hallTalkAsksWho(p)
    || hallTalkAsksWant(p)
    || hallTalkAsksRefuse(p)
    || hallTalkAsksStayLeave(p)
    || hallTalkAsksPanel(p)
    || playerAskedWhyPulled(p)
  );
}

export function openingStayLeaveLine(_state?: unknown): string {
  return 'They have not said whether you must stay or may leave.';
}

export function openingCastLabel(_state?: unknown): string {
  return 'the people who pulled you';
}

export function shortCardWant(_state?: unknown): string {
  return '';
}

export function openingWantLine(_state?: unknown): string {
  return '';
}

export function openingSpokenIdentityQuote(
  who: string,
  ctx?: { location?: string; engineMode?: string; hay?: string; state?: GameState }
): string {
  if (/\bpanel\b/i.test(who)) return '';
  const record = ctx?.state ? resolveNpcRecord(ctx.state, who) : undefined;
  if (record) return `"${record.npcName}. You asked who."`;
  const raw = (who || 'They').replace(/\s+/g, ' ').trim();
  // 28b — a spoken line starts with a capital ("The innkeep. You asked who.").
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  return `"${label}. You asked who. We are the ones who found you here."`;
}

export function openingWhoAskLineFromLabel(
  who: string,
  opts?: {
    nameLocked?: boolean;
    quote?: string;
    location?: string;
    engineMode?: string;
    hay?: string;
    state?: GameState;
  }
): string {
  const head = who ? who.charAt(0).toUpperCase() + who.slice(1) : 'They';
  const verb = /\b(people|envoys|priests|handlers|sides|militia|figures)\b/i.test(who) || /^both /i.test(who)
    ? 'answer'
    : 'answers';
  const quote =
    opts?.quote
    ?? openingSpokenIdentityQuote(who, {
      location: opts?.location,
      engineMode: opts?.engineMode,
      hay: opts?.hay,
      state: opts?.state,
    });
  if (quote) return `${head} ${verb} you. ${quote}`;
  if (opts?.nameLocked) return `${head} ${verb} you. They already have your name.`;
  return `${head} ${verb} you. They have not given you a name back.`;
}

export function isOpeningCardActLine(raw: string): boolean {
  return /\b(sign the book|read the page|outline what the page says)\b/i.test(raw ?? '');
}

export function openingCastNames(state?: {
  sceneFacts?: { present?: string[] };
  openingEstablishment?: { pickedHook?: string };
}): string[] {
  const present = (state?.sceneFacts?.present ?? []).filter((n) => (n ?? '').trim().length > 1);
  if (present.length) return present;
  const who = (state?.openingEstablishment?.pickedHook ?? '').match(
    /Who is here[^:\n]*:\s*([^\n]+)/i
  );
  return who?.[1] ? [who[1].replace(/\s+and\s+.*$/, '').trim()] : [];
}

export function cardSceneMentionTokens(state?: { openingEstablishment?: { pickedHook?: string } }): string[] {
  const hook = state?.openingEstablishment?.pickedHook ?? '';
  const offer = hook.match(/Opening offer[^:\n]*:\s*([^\n]+)/i);
  return offer?.[1] ? [offer[1].slice(0, 48).trim()] : [];
}

export function cardRoleStandIn(state?: { sceneFacts?: { present?: string[] } }): string {
  return openingCastNames(state)[0] || 'someone here';
}

export function shortCardOffer(_state?: unknown): string {
  return '';
}

export function lockedOpeningPcName(state?: {
  openingEstablishment?: { answers?: { name?: string } };
  character?: { name?: string };
}): string | null {
  const n = (state?.openingEstablishment?.answers?.name ?? state?.character?.name ?? '').trim();
  if (!n || /unknown survivor/i.test(n)) return null;
  if (n.split(/\s+/).length > 4 || n.length > 40) return null;
  return n;
}

export function proseAsksForPcName(body: string): boolean {
  return /what name|the panel waits on a name|what do you enter/i.test(body ?? '');
}

export function stripLockedNameAsk(body: string): string {
  return (body ?? '')
    .replace(/(?:\s+The panel waits on a name\.)?(?:\s+What name[^?]*\?)\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizeLockedNameBeat(
  state: {
    openingEstablishment?: { answers?: { name?: string } };
    character?: { name?: string };
  },
  body: string
): string {
  if (!lockedOpeningPcName(state) || !body) return body;
  if (!proseAsksForPcName(body)) return body;
  return stripLockedNameAsk(body);
}

export function isNameTelegramProse(body: string): boolean {
  const t = (body ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/^They have the name [A-Za-z][A-Za-z'-]{1,20}\.?$/i.test(t)) return true;
  if (/The name \S+ already stood/i.test(t) && /The room waited/i.test(t)) return true;
  return false;
}

export function openingSpokenWant(_state?: unknown): string {
  return 'They have not said what they want yet.';
}

export function openingWhoAskLine(state?: {
  currentLocation?: string;
  engineMode?: string;
}): string {
  return openingWhoAskLineFromLabel(openingCastLabel(state), {
    location: state?.currentLocation,
    engineMode: state?.engineMode,
  });
}

export function hallTopicAlreadyAnswered(
  state?: { log?: Array<{ role?: string; content?: string }> },
  topic?: string
): boolean {
  if (!topic) return false;
  return (state?.log ?? []).some((e) => {
    if (e.role !== 'player') return false;
    const line = e.content ?? '';
    if (topic === 'want') return hallTalkAsksWant(line) || playerAskedWhyPulled(line);
    if (topic === 'who') return hallTalkAsksWho(line);
    if (topic === 'refuse') return hallTalkAsksRefuse(line);
    return false;
  });
}

export function openingNameLockSpokenBeat(state?: {
  openingEstablishment?: { answers?: { where?: string; name?: string } };
  currentLocation?: string;
  character?: { name?: string };
}): string {
  const place = (
    state?.openingEstablishment?.answers?.where
    || state?.currentLocation
    || 'this room'
  ).replace(/\s+/g, ' ').trim();
  const here = /^(?:a|an|the)\s/i.test(place) ? `in ${place}` : `in the ${place}`;
  return sanitizeLockedNameBeat(state ?? {}, `You are ${here}. ${openingSpokenWant(state)}`);
}

// --- 27d edge stubs: names completedEventPacket / padUniverse import from the client module. ---
export type HallTalkTopic = 'who' | 'refuse' | 'stayLeave' | 'want' | 'panel' | 'where';

export function hallTalkTopic(raw: string): HallTalkTopic | null {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (hallTalkAsksWho(t)) return 'who';
  if (hallTalkAsksRefuse(t)) return 'refuse';
  if (hallTalkAsksStayLeave(t)) return 'stayLeave';
  if (hallTalkAsksWant(t) || playerAskedWhyPulled(t)) return 'want';
  if (hallTalkAsksPanel(t)) return 'panel';
  if (hallTalkAsksWhere(t)) return 'where';
  return null;
}

export function isAcceptOfferLine(raw: string): boolean {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return (
    /\b(?:i )?(?:agree|accept)\b/i.test(t)
    || /\bi(?:'ll| will) (?:work|help|take|do)\b/i.test(t)
    || /\bgive me the (?:kit|lamp|tabard|gloves|work)\b/i.test(t)
    || /\byes to the work\b/i.test(t)
    || /\btake the (?:deal|kit|offer|work|lamp)\b/i.test(t)
  );
}

/** Edge stub: name-give detection lives on the client. */
export function isOpeningNameGiveLine(_raw: string): boolean {
  return false;
}

export function castSpeakVerb(who: string): 'answer' | 'answers' {
  const w = (who ?? '').replace(/\s+/g, ' ').trim();
  if (!w) return 'answer';
  if (/\band\b/i.test(w) || /^both\b/i.test(w)) return 'answer';
  if (/\b(people|envoys|priests|handlers|sides|militia|figures|scouts|pickets|engineers|guards|chirurgeons)\b/i.test(w)) {
    return 'answer';
  }
  return 'answers';
}

/** Edge stub: card cost lives on the client. */
export function openingSpokenRefuse(_state?: unknown): string {
  return 'They have not said what refusing would cost.';
}

export function isCombatFamilyPad(choice: string): boolean {
  return /\b(press the attack|attack|flee|parley|strike|engage|fight|keep running|try to flee)\b/i.test(
    choice ?? ''
  );
}

/** Edge stub: cover-turn starvation is decided on the client. */
export function shouldStarveCombatPadsOnCover(_state?: unknown): boolean {
  return false;
}

/** Edge stub (27i): the client decides whether a line names another NPC (src/game/openingEstablishment.ts). */
export function lineNamesOtherNpc(_state?: unknown, _line?: string): boolean {
  return false;
}
