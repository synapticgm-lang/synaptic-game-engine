/**
 * Hub -> encounter / pressure / hook banks (Act-4/5).
 * Deterministic mix of explore / social / threat by threatTier.
 * Each bible's banks use that world's cast and places — no Pellane clones.
 */

import type { GameState } from './types';
import { hubsForBibleId, matchHub, type OutdoorHub } from './outdoorHubs';

export type HubBeatKind = 'explore' | 'social' | 'threat' | 'hook';

export interface HubArrivalBeat {
  id: string;
  kind: HubBeatKind;
  pressure: string;
  choiceHints: string[];
  contactName?: string;
  revealQuestId?: string;
}

const SP_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'sp-hub-lowmarket': [
    { id: 'lm-explore', kind: 'explore', pressure: 'Stalls, scales, and Earth junk under awnings. Watch pockets.', choiceHints: ['Browse the nearest stall', 'Ask about Earth junk prices', 'Watch the alley mouth'], revealQuestId: 'sp-quest-side-junk' },
    { id: 'lm-social', kind: 'social', pressure: 'A fence signals from a side stall — interested in otherworld scrap.', choiceHints: ['Talk to the fence', 'Offer a kindness to a stall-hand', 'Walk away from the fence'], contactName: 'Lowmarket Fence', revealQuestId: 'sp-quest-side-junk' },
    { id: 'lm-threat', kind: 'threat', pressure: 'Cutpurse eyes on your Earth kit. Pressure, not a full fight yet.', choiceHints: ['Keep a hand on your bag', 'Hard stare at the watcher', 'Slip toward Contract Hall'] },
  ],
  'sp-hub-west-wall': [
    { id: 'ww-explore', kind: 'explore', pressure: 'Battlement wind and gate traffic. Map the approaches.', choiceHints: ['Walk the battlement', 'Watch the gate queue', 'Note the road east'] },
    { id: 'ww-social', kind: 'social', pressure: 'A wall sergeant wants names and business.', choiceHints: ['Talk to the wall sergeant', 'Show courtesy to the watch', 'Walk past without answering'], contactName: 'Wall Sergeant' },
    { id: 'ww-threat', kind: 'threat', pressure: 'Ash-ward rumor from the east road — scouts, not an army.', choiceHints: ['Scout the east road', 'Report the rumor', 'Stay on the wall'], revealQuestId: 'sp-quest-special-other' },
  ],
  'sp-hub-weighing-cup': [
    { id: 'wc-explore', kind: 'explore', pressure: 'Inn common room — rumor heat without a fight.', choiceHints: ['Listen from a corner table', 'Inspect the notice slate', 'Step into the kitchen passage'] },
    { id: 'wc-social', kind: 'social', pressure: 'Brother Tam or a kitchen hand may pass bread and gossip.', choiceHints: ['Talk to Brother Tam', 'Thank the kitchen hand', 'Ask about the marked child'], contactName: 'Brother Tam', revealQuestId: 'sp-quest-side-child' },
    { id: 'wc-hook', kind: 'hook', pressure: 'A quiet tip: palace ledgers do not match the war speeches.', choiceHints: ['Ask about the palace ledger', 'Note the rumor and leave', 'Buy a round for the tipster'], revealQuestId: 'sp-quest-special-ledger' },
  ],
  'sp-hub-contract-hall': [
    { id: 'ch-explore', kind: 'explore', pressure: 'Notice-board and Crown postings. Read before you touch.', choiceHints: ['Read the notice-board', 'Ask the clerk about Pact work', 'Leave without posting'] },
    { id: 'ch-social', kind: 'social', pressure: 'Captain Sera Quill or a Crown clerk is on duty.', choiceHints: ['Talk to Captain Sera Quill', 'Help the Crown clerk sort postings', 'Hard refuse a Pact reminder'], contactName: 'Captain Sera Quill' },
  ],
  'sp-hub-cathedral-close': [
    { id: 'cc-explore', kind: 'explore', pressure: 'Courtyard stone, kitchens, and quiet corners of the close.', choiceHints: ['Walk the close', 'Check the kitchen door', 'Look for panel-glint'], revealQuestId: 'sp-quest-side-child' },
    { id: 'cc-social', kind: 'social', pressure: 'High Chanter Orel Vane or Brother Tam may be in the close.', choiceHints: ['Talk to High Chanter Orel Vane', 'Talk to Brother Tam', 'Walk away from the handlers'], contactName: 'Brother Tam', revealQuestId: 'sp-quest-side-child' },
  ],
  'sp-hub-undercroft': [
    { id: 'uc-explore', kind: 'explore', pressure: 'Numbered dungeon floors under the cathedral — map before you push.', choiceHints: ['Map the first undercroft door', 'Listen at the stair', 'Hold position'] },
    { id: 'uc-threat', kind: 'threat', pressure: 'Something moves on a lower number. Threat pressure, not a boss yet.', choiceHints: ['Advance carefully', 'Fall back to the close', 'Ready a defensive stance'] },
  ],
  'sp-hub-palace': [
    { id: 'pa-explore', kind: 'explore', pressure: 'Guarded approach. Ledgers live past the first gate.', choiceHints: ['Study the palace approach', 'Note the guard pattern', 'Ask for a reason to enter'], revealQuestId: 'sp-quest-special-ledger' },
    { id: 'pa-social', kind: 'social', pressure: 'A Crown clerk bars the way with questions.', choiceHints: ['Talk to the Crown clerk', 'Offer a polite request', 'Hard push for entry'], contactName: 'Crown Clerk', revealQuestId: 'sp-quest-special-ledger' },
  ],
  'sp-hub-cinderflow': [
    { id: 'cf-explore', kind: 'explore', pressure: 'East road dust toward Ash Court territory.', choiceHints: ['Walk the Cinderflow a short span', 'Read the road markers', 'Turn back toward Valespire'], revealQuestId: 'sp-quest-special-other' },
    { id: 'cf-threat', kind: 'threat', pressure: 'Ember-ward scouts or ash-smoke on the horizon.', choiceHints: ['Take cover and watch', 'Hard challenge the road', 'Withdraw to West Wall'] },
    { id: 'cf-social', kind: 'social', pressure: 'Envoy Cinder-Ash may leave a letter, not a knife.', choiceHints: ['Talk to Envoy Cinder-Ash', 'Accept the letter carefully', 'Walk away from the envoy'], contactName: 'Envoy Cinder-Ash', revealQuestId: 'sp-quest-special-other' },
  ],
  'sp-hub-harbor': [
    { id: 'hq-explore', kind: 'explore', pressure: 'Grain ships, quay ropes, smugglers in plain sight.', choiceHints: ['Walk the quay', 'Inspect a crate mark', 'Listen to dock talk'] },
    { id: 'hq-social', kind: 'social', pressure: 'A quay fence or dockhand has street news.', choiceHints: ['Talk to the quay fence', 'Share coin for a tip', 'Walk away'], contactName: 'Quay Fence' },
    { id: 'hq-threat', kind: 'threat', pressure: 'Press-gang eyes or a short blade in a crowd gap.', choiceHints: ['Keep moving along the quay', 'Hard refuse a press', 'Call for the watch'] },
  ],
  'sp-hub-war-camp': [
    { id: 'wc2-explore', kind: 'explore', pressure: 'Banner-smoke and quartermaster crates beyond the walls.', choiceHints: ['Walk the camp lanes', 'Note the banner colors', 'Find the quartermaster tent'] },
    { id: 'wc2-social', kind: 'social', pressure: 'Captain Sera Quill or a camp handler wants you on-script.', choiceHints: ['Talk to Captain Sera Quill', 'Help a wounded handler', 'Hard refuse the tour'], contactName: 'Captain Sera Quill' },
  ],
  'sp-hub-kitchen-saint': [
    { id: 'ks-explore', kind: 'explore', pressure: 'Bread steam and quiet charity behind the close.', choiceHints: ['Follow the bread smell', 'Check the alley for panel-glint', 'Stay out of the kitchen path'], revealQuestId: 'sp-quest-side-child' },
    { id: 'ks-social', kind: 'social', pressure: 'Brother Tam may pass a loaf without a sermon.', choiceHints: ['Talk to Brother Tam', 'Thank him for the bread', 'Ask about the marked child'], contactName: 'Brother Tam', revealQuestId: 'sp-quest-side-child' },
  ],
};

const HA_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'ha-hub-ashline': [
    { id: 'ay-explore', kind: 'explore', pressure: 'Crew staging and an informal job board.', choiceHints: ['Read the Yard board', 'Check gear crates', 'Wait at the staging rail'], revealQuestId: 'ha-quest-2' },
    { id: 'ay-social', kind: 'social', pressure: 'Mara Keene is sorting a Local share.', choiceHints: ['Talk to Mara Keene', 'Offer to help her crew', 'Walk away from the share'], contactName: 'Mara Keene', revealQuestId: 'ha-quest-2' },
    { id: 'ay-hook', kind: 'hook', pressure: 'Joss Vale sizes you up for a Grade-safe clear.', choiceHints: ['Talk to Joss Vale', 'Accept the invite carefully', 'Hard refuse the invite'], contactName: 'Joss Vale', revealQuestId: 'ha-quest-side-rival' },
  ],
  'ha-hub-low-watt': [
    { id: 'lw-explore', kind: 'explore', pressure: 'Food-and-rumor hub after clears.', choiceHints: ['Take a quiet table', 'Listen for Grade gossip', 'Step out to the alley'] },
    { id: 'lw-social', kind: 'social', pressure: 'Crew faces unwind — Mara or independents may talk.', choiceHints: ['Talk to Mara Keene', 'Buy a round for the table', 'Ask about Quiet Hands'], contactName: 'Mara Keene' },
  ],
  'ha-hub-ward-rest': [
    { id: 'wr-explore', kind: 'explore', pressure: 'Healers tent and collapse survivors.', choiceHints: ['Sit for a patch-up', 'Inspect the triage board', 'Step outside for air'] },
    { id: 'wr-social', kind: 'social', pressure: 'Dr. Rhee notices injuries that do not match Unmarked stories.', choiceHints: ['Talk to Dr. Rhee', 'Thank her for the patch', 'Hard refuse questions'], contactName: 'Dr. Rhee' },
  ],
  'ha-hub-mca-desk': [
    { id: 'md-explore', kind: 'explore', pressure: 'Auditor stamps and late-registration forms.', choiceHints: ['Read the registration slate', 'Note the stamp tray', 'Leave the desk queue'] },
    { id: 'md-social', kind: 'social', pressure: 'Auditor Lin Vos offers kindness with a leash.', choiceHints: ['Talk to Lin Vos', 'Cooperate politely', 'Hard refuse the interview'], contactName: 'Lin Vos' },
  ],
  'ha-hub-threshold': [
    { id: 'th-explore', kind: 'explore', pressure: 'The rift that nearly killed you — still unstable.', choiceHints: ['Map the Threshold lip', 'Listen for seam crackle', 'Hold a safe corner'], revealQuestId: 'ha-quest-1' },
    { id: 'th-threat', kind: 'threat', pressure: 'Seam pressure spikes. Not a full clear — survive the pulse.', choiceHints: ['Brace for the pulse', 'Fall back from the lip', 'Ready a defensive stance'] },
  ],
  'ha-hub-scrap': [
    { id: 'sf-explore', kind: 'explore', pressure: 'Pax Orr curios and hush prices.', choiceHints: ['Browse the scrap trays', 'Note fake stamp marks', 'Watch the alley mouth'], revealQuestId: 'ha-quest-side-fence' },
    { id: 'sf-social', kind: 'social', pressure: 'Pax Penny Orr smiles like a receipt.', choiceHints: ['Talk to Pax Orr', 'Offer a curiosity to sell', 'Walk away from the fence'], contactName: 'Pax Orr', revealQuestId: 'ha-quest-side-fence' },
    { id: 'sf-threat', kind: 'threat', pressure: 'Vesper-adjacent pressure — someone wants your hush.', choiceHints: ['Keep your ledger private', 'Hard refuse the buy', 'Slip toward the market'] },
  ],
  'ha-hub-market': [
    { id: 'mm-explore', kind: 'explore', pressure: 'Mixed-folk stalls and Grade gossip.', choiceHints: ['Walk the market lane', 'Listen for second-residue rumors', 'Browse a stall'], revealQuestId: 'ha-quest-special-second' },
    { id: 'mm-social', kind: 'social', pressure: 'A stall contact may tip Quiet Hands or MCA interest.', choiceHints: ['Ask about second residue', 'Talk kindly to the stall-hand', 'Walk away'], revealQuestId: 'ha-quest-special-second' },
  ],
  'ha-hub-wall': [
    { id: 'mw-explore', kind: 'explore', pressure: 'Night watch and Threshold seam watchers.', choiceHints: ['Walk the Meridian Wall', 'Watch the seam glow', 'Note the watch posts'] },
    { id: 'mw-threat', kind: 'threat', pressure: 'Seam flicker — threat pressure without a named boss.', choiceHints: ['Take cover', 'Report to the watch', 'Hard clear the flicker'] },
  ],
  'ha-hub-archive': [
    { id: 'qa-explore', kind: 'explore', pressure: 'Soft research stacks — Quiet Hands leave traces.', choiceHints: ['Browse the Quiet Archive', 'Search for Appraisal notes', 'Leave quietly'], revealQuestId: 'ha-quest-special-name' },
    { id: 'qa-social', kind: 'social', pressure: 'Sable speaks of calibration, not comfort.', choiceHints: ['Talk to Sable', 'Ask about Wake Residue naming', 'Walk away from the test'], contactName: 'Sable', revealQuestId: 'ha-quest-special-name' },
  ],
  'ha-hub-vesper': [
    { id: 'vb-explore', kind: 'explore', pressure: 'False stamp desk hides a cartel hush ledger.', choiceHints: ['Study the backroom desk', 'Note fake Grade marks', 'Leave before a deal'], revealQuestId: 'ha-quest-side-fence' },
    { id: 'vb-social', kind: 'social', pressure: 'Pax Orr may open the hush book for a price.', choiceHints: ['Talk to Pax Orr', 'Hard refuse the hush deal', 'Walk out to Scrap Fence Alley'], contactName: 'Pax Orr', revealQuestId: 'ha-quest-side-fence' },
    { id: 'vb-threat', kind: 'threat', pressure: 'Cartel pressure — someone wants your Wake ledger quiet.', choiceHints: ['Keep your ledger private', 'Hard stare down the buyer', 'Slip toward Lampmere'] },
  ],
};

const SI_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'si-hub-street': [
    { id: 'si-st-explore', kind: 'explore', pressure: 'Cracked asphalt and a blue panel. First Blood waits nearby.', choiceHints: ['Scan the cracked street', 'Check the panel', 'Move toward the store'] },
    { id: 'si-st-social', kind: 'social', pressure: 'A survivor with a dead phone asks if your panel still works.', choiceHints: ['Talk to the survivor', 'Offer a kindness', 'Walk toward the store'] },
    { id: 'si-st-threat', kind: 'threat', pressure: 'Distant Wave rumor — Tier-1 pressure on the block.', choiceHints: ['Stay alert', 'Fall back to cover', 'Push toward the store'] },
  ],
  'si-hub-store': [
    { id: 'si-store-threat', kind: 'threat', pressure: 'Micro-dungeon air — Tier-1 pressure past the glass.', choiceHints: ['Enter the store carefully', 'Scout from the doorway', 'Ready a defensive stance'], revealQuestId: 'si-quest-1' },
    { id: 'si-store-explore', kind: 'explore', pressure: 'Convenience shelves fused with dungeon corridors.', choiceHints: ['Map the aisle-corridor', 'Listen for hatchling skitter', 'Hold the doorway'], revealQuestId: 'si-quest-1' },
  ],
  'si-hub-riverside': [
    { id: 'si-riv-social', kind: 'social', pressure: 'Warden Elise Cho\'s hub offers sanction for Wave duty.', choiceHints: ['Talk to Elise Cho', 'Ask about housing', 'Walk the stronghold wall'], contactName: 'Elise Cho', revealQuestId: 'si-quest-2' },
    { id: 'si-riv-explore', kind: 'explore', pressure: 'Crafting stalls and Foundation Core claim posts.', choiceHints: ['Tour the crafting row', 'Check housing boards', 'Note Wave timers'] },
  ],
  'si-hub-corridor': [
    { id: 'si-cor-explore', kind: 'explore', pressure: 'Two-hour run — contested asphalt between street and Riverside.', choiceHints: ['Scout the corridor', 'Time the safe windows', 'Push hard for Riverside'] },
    { id: 'si-cor-threat', kind: 'threat', pressure: 'Ambush geometry — dead cars and panel static.', choiceHints: ['Take cover', 'Hard clear a lane', 'Fall back'] },
  ],
  'si-hub-wave-wall': [
    { id: 'si-ww-explore', kind: 'explore', pressure: 'Reinforced plating waiting for the next surge.', choiceHints: ['Inspect the Wave Wall', 'Ask about plating needs', 'Walk the perimeter'], revealQuestId: 'si-quest-3' },
    { id: 'si-ww-threat', kind: 'threat', pressure: 'Wave Warning pressure — timers tick louder here.', choiceHints: ['Brace the wall', 'Report to Elise', 'Stock the ramparts'], revealQuestId: 'si-quest-3' },
  ],
  'si-hub-dead-border': [
    { id: 'si-dz-threat', kind: 'threat', pressure: 'Violet sky — panels fail past this line.', choiceHints: ['Study the border', 'Fall back to Riverside', 'Ask about a guide'], revealQuestId: 'si-quest-4' },
    { id: 'si-dz-social', kind: 'social', pressure: 'Marcus "Tunnel" Reyes may hire out for a steep price.', choiceHints: ['Talk to Marcus Reyes', 'Hard refuse his rate', 'Ask about Phase 2'], contactName: 'Marcus Reyes', revealQuestId: 'si-quest-4' },
  ],
  'si-hub-broker': [
    { id: 'si-br-hook', kind: 'hook', pressure: 'Anonymous intel for Mana Crystal fragments.', choiceHints: ['Ask the Broker for a tip', 'Trade a crystal fragment', 'Walk away from the deal'], contactName: 'The Broker' },
    { id: 'si-br-explore', kind: 'explore', pressure: 'Alley stalls with unverified System Coin stamps.', choiceHints: ['Browse broker stalls', 'Note fake stamps', 'Leave quietly'] },
  ],
  'si-hub-okafor': [
    { id: 'si-ok-social', kind: 'social', pressure: 'Dr. Yusuf Okafor wants Null Cores for System Probe work.', choiceHints: ['Talk to Yusuf Okafor', 'Offer a Null Core tip', 'Hard refuse his research'], contactName: 'Yusuf Okafor' },
    { id: 'si-ok-explore', kind: 'explore', pressure: 'Scavenged servers and Probe readouts.', choiceHints: ['Inspect the probe bank', 'Read a research slate', 'Step back outside'] },
  ],
  'si-hub-crystal': [
    { id: 'si-cr-explore', kind: 'explore', pressure: 'Barter stalls stamped with System Coin rumors.', choiceHints: ['Browse crystal prices', 'Listen for Wave gossip', 'Trade a fragment'] },
    { id: 'si-cr-social', kind: 'social', pressure: 'A stall-hand may tip Riverside or Tunnel routes.', choiceHints: ['Ask about Riverside rates', 'Talk kindly to the stall-hand', 'Walk away'] },
  ],
};

const GW_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'gw-hub-shelter': [
    { id: 'gw-sh-explore', kind: 'explore', pressure: 'Civilian bunks and scrap beds under Ward 9.', choiceHints: ['Check the shelter roster', 'Help a civilian', 'Ask about the subway gate'] },
    { id: 'gw-sh-social', kind: 'social', pressure: 'Shelter hands need calm more than heroics.', choiceHints: ['Help a civilian settle', 'Talk to the shelter lead', 'Walk the bunk row'] },
  ],
  'gw-hub-militia': [
    { id: 'gw-mi-social', kind: 'social', pressure: 'Sergeant Rill ignores unlicensed clears if you protect people.', choiceHints: ['Talk to Sergeant Rill', 'Request an armband', 'Report gate intel'], contactName: 'Sergeant Rill' },
    { id: 'gw-mi-explore', kind: 'explore', pressure: 'Clipboard, armbands, and night-shift lists.', choiceHints: ['Read the duty slate', 'Check armband stock', 'Leave the post'] },
  ],
  'gw-hub-subway': [
    { id: 'gw-su-threat', kind: 'threat', pressure: 'B-gate crackle under the tracks.', choiceHints: ['Scout the subway gate', 'Hold the platform', 'Fall back to shelter'], revealQuestId: 'gatebreak-ward-quest-1' },
    { id: 'gw-su-explore', kind: 'explore', pressure: 'Unscheduled gate bruise under the rails.', choiceHints: ['Map the platform approach', 'Listen for gate bloom', 'Mark evacuation paths'], revealQuestId: 'gatebreak-ward-quest-1' },
  ],
  'gw-hub-guild': [
    { id: 'gw-gu-social', kind: 'social', pressure: 'Vex Harlan smiles like a contract.', choiceHints: ['Talk to Vex Harlan', 'Hard refuse the cut', 'Ask about B-gate intel'], contactName: 'Vex Harlan' },
    { id: 'gw-gu-hook', kind: 'hook', pressure: 'Licensed hunters want your future clears for a cut.', choiceHints: ['Hear the guild offer', 'Walk away', 'Ask Rill what it costs'] },
  ],
  'gw-hub-scrap': [
    { id: 'gw-sc-explore', kind: 'explore', pressure: 'Unlicensed loot and quiet buyers.', choiceHints: ['Browse scrap trays', 'Ask about gate drops', 'Watch for guild eyes'] },
    { id: 'gw-sc-threat', kind: 'threat', pressure: 'Guild cutters may claim your unlicensed haul.', choiceHints: ['Keep your bag closed', 'Hard refuse a shakedown', 'Slip toward shelter'] },
  ],
  'gw-hub-evac': [
    { id: 'gw-ev-explore', kind: 'explore', pressure: 'Rumored exits for people with working cars.', choiceHints: ['Check the evac board', 'Ask who still has fuel', 'Return to militia'] },
  ],
  'gw-hub-armband': [
    { id: 'gw-ab-social', kind: 'social', pressure: 'Militia kit lockers — Rill\'s night-shift lists live here.', choiceHints: ['Talk to Sergeant Rill', 'Request kit', 'Sign the night list'], contactName: 'Sergeant Rill' },
    { id: 'gw-ab-explore', kind: 'explore', pressure: 'Armband Depot lockers and scrap gear.', choiceHints: ['Inspect the lockers', 'Note missing kits', 'Leave for the roof'] },
  ],
  'gw-hub-roof': [
    { id: 'gw-rf-explore', kind: 'explore', pressure: 'District sightlines over blooming gate bruises.', choiceHints: ['Scan the ward rooftops', 'Spot the subway bruise', 'Signal the militia'] },
    { id: 'gw-rf-threat', kind: 'threat', pressure: 'Gate bloom pressure — something wants the district next.', choiceHints: ['Hold the roof', 'Fall back to shelter', 'Hard ready a stance'] },
  ],
};

const AS_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'as-hub-gate': [
    { id: 'as-gate-explore', kind: 'explore', pressure: 'Black tower overhead. Permits and intel buyers.', choiceHints: ['Approach the Spire Gate', 'Ask about Floor Law', 'Watch the climbers'] },
    { id: 'as-gate-social', kind: 'social', pressure: 'Marshal Kade issues climb permits and buys verified intel.', choiceHints: ['Talk to Marshal Kade', 'Sell a floor tip', 'Hard refuse a contract'], contactName: 'Marshal Kade' },
  ],
  'as-hub-board': [
    { id: 'as-board-hook', kind: 'hook', pressure: 'Ranking Board lists living climbers — fame brings contracts.', choiceHints: ['Read the Ranking Board', 'Ask about Floor 1', 'Note rival names'] },
    { id: 'as-board-explore', kind: 'explore', pressure: 'Public climb ranks under the black tower.', choiceHints: ['Study the board', 'Find your blank slot', 'Leave before assassins notice'] },
  ],
  'as-hub-camp': [
    { id: 'as-camp-explore', kind: 'explore', pressure: 'Tents and ration brick smoke outside the gate.', choiceHints: ['Walk the climber camp', 'Trade a ration brick', 'Listen for Floor Law changes'] },
    { id: 'as-camp-social', kind: 'social', pressure: 'Nyra Vell may pass through — ally or credit thief.', choiceHints: ['Talk to Nyra Vell', 'Offer a temporary party', 'Walk away'], contactName: 'Nyra Vell' },
  ],
  'as-hub-floor1': [
    { id: 'as-f1-threat', kind: 'threat', pressure: 'Floor 1 laws press before the Warden.', choiceHints: ['Enter Floor 1 carefully', 'Study posted Floor Law', 'Hold the antechamber'], revealQuestId: 'ascending-spire-quest-1' },
    { id: 'as-f1-explore', kind: 'explore', pressure: 'First sealed biome — map before you climb.', choiceHints: ['Map the antechamber', 'Note law plaques', 'Listen for the Warden'], revealQuestId: 'ascending-spire-quest-1' },
  ],
  'as-hub-broker': [
    { id: 'as-br-social', kind: 'social', pressure: 'Verified floor intel for Spire Coin — Kade buys too.', choiceHints: ['Talk to Marshal Kade', 'Buy a floor map tip', 'Hard refuse a bad deal'], contactName: 'Marshal Kade' },
    { id: 'as-br-explore', kind: 'explore', pressure: 'Map fragments and Spire Coin scales.', choiceHints: ['Browse map stalls', 'Check coin rates', 'Leave for the gate'] },
  ],
  'as-hub-rival': [
    { id: 'as-riv-social', kind: 'social', pressure: 'Nyra Vell may ally — or steal clear credit.', choiceHints: ['Talk to Nyra Vell', 'Offer a temporary party', 'Walk away from the race'], contactName: 'Nyra Vell' },
    { id: 'as-riv-threat', kind: 'threat', pressure: 'Rival guild pressure — credit theft without a fight yet.', choiceHints: ['Hard refuse the race', 'Watch your clear claim', 'Return to the board'] },
  ],
  'as-hub-scaffold': [
    { id: 'as-sc-explore', kind: 'explore', pressure: 'Altitude staging — wind and height before Floor 2.', choiceHints: ['Walk the Wind Scaffold', 'Check harness points', 'Look down once'] },
    { id: 'as-sc-threat', kind: 'threat', pressure: 'Height pressure — one slip is a climb story ending.', choiceHints: ['Brace on the scaffold', 'Fall back to camp', 'Hard push for Floor 1'] },
  ],
  'as-hub-coin': [
    { id: 'as-co-explore', kind: 'explore', pressure: 'Drop buyers and permit renewals under the tower.', choiceHints: ['Check Spire Coin rates', 'Ask about permit renewals', 'Browse drop trays'] },
    { id: 'as-co-social', kind: 'social', pressure: 'A coin changer may tip Floor Law changes.', choiceHints: ['Ask about Floor 7 law', 'Talk kindly to the changer', 'Walk to the Ranking Board'] },
  ],
};

const FL_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'fl-hub-square': [
    { id: 'fl-sq-explore', kind: 'explore', pressure: 'Quiet Mossford heart between mill and chapel.', choiceHints: ['Walk the square', 'Listen to valley gossip', 'Note festival banners'] },
    { id: 'fl-sq-social', kind: 'social', pressure: 'Old Brennan or Fen may pass with Weave talk.', choiceHints: ['Talk to Old Brennan', 'Talk to Fen', 'Sit quietly'], contactName: 'Old Brennan' },
  ],
  'fl-hub-inn': [
    { id: 'fl-inn-social', kind: 'social', pressure: 'A wounded stranger and village eyes at The Crooked Beam.', choiceHints: ['Talk to the stranger', 'Ask Fen about lodging', 'Sit quietly and listen'], contactName: 'Corvin', revealQuestId: 'fl-quest-1' },
    { id: 'fl-inn-explore', kind: 'explore', pressure: 'Inn common room — wound talk without a fight.', choiceHints: ['Inspect Corvin\'s map scrap', 'Check the lodging slate', 'Step into the yard'], revealQuestId: 'fl-quest-1' },
  ],
  'fl-hub-chapel': [
    { id: 'fl-ch-explore', kind: 'explore', pressure: 'Old Faith menhir — Brennan\'s Weave talk lives here.', choiceHints: ['Visit the menhir', 'Talk to Old Brennan', 'Walk the chapel path'], contactName: 'Old Brennan' },
    { id: 'fl-ch-hook', kind: 'hook', pressure: 'Geas-cut warnings and Hollow Cairn stories.', choiceHints: ['Ask about the Hollow Cairn', 'Ask about the wound that will not close', 'Leave the menhir'], revealQuestId: 'fl-quest-3' },
  ],
  'fl-hub-smithy': [
    { id: 'fl-sm-social', kind: 'social', pressure: 'Marta needs help with the ceremonial sickle.', choiceHints: ['Talk to Marta', 'Offer forge help', 'Ask about the hills'], contactName: 'Marta', revealQuestId: 'fl-quest-2' },
    { id: 'fl-sm-explore', kind: 'explore', pressure: 'Forge heat and heirloom ironwork.', choiceHints: ['Watch the forge', 'Note sickle blanks', 'Step back from the heat'] },
  ],
  'fl-hub-trail': [
    { id: 'fl-tr-explore', kind: 'explore', pressure: 'Lower Greentooth path toward ambush marks and cairn rumors.', choiceHints: ['Walk the trailhead', 'Look for drag marks', 'Turn back to Mossford'], revealQuestId: 'fl-quest-3' },
    { id: 'fl-tr-threat', kind: 'threat', pressure: 'Hill weather turns without warning.', choiceHints: ['Take cover', 'Hard push uphill', 'Fall back to the mill'], revealQuestId: 'fl-quest-3' },
  ],
  'fl-hub-mill': [
    { id: 'fl-mi-explore', kind: 'explore', pressure: 'Mill noise and valley gossip on the River Tess.', choiceHints: ['Walk the mill path', 'Listen under the wheel', 'Ask about the harvest'] },
  ],
  'fl-hub-bakery': [
    { id: 'fl-bk-social', kind: 'social', pressure: 'Fen plans the Harvest Festival with warm loaves.', choiceHints: ['Talk to Fen', 'Offer bakery help', 'Ask about the festival'], contactName: 'Fen' },
    { id: 'fl-bk-explore', kind: 'explore', pressure: 'Warm loaves and festival lists.', choiceHints: ['Browse the bakery counter', 'Read the festival slate', 'Step into the square'] },
  ],
  'fl-hub-cairn': [
    { id: 'fl-ca-explore', kind: 'explore', pressure: 'Deep-hills approach where first kings were forgotten.', choiceHints: ['Approach the Hollow Cairn carefully', 'Study the sealed mound', 'Turn back to the trail'], revealQuestId: 'fl-quest-4' },
    { id: 'fl-ca-threat', kind: 'threat', pressure: 'Geas pressure — open, seal, or find a third path.', choiceHints: ['Hold position', 'Hard refuse to open', 'Ask Corvin what he sees'], revealQuestId: 'fl-quest-4' },
  ],
};

const IA_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'ia-hub-dorm': [
    { id: 'ia-dorm-explore', kind: 'explore', pressure: 'Blank Class Codex beds and a schedule that writes itself.', choiceHints: ['Inspect your Class Codex', 'Read the self-writing schedule', 'Check the dorm door'], revealQuestId: 'inkbound-academy-quest-1' },
    { id: 'ia-dorm-social', kind: 'social', pressure: 'Jori Ashquill wants help cheating — ethically, of course.', choiceHints: ['Talk to Jori Ashquill', 'Hard refuse the cheat', 'Ask about house choice'], contactName: 'Jori Ashquill', revealQuestId: 'inkbound-academy-quest-1' },
  ],
  'ia-hub-courtyard': [
    { id: 'ia-cy-explore', kind: 'explore', pressure: 'Opening lecture stone and courtyard duel chalk.', choiceHints: ['Attend the opening lecture', 'Study duel chalk marks', 'Hold a quiet corner'], revealQuestId: 'inkbound-academy-quest-1' },
    { id: 'ia-cy-threat', kind: 'threat', pressure: 'Practical exam pressure — midterms can kill.', choiceHints: ['Brace for the courtyard duel', 'Study posted exam rules', 'Fall back to the dorm'], revealQuestId: 'inkbound-academy-quest-1' },
  ],
  'ia-hub-ledger': [
    { id: 'ia-ld-hook', kind: 'hook', pressure: 'Public Ink Points board — sabotage is illegal if caught.', choiceHints: ['Read the House Ledger', 'Note rival house scores', 'Ask about Ink Points'] },
    { id: 'ia-ld-explore', kind: 'explore', pressure: 'House rivalry scored in living ink.', choiceHints: ['Walk the ledger hall', 'Compare house pins', 'Leave before a challenge'] },
  ],
  'ia-hub-atelier': [
    { id: 'ia-at-explore', kind: 'explore', pressure: 'Handwriting grades and smudged glyph misfires.', choiceHints: ['Practice a basic glyph', 'Inspect ink quality vials', 'Clean a smudged line'] },
    { id: 'ia-at-social', kind: 'social', pressure: 'Jori may tip which ink survives midterms.', choiceHints: ['Talk to Jori Ashquill', 'Ask about Living Ink', 'Walk away'], contactName: 'Jori Ashquill' },
  ],
  'ia-hub-stack': [
    { id: 'ia-st-explore', kind: 'explore', pressure: 'Restricted Stack rearranges itself into footnotes.', choiceHints: ['Enter the Restricted Stack carefully', 'Follow a footnote trail', 'Leave before you speak in footnotes'] },
    { id: 'ia-st-threat', kind: 'threat', pressure: 'Sealed curriculum pressure under the library.', choiceHints: ['Hold the basement wing', 'Fall back to the atelier', 'Hard refuse a wrong question'] },
  ],
  'ia-hub-dean': [
    { id: 'ia-dn-social', kind: 'social', pressure: 'Dean Solenne holds a red pen that edits reality.', choiceHints: ['Talk to Dean Solenne', 'Accept research credit carefully', 'Hard refuse detention'], contactName: 'Dean Solenne' },
    { id: 'ia-dn-hook', kind: 'hook', pressure: 'Discipline office — warn or erase.', choiceHints: ['Ask about the Restricted Stack', 'Request research credit', 'Leave the office'] },
  ],
  'ia-hub-quad': [
    { id: 'ia-qd-social', kind: 'social', pressure: 'House challenge banners and scored rivalries.', choiceHints: ['Talk to Jori Ashquill', 'Accept a house challenge', 'Walk away from the race'], contactName: 'Jori Ashquill' },
    { id: 'ia-qd-threat', kind: 'threat', pressure: 'Rival house pressure — sabotage without proof yet.', choiceHints: ['Watch your Ink Points', 'Hard refuse a dirty tip', 'Return to Ledger Hall'] },
  ],
  'ia-hub-refectory': [
    { id: 'ia-rf-explore', kind: 'explore', pressure: 'Meal trays, roommate schemes, and exam rumors.', choiceHints: ['Take a tray', 'Listen for midterm gossip', 'Sit with your house'] },
    { id: 'ia-rf-social', kind: 'social', pressure: 'Campus politics over stew — choose who hears you.', choiceHints: ['Talk to Jori Ashquill', 'Ask about house pins', 'Eat in silence'], contactName: 'Jori Ashquill' },
  ],
};

const VA_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'va-hub-auditor': [
    { id: 'va-au-hook', kind: 'hook', pressure: 'Void negotiation — Flaws, Boons, Cosmic Favor. The Audience is watching.', choiceHints: ['Allocate your stats carefully', 'Ask the Auditor about Flaws', 'Sign only when ready'], contactName: 'The Auditor', revealQuestId: 'va-quest-1' },
    { id: 'va-au-explore', kind: 'explore', pressure: 'Soft grey Void light and a desk that should not exist.', choiceHints: ['Study the Auditor\'s desk', 'Read the point budget', 'Ask what the Audience wants'], revealQuestId: 'va-quest-1' },
  ],
  'va-hub-inn': [
    { id: 'va-inn-social', kind: 'social', pressure: 'Pellara Vohn offers shelter without asking Void questions.', choiceHints: ['Talk to Pellara Vohn', 'Offer inn chores', 'Ask about Threshold Village'], contactName: 'Pellara Vohn', revealQuestId: 'va-quest-2' },
    { id: 'va-inn-explore', kind: 'explore', pressure: 'Threshold Inn — first grounding after rebirth.', choiceHints: ['Walk the inn rooms', 'Complete a chore', 'Listen for other "unusual" guests'], revealQuestId: 'va-quest-2' },
  ],
  'va-hub-node': [
    { id: 'va-nd-social', kind: 'social', pressure: 'Caster Drenn guards the Node — suspicious of soul shimmer.', choiceHints: ['Talk to Caster Drenn', 'Offer Node help', 'Hard refuse questions'], contactName: 'Caster Drenn', revealQuestId: 'va-quest-3' },
    { id: 'va-nd-explore', kind: 'explore', pressure: 'Crystalline Resonance Node pulsing over the plaza.', choiceHints: ['Study the Node', 'Note mana flicker', 'Stay at a respectful distance'], revealQuestId: 'va-quest-3' },
  ],
  'va-hub-stage': [
    { id: 'va-sg-explore', kind: 'explore', pressure: 'Spectacle ground — Cosmic Favor loves a performance.', choiceHints: ['Walk the Resonance Stage', 'Practice a dramatic beat', 'Leave before you overplay'] },
    { id: 'va-sg-hook', kind: 'hook', pressure: 'Audience metaphors — The Gallery wants combat theater.', choiceHints: ['Give them a spectacle', 'Play it quiet for Connoisseurs', 'Ask what CF costs'] },
  ],
  'va-hub-gallery': [
    { id: 'va-gal-explore', kind: 'explore', pressure: 'Metaphor seats for The Gallery\'s combat taste.', choiceHints: ['Sit the viewing tier', 'Watch a bout', 'Note which faction is tuned in'] },
    { id: 'va-gal-threat', kind: 'threat', pressure: 'Mockers whisper for suffering CF spikes.', choiceHints: ['Mute the Mocker\'s Voice', 'Hard refuse the easy CF', 'Leave the tier'] },
  ],
  'va-hub-reborn': [
    { id: 'va-rb-social', kind: 'social', pressure: 'Kael the Unfinished needs CF — desperation shows.', choiceHints: ['Talk to Kael the Unfinished', 'Offer an alliance carefully', 'Hard refuse his plan'], contactName: 'Kael the Unfinished', revealQuestId: 'va-quest-3' },
    { id: 'va-rb-threat', kind: 'threat', pressure: 'Trial-vs-trial pressure — Audience finds conflict compelling.', choiceHints: ['Keep distance', 'Hard challenge Kael', 'Walk toward the inn'] },
  ],
  'va-hub-scout': [
    { id: 'va-sc-social', kind: 'social', pressure: 'Academy scouts sniff anomalous mana — Solenne is curious.', choiceHints: ['Talk carefully to a scout', 'Hard refuse a sample', 'Slip toward the inn'], contactName: 'Magistra Solenne' },
    { id: 'va-sc-explore', kind: 'explore', pressure: 'Scout tents and mana-signature instruments.', choiceHints: ['Observe from cover', 'Note instrument readouts', 'Leave before they clock you'] },
  ],
  'va-hub-mana': [
    { id: 'va-mf-threat', kind: 'threat', pressure: 'Wild mana fields — flee path when Threshold gets watched.', choiceHints: ['Brace for a mana storm', 'Push toward the next settlement', 'Fall back to the inn'] },
    { id: 'va-mf-explore', kind: 'explore', pressure: 'Violet-tinged wilds beyond Threshold\'s Node shelter.', choiceHints: ['Map a short path', 'Scavenge carefully', 'Turn back'] },
  ],
};

const HC_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'hc-hub-chamber': [
    { id: 'hc-ch-explore', kind: 'explore', pressure: 'Your glowing Core crystal — Expand, Spawn, Bargain menus.', choiceHints: ['Open the Core menu', 'Inspect the crystal seams', 'Listen to Whisper-Mite'], contactName: 'Whisper-Mite', revealQuestId: 'hollow-core-quest-1' },
    { id: 'hc-ch-hook', kind: 'hook', pressure: 'Grow or be mined — first room claims decide the hollow.', choiceHints: ['Expand toward the spur', 'Spawn a defender', 'Hold the chamber'], revealQuestId: 'hollow-core-quest-1' },
  ],
  'hc-hub-spur': [
    { id: 'hc-sp-explore', kind: 'explore', pressure: 'Half-collapsed cave spur waiting for room claims.', choiceHints: ['Claim the spur as a room', 'Map collapse risk', 'Return to the Core'], revealQuestId: 'hollow-core-quest-1' },
    { id: 'hc-sp-threat', kind: 'threat', pressure: 'Stone shift — starvation shrinks rooms if you stall.', choiceHints: ['Brace the spur', 'Hard push Expand', 'Fall back to the chamber'] },
  ],
  'hc-hub-nursery': [
    { id: 'hc-nu-social', kind: 'social', pressure: 'Whisper-Mite translates System menus into sarcasm.', choiceHints: ['Talk to Whisper-Mite', 'Ask what to spawn first', 'Ignore the sarcasm'], contactName: 'Whisper-Mite' },
    { id: 'hc-nu-explore', kind: 'explore', pressure: 'First defender eggs and spawn bay glow.', choiceHints: ['Inspect the nursery', 'Spawn a scout mite', 'Leave eggs undisturbed'] },
  ],
  'hc-hub-bargain': [
    { id: 'hc-ba-social', kind: 'social', pressure: 'Adventurers knock before they mine you — or Captain Bren does.', choiceHints: ['Talk to Captain Bren Holtz', 'Offer tribute carefully', 'Hard refuse capture'], contactName: 'Captain Bren Holtz' },
    { id: 'hc-ba-threat', kind: 'threat', pressure: 'Raid pressure at the antechamber door.', choiceHints: ['Ready spawn defenders', 'Bargain from cover', 'Seal the antechamber'] },
  ],
  'hc-hub-face': [
    { id: 'hc-fa-explore', kind: 'explore', pressure: 'Mana-hungry dig — grow or starve the hollow.', choiceHints: ['Work the excavation face', 'Feed the Core Hunger', 'Check theme options'] },
    { id: 'hc-fa-threat', kind: 'threat', pressure: 'Overfeeding may attract Core Hunters.', choiceHints: ['Throttle the dig', 'Hard push growth', 'Fall back to the heart'] },
  ],
  'hc-hub-border': [
    { id: 'hc-bo-threat', kind: 'threat', pressure: 'Rival cores press your territory seams.', choiceHints: ['Hold the border', 'Scout the rival glow', 'Withdraw to the chamber'] },
    { id: 'hc-bo-explore', kind: 'explore', pressure: 'Other Core signatures along the seam.', choiceHints: ['Map the rival border', 'Note theme bleed', 'Leave a marker'] },
  ],
  'hc-hub-hunter': [
    { id: 'hc-hu-social', kind: 'social', pressure: 'Captain Bren Holtz prefers capture over destruction — for bounty.', choiceHints: ['Talk to Captain Bren Holtz', 'Hard refuse capture', 'Offer a tribute deal'], contactName: 'Captain Bren Holtz' },
    { id: 'hc-hu-threat', kind: 'threat', pressure: 'Guild scout staging above your roof.', choiceHints: ['Brace for a raid', 'Spawn defenders', 'Bargain from the shelf'] },
  ],
  'hc-hub-heart': [
    { id: 'hc-ht-explore', kind: 'explore', pressure: 'Empty-heart motif chamber — Theme Binding waits.', choiceHints: ['Enter the Hollow Heart Vault', 'Consider a theme (fungal/clockwork/frost/bone)', 'Leave unbound for now'] },
    { id: 'hc-ht-hook', kind: 'hook', pressure: 'Theme locks aesthetic and spawn pools — remix costs dearly.', choiceHints: ['Bind a theme carefully', 'Ask Whisper-Mite', 'Delay the binding'] },
  ],
};

const DT_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'dt-hub-f1': [
    { id: 'dt-f1-explore', kind: 'explore', pressure: 'Damp torches and Descent Log scratches on Floor 1.', choiceHints: ['Explore the stone corridor', 'Read a Descent Log mark', 'Scavenge for torches'], revealQuestId: 'dt-quest-1' },
    { id: 'dt-f1-threat', kind: 'threat', pressure: 'Something breathing ahead — only down from here.', choiceHints: ['Advance carefully', 'Hold a lit corner', 'Ready a defensive stance'], revealQuestId: 'dt-quest-1' },
  ],
  'dt-hub-gatekeeper': [
    { id: 'dt-gk-threat', kind: 'threat', pressure: 'Gatekeeper core-window — brute HP will not finish it.', choiceHints: ['Watch for the Slam window', 'Target the mana core', 'Fall back to the corridor'], revealQuestId: 'dt-quest-1' },
    { id: 'dt-gk-explore', kind: 'explore', pressure: 'Boss door sealed until the construct falls.', choiceHints: ['Study the Gatekeeper pattern', 'Map the boss room', 'Check your light meter'] },
  ],
  'dt-hub-f2': [
    { id: 'dt-f2-explore', kind: 'explore', pressure: 'Flooded platform over cavern routes.', choiceHints: ['Map the flooded platform', 'Watch territorial packs', 'Look for Scratch\'s shortcuts'], revealQuestId: 'dt-quest-2' },
    { id: 'dt-f2-threat', kind: 'threat', pressure: 'Aquatic territory — resource meters matter.', choiceHints: ['Keep thirst in check', 'Hard clear a nest', 'Fall back to high stone'], revealQuestId: 'dt-quest-2' },
  ],
  'dt-hub-scratch': [
    { id: 'dt-sc-social', kind: 'social', pressure: 'Scratch wants food and light — knows Floor 2 intimately.', choiceHints: ['Talk to Scratch', 'Trade rations for a shortcut', 'Hard refuse and watch your pack'], contactName: 'Scratch', revealQuestId: 'dt-quest-2' },
    { id: 'dt-sc-explore', kind: 'explore', pressure: 'Cave Imp overlook — shiny hoard and stolen gear.', choiceHints: ['Inspect Scratch\'s nest', 'Secure your pack', 'Ask about the Drowned Maw'] },
  ],
  'dt-hub-safe': [
    { id: 'dt-sf-explore', kind: 'explore', pressure: 'Rest Shrine cooldown — door only opens outward.', choiceHints: ['Use the Rest Shrine', 'Store excess in the Cache', 'Plan the next three floors'], revealQuestId: 'dt-quest-3' },
    { id: 'dt-sf-hook', kind: 'hook', pressure: 'Safe Room dilemma — 8 hours before you must descend.', choiceHints: ['Buy from the Merchant carefully', 'Leave a Descent Log mark', 'Rest fully before leaving'], revealQuestId: 'dt-quest-3' },
  ],
  'dt-hub-merchant': [
    { id: 'dt-mr-social', kind: 'social', pressure: 'Silent Wandering Merchant — inflated essentials.', choiceHints: ['Browse the Merchant inventory', 'Buy food or torches', 'Hard refuse and leave'], contactName: 'The Wandering Merchant' },
    { id: 'dt-mr-hook', kind: 'hook', pressure: 'Floor Map Fragment for an exorbitant price.', choiceHints: ['Consider the map fragment', 'Save resources', 'Ask nothing — it will not speak'] },
  ],
  'dt-hub-log': [
    { id: 'dt-lg-explore', kind: 'explore', pressure: 'Kira\'s voice in the Descent Log — practical then lonely.', choiceHints: ['Read Kira\'s latest log', 'Leave your own mark', 'Note boss weaknesses'] },
    { id: 'dt-lg-hook', kind: 'hook', pressure: 'Messages about seams and Floor 7 merchant warnings.', choiceHints: ['Note the seam rumor', 'Heed the Floor 7 warning', 'Keep descending'] },
  ],
  'dt-hub-shaft': [
    { id: 'dt-sh-explore', kind: 'explore', pressure: 'Only-down transit between biomes.', choiceHints: ['Descend the transit shaft', 'Check Hunger/Thirst/Light', 'Hold the landing'] },
    { id: 'dt-sh-threat', kind: 'threat', pressure: 'Ambush geometry in the shaft turns.', choiceHints: ['Advance carefully', 'Keep a torch lit', 'Fall back to the Safe Room'] },
  ],
  'dt-hub-seam': [
    { id: 'dt-sm-explore', kind: 'explore', pressure: 'Hairline template mismatch — rumor of a way up.', choiceHints: ['Inspect the seam', 'Squeeze into the crawlspace carefully', 'Leave a log for Kira'], revealQuestId: 'dt-quest-4' },
    { id: 'dt-sm-threat', kind: 'threat', pressure: 'Maintenance space hums — exit, shortcut, or trap.', choiceHints: ['Hold at the fracture', 'Hard push through', 'Fall back to the shaft'], revealQuestId: 'dt-quest-4' },
  ],
};

const CK_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'ck-hub-inn': [
    { id: 'ck-inn-social', kind: 'social', pressure: 'Oskar sits across from you — his daughter is missing.', choiceHints: ['Talk to Oskar', 'Ask about the keep', 'Listen to tavern silence'], contactName: 'Oskar', revealQuestId: 'ck-quest-1' },
  ],
  'ck-hub-church': [
    { id: 'ck-ch-social', kind: 'social', pressure: 'Father Aldous has not slept in six days.', choiceHints: ['Talk to Father Aldous', 'Ask about his dreams', 'Offer to help quietly'], contactName: 'Father Aldous', revealQuestId: 'ck-quest-2' },
  ],
  'ck-hub-gate': [
    { id: 'ck-gate-explore', kind: 'explore', pressure: 'Broken chain. Footprints stop at the keep gate.', choiceHints: ['Examine the keep gate', 'Search the ground floor approach', 'Call for Greta'], revealQuestId: 'ck-quest-1' },
  ],
  'ck-hub-apothecary': [
    { id: 'ck-ap-hook', kind: 'hook', pressure: 'Mira knows more than remedies — journals stay hidden until trust.', choiceHints: ['Talk to Mira', 'Ask discreetly about Greymark', 'Buy a poultice and leave'], contactName: 'Mira', revealQuestId: 'ck-quest-3' },
  ],
};

const SR_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'sr-hub-waystation': [
    { id: 'sr-ws-explore', kind: 'explore', pressure: 'Salt Road staging — case the caravan before Heat rises.', choiceHints: ['Scout the waystation', 'Ask about the caravan route', 'Check gear'], revealQuestId: 'salt-road-heist-quest-1' },
  ],
  'sr-hub-caravan': [
    { id: 'sr-cv-threat', kind: 'threat', pressure: 'Guards and sealed crates. The ledger is inside.', choiceHints: ['Case the caravan', 'Note guard patterns', 'Fall back to the safehouse'] },
  ],
  'sr-hub-safehouse': [
    { id: 'sr-sh-social', kind: 'social', pressure: 'Vessa knows every bribe price on the Salt Road.', choiceHints: ['Talk to Vessa', 'Ask about a safehouse cut', 'Walk away if Heat feels wrong'], contactName: 'Vessa' },
  ],
  'sr-hub-checkpoint': [
    { id: 'sr-cp-threat', kind: 'threat', pressure: 'Papers or a fight — Heat lives here.', choiceHints: ['Approach carefully', 'Hard bluff the checkpoint', 'Take another road'] },
  ],
};

const BANKS_BY_BIBLE: Record<string, Record<string, HubArrivalBeat[]>> = {
  'summoned-pact': SP_HUB_BEATS,
  'hero-awakening': HA_HUB_BEATS,
  'system-integration': SI_HUB_BEATS,
  'gatebreak-ward': GW_HUB_BEATS,
  'ascending-spire': AS_HUB_BEATS,
  'fabled-legacy': FL_HUB_BEATS,
  'inkbound-academy': IA_HUB_BEATS,
  'void-audience': VA_HUB_BEATS,
  'hollow-core': HC_HUB_BEATS,
  'dungeon-transport': DT_HUB_BEATS,
  'cursed-keep': CK_HUB_BEATS,
  'salt-road-heist': SR_HUB_BEATS,
};

function banksForBible(bibleId: string | undefined | null): Record<string, HubArrivalBeat[]> {
  if (!bibleId) return {};
  return BANKS_BY_BIBLE[bibleId] ?? {};
}

function filterByTier(beats: HubArrivalBeat[], threatTier: number): HubArrivalBeat[] {
  if (threatTier <= 1) {
    const soft = beats.filter((b) => b.kind !== 'threat');
    return soft.length ? soft : beats;
  }
  if (threatTier >= 3) {
    const hot = beats.filter((b) => b.kind === 'threat' || b.kind === 'hook' || b.kind === 'explore');
    return hot.length ? hot : beats;
  }
  return beats;
}

export function pickHubArrivalBeat(
  hub: OutdoorHub,
  visitCount: number,
  bibleId: string | undefined | null
): HubArrivalBeat | null {
  const bank = banksForBible(bibleId)[hub.id];
  if (!bank?.length) return null;
  const pool = filterByTier(bank, hub.threatTier);
  const idx = Math.abs(visitCount) % pool.length;
  return pool[idx] ?? pool[0] ?? null;
}

export function hubVisitCount(state: GameState, hub: OutdoorHub): number {
  const keys = state.sandboxAwardKeys ?? [];
  return keys.filter((k) => k.startsWith('hub-beat:' + hub.id + ':')).length;
}

export function resolveHubArrival(
  state: GameState,
  locationName: string | undefined
): { hub: OutdoorHub; beat: HubArrivalBeat } | null {
  if (state.openingEstablishment?.complete === false) return null;
  if (state.activeDungeon) return null;
  const hubs = hubsForBibleId(state.campaignBibleId);
  const hub = matchHub(hubs, locationName);
  if (!hub) return null;
  const visits = hubVisitCount(state, hub);
  const beat = pickHubArrivalBeat(hub, visits, state.campaignBibleId);
  if (!beat) return null;
  return { hub, beat };
}

export function atMappedHubAfterOpening(state: GameState): boolean {
  if (state.openingEstablishment?.complete !== true) return false;
  return !!matchHub(hubsForBibleId(state.campaignBibleId), state.currentLocation);
}

export function formatHubArrivalForPrompt(state: GameState): string {
  const resolved = resolveHubArrival(state, state.currentLocation);
  if (!resolved) return '';
  const { hub, beat } = resolved;
  const contact = beat.contactName ? (' Contact=' + beat.contactName + '.') : '';
  const quest = beat.revealQuestId ? (' Soft-hook=' + beat.revealQuestId + '.') : '';
  return (
    '[HUB ARRIVAL — ' +
    hub.name +
    ' Tier ' +
    String(hub.threatTier) +
    ' / ' +
    beat.kind +
    ']: ' +
    beat.pressure +
    contact +
    quest +
    ' Honor alone invent-crowd only if not at this hub. Do not invent licensed place names.'
  );
}

export function hubArrivalChoicePads(state: GameState, max = 2): string[] {
  const resolved = resolveHubArrival(state, state.currentLocation);
  if (!resolved) return [];
  const { beat } = resolved;
  const aloneOpening =
    state.openingEstablishment?.complete === false
    || (state.openingEstablishment?.aloneArrival === true && !atMappedHubAfterOpening(state));
  const hints = beat.choiceHints.filter((h) => {
    if (!aloneOpening) return true;
    return beat.kind === 'explore' || !/\b(talk|ask|help|thank|offer|refuse|invite)\b/i.test(h);
  });
  return hints.slice(0, max);
}

export function hubBeatAwardKey(hubId: string, beatId: string, turn: number): string {
  return 'hub-beat:' + hubId + ':' + beatId + ':t' + String(turn);
}
