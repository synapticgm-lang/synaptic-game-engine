import { FAST_XP_AWARDS } from '@/game/xpPolicy';
import type { EncounterSeed } from './types';

const T = FAST_XP_AWARDS.combatTrash;
const E = FAST_XP_AWARDS.combatElite;
const B = FAST_XP_AWARDS.combatBoss;

/** LitRPG catalog — 8 trash + 5 elite + 3 boss, plus Phase 3 hub ties. Original names only. */
export const LITRPG_ENCOUNTERS: EncounterSeed[] = [
  { id: 'LITRPG-TRASH-001', mode: 'litrpg', tier: 'trash', title: 'Wardline Skirmish', foeName: 'Pact-Hunter Skirmisher', premise: 'A licensed hunter tests your Mark at the wardline.', xpReward: T, goldReward: 6, cooldown: 12 },
  { id: 'LITRPG-TRASH-002', mode: 'litrpg', tier: 'trash', title: 'Void Scavenge', foeName: 'Void-Touched Scavenger', premise: 'A scavenger with a cracked panel lunges for Earth kit.', xpReward: T, goldReward: 5, cooldown: 12 },
  { id: 'LITRPG-TRASH-003', mode: 'litrpg', tier: 'trash', title: 'Road Cut', foeName: 'Wardline Bandit', premise: 'A bandit steps from a checkpoint shadow.', xpReward: T, goldReward: 7, cooldown: 12 },
  { id: 'LITRPG-TRASH-004', mode: 'litrpg', tier: 'trash', title: 'Remnant Flicker', foeName: 'Calamity Remnant', premise: 'A leftover Mark-echo tries to copy your panel.', xpReward: T, goldReward: 5, cooldown: 14 },
  { id: 'LITRPG-TRASH-005', mode: 'litrpg', tier: 'trash', title: 'Sewer Swarm', foeName: 'Integration Rat Pack', premise: 'Mutated rats boil from a grate.', xpReward: T, goldReward: 4, cooldown: 16, hubId: 'sp-hub-lowmarket' },
  { id: 'LITRPG-TRASH-006', mode: 'litrpg', tier: 'trash', title: 'Quay Press', foeName: 'Harbor Press-Gang', premise: 'A press crew tries to claim an unmarked body.', xpReward: T, goldReward: 6, cooldown: 14, hubId: 'sp-hub-harbor' },
  { id: 'LITRPG-TRASH-007', mode: 'litrpg', tier: 'trash', title: 'Reed Ambush', foeName: 'Mireglass Echo-Blade', premise: 'A reflection-wrong scout cuts from the reeds.', xpReward: T, goldReward: 6, cooldown: 14, hubId: 'sp-hub-mireglass' },
  { id: 'LITRPG-TRASH-008', mode: 'litrpg', tier: 'trash', title: 'Ash Trackers', foeName: 'Cinderwake Ashhound', premise: 'Heat-trackers follow your last footprint.', xpReward: T, goldReward: 6, cooldown: 14, hubId: 'sp-hub-cinderwake' },
  { id: 'LITRPG-ELITE-001', mode: 'litrpg', tier: 'elite', title: 'Bound Knight', foeName: 'Sump Bound Knight', premise: 'A contract-bound knight bars the court stair.', xpReward: E, goldReward: 18, cooldown: 20, hubId: 'sp-hub-sump-court' },
  { id: 'LITRPG-ELITE-002', mode: 'litrpg', tier: 'elite', title: 'Ledger Duel', foeName: 'Argent Rival Blade', premise: 'A licensed rival wants your rank paper torn.', xpReward: E, goldReward: 20, cooldown: 20, hubId: 'sp-hub-argent' },
  { id: 'LITRPG-ELITE-003', mode: 'litrpg', tier: 'elite', title: 'Relic Guard', foeName: 'Reliquary Sentinel', premise: 'A relic ward takes a living stance.', xpReward: E, goldReward: 22, cooldown: 22, hubId: 'sp-hub-reliquary' },
  { id: 'LITRPG-ELITE-004', mode: 'litrpg', tier: 'elite', title: 'Engine Hazard', foeName: 'Hollow Engine Warden', premise: 'A containment ring goes live around you.', xpReward: E, goldReward: 20, cooldown: 22, hubId: 'sp-hub-hollow-engine' },
  { id: 'LITRPG-ELITE-005', mode: 'litrpg', tier: 'elite', title: 'Scar Scout', foeName: 'Integration Scar Scout', premise: 'A scar-side hunter reads your pact loadout.', xpReward: E, goldReward: 24, cooldown: 22, hubId: 'sp-hub-integration-scar' },
  { id: 'LITRPG-BOSS-001', mode: 'litrpg', tier: 'boss', title: 'Bell Containment', foeName: 'Hollow Bell Warden', premise: 'The engine’s last lock steps into the aisle.', xpReward: B, goldReward: 50, cooldown: 40, hubId: 'sp-hub-hollow-engine' },
  { id: 'LITRPG-BOSS-002', mode: 'litrpg', tier: 'boss', title: 'Relic Apostate', foeName: 'Reliquary Apostate', premise: 'A doctrine-broken keeper will not let the relic leave.', xpReward: B, goldReward: 55, cooldown: 40, hubId: 'sp-hub-reliquary' },
  { id: 'LITRPG-BOSS-003', mode: 'litrpg', tier: 'boss', title: 'Scar Finale', foeName: 'Scar Architect', premise: 'The integration clock names a final opponent.', xpReward: B, goldReward: 70, cooldown: 60, hubId: 'sp-hub-integration-scar' },
  { id: 'LITRPG-TRASH-009', mode: 'litrpg', tier: 'trash', title: 'Wall Watch Cut', foeName: 'West Wall Levy', premise: 'A levy fighter tries to pull you off the battlement stair.', xpReward: T, goldReward: 5, cooldown: 14, hubId: 'sp-hub-west-wall' },
  { id: 'LITRPG-TRASH-010', mode: 'litrpg', tier: 'trash', title: 'Cup Brawl', foeName: 'Weighing Cup Tough', premise: 'A drunk at the Cup decides your Mark is an insult.', xpReward: T, goldReward: 4, cooldown: 14, hubId: 'sp-hub-weighing-cup' },
  { id: 'LITRPG-TRASH-011', mode: 'litrpg', tier: 'trash', title: 'Hall Clerk Steel', foeName: 'Contract Hall Bravo', premise: 'A job-board hanger-on wants your notice ripped.', xpReward: T, goldReward: 6, cooldown: 14, hubId: 'sp-hub-contract-hall' },
  { id: 'LITRPG-TRASH-012', mode: 'litrpg', tier: 'trash', title: 'Close Knife', foeName: 'Close Alley Cutter', premise: 'A cutter waits between kitchen steam and the rings.', xpReward: T, goldReward: 5, cooldown: 14, hubId: 'sp-hub-cathedral-close' },
  { id: 'LITRPG-TRASH-013', mode: 'litrpg', tier: 'trash', title: 'Grain Hold Press', foeName: 'Harbor Hold Presser', premise: 'A presser tries to claim you as unpaid hold crew.', xpReward: T, goldReward: 6, cooldown: 14, hubId: 'sp-hub-harbor' },
  { id: 'LITRPG-TRASH-014', mode: 'litrpg', tier: 'trash', title: 'Camp Night Watch', foeName: 'War Camp Night-Pike', premise: 'A night pike mistakes you for a deserter.', xpReward: T, goldReward: 6, cooldown: 14, hubId: 'sp-hub-war-camp' },
  { id: 'LITRPG-TRASH-015', mode: 'litrpg', tier: 'trash', title: 'Saint Alley Snatch', foeName: 'Kitchen Saint Snatcher', premise: 'A snatcher wants the bread and the blessing.', xpReward: T, goldReward: 4, cooldown: 14, hubId: 'sp-hub-kitchen-saint' },
  { id: 'LITRPG-TRASH-016', mode: 'litrpg', tier: 'trash', title: 'Reed Double', foeName: 'Mireglass False-Step', premise: 'A reflection-wrong step tries to walk you into the water.', xpReward: T, goldReward: 6, cooldown: 15, hubId: 'sp-hub-mireglass' },
  { id: 'LITRPG-ELITE-006', mode: 'litrpg', tier: 'elite', title: 'Quay Debt', foeName: 'Harbor Debt Collector', premise: 'A collector wants luck-pay for a cargo run you did not sign.', xpReward: E, goldReward: 18, cooldown: 20, hubId: 'sp-hub-harbor' },
  { id: 'LITRPG-ELITE-007', mode: 'litrpg', tier: 'elite', title: 'Palace Stair', foeName: 'Palace Stair Warden', premise: 'The approach stair will not take an unnamed soul.', xpReward: E, goldReward: 20, cooldown: 22, hubId: 'sp-hub-palace' },
];
