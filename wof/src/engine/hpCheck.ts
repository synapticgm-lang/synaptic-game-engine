import type { Combatant, EncounterLedger, RoundOutcomeToken, SpeciesTemplate } from '../types';
import { createHashRng, d20 } from './rng';

export function spawnCombatants(
  players: Combatant[],
  species: SpeciesTemplate,
  count: number,
  seed: string,
  elite = false
): Combatant[] {
  const rng = createHashRng(seed, species.id, count);
  const mobs: Combatant[] = [];
  for (let i = 0; i < count; i++) {
    const band = 0.85 + rng() * 0.3;
    const hp = Math.max(1, Math.round(species.baseHp * band * (elite ? 1.6 : 1)));
    mobs.push({
      id: `${species.id}_${i}`,
      name: elite ? `${species.name} (elite)` : species.name,
      hp,
      maxHp: hp,
      atk: Math.max(1, Math.round(species.baseAtk * (elite ? 1.3 : 1))),
      ac: species.ac,
      downed: false,
      isPlayer: false,
    });
  }
  return [...players, ...mobs];
}

export function resolveHpCheckRound(
  ledger: EncounterLedger,
  playerActions: { actorId: string; targetId: string }[],
  seed: string
): { ledger: EncounterLedger; token: RoundOutcomeToken } {
  const rng = createHashRng(seed, ledger.instanceId, ledger.roundId);
  const combatants = ledger.combatants.map((c) => ({ ...c }));
  const byId = new Map(combatants.map((c) => [c.id, c]));
  const hits: RoundOutcomeToken['hits'] = [];

  for (const action of playerActions) {
    const actor = byId.get(action.actorId);
    const target = byId.get(action.targetId);
    if (!actor || !target || actor.downed || target.downed) continue;
    const roll = d20(rng) + Math.floor((actor.atk - 10) / 2);
    const hit = roll >= target.ac;
    let damage = 0;
    if (hit) {
      damage = Math.max(1, Math.floor(actor.atk / 3) + Math.floor(rng() * 4));
      target.hp = Math.max(0, target.hp - damage);
      if (target.hp <= 0) target.downed = true;
    }
    hits.push({
      actorId: actor.id,
      targetId: target.id,
      hit,
      damage,
      targetHpAfter: target.hp,
      killed: target.downed,
    });
  }

  for (const mob of combatants.filter((c) => !c.isPlayer && !c.downed)) {
    const living = combatants.filter((c) => c.isPlayer && !c.downed);
    if (!living.length) break;
    const target = living[Math.floor(rng() * living.length)];
    const roll = d20(rng) + Math.floor((mob.atk - 10) / 2);
    const hit = roll >= target.ac;
    let damage = 0;
    if (hit) {
      damage = Math.max(1, Math.floor(mob.atk / 4) + Math.floor(rng() * 3));
      target.hp = Math.max(0, target.hp - damage);
      if (target.hp <= 0) target.downed = true;
    }
    hits.push({
      actorId: mob.id,
      targetId: target.id,
      hit,
      damage,
      targetHpAfter: target.hp,
      killed: target.downed,
    });
  }

  const playersDown = combatants.filter((c) => c.isPlayer).every((c) => c.downed);
  const next: EncounterLedger = {
    ...ledger,
    roundId: ledger.roundId + 1,
    joinLocked: true,
    combatants,
  };
  return {
    ledger: next,
    token: { roundId: ledger.roundId, hits, wiped: playersDown },
  };
}

/** LLM / prose must never call this. Gold and HP only move through code. */
export function applyOutcomeToCharacterHp(
  player: Combatant,
  token: RoundOutcomeToken
): Combatant {
  const last = [...token.hits].reverse().find((h) => h.targetId === player.id);
  if (!last) return player;
  return { ...player, hp: last.targetHpAfter, downed: last.targetHpAfter <= 0 };
}

export function applyWipe(ledger: EncounterLedger, players: Combatant[]): EncounterLedger {
  const restored = ledger.combatants.map((c) => {
    if (!c.isPlayer) {
      return { ...c, hp: c.maxHp, downed: false };
    }
    const src = players.find((p) => p.id === c.id) ?? c;
    const hp = Math.max(1, Math.floor(src.maxHp * 0.5));
    return { ...src, hp, downed: false };
  });
  return {
    ...ledger,
    combatants: restored,
    roomId: ledger.checkpointRoomId,
  };
}

export function roomCleared(ledger: EncounterLedger): boolean {
  return ledger.combatants.filter((c) => !c.isPlayer).every((c) => c.downed);
}
