import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  filterChoicesToTurnFacts,
  inventsPresenceOnEmptyScene,
  padChoicesToCount,
  sanitizeChoiceLabel,
  sceneSafeFallbacks,
} from './choicePipeline';
import { extractChoiceLines, stripChoiceList } from './parser';
import { isInteriorPlace, INTERIOR_MAP_BLUEPRINT, STREET_MAP_BLUEPRINT } from './placeAuthority';
import { resolvePlayAreaMap } from './mapEngine';
import { stitchOpeningContinue, applyOpeningContract } from './openingStitch';
import { resolveOpeningPrompts } from './openingEstablishment';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { dedupeQuestStatusEcho } from './systemLog';
import { scrubPrematureSecrets } from './proseWarden';
import { applyErrorRepairs } from './errorRepairWarden';
import { isGenericQuestProvenance, enrichQuestJournalFields } from './questJournalEnrich';

const ALONE_RUIN =
  'a damaged building off the Valespire roads — Second Chamber of a half-collapsed ruin';

describe('story↔options consistency (20l)', () => {
  it('strips numbered choice lists from display prose', () => {
    const prose = `Nothing moves. Only your own footprints. The blue panel waits.

1. Push through the gap in the wall
2. Call out to the voices outside
3. Inspect the speaker
What do you do?`;
    const stripped = stripChoiceList(prose);
    expect(stripped).toMatch(/nothing moves/i);
    expect(stripped).not.toMatch(/1\.\s*Push/i);
    expect(stripped).not.toMatch(/What do you do/i);
    expect(extractChoiceLines(prose).some((c) => /push through the gap/i.test(c))).toBe(true);
  });

  it('sanitizes stray What do you do? from choice labels', () => {
    expect(sanitizeChoiceLabel('Check the blue panel What do you do?')).toBe('Check the blue panel');
    expect(sanitizeChoiceLabel('Search the ruin — What do you do?')).toBe('Search the ruin');
  });

  it('alone empty scene rejects crowd/voices/speaker pads', () => {
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
    const story =
      'Nothing moves. Only your own footprints in the dust. The blue panel waits at eye level.';
    expect(inventsPresenceOnEmptyScene('Call out to the voices outside', state, story)).toBe(true);
    expect(inventsPresenceOnEmptyScene('Inspect the speaker', state, story)).toBe(true);
    expect(inventsPresenceOnEmptyScene('Search the ruin carefully', state, story)).toBe(false);

    const { kept, rejected } = filterChoicesToTurnFacts(
      [
        'Check the blue panel',
        'Call out to the voices outside — the crowd',
        'Inspect the speaker',
        'What do you do?',
      ],
      story,
      state
    );
    expect(kept.some((c) => /blue panel/i.test(c))).toBe(true);
    expect(kept.some((c) => /voices|speaker|crowd/i.test(c))).toBe(false);
    expect(rejected.length).toBeGreaterThanOrEqual(2);

    const padded = padChoicesToCount(['Check the blue panel'], state, story, 3);
    expect(padded.every((c) => !/voices|crowd|speaker|emblem/i.test(c))).toBe(true);
    expect(padded.length).toBeGreaterThanOrEqual(2);

    const fallbacks = sceneSafeFallbacks(state, story);
    expect(fallbacks.some((c) => /bystander|crowd|voices/i.test(c))).toBe(false);
  });

  it('classifies alone-ruin building…roads as interior, not street chrome', () => {
    expect(isInteriorPlace(ALONE_RUIN)).toBe(true);
    expect(isInteriorPlace('Second Chamber')).toBe(true);
    expect(isInteriorPlace('a cracked city street near the market')).toBe(false);
    const map = resolvePlayAreaMap(null, ALONE_RUIN, ['Second Chamber']);
    expect(map?.blueprintId).toBe(INTERIOR_MAP_BLUEPRINT);
    expect(map?.blueprintId).not.toBe(STREET_MAP_BLUEPRINT);
  });

  it('continue stitch grounds the room without meta lock / anti-sword', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const state = {
      ...base,
      seed: 'cont-alone-20l',
      campaignBibleId: 'summoned-pact',
      currentLocation: ALONE_RUIN,
      character: { ...base.character, name: 'Jax', appearance: 'Travel clothes' },
      openingEstablishment: {
        pending: [],
        answers: {
          name: 'Jax',
          where: ALONE_RUIN,
          wear: 'Travel clothes',
          pockets: 'A bag with everyday stuff',
        },
        complete: true,
        registrar: { voice: 'inworld' as const, label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: true,
        mode: 'weave' as const,
        aloneArrival: true,
      },
    };
    const text = stitchOpeningContinue(state);
    expect(text).not.toMatch(/Nothing reset/i);
    expect(text).not.toMatch(/light already happened/i);
    expect(text).not.toMatch(/anyone listening/i);
    expect(text).not.toMatch(/still in alone/i);
    expect(text).not.toMatch(/still HERE|same place, same light/i);
    expect(text).not.toMatch(/panel has you as Jax/i);
    expect(text).not.toMatch(/You are wearing Travel clothes/i);
    expect(text).toMatch(/rubble|gap|doorway|debris|stone|arch/i);
    expect(text).not.toMatch(/Nobody answers if you call/i);

    const contracted = applyOpeningContract(
      resolveOpeningPrompts(summonedPact, 'litrpg'),
      summonedPact,
      true,
      'kit-seed'
    );
    const kitQ = contracted.find((p) => p.kind === 'kit')?.question ?? '';
    expect(kitQ).not.toMatch(/starter sword/i);
    expect(kitQ).not.toMatch(/not a starter/i);
  });

  it('Circle Blessing is unequipped inventory, not Shoulders', () => {
    const blessing = summonedPact.starterItems.find((i) => /circle blessing/i.test(i.name));
    expect(blessing).toBeTruthy();
    expect(blessing?.equipped).toBe(false);
    expect(blessing?.slot).toBeUndefined();

    const base = createInitialState('The Summoned Pact', 'litrpg');
    const bad = {
      ...base,
      campaignBibleId: 'summoned-pact',
      inventory: [
        {
          id: 'sp-blessing',
          name: 'Circle Blessing [???]',
          rarity: 'Rare' as const,
          quantity: 1,
          itemType: 'accessory' as const,
          itemLevel: 1,
          equipped: true,
          slot: 'Shoulders',
        },
      ],
      errorRepairRevision: 0,
    };
    const { state, notes } = applyErrorRepairs(bad);
    const fixed = state.inventory.find((i) => /circle blessing/i.test(i.name));
    expect(fixed?.equipped).toBe(false);
    expect(fixed?.slot).toBeUndefined();
    expect(notes.some((n) => n.code === 'ERR_CIRCLE_BLESSING_SLOT')).toBe(true);
  });

  it('hides generic quest provenance chrome', () => {
    expect(isGenericQuestProvenance('Side hook revealed in play.')).toBe(true);
    const enriched = enrichQuestJournalFields({
      id: 'side-1',
      name: 'exploring the ruin',
      description: 'Look around.',
      status: 'active',
      type: 'side',
      revealed: true,
      objectives: [{ id: 'o1', description: 'Scout the ruin', completed: false }],
    });
    expect(enriched.provenance).toBeUndefined();
  });

  it('dedupes Quest Focus / Unlocked / Ledger triple-echo', () => {
    const lines = dedupeQuestStatusEcho([
      'Quest Focus: exploring the ruin',
      'Quest Unlocked: exploring the ruin',
      'Ledger: exploring the ruin',
      'XP Gained: 5',
    ]);
    const questLines = lines.filter((l) => /exploring the ruin/i.test(l));
    expect(questLines).toHaveLength(1);
    expect(questLines[0]).toMatch(/^Quest Unlocked:/i);
    expect(lines).toContain('XP Gained: 5');
  });

  it('scrubs premature secrets framing', () => {
    const scrubbed = scrubPrematureSecrets(
      'The ruin gives up its secrets slowly. Nothing moves. Only your own footprints.'
    );
    expect(scrubbed).not.toMatch(/secrets/i);
    expect(scrubbed).toMatch(/nothing moves/i);
  });
});
