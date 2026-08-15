import type { CampaignBible } from './types';

/**
 * Original SynapticGM PYOA: deep-seam rig, swarm breach, nav-drive.
 * Blue-collar survival tropes only — not Aliens, Fable, or any licensed world.
 */
export const erebusNine: CampaignBible = {
  id: 'erebus-9-swarm-directive',
  title: 'Erebus-9: The Swarm Directive',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Hardcore',
  tagline: 'They dug too deep to find the cure; now we have to bury the disease.',
  shortDescription:
    'PYOA survival: nav-drive in your hands, Vance at the airlock, miners vs Apex execs, several endings. No dice HUD.',
  licenseNote:
    'Original SynapticGM dark sci-fi. Corporate dystopia, biological swarms, blue-collar survival tropes. Not based on Aliens, Fable, Albion, or any named series, game, or film.',
  startingLocation: 'Air-Lock Bay 4, Deep-Seam Mining Rig Charybdis',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'e9-pockets', name: 'Fatigue pockets', capacity: 14 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'The bulkhead is already failing. Confirm your name, then where this breach opens.',
  },
  openingHook:
    'Emergency strobes paint Air-Lock Bay 4 in bloody flashes. The outer bulkhead shudders under a chitinous impact. Scorched wiring fills your lungs. Private Vance clutches a ruptured plasma-rifle and begs you to override the lockdown so he can run. The extraction shuttle’s nav-drive — a heavy beryllium sphere, the colony’s only remaining flight coordinates — sits ice-cold in your hands. A wet clicking screech from the vents above. The next page waits on whether you open that lock for him.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Where does this open? Air-Lock Bay 4 on the Charybdis is the default. You may name another deck, or pick random.',
      suggestions: ['Air-Lock Bay 4, Rig Charybdis', 'Random place', 'The inner bulkhead corridor'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing. Named garments.',
      suggestions: ['Scorched hazard fatigues, dying shoulder lamp', 'Coveralls stained with hydraulic fluid', 'What I had on when the alarm hit'],
    },
  ],

  premise: `PLAYER AGENCY (BINDING): Main spine only — not an open sandbox. Do not dump a deck map. Side seeds stay hidden until the player looks, talks, or wanders. Code owns stamps and kit. Writer: this turn’s camera only (2–6 sentences, then 3–4 local forks).

INNER VOICE (BINDING): Typed comments, jokes, and doubts ARE the hero thinking or speaking. Mirror them in <thought> or dialogue, then the world answers. Never overwrite their personality. Honor PERSPECTIVE and the session’s visual style. No meta (“the sheet”, “alignment”).

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Private Vance begs the override. Open it with him = Walks With You. Seal him in = Rival. Leave him and crawl away = Left. Stamps stick; betrayal is not forgiven.
- Foreman Rigg (miners / Drill Bosses) vs Director Sterling (Apex Executives). Ally or sell out. Both remember.
- No alignment-meter speech. No licensed xenomorph lore, face-huggers, or named film plots — this swarm is original chitin and wet clicking, bred by Apex.

STORY SPINE (skeleton — unique prose each run; do not lecture):
1. Air-Lock Bay 4. Nav-drive in hand. Vance’s plea. Something in the vents. First player comment is in-character.
2. Collapsed mining tunnels. Drill Bosses / Foreman Rigg. Heavy munitions vs stealing fusion-charges.
3. Barricaded luxury suites. Apex retrieval team / Director Sterling. Clearance codes vs feeding them to the swarm.
4. Hive Core: atmospheric processors become a breeding ground; find the primary relay.
5. Transmission: decode the nav-drive — Apex bred the swarm for a bioweapon contract.
6. Evac squeeze: miners, execs, and Vance-as-rival (if stamped) converge on the last drop-ship.
7. Resolve the drive: deliver to the fleet, keep for blackmail, sell to a rival corp, burn in the reactor, or forge coordinates to strand everyone. Then play the matching ending. Never end in the opening hour. Never name endings.

SIDE SEEDS (writer only — spawn when earned; never dump):
- Hydroponics: carnivorous flora digesting a heavy assault mech.
- Rogue medical synth in triage building a fleshy drop-pod from the dead.
- Gravity generator reverses; blood and debris pinned to the ceiling.
- Sector 7 locker: military-grade hyper-stimulants.
- Colony dog in a reinforced kennel, barking at one wall panel.
- Coolant tank: a queen-sized creature frozen in solid nitrogen.

OPENING KIT (AUTHORITY): Scorched hazard fatigues and the Beryllium Nav-Drive are the kit. Vance’s ruptured rifle is his, broken — not yours unless the ledger says you took it. Never invent an iron shortsword.

ENDINGS (pick one after beat 7; never list in play):
- Honest delivery + Vance stayed: fleet gets the drive; Apex exposed; swarm glassed; whistleblower payout split.
- Sell the bio-data + Vance left or rival: rival corp penthouse. If Rival, he bypasses security; a smuggled swarm-spawn in the dark; cut to black.
- Burn + Vance stayed: nav-drive into the reactor; localized fusion; rig, swarm, secrets, and both of you into the void.
- Forge + solo: fake coordinates send Apex’s rescue into a dying orbit; you take the only pod; no Vance left to stop you.
- Hoard + Vance left: keep the drive unused; paranoid deep-space drifter hunted by Apex wet-work; isolation eats you.
- Honest delivery + solo: fleet gets the truth; an Apex plant on the extraction team puts you out an airlock halfway home.

Do not name the Hive Core as a visited place until they are on that descent. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'e9-lore-1',
      title: 'Rig Charybdis',
      category: 'world',
      body: 'Erebus-9 is a rock. The Charybdis is a deep-seam mining rig that dug for a “cure” and hit a bred swarm. Air-Lock Bay 4 is where the story opens — strobes, failing bulkhead, vents. Not an open planet map.',
      tags: ['erebus-9', 'charybdis', 'airlock', 'opening'],
    },
    {
      id: 'e9-lore-2',
      title: 'Beryllium Nav-Drive',
      category: 'history',
      body: 'A dense glowing sphere: the only flight coordinates off the rock, plus encrypted Apex data. Deliver, keep, sell, burn, or forge. It is not a weapon unless someone jams it into a power coupling in scene.',
      tags: ['nav-drive', 'macguffin', 'apex', 'quest'],
    },
    {
      id: 'e9-lore-3',
      title: 'Drill Bosses',
      category: 'faction',
      body: 'Surviving deep-seam roughnecks under Foreman Rigg. They want the reactor overloaded to blow the swarm out of orbit. Ally for munitions. Steal their fusion-charges and they drop the ceiling on you later.',
      tags: ['miners', 'rigg', 'faction'],
    },
    {
      id: 'e9-lore-4',
      title: 'Apex Executives',
      category: 'faction',
      body: 'Corporate retrieval team in barricaded luxury suites. Director Sterling wants biological data preserved; miners and colonists are expendable. Ally for clearance codes. Sell them out and the turrets learn your biometrics.',
      tags: ['apex', 'sterling', 'execs', 'faction'],
    },
    {
      id: 'e9-lore-5',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If Vance walks with you, two people in the dark — his wife off-world, his panic, his broken rifle. If he Left, the vents are quieter. If Rival, he steals a hazard suit and sabotages air and bulkheads ahead. Never a silent pack mule. Never a licensed movie creature.',
      tags: ['vance', 'party', 'solo', 'rival'],
    },
  ],

  keyNPCs: [
    {
      id: 'e9-npc-1',
      name: 'Private Vance',
      role: 'Colonial private, optional companion or rival',
      disposition: 'friendly',
      description: 'Terrified, ruptured plasma-rifle, wants to reach his pregnant wife off-world. Betrayal: he survives, unhinges, steals a heavy hazard suit, and sabotages your air and locks.',
      hooks: ['Beg the lockdown override', 'Offer to run together', 'Hunt you if sealed in as bait'],
    },
    {
      id: 'e9-npc-2',
      name: 'Foreman Rigg',
      role: 'Leader of the surviving miners',
      disposition: 'neutral',
      description: 'Wants the rig’s reactor overloaded to kill the swarm and Apex profit with it. Betrayal: remote seismic charges in the ceiling during stealth.',
      hooks: ['Offer heavy munitions', 'Ask you to blow the reactor', 'Drop the tunnel on you if sold out'],
    },
    {
      id: 'e9-npc-3',
      name: 'Director Sterling',
      role: 'Apex retrieval lead',
      disposition: 'hostile',
      description: 'Wants swarm data at any human cost. Ally for clearance. Betrayal: internal defense turrets retarget your biometrics.',
      hooks: ['Offer codes for the drive', 'Treat miners as expendable', 'Hack turrets if crossed'],
    },
  ],

  starterQuests: [
    {
      id: 'e9-quest-1',
      title: 'Bay 4 Breach',
      description:
        'Survive the breach at Air-Lock Bay 4. Decide whether to trust Private Vance. Reach the central elevator shaft before the swarm overruns the sector. The nav-drive holds both escape and the truth.',
      recommendedLevel: 1,
      objectives: ['Answer Vance’s plea', 'Get out of Bay 4', 'Keep the nav-drive'],
      rewards: 'A companion, a rival, or both',
    },
  ],

  starterItems: [
    {
      id: 'e9-fatigues',
      name: 'Scorched Hazard Fatigues',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      description: 'Reinforced synthetic overalls, hydraulic stains, dried acid burns, shoulder lamp with a dying battery. Not a gun.',
      provenance: 'On you when the strobes started',
    },
    {
      id: 'e9-nav',
      name: 'Beryllium Nav-Drive',
      rarity: 'Rare',
      itemType: 'quest',
      itemLevel: 1,
      description: 'Dense glowing sphere. Only flight coordinates off Erebus-9, plus encrypted Apex data. Not a weapon unless the scene already jammed it into a coupling.',
      provenance: 'Pulled from the extraction shuttle during the breach',
    },
  ],
};
