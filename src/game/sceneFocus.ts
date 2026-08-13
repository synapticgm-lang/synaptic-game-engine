import type { GameState, Quest } from './types';
import type { PlayerIntent } from './intentParser';

/**
 * Cross-mode scene focus: Guide Book / quests must not hijack the turn.
 * Applies to LitRPG, Story RPG, and 5e Fantasy alike.
 */

const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'your', 'their', 'this', 'that',
  'quest', 'system', 'tier', 'level', 'clear', 'reach', 'claim', 'active',
  'main', 'side', 'travel', 'meet', 'accept', 'complete', 'collect', 'defeat',
  'enter', 'nearby', 'estimated', 'creatures', 'mini', 'boss', 'drop',
]);

/** Pull place-like / proper nouns from quest text for hijack detection. */
export function extractQuestFocusKeywords(quests: Quest[]): string[] {
  const out = new Set<string>();
  for (const q of quests) {
    if (q.status !== 'active' && q.status !== 'hidden') continue;
    const blob = [q.name, q.description, q.location, ...(q.objectives ?? []).map((o) => o.description)]
      .filter(Boolean)
      .join(' ');
    // Multi-word phrases first (convenience store, dead zone, etc.)
    const phrases = blob.match(
      /\b(?:convenience\s+store|micro[- ]?dungeon|dead\s+zone|stronghold|harbor|keep|manor|academy|spire|caravan|relay\s+station|tea\s+shop|frontier|district)\b/gi
    );
    for (const p of phrases ?? []) out.add(p.toLowerCase().replace(/\s+/g, ' ').trim());

    for (const raw of blob.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) ?? []) {
      const n = raw.toLowerCase().trim();
      if (n.length < 4 || STOP.has(n)) continue;
      out.add(n);
    }
    for (const raw of blob.match(/\b(?:store|dungeon|keep|harbor|academy|spire|caravan|shrine|manor|fort|bridge|market|alley)\b/gi) ?? []) {
      out.add(raw.toLowerCase());
    }
  }
  return Array.from(out).filter((k) => k.length >= 4);
}

export function playerEngagesFocus(playerAction: string, keywords: string[]): boolean {
  const hay = playerAction.toLowerCase();
  return keywords.some((k) => k.length >= 4 && hay.includes(k));
}

export interface TurnMandate {
  block: string;
  intentLabel: string;
  focusKeywords: string[];
  playerEngagedQuestFocus: boolean;
}

/**
 * Binding per-turn instruction: what the GM must resolve. Injected for every engine mode.
 */
export function buildTurnMandate(
  playerAction: string,
  intent: PlayerIntent,
  state: GameState,
  typedVerbatim?: string
): TurnMandate {
  const focusKeywords = extractQuestFocusKeywords(state.quests ?? []);
  const engaged = playerEngagesFocus(playerAction, focusKeywords);
  const action = playerAction.replace(/\s+/g, ' ').trim().slice(0, 220);
  const typed = typedVerbatim?.replace(/\s+/g, ' ').trim().slice(0, 220);
  const actionLine =
    typed && typed.toLowerCase() !== action.toLowerCase()
      ? `Player typed: "${typed}"\nEngine reading (resolve THIS): "${action}"`
      : `Player action to resolve THIS turn: "${action}"`;

  const block = `=== TURN MANDATE (BINDING — ALL ENGINE MODES) ===
${actionLine}
Parsed intent: ${intent.label} (${intent.kind})
RULES:
1. Narrate the outcome of THAT action first (min 2 sentences about it).
2. Guide Book / campaign premise / quest log are BACKGROUND CONSTRAINTS only — not a script for this turn.
3. Do NOT mention quest markers, dungeons, shops, or quest locations unless the player engaged them or is already there.
4. Do NOT substitute a main-quest beat for the player's chosen action (practice, talk, inspect gear, ask a question, rest, etc.).
5. Numbered choices must follow from the action you just resolved — not from a distant quest card.
6. If they ask a person / someone nearby: they speak and that person answers. Do not replace the conversation with a lecture that everyone already heard the voice.
7. If they only ask what is going on: answer in-world from the last scene. Never write engine notes ("the sheet", "not a place you traveled to", "This is still [location label]").
Player engaged quest-focus locations this turn: ${engaged ? 'YES' : 'NO'}
========================================================`;

  return {
    block,
    intentLabel: intent.label,
    focusKeywords,
    playerEngagedQuestFocus: engaged,
  };
}

export interface HijackReport {
  hijacked: boolean;
  keywordsHit: string[];
  notes: string[];
}

/**
 * Detect when GM prose/choices pivot to quest locations the player did not engage.
 */
export function detectSceneHijack(
  playerAction: string,
  gmText: string,
  state: GameState
): HijackReport {
  const keywords = extractQuestFocusKeywords(state.quests ?? []);
  if (keywords.length === 0) return { hijacked: false, keywordsHit: [], notes: [] };
  if (playerEngagesFocus(playerAction, keywords)) {
    return { hijacked: false, keywordsHit: [], notes: [] };
  }

  // Already inside a tagged dungeon — location talk is fair.
  if (state.activeDungeon) return { hijacked: false, keywordsHit: [], notes: [] };

  const hay = gmText.toLowerCase();
  const hits = keywords.filter((k) => hay.includes(k));
  // Need a strong signal: dungeon/store/quest-marker language or 2+ focus hits
  const strong =
    /\b(quest\s+marker|micro[- ]?dungeon|first\s+dungeon|tier\s*1\s+micro)\b/i.test(gmText)
    || (hits.includes('dungeon') && hits.some((h) => h !== 'dungeon'))
    || hits.length >= 2;

  if (!strong && hits.length === 0) {
    return { hijacked: false, keywordsHit: [], notes: [] };
  }
  if (!strong && hits.length === 1 && hits[0] === 'dungeon') {
    // Lone "dungeon" in flavor without store/quest — still flag lightly
    return {
      hijacked: true,
      keywordsHit: hits,
      notes: ['Scene hijack: quest/dungeon focus without player engaging it'],
    };
  }
  if (!strong) return { hijacked: false, keywordsHit: hits, notes: [] };

  return {
    hijacked: true,
    keywordsHit: hits,
    notes: [
      `Scene hijack: narrated [${hits.slice(0, 4).join(', ')}] but player did not engage those foci`,
    ],
  };
}

/** Drop sentences that push unengaged quest locations (keeps the rest of the turn). */
export function stripHijackSentences(text: string, keywords: string[]): string {
  if (!keywords.length || !text.trim()) return text;
  const keys = keywords.filter((k) => k.length >= 4);
  const parts = text.split(/(?<=[.!?])\s+/);
  const kept = parts.filter((sentence) => {
    const s = sentence.toLowerCase();
    if (/\b(quest\s+marker|micro[- ]?dungeon|first\s+dungeon)\b/i.test(sentence)) return false;
    const hitCount = keys.filter((k) => s.includes(k)).length;
    return hitCount === 0;
  });
  const next = kept.join(' ').replace(/\n{3,}/g, '\n\n').trim();
  return next || text;
}

export function filterHijackChoices(choices: string[], keywords: string[]): string[] {
  if (!keywords.length) return choices;
  const keys = keywords.filter((k) => k.length >= 4);
  return choices.filter((c) => {
    const s = c.toLowerCase();
    if (/\b(quest\s+marker|micro[- ]?dungeon|clear(?:ing)?\s+the\s+dungeon)\b/i.test(c)) return false;
    return !keys.some((k) => s.includes(k));
  });
}

/** Whether a quest should expose objectives/locations to the model or UI. */
export function isQuestRevealed(q: Quest): boolean {
  return q.revealed === true;
}

export function withQuestReveal(quests: Quest[], questId: string): Quest[] {
  return quests.map((q) => (q.id === questId ? { ...q, revealed: true } : q));
}

/** Reveal first active quest when player explicitly asks about quests / registration objectives. */
export function maybeRevealQuestsFromPlayerAction(state: GameState, playerAction: string): Quest[] {
  const quests = state.quests ?? [];
  if (!/\b(quest|quests|objective|objectives|what\s+do\s+i\s+(?:do|get)|register(?:ing|ed)?|system\s+want|main\s+story|guide)\b/i.test(playerAction)) {
    return quests;
  }
  const firstHiddenActive = quests.find((q) => q.status === 'active' && !q.revealed);
  if (!firstHiddenActive) return quests;
  return withQuestReveal(quests, firstHiddenActive.id);
}
