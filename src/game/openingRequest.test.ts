/**
 * Brief 05 — page 1 uses a dedicated opening request, never a completed-event packet.
 * Ledger H7 / H6 / H4: fix framing; no hidden retry; person-read live check is acceptance.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { attachOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import { buildOpeningRequest, formatOpeningRequest } from './openingRequest';
import { buildContextPrompt, buildFactLeafSystemPrompt } from './masterPrompt';
import { isUnwrittenLiveOpening } from './openingWriterNotes';
import type { GameState, Settings } from './types';

const hook: OpeningHookSnapshot = {
  place: { id: 'req-ash-trail', kind: 'trail' },
  cast: [
    { id: 'req-cast-oren', role: 'priest', pronouns: 'he/him', durability: 'durable' },
    { id: 'req-cast-kessa', role: 'tracker', pronouns: 'she/her', durability: 'durable' },
  ],
  offer: {
    items: [
      { id: 'req-water', label: 'waterskin', carryable: true },
      { id: 'req-scarf', label: 'scarf', carryable: true },
    ],
  },
  rite: { steps: [{ id: 'req-rite-name', label: 'Give a name' }] },
  beatOrder: ['wake', 'offer'],
  location: 'the ash-heat of a trail',
  whoHere: 'a priest and a tracker',
  openingOffer: 'a waterskin and a scarf',
  page1: 'Heat rises. You are on your back on the trail.',
};

function unwrittenOpening(name = 'Jax'): GameState {
  const base = {
    ...createInitialState('The Summoned Pact', 'litrpg'),
    seed: 'opening-request-1',
    campaignBibleId: 'summoned-pact',
    character: {
      ...createInitialState('The Summoned Pact', 'litrpg').character,
      name,
    },
  };
  const attached = attachOpeningInstance(base, hook, hook.page1);
  return {
    ...attached,
    openingEstablishment: {
      ...attached.openingEstablishment!,
      sceneWritten: false,
      pickedHookId: hook.place!.id,
      castNpcIds: hook.cast!.map((c) => c.id),
    },
  };
}

describe('openingRequest (brief 05)', () => {
  it('builds PC name, place id, cast ids and voice rails with no completed-event framing', () => {
    const state = unwrittenOpening('Sam');
    expect(isUnwrittenLiveOpening(state)).toBe(true);
    const req = buildOpeningRequest(state, 'second-person');
    expect(req).not.toBeNull();
    if (!req) return;
    expect(req.kind).toBe('opening-page-1');
    expect(req.pcName).toBe('Sam');
    expect(req.placeId).toBe('req-ash-trail');
    expect(req.placeName).toBeTruthy();
    expect(req.cast.map((c) => c.id)).toEqual(['req-cast-oren', 'req-cast-kessa']);
    expect(req.cast.every((c) => c.name && c.role)).toBe(true);
    expect(req.perspective).toBe('second-person');
    expect(req.optionCount).toBe(4);

    const text = formatOpeningRequest(req);
    expect(text).toMatch(/OPENING PAGE 1/i);
    expect(text).toMatch(/has not acted yet|Write the first page/i);
    expect(text).not.toMatch(/Narrate this completed event/i);
    expect(text).not.toMatch(/COMPLETED EVENT:/i);
    expect(text).not.toMatch(/\bPLAYER\/ACTION\b/);
    expect(text).toContain(req.placeName);
    expect(text).toContain(req.cast[0]!.name);
    expect(text).toContain('req-cast-oren');
    expect(text).toContain('req-ash-trail');
  });

  it('buildContextPrompt for an unwritten opening never frames a completed turn', () => {
    const state = unwrittenOpening('Sam');
    const text = buildContextPrompt(state, '(opening)', [], 'second-person');
    expect(text).toMatch(/OPENING PAGE 1/i);
    expect(text).not.toMatch(/Narrate this completed event/i);
    expect(text).not.toMatch(/COMPLETED EVENT:/i);
    expect(text).toContain(state.character.name);
    expect(text).toContain(state.openingEstablishment!.instance!.placeName);
  });

  it('system prompt does not duplicate the page-1 packet while the user leaf owns it', () => {
    const state = unwrittenOpening('Sam');
    const system = buildFactLeafSystemPrompt(state, { perspective: 'second-person' } as Settings);
    const user = buildContextPrompt(state, '(opening)', [], 'second-person');
    expect(user).toMatch(/OPENING PAGE 1/i);
    expect(system).not.toMatch(/OPENING PAGE 1/i);
  });

  it('after sceneWritten, buildContextPrompt uses the ordinary completed-event path again', () => {
    const state = {
      ...unwrittenOpening('Sam'),
      openingEstablishment: {
        ...unwrittenOpening('Sam').openingEstablishment!,
        sceneWritten: true,
        sceneProse: 'The trail held.',
      },
    };
    // Without a completedEvent, the ordinary path still builds one — and that framing is expected after page 1.
    const text = buildContextPrompt(state, 'Look around', [], 'second-person');
    expect(text).toMatch(/Narrate this completed event|COMPLETED EVENT:/i);
  });
});
