/**
 * After a chip click, decide from page snapshots whether the game sent a turn
 * or only opened the action box. Never looks at chip labels.
 *
 * input_opened: no turn in flight and the action box became focused, visible,
 * newly enabled, or simply visible and enabled with no turn sent (page state
 * only).
 */

function count(snap, numKey, listKey) {
  if (typeof snap?.[numKey] === 'number') return snap[numKey];
  if (Array.isArray(snap?.[listKey])) return snap[listKey].length;
  return 0;
}

export function classifyChipClick({ before, after } = {}) {
  const prev = before || {};
  const next = after || {};
  const newRow = count(next, 'playerCount', 'playerLines') > count(prev, 'playerCount', 'playerLines')
    || Number(next.gmStoryCount || 0) > Number(prev.gmStoryCount || 0);
  if (next.busy || next.turnInFlight || newRow) return 'turn_sent';

  const becameFocused = Boolean(next.inputFocused) && !prev.inputFocused;
  const becameVisible = next.inputVisible === true && prev.inputVisible === false;
  const becameEnabled = next.inputEnabled === true && prev.inputEnabled === false;
  // The game does not focus the box for a free-input chip (it only sets pendingFreeInput): a click that sent no turn
  // while the action box is visible and enabled means the game is waiting for typed text.
  const idleWithBox = next.inputEnabled === true && next.inputVisible !== false;
  if (becameFocused || becameVisible || becameEnabled || idleWithBox) return 'input_opened';
  return 'nothing';
}

/** Model line when it is not the chip that was just clicked. Empty means use naturalTypedFallback. */
export function modelLineIfDistinct(decision, clicked) {
  const action = String(decision?.action || '').trim();
  const chip = String(clicked || '').trim();
  if (!action) return '';
  if (chip && action.toLowerCase() === chip.toLowerCase()) return '';
  return action;
}
