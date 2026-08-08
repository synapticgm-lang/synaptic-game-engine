import type { MockSkill, MockLoot, MockEnemy } from '@/types';
export { ALL_CAMPAIGN_BIBLES, getCampaignBibleById, getCampaignBiblesByEngineMode } from '@/data/campaigns';
export type { CampaignBible } from '@/data/campaigns';

export const mockSkills: MockSkill[] = [
  // Combat branch
  { id: 'sk_cleave', name: 'Cleave', description: 'Strike two adjacent enemies in one swing.', branch: 'combat', tier: 1, unlocked: true, prerequisites: [], icon: 'sword' },
  { id: 'sk_power_atk', name: 'Power Attack', description: 'Trade accuracy for raw damage (+50%).', branch: 'combat', tier: 2, unlocked: true, prerequisites: ['sk_cleave'], icon: 'hammer' },
  { id: 'sk_whirlwind', name: 'Whirlwind Strike', description: 'Hit all enemies within 5 ft.', branch: 'combat', tier: 3, unlocked: false, prerequisites: ['sk_power_atk'], icon: 'tornado' },
  // Magic branch
  { id: 'sk_firebolt', name: 'Firebolt', description: 'Hurl a bolt of flame dealing 1d10 fire damage.', branch: 'magic', tier: 1, unlocked: true, prerequisites: [], icon: 'flame' },
  { id: 'sk_mage_armor', name: 'Mage Armor', description: 'Conjure protective force: AC becomes 13 + DEX.', branch: 'magic', tier: 2, unlocked: true, prerequisites: ['sk_firebolt'], icon: 'shield' },
  { id: 'sk_fireball', name: 'Fireball', description: 'Explosive AoE: 8d6 fire damage in a 20-ft radius.', branch: 'magic', tier: 3, unlocked: false, prerequisites: ['sk_mage_armor'], icon: 'explosion' },
  // Survival branch
  { id: 'sk_forage', name: 'Foraging', description: 'Find food and herbs in the wild.', branch: 'survival', tier: 1, unlocked: true, prerequisites: [], icon: 'leaf' },
  { id: 'sk_track', name: 'Tracking', description: 'Follow creature tracks for miles.', branch: 'survival', tier: 2, unlocked: false, prerequisites: ['sk_forage'], icon: 'footprints' },
  // Crafting branch
  { id: 'sk_smith', name: 'Basic Smithing', description: 'Craft common weapons and armor.', branch: 'crafting', tier: 1, unlocked: true, prerequisites: [], icon: 'anvil' },
  { id: 'sk_enchant', name: 'Enchanting', description: 'Imbue items with magical properties.', branch: 'crafting', tier: 2, unlocked: false, prerequisites: ['sk_smith'], icon: 'sparkles' },
];

export const mockLoot: MockLoot[] = [
  { id: 'loot_001', name: 'Iron Sword', rarity: 'Common', itemType: 'weapon', itemLevel: 1, description: 'A simple iron blade, reliable but unremarkable.' },
  { id: 'loot_002', name: 'Oakwood Bow', rarity: 'Common', itemType: 'weapon', itemLevel: 2, description: 'A sturdy shortbow carved from oak.' },
  { id: 'loot_003', name: 'Healing Draught', rarity: 'Common', itemType: 'consumable', itemLevel: 1, description: 'Restores 2d4+2 HP when consumed.' },
  { id: 'loot_004', name: 'Shadowweave Cloak', rarity: 'Uncommon', itemType: 'armor', itemLevel: 3, description: 'Grants advantage on Stealth checks in dim light.' },
  { id: 'loot_005', name: 'Ring of Minor Warding', rarity: 'Uncommon', itemType: 'accessory', itemLevel: 4, description: '+1 to AC while attuned.' },
  { id: 'loot_006', name: 'Frostbite Dagger', rarity: 'Rare', itemType: 'weapon', itemLevel: 5, description: 'Deals an extra 1d4 cold damage on hit.' },
  { id: 'loot_007', name: 'Amulet of the Wolf', rarity: 'Rare', itemType: 'accessory', itemLevel: 6, description: 'Increases movement speed by 10 ft.' },
  { id: 'loot_008', name: 'Dragonscale Plate', rarity: 'Epic', itemType: 'armor', itemLevel: 8, description: 'Forged from red dragon scales. Fire resistance.' },
  { id: 'loot_009', name: 'Staff of Arcane Fury', rarity: 'Epic', itemType: 'weapon', itemLevel: 9, description: 'Spell save DC +2. Critical spells deal max damage.' },
  { id: 'loot_010', name: 'Crown of the Eternal', rarity: 'Legendary', itemType: 'accessory', itemLevel: 12, description: 'Once per day, automatically succeed on a saving throw.' },
];

export const mockEnemies: MockEnemy[] = [
  { id: 'enemy_goblin', name: 'Goblin Scout', hp: 7, ac: 15, cr: '1/4', type: 'Humanoid', description: 'A wiry, opportunistic raider with a shortbow.' },
  { id: 'enemy_skeleton', name: 'Skeleton Warrior', hp: 13, ac: 13, cr: '1/2', type: 'Undead', description: 'A reanimated soldier, resistant to piercing.' },
  { id: 'enemy_wolf', name: 'Dire Wolf', hp: 37, ac: 14, cr: '1', type: 'Beast', description: 'A massive wolf with a knockdown bite.' },
  { id: 'enemy_ogre', name: 'Ogre Brute', hp: 30, ac: 11, cr: '2', type: 'Giant', description: 'Slow but devastating; deals 2d8+4 with its club.' },
  { id: 'enemy_wraith', name: 'Shadow Wraith', hp: 39, ac: 13, cr: '3', type: 'Undead', description: 'Incorporeal; immune to non-magical weapons.' },
  { id: 'enemy_troll', name: 'Cave Troll', hp: 84, ac: 15, cr: '5', type: 'Giant', description: 'Regenerates 15 HP per turn unless burned by acid or fire.' },
  { id: 'enemy_dragon', name: 'Young Red Dragon', hp: 178, ac: 18, cr: '10', type: 'Dragon', description: 'Breathes fire in a 30-ft cone for 24d6 damage.' },
];
