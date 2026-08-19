import type { ShopItem } from './cosmeticCatalog';
import { SHOP_CATALOG, THEME_ITEMS, shopItemById } from './cosmeticCatalog';

const GOOGLE_FONT_QUERY: Record<string, string> = {
  Inter: 'Inter:wght@400;500;600',
  Cinzel: 'Cinzel:wght@400;600;700',
  'Cinzel Decorative': 'Cinzel+Decorative:wght@700',
  'Cormorant Garamond': 'Cormorant+Garamond:wght@400;600',
  'Crimson Pro': 'Crimson+Pro:wght@400;600',
  'Grenze Gotisch': 'Grenze+Gotisch:wght@400;600',
  'Libre Baskerville': 'Libre+Baskerville:wght@400;700',
  MedievalSharp: 'MedievalSharp',
  Orbitron: 'Orbitron:wght@500;700',
  'Playfair Display': 'Playfair+Display:wght@400;600',
  'Special Elite': 'Special+Elite',
  Spectral: 'Spectral:wght@400;600',
};

/** Integration defaults — when a race kit theme is equipped, these mean "never customized". */
export const INTEGRATION_COSMETIC_DEFAULTS = {
  fontPackId: 'font.cold-registrar',
  diceCosmeticId: 'dice.system-holo',
  turnFrameCosmeticId: 'frame.glitch-static',
  voicePackId: 'voice.cold-registrar',
} as const;

const loadedGoogleFonts = new Set<string>(['Inter', 'Cinzel']);

function fontNamesFromStack(stack: string | undefined): string[] {
  if (!stack) return [];
  const names = new Set<string>();
  for (const m of stack.matchAll(/"([^"]+)"/g)) names.add(m[1]);
  for (const part of stack.split(',')) {
    const bare = part.trim().replace(/^["']|["']$/g, '');
    if (GOOGLE_FONT_QUERY[bare]) names.add(bare);
  }
  return [...names];
}

export function ensureGoogleFonts(...stacks: (string | undefined)[]): void {
  if (typeof document === 'undefined') return;
  const pending = new Set<string>();
  for (const stack of stacks) {
    for (const name of fontNamesFromStack(stack)) {
      if (GOOGLE_FONT_QUERY[name] && !loadedGoogleFonts.has(name)) pending.add(name);
    }
  }
  if (pending.size === 0) return;
  const families = [...pending];
  for (const name of families) loadedGoogleFonts.add(name);
  const href = `https://fonts.googleapis.com/css2?${families.map((n) => `family=${GOOGLE_FONT_QUERY[n]}`).join('&')}&display=swap`;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/** Shop / Themes previews — load catalog typefaces only when that hub is open. */
export function ensureCatalogPreviewFonts(): void {
  const stacks: string[] = [];
  for (const item of SHOP_CATALOG) {
    if (item.preview?.fontUi) stacks.push(item.preview.fontUi);
    if (item.preview?.fontStory) stacks.push(item.preview.fontStory);
  }
  ensureGoogleFonts(...stacks);
}

export function themeBySettingsId(uiThemeId: string | undefined): ShopItem {
  const id = uiThemeId?.startsWith('theme.') ? uiThemeId : `theme.${uiThemeId ?? 'integration-blue'}`;
  return shopItemById(id) ?? THEME_ITEMS[0]!;
}

/** Shop catalog name for the equipped theme — same string in Shop, Themes, and play chrome. */
export function equippedSetName(uiThemeId: string | undefined): string {
  return themeBySettingsId(uiThemeId).name;
}

export function equippedSetLabel(uiThemeId: string | undefined): string {
  return `equipped set: ${equippedSetName(uiThemeId)}`;
}

/**
 * Prefer kit parts when a race/material set is equipped but Customize still sits on
 * Integration defaults (theme-only equip / old saves). Explicit Customize picks still win.
 */
export function resolveThemeKitExtras(settings: {
  uiThemeId?: string;
  fontPackId?: string;
  diceCosmeticId?: string;
  turnFrameCosmeticId?: string;
}): { font?: ShopItem | null; dice?: ShopItem | null; frame?: ShopItem | null } {
  const theme = themeBySettingsId(settings.uiThemeId);
  const kit = theme.kit;

  const resolve = (
    savedId: string | undefined,
    kitId: string | undefined,
    integrationDefault: string,
  ): ShopItem | null | undefined => {
    if (kit && kitId && (!savedId || savedId === integrationDefault || savedId === kitId)) {
      return shopItemById(kitId);
    }
    return savedId ? shopItemById(savedId) : null;
  };

  return {
    font: resolve(settings.fontPackId, kit?.fontId, INTEGRATION_COSMETIC_DEFAULTS.fontPackId),
    dice: resolve(settings.diceCosmeticId, kit?.diceId, INTEGRATION_COSMETIC_DEFAULTS.diceCosmeticId),
    frame: resolve(
      settings.turnFrameCosmeticId,
      kit?.frameId,
      INTEGRATION_COSMETIC_DEFAULTS.turnFrameCosmeticId,
    ),
  };
}

/** Apply theme + optional font/dice/frame kit CSS variables to :root. */
export function applyUiThemeToDocument(
  theme: ShopItem | null | undefined,
  extras?: { font?: ShopItem | null; dice?: ShopItem | null; frame?: ShopItem | null },
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
    delete root.dataset.sgmFrame;
    delete root.dataset.sgmDice;
    delete root.dataset.sgmTexture;
    delete root.dataset.sgmTheme;
    return;
  }
  root.style.setProperty('--sgm-accent', p.accent);
  root.style.setProperty('--sgm-bg', p.bg);
  root.style.setProperty('--sgm-panel', p.panel);
  root.style.setProperty('--sgm-text', p.text);
  root.style.setProperty('--sgm-muted', p.muted);
  const fontUi = extras?.font?.preview?.fontUi ?? p.fontUi;
  const fontStory = extras?.font?.preview?.fontStory ?? p.fontStory;
  const displayStack =
    theme?.themeKey === 'vampire-nocturne'
      ? '"Grenze Gotisch", "Playfair Display", Georgia, serif'
      : undefined;
  ensureGoogleFonts(fontUi, fontStory, displayStack);
  if (fontUi) root.style.setProperty('--sgm-font-ui', fontUi);
  if (fontStory) root.style.setProperty('--sgm-font-story', fontStory);
  const diceAccent = extras?.dice?.diceSkin?.accent ?? p.accent;
  const diceFace = extras?.dice?.diceSkin?.face ?? p.panel;
  root.style.setProperty('--sgm-dice-accent', diceAccent);
  root.style.setProperty('--sgm-dice-face', diceFace);
  root.dataset.sgmTheme = theme?.themeKey ?? 'integration-blue';
  root.dataset.sgmFrame =
    extras?.frame?.frameSkin?.style ?? p.frameStyle ?? 'plain';
  root.dataset.sgmTexture = p.texture ?? 'plain';
  const diceMaterial = extras?.dice?.diceSkin?.material ?? p.diceMaterial;
  if (diceMaterial) root.dataset.sgmDice = diceMaterial;
  else delete root.dataset.sgmDice;
}

export function applySettingsCosmetics(settings: {
  uiThemeId?: string;
  fontPackId?: string;
  diceCosmeticId?: string;
  turnFrameCosmeticId?: string;
}): void {
  applyUiThemeToDocument(themeBySettingsId(settings.uiThemeId), resolveThemeKitExtras(settings));
}
