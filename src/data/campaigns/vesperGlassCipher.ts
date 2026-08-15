import type { CampaignBible } from './types';

/**
 * Original SynapticGM PYOA: aether-city cipher heist.
 * Ally/betray, party/solo, inner comments, several endings.
 * Not Fable, Albion, or any licensed world.
 */
export const vesperGlassCipher: CampaignBible = {
  id: 'vesper-glass-cipher',
  title: 'The Vesper-Glass Cipher',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Standard',
  genreTag: 'Occult mystery',
  tagline: 'To rewrite the past, you must first survive the people trying to erase it.',
  shortDescription:
    'Dark aether heist. You stole a humming cipher from Oakhaven’s flooded archives. Silas offers a way out. Trust him or use him, then choose the Rust-Barons, the Seers, or no one.',
  licenseNote:
    'Original SynapticGM dark-aether fantasy. Tropes only. Not based on Fable, Albion, or any named series, game, or novel.',
  styleRail: `FORK STYLE (BINDING): take the smuggler route, bribe a pipe-listener, smash a soul-lamp, ask Silas what he heard, play one line of the glass. Do not offer take-hand / shove-as-bait / hide-cylinder / tap-glass unless they typed that.
SPINE OVERRIDE: Occult archive heist — one liar, one costly reading, then who hears the truth. Not a two-faction tour.
ENDING LOGIC: Key on who heard the unedited history and whether Silas still has a sister to save.`,
  startingLocation: 'the Flooded Archives of Oakhaven',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'vg-coat', name: 'Trench-coat pockets', capacity: 14 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'The bells are already ringing. Confirm your name, then where this theft opens.',
  },
  openingHook:
    'Water drips onto the cracked leather of the tome you just stole. The brass spine of the Vesper-Glass hums warm against your chest. Archivist Guild bells scream down the flooded subterranean tunnel. Beside you, the thief Silas wipes blood from a split lip and offers a soot-stained hand — the smuggler’s route to the surface, before the tunnel comes down. Armored boots splash behind you. Guild Enforcers. The next page waits on the route, the bells, and whether you trust him.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Where does this open? The Flooded Archives is the default. You may name another Oakhaven place, or pick random.',
      suggestions: ['The Flooded Archives of Oakhaven', 'Random place', 'A flooded side tunnel'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing. Named garments.',
      suggestions: ['Oil-stained trench coat, wet boots', 'Local clothes under a heavy coat', 'What I wore into the archives'],
    },
  ],

  premise: `PLAYER AGENCY (BINDING): Main spine only — not an open sandbox. Do not dump a city map. Side seeds stay hidden until the player looks, talks, or wanders. Code owns stamps and kit. Writer: this turn’s camera only (2–6 sentences, then 3–4 local forks).

INNER VOICE (BINDING): Typed comments, jokes, and doubts ARE the hero thinking or speaking. Mirror them in <thought> or dialogue, then the world answers. Never overwrite their personality. Honor PERSPECTIVE and the session’s visual style. No meta (“the sheet”, “alignment”).

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Silas offers the smuggler route. Go with him = Walks With You. Leave him = Left. Sell him to the bells = Rival. Stamps stick.
- Baroness Vane (Rust-Barons) vs First-Voice Elara (Chorus of Seers). Ally or sell out. Both remember.
- No alignment-meter speech. Mercy and cruelty have social cost.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. Flooded Archives. Cylinder on you. Bells. Silas’s route. First player comment is in-character.
2. One source who will lie for coin (Bazaar or a pipe-listener). One pressure.
3. A reading that costs a memory or a name. Do not tour two factions as a checklist.
4. The machine that can play the glass — only when they seek it.
5. Unedited history: the ruling class are usurpers. Who they tell is the fork.
6. Whoever they burned arrives (Barons, Chorus, Silas-as-rival).
7. Ending from who heard the truth and whether Silas’s sister still lives. Never end in the opening hour. Never name endings.

SIDE SEEDS (writer only — spawn when earned; never dump):
- Sunken District: a clockwork leviathan that wakes to one tuning-fork pitch.
- Glass Wastes cult around a lightning bolt frozen in quartz.
- Blind beggar in the Bazaar charts collapse by listening to steam pipes.
- Memory auction: silver needles, not coin.
- Rust-plague in the slums is a weapon that eats aether-tech.
- Abandoned aerostat above the cloud line, operational, hallucinogenic gas.
- Streetlamps run on captured songbird souls; broken glass makes sonic anomalies.

OPENING KIT (AUTHORITY): Oil-stained trench coat and the Vesper-Glass Cylinder are the kit. Never invent an iron shortsword or traveler tunic unless the ledger has it.

ENDINGS (pick one after beat 7; never list in play — keyed to who heard the truth):
- Truth broadcast + Silas stayed: revolution; his sister freed; you are hailed.
- Truth sold to Vane: buried; luxurious isolation. If Silas is Rival, he reaches you with a blade.
- Cylinder smashed + Silas stayed: penniless in the Wastes, hunted, free of the city’s politics.
- You keep the only copy and tell no one: the secret eats you; hunted by everyone.
- You play a forged history with yourself as savior: Silas is written out if he Left.
- Truth to the Chorus + solo: history restored; Elara kills the thief so the method dies with you.

Do not name the Zenith Spire as a visited place until they are on that road. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'vg-lore-1',
      title: 'The Flooded Archives',
      category: 'world',
      body: 'Oakhaven’s Archivist Guild stores banned histories below the waterline. Tunnels flood on a schedule. The Vesper-Glass was locked here. The player starts in a theft already in progress — bells, boots, dripping stone.',
      tags: ['oakhaven', 'archives', 'guild', 'opening'],
    },
    {
      id: 'vg-lore-2',
      title: 'The Vesper-Glass Cylinder',
      category: 'history',
      body: 'A brass cylinder of humming blue gas and shifting dials. It holds the unedited history of Oakhaven. Deliver, keep, sell, burn, or forge it. It is not a weapon.',
      tags: ['cipher', 'macguffin', 'history', 'quest'],
    },
    {
      id: 'vg-lore-3',
      title: 'Rust-Barons',
      category: 'faction',
      body: 'Under-Bazaar aether-tech monopoly. Baroness Vane wants records destroyed so the slums stay hers. Ally for passage, or sell them out for coin. Betrayal means bounty and scent-hounds.',
      tags: ['rust-barons', 'vane', 'bazaar', 'faction'],
    },
    {
      id: 'vg-lore-4',
      title: 'Chorus of Seers',
      category: 'faction',
      body: 'Glass Wastes mystics. First-Voice Elara wants the cylinder broadcast to start a revolution. Ally to decode it, or sell her people to bounty hunters. Betrayal means resonance sabotage.',
      tags: ['chorus', 'elara', 'seers', 'wastes'],
    },
    {
      id: 'vg-lore-5',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If Silas walks with you, two people in the dark — arguments, watches, his sister’s debt. If he Left, the tunnels are quieter. If Rival, he funds traps ahead of you. Never a silent pack mule.',
      tags: ['silas', 'party', 'solo', 'rival'],
    },
  ],

  keyNPCs: [
    {
      id: 'vg-npc-1',
      name: 'Silas Blackwood',
      role: 'Thief, optional companion or rival',
      disposition: 'ambiguous',
      description: 'Split lip, soot-stained hands, knows the smuggler routes. Wants a cut of the cylinder to buy his sister out of the debt-prisons. Betrayal: he survives, funds himself, and hunts you.',
      hooks: ['Offer the smuggler route', 'Ask if they can be trusted', 'Become a rival if shoved or sold'],
    },
    {
      id: 'vg-npc-2',
      name: 'Baroness Vane',
      role: 'Leader of the Rust-Barons',
      disposition: 'neutral',
      description: 'Wants monopoly on aether-tech and the city’s records burned. Ally for passage. Betrayal: permanent bounty and mechanized scent-hounds that interrupt rest.',
      hooks: ['Offer safe passage for a price', 'Buy the cylinder', 'Hunt you if sold out'],
    },
    {
      id: 'vg-npc-3',
      name: 'First-Voice Elara',
      role: 'Leader of the Chorus of Seers',
      disposition: 'ambiguous',
      description: 'Wants the Vesper-Glass broadcast as holy revolution. Helpful decoder. Betrayal: long-range resonance that blinds and deafens at the worst moment. Solo honest delivery: she may erase the messenger.',
      hooks: ['Offer to decode the cipher', 'Demand the broadcast', 'Sabotage if betrayed'],
    },
    {
      id: 'vg-npc-4',
      name: 'Orik the Tinker',
      role: 'Under-Bazaar merchant',
      disposition: 'neutral',
      description: 'Buys rare aether-metals. Betrayal: sells your location to Guild Enforcers and rigs gear you bought from him to fail in the next fight.',
      hooks: ['Trade metals', 'Fence a favor', 'Rig your kit if crossed'],
    },
  ],

  starterQuests: [
    {
      id: 'vg-quest-1',
      title: 'Out of the Archives',
      description:
        'Escape the flooded Archivist Guild with the Vesper-Glass. Decide whether to trust Silas. Reach a safehouse in the Under-Bazaar before the Enforcers lock the district.',
      recommendedLevel: 1,
      objectives: ['Answer Silas’s offer', 'Get out of the flooded tunnels', 'Secure a place to hide the cylinder'],
      rewards: 'A companion, a rival, or both',
    },
  ],

  starterItems: [
    {
      id: 'vg-coat',
      name: 'Oil-Stained Trench Coat',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      description: 'Heavy, water-resistant, hidden smuggler pockets. What you wore into the Archives. Not armor plate.',
      provenance: 'On you when the bells started',
    },
    {
      id: 'vg-cylinder',
      name: 'Vesper-Glass Cylinder',
      rarity: 'Rare',
      itemType: 'quest',
      itemLevel: 1,
      description: 'Brass, humming blue gas, shifting dials. The unedited history of Oakhaven. Not a weapon.',
      provenance: 'Stolen from the Flooded Archives',
    },
  ],
};
