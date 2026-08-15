import type { CampaignBible } from './types';

/**
 * Original SynapticGM PYOA: locked-room estate murder, backward pocket watch.
 * Mystery tropes only — not Clue/Cluedo, Knives Out, Fable, or any licensed world.
 */
export const giltwoodEstate: CampaignBible = {
  id: 'giltwood-estate-conundrum',
  title: 'The Giltwood Estate Conundrum',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Standard',
  tagline: 'Six guests, one corpse, and a pocket watch counting down to the next murder.',
  shortDescription:
    'Locked-room mystery. Lord Harrington is dead on the rug, a pocket watch ticks backward in your hand, and Beatrice knows a servants’ passage — if you will not pin the murder on her.',
  licenseNote:
    'Original SynapticGM locked-room mystery. Aristocratic blackmail and hidden passages as tropes. Not based on Clue/Cluedo, Knives Out, Fable, Albion, or any named series, film, or board game.',
  startingLocation: 'the Billiard Room of Giltwood Estate',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'ge-jacket', name: 'Smoking-jacket pockets', capacity: 12 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'Midnight has already struck. Confirm your name, then where this storm opens.',
  },
  openingHook:
    'Thunder rattles the stained glass. The grandfather clock strikes midnight and almost hides the thud of Lord Harrington’s body on the Persian rug. From his stiffening fingers you pry a silver pocket watch that runs stubbornly backward. Beatrice, the parlor maid, drops a tray of brandy. Wild-eyed, she whispers the servants’ passage to the wine cellar — if you swear not to leave her alone. The next page waits on whether you take her hand.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Where does this open? The Billiard Room is the default. You may name another Giltwood room, or pick random.',
      suggestions: ['The Billiard Room', 'Random place', 'The servants’ passage'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing. Named garments.',
      suggestions: ['Plum velvet smoking jacket', 'Evening clothes, nothing fancy', 'What I wore to dinner'],
    },
  ],

  premise: `PLAYER AGENCY (BINDING): Main spine only — not an open manor sandbox. Do not dump a floor plan. Side seeds stay hidden until the player looks, talks, or wanders. Code owns stamps and kit. Writer: this turn’s camera only (2–6 sentences, then 3–4 local forks).

INNER VOICE (BINDING): Typed comments, jokes, and doubts ARE the hero thinking or speaking. Mirror them in <thought> or dialogue, then the world answers. Never overwrite their personality. Honor PERSPECTIVE and the session’s visual style. No meta (“the sheet”, “alignment”). Never name Clue/Cluedo characters, rooms-as-a-board, or Knives Out plots.

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Beatrice offers the servants’ passage. Take her hand = Walks With You. Accuse her as the fall guy = Rival. Slip away without her = Left. Stamps stick; betrayal is not forgiven.
- Chef Bouchard (Kitchen Staff) vs Lady Genevieve (Aristocratic Suspects). Ally or sell out. Both remember.
- Inspector Graves wants a tidy arrest by dawn, guilt optional.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. Billiard Room. Harrington dead. Backward Watch. Beatrice’s plea. First player comment is in-character.
2. Servants’ quarters. Kitchen Staff / Bouchard. Passkeys vs selling them to the police for an alibi.
3. Drawing room quarantine. Aristocrats / Genevieve. Political cover vs leaking their scandals.
4. Locked study — Harrington’s trapped inner sanctum; cipher key.
5. Revelation: the watch is a combination to a vault proving the guests conspired.
6. Glasshouse climax: staff, aristocrats, and Beatrice-as-rival (if stamped) converge in a storm.
7. Resolve the watch: deliver to Graves, keep for blackmail, sell to the guilty, burn in the fireplace, or forge a fake confession. Then play the matching ending. Never end in the opening hour. Never name endings.

SIDE SEEDS (writer only — spawn when earned; never dump):
- Taxidermy bear: hollow glass eye hides a microscopic will.
- Cigar-ash trail to a dumbwaiter that only runs on one dissonant piano chord.
- Greenhouse orchids watered with an undetectable paralytic.
- Bloodstained monocle in the reading-room sofa.
- East-wing armor inches toward the stairs with each lightning flash.
- Love letter in the master fireplace burns scentless green.

OPENING KIT (AUTHORITY): Tailored velvet smoking jacket and the Backward Watch are the kit. Never invent an iron shortsword or a candlestick-as-starting-weapon. Search for a murder weapon is a scene choice, not starting loot.

ENDINGS (pick one after beat 7; never list in play):
- Honest delivery + Beatrice stayed: Graves gets the watch with her corroboration; true killer caught; you open a detective agency together.
- Sell to Genevieve + Beatrice left or rival: hush-money manor. If Rival, she slips in as the new maid; poison in the brandy; cut to black.
- Burn + Beatrice stayed: watch into the glasshouse furnace; secrets die; you sneak into the storm penniless and free.
- Forge + solo: master confession naming everyone else; you as sole beneficiary; no Beatrice left to contradict you; you inherit.
- Hoard + Beatrice left: blackmail the survivors; fabulous and paranoid in empty halls, waiting for the real killer.
- Honest delivery + solo: conspiracy uncovered; Graves pins the first murder on you for a tidy file; you hang at dawn.

Do not name the locked study as visited until they force that door. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'ge-lore-1',
      title: 'Giltwood Estate',
      category: 'world',
      body: 'A storm-locked country house. The Billiard Room is where it opens — midnight, Harrington dead, backward watch. Not a board-game loop of rooms. Hidden passages exist because Beatrice knows them, not because a box lid listed them.',
      tags: ['giltwood', 'billiard-room', 'storm', 'opening'],
    },
    {
      id: 'ge-lore-2',
      title: 'The Backward Watch',
      category: 'history',
      body: 'Silver pocket watch ticking counter-clockwise. A micro-cryptex, not gears. Combination to a vault of conspiracy proof. Deliver, keep, sell, burn, or forge. Not a weapon.',
      tags: ['watch', 'macguffin', 'cipher', 'quest'],
    },
    {
      id: 'ge-lore-3',
      title: 'Kitchen Staff',
      category: 'faction',
      body: 'Downstairs under Chef Bouchard. He wants undocumented workers hidden from a dawn police raid. Ally for passkeys. Sell them out and your evening tea turns paranoid.',
      tags: ['staff', 'bouchard', 'kitchen', 'faction'],
    },
    {
      id: 'ge-lore-4',
      title: 'Aristocratic Suspects',
      category: 'faction',
      body: 'Quarantined guests. Lady Genevieve wants the watch to burn proof of a bankrupting affair with Harrington. Ally for leverage. Betrayal: hounds in the gardens and bribed witnesses.',
      tags: ['genevieve', 'guests', 'aristocrats', 'faction'],
    },
    {
      id: 'ge-lore-5',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If Beatrice walks with you, two people in the dark — brandy glass, passage, her hope of a life that is not service. If she Left, the corridors are quieter. If Rival, she plants evidence in your pockets and locks doors. Never a silent extra.',
      tags: ['beatrice', 'party', 'solo', 'rival'],
    },
  ],

  keyNPCs: [
    {
      id: 'ge-npc-1',
      name: 'Beatrice',
      role: 'Parlor maid, optional companion or rival',
      disposition: 'friendly',
      description: 'Dropped the brandy. Wants her name cleared and money to leave service. Betrayal: she escapes custody, sabotages alibis, locks doors, plants evidence in your coat.',
      hooks: ['Offer the servants’ passage', 'Beg not to be left alone', 'Frame you if accused'],
    },
    {
      id: 'ge-npc-2',
      name: 'Chef Bouchard',
      role: 'Leader of the kitchen staff',
      disposition: 'neutral',
      description: 'Protects undocumented workers from a police raid. Ally for passkeys. Betrayal: hallucinogen in the evening tea.',
      hooks: ['Offer hidden keys', 'Ask you to stall the inspector', 'Dose your tea if sold out'],
    },
    {
      id: 'ge-npc-3',
      name: 'Lady Genevieve',
      role: 'Leader of the aristocratic suspects',
      disposition: 'ambiguous',
      description: 'Wants the watch to destroy proof of her affair with Harrington. Betrayal: private hounds and bribed witnesses naming you.',
      hooks: ['Offer political cover', 'Buy the watch', 'Hunt you in the gardens if leaked'],
    },
    {
      id: 'ge-npc-4',
      name: 'Inspector Graves',
      role: 'The law',
      disposition: 'neutral',
      description: 'Wants a clean arrest before dawn, true guilt optional, for a city promotion. Betrayal or a messy solo delivery: he may pin the first murder on you.',
      hooks: ['Demand a tidy story', 'Take the watch', 'Frame you if you have no witness'],
    },
  ],

  starterQuests: [
    {
      id: 'ge-quest-1',
      title: 'Away from the Rug',
      description:
        'Leave the Billiard Room with the Backward Watch before the dinner party converges. Decide whether to trust Beatrice. Hide before you are framed. Unravel the watch before the real killer names you.',
      recommendedLevel: 1,
      objectives: ['Answer Beatrice’s offer', 'Get out of the Billiard Room', 'Keep the Backward Watch'],
      rewards: 'A companion, a rival, or both',
    },
  ],

  starterItems: [
    {
      id: 'ge-jacket',
      name: 'Tailored Velvet Smoking Jacket',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      description: 'Plum velvet, silk-lined pockets deep enough for a watch or a lie. Not armor. Not a weapon.',
      provenance: 'What you wore to dinner at Giltwood',
    },
    {
      id: 'ge-watch',
      name: 'Backward Watch',
      rarity: 'Rare',
      itemType: 'quest',
      itemLevel: 1,
      description: 'Heavy silver pocket watch ticking counter-clockwise. Micro-cryptex instead of gears. Combination to a vault. Not a weapon.',
      provenance: 'Pried from Lord Harrington’s hand',
    },
  ],
};
