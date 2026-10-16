import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ACCESSIBILITY_DEFAULTS,
  A11Y_CLASS,
  accessibilityRootState,
  resolveReduceMotion,
} from './accessibility';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
const modal = readFileSync(resolve(__dirname, '../components/SettingsModal.tsx'), 'utf8');


describe('ACC-1d: focus, motion, font', () => {
  it('global visible focus outline exists', () => {
    expect(css).toMatch(/:focus-visible\s*\{\s*outline: 3px solid/);
  });
  it('reduce motion follows the OS by default, setting overrides', () => {
    expect(resolveReduceMotion('system', true)).toBe(true);
    expect(resolveReduceMotion('system', false)).toBe(false);
    expect(resolveReduceMotion('on', false)).toBe(true);
    expect(resolveReduceMotion('off', true)).toBe(false);
    expect(css).toMatch(/html\.sgm-reduce-motion \*/);
  });
  it('readable font class uses WCAG 1.4.12 spacing', () => {
    const st = accessibilityRootState({ ...ACCESSIBILITY_DEFAULTS, readableFont: true }, false);
    expect(st.classes[A11Y_CLASS.readableFont]).toBe(true);
    expect(css).toMatch(/html\.sgm-readable-font body \{[^}]*line-height: 1\.5/);
  });
  it('choice and tab controls are real buttons (keyboard reachable)', () => {
    expect(modal).toMatch(/role="tab"/);
    expect(modal).not.toMatch(/<div[^>]*onClick=\{\(\) => setActiveTab/);
  });
});
