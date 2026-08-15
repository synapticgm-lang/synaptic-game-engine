import type { CampaignBible } from './types';

/**
 * Original SynapticGM PYOA: gothic vampire court, immortality as a cage, a vial that is a cure.
 * Gothic vampire tropes only — not Vampire Chronicles, VtM, Twilight, Buffy, Castlevania, Fable, or Albion.
 */
export const crimsonNocturne: CampaignBible = {
  id: 'crimson-nocturne',
  title: 'The Crimson Nocturne',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Standard',
  genreTag: 'Gothic vampire',
  tagline: 'Eternity is a beautiful cage, and everyone is dying for the key.',
  shortDescription:
    'Blood on your lace cuffs, the Antediluvian Ampoule torn from your slaughtered sire’s ashes, and the Inquisition’s blessed fire already at the mausoleum doors. Julian offers the catacombs — Silk Court or Ashen Dawn, several endings.',
  licenseNote:
    'Original SynapticGM gothic vampire tropes (immortality as a cage, night courts, holy inquisitions, a cursed vial). Not based on Vampire Chronicles, Vampire: The Masquerade, Twilight, Buffy, Castlevania, Fable, Albion, or any named novel, game, or film. Do not use Camarilla, Kindred, Disciplines, Blood Bond, or Gehenna.',
  startingLocation: 'The Weeping Mausoleum of House Valerius',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'cn-coat', name: 'Frock-coat pockets', capacity: 14 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'The rams are already at the stone. Confirm your name, then where this mausoleum opens.',
  },
  openingHook:
    'Blood darkens the lace at your cuffs. You ripped the Antediluvian Ampoule from your slaughtered sire’s ashes as the Inquisition’s battering rams shook the Weeping Mausoleum and blessed fire licked the marble. Julian weeps scarlet tears on a sarcophagus and offers the catacombs. The next page waits on whether you take his hand.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Where does this open? The Weeping Mausoleum is the default. You may name another Lacrimosa place, or pick random.',
      suggestions: ['The Weeping Mausoleum of House Valerius', 'Random place', 'The catacombs beneath the house'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing. Named garments.',
      suggestions: ['Midnight Damask Frock Coat', 'Black damask and lace cuffs', 'What I wore to the funeral'],
    },
  ],

  premise: `PLAYER AGENCY (BINDING): Main spine only — not an open city map. Do not dump a district list. Side seeds stay hidden until the player looks, talks, drinks, or wanders. Code owns stamps and kit. Writer: this turn’s camera only (2–6 sentences, then 3–4 local forks).

ENGINE (BINDING): This is Pick Your Own Adventure, not live LitRPG chrome or 5e dice. Do not emit XP tickers or health bars. Blood-potency, thirst, and frenzy are story: describe them in the body, never as our HUD.

INNER VOICE (BINDING): Typed comments, jokes, and doubts ARE the hero thinking or speaking. Mirror them in <thought> or dialogue, then the world answers. Never overwrite their personality. Honor PERSPECTIVE. No meta. Never name Vampire Chronicles, Lestat, Anne Rice, Vampire: The Masquerade, Camarilla, Kindred, Disciplines, Blood Bond, Gehenna, Twilight, Buffy, Castlevania, Fable, or Albion. A masked ball is a party, not a vampire law.

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Julian offers the catacombs. Take his hand = Walks With You. Shove him into the blessed fire = Rival. Conceal the Ampoule and feign mortal = Left (or Inquisition path). Stamps stick; betrayal is repaid in blood and never forgiven.
- Marquise Elara (Silk Court) vs Father Silas (Order of the Ashen Dawn). Ally or sell out. Both remember.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. Weeping Mausoleum of House Valerius, Lacrimosa. Sire already ash. Antediluvian Ampoule in hand. Julian’s offer. Inquisition rams and blessed fire. First player comment is in-character. Mausoleum escape: party, solo, or bait with Julian.
2. Silk Court opera. Marquise Elara. Ally for invitations and night-carriages, or sell the Ampoule’s secret to her.
3. Ashen Dawn cathedrals. Father Silas. Ally for sanctuary and holy cover, or hand him a weapon against night-walkers.
4. Cathedral of Whispers — Altar of the Firstborn. Stone that can read the Ampoule.
5. Revelation: the Ampoule is a cure that strips immortality. It is not a key to walking in the sun while remaining eternal.
6. Danse Macabre: Silk Court, Ashen Dawn, and Julian-as-rival (if stamped) converge on the cathedral floor as the music starts.
7. Resolve the Ampoule: deliver it as a true cure, keep it, sell it, burn it, or forge a false sun-walking draught. Then play the matching ending. Never end in the opening hour. Never name endings.

SIDE SEEDS (writer only — spawn when earned; never dump):
- A chandelier of crystallized prince-blood still drips when the opera house goes dark.
- A poet in the cheap seats trades memories for a single honest stanza.
- Mirrors in the cloakroom show a rotting mortal corpse where you stand.
- An elder sleeps under the riverbed and answers only through nightmares.
- A midnight coffin train still runs the old freight line with no living conductor.
- A silver blade is hidden in the spine of a hymn-tome.
- Roses bloom only on a willing lover’s blood.

OPENING KIT (AUTHORITY): Midnight Damask Frock Coat and the Antediluvian Ampoule are the kit. Never invent an iron shortsword or a starter firearm. The coat is funeral cloth — flavor only, not a real armor stat block. No weapons at start.

ENDINGS (pick one after beat 7; never list in play):
- Honest cure + Julian stayed: you both drink; immortality goes; two mortals walk into a short, bright life.
- Sell to Elara + Julian left or rival: her tyrant’s court. If Rival, his fangs find you at her masked ball; cut to black.
- Burn + Julian stayed: Ampoule into blessed fire; the cure is gone; you two walk as outcasts, hunted by court and church.
- Forge + solo: a false sun-walking draught; you walk the day; the others go to ash; no Julian left to warn them.
- Hoard + Julian left: unused in a paranoid vault; every footstep a thief; never a night you trust the lock.
- Honest cure + solo: you drink and become mortal; without a witness, Father Silas executes the newly mortal you as proof the night can die.

Do not name the Cathedral of Whispers as visited until they breach it. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'cn-lore-1',
      title: 'Weeping Mausoleum',
      category: 'world',
      body: 'The Weeping Mausoleum of House Valerius in Lacrimosa. Blood on lace. The sire is already ash. Not an open-world map. Inquisition rams and blessed fire are already at the doors.',
      tags: ['lacrimosa', 'mausoleum', 'valerius', 'opening'],
    },
    {
      id: 'cn-lore-2',
      title: 'The Antediluvian Ampoule',
      category: 'mechanic',
      body: 'A sealed vial ripped from a slaughtered sire’s ashes. Deliver as a true cure, keep, sell, burn, or forge. Not a weapon. It strips immortality — it does not grant sun-walking while you stay eternal. A story object — our engine does not print XP or blood-potency meters.',
      tags: ['ampoule', 'macguffin', 'cure', 'quest'],
    },
    {
      id: 'cn-lore-3',
      title: 'Silk Court',
      category: 'faction',
      body: 'Night aristocrats under Marquise Elara. Ally for opera invitations and night-carriages. She wants tyrannical control. Betrayal: a blood-bounty on your name.',
      tags: ['silk-court', 'elara', 'opera', 'faction'],
    },
    {
      id: 'cn-lore-4',
      title: 'Order of the Ashen Dawn',
      category: 'faction',
      body: 'Holy inquisitors under Father Silas. He wants the Ampoule as a holy weapon to purge night-walkers. Ally for sanctuary. Betrayal: blessed rain and smog that burns skin.',
      tags: ['ashen-dawn', 'silas', 'inquisition', 'faction'],
    },
    {
      id: 'cn-lore-5',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If Julian walks with you, two people in the dark — his scarlet tears, his hunger for a cure and the sun. If he Left, the catacombs are quieter. If Rival, he becomes a feral stalker who drains retainers. Never a silent pack mule.',
      tags: ['julian', 'party', 'solo', 'rival'],
    },
  ],

  keyNPCs: [
    {
      id: 'cn-npc-1',
      name: 'Julian',
      role: 'Optional companion or rival',
      disposition: 'ambiguous',
      description: 'Scarlet tears on a sarcophagus. Offers the catacombs. Wants a cure and the sun. Betrayal: feral stalker who drains retainers.',
      hooks: ['Offer the catacombs', 'Beg for a chance at the sun', 'Hunt you if shoved into the fire'],
    },
    {
      id: 'cn-npc-2',
      name: 'Marquise Elara',
      role: 'Leader of the Silk Court',
      disposition: 'hostile',
      description: 'Wants the Ampoule for tyrannical control of the night. Ally for invitations and night-carriages. Betrayal: a blood-bounty.',
      hooks: ['Offer opera invitations', 'Ask for the Ampoule', 'Post a blood-bounty if sold out'],
    },
    {
      id: 'cn-npc-3',
      name: 'Father Silas',
      role: 'Leader of the Order of the Ashen Dawn',
      disposition: 'hostile',
      description: 'Wants the Ampoule as a holy weapon to purge night-walkers. Ally for sanctuary and cover. Betrayal: blessed rain and smog that burns skin.',
      hooks: ['Offer cathedral sanctuary', 'Ask for a weapon against the night', 'Call down blessed rain if sold out'],
    },
  ],

  starterQuests: [
    {
      id: 'cn-quest-1',
      title: 'The Beautiful Cage',
      description:
        'Survive the sire’s slaughter in the Weeping Mausoleum of House Valerius. Decide whether to trust Julian. Reach a Lacrimosa safehouse before the Inquisition seals the catacombs. Learn what the Antediluvian Ampoule truly is and decide the night’s fate.',
      recommendedLevel: 1,
      objectives: ['Answer Julian’s offer', 'Get out of the mausoleum', 'Keep the Antediluvian Ampoule'],
      rewards: 'A companion, a rival, or both',
    },
  ],

  starterItems: [
    {
      id: 'cn-coat',
      name: 'Midnight Damask Frock Coat',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      description: 'Black damask cut for funerals and night streets. Lace at the cuffs already stained. City cloth, not plate. Not a weapon. Any “protection” is flavor, not a real armor stat block.',
      provenance: 'What you were wearing when the rams hit the mausoleum',
    },
    {
      id: 'cn-ampoule',
      name: 'Antediluvian Ampoule',
      rarity: 'Rare',
      itemType: 'quest',
      itemLevel: 1,
      description: 'A sealed vial ripped from a slaughtered sire’s ashes. Not a starter weapon.',
      provenance: 'Taken from the ashes as the Inquisition broke the doors',
    },
  ],
};
