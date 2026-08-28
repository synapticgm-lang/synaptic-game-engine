import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Item } from './types';
import { validateActionHard, shouldSkipHardGate } from './actionValidation';
import { applyProseWarden, scrubInventedContainers } from './proseWarden';
import {
  buildBindingConstraints,
  detectConstraintViolations,
  formatBindingConstraintsForPrompt,
  repairConstraintViolations,
} from './bindingConstraints';
import { resolvePlayAreaMap } from './mapEngine';
import { INTERIOR_MAP_BLUEPRINT } from './placeAuthority';
import { formatSituationForPrompt } from './situationPacket';
import { runWarden } from './warden';
import { formatCampaignMemoryForPrompt } from './campaignMemory';

function item(name: string, extra: Partial<Item> = {}): Item {
  return { id: name, name, rarity: 'Common', quantity: 1, ...extra };
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  const initial = createInitialState('Gate Test', 'litrpg');
  return {
    ...initial,
    inventory: [item('Patched Leather Tunic', { equipped: true, itemType: 'armor' })],
    containers: [],
    companions: [],
    openingEstablishment: {
      complete: true,
      pending: [],
      answers: {},
      aloneArrival: false,
    },
    sceneFacts: {
      crowd: 'none',
      noise: 'quiet',
      present: [],
      props: [],
      lastBeat: '',
      updatedTurn: 1,
    },
    ...overrides,
  };
}

describe('validateActionHard', () => {
  it('blocks using an item that is not in inventory', () => {
    const state = baseState();
    const result = validateActionHard('I use my sword', state);
    expect(result.valid).toBe(false);
    expect(result.violations.join(' ')).toMatch(/don't have: sword/i);
  });

  it('does not block look-around', () => {
    const state = baseState();
    expect(shouldSkipHardGate('I look around', state)).toBe(true);
    const result = validateActionHard('I look around', state);
    expect(result.valid).toBe(true);
  });

  it('blocks a companion reference when none are present', () => {
    const state = baseState({ companions: [] });
    const result = validateActionHard('I ask my companion what they think', state);
    expect(result.valid).toBe(false);
    expect(result.violations.join(' ')).toMatch(/no companion/i);
  });

  it('blocks "the last box" when inventory and scene have no box', () => {
    const state = baseState();
    const result = validateActionHard('I open the last box', state);
    expect(result.valid).toBe(false);
    expect(result.violations.join(' ')).toMatch(/box/i);
  });

  it('allows "the last box" when a box is a scene prop', () => {
    const state = baseState({
      sceneFacts: {
        crowd: 'none',
        noise: 'quiet',
        present: [],
        props: ['wooden box'],
        lastBeat: '',
        updatedTurn: 1,
      },
    });
    const result = validateActionHard('I open the last box', state);
    expect(result.valid).toBe(true);
  });

  it('does not block room-layout or informational asks', () => {
    const state = baseState();
    expect(validateActionHard('are there any other doors or windows in the room', state).valid).toBe(true);
    expect(validateActionHard('info or option on the panel', state).valid).toBe(true);
  });
});

describe('scrubInventedContainers', () => {
  it('rewrites "the last box" when inventory and scene do not support it', () => {
    const cleaned = scrubInventedContainers('You open the last box on the floor.', []);
    expect(cleaned.toLowerCase()).not.toMatch(/last box/);
    expect(cleaned).toMatch(/the area/i);
  });

  it('keeps a crate mention when the player has a crate', () => {
    const cleaned = scrubInventedContainers(
      'You open the last crate.',
      [item('Supply Crate')],
    );
    expect(cleaned).toMatch(/the crate/i);
    expect(cleaned.toLowerCase()).not.toMatch(/last crate/);
  });

  it('keeps a box when it is a scene prop', () => {
    const viaWarden = applyProseWarden('You check the last box.', {
      inventory: [],
      sceneProps: ['oak box'],
    });
    expect(viaWarden).toMatch(/the box/i);
  });

  it('does not strip legal flair like musty oak or a rusted hinge', () => {
    const raw = 'Musty oak fills the chamber. A rusted hinge complains as you lean on the frame.';
    const cleaned = applyProseWarden(raw, { inventory: [], sceneProps: [] });
    expect(cleaned).toMatch(/musty oak/i);
    expect(cleaned).toMatch(/rusted hinge/i);
  });
});

describe('binding constraints', () => {
  it('lists interior exits and crowd binding', () => {
    const map = resolvePlayAreaMap(
      null,
      'alone in a building with serious damage somewhere off the Valespire roads',
      [],
      undefined,
      'constraint-exits',
    );
    expect(map?.blueprintId).toBe(INTERIOR_MAP_BLUEPRINT);

    const crowdState = baseState({
      sceneFacts: {
        crowd: 'present',
        noise: 'voices',
        present: ['Herald'],
        props: ['circle chalk'],
        lastBeat: '',
        updatedTurn: 1,
      },
    });
    const crowdText = formatBindingConstraintsForPrompt(buildBindingConstraints(crowdState));
    expect(crowdText).toMatch(/People are present in this scene/);
    expect(crowdText).toMatch(/### BINDING CONSTRAINTS \(AUTHORITY\)/);

    const interiorState = baseState({
      activeDungeon: map ?? undefined,
      openingEstablishment: {
        complete: true,
        pending: [],
        answers: {},
        aloneArrival: true,
      },
      sceneFacts: {
        crowd: 'none',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 1,
      },
    });
    const interiorText = formatBindingConstraintsForPrompt(buildBindingConstraints(interiorState));
    expect(interiorText).toMatch(/EXITS:/);
    expect(interiorText).toMatch(/do not invent extra doors/);
    expect(interiorText).toMatch(/PRESENCE: alone/);

    const packet = formatSituationForPrompt(interiorState);
    expect(packet).toMatch(/### SNAPSHOT/);
    expect(packet).not.toMatch(/### SCENE STATE/);
    expect(packet).not.toMatch(/### BINDING CONSTRAINTS/);
    expect((packet.match(/### SNAPSHOT/g) ?? []).length).toBe(1);
    expect((packet.match(/^- Crowd:/gm) ?? []).length).toBe(1);
    expect((packet.match(/^- Exits:/gm) ?? []).length).toBe(1);
    expect(packet).toMatch(/AUTHORITY:.*SNAPSHOT.*ledger/);
  });
});

describe('snapshot packet uniqueness', () => {
  it('emits one SNAPSHOT truth block instead of repeating crowd/exits', () => {
    const state = baseState({
      sceneFacts: {
        crowd: 'present',
        noise: 'voices',
        present: ['Herald'],
        props: ['circle chalk'],
        lastBeat: 'the circle holds',
        updatedTurn: 1,
        timeOfDay: 'dusk',
        weather: 'fog',
        indoor: true,
        tension: 'tense',
      },
    });
    const packet = formatSituationForPrompt(state);
    expect(packet).toMatch(/### SNAPSHOT/);
    expect((packet.match(/### SNAPSHOT/g) ?? []).length).toBe(1);
    expect(packet).not.toMatch(/SCENE FACTS \(AUTHORITY/);
    expect(packet).not.toMatch(/=== SCENE MANIFEST/);
    expect((packet.match(/^- Crowd:/gm) ?? []).length).toBe(1);
    expect((packet.match(/^- Exits:/gm) ?? []).length).toBe(1);
    expect(packet).toMatch(/narrative flair/);
  });
});

describe('hard gate last-story names', () => {
  it('does not block talking to a name from the last GM story', () => {
    const state = baseState();
    const result = validateActionHard(
      'I talk to Herald',
      state,
      'The Herald watches from the chalk circle. Musty oak hangs in the air.',
    );
    expect(result.valid).toBe(true);
  });

  it('still blocks talking to an ungrounded name not in the last story', () => {
    const result = validateActionHard(
      'I talk to Zorath',
      baseState(),
      'Dust hangs in the broken light.',
    );
    expect(result.valid).toBe(false);
    expect(result.violations.join(' ')).toMatch(/Zorath/);
  });
});

describe('detectConstraintViolations via runWarden', () => {
  it('is invoked and repairs factual contradictions without stripping flair', async () => {
    const state = baseState({
      sceneFacts: {
        crowd: 'present',
        noise: 'shouting',
        present: ['Herald'],
        props: [],
        lastBeat: '',
        updatedTurn: 1,
      },
    });
    const constraints = buildBindingConstraints(state);
    const raw = 'An eerie silence fills the hall. Musty oak and a rusted hinge hang in the air.';
    const hits = detectConstraintViolations(raw, constraints);
    expect(hits.length).toBeGreaterThan(0);

    const repaired = repairConstraintViolations(raw, constraints);
    expect(repaired).not.toMatch(/eerie silence/i);
    expect(repaired).toMatch(/musty oak/i);
    expect(repaired).toMatch(/rusted hinge/i);

    const result = await runWarden(state, [], raw, 'look around');
    expect(result.notes.some((n) => /constraint repair/i.test(n))).toBe(true);
    const prose = result.scrubbedNarrative ?? raw;
    expect(prose).toMatch(/musty oak/i);
    expect(prose).toMatch(/rusted hinge/i);
    expect(prose).not.toMatch(/eerie silence/i);
  });

  it('does not flag atmospheric abandoned-ruin language as a crowd violation', () => {
    const state = baseState({
      sceneFacts: {
        crowd: 'present',
        noise: 'voices',
        present: ['Herald'],
        props: [],
        lastBeat: '',
        updatedTurn: 1,
      },
    });
    const hits = detectConstraintViolations(
      'The abandoned ruin still smells of musty oak. A rusted hinge ticks.',
      buildBindingConstraints(state),
    );
    expect(hits.join(' ')).not.toMatch(/empty/i);
  });

  it('still scrubs an invented last box through the warden', async () => {
    const result = await runWarden(
      baseState(),
      [],
      'You open the last box. Musty oak and a rusted hinge fill the air.',
      'open the last box',
    );
    const prose = result.scrubbedNarrative ?? '';
    expect(prose.toLowerCase()).not.toMatch(/last box/);
    expect(prose).toMatch(/musty oak/i);
    expect(prose).toMatch(/rusted hinge/i);
  });
});

describe('campaign memory prompt budget', () => {
  it('keeps recent beats plus one arc line instead of dumping last 15 summaries', () => {
    const summaries = Array.from({ length: 18 }, (_, i) => ({
      id: `t${i + 1}`,
      turn: i + 1,
      text: `Beat number ${i + 1} happened.`,
    }));
    const state = baseState({
      campaignMemory: {
        campaignSummary: 'A ruined hall.',
        personalitySummary: 'Cautious.',
        turnSummaries: summaries,
        chapterSummaries: [],
        arcSummaries: [
          {
            id: 'arc1',
            turnRange: [1, 18] as [number, number],
            summary: 'The pact still holds.',
            majorMilestones: [],
            createdTurn: 18,
          },
        ],
        pins: [
          { id: 'p1', kind: 'player', label: 'Name', text: 'Jax', createdTurn: 1 },
        ],
        consequences: [],
      },
    });
    const text = formatCampaignMemoryForPrompt(state, 'SITUATION', 'xyzzy', 4000);
    expect(text).not.toMatch(/last 15, full detail/);
    expect(text).not.toMatch(/CHAPTER SUMMARIES \(last 5/);
    expect(text).toMatch(/=== RECENT BEATS ===/);
    expect(text).toMatch(/=== ARC ===/);
    expect(text).toMatch(/The pact still holds/);
    expect(text).not.toMatch(/T1: Beat number 1/);
    expect(text).toMatch(/T18: Beat number 18/);
  });
});
