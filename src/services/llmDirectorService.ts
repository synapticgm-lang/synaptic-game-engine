import { debugLogger } from '../game/debugLogger';
import { KID_MODE_RULES } from '../game/contentModeRules';
import {
  CAMERA_ANGLE_EXAMPLES,
  normalizeTextAnchor,
  type ComicPanelScript,
  type ComicScriptResponse,
} from '../types/comicScript';

/**
 * Phase 2 — LLM Scripting Engine (Graphic Novel Director).
 *
 * This is a standalone module: it does not touch the existing math engine (`game/*` roll
 * resolution) or the existing image generator pipeline (`services/openRouterService.ts`
 * `generateComicImage`/`fetchComicPanel`). It only produces the structured JSON *script* that
 * a future wiring step would feed into those pipelines (`art_prompt` -> image generator,
 * `dialogue`/`caption`/`sfx` -> the existing React overlay components).
 */

const OPENROUTER_API_KEY = ''; // Provider keys from Settings / edge secrets only — never VITE_*.
const BASE_URL = 'https://openrouter.ai/api/v1';
const DIRECTOR_MODEL_FALLBACK = 'deepseek/deepseek-chat';
const DEFAULT_DIRECTOR_TIMEOUT_MS = 20_000;

/** Thrown when the Director's HTTP call itself fails (network error, non-2xx, no API key). */
export class DirectorRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DirectorRequestError';
  }
}

/** Thrown when a 200 OK response can't be turned into a valid `ComicScriptResponse` — missing
 *  content, malformed JSON, or a `panels` array that doesn't survive normalization. Kept
 *  distinct from `DirectorRequestError` so callers can decide whether a retry (transient JSON
 *  hiccup) or a hard failure (auth/network) is the right response. */
export class DirectorParseError extends Error {
  rawContent: string;
  constructor(message: string, rawContent: string) {
    super(message);
    this.name = 'DirectorParseError';
    this.rawContent = rawContent;
  }
}

const DIRECTOR_BASE_SYSTEM_PROMPT = `You are a Graphic Novel Director for an illustrated tactical RPG.

Your job: read the player's submitted action and the deterministic Math Engine's outcome for that action, then pace the result across 2 to 4 comic book panels — the exact beats needed to tell this turn as a short comic sequence. Never fabricate mechanical outcomes (damage, hit/miss, loot, HP) that differ from the Math Engine outcome provided to you; you are staging and framing that outcome, not recalculating it.

CAMERA ANGLES: Choose a deliberate, varied cinematography framing per panel. Common values: ${CAMERA_ANGLE_EXAMPLES.join(', ')}. Vary the framing across panels — do not repeat the same angle for every panel in a turn unless it's a clear intentional match-cut.

COMPOSITION RULE: For each panel, describe the visual framing in "art_prompt" so there is clear negative/empty space for text — for example, offset characters to one side and leave open sky, wall, shadow, or uncluttered environment on the other. Keep faces and the main focal action away from that quiet area. Output "text_anchor" indicating which region ("top-left", "top-right", "bottom-left", "bottom-right", or "bottom-center") you intentionally left open for captions and speech bubbles. The frontend binds speech bubbles to that exact region with absolute positioning.

VISUAL CONSISTENCY: You will be given a list of info cards describing the player, active NPCs, equipped gear, and location aesthetics. Every "art_prompt" you write MUST reference the specific relevant details from those info cards (exact physical descriptions, exact gear, exact location features) so the generated artwork stays consistent turn over turn. Do not invent conflicting physical details.

ABSOLUTE RULE — ART PROMPTS ARE WORDLESS: "art_prompt" must be a strictly visual description only (subjects, action, setting, lighting, composition). NEVER ask the image generator to draw, render, or include text, words, letters, numbers, speech bubbles, thought bubbles, or caption boxes of any kind. All text belongs exclusively in the "dialogue", "caption", and "sfx" JSON fields below — the game engine renders those as separate HTML/React overlays on top of the artwork.

OUTPUT FORMAT — respond with ONLY a single JSON object (no markdown fences, no commentary) matching exactly:
{
  "panels": [
    {
      "panel_id": 1,
      "camera_angle": "WIDE SHOT",
      "art_prompt": "Strictly visual description of this beat. No text, no speech bubbles.",
      "text_anchor": "top-right",
      "caption": "Optional narrative voiceover or a Math Engine roll outcome rendered as prose, or null.",
      "dialogue": [ { "character": "Speaker Name", "text": "What they say." } ],
      "sfx": "*OPTIONAL SOUND EFFECT*"
    }
  ]
}
- "panels" must contain between 2 and 4 entries, ordered panel_id 1..N with no gaps.
- "dialogue" is an array; use an empty array [] if no one speaks in that panel.
- "caption" and "sfx" must be JSON null (not the string "null") when unused.
- "text_anchor" must match the negative-space quadrant intentionally composed in "art_prompt".
- The FIRST panel MUST visually depict the player's submitted action being executed.
- Do not include any keys other than the ones shown above.`;

function buildDirectorSystemPrompt(mode: 'kid' | 'adult' | 'unrestricted'): string {
  if (mode === 'kid') {
    // Reuses the app's existing Kid Mode copy verbatim (from `game/systemPrompt.ts`) rather
    // than maintaining a second, possibly-drifting copy of the safety rule text.
    return `${DIRECTOR_BASE_SYSTEM_PROMPT}\n\n${KID_MODE_RULES}\n\nApply the above content mode to BOTH the "art_prompt" visuals and the "dialogue"/"caption" text. This is a PEGI-3 equivalent safety floor: no graphic violence, no blood/gore, no mature themes, no frightening/disturbing imagery, in any field.`;
  }
  return DIRECTOR_BASE_SYSTEM_PROMPT;
}

function buildDirectorUserPrompt(playerAction: string, mathOutcome: unknown, infoCards: string[]): string {
  const mathOutcomeJson = (() => {
    try {
      return JSON.stringify(mathOutcome, null, 2);
    } catch {
      return String(mathOutcome);
    }
  })();

  const infoCardsBlock = infoCards.length > 0
    ? infoCards.map((c) => `- ${c}`).join('\n')
    : '(none provided)';

  return `PLAYER ACTION:
${playerAction}

MATH ENGINE OUTCOME (ground truth — do not contradict):
${mathOutcomeJson}

VISUAL CONSISTENCY INFO CARDS (reference these in art_prompt where relevant):
${infoCardsBlock}

Produce the JSON comic script for this turn now.`;
}

/** Strips ```json ... ``` / ``` ... ``` fences some models wrap JSON in despite instructions. */
function stripCodeFences(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

/** Normalizes one raw panel object into a strict `ComicPanelScript`, filling safe defaults for
 *  missing optional fields and throwing only when the panel has no usable visual description. */
function normalizePanel(raw: unknown, index: number): ComicPanelScript {
  const p = (raw ?? {}) as Record<string, unknown>;

  const artPrompt = typeof p.art_prompt === 'string' ? p.art_prompt.trim() : '';
  if (!artPrompt) {
    throw new DirectorParseError(`Panel at index ${index} is missing a non-empty "art_prompt".`, JSON.stringify(raw));
  }

  const dialogueRaw = Array.isArray(p.dialogue) ? p.dialogue : [];
  const dialogue = dialogueRaw
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object')
    .map((d) => ({
      character: typeof d.character === 'string' ? d.character : 'Unknown',
      text: typeof d.text === 'string' ? d.text : '',
    }))
    .filter((d) => d.text.trim().length > 0);
  const textAnchor = typeof p.text_anchor === 'string'
    ? normalizeTextAnchor(p.text_anchor)
    : undefined;

  return {
    panel_id: typeof p.panel_id === 'number' && Number.isFinite(p.panel_id) ? p.panel_id : index + 1,
    camera_angle: typeof p.camera_angle === 'string' && p.camera_angle.trim() ? p.camera_angle.trim() : 'WIDE SHOT',
    art_prompt: artPrompt,
    caption: typeof p.caption === 'string' && p.caption.trim() ? p.caption.trim() : null,
    dialogue,
    sfx: typeof p.sfx === 'string' && p.sfx.trim() ? p.sfx.trim() : null,
    text_anchor: textAnchor,
  };
}

/** Maximum panels honored per turn — mirrors the code-level enforcement pattern already used
 *  for the legacy XML `<panel>` pipeline (see `game/panelBudget.ts`), so a Director response
 *  that ignores the "2 to 4" instruction can never blow the per-turn image generation budget. */
const MAX_DIRECTOR_PANELS = 4;
const MIN_DIRECTOR_PANELS = 2;

/**
 * Parses and validates the raw model content into a `ComicScriptResponse`. Accepts either the
 * requested `{ "panels": [...] }` shape or a bare top-level array as a defensive fallback for
 * models that ignore the wrapper-object instruction.
 */
function parseComicScriptContent(content: string): ComicScriptResponse {
  const cleaned = stripCodeFences(content);

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new DirectorParseError(`Director response was not valid JSON: ${message}`, content);
  }

  const panelsRaw = Array.isArray(json)
    ? json
    : Array.isArray((json as Record<string, unknown>)?.panels)
      ? (json as { panels: unknown[] }).panels
      : null;

  if (!panelsRaw) {
    throw new DirectorParseError('Director response JSON did not contain a "panels" array.', content);
  }
  if (panelsRaw.length === 0) {
    throw new DirectorParseError('Director response contained zero panels.', content);
  }

  // Code-enforced ceiling, same defensive pattern as the legacy panel budget slicing —
  // never trust the model to police its own panel count.
  const panels = panelsRaw.slice(0, MAX_DIRECTOR_PANELS).map(normalizePanel);

  if (panels.length < MIN_DIRECTOR_PANELS) {
    debugLogger.record('WARN', `Director returned only ${panels.length} panel(s), below the requested minimum of ${MIN_DIRECTOR_PANELS}`, { panelCount: panels.length });
  }

  return { panels };
}

export interface GeneratePanelScriptOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Calls the OpenRouter Chat Completions API with Structured Outputs (`response_format:
 * { type: "json_object" }`) to produce a 2-4 panel comic script for the current turn.
 *
 * @param playerAction The player's submitted action text for this turn.
 * @param mathOutcome  The deterministic Math Engine's resolved outcome for that action
 *                      (roll results, damage, loot, etc). Passed through as ground truth —
 *                      never recomputed or second-guessed by the Director.
 * @param infoCards    Short visual-consistency strings (character/NPC/gear/location
 *                      descriptions) the Director should weave into each `art_prompt`.
 * @param mode         Existing content-mode toggle (`Settings.contentMode`, see
 *                      `game/types.ts` / `SettingsModal.tsx`). When `'kid'`, the existing
 *                      `KID_MODE_RULES` copy is injected so the script enforces PEGI-3 safety
 *                      before any image is requested.
 */
export async function generatePanelScript(
  playerAction: string,
  mathOutcome: unknown,
  infoCards: string[],
  mode: 'kid' | 'adult' | 'unrestricted',
  options?: GeneratePanelScriptOptions
): Promise<ComicScriptResponse> {
  const apiKey = options?.apiKey || OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new DirectorRequestError('No OpenRouter API key configured for the LLM Director.');
  }

  const model = options?.model || DIRECTOR_MODEL_FALLBACK;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_DIRECTOR_TIMEOUT_MS;

  const systemPrompt = buildDirectorSystemPrompt(mode);
  const userPrompt = buildDirectorUserPrompt(playerAction, mathOutcome, infoCards);

  const payload = {
    model,
    response_format: { type: 'json_object' as const },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
  };

  debugLogger.record('API_REQUEST', 'LLM Director panel script request', {
    url: `${BASE_URL}/chat/completions`,
    model,
    mode,
    infoCardCount: infoCards.length,
  });

  const controller = new AbortController();
  const externalSignal = options?.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = performance.now();
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        // Fetch header values must remain ASCII/ISO-8859-1 compatible. The previous em dash
        // in this title caused Request construction to throw before the Director call began.
        'X-Title': 'SynapticGM Graphic Novel Director',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - startTime);
    const timedOut = controller.signal.aborted && !externalSignal?.aborted;
    const message = err instanceof Error ? err.message : String(err);
    debugLogger.record('ERROR', `LLM Director request failed after ${latency}ms`, { error: message, timedOut, latency });
    throw new DirectorRequestError(timedOut ? `LLM Director request timed out after ${timeoutMs}ms` : `LLM Director network error: ${message}`);
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }

  const latency = Math.round(performance.now() - startTime);

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    debugLogger.record('ERROR', `LLM Director API returned ${response.status} in ${latency}ms`, {
      status: response.status,
      statusText: response.statusText,
      body: errBody.slice(0, 500),
    });
    throw new DirectorRequestError(`LLM Director API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    debugLogger.record('ERROR', 'LLM Director response had no content', { latency, data });
    throw new DirectorParseError('LLM Director response contained no message content.', '');
  }

  const script = parseComicScriptContent(content);

  debugLogger.record('API_RESPONSE', `LLM Director succeeded in ${latency}ms`, {
    latency,
    model,
    panelCount: script.panels.length,
  });

  return script;
}
