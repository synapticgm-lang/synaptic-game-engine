import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { ensureSpokenAnswer } from './spokenAnswer';
import type { GameState, LogEntry } from './types';

const CAMP = 'Pellane War Camp';

/** t10-29z8f summoned-pact T2–T3: Captain Sera Quill at the war camp. */
function camp(log: LogEntry[] = [], withSera = true): GameState {
  const state = createInitialState();
  state.campaignBibleId = 'summoned-pact';
  state.engineMode = 'litrpg';
  state.currentLocation = CAMP;
  state.character = { ...state.character, name: 'Jax' };
  state.openingEstablishment = { pending: [], answers: {}, complete: true, sceneWritten: true, castNpcIds: ['sp-npc-2'] } as never;
  state.npcMemories = withSera
    ? [{
        npcId: 'sp-npc-2',
        npcName: 'Captain Sera Quill',
        aliases: ['Sera Quill', 'Sera'],
        disposition: 'neutral',
        facts: ['Bible roster: Crown handler'],
        lastSeenTurn: 1,
        location: CAMP,
      }]
    : [];
  state.sceneFacts = { props: [], present: withSera ? ['Captain Sera Quill', 'bystanders'] : [], crowd: 'present', noise: 'quiet', lastBeat: '', updatedTurn: 1 };
  state.log = log;
  return state;
}

const quotes = (s: string) => s.match(/["“][^"“”]+["”]/g) ?? [];

/** The committed T3 draft: the question is reported, nobody speaks. */
const WHO_DRAFT =
  'Jax stayed flat in the scraped dirt at Pellane War Camp and asked the armored woman who she was before they moved a muscle. The horn sounded twice again past the crates and she glanced toward the tree line without ever letting go of the pommel at her hip.';
/** The committed T2 draft: "she said it" with no words. */
const WANT_DRAFT =
  'Jax pushed up off the scraped dirt at Pellane War Camp and asked Captain Sera Quill straight what she wanted from them. Her hand never left the pommel at her hip while she said it, and the drizzle kept tapping the dented plate over her shoulder.';

describe('spoken answer after the writer (who / want / where)', () => {
  it('a who question with a person here and no quote gains one quoted line in their own words', () => {
    const out = ensureSpokenAnswer(WHO_DRAFT, camp(), 'Who are you');
    expect(out.prose.startsWith(WHO_DRAFT)).toBe(true);
    expect(quotes(out.prose)).toEqual(['"Captain Sera Quill,"']);
    expect(out.answer).toMatchObject({ status: 'added', speaker: 'Captain Sera Quill', source: 'sheet' });
  });

  it('a draft that already has a quote is unchanged', () => {
    const draft = `${WHO_DRAFT} "Sera Quill. Crown handler, and your keeper," she said.`;
    const out = ensureSpokenAnswer(draft, camp(), 'Who are you');
    expect(out.prose).toBe(draft);
    expect(out.answer.status).toBe('already-quoted');
    const named = `${WHO_DRAFT} Captain Sera Quill said, "Crown handler. You answer to me."`;
    expect(ensureSpokenAnswer(named, camp(), 'Who are you').prose).toBe(named);
  });

  it('a question with nobody here gains nothing', () => {
    const draft = 'Jax asked the empty camp who was in charge. Only the drizzle answered, ticking on the crates.';
    const out = ensureSpokenAnswer(draft, camp([], false), 'Who are you');
    expect(out.prose).toBe(draft);
    expect(out.answer.status).toBe('nobody-here');
  });

  it('a want question with no real line for that person adds nothing and logs the miss', () => {
    const out = ensureSpokenAnswer(WANT_DRAFT, camp(), 'Ask what they want');
    expect(out.prose).toBe(WANT_DRAFT);
    expect(out.answer).toEqual({ status: 'no-line', speaker: 'Captain Sera Quill' });
  });

  it('a want question reuses the last thing that person actually said', () => {
    const earlier: LogEntry = {
      id: 'gm-1',
      role: 'gm',
      content: 'Captain Sera Quill looked Jax over. "You will hold the line or you will be buried behind it. Pick." The horn sounded.',
      timestamp: 1,
    } as LogEntry;
    const out = ensureSpokenAnswer(WANT_DRAFT, camp([earlier]), 'Ask what they want');
    expect(quotes(out.prose)).toEqual(['"You will hold the line or you will be buried behind it."']);
    expect(out.answer).toMatchObject({ status: 'added', source: 'last-said' });
  });

  it('a turn that is not a who / want / where question is untouched', () => {
    const out = ensureSpokenAnswer(WHO_DRAFT, camp(), 'Look around');
    expect(out.prose).toBe(WHO_DRAFT);
    expect(out.answer.status).toBe('not-asked');
  });
});
