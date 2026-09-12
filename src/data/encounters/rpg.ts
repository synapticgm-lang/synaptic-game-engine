import { FAST_XP_AWARDS } from '@/game/xpPolicy';
import type { EncounterSeed } from './types';

const T = FAST_XP_AWARDS.combatTrash;
const E = FAST_XP_AWARDS.combatElite;
const B = FAST_XP_AWARDS.combatBoss;

/** Story-RPG catalog — Salt Road / leverage fights. Original names only. */
export const RPG_ENCOUNTERS: EncounterSeed[] = [
  { id: 'RPG-TRASH-001', mode: 'rpg', tier: 'trash', title: 'Waystation Shakedown', foeName: 'Road Bandit', premise: 'A shakedown at the salt waystation.', xpReward: T, goldReward: 6, cooldown: 16 },
  { id: 'RPG-TRASH-002', mode: 'rpg', tier: 'trash', title: 'Hired Quiet', foeName: 'Hired Blade', premise: 'A quiet blade was paid to delay you.', xpReward: T, goldReward: 7, cooldown: 16 },
  { id: 'RPG-TRASH-003', mode: 'rpg', tier: 'trash', title: 'Caravan Cut', foeName: 'Caravan Cutpurse', premise: 'A crate-hand tries a knife in the dust.', xpReward: T, goldReward: 5, cooldown: 16 },
  { id: 'RPG-TRASH-004', mode: 'rpg', tier: 'trash', title: 'Salt Scout', foeName: 'Brine Scout', premise: 'A scout wants your papers or your blood.', xpReward: T, goldReward: 6, cooldown: 16 },
  { id: 'RPG-TRASH-005', mode: 'rpg', tier: 'trash', title: 'Cliff Purse', foeName: 'Cliff Cutpurse', premise: 'Someone works the switchbacks.', xpReward: T, goldReward: 5, cooldown: 16 },
  { id: 'RPG-TRASH-006', mode: 'rpg', tier: 'trash', title: 'Camp Guard', foeName: 'Caravan Camp Guard', premise: 'A guard decides you looked at the wrong crate.', xpReward: T, goldReward: 6, cooldown: 16 },
  { id: 'RPG-TRASH-007', mode: 'rpg', tier: 'trash', title: 'Ledger Thug', foeName: 'Tax-Ledger Thug', premise: 'The Consul’s numbers travel with fists.', xpReward: T, goldReward: 7, cooldown: 16 },
  { id: 'RPG-TRASH-008', mode: 'rpg', tier: 'trash', title: 'Salt Wight', foeName: 'Coastal Wight', premise: 'A brine-wrong corpse stands in the ditch.', xpReward: T, goldReward: 5, cooldown: 18 },
  { id: 'RPG-ELITE-001', mode: 'rpg', tier: 'elite', title: 'Saltmar Raid', foeName: 'Saltmar Raider', premise: 'Raiders want the sealed crate more than the road.', xpReward: E, goldReward: 20, cooldown: 22 },
  { id: 'RPG-ELITE-002', mode: 'rpg', tier: 'elite', title: 'Rival Crew', foeName: 'Rival Heist Crew', premise: 'Another crew claims this job.', xpReward: E, goldReward: 18, cooldown: 22 },
  { id: 'RPG-ELITE-003', mode: 'rpg', tier: 'elite', title: 'Consul Steel', foeName: 'Consul Household Blade', premise: 'Household steel steps off the ledger wagon.', xpReward: E, goldReward: 22, cooldown: 22 },
  { id: 'RPG-ELITE-004', mode: 'rpg', tier: 'elite', title: 'Quarry Ambush', foeName: 'Stonevein Ambush', premise: 'The quarry path is already claimed.', xpReward: E, goldReward: 18, cooldown: 22 },
  { id: 'RPG-ELITE-005', mode: 'rpg', tier: 'elite', title: 'Harbor Knife', foeName: 'Brinewatch Knife', premise: 'A harbor argument becomes a fight.', xpReward: E, goldReward: 16, cooldown: 20 },
  { id: 'RPG-BOSS-001', mode: 'rpg', tier: 'boss', title: 'Consul Guard', foeName: 'Consul Road Captain', premise: 'The caravan’s last captain will not lose the tax.', xpReward: B, goldReward: 55, cooldown: 40 },
  { id: 'RPG-BOSS-002', mode: 'rpg', tier: 'boss', title: 'Keep Claim', foeName: 'Salt-Stained Keep Warden', premise: 'The keep above the harbor names a defender.', xpReward: B, goldReward: 60, cooldown: 45 },
  { id: 'RPG-BOSS-003', mode: 'rpg', tier: 'boss', title: 'Crew Betrayal', foeName: 'Crew Betrayer', premise: 'The person who planned the heist wants you gone.', xpReward: B, goldReward: 50, cooldown: 40 },
];
