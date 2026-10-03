/**
 * LitRPG ledger sheet for the hosted writer.
 * Mirrors src/game/litrpgSystemWindow.ts ledgerSheetLine.
 * Only parts the frozen housing turned on. HP and MP stay off this line.
 * A worn device prints only the sheet fields its housing turned on.
 */
import { isDeniedPcName, isLockablePcName, sanitizePcName, UNNAMED_ADVENTURER } from './pcNameAuthority.ts';
import { isPartOn, type SystemPartId } from './systemHousing.ts';
import type { GameState } from './types.ts';

const GENERIC_NAMES = /^(adventurer|survivor|unknown survivor|hero|wanderer|unknown)$/i;

function characterNameIsGeneric(name?: string): boolean {
  const n = name?.trim() ?? '';
  return !n || GENERIC_NAMES.test(n) || isDeniedPcName(n) || !isLockablePcName(n);
}

function lockedSystemName(state: GameState): string | null {
  const fromCover = sanitizePcName(state.openingEstablishment?.answers?.name);
  if (fromCover && !characterNameIsGeneric(fromCover)) return fromCover;
  const fromChar = sanitizePcName(state.character?.name);
  if (
    fromChar
    && fromChar !== UNNAMED_ADVENTURER
    && !characterNameIsGeneric(fromChar)
  ) {
    return fromChar;
  }
  return null;
}

function pocketLine(state: GameState, withNotes: boolean): string {
  const items = (state.inventory ?? [])
    .map((i) => {
      const nm = i?.name?.trim();
      if (!nm) return '';
      const note = withNotes ? i.description?.trim() : '';
      return note ? `${nm} (${note})` : nm;
    })
    .filter(Boolean);
  return `Pocket: ${items.length ? items.join(', ') : 'empty'}`;
}

function buildLitrpgSystemWindow(state: GameState): { heading: string; lines: string[] } | null {
  if (state.engineMode !== 'litrpg') return null;
  const c = state.character;
  const name = lockedSystemName(state);
  const registered = !!name;
  const housing = state.systemHousing;
  if (housing?.housing === 'leftover_pocket') {
    return { heading: 'SYSTEM', lines: [`Name: ${name ?? '—'}`, pocketLine(state, false)] };
  }
  const on = (part: SystemPartId) => !housing || isPartOn(housing, part);
  const lines: string[] = [`Name: ${name ?? '—'}`];
  if (on('level')) lines.push(`Level ${c?.level ?? 1}`);
  if (on('health')) lines.push(`HP ${c?.hp ?? 0} / ${c?.maxHp ?? 0}`);
  if (on('power_pool') && typeof c?.mp === 'number' && (c.maxMp ?? 0) > 0) {
    lines.push(`MP ${c.mp} / ${c.maxMp}`);
  }
  if (housing && isPartOn(housing, 'active_effects') && (c?.conditions ?? []).length) {
    lines.push(`Effects: ${(c?.conditions ?? []).join(', ')}`);
  }
  if (housing && isPartOn(housing, 'pocket')) {
    lines.push(pocketLine(state, housing.housing === 'worn_device'));
  }
  if (state.campaignBibleId === 'summoned-pact') {
    lines.push(registered ? 'Registration: designation locked' : 'Registration: incomplete');
    lines.push('Mark: Pactborn / Calamity Mark — unresolved');
    if (!state.openingEstablishment?.complete) {
      lines.push('Gift: unresolved — Appraisal names it');
    }
  } else {
    lines.push(registered ? 'Interface: online' : 'Interface: online — awaiting designation');
  }
  return { heading: 'SYSTEM', lines };
}

/** Ledger sheet in prose for Inspect the panel / Check Status. HP and MP stay on the window, not in the writer's facts. */
export function ledgerSheetLine(state: GameState): string {
  const sheet = buildLitrpgSystemWindow(state);
  if (!sheet) return '';
  const c = state.character;
  const quest = (state.quests ?? []).find((q) => q.status === 'active');
  const next = quest?.objectives?.find((o) => !o.completed)?.description;
  const housing = state.systemHousing;
  const parts = sheet.lines.filter((l) => !/^(?:HP|MP)\s/.test(l));
  if (!housing || isPartOn(housing, 'experience')) parts.push(`XP ${c?.xp ?? 0}/${c?.xpToNext ?? 0}`);
  if (quest?.name && (!housing || isPartOn(housing, 'quest_list'))) {
    parts.push(next ? `Quest: ${quest.name}, next: ${next}` : `Quest: ${quest.name}`);
  }
  return `The panel read: ${parts.join('; ')}.`;
}