/**
 * Instant opening stitch — one authored page1 + optional cover ask.
 * Never blocks New Game on callGm. Variety = which hook card the seed picked.
 */

import type { CampaignBible, OpeningPrompt, OpeningPromptKind } from '@/data/campaigns/types';
import type { GameState } from './types';
import { resolveActiveCampaignBible } from './campaignSeed';
import {
  isAloneArrivalOpening,
  isEarthOriginPrompt,
  resolveLockedOpeningPlace,
  resolveOpeningHookPick,
} from './openingEstablishment';

function hashSeed(raw: string): number {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickBank<T>(bank: readonly T[], seed: string, salt: string): T {
  const idx = hashSeed(`${seed}|${salt}`) % bank.length;
  return bank[idx]!;
}

const PRESSURE_CROWD = [
  'Someone is already deciding what you are worth.',
  'Eyes find you before anyone speaks.',
  'The next word in this room will cost something.',
  'Nobody looks ready to wait long.',
  'A scribe has a slate ready and an empty line.',
  'Two people start a sentence at the same time and both stop.',
  'Whoever holds rank here has not decided if you are cargo.',
  'Someone takes a half-step closer, then thinks better of it.',
  'The offer is still in the air — kit, oath, or a door — and nobody has handed it over.',
  'A voice at the edge says your arrival was not the plan.',
] as const;

const PRESSURE_ALONE = [
  'The panel is the only thing that treats you as real.',
  'Nothing else moves in this room.',
  'Whatever pulled you here did not stay to explain.',
  'Dust and broken stone — no footsteps but yours.',
  'The doorway stays empty. No one is coming in to greet you.',
  'If there was a rite, the people who ran it are already gone.',
  'You could stand up. Nothing in the room argues about it.',
  'The quiet is not peaceful. It is unfinished.',
] as const;

const NAME_ASKS_CROWD = [
  'Someone in the room needs a name for you. What do they call you?',
  'A handler waits on a name before they will speak plainly. What is it?',
  'They will not move until you give them something to write. What name?',
  'A slate tilts toward you. First word they will accept: your name.',
  'Someone asks it like a roll-call, not a kindness. What name?',
  'They need a name before they will say what they want. What is yours?',
] as const;

/** Tabletop weave — place-neutral. Never handler / slate / cargo / “someone in the room”. */
const NAME_ASKS_TABLETOP = [
  'What name do they get from you?',
  'They want a name before they will deal with you. What is it?',
  'What do you call yourself here?',
] as const;

const NAME_ASKS_ALONE = [
  'The panel waits on a name. What do you enter?',
  'Nobody else is here to ask. What name do you give the panel?',
  'A blank line sits on the panel. What name?',
] as const;

const LOOK_ASKS = [
  'You look down. You are still wearing what the light left on you. What is it?',
  'Your clothes survived the pull. What are you actually wearing?',
  'Fabric, seams, whatever you had on — name it before the story invents armor.',
] as const;

const KIT_ASKS = [
  'Pockets, bag, whatever rode with you. What is actually on you?',
  'What stayed in your pockets and bag through the light? Everyday things only.',
  'Pat yourself down. What is really on you?',
] as const;

const CONTINUE_BRIDGES = [
  'The room holds still around you.',
  'Dust settles. The blue panel waits.',
  'Nothing else has entered the room.',
] as const;

const ALONE_ROOM_GROUND = [
  'Broken stone under your hands. A dark doorway opens into the next chamber. The blue panel waits at eye level.',
  'Rubble piles against one wall. A doorway deeper in along the corridor. Dust motes in the panel-light.',
  'A half-collapsed arch over a corridor threshold, a scatter of debris, and that private blue glow — nothing else moves.',
] as const;

const CROWD_ROOM_GROUND = [
  'The people who were dealing with you are still here, waiting on your next move.',
  'Eyes stay on you. The offer — or the demand — has not left the room.',
  'Whatever they wanted from you is still on the table.',
] as const;

const DEFAULT_LOOK = 'everyday street clothes';

export function defaultStarterLook(): string {
  return DEFAULT_LOOK;
}

/** Drop Earth-origin covers. LitRPG owns panel/handler name banks; other modes keep their bible asks. */
export function applyOpeningContract(
  prompts: OpeningPrompt[],
  bible: CampaignBible | undefined,
  alone: boolean,
  seed: string
): OpeningPrompt[] {
  const mode = bible?.engineMode;
  return prompts
    .filter((p) => !(p.kind === 'location' && isEarthOriginPrompt(p)))
    .map((p) => {
      if (p.kind === 'name') {
        if (mode === 'litrpg') {
          const bank = alone ? NAME_ASKS_ALONE : NAME_ASKS_CROWD;
          return {
            ...p,
            style: alone ? ('system' as const) : (p.style ?? 'inworld'),
            question: pickBank(bank, seed, `name|${alone ? 'a' : 'c'}`),
          };
        }
        if (mode === 'dnd') {
          return {
            ...p,
            question: pickBank(NAME_ASKS_TABLETOP, seed, 'name|dnd'),
          };
        }
        return p;
      }
      if (mode === 'litrpg' && p.kind === 'appearance') {
        return { ...p, question: pickBank(LOOK_ASKS, seed, 'look') };
      }
      if (mode === 'litrpg' && p.kind === 'kit') {
        return { ...p, question: pickBank(KIT_ASKS, seed, 'kit') };
      }
      return p;
    });
}

/** Seed look so the paper-doll is never empty shoulders on turn zero. */
export function ensureStarterLookCharacter<T extends GameState['character']>(character: T): T {
  const appearance = character.appearance?.trim();
  if (appearance && !/^(unknown|n\/a|none|tbd)$/i.test(appearance)) return character;
  return { ...character, appearance: DEFAULT_LOOK };
}

function baseSceneFromCard(state: GameState): string {
  const a = state.openingEstablishment?.answers ?? {};
  const where = a.where || state.currentLocation || 'where you already were';
  const folk = a.folk || a.form || '';
  const folkBit = folk ? ` You are ${folk}.` : '';
  const bible = resolveActiveCampaignBible(state);
  const picked = resolveOpeningHookPick(bible, state.seed);
  const hook = state.openingEstablishment?.pickedHookFallback?.trim()
    || picked?.page1?.trim()
    || picked?.fallback
    || state.openingEstablishment?.pickedHook?.trim()
    || picked?.text;
  const looksLikePointers = !!hook && /^(Place:|Location:|Who is here|Why this happened|Opening offer)/m.test(hook);
  if (looksLikePointers) {
    return (
      picked?.page1
      || picked?.fallback
      || `You are in ${state.currentLocation || where}.${folkBit} People in the scene are already reacting.`
    );
  }
  if (hook) return hook;
  if (/system integration|every human on earth/i.test(state.campaignPremise ?? '')) {
    return `You are still in ${where} — same morning, same life — while the sky stays torn and a blue panel hangs at eye level.${folkBit} People nearby are shouting.`;
  }
  return `You are in ${where}.${folkBit} The scene that was already moving is still moving.`;
}

function bodyAlreadyAsksCover(body: string, cover: string): boolean {
  const hay = body.toLowerCase();
  if (/what name|what do they call|designation|what do you enter/.test(hay)) return true;
  const slice = cover.trim().slice(0, 24).toLowerCase();
  return slice.length > 8 && hay.includes(slice);
}

/**
 * Instant first page — one authored paragraph + optional cover ask. No collage.
 */
export function stitchOpeningScene(state: GameState): string {
  const body = baseSceneFromCard(state).trim();
  const cover = state.openingEstablishment?.pending[0]?.question?.trim();
  if (!cover || bodyAlreadyAsksCover(body, cover)) return body;
  return `${body}\n\n${cover}`;
}

/** Alias for older call sites. */
export function synthesizeOpeningScene(state: GameState): string {
  return stitchOpeningScene(state);
}

/** Strip leading "alone in …" meta from place labels so grammar stays clean. */
function cleanPlaceLabel(place: string): string {
  return place
    .replace(/^\s*alone\s+in\s+/i, '')
    .replace(/^\s*alone\s*,\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim() || 'here';
}

/**
 * After weave covers — continue locally. No network.
 * Advance room detail / agency only — do not rehash locked name/look/kit as a paragraph.
 */
export function stitchOpeningContinue(state: GameState): string {
  const seed = state.seed ?? state.saveId ?? '0';
  const bridge = pickBank(CONTINUE_BRIDGES, seed, 'continue');
  const a = state.openingEstablishment?.answers ?? {};
  const place = cleanPlaceLabel(resolveLockedOpeningPlace(state, a) || a.where || state.currentLocation || 'here');
  const alone = isAloneArrivalOpening(state);
  const ground = alone
    ? pickBank(ALONE_ROOM_GROUND, seed, 'continue-ground')
    : pickBank(CROWD_ROOM_GROUND, seed, 'continue-ground');
  const pressure = pickBank(alone ? PRESSURE_ALONE : PRESSURE_CROWD, seed, 'continue-pressure');
  return `${bridge} You are in ${place}. ${ground} ${pressure}

1. Get your bearings
2. ${alone ? 'Search the ruin' : 'Speak to whoever is dealing with you'}
3. Check the blue panel
4. ${alone ? 'Find a way out' : 'Walk away from their offer'}`;
}

/** True when this tier may attempt a non-blocking polish (reserved; page-1 never waits). */
export function openingPolishAllowed(tier: string | null | undefined): boolean {
  const t = (tier ?? 'free').toLowerCase();
  return t === 'mid' || t === 'high' || t === 'admin' || t === 'byok';
}

export type OpeningAskKind = OpeningPromptKind;
