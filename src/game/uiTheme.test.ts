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

  it('Vampire Nocturne is velvet/moonlight, not flat maroon or Integration cyan', () => {
    const vampire = themeBySettingsId('theme.vampire-nocturne');
    expect(vampire.preview?.texture).toBe('velvet');
    expect(vampire.preview?.frameStyle).toBe('velvet');
    expect(vampire.preview?.accent.toLowerCase()).toBe('#8d2746');
    expect(vampire.preview?.bg.toLowerCase()).toBe('#171018');
    expect(vampire.preview?.panel.toLowerCase()).toBe('#22131f');
    expect(vampire.preview?.accent.toLowerCase()).not.toBe('#22d3ee');
    expect(vampire.preview?.accent.toLowerCase()).not.toBe('#be123c');
    expect(vampire.preview?.fontUi).toMatch(/Inter/i);
    expect(vampire.preview?.fontStory).toMatch(/Playfair/i);
    expect(vampire.preview?.fontUi).not.toMatch(/Grenze/i);
    expect(vampire.kit?.diceId).toBe('dice.nocturne');
    const dice = shopItemById('dice.nocturne');
    expect(dice?.diceSkin?.material).toBe('velvet');
    expect(dice?.diceSkin?.face?.toLowerCase()).toBe('#171018');
    expect(dice?.diceSkin?.accent?.toLowerCase()).toBe('#8d2746');
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

  it('Infernal and Noir stay false-friend distinct from Vampire wine velvet', () => {
    const vampire = themeBySettingsId('theme.vampire-nocturne');
    const infernal = themeBySettingsId('theme.infernal-pact');
    const noir = themeBySettingsId('theme.noir-crimson');
    expect(infernal.preview?.texture).toBe('sulfur');
    expect(noir.preview?.texture).toBe('noir');
    expect(vampire.preview?.texture).toBe('velvet');
    expect(infernal.preview?.accent.toLowerCase()).toBe('#f59e0b');
    expect(noir.preview?.bg.toLowerCase()).toBe('#050505');
    expect(new Set([vampire.preview?.texture, infernal.preview?.texture, noir.preview?.texture]).size).toBe(3);
  });
});
