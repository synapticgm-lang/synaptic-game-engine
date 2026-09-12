import { FAST_XP_AWARDS } from '@/game/xpPolicy';
import type { EncounterSeed } from './types';

const T = FAST_XP_AWARDS.combatTrash;
const E = FAST_XP_AWARDS.combatElite;
const B = FAST_XP_AWARDS.combatBoss;

/** Tabletop catalog — Greyhollow / keep / road. Original names only. */
export const DND_ENCOUNTERS: EncounterSeed[] = [
  { id: 'DND-TRASH-001', mode: 'dnd', tier: 'trash', title: 'Road Cutpurse', foeName: 'Road Bandit', premise: 'A cutpurse steps from the ditch.', xpReward: T, goldReward: 5, cooldown: 14 },
  { id: 'DND-TRASH-002', mode: 'dnd', tier: 'trash', title: 'Hired Steel', foeName: 'Hired Blade', premise: 'Someone paid for a short fight on the coach road.', xpReward: T, goldReward: 6, cooldown: 14 },
  { id: 'DND-TRASH-003', mode: 'dnd', tier: 'trash', title: 'Shadow Throat', foeName: 'Shadow Cutthroat', premise: 'A throat-cutter waits under the eaves.', xpReward: T, goldReward: 6, cooldown: 14 },
  { id: 'DND-TRASH-004', mode: 'dnd', tier: 'trash', title: 'Wilds Stalk', foeName: 'Wilds Stalker', premise: 'Something in the trees matches your pace.', xpReward: T, goldReward: 5, cooldown: 16 },
  { id: 'DND-TRASH-005', mode: 'dnd', tier: 'trash', title: 'Chapel Shade', foeName: 'Chapel Shade', premise: 'A cold shape lifts from a pew.', xpReward: T, goldReward: 5, cooldown: 16 },
  { id: 'DND-TRASH-006', mode: 'dnd', tier: 'trash', title: 'Gate Haunt', foeName: 'Gate Haunt', premise: 'The keep gate remembers a death.', xpReward: T, goldReward: 6, cooldown: 16 },
  { id: 'DND-TRASH-007', mode: 'dnd', tier: 'trash', title: 'Crypt Slip', foeName: 'Crypt Shade', premise: 'A shade slides between headstones.', xpReward: T, goldReward: 5, cooldown: 16 },
  { id: 'DND-TRASH-008', mode: 'dnd', tier: 'trash', title: 'Inn Brawl', foeName: 'Greyhollow Brawler', premise: 'A drunk decides you are the night’s problem.', xpReward: T, goldReward: 4, cooldown: 14 },
  { id: 'DND-ELITE-001', mode: 'dnd', tier: 'elite', title: 'Keep Wraith', foeName: 'Keep Wraith', premise: 'A wraith claims the stair as its hall.', xpReward: E, goldReward: 18, cooldown: 22 },
  { id: 'DND-ELITE-002', mode: 'dnd', tier: 'elite', title: 'Graveyard Open', foeName: 'Opened-Grave Walker', premise: 'A fresh grave answers from the inside.', xpReward: E, goldReward: 16, cooldown: 22 },
  { id: 'DND-ELITE-003', mode: 'dnd', tier: 'elite', title: 'Apothecary Debt', foeName: 'Tincture Thug', premise: 'Someone wants Mira’s journals more than you do.', xpReward: E, goldReward: 15, cooldown: 20 },
  { id: 'DND-ELITE-004', mode: 'dnd', tier: 'elite', title: 'Coach Ambush', foeName: 'Coach Road Bravo', premise: 'Armed riders box the last coach.', xpReward: E, goldReward: 18, cooldown: 20 },
  { id: 'DND-ELITE-005', mode: 'dnd', tier: 'elite', title: 'Chapel Bell', foeName: 'Sleepless Bell-Warden', premise: 'Six nights of ringing take a body.', xpReward: E, goldReward: 20, cooldown: 22 },
  { id: 'DND-BOSS-001', mode: 'dnd', tier: 'boss', title: 'Keep Heart', foeName: 'Greymark Keep Warden', premise: 'The hill keep names a last defender.', xpReward: B, goldReward: 50, cooldown: 40 },
  { id: 'DND-BOSS-002', mode: 'dnd', tier: 'boss', title: 'Crypt Lord', foeName: 'Greyhollow Crypt Lord', premise: 'The opened graves answer to one voice.', xpReward: B, goldReward: 55, cooldown: 40 },
  { id: 'DND-BOSS-003', mode: 'dnd', tier: 'boss', title: 'Curse Seat', foeName: 'Cursed Seat Shade', premise: 'The keep’s curse sits down in a chair and fights.', xpReward: B, goldReward: 60, cooldown: 50 },
];
