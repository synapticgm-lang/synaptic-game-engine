/**
 * One owner of the scene option count (DUPLICATION.md D5 / HISTORY.md H1).
 * LitRPG and story RPG: exactly 4. Tabletop: exactly 3.
 * Setup chips (class / stats / reward box / origin / tabletop creation) never enter this list.
 */
import type { AttributeKey, EngineMode, GameState } from './types';
import { allocateAffordanceSlots, collectSceneAffordances, isFreeInputChip } from './sceneAffordances';
import { rewardBoxPad } from './rules/achievements';
import { STAT_SYSTEM_CHOICE_CHIP, statChip, statPointPad } from './rules/abilityPoints';
import { CLASS_QUICK_START_CHIP, classChip, classOfferPad } from './rules/characterClass';
import { originPad } from './rules/rpgOrigin';
import { creationChips, tabletopCreationPending } from './tabletop/creationFlow';
import { isJourneyUnderway, journeyPads } from './travelJourney';

const LITRPG_STAT_KEYS: AttributeKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/**
 * Typed exceptions (death saves, first-fight triad, a road with a waiting threat).
 * None enabled: every normal scene turn uses {@link sceneOptionCount}.
 * Candidates for a later John decision: death-save pad, first-fight choice set, exclusive road threat.
 */
export type FinalOptionsException = 'none';

export function sceneOptionCount(mode: EngineMode | undefined): number {
  return mode === 'dnd' ? 3 : 4;
}

/** Labels that belong on the setup / System row, not the scene pad. */
export function setupOptionLabels(state: GameState): Set<string> {
  const out = new Set<string>();
  const add = (labels: string[] | null | undefined) => {
    for (const raw of labels ?? []) {
      const label = (raw ?? '').replace(/\s+/g, ' ').trim();
      if (label) out.add(label.toLowerCase());
    }
  };
  // Union every setup pad. LitRPG class/stat chips are never scene actions (same builders as the System row).
  add(classOfferPad(state));
  add(statPointPad(state));
  add(rewardBoxPad(state));
  if (state.engineMode === 'litrpg') {
    add(LITRPG_STAT_KEYS.map(statChip));
    add([STAT_SYSTEM_CHOICE_CHIP]);
    if (state.classOffer?.choices?.length) {
      add(state.classOffer.choices.map(classChip));
      add([CLASS_QUICK_START_CHIP]);
    }
  }
  add(originPad(state));
  if (tabletopCreationPending(state)) add(creationChips(state));
  return out;
}

export function isSetupOption(state: GameState, label: string): boolean {
  const low = (label ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  return !!low && setupOptionLabels(state).has(low);
}

/**
 * Final scene options shown to the player for this turn.
 * Draws only from the candidate list plus actions the engine already knows
 * (journey pads, then compileChoices) — no filler-label pool, streak cap, or cooldown.
 */
export function finalSceneOptions(state: GameState, candidates: string[]): string[] {
  const n = sceneOptionCount(state.engineMode);
  const setup = setupOptionLabels(state);
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (raw: string | null | undefined) => {
    if (out.length >= n) return;
    const label = (raw ?? '').replace(/\s+/g, ' ').trim();
    if (!label || isFreeInputChip(label)) return;
    const low = label.toLowerCase();
    if (setup.has(low) || seen.has(low)) return;
    seen.add(low);
    out.push(label);
  };

  for (const c of candidates) push(c);

  if (out.length < n && isJourneyUnderway(state)) {
    for (const c of journeyPads(state)) push(c);
  }

  if (out.length < n) {
    for (const a of allocateAffordanceSlots(collectSceneAffordances(state), undefined, state)) {
      push(a.label);
      if (out.length >= n) break;
    }
  }

  return out.slice(0, n);
}
