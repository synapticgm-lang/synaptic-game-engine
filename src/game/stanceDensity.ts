import type { GameState } from './types';

/**
 * Opportunity density: non-lethal beats should offer stance, not three look-arounds.
 * No numeric karma meter — named NPCs remember via npcMemory / pins.
 */

function stripDecorators(choice: string): string {
  return choice.replace(/^[\s✨🎲⭐️•\-–—]+/u, '').trim();
}

function isLookAround(choice: string): boolean {
  const c = stripDecorators(choice);
  if (/^(wait and listen|examine the immediate|observe the environment)/i.test(c)) return true;
  return /\b(look around|inspect (?:the )?(?:immediate )?surroundings|observe the environment|examine the (?:immediate )?(?:area|surroundings))\b/i.test(c);
}

export type StanceBucket = 'kind' | 'hard' | 'curious' | 'walkaway' | 'lookaround' | 'combat' | 'other';

const KIND_RE =
  /\b(help|heal|spare|honest|kind|comfort|protect|thank|apologiz|give|share|offer(?:\s+\w+)?\s+help|speak honestly|tell the truth)\b/i;
const HARD_RE =
  /\b(threaten|refuse|demand|lie|steal|intimidate|shove|insult|turn\s+\w+\s+down|keep (?:your|my) (?:own )?counsel|bluff|bargain hard|walk out on)\b/i;
const CURIOUS_RE =
  /\b(ask|talk|speak(?:\s+with|\s+to)?|bargain|negotiat|listen|chat|hang out|what's going on|what is going on|question)\b/i;
const WALK_RE =
  /\b(walk away|go another|another (?:way|direction)|leave(?:\s+(?:the|this))?|ignore|back (?:away|out)|try another (?:door|path|street)|go back)\b/i;
const COMBAT_RE =
  /\b(strike|attack|fight|lunge|guard|dodge|parry|cast|shoot|charge|draw (?:your )?weapon|take cover)\b/i;

export function classifyStance(choice: string): StanceBucket {
  const cleaned = stripDecorators(choice);
  if (!cleaned) return 'other';
  if (COMBAT_RE.test(cleaned) && !CURIOUS_RE.test(cleaned) && !KIND_RE.test(cleaned)) return 'combat';
  if (isLookAround(cleaned) || /^(wait and listen|examine the immediate|observe the environment)/i.test(cleaned)) {
    return 'lookaround';
  }
  if (WALK_RE.test(cleaned) && !KIND_RE.test(cleaned)) return 'walkaway';
  if (HARD_RE.test(cleaned) && !KIND_RE.test(cleaned)) return 'hard';
  if (KIND_RE.test(cleaned)) return 'kind';
  if (CURIOUS_RE.test(cleaned)) return 'curious';
  return 'other';
}

export function isCombatLockedTurn(state: GameState): boolean {
  return Boolean(state.activeEncounter && state.activeEncounter.hp > 0);
}

/** Opening cover chips (name / look / kit) are not stance beats. */
export function isOpeningCoverTurn(state: GameState): boolean {
  const est = state.openingEstablishment;
  if (!est || est.complete) return false;
  if (est.sceneWritten) return false;
  return (est.pending?.length ?? 0) > 0;
}

function namedPeople(state: GameState): string[] {
  const names: string[] = [];
  for (const c of state.companions ?? []) {
    if (c.name?.trim()) names.push(c.name.trim());
  }
  for (const m of state.npcMemories ?? []) {
    if (m.npcName?.trim() && (state.turn - (m.lastSeenTurn ?? 0)) <= 10) {
      names.push(m.npcName.trim());
    }
  }
  for (const card of state.lorebook ?? []) {
    if (card.type === 'npc' && card.name?.trim() && (card.revealed || (card.lastSeenTurn ?? 0) > 0)) {
      names.push(card.name.trim());
    }
  }
  return Array.from(new Set(names));
}

function someonePresent(state: GameState, storyProse: string): boolean {
  if (namedPeople(state).length > 0) return true;
  if ((state.sceneFacts?.crowd ?? 'unknown') === 'present') return true;
  return /\b(he says|she says|they say|asks you|watches you|merchant|guard|innkeep|barkeep|clerk|someone|crowd|people|elder|priest)\b/i.test(
    storyProse
  );
}

function lastPlayerLine(state: GameState, override = ''): string {
  if (override.trim()) return override;
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]?.role === 'player') return log[i].content ?? '';
  }
  return '';
}

/** Talking with a named person — look-around must not be the only real chip. */
export function isConversationBeat(
  state: GameState,
  storyProse: string,
  lastPlayerAction = ''
): boolean {
  if (isCombatLockedTurn(state) || isOpeningCoverTurn(state)) return false;
  const last = lastPlayerLine(state, lastPlayerAction);
  const playerTalk =
    /\?/.test(last)
    || /\b(ask|tell|speak|talk|explain|what|why|how|who|where|inquire)\b/i.test(last);
  const sceneTalk =
    someonePresent(state, storyProse)
    || /\b(elder|priest|herald|courtier|acolyte|sage|says?|said|asks?|asked|replies|replied)\b/i.test(
      storyProse
    );
  return sceneTalk && (playerTalk || /\b(says?|said|asks?|asked|replies|elder)\b/i.test(storyProse));
}

function canWalkAway(state: GameState, storyProse: string): boolean {
  if (isCombatLockedTurn(state)) return false;
  if ((state.locationSheet?.exits ?? []).length > 0) return true;
  if (/\b(door|gate|path|street|road|corridor|alley|stairs|exit)\b/i.test(storyProse)) return true;
  // Outdoors / social scenes: leaving is usually legal.
  return !state.activeDungeon;
}

function stanceFallbacks(state: GameState): Record<Exclude<StanceBucket, 'lookaround' | 'combat' | 'other'>, string> {
  const person = namedPeople(state)[0];
  const exit = state.locationSheet?.exits?.[0]?.label;
  return {
    kind: person ? `Offer ${person} honest help` : 'Offer help, honestly',
    hard: person ? `Refuse ${person} and keep your own counsel` : 'Refuse and keep your own counsel',
    curious: person ? `Talk with ${person}` : 'Ask what is going on',
    walkaway: exit ? `Leave toward ${exit}` : 'Walk away / go another direction',
  };
}

/**
 * Light warden: cap look-around collage; on sandbox modes, ensure stance variety.
 * PYOA: only drop duplicate look-arounds — do not inject open-sandbox walk-aways.
 */
export function applyStanceDensity(
  choices: string[],
  state: GameState,
  storyProse = '',
  lastPlayerAction = ''
): string[] {
  const cleaned = Array.from(new Set(choices.map((c) => c.trim()).filter(Boolean)));
  if (isOpeningCoverTurn(state)) return cleaned.slice(0, 4);
  if (isCombatLockedTurn(state)) return cleaned.slice(0, 4);

  const conversation = isConversationBeat(state, storyProse, lastPlayerAction);
  let lookCount = 0;
  let kept: string[] = [];
  for (const choice of cleaned) {
    const bucket = classifyStance(choice);
    if (bucket === 'lookaround') {
      lookCount += 1;
      if (lookCount > 1) continue;
      if (conversation) continue;
    }
    kept.push(choice);
  }

  if (state.engineMode === 'pyoa') {
    return kept.slice(0, 4);
  }

  const present = someonePresent(state, storyProse) || conversation;
  const walkOk = canWalkAway(state, storyProse);
  const buckets = new Set(kept.map(classifyStance));
  const fallbacks = stanceFallbacks(state);
  const needed: Array<'kind' | 'hard' | 'curious' | 'walkaway'> = [];
  if (conversation) {
    if (!buckets.has('curious')) needed.push('curious');
    if (walkOk && !buckets.has('walkaway')) needed.push('walkaway');
    if (present && !buckets.has('hard')) needed.push('hard');
  } else {
    if (present && !buckets.has('kind')) needed.push('kind');
    if (present && !buckets.has('hard')) needed.push('hard');
    if (present && !buckets.has('curious')) needed.push('curious');
    if (walkOk && !buckets.has('walkaway')) needed.push('walkaway');
  }

  // Typical non-lethal beat: at least two stance colours, not a look-around stack.
  const stanceCount = ['kind', 'hard', 'curious', 'walkaway'].filter((b) => buckets.has(b as StanceBucket)).length;
  if (!conversation && stanceCount >= 2 && needed.length === 0) return kept.slice(0, 4);

  for (const key of needed) {
    if (kept.length >= 4) break;
    const extra = fallbacks[key];
    if (!kept.some((c) => c.toLowerCase() === extra.toLowerCase())) {
      kept.push(extra);
      buckets.add(key);
    }
  }

  if (conversation) {
    const nonLook = kept.filter((c) => classifyStance(c) !== 'lookaround');
    if (nonLook.length >= 1) kept = nonLook;
  }

  return kept.slice(0, 4);
}
