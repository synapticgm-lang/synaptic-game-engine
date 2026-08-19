/**
 * One Kid Mode safety bar — Google Play Families / Designed for Families as pass/fail.
 *
 * All player-visible text and all image prompts must go through here when
 * `settings.contentMode === 'kid'`. Adult / BYOK paths must not call these.
 *
 * Block (skip or rewrite-away), do not merely soften:
 * sexual/nude/suggestive, graphic gore, drugs/alcohol/smoking as playable glamor,
 * hate slurs, gambling as a mechanic, real-world crime how-to.
 *
 * Allow with rewrite: cartoon defeat, foe asleep/knocked out, mild peril,
 * fantasy monsters without blood, opening scene, first-dungeon victory pose,
 * storybook "potion" already in bibles (never illustrate needles/drunk).
 */

import { applyKidFriendlySwears } from '@/utils/filterLogic';

export function isKidMode(settings?: { contentMode?: string } | null): boolean {
  return settings?.contentMode === 'kid';
}

export function kidSafeArtDirective(): string {
  return [
    'KID-SAFE ART (Google Play Families bar — ledger unchanged; enemies can still be downed):',
    'No blood, gore, dismemberment, torture, or graphic wounds.',
    'Hits are motion blur, sparks, dust, or impact stars.',
    'Downed foes slump asleep, sit dazed, or fade — not corpses.',
    'Everyone fully clothed. No nudity, lingerie, or sexualized poses.',
    'No alcohol, tobacco, smoking, needles, or drug glamor.',
    'No gambling (slots, betting, casino). No hate symbols.',
  ].join(' ');
}

const KID_UNSAFE_GORE_LEXICON =
  /\b(blood(?:y|shed)?|gore|gory|visceral|brutal|carnage|slaughter|corpse|cadaver|entrails|viscera|decapitat\w*|dismember\w*|mutilat\w*|eviscerat\w*|severed|gutted|splatter|gashes?|grievous wounds?|torture|execution)\b/gi;

const KID_UNSAFE_SEX_LEXICON =
  /\b(nude|naked|nipples?|breasts?|cleavage|erotic|sexual(?:ized)?|nsfw|lingerie|seductive|aroused|explicit|topless|undressed|porn(?:ography)?|strip(?:ping|tease)?|undress(?:ing|ed)?)\b/gi;

const KID_UNSAFE_SUBSTANCE_LEXICON =
  /\b(whiskey|vodka|tequila|beer|lager|cigarette|cigar|cannabis|marijuana|heroin|cocaine|meth(?:amphetamine)?|fentanyl|shoot(?:ing)?\s+up|syringe|hypodermic|drunk|intoxicated|smoking\s+(?:a\s+)?(?:cig|joint|crack)|(?:a\s+)?joint\s+(?:of\s+)?(?:weed|cannabis))\b/gi;

const KID_UNSAFE_GAMBLE_LEXICON =
  /\b(slot machines?|poker chips?|place a bet|gambling|casino|roulette|sports betting|wager(?:ing|s)?)\b/gi;

const KID_GORE_AS_SUBJECT =
  /\b(decapitat\w*|dismember\w*|eviscerat\w*|torture|severed\s+(?:head|limb|arm|leg)|blood\s+(?:pool|spray|fountain|splatter)|pool of blood|guts?\s+(?:spilling|hanging)|close-?up of (?:a |the )?(?:corpse|cadaver|body)|mutilat\w*|graphic\s+(?:wound|violence|injury)|bloody\s+corpse)\b/i;

const KID_SEX_AS_SUBJECT =
  /\b(nude|naked|erotic|sexual(?:ized)?|nsfw|topless|lingerie|seductive pose|porn|strip(?:ping)?|undressed)\b/i;

const KID_DRUG_AS_SUBJECT =
  /\b(syringe|hypodermic|shoot(?:ing)?\s+up|heroin|cocaine|meth|marijuana|cannabis|cigarette|cigar|drunk(?:en)?\s+(?:pose|scene|portrait)|passed out drunk|smoking\s+(?:a\s+)?(?:cig|joint))\b/i;

const KID_GAMBLE_AS_SUBJECT =
  /\b(slot machine|casino floor|poker table|roulette wheel|sports betting|place a wager)\b/i;

const KID_HATE_AS_SUBJECT =
  /\b(swastika|nazi\s+flag|kkk|white\s+power|racial\s+slur)\b/i;

const KID_CRIME_HOWTO =
  /\b(how to (?:make|build|cook)\s+(?:a\s+)?(?:bomb|explosive|meth|poison)|real-?world\s+(?:crime|murder)\s+how-?to)\b/i;

const KID_SAFE_BEAT_MARK =
  /\b(storybook victory|hero at rest|slumped asleep|kid-safe)\b/i;

const FIGHT_CONTEXT =
  /\b(fight|battle|hero|foe|enemy|goblin|monster|victory|strike|clash|dungeon|stockboy|hatchling)\b/i;

/** Strip gore / sexual / substance / gambling tokens from an image prompt. Does not invent a new beat. */
export function stripKidUnsafeImageLexicon(prompt: string): string {
  return prompt
    .replace(KID_UNSAFE_GORE_LEXICON, '')
    .replace(KID_UNSAFE_SEX_LEXICON, '')
    .replace(KID_UNSAFE_SUBSTANCE_LEXICON, '')
    .replace(KID_UNSAFE_GAMBLE_LEXICON, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

/**
 * Skip rather than generate-then-hide when the only honest picture is disallowed.
 * Cartoon fight leftover after a kid-safe rewrite is allowed.
 */
export function isUnsalvageableKidImagePrompt(prompt: string): boolean {
  if (KID_SEX_AS_SUBJECT.test(prompt)) return true;
  if (KID_DRUG_AS_SUBJECT.test(prompt)) return true;
  if (KID_GAMBLE_AS_SUBJECT.test(prompt)) return true;
  if (KID_HATE_AS_SUBJECT.test(prompt)) return true;
  if (KID_CRIME_HOWTO.test(prompt)) return true;
  if (KID_SAFE_BEAT_MARK.test(prompt)) return false;
  if (KID_GORE_AS_SUBJECT.test(prompt) && !FIGHT_CONTEXT.test(prompt)) return true;
  return false;
}

/**
 * Kid Mode image rail — rewrite/strip BEFORE the provider call.
 * If the only honest depiction is gore, sexualized art, drugs, gambling, or hate, skip.
 */
export function prepareKidSafeImagePrompt(
  prompt: string,
  opts?: { skipIfUnsalvageable?: boolean }
): { prompt: string; skip: boolean } {
  const skipUnsalvageable = opts?.skipIfUnsalvageable !== false;
  if (skipUnsalvageable && isUnsalvageableKidImagePrompt(prompt)) {
    return { prompt: stripKidUnsafeImageLexicon(prompt), skip: true };
  }
  const stripped = stripKidUnsafeImageLexicon(prompt);
  const withMark = KID_SAFE_BEAT_MARK.test(stripped)
    ? stripped
    : `Kid-safe illustration, everyone fully clothed, no blood. ${stripped}`;
  return {
    prompt: withMark.trim() || 'A bright cheerful illustration, everyone fully clothed, no violence.',
    skip: false,
  };
}

const GORE_PROSE =
  /\b(guts\s+spill|blood\s+sprays|eviscerat\w*|dismember\w*|brain\s+matter|severed\s+limb|pool of blood|decapitat\w*|torture(?:d|s|ing)?)\b/gi;

const EXPLICIT_SEX_PROSE =
  /\b(penis|vagina|clitoris|ejaculat\w*|orgasm\w*|thrust(?:ing|s)?\s+(?:into|deep)|have\s+sex|make\s+love|porn)\b/gi;

const SUBSTANCE_GLAMOR_PROSE =
  /\b(get(?:ting)?\s+(?:drunk|high)|shoot(?:ing)?\s+up|do\s+drugs|light(?:s|ing)?\s+(?:a\s+)?(?:cigarette|joint|cigar))\b/gi;

const GAMBLE_PROSE =
  /\b(place a bet|play the slots|spin the roulette|gamble(?:s|d|ing)?\s+(?:gold|money|coin))\b/gi;

const HATE_PROSE =
  /\b(genocide|ethnic\s+cleansing|hate\s+crime)\b/gi;

/** Player-visible Kid Mode text: fun swear swap, then Google Families blocks rewritten. */
export function filterKidModeText(text: string): string {
  if (!text) return text;
  let out = applyKidFriendlySwears(text);
  out = out.replace(GORE_PROSE, 'the fight ends');
  out = out.replace(EXPLICIT_SEX_PROSE, '…');
  out = out.replace(SUBSTANCE_GLAMOR_PROSE, 'looks for a clear-headed way forward');
  out = out.replace(GAMBLE_PROSE, 'plays a friendly game of tokens');
  out = out.replace(HATE_PROSE, 'catastrophe');
  return out;
}

export function filterKidModeVisible(
  text: string,
  settings?: { contentMode?: string } | null,
): string {
  if (!isKidMode(settings)) return text;
  return filterKidModeText(text);
}

export function filterKidModeVisibleList(
  items: string[],
  settings?: { contentMode?: string } | null,
): string[] {
  if (!isKidMode(settings)) return items;
  return items.map(filterKidModeText);
}

function matchesUnsafe(re: RegExp, text: string): boolean {
  const flags = re.flags.replace('g', '');
  return new RegExp(re.source, flags).test(text);
}

/**
 * Drop pasted-rules paragraphs that are sexual, gore, drug, gambling, hate, or crime how-to
 * instruction blocks. Kid Mode GM output still goes through the Families bar either way.
 */
export function skipKidUnsafeInstructionBlocks(text: string): string {
  if (!text.trim()) return '';
  return text
    .split(/\n{2,}/)
    .filter((block) => {
      const t = block.trim();
      if (!t) return false;
      if (matchesUnsafe(KID_SEX_AS_SUBJECT, t)) return false;
      if (matchesUnsafe(KID_GORE_AS_SUBJECT, t)) return false;
      if (matchesUnsafe(KID_DRUG_AS_SUBJECT, t)) return false;
      if (matchesUnsafe(KID_GAMBLE_AS_SUBJECT, t)) return false;
      if (matchesUnsafe(KID_HATE_AS_SUBJECT, t)) return false;
      if (matchesUnsafe(KID_CRIME_HOWTO, t)) return false;
      if (matchesUnsafe(EXPLICIT_SEX_PROSE, t)) return false;
      if (matchesUnsafe(GORE_PROSE, t)) return false;
      if (matchesUnsafe(SUBSTANCE_GLAMOR_PROSE, t)) return false;
      if (matchesUnsafe(GAMBLE_PROSE, t)) return false;
      return true;
    })
    .join('\n\n')
    .trim();
}
