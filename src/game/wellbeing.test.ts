/** Order S part 2: the wellbeing gauge reads the player, shows a card beside the turn, and keeps nothing but times. */
import { describe, expect, it } from 'vitest';
import { gaugeCheckIn, helplinesFor, readWellbeing, type WellbeingGauge } from './wellbeing';
import { mediatePlayerInput } from './inputMediation';
import { formatSessionZeroForPrompt } from './customTabletopRules';
import { advancePyoaSpine, spineSelfEnding, ensurePyoaSpine } from './pyoaSpine';
import { createInitialState } from './defaults';
import { rowProvenance } from './modelIds';

const HOUR = 3_600_000;
const GB = 'en-GB';
const turn = (g: WellbeingGauge, text: string, now: number, extra: { kid?: boolean; locale?: string } = {}) =>
  gaugeCheckIn(g, readWellbeing(text, { kid: extra.kid }), { now, locale: extra.locale ?? GB });

describe('wellbeing gauge (Order S part 2)', () => {
  it('reads speaker, target and framing: a character act is a theme, the player speaking as themselves is distress', () => {
    expect(readWellbeing('I turn my sword on myself').flags).toEqual(['theme']);
    expect(readWellbeing('honestly I want to die, nothing helps').flags).toContain('distress');
    expect(readWellbeing('my character wants to die').flags).not.toContain('distress');
    expect(readWellbeing('how many vials would I need to drink to die').flags).toContain('method');
    expect(readWellbeing('how do I kill the goblin chief').flags).toEqual([]);
    expect(readWellbeing("this is my last session, tell them I'm sorry").flags).toContain('farewell');
    expect(readWellbeing("there's no point in anything, everyone would be better off without me").flags).toContain('hopeless');
    expect(readWellbeing("I'm 14").under18).toBe(true);
    expect(readWellbeing("I'm 15 minutes from the gate").under18).toBe(false);
    expect(readWellbeing('Search the cellar').flags).toEqual([]);
  });

  it('the story turn always runs: distress is no longer a block', () => {
    const m = mediatePlayerInput('I want to die');
    expect(m.action).toBe('allow');
    expect(m.wellbeing?.flags).toContain('distress');
  });

  it('a pausable card never shows when check-ins are off; distress, method and farewell always do', () => {
    const g: WellbeingGauge = { themes: [1, 2], hopeless: [] };
    expect(gaugeCheckIn(g, readWellbeing('I stab myself'), { now: 3, checkInsOn: false }).card).toBeNull();
    expect(gaugeCheckIn({ themes: [], hopeless: [] }, readWellbeing('I want to die'), { now: 3, checkInsOn: false }).card?.pausable).toBe(false);
  });

  it('every save carries the self-harm-method Line, in every mode', () => {
    expect(formatSessionZeroForPrompt(null)).toContain('Lines (never include, not even off-screen or implied): self-harm method.');
  });

  it('O2: a self-aimed act in PYOA never takes a spine ending; the choice stays', () => {
    const s = ensurePyoaSpine({ ...createInitialState('t', 'pyoa'), campaignBibleId: 'thornferry-road' });
    expect(spineSelfEnding(s, 'I burn myself with the charter')).toBe(true);
    expect(advancePyoaSpine(s, 'I burn myself with the charter').pyoaSpine?.currentNodeId).toBe(s.pyoaSpine?.currentNodeId);
    expect(spineSelfEnding(s, 'Burn the charter')).toBe(false);
  });

  it('a flagged turn is never trainable', () => {
    expect(rowProvenance({ teacherModel: null, wellbeingFlagged: true })).toMatchObject({ training_ok: false, training_note: 'wellbeing-flagged turn' });
  });

  it('helplines by locale', () => {
    expect(helplinesFor('en-US')).toEqual(['988: call or text (free, 24/7)']);
    expect(helplinesFor('fr-FR')[0]).toMatch(/findahelpline\.com/);
    expect(turn({ themes: [], hopeless: [] }, 'how much would be a lethal dose', 0).card?.lines[0]).toMatch(/999/);
  });

  it('the window rolls: a fourth act after 24 h quiet can show again', () => {
    let g: WellbeingGauge = { themes: [], hopeless: [] };
    for (const t of [0, 1, 2]) g = turn(g, 'I stab myself', t * HOUR).gauge;
    expect(g.quietUntil).toBe(2 * HOUR + 24 * HOUR);
    const later = turn(g, 'I stab myself', 60 * HOUR);
    expect(later.card).toBeNull();
    expect(later.gauge.themes).toEqual([60 * HOUR]);
  });
});
