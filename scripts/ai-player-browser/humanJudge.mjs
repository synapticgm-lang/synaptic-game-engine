/**
 * Hard human judge for the watched AI-player.
 * Flash is not the judge. This code floor votes DOWN even if the model thumbs UP.
 *
 * DOWN if: telegram / ledger speak, looping stitch, STATUS-only chrome,
 * combat resolving inside talk, wordy padded essay, or dull filler with
 * no HERE / action / spoken want.
 * UP only for a short interesting chapter beat.
 */

const NAME_TELEGRAM = /^They have the name [A-Za-z][A-Za-z'-]{1,20}\.?$/i;
const ROOM_WAITED = /The name \S+ already stood|The room waited on what you did next/i;
const LEDGER_SPEAK = /\bThey have the name\b|\bThe panel holds the name\b|\bThey still want a name\b/i;
const ALREADY_TOLD = /\balready (?:said it|answered you|holds what it will say)\b/i;
const COMBAT_IN_TALK = /\b(?:the blow landed|you (?:kill|strike|deal)|HP\b|\(\d+\/\d+ HP\)|press the attack|max_engaged)\b/i;
const STATUS_ONLY = /^(?:quest unlocked|xp gained|status:|level up)\b/i;
const WHO_CHIP = /\bwho are you\b/i;
const WANT_CHIP = /\bask what they want\b|\bwhat do they want\b/i;
const REFUSE_CHIP = /\bwhat happens if i refuse\b|\bask what happens if\b/i;
const TALK_LINE = /\bwho are you\b|\bask what they want\b|\bwhat do you want\b|\bwhat happens if i refuse\b/i;
/** Last-resort leftover fingerprints (18b inspect / 17i room-waited) — tester abort, not a game deny-list. */
const LAST_RESORT_MARK = /still has the next move|the same walls held|nothing new had come|took the room in once more|heat sits on the stones you already know|heat sat where you already felt it|a pause at .+ added nothing|the room waited on what you did next|the name \S+ already stood|you looked through .+ again/i;
const TESTER_REPEAT_TALK = /\b(?:loop(?:ing|ed)?|identical|last[- ]?resort|reprint|word-for-word|word for word|exact copy|copy-paste|copy paste|same paragraph|direct copy|stuck in a loop)\b/i;

export function normalizeBeat(raw) {
  return String(raw || '').replace(/\s+/g, ' ').trim();
}

/** Story paragraph only. SYSTEM / STATUS / Quest Unlocked is chrome, not the book. */
export function peelChromeFromBeat(raw) {
  const text = String(raw || '');
  const parts = text.split(/\n(?=(?:_>\s*)?SYSTEM\b)/i);
  if (parts.length > 1) {
    const story = normalizeBeat(parts[0]);
    const chrome = normalizeBeat(parts.slice(1).join('\n'));
    if (story.length >= 8 && /[a-z]/i.test(story) && !/^(?:_>\s*)?SYSTEM\b/i.test(story)) {
      return { story, chrome };
    }
  }
  const t = normalizeBeat(text);
  const plateOnly = /^(?:_>\s*)?SYSTEM\b/i.test(t)
    && /\b(?:Name|Level|HP|Registration|Mark)\b/i.test(t);
  if (plateOnly) return { story: '', chrome: t };
  if (STATUS_ONLY.test(t) && t.length < 80) return { story: '', chrome: t };
  return { story: t, chrome: '' };
}

export function isTelegramSpeak(story) {
  const t = normalizeBeat(story);
  if (!t) return true;
  if (NAME_TELEGRAM.test(t)) return true;
  if (ROOM_WAITED.test(t)) return true;
  if (LEDGER_SPEAK.test(t) && t.length < 90) return true;
  return false;
}

function sentenceCount(story) {
  return normalizeBeat(story).split(/(?<=[.!?])\s+/).filter((s) => s.length > 2).length;
}

function hasConcreteBeat(story) {
  const t = normalizeBeat(story);
  const here = /\b(?:you are|you were|in the|at the|here)\b/i.test(t);
  const speech = /["“]/.test(t) || /\banswers you\b/i.test(t);
  const action = /\b(?:stood|turned|said|held|looked|stepped|asked|answered|waited)\b/i.test(t);
  return here || speech || action;
}

export function judgeGmBeat({ gmStory, lastGm, lastPlayer, waitTimedOut } = {}) {
  const peeled = peelChromeFromBeat(gmStory);
  const story = peeled.story;
  const prev = peelChromeFromBeat(lastGm).story;
  const reasons = [];
  if (waitTimedOut) reasons.push('timeout');
  if (!story || story.length < 12) {
    reasons.push(peeled.chrome ? 'chrome' : 'empty');
  }
  if (story && isTelegramSpeak(story)) reasons.push('telegram');
  if (story && STATUS_ONLY.test(story) && story.length < 80) reasons.push('chrome');
  if (prev && story && story === prev) reasons.push('loop');
  if (ALREADY_TOLD.test(story) && prev && (story === prev || prev.includes(story.slice(0, 48)))) {
    reasons.push('already_told_loop');
  }
  if (prev && story && story !== prev && isLastResortReprint(story, prev)) {
    reasons.push('last_resort_reprint');
  }
  if (TALK_LINE.test(lastPlayer || '') && COMBAT_IN_TALK.test(story)) {
    reasons.push('combat_in_talk');
  }
  const n = sentenceCount(story);
  if (n > 8 || story.length > 900) reasons.push('wordy');
  if (story.length < 80 && !hasConcreteBeat(story) && !reasons.includes('telegram')) {
    reasons.push('dull');
  }
  const down = reasons.length > 0;
  return {
    down,
    thumb: down ? 'down' : 'up',
    nonsense_options: reasons.some((r) => (
      r === 'telegram' || r === 'loop' || r === 'already_told_loop' || r === 'last_resort_reprint'
      || r === 'combat_in_talk' || r === 'chrome' || r === 'timeout'
    )),
    reasons,
  };
}

export function markHallTopics(answered, line) {
  const next = { ...answered };
  const t = String(line || '');
  if (WHO_CHIP.test(t) || /\bwho (?:is|are) (?:it|that|you)\b/i.test(t)) next.who = true;
  if (WANT_CHIP.test(t) || /\bwhat\b.{0,32}\bwant\b/i.test(t)) next.want = true;
  if (REFUSE_CHIP.test(t) || /\bif i refuse\b/i.test(t)) next.refuse = true;
  return next;
}

export function filterAnsweredHallChips(chips, answered) {
  return (chips || []).filter((c) => {
    if (answered?.who && WHO_CHIP.test(c)) return false;
    if (answered?.want && WANT_CHIP.test(c)) return false;
    if (answered?.refuse && REFUSE_CHIP.test(c)) return false;
    return true;
  });
}

export function pickNonHallChip(chips, answered, skip = []) {
  const live = filterAnsweredHallChips(chips, answered);
  const skipNorm = new Set((skip || []).map((s) => String(s || '').trim().toLowerCase()).filter(Boolean));
  return live.find((c) => {
    if (/\b(press the attack|try to flee|parley|attack|flee)\b/i.test(c)) return false;
    if (skipNorm.has(String(c).trim().toLowerCase())) return false;
    return true;
  }) || '';
}

const LOITER_CHIP = /\binspect the panel\b|\blook around\b|\bwait and watch\b|\bwait\b/i;

/** Same leftover inspect/look twice = not a human. Force a typed line. */
export function shouldForceTypedHumanMove(chips, recentActions, chipsOnly) {
  if (chipsOnly) return false;
  const live = (chips || []).filter(Boolean);
  if (!live.length) return true;
  if (live.length === 1 && LOITER_CHIP.test(live[0])) return true;
  const last = String(recentActions?.at(-1) || '').trim().toLowerCase();
  if (last && live.some((c) => c.trim().toLowerCase() === last && LOITER_CHIP.test(c))) return true;
  const inspects = (recentActions || []).filter((a) => /inspect the panel/i.test(a)).length;
  if (inspects >= 1 && live.every((c) => /inspect the panel/i.test(c))) return true;
  return false;
}

const HUMAN_TYPE_FALLBACKS = [
  'I look the handler in the eye. What happens if I walk away?',
  'I take a step toward the nearest doorway.',
  'I wait and watch their faces.',
  'What do you need from me right now?',
  'I check what I am wearing and what I still have.',
];

export function naturalTypedFallback(recentActions = []) {
  const used = new Set((recentActions || []).map((a) => String(a).trim().toLowerCase()));
  return HUMAN_TYPE_FALLBACKS.find((line) => !used.has(line.toLowerCase()))
    || HUMAN_TYPE_FALLBACKS[recentActions.length % HUMAN_TYPE_FALLBACKS.length];
}

export function isFlashJudgeModel(model) {
  const id = String(model || '').trim();
  return id === 'google/gemini-2.5-flash' || id === 'gemini-2.5-flash';
}

export function isLastResortReprint(story, lastGm) {
  const t = normalizeBeat(story);
  const prev = normalizeBeat(lastGm);
  if (!t || !prev) return false;
  if (t === prev) return true;
  if (LAST_RESORT_MARK.test(t) && LAST_RESORT_MARK.test(prev)) return true;
  if (ALREADY_TOLD.test(t) && (t === prev || prev.includes(t.slice(0, 48)))) return true;
  return false;
}

/** Tester note / hard floor said loop, identical, or last-resort reprint. */
export function testerFlagsRepeat(decision = {}, hardJudge = {}) {
  const reasons = hardJudge.reasons || [];
  if (reasons.some((r) => r === 'loop' || r === 'already_told_loop' || r === 'last_resort_reprint')) {
    return true;
  }
  const blob = [decision.comment, decision.note, decision.flag].filter(Boolean).join(' ');
  return TESTER_REPEAT_TALK.test(blob);
}

/**
 * One repeat signal for the stop-after-2-consecutive abort.
 * lastGm must be the prior beat, never the same string as gmStory.
 */
export function detectRepeatSignal({ gmStory, lastGm, decision, hardJudge } = {}) {
  const story = peelChromeFromBeat(gmStory).story;
  const prev = peelChromeFromBeat(lastGm).story;
  const reasons = [];
  if (!prev || !story) {
    return { hit: false, reasons };
  }
  if (story === prev) reasons.push('same_gm');
  if (isLastResortReprint(story, prev) && story !== prev) reasons.push('last_resort_reprint');
  if ((hardJudge?.reasons || []).some((r) => r === 'loop' || r === 'already_told_loop')) {
    reasons.push('hard_loop');
  }
  if (testerFlagsRepeat(decision, {})) reasons.push('tester_flag');
  return { hit: reasons.length > 0, reasons: [...new Set(reasons)] };
}
