/**
 * C6 — Opening checklist gate.
 * Every opening card (premade + generated; PYOA books excluded from the flagship gate)
 * must carry five authored fields: who / how / where / whoHere / pressing.
 * Content only — no generic fallback text when a field is missing.
 *
 * Tabletop openings stay SRD 5.2.1 as written (no engine XP/award change here).
 * SRD 5.2.1: character creation and adventure framing are product content; this gate
 * only requires the opening card to name the PC role, arrival, place, company, and pressure.
 */

import type { OpeningHookCard } from '@/data/campaigns/types';

/** Non-PYOA flagship premades the gate must cover. */
export const FLAGSHIP_OPENING_PREMADES = [
  'summoned-pact',
  'cursed-keep',
  'salt-road-heist',
] as const;

export type FlagshipOpeningPremade = (typeof FLAGSHIP_OPENING_PREMADES)[number];

export type OpeningChecklistFields = {
  /** Who you are. */
  who: string;
  /** How you got here. */
  how: string;
  /** Where you are. */
  where: string;
  /** Who is here. */
  whoHere: string;
  /** What's pressing. */
  pressing: string;
};

function trimField(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
}

/**
 * Resolve the five checklist fields from a typed opening card.
 * Accepts canonical names (who/how/where/whoHere/pressing) and the older
 * location / faction / summonIntent slots as aliases — never invents copy.
 */
export function openingChecklistFields(
  card: OpeningHookCard | null | undefined
): OpeningChecklistFields | undefined {
  if (!card || typeof card === 'string') return undefined;
  const who = trimField(card.who);
  const how = trimField(card.how) || trimField(card.summonIntent);
  const where = trimField(card.where) || trimField(card.location);
  const whoHere = trimField(card.whoHere) || trimField(card.faction);
  const pressing = trimField(card.pressing);
  if (!who || !how || !where || !whoHere || !pressing) return undefined;
  return { who, how, where, whoHere, pressing };
}

/** True when all five authored checklist fields are present. */
export function openingChecklistComplete(card: OpeningHookCard | null | undefined): boolean {
  return openingChecklistFields(card) != null;
}

/**
 * Build a first-page body from the five authored fields when page1 is absent.
 * Concatenates world data only — never pads with stock filler.
 */
export function openingSceneFromChecklist(fields: OpeningChecklistFields): string {
  return [
    `You are ${fields.who}.`,
    fields.how,
    `You are at ${fields.where}.`,
    fields.whoHere,
    fields.pressing,
  ].join(' ');
}
