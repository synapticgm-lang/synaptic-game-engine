import type { GameState, LoreCard, Settings } from './types';
import { extractChoiceLines, stripChoiceList } from './parser';
import {
  fallbackSuggestionForState,
  isSuggestionValidForState,
} from './suggestionValidation';
import { logger } from './logger';

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

export function isChoiceGroundedInTurn(
  choice: string,
  storyProse: string,
  state: GameState,
  loreCards: LoreCard[] = []
): boolean {
  const cleaned = stripChoiceDecorators(choice);
  if (!cleaned) return false;
  if (!isSuggestionValidForState(cleaned, state, storyProse)) return false;

  const envHits = environmentalEventViolations(cleaned, storyProse);
  if (envHits.length > 0) return false;
  if (threatChoiceWithoutSetup(cleaned, storyProse, state)) return false;
  if (observeThreatWithoutSetup(cleaned, storyProse, state)) return false;

  for (const re of PLOT_JUMP_PATTERNS) {
    if (re.test(cleaned)) {
      // Allow only if the destination/event words also appear in story or lore.
      const tokens = cleaned.toLowerCase().match(/[a-z]{4,}/g) ?? [];
      const lore = loreCorpus(loreCards);
      const hay = `${storyProse} ${lore} ${state.currentLocation ?? ''}`.toLowerCase();
      const grounded = tokens.some((t) => hay.includes(t) && !/^(travel|journey|leave|start|begin|abandon|quest|campaign|adventure|sail|fly|portal|teleport)$/.test(t));
      if (!grounded) return false;
    }
  }

  return true;
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
    const cleaned = stripChoiceDecorators(choice);
    const reasons: string[] = [];
    if (!isSuggestionValidForState(cleaned, state, storyProse)) {
      reasons.push('violates state/inventory/companion/scene guardrails');
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

function buildTierContext(state: GameState, loreCards: LoreCard[], storyProse: string): string {
  const t1 = [
    `Location: ${state.currentLocation || 'unspecified'}`,
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
7. Choices must be actionable and scene-local (observe, talk, move carefully, use carried gear, react to the last beat).
8. Output ONLY a numbered list like:
1. ...
2. ...
3. ...
No narrative, no preamble, no tags.`;

async function callChoiceModel(
  settings: Settings,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let provider = settings.aiProvider ?? 'gemini';
  let apiKey = provider === 'openrouter' ? settings.openrouterApiKey : settings.geminiApiKey;
  if ((provider === 'gemini' || !apiKey) && settings.openrouterApiKey) {
    provider = 'openrouter';
    apiKey = settings.openrouterApiKey;
  }
  let model = settings.customModelId || undefined;
  if (provider === 'openrouter' && !model) model = 'deepseek/deepseek-chat';
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

  const raw = await callChoiceModel(settings, CHOICE_TIER_SYSTEM, userPrompt);
  return extractChoiceLines(raw);
}

/** Scene-local fallbacks used by the pipeline and ActionBar when GM choices fail. */
export function sceneSafeFallbacks(state: GameState, storyProse = ''): string[] {
  const options = [
    fallbackSuggestionForState(state),
    'Examine the immediate surroundings',
    'Wait and listen carefully',
  ];
  if ((state.companions ?? []).length > 0) options.push('Check in with your companion');
  if (state.activeEncounter) options.push('Focus on the active threat');
  if (/\b(door|gate|path|corridor|alley)\b/i.test(storyProse)) {
    options.push('Approach cautiously');
  }
  const interactables = state.locationSheet?.interactables ?? [];
  for (const item of interactables.slice(0, 2)) {
    if (item.name?.trim()) options.push(`Inspect the ${item.name.trim()}`);
  }
  return Array.from(new Set(options)).slice(0, 4);
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
}): Promise<ChoicePipelineResult> {
  const { gmText, state, loreCards, settings } = params;
  const storyProse = normalizeStoryCorpus(gmText);
  const rawChoices = extractChoiceLines(gmText);

  const firstPass = filterChoicesToTurnFacts(rawChoices, storyProse, state, loreCards);
  if (firstPass.rejected.length === 0 && firstPass.kept.length >= 3) {
    return { choices: firstPass.kept.slice(0, 4), regenerated: false, rejectedCount: 0 };
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
    const merged = Array.from(new Set([...secondPass.kept, ...firstPass.kept])).slice(0, 4);
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

  const fallbacks = sceneSafeFallbacks(state, storyProse);
  const merged = Array.from(new Set([...firstPass.kept, ...fallbacks])).slice(0, 4);
  return {
    choices: merged,
    regenerated: true,
    rejectedCount: firstPass.rejected.length,
  };
}

export { CHOICE_TIER_PROMPT_RULES } from './choiceTierRules';
