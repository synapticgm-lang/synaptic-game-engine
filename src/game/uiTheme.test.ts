import { describe, expect, it } from 'vitest';
import { shopItemById } from './cosmeticCatalog';
import {
  equippedSetLabel,
  equippedSetName,
  MATERIAL_THEME_KEYS,
  resolveThemeKitExtras,
  themeAtmosphereUrl,
  themeBySettingsId,
  themeFrameFiligreeUrl,
  themePanelTextureUrl,
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
    expect(theme.preview?.fontUi).toMatch(/Inter/i);
    expect(theme.preview?.fontUi).not.toMatch(/Special Elite/i);
    expect(theme.preview?.fontStory).toMatch(/Georgia/i);
    expect(theme.kit?.frameId).toBe('frame.ossuary');
    expect(theme.preview?.bg.toLowerCase()).toBe('#080706');
    expect(theme.preview?.panel.toLowerCase()).toBe('#1c1917');
    expect(themePanelTextureUrl(theme.themeKey)).toBe(
      '/themes/undead-ossuary/panel-ash.png',
    );
    expect(themeAtmosphereUrl(theme.themeKey)).toBe(
      '/themes/undead-ossuary/atmosphere.png',
    );
    expect(themeFrameFiligreeUrl(theme.themeKey)).toBe(
      '/themes/undead-ossuary/frame-filigree.png',
    );
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

  const RACE_KIT_IDS = [
    'theme.wood-elf-grove',
    'theme.dark-elf-umbrance',
    'theme.high-elf-spire',
    'theme.dwarf-forgehall',
    'theme.orc-warcamp',
    'theme.dragon-hoard',
    'theme.phoenix-ashrise',
    'theme.cyborg-chassis',
    'theme.angelic-radiance',
    'theme.infernal-pact',
    'theme.undead-ossuary',
    'theme.fae-glamour',
    'theme.goblin-scrapheap',
    'theme.merfolk-abyss',
    'theme.vampire-nocturne',
  ] as const;

  it('every race kit is a material system, not Integration teal', () => {
    const textures = new Set<string>();
    const frames = new Set<string>();
    for (const id of RACE_KIT_IDS) {
      const theme = themeBySettingsId(id);
      expect(theme.preview?.texture, id).toBeTruthy();
      expect(theme.preview?.texture, id).not.toBe('plain');
      expect(theme.preview?.frameStyle, id).toBeTruthy();
      expect(theme.preview?.frameStyle, id).not.toBe('plain');
      expect(theme.preview?.diceMaterial, id).toBeTruthy();
      expect(theme.kit?.fontId, id).toBeTruthy();
      expect(theme.kit?.diceId, id).toBeTruthy();
      expect(theme.kit?.frameId, id).toBeTruthy();
      expect(theme.preview?.accent.toLowerCase(), id).not.toBe('#22d3ee');
      expect(theme.preview?.accent.toLowerCase(), id).not.toBe('#2dd4bf');
      expect(theme.preview?.bg.toLowerCase(), id).not.toBe('#020617');
      expect(theme.preview?.panel.toLowerCase(), id).not.toBe('#0f172a');
      expect(theme.preview?.fontUi, id).toMatch(/Inter/i);
      textures.add(theme.preview!.texture!);
      frames.add(theme.preview!.frameStyle!);
    }
    expect(textures.size).toBe(RACE_KIT_IDS.length);
    expect(frames.size).toBe(RACE_KIT_IDS.length);
  });

  it('false-friend race pairs stay material-distinct', () => {
    const grove = themeBySettingsId('theme.wood-elf-grove');
    const warcamp = themeBySettingsId('theme.orc-warcamp');
    const scrap = themeBySettingsId('theme.goblin-scrapheap');
    const abyss = themeBySettingsId('theme.merfolk-abyss');
    const chassis = themeBySettingsId('theme.cyborg-chassis');
    expect(grove.preview?.texture).toBe('moss');
    expect(warcamp.preview?.texture).toBe('banner');
    expect(scrap.preview?.texture).toBe('scrap');
    expect(abyss.preview?.texture).toBe('tide');
    expect(chassis.preview?.texture).toBe('circuit');
    expect(warcamp.preview?.accent.toLowerCase()).not.toBe(scrap.preview?.accent.toLowerCase());
    expect(abyss.preview?.accent.toLowerCase()).not.toBe('#22d3ee');
    expect(chassis.preview?.accent.toLowerCase()).not.toBe('#22d3ee');
    expect(grove.preview?.bg.toLowerCase()).not.toBe(warcamp.preview?.bg.toLowerCase());
  });

  it('High Elf / Dragon / Dwarf keep display faces out of UI stacks', () => {
    const spire = themeBySettingsId('theme.high-elf-spire');
    const hoard = themeBySettingsId('theme.dragon-hoard');
    const dwarf = themeBySettingsId('theme.dwarf-forgehall');
    expect(spire.preview?.fontUi).not.toMatch(/Cinzel/i);
    expect(hoard.preview?.fontUi).not.toMatch(/Cinzel/i);
    expect(dwarf.preview?.fontUi).not.toMatch(/MedievalSharp/i);
    expect(spire.preview?.fontStory).not.toMatch(/Cinzel/i);
    expect(hoard.preview?.fontStory).not.toMatch(/Cinzel Decorative/i);
  });

  it('every race kit sets panel / atmosphere / frame AI texture URLs', () => {
    for (const id of RACE_KIT_IDS) {
      const theme = themeBySettingsId(id);
      const key = theme.themeKey!;
      const panel = themePanelTextureUrl(key);
      const atmosphere = themeAtmosphereUrl(key);
      const frame = themeFrameFiligreeUrl(key);
      expect(panel, id).toMatch(new RegExp(`^/themes/${key}/`));
      expect(atmosphere, id).toBe(`/themes/${key}/atmosphere.png`);
      expect(frame, id).toBe(`/themes/${key}/frame-filigree.png`);
      if (key === 'undead-ossuary') {
        expect(panel).toBe('/themes/undead-ossuary/panel-ash.png');
      } else {
        expect(panel).toBe(`/themes/${key}/panel.png`);
      }
    }
  });

  it('plain Integration stays without AI material URLs', () => {
    const plain = themeBySettingsId('theme.integration-blue');
    expect(themePanelTextureUrl(plain.themeKey)).toBeUndefined();
    expect(themeAtmosphereUrl(plain.themeKey)).toBeUndefined();
    expect(themeFrameFiligreeUrl(plain.themeKey)).toBeUndefined();
  });

  it('MATERIAL_THEME_KEYS covers all race kits plus mid/high material shop themes', () => {
    for (const id of RACE_KIT_IDS) {
      expect(MATERIAL_THEME_KEYS).toContain(themeBySettingsId(id).themeKey);
    }
    for (const key of [
      'neon-protocol',
      'parchment-ledger',
      'bone-reliquary',
      'phosphor-terminal',
      'noir-crimson',
      'glass-spire',
      'ember-depths',
    ]) {
      expect(MATERIAL_THEME_KEYS).toContain(key);
      expect(themePanelTextureUrl(key)).toBe(`/themes/${key}/panel.png`);
    }
    expect(MATERIAL_THEME_KEYS).not.toContain('integration-blue');
  });
});
