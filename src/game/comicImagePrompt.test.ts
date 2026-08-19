import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from './defaults';
import {
  artStyleForImageKind,
  buildMilestoneIllustrationPrompt,
  subjectAgeDirective,
  viewpointLooksMinor,
} from './comicImagePrompt';

describe('memorable splash illustrations', () => {
  it('always uses classic-book for memorable and classic illustrations', () => {
    const settings = {
      ...createDefaultSettings(),
      artStylePreset: 'manga-screentone' as const,
    };
    expect(artStyleForImageKind(settings, 'milestone-illustration')).toBe('classic-book');
    expect(artStyleForImageKind(settings, 'classic-illustration')).toBe('classic-book');
    expect(artStyleForImageKind(settings, 'comic-panel')).toBe('manga-screentone');
  });

  it('asks for one ink-and-watercolor scene filling the frame, not a book object or manga grid', () => {
    const prompt = buildMilestoneIllustrationPrompt(
      'You are on your back in a summoning circle.',
      createDefaultSettings(),
      'adult'
    );
    expect(prompt).toMatch(/watercolor/i);
    expect(prompt).toMatch(/ONE rectangular illustration filling the entire image/i);
    expect(prompt).toMatch(/not manga/i);
    expect(prompt).toMatch(/an adult \(18 or older\)/i);
    expect(prompt).not.toMatch(/storybook plate/i);
    expect(prompt).not.toMatch(/bound opposite a page of prose/i);
    expect(prompt).not.toMatch(/worthy of a two-page spread/i);
  });

  it('treats an empty Adventurer look as adult, and a named child as a child', () => {
    expect(viewpointLooksMinor('')).toBe(false);
    expect(viewpointLooksMinor(undefined)).toBe(false);
    expect(viewpointLooksMinor('short brown hair, gray hoodie')).toBe(false);
    expect(viewpointLooksMinor('a child in a gray hoodie')).toBe(true);
    expect(subjectAgeDirective('')).toMatch(/adult \(18 or older\)/i);
    expect(subjectAgeDirective('a six-year-old girl')).toMatch(/a child as the look/i);

    const adultPrompt = buildMilestoneIllustrationPrompt(
      'On the cathedral floor.',
      createDefaultSettings(),
      'adult',
      { characterLook: 'gray hoodie, blue jeans' }
    );
    expect(adultPrompt).toMatch(/an adult \(18 or older\)/i);
    expect(adultPrompt).toMatch(/LOOK: gray hoodie, blue jeans/);

    const childPrompt = buildMilestoneIllustrationPrompt(
      'On the cathedral floor.',
      createDefaultSettings(),
      'adult',
      { characterLook: 'a child in a gray hoodie' }
    );
    expect(childPrompt).toMatch(/a child as the look/i);
    expect(childPrompt).not.toMatch(/an adult \(18 or older\)/i);
  });
});
