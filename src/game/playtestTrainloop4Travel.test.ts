/**
 * TRAINLOOP4 B — Travel chips must use registry place names and only be offered
 * when the travel engine can resolve the destination from HERE.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { commitOfferedPad } from './playTranscript';
import { collectSceneAffordances, wayOutMovesPlayer } from './sceneAffordances';
import { travelDestFromChip } from './director';
import { canonicalTravelDest } from './placeRegistry';
import { commitTravel } from './travelJourney';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

function openWorld(bibleId: string, seed = 8112): GameState {
  const bible = ALL_CAMPAIGN_BIBLES.find((b) => b.id === bibleId);
  const mode = bible?.engineMode ?? 'dnd';
  const { state } = buildNewGameState({
    bibleId,
    characterName: 'Jax',
    seed,
    personality: 'chilled-gm',
    engineMode: mode,
  });
  return stampOpening(state);
}

function travelChips(state: GameState): { label: string; actionId: string }[] {
  return collectSceneAffordances(state)
    .filter((a) => a.slotKind === 'exit' || /^Travel\b/i.test(a.label))
    .map((a) => ({ label: a.label, actionId: a.actionId }));
}

describe('TRAINLOOP4 B — Travel chip registry labels', () => {
  it('quest-description placeId never becomes a Travel label; registry name is used', () => {
    const s = createInitialState(undefined, 'dnd') as GameState;
    const state: GameState = {
      ...s,
      engineMode: 'dnd',
      campaignBibleId: 'verdant-blight',
      currentLocation: 'Overgrown Station',
      openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
      places: [
        {
          id: 'place_overgrown-station',
          name: 'Overgrown Station',
          exits: ['Village Moot', 'Choked Shrine'],
          lastVisitedTurn: 18,
        },
        { id: 'place_village-moot', name: 'Village Moot', aliases: ['Village Moot'] },
        {
          id: 'place_the-village-moot-about-the-blight',
          name: 'the village moot about the blight',
          exits: ['Overgrown Station'],
        },
      ],
      quests: [
        {
          id: 'gen-lgm-cult-signs-2',
          name: "Baroness Mirelle's charge",
          description: 'cult signs',
          status: 'active',
          type: 'side',
          revealed: true,
          location: 'the village moot about the blight',
          leadsTo: 'the village moot about the blight',
          objectives: [
            {
              id: 'obj-2',
              description: 'Study the signs at the village moot about the blight',
              completed: false,
              placeId: 'the village moot about the blight',
              routes: [
                {
                  id: 'r-place',
                  kind: 'place',
                  label: 'Search the village moot about the blight for signs',
                  entityId: 'place:the village moot about the blight',
                  placeId: 'the village moot about the blight',
                },
              ],
            },
          ],
        },
      ],
      sceneFacts: { ...emptySceneFacts(18), present: [] },
    };
    const chips = travelChips(state);
    const bad = chips.filter((c) => /moot about the blight/i.test(c.label));
    expect(
      bad,
      `verdant-blight:Overgrown Station: description Travel chips=${bad.map((c) => `${c.actionId}:${c.label}`).join(' | ')}`,
    ).toEqual([]);
    const good = chips.filter((c) => /^Travel toward Village Moot$/i.test(c.label));
    expect(
      good.length > 0,
      `verdant-blight:Overgrown Station: missing registry Travel chip offered=[${chips.map((c) => c.label).join(' | ')}]`,
    ).toBe(true);
    for (const c of chips) {
      const dest = travelDestFromChip(c.label);
      if (!dest) continue;
      expect(
        wayOutMovesPlayer(state, c.label),
        `verdant-blight:Overgrown Station: unreachable Travel ${c.actionId}:${c.label}`,
      ).toBe(true);
      const moved = commitTravel(state, c.label);
      expect(
        moved.handled || moved.arrived || (moved.state.currentLocation ?? '') !== state.currentLocation,
        `verdant-blight:Overgrown Station: travel engine cannot resolve ${c.actionId}:${c.label}`,
      ).toBe(true);
    }
  });

  it('sweep: every premade world opening Travel chip label equals registry name and resolves', () => {
    const holes: string[] = [];
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (bible.id.startsWith('blank-canvas')) continue;
      if (bible.engineMode === 'pyoa') continue;
      let opened: GameState;
      try {
        opened = openWorld(bible.id);
      } catch (err) {
        holes.push(`${bible.id}:open-failed:${(err as Error).message ?? err}`);
        continue;
      }
      const padState = commitOfferedPad({ ...opened, offeredPad: null });
      const here = padState.currentLocation ?? '(no-loc)';
      const chips = travelChips(padState);
      for (const c of chips) {
        const dest = travelDestFromChip(c.label);
        if (!dest) continue;
        if (` ${dest.toLowerCase()} `.includes(' about ')) {
          holes.push(`${bible.id}:${here}:lead-copy-label:${c.actionId}:${c.label}`);
          continue;
        }
        const reg = canonicalTravelDest(padState, dest);
        // Hubless story exits may keep their exit label when no shorter registry name maps.
        if (reg && reg.toLowerCase() !== dest.toLowerCase()) {
          holes.push(`${bible.id}:${here}:label-not-registry:${c.actionId}:${c.label}≠${reg}`);
          continue;
        }
        const hereCanon = (canonicalTravelDest(padState, here) ?? here).toLowerCase();
        if (dest.toLowerCase() === here.toLowerCase() || dest.toLowerCase() === hereCanon) {
          holes.push(`${bible.id}:${here}:travel-to-here:${c.actionId}:${c.label}`);
        }
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  });
});
