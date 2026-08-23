import { describe, expect, it } from 'vitest';
import fixtures from './__fixtures__/fluidChatEvalFixtures.json';
import { createInitialState } from './defaults';
import { detectActiveFolkIds, formatFolkVoiceForPrompt } from './folkVoiceExpectations';
import { formatFluidProseRailsForPrompt } from './fluidProseRails';
import { REPAIR_COPY_ROWS } from './repairCopyBank';
import { detectRepairSituation, pickRepairCopy } from './repairEngine';
import { formatSpeechActRailsForPrompt } from './speechActRails';

type EvalFixture = {
  id: string;
  name: string;
  category: string;
  player_input: string;
  assertions: string;
};

const LLM_CATEGORIES = new Set([
  'question_first',
  'coverage',
  'correction',
  'agency',
  'handoff',
  'combat',
  'kid_mode',
  'voice',
]);

describe('fluidChatEvalFixtures — metadata', () => {
  const list = (fixtures as { fixtures: EvalFixture[] }).fixtures;

  it('loads 44 fixtures with required fields', () => {
    expect((fixtures as { fixture_count: number }).fixture_count).toBe(44);
    expect(list).toHaveLength(44);
    for (const fx of list) {
      expect(fx.id, fx.id).toBeTruthy();
      expect(fx.name, fx.id).toBeTruthy();
      expect(fx.category, fx.id).toBeTruthy();
      expect(fx.player_input, fx.id).toBeTruthy();
      expect(fx.assertions, fx.id).toBeTruthy();
    }
  });

  it('asserts metadata for LLM-gated categories without skipping the file', () => {
    const llmFixtures = list.filter((fx) => LLM_CATEGORIES.has(fx.category));
    expect(llmFixtures.length).toBeGreaterThan(0);
    for (const fx of llmFixtures) {
      expect(fx.category.length).toBeGreaterThan(0);
      expect(fx.assertions.length).toBeGreaterThan(10);
    }
  });
});

describe('folkVoiceExpectations', () => {
  it('detects elf in appearance and formats prompt rail', () => {
    const state = createInitialState('Test', 'litrpg');
    state.character.appearance = 'A tall elven scout with silver hair';
    const ids = detectActiveFolkIds(state);
    expect(ids).toContain('elf');
    const block = formatFolkVoiceForPrompt(state);
    expect(block).toMatch(/elf/i);
    expect(block).toMatch(/Measured, image-rich/);
    expect(block).toMatch(/never changes stats/i);
  });

  it('does not false-positive elf inside self', () => {
    const state = createInitialState('Test', 'litrpg');
    state.character.appearance = 'A self-reliant courier with silver hair';
    expect(detectActiveFolkIds(state)).not.toContain('elf');
  });

  it('detects original LitRPG folk and smallfolk aliases', () => {
    const state = createInitialState('Test', 'litrpg');
    state.character.appearance = 'A mycelial ledgerborn glassborn tidebound woven ashkin with smallfolk kin';
    const ids = detectActiveFolkIds(state);
    expect(ids).toEqual(
      expect.arrayContaining([
        'mycelial',
        'ledgerborn',
        'glassborn',
        'tidebound',
        'woven',
        'ashkin',
        'smallfolk',
      ]),
    );
  });

  it('injects kid-mode folk lines and earned elf↔dwarf cue', () => {
    const state = createInitialState('Test', 'litrpg');
    state.character.appearance = 'An elf and a dwarf at the floodgate';
    const block = formatFolkVoiceForPrompt(state, { kidMode: true });
    expect(block).toMatch(/Kid —/);
    expect(block).toMatch(/Elf↔dwarf friction must be earned/);
    expect(block).toMatch(/no comic phonetic accents/i);
  });

  it('maps halfling label to smallfolk id', () => {
    const state = createInitialState('Test', 'litrpg');
    state.character.appearance = 'A stout halfling baker';
    expect(detectActiveFolkIds(state)).toContain('smallfolk');
  });
});

describe('fluidProseRails', () => {
  it('includes ANSWER FIRST and positive fluency rails', () => {
    const rails = formatFluidProseRailsForPrompt('litrpg');
    expect(rails).toMatch(/ANSWER FIRST/i);
    expect(rails).toMatch(/RHYTHM/i);
    expect(rails).toMatch(/VALUE FLOOR/i);
    expect(rails).toMatch(/MOMENTUM/i);
  });
});

describe('speechActRails', () => {
  it('includes ASK speech act', () => {
    const rails = formatSpeechActRailsForPrompt();
    expect(rails).toMatch(/\* ASK/);
  });
});

describe('repairEngine', () => {
  const base = createInitialState('Repair test', 'litrpg');

  it('detects safety OOC phrasing', () => {
    expect(detectRepairSituation('make this less intense please', base)).toBe('safety');
    expect(detectRepairSituation('tone down the gore', base)).toBe('safety');
  });

  it('detects protest phrasing', () => {
    expect(detectRepairSituation("that was not what I meant", base)).toBe('protest');
    expect(detectRepairSituation('wrong roll — unfair', base)).toBe('protest');
  });

  it('detects ambiguous short or-phrases', () => {
    expect(detectRepairSituation('the window or the door', base)).toBe('ambiguous_action');
    expect(detectRepairSituation('aside or through', base)).toBe('ambiguous_action');
  });

  it('does not treat room-layout door/window asks as ambiguous_action', () => {
    expect(
      detectRepairSituation('is there any other door ways or windows in the room', base)
    ).toBeNull();
    expect(detectRepairSituation('any other doorways or windows around here', base)).toBeNull();
  });

  it('does not treat panel explore / info-or-option asks as ambiguous_action', () => {
    expect(
      detectRepairSituation(
        'Explore the blue panel does that have any info or option in it?',
        base
      )
    ).toBeNull();
    expect(detectRepairSituation('check the panel for menus or buttons', base)).toBeNull();
  });
});

describe('repairCopyBank', () => {
  it('has CSV rows and pickRepairCopy returns non-empty message', () => {
    expect(REPAIR_COPY_ROWS.length).toBeGreaterThan(100);
    const copy = pickRepairCopy({
      situation: 'ambiguous_action',
      engineMode: 'litrpg',
      voiceId: 'cold-system',
      kidMode: false,
    });
    expect(copy.message.length).toBeGreaterThan(10);
    expect(copy.options?.[0]).toBeTruthy();
    expect(copy.options?.[1]).toBeTruthy();
  });

  it('maps rpg engine to story_rpg rows', () => {
    const copy = pickRepairCopy({
      situation: 'ambiguous_action',
      engineMode: 'rpg',
      voiceId: 'chilled-gm',
    });
    expect(copy.message).toMatch(/aside|through|crate/i);
  });

  it('maps dnd engine to tabletop rows', () => {
    const copy = pickRepairCopy({
      situation: 'protest',
      engineMode: 'dnd',
      voiceId: 'dry-wit',
    });
    expect(copy.message).toMatch(/threat|joke|guard/i);
  });
});
