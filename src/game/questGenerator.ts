/**
 * OPT-2 — engine situation and quest generator (tabletop + LitRPG/RPG adapters).
 *
 * Structure as typed data templates after Doran and Parberry 2011
 * ("A Prototype Quest Generator Based on a Structural Analysis of Quests from Four MMORPGs"):
 * motivation → strategy → atomic steps. Cite: Doran, J. and Parberry, I., 2011.
 *
 * Tabletop hooks: The Lazy GM's Resource Document (Michael E. Shea, CC BY 4.0).
 * Stat blocks, DCs and XP rewards: SRD 5.2.1 (Wizards of the Coast LLC, CC BY 4.0).
 * SRD 5.2.1 Typical Difficulty Classes: Very easy 5, Easy 10, Medium 15, Hard 20,
 * Very hard 25, Nearly impossible 30.
 * SRD 5.2.1: "When you take the Study action, you make an Intelligence check
 * to find out information."
 *
 * LitRPG/RPG (q42-OPT2m): troubles and turning points from Datasworn CC BY 4.0 oracle
 * objects only (filter source.license). Credit: Shawn Tomkin (Ironsworn), rsek (Datasworn),
 * XenotropicDev (TheOracle). LitRPG = system quests/bounties with XP + loot; Story RPG =
 * personal favours with standing stakes. Route thirds follow OPT-4 (skill/system | contact/standing).
 */
import type { DoranMotivation, GameState, NpcMemory, Quest, QuestObjective, QuestRoute } from './types';
import type { GameEvent } from './parser';
import { validateQuestStepRoutes } from './questRoutes';
import { DC_LADDER } from './rules/exploration';
import { DND_XP_BY_CR } from './xpRules';
import { SRD_MONSTERS } from './rules/srdMonsters';
import { DATASWORN_CREDIT, dataswornSituationOracleRows } from './dataswornCharacterSeeds';
import { replayPreFeature } from './replaySeam';
import { materialiseAcceptedQuest } from './questMaterialise';

/** Open-quest floor (default 1). */
export const QUEST_FLOOR = 1;
/**
 * Spacing window (turns). q39-T1b: the TT-T1 scene planner asks for a new OPT-2 situation
 * under stall pressure; this window still caps at most one new generated quest per N turns.
 */
export const QUEST_SPACING_TURNS = 8;

export const LAZY_GM_LICENSE = 'CC BY 4.0';
export const LAZY_GM_SOURCE = {
  work: "The Lazy GM's Resource Document",
  author: 'Michael E. Shea',
  license: LAZY_GM_LICENSE,
} as const;

export type QuestStrategyId = 'deliver' | 'defeat' | 'recover' | 'investigate' | 'protect';

export type LazyGmHookRow = {
  id: string;
  text: string;
  strategy: QuestStrategyId;
  srdFoeId: string;
  dcRung: keyof typeof DC_LADDER;
  rewardCr: string;
  source: { work: string; author: string; license: string };
};

const STRATEGY_FOR: Record<DoranMotivation, QuestStrategyId> = {
  Knowledge: 'investigate',
  Comfort: 'deliver',
  Reputation: 'protect',
  Serenity: 'recover',
  Protection: 'protect',
  Conquest: 'defeat',
  Wealth: 'recover',
  Ability: 'investigate',
  Equipment: 'recover',
};

const LAZY_GM_HOOKS: LazyGmHookRow[] = [
  {
    id: 'lgm-bandit-cache',
    text: 'Bandits hid a stolen cache near the road; recover it before they move it.',
    strategy: 'recover',
    srdFoeId: 'bandit',
    dcRung: 'medium',
    rewardCr: '1/8',
    source: { ...LAZY_GM_SOURCE },
  },
  {
    id: 'lgm-goblin-raid',
    text: 'Goblin raiders threaten a nearby farmstead; drive them off.',
    strategy: 'defeat',
    srdFoeId: 'goblin-warrior',
    dcRung: 'medium',
    rewardCr: '1/4',
    source: { ...LAZY_GM_SOURCE },
  },
  {
    id: 'lgm-cult-signs',
    text: 'Strange cult signs mark a cellar door; learn what the cultists plan.',
    strategy: 'investigate',
    srdFoeId: 'cultist',
    dcRung: 'hard',
    rewardCr: '1/8',
    source: { ...LAZY_GM_SOURCE },
  },
  {
    id: 'lgm-wolf-pack',
    text: 'A wolf pack circles the trail; clear the road for travelers.',
    strategy: 'defeat',
    srdFoeId: 'wolf',
    dcRung: 'medium',
    rewardCr: '1/4',
    source: { ...LAZY_GM_SOURCE },
  },
  {
    id: 'lgm-relic-run',
    text: 'Deliver a sealed relic to a keeper before rivals claim it.',
    strategy: 'deliver',
    srdFoeId: 'bandit',
    dcRung: 'easy',
    rewardCr: '1/8',
    source: { ...LAZY_GM_SOURCE },
  },
  {
    id: 'lgm-skeleton-crypt',
    text: 'Skeletons stir in a crypt; protect the burial ground.',
    strategy: 'protect',
    srdFoeId: 'skeleton',
    dcRung: 'medium',
    rewardCr: '1/4',
    source: { ...LAZY_GM_SOURCE },
  },
];

/** Tabletop Lazy GM hook rows (each carries source + license). */
export const lazyGmHookRows: LazyGmHookRow[] = LAZY_GM_HOOKS;

/**
 * When open quests are below the floor (and spacing allows), build one quest from the record.
 * Fails closed if the G1 validator rejects the routes.
 * Tabletop: Lazy GM + SRD. LitRPG: system bounty + XP/loot. RPG: personal favour + standing stake.
 */
export function ensureQuestFloor(state: GameState): {
  state: GameState;
  quest: Quest | null;
  notes: string[];
} {
  const notes: string[] = [];
  if (state.engineMode === 'pyoa') return { state, quest: null, notes };
  // Replay bank: do not invent OPT-2 floor quests the tape never recorded (travelJourney same seam).
  if (replayPreFeature()) return { state, quest: null, notes };

  let open = 0;
  const quests = state.quests ?? [];
  for (let i = 0; i < quests.length; i++) {
    const q = quests[i]!;
    if (q.status === 'active' && q.revealed !== false) open++;
  }
  if (open >= QUEST_FLOOR) return { state, quest: null, notes };

  const turn = state.turn ?? 0;
  const last = state.questGen?.lastTurn ?? -9999;
  if (turn - last < QUEST_SPACING_TURNS && last >= 0) {
    notes.push('quest floor deferred: spacing window');
    return { state, quest: null, notes };
  }

  let patron: NpcMemory | null = null;
  const mems = state.npcMemories ?? [];
  for (let i = 0; i < mems.length; i++) {
    const m = mems[i]!;
    if (!m.goal?.motivation || !(m.npcName ?? '').trim()) continue;
    if (m.roleHint === 'quest-patron' || m.need) {
      patron = m;
      break;
    }
    if (!patron) patron = m;
  }
  if (!patron) {
    notes.push('quest floor deferred: no patron with goal');
    return { state, quest: null, notes };
  }

  const mode = state.engineMode === 'litrpg' ? 'litrpg' : state.engineMode === 'rpg' ? 'rpg' : 'dnd';
  const motivation = patron.goal!.motivation;
  const strategy = STRATEGY_FOR[motivation] ?? 'investigate';
  // Place fields (location / leadsTo / placeId) bind only to the scene record — never to a
  // free-form goal topic (bible hooks like "Explain the Pact" are concerns, not places).
  const place =
    (state.currentLocation ?? '').trim() || (patron.location ?? '').trim() || 'the local road';
  const giver = (patron.npcName ?? 'patron').trim();
  const topic = (patron.goal?.target ?? '').trim();
  let deliverDest = place;
  if (topic && (topic === place || topic === (patron.location ?? '').trim())) {
    deliverDest = topic;
  } else if (topic) {
    const places = state.places ?? [];
    for (let i = 0; i < places.length; i++) {
      const n = (places[i]!.name ?? '').trim();
      if (n && (n === topic || n.toLowerCase() === topic.toLowerCase())) {
        deliverDest = n;
        break;
      }
    }
  }
  const target = strategy === 'deliver' ? deliverDest : place;

  let hookText = '';
  let questId = '';
  let foe = 'foe';
  let provenance = '';
  let name = `${giver}'s charge`;
  let rewards: Quest['rewards'];

  if (mode === 'dnd') {
    let hook = LAZY_GM_HOOKS[turn % LAZY_GM_HOOKS.length]!;
    for (let i = 0; i < LAZY_GM_HOOKS.length; i++) {
      if (LAZY_GM_HOOKS[i]!.strategy === strategy) {
        hook = LAZY_GM_HOOKS[i]!;
        break;
      }
    }
    for (let i = 0; i < SRD_MONSTERS.length; i++) {
      if (SRD_MONSTERS[i]!.id === hook.srdFoeId) {
        foe = SRD_MONSTERS[i]!.name;
        break;
      }
    }
    const dc = DC_LADDER[hook.dcRung];
    const xp = DND_XP_BY_CR[hook.rewardCr] ?? 25;
    hookText = hook.text;
    questId = `gen-${hook.id}-${turn}`;
    rewards = { xp, gold: Math.max(1, Math.floor(xp / 10)) };
    provenance = `OPT-2 generated; ${hook.source.work} (${hook.source.license}); SRD DC ${dc}; SRD foe ${hook.srdFoeId}; CR ${hook.rewardCr}`;
  } else {
    const sit = dataswornSituationOracleRows();
    const troubles: typeof sit = [];
    const turns: typeof sit = [];
    for (let i = 0; i < sit.length; i++) {
      if (sit[i]!.table === 'trouble') troubles.push(sit[i]!);
      else if (sit[i]!.table === 'turningPoint') turns.push(sit[i]!);
    }
    if (!troubles.length || !turns.length) {
      notes.push('quest floor deferred: no Datasworn CC BY situation rows');
      return { state, quest: null, notes };
    }
    const trouble = troubles[turn % troubles.length]!;
    const turning = turns[(turn + 3) % turns.length]!;
    hookText = `${trouble.text}; turning point: ${turning.text}`;
    foe = trouble.text;
    questId = `gen-ds-${trouble.table}-${turn}`;
    if (mode === 'litrpg') {
      name = `System bounty: ${trouble.text}`;
      const xp = 40 + (turn % 5) * 10;
      rewards = {
        xp,
        items: [`System cache: ${turning.text}`],
        gold: Math.max(5, Math.floor(xp / 8)),
      };
      provenance = `OPT-2m LitRPG system bounty; Datasworn (${DATASWORN_CREDIT}); trouble "${trouble.text}"; turning point "${turning.text}"`;
    } else {
      name = `${giver}'s favour`;
      const faction =
        (state.worldLedger?.factionStandings?.[0]?.name ?? '').trim() ||
        `${giver}'s circle`;
      rewards = {
        standingStake: {
          faction,
          delta: 1,
          note: `Favour for ${giver}: ${trouble.text}`,
        },
      };
      provenance = `OPT-2m RPG personal favour; Datasworn (${DATASWORN_CREDIT}); trouble "${trouble.text}"; turning point "${turning.text}"; standing stake → ${faction}`;
    }
  }

  // Three routes per step — G1 / OPT-4. Mode third: Study (SRD) | skill/system | contact/standing.
  const routeSets: QuestRoute[][] = [];
  const objectLabels =
    strategy === 'deliver'
      ? (['the sealed package', 'the road signs', 'the delivery mark'] as const)
      : strategy === 'defeat' || strategy === 'protect'
        ? (['the threat signs', `the ${foe}`, 'the report'] as const)
        : strategy === 'recover'
          ? (['the missing goods', 'the cache trail', 'the recovered goods'] as const)
          : (['the rumor', 'the signs', 'the proof'] as const);
  const placeForStep = [place, place, strategy === 'deliver' ? target : place];
  for (let s = 0; s < 3; s++) {
    const pid = `${questId}-s${s + 1}`;
    const placeFor = placeForStep[s]!;
    const third: QuestRoute =
      mode === 'litrpg'
        ? s % 2 === 0
          ? { id: `${pid}-skill`, kind: 'skill', label: `Read the signs of ${objectLabels[s]}`, entityId: `skill:${pid}` }
          : { id: `${pid}-system`, kind: 'system', label: `Analyze ${objectLabels[s]}`, entityId: `system:${pid}` }
        : mode === 'rpg'
          ? s % 2 === 0
            ? {
                id: `${pid}-standing`,
                kind: 'standing',
                label: `Press your standing with ${giver}`,
                entityId: `standing:${giver}`,
              }
            : {
                id: `${pid}-contact`,
                kind: 'contact',
                label: `Call on ${giver} for the approach`,
                entityId: `contact:${giver}`,
              }
          : { id: `${pid}-study`, kind: 'study', label: `Study ${objectLabels[s]}`, entityId: `study:${pid}` };
    routeSets.push([
      { id: `${pid}-person`, kind: 'person', label: `Ask ${giver} about the lead`, entityId: `npc:${giver}` },
      {
        id: `${pid}-place`,
        kind: 'place',
        label: `Search ${placeFor} for signs`,
        entityId: `place:${placeFor}`,
        placeId: placeFor,
      },
      third,
    ]);
  }

  const concern = topic || 'their charge';
  const stepText =
    strategy === 'deliver'
      ? [`Take the package from ${giver}`, `Carry it safely past ${foe} country`, `Hand it over at ${target}`]
      : strategy === 'defeat' || strategy === 'protect'
        ? [`Learn where the ${foe} threatens ${place}`, `Confront the ${foe}`, `Report back to ${giver}`]
        : strategy === 'recover'
          ? [`Ask ${giver} what was taken`, `Track the cache past the ${foe}`, `Return the goods to ${giver}`]
          : [`Hear ${giver}'s concern (${concern})`, `Study the signs at ${place}`, `Bring proof to ${giver}`];

  const objectives: QuestObjective[] = [];
  for (let s = 0; s < 3; s++) {
    objectives.push({
      id: `${questId}-obj-${s + 1}`,
      description: stepText[s]!,
      completed: false,
      placeId: placeForStep[s]!,
      people: s === 1 && (strategy === 'defeat' || strategy === 'protect' || strategy === 'recover') ? undefined : [giver],
      routes: routeSets[s],
    });
  }

  const quest: Quest = {
    id: questId,
    name,
    description: `${hookText} (for ${giver}: ${motivation} → ${topic || place})`,
    status: 'active',
    type: 'side',
    giver,
    location: place,
    leadsTo: place,
    revealed: true,
    revealedTurn: turn,
    activatedTurn: turn,
    minTurnsBeforeComplete: 1,
    objectives,
    rewards,
    provenance,
    whatNext: objectives[0]?.description,
  };

  const errs = validateQuestStepRoutes(quest, mode);
  if (errs.length) {
    notes.push(`quest floor rejected by G1: ${errs[0]}`);
    return { state, quest: null, notes };
  }

  const nextQuests = quests.slice();
  nextQuests.push(quest);
  notes.push(`quest generated: ${quest.id}`);
  // q67-LITPACE: materialise place/NPC/object for every objective at acceptance.
  const accepted = materialiseAcceptedQuest(
    {
      ...state,
      quests: nextQuests,
      questGen: { lastTurn: turn, unboundLog: state.questGen?.unboundLog ?? [] },
    },
    quest,
  );
  if (accepted.error) {
    notes.push(`quest materialise failed: ${accepted.error}`);
    return { state, quest: null, notes };
  }
  return {
    state: accepted.state,
    quest: accepted.quest,
    notes,
  };
}

/**
 * Writer `<quest-add>` is a proposal: keep only when it binds to a generated quest
 * (same giver and target); otherwise drop and log `unbound quest`.
 */
export function applyQuestAddProposals(
  events: GameEvent[],
  state: GameState,
): { events: GameEvent[]; notes: string[]; state: GameState } {
  const notes: string[] = [];
  const out: GameEvent[] = [];
  const generated: Quest[] = [];
  const quests = state.quests ?? [];
  for (let i = 0; i < quests.length; i++) {
    const q = quests[i]!;
    if (typeof q.id === 'string' && q.id.startsWith('gen-')) generated.push(q);
  }

  const unboundLog = (state.questGen?.unboundLog ?? []).slice();
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    if (e.type !== 'quest-add') {
      out.push(e);
      continue;
    }
    const blob = `${e.id ?? ''} ${e.name ?? ''} ${e.description ?? ''}`.toLowerCase();
    let bound: Quest | null = null;
    for (let g = 0; g < generated.length; g++) {
      const q = generated[g]!;
      const giver = (q.giver ?? '').trim().toLowerCase();
      if (e.id && e.id === q.id) {
        bound = q;
        break;
      }
      if (giver && blob.includes(giver)) {
        bound = q;
        break;
      }
    }
    if (!bound) {
      notes.push('unbound quest');
      unboundLog.push(`turn ${state.turn ?? 0}: ${e.name ?? e.id ?? '?'}`);
      continue;
    }
    out.push({
      ...e,
      id: bound.id,
      name: e.name || bound.name,
      description: e.description || bound.description,
      questType: e.questType ?? bound.type,
    });
    notes.push(`quest-add bound: ${bound.id}`);
  }

  return {
    events: out,
    notes,
    state: {
      ...state,
      questGen: {
        lastTurn: state.questGen?.lastTurn ?? -1,
        unboundLog,
      },
    },
  };
}
