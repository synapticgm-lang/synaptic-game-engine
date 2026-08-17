import type { GameState } from './types';
import { remainingDungeonMobs } from './ledgerCombat';

export type FactLockKind = 'clock' | 'silence' | 'kit' | 'stub' | 'weapon' | 'cleared';

export interface FactLockViolation {
  kind: FactLockKind;
  reason: string;
}

const CLOCK_SKIP =
  /\b(hours?\s+ago|hours?\s+later|hours?\s+have\s+passed|from just hours|unrecognizable from just hours|next (?:day|morning)|the next day|days?\s+(?:later|ago)|weeks?\s+(?:later|ago))\b/i;

const SILENCE_ONLY =
  /\b(eerie(?:ly)?\s+silence|eerily silent|unnervingly quiet|replaced by an? (?:eerie )?silence|world feels frozen|holding its breath)\b/i;

const EMPTY_STREET =
  /\b(empty (?:street|buildings|road)|no one (?:is )?(?:here|around|responds)|deserted|abandoned street)\b/i;

const CROWD_STILL_HERE =
  /\b(people|crowd|bystanders?|passers?[- ]?by|shouting|scream(?:ing)?|yelling)\b/i;

const SHOUTING = /\b(shout(?:ing)?|scream(?:ing)?|yell(?:ing)?|scramble|panic|crying out)\b/i;

const KIT_RECAP =
  /\b(patting (?:your |my )?pockets|instinctively.{0,60}pockets|confirming the presence of|(?:Minor )?Health Vial|Mana Crystal)\b/i;

const PLAYER_ASKED_KIT =
  /\b(pocket|inventory|what (?:do i|am i) (?:carry|have)|health vial|mana crystal|check (?:my )?(?:gear|pack|bag)|what(?:'s| is) in my)\b/i;

const STUB_MARKERS =
  /the last beat holds|the people who were already here are still here|you are still in \w[\w\s,]{0,40}\.\s*the last beat/i;

const REFUSAL_CLOTHES =
  /\bwhy should(?: i)? tell you|none of your|not telling|won'?t tell|mind your own\b/i;

const INVENTED_SWORD =
  /\b(?:iron\s+)?(?:short)?sword|longsword|broadsword|the sword\b/i;

const DUNGEON_CLEARED =
  /\b(?:micro-?)?dungeon has been cleared|no active threats remain|dungeon (?:is|was) (?:cleared|finished|done)\b/i;

function clockAllowsSkip(state: GameState): boolean {
  const day = Number(state.worldLedger?.clock?.day ?? 0);
  const week = Number(state.worldLedger?.clock?.week ?? 0);
  return week >= 1 || day >= 0.4 || (state.turn ?? 0) >= 8;
}

function playerAskedKit(action: string): boolean {
  return PLAYER_ASKED_KIT.test(action);
}

function crowdIsLoud(state: GameState, narrative: string): boolean {
  if (state.sceneFacts?.noise === 'shouting') return true;
  if (state.sceneFacts?.crowd === 'present' && SHOUTING.test(narrative)) return true;
  return SHOUTING.test(narrative);
}

export function detectFactLockViolations(
  state: GameState,
  narrative: string,
  playerAction: string
): FactLockViolation[] {
  const prose = narrative.replace(/<system>[\s\S]*?<\/system>/gi, ' ');
  const found: FactLockViolation[] = [];
  if (!clockAllowsSkip(state) && CLOCK_SKIP.test(prose)) {
    found.push({ kind: 'clock', reason: 'Clock is still the opening morning — do not write hours or days passing.' });
  }
  if (crowdIsLoud(state, prose) && SILENCE_ONLY.test(prose)) {
    found.push({
      kind: 'silence',
      reason: 'People are still shouting. Do not write eerie silence in the same beat.',
    });
  }
  if (
    state.sceneFacts?.crowd === 'present' &&
    EMPTY_STREET.test(prose) &&
    !CROWD_STILL_HERE.test(prose)
  ) {
    found.push({
      kind: 'silence',
      reason: 'A crowd is still here. Do not empty or desert the street without time passing.',
    });
  }
  if (!playerAskedKit(playerAction) && KIT_RECAP.test(prose)) {
    found.push({
      kind: 'kit',
      reason: 'Do not pat pockets or name allotment items (Health Vial, Mana Crystal) unless the player checked kit.',
    });
  }
  if (STUB_MARKERS.test(prose) && prose.replace(/\s+/g, ' ').trim().length < 280) {
    found.push({ kind: 'stub', reason: 'Do not replace the turn with a continuity stub. Answer the player.' });
  }
  if (REFUSAL_CLOTHES.test(prose) && /clothing|streetwear|wearing/i.test(prose)) {
    found.push({ kind: 'kit', reason: 'A refusal is not a clothing name.' });
  }
  const hasSwordItem = (state.inventory ?? []).some((i) => /\bsword\b/i.test(i.name));
  if (!hasSwordItem && INVENTED_SWORD.test(prose)) {
    found.push({
      kind: 'weapon',
      reason: 'Equipped kit has no sword. Narrate the real weapon name only.',
    });
  }
  const remain = remainingDungeonMobs(state);
  if (remain.alive > 0 && DUNGEON_CLEARED.test(prose)) {
    found.push({
      kind: 'cleared',
      reason: `Dungeon is not cleared — ${remain.alive} threats still on the locked map.`,
    });
  }
  return found;
}

function splitSentences(prose: string): string[] {
  const chunks = prose.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return (chunks ?? [prose]).map((s) => s.trim()).filter(Boolean);
}

function lockSentence(state: GameState, sentence: string, playerAction: string, full: string): string | null {
  if (!clockAllowsSkip(state) && CLOCK_SKIP.test(sentence)) return null;
  if (!playerAskedKit(playerAction) && KIT_RECAP.test(sentence)) return null;
  if (STUB_MARKERS.test(sentence)) return null;
  if (REFUSAL_CLOTHES.test(sentence) && /clothing|streetwear|wearing/i.test(sentence)) return null;
  const hasSwordItem = (state.inventory ?? []).some((i) => /\bsword\b/i.test(i.name));
  if (!hasSwordItem && INVENTED_SWORD.test(sentence)) return null;
  if (remainingDungeonMobs(state).alive > 0 && DUNGEON_CLEARED.test(sentence)) return null;

  let next = sentence;
  if (crowdIsLoud(state, full) && SILENCE_ONLY.test(next)) {
    next = next
      .replace(/\b(?:an?\s+)?eerie(?:ly)?\s+silence\b/gi, 'dead electronics')
      .replace(/\breplaced by an? (?:eerie )?silence\b/gi, 'gone — people are still shouting')
      .replace(/\beerly silent\b/gi, 'without working electronics')
      .replace(/\bunnervingly quiet\b/gi, 'without the usual traffic noise');
    if (SILENCE_ONLY.test(next) && !SHOUTING.test(next)) return null;
  }
  if (
    state.sceneFacts?.crowd === 'present' &&
    EMPTY_STREET.test(next) &&
    !CROWD_STILL_HERE.test(next)
  ) {
    return null;
  }
  return next.trim() || null;
}

function sanitizeSystemBlock(block: string): string {
  return block.replace(
    /(clothing\s*:\s*)([^\n<]+)/gi,
    (all, label: string, value: string) => {
      if (REFUSAL_CLOTHES.test(value)) {
        return `${label}everyday street clothes (streetwear)`;
      }
      return all;
    }
  );
}

/** Cut or rewrite the broken sentence. Never replace the whole turn with a stub. */
export function applyFactLocks(
  state: GameState,
  narrative: string,
  playerAction: string
): string {
  const parts = narrative.split(/(<system>[\s\S]*?<\/system>)/gi);
  const next = parts
    .map((part) => {
      if (/^<system>/i.test(part)) return sanitizeSystemBlock(part);
      const kept = splitSentences(part)
        .map((s) => lockSentence(state, s, playerAction, narrative))
        .filter((s): s is string => !!s);
      return kept.join(' ').replace(/\s+/g, ' ').trim();
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return next;
}

export function buildFactLockRetryBlock(violations: FactLockViolation[]): string {
  if (!violations.length) return '';
  const lines = violations.map((v) => `- ${v.reason}`).join('\n');
  return `=== FACT LOCK RETRY (BINDING) ===
Your prior reply broke engine facts. Rewrite the SAME player action. Keep any good sensory detail.
Fix ALL of these:
${lines}
Do not write hours/days passing on turn one. Do not write silence against a shouting crowd.
Do not inventory-check allotment items unless they asked. Do not use "the last beat holds".
===========================================================`;
}
