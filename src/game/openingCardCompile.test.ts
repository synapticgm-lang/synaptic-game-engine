/**
 * Root 2 (seed 76) — the picked opening card is compiled once at New Game: HERE from its own head
 * noun with the hub as parent, cast from its "Who is here" line, mention tokens from its printed names.
 * Reaching a hub pays only on a real arrival.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { compileNounAllowlist, compileRefEnum } from './completedEventPacket';
import { compileOpeningCard, normalizeOpeningHookCard, openingCastLabel } from './openingEstablishment';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { placeHeadNoun } from './placeNames';
import { applySandboxXpAwards } from './sandboxXp';
import { summonedPact } from '@/data/campaigns/summonedPact';
import type { GameState } from './types';

const FORBIDDEN = ['the Scale priests', 'Scale priests', 'Wrong', 'Join', 'Walk'];

function seed76(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 76, personality: 'cold-system' });
  return stampOpening(state);
}

function xpTurn(state: GameState, action: string, from: string, to: string, turn: number) {
  return applySandboxXpAwards(state, {
    playerAction: action,
    locationName: to,
    previousLocationName: from,
    questsBefore: state.quests ?? [],
    questsAfter: state.quests ?? [],
    events: [],
    turn,
  });
}

describe('seed 76 lowmarket card compiles once', () => {
  it('HERE is the cellar shrine with Lowmarket as its parent', () => {
    const s = seed76();
    expect(s.openingEstablishment?.pickedHook).toMatch(/Location: a Lowmarket cellar shrine under Valespire/);
    expect(s.currentLocation).toBe('the cellar shrine under Lowmarket');
    expect(s.openingEstablishment?.card?.place).toBe('the cellar shrine under Lowmarket');
    expect(s.openingEstablishment?.card?.parentHub).toBe('Lowmarket');
    expect(matchHub(hubsForBibleId('summoned-pact'), s.currentLocation)).toBeNull();
  });

  it('the T1 REF ENUM and mention list hold the card cast, not the scraped words', () => {
    const s = seed76();
    expect(openingCastLabel(s)).toBe('the denied-god cult');
    const refs = compileRefEnum(s);
    const people = refs.filter((r) => r.klass === 'person').map((r) => r.display);
    expect(people).toContain('the denied-god cult');
    const mention = compileNounAllowlist(s);
    expect(mention).toContain('the denied-god cult');
    for (const bad of FORBIDDEN) {
      expect(mention, bad).not.toContain(bad);
      expect(refs.map((r) => r.display), bad).not.toContain(bad);
    }
    expect(s.sceneFacts?.present ?? []).not.toContain('the Scale priests');
    expect(s.sceneFacts?.props ?? []).toContain('wrapped relic');
  });

  it('a first non-move turn pays no "reached"; walking out to Lowmarket pays it once', () => {
    const s = seed76();
    const here = s.currentLocation!;
    const first = xpTurn(s, 'Inspect the wrapped relic', here, here, 1);
    expect(first.notes.join('\n')).not.toMatch(/reached/i);
    const walked = xpTurn({ ...s, sandboxAwardKeys: first.awardKeys, places: first.places }, 'Travel toward Lowmarket', here, 'Lowmarket', 2);
    expect(walked.notes.filter((n) => /reached Lowmarket/.test(n))).toHaveLength(1);
    const after = { ...s, currentLocation: 'Lowmarket', sandboxAwardKeys: walked.awardKeys, places: walked.places };
    const again = xpTurn(after, 'Return to Lowmarket', here, 'Lowmarket', 5);
    expect(again.notes.join('\n')).not.toMatch(/reached/i);
  });
});

describe('every Summoned Pact hook card keeps its own place', () => {
  it('no card whose location only mentions a hub collapses to that hub', () => {
    const hubs = hubsForBibleId('summoned-pact');
    let mentionOnly = 0;
    for (const raw of summonedPact.openingHooks ?? []) {
      const card = normalizeOpeningHookCard(raw);
      if (!card.location) continue;
      const compiled = compileOpeningCard('summoned-pact', card.text, card.page1)!;
      const loc = card.location.toLowerCase();
      for (const hub of hubs) {
        const names = [hub.name, ...(hub.aliases ?? [])].map((n) => n.toLowerCase().replace(/^(?:the|a|an)\s+/, '')).filter((n) => n.length >= 5);
        if (!names.some((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(loc))) continue;
        const heads = names.map((n) => n.split(' ').pop());
        if (heads.includes(placeHeadNoun(card.location))) continue;
        mentionOnly++;
        expect(compiled.place, card.location).not.toBe(hub.name);
      }
    }
    expect(mentionOnly).toBeGreaterThan(0);
  });
});
