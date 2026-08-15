import type { ShopItem } from './cosmeticCatalog';
import { THEME_ITEMS, shopItemById } from './cosmeticCatalog';

export function themeBySettingsId(uiThemeId: string | undefined): ShopItem {
  const id = uiThemeId?.startsWith('theme.') ? uiThemeId : `theme.${uiThemeId ?? 'integration-blue'}`;
  return shopItemById(id) ?? THEME_ITEMS[0]!;
}

/** Apply theme + optional font/dice kit CSS variables to :root. */
export function applyUiThemeToDocument(
  theme: ShopItem | null | undefined,
  extras?: { font?: ShopItem | null; dice?: ShopItem | null },
): void {
  const p = theme?.preview;
  const root = document.documentElement;
  if (!p) {
    root.style.removeProperty('--sgm-accent');
    root.style.removeProperty('--sgm-bg');
    root.style.removeProperty('--sgm-panel');
    root.style.removeProperty('--sgm-text');
    root.style.removeProperty('--sgm-muted');
    root.style.removeProperty('--sgm-font-ui');
    root.style.removeProperty('--sgm-font-story');
    root.style.removeProperty('--sgm-dice-accent');
    root.style.removeProperty('--sgm-dice-face');
    return;
  }
  root.style.setProperty('--sgm-accent', p.accent);
  root.style.setProperty('--sgm-bg', p.bg);
  root.style.setProperty('--sgm-panel', p.panel);
  root.style.setProperty('--sgm-text', p.text);
  root.style.setProperty('--sgm-muted', p.muted);
  const fontUi = extras?.font?.preview?.fontUi ?? p.fontUi;
  const fontStory = extras?.font?.preview?.fontStory ?? p.fontStory;
  if (fontUi) root.style.setProperty('--sgm-font-ui', fontUi);
  if (fontStory) root.style.setProperty('--sgm-font-story', fontStory);
  const diceAccent = extras?.dice?.diceSkin?.accent ?? p.accent;
  const diceFace = extras?.dice?.diceSkin?.face ?? p.panel;
  root.style.setProperty('--sgm-dice-accent', diceAccent);
  root.style.setProperty('--sgm-dice-face', diceFace);
  root.dataset.sgmTheme = theme?.themeKey ?? 'integration-blue';
}

export function applySettingsCosmetics(settings: {
  uiThemeId?: string;
  fontPackId?: string;
  diceCosmeticId?: string;
}): void {
  applyUiThemeToDocument(themeBySettingsId(settings.uiThemeId), {
    font: shopItemById(settings.fontPackId ?? ''),
    dice: shopItemById(settings.diceCosmeticId ?? ''),
  });
}
