/** Edge stub — progress governor lives on client; SNAPSHOT uses soft defaults. */
export function initProgressGovernor(): Record<string, unknown> {
  return {};
}

export function hasActiveObjectives(state: { quests?: Array<{ status?: string }> }): boolean {
  return (state.quests ?? []).some((q) => q.status === 'active');
}

export function checkProgressGovernor(
  _state: unknown,
  _governor: unknown,
  _activeObjective: boolean
): { needsProgress?: boolean; mandate?: string } {
  return {};
}
