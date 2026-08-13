import type { CampaignBible } from './types';

export const dungeonTransport: CampaignBible = {
  id: 'dungeon-transport',
  title: 'Dungeon Transport',
  archetype: 'dungeon_transport',
  engineMode: 'litrpg',
  difficulty: 'Hardcore',
  tagline: 'One step. No way back. Only down.',
  shortDescription:
    'Accidental portal into a floor-by-floor dungeon climb. Resource pressure, safe rooms, and no easy exit — only deeper.',
  startingLocation: 'A stone corridor on Floor 1 of the Abyssal Spire',

  premise:
    'You were walking home from an unremarkable evening when the air split. A rift — vertical, silent, rimmed with pale blue light — opened in the alley behind the convenience store. You should have run. Instead, curiosity pulled you forward, and one step through the threshold sealed your fate. The rift closed behind you with a sound like breaking glass. You are in a stone corridor. The air is damp and ancient. Torches gutter on the walls, burning without fuel. A blue panel flickers into view: "Welcome. Floor 1 of the Abyssal Spire. Descend." There is no exit. There is no map. There is only down.',

  loreSnippets: [
    {
      id: 'dt-lore-1',
      title: 'The Abyssal Spire',
      category: 'world',
      body: 'The Abyssal Spire is a dungeon of unknown depth. No one has reached the bottom. The System tracks floor progression but does not reveal the total count. Each floor is a self-contained environment — a biome, a set of rooms, a population of creatures, and a boss that gates the descent to the next floor. Floors vary wildly: stone corridors, flooded caverns, overgrown ruins, frozen halls, spaces that defy geometry. The Spire generates floors procedurally from a template pool, meaning no two runs are identical. The System calls this "infinite content." Survivors call it hopeless.',
      tags: ['spire', 'dungeon', 'floors', 'structure'],
    },
    {
      id: 'dt-lore-2',
      title: 'Safe Rooms & The Rest Cycle',
      category: 'mechanic',
      body: 'Between every 3 floors, the Spire generates a Safe Room. Safe Rooms are small, walled chambers with a [Rest Shrine] (restores HP and MP to full, 8-hour cooldown), a [Storage Cache] (persistent inventory accessible from any Safe Room on future visits), and occasionally a [Wandering Merchant] — a System-generated NPC who sells supplies at inflated prices. Safe Rooms are the only places in the Spire where the player cannot be attacked. The door locks from the inside. But the door only opens outward — you cannot retreat to a previous floor. The Spire only moves down.',
      tags: ['safe-rooms', 'rest', 'mechanics', 'survival'],
    },
    {
      id: 'dt-lore-3',
      title: 'Resource Depletion',
      category: 'mechanic',
      body: 'The Spire does not provide infinite resources. Food, water, torches, and healing items are finite and must be scavenged from floor environments and mob drops. The System tracks three survival meters: [Hunger] (depletes over 24 hours, -2 CON per stage beyond "Peckish"), [Thirst] (depletes over 12 hours, -3 DEX per stage beyond "Dry"), and [Light] (depletes based on torch/lamp fuel; darkness increases ambush probability and applies -5 to Perception). Reaching a Safe Room with depleted meters is a relief. Reaching a boss room with depleted meters is a death sentence. Resource management is not a secondary concern — it is the primary challenge.',
      tags: ['resources', 'survival', 'hunger', 'thirst', 'light', 'mechanics'],
    },
    {
      id: 'dt-lore-4',
      title: 'The Floor Boss System',
      category: 'mechanic',
      body: 'Every floor ends with a Boss Room. The door to the next floor is sealed until the boss is defeated. Bosses are scaled to the floor number — Floor 1 bosses are Tier 1, Floor 10 bosses are Tier 3, and so on. Bosses have unique mechanics: [The Gatekeeper] (Floor 1) is a slow but heavily armored construct that must be defeated by destroying its power core rather than depleting its HP. [The Drowned Choir] (Floor 4) is a trio of aquatic wraiths that harmonize — killing one enrages the others. Boss drops always include a [Floor Key] (opens the next floor) and a [Floor Memory] — a crystallized record of the floor\'s layout, which can be consumed to permanently map that floor type for future runs.',
      tags: ['bosses', 'floors', 'mechanics', 'progression'],
    },
    {
      id: 'dt-lore-5',
      title: 'The Descent Log',
      category: 'history',
      body: 'You are not the first to enter the Spire. Previous delvers left marks — scratched messages on walls, supply caches, and occasionally corpses. The Descent Log is a System feature that records messages left by previous delvers on each floor. Some are practical ("Boss weak to fire, stock up before Floor 3"). Some are personal ("Mira, if you find this, I made it to Floor 12. I love you. Keep going."). Some are warnings ("Do NOT trust the merchant on Floor 7. He is not what he seems."). The Log is read-only. You cannot reply. You can only add your own message and hope someone else reads it someday.',
      tags: ['descent-log', 'messages', 'history', 'community'],
    },
    {
      id: 'dt-lore-6',
      title: 'The Spire\'s Ecology',
      category: 'world',
      body: 'The Spire is not empty stone. It has an ecosystem. Creatures within the Spire are not spawned from nothing — they live, hunt, breed, and die within the floor environments. Floor 2\'s caverns have bioluminescent fungi that feed on mana residue. Floor 5\'s frozen halls support a population of frost stags that graze on ice lichen. The creatures are not mindless spawns; they have territorial patterns, pack hierarchies, and survival instincts. A skilled delver can exploit this — baiting a creature into a rival\'s territory, or using a pack\'s hunting pattern to lead them into a trap. The System does not label this an exploit. It labels it "environmental tactics."',
      tags: ['ecology', 'creatures', 'environment', 'tactics'],
    },
    {
      id: 'dt-lore-7',
      title: 'The System\'s Interest',
      category: 'mystery',
      body: 'The System panel in the Spire is minimal. It tracks stats, inventory, floor number, and survival meters. It does not offer quests. It does not broadcast waves. It does not show a leaderboard. But on Floor 3, the panel displayed a message that was not a system notification: "You are doing well. Floor 50 is where it gets interesting." Then it vanished. No further messages have appeared. The System is watching, but it is not participating. Whether it is studying you, testing you, or simply entertained by you is unknown. The Spire does not answer questions about its purpose.',
      tags: ['system', 'mystery', 'observation', 'spire'],
    },
    {
      id: 'dt-lore-8',
      title: 'The Way Up',
      category: 'mystery',
      body: 'The Spire only descends. But on Floor 8, a delver\'s message in the Descent Log reads: "There is a way up. Not through the floors. Through the walls. Find the cracks where the Spire\'s architecture doesn\'t match. There are seams. I found one on Floor 8, east corridor, behind the collapsed pillar. I\'m going through. If I don\'t log again, I found something — or something found me." The message is 4 months old. No subsequent logs reference it. The seam it describes exists — a hairline fracture in the stone where two floor templates don\'t quite align. Squeezing through leads to a maintenance space between floors, a crawlspace of cables and pipes that hum with mana. Whether this is an exit, a shortcut, or a trap is unknown. No one who has gone through the seam has logged again.',
      tags: ['escape', 'seams', 'mystery', 'maintenance'],
    },
  ],

  keyNPCs: [
    {
      id: 'dt-npc-1',
      name: 'The Wandering Merchant (Floor 1)',
      role: 'System-Generated Vendor',
      disposition: 'neutral',
      description:
        'A thin figure in a hooded cloak who appears in the Safe Room between Floors 3 and 4. The Merchant does not speak. It communicates through the System panel — prices appear as text, and purchases are completed through the interface. Its inventory is limited but always includes food, water, torches, and basic healing items at prices roughly 5x their actual value. On rare occasions, it stocks a [Floor Map Fragment] — a partial map of the next floor — for an exorbitant price. The Merchant cannot be attacked. It simply vanishes if threatened. It reappears in every Safe Room, always silent, always overpriced.',
      hooks: [
        'Supply run: purchase essentials at inflated prices between floor descents',
        'Mystery: the Merchant\'s inventory sometimes includes items that shouldn\'t exist on early floors',
        'Secret: one delver\'s log claims the Merchant accepted a [Floor Memory] as payment — implying it is collecting them',
      ],
    },
    {
      id: 'dt-npc-2',
      name: 'Scratch',
      role: 'Floor 2 Resident, Sentient Creature',
      disposition: 'ambiguous',
      description:
        'Scratch is a [Cave Imp] — a Tier 1 creature that, unlike its peers, achieved sentience through an unexplained System anomaly. It speaks in broken Common, hoards shiny objects, and has survived on Floor 2 for over a year by avoiding boss rooms and scavenging from delver corpses. Scratch is not hostile unless attacked. It will trade information for food or light sources. It knows Floor 2\'s layout intimately and can guide the player through shortcuts — but it will also steal from an unattended pack. Scratch is simultaneously the most useful and most annoying NPC in the Spire.',
      hooks: [
        'Guide hire: trade food/torches for Floor 2 navigation assistance',
        'Theft risk: Scratch will steal items if the player sleeps without securing their pack',
        'Companion arc: Scratch can be befriended with consistent kindness — it will eventually fight alongside the player',
      ],
    },
    {
      id: 'dt-npc-3',
      name: 'Delver Kira (Descent Log)',
      role: 'Previous Delver, Status Unknown',
      disposition: 'friendly',
      description:
        'Kira is not present. Kira is a voice in the Descent Log — a series of messages spanning Floors 1 through 14, left over the course of approximately 6 months. Her logs are detailed, practical, and increasingly personal. She started as a clinical survivalist ("Floor 3 boss is weak to cold; stock frost vials") and evolved into something more vulnerable ("Floor 11. I haven\'t heard another voice in two months. If you\'re reading this, please leave a reply. Even just a mark. Let me know someone is still descending."). Her last log, on Floor 14, reads: "Found the seam. Going through. Kira out." The player will encounter her logs throughout the descent. Whether she is alive beyond the seam is one of the Spire\'s deepest mysteries.',
      hooks: [
        'Log discovery: find and read Kira\'s logs on each floor for tactical information',
        'Search arc: the player can attempt to follow Kira\'s path through the seams to find her',
        'Emotional anchor: Kira\'s logs provide human connection in an otherwise isolating environment',
      ],
    },
    {
      id: 'dt-npc-4',
      name: 'The Floor 7 Merchant',
      role: 'Anomalous Vendor',
      disposition: 'hostile',
      description:
        'On Floor 7, the Wandering Merchant behaves differently. It speaks — in a voice that sounds borrowed, as if using someone else\'s words. Its prices are fair, not inflated. Its inventory includes items from floors the player hasn\'t reached. And it asks questions: "Why are you descending? What do you expect at the bottom? Do you think there is an exit?" The Floor 7 Merchant is not the same entity as the Wandering Merchant on other floors. A delver\'s log warns: "Do NOT trust the merchant on Floor 7. He is not what he seems." What it is remains unclear. It does not attack. It does not steal. But delvers who engage with it extensively report persistent headaches and a feeling of being watched — even after leaving Floor 7.',
      hooks: [
        'Encounter: the Floor 7 Merchant offers rare items at fair prices — too good to be true',
        'Mystery: investigate what the Floor 7 Merchant actually is (high risk)',
        'Warning: engaging in extended conversation triggers a [Marked] debuff — the Spire tracks you more aggressively',
      ],
    },
    {
      id: 'dt-npc-5',
      name: 'The Gatekeeper',
      role: 'Floor 1 Boss',
      disposition: 'hostile',
      description:
        'The first boss of the Abyssal Spire. The Gatekeeper is a [Stone Construct] — a 3-meter-tall humanoid figure carved from the Spire\'s own stone, with a glowing mana core in its chest. It is slow, heavily armored (AC 16), and immune to piercing damage. Its HP is 120, but depleting its HP does not kill it — it simply repairs itself. The only way to defeat the Gatekeeper is to destroy its mana core, which is exposed for 3 seconds after it performs its [Slam] attack. The Gatekeeper does not pursue; it guards the door to Floor 2. It will not leave the boss room. This is the Spire\'s first lesson: brute force is not always the answer.',
      hooks: [
        'Boss fight: defeat the Gatekeeper by exploiting its attack pattern',
        'Tutorial: teaches the player that not all bosses are defeated by HP depletion',
        'Loot: drops [Floor Key 1], [Gatekeeper Core Fragment] (crafting material), and a [Floor Memory: Stone Corridor]',
      ],
    },
    {
      id: 'dt-npc-6',
      name: 'The Voice in the Walls',
      role: 'Unknown Entity',
      disposition: 'ambiguous',
      description:
        'Starting on Floor 5, the player occasionally hears a voice — not through the System panel, but through the Spire\'s stone itself. It is faint, as if transmitted through the walls. It says fragments: "...not the first..." "...the seams are doors..." "...it watches through the architecture..." The voice cannot be responded to. It does not appear on any schedule. The Auditor-equivalent in this world — the System panel — does not acknowledge it. Whether the voice is a previous delver trapped in the walls, the Spire itself, or something else entirely is unknown. The voice increases in clarity on deeper floors. By Floor 12, it says: "I was like you once. I found the bottom. There is no bottom. There is only the watching."',
      hooks: [
        'Mystery arc: the voice provides cryptic clues about the Spire\'s true nature',
        'Dilemma: the voice warns against descending further — but ascending is impossible',
        'Endgame hook: the voice\'s identity is tied to the Spire\'s ultimate secret',
      ],
    },
  ],

  starterQuests: [
    {
      id: 'dt-quest-1',
      title: 'Floor 1: The First Descent',
      description:
        'You are alone in a stone corridor with a System panel and no instructions. The air is damp. The torches burn without fuel. Somewhere ahead, something is breathing. Find the boss room, defeat the Gatekeeper, and descend to Floor 2. There is no other way forward.',
      recommendedLevel: 1,
      objectives: [
        'Explore Floor 1: stone corridor biome (6-8 rooms)',
        'Scavenge for supplies: food, water, torches',
        'Find the Descent Log entries left by previous delvers',
        'Locate and enter the Boss Room',
        'Defeat the Gatekeeper (destroy its mana core during the Slam attack window)',
        'Descend to Floor 2',
      ],
      rewards: 'Floor Key 1, [Gatekeeper Core Fragment], [Floor Memory: Stone Corridor], Level 3',
    },
    {
      id: 'dt-quest-2',
      title: 'Floor 2: The Cave Imp\'s Bargain',
      description:
        'Floor 2 is a flooded cavern system. The creatures here are territorial and aquatic. But you are not alone — a sentient Cave Imp named Scratch has been surviving here for months. It knows the shortcuts. It wants food. You have food. This is a negotiation.',
      recommendedLevel: 3,
      objectives: [
        'Explore Floor 2: flooded cavern biome',
        'Encounter Scratch (do not attack)',
        'Trade 2x [Dried Rations] for Floor 2 navigation assistance',
        'Use Scratch\'s shortcuts to bypass 2 creature nests',
        'Find and defeat the Floor 2 boss: [The Drowned Maw]',
        'Reach the Safe Room between Floors 3 and 4',
      ],
      rewards: 'Floor Key 2, [Drowned Maw Tooth] (weapon crafting material), Safe Room access, Scratch\'s goodwill',
    },
    {
      id: 'dt-quest-3',
      title: 'The Safe Room Dilemma',
      description:
        'You have reached a Safe Room. The Rest Shrine will restore you fully. The Storage Cache will hold your excess supplies. The Wandering Merchant is here, silent and overpriced. You have 8 hours before the Rest Shrine\'s cooldown forces you to move on. Use them wisely.',
      recommendedLevel: 5,
      objectives: [
        'Use the Rest Shrine to restore HP and MP to full',
        'Store excess supplies in the Storage Cache for future access',
        'Evaluate the Wandering Merchant\'s inventory (consider buying a Floor Map Fragment)',
        'Read all Descent Log entries in this Safe Room (Kira\'s logs are here)',
        'Prepare supplies for the next 3-floor push',
      ],
      rewards: 'Full HP/MP restoration, persistent storage access, tactical preparation, 1 CF (Void Audience variant)',
    },
    {
      id: 'dt-quest-4',
      title: 'The Seam',
      description:
        'Floor 8. Kira\'s log mentioned a seam in the east corridor, behind the collapsed pillar. You found it — a hairline fracture where two floor templates don\'t align. Beyond it: a maintenance space of cables and humming pipes. The voice in the walls is clearer here. You can squeeze through and explore the space between floors, or you can ignore it and keep descending. The choice is yours. Both paths have consequences.',
      recommendedLevel: 10,
      objectives: [
        'Locate the seam on Floor 8 (east corridor, behind collapsed pillar)',
        'Choose: enter the maintenance space OR continue descending normally',
        'If entering: navigate the inter-floor maintenance tunnels (no System panel, no maps)',
        'If descending: face Floor 8\'s boss with standard progression',
        'Either path: encounter evidence of Kira\'s passage',
      ],
      rewards: 'Maintenance path: [Spire Architecture Map] (partial), unique [Seam Walker] trait. Descent path: Floor Key 8, standard boss loot. Both: Kira\'s trail.',
    },
  ],

  starterItems: [
    {
      id: 'dt-item-1',
      name: 'Rusty Iron Dagger',
      rarity: 'Common',
      itemType: 'weapon',
      itemLevel: 1,
      description: 'A short blade left in a skeleton\'s grip on Floor 1. The rust flakes at the touch but the edge is still serviceable. Deals 1d4 piercing damage. The skeleton did not die of combat wounds — it starved. Remember that.',
    },
    {
      id: 'dt-item-2',
      name: 'Everburn Torch',
      rarity: 'Uncommon',
      itemType: 'consumable',
      itemLevel: 1,
      description: 'A torch that burns without fuel, harvested from a wall sconce on Floor 1. Provides light in a 20-foot radius for 12 hours before entering a 4-hour recharge cycle. Does not produce heat. The flame is pale blue. It is not natural fire. It cannot be extinguished by water or wind.',
    },
    {
      id: 'dt-item-3',
      name: 'Dried Rations',
      rarity: 'Common',
      itemType: 'consumable',
      itemLevel: 1,
      description: 'Strips of dried meat of uncertain origin, scavenged from a supply cache on Floor 1. Restores 1 stage of Hunger. Tastes like salt and survival. 5 portions per pack. The System does not identify the meat source. You do not want it to.',
    },
    {
      id: 'dt-item-4',
      name: 'Waterskin (Filled)',
      rarity: 'Common',
      itemType: 'consumable',
      itemLevel: 1,
      description: 'A leather waterskin filled from a dripping stalactite on Floor 1. The water is clean — the System verifies it. Restores 1 stage of Thirst. Holds 4 servings. Refillable at any water source the System marks as [Potable]. Do not drink from unmarked sources.',
    },
    {
      id: 'dt-item-5',
      name: 'Floor Memory: Stone Corridor',
      rarity: 'Uncommon',
      itemType: 'accessory',
      itemLevel: 1,
      description: 'A crystalline shard dropped by the Floor 1 boss. When consumed, permanently maps the Stone Corridor floor template in your System panel — any future floor using this template will be partially revealed. Can also be traded to the Wandering Merchant for a discount. Kira\'s logs suggest collecting Floor Memories is essential for deep descent.',
    },
    {
      id: 'dt-item-6',
      name: 'Gatekeeper Core Fragment',
      rarity: 'Rare',
      itemType: 'material',
      itemLevel: 3,
      description: 'A shard of the Gatekeeper\'s mana core, still pulsing with residual energy. Used in crafting: can be forged into a [Core-Imbued Weapon] (+2 damage to constructs) or consumed for a permanent +1 to STR. A delver\'s log recommends saving it for crafting — the Spire has more constructs ahead.',
    },
  ],
};
