/**
 * tt-cut part 1 — the lap-10 roots, each through the shared mechanism it now runs on.
 */
import { describe, expect, it } from 'vitest';
import { newGameState } from './newGameTestState';
import type { GameState } from './types';
import { obeyLedgerNouns } from './ledgerNounObey';
import { applyProseWarden } from './proseWarden';
import { thisTurnsEventCheck } from './writerTurn';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { nudgeIfStuck } from './choiceRanking';
import { hubsForBibleId } from './outdoorHubs';
import { checkActionFollowed } from './turnCheck';
import { lineHasUnhandedOwnThing } from './tokenProse';
// @ts-expect-error plain .mjs script
import { checkTurn } from '../../scripts/factCheck.mjs';

const tabletop = (over: Partial<GameState> = {}): GameState => {
  const s = newGameState('cursed-keep', { engineMode: 'dnd' });
  return { ...s, turn: 7, character: { ...s.character!, name: 'Jax' }, ...over } as GameState;
};

describe('(a) the warden noun pass keeps this turn’s event', () => {
  const input = 'Force a path forward';
  const lap10 =
    "Jax forced a path forward along the washed-out road and held their ground; word reached them about The Woodcutter's Plea to speak with Oskar at the Greyhollow Tavern. The two sentries watched.";

  it('an off-list name cuts its clause from the event sentence, not the sentence', () => {
    const s = tabletop({ currentLocation: 'the washed-out road' });
    const line = 'Jax forced a path forward along the road and held their ground; Brother Tam called from the gate. The sentries watched.';
    expect(obeyLedgerNouns(line, s).prose).not.toContain('forced a path');
    const kept = obeyLedgerNouns(line, s, undefined, thisTurnsEventCheck({ state: s, playerInput: input })).prose;
    expect(kept).toContain('Jax forced a path forward along the road and held their ground.');
    expect(kept).not.toContain('Brother Tam');
  });

  it('applyProseWarden passes the event check to the noun pass (lap 10 F T5)', () => {
    const s = tabletop({ currentLocation: 'the washed-out road' });
    const out = applyProseWarden(lap10, {
      ledgerState: s,
      playerInput: input,
      isThisTurnsEvent: thisTurnsEventCheck({ state: s, playerInput: input }),
    });
    expect(out).toContain('Jax forced a path forward');
  });
});

describe('(b) a quest step names a place by its one real name', () => {
  const ck = ALL_CAMPAIGN_BIBLES.find((b) => b.id === 'cursed-keep')!;
  const steps = ck.starterQuests.flatMap((q) => q.objectives);

  it('the cursed-keep talk step names Greyhollow Inn', () => {
    expect(steps).toContain('Speak with Oskar at the Greyhollow Inn');
    expect(steps.some((o) => o.includes('Greyhollow Tavern'))).toBe(false);
  });

  it('no story’s quest step uses a hub’s other proper name (every word capitalised) instead of the hub’s name', () => {
    const wrong: string[] = [];
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      const hubs = hubsForBibleId(bible.id);
      const others = hubs.flatMap((h) =>
        (h.aliases ?? [])
          .filter((a) => a.split(' ').length >= 2 && a.split(' ').every((w) => /^[A-Z]/.test(w)))
          .filter((a) => !hubs.some((o) => o.name.includes(a)))
          .map((a) => [a, h.name] as const)
      );
      for (const step of bible.starterQuests.flatMap((q) => q.objectives)) {
        for (const [alias, name] of others) {
          if (new RegExp(`\\b${alias}\\b`).test(step)) wrong.push(`${bible.id}: "${step}" says ${alias}, the hub is ${name}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('a new game’s journal carries the canonical name', () => {
    const s = newGameState('cursed-keep', { engineMode: 'dnd' });
    const all = (s.quests ?? []).flatMap((q) => (q.objectives ?? []).map((o) => o.description)).join(' | ');
    expect(all).not.toContain('Greyhollow Tavern');
  });
});

describe('(c) the hub-mention nudge follows the first-sight rule', () => {
  it('a place mentioned from afar is its name, with no card text', () => {
    const s = tabletop({
      currentLocation: 'Keep Gate',
      places: [],
      quests: [],
      npcMemories: [{ npcId: 'dain-holt', npcName: 'Dain Holt', location: 'Keep Gate' }],
      circling: { stale: {}, lastProgressTurn: 0, nudgeCursor: 3 },
    } as unknown as Partial<GameState>);
    const line = nudgeIfStuck(s).receipts[0] ?? '';
    expect(line).toMatch(/^Nudge: Dain Holt mentions /);
    expect(line).not.toContain('Last coach stop');
    expect(line.split(' mentions ')[1]).not.toContain(':');
  });
});

describe('(d) "Check the exits" acts on this place’s ways out', () => {
  const s = tabletop({ currentLocation: 'Keep Gate' });
  const after = {
    ...s,
    completedEvent: { playerAction: 'Check the exits', engineResult: 'Exits: the ways out of Keep Gate lead to Greyhollow Inn, Greyhollow Church.' },
  } as unknown as GameState;
  const kinds = (prose: string, offered: string[] = []) => {
    const r = checkActionFollowed(s, after, 'Check the exits', prose, offered);
    return [...r.p0, ...r.down].map((f) => f.kind);
  };

  it('tt-fix-8: the engine chip the engine resolved is trusted, not re-read', () => {
    expect(kinds('Jax looked over the ways out: the road down to Greyhollow Inn and the lane to Greyhollow Church.', ['Check the exits'])).not.toContain('action-object-missing');
  });

  it('typed, a beat that names none of them still flags', () => {
    expect(kinds('The wind picked up. Somewhere a shutter banged.')).toContain('action-object-missing');
  });
});

describe('(e) the fact checker reads worn things and speech the way the game gate does', () => {
  const packet = 'The player character is Jax.\nYOU MAY ONLY MENTION: Keep Gate, Greyhollow Inn, Treeline, Blackspine Treeline.\nInventory: tavern lodging token x1';
  const engineFact = 'Exits: the ways out of Greyhollow Inn lead to Keep Gate, Greyhollow Church.';
  const kinds = (gmText: string) =>
    (checkTurn({ turn: 10, gmText, engineFact }, packet, '') as Array<{ kind: string }>).map((f) => f.kind);

  it('worn boots are held, as in the game gate', () => {
    expect(lineHasUnhandedOwnThing('Jax pulled on their boots.', 'Greyhollow Inn', 'Jax')).toBe(false);
    expect(kinds('Jax walked to the chained gate, and their boots stopped where the footprints stopped.')).not.toContain('item');
    expect(kinds('Jax found a lantern lying by the gate.')).toContain('item');
  });

  it('a place named in speech is not a claimed way out; in narration it is', () => {
    expect(kinds('Oskar said, "I saw tracks that led toward the keep gate and into the treeline."')).not.toContain('exit-place');
    expect(kinds('The only other road led to the Treeline.')).toContain('exit-place');
  });
});
