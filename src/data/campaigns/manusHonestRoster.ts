import type { CampaignBible, KeyNPC, StarterQuest } from './types';

/**
 * Manus dialogue-tree / quest leftovers as bible roster + hidden side quests.
 * Unique First Last names only. No generic archetypes as CAST.
 * Mira Voss → existing Mira the Apothecary (topic bank). Veiled Guide / Morrow skipped.
 */

export const MANUS_SP_NPCS: KeyNPC[] = [
  { id: 'sp-npc-35', name: 'Harker Vale', role: 'merchant', disposition: 'ambiguous', description: 'Harbor hold broker. Sells dry papers and wet lies.', hooks: ['Buy a hold stamp', 'Ask who paid last'] },
  { id: 'sp-npc-36', name: 'Rook Fen', role: 'informant', disposition: 'neutral', description: 'Reed-side watcher who sells which reflection is a trap.', hooks: ['Buy a true path', 'Warn of a false-step'] },
  { id: 'sp-npc-37', name: 'Fenn Lark', role: 'merchant', disposition: 'friendly', description: 'Lowmarket stall with Earth junk that is actually Earth junk.', hooks: ['Buy a tonic', 'Refuse a fake blessing'] },
  { id: 'sp-npc-38', name: 'Asha Rune', role: 'guide', disposition: 'neutral', description: 'Reliquary novice who still believes doctrine can be kind.', hooks: ['Ask the novice door', 'Hide a guest'] },
  { id: 'sp-npc-39', name: 'Kell Ward', role: 'gatekeeper', disposition: 'neutral', description: 'West Wall levy clerk who counts names, not prayers.', hooks: ['Pass the stair', 'Pay a levy lie'] },
  { id: 'sp-npc-40', name: 'Pip Aster', role: 'witness', disposition: 'friendly', description: 'Kitchen-saint runner who remembers who took bread.', hooks: ['Name the snatcher', 'Ask for a spare loaf'] },
];

export const MANUS_SP_QUESTS: StarterQuest[] = [
  { id: 'sp-quest-harbor-harker', title: 'Hold Stamp', description: 'Harker Vale prices a hold stamp that keeps press-gangs off a grain ship.', recommendedLevel: 2, objectives: ['Find Harker Vale at Harbor Quay', 'Buy, threaten, or refuse the stamp', 'Leave the quay without a new binding'], rewards: 'A hold paper — or a collector' },
  { id: 'sp-quest-reed-rook', title: 'True Reed', description: 'Rook Fen will sell which reflection is a trap if you pay in coin or a secret.', recommendedLevel: 2, objectives: ['Reach Mireglass March', 'Hear Rook’s price', 'Walk one dry path once'], rewards: 'A true step — or a false-double' },
  { id: 'sp-quest-lark-tonic', title: 'Honest Tonic', description: 'Fenn Lark’s stall sells a Health Tonic that is not a System gift.', recommendedLevel: 1, objectives: ['Find Fenn Lark in Lowmarket', 'Buy or refuse the tonic', 'Keep the receipt'], rewards: 'A tonic on the kit — or an empty purse' },
  { id: 'sp-quest-asha-door', title: 'Novice Door', description: 'Asha Rune can name a quiet door if Maelis is looking the other way.', recommendedLevel: 3, objectives: ['Enter Saint Vhal’s Reliquary', 'Ask Asha for the novice door', 'Pass or leave'], rewards: 'A quiet aisle — or a sentinel' },
  { id: 'sp-quest-kell-levy', title: 'Stair Levy', description: 'Kell Ward wants a name on the West Wall paper before the stair opens.', recommendedLevel: 2, objectives: ['Reach West Wall', 'Give, refuse, or forge the levy name', 'Take the stair or walk away'], rewards: 'A pass — or a pike' },
  { id: 'sp-quest-pip-loaf', title: 'Kitchen Saint Loaf', description: 'Pip Aster remembers who snatched the blessing bread.', recommendedLevel: 1, objectives: ['Find Kitchen Saint Alley', 'Hear Pip’s witness', 'Name or protect the snatcher'], rewards: 'A loaf, a name, or both' },
];

export const MANUS_CK_NPCS: KeyNPC[] = [
  { id: 'ck-npc-7', name: 'Dain Holt', role: 'gatekeeper', disposition: 'neutral', description: 'Greyhollow watch captain. Wants eyes on the keep gate, not boasts in the inn.', hooks: ['Ask for the watch job', 'Report the broken chain'] },
  { id: 'ck-npc-8', name: 'Elara Moss', role: 'witness', disposition: 'friendly', description: 'Inn regular who heard Oskar first and will not pretend it is weather.', hooks: ['Ask what the inn will not say', 'Walk her to the church'] },
  { id: 'ck-npc-9', name: 'Bram Coyle', role: 'informant', disposition: 'ambiguous', description: 'Coach-yard hand who saw the last footprints and sold the story twice.', hooks: ['Buy the second version', 'Confront the lie'] },
];

export const MANUS_CK_QUESTS: StarterQuest[] = [
  { id: 'ck-quest-dain-watch', title: 'Gate Watch', description: 'Dain Holt needs someone who is not from Greyhollow to stand the keep gate without panicking the town.', recommendedLevel: 1, objectives: ['Find Dain Holt at the keep gate or inn', 'Hear what the watch will admit', 'Stand one watch or refuse'], rewards: 'A gate fact — or a closed door' },
  { id: 'ck-quest-elara-inn', title: 'Inn That Heard', description: 'Elara Moss will say what the innkeeper will not: Oskar already broke the chain.', recommendedLevel: 1, objectives: ['Speak with Elara Moss at Greyhollow Inn', 'Ask who told her to be quiet', 'Carry the fact to Aldous or Helga'], rewards: 'A witness — or a mayor problem' },
];

export const MANUS_TF_NPCS: KeyNPC[] = [
  { id: 'tf-npc-4', name: 'Tomas Reed', role: 'courier', disposition: 'neutral', description: 'Ferry boatman. Wants a signature or a favor before the rope goes slack.', hooks: ['Sign the ferry debt', 'Work the crossing'] },
  { id: 'tf-npc-5', name: 'Orin Quill', role: 'clerk', disposition: 'ambiguous', description: 'Pell’s visiting clerk. Offers a duplicate seal. Forgery is a choice.', hooks: ['Take the copy', 'Tell Nedda', 'Tell Wren'] },
];

export const MANUS_TF_QUESTS: StarterQuest[] = [
  { id: 'tf-quest-ferry-debt', title: 'Ferry Debt', description: 'Tomas Reed wants a signature or a favor before the last crossing.', recommendedLevel: 1, objectives: ['Find Tomas Reed at the mill landing', 'Sign, work, or refuse the debt', 'Cross or wait'], rewards: 'A crossing — or a late ferry', type: 'side' },
  { id: 'tf-quest-clerk-copy', title: 'Clerk’s Copy', description: 'Orin Quill offers a duplicate Millstone seal. Wren will remember who you told.', recommendedLevel: 1, objectives: ['Hear Orin’s offer', 'Take, refuse, or expose the copy', 'Tell Wren or keep it'], rewards: 'A forged path — or a cleaner one', type: 'side' },
];

export const MANUS_SR_NPCS: KeyNPC[] = [
  { id: 'sr-npc-2', name: 'Yara Flint', role: 'informant', disposition: 'ambiguous', description: 'Salt-lane reader who already copied one page of the tax book.', hooks: ['Buy the page', 'Ask who paid her'] },
  { id: 'sr-npc-3', name: 'Gideon Ash', role: 'rival', disposition: 'hostile', description: 'Rival crew lead who claims this score was spoken for.', hooks: ['Refuse the cut', 'Share the night'] },
];

export const MANUS_SR_QUESTS: StarterQuest[] = [
  { id: 'sr-quest-yara-page', title: 'Copied Page', description: 'Yara Flint will sell one copied levy page before the caravan moves.', recommendedLevel: 1, objectives: ['Find Yara Flint at the waystation or bribe market', 'Buy or refuse the page', 'Keep Heat honest'], rewards: 'A page — or a louder Heat' },
  { id: 'sr-quest-gideon-claim', title: 'Spoken-For Score', description: 'Gideon Ash says the ledger night is already claimed.', recommendedLevel: 2, objectives: ['Hear Gideon’s claim', 'Share, stall, or cut him out', 'Survive the camp'], rewards: 'A partner, an enemy, or both' },
];

export const MANUS_SC_NPCS: KeyNPC[] = [
  { id: 'sc-npc-7', name: 'Nessa Crow', role: 'informant', disposition: 'neutral', description: 'Lower-ward runner who sells which lift is watched.', hooks: ['Buy a lift hour', 'Ask who paid the Sentinels'] },
];

export const MANUS_SC_QUESTS: StarterQuest[] = [
  { id: 'sc-quest-nessa-lift', title: 'Watched Lift', description: 'Nessa Crow knows which Great Lift car is being counted tonight.', recommendedLevel: 2, objectives: ['Find Nessa Crow in the Lower Ward', 'Buy or refuse the hour', 'Ride or walk the cliff'], rewards: 'A quiet car — or a Sentinel note' },
];

const BY_BIBLE: Record<string, { npcs: KeyNPC[]; quests: StarterQuest[] }> = {
  'summoned-pact': { npcs: MANUS_SP_NPCS, quests: MANUS_SP_QUESTS },
  'cursed-keep': { npcs: MANUS_CK_NPCS, quests: MANUS_CK_QUESTS },
  'thornferry-road': { npcs: MANUS_TF_NPCS, quests: MANUS_TF_QUESTS },
  'salt-road-heist': { npcs: MANUS_SR_NPCS, quests: MANUS_SR_QUESTS },
  'shattered-coast': { npcs: MANUS_SC_NPCS, quests: MANUS_SC_QUESTS },
};

export function withManusHonestRoster(bible: CampaignBible): CampaignBible {
  const extra = BY_BIBLE[bible.id];
  if (!extra) return bible;
  const names = new Set(bible.keyNPCs.map((n) => n.name.trim().toLowerCase()));
  const ids = new Set([...bible.keyNPCs.map((n) => n.id), ...bible.starterQuests.map((q) => q.id)]);
  const npcs = extra.npcs.filter((n) => !names.has(n.name.trim().toLowerCase()) && !ids.has(n.id));
  const quests = extra.quests.filter((q) => !ids.has(q.id));
  if (!npcs.length && !quests.length) return bible;
  return {
    ...bible,
    keyNPCs: [...bible.keyNPCs, ...npcs],
    starterQuests: [...bible.starterQuests, ...quests],
  };
}
