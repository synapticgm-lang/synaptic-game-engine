import type { Settings } from './types.ts';
import { allowsExplicitIntimateProse, allowsNsfwCatalog } from './distributionChannel.ts';
import { isByokProfile } from './contentFilterProfile.ts';

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
  const storeLocked = !allowsExplicitIntimateProse();
  const byok = isByokProfile(settings);
  return {
    maturityTier: kid || storeLocked ? 'pg13' : byok ? 'mature' : settings.maturityTier ?? 'pg13',
    sexualContent: kid || storeLocked ? false : byok ? true : !!settings.sexualContent,
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
  const byok = isByokProfile(settings);
  const nsfwOk =
    byok
    || (!!opts?.nsfw && allowsNsfwCatalog() && allowsExplicitIntimateProse());
  if (nsfwOk && (byok || m.sexualContent || opts?.nsfw)) {
    return [
      'CONTENT MATURITY (MANDATORY):',
      byok
        ? 'BYOK website adult: explicit prose/art allowed when the player steers there (provider filters still apply). SynapticGM makers are not responsible for BYOK provider output.'
        : 'This campaign is NSFW adult dark romance (website build).',
      'SEXUAL CONTENT: explicit allowed when the player steers there.',
      'VIOLENCE: in-tone per settings.',
      'CORE RAILS: never minors; never forced intimacy; never non-sentient animal sex; never corpse sex; never permanent self-kill ending. Sentient fantasy peoples and willing undead OK when consenting. Bone props ≠ necrophilia.',
    ].join('\n');
  }
  const lines = [
    `MATURITY TIER: ${m.maturityTier.toUpperCase()}`,
    `SEXUAL CONTENT: ${m.sexualContent ? 'allowed with fade-to-black' : 'none — fade or omit'}`,
    `SUBSTANCE USE: ${m.substanceUse ? 'allowed in fiction' : 'omit / off-screen'}`,
    `DARK THEMES: ${m.darkThemes}`,
  ];
  if (!allowsExplicitIntimateProse()) {
    lines.push(
      'STORE BUILD: explicit sex is forbidden — fade to black or romantic implication only.',
    );
  }
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

const SEX_EXPLICIT =
  /\b(have\s+sex\s+with|fuck\s+(?:her|him|them)|rape\b|explicit\s+sex)\b/i;
const KID_SEXUAL_ASK =
  /\b(nude|naked|porn|erotic|lingerie|topless|undress|make\s+out|have\s+sex|sexy\s+picture|draw.{0,40}(?:nude|naked|sex))\b/i;
const GRAPHIC_GORE_ASK =
  /\b(dismember|eviscerat|torture\s+(?:in\s+detail|slowly)|describe\s+(?:the\s+)?gore|picture of (?:the )?(?:gore|corpse|blood)|draw.{0,40}(?:gore|corpse|blood spray|guts))\b/i;
const KID_GAMBLE_ASK =
  /\b(play the slots|place a bet|gamble|casino|roulette|poker for (?:gold|money))\b/i;

export type SoftRewrite = {
  rewritten: string;
  diegeticMessage: string;
};

export function maybeRatingRewrite(
  raw: string,
  settings: Settings,
  opts?: { nsfw?: boolean },
): SoftRewrite | null {
  const m = resolveMaturity(settings);
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  if (m.kid && KID_SEXUAL_ASK.test(text)) {
    return {
      rewritten: 'I look at them respectfully. Everyone stays fully clothed.',
      diegeticMessage:
        'System interprets: Kid Mode keeps the scene fully clothed and non-romantic-sexual. Proceed with that intent?',
    };
  }
  if (m.kid && KID_GAMBLE_ASK.test(text)) {
    return {
      rewritten: 'I suggest a friendly game of tokens instead — no betting.',
      diegeticMessage:
        'System interprets: Kid Mode does not include gambling. Proceed with a token game?',
    };
  }

  const nsfwExplicit =
    isByokProfile(settings)
    || (!!opts?.nsfw && !m.kid && allowsNsfwCatalog() && allowsExplicitIntimateProse());
  if (!nsfwExplicit && !m.sexualContent && SEX_EXPLICIT.test(text)) {
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
