/**
 * RC-VR1 part VR1-a — CheckSpec / checkForAction / EngineChip.check / result lines.
 * Tabletop only. Chip labels stay plain (feature-groups-plan §4); tags come from CheckSpec.
 * SRD 5.2.1 (Wizards of the Coast, CC BY 4.0): roll only when the outcome is uncertain.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { checkForAction, runPlayerCheck, type CheckSpec } from './checkMath';
import { checkSpecTag, formatPreRollLine, formatResultLine } from './rules/rollView';
import { engineChips } from './choicePipeline';
import type { PlayerIntent } from './intentParser';
import { parsePlayerIntent } from './intentParser';
import type { GameState } from './types';

const talk = { kind: 'talk' } as unknown as PlayerIntent;
const observe = { kind: 'observe' } as unknown as PlayerIntent;
const move = { kind: 'move' } as unknown as PlayerIntent;

function ttState(extra?: Partial<GameState>): GameState {
  const s = createInitialState('Ria', 'dnd');
  return {
    ...s,
    campaignBibleId: 'cursed-keep',
    character: {
      ...s.character,
      attributes: { STR: 14, DEX: 12, CON: 14, INT: 12, WIS: 12, CHA: 12 },
    },
    sceneFacts: {
      ...(s.sceneFacts ?? {}),
      present: ['the guard', 'Guard'],
      location: s.currentLocation,
    },
    arcDirector: {
      ...(s.arcDirector ?? {}),
      npcRelationships: [{ npcName: 'Guard', disposition: 'neutral' }],
    },
    ...extra,
  } as GameState;
}

describe('VR1-a checkForAction + CheckSpec', () => {
  it('VR1-1 chip keeps plain label; CheckSpec + tag live on EngineChip', () => {
    const s = ttState();
    const label = 'Persuade the guard';
    const intent = parsePlayerIntent(label, s);
    const spec = checkForAction(s, intent, label);
    expect(spec).not.toBeNull();
    expect(spec!.ability).toBe('CHA');
    expect(spec!.skill).toBe('persuasion');
    expect(spec!.dcShown).toBe(false);
    expect(checkSpecTag(spec!)).toBe('Charisma (Persuasion) roll');
    // Chip contract: label string is never rewritten with the skill tag.
    const chips = engineChips({
      ...s,
      turn: 3,
      openingEstablishment: { ...(s.openingEstablishment as object), complete: true } as GameState['openingEstablishment'],
      log: [
        ...(s.log ?? []),
        { id: 'g1', turn: 2, role: 'gm', content: 'The guard blocks the gate.', timestamp: 1 },
      ],
      choices: [label, 'Look around', 'Wait'],
    });
    const hit = chips.find((c) => c.label.toLowerCase() === label.toLowerCase())
      ?? chips.find((c) => c.check?.skill === 'persuasion');
    if (hit) {
      expect(hit.label).not.toMatch(/Charisma|Persuasion\) roll/);
      expect(hit.check?.skill).toBe('persuasion');
      expect(checkSpecTag(hit.check!)).toMatch(/Charisma \(Persuasion\) roll/);
    }
    // Renaming the label without changing the action text still yields the same spec shape.
    const renamed = checkForAction(s, talk, 'Convince the guard');
    expect(renamed?.ability).toBe(spec!.ability);
    expect(renamed?.skill).toBe(spec!.skill);
  });

  it('VR1-2 routine look / walk / exits carry no CheckSpec', () => {
    const s = ttState();
    expect(checkForAction(s, observe, 'Look around')).toBeNull();
    expect(checkForAction(s, observe, 'Check the exits')).toBeNull();
    expect(checkForAction(s, move, 'Walk on')).toBeNull();
    expect(checkForAction(s, talk, 'Ask what they want')).toBeNull();
  });

  it('VR1-3 typed equals chip CheckSpec', () => {
    const s = ttState();
    const chip = 'Persuade the guard';
    const typed = 'persuade the guard';
    const a = checkForAction(s, parsePlayerIntent(chip, s), chip);
    const b = checkForAction(s, parsePlayerIntent(typed, s), typed);
    expect(a).toEqual(b);
    expect(a?.ability).toBe('CHA');
    expect(a?.skill).toBe('persuasion');
    expect(a?.dcShown).toBe(false);
  });

  it('VR1-4 pre-roll hides DC; shows skill + rolling a d20', () => {
    const spec: CheckSpec = {
      kind: 'skill',
      ability: 'WIS',
      skill: 'perception',
      dc: 15,
      dcShown: false,
      adv: 'normal',
    };
    const line = formatPreRollLine(spec);
    expect(line).toBe('Wisdom (Perception) check — rolling a d20…');
    expect(line).not.toMatch(/DC\s*15/);
    expect(formatPreRollLine({ ...spec, dcShown: true })).toMatch(/DC 15/);
  });

  it('VR1-5 result line from CheckResultRecord; advantage shows both dice', () => {
    const s = ttState();
    const r = runPlayerCheck(s, talk, 'Persuade the guard', 13);
    expect(r.record).toBeTruthy();
    expect(r.record!.spec?.ability).toBe('CHA');
    expect(r.record!.spec?.dcShown).toBe(false);
    // Fixed d20 13, WIS+1 vs DC 15 — use Perception path for the exact acceptance string.
    const notice = runPlayerCheck(
      { ...s, character: { ...s.character, attributes: { ...s.character.attributes!, WIS: 12 } } },
      { kind: 'search' } as PlayerIntent,
      'Search the rubble',
      13,
    );
    expect(notice.record).toBeTruthy();
    expect(notice.modifier).toBe(1);
    expect(notice.dc).toBeGreaterThan(0);
    const line = formatResultLine({
      label: 'Perception',
      d20s: [13],
      kept: 13,
      advState: 'normal',
      mods: [{ label: 'WIS', value: 1 }],
      total: 14,
      dc: 15,
      outcome: 'failure',
      spec: { kind: 'skill', ability: 'WIS', skill: 'perception', dc: 15, dcShown: false, adv: 'normal' },
    });
    expect(line).toBe('d20 13 + 1 (WIS) = 14 vs DC 15 — failure');
    const adv = formatResultLine({
      label: 'Perception',
      d20s: [3, 17],
      kept: 17,
      advState: 'advantage',
      mods: [{ label: 'WIS', value: 1 }],
      total: 18,
      dc: 15,
      outcome: 'success',
    });
    expect(adv).toBe('d20 (adv: 3, 17) 17 + 1 (WIS) = 18 vs DC 15 — success');
  });

  it('VR1-9 suffix and roll come only from checkForAction (no label rewrite)', () => {
    const s = ttState();
    const chips = engineChips(s);
    for (const c of chips) {
      expect(c.label).not.toMatch(/\b(STR|DEX|CON|INT|WIS|CHA)\b/);
      expect(c.label).not.toMatch(/\)\s*roll$/i);
      if (c.check) expect(c.check.dcShown).toBe(false);
    }
  });
});
