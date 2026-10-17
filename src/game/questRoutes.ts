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
import type { EngineMode, GameState, Quest, QuestObjective, QuestRoute, QuestRouteKind } from './types';
import { mainSpineQuest } from './questPlay';

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
    if (r.revealed) continue;
    const label = (r.label ?? '').trim();
    if (!label) continue;
    leads.push(label);
    const actionId = `quest-route:${quest.id}:${step.id}:${r.id}`;
    rows.push({ label, actionId, entityId: r.entityId || actionId });
    if (want && label.replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase() === want) {
      routeByLabel = r;
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
