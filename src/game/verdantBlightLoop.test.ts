/**
 * TRAINLOOP — hubless tabletop places must always offer a moving/advancing chip.
 * Sibling hole after FORDCAMP: exits were registered, but wayOutMovesPlayer / commitTravel
 * only resolved hub-bank destinations, so MOVE chips were dropped and the player stuck.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { enumerateLegalEdges } from './graphChoices';
import { hubsForBibleId } from './outdoorHubs';
import { placeExits } from './placeRegistry';
import { resolvePlace } from './places';
import { commitOfferedPad } from './playTranscript';
import {
  applyOptionCooldown,
  collectSceneAffordances,
  wayOutMovesPlayer,
} from './sceneAffordances';
import { engineChips, isLegalEnginePad } from './choicePipeline';
import { checkChipKinds } from './chipCheck';
import { commitTravel } from './travelJourney';
import { tabletopStepChip } from './tabletopQuestProgress';
import type { GameState, SceneFacts } from './types';

function openTabletop(bibleId: string, seed = 8106): GameState {
  const { state } = buildNewGameState({
    bibleId,
    characterName: 'Jax',
    seed,
    personality: 'chilled-gm',
    engineMode: 'dnd',
  });
  return stampOpening(state);
}

function finalPad(state: GameState): GameState {
  return commitOfferedPad({ ...state, offeredPad: null });
}

function advancingLabels(state: GameState, labels: string[]): string[] {
  const step = (tabletopStepChip(state) ?? '').trim().toLowerCase();
  const out: string[] = [];
  for (const label of labels) {
    if (!label) continue;
    if (wayOutMovesPlayer(state, label)) {
      out.push(label);
      continue;
    }
    if (step && label.trim().toLowerCase() === step) {
      out.push(label);
      continue;
    }
    // NPC-state-changing chips: agenda / follow-up / answer / talk with a named person.
    const low = label.toLowerCase();
    if (
      /^(?:ask|talk to|answer|follow up with|press|read)\b/i.test(label)
      || low.includes('follow up')
      || low.startsWith('answer ')
    ) {
      out.push(label);
    }
  }
  return out;
}

describe('TRAINLOOP hubless tabletop advancing chips', () => {
  it('every premade tabletop bible: opening pad has an advancing chip and no dead chips', () => {
    const holes: string[] = [];
    let worlds = 0;
    let placesChecked = 0;
    let chipsChecked = 0;
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (bible.engineMode !== 'dnd') continue;
      if (bible.id.startsWith('blank-canvas')) continue;
      worlds += 1;
      let opened: GameState;
      try {
        opened = openTabletop(bible.id);
      } catch (err) {
        holes.push(`${bible.id}:open-failed:${(err as Error).message ?? err}`);
        continue;
      }
      // Covers may still be pending on stampOpening — complete them so play pads (exits) are legal.
      const playReady: GameState = {
        ...opened,
        openingEstablishment: {
          ...(opened.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
          pending: [],
          complete: true,
          sceneWritten: true,
        },
      };
      const here = (playReady.currentLocation ?? '').trim();
      if (!here) {
        holes.push(`${bible.id}:no-HERE`);
        continue;
      }
      placesChecked += 1;
      const place = resolvePlace(playReady.places, here);
      // Closed / sealed opening cells (e.g. stillroot drowned chapel) are a separate
      // registration hole — report-only; this suite owns the open-exit → MOVE path.
      if (place?.closed || place?.arcStatus === 'closed') continue;
      const exits = placeExits(playReady, here);
      if (exits.length === 0) {
        holes.push(`${bible.id}:${here}:no-exits`);
        continue;
      }
      const padState = finalPad(playReady);
      const labels = padState.offeredPad?.choices ?? [];
      chipsChecked += labels.length;
      const dead = checkChipKinds(padState, labels).filter((f) => f.kind === 'dead-chip');
      for (const d of dead) {
        holes.push(`${bible.id}:${here}:dead-chip:${d.detail}`);
      }
      for (const label of labels) {
        if (!isLegalEnginePad(label, padState)) {
          holes.push(`${bible.id}:${here}:unbound-offered:${label}`);
        }
      }
      const advancing = advancingLabels(padState, labels);
      if (advancing.length === 0) {
        const moveAff = collectSceneAffordances(padState).filter((a) => a.slotKind === 'exit');
        const cooled = applyOptionCooldown(
          padState,
          engineChips(padState).map((c) => ({
            label: c.label,
            actionId: c.action,
            kind: c.kind,
            slotCategory: c.slotCategory,
            entityId: c.entityId,
          })),
        );
        const move = cooled.filter((c) => c.slotCategory === 'move').map((c) => c.label);
        holes.push(
          `${bible.id}:${here}:no-advancing-chip offered=[${labels.join(' | ')}] exits=[${exits.join(',')}] moveAff=[${moveAff.map((a) => a.label).join('|')}] cooledMove=[${move.join('|')}]`
        );
      }
    }
    expect(worlds, 'expected tabletop worlds').toBeGreaterThan(3);
    expect(placesChecked, 'expected places checked').toBeGreaterThan(3);
    expect(chipsChecked, 'expected chips checked').toBeGreaterThan(10);
    expect(holes, holes.join('\n') || 'ok').toEqual([]);
  });

  it('Verdant Blight seed 8106 Overgrown Station: Travel moves; quest/exit on pad; commit leaves', () => {
    expect(hubsForBibleId('verdant-blight')).toHaveLength(0);
    const opened = openTabletop('verdant-blight', 8106);
    expect(opened.currentLocation).toBe('Overgrown Station');
    const exits = placeExits(opened, 'Overgrown Station');
    expect(exits.length).toBeGreaterThan(0);
    expect(exits).toEqual(expect.arrayContaining(['Village Moot', 'Choked Shrine']));

    const playReady: GameState = {
      ...opened,
      openingEstablishment: {
        ...(opened.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
        pending: [],
        complete: true,
        sceneWritten: true,
      },
    };

    const travel = `Travel toward ${exits[0]}`;
    expect(wayOutMovesPlayer(playReady, travel), travel).toBe(true);
    const graphTravel = enumerateLegalEdges(playReady).filter((e) => e.type === 'travel');
    expect(graphTravel.length, 'graph travel edges from placeExitRows').toBeGreaterThan(0);

    const committed = commitTravel(playReady, travel);
    expect(committed.handled, 'commitTravel handled').toBe(true);
    expect(committed.state.currentLocation).not.toBe('Overgrown Station');

    const padState = finalPad(playReady);
    const labels = padState.offeredPad?.choices ?? [];
    expect(advancingLabels(padState, labels).length, `pad=${labels.join(' | ')}`).toBeGreaterThan(0);
    expect(labels.some((l) => wayOutMovesPlayer(padState, l)), `MOVE missing: ${labels.join(' | ')}`).toBe(true);
    expect(checkChipKinds(padState, labels).filter((f) => f.kind === 'dead-chip')).toEqual([]);
  });

  it('Verdant Blight: answered innkeep agenda follow-up is not the sole pad forever — exit stays', () => {
    const opened = openTabletop('verdant-blight', 8106);
    const playReady: GameState = {
      ...opened,
      openingEstablishment: {
        ...(opened.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
        pending: [],
        complete: true,
        sceneWritten: true,
      },
      // Simulate the mid-loop cast that kept re-offering the delivery agenda.
      sceneFacts: {
        present: ['the innkeep', 'Kaelen Moss'],
        crowd: 'sparse',
        noise: 'voices',
        props: [],
        lastBeat: opened.sceneFacts?.lastBeat ?? '',
        updatedTurn: opened.turn ?? 0,
        crowdCount: 2,
      } satisfies SceneFacts,
    };
    const padState = finalPad(playReady);
    const labels = padState.offeredPad?.choices ?? [];
    const followUps = labels.filter((l) => /follow up with the innkeep/i.test(l));
    const moves = labels.filter((l) => wayOutMovesPlayer(padState, l));
    expect(moves.length, `must keep an exit beside agenda chips; pad=${labels.join(' | ')}`).toBeGreaterThan(0);
    // Agenda may still appear once, but never alone without a way on.
    expect(followUps.length === 0 || moves.length > 0).toBe(true);
  });
});
