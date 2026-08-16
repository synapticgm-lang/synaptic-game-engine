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
  genreTag: 'Murder mystery',
  tagline: 'Six guests, one corpse, and a pocket watch counting down to the next murder.',
  shortDescription:
    'Lord Harrington is dead on the rug, a pocket watch ticks backward in your hand, and Beatrice knows a servants’ passage — if you will not pin the murder on her.',
  licenseNote:
    'Original SynapticGM locked-room mystery. Aristocratic blackmail and hidden passages as tropes. Not based on Clue/Cluedo, Knives Out, Fable, Albion, or any named series, film, or board game.',
  startingLocation: 'the Billiard Room of Giltwood Estate',
  worldOutlineId: null,
  replaceDefaultLoadout: true,
  startingContainer: { id: 'ge-jacket', name: 'Smoking-jacket pockets', capacity: 12 },

  openingMode: 'scene',
  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'Midnight has already struck. Confirm your name, then where this storm opens.',
  },
  openingHook:
    'Thunder rattles the stained glass. The grandfather clock strikes midnight and almost hides the thud of Lord Harrington’s body on the Persian rug. From his stiffening fingers you pry a silver pocket watch that runs stubbornly backward. Beatrice, the parlor maid, drops a tray of brandy. Wild-eyed, she whispers the servants’ passage to the wine cellar — if you swear not to leave her alone. The next page waits on the watch, the body, and whether you believe her.',
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
- Beatrice offers the servants’ passage. Walk with her = Walks With You. Name her as the killer without proof = Rival. Slip away = Left. Stamps stick.
- Kitchen and guests remember who you sold out. Graves wants a tidy arrest by dawn, guilt optional.
- If the player types “it was X” or accuses a named person, that is HIDDEN ACCUSED. Honor it.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. Billiard Room. Body. Watch. Beatrice’s first lie or truth. First player comment is in-character.
2. One room, one clue (search or talk). Do not tour the whole house.
3. Someone accuses the player — or the player accuses first.
4. A second clue that fits HIDDEN CLUES. A wrong theory may still spread.
5. Vault / watch combination names the HIDDEN CULPRIT. Never invent a different killer.
6. Dawn: Graves, the accused, and Beatrice-as-rival (if stamped) in one room.
7. Play the ending from accused vs culprit + what they did with the watch. Never end in the opening hour. Never name endings.

HIDDEN CULPRIT (BINDING): Code already picked who did it. Honor HIDDEN CULPRIT in the rails. Plant consistent clues only when the player looks, talks, or searches. Do not accuse someone else as the true killer. Do not spoil the name in the opening hour. If Beatrice is the culprit and Walks With You, she is still guilty — the honest ending is a tragic reveal, not an agency HEA.

SIDE SEEDS (writer only — spawn when earned; never dump):
- Taxidermy bear: hollow glass eye hides a microscopic will.
- Cigar-ash trail to a dumbwaiter that only runs on one dissonant piano chord.
- Greenhouse orchids watered with an undetectable paralytic.
- Bloodstained monocle in the reading-room sofa.
- East-wing armor inches toward the stairs with each lightning flash.
- Love letter in the master fireplace burns scentless green.

OPENING KIT (AUTHORITY): Tailored velvet smoking jacket and the Backward Watch are the kit. Never invent an iron shortsword or a candlestick-as-starting-weapon. Search for a murder weapon is a scene choice, not starting loot.

ENDINGS (pick one after beat 7; never list in play — keyed to accused vs culprit, not a MacGuffin shop):
- Right name + watch to Graves: the HIDDEN CULPRIT is taken. If Beatrice stayed and is innocent, a detective partnership. If she is the culprit, she is arrested.
- Wrong name + watch to Graves: the accused hangs or is ruined; the true killer walks. You may be paid for a tidy file.
- No accusation + watch burned: the storm takes the proof; you leave penniless; the killer remains in the house.
- You frame someone else (forged confession): you inherit; the HIDDEN CULPRIT still did the first murder.
- You take the fall (solo, no witness): Graves pins it on you; you hang at dawn.
- You bury the watch and stay: blackmail and empty halls; you wait for the HIDDEN CULPRIT.

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
    {
      id: 'ge-npc-5',
      name: 'Aldric Voss',
      role: 'Harrington’s solicitor, dinner guest',
      disposition: 'ambiguous',
      description: 'Carries the draft of a new will. Polite, dry, always between rooms. Do not introduce until the player meets the guests or searches the study.',
      hooks: ['Mention the unsigned will', 'Offer a private reading', 'Ask who inherits'],
    },
    {
      id: 'ge-npc-6',
      name: 'Celeste Vale',
      role: 'Dinner guest',
      disposition: 'ambiguous',
      description: 'Jewels a shade too bright for her debts. Laughs late. Do not introduce until the drawing-room quarantine or a guest list.',
      hooks: ['Ask about Harrington’s last toast', 'Hide a letter', 'Offer an alibi for a price'],
    },
  ],

  styleRail: `FORK STYLE (BINDING): search a room, ask who last saw him, pocket or plant the watch, accuse a named person, stay and lie to Graves. Do not offer take-hand / shove-as-bait / hide-MacGuffin / tap-MacGuffin unless they typed that.
SPINE OVERRIDE: This is a locked-room mystery, not a two-faction war. One clue per beat. Honor HIDDEN CULPRIT, HIDDEN CLUES, HIDDEN ACCUSED.
ENDING LOGIC: Key on whether they named the right person and what they did with the watch. Do not play deliver/keep/sell/burn/forge as the only menu.`,

  mysteryCluePools: {
    weapons: [
      'a brass letter-opener wiped and left in the ice bucket',
      'a curtain cord cut and retied',
      'a hatpin snapped at the tip, blood in the groove',
      'the heavy billiard cue, one end freshly waxed',
    ],
    tells: [
      'Harrington’s right cuff is buttoned by the wrong hand',
      'the brandy on the rug is unsipped — he never drank it',
      'the backward watch was forced into his fist after death',
      'ash on the hearth matches a cigar no guest admits to',
    ],
    covers: [
      'the first loud story is that a poacher came through the garden',
      'someone swears they heard a second shot that never happened',
      'a guest claims they were at the piano the whole hour',
      'the staff were told to say he collapsed of the heart',
    ],
  },

  mysteryCulprits: [
    {
      id: 'ge-npc-1',
      name: 'Beatrice',
      role: 'Parlor maid',
      motive: 'Harrington meant to have her transported for a theft she did not commit. The watch was her proof — and her panic.',
    },
    {
      id: 'ge-npc-2',
      name: 'Chef Bouchard',
      role: 'Kitchen staff',
      motive: 'Harrington threatened a dawn raid that would take Bouchard’s undocumented people. The billiard room was quieter than a courtroom.',
    },
    {
      id: 'ge-npc-3',
      name: 'Lady Genevieve',
      role: 'Aristocratic guest',
      motive: 'The affair was going into the papers. She stopped Harrington’s mouth before the watch could open the vault.',
    },
    {
      id: 'ge-npc-4',
      name: 'Inspector Graves',
      role: 'The law',
      motive: 'Harrington had proof of Graves’ bought cases. Graves arrived early, did the work, then put on the badge.',
    },
    {
      id: 'ge-npc-5',
      name: 'Aldric Voss',
      role: 'Solicitor',
      motive: 'The new will cut him out. He needed Harrington dead before dawn witnesses signed.',
    },
    {
      id: 'ge-npc-6',
      name: 'Celeste Vale',
      role: 'Dinner guest',
      motive: 'Harrington was going to name her forged jewels and ruin her. She struck first.',
    },
  ],

  starterQuests: [
    {
      id: 'ge-quest-1',
      title: 'Away from the Rug',
      description:
        'Leave the Billiard Room with the Backward Watch before the dinner party converges. Decide whether to trust Beatrice. Hide before you are framed. Unravel the watch before the killer names you.',
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
