import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { scrubInventedProperNouns, scrubOfficialPlaceholder } from './narrativeScrub';
import { applyProseWarden } from './proseWarden';
import type { GameState } from './types';

/** t50-29z8 seed 69 salt-road-heist: Jax and Vessa in the back streets. The writer drafts were clean. */
function backStreets(withVessa = true): GameState {
  const s = createInitialState();
  s.campaignBibleId = 'salt-road-heist';
  s.engineMode = 'rpg';
  s.currentLocation = 'Back streets';
  s.character = { ...s.character, name: 'Jax' };
  s.openingEstablishment = { pending: [], answers: {}, complete: true, sceneWritten: true } as never;
  s.npcMemories = withVessa
    ? ([{ npcId: 'vessa', npcName: 'Vessa', aliases: [], disposition: 'neutral', facts: [], lastSeenTurn: 1, location: 'Back streets' }] as never)
    : [];
  s.sceneFacts = { props: [], present: withVessa ? ['Vessa'] : [], crowd: withVessa ? 'present' : 'none', noise: 'quiet', lastBeat: '', updatedTurn: 1 };
  return s;
}

/** The scrub order after the writer: invented-name slot, prose warden, placeholder pass. */
function scrubbed(line: string, state: GameState): string {
  const present = (state.sceneFacts?.present ?? []) as string[];
  const inv = scrubInventedProperNouns(line, state).text;
  const pw = applyProseWarden(inv, { currentLocation: state.currentLocation, presentNames: present, ledgerState: state } as never);
  return scrubOfficialPlaceholder(pw, state);
}

const LIVE = {
  loneFigure: 'Halfway down the lane a lone figure passed them going the other way, cloak pulled tight.',
  figureErrand: 'Halfway down the quiet stretch, a figure on their own errand crossed the lane ahead and did not look up.',
  portCrescent: '"Port Crescent," Vessa said, falling in beside Jax without being asked.',
  ahead: 'Ahead, the lane bent toward Back streets, and somewhere past it the road ran down to the water where the lamps were already lit.',
  named: 'Jax named their price without touching the keys.',
  traveler: 'The traveler looked Jax over once, unhurried, and said the way was open.',
};

describe('scrub keeps the writer’s people and words (t50-29z8 seed 69)', () => {
  it('"a lone figure" stays, with Vessa here and with nobody here', () => {
    expect(scrubbed(LIVE.loneFigure, backStreets(true))).toBe(LIVE.loneFigure);
    expect(scrubbed(LIVE.loneFigure, backStreets(false))).toBe(LIVE.loneFigure);
  });

  it('"a figure on their own errand" is not turned into Vessa', () => {
    const out = scrubbed(LIVE.figureErrand, backStreets(true));
    expect(out).toBe(LIVE.figureErrand);
    expect(out).not.toMatch(/Vessa/);
  });

  it('"Port Crescent" is left as written, never "the Vessa"', () => {
    const out = scrubInventedProperNouns(LIVE.portCrescent, backStreets(true)).text;
    expect(out).toBe(LIVE.portCrescent);
    expect(scrubbed(LIVE.portCrescent, backStreets(true))).not.toMatch(/the Vessa/);
  });

  it('sentence-initial "Ahead," is not a person', () => {
    expect(scrubbed(LIVE.ahead, backStreets(true))).toBe(LIVE.ahead);
  });

  it('"named their price" is a verb, not a name', () => {
    expect(scrubbed(LIVE.named, backStreets(true))).toBe(LIVE.named);
  });

  it('"the traveler" stays a traveler', () => {
    expect(scrubbed(LIVE.traveler, backStreets(true))).toBe(LIVE.traveler);
  });
});
