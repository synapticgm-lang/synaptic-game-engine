/**
 * XP-D1 OPEN — LitRPG Opening Rite coverage.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { createInitialState } from './defaults';
import { pinStoryChipInTop } from './choiceRanking';
import { compileChoices } from './choiceCompiler';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { buildLitrpgSystemWindow, shouldAttachLitrpgSystemWindow } from './litrpgSystemWindow';
import { levelBar } from './rules/xpPace';
import { applyCharacterXpGain } from './characterXp';
import { milestoneXp } from './xpRules';
import {
  OPENING_RITE_TABLE,
  authoredOpeningRite,
  fallbackOpeningRite,
  resolveOpeningRiteEntry,
} from './openingRiteTable';
import {
  applyOpeningRiteTurn,
  classifyOpeningRiteInput,
  ensureOpeningRite,
  openingRiteAcceptChip,
  openingRiteXpFill,
  pickQuestProfileChoice,
  pinOpeningRiteChip,
} from './openingRite';
import type { GameState } from './types';

const litrpgBibles = ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'litrpg');

function litrpgState(bibleId = 'summoned-pact', over: Partial<GameState> = {}): GameState {
  const s = createInitialState('Open', 'litrpg') as GameState;
  return ensureOpeningRite({
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: bibleId,
    character: { ...s.character!, name: 'Jax', level: 1, xp: 0, xpToNext: 150 },
    turn: 1,
    ...over,
  } as GameState);
}

describe('XP-D1 OPEN table coverage', () => {
  it('every LitRPG scenario id has an authored entry or a valid fallback', () => {
    expect(litrpgBibles.length).toBeGreaterThanOrEqual(11);
    for (const bible of litrpgBibles) {
      const entry = resolveOpeningRiteEntry(bible);
      expect(entry, bible.id).toBeTruthy();
      expect(entry!.scenarioId).toBe(bible.id);
      expect(entry!.giver.trim().length).toBeGreaterThan(0);
      expect(entry!.title.trim().length).toBeGreaterThan(0);
      expect(entry!.offerSentence.trim().length).toBeGreaterThan(0);
      expect(entry!.acceptChip.trim().length).toBeGreaterThan(0);
      expect(entry!.completionLine).toMatch(/Level 2/i);
      expect(entry!.forcedLine).toMatch(/Level 2/i);
      // Authored rows cover the known catalog; blank unknown still falls back.
      if (authoredOpeningRite(bible.id)) {
        expect(OPENING_RITE_TABLE.some((e) => e.scenarioId === bible.id)).toBe(true);
      } else {
        expect(fallbackOpeningRite(bible)?.scenarioId).toBe(bible.id);
      }
    }
  });

  it('fallback is null for non-LitRPG', () => {
    expect(fallbackOpeningRite({ id: 'cursed-keep', title: 'CK', engineMode: 'dnd', keyNPCs: [] })).toBeNull();
    expect(resolveOpeningRiteEntry({ id: 'salt-road-heist', title: 'Salt', engineMode: 'rpg', keyNPCs: [] })).toBeNull();
  });
});

describe('XP-D1 OPEN classifier', () => {
  const entry = authoredOpeningRite('summoned-pact')!;

  it('accepts chip and free-text positives', () => {
    expect(classifyOpeningRiteInput('Sign the pact', entry)).toBe('accept');
    expect(classifyOpeningRiteInput('yes', entry)).toBe('accept');
    expect(classifyOpeningRiteInput('I accept', entry)).toBe('accept');
    expect(classifyOpeningRiteInput("I'll do it", entry)).toBe('accept');
    expect(classifyOpeningRiteInput('sign the pact', entry)).toBe('accept');
    expect(classifyOpeningRiteInput('My name is Jax', entry)).toBe('accept');
    expect(classifyOpeningRiteInput('here is my name', entry)).toBe('accept');
    expect(classifyOpeningRiteInput('register', entry)).toBe('accept');
    expect(classifyOpeningRiteInput('take the oath', entry)).toBe('accept');
    expect(classifyOpeningRiteInput('I agree', entry)).toBe('accept');
  });

  it('refuses bare no / refuse / attack summoner', () => {
    expect(classifyOpeningRiteInput('no', entry)).toBe('refuse');
    expect(classifyOpeningRiteInput('I refuse', entry)).toBe('refuse');
    expect(classifyOpeningRiteInput('Refuse the pact', entry)).toBe('refuse');
    expect(classifyOpeningRiteInput('Attack the summoner', entry)).toBe('refuse');
  });

  it('negatives do not complete', () => {
    expect(classifyOpeningRiteInput('who are you?', entry)).toBe('none');
    expect(classifyOpeningRiteInput('what is this?', entry)).toBe('none');
    expect(classifyOpeningRiteInput('Look around', entry)).toBe('none');
    expect(classifyOpeningRiteInput('Wait', entry)).toBe('none');
  });
});

describe('XP-D1 OPEN completion paths', () => {
  it('completes by accept chip and fills exactly to Level 2 (never 3)', () => {
    const before = litrpgState('summoned-pact', {
      character: {
        ...createInitialState().character!,
        name: 'Jax',
        level: 1,
        xp: 25,
        xpToNext: 150,
      },
    });
    expect(openingRiteXpFill(before)).toBe(125);
    const { state, receipts } = applyOpeningRiteTurn(before, 'Sign the pact');
    expect(state.openingRite?.done).toBe(true);
    expect(state.openingRite?.forced).toBeFalsy();
    expect(state.character.level).toBe(2);
    expect(state.character.level).toBeLessThan(3);
    expect(receipts.some((r) => /Quest complete: Opening Rite/i.test(r))).toBe(true);
    expect(receipts.some((r) => /XP Gained: 125 \(opening rite/i.test(r))).toBe(true);
    // One-time: second apply pays nothing.
    const again = applyOpeningRiteTurn(state, 'Sign the pact');
    expect(again.receipts).toEqual([]);
    expect(again.state.character.xp).toBe(state.character.xp);
  });

  it('completes by free text accept', () => {
    const { state } = applyOpeningRiteTurn(litrpgState('system-integration'), 'My name is Jax');
    expect(state.openingRite?.done).toBe(true);
    expect(state.character.level).toBe(2);
  });

  it('refuse forces System completion with same XP', () => {
    const { state, receipts } = applyOpeningRiteTurn(litrpgState('summoned-pact'), 'no');
    expect(state.openingRite?.done).toBe(true);
    expect(state.openingRite?.forced).toBe(true);
    expect(state.character.level).toBe(2);
    expect(receipts.some((r) => /seals the pact for you|registers you/i.test(r))).toBe(true);
  });

  it('OPEN9: backstop completes by end of player turn 2', () => {
    let s = litrpgState('hero-awakening', { turn: 0 });
    for (const line of ['who are you?', 'Look around']) {
      const r = applyOpeningRiteTurn(s, line);
      s = r.state;
      if (!s.openingRite?.done) s = { ...s, turn: (s.turn ?? 0) + 1 };
    }
    expect(s.openingRite?.done).toBe(true);
    expect(s.openingRite?.forced).toBe(true);
    expect(s.openingRite?.turn).toBeLessThanOrEqual(3);
    expect(s.character.level).toBe(2);
  });

  it('every LitRPG authored rite completes by turn 3 in the simulated none-flow', () => {
    for (const entry of OPENING_RITE_TABLE) {
      let s = litrpgState(entry.scenarioId, { turn: 1 });
      for (let i = 0; i < 3; i++) {
        if (s.openingRite?.done) break;
        const r = applyOpeningRiteTurn(s, 'Look around');
        s = r.state;
        if (!s.openingRite?.done) s = { ...s, turn: (s.turn ?? 0) + 1 };
      }
      expect(s.openingRite?.done, entry.scenarioId).toBe(true);
      expect(s.character.level, entry.scenarioId).toBe(2);
      expect(s.openingRite?.completedAtTurn ?? 99, entry.scenarioId).toBeLessThanOrEqual(3);
    }
  });

  it('rite fill alone lands L2 with 0 into the next bar (no quest double-pay)', () => {
    const before = litrpgState('system-integration', {
      character: {
        ...createInitialState().character!,
        name: 'Jax',
        level: 1,
        xp: 0,
        xpToNext: 150,
      },
    });
    const { state } = applyOpeningRiteTurn(before, 'Give your name and register');
    expect(state.character.level).toBe(2);
    expect(state.character.xp).toBe(0);
  });

  it('rite XP is exempt from the 60% event cap (full remaining bar)', () => {
    const s = litrpgState('summoned-pact', {
      character: {
        ...createInitialState().character!,
        name: 'Jax',
        level: 1,
        xp: 0,
        xpToNext: 150,
      },
    });
    const fill = openingRiteXpFill(s);
    expect(fill).toBe(150);
    // A2 event cap would clamp 150 to 90; rite must still pay 150.
    const capped = milestoneXp('litrpg', 'questComplete', { level: 1, playerLevel: 1 }).amount;
    expect(capped).toBeLessThanOrEqual(Math.floor(levelBar('litrpg', 1) * 0.6));
    const { state } = applyOpeningRiteTurn(s, 'yes');
    expect(state.character.level).toBe(2);
  });

  it('other early XP still cannot push past Level 2 in the same apply (one-level cap)', () => {
    const s = litrpgState('summoned-pact');
    const { state } = applyOpeningRiteTurn(s, 'Sign the pact');
    expect(state.character.level).toBe(2);
    const after = applyCharacterXpGain(state.character, 500, 'litrpg');
    expect(after.character.level).toBe(3);
    expect(after.levelsGained).toBe(1);
  });
});

describe('XP-D1 OPEN scope guard', () => {
  it('rpg and dnd never create or complete a rite; XP path unchanged', () => {
    const rpg = ensureOpeningRite({
      ...createInitialState('R', 'rpg'),
      engineMode: 'rpg',
      campaignBibleId: 'salt-road-heist',
    } as GameState);
    expect(rpg.openingRite).toBeUndefined();
    const rpgDone = applyOpeningRiteTurn(rpg, 'yes');
    expect(rpgDone.state.openingRite).toBeUndefined();
    expect(rpgDone.receipts).toEqual([]);
    expect(rpgDone.state.character.level).toBe(rpg.character.level);
    expect(rpgDone.state.character.xp).toBe(rpg.character.xp);

    const dnd = ensureOpeningRite({
      ...createInitialState('T', 'dnd'),
      engineMode: 'dnd',
      campaignBibleId: 'cursed-keep',
    } as GameState);
    expect(dnd.openingRite).toBeUndefined();
    const dndDone = applyOpeningRiteTurn(dnd, 'Sign the pact');
    expect(dndDone.state.openingRite).toBeUndefined();
    expect(dndDone.receipts).toEqual([]);
    expect(dndDone.state.character.xp).toBe(dnd.character.xp);
  });
});

describe('XP-D1 OPEN chips + writer fact + System window', () => {
  it('pins accept chip first without shrinking the pad count', () => {
    const state = litrpgState('summoned-pact');
    const base = ['Look around', 'Wait', 'Ask what they want', 'Say something'];
    const pinned = pinOpeningRiteChip(state, base);
    expect(pinned[0]).toBe('Sign the pact');
    expect(pinned.length).toBeGreaterThanOrEqual(base.length);
    // LitRPG/RPG chip count from A2 pin stays as today when combined.
    const afterA2 = pinStoryChipInTop(state, base, 3);
    const combined = pinOpeningRiteChip(state, afterA2);
    expect(combined[0]?.toLowerCase()).toBe('sign the pact');
  });

  it('writer packet carries the pending offer', () => {
    const state = litrpgState('summoned-pact');
    const packet = buildCompletedEventPacket(state, 'Look around');
    expect(packet.openingRiteOffer).toMatch(/Will you sign the pact/i);
    const facing = formatWriterFacingEvent(packet);
    expect(facing).toMatch(/OPENING RITE.*Will you sign the pact/i);
  });

  it('System window shows quest completion + XP + Level 2 reached', () => {
    const before = litrpgState('summoned-pact');
    const { state, receipts } = applyOpeningRiteTurn(before, 'Sign the pact');
    const committed = { ...state, turn: state.openingRite!.completedAtTurn! };
    expect(
      shouldAttachLitrpgSystemWindow({
        state: committed,
        systemLog: receipts,
      })
    ).toBe(true);
    const win = buildLitrpgSystemWindow(committed)!;
    expect(win.lines.some((l) => /Quest complete: Opening Rite/i.test(l))).toBe(true);
    expect(win.lines.some((l) => /\+\d+ XP/.test(l))).toBe(true);
    expect(win.lines.some((l) => /Level 2 reached/i.test(l))).toBe(true);
    expect(win.lines.some((l) => /^Level 2$|^Level 2\b/.test(l) || /Level 2/.test(l))).toBe(true);
  });

  it('compileChoices pins Opening Rite first on LitRPG', () => {
    const state = litrpgState('summoned-pact');
    const compiled = compileChoices(state, ['Look around', 'Wait', 'Ask what they want']);
    expect(compiled.choices[0]?.toLowerCase()).toBe(openingRiteAcceptChip(state)!.toLowerCase());
  });
});

describe('XP-D1 OPEN quest profile pick', () => {
  it('takes the rite chip when offered, else falls back', () => {
    const state = litrpgState('summoned-pact');
    const offered = ['Look around', 'Sign the pact', 'Wait'];
    expect(
      pickQuestProfileChoice(offered, state, () => 'Wait', 'Hear their reason')
    ).toBe('Sign the pact');
    const done = applyOpeningRiteTurn(state, 'Sign the pact').state;
    expect(
      pickQuestProfileChoice(['Look around', 'Hear their reason'], done, () => 'Look around', 'Hear their reason')
    ).toBe('Hear their reason');
    expect(pickQuestProfileChoice(['Look around', 'Wait'], done, () => 'Wait', null)).toBe('Wait');
  });

  it('OPEN2: prefers progress chips over a just-taken no-progress Use chip', () => {
    const state = litrpgState('system-integration', {
      openingRite: { id: 'opening-rite:system-integration', done: true, turn: 1 },
      log: [{ id: 'p1', turn: 1, role: 'player', content: 'Use Silver Reward Box', timestamp: 1 }],
    } as Partial<GameState>);
    const offered = ['Use Silver Reward Box', 'Travel toward Metro Hub', 'Search the scene for signs'];
    expect(
      pickQuestProfileChoice(offered, state as GameState, () => 'Use Silver Reward Box', null)
    ).toBe('Travel toward Metro Hub');
  });
});

describe('XP-D1 OPEN cover pin', () => {
  it('coverContinuePads pins Registration when the card has no Accept offer', async () => {
    const { coverContinuePads } = await import('./openingEstablishment');
    const state = litrpgState('system-integration', {
      openingEstablishment: {
        complete: false,
        pending: [],
        answers: { name: 'Jax' },
        sceneWritten: true,
        // No card.offer → no Accept the {noun}; Registration must pin.
      } as GameState['openingEstablishment'],
    });
    const pads = coverContinuePads(state);
    expect(pads[0]?.toLowerCase()).toBe('give your name and register');
  });

  it('coverContinuePads keeps card Accept/Refuse when the offer is open (SP)', async () => {
    const { coverContinuePads, openOpeningOffer } = await import('./openingEstablishment');
    const state = litrpgState('summoned-pact', {
      currentLocation: 'Sevenfold Circle Hall',
      openingEstablishment: {
        complete: false,
        pending: [],
        answers: { name: 'Jax' },
        sceneWritten: true,
        card: {
          place: 'Sevenfold Circle Hall',
          offer: { noun: 'offer', acceptGrants: [], refuseCost: null },
        },
      } as GameState['openingEstablishment'],
    });
    // If the card offer is open, Accept/Refuse stay first (classifier completes the rite).
    if (openOpeningOffer(state)) {
      const pads = coverContinuePads(state);
      expect(pads.some((p) => /^Accept the /i.test(p))).toBe(true);
      expect(pads[0]?.toLowerCase()).not.toBe('sign the pact');
    }
  });
});
