import type { GameState } from './types';

const COMPANION_REFERENCE =
  /\b(?:my|our|the|your)?\s*(?:companion|party member|party members|party group|teammate|sidekick|familiar|mount)\b/i;
const COMPANION_ACQUISITION =
  /\b(?:find|seek|search for|look for|recruit|hire|summon|tame|befriend)\b/i;
const NAMED_INTERACTION =
  /\b(?:ask|tell|consult|command|order|heal|speak (?:to|with)|talk (?:to|with))\s+(?:the\s+)?([A-Z][\p{L}\p{N}'-]{1,40})\b/u;
const GENERIC_SCENE_ROLES = new Set([
  'around', 'locals', 'guard', 'guards', 'merchant', 'innkeeper', 'bartender', 'villager',
  'villagers', 'stranger', 'prisoner', 'enemy', 'enemies', 'figure', 'silhouette', 'crowd',
  'elder', 'priest', 'herald', 'courtier', 'acolyte', 'sage', 'attendant',
]);

const NAMED_INTERACTABLE_CLAIM =
  /\b(?:inspect|examine|open|search|check|test|heft|take|grab|pick\s+up|approach|activate|pull|push|read|unlock|loot|rummage(?:\s+through)?)\s+(?:(?:the\s+heft\s+of\s+)?(?:a|an|the|my|your)\s+)?([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,3})\b/gi;
const NAMED_THREAT_CLAIM =
  /\b(?:attack|fight|strike|kill|slay|ambush|stalk|engage|charge|hide\s+from|sneak\s+(?:past|around|away\s+from)|flee\s+(?:from|the)|retreat\s+from|watch|study|scan|assess)\s+(?:(?:a|an|the)\s+)?([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,3})\b/gi;
// Inventory USE / EQUIP / GIVE (and close kin). Instrument `with` (det required) is an inventory claim only when
// the object is not deixis, not a scene prop, and not a generic scene/body noun — see collectUnsupportedClaims.
// q75r3: restore `with` after q75r cut; attributive "book with the palace seal" skips via scene-grounded head NP.
const ITEM_USE_CLAIM =
  /\b(?:(?:use|equip|give|hand\s+over|offer|throw|lob|toss|drink|eat|wield|draw|deploy|detonate|load|pull\s+out|unsheathe|brandish)\s+(?:(?:a|an|the|my|your)\s+)?|fire\s+(?:a|an|the|my|your)\s+|with\s+(?:a|an|the|my|your)\s+)([a-z][\w'\-]+(?:\s+[a-z][\w'\-]+){0,3})/i;

/** Pronoun / deixis object of use/toss/with — not an inventory name (same family as findUngroundedNamedClaims). */
const DEIXIS_OBJECT = new Set(['it', 'them', 'him', 'her', 'this', 'that', 'those', 'these']);
const WEAPON_USE_CLAIM =
  /\b(?:swing|slash|stab|strike|cleave|thrust|parry|block|attack|hit|shoot)\s+(?:(?:with|using)\s+)?(?:(?:a|an|the|my|your)\s+)?((?:short|long|great|bastard)\s*swords?|shortswords?|longswords?|greatswords?|daggers?|handaxes?|battleaxes?|warhammers?|maces?|scimitars?|rapiers?|katanas?|cutlasses?|crossbows?|longbows?|shortbows?|spears?|halberds?|quarterstaffs?|staves|staffs?|wands?|clubs?|pistols?|rifles?)\b/i;
const ITEM_POSSESSION_CLAIM =
  /\b(?:(?:i\s+)?(?:had|have|got|possess)|(?:realiz(?:e|ed)|remember(?:ed)?)\s+(?:i\s+)?(?:had|have|got))\s+(?:a|an|the|my)\s+((?:short|long|great|bastard)\s*swords?|shortswords?|longswords?|greatswords?|daggers?|axes?|bows?|crossbows?|staves|staffs?|wands?|maces?|spears?|pistols?|rifles?|grenades?|potions?|draughts?|elixirs?|swords?|blades?|guns?)\b/i;
const NAMED_WEAPON =
  /\b((?:short|long|great|bastard)\s*swords?|shortswords?|longswords?|greatswords?|daggers?|handaxes?|battleaxes?|warhammers?|maces?|morningstars?|scimitars?|rapiers?|katanas?|cutlasses?|sabers?|sabres?|crossbows?|longbows?|shortbows?|spears?|halberds?|quarterstaffs?|quarterstaves|staves|staffs?|wands?|clubs?|flails?|glaives?|tridents?|pistols?|rifles?|shotguns?|grenades?)\b/gi;

const GOLD_SPEND_CLAIM =
  /\b(?:pay|bribe|spend|offer|buy|purchase|tip|donate|bet)\b[^.]{0,48}?\b(\d{1,7})\s*(?:gold|gp|coins?|crowns?)\b/i;

const NON_ITEM_TOKENS = new Set([
  'breath', 'lever', 'door', 'curtain', 'attention', 'cover', 'aim', 'time', 'distance',
  'sword arm', 'hand', 'hands', 'fist', 'fists', 'voice', 'gaze', 'look', 'step', 'stance',
  'creature', 'enemy', 'ground', 'position', 'surroundings', 'area', 'threat', 'threats',
  'immediate surroundings', 'environment', 'room', 'scene', 'path', 'corridor', 'alley',
  'gate', 'window', 'wall', 'floor', 'ceiling', 'shadows', 'darkness', 'light', 'air',
]);

const GENERIC_SCENE_NOUNS = new Set([
  ...NON_ITEM_TOKENS,
  ...GENERIC_SCENE_ROLES,
  'surroundings', 'environment', 'room', 'chamber', 'hall', 'hallway', 'street', 'road',
  'path', 'trail', 'exit', 'entrance', 'stairs', 'ladder', 'bridge', 'table', 'chair',
  'bed', 'chest', 'box', 'crate', 'barrel', 'sign', 'poster',
  'note', 'letter', 'book', 'shelf', 'counter', 'bar', 'hearth', 'fire', 'torch',
  'lantern', 'keyhole', 'lock', 'rubble', 'debris', 'blood', 'tracks', 'footprints',
  'noise', 'sound', 'voice', 'voices', 'crowd', 'people', 'body', 'corpse', 'remains',
  'weapon', 'gear', 'equipment', 'armor', 'shield', 'cloak', 'boots', 'gloves',
  'companion', 'party', 'ally', 'allies', 'self', 'myself', 'yourself', 'horizon',
  'sky', 'trees', 'forest', 'water', 'river', 'lake', 'sea', 'cave', 'tunnel',
  'nearest enemy', 'active threat', 'immediate threat',
]);

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function addNameTokens(names: Set<string>, name: string) {
  const normalized = normalize(name);
  if (normalized) names.add(normalized);
}

/** Engine records only: person / creature / item / exit tags and the SCENE lists. Prose is not a record. */
export function buildGroundingCorpus(state: GameState, _storyProse = ''): Set<string> {
  const names = new Set<string>();
  for (const item of state.inventory ?? []) addNameTokens(names, item.name);
  for (const mat of state.materials ?? []) addNameTokens(names, mat.name);
  for (const bag of state.containers ?? []) addNameTokens(names, bag.name);
  for (const companion of state.companions ?? []) addNameTokens(names, companion.name);
  for (const card of state.lorebook ?? []) {
    if (card.type === 'npc' || card.revealed === true || (card.lastSeenTurn ?? 0) > 0) addNameTokens(names, card.name);
  }
  if (state.activeEncounter?.name) addNameTokens(names, state.activeEncounter.name);
  if (state.currentLocation) addNameTokens(names, state.currentLocation);
  if (state.locationSheet?.name) addNameTokens(names, state.locationSheet.name);
  for (const it of state.locationSheet?.interactables ?? []) addNameTokens(names, it.name ?? '');
  for (const exit of state.locationSheet?.exits ?? []) addNameTokens(names, exit.label ?? '');
  for (const p of state.sceneFacts?.present ?? []) addNameTokens(names, p);
  for (const p of state.sceneFacts?.props ?? []) addNameTokens(names, p);
  for (const mem of state.npcMemories ?? []) addNameTokens(names, mem.npcName);
  for (const rec of Object.values(state.entityRecords ?? {})) addNameTokens(names, rec.name);
  for (const fact of state.timeline ?? []) {
    if (fact.kind === 'person' || fact.kind === 'creature' || fact.kind === 'item' || fact.kind === 'exit' || fact.kind === 'combat') {
      addNameTokens(names, fact.name ?? '');
    }
  }
  return names;
}

function knownEntityNames(state: GameState, storyProse = ''): Set<string> {
  const names = buildGroundingCorpus(state, storyProse);
  for (const card of state.lorebook ?? []) {
    if (card.type === 'npc') addNameTokens(names, card.name);
  }
  return names;
}

function inventoryCatalog(state: GameState): string[] {
  return [
    ...state.inventory.map((i) => normalize(i.name)),
    ...state.materials.map((m) => normalize(m.name)),
    ...(state.containers ?? []).map((c) => normalize(c.name)),
  ];
}

/** Scene props / interactables / loose loot — lying here is not an inventory USE claim. */
function sceneCatalog(state: GameState): string[] {
  const names: string[] = [];
  for (const p of state.sceneFacts?.props ?? []) names.push(normalize(p));
  for (const it of state.locationSheet?.interactables ?? []) {
    if (it.name) names.push(normalize(it.name));
  }
  const node = state.activeDungeon?.nodes.find((n) => n.id === state.activeDungeon?.currentNodeId);
  for (const loose of node?.hidden?.looseItems ?? []) names.push(normalize(loose.label));
  return names.filter(Boolean);
}

function catalogHasName(catalog: string[], claimed: string): boolean {
  const needle = normalize(claimed);
  if (!needle) return true;
  const claimWords = needle.split(/\s+/).filter(Boolean);
  for (const name of catalog) {
    if (name === needle || name.includes(needle) || needle.includes(name)) return true;
    if (claimWords.length !== 1) continue;
    const token = claimWords[0]!;
    for (const part of name.split(/\s+/)) {
      if (part === token || (token.length >= 3 && (part.endsWith(token) || token.endsWith(part)))) return true;
    }
  }
  return false;
}

function isDeixisObjectClaim(claimed: string): boolean {
  const first = normalize(claimed).split(/\s+/)[0] ?? '';
  return DEIXIS_OBJECT.has(first);
}

/** Shared GENERIC_SCENE_NOUNS fold (boot↔boots) — instrument of `with`, not a bag item. */
function isGenericSceneNounClaim(claimed: string): boolean {
  const key = normalize(claimed);
  if (!key) return true;
  if (GENERIC_SCENE_NOUNS.has(key) || NON_ITEM_TOKENS.has(key) || GENERIC_SCENE_ROLES.has(key)) return true;
  if (key.endsWith('s') && key.length > 1 && GENERIC_SCENE_NOUNS.has(key.slice(0, -1))) return true;
  if (GENERIC_SCENE_NOUNS.has(`${key}s`)) return true;
  return false;
}

export function inventoryHasItem(state: GameState, claimed: string): boolean {
  const needle = normalize(claimed);
  if (!needle || NON_ITEM_TOKENS.has(needle)) return true;

  if (
    needle === 'weapon' || needle === 'armor' || needle === 'consumable'
    || needle === 'material' || needle === 'container' || needle === 'accessory' || needle === 'quest'
    || needle === 'blade'
  ) {
    const kind = needle === 'blade' ? 'weapon' : needle;
    return (state.inventory ?? []).some((i) => i.itemType === kind);
  }
  return catalogHasName(inventoryCatalog(state), claimed);
}

/** Bound use/draw/wield object or `with` instrument; never a following `to`/`and`/`on` clause. */
function boundItemObjectPhrase(claimed: string, state: GameState): string {
  const n = normalize(claimed);
  if (!n) return n;
  const words = n.split(/\s+/).filter(Boolean);
  let end = words.length;
  const toAt = words.indexOf('to');
  if (toAt > 0) end = Math.min(end, toAt);
  const andAt = words.indexOf('and');
  if (andAt > 0) end = Math.min(end, andAt);
  const onAt = words.indexOf('on');
  if (onAt > 0) end = Math.min(end, onAt);
  const coreWords = words.slice(0, end);
  if (!coreWords.length) return n;
  const core = coreWords.join(' ');
  if (inventoryHasItem(state, core)) return core;
  for (let len = coreWords.length - 1; len >= 1; len--) {
    const prefix = coreWords.slice(0, len).join(' ');
    if (inventoryHasItem(state, prefix)) return prefix;
  }
  return core;
}

function collectUnsupportedClaims(input: string, state: GameState, patterns: RegExp[]): string[] {
  const claims: string[] = [];
  const scene = sceneCatalog(state);
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      const claimed = boundItemObjectPhrase((m[1] ?? '').trim(), state);
      const key = normalize(claimed);
      if (!claimed || NON_ITEM_TOKENS.has(key) || GENERIC_SCENE_ROLES.has(key)) continue;
      // Pronoun / deixis ("toss it up") is not an inventory name.
      if (isDeixisObjectClaim(claimed)) continue;
      // Thing lying in the scene (cobble on the road) is scenery, not a bag claim.
      if (catalogHasName(scene, claimed)) continue;
      // Instrument `with` that is really an NP attribute of a scene prop ("book with the palace seal").
      const matched = (m[0] ?? '').trimStart();
      const isWithInstrument = matched.length >= 5 && matched.slice(0, 5).toLowerCase() === 'with ';
      if (isWithInstrument) {
        // Body / worn / generic scene noun as instrument ("with my boot") is not a bag USE/EQUIP/GIVE.
        if (isGenericSceneNounClaim(claimed)) continue;
        const parts: string[] = [];
        for (const raw of input.slice(0, m.index).trimEnd().split(' ')) {
          if (raw) parts.push(raw);
        }
        let headPhrase: string | null = null;
        for (let n = 4; n >= 2; n--) {
          if (n > parts.length) continue;
          const slice = parts.slice(parts.length - n);
          const d = slice[0]!.toLowerCase();
          if (d === 'a' || d === 'an' || d === 'the' || d === 'my' || d === 'your') {
            headPhrase = slice.join(' ');
            break;
          }
        }
        if (headPhrase) {
          const npWords: string[] = [];
          for (const w of normalize(`${headPhrase} ${matched}`).split(' ')) {
            const l = w.toLowerCase();
            if (!w || l === 'a' || l === 'an' || l === 'the') continue;
            npWords.push(w);
          }
          const npBare = npWords.join(' ');
          let sceneAttr = false;
          if (npBare) {
            for (const known of buildGroundingCorpus(state)) {
              const kWords: string[] = [];
              for (const w of normalize(known).split(' ')) {
                const l = w.toLowerCase();
                if (!w || l === 'a' || l === 'an' || l === 'the') continue;
                kWords.push(w);
              }
              const k = kWords.join(' ');
              if (k === npBare || k.includes(npBare) || npBare.includes(k)) {
                sceneAttr = true;
                break;
              }
            }
          }
          if (sceneAttr) continue;
        }
      }
      if (!inventoryHasItem(state, claimed)) claims.push(claimed);
    }
  }
  return claims;
}

function collectNamedWeaponClaims(input: string, state: GameState): string[] {
  const claims: string[] = [];
  const re = new RegExp(NAMED_WEAPON.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const claimed = (m[1] ?? '').trim();
    if (!claimed) continue;
    if (!inventoryHasItem(state, claimed)) claims.push(claimed);
  }
  return claims;
}

/** Player-input item claims absent from structured inventory (GM context gate). */
export function findUnsupportedItemClaims(input: string, state: GameState): string[] {
  const claims = [
    ...collectUnsupportedClaims(input, state, [ITEM_USE_CLAIM, WEAPON_USE_CLAIM, ITEM_POSSESSION_CLAIM]),
    ...collectNamedWeaponClaims(input, state),
  ];
  return Array.from(new Set(claims.map(normalize)));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Narrative item claims: only PC-tied gear counts as missing (not scene/NPC weapons). */
export function findUnsupportedNarrativeItemClaims(narrative: string, state: GameState): string[] {
  const pc = (state.character?.name ?? '').trim();
  const pcAlt = pc ? `|${escapeRegExp(pc)}'s` : '';
  const pcSubject = pc ? `|${escapeRegExp(pc)}` : '';
  const claims: string[] = [];
  for (const sentence of narrative.split(/(?<=[.!?])\s+/)) {
    const pcIsSubject = new RegExp(`^\\W*(?:you|i${pcSubject})\\b`, 'i').test(sentence);
    const verbClaims = pcIsSubject
      ? collectUnsupportedClaims(sentence, state, [ITEM_USE_CLAIM, WEAPON_USE_CLAIM, ITEM_POSSESSION_CLAIM])
      : [];
    const owned = collectNamedWeaponClaims(sentence, state).filter((claimed) =>
      new RegExp(`\\b(?:your|my${pcAlt})\\s+(?:[\\w'-]+\\s+){0,2}${escapeRegExp(claimed)}\\b`, 'i').test(sentence)
    );
    claims.push(...verbClaims, ...owned);
  }
  return Array.from(new Set(claims.map(normalize)));
}

/** Pre-GM hard-gate item-use claims (not exploratory named-weapon mentions). */
export function findHardItemUseClaims(input: string, state: GameState): string[] {
  const claims = collectUnsupportedClaims(input, state, [
    ITEM_USE_CLAIM,
    WEAPON_USE_CLAIM,
    ITEM_POSSESSION_CLAIM,
  ]);
  return Array.from(new Set(claims.map(normalize)));
}

function isTokenGrounded(claimed: string, corpus: Set<string>): boolean {
  const needle = normalize(claimed);
  if (!needle) return true;
  if (GENERIC_SCENE_NOUNS.has(needle)) return true;
  if (corpus.has(needle)) return true;
  const parts = needle.split(/\s+/).filter((p) => p && !GENERIC_SCENE_NOUNS.has(p));
  if (parts.length === 0) return true;
  if (parts.every((p) => corpus.has(p))) return true;
  for (const known of corpus) {
    const words = known.split(/\s+/);
    let hit = true;
    for (const p of parts) if (!words.includes(p)) { hit = false; break; }
    if (hit) return true;
  }
  return false;
}

/** Named interactables/creatures in a choice absent from state/timeline/prose. */
export function findUngroundedNamedClaims(
  text: string,
  state: GameState,
  storyProse = ''
): string[] {
  const corpus = buildGroundingCorpus(state, storyProse);
  const claims: string[] = [];
  for (const pattern of [NAMED_INTERACTABLE_CLAIM, NAMED_THREAT_CLAIM]) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const claimed = (m[1] ?? '').trim();
      if (!claimed) continue;
      // q75r: pronoun/deixis object of open/pick-up ("open it to see…") is not a named target.
      const first = normalize(claimed).split(' ')[0] ?? '';
      if (
        first === 'it' ||
        first === 'them' ||
        first === 'him' ||
        first === 'her' ||
        first === 'this' ||
        first === 'that' ||
        first === 'those' ||
        first === 'these'
      ) {
        continue;
      }
      if (!isTokenGrounded(claimed, corpus)) claims.push(claimed);
    }
  }
  return Array.from(new Set(claims.map(normalize)));
}

export function referencesAbsentCompanion(text: string, state: GameState): boolean {
  const companions = state.companions ?? [];
  return COMPANION_REFERENCE.test(text) && companions.length === 0 && !COMPANION_ACQUISITION.test(text);
}

/**
 * Suggestions are untrusted model output. Reject actions whose premise requires a companion,
 * named actor, inventory item, gold amount, or invented scene object absent from grounding.
 */
export function isSuggestionValidForState(
  suggestion: string,
  state: GameState,
  storyProse = ''
): boolean {
  if (referencesAbsentCompanion(suggestion, state)) return false;

  const namedTarget = suggestion.match(NAMED_INTERACTION)?.[1];
  if (
    namedTarget
    && !GENERIC_SCENE_ROLES.has(normalize(namedTarget))
    && !knownEntityNames(state, storyProse).has(normalize(namedTarget))
  ) {
    return false;
  }

  if (findUnsupportedItemClaims(suggestion, state).length > 0) return false;

  if (isLockedProgressionChoice(suggestion, state)) return false;

  if (findUngroundedNamedClaims(suggestion, state, storyProse).length > 0) return false;

  const goldMatch = suggestion.match(GOLD_SPEND_CLAIM);
  if (goldMatch) {
    const amount = Number(goldMatch[1]);
    if (Number.isFinite(amount) && amount > (state.gold ?? 0)) {
      return false;
    }
  }

  return true;
}

/** Reject choices that advertise locked / level-gated System features. */
export function isLockedProgressionChoice(choice: string, state: GameState): boolean {
  const text = choice.toLowerCase();
  if (/\block(?:ed)?\b/.test(text) && /\b(level|skill|class|menu|studies|profession|feature)\b/.test(text)) {
    return true;
  }
  const gated = text.match(/level\s*(\d+)\s*\+/) || text.match(/requires?\s+level\s*(\d+)/);
  if (gated) {
    const need = Number(gated[1]);
    if (Number.isFinite(need) && need > (state.character?.level ?? 1)) return true;
  }
  return false;
}

export function fallbackSuggestionForState(state: GameState): string {
  if (state.activeEncounter) return 'Assess the enemy and surroundings';
  const recentNpc = (state.npcMemories ?? []).some(
    (m) => m.npcName?.trim() && (state.turn - (m.lastSeenTurn ?? 0)) <= 10
  );
  if (recentNpc || (state.companions ?? []).length > 0) return 'Ask what is going on';
  if (state.activeDungeon || state.currentLocation) return 'Inspect the immediate surroundings';
  return 'Observe the environment carefully';
}
