/**
 * T10AB — T300 cursed-keep s9201: Read-chip spam, collar/blade threat outcomes, tavern-song madlib.
 * Exact inputs from runs 2026-10-28T12-42-50 / 13-20-34.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { collectSceneAffordances, stampRecentOfferedActions, affordancePickedInScene } from './sceneAffordances';
import { checkForAction, resolveCheckContext } from './checkMath';
import { parsePlayerIntent, parsePlayerSteps, sheetContextFromState } from './intentParser';
import { resolveTypedFreeText } from './typedFreeText';
import { scrubEntityMadLibs } from './proseWarden';
import { scanReadabilityViolations } from './readabilityGate';

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

function church(over: Partial<GameState> = {}): GameState {
  const edda = mem({
    npcName: 'Edda Coyne',
    npcId: 'town-edda-coyne',
    location: 'Greyhollow Church',
    goal: { motivation: 'Knowledge', target: 'a secret worth selling' },
    need: 'a buyer who pays',
  });
  const silas = mem({
    npcName: 'Silas Thorne',
    npcId: 'giver-silas-thorne',
    location: 'Greyhollow Church',
  });
  const oda = mem({
    npcName: 'Oda Thatch',
    npcId: 'town-oda-thatch',
    location: 'Greyhollow Church',
  });
  return {
    ...(createInitialState(undefined, 'dnd') as GameState),
    engineMode: 'dnd',
    character: {
      name: 'Jax',
      hp: 10,
      maxHp: 10,
      level: 1,
      xp: 0,
      attributes: { STR: 12, DEX: 12, CON: 12, INT: 10, WIS: 14, CHA: 10 },
      srd: {
        speciesId: 'human',
        classId: 'fighter',
        backgroundId: 'soldier',
        skillProfs: ['Insight', 'Athletics'],
        expertise: [],
      },
    },
    turn: 170,
    currentLocation: 'Greyhollow Church',
    sceneFacts: {
      crowd: 'sparse',
      noise: 'quiet',
      present: ['Edda Coyne', 'Silas Thorne', 'Oda Thatch'],
      props: [],
      lastBeat: '',
      updatedTurn: 170,
    },
    npcMemories: [edda, silas, oda],
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

describe('T10AB Read / Insight chips', () => {
  it('Read Edda Coyne is Wisdom (Insight), not General athletics', () => {
    const s = church();
    const label = 'Read Edda Coyne';
    const intent = parsePlayerIntent(label, s);
    const ctx = resolveCheckContext(s, intent, label);
    expect(ctx.label).toMatch(/Insight/i);
    expect(ctx.attr).toBe('WIS');
    expect(ctx.skill).toBe('insight');
    const spec = checkForAction(s, intent, label);
    expect(spec?.ability).toBe('WIS');
  });

  it('after Read is picked in-scene, Read chip is not re-offered', () => {
    let s = church();
    const insightId = 'person:town-edda-coyne:insight';
    expect(collectSceneAffordances(s).some((a) => a.actionId === insightId)).toBe(true);
    s = stampRecentOfferedActions(
      s,
      [insightId, 'person:town-edda-coyne:talk', 'exit:ck-hub-inn:travel'],
      insightId,
    );
    expect(affordancePickedInScene(s, insightId)).toBe(true);
    const labels = collectSceneAffordances(s).map((a) => a.label);
    expect(labels).not.toContain('Read Edda Coyne');
    // Agenda also retires after pick so Ask-about cannot spam the same non-outcome.
    const agendaId = 'person:town-edda-coyne:agenda';
    s = stampRecentOfferedActions(s, [agendaId], agendaId);
    expect(collectSceneAffordances(s).some((a) => a.actionId === agendaId)).toBe(false);
  });
});

describe('T10AB collar / blade threat (s9201 resume T207–T215)', () => {
  it('grab collar resolves Athletics grapple + Intimidation and commits Influence outcome', () => {
    const s = church({
      currentLocation: 'Greyhollow Inn',
      sceneFacts: {
        crowd: 'sparse',
        noise: 'quiet',
        present: ['Silas Thorne', 'the innkeep'],
        props: ['copper'],
        lastBeat: '',
        updatedTurn: 207,
      },
      npcMemories: [
        mem({ npcName: 'Silas Thorne', npcId: 'giver-silas-thorne', location: 'Greyhollow Inn' }),
        mem({
          npcName: 'the innkeep',
          npcId: 'role:greyhollow-inn:innkeep',
          location: 'Greyhollow Inn',
          roleHint: 'innkeep',
        }),
      ],
    });
    const line =
      'I slam my hand onto the table to cut off Silas\'s escape and grab his collar. "Spill it now, Thorne, or I swear I\'ll break your fingers."';
    const ctx = sheetContextFromState(s);
    const read = parsePlayerSteps(line, ctx);
    // Diagnostic: slam/cut-off → intimidate; grab collar stays take+person (T10X) then resolves grapple.
    expect(read.steps.map((st) => `${st.action}:${st.addressee ?? st.target ?? ''}`).join('|')).toMatch(
      /(intimidate|take):.*Silas/i,
    );
    // Avoid incomplete SRD sheet → deriveTabletopSheet crash on leftover observe/other clauses.
    const bare = {
      ...s,
      character: { ...s.character!, srd: undefined },
    } as GameState;
    const out = resolveTypedFreeText(bare, line);
    const blob = `${out.engineResult} ${(out.facts ?? []).join(' ')}`;
    expect(blob).toMatch(/Grapple|Athletics|Intimidation|grappled|threat/i);
    // T10RC1 — Influence commits yield (stay hostile) or refuse+leave; never an open bargain slot.
    expect(blob).toMatch(/Must narrate:.*(?:yields under the threat|refuses the threat and leaves)/i);
    // T10Q2fix — compound intimidate|take must not re-roll into both yield and refuse.
    const eng = out.engineResult ?? '';
    const hasYield = /yields under the threat/i.test(eng);
    const hasRefuse = /refuses the threat and leaves/i.test(eng);
    expect(Number(hasYield) + Number(hasRefuse)).toBe(1);
    expect(blob).not.toMatch(/NPC reaction slot open/i);
    const next = out.state ?? s;
    const silas = (next.npcMemories ?? []).find((m) => /Silas/i.test(m.npcName));
    expect(silas?.disposition === 'hostile' || silas?.attitude === 'hostile').toBe(true);
    if (/refuses the threat and leaves/i.test(blob)) {
      expect((next.sceneFacts?.present ?? []).some((p) => /Silas/i.test(p))).toBe(false);
    } else {
      expect((next.sceneFacts?.present ?? []).some((p) => /Silas/i.test(p))).toBe(true);
    }
  });

  it('blade to throat at present Silas is intimidate/grapple, not empty General', () => {
    const s = church({
      currentLocation: 'Greyhollow Inn',
      sceneFacts: {
        crowd: 'sparse',
        noise: 'voices',
        present: ['Silas Thorne', 'the innkeep'],
        props: [],
        lastBeat: '',
        updatedTurn: 211,
      },
      npcMemories: [
        mem({
          npcName: 'Silas Thorne',
          npcId: 'giver-silas-thorne',
          location: 'Greyhollow Inn',
          disposition: 'hostile',
          attitude: 'hostile',
          present: true,
        }),
      ],
    });
    const line =
      'I drive the flat of my blade into Silas\'s throat to pin him against the wall. "Talk before I start cutting, Thorne."';
    const ctx = sheetContextFromState(s);
    const read = parsePlayerSteps(line, ctx);
    expect(read.steps.some((st) => st.action === 'intimidate' || st.action === 'attack')).toBe(true);
    const out = resolveTypedFreeText(s, line);
    expect(out.engineResult).toMatch(/Grapple|Athletics|Intimidation|threat|grappled/i);
    expect(out.engineResult).not.toMatch(/No one present to answer/i);
  });
});

describe('T10AB entity-madlib T14 (tavern song)', () => {
  it('lowercase tavern song is not scrubbed into waystation song', () => {
    const prose =
      'Jax began to hum the tune from the tavern song, watching Silas Thorne closely the whole time. Silas gave no sign at all that he heard the humming, and his face stayed exactly as it was.';
    const scrubbed = scrubEntityMadLibs(prose);
    expect(scrubbed).toMatch(/tavern song/i);
    expect(scrubbed).not.toMatch(/waystation song/i);
    // Title-Case Tavern-as-place madlib still rewrites.
    expect(scrubEntityMadLibs('You walk from the Tavern.')).toMatch(/waystation/i);
  });

  it('readability gate does not flag the tavern-song beat as entity-madlib', () => {
    const s = church({
      log: [
        {
          id: 'gm-14',
          role: 'gm',
          turn: 14,
          content:
            'Jax began to hum the tune from the tavern song, watching Silas Thorne closely the whole time. Silas gave no sign at all that he heard the humming.',
          timestamp: 1,
        },
      ],
    });
    const hits = scanReadabilityViolations(s).filter((v) => v.kind === 'entity-madlib');
    expect(hits).toHaveLength(0);
  });
});
