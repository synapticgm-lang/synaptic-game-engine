/**
 * M7 / Order 8 — two companions with distinct seeds for offline tests.
 * Being a companion is a relationship row; each person keeps their own agenda + persona.
 */
import { createInitialState } from '../defaults';
import type { Companion, GameState, NpcMemory } from '../types';
import { ensureCompanionPerson, migrateCompanionPeople } from '../companionAgency';
import { ensureNpcAgenda } from '../npcMemory';
import type { KeyMoment, NpcMemoryLedger } from '../npcMemoryLedger';

export type CompanionAgendaView = {
  id: string;
  name: string;
  agenda: {
    motivation: string;
    target: string;
    traits: string[];
    need?: string;
    offer?: string;
  };
};

export type CompanionFixtureOpts = {
  stance?: 'hostile' | 'friendly' | 'wary';
  disagreesWithTravel?: boolean;
  playerActAtTurn?: number;
  inFight?: boolean;
};

function partyRow(id: string, name: string): Companion {
  return {
    id,
    name,
    type: 'party',
    role: 'guide companion',
    hp: 12,
    maxHp: 12,
    maintenanceCost: 'none',
    assignment: 'At your side',
    notes: `${name} travels by consent.`,
    sidekick: 'warrior',
    ac: 14,
    level: 1,
    recruited: true,
    approvalWarnings: 0,
  };
}

function person(
  id: string,
  name: string,
  role: string,
  place: string,
  over: Partial<NpcMemory> = {},
): NpcMemory {
  return {
    npcId: id,
    npcName: name,
    disposition: 'friendly',
    facts: [`Seen in play at ${place}`],
    lastSeenTurn: 0,
    roleHint: role,
    location: place,
    met: true,
    present: true,
    sheet: {
      job: role,
      motive: `${name}'s own work`,
      fear: 'being used',
      speech: 'plain',
      secret: '',
      place,
    },
    ...over,
  };
}

function agendaView(m: NpcMemory): CompanionAgendaView {
  return {
    id: m.npcId,
    name: m.npcName,
    agenda: {
      motivation: m.goal?.motivation ?? '',
      target: m.goal?.target ?? '',
      traits: [...(m.traits ?? [])],
      need: m.need,
      offer: m.offer,
    },
  };
}

function withNpcRecords(state: GameState): GameState & { npcRecords: Record<string, NpcMemory> } {
  const npcRecords: Record<string, NpcMemory> = {};
  for (const m of state.npcMemories ?? []) npcRecords[m.npcId] = m;
  return Object.assign(state, { npcRecords });
}

export function companionFixture(opts: CompanionFixtureOpts = {}): {
  a: CompanionAgendaView;
  b: CompanionAgendaView;
  state: GameState & { npcRecords: Record<string, NpcMemory> };
  stateAfter10?: GameState;
  fightState?: GameState;
} {
  const place = 'Inn';
  let state = createInitialState('M7-companions', 'rpg', undefined, 'm7-companion-seed');
  state.currentLocation = place;
  state.engineMode = 'rpg';
  state.turn = 1;

  let mara = person('npc-mara', 'Mara', 'guide', place);
  let bram = person('npc-bram', 'Bram Holt', 'artisan', place);
  mara = ensureNpcAgenda(mara, { role: 'guide', disposition: 'friendly', seed: state.seed });
  bram = ensureNpcAgenda(bram, { role: 'artisan', disposition: 'friendly', seed: state.seed });
  // Distinct personal agendas (not the retired Protection/the party/loyal shared default).
  mara = ensureCompanionPerson(state, {
    ...mara,
    goal: { motivation: 'Knowledge', target: 'a relic they once swore to find' },
    need: 'a say in where the party goes',
    offer: 'quiet counsel',
    traits: ['curious', 'exacting'],
    speechRegister: 'plain',
    attitude: 'friendly',
  });
  bram = ensureCompanionPerson(state, {
    ...bram,
    goal: { motivation: 'Wealth', target: 'coin enough to start over' },
    need: 'time to work their own plan',
    offer: 'their skill on the road',
    traits: ['shrewd', 'quiet'],
    speechRegister: 'prices-first',
    attitude: 'indifferent',
  });

  if (opts.stance === 'hostile' || opts.disagreesWithTravel) {
    mara = {
      ...mara,
      disposition: 'hostile',
      attitude: 'hostile',
      stance: { now: 'hostile', cause: 'the player ordered them like a tool', turn: 1, events: ['order-as-tool'] },
      persona: {
        traits: {
          openness: 40,
          conscientiousness: 50,
          extraversion: 40,
          agreeableness: 20,
          neuroticism: 60,
          honesty: 50,
          pride: 70,
          greed: 40,
        },
        traits0: {
          openness: 40,
          conscientiousness: 50,
          extraversion: 40,
          agreeableness: 20,
          neuroticism: 60,
          honesty: 50,
          pride: 70,
          greed: 40,
        },
        rel: { trust: -40, fondness: -35, fear: 10 },
        history: [],
      },
    };
  }

  state.companions = [partyRow('companion-mara', 'Mara'), partyRow('companion-bram', 'Bram Holt')];
  state.npcMemories = [mara, bram];
  state.sceneFacts = {
    crowd: 'sparse',
    noise: 'unknown',
    present: ['Mara', 'Bram Holt'],
    props: [],
    lastBeat: '',
    updatedTurn: 0,
  };
  state = migrateCompanionPeople(state);
  if (opts.stance === 'hostile' || opts.disagreesWithTravel) {
    state.npcMemories = (state.npcMemories ?? []).map((m) =>
      m.npcId === 'npc-mara'
        ? {
            ...m,
            disposition: 'hostile' as const,
            attitude: 'hostile' as const,
            stance: { now: 'hostile' as const, cause: 'the player ordered them like a tool', turn: 1, events: ['order-as-tool'] },
            persona: {
              ...(m.persona ?? mara.persona!),
              rel: { trust: -40, fondness: -35, fear: 10 },
            },
          }
        : m,
    );
  }

  const out: {
    a: CompanionAgendaView;
    b: CompanionAgendaView;
    state: GameState & { npcRecords: Record<string, NpcMemory> };
    stateAfter10?: GameState;
    fightState?: GameState;
  } = {
    a: agendaView((state.npcMemories ?? []).find((m) => m.npcId === 'npc-mara')!),
    b: agendaView((state.npcMemories ?? []).find((m) => m.npcId === 'npc-bram')!),
    state: withNpcRecords(state),
  };

  if (opts.playerActAtTurn != null) {
    const turn = opts.playerActAtTurn;
    const moment: KeyMoment = {
      id: 'km-mara-favor-t3',
      npcId: 'npc-mara',
      actorId: 'npc-mara',
      turn,
      category: 'favor',
      summary: 'Player promised Mara a share of the find',
      retention: 'campaign',
    };
    const ledger: NpcMemoryLedger = {
      npcId: 'npc-mara',
      keyMoments: [],
      memories: [moment],
      lastUpdated: turn + 10,
      dedupeKeys: [],
    };
    out.stateAfter10 = {
      ...state,
      turn: turn + 10,
      arcDirector: {
        ...(state.arcDirector ?? {}),
        npcMemories: [ledger],
      },
    };
  }

  if (opts.inFight) {
    out.fightState = {
      ...state,
      engineMode: 'dnd',
      character: {
        ...state.character,
        name: state.character?.name || 'Jax',
        hp: 12,
        maxHp: 12,
        xp: state.character?.xp ?? 0,
        level: state.character?.level ?? 1,
      },
      inventory: [
        {
          id: 'i1',
          name: 'Longsword',
          rarity: 'Common',
          equipped: true,
          quantity: 1,
          slot: 'main-hand',
        },
      ],
      activeEncounter: {
        name: 'Bandit',
        level: 1,
        hp: 11,
        maxHp: 11,
        armorClass: 12,
        strength: 11,
        dexterity: 12,
        constitution: 12,
        xpReward: 25,
        goldReward: 5,
        cr: '1/8',
        phase: 'engaged',
        encounterId: 'bandit-1',
      },
      roundCombat: {
        encounterName: 'Bandit',
        round: 1,
        pcInitiative: 20,
        foes: [{ id: 'f1', name: 'Bandit 1', blockId: 'bandit', hp: 11, maxHp: 11, initiative: 5, conditions: [] }],
        pcConditions: [],
        pcEconomy: { actionAvailable: true, bonusAvailable: true, movementFt: 30, reactionAvailable: true },
      },
    };
  }

  return out;
}
