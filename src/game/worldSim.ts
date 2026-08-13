import type { PlayerIntent } from './intentParser';
import type { GameEvent } from './parser';
import type {
  DealRisk,
  HoldingKind,
  HoldingOrder,
  WorkEthic,
  WorldActor,
  WorldClock,
  WorldDeal,
  WorldHolding,
  WorldHostile,
  WorldLedger,
} from './types';

const DAYS_PER_WEEK = 7;

export function emptyWorldLedger(): WorldLedger {
  return {
    clock: { day: 0, week: 0 },
    caravans: [],
    deals: [],
    holdings: [],
    hostiles: [],
    actors: [],
    pendingHiddenEvents: [],
  };
}

export function normalizeWorldLedger(raw?: WorldLedger | null): WorldLedger {
  const base = emptyWorldLedger();
  if (!raw) return base;
  return {
    clock: {
      day: Number(raw.clock?.day) || 0,
      week: Number(raw.clock?.week) || 0,
    },
    caravans: raw.caravans ?? [],
    deals: raw.deals ?? [],
    holdings: raw.holdings ?? [],
    hostiles: raw.hostiles ?? [],
    actors: raw.actors ?? [],
    pendingHiddenEvents: raw.pendingHiddenEvents ?? [],
  };
}

function ethicMult(ethic: WorkEthic): number {
  if (ethic === 'idle') return 0.55;
  if (ethic === 'driven') return 1.35;
  return 1;
}

function parseEthic(value?: string): WorkEthic {
  const v = (value ?? '').toLowerCase();
  if (v === 'idle' || v === 'lazy') return 'idle';
  if (v === 'driven' || v === 'ambitious' || v === 'hard') return 'driven';
  return 'steady';
}

function parseRisk(value?: string): DealRisk {
  const v = (value ?? '').toLowerCase();
  if (v === 'safe' || v === 'low') return 'safe';
  if (v === 'dangerous' || v === 'high') return 'dangerous';
  return 'mixed';
}

function parseOrder(value?: string): HoldingOrder {
  const v = (value ?? '').toLowerCase();
  if (v === 'jobs' || v === 'contracts') return 'jobs';
  if (v === 'steal' || v === 'theft' || v === 'stealing') return 'steal';
  if (v === 'expand' || v === 'expansion') return 'expand';
  if (v === 'upgrade' || v === 'upgrading') return 'upgrade';
  if (v === 'defend' || v === 'defense') return 'defend';
  return 'profit';
}

function parseHoldingKind(value?: string): HoldingKind {
  const v = (value ?? '').toLowerCase();
  if (v === 'town' || v === 'city' || v === 'settlement') return 'town';
  if (v === 'shop' || v === 'store') return 'shop';
  if (v === 'camp' || v === 'base') return 'camp';
  return 'guild';
}

function slugId(prefix: string, name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
  return `${prefix}-${slug || 'unnamed'}`;
}

/** Deterministic 0–1 roll from save seed + week + entity. */
function weekRng(seed: string, week: number, id: string): () => number {
  let h = 2166136261;
  const src = `${seed}|w${week}|${id}`;
  for (let i = 0; i < src.length; i++) h = Math.imul(h ^ src.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h >>> 0) % 10_000) / 10_000;
  };
}

/**
 * How much in-game time this player action consumes.
 * Local talk/inspect is a slice of a day; travel and rest move the calendar.
 */
export function daysForPlayerAction(action: string, intent: PlayerIntent): number {
  const t = action.toLowerCase();
  const weeks = t.match(/(\d+)\s*weeks?/);
  if (weeks) return Math.min(56, Number(weeks[1]) * DAYS_PER_WEEK);
  if (/\b(?:a|one|wait\s+a)\s+week\b/.test(t)) return DAYS_PER_WEEK;
  const days = t.match(/(\d+)\s*days?/);
  if (days) return Math.min(28, Number(days[1]));
  if (/\b(?:travel|journey|ride|sail|march|days?\s+on\s+the\s+road)\b/.test(t)) return 1.5;
  if (intent.kind === 'rest') return 1;
  if (intent.kind === 'move') return 0.5;
  if (intent.kind === 'search') return 0.25;
  if (intent.kind === 'talk' || intent.kind === 'observe') return 0.15;
  if (intent.kind === 'attack' || intent.kind === 'flee') return 0.1;
  return 0.2;
}

export interface WorldTickResult {
  ledger: WorldLedger;
  goldPaid: number;
  weekSummaries: string[];
  weeksResolved: number;
}

function resolveDealWeek(deal: WorldDeal, week: number, seed: string): { deal: WorldDeal; gold: number; summary: string } {
  const rng = weekRng(seed, week, deal.id);
  const runs = Math.max(1, Math.round(deal.runsPerWeek * ethicMult(deal.workEthic)));
  let gold = 0;
  let good = 0;
  let thin = 0;
  let lost = 0;
  for (let i = 0; i < runs; i++) {
    const roll = rng();
    if (deal.risk === 'safe') {
      if (roll < 0.12) {
        lost += 1;
      } else if (roll < 0.28) {
        thin += 1;
        gold += 6 + Math.floor(rng() * 6);
      } else {
        good += 1;
        gold += 12 + Math.floor(rng() * 10);
      }
    } else if (deal.risk === 'dangerous') {
      if (roll < 0.32) {
        lost += 1;
      } else if (roll < 0.55) {
        thin += 1;
        gold += 8 + Math.floor(rng() * 10);
      } else {
        good += 1;
        gold += 22 + Math.floor(rng() * 18);
      }
    } else if (roll < 0.18) {
      lost += 1;
    } else if (roll < 0.4) {
      thin += 1;
      gold += 7 + Math.floor(rng() * 8);
    } else {
      good += 1;
      gold += 14 + Math.floor(rng() * 14);
    }
  }
  const share = Math.round(gold * Math.min(1, Math.max(0, deal.playerShare)));
  const summary =
    `${deal.name}: ${runs} run${runs === 1 ? '' : 's'} (${good} good / ${thin} thin / ${lost} lost). `
    + `Your cut ${Math.round(deal.playerShare * 100)}% = ${share}g.`;
  return {
    deal: {
      ...deal,
      goldPaid: deal.goldPaid + share,
      lastResolvedWeek: week,
      lastWeekSummary: summary,
    },
    gold: share,
    summary,
  };
}

function resolveHoldingWeek(holding: WorldHolding, week: number, seed: string): { holding: WorldHolding; summary: string } {
  const rng = weekRng(seed, week, holding.id);
  const m = ethicMult(holding.workEthic);
  let progress = holding.progress;
  let treasury = holding.treasury;
  let heat = holding.heat;
  let level = holding.level;
  let note = '';

  if (holding.order === 'profit') {
    const take = Math.round((18 + rng() * 22) * m);
    treasury += take;
    note = `took paying work (+${take}g treasury)`;
  } else if (holding.order === 'jobs') {
    const take = Math.round((10 + rng() * 14) * m);
    const step = Math.round((10 + rng() * 8) * m);
    treasury += take;
    progress += step;
    heat = Math.min(100, heat + Math.round(2 * m));
    note = `completed contracts (+${take}g, +${step} progress)`;
  } else if (holding.order === 'steal') {
    const botch = rng() < 0.18 / m;
    if (botch) {
      heat = Math.min(100, heat + 12);
      note = 'a theft went wrong — heat rose, little coin';
    } else {
      const take = Math.round((24 + rng() * 28) * m);
      treasury += take;
      heat = Math.min(100, heat + Math.round(6 * m));
      note = `stole quietly enough (+${take}g, heat up)`;
    }
  } else if (holding.order === 'expand' || holding.order === 'upgrade') {
    const step = Math.round((12 + rng() * 10) * m);
    progress += step;
    note = `${holding.order === 'expand' ? 'expanded' : 'upgraded'} (+${step} progress)`;
    if (progress >= 100) {
      progress -= 100;
      level += 1;
      note += ` — rank is now ${level}`;
    }
  } else {
    heat = Math.max(0, heat - Math.round(6 * m));
    progress += Math.round(4 * m);
    note = 'held the line (heat down)';
  }

  const summary = `${holding.name} [${holding.order}]: ${note}. Treasury ${treasury}g, heat ${heat}.`;
  return {
    holding: {
      ...holding,
      progress: Math.min(200, progress),
      treasury,
      heat,
      level,
      lastResolvedWeek: week,
      lastWeekSummary: summary,
    },
    summary,
  };
}

function resolveHostileWeek(clock: WorldHostile, week: number, seed: string): { hostile: WorldHostile; summary: string; rumor?: string } {
  const rng = weekRng(seed, week, clock.id);
  const step = Math.round((7 + rng() * 8) * ethicMult(clock.workEthic));
  let progress = clock.progress + step;
  let level = clock.level;
  let rumor: string | undefined;
  if (progress >= 100) {
    progress = 25 + Math.floor(rng() * 15);
    level += 1;
    rumor = `${clock.name} closed a move against you (their pressure is now rank ${level}).`;
  }
  const summary = `${clock.name}: pressure ${progress}/100 (rank ${level}).`;
  return {
    hostile: { ...clock, progress, level, lastResolvedWeek: week, lastWeekSummary: summary },
    summary,
    rumor,
  };
}

function resolveActorWeek(actor: WorldActor, week: number, seed: string, playerLevel: number): WorldActor {
  if (actor.workEthic === 'idle') {
    return { ...actor, lastResolvedWeek: week };
  }
  const rng = weekRng(seed, week, actor.id);
  const cadence = actor.workEthic === 'driven' ? 3 : 5;
  let { level, professionLevel } = actor;
  if (week % cadence === 0 && rng() < 0.65) {
    const cap = Math.max(1, playerLevel + (actor.workEthic === 'driven' ? 2 : 1));
    if (professionLevel < Math.min(12, cap + 1) && rng() < 0.7) professionLevel += 1;
    else if (level < cap && rng() < 0.35) level += 1;
  }
  return { ...actor, level, professionLevel, lastResolvedWeek: week };
}

function resolveOneWeek(ledger: WorldLedger, week: number, seed: string, playerLevel: number): WorldTickResult {
  const summaries: string[] = [];
  let goldPaid = 0;
  const events = [...ledger.pendingHiddenEvents];

  const deals = ledger.deals.map((deal) => {
    if (!deal.active || deal.lastResolvedWeek >= week) return deal;
    const resolved = resolveDealWeek(deal, week, seed);
    goldPaid += resolved.gold;
    summaries.push(resolved.summary);
    return resolved.deal;
  });

  const holdings = ledger.holdings.map((holding) => {
    if (holding.lastResolvedWeek >= week) return holding;
    const resolved = resolveHoldingWeek(holding, week, seed);
    summaries.push(resolved.summary);
    return resolved.holding;
  });

  const hostiles = ledger.hostiles.map((hostile) => {
    if (hostile.lastResolvedWeek >= week) return hostile;
    const resolved = resolveHostileWeek(hostile, week, seed);
    summaries.push(resolved.summary);
    if (resolved.rumor) events.push(resolved.rumor);
    return resolved.hostile;
  });

  const actors = ledger.actors.map((actor) => {
    if (actor.lastResolvedWeek >= week) return actor;
    return resolveActorWeek(actor, week, seed, playerLevel);
  });

  return {
    ledger: {
      ...ledger,
      clock: { ...ledger.clock, week },
      deals,
      holdings,
      hostiles,
      actors,
      pendingHiddenEvents: events,
    },
    goldPaid,
    weekSummaries: summaries,
    weeksResolved: 1,
  };
}

/** Advance the in-game clock and resolve every week that crossed. */
export function tickWorld(
  ledger: WorldLedger,
  days: number,
  seed: string,
  playerLevel: number
): WorldTickResult {
  const next = normalizeWorldLedger(ledger);
  const add = Math.max(0, days);
  if (add <= 0) {
    return { ledger: next, goldPaid: 0, weekSummaries: [], weeksResolved: 0 };
  }

  const startWeek = Math.floor(next.clock.day / DAYS_PER_WEEK);
  next.clock.day = Math.round((next.clock.day + add) * 100) / 100;
  const endWeek = Math.floor(next.clock.day / DAYS_PER_WEEK);
  next.clock.week = endWeek;

  let goldPaid = 0;
  const weekSummaries: string[] = [];
  let weeksResolved = 0;
  let current = next;
  for (let w = startWeek + 1; w <= endWeek; w++) {
    const step = resolveOneWeek(current, w, seed, playerLevel);
    current = step.ledger;
    goldPaid += step.goldPaid;
    weekSummaries.push(...step.weekSummaries);
    weeksResolved += 1;
  }
  return { ledger: current, goldPaid, weekSummaries, weeksResolved };
}

export function applyWorldEvents(
  ledger: WorldLedger,
  events: GameEvent[],
  currentWeek: number
): { ledger: WorldLedger; extraDays: number; notes: string[] } {
  let next = normalizeWorldLedger(ledger);
  let extraDays = 0;
  const notes: string[] = [];

  for (const e of events) {
    if (e.type === 'time-pass' && e.amount && e.amount > 0) {
      extraDays += e.amount;
      notes.push(`Time passed: ${e.amount} day${e.amount === 1 ? '' : 's'}`);
    }

    if (e.type === 'world-deal' && e.name) {
      const id = e.id || slugId('deal', e.name);
      if (next.deals.some((d) => d.id === id || d.name.toLowerCase() === e.name!.toLowerCase())) {
        notes.push(`Deal already tracked: ${e.name}`);
        continue;
      }
      const share = Math.min(1, Math.max(0.01, (e.share ?? 20) > 1 ? (e.share ?? 20) / 100 : (e.share ?? 0.2)));
      next = {
        ...next,
        deals: [
          ...next.deals,
          {
            id,
            name: e.name,
            partnerName: e.partner ?? e.name,
            playerShare: share,
            risk: parseRisk(e.risk),
            runsPerWeek: Math.max(1, Math.min(8, e.runs ?? 2)),
            workEthic: parseEthic(e.ethic),
            active: true,
            goldPaid: 0,
            lastResolvedWeek: currentWeek,
          },
        ],
      };
      notes.push(`Deal logged: ${e.name} (${Math.round(share * 100)}% weekly)`);
    }

    if (e.type === 'world-holding' && e.name) {
      const id = e.id || slugId('hold', e.name);
      if (next.holdings.some((h) => h.id === id || h.name.toLowerCase() === e.name!.toLowerCase())) {
        notes.push(`Holding already tracked: ${e.name}`);
        continue;
      }
      next = {
        ...next,
        holdings: [
          ...next.holdings,
          {
            id,
            name: e.name,
            kind: parseHoldingKind(e.holdingKind),
            order: parseOrder(e.order),
            workEthic: parseEthic(e.ethic),
            level: 1,
            progress: 0,
            treasury: 0,
            heat: 0,
            lastResolvedWeek: currentWeek,
            lastSeenTurn: 0,
          },
        ],
      };
      notes.push(`Holding logged: ${e.name} (${parseOrder(e.order)})`);
    }

    if (e.type === 'world-order' && (e.name || e.id)) {
      const needle = (e.name ?? e.id ?? '').toLowerCase();
      const idx = next.holdings.findIndex(
        (h) => h.id === e.id || h.name.toLowerCase() === needle
      );
      if (idx < 0) {
        notes.push(`Order failed: no holding named ${e.name ?? e.id}`);
        continue;
      }
      const order = parseOrder(e.order);
      next = {
        ...next,
        holdings: next.holdings.map((h, i) => (i === idx ? { ...h, order } : h)),
      };
      notes.push(`${next.holdings[idx].name} now concentrates on ${order}`);
    }

    if (e.type === 'world-clock' && e.name) {
      const id = e.id || slugId('foe', e.name);
      if (next.hostiles.some((h) => h.id === id || h.name.toLowerCase() === e.name!.toLowerCase())) {
        continue;
      }
      next = {
        ...next,
        hostiles: [
          ...next.hostiles,
          {
            id,
            name: e.name,
            workEthic: parseEthic(e.ethic),
            level: 1,
            progress: 0,
            lastResolvedWeek: currentWeek,
          },
        ],
      };
      notes.push(`Rival clock started: ${e.name}`);
    }

    if (e.type === 'world-actor' && e.name) {
      const id = e.id || slugId('npc', e.name);
      if (next.actors.some((a) => a.id === id || a.name.toLowerCase() === e.name!.toLowerCase())) {
        continue;
      }
      next = {
        ...next,
        actors: [
          ...next.actors,
          {
            id,
            name: e.name,
            workEthic: parseEthic(e.ethic),
            level: Math.max(1, e.enemyLevel ?? 1),
            profession: e.summary,
            professionLevel: 1,
            lastResolvedWeek: currentWeek,
            lastSeenTurn: 0,
          },
        ],
      };
      notes.push(`Off-screen actor: ${e.name} (${parseEthic(e.ethic)})`);
    }
  }

  return { ledger: next, extraDays, notes };
}

export function reportsForVisit(
  ledger: WorldLedger,
  playerAction: string,
  location?: string
): string[] {
  const hay = `${playerAction} ${location ?? ''}`.toLowerCase();
  if (!hay.trim()) return [];
  const reports: string[] = [];
  for (const deal of ledger.deals) {
    if (hay.includes(deal.name.toLowerCase()) || hay.includes(deal.partnerName.toLowerCase())) {
      reports.push(deal.lastWeekSummary || `${deal.name}: no week has resolved yet.`);
    }
  }
  for (const holding of ledger.holdings) {
    if (hay.includes(holding.name.toLowerCase()) || hay.includes(holding.kind)) {
      reports.push(
        holding.lastWeekSummary
        || `${holding.name} is under orders to ${holding.order}. No week has resolved yet.`
      );
    }
  }
  for (const actor of ledger.actors) {
    if (hay.includes(actor.name.toLowerCase())) {
      const prof = actor.profession
        ? `, ${actor.profession} ${actor.professionLevel}`
        : '';
      reports.push(`${actor.name} is now level ${actor.level}${prof} (${actor.workEthic}).`);
    }
  }
  return reports;
}

export function formatWorldLedgerForPrompt(ledger: WorldLedger): string {
  const L = normalizeWorldLedger(ledger);
  const hasWork =
    L.deals.length + L.holdings.length + L.hostiles.length + L.actors.length > 0;
  if (!hasWork && L.caravans.length === 0) {
    return `In-game calendar: day ${L.clock.day.toFixed(1)}, week ${L.clock.week}. No off-screen deals or holdings yet.`;
  }
  const deals = L.deals
    .filter((d) => d.active)
    .map((d) => `- DEAL ${d.name} / ${d.partnerName}: ${Math.round(d.playerShare * 100)}% of ${d.runsPerWeek}/wk ${d.risk} runs (${d.workEthic}). Paid so far ${d.goldPaid}g. ${d.lastWeekSummary ?? ''}`)
    .join('\n');
  const holdings = L.holdings
    .map((h) => `- HOLDING ${h.name} [${h.kind}] order=${h.order} ethic=${h.workEthic} rank=${h.level} progress=${h.progress} treasury=${h.treasury}g heat=${h.heat}. ${h.lastWeekSummary ?? ''}`)
    .join('\n');
  const hostiles = L.hostiles
    .map((h) => `- RIVAL ${h.name}: pressure ${h.progress}/100 rank ${h.level} (${h.workEthic}).`)
    .join('\n');
  const actors = L.actors
    .map((a) => `- ACTOR ${a.name}: lvl ${a.level}${a.profession ? ` ${a.profession} ${a.professionLevel}` : ''} (${a.workEthic}).`)
    .join('\n');
  return `In-game calendar: day ${L.clock.day.toFixed(1)}, week ${L.clock.week}.
These operations resolve on in-game weeks as the player takes turns. Do NOT invent extra results.
Only narrate a deal/holding/actor report if the player is there, asks, or a visit report is supplied.
${deals || '- (no deals)'}
${holdings || '- (no holdings)'}
${hostiles || '- (no rival clocks)'}
${actors || '- (no off-screen actors)'}`;
}

export function formatTickForGm(tick: WorldTickResult, visitReports: string[]): string {
  const parts: string[] = [];
  if (tick.weeksResolved > 0 && tick.weekSummaries.length) {
    parts.push(
      `[WORLD WEEK TICK — ${tick.weeksResolved} week${tick.weeksResolved === 1 ? '' : 's'} resolved. Gold already added to the player: ${tick.goldPaid}g. Facts only — do not invent more.]\n${tick.weekSummaries.map((s) => `• ${s}`).join('\n')}`
    );
  }
  if (visitReports.length) {
    parts.push(
      `[VISIT REPORT — the player is checking on this. Narrate THESE facts, not new ones.]\n${visitReports.map((s) => `• ${s}`).join('\n')}`
    );
  }
  return parts.join('\n');
}

export function clockLabel(clock?: WorldClock): string {
  const day = clock?.day ?? 0;
  const week = clock?.week ?? Math.floor(day / DAYS_PER_WEEK);
  return `Week ${week} · Day ${day.toFixed(1)}`;
}
