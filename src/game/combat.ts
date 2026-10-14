import type { AttributeKey, CoinPurse, GameState, Item, Rarity } from './types';
import { attrMod, meleeApproach, type FightApproach } from './fightApproach';
import { equippedWeaponName } from './ledgerCombat';
import { groundedWeaponNames, weaponAuthorityLine } from './searchContinuity';
import { enemyBodyAuthorityLine } from './combatAuthority';
import { rollLoot as rollEngineLoot, scaleTreasureGold, type LootProfile } from './lootTableRegistry';
import { rollDice } from './rules/dice';
import type { SidekickProfile } from './rules/roundCombat';
import { diceRng, turnRng } from './seededRng';

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
  /** 28d — loot source profile (mob / miniBoss / boss / rareEncounter). Default mob. */
  lootProfile?: LootProfile;
  /** 28d — CR for D&D treasure bands. */
  cr?: string | number;
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
  /** Tabletop: the exact coins the in-house coin table rolled (worth `goldGained`). */
  coinsGained?: CoinPurse;
  loot: Item[];
  roundsLog: CombatRound[];
  summary: string;
  /** 28d — engine loot lines: D&D dice; empty in other modes (the Loot line shows rarity). */
  lootLines?: string[];
  /** 28d — dry-streak pity update for GameState.lootPity. */
  lootPity?: { tier: 1 | 2 | 3 | 4; next: number };
  /** 28r — the approach the engine used. */
  approach?: FightApproach;
  /** To-hit modifiers and armour classes the rolls in `roundsLog` were made against. */
  attackMath?: { playerMod: number; playerAc: number; foeMod: number; foeAc: number };
  /** The companion's share of the fight (only when an ally fought). */
  ally?: { name: string; damageDealt: number; damageTaken: number; hpBefore: number; hpAfter: number };
}

function rollD20(rng: () => number): number {
  return Math.floor(rng() * 20) + 1;
}

function rollDamage(base: number, modifier: number, rng: () => number): number {
  return Math.max(1, base + Math.floor(rng() * 4) + modifier);
}

function equippedGearMod(state: GameState, key: AttributeKey): number {
  let bonus = 0;
  for (const item of state.inventory ?? []) {
    if (item.equipped && item.modifiers) bonus += item.modifiers[key] ?? 0;
  }
  return bonus;
}

export interface SimulateCombatOptions {
  /** 28r — gear/skill approach (fightApproach). Default melee. */
  approach?: FightApproach;
  rng?: () => number;
  /** A companion fighting beside the PC (sidekick numbers): it swings after the PC each round and can be targeted. */
  ally?: SidekickProfile;
}

function rollLoot(enemy: EnemyStats, seed: string): Item[] {
  if (!enemy.lootTable || enemy.lootTable.length === 0) return [];
  const loot: Item[] = [];
  const rng = diceRng(seed);
  for (const entry of enemy.lootTable) {
    if (rng() < entry.chance) {
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

/** 28d — the engine loot roll on a win (lootTableRegistry.rollLoot): seeded, never the AI. */
export function rollVictoryLoot(
  state: GameState,
  enemy: Pick<EnemyStats, 'name' | 'goldReward' | 'lootTable' | 'lootProfile' | 'cr'>
): Pick<CombatResult, 'goldGained' | 'coinsGained' | 'loot' | 'lootLines' | 'lootPity'> {
  const firstKill = !(state.arcDirector?.encounterClearedReceipts ?? []).some((r) => r.name === enemy.name);
  const engineLoot = rollEngineLoot({
    profile: enemy.lootProfile ?? 'mob',
    state,
    seed: `${state.seed || 'seed'}:${state.turn}:${enemy.name}`,
    cr: enemy.cr ?? null,
    foeName: enemy.name,
    firstKill,
  });
  return {
    goldGained: state.engineMode === 'dnd' && engineLoot ? engineLoot.gold : scaleTreasureGold(state, enemy.goldReward),
    ...(state.engineMode === 'dnd' && engineLoot?.coins ? { coinsGained: engineLoot.coins } : {}),
    loot: [...rollLoot(enemy as EnemyStats, `${state.seed || 'seed'}:${state.turn}:${enemy.name}:drops`), ...(engineLoot?.items ?? [])],
    lootLines: engineLoot && state.engineMode === 'dnd' ? engineLoot.dice : [],
    lootPity: engineLoot && engineLoot.nextPity != null ? { tier: engineLoot.pityTier, next: engineLoot.nextPity } : undefined,
  };
}

export function simulateCombat(state: GameState, enemy: EnemyStats, opts: SimulateCombatOptions = {}): CombatResult {
  const player = state.character;
  const approach = opts.approach ?? meleeApproach();
  const rng = opts.rng ?? turnRng(state, 'fight', enemy.name);
  const dexMod = Math.floor(((player.attributes?.DEX ?? 12) - 10) / 2);
  const atkAttrMod = attrMod(state, approach.attr);
  const playerAC = (player.armorClass ?? 12 + dexMod) + approach.ac;
  const playerAttackMod =
    atkAttrMod + Math.max(1, Math.floor(player.level / 2)) + approach.toHit + equippedGearMod(state, approach.attr);
  const playerDamageBase = 6 + Math.floor(player.level / 2) + approach.damage;
  const enemyAttackMod = enemy.attack + Math.max(0, Math.floor(enemy.level / 2));
  const enemyDamageBase = enemy.attack;

  let playerHp = player.hp;
  const playerMp = Math.max(0, player.mp - approach.mpCost);
  let enemyHp = enemy.hp;
  let rounds = 0;
  let damageDealt = 0;
  let damageReceived = 0;
  const roundsLog: CombatRound[] = [];
  const ally = opts.ally;
  let allyHp = ally?.hp ?? 0;
  let allyDealt = 0;
  let allyTaken = 0;

  // 28r — opening attacks (a shot before the foe closes, a strike from hiding): no reply this round.
  for (let i = 0; i < approach.openingAttacks && enemyHp > 0; i++) {
    const a = rollD20(rng);
    const b = approach.openingAdvantage ? rollD20(rng) : a;
    const roll = Math.max(a, b);
    const hits = roll === 20 || (roll !== 1 && roll + playerAttackMod >= enemy.armorClass);
    let dmg = 0;
    if (hits) {
      dmg = rollDamage(playerDamageBase, atkAttrMod, rng);
      if (roll === 20) dmg = Math.floor(dmg * 1.5);
      enemyHp = Math.max(0, enemyHp - dmg);
      damageDealt += dmg;
    }
    roundsLog.push({ round: 0, attacker: 'player', hit: hits, roll, damage: dmg, enemyHpAfter: enemyHp, playerHpAfter: playerHp });
  }

  const maxRounds = 50;
  while (playerHp > 0 && enemyHp > 0 && rounds < maxRounds) {
    rounds++;

    // Player attacks
    const playerRoll = rollD20(rng);
    const playerTotal = playerRoll + playerAttackMod;
    const playerHits = playerRoll === 20 || (playerRoll !== 1 && playerTotal >= enemy.armorClass);
    let dmgToEnemy = 0;
    if (playerHits) {
      dmgToEnemy = rollDamage(playerDamageBase, atkAttrMod, rng);
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

    // The companion swings right after the PC while it is still up.
    if (ally && allyHp > 0) {
      const r = rollD20(rng);
      if (r === 20 || (r !== 1 && r + ally.toHit >= enemy.armorClass)) {
        const dmg = Math.min(enemyHp, rollDice(ally.dice, rng, { crit: r === 20 }).total);
        enemyHp -= dmg;
        allyDealt += dmg;
      }
      if (enemyHp <= 0) break;
    }

    // Enemy attacks (a third of the time it turns on the companion while the companion is up).
    const atAlly = !!ally && allyHp > 0 && rng() < 1 / 3;
    const enemyRoll = rollD20(rng);
    const enemyTotal = enemyRoll + enemyAttackMod;
    const enemyHits = enemyRoll === 20 || (enemyRoll !== 1 && enemyTotal >= (atAlly ? ally!.ac : playerAC));
    let dmgToPlayer = 0;
    if (enemyHits) {
      let dmg = rollDamage(enemyDamageBase, 0, rng);
      if (enemyRoll === 20) dmg = Math.floor(dmg * 1.5);
      if (atAlly) {
        const taken = Math.min(allyHp, dmg);
        allyHp -= taken;
        allyTaken += taken;
      } else {
        dmgToPlayer = dmg;
        playerHp = Math.max(0, playerHp - dmgToPlayer);
        damageReceived += dmgToPlayer;
      }
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
  const won = victory ? rollVictoryLoot(state, enemy) : null;
  const goldGained = won?.goldGained ?? 0;
  const coinsGained = won?.coinsGained;
  const loot = won?.loot ?? [];
  const lootLines = won?.lootLines ?? [];
  const lootPity = won?.lootPity;

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
    ...(coinsGained ? { coinsGained } : {}),
    loot,
    roundsLog,
    summary,
    lootLines,
    lootPity,
    approach,
    attackMath: { playerMod: playerAttackMod, playerAc: playerAC, foeMod: enemyAttackMod, foeAc: enemy.armorClass },
    ...(ally ? { ally: { name: ally.name, damageDealt: allyDealt, damageTaken: allyTaken, hpBefore: ally.hp, hpAfter: allyHp } } : {}),
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

  return `Here is the raw data of an auto-resolved fight. Write a single, fast-paced, visceral LitRPG paragraph describing this combat summary. Do not include action tags, system logs, or image prompts — just the narrative paragraph.\n\n${weaponAuthorityLine(state)}\n${enemyBodyAuthorityLine(enemy.name)}\nDo not invent a dagger, sword, or knife unless listed above.\n\n${lines.join('\n')}`;
}
