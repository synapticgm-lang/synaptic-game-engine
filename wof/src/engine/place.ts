import type { CharacterState, WorldPack } from '../types';

export function moveToPlace(ch: CharacterState, pack: WorldPack, placeId: string): CharacterState | { error: string } {
  const here = pack.places.find((p) => p.id === ch.placeId);
  const dest = pack.places.find((p) => p.id === placeId);
  if (!here || !dest) return { error: 'unknown_place' };
  if (here.id !== dest.id && !here.exits.includes(dest.id)) return { error: 'no_exit' };
  const visited = ch.visitedPlaceIds.includes(dest.id)
    ? ch.visitedPlaceIds
    : [...ch.visitedPlaceIds, dest.id];
  return { ...ch, placeId: dest.id, visitedPlaceIds: visited };
}

export function streetFog(ch: CharacterState, pack: WorldPack): { id: string; name: string; known: boolean }[] {
  const here = pack.places.find((p) => p.id === ch.placeId);
  const zoneId = here?.zoneId;
  return pack.places
    .filter((p) => p.zoneId === zoneId)
    .map((p) => ({
      id: p.id,
      name: p.name,
      known: ch.visitedPlaceIds.includes(p.id),
    }));
}
