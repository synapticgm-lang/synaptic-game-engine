import type { CampaignBible } from './types';

export const fabledLegacy: CampaignBible = {
  id: 'fabled-legacy',
  title: 'Fabled Legacy',
  archetype: 'ai_random',
  engineMode: 'litrpg',
  difficulty: 'Easy',
  tagline: 'Every hero starts somewhere. Yours starts in a village that time forgot.',
  shortDescription:
    'Soft LitRPG village start — no neon HUD focus. Choices, relationships, and consequences in Mossford before the wider world arrives.',
  premise:
    'There are no blue panels. No stat screens. No level-up notifications. There is only the world — the village of Mossford, nestled in a valley between the Greentooth Hills, where nothing exciting has happened in living memory. You are a farmhand, a baker\'s apprentice, or a blacksmith\'s ward. Your parents are gone. Your guardian is old. The harvest festival is in three weeks. And then, one morning, a stranger rides into town with a wound that will not close, a map with a missing piece, and a name that makes the village elder weep. What happens next is up to you. The world does not have a System. It has consequences. Every choice you make — who you help, who you hurt, who you ignore — ripples outward and changes the world in ways you will not see coming. This is not a game with stats. This is a story with teeth.',

  loreSnippets: [
    {
      id: 'fl-lore-1',
      title: 'The Valley of Mossford',
      category: 'world',
      body: 'Mossford sits in a valley carved by the River Tess, fed by snowmelt from the Greentooth Hills to the north. The village has 143 residents, a mill, a smithy, a single inn (The Crooked Beam), and a stone chapel to the Old Faith. The valley is fertile and sheltered — too sheltered, perhaps. No army has passed through in 200 years. No tax collector has visited in 40. The village is, in every meaningful sense, forgotten by the kingdom of Aelmark. The villagers are not unhappy about this. They are suspicious of outsiders, devoted to routine, and quietly proud of their irrelevance. The arrival of a wounded stranger is the most interesting thing to happen here since the Great Flood of \'87.',
      tags: ['mossford', 'valley', 'geography', 'setting'],
    },
    {
      id: 'fl-lore-2',
      title: 'The Old Faith',
      category: 'culture',
      body: 'The villagers of Mossford practice the Old Faith — a nature-centered belief system that predates the kingdom\'s official religion. The Old Faith has no scriptures, no clergy, and no temples. It is a collection of seasonal rituals: the Planting Blessing, the Harvest Vigil, the Solstice Fire, the Mourning Walk. The chapel stone, a menhir behind the village, is the only permanent sacred site. The Old Faith teaches that the land remembers, that debts must be repaid, and that every living thing is connected by invisible threads called the Weave. Whether the Weave is real magic or metaphor is a matter of perspective. The village elder, Old Brennan, insists it is real. The blacksmith, Marta, insists it is nonsense. They have been arguing about this for 30 years.',
      tags: ['old-faith', 'religion', 'culture', 'weave', 'mossford'],
    },
    {
      id: 'fl-lore-3',
      title: 'The Kingdom of Aelmark',
      category: 'faction',
      body: 'Aelmark is the kingdom Mossford technically belongs to. It is a feudal monarchy ruled from the capital, Thornhaven, 200 miles to the south. Aelmark is in its third generation of slow decline — the king is old, the heir is disputed, and the noble houses are maneuvering for position. The kingdom\'s problems are distant abstractions to Mossford, which hasn\'t seen a royal soldier in two generations. But the stranger\'s arrival will change that. The map he carries references a site in the Greentooth Hills — a site the kingdom would very much like to control, and one that the Old Faith would very much like to protect. Mossford is about to become relevant, and no one in Mossford wants that.',
      tags: ['aelmark', 'kingdom', 'politics', 'faction', 'thornhaven'],
    },
    {
      id: 'fl-lore-4',
      title: 'The Greentooth Hills',
      category: 'world',
      body: 'The Greentooth Hills rise north of Mossford — rolling green slopes that sharpen into rocky peaks further north. The hills are home to wildlife, scattered hermit cabins, and old ruins from a civilization that predates Aelmark. The locals hunt and forage in the lower hills but avoid the deep interior, where the terrain becomes treacherous and the weather turns without warning. The stranger\'s map points to something in the deep hills — a structure called the Hollow Cairn, which appears in Old Brennan\'s stories as "the place where the first kings were buried, and the place where the first kings were forgotten." No one in Mossford has been there. No one in Mossford wants to go.',
      tags: ['greentooth', 'hills', 'geography', 'hollow-cairn', 'ruins'],
    },
    {
      id: 'fl-lore-5',
      title: 'The Weave',
      category: 'mechanic',
      body: 'In Fabled Legacy, there are no numerical stats. Instead, the world tracks your choices through the Weave — an invisible web of consequences that the GM narrates. Every significant choice (helping or refusing a villager, sparing or killing an enemy, protecting or abandoning a location) adds a thread to the Weave. Threads connect to each other: helping the baker today may earn you an ally at the harvest festival; refusing the blacksmith may cost you a weapon when you need one most. The Weave is not a meter. It cannot be "maxed." It is a living history of who you are, and the world responds to it. The GM describes how the Weave shifts after major choices: "The village feels warmer toward you." "The hills feel colder." "The stranger watches you differently."',
      tags: ['weave', 'consequences', 'mechanics', 'morality', 'system'],
    },
    {
      id: 'fl-lore-6',
      title: 'The Hollow Cairn',
      category: 'history',
      body: 'The Hollow Cairn is a burial mound in the deep Greentooth Hills, built by a civilization that predated Aelmark by centuries. Old Brennan\'s stories say it was the tomb of the "first kings" — not royalty, but the first leaders of the valley\'s original people. The cairn was sealed with a geas: "Let them rest until the valley forgets their names. Then let the valley remember, or let the valley fall." The stranger\'s map suggests the cairn contains something the kingdom wants — an artifact, a relic, a source of authority. The Old Faith says the cairn must remain sealed. The stranger says the cairn is already opening. The player will have to decide: help open it, help seal it, or find a third path no one has considered.',
      tags: ['hollow-cairn', 'history', 'mystery', 'artifact', 'old-faith'],
    },
    {
      id: 'fl-lore-7',
      title: 'The Harvest Festival',
      category: 'culture',
      body: 'The Harvest Festival is Mossford\'s most important event — a three-day celebration marking the end of the growing season. It features feasting, music, a bonfire, and the Reaping Game, a traditional contest of skill and luck. The festival is also the village\'s primary social mechanism: alliances are formed, disputes are settled, and marriages are proposed. The stranger arrives three weeks before the festival. Whether the festival happens at all — and what kind of festival it is — depends on the player\'s choices. A village under threat may cancel. A village united may use the festival as a rallying point. A village divided may use it as a powder keg.',
      tags: ['festival', 'harvest', 'culture', 'mossford', 'event'],
    },
    {
      id: 'fl-lore-8',
      title: 'The Wound That Will Not Close',
      category: 'mystery',
      body: 'The stranger\'s wound is not a normal wound. It is a cut across his ribs, clean and precise, that will not heal despite Marta\'s best efforts with poultices and stitching. The wound does not fester, does not close, and does not stop the stranger from functioning — but it bleeds slowly, continuously, as if something in the cut refuses to let the flesh knit. Old Brennan recognizes the wound\'s pattern: it matches descriptions in the old stories of "geas-cuts" — wounds inflicted by ancient binding magic, meant to mark someone for a purpose they cannot refuse. The stranger does not know who cut him. He knows only that he was told to find Mossford, and that the wound would close when he found what he was sent to find.',
      tags: ['wound', 'geas', 'mystery', 'stranger', 'magic'],
    },
  ],

  keyNPCs: [
    {
      id: 'fl-npc-1',
      name: 'Old Brennan',
      role: 'Village Elder, Keeper of the Old Faith',
      disposition: 'friendly',
      description:
        'Brennan is 78 years old, sharp of mind and slow of body. He is the village\'s memory — its historian, its spiritual guide, and its most stubborn resident. He knows the old stories, the old rituals, and the old warnings. He recognizes the stranger\'s wound as a geas-cut and is terrified of what it means. He will beg the player not to open the Hollow Cairn. He is not wrong to fear it — but he is also hiding something. Brennan knows more about the cairn than he initially reveals, and his reasons for wanting it sealed are not entirely selfless.',
      hooks: [
        'Tutorial: Brennan teaches the player about the Old Faith and the Weave',
        'Trust arc: earn Brennan\'s confidence to learn the full history of the Hollow Cairn',
        'Secret: Brennan\'s grandfather was the last person to visit the cairn — and he came back changed',
      ],
    },
    {
      id: 'fl-npc-2',
      name: 'Marta Ashforge',
      role: 'Blacksmith, Village Pragmatist',
      disposition: 'neutral',
      description:
        'Marta is 50, broad-shouldered, and allergic to superstition. She is the blacksmith, the village\'s unofficial engineer, and Brennan\'s philosophical opposite. Where Brennan sees the Weave, Marta sees physics. Where Brennan fears the cairn, Marta is curious about it. She treats the stranger\'s wound practically and is frustrated when it won\'t close. She will help the player if the player is practical, direct, and useful. She will actively oppose the player if they lean into mysticism without evidence. She is not a villain — she is a counterweight.',
      hooks: [
        'Crafting: Marta can forge and repair equipment if the player brings materials',
        'Philosophical arc: the player can side with Marta\'s pragmatism or Brennan\'s faith — both have consequences',
        'Hidden depth: Marta\'s skepticism masks a personal loss — her husband died on a hunting trip in the deep hills 15 years ago',
      ],
    },
    {
      id: 'fl-npc-3',
      name: 'The Stranger (Corvin)',
      role: 'Wounded Messenger, Unknown Origin',
      disposition: 'ambiguous',
      description:
        'Corvin arrived at dawn, bleeding from a wound that will not close, carrying a map with a missing piece. He is polite, guarded, and clearly in over his head. He claims to be a courier for a noble house in Thornhaven, sent to find something in the Greentooth Hills. He does not know what. He does not know who cut him. He knows only that the wound will close when he finds what he was sent to find. Corvin is not lying — but he is not telling the whole truth either. He is frightened, out of his depth, and depending on the player\'s choices, may become a loyal ally, a tragic casualty, or a dangerous liability.',
      hooks: [
        'Immediate quest: treat Corvin\'s wound and help him understand his mission',
        'Trust arc: Corvin slowly reveals who sent him and why — the answer connects to Aelmark\'s succession crisis',
        'Moral branch: the player can use Corvin to serve the kingdom, protect the village, or pursue their own agenda',
      ],
    },
    {
      id: 'fl-npc-4',
      name: 'Fen the Baker',
      role: 'Baker, Village Heart',
      disposition: 'friendly',
      description:
        'Fen is 35, cheerful, and the village\'s emotional center. She runs the bakery with her teenage daughter, Sable. Fen knows everyone\'s business, feeds everyone without asking, and has an uncanny sense for when someone is troubled. She is the first villager to bring food to Corvin, the first to notice when the player is struggling, and the last to give up on anyone. She is not a fighter, not a scholar, and not a mystic — she is a baker. But in a world without stats, kindness is a power, and Fen is the most powerful person in Mossford.',
      hooks: [
        'Relationship: Fen provides food, comfort, and gossip — the social currency of the village',
        'Stakes: if the village is threatened, Fen and Sable are the people the player most wants to protect',
        'Secret: Fen\'s late husband was a traveler from outside the valley — she knows more about the outside world than she lets on',
      ],
    },
    {
      id: 'fl-npc-5',
      name: 'Sable',
      role: 'Fen\'s Daughter, Aspiring Adventurer',
      disposition: 'friendly',
      description:
        'Sable is 15, restless, and desperate to leave Mossford. She has read every book in the village (there are seven), practiced with a wooden sword every day for two years, and dreams of being a hero from the old stories. Corvin\'s arrival is the most exciting thing that has ever happened to her. She will try to join the player on their adventures. Fen will try to stop her. The player will have to decide: take Sable along (she is enthusiastic but untrained), discourage her (she will resent it), or find a middle path (train her, but keep her safe). How the player handles Sable will shape Fen\'s attitude — and the village\'s — more than almost anything else.',
      hooks: [
        'Companion arc: Sable can become a party member if the player trains her',
        'Parental tension: Fen\'s fear vs. Sable\'s ambition — the player is caught in the middle',
        'Coming-of-age: Sable\'s arc is about learning what heroism actually costs',
      ],
    },
    {
      id: 'fl-npc-6',
      name: 'Reeve Aldric',
      role: 'Royal Tax Collector, Reluctant Authority',
      disposition: 'neutral',
      description:
        'Aldric is the first royal official to visit Mossford in 40 years. He arrives a week after Corvin, ostensibly to collect overdue taxes. In truth, he is following Corvin — the noble house that sent the courier also sent Aldric to ensure the mission succeeds. Aldric is not cruel, but he is dutiful. He represents the kingdom\'s interest, which may or may not align with the village\'s. He is reasonable, can be negotiated with, and will respond to the player\'s choices based on whether they help or hinder his mission. He is not a combat threat — he is a political one.',
      hooks: [
        'Political arc: the player can cooperate with Aldric, deceive him, or turn the village against him',
        'Tension: Aldric\'s presence forces Mossford to reckon with the outside world it has ignored for generations',
        'Branching: helping Aldric opens the kingdom faction; opposing him opens the village independence path',
      ],
    },
  ],

  starterQuests: [
    {
      id: 'fl-quest-1',
      title: 'The Stranger at the Gate',
      description:
        'A wounded stranger rides into Mossford at dawn. He collapses at the inn. Fen sends for you. Old Brennan says the wound is not natural. Marta says it needs stitching regardless. The stranger says he has a map. The village has not had a visitor in years, and this one is bleeding from a cut that will not close. What do you do?',
      recommendedLevel: 1,
      objectives: [
        'Go to The Crooked Beam inn and speak with the stranger (Corvin)',
        'Consult Old Brennan about the nature of the wound',
        'Consult Marta about treating the wound practically',
        'Examine the stranger\'s map (a piece is missing — torn off)',
        'Choose: help Corvin find what he\'s looking for, or turn him away',
      ],
      rewards: 'Corvin\'s trust, village reputation shift (Weave thread), [Crooked Beam lodging], [Brennan\'s Walking Stick]',
    },
    {
      id: 'fl-quest-2',
      title: 'The Harvest Festival Preparations',
      description:
        'Three weeks until the Harvest Festival. Fen needs help baking. Marta needs help forging the ceremonial sickle. Old Brennan needs someone to gather herbs from the lower hills for the Solstice Fire. The village is busy, and the stranger\'s arrival has everyone on edge. Help with the preparations, earn the village\'s trust, and learn who these people really are.',
      recommendedLevel: 1,
      objectives: [
        'Help Fen at the bakery (social connection, learn village gossip)',
        'Help Marta forge the ceremonial sickle (crafting tutorial, earn her respect)',
        'Gather herbs from the lower Greentooth Hills (exploration, encounter wildlife)',
        'Mediate a dispute between two villagers (Weave tutorial — consequences matter)',
        'Decide whether to tell the village about Corvin\'s mission or keep it secret',
      ],
      rewards: 'Village trust (Weave thread), [Ceremonial Sickle] (tool), [Fen\'s Bread] (consumable), [Marta\'s Forged Knife] (weapon)',
    },
    {
      id: 'fl-quest-3',
      title: 'The Missing Map Piece',
      description:
        'Corvin\'s map is missing a piece — torn off deliberately. He says it was taken by whoever cut him. The cut happened in the lower hills, two days before he reached Mossford. Retrace his path, find where he was attacked, and recover the missing piece. The hills are not dangerous in the lower reaches. The upper reaches are a different story.',
      recommendedLevel: 3,
      objectives: [
        'Retrace Corvin\'s path through the lower Greentooth Hills',
        'Find the site of the ambush (signs of a struggle, drag marks)',
        'Follow the trail to a hermit\'s cabin in the hills',
        'Confront the hermit (fight, negotiate, or flee — each has consequences)',
        'Recover the missing map piece and discover what it reveals about the Hollow Cairn',
      ],
      rewards: 'Missing map piece, [Hollow Cairn location revealed], hermit\'s information (or hostility), [Hill Trail Rations]',
    },
    {
      id: 'fl-quest-4',
      title: 'The Hollow Cairn',
      description:
        'The map is complete. The Hollow Cairn lies in the deep Greentooth Hills, two days\' travel from Mossford. Old Brennan begs you not to open it. Marta wants to see what\'s inside. Corvin needs to find what he was sent to find — or his wound will never close. Aldric is watching. Sable wants to come. The village is divided. The cairn is waiting. What do you do?',
      recommendedLevel: 5,
      objectives: [
        'Decide who to bring: Corvin, Sable, Marta, or go alone (each changes the outcome)',
        'Travel to the deep Greentooth Hills (2 days, survival challenges)',
        'Find the Hollow Cairn entrance (sealed with ancient binding magic)',
        'Choose: open the cairn, seal it permanently, or find a third path',
        'Face the consequences — whatever is inside will change Mossford forever',
      ],
      rewards: 'Story branch unlocked based on choice, [Cairn Artifact] (if opened), [Old Faith\'s Blessing] (if sealed), world-state permanently altered',
    },
  ],

  starterItems: [
    {
      id: 'fl-item-1',
      name: 'Brennan\'s Walking Stick',
      rarity: 'Common',
      itemType: 'weapon',
      itemLevel: 1,
      description: 'A gnarled oak staff that Old Brennan lent you. It is older than Brennan and has been used for walking, prodding, and — according to Brennan — "discouraging wolves." Functions as a quarterstaff. Brennan says it carries a fragment of the Weave. Marta says it is a stick. They are both right.',
    },
    {
      id: 'fl-item-2',
      name: 'Fen\'s Bread',
      rarity: 'Common',
      itemType: 'consumable',
      itemLevel: 1,
      description: 'A warm loaf of Fen\'s honey bread, wrapped in cloth. Restores energy and morale. In a world without numerical stats, "restores morale" means the GM will describe your character feeling steadier, clearer, and more resolute after eating it. Fen gives bread to anyone who needs it. She never asks for payment. She remembers who takes it.',
    },
    {
      id: 'fl-item-3',
      name: 'Marta\'s Forged Knife',
      rarity: 'Common',
      itemType: 'weapon',
      itemLevel: 1,
      description: 'A utility knife Marta forged as a thank-you for helping at the smithy. Sharp, balanced, and practical. Deals 1d4 slashing damage. Can also be used for skinning game, cutting rope, and whittling. Marta does not make decorative knives. This one is for work.',
    },
    {
      id: 'fl-item-4',
      name: 'Herb Pouch',
      rarity: 'Common',
      itemType: 'material',
      itemLevel: 1,
      description: 'A leather pouch containing herbs gathered from the lower Greentooth Hills: woundwort for poultices, feverfew for tea, and a sprig of everlight that glows faintly in darkness. Old Brennan says everlight grows only where the Weave is strong. Marta says it grows where the soil has phosphorus. Both observations are accurate.',
    },
    {
      id: 'fl-item-5',
      name: 'Ceremonial Sickle',
      rarity: 'Uncommon',
      itemType: 'weapon',
      itemLevel: 2,
      description: 'The sickle forged for the Harvest Festival\'s Reaping Game. Silver-hued, curved, and etched with Old Faith symbols. Functions as a weapon (1d6 slashing) but is primarily ceremonial. Carrying it signals to the village that you are part of the festival tradition. Old Brennan will notice. It matters more than you think.',
    },
    {
      id: 'fl-item-6',
      name: 'Corvin\'s Map (Incomplete)',
      rarity: 'Rare',
      itemType: 'accessory',
      itemLevel: 1,
      description: 'A hand-drawn map on leather, showing the Greentooth Hills with a route marked to a location labeled "H.C." — the Hollow Cairn. A corner is torn away. The map is detailed and clearly drawn by someone with training. The handwriting does not match Corvin\'s. Someone else drew this map and gave it to the person who sent Corvin. The map is a clue, not just a tool.',
    },
  ],
};
