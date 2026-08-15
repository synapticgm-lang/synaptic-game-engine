/**
 * Sellable cosmetic catalog (Pack 10). Display / entitlements only — never touches dice math.
 */

export type CosmeticSlot =
  | 'theme'
  | 'font'
  | 'dice'
  | 'voice'
  | 'frame'
  | 'systemWindow'
  | 'sfx'
  | 'bundle'
  | 'badge';

export interface ShopItem {
  id: string;
  slot: CosmeticSlot;
  name: string;
  blurb: string;
  priceGbp: string;
  priceUsd: string;
  /** Free / included without purchase */
  free?: boolean;
  /** Bundle contents (other item ids) */
  includes?: string[];
  /** Theme CSS token key */
  themeKey?: string;
  preview?: {
    accent: string;
    bg: string;
    panel: string;
    text: string;
    muted: string;
    fontUi?: string;
    fontStory?: string;
  };
}

export const SHOP_CATALOG: ShopItem[] = [
  // --- Themes ---
  {
    id: 'theme.integration-blue',
    slot: 'theme',
    name: 'Integration Blue',
    blurb: 'Default cold registrar panels — cyan on slate.',
    priceGbp: 'Free',
    priceUsd: 'Free',
    free: true,
    themeKey: 'integration-blue',
    preview: {
      accent: '#22d3ee',
      bg: '#020617',
      panel: '#0f172a',
      text: '#e2e8f0',
      muted: '#64748b',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'ui-serif, Georgia, serif',
    },
  },
  {
    id: 'theme.neon-protocol',
    slot: 'theme',
    name: 'Neon Protocol',
    blurb: 'Night-city neon, glitch edges, System-apocalypse chrome.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'neon-protocol',
    preview: {
      accent: '#f0abfc',
      bg: '#05010a',
      panel: '#1a0b2e',
      text: '#f5e1ff',
      muted: '#a78bfa',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'ui-sans-serif, system-ui, sans-serif',
    },
  },
  {
    id: 'theme.parchment-ledger',
    slot: 'theme',
    name: 'Parchment Ledger',
    blurb: 'Warm paper, ink rules, soft gold — journal LitRPG.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'parchment-ledger',
    preview: {
      accent: '#b45309',
      bg: '#1c1410',
      panel: '#2a2118',
      text: '#f5e6d3',
      muted: '#a8a29e',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, "Times New Roman", serif',
    },
  },
  {
    id: 'theme.bone-reliquary',
    slot: 'theme',
    name: 'Bone Reliquary',
    blurb: 'Ash, bone white, dried-blood accents — grimdark.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'bone-reliquary',
    preview: {
      accent: '#9f1239',
      bg: '#0c0a09',
      panel: '#1c1917',
      text: '#e7e5e4',
      muted: '#78716c',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.phosphor-terminal',
    slot: 'theme',
    name: 'Phosphor Terminal',
    blurb: 'Green phosphor on black, CRT scanline fantasy.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
    themeKey: 'phosphor-terminal',
    preview: {
      accent: '#4ade80',
      bg: '#000000',
      panel: '#052e16',
      text: '#bbf7d0',
      muted: '#166534',
      fontUi: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontStory: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
  },
  {
    id: 'theme.noir-crimson',
    slot: 'theme',
    name: 'Noir Crimson',
    blurb: 'High-contrast pulp noir with a single crimson accent.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'noir-crimson',
    preview: {
      accent: '#dc2626',
      bg: '#000000',
      panel: '#171717',
      text: '#fafafa',
      muted: '#737373',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.glass-spire',
    slot: 'theme',
    name: 'Glass Spire',
    blurb: 'Frosted glass, soft lilac and silver — premium clean.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'glass-spire',
    preview: {
      accent: '#c4b5fd',
      bg: '#0f0a1a',
      panel: '#1e1b4b',
      text: '#ede9fe',
      muted: '#8b5cf6',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'ui-serif, Georgia, serif',
    },
  },
  {
    id: 'theme.ember-depths',
    slot: 'theme',
    name: 'Ember Depths',
    blurb: 'Charcoal and ember orange — volcanic dungeon heat.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'ember-depths',
    preview: {
      accent: '#f97316',
      bg: '#0c0a09',
      panel: '#1c1917',
      text: '#ffedd5',
      muted: '#a8a29e',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },

  // --- Dice ---
  {
    id: 'dice.system-holo',
    slot: 'dice',
    name: 'System Holo',
    blurb: 'Cyan holographic etch. Cosmetic only — odds unchanged.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
  },
  {
    id: 'dice.bone-iron',
    slot: 'dice',
    name: 'Bone & Iron',
    blurb: 'Weathered bone faces, iron numerals.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
  },
  {
    id: 'dice.frost-crystal',
    slot: 'dice',
    name: 'Frost Crystal',
    blurb: 'Clear frosted glass polyhedral set.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
  },
  {
    id: 'dice.neon-edge',
    slot: 'dice',
    name: 'Neon Edge',
    blurb: 'Black dice with neon rim light.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
  },

  // --- Voices ---
  {
    id: 'voice.cold-registrar',
    slot: 'voice',
    name: 'Cold Registrar',
    blurb: 'Flat, precise System / Auditor voice.',
    priceGbp: '£4.99',
    priceUsd: '$4.99',
  },
  {
    id: 'voice.street-chronicler',
    slot: 'voice',
    name: 'Street Chronicler',
    blurb: 'Gritty urban Integration narrator.',
    priceGbp: '£4.99',
    priceUsd: '$4.99',
  },
  {
    id: 'voice.grizzled-mentor',
    slot: 'voice',
    name: 'Grizzled Mentor',
    blurb: 'Older advisor tone, dry humour.',
    priceGbp: '£4.99',
    priceUsd: '$4.99',
  },

  // --- Frames / System window ---
  {
    id: 'frame.glitch-static',
    slot: 'frame',
    name: 'Glitch Static',
    blurb: 'Turn-frame borders with static edges.',
    priceGbp: '£1.99',
    priceUsd: '$1.99',
  },
  {
    id: 'frame.ornate-brass',
    slot: 'frame',
    name: 'Ornate Brass',
    blurb: 'Brass fittings around each turn beat.',
    priceGbp: '£1.99',
    priceUsd: '$1.99',
  },
  {
    id: 'system.cold-registrar',
    slot: 'systemWindow',
    name: 'Cold Registrar Window',
    blurb: 'Blue-steel System panel skin.',
    priceGbp: '£1.99',
    priceUsd: '$1.99',
  },

  // --- SFX ---
  {
    id: 'sfx.rarity-stingers',
    slot: 'sfx',
    name: 'Rarity Stingers',
    blurb: 'Ascending fanfares Common → Legendary.',
    priceGbp: '£1.99',
    priceUsd: '$1.99',
  },

  // --- Fonts ---
  {
    id: 'font.cold-registrar',
    slot: 'font',
    name: 'Cold Registrar Type',
    blurb: 'Clinical UI + readable serif story pair.',
    priceGbp: '£1.99',
    priceUsd: '$1.99',
  },
  {
    id: 'font.terminal-grid',
    slot: 'font',
    name: 'Terminal Grid',
    blurb: 'Monospace log-file fantasy pair.',
    priceGbp: '£1.99',
    priceUsd: '$1.99',
  },

  // --- Badge ---
  {
    id: 'badge.supporter',
    slot: 'badge',
    name: 'Supporter Badge',
    blurb: 'Tip the GM — permanent flair. No gameplay effect.',
    priceGbp: '£4.99',
    priceUsd: '$4.99',
  },

  // --- Bundles ---
  {
    id: 'bundle.integration-starter',
    slot: 'bundle',
    name: 'Integration Starter',
    blurb: 'Neon Protocol + System Holo + Cold Registrar window + Glitch frame (~30% off).',
    priceGbp: '£7.99',
    priceUsd: '$9.99',
    includes: [
      'theme.neon-protocol',
      'dice.system-holo',
      'system.cold-registrar',
      'frame.glitch-static',
    ],
  },
  {
    id: 'bundle.ledger-scholar',
    slot: 'bundle',
    name: 'Ledger Scholar',
    blurb: 'Parchment Ledger + Registrar type + Brass dice + Carved window look.',
    priceGbp: '£7.99',
    priceUsd: '$9.99',
    includes: [
      'theme.parchment-ledger',
      'font.cold-registrar',
      'dice.bone-iron',
      'system.cold-registrar',
    ],
  },
];

export const THEME_ITEMS = SHOP_CATALOG.filter((i) => i.slot === 'theme');

export const SLOT_LABELS: Record<CosmeticSlot, string> = {
  theme: 'Themes',
  font: 'Fonts',
  dice: 'Dice',
  voice: 'Voices',
  frame: 'Turn frames',
  systemWindow: 'System windows',
  sfx: 'SFX',
  bundle: 'Bundles',
  badge: 'Support',
};

export function shopItemById(id: string): ShopItem | undefined {
  return SHOP_CATALOG.find((i) => i.id === id);
}
