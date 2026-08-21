import type { GameState, LoreCard, Settings } from './types';
import { extractChoiceLines, stripChoiceList, looksLikeChoiceOffer } from './parser';
import { playerFacingLocation } from './locationName';
import {
  fallbackSuggestionForState,
  isLockedProgressionChoice,
  isSuggestionValidForState,
} from './suggestionValidation';
import { logger } from './logger';
import { getTierDefinition } from './subscriptionTiers';
import { applyStanceDensity, classifyStance, isCombatLockedTurn } from './stanceDensity';
import { isAloneArrivalOpening } from './openingEstablishment';
import { isInteriorMap } from './placeAuthority';
import { listInteriorExitsFromHere } from './mapEngine';

/**
 * 4-tier narrative pipeline (authoritative ordering for choice generation):
 *   T1 Ground-truth state  — inventory, gold, companions, location, encounter
 *   T2 Info / lore cards   — active matched lore cards only
 *   T3 Turn story prose    — the GM narrative just produced (must ground every option)
 *   T4 Macro scene         — recent log window / active phase
 *
 * The choice tier (post-narrative) may ONLY propose actions supported by T1–T3.
 */

/** Environmental / crisis events that must appear in the story prose before a choice may reference them. */
const ENVIRONMENTAL_EVENT_RULES: { label: string; choiceRe: RegExp; narrativeKeys: RegExp }[] = [
  {
    label: 'tremor/quake',
    choiceRe: /\b(tremor|tremors|quake|earthquake|aftershock|shudder(?:ing)?\s+ground|ground\s+shak)/i,
    narrativeKeys: /\b(tremor|tremors|quake|earthquake|aftershock|shudder|shaking|rumble|ground\s+(?:shook|shakes|trembles))\b/i,
  },
  {
    label: 'alarm/siren',
    choiceRe: /\b(alarm|alarms|siren|sirens|klaxon|red\s*alert|security\s+alert)\b/i,
    narrativeKeys: /\b(alarm|alarms|siren|sirens|klaxon|red\s*alert|security\s+alert|warning\s+bell)\b/i,
  },
  {
    label: 'explosion/blast',
    choiceRe: /\b(explosion|explode|blast|detonation|bomb\s+goes?\s+off)\b/i,
    narrativeKeys: /\b(explosion|explode[ds]?|blast|detonation|boom)\b/i,
  },
  {
    label: 'collapse/cave-in',
    choiceRe: /\b(cave[- ]?in|collapse|collapsing|ceiling\s+cracks?|roof\s+falls?)\b/i,
    narrativeKeys: /\b(cave[- ]?in|collaps(?:e|ed|ing)|ceiling\s+crack|roof\s+fall|rubble)\b/i,
  },
  {
    label: 'flood',
    choiceRe: /\b(flood|flooding|water\s+rising|rising\s+water)\b/i,
    narrativeKeys: /\b(flood|flooding|water\s+(?:ris(?:e|es|ing)|pours?|rushes?))\b/i,
  },
  {
    label: 'fire outbreak',
    choiceRe: /\b(flee\s+the\s+fire|escape\s+the\s+fire|put\s+out\s+the\s+fire|burning\s+building)\b/i,
    narrativeKeys: /\b(fire|flames?|burning|inferno|blaze)\b/i,
  },
  {
    label: 'blackout',
    choiceRe: /\b(blackout|lights?\s+go\s+out|power\s+fail|in\s+the\s+dark)\b/i,
    narrativeKeys: /\b(blackout|lights?\s+(?:go|went|flicker)|power\s+fail|darkness\s+falls|plunge(?:d)?\s+into\s+dark)\b/i,
  },
  {
    label: 'raid/ambush signal',
    choiceRe: /\b(war\s*horn|raid\s+horn|ambush\s+signal|battle\s+horn)\b/i,
    narrativeKeys: /\b(war\s*horn|raid\s+horn|ambush|battle\s+horn|horns?\s+sound)\b/i,
  },
  {
    label: 'creature/threat reaction',
    choiceRe: /\b(hide\s+from|sneak\s+(?:past|away\s+from|around)|flee\s+(?:the|from)|retreat\s+from|ambush\s+the|stalk\s+the|creature|beast|monster|mutated|feline|goblin|predator)\b/i,
    narrativeKeys: /\b(creature|enemy|beast|monster|figure|silhouette|threat|hostile|mutated|feline|goblin|predator|adversary|foe|attacker|stalk|lurk|growl|snarl)\b/i,
  },
  {
    label: 'distant commotion',
    choiceRe: /\b(distant (?:shouting|screams?|gunfire)|three\s+blocks?|\d+\s+blocks?\s+(?:east|west|north|south)|down the (?:street|road) )\b/i,
    narrativeKeys: /\b(shout|scream|blocks?|commotion|distant|gunfire)\b/i,
  },
];

const PLOT_JUMP_PATTERNS: RegExp[] = [
  /\b(?:travel|journey|sail|fly|teleport|portal)\s+to\s+(?:the\s+)?[A-Z][\w'\-]+/i,
  /\b(?:leave|abandon)\s+(?:the\s+)?(?:town|city|kingdom|realm|world)\b/i,
  /\b(?:start|begin)\s+(?:a\s+)?(?:new\s+)?(?:quest|campaign|adventure)\b/i,
];

/** Strip choice lists / tags so grounding checks use prose facts only. */
export function normalizeStoryCorpus(gmText: string): string {
  let prose = stripChoiceList(gmText);
  prose = prose
    .replace(/<system-log>[\s\S]*?<\/system-log>/gi, ' ')
    .replace(/<panel>[\s\S]*?<\/panel>/gi, (block) => {
      const narratives = [...block.matchAll(/<narrative>([\s\S]*?)<\/narrative>/gi)].map((m) => m[1]);
      return narratives.join(' ');
    })
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return prose;
}

/** Strip habit/Fate decorative prefixes before grounding checks. */
export function stripChoiceDecorators(choice: string): string {
  return choice.replace(/^[\s✨🎲⭐️•\-–—]+/u, '').trim();
}

/** Strip stray "What do you do?" glued onto button labels. */
export function sanitizeChoiceLabel(choice: string): string {
  return stripChoiceDecorators(choice)
    .replace(/\s*[—–-]\s*what do you do\??\s*$/i, '')
    .replace(/\s+what do you do\??\s*$/i, '')
    .replace(/^\s*what do you do\??\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Alone arrival or empty-ruin prose — no crowd / voices / speaker inventions. */
export function isAloneOrEmptyScene(state: GameState, storyProse = ''): boolean {
  if (isAloneArrivalOpening(state)) return true;
  if (state.openingEstablishment?.aloneArrival === true) return true;
  const hay = `${storyProse}\n${state.currentLocation ?? ''}`.toLowerCase();
  if (/\b(nobody|no one|alone|empty|only (?:your|my) (?:own )?footprints|nothing moves)\b/i.test(hay)) {
    if (!/\b(crowd|people (?:are|were|shout)|he says|she says|they say|voices?\s+outside)\b/i.test(hay)) {
      return true;
    }
  }
  return false;
}

const ALONE_FORBIDDEN_CHOICE =
  /\b(crowd|bystander|onlookers?|handlers?|voices?\s+(?:outside|beyond)|call out to (?:the )?(?:voices?|crowd|people)|inspect (?:the )?(?:speaker|emblem)|someone (?:nearby|listening|watching)|ask (?:the )?(?:crowd|people|locals)|people who saw|saw you arrive|you(?:'re| are) not alone)\b/i;

/** Choices that invent social presence on an empty/alone beat. */
export function inventsPresenceOnEmptyScene(
  choice: string,
  state: GameState,
  storyProse = ''
): boolean {
  if (!isAloneOrEmptyScene(state, storyProse)) return false;
  const cleaned = sanitizeChoiceLabel(choice);
  if (!ALONE_FORBIDDEN_CHOICE.test(cleaned)) return false;
  // Allow if the turn prose actually established that presence.
  if (ALONE_FORBIDDEN_CHOICE.test(storyProse)) return false;
  return true;
}

function loreCorpus(cards: LoreCard[]): string {
  return cards
    .map((c) => `${c.name} ${c.summary} ${(c.keywords ?? []).join(' ')}`)
    .join(' ')
    .toLowerCase();
}

export function environmentalEventViolations(choice: string, storyProse: string): string[] {
  const violations: string[] = [];
  for (const rule of ENVIRONMENTAL_EVENT_RULES) {
    if (rule.choiceRe.test(choice) && !rule.narrativeKeys.test(storyProse)) {
      violations.push(rule.label);
    }
  }
  return violations;
}

const THREAT_IN_PROSE =
  /\b(creature|enemy|beast|monster|figure|silhouette|threat|hostile|mutated|feline|goblin|predator|adversary|foe|attacker|stalk|lurk|growl|snarl|bandit|raider|assassin|wolf|undead|skeleton|zombie|orc|troll|demon|dragon|spider|serpent|guard\s+dog)\b/i;

/** Combat / threat-reaction choices need turn prose OR an active encounter. */
export function threatChoiceWithoutSetup(
  choice: string,
  storyProse: string,
  state: GameState
): boolean {
  const cleaned = stripChoiceDecorators(choice);
  const isThreatReact =
    /\b(hide|sneak|ambush|creature|beast|monster|feline|goblin|retreat\s+from|flee\s+(?:the|from)|edge\s+toward.+cover|keep(?:ing)?\s+eyes?\s+on\s+the\s+(?:silhouette|figure|creature)|attack|fight|engage(?:\s+the)?|take\s+cover|draw\s+(?:your\s+)?weapon|charge(?:\s+the)?|strike\s+the|kill\s+the|nearest\s+enemy)\b/i.test(
      cleaned
    );
  if (!isThreatReact) return false;
  if (state.activeEncounter) return false;
  return !THREAT_IN_PROSE.test(storyProse);
}

function enemyIsDead(storyProse: string, state: GameState): boolean {
  if (state.activeEncounter && state.activeEncounter.hp <= 0) return true;
  if (!state.activeEncounter && /\b(collapsed|dead|corpse|lifeless|final hiss|ichor)\b/i.test(storyProse)) {
    return true;
  }
  return false;
}

export function fightChoiceAfterEnemyDead(
  choice: string,
  storyProse: string,
  state: GameState
): boolean {
  if (!enemyIsDead(storyProse, state)) return false;
  return /\b(lunge|strike|attack|fight|engage|maintain distance|active threat|draw (?:your )?weapon)\b/i.test(
    choice
  );
}

export function lootChoiceAfterHarvest(choice: string, state: GameState): boolean {
  if (!/\b(loot|inspect (?:the )?(?:body|corpse|hatchling)|usable materials|harvest)\b/i.test(choice)) {
    return false;
  }
  return (state.inventory ?? []).some((i) => /fang|ichor|carapace|trophy/i.test(i.name));
}

export function exploreStubInCombat(choice: string, state: GameState): boolean {
  if (!state.activeEncounter || state.activeEncounter.hp <= 0) return false;
  return /^(wait and listen|read the system panel|focus on the active threat|examine the immediate)\b/i.test(
    choice.trim()
  );
}

/** Observe/scan-the-enemy style options also need a present threat. */
export function observeThreatWithoutSetup(
  choice: string,
  storyProse: string,
  state: GameState
): boolean {
  const cleaned = stripChoiceDecorators(choice);
  const observesThreat =
    /\b(assess|observe|scan|watch|study|inspect)\b.{0,40}\b(enemy|enemies|threat|creature|beast|monster|foe|hostile|silhouette|figure)\b/i.test(
      cleaned
    ) || /\b(enemy|threat|creature)\b.{0,24}\b(assess|observe|scan|watch)\b/i.test(cleaned);
  if (!observesThreat) return false;
  if (state.activeEncounter) return false;
  return !THREAT_IN_PROSE.test(storyProse);
}

/**
 * Facts established BEFORE this GM reply — used so choices cannot invent NPCs/places
 * that only appear in the same turn's hallucinated prose.
 */
export function priorEstablishedProse(state: GameState, loreCards: LoreCard[] = []): string {
  const parts: string[] = [];
  if (state.currentLocation) parts.push(state.currentLocation);
  if (state.locationSheet?.name) parts.push(state.locationSheet.name);
  for (const it of state.locationSheet?.interactables ?? []) {
    if (it.name) parts.push(it.name);
  }
  for (const exit of state.locationSheet?.exits ?? []) {
    if (exit.label) parts.push(exit.label);
  }
  for (const f of (state.timeline ?? []).slice(-16)) parts.push(f.text);
  for (const c of loreCards) {
    if (c.revealed === true || (c.lastSeenTurn ?? 0) > 0) {
      parts.push(`${c.name} ${c.summary ?? ''}`);
    }
  }
  for (const entry of state.log.slice(-6)) {
    if (entry.role === 'gm' || entry.role === 'player') {
      parts.push(stripChoiceList(entry.content).slice(0, 600));
    }
  }
  return parts.join('\n');
}

export function isChoiceGroundedInTurn(
  choice: string,
  storyProse: string,
  state: GameState,
  loreCards: LoreCard[] = []
): boolean {
  const cleaned = sanitizeChoiceLabel(choice);
  if (!cleaned) return false;
  // Named people/places/objects: prior ledger only (not this turn's invented prose).
  // Threat/environment checks below still use current turn prose.
  const established = priorEstablishedProse(state, loreCards);
  // Objects in THIS turn's prose may ground a choice; objects only in prior log/player
  // wording are not enough to invent a tire iron or a van the story never showed.
  if (!isSuggestionValidForState(cleaned, state, `${established}\n${storyProse}`)) return false;
  if (choiceNamesUnnarratedObject(cleaned, storyProse, state)) return false;
  if (inventsPresenceOnEmptyScene(cleaned, state, storyProse)) return false;

  const envHits = environmentalEventViolations(cleaned, storyProse);
  if (envHits.length > 0) return false;
  if (threatChoiceWithoutSetup(cleaned, storyProse, state)) return false;
  if (observeThreatWithoutSetup(cleaned, storyProse, state)) return false;
  if (fightChoiceAfterEnemyDead(cleaned, storyProse, state)) return false;
  if (lootChoiceAfterHarvest(cleaned, state)) return false;
  if (exploreStubInCombat(cleaned, state)) return false;
  // "X dungeon" choices need an active dungeon OR the current turn's story to say so —
  // not just a quest-card spoiler the player hasn't heard yet.
  if (/\bdungeon\b/i.test(cleaned) && !state.activeDungeon && !/\bdungeon\b/i.test(storyProse)) {
    return false;
  }

  for (const re of PLOT_JUMP_PATTERNS) {
    if (re.test(cleaned)) {
      // Allow only if the destination/event words also appear in established facts or lore.
      const tokens = cleaned.toLowerCase().match(/[a-z]{4,}/g) ?? [];
      const lore = loreCorpus(loreCards);
      const hay = `${established} ${lore} ${state.currentLocation ?? ''}`.toLowerCase();
      const grounded = tokens.some((t) => hay.includes(t) && !/^(travel|journey|leave|start|begin|abandon|quest|campaign|adventure|sail|fly|portal|teleport)$/.test(t));
      if (!grounded) return false;
    }
  }

  return true;
}

const GENERIC_LOOKAROUND =
  /^(examine|inspect|observe|look around|wait|listen|ask|rest|hide|approach cautiously|check (?:your |my )?(?:gear|inventory|wounds)|inspect the immediate surroundings|observe the environment carefully)\b/i;

/** Concrete props in a choice must appear in this turn's story, inventory, or the location sheet. */
export function choiceNamesUnnarratedObject(
  choice: string,
  storyProse: string,
  state: GameState
): boolean {
  if (GENERIC_LOOKAROUND.test(choice.trim()) && choice.length < 56) return false;
  const hay = [
    storyProse,
    ...(state.inventory ?? []).map((i) => i.name),
    ...(state.containers ?? []).map((c) => c.name),
    state.locationSheet?.name ?? '',
    ...(state.locationSheet?.interactables ?? []).map((i) => i.name),
    ...(state.locationSheet?.exits ?? []).map((e) => e.label),
    state.activeEncounter?.name ?? '',
  ].join(' ').toLowerCase();

  const objects = [
    ...choice.matchAll(
      /\b(?:the|a|an)\s+([a-z][\w'-]*(?:\s+[a-z][\w'-]*){0,2})\b/gi
    ),
  ].map((m) => (m[1] ?? '').toLowerCase());

  const skip = /^(immediate|nearest|nearby|other|another|few|some|your|my|old|new|next|last|same)$/;
  for (const obj of objects) {
    const core = obj.replace(/^(nearest|nearby|other|another|immediate|overturned|parked|open|ajar|distant)\s+/, '');
    if (!core || skip.test(core)) continue;
    if (/^(surroundings|environment|area|street|room|scene|ground|air|cover|gear|inventory|wounds?)$/.test(core)) {
      continue;
    }
    if (hay.includes(core) || core.split(/\s+/).some((w) => w.length >= 4 && hay.includes(w))) {
      continue;
    }
    if (
      /^(car|van|truck|bus|vehicle|wreck)$/.test(core)
      && /\b(car|van|truck|bus|vehicle|wreck)\b/.test(hay)
    ) {
      continue;
    }
    return true;
  }
  return false;
}

export function isLookAroundChoice(choice: string): boolean {
  return /\b(examin|inspect|observe|look around|scout)\b/i.test(choice)
    && /\b(surroundings|environment|area|street)\b/i.test(choice);
}

export function filterChoicesToTurnFacts(
  choices: string[],
  storyProse: string,
  state: GameState,
  loreCards: LoreCard[] = []
): { kept: string[]; rejected: { choice: string; reasons: string[] }[] } {
  const kept: string[] = [];
  const rejected: { choice: string; reasons: string[] }[] = [];

  for (const choice of choices) {
    const cleaned = sanitizeChoiceLabel(choice);
    if (!cleaned) {
      rejected.push({ choice, reasons: ['empty after label sanitize'] });
      continue;
    }
    const reasons: string[] = [];
    const established = priorEstablishedProse(state, loreCards);
    if (!isSuggestionValidForState(cleaned, state, `${established}\n${storyProse}`)) {
      reasons.push('violates state/inventory/companion/scene guardrails');
    }
    if (choiceNamesUnnarratedObject(cleaned, storyProse, state)) {
      reasons.push('names an object not in this turn\'s story');
    }
    if (inventsPresenceOnEmptyScene(cleaned, state, storyProse)) {
      reasons.push('invents crowd/voices/speaker on alone or empty scene');
    }
    if (isLockedProgressionChoice(cleaned, state)) {
      reasons.push('locked or level-gated feature');
    }
    const env = environmentalEventViolations(cleaned, storyProse);
    if (env.length) reasons.push(`unprompted environmental event: ${env.join(', ')}`);
    if (threatChoiceWithoutSetup(cleaned, storyProse, state)) {
      reasons.push('combat/threat reaction without creature/encounter in turn prose');
    }
    if (observeThreatWithoutSetup(cleaned, storyProse, state)) {
      reasons.push('observe-threat option without creature/encounter in turn prose');
    }
    if (!isChoiceGroundedInTurn(cleaned, storyProse, state, loreCards) && reasons.length === 0) {
      reasons.push('not grounded in turn story / lore cards');
    }
    if (reasons.length) rejected.push({ choice, reasons });
    else kept.push(cleaned);
  }

  return { kept, rejected };
}

/** In-prose numbered / inquire offers become chips even if grounding is fussy about role nouns. */
function restoreHarvestedOffers(rawChoices: string[], kept: string[]): string[] {
  const merged = [...kept];
  for (const choice of rawChoices) {
    const cleaned = sanitizeChoiceLabel(choice);
    if (!looksLikeChoiceOffer(cleaned)) continue;
    if (classifyStance(cleaned) === 'lookaround') continue;
    if (!merged.some((c) => c.toLowerCase() === cleaned.toLowerCase())) {
      merged.unshift(cleaned);
    }
  }
  return merged;
}

function buildTierContext(state: GameState, loreCards: LoreCard[], storyProse: string): string {
  const t1 = [
    `Location: ${playerFacingLocation(state)}`,
    `Gold: ${state.gold ?? 0}`,
    `Companions: ${(state.companions ?? []).map((c) => c.name).join(', ') || 'none'}`,
    `Encounter: ${state.activeEncounter?.name ?? 'none'}`,
    `Dungeon: ${state.activeDungeon?.dungeonName ?? 'none'}`,
    `Inventory: ${state.inventory.map((i) => i.name).join(', ') || 'empty'}`,
  ].join('\n');

  const t2 =
    loreCards.length > 0
      ? loreCards.map((c) => `[${c.type}] ${c.name}: ${c.summary}`).join('\n')
      : '(no active info cards)';

  const t4facts = (state.timeline ?? [])
    .slice(-8)
    .map((f) => `T${f.turn}: ${f.text}`)
    .join('\n') || '(none)';

  const t4 = state.log
    .slice(-2)
    .map((l) => `${l.role.toUpperCase()}: ${l.content.slice(0, 400)}`)
    .join('\n') || '(none)';

  return `=== TIER 1: GROUND-TRUTH STATE ===
${t1}

=== TIER 2: ACTIVE INFO / LORE CARDS ===
${t2}

=== TIER 3: CURRENT TURN STORY PROSE (AUTHORITATIVE FOR CHOICES) ===
${storyProse || '(empty)'}

=== TIER 4: FACTUAL TIMELINE + MACRO ===
${t4facts}

Recent beats:
${t4}`;
}

const CHOICE_TIER_SYSTEM = `You are the CHOICE GENERATION TIER (Tier 3) of a 4-tier RPG pipeline.

You receive:
- Tier 1 ground-truth state
- Tier 2 active info/lore cards
- Tier 3 the CURRENT TURN's story prose (already written — do not rewrite it)
- Tier 4 brief macro context

Your ONLY job: output 3 or 4 numbered player choices.

STRICT RULES:
1. Inspect Tier 3 story prose first. Every choice MUST be an immediate reaction to facts explicitly present there.
2. If an environmental event (tremor, alarm, explosion, flood, blackout, cave-in, war horn, etc.) is NOT in the Tier 3 prose, you MUST NOT mention it in any choice.
3. If no creature/enemy/threat is established in Tier 3 prose AND Encounter is "none", do NOT offer hide/sneak/ambush/attack/fight/engage/assess-enemy choices.
4. Do not invent NPCs, locations, items, creatures, or plot jumps absent from Tier 1–3. Info cards (Tier 2) may inform tone/identity but cannot invent a new crisis.
5. NEVER name a weapon (shortsword, dagger, bow, etc.) unless that exact item appears in Tier 1 Inventory.
6. NEVER name a unique object/interactable (altar, chest, terminal, etc.) unless it appears in Tier 3 prose, Location interactables, or Tier 1 state.
7. NEVER offer locked or level-gated System features. If something is greyed out, it is not a choice.
8. NEVER name cities, hubs, outposts, or survivor camps the player has not visited.
9. Choices must be actionable and scene-local (observe, talk, move carefully, use carried gear, react to the last beat).
10. STANCE DENSITY: On non-lethal beats, do NOT emit three look-around / wait / inspect-surroundings options. Prefer a mix of kind/help, hard/refuse, talk/ask, and walk-away when combat is not locking them in. Combat-locked turns stay fight moves.
11. CONVERSATION: If the player is talking with a named person (elder, court, priest), choices MUST continue that conversation (ask/answer/refuse/walk away). Never emit "Inspect the immediate surroundings" as the only real option.
12. Output ONLY a numbered list like:
1. ...
2. ...
3. ...
No narrative, no preamble, no tags. Always output 3 or 4 choices.`;

export async function callSmallModel(
  settings: Settings,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let provider: string = 'openrouter';
  let apiKey = settings.openrouterApiKey || settings.geminiApiKey;
  if ((settings.aiProvider === 'gemini' || !apiKey) && settings.openrouterApiKey) {
    provider = 'openrouter';
    apiKey = settings.openrouterApiKey;
  }
  let model =
    settings.customModelId?.trim() ||
    // Choices always use Free-tier cheap/fast model — never burn Mid/High writer on buttons
    getTierDefinition('free').writerOpenRouterId;
  if (settings.aiProvider === 'gemini' && !settings.openrouterApiKey) {
    provider = 'gemini';
    model = settings.customModelId?.trim() || getTierDefinition('free').writerGeminiId;
  }
  if (!apiKey) throw new Error('No API key configured for choice regeneration.');

  if (provider === 'gemini') {
    const modelName = model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
    });
    if (!res.ok) throw new Error(`Choice tier Gemini error ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  const base =
    provider === 'openrouter'
      ? settings.baseUrl?.trim() || 'https://openrouter.ai/api/v1'
      : provider === 'groq'
        ? 'https://api.groq.com/openai/v1'
        : provider === 'ollama'
          ? 'http://localhost:11434/v1'
          : settings.baseUrl?.trim() || 'https://api.openai.com/v1';
  const modelName =
    model ||
    (provider === 'openrouter'
      ? 'deepseek/deepseek-chat'
      : provider === 'groq'
        ? 'llama-3.3-70b-versatile'
        : 'gpt-4o-mini');

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.4,
      max_tokens: 512,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Choice tier API error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function regenerateChoices(
  state: GameState,
  loreCards: LoreCard[],
  storyProse: string,
  settings: Settings,
  rejectedSummary: string
): Promise<string[]> {
  const userPrompt = `${buildTierContext(state, loreCards, storyProse)}

REJECTED PRIOR OPTIONS (do not repeat these premises):
${rejectedSummary || '(none)'}

Generate 3-4 grounded choices now.`;

  const raw = await callSmallModel(settings, CHOICE_TIER_SYSTEM, userPrompt);
  return extractChoiceLines(raw);
}

/** Scene-local fallbacks used by the pipeline and ActionBar when GM choices fail. */
export function sceneSafeFallbacks(
  state: GameState,
  storyProse = '',
  lastPlayerAction = ''
): string[] {
  const justLooked = isLookAroundChoice(lastPlayerAction)
    || /\b(look around|surroundings|scout|circuit)\b/i.test(lastPlayerAction);
  const alone = isAloneOrEmptyScene(state, storyProse);
  const options: string[] = [];
  if (!justLooked) options.push(fallbackSuggestionForState(state));
  if (/\b(car|van|vehicle|truck|wreck)\b/i.test(storyProse)) {
    options.push('Search the vehicle more carefully');
  }
  if (!alone && /\b(people|crowd|someone|scream|shout)\b/i.test(storyProse)) {
    options.push('Call out to a bystander');
  }
  if (/\b(panel|system)\b/i.test(storyProse)) {
    options.push('Read the System panel more closely');
  }
  if (/\b(crystal|crack)\b/i.test(storyProse) && !alone) {
    options.push('Inspect the crystals breaking the street');
  }
  if (/\b(alley)\b/i.test(storyProse) && !alone) options.push('Check the nearest alley');
  if (alone) {
    options.push('Search the ruin carefully');
    options.push('Find a way out');
    const dungeon = state.activeDungeon;
    if (dungeon && isInteriorMap(dungeon)) {
      const exits = listInteriorExitsFromHere(dungeon);
      const door = exits.find((e) => e.kind === 'door' || e.kind === 'stairs');
      if (door) {
        options.push(`Approach the ${door.noun} to ${door.name}`);
      } else if (exits[0]) {
        options.push(`Approach the ${exits[0].noun} cautiously`);
      }
    }
    if (/\b(gap|door|arch|doorway|rubble|debris|stone|corridor)\b/i.test(storyProse)) {
      const preferGap =
        /\b(gap|crack|broken wall)\b/i.test(storyProse) && !/\b(door|doorway|corridor)\b/i.test(storyProse);
      options.push(preferGap ? 'Approach the gap cautiously' : 'Approach the doorway cautiously');
    }
  }
  options.push('Wait and listen carefully');
  if ((state.companions ?? []).length > 0) options.push('Check in with your companion');
  if (state.activeEncounter && state.activeEncounter.hp > 0) {
    options.push('Strike with what you are holding');
    options.push('Guard and watch for the next opening');
  } else if (/\b(corpse|dead|collapsed)\b/i.test(storyProse)) {
    options.push('Check your wounds');
    options.push('Look for the next room or exit');
  } else if (!isCombatLockedTurn(state)) {
    if (
      !alone
      && (/\b(he says|she says|they say|asks you|merchant|guard|innkeep|someone|crowd|people)\b/i.test(storyProse)
        || (state.companions ?? []).length > 0
        || (state.npcMemories ?? []).some((m) => (state.turn - (m.lastSeenTurn ?? 0)) <= 4))
    ) {
      options.push('Ask what is going on');
      options.push('Refuse and keep your own counsel');
    }
    if ((state.locationSheet?.exits ?? []).length > 0 || !state.activeDungeon) {
      options.push(alone ? 'Find a way out' : 'Walk away / go another direction');
    }
  }
  if (/\b(door|gate|path|corridor|alley|gap|arch)\b/i.test(storyProse)) {
    options.push('Approach cautiously');
  }
  const interactables = state.locationSheet?.interactables ?? [];
  for (const item of interactables.slice(0, 2)) {
    if (item.name?.trim()) options.push(`Inspect the ${item.name.trim()}`);
  }
  if (!justLooked && options.length < 3) {
    options.push('Examine the immediate surroundings');
  }
  return Array.from(new Set(options.map(sanitizeChoiceLabel).filter(Boolean))).slice(0, 4);
}

export function padChoicesToCount(
  choices: string[],
  state: GameState,
  storyProse = '',
  min = 3,
  lastPlayerAction = ''
): string[] {
  let merged = Array.from(
    new Set(
      choices
        .map((c) => sanitizeChoiceLabel(c))
        .filter(Boolean)
        .filter((c) => isChoiceGroundedInTurn(c, storyProse, state) || looksLikeChoiceOffer(c))
    )
  );
  if (isLookAroundChoice(lastPlayerAction)) {
    merged = merged.filter((c) => !isLookAroundChoice(c));
  }
  if (merged.length >= min) {
    return applyStanceDensity(merged.slice(0, 4), state, storyProse, lastPlayerAction);
  }
  for (const extra of sceneSafeFallbacks(state, storyProse, lastPlayerAction)) {
    if (merged.length >= min) break;
    if (!isChoiceGroundedInTurn(extra, storyProse, state)) continue;
    if (!merged.some((c) => c.toLowerCase() === extra.toLowerCase())) merged.push(extra);
  }
  // Last resort: still pad with grounded-or-generic alone-safe lines (never invent crowd).
  if (merged.length < min) {
    for (const extra of sceneSafeFallbacks(state, storyProse, lastPlayerAction)) {
      if (merged.length >= min) break;
      if (inventsPresenceOnEmptyScene(extra, state, storyProse)) continue;
      if (!merged.some((c) => c.toLowerCase() === extra.toLowerCase())) merged.push(extra);
    }
  }
  return applyStanceDensity(merged.slice(0, 4), state, storyProse, lastPlayerAction);
}

export interface ChoicePipelineResult {
  choices: string[];
  regenerated: boolean;
  rejectedCount: number;
}

/**
 * Choice tier entrypoint: validate GM-produced options against the turn's story prose
 * + info cards; regenerate once if environmental/plot-jump violations are present.
 */
export async function resolvePipelineChoices(params: {
  gmText: string;
  state: GameState;
  loreCards: LoreCard[];
  settings: Settings;
  lastPlayerAction?: string;
}): Promise<ChoicePipelineResult> {
  const { gmText, state, loreCards, settings } = params;
  const lastPlayerAction = params.lastPlayerAction ?? '';
  const storyProse = normalizeStoryCorpus(gmText);
  const rawChoices = extractChoiceLines(gmText);

  const firstPass = filterChoicesToTurnFacts(rawChoices, storyProse, state, loreCards);
  const firstKept = restoreHarvestedOffers(rawChoices, firstPass.kept);
  // Two grounded options are enough — pad locally instead of another model call.
  if (firstKept.length >= 2 || rawChoices.some((c) => looksLikeChoiceOffer(c))) {
    return {
      choices: padChoicesToCount(firstKept, state, storyProse, 3, lastPlayerAction),
      regenerated: false,
      rejectedCount: firstPass.rejected.length,
    };
  }

  // Any environmental/plot violation OR too few survivors → regenerate from Tier 3 prose.
  const rejectedSummary = firstPass.rejected
    .map((r) => `- ${r.choice} (${r.reasons.join('; ')})`)
    .join('\n');

  logger.info('choice-pipeline', 'Regenerating choices after grounding failures', {
    kept: firstPass.kept.length,
    rejected: firstPass.rejected.length,
    rejectedSummary,
  });

  try {
    const regenerated = await regenerateChoices(state, loreCards, storyProse, settings, rejectedSummary);
    const secondPass = filterChoicesToTurnFacts(regenerated, storyProse, state, loreCards);
    const merged = padChoicesToCount(
      restoreHarvestedOffers(
        rawChoices,
        Array.from(new Set([...secondPass.kept, ...firstPass.kept]))
      ),
      state,
      storyProse,
      3,
      lastPlayerAction
    );
    if (merged.length >= 2) {
      return {
        choices: merged,
        regenerated: true,
        rejectedCount: firstPass.rejected.length + secondPass.rejected.length,
      };
    }
  } catch (err) {
    logger.warn('choice-pipeline', 'Choice regeneration failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const fallbacks = sceneSafeFallbacks(state, storyProse, lastPlayerAction);
  const merged = padChoicesToCount(
    restoreHarvestedOffers(rawChoices, Array.from(new Set([...firstPass.kept, ...fallbacks]))),
    state,
    storyProse,
    3,
    lastPlayerAction
  );
  return {
    choices: merged,
    regenerated: true,
    rejectedCount: firstPass.rejected.length,
  };
}

export { CHOICE_TIER_PROMPT_RULES } from './choiceTierRules';
