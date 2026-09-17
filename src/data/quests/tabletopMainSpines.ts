import type { StarterQuestSeed } from '@/game/questPlay';

export interface TabletopMatchCtx {
  bibleId?: string | null;
  hookBlob?: string;
  seed?: string;
  location?: string;
}

/**
 * Tabletop (engineMode dnd) main-quest spines (2026-09-17e). Gemini Pro web
 * pack. Journal / spoken copy only — no new FSM, XP, or unequip locks.
 * Skip blank-canvas-dnd. Unknown opening family keeps the old starter.
 */

export type TabletopSpineBibleId =
  | 'cursed-keep'
  | 'millstone-road'
  | 'broken-crown-keep'
  | 'verdant-blight'
  | 'stillroot-veil'
  | 'shattered-coast';

export type TabletopFamilyTag =
  | 'wellMidnight'
  | 'barredOak'
  | 'greyhollowInn'
  | 'churchyard'
  | 'roadsideTavern'
  | 'hillWatch'
  | 'fordCamp'
  | 'muddyRoad'
  | 'upperFloors'
  | 'clanCamp'
  | 'chapelHole'
  | 'gatehouse'
  | 'villageMoot'
  | 'rangerStation'
  | 'blightShrine'
  | 'blightFarm'
  | 'stillrootInn'
  | 'peatCamp'
  | 'funeral'
  | 'palisade'
  | 'nightDock'
  | 'seaCaves'
  | 'greatLift'
  | 'middleMarket';

export interface TabletopMainSpine {
  bibleId: TabletopSpineBibleId;
  spineId: string;
  title: string;
  openingFamily: string;
  familyTags: TabletopFamilyTag[];
  whoWantsWhat: string;
  firstObjective: string;
  refuseOrWalkAway: string;
  mapPin: string;
  stampAlts: string[];
  threeBeats: string[];
  doNot: string;
}

const FAMILY_PATTERNS: Record<TabletopFamilyTag, RegExp> = {
  wellMidnight: /\b(greyhollow well|well at midnight|bucket rope is cut|dreamed you would come here first)\b/i,
  barredOak: /\b(oak gate of greyhollow|gate is barred|gate after dark|two militia)\b/i,
  greyhollowInn: /\b(last coach|greyhollow inn|inn book is open|leaded windows)\b/i,
  churchyard: /\b(greyhollow churchyard|opened graves|graves gape|coffins are splintered)\b/i,
  roadsideTavern: /\b(roadside tavern|take the job in a tavern)\b/i,
  hillWatch: /\b(hill watch|hired as eyes)\b/i,
  fordCamp: /\b(ford camp|far bank|lantern that is not a lantern)\b/i,
  muddyRoad: /\b(muddy road toward millstone|three wagons|last escort vanished)\b/i,
  upperFloors: /\b(quiet upper floors|upper floors are quiet)\b/i,
  clanCamp: /\b(camp outside ernost|clan tents)\b/i,
  chapelHole: /\b(collapsed chapel|chapel hole|come in through the chapel)\b/i,
  gatehouse: /\b(ernost gatehouse|gatehouse first)\b/i,
  villageMoot: /\b(village moot|moot first)\b/i,
  rangerStation: /\b(ranger station|empty station|maps with new ink)\b/i,
  blightShrine: /\b(shrine swallowed|stone saints under vine)\b/i,
  blightFarm: /\b(blighted farm|trees learned to walk|lane that was a field)\b/i,
  stillrootInn: /\b(stillroot inn|failed watch|take the next watch)\b/i,
  peatCamp: /\b(peat-cutters|peat sits up)\b/i,
  funeral: /\b(funeral that will not stay down|arrive for a burial)\b/i,
  palisade: /\b(village palisade|bar the gate at dusk|lantern might be a mistake)\b/i,
  nightDock: /\b(dock night|mariners.? dock|net that should not swim)\b/i,
  seaCaves: /\b(undercity sea-caves|smuggled in through the undercity)\b/i,
  greatLift: /\b(great lift|scribe wants your name)\b/i,
  middleMarket: /\b(middle ward market|job that is not the one you were hired)\b/i,
};

export const TABLETOP_MAIN_SPINES: TabletopMainSpine[] = [
  {
    bibleId: 'cursed-keep',
    spineId: 'ck-spine-midnight-well',
    title: 'The Tainted Waters',
    openingFamily: 'well at midnight (cut rope, Aldous dreamed you here)',
    familyTags: ['wellMidnight'],
    whoWantsWhat:
      "Father Aldous believes the fouled well water is tied to a restless spirit in the keep's ruined cistern, and he needs you to consecrate the source before sickness overtakes the village.",
    firstObjective: 'Haul up the ruined, heavy bucket to examine the black sludge and severed rope.',
    refuseOrWalkAway: "He warns that the village will die of thirst or madness by week's end.",
    mapPin: 'Midnight Well',
    stampAlts: ['villagers', 'clergy', 'afflicted'],
    threeBeats: [
      'Aldous explains his prophetic dream by the dry well.',
      'Investigate the sludge to track its trail up the hill.',
      'Paid in church silver if the water runs clear.',
    ],
    doNot: 'Do not involve missing woodcutter children or footprints in the mud.',
  },
  {
    bibleId: 'cursed-keep',
    spineId: 'ck-spine-barred-oak',
    title: 'Blood on the Timber',
    openingFamily: 'gate after dark (militia, barred oak)',
    familyTags: ['barredOak'],
    whoWantsWhat:
      'Dain Holt needs expendable outsiders to track whatever just battered against the barred oak doors and dragged a shrieking guardsman into the treeline.',
    firstObjective: 'Examine the deep gouge marks on the outside of the oak doors to determine what took the guard.',
    refuseOrWalkAway: 'Dain promises they will lock you out to face the dark alone.',
    mapPin: 'Barred Oak Gate',
    stampAlts: ['militia', 'guards', 'outsiders'],
    threeBeats: [
      'Dain demands your help at spear-point.',
      'Track the heavy blood trail past the treeline.',
      "Keep the dead guard's coin purse as your grim fee.",
    ],
    doNot: 'Do not feature opened graves or Father Aldous.',
  },
  {
    bibleId: 'cursed-keep',
    spineId: 'ck-spine-scholars-folly',
    title: 'The Lost Survey',
    openingFamily: 'Greyhollow inn / inn book / last coach',
    familyTags: ['greyhollowInn'],
    whoWantsWhat:
      "A visiting scholar named Silas Thorne needs an armed escort up to the cursed keep to recover his mentor's lost survey journals before the terrified locals burn the ruins down.",
    firstObjective: 'Review the crumbling old survey map Silas spreads across the sticky inn table.',
    refuseOrWalkAway: 'Silas says he will go alone and likely die, leaving his heavy purse unspent.',
    mapPin: 'Greyhollow Inn',
    stampAlts: ['scholars', 'travelers', 'locals'],
    threeBeats: [
      'Silas flags you down as you sign the inn book.',
      'Escort him up the steep, overgrown hill path.',
      'Receive half his gold upfront, half upon finding the journal.',
    ],
    doNot: "Do not feature a missing child or the mayor's denial.",
  },
  {
    bibleId: 'cursed-keep',
    spineId: 'ck-spine-mayor-problem',
    title: 'Quiet the Dead',
    openingFamily: 'churchyard (opened graves, Father Aldous)',
    familyTags: ['churchyard'],
    whoWantsWhat:
      'Mayor Helga Brask intercepts you at the churchyard and demands you quietly hunt down the graverobbers operating from the keep before panic completely overtakes the town.',
    firstObjective: 'Check the mud around the opened graves for heavy cart tracks leading uphill.',
    refuseOrWalkAway: 'Helga threatens to have the militia run you out of town as suspected accomplices.',
    mapPin: 'Violated Churchyard',
    stampAlts: ['townsfolk', 'mourners', 'gravediggers'],
    threeBeats: [
      'Helga pulls you aside from the open graves to whisper her offer.',
      "Follow the cart tracks toward the keep's lower bailey.",
      'Earn a bounty from the town coffers for stopping the thieves.',
    ],
    doNot: 'Do not mention the well, the sick, or the mayor denying there is a problem.',
  },
  {
    bibleId: 'millstone-road',
    spineId: 'mr-spine-dry-wheel',
    title: 'The Silent Grind',
    openingFamily: 'roadside tavern before the ford (job taken, mill wheel turns with no water)',
    familyTags: ['roadsideTavern'],
    whoWantsWhat:
      'Old Tam refuses to guide the caravan across the ford until someone investigates why the dry mill wheel is turning on its own and silencing the local wildlife.',
    firstObjective: 'Approach the dry mill and look for whatever mechanism or beast is turning the massive wooden wheel.',
    refuseOrWalkAway: 'Tam will sit at the tavern and drink until the caravan rots in place.',
    mapPin: 'Roadside Tavern',
    stampAlts: ['travelers', 'locals', 'merchants'],
    threeBeats: [
      'Tam points out the unnatural wheel turning in the dry riverbed.',
      "Breach the old mill's rotting door to stop the mechanism.",
      'Tam pays you from his own stash to keep the road clear.',
    ],
    doNot: 'Do not mention ticking crates or the missing escort.',
  },
  {
    bibleId: 'millstone-road',
    spineId: 'mr-spine-hill-watch',
    title: 'Eyes on the Ridge',
    openingFamily: 'hill watch above the caravan (hired as eyes, too few people on the road)',
    familyTags: ['hillWatch'],
    whoWantsWhat:
      'Lessa Quill hired you as high-ground lookouts, and now she frantically flags you to intercept a bandit spotter signaling from the eastern ridge.',
    firstObjective: 'Sneak up the rocky incline toward the ridge camp where the signal fire just flared.',
    refuseOrWalkAway: 'Lessa signals that your contract is void and you will be left behind without pay.',
    mapPin: 'Ridge Watch Point',
    stampAlts: ['scouts', 'mercenaries', 'outlaws'],
    threeBeats: [
      "Spot the signal fire and Lessa's frantic gestures from the hill watch.",
      'Neutralize the spotter before they can signal a full attack.',
      'Collect hazard pay when you safely rejoin the wagons at the ford.',
    ],
    doNot: 'Do not start with wagons arriving at the gate or the old mill.',
  },
  {
    bibleId: 'millstone-road',
    spineId: 'mr-spine-far-bank',
    title: 'The Swinging Lantern',
    openingFamily: 'ford camp at dusk (crates tick louder, far-bank lantern)',
    familyTags: ['fordCamp'],
    whoWantsWhat:
      'A nervous Lessa Quill demands you take a small skiff across the ford to investigate the swinging far-bank lantern before she risks moving the ticking wagons into the water.',
    firstObjective: 'Row the leaky skiff across the dark, fast-moving water toward the swinging light.',
    refuseOrWalkAway: "Lessa says they haven't paid you yet and they absolutely won't until the far bank is secure.",
    mapPin: 'Ford Camp',
    stampAlts: ['guards', 'teamsters', 'ferrymen'],
    threeBeats: [
      'Lessa points out the suspicious lantern on the far side.',
      'Cross the water and confront the shadowy lantern-bearer.',
      "Earn a cut of the caravan's profits for securing the crossing.",
    ],
    doNot: 'Do not involve the missing previous escort or the mill wheel.',
  },
  {
    bibleId: 'millstone-road',
    spineId: 'mr-spine-muddy-loss',
    title: 'Discarded Steel',
    openingFamily: 'muddy road toward Millstone Ford (three wagons, last escort vanished)',
    familyTags: ['muddyRoad'],
    whoWantsWhat:
      'Merchant Kaelen Cross needs you to find out what happened to his previous guards, whose discarded weapons litter the mud, before he moves his three wagons an inch further.',
    firstObjective: 'Inspect the dropped swords and disturbed mud for signs of a struggle or drag marks.',
    refuseOrWalkAway: 'Kaelen says he will turn the wagons around and you can walk to the ford alone.',
    mapPin: 'Muddy Road',
    stampAlts: ['drivers', 'guards', 'scavengers'],
    threeBeats: [
      'Kaelen halts the wagons at the site of the vanished escort.',
      'Follow the heavy drag marks off the muddy road into the brush.',
      "Retrieve the escort's lockbox as proof and claim their intended fee.",
    ],
    doNot: 'Do not feature Lessa Quill or the dry mill.',
  },
  {
    bibleId: 'broken-crown-keep',
    spineId: 'bc-spine-bleeding-scavenger',
    title: 'The Dropped Pack',
    openingFamily: 'quiet upper floors of Ernost Keep',
    familyTags: ['upperFloors'],
    whoWantsWhat:
      'A wounded scavenger named Jarek Finn wants you to retrieve his dropped pack from the collapsed armory before the orcs on the lower floors hear him bleeding out.',
    firstObjective: 'Quietly traverse the cracked floorboards to the ruined armory wing without snapping the wood.',
    refuseOrWalkAway: 'Jarek says he will bleed out and his map to the real vault dies with him.',
    mapPin: 'Ernost Upper Floors',
    stampAlts: ['scavengers', 'looters', 'stragglers'],
    threeBeats: [
      'Jarek whispers his request from a dusty, shadowed corner.',
      'Sneak past a troll scout sniffing around the armory.',
      'Keep the silver in the pack, but return the map to Jarek.',
    ],
    doNot: 'Do not focus on Durik or the hostage pit.',
  },
  {
    bibleId: 'broken-crown-keep',
    spineId: 'bc-spine-flooded-flank',
    title: 'Break the Dam',
    openingFamily: 'camp outside Ernost (clan tents want hostage alive)',
    familyTags: ['clanCamp'],
    whoWantsWhat:
      'Grash the Splitter demands you infiltrate the flooded east tunnels to flush out the rival trolls so his orcs can claim the dwarf hostage uncontested.',
    firstObjective: 'Locate the dry sewer grate hidden in the brush that leads into the flooded eastern section.',
    refuseOrWalkAway: 'Grash promises his archers will use you for target practice as you leave the camp.',
    mapPin: 'Clan Tents',
    stampAlts: ['clan warriors', 'outriders', 'mercenaries'],
    threeBeats: [
      'Grash outlines the brutal plan over a roasting fire.',
      'Descend into the flooded tunnels and break the makeshift troll dam.',
      "Rewarded with looted dwarf gold from the war-chief's chest.",
    ],
    doNot: 'Do not start inside the keep or involve the undercroft stair.',
  },
  {
    bibleId: 'broken-crown-keep',
    spineId: 'bc-spine-chapel-hole',
    title: 'The Dwarf in the Pit',
    openingFamily: 'collapsed chapel hole (warbands below, pigeons above)',
    familyTags: ['chapelHole'],
    whoWantsWhat:
      'Durik Stonevow shouts up through the rubble hole, promising you the vault combination if you drop a rope and haul him out before his captors return.',
    firstObjective: 'Find a secure stone pillar in the ruined chapel to tie off a heavy rope.',
    refuseOrWalkAway: 'Durik curses your cowardice as heavy, clawed footsteps approach him from below.',
    mapPin: 'Collapsed Chapel',
    stampAlts: ['explorers', 'outcasts', 'captives'],
    threeBeats: [
      "Hear Durik's plea echoing up from the dark hole.",
      'Haul him up while fending off thrown spears from the lower floor.',
      'Receive the cipher and his heavy gold signet ring.',
    ],
    doNot: 'Do not start at the gatehouse or the clan tents outside.',
  },
  {
    bibleId: 'broken-crown-keep',
    spineId: 'bc-spine-gate-distraction',
    title: 'The Loud Fools',
    openingFamily: 'Ernost gatehouse at dusk (cipher is downstairs)',
    familyTags: ['gatehouse'],
    whoWantsWhat:
      'A rogue named Elara Locke needs you to distract the warbands in the courtyard so she can slip into the undercroft and memorize the vault cipher.',
    firstObjective: 'Barricade the main gate loudly to draw the attention of the nearest orc patrols.',
    refuseOrWalkAway: "Elara shrugs and says she'll go find a louder group of fools.",
    mapPin: 'Gatehouse Steps',
    stampAlts: ['rogues', 'mercenaries', 'lookouts'],
    threeBeats: [
      'Elara intercepts you at the gatehouse with a reckless plan.',
      'Cause a massive, noisy distraction in the courtyard.',
      'Split the vault\'s initial take with her once she has the code.',
    ],
    doNot: 'Do not start with Durik already rescued or in the chapel hole.',
  },
  {
    bibleId: 'verdant-blight',
    spineId: 'vb-spine-angry-moot',
    title: 'Prove Your Innocence',
    openingFamily: 'village moot about the blight (outsider they will blame)',
    familyTags: ['villageMoot'],
    whoWantsWhat:
      'Baroness Mirelle needs you to prove your innocence to the angry mob by venturing into the blight to find the real source of the creeping rot.',
    firstObjective: 'Convince the shouting mob to lower their pitchforks and give you three days to find the truth.',
    refuseOrWalkAway: 'The village moot decides to hang you as blight-callers right now.',
    mapPin: 'Village Moot',
    stampAlts: ['villagers', 'elders', 'outsiders'],
    threeBeats: [
      'Mirelle intercedes on your behalf at the tense moot.',
      'Follow the trail of accelerated rot into the treeline.',
      'Your reward is your life and a writ of safe passage.',
    ],
    doNot: 'Do not feature a missing ranger or the river ford.',
  },
  {
    bibleId: 'verdant-blight',
    spineId: 'vb-spine-choked-station',
    title: 'The Last Map',
    openingFamily: 'ranger station at the veil (empty, maps with new ink, wood already inside)',
    familyTags: ['rangerStation'],
    whoWantsWhat:
      'A returning scout named Kaelen Moss wants you to help him decipher the frantic new map symbols his missing partner left behind before the wood claims the station entirely.',
    firstObjective: "Chop back the aggressive creeping vines sealing the station's heavy timber door.",
    refuseOrWalkAway: 'Kaelen says the map will be lost and the blight will take the valley unchecked.',
    mapPin: 'Overgrown Station',
    stampAlts: ['scouts', 'rangers', 'woodsmen'],
    threeBeats: [
      'Kaelen shows you the freshly inked map and the encroaching wood.',
      'Navigate to the first marked anomaly deep in the trees.',
      "Keep the station's leftover silver supplies as payment.",
    ],
    doNot: 'Do not involve the Baroness or a village moot.',
  },
  {
    bibleId: 'verdant-blight',
    spineId: 'vb-spine-holy-relic',
    title: 'The Sunken Chalice',
    openingFamily: 'shrine swallowed by blight (cut / burn / talk)',
    familyTags: ['blightShrine'],
    whoWantsWhat:
      "Sister Cala pleads with you to recover the shrine's silver chalice from the suffocating vines before the corrupted roots taint the holy relic permanently.",
    firstObjective: "Hack through the dense, pulsing briars choking the shrine's stone entrance.",
    refuseOrWalkAway: "Cala weeps that the land's last blessing is lost to the green.",
    mapPin: 'Choked Shrine',
    stampAlts: ['faithful', 'pilgrims', 'corrupted'],
    threeBeats: [
      'Cala points out the gleam of silver in the deep thorns.',
      'Defeat the root-thrall guarding the altar.',
      'Paid in church healing drafts and heavy coin.',
    ],
    doNot: 'Do not feature walking trees on a farm or the empty ranger station.',
  },
  {
    bibleId: 'verdant-blight',
    spineId: 'vb-spine-walking-oaks',
    title: 'The Boy in the Wood',
    openingFamily: 'blighted farm lane (field last season, child says trees walk)',
    familyTags: ['blightFarm'],
    whoWantsWhat:
      'A desperate farmer named Silas Croft needs you to find his son, who wandered into the new treeline trying to prove the oak trees were moving at night.',
    firstObjective: "Track the boy's small footprints into the unnaturally dense new growth.",
    refuseOrWalkAway: 'Silas grabs a rusted pitchfork to go die in the woods alone.',
    mapPin: 'Blighted Farm',
    stampAlts: ['farmers', 'children', 'strays'],
    threeBeats: [
      'Silas begs for help at the edge of his ruined field.',
      'Rescue the boy from a snare of animate roots.',
      "Silas gives you his family's hidden lockbox of savings.",
    ],
    doNot: 'Do not feature a village moot, Sister Cala, or the river ford.',
  },
  {
    bibleId: 'stillroot-veil',
    spineId: 'sv-spine-inn-watch',
    title: 'Hold the Door',
    openingFamily: 'Stillroot inn after a failed watch (bed if you take the next watch)',
    familyTags: ['stillrootInn'],
    whoWantsWhat:
      'Innkeep Mara promises a safe bed and warm meal if you replace her dead watchman and hold the barricaded inn door until dawn.',
    firstObjective: "Haul the heavy wooden bracing beams into place across the inn's main double doors.",
    refuseOrWalkAway: 'Mara kicks you out into the foggy, hostile night to fend for yourself.',
    mapPin: 'Stillroot Inn',
    stampAlts: ['travelers', 'locals', 'watchers'],
    threeBeats: [
      'Mara makes the offer over a cold hearth.',
      'Repel whatever tries to break down the door at midnight.',
      'Survive to earn a hot meal, a safe bed, and a handful of old coins.',
    ],
    doNot: "Do not start at the peat-cutters' camp or the drowned chapel.",
  },
  {
    bibleId: 'stillroot-veil',
    spineId: 'sv-spine-sunken-ledger',
    title: 'The Mud Stirs',
    openingFamily: "peat-cutters’ camp (something in the peat sits up)",
    familyTags: ['peatCamp'],
    whoWantsWhat:
      'A terrified foreman named Jorin Black needs you to retrieve his dropped ledger from the bog before the mud-caked thing that just sat up claims the camp.',
    firstObjective: 'Navigate the unsteady wooden planks over the bog to reach the abandoned dig site.',
    refuseOrWalkAway: 'Jorin says he can never return to town without the guild ledger.',
    mapPin: "Peat-Cutters' Camp",
    stampAlts: ['laborers', 'foremen', 'bog-dwellers'],
    threeBeats: [
      'Jorin points wildly at the stirring figure in the mud.',
      'Slay or evade the bog-corpse to grab the ledger.',
      'Paid in guild scrip and a sturdy bog-iron dagger.',
    ],
    doNot: 'Do not involve Innkeep Mara, Child Fenn, or the village palisade.',
  },
  {
    bibleId: 'stillroot-veil',
    spineId: 'sv-spine-restless-grave',
    title: 'The Binding Roots',
    openingFamily: 'funeral that will not stay down',
    familyTags: ['funeral'],
    whoWantsWhat:
      "Child Fenn begs you to sever the pale roots snaking into his grandfather's open grave before the old man is forced to walk again.",
    firstObjective: 'Leap into the open grave and hack apart the intrusive root-lattice.',
    refuseOrWalkAway: 'Fenn sobs as the loose dirt begins to shift and heave from below.',
    mapPin: 'Restless Graveyard',
    stampAlts: ['mourners', 'gravediggers', 'afflicted'],
    threeBeats: [
      'Fenn grabs your sleeve at the gravesite.',
      'Fight the writhing roots pulling the corpse upward.',
      "The boy's family pays you in preserved rations and silver.",
    ],
    doNot: 'Do not involve the peat-path shadows or the inn watch.',
  },
  {
    bibleId: 'stillroot-veil',
    spineId: 'sv-spine-blue-lanterns',
    title: 'Smash the Lights',
    openingFamily: 'village palisade (bar the gate at dusk, lantern might be a mistake)',
    familyTags: ['palisade'],
    whoWantsWhat:
      'The palisade guard, Kaelen, orders you to extinguish the strange blue-flame lanterns left outside the walls, believing they are drawing the restless dead.',
    firstObjective: 'Slip outside the heavy timber gate to smash the nearest blue lantern.',
    refuseOrWalkAway: 'Kaelen flatly refuses to let you inside the safety of the palisade.',
    mapPin: 'Village Palisade',
    stampAlts: ['guards', 'sentries', 'outsiders'],
    threeBeats: [
      'Kaelen shouts down his terms from the wall.',
      'Smash the lanterns while dodging grasping hands in the fog.',
      "Granted entry and a portion of the guard's copper.",
    ],
    doNot: 'Do not feature the drowned chapel or Innkeep Mara.',
  },
  {
    bibleId: 'shattered-coast',
    spineId: 'sc-spine-night-catch',
    title: 'The Thing in the Net',
    openingFamily: "Mariners’ dock night shift (something in a net that should not swim)",
    familyTags: ['nightDock'],
    whoWantsWhat:
      'Captain Iren Voss needs discrete muscle to quietly butcher and dispose of a mutated, scaled monstrosity caught in her nets before the Sentinels quarantine her ship.',
    firstObjective: 'Haul the heavy, thrashing tarp onto the secluded cutting deck.',
    refuseOrWalkAway: 'Voss warns that if the Sentinels lock down the docks, nobody leaves Saltmar.',
    mapPin: 'Night Docks',
    stampAlts: ['dockworkers', 'sailors', 'smugglers'],
    threeBeats: [
      'Voss shows you the writhing catch under the tarp.',
      'Put down the creature when it bursts free of the netting.',
      'Paid in unmarked guild coin and a promise of future dock favors.',
    ],
    doNot: 'Do not feature a guild letter, the Great Lift, or the Athenaeum.',
  },
  {
    bibleId: 'shattered-coast',
    spineId: 'sc-spine-cave-breach',
    title: "The Smuggler's Door",
    openingFamily: 'undercity sea-caves (smuggled in, Compact does not cover this door)',
    familyTags: ['seaCaves'],
    whoWantsWhat:
      'Sable Rook demands you explore a newly collapsed sea-cave tunnel that bypasses the guild checkpoints and secure whatever washed up inside.',
    firstObjective: 'Light a torch and descend the slick, guano-covered rocks into the breach.',
    refuseOrWalkAway: 'Sable threatens to alert the surface guard that you are trespassing in the undercity.',
    mapPin: 'Undercity Caves',
    stampAlts: ['smugglers', 'exiles', 'scavengers'],
    threeBeats: [
      'Sable intercepts you as you wade ashore in the dark.',
      'Defeat the cave-crawlers nesting in the new breach.',
      'Earn your safe passage and a cut of the salvaged cargo.',
    ],
    doNot: "Do not mention Mariners' nets or the Scribes.",
  },
  {
    bibleId: 'shattered-coast',
    spineId: 'sc-spine-stolen-manifest',
    title: 'The Lift Toll',
    openingFamily: 'Great Lift landing (Scribe wants name before a Mariner)',
    familyTags: ['greatLift'],
    whoWantsWhat:
      'Nessa Crow refuses to pull the lift levers until you retrieve a stolen manifest from a gang of thugs attempting to flee to the lower wards.',
    firstObjective: 'Chase down the fleeing thugs across the crowded landing platform.',
    refuseOrWalkAway: 'Nessa locks the lift mechanisms, leaving you stranded on the landing.',
    mapPin: 'Great Lift Landing',
    stampAlts: ['operators', 'travelers', 'thugs'],
    threeBeats: [
      'Nessa points out the thieves running for the stairs.',
      'Subdue the gang and recover the sealed manifest.',
      'Free passage on the lift and a pouch of silver from Nessa.',
    ],
    doNot: 'Do not involve the sea-caves or Captain Iren Voss.',
  },
  {
    bibleId: 'shattered-coast',
    spineId: 'sc-spine-repossession',
    title: 'Altered Terms',
    openingFamily: 'Middle Ward market (job is not the one you were hired for)',
    familyTags: ['middleMarket'],
    whoWantsWhat:
      'Merchant Lysander Chant reveals your simple escort job was a lie, and he actually needs you to publicly repossess a cursed artifact from a rival\'s stall to make a brutal point.',
    firstObjective: "March up to the rival stall and present Chant's writ of repossession.",
    refuseOrWalkAway: 'Chant says your reputation in Saltmar will be ruined before dusk.',
    mapPin: 'Middle Ward Market',
    stampAlts: ['merchants', 'mercenaries', 'crowds'],
    threeBeats: [
      'Chant alters the deal in a quiet alley off the market.',
      "Defend yourself when the rival merchant's bodyguards draw steel.",
      'Paid triple the original escort fee in heavy gold.',
    ],
    doNot: 'Do not feature a dragon text, the Athenaeum, or the Great Lift.',
  },
];

export const TABLETOP_SPINE_QUEST_ID = /^(ck|mr|bc|vb|sv|sc)-spine-/;

export function isTabletopSpineBibleId(id: string | null | undefined): id is TabletopSpineBibleId {
  return TABLETOP_MAIN_SPINES.some((s) => s.bibleId === id);
}

export function isTabletopSpineQuestId(id: string | undefined): boolean {
  return TABLETOP_SPINE_QUEST_ID.test(id ?? '');
}

export function spinesForTabletopBible(bibleId: string | null | undefined): TabletopMainSpine[] {
  if (!isTabletopSpineBibleId(bibleId)) return [];
  return TABLETOP_MAIN_SPINES.filter((s) => s.bibleId === bibleId);
}

function familyScore(hay: string, tags: TabletopFamilyTag[]): number {
  let n = 0;
  for (const tag of tags) {
    if (FAMILY_PATTERNS[tag].test(hay)) n += 1;
  }
  return n;
}

export function matchTabletopMainSpine(
  bibleId: string | null | undefined,
  hookBlob?: string,
  location?: string
): TabletopMainSpine | null {
  const pool = spinesForTabletopBible(bibleId);
  if (!pool.length) return null;
  const hay = `${hookBlob ?? ''} ${location ?? ''}`.replace(/\s+/g, ' ').trim();
  if (!hay) return null;
  let best: TabletopMainSpine | null = null;
  let bestScore = 0;
  for (const spine of pool) {
    const score = familyScore(hay, spine.familyTags);
    if (score > bestScore) {
      best = spine;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

export function matchTabletopMainSpineFromCtx(ctx: TabletopMatchCtx): TabletopMainSpine | null {
  return matchTabletopMainSpine(ctx.bibleId, ctx.hookBlob, ctx.location);
}

export function tabletopSpineToStarterQuest(spine: TabletopMainSpine): StarterQuestSeed {
  return {
    id: spine.spineId,
    title: spine.title,
    description: `${spine.whoWantsWhat} If you refuse or walk away: ${spine.refuseOrWalkAway}`,
    recommendedLevel: 1,
    objectives: [spine.firstObjective],
    location: spine.mapPin,
    type: 'main',
  };
}

export function withMatchedTabletopSpine(
  seeds: StarterQuestSeed[],
  ctx: TabletopMatchCtx
): StarterQuestSeed[] {
  const spine = matchTabletopMainSpineFromCtx(ctx);
  if (!spine) return seeds;
  const extra = tabletopSpineToStarterQuest(spine);
  if (seeds.some((s) => s.id === extra.id)) return seeds;
  return [extra, ...seeds];
}

function hashSeed(raw: string): number {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickTabletopStampAlt(spine: TabletopMainSpine, seed?: string): string {
  const alts = spine.stampAlts.filter((s) => s.trim());
  if (!alts.length) return '';
  const idx = hashSeed(`${seed ?? '0'}|${spine.bibleId}|${spine.spineId}|stamp`) % alts.length;
  return alts[idx];
}
