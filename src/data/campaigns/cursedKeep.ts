import type { CampaignBible } from './types';

export const cursedKeep: CampaignBible = {
  id: 'cursed-keep',
  title: 'Cursed Keep',
  archetype: 'cursed_manor',
  engineMode: 'dnd',
  difficulty: 'Standard',
  tagline: 'The town is quiet. The keep is not.',
  shortDescription:
    '5e-friendly horror mystery: Greyhollow won’t talk about the abandoned keep — until the dead start stirring and the road washes out.',
  premise:
    'The town of Greyhollow sits in a forested valley in the foothills of the Blackspine Mountains, 60 miles from the nearest settlement. It has 300 residents, a church, a tavern, a mill, and a keep on the hill. The keep has been abandoned for 80 years. No one goes there. No one talks about why. The town\'s unspoken rule is simple: the keep is empty, the keep is dangerous, and the keep is not your concern. But the dead are stirring. Livestock have been found drained of blood. The town\'s graveyard has shown signs of disturbance — fresh graves, opened from the inside. And the priest, Father Aldous, has been having dreams. In the dreams, something in the keep is calling him. He has not slept in six days. The townspeople are frightened. The mayor is in denial. The woodcutter\'s daughter went missing three nights ago. You are a traveler who arrived in Greyhollow on the last coach before the autumn rains washed out the road. You cannot leave. And something in the keep knows you are here.',

  loreSnippets: [
    {
      id: 'ck-lore-1',
      title: 'The Town of Greyhollow',
      category: 'world',
      body: 'Greyhollow was founded 200 years ago as a logging settlement, harvesting the dense Blackspine forests for timber. The keep on the hill was built by the founding family, the Greymark line, as a fortified residence and administrative center. The town grew to 500 residents at its peak, sustained by the timber trade. Then, 80 years ago, the Greymark family vanished — all of them, in a single night. The townspeople found the keep empty the next morning. No bodies. No signs of struggle. No explanation. The timber trade collapsed within a year as workers refused to stay. The population fell to 300 and has never recovered. The town survives on subsistence farming, hunting, and stubbornness. The keep has been sealed and avoided ever since. The town\'s collective silence about the Greymark disappearance is not forgetfulness — it is a deliberate, generational pact of denial.',
      tags: ['greyhollow', 'town', 'history', 'greymark', 'setting'],
    },
    {
      id: 'ck-lore-2',
      title: 'The Greymark Vanishing',
      category: 'history',
      body: 'On the night of the autumn equinox, 80 years ago, the Greymark family — Lord Castellan Greymark, his wife Lady Mirelle, their three children, and the household staff (14 people total) — disappeared. The town\'s woodcutter, whose cabin was the closest dwelling to the keep, reported hearing nothing unusual that night. No screams, no combat, no fire. The keep was found locked from the inside. When the town\'s blacksmith broke through the gate the next morning, every room was empty. Beds were slept in. Meals were half-eaten on the table. Candles had burned to stubs. The only anomaly was the great hall: the fireplace was cold, but the stone floor beneath it was cracked, as if something had pushed up from below. The crack was sealed with mortar within the week. No one has opened it since. No investigation was conducted. The town agreed, without discussion, to never speak of it.',
      tags: ['greymark', 'vanishing', 'mystery', 'history', 'keep'],
    },
    {
      id: 'ck-lore-3',
      title: 'The Blackspine Forest',
      category: 'world',
      body: 'Greyhollow is surrounded by the Blackspine Forest — a dense, old-growth woodland of pine, oak, and ironwood trees. The forest is dark, wet, and quiet in a way that unsettles even experienced rangers. Wildlife is present but sparse; the deer are skittish, the wolves are silent, and the birds do not sing within a mile of Greyhollow. The forest has a reputation among the region\'s other settlements: travelers report feeling watched, hearing footsteps that stop when they stop, and finding trees marked with symbols that were not there the day before. Whether the forest is genuinely haunted or merely ominous is unclear. What is clear is that the forest has been getting closer to the town — the treeline has advanced 20 meters in the last decade, and no one can explain why.',
      tags: ['blackspine', 'forest', 'geography', 'mystery', 'setting'],
    },
    {
      id: 'ck-lore-4',
      title: 'The Bloodless Livestock',
      category: 'mechanic',
      body: 'Over the past three weeks, six of the town\'s livestock animals — four sheep and two cows — have been found dead in their pens. Each was unmarked except for two small punctures on the neck. Each was completely drained of blood. The wounds are consistent with a vampire\'s bite, but no vampire has been reported in the region. The animals were found inside locked pens with no sign of forced entry. The mayor has attributed the deaths to "a diseased fox" and ordered the pens reinforced. The reinforcements have not helped. The town\'s hunter, Greta, has staked out the pens three nights in a row and seen nothing. Whatever is killing the livestock is invisible, intangible, or both.',
      tags: ['livestock', 'bloodless', 'vampire', 'mystery', 'threat'],
    },
    {
      id: 'ck-lore-5',
      title: 'The Graveyard Disturbance',
      category: 'mechanic',
      body: 'Greyhollow\'s graveyard, behind the church, has shown signs of disturbance. Three fresh graves — dug within the last month — have been opened from the inside. The coffins are empty. The bodies are gone. The graves were dug for townspeople who died of natural causes: old Hilda the seamstress (age 79), Tam the miller\'s son (age 4, fever), and Bor the carpenter (age 62, heart failure). Their bodies are not in the graveyard. They have not been seen in town. Father Aldous found the disturbed graves during his morning prayers and has not told the congregation. He is afraid of what it means. The dead are not resting. The dead are walking. And they are going somewhere — somewhere specific, somewhere uphill.',
      tags: ['graveyard', 'undead', 'disturbance', 'mystery', 'threat'],
    },
    {
      id: 'ck-lore-6',
      title: 'The Keep on the Hill',
      category: 'world',
      body: 'The Greymark Keep sits on a granite hill 200 meters north of Greyhollow. It is a three-story stone structure with a central tower, a courtyard, and a crypt beneath the great hall. The keep has been sealed since the Vanishing. The gate is chained. The windows are shuttered. The courtyard is overgrown with 80 years of vegetation. But the keep is not dead. On overcast nights, a faint light has been reported in the tower\'s upper window — a pale, cold light, like moonlight through ice. The town dismisses these reports as reflections or hallucinations. Father Aldous, who has been watching the keep from his church window, knows the light is real. It pulses. It is not random. It is a signal.',
      tags: ['keep', 'greymark', 'mystery', 'signal', 'threat'],
    },
    {
      id: 'ck-lore-7',
      title: 'Father Aldous\'s Dreams',
      category: 'mystery',
      body: 'Father Aldous is the town\'s priest, a middle-aged man who has served Greyhollow for 15 years. He is gentle, faithful, and not prone to superstition. But for the last six nights, he has dreamed the same dream: he is standing in the keep\'s great hall, before the sealed fireplace. The mortar cracks. The crack widens. Something pushes up from below — not a creature, but a presence, a will, a hunger that fills the room like smoke. It speaks to him. It does not use words. It shows him images: the keep as it was, the Greymark family as they were, and then — the Greymark family as they are now, below the keep, in the dark, not dead, not alive, waiting. It wants him to open the crack. It wants him to come down. It says it has been patient for 80 years, and its patience is ending.',
      tags: ['aldous', 'dreams', 'keep', 'mystery', 'threat', 'ancient-evil'],
    },
    {
      id: 'ck-lore-8',
      title: 'The Missing Girl',
      category: 'mystery',
      body: 'Lina, the woodcutter\'s 12-year-old daughter, went missing three nights ago. She was last seen collecting kindling at the edge of the treeline, 50 meters from her family\'s cabin — the closest dwelling to the keep. Her father, Oskar, found her kindling basket overturned and her footprints leading toward the hill. The footprints stopped at the keep\'s gate. The gate was still chained. Oskar broke the chain and searched the ground floor. He found nothing. The mayor ordered him to seal the gate and say nothing. Oskar is not obeying. He is frantic. He will talk to anyone who will listen. He is the reason the player will learn about the keep — because Oskar will approach the player in the tavern, desperate for help, because no one in Greyhollow will give it.',
      tags: ['lina', 'missing', 'oskar', 'keep', 'mystery', 'urgency'],
    },
  ],

  keyNPCs: [
    {
      id: 'ck-npc-1',
      name: 'Father Aldous',
      role: 'Town Priest, Dreamer',
      disposition: 'friendly',
      description:
        'Father Aldous is 52, thin, and exhausted. He has not slept in six days because he is afraid of the dreams. He is the town\'s spiritual leader and its moral conscience — a genuinely good man who is out of his depth. He knows something is wrong with the keep, the graveyard, and the livestock, but he has been trying to handle it alone to avoid panicking the town. He is at his breaking point. He will confide in the player if the player shows competence and compassion. His faith is being tested: the dreams are not from God, and he knows it. Something ancient and wrong is using his faith as a doorway.',
      hooks: [
        'Confidant: Aldous shares his dreams and the graveyard disturbances if the player earns his trust',
        'Moral anchor: Aldous will oppose reckless or evil actions, providing ethical counterweight',
        'Stakes: Aldous is being targeted by the entity in the keep — if he breaks, the town loses its spiritual protection',
      ],
    },
    {
      id: 'ck-npc-2',
      name: 'Oskar the Woodcutter',
      role: 'Lina\'s Father, Desperate Man',
      disposition: 'friendly',
      description:
        'Oskar is 40, broad, and frantic. His daughter Lina is missing. He found her footprints leading to the keep and broke in to search. He found nothing, and the town has told him to be quiet. He will not be quiet. He will approach the player in the tavern within the first hour of arrival, desperate for help from anyone who is not from Greyhollow. Oskar is not a fighter, not a scholar, and not a hero — he is a father who has lost his child. He will do anything to get Lina back. He is the player\'s entry point into the mystery and its emotional core.',
      hooks: [
        'Inciting incident: Oskar approaches the player in the tavern and begs for help finding Lina',
        'Emotional stakes: Lina\'s fate is the player\'s first moral test — can they save her, and at what cost?',
        'Access: Oskar has already broken the keep\'s gate chain — he can guide the player to the entrance',
      ],
    },
    {
      id: 'ck-npc-3',
      name: 'Mayor Helga Brask',
      role: 'Town Mayor, Denialist',
      disposition: 'neutral',
      description:
        'Helga is 60, practical, and terrified — though she would never admit the latter. She has been mayor for 20 years and has maintained the town\'s fragile peace through a single principle: do not acknowledge the keep. The livestock deaths, the graveyard disturbances, and Lina\'s disappearance are, in her mind, separate problems with mundane explanations. She is not evil. She is a leader trying to prevent panic in a town that would empty overnight if people understood what was happening. She will resist the player\'s investigation, not out of malice, but out of fear that the truth will destroy Greyhollow. She can be convinced, circumvented, or overridden — each approach has consequences.',
      hooks: [
        'Obstacle: Helga actively discourages investigation and may order the player to leave town',
        'Political arc: the player can earn Helga\'s cooperation by proving the threat is real and manageable',
        'Secret: Helga\'s grandmother was in the keep the night of the Vanishing — she was the only servant who didn\'t disappear, because she was sent home early for being ill',
      ],
    },
    {
      id: 'ck-npc-4',
      name: 'Greta the Hunter',
      role: 'Town Hunter, Practical Ally',
      disposition: 'friendly',
      description:
        'Greta is 30, lean, and the most capable combatant in Greyhollow. She has been staking out the livestock pens and has seen nothing — which frightens her more than seeing something would. Greta is practical, brave, and frustrated by the town\'s denial. She will ally with the player immediately and without reservation. She knows the Blackspine Forest, the terrain around the keep, and the town\'s layout. She is not a trained adventurer, but she is a skilled hunter who can fight, track, and survive. She is the player\'s most reliable physical ally.',
      hooks: [
        'Combat ally: Greta joins the player as a companion for keep exploration and forest encounters',
        'Tracking: Greta can track the missing girl\'s movements and the undead\'s trail',
        'Trust arc: Greta has been watching the keep for weeks — she has observations the player needs',
      ],
    },
    {
      id: 'ck-npc-5',
      name: 'The Entity Below',
      role: 'Ancient Evil, The Hunger in the Keep',
      disposition: 'hostile',
      description:
        'Something has been beneath the Greymark Keep for centuries — older than the Greymark family, older than Greyhollow, older than the forest. It is not a vampire, not a wraith, not a lich. It is something else — a presence that feeds on life force and has been feeding slowly, patiently, for 80 years on the residual energy of the Greymark family it consumed. The family is not dead. They are preserved — suspended in a state between life and death, in the crypt below the keep, their life force slowly siphoned to sustain the entity. The entity is waking. The bloodless livestock, the walking dead, and the dreams are all symptoms of its emergence. It cannot be reasoned with. It can only be destroyed, sealed, or — if the player is clever — starved by severing its connection to the Greymark family.',
      hooks: [
        'Final boss: the entity is the campaign\'s ultimate threat, encountered in the crypt below the keep',
        'Moral choice: the Greymark family is still alive, barely — can they be saved, or must they be sacrificed to destroy the entity?',
        'Multiple solutions: destroy the entity (combat), seal it again (ritual), or starve it (free the Greymarks)',
      ],
    },
    {
      id: 'ck-npc-6',
      name: 'Mira the Apothecary',
      role: 'Town Healer, Hidden Scholar',
      disposition: 'neutral',
      description:
        'Mira is 45, quiet, and knows more than she lets on. She runs the town\'s apothecary shop, providing remedies, poultices, and herbal treatments. She is also the only person in Greyhollow who has read the Greymark family\'s journals — she found them in a hidden compartment in the keep\'s gatehouse 10 years ago and has been secretly studying them ever since. The journals describe the Greymark family\'s discovery of something beneath the hill when they dug the crypt — and their growing realization that what they found was not a treasure, but a prison. Mira has been waiting for someone to come to Greyhollow who could help. She will not volunteer information — she must be asked, and she must trust the asker.',
      hooks: [
        'Information source: Mira has the Greymark journals, which contain critical lore about the entity',
        'Trust arc: Mira reveals the journals only if the player demonstrates competence and discretion',
        'Alchemical aid: Mira can brew potions, antidotes, and holy water for the keep expedition',
      ],
    },
  ],

  starterQuests: [
    {
      id: 'ck-quest-1',
      title: 'The Woodcutter\'s Plea',
      description:
        'You arrived in Greyhollow on the last coach before the rains. The tavern is warm, the ale is passable, and the townspeople are polite but distant. Then a broad, frantic man sits across from you and says: "My daughter is missing. The town won\'t help. You\'re not from here. Will you?" His name is Oskar. His daughter is Lina. Her footprints lead to the keep on the hill.',
      recommendedLevel: 1,
      objectives: [
        'Speak with Oskar at the Greyhollow Tavern',
        'Examine the keep gate (the chain has been broken by Oskar already)',
        'Search the keep\'s ground floor for signs of Lina (Perception/Investigation checks)',
        'Discover the sealed crack in the great hall floor (the sealed fireplace)',
        'Choose: report findings to Father Aldous, Mayor Helga, or investigate independently',
      ],
      rewards: '50 gp, [Greyhollow Tavern lodging], Oskar\'s trust, [Keep Ground Floor Map] (partial), [Broken Chain Link] (evidence)',
    },
    {
      id: 'ck-quest-2',
      title: 'The Priest\'s Confession',
      description:
        'Father Aldous has not slept in six days. He is having dreams about the keep. The graveyard has been disturbed. The livestock are dead and bloodless. He has been carrying this alone. If you earn his trust, he will tell you everything — the dreams, the graves, the fear that something ancient is waking beneath the town.',
      recommendedLevel: 2,
      objectives: [
        'Visit the church and speak with Father Aldous',
        'Earn his trust (Persuasion check, or demonstrate knowledge of the supernatural)',
        'Hear his confession: the dreams, the graveyard disturbances, the entity\'s presence',
        'Examine the disturbed graves (Religion/Arcana checks)',
        'Consult with Greta the Hunter about her observations of the livestock pens',
      ],
      rewards: '75 gp, [Father Aldous\'s Blessing] (temporary +1 to saving throws vs. undead), [Holy Symbol of Greyhollow], graveyard evidence',
    },
    {
      id: 'ck-quest-3',
      title: 'The Apothecary\'s Secret',
      description:
        'Mira the apothecary has been hiding something for 10 years — the Greymark family journals. If you can earn her trust, she will share them. The journals describe what the Greymarks found when they dug the crypt, and why they sealed it. The journals may be the only record of what the entity is and how it was contained.',
      recommendedLevel: 3,
      objectives: [
        'Visit Mira\'s apothecary shop',
        'Earn her trust (demonstrate discretion, or do a favor for the town)',
        'Read the Greymark journals (History/Religion/Arcana checks to interpret)',
        'Learn the entity\'s nature: an ancient life-draining presence, sealed in the crypt',
        'Learn the binding method: the Greymarks sealed it with a ritual that cost their lives — all 14 of them',
      ],
      rewards: '100 gp, [Greymark Journal Transcripts], [Healing Salve] x3, [Holy Water] x2, [Vial of Wardsbane] (anti-undead oil)',
    },
    {
      id: 'ck-quest-4',
      title: 'Descent into the Crypt',
      description:
        'The crack in the great hall floor is the entrance. Below the keep lies the crypt — the Greymark family burial chamber, and beneath it, the prison of the Entity. Lina is down there. The Greymark family is down there — preserved, not dead, not alive. The entity is waking. You must descend, confront what waits below, and decide: destroy it, seal it again, or find a way to free the Greymarks and starve the entity of its sustenance.',
      recommendedLevel: 5,
      objectives: [
        'Break the mortar seal in the great hall (Strength check or tools)',
        'Descend into the crypt (multi-level dungeon: burial chambers, ritual chambers, the prison)',
        'Find Lina (she is alive, held in stasis by the entity as a new food source)',
        'Find the Greymark family (14 people, suspended in life-drain, barely conscious)',
        'Confront the Entity: choose to destroy it (combat), seal it (ritual, requires sacrifice), or free the Greymarks (starves the entity but releases it temporarily)',
      ],
      rewards: '500 gp, [Lina rescued], [Greymark family freed or mourned], [Entity destroyed/sealed/released], Greyhollow saved or doomed, campaign resolution',
    },
  ],

  starterItems: [
    {
      id: 'ck-item-1',
      name: 'Silvered Dagger',
      rarity: 'Uncommon',
      itemType: 'weapon',
      itemLevel: 1,
      description: 'A short dagger with a silver blade, standard equipment for travelers in regions where the undead are a known threat. Deals 1d4 piercing damage, bypasses resistance to non-magical weapons for undead and were-creatures. The blade is etched with a minor warding glyph that glows faintly in the presence of necrotic energy. Mira sold it to you at cost — she insisted.',
    },
    {
      id: 'ck-item-2',
      name: 'Chain Shirt',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      description: 'A light chain shirt worn under a traveling cloak. AC 13 + DEX (max 2). Quieter than plate, more protective than leather. Standard for travelers who expect trouble but cannot afford to clank. The rings are iron, not steel — heavy but reliable.',
    },
    {
      id: 'ck-item-3',
      name: 'Holy Water (Flask)',
      rarity: 'Uncommon',
      itemType: 'consumable',
      itemLevel: 1,
      description: 'A flask of water blessed by Father Aldous. When thrown as an action, deals 2d6 radiant damage to undead and fiends on a direct hit (DC 13 Dexterity save for half). The blessing is genuine — Aldous\'s faith is real, even if it is being tested. He gave you two flasks. He did not charge you.',
    },
    {
      id: 'ck-item-4',
      name: 'Tavern Lodging Token',
      rarity: 'Common',
      itemType: 'accessory',
      itemLevel: 1,
      description: 'A wooden token from the Greyhollow Tavern, good for one week of lodging and meals. The tavern keeper, a gruff woman named Bessa, accepted your coin without questions and warned you not to go to the keep. She did not elaborate. She did not need to.',
    },
    {
      id: 'ck-item-5',
      name: 'Wardsbane Oil',
      rarity: 'Rare',
      itemType: 'consumable',
      itemLevel: 2,
      description: 'A small vial of pale green oil, brewed by Mira. When applied to a weapon, the next hit against an undead creature deals an additional 1d6 radiant damage and prevents the undead from using regeneration for 1 minute. Mira described it as "the closest thing to holy water that doesn\'t require a priest." She brewed it from blackspine root, a plant that grows only in the forest around Greyhollow.',
    },
    {
      id: 'ck-item-6',
      name: 'Greymark Journal Fragment',
      rarity: 'Rare',
      itemType: 'accessory',
      itemLevel: 1,
      description: 'A single page torn from a Greymark family journal, found by Oskar when he searched the keep\'s ground floor. The page is in Lady Mirelle Greymark\'s handwriting and reads: "The crypt is not a crypt. It is a lid. Castellan does not understand what we have sealed, but I do. I have read the old texts. What lies below is not a spirit. It is a mouth. If it opens, it will not stop at our family. It will take the valley. It will take the forest. It will take everything, slowly, patiently, as it has for centuries before us. We are not its jailers. We are its seal. When we are gone, it will wake. God help whoever is here when it does."',
    },
  ],
};
