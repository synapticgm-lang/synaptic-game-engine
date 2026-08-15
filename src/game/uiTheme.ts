import type { ShopItem } from './cosmeticCatalog';
import { THEME_ITEMS, shopItemById } from './cosmeticCatalog';

export function themeBySettingsId(uiThemeId: string | undefined): ShopItem {
  const id = uiThemeId?.startsWith('theme.') ? uiThemeId : `theme.${uiThemeId ?? 'integration-blue'}`;
  return shopItemById(id) ?? THEME_ITEMS[0]!;
}

/** Apply theme CSS variables to :root for live preview / play. */
export function applyUiThemeToDocument(theme: ShopItem | null | undefined): void {
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
    return;
  }
  root.style.setProperty('--sgm-accent', p.accent);
  root.style.setProperty('--sgm-bg', p.bg);
  root.style.setProperty('--sgm-panel', p.panel);
  root.style.setProperty('--sgm-text', p.text);
  root.style.setProperty('--sgm-muted', p.muted);
  if (p.fontUi) root.style.setProperty('--sgm-font-ui', p.fontUi);
  if (p.fontStory) root.style.setProperty('--sgm-font-story', p.fontStory);
  root.dataset.sgmTheme = theme?.themeKey ?? 'integration-blue';
}
