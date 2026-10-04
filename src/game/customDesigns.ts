/**
 * Player custom game designs, kept on this device in localStorage (apart from saves).
 * A design is the Simple pitch or the Expert draft; starting one builds the bible as before.
 * The unsaved draft is also kept here so closing New Game does not lose it.
 */

import type { CampaignArchetype } from './archetypes';
import type { EngineMode } from './types';
import { emptyExpertDraft, type ExpertCustomDraft } from './customExpertDraft';

export type CustomDesignDepth = 'simple' | 'expert';

export interface CustomDesign {
  id: string;
  name: string;
  mode: EngineMode;
  depth: CustomDesignDepth;
  archetype?: CampaignArchetype;
  simplePitch?: string;
  expertDraft?: ExpertCustomDraft;
  updatedAt: number;
}

/** The working draft: a design that may not have a name or id yet. */
export type CustomDesignDraft = Omit<CustomDesign, 'id' | 'name' | 'updatedAt'> & { id?: string; name?: string };

const DESIGNS_KEY = 'synapticgm-custom-designs';
const DRAFT_KEY = 'synapticgm-custom-draft';
const MODES: readonly EngineMode[] = ['litrpg', 'dnd', 'rpg', 'pyoa'];

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readJson(key: string): unknown {
  try {
    const raw = storage()?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the design stays in the open modal only */
  }
}

function cleanDraftFields(raw: Record<string, unknown>): CustomDesignDraft | null {
  const mode = raw.mode as EngineMode;
  if (!MODES.includes(mode)) return null;
  const depth: CustomDesignDepth = raw.depth === 'expert' ? 'expert' : 'simple';
  const expert = raw.expertDraft && typeof raw.expertDraft === 'object'
    ? { ...emptyExpertDraft(), ...(raw.expertDraft as Partial<ExpertCustomDraft>) }
    : undefined;
  return {
    ...(typeof raw.id === 'string' && raw.id ? { id: raw.id } : {}),
    ...(typeof raw.name === 'string' ? { name: raw.name } : {}),
    mode,
    depth,
    ...(typeof raw.archetype === 'string' ? { archetype: raw.archetype as CampaignArchetype } : {}),
    ...(typeof raw.simplePitch === 'string' ? { simplePitch: raw.simplePitch } : {}),
    ...(expert ? { expertDraft: expert } : {}),
  };
}

function cleanDesign(raw: unknown): CustomDesign | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const fields = cleanDraftFields(r);
  if (!fields?.id || !fields.name?.trim()) return null;
  return {
    ...fields,
    id: fields.id,
    name: fields.name.trim(),
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : 0,
  };
}

function writeAll(designs: CustomDesign[]): void {
  writeJson(DESIGNS_KEY, designs);
}

/** Newest first. */
export function listCustomDesigns(): CustomDesign[] {
  const raw = readJson(DESIGNS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(cleanDesign)
    .filter((d): d is CustomDesign => !!d)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function newCustomDesignId(): string {
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : '';
  return (uuid || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`).replace(/-/g, '').slice(0, 12);
}

/** Save a new design or overwrite the one with the same id. */
export function saveCustomDesign(draft: CustomDesignDraft & { name: string }): CustomDesign {
  const design: CustomDesign = {
    ...draft,
    id: draft.id || newCustomDesignId(),
    name: draft.name.trim() || 'Custom Campaign',
    updatedAt: Date.now(),
  };
  writeAll([design, ...listCustomDesigns().filter((d) => d.id !== design.id)]);
  return design;
}

export function renameCustomDesign(id: string, name: string): CustomDesign | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const all = listCustomDesigns();
  const hit = all.find((d) => d.id === id);
  if (!hit) return null;
  const renamed = { ...hit, name: trimmed, updatedAt: Date.now() };
  writeAll(all.map((d) => (d.id === id ? renamed : d)));
  return renamed;
}

export function deleteCustomDesign(id: string): void {
  writeAll(listCustomDesigns().filter((d) => d.id !== id));
}

export function loadCustomDraft(): CustomDesignDraft | null {
  const raw = readJson(DRAFT_KEY);
  return raw && typeof raw === 'object' ? cleanDraftFields(raw as Record<string, unknown>) : null;
}

export function saveCustomDraft(draft: CustomDesignDraft): void {
  writeJson(DRAFT_KEY, draft);
}

export function clearCustomDraft(): void {
  try {
    storage()?.removeItem(DRAFT_KEY);
  } catch {
    /* nothing kept */
  }
}
