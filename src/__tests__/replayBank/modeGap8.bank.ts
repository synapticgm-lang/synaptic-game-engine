/**
 * mode-gap step 8: recap on return (story RPG prose, LitRPG System log) on the real-time-away clock, the main-quest
 * popup (epilogue, One more turn / Finish and start a new game), and the P1 list — story RPG origin with a hook,
 * a second way through each main step (call on a contact), romance through approval only with romance subplots on,
 * the journal of choices, and the LitRPG floor ladder on the dungeon card. Real tapes: salt-road-heist ds150
 * (Vessa at the Waystation T3, "Pick an approach" and "Commit to the heist night" open after T21), summoned-pact
 * s150 and cursed-keep ds151 (tabletop must not change).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from '../../game/arcDirector';
import {
  applyStoryRpgTurn,
  contactChip,
  CONTACT_FAVOUR_TRUST,
  romanceAllowed,
  romanceChip,
  romancePad,
  storyRpgContactPad,
  storyRpgDecisionChip,
} from '../../game/storyRpgProgress';
import { buildAwayRecap, RECAP_AFTER_HOURS } from '../../game/awayRecap';
import { applyAwayRest } from '../../game/rules/awayRest';
import {
  finishMainQuest,
  FINISH_AND_NEW_GAME,
  keepPlayingAfterMainQuest,
  MAIN_QUEST_DONE_TITLE,
  mainQuestEndPrompt,
  ONE_MORE_TURN,
} from '../../game/mainQuestEnd';
import { choiceJournal, recordChoice } from '../../game/choiceJournal';
import { ORIGIN_QUICK_START_CHIP, originChip, originPad, quickStartOrigin } from '../../game/rules/rpgOrigin';
import { BACKGROUNDS } from '../../game/tabletop/characterBuild';
import { recruitChip } from '../../game/rules/companions';
import { storedRelationshipFor } from '../../game/npcRelationships';
import { mediatePlayerInput } from '../../game/inputMediation';
import { validateActionHard } from '../../game/actionValidation';
import { advanceDungeonCard, openDungeonCard } from '../../game/dungeonCard';
import { dungeonHereLabel } from '../../game/mapEngine';
import { climbFloor, currentFloor } from '../../game/rules/litrpgFloors';
import { buildLitrpgSystemWindow, SYSTEM_WINDOW_MAX_LINES } from '../../game/litrpgSystemWindow';
import { presentSystemNotices } from '../../game/systemNotice';
import { filterSystemLogForEngine, statusLinesForVerbosity } from '../../game/systemLog';
import { isPlayInputLocked } from '../../game/playPhase';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const LIT150 = '2026-10-12T17-05-53-021Z_summoned-pact_cold-system_s150';
const RPG_DS150 = '2026-10-13T14-15-18-792Z_salt-road-heist_chilled-gm_s150';
const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';
const HOUR = 3_600_000;

let L: Replay;
let R: Replay;
let T: Replay;
beforeAll(async () => {
  [L, R, T] = [
    new Replay(await replayWhole(LIT150)),
    new Replay(await replayWhole(RPG_DS150)),
    new Replay(await replayWhole(TT_DS151)),
  ];
}, 900_000);

/** One engine turn the way useGame and fate-autoplay run it: arcDirector, then the story RPG turn, then the turn count. */
function turn(s: GameState, input: string, opts: { romance?: boolean } = {}) {
  const arc = runArcDirectorBeforeGm(s, input);
  const story = applyStoryRpgTurn(arc.state, input, opts);
  return { state: { ...story.state, turn: (story.state.turn ?? 0) + 1 }, status: [...formatArcStatusReceipts(arc), ...story.receipts] };
}

const lastOf = (r: Replay) => r.after(r.turns()[r.turns().length - 1]!);

/**
 * Ds150 after T21: Case the Caravan finished for ending / journal tests.
 * RC-QT1: decision chip labels no longer tick — close remaining steps on the state (engine outcome).
 */
function finishedMain() {
  const s = R.after(21);
  expect(turn(s, 'Pick an approach').status.join('\n')).not.toMatch(/Quest stage/);
  let state = {
    ...s,
    quests: (s.quests ?? []).map((q) => {
      if (q.type !== 'main' || q.name !== 'Case the Caravan') return q;
      return { ...q, status: 'completed' as const, objectives: (q.objectives ?? []).map((o) => ({ ...o, completed: true })) };
    }),
  } as GameState;
  state = recordChoice(state, { kind: 'decision', text: 'Case the Caravan: Pick an approach.' });
  state = recordChoice(state, { kind: 'decision', text: 'Case the Caravan: Commit to the heist night.' });
  return { state, status: [] as string[] };
}

describe('replay bank mode-gap 8 (recap, main-quest popup, P1)', () => {
  it('[story rpg ds150 T3 | mode-gap 8] origin: every SRD background is offered after the opening; the pick names the main quest as the hook', () => {
    const s = R.after(3);
    expect(s.character.origin).toBeUndefined();
    expect(originPad(s)).toEqual([...BACKGROUNDS.map((b) => originChip(b.id)), ORIGIN_QUICK_START_CHIP]);
    const r = turn(s, 'Origin: Criminal');
    expect(r.state.character.origin).toBe('criminal');
    expect(r.status).toEqual(['Origin: Criminal — You worked on the wrong side of the law. Case the Caravan came to you because of the work you used to do.']);
    expect(originPad(r.state)).toBeNull();
    expect(choiceJournal(r.state).at(-1)).toMatchObject({ kind: 'origin', turn: s.turn });
    // Quick start picks by seed: the same save always gets the same origin.
    const q = turn(s, ORIGIN_QUICK_START_CHIP);
    expect(q.state.character.origin).toBe(quickStartOrigin(s));
    expect(quickStartOrigin(s)).toBe(quickStartOrigin({ ...s }));
    // A chip line is play the input gate lets through.
    for (const chip of originPad(s)!) {
      expect(mediatePlayerInput(chip).text).toBe(chip);
      expect(validateActionHard(chip, s, '').valid).toBe(true);
    }
  });

  it('[story rpg ds150 T3 | mode-gap 8] a second way through the main step: call on someone who stands with you; it ticks the step and costs their goodwill', () => {
    const helped = turn(R.after(3), 'Help Vessa with her trouble').state;
    const quest = helped.quests!.find((q) => q.objectives?.some((o) => !o.completed) && q.type === 'main')!;
    const step = quest.objectives!.find((o) => !o.completed)!.description;
    const pad = storyRpgContactPad(helped)!;
    expect(pad).toContain(contactChip('Vessa', step));
    // Someone who does not stand with the player (Neutral, not a companion) offers no such route.
    const cold = { ...helped, npcMemories: (helped.npcMemories ?? []).map((m) => (m.npcName === 'Vessa' ? { ...m, disposition: 'neutral' as const } : m)) } as GameState;
    expect(storyRpgContactPad(cold)?.some((c) => c.includes('Vessa')) ?? false).toBe(false);
    const chip = contactChip('Vessa', step);
    expect(validateActionHard(chip, helped, '').valid).toBe(true);
    const r = turn(helped, chip);
    expect(r.status.filter((l) => l.startsWith('Quest stage:'))).toEqual([`Quest stage: ${quest.name} — ${step} (through Vessa)`]);
    expect(r.status.some((l) => l.startsWith('Standing:') || l.startsWith('Remember:'))).toBe(false);
    expect(r.state.quests!.find((q) => q.id === quest.id)!.objectives!.find((o) => o.description === step)!.completed).toBe(true);
    expect(storedRelationshipFor(r.state, 'Vessa')!.trust).toBe((storedRelationshipFor(helped, 'Vessa')?.trust ?? 0) + CONTACT_FAVOUR_TRUST);
    expect(choiceJournal(r.state).at(-1)).toMatchObject({ kind: 'decision', npc: 'Vessa' });
  });

  it('[story rpg ds150 T3+T21 | mode-gap 8] the journal of choices keeps deeds, decisions and the ending in order from one list', () => {
    const refused = turn(R.after(3), 'Refuse Vessa and keep your own counsel').state;
    expect(choiceJournal(refused).map((e) => e.text)).toEqual(['You refused Vessa.']);
    const done = finishedMain().state;
    expect(choiceJournal(done).map((e) => e.text)).toEqual(['Case the Caravan: Pick an approach.', 'Case the Caravan: Commit to the heist night.']);
    // The tapes as played wrote nothing (no deed, decision or origin was taken on the recorded lines).
    for (const r of [L, R, T]) expect(lastOf(r).choiceJournal ?? []).toEqual([]);
  });

  it('[story rpg ds150 | mode-gap 8] romance only with romance subplots on, only for a Loyal companion', () => {
    const joined = turn(R.after(3), recruitChip('Vessa')).state;
    expect(romancePad(joined, true)).toBeNull();
    const loyal = {
      ...joined,
      arcDirector: {
        ...joined.arcDirector,
        npcRelationships: (joined.arcDirector?.npcRelationships ?? []).map((r) =>
          (r.npcName ?? '').toLowerCase() === 'vessa' ? { ...r, trust: 95, familiarity: 95, disposition: 'loyal' as const } : r,
        ),
      },
    } as GameState;
    expect(romancePad(loyal, false)).toBeNull();
    expect(romancePad(loyal, true)).toEqual([romanceChip('Vessa')]);
    expect(romanceAllowed({ romanceSubplots: true, contentMode: 'kid' } as never)).toBe(false);
    expect(turn(loyal, romanceChip('Vessa')).status.some((l) => l.startsWith('Romance:'))).toBe(false);
    const r = turn(loyal, romanceChip('Vessa'), { romance: true });
    expect(r.status.filter((l) => l.startsWith('Romance:'))).toEqual(['Romance: Vessa returns your feelings.']);
    expect(r.state.npcMemories!.find((m) => m.npcName === 'Vessa')!.disposition).toBe('romanced');
    expect(romancePad(r.state, true)).toBeNull();
  });

  it('[story rpg ds150 T21 | mode-gap 8] recap on return: prose of engine facts after an hour away; nothing under an hour', () => {
    const s = turn(R.after(3), 'Refuse Vessa and keep your own counsel').state;
    expect(buildAwayRecap(s, 30 * 60_000)).toBeNull();
    const recap = buildAwayRecap(s, 3 * HOUR)!;
    expect(recap[0]).toBe(`When you last stopped, 3 hours ago, you were at ${s.currentLocation}.`);
    expect(recap).toContain('Lately: you refused Vessa.');
    expect(recap).toContain('Vessa has not forgotten what you did.');
    expect(recap.join('\n')).not.toMatch(/\[System\]|\bHP\b|trust/);
    expect(buildAwayRecap(s, 72 * HOUR)![0]).toMatch(/^When you last stopped, 3 days ago,/);
    expect(RECAP_AFTER_HOURS).toBe(1);
  });

  it('[litrpg s150 | mode-gap 8] recap on return is a System log built from the System window lines', () => {
    const s = lastOf(L);
    const recap = buildAwayRecap(s, 5 * HOUR)!;
    expect(recap[0]).toBe('[System] Session resumed. Time away: 5 hours.');
    expect(recap.every((l) => l.startsWith('[System] '))).toBe(true);
    const win = buildLitrpgSystemWindow(s)!.lines;
    for (const l of win.filter((x) => /^(?:Name|Level|HP)\b/.test(x))) expect(recap).toContain(`[System] ${l}`);
  });

  it('[tabletop ds151 | mode-gap 8] tabletop keeps its away rest and gets no recap; play-over saves get none', () => {
    const s = lastOf(T);
    expect(buildAwayRecap(s, 10 * HOUR)).toBeNull();
    const rest = applyAwayRest(s, 10 * HOUR);
    if (rest) expect(rest.recap[0]).toMatch(/^While you were away/);
    expect(buildAwayRecap({ ...lastOf(R), playPhase: 'ended' }, 10 * HOUR)).toBeNull();
  });

  it('[story rpg ds150 T21 | mode-gap 8] main quest done: epilogue then the popup; One more turn keeps the run open, once', () => {
    expect(mainQuestEndPrompt(R.after(21))).toBeNull();
    const done = finishedMain().state;
    const p = mainQuestEndPrompt(done)!;
    expect(p.questName).toBe('Case the Caravan');
    expect(p.epilogue[0]).toMatch(/^You saw Case the Caravan through/);
    expect(p.epilogue).toContain('Case the Caravan: Commit to the heist night.');
    expect([MAIN_QUEST_DONE_TITLE, ONE_MORE_TURN, FINISH_AND_NEW_GAME]).toEqual([
      'You have completed the main quest.',
      'One more turn',
      'Finish and start a new game',
    ]);
    const kept = keepPlayingAfterMainQuest(done);
    expect(mainQuestEndPrompt(kept)).toBeNull();
    expect(kept.playPhase).not.toBe('ended');
    expect(isPlayInputLocked(kept)).toBe(false);
    expect(kept.quests).toEqual(done.quests);
  });

  it('[story rpg ds150 T21 | mode-gap 8] Finish commits the ending through the shared gates and ends the run', () => {
    const done = finishedMain().state;
    const fin = finishMainQuest(done);
    expect(fin.receipts[0]).toMatch(/^Ending: .+ — You saw Case the Caravan through/);
    expect(fin.state.playPhase).toBe('ended');
    expect(isPlayInputLocked(fin.state)).toBe(true);
    expect(choiceJournal(fin.state).at(-1)!.kind).toBe('ending');
    expect(mainQuestEndPrompt(fin.state)).toBeNull();
  });

  it('[litrpg s150 + tabletop ds151 | mode-gap 8] LitRPG gets a System epilogue for a spine quest, never for the tutorial; tabletop gets no popup', () => {
    const s = lastOf(L);
    const spine = (s.quests ?? []).find((q) => q.type === 'main' && !q.id.startsWith('tutorial-'))!;
    expect(spine).toBeDefined();
    const done = { ...s, activeEncounter: null, roundCombat: null, quests: (s.quests ?? []).map((q) => (q.id === spine.id ? { ...q, status: 'completed' as const } : q)) } as GameState;
    const p = mainQuestEndPrompt(done)!;
    expect(p.epilogue[0]).toBe(`[System] Main quest complete: ${spine.name}.`);
    const fin = finishMainQuest(done);
    expect(fin.state.playPhase).toBe('ended');
    const tutorial = { ...s, quests: [{ id: 'tutorial-first-blood', name: 'First Blood', description: '', status: 'completed', type: 'main' }] } as GameState;
    expect(mainQuestEndPrompt(tutorial)).toBeNull();
    const t = lastOf(T);
    expect(mainQuestEndPrompt({ ...t, quests: (t.quests ?? []).map((q) => (q.type === 'main' ? { ...q, status: 'completed' as const } : q)) } as GameState)).toBeNull();
  });

  it('[litrpg s150 | mode-gap 8] floor ladder: the dungeon boss falling clears Floor 1 and unlocks the stairs to Floor 2, once', () => {
    const s = { ...lastOf(L), activeEncounter: null, roundCombat: null } as GameState;
    expect(currentFloor(s)).toBe(1);
    const opened = openDungeonCard(s, 'Old Crypt');
    const d = opened.activeDungeon!;
    const bossNode = d.nodes.find((n) => n.hidden?.mobs?.some((m) => m.role === 'miniBoss'))!;
    const nodes = d.nodes.map((n) =>
      n.id === bossNode.id ? { ...n, hidden: { ...n.hidden!, mobs: n.hidden!.mobs.filter((m) => m.role === 'miniBoss') } } : n,
    );
    const foe = bossNode.hidden!.mobs.find((m) => m.role === 'miniBoss')!;
    const atBoss = { ...opened, activeDungeon: { ...d, nodes, currentNodeId: bossNode.id }, currentLocation: dungeonHereLabel(d.dungeonName, bossNode.name) } as GameState;
    const won = advanceDungeonCard(atBoss, 'Attack', [`Encounter cleared: ${foe.name} (victory)`]);
    const floorLine = `Floor: Floor 1 cleared — ${foe.name} defeated. Stairs to Floor 2 unlocked.`;
    expect(won.receipts).toContain(floorLine);
    expect(won.state.litrpgFloors).toMatchObject({ cleared: 1, bosses: [{ floor: 1, dungeon: d.dungeonName, boss: foe.name }] });
    expect(currentFloor(won.state)).toBe(2);
    expect(presentSystemNotices([floorLine], 'litrpg')).toEqual([`Floor — Floor 1 cleared — ${foe.name} defeated. Stairs to Floor 2 unlocked.`]);
    expect(statusLinesForVerbosity(filterSystemLogForEngine([floorLine], 'litrpg'), 'core')).toEqual([floorLine]);
    const win = buildLitrpgSystemWindow(won.state)!.lines;
    expect(win).toContain(`Floor: 1 cleared (last boss: ${foe.name}) — Floor 2 open`);
    expect(win.length).toBeLessThanOrEqual(SYSTEM_WINDOW_MAX_LINES);
    // The same dungeon never counts twice.
    expect(climbFloor(won.state, d.dungeonName, foe.name).receipts).toEqual([]);
  });

  it('[tabletop ds151 + story rpg ds150 | mode-gap 8] no floor ladder, origin row, contact route or romance outside their mode', () => {
    const t = lastOf(T);
    expect(climbFloor(t, 'Old Crypt', 'Crypt Warden')).toEqual({ state: t, receipts: [] });
    expect(climbFloor(lastOf(R), 'Old Crypt', 'Crypt Warden').receipts).toEqual([]);
    for (const s of [lastOf(L), t]) {
      expect(originPad(s)).toBeNull();
      expect(storyRpgContactPad(s)).toBeNull();
      expect(romancePad(s, true)).toBeNull();
      expect(applyStoryRpgTurn(s, 'Origin: Soldier')).toEqual({ state: s, receipts: [] });
    }
    expect(storyRpgDecisionChip(R.after(21))).toBe('Pick an approach');
  });
});
