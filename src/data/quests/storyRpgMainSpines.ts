import type { StarterQuestSeed } from '@/game/questPlay';

export interface StoryRpgMatchCtx {
  bibleId?: string | null;
  hookBlob?: string;
  seed?: string;
  location?: string;
}

/**
 * Story RPG main-quest spines (2026-09-17). Gemini Pro web pack via clipboard
 * paste. Journal / spoken copy only — no new FSM, XP, or unequip locks.
 */

export type StoryRpgSpineBibleId =
  | 'salt-road-heist'
  | 'glass-harbor-letters'
  | 'embercourt-oath'
  | 'rainglass-case'
  | 'static-house'
  | 'driftwake-crew'
  | 'ashline-convoy'
  | 'twin-lanterns'
  | 'redmesa-claim'
  | 'cape-district-vigil'
  | 'wayfarers-map'
  | 'hearthwick-teas';

export type StoryRpgFamilyTag =
  | 'loft'
  | 'cliff'
  | 'countingHouse'
  | 'safehouse'
  | 'cafe'
  | 'customs'
  | 'docks'
  | 'chapel'
  | 'cells'
  | 'feast'
  | 'morgue'
  | 'tram'
  | 'club'
  | 'attic'
  | 'cellar'
  | 'porch'
  | 'galley'
  | 'fog'
  | 'hold'
  | 'convoyTail'
  | 'nightCamp'
  | 'ridge'
  | 'stable'
  | 'corridor'
  | 'yard'
  | 'creek'
  | 'claimRidge'
  | 'claimNight'
  | 'pier'
  | 'terminus'
  | 'boarding'
  | 'crossroads'
  | 'mapCliff'
  | 'shrine'
  | 'lane'
  | 'greenhouse'
  | 'alley';

export interface StoryRpgMainSpine {
  bibleId: StoryRpgSpineBibleId;
  spineId: string;
  title: string;
  openingFamily: string;
  familyTags: StoryRpgFamilyTag[];
  whoWantsWhat: string;
  firstObjective: string;
  refuseOrWalkAway: string;
  mapPin: string;
  stampAlts: string[];
  threeBeats: string[];
  doNot: string;
}

const FAMILY_PATTERNS: Record<StoryRpgFamilyTag, RegExp> = {
  loft: /\b(warehouse loft|rafters|catwalks|stolen map of the salt road)\b/i,
  cliff: /\b(cliff path|overhang|wagons below|strike in the pass)\b/i,
  countingHouse: /\b(counting-house|counting house|back door|iron cage|tax ledger is inside)\b/i,
  safehouse: /\b(safehouse|rehearsal went loud|heat is already up|bloodied crowbar)\b/i,
  cafe: /\b(cafe|wet envelope|dead man.?s hand)\b/i,
  customs: /\b(customs|packet is contraband|you opened it)\b/i,
  docks: /\b(docks? at|dawn letters|pilings|foggy pier)\b/i,
  chapel: /\b(side chapel|chapel first|the oath is a whisper)\b/i,
  cells: /\b(cells under|start in a cell|iron grate)\b/i,
  feast: /\b(feast before|feast\. then the vow|high table)\b/i,
  morgue: /\b(morgue|slab|the case has a face)\b/i,
  tram: /\b(tram at night|night tram|rear car)\b/i,
  club: /\b(club with a false name|masked patron|vip booth)\b/i,
  attic: /\b(attic of dead sets|stacked radios|unplugged radio)\b/i,
  cellar: /\b(cellar switchboard|switchboard that predates)\b/i,
  porch: /\b(porch in the storm|have not gone in|front porch)\b/i,
  galley: /\b(galley after|did not come back from watch)\b/i,
  fog: /\b(fog bank|no deck visible|bow)\b/i,
  hold: /\b(hold during a squall|hold first\. deck later)\b/i,
  convoyTail: /\b(convoy.?s tail|back of the line|broken-down axle)\b/i,
  nightCamp: /\b(night camp|no fire|ash takes it)\b/i,
  ridge: /\b(ridge lookout|convoy is a line of insects)\b/i,
  stable: /\b(stable|horse that arrived without a rider|empty saddle)\b/i,
  corridor: /\b(upstairs corridor|two doors|which knock)\b/i,
  yard: /\b(yard at dusk|one lantern is dark|muddy yard)\b/i,
  creek: /\b(dry creek|creek with no water|arroya)\b/i,
  claimRidge: /\b(ridge above the claim|heat-shimmer|sniper)\b/i,
  claimNight: /\b(night on the claim|coyotes that are not)\b/i,
  pier: /\b(pier office|tide returned|jane doe)\b/i,
  terminus: /\b(tram terminus|last tram)\b/i,
  boarding: /\b(boarding house|room 4|tenant who will not come down)\b/i,
  crossroads: /\b(crossroads the map|map is wrong on purpose)\b/i,
  mapCliff: /\b(cliff the map calls a ferry|no ferry|rusted winch)\b/i,
  shrine: /\b(roadside shrine|lost roads|tokens for places that folded)\b/i,
  lane: /\b(lane at opening|opening bell|queue)\b/i,
  greenhouse: /\b(greenhouse|midnight bloom|leaves that should not grow)\b/i,
  alley: /\b(alley behind|spent leaves that steam)\b/i,
};

export const STORY_RPG_MAIN_SPINES: StoryRpgMainSpine[] = [
  {
    bibleId: "salt-road-heist",
    spineId: "sr-spine-counting-house-crack",
    title: "The Ledger Job",
    openingFamily: "Consul counting-house back door",
    familyTags: ["countingHouse"],
    whoWantsWhat: "Kaelen, a disgruntled ledger-clerk, wants the real tax record swapped with a forged copy before morning. He claims the Consul is skimming from the locals and needs proof.",
    firstObjective: "Pick the rusted delivery door lock without waking the guard dogs in the adjacent alley.",
    refuseOrWalkAway: "The clerk panics, attempts it himself, and is arrested by dawn, leaving the crew marked as known associates.",
    mapPin: "Alley behind the Counting-House",
    stampAlts: ["Smuggler", "Forger", "Grifter"],
    threeBeats: ["Kaelen passes the forged ledger through the alley grate", "breach the counting room and swap the books", "deliver the real ledger to a fence for a cut of the recovered coin."],
    doNot: "Do not involve caravan routes or highway ambushes; keep the heat strictly urban and internal.",
  },
  {
    bibleId: "salt-road-heist",
    spineId: "sr-spine-cliff-ambush",
    title: "Drop from Above",
    openingFamily: "cliff path above the road",
    familyTags: ["cliff"],
    whoWantsWhat: "Brask, a local toll-breaker, wants you to drop a rockslide on the next Consul cart. He just wants the distraction to cross the border, you get the spilled cargo.",
    firstObjective: "Rig the loose boulders on the overhang before the lantern-light of the cart rounds the bend.",
    refuseOrWalkAway: "Brask says he will wait for the next crew, and the cart passes safely, taking its gold to the capital.",
    mapPin: "Overhang on the Cliff Path",
    stampAlts: ["Muscle", "Scout", "Rock-climber"],
    threeBeats: ["Brask points out the approaching cart from the ridge", "trigger the slide and climb down into the dust", "loot the strongbox while Brask flees the other way."],
    doNot: "Do not use stealth or urban disguise; this is a loud, physical highway robbery.",
  },
  {
    bibleId: "salt-road-heist",
    spineId: "sr-spine-loft-con",
    title: "The Fake Cargo",
    openingFamily: "warehouse loft",
    familyTags: ["loft"],
    whoWantsWhat: "Olenna, a merchant with massive debts, wants her own warehouse robbed to claim the insurance. She needs it to look like professional work.",
    firstObjective: "Disable the warehouse's internal tripwires from the catwalks without breaking the expensive glass goods.",
    refuseOrWalkAway: "Olenna threatens to tell the guards you broke in, pinning a previous robbery on you.",
    mapPin: "Rafters of Olenna's Warehouse",
    stampAlts: ["Acrobat", "Thief", "Negotiator"],
    threeBeats: ["Olenna hands over the structural blueprints in the loft", "bypass the alarms and extract the marked crates", "get paid from the insurance payout a week later."],
    doNot: "Do not steal actual Consul gold or hit a moving target.",
  },
  {
    bibleId: "salt-road-heist",
    spineId: "sr-spine-loud-rehearsal",
    title: "The Botched Dry-Run",
    openingFamily: "safehouse after loud rehearsal",
    familyTags: ["safehouse"],
    whoWantsWhat: "Jax, your impulsive wheelman, accidentally blew up the model vault door too loudly and now the neighborhood watch is knocking. He wants you to stall them while he hides the gear.",
    firstObjective: "Talk down the angry locals at the front door without letting them see the smoke in the parlor.",
    refuseOrWalkAway: "The watch forces entry, finds the explosives, and the crew must abandon the safehouse immediately.",
    mapPin: "Front Door of the Safehouse",
    stampAlts: ["Charmer", "Thug", "Tinkerer"],
    threeBeats: ["Jax begs for three minutes of stalling", "convince the watch it was just a stove backfire", "secure a new vehicle since the old one is now heavily watched."],
    doNot: "Do not start with a clean, perfectly planned heist; the heat is already on from minute one.",
  },
  {
    bibleId: "glass-harbor-letters",
    spineId: "gh-spine-wet-envelope",
    title: "Ink in the Rain",
    openingFamily: "cafe with wet envelope",
    familyTags: ["cafe"],
    whoWantsWhat: "Elias, a nervous dock-worker, hands over a soaked letter he fished from the bay. He wants it delivered to a specific address because it bears a seal he fears.",
    firstObjective: "Decipher the smeared address on the envelope before the paper degrades completely.",
    refuseOrWalkAway: "Elias leaves it on the table and runs; the cafe owner eventually throws it in the fire.",
    mapPin: "Corner Table at the Cafe",
    stampAlts: ["Courier", "Scholar", "Local"],
    threeBeats: ["Elias pays up front to take the wet letter", "dry and read the obscured destination", "deliver it to the angry recipient who demands to know who opened it."],
    doNot: "Do not deal with customs officials or official post office bureaucracy.",
  },
  {
    bibleId: "glass-harbor-letters",
    spineId: "gh-spine-opened-packet",
    title: "The Broken Seal",
    openingFamily: "customs shed (packet opened)",
    familyTags: ["customs"],
    whoWantsWhat: "Meryl, a corrupt inspector, accidentally opened a blackmail packet meant for a crime boss. She wants you to deliver it and pretend you broke the seal during a scuffle.",
    firstObjective: "Forge a plausible wax seal over the torn flap to make it look like transit damage.",
    refuseOrWalkAway: "Meryl panics and has the guards detain you on smuggling charges to cover her tracks.",
    mapPin: "Inspection Desk in the Customs Shed",
    stampAlts: ["Forger", "Brawler", "Smuggler"],
    threeBeats: ["Meryl offers a bribe to take the blame", "doctor the packet to look roughed up", "face the boss's enforcers who question the damaged goods."],
    doNot: "Do not make the letter a simple love note; it must have immediate, dangerous stakes.",
  },
  {
    bibleId: "glass-harbor-letters",
    spineId: "gh-spine-dawn-docks",
    title: "The Ghost Ship Mail",
    openingFamily: "docks at dawn",
    familyTags: ["docks"],
    whoWantsWhat: "Silas, an old fisherman, claims a ship that sank ten years ago just dropped a lockbox on the pier. He wants you to open it and deliver the letters inside.",
    firstObjective: "Pry the rusted, barnacle-encrusted lockbox open before the tide pulls it back off the planks.",
    refuseOrWalkAway: "Silas drags the heavy box to the harbormaster, where it is locked away and forgotten.",
    mapPin: "Foggy Pier at Dawn",
    stampAlts: ["Mariner", "Lockpick", "Occultist"],
    threeBeats: ["Silas points to the dripping box in the mist", "open it to find perfectly dry, dated letters", "deliver the first letter to an old widow who has been waiting a decade."],
    doNot: "Do not involve internal sorting office politics or blackmail.",
  },
  {
    bibleId: "embercourt-oath",
    spineId: "ec-spine-chapel-secret",
    title: "The Hidden Vow",
    openingFamily: "side chapel",
    familyTags: ["chapel"],
    whoWantsWhat: "Father Tomas wants you to witness a secret, unsanctioned marriage pact between two lesser nobles before the main court wakes.",
    firstObjective: "Stand guard at the chapel doors and ensure no one interrupts the hasty ceremony.",
    refuseOrWalkAway: "Tomas refuses to proceed, and the couple is discovered by morning, starting a feud.",
    mapPin: "Stone Doors of the Side Chapel",
    stampAlts: ["Guard", "Priest", "Diplomat"],
    threeBeats: ["Tomas pulls you into the candlelight", "turn away a suspicious Cinderlane servant at the door", "receive a signet ring of favor as payment for your silence."],
    doNot: "Do not involve the grand hall feasts or public combat.",
  },
  {
    bibleId: "embercourt-oath",
    spineId: "ec-spine-cell-plea",
    title: "The Chained Knight",
    openingFamily: "cells under the hall",
    familyTags: ["cells"],
    whoWantsWhat: "Corin, a disgraced knight locked in the dark, wants you to carry a token to his accuser to prove his innocence before his execution at noon.",
    firstObjective: "Smuggle Corin's blood-stained favor past the dungeon guards without triggering an alarm.",
    refuseOrWalkAway: "Corin curses your cowardice, and the headsman claims him at midday.",
    mapPin: "Iron Grate in the Cells",
    stampAlts: ["Smuggler", "Knight-errant", "Scribe"],
    threeBeats: ["Corin presses the token through the bars", "sneak past the sleeping jailer", "present the token to the Quiet Cloister adjudicator who demands to know how you got it."],
    doNot: "Do not start with a formal audience or high-court politics; keep it gritty and underground.",
  },
  {
    bibleId: "embercourt-oath",
    spineId: "ec-spine-poisoned-cup",
    title: "The Bitter Toast",
    openingFamily: "feast before the vow",
    familyTags: ["feast"],
    whoWantsWhat: "Elara Cinderlane suspects the wine intended for the oath-swearing has been laced withbane. She wants you to swap the goblet before the toast.",
    firstObjective: "Distract the high steward long enough to switch the jeweled goblet on the high table.",
    refuseOrWalkAway: "The toast proceeds, the oath-taker collapses, and the hall devolves into a bloody riot.",
    mapPin: "Shadow Behind the High Table",
    stampAlts: ["Spy", "Courtier", "Apothecary"],
    threeBeats: ["Elara hands you the clean goblet under the table", "execute the swap while the bard plays a loud chord", "demand your payment in a dark alcove as the safe toast concludes."],
    doNot: "Do not focus on dungeon crawls or rural travel; keep it centered on the feast's tension.",
  },
  {
    bibleId: "rainglass-case",
    spineId: "rg-spine-morgue-tag",
    title: "The Swapped Toe-Tag",
    openingFamily: "morgue slab",
    familyTags: ["morgue"],
    whoWantsWhat: "Dr. Aris wants you to find out why a John Doe's toe-tag was swapped with a wealthy alderman's name during his shift. He fears he is being framed for murder.",
    firstObjective: "Examine the corpse's personal effects to identify the real John Doe before the constables arrive.",
    refuseOrWalkAway: "Aris is arrested by morning, and the morgue is locked down as a crime scene.",
    mapPin: "Cold Storage Slab",
    stampAlts: ["Detective", "Medic", "Enforcer"],
    threeBeats: ["Aris points out the mismatch in the freezing room", "find a matchbook from a shady club in the dead man's coat", "visit the club to ask questions and get punched by the bouncer."],
    doNot: "Do not involve glamorous high-society clients or office visits.",
  },
  {
    bibleId: "rainglass-case",
    spineId: "rg-spine-night-tram",
    title: "The End of the Line",
    openingFamily: "night tram",
    familyTags: ["tram"],
    whoWantsWhat: "Conductor Vance wants you to track down the passenger who left a ticking briefcase on the back seat of his empty tram car.",
    firstObjective: "Disarm or safely open the ticking briefcase before the tram reaches the depot.",
    refuseOrWalkAway: "Vance throws the briefcase out the window into the river, destroying the evidence and his job.",
    mapPin: "Rear Car of the Night Tram",
    stampAlts: ["Sleuth", "Tinkerer", "Drifter"],
    threeBeats: ["Vance stops the tram to show you the case", "open it to find not a bomb, but a loudly ticking clockwork vault", "track the etched serial number to a paranoid watchmaker."],
    doNot: "Do not start in the rain-glass office or use standard noir tropes like a dame in distress.",
  },
  {
    bibleId: "rainglass-case",
    spineId: "rg-spine-false-club",
    title: "The Masked Patron",
    openingFamily: "club with a false name",
    familyTags: ["club"],
    whoWantsWhat: "Madame Rose wants you to quietly escort a highly-drugged, very important client out the back door before rival gangs notice his vulnerability.",
    firstObjective: "Support the stumbling client through the crowded dance floor without drawing attention.",
    refuseOrWalkAway: "The client collapses in the center of the room, sparking a gang shootout.",
    mapPin: "VIP Booth in the Club",
    stampAlts: ["Bouncer", "Grifter", "Medic"],
    threeBeats: ["Rose pays you half up front to take the arm of the client", "navigate the hostile crowd to the alley door", "load him into a cab and take the rest of the pay from his deep pockets."],
    doNot: "Do not deal with the police directly or forensic science.",
  },
  {
    bibleId: "static-house",
    spineId: "sh-spine-attic-broadcast",
    title: "The Dead Set Speaks",
    openingFamily: "attic of dead sets",
    familyTags: ["attic"],
    whoWantsWhat: "Old Man Theron wants you to record the numbers coming from an unplugged radio that has been silent for twenty years. He believes it's a message from his lost daughter.",
    firstObjective: "Tune the dial precisely to the fading frequency to catch the complete sequence of numbers.",
    refuseOrWalkAway: "The broadcast fades to static forever, and Theron kicks you out of the attic.",
    mapPin: "Dusty Corner of the Attic",
    stampAlts: ["Listener", "Scavenger", "Medium"],
    threeBeats: ["Theron shushes you as the unplugged radio hums", "write down the coordinates masked in static", "travel to the coordinates to find an old, rusted drop-box holding the real payment."],
    doNot: "Do not involve the active switchboard or professional relay technicians.",
  },
  {
    bibleId: "static-house",
    spineId: "sh-spine-switchboard-ghost",
    title: "The Crossed Wires",
    openingFamily: "cellar switchboard",
    familyTags: ["cellar"],
    whoWantsWhat: "Operator Lin wants you to go into the crawlspace and find out what is physically splicing into the main trunk line. Every call she patches is echoing with screams.",
    firstObjective: "Navigate the flooded cellar crawlspace without electrocuting yourself on the exposed wires.",
    refuseOrWalkAway: "Lin unplugs the board completely, cutting off the house from the outside world.",
    mapPin: "Cellar Crawlspace Entrance",
    stampAlts: ["Technician", "Explorer", "Rat-catcher"],
    threeBeats: ["Lin points a trembling finger at the tangled cords", "crawl in and find an illegal tap made of bone and copper", "cut the tap and get paid out of Lin's personal stash."],
    doNot: "Do not make it about the weather outside or atmospheric phenomena.",
  },
  {
    bibleId: "static-house",
    spineId: "sh-spine-storm-caller",
    title: "The Knock in the Rain",
    openingFamily: "porch in the storm (not inside yet)",
    familyTags: ["porch"],
    whoWantsWhat: "Runner Jace, bleeding on the porch, wants you to take his metal canister inside and plug it into the house's receiver before the things chasing him arrive.",
    firstObjective: "Barricade the heavy front doors against the howling wind and whatever is in the dark.",
    refuseOrWalkAway: "Jace dies on the porch, and the canister is stolen by shadows.",
    mapPin: "Front Porch Steps",
    stampAlts: ["Guard", "Courier", "Survivor"],
    threeBeats: ["Jace shoves the canister into your chest as lightning strikes", "secure the door and rush the canister to the main hall", "plug it in to blast an audio frequency that drives the storm back."],
    doNot: "Do not start inside the house or focus on dusty attic lore.",
  },
  {
    bibleId: "driftwake-crew",
    spineId: "dw-spine-galley-mutiny",
    title: "The Bad Rations",
    openingFamily: "galley after a bad watch",
    familyTags: ["galley"],
    whoWantsWhat: "Cook Silas wants you to sneak into the officer's pantry and steal the good hardtack. He says the crew will riot if they are fed one more bowl of grey slop.",
    firstObjective: "Pick the lock on the officer's pantry while the first mate is asleep next door.",
    refuseOrWalkAway: "The crew strikes at dawn, and you are lumped in with the mutineers when the captain cracks down.",
    mapPin: "Dark Galley Table",
    stampAlts: ["Scrounger", "Smuggler", "Deckhand"],
    threeBeats: ["Silas slides a rusty lockpick across the sticky table", "bypass the lock and bag the provisions", "distribute the food secretly and earn the loyalty of the lower deck."],
    doNot: "Do not involve supernatural elements or the vast ocean outside the ship.",
  },
  {
    bibleId: "driftwake-crew",
    spineId: "dw-spine-fog-shape",
    title: "The Thing in the Mist",
    openingFamily: "fog bank off the bow",
    familyTags: ["fog"],
    whoWantsWhat: "Lookout Finn swears he saw a derelict hull drifting in the fog. He wants you to take the skiff and salvage its logbook before the captain orders them to sail past.",
    firstObjective: "Lower the creaking skiff into the freezing water without alerting the deck officer.",
    refuseOrWalkAway: "The ship sails on, and Finn jumps overboard trying to reach it himself, drowning.",
    mapPin: "Port Bow Railing",
    stampAlts: ["Rigger", "Scavenger", "Swimmer"],
    threeBeats: ["Finn points into the blinding grey mist", "row out and climb aboard the silent derelict", "find the logbook and a small chest of coins before the wreck sinks."],
    doNot: "Do not involve internal ship politics or mutiny.",
  },
  {
    bibleId: "driftwake-crew",
    spineId: "dw-spine-hold-breach",
    title: "The Splintered Hull",
    openingFamily: "hold during a squall",
    familyTags: ["hold"],
    whoWantsWhat: "Bosun Kael wants you to brace a cracking timber in the lower hold while he fetches the pitch. The water is rising fast and the cargo is shifting.",
    firstObjective: "Secure the rolling barrels of lamp oil before they smash into the weakened hull plate.",
    refuseOrWalkAway: "The hull plate bursts, flooding the hold and forcing the ship to jettison half its cargo.",
    mapPin: "Knee-deep Water in the Lower Hold",
    stampAlts: ["Muscle", "Carpenter", "Rigger"],
    threeBeats: ["Kael yells over the storm and leaves you with the bracing beam", "wrestle the heavy barrels into the netting", "hold the beam in place against the ocean's pressure until Kael returns with the seal."],
    doNot: "Do not involve stealth, officer politics, or launching skiffs.",
  },
  {
    bibleId: "ashline-convoy",
    spineId: "ac-spine-tail-guard",
    title: "The Straggler's Toll",
    openingFamily: "convoy tail on the road",
    familyTags: ["convoyTail"],
    whoWantsWhat: "Driver Oakes wants you to hold off the scavenging wild dogs circling his broken-down axle while he swaps the wheel. He refuses to let the convoy leave him behind.",
    firstObjective: "Light a circle of flares around the cart to keep the starved beasts at bay in the dusk.",
    refuseOrWalkAway: "Oakes abandons the cart and runs for the main convoy, losing his entire livelihood.",
    mapPin: "Ruts at the Back of the Line",
    stampAlts: ["Guard", "Beast-hunter", "Mechanic"],
    threeBeats: ["Oakes tosses you a flare as eyes gleam in the brush", "defend the perimeter with loud noises and strikes", "collect your pay from Oakes' lockbox once the wheel is fixed."],
    doNot: "Do not involve ruined village lore or scouting ahead.",
  },
  {
    bibleId: "ashline-convoy",
    spineId: "ac-spine-cold-camp",
    title: "The Fire Thief",
    openingFamily: "night camp (no fire)",
    familyTags: ["nightCamp"],
    whoWantsWhat: "Quartermaster Fenn wants you to track down the drifter who stole their only dry tinder box. Without a fire, the convoy will freeze before morning.",
    firstObjective: "Follow the thief's fresh boot prints in the frost leading away from the wagons.",
    refuseOrWalkAway: "The camp suffers severe frostbite, and morale breaks by dawn.",
    mapPin: "Center of the Dark Camp",
    stampAlts: ["Tracker", "Ranger", "Thug"],
    threeBeats: ["Fenn whispers the problem so panic doesn't spread", "track the thief to a rocky outcrop where he is trying to light it himself", "take the box back and get an extra ration as reward."],
    doNot: "Do not make it about a vehicular breakdown or scouting the next town.",
  },
  {
    bibleId: "ashline-convoy",
    spineId: "ac-spine-ridge-watch",
    title: "The Missing Scouts",
    openingFamily: "ridge lookout",
    familyTags: ["ridge"],
    whoWantsWhat: "Scout Maro wants you to signal the valley below using the semaphore flags. The vanguard is heading straight into an unstable ash-sink and he broke his leg climbing up here.",
    firstObjective: "Decipher Maro's bloodstained code-book to find the sequence for \"halt.\"",
    refuseOrWalkAway: "The vanguard drives into the sinkhole, losing three wagons to the deep ash.",
    mapPin: "High Rocky Ridge",
    stampAlts: ["Scout", "Signaler", "Climber"],
    threeBeats: ["Maro gasps out the warning and shoves the flags at you", "frantically wave the correct pattern as the wagons approach the hazard", "receive a commendation and coin from the convoy leader later."],
    doNot: "Do not focus on internal convoy camp dynamics or broken axles.",
  },
  {
    bibleId: "twin-lanterns",
    spineId: "tl-spine-missing-rider",
    title: "The Empty Saddle",
    openingFamily: "stable (horse without rider)",
    familyTags: ["stable"],
    whoWantsWhat: "Hostler Bren wants you to check the saddlebags of the lathered horse that just galloped in alone. He thinks it belongs to the local magistrate.",
    firstObjective: "Calm the panicked horse enough to approach it and unbuckle the heavy leather bags.",
    refuseOrWalkAway: "Bren locks the stable, and the magistrate's corpse is found in the river three days later, taking the secret with him.",
    mapPin: "Straw-filled Stall",
    stampAlts: ["Animal-handler", "Sleuth", "Hostler"],
    threeBeats: ["Bren hands you a carrot and points to the kicking horse", "retrieve a blood-soaked map from the bags", "follow the map to a shallow grave to find a hidden purse."],
    doNot: "Do not involve the inn's internal rooms or the lantern signals.",
  },
  {
    bibleId: "twin-lanterns",
    spineId: "tl-spine-two-doors",
    title: "The Wrong Room",
    openingFamily: "upstairs corridor (two doors)",
    familyTags: ["corridor"],
    whoWantsWhat: "Maid Tila wants you to retrieve her master key from the room on the left. She dropped it when she saw something terrifying on the bed, and she will be fired if she admits it.",
    firstObjective: "Sneak into the dark room on the left without waking whatever is breathing heavily on the mattress.",
    refuseOrWalkAway: "Tila weeps, confesses to the innkeeper, and is thrown out into the rain.",
    mapPin: "Creaking Floorboard in the Corridor",
    stampAlts: ["Sneak", "Servant", "Drifter"],
    threeBeats: ["Tila begs you to open the door just a crack", "retrieve the shiny key from the rug near the beast's claws", "return the key for Tila's life savings (a handful of copper)."],
    doNot: "Do not make it about outside weather or the stable.",
  },
  {
    bibleId: "twin-lanterns",
    spineId: "tl-spine-dark-lantern",
    title: "The Unlit Signal",
    openingFamily: "yard at dusk (one lantern dark)",
    familyTags: ["yard"],
    whoWantsWhat: "Innkeeper Hollis wants you to climb the slippery pole in the yard and light the second lantern. If it stays dark, the river smugglers will think the inn has been raided.",
    firstObjective: "Climb the rain-slicked wooden pole with a lit torch clutched in your teeth.",
    refuseOrWalkAway: "The smugglers bypass the inn, Hollis loses a massive payout, and blames you.",
    mapPin: "Muddy Yard by the Pole",
    stampAlts: ["Acrobat", "Smuggler", "Local"],
    threeBeats: ["Hollis offers free lodging for a week if you fix the light", "brave the wind and slick wood to ignite the oil", "watch from the roof as a shadowy boat docks, paying your tab."],
    doNot: "Do not involve horses, stable boys, or interior locked doors.",
  },
  {
    bibleId: "redmesa-claim",
    spineId: "rm-spine-dry-creek",
    title: "The Dust Pan",
    openingFamily: "dry creek",
    familyTags: ["creek"],
    whoWantsWhat: "Prospector Dan wants you to dig out a collapsed hollow bank in the dry creek bed. He dropped his grandfather's compass in there before the wall caved.",
    firstObjective: "Shovel out the heavy, packed red dirt before the unstable overhang collapses further.",
    refuseOrWalkAway: "Dan tries to dig it himself, gets buried alive, and the claim reverts to the bank.",
    mapPin: "Collapsed Bank in the Arroya",
    stampAlts: ["Digger", "Explorer", "Drifter"],
    threeBeats: ["Dan offers a split of his next strike for the manual labor", "unearth the tarnished silver compass", "discover a raw nugget lodged inside the compass casing as extra reward."],
    doNot: "Do not involve the saloon or high-ridge sniper lookouts.",
  },
  {
    bibleId: "redmesa-claim",
    spineId: "rm-spine-ridge-watcher",
    title: "The Saboteur's Roost",
    openingFamily: "ridge above the claim",
    familyTags: ["claimRidge"],
    whoWantsWhat: "Sniper Jess wants you to flank the rival claim-jumpers setting up dynamite near the water source down below. She provides cover fire, you cut the fuses.",
    firstObjective: "Scramble down the loose scree slope silently without triggering a rockfall.",
    refuseOrWalkAway: "Jess opens fire alone, gets outgunned, and the water source is destroyed.",
    mapPin: "Sniper's Nest on the Ridge",
    stampAlts: ["Scout", "Sneak", "Gunhand"],
    threeBeats: ["Jess points out the faint glow of the fuses in the dark valley", "slice the cords before the spark reaches the powder", "return to the ridge to split the jumpers' abandoned gear."],
    doNot: "Do not make it about digging dirt or exploring town offices.",
  },
  {
    bibleId: "redmesa-claim",
    spineId: "rm-spine-midnight-prowl",
    title: "The Shadow in the Camp",
    openingFamily: "night on the claim",
    familyTags: ["claimNight"],
    whoWantsWhat: "Miner Cobb wants you to trap the wild coyote that has been stealing their salted meat. He says it walks on two legs.",
    firstObjective: "Construct a heavy deadfall trap using logs and the remaining bait.",
    refuseOrWalkAway: "The camp starves, and the miners abandon the claim by the end of the week.",
    mapPin: "Dying Campfire",
    stampAlts: ["Trapper", "Guard", "Occultist"],
    threeBeats: ["Cobb shows you the strange tracks circling the tents", "bait the trap and wait in the freezing dark", "snare a desperate bandit wearing furs, taking his stolen coin purse."],
    doNot: "Do not involve daytime heat, dry creeks, or ridge warfare.",
  },
  {
    bibleId: "cape-district-vigil",
    spineId: "cd-spine-returned-body",
    title: "The Tide's Toll",
    openingFamily: "pier office (tide-returned body)",
    familyTags: ["pier"],
    whoWantsWhat: "Coroner Vance wants you to identify the strange, glowing chemical burns on the Jane Doe that just washed up. He needs to know if the precinct needs evacuating.",
    firstObjective: "Swab and neutralize the glowing residue on the corpse without burning your own hands.",
    refuseOrWalkAway: "The chemical reacts with the air, starting a localized toxic fire in the pier office.",
    mapPin: "Metal Table in the Pier Office",
    stampAlts: ["Medic", "Sleuth", "Chemist"],
    threeBeats: ["Vance hands you a pair of heavy rubber gloves", "trace the chemical signature to an illegal industrial dump", "raid the dump site for the hazard pay stored in the foreman's safe."],
    doNot: "Do not make it about patrolling rooftops or jumping onto trams.",
  },
  {
    bibleId: "cape-district-vigil",
    spineId: "cd-spine-last-tram",
    title: "The Hijacked Car",
    openingFamily: "tram terminus (last tram)",
    familyTags: ["terminus"],
    whoWantsWhat: "Switchman Cole wants you to board the idling last tram and subdue the thugs who just took the driver hostage. They want to crash it into the precinct.",
    firstObjective: "Pry open the rear emergency door of the tram before it accelerates out of the station.",
    refuseOrWalkAway: "The tram speeds off and derails into the police station, causing massive casualties.",
    mapPin: "Maintenance Pit under the Tram",
    stampAlts: ["Brawler", "Acrobat", "Vigilante"],
    threeBeats: ["Cole throws you a wrench and points to the accelerating car", "break into the back and fight the thugs aisle-by-aisle", "pull the emergency brake and take the gang's stash."],
    doNot: "Do not involve pier offices, bodies, or domestic boarding house issues.",
  },
  {
    bibleId: "cape-district-vigil",
    spineId: "cd-spine-boarding-secret",
    title: "The Upstairs Neighbor",
    openingFamily: "boarding house",
    familyTags: ["boarding"],
    whoWantsWhat: "Landlady Mrs. Grose wants you to evict the man in Room 4 quietly. He has been building something that hums loudly and shorts out the district's power.",
    firstObjective: "Pick the heavy deadbolt on Room 4 without triggering the crude electrified booby trap on the knob.",
    refuseOrWalkAway: "The machine overloads, burning down the boarding house and taking a city block with it.",
    mapPin: "Faded Carpet Outside Room 4",
    stampAlts: ["Sneak", "Tinkerer", "Local"],
    threeBeats: ["Grose hands you a ring of keys and complains about the sparks", "disarm the door and confront the rogue inventor", "smash the machine and claim the exotic battery as your prize."],
    doNot: "Do not involve public transit or harbor crimes.",
  },
  {
    bibleId: "wayfarers-map",
    spineId: "wm-spine-phantom-crossroads",
    title: "The Unwritten Turn",
    openingFamily: "crossroads the map does not admit",
    familyTags: ["crossroads"],
    whoWantsWhat: "Pilgrim Silas wants you to walk down the overgrown path that defies all cartography. He believes it leads to an unplundered tomb, but he is too terrified to go first.",
    firstObjective: "Clear the heavy briars blocking the phantom path using a machete.",
    refuseOrWalkAway: "Silas camps at the crossroads until he starves, unable to move forward or back.",
    mapPin: "Muddy Fork in the Road",
    stampAlts: ["Guide", "Explorer", "Mystic"],
    threeBeats: ["Silas points at the blank space on the parchment", "hack through the unnatural thorns", "discover a forgotten waystone with a silver offering left by ancient travelers."],
    doNot: "Do not involve cliffs, ferries, or urban lofts.",
  },
  {
    bibleId: "wayfarers-map",
    spineId: "wm-spine-fake-ferry",
    title: "The Drop to the River",
    openingFamily: "cliff the map calls a ferry",
    familyTags: ["mapCliff"],
    whoWantsWhat: "Toll-Keeper Jarl wants you to repair the massive, rusted winch system that supposedly lowers travelers down the cliff face. It hasn't moved in a century.",
    firstObjective: "Replace the snapped iron gears in the winch housing while dangling over the edge.",
    refuseOrWalkAway: "Jarl continues to charge people for a broken service, stranding them on the cliff.",
    mapPin: "Rusted Winch at the Cliff Edge",
    stampAlts: ["Mechanic", "Climber", "Rigger"],
    threeBeats: ["Jarl offers a cut of all future tolls if you fix it", "grease and align the heavy iron gears over the abyss", "ride the perilous cage down to claim a chest of old tolls at the bottom."],
    doNot: "Do not involve roadside shrines or cartography tables.",
  },
  {
    bibleId: "wayfarers-map",
    spineId: "wm-spine-lost-shrine",
    title: "The Offering of Dust",
    openingFamily: "roadside shrine to lost roads",
    familyTags: ["shrine"],
    whoWantsWhat: "Monk Kael wants you to track down the thieves who stole the carved wooden idol from the shrine. Without it, the roads in this province will shift and change maliciously.",
    firstObjective: "Identify the boot prints in the mud around the desecrated altar.",
    refuseOrWalkAway: "The local roads warp into a maze, trapping all merchants and travelers in the woods forever.",
    mapPin: "Stone Altar by the Highway",
    stampAlts: ["Tracker", "Zealot", "Guard"],
    threeBeats: ["Kael prays frantically over the empty pedestal", "track the thieves to a nearby hollow and ambush them", "return the idol and receive Kael's blessed compass."],
    doNot: "Do not involve map making in a loft or fixing physical machinery.",
  },
  {
    bibleId: "hearthwick-teas",
    spineId: "ht-spine-missing-key",
    title: "The Locked Bakery",
    openingFamily: "lane at opening bell",
    familyTags: ["lane"],
    whoWantsWhat: "Baker Tom wants you to find the iron key to his shop. He thinks a rival baker tossed it down the storm drain to ruin his morning rush.",
    firstObjective: "Fish the key out of the dark, rushing water of the storm drain using a magnet and string.",
    refuseOrWalkAway: "Tom loses his morning business, bankrupting him, and the rival takes over the street.",
    mapPin: "Cobblestone Street Grate",
    stampAlts: ["Sleuth", "Neighbor", "Tinkerer"],
    threeBeats: ["Tom paces frantically outside his locked door", "retrieve the key from the muck", "unlock the bakery and get rewarded with a week's worth of fresh tarts and gossip."],
    doNot: "Do not go into the tea shop's greenhouse or upstairs rooms.",
  },
  {
    bibleId: "hearthwick-teas",
    spineId: "ht-spine-greenhouse-theft",
    title: "The Stolen Cuttings",
    openingFamily: "greenhouse",
    familyTags: ["greenhouse"],
    whoWantsWhat: "Botanist Elara wants you to find out who snipped the rare Midnight Bloom orchid. It is highly poisonous if brewed incorrectly, and she fears an accident.",
    firstObjective: "Examine the soil for traces of the shears or the footprints of the clumsy thief.",
    refuseOrWalkAway: "Someone in town drinks the poisoned tea by mistake and falls gravely ill.",
    mapPin: "Humid Glass Enclosure",
    stampAlts: ["Herbalist", "Detective", "Scholar"],
    threeBeats: ["Elara shows you the cleanly snipped stem", "trace a trail of dropped petals to the mayor's estate", "confiscate the cutting before it is brewed, earning Elara's rarest herbs as thanks."],
    doNot: "Do not make it about front parlor tea service or alleyways.",
  },
  {
    bibleId: "hearthwick-teas",
    spineId: "ht-spine-alley-shadow",
    title: "The Peeping Tom",
    openingFamily: "alley behind the shop",
    familyTags: ["alley"],
    whoWantsWhat: "Urchin Finn wants you to scare off a hooded figure who has been staring into the tea shop's back windows for three nights. It's bad for Finn's alley-sleeping arrangements.",
    firstObjective: "Ambush the figure from the roof of the shed before they notice you in the alley.",
    refuseOrWalkAway: "The figure breaks into the shop the next night, stealing the cashbox and fleeing town.",
    mapPin: "Trash Cans in the Dark Alley",
    stampAlts: ["Sneak", "Guard", "Drifter"],
    threeBeats: ["Finn points out the shadow lurking by the brick wall", "corner the figure and reveal a disgraced rival merchant", "chase him off and keep the bribe money he drops in his panic."],
    doNot: "Do not involve sunny lane interactions or botanical mysteries inside.",
  }
];

export const STORY_RPG_SPINE_QUEST_ID = /^(sr|gh|ec|rg|sh|dw|ac|tl|rm|cd|wm|ht)-spine-/;

export function isStoryRpgSpineBibleId(id: string | null | undefined): id is StoryRpgSpineBibleId {
  return STORY_RPG_MAIN_SPINES.some((s) => s.bibleId === id);
}

export function isStoryRpgSpineQuestId(id: string | undefined): boolean {
  return STORY_RPG_SPINE_QUEST_ID.test(id ?? '');
}

export function spinesForStoryRpgBible(bibleId: string | null | undefined): StoryRpgMainSpine[] {
  if (!isStoryRpgSpineBibleId(bibleId)) return [];
  return STORY_RPG_MAIN_SPINES.filter((s) => s.bibleId === bibleId);
}

function familyScore(hay: string, tags: StoryRpgFamilyTag[]): number {
  let n = 0;
  for (const tag of tags) {
    if (FAMILY_PATTERNS[tag].test(hay)) n += 1;
  }
  return n;
}

export function matchStoryRpgMainSpine(
  bibleId: string | null | undefined,
  hookBlob?: string,
  location?: string
): StoryRpgMainSpine | null {
  const pool = spinesForStoryRpgBible(bibleId);
  if (!pool.length) return null;
  const hay = `${hookBlob ?? ''} ${location ?? ''}`.replace(/\s+/g, ' ').trim();
  if (!hay) return null;
  let best: StoryRpgMainSpine | null = null;
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

export function matchStoryRpgMainSpineFromCtx(ctx: StoryRpgMatchCtx): StoryRpgMainSpine | null {
  return matchStoryRpgMainSpine(ctx.bibleId, ctx.hookBlob, ctx.location);
}

export function storyRpgSpineToStarterQuest(spine: StoryRpgMainSpine): StarterQuestSeed {
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

export function withMatchedStoryRpgSpine(
  seeds: StarterQuestSeed[],
  ctx: StoryRpgMatchCtx
): StarterQuestSeed[] {
  const spine = matchStoryRpgMainSpineFromCtx(ctx);
  if (!spine) return seeds;
  const extra = storyRpgSpineToStarterQuest(spine);
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

export function pickStoryRpgStampAlt(spine: StoryRpgMainSpine, seed?: string): string {
  const alts = spine.stampAlts.filter((s) => s.trim());
  if (!alts.length) return '';
  const idx = hashSeed(`${seed ?? '0'}|${spine.bibleId}|${spine.spineId}|stamp`) % alts.length;
  return alts[idx];
}
