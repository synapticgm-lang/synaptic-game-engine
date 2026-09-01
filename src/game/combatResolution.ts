/**
 * Batch Z Milestone 2 — Z-2: Ledger-First Combat Resolution
 * 
 * Root cause fix: GM is called BEFORE ledger updates, so HP/state can contradict narration.
 * 
 * Solution: Roll combat outcomes and update ledger FIRST, then pass committed outcome to GM
 * for narration only. This prevents combat purgatory (HP contradictions).
 */

import type { GameState, ActiveEncounter } from './types';

export interface CombatOutcome {
  action: 'attack' | 'flee' | 'parley' | 'struggle' | 'plead';
  roll?: number;
  damage: number;
  enemyHpBefore: number;
  enemyHpAfter: number;
  enemyDied: boolean;
  playerHpChange: number;
  playerHpAfter: number;
  fleeSucceeded?: boolean;
  parleySucceeded?: boolean;
  caught?: boolean;
}

/**
 * Roll a D20 with advantage/disadvantage simulation.
 */
function rollD20(advantage = 0): number {
  if (advantage > 0) {
    // Advantage: roll twice, take higher
    const roll1 = Math.floor(Math.random() * 20) + 1;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    return Math.max(roll1, roll2);
  } else if (advantage < 0) {
    // Disadvantage: roll twice, take lower
    const roll1 = Math.floor(Math.random() * 20) + 1;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    return Math.min(roll1, roll2);
  }
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Calculate damage dealt by player attack.
 */
function calculateDamage(
  roll: number,
  playerAttack: number,
  enemyDefense: number,
  baseDamage = 5
): number {
  // Critical hit
  if (roll === 20) {
    return baseDamage * 2 + Math.max(0, playerAttack - enemyDefense);
  }
  
  // Critical miss
  if (roll === 1) {
    return 0;
  }
  
  // Normal hit: base damage + attack-defense difference
  const bonus = Math.max(0, Math.floor((playerAttack - enemyDefense) / 2));
  return Math.max(1, baseDamage + bonus + Math.floor((roll - 10) / 2));
}

/**
 * Calculate counterattack damage (enemy hits back).
 */
function calculateCounterattack(
  enemyAttack: number,
  playerDefense: number,
  enemyHp: number,
  enemyMaxHp: number
): number {
  // Dead or nearly dead enemies don't counterattack
  if (enemyHp <= 0) return 0;
  
  // Weakened enemies deal less damage
  const hpRatio = enemyHp / Math.max(1, enemyMaxHp);
  if (hpRatio < 0.25) return 0; // Too weak to fight back
  
  const baseDamage = 3;
  const bonus = Math.max(0, Math.floor((enemyAttack - playerDefense) / 2));
  const weaknessPenalty = hpRatio < 0.5 ? -2 : 0;
  
  return Math.max(0, baseDamage + bonus + weaknessPenalty);
}

/**
 * Roll combat outcome BEFORE calling GM.
 * This ensures ledger state is committed before narration.
 */
export function rollCombatOutcome(
  action: 'attack' | 'flee' | 'parley' | 'struggle' | 'plead',
  state: GameState
): CombatOutcome {
  const enemy = state.activeEncounter;
  if (!enemy) {
    throw new Error('rollCombatOutcome called with no active encounter');
  }
  
  const player = state.character;
  const playerAttack = player.attributes.STR + (player.level - 1);
  const playerDefense = player.attributes.DEX + (player.attributes.CON / 2);
  const enemyAttack = (enemy.level ?? 1) * 2;
  const enemyDefense = (enemy.level ?? 1);
  
  const enemyHpBefore = enemy.hp ?? enemy.maxHp ?? 16;
  const enemyMaxHp = enemy.maxHp ?? 16;
  
  // Attack action
  if (action === 'attack') {
    const roll = rollD20();
    const damage = calculateDamage(roll, playerAttack, enemyDefense);
    const enemyHpAfter = Math.max(0, enemyHpBefore - damage);
    const enemyDied = enemyHpAfter === 0;
    
    // Enemy counterattack (if still alive)
    const counterDamage = enemyDied ? 0 : calculateCounterattack(
      enemyAttack,
      playerDefense,
      enemyHpAfter,
      enemyMaxHp
    );
    
    return {
      action: 'attack',
      roll,
      damage,
      enemyHpBefore,
      enemyHpAfter,
      enemyDied,
      playerHpChange: -counterDamage,
      playerHpAfter: Math.max(0, player.hp - counterDamage),
    };
  }
  
  // Flee action
  if (action === 'flee') {
    const roll = rollD20();
    const fleeSucceeded = roll >= 12; // DC 12 flee check
    const caught = !fleeSucceeded;
    
    // Failed flee: enemy gets a free hit
    const failDamage = caught ? calculateCounterattack(
      enemyAttack,
      playerDefense,
      enemyHpBefore,
      enemyMaxHp
    ) : 0;
    
    return {
      action: 'flee',
      roll,
      damage: 0,
      enemyHpBefore,
      enemyHpAfter: enemyHpBefore, // Enemy HP unchanged
      enemyDied: false,
      playerHpChange: -failDamage,
      playerHpAfter: Math.max(0, player.hp - failDamage),
      fleeSucceeded,
      caught,
    };
  }
  
  // Parley action
  if (action === 'parley') {
    const roll = rollD20();
    const parleySucceeded = roll + player.attributes.CHA >= 15; // DC 15 parley check
    
    return {
      action: 'parley',
      roll,
      damage: 0,
      enemyHpBefore,
      enemyHpAfter: enemyHpBefore, // Enemy HP unchanged
      enemyDied: false,
      playerHpChange: 0,
      playerHpAfter: player.hp,
      parleySucceeded,
    };
  }
  
  // Desperate actions (struggle, plead) when caught
  if (action === 'struggle' || action === 'plead') {
    const roll = rollD20(action === 'struggle' ? 0 : -1); // Plead at disadvantage
    const escapeSucceeded = roll >= 16; // Hard DC
    
    // Failed escape: enemy gets a hit
    const failDamage = !escapeSucceeded ? calculateCounterattack(
      enemyAttack,
      playerDefense,
      enemyHpBefore,
      enemyMaxHp
    ) : 0;
    
    return {
      action,
      roll,
      damage: 0,
      enemyHpBefore,
      enemyHpAfter: enemyHpBefore,
      enemyDied: false,
      playerHpChange: -failDamage,
      playerHpAfter: Math.max(0, player.hp - failDamage),
      fleeSucceeded: escapeSucceeded,
      caught: !escapeSucceeded,
    };
  }
  
  // Fallback (should never reach here)
  return {
    action,
    damage: 0,
    enemyHpBefore,
    enemyHpAfter: enemyHpBefore,
    enemyDied: false,
    playerHpChange: 0,
    playerHpAfter: player.hp,
  };
}

/**
 * Apply combat outcome to game state (update ledger).
 * This runs BEFORE callGm so the LLM narrates committed facts.
 */
export function applyCombatOutcome(
  state: GameState,
  outcome: CombatOutcome
): GameState {
  const enemy = state.activeEncounter;
  if (!enemy) return state;
  
  // Update enemy HP
  const updatedEnemy: ActiveEncounter = {
    ...enemy,
    hp: outcome.enemyHpAfter,
  };
  
  // Update caught status if flee/struggle failed
  if (outcome.caught !== undefined) {
    updatedEnemy.caught = outcome.caught;
  }
  
  // Update player HP if took damage
  const updatedCharacter =
    outcome.playerHpChange !== 0
      ? { ...state.character, hp: outcome.playerHpAfter }
      : state.character;
  
  return {
    ...state,
    activeEncounter: outcome.enemyDied ? null : updatedEnemy,
    character: updatedCharacter,
  };
}

/**
 * Format combat outcome as binding context for GM.
 * The LLM must narrate this outcome, not invent its own.
 */
export function formatCombatOutcomeForPrompt(outcome: CombatOutcome): string {
  const lines: string[] = [];
  
  lines.push('### COMBAT OUTCOME (COMMITTED — NARRATE ONLY, DO NOT CHANGE)');
  
  if (outcome.action === 'attack') {
    lines.push(`- Your attack dealt ${outcome.damage} damage (roll: ${outcome.roll}).`);
    lines.push(`- Enemy HP: ${outcome.enemyHpBefore} → ${outcome.enemyHpAfter}${outcome.enemyDied ? ' (DEAD)' : ''}`);
    
    if (outcome.playerHpChange < 0) {
      lines.push(`- Enemy counterattack: ${-outcome.playerHpChange} damage to you.`);
      lines.push(`- Your HP: ${outcome.playerHpAfter}`);
    }
    
    if (outcome.enemyDied) {
      lines.push(`- The enemy is DEAD. Combat is over.`);
    }
  }
  
  if (outcome.action === 'flee') {
    if (outcome.fleeSucceeded) {
      lines.push(`- Flee succeeded (roll: ${outcome.roll}). You escaped.`);
    } else {
      lines.push(`- Flee failed (roll: ${outcome.roll}). You are CAUGHT.`);
      if (outcome.playerHpChange < 0) {
        lines.push(`- Enemy caught you: ${-outcome.playerHpChange} damage.`);
        lines.push(`- Your HP: ${outcome.playerHpAfter}`);
      }
      lines.push(`- Next turn: only combat actions available (no travel/inspect).`);
    }
  }
  
  if (outcome.action === 'parley') {
    if (outcome.parleySucceeded) {
      lines.push(`- Parley succeeded (roll: ${outcome.roll} + CHA). Enemy stands down.`);
    } else {
      lines.push(`- Parley refused (roll: ${outcome.roll} + CHA). Combat continues.`);
    }
  }
  
  if (outcome.action === 'struggle' || outcome.action === 'plead') {
    const actionName = outcome.action === 'struggle' ? 'Struggle' : 'Plead';
    if (outcome.fleeSucceeded) {
      lines.push(`- ${actionName} succeeded (roll: ${outcome.roll}). You broke free.`);
    } else {
      lines.push(`- ${actionName} failed (roll: ${outcome.roll}). Still caught.`);
      if (outcome.playerHpChange < 0) {
        lines.push(`- Enemy punished attempt: ${-outcome.playerHpChange} damage.`);
        lines.push(`- Your HP: ${outcome.playerHpAfter}`);
      }
    }
  }
  
  lines.push('');
  lines.push('Render this outcome in 2-3 sentences. Do not change the facts above.');
  
  return lines.join('\n');
}
