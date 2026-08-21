import type { GameState } from './types';
import { isAloneArrivalOpening } from './openingEstablishment';
import { isInteriorMap } from './placeAuthority';
import { listInteriorExitsFromHere } from './mapEngine';

/**
 * Opportunity density: non-lethal beats should offer stance, not three look-arounds.
 * Simulationist sandbox also pads Direct / Diplomatic / Solitary exploration paths.
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

/** Simulationist exploration paths (non-combat). */
export type PathBucket = 'direct' | 'diplomatic' | 'solitary' | 'other';

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

const DIRECT_RE =
  /\b(force|smash|bash|pry|push|climb|clear|charge through|break|shove open|dig|jump|rush|physical|open the|approach (?:the )?(?:door|gap|rubble)|enter)\b/i;
const DIPLOMATIC_RE =
  /\b(ask|talk|speak|bargain|trade|negotiat|faction|offer|deal|persuade|convince|hail|greet|call out|diplom|check in with)\b/i;
const SOLITARY_RE =
  /\b(sneak|stealth|hide|scout alone|slip|quiet|solo|watch from|circle around|avoid|bypass|search (?:the )?(?:ruin|carefully)|find a way|listen carefully|wait and listen)\b/i;

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

export function classifyPath(choice: string): PathBucket {
  const cleaned = stripDecorators(choice);
  if (!cleaned) return 'other';
  if (SOLITARY_RE.test(cleaned) && !DIPLOMATIC_RE.test(cleaned)) return 'solitary';
  if (DIPLOMATIC_RE.test(cleaned)) return 'diplomatic';
  if (DIRECT_RE.test(cleaned)) return 'direct';
  if (isLookAround(cleaned)) return 'solitary';
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

function isAloneScene(state: GameState, storyProse = ''): boolean {
  if (isAloneArrivalOpening(state)) return true;
  if (state.openingEstablishment?.aloneArrival === true) return true;
  if ((state.sceneFacts?.crowd ?? 'unknown') === 'none') return true;
  const hay = `${storyProse}\n${state.currentLocation ?? ''}`.toLowerCase();
  if (/\b(nobody|no one|alone|empty|only (?:your|my) (?:own )?footprints|nothing moves)\b/i.test(hay)) {
    if (!/\b(crowd|people (?:are|were|shout)|he says|she says|they say|voices?\s+outside)\b/i.test(hay)) {
      return true;
    }
  }
  return false;
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

function doorwayDirectFallback(state: GameState): string {
  const dungeon = state.activeDungeon;
  if (dungeon && isInteriorMap(dungeon)) {
    const exits = listInteriorExitsFromHere(dungeon);
    const door = exits.find((e) => e.kind === 'door' || e.kind === 'stairs');
    if (door) return `Approach the ${door.noun} to ${door.name}`;
    if (exits[0]) return `Approach the ${exits[0].noun} cautiously`;
  }
  const exit = state.locationSheet?.exits?.[0]?.label;
  if (exit) return `Force a path toward ${exit}`;
  return 'Clear a physical path forward';
}

function firstCarriedTool(state: GameState): string | null {
  const item = (state.inventory ?? []).find((i) => i.name?.trim() && !i.equipped);
  const equipped = (state.inventory ?? []).find((i) => i.name?.trim() && i.equipped);
  const name = (equipped ?? item)?.name?.trim();
  return name || null;
}

/** Mode-aware path pad labels (Direct/Diplomatic/Solitary lenses remapped per engine). */
function pathFallbacks(
  state: GameState,
  alone: boolean
): Record<'direct' | 'diplomatic' | 'solitary', string> {
  const companion = (state.companions ?? []).find((c) => c.name?.trim())?.name?.trim();
  const person = namedPeople(state)[0];
  const tool = firstCarriedTool(state);
  const mode = state.engineMode;

  if (mode === 'dnd') {
    return {
      direct: alone ? 'Search the immediate area carefully' : 'Investigate the nearest clue',
      diplomatic: companion
        ? `Coordinate with ${companion}`
        : alone
          ? 'Take a better position / cover'
          : person
            ? `Ask ${person} what they noticed`
            : 'Reposition for a better angle',
      solitary: companion
        ? `Have ${companion} watch your back while you check ahead`
        : 'Hold position and listen',
    };
  }

  if (mode === 'rpg') {
    return {
      direct: alone
        ? 'Use what you know of this place as leverage'
        : person
          ? `Press ${person} with what you already know`
          : 'Use the situation as leverage',
      diplomatic: alone
        ? 'Study the space for any sign of who was here'
        : person
          ? `Talk with ${person}`
          : 'Ask what is going on',
      solitary: alone
        ? 'Choose the kinder / harder path for yourself alone'
        : 'Act on faction or moral pressure',
    };
  }

  if (mode === 'pyoa') {
    return {
      direct: doorwayDirectFallback(state),
      diplomatic: tool
        ? `Use your ${tool}`
        : 'Check what you are carrying for anything useful',
      solitary: 'Wait and listen carefully before committing',
    };
  }

  // litrpg (default): Direct / Diplomatic / Solitary
  return {
    direct: doorwayDirectFallback(state),
    diplomatic: alone
      ? 'Study the space for any sign of who was here'
      : companion
        ? `Check in with ${companion}`
        : person
          ? `Talk with ${person}`
          : 'Ask what is going on',
    solitary: alone
      ? 'Search the ruin carefully'
      : companion
        ? 'Scout ahead alone while they hold position'
        : 'Wait and listen carefully',
  };
}

/**
 * Pad mode-aware exploration paths (litrpg Direct/Diplomatic/Solitary;
 * dnd investigate/position/party; rpg leverage/diplomatic/moral; pyoa physical/tool/cautious).
 * Alone scenes: diplomatic must not invent NPCs.
 */
export function applyPathDensity(
  choices: string[],
  state: GameState,
  storyProse = ''
): string[] {
  if (isOpeningCoverTurn(state) || isCombatLockedTurn(state)) return choices.slice(0, 4);

  let kept = [...choices];
  const alone = isAloneScene(state, storyProse);
  const hasCompanions = (state.companions ?? []).some((c) => c.name?.trim());
  const buckets = new Set(kept.map(classifyPath));
  const fallbacks = pathFallbacks(state, alone);

  const needed: Array<'direct' | 'diplomatic' | 'solitary'> = [];
  if (!buckets.has('direct')) needed.push('direct');
  if (!buckets.has('diplomatic')) needed.push('diplomatic');
  if (!buckets.has('solitary')) needed.push('solitary');

  for (const key of needed) {
    if (kept.length >= 4) break;
    const extra = fallbacks[key];
    if (!kept.some((c) => c.toLowerCase() === extra.toLowerCase())) {
      kept.push(extra);
      buckets.add(key);
    }
  }

  if (hasCompanions && kept.length < 4 && state.engineMode !== 'pyoa') {
    const synergy = pathFallbacks(state, false).diplomatic;
    if (!kept.some((c) => c.toLowerCase() === synergy.toLowerCase())) {
      kept.push(synergy);
    }
  }

  return kept.slice(0, 4);
}

/**
 * Light warden: cap look-around collage; on sandbox modes, ensure stance variety.
 * Then pad mode-aware exploration paths.
 * PYOA: still pads Physical / Tool / Cautious — does not inject open-sandbox walk-aways.
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
    // Authored forks only for stance; still allow Physical/Tool/Cautious path pads.
    return applyPathDensity(kept.slice(0, 4), state, storyProse);
  }

  const present = someonePresent(state, storyProse) || conversation;
  const alone = isAloneScene(state, storyProse);
  const walkOk = canWalkAway(state, storyProse);
  const buckets = new Set(kept.map(classifyStance));
  const fallbacks = stanceFallbacks(state);
  const needed: Array<'kind' | 'hard' | 'curious' | 'walkaway'> = [];
  if (conversation) {
    if (!buckets.has('curious')) needed.push('curious');
    if (walkOk && !buckets.has('walkaway')) needed.push('walkaway');
    if (present && !alone && !buckets.has('hard')) needed.push('hard');
  } else if (present && !alone) {
    if (!buckets.has('kind')) needed.push('kind');
    if (!buckets.has('hard')) needed.push('hard');
    if (!buckets.has('curious')) needed.push('curious');
    if (walkOk && !buckets.has('walkaway')) needed.push('walkaway');
  } else if (walkOk && !buckets.has('walkaway')) {
    needed.push('walkaway');
  }

  // Typical non-lethal beat: at least two stance colours, not a look-around stack.
  const stanceCount = ['kind', 'hard', 'curious', 'walkaway'].filter((b) => buckets.has(b as StanceBucket)).length;
  if (!conversation && stanceCount >= 2 && needed.length === 0) {
    return applyPathDensity(kept.slice(0, 4), state, storyProse);
  }

  for (const key of needed) {
    if (kept.length >= 4) break;
    // Alone invent gate: do not pad social kind/curious/hard that invents people.
    if (alone && (key === 'kind' || key === 'curious' || key === 'hard')) continue;
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

  return applyPathDensity(kept.slice(0, 4), state, storyProse);
}
