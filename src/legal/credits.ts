/**
 * Player-visible Credits / Attribution. Only things the live game actually uses.
 * Do not invent credits. Do not name licensed tabletop brands we do not use.
 */

export const CREDITS_PATH = '/credits';
export const CREDITS_LAST_UPDATED = '14 October 2026';

/** The attribution CC BY 4.0 requires for SRD 5.2.1, word for word. */
export const SRD_5_2_1_NOTICE =
  'This work includes material from the System Reference Document 5.2.1 (SRD 5.2.1) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.';

export type CreditRow = {
  work: string;
  source: string;
  license: string;
  usedFor: string;
  url?: string;
  /** A licence notice shown word for word under the row. */
  notice?: string;
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
      {
        work: 'Inventory glyphs',
        source: 'SynapticGM (original drawings)',
        license: 'Original; bundled with the game',
        usedFor: 'Item icons, armor/weapon glyphs, and the paper-doll silhouette',
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
        work: 'Transformers.js (@xenova/transformers)',
        source: 'Hugging Face / Xenova and contributors',
        license: 'Apache-2.0',
        usedFor: 'In-browser story memory (matching earlier scenes to the current one)',
        url: 'https://github.com/xenova/transformers.js',
      },
      {
        work: 'languagetool-api',
        source: 'languagetool-api contributors',
        license: 'BSD-2-Clause',
        usedFor: 'Grammar check client on the High tier',
        url: 'https://www.npmjs.com/package/languagetool-api',
      },
      {
        work: 'Fuse.js',
        source: 'Kirollos Risk and contributors',
        license: 'Apache-2.0',
        usedFor: 'Matching names the player types to the people, items and places in the game',
        url: 'https://github.com/krisk/Fuse',
        notice: 'Fuse.js, Copyright 2017 Kirollos Risk. Licensed under the Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0).',
      },
      {
        work: 'Zod',
        source: 'Colin McDonnell and contributors',
        license: 'MIT',
        usedFor: 'Checking data at the edges (writer replies, save files, the skills library)',
        url: 'https://github.com/colinhacks/zod',
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
        work: 'Fireworks',
        source: 'Fireworks AI',
        license: 'Paid / hosted API',
        usedFor: 'Story writing on hosted Free (DeepSeek V4 Flash)',
        url: 'https://fireworks.ai',
      },
      {
        work: 'OpenRouter',
        source: 'OpenRouter',
        license: 'Paid / hosted API',
        usedFor: 'Mid/High story writers, Free Llama failover, and images',
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
        work: 'System Reference Document 5.2.1 (SRD 5.2.1)',
        source: 'Wizards of the Coast LLC',
        license: 'CC BY 4.0',
        usedFor:
          'Tabletop rules as written: ability scores, checks, combat, conditions, death saves, species, classes, spells, monsters, equipment, coins, travel, and experience.',
        url: 'https://www.dndbeyond.com/srd',
        notice: SRD_5_2_1_NOTICE,
      },
      {
        work: 'SynapticGM coin tables',
        source: 'SynapticGM',
        license: 'Original',
        usedFor:
          'Tabletop individual and hoard coin tables scaled by challenge rating. Our own tables, set against SRD 5.2.1 prices; not copied from any published treasure table.',
      },
      {
        work: 'SynapticGM LitRPG and story RPG presentation',
        source: 'SynapticGM',
        license: 'Original',
        usedFor: 'System panels, receipts, standing, and story-RPG framing laid over the shared rules engine.',
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
