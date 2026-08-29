import type { GameEvent } from './parser';
import type { GameState } from './types';
import {
  inventoryHasItem,
  findUnsupportedItemClaims,
  findUngroundedNamedClaims,
} from './suggestionValidation';
import type { PlayerIntent } from './intentParser';
import { narrativeMentionsPlayerHarm } from './narrativeSanitize';
import { isUnresolvedActionNarrative } from './actionResolution';
import { detectSceneContradiction } from './sceneFacts';
import { detectFactLockViolations } from './factLocks';
import { resolveSeededRarity } from './dungeonSeed';
import { scrubInventedProperNouns } from './narrativeScrub';
import { applyProseWarden, applyProseWardenAsync, crowdSizeForWarden, collectSceneObjectNames } from './proseWarden';
import { hookLockForWarden } from './hookLock';
import { findManifestInventions } from './sceneManifest';
import { continuityStrict } from './opsKillSwitches';
import { isInteriorMap } from './placeAuthority';
import { listInteriorExitsFromHere } from './mapEngine';
import { isAloneArrivalOpening } from './openingEstablishment';
import { buildBindingConstraints, detectConstraintViolations, repairConstraintViolations } from './bindingConstraints';
import { isChromePersonToken } from './chromeAuthority';

export interface WardenResult {
  /** Events allowed after sheet checks. */
  events: GameEvent[];
  /** Human-readable rejection notes (also timeline-worthy). */
  notes: string[];
  /** Extra system-log lines to surface. */
  systemLogExtra: string[];
  /** Lore / quest events held as proposals only until player confirms (write-path). */
  deferredEvents: GameEvent[];
  /** Last-beat contradiction — caller must rewrite narrative. */
  continuityBreak?: string;
  /** Narrative after claim-grounding scrub (invented Proper Names softened). */
  scrubbedNarrative?: string;
}

const PEACEFUL_INTENTS = new Set<PlayerIntent['kind']>([
  'observe',
  'talk',
  'refuse',
  'move',
  'rest',
]);

function hasCombatContext(
  state: GameState,
  events: GameEvent[],
  intent?: PlayerIntent
): boolean {
  if (state.activeEncounter) return true;
  if (events.some((x) => x.type === 'enemy-appear')) return true;
  if (intent?.kind === 'attack' || intent?.kind === 'flee') return true;
  return false;
}

/**
 * Secondary validation pipeline: intercept structured GM claims against Fact Sheets
 * before they mutate state or reach the player as truth.
 * 
 * Pack 13: Now async to support optional LanguageTool grammar checking for High tier.
 */
export async function runWarden(
  state: GameState,
  events: GameEvent[],
  narrativeText: string,
  playerInput: string,
  intent?: PlayerIntent,
  establishedProse = ''
): Promise<WardenResult> {
  const notes: string[] = [];
  const systemLogExtra: string[] = [];
  const kept: GameEvent[] = [];
  const deferred: GameEvent[] = [];
  const combatOk = hasCombatContext(state, events, intent);
  const harmNarrated = narrativeMentionsPlayerHarm(narrativeText);

  for (const raw of events) {
    let e = raw;
    if (e.type === 'item-use') {
      const name = e.name ?? '';
      if (!name || !inventoryHasItem(state, name)) {
        notes.push(`Blocked item-use: "${name || e.id}" not in inventory`);
        systemLogExtra.push('Action failed: item not in inventory.');
        continue;
      }
    }

    if (e.type === 'item-gain') {
      const name = (e.name ?? '').trim();
      if (!name) {
        notes.push('Blocked empty item-gain');
        continue;
      }
      const level = state.character?.level ?? 1;
      const seededRarity = resolveSeededRarity(
        state.activeDungeon,
        name,
        e.rarity,
        state.lootPity,
        state.seed || 'seed'
      ).rarity;
      // Code-seeded dungeon loot may be Epic/Legendary even at low level — rarity was rolled at seed time.
      if (
        !seededRarity
        && level < 8
        && /\b(legendary|mythic|artifact|relic|unique|god(?:like)?|excalibur|vorpal|holy avenger)\b/i.test(name)
      ) {
        notes.push(`Blocked high-tier item-gain at level ${level}: ${name}`);
        systemLogExtra.push('Action failed: that gear is not available yet.');
        continue;
      }
      if (
        !seededRarity
        && level < 5
        && /\b(epic|legendary|mythic)\b/i.test(name)
      ) {
        notes.push(`Blocked epic+ item-gain at level ${level}: ${name}`);
        systemLogExtra.push('Action failed: that gear is not available yet.');
        continue;
      }
      // Peaceful intents shouldn't spontaneously invent weapons / major loot
      // (search / attack / use_item still allowed). Seeded room lootables may grant on search.
      if (
        intent &&
        PEACEFUL_INTENTS.has(intent.kind) &&
        !seededRarity &&
        /\b(sword|blade|gun|rifle|grenade|axe|bow|staff|wand|armor|shield|potion|elixir|artifact|relic)\b/i.test(
          name
        )
      ) {
        notes.push(`Deferred loot during ${intent.kind}: ${name}`);
        deferred.push(e);
        continue;
      }
      if (seededRarity && e.rarity !== seededRarity) {
        e = { ...e, rarity: seededRarity };
      }
    }

    if (e.type === 'damage' && (!e.amount || e.amount <= 0)) {
      notes.push('Blocked non-positive damage tag');
      continue;
    }

    if (e.type === 'heal' && (!e.amount || e.amount <= 0)) {
      notes.push('Blocked non-positive heal tag');
      continue;
    }

    // Damage requires combat context OR narrated harm with an established foe/appear.
    if (e.type === 'damage') {
      if (!combatOk) {
        notes.push('Blocked damage with no encounter / enemy-appear / attack intent');
        continue;
      }
      if (!harmNarrated && intent && PEACEFUL_INTENTS.has(intent.kind)) {
        notes.push('Blocked damage-without-narration on peaceful intent');
        continue;
      }
      if (!harmNarrated && !state.activeEncounter && !events.some((x) => x.type === 'enemy-appear')) {
        notes.push('Blocked damage-without-narration (no foe established in tags)');
        continue;
      }
    }

    // Spontaneous enemy-appear on pure observe/talk without prior threat cues → reject
    if (
      e.type === 'enemy-appear' &&
      intent &&
      (intent.kind === 'observe' || intent.kind === 'talk') &&
      !state.activeEncounter &&
      !/\b(creature|enemy|beast|monster|hostile|threat|ambush|attack)\b/i.test(narrativeText)
    ) {
      notes.push(`Blocked sudden enemy-appear during ${intent.kind}: ${e.enemyName ?? 'unnamed'}`);
      continue;
    }

    if (e.type === 'quest-update' || e.type === 'quest-complete') {
      const id = e.id;
      if (id && !(state.quests ?? []).some((q) => q.id === id)) {
        notes.push(`Blocked quest tag for unknown id: ${id}`);
        continue;
      }
    }

    // Write-path: brand-new lore cards & quest-adds are deferred into the proposal
    // (they still apply on Accept, but are labeled as proposed facts).
    if (e.type === 'lore-card' || e.type === 'quest-add') {
      deferred.push(e);
      kept.push(e); // still apply on accept via normal path; noted for UI
      notes.push(
        e.type === 'lore-card'
          ? `Proposed lore fact: ${e.name ?? 'card'}`
          : `Proposed quest: ${e.name ?? e.id}`
      );
      continue;
    }

    kept.push(e);
  }

  const narrativeClaims = findUnsupportedItemClaims(narrativeText, state);
  for (const claim of narrativeClaims) {
    notes.push(`Narrative referenced missing item: ${claim}`);
  }

  // Flag prose that names major entities not present in sheets/timeline (confirm UI surfaces these).
  const inventedInProse = findUngroundedNamedClaims(narrativeText, state, establishedProse);
  for (const claim of inventedInProse.slice(0, 4)) {
    if (
      /\b(dragon|lich|demon|artifact|relic|portal|kingdom|empire|ancient|legendary|boss)\b/i.test(
        claim
      ) ||
      claim.split(/\s+/).length >= 2
    ) {
      notes.push(`Prose may invent unestablished entity: ${claim}`);
    }
  }

  const scrub = scrubInventedProperNouns(narrativeText, state, establishedProse);
  const exits =
    state.activeDungeon && isInteriorMap(state.activeDungeon)
      ? listInteriorExitsFromHere(state.activeDungeon)
      : [];
  const doorish = exits.filter((e) => e.kind === 'door' || e.kind === 'stairs');
  
  // Pack 12 Extended Warden Context
  const prevFacts = state.previousSceneFacts;
  
  // Pack 13: Enable grammar check for High tier (capacityTier === 'high')
  const enableGrammarCheck = (state.capacityTier ?? 'free') === 'high';
  
  const wardenCtx = {
    currentLocation: state.locationSheet?.name || state.currentLocation,
    aloneArrival: isAloneArrivalOpening(state),
    hasMappedDoorExits: doorish.length > 0,
    adjacentRoomNames: exits.map((e) => e.name),
    crowdSize: crowdSizeForWarden(state, narrativeText),
    crowdPresent:
      state.sceneFacts?.crowd === 'present' ||
      state.sceneFacts?.crowd === 'sparse' ||
      crowdSizeForWarden(state, narrativeText) > 0,
    currentTimeOfDay: state.sceneFacts?.timeOfDay,
    previousTimeOfDay: prevFacts?.timeOfDay,
    isIndoor: state.sceneFacts?.indoor,
    wasIndoor: prevFacts?.indoor,
    currentTension: state.sceneFacts?.tension,
    previousTension: prevFacts?.tension,
    enableGrammarCheck,
    inventory: state.inventory,
    sceneProps: collectSceneObjectNames(state),
    lastGmProse:
      [...(state.log ?? [])].reverse().find((e) => e.role === 'gm')?.content ?? '',
    presentNames: (state.sceneFacts?.present ?? []).filter(
      (n) => typeof n === 'string' && n.trim().length >= 2 && !isChromePersonToken(n)
    ),
    groundedWeapons: undefined,
    playerName: state.character?.name,
    hasLiveEncounter: !!state.activeEncounter,
    recentlyClearedEncounter:
      state.arcDirector?.lastEncounterClearedTurn === state.turn ||
      state.arcDirector?.lastEncounterClearedTurn === state.turn - 1,
    hookLock: hookLockForWarden(state, narrativeText),
  };
  
  const polishedBase = enableGrammarCheck
    ? await applyProseWardenAsync(scrub.text, wardenCtx)
    : applyProseWarden(scrub.text, wardenCtx);
  const constraints = buildBindingConstraints(state);
  const constraintHits = detectConstraintViolations(polishedBase, constraints);
  const polished = constraintHits.length
    ? repairConstraintViolations(polishedBase, constraints)
    : polishedBase;
  if (constraintHits.length) {
    for (const hit of constraintHits.slice(0, 4)) {
      notes.push(`Constraint repair: ${hit}`);
    }
  }
  if (scrub.stripped.length) {
    for (const name of scrub.stripped.slice(0, 6)) {
      notes.push(`Claim-ground scrub: ${name}`);
    }
  }

  // Strict mode: remaining multi-word invents vs Scene Manifest become a continuity break
  // so the turn can retry / cut rather than silently invent a cast.
  let manifestBreak: string | undefined;
  if (continuityStrict()) {
    const leftover = findManifestInventions(polished, state, playerInput);
    for (const name of leftover.slice(0, 4)) {
      notes.push(`Scene Manifest invent: ${name}`);
    }
    if (leftover.length >= 2) {
      manifestBreak = 'prose invents entities outside Scene Manifest';
      notes.push(`Continuity break: ${manifestBreak}`);
    }
  }

  const inputClaims = findUnsupportedItemClaims(playerInput, state);
  if (inputClaims.length) {
    notes.push(`Player claimed missing item(s): ${inputClaims.join(', ')}`);
  }

  const resolvedIntent = intent ?? { kind: 'other' as const, label: 'Free action', targets: [] };
  if (isUnresolvedActionNarrative(playerInput, polished, resolvedIntent)) {
    notes.push('Narrative does not resolve the player action');
  }

  const factLocks = detectFactLockViolations(state, polished, playerInput);
  for (const lock of factLocks) {
    notes.push(`Fact lock: ${lock.reason}`);
  }
  const continuityBreak =
    factLocks[0]?.reason
    ?? manifestBreak
    ?? detectSceneContradiction(state.sceneFacts, polished)
    ?? undefined;
  if (continuityBreak && !factLocks.length && continuityBreak !== manifestBreak) {
    notes.push(`Continuity break: ${continuityBreak}`);
  }

  if (
    /\b(?:cast|channel|expend)\b/i.test(playerInput) &&
    (state.character.mp ?? 0) <= 0 &&
    /\bspell|magic|mana\b/i.test(playerInput)
  ) {
    notes.push('Player attempted magic with 0 MP');
    systemLogExtra.push('Action failed: insufficient mana.');
  }

  // Strip enemy XML leftovers from counting as success if appear had no name
  for (const e of kept) {
    if (e.type === 'enemy-appear' && !e.enemyName?.trim()) {
      notes.push('Blocked unnamed enemy-appear');
    }
  }

  return {
    events: kept.filter((e) => !(e.type === 'enemy-appear' && !e.enemyName?.trim())),
    notes,
    systemLogExtra,
    deferredEvents: deferred,
    continuityBreak,
    scrubbedNarrative: polished !== narrativeText ? polished : undefined,
  };
}

/**
 * Strip spontaneous HP/MP absolute overrides from narrative regex extraction.
 * Combat HP must come from <damage>/<heal> tags; MP changes require cast/use_item intent.
 */
export function sanitizeExtractedCharacterUpdates(
  characterUpdates: Partial<GameState['character']> | undefined,
  intent?: PlayerIntent
): Partial<GameState['character']> | undefined {
  if (!characterUpdates) return undefined;
  const next = { ...characterUpdates };
  // Absolute HP/MP lines in prose are untrusted — tags + warden drive combat resources.
  delete next.hp;
  delete next.maxHp;
  if (intent?.kind !== 'cast' && intent?.kind !== 'use_item') {
    delete next.mp;
    delete next.maxMp;
  }
  // Progression is code-owned (sandbox / combat / applyCharacterXpGain) — never GM invent.
  delete next.xp;
  delete next.xpToNext;
  delete next.level;
  return next;
}
