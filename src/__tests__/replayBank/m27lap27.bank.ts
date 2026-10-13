/**
 * Multi lap 27 — the lenient whole-reply read of a parsed token beat keeps the line gate's verdicts and the
 * speaker ("the Pact" painted after `capital`, a speech line left bare as "I do not think…"); a hub beat's
 * social hints are aimed at its contact, so with the contact away they are not chips ("Hard refuse a Pact
 * reminder" with Captain Sera Quill elsewhere) and the writer is not told the contact is present; the live
 * foe's row is its kind and takes an article ("the Grave-risen Carrion Crow Flock").
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { buildCompletedEventPacket } from '../../game/completedEventPacket';
import { formatHubArrivalForPrompt, hubArrivalChoicePads, resolveHubArrival } from '../../game/hubEncounters';
import { acceptTokenOrLedgerStory, tokenLineVerdicts } from '../../game/tokenProse';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const F176 = '2026-10-12T10-47-50-868Z_summoned-pact_cold-system_s176';
const G151 = '2026-10-12T10-47-50-979Z_summoned-pact_cold-system_s151';
const REFUSE = 'Hard refuse a Pact reminder';

const withPresent = (s: GameState, name: string): GameState => ({
  ...s,
  sceneFacts: { ...s.sceneFacts!, present: [...(s.sceneFacts?.present ?? []), name] },
});

let F: Replay;
let G: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(F176));
  G = new Replay(await replayWhole(G151));
}, 1_800_000);

describe('replay bank multi lap 27', () => {
  it('[m27 fl176 T21 | lap 27 salvage keeps the gate] lines failed as `capital` stay out and the speech keeps its speaker', () => {
    expect(F.input(21)).toBe(REFUSE);
    expect(F.verdicts(21)).toEqual(['action:capital', 'speech:ok', 'hook:capital']);
    expect(F.prose(21)).not.toMatch(/\bPact\b/);
    expect(F.prose(21)).not.toMatch(/(^|[.!?]\s+)I do not think/);
    expect(F.prose(21)).toMatch(/Oda Dunmore said, "I do not think this is the time to discuss such matters\."/);

    const s = F.before(21);
    const packet = buildCompletedEventPacket(s, REFUSE);
    const oda = (packet.refEnum ?? []).find((r) => r.display === 'Oda Dunmore')!;
    const place = (packet.refEnum ?? []).find((r) => r.klass === 'place' && r.display === 'Contract Hall')!;
    const bindSlip = JSON.stringify({
      refs: [{ tok: `@${place.tok}`, id: place.id, use: 'place' }],
      lines: [
        { fn: 'place', text: `The benches of @${place.tok} stood half empty.` },
        { fn: 'action', text: `Jax turned to @${oda.tok} and shook their head.` },
        { fn: 'speech', text: 'Not today.', speaker_tok: `@${oda.tok}` },
      ],
    });
    const read = acceptTokenOrLedgerStory(bindSlip, s, packet, { lenient: true, noLedgerFallback: true });
    expect(read.prose, 'a token used without a declaration is still painted').toMatch(/Jax turned to Oda Dunmore/);
  });

  it('[m27 fl176 T21 | lap 27 hub contact away] the Contract Hall social beat offers no hint aimed at an absent Captain Sera Quill', () => {
    const s = F.before(21);
    expect(resolveHubArrival(s, s.currentLocation)?.beat.id).toBe('ch-social');
    expect(s.sceneFacts?.present ?? []).not.toContain('Captain Sera Quill');
    expect(hubArrivalChoicePads(s, 3)).not.toContain(REFUSE);
    expect(hubArrivalChoicePads(s, 3).some((c) => /Crown clerk/.test(c))).toBe(false);
    expect(F.chipsAfter(20)).not.toContain(REFUSE);
    expect(formatHubArrivalForPrompt(s)).not.toMatch(/Hub contact is present/);

    const here = withPresent(s, 'Captain Sera Quill');
    expect(hubArrivalChoicePads(here, 3), 'with the contact here the hint stands').toContain(REFUSE);
    expect(formatHubArrivalForPrompt(here)).toMatch(/Hub contact is present/);
  });

  it('[m27 g5-151 T20 | lap 27 foe kind takes an article] "the @t5" for the crow flock is a clean line', () => {
    expect(G.before(20).activeEncounter?.name).toBe('Grave-risen Carrion Crow Flock');
    // Lap 51: the replayed T20 now carries out "Attack from hiding" (no longer rewritten), so the recorded reply
    // is read against the recorded action's packet on the pre-turn state, where the flock is still the live foe.
    const rec = readFileSync(join('scripts/fate-autoplay/runs', G151, 'turns.jsonl'), 'utf8').trim().split('\n')
      .map((l) => JSON.parse(l) as { turn: number; playerInput: string; writerRaw: string })
      .find((r) => r.turn === 20)!;
    const live = G.before(20);
    const livePacket = buildCompletedEventPacket(live, rec.playerInput);
    expect(tokenLineVerdicts(rec.writerRaw, live, livePacket)).toEqual(['action:ok', 'react:ok', 'hook:ok']);
    const liveProse = acceptTokenOrLedgerStory(rec.writerRaw, live, livePacket).prose;
    expect(liveProse).toMatch(/counted the shapes of the Grave-risen Carrion Crow Flock in the corridor/);
    expect(liveProse).toMatch(/Now the Grave-risen Carrion Crow Flock circled close/);

    const s = G.before(20);
    const packet = buildCompletedEventPacket(s, G.input(20));
    const named = { ...packet, refEnum: [...(packet.refEnum ?? []), { tok: 't99', id: 'present:wren-holt', display: 'Wren Holt', klass: 'person' as const }] };
    const raw = JSON.stringify({
      refs: [{ tok: '@t99', id: 'present:wren-holt', use: 'actor' }],
      lines: [{ fn: 'action', text: 'Jax watched the @t99 from the stair.' }],
    });
    expect(tokenLineVerdicts(raw, s, named), 'a named person still takes no article').toContain('action:article-person');
  });
});
