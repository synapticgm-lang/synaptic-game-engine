import type { CharacterState, Combatant, EncounterLedger, RaceId, WorldPack } from '../types';
import { spawnCombatants } from './hpCheck';
import { startQuest } from './quests';

const emptyFirstHour = {
  hasSpawned: false,
  hasSeenProse: false,
  hasAcceptedFirstQuest: false,
  hasCompletedFirstCombat: false,
  hasSeenJournalTick: false,
  hasSeenSystemWindow: false,
  hasSeenOtherPlayers: false,
  hasSafeLoggedOut: false,
};

export function createCharacter(args: {
  accountId: string;
  name: string;
  raceId: RaceId;
  pack: WorldPack;
}): CharacterState {
  const kit = args.pack.races.find((r) => r.id === args.raceId);
  if (!kit) throw new Error('unknown race');
  const ch: CharacterState = {
    id: `char_${args.accountId}_${args.raceId}`,
    accountId: args.accountId,
    worldId: args.pack.id,
    name: args.name,
    raceId: args.raceId,
    placeId: kit.startingPlaceId,
    hp: 30,
    maxHp: 30,
    sta: 10,
    maxSta: 10,
    gold: 0,
    xp: 0,
    inventory: [
      { templateId: kit.starterWeaponId, durability: 100, equipped: true },
      { templateId: 'item_padded_vest', durability: 100, equipped: true },
      { templateId: 'item_system_bandage', durability: 100, equipped: false },
      { templateId: 'item_salvage_kit', durability: 100, equipped: false },
      { templateId: kit.starterMapId, durability: 100, equipped: false },
    ],
    quests: [],
    firstHour: { ...emptyFirstHour, hasSpawned: true },
    visitedPlaceIds: [kit.startingPlaceId],
  };
  const first = args.pack.quests.find((q) => q.id === kit.firstHourQuestId);
  return first ? startQuest(ch, first) : ch;
}

export function playerCombatant(ch: CharacterState): Combatant {
  return {
    id: ch.id,
    name: ch.name,
    hp: ch.hp,
    maxHp: ch.maxHp,
    atk: 12,
    ac: 11,
    downed: ch.hp <= 0,
    isPlayer: true,
  };
}

export function openStreetSkirmish(ch: CharacterState, pack: WorldPack, seed: string): EncounterLedger {
  const zoneId = pack.places.find((p) => p.id === ch.placeId)?.zoneId;
  const hatch =
    pack.species.find((s) => s.rarity === 'common' && s.habitatTags.includes(zoneId ?? '')) ??
    pack.species.find((s) => s.id === 'species_reedfen_hatchling');
  if (!hatch) throw new Error('missing hatchling');
  return {
    instanceId: `skirmish_${ch.id}`,
    dungeonId: 'street',
    roomId: ch.placeId,
    roundId: 1,
    runMode: 'manual',
    combatants: spawnCombatants([playerCombatant(ch)], hatch, 2, seed),
    clearedRoomIds: [],
    checkpointRoomId: ch.placeId,
    joinLocked: false,
  };
}

export function openDungeonRoom(
  ch: CharacterState,
  pack: WorldPack,
  dungeonId: string,
  roomId: string,
  seed: string
): EncounterLedger {
  const dungeon = pack.dungeons.find((d) => d.id === dungeonId);
  if (!dungeon) throw new Error('missing dungeon');
  const room = dungeon.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('missing room');
  let combatants = [playerCombatant(ch)];
  for (const enc of room.encounter ?? []) {
    const species = pack.species.find((s) => s.id === enc.speciesId);
    if (!species) continue;
    combatants = spawnCombatants(combatants, species, enc.count, `${seed}|${roomId}|${enc.speciesId}`, enc.elite);
  }
  const checkpoint = [...dungeon.rooms].reverse().find((r) => r.isCheckpoint && dungeon.rooms.indexOf(r) <= dungeon.rooms.indexOf(room));
  return {
    instanceId: `lg_${ch.id}`,
    dungeonId: dungeon.id,
    roomId,
    roundId: 1,
    runMode: 'manual',
    combatants,
    clearedRoomIds: [],
    checkpointRoomId: checkpoint?.id ?? dungeon.rooms[0].id,
    joinLocked: false,
  };
}

export function wearOnWipe(ch: CharacterState): CharacterState {
  return {
    ...ch,
    inventory: ch.inventory.map((i) =>
      i.equipped ? { ...i, durability: Math.max(0, i.durability - 10) } : i
    ),
    hp: Math.max(1, Math.floor(ch.maxHp * 0.5)),
    sta: 0,
  };
}
