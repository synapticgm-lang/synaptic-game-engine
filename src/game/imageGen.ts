import type { Settings } from './types';
import { logger } from './logger';
import { fetchComicPanel, ImageModerationError, generateComicImage } from '@/services/openRouterService';

// Re-exported for backward compatibility — the class now lives in openRouterService.ts,
// next to the detection logic that actually throws it (text-refusal detection in fetchComicPanel).
export { ImageModerationError };

function buildFinalPrompt(prompt: string, modifier: string): string {
  return `${prompt}\n\nSTYLE DIRECTIVE: ${modifier}\n\nIMPORTANT: Do NOT include any text, words, letters, or speech bubbles in the image. The image must be purely visual with zero text.`;
}

function modeFromSettings(settings: Settings): 'kid' | 'adult' | 'unrestricted' {
  if (settings.contentMode === 'kid') return 'kid';
  if (settings.contentMode === 'adult') return 'adult';
  return 'unrestricted';
}

export async function generateImage(
  prompt: string,
  settings: Settings,
  styleModifier: string
): Promise<string | null> {
  if (settings.visualMode === 'classic' && !settings.classicMemorableImages) {
    console.log('[ImageService] Skipping image generation for classic text mode.');
    return null;
  }

  const finalPrompt = buildFinalPrompt(prompt, styleModifier);
  logger.info('ai-image', `generateImage via generateComicImage pipeline`);

  try {
    return await generateComicImage(finalPrompt, modeFromSettings(settings), settings, {
      memorableMoment: settings.visualMode === 'classic' && settings.classicMemorableImages,
      useRawPrompt: true,
    });
  } catch (err) {
    if (err instanceof ImageModerationError) throw err;
    const apiKey = settings.openrouterApiKey || settings.geminiApiKey;
    if (!apiKey) throw err;
    logger.warn('ai-image', `generateComicImage failed; trying OpenRouter chat image`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return fetchComicPanel(
      finalPrompt,
      modeFromSettings(settings),
      settings.artStylePreset ?? 'western',
      apiKey,
      settings.imageModel?.trim() || undefined
    );
  }
}

export function softenPrompt(prompt: string): string {
  return prompt
    .replace(/\b(blood|gore|dismember|decapitat|gory|visceral|graphic|brutal|mutilat|corpse|slaughter|carnage)\b/gi, 'dramatic')
    .replace(/\b(nude|naked|explicit|erotic|sexual|nsfw)\b/gi, 'tasteful')
    .replace(/\b(kill|murder|execute|slaughter)\b/gi, 'defeat')
    .replace(/STYLE DIRECTIVE:[\s\S]*$/i, 'STYLE DIRECTIVE: Tasteful, non-graphic, artistic composition. Avoid explicit violence or sensitive content.')
    .trim();
}
