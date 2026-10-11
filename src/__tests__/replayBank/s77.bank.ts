import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay, npc } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-07T22-07-12-575Z_summoned-pact_cold-system_s77';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const INFIRMARY = 'the cathedral infirmary';
const SPINE = 'sp-spine-cathedral-royal-vanguard';
const ARUS = 'High Priest Arus';
const BANDIT = 'Wardline Bandit';
const packets = () => R.turns().filter((t) => R.packet(t) !== '');
const mentionList = (t: number) =>
  (R.packet(t).split('\n').find((l) => l.startsWith('YOU MAY ONLY MENTION:')) ?? '')
    .replace('YOU MAY ONLY MENTION:', '')
    .split(',')
    .map((s) => s.trim().replace(/\.$/, ''));
const refEnum = (t: number) => R.packet(t).split('\n').filter((l) => /^\s*t\d+\s+\S+\s+\S+\s+"/.test(l));
const engineLine = (t: number) => R.packet(t).split('\n').find((l) => l.startsWith('ENGINE RESULT')) ?? '';
const firstSentence = (s: string) => (s.match(/^[^.!?]+[.!?]/)?.[0] ?? s).trim();
const placeNames = (t: number) => new Set((R.after(t).places ?? []).map((p) => (p as { name?: string }).name ?? ''));

describe('replay bank s77', () => {
  it('[s77 T2 | s77 Root 1 (1)] the Circle\'s Price giver exists as a person at a real place and the writer is told who gave it', () => {
    const q = R.after(2).quests.find((x) => x.id === SPINE);
    expect(q?.status, 'spine quest is active after the opening').toBe('active');
    const arus = npc(R.after(2), ARUS);
    expect(arus, 'High Priest Arus has a record').toBeDefined();
    const where = arus!.location ?? '';
    expect(where === R.after(2).currentLocation || placeNames(2).has(where), `Arus stands at a known place (${where})`).toBe(true);
    expect((q as { location?: string }).location ?? '', 'quest location').not.toMatch(/Consecrated Sanctuary/);
    expect(R.packet(2), 'writer is told who gave the quest').toMatch(/given by High Priest Arus/);
  });

  it('[s77 T2 | s77 Root 1 (2)] the card\'s want and offer are printed to the writer on the first ask', () => {
    expect(R.input(2)).toBe('Ask what they want');
    expect(R.packet(2), 'offer').toContain('Agree to work their cots');
    expect(R.packet(2), 'why / want').toContain('The court paid for a Pactborn');
  });

  it('[s77 T2-T6 | s77 Root 1 (4)] "not a stranger" never becomes a cast name or a present person', () => {
    const card = R.before(2).openingEstablishment?.card as { castNames?: string[] } | undefined;
    expect(card, 'opening card compiled').toBeDefined();
    for (const n of card!.castNames ?? []) expect(n).not.toMatch(/^(not|no|never)\b/i);
    expect(R.packet(2)).not.toMatch(/not a stranger/i);
    for (const t of [2, 3, 4, 5, 6]) {
      for (const p of R.turnCheck(t)?.presentNames ?? []) expect(p, `T${t}`).not.toMatch(/^(not|no|never)\b|stranger/i);
    }
  });

  it('[s77 T21 | s77 Root 2 (5)] the Lowmarket social beat does not seat the Lowmarket Fence unless the writer is told of him', () => {
    expect(R.after(21).sceneFacts?.openVignette?.id, 'Lowmarket social beat open at T21').toBe('sp-hub-lowmarket:lm-social');
    if (!/Lowmarket Fence/.test(R.packet(21))) {
      expect(R.after(21).sceneFacts?.present ?? []).not.toContain('Lowmarket Fence');
    }
  });

  it('[s77 T12-T13 | s77 Root 2 (6)] road thugs left behind on turn-back are not present in the infirmary', () => {
    expect((R.before(12).journey as { encounter?: { kind?: string } } | undefined)?.encounter?.kind, 'thugs on the road before T12').toBe('thugs');
    expect(R.after(12).currentLocation).toBe(INFIRMARY);
    expect((R.after(12).sceneFacts?.present ?? []).filter((p) => /thug/i.test(p))).toEqual([]);
    expect((R.turnCheck(13)?.presentNames ?? []).filter((p) => /thug/i.test(p))).toEqual([]);
  });

  it('[s77 T2-T12 | s77 Root 2 (7)] no "Unnamed local who may be about: a priest" in infirmary packets', () => {
    const inside = packets().filter((t) => R.before(t).currentLocation === INFIRMARY);
    expect(inside.length, 'infirmary turns').toBeGreaterThan(0);
    for (const t of inside) expect(R.packet(t), `T${t}`).not.toMatch(/Unnamed local who may be about: a priest/);
  });

  it('[s77 T19-T21 | s77 Root 3 (8)] the camera lock follows the committed place once off the road', () => {
    expect(R.input(19)).toMatch(/Walk on/);
    expect(R.input(21)).toMatch(/Turn back/);
    const settled = R.turns().filter((t) => !R.after(t).journey && R.after(t).sceneFacts?.cameraLock);
    expect(settled.length).toBeGreaterThan(0);
    for (const t of settled) expect(R.after(t).sceneFacts!.cameraLock!.label, `T${t}`).toBe(R.after(t).currentLocation);
  });

  it('[s77 T6-T21 | s77 Root 3 (9)] the noise and last beat do not stay stuck on "shouting"', () => {
    expect(R.after(6).journey, 'Jax is on the road after T6').toBeDefined();
    for (const t of R.turns().filter((t) => t >= 6)) {
      const sf = R.after(t).sceneFacts;
      expect(sf?.noise, `T${t} noise`).not.toBe('shouting');
      expect(sf?.lastBeat ?? '', `T${t} lastBeat`).not.toMatch(/shouting/i);
      expect(R.at(t).telemetry.snapshotGist?.lastBeat ?? '', `T${t} gist`).not.toMatch(/shouting/i);
    }
  });

  it('[s77 T18-T21 | s77 Root 3 (10)] after the bandit falls the scene is not still in combat mood', () => {
    expect(R.receiptText(18) + R.prose(18), 'T18 is the victory').toMatch(/VICTORY|defeated|falls/i);
    for (const t of [18, 19, 20, 21]) expect(R.after(t).sceneFacts?.tension, `T${t}`).not.toBe('combat');
    for (const t of [19, 20, 21]) expect(R.packet(t), `T${t}`).not.toMatch(/Mood: combat/);
  });

  it('[s77 T2-T21 | s77 Root 3 (11)] the gist location and indoor word match the committed place and camera lock', () => {
    for (const t of R.turns()) {
      const g = R.at(t).telemetry.snapshotGist as { location?: string; lastBeat?: string } | undefined;
      const sf = R.after(t).sceneFacts;
      if (!g || !sf?.cameraLock) continue;
      expect(g.location, `T${t} gist location`).toBe(R.after(t).currentLocation);
      const indoor = sf.cameraLock.scale === 'indoor';
      expect(sf.indoor ?? indoor, `T${t} sceneFacts.indoor`).toBe(indoor);
      if (/\bindoors\b|\boutdoors\b/.test(g.lastBeat ?? '')) expect(g.lastBeat, `T${t} gist word`).toMatch(indoor ? /\bindoors\b/ : /\boutdoors\b/);
    }
  });

  it('[s77 T17 | s77 Root 4 (13)] the spawn is in the engine result and the receipts on the turn it lands', () => {
    expect(R.after(17).activeEncounter, 'bandit active after T17').toBeTruthy();
    expect(R.receiptText(17)).toMatch(/Encounter:/);
    expect(engineLine(17)).toMatch(/Encounter: Wardline Bandit/);
    expect(engineLine(17)).toMatch(/steps out/);
  });

  it('[s77 T17 | s77 Root 4 (14)] on a talk-shaped pick the arriving foe stays in the REF ENUM and mention list', () => {
    expect(R.input(17)).toBe('Refuse and keep your own counsel');
    expect(refEnum(17).some((l) => l.includes(BANDIT)), 'REF ENUM row').toBe(true);
    expect(mentionList(17)).toContain(BANDIT);
  });

  it('[s77 T17 | s77 Root 4 (15)] the spawn beat names the foe', () => {
    expect(engineLine(17)).toMatch(/Wardline Bandit/);
    expect(R.prose(17)).toMatch(/Wardline Bandit/);
  });

  it('[s77 T10-T17 | s77 Root 4 (16)] a building threat has no [SCENE] or TELEGRAPH catalog note and any threat header names the foe', () => {
    const pending = packets().filter((t) => R.before(t).sceneFacts?.pendingEncounter);
    expect(pending.length, 'replay has pending-encounter turns').toBeGreaterThan(0);
    for (const t of pending) {
      const p = R.packet(t);
      expect(p, `T${t}`).not.toMatch(/\[SCENE\]|TELEGRAPH \(/);
      const header = p.split('\n').find((l) => /Threat building/.test(l));
      const foe = (R.before(t).sceneFacts!.pendingEncounter as { name?: string; foeName?: string }) ?? {};
      const name = foe.foeName ?? foe.name ?? '';
      if (header && name) expect(header, `T${t}`).toContain(name);
    }
  });

  it('[s77 T6-T14 | s77 Root 5 (18)] warden chrome stays out of LAST/FACTS and the page memory carries the earlier travel openers', () => {
    for (const t of packets()) {
      const p = R.packet(t);
      const i = p.indexOf('LAST:');
      const j = p.indexOf('ASKED:');
      if (i < 0) continue;
      expect(p.slice(i, j > i ? j : undefined), `T${t}`).not.toMatch(/Warden:|Commit gate:|Cooldown|Entity scrub/);
    }
    for (const t of [6, 11, 14]) expect(R.input(t), `T${t} input`).toBe('Travel toward Lowmarket');
    expect(R.packet(14)).toContain(firstSentence(R.prose(6)));
    expect(R.packet(14)).toContain(firstSentence(R.prose(11)));
  });

  it('[s77 T6 | s77 Root 5 (19)] a turn whose writer words were kept is not labelled a last-resort body', () => {
    expect(R.noteText(6), 'T6 hits the recycle gate').toMatch(/recycle-without-delta/);
    for (const t of R.turns()) {
      if (!/Writer words kept/.test(R.noteText(t))) continue;
      expect(R.noteText(t), `T${t}`).not.toMatch(/Commit gate: last-resort body/);
    }
  });

  it('[s77 T18 | s77 Root 5 (20)] the victory beat is not flagged as reopening a closed fact', () => {
    expect(R.prose(18)).toMatch(/Wardline Bandit/);
    expect(R.noteText(18)).not.toMatch(/Reopens a closed fact/);
  });

  it('[s77 T7,T18,T19 | s77 Root 5 (21)] the Scene Manifest does not call ledger names invented', () => {
    expect(R.prose(18), 'T18 names the bandit').toMatch(/Wardline Bandit/);
    expect(R.prose(19), 'T19 names West Wall').toMatch(/West Wall/);
    for (const t of [7, 18, 19]) expect(R.noteText(t), `T${t}`).not.toMatch(/Scene Manifest invent: (West Wall|Wardline Bandit)/);
  });

  it('[s77 T2-T21 | s77 Root 5 (22a)] every token the writer is shown in the shape example is a REF ENUM row', () => {
    for (const t of packets()) {
      const p = R.packet(t);
      const rows = new Set(refEnum(t).map((l) => l.trim().split(/\s+/)[0]));
      if (rows.size === 0) continue;
      const shown = [...p.matchAll(/"(?:tok|speaker_tok)"\s*:\s*"(t\d+)"|@(t\d+)\b/g)].map((m) => m[1] ?? m[2]);
      for (const tok of shown) expect(rows.has(tok), `T${t} ${tok}`).toBe(true);
    }
  });

  it('[s77 T7 | s77 Root 5 (22b)] unbound tokens do not paint West Wall or Lowmarket streets into the infirmary', () => {
    expect(R.verdicts(7).some((v) => /unbound-tok/.test(v)), 'T7 writer used unbound tokens').toBe(true);
    expect(R.after(7).currentLocation).toBe(INFIRMARY);
    expect(R.prose(7)).not.toMatch(/West Wall/);
    expect(R.prose(7)).not.toMatch(/streets of Lowmarket/);
  });

  it('[s77 T2 | s77 Root 6 (23)] the card\'s kit offer can be accepted or refused', () => {
    expect(R.chips(2)).toContain('Accept the work');
    expect(R.chips(2)).toContain('Refuse the work');
  });

  it('[s77 T9 | s77 Root 6 (24)] Check Status sends a change-since-last-look, not the flat registration dump', () => {
    expect(R.input(9)).toBe('Check Status');
    expect(R.packet(9)).not.toContain('Registration: designation locked');
    expect((R.lastGm(9) as { systemWindow?: unknown } | undefined)?.systemWindow, 'System window on the beat').toBeTruthy();
  });
});
