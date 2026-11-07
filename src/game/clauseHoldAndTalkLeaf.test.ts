/**
 * Fail-closed clause check, and one talk leaf for the client and the edge.
 * Model calls are stubs. No paid inference.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  bookBodyAfterWriterMiss,
  buildCompletedEventPacket,
  formatWriterFacingEvent,
  pageWhenClauseWithheld,
} from './completedEventPacket';
import {
  checkAndRepairProse,
  makeGmClauseChat,
  storyAfterClauseCheck,
  type ClauseCheckChat,
} from './clauseCheck';
import type { FactSheet } from './factSheet';
import { buildContextPrompt } from './systemPrompt';
import { formatTalkWriterFacing } from './talkEnvelope';
import { prepareWriterInputWithTownsfolk } from './townsfolk';
import type { GameState, NpcMemory } from './types';

const DRAFT = 'A dragon named DRAFT_MARKER_9f3c lands and hands you the vault key.';
const SECRET = 'VAULT-SECRET-9f3c';

function sheet(): FactSheet {
  return {
    turn: 4,
    place: { name: 'Harbor hold', exits: ['street'], features: ['lamp'] },
    present: [{ name: 'Mira' }],
    openLedger: [],
    gear: { worn: ['clothes'], carrying: [], inHand: 'nothing' },
    beat: { verb: 'spoke', outcome: 'spoke', engineResult: 'Mira heard you.', steps: [] },
    player: { typed: 'hello Mira', claimsNotTrue: [] },
    quests: [],
    recent: [],
    settingsSlot: null,
  };
}

function baseState(): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    seed: 'clause-leaf',
    currentLocation: 'Harbor hold',
    character: { ...base.character, name: 'Jax', hp: 8, maxHp: 12, xp: 40 },
    turn: 4,
    gold: 3,
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax', where: 'Harbor hold' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
    },
    sceneFacts: { ...emptySceneFacts(4), present: ['Mira'] },
    npcMemories: [
      {
        npcId: 'mira',
        npcName: 'Mira',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 4,
        location: 'Harbor hold',
        sheet: { job: 'apothecary', motive: 'keep the lamp', fear: 'the dark', speech: 'short', secret: SECRET },
      } as unknown as NpcMemory,
    ],
  };
}

describe('clause check fail-closed', () => {
  it('a thrown check does not return the writer draft and does not call repair', async () => {
    let checks = 0;
    let repairs = 0;
    const out = await checkAndRepairProse({
      factSheet: sheet(),
      prose: DRAFT,
      player: sheet().player,
      chat: async () => {
        checks += 1;
        throw new Error('network down');
      },
      repair: async () => {
        repairs += 1;
        return 'replaced';
      },
    });
    expect(checks).toBe(1);
    expect(repairs).toBe(0);
    expect(out.withheld).toBe(true);
    expect(out.prose).not.toContain('DRAFT_MARKER_9f3c');
  });

  it('an empty claim list is not a pass', async () => {
    const chat: ClauseCheckChat = async () => ({ claims: [] });
    const out = await checkAndRepairProse({
      factSheet: sheet(),
      prose: DRAFT,
      player: sheet().player,
      chat,
    });
    expect(out.withheld).toBe(true);
    expect(out.prose).not.toContain('DRAFT_MARKER_9f3c');
  });

  it('invalid checker text is not a pass', async () => {
    const out = await checkAndRepairProse({
      factSheet: sheet(),
      prose: DRAFT,
      player: sheet().player,
      chat: makeGmClauseChat(async () => 'not json at all'),
    });
    expect(out.withheld).toBe(true);
    expect(out.prose).not.toContain('DRAFT_MARKER_9f3c');
  });

  it('a real colour-and-fact verdict still publishes the draft', async () => {
    const prose = 'Mira answers you. The lamp stays lit.';
    const out = await checkAndRepairProse({
      factSheet: sheet(),
      prose,
      player: sheet().player,
      chat: async () => ({
        claims: [
          { c: 'Mira answers you', kind: 'fact', support: 'Present: Mira' },
          { c: 'The lamp stays lit', kind: 'colour', support: '' },
        ],
      }),
    });
    expect(out.withheld).toBe(false);
    expect(out.prose).toBe(prose);
  });

  it('publishing uses the engine page, never the draft, and a second call does not move HP, XP, or gold', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'hello Mira');
    const before = { hp: state.character.hp, xp: state.character.xp, gold: state.gold, inv: state.inventory?.length };
    const page = pageWhenClauseWithheld(state, packet, 'hello Mira');
    const again = pageWhenClauseWithheld(state, packet, 'hello Mira');
    expect(again).toBe(page);
    expect(page).not.toContain('DRAFT_MARKER_9f3c');
    expect(page.trim().length).toBeGreaterThan(0);
    expect(state.character.hp).toBe(before.hp);
    expect(state.character.xp).toBe(before.xp);
    expect(state.gold).toBe(before.gold);
    expect(state.inventory?.length).toBe(before.inv);
    const published = storyAfterClauseCheck({
      clause: { withheld: true, prose: DRAFT, records: [], repaired: false, serious0: [], checkPasses: 1 },
      enginePage: page,
      draft: DRAFT,
    });
    expect(published.withheld).toBe(true);
    expect(published.text).toBe(page);
    expect(published.text).not.toContain('DRAFT_MARKER_9f3c');
    const missed = bookBodyAfterWriterMiss(state, packet, 'hello Mira', '');
    expect(missed.prose).not.toContain('DRAFT_MARKER_9f3c');
  });
});

describe('client and edge writer leaf', () => {
  it('talk, look, and travel leaves match, and the NPC secret stays off both', () => {
    const state = baseState();
    const talk = prepareWriterInputWithTownsfolk(state, 'Tell Mira the lamp is out', { xp: 0, engineResult: 'Mira heard you.' });
    const look = prepareWriterInputWithTownsfolk(state, 'Look around', { xp: 0, engineResult: 'You stayed.' });
    const travel = prepareWriterInputWithTownsfolk(state, 'Travel toward the street', { xp: 0, engineResult: 'You set out.' });

    for (const prepared of [talk, look, travel]) {
      const edge = buildContextPrompt(prepared.state, prepared.packet.playerAction);
      const client = formatTalkWriterFacing(prepared.packet, prepared.state);
      expect(edge).toBe(client);
      expect(edge).not.toContain(SECRET);
      expect(client).not.toContain(SECRET);
    }
    expect(talk.packet.outcome === 'spoke' || talk.packet.verb === 'spoke').toBe(true);
    expect(buildContextPrompt(talk.state, talk.packet.playerAction)).toContain('PLAYER SAID:');
    expect(buildContextPrompt(talk.state, talk.packet.playerAction)).toContain('ADDRESSEE:');
    expect(buildContextPrompt(look.state, look.packet.playerAction)).not.toMatch(/^TALK:/);
    expect(buildContextPrompt(travel.state, travel.packet.playerAction)).not.toMatch(/^TALK:/);
  });

  it('the edge formatter prints the packet talk context and does not rebuild a second envelope', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'Tell Mira the lamp is out');
    const stamped = { ...packet, talkContext: 'TALK:\nPLAYER SAID: Tell Mira the lamp is out\nADDRESSEE: Mira' };
    const edge = formatWriterFacingEvent(stamped);
    expect(edge.startsWith('TALK:\nPLAYER SAID: Tell Mira the lamp is out\nADDRESSEE: Mira')).toBe(true);
    expect(edge.match(/PLAYER SAID:/g)?.length).toBe(1);
    const hosted = buildContextPrompt({ ...state, completedEvent: stamped }, 'ignored raw line');
    expect(hosted).toBe(formatWriterFacingEvent(stamped));
    expect(hosted).toContain('PLAYER SAID: Tell Mira the lamp is out');
    expect(hosted).not.toContain('ignored raw line');
  });
});
