/**
 * Auto-fight + last-kill authority — ledger owns the corpse and the body type.
 * John 6d8e0b1f: Pact-Hunter narrated as a beast; T11 denied the kill.
 */

import type { ActiveEncounter, GameState, SceneFacts } from './types.ts';
import { tickEncounterTerminal } from './encounterTerminalFsm.ts';

export type LastKill = {
  name: string;
  outcome: 'victory' | 'defeat' | 'escape';
  turn: number;
  remains: boolean;
};

const BEAST_NAME =
  /\b(wraith|shade|remnant|beast|wolf|hatchling|spider|serpent|hound|critter|void-touched)\b/i;
const HUMANOID_NAME =
  /\b(hunter|skirmisher|bandit|raider|scout|cutpurse|cutthroat|blade|warden|guard|soldier|official|registrar|handler|assassin|stalker)\b/i;

export function isHumanoidEnemyName(name: string | undefined): boolean {
  const n = (name ?? '').trim();
  if (!n) return false;
  if (BEAST_NAME.test(n) && !HUMANOID_NAME.test(n)) return false;
  return HUMANOID_NAME.test(n);
}

export function enemyBodyAuthorityLine(enemyName: string): string {
  if (isHumanoidEnemyName(enemyName)) {
    return `BODY AUTHORITY: ${enemyName} is a humanoid hunter/fighter (armed person). Narrate hands, blade or fists, boots — never fur, claws, muzzle, or "the beast".`;
  }
  return `BODY AUTHORITY: Keep ${enemyName}'s body type consistent with the name. Do not invent a second creature type.`;
}

export function scrubBeastifiedHumanoid(text: string, enemyName?: string): string {
  if (!text || !enemyName || !isHumanoidEnemyName(enemyName)) return text;
  let next = text;
  next = next.replace(/\ba blur of fur and teeth\b/gi, 'a rush of steel and weight');
  next = next.replace(/\bfur and teeth\b/gi, 'steel and weight');
  next = next.replace(/\bits claws raking\b/gi, 'a blade raking');
  next = next.replace(/\bclaws raking\b/gi, 'a strike raking');
  next = next.replace(/\bsilenced the beast forever\b/gi, `dropped ${enemyName}`);
  next = next.replace(/\bsilenced the beast\b/gi, `dropped ${enemyName}`);
  next = next.replace(/\bthe beast forever\b/gi, enemyName);
  next = next.replace(/\bthe beast\b/gi, enemyName);
  next = next.replace(/\ba savage swipe\b/gi, 'a hard cut');
  return next;
}

export function scrubDeniedKill(text: string, lastKill?: LastKill | null): string {
  if (!text || !lastKill?.remains || lastKill.outcome !== 'victory') return text;
  const name = lastKill.name;
  let next = text;
  next = next.replace(
    /you note no ["“”]?kill["“”]? to loot[^.!?]{0,100}[.!?]/gi,
    `The body of ${name} is still on the floor — loot is legal.`
  );
  next = next.replace(
    /there(?:'s| is) no ["“”]?kill["“”]? to loot[^.!?]{0,100}[.!?]/gi,
    `${name} is down here. The remains are still in this room.`
  );
  next = next.replace(
    /no ["“”]?kill["“”]? to loot[^.!?]{0,80}[.!?]/gi,
    `${name} is still here to loot.`
  );
  return next;
}

export function formatLastKillSnapshotLine(lastKill?: LastKill | null): string | null {
  if (!lastKill?.name) return null;
  if (lastKill.outcome === 'victory' && lastKill.remains) {
    return `Last kill: ${lastKill.name} (this room, T${lastKill.turn}) — remains on the floor. Do not deny the kill. Loot/search the body is legal.`;
  }
  return `Last kill: ${lastKill.name} (${lastKill.outcome}, T${lastKill.turn}).`;
}

export function attachLastKill(state: GameState, kill: LastKill): GameState {
  const base: SceneFacts = state.sceneFacts ?? {
    crowd: 'unknown',
    noise: 'unknown',
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: state.turn,
  };
  return {
    ...state,
    sceneFacts: {
      ...base,
      lastKill: kill,
      tension: kill.outcome === 'victory' ? 'tense' : base.tension,
    },
  };
}

export function lastGmMentionsEnemy(state: GameState, enemyName: string): boolean {
  const last = [...(state.log ?? [])].reverse().find((e) => e.role === 'gm')?.content ?? '';
  return last.toLowerCase().includes(enemyName.toLowerCase());
}

export function proseMentionsEnemy(prose: string, enemyName: string): boolean {
  const name = (enemyName ?? '').trim();
  if (!name || !prose) return false;
  return prose.toLowerCase().includes(name.toLowerCase());
}

/** Foe is on-screen: present[], last GM beat, or this draft already names them. */
export function foeVisibleInScene(
  state: GameState,
  enemyName: string,
  draftProse?: string
): boolean {
  const name = (enemyName ?? '').trim();
  if (!name) return false;
  const needle = name.toLowerCase();
  const present = state.sceneFacts?.present ?? [];
  if (present.some((p) => String(p).toLowerCase().includes(needle))) return true;
  if (lastGmMentionsEnemy(state, name)) return true;
  if (draftProse && proseMentionsEnemy(draftProse, name)) return true;
  return false;
}

export function autoFightSpawnPreface(enemyName: string): string {
  if (isHumanoidEnemyName(enemyName)) {
    return `A human figure — ${enemyName} — breaks from the debris, already committed.`;
  }
  return `${enemyName} is already on you.`;
}

/** Mark drought/arc spawn so the next combat beat must show the foe before fight prose. */
export function markPendingSpawnPreface(state: GameState, enemyName: string): GameState {
  const name = (enemyName ?? '').trim();
  if (!name) return state;
  const base: SceneFacts = state.sceneFacts ?? {
    crowd: 'unknown',
    noise: 'unknown',
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: state.turn,
  };
  return {
    ...state,
    sceneFacts: {
      ...base,
      pendingSpawnPreface: name,
    },
  };
}

/**
 * If ArcDirector attached a fight before the foe was narrated, force a visible spawn line.
 * Clears pendingSpawnPreface and adds the foe to present[] once shown.
 */
export function ensureEncounterSpawnPreface(
  state: GameState,
  prose: string
): { prose: string; state: GameState; prepended: boolean } {
  const pending =
    state.sceneFacts?.pendingSpawnPreface?.trim()
    || (state.activeEncounter?.name?.trim() && !foeVisibleInScene(state, state.activeEncounter.name, prose)
      ? state.activeEncounter.name.trim()
      : '');
  if (!pending) return { prose, state, prepended: false };

  let nextProse = prose ?? '';
  let prepended = false;
  if (!proseMentionsEnemy(nextProse, pending)) {
    nextProse = `${autoFightSpawnPreface(pending)} ${nextProse}`.trim();
    prepended = true;
  }

  const base: SceneFacts = state.sceneFacts ?? {
    crowd: 'unknown',
    noise: 'unknown',
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: state.turn,
  };
  const present = [...(base.present ?? [])];
  if (!present.some((p) => String(p).toLowerCase().includes(pending.toLowerCase()))) {
    present.push(pending);
  }
  return {
    prose: nextProse,
    state: {
      ...state,
      sceneFacts: {
        ...base,
        present,
        pendingSpawnPreface: undefined,
        tension: 'combat',
      },
    },
    prepended,
  };
}

/**
 * Write encounterCleared receipts + lastKill. Does not apply FSM XP
 * (simulateCombat already paid the auto-fight purse).
 */
export function commitAutoFightLedger(
  state: GameState,
  result: { victory: boolean; finalPlayerHp: number }
): GameState {
  const enc: ActiveEncounter | null | undefined = state.activeEncounter;
  if (!enc) return state;
  const tick = tickEncounterTerminal(state, '[Auto-Fight]', {
    enemyDead: result.victory,
    playerDead: !result.victory && result.finalPlayerHp <= 0,
  });
  let next = tick.state;
  if (result.victory) {
    next = attachLastKill(next, {
      name: enc.name,
      outcome: 'victory',
      turn: next.turn,
      remains: true,
    });
  }
  return next;
}

export function lastKillFromAutoFightLog(state: GameState): LastKill | null {
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    if (entry?.role !== 'gm') continue;
    const victory = (entry.systemLog ?? []).some((l) => /Auto-Resolve Combat:\s*VICTORY/i.test(l));
    if (!victory) continue;
    const engage = [...log]
      .reverse()
      .find((e) => e.role === 'player' && /\[Auto-Fight\]\s+Engaging\s+/i.test(e.content ?? ''));
    const name =
      engage?.content?.match(/\[Auto-Fight\]\s+Engaging\s+(.+?)\.{0,3}\s*$/i)?.[1]?.trim()
      || (entry.systemLog ?? []).find((l) => /Encounter cleared:/i.test(l))?.replace(/^.*Encounter cleared:\s*/i, '').split('(')[0]?.trim()
      || 'foe';
    return { name, outcome: 'victory', turn: entry.turn, remains: true };
  }
  return null;
}
