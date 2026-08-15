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

  // --- Race / archetype styles (folklore & sci-fi tropes; original pack names) ---
  {
    id: 'theme.wood-elf-grove',
    slot: 'theme',
    name: 'Wood Elf Grove',
    blurb: 'Moss, leaf-gold, soft canopy light — living forest UI.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'wood-elf-grove',
    preview: {
      accent: '#84cc16',
      bg: '#0a1308',
      panel: '#14532d',
      text: '#ecfccb',
      muted: '#86efac',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, "Palatino Linotype", serif',
    },
  },
  {
    id: 'theme.dark-elf-umbrance',
    slot: 'theme',
    name: 'Dark Elf Umbrance',
    blurb: 'Violet dusk, pale silver text — under-realm elegance.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'dark-elf-umbrance',
    preview: {
      accent: '#c084fc',
      bg: '#0b0614',
      panel: '#2e1065',
      text: '#f3e8ff',
      muted: '#a78bfa',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.high-elf-spire',
    slot: 'theme',
    name: 'High Elf Spire',
    blurb: 'Ivory, sky-gold, and crystalline blues — lofty court chrome.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'high-elf-spire',
    preview: {
      accent: '#fbbf24',
      bg: '#0c1222',
      panel: '#1e3a5f',
      text: '#fef3c7',
      muted: '#93c5fd',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, "Times New Roman", serif',
    },
  },
  {
    id: 'theme.dwarf-forgehall',
    slot: 'theme',
    name: 'Dwarf Forgehall',
    blurb: 'Deep stone, hammered brass, forge-glow — mountain hold UI.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'dwarf-forgehall',
    preview: {
      accent: '#d97706',
      bg: '#1c1917',
      panel: '#44403c',
      text: '#fef3c7',
      muted: '#a8a29e',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.orc-warcamp',
    slot: 'theme',
    name: 'Orc Warcamp',
    blurb: 'Iron green, blood-rust accents — hard camp banners.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'orc-warcamp',
    preview: {
      accent: '#65a30d',
      bg: '#0f140a',
      panel: '#365314',
      text: '#ecfccb',
      muted: '#a3e635',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'ui-sans-serif, system-ui, sans-serif',
    },
  },
  {
    id: 'theme.dragon-hoard',
    slot: 'theme',
    name: 'Dragon Hoard',
    blurb: 'Scale green and molten gold — wyrm-lair opulence.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'dragon-hoard',
    preview: {
      accent: '#eab308',
      bg: '#052e16',
      panel: '#14532d',
      text: '#fef9c3',
      muted: '#86efac',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.phoenix-ashrise',
    slot: 'theme',
    name: 'Phoenix Ashrise',
    blurb: 'Ember orange through rose-gold flame — rebirth chrome.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'phoenix-ashrise',
    preview: {
      accent: '#fb7185',
      bg: '#1c0a00',
      panel: '#7c2d12',
      text: '#fff7ed',
      muted: '#fdba74',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.cyborg-chassis',
    slot: 'theme',
    name: 'Cyborg Chassis',
    blurb: 'Gunmetal, optic cyan, hazard stripes — augmented chrome.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'cyborg-chassis',
    preview: {
      accent: '#22d3ee',
      bg: '#09090b',
      panel: '#27272a',
      text: '#e0f2fe',
      muted: '#94a3b8',
      fontUi: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontStory: 'ui-sans-serif, system-ui, sans-serif',
    },
  },
  {
    id: 'theme.angelic-radiance',
    slot: 'theme',
    name: 'Angelic Radiance',
    blurb: 'Soft gold light on white-marble panels — celestial calm.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'angelic-radiance',
    preview: {
      accent: '#fde68a',
      bg: '#1c1917',
      panel: '#44403c',
      text: '#fffbeb',
      muted: '#d6d3d1',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.infernal-pact',
    slot: 'theme',
    name: 'Infernal Pact',
    blurb: 'Deep crimson and sulfur — sealed-contract heat.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'infernal-pact',
    preview: {
      accent: '#ef4444',
      bg: '#1a0505',
      panel: '#450a0a',
      text: '#fecaca',
      muted: '#f87171',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.undead-ossuary',
    slot: 'theme',
    name: 'Undead Ossuary',
    blurb: 'Bone white on void black, cold teal accents — crypt UI.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'undead-ossuary',
    preview: {
      accent: '#2dd4bf',
      bg: '#09090b',
      panel: '#18181b',
      text: '#f4f4f5',
      muted: '#a1a1aa',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.fae-glamour',
    slot: 'theme',
    name: 'Fae Glamour',
    blurb: 'Iridescent pink-teal mist — court of twilight mischief.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'fae-glamour',
    preview: {
      accent: '#e879f9',
      bg: '#0f0520',
      panel: '#4a044e',
      text: '#fce7f3',
      muted: '#67e8f9',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.goblin-scrapheap',
    slot: 'theme',
    name: 'Goblin Scrapheap',
    blurb: 'Rusty olive and scrap-yellow — chaotic workshop vibes.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
    themeKey: 'goblin-scrapheap',
    preview: {
      accent: '#facc15',
      bg: '#1a1f0a',
      panel: '#3f6212',
      text: '#fef9c3',
      muted: '#a3e635',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'ui-sans-serif, system-ui, sans-serif',
    },
  },
  {
    id: 'theme.merfolk-abyss',
    slot: 'theme',
    name: 'Merfolk Abyss',
    blurb: 'Deep ocean teal and pearl — pressure and tide.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'merfolk-abyss',
    preview: {
      accent: '#2dd4bf',
      bg: '#042f2e',
      panel: '#134e4a',
      text: '#ccfbf1',
      muted: '#5eead4',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, serif',
    },
  },
  {
    id: 'theme.vampire-nocturne',
    slot: 'theme',
    name: 'Vampire Nocturne',
    blurb: 'Wine red on black velvet — aristocratic night.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'vampire-nocturne',
    preview: {
      accent: '#be123c',
      bg: '#0c0004',
      panel: '#3f0a1a',
      text: '#ffe4e6',
      muted: '#fb7185',
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
  {
    id: 'bundle.ancestry-sampler',
    slot: 'bundle',
    name: 'Ancestry Sampler',
    blurb: 'Wood Elf Grove + Dark Elf Umbrance + Dwarf Forgehall + Dragon Hoard (~value pack).',
    priceGbp: '£9.99',
    priceUsd: '$12.99',
    includes: [
      'theme.wood-elf-grove',
      'theme.dark-elf-umbrance',
      'theme.dwarf-forgehall',
      'theme.dragon-hoard',
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
