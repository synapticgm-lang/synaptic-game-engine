/**
 * Live Drive — typed opening on the real cover-continue path, then play.
 * Fate T50 auto-completes covers and only taps chips. This path does not.
 */

import type { CampaignBible } from '@/data/campaigns';
import { isWriterMonologueLeak, isTokenSaladLeak } from './beatCommitGate';
import type { AiAgentMode } from './fateAutoplay';
import {
  applyHarvestedOpeningCovers,
  applyOpeningAnswer,
  coverContinuePads,
  establishmentChoices,
  isAloneArrivalOpening,
  pendingRequiredCovers,
  resolveOpeningMode,
  resolveOpeningPrompts,
  sanitizeOpeningNarration,
  ensureSystemReceipt,
} from './openingEstablishment';
import { classifyOpeningContinue } from './openingPointerCard';
import { applyOpeningContract, stitchOpeningContinue, stitchOpeningScene } from './openingStitch';
import { UNNAMED_ADVENTURER } from './pcNameAuthority';
import { withOfferedChoices } from './playTranscript';
import { withLitrpgSystemWindow } from './litrpgSystemWindow';
import { applyProseWarden, collectSceneObjectNames } from './proseWarden';
import { enforcePerspective } from './perspectiveWarden';
import { stripChoiceList } from './parser';
import { applyCommittedNarrative, seedOpeningSceneFacts } from './sceneFacts';
import { hookLockForWarden } from './hookLock';
import type { EngineMode, GameState, LogEntry } from './types';

export type LiveDriveFlag = {
  code: string;
  severity: 'hard' | 'soft';
  note: string;
};

export type LiveDriveTurnRecord = {
  turn: number;
  phase: 'cover' | 'play';
  persona: AiAgentMode;
  playerInput: string;
  gmText: string;
  offeredChoices: string[];
  coversPending: string[];
  nameLocked: string | null;
  location: string;
  flags: LiveDriveFlag[];
  thumbsDown: boolean;
  durationMs: number;
};

const GENERIC_PAD =
  /^(wait|look around|get (?:your )?bearings|leave(?: the scene)?|travel(?: to)?|inspect|talk|ask|attack|flee|loot|search|listen|offer|give|use|check status|keep (?:watch|moving)|stand (?:ground|still))\b/i;

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `ld-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function reopenCoversForLiveDrive(state: GameState, bible: CampaignBible): GameState {
  const character = { ...state.character, name: UNNAMED_ADVENTURER };
  const openingMode = resolveOpeningMode(bible, state.engineMode);
  const openingPromptsRaw = resolveOpeningPrompts(bible, state.engineMode, bible.archetype);
  const aloneArrival = !!state.openingEstablishment?.aloneArrival;
  const openingPrompts = applyOpeningContract(
    openingPromptsRaw,
    bible,
    aloneArrival,
    state.seed ?? state.saveId ?? '0'
  );
  const pending = pendingRequiredCovers(openingPrompts, character, openingMode);
  const answers = { ...(state.openingEstablishment?.answers ?? {}) };
  delete answers.name;
  return {
    ...state,
    character,
    openingEstablishment: {
      ...state.openingEstablishment,
      pending,
      answers,
      complete: pending.length === 0,
      sceneWritten: true,
      mode: openingMode,
      aloneArrival,
      registrar: state.openingEstablishment?.registrar,
      pickedHook: state.openingEstablishment?.pickedHook,
      pickedHookId: state.openingEstablishment?.pickedHookId,
      pickedHookFallback: state.openingEstablishment?.pickedHookFallback,
      hookLock: state.openingEstablishment?.hookLock,
    },
  };
}

function inspectLine(mode: EngineMode | undefined): string {
  if (mode === 'litrpg') return 'Inspect the panel';
  if (mode === 'dnd') return 'Inspect the door and the room you are in';
  if (mode === 'pyoa') return 'Inspect Wren and the room';
  return 'Inspect the room';
}

/** Human typed first beats — John's live false-start plus persona variants. */
export function liveDriveScriptedLines(persona: AiAgentMode, mode?: EngineMode): string[] {
  const inspect = inspectLine(mode);
  if (persona === 'maxlevel') {
    return [
      "What's going on? Who's here and can I fight them?",
      'My name is Jax. Search for a weapon or a way out',
      inspect,
    ];
  }
  if (persona === 'completionist') {
    return [
      "Look around. What's in this room?",
      'My name is Jax. Search everything of use or intel',
      inspect,
    ];
  }
  return [
    'Whats going on? My name why do you want that',
    "Think in your head 'why does it need to know my name is Jax' search the room you are in for anything of use or intel",
    inspect,
  ];
}

export function pickLiveDriveLine(
  persona: AiAgentMode,
  mode: EngineMode | undefined,
  scriptedIndex: number
): string | undefined {
  return liveDriveScriptedLines(persona, mode)[scriptedIndex];
}

function lockedName(state: GameState): string | null {
  const fromAnswers = state.openingEstablishment?.answers?.name?.trim();
  if (fromAnswers) return fromAnswers;
  const n = state.character.name?.trim() ?? '';
  if (!n || n === UNNAMED_ADVENTURER) return null;
  return n;
}

function titleTokens(text: string): string[] {
  const out: string[] = [];
  const re = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const t = m[1];
    if (t.length < 3) continue;
    if (/^(The|A|An|You|Your|This|That|Then|And|But|For|With|From|Into|Over|Under)$/.test(t)) continue;
    out.push(t);
  }
  return out;
}

function padGrounded(pad: string, story: string, player: string, state: GameState): boolean {
  if (GENERIC_PAD.test(pad.trim())) return true;
  const hay = `${story} ${player} ${state.currentLocation ?? ''} ${(state.sceneFacts?.present ?? []).join(' ')} ${(state.sceneFacts?.props ?? []).join(' ')} ${state.character.name ?? ''}`.toLowerCase();
  const nouns = titleTokens(pad);
  if (nouns.length === 0) return true;
  return nouns.some((n) => hay.includes(n.toLowerCase()));
}

export function criticLiveDriveTurn(input: {
  story: string;
  pads: string[];
  player: string;
  prevStories: string[];
  coversPending: boolean;
  nameLocked: string | null;
  state: GameState;
  /** True while this beat used stitchOpeningContinue. */
  openingContinue?: boolean;
}): LiveDriveFlag[] {
  const flags: LiveDriveFlag[] = [];
  const story = input.story ?? '';
  if (isWriterMonologueLeak(story)) {
    flags.push({ code: 'packet-echo', severity: 'hard', note: 'Writer/packet lecture committed as story' });
  }
  if (isTokenSaladLeak(story)) {
    flags.push({ code: 'token-salad', severity: 'hard', note: 'Token salad / nobody-inflection' });
  }
  if (input.openingContinue) {
    const openingGate = classifyOpeningContinue(input.state, story);
    if (!openingGate.accept) {
      flags.push({
        code: 'opening-continue-reject',
        severity: 'hard',
        note: openingGate.reasons.join('; ') || 'classifyOpeningContinue reject',
      });
    }
  }
  if (/called\s+"\s*,\s*"/.test(story) || /later learned was called/i.test(story)) {
    flags.push({ code: 'empty-here-comma', severity: 'hard', note: 'Empty HERE interpolated as comma' });
  }
  if (/\bAt alone in\b/i.test(story)) {
    flags.push({ code: 'at-alone', severity: 'hard', note: 'Fallback printed At alone in…' });
  }
  if (/street empty;\s*it is quiet;\s*System panel is visible/i.test(story)) {
    flags.push({ code: 'chip-lastbeat', severity: 'hard', note: 'Chip lastBeat dumped as story' });
  }
  if (/^\s*\d+\.\s/m.test(story)) {
    flags.push({ code: 'pad-list-in-prose', severity: 'hard', note: 'Numbered pad list in the book' });
  }
  if (/\bsomeone here\b/i.test(story)) {
    flags.push({ code: 'invent-smash', severity: 'hard', note: 'Invent-quota smash leftover' });
  }
  const prev = input.prevStories[input.prevStories.length - 1] ?? '';
  if (prev && story.trim() && story.trim() === prev.trim()) {
    flags.push({ code: 'verbatim-repeat', severity: 'hard', note: 'Exact reprint of the last GM beat' });
  }
  if (input.coversPending && input.pads.length > 0) {
    flags.push({
      code: 'chips-during-cover',
      severity: 'soft',
      note: 'Name/look cover is typed-only; chips here are leftover',
    });
  }
  if (!input.coversPending && input.pads.length === 0) {
    flags.push({ code: 'no-options', severity: 'soft', note: 'Play beat offered no chips' });
  }
  if (input.nameLocked) {
    for (const pad of input.pads) {
      if (/give (?:them |it )?(?:your )?name|confirm designation/i.test(pad)) {
        flags.push({
          code: 'name-chip-after-lock',
          severity: 'hard',
          note: `Name already ${input.nameLocked} but pad still asks: ${pad}`,
        });
      }
    }
  }
  if (!input.coversPending) {
    for (const pad of input.pads) {
      if (!padGrounded(pad, story, input.player, input.state)) {
        flags.push({
          code: 'pad-ungrounded',
          severity: 'soft',
          note: `Option not grounded in this beat: ${pad}`,
        });
      }
    }
  }
  return flags;
}

export async function headlessOpeningContinueTurn(
  state: GameState,
  playerInput: string
): Promise<{ state: GameState; gmText: string; offeredChoices: string[] }> {
  const playerEntry: LogEntry = {
    id: uid(),
    turn: state.turn,
    role: 'player',
    content: playerInput,
    timestamp: Date.now(),
  };
  const stepped = await applyOpeningAnswer(
    { ...state, log: [...state.log, playerEntry] },
    playerInput
  );
  const openingState = { ...stepped.state, pendingGeneratedOpening: false };
  let openingText = openingState.openingEstablishment?.sceneWritten
    ? stitchOpeningContinue(openingState, playerInput)
    : stitchOpeningScene(openingState);
  openingText = ensureSystemReceipt(openingState, sanitizeOpeningNarration(openingText));
  openingText = applyProseWarden(
    enforcePerspective(openingText, { perspective: 'second-person' }, openingState.character.name),
    {
      currentLocation: openingState.currentLocation,
      aloneArrival: isAloneArrivalOpening(openingState),
      inventory: openingState.inventory,
      sceneProps: collectSceneObjectNames(openingState),
      playerInput,
      hookLock: hookLockForWarden(openingState, openingText),
    }
  );
  const cleanOpening = stripChoiceList(openingText);
  const harvested = openingState.openingEstablishment
    ? applyHarvestedOpeningCovers(openingState.openingEstablishment, cleanOpening)
    : openingState.openingEstablishment;
  const pending = harvested?.pending ?? [];
  let pads: string[] | undefined = pending.length
    ? establishmentChoices(pending, openingState)
    : undefined;
  if (!pending.length) {
    pads = coverContinuePads({
      ...openingState,
      openingEstablishment: harvested ?? openingState.openingEstablishment,
    });
  }
  const openingTurn = openingState.turn + 1;
  const gmBase: LogEntry = {
    id: uid(),
    turn: openingState.turn,
    role: 'gm',
    content: cleanOpening,
    timestamp: Date.now(),
    systemLog: [],
  };
  const openingGm = withLitrpgSystemWindow(
    withOfferedChoices(gmBase, {
      ...openingState,
      choices: pads,
      openingEstablishment: harvested ? { ...harvested, sceneWritten: true } : harvested,
      log: [...openingState.log, gmBase],
    }),
    openingState,
    playerInput
  );
  const seeded = seedOpeningSceneFacts({ ...openingState, turn: openingTurn });
  const sceneFacts = applyCommittedNarrative(
    { ...openingState, sceneFacts: seeded, turn: openingTurn },
    cleanOpening,
    openingTurn
  );
  return {
    state: {
      ...openingState,
      turn: openingTurn,
      sceneFacts,
      log: [...openingState.log, openingGm],
      choices: pads,
      openingEstablishment: harvested ? { ...harvested, sceneWritten: true } : harvested,
      lastUpdated: Date.now(),
    },
    gmText: cleanOpening,
    offeredChoices: openingGm.offeredChoices ?? pads ?? [],
  };
}

export function liveDriveGeminiBrief(): string {
  return [
    '# Live Drive 4×T20 — Gemini Pro (response + options)',
    '',
    'HUD `2026-09-09c`. This is the **live cover-continue path**, not sealed Fate T50.',
    '',
    '- **T0** is New Game page 1 (local stitch). Context only.',
    '- **Cover turns** type like a human (why-name, Jax + search, inspect). Covers are **not** auto-completed. Fast-setup chips are off — Options may be empty while a name is still pending. That is current product law; still propose better chips.',
    '- **Play turns** after covers: Silent Engine receipts + compiled pads (Free MUD, no DeepSeek flavor).',
    '',
    '## Score EVERY player turn (T1+)',
    '',
    '1. **Response 1–10** — English, sense, answers what the player typed, flows from the last beat, does not reprint.',
    '2. **Options 1–10** — relevant to **this** response (not leftover name chips, not inventing a new room/cast).',
    '3. **Rewrite the response** — player-facing only. Ledger nouns only (HERE, CAST already on screen, kit already owned). Do **not** invent kit, places, HP chrome, “primary user designation,” or packet lectures.',
    '4. **Better options** — 3–6 chips grounded in **your rewrite**. No Give-your-name after Jax is locked.',
    '',
    'Review only. Do **not** paste rewrites into the game — they invent.',
    '',
  ].join('\n');
}

export function formatLiveDriveTurnForGemini(cellLabel: string, rec: LiveDriveTurnRecord): string {
  const opts =
    rec.offeredChoices.length === 0
      ? '_(none — typed opening / empty pad)_'
      : rec.offeredChoices.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const flags =
    rec.flags.length === 0
      ? '_(harness: none)_'
      : rec.flags.map((f) => `- ${f.severity.toUpperCase()} \`${f.code}\` — ${f.note}`).join('\n');
  return [
    `## ${cellLabel} — T${rec.turn} (${rec.phase} · ${rec.persona})`,
    '',
    `**Covers pending:** ${rec.coversPending.join(', ') || '(none)'}`,
    `**Name locked:** ${rec.nameLocked ?? '(none)'}`,
    `**HERE:** ${rec.location}`,
    `**Player:** ${rec.playerInput}`,
    '',
    '**Response:**',
    '',
    rec.gmText.trim() || '_(empty)_',
    '',
    '**Options:**',
    '',
    opts,
    '',
    '**Harness flags:**',
    flags,
    rec.thumbsDown ? '**Local thumbs:** down' : '',
    '',
    '### Your scores',
    '',
    '- Response /10:',
    '- Options /10:',
    '- Rewrite the response:',
    '- Better options:',
    '',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');
}
