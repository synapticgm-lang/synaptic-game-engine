/**
 * s77 Root A — the turn has one list of names. The REF ENUM is it: hall talk narrows only at the opening
 * card before the first move, the writer binds by the enum's own token, the mention list and the warden's
 * manifest check read the same list, and the kill turn is the engine's settled fight being told.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { buildCompletedEventPacket, formatWriterFacingEvent, proseViolatesEventPacket } from './completedEventPacket';
import { normalizeBeatRefs, parseTokenBeat, renderTokenBeat, tokenLineVerdicts } from './tokenProse';
import { classifyBeatCommit } from './beatCommitGate';
import { findManifestInventions } from './sceneManifest';
import type { ActiveEncounter, GameState } from './types';

const BANDIT = 'Wardline Bandit';
const ROAD = 'the back streets from the cathedral infirmary toward Lowmarket';

function seed77(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 77, personality: 'cold-system' });
  return stampOpening(state);
}

function bandit(): ActiveEncounter {
  return {
    name: BANDIT,
    level: 1,
    hp: 16,
    maxHp: 16,
    armorClass: 11,
    strength: 11,
    dexterity: 12,
    constitution: 11,
    xpReward: 40,
    goldReward: 7,
    phase: 'engaged',
  };
}

/** Jax has left the card's place and stands on the road with the bandit live (the T17 turn). */
function onTheRoad(turn = 17): GameState {
  const s = seed77();
  const card = s.currentLocation!;
  return {
    ...s,
    turn,
    currentLocation: ROAD,
    openingEstablishment: { ...s.openingEstablishment!, complete: true },
    circling: { stale: {}, lastProgressTurn: turn - 1, lastLocation: ROAD, prevPlace: card, openingPlace: card },
    journey: {
      from: 'the cathedral infirmary',
      to: 'Lowmarket',
      ground: ROAD,
      terrain: 'streets',
      legsTotal: 2,
      legsDone: 1,
      hoursPerLeg: 1,
      startedTurn: turn - 3,
    },
    activeEncounter: bandit(),
  } as GameState;
}

describe('s77 Root A: one name list per turn', () => {
  it('a talk turn away from the card keeps the live foe on the REF ENUM and the mention list', () => {
    const packet = buildCompletedEventPacket(onTheRoad(), 'Refuse and keep your own counsel');
    expect(packet.refEnum?.some((r) => r.id === 'encounter:wardline-bandit' && r.display === BANDIT)).toBe(true);
    expect(packet.allowlist).toContain(BANDIT);
    expect(packet.allowlist).toEqual(expect.arrayContaining((packet.refEnum ?? []).map((r) => r.display)));
  });

  it('at the opening card before any move, hall talk still narrows (no kit); after a move it does not', () => {
    const s = seed77();
    const kit = (s.inventory ?? []).find((i) => i.equipped)?.name;
    expect(kit).toBeTruthy();
    const talk = buildCompletedEventPacket(s, 'Ask what they want');
    expect(talk.refEnum?.some((r) => r.klass === 'kit')).toBe(false);
    const look = buildCompletedEventPacket(s, 'Look around');
    expect(look.refEnum?.some((r) => r.klass === 'kit')).toBe(true);
    const away = buildCompletedEventPacket(onTheRoad(), 'Ask what they want');
    expect(away.refEnum?.some((r) => r.klass === 'kit')).toBe(true);
  });

  it('a reply that binds by the enum token alone paints the chirurgeons, and the shape names only enum tokens', () => {
    const s = seed77();
    const packet = buildCompletedEventPacket(s, 'Ask what they want');
    const refs = packet.refEnum ?? [];
    const chir = refs.find((r) => r.display === 'the field chirurgeons');
    expect(chir).toBeTruthy();
    const tok = chir!.tok;
    const raw = JSON.stringify({
      refs: [{ tok, use: 'speaker' }],
      lines: [
        { fn: 'action', text: 'Jax asked the healers what work they wanted done today.' },
        { fn: 'react', text: `@${tok} looked up from the cots and answered without any hurry.` },
      ],
    });
    const beat = parseTokenBeat(raw);
    expect(beat).toBeTruthy();
    const prose = renderTokenBeat(normalizeBeatRefs(beat!, refs), refs);
    expect(prose).toMatch(/field chirurgeons looked up/i);

    const facing = formatWriterFacingEvent(packet);
    const shape = facing.split('\n').find((l) => l.startsWith('{"refs":'))!;
    expect(shape).toBeTruthy();
    const enumToks = new Set(refs.map((r) => r.tok));
    const used = [...shape.matchAll(/"(?:speaker_)?tok":"(t\d+)"|@(t\d+)/g)].map((m) => m[1] ?? m[2]);
    expect(used.length).toBeGreaterThan(0);
    for (const t of used) expect(enumToks.has(t!), t).toBe(true);
    expect(shape).not.toContain('<id from REF ENUM>');
  });

  it('the T18 kill-turn prose reopens nothing, and the turn list names are not manifest inventions', () => {
    const killTurn: GameState = {
      ...onTheRoad(18),
      activeEncounter: null,
      sceneFacts: {
        ...seed77().sceneFacts!,
        present: [],
        lastKill: { name: BANDIT, outcome: 'victory', turn: 18, remains: true },
      },
    } as GameState;
    const t18 =
      'Jax pressed the attack and did not stop until the Wardline Bandit stopped moving on the stones between the cathedral infirmary and Lowmarket. The last hit landed hard and the Wardline Bandit went down and stayed down in the midday light. Jax stood over the body with bare hands and seven coins richer, and the road to Lowmarket still waited ahead.';
    const packet = buildCompletedEventPacket(killTurn, 'Press the attack');
    expect(packet.justKilled).toBe(true);
    expect(proseViolatesEventPacket(t18, packet)).toBe(false);
    const gate = classifyBeatCommit({ ...killTurn, completedEvent: packet } as GameState, t18, 'Press the attack');
    expect((gate.details ?? []).join('\n')).not.toMatch(/Reopens a closed fact/);
    expect(findManifestInventions(t18, { ...killTurn, completedEvent: packet } as GameState)).not.toContain(BANDIT);

    const lowmarket = { ...killTurn, turn: 19, currentLocation: 'Lowmarket', sceneFacts: { ...killTurn.sceneFacts!, lastKill: undefined } } as GameState;
    const t19 =
      'By midday Jax stood in Lowmarket, where the West Wall threw a hard shadow across the stalls. Jax kept their head down and walked on between the fences.';
    expect(findManifestInventions(t19, lowmarket)).not.toContain('West Wall');
    const s = seed77();
    const back = { ...s, turn: 7, circling: { stale: {}, lastProgressTurn: 6, lastLocation: s.currentLocation, prevPlace: ROAD, openingPlace: s.currentLocation } } as GameState;
    const t7 =
      'Jax turned from the infirmary doorway and walked back the way they came, down the cold stone steps toward West Wall.';
    expect(findManifestInventions(t7, back)).not.toContain('West Wall');
  });

  it('a replay of the T17 reply keeps the foe line: the bandit is a ref and no ref is unknown', () => {
    const state = onTheRoad();
    const packet = buildCompletedEventPacket(state, 'Refuse and keep your own counsel');
    expect(packet.refEnum?.some((r) => r.display === BANDIT)).toBe(true);
    const placeToks = (packet.refEnum ?? []).filter((r) => r.klass === 'place').map((r) => r.tok);
    expect(placeToks.length).toBeGreaterThanOrEqual(2);
    const raw = JSON.stringify({
      refs: [
        { tok: placeToks[0], id: 'the-cathedral-infirmary', use: 'place' },
        { tok: placeToks[1], id: 'lowmarket', use: 'place' },
      ],
      lines: [
        { fn: 'action', text: 'Jax looked at the man in the road and said nothing at all, then kept their hands low and their mouth shut.' },
        { fn: 'react', text: 'The Wardline Bandit waited for an answer that did not come, and his grin went thin and flat.' },
        { fn: 'hook', text: `The road to @${placeToks[1]} stayed open behind him, and the way back to @${placeToks[0]} stayed open too.` },
      ],
    });
    const verdicts = tokenLineVerdicts(raw, state, packet);
    expect(verdicts.filter((v) => /^ref (?:unknown|mismatch)/.test(v))).toEqual([]);
    expect(verdicts).toContain('react:ok');
    expect(verdicts).toContain('hook:ok');
  });
});
