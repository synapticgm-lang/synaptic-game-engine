import type { ArtStylePreset, ColorVariant } from '@/game/types';

/**
 * Visual theme for the React overlay layer (speech bubbles, thought/caption text, panel
 * chrome). Kept separate from the image-generation prompt fields below — the UI can react
 * to a style change instantly, without waiting on a newly generated image.
 */
export interface UiOverlayTheme {
  /** CSS font-family stack used for dialogue/thought speech-bubble text. */
  bubbleFontFamily: string;
  bubbleBackground: string;
  bubbleTextColor: string;
  bubbleBorderColor: string;
  bubbleBorderWidth: string;
  bubbleBorderRadius: string;
  /** CSS font-family stack used for plain scene captions rendered under/around a panel. */
  captionFontFamily: string;
  captionTextColor: string;
  captionBackground: string;
  /** Comic panel frame border. */
  panelBorderColor: string;
  panelBorderWidth: string;
  /** Accent color for in-world stylistic overlays (sound-effect/action-burst chips). */
  accentColor: string;
}

/**
 * Standardized Style Spec for one illustration style. `style_prefix` / `style_suffix` /
 * `negative_prompt` are consumed by the OpenRouter Image API client (see
 * `services/openRouterService.ts` -> `generateComicImage`), which automatically wraps
 * every outgoing image prompt with the active style's fields — callers never need to
 * remember to append style keywords themselves.
 */
export interface StyleSpec {
  id: ArtStylePreset;
  name: string;
  description: string;
  /** Prepended to every image prompt while this style is active. */
  style_prefix: string;
  /** Appended to every image prompt while this style is active. */
  style_suffix: string;
  /** Optional highest-priority rendering direction when Black & White is forced. */
  monochrome_override?: string;
  /** Optional highest-priority rendering direction when Full Color is forced. */
  color_override?: string;
  /** Terms to avoid. Sent as a dedicated field to backends that support one (Automatic1111,
   *  ComfyUI); folded into the prompt as an explicit "avoid" clause for backends that don't
   *  (OpenRouter chat-completions, OpenAI-compatible /images/generations). */
  negative_prompt: string;
  ui_overlay_theme: UiOverlayTheme;
}

const BASE_NEGATIVE =
  'text, words, letters, numbers, writing, speech bubble, thought bubble, caption, subtitle, watermark, signature, logo, UI, HUD, blurry, low quality, deformed, extra limbs';

export const STYLE_SPECS: Record<ArtStylePreset, StyleSpec> = {
  'manga-screentone': {
    id: 'manga-screentone',
    name: 'Manga / Manhwa',
    description: 'Monochrome ink, halftone screentone shading, dynamic speed lines.',
    style_prefix:
      'Traditional manga panel, crisp ink line art, heavy screentone shading, dynamic speed lines, high contrast Japanese comic illustration',
    style_suffix:
      'monochrome ink linework, clean halftone screentone shading, dynamic speed lines, high-contrast black and white, Japanese manga aesthetic, crisp panel gutters.',
    color_override:
      'Full color manga cover art, vibrant anime coloring, crisp cel-shaded anime style',
    monochrome_override:
      'Pure black and white, monochrome, heavy halftone dot patterns, zero color',
    negative_prompt: `${BASE_NEGATIVE}, western comic style, painterly`,
    ui_overlay_theme: {
      bubbleFontFamily: "'Komika Axis', 'Segoe UI', sans-serif",
      bubbleBackground: '#ffffff',
      bubbleTextColor: '#0a0a0a',
      bubbleBorderColor: '#0a0a0a',
      bubbleBorderWidth: '3px',
      bubbleBorderRadius: '0.25rem',
      captionFontFamily: "'Komika Axis', 'Segoe UI', sans-serif",
      captionTextColor: '#e5e5e5',
      captionBackground: 'rgba(10, 10, 10, 0.9)',
      panelBorderColor: '#0a0a0a',
      panelBorderWidth: '3px',
      accentColor: '#0a0a0a',
    },
  },
  'cyberpunk-cel': {
    id: 'cyberpunk-cel',
    name: 'Cyberpunk Cel-Shaded',
    description: 'Neon rim lighting and crisp vector cel shading without changing world canon.',
    style_prefix:
      'Cyberpunk-inspired graphic novel rendering treatment, dense angular line art, flat cel-shaded coloring, neon-accented cinematic lighting',
    style_suffix:
      'crisp vector line art and neon cyan-magenta rim lighting applied only to canonical scene elements; preserve the source setting and add no technology, holograms, HUD elements, or futuristic props.',
    color_override:
      'Vibrant neon cyan and magenta highlights, volumetric glowing rain and smog',
    monochrome_override:
      'Cyber-noir, stark black and white ink, high contrast monochrome cyberpunk',
    negative_prompt: `${BASE_NEGATIVE}, muted colors, parchment texture, unrequested futuristic props, unrequested cybernetic implants`,
    ui_overlay_theme: {
      bubbleFontFamily: "'Orbitron', 'Segoe UI', sans-serif",
      bubbleBackground: '#0b1120',
      bubbleTextColor: '#67e8f9',
      bubbleBorderColor: '#22d3ee',
      bubbleBorderWidth: '2px',
      bubbleBorderRadius: '0.125rem',
      captionFontFamily: "'Orbitron', 'Segoe UI', sans-serif",
      captionTextColor: '#a5f3fc',
      captionBackground: 'rgba(8, 15, 26, 0.9)',
      panelBorderColor: '#22d3ee',
      panelBorderWidth: '2px',
      accentColor: '#f472b6',
    },
  },
  'dark-fantasy-mignola': {
    id: 'dark-fantasy-mignola',
    name: 'Dark Fantasy (Mignola)',
    description: 'Blocky ink shadows, gothic muted palette, graphic-novel cross-hatching.',
    style_prefix:
      'Mike Mignola style dark fantasy comic panel, heavy block shadows, pure black silhouettes, extreme chiaroscuro lighting, angular ink lines',
    style_suffix:
      'Mike Mignola inspired western ink shadows, heavy blocky black shapes, gothic muted palette, chiaroscuro lighting, stark silhouettes, graphic novel cross-hatching.',
    color_override:
      'Flat muted gothic color palette, blood reds, muddy greens',
    monochrome_override:
      'Strictly black and white ink drawing, pure negative space, zero color',
    negative_prompt: `${BASE_NEGATIVE}, bright colors, cheerful, cel shading, anime`,
    ui_overlay_theme: {
      bubbleFontFamily: "'IM Fell English', 'Georgia', serif",
      bubbleBackground: '#f5f0e6',
      bubbleTextColor: '#1c1006',
      bubbleBorderColor: '#1c1006',
      bubbleBorderWidth: '2px',
      bubbleBorderRadius: '0.5rem',
      captionFontFamily: "'IM Fell English', 'Georgia', serif",
      captionTextColor: '#d6cbb8',
      captionBackground: 'rgba(20, 14, 8, 0.9)',
      panelBorderColor: '#3f2f1d',
      panelBorderWidth: '3px',
      accentColor: '#b45309',
    },
  },
  'sin-city-noir': {
    id: 'sin-city-noir',
    name: 'Sin City Noir',
    description: 'Stark high-contrast black & white with a single crimson accent.',
    style_prefix:
      'Frank Miller Sin City comic style, neo-noir graphic novel, stark binary black and white, extreme high contrast, sharp ink shadows',
    style_suffix:
      'stark high-contrast black and white, deep ink shadows, selective crimson accent color, gritty graphic novel aesthetic, bold panel composition.',
    color_override:
      'Selective splash color, single vivid red element against pure black and white background',
    monochrome_override:
      'Pure monochrome, strict binary black and white, no grayscale',
    negative_prompt: `${BASE_NEGATIVE}, full color, pastel, soft lighting`,
    ui_overlay_theme: {
      bubbleFontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
      bubbleBackground: '#ffffff',
      bubbleTextColor: '#000000',
      bubbleBorderColor: '#000000',
      bubbleBorderWidth: '2px',
      bubbleBorderRadius: '0.125rem',
      captionFontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
      captionTextColor: '#e5e5e5',
      captionBackground: 'rgba(0, 0, 0, 0.92)',
      panelBorderColor: '#dc2626',
      panelBorderWidth: '2px',
      accentColor: '#dc2626',
    },
  },
  // "High Fantasy" storybook style — classic-book preset is prose-accent-only (never routed
  // through ComicGrid, see `shouldUseComicGrid`), but still generates occasional single
  // illustrations, so it gets a full spec too.
  'classic-book': {
    id: 'classic-book',
    name: 'High Fantasy Storybook',
    description: 'Ink line-art with soft watercolor washes, painterly storybook illustration.',
    style_prefix:
      'Classic European graphic novel style, vintage high fantasy illustration, intricate medieval armor details',
    style_suffix:
      'detailed ink line-art, soft muted watercolor washes, storybook vignette composition, painterly single-scene illustration.',
    color_override:
      'Painterly watercolor textures, warm parchment tones, soft ambient lighting',
    monochrome_override:
      'Vintage sepia ink sketch, classic pen and crosshatch illustration',
    negative_prompt: `${BASE_NEGATIVE}, comic panel grid, halftone, cel shading`,
    ui_overlay_theme: {
      bubbleFontFamily: "'Cormorant Garamond', 'Georgia', serif",
      bubbleBackground: '#fffaf0',
      bubbleTextColor: '#2a1f14',
      bubbleBorderColor: '#8b6f47',
      bubbleBorderWidth: '1.5px',
      bubbleBorderRadius: '0.75rem',
      captionFontFamily: "'Cormorant Garamond', 'Georgia', serif",
      captionTextColor: '#e8dcc4',
      captionBackground: 'rgba(42, 31, 20, 0.85)',
      panelBorderColor: '#8b6f47',
      panelBorderWidth: '2px',
      accentColor: '#b45309',
    },
  },
};

export function getStyleSpec(preset: ArtStylePreset): StyleSpec {
  return STYLE_SPECS[preset] ?? STYLE_SPECS['sin-city-noir'];
}

/**
 * Resolves the optional user-selected color treatment. This directive is appended after the
 * complete scene/style prompt by the image client, making it the final and highest-priority
 * color instruction. Returning an empty string preserves the style's natural baseline.
 */
export function getColorVariantDirective(spec: StyleSpec, variant: ColorVariant = 'default'): string {
  if (variant === 'monochrome') return spec.monochrome_override?.trim() ?? '';
  if (variant === 'color') return spec.color_override?.trim() ?? '';
  return '';
}

/**
 * Kid Mode safety layer for image generation.
 *
 * This hooks into the app's EXISTING content-safety toggle — `Settings.contentMode`
 * (`'kid' | 'adult'`, set via the Kid Mode switch in `SettingsModal.tsx` / the mode picker in
 * `SetupScreen.tsx` / `ApiSetupModal.tsx`, see `game/types.ts`). It intentionally does not
 * introduce a second/duplicate kid-mode flag — callers just pass along the same
 * `'kid' | 'adult' | 'unrestricted'` mode value already threaded through
 * `generateComicImage` / `fetchComicPanel` / `buildImagePromptForKind`.
 *
 * It is orthogonal to illustration style: rather than duplicating every `StyleSpec` into a
 * kid/adult variant, the terms below are layered ON TOP of whichever style is active, so
 * "Manga + Kid Mode" and "Sin City Noir + Kid Mode" both get the same safety floor while
 * keeping their distinct art direction.
 */
export const KID_MODE_NEGATIVE_PROMPT =
  'gore, blood, graphic violence, weapons aimed at people, corpses, realistic injury, disturbing or scary imagery, horror, nudity, sexual or suggestive content, alcohol, drugs, smoking, profanity, grimdark tone';

/**
 * PEGI-3 equivalent (suitable for all ages) visual-narrative constraint. Prepended to the
 * composed image prompt in `generateComicImage` whenever Kid Mode is active, regardless of
 * which backend (OpenRouter, OpenAI-compatible, Automatic1111, ComfyUI) ends up serving the
 * request — so kid-safety is enforced at the client layer even for prompts built with
 * `useRawPrompt: true`.
 */
export const KID_MODE_STYLE_DIRECTIVE =
  'STRICTLY FAMILY-FRIENDLY (PEGI 3 equivalent, suitable for all ages): bright cheerful colors, soft lighting, gentle cartoonish/storybook tone. Absolutely no graphic violence, blood, gore, weapons harming anyone, or scary/disturbing imagery.';

/**
 * Returns the active style's negative prompt, layered with the Kid Mode safety terms when
 * `contentMode === 'kid'`. Use this instead of reading `spec.negative_prompt` directly
 * anywhere a `mode`/`contentMode` value is in scope.
 */
export function getEffectiveNegativePrompt(
  spec: StyleSpec,
  contentMode: 'kid' | 'adult' | 'unrestricted'
): string {
  return contentMode === 'kid' ? `${spec.negative_prompt}, ${KID_MODE_NEGATIVE_PROMPT}` : spec.negative_prompt;
}
