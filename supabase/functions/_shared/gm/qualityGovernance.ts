/** Edge stub — governance SNAPSHOT lines; opening pin mirrored from client state. */
export function buildGovernanceSnapshotLines(state: {
  openingEstablishment?: { pinnedNpcNames?: string[]; aloneArrival?: boolean };
  turn?: number;
}): string[] {
  const lines: string[] = [];
  const pinned = state.openingEstablishment?.pinnedNpcNames ?? [];
  const alone = state.openingEstablishment?.aloneArrival === true;
  if (pinned.length && (state.turn ?? 0) <= 20 && !alone) {
    lines.push(
      `OPENING PIN: ${pinned.join(', ')} stay present and consequential — do not forget the opening offer or replace them with stranger/kit nouns.`
    );
  }
  return lines;
}
