/**
 * Maturity model (Pack 7) — extends existing violence/cursing settings.
 */

import type { Settings } from './types.ts';

export type MaturityTier = 'pg13' | 'mature';
export type DarkThemesLevel = 'none' | 'implied' | 'explored';

export interface MaturityToggles {
  maturityTier: MaturityTier;
  sexualContent: boolean;
  substanceUse: boolean;
  darkThemes: DarkThemesLevel;
}

export function defaultMaturityToggles(): MaturityToggles {
  return {
    maturityTier: 'pg13',
    sexualContent: false,
    substanceUse: true,
    darkThemes: 'implied',
  };
}

export function resolveMaturity(settings: Settings): MaturityToggles & {
  violenceLevel: Settings['violenceLevel'];
  cursingLevel: Settings['cursingLevel'];
  kid: boolean;
} {
  const kid = settings.contentMode === 'kid';
  return {
    maturityTier: kid ? 'pg13' : settings.maturityTier ?? 'pg13',
    sexualContent: kid ? false : !!settings.sexualContent,
    substanceUse: kid ? false : settings.substanceUse !== false,
    darkThemes: kid ? 'none' : settings.darkThemes ?? 'implied',
    violenceLevel: kid ? 'none' : settings.violenceLevel,
    cursingLevel: kid ? 'none' : settings.cursingLevel,
    kid,
  };
}

export function formatMaturityRules(settings: Settings, opts?: { nsfw?: boolean }): string {
  const m = resolveMaturity(settings);
  if (m.kid) return '';
  if (opts?.nsfw) {
    return [
      'CONTENT MATURITY (MANDATORY):',
      'This campaign is NSFW adult dark romance.',
      'SEXUAL CONTENT: explicit allowed when the player steers there. Do not fade to black by default.',
      'VIOLENCE: in-tone, including lethal and possessive scenes.',
      'Never involve minors. Honor PERSPECTIVE.',
    ].join('\n');
  }
  const lines = [
    `MATURITY TIER: ${m.maturityTier.toUpperCase()}`,
    `SEXUAL CONTENT: ${m.sexualContent ? 'allowed with fade-to-black' : 'none — fade or omit'}`,
    `SUBSTANCE USE: ${m.substanceUse ? 'allowed in fiction' : 'omit / off-screen'}`,
    `DARK THEMES: ${m.darkThemes}`,
  ];
  if (m.maturityTier === 'pg13') {
    lines.push(
      'PG-13: no sustained gore fetishization, no explicit sex, no hate speech in narration, dark themes only implied.'
    );
  } else {
    lines.push(
      'MATURE: graphic violence per violenceLevel; intimate fade-to-black unless sexualContent on; NPC prejudice only if darkThemes=explored — never player-directed hate.'
    );
  }
  return `CONTENT MATURITY (MANDATORY):\n${lines.join('\n')}`;
}

/** Soft rating rewrite candidates (not hard blocks). */
const SEX_EXPLICIT =
  /\b(have\s+sex\s+with|fuck\s+(?:her|him|them)|rape\b|explicit\s+sex)\b/i;
const GRAPHIC_GORE_ASK =
  /\b(dismember|eviscerat|torture\s+(?:in\s+detail|slowly)|describe\s+(?:the\s+)?gore)\b/i;

export type SoftRewrite = {
  rewritten: string;
  diegeticMessage: string;
};

/**
 * Rating-compliance rewrite before GM. Returns null if no rewrite needed.
 * Hard blocks stay in inputMediation.
 */
export function maybeRatingRewrite(
  raw: string,
  settings: Settings,
  opts?: { nsfw?: boolean },
): SoftRewrite | null {
  const m = resolveMaturity(settings);
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  if (!(opts?.nsfw && !m.kid) && !m.sexualContent && SEX_EXPLICIT.test(text)) {
    return {
      rewritten: 'I try to escalate the situation romantically, then pause at the System fade-to-black.',
      diegeticMessage:
        'System interprets: intimacy fades to black per your content settings. Proceed with that intent?',
    };
  }

  if (m.violenceLevel === 'none' && GRAPHIC_GORE_ASK.test(text)) {
    return {
      rewritten: 'I try to stop the threat without graphic violence — restrain or escape.',
      diegeticMessage:
        'System interprets: non-graphic resolution (violence set to none). Proceed with that intent?',
    };
  }

  if (m.violenceLevel === 'mild' && GRAPHIC_GORE_ASK.test(text)) {
    return {
      rewritten: 'I strike to end the fight cleanly — no lingering gore.',
      diegeticMessage:
        'System interprets: concise combat, no visceral detail. Proceed with that intent?',
    };
  }

  if (!m.substanceUse && /\b(get\s+(?:drunk|high)|shoot\s+up|do\s+drugs)\b/i.test(text)) {
    return {
      rewritten: 'I look for a clear-headed way forward instead.',
      diegeticMessage:
        'System interprets: substance use is off — continuing without that. Proceed?',
    };
  }

  return null;
}
