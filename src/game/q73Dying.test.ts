/**
 * q73-DYING / q73r-DYING — tabletop 0 HP: no travel while death saves run; Medicine DC 10 /
 * potion are the only other resolutions; writer facts stay fiction (no ledger HP); a rescue
 * after death is blocked.
 * SRD 5.2.1 (Wizards of the Coast, CC BY 4.0).
 * Replay shape: check-lap seed 20612 T10 drop → T11 travel-while-unconscious.
 */
import { describe, expect, it, afterEach } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { runArcDirectorBeforeGm } from './arcDirector';
import { commitTravel } from './travelJourney';
import { commitOfferedPad, resolveOfferedChoices } from './playTranscript';
import { resolveDeathSaveTurn } from './tabletop/roundFight';
import { writerDraftProblems } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { applyPlayPhaseAfterHp } from './playPhase';
import { pinDice } from './seededRng';

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
  afterEach(() => pinDice(() => Math.random()));

  it('offers no travel chip while death saves are running', () => {
    const chips = resolveOfferedChoices(dying());
    expect(chips.some((c) => /travel/i.test(c))).toBe(false);
    expect(chips).toContain('Fight for breath');
  });

  it('typed travel resolves as a death-save turn and does not move', () => {
    // Source of prior flake: vitest pinDice.setup pins Math.random, so turnRng was unseeded
    // and a nat-20 revive broke the unconscious mandate. Mid d20 stays dying.
    pinDice(() => 0.5);
    const s = dying();
    const arc = runArcDirectorBeforeGm(s, 'Travel toward Greyhollow Church');
    expect(arc.state.currentLocation).toBe(s.currentLocation);
    expect(arc.state.journey).toEqual(s.journey);
    expect(arc.mandate).toMatch(/unconscious, death saves \d+ successes\/\d+ failures/);
    expect(arc.mandate).not.toMatch(/\bHP\b/);
    expect(arc.systemReceipts.some((r) => r.startsWith('Death save:'))).toBe(true);
    const travel = commitTravel(arc.state, 'Travel toward Greyhollow Church');
    expect(travel.handled).toBe(false);
    expect(travel.state.currentLocation).toBe(s.currentLocation);
  });

  it('a present ally stabilises on Medicine DC 10; an absent one does not', () => {
    const here = dying(withAlly('Wenna Brack'));
    const ok = resolveDeathSaveTurn(here, () => 0.5, 'Ask Wenna Brack to stabilise you')!;
    expect(ok.receipts.some((r) => r.includes('DC 10') && r.includes('success'))).toBe(true);
    expect(ok.facts).toMatch(/stable, still down/);
    expect(ok.facts).not.toMatch(/\bHP\b/);
    expect(ok.state.character.hp).toBe(1);
    expect(ok.state.deathSaves ?? null).toBeNull();

    const gone = dying({ deathSaves: { successes: 0, failures: 1 } });
    const miss = resolveDeathSaveTurn(gone, () => 0.5, 'Ask Father Aldous to stabilise you')!;
    expect(miss.receipts.some((r) => r.startsWith('Death save:'))).toBe(true);
    expect(miss.state.character.hp).toBe(0);
    expect(miss.state.deathSaves?.successes).toBe(1);
    expect(miss.facts).not.toMatch(/stable, still down/);
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

describe('q73r-DYING seed 20612 T10-T11', () => {
  it('after the drop to 0, committed options contain no travel (MOVE refill stayed off)', () => {
    // Lap 20612 T10: fight dropped Jax to 0; pad still offered Travel + Fight for breath because
    // applyOptionCooldown refilled empty MOVE from place exits after dying chips were built.
    const afterDrop = dying({
      turn: 10,
      currentLocation: 'On the road between places',
      journey: {
        from: 'the washed-out road into Greyhollow',
        to: 'Greyhollow Inn',
        legsDone: 1,
        legsTotal: 2,
        ground: 'Back streets',
      } as GameState['journey'],
    });
    const pad = commitOfferedPad({ ...afterDrop, offeredPad: null, choices: ['Travel toward Greyhollow Inn'] });
    const choices = pad.offeredPad?.choices ?? [];
    expect(choices.some((c) => /travel/i.test(c))).toBe(false);
    expect(choices).toContain('Fight for breath');
    expect(pad.offeredPad?.chips?.every((c) => c.kind === 'dying')).toBe(true);
  });

  it('T11 travel input is a death-save turn with no movement, and ledger HP in prose is rejected', () => {
    // Lap shape (seed 20612 T11): travel while dying on the road to Greyhollow Inn.
    // Fixed mid d20 (not nat 20): stay dying so travel is refused; turnRng hashes the journey.
    const s = dying({
      turn: 11,
      currentLocation: 'On the road between places',
      journey: {
        from: 'the washed-out road into Greyhollow',
        to: 'Greyhollow Inn',
        legsDone: 1,
        legsTotal: 2,
        ground: 'Back streets',
      } as GameState['journey'],
    });
    const here = s.currentLocation;
    const save = resolveDeathSaveTurn(s, () => 0.5, 'Travel toward Greyhollow Inn')!;
    expect(save.receipts.some((r) => r.startsWith('Death save:'))).toBe(true);
    expect(save.state.character.hp).toBe(0);
    expect(isDyingSafe(save.state)).toBe(true);
    expect(save.facts).toMatch(/unconscious, death saves/);
    expect(save.facts).not.toMatch(/\bHP\b/);
    expect(save.state.currentLocation).toBe(here);
    expect(save.state.journey).toEqual(s.journey);
    const travel = commitTravel(save.state, 'Travel toward Greyhollow Inn');
    expect(travel.handled).toBe(false);
    expect(travel.state.currentLocation).toBe(here);

    // Director path (stock dying journey): travel input is still a death-save mandate, no move.
    const arc = runArcDirectorBeforeGm(dying(), 'Travel toward Greyhollow Inn');
    expect(arc.state.currentLocation).toBe(dying().currentLocation);
    expect(arc.systemReceipts.some((r) => r.startsWith('Death save:'))).toBe(true);
    expect(arc.mandate).toMatch(/unconscious, death saves/);
    expect(arc.mandate).not.toMatch(/\bHP\b/);

    const ledgerProse = 'You lie unconscious on the ground at 0 HP and cannot move, speak or act.';
    const problems = writerDraftProblems(ledgerProse, {
      state: s,
      playerInput: 'Travel toward Greyhollow Inn',
      intent: parsePlayerIntent('Travel toward Greyhollow Inn', s),
      engineFact: save.facts,
      previousGm: '',
    });
    expect(problems.some((p) => p.startsWith('Wrong voice:') && /\bHP\b/.test(p))).toBe(true);
  });
});

function isDyingSafe(state: GameState): boolean {
  const ds = state.deathSaves;
  return state.engineMode === 'dnd' && !!ds && !ds.dead && !ds.stable;
}
