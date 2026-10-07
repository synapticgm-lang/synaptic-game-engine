/**
 * 29z2 — tester turn check: ghost / impossible chips, prose that ignores the action, interior or extra
 * floors on open ground, quest places the scene never set up, broken lines. No live GM call.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { buildInteriorFloorPlan } from './mapEngine';
import {
  brokenLines,
  checkActionFollowed,
  checkChips,
  checkPlayerTurn,
  checkQuestPlaces,
  chipAddressee,
} from './turnCheck';
import type { GameState, LogEntry, Quest } from './types';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'z2',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Lowmarket',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [],
    npcMemories: [],
    companions: [],
    turn: 8,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: {
      ...s.sceneFacts!,
      crowd: 'none',
      present: [],
      crowdCount: 0,
      ...(over.sceneFacts ?? {}),
    },
  };
}

const gm = (turn: number, content: string): LogEntry => ({ id: `g${turn}`, turn, role: 'gm', content, timestamp: turn });

describe('29z2 — stamp', () => {
  it('HUD/BUILD are 2026-10-07b, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-10-07b');
    expect(BUILD_STAMP).toBe('2026-10-07b');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('29z2 — chips', () => {
  it('reads the addressee of a talk chip', () => {
    expect(chipAddressee('Talk to Nell Barrow')).toEqual({ kind: 'named', who: 'Nell Barrow' });
    expect(chipAddressee('Ask what they want')).toEqual({ kind: 'none', who: '' });
    expect(chipAddressee('Search the crate')).toBeNull();
    expect(chipAddressee('Press the attack')).toBeNull();
  });

  it('a chip that talks to someone not here is a P0; the same chip with them present is not', () => {
    const empty = base();
    expect(checkChips(empty, ['Talk to Nell']).map((f) => f.kind)).toEqual(['ghost-chip']);
    expect(checkChips(empty, ['Ask what they want']).map((f) => f.kind)).toEqual(['ghost-chip']);
    const withNell = base({ sceneFacts: { present: ['Nell'] } as GameState['sceneFacts'] });
    expect(checkChips(withNell, ['Talk to Nell', 'Ask what they want'])).toEqual([]);
  });

  it('chips the scene made impossible are P0s', () => {
    const dead = base({
      sceneFacts: {
        present: ['Nell'],
        lastKill: { name: 'Ash Wolf', outcome: 'victory', turn: 7, remains: true },
      } as GameState['sceneFacts'],
    });
    const kinds = checkChips(dead, ['Talk to Ash Wolf', 'Press the attack', 'Loot the body of Ash Wolf']).map((f) => f.kind);
    expect(kinds).toEqual(['impossible-chip', 'impossible-chip']);
    const noBody = base();
    expect(checkChips(noBody, ['Loot the body of Ash Wolf']).map((f) => f.kind)).toEqual(['impossible-chip']);
  });
});

describe('29z2 — prose follows the player', () => {
  it('a named talk the prose never answers is a P0', () => {
    const s = base({ sceneFacts: { present: ['Nell'] } as GameState['sceneFacts'] });
    const miss = checkActionFollowed(s, s, 'Talk to Nell', 'Rain ran down the stalls. Carts rolled past toward the gate.');
    expect(miss.p0.map((f) => f.kind)).toEqual(['ignored-action']);
    const hit = checkActionFollowed(s, s, 'Talk to Nell', 'Nell looked up from her scales. "Coin first," she said.');
    expect(hit.p0).toEqual([]);
  });

  it('restating the arrival instead of acting is a P0', () => {
    const arrival =
      'You came into Lowmarket under a grey sky. Stalls leaned against each other along the lane. A fence buyer counted coins behind a table.';
    const s = base({ log: [gm(1, arrival)] });
    const res = checkActionFollowed(s, s, 'Search the crate', arrival);
    expect(res.p0.map((f) => f.kind)).toEqual(['ignored-action']);
    const acted = checkActionFollowed(s, s, 'Search the crate', 'You pried the crate lid up. Straw, two bent nails, and a tin cup sat inside it.');
    expect(acted.p0).toEqual([]);
  });

  it('a committed travel that never says where the player went is a P0', () => {
    const before = base();
    const after = base({ currentLocation: 'West Wall' });
    const res = checkActionFollowed(before, after, 'Travel toward West Wall', 'The air was cold and the light was thin.');
    expect(res.p0.map((f) => f.kind)).toEqual(['ignored-action']);
    expect(checkActionFollowed(before, after, 'Travel toward West Wall', 'You climbed to the West Wall as the bells rang.').p0).toEqual([]);
  });
});

describe('29z2 — map and quest places', () => {
  it('an interior plan drawn on open ground is a P0 once; a basement in the scene allows the cellar floor only', () => {
    const plan = buildInteriorFloorPlan('a half-collapsed ruin', [], undefined, 'z2-plan');
    const before = base();
    const after = base({ activeDungeon: plan });
    const first = checkPlayerTurn(before, after, { offeredChoices: [], playerInput: 'Wait', gmText: 'You waited.' });
    expect(first.p0.map((f) => f.kind)).toContain('open-ground-interior');
    const again = checkPlayerTurn(after, after, { offeredChoices: [], playerInput: 'Wait', gmText: 'You waited.' });
    expect(again.p0.map((f) => f.kind)).not.toContain('open-ground-interior');
    const cellarOnly = { ...plan, nodes: plan.nodes.filter((n) => (n.zLevel ?? 0) <= 0) };
    const withCellar = base({ activeDungeon: cellarOnly, log: [gm(8, 'A trapdoor under the stall opened on a cellar.')] });
    const ok = checkPlayerTurn(before, withCellar, { offeredChoices: [], playerInput: 'Wait', gmText: 'You waited.' });
    expect(ok.p0.map((f) => f.kind)).not.toContain('open-ground-interior');
  });

  it('a quest naming a place nobody set up is a P0; a known hub is not', () => {
    const q = (location: string): Quest =>
      ({ id: 'q1', name: 'Carry the parcel', description: '', status: 'active', type: 'side', revealed: true, location }) as Quest;
    const before = base();
    expect(checkQuestPlaces(before, base({ quests: [q('Grimwater Spire')] })).map((f) => f.kind)).toEqual([
      'unestablished-quest-place',
    ]);
    expect(checkQuestPlaces(before, base({ quests: [q('West Wall')] }))).toEqual([]);
    const said = base({ quests: [q('Grimwater Spire')], log: [gm(8, 'She pointed east, toward Grimwater Spire.')] });
    expect(checkQuestPlaces(before, said)).toEqual([]);
  });
});

describe('29z2 — lines', () => {
  it('flags broken shape, not a list of words', () => {
    expect(brokenLines('You walked to the the gate.').map((f) => f.kind)).toEqual(['broken-line']);
    expect(brokenLines('"Stop there, she said.').map((f) => f.kind)).toContain('broken-line');
    expect(brokenLines('Not a soul in sight.')).toEqual([]);
    // Stiff but well-formed: left for the judge pass, no phrase block here.
    expect(brokenLines('The horizon is empty of people.')).toEqual([]);
  });
});

describe('29z2 — autoThumbs reads the row check', () => {
  it('turns a row P0 into a thumbs-down and a report P0 count', () => {
    const dir = mkdtempSync(join(tmpdir(), 'z2-thumbs-'));
    const row = {
      turn: 3,
      playerInput: 'Talk to Nell',
      offeredChoices: ['Talk to Nell'],
      gmText: 'Rain ran down the stalls.',
      location: 'Lowmarket',
      progress: false,
      turnCheck: {
        p0: [{ kind: 'ghost-chip', detail: '"Talk to Nell" talks to Nell, who is not here' }],
        down: [{ kind: 'broken-line', detail: 'doubled word "the the"' }],
        presentNames: [],
      },
    };
    writeFileSync(join(dir, 'turns.jsonl'), JSON.stringify(row) + '\n');
    const res = spawnSync(process.execPath, [join('scripts', 'fate-autoplay', 'autoThumbs.mjs'), dir], { encoding: 'utf8' });
    expect(res.status).toBe(0);
    const thumbs = JSON.parse(readFileSync(join(dir, 'thumbs.json'), 'utf8'));
    expect(thumbs.p0Count).toBe(1);
    expect(thumbs.turns[0].verdict).toBe('down');
    expect(thumbs.turns[0].p0[0]).toMatch(/ghost-chip/);
    expect(readFileSync(join(dir, 'report.md'), 'utf8')).toMatch(/P0 \(turn fails\): 1/);
    expect(readFileSync(join(dir, 'writer-lessons.jsonl'), 'utf8')).toMatch(/broken/);
  });
});
