/**
 * OP-1 (John, 15 Oct): road meetings and travellers start from an opener IDEA, not a canned line.
 * The engine picks one idea by seed when the meeting is rolled, keeps its id on the encounter (so the
 * talk carries on from it next turn), and hands the gist to the writer as a fact. The writer phrases it
 * freshly; the idea text is never quoted or shown to the player.
 */
import ideas from '../data/openerIdeas.json';
import { createHashRng } from './seededRng';
import type { RoadEncounter, RoadEncounterKind } from './types';

export interface OpenerIdea { id: string; situation: string; intent: string }

const TABLE = ideas as unknown as Record<string, OpenerIdea[] | string>;

export function openerIdeasFor(kind: RoadEncounterKind): OpenerIdea[] {
  const rows = TABLE[kind];
  return Array.isArray(rows) ? rows : [];
}

/** Same meeting key, same idea. Null for kinds with no opener ideas. */
export function pickOpenerIdea(kind: RoadEncounterKind, key: string): OpenerIdea | null {
  const rows = openerIdeasFor(kind);
  if (!rows.length) return null;
  const rng = createHashRng('road-opener', key);
  return rows[Math.floor(rng() * rows.length)] ?? null;
}

export function openerIdeaById(kind: RoadEncounterKind, id: string | undefined): OpenerIdea | null {
  if (!id) return null;
  return openerIdeasFor(kind).find((r) => r.id === id) ?? null;
}

/** The writer fact: the gist only, with the rule that it is never quoted. */
export function openerIdeaFact(idea: OpenerIdea | null): string {
  if (!idea) return '';
  return `Opener idea (gist only; say it in your own fresh words, never copy it, and carry the talk on from it): ${idea.situation}; ${idea.intent}.`;
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);

/** OP1-a check: true when the prose repeats any 6+ word run of an idea's text (copied, not phrased fresh). */
export function copiesOpenerIdea(prose: string, idea: OpenerIdea, span = 6): boolean {
  const p = ` ${words(prose).join(' ')} `;
  for (const text of [idea.situation, idea.intent]) {
    const w = words(text);
    for (let i = 0; i + span <= w.length; i++) if (p.includes(` ${w.slice(i, i + span).join(' ')} `)) return true;
  }
  return false;
}

/**
 * The idea a meeting opens from: the one stored on the encounter, else (a save from before OP-1) one picked by
 * seed from the encounter's own stretch and name, so the same meeting always opens the same way.
 */
export function encounterOpenerIdea(e: RoadEncounter | null | undefined): OpenerIdea | null {
  if (!e) return null;
  return openerIdeaById(e.kind, e.openerIdea) ?? pickOpenerIdea(e.kind, `legacy|${e.stretch}|${e.level}|${e.name ?? ''}`);
}

/** The gist as a backed line for the answer repair (tt-fix-4): what this person is about, never a quote to copy. */
export function openerIdeaGist(idea: OpenerIdea | null): string {
  if (!idea) return '';
  const s = `${idea.situation}; ${idea.intent}.`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
