/**
 * Room objects filed from a kept fact-check reply. Offline. No model call.
 */
import { describe, expect, it, afterEach } from 'vitest';
import { applyFactGate, type FactObjectNote } from './factGate';
import type { FactSheet } from './factSheet';
import { buildFactSheet } from './factSheet';
import { buildCompletedEventPacket } from './completedEventPacket';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { fileKeptRoomProps, focusDungeonRoom, HIGH_TIER_ITEM_WORDS, isHighTierItemName, placedNounKind, sheetPropLabels } from './roomProps';
import { resolveStealAttempt } from './stealParley';
import { pinDice } from './seededRng';
import type { ActiveDungeonState, GameState } from './types';

afterEach(() => pinDice(null));

function sheet(): FactSheet {
  return {
    turn: 4,
    place: { name: 'Valespire Bathhouse', exits: ['street'], features: [] },
    present: [{ name: 'Mira' }],
    openLedger: [],
    gear: { worn: [], carrying: [], inHand: 'nothing' },
    beat: { verb: 'looked', outcome: 'looked', engineResult: 'Jax looked around.', steps: [{ outcome: 'looked' }] },
    player: { typed: 'look around', claimsNotTrue: [] },
    quests: [],
    recent: [],
    settingsSlot: null,
  };
}

function roomState(): GameState {
  return {
    turn: 4,
    seed: 'room-props',
    currentLocation: 'Valespire Bathhouse',
    engineMode: 'dnd',
    character: {
      name: 'Jax',
      hp: 10,
      maxHp: 12,
      level: 1,
      xp: 0,
      xpToNext: 300,
      attributes: { DEX: 16, WIS: 10 },
      conditions: [],
    },
    inventory: [],
    sceneFacts: { present: ['Mira'], props: [], crowd: 'sparse', noise: 'quiet', lastBeat: '', updatedTurn: 4 },
    places: [{ id: 'bath', name: 'Valespire Bathhouse', props: [] }, { id: 'street', name: 'Street', props: [] }],
  } as GameState;
}

const ROOM = 'A big wooden desk sat against the wall. An old rusty sword hung on the wall. A suit of armour stood in the corner.';

async function filedRoom(state: GameState, prose: string) {
  const gate = await applyFactGate({
    prose,
    sheet: sheet(),
    pcName: 'Jax',
    factCheckEnabled: true,
    factCheck: async ({ lines }) => lines.map((line) => ({
      n: line.n,
      verdict: 'keep' as const,
      objects: [
        /desk/i.test(line.text) ? { label: 'big wooden desk', kind: 'furniture' as const, mount: 'fixed' as const, owner: 'place' } : null,
        /sword/i.test(line.text) ? { label: 'old rusty sword', kind: 'weapon' as const, mount: 'hung' as const, owner: 'place' } : null,
        /armour/i.test(line.text) ? { label: 'suit of armour', kind: 'armour' as const, mount: 'fixed' as const, owner: 'place' } : null,
      ].filter((tag): tag is NonNullable<typeof tag> => !!tag),
    })),
  });
  return fileKeptRoomProps(state, gate.objectNotes);
}

describe('room props from a kept narration', () => {
  it('files a desk, a hung sword, and armour, then survives a leave and a return', async () => {
    pinDice(() => 0.99);
    let state = await filedRoom(roomState(), ROOM);
    const here = state.sceneFacts?.roomProps ?? [];
    expect(here.find((p) => /desk/i.test(p.label))?.fixed).toBe(true);
    expect(here.find((p) => /sword/i.test(p.label))?.takeable).toBe(true);
    expect(here.find((p) => /armour/i.test(p.label))?.fixed).toBe(true);

    state = applyPresentTrimOnTravel(state, 'Valespire Bathhouse', 'Street');
    expect(state.sceneFacts?.roomProps ?? []).toEqual([]);
    expect(state.places?.find((p) => p.name === 'Valespire Bathhouse')?.roomProps?.map((p) => p.label).sort()).toEqual([
      'big wooden desk',
      'old rusty sword',
      'suit of armour',
    ]);

    state = applyPresentTrimOnTravel({ ...state, currentLocation: 'Street' }, 'Street', 'Valespire Bathhouse');
    expect(state.sceneFacts?.roomProps?.map((p) => p.label).sort()).toEqual([
      'big wooden desk',
      'old rusty sword',
      'suit of armour',
    ]);

    const sword = resolveStealAttempt(state, 'I steal the old rusty sword', {
      action: 'take',
      target: 'old rusty sword',
      clause: 'I steal the old rusty sword',
    });
    expect(sword.taken).toBe(true);
    const gained = sword.state.inventory?.find((i) => /sword/i.test(i.name));
    expect(gained?.rarity).toBe('Common');
    expect(gained?.itemLevel).toBeGreaterThanOrEqual(1);
    expect(gained?.itemLevel).toBeLessThanOrEqual(3);
    expect(gained?.name).not.toMatch(/legendary|vorpal/i);
    expect(sword.state.sceneFacts?.roomProps?.some((p) => /sword/i.test(p.label))).toBe(false);

    const desk = resolveStealAttempt(sword.state, 'I steal the big wooden desk', {
      action: 'take',
      target: 'big wooden desk',
      clause: 'I steal the big wooden desk',
    });
    expect(desk.taken).toBe(false);
    expect(desk.facts.join(' ')).toMatch(/part of the room/i);
    expect(desk.state.inventory?.some((i) => /desk/i.test(i.name))).toBeFalsy();

    const invented = resolveStealAttempt(desk.state, 'I steal the golden chalice', {
      action: 'take',
      target: 'golden chalice',
      clause: 'I steal the golden chalice',
    });
    expect(invented.taken).toBe(false);
    expect(invented.state.inventory?.some((i) => /chalice/i.test(i.name))).toBeFalsy();
    expect(invented.facts.join(' ')).toMatch(/no golden chalice/i);
  });

  it('does not file a speech boast, and glory words do not raise the band', async () => {
    const gate = await applyFactGate({
      prose: 'Mira said, "A legendary vorpal sword hangs on the wall." A legendary vorpal sword hung on the peg.',
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => lines.map((line) => ({
        n: line.n,
        verdict: 'keep' as const,
        objects: /sword/i.test(line.text)
          ? [{ label: 'legendary vorpal sword', kind: 'weapon' as const, mount: 'hung' as const, owner: 'place' }]
          : [],
      })),
    });
    const state = fileKeptRoomProps(roomState(), gate.objectNotes);
    const props = state.sceneFacts?.roomProps ?? [];
    expect(props).toHaveLength(1);
    expect(props[0]?.label).toBe('sword');
    expect(props[0]?.rarity).toBe('Common');
    expect(props[0]?.level).toBeLessThanOrEqual(3);
    expect(gate.objectNotes.some((n) => n.speech && n.objects.length)).toBe(true);
  });

  it('folds the twenty-fifth takeable prop into a summary the steal cannot grant', () => {
    const notes: FactObjectNote[] = Array.from({ length: 25 }, (_, i) => ({
      text: `A token ${i + 1} lay on the bench.`,
      kept: true,
      objects: [{ label: `token ${i + 1}`, kind: 'coin' as const, mount: 'loose' as const, owner: 'place' }],
    }));
    const state = fileKeptRoomProps(roomState(), notes);
    const props = state.sceneFacts?.roomProps ?? [];
    expect(props.some((p) => p.summary)).toBe(true);
    expect(props.find((p) => p.summary)?.folded).toContain('token 1');
    expect(props.some((p) => p.label === 'token 25' && p.takeable)).toBe(true);
    pinDice(() => 0.99);
    const stolen = resolveStealAttempt(state, 'I steal token 1', { action: 'take', target: 'token 1', clause: 'I steal token 1' });
    expect(stolen.taken).toBe(false);
    expect(sheetPropLabels(props).length).toBeLessThanOrEqual(6);
  });

  it('shows at most six filed props on the fact sheet', () => {
    const notes: FactObjectNote[] = Array.from({ length: 8 }, (_, i) => ({
      text: `A coin ${i + 1} lay on the bench.`,
      kept: true,
      objects: [{ label: `coin ${i + 1}`, kind: 'coin', mount: 'loose', owner: 'place' }],
    }));
    const state = fileKeptRoomProps(roomState(), notes);
    const packet = buildCompletedEventPacket(state, 'look around');
    const features = buildFactSheet(state, packet, 'look around').place.features;
    const coins = features.filter((f) => /coin /i.test(f));
    expect(coins.length).toBeLessThanOrEqual(6);
  });
});

describe('filing without checker tags', () => {
  it('files a colour line, a check that is off, and a keep with no tags', async () => {
    const colourSheet: FactSheet = {
      ...sheet(),
      place: { name: 'Valespire Bathhouse', exits: ['street'], features: ['lantern', 'furnace'] },
    };
    let called = false;
    const colour = await applyFactGate({
      prose: 'A lantern hangs against the furnace.',
      sheet: colourSheet,
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async () => {
        called = true;
        return [];
      },
    });
    expect(called).toBe(false);
    expect(colour.spans[0]?.route).toBe('colour');
    const fromColour = fileKeptRoomProps(roomState(), colour.objectNotes);
    expect(fromColour.sceneFacts?.roomProps?.map((p) => p.label)).toContain('lantern');

    const offline = await applyFactGate({
      prose: 'An old rusty sword hung on the wall.',
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    const fromOff = fileKeptRoomProps(roomState(), offline.objectNotes);
    expect(fromOff.sceneFacts?.roomProps?.find((p) => /sword/i.test(p.label))?.takeable).toBe(true);

    const kept = await applyFactGate({
      prose: 'An old rusty sword hung on the wall.',
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => lines.map((line) => ({ n: line.n, verdict: 'keep' as const })),
    });
    const fromKeep = fileKeptRoomProps(roomState(), kept.objectNotes);
    expect(fromKeep.sceneFacts?.roomProps?.some((p) => /sword/i.test(p.label))).toBe(true);

    const tagged = await applyFactGate({
      prose: 'An old rusty sword hung on the wall.',
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => lines.map((line) => ({
        n: line.n,
        verdict: 'keep' as const,
        objects: [{ label: 'wall sword', kind: 'weapon' as const, mount: 'hung' as const, owner: 'place' }],
      })),
    });
    const fromTag = fileKeptRoomProps(roomState(), tagged.objectNotes);
    expect(fromTag.sceneFacts?.roomProps?.map((p) => p.label)).toEqual(['wall sword']);

    const speech = await applyFactGate({
      prose: 'Mira said, "An old rusty sword hung on the wall."',
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: false,
    });
    expect(fileKeptRoomProps(roomState(), speech.objectNotes).sceneFacts?.roomProps ?? []).toEqual([]);
  });

  it('files only a placed noun the gear tables already name', async () => {
    const junk = [
      'A smile hung on her lips.',
      'A tension hung against the door.',
      'A heavy silence hung on the room.',
      'A fear hung on his words.',
      'A wisp of smoke hung from the rafters.',
      'A smile hung on the cloak.',
      'A heavy silence hung in the room.',
      'A long pause hung over the table.',
      'A tight tension hung in the hall.',
      'A sour smell hung in the air.',
    ];
    for (const prose of junk) {
      const gate = await applyFactGate({
        prose,
        sheet: { ...sheet(), place: { name: 'Valespire Bathhouse', exits: ['street'], features: ['cloak'] } },
        pcName: 'Jax',
        factCheckEnabled: false,
      });
      expect(fileKeptRoomProps(roomState(), gate.objectNotes).sceneFacts?.roomProps ?? [], prose).toEqual([]);
    }
    for (const [prose, head] of [
      ['A lantern hung from a hook.', 'lantern'],
      ['A cloak hung on a peg.', 'cloak'],
    ] as const) {
      const gate = await applyFactGate({
        prose,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: false,
      });
      const props = fileKeptRoomProps(roomState(), gate.objectNotes).sceneFacts?.roomProps ?? [];
      const kind = placedNounKind(head);
      if (kind) {
        expect(props.map((p) => p.label), prose).toEqual([head]);
        expect(props[0]?.kind, prose).toBe(kind);
      } else {
        expect(props, prose).toEqual([]);
      }
    }
  });

  it('does not skip a second high-tier name', () => {
    expect(HIGH_TIER_ITEM_WORDS.flags.includes('g')).toBe(false);
    expect(isHighTierItemName('legendary sword')).toBe(true);
    expect(isHighTierItemName('vorpal blade')).toBe(true);
  });
});

describe('dungeon room props', () => {
  it('takes a loose prop, refuses a fixed one, and keeps the rest after leaving and returning', () => {
    pinDice(() => 0.99);
    const dungeon = {
      blueprintId: 'crypt',
      dungeonName: 'Old Crypt',
      tier: 2,
      areaLevel: 4,
      currentZLevel: 0,
      currentNodeId: 'nave',
      visitedNodeIds: ['nave'],
      clearedNodeIds: [],
      nodes: [
        {
          id: 'nave',
          name: 'Nave',
          description: 'A stone nave.',
          connections: ['crypt'],
          hidden: {
            traps: [],
            lootables: [{ id: 'chest', label: 'iron chest', opened: false, loot: { rarity: 'Common', qty: 1 } }],
            secrets: [],
            mobs: [],
          },
        },
        { id: 'crypt', name: 'Crypt', description: 'A lower crypt.', connections: ['nave'], hidden: { traps: [], lootables: [], secrets: [], mobs: [] } },
      ],
    } as unknown as ActiveDungeonState;
    let state = {
      ...roomState(),
      currentLocation: 'Old Crypt — Nave',
      activeDungeon: dungeon,
    } as GameState;
    const notes: FactObjectNote[] = [
      { text: 'A brazier stood in the corner.', kept: true, objects: [{ label: 'brazier', kind: 'furniture', mount: 'fixed', owner: 'place' }] },
      { text: 'Coins lay on the altar.', kept: true, objects: [{ label: 'coins', kind: 'coin', mount: 'loose', owner: 'place' }] },
      { text: 'An iron chest sat shut.', kept: true, objects: [{ label: 'iron chest', kind: 'furniture', mount: 'fixed', owner: 'place' }] },
    ];
    state = fileKeptRoomProps(state, notes);
    const filed = state.activeDungeon?.nodes.find((n) => n.id === 'nave')?.roomProps ?? [];
    expect(filed.map((p) => p.label)).toEqual(['brazier', 'coins']);
    expect(filed.every((p) => p.level === 4)).toBe(true);

    const coins = resolveStealAttempt(state, 'I take the coins', { action: 'take', target: 'coins', clause: 'I take the coins' });
    expect(coins.taken).toBe(true);
    expect(coins.state.inventory?.some((i) => i.name === 'coins' && i.itemLevel === 4)).toBe(true);

    const brazier = resolveStealAttempt(coins.state, 'I take the brazier', { action: 'take', target: 'brazier', clause: 'I take the brazier' });
    expect(brazier.taken).toBe(false);
    expect(brazier.facts.join(' ')).toMatch(/part of the room/i);

    const away = focusDungeonRoom(brazier.state, 'crypt');
    expect(away.sceneFacts?.roomProps ?? []).toEqual([]);
    const back = focusDungeonRoom(away, 'nave');
    const labels = back.sceneFacts?.roomProps?.map((p) => p.label);
    expect(labels).toEqual(['brazier']);
    expect(back.activeDungeon?.nodes.find((n) => n.id === 'nave')?.roomProps?.map((p) => p.label)).toEqual(['brazier']);
    expect(back.inventory?.some((i) => i.name === 'coins')).toBe(true);
  });
});
