/**
 * Craft-book compiler — Path A: the constitution lives in a typed registry.
 * Compiler still picks 1–2 rules internally for craftApplied / ignore-stitch.
 * Writer packet does not receive CRAFT or MODE AUTHORITY lines (02n diet).
 */

import type { EngineMode, GameState, LogEntry } from './types.ts';
import { MODE_STORY_AUTHORITY } from './fluidProseRails.ts';

export type CraftWhen = 'opening' | 'inspect' | 'talk' | 'travel' | 'combat' | 'wait';

export type CraftSignal =
  | 'collage'
  | 'atmosphere'
  | 'name_deny'
  | 'pad_irrelevant'
  | 'hook_contradiction'
  | 'thumbs_down';

export interface CraftRule {
  id: string;
  mode: EngineMode;
  when: CraftWhen[];
  /** Prompt line. Keep ≤200 chars — Flash Lite ignores piles. */
  authority: string;
  fallback?: boolean;
  boostOn?: CraftSignal[];
}

export interface CraftLedger {
  boosts?: Record<string, number>;
  lastSignals?: CraftSignal[];
  lastApplied?: string[];
}

export interface CraftCompileResult {
  ruleIds: string[];
  lines: string[];
  /** True when specific rules replaced the static MODE AUTHORITY sentence. */
  replacedModeLine: boolean;
  when: CraftWhen | null;
}

let lastThumbsDownTurn = -1;

/** Cheap thumbs-down → next-turn CRAFT boost (no extra LLM). */
export function noteThumbsDownFeedback(turn: number): void {
  lastThumbsDownTurn = turn;
}

export function consumeThumbsDownSignal(currentTurn: number): boolean {
  return lastThumbsDownTurn >= 0 && currentTurn - lastThumbsDownTurn <= 2;
}

const MAX_CRAFT_LINES = 2;
const AUTHORITY_MAX = 200;
const WHEN_SCORE = 10;
const DROUGHT_SCORE = 8;
const BOOST_WEIGHT = 8;
const PICK_FLOOR = 10;

export const CRAFT_RULES: CraftRule[] = [
  // --- litrpg (12) ---
  {
    id: 'litrpg-default',
    mode: 'litrpg',
    when: ['opening', 'inspect', 'talk', 'travel', 'combat', 'wait'],
    authority: MODE_STORY_AUTHORITY.litrpg,
    fallback: true,
  },
  {
    id: 'litrpg-inspect-delta',
    mode: 'litrpg',
    when: ['inspect'],
    authority:
      'Repeat inspect: one new fact, a brief reminder, or honest exhaustion—never the same cell essay.',
    boostOn: ['atmosphere', 'collage', 'thumbs_down'],
  },
  {
    id: 'litrpg-inspect-exhaust',
    mode: 'litrpg',
    when: ['inspect'],
    authority:
      'If the target is already known, do not reprint its card; one new property or “nothing else here.”',
    boostOn: ['atmosphere', 'pad_irrelevant'],
  },
  {
    id: 'litrpg-combat-story',
    mode: 'litrpg',
    when: ['combat'],
    authority:
      'Story beat first; one vivid exchange then a ledger receipt—no per-hit chrome and no fake XP.',
  },
  {
    id: 'litrpg-talk-approaches',
    mode: 'litrpg',
    when: ['talk'],
    authority:
      'Advance the talk in prose; System after. Direct, diplomatic, and solitary must risk different things.',
    boostOn: ['pad_irrelevant'],
  },
  {
    id: 'litrpg-travel-arrival',
    mode: 'litrpg',
    when: ['travel'],
    authority:
      'Arrival changes position or access; do not recap the last room’s smell/light essay at the new door.',
    boostOn: ['atmosphere', 'collage'],
  },
  {
    id: 'litrpg-wait-delta',
    mode: 'litrpg',
    when: ['wait'],
    authority:
      'Wait is a beat: a new fact, a cost, or an honest stall—not the same atmosphere paragraph.',
    boostOn: ['atmosphere'],
  },
  {
    id: 'litrpg-opening-scene',
    mode: 'litrpg',
    when: ['opening'],
    authority:
      'Scene first; weave covers in. Do not lead with registration chrome or a canned name form.',
    boostOn: ['name_deny'],
  },
  {
    id: 'litrpg-hook-why',
    mode: 'litrpg',
    when: ['opening', 'talk'],
    authority:
      'Honor the locked summon-why; do not silently rewrite why they are here unless the player revises it.',
    boostOn: ['hook_contradiction'],
  },
  {
    id: 'litrpg-name-defer',
    mode: 'litrpg',
    when: ['opening', 'talk'],
    authority:
      'Place words (here/you/panel) are not a name; continue the scene instead of a canned name-ask.',
    boostOn: ['name_deny'],
  },
  {
    id: 'litrpg-inspect-pad',
    mode: 'litrpg',
    when: ['inspect'],
    authority:
      'Offer distinct approaches, not four inspect-the-same-thing verbs aimed at one unchanged target.',
    boostOn: ['pad_irrelevant'],
  },
  {
    id: 'litrpg-collage-cut',
    mode: 'litrpg',
    when: ['inspect', 'wait', 'talk'],
    authority:
      'After a recycled prefix or same-room essay, change knowledge, person, or cost—do not stitch old lines.',
    boostOn: ['collage', 'atmosphere', 'thumbs_down'],
  },

  // --- dnd (12) ---
  {
    id: 'dnd-default',
    mode: 'dnd',
    when: ['opening', 'inspect', 'talk', 'travel', 'combat', 'wait'],
    authority: MODE_STORY_AUTHORITY.dnd,
    fallback: true,
  },
  {
    id: 'dnd-inspect-info',
    mode: 'dnd',
    when: ['inspect'],
    authority:
      'Give robust information; no boxed-text reprint. A retry needs a new approach or a changed circumstance.',
    boostOn: ['atmosphere', 'collage'],
  },
  {
    id: 'dnd-talk-motive',
    mode: 'dnd',
    when: ['talk'],
    authority:
      'The NPC has a desire and a method; one motive-bearing line, not a lecture or first-speech reprint.',
    boostOn: ['pad_irrelevant'],
  },
  {
    id: 'dnd-travel-situation',
    mode: 'dnd',
    when: ['travel'],
    authority:
      'Portray the new situation immediately; honor the declared approach and return the floor quickly.',
    boostOn: ['atmosphere'],
  },
  {
    id: 'dnd-combat-ruling',
    mode: 'dnd',
    when: ['combat'],
    authority:
      'Honor the declared action; let success stand. Fail forward—do not auto-force combat from creative play.',
  },
  {
    id: 'dnd-wait-clock',
    mode: 'dnd',
    when: ['wait'],
    authority:
      'Waiting changes time, risk, or information; do not reprint the boxed hall.',
    boostOn: ['atmosphere'],
  },
  {
    id: 'dnd-opening-floor',
    mode: 'dnd',
    when: ['opening'],
    authority:
      'Situation and honest stakes first; no licensed lore; ask what the player does after one ruling.',
    boostOn: ['name_deny'],
  },
  {
    id: 'dnd-spotlight',
    mode: 'dnd',
    when: ['talk', 'combat'],
    authority:
      'Address who acted, then another companion’s opening if they are present—share spotlight.',
  },
  {
    id: 'dnd-boxed-cut',
    mode: 'dnd',
    when: ['inspect', 'wait', 'travel'],
    authority:
      'After a boxed reprint, state what changed—danger, clue, or time—not a second travelogue.',
    boostOn: ['collage', 'atmosphere'],
  },
  {
    id: 'dnd-hook-why',
    mode: 'dnd',
    when: ['opening', 'talk'],
    authority:
      'Honor locked why-you-are-here; do not railroad every action back to a prewritten “correct” route.',
    boostOn: ['hook_contradiction'],
  },
  {
    id: 'dnd-name-defer',
    mode: 'dnd',
    when: ['opening', 'talk'],
    authority:
      'Here/place/you are not names; play the scene instead of pausing for a form.',
    boostOn: ['name_deny'],
  },
  {
    id: 'dnd-pad-tactics',
    mode: 'dnd',
    when: ['inspect', 'talk', 'wait'],
    authority:
      'Distinct tactical futures: investigate, position, talk, or disengage—not four paraphrases.',
    boostOn: ['pad_irrelevant'],
  },

  // --- rpg (12) ---
  {
    id: 'rpg-default',
    mode: 'rpg',
    when: ['opening', 'inspect', 'talk', 'travel', 'combat', 'wait'],
    authority: MODE_STORY_AUTHORITY.rpg,
    fallback: true,
  },
  {
    id: 'rpg-talk-tactic',
    mode: 'rpg',
    when: ['talk'],
    authority:
      'Change the NPC’s tactic; spend established leverage. Do not reprint their first speech.',
    boostOn: ['pad_irrelevant', 'atmosphere'],
  },
  {
    id: 'rpg-inspect-secret',
    mode: 'rpg',
    when: ['inspect'],
    authority:
      'Observation serves a relationship or secret; do not pause an urgent exchange for a setting lecture.',
    boostOn: ['atmosphere', 'collage'],
  },
  {
    id: 'rpg-travel-access',
    mode: 'rpg',
    when: ['travel'],
    authority:
      'Arrival changes who can ask, refuse, or forgive—not a new travelogue of the last street.',
    boostOn: ['atmosphere'],
  },
  {
    id: 'rpg-combat-leverage',
    mode: 'rpg',
    when: ['combat'],
    authority:
      'Do not default a tense talk to combat when leverage or refusal can still change the future.',
  },
  {
    id: 'rpg-wait-clock',
    mode: 'rpg',
    when: ['wait'],
    authority:
      'Waiting costs a relationship clock; someone acts, the offer expires, or a loyalty shifts.',
    boostOn: ['atmosphere'],
  },
  {
    id: 'rpg-opening-demand',
    mode: 'rpg',
    when: ['opening'],
    authority:
      'Lead with whose trust or demand is on the table; never state what the PC feels or decides.',
    boostOn: ['name_deny'],
  },
  {
    id: 'rpg-interiority',
    mode: 'rpg',
    when: ['talk', 'inspect'],
    authority:
      'Describe demands and what the PC can see; preserve interiority—do not decide their heart.',
    boostOn: ['pad_irrelevant'],
  },
  {
    id: 'rpg-recycle-cut',
    mode: 'rpg',
    when: ['talk', 'wait', 'inspect'],
    authority:
      'After a recycled beat, change trust, obligation, or tactic—not a synonym of the last speech.',
    boostOn: ['collage', 'atmosphere'],
  },
  {
    id: 'rpg-hook-why',
    mode: 'rpg',
    when: ['opening', 'talk'],
    authority:
      'Locked why stays; do not invent unearned leverage or erase a debt the ledger already holds.',
    boostOn: ['hook_contradiction'],
  },
  {
    id: 'rpg-name-defer',
    mode: 'rpg',
    when: ['opening', 'talk'],
    authority:
      'Here/place/you are not names; keep the social pressure moving instead of a name form.',
    boostOn: ['name_deny'],
  },
  {
    id: 'rpg-social-fork',
    mode: 'rpg',
    when: ['talk'],
    authority:
      'Leave at least two socially distinct futures—leverage, mercy, honesty, or distance.',
    boostOn: ['pad_irrelevant'],
  },

  // --- pyoa (12) ---
  {
    id: 'pyoa-default',
    mode: 'pyoa',
    when: ['opening', 'inspect', 'talk', 'travel', 'combat', 'wait'],
    authority: MODE_STORY_AUTHORITY.pyoa,
    fallback: true,
  },
  {
    id: 'pyoa-wait-fork',
    mode: 'pyoa',
    when: ['wait'],
    authority:
      'No Wait-Wait-Wait: deliver consequence, lock a route, change the crisis, then a real fork.',
    boostOn: ['pad_irrelevant', 'atmosphere'],
  },
  {
    id: 'pyoa-inspect-page',
    mode: 'pyoa',
    when: ['inspect'],
    authority:
      'Keep searching yields a new detail, a cost, or honest exhaustion—not four inspect paraphrases.',
    boostOn: ['atmosphere', 'pad_irrelevant'],
  },
  {
    id: 'pyoa-talk-lock',
    mode: 'pyoa',
    when: ['talk'],
    authority:
      'Resolve the spoken choice; lock what it closed. Do not immediately reopen the last fork.',
    boostOn: ['pad_irrelevant'],
  },
  {
    id: 'pyoa-travel-page',
    mode: 'pyoa',
    when: ['travel'],
    authority:
      'Arrival is a new page: the crisis changes and the prior lock stays closed.',
  },
  {
    id: 'pyoa-combat-fork',
    mode: 'pyoa',
    when: ['combat'],
    authority:
      'Resolve the chosen fork first; then offer a sharper, smaller set of distinct futures.',
  },
  {
    id: 'pyoa-opening-hot',
    mode: 'pyoa',
    when: ['opening'],
    authority:
      'The crisis is hot on page one; choices differ by objective, method, or cost—not delay pads.',
    boostOn: ['name_deny', 'pad_irrelevant'],
  },
  {
    id: 'pyoa-fork-lock',
    mode: 'pyoa',
    when: ['wait', 'talk', 'inspect'],
    authority:
      'Distinct futures—never four phrasings of the same delay. Lock what the last choice closed.',
    boostOn: ['pad_irrelevant'],
  },
  {
    id: 'pyoa-crisis-delta',
    mode: 'pyoa',
    when: ['wait', 'inspect', 'talk'],
    authority:
      'Do not reprint the crisis paragraph; advance danger, close a route, or change position.',
    boostOn: ['collage', 'atmosphere'],
  },
  {
    id: 'pyoa-hook-why',
    mode: 'pyoa',
    when: ['opening', 'talk'],
    authority:
      'Honor locked why; a rejoined page must still show the closed route in text, access, or cost.',
    boostOn: ['hook_contradiction'],
  },
  {
    id: 'pyoa-name-defer',
    mode: 'pyoa',
    when: ['opening', 'talk'],
    authority:
      'Here/place/you are not names; keep the page-local crisis moving.',
    boostOn: ['name_deny'],
  },
  {
    id: 'pyoa-ending-close',
    mode: 'pyoa',
    when: ['wait', 'talk'],
    authority:
      'If the central question is answered, end or transform—do not add buy-time pads.',
    boostOn: ['pad_irrelevant'],
  },
];

function lastPlayerText(state: GameState, playerInput?: string): string {
  const typed = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  if (typed && typed !== '(opening)') return typed;
  if (state.sceneFacts?.lastPlayerIntent?.text) return state.sceneFacts.lastPlayerIntent.text;
  for (let i = (state.log ?? []).length - 1; i >= 0; i--) {
    const e = state.log[i];
    if (e?.role === 'player' && e.content?.trim()) return e.content.trim();
  }
  return '';
}

function lastGmText(state: GameState): string {
  for (let i = (state.log ?? []).length - 1; i >= 0; i--) {
    const e = state.log[i];
    if (e?.role === 'gm' && e.content?.trim()) return e.content.trim();
  }
  return '';
}

export function classifyCraftWhen(state: GameState, playerInput?: string): CraftWhen | null {
  const opening = state.openingEstablishment;
  if (opening && opening.complete !== true) return 'opening';
  const t = lastPlayerText(state, playerInput);
  if (!t) return null;
  if (state.activeEncounter || /\b(attack|fight|strike|swing|cast|dodge|parry|lunge)\b/i.test(t)) {
    return 'combat';
  }
  if (/^\s*wait\b/i.test(t) || /\bwait and (?:watch|listen)\b/i.test(t)) return 'wait';
  if (
    /\b(look around|inspect|examine|scan|get bearings|explore (?:the )?(?:room|cell|area))\b/i.test(t)
    || /^(?:look|observe|explore|scout)\b/i.test(t)
  ) {
    return 'inspect';
  }
  if (/\b(travel|enter|go through|walk through|head to|return to|leave)\b/i.test(t)) return 'travel';
  if (/\b(ask|talk|speak|say|tell)\b/i.test(t)) return 'talk';
  const fam = state.sceneFacts?.lastPlayerIntent?.family;
  if (fam === 'inspect') return 'inspect';
  if (fam === 'talk') return 'talk';
  if (fam === 'travel') return 'travel';
  if (fam === 'flee') return 'combat';
  if (fam === 'demand') return 'talk';
  return null;
}

function lastBeatLooksAtmosphere(text: string): boolean {
  if (!text.trim()) return false;
  const sensory = (text.match(/\b(scent|smell|dust motes|air hangs|gloom|decay|perfume|silence)\b/gi) ?? [])
    .length;
  const delta = /\b(opens|says|offers|takes|arrives|new|someone|doorway)\b/i.test(text);
  return sensory >= 2 && !delta;
}

function detectDrought(
  state: GameState,
  when: CraftWhen | null,
  input: string
): { inspectAgain: boolean; atmosphere: boolean; noFork: boolean } {
  const signals = state.craftLedger?.lastSignals ?? [];
  const priorInspect =
    state.sceneFacts?.lastPlayerIntent?.family === 'inspect'
    || /\b(inspect|examine|look around)\b/i.test(state.sceneFacts?.lastPlayerIntent?.text ?? '');
  let earlierInspect = false;
  const players = (state.log ?? []).filter((e) => e?.role === 'player' && e.content?.trim());
  if (players.length >= 2) {
    const prev = players[players.length - 2]?.content ?? '';
    earlierInspect = /\b(inspect|examine|look around|scan)\b/i.test(prev);
  }
  return {
    inspectAgain: when === 'inspect' && (priorInspect || earlierInspect),
    atmosphere: signals.includes('atmosphere') || lastBeatLooksAtmosphere(lastGmText(state)),
    noFork:
      when === 'wait'
      || signals.includes('pad_irrelevant')
      || (state.engineMode === 'pyoa' && /^\s*wait\b/i.test(input)),
  };
}

function scoreRule(
  rule: CraftRule,
  when: CraftWhen | null,
  drought: ReturnType<typeof detectDrought>,
  boosts: Record<string, number>
): number {
  let score = 0;
  if (rule.fallback) score += 1;
  if (when && rule.when.includes(when)) score += WHEN_SCORE;
  if (drought.inspectAgain && rule.when.includes('inspect')) score += DROUGHT_SCORE;
  if (drought.atmosphere && rule.boostOn?.includes('atmosphere')) score += DROUGHT_SCORE;
  if (drought.noFork && (rule.when.includes('wait') || /fork/i.test(rule.id))) score += DROUGHT_SCORE;
  score += (boosts[rule.id] ?? 0) * BOOST_WEIGHT;
  return score;
}

export function compileCraftRules(state: GameState, playerInput?: string): CraftCompileResult {
  const mode: EngineMode = state.engineMode ?? 'rpg';
  const input = lastPlayerText(state, playerInput);
  const when = classifyCraftWhen(state, playerInput);
  const drought = detectDrought(state, when, input);
  const boosts = state.craftLedger?.boosts ?? {};
  const pool = CRAFT_RULES.filter((r) => r.mode === mode);
  const specific = pool
    .filter((r) => !r.fallback)
    .map((rule) => ({ rule, score: scoreRule(rule, when, drought, boosts) }))
    .filter((row) => row.score >= PICK_FLOOR && when && row.rule.when.includes(when))
    .sort(
      (a, b) =>
        b.score - a.score
        || a.rule.when.length - b.rule.when.length
        || a.rule.id.localeCompare(b.rule.id)
    );

  const picked = specific.slice(0, MAX_CRAFT_LINES);
  if (picked.length) {
    return {
      ruleIds: picked.map((p) => p.rule.id),
      lines: picked.map((p) => p.rule.authority),
      replacedModeLine: true,
      when,
    };
  }
  const fallback = pool.find((r) => r.fallback);
  return {
    ruleIds: fallback ? [fallback.id] : [],
    lines: fallback ? [fallback.authority] : [],
    replacedModeLine: false,
    when,
  };
}

/** Writer-facing SNAPSHOT injection is off — compiler still picks via compileCraftRules. */
export function formatCraftSnapshotLines(_state?: GameState, _playerInput?: string): string[] {
  return [];
}

export function applyCraftLearning(
  ledger: CraftLedger | undefined,
  signals: CraftSignal[],
  mode: EngineMode,
  appliedIds: string[]
): CraftLedger {
  const boosts: Record<string, number> = { ...(ledger?.boosts ?? {}) };
  for (const id of Object.keys(boosts)) {
    const next = Math.max(0, (boosts[id] ?? 0) - 1);
    if (next <= 0) delete boosts[id];
    else boosts[id] = next;
  }
  if (signals.length) {
    for (const rule of CRAFT_RULES) {
      if (rule.mode !== mode || !rule.boostOn?.length) continue;
      if (!rule.boostOn.some((s) => signals.includes(s))) continue;
      boosts[rule.id] = Math.min(3, (boosts[rule.id] ?? 0) + 2);
    }
  }
  return {
    boosts,
    lastSignals: signals,
    lastApplied: appliedIds,
  };
}

export function craftRulesForMode(mode: EngineMode): CraftRule[] {
  return CRAFT_RULES.filter((r) => r.mode === mode);
}

export function assertCraftAuthorityBudget(): string[] {
  return CRAFT_RULES.filter((r) => r.authority.length > AUTHORITY_MAX).map((r) => r.id);
}

export function stampCraftApplied(log: LogEntry[] | undefined, ruleIds: string[]): LogEntry[] {
  if (!log?.length || !ruleIds.length) return log ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]?.role === 'gm') {
      const next = log.slice();
      next[i] = { ...next[i], craftApplied: ruleIds.slice(0, MAX_CRAFT_LINES) };
      return next;
    }
  }
  return log;
}

/**
 * Batch F — commit-side check: specific CRAFT lines were applied but prose still
 * ignores them (atmosphere recycle / no delta). Mid writer stays OFF; boost+retry.
 */
export function proseIgnoresCraft(
  ruleIds: string[],
  prose: string,
  recentGmBeats: string[],
  when?: CraftWhen | null
): { ignored: boolean; ids: string[] } {
  const text = (prose ?? '').trim();
  const ignored: string[] = [];
  if (!text || !ruleIds.length) return { ignored: false, ids: ignored };

  // Lazy import pattern avoided — callers pass recent beats; use local heuristics
  // matching semanticLoopDetector atmosphere/delta cues (keep craftBook free of cycles).
  const atmosTokens =
    text.match(
      /\b(dust|motes?|gloom|decay|ozone|scent|smell|odou?r|perfume|acrid|metallic|tang|damp|earth|air|light|shafts?|slivers?|silence|debris|rubble|concrete|rebar|creak|timber|groan|cloying|hangs?|pierc(?:e|ing)|mournful|ruin|rott(?:ing|en)|stagnant)\b/gi
    ) ?? [];
  const hasDelta =
    /\b(?:a|an|the)\s+(?:man|woman|figure|stranger|official|warden|handler|registrar|girl|boy|soldier|merchant|priest|beast|skirmisher)\b|\b(?:steps?|walks?|enters?|emerges?|speaks?|says|asks|demands|offers?|attacks?|lunges?)\b|[“"][^”"]{8,}[”"]|\b(?:chest|locket|hole|gap|damage|blood)\b|\b(?:nothing new|already searched|same as before|nothing else)\b/i.test(
      text
    );
  const sensoryHeavy = atmosTokens.length >= 3 && !hasDelta;
  const exhaustedCue = /\b(nothing (?:else|new|more)|already known|already searched|no further|same as before)\b/i.test(
    text
  );

  for (const id of ruleIds) {
    if (!id || /default$/i.test(id)) continue;
    if (/inspect-delta|wait-delta|collage-cut/i.test(id)) {
      if (sensoryHeavy || (!hasDelta && atmosTokens.length >= 2 && (when === 'inspect' || when === 'wait'))) {
        ignored.push(id);
      }
    } else if (/inspect-exhaust/i.test(id)) {
      if (!exhaustedCue && sensoryHeavy) ignored.push(id);
    } else if (/travel-arrival/i.test(id)) {
      if (sensoryHeavy) ignored.push(id);
    }
  }

  // Near-clone of last GM under a delta CRAFT also counts as ignore.
  const last = [...(recentGmBeats ?? [])].reverse().find((b) => String(b ?? '').trim());
  if (last && ignored.length === 0) {
    const deltaRules = ruleIds.filter((id) => /inspect-delta|wait-delta|collage-cut/i.test(id));
    if (deltaRules.length) {
      const a = new Set(
        text
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 3)
      );
      const b = new Set(
        last
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 3)
      );
      let inter = 0;
      for (const t of a) if (b.has(t)) inter++;
      const union = new Set([...a, ...b]).size || 1;
      if (inter / union >= 0.55 && !hasDelta) {
        ignored.push(...deltaRules);
      }
    }
  }

  return { ignored: ignored.length > 0, ids: [...new Set(ignored)] };
}
