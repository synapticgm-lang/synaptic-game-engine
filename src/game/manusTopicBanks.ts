import type { GameState } from './types';

/**
 * Manus dialogue trees as authored topic lines — not a DialogueTree UI.
 * Wren Greyhollow copy rewritten to Thornferry. Mira Voss mapped onto Mira the Apothecary.
 */

export interface AuthoredTopicLine {
  topic: string;
  line: string;
  aliases: string[];
}

const BANKS: Record<string, AuthoredTopicLine[]> = {
  'wren holt': [
    {
      topic: 'wren_holt_intro',
      line: 'Wren Holt. I brought the Millstone Charter. Walk the road with me, or I walk it alone.',
      aliases: ['who', 'name', 'introduce', 'intro'],
    },
    {
      topic: 'wren_holt_place',
      line: 'Thornferry mill landing. Ferry rope, sealed charter, Pell’s coin waiting east.',
      aliases: ['where', 'place', 'here', 'this place'],
    },
    {
      topic: 'wren_holt_background',
      line: 'I keep the charter close. Local mill or Highmark — you pick. Forgery is a choice, not a favor.',
      aliases: ['background', 'charter', 'why'],
    },
  ],
  'dain holt': [
    {
      topic: 'captain_dain_intro',
      line: 'Dain Holt. Greyhollow watch. I need eyes on the keep gate, not boasts in the inn.',
      aliases: ['who', 'name', 'introduce', 'intro'],
    },
    {
      topic: 'captain_dain_place',
      line: 'The keep gate is chained for the town’s comfort. The chain is already broken. Stand watch or walk.',
      aliases: ['where', 'place', 'here', 'gate'],
    },
    {
      topic: 'captain_dain_background',
      line: 'The watch needs eyes, not boasts. Report the hill. Do not empty the town.',
      aliases: ['background', 'watch'],
    },
  ],
  mira: [
    {
      topic: 'mira_apothecary_intro',
      line: 'Mira. I keep remedies — and journals I will not volunteer.',
      aliases: ['who', 'name', 'introduce', 'intro'],
    },
    {
      topic: 'mira_apothecary_place',
      line: 'This shop is remedies first. The Greymark journals stay in the drawer until I trust the asker.',
      aliases: ['where', 'place', 'here', 'archive'],
    },
  ],
  'tomas reed': [
    {
      topic: 'tomas_reed_intro',
      line: 'Tomas Reed. I take the rope. Signature or favor before it goes slack.',
      aliases: ['who', 'name', 'introduce', 'intro'],
    },
    {
      topic: 'tomas_reed_place',
      line: 'Last crossing leaves on the next bell. Pay, work, or wait in the mill.',
      aliases: ['where', 'place', 'ferry'],
    },
  ],
  'orin quill': [
    {
      topic: 'orin_quill_intro',
      line: 'Orin Quill. Pell sent a clerk, not a friend. I can cut a duplicate seal.',
      aliases: ['who', 'name', 'introduce', 'intro'],
    },
  ],
  'harker vale': [
    {
      topic: 'harker_vale_intro',
      line: 'Harker Vale. I sell hold stamps. Press-gangs read paper, not faces.',
      aliases: ['who', 'name', 'introduce', 'intro'],
    },
  ],
  'fenn lark': [
    {
      topic: 'fenn_lark_intro',
      line: 'Fenn Lark. Health Tonic, Iron Nail, Reed Salve — copper prices, no System gift.',
      aliases: ['who', 'name', 'introduce', 'intro', 'buy', 'wares'],
    },
  ],
  'nemi salt': [
    {
      topic: 'nemi_salt_wares',
      line: 'Nemi Salt. Health Tonic, Iron Nail, Reed Salve on the moving ledger. Same-item twice is a no.',
      aliases: ['buy', 'wares', 'stock', 'shop'],
    },
  ],
  'nox kade': [
    {
      topic: 'nox_kade_wares',
      line: 'Nox Kade. Leverage tokens and a Health Tonic if you can pay in a name.',
      aliases: ['buy', 'wares', 'stock', 'shop'],
    },
  ],
};

/** Vendor leftover: named stock on existing merchants — no new currency FSM. */
export const MERCHANT_STOCK_FACT =
  'Sells: Health Tonic; Iron Nail; Reed Salve (copper prices; same item already bought starves the Buy pad).';

const ROLE_VOICE_FACT: Array<{ role: RegExp; fact: string }> = [
  { role: /ruler|magistrate|mayor/, fact: 'Speech: formal, short sentences, corrects sloppy titles.' },
  { role: /merchant|broker|quartermaster/, fact: 'Speech: prices first, then the favor.' },
  { role: /guide|novice/, fact: 'Speech: plain, names the door, does not invent a prophecy.' },
  { role: /gatekeeper|captain|watch/, fact: 'Speech: watch needs eyes, not boasts.' },
];

function norm(name: string): string {
  return name.trim().toLowerCase().replace(/^(the|a|an)\s+/, '');
}

function bankKey(name: string): string {
  const n = norm(name);
  if (n === 'mira the apothecary' || n === 'apothecary mira' || n === 'mira') return 'mira';
  if (n === 'captain dain') return 'dain holt';
  return n;
}

export function authoredTopicsFor(npcName: string): AuthoredTopicLine[] {
  return BANKS[bankKey(npcName)] ?? [];
}

export function merchantStockFactFor(roleHint: string, npcName: string): string | '' {
  if (/merchant|broker|quartermaster|fence|vendor|trader/.test(`${roleHint} ${npcName}`.toLowerCase())) {
    return MERCHANT_STOCK_FACT;
  }
  return '';
}

export function roleVoiceFactFor(roleHint: string): string | '' {
  const hit = ROLE_VOICE_FACT.find((r) => r.role.test(roleHint));
  return hit?.fact ?? '';
}

export function pickAuthoredTopicLine(npcName: string, playerInput: string): string {
  const topics = authoredTopicsFor(npcName);
  if (!topics.length) return '';
  const hay = (playerInput ?? '').toLowerCase();
  const hit =
    topics.find((t) => t.aliases.some((a) => hay.includes(a))) ??
    topics.find((t) => t.topic.endsWith('_intro')) ??
    topics[0];
  return hit?.line ?? '';
}

export function authoredTopicForState(state: GameState, npcName: string, playerInput: string): string {
  if (!npcName.trim()) return '';
  return pickAuthoredTopicLine(npcName, playerInput);
}
