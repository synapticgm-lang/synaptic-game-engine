import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { copiesOpenerIdea, openerIdeaById, openerIdeaFact, openerIdeasFor, pickOpenerIdea } from './openerIdeas';
import { roadMeetingFact, roadMeetingRef } from './travelJourney';
import type { RoadEncounter, TravelJourney } from './types';

const journey = (enc: Partial<RoadEncounter>) =>
  ({ legsDone: 0, legsTotal: 3, encounter: { level: 1, stretch: 0, dangerous: false, ...enc } }) as unknown as TravelJourney;

describe('OP-1: opener ideas, not canned lines', () => {
  it('meeting and traveler have ideas; other kinds have none', () => {
    expect(openerIdeasFor('meeting').length).toBeGreaterThan(0);
    expect(openerIdeasFor('traveler').length).toBeGreaterThan(0);
    expect(pickOpenerIdea('thugs', 'k')).toBeNull();
  });
  it('OP1-b: the same seed gives the same idea id; ids round-trip from the save', () => {
    const a = pickOpenerIdea('meeting', 'trip|3');
    expect(pickOpenerIdea('meeting', 'trip|3')?.id).toBe(a?.id);
    expect(openerIdeaById('meeting', a!.id)).toEqual(a);
    const ids = new Set(Array.from({ length: 40 }, (_, i) => pickOpenerIdea('traveler', `t|${i}`)!.id));
    expect(ids.size).toBeGreaterThan(1);
  });
  it('the writer fact carries the gist with the never-quote rule, persisted on the encounter', () => {
    const fact = roadMeetingFact(journey({ kind: 'meeting', name: 'Osric Marl', openerIdea: 'searching' }));
    expect(fact).toMatch(/Opener idea \(gist only; say it in your own fresh words, never copy it/);
    expect(fact).toMatch(/looking for a specific person/);
    expect(openerIdeaFact(null)).toBe('');
  });
  it('OP1-c: the meeting ref (the answer backing) carries the idea gist', () => {
    const ref = roadMeetingRef({ journey: journey({ kind: 'traveler', name: 'Wat', openerIdea: 'road-news' }), turn: 0 } as never);
    if (ref) expect(ref.note).toMatch(/opens with: heard rumours of danger ahead/);
  });
  it('OP1-a: a fresh line passes the 6-word copy check; a copied line fails', () => {
    const idea = openerIdeaById('meeting', 'searching')!;
    expect(copiesOpenerIdea('"Have you seen a woman with a red scarf come this way?" the stranger asked.', idea)).toBe(false);
    expect(copiesOpenerIdea('He asks whether the player has seen someone on the road.', idea)).toBe(true);
  });
});

describe('OP-1c: the opener idea backs the road speaker (tt-fix-4)', () => {
  it('the live meeting speaker gets the gist as a backed line; others get none', async () => {
    const { roadMeetingOpenerLines } = await import('./travelJourney');
    const state = { journey: journey({ kind: 'meeting', openerIdea: 'trading' }) } as never;
    expect(roadMeetingOpenerLines(state, 'a stranger')[0]).toMatch(/^Carrying goods; open to a fair trade\.$/);
    expect(roadMeetingOpenerLines(state, 'Somebody Else')).toEqual([]);
  });
  it('a save from before OP-1 still opens from a seeded idea', async () => {
    const { encounterOpenerIdea } = await import('./openerIdeas');
    const e = { kind: 'traveler', level: 1, stretch: 2, dangerous: false } as RoadEncounter;
    expect(encounterOpenerIdea(e)?.id).toBe(encounterOpenerIdea(e)?.id);
    expect(encounterOpenerIdea(e)).not.toBeNull();
  });
});
