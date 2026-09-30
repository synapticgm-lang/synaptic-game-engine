import { describe, expect, it } from 'vitest';
import { createDefaultSettings, createInitialState } from './defaults';
import { buildMasterPrompt } from './masterPrompt';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { formatPerspectiveRule, pcPov } from './narrativePov';

function jaxState() {
  const s = createInitialState('Jax', 'litrpg');
  return { ...s, character: { ...s.character, name: 'Jax', gender: 'man' } };
}

describe('28n — hybrid POV is the default writer shape', () => {
  it('default settings are hybrid', () => {
    expect(createDefaultSettings().perspective).toBe('hybrid');
  });

  it('system prompt: story in close third person by name, System voice stays second person', () => {
    const prompt = buildMasterPrompt(jaxState(), createDefaultSettings(), []);
    expect(prompt).toMatch(/PERSPECTIVE: HYBRID/);
    expect(prompt).toMatch(/close third person on the player character\. Call them Jax and he\/him\/his/);
    expect(prompt).toMatch(/SYSTEM VOICE stays second person/);
    expect(prompt).toContain('"The blade catches bone. Jax feels the resistance."');
    expect(prompt).not.toContain('You feel the resistance');
  });

  it('second person stays available as a setting', () => {
    const prompt = buildMasterPrompt(jaxState(), { ...createDefaultSettings(), perspective: 'second-person' }, []);
    expect(prompt).toMatch(/PERSPECTIVE: SECOND PERSON/);
    expect(prompt).toContain('You feel the resistance');
  });

  it('writer packet + example reply follow the PC by name', () => {
    const state = jaxState();
    const packet = buildCompletedEventPacket(state, 'Look around');
    const facing = formatWriterFacingEvent(packet);
    expect(facing).toMatch(/past tense, close third person on Jax/);
    expect(facing).toMatch(/COMPLETED EVENT:\nJax /);
    expect(facing).toContain('where Jax was');
    expect(facing).not.toContain('where you were');
  });

  it('no locked name: role label, not "you"', () => {
    expect(formatPerspectiveRule(pcPov({ name: '' }))).toMatch(/the newcomer/);
  });
});
