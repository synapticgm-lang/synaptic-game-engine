import type { CampaignBible } from './types';

/**
 * Original SynapticGM LitRPG bible — late / private awakening in the world you already live in.
 * Not a summon. Not Earth-locked. Player picks folk and world shape at opening.
 * Genre tropes only — not Solo Leveling, My Vampire System, or any named series.
 */
export const heroAwakening: CampaignBible = {
  id: 'hero-awakening',
  title: 'Hero Awakening',
  archetype: 'ai_random',
  engineMode: 'litrpg',
  difficulty: 'Standard',
  genreTag: 'Awakening',
  tagline: 'You were already here. Your panel just opened.',
  shortDescription:
    'Late private awakening LitRPG: any folk, any world you already live in — not a summon. Fixed public Grades; your Wake Ledger can still grow. Original SynapticGM rails.',
  licenseNote:
    'Original SynapticGM setting. Uses common LitRPG tropes (late awakening, private growth System, public ranks that plateau, rifts/thresholds, crews and authorities). Not Solo Leveling, Omniscient Reader, Tower of God, My Vampire System, or any named novel, anime, manhwa, or game. Never import unique skill names, place names, or plot beats from those works.',
  worldOutlineId: null,
  startingLocation: 'where this tale opens',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'ha-kit', name: 'What you had on you', capacity: 16 },

  openingMode: 'weave',
  openingRegistrar: {
    voice: 'inworld',
    label: 'WAKE LEDGER',
    startLine: 'A private panel only you can see. The world you already lived in is still here.',
  },
  /** Soft default if deck pick fails — rewrite, do not reprint. */
  openingHook:
    'You are still in your own world — not summoned elsewhere. Smoke or dust hangs where a Threshold just went wrong. A private panel opens at eye level: [Wake Ledger Online]. Someone nearby wants a headcount. Your body, folk, and kit are whatever you already were.',
  /** Code picks one per New Game (seed). Writer rewrites with artistic license — ingredients, not a script. */
  openingHooks: [
    'A Threshold clear went wrong indoors. Dust, alarms or bells, collapsed corridor. You were Unmarked. A private Wake Ledger opens. A crew lead shouts for survivors.',
    'Dawn market. A sealed Threshold door cracks. Crowd panics. Your panel blooms mid-run — only you see levels. A stall-keeper grabs your sleeve.',
    'Night watch on a wall or rooftop. Something spills through a Threshold seam. Your first skill fires by accident. A rival Awoken sees the flash.',
    'Infirmary or healers’ tent. You should be dead. Healers argue over wounds that do not match an Unmarked body. The ledger whispers while they work.',
    'Job board / contract hall. Someone posts your name who should not know it. Your panel shows a quest they did not stamp. A clerk watches too closely.',
    'Quiet shrine, cellar, or archive. Alone. The Wake Ledger opens without a crisis. Footsteps on the stairs — friend, auditor, or thief.',
    'Under-river tunnel / sewer / mine. Grade spill. You and one stranger make it out. Their Grade is fixed. Yours is not. Do you tell them?',
    'Festival square. Public First Mark ceremony for others. You were never called. Your panel opens anyway — wrong day, wrong person, right world.',
  ],
  openingPrompts: [
    {
      id: 'name',
      kind: 'name',
      question: 'What name does this world already use for you?',
      suggestions: ['Random name', 'Use the name I already have'],
    },
    {
      id: 'folk',
      kind: 'species',
      question: 'What folk or body are you — human, elf, dwarf, beastfolk, or something else of this world?',
      suggestions: ['Human', 'Elf', 'Dwarf', 'Beastfolk', 'Something rarer — I will say'],
    },
    {
      id: 'where',
      kind: 'location',
      question:
        'Where does this open? Name the world-shape and place (fantasy city, frontier hold, sky-port, modern street, ship, wilds — your call). Or pick a random place.',
      suggestions: [
        'Random place in this world',
        'A fantasy city market or guild street',
        'A frontier hold or road inn',
        'A sky-port / harbor / ship',
        'A modern street or metro if that is this world',
      ],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'What do you look like, and what are you wearing as this begins?',
      suggestions: [
        'Local clothes that fit this place',
        'Work kit or a uniform from this world',
        'Travel-worn cloak and practical gear',
        'Whatever I slept in or already owned',
      ],
    },
    {
      id: 'kit',
      kind: 'kit',
      question:
        'What is actually on you — pockets, bag, belt? Only what fits this world and folk. Combat-grade inventions will be rejected.',
      suggestions: [
        'Everyday kit for this place',
        'A bag with travel odds and ends',
        'Almost nothing on me',
      ],
    },
  ],

  styleRail: `HERO AWAKENING — STYLE (BINDING):
- You are NOT summoned to another world. You awaken where you already live.
- WORLD SHAPE and FOLK are player canon from opening answers. Honor them every turn (tech level, fashion, architecture, species body).
- Soft default place-names (Lampmere, Ashline Yard, etc.) exist only if the player did not name a place — skin them to the chosen world or replace them.
- Image and prose must match the player's world (fantasy plate OR modern street OR other — never force Earth jeans/phones unless they chose that world).
- Wake Ledger is private growth. Public Clearance Grades plateau. Never brand the cheat with licensed series names.`,

  premise: `You already live in this world. You were not summoned. Most people who Awaken receive a fixed Clearance Grade on First Mark and never grow past it. You were Unmarked / late. A Threshold incident (or a quieter glitch) opens a private Wake Ledger — levels and skills no public badge shows. Authorities will leash you if they learn. Crews will use you. Quiet researchers will want samples. Secrecy is a choice.

ORIGINALITY (BINDING): Never name published novels, anime, manhwa, or games in play. Never import unique skill names, distinctive places, or plots from any series.

WORLD SHAPE (PLAYER CANON):
- Opening answers lock folk, place, look, and kit. The writer invents texture that matches — do not overwrite with Earth-modern or medieval defaults against the player.
- Soft setting scaffold (use only when the player picks random / leaves blanks): Lampmere, a mixed-folk city-state on the Meridian Reach where Thresholds open in cellars, markets, and vaults. Rename freely to fit their answers.

GENRE PALETTE (ORIGINAL NAMES — portable across world-shapes):
- Thresholds: rifts that seed dungeon rooms into real places (market vault, mine, metro, keep cellar — match the world).
- Clearance Grades: public, fixed after First Mark (Null / Local / Metro / Regional / Continental as labels — not a licensed rank ladder).
- Wake Ledger: private growth panel. Never call it “Player,” “Solo,” or any series brand.
- Meridian Clearance Authority (MCA): licenses crews, stamps Grades — bureaucracy in whatever tech/magic level fits.
- Independent Riftwards: scrap clears, shared pay.
- Vesper Cartel: black-market Threshold loot and fake stamps.
- Quiet Hands: research circle that believes Wake Ledgers are intentional.
- Soft hubs: Ashline Yard (staging / jobs), The Low Watt (food and rumor), Ward Rest (healers), first dungeon = the Threshold that nearly killed you.

DISTINCT FROM OTHER SYNAPTICGM BIBLES:
- Not System Integration: no global same-day registration of every soul.
- Not Gatebreak Ward: not district-militia theater as the whole pitch.
- Not Summoned Pact: no cathedral circle, no Earth→other-world yank. You stay home.

OPENING KIT (AUTHORITY): Worn clothes and what is on you are the kit — matching folk and world. Never invent endgame weapons or licensed hunter armor. The only System gift at first contact is unidentified [Wake Residue]. Appraisal or Quiet Hands is required to name it.

PLAYER AGENCY (BINDING): Hide, register late, bargain, or lie. Protest is dialogue. First scene is the awakening beat and the people in it — not a journal dump.

AWAKENING FORK:
- Hide the ledger; risk discovery as you outgrow your story.
- Register late with MCA; leash + cover.
- Sell growth to Independents or Vesper.
- Quiet Hands deepens the ledger — and asks what you are becoming.

STORY SPINE (skeleton — unique each run):
1. Awakening beat. Private ledger. Someone wants answers.
2. First free hour in the local hub — ordinary people.
3. Someone notices you survived without a Grade story that fits.
4. Local threat — not world-ending.
5. Proof public Grades are incomplete.
6. Choose: register, hide, bargain, or burn a bridge.
7. A larger Threshold schedule forces the choice open.

SIDE / SPECIAL SEEDS (writer only — earn in play): scrap fence; missing meal delivery; fake First Mark stamp; residue sample; rival clear; civilian who wants answers not a speech; ledger true name; auditor’s file; second residue in the same region; cartel buyout; public reveal.

Do not name Quiet Hands leadership or the second residue until earned. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'ha-lore-1',
      title: 'Thresholds',
      category: 'world',
      body: 'Thresholds are spatial rifts that deposit dungeon architecture into real places — market cellars, mines, vaults, transit tunnels, keep basements. Skin the architecture to the campaign’s world-shape. Sealing one means clearing seeded rooms and collapsing the boss chamber or installing a stabilizer. Code owns numbers. Describe the room before any creature.',
      tags: ['thresholds', 'rifts', 'dungeons'],
    },
    {
      id: 'ha-lore-2',
      title: 'Clearance Grades',
      category: 'mechanic',
      body: 'On First Mark, most Awoken receive a fixed Clearance Grade — a public badge and a soft ceiling. Training and gear matter; raw growth does not. Unmarked / Dormant people have no Grade. Lying about Grade is a crime wherever MCA writ runs. The player’s Wake Ledger can outgrow any public story — that tension is the campaign.',
      tags: ['grades', 'awakening', 'law', 'secrecy'],
    },
    {
      id: 'ha-lore-3',
      title: 'Wake Ledger',
      category: 'mechanic',
      body: 'A private panel visible only to the bearer. Levels, skills, growth the public Grade system denies. Origin unknown. Quiet Hands calls it intentional. MCA calls it a breach anomaly. Never brand it with published-series names. First gift: [Wake Residue ???] until Appraised. Growth leaves a tell auditors and rivals can learn.',
      tags: ['system', 'wake', 'private', 'growth'],
    },
    {
      id: 'ha-lore-4',
      title: 'World Shape (Player Canon)',
      category: 'world',
      body: 'Folk, place, look, and kit come from opening answers. Soft default if blank: Lampmere on the Meridian Reach — mixed-folk city-state, Thresholds in markets and vaults. Replace or rename freely. Never force Earth phones, jeans, or medieval plate against the player’s answers.',
      tags: ['world', 'canon', 'folk', 'opening'],
    },
    {
      id: 'ha-lore-5',
      title: 'Meridian Clearance Authority',
      category: 'faction',
      body: 'MCA licenses crews, stamps Grades, and seizes anomalous loot. Local face: Auditor Lin Vos. Cooperation buys cover and a leash. Hiding a Wake Ledger is illegal if proven. Bureaucratic, not cartoon evil — officers can be kind, ambitious, or both. Their tools match the world (scrolls, badges, scanners, wards).',
      tags: ['mca', 'law', 'faction'],
    },
    {
      id: 'ha-lore-6',
      title: 'Independent Riftwards',
      category: 'faction',
      body: 'Semi-licensed or scrap crews who clear small Thresholds for shares. Staging at Ashline Yard (or the local equivalent). Crew Lead Mara Keene is often the first friendly face after a bad clear. Loyalty is earned in work, not speeches.',
      tags: ['crews', 'independents', 'hub'],
    },
    {
      id: 'ha-lore-7',
      title: 'Vesper Cartel',
      category: 'faction',
      body: 'Black-market Threshold loot and fake Grade stamps. Pax Orr fences curios and hush. Useful and toxic. They will buy growth secrets and sell you out if MCA pays more.',
      tags: ['cartel', 'black-market', 'faction'],
    },
    {
      id: 'ha-lore-8',
      title: 'Quiet Hands',
      category: 'faction',
      body: 'A research circle that believes Wake Ledgers are seeded on purpose. Clinical, hungry for samples. Tests deepen the ledger and always ask for something living. Do not spawn leadership on turn one.',
      tags: ['research', 'cult', 'mystery'],
    },
    {
      id: 'ha-lore-9',
      title: 'Wake Residue (Unidentified)',
      category: 'mechanic',
      body: 'Glitched passive at first contact. Until Appraised: [???]. Possible truths (pick one per campaign, do not list in play): once-per-day soft rewind of a failed physical check; Threshold beasts hesitate; Grade readers mis-stamp you Null; a private map ping; stamina bleed when the ledger levels. Naming without Appraisal is a lie.',
      tags: ['residue', 'appraisal', 'cheat', 'cost'],
    },
    {
      id: 'ha-lore-10',
      title: 'Ashline Yard',
      category: 'world',
      body: 'Crew staging and informal job board. Rename to fit the world (depot, guild yard, sky-dock). Gear, food urns, posted clears. Politics live in who gets the safe jobs.',
      tags: ['hub', 'jobs', 'crews'],
    },
    {
      id: 'ha-lore-11',
      title: 'The Low Watt',
      category: 'world',
      body: 'Food-and-rumor hub after clears — diner, tavern, or mess depending on world-shape. Grades show in how people treat you at the counter, not as a lecture.',
      tags: ['hub', 'rumor', 'food'],
    },
    {
      id: 'ha-lore-12',
      title: 'First Threshold',
      category: 'world',
      body: 'The dungeon that opens the campaign — seeded into whatever place fits the player’s world. Numbered rooms; fog on unvisited floors. First Blood rules: room before creatures. Authorities want it sealed. Independents want salvage.',
      tags: ['dungeon', 'first-blood', 'threshold'],
    },
  ],

  keyNPCs: [
    {
      id: 'ha-npc-1',
      name: 'Mara Keene',
      role: 'Independent crew lead',
      disposition: 'friendly',
      description:
        'Often the first to haul you out of a bad Threshold. Fixed Metro Grade, practical, allergic to speeches. Will cover one lie if you do not get her people killed. Wants competent hands, not a messiah. Skin her gear and speech to the world-shape.',
      hooks: [
        'Offer a share on a Local clear',
        'Ask what you saw when it went wrong',
        'Warn that MCA will interview survivors',
      ],
    },
    {
      id: 'ha-npc-2',
      name: 'Lin Vos',
      role: 'MCA Auditor',
      disposition: 'ambiguous',
      description:
        'Polite ledger energy. Tracks anomalous survivors. Offers late registration as kindness and leash. Career ambition wrapped in public safety. Tools match the world.',
      hooks: [
        'Request a voluntary Grade interview',
        'Offer temporary Local stamp if you cooperate',
        'Hint that growth anomalies leave a measurable tell',
      ],
    },
    {
      id: 'ha-npc-3',
      name: 'Pax “Penny” Orr',
      role: 'Fence, Vesper-adjacent',
      disposition: 'ambiguous',
      description:
        'Buys curios and hush. Smiles like a receipt. Will pay for proof of a Wake Ledger and will sell that proof if the price is right.',
      hooks: [
        'Buy scrap or curios from the Threshold',
        'Offer a fake First Mark stamp',
        'Broker a Quiet Hands introduction for a cut',
      ],
    },
    {
      id: 'ha-npc-4',
      name: 'Dr. Rhee',
      role: 'Healer / trauma medic',
      disposition: 'friendly',
      description:
        'Treats collapse survivors. Notices injuries that do not match Unmarked stories. Heals first, asks hard questions second. Believes the System should not own people’s bodies.',
      hooks: [
        'Patch you up after the incident',
        'Ask how an Unmarked survived Grade-breach trauma',
        'Tip about Quiet Hands sampling patients',
      ],
    },
    {
      id: 'ha-npc-5',
      name: 'Joss Vale',
      role: 'Licensed Riftward, Metro Grade',
      disposition: 'ambiguous',
      description:
        'Peaked on First Mark and knows it. Competitive, not stupid. Invites you on “safe” clears to size you up. Can become rival, ally, or the person who outs you in public.',
      hooks: [
        'Invite a joint Local clear',
        'Challenge your Unmarked story',
        'Offer to sponsor MCA registration for a favor',
      ],
    },
    {
      id: 'ha-npc-6',
      name: 'Sable (Quiet Hands contact)',
      role: 'Research intermediary',
      disposition: 'neutral',
      description:
        'Appears when earned. Soft voice, no surname. Speaks of calibration and intended growth. Offers tests, not comfort. Folk and dress match the world.',
      hooks: [
        'Request a Wake Residue sample',
        'Offer Appraisal that names the glitch',
        'Hint that a second ledger exists in the region',
      ],
    },
  ],

  starterQuests: [
    {
      id: 'ha-quest-1',
      title: 'Walk Out Breathing',
      description:
        'The Threshold incident that opened your Wake Ledger. Survive it, meet whoever found you, and decide whether anyone learns the truth.',
      recommendedLevel: 1,
      objectives: [
        'Get clear of immediate danger or secure a safe corner',
        'Give someone a headcount answer (true, partial, or lie)',
        'Choose: hide the ledger, register late, or bargain',
      ],
      rewards: 'Wake Residue remains; reputation with Independents or MCA tilts',
    },
    {
      id: 'ha-quest-2',
      title: 'Yard Share',
      description:
        'Mara offers a Local Threshold share if you can follow orders and not freeze. MCA may be watching the board.',
      recommendedLevel: 2,
      objectives: [
        'Show up at Ashline Yard (or the local staging hub)',
        'Accept, decline, or renegotiate the share',
        'Complete or abort the Local clear',
      ],
      rewards: 'Scrap gear, Stabilizer chips, crew trust or suspicion',
    },
    {
      id: 'ha-quest-side-fence',
      title: 'Scrap Fence',
      description: 'Pax Orr pays for Threshold curios. The sale can flag MCA interest.',
      recommendedLevel: 2,
      objectives: ['Find Pax', 'Decide what to sell', 'Survive the attention'],
      rewards: 'Coin or heat — not both for free',
    },
    {
      id: 'ha-quest-side-rival',
      title: 'Grade-Safe Clear',
      description: 'Joss Vale invites you on a posted Local job to prove you belong — or to expose you.',
      recommendedLevel: 3,
      objectives: ['Accept or refuse the invite', 'Survive without exposing growth', 'Handle the aftermath'],
      rewards: 'Ally, rival, or public problem',
    },
    {
      id: 'ha-quest-special-name',
      title: 'Ledger True Name',
      description: 'Quiet Hands or a licensed Appraiser can name the Wake Residue. The name always has a cost.',
      recommendedLevel: 3,
      objectives: ['Find Appraisal access', 'Pay the price or walk away', 'Live with the tell'],
      rewards: 'Named residue passive; a permanent tell',
    },
    {
      id: 'ha-quest-special-second',
      title: 'Second Residue',
      description: 'Another private ledger exists in the region. Alive, scared, or already sold.',
      recommendedLevel: 4,
      objectives: ['Confirm the rumor', 'Find traces without alerting MCA'],
      rewards: 'A name, a rival, a partner, or a weapon',
    },
  ],

  starterItems: [
    {
      id: 'ha-clothes',
      name: 'The clothes you already had on',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      provenance: 'Your world — still on you after the awakening beat',
      description:
        'Whatever fits the folk and place you named. Not licensed kit. Not a costume. Replace this card when the player names real garments.',
    },
    {
      id: 'ha-residue',
      name: 'Wake Residue [???]',
      rarity: 'Rare',
      itemType: 'accessory',
      itemLevel: 1,
      equipped: true,
      slot: 'Trinket',
      provenance: 'Wake Ledger — first contact gift',
      description:
        'Unidentified glitched passive. Appraisal or Quiet Hands calibration required to name it. Do not invent a licensed skill title.',
    },
  ],
};
