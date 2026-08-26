import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyProseWarden,
  scrubInventedAlonePresence,
  scrubInteriorOneRoomLie,
} from './proseWarden';
import {
  buildInteriorFloorPlan,
  formatInteriorExploreAuthority,
  listInteriorExitsFromHere,
  resolveInteriorEdgeKind,
} from './mapEngine';
import { inventsPresenceOnEmptyScene, sceneSafeFallbacks } from './choicePipeline';
import { suppressNoOpStatusEcho, dedupeQuestStatusEcho, filterSystemLogForEngine } from './systemLog';
import { compileSceneManifest, formatSceneManifestForPrompt } from './sceneManifest';

const ALONE_RUIN =
  'a damaged building off the Valespire roads — Second Chamber of a half-collapsed ruin';

describe('20r map-authority explore + alone presence + status dedupe', () => {
  it('scrubs invent-crowd lines on alone arrival', () => {
    const raw =
      'Dust hangs in the broken light. You\'re not alone… A handful of people have gathered near the broken far wall — the ones who saw you arrive. The rubble still smells of ash.';
    const scrubbed = scrubInventedAlonePresence(raw, true);
    expect(scrubbed).not.toMatch(/not alone/i);
    expect(scrubbed).not.toMatch(/handful of people/i);
    expect(scrubbed).not.toMatch(/saw you arrive/i);
    expect(scrubbed).toMatch(/dust|rubble|ash/i);

    const viaWarden = applyProseWarden(raw, { aloneArrival: true });
    expect(viaWarden).not.toMatch(/saw you arrive/i);
  });

  it('blocks alone choices that invent watchers who saw you arrive', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg');
    state.openingEstablishment = {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      registrar: { voice: 'inworld', label: 'THE CIRCLE', startLine: 'Light.' },
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
    };
    expect(
      inventsPresenceOnEmptyScene('Ask the people who saw you arrive', state, 'Dust. Silence.')
    ).toBe(true);
    expect(inventsPresenceOnEmptyScene('Search the Entry carefully', state, 'Dust. Silence.')).toBe(
      false
    );
  });

  it('interior explore authority names door→adjacent room when graph has normal links', () => {
    const map = buildInteriorFloorPlan(ALONE_RUIN, [], undefined, 'door-edge-seed');
    const entry = map.nodes.find((n) => (n.tags ?? []).includes('entry'))!;
    const withHere = { ...map, currentNodeId: entry.id };
    const exits = listInteriorExitsFromHere(withHere);
    expect(exits.length).toBeGreaterThan(0);
    const door = exits.find((e) => e.kind === 'door');
    expect(door).toBeTruthy();
    const auth = formatInteriorExploreAuthority(withHere);
    expect(auth).toMatch(/doorway→/i);
    expect(auth).toMatch(/EXPLORE AUTHORITY/i);
    expect(auth).toMatch(/Do NOT claim this is one open room/i);
    expect(auth).toMatch(new RegExp(door!.name, 'i'));

    const peer = map.nodes.find((n) => n.id === entry.connections.find((id) => {
      const t = map.nodes.find((x) => x.id === id);
      return t && resolveInteriorEdgeKind(entry, t) === 'door';
    }))!;
    expect(peer).toBeTruthy();
  });

  it('scrubs one-room / only-gap lies when mapped doors exist', () => {
    const raw =
      'There is only one open room left. No doors intact. No hallways — only a gap in the wall. Dust motes drift.';
    const scrubbed = scrubInteriorOneRoomLie(raw, true, ['Hall', 'Side Chamber']);
    expect(scrubbed).not.toMatch(/only one open room/i);
    expect(scrubbed).not.toMatch(/No doors intact/i);
    expect(scrubbed).toMatch(/Doorways and corridors|Hall|Side Chamber|Dust/i);
  });

  it('alone scene manifest forces crowd none and includes explore authority', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg');
    state.openingEstablishment = {
      pending: [],
      answers: {},
      complete: true,
      registrar: { voice: 'inworld', label: 'THE CIRCLE', startLine: 'Light.' },
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
    };
    state.currentLocation = ALONE_RUIN;
    state.activeDungeon = buildInteriorFloorPlan(ALONE_RUIN, [], undefined, 'manifest-seed');
    state.sceneFacts = {
      crowd: 'present',
      noise: 'voices',
      props: [],
      present: ['bystanders'],
      lastBeat: 'arrival',
    };
    const m = compileSceneManifest(state);
    expect(m.crowd).toBe('none');
    expect(m.noise).toBe('quiet');
    expect(m.roster.every((r) => !/bystander/i.test(r))).toBe(true);
    const prompt = formatSceneManifestForPrompt(state);
    expect(prompt).toMatch(/ALONE ARRIVAL/i);
    expect(prompt).toMatch(/EXPLORE AUTHORITY|doorway→/i);
  });

  it('alone fallbacks prefer mapped doorway when interior graph exists', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg');
    state.openingEstablishment = {
      pending: [],
      answers: {},
      complete: true,
      registrar: { voice: 'inworld', label: 'THE CIRCLE', startLine: 'Light.' },
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
    };
    state.activeDungeon = buildInteriorFloorPlan(ALONE_RUIN, [], undefined, 'fallback-door-seed');
    const pads = sceneSafeFallbacks(state, 'Dust. Nothing moves.');
    expect(pads.every((c) => !/crowd|voices|saw you/i.test(c))).toBe(true);
    expect(pads.some((c) => /doorway|stairs|Approach the/i.test(c))).toBe(true);
  });

  it('suppresses no-op Location + Quest Focus status echo', () => {
    const lines = suppressNoOpStatusEcho(
      ['Location: Entry', 'Quest Focus: exploring the ruin', 'XP Gained: 5'],
      { location: 'Entry', questFocus: 'exploring the ruin' }
    );
    expect(lines).toEqual(['XP Gained: 5']);

    const onlyEcho = suppressNoOpStatusEcho(
      ['Location: Entry', 'Quest Focus: exploring the ruin'],
      { location: 'Entry', questFocus: 'exploring the ruin' }
    );
    expect(onlyEcho).toEqual([]);

    const kept = suppressNoOpStatusEcho(
      ['Location: Hall', 'Quest Focus: exploring the ruin'],
      { location: 'Entry', questFocus: 'exploring the ruin' }
    );
    expect(kept).toContain('Location: Hall');
    expect(kept).not.toContain('Quest Focus: exploring the ruin');

    const questLines = dedupeQuestStatusEcho([
      'Quest Focus: exploring the ruin',
      'Quest Unlocked: exploring the ruin',
    ]);
    expect(questLines).toHaveLength(1);
  });

  it('hides empty STATUS filler (no XP/loot noise)', () => {
    expect(
      filterSystemLogForEngine(['No XP or loot changes this turn.'], 'litrpg')
    ).toEqual([]);
    expect(
      filterSystemLogForEngine(
        ['No XP or loot changes this turn.', 'XP Gained: 12', 'Loot: iron nail'],
        'litrpg'
      )
    ).toEqual(['XP Gained: 12', 'Loot: iron nail']);
  });
});
