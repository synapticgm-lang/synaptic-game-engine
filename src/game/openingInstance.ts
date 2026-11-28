/**
 * Seed-stable opening names and places from typed cast/place data.
 * Hook English is never scraped for Title-Case names (HISTORY H7 / H8).
 */
import type {
  GameState,
  NpcMemory,
  OpeningCastMember,
  OpeningInstance,
  OpeningOfferChip,
} from './types';
import type {
  OpeningHookOffer,
  OpeningHookPronouns,
  OpeningHookRite,
  OpeningHookTypedData,
} from '@/data/campaigns/types';
import { openingHookHasTypedData } from '@/data/campaigns/types';
import { hashSeed, keyedRng, type Rng } from './seededRng';
import { genderForPersonName, NAME_HONORIFIC, pickPersonName, type PersonGender } from './personNames';
import { campaignCanonicalHubNames, campaignHubLabels } from './outdoorHubs';
import { applyPresenceFacts } from './presentAuthority';
import { offerRecordFromTypedData } from './openingEstablishment';

/** A hook snapshot the instance mint can read without importing the hook-deck tree. */
export interface OpeningHookSnapshot extends Partial<OpeningHookTypedData> {
  location?: string;
  text?: string;
  page1?: string;
  fallback?: string;
  whoHere?: string;
  openingOffer?: string;
  pressingNeed?: string;
  howYouGotHere?: string;
  summonIntent?: string;
  whoYouAre?: string;
  beats?: string[];
  writerNotes?: string;
  faction?: string;
  /** Catalog NPC names already resolved from the hook's castNpcIds. */
  catalogNpcNames?: string[];
  castNpcIds?: string[];
}

function genderFromPronouns(pronouns: OpeningHookPronouns): PersonGender | undefined {
  if (pronouns === 'she/her') return 'female';
  if (pronouns === 'he/him') return 'male';
  return undefined;
}

function placeKindFromData(kind: string): string {
  const k = kind.replace(/\s+/g, ' ').trim();
  if (!k) return 'a named place';
  if (/^(?:a|an|the)\s+/i.test(k)) return k;
  return /^[aeiou]/i.test(k) ? `an ${k}` : `a ${k}`;
}

const HONORIFIC = NAME_HONORIFIC;

const PLACE_STEMS = [
  'Brack', 'Hollin', 'Sallow', 'Dunmore', 'Fenwick', 'Marl', 'Cotter', 'Rudd', 'Tew', 'Aske',
  'Wyle', 'Thatch', 'Merrow', 'Coyne', 'Idra', 'Lisle', 'Cutha', 'Hask', 'Barrow', 'Crane',
  'Pike', 'Ness', 'Oatley', 'Redd', 'Calder', 'Morrow', 'Halden', 'Birch', 'Rowan', 'Ashen',
  'Keld', 'Thorpe', 'Wain', 'Mabb', 'Ortle', 'Stane', 'Voss', 'Yarrow', 'Beck',
  'Alden', 'Bramley', 'Caer', 'Durn', 'Esk', 'Flint', 'Goss', 'Harth', 'Ilme', 'Jorren',
  'Kemp', 'Larn', 'Moss', 'Nairn', 'Ockley', 'Pratt', 'Quen', 'Rill', 'Selk', 'Torr',
  'Ulm', 'Verra', 'Wex', 'Yale', 'Zost', 'Brindle', 'Callow', 'Dapple', 'Elwick', 'Farrow',
  'Gild', 'Hewes', 'Ingo', 'Jarrow', 'Loden', 'Mux', 'Noll', 'Orwick', 'Pendreth', 'Reston',
  'Shand', 'Tulley', 'Upton', 'Varley', 'Welby', 'Yarn', 'Amberly', 'Beltane', 'Corven', 'Drewe',
];

const PLACE_MIDS = [
  'fen', 'mere', 'wick', 'stead', 'hurst', 'leigh', 'croft', 'moor', 'ridge',
  'haven', 'field', 'bury', 'ham', 'shaw', 'holt', 'vale', 'kirk', 'dell',
];

const MODERN_GIVEN = [
  'Priya', 'Jonas', 'Mara', 'Theo', 'Nina', 'Luc', 'Asha', 'Kenan', 'Ivy', 'Rafi', 'Sofi', 'Marc',
];
const MODERN_FAMILY = [
  'Adler', 'Vance', 'Rahim', 'Kessler', 'Mori', 'Okoye', 'Silva', 'Berg', 'Cho', 'Perez', 'Nolan', 'Ibarra',
];
const SCIFI_GIVEN = [
  'Rin', 'Kade', 'Nyx', 'Vela', 'Jori', 'Tamsin', 'Sable', 'Ilex', 'Torin', 'Yara', 'Pax', 'Nim',
];
const SCIFI_FAMILY = [
  'Voss', 'Keel', 'Rook', 'Solan', 'Phes', 'Darra', 'Quillan', 'Hex', 'Orry', 'Tal', 'Mire', 'Kett',
];

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function givenNameOf(name: string): string {
  const raw = (name ?? '').replace(HONORIFIC, '').trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  return parts[0] || raw || name;
}

function pickUnused(rng: Rng, bank: readonly string[], taken: Set<string>): string {
  const shuffled = [...bank].sort(() => rng() - 0.5);
  for (const w of shuffled) {
    if (!taken.has(w.toLowerCase())) {
      taken.add(w.toLowerCase());
      return w;
    }
  }
  const fallback = `${bank[Math.floor(rng() * bank.length)] ?? 'Hollin'}${Math.floor(rng() * 80) + 2}`;
  taken.add(fallback.toLowerCase());
  return fallback;
}

function pickModernOrScifiName(rng: Rng, taken: Set<string>, genre: 'modern' | 'scifi'): string {
  const givenBank = genre === 'scifi' ? SCIFI_GIVEN : MODERN_GIVEN;
  const famBank = genre === 'scifi' ? SCIFI_FAMILY : MODERN_FAMILY;
  for (let i = 0; i < 12; i++) {
    const given = givenBank[Math.floor(rng() * givenBank.length)]!;
    const family = famBank[Math.floor(rng() * famBank.length)]!;
    if (taken.has(given.toLowerCase()) || taken.has(family.toLowerCase())) continue;
    taken.add(given.toLowerCase());
    taken.add(family.toLowerCase());
    return `${given} ${family}`;
  }
  return pickPersonName(rng, taken) || pickUnused(rng, givenBank, taken);
}

function inferGenre(bibleId?: string, engineMode?: string): 'fantasy' | 'modern' | 'scifi' {
  const id = (bibleId ?? '').toLowerCase();
  if (id === 'system-integration') return 'modern';
  if (/umbra|erebus|null-parameter|protocol/.test(id)) return 'scifi';
  if (/summoned-pact|cursed-keep|shattered-coast|thornferry|greyhollow|hero-awakening/.test(id)) {
    return 'fantasy';
  }
  void engineMode;
  return 'fantasy';
}

function mintPerson(
  rng: Rng,
  taken: Set<string>,
  genre: 'fantasy' | 'modern' | 'scifi'
): { name: string; gender: PersonGender } {
  const name = genre === 'fantasy'
    ? (pickPersonName(rng, taken) || pickModernOrScifiName(rng, taken, 'modern'))
    : pickModernOrScifiName(rng, taken, genre);
  return { name, gender: genderForPersonName(name) };
}

/** Last word of an authored place kind becomes the minted place suffix. */
function placeSuffixFromKind(kind: string): string {
  const k = kind.toLowerCase().replace(/^(?:a|an|the)\s+/, '').trim();
  const word = (k.split(/\s+/).filter(Boolean).pop() ?? 'hollow');
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function joinStemMid(stem: string, mid: string): string {
  if (stem.toLowerCase().endsWith(mid[0]!)) return stem + mid.slice(1);
  return stem + mid;
}

function mintPlaceName(rng: Rng, kind: string, taken: Set<string>, salt = ''): string {
  const suffix = placeSuffixFromKind(kind);
  const space = PLACE_STEMS.length * PLACE_MIDS.length;
  const h = hashSeed(`${salt}|${kind}|place`);
  const start = h % space;
  const step = (h % (space - 1)) + 1;
  for (let i = 0; i < space; i++) {
    const slot = (start + i * step) % space;
    const stem = PLACE_STEMS[Math.floor(slot / PLACE_MIDS.length)]!;
    const mid = PLACE_MIDS[slot % PLACE_MIDS.length]!;
    const join = joinStemMid(stem, mid);
    const name = suffix.toLowerCase() === 'wake' ? join : `${join} ${suffix}`;
    if (taken.has(join.toLowerCase()) || taken.has(name.toLowerCase())) continue;
    taken.add(join.toLowerCase());
    taken.add(name.toLowerCase());
    return name;
  }
  const stem = pickUnused(rng, PLACE_STEMS, taken);
  if (suffix.toLowerCase() === 'wake') return `${stem}croft`;
  return `${stem} ${suffix}`;
}

function pickNearbyLandmark(
  bibleId: string | undefined,
  placeName: string,
  seedKey: string
): string | undefined {
  const hubs = campaignCanonicalHubNames(bibleId).filter(
    (n) => n.toLowerCase() !== placeName.toLowerCase()
  );
  if (!hubs.length) return undefined;
  const h = hashSeed(`${seedKey}|nearby-hub`);
  return hubs[h % hubs.length];
}

function takenFromHubs(bibleId?: string): Set<string> {
  const taken = new Set<string>();
  for (const lab of campaignHubLabels(bibleId)) {
    for (const w of lab.split(/\s+/)) {
      if (w.length >= 3) taken.add(w.toLowerCase());
    }
  }
  return taken;
}

/**
 * Mint from authored typed hook data only — no Title-Case scrape, no search-and-replace
 * over card English (HISTORY H7 / H8).
 */
function markNameTaken(taken: Set<string>, name: string): void {
  for (const w of name.split(/\s+/)) {
    if (w.length >= 2) taken.add(w.toLowerCase());
  }
  taken.add(name.toLowerCase());
}

function mintOpeningInstanceFromTypedData(
  hook: OpeningHookTypedData & OpeningHookSnapshot,
  seedKey: string,
  opts?: {
    bibleId?: string;
    engineMode?: string;
    /** Bible roster display names keyed by catalogNpcId — left fixed (Father Aldous, Vessa, …). */
    catalogById?: Record<string, string>;
  }
): OpeningInstance {
  const rng = keyedRng(seedKey);
  const genre = inferGenre(opts?.bibleId, opts?.engineMode);
  const taken = takenFromHubs(opts?.bibleId);
  const placeKind = placeKindFromData(hook.place.kind);
  const placeName = mintPlaceName(rng, placeKind, taken, seedKey);
  const nearbyLandmark = pickNearbyLandmark(opts?.bibleId, placeName, seedKey);

  const cast: OpeningCastMember[] = hook.cast.map((member) => {
    const role = member.role.replace(/\s+/g, ' ').trim();
    const catalogName = member.catalogNpcId
      ? (opts?.catalogById?.[member.catalogNpcId] ?? '').replace(/\s+/g, ' ').trim()
      : '';
    if (catalogName) {
      markNameTaken(taken, catalogName);
      return {
        name: catalogName,
        role,
        gender: genderFromPronouns(member.pronouns) ?? genderForPersonName(catalogName),
        durability: member.durability,
        pronouns: member.pronouns,
      };
    }
    const minted = mintPerson(rng, taken, genre);
    return {
      name: minted.name,
      role,
      gender: genderFromPronouns(member.pronouns) ?? minted.gender,
      durability: member.durability,
      pronouns: member.pronouns,
    };
  });

  const offer: OpeningHookOffer = hook.offer;
  const carryable = offer.items.filter((it) => it.carryable);
  const benefits = offer.items.filter((it) => !it.carryable);
  const itemNotes = carryable.map((it) => it.label);
  const benefitNotes = benefits.map((it) => it.label);
  const offerChips: OpeningOfferChip[] = [];
  if (offer.items.length) {
    const giver = cast[0];
    const what = itemNotes.join(', ');
    const named = what
      ? giver
        ? `Take ${givenNameOf(giver.name)}'s ${what}`
        : `Take the ${what}`
      : giver
        ? `Accept ${givenNameOf(giver.name)}'s offer`
        : 'Accept the offer';
    offerChips.push({
      kind: 'accept',
      label: named,
      note: giver
        ? `${giver.name} offers ${what || benefitNotes.join(', ') || 'a deal'}`
        : what || benefitNotes.join(', ') || 'An offer is on the table.',
    });
    offerChips.push({
      kind: 'refuse',
      label: 'Keep your own kit',
      note: 'Refuse whatever is being offered and keep your own kit.',
    });
  }

  const rite: OpeningHookRite = hook.rite;
  const situation = [
    hook.whoYouAre,
    hook.howYouGotHere,
    hook.pressingNeed,
    placeKind,
    cast.map((c) => c.role).filter(Boolean).join(', '),
    rite.steps.map((s) => s.label).filter(Boolean).join('; '),
    hook.beatOrder.join(' → '),
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim() || `${placeKind} — the scene is already in motion.`;

  return {
    placeName,
    placeKind,
    cast,
    situation,
    pressing: hook.pressingNeed?.replace(/\s+/g, ' ').trim() || undefined,
    how: hook.howYouGotHere?.replace(/\s+/g, ' ').trim() || undefined,
    whoYouAre: hook.whoYouAre?.replace(/\s+/g, ' ').trim() || undefined,
    offerSummary: itemNotes.length ? itemNotes.join(', ') : undefined,
    offerChips,
    ...(itemNotes.length ? { offerItemNotes: itemNotes } : {}),
    beatOrder: hook.beatOrder.slice(),
    alone: cast.length === 0,
    nearbyLandmark,
    retiredNames: [],
    nameMap: [],
  };
}

/** Untyped English hooks are not minted from prose (HISTORY H7 / H8). Alone place only. */
function mintAlonePlace(
  seedKey: string,
  opts?: { bibleId?: string; engineMode?: string }
): OpeningInstance {
  const rng = keyedRng(seedKey);
  const taken = takenFromHubs(opts?.bibleId);
  const placeKind = 'a named place';
  const placeName = mintPlaceName(rng, placeKind, taken, seedKey);
  return {
    placeName,
    placeKind,
    cast: [],
    situation: `${placeKind} — the scene is already in motion.`,
    offerChips: [],
    alone: true,
    nearbyLandmark: pickNearbyLandmark(opts?.bibleId, placeName, seedKey),
    retiredNames: [],
    nameMap: [],
  };
}

export function mintOpeningInstance(
  hook: OpeningHookSnapshot,
  seedKey: string,
  opts?: {
    bibleId?: string;
    engineMode?: string;
    catalogById?: Record<string, string>;
  }
): OpeningInstance {
  if (openingHookHasTypedData(hook)) {
    return mintOpeningInstanceFromTypedData(hook, seedKey, opts);
  }
  return mintAlonePlace(seedKey, opts);
}

function hookKey(state: GameState): string {
  return `${state.seed ?? state.saveId ?? '0'}|${state.campaignBibleId ?? 'campaign'}|opening-instance`;
}

function patchRoster(memories: NpcMemory[] | undefined, instance: OpeningInstance, castNpcIds?: string[]): NpcMemory[] {
  const next = [...(memories ?? [])];
  instance.cast.forEach((member, i) => {
    const id = castNpcIds?.[i];
    const idx = id ? next.findIndex((m) => m.npcId === id) : -1;
    if (idx >= 0) {
      const prev = next[idx]!;
      next[idx] = {
        ...prev,
        npcName: member.name,
        aliases: [member.role, ...(prev.aliases ?? [])],
        roleHint: member.role || prev.roleHint,
        durability: member.durability ?? prev.durability,
      };
    } else {
      next.push({
        npcId: `opening-cast-${i + 1}`,
        npcName: member.name,
        disposition: 'neutral',
        facts: [member.role].filter(Boolean),
        aliases: [member.role].filter(Boolean),
        roleHint: member.role,
        lastSeenTurn: 0,
        durability: member.durability,
      });
    }
  });
  return next;
}

/**
 * Lock the minted instance onto the save: place, pins, roster names.
 * No English name-map rebuild — typed mint carries empty nameMap.
 */
export function attachOpeningInstance(
  state: GameState,
  hook: OpeningHookSnapshot,
  blob?: string
): GameState {
  const existing = state.openingEstablishment?.instance;
  const catalogById: Record<string, string> = {};
  for (const m of state.npcMemories ?? []) {
    if (m.npcId && m.npcName?.trim()) catalogById[m.npcId] = m.npcName.trim();
  }
  const catalogNpcNames = [
    ...(hook.catalogNpcNames ?? []),
    ...(hook.castNpcIds ?? []).map((id) => catalogById[id!] ?? ''),
  ].filter(Boolean);
  const instance = existing ?? mintOpeningInstance(
    { ...hook, catalogNpcNames },
    hookKey(state),
    {
      bibleId: state.campaignBibleId ?? undefined,
      engineMode: state.engineMode,
      catalogById,
    }
  );
  const est = state.openingEstablishment;
  const pinned = instance.cast.map((c) => c.name);
  const memories = patchRoster(state.npcMemories, instance, est?.castNpcIds);
  const acceptLabel = instance.offerChips.find((c) => c.kind === 'accept')?.label;
  const refuseLabel = instance.offerChips.find((c) => c.kind === 'refuse')?.label;
  const typedOffer = openingHookHasTypedData(hook)
    ? offerRecordFromTypedData(hook.offer, { accept: acceptLabel, refuse: refuseLabel })
    : undefined;
  const cardOffer = typedOffer
    ? {
        ...typedOffer,
        items: instance.offerItemNotes?.length ? instance.offerItemNotes : typedOffer.items,
        accept: acceptLabel ?? typedOffer.accept,
        refuse: refuseLabel ?? typedOffer.refuse ?? 'Keep your own kit',
      }
    : est?.card?.offer;
  const cardNames = [
    instance.placeName,
    ...pinned,
    ...(instance.factionName ? [instance.factionName] : []),
    ...(instance.settlementName ? [instance.settlementName] : []),
  ];
  const nextCard = est?.card
    ? {
        ...est.card,
        place: instance.placeName,
        cast: instance.cast.length ? instance.cast.map((c) => c.name).join(' and ') : est.card.cast,
        castNames: pinned,
        names: cardNames,
        ...(cardOffer ? { offer: cardOffer } : {}),
      }
    : cardOffer
      ? {
          place: instance.placeName,
          cast: instance.cast.map((c) => c.name).join(' and '),
          castNames: pinned,
          props: [] as string[],
          names: cardNames,
          offer: cardOffer,
        }
      : est?.card;

  void blob;
  const next: GameState = {
    ...state,
    currentLocation: instance.placeName,
    npcMemories: memories,
    openingEstablishment: {
      ...(est ?? { pending: [], answers: {}, complete: true }),
      instance,
      pickedHook: est?.pickedHook,
      pinnedNpcNames: pinned,
      pinnedAt: instance.placeName,
      authoredPage1Retired: hook.page1 || hook.fallback || est?.authoredPage1Retired,
      pickedHookFallback: undefined,
      page1: undefined,
      answers: { ...(est?.answers ?? {}), where: instance.placeName },
      card: nextCard,
    },
  };
  const priorPins = est?.pinnedNpcNames ?? [];
  const present = (state.sceneFacts?.present ?? []).filter((p) => {
    const label = (p ?? '').replace(/\s+/g, ' ').trim();
    if (!label) return false;
    if (priorPins.some((n) => n.toLowerCase() === label.toLowerCase())) return false;
    return true;
  });
  for (const name of pinned) {
    if (!present.some((p) => p.toLowerCase() === name.toLowerCase())) present.push(name);
  }
  return applyPresenceFacts(next, { present });
}

export function openingInstanceOf(state: GameState): OpeningInstance | undefined {
  return state.openingEstablishment?.instance;
}

export function snapshotFromPickedHook(
  picked?: (Omit<OpeningHookSnapshot, 'writerNotes' | 'cast'> & {
    who?: string;
    how?: string;
    summonIntent?: string;
    pressing?: string;
    where?: string;
    writerNotes?: string | string[];
    beats?: string[];
    faction?: string;
    castNpcIds?: string[];
    cast?: OpeningHookTypedData['cast'];
    place?: OpeningHookTypedData['place'];
    offer?: OpeningHookTypedData['offer'];
    rite?: OpeningHookTypedData['rite'];
    beatOrder?: OpeningHookTypedData['beatOrder'];
  }) | null
): OpeningHookSnapshot {
  if (!picked) return {};
  const castNpcIds = picked.castNpcIds?.length
    ? picked.castNpcIds
    : picked.cast?.map((c) => c.catalogNpcId).filter((id): id is string => !!id);
  const writerNotes = Array.isArray(picked.writerNotes)
    ? picked.writerNotes.join('\n')
    : picked.writerNotes;
  return {
    location: picked.location ?? picked.where,
    text: picked.text,
    page1: picked.page1,
    fallback: picked.fallback,
    whoHere: picked.whoHere ?? picked.faction,
    openingOffer: picked.openingOffer,
    pressingNeed: picked.pressingNeed ?? picked.pressing,
    howYouGotHere: picked.howYouGotHere ?? picked.how,
    summonIntent: picked.summonIntent,
    whoYouAre: picked.whoYouAre ?? picked.who,
    beats: picked.beats,
    writerNotes,
    faction: picked.faction,
    castNpcIds,
    ...(openingHookHasTypedData(picked)
      ? {
          cast: picked.cast,
          place: picked.place,
          offer: picked.offer,
          rite: picked.rite,
          beatOrder: picked.beatOrder,
        }
      : {}),
  };
}
