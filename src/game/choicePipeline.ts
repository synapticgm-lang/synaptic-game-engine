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
];

const PLOT_JUMP_PATTERNS: RegExp[] = [
  /\b(?:travel|journey|sail|fly|teleport|portal)\s+to\s+(?:the\s+)?[A-Z][\w'\-]+/i,
  /\b(?:leave|abandon)\s+(?:the\s+)?(?:town|city|kingdom|realm|world)\b/i,
  /\b(?:start|begin)\s+(?:a\s+)?(?:new\s+)?(?:quest|campaign|adventure)\b/i,
];

function normalizeStoryCorpus(gmText: string): string {
  // Strip choice lists and XML-ish tags so grounding checks use prose facts only.
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

export function isChoiceGroundedInTurn(
  choice: string,
  storyProse: string,
  state: GameState,
  loreCards: LoreCard[] = []
): boolean {
  if (!choice?.trim()) return false;
  if (!isSuggestionValidForState(choice, state)) return false;

  const envHits = environmentalEventViolations(choice, storyProse);
  if (envHits.length > 0) return false;

  for (const re of PLOT_JUMP_PATTERNS) {
    if (re.test(choice)) {
      // Allow only if the destination/event words also appear in story or lore.
      const tokens = choice.toLowerCase().match(/[a-z]{4,}/g) ?? [];
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
    const reasons: string[] = [];
    if (!isSuggestionValidForState(choice, state)) {
      reasons.push('violates state/inventory/companion guardrails');
    }
    const env = environmentalEventViolations(choice, storyProse);
    if (env.length) reasons.push(`unprompted environmental event: ${env.join(', ')}`);
    if (!isChoiceGroundedInTurn(choice, storyProse, state, loreCards) && reasons.length === 0) {
      reasons.push('not grounded in turn story / lore cards');
    }
    if (reasons.length) rejected.push({ choice, reasons });
    else kept.push(choice);
  }

  return { kept, rejected };
}

function buildTierContext(state: GameState, loreCards: LoreCard[], storyProse: string): string {
  const t1 = [
    `Location: ${state.currentLocation || 'unspecified'}`,
    `Gold: ${state.gold ?? 0}`,
    `Companions: ${(state.companions ?? []).map((c) => c.name).join(', ') || 'none'}`,
    `Encounter: ${state.activeEncounter?.name ?? 'none'}`,
    `Inventory: ${state.inventory.map((i) => i.name).join(', ') || 'empty'}`,
  ].join('\n');

  const t2 =
    loreCards.length > 0
      ? loreCards.map((c) => `[${c.type}] ${c.name}: ${c.summary}`).join('\n')
      : '(no active info cards)';

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

=== TIER 4: MACRO-SCENE CONTEXT ===
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
3. Do not invent NPCs, locations, items, or plot jumps absent from Tier 1–3. Info cards (Tier 2) may inform tone/identity but cannot invent a new crisis.
4. Choices must be actionable and scene-local (observe, talk, move carefully, use carried gear, react to the last beat).
5. Output ONLY a numbered list like:
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

function sceneSafeFallbacks(state: GameState, storyProse: string): string[] {
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

/** Prompt block injected into the GM system instructions for defense-in-depth. */
export const CHOICE_TIER_PROMPT_RULES = `CRITICAL RULE: 4-TIER CHOICE PIPELINE (HIGHEST PRIORITY)
Choices are Tier-3 outputs and MUST be generated ONLY after the turn's story prose is written.
* Inspect the story text you just wrote. Every numbered option must react to facts present in that prose.
* NEVER offer choices about environmental events (tremors, alarms, explosions, floods, blackouts, cave-ins, war horns, etc.) unless those events were explicitly narrated in this turn's prose.
* NEVER invent unprompted plot jumps, distant travel, or NPCs/locations absent from the active scene state and active info/lore cards.
* Info/lore cards constrain identity and world facts — they do NOT authorize inventing a new crisis mid-choice-list.
* Prefer 3–4 immediate, scene-local actions.`;
