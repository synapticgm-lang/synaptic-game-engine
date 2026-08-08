import { normalizeTextAnchor, type ComicPanelScript } from '../types/comicScript';
import type { ComicPanel } from './types';
import { parseNarrativeSegments } from '@/components/comic/NarrativeText';

/**
 * Adapts a Phase 2 LLM Director panel script into the app's native `ComicPanel` shape, so
 * Director-scripted panels flow through the exact same downstream pipeline (image generation,
 * `ComicGrid.tsx` / `ComicPanelCell` rendering, TTS, PDF export) as the legacy GM-authored
 * `<panel><image-prompt>/<narrative></panel>` tags — no changes needed anywhere else.
 *
 * Re-serializes the script's structured `caption`/`dialogue`/`sfx` fields back into the same
 * inline tag vocabulary (`<dialogue>`, `<effect>`) that `parseNarrativeSegments` already knows
 * how to render as speech bubbles / SFX chips, rather than inventing a second text format.
 */
export function comicPanelScriptToPanel(script: ComicPanelScript): ComicPanel {
  const parts: string[] = [];
  if (script.caption) parts.push(script.caption);
  for (const line of script.dialogue) {
    if (!line.text?.trim()) continue;
    parts.push(`<dialogue>${line.character || 'Unknown'}: "${line.text}"</dialogue>`);
  }
  if (script.sfx) parts.push(`<effect>${script.sfx}</effect>`);

  return {
    imagePrompt: script.art_prompt,
    narrative: parts.join(' ').trim(),
    imageUrl: null,
    imageStatus: 'pending',
    cameraAngle: script.camera_angle,
    textAnchor: script.text_anchor ? normalizeTextAnchor(script.text_anchor) : undefined,
  };
}

/**
 * Extracts a flat, in-reading-order list of narratable strings (captions + dialogue lines,
 * across every panel of the turn) for `voice.speakSequence()` in Comic Mode. Works for both
 * Director-scripted panels (adapted above) and legacy GM `<panel>` tags, since both store their
 * text in the same `ComicPanel.narrative` tag format — this just re-parses it with the same
 * `parseNarrativeSegments` the on-screen speech bubbles already use, so what's read aloud always
 * matches what's shown. SFX chips are excluded (an onomatopoeia stamp isn't meant to be narrated).
 */
export function buildComicSpeechQueue(panels: ComicPanel[]): string[] {
  const queue: string[] = [];
  for (const panel of panels) {
    for (const seg of parseNarrativeSegments(panel.narrative)) {
      if (!seg.text.trim()) continue;
      if (seg.type === 'dialogue' || seg.type === 'thought') {
        queue.push(seg.speaker ? `${seg.speaker} says: ${seg.text}` : seg.text);
      } else if (seg.type === 'scene' || seg.type === 'system') {
        queue.push(seg.text);
      }
      // 'effect' (SFX) segments are visual stamps, not narrated.
    }
  }
  return queue;
}
