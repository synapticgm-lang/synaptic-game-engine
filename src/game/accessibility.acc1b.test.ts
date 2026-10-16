import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  A11Y_CLASS,
  DARK_SURFACES,
  TEXT_TOKENS,
  applyAccessibilityToDocument,
  contrastRatio,
} from './accessibility';
// @ts-expect-error plain JS config
import tailwindConfig from '../../tailwind.config.js';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

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

describe('ACC-1b: contrast tokens', () => {
  it('tailwind text-slate-300..600 read the central tokens', () => {
    const tc = tailwindConfig.theme.extend.textColor.slate;
    for (const k of ['300', '400', '500', '600']) expect(tc[k]).toContain(`--sgm-text-${k}`);
  });
  it('default body tokens meet WCAG AA 4.5:1 on slate-900/950 (and slate-800)', () => {
    for (const hex of Object.values(TEXT_TOKENS.default))
      for (const bg of Object.values(DARK_SURFACES)) expect(contrastRatio(hex, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it('high contrast tokens reach WCAG AAA 7:1', () => {
    for (const hex of Object.values(TEXT_TOKENS.highContrast))
      for (const bg of Object.values(DARK_SURFACES)) expect(contrastRatio(hex, bg)).toBeGreaterThanOrEqual(7);
  });
  it('index.css tokens match TEXT_TOKENS', () => {
    const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
    for (const [k, hex] of Object.entries(TEXT_TOKENS.default)) expect(css).toContain(`--sgm-text-${k}: ${rgb(hex)};`);
    const hc = css.slice(css.indexOf('html.sgm-high-contrast {'));
    for (const [k, hex] of Object.entries(TEXT_TOKENS.highContrast)) expect(hc).toContain(`--sgm-text-${k}: ${rgb(hex)};`);
  });
  it('high contrast toggles a class on <html>', () => {
    const r = fakeRoot();
    applyAccessibilityToDocument({ highContrast: true }, r as unknown as HTMLElement);
    expect(r._cls.has(A11Y_CLASS.highContrast)).toBe(true);
  });
  it('known before/after ratios', () => {
    expect(contrastRatio('#64748b', '#0f172a')).toBeLessThan(4.5); // old slate-500
    expect(contrastRatio('#475569', '#0f172a')).toBeLessThan(3); // old slate-600
  });
});
