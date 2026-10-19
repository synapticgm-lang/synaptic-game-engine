/**
 * q73-DYING — tabletop 0 HP: no travel while death saves run; Medicine DC 10 / potion are the
 * only other resolutions; the writer hears the engine dying line; a rescue after death is blocked.
 * SRD 5.2.1 (Wizards of the Coast, CC BY 4.0).
 */
import { describe, expect, it } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { runArcDirectorBeforeGm } from './arcDirector';
import { commitTravel } from './travelJourney';
import { resolveOfferedChoices } from './playTranscript';
import { resolveDeathSaveTurn } from './tabletop/roundFight';
import { writerDraftProblems } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { applyPlayPhaseAfterHp } from './playPhase';

function dying(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 50,
    seed: 'q73-dying',
    currentLocation: 'On the road between places',
    character: {
      ...s.character,
      name: 'Jax',
      hp: 0,
      maxHp: 12,
      conditions: ['Unconscious'],
      heroicInspiration: false,
      srd: { ...(s.character.srd ?? {}), classId: 'fighter', skillProfs: s.character.srd?.skillProfs ?? [], expertise: s.character.srd?.expertise ?? [] } as GameState['character']['srd'],
    },
    deathSaves: { successes: 0, failures: 0 },
    journey: {
      from: 'Greyhollow Graveyard',
      to: 'Greyhollow Church',
      legsDone: 0,
      legsTotal: 2,
      ground: 'Back streets',
    } as GameState['journey'],
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    sceneFacts: { ...(s.sceneFacts ?? {}), present: [], props: [], crowd: 'none', noise: 'quiet', lastBeat: '', updatedTurn: 50 },
    ...over,
  } as GameState;
}

function withAlly(name: string): Partial<GameState> {
  return {
    sceneFacts: {
      crowd: 'none',
      noise: 'quiet',
      present: [name],
      props: [],
      lastBeat: '',
      updatedTurn: 50,
    },
    npcMemories: [{
      npcId: `person:${name.toLowerCase().replace(/ /g, '-')}`,
      npcName: name,
      disposition: 'friendly',
      facts: [],
      lastSeenTurn: 49,
      present: true,
      location: 'On the road between places',
    }],
  };
}

describe('q73-DYING', () => {
  it('offers no travel chip while death saves are running', () => {
    const chips = resolveOfferedChoices(dying());
    expect(chips.some((c) => /travel/i.test(c))).toBe(false);
    expect(chips).toContain('Fight for breath');
  });

  it('typed travel resolves as a death-save turn and does not move', () => {
    const s = dying();
    const arc = runArcDirectorBeforeGm(s, 'Travel toward Greyhollow Church');
    expect(arc.state.currentLocation).toBe(s.currentLocation);
    expect(arc.state.journey).toEqual(s.journey);
    expect(arc.mandate).toMatch(/unconscious at 0 HP, death saves \d+ successes\/\d+ failures/);
    expect(arc.systemReceipts.some((r) => r.startsWith('Death save:'))).toBe(true);
    const travel = commitTravel(arc.state, 'Travel toward Greyhollow Church');
    expect(travel.handled).toBe(false);
    expect(travel.state.currentLocation).toBe(s.currentLocation);
  });

  it('a present ally stabilises on Medicine DC 10; an absent one does not', () => {
    const here = dying(withAlly('Wenna Brack'));
    const ok = resolveDeathSaveTurn(here, () => 0.5, 'Ask Wenna Brack to stabilise you')!;
    expect(ok.receipts.some((r) => r.includes('DC 10') && r.includes('success'))).toBe(true);
    expect(ok.facts).toMatch(/stable at 0 HP/);
    expect(ok.state.character.hp).toBe(1);
    expect(ok.state.deathSaves ?? null).toBeNull();

    const gone = dying({ deathSaves: { successes: 0, failures: 1 } });
    const miss = resolveDeathSaveTurn(gone, () => 0.5, 'Ask Father Aldous to stabilise you')!;
    expect(miss.receipts.some((r) => r.startsWith('Death save:'))).toBe(true);
    expect(miss.state.character.hp).toBe(0);
    expect(miss.state.deathSaves?.successes).toBe(1);
    expect(miss.facts).not.toMatch(/stable at 0 HP/);
  });

  it('a carried potion ends dying', () => {
    const s = dying({
      inventory: [{ id: 'pot', name: 'Potion of Healing', rarity: 'Common', quantity: 1 }],
    });
    const r = resolveDeathSaveTurn(s, () => 0, 'Drink the Potion of Healing')!;
    expect(r.state.character.hp).toBeGreaterThan(0);
    expect(r.state.deathSaves ?? null).toBeNull();
    expect(r.state.inventory?.some((i) => i.id === 'pot')).toBe(false);
    expect(isDyingSafe(r.state)).toBe(false);
  });

  it('the third failure tags death, and a rescue draft is rejected', () => {
    const s = dying({ deathSaves: { successes: 0, failures: 2 } });
    const r = resolveDeathSaveTurn(s, () => 0, 'Fight for breath')!;
    expect(r.state.deathSaves?.dead).toBe(true);
    expect(r.facts).toContain('Jax died');
    expect(r.state.timeline?.some((t) => t.kind === 'person' && t.verb === 'died' && t.name === 'Jax')).toBe(true);
    const ended = applyPlayPhaseAfterHp(r.state, 0, 54);
    expect(ended.playPhase).toBe('ended');
    const rescue = 'Jax walked up the church steps. Jax woke in the doorway.';
    const problems = writerDraftProblems(rescue, {
      state: ended,
      playerInput: 'Fight for breath',
      intent: parsePlayerIntent('Fight for breath', ended),
      engineFact: r.facts,
      previousGm: '',
    });
    expect(problems.some((p) => p.startsWith('Show the player acting after death'))).toBe(true);
    const walking = writerDraftProblems('Jax walked toward Greyhollow Church.', {
      state: dying(),
      playerInput: 'Travel toward Greyhollow Church',
      intent: parsePlayerIntent('Travel toward Greyhollow Church', s),
      engineFact: '',
      previousGm: '',
    });
    expect(walking.some((p) => p.startsWith('Show the player acting while unconscious'))).toBe(true);
  });

  it('the harness treats a run-ended panel as death at Tn, not a failure', async () => {
    const mod = await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/ai-player-browser/runVerdict.mjs')).href);
    expect(mod.runEndedResult({ playPhase: 'ended', runEndedTurn: '54' })).toBe('run ended: death at T54');
    expect(mod.runEndedResult({ runEnded: 'death', runEndedTurn: '54' })).toBe('run ended: death at T54');
    expect(mod.runEndedResult({ playPhase: 'live' })).toBeNull();
    const verdict = mod.runVerdict([{ bibleId: 'cursed-keep', ok: false, ended: true, result: 'run ended: death at T54' }]);
    expect(verdict.ok).toBe(true);
    expect(verdict.problems.some((p: string) => p.includes('not_ok'))).toBe(false);
  });
});

function isDyingSafe(state: GameState): boolean {
  const ds = state.deathSaves;
  return state.engineMode === 'dnd' && !!ds && !ds.dead && !ds.stable;
}
