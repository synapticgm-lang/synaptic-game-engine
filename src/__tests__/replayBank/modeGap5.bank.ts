/**
 * mode-gap step 5: titles earned from deeds with a small check perk, achievements that pay a tiered reward box
 * (Bronze to Legendary) opened on the existing loot tables, and one System notice format for STATUS.
 * LitRPG tapes: summoned-pact s150 (private window) wins its own fight at "Face the thugs"; s76 (leftover pocket)
 * wins the same fight with the level hidden. Tabletop cursed-keep ds151 and story RPG salt-road-heist ds150 get
 * no boxes, titles or notice format.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from '../../game/arcDirector';
import { runPlayerCheck } from '../../game/checkMath';
import { parsePlayerIntent } from '../../game/intentParser';
import { validateActionHard } from '../../game/actionValidation';
import { mediatePlayerInput } from '../../game/inputMediation';
import { applySandboxXpAwards } from '../../game/sandboxXp';
import { systemPromptPad } from '../../game/rules/abilityPoints';
import { classOfferPad } from '../../game/rules/characterClass';
import { isRewardBox, openBoxChip, rewardBoxPad, settleDeeds } from '../../game/rules/achievements';
import { activeTitleOf, earnedTitles, titleCheckMod } from '../../game/rules/titles';
import { presentSystemNotices, systemNotice } from '../../game/systemNotice';
import { buildLitrpgSystemWindow, shouldAttachLitrpgSystemWindow, SYSTEM_WINDOW_MAX_LINES } from '../../game/litrpgSystemWindow';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const LIT150 = '2026-10-12T17-05-53-021Z_summoned-pact_cold-system_s150';
const S76 = '2026-10-07T16-15-12-290Z_summoned-pact_cold-system_s76';
const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';
const RPG_DS150 = '2026-10-13T14-15-18-792Z_salt-road-heist_chilled-gm_s150';

let L: Replay;
let P: Replay;
let T: Replay;
let R: Replay;
beforeAll(async () => {
  [L, P, T, R] = [
    new Replay(await replayWhole(LIT150)),
    new Replay(await replayWhole(S76)),
    new Replay(await replayWhole(TT_DS151)),
    new Replay(await replayWhole(RPG_DS150)),
  ];
}, 900_000);

function calm(r: Replay): GameState {
  const s = [...r.turns()].reverse().map((t) => r.after(t)).find((x) => !x.activeEncounter && !x.roundCombat);
  if (!s) throw new Error('no calm turn on tape');
  return s;
}

/** The harness turn whose commit first holds the deed key. */
function deedTurn(r: Replay, key: string): number {
  const t = r.turns().find((n) => (r.after(n).sandboxAwardKeys ?? []).includes(key));
  if (t == null) throw new Error(`no ${key} on tape`);
  return t;
}

function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  return { arc, state: { ...arc.state, turn: (arc.state.turn ?? 0) + 1 }, status: formatArcStatusReceipts(arc) };
}

const award = (s: GameState, keys: string[]) =>
  applySandboxXpAwards({ ...s, sandboxAwardKeys: keys }, {
    playerAction: 'Walk on',
    locationName: s.currentLocation,
    previousLocationName: s.currentLocation,
    questsBefore: s.quests,
    questsAfter: s.quests,
    events: [],
    turn: (s.turn ?? 0) + 1,
  });

const boxes = (s: GameState) => (s.inventory ?? []).filter(isRewardBox).map((i) => i.name);

describe('replay bank mode-gap 5 (titles, achievements, reward boxes, System notices)', () => {
  it('[litrpg s150 | mode-gap 5] the tape\'s own first win pays First Kill: a Bronze box, the Blooded title, two STATUS notices', () => {
    const t = deedTurn(L, 'achv:first-kill');
    expect(L.input(t)).toBe('Face the thugs');
    const before = L.before(t);
    const after = L.after(t);
    expect(boxes(before)).toEqual([]);
    expect(boxes(after)).toEqual(['Bronze Reward Box']);
    expect(after.sandboxAwardKeys).toEqual(expect.arrayContaining(['box:achv:first-kill', 'title:blooded']));
    const status = L.receipts(t);
    expect(status).toContain('Achievement: First Kill — Bronze Reward Box.');
    expect(status).toContain('Title earned: Blooded (+1 Athletics).');
    expect(activeTitleOf(after)).toMatchObject({ name: 'Blooded', def: { skill: 'athletics' } });
    // Later turns never pay it again.
    for (const n of L.turns().filter((x) => x > t)) expect(L.receiptText(n)).not.toMatch(/First Kill|Blooded/);
    expect(boxes(calm(L))).toEqual(['Bronze Reward Box']);
  });

  it('[litrpg s150 | mode-gap 5] the System row offers the box; the chip passes the gates and opens on the loot table before the writer', () => {
    const s = calm(L);
    expect(rewardBoxPad(s)).toEqual([openBoxChip('Bronze')]);
    const prompt = systemPromptPad(s, classOfferPad(s));
    if (prompt?.heading.startsWith('System — reward box')) expect(prompt.chips).toEqual([openBoxChip('Bronze')]);
    const chip = openBoxChip('Bronze');
    expect(mediatePlayerInput(chip)).toMatchObject({ action: expect.not.stringMatching(/^block$/), text: chip });
    const lastGm = [...s.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
    const hard = validateActionHard(chip, s, lastGm);
    expect(hard.valid).toBe(true);
    expect(hard.rewritten ?? chip).toBe(chip);
    const r = turn(s, chip);
    expect(boxes(r.state)).toEqual([]);
    const gained = r.state.inventory.filter((i) => !s.inventory.some((o) => o.id === i.id));
    expect(gained.length).toBeGreaterThan(0);
    const loot = r.status.find((l) => l.startsWith('Loot: '))!;
    expect(loot).toMatch(/^Loot: \[\w+\] .+ \(Bronze Reward Box\)$/);
    for (const i of gained) expect(loot).toContain(`[${i.rarity}] ${i.name}`);
    expect(JSON.stringify(r.arc)).toMatch(/ENGINE RESULT[^"]*opened the Bronze Reward Box/);
    expect(rewardBoxPad(r.state)).toBeNull();
    // Same seed, same box, same loot.
    expect(turn(s, 'Open the reward box').state.inventory).toEqual(r.state.inventory);
  });

  it('[litrpg s150 | mode-gap 5] a box waits during a fight; ordinary tape lines never open it', () => {
    const s = calm(L);
    const fight = L.after(deedTurn(L, 'achv:first-kill') - 1);
    const inFight = { ...s, activeEncounter: fight.activeEncounter ?? ({ id: 'x' } as unknown as GameState['activeEncounter']) };
    expect(rewardBoxPad(inFight)).toBeNull();
    expect(boxes(turn(inFight, openBoxChip('Bronze')).state)).toEqual(['Bronze Reward Box']);
    for (const n of [2, 4, 8, 9, 13]) expect(boxes(turn(s, L.input(n)).state), L.input(n)).toEqual(['Bronze Reward Box']);
  });

  it('[litrpg s150 | mode-gap 5] the worn title adds +1 to its own check skill only, and shares the +3 cap with a named skill', () => {
    const s = calm(L);
    expect(titleCheckMod(s, 'athletics', 0, 'move')).toEqual({ label: 'Title: Blooded', value: 1 });
    expect(titleCheckMod(s, 'perception', 0, 'move')).toBeNull();
    expect(titleCheckMod(s, 'athletics', 0, 'attack')).toBeNull();
    expect(titleCheckMod(s, 'athletics', 3, 'move')).toBeNull();
    expect(titleCheckMod(s, 'athletics', 2, 'move')?.value).toBe(1);
    const line = 'Climb the wall';
    const intent = parsePlayerIntent(line, s);
    const titled = runPlayerCheck(s, intent, line, 10);
    const bare = runPlayerCheck({ ...s, sandboxAwardKeys: (s.sandboxAwardKeys ?? []).filter((k) => !k.startsWith('title:')) }, intent, line, 10);
    if (titled.record?.label === 'Athletics') {
      expect(titled.record.mods.find((m) => m.label === 'Title: Blooded')?.value).toBe(1);
      expect(titled.modifier).toBe(bare.modifier + 1);
    } else {
      expect(titled.record).toEqual(bare.record);
    }
  });

  it('[litrpg s150 | mode-gap 5] a second title is earned but not worn; "Set title" switches it, with a receipt and a writer fact', () => {
    const s = calm(L);
    const keys = [...(s.sandboxAwardKeys ?? []), 'quest-complete:circles-price'];
    const paid = award(s, keys);
    expect(paid.items.filter((i) => i.name === 'Silver Reward Box')).toHaveLength(1);
    expect(paid.lootNotes).toContain('Achievement: First Quest Complete — Silver Reward Box.');
    expect(paid.lootNotes).toContain('Title earned: Pathfinder (+1 Survival). Worn title stays Blooded.');
    const next = { ...s, sandboxAwardKeys: paid.awardKeys, inventory: [...s.inventory, ...paid.items] };
    expect(earnedTitles(next).map((t) => t.name)).toEqual(['Blooded', 'Pathfinder']);
    expect(activeTitleOf(next)?.name).toBe('Blooded');
    const r = turn(next, 'Set title: Pathfinder');
    expect(r.state.character.activeTitle).toBe('Pathfinder');
    expect(r.status).toContain('Title: Pathfinder is now the worn title (+1 Survival).');
    expect(JSON.stringify(r.arc)).toMatch(/ENGINE RESULT[^"]*wears the title Pathfinder/);
    expect(turn(next, 'Set title: Bossbreaker').state.character.activeTitle).toBe(next.character.activeTitle);
    const w = buildLitrpgSystemWindow(r.state)!.lines;
    expect(w).toContain('Title: Pathfinder (+1 Survival)');
    expect(w.length).toBeLessThanOrEqual(SYSTEM_WINDOW_MAX_LINES);
    expect(shouldAttachLitrpgSystemWindow({ state: r.state, systemLog: r.status })).toBe(true);
    expect(rewardBoxPad(next)).toEqual([openBoxChip('Bronze'), openBoxChip('Silver')]);
    expect(turn(next, openBoxChip('Silver')).state.inventory.filter(isRewardBox).every((i) => i.name !== 'Silver Reward Box')).toBe(true);
  });

  it('[litrpg s150 | mode-gap 5] tiers climb Bronze to Legendary on deeds; settle is idempotent', () => {
    const s = calm(L);
    const keys = [...(s.sandboxAwardKeys ?? []), 'achv:fights-won-3', 'achv:fights-won-10', 'dungeon-clear:a', 'dungeon-clear:b', 'dungeon-clear:c'];
    const out = settleDeeds(s, { awardKeys: keys, bossWon: true, skillEvolved: true });
    expect(out.items.map((i) => [i.name, i.rarity])).toEqual([
      ['Silver Reward Box', 'Uncommon'],
      ['Silver Reward Box', 'Uncommon'],
      ['Gold Reward Box', 'Rare'],
      ['Gold Reward Box', 'Rare'],
      ['Platinum Reward Box', 'Epic'],
      ['Legendary Reward Box', 'Legendary'],
    ]);
    expect(settleDeeds(s, { awardKeys: out.awardKeys, bossWon: true, skillEvolved: true }).items).toEqual([]);
  });

  it('[litrpg s150 | mode-gap 5] STATUS reads in one System notice format, loot with each rarity; the stored lines stay as they are', () => {
    const t = deedTurn(L, 'achv:first-kill');
    const shown = presentSystemNotices(L.receipts(t), 'litrpg');
    expect(shown).toContain('Achievement — First Kill — Bronze Reward Box.');
    expect(shown).toContain('Title earned — Blooded (+1 Athletics).');
    const xp = L.receipts(t).find((l) => /^XP Gained: \d+ \(/.test(l));
    if (xp) expect(systemNotice(xp)).toMatch(/^XP — \+\d+ \(.+\)\.$/);
    expect(systemNotice('Quest Unlocked: Circle\'s Price')).toBe('Quest accepted — Circle\'s Price.');
    expect(systemNotice('XP Gained: 45 (quest step: Find the Weighing Cup)')).toBe('Quest updated — Find the Weighing Cup. +45 XP.');
    expect(systemNotice('Quest complete: Circle\'s Price')).toBe('Quest complete — Circle\'s Price.');
    expect(systemNotice('Level Up! Now level 2')).toBe('Level up — level 2.');
    expect(systemNotice('Skill rank up: Searching (rank 1).')).toBe('Skill up — Searching, rank 1.');
    expect(systemNotice('Loot: [Rare] Ash Blade, [Common] Rope (Bronze Reward Box)')).toBe('Loot — Ash Blade (Rare), Rope (Common) (Bronze Reward Box).');
    expect(L.receipts(t)).toContain('Achievement: First Kill — Bronze Reward Box.');
  });

  it('[litrpg s76 | mode-gap 5] the leftover pocket hides the level: the same win is recorded in secret — no box, no notice', () => {
    const t = deedTurn(P, 'achv:first-kill');
    expect(P.input(t)).toBe('Face the thugs');
    const s = P.after(t);
    expect(s.systemHousing?.housing).toBe('leftover_pocket');
    expect(s.sandboxAwardKeys).toEqual(expect.arrayContaining(['achv:first-kill', 'title:blooded']));
    expect(boxes(s)).toEqual([]);
    expect(P.receiptText(t)).not.toMatch(/Achievement|Title|Reward Box/);
    expect(rewardBoxPad(calm(P))).toBeNull();
    expect(turn(calm(P), 'Set title: Blooded').state.character.activeTitle).toBe(calm(P).character.activeTitle);
  });

  it('[tabletop ds151 + rpg ds150 | mode-gap 5] no boxes, titles or notice format outside LitRPG; checks unchanged', () => {
    for (const r of [T, R]) {
      const s = calm(r);
      expect(s.engineMode).not.toBe('litrpg');
      const keys = [...(s.sandboxAwardKeys ?? []), 'achv:first-kill', 'achv:fights-won-3', 'quest-complete:x'];
      expect(settleDeeds(s, { awardKeys: keys, bossWon: true })).toMatchObject({ items: [], notes: [] });
      const titled = { ...s, sandboxAwardKeys: [...keys, 'title:blooded'] };
      expect(earnedTitles(titled)).toEqual([]);
      expect(titleCheckMod(titled, 'athletics', 0, 'move')).toBeNull();
      const line = 'Climb the wall';
      const intent = parsePlayerIntent(line, s);
      expect(runPlayerCheck(titled, intent, line, 10).record).toEqual(runPlayerCheck(s, intent, line, 10).record);
      expect(rewardBoxPad(s)).toBeNull();
      expect(boxes(turn(s, 'Open the reward box').state)).toEqual([]);
      for (const n of r.turns()) {
        expect(r.receiptText(n)).not.toMatch(/Reward Box|Title earned/);
        expect(presentSystemNotices(r.receipts(n), s.engineMode)).toEqual(r.receipts(n));
      }
    }
  });
});
