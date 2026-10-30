/**
 * T10SOC — use-based social skills (LitRPG / RPG).
 * Flat Social track replaced for those modes; tabletop unchanged.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { runArcDirectorBeforeGm, formatArcStatusReceipts } from './arcDirector';
import {
  classifySocialSkillAttempt,
  ensureUseSkillProgress,
  failureXpSliver,
  resolveSocialSkillAttempt,
  skillRollBonus,
  successProbability,
  successXpForOdds,
  SOCIAL_USE_TABLE,
} from './socialSkillAttempt';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc:${over.npcName}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    ...over,
  } as NpcMemory;
}

function litrpgHall(over: Partial<GameState> = {}): GameState {
  const vessa = mem({
    npcName: 'Vessa',
    npcId: 'npc-vessa',
    location: 'Ash Hall',
    roleHint: 'handler',
  });
  const base = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...base,
    engineMode: 'litrpg',
    character: {
      ...(base.character ?? { name: 'Jax', hp: 10, maxHp: 10, level: 1, xp: 0 }),
      name: 'Jax',
      level: 1,
      xp: 40,
    },
    turn: 12,
    seed: 't10soc-seed',
    currentLocation: 'Ash Hall',
    sceneFacts: {
      crowd: 'sparse',
      noise: 'quiet',
      present: ['Vessa'],
      props: [],
      lastBeat: '',
      updatedTurn: 12,
    },
    npcMemories: [vessa],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

describe('T10SOC use-based social skills', () => {
  it('lie success: seeded roll updates Deception xp/level, receipt shows roll+gain, believes fact', () => {
    const state = litrpgHall();
    const attempt = classifySocialSkillAttempt(state, 'Lie to Vessa about the pact');
    expect(attempt?.skill).toBe('deception');
    expect(attempt?.target).toMatch(/Vessa/i);
    // Easy DC with high d20 → success
    const resolved = resolveSocialSkillAttempt(state, attempt!, { d20: 18 });
    expect(resolved.success).toBe(true);
    expect(resolved.xpGained).toBeGreaterThan(0);
    expect(resolved.skillAfter.xp + resolved.skillAfter.level).toBeGreaterThan(0);
    expect(resolved.receipt).toMatch(/^Deception: rolled 18/);
    expect(resolved.receipt).toMatch(/success/);
    expect(resolved.receipt).toMatch(/Deception \+\d+ XP/);
    expect(resolved.fact).toMatch(/believes/i);
    expect(resolved.state.arcDirector?.socialProgression?.useSkills?.deception?.xp).toBeGreaterThan(0);
  });

  it('lie fail: sliver XP > 0, sees through, disposition via persona owner', () => {
    const state = litrpgHall();
    const attempt = classifySocialSkillAttempt(state, 'Bluff Vessa that you are a priest');
    expect(attempt?.skill).toBe('deception');
    const resolved = resolveSocialSkillAttempt(state, attempt!, { d20: 2 });
    expect(resolved.success).toBe(false);
    expect(resolved.xpGained).toBe(failureXpSliver());
    expect(resolved.xpGained).toBeGreaterThan(0);
    expect(resolved.fact).toMatch(/sees through/i);
    expect(resolved.receipt).toMatch(/failed/);
    const nudges = resolved.state.personaNudges ?? [];
    expect(nudges.some((n) => n.tag === 'lied_caught')).toBe(true);
  });

  it('long-shot win pays strictly more than an easy win', () => {
    const easyP = successProbability(8, 10); // high bonus, low DC
    const hardP = successProbability(0, 18); // no bonus, high DC
    expect(hardP).toBeLessThan(easyP);
    const easyXp = successXpForOdds(easyP);
    const hardXp = successXpForOdds(hardP);
    expect(hardXp).toBeGreaterThan(easyXp);
  });

  it('small talk and a plain question earn 0 — no receipt, no roll', () => {
    const state = litrpgHall();
    expect(classifySocialSkillAttempt(state, 'Talk to Vessa')).toBeNull();
    expect(classifySocialSkillAttempt(state, 'Ask Vessa what she wants')).toBeNull();
    expect(classifySocialSkillAttempt(state, 'Hello there')).toBeNull();
    const arc = runArcDirectorBeforeGm(state, 'Ask Vessa about the weather');
    expect(arc.systemReceipts.some((r) => /Deception|Persuasion|Barter|Intimidation: rolled|Social track:/.test(r))).toBe(
      false,
    );
  });

  it('talk to an absent NPC earns 0; knife threat at present = Intimidation; absent threat = 0', () => {
    const present = litrpgHall();
    expect(classifySocialSkillAttempt(present, 'Ask Orin Quill about the charter')).toBeNull();

    const knifePresent = classifySocialSkillAttempt(
      present,
      'Threaten Vessa with my knife until she talks',
    );
    expect(knifePresent?.skill).toBe('intimidation');
    expect(knifePresent?.target).toMatch(/Vessa/i);
    const rolled = resolveSocialSkillAttempt(present, knifePresent!, { d20: 15 });
    expect(rolled.receipt).toMatch(/^Intimidation: rolled/);

    const alone = litrpgHall({
      sceneFacts: {
        crowd: 'empty',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 12,
      },
      npcMemories: [
        mem({ npcName: 'Vessa', npcId: 'npc-vessa', location: 'Lowmarket', present: false }),
      ],
    });
    expect(classifySocialSkillAttempt(alone, 'Threaten Vessa with my knife')).toBeNull();
  });

  it('tabletop (dnd) mode: no use-skill roll / no skill XP; receipts stay on legacy path', () => {
    const dnd = litrpgHall({ engineMode: 'dnd' });
    expect(classifySocialSkillAttempt(dnd, 'Lie to Vessa about the pact')).toBeNull();
    const arc = runArcDirectorBeforeGm(dnd, 'Talk to Vessa');
    expect(arc.systemReceipts.some((r) => /Deception|Persuasion|Barter|Intimidation: rolled/.test(r))).toBe(
      false,
    );
    // Legacy still may mint Social: talk (STATUS does not show Social track on dnd).
    expect(arc.systemReceipts.some((r) => r.startsWith('Social track:'))).toBe(false);
  });

  it('higher skill level raises the roll bonus; old save without useSkills loads defaults', () => {
    expect(skillRollBonus(0)).toBe(0);
    expect(skillRollBonus(2)).toBe(1);
    expect(skillRollBonus(4)).toBe(2);
    expect(skillRollBonus(99)).toBe(SOCIAL_USE_TABLE.BONUS_CAP);

    const migrated = ensureUseSkillProgress({
      actorId: 'player',
      socialXp: 20,
      level: 1,
      skillRanks: { persuasion: 0, intimidation: 0, deception: 0, insight: 0 },
      unlockedNodes: [],
      awardedNoveltyKeys: [],
      titles: [],
      revision: 1,
    });
    expect(migrated.deception).toEqual({ level: 0, xp: 0 });
    expect(migrated.barter.level).toBe(0);
  });

  it('character XP (sandboxXp / character.xp) unchanged by a social success', () => {
    const state = litrpgHall();
    const beforeXp = state.character?.xp ?? 0;
    const attempt = classifySocialSkillAttempt(state, 'Persuade Vessa to help');
    expect(attempt?.skill).toBe('persuasion');
    const resolved = resolveSocialSkillAttempt(state, attempt!, { d20: 19 });
    expect(resolved.success).toBe(true);
    expect(resolved.state.character?.xp).toBe(beforeXp);
    expect(resolved.state.character?.level).toBe(state.character?.level);
  });

  it('STATUS passes use-skill receipts through formatArcStatusReceipts', () => {
    const line =
      'Deception: rolled 14+2 vs DC 17 — success (long shot). Deception +9 XP (level 3)';
    const lines = formatArcStatusReceipts({
      systemReceipts: [line],
      state: litrpgHall(),
    } as never);
    expect(lines).toContain(line);
  });

  it('arcDirector LitRPG lie posts receipt + mandate; small-talk does not', () => {
    const state = litrpgHall();
    const win = runArcDirectorBeforeGm(state, 'Lie to Vessa about Earth', { d20: 18 });
    expect(win.systemReceipts.some((r) => /^Deception: rolled /.test(r))).toBe(true);
    expect(win.mandate).toMatch(/believes/i);
    expect(win.state.character?.xp).toBe(state.character?.xp);

    const chat = runArcDirectorBeforeGm(state, 'Talk to Vessa');
    expect(chat.systemReceipts.some((r) => /Social track:|Deception:|Persuasion:/.test(r))).toBe(false);
  });
});
