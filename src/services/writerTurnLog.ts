/**
 * q57-AIPSRV — one ai_traffic row per writer turn (label writer_turn) so AI-player
 * tester beats can be matched to the final committed GM text, gate, and fact check.
 * Fire-and-forget; never changes the turn text.
 */
import type { GameState } from '@/game/types';
import {
  COMBAT_STATUS_CONTRADICTION,
  PC_AGENCY,
  POSES_CHOICE,
  RECORD_READOUT,
  ROLL_CONTRADICTION,
  engineFactProblems,
} from '@/game/engineFactGate';
import { drainWriterUsage, noteWriterUsage } from '@/game/gmProxy';
import { splitProseSentences } from '@/game/proseSentences';
import { logAiTraffic, mapEngineMode } from '@/services/telemetryService';

const PACKET_CAP = 24_000;
const TEXT_CAP = 8_000;

export type WriterTurnGateLog = {
  outcome: string;
  problems: string[];
  remaining: string[];
  repairs: number;
  draftRetry: boolean;
  fightRetry: boolean;
};

export type WriterTurnModelLog = {
  id: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  tokensCached: number | null;
  modelCalls: number | null;
};

export type WriterTurnFactError = {
  code: string;
  msg: string;
  sentence: string;
};

export type LogWriterTurnArgs = {
  /** Free MUD / authored-book turns have no writer pass — skip the insert. */
  skip?: boolean;
  saveId: string | null | undefined;
  turnRequestId: string;
  turn: number;
  playerInput: string;
  finalText: string;
  firstDraft: string;
  /** Text the writer receives (callGm player payload). */
  writerPacket: string;
  bibleId?: string | null;
  engineMode?: string | null;
  buildStamp?: string | null;
  gate?: Partial<WriterTurnGateLog> | null;
  state: GameState;
  /** When omitted, peeks the same gm-turn usage drainWriterUsage reads for feedback. */
  model?: WriterTurnModelLog | null;
};

function cap(text: string, max: number): { text: string; truncated: boolean } {
  const raw = text ?? '';
  if (raw.length <= max) return { text: raw, truncated: false };
  return { text: raw.slice(0, max), truncated: true };
}

function factErrorCode(msg: string): string {
  if (msg === RECORD_READOUT) return 'record_readout';
  if (msg === POSES_CHOICE) return 'poses_choice';
  if (msg === ROLL_CONTRADICTION) return 'roll_contradiction';
  if (msg === PC_AGENCY) return 'pc_agency';
  if (msg === COMBAT_STATUS_CONTRADICTION) return 'combat_status';
  return 'engine_fact';
}

/** Per-sentence engineFactProblems on the final committed text. */
export function buildWriterTurnFactCheck(
  state: GameState,
  finalText: string,
  playerInput = '',
): { checker: 'engineFactProblems'; pass: boolean; errors: WriterTurnFactError[] } {
  const errors: WriterTurnFactError[] = [];
  const sentences = splitProseSentences(finalText);
  const parts = sentences.length ? sentences : finalText.trim() ? [finalText.trim()] : [];
  for (const sentence of parts) {
    for (const msg of engineFactProblems(state, sentence, playerInput)) {
      errors.push({ code: factErrorCode(msg), msg, sentence });
    }
  }
  return { checker: 'engineFactProblems', pass: errors.length === 0, errors };
}

/** Drain then re-note so a later drainWriterUsage (gmEntry) still sees the same totals. */
function peekWriterModel(): WriterTurnModelLog | null {
  const u = drainWriterUsage();
  if (!u) return null;
  noteWriterUsage({
    tokensIn: u.tokensIn,
    tokensOut: u.tokensOut,
    tokensCached: u.tokensCached,
    modelCalls: u.modelCalls,
    modelId: u.modelId,
    costUsd: u.costUsd,
  });
  return {
    id: u.modelId ?? null,
    tokensIn: u.tokensIn,
    tokensOut: u.tokensOut,
    tokensCached: u.tokensCached,
    modelCalls: u.modelCalls,
  };
}

function emptyGate(partial?: Partial<WriterTurnGateLog> | null): WriterTurnGateLog {
  return {
    outcome: partial?.outcome ?? 'accepted',
    problems: partial?.problems ?? [],
    remaining: partial?.remaining ?? [],
    repairs: partial?.repairs ?? 0,
    draftRetry: partial?.draftRetry ?? false,
    fightRetry: partial?.fightRetry ?? false,
  };
}

/**
 * Fire-and-forget insert of one writer_turn ai_traffic row.
 * Never awaited by the turn; failures console.warn only; does not throw.
 */
export function logWriterTurn(args: LogWriterTurnArgs): void {
  try {
    if (args.skip) return;

    const packet = cap(args.writerPacket ?? '', PACKET_CAP);
    const first = cap(args.firstDraft ?? '', TEXT_CAP);
    const finalCapped = cap(args.finalText ?? '', TEXT_CAP);
    const gate = emptyGate(args.gate);
    const factCheck = buildWriterTurnFactCheck(args.state, args.finalText ?? '', args.playerInput ?? '');
    const model =
      args.model !== undefined
        ? args.model
        : peekWriterModel();
    const tokensIn = model?.tokensIn ?? null;
    const tokensOut = model?.tokensOut ?? null;
    const tokenCount =
      typeof tokensIn === 'number' && typeof tokensOut === 'number'
        ? tokensIn + tokensOut
        : null;

    void logAiTraffic({
      status: '200 OK',
      save_id: args.saveId ?? null,
      player_input: args.playerInput,
      ai_response: args.finalText,
      token_count: tokenCount,
      engine_mode: mapEngineMode(args.engineMode),
      payload: {
        label: 'writer_turn',
        turn: args.turn,
        saveId: args.saveId ?? null,
        turnRequestId: args.turnRequestId,
        bibleId: args.bibleId ?? null,
        engineMode: args.engineMode ?? null,
        buildStamp: args.buildStamp ?? null,
        writerPacket: packet.text,
        ...(packet.truncated ? { packetTruncated: true } : { packetTruncated: false }),
        firstDraft: first.text,
        finalText: finalCapped.text,
        gate,
        factCheck,
        model: {
          id: model?.id ?? null,
          tokensIn: model?.tokensIn ?? null,
          tokensOut: model?.tokensOut ?? null,
          tokensCached: model?.tokensCached ?? null,
          modelCalls: model?.modelCalls ?? null,
        },
      },
    });
  } catch (err) {
    console.warn('[writerTurnLog] failed', err instanceof Error ? err.message : err);
  }
}
