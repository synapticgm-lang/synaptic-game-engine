/**
 * TRAINLOOP2 — mid-journey must never lose continue + turn-back chips.
 * Millstone Road s8100: Make camp → wildlife + pendingFirstFight made engineChips
 * exclusive to Back off/Talk/Fight, so Walk on / Turn back / Push on failed isLegalEnginePad
 * and the pad collapsed to dead Inspect chips. applyDirectorChipPolicy also stripped Walk on
 * under engineThreatHere (T10RC5 blockTravel).
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { applyDirectorChipPolicy } from './director';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { checkChipKinds } from './chipCheck';
import { isLegalEnginePad, engineChips } from './choicePipeline';
import { commitOfferedPad, resolveOfferedChoices } from './playTranscript';
import { placeExits } from './placeRegistry';
import { resolvePlace } from './places';
import { wayOutMovesPlayer } from './sceneAffordances';
import {
  commitTravel,
  isJourneyOnwardLine,
  isJourneyUnderway,
  journeyPads,
  UNDERWAY_HERE,
} from './travelJourney';
import { openFirstFightGate } from './rules/firstFightChoice';
import type { ActiveEncounter, GameState, LogEntry, RoadEncounter, TravelJourney } from './types';

function playReady(bibleId: string, seed: number): GameState {
  const { state } = buildNewGameState({
    bibleId,
    characterName: 'Jax',
    seed,
    personality: 'chilled-gm',
    engineMode: 'dnd',
  });
  const opened = stampOpening(state);
  // Past autoNamedOpeningPad (turn ≤ 2) and with a player line so cover pads cannot own the road.
  const playerLine: LogEntry = {
    id: `trainloop2-player-${bibleId}`,
    role: 'player',
    content: 'Look around',
    timestamp: Date.now(),
    turn: Math.max(opened.turn ?? 0, 10),
  };
  return {
    ...opened,
    turn: Math.max(opened.turn ?? 0, 10),
    log: [...(opened.log ?? []), playerLine],
    openingEstablishment: {
      ...(opened.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
      pending: [],
      complete: true,
      sceneWritten: true,
    },
  };
}

function continueChips(labels: string[]): string[] {
  return labels.filter(
    (l) =>
      isJourneyOnwardLine(l)
      || /^push on\b/i.test(l)
      || /^travel on\.?$/i.test(l)
      || /^walk on\b/i.test(l),
  );
}

function turnBackChips(labels: string[]): string[] {
  return labels.filter((l) => /^turn back\b/i.test(l));
}

function assertJourneyMovers(state: GameState, labels: string[], tag: string): string[] {
  const holes: string[] = [];
  if (!continueChips(labels).length) {
    holes.push(`${tag}:no-continue offered=[${labels.join(' | ')}]`);
  }
  if (!turnBackChips(labels).length) {
    holes.push(`${tag}:no-turn-back offered=[${labels.join(' | ')}]`);
  }
  for (const label of labels) {
    if (!isLegalEnginePad(label, state)) {
      holes.push(`${tag}:unbound:${label}`);
    }
  }
  const dead = checkChipKinds(state, labels).filter((f) => f.kind === 'dead-chip');
  for (const d of dead) holes.push(`${tag}:dead-chip:${d.detail}`);
  return holes;
}

function withWildlife(state: GameState): GameState {
  const j = state.journey;
  if (!j) throw new Error('expected journey');
  const encounter: RoadEncounter = {
    kind: 'wildlife',
    level: 1,
    stretch: j.legsDone || 1,
    dangerous: false,
    want: 'food and nothing more',
    distanceFt: 40,
  };
  return { ...state, journey: { ...j, encounter } };
}

function withParkedThreat(state: GameState): GameState {
  const foe: ActiveEncounter = {
    name: 'Road Bandit',
    level: 1,
    hp: 11,
    maxHp: 11,
    armorClass: 12,
    strength: 11,
    dexterity: 12,
    constitution: 12,
    xpReward: 25,
    goldReward: 2,
  };
  return openFirstFightGate(state, foe);
}

function arriveAt(state: GameState, dest: string): GameState {
  let at = commitTravel(state, `Travel toward ${dest}`).state;
  let guard = 0;
  while (isJourneyUnderway(at) && guard++ < 16) {
    const pads = journeyPads(at);
    const onward =
      pads.find((p) => isJourneyOnwardLine(p) || /^push on\b/i.test(p) || /^travel on/i.test(p))
      ?? 'Walk on';
    at = commitTravel(at, onward).state;
  }
  return at;
}

function startJourneyToward(state: GameState, dest: string): GameState {
  const out = commitTravel(state, `Travel toward ${dest}`);
  expect(out.handled, `Travel toward ${dest} must start`).toBe(true);
  expect(isJourneyUnderway(out.state), `expected journey toward ${dest}`).toBe(true);
  return out.state;
}

describe('TRAINLOOP2 transit-stuck — director + first-fight must keep journey movers', () => {
  it('parked/pending threat does not strip Walk on / Turn back while journey is underway', () => {
    let at = playReady('millstone-road', 8100);
    const exits = placeExits(at, at.currentLocation ?? '');
    const ford = exits.find((e) => /ford camp/i.test(e)) ?? exits[0];
    expect(ford, 'opening needs an exit').toBeTruthy();
    if (!/ford camp/i.test(at.currentLocation ?? '')) {
      at = arriveAt(at, ford!);
    }
    const ridge =
      placeExits(at, at.currentLocation ?? '').find((e) => /ridge watch/i.test(e))
      ?? placeExits(at, at.currentLocation ?? '').find((e) => e !== at.currentLocation);
    expect(ridge, 'Ford Camp needs an onward exit').toBeTruthy();
    at = startJourneyToward(at, ridge!);

    const threatened = withParkedThreat(withWildlife(at));
    expect(isJourneyUnderway(threatened)).toBe(true);

    const built = journeyPads(threatened);
    expect(
      continueChips(built).length + turnBackChips(built).length,
      `journeyPads movers: ${built.join(' | ')}`,
    ).toBeGreaterThan(0);

    const directed = applyDirectorChipPolicy(threatened, built, { inFight: false });
    expect(continueChips(directed).length, `director stripped continue: ${directed.join(' | ')}`).toBeGreaterThan(0);
    expect(turnBackChips(directed).length, `director stripped turn-back: ${directed.join(' | ')}`).toBeGreaterThan(0);

    const offered = resolveOfferedChoices(threatened);
    const holes = assertJourneyMovers(threatened, offered, 'millstone:threatened-pad');
    // First-fight triad may share the pad; journey movers must still bind.
    expect(holes, holes.join('\n') || 'ok').toEqual([]);
    const engines = engineChips(threatened).map((c) => c.label.toLowerCase());
    for (const c of [...continueChips(offered), ...turnBackChips(offered)]) {
      expect(engines, `engineChips missing ${c}`).toContain(c.toLowerCase());
    }
  });

  it('Make camp → wildlife beat → continue + turn-back still offered (Millstone regression)', () => {
    let at = playReady('millstone-road', 8100);
    const exits = placeExits(at, at.currentLocation ?? '');
    const ford = exits.find((e) => /ford camp/i.test(e)) ?? exits[0]!;
    if (!/ford camp/i.test(at.currentLocation ?? '')) {
      at = arriveAt(at, ford);
    }
    const ridge =
      placeExits(at, at.currentLocation ?? '').find((e) => /ridge watch/i.test(e))
      ?? placeExits(at, at.currentLocation ?? '').find((e) => e !== at.currentLocation);
    at = startJourneyToward(at, ridge!);

    let camped = commitTravel(at, 'Make camp');
    for (let i = 0; i < 40 && camped.event !== 'camp'; i++) {
      const quiet: GameState = {
        ...at,
        seed: `camp-${i}`,
        journey: at.journey
          ? ({ ...at.journey, encounter: null } satisfies TravelJourney)
          : at.journey,
      };
      camped = commitTravel(quiet, 'Make camp');
    }
    at = camped.state;
    expect(isJourneyUnderway(at), 'camping must leave the journey underway').toBe(true);
    expect(at.currentLocation).toBe(UNDERWAY_HERE);

    at = withWildlife(at);
    const deal = journeyPads(at).find((p) => /^Deal with/.test(p));
    if (deal) {
      const afterDeal = commitTravel(at, deal);
      if (afterDeal.handled) at = afterDeal.state;
    }
    // Live tape also had pendingFirstFight mandates on the road after camp.
    at = withParkedThreat(at);

    const padState = commitOfferedPad({ ...at, offeredPad: null });
    const labels = padState.offeredPad?.choices ?? resolveOfferedChoices(at);
    const holes = assertJourneyMovers(at, labels, 'millstone:after-camp-wildlife');
    expect(holes, holes.join('\n') || 'ok').toEqual([]);
  });
});

describe('TRAINLOOP2 transit-stuck — every premade tabletop world', () => {
  it('opening has a way onward; first journey keeps continue+turn-back at each road state', () => {
    const holes: string[] = [];
    let worlds = 0;
    let placesChecked = 0;
    let chipsChecked = 0;
    let journeysChecked = 0;
    const seenStillroot = { ok: false };
    const seenMillstone = { ok: false };

    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (bible.engineMode !== 'dnd') continue;
      if (bible.id.startsWith('blank-canvas')) continue;
      worlds += 1;
      let opened: GameState;
      try {
        opened = playReady(bible.id, 8100 + worlds);
      } catch (err) {
        holes.push(`${bible.id}:open-failed:${(err as Error).message ?? err}`);
        continue;
      }
      const here = (opened.currentLocation ?? '').trim();
      if (!here) {
        holes.push(`${bible.id}:no-HERE`);
        continue;
      }
      placesChecked += 1;
      if (bible.id === 'stillroot-veil') seenStillroot.ok = true;
      if (bible.id === 'millstone-road') seenMillstone.ok = true;

      const padState = commitOfferedPad({ ...opened, offeredPad: null });
      const labels = padState.offeredPad?.choices ?? [];
      chipsChecked += labels.length;
      for (const label of labels) {
        if (!isLegalEnginePad(label, padState)) holes.push(`${bible.id}:${here}:unbound:${label}`);
      }
      const dead = checkChipKinds(padState, labels).filter((f) => f.kind === 'dead-chip');
      for (const d of dead) holes.push(`${bible.id}:${here}:dead-chip:${d.detail}`);

      // Intentional sealed openings (e.g. Ernost gatehouse closed card) are not transit holes —
      // same skip as verdantBlightLoop / Stillroot drowned-chapel contract.
      const place = resolvePlace(opened.places, here);
      if (place?.closed || place?.arcStatus === 'closed') continue;

      const exits = placeExits(opened, here);
      if (exits.length === 0) {
        holes.push(`${bible.id}:${here}:no-exits`);
        continue;
      }
      const advancing = labels.filter((l) => wayOutMovesPlayer(padState, l));
      if (!advancing.length) {
        holes.push(`${bible.id}:${here}:no-Travel offered=[${labels.join(' | ')}] exits=[${exits.join(',')}]`);
        continue;
      }

      const dest = exits[0]!;
      let road = commitTravel(opened, `Travel toward ${dest}`).state;
      if (!isJourneyUnderway(road)) continue;
      journeysChecked += 1;

      const states: Array<{ tag: string; state: GameState }> = [
        { tag: 'leaving', state: road },
      ];

      const quietJ = road.journey
        ? { ...road, journey: { ...road.journey, encounter: null } as TravelJourney }
        : road;
      states.push({ tag: 'mid-quiet', state: quietJ });

      const camped = commitTravel(quietJ, 'Make camp');
      if (isJourneyUnderway(camped.state)) {
        states.push({ tag: 'after-camp', state: camped.state });
      }

      const animal = withWildlife(quietJ);
      states.push({ tag: 'wildlife', state: animal });
      const dealt = commitTravel(
        animal,
        journeyPads(animal).find((p) => /^Deal with/.test(p)) ?? 'Deal with the animal on the rocks',
      );
      if (dealt.handled && isJourneyUnderway(dealt.state)) {
        states.push({ tag: 'after-wildlife', state: dealt.state });
      }

      states.push({ tag: 'pending-threat', state: withParkedThreat(quietJ) });

      for (const row of states) {
        const offered = resolveOfferedChoices(row.state);
        chipsChecked += offered.length;
        holes.push(...assertJourneyMovers(row.state, offered, `${bible.id}:${dest}:${row.tag}`));
        const engines = new Set(engineChips(row.state).map((c) => c.label.toLowerCase()));
        for (const c of [...continueChips(offered), ...turnBackChips(offered)]) {
          const bare = c.replace(/,\s*but .+$/i, '').toLowerCase();
          if (!engines.has(c.toLowerCase()) && !engines.has(bare)) {
            holes.push(`${bible.id}:${dest}:${row.tag}:engineChips-missing:${c}`);
          }
        }
      }
    }

    expect(worlds, 'tabletop worlds').toBeGreaterThan(3);
    expect(placesChecked, 'places').toBeGreaterThan(3);
    expect(journeysChecked, 'journeys').toBeGreaterThan(0);
    expect(chipsChecked, 'chips').toBeGreaterThan(10);
    expect(seenStillroot.ok, 'Stillroot Veil must be checked').toBe(true);
    expect(seenMillstone.ok, 'Millstone Road must be checked').toBe(true);
    expect(holes, holes.join('\n') || 'ok').toEqual([]);
  });
});
