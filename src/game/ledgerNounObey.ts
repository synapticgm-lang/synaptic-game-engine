/**
 * Batch 13c — AI writes; ledger owns nouns.
 * Deterministic rewrite after callGm. Not a Continuity-Warden LLM.
 * Do not swap the whole beat for a 2-line bank when one name is off-list.
 */
import type { GameState } from './types';
import { isDeadFoeReopenedAsLiving } from './combatAuthority';
import {
  compileNounAllowlist,
  isDroughtStubProse,
  lastResortStoryBody,
  mentionAllowlistHas,
  type CompletedEventPacket,
} from './completedEventPacket';
import { cardRoleStandIn, openingCastNames } from './openingEstablishment';

const PERSON_INVENT =
  /\b((?:High Chanter|Brother|Sister|Father|Mother|Captain|Envoy)\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?|[A-Z][a-z'-]+\s+[A-Z][a-z'-]+)\b/g;

const SENTENCE_START_SKIP = new Set([
  'the', 'a', 'an', 'your', 'you', 'then', 'after', 'before', 'when', 'while',
  'but', 'and', 'so', 'now', 'there', 'this', 'that', 'these', 'those', 'its',
  'his', 'her', 'their', 'our', 'my', 'once', 'still', 'next', 'last', 'first',
  'dust', 'she', 'he', 'they', 'it', 'something', 'someone',
]);

const PRESENCE_VERB =
  /\b(?:stood|stands|watched|watching|arrived|entered|stepped behind|behind you|beside you|arms folded)\b/i;

function splitSentences(text: string): string[] {
  return (text ?? '').split(/(?<=[.!?])\s+/).filter((s) => s.trim());
}

function tidy(text: string): string {
  return (text ?? '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/\s+\./g, '.')
    .trim();
}

export function inventedPersonNamesNotOnAllowlist(prose: string, allowlist: string[]): string[] {
  const body = (prose ?? '').trim();
  if (!body) return [];
  const found: string[] = [];
  const seen = new Set<string>();
  const re = new RegExp(PERSON_INVENT.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const name = (m[1] ?? '').trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    const first = name.split(/\s+/)[0]?.toLowerCase() ?? '';
    const atStart = m.index === 0 || /[\n.!?]\s*$/.test(body.slice(Math.max(0, m.index - 8), m.index));
    if (atStart && SENTENCE_START_SKIP.has(first) && !/\s/.test(name)) continue;
    if (mentionAllowlistHas(allowlist, name)) continue;
    seen.add(name.toLowerCase());
    found.push(name);
  }
  return found;
}

function scrubCastAsPermit(text: string, castNames: string[]): string {
  let next = text;
  for (const name of castNames) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    next = next.replace(
      new RegExp(
        `\\b(?:the\\s+)?${esc}(?:\\s+Quill)?\\s+is\\s+a\\s+(?:permit|mark(?:\\s+of\\s+sanctioned\\s+access)?|token|pass|ribbon)\\b`,
        'gi'
      ),
      'the ribbon is a permit'
    );
  }
  next = next.replace(
    /\bthe Archivist Lene(?:\s+Quill)?\s+is\s+a\s+(?:permit|mark)\b/gi,
    'the ribbon is a permit'
  );
  next = next.replace(
    /\bArchivist Lene(?:\s+Quill)?\s+is\s+a\s+(?:permit|mark)\b/gi,
    'the ribbon is a permit'
  );
  return next;
}

function dropOrRewriteInvented(sent: string, invented: string[], role: string): string {
  let next = sent;
  for (const name of invented) {
    if (!name || !new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(next)) continue;
    if (PRESENCE_VERB.test(next)) return '';
    next = next.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), role);
  }
  return next;
}

/**
 * Keep the AI sentences. Rewrite novel people / CAST-as-object / living lastKill talk.
 * Never swap the paragraph for a drought bank.
 */
export function obeyLedgerNouns(
  prose: string,
  state: GameState,
  packet?: CompletedEventPacket
): { prose: string; notes: string[] } {
  const notes: string[] = [];
  let next = (prose ?? '').trim();
  if (!next) return { prose: '', notes };

  const hallTalk = packet?.verb === 'spoke' || packet?.outcome === 'spoke';
  const allowlist = packet?.allowlist?.length
    ? packet.allowlist
    : compileNounAllowlist(state, [], { hallTalk });
  const cast = openingCastNames(state);
  const role = cardRoleStandIn(state);

  const beforePermit = next;
  next = scrubCastAsPermit(next, cast);
  if (next !== beforePermit) notes.push('cast-as-permit');

  const invented = inventedPersonNamesNotOnAllowlist(next, allowlist);
  if (invented.length) {
    const kept = splitSentences(next)
      .map((s) => dropOrRewriteInvented(s, invented, role))
      .filter((s) => s.trim().length > 8);
    next = tidy(kept.join(' '));
    notes.push('invented-name');
  }

  const kill = state.sceneFacts?.lastKill ?? packet?.lastKill;
  if (kill?.name && kill.remains && kill.outcome === 'victory' && !state.activeEncounter) {
    if (isDeadFoeReopenedAsLiving(next, kill, false)) {
      const kept = splitSentences(next).filter((s) => !isDeadFoeReopenedAsLiving(s, kill, false));
      next = tidy(kept.join(' '));
      notes.push('lastKill-talk');
    }
  }

  return { prose: tidy(next), notes };
}

/** Accept path: scrub nouns, then last good GM / page-1 paragraph if the body emptied. */
export function acceptObeyedStoryBody(
  prose: string,
  state: GameState,
  packet?: CompletedEventPacket
): { prose: string; notes: string[]; usedLastResort: boolean } {
  const obeyed = obeyLedgerNouns(prose, state, packet);
  let body = obeyed.prose;
  if (body && !isDroughtStubProse(body) && body.length >= 24) {
    return { prose: body, notes: obeyed.notes, usedLastResort: false };
  }
  const resort = lastResortStoryBody(state, packet);
  return {
    prose: resort.prose,
    notes: [...obeyed.notes, 'last-resort'],
    usedLastResort: true,
  };
}
