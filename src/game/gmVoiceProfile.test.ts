import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LITRPG_SYSTEM_PERSONALITY,
  GM_VOICE_FIREWALL,
  GM_VOICE_PROFILES,
  LITRPG_SYSTEM_PERSONALITIES,
  TABLETOP_GM_PERSONALITIES,
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

  it('offers System / narration cards with a short explanation and never names licensed series', () => {
    expect(LITRPG_SYSTEM_PERSONALITIES.map((p) => p.id)).toEqual([
      'cold-system',
      'dry-wit',
      'army-brief',
      'chilled-gm',
      'cozy-brutal',
    ]);
    for (const p of LITRPG_SYSTEM_PERSONALITIES) {
      expect(p.litrpgLabel?.length, p.id).toBeGreaterThan(4);
      expect(p.litrpgTip?.length, p.id).toBeGreaterThan(40);
    }
    const copy = LITRPG_SYSTEM_PERSONALITIES.map((p) =>
      `${p.litrpgLabel} ${p.litrpgTip} ${p.litrpgPromptRail ?? p.promptRail}`
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
      expect(rail).not.toContain('You are a person at this table');
    }
    for (const p of LITRPG_SYSTEM_PERSONALITIES.filter((x) => x.id !== 'cozy-brutal')) {
      const rail = formatGmVoiceForPrompt(p.id, { engineMode: 'litrpg' });
      expect(rail).toContain('in-world System');
    }
    const cozy = formatGmVoiceForPrompt('cozy-brutal', { engineMode: 'litrpg' });
    expect(cozy).toMatch(/narrative diction/i);
    expect(cozy).toMatch(/Status panels/i);
    expect(cozy).not.toContain('You are the in-world System');
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
      resolveVoiceIdForState(
        { engineMode: 'litrpg', systemPersonality: 'cozy-brutal' },
        'cold-system',
      )
    ).toBe('cozy-brutal');
    expect(
      resolveVoiceIdForState({ engineMode: 'litrpg' }, 'theatrical-jester')
    ).toBe('theatrical-jester');
    expect(resolveVoiceIdForState({ engineMode: 'litrpg' })).toBe('cold-system');
    expect(
      resolveVoiceIdForState({ engineMode: 'dnd', gmPersonality: 'army-brief' }, 'cold-system')
    ).toBe('army-brief');
  });
});

describe('Cozy Brutal narrator voice', () => {
  it('is in Settings and LitRPG New Game, not tabletop GM shop', () => {
    expect(GM_VOICE_PROFILES.some((p) => p.id === 'cozy-brutal')).toBe(true);
    expect(TABLETOP_GM_PERSONALITIES.some((p) => p.id === 'cozy-brutal')).toBe(false);
    expect(LITRPG_SYSTEM_PERSONALITIES.some((p) => p.id === 'cozy-brutal')).toBe(true);
    const p = GM_VOICE_PROFILES.find((x) => x.id === 'cozy-brutal')!;
    expect(p.label).toBe('Cozy Brutal');
    expect(p.litrpgLabel).toBe('Cozy Brutal');
    const banned = /azarinth|rhaegar|emulate the litrpg novel|wandering inn|solo leveling/i;
    expect(`${p.label} ${p.blurb} ${p.promptRail}`).not.toMatch(banned);
  });

  it('encodes perspective, cozy-brutal tone, and kid Mode gore soften', () => {
    const rail = formatGmVoiceForPrompt('cozy-brutal');
    expect(rail).toContain(GM_VOICE_FIREWALL);
    expect(rail).toMatch(/PERSPECTIVE/i);
    expect(rail).toMatch(/cozy-brutal/i);
    expect(rail).toMatch(/slice-of-life/i);
    expect(rail).not.toContain('Kid Mode Cozy Brutal');
    const kid = formatGmVoiceForPrompt('cozy-brutal', { kidMode: true });
    expect(kid).toContain('Kid Mode Cozy Brutal');
    expect(kid).toMatch(/broken bones/i);
    expect(kid).toMatch(/without gore detail/i);
  });

  it('lets Story RPG Settings pick cozy-brutal', () => {
    expect(
      resolveVoiceIdForState({ engineMode: 'rpg' }, 'cozy-brutal')
    ).toBe('cozy-brutal');
    expect(
      resolveVoiceIdForState({ engineMode: 'litrpg' }, 'cozy-brutal')
    ).toBe('cozy-brutal');
  });
});
