/**
 * Hub / social vignette continuity lock (Batch C).
 * When a social or argument beat opens at a hub, lock who/what until the
 * player continues past it or leaves the hub. Drought / Engage must not
 * invent a brand-new argument cast every turn.
 */

import type { GameState, SceneFacts } from './types';
import {
  isChromePersonToken,
  isChoicePadPersonToken,
  isDialogueVerbPersonToken,
  isNonPersonNameToken,
} from './chromeAuthority';

export type VignetteKind = 'social' | 'argument' | 'vendor';

export type OpenVignette = {
  id: string;
  hubId: string;
  hubName: string;
  kind: VignetteKind;
  /** Locked people in this beat (fence, stall-hand, quarrellers). */
  cast: string[];
  /** Locked props (crate, kettle, grain sack) when established. */
  props: string[];
  stakes?: string;
  openedTurn: number;
  status: 'open' | 'resolving' | 'closed';
};

const ARGUMENT_CUES =
  /\b(argument|argu(?:es|ing)|quarrel|dispute|shouting match|bicker(?:ing)?|haggle(?:s|d|ing)?|bargain(?:s|ed|ing)? over|row with|accuses?|demand(?:s|ing) (?:copper|coin|pay)|fish[- ]?monger|stall[- ]?hand)\b/i;

const SOCIAL_BEAT_KIND = /^(social|vendor)$/i;

const TRAVEL_LEAVE =
  /\b(travel|leave|head (?:to|toward|for)|go to|walk (?:to|toward)|return to|enter)\b/i;

function uniqNames(names: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of names) {
    const n = String(raw ?? '').replace(/\s+/g, ' ').trim();
    if (n.length < 2 || n.length > 48) continue;
    if (isNonPersonNameToken(n) || isChromePersonToken(n)) continue;
    if (isChoicePadPersonToken(n) || isDialogueVerbPersonToken(n)) continue;
    if (/^(bystanders|someone|stranger|figure|official|handlers?|they|them|one|press)$/i.test(n)) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

function extractPropMentions(prose: string): string[] {
  if (!prose) return [];
  const found: string[] = [];
  const re =
    /\b((?:wooden |iron[- ]bound |sturdy )?(?:crate|chest|locker|kettle|sack|barrel|stall|awning|scale|awning)s?|(?:grain|fish|copper|scrap)(?:\s+(?:sack|crate|box|pile))?)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prose)) !== null) {
    found.push(m[1]!.replace(/\s+/g, ' ').trim().toLowerCase());
  }
  return uniqNames(found).slice(0, 4);
}

/** Proper-ish names that look like people in argument/social prose. */
function extractCastFromProse(prose: string, knownPresent: string[]): string[] {
  const fromKnown = knownPresent.filter((n) => {
    const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(prose);
  });
  const titleCase: string[] = [];
  const re = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prose)) !== null) {
    const n = m[1]!;
    if (/^(The|A|An|You|Your|At|In|On|With|From|And|But|Then|When|After|Before|Status|System|Class|Hp|Mp|Xp|They|Them|Their|One|Press|He|She|It)$/i.test(n)) {
      continue;
    }
    // Batch V — never promote dialogue verbs / pad tokens via Title-Case scrape.
    if (isDialogueVerbPersonToken(n) || isChoicePadPersonToken(n) || isNonPersonNameToken(n)) {
      continue;
    }
    // Require speech/role cue nearby so bare verbs ("Rasped") never become cast.
    const around = prose.slice(Math.max(0, m.index - 24), Math.min(prose.length, m.index + n.length + 40));
    const looksLikePerson =
      /\b(?:named|called|known as|stall owner|fence|sergeant|warden|merchant|handler|contact)\b/i.test(around)
      || /\b(?:says|said|asks|asked|replies|nods|smiles|frowns|growls|whispers)\b/i.test(around)
      || (knownPresent.some((k) => k.toLowerCase() === n.toLowerCase()));
    if (!looksLikePerson) continue;
    titleCase.push(n);
  }
  return uniqNames([...fromKnown, ...titleCase]).slice(0, 4);
}

export function isOpenVignette(v?: OpenVignette | null): v is OpenVignette {
  return !!v && (v.status === 'open' || v.status === 'resolving') && v.cast.length > 0;
}

export function formatVignetteBindingLine(state: GameState): string | null {
  const v = state.sceneFacts?.openVignette;
  if (!isOpenVignette(v)) return null;
  const cast = v.cast.join(', ');
  const props = v.props.length ? `; props: ${v.props.join(', ')}` : '';
  const stakes = v.stakes ? `; stakes: ${v.stakes.slice(0, 100)}` : '';
  return `OPEN VIGNETTE BINDING: ${v.kind} at ${v.hubName} — continue or honest-exit with ${cast}${props}${stakes}. Do not invent a new argument cast or replace these people until the player leaves the hub or resolves this beat.`;
}

export function formatVignetteSnapshotLine(state: GameState): string | null {
  const v = state.sceneFacts?.openVignette;
  if (!isOpenVignette(v)) return null;
  return `Open vignette (${v.kind}): ${v.cast.join(', ')}${v.props.length ? ` · ${v.props.join(', ')}` : ''}${v.stakes ? ` — ${v.stakes.slice(0, 80)}` : ''}`;
}

/** Open from hub social/vendor arrival beat. */
export function openVignetteFromHubBeat(opts: {
  hubId: string;
  hubName: string;
  beatId: string;
  kind: string;
  contactName?: string;
  pressure?: string;
  turn: number;
  prev?: OpenVignette;
}): OpenVignette | undefined {
  if (!SOCIAL_BEAT_KIND.test(opts.kind)) return opts.prev;
  if (isOpenVignette(opts.prev) && opts.prev.hubId === opts.hubId) {
    const cast = uniqNames([...opts.prev.cast, opts.contactName ?? '']);
    return {
      ...opts.prev,
      cast: cast.length ? cast : opts.prev.cast,
      stakes: opts.prev.stakes || opts.pressure?.slice(0, 140),
      status: 'open',
    };
  }
  const cast = uniqNames([opts.contactName ?? '']);
  if (!cast.length && !(opts.pressure ?? '').trim()) return opts.prev;
  return {
    id: `${opts.hubId}:${opts.beatId}`,
    hubId: opts.hubId,
    hubName: opts.hubName,
    kind: /vendor/i.test(opts.kind) ? 'vendor' : 'social',
    cast: cast.length ? cast : ['stall contact'],
    props: [],
    stakes: opts.pressure?.slice(0, 140),
    openedTurn: opts.turn,
    status: 'open',
  };
}

/**
 * Harvest an argument/social beat from committed prose.
 * Strengthens an existing lock; opens a new argument lock when cues fire.
 */
export function harvestVignetteIntoSceneFacts(
  facts: SceneFacts,
  prose: string,
  turn: number,
  hub?: { id: string; name: string } | null,
  playerInput?: string
): SceneFacts {
  const left =
    !!playerInput &&
    TRAVEL_LEAVE.test(playerInput) &&
    isOpenVignette(facts.openVignette) &&
    hub &&
    facts.openVignette.hubId !== hub.id;

  if (left || (playerInput && TRAVEL_LEAVE.test(playerInput) && !hub)) {
    if (isOpenVignette(facts.openVignette)) {
      return {
        ...facts,
        openVignette: { ...facts.openVignette, status: 'closed' },
      };
    }
  }

  const argument = ARGUMENT_CUES.test(prose);
  const existing = facts.openVignette;
  if (isOpenVignette(existing)) {
    const cast = uniqNames([
      ...existing.cast,
      ...extractCastFromProse(prose, facts.present ?? []),
    ]).slice(0, 5);
    const props = uniqNames([...existing.props, ...extractPropMentions(prose)]).slice(0, 5);
    const kind: VignetteKind =
      argument && existing.kind === 'social' ? 'argument' : existing.kind;
    return {
      ...facts,
      openVignette: {
        ...existing,
        kind,
        cast,
        props,
        status: 'open',
      },
      present: uniqNames([...(facts.present ?? []), ...cast]),
      props: uniqNames([...(facts.props ?? []), ...props]),
    };
  }

  if (!argument || !hub) return facts;
  const cast = extractCastFromProse(prose, facts.present ?? []);
  if (!cast.length) return facts;
  const props = extractPropMentions(prose);
  const vignette: OpenVignette = {
    id: `arg:${hub.id}:t${turn}`,
    hubId: hub.id,
    hubName: hub.name,
    kind: 'argument',
    cast,
    props,
    stakes: 'Unresolved dispute still in progress',
    openedTurn: turn,
    status: 'open',
  };
  return {
    ...facts,
    openVignette: vignette,
    present: uniqNames([...(facts.present ?? []), ...cast]),
    props: uniqNames([...(facts.props ?? []), ...props]),
  };
}

/** Clear vignette when player leaves the hub (location change). */
export function clearVignetteOnHubLeave(
  facts: SceneFacts | undefined,
  previousLocation: string | undefined,
  nextLocation: string | undefined,
  hubIdFor?: (loc: string | undefined) => string | null
): SceneFacts | undefined {
  if (!facts || !isOpenVignette(facts.openVignette)) return facts;
  if (!previousLocation || !nextLocation) return facts;
  if (previousLocation === nextLocation) return facts;
  const prevHub = hubIdFor?.(previousLocation) ?? null;
  const nextHub = hubIdFor?.(nextLocation) ?? null;
  if (prevHub && facts.openVignette.hubId === prevHub && nextHub !== prevHub) {
    return { ...facts, openVignette: { ...facts.openVignette, status: 'closed' } };
  }
  if (!prevHub && facts.openVignette.hubName) {
    const same =
      nextLocation.toLowerCase().includes(facts.openVignette.hubName.toLowerCase()) ||
      facts.openVignette.hubName.toLowerCase().includes(nextLocation.toLowerCase());
    if (!same) {
      return { ...facts, openVignette: { ...facts.openVignette, status: 'closed' } };
    }
  }
  return facts;
}

/**
 * When a vignette is open, merge locked cast into present and drop fresh
 * social-contact invent pads that name a different cast.
 */
export function applyVignettePresence(state: GameState): GameState {
  const v = state.sceneFacts?.openVignette;
  if (!isOpenVignette(v) || !state.sceneFacts) return state;
  const present = uniqNames([...(state.sceneFacts.present ?? []), ...v.cast]);
  const props = uniqNames([...(state.sceneFacts.props ?? []), ...v.props]);
  return {
    ...state,
    sceneFacts: {
      ...state.sceneFacts,
      present,
      props,
      openVignette: v,
    },
  };
}

/** True when drought/hub must continue the locked cast instead of a new social spawn. */
export function vignetteBlocksNewSocialCast(state: GameState): boolean {
  return isOpenVignette(state.sceneFacts?.openVignette);
}

/** Filter choice pads that invent a brand-new social contact while vignette is open. */
export function filterPadsAgainstOpenVignette(state: GameState, choices: string[]): string[] {
  const v = state.sceneFacts?.openVignette;
  if (!isOpenVignette(v) || !choices.length) return choices;
  const castLower = v.cast.map((c) => c.toLowerCase());
  return choices.filter((c) => {
    const lower = c.toLowerCase();
    // Keep continue / talk / leave / combat with known cast
    if (/\b(leave|walk away|travel|return|flee|engage|attack|strike|wait)\b/i.test(lower)) {
      return true;
    }
    if (castLower.some((name) => lower.includes(name))) return true;
    // Drop "Talk to the new fence / Ask the stranger" when cast is locked
    if (/\b(talk to|ask|approach|offer|bargain with)\b/i.test(lower)) {
      const invent =
        /\b(stranger|new (?:fence|vendor|contact)|another (?:stall|fence|merchant))\b/i.test(lower);
      if (invent) return false;
      // Talk without naming locked cast — keep only if no alternate person named
      const mentionsOther =
        /\b(?:the|a|an)\s+([a-z][a-z\-']+(?:\s+[a-z][a-z\-']+)?)\b/i.exec(lower)?.[1];
      if (mentionsOther && !castLower.some((n) => n.includes(mentionsOther) || mentionsOther.includes(n.split(/\s+/)[0]!))) {
        if (/\b(fence|vendor|merchant|stall-hand|quartermaster|buyer|seller)\b/i.test(mentionsOther)) {
          return castLower.some((n) => /fence|vendor|merchant|stall|quarter/i.test(n));
        }
      }
    }
    return true;
  });
}
