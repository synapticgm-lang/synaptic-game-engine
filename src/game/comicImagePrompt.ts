import type { ArtStylePreset, EngineMode, Settings } from './types';
import type { CampaignArchetype } from './archetypes';
import { formatWorldCanonForPrompt, kidSafeArtDirective } from './visualCanon';
import { hostedImagesAllowed } from './testLab';
import { formatSceneArtLock, type SceneArtFactsInput } from './sceneArtLock';

export type ImagePromptKind =
  | 'comic-panel'
  | 'classic-illustration'
  | 'milestone-illustration'
  | 'item-icon'
  | 'character-portrait';

/** Extra deterministic context threaded into a prompt build, independent of the GM's own narrative text. */
export interface ImagePromptContext {
  /** Player/NPC look from the sheet — used to keep adult PCs adult in art. */
  characterLook?: string;
  /** Canonical visual continuity block from the live save (kit, faces, place). */
  visualConsistency?: string;
  /** Only set for the FIRST panel of a turn — guarantees the player's actual action is depicted, not just narrated. */
  playerActionContext?: string;
  /** Rules mode — picture era must match (LitRPG street vs tabletop tavern). */
  engineMode?: EngineMode;
  currentLocation?: string;
  campaignPremise?: string;
  campaignArchetype?: CampaignArchetype;
  campaignBibleId?: string | null;
  /** Last committed GM prose — SCENE AUTHORITY for plates. */
  storyText?: string;
  sceneFacts?: SceneArtFactsInput | null;
  pickedHook?: string;
}

/**
 * Pure-art directive: the image model renders ONLY the visual scene. All dialogue,
 * thought captions, sound-effect popups, and HUD chrome are composited afterward by
 * the React UI (SpeechBubble.tsx, ActionOverlay.tsx, ComicGrid.tsx overlay zones).
 * No layout/negative-space instructions or tag references belong in the image prompt.
 */
export const PURE_ART_DIRECTIVE =
  'Clean background, environmental focus or character pose, no text, no speech bubbles, no UI elements, sharp framing, high detail.';

/** Franchise / living-artist style targets never reach the hosted model. */
const FRANCHISE_STYLE_LEAK =
  /\b(marvel|dc comics|image comics|dark horse|webtoon originals|shonen jump|viz media|studio ghibli|miyazaki|kim jung gi|jim lee|greg capullo|frank miller|make it like\s+[\w\-]+)/gi;

export function scrubFranchiseStyleLeak(text: string): string {
  if (!text) return text;
  return text
    .replace(FRANCHISE_STYLE_LEAK, 'original technique')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const WORLD_GENRE_PRESERVATION_DIRECTIVE =
  'WORLD CANON OVERRIDES ART STYLE: Treat the scene description and VISUAL CONTINUITY block as authoritative for setting, era, characters, equipment, architecture, and technology. The selected art preset controls rendering technique, linework, lighting, and palette only. Never add sci-fi technology, cybernetic implants, neon city infrastructure, holograms, firearms, modern clothing, or futuristic props to a medieval/fantasy scene unless those elements are explicitly present in the canonical scene description. Blend the visual treatment onto the existing world; do not replace the world with the preset genre.';

/** Negative prompt for endpoints that accept a dedicated negative-prompt field (e.g. Automatic1111, ComfyUI). */
export const NEGATIVE_ART_PROMPT =
  'text, words, letters, numbers, writing, speech bubble, thought bubble, caption, subtitle, watermark, signature, logo, UI, HUD, System panel, XP box, blurry, low quality, deformed, extra limbs, extra arms, extra legs, six fingers, mutated hands';

export const CLASSIC_ILLUSTRATION_DIRECTIVE =
  'Ink-and-watercolor illustration of ONE scene filling the whole frame. Detailed ink line-art, soft muted washes. Technique only — not a photograph of a book, not two pages, not a comic grid.';

/** Rare prose splash — one picture, then back to text. “Book illustration” is paint style, not the subject. */
export const MILESTONE_ILLUSTRATION_DIRECTIVE =
  'ONE rectangular illustration filling the entire image. Ink line-art with soft watercolor washes. Single camera, one moment, one person as described. NEVER draw a physical book, an open book, two facing pages, a second picture, fake writing, or a picture-book spread. Not manga, not a comic panel grid, not a triptych.';

const BOOK_PLATE_TONE =
  'Ink-and-watercolor paint style: warm paper light, gentle contrast. Not anime, not manga, not cel-shaded comic coloring.';

const MINOR_LOOK =
  /\b(child|toddler|infant|baby|preteen|little (?:boy|girl)|school-?age|underage|(?:[1-9]|1[0-7]|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen)\s*-?\s*year-?old)\b/i;

/** True only when the sheet/look explicitly names a child — empty Adventurer is an adult. */
export function viewpointLooksMinor(text?: string | null): boolean {
  return MINOR_LOOK.test(text ?? '');
}

export function subjectAgeDirective(look?: string | null): string {
  if (viewpointLooksMinor(look)) {
    return 'VIEWPOINT CHARACTER: a child as the look/sheet describes. Still one scene filling the frame — not a children’s picture-book spread.';
  }
  return 'VIEWPOINT CHARACTER: an adult (18 or older). Do not draw a child, preteen, or toddler as the hero. Watercolor style is not a reason to make them a kid. A child in the background only if the scene names one.';
}

/** Appearance + bio for image prompts. Empty Adventurer is adult unless this names a child. */
export function characterLookForArt(character?: {
  appearance?: string | null;
  bio?: string | null;
} | null): string {
  return [character?.appearance, character?.bio]
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join('. ');
}

const KID_MILESTONE_BEAT_DIRECTIVE =
  'KID-SAFE MILESTONE (Google Play Families): If a foe is down, show them asleep, slumped, or fading — never blood, gore, or a corpse close-up. Victory is a triumphant pose. A death beat is a quiet rest with no injury shown. Everyone fully clothed, non-suggestive. No alcohol, drugs, needles, smoking, or gambling. Skip graphic injury entirely. Still one scene filling the frame — never an open book or two pages.';

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
  if (!hostedImagesAllowed()) return false;
  if (promptKind === 'item-icon' || promptKind === 'character-portrait') return true;
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

/** Memorable plates always render as classic book illustration, even if comic/manga is selected. */
export function artStyleForImageKind(
  settings: Pick<Settings, 'artStylePreset'>,
  kind?: ImagePromptKind
): ArtStylePreset {
  if (kind === 'milestone-illustration' || kind === 'classic-illustration') return 'classic-book';
  return settings.artStylePreset;
}

function contentTone(mode: 'kid' | 'adult' | 'unrestricted'): string {
  if (mode === 'kid') {
    return `STRICTLY FAMILY-FRIENDLY (Google Play Families bar): bright colors, soft lighting, cartoonish tone, suitable for all ages. ${kidSafeArtDirective()} No alcohol, drugs, smoking, gambling, or suggestive poses.`;
  }
  if (mode === 'unrestricted') {
    return 'Mature fantasy tone: dramatic lighting, gritty texture, intense action allowed.';
  }
  return 'DARK FANTASY MATURE: dramatic lighting, gritty texture, intense combat, mature themes allowed.';
}

/** Prepends deterministic context (visual consistency, first-panel player action) ahead of the scene prompt. */
function withDeterministicContext(scenePrompt: string, context?: ImagePromptContext): string {
  const parts: string[] = [];
  if (context?.engineMode) {
    parts.push(formatWorldCanonForPrompt({
      engineMode: context.engineMode,
      currentLocation: context.currentLocation,
      campaignPremise: context.campaignPremise,
      campaignArchetype: context.campaignArchetype,
      campaignBibleId: context.campaignBibleId,
    }));
  }
  if (context?.playerActionContext?.trim()) {
    parts.push(`The scene must visually depict the player's action: "${context.playerActionContext.trim()}"`);
  }
  if (context?.storyText || context?.sceneFacts || context?.currentLocation) {
    parts.push(formatSceneArtLock({
      storyText: context.storyText,
      pickedHook: context.pickedHook,
      location: context.currentLocation,
      sceneFacts: context.sceneFacts,
    }));
  }
  parts.push(scrubFranchiseStyleLeak(scenePrompt.trim()));
  if (context?.characterLook?.trim()) {
    parts.push(`LOOK: ${context.characterLook.trim()}`);
  }
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
    subjectAgeDirective(context?.characterLook),
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
    subjectAgeDirective(context?.characterLook),
    mode === 'kid' ? KID_MILESTONE_BEAT_DIRECTIVE : BOOK_PLATE_TONE,
    PURE_ART_DIRECTIVE,
    mode === 'kid' ? contentTone(mode) : '',
  ].filter(Boolean).join('\n\n');
}

const ITEM_ICON_DIRECTIVE =
  'Square painted inventory icon: isolated object only, centered, no person, no hands, no text, no UI chrome, dark subtle background.';

const PAPER_DOLL_DIRECTIVE =
  'Standing three-quarter inventory portrait, full body from head to feet, wearing the listed gear, neutral dark studio backdrop, no text, no UI, no inventory frame.';

export function buildImagePromptForKind(
  scenePrompt: string,
  settings: Settings,
  mode: 'kid' | 'adult' | 'unrestricted',
  kind: ImagePromptKind,
  context?: ImagePromptContext
): string {
  if (kind === 'item-icon') {
    const canon = context?.engineMode
      ? formatWorldCanonForPrompt({
          engineMode: context.engineMode,
          currentLocation: context.currentLocation,
          campaignPremise: context.campaignPremise,
          campaignArchetype: context.campaignArchetype,
          campaignBibleId: context.campaignBibleId,
        })
      : '';
    return [canon, scenePrompt.trim(), ITEM_ICON_DIRECTIVE, PURE_ART_DIRECTIVE, contentTone(mode)]
      .filter(Boolean)
      .join('\n\n');
  }
  if (kind === 'character-portrait') {
    return [
      withDeterministicContext(scenePrompt, context),
      PAPER_DOLL_DIRECTIVE,
      WORLD_GENRE_PRESERVATION_DIRECTIVE,
      PURE_ART_DIRECTIVE,
      contentTone(mode),
    ].join('\n\n');
  }
  if (kind === 'classic-illustration') return buildClassicIllustrationPrompt(scenePrompt, settings, mode, context);
  if (kind === 'milestone-illustration') return buildMilestoneIllustrationPrompt(scenePrompt, settings, mode, context);
  return buildComicPanelImagePrompt(scenePrompt, mode, context);
}
