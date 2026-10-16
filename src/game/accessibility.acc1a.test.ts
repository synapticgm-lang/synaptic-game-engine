import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import {
  applyAccessibilityToDocument,
  normalizeTextScale,
} from './accessibility';
import { createDefaultSettings } from './defaults';
// @ts-expect-error plain JS PostCSS plugin
import fontPxToRem, { fontPxToRemValue } from '../../postcss-font-px-to-rem.js';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
const modal = readFileSync(resolve(__dirname, '../components/SettingsModal.tsx'), 'utf8');

function fakeRoot() {
  const style = new Map<string, string>();
  const cls = new Set<string>();
  return {
    style: { setProperty: (k: string, v: string) => style.set(k, v), removeProperty: (k: string) => style.delete(k) },
    classList: { toggle: (c: string, on: boolean) => (on ? cls.add(c) : cls.delete(c)) },
    _style: style,
    _cls: cls,
  };
}

describe('ACC-1a: Accessibility tab + text scale', () => {
  it('settings default to 100% and persist as plain fields', () => {
    const s = createDefaultSettings();
    expect(s.textScale).toBe(100);
    expect(JSON.parse(JSON.stringify({ ...s, textScale: 175 })).textScale).toBe(175);
  });
  it('only allowed steps are accepted', () => {
    expect(normalizeTextScale(200)).toBe(200);
    expect(normalizeTextScale(130)).toBe(100);
    expect(normalizeTextScale(undefined)).toBe(100);
  });
  it('scale is applied as root font-size on <html> (rem-based, modals included)', () => {
    const r = fakeRoot();
    applyAccessibilityToDocument({ textScale: 200 }, r as unknown as HTMLElement);
    expect(r._style.get('font-size')).toBe('200%');
    applyAccessibilityToDocument({ textScale: 100 }, r as unknown as HTMLElement);
    expect(r._style.has('font-size')).toBe(false);
  });
  it('px font sizes become rem at build so they scale too (WCAG 1.4.4)', async () => {
    expect(fontPxToRemValue('10px')).toBe('0.625rem');
    const out = await postcss([fontPxToRem()]).process(
      '.a{font-size:10px;padding:10px}.text-\\[11px\\]{font-size:11px}html{font-size:16px}',
      { from: undefined },
    );
    expect(out.css).toContain('font-size:0.625rem');
    expect(out.css).toContain('padding:10px');
    expect(out.css).toContain('font-size:0.6875rem');
    expect(out.css).toContain('html{font-size:16px}');
  });
  it('the Settings modal has an Accessibility tab with a text size control', () => {
    expect(modal).toMatch(/id: 'accessibility', label: 'Accessibility'/);
    expect(modal).toMatch(/textScale/);
  });
});
