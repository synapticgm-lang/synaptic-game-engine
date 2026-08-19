import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LITRPG_SYSTEM_PERSONALITY,
  GM_VOICE_FIREWALL,
  LITRPG_SYSTEM_PERSONALITIES,
  formatGmVoiceForPrompt,
  resolveLitrpgSystemPersonality,
  resolveVoiceIdForState,
} from './gmVoiceProfile';

describe('LitRPG System personality', () => {
  it('defaults New Game to cold registrar', () => {
    expect(DEFAULT_LITRPG_SYSTEM_PERSONALITY).toBe('cold-system');
    expect(resolveLitrpgSystemPersonality(undefined)).toBe('cold-system');
    expect(resolveLitrpgSystemPersonality('not-a-voice')).toBe('cold-system');
  });

  it('exposes five System cards and never names licensed series', () => {
    expect(LITRPG_SYSTEM_PERSONALITIES.map((p) => p.id)).toEqual([
      'cold-system',
      'dry-wit',
      'army-brief',
      'theatrical-jester',
      'chilled-gm',
    ]);
    const copy = LITRPG_SYSTEM_PERSONALITIES.map((p) =>
      `${p.litrpgLabel} ${p.litrpgTip} ${p.litrpgPromptRail}`
    ).join('\n');
    expect(copy).not.toMatch(/dungeon crawler carl|solo leveling|that time i got|sword art online|wotc|dungeons & dragons/i);
  });

  it('writes different rails per voice and keeps the firewall identical', () => {
    const rails = LITRPG_SYSTEM_PERSONALITIES.map((p) =>
      formatGmVoiceForPrompt(p.id, { engineMode: 'litrpg' })
    );
    expect(new Set(rails).size).toBe(rails.length);
    for (const rail of rails) {
      expect(rail).toContain(GM_VOICE_FIREWALL);
      expect(rail).toContain('in-world System');
      expect(rail).not.toContain('You are a person at this table');
    }
    const sarcastic = formatGmVoiceForPrompt('dry-wit', { engineMode: 'litrpg' });
    expect(sarcastic).toMatch(/Sarcastic System Patch/);
    expect(sarcastic).not.toMatch(/Dry sarcastic GM/);
    const cold = formatGmVoiceForPrompt('cold-system', { engineMode: 'litrpg' });
    expect(cold).toMatch(/Cold System registrar/);
  });

  it('lets the save stamp beat Settings, and old saves fall back to Settings', () => {
    expect(
      resolveVoiceIdForState(
        { engineMode: 'litrpg', systemPersonality: 'dry-wit' },
        'cold-system',
      )
    ).toBe('dry-wit');
    expect(
      resolveVoiceIdForState({ engineMode: 'litrpg' }, 'theatrical-jester')
    ).toBe('theatrical-jester');
    expect(resolveVoiceIdForState({ engineMode: 'litrpg' })).toBe('cold-system');
    expect(
      resolveVoiceIdForState({ engineMode: 'dnd', gmPersonality: 'army-brief' }, 'cold-system')
    ).toBe('army-brief');
  });
});
