import { describe, expect, it } from 'vitest';
import { shopItemById } from './cosmeticCatalog';
import {
  equippedSetLabel,
  equippedSetName,
  resolveThemeKitExtras,
  themeBySettingsId,
} from './uiTheme';

describe('equipped set live label', () => {
  it('uses the Vampire Nocturne Shop name, not a silent codename', () => {
    const item = shopItemById('theme.vampire-nocturne');
    expect(item?.id).toBe('theme.vampire-nocturne');
    expect(item?.name).toBe('Vampire Nocturne');
    expect(item?.name).toMatch(/vampire/i);
    expect(equippedSetName('theme.vampire-nocturne')).toBe('Vampire Nocturne');
    expect(equippedSetLabel('theme.vampire-nocturne')).toBe('equipped set: Vampire Nocturne');
    expect(equippedSetLabel('vampire-nocturne')).toBe('equipped set: Vampire Nocturne');
    expect(themeBySettingsId('theme.vampire-nocturne').name).toBe(
      shopItemById('theme.vampire-nocturne')?.name,
    );
  });
});

describe('premium kit tokens', () => {
  it('Undead Ossuary is bone/moonlight, not Integration teal', () => {
    const theme = themeBySettingsId('theme.undead-ossuary');
    expect(theme.name).toBe('Undead Ossuary');
    expect(theme.preview?.accent.toLowerCase()).not.toBe('#22d3ee');
    expect(theme.preview?.accent.toLowerCase()).not.toBe('#2dd4bf');
    expect(theme.preview?.texture).toBe('bone');
    expect(theme.preview?.frameStyle).toBe('bone');
    expect(theme.preview?.fontUi).toMatch(/Special Elite/i);
    expect(theme.kit?.frameId).toBe('frame.ossuary');
  });

  it('heals Integration default font/frame when a race kit theme is equipped', () => {
    const extras = resolveThemeKitExtras({
      uiThemeId: 'theme.undead-ossuary',
      fontPackId: 'font.cold-registrar',
      diceCosmeticId: 'dice.system-holo',
      turnFrameCosmeticId: 'frame.glitch-static',
    });
    expect(extras.font?.id).toBe('font.ossuary');
    expect(extras.dice?.id).toBe('dice.ossuary');
    expect(extras.frame?.id).toBe('frame.ossuary');
    expect(extras.frame?.frameSkin?.style).toBe('bone');
  });

  it('keeps an explicit Customize pick over the kit default', () => {
    const extras = resolveThemeKitExtras({
      uiThemeId: 'theme.undead-ossuary',
      fontPackId: 'font.nocturne',
      diceCosmeticId: 'dice.nocturne',
      turnFrameCosmeticId: 'frame.nocturne',
    });
    expect(extras.font?.id).toBe('font.nocturne');
    expect(extras.frame?.frameSkin?.style).toBe('velvet');
  });

  it('Vampire and Dwarf stay material-distinct from Undead', () => {
    const vampire = themeBySettingsId('theme.vampire-nocturne');
    const dwarf = themeBySettingsId('theme.dwarf-forgehall');
    const undead = themeBySettingsId('theme.undead-ossuary');
    expect(vampire.preview?.texture).toBe('velvet');
    expect(vampire.preview?.frameStyle).toBe('velvet');
    expect(dwarf.preview?.texture).toBe('soot');
    expect(dwarf.preview?.frameStyle).toBe('rune');
    expect(new Set([vampire.preview?.accent, dwarf.preview?.accent, undead.preview?.accent]).size).toBe(3);
  });
});
