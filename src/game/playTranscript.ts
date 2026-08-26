import type { GameState, LogEntry } from './types';
import {
  inventsPresenceOnEmptyScene,
  normalizeStoryCorpus,
  padChoicesToCount,
  sanitizeChoiceLabel,
} from './choicePipeline';
import { establishmentChoices, isOpeningEstablishmentPending } from './openingEstablishment';
import { filterInventedContextChoices } from './choiceWarden';

const FALLBACK_CHOICE = '🎲 Let Fate Decide';

function lastGmStoryProse(state: GameState): string {
  for (let i = (state.log ?? []).length - 1; i >= 0; i--) {
    const entry = state.log[i];
    if (entry?.role === 'gm' && entry.content) {
      return normalizeStoryCorpus(entry.content);
    }
  }
  return '';
}

/**
 * Labels the ActionBar will show for this state — post-pipeline pad after
 * sanitize / alone-presence / invented-context filter / pad-to-count.
 * Opening covers use establishment chips only (same as ActionBar).
 */
export function resolveOfferedChoices(state: GameState): string[] {
  if (isOpeningEstablishmentPending(state)) {
    return establishmentChoices(state.openingEstablishment?.pending ?? [], state).slice(0, 4);
  }
  const storyProse = lastGmStoryProse(state);
  const gmChoices = (state.choices ?? [])
    .map((c) => sanitizeChoiceLabel(c))
    .filter((c) => c && c !== FALLBACK_CHOICE)
    .filter((c) => !inventsPresenceOnEmptyScene(c, state, storyProse));

  const contextFiltered = filterInventedContextChoices(gmChoices, state);
  const deduped = Array.from(new Set(contextFiltered.map((c) => c.trim()).filter(Boolean)));
  if (deduped.length >= 3) return deduped.slice(0, 4);
  return padChoicesToCount(deduped, state, storyProse, 3);
}

/** Attach post-pipeline labels the player will see after this GM beat. */
export function withOfferedChoices(entry: LogEntry, stateForPad: GameState): LogEntry {
  const offered = resolveOfferedChoices(stateForPad);
  if (!offered.length) return entry;
  return { ...entry, offeredChoices: offered };
}

function slugFilenamePart(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return s || 'session';
}

export function playTranscriptFilename(state: GameState): string {
  const idOrName = state.saveId?.trim() || state.storyName?.trim() || '';
  if (idOrName) return `synaptic-transcript-${slugFilenamePart(idOrName)}.md`;
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `synaptic-transcript-${y}-${m}-${day}.md`;
}

/**
 * Chronological readable transcript: GM → Options offered → player.
 * Missing `offeredChoices` on old saves omits that section (no crash).
 */
export function buildPlayTranscript(state: GameState): string {
  const title = state.storyName?.trim() || state.character?.name?.trim() || 'Play transcript';
  const lines: string[] = [
    `# ${title}`,
    '',
    `- Save: ${state.saveId || '(none)'}`,
    `- Engine: ${state.engineMode || 'unknown'}`,
    `- Turn: ${state.turn ?? 0}`,
    `- Exported: ${new Date().toISOString()}`,
    '',
    '---',
    '',
  ];

  for (const entry of state.log ?? []) {
    if (!entry || typeof entry !== 'object') continue;
    const role = entry.role;
    const content = (entry.content ?? '').trim();
    if (role === 'gm') {
      lines.push(`## Turn ${entry.turn ?? '?'} — GM`);
      lines.push('');
      lines.push(content || '_(empty)_');
      lines.push('');
      const offered = entry.offeredChoices;
      if (Array.isArray(offered) && offered.length > 0) {
        lines.push('### Options offered');
        lines.push('');
        for (const choice of offered) {
          const label = String(choice ?? '').trim();
          if (label) lines.push(`- ${label}`);
        }
        lines.push('');
      }
      const sys = entry.systemLog;
      if (Array.isArray(sys) && sys.length > 0) {
        const useful = sys.map((s) => String(s ?? '').trim()).filter(Boolean).slice(0, 12);
        if (useful.length) {
          lines.push('### System');
          lines.push('');
          for (const s of useful) lines.push(`- ${s}`);
          lines.push('');
        }
      }
    } else if (role === 'player') {
      lines.push(`### Player`);
      lines.push('');
      lines.push(content || '_(empty)_');
      lines.push('');
    } else if (role === 'system' && content) {
      lines.push(`### System note`);
      lines.push('');
      lines.push(content);
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}

export function downloadPlayTranscript(state: GameState): void {
  const markdown = buildPlayTranscript(state);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = playTranscriptFilename(state);
  a.click();
  URL.revokeObjectURL(url);
}
