import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LITRPG_SYSTEM_PERSONALITY,
  DEFAULT_PYOA_GM_PERSONALITY,
  DEFAULT_RPG_GM_PERSONALITY,
  DEFAULT_TABLETOP_GM_PERSONALITY,
  GM_VOICE_FIREWALL,
  GM_VOICE_PROFILES,
  LITRPG_FEATURED_SYSTEM_PERSONALITIES,
  LITRPG_SYSTEM_PERSONALITIES,
  LITRPG_SYSTEM_PERSONALITIES_SHOP,
  TABLETOP_GM_PERSONALITIES,
  TABLETOP_GM_PERSONALITIES_MORE,
  formatGmVoiceForPrompt,
  resolveLitrpgSystemPersonality,
  resolvePyoaGmPersonality,
  resolveRpgGmPersonality,
  resolveVoiceIdForState,
  suggestedThemeForVoice,
} from './gmVoiceProfile';
import { formatFluidProseRailsForPrompt } from './fluidProseRails';

describe('LitRPG System personality', () => {
  it('defaults New Game to cold registrar', () => {
    expect(DEFAULT_LITRPG_SYSTEM_PERSONALITY).toBe('cold-system');
    expect(resolveLitrpgSystemPersonality(undefined)).toBe('cold-system');
    expect(resolveLitrpgSystemPersonality('not-a-voice')).toBe('cold-system');
  });

  it('offers Simple four + Featured Cozy Brutal; theatrical stays off primary shop', () => {
    expect(LITRPG_SYSTEM_PERSONALITIES.map((p) => p.id)).toEqual([
      'cold-system',
      'dry-wit',
      'army-brief',
      'chilled-gm',
    ]);
    expect(LITRPG_FEATURED_SYSTEM_PERSONALITIES.map((p) => p.id)).toEqual(['cozy-brutal']);
    expect(LITRPG_SYSTEM_PERSONALITIES_SHOP.map((p) => p.id)).toEqual([
      'cold-system',
      'dry-wit',
      'army-brief',
      'chilled-gm',
      'cozy-brutal',
    ]);
    expect(LITRPG_SYSTEM_PERSONALITIES.some((p) => p.id === 'theatrical-jester')).toBe(false);
    for (const p of LITRPG_SYSTEM_PERSONALITIES_SHOP) {
      expect(p.litrpgLabel?.length, p.id).toBeGreaterThan(4);
      expect(p.litrpgTip?.length, p.id).toBeGreaterThan(40);
      expect(p.toneAddRail?.length, p.id).toBeGreaterThan(20);
      expect(p.neverLines?.length, p.id).toBeGreaterThan(2);
      expect(p.statusChromeHint?.length, p.id).toBeGreaterThan(10);
    }
    const copy = LITRPG_SYSTEM_PERSONALITIES_SHOP.map((p) =>
      `${p.litrpgLabel} ${p.litrpgTip} ${p.litrpgPromptRail ?? p.promptRail}`
    ).join('\n');
    expect(copy).not.toMatch(/dungeon crawler carl|solo leveling|that time i got|sword art online|wotc|dungeons & dragons/i);
  });

  it('writes different rails per voice and keeps the firewall identical', () => {
    const rails = LITRPG_SYSTEM_PERSONALITIES_SHOP.map((p) =>
      formatGmVoiceForPrompt(p.id, { engineMode: 'litrpg' })
    );
    expect(new Set(rails).size).toBe(rails.length);
    for (const rail of rails) {
      expect(rail).toContain(GM_VOICE_FIREWALL);
      expect(rail).toContain('NEVER-LINES:');
      expect(rail).toContain('STATUS chrome:');
      expect(rail).toContain('KEEP fluid rails');
      expect(rail).not.toContain('You are a person at this table');
    }
    for (const p of LITRPG_SYSTEM_PERSONALITIES) {
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

describe('Narrator shop (tabletop / RPG / PYOA)', () => {
  it('offers four Simple narrators and demotes Theatrical to More styles', () => {
    expect(DEFAULT_TABLETOP_GM_PERSONALITY).toBe('chilled-gm');
    expect(DEFAULT_RPG_GM_PERSONALITY).toBe('chilled-gm');
    expect(DEFAULT_PYOA_GM_PERSONALITY).toBe('army-brief');
    expect(TABLETOP_GM_PERSONALITIES.map((p) => p.id)).toEqual([
      'chilled-gm',
      'dry-wit',
      'army-brief',
      'fireside-innkeep',
    ]);
    expect(TABLETOP_GM_PERSONALITIES_MORE.map((p) => p.id)).toEqual(['theatrical-jester']);
    expect(TABLETOP_GM_PERSONALITIES.some((p) => p.id === 'theatrical-jester')).toBe(false);
    expect(TABLETOP_GM_PERSONALITIES.find((p) => p.id === 'chilled-gm')?.label).toBe('Friendly Guide');
    expect(TABLETOP_GM_PERSONALITIES.find((p) => p.id === 'fireside-innkeep')?.label).toBe(
      'Fireside Chronicler'
    );
    expect(TABLETOP_GM_PERSONALITIES.find((p) => p.id === 'army-brief')?.label).toBe('Mission Lead');
  });

  it('stamps RPG and PYOA narrator from save with mode defaults', () => {
    expect(resolveRpgGmPersonality(undefined)).toBe('chilled-gm');
    expect(resolvePyoaGmPersonality(undefined)).toBe('army-brief');
    expect(
      resolveVoiceIdForState({ engineMode: 'rpg', gmPersonality: 'fireside-innkeep' }, 'cold-system')
    ).toBe('fireside-innkeep');
    expect(resolveVoiceIdForState({ engineMode: 'rpg' }, 'dry-wit')).toBe('dry-wit');
    expect(resolveVoiceIdForState({ engineMode: 'rpg' })).toBe('chilled-gm');
    expect(
      resolveVoiceIdForState({ engineMode: 'pyoa', gmPersonality: 'chilled-gm' }, 'army-brief')
    ).toBe('chilled-gm');
    expect(resolveVoiceIdForState({ engineMode: 'pyoa' })).toBe('army-brief');
  });

  it('embeds PYOA branching-crisis rail and non-binding theme suggestions', () => {
    const pyoa = formatGmVoiceForPrompt('army-brief', { engineMode: 'pyoa' });
    expect(pyoa).toMatch(/Branching Crisis/i);
    expect(pyoa).toContain('NEVER-LINES:');
    expect(suggestedThemeForVoice('cold-system')).toBe('phosphor-terminal');
    expect(suggestedThemeForVoice('cozy-brutal')).toBe('orc-warcamp');
    expect(suggestedThemeForVoice('fireside-innkeep')).toBe('parchment-ledger');
  });
});

describe('Cozy Brutal narrator voice', () => {
  it('is Featured on LitRPG New Game, not tabletop GM shop', () => {
    expect(GM_VOICE_PROFILES.some((p) => p.id === 'cozy-brutal')).toBe(true);
    expect(TABLETOP_GM_PERSONALITIES.some((p) => p.id === 'cozy-brutal')).toBe(false);
    expect(LITRPG_FEATURED_SYSTEM_PERSONALITIES.some((p) => p.id === 'cozy-brutal')).toBe(true);
    const p = GM_VOICE_PROFILES.find((x) => x.id === 'cozy-brutal')!;
    expect(p.label).toBe('Cozy Brutal');
    expect(p.litrpgLabel).toBe('Cozy Brutal');
    expect(p.featured).toBe(true);
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
    expect(kid).toMatch(/kid_plain_stakes/i);
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

describe('fluidProseRails firewall header', () => {
  it('preserves answer-first / one-beat / agency / earned-handoff and renderer firewall', () => {
    const rails = formatFluidProseRailsForPrompt('litrpg');
    expect(rails).toContain('RENDERER FIREWALL');
    expect(rails).toContain('ANSWER FIRST');
    expect(rails).toContain('ONE CLEAR BEAT');
    expect(rails).toContain('AGENCY');
    expect(rails).toContain('EARNED HANDOFF');
  });
});
