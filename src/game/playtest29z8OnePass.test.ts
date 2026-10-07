/**
 * 29z8 — one writer pass per turn: the first draft is the beat, checks are logged, never re-asked.
 * The writer gets what it needs up front: nearby places as refs (exits, journey ends, the hook's town),
 * the card's "Who is here" as the cast, a speech line in the talk shape, and tags never leave holes.
 * Seed-68 play crimes stay tester checks. No live GM or judge call.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { createInitialState } from './defaults';
import { checkPlayCrimes } from './turnCheck';
import { hookTownName, nearbyPlaceNames, shortPlaceName } from './placeNames';
import { buildCompletedEventPacket, compileRefEnum, formatWriterFacingEvent } from './completedEventPacket';
import { openingCastLabel } from './openingEstablishment';
import { paintTokensOrDrop } from './tokenProse';
import { scrubSlotGlue } from './slotGlue';
import { isNeverCastTitle } from './neverCast';
import type { GameState, NpcMemory } from './types';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    seed: 'z8',
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Midnight Well',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [],
    npcMemories: [],
    companions: [],
    turn: 6,
    character: { ...s.character, name: 'Jax' },
    ...over,
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      complete: true,
      pickedHook: 'Location: Greyhollow well at midnight\nWho is here / who summoned: Father Aldous',
      ...(over.openingEstablishment ?? {}),
    } as GameState['openingEstablishment'],
    sceneFacts: { ...s.sceneFacts!, crowd: 'none', present: [], crowdCount: 0, ...(over.sceneFacts ?? {}) },
  };
}

const kinds = (r: { p0: { kind: string }[]; down: { kind: string }[] }) => [...r.p0, ...r.down].map((f) => f.kind);

describe('29z8 — stamp', () => {
  it('HUD/BUILD are 2026-10-07b', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-10-07b');
    expect(BUILD_STAMP).toBe('2026-10-07b');
  });
});

describe('29z8 — one writer pass', () => {
  it('the writer turn makes no call of its own; live and Fate pass no callWriter', () => {
    const shared = readFileSync(resolve(__dirname, './writerTurn.ts'), 'utf8');
    const live = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');
    const fate = readFileSync(resolve(__dirname, './fateAutoplay.ts'), 'utf8');
    for (const src of [shared, live, fate]) {
      expect(src).not.toMatch(/callWriter|allowRevision|formatWriterRevisionFacing|formatFreshReaskFacing|formatPlainProseFacing/);
    }
  });
});

describe('29z8 — the writer gets nearby places as refs', () => {
  it('the hook town is its own place, not HERE', () => {
    const s = base();
    expect(hookTownName(s)).toBe('Greyhollow');
    const refs = compileRefEnum(s);
    expect(refs.find((r) => r.id === 'here')?.display).toBe('Midnight Well');
    expect(refs.some((r) => r.klass === 'place' && r.display === 'Greyhollow')).toBe(true);
  });
  it('journey ends are places the writer may name', () => {
    const s = base({
      currentLocation: 'Back streets',
      journey: { from: 'Safehouse Alley', to: 'Salt Road Waystation', ground: 'Back streets' } as GameState['journey'],
    });
    expect(nearbyPlaceNames(s)).toEqual(expect.arrayContaining(['Safehouse Alley', 'Salt Road Waystation']));
  });
  it('an unknown description keeps its own words', () => {
    const d = 'a quiet orchard nobody has mapped';
    expect(shortPlaceName('cursed-keep', d)).toBe(d);
  });
});

describe('29z8 — the card names the cast; talk turns ask for spoken words', () => {
  it('"Who is here" on the card is the cast before any scene-word guess', () => {
    const s = base({
      engineMode: 'rpg',
      campaignBibleId: 'salt-road-heist',
      currentLocation: 'Safehouse Alley',
      openingEstablishment: { pickedHook: 'Location: a safehouse after a rehearsal gone loud\nWho is here / who summoned: the muscle' } as never,
    });
    expect(openingCastLabel(s)).toBe('the muscle');
  });
  it('a talk turn with someone here asks for their quoted words and reads "spoke to"', () => {
    const s = base();
    const packet = buildCompletedEventPacket(s, 'Who are you?');
    const facing = formatWriterFacingEvent({
      ...packet,
      verb: 'spoke',
      target: 'Father Aldous',
      refEnum: [...(packet.refEnum ?? []), { tok: 't9', id: 'cast:father-aldous', display: 'Father Aldous', klass: 'person' }],
    });
    expect(facing).toMatch(/Jax spoke to Father Aldous\./);
    expect(facing).toMatch(/"fn":"speech"/);
  });
});

describe('29z8 — open on what changed; a repeated question gets a new spoken line', () => {
  const withAldous = (over: Partial<ReturnType<typeof buildCompletedEventPacket>> = {}) => {
    const packet = buildCompletedEventPacket(base(), 'Who are you?');
    return {
      ...packet,
      refEnum: [...(packet.refEnum ?? []), { tok: 't9', id: 'cast:father-aldous', display: 'Father Aldous', klass: 'person' as const }],
      ...over,
    };
  };
  it('HERE already on the page and nobody moved: the shape has no place line', () => {
    const facing = formatWriterFacingEvent(withAldous({ recentBeats: ['Jax stood at the lip of Midnight Well.'], movement: undefined }));
    expect(facing).not.toMatch(/"fn":"place"/);
    expect(facing).toMatch(/Do not describe it again/);
  });
  it('a "No move this turn" packet is still nobody moved: no place line', () => {
    const facing = formatWriterFacingEvent(withAldous({
      recentBeats: ['Jax stood at the lip of Midnight Well.'],
      movement: 'No move this turn: at Midnight Well before and after. Do not narrate leaving, travelling or arriving.',
    }));
    expect(facing).not.toMatch(/"fn":"place"/);
    expect(facing).toMatch(/Do not describe it again/);
  });
  it('a move keeps the place line', () => {
    const facing = formatWriterFacingEvent(withAldous({
      recentBeats: ['Jax left the well.'],
      movement: 'Moved this turn: from Midnight Well to Greyhollow Inn. Narrate one arrival at Greyhollow Inn; nothing more happens at Midnight Well.',
    }));
    expect(facing).toMatch(/"fn":"place"/);
  });
  it('a second who asks for a new quoted line, not a report', () => {
    const first = formatWriterFacingEvent(withAldous({ talkTopic: 'who', talkAsked: 1 }));
    const again = formatWriterFacingEvent(withAldous({ talkTopic: 'who', talkAsked: 2 }));
    expect(first).toMatch(/"fn":"speech"/);
    expect(first).not.toMatch(/asked this before/);
    expect(again).toMatch(/asked this before/);
  });
});

describe('29z8 — a card role is a person, not a title or an object slot', () => {
  it('"the muscle blocking the doorway" keeps the muscle; a proper name in an object slot is still glue', () => {
    expect(scrubSlotGlue('They looked up at the muscle blocking the doorway.', ['the muscle', 'muscle'])).toBe(
      'They looked up at the muscle blocking the doorway.'
    );
    expect(scrubSlotGlue('She took the Wren lane home.', ['Wren'])).toBe('She took the lane home.');
  });
  it('card sentences do not make the cast a never-cast title; card proper names still are', () => {
    const s = base({
      openingEstablishment: {
        pickedHook: 'Location: a safehouse by the Sevenfold Circle\nWho is here / who summoned: the muscle\nWhy this happened: The muscle wants a name.',
      } as never,
    });
    expect(isNeverCastTitle('the muscle', s)).toBe(false);
    expect(isNeverCastTitle('Sevenfold Circle', s)).toBe(true);
  });
});

describe('29z8 — tags never leave holes', () => {
  it('a sentence with a tag nothing can paint is dropped whole', () => {
    const display = (tok: string) => (tok === 't1' ? 'Safehouse Alley' : undefined);
    const out = paintTokensOrDrop('Jax waited in @t1. Past the alley mouth @t5 kept its slow boots coming. The door stayed shut.', display);
    expect(out).toBe('Jax waited in Safehouse Alley. The door stayed shut.');
  });
});

describe('29z8 — play crimes stay tester checks', () => {
  it('flags the writer speaking for the player, a lecture ending and system words outside LitRPG', () => {
    const s = base();
    expect(kinds(checkPlayCrimes(s, s, 'Look around', '"We should go," Jax says, and the lamp gutters.'))).toContain('plays-player');
    expect(kinds(checkPlayCrimes(s, s, 'We should go now', '"We should go now," you say. The lamp gutters.'))).not.toContain('plays-player');
    expect(kinds(checkPlayCrimes(s, s, 'Wait', 'The well hums. You gain 10 XP. What do you do?'))).toEqual(
      expect.arrayContaining(['lecture-ending', 'wrong-voice'])
    );
  });
  it('flags a remembered person speaking when not here', () => {
    const aldous = { npcName: 'Father Aldous', aliases: [] } as unknown as NpcMemory;
    const s = base({ npcMemories: [aldous] });
    expect(kinds(checkPlayCrimes(s, s, 'Wait', 'Father Aldous says the bell will ring soon.'))).toContain('absent-speaker');
  });
});
