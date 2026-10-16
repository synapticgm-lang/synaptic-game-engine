/**
 * q31-ECR2 — SRD 5.2.1 attunement: Short Rest reuse, 4th refuse, cursed end,
 * identify-rest refuse, interrupt, 24 h away, death clear.
 */
import { describe, expect, it } from 'vitest';
import { parsePlayerIntent } from './intentParser';
import { removeItem } from './inventory';
import { commitDeath } from './rules/death';
import { attunementProblem, magicItem, markAwayAttuned, tickAwayAttunements } from './rules/magicItems';
import { resolveDowntimeTurn } from './tabletop/downtimeTurn';
import { advanceClock } from './travelJourney';
import type { GameState, Item } from './types';

function base(over: Partial<GameState> = {}): GameState {
  return {
    engineMode: 'dnd',
    turn: 5,
    worldHour: 9,
    worldDay: 0,
    inventory: [],
    character: {
      name: 'Jax',
      hp: 10,
      maxHp: 10,
      armorClass: 16,
      attributes: { STR: 16, DEX: 14, CON: 14, INT: 10, WIS: 12, CHA: 10 },
      srd: {
        classId: 'fighter',
        speciesId: 'human',
        backgroundId: 'soldier',
        method: 'standard',
        baseScores: { STR: 16, DEX: 14, CON: 14, INT: 10, WIS: 12, CHA: 10 },
        bonus: {},
        skillProfs: [],
        expertise: [],
        languages: ['Common'],
        originFeats: [],
        kitId: 'A',
        source: 'build',
      },
    },
    ...over,
  } as GameState;
}

function withMagic(...names: string[]): Item[] {
  return names.map((n, i) => magicItem(n, `mi-${i}`, 'test'));
}

describe('q31-ECR2 attunement (SRD 5.2.1)', () => {
  it('Attune is use_item intent; ATTUNE regex path is gone', () => {
    expect(parsePlayerIntent('Attune to the Cloak of Protection').kind).toBe('use_item');
    const s = base({ inventory: withMagic('Cloak of Protection') });
    const r = resolveDowntimeTurn(s, 'Attune to the Cloak of Protection')!;
    expect(r.receipts[0]).toMatch(/^Attunement: Cloak of Protection — attuned \(1 of 3\);/);
    expect(r.receipts[0]).toMatch(/\+1h/);
  });

  it('4th attunement is refused; cursed voluntary end is refused; end costs a Short Rest', () => {
    const inv = withMagic('Cloak of Protection', 'Ring of Protection', 'Bracers of Defense', 'Brooch of Shielding');
    for (let i = 0; i < 3; i++) inv[i] = { ...inv[i]!, attuned: true };
    expect(attunementProblem(inv, 'Brooch of Shielding')).toBe('you are already attuned to 3 items');
    const s = base({ inventory: [{ ...inv[0]!, attuned: true, cursed: true }] });
    expect(resolveDowntimeTurn(s, 'End my attunement to the Cloak of Protection')!.receipts[0]).toMatch(
      /not done \(it's cursed; the curse must be broken first\)/,
    );
    const open = base({ inventory: [{ ...inv[0]!, attuned: true }] });
    const ended = resolveDowntimeTurn(open, 'End my attunement to the Cloak of Protection')!;
    expect(ended.receipts[0]).toMatch(/ended;.*\+1h/);
    expect(ended.state.inventory!.find((i) => i.name === 'Cloak of Protection')!.attuned).toBeFalsy();
  });

  it('same rest as identify refuses; interrupted rest spends an hour with no attune', () => {
    const cloak = { ...magicItem('Cloak of Protection', 'mi-c', 'test'), identifiedTurn: 5 };
    const s = base({ turn: 5, inventory: [cloak] });
    expect(resolveDowntimeTurn(s, 'Attune to the Cloak of Protection')!.receipts[0]).toMatch(
      /you just learned its properties this rest/,
    );
    const interrupted = base({
      inventory: [magicItem('Cloak of Protection', 'mi-c', 'test')],
      sceneFacts: { pendingEncounter: { id: 'x' } as never },
    });
    const r = resolveDowntimeTurn(interrupted, 'Attune to the Cloak of Protection')!;
    expect(r.receipts[0]).toBe('Attunement: Cloak of Protection — not done (the rest was interrupted)');
    expect(r.state.inventory!.find((i) => i.name === 'Cloak of Protection')!.attuned).toBeFalsy();
    expect(r.state.worldHour).toBe(10);
  });

  it('death clears attunement; 24 h away ends an away slot', () => {
    const cloak = { ...magicItem('Cloak of Protection', 'mi-c', 'test'), attuned: true };
    const dead = commitDeath(base({ inventory: [cloak] }), 'danger', () => 0.5);
    expect(dead.state.inventory!.every((i) => !i.attuned)).toBe(true);
    expect(dead.dead).toBe(true);

    let s = base({ inventory: [cloak], worldHour: 9, worldDay: 0 });
    s = removeItem(s, cloak.id);
    expect(s.awayAttuned).toEqual([{ id: cloak.id, name: cloak.name, since: 9 }]);
    expect(s.awayAttuned).toHaveLength(1);
    s = advanceClock(s, 23).state;
    expect(s.awayAttuned).toHaveLength(1);
    s = advanceClock(s, 1).state;
    expect(s.awayAttuned).toBeUndefined();
    expect(tickAwayAttunements(markAwayAttuned(base(), [cloak], 0), 24).awayAttuned).toBeUndefined();
  });
});
