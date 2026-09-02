/**
 * Batch U — automated readability invariants for fate-autoplay post-run checks.
 * Fails when GM narration contains known Batch-T violations without Gemini.
 */

import type { GameState } from './types';
import { isStitchBankFingerprint } from './beatCommitGate';
import { hasNumberedChoiceLeak, hasQuestTrackerLeak } from './parser';
import { scrubFalseArrivalWhenHere, scrubEntityMadLibs } from './proseWarden';
import { detectHubRoleMadlib } from './chromeAuthority';
import { hasCombatSpawnLogInBody } from './combatAuthority';

export type ReadabilityViolationKind =
  | 'stitch-leak'
  | 'false-arrival'
  | 'choice-leak'
  | 'travel-streak'
  | 'entity-madlib'
  | 'ui-bleed'
  | 'quest-tracker'
  | 'spawn-log';

export interface ReadabilityViolation {
  kind: ReadabilityViolationKind;
  turn: number;
  quote: string;
}

const FALSE_SEVENFOLD =
  /\bYou reach\s+(?:the\s+)?Sevenfold\s+Circle(?:\s+under\s+bombardment)?\b/i;

function gmEntries(state: GameState): Array<{ turn: number; content: string }> {
  return (state.log ?? [])
    .filter((e) => e.role === 'gm' && e.content?.trim())
    .map((e) => ({ turn: e.turn ?? 0, content: e.content!.trim() }));
}

const ENTITY_MADLIB =
  /\b(?:you just Scattered Scale|just Scattered Scale|leans? stall contact|steps? stall contact|the stall contact decree|bursts from the crowd here|activity Scattered Scale|lunged Lowmarket Fence|a Lowmarket Fence,\s*greyish|scrap\.\s*")\b/i;

const UI_BLEED =
  /\b(?:invite a real move|A question hangs|ash still sifts between the stones|Wind cuts along the cracked stones|side lane toward)\b/i;

function scanEntityMadlib(text: string): boolean {
  return ENTITY_MADLIB.test(text) || detectHubRoleMadlib(text) || scrubEntityMadLibs(text) !== text;
}

function clipQuote(text: string, max = 120): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Scan committed GM beats for known readability violations. */
export function scanReadabilityViolations(state: GameState): ReadabilityViolation[] {
  const out: ReadabilityViolation[] = [];
  const loc = state.currentLocation ?? '';
  const knownPlaces = (state.places ?? []).map((p) => p.name).filter(Boolean) as string[];
  const prevLoc = '';

  for (const { turn, content } of gmEntries(state)) {
    if (isStitchBankFingerprint(content)) {
      out.push({ kind: 'stitch-leak', turn, quote: clipQuote(content) });
    }
    if (hasNumberedChoiceLeak(content)) {
      out.push({ kind: 'choice-leak', turn, quote: clipQuote(content) });
    }
    if (scanEntityMadlib(content)) {
      out.push({ kind: 'entity-madlib', turn, quote: clipQuote(content) });
    }
    if (UI_BLEED.test(content)) {
      out.push({ kind: 'ui-bleed', turn, quote: clipQuote(content) });
    }
    if (hasQuestTrackerLeak(content)) {
      out.push({ kind: 'quest-tracker', turn, quote: clipQuote(content) });
    }
    if (hasCombatSpawnLogInBody(content)) {
      out.push({ kind: 'spawn-log', turn, quote: clipQuote(content) });
    }
    const here = loc || prevLoc;
    if (here && !/sevenfold\s+circle/i.test(here) && FALSE_SEVENFOLD.test(content)) {
      out.push({
        kind: 'false-arrival',
        turn,
        quote: clipQuote(content.match(FALSE_SEVENFOLD)?.[0] ?? content),
      });
    }
    if (here && scrubFalseArrivalWhenHere(content, here, knownPlaces) !== content) {
      if (FALSE_SEVENFOLD.test(content)) {
        /* already counted */
      } else if (/\bYou reach\b/i.test(content)) {
        out.push({ kind: 'false-arrival', turn, quote: clipQuote(content) });
      }
    }
  }

  // Travel-only pad streak (optional log) — 4+ consecutive player travel picks
  const log = state.log ?? [];
  let travelRun = 0;
  let travelRunStart = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    if (/\btravel\b/i.test(e.content ?? '')) {
      travelRun += 1;
      travelRunStart = e.turn ?? travelRunStart;
    } else break;
  }
  if (travelRun >= 4) {
    out.push({
      kind: 'travel-streak',
      turn: travelRunStart,
      quote: `${travelRun} consecutive Travel picks at end of run`,
    });
  }

  return out;
}

export function readabilityGatePass(state: GameState): {
  pass: boolean;
  violations: ReadabilityViolation[];
  p0Count: number;
} {
  const violations = scanReadabilityViolations(state);
  const p0 = violations.filter((v) => v.kind !== 'travel-streak');
  return {
    pass: p0.length === 0,
    violations,
    p0Count: p0.length,
  };
}
