import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from './defaults';
import { pickSpeechVoice, proseForSpeech, sortSpeechVoices } from './useVoice';

describe('proseForSpeech', () => {
  it('keeps story and drops STATUS chrome', () => {
    const raw = 'The door creaks open.\nSTATUS: XP +12\nXP Gained: 12';
    const out = proseForSpeech(raw);
    expect(out).toContain('The door creaks open.');
    expect(out).not.toMatch(/STATUS/i);
    expect(out).not.toMatch(/XP Gained/i);
  });

  it('keeps italicized words instead of deleting them', () => {
    expect(proseForSpeech('She *whispers* the name.')).toBe('She whispers the name.');
  });

  it('unwraps dialogue tags and strips system blocks', () => {
    const raw = '<dialogue>Mara: "Wait."</dialogue> The hall is quiet. <system>HP 12/12</system>';
    const out = proseForSpeech(raw);
    expect(out).toContain('Mara');
    expect(out).toContain('The hall is quiet.');
    expect(out).not.toMatch(/HP 12/);
    expect(out).not.toMatch(/<dialogue>/i);
  });

  it('does not wipe a paragraph that contains one bracket pair', () => {
    const t = 'You see a crate [half-open] in the ash.';
    const out = proseForSpeech(t);
    expect(out).toContain('crate');
    expect(out).toContain('ash');
    expect(out).toContain('half-open');
  });

  it('strips registrar headers', () => {
    const out = proseForSpeech('[SYSTEM]\nA chime lands in your skull.');
    expect(out).toContain('A chime lands in your skull.');
    expect(out).not.toMatch(/\[SYSTEM\]/i);
  });

  it('returns empty for chrome-only text', () => {
    expect(proseForSpeech('STATUS: nothing\n[SYSTEM]')).toBe('');
  });
});

describe('pickSpeechVoice', () => {
  const voices = [
    { voiceURI: 'urn:fr', name: 'Marie', lang: 'fr-FR' },
    { voiceURI: 'urn:gb', name: 'Hazel', lang: 'en-GB' },
    { voiceURI: 'urn:us', name: 'Zira', lang: 'en-US' },
  ];

  it('uses a saved voiceURI when still present', () => {
    expect(pickSpeechVoice(voices, 'urn:gb')?.name).toBe('Hazel');
  });

  it('falls back to en-US when the saved voice is missing', () => {
    expect(pickSpeechVoice(voices, 'urn:gone')?.voiceURI).toBe('urn:us');
  });

  it('falls back to en-GB when there is no en-US', () => {
    const noUs = voices.filter((v) => v.lang !== 'en-US');
    expect(pickSpeechVoice(noUs, '')?.voiceURI).toBe('urn:gb');
  });

  it('matches a saved name if the URI changed', () => {
    expect(pickSpeechVoice(voices, 'Zira')?.voiceURI).toBe('urn:us');
  });

  it('returns null when the browser has no voices', () => {
    expect(pickSpeechVoice([], 'urn:us')).toBeNull();
  });
});

describe('sortSpeechVoices', () => {
  it('lists English voices first', () => {
    const sorted = sortSpeechVoices([
      { voiceURI: 'fr', name: 'Marie', lang: 'fr-FR' },
      { voiceURI: 'us', name: 'Zira', lang: 'en-US' },
    ]);
    expect(sorted[0].name).toBe('Zira');
  });
});

describe('ttsVoiceURI persist default', () => {
  it('starts empty so pickSpeechVoice can choose en-US/en-GB', () => {
    expect(createDefaultSettings().ttsVoiceURI).toBe('');
  });
});
