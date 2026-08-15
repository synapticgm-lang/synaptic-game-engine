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
  /** When this theme is selected, also apply these cosmetics. */
  kit?: { fontId: string; diceId: string; voiceId: string; frameId: string };
  /** TTS flavour — pitch/rate always apply; voiceHint matches a browser voice name if present. */
  tts?: { rate: number; pitch: number; voiceHint: string };
  /** Dice tray tint. Cosmetic only — odds unchanged. */
  diceSkin?: { accent: string; face: string };
  /** Turn-card border style id (CSS `data-sgm-frame`). */
  frameSkin?: { style: string };
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
    diceSkin: { accent: '#22d3ee', face: '#0e7490' },
  },
  {
    id: 'dice.bone-iron',
    slot: 'dice',
    name: 'Bone & Iron',
    blurb: 'Weathered bone faces, iron numerals.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
    diceSkin: { accent: '#d6d3d1', face: '#78716c' },
  },
  {
    id: 'dice.frost-crystal',
    slot: 'dice',
    name: 'Frost Crystal',
    blurb: 'Clear frosted glass polyhedral set.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    diceSkin: { accent: '#7dd3fc', face: '#0369a1' },
  },
  {
    id: 'dice.neon-edge',
    slot: 'dice',
    name: 'Neon Edge',
    blurb: 'Black dice with neon rim light.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
    diceSkin: { accent: '#f0abfc', face: '#a21caf' },
  },

  // --- Voices ---
  {
    id: 'voice.cold-registrar',
    slot: 'voice',
    name: 'Cold Registrar',
    blurb: 'Flat, precise System / Auditor voice.',
    priceGbp: '£4.99',
    priceUsd: '$4.99',
    tts: { rate: 0.95, pitch: 0.85, voiceHint: 'david' },
  },
  {
    id: 'voice.street-chronicler',
    slot: 'voice',
    name: 'Street Chronicler',
    blurb: 'Gritty urban Integration narrator.',
    priceGbp: '£4.99',
    priceUsd: '$4.99',
    tts: { rate: 1.02, pitch: 0.92, voiceHint: 'mark' },
  },
  {
    id: 'voice.grizzled-mentor',
    slot: 'voice',
    name: 'Grizzled Mentor',
    blurb: 'Older advisor tone, dry humour.',
    priceGbp: '£4.99',
    priceUsd: '$4.99',
    tts: { rate: 0.88, pitch: 0.78, voiceHint: 'daniel' },
  },

  // --- Frames / System window ---
  {
    id: 'frame.glitch-static',
    slot: 'frame',
    name: 'Glitch Static',
    blurb: 'Turn-frame borders with static edges.',
    priceGbp: '£1.99',
    priceUsd: '$1.99',
    frameSkin: { style: 'glitch' },
  },
  {
    id: 'frame.ornate-brass',
    slot: 'frame',
    name: 'Ornate Brass',
    blurb: 'Brass fittings around each turn beat.',
    priceGbp: '£1.99',
    priceUsd: '$1.99',
    frameSkin: { style: 'brass' },
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
    id: 'font.terminal-grid',
    slot: 'font',
    name: 'Terminal Grid',
    blurb: 'Monospace log-file fantasy pair.',
    priceGbp: '£1.99',
    priceUsd: '$1.99',
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
    blurb: 'Wood Elf, Dark Elf, Dwarf, and Dragon themes — each packs a matching font, dice skin, narrator voice, and turn frame.',
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

type RaceKitDef = {
  themeId: string;
  slug: string;
  fontName: string;
  fontBlurb: string;
  fontUi: string;
  fontStory: string;
  diceName: string;
  diceBlurb: string;
  diceAccent: string;
  diceFace: string;
  voiceName: string;
  voiceBlurb: string;
  tts: { rate: number; pitch: number; voiceHint: string };
};

const RACE_THEME_KITS: RaceKitDef[] = [
  {
    themeId: 'theme.wood-elf-grove',
    slug: 'grove',
    fontName: 'Canopy Serif',
    fontBlurb: 'Leaf-gold story serif with a soft UI sans.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Georgia, "Palatino Linotype", Palatino, serif',
    diceName: 'Amber Leaf',
    diceBlurb: 'Moss-and-amber polyhedrals. Odds unchanged.',
    diceAccent: '#84cc16',
    diceFace: '#3f6212',
    voiceName: 'Grove Whisper',
    voiceBlurb: 'Soft canopy narrator — unhurried, close.',
    tts: { rate: 0.92, pitch: 1.08, voiceHint: 'zira' },
  },
  {
    themeId: 'theme.dark-elf-umbrance',
    slug: 'umbrance',
    fontName: 'Umbrance Serif',
    fontBlurb: 'Pale court serif on dusk panels.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Palatino Linotype", Palatino, Georgia, serif',
    diceName: 'Violet Obsidian',
    diceBlurb: 'Dark glass with violet rims. Odds unchanged.',
    diceAccent: '#c084fc',
    diceFace: '#6b21a8',
    voiceName: 'Under-Realm',
    voiceBlurb: 'Low, measured dusk voice.',
    tts: { rate: 0.88, pitch: 0.82, voiceHint: 'hazel' },
  },
  {
    themeId: 'theme.high-elf-spire',
    slug: 'spire',
    fontName: 'Ivory Court',
    fontBlurb: 'Formal Times pair for lofty chrome.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Times New Roman", Times, Georgia, serif',
    diceName: 'Sky Gold',
    diceBlurb: 'Ivory faces, gold numerals. Odds unchanged.',
    diceAccent: '#fbbf24',
    diceFace: '#b45309',
    voiceName: 'Lofty Court',
    voiceBlurb: 'Precise, slightly lifted court diction.',
    tts: { rate: 0.96, pitch: 1.05, voiceHint: 'samantha' },
  },
  {
    themeId: 'theme.dwarf-forgehall',
    slug: 'forgehall',
    fontName: 'Rune Stone',
    fontBlurb: 'Heavy serif for mountain holds.',
    fontUi: 'Georgia, "Palatino Linotype", serif',
    fontStory: 'Georgia, "Palatino Linotype", serif',
    diceName: 'Hammered Brass',
    diceBlurb: 'Brass faces, soot numerals. Odds unchanged.',
    diceAccent: '#d97706',
    diceFace: '#78350f',
    voiceName: 'Forge Deep',
    voiceBlurb: 'Low hall voice, unhurried.',
    tts: { rate: 0.84, pitch: 0.72, voiceHint: 'david' },
  },
  {
    themeId: 'theme.orc-warcamp',
    slug: 'warcamp',
    fontName: 'War Banner',
    fontBlurb: 'Hard sans for camp orders.',
    fontUi: 'Arial Black, Impact, sans-serif',
    fontStory: 'ui-sans-serif, system-ui, sans-serif',
    diceName: 'Blood Iron',
    diceBlurb: 'Pitted iron, rust-green rims. Odds unchanged.',
    diceAccent: '#65a30d',
    diceFace: '#3f6212',
    voiceName: 'Warcamp',
    voiceBlurb: 'Rough, short-breathed camp bark.',
    tts: { rate: 1.02, pitch: 0.76, voiceHint: 'mark' },
  },
  {
    themeId: 'theme.dragon-hoard',
    slug: 'hoard',
    fontName: 'Wyrm Gold',
    fontBlurb: 'Gilded serif for lair ledgers.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Georgia, "Times New Roman", serif',
    diceName: 'Molten Scale',
    diceBlurb: 'Scale-green faces, gold pips. Odds unchanged.',
    diceAccent: '#eab308',
    diceFace: '#854d0e',
    voiceName: 'Hoard Rumble',
    voiceBlurb: 'Deep, slow wyrm diction.',
    tts: { rate: 0.8, pitch: 0.68, voiceHint: 'daniel' },
  },
  {
    themeId: 'theme.phoenix-ashrise',
    slug: 'ashrise',
    fontName: 'Ember Script',
    fontBlurb: 'Warm serif through rose-gold flame.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Georgia, Palatino, serif',
    diceName: 'Ash Flame',
    diceBlurb: 'Char faces, ember rims. Odds unchanged.',
    diceAccent: '#fb7185',
    diceFace: '#9f1239',
    voiceName: 'Ashrise',
    voiceBlurb: 'Warm mid voice, a little brighter.',
    tts: { rate: 0.97, pitch: 1.06, voiceHint: 'zira' },
  },
  {
    themeId: 'theme.cyborg-chassis',
    slug: 'chassis',
    fontName: 'Optic Mono',
    fontBlurb: 'Monospace HUD + clean sans story.',
    fontUi: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontStory: 'ui-sans-serif, system-ui, sans-serif',
    diceName: 'Hazard Cyan',
    diceBlurb: 'Gunmetal dice, optic-cyan edge. Odds unchanged.',
    diceAccent: '#22d3ee',
    diceFace: '#155e75',
    voiceName: 'Chassis Synth',
    voiceBlurb: 'Flat, slightly fast augmented tone.',
    tts: { rate: 1.06, pitch: 0.88, voiceHint: 'google' },
  },
  {
    themeId: 'theme.angelic-radiance',
    slug: 'radiance',
    fontName: 'Marble Serif',
    fontBlurb: 'Garamond-like calm for marble panels.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Georgia, Garamond, "Times New Roman", serif',
    diceName: 'Halo Gold',
    diceBlurb: 'Pale gold polyhedrals. Odds unchanged.',
    diceAccent: '#fde68a',
    diceFace: '#ca8a04',
    voiceName: 'Radiance',
    voiceBlurb: 'Soft, lifted celestial diction.',
    tts: { rate: 0.93, pitch: 1.12, voiceHint: 'samantha' },
  },
  {
    themeId: 'theme.infernal-pact',
    slug: 'pact',
    fontName: 'Sulfur Serif',
    fontBlurb: 'Heat-stained serif for sealed contracts.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Georgia, "Times New Roman", serif',
    diceName: 'Sulfur Bone',
    diceBlurb: 'Bone faces, sulfur-red rims. Odds unchanged.',
    diceAccent: '#ef4444',
    diceFace: '#7f1d1d',
    voiceName: 'Pact Heat',
    voiceBlurb: 'Low, slow sealed-contract voice.',
    tts: { rate: 0.86, pitch: 0.74, voiceHint: 'david' },
  },
  {
    themeId: 'theme.undead-ossuary',
    slug: 'ossuary',
    fontName: 'Crypt Serif',
    fontBlurb: 'Cold Times pair for bone-white text.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Times New Roman", Times, Georgia, serif',
    diceName: 'Bone Teal',
    diceBlurb: 'Ivory dice, crypt-teal edge. Odds unchanged.',
    diceAccent: '#2dd4bf',
    diceFace: '#115e59',
    voiceName: 'Ossuary',
    voiceBlurb: 'Whispered, low crypt tone.',
    tts: { rate: 0.82, pitch: 0.7, voiceHint: 'hazel' },
  },
  {
    themeId: 'theme.fae-glamour',
    slug: 'glamour',
    fontName: 'Twilight Serif',
    fontBlurb: 'Iridescent Palatino for court mischief.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Palatino Linotype", Palatino, Georgia, serif',
    diceName: 'Iridescent',
    diceBlurb: 'Pink-teal shimmer faces. Odds unchanged.',
    diceAccent: '#e879f9',
    diceFace: '#a21caf',
    voiceName: 'Glamour',
    voiceBlurb: 'Playful, slightly lifted twilight voice.',
    tts: { rate: 1.04, pitch: 1.14, voiceHint: 'zira' },
  },
  {
    themeId: 'theme.goblin-scrapheap',
    slug: 'scrapheap',
    fontName: 'Scrap Sans',
    fontBlurb: 'Workshop sans — loud labels, messy logs.',
    fontUi: 'Trebuchet MS, Verdana, sans-serif',
    fontStory: 'Trebuchet MS, Verdana, sans-serif',
    diceName: 'Scrap Yellow',
    diceBlurb: 'Rusty olive dice, scrap-yellow pips. Odds unchanged.',
    diceAccent: '#facc15',
    diceFace: '#854d0e',
    voiceName: 'Scrap Cackle',
    voiceBlurb: 'Faster, brighter workshop bark.',
    tts: { rate: 1.1, pitch: 1.16, voiceHint: 'zira' },
  },
  {
    themeId: 'theme.merfolk-abyss',
    slug: 'abyss',
    fontName: 'Tide Serif',
    fontBlurb: 'Pearl serif under pressure.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Georgia, Palatino, serif',
    diceName: 'Pearl Teal',
    diceBlurb: 'Tide-glass dice. Odds unchanged.',
    diceAccent: '#2dd4bf',
    diceFace: '#115e59',
    voiceName: 'Abyss Tide',
    voiceBlurb: 'Slow, resonant deep-water diction.',
    tts: { rate: 0.86, pitch: 0.8, voiceHint: 'daniel' },
  },
  {
    themeId: 'theme.vampire-nocturne',
    slug: 'nocturne',
    fontName: 'Velvet Serif',
    fontBlurb: 'Wine-dark Times for aristocratic night.',
    fontUi: 'ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Times New Roman", Georgia, serif',
    diceName: 'Wine Obsidian',
    diceBlurb: 'Black velvet dice, wine-red rims. Odds unchanged.',
    diceAccent: '#be123c',
    diceFace: '#881337',
    voiceName: 'Nocturne',
    voiceBlurb: 'Low, measured night-court voice.',
    tts: { rate: 0.87, pitch: 0.76, voiceHint: 'david' },
  },
];

const RACE_FRAMES: Record<string, { name: string; blurb: string; style: string }> = {
  grove: { name: 'Vine Lattice', blurb: 'Living vine corners on each turn beat.', style: 'vine' },
  umbrance: { name: 'Obsidian Filigree', blurb: 'Dark-glass corners, violet inlay.', style: 'filigree' },
  spire: { name: 'Ivory Arch', blurb: 'Crystal-gold arches around the beat.', style: 'ivory' },
  forgehall: { name: 'Rune Brass', blurb: 'Hammered brass with rune corners.', style: 'rune' },
  warcamp: { name: 'Iron Spike', blurb: 'Hard iron border, camp-banner corners.', style: 'iron' },
  hoard: { name: 'Scale Gold', blurb: 'Overlapping scale rim, molten corners.', style: 'scale' },
  ashrise: { name: 'Ember Filigree', blurb: 'Char-and-flame corners on each beat.', style: 'ember' },
  chassis: { name: 'Circuit Bezel', blurb: 'Optic-cyan HUD bezel.', style: 'circuit' },
  radiance: { name: 'Halo Arch', blurb: 'Soft gold halo around the beat.', style: 'halo' },
  pact: { name: 'Sulfur Seal', blurb: 'Heat-stained contract frame.', style: 'sulfur' },
  ossuary: { name: 'Bone Inlay', blurb: 'Ivory corners on crypt teal.', style: 'bone' },
  glamour: { name: 'Twilight Filigree', blurb: 'Iridescent court frame.', style: 'twilight' },
  scrapheap: { name: 'Scrap Weld', blurb: 'Welded scrap corners.', style: 'scrap' },
  abyss: { name: 'Pearl Tide', blurb: 'Tide-glass rim, pearl corners.', style: 'tide' },
  nocturne: { name: 'Velvet Arch', blurb: 'Wine-dark velvet frame.', style: 'velvet' },
};

function attachRaceThemeKits(): void {
  for (const def of RACE_THEME_KITS) {
    const fontId = `font.${def.slug}`;
    const diceId = `dice.${def.slug}`;
    const voiceId = `voice.${def.slug}`;
    const frameId = `frame.${def.slug}`;
    const frame = RACE_FRAMES[def.slug];
    const theme = SHOP_CATALOG.find((i) => i.id === def.themeId);
    if (theme?.preview) {
      theme.preview.fontUi = def.fontUi;
      theme.preview.fontStory = def.fontStory;
      theme.kit = { fontId, diceId, voiceId, frameId };
      theme.includes = [fontId, diceId, voiceId, frameId];
      theme.blurb = `${theme.blurb} Includes matching font, dice, voice, and turn frame.`;
    }
    SHOP_CATALOG.push(
      {
        id: fontId,
        slot: 'font',
        name: def.fontName,
        blurb: def.fontBlurb,
        priceGbp: '£1.99',
        priceUsd: '$1.99',
        preview: {
          accent: def.diceAccent,
          bg: theme?.preview?.bg ?? '#020617',
          panel: theme?.preview?.panel ?? '#0f172a',
          text: theme?.preview?.text ?? '#e2e8f0',
          muted: theme?.preview?.muted ?? '#64748b',
          fontUi: def.fontUi,
          fontStory: def.fontStory,
        },
      },
      {
        id: diceId,
        slot: 'dice',
        name: def.diceName,
        blurb: def.diceBlurb,
        priceGbp: '£2.99',
        priceUsd: '$2.99',
        diceSkin: { accent: def.diceAccent, face: def.diceFace },
      },
      {
        id: voiceId,
        slot: 'voice',
        name: def.voiceName,
        blurb: def.voiceBlurb,
        priceGbp: '£4.99',
        priceUsd: '$4.99',
        tts: def.tts,
      },
      {
        id: frameId,
        slot: 'frame',
        name: frame?.name ?? `${def.slug} Frame`,
        blurb: frame?.blurb ?? 'Matching turn-frame border.',
        priceGbp: '£1.99',
        priceUsd: '$1.99',
        frameSkin: { style: frame?.style ?? def.slug },
      },
    );
  }
}

attachRaceThemeKits();

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

export function themeKitItems(theme: ShopItem): { label: string; item: ShopItem }[] {
  if (!theme.kit) return [];
  const rows: { label: string; id: string }[] = [
    { label: 'Font', id: theme.kit.fontId },
    { label: 'Dice', id: theme.kit.diceId },
    { label: 'Voice', id: theme.kit.voiceId },
    { label: 'Frame', id: theme.kit.frameId },
  ];
  return rows
    .map((row) => {
      const item = shopItemById(row.id);
      return item ? { label: row.label, item } : null;
    })
    .filter((row): row is { label: string; item: ShopItem } => !!row);
}

const KIT_PART_IDS = new Set(
  THEME_ITEMS.flatMap((theme) => theme.includes ?? Object.values(theme.kit ?? {}))
);

export function isRaceKitPart(id: string): boolean {
  return KIT_PART_IDS.has(id);
}

export const RACE_THEME_ITEMS = THEME_ITEMS.filter((item) => !!item.kit);
export const OTHER_THEME_ITEMS = THEME_ITEMS.filter((item) => !item.kit);
