/**
 * Heirlooms. Offline. No model call.
 */
import { describe, expect, it, afterEach } from 'vitest';
import { ensureNpcSheet } from './npcSheet';
import { heirloomDraw, isDurableRole, lootHeirloomOf, transferHeirloom } from './heirlooms';
import { resolveTypedFreeText } from './typedFreeText';
import { buildFactSheet } from './factSheet';
import { buildCompletedEventPacket } from './completedEventPacket';
import { applyFactGate } from './factGate';
import { fileKeptRoomProps } from './roomProps';
import { resolveStealAttempt } from './stealParley';
import { pinDice } from './seededRng';
import type { GameState, HeirloomReason, NpcMemory } from './types';

afterEach(() => pinDice(null));

function state(over: Partial<GameState> = {}): GameState {
  return {
    turn: 4,
    seed: 'heirloom-seed',
    currentLocation: 'Lowmarket',
    campaignBibleId: 'summoned-pact',
    engineMode: 'dnd',
    character: { name: 'Jax', hp: 10, maxHp: 12, level: 1, xp: 0, xpToNext: 300, attributes: { DEX: 16, WIS: 10 }, conditions: [] },
    inventory: [],
    npcMemories: [],
    sceneFacts: { present: [], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 4 },
    places: [{ id: 'lowmarket', name: 'Lowmarket' }],
    ...over,
  } as GameState;
}

function memory(id: string, name: string, hint: string): NpcMemory {
  return {
    npcId: id,
    npcName: name,
    roleHint: hint,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    location: 'Lowmarket',
  };
}

function idFor(seed: string, reason?: HeirloomReason): string {
  for (let i = 0; i < 800; i++) {
    const id = `sheriff-${i}`;
    const draw = heirloomDraw(seed, id);
    if (draw.hit && (!reason || draw.reason === reason)) return id;
  }
  throw new Error(`no heirloom id for ${reason ?? 'any'}`);
}

describe('heirlooms', () => {
  it('replays the same roll for the same seed and id', () => {
    const seed = 'heirloom-seed';
    const id = idFor(seed, 'retired-higher-band');
    expect(heirloomDraw(seed, id)).toEqual(heirloomDraw(seed, id));
    expect(heirloomDraw(seed, id).hit).toBe(true);
    expect(heirloomDraw(seed, id).reason).toBe('retired-higher-band');
    let miss = 'miss-0';
    for (let i = 0; i < 40; i++) {
      if (!heirloomDraw(seed, `miss-${i}`).hit) {
        miss = `miss-${i}`;
        break;
      }
    }
    expect(heirloomDraw(seed, miss).hit).toBe(false);

    const first = ensureNpcSheet(state({ npcMemories: [memory(id, 'Sheriff Brann', 'sheriff')] }), 'Sheriff Brann', 'Lowmarket');
    const saved = first.npcMemories?.find((m) => m.npcId === id);
    expect(saved?.heirloom?.reason).toBe('retired-higher-band');
    const again = ensureNpcSheet(first, 'Sheriff Brann', 'Lowmarket');
    expect(again.npcMemories?.find((m) => m.npcId === id)?.heirloom).toEqual(saved?.heirloom);
  });

  it('gives a low-town sheriff a blade above the area band, and only one in the settlement', () => {
    const seed = 'heirloom-seed';
    const sheriffId = idFor(seed, 'retired-higher-band');
    const otherId = idFor(seed);
    const second = otherId === sheriffId ? idFor(seed + '-b') : otherId;
    const born = ensureNpcSheet(state({
      seed,
      npcMemories: [memory(sheriffId, 'Sheriff Brann', 'sheriff')],
    }), 'Sheriff Brann', 'Lowmarket');
    const blade = born.npcMemories?.find((m) => m.npcId === sheriffId)?.heirloom;
    expect(blade?.label).toBe('old campaign blade');
    expect(blade!.level).toBeGreaterThan(3);
    expect(blade?.rarity === 'Common').toBe(false);

    const capped = ensureNpcSheet({
      ...born,
      npcMemories: [...(born.npcMemories ?? []), memory(second, 'Priest Rowan', 'priest')],
    }, 'Priest Rowan', 'Lowmarket');
    expect(capped.npcMemories?.find((m) => m.npcId === second)?.heirloom).toBeUndefined();
    expect(isDurableRole('courier', 'courier', 'road')).toBe(false);
    const passer = ensureNpcSheet(state({
      seed,
      currentLocation: 'North Road',
      npcMemories: [memory(sheriffId, 'Ned the Courier', 'courier')],
    }), 'Ned the Courier', 'North Road');
    expect(passer.npcMemories?.find((m) => m.npcName === 'Ned the Courier')?.heirloom).toBeUndefined();
  });

  it('blocks a steal while the owner is here, then records an engine transfer', async () => {
    const seed = 'heirloom-seed';
    const id = idFor(seed, 'retired-higher-band');
    let s = ensureNpcSheet(state({
      seed,
      npcMemories: [memory(id, 'Sheriff Brann', 'sheriff')],
      sceneFacts: { present: ['Sheriff Brann'], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 4 },
    }), 'Sheriff Brann', 'Lowmarket');
    const label = s.npcMemories?.find((m) => m.npcId === id)?.heirloom?.label ?? '';
    pinDice(() => 0.99);
    const steal = resolveStealAttempt(s, `I steal the ${label}`, { action: 'take', target: label, clause: `I steal the ${label}` });
    expect(steal.taken).toBe(false);
    expect(steal.facts.join(' ')).toMatch(/still holds/i);
    expect(steal.state.inventory ?? []).toHaveLength(0);

    s = transferHeirloom(steal.state, id, 'gift');
    expect(s.inventory?.some((i) => i.name === label && (i.itemLevel ?? 0) > 3)).toBe(true);
    expect(s.npcMemories?.find((m) => m.npcId === id)?.heirloom?.holderId).toBe('player');
    expect(s.stateTxLog?.some((t) => /Heirloom gift/i.test(t.summary))).toBe(true);

    const packet = buildCompletedEventPacket(s, 'look around');
    const row = buildFactSheet(s, packet, 'look around').present.find((p) => p.name === 'Sheriff Brann');
    expect(row?.signature).toBeUndefined();

    const before = ensureNpcSheet(state({
      seed,
      npcMemories: [memory(id, 'Sheriff Brann', 'sheriff')],
      sceneFacts: { present: ['Sheriff Brann'], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 4 },
    }), 'Sheriff Brann', 'Lowmarket');
    const shown = buildFactSheet(before, buildCompletedEventPacket(before, 'look'), 'look').present.find((p) => p.name === 'Sheriff Brann');
    expect(shown?.signature).toBe(label);
    expect(shown?.carried).toEqual([label]);
    const mention = await applyFactGate({
      prose: `Sheriff Brann kept the ${label} at his side.`,
      sheet: buildFactSheet(before, buildCompletedEventPacket(before, 'look'), 'look'),
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(mention.spans.some((span) => /unlisted item/i.test(span.reason))).toBe(false);
    expect(mention.prose).toMatch(/old campaign blade/i);
    const pocket = await applyFactGate({
      prose: 'Jax pocketed the old campaign blade.',
      sheet: buildFactSheet(before, buildCompletedEventPacket(before, 'look'), 'look'),
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(pocket.prose).not.toMatch(/old campaign blade/i);
    const moved = transferHeirloom(before, id, 'gift');
    const afterSheet = buildFactSheet(moved, buildCompletedEventPacket(moved, 'look'), 'look');
    const held = await applyFactGate({
      prose: 'Jax pocketed the old campaign blade.',
      sheet: afterSheet,
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(held.prose).toMatch(/old campaign blade/i);

    const gone = {
      ...before,
      sceneFacts: { ...before.sceneFacts!, present: [] },
    };
    pinDice(() => 0.99);
    const away = resolveStealAttempt(gone, `I steal the ${label}`, { action: 'take', target: label, clause: `I steal the ${label}` });
    expect(away.taken).toBe(true);
    expect(away.state.npcMemories?.find((m) => m.npcId === id)?.heirloom?.holderId).toBe('player');
    expect(away.state.stateTxLog?.some((t) => /Heirloom steal/i.test(t.summary))).toBe(true);

    const traded = resolveTypedFreeText(before, 'I trade with Sheriff Brann');
    expect(traded.state?.npcMemories?.find((m) => m.npcId === id)?.heirloom?.holderId).toBe('player');
    expect(traded.state?.stateTxLog?.some((t) => /Heirloom trade/i.test(t.summary))).toBe(true);
    const gifted = resolveTypedFreeText(before, 'I ask a favour of Sheriff Brann');
    expect(gifted.state?.stateTxLog?.some((t) => /Heirloom gift/i.test(t.summary))).toBe(true);
    const looted = lootHeirloomOf(before, 'Sheriff Brann');
    expect(looted.npcMemories?.find((m) => m.npcId === id)?.heirloom?.holderId).toBe('player');
    expect(looted.stateTxLog?.some((t) => /Heirloom loot/i.test(t.summary))).toBe(true);
  });

  it('a roster NPC keeps only a listed signature, and a boast files nothing', () => {
    const seed = 'heirloom-seed';
    const id = idFor(seed);
    const roster = ensureNpcSheet(state({
      seed,
      npcMemories: [{
        ...memory('sp-npc-35', 'Harker Vale', 'merchant'),
        facts: ['Bible roster: harbor'],
        listedSignature: 'harbor stamp',
      }],
    }), 'Harker Vale', 'Lowmarket');
    const harker = roster.npcMemories?.find((m) => m.npcName === 'Harker Vale');
    expect(harker?.heirloom).toBeUndefined();
    expect(harker?.listedSignature).toBe('harbor stamp');
    const row = buildFactSheet({
      ...roster,
      sceneFacts: { present: ['Harker Vale'], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 4 },
    }, buildCompletedEventPacket(roster, 'look'), 'look').present.find((p) => p.name === 'Harker Vale');
    expect(row?.signature).toBe('harbor stamp');
    expect(row?.carried).toEqual(['harbor stamp']);

    const boast = fileKeptRoomProps(state({ seed, npcMemories: [memory(id, 'Sheriff Brann', 'sheriff')] }), [{
      text: 'Sheriff Brann said, "I carried a blade from the far marches."',
      speech: true,
      kept: true,
      objects: [{ label: 'blade from the far marches', kind: 'weapon', mount: 'loose', owner: 'place' }],
    }]);
    expect(boast.sceneFacts?.roomProps ?? []).toEqual([]);
    expect(boast.npcMemories?.every((m) => !m.heirloom)).toBe(true);
    void id;
  });
});
