import type { GameState, LogEntry } from './types';
import {
  inventsPresenceOnEmptyScene,
  normalizeStoryCorpus,
  padChoicesToCount,
  sanitizeChoiceLabel,
} from './choicePipeline';
import {
  establishmentChoices,
  isOpeningEstablishmentPending,
  playerEngagesOpeningCover,
} from './openingEstablishment';
import { filterInventedContextChoices } from './choiceWarden';
import { isLookAroundAction } from './sandboxXp';
import { buildGeminiCriticPrompt } from './geminiCriticPrompt';
import { BUILD_STAMP } from './runManifest';
import { displayAdventurerName } from './pcNameAuthority';
import { canonicalizeIntent, detectSemanticLoop } from './semanticLoopDetector';
import { beatFingerprint, beatSimilarity } from './beatFingerprint';
import { compileChoices } from './choiceCompiler';
import { isBannedFallbackStub, isEngineRecoveryProse } from './sealedManifest';

const FALLBACK_CHOICE = '🎲 Let Fate Decide';

function lastGmStoryProse(state: GameState): string {
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    const content = typeof entry?.content === 'string' ? entry.content : '';
    if (entry?.role === 'gm' && content) {
      return normalizeStoryCorpus(content);
    }
  }
  return '';
}

/** Last committed GM pad — ActionBar must not ignore these when `state.choices` is empty. */
function lastGmOfferedChoices(state: GameState): string[] {
  for (let i = (state.log ?? []).length - 1; i >= 0; i--) {
    const entry = state.log[i];
    if (entry?.role !== 'gm') continue;
    const offered = entry.offeredChoices;
    if (!Array.isArray(offered) || offered.length === 0) continue;
    return offered.map((c) => String(c ?? '').trim()).filter(Boolean);
  }
  return [];
}

/**
 * Labels the ActionBar will show for this state — post-pipeline pad after
 * sanitize / alone-presence / invented-context filter / pad-to-count.
 * Opening covers use establishment chips when present; otherwise last GM
 * `offeredChoices` (fastSetupChips off used to return [] and hide ActionBar).
 */
function lastPlayerActionFromLog(state: GameState): string {
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    const content = typeof entry?.content === 'string' ? entry.content : '';
    if (entry?.role === 'player' && content) return content;
  }
  return '';
}

export function resolveOfferedChoices(state: GameState): string[] {
  if (isOpeningEstablishmentPending(state)) {
    const lastPlayer = lastPlayerActionFromLog(state);
    const skipCoverChips =
      isLookAroundAction(lastPlayer) && !playerEngagesOpeningCover(lastPlayer);
    if (!skipCoverChips) {
      const cover = establishmentChoices(state.openingEstablishment?.pending ?? [], state).slice(0, 4);
      if (cover.length) return cover;
    }
  }
  const storyProse = lastGmStoryProse(state);
  const fromState = (state.choices ?? [])
    .map((c) => sanitizeChoiceLabel(c))
    .filter((c) => c && c !== FALLBACK_CHOICE);
  const source = fromState.length ? fromState : lastGmOfferedChoices(state).map((c) => sanitizeChoiceLabel(c));
  const gmChoices = source.filter((c) => c && c !== FALLBACK_CHOICE)
    .filter((c) => !inventsPresenceOnEmptyScene(c, state, storyProse));

  const contextFiltered = filterInventedContextChoices(gmChoices, state);
  const compiled = compileChoices(
    state,
    contextFiltered,
    undefined,
    lastPlayerActionFromLog(state) || state.sceneFacts?.lastPlayerIntent?.text
  );
  const deduped = Array.from(new Set(compiled.choices.map((c) => c.trim()).filter(Boolean)));
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
function playMetaLines(state: GameState): string[] {
  const quests = (state.quests ?? [])
    .filter((q) => q.revealed || q.status === 'active' || q.status === 'completed')
    .slice(0, 8)
    .map((q) => `${q.name} [${q.status}]`);
  return [
    `- Save: ${state.saveId || '(none)'}`,
    `- Engine: ${state.engineMode || 'unknown'}`,
    `- Bible: ${state.campaignBibleId || '(none)'}`,
    `- Stamp: ${state.runManifest?.buildStamp || BUILD_STAMP}`,
    `- Turn: ${state.turn ?? 0}`,
    `- Location: ${state.currentLocation || '(unknown)'}`,
    `- Character: ${displayAdventurerName(state.character?.name)} · Level ${state.character?.level ?? '?'} · XP ${state.character?.xp ?? 0}/${state.character?.xpToNext ?? '?'}`,
    `- Quests: ${quests.length ? quests.join('; ') : '(none revealed)'}`,
    ...(state.arcDirector?.t12HookReceipt
      ? [
          `- T12 hook: ${state.arcDirector.t12HookReceipt.fired ? 'FIRED' : 'MISSED'} (${state.arcDirector.t12HookReceipt.reason}${state.arcDirector.t12HookReceipt.forced ? ', forced' : ''}) @T${state.arcDirector.t12HookReceipt.turn}`,
        ]
      : []),
    `- Exported: ${new Date().toISOString()}`,
  ];
}

export function buildPlayTranscript(state: GameState): string {
  const title = state.storyName?.trim() || state.character?.name?.trim() || 'Play transcript';
  const lines: string[] = [
    `# ${title}`,
    '',
    ...playMetaLines(state),
    '',
    '---',
    '',
  ];

  for (const entry of state.log ?? []) {
    if (!entry || typeof entry !== 'object') continue;
    const role = entry.role;
    const content = (typeof entry.content === 'string' ? entry.content : '').trim();
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
      const craftIds = entry.craftApplied;
      if (Array.isArray(craftIds) && craftIds.length > 0) {
        lines.push(`**Craft:** ${craftIds.filter(Boolean).join(', ')}`);
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

/**
 * Clean story export for external LLM review (Gemini etc.).
 * Keeps GM prose + player + options + reasoned STATUS/XP lines (no full Warden dumps).
 */
export function buildStoryReviewExport(
  state: GameState,
  meta?: {
    personalityId?: string;
    aiAgentMode?: string;
    seed?: number;
    reviewPrompt?: string;
    codeBaseline?: string;
    errorNote?: string;
  }
): string {
  const title = state.storyName?.trim() || state.character?.name?.trim() || 'Story review';
  const personalityId =
    meta?.personalityId ?? state.systemPersonality ?? state.gmPersonality ?? undefined;
  const lines: string[] = [
    `# Story quality review pack — ${title}`,
    '',
    '## Meta',
    '',
    `- Bible / story: ${title}`,
    `- Game mode: ${
      state.engineMode === 'dnd'
        ? 'Tabletop Fantasy (dnd)'
        : state.engineMode === 'rpg'
          ? 'Story RPG (rpg)'
          : state.engineMode === 'pyoa'
            ? 'Pick Your Own Adventure (pyoa)'
            : `LitRPG (${state.engineMode || 'litrpg'})`
    }`,
    `- Engine: ${state.engineMode || 'unknown'}`,
    `- Personality: ${personalityId ?? '(default)'}`,
    `- AI agent mode: ${meta?.aiAgentMode ?? 'n/a'}`,
    `- Seed: ${meta?.seed ?? '(n/a)'}`,
    `- Turns completed: ${state.turn ?? 0}`,
    `- Character: ${displayAdventurerName(state.character?.name)} · Level ${state.character?.level ?? '?'} · XP ${state.character?.xp ?? 0}/${state.character?.xpToNext ?? '?'}`,
    `- Code baseline: ${meta?.codeBaseline ?? 'unknown — treat findings as baseline-agnostic'}`,
    `- Exported: ${new Date().toISOString()}`,
    '',
    '## Critic prompt (follow this — then read the transcript)',
    '',
    meta?.reviewPrompt?.trim()
      || buildGeminiCriticPrompt({
        bibleTitle: title,
        personalityId,
        aiAgentMode: meta?.aiAgentMode,
        seed: meta?.seed,
        turns: state.turn ?? 0,
        level: state.character?.level ?? '?',
        xpLine: `${state.character?.xp ?? 0}/${state.character?.xpToNext ?? '?'}`,
        engineMode: state.engineMode,
        codeBaseline: meta?.codeBaseline,
        errorNote: meta?.errorNote,
      }),
    '',
    '---',
    '',
    '## Transcript',
    '',
    '_Each turn below: Narration → **Options:** (exact choices offered that beat) → **Player:** (what was picked) → optional **STATUS / System.**_',
    '',
  ];

  for (const entry of state.log ?? []) {
    if (!entry || typeof entry !== 'object') continue;
    const role = entry.role;
    const content = (typeof entry.content === 'string' ? entry.content : '').trim();
    if (role === 'gm') {
      lines.push(`### Turn ${entry.turn ?? '?'} — Narration`);
      lines.push('');
      lines.push(content || '_(empty)_');
      lines.push('');
      const offered = entry.offeredChoices;
      if (Array.isArray(offered) && offered.length > 0) {
        lines.push('**Options:**');
        for (const choice of offered) {
          const label = String(choice ?? '').trim();
          if (label) lines.push(`- ${label}`);
        }
        lines.push('');
      }
      const craftDump = entry.craftApplied;
      if (Array.isArray(craftDump) && craftDump.length > 0) {
        lines.push(`**Craft:** ${craftDump.filter(Boolean).join(', ')}`);
        lines.push('');
      }
      const sys = entry.systemLog;
      if (Array.isArray(sys) && sys.length > 0) {
        const useful = sys
          .map((s) => String(s ?? '').trim())
          .filter(Boolean)
          .filter((s) =>
            /XP Gained|Level|STATUS|Quest|item|loot|HP|MP|faction|discover|combat/i.test(s)
            && !/^Warden:/i.test(s)
          )
          .slice(0, 16);
        if (useful.length) {
          lines.push('**STATUS / System:**');
          for (const s of useful) lines.push(`- ${s}`);
          lines.push('');
        }
      }
    } else if (role === 'player') {
      lines.push(`**Player:** ${content || '_(empty)_'}`);
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}

/**
 * Batch D — Gemini story-lens paste: Narration bodies only.
 * Collapses consecutive engine recovery / banned stubs to `[engine fallback ×N]`.
 * Game-lens pastes should keep the full Options/STATUS transcript.
 */
export function buildNarrationOnlyStoryExport(
  state: GameState,
  meta?: {
    personalityId?: string;
    aiAgentMode?: string;
    seed?: number;
    codeBaseline?: string;
    errorNote?: string;
  }
): string {
  const title = state.storyName?.trim() || state.character?.name?.trim() || 'Story review';
  const personalityId =
    meta?.personalityId ?? state.systemPersonality ?? state.gmPersonality ?? undefined;
  const header = [
    `# Story quality review pack (Narration-only) — ${title}`,
    '',
    '## Meta',
    '',
    `- Bible / story: ${title}`,
    `- Engine: ${state.engineMode || 'unknown'}`,
    `- Personality: ${personalityId ?? '(default)'}`,
    `- Turns completed: ${state.turn ?? 0}`,
    `- Code baseline: ${meta?.codeBaseline ?? BUILD_STAMP}`,
    `- Format: Narration-only (Options / STATUS / Craft omitted). Ignore engine chrome.`,
    meta?.errorNote ? `- Errors: ${meta.errorNote}` : '',
    `- Exported: ${new Date().toISOString()}`,
    '',
    '---',
    '',
    '## Transcript (Narration-only)',
    '',
  ].filter((l) => l !== '');

  const turns: Array<{ turn: number | string; body: string }> = [];
  for (const entry of state.log ?? []) {
    if (!entry || entry.role !== 'gm') continue;
    turns.push({
      turn: entry.turn ?? turns.length + 1,
      body: (entry.content ?? '').trim() || '_(empty)_',
    });
  }
  return header.join('\n') + '\n' + collapseEngineFallbackNarration(turns) + '\n';
}

/** Collapse consecutive banned/recovery stubs across turn bodies for critic pastes. */
export function collapseEngineFallbackNarration(
  turns: Array<{ turn: number | string; body: string }>
): string {
  const lines: string[] = [];
  let stubRun = 0;
  let stubStartTurn: number | string | null = null;

  const flushStubs = () => {
    if (stubRun <= 0) return;
    if (stubRun === 1) {
      lines.push(`### Turn ${stubStartTurn} — Narration`);
      lines.push('');
      lines.push('[engine fallback ×1]');
      lines.push('');
    } else {
      lines.push(`### Turns ${stubStartTurn}–… — Narration`);
      lines.push('');
      lines.push(`[engine fallback ×${stubRun}]`);
      lines.push('');
    }
    stubRun = 0;
    stubStartTurn = null;
  };

  for (const t of turns) {
    const stub =
      isBannedFallbackStub(t.body) ||
      isEngineRecoveryProse(t.body) ||
      /^\[engine fallback/i.test(t.body);
    if (stub) {
      if (stubRun === 0) stubStartTurn = t.turn;
      stubRun += 1;
      continue;
    }
    flushStubs();
    lines.push(`### Turn ${t.turn} — Narration`);
    lines.push('');
    lines.push(t.body);
    lines.push('');
  }
  flushStubs();
  return lines.join('\n').trimEnd();
}

/**
 * Strip Options/STATUS/Player/Craft from an existing story-for-gemini transcript body
 * and collapse consecutive engine stubs — for morning paste tooling.
 */
export function narrationOnlyFromTranscriptMarkdown(transcriptBody: string): string {
  const chunks = transcriptBody.split(/^### Turn\s+/im);
  const turns: Array<{ turn: number | string; body: string }> = [];
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const m = chunk.match(/^(\d+|\?)\s*[—-]\s*Narration\s*\n+([\s\S]*?)(?=(?:\n\*\*Options:|\n\*\*Craft:|\n\*\*STATUS|\n\*\*Player:|\n###\s|$))/i);
    if (!m) {
      const turnMatch = chunk.match(/^(\d+|\?)/);
      const body = chunk
        .replace(/^(\d+|\?)\s*[—-]\s*Narration\s*/i, '')
        .replace(/\n\*\*(?:Options|Craft|STATUS \/ System):\*\*[\s\S]*$/i, '')
        .replace(/\n\*\*Player:\*\*[\s\S]*$/i, '')
        .trim();
      turns.push({ turn: turnMatch?.[1] ?? i, body: body || '_(empty)_' });
      continue;
    }
    turns.push({ turn: m[1]!, body: (m[2] ?? '').trim() || '_(empty)_' });
  }
  if (!turns.length) {
    // Fallback: drop option/status blocks from whole body
    const stripped = transcriptBody
      .replace(/\n\*\*Options:\*\*\n(?:- .+\n)*/gi, '\n')
      .replace(/\n\*\*Craft:\*\*.+\n/gi, '\n')
      .replace(/\n\*\*STATUS \/ System:\*\*\n(?:- .+\n)*/gi, '\n')
      .replace(/\n\*\*Player:\*\*.+\n/gi, '\n');
    return stripped.trim();
  }
  return (
    '## Transcript (Narration-only)\n\n' +
    '_Options / STATUS / Player lines omitted. Consecutive engine stubs collapsed._\n\n' +
    collapseEngineFallbackNarration(turns)
  );
}

export function downloadPlayTranscript(state: GameState): void {
  downloadTextFile(playTranscriptFilename(state), buildPlayTranscript(state), 'text/markdown;charset=utf-8');
}

function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function playDumpFilename(state: GameState): string {
  return playTranscriptFilename(state).replace('synaptic-transcript-', 'synaptic-play-');
}

function pairPlayTurns(state: GameState): Array<{
  turn: number;
  gmText: string;
  offeredChoices: string[];
  playerInput: string;
  systemLog: string[];
}> {
  const turns: Array<{
    turn: number;
    gmText: string;
    offeredChoices: string[];
    playerInput: string;
    systemLog: string[];
  }> = [];
  let pending: (typeof turns)[number] | null = null;
  for (const entry of state.log ?? []) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.role === 'gm') {
      if (pending) turns.push(pending);
      pending = {
        turn: entry.turn ?? turns.length + 1,
        gmText: (entry.content ?? '').trim(),
        offeredChoices: (entry.offeredChoices ?? []).map((c) => String(c ?? '').trim()).filter(Boolean),
        playerInput: '',
        systemLog: (entry.systemLog ?? []).map((s) => String(s ?? '').trim()).filter(Boolean),
      };
    } else if (entry.role === 'player' && pending) {
      pending.playerInput = (entry.content ?? '').trim();
      turns.push(pending);
      pending = null;
    }
  }
  if (pending) turns.push(pending);
  return turns;
}

/** Autoplay-shaped JSONL from fields the live save actually has. */
export function buildPlayTurnsJsonl(state: GameState): string {
  const bibleId = state.campaignBibleId ?? state.runManifest?.bibleId ?? '';
  const personalityId = state.systemPersonality ?? state.gmPersonality ?? '';
  const lines = pairPlayTurns(state).map((t) =>
    JSON.stringify({
      turn: t.turn,
      bibleId,
      engineMode: state.engineMode,
      personalityId,
      seed: state.seed ?? state.runManifest?.seed ?? null,
      offeredChoices: t.offeredChoices,
      playerInput: t.playerInput,
      gmText: t.gmText,
      systemLog: t.systemLog,
      location: state.currentLocation ?? null,
      level: state.character?.level ?? null,
      characterXp: state.character?.xp ?? null,
      xpToNext: state.character?.xpToNext ?? null,
      fatePick: null,
      durationMs: null,
      transportRetries: null,
      failKind: null,
    })
  );
  return lines.join('\n') + (lines.length ? '\n' : '');
}

function buildLoopReview(state: GameState): string {
  const turns = pairPlayTurns(state);
  const loop = detectSemanticLoop(state);
  const padFamilies = new Map<string, number>();
  const gmFps: string[] = [];
  let recycledBeats = 0;
  for (const t of turns) {
    for (const c of t.offeredChoices) {
      const intent = canonicalizeIntent(c, t.turn);
      const key = `${intent.action}:${intent.target}`;
      padFamilies.set(key, (padFamilies.get(key) ?? 0) + 1);
    }
    if (t.gmText) {
      const fp = beatFingerprint(t.gmText);
      if (gmFps.some((prev) => beatSimilarity(fp, prev) >= 0.72)) recycledBeats += 1;
      gmFps.push(fp);
    }
  }
  const topPads = [...padFamilies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const lines = [
    '## Loop review (from this save)',
    '',
    `- Player semantic loop: ${loop.isLoop ? `yes (${loop.loopCount}× ${loop.repeatedIntent?.action ?? ''} ${loop.repeatedIntent?.target ?? ''})` : 'no'}`,
    `- GM beats similar to an earlier beat: ${recycledBeats}`,
    `- Top choice families: ${topPads.length ? topPads.map(([k, n]) => `${k}×${n}`).join('; ') : '(none recorded)'}`,
    '',
    'Live saves do not store per-turn SNAPSHOT, latency, Fate pick, or transport retries — those exist only on headless autoplay `turns.jsonl`. The appendix below uses the autoplay field names and leaves those null.',
    '',
  ];
  return lines.join('\n');
}

/** Settings / Debug: transcript + loop flags + JSONL appendix. */
export function buildPlayDump(state: GameState): string {
  const jsonl = buildPlayTurnsJsonl(state);
  return [
    buildPlayTranscript(state).trimEnd(),
    '',
    '---',
    '',
    buildLoopReview(state).trimEnd(),
    '',
    '---',
    '',
    '## Turns (JSONL)',
    '',
    '```jsonl',
    jsonl.trimEnd() || '(empty)',
    '```',
    '',
  ].join('\n');
}

export function downloadPlayDump(state: GameState): void {
  downloadTextFile(playDumpFilename(state), buildPlayDump(state), 'text/markdown;charset=utf-8');
}

/** Debug / staff: same play dump plus a JSON sidecar (no eval-harness copy). */
export function downloadPlayDumpStaff(state: GameState): void {
  downloadPlayDump(state);
  const sidecar = {
    exportedAt: new Date().toISOString(),
    buildStamp: state.runManifest?.buildStamp || BUILD_STAMP,
    engineMode: state.engineMode,
    bibleId: state.campaignBibleId ?? null,
    saveId: state.saveId,
    turn: state.turn ?? 0,
    location: state.currentLocation ?? null,
    character: {
      name: state.character?.name,
      level: state.character?.level,
      xp: state.character?.xp,
      xpToNext: state.character?.xpToNext,
    },
    quests: (state.quests ?? []).map((q) => ({ id: q.id, name: q.name, status: q.status, revealed: q.revealed })),
    recentBeatFingerprints: state.recentBeatFingerprints ?? [],
    residuals: [
      'Headless-only autoplay fields not on live saves: durationMs, fatePick, transportRetries, failKind, startedAt/endedAt, receiptCounts, replayHash.',
    ],
    turnsJsonl: buildPlayTurnsJsonl(state),
  };
  downloadTextFile(
    playDumpFilename(state).replace(/\.md$/i, '.json'),
    JSON.stringify(sidecar, null, 2) + '\n',
    'application/json;charset=utf-8'
  );
}
