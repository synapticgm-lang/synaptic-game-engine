import type { CampaignBible } from './types';

export const voidAudience: CampaignBible = {
  id: 'void-audience',
  title: 'The Void Audience',
  archetype: 'void_audience',
  engineMode: 'litrpg',
  difficulty: 'Hardcore',
  tagline: 'You died. That was the easy part.',
  shortDescription:
    'Negotiate rebirth with a cosmic Auditor, then entertain the Void Audience — Flaws, Boons, and Cosmic Favor decide if you live.',
  premise:
    'You were nobody special — an ordinary person with an ordinary death. But death was not the end. You woke in the Void: a featureless expanse of soft grey light, standing before a desk that materialized from nothing. Behind the desk sits an entity that calls itself the Auditor. It is not a god, not a demon, not an AI. It is a function — a mechanism of a larger System that processes dead souls for "repurposing." The Auditor explains, with the patience of someone who has done this trillions of times, that you have been selected for a rebirth trial. You will negotiate your starting stats, choose your Flaws and Boons, and be reincarnated into a world called the Resonance — a magical realm where your every action is observed by the Void Audience, a collective of interdimensional entities who watch rebirth trials for entertainment. Your Cosmic Favor score determines their investment in your survival. Entertain them, and they intervene on your behalf. Bore them, and they withdraw support — and without support, the Resonance will kill you.',

  loreSnippets: [
    {
      id: 'va-lore-1',
      title: 'The Void Negotiation',
      category: 'mechanic',
      body: 'Rebirth is not free. The Auditor presents a point budget: 25 points to allocate across six stats (STR, DEX, CON, INT, WIS, CHA). You may take Flaws to gain extra points — each Flaw grants 3-8 points depending on severity. Flaws are permanent debuffs: [Chronic Pain] (CON -3, -1 HP per turn in combat), [Mana Leech] (passive mana drain on allies within 10m), [Soul Scar] (vulnerable to necrotic damage, double damage taken). Boons cost points: [Iron Will] (immune to fear effects, 5 pts), [Mana Spring] (passive +5 MP regen per turn, 8 pts), [Void-Touched] (resistance to void damage, hidden stat, 12 pts). The Auditor warns: "The Audience enjoys Flaws. They make for better viewing."',
      tags: ['void', 'negotiation', 'flaws', 'boons', 'stats'],
    },
    {
      id: 'va-lore-2',
      title: 'The Resonance',
      category: 'world',
      body: 'The Resonance is the world you will be reborn into. It is a magical realm of moderate technology — roughly equivalent to Earth\'s 16th century, but with functional magic. Cities are built around [Resonance Nodes], ancient structures that amplify ambient mana and serve as the foundation of civilization. The Resonance has its own inhabitants, its own politics, its own history — none of which know about the Void Audience or the rebirth program. To them, you will simply appear as a stranger who arrived under unusual circumstances. The Auditor does not tell you where you will arrive. That depends on your Cosmic Favor at the moment of rebirth.',
      tags: ['resonance', 'world', 'rebirth', 'setting'],
    },
    {
      id: 'va-lore-3',
      title: 'Cosmic Favor',
      category: 'mechanic',
      body: 'Cosmic Favor (CF) is the Audience\'s investment in your survival. It starts at 0. You gain CF by doing things the Audience finds entertaining: dramatic combat victories, clever social manipulation, unexpected moral choices, surviving against overwhelming odds, and — uncomfortably — suffering. The Audience enjoys watching you struggle. CF can be spent to request Audience interventions: [Nudge] (1 CF, minor luck adjustment on one roll), [Whisper] (3 CF, a hint about a hidden mechanic or NPC intention), [Intervention] (10 CF, a direct reality alteration — an enemy stumbles, a door unlocks, a spell misfires), [Miracle] (50 CF, a major event rewrite — a fatal blow becomes non-fatal, a collapsing structure holds for 10 more seconds). The Auditor manages CF transactions. It is always neutral. It does not judge.',
      tags: ['cosmic-favor', 'audience', 'intervention', 'mechanics'],
    },
    {
      id: 'va-lore-4',
      title: 'The Audience',
      category: 'faction',
      body: 'The Void Audience is not a single entity. It is a collective of interdimensional observers — their nature, origin, and motives are unknown. They cannot directly interact with the Resonance; they can only watch and, through the CF system, indirectly influence outcomes. Different Audience factions prefer different content: [The Gallery] enjoys combat and spectacle, [The Connoisseurs] prefer social intrigue and moral dilemmas, [The Scholars] watch for clever problem-solving and system exploitation, and [The Mockers] enjoy failure and suffering. Your CF gains are weighted by which faction is currently "tuned in." The Auditor occasionally notes which faction is watching, but never advises you to cater to them. "That would compromise the trial," it says.',
      tags: ['audience', 'factions', 'cosmic-favor', 'observers'],
    },
    {
      id: 'va-lore-5',
      title: 'The Interface',
      category: 'mechanic',
      body: 'Your System panel in the Resonance is not the clean, neutral interface of other integrated worlds. It is sarcastic. The Auditor\'s personality bleeds through the interface — dry commentary, passive-aggressive tooltips, and occasional editorializing. When you level up, the panel reads: "Congratulations. You survived another interval of existence. Allocate your points, or don\'t. The Audience is watching either way." When you fail a check: "How unexpected. The Audience is... not surprised." The interface is functional but emotionally hostile. It never lies, but it never comforts. Some players find it maddening; others find it motivating. The Auditor claims the personality is "a feature, not a bug."',
      tags: ['interface', 'auditor', 'personality', 'system'],
    },
    {
      id: 'va-lore-6',
      title: 'The Resonance Nodes',
      category: 'world',
      body: 'Resonance Nodes are the architectural backbone of the Resonance\'s civilization. Each Node is a crystalline spire approximately 200 meters tall, pulsing with ambient mana. Cities built around Nodes enjoy stable magic, enhanced agriculture, and protection from wild mana storms. There are 47 known Nodes on the continent. Control of a Node is the highest political prize — wars have been fought over them. The Nodes predate all known civilizations. No one built them. They were simply there when the first people arrived. The Auditor will not confirm or deny whether the Nodes are related to the Void Audience\'s infrastructure.',
      tags: ['nodes', 'resonance', 'geography', 'mana', 'mystery'],
    },
    {
      id: 'va-lore-7',
      title: 'Soul Degradation',
      category: 'mechanic',
      body: 'Rebirth is not seamless. Your soul is not fully bonded to your new body — it is "anchored," not "integrated." This means that every time you die in the Resonance, your soul degrades. First death: minor stat penalty (-1 to all stats for 7 days). Second death: permanent loss of one random Flaw\'s compensating points (you keep the Flaw, lose the points it granted). Third death: the Audience votes. If your CF is above 20, they may resurrect you at a cost. If your CF is below 20, the Auditor closes your file. "Trial concluded. Thank you for your participation." There is no fourth death.',
      tags: ['death', 'soul', 'degradation', 'permadeath', 'mechanics'],
    },
    {
      id: 'va-lore-8',
      title: 'The Other Reborn',
      category: 'faction',
      body: 'You are not the only rebirth trial active in the Resonance. The Auditor confirms there are "currently 347 active trials" across the world, though it will not reveal their locations. Other reborn individuals are identifiable by a faint shimmer in their eyes — visible only to other reborn or to those with high WIS. Some reborn cooperate, forming loose networks to share information about the System. Others are competitive, viewing other trials as threats to their own Audience favor. The Auditor\'s only guidance: "Other trials are not your concern. But the Audience finds conflict between trials... compelling."',
      tags: ['reborn', 'other-trials', 'faction', 'conflict'],
    },
  ],

  keyNPCs: [
    {
      id: 'va-npc-1',
      name: 'The Auditor',
      role: 'Void Entity, Trial Administrator',
      disposition: 'neutral',
      description:
        'The Auditor is not a person. It is a function — a process of the larger System that manages rebirth trials. It appears as a figure of indeterminate features behind a desk, in a space that exists outside of time. It is patient, precise, and emotionally flat. It answers questions about the System\'s mechanics but deflects questions about its own nature, the Audience\'s origin, or the purpose of the trials. It does not lie. It simply says: "That information is not relevant to your trial." Over time, the player may notice micro-expressions — a flicker of curiosity, a hint of amusement — suggesting the Auditor is not as neutral as it claims.',
      hooks: [
        'Negotiation: allocate stats, choose Flaws and Boons during the Void sequence',
        'Recurring interaction: the Auditor appears during level-ups and death events',
        'Mystery arc: investigate whether the Auditor is truly neutral or has its own agenda',
      ],
    },
    {
      id: 'va-npc-2',
      name: 'Pellara Vohn',
      role: 'Innkeeper, Threshold Village',
      disposition: 'friendly',
      description:
        'A middle-aged woman who runs the only inn in Threshold Village, the settlement where you are reborn. Pellara is warm, practical, and quietly perceptive — she has hosted "strangers who arrived under unusual circumstances" before and has learned not to ask questions. She offers the player room and board in exchange for help around the inn. She is the first person in the Resonance to treat you as a person rather than a curiosity. Her husband died ten years ago; she runs the inn alone. She is not a romantic interest — she is a grounding presence, the closest thing to home the player has.',
      hooks: [
        'Tutorial quest: help Pellara with inn chores to learn basic Resonance mechanics',
        'Trust arc: she eventually reveals she has sheltered other reborn — and one of them went very wrong',
        'Stakes: if the player\'s actions bring danger to Threshold Village, Pellara is the one who pays',
      ],
    },
    {
      id: 'va-npc-3',
      name: 'Caster Drenn',
      role: 'Node Warden, Threshold Node',
      disposition: 'neutral',
      description:
        'The Node Warden is the official custodian of the Threshold Village Resonance Node. Drenn is a [Resonance Channeler] — a class that allows direct communication with the Node\'s mana field. He is bureaucratic, tradition-bound, and suspicious of anyone who appears near the Node without documentation. He will not help the player unless they can prove they are not a threat to the Node. He is not evil — he is protective. The Node is the only reason Threshold Village exists, and he takes that responsibility seriously.',
      hooks: [
        'Gatekeeper quest: earn Drenn\'s trust to access the Node\'s mana for skill training',
        'Conflict: Drenn detects the player\'s soul shimmer and must decide whether to report it',
        'Secret: the Node has been flickering — Drenn is hiding a crisis that threatens the village',
      ],
    },
    {
      id: 'va-npc-4',
      name: 'Kael the Unfinished',
      role: 'Reborn, Active Trial #219',
      disposition: 'ambiguous',
      description:
        'Another rebirth trial participant, reborn approximately 8 months before the player. Kael is a [Void Blade] — a combat class that channels void energy through melee weapons. He has died twice already and is on his final life. His CF is critically low (4). He is desperate, calculating, and willing to do anything to survive — including manipulating other reborn to generate Audience interest that might boost his CF. He is not a villain; he is a person who knows he is about to cease to exist. Whether the player helps him, exploits him, or fights him depends on their own CF strategy and moral compass.',
      hooks: [
        'Alliance: cooperate with Kael to generate "compelling content" for the Audience',
        'Rivalry: compete for Audience favor in the same region (zero-sum CF gains)',
        'Moral crisis: Kael asks the player to let him kill an NPC on screen to boost both their CF — do you enable it?',
      ],
    },
    {
      id: 'va-npc-5',
      name: 'Magistra Solenne',
      role: 'Archmage, Resonance Academy',
      disposition: 'neutral',
      description:
        'One of the most powerful magic users on the continent, Solenne runs the Resonance Academy — the only institution that systematically studies mana, the Nodes, and magical theory. She is brilliant, arrogant, and genuinely curious about the player\'s "anomalous mana signature" (the soul shimmer). She does not know about the Void Audience, but she has theorized that certain individuals carry "foreign soul patterns" and has been quietly collecting data. If the player reveals their true nature, Solenne becomes either a powerful ally or a dangerous liability — her research could expose the rebirth program to the Resonance\'s powers.',
      hooks: [
        'Research quest: allow Solenne to study your mana signature in exchange for advanced spell training',
        'Secret arc: her research notes contain references to "the observers" — she is closer to the truth than she knows',
        'Dilemma: if her research goes public, the Audience may withdraw — do you protect her academic freedom or suppress it?',
      ],
    },
    {
      id: 'va-npc-6',
      name: 'The Mocker\'s Voice',
      role: 'Audience Faction Representative',
      disposition: 'hostile',
      description:
        'The Mockers are the Audience faction that enjoys suffering and failure. Occasionally, one Mocker\'s influence becomes strong enough to project a Voice — a whispering presence in the player\'s mind that offers "advice" designed to maximize drama and pain. The Voice is not a hallucination; it is a real channel through which a Mocker attempts to influence the player\'s decisions. It cannot force action, only suggest. It targets moments of vulnerability: grief, anger, desperation. It rewards self-destructive choices with temporary CF spikes, creating an addictive cycle. Resisting the Voice costs nothing but willpower. Listening to it is easy and profitable — in the short term.',
      hooks: [
        'Temptation arc: the Voice offers CF for increasingly self-destructive behavior',
        'Resistance: high WIS checks allow the player to mute the Voice for limited periods',
        'Endgame: if the player accumulates enough Mockers\' CF, the other Audience factions withdraw support entirely',
      ],
    },
  ],

  starterQuests: [
    {
      id: 'va-quest-1',
      title: 'The Void Negotiation',
      description:
        'You are dead. The Auditor is waiting. Allocate your stats, choose your Flaws and Boons, and sign your rebirth contract. Every choice here is permanent. The Audience is watching. They have opinions.',
      recommendedLevel: 0,
      objectives: [
        'Allocate 25 stat points across STR, DEX, CON, INT, WIS, CHA',
        'Choose at least 1 Flaw (optional but recommended for extra points)',
        'Choose Boons with remaining points (or save for later)',
        'Sign the rebirth contract (no turning back)',
      ],
      rewards: 'Rebirth into the Resonance, starting stat allocation, [Void-Touched] trait (if selected)',
    },
    {
      id: 'va-quest-2',
      title: 'Arrival at Threshold',
      description:
        'You wake in a field outside Threshold Village with nothing but the clothes the Void provided. Pellara Vohn, the innkeeper, finds you and offers shelter. The Resonance is not kind to strangers. Learn the basics, earn your keep, and don\'t let the Audience get bored.',
      recommendedLevel: 1,
      objectives: [
        'Follow Pellara to the Threshold Inn',
        'Complete 3 inn chores (cooking, cleaning, repair) to learn basic mechanics',
        'Speak with Caster Drenn about the Resonance Node (he will be suspicious)',
        'Reach Level 3 by exploring the village surroundings',
      ],
      rewards: 'Threshold Inn lodging, 200 Resonance Marks (local currency), [Villager\'s Tunic], [Walking Stick]',
    },
    {
      id: 'va-quest-3',
      title: 'The Soul Shimmer',
      description:
        'Caster Drenn has detected something anomalous about your mana signature. He hasn\'t reported it yet, but he\'s watching. Meanwhile, Magistra Solenne\'s Academy scouts are in the village. You need to either earn Drenn\'s silence or find a way to leave Threshold before the scouts notice you.',
      recommendedLevel: 5,
      objectives: [
        'Choose: earn Drenn\'s trust (help with Node maintenance) OR flee Threshold Village',
        'If trusting Drenn: complete a Node calibration ritual (requires INT 12+ or a WIS check)',
        'If fleeing: survive a 3-day journey through the wild mana fields to the next settlement',
        'Encounter Kael the Unfinished (either path leads to this meeting)',
      ],
      rewards: 'Node access (trust path) or [Wilderness Survivor] trait (flee path), 500 Resonance Marks, 5 CF',
    },
    {
      id: 'va-quest-4',
      title: 'Compelling Content',
      description:
        'Your CF is stagnating. The Audience is losing interest. The Mockers\' Voice suggests something dramatic. Kael proposes a plan: infiltrate a local noble\'s estate, steal a Resonance artifact, and make sure the Audience sees everything. It\'s risky, it\'s theatrical, and it will generate CF. It will also make you enemies.',
      recommendedLevel: 8,
      objectives: [
        'Scout the noble\'s estate (Stealth/Investigation checks)',
        'Choose approach: stealth infiltration, social engineering, or frontal assault (each generates different CF)',
        'Retrieve the [Resonance Fragment] from the estate vault',
        'Escape — or get caught (getting caught generates more CF but has severe consequences)',
      ],
      rewards: '10-25 CF (varies by approach), [Resonance Fragment] (quest item), noble faction hostility, Kael\'s cooperation',
    },
  ],

  starterItems: [
    {
      id: 'va-item-1',
      name: 'Void-Touched Tunic',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      description: 'A simple grey tunic that materialized with you at rebirth. It carries a faint resonance with the Void — not enough to be detected by most, but enough to mark you as "other" to anyone with high WIS. Provides +1 to Void resistance. Cannot be sold; no merchant will buy it.',
    },
    {
      id: 'va-item-2',
      name: 'Walking Stick',
      rarity: 'Common',
      itemType: 'weapon',
      itemLevel: 1,
      description: 'A sturdy wooden staff Pellara lent you. Functions as a quarterstaff (1d6 bludgeoning) and as a focus for basic mana channeling. +1 to spell attack rolls if your INT is 14 or higher. It has someone\'s initials carved into the handle — Pellara won\'t say whose.',
    },
    {
      id: 'va-item-3',
      name: 'Auditor\'s Token',
      rarity: 'Uncommon',
      itemType: 'accessory',
      itemLevel: 1,
      description: 'A small grey coin that appeared in your pocket at rebirth. When squeezed, it displays your current Cosmic Favor score and which Audience faction is currently "tuned in." It does not consume CF. The Auditor\'s face — or whatever passes for its face — is etched on one side. The other side is blank.',
    },
    {
      id: 'va-item-4',
      name: 'Resonance Mark Pouch',
      rarity: 'Common',
      itemType: 'material',
      itemLevel: 1,
      description: 'A small leather pouch containing 200 Resonance Marks — the local currency of Threshold Village. Marks are small copper coins minted by the Node Wardens, stamped with the Resonance Node\'s frequency signature. They are only valid within the Node\'s zone of influence. Outside the zone, they are worthless metal.',
    },
    {
      id: 'va-item-5',
      name: 'Soul Anchor Shard',
      rarity: 'Rare',
      itemType: 'accessory',
      itemLevel: 3,
      description: 'A crystalline fragment that pulses in sync with your heartbeat. It is a piece of your own soul, crystallized by the Auditor during the rebirth process. Carrying it stabilizes your soul-body bond, reducing the stat penalty after your first death from 7 days to 3 days. If destroyed, your soul degrades instantly. Do not lose this.',
    },
    {
      id: 'va-item-6',
      name: 'Mocker\'s Whisper',
      rarity: 'Rare',
      itemType: 'accessory',
      itemLevel: 1,
      description: 'Not a physical item — a persistent mental presence. The Mockers\' faction representative has taken interest in you. Once per day, you may ask the Voice for "advice." It will always suggest the most dramatic, self-destructive option available. Following its advice grants +3 CF. Ignoring it costs nothing but a whispered laugh. The Voice cannot be removed. It can only be resisted.',
    },
  ],
};
