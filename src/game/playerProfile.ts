/**
 * Account-level player profile: usual name/gender, lifetime plate tallies, meta badges.
 * Campaign Titles stay on the save. This file never mixes other campaigns into that list.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { GameState, StoryPlate } from './types';
import { plateCopyForBeat, type MemorableBeatKind } from './memorableMoments';
import type { MemorableOfferKind } from './types';

export const PLAYER_PROFILE_EVENT = 'synapticgm-player-profile-update';
const STORAGE_KEY = 'synapticgm-player-profile';

export const GENDER_PRESETS = [
  { id: '', label: 'Ask each story' },
  { id: 'woman', label: 'Woman' },
  { id: 'man', label: 'Man' },
  { id: 'non-binary', label: 'Non-binary' },
  { id: 'custom', label: 'Write my own' },
] as const;

export interface PlateEvent {
  id: string;
  saveId: string;
  campaignName: string;
  beat: string;
  title: string;
  turn: number;
  unlockedAt: number;
}

export interface MetaBadge {
  id: string;
  title: string;
  blurb: string;
  unlockedAt: number;
}

export interface PlateTallyRow {
  beat: string;
  title: string;
  count: number;
  firstUnlockedAt: number;
  lastUnlockedAt: number;
}

export interface PlayerProfile {
  preferredName: string;
  preferredGender: string;
  updatedAt: number;
  storiesStarted: number;
  plateEvents: PlateEvent[];
  metaBadges: MetaBadge[];
}

const EMPTY: PlayerProfile = {
  preferredName: '',
  preferredGender: '',
  updatedAt: 0,
  storiesStarted: 0,
  plateEvents: [],
  metaBadges: [],
};

type BeatKey = MemorableBeatKind | MemorableOfferKind;

const TALLY_TITLE: Record<string, string> = {
  opening: plateCopyForBeat('opening').title,
  death: plateCopyForBeat('death').title,
  ending: plateCopyForBeat('ending').title,
  'dungeon-boss': plateCopyForBeat('dungeon-boss').title,
  legendary: plateCopyForBeat('legendary').title,
  'ruler-audience': plateCopyForBeat('ruler-audience').title,
  beauty: plateCopyForBeat('beauty').title,
  'writer-tag': plateCopyForBeat('writer-tag').title,
};

function emit(profile: PlayerProfile): void {
  try {
    window.dispatchEvent(new CustomEvent(PLAYER_PROFILE_EVENT, { detail: profile }));
  } catch {
    /* ignore */
  }
}

function sanitizePlateEvent(raw: unknown): PlateEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? '').trim();
  const beat = String(o.beat ?? '').trim();
  if (!id || !beat) return null;
  return {
    id,
    saveId: String(o.saveId ?? '').trim(),
    campaignName: String(o.campaignName ?? '').trim(),
    beat,
    title: String(o.title ?? TALLY_TITLE[beat] ?? 'A moment worth keeping').trim(),
    turn: typeof o.turn === 'number' ? o.turn : 0,
    unlockedAt: typeof o.unlockedAt === 'number' ? o.unlockedAt : Date.now(),
  };
}

function sanitizeBadge(raw: unknown): MetaBadge | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? '').trim();
  const title = String(o.title ?? '').trim();
  if (!id || !title) return null;
  return {
    id,
    title,
    blurb: String(o.blurb ?? '').trim(),
    unlockedAt: typeof o.unlockedAt === 'number' ? o.unlockedAt : Date.now(),
  };
}

export function normalizePlayerProfile(raw: unknown): PlayerProfile {
  if (!raw || typeof raw !== 'object') return { ...EMPTY };
  const o = raw as Record<string, unknown>;
  const plateEvents = Array.isArray(o.plateEvents)
    ? o.plateEvents.map(sanitizePlateEvent).filter((e): e is PlateEvent => !!e)
    : [];
  const seen = new Set<string>();
  const uniqueEvents: PlateEvent[] = [];
  for (const event of plateEvents) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    uniqueEvents.push(event);
  }
  const badgeSeen = new Set<string>();
  const metaBadges: MetaBadge[] = [];
  for (const badge of Array.isArray(o.metaBadges) ? o.metaBadges.map(sanitizeBadge) : []) {
    if (!badge || badgeSeen.has(badge.id)) continue;
    badgeSeen.add(badge.id);
    metaBadges.push(badge);
  }
  return {
    preferredName: String(o.preferredName ?? '').trim(),
    preferredGender: String(o.preferredGender ?? '').trim(),
    updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : 0,
    storiesStarted: typeof o.storiesStarted === 'number' ? Math.max(0, Math.floor(o.storiesStarted)) : 0,
    plateEvents: uniqueEvents,
    metaBadges,
  };
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    return normalizePlayerProfile(JSON.parse(raw));
  } catch {
    return { ...EMPTY };
  }
}

function writeLocal(profile: PlayerProfile): PlayerProfile {
  const next = normalizePlayerProfile({ ...profile, updatedAt: Date.now() });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  emit(next);
  return next;
}

export function hasPersonaPrefs(profile: PlayerProfile = loadPlayerProfile()): boolean {
  return !!profile.preferredName.trim() || !!profile.preferredGender.trim();
}

export function pronounsForGender(gender: string): string {
  const n = gender.toLowerCase();
  if (/\b(woman|female|girl|she\/her|she)\b/.test(n)) return 'she/her';
  if (/\b(man|male|boy|he\/him|he)\b/.test(n)) return 'he/him';
  if (/\b(they|them|non-binary|enby|nb)\b/.test(n)) return 'they/them';
  return '';
}

export function tallyPlateEvents(events: PlateEvent[]): PlateTallyRow[] {
  const byBeat = new Map<string, PlateTallyRow>();
  for (const event of events) {
    const existing = byBeat.get(event.beat);
    if (!existing) {
      byBeat.set(event.beat, {
        beat: event.beat,
        title: TALLY_TITLE[event.beat] || event.title,
        count: 1,
        firstUnlockedAt: event.unlockedAt,
        lastUnlockedAt: event.unlockedAt,
      });
      continue;
    }
    existing.count += 1;
    existing.firstUnlockedAt = Math.min(existing.firstUnlockedAt, event.unlockedAt);
    existing.lastUnlockedAt = Math.max(existing.lastUnlockedAt, event.unlockedAt);
  }
  return [...byBeat.values()].sort((a, b) => a.firstUnlockedAt - b.firstUnlockedAt);
}

interface MetaDef {
  id: string;
  title: string;
  blurb: string;
  earned: (p: PlayerProfile) => boolean;
}

function beatCount(profile: PlayerProfile, beat: BeatKey): number {
  return profile.plateEvents.filter((e) => e.beat === beat).length;
}

const META_DEFS: MetaDef[] = [
  {
    id: 'first-story',
    title: 'The first page',
    blurb: 'Started a story.',
    earned: (p) => p.storiesStarted >= 1,
  },
  {
    id: 'stories-3',
    title: 'Another tale',
    blurb: 'Started 3 stories.',
    earned: (p) => p.storiesStarted >= 3,
  },
  {
    id: 'stories-10',
    title: 'A shelf of lives',
    blurb: 'Started 10 stories.',
    earned: (p) => p.storiesStarted >= 10,
  },
  {
    id: 'first-chapter-one',
    title: 'So it begins',
    blurb: 'Unlocked Chapter One in any story.',
    earned: (p) => beatCount(p, 'opening') >= 1,
  },
  {
    id: 'first-blood-lifetime',
    title: 'First Blood, remembered',
    blurb: 'Beat a first-dungeon boss in any story.',
    earned: (p) => beatCount(p, 'dungeon-boss') >= 1,
  },
  {
    id: 'first-death',
    title: 'The book closed once',
    blurb: 'A character died in any story.',
    earned: (p) => beatCount(p, 'death') >= 1,
  },
  {
    id: 'first-ending',
    title: 'A true ending',
    blurb: 'Reached a last page in any story.',
    earned: (p) => beatCount(p, 'ending') >= 1,
  },
  {
    id: 'plates-5',
    title: 'A short shelf',
    blurb: 'Five memorable plates across all stories.',
    earned: (p) => p.plateEvents.length >= 5,
  },
  {
    id: 'plates-15',
    title: 'Well travelled',
    blurb: 'Fifteen memorable plates across all stories.',
    earned: (p) => p.plateEvents.length >= 15,
  },
];

function withMetaBadges(profile: PlayerProfile): PlayerProfile {
  const existing = new Map(profile.metaBadges.map((b) => [b.id, b]));
  const now = Date.now();
  const next = [...profile.metaBadges];
  for (const def of META_DEFS) {
    if (existing.has(def.id) || !def.earned(profile)) continue;
    next.push({ id: def.id, title: def.title, blurb: def.blurb, unlockedAt: now });
  }
  return { ...profile, metaBadges: next.sort((a, b) => a.unlockedAt - b.unlockedAt) };
}

export function mergePlayerProfiles(a: PlayerProfile, b: PlayerProfile): PlayerProfile {
  const left = normalizePlayerProfile(a);
  const right = normalizePlayerProfile(b);
  const newer = (left.updatedAt || 0) >= (right.updatedAt || 0) ? left : right;
  const older = newer === left ? right : left;
  const events = new Map<string, PlateEvent>();
  for (const event of [...older.plateEvents, ...newer.plateEvents]) {
    events.set(event.id, event);
  }
  const badges = new Map<string, MetaBadge>();
  for (const badge of [...older.metaBadges, ...newer.metaBadges]) {
    const prev = badges.get(badge.id);
    if (!prev || badge.unlockedAt < prev.unlockedAt) badges.set(badge.id, badge);
  }
  return withMetaBadges({
    preferredName: newer.preferredName || older.preferredName,
    preferredGender: newer.preferredGender || older.preferredGender,
    updatedAt: Math.max(left.updatedAt, right.updatedAt),
    storiesStarted: Math.max(left.storiesStarted, right.storiesStarted),
    plateEvents: [...events.values()].sort((x, y) => x.unlockedAt - y.unlockedAt),
    metaBadges: [...badges.values()],
  });
}

async function pushCloud(profile: PlayerProfile): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ player_prefs: profile })
      .eq('id', userId);
    if (error && /player_prefs/i.test(error.message)) {
      return;
    }
  } catch {
    /* offline / missing column */
  }
}

export async function pullPlayerProfileFromCloud(): Promise<PlayerProfile> {
  const local = loadPlayerProfile();
  if (!isSupabaseConfigured || !supabase) return local;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return local;
    const { data, error } = await supabase
      .from('profiles')
      .select('player_prefs')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return local;
    const remote = normalizePlayerProfile((data as { player_prefs?: unknown }).player_prefs);
    const merged = mergePlayerProfiles(local, remote);
    writeLocal(merged);
    if (merged.updatedAt !== remote.updatedAt) void pushCloud(merged);
    return merged;
  } catch {
    return local;
  }
}

export function savePlayerProfile(patch: Partial<Pick<PlayerProfile, 'preferredName' | 'preferredGender'>>): PlayerProfile {
  const current = loadPlayerProfile();
  const next = writeLocal(
    withMetaBadges({
      ...current,
      preferredName: patch.preferredName !== undefined ? patch.preferredName.trim() : current.preferredName,
      preferredGender: patch.preferredGender !== undefined ? patch.preferredGender.trim() : current.preferredGender,
    })
  );
  void pushCloud(next);
  return next;
}

export function recordStoryStarted(): PlayerProfile {
  const current = loadPlayerProfile();
  const next = writeLocal(withMetaBadges({
    ...current,
    storiesStarted: current.storiesStarted + 1,
  }));
  void pushCloud(next);
  return next;
}

export function ingestCampaignPlates(state: GameState): PlayerProfile {
  return ingestCampaignPlatesMany([state]);
}

export function ingestCampaignPlatesMany(states: GameState[]): PlayerProfile {
  const current = loadPlayerProfile();
  if (!states.length) return current;
  const existing = new Set(current.plateEvents.map((e) => e.id));
  const added: PlateEvent[] = [];
  for (const state of states) {
    const plates: StoryPlate[] = state.memorableMoments?.storyPlates ?? [];
    if (!plates.length) continue;
    const saveId = state.saveId || 'local';
    const campaignName = state.storyName?.trim() || 'Untitled story';
    for (const plate of plates) {
      const id = `${saveId}:${plate.id}`;
      if (existing.has(id)) continue;
      existing.add(id);
      added.push({
        id,
        saveId,
        campaignName,
        beat: plate.beat,
        title: plate.title,
        turn: plate.turn,
        unlockedAt: Date.now(),
      });
    }
  }
  if (!added.length) return current;
  const next = writeLocal(withMetaBadges({
    ...current,
    plateEvents: [...current.plateEvents, ...added],
  }));
  void pushCloud(next);
  return next;
}

export function applyUsualSelfToCharacter<T extends { name?: string; gender?: string }>(
  character: T,
  profile: PlayerProfile = loadPlayerProfile()
): T {
  return {
    ...character,
    ...(profile.preferredName.trim() ? { name: profile.preferredName.trim() } : {}),
    ...(profile.preferredGender.trim() ? { gender: profile.preferredGender.trim() } : {}),
  };
}
