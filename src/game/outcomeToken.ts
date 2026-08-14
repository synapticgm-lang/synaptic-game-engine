import type { PlayerCheckResult } from './checkMath';
import type { PlayerIntent } from './intentParser';

/** Structured handoff: code truth → LLM narrates; must not invert. */
export interface OutcomeToken {
  action_id: string;
  actor: 'player';
  action_type: PlayerIntent['kind'];
  resolution: {
    check_type: string;
    die: 'd20';
    roll: number;
    modifier: number;
    total: number;
    dc: number;
    outcome: 'success' | 'failure' | 'critical' | 'fumble';
    degree: 'success' | 'failure';
  };
  narration_hooks: {
    tone: 'gritty' | 'tense' | 'triumphant' | 'grim';
    outcome_flavor: string;
    label: string;
  };
  /** One-line ledger truth for prompts. */
  summary: string;
}

export function buildOutcomeToken(
  check: PlayerCheckResult,
  intent: PlayerIntent
): OutcomeToken {
  const outcome =
    check.isCriticalSuccess
      ? 'critical'
      : check.isCriticalFailure
        ? 'fumble'
        : check.isSuccess
          ? 'success'
          : 'failure';
  const flavor = check.isCriticalSuccess
    ? 'devastating'
    : check.isCriticalFailure
      ? 'catastrophic_failure'
      : check.isSuccess
        ? 'solid_hit'
        : 'narrow_miss';
  const tone = check.isSuccess ? (check.isCriticalSuccess ? 'triumphant' : 'gritty') : 'grim';
  return {
    action_id: `act_${Date.now().toString(36)}`,
    actor: 'player',
    action_type: intent.kind,
    resolution: {
      check_type: check.label,
      die: 'd20',
      roll: check.d20,
      modifier: check.modifier,
      total: check.totalScore,
      dc: check.dc,
      outcome,
      degree: check.isSuccess ? 'success' : 'failure',
    },
    narration_hooks: {
      tone,
      outcome_flavor: flavor,
      label: check.label,
    },
    summary: check.narrativeOutcomeLabel,
  };
}

/** Inject into GM payload — numbers are ledger truth; narrate story only. */
export function formatOutcomeTokenForPrompt(token: OutcomeToken, litRpgHideMath: boolean): string {
  const hooks = `tone=${token.narration_hooks.tone}; flavor=${token.narration_hooks.outcome_flavor}; check=${token.narration_hooks.label}`;
  if (litRpgHideMath) {
    return `OUTCOME TOKEN (LEDGER TRUTH — narrate; do not invert, soften into the opposite, or invent a different result):
result=${token.summary}
action_type=${token.action_type}
${hooks}
Do NOT print d20/DC/mod numbers in prose or <system-log>. Story beat first, then System chrome.`;
  }
  return `OUTCOME TOKEN (LEDGER TRUTH — narrate; do not invert):
${JSON.stringify(token.resolution)}
${hooks}
summary=${token.summary}`;
}
