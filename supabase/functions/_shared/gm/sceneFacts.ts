import type { GameState, SceneFacts } from './types.ts';

const EMPTY_STREET =
  /\b(eerily silent|unnervingly quiet|empty (?:street|buildings|road)|no one (?:is )?(?:here|around|responds)|deserted|abandoned street|world feels frozen|holding its breath)\b/i;
const CROWD =
  /\b(people|crowd|bystanders?|passers?[- ]?by|someone nearby|shouting|scream(?:ing)?|yelling)\b/i;
const SHOUTING = /\b(shout(?:ing)?|scream(?:ing)?|yell(?:ing)?|panic|crying out)\b/i;
const QUIET = /\b(silent|silence|quiet|stillness|hushed)\b/i;
const PANEL = /\b(blue panel|system panel|blue screen)\b/i;
const CRACKS = /\b(crack(?:ing|s)?|crystal|concrete)\b/i;
const DIALOGUE = /"[^"]{3,}"|<\s*dialogue\b/i;
const TIME_PASSED = /\b(hours? later|next (?:day|morning)|after (?:a |the )?crowd (?:left|fled|scattered)|street (?:cleared|emptied))\b/i;

export function emptySceneFacts(turn = 0): SceneFacts {
  return {
    crowd: 'unknown',
    noise: 'unknown',
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: turn,
  };
}

export function extractSceneFacts(narrative: string, prev?: SceneFacts, turn = 0): SceneFacts {
  const text = narrative.replace(/<system>[\s\S]*?<\/system>/gi, ' ');
  const emptied = EMPTY_STREET.test(text) && !CROWD.test(text);
  const crowdPresent = CROWD.test(text) && !emptied;
  const shouting = SHOUTING.test(text);
  const quiet = QUIET.test(text) && !shouting;

  let crowd: SceneFacts['crowd'] = prev?.crowd ?? 'unknown';
  if (emptied) crowd = 'none';
  else if (crowdPresent) crowd = 'present';

  let noise: SceneFacts['noise'] = prev?.noise ?? 'unknown';
  if (shouting) noise = 'shouting';
  else if (quiet && crowd !== 'present') noise = 'quiet';
  else if (crowd === 'present' && noise === 'unknown') noise = 'voices';

  const present = new Set(prev?.present ?? []);
  if (crowd === 'present') present.add('bystanders');
  if (crowd === 'none') present.delete('bystanders');
  if (PANEL.test(text)) present.add('blue panel');

  const props = new Set(prev?.props ?? []);
  if (PANEL.test(text)) props.add('blue panel');
  if (CRACKS.test(text)) props.add('cracked street');

  const lastBeat = [
    crowd === 'present' ? 'people are present' : crowd === 'none' ? 'street empty' : '',
    noise === 'shouting' ? 'people are shouting' : noise === 'quiet' ? 'it is quiet' : '',
    PANEL.test(text) ? 'System panel is visible' : '',
  ].filter(Boolean).join('; ');

  return {
    crowd,
    noise,
    present: [...present],
    props: [...props],
    lastBeat: lastBeat || prev?.lastBeat || '',
    updatedTurn: turn,
  };
}

export function mergeSceneFacts(prev: SceneFacts | undefined, next: SceneFacts): SceneFacts {
  if (!prev) return next;
  return {
    crowd: next.crowd !== 'unknown' ? next.crowd : prev.crowd,
    noise: next.noise !== 'unknown' ? next.noise : prev.noise,
    present: Array.from(new Set([...prev.present, ...next.present])),
    props: Array.from(new Set([...prev.props, ...next.props])),
    lastBeat: next.lastBeat || prev.lastBeat,
    updatedTurn: next.updatedTurn,
  };
}

export function seedOpeningSceneFacts(state: GameState): SceneFacts {
  const integration = /system integration|every human on earth|integration protocol/i.test(
    state.campaignPremise ?? ''
  );
  if (integration) {
    return {
      crowd: 'present',
      noise: 'shouting',
      present: ['bystanders', 'blue panel'],
      props: ['blue panel', 'cracked street'],
      lastBeat: 'Crowd on the street, shouting; System panel at eye level.',
      updatedTurn: state.turn,
    };
  }
  return extractSceneFacts(
    state.log.filter((e) => e.role === 'gm').slice(-1)[0]?.content ?? '',
    state.sceneFacts,
    state.turn
  );
}

export function formatSceneFactsForPrompt(facts?: SceneFacts): string {
  if (!facts || (facts.crowd === 'unknown' && !facts.lastBeat)) return '';
  const present = facts.present.length ? facts.present.join(', ') : 'none listed';
  const props = facts.props.length ? facts.props.join(', ') : 'none listed';
  return `SCENE FACTS (AUTHORITY — last committed beat; do not invert without time passing):
Crowd: ${facts.crowd}
Noise: ${facts.noise}
Present: ${present}
Props: ${props}
Last beat: ${facts.lastBeat || '—'}
If crowd is present, people are still here. Do not write an empty or silent street.
If noise is shouting, the shouting is still happening unless you narrate it stopping.`;
}

/** True when new prose wipes a bound crowd/noise without time passing. */
export function detectSceneContradiction(prev: SceneFacts | undefined, narrative: string): string | null {
  if (!prev) return null;
  if (TIME_PASSED.test(narrative)) return null;
  const emptied = EMPTY_STREET.test(narrative);
  if (prev.crowd === 'present' && emptied) {
    return 'Crowd was present; new prose emptied or silenced the street.';
  }
  if (prev.noise === 'shouting' && emptied && !SHOUTING.test(narrative)) {
    return 'People were shouting; new prose made the street silent.';
  }
  return null;
}

export function rewriteContinuityBreak(
  state: GameState,
  playerAction: string,
  _brokenNarrative: string
): string {
  const facts = state.sceneFacts;
  const place = state.currentLocation || 'the street';
  const crowdBit = facts?.crowd === 'present' || facts?.noise === 'shouting'
    ? 'The people who were already here are still here. The shouting did not vanish.'
    : 'What you already saw is still happening.';
  const panelBit = facts?.props.includes('blue panel') || facts?.present.includes('blue panel')
    ? ' The blue panel still hangs at eye level.'
    : '';
  const asked = /\b(shout|yell|call out|ask|tell|speak|talk|everyone|anybody|anyone)\b/i.test(playerAction);
  if (asked) {
    return (
      `${crowdBit}${panelBit} You shout so the nearest faces can hear. `
      + `A window scrapes open. Someone leans out, pale, staring at a matching screen. `
      + `"You see it too?" they call. "I didn't put it there." `
      + `Whatever this is, it is not only yours.`
    );
  }
  return `${crowdBit}${panelBit} You are still in ${place}. The last beat holds.`;
}

export function applyCommittedNarrative(
  state: GameState,
  narrative: string,
  turn: number
): SceneFacts {
  const extracted = extractSceneFacts(narrative, state.sceneFacts, turn);
  if (state.sceneFacts?.crowd === 'present' && extracted.crowd === 'none' && !TIME_PASSED.test(narrative)) {
    return {
      ...mergeSceneFacts(state.sceneFacts, extracted),
      crowd: 'present',
      noise: state.sceneFacts.noise === 'shouting' ? 'shouting' : extracted.noise,
      lastBeat: state.sceneFacts.lastBeat,
      updatedTurn: turn,
    };
  }
  return mergeSceneFacts(state.sceneFacts, extracted);
}
