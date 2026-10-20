/**
 * q76a-INVARIANTS — pass + fail fixture per invariant.
 * q76c-WIRE-AUDIT — tape scan over last check-lap runs (report-only unless turnInvariants recorded).
 * Shapes: 20632 T9 (mid-fight travel), mega9 T52-54 (absent speaker / ledger),
 * L6 T19 (typed refusal answered), L6 T36-39 (dying options / label tags).
 * No OpenRouter. Vitest only (MIT).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../defaults';
import { initEncounterTerminal } from '../encounterTerminalFsm';
import type { GameState } from '../types';
import type { CheckSpec } from '../checkMath';
import { checkTurnInvariants, type InvariantViolation, type TurnInvariantInput } from './turnInvariants';
import { travelPadBlocked } from '../padUniverse';
import { isDying } from '../tabletop/roundFight';

/** Resolve fate-autoplay runs (worktree junction or sibling shared project). */
function runsRoot(): string {
  const here = resolve(__dirname, '../../../scripts/fate-autoplay/runs');
  if (existsSync(here)) return here;
  const sibling = resolve(__dirname, '../../../../project/scripts/fate-autoplay/runs');
  return sibling;
}

/** Latest check-lap folders for seeds used by recent ROUNDTYPED / tabletop laps. */
function listRecentCheckLapDirs(limit = 8): string[] {
  const root = runsRoot();
  if (!existsSync(root)) return [];
  const names = readdirSync(root).filter((n) => {
    if (!/_\w+-\w+_s\d+/.test(n) && !/_cursed-keep_/.test(n) && !/_summoned-pact_/.test(n)) return false;
    return existsSync(join(root, n, 'turns.jsonl'));
  });
  names.sort((a, b) => {
    try {
      return statSync(join(root, b)).mtimeMs - statSync(join(root, a)).mtimeMs;
    } catch {
      return 0;
    }
  });
  // Prefer the most recent check-lap window (today's 2063x / 2064x seeds) then fill.
  const preferred = names.filter((n) => /_s206(?:3[1-9]|4[0-9]|49)\b/.test(n));
  const ordered = preferred.length ? [...preferred, ...names.filter((n) => !preferred.includes(n))] : names;
  return ordered.slice(0, limit).map((n) => join(root, n));
}

function base(over: Partial<GameState> = {}): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s0,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 9,
    seed: 'q76a-invariants',
    character: { ...s0.character, name: 'Jax', hp: 20, maxHp: 20 },
    openingEstablishment: {
      ...(s0.openingEstablishment ?? {}),
      complete: true,
      pending: [],
      answers: {},
    },
    sceneFacts: {
      ...(s0.sceneFacts ?? {}),
      present: [],
      props: [],
      crowd: 'none',
      noise: 'quiet',
      lastBeat: '',
      updatedTurn: 9,
    },
    ...over,
  } as GameState;
}

function fightState(over: Partial<GameState> = {}): GameState {
  const s0 = base();
  const enc = initEncounterTerminal(
    {
      name: 'the thugs',
      level: 1,
      hp: 20,
      maxHp: 20,
      armorClass: 12,
      strength: 12,
      dexterity: 10,
      constitution: 12,
      xpReward: 10,
      goldReward: 0,
    },
    s0,
  );
  return {
    ...s0,
    currentLocation: 'On the road between places',
    activeEncounter: enc,
    ...over,
  } as GameState;
}

function dyingState(over: Partial<GameState> = {}): GameState {
  return base({
    turn: 36,
    character: {
      ...base().character,
      name: 'Jax',
      hp: 0,
      maxHp: 12,
      conditions: ['Unconscious'],
      srd: {
        ...(base().character.srd ?? {}),
        classId: 'fighter',
        skillProfs: [],
        expertise: [],
      } as GameState['character']['srd'],
    },
    deathSaves: { successes: 0, failures: 0 },
    currentLocation: 'On the road between places',
    ...over,
  });
}

function turn(partial: Partial<TurnInvariantInput> = {}): TurnInvariantInput {
  return {
    offeredOptions: [],
    playerInput: '',
    typed: false,
    prose: 'Dust hung in the lane.',
    ...partial,
  };
}

describe('q76a invariant (1) travel-blocked — 20632 T9', () => {
  it('pass: no travel offered or honoured while travelPadBlocked', () => {
    const before = fightState();
    expect(travelPadBlocked(before)).toBe(true);
    const after = { ...before, turn: 10 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: ['Attack the thugs', 'Take cover behind the cart'],
      playerInput: 'Attack the thugs',
      prose: 'Jax struck at the thugs.',
    }));
    expect(v.filter((x) => x.code === 'travel-blocked')).toEqual([]);
  });

  it('fail: Travel toward offered while fight blocks travel', () => {
    const before = fightState();
    const after = { ...before, turn: 10 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: ['Attack the thugs', 'Travel toward Greyhollow Inn'],
      playerInput: 'Attack the thugs',
    }));
    expect(v.some((x) => x.code === 'travel-blocked' && /Travel toward/i.test(x.detail))).toBe(true);
  });
});

describe('q76a invariant (2) dying-options — L6 T36-39', () => {
  it('pass: only dying chips while isDying', () => {
    const before = dyingState();
    expect(isDying(before)).toBe(true);
    const after = { ...before, turn: 37 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: [
        { label: 'Fight for breath', kind: 'dying' },
      ],
      playerInput: 'Fight for breath',
      prose: 'Jax fought for breath on the road.',
    }));
    expect(v.filter((x) => x.code === 'dying-options')).toEqual([]);
  });

  it('fail: travel chip while dying', () => {
    const before = dyingState();
    const after = { ...before, turn: 37 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: [
        { label: 'Fight for breath', kind: 'dying' },
        { label: 'Travel toward Greyhollow Inn', kind: 'exit' },
      ],
      playerInput: 'Fight for breath',
    }));
    expect(v.some((x) => x.code === 'dying-options')).toBe(true);
  });
});

describe('q76a invariant (3) typed-unanswered — L6 T19', () => {
  it('pass: refused typed line has a visible refusal body', () => {
    const before = base({ engineMode: 'litrpg', turn: 19 });
    const after = { ...before, turn: 20 };
    const v = checkTurnInvariants(before, after, turn({
      typed: true,
      playerInput: 'I pry it open with my crowbar',
      visibleAnswer: "You don't have: crowbar",
      prose: "You don't have: crowbar",
    }));
    expect(v.filter((x) => x.code === 'typed-unanswered')).toEqual([]);
  });

  it('fail: typed line with no visible answer', () => {
    const before = base({ turn: 19 });
    const after = { ...before, turn: 20 };
    const v = checkTurnInvariants(before, after, turn({
      typed: true,
      playerInput: 'I pick up the book with the palace seal',
      prose: '',
      answered: false,
      visibleAnswer: '',
    }));
    expect(v.some((x) => x.code === 'typed-unanswered')).toBe(true);
  });
});

describe('q76a invariant (4) absent-speaker — mega9 T52-54', () => {
  it('pass: speaker is in peopleHere / present record', () => {
    const before = base({
      turn: 52,
      sceneFacts: {
        present: ['Rook'],
        props: [],
        crowd: 'none',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 52,
      },
      npcMemories: [{
        npcId: 'person:rook',
        npcName: 'Rook',
        disposition: 'friendly',
        facts: [],
        lastSeenTurn: 51,
        present: true,
        location: base().currentLocation,
      }],
    });
    const after = { ...before, turn: 53 };
    const v = checkTurnInvariants(before, after, turn({
      speakers: ['Rook'],
      prose: 'Rook said, "Hold."',
    }));
    expect(v.filter((x) => x.code === 'absent-speaker')).toEqual([]);
  });

  it('fail: speaker not engine-present', () => {
    const before = base({
      turn: 52,
      sceneFacts: {
        present: [],
        props: [],
        crowd: 'none',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 52,
      },
    });
    const after = { ...before, turn: 53 };
    const v = checkTurnInvariants(before, after, turn({
      speakers: ['Mira Voss'],
      prose: 'Mira Voss said, "Wait."',
    }));
    expect(v.some((x) => x.code === 'absent-speaker' && /Mira Voss/.test(x.detail))).toBe(true);
  });
});

describe('q76a invariant (5) label-outcome — structure vs CheckSpec', () => {
  const check: CheckSpec = {
    kind: 'skill',
    ability: 'CHA',
    skill: 'persuasion',
    dc: 15,
    dcShown: false,
    adv: 'normal',
  };

  it('pass: plain action label with CheckSpec on the record', () => {
    const before = base();
    const after = { ...before, turn: 10 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: [{ label: 'Talk the guard down', check }],
    }));
    expect(v.filter((x) => x.code === 'label-outcome')).toEqual([]);
  });

  it('fail: label embeds CheckSpec tag text', () => {
    const before = base();
    const after = { ...before, turn: 10 };
    const v = checkTurnInvariants(before, after, turn({
      offeredOptions: [{
        label: 'Talk the guard down - Charisma (Persuasion) roll',
        check,
      }],
    }));
    expect(v.some((x) => x.code === 'label-outcome')).toBe(true);
  });
});

describe('q76a invariant (6) system-ledger — mega9 T52-54 / wrong-voice', () => {
  it('pass: tabletop prose without ledger terms', () => {
    const before = base({ turn: 54 });
    const after = { ...before, turn: 55 };
    const v = checkTurnInvariants(before, after, turn({
      prose: 'The thugs staggered back into the ditch.',
    }));
    expect(v.filter((x) => x.code === 'system-ledger')).toEqual([]);
  });

  it('fail: HP ledger term in tabletop prose', () => {
    const before = base({ turn: 54 });
    const after = { ...before, turn: 55 };
    const v = checkTurnInvariants(before, after, turn({
      prose: 'Jax lost 4 HP from the blow.',
    }));
    expect(v.some((x) => x.code === 'system-ledger')).toBe(true);
  });
});

describe('q76b-STRESS stub writer voices only present', () => {
  it('pass: stub speakers ⊆ peopleHere', async () => {
    const { buildStressStubProse } = await import('../../../scripts/stress-player/stubWriter');
    const { peopleHere } = await import('../chipLegality');
    const before = base({
      sceneFacts: {
        present: ['Sergeant Holt'],
        props: ['cart'],
        crowd: 'sparse',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 9,
      },
    });
    const stub = buildStressStubProse(before, 'Look around');
    const hereList = peopleHere(before);
    const here = new Set<string>();
    for (let i = 0; i < hereList.length; i++) here.add(hereList[i]!.toLowerCase());
    for (const sp of stub.speakers) {
      const low = sp.toLowerCase();
      let ok = here.has(low);
      if (!ok) for (const h of here) { if (h.includes(low) || low.includes(h)) { ok = true; break; } }
      expect(ok).toBe(true);
    }
    expect(stub.prose.length).toBeGreaterThan(8);
  });

  it('pass: empty present → no speakers', async () => {
    const { buildStressStubProse } = await import('../../../scripts/stress-player/stubWriter');
    const before = base({
      sceneFacts: {
        present: [],
        props: [],
        crowd: 'none',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 9,
      },
    });
    const stub = buildStressStubProse(before, 'Wait');
    expect(stub.speakers).toEqual([]);
  });
});

describe('q76e-SCENARIOS engine injection + answered + naughty stub', () => {
  it('injectFight: activeEncounter from selectCatalogEncounter + initEncounterTerminal', async () => {
    const { injectFight } = await import('../../../scripts/stress-player/scenarios');
    const after = injectFight(base({ engineMode: 'dnd', campaignBibleId: 'cursed-keep' }));
    expect(after.activeEncounter?.name).toBeTruthy();
    expect(after.activeEncounter?.phase ?? 'engaged').toBeTruthy();
  });

  it('injectDying: deathSaves + hp 0 while fight live (SRD drop to 0)', async () => {
    const { injectDying } = await import('../../../scripts/stress-player/scenarios');
    const after = injectDying(base({ engineMode: 'dnd', campaignBibleId: 'cursed-keep' }));
    expect(after.character.hp).toBe(0);
    expect(after.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(after.activeEncounter?.name).toBeTruthy();
    expect(isDying(after)).toBe(true);
  });

  it('injectRoadBlock: journey.encounter from rollRoadEncounter', async () => {
    const { injectRoadBlock } = await import('../../../scripts/stress-player/scenarios');
    const { mulberry32 } = await import('../fatePick');
    const after = injectRoadBlock(
      base({ engineMode: 'dnd', campaignBibleId: 'cursed-keep', currentLocation: 'Greyhollow Inn' }),
      mulberry32(42),
    );
    expect(after.journey).toBeTruthy();
    expect(after.journey?.encounter).toBeTruthy();
  });

  it('injectGatekeeper: agenda want/need via ensureNpcAgenda', async () => {
    const { injectGatekeeper } = await import('../../../scripts/stress-player/scenarios');
    const after = injectGatekeeper(base());
    const osric = (after.npcMemories ?? []).find((m) => /osric/i.test(m.npcName));
    expect(osric?.need || osric?.goal?.motivation).toBeTruthy();
    expect((after.sceneFacts?.present ?? []).some((p) => /osric/i.test(String(p)))).toBe(true);
  });

  it('engineAnswered: bare gmText is not enough; refusalBody counts', async () => {
    const { engineAnswered } = await import('../../../scripts/stress-player/scenarios');
    expect(engineAnswered({ typed: true }).answered).toBe(false);
    expect(engineAnswered({
      typed: true,
      systemLog: ['Dry run — stub writer, no GM call'],
    }).answered).toBe(false);
    const refused = engineAnswered({
      typed: true,
      refusalBody: "You don't have: crowbar",
    });
    expect(refused.answered).toBe(true);
    expect(refused.visibleAnswer).toMatch(/crowbar/i);
    expect(engineAnswered({
      typed: true,
      systemLog: ['Dry run — stub', 'Travel: road between A and B — leg 1 of 3'],
    }).answered).toBe(true);
  });

  it('naughty stub voices absent NPC → absent-speaker invariant fires', async () => {
    const { buildStressStubProse } = await import('../../../scripts/stress-player/stubWriter');
    const before = base({
      turn: 52,
      sceneFacts: {
        present: ['Rook'],
        props: [],
        crowd: 'none',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 52,
      },
      npcMemories: [{
        npcId: 'person:mira',
        npcName: 'Mira Voss',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 10,
        present: false,
        location: 'elsewhere',
      }],
    });
    const stub = buildStressStubProse(before, 'Look around', { naughty: true, roll: 0, naughtyChance: 1 });
    expect(stub.speakers.some((s) => /mira/i.test(s))).toBe(true);
    const after = { ...before, turn: 53 };
    const v = checkTurnInvariants(before, after, turn({
      speakers: stub.speakers,
      prose: stub.prose,
    }));
    expect(v.some((x) => x.code === 'absent-speaker')).toBe(true);
  });

  it('pickAndInjectScenario: ~60% risky over many draws', async () => {
    const { pickAndInjectScenario } = await import('../../../scripts/stress-player/scenarios');
    const { mulberry32 } = await import('../fatePick');
    const rng = mulberry32(7);
    let risky = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const r = pickAndInjectScenario(base({ engineMode: 'dnd', campaignBibleId: 'cursed-keep' }), rng);
      if (r.id !== 'none') risky += 1;
    }
    expect(risky / n).toBeGreaterThan(0.45);
    expect(risky / n).toBeLessThan(0.75);
  });
});

describe('q76c wire — check-lap tape scan', () => {
  it('scans recent check-lap turns; P0 fails only when turnInvariants was recorded', () => {
    const dirs = listRecentCheckLapDirs(8);
    // No tapes in this worktree: skip soft (CI / fresh clone).
    if (dirs.length === 0) {
      expect(dirs).toEqual([]);
      return;
    }
    const historicalNotes: string[] = [];
    const newP0: string[] = [];
    for (let d = 0; d < dirs.length; d++) {
      const dir = dirs[d]!;
      const lines = readFileSync(join(dir, 'turns.jsonl'), 'utf8').split('\n').filter((l) => l.trim());
      for (let i = 0; i < lines.length; i++) {
        const row = JSON.parse(lines[i]!) as {
          turn?: number;
          turnInvariants?: InvariantViolation[];
          offeredChoices?: string[];
          playerInput?: string;
          fatePick?: string;
          gmText?: string;
        };
        const inv = row.turnInvariants;
        if (!Array.isArray(inv)) {
          historicalNotes.push(`${dir.split(/[/\\]/).pop()} T${row.turn}: historical (no turnInvariants)`);
          continue;
        }
        // Newly recorded run (post-q76c wire): fail on P0 only; P1 report-only.
        for (let v = 0; v < inv.length; v++) {
          const hit = inv[v]!;
          if (hit.severity === 'P0') {
            newP0.push(`${dir.split(/[/\\]/).pop()} T${row.turn} ${hit.code}: ${hit.detail}`);
          }
        }
      }
    }
    // Keep noise low: one diagnostic line when only historical tapes exist.
    if (newP0.length === 0 && historicalNotes.length > 0) {
      expect(historicalNotes.length).toBeGreaterThan(0);
    }
    expect(newP0, newP0.slice(0, 8).join('\n')).toEqual([]);
  });

  it('merges invariant P0 into turnCheck-shaped flags (fate / check-lap contract)', () => {
    const before = fightState();
    const after = { ...before, turn: 10 };
    const inv = checkTurnInvariants(before, after, turn({
      offeredOptions: ['Attack the thugs', 'Travel toward Greyhollow Inn'],
      playerInput: 'Attack the thugs',
    }));
    const p0 = inv.filter((x) => x.severity === 'P0' && x.code === 'travel-blocked');
    expect(p0.length).toBeGreaterThan(0);
    // Same kind string ttCheckLap.ps1 reads from turnCheck.p0[].kind
    expect(p0[0]!.code).toBe('travel-blocked');
  });
});
