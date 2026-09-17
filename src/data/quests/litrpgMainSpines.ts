import type { StarterQuestSeed } from '@/game/questPlay';
import {
  matchStoryRpgMainSpineFromCtx,
  pickStoryRpgStampAlt,
  withMatchedStoryRpgSpine,
} from '@/data/quests/storyRpgMainSpines';
import {
  matchTabletopMainSpineFromCtx,
  pickTabletopStampAlt,
  withMatchedTabletopSpine,
} from '@/data/quests/tabletopMainSpines';

/**
 * LitRPG main-quest spines (2026-09-17a). One spine per New Game, matched to
 * the picked opening-hook family. Journal / spoken copy only — no new FSM,
 * XP rules, or unequip locks. Extra Gemini pack: 4 spines per LitRPG bible
 * (SP already had 4). 5th/6th bonus extras stay in the extra paste, not here.
 *
 * Commander Vane on the war-camp spine was renamed Commander Rusk so it
 * does not collide with invented “Orel Vane” / existing Sula Vane. Extra
 * pack had no new Vane. No other live-NPC rename required (Chief Archivist
 * is an Inkbound role, not Lene Quill; Silver Quill is a frat, not a person).
 */

export type LitRpgSpineBibleId =
  | 'summoned-pact'
  | 'hero-awakening'
  | 'system-integration'
  | 'gatebreak-ward'
  | 'ascending-spire'
  | 'fabled-legacy'
  | 'inkbound-academy'
  | 'void-audience'
  | 'hollow-core'
  | 'dungeon-transport';

export type OpeningFamilyTag =
  | 'cathedral'
  | 'aloneRuin'
  | 'warCamp'
  | 'transitWagon'
  | 'rural'
  | 'academy'
  | 'shrine'
  | 'office'
  | 'train'
  | 'woodsCabin'
  | 'fort'
  | 'slums'
  | 'lift'
  | 'lostFloor'
  | 'tomb'
  | 'village'
  | 'library'
  | 'dorms'
  | 'arena'
  | 'cave'
  | 'sect'
  | 'teahouse'
  | 'coreRoom'
  | 'barracks'
  | 'mimicVault'
  | 'hospital'
  | 'vents'
  | 'barge'
  | 'dropship'
  | 'prison'
  | 'spireBase'
  | 'inkAnnex'
  | 'spiritBeast'
  | 'slaveCart';

export interface LitRpgMainSpine {
  bibleId: LitRpgSpineBibleId;
  spineId: string;
  title: string;
  openingFamily: string;
  familyTags: OpeningFamilyTag[];
  whoWantsWhat: string;
  firstObjective: string;
  refuseOrWalkAway: string;
  mapPin: string;
  stampAlts: string[];
  /** Spoken / journal beats only — not engine clocks. */
  threeBeats: string[];
  doNot: string;
}

export interface SpineMatchCtx {
  bibleId?: string | null;
  hookBlob?: string;
  seed?: string;
  location?: string;
}

const FAMILY_PATTERNS: Record<OpeningFamilyTag, RegExp> = {
  cathedral:
    /\b(cathedral|sevenfold|consecrated sanctuary|summoning circle|high priest|chanter|lower crypts?)\b/i,
  aloneRuin:
    /\b(alone|ruined?|rubble|collapsed|abandoned|burnt|watchtower|foundation|bathhouse|gutted|destroyed sanctum|mage tower|half-collapsed)\b/i,
  warCamp:
    /\b(war[- ]?camp|garrison|banner-smoke|enlist|quartermaster|brigandine|mercenary|mud-torn|iron hounds)\b/i,
  transitWagon:
    /\b(wagon|caravan|highwaym[ae]n|grain-ship|harbor circle|merchant'?s road|moving (?:caravan )?wagon)\b/i,
  rural:
    /\b(village|elder'?s hearth|razor-boars?|family owes|generation-old|rural|winter meat)\b/i,
  academy:
    /\b(academy|instructor|remedial|dormitory|training yard|obstacle course|expulsion|lecture)\b/i,
  shrine: /\b(shrine|altar|forgotten (?:local )?deit|patron|god-touched|overgrown vines)\b/i,
  office:
    /\b(office|cubicle|workplace|open-plan|accounting|stairwell|middle-manager|workplace floor)\b/i,
  train:
    /\b(train|metro|subway|platform|commuter|derail|front car|traffic|dashboard)\b/i,
  woodsCabin:
    /\b(cabin|ranger station|woods|wilderness|park path|enraged stags?|blood-moon)\b/i,
  fort:
    /\b(palisade|border fort|eastern palisade|chitin-crawlers?|court-martial|engineers can set)\b/i,
  slums:
    /\b(slums?|tenement|rooftops?|night market|quarantine|ward-crystal|black market|gang boss)\b/i,
  lift:
    /\b(elevator|lift (?:car|engineer)|mana-engine|void-bats?|dangling lift|support cables?)\b/i,
  lostFloor:
    /\b(lost floor|spire-scout|glass-spiders?|data-bracer|shattered scout|unmapped biotope)\b/i,
  tomb:
    /\b(tomb|sarcophagus|ancestral blade|skeletal knight|rusted (?:pommel|crown)|hollow cairn)\b/i,
  village:
    /\b(mossford|lorekeeper|prophecy stones?|whispering cave|inquisitors?)\b/i,
  library:
    /\b(library|restricted (?:section|stack)|bestiary|grimoire|aisle 4|spell-page)\b/i,
  dorms:
    /\b(dorm(?:itory|s)?|fraternity|silver quill|binding exam|upperclassman|frat house)\b/i,
  arena:
    /\b(arena|blood-match|gladiator|blood-pit|viewer tip|camera-drone)\b/i,
  cave:
    /\b(caves?|gravity well|meditation cave|qi drop|ascended master|condensing)\b/i,
  sect:
    /\b(outer (?:sect|court)|blood-lotus|jade cliff|sect elder|spirit-herbs?)\b/i,
  teahouse:
    /\b(teapot|teahouse|crippling palm|crippled beggar|gang leader'?s two enforcers)\b/i,
  coreRoom:
    /\b(dungeon core|core room|spike traps?|shattered heart|sentient dungeon)\b/i,
  barracks:
    /\b(goblin boss|iron rations|starving minions|surface tunnel|floor[- ]?boss)\b/i,
  mimicVault:
    /\b(mimic|treasure vault|rusted pickaxe|cave-leeches?|talkative chest)\b/i,
  hospital:
    /\b(hospital|icu|orderly|breaker box|system-zombies?|life-support)\b/i,
  vents:
    /\b(ventilation|exhaust vents?|slime-mold|duct-crawler|fan blades?)\b/i,
  barge:
    /\b(barge|river-patrol|river-marine|smuggler'?s river|drowned rat)\b/i,
  dropship:
    /\b(dropship|black-box|cockpit|corporate sponsor|emergency pod)\b/i,
  prison:
    /\b(prison|jailer|signet ring|executioner|black-iron dungeon|adjacent cell)\b/i,
  spireBase:
    /\b(climber camp|ranking board|plaza before|toll-gate|turnstile|ground-floor)\b/i,
  inkAnnex:
    /\b(sunken annex|unbound quill|ink-rot|under-stacks|lost wing)\b/i,
  spiritBeast:
    /\b(spirit beast|suppression runes?|binding cavern|three-tailed|life-binding)\b/i,
  slaveCart:
    /\b(slave cart|menagerie|mana-axle|beast-tamer|fodder to a floor)\b/i,
};

const BIBLE_PREFIX: Record<LitRpgSpineBibleId, string> = {
  'summoned-pact': 'sp',
  'hero-awakening': 'ha',
  'system-integration': 'si',
  'gatebreak-ward': 'gw',
  'ascending-spire': 'as',
  'fabled-legacy': 'fl',
  'inkbound-academy': 'ia',
  'void-audience': 'va',
  'hollow-core': 'hc',
  'dungeon-transport': 'dt',
};

export const LITRPG_MAIN_SPINES: LitRpgMainSpine[] = [
  {
    bibleId: 'summoned-pact',
    spineId: 'cathedral-royal-vanguard',
    title: 'The Crown’s Meat Shield',
    openingFamily: 'Cathedral',
    familyTags: ['cathedral'],
    whoWantsWhat:
      'High Priest Arus wants you to act as a frontline shock-trooper for the Crown’s endless war against the encroaching rot.',
    firstObjective: 'Clear the infestation in the cathedral’s lower crypts to prove your baseline stats.',
    refuseOrWalkAway: 'Execution for heresy, or so they claim; fleeing means living as a hunted apostate.',
    mapPin: 'Consecrated Sanctuary',
    stampAlts: ['Star-Touched', 'The Drafted', 'Mana-Thrall'],
    threeBeats: [
      'Arus reads the binding terms of your summoning.',
      'Survive the crypt rats and light the brazier.',
      'Receive your first copper stipend, minus a “housing tax.”',
    ],
    doNot: 'Do not involve ancient ruins or broken tethers; this is a highly organized, institutionalized draft.',
  },
  {
    bibleId: 'summoned-pact',
    spineId: 'alone-ruin-tether',
    title: 'Echoes of a Dead Summoner',
    openingFamily: 'Alone Ruin',
    familyTags: ['aloneRuin'],
    whoWantsWhat:
      'A recorded magical echo of the dead mage who summoned you wants you to retrieve their research before rivals arrive.',
    firstObjective: "Find the mage's hidden vault key amidst the rubble of their destroyed sanctum.",
    refuseOrWalkAway:
      'The echo slowly fades, leaving you with no guidance in a hostile, unfamiliar wilderness.',
    mapPin: 'Collapsed Mage Tower',
    stampAlts: ['Void-Spit', 'The Masterless', 'Anomaly'],
    threeBeats: [
      'The projection begs you to secure their legacy.',
      'Dig through cursed rubble to find the brass key.',
      'Unlock the vault to get your first weapon, but it binds to your soul (cannot unequip).',
    ],
    doNot: 'Do not include standing armies, royalty, or active courts.',
  },
  {
    bibleId: 'summoned-pact',
    spineId: 'war-camp-mercenary',
    title: 'Blood for the Ledger',
    openingFamily: 'War Camp',
    familyTags: ['warCamp'],
    whoWantsWhat:
      'Commander Rusk wants you to join the Iron Hounds mercenary company to pay off the massive mana-debt incurred by pulling you here.',
    firstObjective: 'Survive the gauntlet pit against a captured goblin to earn your unit patch.',
    refuseOrWalkAway:
      'You are stripped of your starting gear and tossed out the front gates into active enemy territory.',
    mapPin: 'Mud-Torn Garrison',
    stampAlts: ['Debt-Bound', 'Camp-Meat', 'Iron-Rookie'],
    threeBeats: [
      'Rusk hands you a bill for your summoning materials.',
      'Kill the goblin in the pit.',
      'Get your unit patch and first meal, but take a permanent scar (stamina penalty for 1 day).',
    ],
    doNot: 'Do not involve holy quests or dead mages; this is pure, gritty economics of war.',
  },
  {
    bibleId: 'summoned-pact',
    spineId: 'hollow-transit-glitch',
    title: 'The Accidental Passenger',
    openingFamily: 'Transit / Wagon',
    familyTags: ['transitWagon'],
    whoWantsWhat:
      'The terrified caravan merchant, Elara, wants you to guard her cargo because the summoning spell misfired and landed you on her wagon during an ambush.',
    firstObjective: 'Repel the three highwaymen currently attempting to board the moving wagon.',
    refuseOrWalkAway: "Elara kicks you off the wagon, leaving you stranded on the perilous Merchant's Road.",
    mapPin: 'Moving Caravan Wagon',
    stampAlts: ['Stowaway', 'Rift-Fallen', 'Bycatch'],
    threeBeats: [
      'Elara screams at you to grab a sword and help.',
      'Defeat the boarding bandits.',
      'Earn passage to the next town and a rusty blade, but forfeit any claim to the actual cargo.',
    ],
    doNot: 'Do not involve intentional summoners or debts; this was a pure cosmic accident.',
  },
  {
    bibleId: 'hero-awakening',
    spineId: 'village-ledger-debt',
    title: 'The Ancestral Debt',
    openingFamily: 'Wake-Ledger / Rural',
    familyTags: ['rural'],
    whoWantsWhat:
      'The Village Elder wants you to honor the awakening of your System Class by clearing the generation-old monster bounty your family owes.',
    firstObjective: "Hunt three razor-boars in the perimeter woods to secure the town's winter meat.",
    refuseOrWalkAway: 'Your family is exiled from the safety of the village wards.',
    mapPin: 'Elder’s Hearth',
    stampAlts: ['Hearth-Born', 'Ledger-Bound', 'Scion'],
    threeBeats: [
      'Elder explains the blood-debt triggered by your awakening.',
      'Hunt the boars and harvest the meat.',
      'Receive your grandfather’s armor, but lose your standing with the local merchant guild for taking so long.',
    ],
    doNot: 'Do not make the player a foreigner or out-of-worlder; they are a local who just woke up to the System.',
  },
  {
    bibleId: 'hero-awakening',
    spineId: 'academy-flunk-out',
    title: 'Prove Your Class',
    openingFamily: 'Academy',
    familyTags: ['academy'],
    whoWantsWhat:
      'Instructor Kael wants you to pass the remedial combat exam immediately, as your delayed awakening nearly got you expelled.',
    firstObjective:
      'Complete the wooden dummy obstacle course in under two minutes without using prohibited spells.',
    refuseOrWalkAway: 'Immediate expulsion and stripping of your Academy status and dormitory.',
    mapPin: 'Training Yard Beta',
    stampAlts: ['Late-Bloomer', 'The Remedial', 'Crest-Bearer'],
    threeBeats: [
      'Kael hands you an expulsion notice with one loophole.',
      'Run the obstacle course perfectly.',
      'Keep your dorm key, but you are assigned the worst chore duties for a month.',
    ],
    doNot: 'Do not involve family debts or ancient ruins; keep it strictly institutional and academic.',
  },
  {
    bibleId: 'hero-awakening',
    spineId: 'fallen-shrine-inheritance',
    title: 'The Forgotten Patron',
    openingFamily: 'Alone Ruin / Shrine',
    familyTags: ['aloneRuin', 'shrine'],
    whoWantsWhat:
      'A forgotten local deity wants you to restore its altars using your newly awakened Class powers to prevent its total fade from existence.',
    firstObjective: 'Clear the overgrown vines and defeat the corrupted slime occupying the primary altar.',
    refuseOrWalkAway:
      'The deity goes silent; you receive no divine buffs, and the shrine slowly crumbles completely.',
    mapPin: 'Overgrown Shrine',
    stampAlts: ['God-Touched', 'Shrine-Keeper', 'The Awakened Hand'],
    threeBeats: [
      'Hear the whisper of the fading god in your mind.',
      'Purge the slime from the altar.',
      'Gain a minor blessing of vitality, but the local dominant church marks you as a minor heretic.',
    ],
    doNot: 'Do not involve academic instructors or village elders; this is a solitary, mystical awakening.',
  },
  {
    bibleId: 'system-integration',
    spineId: 'urban-office-survival',
    title: 'Corporate Restructuring',
    openingFamily: 'Urban Office',
    familyTags: ['office'],
    whoWantsWhat:
      'Your middle-manager, Dave, wants you to secure the stairwell so the surviving accounting team can reach the ground floor.',
    firstObjective: 'Kill the mutated feral dogs that have taken over the 4th-floor landing.',
    refuseOrWalkAway: 'Dave leaves you behind, locking the department doors behind him.',
    mapPin: 'Cubicle Block 4A',
    stampAlts: ['Wage-Mage', 'Survivor', 'Level-1 Employee'],
    threeBeats: [
      'Dave leverages your new “Fighter” class for group survival.',
      'Bash the feral dogs with a heavy fire extinguisher.',
      'Get first pick of the vending machine rations, but take the vanguard risk.',
    ],
    doNot: 'Do not involve wilderness survival or commuter trains; confine the early tension to the claustrophobic office building.',
  },
  {
    bibleId: 'system-integration',
    spineId: 'commuter-transit-wreck',
    title: 'Derailment Protocol',
    openingFamily: 'Transit',
    familyTags: ['train'],
    whoWantsWhat:
      'A wounded Transit Police officer wants you to recover the medical kit from the crushed front car to save bleeding passengers.',
    firstObjective:
      'Navigate the twisted metal of the train cars and defeat the newly spawned Goblin Scavengers looting the bags.',
    refuseOrWalkAway:
      'The passengers bleed out, and their restless, system-infected spirits haunt the tunnel.',
    mapPin: 'Sub-Tunnel Train Wreck',
    stampAlts: ['Commuter', 'Tunnel-Rat', 'The Unticketed'],
    threeBeats: [
      'Officer gasps out a request for the medkit.',
      'Slay the looting goblins.',
      'Hand over the kit to get a police baton, but spend all your starting stamina.',
    ],
    doNot: 'Do not use office politics or wilderness cabins; focus on the immediate disaster of the crash.',
  },
  {
    bibleId: 'system-integration',
    spineId: 'wilderness-retreat-siege',
    title: 'Cabin in the Woods',
    openingFamily: 'Alone / Camp',
    familyTags: ['woodsCabin'],
    whoWantsWhat:
      'The park ranger wants you to help barricade the ranger station against the suddenly hyper-aggressive local wildlife.',
    firstObjective: 'Chop 10 logs of System-infused wood from the perimeter while dodging enraged stags.',
    refuseOrWalkAway: 'The ranger locks you out of the reinforced cabin for the night.',
    mapPin: 'Ranger Station Alpha',
    stampAlts: ['Hiker', 'Woods-Bound', 'Prey'],
    threeBeats: [
      'Ranger warns of the incoming blood-moon wildlife wave.',
      'Harvest the infused wood under pressure.',
      'Gain access to the safehouse, but the ranger confiscates your modern lighter.',
    ],
    doNot: 'Do not include urban mobs (like goblins in a subway) or office settings; keep it strictly nature-gone-wild.',
  },
  {
    bibleId: 'gatebreak-ward',
    spineId: 'border-fort-breach',
    title: 'Plug the Hole',
    openingFamily: 'Border Fort',
    familyTags: ['fort'],
    whoWantsWhat:
      'Captain Thorne wants you to hold the eastern palisade breach against the endless swarm so the engineers can set explosives.',
    firstObjective: 'Survive for 3 minutes against low-level Chitin-Crawlers at the broken gate.',
    refuseOrWalkAway: 'Court-martial and immediate demotion to unarmed bait duty.',
    mapPin: 'Eastern Palisade Breach',
    stampAlts: ['Ward-Grunt', 'Breach-Walker', 'Shield-Brother'],
    threeBeats: [
      'Thorne yells the orders over the roar of the swarm.',
      'Hold the line with a standard-issue spear.',
      'Get paid 5 silver chits, but your armor is badly degraded from the acid spit.',
    ],
    doNot: 'Do not involve slums or abandoned outposts; you are part of an active, functioning military unit holding a wall.',
  },
  {
    bibleId: 'gatebreak-ward',
    spineId: 'quarantine-zone-smuggler',
    title: 'The Black Market Ward',
    openingFamily: 'Slums / Camp',
    familyTags: ['slums'],
    whoWantsWhat:
      'A desperate quarantined smuggler wants you to sneak a fractured ward-crystal past the city guard to protect his hidden stash from incoming rift-beasts.',
    firstObjective:
      'Navigate the collapsing tenement rooftops to plant the ward-crystal at the smuggler’s safehouse without alerting the patrol drones.',
    refuseOrWalkAway:
      'The smuggler shouts for the guards, loudly framing you as a rift-cultist to create a distraction for his own escape.',
    mapPin: 'Quarantined Tenement Block',
    stampAlts: ['Dust-Rat', 'Ward-Breaker', 'The Quarantined'],
    threeBeats: [
      'Smuggler shoves the pulsing crystal into your hands just as sirens wail.',
      'Sneak across the rooftops and activate the crystal.',
      'Gain a rusty smuggler’s dagger, but suffer minor mana-poisoning from handling the raw crystal without gloves.',
    ],
    doNot: 'Do not involve organized military lines or captains; this is the desperate, illicit underside of a city under siege.',
  },
  {
    bibleId: 'gatebreak-ward',
    spineId: 'evac-transit-shield',
    title: 'Rearguard of the Broken',
    openingFamily: 'Transit',
    familyTags: ['train', 'transitWagon'],
    whoWantsWhat:
      'An exhausted Ward-Cleric on an evacuation wagon wants you to channel your newly awakened mana into the mobile shield generator before the pursuing swarm catches up.',
    firstObjective:
      'Stand at the rear of the moving wagon and manually channel mana into the sputtering shield-obelisk while knocking away winged pursuers.',
    refuseOrWalkAway:
      'The wagon’s ward fails, dooming the refugees and leaving you to outrun a Level 20 swarm on foot.',
    mapPin: 'Fleeing Refugee Wagon',
    stampAlts: ['Caravan-Guard', 'Mana-Battery', 'Survivor'],
    threeBeats: [
      'Cleric collapses, begging you to grip the obelisk rods.',
      'Repel a winged swarm-drone with a long pole while maintaining the channel.',
      'The wagon reaches the inner gates, earning you a refugee writ, but your mana pool is temporarily fractured from the strain.',
    ],
    doNot: 'Do not involve sneaking through slums or holding stationary fortress walls; this is a high-speed, desperate retreat.',
  },
  {
    bibleId: 'gatebreak-ward',
    spineId: 'alone-ruin-scavenger',
    title: 'The Drone’s Heart',
    openingFamily: 'Alone Ruin',
    familyTags: ['aloneRuin'],
    whoWantsWhat:
      'A stranded, half-crushed mana-engineer wants you to extract an intact power core from a downed patrol drone so they can reactivate a teleport pad.',
    firstObjective:
      'Pry the casing off the crashed drone and bypass its automated shock-defenses to retrieve the core.',
    refuseOrWalkAway:
      'The engineer succumbs to their wounds, and the teleport pad remains dead, leaving you to walk across a swarm-infested wasteland.',
    mapPin: 'Crashed Patrol Drone',
    stampAlts: ['Scavenger', 'Ruin-Rat', 'Tech-Thief'],
    threeBeats: [
      'Engineer hands you a sparked multi-tool.',
      'Extract the core without triggering an explosion.',
      'Activate the pad to escape the sector, but the unstable core permanently burns your maximum mana capacity by 5 points.',
    ],
    doNot: 'Do not involve active military lines or smuggled black-market goods; this is isolated, post-battle scavenging.',
  },
  {
    bibleId: 'hero-awakening',
    spineId: 'hollow-dungeon-escape',
    title: 'The Prisoner’s Awakening',
    openingFamily: 'Hollow / Cell',
    familyTags: ['prison'],
    whoWantsWhat:
      'A dying royal guardsman in the adjacent cell wants you to take his hidden signet ring to the border resistance before the usurper’s executioner arrives.',
    firstObjective: 'Pick the lock of your cell using a bone splinter and defeat the sleeping jailer to secure the ring.',
    refuseOrWalkAway: 'The executioner arrives in five minutes to permanently end your run at Level 1.',
    mapPin: 'Black-Iron Dungeon',
    stampAlts: ['Cell-Born', 'The Condemned', 'Unchained'],
    threeBeats: [
      'The guard slides the ring across the damp stone floor.',
      'Sneak out and strangle the goblin jailer.',
      'Gain the heavy iron key as your first weapon, but you are marked as an enemy of the Crown.',
    ],
    doNot: 'Do not involve academies, villages, or ancestral gods; this is a desperate, low-resource prison break.',
  },
  {
    bibleId: 'system-integration',
    spineId: 'hospital-ward-blackout',
    title: 'Critical Condition',
    openingFamily: 'Hollow / Hospital',
    familyTags: ['hospital'],
    whoWantsWhat:
      'A frantic ICU nurse wants you to fight your way to the basement and the backup mana-generator before the life-support patients mutate into System-Zombies.',
    firstObjective: 'Navigate the blood-slicked stairwell and herd the mutated orderly guarding the breaker box.',
    refuseOrWalkAway:
      'The power fails entirely, plunging the hospital into darkness and instantly spawning twenty Level 5 mutatants on your floor.',
    mapPin: 'Mercy Hospital Basement',
    stampAlts: ['Patient-Zero', 'Ward-Walker', 'The Discharged'],
    threeBeats: [
      'The nurse begs you to take her heavy flashlight and go.',
      'Bludgeon the orderly with a fire axe.',
      'Throw the breaker to restore light, but the noise draws a horde to the ground floor.',
    ],
    doNot: 'Do not involve corporate offices or wilderness cabins; keep the horror medical and sterile.',
  },
  {
    bibleId: 'ascending-spire',
    spineId: 'slums-toll-gate',
    title: 'Breaking the Bronze Toll',
    openingFamily: 'Camp / Slums',
    familyTags: ['slums', 'spireBase'],
    whoWantsWhat:
      'A desperate gang boss wants you to clear the heavily guarded elevator toll-gate so his smugglers can move contraband up to Floor 22.',
    firstObjective: 'Defeat the automated Bronze Warden guarding the turnstile.',
    refuseOrWalkAway:
      'The gang marks you as a target, forcing you to sneak up the perilous exterior scaffolding instead.',
    mapPin: 'Turnstile Blockade',
    stampAlts: ['Bottom-Feeder', 'Ground-Floor Scum', 'Climber'],
    threeBeats: [
      'The boss promises you a ticket up if you break the machine.',
      'Smash the Bronze Warden’s core.',
      'Receive your forged transit pass, but the Spire’s automated authority system flags your aura.',
    ],
    doNot: 'Do not involve crashing elevators or lost floors; this is about paying the violent toll to start the climb.',
  },
  {
    bibleId: 'ascending-spire',
    spineId: 'transit-lift-crash',
    title: 'Dead Weight in the Shaft',
    openingFamily: 'Transit / Lift',
    familyTags: ['lift'],
    whoWantsWhat:
      'The frantic Lift Engineer wants you to manually restart the mana-engine on the outside of the crashed elevator before the void-bats eat the support cables.',
    firstObjective: 'Climb onto the roof of the hanging elevator and reconnect the three severed mana-conduits.',
    refuseOrWalkAway:
      'The cables snap, sending the car plunging ten floors down before emergency brakes catch it, permanently crippling your starting health pool.',
    mapPin: 'Dangling Lift Car #404',
    stampAlts: ['Passenger', 'Cable-Rat', 'Free-Faller'],
    threeBeats: [
      'Engineer hands you insulated gloves and pushes you out the top hatch.',
      'Repel the bats and connect the wires.',
      'The lift surges upward, securing your safety but fusing the gloves to your hands as your first bound item.',
    ],
    doNot: 'Do not involve gang politics or ancient maps; focus entirely on the vertical mechanical terror of the crash.',
  },
  {
    bibleId: 'ascending-spire',
    spineId: 'ruin-lost-floor',
    title: 'Map of the Forgotten',
    openingFamily: 'Alone Ruin',
    familyTags: ['lostFloor', 'aloneRuin'],
    whoWantsWhat:
      'A dying Spire-Scout wants you to take their mapped route of this undocumented “Lost Floor” up to the Guildmasters on Floor 10.',
    firstObjective: 'Retrieve the scout’s data-bracer from a nearby nest of glass-spiders.',
    refuseOrWalkAway:
      'The scout curses you with their final breath; you are left with no map in a completely unmapped biotope.',
    mapPin: 'Shattered Scout Camp',
    stampAlts: ['Floor-Walker', 'Lost Soul', 'Path-Finder'],
    threeBeats: [
      'Scout coughs up blood and points to the spider nest.',
      'Retrieve the bracer from the webbing.',
      'Gain the bracer’s mini-map UI, but inherit the scout’s tracking bounty.',
    ],
    doNot: 'Do not involve mechanical elevators or toll booths; this floor is ancient, overgrown, and isolated.',
  },
  {
    bibleId: 'ascending-spire',
    spineId: 'hollow-ventilation-shaft',
    title: 'Choking on the Climb',
    openingFamily: 'Hollow / Vents',
    familyTags: ['vents'],
    whoWantsWhat:
      'A trapped exhaust-sweeper wants you to clear a blockage of toxic slime-mold in the main fan so they don’t suffocate in the ventilation shaft.',
    firstObjective: 'Burn away the Level 2 Slime-Mold clogging the massive rotating fan blades.',
    refuseOrWalkAway:
      'The vents flood with toxic gas, inflicting a continuous poison debuff until you manage to find an exit.',
    mapPin: 'Sector 4 Exhaust Vents',
    stampAlts: ['Duct-Crawler', 'Filter-Lung', 'Sweeper'],
    threeBeats: [
      'The sweeper tosses you a rusted flare gun.',
      'Shoot the flare into the mold mass while balancing on a grate.',
      'The fan activates, blowing you up to the next maintenance tier, but you drop all your starting currency in the fall.',
    ],
    doNot: 'Do not involve passenger lifts, gang tolls, or ancient maps; this is purely about crawling through the claustrophobic, mechanical guts of the Spire.',
  },
  {
    bibleId: 'fabled-legacy',
    spineId: 'tomb-ancestral-blade',
    title: 'The Rusted Crown',
    openingFamily: 'Hollow / Tomb',
    familyTags: ['tomb'],
    whoWantsWhat:
      'The ghost of your legendary ancestor wants you to reforge their shattered sword and reclaim the family honor from the usurper king.',
    firstObjective:
      'Pull the rusted pommel of the ancestral blade from the stone sarcophagus guarded by a skeletal knight.',
    refuseOrWalkAway: 'The ghost turns hostile, banishing you from the tomb without your ancestral starting boon.',
    mapPin: 'Dusty Sarcophagus',
    stampAlts: ['Scion', 'Blood-Heir', 'The Fallen'],
    threeBeats: [
      'The ghost rises and demands you take up the mantle.',
      'Defeat the skeletal knight to claim the pommel.',
      'Gain the broken artifact weapon, but suffer a permanent weakness to holy magic.',
    ],
    doNot: 'Do not involve hiding in villages or attending schools; this is a direct, dungeon-delving inheritance.',
  },
  {
    bibleId: 'fabled-legacy',
    spineId: 'camp-prophecy-stone',
    title: 'Whispers in the Dirt',
    openingFamily: 'Camp / Village',
    familyTags: ['village', 'rural'],
    whoWantsWhat:
      'The village lorekeeper wants you to unearth the Prophecy Stones hidden in the nearby caves before the Emperor’s inquisitors burn the village to find them.',
    firstObjective: 'Find and decipher the first Prophecy Stone deep in the Whispering Cave.',
    refuseOrWalkAway:
      'The inquisitors arrive and raze the village; you start your journey as a wanted fugitive with no allies.',
    mapPin: 'The Whispering Cave',
    stampAlts: ['Chosen', 'Dirt-Born', 'Lore-Keeper'],
    threeBeats: [
      'Lorekeeper shoves a decoding ring into your hand.',
      'Sneak past the cave-trolls to read the stone.',
      'Unlock your first hidden skill tree, but trigger an alarm that draws the inquisitors.',
    ],
    doNot: 'Do not involve ghosts or formal academies; keep it gritty, rural, and focused on hiding from an empire.',
  },
  {
    bibleId: 'fabled-legacy',
    spineId: 'academy-founder-blood',
    title: 'Trial of the Founders',
    openingFamily: 'Academy',
    familyTags: ['academy'],
    whoWantsWhat:
      'The Headmaster wants you to unlock the sealed Founder’s Wing, believing your newly tested bloodline is the key to stopping a returning ancient evil.',
    firstObjective: 'Survive the Founder’s Trial of Fire in the academy’s basement to prove your lineage.',
    refuseOrWalkAway: 'You are stripped of your noble title and relegated to the servant’s quarters as a groundskeeper.',
    mapPin: 'Sealed Basement Door',
    stampAlts: ['Noble-Bastard', 'The Key', 'Academy-Elite'],
    threeBeats: [
      'Headmaster isolates you after your blood-test glows gold.',
      'Walk through the illusory fire without breaking concentration.',
      'Gain access to the forbidden library, but earn the immediate jealousy of the rival noble houses.',
    ],
    doNot: 'Do not involve mud-covered villages or dusty tombs; this is polished, high-society magical academia.',
  },
  {
    bibleId: 'fabled-legacy',
    spineId: 'transit-heirloom-barge',
    title: 'The River’s Ransom',
    openingFamily: 'Transit / Barge',
    familyTags: ['barge'],
    whoWantsWhat:
      'A dying courier on a smuggler’s river barge wants you to deliver a sealed ancestral signet to the resistance before the Usurper King’s river-patrol intercepts it.',
    firstObjective:
      'Throw the boarding, heavy-armored river-marine overboard to secure the courier’s waterproof lockbox.',
    refuseOrWalkAway:
      'The marine sinks the barge; you wash ashore miles downstream with no starting gold and a severe “Drowned Rat” stamina debuff.',
    mapPin: 'Drifting Smuggler Barge',
    stampAlts: ['Courier', 'Stowaway', 'River-Born'],
    threeBeats: [
      'The courier bleeds out on deck, shoving the box into your hands.',
      'Shove the marine into the violent rapids.',
      'Claim the signet ring to unlock a legacy class, but the river-patrol immediately puts your face on a bounty poster.',
    ],
    doNot: 'Do not involve formal academy trials or dusty tombs; this is a wet, high-stakes, moving chase.',
  },
  {
    bibleId: 'inkbound-academy',
    spineId: 'library-rogue-grimoire',
    title: 'The Biting Bestiary',
    openingFamily: 'Hollow / Library',
    familyTags: ['library'],
    whoWantsWhat:
      'The Chief Archivist wants you to hunt down rogue grimoires that have sprouted legs and are eating the freshman students.',
    firstObjective:
      'Capture or destroy the Level 3 Biting Bestiary currently digesting a desk in the restricted section.',
    refuseOrWalkAway: 'You are banned from the library, cutting you off from early-game spell vendors.',
    mapPin: 'Restricted Section - Aisle 4',
    stampAlts: ['Page-Turner', 'Ink-Stained', 'Archival-Bait'],
    threeBeats: [
      'Archivist hands you a reinforced butterfly net.',
      'Subdue the snarling book without using fire magic.',
      'Get your first Spell-Page, but you are now liable for any library damage you cause.',
    ],
    doNot: 'Do not involve transit trains or dorm rivalries; keep the action entirely within the massive, dangerous library.',
  },
  {
    bibleId: 'inkbound-academy',
    spineId: 'academy-dorm-heist',
    title: 'The Silver Quill Heist',
    openingFamily: 'Academy / Dorms',
    familyTags: ['dorms', 'academy'],
    whoWantsWhat:
      'Your upperclassman mentor wants you to infiltrate a rival fraternity’s study hall to steal the answer key for the upcoming Binding Exam.',
    firstObjective: 'Sneak past the mana-wards and retrieve the parchment from the Silver Quill frat house.',
    refuseOrWalkAway: 'You are hazed relentlessly, suffering a 10% experience penalty for your first 5 levels.',
    mapPin: 'Silver Quill Balcony',
    stampAlts: ['Pledge', 'Scrub', 'Sneak-Thief'],
    threeBeats: [
      'Mentor explains the layout of the rival dorm.',
      'Bypass the snoring gargoyle guard and grab the test.',
      'Pass the exam to get your Class Badge, but make a permanent enemy of the Silver Quills.',
    ],
    doNot: 'Do not involve killer books or train rides; this is purely student faction politics and stealth.',
  },
  {
    bibleId: 'inkbound-academy',
    spineId: 'transit-cursed-coal',
    title: 'Stoking the Engine',
    openingFamily: 'Transit',
    familyTags: ['train'],
    whoWantsWhat:
      'The Conductor wants you to shovel raw mana-coal into the engine room after the original stokers were vaporized by a cursed luggage hex.',
    firstObjective: 'Shovel 10 chunks of volatile mana-coal into the furnace while avoiding the residual curse-flames.',
    refuseOrWalkAway: 'The train stalls in the Void-Wastes, and you are forced to fight off shadow-beasts with no help.',
    mapPin: 'Locomotive Engine Car',
    stampAlts: ['Ticket-Holder', 'Stoker', 'Luggage-Rat'],
    threeBeats: [
      'Conductor shoves a blackened shovel into your chest.',
      'Feed the furnace while dodging random firebursts.',
      'Arrive at the Academy with enhanced fire-resistance, but your starting robes are permanently singed (charisma penalty).',
    ],
    doNot: 'Do not involve libraries or dormitories; the entire spine must take place on the moving magical train.',
  },
  {
    bibleId: 'inkbound-academy',
    spineId: 'ruin-unbound-quill',
    title: 'The Forgotten Annex',
    openingFamily: 'Alone Ruin / Lost Wing',
    familyTags: ['inkAnnex', 'aloneRuin'],
    whoWantsWhat:
      'A spectral echo of a disgraced Headmaster wants you to claim the Unbound Quill from a crumbling pedestal before the ink-rot completely consumes it.',
    firstObjective: 'Safely extract the floating quill from a massive, pooling puddle of acidic, sentient ink.',
    refuseOrWalkAway:
      'The ink-rot spreads to the structural supports, collapsing the floor and plunging you into the dangerous Under-Stacks without a light source.',
    mapPin: 'The Sunken Annex',
    stampAlts: ['Ruin-Seeker', 'The Expelled', 'Ink-Blind'],
    threeBeats: [
      'The spectral voice guides you past crumbling statues to the pedestal.',
      'Use a discarded glass vial to bypass the acid and snatch the quill.',
      'Bind the quill to your soul to cast your first spell, but suffer permanent, annoying whispers from the dead Headmaster.',
    ],
    doNot: 'Do not involve active dorm politics or train conductors; this is an isolated, forgotten, and forbidden piece of the school’s past.',
  },
  {
    bibleId: 'void-audience',
    spineId: 'camp-arena-bloodmatch',
    title: 'Bleed for the Stream',
    openingFamily: 'Camp / Arena Pen',
    familyTags: ['arena'],
    whoWantsWhat:
      'The Arena Promoter wants you to survive the first blood-match in a flashy way to attract high-tier Void Patrons to his channel.',
    firstObjective: 'Defeat the chained gladiator using only environmental traps to secure your first Viewer Tip.',
    refuseOrWalkAway:
      'You are thrown into the arena completely unarmed with zero camera coverage, meaning no Patron buffs.',
    mapPin: 'Blood-Pit Alpha',
    stampAlts: ['Content', 'Stream-Meat', 'Gladiator'],
    threeBeats: [
      'Promoter slaps a camera-drone onto your shoulder.',
      'Lure the brute into the spike-pit.',
      'Get your first UI notification of a “Donation,” granting a minor healing potion, but you are locked into a stream contract.',
    ],
    doNot: 'Do not involve religious sacrifices or solitary ruins; this is loud, obnoxious, commercialized bloodsport.',
  },
  {
    bibleId: 'void-audience',
    spineId: 'ruin-viewer-bounty',
    title: 'Deep Dark Content',
    openingFamily: 'Alone Ruin',
    familyTags: ['aloneRuin'],
    whoWantsWhat:
      'A hovering Camera-Bot informs you that the viewers in chat want to see you dive into the darkest part of the ruins, offering a bounty for a shadow-beast core.',
    firstObjective: 'Hunt and extract the core of a stalker-beast in the pitch-black basement.',
    refuseOrWalkAway: 'Chat gets bored and leaves; you lose all ambient light buffs provided by the Camera-Bot.',
    mapPin: 'Collapsed Cellar',
    stampAlts: ['Solo-Caster', 'Void-Bait', 'Trend-Chaser'],
    threeBeats: [
      'Bot projects a chat window showing a 500-credit bounty.',
      'Kill the stalker-beast in the dark.',
      'Claim the credits to buy a flashlight, but a viewer puts a hit out on you for “kill-stealing.”',
    ],
    doNot: 'Do not involve promoters or priests; this is a solo survival horror stream driven entirely by anonymous chat text.',
  },
  {
    bibleId: 'void-audience',
    spineId: 'cathedral-algorithmic-heresy',
    title: 'Broadcast of the Faithful',
    openingFamily: 'Cathedral',
    familyTags: ['cathedral'],
    whoWantsWhat:
      'The High Priest of the Broadcast wants you to execute a heretic on live feed to appease the algorithmic gods of the Void.',
    firstObjective: 'Ignite the sacrificial pyre using your starter spell while staring directly into the main scrying orb.',
    refuseOrWalkAway: 'You are declared the new heretic and immediately hunted by the zealot congregation.',
    mapPin: 'The Grand Scrying Altar',
    stampAlts: ['Zealous-Feed', 'Algo-Blessed', 'Priest-Caste'],
    threeBeats: [
      'High Priest anoints your head with thermal paste.',
      'Cast your spell to light the pyre.',
      'Gain the “Blessed by the Algorithm” buff, but your alignment is permanently shifted to dark.',
    ],
    doNot: 'Do not involve gladiator promoters or solo chat bots; this is highly ritualized, religious techno-worship.',
  },
  {
    bibleId: 'void-audience',
    spineId: 'transit-sponsor-blackbox',
    title: 'Sponsored Crash Landing',
    openingFamily: 'Transit / Dropship',
    familyTags: ['dropship'],
    whoWantsWhat:
      'A desperate corporate AI on the failing dropship’s PA system wants you to recover the broadcast black-box so the sponsor doesn’t lose their ad-revenue from your impending crash.',
    firstObjective:
      'Rip the heavy black-box from the burning cockpit console before explosive decompression kills you.',
    refuseOrWalkAway:
      'The ship explodes; you survive the emergency pod but lose all starting loot and drop to negative viewer-reputation before you even start the game.',
    mapPin: 'Smoldering Dropship Hull',
    stampAlts: ['Corporate-Asset', 'Crash-Test', 'Sponsored-Fodder'],
    threeBeats: [
      'The PA system promises an exclusive Tier-1 loot crate if you save the stream data.',
      'Brave the electrical fire and yank out the server-box.',
      'Eject via the pod with the box, gaining your first Corporate Sponsor, but you start the game with burn damage.',
    ],
    doNot: 'Do not involve religious rituals, altars, or melee gladiator arenas; this is pure, high-tech, corporate stream economics.',
  },
  {
    bibleId: 'hollow-core',
    spineId: 'ruin-meditation-cave',
    title: 'Condensing the First Drop',
    openingFamily: 'Alone Ruin / Cave',
    familyTags: ['cave'],
    whoWantsWhat:
      'A lingering illusion of an ascended master wants you to condense your first Qi drop by surviving the extreme pressure of the cave’s gravity well.',
    firstObjective: 'Meditate in the center of the gravity well for 3 minutes without losing consciousness.',
    refuseOrWalkAway: 'Your meridians calcify, capping your cultivation potential at the mortal tier.',
    mapPin: 'Gravity Well Core',
    stampAlts: ['Void-Rooted', 'Lone Cultivator', 'Dust-Mortal'],
    threeBeats: [
      'The illusion critiques your terrible posture.',
      'Endure the crushing gravity to form your core.',
      'Break through to the first stage, but shatter every bone in your left arm in the process.',
    ],
    doNot: 'Do not involve sect elders or mortal gangs; this is an isolated, internal journey of hardcore cultivation.',
  },
  {
    bibleId: 'hollow-core',
    spineId: 'academy-sect-harvest',
    title: 'The Price of the Outer Court',
    openingFamily: 'Academy / Sect',
    familyTags: ['sect', 'academy'],
    whoWantsWhat:
      'The Outer Sect Elder wants you to harvest spirit-herbs from the deadly cliffside to pay for your entry into the Outer Court.',
    firstObjective: 'Climb the Jade Cliff and harvest 5 Blood-Lotus flowers while fending off territorial wind-eagles.',
    refuseOrWalkAway: 'You are rejected from the Sect and beaten by the gate guards for wasting their time.',
    mapPin: 'The Jade Cliff Face',
    stampAlts: ['Outer-Disciple', 'Herb-Gatherer', 'Sect-Scum'],
    threeBeats: [
      'Elder tosses you a woven basket and points to the cliff.',
      'Harvest the lotuses while punching eagles.',
      'Receive your Sect uniform, but you are assigned to the lowest tier of housing.',
    ],
    doNot: 'Do not involve gravity wells or mortal cities; keep it within the strict hierarchy of a martial sect.',
  },
  {
    bibleId: 'hollow-core',
    spineId: 'camp-crippled-master',
    title: 'The Beggar’s Vengeance',
    openingFamily: 'Camp / Village',
    familyTags: ['teahouse'],
    whoWantsWhat:
      'A crippled beggar who was once a grandmaster wants you to avenge him by delivering a specialized Crippling Palm technique to the local gang leader.',
    firstObjective: 'Defeat the gang leader’s two enforcers at the teahouse to draw him into the open.',
    refuseOrWalkAway:
      'The beggar refuses to teach you martial arts, leaving you a defenseless mortal in a town run by thugs.',
    mapPin: 'The Broken Teapot Inn',
    stampAlts: ['Street-Rat', 'Avenging Fist', 'Mortal-Dog'],
    threeBeats: [
      'Beggar transfers a single spark of Qi into your palm.',
      'Beat the enforcers using the borrowed power.',
      'Gain the manual for the Crippling Palm, but become the prime target of the local criminal underworld.',
    ],
    doNot: 'Do not involve grand sects or gravity caves; this is wuxia-style street-level revenge.',
  },
  {
    bibleId: 'hollow-core',
    spineId: 'hollow-spirit-pact',
    title: 'Unsealing the Beast',
    openingFamily: 'Hollow / Prison Cavern',
    familyTags: ['spiritBeast'],
    whoWantsWhat:
      'A chained, three-tailed spirit beast wants you to scrape away the Qi-suppression runes on its cage so it can form a desperate life-binding contract with you to survive.',
    firstObjective: 'Use your own blood to physically overwrite the three primary suppression runes etched into the iron bars.',
    refuseOrWalkAway:
      'The beast is harvested by arriving sect elders; you are trapped in the hollow and forced to cultivate using scraps of tainted, ambient Qi.',
    mapPin: 'The Binding Cavern',
    stampAlts: ['Beast-Bound', 'Seal-Breaker', 'Hollow-Vessel'],
    threeBeats: [
      'The fox telepathically promises you immense elemental power in exchange for your blood.',
      'Bleed onto the runes, taking raw health damage to shatter the seal.',
      'The beast shrinks and binds to your core, granting your first powerful skill, but a major Sect now hunts you for stealing their prize.',
    ],
    doNot: 'Do not involve street-level wuxia gangs or formal sect hierarchies; this is a forbidden, solitary monster pact.',
  },
  {
    bibleId: 'dungeon-transport',
    spineId: 'hollow-core-defense',
    title: 'First Line of Defense',
    openingFamily: 'Hollow / Core Room',
    familyTags: ['coreRoom'],
    whoWantsWhat:
      'The damaged, sentient Dungeon Core wants you to construct basic traps to defend it from a currently invading party of novice adventurers.',
    firstObjective: 'Place 3 spike traps in the entryway and bait the rogue into stepping on one.',
    refuseOrWalkAway: 'The adventurers smash the core, and you die alongside the dungeon.',
    mapPin: 'The Shattered Heart',
    stampAlts: ['Minion', 'Core-Bound', 'Architect'],
    threeBeats: [
      'The Core pulsates frantically, transferring a dungeon-building UI to your vision.',
      'Place the traps and aggro the rogue.',
      'Loot the dead rogue for your first real weapon, but you are now permanently bound to the Core’s health pool.',
    ],
    doNot: 'Do not involve goblin politics or digging out mimics; this is purely about immediate core survival and trap placement.',
  },
  {
    bibleId: 'dungeon-transport',
    spineId: 'camp-minion-raid',
    title: 'Feeding the Lower Floors',
    openingFamily: 'Camp / Barracks',
    familyTags: ['barracks'],
    whoWantsWhat:
      'The local Goblin Boss wants you to lead a raiding party to the surface to steal supplies from a merchant cart to feed the starving minions on Floor 22.',
    firstObjective: 'Ambush the merchant cart at the dungeon entrance and steal a crate of iron rations.',
    refuseOrWalkAway: 'The goblins decide you look tasty enough to solve their food crisis instead.',
    mapPin: 'Surface Tunnel Exit',
    stampAlts: ['Raider', 'Meat-Shield', 'Floor-Boss (Trainee)'],
    threeBeats: [
      'Goblin Boss hands you a rusty cleaver and a sack.',
      'Kill the hired guards and grab the rations.',
      'Deliver the food to gain the loyalty of the goblin squad, but surface humans now post a bounty on your head.',
    ],
    doNot: 'Do not involve the Core directly or trapped monsters; focus on the logistical, monstrous side of running a dungeon.',
  },
  {
    bibleId: 'dungeon-transport',
    spineId: 'ruin-trapped-mimic',
    title: 'Unearth the Vault',
    openingFamily: 'Alone Ruin',
    familyTags: ['mimicVault', 'aloneRuin'],
    whoWantsWhat:
      'A trapped, surprisingly talkative Mimic wants you to help it break free from a collapsed tunnel so it can become the cornerstone of your new dungeon floor.',
    firstObjective: 'Mine away the rubble trapping the Mimic using a rusted pickaxe found nearby.',
    refuseOrWalkAway:
      'The Mimic starves to death, and you miss out on acquiring your first elite monster spawner.',
    mapPin: 'Collapsed Treasure Vault',
    stampAlts: ['Digger', 'Monster-Tamer', 'Vault-Keeper'],
    threeBeats: [
      'The chest yells insults at you until you pick up the pickaxe.',
      'Clear the rubble and fight off the cave-leeches that spawn.',
      'The Mimic joins your roster, but it demands a cut of all gold you find from now on.',
    ],
    doNot: 'Do not involve goblin raids or core defense; this is about exploring a ruined dungeon and recruiting weird monsters.',
  },
  {
    bibleId: 'dungeon-transport',
    spineId: 'transit-fodder-rebellion',
    title: 'Mutiny in the Menagerie',
    openingFamily: 'Transit / Slave Cart',
    familyTags: ['slaveCart'],
    whoWantsWhat:
      'A hulking Orc brute chained next to you wants you to smash the cart’s delicate mana-axle so you can both escape being delivered as fodder to a Floor 10 Boss.',
    firstObjective:
      'Kick the overloaded mana-crystal under the floorboards to shatter the axle while the beast-tamer driver is distracted.',
    refuseOrWalkAway:
      'You are successfully transported and tossed directly into a boss arena, starting your game with 1 HP, no weapon, and immediate aggro.',
    mapPin: 'Iron-Bar Monster Cart',
    stampAlts: ['Fodder', 'Cart-Meat', 'Rebel'],
    threeBeats: [
      'The Orc points out the glowing, fragile axle with a grunt and a nod.',
      'Kick the crystal, causing the cart to violently flip off the road.',
      'Loot the dead driver’s keys to free yourself, but the Orc takes the only good weapon and leaves you to fend for yourself.',
    ],
    doNot: 'Do not involve building traps, defending a core, or exploring ruins; you are actively escaping being imported into someone else’s dungeon ecosystem.',
  },
];

const SPINE_BIBLE_IDS: readonly LitRpgSpineBibleId[] = [
  'summoned-pact',
  'hero-awakening',
  'system-integration',
  'gatebreak-ward',
  'ascending-spire',
  'fabled-legacy',
  'inkbound-academy',
  'void-audience',
  'hollow-core',
  'dungeon-transport',
];

export function isLitRpgSpineBibleId(id: string | null | undefined): id is LitRpgSpineBibleId {
  return SPINE_BIBLE_IDS.includes(id as LitRpgSpineBibleId);
}

export function isLitRpgSpineQuestId(id: string | undefined): boolean {
  return /^(sp|ha|si|gw|as|fl|ia|va|hc|dt|sr|gh|ec|rg|sh|dw|ac|tl|rm|cd|wm|ht|ck|mr|bc|vb|sv|sc)-spine-/.test(id ?? '');
}

export function spineQuestId(spine: LitRpgMainSpine): string {
  return `${BIBLE_PREFIX[spine.bibleId]}-spine-${spine.spineId}`;
}

export function spinesForBible(bibleId: string | null | undefined): LitRpgMainSpine[] {
  if (!isLitRpgSpineBibleId(bibleId)) return [];
  return LITRPG_MAIN_SPINES.filter((s) => s.bibleId === bibleId);
}

function familyScore(hay: string, tags: OpeningFamilyTag[]): number {
  let n = 0;
  for (const tag of tags) {
    if (FAMILY_PATTERNS[tag].test(hay)) n += 1;
  }
  return n;
}

export function hookCtxFromState(state: {
  campaignBibleId?: string | null;
  seed?: string;
  saveId?: string;
  currentLocation?: string;
  openingEstablishment?: { pickedHook?: string; pickedHookFallback?: string } | null;
}): SpineMatchCtx {
  return {
    bibleId: state.campaignBibleId,
    hookBlob: [
      state.openingEstablishment?.pickedHook,
      state.openingEstablishment?.pickedHookFallback,
      state.currentLocation,
    ]
      .filter(Boolean)
      .join('\n'),
    seed: state.seed ?? state.saveId ?? '0',
    location: state.currentLocation,
  };
}

export function matchLitRpgMainSpine(
  bibleId: string | null | undefined,
  hookBlob?: string,
  location?: string
): LitRpgMainSpine | null {
  const pool = spinesForBible(bibleId);
  if (!pool.length) return null;
  const hay = `${hookBlob ?? ''} ${location ?? ''}`.replace(/\s+/g, ' ').trim();
  if (!hay) return null;
  let best: LitRpgMainSpine | null = null;
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

export function matchLitRpgMainSpineFromCtx(ctx: SpineMatchCtx): LitRpgMainSpine | null {
  return matchLitRpgMainSpine(ctx.bibleId, ctx.hookBlob, ctx.location);
}

export function spineToStarterQuest(spine: LitRpgMainSpine): StarterQuestSeed {
  return {
    id: spineQuestId(spine),
    title: spine.title,
    description: `${spine.whoWantsWhat} If you refuse or walk away: ${spine.refuseOrWalkAway}`,
    recommendedLevel: 1,
    objectives: [spine.firstObjective],
    location: spine.mapPin,
    type: 'main',
  };
}

/** Prepend the matched spine seed. Old starters (sp-quest-1, etc.) stay on the list. */
export function withMatchedLitRpgSpine(
  seeds: StarterQuestSeed[],
  ctx: SpineMatchCtx
): StarterQuestSeed[] {
  const spine = matchLitRpgMainSpineFromCtx(ctx);
  if (spine) {
    const extra = spineToStarterQuest(spine);
    if (seeds.some((s) => s.id === extra.id)) return seeds;
    return [extra, ...seeds];
  }
  return withMatchedTabletopSpine(withMatchedStoryRpgSpine(seeds, ctx), ctx);
}

function hashSeed(raw: string): number {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** One stamp from the chosen spine, seed-stable. Never dumps the whole list. */
export function pickSpineStampAlt(spine: LitRpgMainSpine, seed?: string): string {
  const alts = spine.stampAlts.filter((s) => s.trim());
  if (!alts.length) return '';
  const idx = hashSeed(`${seed ?? '0'}|${spine.bibleId}|${spine.spineId}|stamp`) % alts.length;
  return alts[idx];
}

export function resolveLitRpgFolkStamp(state: {
  campaignBibleId?: string | null;
  seed?: string;
  saveId?: string;
  currentLocation?: string;
  openingEstablishment?: { pickedHook?: string; pickedHookFallback?: string } | null;
}): string | undefined {
  const ctx = hookCtxFromState(state);
  const spine = matchLitRpgMainSpineFromCtx(ctx);
  if (spine) {
    const picked = pickSpineStampAlt(spine, ctx.seed);
    return picked || undefined;
  }
  const story = matchStoryRpgMainSpineFromCtx(ctx);
  if (story) {
    return pickStoryRpgStampAlt(story, ctx.seed) || undefined;
  }
  const tabletop = matchTabletopMainSpineFromCtx(ctx);
  if (!tabletop) return undefined;
  return pickTabletopStampAlt(tabletop, ctx.seed) || undefined;
}
