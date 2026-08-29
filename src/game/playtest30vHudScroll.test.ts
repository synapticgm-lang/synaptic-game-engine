import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { equippedSetName } from './uiTheme';

const hud = readFileSync(resolve(__dirname, '../components/Hud.tsx'), 'utf8');
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
const settings = readFileSync(resolve(__dirname, '../components/SettingsModal.tsx'), 'utf8');
const library = readFileSync(resolve(__dirname, '../components/GMLibrary.tsx'), 'utf8');
const drawers = [
  readFileSync(resolve(__dirname, '../components/LeftDrawer.tsx'), 'utf8'),
  readFileSync(resolve(__dirname, '../components/RightDrawer.tsx'), 'utf8'),
];
const story = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

describe('playtest30v — site-wide scroll + HUD equipped-set tap', () => {
  it('stamp is 2026-08-30V / 30o and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30o').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-30V').toBe(true);
  });

  it('shared page + modal scroll classes exist; #root lock stays', () => {
    expect(css).toMatch(/html, body, #root \{[\s\S]*?overflow:\s*hidden/);
    expect(css).toContain('.sgm-scroll-page');
    expect(css).toContain('.sgm-modal-body');
    expect(css).toMatch(/\.sgm-modal-body\s*\{[^}]*min-height:\s*0/);
    expect(css).toMatch(/\.sgm-modal-body\s*\{[^}]*overflow-y:\s*auto/);
    expect(settings).toContain('sgm-modal-body');
    expect(library).toContain('sgm-modal-body');
  });

  it('play story panel stays opaque; drawers still slide off-screen when closed', () => {
    expect(story).toContain('.sgm-play-story-panel');
    expect(story).toMatch(/html\[data-sgm-material='1'\] \.sgm-play-story-panel/);
    expect(story).toContain(".sgm-mobile-drawer[data-open='false']");
    for (const src of drawers) {
      expect(src).toContain('sgm-mobile-drawer');
      expect(src).not.toMatch(/max-lg:w-0/);
    }
  });

  it('HUD left label is equipped set name and tap opens the full string', () => {
    expect(equippedSetName('theme.dark-elf-umbrance')).toBe('Dark Elf Umbrance');
    expect(hud).toContain('sgm-hud-set-name');
    expect(hud).toContain('sgm-hud-set-popover');
    expect(hud).toContain('setNameOpen');
    expect(hud).toContain('Equipped set');
    expect(hud).toContain('flex-col gap-1.5');
    expect(hud).not.toContain('max-w-[4.5rem]');
  });
});
