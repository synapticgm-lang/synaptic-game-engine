/**
 * Instant opening stitch — local first page from seed-picked cards + banks.
 * Never blocks New Game on callGm. Freshness = deck pick × independent banks.
 * See docs/research/opening-speed-fresh-choices-2026-08-20.md
 */

import type { CampaignBible, OpeningPrompt, OpeningPromptKind } from '@/data/campaigns/types';
import type { GameState } from './types';
import { resolveActiveCampaignBible } from './campaignSeed';
import {
  isAloneArrivalOpening,
  isEarthOriginPrompt,
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

/** Sensory / pressure spice so the same card still reads different each seed. */
const SENSORY_BANK = [
  'Dust hangs in the light.',
  'Cold soaks through your clothes.',
  'Somewhere, metal rings once and stops.',
  'The air smells of wet stone.',
  'A draft finds the back of your neck.',
  'Your ears still ring from the pull.',
  'Ash or chalk grit sticks to your palms.',
  'The quiet after the light is too clean.',
] as const;

const PRESSURE_CROWD = [
  'Someone is already deciding what you are worth.',
  'Eyes find you before anyone speaks.',
  'The next word in this room will cost something.',
  'Nobody looks ready to wait long.',
] as const;

const PRESSURE_ALONE = [
  'Nobody answers if you call.',
  'The panel is the only thing that treats you as real.',
  'The road, if there is one, is not in this room.',
  'Whatever pulled you here did not stay to explain.',
] as const;

const NAME_ASKS_CROWD = [
  'Someone in the room needs a name for you. What do they call you?',
  'A handler waits on a name before they will speak plainly. What is it?',
  'They will not move until you give them something to write. What name?',
] as const;

const NAME_ASKS_ALONE = [
  'Your blue panel waits on a designation. What name should it show?',
  'The panel blinks once for a name. What do you enter?',
  'No one is here to ask — only the panel. What name does it lock?',
] as const;

const LOOK_ASKS = [
  'You look down. You are still wearing what the light left on you. What is it?',
  'Your clothes survived the pull. What are you actually wearing?',
  'Fabric, seams, whatever you had on — name it before the story invents armor.',
] as const;

const KIT_ASKS = [
  'Pockets, bag, whatever rode with you. What is actually on you? Nothing invented for a fight.',
  'What stayed in your pockets and bag through the light? Everyday things only.',
  'Pat yourself down. What is really on you — not a starter sword.',
] as const;

const CONTINUE_BRIDGES = [
  'The room is still the same room. Your answers are locked in.',
  'Nothing reset. The light already happened.',
  'You are still here — look and kit as you named them.',
] as const;

const DEFAULT_LOOK = 'everyday street clothes';

export function defaultStarterLook(): string {
  return DEFAULT_LOOK;
}

/** Drop Earth-origin covers; vary remaining ask lines by seed; alone-voice when needed. */
export function applyOpeningContract(
  prompts: OpeningPrompt[],
  _bible: CampaignBible | undefined,
  alone: boolean,
  seed: string
): OpeningPrompt[] {
  return prompts
    .filter((p) => !(p.kind === 'location' && isEarthOriginPrompt(p)))
    .map((p) => {
      if (p.kind === 'name') {
        const bank = alone ? NAME_ASKS_ALONE : NAME_ASKS_CROWD;
        return {
          ...p,
          style: alone ? ('system' as const) : (p.style ?? 'inworld'),
          question: pickBank(bank, seed, `name|${alone ? 'a' : 'c'}`),
        };
      }
      if (p.kind === 'appearance') {
        return { ...p, question: pickBank(LOOK_ASKS, seed, 'look') };
      }
      if (p.kind === 'kit') {
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
    || picked?.fallback
    || state.openingEstablishment?.pickedHook?.trim()
    || picked?.text;
  const looksLikePointers = !!hook && /^(Place:|Who is here|Why this happened|Opening offer)/m.test(hook);
  if (looksLikePointers) {
    return (
      picked?.fallback
      || `You are in ${state.currentLocation || where}.${folkBit} People in the scene are already reacting.`
    );
  }
  if (hook) return hook;
  if (/system integration|every human on earth/i.test(state.campaignPremise ?? '')) {
    return `You are still in ${where} — same morning, same life — while the sky stays torn and a blue panel hangs at eye level.${folkBit} People nearby are shouting.`;
  }
  return `You are in ${where}.${folkBit} The scene that was already moving is still moving.`;
}

function spiceLines(state: GameState): string[] {
  const seed = state.seed ?? state.saveId ?? '0';
  const alone = isAloneArrivalOpening(state);
  const sensory = pickBank(SENSORY_BANK, seed, 'sensory');
  const pressure = pickBank(alone ? PRESSURE_ALONE : PRESSURE_CROWD, seed, 'pressure');
  return [sensory, pressure];
}

/**
 * Instant first page — authored card + seed banks. No network.
 */
export function stitchOpeningScene(state: GameState): string {
  const base = baseSceneFromCard(state).trim();
  const spice = spiceLines(state).filter((line) => !base.toLowerCase().includes(line.slice(0, 18).toLowerCase()));
  const body = spice.length ? `${base} ${spice.join(' ')}` : base;
  const cover = state.openingEstablishment?.pending[0]?.question;
  return cover ? `${body}\n\n${cover}` : body;
}

/** Alias for older call sites. */
export function synthesizeOpeningScene(state: GameState): string {
  return stitchOpeningScene(state);
}

/**
 * After weave covers — continue locally with locked look/kit. No network.
 */
export function stitchOpeningContinue(state: GameState): string {
  const seed = state.seed ?? state.saveId ?? '0';
  const bridge = pickBank(CONTINUE_BRIDGES, seed, 'continue');
  const a = state.openingEstablishment?.answers ?? {};
  const name = a.name || state.character.name;
  const look = a.wear || a.look || state.character.appearance || DEFAULT_LOOK;
  const kit = a.pockets || a.kit || '';
  const place = a.where || state.currentLocation || 'here';
  const alone = isAloneArrivalOpening(state);
  const nameBit = name && !/unknown/i.test(name) ? ` The panel (and anyone listening) has you as ${name}.` : '';
  const lookBit = ` You are wearing ${look}.`;
  const kitBit = kit ? ` On you: ${kit}.` : '';
  const aloneBit = alone
    ? ' The ruin is still empty of people.'
    : ' The people who were here are still dealing with you.';
  const pressure = pickBank(alone ? PRESSURE_ALONE : PRESSURE_CROWD, seed, 'continue-pressure');
  return `${bridge} You are still in ${place}.${nameBit}${lookBit}${kitBit}${aloneBit} ${pressure}

What do you do?
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
