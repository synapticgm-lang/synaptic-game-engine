// Dice book 2 config (2d6, content/pyoa/DICE-RULES.md): "The Last Train to Cinderfall". Original setting: a burned steppe and its last railway.
export const SLUG = 'cinderfall';
export const TITLE = 'The Last Train to Cinderfall';
export const PFX = 'cf';
export const SEED = 20261031;
export const STATS = ['BRAWN', 'CUNNING', 'COMPOSURE', 'MECHANICS'];
export const FALLBACK = 'dead-steam';
export const WORLD = `BOOK: "The Last Train to Cinderfall", an original gamebook of steam, ash and old debts (second person, present tense, British spelling). The Long Fire burned the Ashen Steppe to grey grass-stubble and ash-dunes, and only one thing still crosses it: the Iron Road, a single railway line from Ashgate Junction to Cinderfall, the last walled city, whose Water Gate (the great reservoir works) was shut by the Rail Barons. The reader is the fireman-guard of Locomotive No. 9, the Marrowbone. Their driver, Hesper Quill, has vanished from the depot at Ashgate, leaving the engine idling and a sealed order: carry the Water Key (a brass valve-key as long as a forearm) to Cinderfall and open the Water Gate before the ash-storm season shuts the line. There is a storm clock. Everyone wants the Key.
TONE: soot, rust, hot brass and cold ash, a long road under a low sky, melancholy with dry humour in the people. Low magic only (signals that remember, bargains in boiler-rooms, omens in the smoke). No guns, no modern slang. Never mention dice, rolls, stats, targets, marks, sections, pages or "you chose".
PLACES: Ashgate Junction (depot town of gangers and signal-boxes; stranded carriages, the Stationmaster's rivals, the ticket-widow, the water-seller with no water). The Cinder Steppe (ash-dunes, a graveyard of stalled trains used as a market, sulphur wells, burned-out stations, the Grey Bazaar on a stopped goods train). Brasswind Viaduct (a toll-city built on and among a mile of rail bridge by the Rail Barons; gantries and ladders). The Hollow Cut (the tunnel system under the last range, home of the Hollow Signalmen and the old Stationmaster-General's keep).
FACTIONS: the Rail Barons (money, schedule, order); the Gangers' Union (track crews, your own people); the Cinder Prophets (the fire was a teacher); the Hollow Signalmen (ghost signal-keepers who run the lines at night); the Stationmaster-General (a very old woman who keeps the Cinderfall Gate by timetable).
STATS the engine rolls: ${'BRAWN, CUNNING, COMPOSURE, MECHANICS'}. Never name them in prose.`;
export const REGION_NOTE = [
  'Region 0, THE DEPOT (prologue): the idling engine, the sealed order, learning the first test with a gentle, low-stakes risk.',
  'Region 1, ASHGATE JUNCTION (Act I hub): rival crews, the Gangers\' Union, the ticket-widow, the Barons\' agents, clues to Hesper; the reader gathers a first ally.',
  'Region 2, THE CINDER STEPPE (the crossing): stalled trains, sulphur wells, the Grey Bazaar, the Cinder Prophets; resource pressure from fuel and water.',
  'Region 3, BRASSWIND VIADUCT (toll-city intrigue): the Rail Barons, a heist or a bargain, a route to the Hollow Cut.',
  'Region 4, THE HOLLOW CUT (the tunnels): the Hollow Signalmen, the Stationmaster-General, a moral trial, the question of what happened to Hesper.',
  'Region 5, CINDERFALL TERMINUS (finale): the Water Gate itself, the final choices, the storm closing in; when the storm clock runs out the finale is forced.',
];
export const REGIONS = [
  { n: 0, name: 'The Depot', budget: 40, stat: ['CUNNING', 'MECHANICS'] },
  { n: 1, name: 'Ashgate Junction', budget: 160, stat: ['BRAWN', 'CUNNING', 'COMPOSURE', 'MECHANICS'] },
  { n: 2, name: 'The Cinder Steppe', budget: 220, stat: ['COMPOSURE', 'BRAWN', 'MECHANICS', 'CUNNING'] },
  { n: 3, name: 'Brasswind Viaduct', budget: 220, stat: ['CUNNING', 'COMPOSURE', 'MECHANICS', 'BRAWN'] },
  { n: 4, name: 'The Hollow Cut', budget: 200, stat: ['COMPOSURE', 'CUNNING', 'BRAWN', 'MECHANICS'] },
  { n: 5, name: 'Cinderfall Terminus', budget: 120, stat: ['COMPOSURE', 'BRAWN', 'CUNNING', 'MECHANICS'] },
];
// key, title, sections, region whose reward plants the hook, hook (for the prose prompt)
export const ENDINGS = [
  { key: 'open-the-gate', title: 'Open the Water Gate', len: 4, region: 4, hook: 'the reader earns the trust of someone who keeps the old timetable and the old promises' },
  { key: 'baron-bargain', title: "The Baron's Bargain", len: 3, region: 3, hook: 'the reader strikes a profitable understanding with the Rail Barons' },
  { key: 'burn-the-line', title: 'Burn the Iron Road', len: 3, region: 2, hook: 'the reader learns where the line is soaked in fuel and brittle, and what it would take to light it' },
  { key: 'ganger-republic', title: "The Gangers' Republic", len: 3, region: 1, hook: 'the reader wins the loyalty of the track crews' },
  { key: 'prophets-pyre', title: "The Prophets' Pyre", len: 3, region: 2, hook: 'the reader is shown the Cinder Prophets\' teaching and what they would do with the Key' },
  { key: 'signal-eternal', title: 'Signalman Eternal', len: 3, region: 4, hook: 'the reader is offered a place among the ghost signal-keepers' },
  { key: 'last-train-out', title: 'The Last Train Out', len: 3, region: 3, hook: 'the reader learns the schedule for a train that could take the survivors east instead' },
  { key: 'hesper-returns', title: "Hesper's Return", len: 4, region: 4, hook: 'the reader finds a trace proving the driver is alive somewhere down the line' },
  { key: 'gate-flood', title: 'The Flooded Terminus', len: 3, region: 4, hook: 'the reader learns what happens if the Water Gate is opened too wide and too fast' },
  { key: 'quiet-siding', title: 'The Quiet Siding', len: 3, region: 2, hook: 'the reader finds a forgotten siding where a person could simply stop and let the world go on without them' },
  { key: 'stationmasters-heir', title: "The Stationmaster's Heir", len: 3, region: 3, hook: 'the reader is judged worthy of an old, heavy post' },
  { key: 'dead-steam', title: 'Dead Steam', len: 2, region: 0, hook: '' },
];
