/**
 * Outdoor hub graph for Act-3/4/5 sandbox — named travel targets, not MMO art.
 * Full banks: Summoned Pact / Hero Awakening.
 * Densified LitRPG: System Integration, Gatebreak, Ascending Spire, Fabled Legacy.
 * Floored LitRPG: Inkbound Academy, Void Audience, Hollow Core, Dungeon Transport.
 * Flagship ports: Cursed Keep (tabletop) + Salt Road (story-RPG).
 * PYOA and blank canvases stay empty (Mode DNA / custom shell).
 */

import type { CampaignBible } from './campaignBibleTypes.ts';
import type { GameState, PlaceRecord } from './types.ts';
import { placeIdFromName } from './places.ts';

export interface OutdoorHub {
  id: string;
  name: string;
  blurb: string;
  threatTier: number;
  linkedQuestIds?: string[];
  aliases?: string[];
}

export const SUMMONED_PACT_HUBS: OutdoorHub[] = [
  { id: 'sp-hub-lowmarket', name: 'Lowmarket', blurb: 'Crowded stalls, fences, and Earth junk buyers.', threatTier: 1, linkedQuestIds: ['sp-quest-side-junk'], aliases: ['the Lowmarket'] },
  { id: 'sp-hub-west-wall', name: 'West Wall', blurb: 'Battlements and gate traffic above the city.', threatTier: 2, aliases: ['the west wall', 'Valespire west wall'] },
  { id: 'sp-hub-weighing-cup', name: 'The Weighing Cup', blurb: 'Inn and rumor house near the cathedral close.', threatTier: 1, aliases: ['Weighing Cup'] },
  { id: 'sp-hub-contract-hall', name: 'Contract Hall', blurb: 'Notice-board and Crown job postings.', threatTier: 1, linkedQuestIds: ['sp-quest-1'], aliases: ['the Contract Hall'] },
  { id: 'sp-hub-cathedral-close', name: 'Cathedral Close', blurb: 'Courtyard and kitchens around Valespire Cathedral.', threatTier: 1, linkedQuestIds: ['sp-quest-side-child'], aliases: ['the close'] },
  { id: 'sp-hub-undercroft', name: 'Cathedral Undercroft', blurb: 'Numbered dungeon floors under the cathedral.', threatTier: 2, aliases: ['Undercroft'] },
  { id: 'sp-hub-palace', name: 'Palace Approach', blurb: 'Guarded approach to Pellane\'s palace ledgers.', threatTier: 2, linkedQuestIds: ['sp-quest-special-ledger'], aliases: ['the palace', 'Valespire Palace'] },
  { id: 'sp-hub-cinderflow', name: 'Cinderflow Road', blurb: 'East road toward Ash Court territory.', threatTier: 3, linkedQuestIds: ['sp-quest-special-other'], aliases: ['the Cinderflow'] },
  { id: 'sp-hub-harbor', name: 'Harbor Quay', blurb: 'Grain ships, smugglers, and quay gossip.', threatTier: 2, aliases: ['the quay', 'Valespire harbor'] },
  { id: 'sp-hub-war-camp', name: 'Pellane War Camp', blurb: 'Banner-smoke and quartermaster crates beyond the walls.', threatTier: 2, aliases: ['war camp', 'the war camp'] },
  { id: 'sp-hub-kitchen-saint', name: 'Kitchen Saint Alley', blurb: 'Bread steam and quiet charity behind the close.', threatTier: 1, linkedQuestIds: ['sp-quest-side-child'], aliases: ['Kitchen Saint', 'kitchen alley'] },
];

export const HERO_AWAKENING_HUBS: OutdoorHub[] = [
  { id: 'ha-hub-ashline', name: 'Ashline Yard', blurb: 'Crew staging and informal job board.', threatTier: 1, linkedQuestIds: ['ha-quest-2'], aliases: ['the Yard', 'Ashline'] },
  { id: 'ha-hub-low-watt', name: 'The Low Watt', blurb: 'Food-and-rumor hub after clears.', threatTier: 1, aliases: ['Low Watt'] },
  { id: 'ha-hub-ward-rest', name: 'Ward Rest', blurb: 'Healers\' tent and collapse survivors.', threatTier: 1, aliases: ['Ward Rest infirmary'] },
  { id: 'ha-hub-mca-desk', name: 'MCA Field Desk', blurb: 'Auditor stamps and late-registration forms.', threatTier: 1, aliases: ['Meridian desk', 'MCA desk'] },
  { id: 'ha-hub-threshold', name: 'First Threshold Gate', blurb: 'The rift that nearly killed you — still unstable.', threatTier: 2, linkedQuestIds: ['ha-quest-1'], aliases: ['the Threshold', 'Threshold gate'] },
  { id: 'ha-hub-scrap', name: 'Scrap Fence Alley', blurb: 'Pax Orr\'s curios and hush prices.', threatTier: 2, linkedQuestIds: ['ha-quest-side-fence'], aliases: ['scrap alley', 'fence alley'] },
  { id: 'ha-hub-market', name: 'Lampmere Market', blurb: 'Mixed-folk stalls and Grade gossip.', threatTier: 1, aliases: ['the market', 'Lampmere'] },
  { id: 'ha-hub-wall', name: 'Meridian Wall', blurb: 'Night watch and Threshold seam watchers.', threatTier: 2, aliases: ['the wall', 'city wall'] },
  { id: 'ha-hub-archive', name: 'Quiet Archive', blurb: 'Soft research stacks — Quiet Hands leave traces.', threatTier: 1, linkedQuestIds: ['ha-quest-special-name'], aliases: ['the archive'] },
  { id: 'ha-hub-vesper', name: 'Vesper Backroom', blurb: 'Cartel hush ledger behind a false stamp desk.', threatTier: 2, linkedQuestIds: ['ha-quest-side-fence'], aliases: ['vesper room', 'cartel backroom'] },
];

/** System Integration — modern / store-dungeon / riverside urban. */
export const SYSTEM_INTEGRATION_HUBS: OutdoorHub[] = [
  { id: 'si-hub-street', name: 'Cracked Street', blurb: 'Your Integration start — cracked asphalt and a blue panel.', threatTier: 1, linkedQuestIds: ['si-quest-1'], aliases: ['cracked city street', 'the street'] },
  { id: 'si-hub-store', name: 'Convenience Store Dungeon', blurb: 'Tier-1 micro-dungeon seeded into a corner shop.', threatTier: 2, linkedQuestIds: ['si-quest-1'], aliases: ['the store', 'convenience store'] },
  { id: 'si-hub-riverside', name: 'Riverside Stronghold', blurb: 'Sanctioned hub — housing, crafting, Wave duty.', threatTier: 2, linkedQuestIds: ['si-quest-2'], aliases: ['Riverside', 'the stronghold'] },
  { id: 'si-hub-corridor', name: 'Contested Corridor', blurb: 'Two-hour run between street and Riverside.', threatTier: 2, aliases: ['the corridor'] },
  { id: 'si-hub-wave-wall', name: 'Wave Wall', blurb: 'Reinforced perimeter waiting for the next surge.', threatTier: 2, linkedQuestIds: ['si-quest-3'], aliases: ['the wall', 'hub wall'] },
  { id: 'si-hub-dead-border', name: 'Dead Zone Border', blurb: 'Violet-sky edge where panels go dark.', threatTier: 3, linkedQuestIds: ['si-quest-4'], aliases: ['dead zone', 'the border'] },
  { id: 'si-hub-broker', name: 'Broker Alley', blurb: 'Anonymous intel for Mana Crystal fragments.', threatTier: 2, aliases: ['the Broker', 'broker alley'] },
  { id: 'si-hub-okafor', name: "Okafor's Probe Lab", blurb: 'System Probe research stacked on scavenged servers.', threatTier: 1, aliases: ['Yusuf lab', 'probe lab'] },
  { id: 'si-hub-crystal', name: 'Mana Crystal Exchange', blurb: 'Barter stalls stamped with System Coin rumors.', threatTier: 1, aliases: ['crystal exchange', 'mana market'] },
];

/** Gatebreak Ward — militia / subway / urban breach. */
export const GATEBREAK_WARD_HUBS: OutdoorHub[] = [
  { id: 'gw-hub-shelter', name: 'Ward 9 Shelter', blurb: 'Civilian bunker and scrap beds.', threatTier: 1, linkedQuestIds: ['gatebreak-ward-quest-1'], aliases: ['the shelter', 'Ward 9'] },
  { id: 'gw-hub-militia', name: 'Militia Post', blurb: 'Sergeant Rill\'s clipboard and armbands.', threatTier: 1, aliases: ['militia desk', 'Rill\'s post'] },
  { id: 'gw-hub-subway', name: 'Subway Gate', blurb: 'Unscheduled B-gate under the tracks.', threatTier: 3, linkedQuestIds: ['gatebreak-ward-quest-1'], aliases: ['the subway', 'subway B-gate'] },
  { id: 'gw-hub-guild', name: 'Guild Desk', blurb: 'Licensed hunters and contract smiles.', threatTier: 2, aliases: ['hunter guild', 'Vex\'s desk'] },
  { id: 'gw-hub-scrap', name: 'Scrap Market', blurb: 'Unlicensed loot and quiet buyers.', threatTier: 2, aliases: ['the scrap market'] },
  { id: 'gw-hub-evac', name: 'Evacuation Yard', blurb: 'Rumored exits for people with working cars.', threatTier: 1, aliases: ['evac yard'] },
  { id: 'gw-hub-armband', name: 'Armband Depot', blurb: 'Militia kit lockers and night-shift lists.', threatTier: 1, aliases: ['armband locker', 'depot'] },
  { id: 'gw-hub-roof', name: 'Night Watch Roof', blurb: 'District sightlines over blooming gate bruises.', threatTier: 2, aliases: ['watch roof', 'roof post'] },
];

/** Ascending Spire — tower floors, climb pressure, altitude. */
export const ASCENDING_SPIRE_HUBS: OutdoorHub[] = [
  { id: 'as-hub-gate', name: 'Spire Gate Plaza', blurb: 'Permits, intel buyers, and the black tower.', threatTier: 1, linkedQuestIds: ['ascending-spire-quest-1'], aliases: ['Spire Gate', 'the plaza'] },
  { id: 'as-hub-board', name: 'Ranking Board', blurb: 'Public climb ranks — fame and assassins.', threatTier: 1, aliases: ['the board', 'climber board'] },
  { id: 'as-hub-camp', name: 'Climber Camp', blurb: 'Tents and ration brick smoke outside the gate.', threatTier: 1, aliases: ['the camp'] },
  { id: 'as-hub-floor1', name: 'Floor 1 Antechamber', blurb: 'First sealed biome before the Floor Warden.', threatTier: 2, linkedQuestIds: ['ascending-spire-quest-1'], aliases: ['Floor 1', 'antechamber'] },
  { id: 'as-hub-broker', name: 'Map Broker Stall', blurb: 'Verified floor intel for Spire Coin.', threatTier: 1, aliases: ['map broker', 'broker stall'] },
  { id: 'as-hub-rival', name: 'Rival Guild Tent', blurb: 'Cheerful climbers who may steal your clear.', threatTier: 2, aliases: ['rival tent', 'guild tent'] },
  { id: 'as-hub-scaffold', name: 'Wind Scaffold', blurb: 'Altitude staging — height pressure before Floor 2.', threatTier: 2, aliases: ['scaffold', 'wind deck'] },
  { id: 'as-hub-coin', name: 'Spire Coin Exchange', blurb: 'Drop buyers and permit renewals under the tower.', threatTier: 1, aliases: ['coin exchange', 'spire coin'] },
];

/** Fabled Legacy — heirloom / village mythic tone. */
export const FABLED_LEGACY_HUBS: OutdoorHub[] = [
  { id: 'fl-hub-square', name: 'Mossford Square', blurb: 'Quiet village heart between mill and chapel.', threatTier: 1, linkedQuestIds: ['fl-quest-1'], aliases: ['the square', 'Mossford'] },
  { id: 'fl-hub-inn', name: 'The Crooked Beam', blurb: 'Inn where wounded strangers collapse.', threatTier: 1, linkedQuestIds: ['fl-quest-1'], aliases: ['Crooked Beam', 'the inn'] },
  { id: 'fl-hub-chapel', name: 'Chapel Menhir', blurb: 'Old Faith stone behind the village.', threatTier: 1, aliases: ['the menhir', 'chapel stone'] },
  { id: 'fl-hub-smithy', name: 'Marta\'s Smithy', blurb: 'Forge heat and ceremonial sickle work.', threatTier: 1, linkedQuestIds: ['fl-quest-2'], aliases: ['the smithy', 'blacksmith'] },
  { id: 'fl-hub-trail', name: 'Greentooth Trailhead', blurb: 'Lower hills path toward the Hollow Cairn.', threatTier: 2, linkedQuestIds: ['fl-quest-3'], aliases: ['trailhead', 'lower hills'] },
  { id: 'fl-hub-mill', name: 'River Tess Mill', blurb: 'Mill noise and valley gossip.', threatTier: 1, aliases: ['the mill'] },
  { id: 'fl-hub-bakery', name: "Fen's Bakery", blurb: 'Warm loaves and harvest-festival planning.', threatTier: 1, aliases: ['the bakery', 'Fen bakery'] },
  { id: 'fl-hub-cairn', name: 'Hollow Cairn Approach', blurb: 'Deep-hills path where first kings were forgotten.', threatTier: 3, linkedQuestIds: ['fl-quest-3', 'fl-quest-4'], aliases: ['Hollow Cairn', 'the cairn'] },
];

/** Inkbound Academy — school houses, ledgers, campus politics (not street clones). */
export const INKBOUND_ACADEMY_HUBS: OutdoorHub[] = [
  { id: 'ia-hub-dorm', name: 'Quill Dormitory', blurb: 'Blank Class Codex beds and schedule ink that writes itself.', threatTier: 1, linkedQuestIds: ['inkbound-academy-quest-1'], aliases: ['the dorm', 'Quill dorm'] },
  { id: 'ia-hub-courtyard', name: 'Lecture Courtyard', blurb: 'Opening lecture stone and courtyard duel chalk.', threatTier: 1, linkedQuestIds: ['inkbound-academy-quest-1'], aliases: ['the courtyard', 'duel yard'] },
  { id: 'ia-hub-ledger', name: 'House Ledger Hall', blurb: 'Public Ink Points board — sabotage is illegal if caught.', threatTier: 1, aliases: ['ledger hall', 'house board'] },
  { id: 'ia-hub-atelier', name: 'Living Ink Atelier', blurb: 'Handwriting grades and smudged glyph misfires.', threatTier: 1, aliases: ['the atelier', 'ink atelier'] },
  { id: 'ia-hub-stack', name: 'Restricted Stack', blurb: 'Basement library that rearranges itself into footnotes.', threatTier: 2, aliases: ['the stack', 'restricted stack'] },
  { id: 'ia-hub-dean', name: "Dean's Discipline Office", blurb: 'Red pen that edits reality — Solenne\'s desk.', threatTier: 2, aliases: ['discipline office', 'dean office'] },
  { id: 'ia-hub-quad', name: 'Rival House Quad', blurb: 'House challenge banners and scored rivalries.', threatTier: 2, aliases: ['house quad', 'the quad'] },
  { id: 'ia-hub-refectory', name: 'Campus Refectory', blurb: 'Meal trays, roommate schemes, and exam rumors.', threatTier: 1, aliases: ['the refectory', 'campus mess'] },
];

/** Void Audience — spectacle, performance, Threshold / Resonance. */
export const VOID_AUDIENCE_HUBS: OutdoorHub[] = [
  { id: 'va-hub-auditor', name: "Auditor's Desk", blurb: 'Void negotiation — Flaws, Boons, and Cosmic Favor.', threatTier: 1, linkedQuestIds: ['va-quest-1'], aliases: ['the Auditor', 'void desk'] },
  { id: 'va-hub-inn', name: 'Threshold Inn', blurb: 'Pellara\'s shelter for unusual arrivals.', threatTier: 1, linkedQuestIds: ['va-quest-2'], aliases: ['the inn', 'Pellara\'s inn'] },
  { id: 'va-hub-node', name: 'Threshold Node Plaza', blurb: 'Crystalline Node and Caster Drenn\'s suspicion.', threatTier: 2, linkedQuestIds: ['va-quest-3'], aliases: ['the Node', 'Threshold Node'] },
  { id: 'va-hub-stage', name: 'Resonance Stage', blurb: 'Spectacle ground — Audience CF loves a performance.', threatTier: 2, aliases: ['the stage', 'resonance stage'] },
  { id: 'va-hub-gallery', name: 'Gallery Viewing Tier', blurb: 'Metaphor seats for The Gallery\'s combat taste.', threatTier: 1, aliases: ['gallery tier', 'viewing tier'] },
  { id: 'va-hub-reborn', name: 'Reborn Meeting Ground', blurb: 'Eye-shimmer meetings — Kael and other trials.', threatTier: 2, linkedQuestIds: ['va-quest-3'], aliases: ['reborn ground', 'trial meet'] },
  { id: 'va-hub-scout', name: 'Academy Scout Camp', blurb: 'Solenne\'s scouts sniff anomalous mana signatures.', threatTier: 2, aliases: ['scout camp', 'academy camp'] },
  { id: 'va-hub-mana', name: 'Wild Mana Field Edge', blurb: 'Flee path when Threshold gets too watched.', threatTier: 3, aliases: ['mana field', 'wild field'] },
];

/** Hollow Core — underground core, excavation, empty heart. */
export const HOLLOW_CORE_HUBS: OutdoorHub[] = [
  { id: 'hc-hub-chamber', name: 'Core Chamber', blurb: 'Your glowing crystal — Expand, Spawn, Bargain menus.', threatTier: 1, linkedQuestIds: ['hollow-core-quest-1'], aliases: ['the core', 'crystal chamber'] },
  { id: 'hc-hub-spur', name: 'First Tunnel Spur', blurb: 'Half-collapsed cave spur waiting for room claims.', threatTier: 1, linkedQuestIds: ['hollow-core-quest-1'], aliases: ['tunnel spur', 'first spur'] },
  { id: 'hc-hub-nursery', name: 'Spawn Nursery', blurb: 'Whisper-Mite sarcasm and first defender eggs.', threatTier: 1, aliases: ['the nursery', 'spawn bay'] },
  { id: 'hc-hub-bargain', name: 'Bargain Antechamber', blurb: 'Where adventurers knock before they mine you.', threatTier: 2, aliases: ['bargain hall', 'antechamber'] },
  { id: 'hc-hub-face', name: 'Excavation Face', blurb: 'Mana-hungry dig — grow or starve the hollow.', threatTier: 2, aliases: ['dig face', 'excavation'] },
  { id: 'hc-hub-border', name: 'Rival Core Border', blurb: 'Other cores press your territory seams.', threatTier: 3, aliases: ['core border', 'rival border'] },
  { id: 'hc-hub-hunter', name: 'Hunter Staging Shelf', blurb: 'Guild scouts stage capture kits above your roof.', threatTier: 2, aliases: ['hunter shelf', 'bren shelf'] },
  { id: 'hc-hub-heart', name: 'Hollow Heart Vault', blurb: 'Empty-heart motif chamber — theme binding waits.', threatTier: 2, aliases: ['hollow heart', 'heart vault'] },
];

/** Dungeon Transport — transit platforms, routes, safe rooms. */
export const DUNGEON_TRANSPORT_HUBS: OutdoorHub[] = [
  { id: 'dt-hub-f1', name: 'Floor 1 Stone Corridor', blurb: 'Damp torches and the first Descent Log scratches.', threatTier: 1, linkedQuestIds: ['dt-quest-1'], aliases: ['Floor 1', 'stone corridor'] },
  { id: 'dt-hub-gatekeeper', name: 'Gatekeeper Boss Door', blurb: 'Core-window boss room — only down from here.', threatTier: 2, linkedQuestIds: ['dt-quest-1'], aliases: ['Gatekeeper door', 'boss door'] },
  { id: 'dt-hub-f2', name: 'Floor 2 Flooded Platform', blurb: 'Transit deck over flooded cavern routes.', threatTier: 2, linkedQuestIds: ['dt-quest-2'], aliases: ['Floor 2', 'flooded platform'] },
  { id: 'dt-hub-scratch', name: "Scratch's Nest Overlook", blurb: 'Sentient Cave Imp shortcuts for food and light.', threatTier: 2, linkedQuestIds: ['dt-quest-2'], aliases: ['Scratch nest', 'imp overlook'] },
  { id: 'dt-hub-safe', name: 'Safe Room Rest Shrine', blurb: 'Rest Cycle chamber — door only opens outward.', threatTier: 1, linkedQuestIds: ['dt-quest-3'], aliases: ['safe room', 'rest shrine'] },
  { id: 'dt-hub-merchant', name: 'Wandering Merchant Stall', blurb: 'Silent inflated prices between floors.', threatTier: 1, aliases: ['merchant stall', 'wandering merchant'] },
  { id: 'dt-hub-log', name: 'Descent Log Alcove', blurb: 'Previous delver messages — Kira\'s voice in stone.', threatTier: 1, aliases: ['log alcove', 'descent log'] },
  { id: 'dt-hub-shaft', name: 'Abyssal Transit Shaft', blurb: 'Only-down elevator of stairs between biomes.', threatTier: 2, aliases: ['transit shaft', 'descent shaft'] },
  { id: 'dt-hub-seam', name: 'Seam Crawlspace', blurb: 'Hairline template mismatch — rumor of a way up.', threatTier: 3, linkedQuestIds: ['dt-quest-4'], aliases: ['the seam', 'crawlspace'] },
];

/** Cursed Keep — flagship tabletop (thin). */
export const CURSED_KEEP_HUBS: OutdoorHub[] = [
  { id: 'ck-hub-inn', name: 'Greyhollow Inn', blurb: 'Last coach stop — warm ale, cold silence.', threatTier: 1, linkedQuestIds: ['ck-quest-1'], aliases: ['the inn', 'Greyhollow Tavern', 'the tavern'] },
  { id: 'ck-hub-church', name: 'Greyhollow Church', blurb: 'Father Aldous and six sleepless nights.', threatTier: 1, linkedQuestIds: ['ck-quest-2'], aliases: ['the church', 'the chapel'] },
  { id: 'ck-hub-gate', name: 'Keep Gate', blurb: 'Chained gate on the granite hill — footprints stop here.', threatTier: 2, linkedQuestIds: ['ck-quest-1'], aliases: ['the keep gate', 'Greymark gate'] },
  { id: 'ck-hub-graveyard', name: 'Greyhollow Graveyard', blurb: 'Fresh graves opened from the inside.', threatTier: 2, linkedQuestIds: ['ck-quest-2'], aliases: ['the graveyard'] },
  { id: 'ck-hub-apothecary', name: 'Mira\'s Apothecary', blurb: 'Remedies and a decade of hidden journals.', threatTier: 1, linkedQuestIds: ['ck-quest-3'], aliases: ['the apothecary', 'apothecary shop'] },
  { id: 'ck-hub-treeline', name: 'Blackspine Treeline', blurb: 'Forest edge where kindling baskets tip over.', threatTier: 2, aliases: ['the treeline', 'Blackspine edge'] },
];

/** Salt Road Heist — flagship story-RPG (thin). */
export const SALT_ROAD_HUBS: OutdoorHub[] = [
  { id: 'sr-hub-waystation', name: 'Salt Road Waystation', blurb: 'Staging point before the Consul\'s caravan.', threatTier: 1, linkedQuestIds: ['salt-road-heist-quest-1'], aliases: ['the waystation', 'Salt Road'] },
  { id: 'sr-hub-caravan', name: 'Consul Caravan Camp', blurb: 'Guards, sealed crates, and the tax ledger.', threatTier: 2, linkedQuestIds: ['salt-road-heist-quest-1'], aliases: ['caravan camp', 'the caravan'] },
  { id: 'sr-hub-safehouse', name: 'Safehouse Alley', blurb: 'Vessa\'s bribe-priced bolt-hole.', threatTier: 1, aliases: ['the safehouse', 'Vessa\'s alley'] },
  { id: 'sr-hub-fence', name: 'Harbor Fence', blurb: 'Coast buyers for hot ledgers.', threatTier: 2, aliases: ['the fence', 'harbor buyer'] },
  { id: 'sr-hub-market', name: 'Bribe Market', blurb: 'Every favor has a Salt Road price.', threatTier: 1, aliases: ['the bribe market'] },
  { id: 'sr-hub-checkpoint', name: 'Checkpoint Rise', blurb: 'Heat rises here — papers or a fight.', threatTier: 2, aliases: ['the checkpoint'] },
];

/** Shattered Coast — tabletop coast flagship (Saltmar + atlas outlying, 29e follow-up). */
export const SHATTERED_COAST_HUBS: OutdoorHub[] = [
  { id: 'sc-hub-saltmar', name: 'Saltmar', blurb: 'Cliff-city capital of the Compact.', threatTier: 1, linkedQuestIds: ['sc-quest-1'], aliases: ['Saltmar City', 'the harborside streets of Saltmar'] },
  { id: 'sc-hub-lower', name: 'Lower Ward', blurb: 'Harbor, fish markets, and sea-cave undercity.', threatTier: 1, linkedQuestIds: ['sc-quest-1'], aliases: ['Saltmar Lower Ward', 'the harbor'] },
  { id: 'sc-hub-middle', name: 'Middle Ward', blurb: 'Markets and workshops on the cliff face.', threatTier: 1, linkedQuestIds: ['sc-quest-2'], aliases: ['Saltmar Middle Ward'] },
  { id: 'sc-hub-upper', name: 'Upper Ward', blurb: 'Guild halls and Sentinel barracks atop the cliffs.', threatTier: 2, linkedQuestIds: ['sc-quest-3'], aliases: ['Saltmar Upper Ward'] },
  { id: 'sc-hub-lift', name: 'Great Lift', blurb: 'Counterweight elevators between the three wards.', threatTier: 1, aliases: ['the Great Lift'] },
  { id: 'sc-hub-brinewatch', name: 'Brinewatch', blurb: 'Fishing town under a salt-stained keep.', threatTier: 1, aliases: ['Brinewatch Town', 'the fishing town'] },
  { id: 'sc-hub-keep', name: 'Salt-Stained Keep', blurb: 'Keep above Brinewatch harbor — dungeon site.', threatTier: 2, linkedQuestIds: ['sc-quest-4'], aliases: ['the keep', 'salt keep'] },
  { id: 'sc-hub-stonevein', name: 'Stonevein Quarry', blurb: 'Quarry and dwarf-cut halls.', threatTier: 2, linkedQuestIds: ['sc-quest-2'], aliases: ['Stonevein', 'the quarry'] },
];

const HUBS_BY_BIBLE: Record<string, OutdoorHub[]> = {
  'summoned-pact': SUMMONED_PACT_HUBS,
  'hero-awakening': HERO_AWAKENING_HUBS,
  'system-integration': SYSTEM_INTEGRATION_HUBS,
  'gatebreak-ward': GATEBREAK_WARD_HUBS,
  'ascending-spire': ASCENDING_SPIRE_HUBS,
  'fabled-legacy': FABLED_LEGACY_HUBS,
  'inkbound-academy': INKBOUND_ACADEMY_HUBS,
  'void-audience': VOID_AUDIENCE_HUBS,
  'hollow-core': HOLLOW_CORE_HUBS,
  'dungeon-transport': DUNGEON_TRANSPORT_HUBS,
  'cursed-keep': CURSED_KEEP_HUBS,
  'salt-road-heist': SALT_ROAD_HUBS,
  'shattered-coast': SHATTERED_COAST_HUBS,
};

export function hubsForBibleId(bibleId: string | undefined | null): OutdoorHub[] {
  if (!bibleId) return [];
  return HUBS_BY_BIBLE[bibleId] ?? [];
}

export function hubsForBible(bible: CampaignBible | undefined | null): OutdoorHub[] {
  return hubsForBibleId(bible?.id);
}

function hubToPlace(
  hub: OutdoorHub,
  atlas?: { settlements?: Array<{ name: string; aliases?: string[]; biome?: string; regionId?: string; allowsDungeon?: boolean }> } | null
): PlaceRecord {
  const dangerTier = hub.threatTier <= 1 ? 1 : hub.threatTier <= 2 ? 2 : 3;
  const settle = atlas?.settlements?.find(
    (s) =>
      s.name.toLowerCase() === hub.name.toLowerCase() ||
      hub.aliases?.some((a) => a.toLowerCase() === s.name.toLowerCase()) ||
      s.aliases?.some((a) => a.toLowerCase() === hub.name.toLowerCase())
  );
  return {
    id: placeIdFromName(hub.name),
    name: hub.name,
    aliases: Array.from(
      new Set([...(hub.aliases ?? []), ...(settle?.aliases ?? [])])
    ).slice(0, 12),
    threatTier: hub.threatTier,
    dangerTier: dangerTier as 1 | 2 | 3 | 4,
    mapScale: hub.threatTier >= 3 ? 'region' : 'street',
    arcStatus: 'open',
    mapCanonical: true,
    biome: settle?.biome,
    allowsDungeon: settle?.allowsDungeon,
    regionId: settle?.regionId,
  };
}

/** Seed hub places on New Game without overwriting visited arcs. Joins atlas settlements when names match. */
export function seedOutdoorHubPlaces(
  places: PlaceRecord[] | undefined,
  bible: CampaignBible | undefined | null,
  atlas?: GameState['worldAtlas']
): PlaceRecord[] {
  const hubs = hubsForBible(bible);
  if (!hubs.length) return places ?? [];
  let next = [...(places ?? [])];
  for (const hub of hubs) {
    const place = hubToPlace(hub, atlas);
    const existing = next.find(
      (p) =>
        p.id === place.id
        || p.name.toLowerCase() === place.name.toLowerCase()
        || p.aliases?.some((a) => a.toLowerCase() === place.name.toLowerCase())
    );
    if (existing) {
      next = next.map((p) =>
        p.id === existing.id
          ? {
              ...p,
              threatTier: p.threatTier ?? place.threatTier,
              dangerTier: p.dangerTier ?? place.dangerTier,
              mapCanonical: p.mapCanonical ?? place.mapCanonical,
              biome: p.biome ?? place.biome,
              regionId: p.regionId ?? place.regionId,
              allowsDungeon: p.allowsDungeon ?? place.allowsDungeon,
              aliases: Array.from(new Set([...(p.aliases ?? []), ...(place.aliases ?? [])])).slice(0, 12),
            }
          : p
      );
    } else {
      next.push(place);
    }
  }
  return next;
}

/** Hub names for Local map pins (fogged until visited). Prefer bible bank; fall back to places. */
export function hubLandmarkNames(state: {
  campaignBibleId?: string | null;
  places?: PlaceRecord[];
}): string[] {
  const fromBible = hubsForBibleId(state.campaignBibleId).map((h) => h.name);
  if (fromBible.length) return fromBible;
  return (state.places ?? [])
    .filter((p) => p.mapScale === 'street' || p.mapScale === 'region' || typeof p.threatTier === 'number')
    .map((p) => p.name)
    .filter(Boolean);
}

/** Visited hub names (lastVisitedTurn set) — stay open on the street map. */
export function visitedHubLandmarkNames(state: {
  campaignBibleId?: string | null;
  places?: PlaceRecord[];
}): string[] {
  const hubs = hubsForBibleId(state.campaignBibleId);
  const hubKeys = new Set(
    hubs.flatMap((h) => [h.name.toLowerCase(), ...(h.aliases ?? []).map((a) => a.toLowerCase())])
  );
  return (state.places ?? [])
    .filter((p) => {
      if (typeof p.lastVisitedTurn !== 'number') return false;
      if (!hubs.length) return true;
      const key = p.name.toLowerCase();
      return hubKeys.has(key) || hubs.some((h) => placeIdFromName(h.name) === p.id);
    })
    .map((p) => p.name);
}

/** Merge hub pins into outdoor landmarks without duplicating here / harvested names. */
export function mergeHubLandmarks(
  landmarks: string[],
  state: { campaignBibleId?: string | null; places?: PlaceRecord[] },
  here?: string
): string[] {
  const hereKey = (here ?? '').trim().toLowerCase();
  const seen = new Set(
    landmarks.map((n) => n.trim().toLowerCase()).filter(Boolean)
  );
  const out = [...landmarks];
  for (const name of hubLandmarkNames(state)) {
    const key = name.trim().toLowerCase();
    if (!key || key === hereKey || seen.has(key)) continue;
    if (hereKey && hereKey.includes(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function matchHub(
  hubs: OutdoorHub[],
  placeName: string | undefined
): OutdoorHub | null {
  const key = (placeName ?? '').trim().toLowerCase();
  if (!key) return null;
  return (
    hubs.find(
      (h) =>
        h.name.toLowerCase() === key
        || h.aliases?.some((a) => a.toLowerCase() === key)
        || key.includes(h.name.toLowerCase())
    ) ?? null
  );
}

export function formatOutdoorHubsForPrompt(state: GameState): string {
  const hubs = hubsForBibleId(state.campaignBibleId);
  if (!hubs.length) return '';
  const here = (state.currentLocation ?? '').toLowerCase();
  const lines = hubs.map((h) => {
    const visited = (state.places ?? []).some(
      (p) =>
        (p.name.toLowerCase() === h.name.toLowerCase() || p.id === placeIdFromName(h.name))
        && typeof p.lastVisitedTurn === 'number'
    );
    const at = here.includes(h.name.toLowerCase()) ? ' ← HERE' : '';
    const pin = visited ? 'visited' : 'mapped';
    const quests = h.linkedQuestIds?.length ? ` quests=${h.linkedQuestIds.join(',')}` : '';
    return `- ${h.name} [Tier ${h.threatTier}, ${pin}]${at}: ${h.blurb}${quests}`;
  });
  return `[OUTDOOR HUBS — travel targets in this starting region. Player may leave the spine. Do not invent licensed place names.]\n${lines.join('\n')}`;
}

/** Light travel pads when outdoors — never invent crowd; skip during opening covers / alone first beats. */
export function outdoorHubTravelChoices(state: GameState, max = 2): string[] {
  if (state.openingEstablishment?.complete === false) return [];
  if (state.activeDungeon) return [];
  if (state.activeEncounter) return [];
  const hubs = hubsForBibleId(state.campaignBibleId);
  if (!hubs.length) return [];
  const here = (state.currentLocation ?? '').toLowerCase();
  const candidates = hubs.filter((h) => !here.includes(h.name.toLowerCase()));
  const activeIds = new Set(
    (state.quests ?? []).filter((q) => q.status === 'active' && q.revealed).map((q) => q.id)
  );
  const scored = [...candidates].sort((a, b) => {
    const aLink = a.linkedQuestIds?.some((id) => activeIds.has(id)) ? 0 : 1;
    const bLink = b.linkedQuestIds?.some((id) => activeIds.has(id)) ? 0 : 1;
    if (aLink !== bLink) return aLink - bLink;
    const aVis = (state.places ?? []).some(
      (p) => p.name.toLowerCase() === a.name.toLowerCase() && p.lastVisitedTurn != null
    )
      ? 1
      : 0;
    const bVis = (state.places ?? []).some(
      (p) => p.name.toLowerCase() === b.name.toLowerCase() && p.lastVisitedTurn != null
    )
      ? 1
      : 0;
    return aVis - bVis;
  });
  return scored.slice(0, max).map((h) => `Travel toward ${h.name}`);
}

/** Parse "Travel toward X" / "Return to X" into a known hub when possible. */
export function parseTravelDestination(
  action: string,
  bibleId: string | undefined | null
): OutdoorHub | null {
  const a = (action ?? '').replace(/\s+/g, ' ').trim();
  const m = a.match(/^(?:travel\s+toward|return\s+to)\s+(.+)$/i);
  if (!m) return null;
  const name = m[1].replace(/[.!?]+$/, '').trim();
  return matchHub(hubsForBibleId(bibleId), name);
}

/**
 * When code snaps location to a hub but GM prose still narrates the old room,
 * prepend a short arrival beat so Travel is not theater (matrix-40 Summoned Pact).
 */
export function ensureTravelArrivalProse(
  prose: string,
  hubName: string,
  fromLocation?: string | null
): string {
  const text = (prose ?? '').trim();
  const hub = hubName.trim();
  if (!hub) return text;
  const mentionsHub = new RegExp(hub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text);
  const from = (fromLocation ?? '').trim();
  const stillAtFrom =
    from.length > 3
    && new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 40), 'i').test(text.slice(0, 280))
    && !mentionsHub;
  if (mentionsHub && !stillAtFrom) return text;
  const leave = from
    ? `You leave ${from} behind and reach ${hub}.`
    : `You reach ${hub}.`;
  if (!text) return leave;
  if (stillAtFrom || !mentionsHub) {
    return `${leave} ${text}`;
  }
  return text;
}
