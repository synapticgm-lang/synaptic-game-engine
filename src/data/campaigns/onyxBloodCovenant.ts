import type { CampaignBible } from './types';

/**
 * Original SynapticGM NSFW PYOA: adult dark paranormal romance, fated mates, urban packs.
 * Tropes only — not Black Dagger Brotherhood, House of Crimson Hearts, Twilight, Underworld, Anita Blake, Fable, or Albion.
 */
export const onyxBloodCovenant: CampaignBible = {
  id: 'onyx-blood-covenant',
  title: 'The Onyx Blood Covenant',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Standard',
  genreTag: 'Dark romance',
  nsfw: true,
  tagline: 'In a city ruled by shadows, the most dangerous weapon is a heart that still beats.',
  shortDescription:
    'Dark paranormal romance. Bass in an underground club, a flesh-bound ledger of fated mates against your chest, and Kaelen offering his motorcycle before the Lycans finish the bouncer. Packs or coven — several endings.',
  licenseNote:
    'Original SynapticGM dark paranormal romance tropes (brooding shadow-warriors, fated mates, urban packs, aristocratic vampires). Not based on Black Dagger Brotherhood, House of Crimson Hearts, Twilight, Underworld, Anita Blake, Fable, Albion, or any named novel, game, or film. Do not use those brands or their proper nouns in play.',
  startingLocation: "The VIP Mezzanine of 'The Obsidian Orchid'",
  replaceDefaultLoadout: true,
  startingContainer: { id: 'obc-jacket', name: 'Moto-jacket pockets', capacity: 14 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'The bass is already in your ribs. Confirm your name, then where this club opens.',
  },
  openingHook:
    "Heavy bass shakes the VIP mezzanine of The Obsidian Orchid. A rogue Lycan snaps the bouncer’s neck. You clutch the Sanguine Ledger — flesh-bound true fated-mating registries of the Night-Lords — against your chest. Kaelen, a muscled, tattooed shadow-warrior, wipes crimson from his jaw. His eyes are possessive. He extends a leather-clad hand: his motorcycle out back is the only way to survive the night. The next page waits on whether you take his hand.",
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: "Where does this open? The VIP Mezzanine of The Obsidian Orchid is the default. You may name another night-city place, or pick random.",
      suggestions: ["The VIP Mezzanine of 'The Obsidian Orchid'", 'Random place', 'The alley behind the club'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing. Named garments.',
      suggestions: ['Midnight Leather Moto-Jacket', 'Club leather and dark silk', 'What I wore into the VIP'],
    },
  ],

  premise: `NSFW (BINDING): This is adult dark romance — not fade-to-black vanilla. Heat, sex, violence, possessive/obsessive attraction, and explicit scenes are in-tone when the player steers there. Do not fade to black by default. Writer: this turn’s camera only (2–6 sentences, then 3–4 local forks). Never involve minors. Honor PERSPECTIVE.

LICENSE (BINDING): Original dark paranormal romance tropes (brooding shadow-warriors, fated mates, urban packs, aristocratic vampires). Never name Black Dagger Brotherhood, House of Crimson Hearts, Twilight, Underworld, Anita Blake, Fable, Albion, or any named IP. Never use those brands in play.

ENGINE (BINDING): This is Pick Your Own Adventure, not live LitRPG chrome or 5e dice. Do not emit XP tickers or health bars. Romantic affinities and hexes are story objects: describe them in the body, never as our HUD.

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Kaelen offers his motorcycle. Take his hand / the bike = Walks With You. Shove him at the Lycan = Rival. Hide the Ledger in the corset and strut past = Left. Stamps stick; betrayals repaid in blood and never forgiven.
- Alpha Rane (Iron Claws) vs High-Priestess Seraphina (Velvet Coven). Ally or sell out. Both remember.

ENDINGS (BINDING — pick after beat 7; never name in play): honest+stayed HEA; sell+Left/Rival cold throne or explicit lethal revenge; burn+stayed free dawn; forge+solo hollow harem; hoard+Left alone; honest+solo rainy-alley martyr.

PLAYER AGENCY (BINDING): Main spine only — not an open city map. Do not dump a district list. Side seeds stay hidden until the player looks, talks, drinks, or wanders. Code owns stamps and kit.

INNER VOICE (BINDING): Typed comments, jokes, and doubts ARE the hero thinking or speaking. Mirror them in <thought> or dialogue, then the world answers. Never overwrite their personality. No meta.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. VIP Mezzanine of The Obsidian Orchid. Rogue Lycan snaps the bouncer’s neck. Sanguine Ledger against the chest. Kaelen’s motorcycle offer. Adult tone, not a sex scene in sentence one unless they choose it. Club escape: party, solo, or bait with Kaelen.
2. Iron Claws chop shops. Alpha Rane. Ally for muscle and territory, or a silver-laced ambush.
3. Velvet Coven siren witches. High-Priestess Seraphina. Ally for cloaking and seduction, or sell out to the Night-Lords.
4. Black Keep — warded vampire penthouse. Blood-Font to unseal the Ledger.
5. Revelation: Night-Lords have been artificially severing true fated-mate bonds for centuries to keep pureblood power.
6. Blood Moon Convergence: Iron Claws, Velvet Coven, and Kaelen-as-rival (if stamped) on the penthouse balcony.
7. Resolve the Ledger: deliver to the resistance, keep to rule bonds, sell to Night-Lords, burn fate, or forge your own destiny. Then play the matching ending. Never end in the opening hour. Never name endings.

SIDE SEEDS (writer only — spawn when earned; never dump):
- A succubus speakeasy takes erotic memories as currency.
- Cathedral gargoyles are petrified warriors woken by a kiss of royal blood.
- An underground fight club will stake a human familiar.
- Midnight lotus aphrodisiac can override a master vampire.
- The bridge toll-keeper’s silver chains protect the city FROM him.
- Abandoned subway ferries cursed sentient weapons that feed on lust.

OPENING KIT (AUTHORITY): Midnight Leather Moto-Jacket and the Sanguine Ledger are the kit. Never invent an iron shortsword or a starter firearm. Hex-warding on the jacket is flavor, not a real armor stat block. No weapons at start. The silver-tipped stiletto is a scene option in one opening choice, not starting loot.

ENDINGS (detail after beat 7; never list in play):
- Honest + Kaelen stayed: resistance; bonds snap back; you two are bound; penthouse HEA.
- Sell to Night-Lords + Left/Rival: your own throne, cold bed. If Rival, shattered bedroom window; he pins you; violently passionate lethal revenge; may be explicit; cut to black.
- Burn + Kaelen stayed: sacred fire destroys fated bonds; you ride into dawn choosing each other freely.
- Forge + solo: rewrite bonds; Queen of the night; harem of bound lovers, none by choice; hollow reign.
- Hoard + Left: warded vault; paranoid ghost; alone.
- Honest + solo: resistance wins; no protector; a Night-Lord drains you in a rainy alley; tragic martyr.

Do not name the Black Keep as visited until they breach it. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'obc-lore-1',
      title: 'The Obsidian Orchid',
      category: 'world',
      body: "VIP mezzanine of an underground night club. Heavy bass. A rogue Lycan has already snapped the bouncer’s neck. Not an open-world map. Kaelen’s motorcycle is out back.",
      tags: ['obsidian-orchid', 'club', 'opening', 'night-city'],
    },
    {
      id: 'obc-lore-2',
      title: 'The Sanguine Ledger',
      category: 'mechanic',
      body: 'A flesh-bound book of true fated-mating registries of the Night-Lords. Deliver to the resistance, keep to rule bonds, sell, burn fate, or forge your own destiny. Not a weapon. A story object — our engine does not print XP or affinity meters.',
      tags: ['ledger', 'macguffin', 'fated-mates', 'quest'],
    },
    {
      id: 'obc-lore-3',
      title: 'The Iron Claws',
      category: 'faction',
      body: 'Urban pack under Alpha Rane. Ally for muscle and territory. He wants true mates of his pack freed from vampire subjugation. Betrayal: scent of death; wolves ambush at vulnerable or intimate moments.',
      tags: ['iron-claws', 'rane', 'lycan', 'faction'],
    },
    {
      id: 'obc-lore-4',
      title: 'The Velvet Coven',
      category: 'faction',
      body: 'Siren witches under High-Priestess Seraphina. Ally for cloaking and seduction. She wants ley-lines via blackmail. Betrayal: a hex so anyone you try to seduce, ally, or romance finds your presence agonizing.',
      tags: ['velvet-coven', 'seraphina', 'witches', 'faction'],
    },
    {
      id: 'obc-lore-5',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If Kaelen walks with you, brooding protective loyalty — he wants the Ledger to prove his fated mate was stolen. If he Left, the night is quieter. If Rival, he becomes an obsessed stalker-rival who destroys safehouses to corner you. Never a silent pack mule.',
      tags: ['kaelen', 'party', 'solo', 'rival'],
    },
  ],

  keyNPCs: [
    {
      id: 'obc-npc-1',
      name: 'Kaelen',
      role: 'Optional companion or rival',
      disposition: 'ambiguous',
      description: 'Muscled, tattooed shadow-warrior. Offers his motorcycle. Wants the Ledger to prove his fated mate was stolen. Brooding protective loyalty. Betrayal: obsessed stalker-rival who destroys safehouses to corner you.',
      hooks: ['Offer the motorcycle', 'Ask about the stolen mate', 'Hunt you if shoved at the Lycan'],
    },
    {
      id: 'obc-npc-2',
      name: 'Alpha Rane',
      role: 'Leader of the Iron Claws',
      disposition: 'hostile',
      description: 'Wants true mates of his pack freed from vampire subjugation. Ally for muscle and territory. Betrayal: scent of death; wolves ambush at vulnerable or intimate moments.',
      hooks: ['Offer pack muscle', 'Ask for the Ledger', 'Ambush at an intimate moment if sold out'],
    },
    {
      id: 'obc-npc-3',
      name: 'High-Priestess Seraphina',
      role: 'Leader of the Velvet Coven',
      disposition: 'hostile',
      description: 'Wants ley-lines via blackmail. Ally for cloaking and seduction. Betrayal: a hex so anyone you try to seduce, ally, or romance finds your presence agonizing.',
      hooks: ['Offer cloaking and seduction', 'Ask for the Ledger', 'Hex your presence if sold out'],
    },
  ],

  starterQuests: [
    {
      id: 'obc-quest-1',
      title: 'The Night Still Beats',
      description:
        "Survive the Lycan attack on the VIP mezzanine of The Obsidian Orchid. Decide whether to trust Kaelen. Reach a night-city safehouse before the pack finishes the club. Learn what the Sanguine Ledger truly is and decide the city’s fate.",
      recommendedLevel: 1,
      objectives: ['Answer Kaelen’s offer', 'Get out of the club', 'Keep the Sanguine Ledger'],
      rewards: 'A companion, a rival, or both',
    },
  ],

  starterItems: [
    {
      id: 'obc-jacket',
      name: 'Midnight Leather Moto-Jacket',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      description: 'Black leather cut for night streets and a motorcycle. Hex-warding stitched into the lining is flavor, not a real armor stat block. Not a weapon.',
      provenance: 'What you were wearing when the Lycan hit the mezzanine',
    },
    {
      id: 'obc-ledger',
      name: 'Sanguine Ledger',
      rarity: 'Rare',
      itemType: 'quest',
      itemLevel: 1,
      description: 'A flesh-bound book of true fated-mating registries of the Night-Lords. Not a starter weapon.',
      provenance: 'Clutched to your chest as the bouncer died',
    },
  ],
};
