import { describe, expect, it } from 'vitest';
import { acceptSttNotice, STT_NOTICE_KEY, sttNoticeAccepted } from './sttNotice';

function memStore() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

describe('STT-N speech-to-text notice', () => {
  it('is not accepted on a fresh device', () => {
    expect(sttNoticeAccepted(memStore())).toBe(false);
  });
  it('stays accepted once the player chooses Use voice (shown once per device)', () => {
    const s = memStore();
    acceptSttNotice(s);
    expect(s.m.get(STT_NOTICE_KEY)).toBe('1');
    expect(sttNoticeAccepted(s)).toBe(true);
  });
  it('declining (never accepting) leaves recognition gated', () => {
    const s = memStore();
    expect(sttNoticeAccepted(s)).toBe(false);
    expect(sttNoticeAccepted(s)).toBe(false);
  });
  it('blocked storage reads as not accepted and never throws', () => {
    const bad = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(() => acceptSttNotice(bad)).not.toThrow();
    expect(sttNoticeAccepted(bad)).toBe(false);
  });
});
