import type { CampaignBible } from './types';

/**
 * Original SynapticGM PYOA: rooftop stealth-assassin run, ticking ledger, rival syndicates.
 * Stealth tropes only — not Assassin's Creed, Hitman, Fable, or any licensed world.
 */
export const umbraProtocol: CampaignBible = {
  id: 'umbra-protocol',
  title: 'The Umbra Protocol',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Standard',
  genreTag: 'Rooftop assassin',
  tagline: 'To kill a king, you only need a blade; to kill an empire, you need the names of its architects.',
  shortDescription:
    'Blood on the bell-tower floor, the Architect’s Ledger ticking in your hands, Sable offering a climbing harness as the Sovereign Guard grapples in. Silk-Weavers or Iron Syndicate — several endings.',
  licenseNote:
    'Original SynapticGM stealth-assassin tropes (social blending, rooftop parkour, shadow syndicates, clockwork gadgets). Not based on Assassin’s Creed, Hitman, Fable, Albion, or any named game, film, or novel.',
  startingLocation: 'the Bell-Tower of the Grand Exchange',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'up-coat', name: 'Ulster pockets', capacity: 14 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'The bells are already screaming. Confirm your name, then where this tower opens.',
  },
  openingHook:
    'Blood pools under the Archbishop on the Bell-Tower floor. You wrench the Architect’s Ledger — a brass-geared book still ticking — from his dead hands. Stained glass shatters inward. Sovereign Guard hound-units grapple through the broken rose window. Across the belfry, Sable, a rogue shadow-courier with a crossbow bolt still in her side, tosses a leather climbing harness: she knows a rooftop blind-spot off Veridia’s Grand Exchange. The next page waits on whether you take the harness.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Where does this open? The Bell-Tower is the default. You may name another Veridia place, or pick random.',
      suggestions: ['The Bell-Tower of the Grand Exchange', 'Random place', 'The rooftops of Veridia'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing. Named garments.',
      suggestions: ['Tailored Night-Crow Ulster Coat', 'Dark city clothes under an ulster', 'What I wore into the tower'],
    },
  ],

  premise: `PLAYER AGENCY (BINDING): Main spine only — not an open city map. Do not dump a district list. Side seeds stay hidden until the player looks, talks, climbs, or wanders. Code owns stamps and kit. Writer: this turn’s camera only (2–6 sentences, then 3–4 local forks).

ENGINE (BINDING): This is Pick Your Own Adventure, not live LitRPG chrome or 5e dice. Do not emit XP tickers or health bars. Disguises, climbing kits, flash-powder, and clockwork gadgets are story objects: describe them in the body, never as our HUD.

INNER VOICE (BINDING): Typed comments, jokes, and doubts ARE the hero thinking or speaking. Mirror them in <thought> or dialogue, then the world answers. Never overwrite their personality. Honor PERSPECTIVE. No meta. Never name Assassin’s Creed, Hitman, Fable, Albion, Animus, Agent 47, or any licensed series. Never use branded phrases such as leap of faith or hidden blade — write a long drop, a concealed knife, concealed steel.

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Sable offers the harness. Take it = Walks With You. Kick her off the ledge = Rival. Kick the Ledger under a floorboard and take the Archbishop’s cloak = Left (or Guard path). Stamps stick; betrayal is repaid in blood and never forgiven.
- Lord Valerius (Silk-Weavers) vs Matron Rigg (Iron Syndicate). Ally or sell out. Both remember.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. Bell-Tower of the Grand Exchange, Veridia. Archbishop dead. Architect’s Ledger ticking in hand. Sable’s harness. Sovereign Guard coming. First player comment is in-character. Tower escape: party, solo, or bait with Sable.
2. Silk-Weavers gala. Valerius. Ally for disguises and schedules, or poison their champagne.
3. Iron Syndicate slums. Rigg. Ally for explosives and perches, or sell out to the Sovereign Guard.
4. Grandmaster’s Vault — the city’s central bank. Clockwork locks. A cipher machine that can read the Ledger.
5. Revelation: the rival factions are one cabal, farming endless war profits from both sides.
6. Eclipse standoff: Weavers, Syndicate, and Sable-as-rival (if stamped) converge on the rooftops during a solar eclipse.
7. Resolve the Ledger: publish it, keep it, sell it, burn it, or forge a fake list. Then play the matching ending. Never end in the opening hour. Never name endings.

SIDE SEEDS (writer only — spawn when earned; never dump):
- Mechanical pigeon drones carry encoded messages over the Exchange roofs.
- A blind hurdy-gurdy beggar hears patrols before anyone sees them.
- Streetlamps plus a pinch of flash-powder can blind a whole landing.
- A portrait artist sells hidden tunnel maps inked into the backgrounds of commissions.
- The opera house’s sleeping-gas is missing a valve; someone is already using it.
- A disgraced tailor will sew kevlar-weave into a coat for a debt ledger.
- A sniper nest waits in the eye of the colossal brass harbor statue, reached by a long drop from the crown — never call that drop anything branded.

OPENING KIT (AUTHORITY): Tailored Night-Crow Ulster Coat and the Architect’s Ledger are the kit. Never invent an iron shortsword or a starter firearm. The coat is tailored city cloth — flavor only, not a real armor stat block. No weapons at start.

ENDINGS (pick one after beat 7; never list in play):
- Honest publish + Sable stayed: underground press; parliament dragged into the street; you two vanish; her brother is freed from the pits.
- Sell to Valerius + Sable left or rival: an aristocratic seat. If Rival, she serves as chambermaid; concealed knife to the throat; cut to black.
- Burn + Sable stayed: Ledger into the bank incinerator; factions tear each other apart; you walk into the shadows.
- Forge + solo: a forged target list; you as the new Grandmaster; no Sable left to spot the forgery.
- Hoard + Sable left: ghost between safehouses; never the same bed twice.
- Honest publish + solo: the press gets it; a Silk-Weaver sniper kills you on a rooftop as a nameless martyr.

Do not name the Grandmaster’s Vault as visited until they breach it. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'up-lore-1',
      title: 'Veridia Bell-Tower',
      category: 'world',
      body: 'The Bell-Tower of the Grand Exchange in Veridia. Blood on the floor. The Archbishop is already dead. Not an open-world map. Sovereign Guard hound-units are already grappling through the stained glass.',
      tags: ['veridia', 'bell-tower', 'grand-exchange', 'opening'],
    },
    {
      id: 'up-lore-2',
      title: 'The Architect’s Ledger',
      category: 'mechanic',
      body: 'A brass-geared book that ticks. Names of the empire’s architects. Publish, keep, sell, burn, or forge. Not a weapon. A story object — our engine does not print XP or stealth meters.',
      tags: ['ledger', 'macguffin', 'architects', 'quest'],
    },
    {
      id: 'up-lore-3',
      title: 'Silk-Weavers',
      category: 'faction',
      body: 'Aristocratic shadow-traders under Lord Valerius. Ally for disguises and schedules. Betrayal: a silent hit — disguised assassins in crowds.',
      tags: ['silk-weavers', 'valerius', 'aristocrats', 'faction'],
    },
    {
      id: 'up-lore-4',
      title: 'Iron Syndicate',
      category: 'faction',
      body: 'Slum industrialists under Matron Rigg. She wants the Ledger broadcast for revolution. Ally for explosives and perches. Betrayal: flamethrower brutes block escape routes and steal stealth in those districts.',
      tags: ['iron-syndicate', 'rigg', 'slums', 'faction'],
    },
    {
      id: 'up-lore-5',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If Sable walks with you, two people on the roofs — her harness, her crossbow wound, her brother in the fighting pits. If she Left, the ledges are quieter. If Rival, she becomes a counter-sniper who shoots down your environmental traps. Never a silent pack mule.',
      tags: ['sable', 'party', 'solo', 'rival'],
    },
  ],

  keyNPCs: [
    {
      id: 'up-npc-1',
      name: 'Sable',
      role: 'Rogue shadow-courier, optional companion or rival',
      disposition: 'ambiguous',
      description: 'Crossbow wound, climbing harness, rooftop routes. Wants to ransom her younger brother from indentured fighting pits. Betrayal: counter-sniper who shoots down your environmental traps.',
      hooks: ['Offer the climbing harness', 'Beg for a chance to free her brother', 'Hunt you if kicked from the ledge'],
    },
    {
      id: 'up-npc-2',
      name: 'Lord Valerius',
      role: 'Leader of the Silk-Weavers',
      disposition: 'hostile',
      description: 'Wants the Ledger to blackmail parliament into a shadow-trade monopoly. Ally for disguises and schedules. Betrayal: silent hit; disguised assassins in crowds.',
      hooks: ['Offer gala disguises', 'Ask for the Ledger', 'Send disguised killers if sold out'],
    },
    {
      id: 'up-npc-3',
      name: 'Matron Rigg',
      role: 'Leader of the Iron Syndicate',
      disposition: 'neutral',
      description: 'Wants the Ledger broadcast through the slums to spark revolution. Ally for explosives and perches. Betrayal: flamethrower brutes block escape routes and steal stealth in those districts.',
      hooks: ['Offer explosives and perches', 'Ask you to publish to the slums', 'Burn the alleys if sold out'],
    },
  ],

  starterQuests: [
    {
      id: 'up-quest-1',
      title: 'Names of the Architects',
      description:
        'Survive the Archbishop’s murder in the Bell-Tower of the Grand Exchange. Decide whether to trust Sable. Reach a Veridia safehouse before the Sovereign Guard locks the roofs. Decipher the Architect’s Ledger and decide the city’s fate.',
      recommendedLevel: 1,
      objectives: ['Answer Sable’s offer', 'Get off the bell-tower', 'Keep the Architect’s Ledger'],
      rewards: 'A companion, a rival, or both',
    },
  ],

  starterItems: [
    {
      id: 'up-coat',
      name: 'Tailored Night-Crow Ulster Coat',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      description: 'Dark tailored ulster cut for rooftops and crowds. City cloth, not plate. Not a weapon. Any “stealth” or weather resistance is flavor, not a real armor stat block.',
      provenance: 'What you were wearing when the stained glass broke',
    },
    {
      id: 'up-ledger',
      name: 'Architect’s Ledger',
      rarity: 'Rare',
      itemType: 'quest',
      itemLevel: 1,
      description: 'Brass-geared book that ticks in the hand. Names of the empire’s architects. Not a starter weapon.',
      provenance: 'Wrenched from the dead Archbishop’s hands',
    },
  ],
};
