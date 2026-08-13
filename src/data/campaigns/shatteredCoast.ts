import type { CampaignBible } from './types';

export const shatteredCoast: CampaignBible = {
  id: 'shattered-coast',
  title: 'Shattered Coast',
  archetype: 'patrons_quest',
  engineMode: 'dnd',
  difficulty: 'Standard',
  tagline: 'Five guilds. One city. A dragon that should be dead.',
  shortDescription:
    '5e-friendly coastal intrigue in Saltmar: guild politics, deep-sea secrets, and rumors of a dragon the histories say is dead.',
  startingLocation: 'The harborside streets of Saltmar',

  premise:
    'The Shattered Coast is a region of cliffs, harbors, and ancient ruins along the western edge of the continent. Its capital, Saltmar, is the largest city in the known world — a sprawling metropolis of 80,000 souls built into and onto the coastal cliffs, connected by bridges, lifts, and tunnels. Saltmar is governed by five guilds: the Mariners, the Miners, the Merchants, the Scribes, and the Sentinels. They maintain an uneasy peace through the Compact, a treaty that has held for 40 years. But the Compact is cracking. The Mariners have found something in the deep sea. The Miners have broken through a wall they shouldn\'t have. And the Scribes have translated a text that mentions a dragon — a dragon the histories say was slain 300 years ago. You are a newcomer to Saltmar, hired by one of the guilds (or by someone outside them) to investigate. The city does not welcome outsiders, but it pays them well. And it needs them now more than it admits.',

  loreSnippets: [
    {
      id: 'sc-lore-1',
      title: 'The City of Saltmar',
      category: 'world',
      body: 'Saltmar is built into the Shattered Coast\'s cliffs — a vertical city of stone towers, rope bridges, water-powered lifts, and tunnels carved into the rock. The Upper Ward sits atop the cliffs: guild halls, noble residences, the Sentinel barracks, and the Scribe Athenaeum. The Middle Ward clings to the cliff face: markets, workshops, taverns, and the homes of most citizens. The Lower Ward sits at sea level: the harbor, the fish markets, the Mariners\' docks, and the undercity — a network of sea caves and smuggler tunnels. The city is connected by the Great Lift, a massive counterweight elevator system that moves people and cargo between the three wards. The Great Lift is the city\'s lifeline. If it fails, Saltmar starves.',
      tags: ['saltmar', 'city', 'geography', 'wards', 'setting'],
    },
    {
      id: 'sc-lore-2',
      title: 'The Five Guilds',
      category: 'faction',
      body: 'The Mariners control the harbor, the fishing fleet, and the sea trade routes. Their guildmaster, Captain Iren Voss, is a former pirate turned respectability. The Miners control the quarry tunnels, the gem trade, and the deep-earth excavation projects. Their guildmaster, Tholda Deepdelve, is a dwarf who has been digging for 60 years. The Merchants control the markets, the banks, and the overland trade caravans. Their guildmaster, Lysander Chant, is a human merchant prince with fingers in every deal. The Scribes control the Athenaeum, the legal system, and the historical records. Their guildmaster, Venera Quill, is an elf who has lived for 300 years and remembers things the other guilds would prefer forgotten. The Sentinels are the city guard and military force, sworn to no single guild but to the Compact itself. Their commander, Marshal Brenn, is a half-orc veteran who takes the oath seriously.',
      tags: ['guilds', 'faction', 'politics', 'saltmar', 'compact'],
    },
    {
      id: 'sc-lore-3',
      title: 'The Compact of Saltmar',
      category: 'history',
      body: 'The Compact is the treaty that ended the Guild Wars 40 years ago. It established the five-guild system, the Sentinel neutrality, and the rule that no guild may act against the city\'s interests as a whole. The Compact is enforced by the Sentinel Marshal and interpreted by the Scribe Guildmaster. It has held because each guild needs the others: the Mariners need the Miners\' stone for harbor repairs, the Miners need the Merchants\' trade for revenue, the Merchants need the Scribes\' contracts for legality, and the Scribes need the Mariners\' protection for their sea-bound libraries. The Sentinels are the glue. But the Compact has never been tested by an external threat — and one is coming. The dragon mentioned in the newly translated text is not a legend. It is a warning.',
      tags: ['compact', 'treaty', 'history', 'politics', 'guilds'],
    },
    {
      id: 'sc-lore-4',
      title: 'The Dragon Text',
      category: 'history',
      body: 'The Scribes recently translated a text recovered from a ruin on the Shattered Coast\'s northern islands. The text is 300 years old and describes the death of a red dragon named Vaelthraex the Ember. According to the official histories, Vaelthraex was slain by a company of heroes led by the knight Aldric Goldheart. The newly translated text tells a different story: Vaelthraex was not slain. It was sealed — bound by a ritual that required five binding stones, one for each guild\'s founding principle. The binding is temporary. It lasts 300 years. It expires this year. The Scribes have not shared this information with the other guilds. Venera Quill is deciding what to do with it. The player\'s involvement begins here.',
      tags: ['dragon', 'vaelthraex', 'text', 'binding', 'history', 'mystery'],
    },
    {
      id: 'sc-lore-5',
      title: 'The Binding Stones',
      category: 'mechanic',
      body: 'The five binding stones are physical objects — fist-sized crystals engraved with ancient draconic runes. Each stone was entrusted to one of the guilds\' founding families and has been passed down as a guild heirloom, though their original purpose was forgotten. The Mariners\' stone is set into the harbor master\'s ceremonial compass. The Miners\' stone is embedded in the wall of the deepest quarry tunnel. The Merchants\' stone is the keystone of the Merchant Bank\'s vault. The Scribes\' stone is in the Athenaeum\'s restricted archive. The Sentinels\' stone is set into the hilt of the Marshal\'s ceremonial sword. If the binding expires and the stones are not reunited and re-activated, Vaelthraex will wake. If the stones are destroyed, the binding fails immediately. The guilds do not know what their heirlooms actually are. The Scribes do. The clock is ticking.',
      tags: ['binding-stones', 'mechanics', 'heirlooms', 'vaelthraex', 'quest'],
    },
    {
      id: 'sc-lore-6',
      title: 'The Undercity',
      category: 'world',
      body: 'Beneath the Lower Ward lies the Undercity — a network of natural sea caves and smuggler tunnels that predates Saltmar itself. The Undercity is home to the city\'s black market, its most desperate residents, and things that crawled up from deeper places. The Mariners officially deny the Undercity exists. The Sentinels patrol its upper levels but avoid the deep tunnels. The Miners have recently broken through a wall in the deepest quarry and found a tunnel that connects to the Undercity — a tunnel that should not exist, lined with stone that shows signs of extreme heat, as if something very large and very hot once passed through it. The Miners sealed the tunnel. Tholda Deepdelve has not told the other guilds. She is scared.',
      tags: ['undercity', 'tunnels', 'mystery', 'miners', 'vaelthraex'],
    },
    {
      id: 'sc-lore-7',
      title: 'Draconic Lore of the Shattered Coast',
      category: 'history',
      body: 'The Shattered Coast\'s name comes from a legend: that the coastline was once smooth and unbroken until a dragon\'s breath shattered the cliffs into the jagged, harbor-rich formation seen today. The legend does not specify which dragon. The Scribes\' translated text suggests it was Vaelthraex — not in attack, but in a tantrum. Vaelthraex was ancient even 300 years ago, and the text describes a creature of terrifying intelligence and volcanic rage. It was not sealed because it could not be killed — it was sealed because killing it would have triggered a volcanic eruption beneath the city. The binding ritual was a compromise: delay the problem, hope future generations find a better solution. The future is now.',
      tags: ['draconic', 'vaelthraex', 'history', 'shattered-coast', 'legend'],
    },
    {
      id: 'sc-lore-8',
      title: 'The Northern Islands',
      category: 'world',
      body: 'The Shattered Coast is fringed by a chain of rocky islands to the north, accessible only by boat in calm weather. The islands are uninhabited but dotted with ruins from a pre-Saltmar civilization. The Scribes recovered the dragon text from the largest island, Keth. The Mariners maintain a lighthouse on Keth but otherwise avoid the islands — the waters are treacherous, the ruins are unstable, and the Mariners\' sailors tell stories of "heat from below" that makes the sea steam in winter. The islands are where Vaelthraex was originally sealed. The binding ritual was performed in the ruins on Keth. If the binding is to be renewed, the stones must be brought back there.',
      tags: ['islands', 'keth', 'ruins', 'geography', 'binding', 'vaelthraex'],
    },
  ],

  keyNPCs: [
    {
      id: 'sc-npc-1',
      name: 'Venera Quill',
      role: 'Guildmaster of the Scribes, Elven Scholar',
      disposition: 'neutral',
      description:
        'Venera is an elf who has lived for 300 years — long enough to remember the founding of the Compact, but not the original binding of Vaelthraex. She is calm, precise, and carries the weight of knowledge that no one else has. She translated the dragon text and knows the binding is expiring. She has not told the other guildmasters. She will hire the player to investigate the binding stones and assess whether renewal is possible — without revealing the full truth unless the player earns her trust. She is not malicious. She is terrified that sharing the information will cause panic, guild conflict, or — worst of all — someone destroying the stones deliberately to wake the dragon.',
      hooks: [
        'Patron quest: Venera hires the player to locate and assess the five binding stones',
        'Trust arc: earn Venera\'s confidence to learn the full truth about Vaelthraex',
        'Moral dilemma: Venera asks the player to keep the secret from the other guilds — is she right?',
      ],
    },
    {
      id: 'sc-npc-2',
      name: 'Marshal Brenn',
      role: 'Commander of the Sentinels, Half-Orc Veteran',
      disposition: 'friendly',
      description:
        'Brenn is 55, scarred, and takes the Compact more seriously than anyone in Saltmar. He is the only guild leader who is truly neutral — the Sentinels answer to the city, not to a guild. Brenn is practical, direct, and distrusts politics. He will help the player if the player is honest and serves the city\'s interest. He will oppose the player if they serve a single guild at the city\'s expense. He does not know about the dragon text yet, but he has noticed the Scribes acting strangely and the Miners sealing a tunnel without explanation. He is suspicious. He is patient. He is watching.',
      hooks: [
        'Ally arc: Brenn can become the player\'s most reliable ally if they earn his trust through honesty',
        'Conflict: if the player serves a guild\'s interest over the city\'s, Brenn becomes an obstacle',
        'Key role: Brenn\'s ceremonial sword contains one of the five binding stones — he does not know this',
      ],
    },
    {
      id: 'sc-npc-3',
      name: 'Tholda Deepdelve',
      role: 'Guildmaster of the Miners, Dwarven Excavator',
      disposition: 'neutral',
      description:
        'Tholda is 140 years old (young for a dwarf), covered in quarry dust, and more comfortable underground than above. She broke through the wall that revealed the heat-scarred tunnel and immediately sealed it. She has not told the other guilds. She told only Venera, because she trusts the Scribe\'s judgment. Tholda is not a politician — she is an engineer and a digger. She will help the player access the tunnel if Venera vouches for them. She is scared of what she found, and her fear makes her stubborn. She will not be pushed. She must be convinced.',
      hooks: [
        'Access quest: earn Tholda\'s trust to enter the sealed tunnel and investigate the heat-scarred stone',
        'Engineering: Tholda can reinforce the tunnel or open it further, depending on the player\'s approach',
        'Binding stone: the Miners\' stone is embedded in the deepest quarry wall — Tholda must be convinced to allow its removal',
      ],
    },
    {
      id: 'sc-npc-4',
      name: 'Captain Iren Voss',
      role: 'Guildmaster of the Mariners, Former Pirate',
      disposition: 'ambiguous',
      description:
        'Iren Voss is 48, sun-weathered, and has the easy smile of a man who has killed people and not lost sleep over it. He was a pirate before the Compact, granted amnesty in exchange for serving as guildmaster. He is charming, dangerous, and transactional. He controls access to the harbor and the northern islands. He will help the player reach the islands — for a price. The price is always fair, but it is never free. Iren knows the waters around the islands better than anyone alive. He also knows the Mariners\' binding stone is set into his harbor master\'s compass. He thinks it\'s a navigation charm. He will not give it up easily.',
      hooks: [
        'Transport: Iren provides boat access to the northern islands (for a price or a favor)',
        'Negotiation: the player must convince Iren to surrender the Mariners\' binding stone',
        'Secret: Iren has been to the islands recently — he has seen the steam and knows something is wrong',
      ],
    },
    {
      id: 'sc-npc-5',
      name: 'Lysander Chant',
      role: 'Guildmaster of the Merchants, Human Trade Prince',
      disposition: 'ambiguous',
      description:
        'Lysander is 40, immaculately dressed, and thinks in terms of profit and leverage. He is not evil, but he is relentlessly self-interested. He controls the Merchant Bank, the market regulations, and the overland trade. His binding stone is the keystone of his bank vault — remove it, and the vault\'s magical security fails, exposing the city\'s gold reserves. Lysander will not give up the stone without compensation for the security risk. He can be negotiated with, bought, or outmaneuvered. He is also the most likely to sell the player out to another guild if the price is right. He is not a villain — he is a businessman in a city where everything has a price.',
      hooks: [
        'Negotiation: compensate Lysander for the vault security risk to obtain the Merchants\' binding stone',
        'Rivalry: Lysander and Iren despise each other — the player can exploit or mediate this',
        'Risk: if Lysander learns the true purpose of the stones, he may try to sell the information to the highest bidder',
      ],
    },
    {
      id: 'sc-npc-6',
      name: 'Sable Rook',
      role: 'Undercity Guide, Independent Operator',
      disposition: 'friendly',
      description:
        'Sable is 25, grew up in the Undercity, and knows its tunnels better than anyone except the things that live in the deep tunnels. She works as a guide, a smuggler, and occasionally a thief — but she has a code: she steals from guild officials, not from citizens. She is the player\'s best source of information about the Undercity and the connection between the Miners\' tunnel and the deep caves. She is sharp, funny, and deeply loyal to the Undercity\'s residents, who are ignored by the guilds above. She will help the player if the player helps the Undercity. She is the moral compass the guilds lack.',
      hooks: [
        'Guide hire: Sable navigates the Undercity tunnels for the player (cost: favors for Undercity residents)',
        'Undercity quest: help Sable address a threat to the Undercity community in exchange for deep-tunnel access',
        'Emotional anchor: Sable represents the people the guilds forget — her perspective challenges the player\'s loyalties',
      ],
    },
  ],

  starterQuests: [
    {
      id: 'sc-quest-1',
      title: 'The Scribe\'s Commission',
      description:
        'You have arrived in Saltmar with nothing but your gear and a letter of introduction from a distant contact. The letter directs you to the Scribe Athenaeum in the Upper Ward. Guildmaster Venera Quill has a commission: investigate five guild heirlooms and report on their condition. She does not explain why. The pay is generous. The questions are many.',
      recommendedLevel: 1,
      objectives: [
        'Travel to the Upper Ward via the Great Lift',
        'Meet Venera Quill at the Scribe Athenaeum',
        'Accept the commission: investigate five guild heirlooms',
        'Begin research at the Athenaeum (Investigation/History checks)',
        'Choose which guild to approach first (Mariners, Miners, Merchants, Sentinels, or Scribes)',
      ],
      rewards: '100 gp, [Athenaeum Research Pass], [Letter of Commission] (guild access document), [City Map of Saltmar]',
    },
    {
      id: 'sc-quest-2',
      title: 'The Sealed Tunnel',
      description:
        'Tholda Deepdelve has sealed a tunnel in the deepest quarry. Venera asks you to investigate. Tholda will not let you in unless Venera vouches for you — and even then, she is reluctant. What she found in that tunnel scared her. It should scare you too.',
      recommendedLevel: 3,
      objectives: [
        'Earn Tholda\'s trust (Persuasion check, or do a favor for the Miners\' Guild)',
        'Enter the sealed quarry tunnel',
        'Investigate the heat-scarred stone (Perception/Arcana checks)',
        'Follow the tunnel to its connection with the Undercity',
        'Report findings to Venera — the tunnel shows signs of draconic passage',
      ],
      rewards: '150 gp, [Miners\' Tunnel Access Pass], [Heat-Scarred Stone Sample] (quest item), Venera\'s trust (partial truth revealed)',
    },
    {
      id: 'sc-quest-3',
      title: 'The Binding Stones',
      description:
        'Venera has revealed the truth: the guild heirlooms are binding stones, and the binding on Vaelthraex the Ember is expiring. The stones must be reunited and brought to the ruins on Keth Island for the ritual to be renewed. You must convince all five guilds to surrender their stones. Each guild has a reason to resist. Each requires a different approach.',
      recommendedLevel: 5,
      objectives: [
        'Obtain the Mariners\' stone: negotiate with Captain Iren Voss (trade, favor, or intimidation)',
        'Obtain the Miners\' stone: convince Tholda to excavate it from the quarry wall',
        'Obtain the Merchants\' stone: compensate Lysander for the vault security risk',
        'Obtain the Sentinels\' stone: earn Marshal Brenn\'s trust and explain the situation honestly',
        'Obtain the Scribes\' stone: Venera surrenders it willingly if the other four are secured',
      ],
      rewards: '250 gp per stone, [Five Binding Stones] (quest items), full truth of Vaelthraex revealed, [Ritual Instructions]',
    },
    {
      id: 'sc-quest-4',
      title: 'The Ember Wakes',
      description:
        'The binding is failing. Steam rises from the northern islands. The deep tunnels grow hotter. Vaelthraex the Ember stirs in its prison beneath Keth. The stones are gathered. The ritual must be performed in the ruins on Keth Island before the binding expires. But someone — or something — does not want the binding renewed. The expedition to Keth will be the most dangerous journey of your life.',
      recommendedLevel: 8,
      objectives: [
        'Arrange transport to Keth Island (Captain Iren Voss or alternative)',
        'Travel to the ruins (Survival checks, possible combat encounters)',
        'Reach the binding chamber beneath the ruins',
        'Perform the renewal ritual (requires all five stones, Arcana check DC 20)',
        'Survive Vaelthraex\'s awakening attempts (combat or negotiation — the dragon can speak)',
      ],
      rewards: '1,000 gp, [Scale of Vaelthraex] (Legendary crafting material), [Friend of Saltmar] title, campaign resolution (varies by approach)',
    },
  ],

  starterItems: [
    {
      id: 'sc-item-1',
      name: 'Traveler\'s Longsword',
      rarity: 'Common',
      itemType: 'weapon',
      itemLevel: 1,
      description: 'A serviceable steel longsword, standard for mercenaries and travelers. Deals 1d8 slashing damage (versatile 1d10). Not decorative, not magical, not special — just reliable. The blade has a maker\'s mark from a forge in Thornhaven, the kingdom\'s capital.',
    },
    {
      id: 'sc-item-2',
      name: 'Leather Armor',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      description: 'Boiled leather cuirass with shoulder guards. AC 11 + DEX. Light enough for stealth, sturdy enough for minor skirmishes. Standard gear for travelers who cannot afford plate. Smells faintly of the tannery in the Lower Ward.',
    },
    {
      id: 'sc-item-3',
      name: 'Healing Potion (Standard)',
      rarity: 'Uncommon',
      itemType: 'consumable',
      itemLevel: 1,
      description: 'A vial of crimson liquid that restores 2d4+2 HP when consumed. Standard-issue for adventurers and guild operatives in Saltmar. Brewed by the Scribes\' alchemical division. The recipe is a guild secret, but the potions are sold openly at 50 gp each.',
    },
    {
      id: 'sc-item-4',
      name: 'Letter of Commission',
      rarity: 'Uncommon',
      itemType: 'accessory',
      itemLevel: 1,
      description: 'An official document bearing the Scribe Guild\'s seal, authorizing the bearer to investigate guild heirlooms on behalf of Guildmaster Venera Quill. Grants limited access to guild halls and restricted archives. Does not grant authority to demand cooperation — only to request it. The letter is your key to the city. Do not lose it.',
    },
    {
      id: 'sc-item-5',
      name: 'City Map of Saltmar',
      rarity: 'Common',
      itemType: 'accessory',
      itemLevel: 1,
      description: 'A hand-drawn map of Saltmar\'s three wards, showing major streets, guild halls, the Great Lift stations, and key landmarks. Does not show the Undercity — the Undercity is officially denied. Sable Rook can provide a separate Undercity map for a price. The official map is accurate for the Upper and Middle Wards; the Lower Ward is marked "subject to change" due to dock construction.',
    },
    {
      id: 'sc-item-6',
      name: 'Athenaeum Research Pass',
      rarity: 'Rare',
      itemType: 'accessory',
      itemLevel: 1,
      description: 'A bronze token granting access to the Scribe Athenaeum\'s restricted archive, where the dragon text is stored. The pass is temporary (30 days) and must be returned. It allows the bearer to read, but not copy or remove, restricted documents. Venera issues it personally. She watches who uses it and what they read.',
    },
  ],
};
