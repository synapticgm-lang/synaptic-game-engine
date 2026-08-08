import type { Settings } from './types';
import { logger } from './logger';
import { fetchComicPanel, ImageModerationError } from '@/services/openRouterService';

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
): Promise<string> {
  const finalPrompt = buildFinalPrompt(prompt, styleModifier);
  const apiKey = settings.openrouterApiKey || settings.geminiApiKey;
  if (!apiKey) throw new Error('No OpenRouter API key configured for image generation.');

  logger.info('ai-image', `generateImage via OpenRouter pipeline`);

  try {
    const imageUrl = await fetchComicPanel(
      finalPrompt,
      modeFromSettings(settings),
      settings.artStylePreset ?? 'western',
      apiKey
    );
    return imageUrl;
  } catch (err) {
    if (err instanceof ImageModerationError) throw err;
    logger.error('ai-image', `OpenRouter image generation failed`, {
      error: err instanceof Error ? err.message : String(err)
    });
    throw err;
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
