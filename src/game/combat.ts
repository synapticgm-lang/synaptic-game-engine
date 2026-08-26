import type { GameState, Item, Rarity } from './types';
import { equippedWeaponName } from './ledgerCombat';
import { groundedWeaponNames, weaponAuthorityLine } from './searchContinuity';

export interface EnemyStats {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  armorClass: number;
  xpReward: number;
  goldReward: number;
  lootTable?: Array<{ name: string; rarity: Rarity; chance: number }>;
}

export interface CombatRound {
  round: number;
  attacker: 'player' | 'enemy';
  hit: boolean;
  roll: number;
  damage: number;
  enemyHpAfter: number;
  playerHpAfter: number;
}

export interface CombatResult {
  victory: boolean;
  rounds: number;
  damageDealt: number;
  damageReceived: number;
  finalPlayerHp: number;
  finalPlayerMp: number;
  finalEnemyHp: number;
  xpGained: number;
  goldGained: number;
  loot: Item[];
  roundsLog: CombatRound[];
  summary: string;
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollDamage(base: number, modifier: number): number {
  return Math.max(1, base + Math.floor(Math.random() * 4) + modifier);
}

function rollLoot(enemy: EnemyStats): Item[] {
  if (!enemy.lootTable || enemy.lootTable.length === 0) return [];
  const loot: Item[] = [];
  for (const entry of enemy.lootTable) {
    if (Math.random() < entry.chance) {
      loot.push({
        id: Math.random().toString(36).slice(2, 11),
        name: entry.name,
        rarity: entry.rarity,
        quantity: 1,
      });
    }
  }
  return loot;
}

export function simulateCombat(state: GameState, enemy: EnemyStats): CombatResult {
  const player = state.character;
  const strMod = Math.floor(((player.strength ?? player.attributes?.STR ?? 14) - 10) / 2);
  const dexMod = Math.floor(((player.attributes?.DEX ?? 12) - 10) / 2);
  const conMod = Math.floor(((player.attributes?.CON ?? 12) - 10) / 2);
  const playerAC = player.armorClass ?? 12 + dexMod;
  const playerAttackMod = strMod + Math.max(1, Math.floor(player.level / 2));
  const playerDamageBase = 6 + Math.floor(player.level / 2);
  const enemyAttackMod = enemy.attack + Math.max(0, Math.floor(enemy.level / 2));
  const enemyDamageBase = enemy.attack;

  let playerHp = player.hp;
  const playerMp = player.mp;
  let enemyHp = enemy.hp;
  let rounds = 0;
  let damageDealt = 0;
  let damageReceived = 0;
  const roundsLog: CombatRound[] = [];

  const maxRounds = 50;
  while (playerHp > 0 && enemyHp > 0 && rounds < maxRounds) {
    rounds++;

    // Player attacks
    const playerRoll = rollD20();
    const playerTotal = playerRoll + playerAttackMod;
    const playerHits = playerRoll === 20 || (playerRoll !== 1 && playerTotal >= enemy.armorClass);
    let dmgToEnemy = 0;
    if (playerHits) {
      dmgToEnemy = rollDamage(playerDamageBase, strMod);
      if (playerRoll === 20) dmgToEnemy = Math.floor(dmgToEnemy * 1.5);
      enemyHp = Math.max(0, enemyHp - dmgToEnemy);
      damageDealt += dmgToEnemy;
    }
    roundsLog.push({
      round: rounds,
      attacker: 'player',
      hit: playerHits,
      roll: playerRoll,
      damage: dmgToEnemy,
      enemyHpAfter: enemyHp,
      playerHpAfter: playerHp,
    });
    if (enemyHp <= 0) break;

    // Enemy attacks
    const enemyRoll = rollD20();
    const enemyTotal = enemyRoll + enemyAttackMod;
    const enemyHits = enemyRoll === 20 || (enemyRoll !== 1 && enemyTotal >= playerAC);
    let dmgToPlayer = 0;
    if (enemyHits) {
      dmgToPlayer = rollDamage(enemyDamageBase, 0);
      if (enemyRoll === 20) dmgToPlayer = Math.floor(dmgToPlayer * 1.5);
      playerHp = Math.max(0, playerHp - dmgToPlayer);
      damageReceived += dmgToPlayer;
    }
    roundsLog.push({
      round: rounds,
      attacker: 'enemy',
      hit: enemyHits,
      roll: enemyRoll,
      damage: dmgToPlayer,
      enemyHpAfter: enemyHp,
      playerHpAfter: playerHp,
    });
  }

  const victory = enemyHp <= 0 && playerHp > 0;
  const xpGained = victory ? enemy.xpReward : Math.floor(enemy.xpReward * 0.1);
  const goldGained = victory ? enemy.goldReward : 0;
  const loot = victory ? rollLoot(enemy) : [];

  const summary = victory
    ? `Player defeated ${enemy.name} in ${rounds} rounds. Dealt ${damageDealt} damage, took ${damageReceived} damage. Gained ${xpGained} XP and ${goldGained} gold.`
    : `Player was defeated by ${enemy.name} in ${rounds} rounds. Dealt ${damageDealt} damage, took ${damageReceived} damage.`;

  return {
    victory,
    rounds,
    damageDealt,
    damageReceived,
    finalPlayerHp: playerHp,
    finalPlayerMp: playerMp,
    finalEnemyHp: enemyHp,
    xpGained,
    goldGained,
    loot,
    roundsLog,
    summary,
  };
}

export function buildAutoFightPrompt(state: GameState, enemy: EnemyStats, result: CombatResult): string {
  const player = state.character;
  const weapon = equippedWeaponName(state);
  const grounded = groundedWeaponNames(state);
  const lines: string[] = [
    `=== AUTO-RESOLVED COMBAT DATA ===`,
    `Player: ${player.name} (Level ${player.level})`,
    `HP: ${player.hp}/${player.maxHp} -> ${result.finalPlayerHp}/${player.maxHp}`,
    `Enemy: ${enemy.name} (Level ${enemy.level})`,
    `Enemy HP: ${enemy.maxHp} -> ${result.finalEnemyHp}`,
    `Rounds: ${result.rounds}`,
    `Total Damage Dealt: ${result.damageDealt}`,
    `Total Damage Received: ${result.damageReceived}`,
    `Outcome: ${result.victory ? 'VICTORY' : 'DEFEAT'}`,
    `Player weapon: ${weapon}${grounded.length ? ` (legal: ${grounded.join(', ')})` : ' — UNARMED; fists / bare hands / improvised debris only'}`,
  ];

  if (result.victory) {
    lines.push(`XP Gained: ${result.xpGained}`);
    lines.push(`Gold Gained: ${result.goldGained}`);
    if (result.loot.length > 0) {
      lines.push(`Loot: ${result.loot.map((l) => `[${l.rarity}] ${l.name}`).join(', ')}`);
    }
  }

  lines.push(`=== ROUND-BY-ROUND LOG ===`);
  for (const r of result.roundsLog) {
    if (r.attacker === 'player') {
      lines.push(`Round ${r.round} — ${player.name} ${r.hit ? `hits (d20:${r.roll}) for ${r.damage} damage` : `misses (d20:${r.roll})`}. Enemy HP: ${r.enemyHpAfter}`);
    } else {
      lines.push(`Round ${r.round} — ${enemy.name} ${r.hit ? `hits (d20:${r.roll}) for ${r.damage} damage` : `misses (d20:${r.roll})`}. Player HP: ${r.playerHpAfter}`);
    }
  }

  return `Here is the raw data of an auto-resolved fight. Write a single, fast-paced, visceral LitRPG paragraph describing this combat summary. Do not include action tags, system logs, or image prompts — just the narrative paragraph.\n\n${weaponAuthorityLine(state)}\nDo not invent a dagger, sword, or knife unless listed above.\n\n${lines.join('\n')}`;
}
