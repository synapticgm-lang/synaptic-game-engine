import { describe, expect, it } from 'vitest';
import { shopItemById } from './cosmeticCatalog';
import { equippedSetLabel, equippedSetName, themeBySettingsId } from './uiTheme';

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
