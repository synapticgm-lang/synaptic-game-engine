/**
 * Deterministic BeatSpec + panel-plan source precedence (P0 comic-lite).
 * Director stays disabled — this replaces its planning role with templates.
 */

import type { ComicPanel, ComicTextAnchor, GameState, Settings } from './types';
import { COMIC_TEXT_ANCHORS, normalizeTextAnchor } from '../types/comicScript';
import { resolvePanelBudget } from './panelBudget';
import { scrubFranchiseStyleLeak } from './comicImagePrompt';
import { storyHasBody } from './turnAsk';

export type BeatRole =
  | 'establishing'
  | 'action'
  | 'reaction'
  | 'reveal'
  | 'aftermath'
  | 'dialogue'
  | 'transition'
  | 'splash';

export type PanelPlanSource = 'gm-tags' | 'deterministic' | 'none';

/** P0 live card — one splash only. Strip cards are P1. */
export const P0_CARD_ID = 'P1-SPLASH' as const;

export interface ComicBeatSpec {
  role: BeatRole;
  placeId: string;
  /** Ledger-safe roster names (omit secondary rather than invent). */
  roster: string[];
  actionBoundary: string;
  beatRevision: number;
  cardId: typeof P0_CARD_ID;
  textAnchor: ComicTextAnchor;
}

export interface ComicPanelPlan {
  source: PanelPlanSource;
  panels: ComicPanel[];
  beatRevision: number;
  cardId?: string;
  /** Why GM tags were rejected (art plan only — story stays valid). */
  rejectReason?: string;
}

const PROTECTED_STYLE_LEAK =
  /\b(marvel|dc comics|image comics|dark horse|webtoon originals|shonen jump|viz media|miyazaki|kim jung gi|jim lee|greg capullo|make it like\s+\w+)/i;

/** Tokens that look like invented named NPCs in art prompts (heuristic). */
function extractNamedSuspects(prompt: string): string[] {
  const suspects: string[] = [];
  // "a masked guide", "the scarlet courier" style role-nouns often invented
  const roleNoun = prompt.match(
    /\b(?:a|an|the)\s+((?:masked|hooded|scarred|tall|short|young|old)\s+)?([a-z]{3,20})\b/gi
  );
  if (roleNoun) {
    for (const m of roleNoun) {
      const noun = m.replace(/^(?:a|an|the)\s+/i, '').trim().toLowerCase();
      if (
        /^(guide|courier|stranger|figure|assassin|merchant|guard|priest|wizard|witch|soldier|captain|officer)$/i.test(
          noun.split(/\s+/).pop() || ''
        )
      ) {
        suspects.push(noun);
      }
    }
  }
  return suspects;
}

export function ledgerRosterNames(state: Pick<GameState, 'character' | 'companions' | 'sceneFacts'>): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string) => {
    const n = raw?.trim();
    if (!n) return;
    const key = n.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(n);
  };
  push(state.character?.name);
  for (const c of state.companions ?? []) push(c.name);
  for (const p of state.sceneFacts?.present ?? []) push(p);
  return names;
}

export function ledgerPlaceId(state: Pick<GameState, 'currentLocation' | 'locationSheet'>): string {
  return (state.locationSheet?.name || state.currentLocation || 'unknown-place').trim();
}

/**
 * GM `<panel>` tags are accepted only when ledger-safe + budgeted.
 * Invented roster / franchise style / over-budget → reject art plan (not story).
 */
export function validateGmPanels(opts: {
  panels: ComicPanel[];
  state: Pick<GameState, 'character' | 'companions' | 'sceneFacts' | 'currentLocation' | 'locationSheet' | 'inventory'>;
  budget: number;
}): { ok: true; panels: ComicPanel[] } | { ok: false; reason: string } {
  const { panels, state, budget } = opts;
  if (!panels.length) return { ok: false, reason: 'empty' };
  if (panels.length > budget) return { ok: false, reason: 'over_budget' };

  const roster = ledgerRosterNames(state).map((n) => n.toLowerCase());
  const place = ledgerPlaceId(state).toLowerCase();

  for (const panel of panels) {
    const prompt = panel.imagePrompt || '';
    if (!prompt.trim() || !(panel.narrative ?? '').trim()) {
      return { ok: false, reason: 'malformed' };
    }
    if (PROTECTED_STYLE_LEAK.test(prompt) || PROTECTED_STYLE_LEAK.test(panel.narrative)) {
      return { ok: false, reason: 'franchise_leak' };
    }
    const suspects = extractNamedSuspects(prompt);
    for (const s of suspects) {
      const token = s.split(/\s+/).pop() || s;
      // Allow if token appears in roster or place anchors
      const grounded =
        roster.some((r) => r.includes(token) || token.includes(r.split(/\s+/)[0] || ''))
        || place.includes(token);
      if (!grounded && /guide|courier|assassin|stranger|wizard|witch|captain/i.test(token)) {
        return { ok: false, reason: 'invented_npc' };
      }
    }
    // Reject prompts that invent damage outcomes not in narrative/ledger (light heuristic)
    if (
      /\b(broken arm|severed|decapitat|corpse of|defeated enemy lying)\b/i.test(prompt)
      && !/\b(broken arm|severed|decapitat|corpse|defeated)\b/i.test(panel.narrative)
    ) {
      return { ok: false, reason: 'invented_outcome' };
    }
  }

  return {
    ok: true,
    panels: panels.slice(0, budget).map((p) => ({
      ...p,
      imagePrompt: scrubFranchiseStyleLeak(p.imagePrompt),
      textAnchor: p.textAnchor ? normalizeTextAnchor(p.textAnchor) : 'bottom-center',
    })),
  };
}

export function inferBeatRole(playerAction: string, storyText: string): BeatRole {
  const a = playerAction.toLowerCase();
  const s = storyText.toLowerCase();
  if (/\b(attack|strike|swing|fire|cast|lunge|slash)\b/.test(a)) return 'action';
  if (/\b(say|ask|tell|speak|talk|whisper|shout)\b/.test(a) || /["“]/.test(storyText)) return 'dialogue';
  if (/\b(enter|approach|open the door|step into)\b/.test(a)) return 'reveal';
  if (/\b(after|aftermath|settle|rest)\b/.test(s)) return 'aftermath';
  if (/\b(arrive|you are in|stands before)\b/.test(s)) return 'establishing';
  return 'splash';
}

export function buildDeterministicOnePanel(opts: {
  state: Pick<GameState, 'character' | 'companions' | 'sceneFacts' | 'currentLocation' | 'locationSheet' | 'ledgerRevision'>;
  storyText: string;
  playerAction: string;
}): { spec: ComicBeatSpec; panel: ComicPanel } {
  const roster = ledgerRosterNames(opts.state).slice(0, 2); // omit secondary rather than invent
  const placeId = ledgerPlaceId(opts.state);
  const role = inferBeatRole(opts.playerAction, opts.storyText);
  const beatRevision = typeof opts.state.ledgerRevision === 'number' ? opts.state.ledgerRevision : 0;
  // Prefer concrete boundary from accepted story — first ~220 chars of body
  const boundary = opts.storyText.replace(/\s+/g, ' ').trim().slice(0, 220);
  const focal = roster[0] || 'the viewpoint character';
  const second = roster[1] ? `, with ${roster[1]} also present` : '';
  const placeAnchors = [
    placeId,
    ...(opts.state.sceneFacts?.props ?? []).slice(0, 4),
  ].filter(Boolean).join(', ');

  const artPrompt = scrubFranchiseStyleLeak(
    [
      `Single frozen moment: ${boundary}`,
      `FOCAL: ${focal}${second}. Exact count: ${Math.max(1, roster.length)} named person(s) — do not add extras.`,
      `PLACE: ${placeAnchors || 'neutral interior'}.`,
      opts.playerAction.trim()
        ? `Depict the player's committed action boundary only: "${opts.playerAction.trim().slice(0, 120)}".`
        : '',
      'No dialogue, captions, SFX glyphs, logos, watermarks, or UI in the image.',
    ]
      .filter(Boolean)
      .join(' ')
  );

  const spec: ComicBeatSpec = {
    role,
    placeId,
    roster,
    actionBoundary: boundary,
    beatRevision,
    cardId: P0_CARD_ID,
    textAnchor: 'bottom-center',
  };

  // Overlay narrative = accepted story slice (HTML lettering), not baked into pixels
  const narrative = opts.storyText.trim().slice(0, 800);

  return {
    spec,
    panel: {
      imagePrompt: artPrompt,
      narrative,
      imageUrl: null,
      imageStatus: 'pending',
      textAnchor: 'bottom-center',
      cameraAngle: role === 'action' ? 'MEDIUM SHOT' : 'WIDE SHOT',
    },
  };
}

/**
 * Source precedence:
 * 1) Valid GM tags (ledger-safe + budgeted)
 * 2) Deterministic one-panel BeatSpec
 * 3) None
 */
export function resolveComicPanelPlan(opts: {
  isComicView: boolean;
  gmPanels: ComicPanel[];
  state: GameState;
  storyText: string;
  playerAction: string;
  settings: Pick<Settings, 'panelFrequency' | 'comicLayout' | 'visualMode' | 'subscriptionTier'>;
  /** P0 comic-lite hard ceiling — usually 1. */
  liveCeiling?: number;
}): ComicPanelPlan {
  if (!opts.isComicView) {
    return { source: 'none', panels: [], beatRevision: opts.state.ledgerRevision ?? 0 };
  }
  if (!storyHasBody(opts.storyText)) {
    return {
      source: 'none',
      panels: [],
      beatRevision: opts.state.ledgerRevision ?? 0,
      rejectReason: 'thin_story',
    };
  }

  const budget = Math.min(
    opts.liveCeiling ?? 1,
    resolvePanelBudget(opts.settings),
    resolveP0PanelCeiling(opts.settings)
  );

  const validated = validateGmPanels({
    panels: opts.gmPanels,
    state: opts.state,
    budget,
  });

  if (validated.ok) {
    return {
      source: 'gm-tags',
      panels: validated.panels.slice(0, budget),
      beatRevision: opts.state.ledgerRevision ?? 0,
      cardId: budget === 1 ? P0_CARD_ID : undefined,
    };
  }

  const { panel, spec } = buildDeterministicOnePanel({
    state: opts.state,
    storyText: opts.storyText,
    playerAction: opts.playerAction,
  });

  return {
    source: 'deterministic',
    panels: [panel],
    beatRevision: spec.beatRevision,
    cardId: spec.cardId,
    rejectReason: validated.reason,
  };
}

/** P0: Free always 1; Mid/High still start at 1 for live comic-lite (strips are P1). */
export function resolveP0PanelCeiling(
  settings: Pick<Settings, 'subscriptionTier' | 'panelFrequency'>
): number {
  // Hard P0 product law: one generated panel per eligible beat.
  return 1;
}

export function isValidOverlayAnchor(raw: unknown): raw is ComicTextAnchor {
  if (typeof raw !== 'string') return false;
  return (COMIC_TEXT_ANCHORS as readonly string[]).includes(normalizeTextAnchor(raw));
}
