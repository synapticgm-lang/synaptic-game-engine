import type { CampaignBible } from './types';

/**
 * Original SynapticGM PYOA: high-society wedding scandal, dossier in the clutch.
 * Rom-com tropes only — not Fable, Albion, or any licensed world.
 */
export const roseGoldUltimatum: CampaignBible = {
  id: 'rose-gold-ultimatum',
  title: 'The Rose-Gold Ultimatum',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Easy',
  genreTag: 'Romance',
  tagline: 'Love is a battlefield, and somebody just stole the only map.',
  shortDescription:
    'The Bridal Dossier is in your clutch, Julian is pounding on the powder-room door, and Chloe knows the laundry chutes. High-society scandal, several endings.',
  licenseNote:
    'Original SynapticGM romantic-comedy. Cutthroat wedding planners, high-society gossip, big-city scandal tropes. Not based on Fable, Albion, or any named series, film, or novel.',
  startingLocation: 'the VIP Powder Room at the Starlight Gala',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'rg-clutch', name: 'Clutch and hidden dress pockets', capacity: 12 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'Julian is already knocking. Confirm your name, then where this gala crisis opens.',
  },
  openingHook:
    'The bride sobs in the corner, mascara on a ten-thousand-dollar silk gown. The Bridal Dossier’s rose-gold drive sits heavy in your clutch. The bathroom door jiggles. Julian’s manicured knock hits the marble: open up. Beside you, your fellow assistant Chloe vibrates — she knows the laundry chutes if you trust her. The next page waits on whether you take her hand.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Where does this open? The VIP Powder Room is the default. You may name another gala room, or pick random.',
      suggestions: ['The VIP Powder Room at the Starlight Gala', 'Random place', 'The hotel service hallway'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing. Named garments.',
      suggestions: ['Emergency-rescue little black dress, heels', 'Gala black, clutch in hand', 'What I wore to work the wedding'],
    },
  ],

  premise: `PLAYER AGENCY (BINDING): Main spine only — not an open city sandbox. Do not dump a venue map. Side seeds stay hidden until the player looks, talks, or wanders. Code owns stamps and kit. Writer: this turn’s camera only (2–6 sentences, then 3–4 local forks). Social consequences, not HP grind.

INNER VOICE (BINDING): Typed comments, jokes, and doubts ARE the hero thinking or speaking. Mirror them in <thought> or dialogue, then the world answers. Never overwrite their personality. Honor PERSPECTIVE and the session’s visual style. No meta (“the sheet”, “alignment”).

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Chloe Summers offers the laundry chute. Take her hand = Walks With You. Shove her at Julian = Rival. Leave her and slip the service hall = Left. Stamps stick; high-society betrayal is not forgiven.
- Vivian Sterling (Platinum Swans) vs Bexley (PR Cabal / The Hive). Ally or sell out. Both remember.
- Julian is the rival at the door, not a silent extra. No alignment-meter speech.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. VIP Powder Room. Dossier in the clutch. Chloe’s offer. Julian knocking. First player comment is in-character.
2. Country-club brunch. Platinum Swans / Vivian. Elite access vs leaking their dietary secrets to the press.
3. The Hive (neon influencer HQ). Bexley’s PR Cabal. Viral cover vs selling them to paparazzi.
4. Bridal Expo undercover — find a laptop that can decrypt the Dossier.
5. Scandal: the city’s most eligible bachelor is broke; Swans have been faking marriages for tax evasion.
6. Runway showdown: Swans, influencers, and Chloe-as-rival (if stamped) converge on a premier bridal catwalk.
7. Resolve the drive: deliver to the press, keep for blackmail, sell to a rival planner (Julian), burn to save love, or forge the files to crown yourself. Then play the matching ending. Never end in the opening hour. Never name endings.

SIDE SEEDS (writer only — spawn when earned; never dump):
- Champagne fountain at the Expo collapses if someone bumps the DJ table.
- Frantic groom in coat check will pay to smuggle his passport out of a fiancé’s purse.
- “Wedding Planner of the Year” outsources flowers to a disgraced ex-convict botanist.
- Speakeasy behind the boutique three-way mirror; socialites gamble heirloom jewelry.
- Vicious food critic allergic to truffles currently hidden in the appetizers.
- Stray Pomeranian swallowed a four-carat ring meant for a billionaire’s daughter.

OPENING KIT (AUTHORITY): The Emergency Rescue little black dress and the Bridal Dossier are the kit. Never invent an iron shortsword, plasma rifle, or combat knife. Hairspray-and-lighter is a scene choice, not starting loot.

ENDINGS (pick one after beat 7; never list in play):
- Honest delivery + Chloe stayed: journalist gets the Dossier; fake marriages fall; you and Chloe open an honest boutique agency.
- Sell to Julian + Chloe left or rival: lonely fabulous penthouse. If Rival, she crashes the housewarming with a glass of red on white silk; cut to black.
- Burn + Chloe stayed: flash drive into a flaming centerpiece; you leave the elite for a coastal bakery.
- Forge + solo: rewrite files, frame rivals, queen bee of planning; no Chloe left who remembers the truth; cold and paranoid.
- Hoard + Chloe left: Dossier in a safe; quiet blackmail VIP life; nights alone, terrified of a hack; joy drained.
- Honest delivery + solo: press breaks the scandals; Vivian frames you for the theft; you watch the fallout from a dive bar.

Do not name the Bridal Expo as a visited place until they are on that floor. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'rg-lore-1',
      title: 'Starlight Gala',
      category: 'world',
      body: 'A hotel wedding gala. The VIP Powder Room is where it opens — sobbing bride, Julian at the door, laundry chutes. Not an open-world city map. The service corridors are the first maze.',
      tags: ['gala', 'powder-room', 'hotel', 'opening'],
    },
    {
      id: 'rg-lore-2',
      title: 'The Bridal Dossier',
      category: 'history',
      body: 'A rose-gold flash drive of encrypted socialite dirt. Deliver, keep, sell, burn, or forge. It is not a weapon.',
      tags: ['dossier', 'macguffin', 'scandal', 'quest'],
    },
    {
      id: 'rg-lore-3',
      title: 'Platinum Swans',
      category: 'faction',
      body: 'Ruling dowagers. Vivian Sterling wants the Dossier to hide her son’s bankruptcy. Ally for society access. Leak their secrets and you are blacklisted from every venue in the tri-state.',
      tags: ['swans', 'vivian', 'country-club', 'faction'],
    },
    {
      id: 'rg-lore-4',
      title: 'The PR Cabal',
      category: 'faction',
      body: 'The Hive: neon influencer HQ under Bexley. They want exclusive gossip for traffic and a book deal. Ally for viral cover. Sell them to paparazzi and the bot army review-bombs you.',
      tags: ['hive', 'bexley', 'pr', 'faction'],
    },
    {
      id: 'rg-lore-5',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If Chloe walks with you, two assistants in the dark — heels off, chute, her dream of her own firm. If she Left, the halls are quieter. If Rival, she launches an anti-wedding agency and poaches your caterers. Never a silent plus-one.',
      tags: ['chloe', 'party', 'solo', 'rival'],
    },
  ],

  keyNPCs: [
    {
      id: 'rg-npc-1',
      name: 'Chloe Summers',
      role: 'Fellow assistant, optional companion or rival',
      disposition: 'friendly',
      description: 'Vibrating with a plan. Wants her own event firm and to stop fetching coffees. Betrayal: she launches a rival anti-wedding agency, poaches caterers, sends passive-aggressive edible arrangements.',
      hooks: ['Offer the laundry chute', 'Ask if they can be trusted', 'Sabotage bookings if shoved at Julian'],
    },
    {
      id: 'rg-npc-2',
      name: 'Julian',
      role: 'Rival planner at the powder-room door',
      disposition: 'hostile',
      description: 'Manicured knock, custom tuxedo, wants the Dossier. Will buy it later for a life-changing payout if you sell. Not a combat encounter unless the player makes it one.',
      hooks: ['Demand the door open', 'Buy the drive', 'Send people to lock the valet'],
    },
    {
      id: 'rg-npc-3',
      name: 'Vivian Sterling',
      role: 'Leader of the Platinum Swans',
      disposition: 'neutral',
      description: 'Apex socialite. Wants the Dossier to hide her son’s bankruptcy. Betrayal: country-club blacklist — no venue, florist, or tailor will take your call.',
      hooks: ['Offer society access', 'Demand the drive back', 'Frame you if you go to press alone'],
    },
    {
      id: 'rg-npc-4',
      name: 'Bexley',
      role: 'Leader of the PR Cabal',
      disposition: 'ambiguous',
      description: 'Wants exclusive gossip for blog traffic and a book deal. Betrayal: bot army, review bombs, fake bridezilla calls at the worst moment.',
      hooks: ['Offer viral protection', 'Buy exclusive rights', 'Review-bomb if sold to paparazzi'],
    },
  ],

  starterQuests: [
    {
      id: 'rg-quest-1',
      title: 'Out of the Powder Room',
      description:
        'Leave the Starlight Gala VIP Powder Room with the Bridal Dossier. Decide whether to trust Chloe. Reach a cramped studio safehouse before Julian locks the valet. Decrypt the drive and decide the city’s wedding season.',
      recommendedLevel: 1,
      objectives: ['Answer Chloe’s offer', 'Get out of the powder room', 'Keep the Dossier'],
      rewards: 'A companion, a rival, or both',
    },
  ],

  starterItems: [
    {
      id: 'rg-dress',
      name: 'Emergency Rescue Little Black Dress',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      description: 'Sleek, wrinkle-resistant cocktail dress with suspiciously deep hidden pockets. Not armor plate. Not a weapon.',
      provenance: 'What you wore to work the Starlight Gala',
    },
    {
      id: 'rg-dossier',
      name: 'Bridal Dossier',
      rarity: 'Rare',
      itemType: 'quest',
      itemLevel: 1,
      description: 'Rose-gold flash drive. Encrypted scandal of every major socialite. Deliver, keep, sell, burn, or forge. Not a weapon.',
      provenance: 'In your clutch when Julian started knocking',
    },
  ],
};
