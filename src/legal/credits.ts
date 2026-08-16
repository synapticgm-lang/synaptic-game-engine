/**
 * Player-visible Credits / Attribution. Only things the live game actually uses.
 * Do not invent credits. Do not name licensed tabletop brands we do not use.
 */

export const CREDITS_PATH = '/credits';
export const CREDITS_LAST_UPDATED = '16 August 2026';

export type CreditRow = {
  work: string;
  source: string;
  license: string;
  usedFor: string;
  url?: string;
};

export type CreditSection = {
  id: string;
  title: string;
  intro?: string;
  rows: CreditRow[];
};

export const CREDIT_SECTIONS: CreditSection[] = [
  {
    id: 'fonts',
    title: 'Fonts',
    intro:
      'Loaded from Google Fonts for UI, story text, and theme packs. SIL Open Font License (OFL). System fonts such as Georgia are used only as fallbacks.',
    rows: [
      {
        work: 'Inter',
        source: 'Rasmus Andersson',
        license: 'SIL OFL 1.1',
        usedFor: 'Default UI typeface',
        url: 'https://fonts.google.com/specimen/Inter',
      },
      {
        work: 'Cinzel',
        source: 'Natanael Gama',
        license: 'SIL OFL 1.1',
        usedFor: 'Default story / serif headings',
        url: 'https://fonts.google.com/specimen/Cinzel',
      },
      {
        work: 'Cinzel Decorative',
        source: 'Natanael Gama',
        license: 'SIL OFL 1.1',
        usedFor: 'Ornamental theme headings',
        url: 'https://fonts.google.com/specimen/Cinzel+Decorative',
      },
      {
        work: 'Cormorant Garamond',
        source: 'Christian Thalmann',
        license: 'SIL OFL 1.1',
        usedFor: 'Theme story type and comic captions',
        url: 'https://fonts.google.com/specimen/Cormorant+Garamond',
      },
      {
        work: 'Crimson Pro',
        source: 'Jacques Le Bailly',
        license: 'SIL OFL 1.1',
        usedFor: 'Theme story type',
        url: 'https://fonts.google.com/specimen/Crimson+Pro',
      },
      {
        work: 'Grenze Gotisch',
        source: 'Omnibus-Type',
        license: 'SIL OFL 1.1',
        usedFor: 'Gothic theme type',
        url: 'https://fonts.google.com/specimen/Grenze+Gotisch',
      },
      {
        work: 'Libre Baskerville',
        source: 'Impallari Type',
        license: 'SIL OFL 1.1',
        usedFor: 'Theme story type',
        url: 'https://fonts.google.com/specimen/Libre+Baskerville',
      },
      {
        work: 'MedievalSharp',
        source: 'Wojciech Kalinowski',
        license: 'SIL OFL 1.1',
        usedFor: 'Carved / mountain theme type',
        url: 'https://fonts.google.com/specimen/MedievalSharp',
      },
      {
        work: 'Orbitron',
        source: 'Matt McInerney',
        license: 'SIL OFL 1.1',
        usedFor: 'HUD / sci-fi theme type',
        url: 'https://fonts.google.com/specimen/Orbitron',
      },
      {
        work: 'Playfair Display',
        source: 'Claus Eggers Sørensen',
        license: 'SIL OFL 1.1',
        usedFor: 'Theme story type',
        url: 'https://fonts.google.com/specimen/Playfair+Display',
      },
      {
        work: 'Special Elite',
        source: 'Astigmatic',
        license: 'SIL OFL 1.1',
        usedFor: 'Typewriter / crypt theme type',
        url: 'https://fonts.google.com/specimen/Special+Elite',
      },
      {
        work: 'Spectral',
        source: 'Production Type',
        license: 'SIL OFL 1.1',
        usedFor: 'Theme story type',
        url: 'https://fonts.google.com/specimen/Spectral',
      },
    ],
  },
  {
    id: 'icons',
    title: 'Icons',
    rows: [
      {
        work: 'Lucide',
        source: 'Lucide Contributors',
        license: 'ISC',
        usedFor: 'Buttons, HUD, settings, and menus',
        url: 'https://lucide.dev',
      },
    ],
  },
  {
    id: 'audio',
    title: 'Audio',
    intro: 'We do not ship a third-party sound library. Dice skins are original drawings.',
    rows: [
      {
        work: 'Web Speech API',
        source: 'Your browser / device',
        license: 'Platform feature',
        usedFor: 'Optional GM narration (text-to-speech). Voices belong to the OS or browser, not SynapticGM.',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API',
      },
    ],
  },
  {
    id: 'libraries',
    title: 'Libraries',
    intro: 'Open-source tools you actually meet in play (cloud save, sign-in, PDF export). Build tooling is omitted.',
    rows: [
      {
        work: 'React',
        source: 'Meta and contributors',
        license: 'MIT',
        usedFor: 'The app interface',
        url: 'https://react.dev',
      },
      {
        work: 'jsPDF',
        source: 'jsPDF contributors',
        license: 'MIT',
        usedFor: 'Optional session PDF export',
        url: 'https://github.com/parallax/jsPDF',
      },
      {
        work: 'Supabase JS',
        source: 'Supabase',
        license: 'MIT',
        usedFor: 'Optional cloud saves and account session',
        url: 'https://supabase.com',
      },
      {
        work: 'Google Identity (react-oauth)',
        source: '@react-oauth/google',
        license: 'MIT',
        usedFor: 'Optional Sign in with Google',
        url: 'https://github.com/MomenSherif/react-oauth',
      },
    ],
  },
  {
    id: 'apis',
    title: 'Hosted AI',
    intro: 'Named in Settings when you use hosted AI. We do not list secret keys or unused providers.',
    rows: [
      {
        work: 'Gemini',
        source: 'Google',
        license: 'Paid / hosted API',
        usedFor: 'Story writing on hosted tiers',
        url: 'https://ai.google.dev',
      },
      {
        work: 'OpenRouter',
        source: 'OpenRouter',
        license: 'Paid / hosted API',
        usedFor: 'AI routing for story and images',
        url: 'https://openrouter.ai',
      },
      {
        work: 'Flux',
        source: 'Black Forest Labs',
        license: 'Paid / hosted API',
        usedFor: 'Scene and comic images (via OpenRouter, or direct when enabled)',
        url: 'https://blackforestlabs.ai',
      },
    ],
  },
  {
    id: 'rules',
    title: 'Rules',
    rows: [
      {
        work: 'SynapticGM tabletop & LitRPG rules',
        source: 'SynapticGM',
        license: 'Original',
        usedFor:
          'Checks, combat, loot, and System panels. Inspired by common tabletop practice (d20, GM, turns, armor class, hit points) — not a licensed rulebook.',
      },
      {
        work: 'Custom tabletop rules (player paste)',
        source: 'The player',
        license: 'Player-supplied',
        usedFor:
          'Optional house rules you paste or attach for one campaign. SynapticGM does not provide that document; it is yours. Kid Mode still filters GM output.',
      },
    ],
  },
  {
    id: 'stories',
    title: 'Stories & folklore',
    intro:
      'Campaign bibles, NPCs, and places are original SynapticGM writing. Genre patterns and public-domain folklore are used honestly; we do not copy named novels or other companies’ settings.',
    rows: [
      {
        work: 'Campaign bibles & GM stories',
        source: 'SynapticGM',
        license: 'Original',
        usedFor: 'Premade adventures, openings, and Guide Book text',
      },
      {
        work: 'Vampire, ghost, and undead tropes',
        source: 'Public-domain folklore',
        license: 'Public domain tropes',
        usedFor:
          'Stories such as Cursed Keep and gothic night-court tales. Inspired by traditional folklore (blood-drinking dead, haunted houses), not a specific copyrighted novel or game.',
      },
      {
        work: 'Locked-room / country-house mystery',
        source: 'Public-domain mystery genre',
        license: 'Genre pattern',
        usedFor: 'Original estate-murder stories. Structure only — original names and plot.',
      },
      {
        work: 'LitRPG “System” framing',
        source: 'SynapticGM (genre pattern)',
        license: 'Original setting text',
        usedFor: 'In-world registrar / System panels. Common genre pattern; not any named novel.',
      },
    ],
  },
];
