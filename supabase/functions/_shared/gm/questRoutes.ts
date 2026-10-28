/**
 * TT-G1 + OPT-4 — redundant discovery routes on every quest step.
 *
 * Design: The Alexandrian Three Clue Rule / "Rolling to Failure" (Justin Alexander;
 * pattern only — not licensed code). Every story-dependent step has ≥3 routes in data:
 * one person, one place or object, and a mode third (tabletop check/Study; LitRPG
 * skill/system; Story RPG contact/standing). Any successful route reveals the lead;
 * a failed route never removes the others. Decision steps expand approach routes as
 * OPT-1 affordances that tick only on an engine outcome (RC-QT1).
 *
 * placeId is explicit on the step (or none). Word-match placeForStep / STEP_STOP are cut.
 */
import type { EngineMode, GameState, NpcMemory, Quest, QuestObjective, QuestRoute, QuestRouteKind } from './types.ts';
import { mainSpineQuest } from './questPlay.ts';
import { presentNpcNames } from './npcRelationships.ts';
import { presentNpcRecords, resolveNpcRecord } from './npcRecords.ts';

const PERSON: ReadonlySet<QuestRouteKind> = new Set(['person', 'contact', 'standing']);
const PLACE_OBJ: ReadonlySet<QuestRouteKind> = new Set(['place', 'object']);
const TT_THIRD: ReadonlySet<QuestRouteKind> = new Set(['check', 'study']);
const LIT_THIRD: ReadonlySet<QuestRouteKind> = new Set(['skill', 'system']);
const RPG_THIRD: ReadonlySet<QuestRouteKind> = new Set(['contact', 'standing']);

export type RouteAffordanceRow = { label: string; actionId: string; entityId: string };
export type RouteOutcome = { state: GameState; receipts: string[]; facts: string[] };
export type OpenRouteView = {
  quest: Quest;
  step: QuestObjective;
  idx: number;
  leads: string[];
  facts: string[];
  rows: RouteAffordanceRow[];
  routeByLabel: QuestRoute | null;
};

/** Explicit place for a step — never word-match (OPT-4 cut of placeForStep / STEP_STOP). */
export function placeIdForStep(step: Pick<QuestObjective, 'placeId' | 'place'>): string | null {
  const id = step.placeId ?? step.place;
  const t = (id ?? '').trim();
  return t || null;
}

/**
 * T10AA — person-route entity ("a witness who knows the lead") → a present speaker.
 * Exact name match first; else a present witness / Knowledge-goal person for generic leads.
 */
function nameMentions(text: string, name: string): boolean {
  const hay = (text ?? '').toLowerCase();
  const n = (name ?? '').toLowerCase();
  if (!hay || !n) return false;
  if (hay.includes(n)) return true;
  const parts = n.replace(/^(?:the|a|an)\s+/, '').split(/[\s'’-]+/).filter((t) => t.length >= 3);
  return parts.length >= 2 ? parts.every((p) => new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay)) : parts.some((p) => new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay));
}

export function presentPersonForRoute(
  state: GameState,
  route: QuestRoute,
): { name: string; entityId: string } | null {
  const eid = (route.entityId ?? '').trim();
  const who = eid.toLowerCase().startsWith('npc:') ? eid.slice(4).trim() : eid;
  const here = presentNpcNames(state);
  if (who) {
    for (let h = 0; h < here.length; h++) {
      const n = here[h]!;
      if (nameMentions(n, who) || nameMentions(who, n)) {
        const rec = resolveNpcRecord(state, n);
        return { name: rec?.npcName ?? n, entityId: rec?.npcId || `npc:${rec?.npcName ?? n}` };
      }
    }
  }
  const generic =
    !who ||
    /^(?:a |an |the )?witness\b/i.test(who) ||
    /\bwho knows the lead\b/i.test(who);
  if (!generic) return null;
  const records = presentNpcRecords(state);
  const score = (m: NpcMemory): number => {
    const role = `${m.roleHint ?? ''} ${m.sheet?.job ?? ''}`.toLowerCase();
    const goal = `${m.goal?.motivation ?? ''} ${m.goal?.target ?? ''}`.toLowerCase();
    let s = 0;
    if (/\bwitness\b/.test(role)) s += 3;
    if (/\bknowledge\b/.test(goal) || /what they saw/.test(goal)) s += 2;
    if ((m.completedTopics ?? []).includes('intro')) s += 1;
    return s;
  };
  let best: NpcMemory | null = null;
  let bestScore = 0;
  for (let i = 0; i < records.length; i++) {
    const m = records[i]!;
    if (!here.some((n) => nameMentions(n, m.npcName) || nameMentions(m.npcName, n))) continue;
    const sc = score(m);
    if (sc > bestScore) {
      best = m;
      bestScore = sc;
    }
  }
  if (!best && here.length === 1) {
    const n = here[0]!;
    const rec = resolveNpcRecord(state, n);
    return { name: rec?.npcName ?? n, entityId: rec?.npcId || `npc:${rec?.npcName ?? n}` };
  }
  if (!best || bestScore <= 0) return null;
  return { name: best.npcName, entityId: best.npcId || `npc:${best.npcName}` };
}

/**
 * G1-1 / OPT4-1: fail a step (or every step on a Quest) with fewer than three routes,
 * or missing the three families. PYOA is never validated here.
 */
export function validateQuestStepRoutes(
  stepOrQuest: QuestObjective | Quest,
  mode: EngineMode | undefined = 'dnd',
): string[] {
  if (mode === 'pyoa') return [];
  const asQuest = stepOrQuest as Quest;
  const steps: QuestObjective[] =
    Array.isArray(asQuest.objectives) && typeof asQuest.name === 'string'
      ? (asQuest.objectives ?? [])
      : [stepOrQuest as QuestObjective];
  const questId = Array.isArray(asQuest.objectives) && typeof asQuest.name === 'string' ? asQuest.id : '';
  const out: string[] = [];
  const third = mode === 'litrpg' ? LIT_THIRD : mode === 'rpg' ? RPG_THIRD : TT_THIRD;
  for (let s = 0; s < steps.length; s++) {
    const step = steps[s]!;
    const routes = step.routes ?? [];
    const label = step.id || step.description;
    const prefix = questId ? `${questId}: ` : '';
    if (routes.length < 3) out.push(`${prefix}step ${label}: fewer than 3 routes (${routes.length})`);
    let hasPerson = false;
    let hasPlace = false;
    let hasThird = false;
    for (let i = 0; i < routes.length; i++) {
      const k = routes[i]!.kind;
      if (PERSON.has(k)) hasPerson = true;
      if (PLACE_OBJ.has(k)) hasPlace = true;
      if (third.has(k)) hasThird = true;
    }
    if (!hasPerson) out.push(`${prefix}step ${label}: missing person/contact/standing route`);
    if (!hasPlace) out.push(`${prefix}step ${label}: missing place/object route`);
    if (!hasThird) out.push(`${prefix}step ${label}: missing mode third route`);
  }
  return out;
}

export type QuestDataSeed = {
  id: string;
  title?: string;
  name?: string;
  objectives: string[];
  objectiveAnchors?: Array<
    | {
        place?: string;
        placeId?: string | null;
        people?: string[];
        room?: string;
        verb?: string;
        object?: string;
        routes?: QuestRoute[];
      }
    | undefined
  >;
  giver?: string;
};

/**
 * OPT4-1 / G1b / OPT4m: validate every starter-quest step in mode data.
 * Never reads PYOA bibles. LitRPG/RPG play data is enriched in campaigns/index (q42-OPT4m).
 */
export function validateModeQuestData(
  mode: EngineMode,
  bibles: Array<{ id: string; engineMode?: EngineMode; starterQuests?: QuestDataSeed[] }>,
  extraSeeds: QuestDataSeed[] = [],
): string[] {
  if (mode === 'pyoa') return [];
  const out: string[] = [];
  const all: Array<{ prefix: string; seed: QuestDataSeed }> = [];
  for (let b = 0; b < bibles.length; b++) {
    const bible = bibles[b]!;
    if ((bible.engineMode ?? mode) !== mode || bible.engineMode === 'pyoa') continue;
    const quests = bible.starterQuests ?? [];
    for (let q = 0; q < quests.length; q++) all.push({ prefix: bible.id, seed: quests[q]! });
  }
  for (let q = 0; q < extraSeeds.length; q++) all.push({ prefix: 'spine', seed: extraSeeds[q]! });
  for (let i = 0; i < all.length; i++) {
    const { prefix, seed } = all[i]!;
    const steps: QuestObjective[] = [];
    for (let s = 0; s < seed.objectives.length; s++) {
      const a = seed.objectiveAnchors?.[s];
      const placeId = a?.placeId !== undefined ? a.placeId : a?.place ?? null;
      const routes: QuestRoute[] = [];
      const src = a?.routes ?? [];
      for (let r = 0; r < src.length; r++) routes.push({ ...src[r]! });
      steps.push({
        id: `${seed.id}-obj-${s + 1}`,
        description: seed.objectives[s]!,
        completed: false,
        placeId: placeId || null,
        ...(a?.place ? { place: a.place } : {}),
        ...(a?.people?.length ? { people: [...a.people] } : {}),
        ...(routes.length ? { routes } : {}),
      });
    }
    const errs = validateQuestStepRoutes(
      { id: seed.id, name: seed.title ?? seed.name ?? seed.id, objectives: steps } as Quest,
      mode,
    );
    for (let e = 0; e < errs.length; e++) out.push(`${prefix}/${errs[e]}`);
  }
  return out;
}

/**
 * Fill missing routes on a starter quest (G1b / OPT4m data enrich).
 * Three Clue Rule (The Alexandrian — pattern only). Mode third:
 * - tabletop Study — SRD 5.2.1: "When you take the Study action, you make an
 *   Intelligence check to find out information."
 * - LitRPG system/skill; Story RPG contact/standing.
 * Labels stay plain actions (chip contract §4). Never used for PYOA.
 */
export function withModeQuestRoutes<T extends QuestDataSeed>(
  seed: T,
  mode: 'dnd' | 'litrpg' | 'rpg',
): T {
  const anchors: NonNullable<QuestDataSeed['objectiveAnchors']> = [];
  for (let i = 0; i < seed.objectives.length; i++) {
    const prev = seed.objectiveAnchors?.[i] ?? {};
    const placeId = prev.placeId !== undefined ? prev.placeId : prev.place ?? null;
    if ((prev.routes?.length ?? 0) >= 3) {
      anchors.push({ ...prev, placeId: placeId ?? prev.placeId ?? null, routes: prev.routes });
      continue;
    }
    const person =
      (prev.people?.[0] ?? '').trim() || (seed.giver ?? '').trim() || 'a witness who knows the lead';
    const place = (placeId ?? '').trim() || 'the scene';
    const object = (prev.object ?? '').trim() || 'the clues here';
    const pid = `${seed.id}-s${i + 1}`;
    const placeRoute: QuestRoute = {
      id: `${pid}-place`,
      kind: prev.object ? 'object' : 'place',
      label: prev.object ? `Examine ${object}` : `Search ${place} for signs`,
      entityId: prev.object ? `object:${object}` : `place:${place}`,
      placeId: placeId ?? null,
    };
    const personRoute: QuestRoute = {
      id: `${pid}-person`,
      kind: 'person',
      label: `Ask ${person} about the lead`,
      entityId: `npc:${person}`,
    };
    // LitRPG system third is ledger chrome (Analyze / Read), never an "Ask …" talk chip —
    // talk-shaped labels trip empty-room ghost-chip when the System is not a listener.
    const third: QuestRoute =
      mode === 'litrpg'
        ? { id: `${pid}-system`, kind: 'system', label: 'Read the System trail', entityId: `system:${pid}` }
        : mode === 'rpg'
          ? {
              id: `${pid}-contact`,
              kind: 'contact',
              label: 'Call on a standing contact for the lead',
              entityId: `contact:${pid}`,
            }
          : { id: `${pid}-study`, kind: 'study', label: 'Study the clues', entityId: `study:${pid}` };
    anchors.push({ ...prev, placeId: placeId ?? null, routes: [personRoute, placeRoute, third] });
  }
  return { ...seed, objectiveAnchors: anchors };
}

/** Open main-step routes: leads, writer facts, affordance rows, optional label match. */
export function openRouteView(state: GameState, actionLabel?: string): OpenRouteView | null {
  const quest = mainSpineQuest(state);
  if (!quest || quest.status !== 'active') return null;
  const steps = quest.objectives ?? [];
  let idx = -1;
  for (let i = 0; i < steps.length; i++) {
    if (!steps[i]!.completed) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return null;
  const step = steps[idx]!;
  const routes = step.routes ?? [];
  const leads: string[] = [];
  const rows: RouteAffordanceRow[] = [];
  let routeByLabel: QuestRoute | null = null;
  const want = (actionLabel ?? '').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase();
  for (let i = 0; i < routes.length; i++) {
    const r = routes[i]!;
    // T10AA — a failed lead is spent; re-offering it loops Ask/Press/Call with no outcome.
    if (r.revealed || r.failed) continue;
    const label = (r.label ?? '').trim();
    if (!label) continue;
    leads.push(label);
    const actionId = `quest-route:${quest.id}:${step.id}:${r.id}`;
    rows.push({ label, actionId, entityId: r.entityId || actionId });
    if (want && label.replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase() === want) {
      routeByLabel = r;
    }
  }
  // T10AA — bound person chip / agenda ask naming that speaker still hits the person route.
  if (want && !routeByLabel && /^ask\b/.test(want)) {
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i]!;
      if (r.revealed || r.failed || r.kind !== 'person') continue;
      const bound = presentPersonForRoute(state, r);
      if (bound && (want.includes(bound.name.toLowerCase()) || bound.name.split(/\s+/).some((w) => w.length >= 3 && want.includes(w.toLowerCase())))) {
        routeByLabel = r;
        break;
      }
    }
  }
  const facts = leads.length ? [`Open leads (${quest.name}): ${leads.join('; ')}`] : [];
  return { quest, step, idx, leads, facts, rows, routeByLabel };
}

/**
 * Apply an engine outcome on one route. Failure marks the route failed but keeps siblings.
 * Success reveals the lead and completes the step (any route reveals).
 */
export function applyQuestRouteOutcome(
  state: GameState,
  routeId: string,
  outcome: 'success' | 'failure',
): RouteOutcome {
  const open = openRouteView(state);
  if (!open) return { state, receipts: [], facts: [] };
  const routes = open.step.routes ? open.step.routes.slice() : [];
  let idx = -1;
  for (let i = 0; i < routes.length; i++) {
    if (routes[i]!.id === routeId) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return { state, receipts: [], facts: [] };
  const route = routes[idx]!;
  if (route.revealed) return { state, receipts: [], facts: [] };

  const objectives = (open.quest.objectives ?? []).slice();
  if (outcome === 'failure') {
    routes[idx] = { ...route, failed: true };
    objectives[open.idx] = { ...open.step, routes };
    const quests = (state.quests ?? []).slice();
    for (let i = 0; i < quests.length; i++) {
      if (quests[i]!.id === open.quest.id) quests[i] = { ...quests[i]!, objectives };
    }
    const next = { ...state, quests };
    return {
      state: next,
      receipts: [`Lead failed: ${route.label} (other routes remain)`],
      facts: openRouteView(next)?.facts ?? [],
    };
  }

  routes[idx] = { ...route, revealed: true, failed: false };
  objectives[open.idx] = { ...open.step, routes, completed: true };
  let done = true;
  for (let i = 0; i < objectives.length; i++) {
    if (!objectives[i]!.completed) {
      done = false;
      break;
    }
  }
  const quests = (state.quests ?? []).slice();
  for (let i = 0; i < quests.length; i++) {
    if (quests[i]!.id !== open.quest.id) continue;
    quests[i] = { ...quests[i]!, objectives, ...(done ? { status: 'completed' as const } : {}), openLeads: [] };
  }
  const next = { ...state, quests } as GameState;
  return {
    state: next,
    receipts: [`Quest stage: ${open.quest.name} — ${open.step.description} (via ${route.label})`],
    facts: openRouteView(next)?.facts ?? [],
  };
}
