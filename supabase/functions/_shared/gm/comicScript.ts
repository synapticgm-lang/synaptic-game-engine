/**
 * Phase 2 — LLM Scripting Engine (Graphic Novel Director).
 *
 * These types describe the structured JSON "shooting script" the Director model produces
 * for a single player turn: 2-4 discrete comic panel beats. This is deliberately a separate,
 * stricter contract from the legacy `<panel><image-prompt>/<narrative></panel>` XML tags
 * parsed in `game/parser.ts` — `art_prompt` here is pure visual description only, and all
 * text (dialogue, captions, sound effects) lives in dedicated JSON fields instead of being
 * embedded/tagged inside a prose blob, so the UI never has to re-parse text out of narrative.
 */

/** Common camera-angle vocabulary the Director is guided toward. Not exhaustive — the model
 *  may return other descriptive framing terms, so the field itself stays a plain string. */
export const CAMERA_ANGLE_EXAMPLES = [
  'WIDE SHOT',
  'CLOSE UP',
  'EXTREME CLOSE UP',
  'MEDIUM SHOT',
  'DUTCH ANGLE',
  'OVER THE SHOULDER',
  'LOW ANGLE',
  'HIGH ANGLE',
  'BIRDS EYE VIEW',
  'POV SHOT',
] as const;

export interface ComicDialogueLine {
  character: string;
  text: string;
}

export type ComicTextAnchor =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center';

/** Canonical anchors the overlay system understands. */
export const COMIC_TEXT_ANCHORS: readonly ComicTextAnchor[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'bottom-center',
] as const;

/**
 * Normalizes Director / LLM text-anchor payloads (including common aliases like
 * `center-bottom`) into the CSS placement vocabulary used by ComicPanelCell.
 */
export function normalizeTextAnchor(raw: unknown, fallback: ComicTextAnchor = 'bottom-center'): ComicTextAnchor {
  if (typeof raw !== 'string') return fallback;
  const key = raw.trim().toLowerCase().replace(/_/g, '-');
  const aliases: Record<string, ComicTextAnchor> = {
    'top-left': 'top-left',
    'topleft': 'top-left',
    'top-right': 'top-right',
    'topright': 'top-right',
    'bottom-left': 'bottom-left',
    'bottomleft': 'bottom-left',
    'bottom-right': 'bottom-right',
    'bottomright': 'bottom-right',
    'bottom-center': 'bottom-center',
    'bottomcenter': 'bottom-center',
    'center-bottom': 'bottom-center',
    'centerbottom': 'bottom-center',
    'bottom-middle': 'bottom-center',
    'middle-bottom': 'bottom-center',
  };
  return aliases[key] ?? fallback;
}

export interface ComicPanelScript {
  panel_id: number;
  /** Cinematography framing for this beat, e.g. "WIDE SHOT", "CLOSE UP", "DUTCH ANGLE". */
  camera_angle: string;
  /**
   * Strictly visual description ONLY — characters, setting, lighting, action, composition.
   * Must never mention text, words, letters, or speech/thought bubbles; the image model
   * should be able to hand this straight to `comicImagePrompt.ts` without stripping anything.
   */
  art_prompt: string;
  /** Narrative voiceover / caption box text, or a rendered Math Engine roll outcome. Null if
   *  this panel needs no caption. */
  caption: string | null;
  /** Speech bubble lines for this panel, in reading order. Empty array if no one speaks. */
  dialogue: ComicDialogueLine[];
  /** A single onomatopoeia/sound-effect burst for this panel (e.g. "*KABOOM*"), or null. */
  sfx: string | null;
  /** Director-planned negative-space location for UI-rendered captions and speech bubbles. */
  text_anchor?: ComicTextAnchor;
}

/** Top-level JSON object returned by the Director model. Wrapped in an object (rather than a
 *  bare top-level array) because OpenRouter/OpenAI `response_format: { type: "json_object" }`
 *  requires the response to be a JSON object. */
export interface ComicScriptResponse {
  panels: ComicPanelScript[];
}
