import type { CampaignBible } from './types';

export const systemIntegration: CampaignBible = {
  id: 'system-integration',
  title: 'System Integration',
  archetype: 'system_apocalypse',
  engineMode: 'litrpg',
  difficulty: 'Hardcore',
  genreTag: 'Apocalypse',
  tagline: 'Earth was not asked. Earth was registered.',
  shortDescription:
    'LitRPG system apocalypse: blue panels, permanent death, dungeon zones in modern cities. Survive Waves and claim a Foundation Core.',
  worldOutlineId: 'grid-metro',
  premise:
    'At 03:14 UTC, every human on Earth received a translucent blue panel. No government claimed responsibility. No satellite detected the source. The panels simply appeared — floating at eye level, impossible to dismiss, written in the viewer\'s native language. They read: "Integration Protocol Active. Welcome, Citizen. You have been registered." Within hours, the rules became clear: stats were real, levels were real, and death was permanent. Modern infrastructure buckled as ambient mana flooded the atmosphere, frying electronics and rendering firearms unreliable. Cities fractured into survivor hubs, dungeon zones, and dead zones. The System broadcasts globally — quests, wave warnings, leaderboard rankings — and it does not negotiate.',

  loreSnippets: [
    {
      id: 'si-lore-1',
      title: 'The Integration Event',
      category: 'history',
      body: 'The Integration was not instantaneous. It unfolded in three phases. Phase One ("Registration") lasted approximately 90 seconds — every human received a class panel and a starting allocation of 10 stat points. Phase Two ("Mana Saturation") began six hours later when ambient mana reached critical density, permanently disabling unshielded electronics across 78% of the planet. Phase Three ("Dungeon Seeding") began 72 hours later as spatial rifts opened in population centers, depositing dungeon entrances that merged with existing architecture. No warning preceded any phase. The System offered no explanation beyond a single line: "Adaptation is the curriculum."',
      tags: ['integration', 'history', 'phases', 'mana'],
    },
    {
      id: 'si-lore-2',
      title: 'The Class Awakening',
      category: 'mechanic',
      body: 'Every registered citizen received a class at Integration. Classes were not chosen — they were assigned based on a hidden algorithm that evaluated the subject\'s pre-Integration life, personality, and latent potential. A construction worker might awaken as a [Foundation Builder]. A nurse might become a [Mending Channel]. The System does not reveal the algorithm. Rerolling a class costs 50,000 System Points and requires a rare item called a [Null Core], found only in Tier 3+ dungeons. Some classes are "locked" — greyed out on the panel — and unlock only after meeting hidden conditions. The rumor that certain classes can only be obtained by dying and being resurrected by a teammate has never been confirmed.',
      tags: ['classes', 'awakening', 'system', 'mechanics'],
    },
    {
      id: 'si-lore-3',
      title: 'Dungeon Zones & Dead Zones',
      category: 'world',
      body: 'Dungeon zones are areas where spatial rifts deposited dungeon architecture into the real world. A shopping mall might now contain three floors of monster-infested corridors with a boss room where the food court used to be. Dead zones are areas where mana saturation was so extreme that all biological life perished and the terrain itself mutated — crystalline forests, gravity-inverted ruins, lakes of liquid mana. Dead zones are identifiable by their violet sky tint and the complete absence of System quest markers. Entering a dead zone disables the System panel entirely until you leave. No one knows why.',
      tags: ['dungeons', 'dead-zones', 'geography', 'mana'],
    },
    {
      id: 'si-lore-4',
      title: 'The Wave System',
      category: 'mechanic',
      body: 'Every 14 days, the System broadcasts a Wave Warning. Waves are escalating monster surges that spawn from dungeon entrances and dead zone borders. Wave 1 was manageable — mostly Tier 1 creatures, repelled by coordinated survivor groups. Wave 5 destroyed the eastern seaboard\'s largest hub. Wave difficulty scales with the average level of survivors in the region, meaning a well-leveled hub attracts harder waves. This creates a brutal dilemma: level up to survive, but leveling up makes your home a bigger target. The System calls this "proportional challenge calibration." Survivors call it a death spiral.',
      tags: ['waves', 'escalation', 'threat', 'system'],
    },
    {
      id: 'si-lore-5',
      title: 'The Survivor Hub Economy',
      category: 'faction',
      body: 'Within weeks, survivor hubs established barter economies using System-dropped materials as currency. [Mana Crystal] fragments are the most common denomination — they drop from dungeon mobs and can be consumed for temporary stat boosts. High-tier hubs mint [System Coins], stamped tokens enchanted with a minor System verification enchantment that prevents counterfeiting. Trade routes between hubs are dangerous; caravans require armed escorts. The most valuable trade goods are [Null Cores] (for class rerolls), [Stabilizer Fields] (portable electronics shielding), and [Respawn Anchors] (rare devices that grant a one-time death override within a 50m radius).',
      tags: ['economy', 'trade', 'currency', 'factions'],
    },
    {
      id: 'si-lore-6',
      title: 'The Silent Broadcast',
      category: 'history',
      body: 'On day 30 post-Integration, every panel simultaneously displayed a message no one requested: "Phase 2 content will begin when 10% of registered citizens reach Level 50. Current progress: 0.3%." Then it vanished. No further mention of "Phase 2" has appeared. Researchers theorize Phase 2 involves inter-dimensional content — other integrated worlds, or the System\'s origin plane. The 10% threshold means roughly 800 million people must reach Level 50. At current mortality rates, this may take decades — or it may never happen. The System has not clarified whether Phase 2 is a reward or a threat.',
      tags: ['phase-2', 'mystery', 'system', 'broadcast'],
    },
    {
      id: 'si-lore-7',
      title: 'Base Building & Territory Control',
      category: 'mechanic',
      body: 'The System grants every citizen a [Foundation Core] at Level 5 — a small crystalline device that, when placed on the ground, claims a 100m radius as personal territory. Within claimed territory, the System panel gains a [Build] submenu: walls, shelters, storage, crafting stations, and defensive turrets can be constructed using dropped materials. Territory claims can overlap, triggering a System-mediated [Territory Dispute] — a structured negotiation or combat trial. Higher-level Foundation Cores expand the radius and unlock advanced structures. Destroying an enemy\'s Foundation Core dissolves their claim and transfers all structures to the destroyer.',
      tags: ['base-building', 'territory', 'mechanics', 'system'],
    },
    {
      id: 'si-lore-8',
      title: 'The Mana Famine',
      category: 'world',
      body: 'Not all areas suffer from mana overflow. The Mana Famine describes a phenomenon in the American Midwest and central Asian steppes, where ambient mana is mysteriously absent. In famine zones, System panels function but skills and abilities that require mana fail entirely. Survivors in these zones rely on pure physical classes and crafted weapons. The boundary between mana-rich and mana-famine zones shifts unpredictably — a hub that was safe one week may find its mana supply severed the next. The cause is unknown. Some theorize the System is "balancing" mana distribution; others believe something is consuming it.',
      tags: ['mana-famine', 'geography', 'mystery', 'survival'],
    },
  ],

  keyNPCs: [
    {
      id: 'si-npc-1',
      name: 'Warden Elise Cho',
      role: 'Hub Commander, Riverside Stronghold',
      disposition: 'friendly',
      description:
        'Former logistics officer, awakened as a [Strategic Commander] — a rare class that grants passive buffs to allies within her territory radius and a [Tactical Map] ability that reveals nearby threats. Elise runs the Riverside Stronghold with disciplined pragmatism. She is not cruel, but she is ruthless about resource allocation: non-combatants receive food and shelter, but must contribute labor or crafting output. She will recruit the player if their class complements the stronghold\'s needs.',
      hooks: [
        'Recruitment offer: join Riverside as a sanctioned operative in exchange for housing and supplies',
        'Wave defense quest: prepare the stronghold for the next Wave (14-day timer)',
        'Trust arc: she hides the fact that her class ability is slowly killing her',
      ],
    },
    {
      id: 'si-npc-2',
      name: 'Dr. Yusuf Okafor',
      role: 'System Researcher, Independent',
      disposition: 'neutral',
      description:
        'A theoretical physicist who worked on quantum field theory before Integration. Awakened as an [Analyst] — a support class with no combat abilities but a unique [System Probe] skill that reveals hidden mechanics in the System interface. Yusuf believes the System is not malevolent but indifferent — a framework being tested, not a god being worshipped. He trades information for dungeon drops and will share research notes if the player brings him [Null Cores] for study.',
      hooks: [
        'Research exchange: bring Null Cores in exchange for hidden System mechanic reveals',
        'Theory quest: investigate a dead zone to test his "Phase 2 portal" hypothesis',
        'Moral dilemma: his research could weaponize the System — does the player enable or stop him?',
      ],
    },
    {
      id: 'si-npc-3',
      name: "Marcus \"Tunnel\" Reyes",
      role: 'Dungeon Delver, Unaffiliated',
      disposition: 'ambiguous',
      description:
        'Awakened as a [Breacher] — a combat class specialized in dungeon entry and trap disarmament. Marcus is one of the few survivors who has cleared a Tier 3 dungeon solo. He is pragmatic, transactional, and emotionally guarded. He lost his entire original party in Wave 3 and now operates alone. He will hire out as a dungeon guide for steep prices and will never enter a dungeon with someone he hasn\'t vetted. Beneath the hardened exterior, he is quietly looking for someone worth trusting again.',
      hooks: [
        'Hire guide: pay a premium for his dungeon escort services',
        'Trust arc: earn his confidence by not abandoning him during a boss fight',
        'Secret: he carries a [Respawn Anchor] he has never used — saving it for someone specific',
      ],
    },
    {
      id: 'si-npc-4',
      name: 'The Broker',
      role: 'Information Trader, Identity Unknown',
      disposition: 'neutral',
      description:
        'No one has seen the Broker\'s face. Communication happens through dead drops and encrypted System messages routed through anonymous relay accounts. The Broker sells information — dungeon maps, Wave predictions, hub vulnerabilities, class unlock conditions — to anyone who can pay in [Null Cores] or high-tier loot. The Broker has never betrayed a client, but has also never warned one. Whether the Broker is an individual, a group, or a System-adjacent entity is unknown. Dealing with the Broker is useful but reputationally risky — hub leaders distrust anyone known to use their services.',
      hooks: [
        'Intel purchase: buy dungeon maps or class unlock hints',
        'Mystery arc: investigate the Broker\'s identity (high risk, high reward)',
        'Betrayal branch: sell the Broker\'s identity to a hub for political favor',
      ],
    },
    {
      id: 'si-npc-5',
      name: 'Sister Amara',
      role: 'Healer & Spiritual Leader, St. Benedict\'s Refuge',
      disposition: 'friendly',
      description:
        'Awakened as a [Mending Channel] — a healing class that converts her own stamina into restorative energy for others. Amara runs a refuge in a converted church that accepts all survivors regardless of class, level, or affiliation. She is genuinely kind but not naive — she knows the refuge is a target and has quietly trained a defensive militia. She believes the System is a test of character, not strength, and will challenge the player\'s moral choices throughout the campaign.',
      hooks: [
        'Volunteer quest: defend the refuge during a Wave in exchange for free healing and rest',
        'Moral arc: she asks the player to spare a raider who attacked the refuge — with consequences either way',
        'Secret: her healing class is slowly converting her stamina into permanent HP loss — she is dying',
      ],
    },
    {
      id: 'si-npc-6',
      name: 'Garrick Slate',
      role: 'Warlord, Iron Territory',
      disposition: 'hostile',
      description:
        'Awakened as a [Conqueror] — a rare command class that grows stronger by absorbing defeated enemies\' Foundation Cores. Garrick has built the Iron Territory by force, absorbing six neighboring hubs in the first two months. He rules through fear and controlled resource distribution. He is not stupid — he recognizes that mindless aggression attracts Waves and offers "protection" pacts to hubs that submit voluntarily. He will see the player as either an asset to recruit or a threat to eliminate, depending on their reputation and level.',
      hooks: [
        'Rivalry arc: refuse his protection pact and defend against his expansion',
        'Dark path: accept his offer and become his enforcer (unlocks unique [Enforcer] subclass)',
        'Assassination quest: a rival hub leader asks the player to eliminate Garrick',
      ],
    },
  ],

  starterQuests: [
    {
      id: 'si-quest-1',
      title: 'First Blood',
      description:
        'The System has registered you. Your class panel glows. But the tutorial ended after one sentence: "Survive." A nearby convenience store has been seeded as a Tier 1 micro-dungeon. Clear it to reach Level 5 and claim your Foundation Core.',
      recommendedLevel: 1,
      objectives: [
        'Enter the convenience store micro-dungeon',
        'Defeat the dungeon mobs (estimated 4-6 Tier 1 creatures)',
        'Defeat the mini-boss: [Corrupted Stockboy] (Level 3)',
        'Claim the dungeon drop: [Foundation Core]',
        'Reach Level 5 to activate the Foundation Core',
      ],
      rewards: 'Foundation Core, 500 System Points, 3x [Minor Health Vial], 1x [Mana Crystal] (Common)',
    },
    {
      id: 'si-quest-2',
      title: 'Riverside Recruitment',
      description:
        'Warden Elise Cho has heard about your solo dungeon clear. She sends a runner with an offer: join Riverside Stronghold as a sanctioned operative. Housing, food, and crafting access in exchange for Wave defense duty and dungeon scouting. The offer expires before the next Wave.',
      recommendedLevel: 5,
      objectives: [
        'Travel to Riverside Stronghold (2 hours through contested territory)',
        'Meet Warden Elise Cho at the command post',
        'Accept or decline the recruitment offer',
        'If accepted: complete a trial dungeon run with a Riverside squad',
      ],
      rewards: 'Riverside housing access, crafting station privileges, 1,000 System Points, [Starter Weapon Kit]',
    },
    {
      id: 'si-quest-3',
      title: 'The Wave is Coming',
      description:
        'The System broadcasts a Wave Warning: Wave 6 will strike the Riverside region in 14 days. Estimated threat level: Tier 3. Elise needs every operative scouting dungeon entrances, reinforcing walls, and stockpiling healing supplies. The clock is ticking.',
      recommendedLevel: 8,
      objectives: [
        'Scout and map 3 dungeon entrances near the stronghold',
        'Collect 20x [Reinforced Plating] from dungeon drops for wall upgrades',
        'Clear 1 Tier 2 dungeon to reduce spawn pressure',
        'Participate in the Wave 6 defense (live combat event)',
      ],
      rewards: '2,500 System Points, 1x [Null Core] (rare), Riverside reputation boost, [Wave Defender] title',
    },
    {
      id: 'si-quest-4',
      title: 'The Dead Zone Expedition',
      description:
        'Dr. Okafor has a theory: the dead zone 40 miles north contains a Phase 2 portal — a stable rift to another integrated world. He needs someone to enter the dead zone (where the System panel goes dark), reach the rift, and bring back a sample. Marcus "Tunnel" Reyes has agreed to guide — for a price.',
      recommendedLevel: 15,
      objectives: [
        'Negotiate with Marcus Reyes for guide services (cost: 5,000 System Points or 1 Null Core)',
        'Enter the dead zone — System panel disabled, no skills, no quests',
        'Navigate to the rift using only physical senses and Marcus\'s dungeon instincts',
        'Retrieve a [Phase 2 Sample] from the rift edge',
        'Return alive — the dead zone spawns creatures the System does not track',
      ],
      rewards: '5,000 System Points, [Phase 2 Sample] (quest item), Dr. Okafor\'s research access, unique [Void-Touched] trait',
    },
  ],

  startingLocation: 'A cracked city street',
  replaceDefaultLoadout: true,
  openingHook:
    'The sky tears open. A voice — not human, not machine — speaks to every mind on Earth: "Integration complete. Welcome to the System." A blue panel flickers at eye level.',
  openingMode: 'weave',
  openingRegistrar: {
    voice: 'inworld',
    label: 'SYSTEM',
    startLine: 'The street is still yours. The panel is new.',
  },
  openingPrompts: [
    {
      id: 'name',
      kind: 'name',
      question: 'Confirm designation.',
      suggestions: ['Random designation'],
    },
    {
      id: 'where',
      kind: 'location',
      question: 'Confirm current location.',
      suggestions: [
        'On a city street walking somewhere ordinary',
        'In my apartment or house',
        'In a car stuck in traffic',
        'At a shop, cafe, or work',
      ],
    },
    {
      id: 'wear',
      kind: 'appearance',
      question: 'Visual profile incomplete. Describe garments worn at Registration.',
      suggestions: [
        'Jeans, a jacket, everyday street clothes',
        'Work clothes or a uniform',
        'Gym clothes',
        'Whatever I slept in',
      ],
    },
    {
      id: 'pockets',
      kind: 'kit',
      question: 'Personal-effects scan. List items on your person. Combat-grade declarations will be rejected.',
      suggestions: [
        'Phone, keys, and wallet',
        'A backpack with everyday stuff',
        'Almost nothing in my pockets',
      ],
    },
  ],
  startingContainer: { id: 'si-pack', name: 'Everyday Backpack', capacity: 20 },

  starterItems: [
    {
      id: 'si-clothes',
      name: 'The clothes you had on this morning',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      provenance: 'What you were wearing when Integration hit',
      description: 'Jeans, a jacket, whatever you put on today. Not armor. Not a costume. The same street clothes you had before the sky tore open.',
    },
    {
      id: 'si-item-1',
      name: 'System-Issue Survival Knife',
      rarity: 'Common',
      itemType: 'weapon',
      itemLevel: 1,
      equipped: true,
      slot: 'Main Hand',
      provenance: 'Materialized at Registration',
      description: 'A utilitarian blade that materialized in your hand at Registration. The System logo is etched into the pommel. You did not walk around with this yesterday. Deals 1d6 slashing damage. Unbreakable but cannot be enchanted.',
    },
    {
      id: 'si-item-2',
      name: 'Minor Health Vial',
      rarity: 'Common',
      itemType: 'consumable',
      itemLevel: 1,
      provenance: 'System allotment at Registration',
      description: 'A thumb-sized vial of translucent red liquid. Restores 2d4+2 HP on consumption. Issued with Registration, not looted off this street. Bitter taste. Shelf-stable indefinitely.',
    },
    {
      id: 'si-item-3',
      name: 'Mana Crystal (Common)',
      rarity: 'Common',
      itemType: 'material',
      itemLevel: 1,
      description: 'A rough crystal of solidified ambient mana, about the size of a marble. Used as currency, crafting fuel, and temporary stat boost (consume for +2 to any stat for 10 minutes). Degrades to dust in 30 days if not stored in a System-verified container.',
    },
    {
      id: 'si-item-4',
      name: 'Foundation Core',
      rarity: 'Uncommon',
      itemType: 'accessory',
      itemLevel: 5,
      description: 'A palm-sized crystalline device that claims a 100m radius as personal territory when placed. Unlocks the [Build] submenu in your System panel. Cannot be stolen — only destroyed or voluntarily transferred. Your first claim is free; relocating costs 500 System Points.',
    },
    {
      id: 'si-item-5',
      name: 'Stabilizer Field Generator',
      rarity: 'Uncommon',
      itemType: 'accessory',
      itemLevel: 3,
      description: 'A disc-shaped device that projects a 5m radius field shielding electronics from ambient mana interference. Allows pre-Integration devices (radios, flashlights, medical equipment) to function in mana-saturated zones. Battery lasts 8 hours; recharges in sunlight.',
    },
    {
      id: 'si-item-6',
      name: 'Wave Warning Token',
      rarity: 'Rare',
      itemType: 'accessory',
      itemLevel: 5,
      description: 'A small medallion that vibrates 1 hour before a Wave begins, regardless of System broadcast timing. Crafted by Dr. Okafor using reverse-engineered System components. Provides a critical head start on Wave preparation. Cannot be mass-produced — each token requires a [Null Core] fragment.',
    },
  ],
};
