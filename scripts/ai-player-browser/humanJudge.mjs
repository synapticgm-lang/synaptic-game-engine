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

export function normalizeBeat(raw) {
  return String(raw || '').replace(/\s+/g, ' ').trim();
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

export function judgeGmBeat({ gmStory, lastGm, lastPlayer } = {}) {
  const story = normalizeBeat(gmStory);
  const prev = normalizeBeat(lastGm);
  const reasons = [];
  if (!story || story.length < 12) reasons.push('empty');
  if (isTelegramSpeak(story)) reasons.push('telegram');
  if (STATUS_ONLY.test(story) && story.length < 80) reasons.push('chrome');
  if (prev && story && story === prev) reasons.push('loop');
  if (ALREADY_TOLD.test(story) && prev && (story === prev || prev.includes(story.slice(0, 48)))) {
    reasons.push('already_told_loop');
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
      r === 'telegram' || r === 'loop' || r === 'already_told_loop' || r === 'combat_in_talk' || r === 'chrome'
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

export function pickNonHallChip(chips, answered) {
  const live = filterAnsweredHallChips(chips, answered);
  return live.find((c) => !/\b(press the attack|try to flee|parley|attack|flee)\b/i.test(c)) || '';
}

export function isFlashJudgeModel(model) {
  const id = String(model || '').trim();
  return id === 'google/gemini-2.5-flash' || id === 'gemini-2.5-flash';
}
