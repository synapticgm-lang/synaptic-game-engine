import { FAST_XP_AWARDS } from '@/game/xpPolicy';
import type { EncounterSeed } from './types';

const T = FAST_XP_AWARDS.combatTrash;
const E = FAST_XP_AWARDS.combatElite;
const B = FAST_XP_AWARDS.combatBoss;

/**
 * Manus WS-4 / crisis libraries adapted onto the live EncounterSeed owner.
 * Keeps named foeName + existing XP/FSM. Drops Manus clocks, loot lists, and second combat design.
 * Encounter *titles* that were traps or social checks become a named foe or a PYOA crisis noun.
 */
export const MANUS_LITRPG_EXTRAS: EncounterSeed[] = [
  { id: 'LITRPG-TRASH-017', mode: 'litrpg', tier: 'trash', title: 'Ashknife Cell', foeName: 'Ashknife Cell-Blade', premise: 'A licensed cell-blade cuts from a shuttered stall when the contract bells stop together.', xpReward: T, goldReward: 6, cooldown: 14, hubId: 'sp-hub-contract-hall' },
  { id: 'LITRPG-TRASH-018', mode: 'litrpg', tier: 'trash', title: 'Chain-Mite Nest', foeName: 'Chain-Mite Nestling', premise: 'A mite-wrong crawler drops from a binding chain in the Sump.', xpReward: T, goldReward: 5, cooldown: 15, hubId: 'sp-hub-sump-court' },
  { id: 'LITRPG-ELITE-008', mode: 'litrpg', tier: 'elite', title: 'Seal-Warden Patrol', foeName: 'Seal-Warden', premise: 'A seal-warden patrol wants your Mark paper voided on the spot.', xpReward: E, goldReward: 18, cooldown: 20, hubId: 'sp-hub-west-wall' },
  { id: 'LITRPG-ELITE-009', mode: 'litrpg', tier: 'elite', title: 'Bronze Oath Duel', foeName: 'Bronze Oath Duelist', premise: 'A licensed duelist claims the Argent aisle for a ranked bout.', xpReward: E, goldReward: 20, cooldown: 22, hubId: 'sp-hub-argent' },
  { id: 'LITRPG-ELITE-010', mode: 'litrpg', tier: 'elite', title: 'Glass-Binder Raid', foeName: 'Glass-Binder Raider', premise: 'A glass-binder raider tries to smash a reflection-wrong path through the March.', xpReward: E, goldReward: 18, cooldown: 22, hubId: 'sp-hub-mireglass' },
  { id: 'LITRPG-BOSS-004', mode: 'litrpg', tier: 'boss', title: 'Covenant Devourer', foeName: 'Covenant Devourer', premise: 'A pact-eater steps out of a broken clause and tries to swallow the Mark.', xpReward: B, goldReward: 55, cooldown: 45, hubId: 'sp-hub-hollow-engine' },
  { id: 'LITRPG-BOSS-005', mode: 'litrpg', tier: 'boss', title: 'Null Notary', foeName: 'Null Notary', premise: 'A notary with no name tries to stamp you off the ledger.', xpReward: B, goldReward: 60, cooldown: 50, hubId: 'sp-hub-palace' },
  { id: 'LITRPG-BOSS-006', mode: 'litrpg', tier: 'boss', title: 'Unbound Chimera', foeName: 'Unbound Chimera', premise: 'An unbound chimera tests the scar clock before the finale lock.', xpReward: B, goldReward: 70, cooldown: 55, hubId: 'sp-hub-integration-scar' },
];

export const MANUS_DND_EXTRAS: EncounterSeed[] = [
  { id: 'DND-TRASH-011', mode: 'dnd', tier: 'trash', title: 'Skeletal Retainers', foeName: 'Skeletal Retainer', premise: 'A Greymark retainer stands up from the pew dust.', xpReward: T, goldReward: 5, cooldown: 16 },
  { id: 'DND-TRASH-012', mode: 'dnd', tier: 'trash', title: 'Cistern Shade', foeName: 'Cistern Shade', premise: 'Black water in the keep cistern takes a throat.', xpReward: T, goldReward: 5, cooldown: 16 },
  { id: 'DND-ELITE-008', mode: 'dnd', tier: 'elite', title: 'Chapel Pendulum', foeName: 'Chapel Pendulum Shade', premise: 'The sleepless bell takes a body that swings like a pendulum.', xpReward: E, goldReward: 18, cooldown: 22 },
  { id: 'DND-ELITE-009', mode: 'dnd', tier: 'elite', title: 'Castellan Heir', foeName: 'Castellan Heir', premise: 'A keep heir still claims the stair as a duel ground.', xpReward: E, goldReward: 20, cooldown: 22 },
  { id: 'DND-ELITE-010', mode: 'dnd', tier: 'elite', title: 'Lantern Pilgrim', foeName: 'Lantern Pilgrim', premise: 'A pilgrim with a cold lantern blocks the cross-stair.', xpReward: E, goldReward: 16, cooldown: 20 },
  { id: 'DND-BOSS-004', mode: 'dnd', tier: 'boss', title: 'Hollow Castellan', foeName: 'Hollow Castellan', premise: 'The keep’s last officer sits down in the curse chair and fights.', xpReward: B, goldReward: 60, cooldown: 50 },
];

export const MANUS_RPG_EXTRAS: EncounterSeed[] = [
  { id: 'RPG-TRASH-011', mode: 'rpg', tier: 'trash', title: 'Dock Union', foeName: 'Dock Union Enforcer', premise: 'A dock union enforcer wants the sealed pouch or a broken hand.', xpReward: T, goldReward: 6, cooldown: 16 },
  { id: 'RPG-TRASH-012', mode: 'rpg', tier: 'trash', title: 'Night Market', foeName: 'Night Market Seizer', premise: 'A night-market seizer tries to claim the tax crate as contraband.', xpReward: T, goldReward: 6, cooldown: 16 },
  { id: 'RPG-ELITE-008', mode: 'rpg', tier: 'elite', title: 'Salt Clerk Steel', foeName: 'Salt Clerk Bravo', premise: 'A salt clerk who can read the levy book wants you silent.', xpReward: E, goldReward: 18, cooldown: 20 },
  { id: 'RPG-ELITE-009', mode: 'rpg', tier: 'elite', title: 'Black Ledger', foeName: 'Black Ledger Knife', premise: 'Someone who already copied the black ledger wants the original burned.', xpReward: E, goldReward: 20, cooldown: 22 },
  { id: 'RPG-ELITE-010', mode: 'rpg', tier: 'elite', title: 'Silk Lane', foeName: 'Silk Lane Bravo', premise: 'A silk-lane bravo ambushes the approach to the harbor fence.', xpReward: E, goldReward: 16, cooldown: 20 },
  { id: 'RPG-BOSS-004', mode: 'rpg', tier: 'boss', title: 'Harbormaster Claim', foeName: 'Harbormaster Claimant', premise: 'The harbormaster’s last claimant will not lose the levy night.', xpReward: B, goldReward: 55, cooldown: 42 },
];

/** Crisis nouns only — drought combat stays off. No sci-fi reactor/oxygen rows (wrong bibles). */
export const MANUS_PYOA_EXTRAS: EncounterSeed[] = [
  { id: 'PYOA-CRISIS-011', mode: 'pyoa', tier: 'crisis', title: 'Bandit Village Fork', foeName: 'Bandit-or-Village Fork', premise: 'The road wants you to pick the mill hamlet or the armed ditch.', xpReward: 0, goldReward: 0, cooldown: 20 },
  { id: 'PYOA-CRISIS-012', mode: 'pyoa', tier: 'crisis', title: 'Floodgate Sacrifice', foeName: 'Floodgate Sacrifice', premise: 'The floodgate will take a crate, a name, or a body.', xpReward: 0, goldReward: 0, cooldown: 20 },
  { id: 'PYOA-CRISIS-013', mode: 'pyoa', tier: 'crisis', title: 'Bell of Witness', foeName: 'Bell of Witness', premise: 'The chapel bell will record who still walks with the charter.', xpReward: 0, goldReward: 0, cooldown: 22 },
  { id: 'PYOA-CRISIS-014', mode: 'pyoa', tier: 'crisis', title: 'Social Standoff', foeName: 'Ferry Standoff Crowd', premise: 'Two sides refuse the rope while witnesses gather.', xpReward: 0, goldReward: 0, cooldown: 22 },
  { id: 'PYOA-CRISIS-015', mode: 'pyoa', tier: 'crisis', title: 'Deadline Pressure', foeName: 'Ferry Deadline Clock', premise: 'The last crossing leaves on a named bell.', xpReward: 0, goldReward: 0, cooldown: 18 },
  { id: 'PYOA-CRISIS-016', mode: 'pyoa', tier: 'crisis', title: 'Betrayal Reveal', foeName: 'Charter Betrayal Proof', premise: 'A seal date does not match the story you were told.', xpReward: 0, goldReward: 0, cooldown: 22 },
];
