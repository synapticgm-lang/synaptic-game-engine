/**
 * Critic Batch C+D — Lowmarket vignette lock + polish/tooling.
 * Stamp: HUD 2026-08-31j / BUILD 2026-08-31c. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { stripChoiceList } from './parser';
import { scrubDualLocationOpenings } from './proseWarden';
import {
  applyCommittedNarrative,
  mergeSceneFacts,
  emptySceneFacts,
} from './sceneFacts';
import {
  openVignetteFromHubBeat,
  isOpenVignette,
  formatVignetteBindingLine,
  filterPadsAgainstOpenVignette,
  harvestVignetteIntoSceneFacts,
  clearVignetteOnHubLeave,
  vignetteBlocksNewSocialCast,
} from './vignetteLock';
import { formatHubArrivalForPrompt } from './hubEncounters';
import { compileChoices } from './choiceCompiler';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import {
  collapseEngineFallbackNarration,
  narrationOnlyFromTranscriptMarkdown,
} from './playTranscript';
import { isBannedFallbackStub } from './sealedManifest';

const T13_SLIP =
  'Your pulse is in your ears. 1. Slip toward the cathedral before the mark wakes.';

describe('playtest31jCriticBatchCD', () => {
  it('stamp is 2026-08-31j / 31c and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31c').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31j').toBe(true);
  });

  describe('Batch C — Lowmarket vignette continuity lock', () => {
    it('hub social arrival opens openVignette with locked cast', () => {
      const v = openVignetteFromHubBeat({
        hubId: 'sp-hub-lowmarket',
        hubName: 'Lowmarket',
        beatId: 'lm-social',
        kind: 'social',
        contactName: 'Lowmarket Fence',
        pressure: 'A fence signals from a side stall.',
        turn: 12,
      });
      expect(isOpenVignette(v)).toBe(true);
      expect(v!.cast).toContain('Lowmarket Fence');
      expect(v!.hubId).toBe('sp-hub-lowmarket');
      expect(v!.status).toBe('open');
    });

    it('second Engage continues same cast — does not invent a new argument cast', () => {
      const opened = openVignetteFromHubBeat({
        hubId: 'sp-hub-lowmarket',
        hubName: 'Lowmarket',
        beatId: 'lm-social',
        kind: 'social',
        contactName: 'Lowmarket Fence',
        pressure: 'Fence signals.',
        turn: 12,
      })!;
      const facts = harvestVignetteIntoSceneFacts(
        {
          ...emptySceneFacts(13),
          present: ['Lowmarket Fence'],
          openVignette: opened,
        },
        'The Lowmarket Fence haggles over a crate of copper fish with a stall-hand.',
        13,
        { id: 'sp-hub-lowmarket', name: 'Lowmarket' }
      );
      expect(facts.openVignette?.cast).toContain('Lowmarket Fence');
      expect(facts.openVignette?.status).toBe('open');
      expect(vignetteBlocksNewSocialCast({ sceneFacts: facts } as never)).toBe(true);

      const again = openVignetteFromHubBeat({
        hubId: 'sp-hub-lowmarket',
        hubName: 'Lowmarket',
        beatId: 'lm-social',
        kind: 'social',
        contactName: 'Brand New Merchant',
        pressure: 'A different argument starts.',
        turn: 14,
        prev: facts.openVignette,
      });
      expect(again!.cast).toContain('Lowmarket Fence');
      expect(again!.cast).toContain('Brand New Merchant');
      // Lock stays open on same hub — does not replace prior cast
      expect(again!.status).toBe('open');
    });

    it('filterPadsAgainstOpenVignette drops invent-stranger talk pads', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.campaignBibleId = 'summoned-pact';
      state.currentLocation = 'Lowmarket';
      state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
      state.sceneFacts = {
        ...emptySceneFacts(20),
        present: ['Lowmarket Fence'],
        openVignette: openVignetteFromHubBeat({
          hubId: 'sp-hub-lowmarket',
          hubName: 'Lowmarket',
          beatId: 'lm-social',
          kind: 'social',
          contactName: 'Lowmarket Fence',
          turn: 20,
        }),
      };
      const pads = filterPadsAgainstOpenVignette(state, [
        'Talk to Lowmarket Fence',
        'Talk to the stranger',
        'Approach another stall fence',
        'Walk away from the fence',
      ]);
      expect(pads.some((p) => /Lowmarket Fence/i.test(p))).toBe(true);
      expect(pads.some((p) => /stranger/i.test(p))).toBe(false);
    });

    it('leaving the hub closes the vignette', () => {
      const open = openVignetteFromHubBeat({
        hubId: 'sp-hub-lowmarket',
        hubName: 'Lowmarket',
        beatId: 'lm-social',
        kind: 'social',
        contactName: 'Lowmarket Fence',
        turn: 10,
      })!;
      const facts = { ...emptySceneFacts(10), openVignette: open };
      const closed = clearVignetteOnHubLeave(
        facts,
        'Lowmarket',
        'Contract Hall',
        (loc) =>
          /lowmarket/i.test(loc ?? '')
            ? 'sp-hub-lowmarket'
            : /contract/i.test(loc ?? '')
              ? 'sp-hub-contract-hall'
              : null
      );
      expect(closed?.openVignette?.status).toBe('closed');
    });

    it('SNAPSHOT + hub prompt bind open vignette', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.campaignBibleId = 'summoned-pact';
      state.currentLocation = 'Lowmarket';
      state.turn = 22;
      state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
      const open = openVignetteFromHubBeat({
        hubId: 'sp-hub-lowmarket',
        hubName: 'Lowmarket',
        beatId: 'lm-social',
        kind: 'social',
        contactName: 'Lowmarket Fence',
        pressure: 'Scrap deal unfinished',
        turn: 22,
      })!;
      state.sceneFacts = {
        ...emptySceneFacts(22),
        present: ['Lowmarket Fence'],
        openVignette: open,
      };
      const bind = formatVignetteBindingLine(state);
      expect(bind).toMatch(/OPEN VIGNETTE BINDING/i);
      expect(bind).toMatch(/Lowmarket Fence/);
      const hubLine = formatHubArrivalForPrompt(state);
      expect(hubLine).toMatch(/HUB VIGNETTE LOCK/i);
      expect(hubLine).toMatch(/Lowmarket Fence/);
      const snap = formatSceneSnapshotForPrompt(state);
      expect(snap).toMatch(/Open vignette|OPEN VIGNETTE/i);
    });

    it('mergeSceneFacts preserves openVignette; argument harvest locks cast', () => {
      const prev = {
        ...emptySceneFacts(5),
        openVignette: openVignetteFromHubBeat({
          hubId: 'sp-hub-lowmarket',
          hubName: 'Lowmarket',
          beatId: 'lm-social',
          kind: 'social',
          contactName: 'Lowmarket Fence',
          turn: 5,
        }),
      };
      const next = mergeSceneFacts(prev, emptySceneFacts(6));
      expect(isOpenVignette(next.openVignette)).toBe(true);

      const state = createInitialState(undefined, 'litrpg');
      state.campaignBibleId = 'summoned-pact';
      state.currentLocation = 'Lowmarket';
      state.sceneFacts = { ...emptySceneFacts(30), present: [] };
      const committed = applyCommittedNarrative(
        state,
        'A loud argument breaks out — Mara shouts at Kell over a grain sack.',
        30
      );
      expect(committed.openVignette?.kind).toBe('argument');
      expect(committed.openVignette?.cast.length).toBeGreaterThan(0);
    });

    it('compileChoices respects vignette cast lock', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.campaignBibleId = 'summoned-pact';
      state.currentLocation = 'Lowmarket';
      state.turn = 25;
      state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
      state.sceneFacts = {
        ...emptySceneFacts(25),
        present: ['Lowmarket Fence'],
        openVignette: openVignetteFromHubBeat({
          hubId: 'sp-hub-lowmarket',
          hubName: 'Lowmarket',
          beatId: 'lm-social',
          kind: 'social',
          contactName: 'Lowmarket Fence',
          turn: 25,
        }),
      };
      const { choices, notes } = compileChoices(state, [
        'Talk to Lowmarket Fence',
        'Talk to the stranger',
        'Scout the exit',
      ]);
      expect(choices.some((c) => /stranger/i.test(c))).toBe(false);
      expect(notes.some((n) => /Vignette/i.test(n)) || !choices.some((c) => /stranger/i.test(c))).toBe(
        true
      );
    });
  });

  describe('Batch D — stripChoiceList + dual location + narration-only', () => {
    it('stripChoiceList removes T13 Slip toward numbered leak', () => {
      const stripped = stripChoiceList(T13_SLIP);
      expect(stripped).not.toMatch(/\b1\.\s*Slip toward/i);
      expect(stripped).toMatch(/pulse is in your ears/i);
      expect(stripped).not.toMatch(/cathedral before the mark/i);
    });

    it('stripChoiceList removes markdown bullet option leak', () => {
      const prose =
        'The alley holds. - Slip toward the cathedral\n- Engage the threat';
      const stripped = stripChoiceList(prose);
      expect(stripped).not.toMatch(/Slip toward the cathedral/i);
    });

    it('scrubDualLocationOpenings keeps one camera under fail path', () => {
      const dual =
        'At Lowmarket, Void-Touched Scavenger closes. At the Weighing Cup, steel flashes.';
      const cleaned = scrubDualLocationOpenings(dual, 'Lowmarket', [
        'Lowmarket',
        'Weighing Cup',
        'The Weighing Cup',
      ]);
      expect(cleaned).toMatch(/Lowmarket/i);
      expect(cleaned).not.toMatch(/^At the Weighing Cup/im);
      expect(isBannedFallbackStub(cleaned)).toBe(false);
    });

    it('collapseEngineFallbackNarration collapses consecutive stubs', () => {
      const out = collapseEngineFallbackNarration([
        { turn: 1, body: 'Real prose about the fence.' },
        {
          turn: 2,
          body: 'At Lowmarket, something shifts — a footstep, a call, a door — forcing the moment forward.',
        },
        {
          turn: 3,
          body: 'At Lowmarket, something shifts — a footstep, a call, a door — forcing the moment forward.',
        },
        { turn: 4, body: 'The fence nods once.' },
      ]);
      expect(out).toMatch(/engine fallback ×2/i);
      expect(out).toMatch(/Real prose about the fence/);
      expect(out).toMatch(/The fence nods once/);
      expect((out.match(/something shifts/gi) ?? []).length).toBe(0);
    });

    it('narrationOnlyFromTranscriptMarkdown drops Options/STATUS', () => {
      const raw = `## Transcript

### Turn 1 — Narration

The fence watches.

**Options:**
- Talk to the fence
- Wait and watch

**STATUS / System:**
- XP Gained: 0

**Player:** Talk to the fence

### Turn 2 — Narration

He nods.
`;
      const only = narrationOnlyFromTranscriptMarkdown(raw);
      expect(only).not.toMatch(/\*\*Options:\*\*/i);
      expect(only).not.toMatch(/\*\*STATUS/i);
      expect(only).toMatch(/The fence watches/);
      expect(only).toMatch(/He nods/);
    });
  });
});
