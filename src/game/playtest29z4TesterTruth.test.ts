/**
 * 29z4 — the tester tells the truth (walks, investigations and plurals are not downs; travel needs the
 * destination named), the notes judge finds the Vite key and reports empty replies as failed, and the
 * seed-66 prose causes are fixed: no canned who-line, no bare "streets" name, no kit glued after "worn",
 * "here" is the place just entered. No live GM or judge call.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { checkActionFollowed } from './turnCheck';
import { openingSpokenIdentityQuote, openingWhoAskLine, openingWhoSpeaker } from './openingEstablishment';
import { compileNounAllowlist, type LedgerRef } from './completedEventPacket';
import { renderTokenBeat, salvageTokenJsonProse } from './tokenProse';
import { playerFacingLocation } from './locationName';
import type { GameState, NpcMemory } from './types';
// @ts-ignore — plain .mjs script module, no types
import { applyVerdicts, notesStatus, parseJudge, readOpenRouterKey, replyText } from '../../scripts/fate-autoplay/judgeNotes.mjs';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'z4',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Lowmarket',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [],
    npcMemories: [],
    companions: [],
    turn: 8,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: {
      ...s.sceneFacts!,
      crowd: 'none',
      present: [],
      crowdCount: 0,
      ...(over.sceneFacts ?? {}),
    },
  };
}

const kinds = (r: { p0: { kind: string }[]; down: { kind: string }[] }) => [...r.p0, ...r.down].map((f) => f.kind);

describe('29z4 — stamp', () => {
  it('HUD/BUILD are 2026-10-07c, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-10-07c');
    expect(BUILD_STAMP).toBe('2026-10-07c');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('29z4 — tester: real actions are not downs', () => {
  const s = base();

  it('a walk told as "crossed" or "watched them pass" is not a down', () => {
    expect(kinds(checkActionFollowed(s, s, 'Walk on', 'They crossed the Close at an unhurried pace.'))).not.toContain('action-object-missing');
    expect(kinds(checkActionFollowed(s, s, 'Walk on', 'The guards watched them pass without a word.'))).not.toContain('action-object-missing');
    expect(kinds(checkActionFollowed(s, s, 'Walk on', 'Jax stepped over the gutter and kept going.'))).not.toContain('action-object-missing');
  });

  it('a walk the prose never moves is still a down', () => {
    expect(kinds(checkActionFollowed(s, s, 'Walk on', 'The rain kept falling on the stalls. A dog barked somewhere.'))).toContain(
      'action-object-missing'
    );
  });

  it('"Investigate the keep" told as "asking after the keep" is not a down', () => {
    const r = checkActionFollowed(s, s, 'Investigate the keep', 'Jax spent the hour asking after the keep. The Keep Gate waited up the hill.');
    expect(kinds(r)).not.toContain('action-object-missing');
  });

  it('"Check the exits" told as "marking each exit" is not a down', () => {
    const r = checkActionFollowed(s, s, 'Check the exits', 'Jax took stock of every way in and out, marking each exit.');
    expect(kinds(r)).not.toContain('action-object-missing');
  });

  it('an action whose object never appears is still a down', () => {
    const r = checkActionFollowed(s, s, 'Inspect the crate', 'The wind picked up. Somewhere a shutter banged.');
    expect(kinds(r)).toContain('action-object-missing');
  });
});

describe('29z4 — tester: travel needs the destination named', () => {
  const onRoad = (to: string) =>
    base({
      currentLocation: 'Back streets',
      journey: {
        from: 'Lowmarket',
        to,
        ground: 'Back streets',
        terrain: 'streets',
        legsTotal: 2,
        legsDone: 1,
        hoursPerLeg: 0.5,
        startedTurn: 8,
      } as GameState['journey'],
    });

  it('naming only the ground on the way is a P0', () => {
    const before = base();
    const after = onRoad('Salt Road Waystation');
    const r = checkActionFollowed(before, after, 'Travel toward Salt Road Waystation', 'Jax kept to the back streets, head down.');
    expect(r.p0.map((f) => f.kind)).toContain('ignored-action');
  });

  it('a beat that names neither the destination nor the ground is a P0', () => {
    const before = base();
    const after = onRoad('Cathedral Close');
    const r = checkActionFollowed(before, after, 'Travel toward Cathedral Close', 'Jax walked for a while. The sky was grey.');
    expect(r.p0.map((f) => f.kind)).toContain('ignored-action');
  });

  it('naming the destination, or its capitalised short name, passes', () => {
    const before = base();
    const after = onRoad('Cathedral Close');
    const full = checkActionFollowed(before, after, 'Travel toward Cathedral Close', 'Jax set off toward Cathedral Close through the back streets.');
    expect(full.p0.map((f) => f.kind)).not.toContain('ignored-action');
    const short = checkActionFollowed(before, after, 'Travel toward Cathedral Close', 'The spires of the Close rose over the back streets.');
    expect(short.p0.map((f) => f.kind)).not.toContain('ignored-action');
  });

  it('a lowercase common word from the name is not the place', () => {
    const before = base();
    const after = onRoad('Cathedral Close');
    const r = checkActionFollowed(before, after, 'Travel toward Cathedral Close', 'Jax drew close to the wall of the back streets.');
    expect(r.p0.map((f) => f.kind)).toContain('ignored-action');
  });
});

describe('29z4 — notes judge', () => {
  it('finds VITE_OPENROUTER_API_KEY in an .env file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'z4-'));
    const f = path.join(dir, '.env');
    fs.writeFileSync(f, 'OTHER=1\nVITE_OPENROUTER_API_KEY="sk-or-test-123"\n');
    expect(readOpenRouterKey({}, [f])).toBe('sk-or-test-123');
    expect(readOpenRouterKey({ OPENROUTER_API_KEY: 'sk-env' }, [f])).toBe('sk-env');
    expect(readOpenRouterKey({}, [path.join(dir, 'missing')])).toBe('');
  });

  it('an empty or prose-only reply is a failed batch, not "ok 0 judged"', () => {
    expect(parseJudge('')).toEqual([]);
    expect(parseJudge('The turns read well overall.')).toEqual([]);
    expect(replyText({ choices: [{ message: { content: '' } }] })).toBe('');
    expect(notesStatus('google/gemini-2.5-pro', 0, 10, 1, 1)).toMatch(/^failed \(/);
    expect(notesStatus('google/gemini-2.5-pro', 10, 10, 0, 1)).toMatch(/^ok \(/);
  });

  it('JSON in reasoning, fenced JSON and "T5" turn labels are applied to the turns', () => {
    const json = { choices: [{ message: { content: '', reasoning: '```json\n[{"turn":"T5","verdict":"up","followed":true,"why":"clear"}]\n```' } }] };
    const verdicts = parseJudge(replyText(json));
    expect(verdicts).toHaveLength(1);
    const rows = [
      { turn: 5, prose: 'Jax crossed the Close.', down: [] as string[], up: [] as string[], verdict: 'neutral', input: 'Walk on' },
      { turn: 6, prose: 'The inn was quiet. Nobody here was named.', down: [] as string[], up: [] as string[], verdict: 'neutral', input: 'Look' },
    ];
    const lessons: unknown[] = [];
    const n = applyVerdicts(
      rows,
      [
        ...verdicts,
        { turn: 6, verdict: 'down', followed: false, why: 'ignored the look', stiff: [{ line: 'Nobody here was named.', better: 'Nobody gave a name.', why: 'stiff' }] },
      ],
      lessons
    );
    expect(n).toBe(2);
    expect(rows[0]!.verdict).toBe('up');
    expect(rows[1]!.verdict).toBe('down');
    expect((rows[1] as { p0?: string[] }).p0?.length).toBe(2);
    expect(lessons).toHaveLength(1);
  });

  it('a cut-off array still yields its complete verdicts', () => {
    const cut = '[{"turn":1,"verdict":"up","followed":true,"why":"ok"},{"turn":2,"verdict":"down","followed":false,"why":"cut';
    expect(parseJudge(cut).map((v: { turn: number }) => v.turn)).toEqual([1]);
  });
});

describe('29z4 — game: who answers is who is here', () => {
  const record = (over: Partial<NpcMemory>): NpcMemory => ({
    npcId: 'npc-mara',
    npcName: 'Mara Quill',
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 7,
    ...over,
  });

  it('a role label with no info sheet gets no canned "we found you here" line', () => {
    const s = base({ currentLocation: 'the common room' });
    expect(openingSpokenIdentityQuote('the innkeep', { state: s })).toBe('');
    expect(openingSpokenIdentityQuote('the people who pulled you', { state: s })).toBe('');
    expect(openingWhoAskLine(s)).not.toMatch(/We are the ones who found you here/);
  });

  it('the person whose sheet puts them here answers the who-ask', () => {
    const s = base({
      currentLocation: 'the common room',
      npcMemories: [record({ location: 'the common room' })],
    });
    expect(openingWhoSpeaker(s)).toBe('Mara Quill');
    expect(openingWhoAskLine(s)).toContain('"Mara Quill. You asked who."');
  });
});

describe('29z4 — game: names, kit and here', () => {
  it('"Back streets" does not put a bare "streets" on the name list; a proper tail still does', () => {
    const s = base({ currentLocation: 'Back streets' });
    const names = compileNounAllowlist(s, ['Cathedral Close']).map((n) => n.toLowerCase());
    expect(names).toContain('back streets');
    expect(names).not.toContain('streets');
    expect(names).toContain('close');
  });

  it('the kit is not glued after a word that already describes the clothes', () => {
    const refs: LedgerRef[] = [{ tok: 't3', id: 'kit:clothes', display: 'clothes', klass: 'kit' }];
    const beat = (text: string) =>
      renderTokenBeat(
        { refs: [{ tok: 't3', id: 'kit:clothes', use: 'worn' }], lines: [{ fn: 'action', text }] } as Parameters<typeof renderTokenBeat>[0],
        refs,
        { possessive: 'their' }
      );
    expect(beat('They walked in the same worn @t3 they had arrived in.')).not.toMatch(/worn their/);
    expect(beat('They stood in worn @t3 by the door.')).not.toMatch(/worn their/);
    expect(beat('They kept @t3 bunched under one arm.')).toMatch(/kept their clothes/);
    expect(beat('They walked in @t3 still damp from the rain.')).toMatch(/in their clothes/);
  });

  it('a salvaged line that starts on a painted label starts with a capital', () => {
    const refs: LedgerRef[] = [{ tok: 't2', id: 'cast:the-innkeep', display: 'the innkeep', klass: 'person' }];
    const raw = '{"refs":[{"tok":"t2","id":"cast:the-innkeep","use":"actor"}],"lines":[{"fn":"react","text":"The room paid Jax no mind."},{"fn":"action","text":"@t2 wiped the bar"';
    expect(salvageTokenJsonProse(raw, refs)).toMatch(/no mind\. The innkeep wiped/);
  });

  it('"here" is the place just entered, not the old location sheet', () => {
    const s = base({
      currentLocation: 'Cathedral Undercroft',
      locationSheet: { name: 'the blood-sand arena of Valespire', interactables: [], exits: [], presentNpcIds: [] },
    });
    expect(playerFacingLocation(s)).toBe('Cathedral Undercroft');
    const same = base({
      currentLocation: 'Cathedral Close — West gate',
      locationSheet: { name: 'Cathedral Close', interactables: [], exits: [], presentNpcIds: [] },
    });
    expect(playerFacingLocation(same)).toBe('Cathedral Close');
  });
});
