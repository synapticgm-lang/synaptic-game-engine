/**
 * T10U — Then Jax harvest, speech stitch (shout + while), met memory, death book prose.
 */
import { describe, expect, it } from 'vitest';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { isPlannerUiPersonToken } from './chromeAuthority';
import { parsePlayerSteps, sheetContextFromState } from './intentParser';
import { convertWriterCueFact, buildClauseWriterFact } from './writerCueLines';
import { writerEngineResult } from './travelJourney';
import { roadDeathBookProse } from './roadDeath';
import { sheetMemoryLine } from './npcRecords';
import { engageAddressedInHereSpot } from './hereSpot';
import { harvestNarrativePeople } from './narrativeHarvest';
import type { GameState, NpcMemory } from './types';

const base = (): GameState =>
  ({
    turn: 92,
    seed: 't10u',
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    character: { name: 'Jax', hp: 10, maxHp: 10, level: 1, xp: 0, xpToNext: 100 },
    currentLocation: 'Blackspine Treeline',
    sceneFacts: { present: ['Merrit Pike', 'Lisle Dunmore'] },
    npcMemories: [
      {
        npcId: 'merrit',
        npcName: 'Merrit Pike',
        disposition: 'neutral',
        facts: ['Introduced in play T1'],
        lastSeenTurn: 90,
        location: 'Blackspine Treeline',
        met: true,
        introSpoken: true,
        meetCount: 0,
        present: true,
      },
      {
        npcId: 'lisle',
        npcName: 'Lisle Dunmore',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 90,
        location: 'Blackspine Treeline',
        met: true,
        introSpoken: true,
        meetCount: 1,
        present: true,
      },
    ],
  }) as unknown as GameState;

describe('T10U Then Jax / discourse harvest', () => {
  it('Then Jax is not a harvestable person; planner rejects discourse+Name', () => {
    expect(isPlannerUiPersonToken('Then Jax')).toBe(true);
    expect(canHarvestAsNamedPerson('Then Jax', 'cursed-keep', ['Merrit Pike'])).toBe(false);
    expect(canHarvestAsNamedPerson('Lisle Dunmore', 'cursed-keep', ['Lisle Dunmore'])).toBe(true);
  });

  it('harvest never admits Then Jax or the PC name as an NPC', () => {
    const prose =
      'Jax spun the empty flask. Then Jax glared at Lisle and asked about the shadows.';
    const { state, people } = harvestNarrativePeople(base(), prose, 122);
    expect(people.some((p) => /Then Jax/i.test(p))).toBe(false);
    expect((state.sceneFacts?.present ?? []).some((p) => /Then Jax/i.test(p))).toBe(false);
    expect(people.some((p) => /^Jax$/i.test(p))).toBe(false);
  });
});

describe('T10U speech stitch shout + while', () => {
  it('one quote + trailing while: act, one speech verb, trailing narration not quoted', () => {
    const line =
      'I spin around and kick a pile of pine needles into the air, shouting "Show yourself if you\'re gonna lurk in the shadows!" while scanning the tree line for any movement.';
    const read = parsePlayerSteps(line, sheetContextFromState(base()));
    const talk = read.steps.find((s) => s.say || s.action === 'talk');
    expect(talk?.say).toMatch(/Show yourself if you.?re gonna lurk in the shadows/i);
    expect(talk?.say).not.toMatch(/while scanning/i);
    const fact = buildClauseWriterFact(talk!.clause ?? line, true, {
      said: talk!.say ?? undefined,
      addressee: talk!.addressee,
      presentHere: ['Merrit Pike', 'Lisle Dunmore'],
    });
    const plain = convertWriterCueFact(fact, 'Jax');
    expect(plain).toMatch(/shouted,\s*"Show yourself/i);
    expect(plain).not.toMatch(/Jax said,.*Jax (?:said|shouted)/i);
    expect(plain).not.toMatch(/"While scanning/i);
    expect(plain).toMatch(/scann(?:ed|ing) the tree line/i);
  });
});

describe('T10U met memory + presence', () => {
  it('sheetMemoryLine treats introSpoken as known without visit-count "has met before"', () => {
    const m = base().npcMemories![0]! as NpcMemory;
    const line = sheetMemoryLine(m, 'Jax');
    // meetCount 0 = same visit (s73); still not a stranger (T10U disposition + greet).
    expect(line).not.toMatch(/has met Jax before/i);
    expect(line).toMatch(/disposition neutral/i);
    expect(line).toMatch(/someone they know/i);
    const returned = sheetMemoryLine(base().npcMemories![1]! as NpcMemory, 'Jax');
    expect(returned).toMatch(/has met Jax before \(once\)/i);
  });

  it('addressing someone in awayFrom restores talking range', () => {
    const s = {
      ...base(),
      sceneFacts: {
        present: ['Lisle Dunmore'],
        hereSpot: {
          place: 'Blackspine Treeline',
          spot: 'a few steps back',
          turn: 120,
          nearby: [],
          awayFrom: ['Lisle Dunmore', 'Merrit Pike'],
        },
      },
    } as unknown as GameState;
    const next = engageAddressedInHereSpot(s, 'I glare at Lisle, asking if they know what those shadows are waiting for.');
    expect(next.sceneFacts?.hereSpot?.awayFrom ?? []).not.toContain('Lisle Dunmore');
    expect(next.sceneFacts?.hereSpot?.nearby ?? []).toContain('Lisle Dunmore');
  });
});

describe('T10U death book prose', () => {
  it('death fact is death sentence only — no Check failure / Extended Travel mix', () => {
    const fact =
      'Check failure. The forced march wore you down past what a body can bear. Your breath stops on the road. You are dead. Extended Travel: Constitution save d20 (7) + 5 CON save − 10 exhaustion 5 = 2 vs DC 17 — failure. On the forest path toward Blackspine Treeline. It is now night. Jax pushed on into the night.';
    const plain = writerEngineResult(fact, 'Jax');
    expect(plain).toMatch(/You are dead\./);
    expect(plain).toMatch(/forced march wore you down/i);
    expect(plain).not.toMatch(/Check failure/i);
    expect(plain).not.toMatch(/Extended Travel:/i);
    expect(plain).not.toMatch(/Jax pushed on into the night/i);
  });

  it('T10RC4: roadDeathBookProse null for combat death; march page only with travelBeat death', () => {
    const combat = {
      ...base(),
      deathSaves: { successes: 0, failures: 3, dead: true as const },
      travelBeat: undefined,
    };
    expect(roadDeathBookProse(combat)).toBeNull();
    const march = {
      ...combat,
      travelBeat: {
        turn: combat.turn ?? 0,
        facts: [
          'The forced march wore you down past what a body can bear. Your breath stops on the road. You are dead.',
        ],
      },
    };
    expect(roadDeathBookProse(march)).toMatch(/forced march/i);
  });
});
