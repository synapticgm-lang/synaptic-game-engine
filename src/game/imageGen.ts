import { ImageModerationError } from '@/services/openRouterService';

// Re-exported for backward compatibility — the class now lives in openRouterService.ts,
// next to the detection logic that actually throws it (text-refusal detection in fetchComicPanel).
export { ImageModerationError };

export function softenPrompt(prompt: string): string {
  return prompt
    .replace(/\b(blood|gore|dismember|decapitat|gory|visceral|graphic|brutal|mutilat|corpse|slaughter|carnage)\b/gi, 'dramatic')
    .replace(/\b(nude|naked|explicit|erotic|sexual|nsfw)\b/gi, 'tasteful')
    .replace(/\b(kill|murder|execute|slaughter)\b/gi, 'defeat')
    .replace(/STYLE DIRECTIVE:[\s\S]*$/i, 'STYLE DIRECTIVE: Tasteful, non-graphic, artistic composition. Avoid explicit violence or sensitive content.')
    .trim();
}
