/**
 * Batch 02h — surgical P0s from 02g-c2 Gemini + OWNER-MAP-02G-CYCLE1.
 * P0-1: travel starve at ≥2 in last 5 (West Wall ↔ Lowmarket).
 * P0-2: leave-family starve after ≥2 in last 4 (PYOA mill loop).
 * P0-3: CAST deny Fine / Don / traveler / Cup / Now / Somewhere.
 * P0-4: token-salad commit reject (Spine-free / mill-panel / litAwn).
 * P0-5: destroyed-charter clutched/coat + through-the-no-one crowd hole.
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { isChoicePadPersonToken } from './chromeAuthority';
import { scrubEntityMadLibs, scrubDestroyedPyoaItems } from './proseWarden';
import { classifyBeatCommit, isTokenSaladLeak, codedSceneMove } from './beatCommitGate';
import { normalizeCrowdRewriteArtifacts } from './crowdAuthority';
import { compileChoices } from './choiceCompiler';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

describe('Batch 02h stamps', () => {
  it('HUD and BUILD are at least 2026-09-02h and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02h').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02h').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02h — P0-1: travel yo-yo starve', () => {
  it('starves Travel toward after two travels in five picks even with talk between', () => {
    let state = createInitialState(undefined, 'litrpg');
    state = {
      ...state,
      openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
      currentLocation: 'West Wall',
      campaignBibleId: 'summoned-pact',
      turn: 43,
      log: [
        { id: 'a', role: 'player', content: 'Travel toward Lowmarket', timestamp: 1 },
        { id: 'b', role: 'gm', content: 'You reach Lowmarket.', timestamp: 2 },
        { id: 'c', role: 'player', content: 'Talk to Lowmarket Fence', timestamp: 3 },
        { id: 'd', role: 'gm', content: 'The fence waits.', timestamp: 4 },
        { id: 'e', role: 'player', content: 'Travel toward West Wall', timestamp: 5 },
        { id: 'f', role: 'gm', content: 'You reach West Wall.', timestamp: 6 },
      ],
      sceneFacts: { ...emptySceneFacts(43), present: ['Wall Sergeant'] },
    } as GameState;
    const compiled = compileChoices(
      state,
      [
        'Travel toward Lowmarket',
        'Walk the battlement',
        'Talk to Wall Sergeant',
        'Ask a direct question',
      ],
      undefined,
      'Travel toward West Wall'
    );
    expect(compiled.choices.filter((c) => /^Travel toward/i.test(c)).length).toBe(0);
  });
});

describe('Batch 02h — P0-2: leave-family starve', () => {
  it('drops Leave / Walk away after two leave-family picks', () => {
    let state = createInitialState(undefined, 'pyoa');
    state = {
      ...state,
      engineMode: 'pyoa',
      openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
      currentLocation: 'mill landing at Thornferry',
      campaignBibleId: 'thornferry-road',
      turn: 22,
      log: [
        { id: 'a', role: 'player', content: 'Leave through the nearest exit', timestamp: 1 },
        { id: 'b', role: 'gm', content: 'You step off the landing.', timestamp: 2 },
        { id: 'c', role: 'player', content: 'Walk away with consequence', timestamp: 3 },
        { id: 'd', role: 'gm', content: 'The mill stands behind you.', timestamp: 4 },
      ],
      sceneFacts: { ...emptySceneFacts(22), present: [] },
    } as GameState;
    const compiled = compileChoices(
      state,
      [
        'Leave through the nearest exit',
        'Walk away with consequence',
        'Ask a direct question',
        'Accept the ending that follows',
      ],
      undefined,
      'Walk away with consequence'
    );
    expect(compiled.choices.some((c) => /leave through|walk away|accept the ending/i.test(c))).toBe(false);
  });
});

describe('Batch 02h — P0-3: CAST deny growth', () => {
  it('denies Fine / Don / traveler / Cup / Now / Somewhere as person tokens', () => {
    expect(isChoicePadPersonToken('Fine')).toBe(true);
    expect(isChoicePadPersonToken('Don')).toBe(true);
    expect(isChoicePadPersonToken('traveler')).toBe(true);
    expect(isChoicePadPersonToken('Cup')).toBe(true);
    expect(isChoicePadPersonToken('Now')).toBe(true);
    expect(isChoicePadPersonToken('Somewhere')).toBe(true);
    expect(isChoicePadPersonToken('Jax')).toBe(false);
  });

  it('rewrites the Fine / Don / Cup / Now / traveler mad-libs', () => {
    expect(scrubEntityMadLibs('You raise your open the Fine, the universal sign.')).toMatch(/open your hands/);
    expect(scrubEntityMadLibs('brush-marked letters claiming the Fine')).not.toMatch(/\bthe Fine\b/);
    expect(scrubEntityMadLibs('the Don waits at the stall')).toMatch(/the vendor/);
    expect(scrubEntityMadLibs('Word moves fast. the Cup collect')).toMatch(/the inn/);
    expect(scrubEntityMadLibs('the Now hangs over the street')).toMatch(/the moment/);
    expect(scrubEntityMadLibs('the traveler steps closer')).toMatch(/someone nearby/);
    expect(scrubEntityMadLibs('you take Scattered Scale that gets you clear')).toMatch(/take the stair that/);
  });
});

describe('Batch 02h — P0-4: token-salad reject', () => {
  it('flags Spine-free / mill-panel / litAwn salad', () => {
    expect(isTokenSaladLeak('</=SYSTEM]: Spine-free—OUTCOME — then let me find the rain')).toBe(true);
    expect(isTokenSaladLeak('the Fine the Fine</litAwn_marker>—but beneath')).toBe(true);
    expect(isTokenSaladLeak('\\f=== A MILL AT the panel OF ARROW === then')).toBe(true);
    expect(isTokenSaladLeak('Rain drums the awning while the fence watches.')).toBe(false);
  });

  it('commit gate rejects token salad and stitches a scene move', () => {
    let state = createInitialState(undefined, 'rpg');
    state = {
      ...state,
      currentLocation: 'Lowmarket',
      campaignBibleId: 'summoned-pact',
      turn: 32,
      sceneFacts: { ...emptySceneFacts(32), present: ['Lowmarket Fence'] },
    } as GameState;
    const vomit = 'You leave The Weighing Cup behind and reach Lowmarket. </=SYSTEM]: Spine-free—OUTCOME';
    const gate = classifyBeatCommit(state, vomit);
    expect(gate.accept).toBe(false);
    expect(isTokenSaladLeak(codedSceneMove(state))).toBe(false);
  });
});

describe('Batch 02h — P0-5: charter clutched + crowd hole', () => {
  it('scrubs clutched / coat charter only when destroyed', () => {
    const held = 'You push through, the Millstone Charter still clutched in your hand.';
    expect(scrubDestroyedPyoaItems(held, [])).toMatch(/Millstone Charter still clutched/);
    const gone = scrubDestroyedPyoaItems(held, ['millstone-charter']);
    expect(gone).not.toMatch(/still clutched in your hand/i);
    expect(gone).toMatch(/space where the charter was/i);
    const coat = scrubDestroyedPyoaItems(
      'The Millstone Charter sits in your coat like a folded verdict.',
      ['millstone-charter']
    );
    expect(coat).not.toMatch(/sits in your coat/i);
  });

  it('rewrites through the no one', () => {
    const next = normalizeCrowdRewriteArtifacts('You push through the no one and make your way to the nearest exit.');
    expect(next).toMatch(/through the empty street/);
    expect(next).not.toMatch(/through the no one/);
  });
});
