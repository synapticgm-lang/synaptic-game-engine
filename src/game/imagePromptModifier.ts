import type { Settings } from './types';

/** Art-style modifier for image generation. Safe to ship on client (presentation only). */
export function buildImagePromptModifier(settings: Settings): string {
  const styleMap: Record<string, string> = {
    'manga-screentone': 'manga art style, detailed line art, dynamic shadows, monochrome ink, halftone screentone shading, japanese manga aesthetic',
    'manhwa-webtoon': 'full color manhwa webtoon style, clean digital line art, soft cel shading, vertical scroll comic aesthetic',
    'classic-book': 'classic book illustration, detailed ink line-art, soft muted watercolor washes, storybook aesthetic',
    'sin-city-noir': 'gritty graphic novel artwork, heavy shadows, high contrast black and white, noir aesthetic',
    'dark-fantasy-mignola': 'dark fantasy mignola style, heavy blocky shadows, muted gothic palette, comic book noir',
    'cyberpunk-cel': 'clean animated fantasy style, crisp cell shading, bright colorful adventure art, cyberpunk aesthetic',
    'western-pulp': 'western pulp comic book style, bold ink outlines, saturated primary colors, dynamic action poses',
    'watercolor-lush': 'lush watercolor comic illustration, soft wet-on-wet washes, delicate ink underdrawing, atmospheric color',
    'euro-ligne-claire': 'ligne claire european comic style, even clear ink contours, flat clean colors, bande dessinee aesthetic',
    'ink-wash-sumi': 'sumi-e ink wash comic style, expressive brush strokes, misty negative space, east asian ink painting aesthetic',
  };
  const styleSuffix = styleMap[settings.artStylePreset] ?? styleMap['classic-book'];

  if (settings.contentMode === 'kid') {
    return `STRICTLY FAMILY-FRIENDLY (Google Play Families): Bright colors, soft lighting, cartoonish style, no gore, no nudity, no alcohol/drugs/smoking, no gambling, suitable for all ages. ${styleSuffix}`;
  }
  return `DARK FANTASY MATURE: Dramatic lighting, gritty texture, intense combat, mature themes allowed. ${styleSuffix}`;
}
