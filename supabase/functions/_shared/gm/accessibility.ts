/**
 * ACC-1: one central place for accessibility settings.
 * Text scale, contrast, motion and font are applied as classes / CSS variables on <html>
 * (see index.css "ACC-1" block and tailwind.config.js textColor tokens), so components
 * need no per-component patches. Sources: docs/design/accessibility-review.md.
 */

export const TEXT_SCALE_STEPS = [100, 125, 150, 175, 200] as const;
export type TextScale = (typeof TEXT_SCALE_STEPS)[number];
export type ReduceMotionPref = 'system' | 'on' | 'off';

export interface AccessibilitySettings {
  textScale?: TextScale;
  highContrast?: boolean;
  ttsRate?: number;
  ttsVolume?: number;
  readChoicesAloud?: boolean;
  reduceMotion?: ReduceMotionPref;
  readableFont?: boolean;
}

export const ACCESSIBILITY_DEFAULTS: Required<AccessibilitySettings> = {
  textScale: 100,
  highContrast: false,
  ttsRate: 1,
  ttsVolume: 1,
  readChoicesAloud: false,
  reduceMotion: 'system',
  readableFont: false,
};

export const TTS_RATE_MIN = 0.6;
export const TTS_RATE_MAX = 1.6;

export function normalizeTextScale(v: unknown): TextScale {
  return (TEXT_SCALE_STEPS as readonly number[]).includes(Number(v)) ? (Number(v) as TextScale) : 100;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** User rate multiplies the voice pack's own rate; result stays in a safe band. */
export function effectiveTtsRate(packRate: number, userRate?: number): number {
  const u = Number.isFinite(userRate) ? clamp(Number(userRate), TTS_RATE_MIN, TTS_RATE_MAX) : 1;
  return Math.round(clamp(packRate * u, 0.1, 10) * 100) / 100;
}

export function effectiveTtsVolume(userVolume?: number): number {
  return Number.isFinite(userVolume) ? clamp(Number(userVolume), 0, 1) : 1;
}

/** Choices appended as one more spoken fragment ("Your choices: A. B. C."). */
export function choicesSpeechLine(choices: readonly string[] | undefined | null): string | null {
  const list = (choices ?? []).map((c) => String(c ?? '').trim()).filter(Boolean);
  if (!list.length) return null;
  return `Your choices: ${list.map((c) => {
    const last = c.charAt(c.length - 1);
    return last === '.' || last === '!' || last === '?' ? c : `${c}.`;
  }).join(' ')}`;
}

export type SpeechPayload = { kind: 'sequence'; texts: string[] } | { kind: 'single'; text: string };

/** Adds the choices line when "Read choices aloud" is on; otherwise returns the payload unchanged. */
export function withChoicesSpeech<T extends { kind: string }>(
  speech: T,
  choices: readonly string[] | undefined | null,
  enabled: boolean | undefined,
): T | { kind: 'sequence'; texts: string[] } {
  const line = enabled ? choicesSpeechLine(choices) : null;
  if (!line) return speech;
  const s = speech as unknown as SpeechPayload;
  const texts = s.kind === 'sequence' ? s.texts : [s.text];
  return { kind: 'sequence', texts: [...texts, line] };
}

/** Screen-reader live region is skipped while TTS reads aloud, so beats aren't heard twice. */
export function liveRegionPoliteness(ttsEnabled: boolean): 'polite' | 'off' {
  return ttsEnabled ? 'off' : 'polite';
}

export function resolveReduceMotion(pref: ReduceMotionPref | undefined, systemPrefersReduced: boolean): boolean {
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return systemPrefersReduced;
}

export interface AccessibilityRootState {
  fontSizePercent: number;
  classes: Record<string, boolean>;
}

export const A11Y_CLASS = {
  highContrast: 'sgm-high-contrast',
  reduceMotion: 'sgm-reduce-motion',
  readableFont: 'sgm-readable-font',
} as const;

export function accessibilityRootState(s: AccessibilitySettings, systemPrefersReduced: boolean): AccessibilityRootState {
  return {
    fontSizePercent: normalizeTextScale(s.textScale ?? 100),
    classes: {
      [A11Y_CLASS.highContrast]: !!s.highContrast,
      [A11Y_CLASS.reduceMotion]: resolveReduceMotion(s.reduceMotion, systemPrefersReduced),
      [A11Y_CLASS.readableFont]: !!s.readableFont,
    },
  };
}

function systemPrefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Apply to <html>. Root font-size scales every rem (and px font sizes, converted to rem at build). */
export function applyAccessibilityToDocument(s: AccessibilitySettings, root: HTMLElement = document.documentElement): void {
  const st = accessibilityRootState(s, systemPrefersReducedMotion());
  if (st.fontSizePercent === 100) root.style.removeProperty('font-size');
  else root.style.setProperty('font-size', `${st.fontSizePercent}%`);
  for (const [cls, on] of Object.entries(st.classes)) root.classList.toggle(cls, on);
}

/** WCAG 2.x relative luminance contrast ratio for #rrggbb colours. */
export function contrastRatio(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const h = hex.replace('#', '');
    const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/**
 * Text colour tokens. Tailwind's text-slate-300..600 read these CSS variables
 * (tailwind.config.js), so changing them here and in index.css retunes every screen.
 * Keep this table in sync with the ACC-1 block in src/index.css (a test checks it).
 */
export const TEXT_TOKENS = {
  default: { 300: '#cbd5e1', 400: '#94a3b8', 500: '#8d9cb1', 600: '#8494a8' },
  highContrast: { 300: '#f8fafc', 400: '#f1f5f9', 500: '#e2e8f0', 600: '#e2e8f0' },
} as const;

export const DARK_SURFACES = { 'slate-950': '#020617', 'slate-900': '#0f172a', 'slate-800': '#1e293b' } as const;
