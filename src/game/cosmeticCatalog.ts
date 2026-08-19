/**
 * Sellable cosmetic catalog (Pack 10). Display / entitlements only — never touches dice math.
 */

export type DiceMaterial =
  | 'wood'
  | 'obsidian'
  | 'ivory'
  | 'brass'
  | 'iron'
  | 'scale'
  | 'ember'
  | 'circuit'
  | 'marble'
  | 'sulfur'
  | 'bone'
  | 'iridescent'
  | 'scrap'
  | 'tide'
  | 'velvet'
  | 'holo'
  | 'frost'
  | 'neon';

export type ThemeTexture =
  | 'plain'
  | 'moss'
  | 'dusk'
  | 'soot'
  | 'ivory'
  | 'banner'
  | 'scale'
  | 'ember'
  | 'circuit'
  | 'halo'
  | 'sulfur'
  | 'bone'
  | 'glamour'
  | 'scrap'
  | 'tide'
  | 'velvet'
  | 'parchment'
  | 'phosphor'
  | 'neon'
  | 'glass'
  | 'noir';

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
  /** Dice tray tint + preview material. Cosmetic only — odds unchanged. */
  diceSkin?: { accent: string; face: string; material?: DiceMaterial };
  /** Turn-card border style id (CSS `data-sgm-frame`). */
  frameSkin?: { style: string };
  /** Spoken one-liner for voice cards (browser TTS preview). */
  flavour?: string;
  preview?: {
    accent: string;
    bg: string;
    panel: string;
    text: string;
    muted: string;
    fontUi?: string;
    fontStory?: string;
    /** Panel material for shop / locker chips. Free default stays `plain`. */
    texture?: ThemeTexture;
    /** Default turn-frame style when kit frame is not separately equipped. */
    frameStyle?: string;
    /** Default dice material token when kit dice is not separately equipped. */
    diceMaterial?: DiceMaterial;
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
      texture: 'plain',
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
      texture: 'neon',
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
      fontStory: '"Libre Baskerville", Georgia, "Times New Roman", serif',
      texture: 'parchment',
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
      fontStory: '"Crimson Pro", Georgia, serif',
      texture: 'bone',
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
      texture: 'phosphor',
    },
  },
  {
    id: 'theme.noir-crimson',
    slot: 'theme',
    name: 'Noir Crimson',
    blurb: 'Matte charcoal case-file with one crimson interruption — pulp paper, not wine velvet.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'noir-crimson',
    preview: {
      accent: '#b91c1c',
      bg: '#050505',
      panel: '#121212',
      text: '#fafafa',
      muted: '#a3a3a3',
      fontUi: 'ui-sans-serif, system-ui, sans-serif',
      fontStory: '"Playfair Display", Georgia, serif',
      texture: 'noir',
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
      fontStory: '"Cormorant Garamond", Georgia, serif',
      texture: 'glass',
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
      fontStory: '"Playfair Display", Georgia, serif',
      texture: 'ember',
    },
  },

  // --- Race / archetype styles (folklore & sci-fi tropes; original pack names) ---
  // Material-first £3.99 kits (Manus T2/T11): not Integration recolors.
  {
    id: 'theme.wood-elf-grove',
    slot: 'theme',
    name: 'Wood Elf Grove',
    blurb: 'Moss grain, leaf-shadow, living canopy — forest material, not generic green fill.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'wood-elf-grove',
    preview: {
      accent: '#9aaa4a',
      bg: '#0a1008',
      panel: '#121a10',
      text: '#e8f0d8',
      muted: '#8a9a78',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: '"Libre Baskerville", Georgia, "Palatino Linotype", serif',
    },
  },
  {
    id: 'theme.dark-elf-umbrance',
    slot: 'theme',
    name: 'Dark Elf Umbrance',
    blurb: 'Dusk velvet, black-violet thread, deep filigree — under-realm textile, not purple wash.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'dark-elf-umbrance',
    preview: {
      accent: '#a78bc8',
      bg: '#0a0810',
      panel: '#14101c',
      text: '#efe8f5',
      muted: '#9a8fb0',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: '"Cormorant Garamond", "Palatino Linotype", Palatino, serif',
    },
  },
  {
    id: 'theme.high-elf-spire',
    slot: 'theme',
    name: 'High Elf Spire',
    blurb: 'Ivory stone, silver line, tall stepped lift — Cinzel titles only, not sky-blue chrome.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'high-elf-spire',
    preview: {
      accent: '#c9b896',
      bg: '#10141c',
      panel: '#1a2230',
      text: '#f5f0e6',
      muted: '#9aa8bc',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, "Times New Roman", serif',
    },
  },
  {
    id: 'theme.dwarf-forgehall',
    slot: 'theme',
    name: 'Dwarf Forgehall',
    blurb: 'Soot stone, hammered brass, warm forge spark — mountain hold material, not brown-orange fill.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'dwarf-forgehall',
    preview: {
      accent: '#c48a3a',
      bg: '#12100e',
      panel: '#1e1a16',
      text: '#f0e6d4',
      muted: '#9a9084',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, "Times New Roman", serif',
    },
  },
  {
    id: 'theme.orc-warcamp',
    slot: 'theme',
    name: 'Orc Warcamp',
    blurb: 'Rough iron, weathered canvas, blood-rust studs — camp banners, not goblin scrap green.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'orc-warcamp',
    preview: {
      accent: '#a85a3a',
      bg: '#0e100c',
      panel: '#1a1c14',
      text: '#e8e4d4',
      muted: '#8a9070',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Inter, ui-sans-serif, system-ui, sans-serif',
    },
  },
  {
    id: 'theme.dragon-hoard',
    slot: 'theme',
    name: 'Dragon Hoard',
    blurb: 'Layered scale enamel, aged-gold glint — wyrm lair opulence, not tiled green wallpaper.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'dragon-hoard',
    preview: {
      accent: '#c9a227',
      bg: '#0a120c',
      panel: '#142018',
      text: '#f5efd0',
      muted: '#7a9078',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: '"Libre Baskerville", Georgia, serif',
    },
  },
  {
    id: 'theme.phoenix-ashrise',
    slot: 'theme',
    name: 'Phoenix Ashrise',
    blurb: 'Ash paper, feather-flame edge, rose-gold ember — rebirth material, not generic fire red.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'phoenix-ashrise',
    preview: {
      accent: '#e08a70',
      bg: '#120a08',
      panel: '#1c100c',
      text: '#fff4ec',
      muted: '#c4a090',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: '"Playfair Display", Palatino, Georgia, serif',
    },
  },
  {
    id: 'theme.cyborg-chassis',
    slot: 'theme',
    name: 'Cyborg Chassis',
    blurb: 'Brushed gunmetal, clipped optic trace, hazard amber — augmented chrome, not registrar teal.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'cyborg-chassis',
    preview: {
      accent: '#5eb8e8',
      bg: '#0a0b0d',
      panel: '#14161a',
      text: '#e8f4fc',
      muted: '#e0b040',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Inter, ui-sans-serif, system-ui, sans-serif',
    },
  },
  {
    id: 'theme.angelic-radiance',
    slot: 'theme',
    name: 'Angelic Radiance',
    blurb: 'Diffuse pearl, warm halo rim, breathable marble — celestial calm without washed-out contrast.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'angelic-radiance',
    preview: {
      accent: '#e8d5a0',
      bg: '#141210',
      panel: '#2a2620',
      text: '#faf6ee',
      muted: '#b8b0a4',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: '"Cormorant Garamond", Garamond, Georgia, serif',
    },
  },
  {
    id: 'theme.infernal-pact',
    slot: 'theme',
    name: 'Infernal Pact',
    blurb: 'Charred parchment, sulfur hotspot, wax-seal heat — dry contract fire, not velvet night.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'infernal-pact',
    preview: {
      accent: '#f59e0b',
      bg: '#120808',
      panel: '#1f0c0a',
      text: '#ffedd5',
      muted: '#fca5a5',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: '"Crimson Pro", Georgia, serif',
    },
  },
  {
    id: 'theme.undead-ossuary',
    slot: 'theme',
    name: 'Undead Ossuary',
    blurb: 'Bone ivory, grave ash, cold moonlight — crypt UI, not System teal.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'undead-ossuary',
    preview: {
      accent: '#e7e5e4',
      bg: '#080706',
      panel: '#1c1917',
      text: '#fafaf9',
      muted: '#a8a29e',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Georgia, "Times New Roman", serif',
    },
  },
  {
    id: 'theme.fae-glamour',
    slot: 'theme',
    name: 'Fae Glamour',
    blurb: 'Iridescent veil, twilight bloom, restrained prism — court mischief, not rainbow noise.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'fae-glamour',
    preview: {
      accent: '#d4a0e0',
      bg: '#0c0814',
      panel: '#181022',
      text: '#f8eef6',
      muted: '#70b8c8',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: '"Cormorant Garamond", "Palatino Linotype", Palatino, serif',
    },
  },
  {
    id: 'theme.goblin-scrapheap',
    slot: 'theme',
    name: 'Goblin Scrapheap',
    blurb: 'Mismatched scrap plates, rivet dots, oil-free grit — workshop chaos, not an orc recolor.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
    themeKey: 'goblin-scrapheap',
    preview: {
      accent: '#d4b43a',
      bg: '#12140c',
      panel: '#1e2210',
      text: '#f5efc8',
      muted: '#8a9458',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Inter, ui-sans-serif, system-ui, sans-serif',
    },
  },
  {
    id: 'theme.merfolk-abyss',
    slot: 'theme',
    name: 'Merfolk Abyss',
    blurb: 'Deep tide contour, pearl glint, blue-black pressure — abyss material, not Integration cyan.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'merfolk-abyss',
    preview: {
      accent: '#7eb8b0',
      bg: '#061412',
      panel: '#0c2420',
      text: '#e8f4f0',
      muted: '#6a9088',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: 'Spectral, Palatino, Georgia, serif',
    },
  },
  {
    id: 'theme.vampire-nocturne',
    slot: 'theme',
    name: 'Vampire Nocturne',
    blurb: 'Flocked velvet, wine-glass glint, moonlit obsidian edge — night-court material, not flat maroon.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    themeKey: 'vampire-nocturne',
    preview: {
      accent: '#8d2746',
      bg: '#171018',
      panel: '#22131f',
      text: '#f4e9ec',
      muted: '#c9b5bb',
      fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontStory: '"Playfair Display", Georgia, "Times New Roman", serif',
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
    diceSkin: { accent: '#22d3ee', face: '#0e7490', material: 'holo' },
  },
  {
    id: 'dice.bone-iron',
    slot: 'dice',
    name: 'Bone & Iron',
    blurb: 'Weathered bone faces, iron numerals.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
    diceSkin: { accent: '#d6d3d1', face: '#78716c', material: 'bone' },
  },
  {
    id: 'dice.frost-crystal',
    slot: 'dice',
    name: 'Frost Crystal',
    blurb: 'Clear frosted glass polyhedral set.',
    priceGbp: '£3.99',
    priceUsd: '$3.99',
    diceSkin: { accent: '#7dd3fc', face: '#0369a1', material: 'frost' },
  },
  {
    id: 'dice.neon-edge',
    slot: 'dice',
    name: 'Neon Edge',
    blurb: 'Black dice with neon rim light.',
    priceGbp: '£2.99',
    priceUsd: '$2.99',
    diceSkin: { accent: '#f0abfc', face: '#a21caf', material: 'neon' },
  },

  // --- Voices ---
  {
    id: 'voice.cold-registrar',
    slot: 'voice',
    name: 'Cold Registrar',
    blurb: 'Flat, precise System / Auditor voice.',
    flavour: 'Name. Designation. The record is open.',
    priceGbp: '£4.99',
    priceUsd: '$4.99',
    tts: { rate: 0.95, pitch: 0.85, voiceHint: 'david' },
  },
  {
    id: 'voice.street-chronicler',
    slot: 'voice',
    name: 'Street Chronicler',
    blurb: 'Gritty urban Integration narrator.',
    flavour: 'The street keeps its own ledger.',
    priceGbp: '£4.99',
    priceUsd: '$4.99',
    tts: { rate: 1.02, pitch: 0.92, voiceHint: 'mark' },
  },
  {
    id: 'voice.grizzled-mentor',
    slot: 'voice',
    name: 'Grizzled Mentor',
    blurb: 'Older advisor tone, dry humour.',
    flavour: 'You will live longer if you listen first.',
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
  diceMaterial: DiceMaterial;
  texture: ThemeTexture;
  voiceName: string;
  voiceBlurb: string;
  voiceFlavour: string;
  tts: { rate: number; pitch: number; voiceHint: string };
};

const RACE_THEME_KITS: RaceKitDef[] = [
  {
    themeId: 'theme.wood-elf-grove',
    slug: 'grove',
    fontName: 'Canopy Serif',
    fontBlurb: 'Libre Baskerville prose; Inter UI; leaf-gold story weight.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Libre Baskerville", Georgia, "Palatino Linotype", serif',
    diceName: 'Amber Leaf',
    diceBlurb: 'Moss-wood faces, leaf-gold rim. Odds unchanged.',
    diceAccent: '#9aaa4a',
    diceFace: '#1a2e12',
    diceMaterial: 'wood',
    texture: 'moss',
    voiceName: 'Grove Whisper',
    voiceBlurb: 'Soft canopy narrator — unhurried, close.',
    voiceFlavour: 'The canopy remembers every footfall.',
    tts: { rate: 0.92, pitch: 1.08, voiceHint: 'zira' },
  },
  {
    themeId: 'theme.dark-elf-umbrance',
    slug: 'umbrance',
    fontName: 'Umbrance Serif',
    fontBlurb: 'Cormorant prose on dusk textile; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Cormorant Garamond", "Palatino Linotype", Palatino, serif',
    diceName: 'Violet Obsidian',
    diceBlurb: 'Near-black glass, pale-violet rim. Odds unchanged.',
    diceAccent: '#a78bc8',
    diceFace: '#12081c',
    diceMaterial: 'obsidian',
    texture: 'dusk',
    voiceName: 'Under-Realm',
    voiceBlurb: 'Low, measured dusk voice.',
    voiceFlavour: 'Dusk keeps its own counsel.',
    tts: { rate: 0.88, pitch: 0.82, voiceHint: 'hazel' },
  },
  {
    themeId: 'theme.high-elf-spire',
    slug: 'spire',
    fontName: 'Ivory Court',
    fontBlurb: 'Cinzel titles only; Georgia prose; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Georgia, "Times New Roman", serif',
    diceName: 'Sky Gold',
    diceBlurb: 'Ivory faces, aged-gold numerals. Odds unchanged.',
    diceAccent: '#c9b896',
    diceFace: '#c4a574',
    diceMaterial: 'ivory',
    texture: 'ivory',
    voiceName: 'Lofty Court',
    voiceBlurb: 'Precise, slightly lifted court diction.',
    voiceFlavour: 'The court has already heard your name.',
    tts: { rate: 0.96, pitch: 1.05, voiceHint: 'samantha' },
  },
  {
    themeId: 'theme.dwarf-forgehall',
    slug: 'forgehall',
    fontName: 'Rune Stone',
    fontBlurb: 'MedievalSharp titles only; Georgia prose; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Georgia, "Times New Roman", serif',
    diceName: 'Hammered Brass',
    diceBlurb: 'Brass faces, soot numerals — forge-floor dice. Odds unchanged.',
    diceAccent: '#c48a3a',
    diceFace: '#431407',
    diceMaterial: 'brass',
    texture: 'soot',
    voiceName: 'Forge Deep',
    voiceBlurb: 'Low hall voice, unhurried.',
    voiceFlavour: 'Stone remembers the hammer.',
    tts: { rate: 0.84, pitch: 0.72, voiceHint: 'david' },
  },
  {
    themeId: 'theme.orc-warcamp',
    slug: 'warcamp',
    fontName: 'War Banner',
    fontBlurb: 'Compressed titles only; Inter body for camp orders.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Inter, ui-sans-serif, system-ui, sans-serif',
    diceName: 'Blood Iron',
    diceBlurb: 'Pitted iron, blood-rust rim. Odds unchanged.',
    diceAccent: '#a85a3a',
    diceFace: '#1c1917',
    diceMaterial: 'iron',
    texture: 'banner',
    voiceName: 'Warcamp',
    voiceBlurb: 'Rough, short-breathed camp bark.',
    voiceFlavour: 'Banners first. Then the rest.',
    tts: { rate: 1.02, pitch: 0.76, voiceHint: 'mark' },
  },
  {
    themeId: 'theme.dragon-hoard',
    slug: 'hoard',
    fontName: 'Wyrm Gold',
    fontBlurb: 'Cinzel Decorative titles only; Baskerville prose; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Libre Baskerville", Georgia, serif',
    diceName: 'Molten Scale',
    diceBlurb: 'Enamel-scale faces, aged-gold pips. Odds unchanged.',
    diceAccent: '#c9a227',
    diceFace: '#422006',
    diceMaterial: 'scale',
    texture: 'scale',
    voiceName: 'Hoard Rumble',
    voiceBlurb: 'Deep, slow wyrm diction.',
    voiceFlavour: 'The hoard does not sleep.',
    tts: { rate: 0.8, pitch: 0.68, voiceHint: 'daniel' },
  },
  {
    themeId: 'theme.phoenix-ashrise',
    slug: 'ashrise',
    fontName: 'Ember Script',
    fontBlurb: 'Playfair prose through rose-gold flame; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Playfair Display", Palatino, Georgia, serif',
    diceName: 'Ash Flame',
    diceBlurb: 'Char faces, rose-gold ember rim. Odds unchanged.',
    diceAccent: '#e08a70',
    diceFace: '#1c0a0a',
    diceMaterial: 'ember',
    texture: 'ember',
    voiceName: 'Ashrise',
    voiceBlurb: 'Warm mid voice, a little brighter.',
    voiceFlavour: 'Ash is only the first name of fire.',
    tts: { rate: 0.97, pitch: 1.06, voiceHint: 'zira' },
  },
  {
    themeId: 'theme.cyborg-chassis',
    slug: 'chassis',
    fontName: 'Optic Mono',
    fontBlurb: 'Orbitron titles only; Inter UI and story.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Inter, ui-sans-serif, system-ui, sans-serif',
    diceName: 'Skull Circuit',
    diceBlurb: 'Free logo die — optic sky/amber energy d20 with the skull inside. Odds unchanged.',
    diceAccent: '#5eb8e8',
    diceFace: '#0f172a',
    diceMaterial: 'circuit',
    texture: 'circuit',
    voiceName: 'Chassis Synth',
    voiceBlurb: 'Flat, slightly fast augmented tone.',
    voiceFlavour: 'Signal locked. Proceed.',
    tts: { rate: 1.06, pitch: 0.88, voiceHint: 'google' },
  },
  {
    themeId: 'theme.angelic-radiance',
    slug: 'radiance',
    fontName: 'Marble Serif',
    fontBlurb: 'Cormorant calm for marble panels; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Cormorant Garamond", Garamond, Georgia, serif',
    diceName: 'Halo Gold',
    diceBlurb: 'Pearl-marble polyhedrals, warm rim. Odds unchanged.',
    diceAccent: '#e8d5a0',
    diceFace: '#a8a29e',
    diceMaterial: 'marble',
    texture: 'halo',
    voiceName: 'Radiance',
    voiceBlurb: 'Soft, lifted celestial diction.',
    voiceFlavour: 'Light does not ask permission.',
    tts: { rate: 0.93, pitch: 1.12, voiceHint: 'samantha' },
  },
  {
    themeId: 'theme.infernal-pact',
    slug: 'pact',
    fontName: 'Sulfur Serif',
    fontBlurb: 'Crimson Pro prose for sealed contracts; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Crimson Pro", Georgia, serif',
    diceName: 'Sulfur Bone',
    diceBlurb: 'Char-bone faces, sulfur-amber rims. Odds unchanged.',
    diceAccent: '#f59e0b',
    diceFace: '#1f0c0a',
    diceMaterial: 'sulfur',
    texture: 'sulfur',
    voiceName: 'Pact Heat',
    voiceBlurb: 'Low, slow sealed-contract voice.',
    voiceFlavour: 'The seal is warm. It is listening.',
    tts: { rate: 0.86, pitch: 0.74, voiceHint: 'david' },
  },
  {
    themeId: 'theme.undead-ossuary',
    slug: 'ossuary',
    fontName: 'Crypt Serif',
    fontBlurb: 'Special Elite titles only; Georgia prose; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Georgia, "Times New Roman", serif',
    diceName: 'Bone Knuckle',
    diceBlurb: 'Ivory knuckle dice, moonlight edge. Odds unchanged.',
    diceAccent: '#e7e5e4',
    diceFace: '#44403c',
    diceMaterial: 'bone',
    texture: 'bone',
    voiceName: 'Ossuary',
    voiceBlurb: 'Whispered, low crypt tone.',
    voiceFlavour: 'The quiet here is not empty.',
    tts: { rate: 0.82, pitch: 0.7, voiceHint: 'hazel' },
  },
  {
    themeId: 'theme.fae-glamour',
    slug: 'glamour',
    fontName: 'Twilight Serif',
    fontBlurb: 'Cormorant twilight prose; Inter UI; restrained prism.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Cormorant Garamond", "Palatino Linotype", Palatino, serif',
    diceName: 'Iridescent',
    diceBlurb: 'Muted pink-teal shimmer faces. Odds unchanged.',
    diceAccent: '#d4a0e0',
    diceFace: '#3b0764',
    diceMaterial: 'iridescent',
    texture: 'glamour',
    voiceName: 'Glamour',
    voiceBlurb: 'Playful, slightly lifted twilight voice.',
    voiceFlavour: 'Pretty things bite.',
    tts: { rate: 1.04, pitch: 1.14, voiceHint: 'zira' },
  },
  {
    themeId: 'theme.goblin-scrapheap',
    slug: 'scrapheap',
    fontName: 'Scrap Sans',
    fontBlurb: 'Inter labels for workshop chrome — loud titles via Scrap frame only.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Inter, ui-sans-serif, system-ui, sans-serif',
    diceName: 'Scrap Yellow',
    diceBlurb: 'Dry scrap faces, scrap-yellow pips. Odds unchanged.',
    diceAccent: '#d4b43a',
    diceFace: '#3f2a0c',
    diceMaterial: 'scrap',
    texture: 'scrap',
    voiceName: 'Scrap Cackle',
    voiceBlurb: 'Faster, brighter workshop bark.',
    voiceFlavour: 'If it sparks, it works.',
    tts: { rate: 1.1, pitch: 1.16, voiceHint: 'zira' },
  },
  {
    themeId: 'theme.merfolk-abyss',
    slug: 'abyss',
    fontName: 'Tide Serif',
    fontBlurb: 'Spectral prose under pressure; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: 'Spectral, Palatino, Georgia, serif',
    diceName: 'Pearl Tide',
    diceBlurb: 'Tide-glass dice, pearl rim. Odds unchanged.',
    diceAccent: '#7eb8b0',
    diceFace: '#042f2e',
    diceMaterial: 'tide',
    texture: 'tide',
    voiceName: 'Abyss Tide',
    voiceBlurb: 'Slow, resonant deep-water diction.',
    voiceFlavour: 'Pressure is a kind of prayer.',
    tts: { rate: 0.86, pitch: 0.8, voiceHint: 'daniel' },
  },
  {
    themeId: 'theme.vampire-nocturne',
    slug: 'nocturne',
    fontName: 'Velvet Gothic',
    fontBlurb: 'Grenze Gotisch titles only; Playfair prose; Inter UI.',
    fontUi: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontStory: '"Playfair Display", Georgia, "Times New Roman", serif',
    diceName: 'Wine Obsidian',
    diceBlurb: 'Near-black plum facets, pale numerals, thin wine rim. Odds unchanged.',
    diceAccent: '#8d2746',
    diceFace: '#171018',
    diceMaterial: 'velvet',
    texture: 'velvet',
    voiceName: 'Nocturne',
    voiceBlurb: 'Low, measured night-court voice.',
    voiceFlavour: 'Night has better manners than day.',
    tts: { rate: 0.87, pitch: 0.76, voiceHint: 'david' },
  },
];

const RACE_FRAMES: Record<string, { name: string; blurb: string; style: string }> = {
  grove: { name: 'Vine Lattice', blurb: 'Living vine corners on each turn beat.', style: 'vine' },
  umbrance: { name: 'Obsidian Filigree', blurb: 'Dark-glass corners, violet inlay.', style: 'filigree' },
  spire: { name: 'Ivory Arch', blurb: 'Crystal-gold arches around the beat.', style: 'ivory' },
  forgehall: { name: 'Hammer Rune', blurb: 'Hammer-head corners on forge-glow brass.', style: 'rune' },
  warcamp: { name: 'Iron Spike', blurb: 'Hard iron spike studs, camp-banner edge.', style: 'iron' },
  hoard: { name: 'Scale Gold', blurb: 'Stacked scale rim, molten gold corners.', style: 'scale' },
  ashrise: { name: 'Ash Feather', blurb: 'Feather-flame corners on each beat.', style: 'ember' },
  chassis: { name: 'Circuit Bezel', blurb: 'Optic-cyan HUD bezel.', style: 'circuit' },
  radiance: { name: 'Halo Arch', blurb: 'Soft gold halo around the beat.', style: 'halo' },
  pact: { name: 'Sulfur Seal', blurb: 'Wax-seal corner on heat-stained rim.', style: 'sulfur' },
  ossuary: { name: 'Bone Knuckle', blurb: 'Knucklebone corners on moonlight bone.', style: 'bone' },
  glamour: { name: 'Twilight Filigree', blurb: 'Iridescent court frame.', style: 'twilight' },
  scrapheap: { name: 'Scrap Rivet', blurb: 'Bolt-head rivets on welded scrap.', style: 'scrap' },
  abyss: { name: 'Pearl Tide', blurb: 'Tide-glass rim, pearl corners.', style: 'tide' },
  nocturne: {
    name: 'Gothic Arch',
    blurb: 'Tapered night-court arches, moonlit rim, wine edge only.',
    style: 'velvet',
  },
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
      theme.preview.texture = def.texture;
      theme.preview.frameStyle = frame?.style ?? def.slug;
      theme.preview.diceMaterial = def.diceMaterial;
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
        priceGbp: def.slug === 'chassis' ? 'Free' : '£2.99',
        priceUsd: def.slug === 'chassis' ? 'Free' : '$2.99',
        free: def.slug === 'chassis' ? true : undefined,
        diceSkin: { accent: def.diceAccent, face: def.diceFace, material: def.diceMaterial },
      },
      {
        id: voiceId,
        slot: 'voice',
        name: def.voiceName,
        blurb: def.voiceBlurb,
        flavour: def.voiceFlavour,
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

export function themeTextureOf(item: ShopItem | undefined): ThemeTexture {
  return item?.preview?.texture ?? 'plain';
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
