/**
 * Instant opening stitch — one authored page1 + optional cover ask.
 * Never blocks New Game on callGm. Variety = which hook card the seed picked.
 */

import type { CampaignBible, OpeningPrompt, OpeningPromptKind } from '@/data/campaigns/types';
import type { GameState } from './types';
import { resolveActiveCampaignBible } from './campaignSeed';
import { cleanPlaceLabel } from './locationName';
import { isLockablePcName } from './pcNameAuthority';
import {
  isAloneArrivalOpening,
  isEarthOriginPrompt,
  openingCastLabel,
  resolveLockedOpeningPlace,
  resolveOpeningHookPick,
  shortCardWant,
} from './openingEstablishment';

export { cleanPlaceLabel };

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

function looksLikePointerDump(hook: string): boolean {
  return /^(Place:|Location:|Who is here|Why this happened|Opening offer)/m.test(hook);
}

function baseSceneFromCard(state: GameState): string {
  const a = state.openingEstablishment?.answers ?? {};
  const where = a.where || state.currentLocation || 'where you already were';
  const folk = a.folk || a.form || '';
  const folkBit = folk ? ` You are ${folk}.` : '';
  const bible = resolveActiveCampaignBible(state);
  const picked = resolveOpeningHookPick(bible, state.seed);
  const stored = state.openingEstablishment?.pickedHookFallback?.trim() || '';
  const hook =
    (stored && !looksLikePointerDump(stored) ? stored : '')
    || picked?.page1?.trim()
    || picked?.fallback?.trim()
    || '';
  if (hook && !looksLikePointerDump(hook)) return hook;
  if (looksLikePointerDump(hook) || looksLikePointerDump(state.openingEstablishment?.pickedHook ?? '')) {
    return (
      picked?.page1
      || picked?.fallback
      || `You are in ${state.currentLocation || where}.${folkBit} People in the scene are already reacting.`
    );
  }
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

function lockedCoverName(state: GameState): string | null {
  const n = (state.character?.name ?? state.openingEstablishment?.answers?.name ?? '').trim();
  if (!n || /unknown survivor/i.test(n) || !isLockablePcName(n)) return null;
  return n;
}

function continueIsAlone(state: GameState, place: string): boolean {
  if (state.openingEstablishment?.aloneArrival === true) return true;
  if (state.openingEstablishment?.aloneArrival === false) return false;
  return /\b(?:ruin|watchtower|barn|bathhouse|waystation|husk|shell|foundation)\b/i.test(place);
}

function inPlacePhrase(place: string): string {
  return /^(?:a|an|the)\s/i.test(place) ? `in ${place}` : `in the ${place}`;
}

/**
 * After page 1 — continue locally. No network, no pad list, no opener reprint.
 * Answers the typed line: where / why / name given / what they want.
 */
export function stitchOpeningContinue(state: GameState, playerInput = ''): string {
  const a = state.openingEstablishment?.answers ?? {};
  const place = cleanPlaceLabel(resolveLockedOpeningPlace(state, a) || a.where || state.currentLocation || 'here');
  const alone = continueIsAlone(state, place);
  const act = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const name = lockedCoverName(state);
  const here = inPlacePhrase(place);
  const want = shortCardWant(state);
  const who = openingCastLabel(state);
  const asksWhere = /\bwhere am i\b|\bwhere are we\b|\bwhere is this\b/i.test(act);
  const asksWhy =
    /\bwhy\b.*\bname\b|\bwhy should i\b|\bwant (?:that|my name|a name)\b|\bwhat'?s going on\b|\bgive you my name\b/i.test(
      act
    );
  const asksWant = /\bwhat (?:do you|d'?you) want\b/i.test(act);
  const asksWho =
    /\bwho (?:is|are) (?:it|that|you)\b|\bwho (?:is it that )?asks\b|\bwhat'?s yours\b|\bwhat(?:'s| is) your(?:s| name)\b/i.test(
      act
    );
  const asksPanel = /\bblue (?:screen|panel)\b|\bwhat(?:'s| is) the (?:blue\s+)?(?:screen|panel)\b/i.test(act);
  const gaveName = /\b(?:my name is|i am|i'm|call me)\b/i.test(act);
  const searches =
    /\bsearch\b|\bintel\b|\banything of use\b|\blook around\b|\bexplore\b/i.test(act);

  if (
    /\binspect(?:\s+the)?\s+(?:blue\s+)?panel\b|\bcheck(?:\s+the)?\s+(?:blue\s+)?panel\b/i.test(act)
    || (asksPanel && !asksWhere && !asksWho && !asksWant && !asksWhy && !gaveName)
  ) {
    if (name) {
      return `The panel holds the name ${name}. It is a System window at eye level — not a person.`;
    }
    return `The blue panel is yours — a System window at eye level ${here}. It is not a person. A blank line waits.`;
  }

  if (searches) {
    const found = alone
      ? `You search ${here}. Broken stone, a dark doorway, dust. Nothing useful has been left for you.`
      : `You look again ${here}. Nothing new has been left in reach.`;
    return name ? `${found} The panel still shows ${name}.` : `${found} The panel has not moved.`;
  }

  if (gaveName && name) {
    const bits = [`They have the name ${name}.`];
    if (asksWhere) bits.push(`You are ${here}.`);
    if (asksWho) bits.push(`${who} has not given a name back.`);
    if (asksPanel) bits.push('The blue panel is a System window at eye level — not a person.');
    if (asksWant || asksWhy) bits.push(want || 'They have not said what they want yet.');
    return bits.join(' ');
  }

  if (asksWhere || asksWhy || asksWant || asksWho || asksPanel) {
    const bits: string[] = [];
    if (asksWhere) bits.push(`You are ${here}.`);
    if (asksWho) bits.push(`${who} is the one asking.`);
    if (asksPanel) bits.push('The blue panel is yours — a System window at eye level, not a person.');
    if (name && (asksWhy || asksWant)) {
      bits.push(`They already have the name ${name}.`);
      bits.push(want || 'They have not said what they want yet.');
    } else if (asksWhy || asksWant) {
      bits.push(want || 'The panel wants a name to write. It does not say why.');
      if (!asksWhere) bits.push(`You are ${here}.`);
      if (!name) bits.push('They still want a name before they will say more.');
    }
    if (name && asksWhere && !asksWhy && !asksWant && !asksWho) {
      bits.push(`They already have the name ${name}.`);
    } else if (!name && asksWhere && !asksWhy && !asksWant && !asksWho) {
      bits.push('They still want a name before they will say more.');
    }
    return bits.filter(Boolean).join(' ');
  }

  if (!act) {
    return `You are ${here}.`;
  }

  if (name) {
    return `They have the name ${name}. You are ${here}.`;
  }
  return `You are ${here}. They still want a name.`;
}

/** True when this tier may attempt a non-blocking polish (reserved; page-1 never waits). */
export function openingPolishAllowed(tier: string | null | undefined): boolean {
  const t = (tier ?? 'free').toLowerCase();
  return t === 'mid' || t === 'high' || t === 'admin' || t === 'byok';
}

export type OpeningAskKind = OpeningPromptKind;
