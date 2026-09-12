import type { EncounterSeed } from './types';

/** PYOA crisis rows — drought combat stays off; catalog is authored crisis nouns only. */
export const PYOA_ENCOUNTERS: EncounterSeed[] = [
  { id: 'PYOA-CRISIS-001', mode: 'pyoa', tier: 'crisis', title: 'Ferry Delay', foeName: 'Mill Landing Delay', premise: 'The ferry will not take you until a price is named.', xpReward: 0, goldReward: 0, cooldown: 20 },
  { id: 'PYOA-CRISIS-002', mode: 'pyoa', tier: 'crisis', title: 'Charter Burn', foeName: 'Charter Argument', premise: 'Someone wants the charter burned in public.', xpReward: 0, goldReward: 0, cooldown: 20 },
  { id: 'PYOA-CRISIS-003', mode: 'pyoa', tier: 'crisis', title: 'Flood Clock', foeName: 'Ford Flood Clock', premise: 'The water is rising on a locked fork.', xpReward: 0, goldReward: 0, cooldown: 18 },
  { id: 'PYOA-CRISIS-004', mode: 'pyoa', tier: 'crisis', title: 'False Guide', foeName: 'False Road Guide', premise: 'The person who offered a path wants a different ending.', xpReward: 0, goldReward: 0, cooldown: 22 },
  { id: 'PYOA-CRISIS-005', mode: 'pyoa', tier: 'crisis', title: 'Hostage Hour', foeName: 'Wayhouse Hostage', premise: 'A companion is held until you pick a side.', xpReward: 0, goldReward: 0, cooldown: 22 },
  { id: 'PYOA-CRISIS-006', mode: 'pyoa', tier: 'crisis', title: 'Debt Crowd', foeName: 'Debt Crowd', premise: 'A street crowd wants payment you do not have.', xpReward: 0, goldReward: 0, cooldown: 20 },
  { id: 'PYOA-CRISIS-007', mode: 'pyoa', tier: 'crisis', title: 'Sealed Letter', foeName: 'Sealed Letter Deadline', premise: 'A letter must be delivered before the next bell.', xpReward: 0, goldReward: 0, cooldown: 18 },
  { id: 'PYOA-CRISIS-008', mode: 'pyoa', tier: 'crisis', title: 'Ending Fork', foeName: 'Ending Fork Pressure', premise: 'Accept, refuse, or walk — the spine will lock.', xpReward: 0, goldReward: 0, cooldown: 24 },
];
