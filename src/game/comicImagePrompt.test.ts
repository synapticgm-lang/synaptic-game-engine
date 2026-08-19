import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from './defaults';
import {
  artStyleForImageKind,
  buildMilestoneIllustrationPrompt,
} from './comicImagePrompt';

describe('memorable book plates', () => {
  it('always uses classic-book for memorable and classic illustrations', () => {
    const settings = {
      ...createDefaultSettings(),
      artStylePreset: 'manga-screentone' as const,
    };
    expect(artStyleForImageKind(settings, 'milestone-illustration')).toBe('classic-book');
    expect(artStyleForImageKind(settings, 'classic-illustration')).toBe('classic-book');
    expect(artStyleForImageKind(settings, 'comic-panel')).toBe('manga-screentone');
  });

  it('asks for a printed storybook plate, not manga or a panel grid', () => {
    const prompt = buildMilestoneIllustrationPrompt(
      'You are on your back in a summoning circle.',
      createDefaultSettings(),
      'adult'
    );
    expect(prompt).toMatch(/storybook plate/i);
    expect(prompt).toMatch(/watercolor/i);
    expect(prompt).toMatch(/not manga/i);
    expect(prompt).not.toMatch(/worthy of a two-page spread/i);
  });
});
