import type { CampaignBible } from './types';

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
      beats: [
        'Candle-smoke cellar. You are on your back in a cult circle.',
        'A blue panel hangs. The people here are not the High Chanter.',
        'A relic is wrapped in cloth on the altar — an offer, not starting loot.',
      ],
      fallback:
        'Light, then candle-smoke in a cellar. Wrong gods, wrong chant. You are on your back in a cult circle the Crown will deny. A blue panel hangs. Someone upstairs will call this Pellane’s summon anyway.',
    },
    {
      location: 'The Sevenfold Circle under bombardment',
      faction: 'Scattered Scale priests and a panicked handler, ceiling already cracking',
      summonIntent: 'They finished the rite while the city was hit. There is no orderly welcome.',
      openingOffer:
        'Grab a fallen soldier’s kit if you help them hold the vault. Freeze or flee and you have only Earth clothes — the crate of issued blades is buried in dust.',
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
      summonIntent: 'You were in the crowd. You were not the name on the rite.',
      openingOffer:
        'Play along as their summoned guest and they will smuggle you a cloak and a pass. Name yourself extra and they may try to hide you — or parade you — with nothing added to your pockets.',
      beats: [
        'Festival noise. Public stones. Handlers freeze.',
        'A blue panel hangs. One whisper: wrong catch.',
        'No ceremony kit unless you agree to wear their story.',
      ],
      fallback:
        'Light, then festival noise. You were not the name on the rite — you were in the crowd. You are on the stones of a public square while handlers freeze. A blue panel hangs. One whisper: “Wrong catch.”',
    },
    {
      location: 'a wayside shrine on the Valespire road',
      faction: 'One frightened priest, no capital audience',
      summonIntent: 'One mistake on a rural circle. They did not mean to pull an Earth soul this far from the city.',
      openingOffer:
        'Walk with them to Valespire under a traveler’s staff and cloak they keep for pilgrims. Stay and they will beg you to leave with only what you arrived in.',
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
      summonIntent: 'A rival hall. They want a Calamity Mark as proof the Scale rejected Pellane.',
      openingOffer:
        'Wear the Mark openly and they offer ember-ward kit and citizenship papers. Refuse and you keep Earth clothes — they may still try to keep you.',
      beats: [
        'You are on your back in a circle that is not Pellane’s.',
        'A blue panel hangs. They will say the Crown summoned you.',
        'A wrapped ember-blade sits on a side table — a deal, not yours yet.',
      ],
      fallback:
        'Light, then a rival hall. You are on your back in a circle that is not Pellane’s. They will say the Crown summoned you. A blue panel hangs. Your Earth clothes are still on you.',
    },
    {
      location: 'The Sevenfold Circle — four rings occupied',
      faction: 'Crown ritual staff arguing over a mass summon',
      summonIntent: 'Four bodies. Politics in the first breath: who is Pactborn, who is Marked, who was extra.',
      openingOffer:
        'The first to swear gets issued kit. The others wait. You can swear, refuse, or watch someone else take the blade.',
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
      beats: [
        'Linen, boiled iron, someone screaming two beds over. You arrived on a circle chalked between cots.',
        'A blue panel hangs. A chirurgeon is already angry at the paperwork.',
        'A kit tray is ready if you say yes to the work.',
      ],
      fallback:
        'Light, then linen and boiled iron. You are on your back on a circle chalked between infirmary cots. A blue panel hangs at eye level. The chirurgeons expected a healer. You still have Earth clothes.',
    },
    {
      location: 'alone in a shabby-but-standing building somewhere in Pellane country',
      faction: 'Nobody here — the summoners are gone, delayed, or never came',
      summonIntent:
        'A rite dumped you alone. The building still stands with ordinary wear: drafts, sticky door, stained plaster. Writer picks what it was (cottage, barn, mill, shop, watch-post, chapel annex) — not a named series inn.',
      openingOffer:
        'No one offers kit. You may scavenge what is left inside, or walk out with only Earth clothes toward the next smoke or road.',
      beats: [
        'You are alone. No chant. No handlers. Cold floor or boards under you.',
        'A blue panel hangs at eye level — private, yours. Wind through a gap.',
        'Ruin level: standing, but with a few issues (loose shutter, damp corner, roof that complains).',
        'Do not invent a welcoming NPC on turn one. Footsteps or a distant bell can be later.',
      ],
      fallback:
        'Light, then quiet. You are alone on the floor of a shabby building that still has four walls and most of a roof. A blue panel hangs at eye level — private, yours. Nobody is here. Your Earth clothes are still on you.',
    },
    {
      location: 'alone in a building with serious damage somewhere off the Valespire roads',
      faction: 'Nobody here — the circle worked and the people did not stay',
      summonIntent:
        'Solo arrival. The structure is usable only if you are careful: cracked wall, rain through a hole, door off its hinges. Writer picks the building type at random (warehouse, farmhouse, toll-house, bathhouse shell).',
      openingOffer:
        'No issued kit. Salvage one useful thing from the mess if you search, or leave with Earth kit only.',
      beats: [
        'You are alone. Dust motes. A blue panel hangs.',
        'Ruin level: still a building, but badly hurt — one room open to weather, floor soft in places.',
        'No sword on a pedestal. Anything useful is salvage you choose to take.',
        'The Mark / Pactborn argument is only on your panel for now — no audience.',
      ],
      fallback:
        'Light, then dust and a draft. You are alone in a damaged building: one wall cracked, rain staining the floor, the door half off its hinges. A blue panel hangs at eye level. Nobody came to greet you.',
    },
    {
      location: 'alone in a half-collapsed ruin on the edge of wild country',
      faction: 'Nobody here — empty ruin, empty sky',
      summonIntent:
        'The rite left you with no witnesses. Half the roof is gone; rooms open to sky. Writer picks what the place once was (granary, tower stump, longhouse, storehouse).',
      openingOffer:
        'No bargain. Dig in the rubble for scrap, or walk toward distant smoke with only what you arrived in.',
      beats: [
        'You are alone under open sky and broken beams.',
        'A blue panel hangs above uneven stone or ash.',
        'Ruin level: half-collapsed — dangerous floors, bird nests, no furniture worth naming unless you search.',
        'Do not spawn a quest-giver in the doorway on the first page.',
      ],
      fallback:
        'Light, then sky through broken beams. You are alone in a half-collapsed ruin. A blue panel hangs at eye level. Wind moves ash across the floor. Your Earth clothes are still on you.',
    },
    {
      location: 'alone in a wall-shell with no roof',
      faction: 'Nobody here — only standing walls and empty window holes',
      summonIntent:
        'A failed or abandoned circle left you in a hollow building: walls and window gaps, no roof, weeds in the corners. Writer picks the footprint (chapel shell, manor wing, market hall, barracks).',
      openingOffer:
        'Nothing is offered. Search the corners for forgotten scrap, or leave the shell with Earth kit only.',
      beats: [
        'You are alone. Open sky. Four walls or fewer.',
        'A blue panel hangs in daylight. Birds. Distant road noise or none.',
        'Ruin level: shell only — no roof, no door, grass already claiming the floor.',
        'Starting kit is Earth clothes. Salvage is a choice, not a gift.',
      ],
      fallback:
        'Light, then open sky inside four ruined walls. There is no roof. Empty window holes look onto empty country. A blue panel hangs at eye level. You are alone. Your Earth clothes are still on you.',
    },
    {
      location: 'alone on the stone outline of a building that is gone',
      faction: 'Nobody here — only a footprint in the grass',
      summonIntent:
        'The worst end of ruin: foundation stones and a rectangle in the turf where a building once stood. No walls. Writer does not invent a standing inn or shop — only the outline, and whatever scrub grew since.',
      openingOffer:
        'No kit, no hosts. Follow a track, a river, or smoke on the horizon with only what you arrived in — or dig at the outline for nothing but dirt.',
      beats: [
        'You are alone on cold ground. Grass through old foundation stones.',
        'A blue panel hangs over the outline of a building that is no longer there.',
        'Ruin level: outline only — no walls, no roof, no door. The camera stays HERE.',
        'Do not invent townspeople for the first page. The world can answer when you move.',
      ],
      fallback:
        'Light, then grass and cold foundation stones. You are alone on the outline of a building that is gone — a rectangle in the turf, no walls left. A blue panel hangs at eye level. Your Earth clothes are still on you. The horizon is empty of people.',
    },
    {
      location: 'alone in a burnt husk that still has a shape',
      faction: 'Nobody here — ash, charcoal ribs, no living summons',
      summonIntent:
        'Fire took the place before or during the rite. Blackened posts and a floor that still remembers rooms. Writer picks the burnt type (cottage, barn, workshop, waystation) without naming licensed inns.',
      openingOffer:
        'No one is left to bargain. Rake ash for a nail or a buckle if you want, or walk away in Earth clothes.',
      beats: [
        'You are alone. Char smell. Soft ash under your hands.',
        'A blue panel hangs in the smoke-haze of an empty day.',
        'Ruin level: burnt husk — shape of a building, no safe roof, charcoal ribs.',
        'Do not place a helper NPC in the doorway on turn one.',
      ],
      fallback:
        'Light, then ash. You are alone in the burnt husk of a building — charcoal ribs, no roof, the shape of rooms still readable in the floor. A blue panel hangs at eye level. Nobody is here.',
    },
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

LOCATION LANGUAGE (BINDING): Camera is HERE — the seeded summon place for this run (cathedral circle, war camp, cell, arena, shrine, festival square, rival hall, treaty tent, harbor hold, ruined west-wall circle, infirmary, or an alone-arrival ruin of a random building). Alone-arrival cards: no summoners on page one; the writer picks the building type; ruin level is fixed by the card (shabby-standing → damaged → half-collapsed → wall-shell → burnt husk → foundation outline only). Do not teleport them to the Sevenfold Circle if Location is already somewhere else. Never call this interior "a nearby building." "The court" is Pellane's Crown / the people in this room, not the enemy. The enemy polity is the Ash Court. Do not use "the court" as both current room and the enemy in the same beat.

ORIGINALITY (BINDING): Never name published novels, anime, or games in play. Never import unique skill names, distinctive places, or plots from any series. Inn, guild, and dungeon are generic hubs with SynapticGM names only.

GENRE PALETTE (ORIGINAL NAMES — use these):
- System screens and classes are in-world. A blue panel is private and earned after the scene; code owns numbers. Classes exist (handler, field chirurgeon, wall-warden, unmarked). A healer class may still fight — that is a job, not a copied protagonist.
- Hero-summon gone wrong / villain-summon: [Pactborn] vs [Calamity Mark]. Player choice. No forced allegiance.
- Earth origin: clothes and pockets. Permanent displacement. No logout button, no VR-helmet plot.
- Inn hub: The Weighing Cup, a cathedral-close common room (beds, rumor, stew).
- Guild hub: Valespire Contract Hall (posted jobs, rank boards, politics).
- Dungeon: Cathedral Undercroft — numbered floors; fog on unvisited rooms. Street map stays outdoors.

OPENING KIT (AUTHORITY): At the first breath, worn clothes and pocket contents from Earth are the kit. Never auto-invent an iron shortsword, traveler tunic, or healing draught onto the sheet. NPCs MAY OFFER gear (a blade, cloak, papers, coin) as a bargain for a pact, enlistment, or release — describe the offer; do not add it to inventory until the player accepts. Refuse and they keep only Earth kit. The only System gift at registration is an unidentified [Circle Blessing] (glitched passive). Appraisal is required to name it.

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
      body: 'At registration the System grants one glitched passive. Until Appraised it is [???]. Possible truths (pick one per campaign, do not list them in play): a once-per-day rewind of a single failed check; speech that people hear as the language they trust; a weapon that only exists while they are angry; a mark that beasts will not strike first; a leak that lets Ash Court scouts hear their location. Naming it without Appraisal is a lie. Power fantasy without a cost is forbidden — the glitch always has a tell.',
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
    {
      id: 'sp-blessing',
      name: 'Circle Blessing [???]',
      rarity: 'Rare',
      itemType: 'accessory',
      itemLevel: 1,
      equipped: false,
      provenance: 'System gift at summoning — unidentified',
      description: 'A glitched passive System gift. Appraisal required to name it. Not armor, not a cloak — keep unequipped until identified.',
    },
  ],
};
