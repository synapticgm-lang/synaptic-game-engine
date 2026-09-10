/** Edge stub — hall-talk owners live on the client. Lets completedEventPacket boot. */

export function hallTalkAsksWhere(raw: string): boolean {
  return /\bwhere am(?: i)?\b|\bwhere are we\b|\bwhere is this\b/i.test(raw ?? '');
}

export function hallTalkAsksWho(raw: string): boolean {
  return /\bwho (?:is|are) (?:it|that|you)\b|\bwhat'?s yours\b/i.test(raw ?? '');
}

export function hallTalkAsksWant(raw: string): boolean {
  const t = raw ?? '';
  if (/\bask\b.+\bwhat they want\b/i.test(t) && !/\bask what they want\b/i.test(t)) return false;
  return /\bwhat (?:do you|do they|d'?you) want\b|\bask what they want\b|\bwhat they want\b|\bwhat'?s going on\b/i.test(t);
}

export function hallTalkAsksPanel(raw: string): boolean {
  return /\bblue (?:screen|panel)\b/i.test(raw ?? '');
}

export function isHallTalkPlayerLine(raw: string): boolean {
  const p = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!p) return false;
  if (/\b(travel|attack|flee|leave|exit)\b/i.test(p)) return false;
  return hallTalkAsksWhere(p) || hallTalkAsksWho(p) || hallTalkAsksWant(p) || hallTalkAsksPanel(p);
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

export function openingWhoAskLineFromLabel(who: string): string {
  const head = who ? who.charAt(0).toUpperCase() + who.slice(1) : 'They';
  const plural = /\b(people|envoys|priests|handlers|sides)\b/i.test(who);
  return plural
    ? `${head} are the ones asking. They have not given you a name back.`
    : `${head} is the one asking. They have not given you a name back.`;
}
