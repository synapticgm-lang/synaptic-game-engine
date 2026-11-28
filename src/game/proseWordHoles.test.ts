/**
 * Live salt-road-heist 2026-11-28T04-48-33: scrubInternalRefIds blanked bare tN
 * mid-sentence. Arrival stamp used placeholder "Adventurer".
 */
import { describe, expect, it } from 'vitest';
import { scrubInternalRefIds, applyProseWarden } from './proseWarden';
import { paintTokensOrDrop, renderTokenBeat, type TokenBeat } from './tokenProse';
import { withMoveDestination } from './writerTurn';
import { createInitialState } from './defaults';
import type { LedgerRef } from './completedEventPacket';

/** Real GM strings from scripts/ai-player-browser/runs/2026-11-28T04-48-33/play-log.md */
const T2_HOLE = "Brack's hand stayed closed around a scrap of cloth map,.";
const T3_HOLES =
  'Adventurer reached Salt Road Waystation. The was long, and the last of it ran uphill toward the in Lislestead Hollow. The newcomer came off the under the waystation\'s big wooden gate and stopped in the open yard while the gate behind them swung shut. A wooden sign nailed to the waystation post pointed the way with one arrow toward the, another toward, a third to the, and a last one to the.';
const T6_ARRIVAL = 'Adventurer reached Lislestead Hollow.';

describe('GM prose never has words cut out', () => {
  it('scrubInternalRefIds is a no-op (does not blank bare tN into holes)', () => {
    const withBareToks =
      "Brack's hand stayed closed around a scrap of cloth map, t8. The t1 was long, and the last of it ran uphill toward the t2 in Lislestead Hollow. The newcomer came off the t3 under the waystation's big wooden gate. A wooden sign pointed with one arrow toward the t4, another toward t5, a third to the t6, and a last one to the t7.";
    expect(scrubInternalRefIds(withBareToks)).toBe(withBareToks);
    expect(scrubInternalRefIds(withBareToks)).not.toBe(T2_HOLE);
    expect(scrubInternalRefIds(withBareToks)).not.toContain('The was long');
    expect(scrubInternalRefIds(withBareToks)).not.toContain('toward the,');
    expect(scrubInternalRefIds(withBareToks)).not.toContain('off the under');
  });

  it('applyProseWarden does not cut words out of the live hole strings', () => {
    const intact =
      "Brack's hand stayed closed around a scrap of cloth map of the coast. The Salt Road was long, and the last of it ran uphill toward the mill in Lislestead Hollow.";
    const out = applyProseWarden(intact, {
      currentLocation: 'Salt Road Waystation',
      presentNames: ['Hale Brack'],
    } as never);
    expect(out).toContain('map of the coast');
    expect(out).toContain('Salt Road was long');
    expect(out).not.toContain(T2_HOLE);
    expect(out).not.toContain('The was long');
  });

  it('paintTokensOrDrop drops sentences with unresolved bare tN instead of blanking slots', () => {
    const text =
      "Brack's hand stayed closed around a scrap of cloth map, t8. The t1 was long toward the t2.";
    expect(paintTokensOrDrop(text, () => undefined)).toBe('');
    const painted = paintTokensOrDrop(text, (tok) =>
      tok === 't1' ? 'Salt Road' : tok === 't2' ? 'mill' : tok === 't8' ? 'Folded' : undefined
    );
    expect(painted).toContain('Salt Road was long');
    expect(painted).toContain('map, Folded');
    expect(painted).not.toContain('map,.');
    expect(painted).not.toContain('The was long');
  });

  it('renderTokenBeat drops lines with unresolved bare tN (no empty-slot holes)', () => {
    const beat: TokenBeat = {
      refs: [{ tok: 't1', id: 'place_salt', use: 'place' }],
      lines: [{ fn: 'action', text: 'The t1 was long toward the t2.' }],
    };
    const refs: LedgerRef[] = [{ tok: 't1', id: 'place_salt', display: 'Salt Road', klass: 'place' }];
    expect(renderTokenBeat(beat, refs)).toBe('');
    expect(renderTokenBeat(beat, refs)).not.toContain('The was long');
  });
});

describe('arrival line never stamps placeholder Adventurer', () => {
  it('withMoveDestination uses They when character.name is Adventurer', () => {
    const s = createInitialState();
    s.character = { ...s.character, name: 'Adventurer' };
    s.currentLocation = 'Salt Road Waystation';
    s.turn = 3;
    s.circling = { movedTurn: 3 } as never;
    const out = withMoveDestination(s, 'The newcomer walked in.');
    expect(out.startsWith('They reached Salt Road Waystation.')).toBe(true);
    expect(out).not.toContain(T6_ARRIVAL);
    expect(out).not.toContain('Adventurer reached');
  });

  it('withMoveDestination keeps a real locked name', () => {
    const s = createInitialState();
    s.character = { ...s.character, name: 'Jax' };
    s.currentLocation = 'Lislestead Hollow';
    s.turn = 6;
    s.circling = { movedTurn: 6 } as never;
    const out = withMoveDestination(s, 'What they found was the town itself.');
    expect(out.startsWith('Jax reached Lislestead Hollow.')).toBe(true);
  });

  it('live hole strings are not equality targets for arrival', () => {
    expect(T3_HOLES.startsWith('Adventurer reached')).toBe(true);
  });
});
