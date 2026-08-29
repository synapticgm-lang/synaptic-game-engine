import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';

const menu = readFileSync(resolve(__dirname, '../components/MainMenu.tsx'), 'utf8');
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

describe('playtest30u — home scroll + title panel', () => {
  it('stamp is 2026-08-30U / 30n and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30n').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-30U').toBe(true);
  });

  it('home column scrolls instead of clipping under #root overflow-hidden', () => {
    expect(menu).toContain('sgm-home');
    expect(menu).toContain('sgm-scroll-page');
    expect(menu).toContain('overflow-y-auto');
    expect(menu).toContain('min-h-0');
    expect(menu).not.toMatch(/className="relative flex min-h-screen flex-col items-center overflow-hidden/);
    expect(css).toContain('.sgm-home');
    expect(css).toMatch(/\.sgm-home\s*\{[^}]*overflow-y:\s*auto/);
    expect(css).toMatch(/safe-area-inset-bottom/);
  });

  it('title + tagline sit on an opaque theme-aware panel', () => {
    expect(menu).toContain('sgm-home-title-panel');
    expect(menu).toContain('SYNAPTIC GM');
    expect(menu).toContain('A dark fantasy world awaits your decisions.');
    expect(css).toContain('.sgm-home-title-panel');
    expect(css).toMatch(/html\[data-sgm-material='1'\] \.sgm-home-title-panel/);
    expect(css).toMatch(/\.sgm-home-title-panel[\s\S]*?background-image:\s*none/);
  });

  it('Active Save row is in the scrollable play tab', () => {
    expect(menu).toContain('sgm-home-active-save');
    expect(menu).toContain('Active Save:');
  });
});
