/**
 * TRAINLOOP3 — tabletop live fight must never leave only a dead "Look around" chip.
 * Run 12 (verdant-blight s8112): Face the threat spent the round Action; roundCombatChips
 * returned [] (truthy short-circuit) and Attack labels lacked fight:* ids so
 * applyOptionCooldown dropped them → empty pad → Fate Look around forever.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { commitOfferedPad, resolveOfferedChoices } from './playTranscript';
import { roundCombatChips } from './tabletop/combatChips';
import type { ActiveEncounter, GameState, Item, RoundCombatState } from './types';

function openTabletop(bibleId: string, seed = 8112): GameState {
  const { state } = buildNewGameState({
    bibleId,
    characterName: 'Jax',
    seed,
    personality: 'chilled-gm',
    engineMode: 'dnd',
  });
  return stampOpening(state);
}

function playReady(state: GameState): GameState {
  return {
    ...state,
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
      pending: [],
      complete: true,
      sceneWritten: true,
    },
    offeredPad: null,
  };
}

function banditEncounter(): ActiveEncounter {
  return {
    name: 'Bandit',
    level: 1,
    hp: 9,
    maxHp: 11,
    armorClass: 12,
    strength: 12,
    dexterity: 12,
    constitution: 12,
    xpReward: 100,
    goldReward: 16,
    encounterId: 'enc-bandit-trainloop3',
    phase: 'engaged',
    startedTurn: 26,
    engagedTurnCount: 1,
    failedFleeCount: 0,
    failedParleyCount: 0,
    maxEngagedTurns: 10,
    maxFailedFlee: 2,
    maxFailedParley: 2,
  };
}

function spentRound(encName: string): RoundCombatState {
  return {
    encounterName: encName,
    round: 2,
    pcInitiative: 21,
    foes: [
      {
        id: 'f1',
        name: encName,
        blockId: 'bandit',
        hp: 9,
        maxHp: 11,
        initiative: 13,
        conditions: [],
      },
    ],
    pcConditions: [],
    budgetXp: 50,
    dodging: false,
    pcEconomy: {
      actionAvailable: false,
      bonusAvailable: true,
      movementFt: 30,
      reactionAvailable: true,
    },
  };
}

function withLiveFight(state: GameState, spent = true): GameState {
  const srd =
    state.character?.srd
    ?? ({
      speciesId: 'human',
      classId: 'fighter',
      skillProfs: [],
      expertise: [],
    } as unknown as NonNullable<GameState['character']>['srd']);
  const hasWeapon = (state.inventory ?? []).some((i) =>
    /mace|sword|dagger|axe|bow|staff|hammer/i.test(i.name),
  );
  const inventory: Item[] = hasWeapon
    ? (state.inventory ?? [])
    : [
        ...(state.inventory ?? []),
        {
          id: 'tl3-mace',
          name: 'Mace',
          equipped: true,
          quantity: 1,
          slot: 'main-hand',
        } as Item,
      ];
  const enc = banditEncounter();
  return {
    ...state,
    engineMode: 'dnd',
    character: { ...state.character!, srd },
    inventory,
    activeEncounter: enc,
    pendingFirstFight: null,
    roundCombat: spent
      ? spentRound(enc.name)
      : {
          ...spentRound(enc.name),
          pcEconomy: {
            actionAvailable: true,
            bonusAvailable: true,
            movementFt: 30,
            reactionAvailable: true,
          },
        },
    offeredPad: null,
    choices: [],
  };
}

function forwardFightLabels(labels: string[]): string[] {
  return labels.filter(
    (l) =>
      /^Attack\b/i.test(l)
      || /^Disengage\b/i.test(l)
      || /^Dodge$/i.test(l)
      || /^Press the attack$/i.test(l)
      || /^Try to flee$/i.test(l)
      || /^Face the threat$/i.test(l),
  );
}

describe('TRAINLOOP3 Verdant Blight fight pad (run 12)', () => {
  it('spent-economy Bandit fight at Village Moot never leaves only Look around', () => {
    const opened = playReady(openTabletop('verdant-blight', 8112));
    const fought = withLiveFight({ ...opened, currentLocation: 'Village Moot' }, true);
    expect(fought.character?.srd).toBeTruthy();
    expect(fought.activeEncounter?.phase).toBe('engaged');
    expect(fought.roundCombat?.pcEconomy?.actionAvailable).toBe(false);

    const round = roundCombatChips(fought) ?? [];
    const offered = resolveOfferedChoices(fought);
    const padState = commitOfferedPad(fought);
    const labels = padState.offeredPad?.choices ?? offered;
    const forward = forwardFightLabels(labels);

    expect(
      round.some((c) => /^Attack/i.test(c)),
      `verdant-blight:Village Moot:round=[${round.join(' | ')}]`,
    ).toBe(true);
    expect(
      forward.length,
      `verdant-blight:Village Moot:no-forward-fight-chip offered=[${labels.join(' | ')}] ids=[${(padState.offeredPad?.chips ?? []).map((c) => c.actionId).join(',')}]`,
    ).toBeGreaterThan(0);
    expect(labels.length === 1 && /^Look around$/i.test(labels[0]!)).toBe(false);
    expect(labels).not.toEqual([]);
  });
});

describe('TRAINLOOP3 tabletop live-fight pad sweep', () => {
  it('every premade tabletop world: spent-economy live fight keeps a forward fight chip', () => {
    const holes: string[] = [];
    let worlds = 0;
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (bible.engineMode !== 'dnd') continue;
      if (bible.id.startsWith('blank-canvas')) continue;
      worlds += 1;
      let opened: GameState;
      try {
        opened = playReady(openTabletop(bible.id, 8112));
      } catch (err) {
        holes.push(`${bible.id}:open-failed:${(err as Error).message ?? err}`);
        continue;
      }
      const place = (opened.currentLocation ?? 'HERE').trim() || 'HERE';
      const fought = withLiveFight(opened, true);
      if (!fought.character?.srd) {
        holes.push(`${bible.id}:${place}:no-srd`);
        continue;
      }
      const padState = commitOfferedPad(fought);
      const labels = padState.offeredPad?.choices ?? resolveOfferedChoices(fought);
      const chips = padState.offeredPad?.chips ?? [];
      const forward = forwardFightLabels(labels);
      if (!labels.length) {
        holes.push(`${bible.id}:${place}:empty-pad`);
        continue;
      }
      if (labels.length === 1 && /^Look around$/i.test(labels[0]!)) {
        holes.push(`${bible.id}:${place}:only-look-around`);
        continue;
      }
      if (!forward.length) {
        holes.push(
          `${bible.id}:${place}:no-forward-fight-chip offered=[${labels.join(' | ')}] actionIds=[${chips.map((c) => `${c.label}:${c.actionId}`).join(' | ')}]`,
        );
      }
      for (const c of chips) {
        if (forwardFightLabels([c.label]).length && !(c.actionId ?? '').startsWith('fight:')) {
          holes.push(`${bible.id}:${place}:unbound-fight-chip:${c.label}:${c.actionId}`);
        }
      }
    }
    expect(worlds, 'expected tabletop worlds').toBeGreaterThan(3);
    expect(holes, holes.join('\n') || 'ok').toEqual([]);
  });
});
