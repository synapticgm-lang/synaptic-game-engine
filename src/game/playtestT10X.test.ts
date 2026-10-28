/**
 * T10X — present group reacts (not invented bystanders); group asks get answers;
 * never Gained bystanders from a grab.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { isCrowdFillerToken, isAggregatePersonToken } from './chromeAuthority';
import { compileRefEnum } from './completedEventPacket';
import { extractSceneFacts } from './sceneFacts';
import { parsePlayerSteps, sheetContextFromState } from './intentParser';
import { ensureSpokenAnswer } from './spokenAnswer';
import { isNonLootableTakeTarget, looksLikeSteal, resolveStealAttempt } from './stealParley';
import { resolveTypedFreeText } from './typedFreeText';
import { buildClauseWriterFact, speechAddressCue } from './writerCueLines';
import { scrubCrowdFillerOntoPresentCast } from './proseWarden';
import { applyProseWarden } from './proseWarden';

function roof(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  s.engineMode = 'litrpg';
  s.campaignBibleId = 'summoned-pact';
  s.character = { ...s.character, name: 'Jax' };
  s.currentLocation = 'a night-market roof over Lowmarket';
  s.turn = 2;
  s.openingEstablishment = {
    pending: [],
    answers: { name: 'Jax' },
    complete: true,
    sceneWritten: true,
    aloneArrival: false,
    pickedHook:
      'Location: a night-market roof over Lowmarket\nWho is here: the roof-thieves\nWhy: Drop down with them and keep the Scale shard quiet.\n',
    card: {
      place: 'a night-market roof over Lowmarket',
      cast: 'the roof-thieves',
      castNames: ['the roof-thieves'],
      props: ['dark cloak'],
      names: [],
    },
  };
  s.sceneFacts = {
    crowd: 'present',
    noise: 'quiet',
    present: ['the roof-thieves'],
    props: ['dark cloak'],
    lastBeat: 'roof',
    updatedTurn: 2,
    crowdCount: 3,
  };
  return { ...s, ...over };
}

describe('T10X present group reacts; no Gained bystanders', () => {
  it('s8302 T1→T2: kick/point with roof-thieves present opens their reaction slot, not bystanders', () => {
    const state = roof();
    const line = 'I kick the dark cloak off the tiles and point at the alleyway below.';
    const here = sheetContextFromState(state).present ?? [];
    expect(here.some((p) => /roof-thieves/i.test(p))).toBe(true);
    expect(speechAddressCue(null, here)).toMatch(/NPC reaction slot open for (?:the )?roof-thieves/i);
    expect(speechAddressCue(null, here)).not.toMatch(/No one present to answer/);
    const fact = buildClauseWriterFact(line, false, { presentHere: here });
    expect(fact).toMatch(/NPC reaction slot open for (?:the )?roof-thieves/i);
    expect(fact).not.toMatch(/bystanders/i);
  });

  it('s8302: bystanders are crowd filler; roof-thieves on the ledger still speak', () => {
    expect(isCrowdFillerToken('bystanders')).toBe(true);
    expect(isAggregatePersonToken('the roof-thieves')).toBe(true);
    expect(isCrowdFillerToken('the roof-thieves')).toBe(false);
    expect(speechAddressCue('the roof-thieves', ['the roof-thieves'])).toMatch(
      /NPC reaction slot open for the roof-thieves/,
    );
    expect(speechAddressCue('the salt-burners')).toMatch(/No one present to answer/);
    const refs = compileRefEnum(roof());
    expect(refs.some((r) => /roof-thieves/i.test(r.display) && r.klass === 'person')).toBe(true);
    expect(refs.some((r) => isCrowdFillerToken(r.display))).toBe(false);
  });

  it('s8302: extractSceneFacts does not stamp bystanders when roof-thieves already present', () => {
    const prev = {
      crowd: 'present' as const,
      noise: 'quiet' as const,
      present: ['the roof-thieves'],
      props: ['dark cloak'],
      lastBeat: '',
      updatedTurn: 1,
      crowdCount: 3,
    };
    const next = extractSceneFacts(
      'Jax kicked the dark cloak. The roof-thieves watched. People nearby muttered.',
      prev,
      2,
    );
    expect(next.present?.some((p) => /roof-thieves/i.test(p))).toBe(true);
    expect(next.present?.some((p) => /^bystanders?$/i.test(p))).toBe(false);
  });

  it('s8302 T3: grab the bystander is not steal / no Gained bystanders', () => {
    const state = roof({
      sceneFacts: {
        crowd: 'present',
        noise: 'quiet',
        present: ['the roof-thieves', 'bystanders'],
        props: ['dark cloak'],
        lastBeat: '',
        updatedTurn: 3,
      },
    });
    const line =
      'I vault over the parapet and grab the bystander by the collar, dragging him backward from the edge. "Don\'t you dare look down!';
    const read = parsePlayerSteps(line, sheetContextFromState(state));
    const take = read.steps.find((st) => st.action === 'take');
    expect(take?.target?.toLowerCase()).toMatch(/bystander/);
    expect(isNonLootableTakeTarget(take?.target, state)).toBe(true);
    expect(looksLikeSteal(line, take, state)).toBe(false);
    const steal = resolveStealAttempt(state, line, take ?? null);
    expect(steal.taken).toBe(false);
    expect(steal.facts.join(' ')).not.toMatch(/Took the bystanders/i);
    expect((steal.state.inventory ?? []).some((i) => /bystander/i.test(i.name))).toBe(false);
    const typed = resolveTypedFreeText(state, line);
    expect(typed.engineResult).not.toMatch(/Took the bystanders/i);
    expect(typed.facts.join(' ')).not.toMatch(/Took the bystanders/i);
    expect((typed.state?.inventory ?? []).some((i) => /bystander/i.test(i.name))).toBe(false);
  });

  it('s8302 T3 ask + s8202 Pact crew: typed ask to present group lands content (not silent invent)', () => {
    const ask =
      "I flick a coin across the wet tiles toward the huddled figure and ask if they're going to help or just watch.";
    const draft =
      'Jax flicked a coin across the wet tiles of a night-market roof over Lowmarket, and it spun once before it stopped near the huddled figure. Jax asked the figure by the dark cloak whether they meant to help or just watch from the edge.';
    const out = ensureSpokenAnswer(draft, roof({ turn: 4 }), ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/roof-thieves/i);
    expect(out.prose).toMatch(/["\u201c].+["\u201d]|said nothing/i);
    // Card want is ledger content when motive is empty.
    expect(out.prose).toMatch(/Scale shard|Drop down|said nothing/i);

    const pact = roof({
      turn: 3,
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
        sceneWritten: true,
        aloneArrival: false,
        pickedHook: 'Location: Contract Hall\nWho is here: the Pact crew\nWhy: Hold the Mark quiet until the seal is set.\n',
        card: {
          place: 'Contract Hall',
          cast: 'the Pact crew',
          castNames: ['the Pact crew'],
          props: [],
          names: [],
        },
      },
      sceneFacts: {
        crowd: 'present',
        noise: 'voices',
        present: ['the Pact crew'],
        props: [],
        lastBeat: '',
        updatedTurn: 3,
      },
    });
    const kick =
      "I kick a loose stone toward the Pact crew and shout if they mean to stand there all night.";
    expect(speechAddressCue(null, sheetContextFromState(pact).present)).toMatch(
      /NPC reaction slot open for (?:the )?Pact crew/i,
    );
    const pactOut = ensureSpokenAnswer(
      'Jax kicked a loose stone toward the Pact crew.',
      pact,
      kick,
    );
    // Physical kick alone is not a typed ask — shout/ask shape still needs exchange when ask-like.
    expect(pactOut.answer.status === 'added' || pactOut.answer.status === 'not-asked').toBe(true);
  });

  it('s8302: warden maps invented bystanders onto the present roof-thieves', () => {
    const prose =
      'Jax pointed down at the alleyway below. The bystanders in the alley looked up at the pointing hand, then back down at their own feet.';
    const scrubbed = scrubCrowdFillerOntoPresentCast(prose, ['the roof-thieves', 'bystanders']);
    expect(scrubbed).toMatch(/roof-thieves/i);
    expect(scrubbed).not.toMatch(/\bbystanders\b/i);
    const warded = applyProseWarden(prose, {
      presentNames: ['the roof-thieves'],
      currentLocation: 'a night-market roof over Lowmarket',
    });
    expect(warded).toMatch(/roof-thieves/i);
    expect(warded).not.toMatch(/\bbystanders\b/i);
  });
});
