import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  rewriteInvalidReferences,
  validateEntityReferences,
  extractEntityContext,
} from './typedEntityValidator';
import { droughtSkirmishTable, runArcDirectorBeforeGm } from './arcDirector';
import { countLoiterFamilyStreak } from './beatFingerprint';
import { compileChoices } from './choiceCompiler';
import { exhaustDelayPads, isPyoaBranchLocked, recordPyoaBranchChoice } from './pyoaBranchLedger';
import { applyRenderFallback, buildSealedManifest } from './sealedManifest';
import { ensureOpeningNpcPinned, extractNamesFromHookText } from './openingPin';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { hasStatusLeak } from './statusFirewall';

describe('playtest29c — kit scrub kill + Free-hook recovery', () => {
  it('stamp is 2026-08-29c and Mid writer stays OFF', () => {
    expect(BUILD_STAMP).toMatch(/^2026-08-29/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('never rewrites they/them/their onto inventory kit names', () => {
    const state = createInitialState(undefined, 'rpg');
    state.inventory = [
      {
        id: 'crew',
        name: 'Crew Token',
        type: 'misc',
        quantity: 1,
        description: 'kit',
      } as never,
    ];
    state.currentLocation = 'Salt Road Camp';
    // No NPC / encounter — old scrub preferred inventoryItems[0]
    const ctx = extractEntityContext(state);
    expect(ctx.inventoryItems[0]).toMatch(/Crew Token/i);
    const prose = "They're waiting. You watch them adjust their coats.";
    const report = validateEntityReferences(prose, ctx);
    const rewritten = rewriteInvalidReferences(prose, ctx, {
      ...report,
      themCount: Math.max(report.themCount, 3),
    });
    expect(rewritten).not.toMatch(/Crew Token/i);
    expect(rewritten).toMatch(/\bthey\b/i);
    expect(rewritten).toMatch(/\bthem\b/i);
    expect(rewritten).toMatch(/\btheir\b/i);
  });

  it('never maps clothes / Worn Iron / Coat onto pronouns', () => {
    for (const kit of [
      'The clothes you already had on',
      'Worn Iron Shortsword',
      'Oil-Stained Trench Coat',
    ]) {
      const state = createInitialState(undefined, 'litrpg');
      state.inventory = [
        { id: 'k', name: kit, type: 'misc', quantity: 1, description: 'kit' } as never,
      ];
      const ctx = extractEntityContext(state);
      const out = rewriteInvalidReferences(
        'They look at them and their hands shake.',
        ctx,
        {
          themCount: 3,
          thisPlaceCount: 0,
          strangerCount: 0,
          brokenChoiceCount: 0,
          references: [],
          shouldRegenerate: true,
        }
      );
      expect(out.toLowerCase()).not.toContain(kit.toLowerCase().slice(0, 12));
      expect(out).toMatch(/\bThey\b|\bthey\b/);
    }
  });

  it('bible-aware drought: no Keep Wraith on Shattered Coast', () => {
    const coast = createInitialState(undefined, 'dnd');
    coast.campaignBibleId = 'shattered-coast';
    const table = droughtSkirmishTable(coast);
    expect(table.every((n) => !/Keep Wraith/i.test(n))).toBe(true);
    expect(table.some((n) => /Saltmar|Coastal|Brine/i.test(n))).toBe(true);

    const keep = createInitialState(undefined, 'dnd');
    keep.campaignBibleId = 'cursed-keep';
    expect(droughtSkirmishTable(keep).some((n) => /Keep Wraith/i.test(n))).toBe(true);

    const litrpg = createInitialState(undefined, 'litrpg');
    litrpg.campaignBibleId = 'hero-awakening';
    const litTable = droughtSkirmishTable(litrpg);
    expect(litTable.length).toBeGreaterThanOrEqual(3);
    expect(new Set(litTable).size).toBe(litTable.length);
  });

  it('loiter family streak counts travel ping-pong across hubs', () => {
    const state = createInitialState(undefined, 'rpg');
    state.log = [
      { id: '1', role: 'player', content: 'Travel toward Ward Rest', timestamp: 1 },
      { id: '2', role: 'gm', content: 'You arrive.', timestamp: 2 },
      { id: '3', role: 'player', content: 'Travel toward Ashline Yard', timestamp: 3 },
      { id: '4', role: 'gm', content: 'You arrive.', timestamp: 4 },
      { id: '5', role: 'player', content: 'Travel toward Ward Rest', timestamp: 5 },
      { id: '6', role: 'gm', content: 'You arrive.', timestamp: 6 },
      { id: '7', role: 'player', content: 'Travel toward Ashline Yard', timestamp: 7 },
    ] as never;
    const loiter = countLoiterFamilyStreak(state);
    expect(loiter.key).toBe('loiter');
    expect(loiter.count).toBeGreaterThanOrEqual(4);
  });

  it('loiter interrupt forces consequence and drops travel/wait pads', () => {
    let state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 16;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    state.log = [
      { id: '1', role: 'player', content: 'Wait and watch', timestamp: 1 },
      { id: '2', role: 'gm', content: 'Time passes.', timestamp: 2 },
      { id: '3', role: 'player', content: 'Travel toward Harbor Quay', timestamp: 3 },
      { id: '4', role: 'gm', content: 'You walk.', timestamp: 4 },
      { id: '5', role: 'player', content: 'Travel toward Lowmarket', timestamp: 5 },
      { id: '6', role: 'gm', content: 'You walk.', timestamp: 6 },
      { id: '7', role: 'player', content: 'Wait and watch', timestamp: 7 },
    ] as never;
    const arc = runArcDirectorBeforeGm(state, 'Wait and watch');
    expect(arc.mandate).toMatch(/LOITER INTERRUPT/i);
    const compiled = compileChoices(arc.state, [
      'Travel toward Harbor Quay',
      'Wait and watch',
      'Ask a direct question',
      'Press the attack',
    ]);
    expect(compiled.choices.every((c) => !/^Travel toward/i.test(c))).toBe(true);
    expect(compiled.choices.every((c) => !/^Wait/i.test(c))).toBe(true);
  });

  it('PYOA Wait/Inspect delay pads lock a branch', () => {
    let state = createInitialState(undefined, 'pyoa');
    state.campaignBibleId = 'vesper-glass-cipher';
    state.turn = 8;
    state = exhaustDelayPads(state, 'Wait and watch');
    state = exhaustDelayPads(state, 'Inspect the tunnel wall');
    expect(isPyoaBranchLocked(state)).toBe(true);

    state = createInitialState(undefined, 'pyoa');
    state = recordPyoaBranchChoice(state, 'Choose the risky fork');
    expect(isPyoaBranchLocked(state)).toBe(true);
  });

  it('opening pin extracts Silas and stamps presence', () => {
    expect(extractNamesFromHookText('Beside you, the thief Silas wipes blood.')).toContain('Silas');
    let state = createInitialState(undefined, 'pyoa');
    state.campaignBibleId = 'vesper-glass-cipher';
    state.turn = 2;
    state.openingEstablishment = {
      pending: [],
      answers: {},
      complete: true,
      aloneArrival: false,
      pickedHook:
        'Beside you, Silas Blackwood offers a soot-stained hand — the smuggler route.',
      pinnedNpcNames: ['Silas Blackwood'],
    };
    state = ensureOpeningNpcPinned(state);
    expect(state.sceneFacts?.present?.some((p) => /Silas/i.test(p))).toBe(true);
  });

  it('empty-GM fallback has no beat-recovered chrome leak', () => {
    const state = createInitialState(undefined, 'rpg');
    state.campaignBibleId = 'salt-road-heist';
    state.turn = 10;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    const arc = runArcDirectorBeforeGm(state, 'Ask Vessa about the score');
    const manifest = buildSealedManifest(arc.state, 'Ask Vessa', arc);
    const fallback = applyRenderFallback(manifest, arc.state, 'fail');
    expect(fallback.prose).not.toMatch(/beat recovered/i);
    expect(hasStatusLeak(fallback.prose)).toBe(false);
    expect(fallback.systemLog.join('\n')).not.toMatch(/GM_VOICE|RenderFallbackUsed/i);
  });
});
