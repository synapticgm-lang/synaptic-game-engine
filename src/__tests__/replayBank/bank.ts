/**
 * Small readers over replayed steps, shared by the per-seed replay case files.
 * Turn `n` here is the harness turn (the `turn` field of turns.jsonl; turn 1 is the opening page).
 */
import { resolveOfferedChoices } from '../../game/playTranscript';
import type { GameState, LogEntry } from '../../game/types';
import { stepAt, type ReplayStep } from './replayRun';

export class Replay {
  constructor(readonly steps: ReplayStep[]) {}

  at(n: number): ReplayStep {
    return stepAt(this.steps, n);
  }
  before(n: number): GameState {
    return this.at(n).before;
  }
  after(n: number): GameState {
    return this.at(n).after;
  }
  /** Chips the player saw when choosing turn n. */
  chips(n: number): string[] {
    return this.at(n).telemetry.offeredChoices ?? [];
  }
  /** Chips the engine offers after turn n committed (the next pick list). */
  chipsAfter(n: number): string[] {
    return resolveOfferedChoices(this.after(n));
  }
  input(n: number): string {
    return this.at(n).telemetry.playerInput ?? '';
  }
  prose(n: number): string {
    return this.at(n).telemetry.gmText ?? '';
  }
  receipts(n: number): string[] {
    const t = this.at(n).telemetry;
    return [...(t.arcStatusReceipts ?? []), ...(t.systemLog ?? [])];
  }
  receiptText(n: number): string {
    return this.receipts(n).join('\n');
  }
  notes(n: number): string[] {
    const t = this.at(n).telemetry;
    return [...(t.wardenNotes ?? []), ...(t.systemLog ?? [])];
  }
  noteText(n: number): string {
    return this.notes(n).join('\n');
  }
  verdicts(n: number): string[] {
    return this.at(n).telemetry.tokenVerdicts ?? [];
  }
  /** Every packet the engine handed the writer on turn n. */
  packet(n: number): string {
    return this.at(n).writerPackets.join('\n----\n');
  }
  /** One block of the writer packet, from its header line to the next blank-line-led header. */
  packetBlock(n: number, header: string): string {
    return packetBlock(this.packet(n), header);
  }
  turnCheck(n: number) {
    return this.at(n).turnCheck;
  }
  /** Places the player has stood in before turn n (opening place included). */
  visitedBefore(n: number): Set<string> {
    const seen = new Set<string>();
    const first = this.steps[0]?.before.currentLocation;
    if (first) seen.add(first);
    for (const s of this.steps) {
      if (s.recorded.turn >= n) break;
      if (s.after.currentLocation) seen.add(s.after.currentLocation);
    }
    return seen;
  }
  lastGm(n: number): LogEntry | undefined {
    return [...this.after(n).log].reverse().find((e) => e.role === 'gm');
  }
  turns(): number[] {
    return this.steps.map((s) => s.recorded.turn);
  }
  /** M1 — FactSheet on the completed-event packet after turn n (when present). */
  factSheet(n: number) {
    return this.after(n).completedEvent?.factSheet;
  }
  /** M1 — structured TurnLog from telemetry (orders 7 / 10B). */
  turnLog(n: number) {
    return this.at(n).telemetry.turnLog;
  }
  /** M1 — engine beat outcome / engineResult (not prose). */
  engineBeat(n: number): { outcome?: string; engineResult?: string; verb?: string } {
    const p = this.after(n).completedEvent;
    return {
      outcome: p?.outcome,
      engineResult: p?.engineResult ?? this.at(n).telemetry.engineFact,
      verb: p?.verb,
    };
  }
}

export function packetBlock(packet: string, header: string): string {
  const i = packet.indexOf(header);
  if (i < 0) return '';
  const rest = packet.slice(i);
  const end = rest.slice(header.length).search(/\n\n|\n[A-Z][A-Z ]{3,}[:(]/);
  return end < 0 ? rest : rest.slice(0, header.length + end);
}

export function present(state: GameState): string[] {
  return [...(state.sceneFacts?.present ?? [])];
}

export function npc(state: GameState, name: string) {
  return (state.npcMemories ?? []).find((m) => m.npcName === name);
}

export function xpTotal(state: GameState): number {
  const c = state.character as unknown as { xp?: number; level?: number };
  return (c.level ?? 1) * 100_000 + (c.xp ?? 0);
}

/** Broken UTF-8 dash / quote bytes (â€”, Ã, U+FFFD). */
export const MOJIBAKE = /\u00e2\u20ac|\u00c3|\ufffd/;

/** A chip that talks to or about a named person: Talk to X / Ask X … / Refuse X … */
export function chipNamesPerson(chip: string, name: string): boolean {
  return chip.toLowerCase().includes(name.toLowerCase());
}

export const words = (s: string) => s.toLowerCase();
