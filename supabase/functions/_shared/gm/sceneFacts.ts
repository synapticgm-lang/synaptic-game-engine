import type { GameState, SceneFacts } from './types.ts';
import { applyFactLocks } from './factLocks.ts';
import { applySearchContinuityToFacts } from './searchContinuity.ts';
import { harvestCrowdIntoSceneFacts } from './crowdAuthority.ts';
import { harvestHookIntoSceneFacts } from './hookLock.ts';
import { filterChromeFromPresent } from './chromeAuthority.ts';
import { harvestCameraIntoSceneFacts } from './travelAuthority.ts';
import {
  clearVignetteOnHubLeave,
  harvestVignetteIntoSceneFacts,
} from './vignetteLock.ts';
import { matchHub, hubsForBibleId } from './outdoorHubs.ts';
import { applyCardCrowdToFacts, buildSnapshotGist } from './openingPointerCard.ts';

const EMPTY_STREET =
  /\b(eerily silent|unnervingly quiet|empty (?:street|buildings|road)|no one (?:is )?(?:here|around|responds)|deserted|abandoned street|world feels frozen|holding its breath)\b/i;
const CROWD =
  /\b(people|crowd|bystanders?|passers?[- ]?by|someone nearby|shouting|scream(?:ing)?|yelling)\b/i;
const SHOUTING = /\b(shout(?:ing)?|scream(?:ing)?|yell(?:ing)?|panic|crying out)\b/i;
const QUIET = /\b(silent|silence|quiet|stillness|hushed)\b/i;
const PANEL = /\b(blue panel|system panel|blue screen)\b/i;
const CRACKS = /\b(crack(?:ing|s)?|crystal|concrete)\b/i;
const DIALOGUE = /"[^"]{3,}"|<\s*dialogue\b/i;
/** Narrated time that actually clears a crowd — not "hours ago" on turn one. */
const TIME_PASSED = /\b(after (?:a |the )?crowd (?:left|fled|scattered)|street (?:cleared|emptied)|crowd (?:thins|disperses|moves on)|(?:was|were) not always (?:so|this way|empty)|festival (?:is |has )?(?:over|ended|concluded)|(?:once|earlier) (?:there (?:was|were)|crowded))\b/i;

// Pack 12 Extended Pattern Detection
const TIME_DAWN = /\b(dawn|daybreak|first light|sunrise begins)\b/i;
const TIME_MORNING = /\b(morning|sunrise|early (?:day|light)|a\.?m\.?)\b/i;
const TIME_MIDDAY = /\b(midday|noon|mid-day|high sun)\b/i;
const TIME_AFTERNOON = /\b(afternoon|p\.?m\.?(?! 1[01]| [89]))\b/i;
const TIME_DUSK = /\b(dusk|twilight|fading light)\b/i;
const TIME_EVENING = /\b(evening|sundown|sunset)\b/i;
const TIME_NIGHT = /\b(night(?:fall)?|darkness|moon(?:light)?|stars|midnight)\b/i;

const WEATHER_RAIN = /\b(rain(?:ing)?|drizzle|downpour|wet|soaked)\b/i;
const WEATHER_STORM = /\b(storm(?:ing)?|thunder|lightning|gale)\b/i;
const WEATHER_SNOW = /\b(snow(?:ing)?|blizzard|frost|ice)\b/i;
const WEATHER_FOG = /\b(fog(?:gy)?|mist(?:y)?|haze)\b/i;
const WEATHER_CLOUDY = /\b(cloud(?:y|s)?|overcast|grey sky)\b/i;
const WEATHER_CLEAR = /\b(clear|sunny|bright|blue sky)\b/i;

const INDOOR_CUES = /\b(inside|indoors?|room|chamber|hall|building|ceiling|walls?\b(?! street)|floor|corridor)\b/i;
const OUTDOOR_CUES = /\b(outside|outdoors?|street|road|sky|stars|sun|rain (?:on|soaks)|wind|field|open air)\b/i;

const TENSION_COMBAT = /\b(attack(?:ing|s)?|combat|fighting|strike(?:s)?|dodge(?:s)?|parry)\b/i;
const TENSION_DANGER = /\b(danger(?:ous)?|threat(?:en)?|hostile|menac(?:ing|e)|growl(?:s|ing)?)\b/i;
const TENSION_TENSE = /\b(tense|wary|cautious|alert|ready|on guard)\b/i;
const TENSION_CALM = /\b(calm|peaceful|quiet|safe|relax(?:ed|ing)?|at ease)\b/i;

export function emptySceneFacts(turn = 0): SceneFacts {
  return {
    crowd: 'unknown',
    noise: 'unknown',
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: turn,
    timeOfDay: 'unknown',
    weather: 'unknown',
    indoor: undefined,
    tension: 'unknown',
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

  const props = new Set(prev?.props ?? []);
  if (PANEL.test(text)) props.add('blue panel');
  if (CRACKS.test(text)) props.add('cracked street');
  if (/\b(?:wooden |iron-bound |sturdy )?(?:chest|coffer|trunk)\b/i.test(text)) props.add('wooden chest');
  if (/\b(?:silver |tarnished )?locket\b/i.test(text)) props.add('locket');

  // Pack 12 Extended Extraction
  let timeOfDay: SceneFacts['timeOfDay'] = prev?.timeOfDay ?? 'unknown';
  if (TIME_DAWN.test(text)) timeOfDay = 'dawn';
  else if (TIME_MORNING.test(text)) timeOfDay = 'morning';
  else if (TIME_MIDDAY.test(text)) timeOfDay = 'midday';
  else if (TIME_AFTERNOON.test(text)) timeOfDay = 'afternoon';
  else if (TIME_DUSK.test(text)) timeOfDay = 'dusk';
  else if (TIME_EVENING.test(text)) timeOfDay = 'evening';
  else if (TIME_NIGHT.test(text)) timeOfDay = 'night';

  let weather: SceneFacts['weather'] = prev?.weather ?? 'unknown';
  if (WEATHER_STORM.test(text)) weather = 'storm';
  else if (WEATHER_RAIN.test(text)) weather = 'rain';
  else if (WEATHER_SNOW.test(text)) weather = 'snow';
  else if (WEATHER_FOG.test(text)) weather = 'fog';
  else if (WEATHER_CLOUDY.test(text)) weather = 'cloudy';
  else if (WEATHER_CLEAR.test(text)) weather = 'clear';

  let indoor: boolean | undefined = prev?.indoor;
  if (INDOOR_CUES.test(text)) indoor = true;
  else if (OUTDOOR_CUES.test(text)) indoor = false;

  let tension: SceneFacts['tension'] = prev?.tension ?? 'unknown';
  if (TENSION_COMBAT.test(text)) tension = 'combat';
  else if (TENSION_DANGER.test(text)) tension = 'danger';
  else if (TENSION_TENSE.test(text)) tension = 'tense';
  else if (TENSION_CALM.test(text) && tension !== 'combat') tension = 'calm';

  const lastBeat = [
    crowd === 'present' ? 'people are present' : crowd === 'none' ? 'street empty' : '',
    noise === 'shouting' ? 'people are shouting' : noise === 'quiet' ? 'it is quiet' : '',
    PANEL.test(text) ? 'System panel is visible' : '',
    timeOfDay && timeOfDay !== 'unknown' ? `${timeOfDay}` : '',
    indoor !== undefined ? (indoor ? 'indoors' : 'outdoors') : '',
  ].filter(Boolean).join('; ');

  return {
    crowd,
    noise,
    present: filterChromeFromPresent([...present]),
    props: [...props],
    lastBeat: lastBeat || prev?.lastBeat || '',
    updatedTurn: turn,
    timeOfDay,
    weather,
    indoor,
    tension,
    crowdCount: prev?.crowdCount,
    hookLock: prev?.hookLock,
    cameraLock: prev?.cameraLock,
    lastPlayerIntent: prev?.lastPlayerIntent,
    lastKill: prev?.lastKill,
    pendingSpawnPreface: prev?.pendingSpawnPreface,
    engineRecoveryStreak: prev?.engineRecoveryStreak,
    openVignette: prev?.openVignette,
    lastSnapshotGist: prev?.lastSnapshotGist,
  };
}

export function mergeSceneFacts(prev: SceneFacts | undefined, next: SceneFacts): SceneFacts {
  if (!prev) return next;
  const asList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const prevPresent = asList(prev.present);
  const nextPresent = asList(next.present);
  const prevProps = asList(prev.props);
  const nextProps = asList(next.props);
  return {
    crowd: next.crowd !== 'unknown' ? next.crowd : prev.crowd,
    noise: next.noise !== 'unknown' ? next.noise : prev.noise,
    present: filterChromeFromPresent(Array.from(new Set([...prevPresent, ...nextPresent]))),
    props: Array.from(new Set([...prevProps, ...nextProps])),
    lastBeat: next.lastBeat || prev.lastBeat,
    updatedTurn: next.updatedTurn,
    timeOfDay: next.timeOfDay !== 'unknown' ? next.timeOfDay : prev.timeOfDay,
    weather: next.weather !== 'unknown' ? next.weather : prev.weather,
    indoor: next.indoor !== undefined ? next.indoor : prev.indoor,
    tension: next.tension !== 'unknown' ? next.tension : prev.tension,
    searchedEmpty: Array.from(new Set([...asList(prev.searchedEmpty), ...asList(next.searchedEmpty)])),
    emptyContainers: Array.from(new Set([...asList(prev.emptyContainers), ...asList(next.emptyContainers)])),
    crowdCount: next.crowdCount ?? prev.crowdCount,
    hookLock: next.hookLock ?? prev.hookLock,
    cameraLock: next.cameraLock ?? prev.cameraLock,
    lastPlayerIntent: next.lastPlayerIntent ?? prev.lastPlayerIntent,
    lastKill: next.lastKill ?? prev.lastKill,
    pendingSpawnPreface:
      next.pendingSpawnPreface !== undefined
        ? next.pendingSpawnPreface
        : prev.pendingSpawnPreface,
    engineRecoveryStreak:
      next.engineRecoveryStreak !== undefined
        ? next.engineRecoveryStreak
        : prev.engineRecoveryStreak,
    openVignette: next.openVignette ?? prev.openVignette,
    lastSnapshotGist: next.lastSnapshotGist ?? prev.lastSnapshotGist,
  };
}

export function seedOpeningSceneFacts(state: GameState): SceneFacts {
  const hookLock = state.sceneFacts?.hookLock ?? state.openingEstablishment?.hookLock;
  const integration = /system integration|every human on earth|integration protocol/i.test(
    state.campaignPremise ?? ''
  );
  if (integration) {
    return applyCardCrowdToFacts(state, {
      crowd: 'present',
      noise: 'shouting',
      present: ['bystanders'],
      props: ['blue panel', 'cracked street'],
      lastBeat: 'Crowd on the street, shouting; System panel at eye level.',
      updatedTurn: state.turn,
      timeOfDay: 'morning',
      weather: 'clear',
      indoor: false,
      tension: 'tense',
      hookLock,
      crowdCount: 5,
    });
  }

  const alone = state.openingEstablishment?.aloneArrival === true;
  const seeded = applyCardCrowdToFacts(state, {
    crowd: alone ? 'none' : 'present',
    noise: alone ? 'quiet' : 'voices',
    present: [],
    props: ['blue panel'],
    lastBeat: alone ? 'The room is empty of other people.' : 'Scene not yet numbered.',
    updatedTurn: state.turn,
    timeOfDay: 'unknown',
    weather: 'unknown',
    indoor: undefined,
    tension: 'tense',
    hookLock,
    crowdCount: alone ? 0 : undefined,
  });
  if (!alone) return seeded;

  const extracted = extractSceneFacts(
    state.log.filter((e) => e.role === 'gm').slice(-1)[0]?.content ?? '',
    state.sceneFacts,
    state.turn
  );
  return applyCardCrowdToFacts(state, {
    ...extracted,
    hookLock: extracted.hookLock ?? hookLock,
    crowd: 'none',
    crowdCount: 0,
    present: [],
  });
}

export function formatSceneFactsForPrompt(facts?: SceneFacts): string {
  if (!facts || (facts.crowd === 'unknown' && !facts.lastBeat)) return '';
  const present = facts.present.length ? facts.present.join(', ') : 'none listed';
  const props = facts.props.length ? facts.props.join(', ') : 'none listed';
  const countLine =
    typeof facts.crowdCount === 'number' ? `\nCrowd count: ${facts.crowdCount}` : '';
  return `SCENE FACTS (AUTHORITY — last committed beat; do not invert without time passing):
Crowd: ${facts.crowd}${countLine}
Noise: ${facts.noise}
Present: ${present}
Props: ${props}
Last beat: ${facts.lastBeat || '—'}
If crowd is present, people are still here. Do not write an empty or silent street.
If noise is shouting, the shouting is still happening unless you narrate it stopping.
Do not write "hours ago" or "hours later" unless the world clock has advanced.
Do not list inventory or pat pockets on look-around.`;
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
  if (prev.noise === 'shouting' && QUIET.test(narrative) && SHOUTING.test(narrative)) {
    return 'Prose claims silence while people are still shouting.';
  }
  return null;
}

export function rewriteContinuityBreak(
  state: GameState,
  playerAction: string,
  brokenNarrative: string
): string {
  const next = applyFactLocks(state, brokenNarrative, playerAction);
  if (!detectSceneContradiction(state.sceneFacts, next)) return next;
  const beat = (state.sceneFacts?.lastBeat ?? '').trim();
  if (!beat) return next;
  const needle = beat.slice(0, Math.min(24, beat.length)).toLowerCase();
  if (needle && next.toLowerCase().includes(needle)) return next;
  const clause = /[.!?]$/.test(beat) ? beat : `${beat}.`;
  return `${next} ${clause}`.replace(/\s+/g, ' ').trim();
}

export function applyCommittedNarrative(
  state: GameState,
  narrative: string,
  turn: number,
  playerInput?: string
): SceneFacts {
  const extracted = extractSceneFacts(narrative, state.sceneFacts, turn);
  let merged: SceneFacts;
  const crowdWasHere =
    state.sceneFacts?.crowd === 'present' || state.sceneFacts?.crowd === 'sparse';
  if (crowdWasHere && extracted.crowd === 'none' && !TIME_PASSED.test(narrative)) {
    merged = {
      ...mergeSceneFacts(state.sceneFacts, extracted),
      crowd: state.sceneFacts!.crowd,
      noise: state.sceneFacts.noise === 'shouting' ? 'shouting' : extracted.noise,
      lastBeat: state.sceneFacts.lastBeat,
      updatedTurn: turn,
      crowdCount: state.sceneFacts.crowdCount,
    };
  } else {
    merged = mergeSceneFacts(state.sceneFacts, extracted);
  }
  if (playerInput) {
    const withSearch = applySearchContinuityToFacts(
      merged,
      playerInput,
      narrative,
      turn,
      state.currentLocation ?? state.locationSheet?.name
    );
    if (withSearch) merged = withSearch;
  }
  const crowded = harvestCrowdIntoSceneFacts(merged, narrative, turn);
  const hooked = harvestHookIntoSceneFacts(crowded, narrative, turn, playerInput);
  const camera = harvestCameraIntoSceneFacts(
    hooked,
    narrative,
    turn,
    playerInput,
    state.currentLocation ?? state.locationSheet?.name
  );
  const loc = state.currentLocation ?? state.locationSheet?.name;
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), loc);
  let withVignette = harvestVignetteIntoSceneFacts(
    camera,
    narrative,
    turn,
    hub ? { id: hub.id, name: hub.name } : loc ? { id: loc, name: loc } : null,
    playerInput
  );
  withVignette =
    clearVignetteOnHubLeave(
      withVignette,
      state.previousLocationSheet?.name ?? state.sceneFacts?.cameraLock?.label,
      loc,
      (name) => matchHub(hubsForBibleId(state.campaignBibleId), name)?.id ?? null
    ) ?? withVignette;
  const withIntent = !playerInput?.trim()
    ? withVignette
    : (() => {
        const t = playerInput.replace(/\s+/g, ' ').trim();
        const family: NonNullable<SceneFacts['lastPlayerIntent']>['family'] =
          /\b(send me (?:back|home)|get me (?:out|back)|i refuse|i protest|i demand|back to (?:my )?(?:world|earth))\b/i.test(t)
            ? 'demand'
            : /\b(run away|flee|escape|retreat)\b/i.test(t)
              ? 'flee'
              : /\b(inspect|examine|look around|scan|get bearings)\b/i.test(t)
                ? 'inspect'
                : /\b(travel|enter|go through|walk through)\b/i.test(t)
                  ? 'travel'
                  : /\b(ask|talk|speak|say|tell)\b/i.test(t)
                    ? 'talk'
                    : 'other';
        return {
          ...withVignette,
          lastPlayerIntent: { family, text: t.slice(0, 160), turn },
        };
      })();
  return {
    ...withIntent,
    lastSnapshotGist: buildSnapshotGist({
      ...state,
      turn,
      sceneFacts: withIntent,
    }),
  };
}
