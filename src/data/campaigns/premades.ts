import { makeBible } from './makeBible';

/**
 * Additional premade worlds — ORIGINAL SynapticGM content.
 * Inspired by popular *genre tropes* and the spirit of free/CC TTRPG one-shots,
 * but NOT copied from closed IPs (no Forgotten Realms, no named LitRPG novels,
 * no Critical Role settings, no DM's Guild exclusive FR modules).
 *
 * Safe rails the AI can follow: original premises + SRD-compatible fantasy language.
 */

export const ascendingSpire = makeBible({
  id: 'ascending-spire',
  title: 'The Ascending Spire',
  archetype: 'tower_ascent',
  engineMode: 'litrpg',
  difficulty: 'Hardcore',
  tagline: 'One tower. One hundred floors. Climb or be forgotten.',
  shortDescription:
    'LitRPG tower-climb: ranked floors, floor bosses, and a System that only rewards ascent. Genre trope — original world.',
  licenseNote:
    'Original SynapticGM setting. Uses common LitRPG “tower climb” tropes (not any specific novel). Rules language may reference SRD-compatible fantasy terms under CC-BY where applicable.',
  premise:
    'A black spire punched through the sky overnight. The System labeled it [Ascending Spire] and opened registration. Each floor is a sealed biome with its own rules, monsters, and a Floor Warden. Clear the floor to unlock the stair. Fail, and the Spire keeps your gear — and sometimes your name. Outside the Spire, cities pay climbers for floor maps and rare drops. Inside, only rank and resolve matter.',
  lore: [
    {
      title: 'Floor Law',
      category: 'mechanic',
      body: 'Each floor publishes temporary laws (no flying, silence only, fire deals double). Breaking a Floor Law triggers a System penalty. Laws reset when the Floor Warden falls.',
      tags: ['tower', 'floors', 'rules', 'system'],
    },
    {
      title: 'The Ranking Board',
      category: 'world',
      body: 'A public board outside the Spire lists living climbers by highest cleared floor. Fame brings contracts — and assassins hired by rival guilds.',
      tags: ['ranking', 'guilds', 'fame'],
    },
    {
      title: 'Spire Echoes',
      category: 'history',
      body: 'Whispers claim the Spire is a compressed dungeon from a dead world. Echoes of previous climbers sometimes appear as hostile phantoms on floors they died clearing.',
      tags: ['history', 'echoes', 'mystery'],
    },
  ],
  npcs: [
    {
      name: 'Marshal Kade',
      role: 'Spire Gate Warden',
      disposition: 'neutral',
      description: 'Scarred veteran who never climbed past Floor 20. Issues climb permits and buys verified floor intel.',
      hooks: ['Buy maps', 'Warn about Floor 7 law change', 'Offer escort contract'],
    },
    {
      name: 'Nyra Vell',
      role: 'Rival Climber',
      disposition: 'ambiguous',
      description: 'Cheerful, ruthless, always one floor ahead. May ally — or steal your clear credit.',
      hooks: ['Temporary party', 'Race to Floor Warden', 'Betrayal risk'],
    },
  ],
  quests: [
    {
      title: 'First Ascent',
      description: 'Clear Floor 1 and register your name on the Ranking Board.',
      recommendedLevel: 1,
      objectives: ['Enter the Spire', 'Survive Floor 1 laws', 'Defeat Floor Warden', 'Exit and register'],
      rewards: 'Climb Permit+, Spire Coin pouch, Ranking Board entry',
    },
  ],
  items: [
    {
      name: 'Climber’s Tag',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'System-bound ID. Required to open Spire gates and claim floor clears.',
    },
    {
      name: 'Ration Brick',
      rarity: 'Common',
      itemType: 'consumable',
      description: 'Dense climb food. Restores a little stamina; tastes like chalk.',
    },
  ],
});

export const inkboundAcademy = makeBible({
  id: 'inkbound-academy',
  title: 'Inkbound Academy',
  archetype: 'magic_academy',
  engineMode: 'litrpg',
  difficulty: 'Standard',
  tagline: 'Write your class. Bleed for your grades.',
  shortDescription:
    'School-arc LitRPG: dorms, exams, rival houses, and a living rulebook. Original academy — not any anime/novel IP.',
  licenseNote:
    'Original SynapticGM setting. Inspired by generic “magic academy / school arc” tropes only.',
  premise:
    'You wake in a dorm bed with a blank [Class Codex] and a schedule that writes itself. Inkbound Academy teaches magic by binding spells into living ink. Midterms can kill. House rivalries are scored on a public System board. Somewhere under the library, a sealed curriculum waits for students who ask the wrong questions.',
  lore: [
    {
      title: 'House Ledger',
      category: 'faction',
      body: 'Four houses compete for Ink Points. Sabotage is illegal — unless you are not caught. Professors look away when scores are close.',
      tags: ['academy', 'houses', 'rivalry'],
    },
    {
      title: 'Living Ink',
      category: 'mechanic',
      body: 'Spells are written, not spoken. Ink quality and handwriting affect power. Smudged glyphs misfire.',
      tags: ['magic', 'ink', 'mechanics'],
    },
    {
      title: 'The Restricted Stack',
      category: 'world',
      body: 'A basement wing of the library that rearranges itself. Students who return speak in footnotes for a day.',
      tags: ['library', 'mystery', 'forbidden'],
    },
  ],
  npcs: [
    {
      name: 'Dean Solenne',
      role: 'Head of Discipline',
      disposition: 'neutral',
      description: 'Polite, terrifying, always holding a red pen that edits reality.',
      hooks: ['Detention quest', 'Offer research credit', 'Warn about Restricted Stack'],
    },
    {
      name: 'Jori Ashquill',
      role: 'Roommate / Rival',
      disposition: 'friendly',
      description: 'Overconfident ink-mage student who wants your help cheating — ethically, of course.',
      hooks: ['Study duo', 'House challenge', 'Secret crush on the dean’s assistant'],
    },
  ],
  quests: [
    {
      title: 'Orientation Trial',
      description: 'Survive the first week’s practical exam without being expelled (or erased).',
      recommendedLevel: 1,
      objectives: ['Attend opening lecture', 'Bond your Class Codex', 'Pass the courtyard duel', 'Choose a house'],
      rewards: 'House pin, Starter Ink Set, dorm key',
    },
  ],
  items: [
    {
      name: 'Class Codex (Blank)',
      rarity: 'Uncommon',
      itemType: 'accessory',
      description: 'Bound notebook that records your skills as you earn them.',
    },
    {
      name: 'Student Ink Set',
      rarity: 'Common',
      itemType: 'consumable',
      description: 'Three vials of stable ink for basic glyphs.',
    },
  ],
});

export const hollowCore = makeBible({
  id: 'hollow-core',
  title: 'Hollow Core',
  archetype: 'dungeon_core',
  engineMode: 'litrpg',
  difficulty: 'Hardcore',
  tagline: 'You are the dungeon. Grow or be mined.',
  shortDescription:
    'Dungeon-core / monster evolution vibe: build rooms, spawn defenders, bargain with adventurers. Original.',
  licenseNote:
    'Original SynapticGM setting. Uses common “dungeon core / monster reincarnation” genre tropes — not any specific book series.',
  premise:
    'You awaken as a glowing Core crystal in a half-collapsed cave. A System menu offers [Expand], [Spawn], and [Bargain]. Adventurers will come. Guilds will try to harvest you. Other Cores nearby want your territory. Evolve rooms, choose a theme, and decide whether you are a predator, a puzzle, or a landlord.',
  lore: [
    {
      title: 'Core Hunger',
      category: 'mechanic',
      body: 'Cores feed on mana and defeated invaders. Starvation shrinks rooms. Overfeeding attracts Core Hunters.',
      tags: ['core', 'mana', 'growth'],
    },
    {
      title: 'Theme Binding',
      category: 'world',
      body: 'Choosing a theme (fungal, clockwork, frost, bone) locks aesthetic and spawn pools. Themes can be remixed at great cost.',
      tags: ['theme', 'building', 'identity'],
    },
  ],
  npcs: [
    {
      name: 'Whisper-Mite',
      role: 'First Spawn / Advisor',
      disposition: 'friendly',
      description: 'Tiny floating mite that translates System menus into sarcasm.',
      hooks: ['Tutorial spawn', 'Scout tunnels', 'Warn of adventurer party'],
    },
    {
      name: 'Captain Bren Holtz',
      role: 'Guild Scout',
      disposition: 'hostile',
      description: 'Professional Core hunter who prefers capture over destruction — for the bounty.',
      hooks: ['First raid', 'Negotiation for tribute', 'Rival Core tip'],
    },
  ],
  quests: [
    {
      title: 'Claim the Hollow',
      description: 'Secure three rooms and survive your first raid.',
      recommendedLevel: 1,
      objectives: ['Expand to 3 rooms', 'Spawn a defender', 'Survive or bargain with scouts'],
      rewards: 'Theme Unlock token, Core Essence x3',
    },
  ],
  items: [
    {
      name: 'Core Shard',
      rarity: 'Rare',
      itemType: 'accessory',
      description: 'Fragment of your own crystal. Used to expand rooms or bribe other Cores.',
    },
  ],
});

export const millstoneRoad = makeBible({
  id: 'millstone-road',
  title: 'Millstone Road',
  archetype: 'caravan_escort',
  engineMode: 'dnd',
  difficulty: 'Easy',
  tagline: 'Wagons, weather, and whatever waits past the next hill.',
  shortDescription:
    'Classic 5e-friendly caravan start: escort, tavern rumors, low-level threats. Original — not a published FR module.',
  licenseNote:
    'Original SynapticGM adventure spine. Compatible with SRD 5.1 / 5.2 fantasy rules (CC-BY attribution to WotC for SRD rules content where used). Not affiliated with Wizards of the Coast settings (Forgotten Realms, etc.).',
  premise:
    'Merchant Lessa hired you to guard three wagons to Millstone Ford. The road is muddy, the cargo is sealed, and the last escort vanished near the old mill. Bandits are the easy rumor. The harder rumor is that the mill’s wheel turns when there is no water.',
  lore: [
    {
      title: 'The Sealed Crates',
      category: 'history',
      body: 'Crates marked with a faded crest. Lessa forbids opening them. At night they tick softly.',
      tags: ['cargo', 'mystery', 'caravan'],
    },
    {
      title: 'Millstone Ford',
      category: 'world',
      body: 'A river town famous for flour and gossip. The ford floods after storms; ferries charge double.',
      tags: ['town', 'travel', 'setting'],
    },
  ],
  npcs: [
    {
      name: 'Lessa Quill',
      role: 'Merchant Patron',
      disposition: 'neutral',
      description: 'Practical trader who pays on delivery and lies by omission.',
      hooks: ['Raise pay for danger', 'Reveal cargo if trust rises', 'Flee if combat turns'],
    },
    {
      name: 'Old Tam',
      role: 'Road Guide',
      disposition: 'friendly',
      description: 'Retired scout who knows every shortcut — and which ones are cursed.',
      hooks: ['Offer alternate route', 'Warn about mill', 'Share campfire lore'],
    },
  ],
  quests: [
    {
      title: 'Deliver to Millstone Ford',
      description: 'Get the caravan to town with cargo intact.',
      recommendedLevel: 1,
      objectives: ['Survive the road', 'Investigate the old mill (optional)', 'Deliver crates', 'Collect pay'],
      rewards: '50 gp, Merchant Letter of Credit, optional cargo secret',
    },
  ],
  items: [
    {
      name: 'Travel Rations (3 days)',
      rarity: 'Common',
      itemType: 'consumable',
      description: 'Hardtack, dried fruit, and questionable jerky.',
    },
    {
      name: 'Caravan Contract',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Signed pay voucher. Worthless if the cargo is lost.',
    },
  ],
});

export const brokenCrownKeep = makeBible({
  id: 'broken-crown-keep',
  title: 'Broken Crown Keep',
  archetype: 'cursed_manor',
  engineMode: 'dnd',
  difficulty: 'Standard',
  tagline: 'A ruined keep. Two warbands. One prisoner. Your call.',
  shortDescription:
    'Dungeon-site keep crawl with rival factions below. Original OSR-style site — not a licensed module text.',
  licenseNote:
    'Original SynapticGM site. Tonally akin to free OSR “keep dungeon” adventures, but all text and names are original. SRD-compatible monsters/rules OK with CC-BY attribution.',
  premise:
    'The northern keep of Ernost fell years ago. Now orc and troll warbands fight in the cellars for a dwarf hostage who knows a vault cipher. Clans offer silver for a rescue. The keep’s upper floors are quiet. The undercroft is not.',
  lore: [
    {
      title: 'Two Warbands',
      category: 'faction',
      body: 'Orcs hold the west tunnels; trolls hold the flooded east. Neither will tolerate the other — or you — unless bribed.',
      tags: ['factions', 'keep', 'politics'],
    },
    {
      title: 'The Cipher Dwarf',
      category: 'history',
      body: 'Prisoner Durik claims the vault under the throne room needs a sung passphrase. Both warbands want him alive.',
      tags: ['hostage', 'vault', 'dwarf'],
    },
  ],
  npcs: [
    {
      name: 'Durik Stonevow',
      role: 'Hostage Engineer',
      disposition: 'friendly',
      description: 'Exhausted dwarf who will trade vault secrets for escape.',
      hooks: ['Rescue', 'Teach passphrase', 'Warn about collapsing floor'],
    },
    {
      name: 'Grash the Splitter',
      role: 'Orc War-Chief',
      disposition: 'hostile',
      description: 'Respects strength and clever deals; hates trolls more than adventurers.',
      hooks: ['Duel challenge', 'Temporary truce', 'Betray trolls together'],
    },
  ],
  quests: [
    {
      title: 'Under the Keep',
      description: 'Enter the undercroft, free Durik, and escape — or claim the vault.',
      recommendedLevel: 2,
      objectives: ['Enter keep', 'Navigate warband conflict', 'Reach Durik', 'Escape or open vault'],
      rewards: 'Clan silver, vault loot (optional), Durik as ally',
    },
  ],
  items: [
    {
      name: 'Keep Sketch Map',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Rough charcoal map of upper floors; undercroft is blank.',
    },
  ],
});

export const verdantBlight = makeBible({
  id: 'verdant-blight',
  title: 'Verdant Blight',
  archetype: 'patrons_quest',
  engineMode: 'dnd',
  difficulty: 'Standard',
  tagline: 'A village sickens. The forest is too green.',
  shortDescription:
    'Investigation one-shot vibe: clues, moral choices, optional combat. Original mystery — not a copied itch.io PDF.',
  licenseNote:
    'Original SynapticGM mystery. Inspired by the *structure* of free investigation one-shots (clues, NPCs, multiple endings), with wholly original plot and names. Do not paste third-party adventure text.',
  premise:
    'Baroness Mirelle pays you to learn why crops blacken overnight in Whitvale while the forest grows violently lush. Children draw the same horned figure. The herbalist is missing. Peaceful, political, and bloody endings are all possible.',
  lore: [
    {
      title: 'The Green Ring',
      category: 'world',
      body: 'A perfect ring of overgrowth surrounds Whitvale. Animals avoid it. Compass needles twitch inside.',
      tags: ['blight', 'forest', 'anomaly'],
    },
    {
      title: 'Three Clue Paths',
      category: 'mechanic',
      body: 'Evidence exists in the mill, the chapel crypt, and the missing herbalist’s hut. Any two paths can reveal the truth.',
      tags: ['investigation', 'clues'],
    },
  ],
  npcs: [
    {
      name: 'Baroness Mirelle',
      role: 'Patron',
      disposition: 'neutral',
      description: 'Wants Whitvale productive again. Will bury inconvenient truths.',
      hooks: ['Raise reward', 'Demand silence', 'Political ending'],
    },
    {
      name: 'Sister Cala',
      role: 'Chapel Keeper',
      disposition: 'friendly',
      description: 'Believes the blight is a curse for an old land bargain.',
      hooks: ['Share chapel records', 'Bless weapons', 'Refuse violence'],
    },
  ],
  quests: [
    {
      title: 'Root of the Matter',
      description: 'Discover the blight’s source and choose how Whitvale ends the story.',
      recommendedLevel: 3,
      objectives: ['Interview villagers', 'Gather two clue paths', 'Confront the source', 'Choose ending'],
      rewards: 'Patron purse, Whitvale favor or enmity, optional rare herb',
    },
  ],
  items: [
    {
      name: 'Letter of Inquiry',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Baroness seal — opens doors and mouths in Whitvale.',
    },
  ],
});

export const stillrootVeil = makeBible({
  id: 'stillroot-veil',
  title: 'Stillroot Veil',
  archetype: 'wilderness_expedition',
  engineMode: 'dnd',
  difficulty: 'Hardcore',
  tagline: 'A cozy hamlet. Warm beds. Wrong shadows.',
  shortDescription:
    'Horror-tinged village drop-in: kindness on the surface, rot underneath. Original — not a reprint of any CC0 zine text.',
  licenseNote:
    'Original SynapticGM horror-hamlet. Tonally similar to free “cozy village hides horror” adventures; all prose and names are original. Do not copy third-party PDFs.',
  premise:
    'Stillroot offers free lodging to travelers. The inn is warm. The people are kind. Bodies go missing from the graveyard, and shadows stretch the wrong way at noon. Something in the peat uses the dead as gloves.',
  lore: [
    {
      title: 'Peat Beneath',
      category: 'world',
      body: 'The hamlet sits on deep peat. Digging reveals bone lattice and black fibrous strands that twitch when sung to.',
      tags: ['horror', 'peat', 'undead'],
    },
    {
      title: 'Hospitality Law',
      category: 'culture',
      body: 'Guests who refuse lodging insult the village. Guests who stay three nights start dreaming of “mother root.”',
      tags: ['customs', 'danger'],
    },
  ],
  npcs: [
    {
      name: 'Innkeep Mara',
      role: 'Host',
      disposition: 'friendly',
      description: 'Genuine smile. Offers stew. Never blinks quite enough.',
      hooks: ['Free room', 'Ask about graves', 'Nighttime knock'],
    },
    {
      name: 'Child Fenn',
      role: 'Witness',
      disposition: 'friendly',
      description: 'Draws pictures of people with too many arms made of shadow.',
      hooks: ['Show drawings', 'Lead to peat dig', 'Beg you not to dig'],
    },
  ],
  quests: [
    {
      title: 'What Wears the Dead',
      description: 'Uncover Stillroot’s secret before you become part of it.',
      recommendedLevel: 2,
      objectives: ['Accept lodging or refuse', 'Investigate graveyard', 'Find the peat heart', 'End or escape the veil'],
      rewards: 'Survival, peat-ward charm, optional cursed relic',
    },
  ],
  items: [
    {
      name: 'Lantern of Stillroot',
      rarity: 'Uncommon',
      itemType: 'accessory',
      description: 'Burns peat oil. Shadows cast by it point toward the nearest moving corpse.',
    },
  ],
});

export const gatebreakWard = makeBible({
  id: 'gatebreak-ward',
  title: 'Gatebreak Ward',
  archetype: 'system_apocalypse',
  engineMode: 'litrpg',
  difficulty: 'Hardcore',
  tagline: 'The city has gates. The gates have bosses. Your district is next.',
  shortDescription:
    'Urban System apocalypse: district defense, ranked gates, hunter guilds. Original world.',
  licenseNote:
    'Original SynapticGM setting. Uses common “gate / dungeon break / hunter” LitRPG tropes — not Solo Leveling or any named series.',
  premise:
    'Blue gates bloom over districts like bruises. When a gate breaks, monsters spill until a raid clears the boss. You live in Ward 9, under-equipped and over-ranked by richer wards. The System pays for clears. Evacuation is a rumor for people with cars that still work.',
  lore: [
    {
      title: 'Gate Ranks',
      category: 'mechanic',
      body: 'Gates rank E to S. Ward 9 mostly sees E–D. An unscheduled B-gate opened yesterday under the subway.',
      tags: ['gates', 'ranks', 'city'],
    },
    {
      title: 'Hunter Licenses',
      category: 'faction',
      body: 'Licensed hunters take cuts of gate loot. Unlicensed clears are illegal — and how poor wards survive.',
      tags: ['hunters', 'law', 'economy'],
    },
  ],
  npcs: [
    {
      name: 'Sergeant Rill',
      role: 'Ward Militia',
      disposition: 'friendly',
      description: 'Tired officer who ignores unlicensed clears if you protect civilians.',
      hooks: ['Defend shelter', 'Tip about subway gate', 'Offer temporary license'],
    },
    {
      name: 'Vex Harlan',
      role: 'Guild Recruiter',
      disposition: 'ambiguous',
      description: 'Smiles like a contract. Wants your talent for a cut of your future.',
      hooks: ['Guild offer', 'Sabotage rival', 'Reveal B-gate intel for a price'],
    },
  ],
  quests: [
    {
      title: 'Hold Ward 9',
      description: 'Survive the night and clear or delay the subway gate break.',
      recommendedLevel: 1,
      objectives: ['Shelter civilians', 'Scout subway gate', 'Clear or seal', 'Report to Rill'],
      rewards: 'Ward favor, scrap gear, System coins',
    },
  ],
  items: [
    {
      name: 'Ward 9 Armband',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Marks you as local militia-adjacent. Opens shelter doors.',
    },
  ],
});

export const blankCanvas = makeBible({
  id: 'blank-canvas',
  title: 'Blank Canvas (Custom World)',
  archetype: 'custom_world',
  engineMode: 'litrpg',
  difficulty: 'Standard',
  tagline: 'You define the rules. The AI must obey your bible.',
  shortDescription:
    'Empty rails for custom worldbuilding: add your own lore cards, quests, and premises in Codex / GM Library.',
  licenseNote:
    'Starter shell only. You own what you write. Do not paste copyrighted novels or closed campaign settings into the bible.',
  premise:
    'This campaign begins as a nearly empty World State Ledger. Establish location, tone, factions, and rules in your Codex. The AI must treat your cards as ground truth and must not invent major setting facts without your confirmation.',
  lore: [
    {
      title: 'Author’s Authority',
      category: 'mechanic',
      body: 'Only Codex / lore cards and quest sheets are canon until the player confirms new facts. The AI proposes; the ledger commits.',
      tags: ['custom', 'authority', 'ledger'],
    },
  ],
  npcs: [],
  quests: [
    {
      title: 'Define the World',
      description: 'Add at least three lore cards (place, faction, rule) before major plot jumps.',
      recommendedLevel: 1,
      objectives: ['Name your starting location', 'Add one faction card', 'Add one hard rule card'],
      rewards: 'Campaign identity locked in',
    },
  ],
  items: [],
});

export const blankCanvasDnd = makeBible({
  id: 'blank-canvas-dnd',
  title: 'Blank Canvas (5e Custom)',
  archetype: 'ai_custom',
  engineMode: 'dnd',
  difficulty: 'Standard',
  tagline: 'Build your own 5e-compatible world on open rails.',
  shortDescription:
    'Empty 5e-friendly custom shell. Use SRD rules; avoid Forgotten Realms and other closed settings.',
  licenseNote:
    'Shell only. Prefer SRD 5.1/5.2 (CC-BY). Do not import closed WotC settings or novel text.',
  premise:
    'A blank 5e-compatible campaign. Set your region, pantheon (original), and factions via Codex. The AI follows SRD-safe fantasy language and your sheets only.',
  lore: [
    {
      title: 'SRD-Safe Play',
      category: 'mechanic',
      body: 'Use open fantasy rules language. Do not reference trademarked setting names. Player Codex overrides improvisation.',
      tags: ['srd', 'custom', 'rules'],
    },
  ],
  npcs: [],
  quests: [
    {
      title: 'Found the Campaign',
      description: 'Write the starting town and the first threat into your Codex.',
      recommendedLevel: 1,
      objectives: ['Name starting settlement', 'Define first threat', 'Add one patron or rival NPC card'],
      rewards: 'Custom campaign ready',
    },
  ],
  items: [],
});

/**
 * Story RPG premades — fiction-first original worlds.
 * Prefer `custom_world` (or a matching RPG opening) so archetype rules don't inject LitRPG/cyber HUD tone.
 */
export const saltRoadHeist = makeBible({
  id: 'salt-road-heist',
  title: 'Salt Road Heist',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Standard',
  tagline: 'One crew. One score. Everything after is consequences.',
  shortDescription:
    'Heist story RPG: planning, betrayal, and fallout. Choices and heat drive outcomes — no dice HUD.',
  licenseNote: 'Original SynapticGM story. Generic heist pacing only; no closed IP text.',
  premise:
    'You and a small crew plan to steal a salt-tax ledger from the Consul’s caravan before it reaches the coast. Allies want cuts. Rivals want your names. The story tracks trust, heat, and what you owe after the score.',
  lore: [
    {
      title: 'The Score',
      category: 'world',
      body: 'The ledger proves illegal tariffs. Whoever holds it can blackmail the Consul or sell it to rebels.',
      tags: ['heist', 'politics', 'crew'],
    },
    {
      title: 'Heat',
      category: 'mechanic',
      body: 'Loud solutions raise Heat. High Heat means checkpoints, informants, and fewer safe houses.',
      tags: ['heat', 'consequences'],
    },
  ],
  npcs: [
    {
      name: 'Vessa',
      role: 'Crew Fixer',
      disposition: 'friendly',
      description: 'Knows every bribe price on the Salt Road. Will sell you out if Heat gets her family hurt.',
      hooks: ['Offer a safehouse', 'Demand a bigger cut', 'Warn about a rival crew'],
    },
  ],
  quests: [
    {
      title: 'Case the Caravan',
      description: 'Learn the route, guards, and weak point before the score.',
      recommendedLevel: 1,
      objectives: ['Scout the caravan', 'Pick an approach', 'Commit to the heist night'],
      rewards: 'Plan locked; Heat starts at Low',
    },
  ],
  items: [
    {
      name: 'Crew Token',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Marks you as part of Vessa’s crew for one night.',
    },
  ],
});

export const glassHarborLetters = makeBible({
  id: 'glass-harbor-letters',
  title: 'Glass Harbor Letters',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Easy',
  tagline: 'A port city of secrets, debts, and unfinished letters.',
  shortDescription:
    'Harbor mystery / relationships. Clues live in people and favors, not loot tables.',
  licenseNote: 'Original SynapticGM narrative setting. No closed novel or franchise content.',
  startingLocation: 'the docks at Glass Harbor',
  startingContainer: { id: 'gh-coat', name: 'Coat pockets', capacity: 12 },
  premise:
    'You arrive in Glass Harbor with a sealed letter addressed to someone who died last week. Every pier has a rumor. Every tavern has a debt. The story follows who you trust and which truths you publish.',
  lore: [
    {
      title: 'The Letter',
      category: 'history',
      body: 'The seal belongs to a dissolved shipping house. Opening it early may save a life — or start a feud.',
      tags: ['mystery', 'harbor', 'letter'],
    },
  ],
  npcs: [
    {
      name: 'Harbor Clerk Nils',
      role: 'Customs Clerk',
      disposition: 'neutral',
      description: 'Nervous, helpful, hiding something in the manifests.',
      hooks: ['Help find the addressee', 'Ask you to lose a form', 'Introduce a smuggler'],
    },
  ],
  quests: [
    {
      title: 'Deliver or Decide',
      description: 'Find who should receive the letter — or decide the harbor deserves the truth.',
      recommendedLevel: 1,
      objectives: ['Ask around the docks', 'Choose an ally', 'Resolve the letter'],
      rewards: 'A lasting ally or enemy in Glass Harbor',
    },
  ],
  items: [
    {
      name: 'Sealed Letter',
      rarity: 'Uncommon',
      itemType: 'quest',
      description: 'Heavy parchment. Breaking the seal is a story choice.',
    },
  ],
});

export const embercourtOath = makeBible({
  id: 'embercourt-oath',
  title: 'Embercourt Oath',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Standard',
  tagline: 'Court intrigue where every promise is a weapon.',
  shortDescription:
    'Political intrigue: factions, favors, and oaths. Reputation matters more than HP.',
  licenseNote: 'Original SynapticGM court drama. Not based on any published campaign setting.',
  premise:
    'You are called to Embercourt to witness a succession. Three houses want your oath. Breaking an oath costs standing; keeping the wrong oath costs lives. The AI tracks favors and reputations as story facts.',
  lore: [
    {
      title: 'Three Houses',
      category: 'faction',
      body: 'Ashveil (old blood), Cinderlane (merchants), and the Quiet Cloister (faith). None can win alone.',
      tags: ['court', 'factions', 'oaths'],
    },
  ],
  npcs: [
    {
      name: 'Lady Sereth Ashveil',
      role: 'Heir Apparent',
      disposition: 'ambiguous',
      description: 'Graceful, sharp, offers protection for loyalty.',
      hooks: ['Demand an oath', 'Offer a secret', 'Test your discretion'],
    },
  ],
  quests: [
    {
      title: 'First Audience',
      description: 'Survive opening court without binding yourself too early.',
      recommendedLevel: 1,
      objectives: ['Meet two houses', 'Avoid an early irreversible oath', 'Learn one scandal'],
      rewards: 'Court standing: Contender',
    },
  ],
  items: [
    {
      name: 'Invitation Medallion',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Gets you past Embercourt gates. Does not get you respect.',
    },
  ],
});

export const rainglassCase = makeBible({
  id: 'rainglass-case',
  title: 'Rainglass Case',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Standard',
  tagline: 'Noir investigation under neon and rain.',
  shortDescription:
    'Mystery / noir: interview witnesses, weigh lies, choose who the truth protects.',
  licenseNote: 'Original SynapticGM noir. No franchise detectives or closed settings.',
  premise:
    'A mid-tier fixer is dead in Rainglass Ward. You inherit their unfinished case file and a client who will not give a name. Every interview changes who trusts you. Comic-ready: rain, alleys, interrogation close-ups.',
  lore: [
    {
      title: 'Case File 7',
      category: 'history',
      body: 'Three names circled. One alibi that does not hold. A photo with the face scratched out.',
      tags: ['noir', 'mystery', 'investigation'],
    },
  ],
  npcs: [
    {
      name: 'Inspector Quill',
      role: 'Tired Detective',
      disposition: 'ambiguous',
      description: 'Wants the case closed quietly. May help or bury you depending on what you find.',
      hooks: ['Share a lead', 'Warn you off a suspect', 'Offer a trade for silence'],
    },
  ],
  quests: [
    {
      title: 'First Interview',
      description: 'Talk to someone who knew the fixer — and decide what you write down.',
      recommendedLevel: 1,
      objectives: ['Visit the crime scene', 'Interview one witness', 'Update the case board'],
      rewards: 'First real lead unlocked',
    },
  ],
  items: [
    {
      name: 'Case File Folder',
      rarity: 'Common',
      itemType: 'quest',
      description: 'Damp cardboard and half-truths. Add notes as you go.',
    },
  ],
});

export const staticHouse = makeBible({
  id: 'static-house',
  title: 'Static House',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Hardcore',
  tagline: 'Isolation horror. The signal is wrong.',
  shortDescription:
    'Survival horror in a remote station: dwindling resources, unreliable senses, soft-then-hard dread.',
  licenseNote: 'Original SynapticGM horror. No licensed monsters or film scripts.',
  premise:
    'You wake in Relay Station Nine during a blackout. The radio spatters names that should not know you. Doors that were locked open. Panic burns supplies faster than monsters. Panel-friendly: dark corridors, flashlight cones, sudden silhouettes.',
  lore: [
    {
      title: 'The Blackout',
      category: 'world',
      body: 'Power fails in cycles. Each cycle, something in the station rearranges.',
      tags: ['horror', 'isolation', 'survival'],
    },
  ],
  npcs: [
    {
      name: 'Technician Mora',
      role: 'Night Shift Tech',
      disposition: 'friendly',
      description: 'Swears the generator is fine. Keeps counting the same three tools.',
      hooks: ['Share a ration', 'Beg you not to open Sublevel B', 'Vanish between scenes'],
    },
  ],
  quests: [
    {
      title: 'Restore Comms',
      description: 'Get a clean signal out — or decide silence is safer.',
      recommendedLevel: 1,
      objectives: ['Find a working radio', 'Map one safe route', 'Choose who to trust'],
      rewards: 'Comms restored or permanently dark',
    },
  ],
  items: [
    {
      name: 'Crackling Handset',
      rarity: 'Uncommon',
      itemType: 'accessory',
      description: 'Sometimes answers before you speak.',
    },
  ],
});

export const driftwakeCrew = makeBible({
  id: 'driftwake-crew',
  title: 'Driftwake Crew',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Standard',
  tagline: 'A small ship, a big debt, and stars that do not care.',
  shortDescription:
    'Space-opera crew drama: jobs, mutiny risk, and loyalty under pressure.',
  licenseNote: 'Original SynapticGM space story. No franchise ships, species, or wars.',
  premise:
    'You hold a minority share of the freighter Driftwake and a majority of its debt. The crew wants a clean job. The cargo wants something else. Episodes write well as panels: bridge arguments, airlock standoffs, planetfall markets.',
  lore: [
    {
      title: 'The Debt Mark',
      category: 'faction',
      body: 'The ledger-house owns your jump coordinates until the mark is cleared.',
      tags: ['space', 'crew', 'debt'],
    },
  ],
  npcs: [
    {
      name: 'Captain Rhee',
      role: 'Ship Captain',
      disposition: 'neutral',
      description: 'Fair until the ship is threatened. Keeps a second set of books.',
      hooks: ['Offer a side contract', 'Call a crew vote', 'Confide a past mutiny'],
    },
  ],
  quests: [
    {
      title: 'First Contract',
      description: 'Take a haul that pays — without asking too many questions.',
      recommendedLevel: 1,
      objectives: ['Meet the broker', 'Inspect the cargo', 'Jump or refuse'],
      rewards: 'Ship standing shifts',
    },
  ],
  items: [
    {
      name: 'Share Chip',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Proves you own a sliver of Driftwake — and its trouble.',
    },
  ],
});

export const ashlineConvoy = makeBible({
  id: 'ashline-convoy',
  title: 'Ashline Convoy',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Hardcore',
  tagline: 'Road story after the sky burned.',
  shortDescription:
    'Post-apocalypse travelogue: fuel, trust, and which settlements you save.',
  licenseNote: 'Original SynapticGM wasteland. No licensed franchises or game IPs.',
  premise:
    'The Ashline is a cracked highway between two living towns. Your convoy carries medicine, secrets, and one person everyone wants. Miles matter. Relationships matter more when water runs out.',
  lore: [
    {
      title: 'The Two Towns',
      category: 'world',
      body: 'North Haven trades scrap. South Well trades clean water. Neither trusts strangers with guns.',
      tags: ['postapoc', 'road', 'convoy'],
    },
  ],
  npcs: [
    {
      name: 'Scout Juno',
      role: 'Convoy Scout',
      disposition: 'friendly',
      description: 'Maps ambushes by listening to birds that should be gone.',
      hooks: ['Spot a shortcut', 'Argue for a detour', 'Reveal a passenger’s past'],
    },
  ],
  quests: [
    {
      title: 'First Mile',
      description: 'Leave the staging yard without losing a vehicle — or a person.',
      recommendedLevel: 1,
      objectives: ['Assign watch', 'Choose a route', 'Survive the first night'],
      rewards: 'Convoy cohesion established',
    },
  ],
  items: [
    {
      name: 'Route Slate',
      rarity: 'Common',
      itemType: 'quest',
      description: 'Chalked mile markers and rumors. Update it or die lost.',
    },
  ],
});

export const twinLanterns = makeBible({
  id: 'twin-lanterns',
  title: 'Twin Lanterns',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Easy',
  tagline: 'Romance with stakes — who you love changes the city.',
  shortDescription:
    'Relationship drama: rival festivals, soft conflict, hard choices of allegiance.',
  licenseNote: 'Original SynapticGM romance-drama. No closed novel characters or settings.',
  premise:
    'Festival week in Lanternreach. Two houses light rival lanterns for the same river blessing. You are caught between affection, family duty, and a secret that could cancel the festival — or start a feud.',
  lore: [
    {
      title: 'The Blessing',
      category: 'culture',
      body: 'Only one lantern line may float at midnight. Tradition says the river chooses. Politics says otherwise.',
      tags: ['romance', 'festival', 'rivalry'],
    },
  ],
  npcs: [
    {
      name: 'Ashin of Redwick',
      role: 'Rival Heir',
      disposition: 'ambiguous',
      description: 'Charming, sincere, and under orders to win you over — or ruin you.',
      hooks: ['Invite a private walk', 'Ask for a secret', 'Offer to share the river'],
    },
  ],
  quests: [
    {
      title: 'First Favor',
      description: 'Help one house prepare without declaring your heart.',
      recommendedLevel: 1,
      objectives: ['Attend a rehearsal', 'Carry a message', 'Choose a small kindness'],
      rewards: 'A bond deepens; another cools',
    },
  ],
  items: [
    {
      name: 'Unlit Lantern',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Whose colors you paint it with will be noticed.',
    },
  ],
});

export const redmesaClaim = makeBible({
  id: 'redmesa-claim',
  title: 'Redmesa Claim',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Standard',
  tagline: 'Frontier justice, scarce water, and a claim worth killing for.',
  shortDescription:
    'Western / frontier: land disputes, duels of reputation, dust and dusk panels.',
  licenseNote: 'Original SynapticGM western. No licensed film or game settings.',
  premise:
    'You hold a half-legal claim on Redmesa’s only spring. A rail company, a rancher, and a buried town all want it. Stories resolve through reputation, alliances, and who draws first — not hit points.',
  lore: [
    {
      title: 'The Spring',
      category: 'world',
      body: 'Without the spring, Redmesa dies by autumn. With it, someone gets rich.',
      tags: ['western', 'frontier', 'claim'],
    },
  ],
  npcs: [
    {
      name: 'Marshal Kett',
      role: 'Town Marshal',
      disposition: 'neutral',
      description: 'Keeps a thin peace. Will arrest anyone who makes her paperwork longer.',
      hooks: ['Offer a temporary truce', 'Ask for a favor', 'Warn about hired guns'],
    },
  ],
  quests: [
    {
      title: 'Post the Claim',
      description: 'Make the claim public — and survive the first challenge.',
      recommendedLevel: 1,
      objectives: ['File at the marshal office', 'Meet one rival', 'Secure the spring overnight'],
      rewards: 'Claim recognized (contested)',
    },
  ],
  items: [
    {
      name: 'Claim Deed',
      rarity: 'Uncommon',
      itemType: 'quest',
      description: 'Ink still wet. Half the town says it is forged.',
    },
  ],
});

export const capeDistrictVigil = makeBible({
  id: 'cape-district-vigil',
  title: 'Cape District Vigil',
  archetype: 'cyberpunk',
  engineMode: 'rpg',
  difficulty: 'Standard',
  tagline: 'Street-level powers. City-level consequences.',
  shortDescription:
    'Original superhero street drama: masks, media heat, and who you save first.',
  licenseNote:
    'Original SynapticGM heroes. No Marvel/DC/or other publisher characters, teams, or cities.',
  premise:
    'Cape District is where powered people hide in plain sight. You took a vigil last night and the feeds already have a blurry clip. Power use draws Heat. Helping the wrong person makes you a villain on morning news. Comic panels love masks, rooftops, and headlines.',
  lore: [
    {
      title: 'The Unlicensed',
      category: 'faction',
      body: 'City law bans public power use without a License Band. Most bands never get approved.',
      tags: ['superhero', 'street', 'heat'],
    },
  ],
  npcs: [
    {
      name: 'Beacon',
      role: 'Rival Vigil',
      disposition: 'ambiguous',
      description: 'Brighter, louder, sponsored. Wants you off “their” rooftops.',
      hooks: ['Challenge your methods', 'Offer a team-up', 'Leak your face'],
    },
  ],
  quests: [
    {
      title: 'First Save',
      description: 'Stop a street crime without becoming the story.',
      recommendedLevel: 1,
      objectives: ['Respond to a distress call', 'Choose force or stealth', 'Escape the cameras'],
      rewards: 'Street reputation: Noticed',
    },
  ],
  items: [
    {
      name: 'Mask Scarf',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Thin anonymity. Enough for one blurry photo.',
    },
  ],
});

export const wayfarersMap = makeBible({
  id: 'wayfarers-map',
  title: "Wayfarers' Map",
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Easy',
  tagline: 'Found family on the long road between wonders.',
  shortDescription:
    'Travelogue adventure: companions, soft conflict, places that change you.',
  licenseNote: 'Original SynapticGM travel story. No closed novel routes or IPs.',
  premise:
    'A torn map lists seven stops and one blank space. You travel with a mismatched band who become family — if you let them. Each stop is a short episode; the blank space is the ending you earn.',
  lore: [
    {
      title: 'Seven Stops',
      category: 'world',
      body: 'Market town, singing bridge, salt flats, orchard ruin, cliff monastery, carnival barge, and the blank.',
      tags: ['travelogue', 'found-family', 'journey'],
    },
  ],
  npcs: [
    {
      name: 'Pip the Cartographer',
      role: 'Map Keeper',
      disposition: 'friendly',
      description: 'Draws what you refuse to say. Afraid of the blank space.',
      hooks: ['Add a new stop', 'Argue for rest', 'Reveal a companion’s secret kindly'],
    },
  ],
  quests: [
    {
      title: 'Leave Together',
      description: 'Depart the starting inn with at least one companion who chose you.',
      recommendedLevel: 1,
      objectives: ['Meet the band', 'Pick a first stop', 'Share a meal before the road'],
      rewards: 'Traveling party formed',
    },
  ],
  items: [
    {
      name: 'Torn Map',
      rarity: 'Uncommon',
      itemType: 'quest',
      description: 'Edges fray when you lie about where you want to go.',
    },
  ],
});

export const hearthwickTeas = makeBible({
  id: 'hearthwick-teas',
  title: 'Hearthwick Teas',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Easy',
  tagline: 'Cozy mystery in a shop that hears everything.',
  shortDescription:
    'Slice-of-life cozy mystery: soft stakes, warm panels, puzzles in gossip.',
  licenseNote: 'Original SynapticGM cozy mystery. No licensed detective IPs.',
  premise:
    'You inherit a tea shop in Hearthwick. Customers leave secrets in saucers. A missing delivery and a kind lie start a gentle mystery that still matters to the town.',
  lore: [
    {
      title: 'The Shop Bell',
      category: 'culture',
      body: 'Locals believe the bell only rings for honest customers. Lately it rings for everyone.',
      tags: ['cozy', 'mystery', 'slice-of-life'],
    },
  ],
  npcs: [
    {
      name: 'Mrs. Pell',
      role: 'Regular Customer',
      disposition: 'friendly',
      description: 'Orders the same blend. Knows every birthday and every scandal.',
      hooks: ['Drop a rumor', 'Ask you to mediate a quarrel', 'Gift a clue wrapped as gossip'],
    },
  ],
  quests: [
    {
      title: 'Open for Business',
      description: 'Serve the morning rush and notice what does not belong.',
      recommendedLevel: 1,
      objectives: ['Brew for three regulars', 'Spot the odd order', 'Ask one careful question'],
      rewards: 'First cozy lead',
    },
  ],
  items: [
    {
      name: 'Shop Key',
      rarity: 'Common',
      itemType: 'accessory',
      description: 'Opens the front door. Not the cellar — yet.',
    },
  ],
});

export const blankCanvasRpg = makeBible({
  id: 'blank-canvas-rpg',
  title: 'Blank Canvas (Story RPG)',
  archetype: 'custom_world',
  engineMode: 'rpg',
  difficulty: 'Standard',
  tagline: 'Fiction-first custom world — you write the people and stakes.',
  shortDescription:
    'Empty story-RPG shell. No system HUD. Build lore cards; the AI follows your canon.',
  licenseNote: 'Shell only. Do not paste copyrighted novels or closed settings.',
  premise:
    'A blank narrative campaign. Define tone, cast, and first conflict in your Codex. The AI writes prose consequences without inventing dice math or LitRPG panels.',
  lore: [
    {
      title: 'Story Authority',
      category: 'mechanic',
      body: 'Codex cards are canon. Soft conflicts resolve through fiction. No XP tickers.',
      tags: ['custom', 'story', 'canon'],
    },
  ],
  npcs: [],
  quests: [
    {
      title: 'Name the Stakes',
      description: 'Write who matters and what they want before the plot jumps.',
      recommendedLevel: 1,
      objectives: ['Add a place card', 'Add two NPC cards', 'State the opening conflict'],
      rewards: 'Story rails locked',
    },
  ],
  items: [],
});
