import { beforeAll, describe, expect, it, vi } from 'vitest';
import { filterInventedContextChoices } from '../../game/choiceWarden';
import { Replay, npc, xpTotal } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-07T16-15-12-290Z_summoned-pact_cold-system_s76';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const CUP = 'The Weighing Cup';
const TAM_BEAT = 'sp-hub-weighing-cup:wc-social';
const packets = () => R.turns().filter((t) => R.packet(t) !== '');
const mentionList = (t: number) =>
  (R.packet(t).split('\n').find((l) => l.startsWith('YOU MAY ONLY MENTION:')) ?? '')
    .replace('YOU MAY ONLY MENTION:', '')
    .split(',')
    .map((s) => s.trim().replace(/\.$/, ''));
const witnesses = (t: number) =>
  (R.packet(t).match(/^Witnesses: (.+)\.$/m)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const tamBeatOpened = () =>
  R.turns().find((t) => R.before(t).sceneFacts?.openVignette?.id !== TAM_BEAT && R.after(t).sceneFacts?.openVignette?.id === TAM_BEAT);
const isActiveRevealed = (q: { status?: string; revealed?: boolean }) => q.status === 'active' && q.revealed !== false;

describe('replay bank s76', () => {
  it('[s76 T2-T21 | s76 Root 1 (P1)] no writer packet says "no live quest step" while a quest is active and revealed', () => {
    const withQuest = packets().filter((t) => R.before(t).quests.some(isActiveRevealed) && /INFO SHEET/.test(R.packet(t)));
    expect(withQuest.length, 'replay sends info sheets while a quest is active').toBeGreaterThan(0);
    for (const t of withQuest) expect(R.packet(t), `T${t}`).not.toMatch(/no live quest step/);
  });

  it('[s76 T2 | s76 Root 1 (P5)] the pocket line never lists worn clothes', () => {
    expect(R.input(2)).toBe('Reach into the pocket');
    expect(R.packet(2), 'T2 packet is a pocket read').toMatch(/POCKET/);
    const worn = R.before(2).inventory.filter((i) => i.equipped).map((i) => i.name);
    expect(worn.length, 'clothes are worn').toBeGreaterThan(0);
    for (const t of packets()) {
      const lines = R.packet(t).split('\n').filter((l) => /^POCKET|In the pocket:|Pocket:/.test(l));
      for (const l of lines) {
        expect(l, `T${t}`).not.toMatch(/clothes/i);
        for (const w of worn) expect(l, `T${t}`).not.toContain(w);
      }
    }
  });

  it('[s76 T5,T14 | s76 Root 1 (R)] with level, experience and skills off, no XP, level or skill-rank line reaches receipts or the writer', () => {
    const parts = R.before(2).systemHousing?.parts as Record<string, boolean> | undefined;
    expect(parts?.level === false && parts?.experience === false && parts?.skills === false, 'housing is leftover_pocket').toBe(true);
    const last = R.turns()[R.turns().length - 1];
    expect(xpTotal(R.after(last)), 'replay earns XP (fight on the road)').toBeGreaterThan(xpTotal(R.before(2)));
    for (const t of R.turns()) {
      expect(R.receiptText(t), `T${t} receipts`).not.toMatch(/XP Gained|^Level \d|rank \d/m);
      expect(R.packet(t), `T${t} packet`).not.toMatch(/XP Gained|Level \d: |rank \d/);
    }
  });

  it('[s76 T2 | s76 Root 2 (P2)] the cellar-shrine opening keeps its own place, not the Lowmarket hub', () => {
    const card = (R.before(2).openingEstablishment as { pickedHook?: string } | undefined)?.pickedHook ?? '';
    expect(card, 'replay picks the Lowmarket cellar shrine card').toMatch(/Lowmarket cellar shrine/);
    expect(R.before(2).currentLocation).not.toBe('Lowmarket');
    expect(R.after(2).currentLocation).not.toBe('Lowmarket');
    expect(R.packet(2)).not.toMatch(/^Location: Lowmarket\.$/m);
    expect(R.packet(2)).not.toMatch(/Crowded stalls, fences, and Earth junk buyers/);
  });

  it('[s76 T2 | s76 Root 2 (P2)] a no-move first turn pays no "reached" XP for the opening place', () => {
    expect(R.before(2).currentLocation, 'no move on T2').toBe(R.after(2).currentLocation);
    expect(R.receiptText(2)).not.toMatch(/reached/i);
    expect(xpTotal(R.after(2))).toBe(xpTotal(R.before(2)));
  });

  it('[s76 T2 | s76 Root 2 (P6)] "the Scale priests" (negated on the card) is not the writer\'s cast', () => {
    expect(R.before(2).openingEstablishment?.pickedHook, 'card says "not Scale priests"').toMatch(/not Scale priests|not the High Chanter/);
    expect(R.packetBlock(2, 'REF ENUM')).not.toMatch(/scale-priests|Scale priests/i);
    expect(mentionList(2).filter((m) => /scale priests|^priests$/i.test(m))).toEqual([]);
    expect(R.after(2).sceneFacts?.present ?? []).not.toContain('the Scale priests');
  });

  it('[s76 T2 | s76 Root 2 (P6)] the mention list is not padded with capitalised words scraped off the card', () => {
    expect(mentionList(2).length, 'T2 packet has a mention list').toBeGreaterThan(0);
    for (const junk of ['Wrong', 'Join', 'Walk', 'Hooded', 'Someone', 'Candle-smoke']) {
      expect(mentionList(2), junk).not.toContain(junk);
    }
  });

  it('[s76 T2 | s76 Root 2 (spine)] the main quest fits the cellar-shrine opening (no High Priest Arus, crypts or infestation)', () => {
    const quests = R.after(2).quests.filter(isActiveRevealed);
    expect(quests.length, 'a main quest is attached').toBeGreaterThan(0);
    const places = new Set([...(R.after(2).places ?? []).map((p) => p.name), R.after(2).currentLocation]);
    for (const q of quests) {
      const text = [q.name, q.description, ...(q.objectives ?? []).map((o) => o.description)].join('\n');
      expect(text, q.id).not.toMatch(/High Priest Arus|crypt|infestation|Consecrated Sanctuary/i);
      const loc = (q as { location?: string }).location;
      if (loc) expect(places.has(loc), `${q.id} location "${loc}" is a real place`).toBe(true);
    }
  });

  it('[s76 T5-T19 | s76 Root 3 (P3)] The Weighing Cup reads indoor on every info sheet', () => {
    const atCup = packets().filter((t) => new RegExp(`^NOW: T\\d+ · ${CUP} · `, 'm').test(R.packet(t)));
    expect(atCup.length, 'replay sends info sheets at The Weighing Cup').toBeGreaterThan(3);
    for (const t of atCup) expect(R.packet(t), `T${t}`).toMatch(new RegExp(`^NOW: T\\d+ · ${CUP} · indoor`, 'm'));
  });

  it('[s76 T4-T21 | s76 Root 3 (gist)] the log gist and scene indoor flag describe the committed place, not the previous one', () => {
    let checked = 0;
    for (const t of R.turns()) {
      const gist = R.at(t).telemetry.snapshotGist;
      const a = R.after(t);
      if (gist) expect(gist.location, `T${t} gist location`).toBe(a.currentLocation);
      const scale = a.sceneFacts?.cameraLock?.scale;
      if (!scale) continue;
      checked++;
      const word = gist?.lastBeat?.match(/\b(indoors|outdoors)\b/)?.[1];
      if (word) expect(word, `T${t} gist indoor word`).toBe(`${scale}s`);
      if (typeof a.sceneFacts?.indoor === 'boolean') expect(a.sceneFacts.indoor, `T${t} sceneFacts.indoor`).toBe(scale === 'indoor');
    }
    expect(checked, 'replay has camera locks to compare').toBeGreaterThan(5);
  });

  it('[s76 T21 | s76 Root 3 (S)] "Enter Cathedral Undercroft" is not offered when the writer was told Jax is already inside', () => {
    expect(R.after(21).currentLocation, 'replay arrives at Cathedral Undercroft on T21').toBe('Cathedral Undercroft');
    const inside =
      /Narrate one arrival at Cathedral Undercroft/.test(R.packet(21)) && /^NOW: T\d+ · Cathedral Undercroft · indoor/m.test(R.packet(21));
    const enterOffered = R.chipsAfter(21).includes('Enter Cathedral Undercroft');
    expect({ inside, enterOffered }).not.toEqual({ inside: true, enterOffered: true });
  });

  it('[s76 T6-T19 | s76 Root 4 (Q)] Bertil Pike and Cutha Coyne are seen and met while they are Jax\'s witnesses', () => {
    expect(R.receiptText(10), 'replay nudges Bertil over to Jax on T10').toMatch(/Nudge: Bertil Pike comes over to you/);
    const witnessed = packets().filter((t) => witnesses(t).some((w) => w === 'Bertil Pike' || w === 'Cutha Coyne'));
    expect(witnessed.length, 'replay hands Bertil and Cutha to the writer as witnesses').toBeGreaterThan(3);
    for (const t of witnessed) {
      for (const name of witnesses(t).filter((w) => w === 'Bertil Pike' || w === 'Cutha Coyne')) {
        expect(npc(R.after(t), name)?.lastSeenTurn ?? -1, `T${t} ${name} seen this turn`).toBeGreaterThanOrEqual(R.before(t).turn);
      }
    }
    expect(npc(R.after(10), 'Bertil Pike')?.met, 'Bertil met once he comes over').toBe(true);
  });

  it('[s76 T9-T19 | s76 Root 4 (Q)] the Cup\'s social beat does not put Brother Tam in the room unless a beat shows him', () => {
    const opened = tamBeatOpened();
    expect(opened, 'replay opens the Weighing Cup social beat (Brother Tam) — recorded T9').toBeTruthy();
    for (const t of R.turns().filter((n) => n >= opened!)) {
      if (!/Brother Tam/.test(R.prose(t))) expect(R.after(t).sceneFacts?.present ?? [], `T${t} present`).not.toContain('Brother Tam');
      if (!/Brother Tam/.test(R.prose(t - 1) ?? '')) expect(witnesses(t), `T${t} witnesses`).not.toContain('Brother Tam');
    }
  });

  it('[s76 T12 | s76 Root 4 (Q)] no NPC is put in an exit window (role debt satisfied) before meeting Jax', () => {
    expect(tamBeatOpened(), 'replay opens the Weighing Cup social beat (Brother Tam) — recorded T9').toBeTruthy();
    for (const t of packets()) {
      for (const m of R.packet(t).matchAll(/^- (.+?) \(.*\): (Exit window|.*Must leave this scene)/gm)) {
        expect(npc(R.before(t), m[1])?.met, `T${t} ${m[1]} put in an exit window before meeting Jax`).toBe(true);
      }
    }
  });

  it('[s76 T17 | s76 Root 4 (P4)] the role timer never reaches the writer ("turns remaining", "deadline: T", "Must leave")', () => {
    expect(tamBeatOpened(), 'replay opens the Weighing Cup social beat (Brother Tam) — recorded T9').toBeTruthy();
    expect(R.before(19).currentLocation, 'Jax is still at the Cup when the recorded deadline (T19) falls').toBe(CUP);
    for (const t of packets()) expect(R.packet(t), `T${t}`).not.toMatch(/turns remaining|deadline: T\d|Must leave this scene/);
  });

  it('[s76 T17 | s76 Root 5 (S loot)] a search gets an engine result before the writer, with a receipt', () => {
    expect(R.input(17)).toBe('Search the area');
    const searches = R.turns().filter((t) => R.input(t) === 'Search the area');
    for (const t of searches) {
      const engine = R.packet(t).split('\n').find((l) => l.startsWith('ENGINE RESULT')) ?? '';
      expect(engine, `T${t} packet carries the search result`).toMatch(/Search: .*(found|nothing)/);
      expect(R.receiptText(t), `T${t} receipt`).toMatch(/^Search: /m);
      if (/found (?!nothing)/.test(engine)) expect(R.receiptText(t), `T${t} loot receipt`).toMatch(/^(Loot|Gold Gained):/m);
    }
  });

  it('[s76 T21 | s76 Root 5 (S)] no "Offer help, honestly" or bare stance chip on an empty road', () => {
    const quiet = R.turns().filter((t) => R.before(t).journey && !R.before(t).journey!.encounter);
    expect(quiet.length, 'replay has quiet road turns').toBeGreaterThan(0);
    for (const t of quiet) {
      expect(R.chips(t).filter((c) => /^(Offer help, honestly|Refuse and keep your own counsel)$/.test(c)), `T${t}`).toEqual([]);
    }
  });

  it('[s76 T3-T21 | s76 Root 5 (S)] chips the invented-context filter removes are not added back after it', () => {
    expect(R.turns().some((t) => R.notes(t).some((n) => /^Story chip:/.test(n))), 'replay adds quest chips after the filter').toBe(true);
    for (const t of R.turns()) {
      const chips = R.chipsAfter(t);
      expect(filterInventedContextChoices(chips, R.after(t)), `after T${t}`).toEqual(chips);
    }
  });
});
