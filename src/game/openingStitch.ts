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
  extractGivenName,
  hallTalkAsksPanel,
  hallTalkAsksRefuse,
  hallTalkAsksWant,
  hallTalkAsksWhere,
  asksOpeningCardNoun,
  hallTalkAsksWho,
  isAloneArrivalOpening,
  isKitOrCarryInspect,
  isEarthOriginPrompt,
  openingAlreadyToldLine,
  openingCastLabel,
  openingRefuseLine,
  openingSpokenRefuse,
  openingSpokenWant,
  openingWantLine,
  openingWhoAskLine,
  playerAskedWhyPulled,
  playerGaveNameAndAskedMore,
  resolveLockedOpeningPlace,
  resolveOpeningHookPick,
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

/** Authored cards still end on a name ask — drop that tail when Usual Self already locked one. */
const LOCKED_NAME_ASK_TAIL =
  /(?:\s+The panel waits on a name\.)?(?:\s+What (?:name do you (?:give(?: them| it)?|enter|lock)|name does it take|do you enter)[^?]{0,48}\?)\s*$/i;

function dropCoverNameAsk(body: string): string {
  return body
    .replace(LOCKED_NAME_ASK_TAIL, '')
    .replace(/\s+The panel waits on a name\.\s*$/i, '')
    .replace(/\b(?:and )?(?:barks|asks|shouts|waits) for a name\b[^.?!]{0,80}[.?!]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();
}

function lastGmBodies(state: GameState): string[] {
  return (state.log ?? [])
    .filter((e) => e.role === 'gm' && typeof e.content === 'string')
    .slice(-2)
    .map((e) => (e.content ?? '').replace(/\s+/g, ' ').trim());
}

function clauseAlreadySpoken(state: GameState, clause: string): boolean {
  const n = (clause ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (n.length < 16) return false;
  if (n.includes('they have not said what they want yet')) return false;
  if (n.includes('they have not said what happens if you refuse')) return false;
  const key = n.slice(0, 48);
  return lastGmBodies(state).some((g) => g.toLowerCase().includes(key));
}

/**
 * Instant first page — one authored paragraph + optional cover ask. No collage.
 */
export function stitchOpeningScene(state: GameState): string {
  const body = baseSceneFromCard(state).trim();
  if (lockedCoverName(state)) {
    return dropCoverNameAsk(body);
  }
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
  const want = openingSpokenWant(state);
  const ledgerWant = openingWantLine(state);
  const refuse = openingSpokenRefuse(state);
  const ledgerRefuse = openingRefuseLine(state);
  const whoLine = openingWhoAskLine(state);
  const alreadyToldWho = openingAlreadyToldLine(state, 'who');
  const alreadyToldWant = openingAlreadyToldLine(state, 'want');
  const alreadyToldRefuse = openingAlreadyToldLine(state, 'refuse');
  const asksWhere = hallTalkAsksWhere(act);
  const asksWhy = hallTalkAsksWant(act) || playerAskedWhyPulled(act);
  const asksWant = hallTalkAsksWant(act) || playerAskedWhyPulled(act);
  const asksRefuse = hallTalkAsksRefuse(act);
  const asksWho = hallTalkAsksWho(act);
  const asksPanel = hallTalkAsksPanel(act);
  const gaveName = !!extractGivenName(act);
  const namePlusMore = playerGaveNameAndAskedMore(act);
  const searches =
    /\bsearch\b|\bintel\b|\banything of use\b|\blook around\b|\bexplore\b/i.test(act);

  if (isKitOrCarryInspect(act) && !asksWant && !asksWho && !asksRefuse) {
    return 'You still have what you arrived with. Nothing new is in your hands.';
  }

  const cardNoun = asksOpeningCardNoun(state, act);
  if (cardNoun && !asksWant && !asksWho && !asksRefuse && !gaveName) {
    const who = openingCastLabel(state);
    const head = who ? who.charAt(0).toUpperCase() + who.slice(1) : 'They';
    return `${head} still has the ${cardNoun}. They have not said more than that.`;
  }

  if (
    /\binspect(?:\s+the)?\s+(?:blue\s+)?panel\b|\bcheck(?:\s+the)?\s+(?:blue\s+)?panel\b/i.test(act)
    || (asksPanel && !asksWhere && !asksWho && !asksWant && !asksWhy && !asksRefuse && !gaveName)
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
    if (state.engineMode === 'litrpg') {
      return name ? `${found} The panel still shows ${name}.` : `${found} The panel has not moved.`;
    }
    return found;
  }

  if (gaveName && name) {
    const bits = [`They have the name ${name}.`];
    if (asksWhere || namePlusMore) bits.push(`You are ${here}.`);
    if (asksWho) bits.push(clauseAlreadySpoken(state, whoLine) ? alreadyToldWho : whoLine);
    if (asksPanel) bits.push('The blue panel is a System window at eye level — not a person.');
    if (asksWant || asksWhy || namePlusMore) {
      bits.push(
        clauseAlreadySpoken(state, ledgerWant) || clauseAlreadySpoken(state, want)
          ? alreadyToldWant
          : want || 'They have not said what they want yet.'
      );
    }
    if (asksRefuse) {
      bits.push(
        clauseAlreadySpoken(state, ledgerRefuse) || clauseAlreadySpoken(state, refuse)
          ? alreadyToldRefuse
          : refuse || 'They have not said what happens if you refuse.'
      );
    }
    return bits.join(' ');
  }

  if (asksWhere || asksWhy || asksWant || asksRefuse || asksWho || asksPanel) {
    const bits: string[] = [];
    if (asksWhere) bits.push(`You are ${here}.`);
    if (asksWho) bits.push(clauseAlreadySpoken(state, whoLine) ? alreadyToldWho : whoLine);
    if (asksPanel) bits.push('The blue panel is yours — a System window at eye level, not a person.');
    if (asksWhy || asksWant) {
      bits.push(
        clauseAlreadySpoken(state, ledgerWant) || clauseAlreadySpoken(state, want)
          ? alreadyToldWant
          : want || (name ? 'They have not said what they want yet.' : 'The panel wants a name to write. It does not say why.')
      );
      if (!asksWhere && !name && !asksRefuse) bits.push(`You are ${here}.`);
      if (!name && !asksRefuse) bits.push('They still want a name before they will say more.');
    }
    if (asksRefuse) {
      bits.push(
        clauseAlreadySpoken(state, ledgerRefuse) || clauseAlreadySpoken(state, refuse)
          ? alreadyToldRefuse
          : refuse || 'They have not said what happens if you refuse.'
      );
      if (!asksWhere && !name) bits.push(`You are ${here}.`);
      if (!name) bits.push('They still want a name before they will say more.');
    }
    if (!name && asksWhere && !asksWhy && !asksWant && !asksRefuse && !asksWho) {
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
