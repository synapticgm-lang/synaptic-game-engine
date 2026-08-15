import type { CampaignBible } from './types';

/**
 * Original SynapticGM PYOA: drowned art-deco city, last uncorrupted resin, rogue chirurgeon.
 * Retro-future biological horror tropes — not BioShock, Fable, or any licensed world.
 */
export const resinSonata: CampaignBible = {
  id: 'resin-sonata',
  title: 'The Resin Sonata',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Standard',
  genreTag: 'Underwater horror',
  tagline: 'Evolution was a symphony, but the orchestra went mad.',
  shortDescription:
    'The High-Architect is dead in the Glass Atrium, the last uncorrupted Eden-Resin is in a brass syringe in your hand, and Aris offers the maintenance shafts before a Brass-Gargant arrives. Laborers or aristocrats — several endings.',
  licenseNote:
    'Original SynapticGM retro-futuristic biological-horror tropes (underwater dystopia, genetic splicing, ruined aristocracy). Not based on BioShock, Fable, Albion, or any named game, film, or novel.',
  startingLocation: 'the Glass Atrium of the Grand Funicular',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'rs-coat', name: 'Diving-coat pockets', capacity: 14 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'The atrium already groans. Confirm your name, then where this pressure opens.',
  },
  openingHook:
    'Brass trim groans under the subterranean ocean. Icy seawater weeps through the cracks and pools around the dead High-Architect. In your shaking hands is the Sovereign Syringe — the last uncorrupted vial of Eden-Resin in ruined Opaline. Across the shattered mosaic, Aris the rogue chirurgeon pries a bloody wrench from a mutated socialite’s skull and extends a resin-stained glove: he knows the maintenance shafts to the lower pressure-levels. Heavy Brass-Gargant footsteps echo down the promenade. The next page waits on whether you take his hand.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Where does this open? The Glass Atrium is the default. You may name another Opaline ward, or pick random.',
      suggestions: ['The Glass Atrium of the Grand Funicular', 'Random place', 'The maintenance shafts'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing. Named garments.',
      suggestions: ['Tarnished art-deco diving coat', 'Brass-buckled trench, soaked hems', 'What I wore on the promenade'],
    },
  ],

  premise: `PLAYER AGENCY (BINDING): Main spine only — not an open city map. Do not dump a ward list. Side seeds stay hidden until the player looks, talks, splices, or wanders. Code owns stamps and kit. Writer: this turn’s camera only (2–6 sentences, then 3–4 local forks).

ENGINE (BINDING): This is Pick Your Own Adventure, not live LitRPG chrome or 5e dice. Do not emit XP tickers or health bars. Genetic upgrades, resin doses, and “sanity” are story objects: describe them in the body, never as our HUD.

INNER VOICE (BINDING): Typed comments, jokes, and doubts ARE the hero thinking or speaking. Mirror them in <thought> or dialogue, then the world answers. Never overwrite their personality. Honor PERSPECTIVE. No meta. Never name BioShock, Rapture, plasmids, ADAM, Big Daddies, Little Sisters, or any licensed series.

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Aris offers the shafts. Take his hand = Walks With You. Shove him at the Gargant = Rival. Hide the syringe and surrender = Left (or Gargant path). Stamps stick; betrayal is violently remembered and never forgiven.
- Foreman Galt (Muck-Walkers) vs Maestro Valerius (Gilded Chorus). Ally or sell out. Both remember.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. Glass Atrium. High-Architect dead. Sovereign Syringe in hand. Aris’s offer. Brass-Gargant coming. First player comment is in-character.
2. Dredge-Works. Muck-Walkers / Galt. Tunnel access and brute force vs turning on automated turrets for loot.
3. Velvet Promenade. Gilded Chorus / Valerius. Passcodes vs opening floodgates for the laborers.
4. Filtration Core — geothermal plant and the centrifuge that can read the Syringe.
5. Administrator's truth: Eden-Resin is not a miracle; it is a sentient parasite farming the city for biomass.
6. Pressure clash: Walkers, Chorus, and Aris-as-rival (if stamped) converge on Bathysphere Bay as the ocean breaches.
7. Resolve the Syringe: deliver to the surface, keep for power, sell to a faction, burn in the vents, or forge a fake cure to enslave survivors. Then play the matching ending. Never end in the opening hour. Never name endings.

SIDE SEEDS (writer only — spawn when earned; never dump):
- Flooded neon opera: a mutated soprano still shatters glass when you swim past.
- Apollo Ward vending machine: weaponized pheromones, payment in human teeth.
- Central heating incinerates failed, still-living genetic experiments.
- Mechanical crab on the boardwalk is a mobile vault of a dead billionaire’s savings.
- Ventilation fungi are psychoactive; they whisper the darkest secret of anyone who breathes the spores.
- A child in the ruined arcade is immune to resin mutation, guarded by a rogue armored diving-suit automaton.
- Oxygen scrubbers clogged with aggressive flesh-eating kelp.

OPENING KIT (AUTHORITY): Tarnished art-deco diving coat and the Sovereign Syringe are the kit. Never invent an iron shortsword or a starter firearm. Injecting a micro-dose is a scene choice, not starting loot. Coat “resistance” is flavor for neoprene and brass — not a real armor stat block.

ENDINGS (pick one after beat 7; never list in play):
- Honest delivery + Aris stayed: bathysphere to the surface; syringe to a health body; a cure; you two are wealthy whistleblowers.
- Sell to Valerius + Aris left or rival: dry penthouse at the top. If Rival, he bypasses the bio-scanners; rusted infected needle; cut to black.
- Burn + Aris stayed: syringe into geothermal magma; parasite dies; grid collapses; last escape pod; Opaline left to the dark.
- Forge + solo: mass-produce a tainted addictive resin; survivors as thralls; no Aris left to make a counter-agent; you as the new High-Architect.
- Hoard + Aris left: keep unused in a Dredge-Works bunker; hunted by mutants and elites; isolation and the Resin’s whisper drive you mad.
- Honest delivery + solo: surface authorities get the truth; without a doctor watching your exposure, trace-spores take hold in quarantine; they execute the mutation they cannot treat.

Do not name the Filtration Core as visited until they breach it. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'rs-lore-1',
      title: 'Opaline Atrium',
      category: 'world',
      body: 'A drowned art-deco city under a subterranean ocean. The Glass Atrium of the Grand Funicular groans. The High-Architect is already dead. Not an open-world map. A Brass-Gargant is already coming down the promenade.',
      tags: ['opaline', 'atrium', 'funicular', 'opening'],
    },
    {
      id: 'rs-lore-2',
      title: 'The Sovereign Syringe',
      category: 'mechanic',
      body: 'Brass-and-glass injector. Last uncorrupted Eden-Resin. Deliver, keep, sell, burn, or forge. Not a weapon. The city’s “miracle” is a story object — our engine does not print XP or plasmid menus.',
      tags: ['syringe', 'macguffin', 'resin', 'quest'],
    },
    {
      id: 'rs-lore-3',
      title: 'Muck-Walkers',
      category: 'faction',
      body: 'Mutated laborers of the flooded Dredge-Works under Foreman Galt. Ally for brute force and tunnels. Betrayal: explosive-rigged bathyspheres hunt you during later sequences.',
      tags: ['muck-walkers', 'galt', 'laborers', 'faction'],
    },
    {
      id: 'rs-lore-4',
      title: 'Gilded Chorus',
      category: 'faction',
      body: 'Hyper-spliced aristocrats of the Velvet Promenade under Maestro Valerius. He wants the Syringe for a mind-control symphony. Ally for passcodes. Betrayal: hijacked PA that draws mutants and frays the nerves.',
      tags: ['gilded-chorus', 'valerius', 'aristocrats', 'faction'],
    },
    {
      id: 'rs-lore-5',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If Aris walks with you, two people in the shafts — his wrench, his crystallizing organs, his hope the pure strain can still save him. If he Left, the promenade is quieter. If Rival, he stalks the city on combat-strains and poisons kits. Never a silent pack mule.',
      tags: ['aris', 'party', 'solo', 'rival'],
    },
  ],

  keyNPCs: [
    {
      id: 'rs-npc-1',
      name: 'Aris',
      role: 'Rogue chirurgeon, optional companion or rival',
      disposition: 'ambiguous',
      description: 'Resin-stained glove, bloody wrench. Wants pure DNA from the Syringe to stop his organs crystallizing. Betrayal: unstable combat-strains, recurring stalker, poisoned kits and tripwires.',
      hooks: ['Offer the maintenance shafts', 'Beg for a chance at a cure', 'Hunt you if used as bait'],
    },
    {
      id: 'rs-npc-2',
      name: 'Foreman Galt',
      role: 'Leader of the Muck-Walkers',
      disposition: 'neutral',
      description: 'Wants the aristocratic upper levels collapsed and resin production seized. Betrayal: hacked transit bathyspheres send explosive drones.',
      hooks: ['Offer tunnel access', 'Ask you to flood the elites', 'Rig the transit if sold out'],
    },
    {
      id: 'rs-npc-3',
      name: 'Maestro Valerius',
      role: 'Leader of the Gilded Chorus',
      disposition: 'hostile',
      description: 'Wants the pure Syringe to perfect a mind-control symphony and rule as a god. Ally for passcodes and dry rooms. Betrayal: city PA broadcasts a frequency that draws mutants to you.',
      hooks: ['Offer security passcodes', 'Ask for the last uncorrupted strain', 'Broadcast if sold out'],
    },
  ],

  starterQuests: [
    {
      id: 'rs-quest-1',
      title: 'Last Uncorrupted Strain',
      description:
        'Survive the High-Architect’s murder in the Glass Atrium. Decide whether to trust Aris. Reach a Dredge-Works safehouse before Brass-Gargants lock the sector. Decipher the Sovereign Syringe and decide Opaline’s fate.',
      recommendedLevel: 1,
      objectives: ['Answer Aris’s offer', 'Get off the atrium floor', 'Keep the Sovereign Syringe'],
      rewards: 'A companion, a rival, or both',
    },
  ],

  starterItems: [
    {
      id: 'rs-coat',
      name: 'Tarnished Art-Deco Diving Coat',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      description: 'Heavy brass-buckled, neoprene-lined trench. Built for localized pressure. Not a weapon. Blunt and chemical “resistance” is flavor, not a real stat block.',
      provenance: 'What you were wearing when the atrium cracked',
    },
    {
      id: 'rs-syringe',
      name: 'Sovereign Syringe',
      rarity: 'Rare',
      itemType: 'quest',
      itemLevel: 1,
      description: 'Intricate brass-and-glass injector. Swirling luminescent gold — the last pure Eden-Resin in Opaline. Not a starter weapon.',
      provenance: 'In your hands beside the dead High-Architect',
    },
  ],
};
