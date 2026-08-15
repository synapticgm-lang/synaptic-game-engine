import type { WorldPack } from '../types';

export function validateWorldPack(pack: WorldPack): string[] {
  const errors: string[] = [];
  const placeIds = new Set(pack.places.map((p) => p.id));
  const npcIds = new Set(pack.npcs.map((n) => n.id));
  const speciesIds = new Set(pack.species.map((s) => s.id));
  const itemIds = new Set(pack.items.map((i) => i.id));
  const questIds = new Set(pack.quests.map((q) => q.id));

  if (pack.races.some((r) => r.id === ('tide_covenant' as string))) {
    errors.push('Tide Covenant is a faction, not a race');
  }
  const raceIds = pack.races.map((r) => r.id).sort().join(',');
  if (raceIds !== 'hearthborn,lanternfolk,saltkin,stonevein') {
    errors.push('races must be Hearthborn, Lanternfolk, Saltkin, Stonevein');
  }

  for (const place of pack.places) {
    for (const exit of place.exits) {
      if (!placeIds.has(exit)) errors.push(`place ${place.id} exit missing ${exit}`);
    }
    for (const npcId of place.npcIds) {
      if (!npcIds.has(npcId)) errors.push(`place ${place.id} npc missing ${npcId}`);
    }
  }
  for (const npc of pack.npcs) {
    if (!placeIds.has(npc.placeId)) errors.push(`npc ${npc.id} bad place`);
  }
  for (const quest of pack.quests) {
    for (const obj of quest.objectives) {
      if (obj.placeId && !placeIds.has(obj.placeId)) errors.push(`quest ${quest.id} bad place`);
      if (obj.npcId && !npcIds.has(obj.npcId)) errors.push(`quest ${quest.id} bad npc`);
      if (obj.speciesId && !speciesIds.has(obj.speciesId)) errors.push(`quest ${quest.id} bad species`);
      if (obj.itemId && !itemIds.has(obj.itemId)) errors.push(`quest ${quest.id} bad item`);
    }
    if (quest.unlocksQuestId && !questIds.has(quest.unlocksQuestId)) {
      errors.push(`quest ${quest.id} unlock missing`);
    }
  }
  for (const dungeon of pack.dungeons) {
    if (!placeIds.has(dungeon.entrancePlaceId)) errors.push(`dungeon ${dungeon.id} bad entrance`);
    for (const room of dungeon.rooms) {
      for (const mob of room.encounter ?? []) {
        if (!speciesIds.has(mob.speciesId)) errors.push(`room ${room.id} bad species`);
      }
    }
  }
  if (!questIds.has(pack.firstHourQuestId)) errors.push('first hour quest missing');
  if (pack.banList.length < 20) errors.push('ban-list too short');

  const zones = new Set(pack.places.map((p) => p.zoneId));
  for (const need of ['reedfen', 'lampwood', 'brinewatch', 'granite_stair']) {
    if (!zones.has(need)) errors.push(`missing zone ${need}`);
  }
  for (const race of pack.races) {
    if (!placeIds.has(race.startingPlaceId)) errors.push(`race ${race.id} bad start`);
    if (!questIds.has(race.firstHourQuestId)) errors.push(`race ${race.id} missing first-hour quest`);
    if (!itemIds.has(race.starterWeaponId) || !itemIds.has(race.starterMapId)) {
      errors.push(`race ${race.id} missing starter kit items`);
    }
    const raceQuests = pack.quests.filter((q) => q.id.startsWith(`quest_${race.id}_`));
    if (raceQuests.length < 3) errors.push(`race ${race.id} needs 3 race quests`);
  }
  if (pack.dungeons.length < 4) errors.push('need a solo 5-man per starting zone');
  for (const [label, ids] of [
    ['place', pack.places.map((p) => p.id)],
    ['npc', pack.npcs.map((n) => n.id)],
    ['species', pack.species.map((s) => s.id)],
    ['item', pack.items.map((i) => i.id)],
    ['quest', pack.quests.map((q) => q.id)],
    ['dungeon', pack.dungeons.map((d) => d.id)],
  ] as const) {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`duplicate ${label} ${id}`);
      seen.add(id);
    }
  }
  return errors;
}
