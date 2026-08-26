/**
 * Hub -> encounter / pressure / hook banks (Act-4).
 * Deterministic mix of explore / social / threat by threatTier.
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
};

/** Thin arrival beats for ported LitRPG + flagship tabletop/RPG. */
const SI_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'si-hub-street': [
    { id: 'si-st-explore', kind: 'explore', pressure: 'Cracked asphalt and a blue panel. First Blood waits nearby.', choiceHints: ['Scan the cracked street', 'Check the panel', 'Move toward the store'] },
  ],
  'si-hub-store': [
    { id: 'si-store-threat', kind: 'threat', pressure: 'Micro-dungeon air — Tier-1 pressure past the glass.', choiceHints: ['Enter the store carefully', 'Scout from the doorway', 'Ready a defensive stance'], revealQuestId: 'si-quest-1' },
  ],
  'si-hub-riverside': [
    { id: 'si-riv-social', kind: 'social', pressure: 'Warden Elise Cho\'s hub offers sanction for Wave duty.', choiceHints: ['Talk to Elise Cho', 'Ask about housing', 'Walk the stronghold wall'], contactName: 'Elise Cho', revealQuestId: 'si-quest-2' },
  ],
  'si-hub-dead-border': [
    { id: 'si-dz-threat', kind: 'threat', pressure: 'Violet sky — panels fail past this line.', choiceHints: ['Study the border', 'Fall back to Riverside', 'Ask about a guide'], revealQuestId: 'si-quest-4' },
  ],
};

const GW_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'gw-hub-shelter': [
    { id: 'gw-sh-explore', kind: 'explore', pressure: 'Civilian bunks and scrap beds under Ward 9.', choiceHints: ['Check the shelter roster', 'Help a civilian', 'Ask about the subway gate'] },
  ],
  'gw-hub-militia': [
    { id: 'gw-mi-social', kind: 'social', pressure: 'Sergeant Rill ignores unlicensed clears if you protect people.', choiceHints: ['Talk to Sergeant Rill', 'Request an armband', 'Report gate intel'], contactName: 'Sergeant Rill' },
  ],
  'gw-hub-subway': [
    { id: 'gw-su-threat', kind: 'threat', pressure: 'B-gate crackle under the tracks.', choiceHints: ['Scout the subway gate', 'Hold the platform', 'Fall back to shelter'], revealQuestId: 'gatebreak-ward-quest-1' },
  ],
  'gw-hub-guild': [
    { id: 'gw-gu-social', kind: 'social', pressure: 'Vex Harlan smiles like a contract.', choiceHints: ['Talk to Vex Harlan', 'Hard refuse the cut', 'Ask about B-gate intel'], contactName: 'Vex Harlan' },
  ],
};

const AS_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'as-hub-gate': [
    { id: 'as-gate-explore', kind: 'explore', pressure: 'Black tower overhead. Permits and intel buyers.', choiceHints: ['Approach the Spire Gate', 'Ask about Floor Law', 'Watch the climbers'] },
  ],
  'as-hub-board': [
    { id: 'as-board-hook', kind: 'hook', pressure: 'Ranking Board lists living climbers — fame brings contracts.', choiceHints: ['Read the Ranking Board', 'Ask about Floor 1', 'Note rival names'] },
  ],
  'as-hub-floor1': [
    { id: 'as-f1-threat', kind: 'threat', pressure: 'Floor 1 laws press before the Warden.', choiceHints: ['Enter Floor 1 carefully', 'Study posted Floor Law', 'Hold the antechamber'], revealQuestId: 'ascending-spire-quest-1' },
  ],
  'as-hub-rival': [
    { id: 'as-riv-social', kind: 'social', pressure: 'Nyra Vell may ally — or steal clear credit.', choiceHints: ['Talk to Nyra Vell', 'Offer a temporary party', 'Walk away from the race'], contactName: 'Nyra Vell' },
  ],
};

const FL_HUB_BEATS: Record<string, HubArrivalBeat[]> = {
  'fl-hub-inn': [
    { id: 'fl-inn-social', kind: 'social', pressure: 'A wounded stranger and village eyes at The Crooked Beam.', choiceHints: ['Talk to the stranger', 'Ask Fen about lodging', 'Sit quietly and listen'], contactName: 'Corvin', revealQuestId: 'fl-quest-1' },
  ],
  'fl-hub-chapel': [
    { id: 'fl-ch-explore', kind: 'explore', pressure: 'Old Faith menhir — Brennan\'s Weave talk lives here.', choiceHints: ['Visit the menhir', 'Talk to Old Brennan', 'Walk the chapel path'], contactName: 'Old Brennan' },
  ],
  'fl-hub-smithy': [
    { id: 'fl-sm-social', kind: 'social', pressure: 'Marta needs help with the ceremonial sickle.', choiceHints: ['Talk to Marta', 'Offer forge help', 'Ask about the hills'], contactName: 'Marta', revealQuestId: 'fl-quest-2' },
  ],
  'fl-hub-trail': [
    { id: 'fl-tr-explore', kind: 'explore', pressure: 'Lower Greentooth path toward ambush marks and cairn rumors.', choiceHints: ['Walk the trailhead', 'Look for drag marks', 'Turn back to Mossford'], revealQuestId: 'fl-quest-3' },
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
