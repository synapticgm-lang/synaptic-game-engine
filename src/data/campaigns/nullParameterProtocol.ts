import type { CampaignBible } from './types';

/**
 * Original SynapticGM PYOA: botched hero-summon, office clothes, admin crystal.
 * Isekai/system tropes as fiction — not SAO, Fable, or any licensed world.
 * Engine is PYOA (no real XP HUD); the world's "System" is a story object they can crash.
 */
export const nullParameterProtocol: CampaignBible = {
  id: 'null-parameter-protocol',
  title: 'The Null-Parameter Protocol',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Standard',
  tagline: 'You were summoned to save their world, but you just found the admin password to destroy it.',
  shortDescription:
    'Isekai with the cheat in your pocket. Cubicle to a smoking summoning dais, ERROR 404 in your eyes, Kaelen offering a cloak. Side with glitch-rebels or the Crown — several endings.',
  licenseNote:
    'Original SynapticGM isekai/system tropes (screens, glitches, overpowered anomalies). Not based on Sword Art Online, Fable, Albion, or any named novel, anime, or game.',
  startingLocation: 'the Shattered Summoning Dais of Aethelgard',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'np-suit', name: 'Suit pockets', capacity: 14 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'The cubicle is already gone. Confirm your name, then where this failed summon opens.',
  },
  openingHook:
    'Office fluorescent light is gone. Ozone. Shattered obsidian pillars into a crimson sky. You lie in a crater of geometric runes, clutching a polyhedral crystal that throws translucent ERROR 404: HERO NOT FOUND into your eyes. Kaelen, a rogue battle-mage, bleeds from backlash and offers a trembling hand and his cloak — the Royal Vanguard’s Level-Capped executioners are coming to purge failed summoners. The next page waits on whether you take his hand.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Where does this open? The shattered dais is the default. You may name another Aethelgard place, or pick random.',
      suggestions: ['The Shattered Summoning Dais of Aethelgard', 'Random place', 'The jagged wilds beyond the crater'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing. Named garments — Earth clothes unless you say otherwise.',
      suggestions: ['Coffee-stained business suit', 'What I had on at the office', 'Earth clothes, no armor'],
    },
  ],

  premise: `PLAYER AGENCY (BINDING): Main spine only — not an open MMO map. Do not dump a zone list. Side seeds stay hidden until the player looks, talks, hacks, or wanders. Code owns stamps and kit. Writer: this turn’s camera only (2–6 sentences, then 3–4 local forks).

ENGINE (BINDING): This is Pick Your Own Adventure, not live LitRPG chrome. Do not emit XP tickers, level-up panels, or 5e dice. The world's "System" is in-fiction: holographic errors, classes, and glitches the player can crash, sell, or forge. Describe those as story, never as our HUD.

INNER VOICE (BINDING): Typed comments, jokes, and doubts ARE the hero thinking or speaking. Mirror them in <thought> or dialogue, then the world answers. Never overwrite their personality. Honor PERSPECTIVE. No meta. No Sword Art Online plots, log-out buttons as the story, or named series.

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Kaelen offers cloak and wilds. Take his hand = Walks With You. Trip him into the Vanguard = Rival. Pocket the crystal and play victim = Left (or Vanguard path). Stamps stick; betrayal is not forgiven.
- Cipher-Lord Elara (Glitch-Walkers) vs Commander Vane (Royal Vanguard). Ally or sell out. Both remember.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. Shattered dais. Genesis Matrix in hand. Kaelen’s offer. Vanguard coming. First player comment is in-character.
2. Outlands. Glitch-Walkers / Elara. System bypasses vs Crown bounty.
3. Fortified checkpoint. Vanguard / Vane. Noble status vs leaking patrol routes.
4. Firewall Dungeon / Server-Keep — the System trying to delete invalid entities.
5. Administrator's truth: this reality is a harvesting simulation; the Kings are bloated admin programs.
6. Bandwidth clash: Walkers, Vanguard, and Kaelen-as-rival (if stamped) converge on the Server-Keep.
7. Resolve the Matrix: deliver to a faction, keep for raw power, sell to a noble, burn to delete magic, or forge a new admin reality. Then play the matching ending. Never end in the opening hour. Never name endings.

SIDE SEEDS (writer only — spawn when earned; never dump):
- Northern border is unrendered white that unmakes matter.
- Sword-in-stone is a corrupted localization file; pulling it reverses your speech into riddles.
- Goblin “respawn tokens” are polished river rocks.
- Sewer slimes dissolve armor but not Earth plastic — an office pen can matter.
- A cult worships a giant glowing 404 over the deadlands.
- Capital “Fountain of Healing” is a broken texture leaking unformatted mana.
- Hidden tavern: NPCs loop the same line; their quest scripts crashed years ago.

OPENING KIT (AUTHORITY): Coffee-stained business suit and the Genesis Matrix are the kit. Never invent an iron shortsword or a starter spellbook. “+10 Confusion” is flavor for how people stare at Earth clothes — not a real stat block.

ENDINGS (pick one after beat 7; never list in play):
- Honest delivery + Kaelen stayed: Matrix to Elara; system crashed; levels gone; you two are legends in chaotic free magic.
- Sell to Vane + Kaelen left or rival: max-title palace. If Rival, he glitches the walls and deletes your file; cut to black.
- Burn + Kaelen stayed: Matrix into a null-void; magic and UI die; the world becomes ordinary; you wander as mortals.
- Forge + solo: rewrite core code; you are unchallenged admin; no Kaelen left who remembers the cubicle.
- Hoard + Kaelen left: keep the cheat unused; hunted by kill-squads and hackers; never safe enough to sleep.
- Honest delivery + solo: Walkers free the system; without a witness they treat you as a foreign virus; Elara quarantines you into a forgotten patch.

Do not name the Server-Keep as visited until they breach it. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'np-lore-1',
      title: 'Aethelgard Dais',
      category: 'world',
      body: 'A failed hero-summon. The crater still smokes. Earth clothes. ERROR 404 in the eyes. Not an open-world map. The Vanguard is already coming to purge “failed” summoners.',
      tags: ['aethelgard', 'dais', 'summon', 'opening'],
    },
    {
      id: 'np-lore-2',
      title: 'The Genesis Matrix',
      category: 'mechanic',
      body: 'A polyhedral crystal terminal to the world’s source code. Holographic error logs. Deliver, keep, sell, burn, or forge. Not a sword. In-fiction System only — our engine does not print XP.',
      tags: ['matrix', 'macguffin', 'admin', 'quest'],
    },
    {
      id: 'np-lore-3',
      title: 'Glitch-Walkers',
      category: 'faction',
      body: 'Outland rebels under Cipher-Lord Elara. They exploit magic bugs to escape Classes and Levels. Ally for bypasses. Betrayal: your profile shuffles or drops at the worst moment.',
      tags: ['glitch-walkers', 'elara', 'rebels', 'faction'],
    },
    {
      id: 'np-lore-4',
      title: 'Royal Vanguard',
      category: 'faction',
      body: 'The King’s elite. Commander Vane wants the Matrix to hard-code royal authority and delete rebels. Ally for papers and passage. Betrayal: a permanent aggro tag — guards and beasts turn on you.',
      tags: ['vanguard', 'vane', 'crown', 'faction'],
    },
    {
      id: 'np-lore-5',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If Kaelen walks with you, two people in the wilds — his cloak, his disgrace, his hope the ritual was not a failure. If he Left, the errors are quieter. If Rival, he builds anomaly-hunter spells from your Earth tells. Never a silent pack mule.',
      tags: ['kaelen', 'party', 'solo', 'rival'],
    },
  ],

  keyNPCs: [
    {
      id: 'np-npc-1',
      name: 'Kaelen',
      role: 'Botched summoner, optional companion or rival',
      disposition: 'ambiguous',
      description: 'Bleeding backlash, fractured staff. Wants to prove the ritual and restore his family’s honor. Betrayal: rogue anti-hero who locks your skill trees with anomaly-hunter spells.',
      hooks: ['Offer cloak and the wilds', 'Beg the summon was not a failure', 'Hunt you if used as bait'],
    },
    {
      id: 'np-npc-2',
      name: 'Cipher-Lord Elara',
      role: 'Leader of the Glitch-Walkers',
      disposition: 'neutral',
      description: 'Wants the governing System crashed so Classes and Levels no longer own people. Betrayal: remote profile corruption. Solo delivery: she may quarantine you as a foreign virus.',
      hooks: ['Offer system bypasses', 'Ask you to crash the System', 'Delete you if you arrive without a witness'],
    },
    {
      id: 'np-npc-3',
      name: 'Commander Vane',
      role: 'Leader of the Royal Vanguard',
      disposition: 'hostile',
      description: 'Wants the Matrix to lock the King’s authority and wipe rebels. Ally for noble status. Betrayal: aggro marker — monsters and town guards attack on sight.',
      hooks: ['Offer safe passage and title', 'Purge failed summoners', 'Tag you if sold out'],
    },
  ],

  starterQuests: [
    {
      id: 'np-quest-1',
      title: 'Hero Not Found',
      description:
        'Survive the botched summon at the shattered dais. Decide whether to trust Kaelen. Reach the Outlands before the Vanguard flags you as a lethal anomaly. Decipher the Genesis Matrix — manipulate the System or destroy it.',
      recommendedLevel: 1,
      objectives: ['Answer Kaelen’s offer', 'Get off the dais', 'Keep the Genesis Matrix'],
      rewards: 'A companion, a rival, or both',
    },
  ],

  starterItems: [
    {
      id: 'np-suit',
      name: 'Coffee-Stained Business Suit',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      description: 'Off-the-rack Earth suit. No armor plate. People stare; some hesitate. Not a weapon. Not a real +10 stat block.',
      provenance: 'What you were wearing in the cubicle',
    },
    {
      id: 'np-matrix',
      name: 'Genesis Matrix',
      rarity: 'Rare',
      itemType: 'quest',
      itemLevel: 1,
      description: 'Heavy polyhedral crystal. Physical terminal to this world’s source code. Holographic error logs. Not a sword.',
      provenance: 'In your hand when the cubicle vanished',
    },
  ],
};
