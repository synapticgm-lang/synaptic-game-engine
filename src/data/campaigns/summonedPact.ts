import type { CampaignBible } from './types';
import { SUMMONED_PACT_PHASE4_HOOKS } from './summonedPactPhase4Hooks';

/**
 * Original SynapticGM isekai bible.
 * Genre tropes only — not any novel, anime, or game IP.
 * Hero vs villain is a stamp + player choice, not a forced allegiance.
 */
export const summonedPact: CampaignBible = {
  id: 'summoned-pact',
  title: 'The Summoned Pact',
  archetype: 'isekai',
  engineMode: 'litrpg',
  difficulty: 'Standard',
  genreTag: 'Isekai',
  tagline: 'They meant to summon a hero. The System also stamped a calamity.',
  shortDescription:
    'Hero/villain summoning LitRPG: Earth clothes, a glitched blessing, and a kingdom that needs you obedient. Obey, refuse, or play both sides — original world.',
  licenseNote:
    'Original SynapticGM setting. Uses common isekai/LitRPG tropes (Earth origin, summoning circle, System screens, classes, inn/guild/dungeon as generic hubs, healer-who-fights as a possible class, hero/villain stamp). Not based on The Wandering Inn, Azarinth Healer, Sword Art Online, Fable, Albion, or any named series, novel, or anime.',
  startingLocation: 'The Sevenfold Circle under Valespire Cathedral',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'sp-pockets', name: 'Pockets and bag from Earth', capacity: 16 },

  openingMode: 'weave',
  openingRegistrar: {
    voice: 'inworld',
    label: 'THE CIRCLE',
    startLine: 'Light, then stone. They want a name. Your Earth place can wait until you bring it up.',
  },
  openingHook:
    'You arrive mid-rite. A faction wanted a summoned soul. A blue panel hangs at eye level — private, yours. Your Earth clothes are still on you. Someone in the room already has an offer, and you can refuse it.',
  /** Code picks one per New Game (seed). Pointers, not a script — writer builds the page. */
  openingHooks: [
    {
      location: 'The Sevenfold Circle under Valespire Cathedral',
      faction: 'High Chanter Orel Vane and Crown handlers of Pellane',
      summonIntent: 'They paid for a Pactborn champion to end the Ash Court war. The seventh ring stuttered; the Mark looks wrong.',
      openingOffer:
        'Swear the Pact and they will issue travel kit (a field blade, cloak, papers, a little coin). Refuse and you keep only what you arrived in.',
      page1:
        'Light, then cold stone. You are on your back inside a seven-ring summoning circle under a cathedral vault. Robed figures freeze mid-chant. A blue panel hangs at eye level — private, yours. One of them whispers “Pactborn.” Another, quieter: “The Mark is wrong.” Your Earth clothes are still on you. Nobody has put a weapon in your hands. The offer is still in their mouths.',
      beats: [
        'You are on your back inside a seven-ring circle under a cathedral vault. Robed figures freeze mid-chant.',
        'A blue panel hangs at eye level — private, yours. One whisper: Pactborn. Another: the Mark is wrong.',
        'Nobody has put a weapon in your hands yet. The offer is still in their mouths.',
      ],
      fallback:
        'Light, then cold stone. You are on your back inside a seven-ring summoning circle under a cathedral vault. Robed figures freeze mid-chant. A blue panel hangs at eye level — private, yours. One of them whispers “Pactborn.” Another, quieter: “The Mark is wrong.” Your Earth clothes are still on you.',
    },
    {
      location: 'Pellane war camp beyond Valespire walls',
      faction: 'Captain Sera Quill and camp handlers',
      summonIntent: 'They needed a body on the line yesterday. The rite was scraped into dirt, not cathedral brass.',
      openingOffer:
        'Enlist and they will kit you from the quartermaster (a service blade, a coat, a ration chit). Walk away and you keep Earth kit only.',
      page1:
        'The smell of churned mud and banner-smoke hits before your eyes open. You are on your back in a circle scraped into dirt outside Valespire’s walls, not cathedral brass. Horns carry toward the tree line. A blue panel hangs in the drizzle — private, yours. Armored handlers shout over the noise; a captain in dented brigandine is already deciding if you are a body for the line. The Mark on you is an argument. Nobody has handed you a blade.',
      beats: [
        'Mud, banner-smoke, a war-camp circle. Horns. Armored handlers shouting.',
        'A blue panel hangs at eye level. Someone wanted a hero. The Mark on you is already an argument.',
        'A sergeant is already reaching toward a weapons crate — waiting on a yes.',
      ],
      fallback:
        'Light, then mud and banner-smoke. You are on your back in a war-camp circle scraped into dirt outside Valespire’s walls. Armored handlers shout over horn-calls. A blue panel hangs at eye level. Someone wanted a hero yesterday. The Mark on you is already an argument.',
    },
    {
      location: 'a barred undercroft cell beneath Valespire Cathedral',
      faction: 'A handler on the far side of the grate, treating you as bait',
      summonIntent: 'The rite succeeded in a cell, not a welcome hall. They summoned a lure, or they are hiding a failed Mark.',
      openingOffer:
        'Cooperate — name, oath, a walk above — and they will unbar the door and issue a traveler’s kit. Stay silent and you keep what is in your pockets.',
      page1:
        'Light, then iron bars. You are on a stone bench in a cell under the cathedral, not a welcome hall. A blue panel hangs in the dark. A handler on the other side of the grate calls you bait. Your Earth clothes are still on you. Keys jingle. The offer is release with strings, not a gift on the floor.',
      beats: [
        'Stone bench, iron bars, a panel hanging in the dark.',
        'Someone calls you bait. Your Earth clothes are still on you.',
        'Keys jingle. The offer is release with strings, not a gift sword on the floor.',
      ],
      fallback:
        'Light, then iron bars. You are on a stone bench in a cell under the cathedral, not a welcome hall. A blue panel hangs in the dark. A handler on the other side of the grate calls you bait. Your Earth clothes are still on you.',
    },
    {
      location: 'the blood-sand arena of Valespire',
      faction: 'Arena masters and robes at the rail, with a crowd already betting',
      summonIntent: 'Entertainment first, hero second. They summoned a body the city can watch die or win.',
      openingOffer:
        'Take the sand and they will throw you a weapon from the rack. Refuse the show and you leave with Earth kit — if they let you leave.',
      page1:
        'Sun and noise. You are on your back in coarse sand inside Valespire’s fighting pit. Galleries lean over the rails with wager ribbons. A blue panel hangs in the heat — private, yours. Robes at the shaded rail consult a ledger. Nobody asked if you wanted to be entertainment. A rack of blades sits at the rail — offered if you take the sand, not in your hand.',
      beats: [
        'Sand, noise, a circle while the crowd already bets.',
        'A blue panel hangs private. Nobody asked if you wanted to be entertainment.',
        'A blade is visible on a rack at the rail — offered, not in your hand.',
      ],
      fallback:
        'Light, then sand and noise. You are on your back in an arena circle while a crowd already bets. Robes at the rail. A blue panel hangs private. Nobody asked if you wanted to be entertainment.',
    },
    {
      location: 'a Lowmarket cellar shrine under Valespire',
      faction: 'A denied-god cult the Crown will not admit exists',
      summonIntent: 'Wrong gods, wrong chant. They wanted a miracle. They got you. Someone upstairs will still call this Pellane’s summon.',
      openingOffer:
        'Join their small pact and they will press a relic-knife and a stained cloak into your hands. Walk out and you keep Earth kit — and their fear.',
      page1:
        'Tallow and damp earth. You are on cold flagstones in a cramped cellar shrine under Lowmarket, between casks and meal-sacks. The circle under your spine is wine and river-chalk, not Crown brass. A blue panel hangs close — private, yours. Hooded figures kneel around you; their hands are weavers’ and butchers’, not Scale priests. Someone upstairs will still call this Pellane’s summon. A wrapped relic sits on the altar — an offer, not loot.',
      beats: [
        'Candle-smoke cellar. You are on your back in a cult circle.',
        'A blue panel hangs. The people here are not the High Chanter.',
        'A relic is wrapped in cloth on the altar — an offer, not starting loot.',
      ],
      fallback:
        'Light, then candle-smoke in a cellar. Wrong gods, wrong chant. You are on your back in a cult circle the Crown will deny. A blue panel hangs. Someone upstairs will still call this Pellane’s summon anyway.',
    },
    {
      location: 'The Sevenfold Circle under bombardment',
      faction: 'Scattered Scale priests and a panicked handler, ceiling already cracking',
      summonIntent: 'They finished the rite while the city was hit. There is no orderly welcome.',
      openingOffer:
        'Grab a fallen soldier’s kit if you help them hold the vault. Freeze or flee and you have only Earth clothes — the crate of issued blades is buried in dust.',
      page1:
        'A blast shudders the flagstones and dumps mortar across your face. You are on your back in the Sevenfold Circle; the outer brass rings are cracked and the vault is open to a smog sky. A blue panel hangs in the haze, untouched by the dust. Two Scale priests scramble back across rubble. A younger handler drops to one knee with a cracked tile, shouting that the seventh ring failed and the Mark is wrong. Nobody has put a weapon in your hands.',
      beats: [
        'Vault under fire. Dust and ash falling through the chant.',
        'A blue panel hangs. The Mark is wrong and the ceiling is already cracking.',
        'Gear exists in the room as salvage or a shouted offer, not a gift placed in your hands.',
      ],
      fallback:
        'Light, then a vault under fire. You are on your back in the seven-ring circle while dust and ash fall through the chant. A blue panel hangs. The Mark is wrong and the ceiling is already cracking.',
    },
    {
      location: 'Valespire peace-festival square',
      faction: 'Festival crowd plus panicked handlers who caught the wrong person',
      summonIntent: 'The pull took you from Earth into a festival square. You were not the name on the rite.',
      openingOffer:
        'Play along as their summoned guest and they will smuggle you a cloak and a pass. Name yourself extra and they may try to hide you — or parade you — with nothing added to your pockets.',
      page1:
        'Light, then a wall of festival noise. You hit sunlit cobbles in a crowded Valespire square; the street you were walking is gone and the roar is already around you. A blue panel hangs above you, private, yours. Handlers in ceremonial robes freeze and drop their censers. They wanted a named savior. They caught you instead. One of them goes pale at your Earth clothes and whispers “Wrong catch.” The crowd still thinks this is a show. Nobody has offered kit. A handler steps in with a shaking ledger.',
      beats: [
        'Festival noise. Public stones. Handlers freeze.',
        'A blue panel hangs. One whisper: wrong catch.',
        'No ceremony kit unless you agree to wear their story.',
      ],
      fallback:
        'Light, then festival noise. You hit public stones; the street you were walking is gone. Handlers freeze. A blue panel hangs. One whisper: “Wrong catch.”',
    },
    {
      location: 'a wayside shrine on the Valespire road',
      faction: 'One frightened priest, no capital audience',
      summonIntent: 'One mistake on a rural circle. They did not mean to pull an Earth soul this far from the city.',
      openingOffer:
        'Walk with them to Valespire under a traveler’s staff and cloak they keep for pilgrims. Stay and they will beg you to leave with only what you arrived in.',
      page1:
        'Beeswax and cold stone. You are on your back in a roadside shrine circle, grit under your palms. One frightened priest kneels at the rings, no capital audience, no chant left. A blue panel hangs at eye level. The Valespire road is still miles of dust. A pilgrim staff leans by the door — offered if you take their road, not in your hand.',
      beats: [
        'Quiet rural stone. One priest, one circle, miles of dust to the capital.',
        'A blue panel hangs. The road to Valespire is still long.',
        'A pilgrim staff leans by the door — offered if you take their road.',
      ],
      fallback:
        'Light, then quiet rural stone. One priest, one mistake, no capital audience. You are on your back in a roadside shrine circle. A blue panel hangs. The road to Valespire is still miles of dust.',
    },
    {
      location: 'an Ash-adjacent ritual hall',
      faction: 'Ash Court priests who will swear the Crown summoned you',
      summonIntent: 'Ash Court priests want a Calamity Mark as proof the Scale rejected Pellane.',
      openingOffer:
        'Wear the Mark openly and they offer ember-ward kit and citizenship papers. Refuse and you keep Earth clothes — they may still try to keep you.',
      page1:
        'The air smells of burnt iron. You wake on your back in a jagged circle of iron dust, red light in the cracks, nowhere near Pellane’s brass. A blue panel hangs in the gloom — private, yours. Ash Court priests in soot-stained robes stand over you; one iron mask tilts down. A wrapped ember-blade sits on a stone side table — a deal, not yours yet. The lead priest’s voice comes rough through the mask: show the Mark, or give a name they can write on a tally.',
      beats: [
        'You are on your back in a circle that is not Pellane’s.',
        'A blue panel hangs. They will say the Crown summoned you.',
        'A wrapped ember-blade sits on a side table — a deal, not yours yet.',
      ],
      fallback:
        'Burnt iron and a jagged circle. Ash Court priests stand over you. A blue panel hangs. A wrapped ember-blade is a deal, not yours yet.',
    },
    {
      location: 'The Sevenfold Circle — four rings occupied',
      faction: 'Crown ritual staff arguing over a mass summon',
      summonIntent: 'Four bodies. Politics in the first breath: who is Pactborn, who is Marked, who was extra.',
      openingOffer:
        'The first to swear gets issued kit. The others wait. You can swear, refuse, or watch someone else take the blade.',
      page1:
        'You wake on cold flagstones with three other living people coughing in the same blue glare. You are inside Valespire’s cathedral vault, in one ring of a four-part brass array. Your panel hangs private — yours, not theirs. Crown staff at the perimeter are already arguing who is Pactborn, who is Marked, and who was extra. A kit crate is open at the edge. Hands have not reached you.',
      beats: [
        'Three other living people on neighboring rings. Not a solo hero shot.',
        'A blue panel hangs private — yours, not theirs.',
        'A kit crate is open at the edge. Hands have not reached you unless you agree.',
      ],
      fallback:
        'Light, then three other people on neighboring rings. A mass summon. The room is already arguing who is Pactborn, who is Marked, and who was extra. A blue panel hangs at eye level — private, yours. Your Earth clothes are still on you.',
    },
    {
      location: 'a treaty tent on the Cinderflow road',
      faction: 'Pellane and Ash Court envoys using you as a living token',
      summonIntent: 'They summoned a soul to sign a pause in the war. Both sides want you named as theirs.',
      openingOffer:
        'Pick a banner and that side issues kit and a seat at the table. Pick neither and you keep Earth kit while both sides freeze.',
      page1:
        'Canvas walls billow. You are on your back on a timber platform in a treaty tent beside the Cinderflow road. A blue panel hangs at chin height over maps and two seals on one table. Pellane plate on one side, Ash cloaks and iron censers on the other. Both already want your name on a banner. Two kits sit on opposite chests — offered, not equipped.',
      beats: [
        'Canvas, maps, two seals on one table. You arrived between them.',
        'A blue panel hangs. Nobody smiles.',
        'Two kits sit on opposite chests — offered, not equipped.',
      ],
      fallback:
        'Light, then canvas and lamp-smoke. You are on your back in a treaty tent on the Cinderflow road. Two sets of seals wait on one table. A blue panel hangs at eye level. Both sides already want your name on a banner.',
    },
    {
      location: 'a harbor circle in the hold of a Valespire grain-ship',
      faction: 'Smugglers who stole a Scale rite and panicked when it worked',
      summonIntent: 'They wanted luck for a cargo run. They pulled an Earth soul. The Crown does not know yet.',
      openingOffer:
        'Keep their secret and they will kit you as crew (knife, oilskin, a bunk). Shout for the Crown and you keep Earth kit — and they may dump you at the quay.',
      page1:
        'Timber, tar, and bilge. You are on your back in a chalk circle in the hold of a Valespire grain-ship; the deck is already moving. A blue panel hangs over stacked sacks. Three sailors stare as if they stole a rite and it worked. The Crown does not know yet. A knife is offered hilt-first if you nod — not in your hand until you do.',
      beats: [
        'Timber, tar, a chalk circle in a ship’s hold. The boat is moving.',
        'A blue panel hangs. Someone swears. Someone laughs once and stops.',
        'A sailor’s knife is offered hilt-first if you nod.',
      ],
      fallback:
        'Light, then timber and tar. You are on your back in a chalk circle in the hold of a grain-ship leaving Valespire. A blue panel hangs at eye level. The people here were not supposed to make this work.',
    },
    {
      location: 'a ruined empty circle outside the west wall',
      faction: 'No priests — scavengers and a militia patrol arriving late',
      summonIntent: 'The rite already failed for someone else. You are leftover. The circle is cracked and cold.',
      openingOffer:
        'The patrol will issue a militia armband and a short blade if you come quietly. The scavengers will trade junk for whatever is in your pockets. You can take neither.',
      page1:
        'Cold wind over cracked brass rings outside Valespire’s west wall. The sky is open and grey. A blue panel hangs over the stone — private, yours. There are no priests and no rite still running; you are leftover from a circle that already failed. Distant wall-horns. A ragged scavenger stops on the gravel and stares. Two militia step out of the brush behind him. One levels a spear and barks for a name before they decide you are salvage. What name do you give them?',
      beats: [
        'Open sky, broken brass rings, no cathedral vault.',
        'A blue panel hangs above cracked stone. Wind. Distant wall-horns.',
        'Gear on offer is whoever gets to you first — not a Crown ceremony.',
      ],
      fallback:
        'Light, then open sky. You are on cracked brass rings outside Valespire’s west wall. The circle is empty of priests. A blue panel hangs at eye level. Footsteps are already coming — scavengers, or the watch.',
    },
    {
      location: 'the cathedral infirmary',
      faction: 'Field chirurgeons who expected a healer-hero, not a stranger in Earth clothes',
      summonIntent: 'The court paid for a Pactborn who could close wounds. The Mark on you does not match the order.',
      openingOffer:
        'Agree to work their cots and they will issue a chirurgeon’s kit (wraps, a knife, a tabard). Refuse the job and you keep Earth kit while they argue over the ledger.',
      page1:
        'Light, then linen and boiled iron. You are on your back on a circle chalked between infirmary cots. A blue panel hangs at eye level. The chirurgeons expected a healer. You still have Earth clothes. Someone is screaming two beds over. A kit tray is ready if you say yes to the work.',
      beats: [
        'Linen, boiled iron, someone screaming two beds over. You arrived on a circle chalked between cots.',
        'A blue panel hangs. A chirurgeon is already angry at the paperwork.',
        'A kit tray is ready if you say yes to the work.',
      ],
      fallback:
        'Light, then linen and boiled iron. You are on your back on a circle chalked between infirmary cots. A blue panel hangs at eye level. The chirurgeons expected a healer. You still have Earth clothes.',
    },
    {
      location: 'alone in an abandoned barn in Pellane country',
      faction: 'Nobody here — the summoners are gone, delayed, or never came',
      summonIntent:
        'A rite dumped you alone in an abandoned barn that still stands: drafts, sticky door, stained plaster stalls.',
      openingOffer:
        'No one offers kit. You may scavenge what is left inside, or walk out with only Earth clothes toward the next smoke or road.',
      page1:
        'Rotting hay and old dust fill your lungs before you can sit up. You are on your back in an abandoned barn in Pellane country, between empty stained-plaster stalls. Wind cuts through a gap in the timber shutters and finds the thin Earth clothes you still have on. A blue panel hangs at eye level, the only clean light in the dark. Nobody came. The dirt path outside is empty. The panel waits on a name. What do you enter?',
      beats: [
        'You are alone. No chant. No handlers. Cold floor or boards under you.',
        'A blue panel hangs at eye level — private, yours. Wind through a gap.',
      ],
      writerNotes: [
        'Ruin level: standing, but with a few issues (loose shutter, damp corner, roof that complains).',
        'Do not invent a welcoming NPC on turn one. Footsteps or a distant bell can be later.',
        'Writer picks what it was (cottage, barn, mill, shop, watch-post, chapel annex) — not a named series inn.',
      ],
      fallback:
        'Light, then quiet. You are alone on the floor of an abandoned barn — four walls, most of a roof, stained plaster stalls. A blue panel hangs at eye level — private, yours. Nobody is here.',
    },
    {
      location: 'alone in a ruined bathhouse off the Valespire roads',
      faction: 'Nobody here — the circle worked and the people did not stay',
      summonIntent:
        'Solo arrival in a ruined bathhouse. Usable only if careful: cracked dome, rain through the hole, door off its hinges.',
      openingOffer:
        'No issued kit. Salvage one useful thing from the mess if you search, or leave with Earth kit only.',
      page1:
        'Cold rain hits your face through a jagged crack in a ceramic dome. You are lying on wet tiles in a ruined bathhouse off the Valespire roads. Water pools around a fading chalk circle and soaks through your Earth clothes. A blue panel hangs in the draft, dry while you shiver. The cedar door bangs its hinges against the stone. Nobody stayed. If anything useful is left in the alcoves, you will have to take it. The panel waits on a name. What name do you give it?',
      beats: [
        'You are alone. Dust motes. A blue panel hangs.',
        'The Mark / Pactborn argument is only on your panel for now — no audience.',
      ],
      writerNotes: [
        'Ruin level: still a building, but badly hurt — one room open to weather, floor soft in places.',
        'No sword on a pedestal. Anything useful is salvage you choose to take.',
        'Writer picks the building type at random (warehouse, farmhouse, toll-house, bathhouse shell).',
      ],
      fallback:
        'Rain through a cracked dome. You are alone on ceramic tiles in a ruined bathhouse. A blue panel hangs in the draft. Nobody came to greet you.',
    },
    {
      location: 'alone in a half-collapsed watchtower on the edge of wild country',
      faction: 'Nobody here — empty ruin, empty sky',
      summonIntent:
        'The rite left you with no witnesses in a watchtower stump. Half the roof is gone; the upper floor opens to sky.',
      openingOffer:
        'No bargain. Dig in the rubble for scrap, or walk toward distant smoke with only what you arrived in.',
      page1:
        'A bitter wind over wild-country ash snaps you awake. You are lying on cracked blocks in the stump of a watchtower; half the circular roof is gone and the upper floor opens to grey sky. Cold finds the seams of your Earth clothes through the arrow-slits. A blue panel hangs in the freeze, untouched by weather. The stair door is empty. No priests. No handlers. The circle under you is already fading. The panel waits on a name. What do you enter?',
      beats: [
        'You are alone under open sky and broken beams.',
        'A blue panel hangs above uneven stone or ash.',
      ],
      writerNotes: [
        'Ruin level: half-collapsed — dangerous floors, bird nests, no furniture worth naming unless you search.',
        'Do not spawn a quest-giver in the doorway on the first page.',
        'Writer picks what the place once was (granary, tower stump, longhouse, storehouse).',
      ],
      fallback:
        'Wind over wild-country ash. You are alone in the stump of a watchtower; half the roof is gone. A blue panel hangs in the cold. Your Earth clothes are still on you.',
    },
    {
      location: 'alone in a gutted market hall with no roof',
      faction: 'Nobody here — only standing walls and empty window holes',
      summonIntent:
        'A failed or abandoned circle left you in a gutted market hall: four stone walls, no roof, weeds in the corners.',
      openingOffer:
        'Nothing is offered. Search the corners for forgotten scrap, or leave the shell with Earth kit only.',
      page1:
        'You wake on your back under open sky framed by the arches of a gutted market hall. The roof is gone; four stone walls stand in tall grass, and briar has grown through the cracked paving into your Earth clothes. A blue panel hangs in the daylight, clean against the weeds. You are alone. Empty window holes look onto rolling country. Whoever drew this circle is long gone. The panel waits on a name. What name does it take?',
      beats: [
        'You are alone. Open sky. Four walls or fewer.',
        'A blue panel hangs in daylight. Birds. Distant road noise or none.',
      ],
      writerNotes: [
        'Ruin level: shell only — no roof, no door, grass already claiming the floor.',
        'Starting kit is Earth clothes. Salvage is a choice, not a gift.',
        'Writer picks the footprint (chapel shell, manor wing, market hall, barracks).',
      ],
      fallback:
        'Open sky inside a gutted market hall. The roof is gone; four stone walls stand in grass. A blue panel hangs in daylight. You are alone.',
    },
    {
      location: 'alone on the stone outline of a building that is gone',
      faction: 'Nobody here — only a footprint in the grass',
      summonIntent:
        'The worst end of ruin: foundation stones and a rectangle in the turf where a building once stood. No walls. Writer does not invent a standing inn or shop — only the outline, and whatever scrub grew since.',
      openingOffer:
        'No kit, no hosts. Follow a track, a river, or smoke on the horizon with only what you arrived in — or dig at the outline for nothing but dirt.',
      page1:
        'Morning damp soaks through your clothes before you sit up. You are alone on cold foundation stones — a rectangle in the turf where a building once stood. No walls, no roof, no door. Grass and open country in every direction. A blue panel hangs in empty air over nothing but the outline. Nobody is here. The horizon is empty of people. The panel waits on a name. What do you enter?',
      beats: [
        'You are alone on cold ground. Grass through old foundation stones.',
        'A blue panel hangs over the outline of a building that is no longer there.',
      ],
      writerNotes: [
        'Ruin level: outline only — no walls, no roof, no door. The camera stays HERE.',
        'Do not invent townspeople for the first page. The world can answer when you move.',
        'Writer does not invent a standing inn or shop — only the outline, and whatever scrub grew since.',
      ],
      fallback:
        'Light, then grass and cold foundation stones. You are alone on the outline of a building that is gone — a rectangle in the turf, no walls left. A blue panel hangs at eye level. Your Earth clothes are still on you. The horizon is empty of people.',
    },
    {
      location: 'alone in a burnt roadside waystation',
      faction: 'Nobody here — ash, charcoal ribs, no living summons',
      summonIntent:
        'Fire took the roadside waystation before or during the rite. Blackened posts and a floor that still remembers rooms.',
      openingOffer:
        'No one is left to bargain. Rake ash for a nail or a buckle if you want, or walk away in Earth clothes.',
      page1:
        'Wet charcoal fills your lungs as you push up on scorched boards. You are alone in the burnt husk of a roadside waystation — blackened timber ribs, no roof, the old room-lines still readable under the ash on your Earth clothes. A blue panel hangs clean against the soot. Nobody is left. If there was a circle, the fire took it. The doorway opens onto an empty road. The panel waits on a name. What name do you lock?',
      beats: [
        'You are alone. Char smell. Soft ash under your hands.',
        'A blue panel hangs in the smoke-haze of an empty day.',
      ],
      writerNotes: [
        'Ruin level: burnt husk — shape of a building, no safe roof, charcoal ribs.',
        'Do not place a helper NPC in the doorway on turn one.',
        'Writer picks the burnt type (cottage, barn, workshop, waystation) without naming licensed inns.',
      ],
      fallback:
        'Wet charcoal. You are alone in the burnt husk of a roadside waystation — charcoal ribs, no roof, old room-lines in the floor. A blue panel hangs at eye level. Nobody is here.',
    },
    ...SUMMONED_PACT_PHASE4_HOOKS,
  ],
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Confirm designation.' },
    {
      id: 'wear',
      kind: 'appearance',
      question: 'Visual profile. What were you wearing when the circle took you?',
      suggestions: ['What I had on today', 'Travel clothes', 'Whatever I slept in'],
    },
    {
      id: 'pockets',
      kind: 'kit',
      question: 'Personal-effects scan. What was actually on you? Combat-grade inventions will be rejected.',
      suggestions: ['Phone, keys, wallet', 'A bag with everyday stuff', 'Almost nothing'],
    },
  ],

  premise: `You were an ordinary person on Earth. A ritual in another world — the Sevenfold Circle, under Valespire Cathedral — pulled you through. The kingdom of Pellane summoned a [Pactborn] to end a war with the Ash Court. The System also rolled a second stamp: [Calamity Mark]. One summoned soul can carry either, or flicker between them. The court will call you Hero. The Ash Court will call you theirs. You do not have to answer either.

LOCATION LANGUAGE (BINDING): Camera is HERE — the seeded summon place for this run (cathedral circle, war camp, cell, arena, shrine, festival square, Ash-adjacent ritual hall, treaty tent, harbor hold, ruined west-wall circle, infirmary, or a locked alone-arrival ruin: barn, bathhouse, watchtower stump, market hall, foundation outline, burnt waystation). Alone-arrival cards: no summoners on page one; the building noun is already locked by the card. Do not teleport them to the Sevenfold Circle if Location is already somewhere else. Never call this interior "a nearby building." "The court" is Pellane's Crown / the people in this room, not the enemy. The enemy polity is the Ash Court. Do not use "the court" as both current room and the enemy in the same beat.

ORIGINALITY (BINDING): Never name published novels, anime, or games in play. Never import unique skill names, distinctive places, or plots from any series. Inn, guild, and dungeon are generic hubs with SynapticGM names only.

GENRE PALETTE (ORIGINAL NAMES — use these):
- System screens and classes are in-world. A blue panel is private and earned after the scene; code owns numbers. Classes exist (handler, field chirurgeon, wall-warden, unmarked). A healer class may still fight — that is a job, not a copied protagonist.
- Hero-summon gone wrong / villain-summon: [Pactborn] vs [Calamity Mark]. Player choice. No forced allegiance.
- Earth origin: clothes and pockets. Permanent displacement. No logout button, no VR-helmet plot.
- Inn hub: The Weighing Cup, a cathedral-close common room (beds, rumor, stew).
- Guild hub: Valespire Contract Hall (posted jobs, rank boards, politics).
- Dungeon: Cathedral Undercroft — numbered floors; fog on unvisited rooms. Street map stays outdoors.

OPENING KIT (AUTHORITY): At the first breath, worn clothes and a sealed Earth bag are the kit — bag contents undeclared until the player searches, dumps, or someone inventories them. Never auto-invent an iron shortsword, traveler tunic, healing draught, or [Circle Blessing] onto the sheet at New Game. NPCs MAY OFFER gear (a blade, cloak, papers, coin) as a bargain for a pact, enlistment, or release — describe the offer; do not add it to inventory until the player accepts. Refuse and they keep only Earth kit. When registration / Appraisal (or a clear System grant in play) awards the unidentified [Circle Blessing] glitched passive, emit <item-gain> then — never pre-seed it.

PLAYER AGENCY (BINDING): No forced allegiance. Protest, jokes, and “why should I save you” are dialogue. The first scene is THIS arrival and the people in it — not a journal dump. Do not unlock or name Guide Book quests until they are spoken in play.

HERO / VILLAIN FORK (CODE + WRITER):
- [Pactborn]: the court wants a champion. Privileges, handlers, a leash.
- [Calamity Mark]: the ritual “failed” or succeeded too well. Fear, exile offers, Ash Court envoys.
- The player’s first answers (cooperate / refuse / ask who is in charge) tilt the stamp. It can still flip later if they act against it.
- There is always one other summoned person in this age — the opposite stamp. Do not introduce them until a side or special seed is earned.

STORY SPINE (skeleton — unique each run; do not recap as a lecture):
1. Arrival (this run's picked hook). Names. Blessing unidentified. Argument in front of you.
2. First free hour in Valespire (cathedral close, The Weighing Cup, Lowmarket, Contract Hall notice-board, or a locked guest wing) — ordinary people, not the war.
3. A handler (or whoever summoned you) may offer a pact: swear/enlist/join and they issue travel kit; refuse and you keep only Earth kit. Refusal has social cost, not instant prison unless they attack.
4. First real threat is local to THIS arrival (marked beast, sabotaged ward, frightened crowd, scavengers, a forced show) — not the Ash King.
5. Proof the war story is incomplete (a letter, a prisoner, a cracked circle).
6. Meet or hear of the other summoned (opposite stamp).
7. Choose a side, a third path, or a lie that buys time.

SIDE QUEST SEEDS (writer only — spawn when the player looks, talks, or wanders; never dump the list):
- Otherworld Junk: a fence in Lowmarket pays for Earth objects (dead phone, branded shirt). Draws thieves and a System flag.
- The Kitchen Saint: cathedral cooks feed conscripts; a missing sack of grain is a crime or a mercy.
- Marked Child: a kid’s panel shows a fragment of your Blessing. Protect, report, or hide them.
- Appraisal Errand: a licensed Appraiser will name your Blessing for a favor — or lie.
- Wall-Watch: militia wants you on the west wall “for morale.” You can walk the wall, fake it, or vanish.
- Quiet Funeral: someone died in the ritual that brought you. Their sibling wants answers, not a hero speech.
- The Weighing Cup: a room, a rumor, or a drunk sergeant who saw the seventh ring fail.
- Contract Slip: a posted Hall job is a lie, a test, or a trap for a Calamity Mark.
- Undercroft First Floor: a sanctioned delve the court wants as a “hero demo.” You can walk it, refuse, or cheat the map.

SPECIAL / HIDDEN QUEST SEEDS (writer only — earn in scene; never as opening journal):
- The Other Circle: locate the second summoning site (failed or successful).
- Queen’s Private Ledger: Pellane started the war, or sold villages to buy the ritual.
- Ash Court Letter: an envoy offers citizenship if you wear the Calamity Mark openly.
- Sevenfold Crack: the circle is damaged; another summoning will tear the city.
- Blessing True Name: Appraisal reveals the glitch — power with a cost that matches the stamp they refused.
- Pactbreaker: publicly refuse the oath in court. Reputation split; both courts send agents.

Do not name distant hubs, the Ash King, or the other summoned until the player asks or a seed is triggered. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'sp-lore-1',
      title: 'The Sevenfold Circle',
      category: 'mechanic',
      body: 'Seven brass rings inlaid in cathedral stone. Each ring is a vow: Name, Origin, Flesh, Gift, War, Court, Scale. The ritual that brought the player completed six rings. The seventh — Scale — stuttered. That stutter is why two stamps exist. Standing on the circle after arrival still tingles. Leaving it is allowed. Returning later may re-roll a glitched blessing, at a cost the System will not preview.',
      tags: ['circle', 'ritual', 'summoning', 'system'],
    },
    {
      id: 'sp-lore-2',
      title: 'Pactborn and Calamity Mark',
      category: 'mechanic',
      body: 'The System stamps summoned souls. [Pactborn] is the public hero class the court paid for: visible quest markers from the Crown, easier lodging, harder persuasion when you try to leave. [Calamity Mark] is the failure state in their doctrine: shops close, priests ward you, the Ash Court can find you. A soul may show one stamp on the panel and the other in rumor. Appraisal of the person (not just items) can reveal the true mix. Never force the player into either role in prose if they have not chosen it.',
      tags: ['hero', 'villain', 'stamp', 'agency'],
    },
    {
      id: 'sp-lore-3',
      title: 'Circle Blessing (Unidentified)',
      category: 'mechanic',
      body: 'When registration completes or Appraisal fires in play, the System may grant one glitched passive via <item-gain> — never pre-seeded on New Game. Until Appraised it is [???]. Possible truths (pick one per campaign, do not list them in play): a once-per-day rewind of a single failed check; speech that people hear as the language they trust; a weapon that only exists while they are angry; a mark that beasts will not strike first; a leak that lets Ash Court scouts hear their location. Naming it without Appraisal is a lie. Power fantasy without a cost is forbidden — the glitch always has a tell.',
      tags: ['blessing', 'appraisal', 'cheat', 'cost'],
    },
    {
      id: 'sp-lore-4',
      title: 'Pellane and Valespire',
      category: 'world',
      body: 'Pellane is a highland kingdom. Valespire is its capital: cathedral, palace, Lowmarket, west wall, The Weighing Cup, Contract Hall, Cathedral Undercroft. They are losing a grinding war against the Ash Court — not cartoon demons, a rival polity that uses ember-wards and bargains. The court told the public that a summoned Pactborn will end the war in a season. That is propaganda. The player should discover the real military situation by talking and walking, not by a lore dump.',
      tags: ['pellane', 'valespire', 'war', 'capital'],
    },
    {
      id: 'sp-lore-5',
      title: 'The Ash Court',
      category: 'faction',
      body: 'A coalition of ember-priests and march-lords east of the Cinderflow. They call Pellane oath-breakers. They will recruit a Calamity Mark as proof the Scale rejected Pellane. They are not mindless evil. Individual envoys can be honorable, cruel, or both. Do not spawn an Ash army in the cathedral on turn one.',
      tags: ['ash-court', 'faction', 'war'],
    },
    {
      id: 'sp-lore-6',
      title: 'The Scale',
      category: 'culture',
      body: 'Pellane’s state divinity is The Scale — balance, contracts, weighed souls. Priests insist summoning is holy. Street rumor says The Scale only watches. The System never confirms gods. Treat The Scale as culture unless a special seed makes it act.',
      tags: ['religion', 'scale', 'culture'],
    },
    {
      id: 'sp-lore-7',
      title: 'Appraisal Law',
      category: 'mechanic',
      body: 'Reading items, people, and places requires the Appraisal skill or a licensed Appraiser. Unlicensed Appraisal in Valespire is a fine. The player does not start with full lore — they start with eyes. Offer Appraisal as a choice or a hire, not as omniscience.',
      tags: ['appraisal', 'law', 'information'],
    },
    {
      id: 'sp-lore-8',
      title: 'The Other Summoned',
      category: 'history',
      body: 'Every successful Sevenfold ritual in recorded Pellane history pulled two souls and only advertised one. The other is hidden, exiled, or working for the Ash Court. This age’s other summoned is alive. Do not name them until the Other Circle or a rumor the player chases. They are a person with Earth clothes too — not a boss statue.',
      tags: ['double-summon', 'secret', 'mirror'],
    },
    {
      id: 'sp-lore-9',
      title: 'The Weighing Cup',
      category: 'world',
      body: 'A cathedral-close inn. Stew, beds, and rumor. Classes and stamps show in how people treat you at the bar — not as a lecture. Keep it a generic hub. Do not invent a named-series innkeeper personality. The player may sleep here, listen, or skip it.',
      tags: ['inn', 'hub', 'valespire'],
    },
    {
      id: 'sp-lore-10',
      title: 'Valespire Contract Hall',
      category: 'faction',
      body: 'The city’s job board and rank desk. Posted contracts, politics, and a clerk who cares more about stamps than people. Guild pressure is social, not a forced party. Do not dump a rank tree on turn one.',
      tags: ['guild', 'hub', 'contracts'],
    },
    {
      id: 'sp-lore-11',
      title: 'Cathedral Undercroft',
      category: 'world',
      body: 'Numbered dungeon floors under the cathedral. Visited rooms are known; the rest are outline and fog. First Blood rules: describe the room before any creature. The court may send a Pactborn here as a morale show. A field chirurgeon class still has to fight on these floors.',
      tags: ['dungeon', 'floors', 'undercroft'],
    },
  ],

  keyNPCs: [
    {
      id: 'sp-npc-1',
      name: 'High Chanter Orel Vane',
      role: 'Ritual lead',
      disposition: 'ambiguous',
      description: 'Exhausted, precise, already composing the speech that will sell you to the court. Wants the seventh ring closed. Will lie about the stutter if you do not catch it.',
      hooks: ['Explain the Pact', 'Ask you to stay on the circle', 'Offer a private apology if pressed'],
    },
    {
      id: 'sp-npc-2',
      name: 'Captain Sera Quill',
      role: 'Crown handler',
      disposition: 'neutral',
      description: 'Assigned to keep the summoned soul alive and on-script. Respects competence. Hates being a babysitter. Will cover for you once if you do not humiliate the Crown in public.',
      hooks: ['Give a tour of the close', 'Demand you swear', 'Warn about Lowmarket thieves'],
    },
    {
      id: 'sp-npc-3',
      name: 'Brother Tam',
      role: 'Cathedral novice',
      disposition: 'friendly',
      description: 'Saw the seventh ring fail. Too junior to be believed. Will sneak you bread, gossip, and a way out through the kitchens.',
      hooks: ['Kitchen Saint seed', 'Show the crack in the circle', 'Introduce the marked child'],
    },
    {
      id: 'sp-npc-4',
      name: 'Envoy Cinder-Ash (alias “Ash”)',
      role: 'Ash Court agent',
      disposition: 'ambiguous',
      description: 'Does not appear until a special seed or a player who hunts rumors. Soft-spoken. Offers a letter, not a knife, the first time.',
      hooks: ['Ash Court Letter', 'Name the other summoned', 'Ask what you want that Pellane will not give'],
    },
    { id: 'sp-npc-5', name: 'Ilyra Fen', role: 'informant', disposition: 'ambiguous', description: 'Reed-walker who reads reflections that are not hers.', hooks: ['Reflection state', 'Hidden reed route'] },
    { id: 'sp-npc-6', name: 'Tekk Reed', role: 'gatekeeper', disposition: 'neutral', description: 'Mirror warden of the March. Counts who comes back twice.', hooks: ['March permit', 'False-double warning'] },
    { id: 'sp-npc-7', name: 'Nomi Vale', role: 'witness', disposition: 'friendly', description: 'A child-echo who repeats debts spoken over water.', hooks: ['Name a debt', 'Follow the echo'] },
    { id: 'sp-npc-8', name: 'Pash Fen', role: 'artisan', disposition: 'neutral', description: 'Reed-cutter who sells dry paths for coin or a secret.', hooks: ['Buy a path', 'Ask who paid last'] },
    { id: 'sp-npc-9', name: 'Brother Oren', role: 'guide', disposition: 'friendly', description: 'Ash-road novice who will not admit he is following someone.', hooks: ['Cinderwake pursuit', 'Share water'] },
    { id: 'sp-npc-10', name: 'Kessa Cinder', role: 'bounty-target', disposition: 'hostile', description: 'Ashhound tracker. Heat and prints are her language.', hooks: ['Lose the track', 'Turn the hunt'] },
    { id: 'sp-npc-11', name: 'Vey Quill', role: 'informant', disposition: 'neutral', description: 'Trail archivist who buys footprints as evidence.', hooks: ['Sell a print', 'Ask what the Crown already knows'] },
    { id: 'sp-npc-12', name: 'Marn Holt', role: 'refugee', disposition: 'ambiguous', description: 'Deserter with a caravan story that does not stay still.', hooks: ['Caravan crisis', 'Hear his other version'] },
    { id: 'sp-npc-13', name: 'Sula Vane', role: 'ruler', disposition: 'neutral', description: 'Sump magistrate. Contracts are cheaper than mercy.', hooks: ['Illegal bindings', 'Price a hearing'] },
    { id: 'sp-npc-14', name: 'Nox Kade', role: 'merchant', disposition: 'ambiguous', description: 'Broker of leverage tokens under the street.', hooks: ['Buy leverage', 'Sell a name'] },
    { id: 'sp-npc-15', name: 'Rell Iron', role: 'captive', disposition: 'neutral', description: 'Bound knight who still has one clause left.', hooks: ['Ask the clause', 'Offer a rewrite'] },
    { id: 'sp-npc-16', name: 'Ado Ferry', role: 'courier', disposition: 'neutral', description: 'Ferrymaster. Night prices change with reputation.', hooks: ['Night crossing', 'Who else paid'] },
    { id: 'sp-npc-17', name: 'Jiin Vale', role: 'conspirator', disposition: 'ambiguous', description: 'Sump spy who smiles like a clerk.', hooks: ['Faction branch', 'Plant a rumor'] },
    { id: 'sp-npc-18', name: 'Varra Linen', role: 'guide', disposition: 'friendly', description: 'Sump healer who treats bindings as wounds.', hooks: ['Untie a mark', 'Pay in silence'] },
    { id: 'sp-npc-19', name: 'Caldrin Hollow', role: 'artisan', disposition: 'ambiguous', description: 'Engineer-ghost who still wants the hall powered.', hooks: ['Restore power', 'Ask what the Bell was'] },
    { id: 'sp-npc-20', name: 'Orr Hollow', role: 'witness', disposition: 'neutral', description: 'Twin who remembers the alert clock from one side.', hooks: ['Power routing', 'Name the twin'] },
    { id: 'sp-npc-21', name: 'Osa Hollow', role: 'witness', disposition: 'neutral', description: 'Twin who remembers containment from the other side.', hooks: ['Containment', 'Disagree with Orr'] },
    { id: 'sp-npc-22', name: 'Yara Quill', role: 'quest-patron', disposition: 'neutral', description: 'Argent commander. Licenses are a leash she will admit.', hooks: ['License rank', 'Reform or capture'] },
    { id: 'sp-npc-23', name: 'Kade Voss', role: 'rival', disposition: 'hostile', description: 'Argent rival who wants your paper voided.', hooks: ['Rival contract', 'Refuse the duel'] },
    { id: 'sp-npc-24', name: 'Nemi Salt', role: 'merchant', disposition: 'friendly', description: 'Quartermaster of the moving ledger.', hooks: ['Mission board', 'Kit for a stamp'] },
    { id: 'sp-npc-25', name: 'Senn Vale', role: 'mentor', disposition: 'friendly', description: 'Advocate who can argue a Mark without swearing it.', hooks: ['Audit defense', 'Name in the ledger'] },
    { id: 'sp-npc-26', name: 'Aster Wren', role: 'guide', disposition: 'neutral', description: 'Argent pathfinder for licensed jobs.', hooks: ['Pick a contract', 'Walk away clean'] },
    { id: 'sp-npc-27', name: 'Maelis Curate', role: 'keeper', disposition: 'neutral', description: 'Reliquary curator. Doctrine first, then the relic.', hooks: ['Doctrine choice', 'Ask what is corrupted'] },
    { id: 'sp-npc-28', name: 'Jor Stone', role: 'gatekeeper', disposition: 'neutral', description: 'Reliquary sentinel who counts credentials, not prayers.', hooks: ['Access paper', 'Stealth route'] },
    { id: 'sp-npc-29', name: 'Fia Lamp', role: 'guide', disposition: 'friendly', description: 'Novice who still believes the shrine is kind.', hooks: ['Ask the novice', 'Hide a guest'] },
    { id: 'sp-npc-30', name: 'Hev Ash', role: 'traitor', disposition: 'ambiguous', description: 'Apostate who will sell a relic route.', hooks: ['Infiltration', 'Hear the heresy'] },
    { id: 'sp-npc-31', name: 'Tolan Reed', role: 'conspirator', disposition: 'ambiguous', description: 'Smuggler with a crate that should not be holy.', hooks: ['Relic crate', 'Pay in silence'] },
    { id: 'sp-npc-32', name: 'Sere Vhal', role: 'ruler', disposition: 'neutral', description: 'Abbot of the reliquary. Soft voice, hard lock.', hooks: ['Audience', 'Doctrine fork'] },
    { id: 'sp-npc-33', name: 'Soren Vale', role: 'antagonist', disposition: 'ambiguous', description: 'Scar architect. Speaks as if the seam already chose you.', hooks: ['Integration clock', 'Finale alignment'] },
    { id: 'sp-npc-34', name: 'Mira Flint', role: 'refugee', disposition: 'friendly', description: 'Scar survivor who will not go back through.', hooks: ['Alliance', 'Refuse the scar'] },
  ],

  starterQuests: [
    {
      id: 'sp-quest-1',
      title: 'The Circle’s Price',
      description: 'You have just been summoned. Hear why Pellane wanted you. Swear the Pact, refuse it, or walk away before anyone owns your name.',
      recommendedLevel: 1,
      objectives: [
        'Get your bearings in this arrival (floor, cell, camp, or vault)',
        'Hear their reason (or demand it)',
        'Choose: swear, refuse, or delay',
      ],
      rewards: 'Circle Blessing remains; reputation with Pellane or the street tilts',
    },
    {
      id: 'sp-quest-side-junk',
      title: 'Otherworld Junk',
      description: 'Someone in Lowmarket will pay for Earth objects. The System may flag the sale.',
      recommendedLevel: 2,
      objectives: ['Find a fence', 'Decide what to sell', 'Survive the attention'],
      rewards: 'Coin or heat — not both for free',
    },
    {
      id: 'sp-quest-side-child',
      title: 'Marked Child',
      description: 'A child in the close has a panel fragment that matches your Blessing.',
      recommendedLevel: 2,
      objectives: ['Find the child', 'Protect, report, or hide them'],
      rewards: 'An ally, a priest problem, or both',
    },
    {
      id: 'sp-quest-special-other',
      title: 'The Other Circle',
      description: 'A second summoning site exists. The other soul from this age is there, or was.',
      recommendedLevel: 3,
      objectives: ['Confirm the second circle', 'Find traces of the other summoned'],
      rewards: 'A name, a rival, or a partner',
    },
    {
      id: 'sp-quest-special-ledger',
      title: 'Queen’s Private Ledger',
      description: 'Pellane’s war story does not add up. The ledger is in the palace, not the cathedral.',
      recommendedLevel: 3,
      objectives: ['Get a reason to enter the palace', 'Read or steal a true account'],
      rewards: 'Leverage over the Crown — and a hunt',
    },
    { id: 'sp-quest-price-calling', title: 'The Price of Calling', description: 'Every pact transferred a debt into the March. Find whose name it wears now.', recommendedLevel: 2, objectives: ['Reach Mireglass March', 'Hear one transferred debt', 'Choose to carry, refuse, or sell it'], rewards: 'A named debt — or a lighter Mark' },
    { id: 'sp-quest-price-reflection', title: 'Mirror Debt', description: 'The March can summon a duplicate. Decide if it is evidence or a rival.', recommendedLevel: 2, objectives: ['See a reflection that is not yours', 'Ask Tekk Reed what it costs', 'Close or keep the double'], rewards: 'A path change — or a second claim on you' },
    { id: 'sp-quest-price-route', title: 'Hidden Reed Route', description: 'Pash Fen sells a dry path that skips a Crown checkpoint.', recommendedLevel: 2, objectives: ['Find Pash Fen', 'Pay, threaten, or trade a secret', 'Walk the reed route once'], rewards: 'A hidden exit off the Cinderflow' },
    { id: 'sp-quest-cinder-pursuit', title: 'Ashhound Pursuit', description: 'Kessa Cinder is already on your prints. Turn the hunt or be the quarry.', recommendedLevel: 2, objectives: ['Notice the heat-track', 'Lose, parley, or fight the Ashhound', 'Tell Brother Oren a true version'], rewards: 'Pursuit clock eased or a new enemy' },
    { id: 'sp-quest-cinder-caravan', title: 'Cinderwake Caravan', description: 'Marn Holt’s caravan story is a crisis with two endings.', recommendedLevel: 2, objectives: ['Find the caravan sign', 'Hear Marn’s first version', 'Pick rescue, salvage, or walk-away'], rewards: 'Supply, witnesses, or heat' },
    { id: 'sp-quest-cinder-evidence', title: 'Footprint Ledger', description: 'Vey Quill buys ash evidence. The Crown will too.', recommendedLevel: 3, objectives: ['Collect one print or ash scrap', 'Sell to Vey or keep it', 'Survive the attention'], rewards: 'Coin or a warrant' },
    { id: 'sp-quest-sump-bindings', title: 'Illegal Bindings', description: 'Sula Vane’s court sells bindings the cathedral will not stamp.', recommendedLevel: 2, objectives: ['Enter the Sump Court', 'Read one illegal clause', 'Break, buy, or report it'], rewards: 'A leverage token or a magistrate problem' },
    { id: 'sp-quest-sump-leverage', title: 'Sump Court Leverage', description: 'Nox Kade prices names. Reputation moves the number.', recommendedLevel: 3, objectives: ['Buy or refuse a token', 'Ask Jiin Vale who else bid', 'Spend the token once'], rewards: 'A faction branch lock' },
    { id: 'sp-quest-sump-ferry', title: 'Night Ferry Price', description: 'Ado Ferry’s night crossing costs more if the Sump already knows you.', recommendedLevel: 2, objectives: ['Reach the Sump quay', 'Pay, work, or sneak the ferry', 'Land without a new binding'], rewards: 'A night exit under the city' },
    { id: 'sp-quest-hollow-power', title: 'Hollow Engine Power', description: 'Caldrin Hollow wants the hall alive. The twins remember why it died.', recommendedLevel: 3, objectives: ['Enter Hollow Engine', 'Hear Orr and Osa disagree', 'Restore or refuse power'], rewards: 'A working hall — or a quieter ruin' },
    { id: 'sp-quest-hollow-contain', title: 'Bell Containment', description: 'The last lock is not a person. Keep it seated.', recommendedLevel: 3, objectives: ['Find the containment aisle', 'Choose power-routing or a hard lock', 'Leave before the alert clock'], rewards: 'Containment held or a live hazard' },
    { id: 'sp-quest-argent-license', title: 'Licensed Blood', description: 'Yara Quill will rank you. Kade Voss will try to void the paper.', recommendedLevel: 2, objectives: ['Find the Argent Ledger', 'Accept, reform, or refuse a license', 'Survive Kade’s claim'], rewards: 'A rank stamp — or a burned paper' },
    { id: 'sp-quest-argent-audit', title: 'A Name in the Ledger', description: 'Senn Vale can argue a summoned identity back onto a page — or sell it.', recommendedLevel: 3, objectives: ['Sit an audit', 'Restore, commodify, or sacrifice the name', 'Walk out with one version'], rewards: 'Identity leverage' },
    { id: 'sp-quest-reliquary-doctrine', title: 'Relic Doctrine', description: 'Maelis Curate wants a doctrine choice before the relic moves.', recommendedLevel: 3, objectives: ['Enter Saint Vhal’s Reliquary', 'Hear doctrine from Maelis or Sere', 'Pick a relic stance'], rewards: 'Access credentials or a quiet exile' },
    { id: 'sp-quest-reliquary-infiltrate', title: 'Reliquary Infiltration', description: 'Hev Ash and Tolan Reed sell a route that Jor Stone is paid to close.', recommendedLevel: 3, objectives: ['Buy or refuse the apostate route', 'Pass Jor Stone by paper or stealth', 'Touch or leave the relic'], rewards: 'A relic, a hunt, or both' },
    { id: 'sp-quest-scar-answers', title: 'The Scar That Answers', description: 'The Integration Scar connects transferred debts to a last clock. Mira Flint will not go back through.', recommendedLevel: 4, objectives: ['Reach the Integration Scar', 'Hear Soren Vale’s alignment', 'Choose alliance, loadout, or refusal'], rewards: 'A finale lock — not a recap lecture' },
  ],

  starterItems: [
    {
      id: 'sp-clothes',
      name: 'The clothes you had on when the light took you',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      provenance: 'Earth — still on you after the circle',
      description: 'Whatever you were wearing on Earth. Not armor. Not a costume. Replace this card when the player names real garments.',
    },
    // Circle Blessing is NOT starter kit — grant via <item-gain> when registration/Appraisal awards it in play.
  ],
};
