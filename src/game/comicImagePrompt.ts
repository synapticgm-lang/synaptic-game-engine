import type { ArtStylePreset, Settings } from './types';

export type ImagePromptKind = 'comic-panel' | 'classic-illustration' | 'milestone-illustration';

/** Extra deterministic context threaded into a prompt build, independent of the GM's own narrative text. */
export interface ImagePromptContext {
  /** Player/NPC/gear/location descriptors from the Visual Consistency Manager. Injected verbatim, every request. */
  visualConsistency?: string;
  /** Only set for the FIRST panel of a turn — guarantees the player's actual action is depicted, not just narrated. */
  playerActionContext?: string;
}

/**
 * Pure-art directive: the image model renders ONLY the visual scene. All dialogue,
 * thought captions, sound-effect popups, and HUD chrome are composited afterward by
 * the React UI (SpeechBubble.tsx, ActionOverlay.tsx, ComicGrid.tsx overlay zones).
 * No layout/negative-space instructions or tag references belong in the image prompt.
 */
export const PURE_ART_DIRECTIVE =
  'Clean background, environmental focus or character pose, no text, no speech bubbles, no UI elements, sharp framing, high detail.';

export const WORLD_GENRE_PRESERVATION_DIRECTIVE =
  'WORLD CANON OVERRIDES ART STYLE: Treat the scene description and VISUAL CONTINUITY block as authoritative for setting, era, characters, equipment, architecture, and technology. The selected art preset controls rendering technique, linework, lighting, and palette only. Never add sci-fi technology, cybernetic implants, neon city infrastructure, holograms, firearms, modern clothing, or futuristic props to a medieval/fantasy scene unless those elements are explicitly present in the canonical scene description. Blend the visual treatment onto the existing world; do not replace the world with the preset genre.';

/** Negative prompt for endpoints that accept a dedicated negative-prompt field (e.g. Automatic1111, ComfyUI). */
export const NEGATIVE_ART_PROMPT =
  'text, words, letters, numbers, writing, speech bubble, thought bubble, caption, subtitle, watermark, signature, logo, UI, HUD, blurry, low quality, deformed, extra limbs';

const CLASSIC_ILLUSTRATION_DIRECTIVE =
  'Classic book illustration accent: detailed ink line-art, soft muted watercolor washes, storybook vignette composition, painterly single-scene illustration suitable for narrative prose — NOT a comic panel grid or multi-cell layout.';

const MILESTONE_ILLUSTRATION_DIRECTIVE =
  'Full-page milestone illustration: epic, high-detail single splash image marking a major story beat. Dramatic composition, cinematic lighting, worthy of a two-page spread in a printed book — NOT a comic panel grid or multi-cell layout.';

const COMIC_COMPOSITION_DIRECTIVE =
  'Single comic panel illustration with clean, well-balanced framing and a strong focal composition.';

const DEFAULT_COMIC_PRESET: Exclude<ArtStylePreset, 'classic-book'> = 'sin-city-noir';

export function isClassicBookPreset(settings: Settings): boolean {
  return settings.artStylePreset === 'classic-book';
}

export function isComicVisualMode(
  settings: Settings,
  comicModeToggle = false,
  narrativeModeToggle = false
): boolean {
  return settings.visualMode === 'comic' || (comicModeToggle && !narrativeModeToggle);
}

/**
 * Classic text mode skips routine art. Memorable-moment splashes are allowed only when
 * `classicMemorableImages` is enabled and the request is a milestone illustration.
 */
export function allowsImageGeneration(
  settings: Settings,
  promptKind?: ImagePromptKind
): boolean {
  if (settings.visualMode !== 'classic') return true;
  return Boolean(settings.classicMemorableImages && promptKind === 'milestone-illustration');
}

/**
 * Classic Book Illustration is prose-only: never multi-panel ComicGrid.
 * Returns false when artStylePreset is classic-book regardless of visualMode toggle.
 */
export function shouldUseComicGrid(
  settings: Settings,
  comicModeToggle = false,
  narrativeModeToggle = false
): boolean {
  if (isClassicBookPreset(settings)) return false;
  return isComicVisualMode(settings, comicModeToggle, narrativeModeToggle);
}

/** ComicGrid and comic-mode image gen must never use classic-book. */
export function getEffectiveComicPreset(preset: ArtStylePreset): Exclude<ArtStylePreset, 'classic-book'> {
  if (preset === 'classic-book') return DEFAULT_COMIC_PRESET;
  return preset;
}

function contentTone(mode: 'kid' | 'adult' | 'unrestricted'): string {
  if (mode === 'kid') {
    return 'STRICTLY FAMILY-FRIENDLY: bright colors, soft lighting, cartoonish tone, no graphic violence, suitable for all ages.';
  }
  if (mode === 'unrestricted') {
    return 'Mature fantasy tone: dramatic lighting, gritty texture, intense action allowed.';
  }
  return 'DARK FANTASY MATURE: dramatic lighting, gritty texture, intense combat, mature themes allowed.';
}

/** Prepends deterministic context (visual consistency, first-panel player action) ahead of the scene prompt. */
function withDeterministicContext(scenePrompt: string, context?: ImagePromptContext): string {
  const parts: string[] = [];
  if (context?.playerActionContext?.trim()) {
    parts.push(`The scene must visually depict the player's action: "${context.playerActionContext.trim()}"`);
  }
  parts.push(scenePrompt.trim());
  if (context?.visualConsistency?.trim()) {
    parts.push(context.visualConsistency.trim());
  }
  return parts.join('\n\n');
}

export function buildComicPanelImagePrompt(
  scenePrompt: string,
  mode: 'kid' | 'adult' | 'unrestricted',
  context?: ImagePromptContext
): string {
  return [
    withDeterministicContext(scenePrompt, context),
    WORLD_GENRE_PRESERVATION_DIRECTIVE,
    COMIC_COMPOSITION_DIRECTIVE,
    PURE_ART_DIRECTIVE,
    contentTone(mode),
  ].join('\n\n');
}

export function buildClassicIllustrationPrompt(
  scenePrompt: string,
  settings: Settings,
  mode: 'kid' | 'adult' | 'unrestricted',
  context?: ImagePromptContext
): string {
  return [
    withDeterministicContext(scenePrompt, context),
    CLASSIC_ILLUSTRATION_DIRECTIVE,
    'Single illustration only — no comic cells, no panel grid.',
    PURE_ART_DIRECTIVE,
    contentTone(mode),
  ].join('\n\n');
}

export function buildMilestoneIllustrationPrompt(
  scenePrompt: string,
  settings: Settings,
  mode: 'kid' | 'adult' | 'unrestricted',
  context?: ImagePromptContext
): string {
  return [
    withDeterministicContext(scenePrompt, context),
    MILESTONE_ILLUSTRATION_DIRECTIVE,
    PURE_ART_DIRECTIVE,
    contentTone(mode),
  ].join('\n\n');
}

export function buildImagePromptForKind(
  scenePrompt: string,
  settings: Settings,
  mode: 'kid' | 'adult' | 'unrestricted',
  kind: ImagePromptKind,
  context?: ImagePromptContext
): string {
  if (kind === 'classic-illustration') return buildClassicIllustrationPrompt(scenePrompt, settings, mode, context);
  if (kind === 'milestone-illustration') return buildMilestoneIllustrationPrompt(scenePrompt, settings, mode, context);
  return buildComicPanelImagePrompt(scenePrompt, mode, context);
}
