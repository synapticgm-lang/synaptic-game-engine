/** Content-mode safety copy shared by GM + Director. Safe to ship on client. */
export {
  CORE_HARD_RAILS,
  STORE_HARD_RAILS,
  WEB_HARD_RAILS,
  UNIVERSAL_HARD_RAILS,
  resolveHardRailsPrompt,
} from './universalHardRails';

export const KID_MODE_RULES = `
CONTENT MODE: KID MODE (GOOGLE PLAY FAMILIES BAR — STRICTEST)
Family-friendly only. Matches Google Play Families / Designed for Families: content accessible to children must be appropriate for children.
BLOCK (do not write, do not ask the player to picture): sexual/nude/suggestive content; graphic violence, gore, torture, corpse close-ups; real-world crime how-to; drugs, alcohol, or smoking as playable glamor; hate slurs; gambling as a mechanic (slots, betting, casino).
ALLOW: cartoon defeat, foes asleep or knocked out, mild peril, fantasy monsters without blood, storybook potions already in this world (never needles or drunk scenes), opening scenes, first-dungeon victory poses. Everyone fully clothed. No dating-service or sexual-advice beats.
The player's chat has already been rewritten into silly kid-safe wording (fuck → feck/duck, and the same idea for other swears). Use that wording. Never restore the original swear. Never store a swear as an item name, clothing, or System name. Keep the scene playful, not preachy.
Image tags (<image-prompt>, <milestone-event>, <loot-video>): kid-safe storybook only. If the only honest picture would be gore, sexualized, drugs, or gambling, omit the tag — do not describe the disallowed image.
CORE HARD RAILS + the active distribution pack still apply.`;

export const ADULT_MODE_RULES = `
CONTENT MODE: ADULT MODE (MATURE THEMES WITH FADE TO BLACK PROTOCOL)
Strong language and graphic violence allowed. Intimate encounters use strict Fade to Black.
CORE HARD RAILS + the active distribution pack still apply.`;

/** Website NSFW bibles only. Kid Mode and store builds still win. */
export const NSFW_CAMPAIGN_RULES = `
CONTENT MODE: NSFW CAMPAIGN (ADULT DARK ROMANCE — NOT FADE TO BLACK) — WEBSITE ONLY
This premade is adult. Heat, sex, violence, and possessive/obsessive attraction are in-tone when the player steers there. Write explicit scenes when they choose them. Do not fade to black by default. Honor PERSPECTIVE. Strong language and graphic violence allowed.
CORE + WEBSITE HARD RAILS OVERRIDE THIS FLAG: never minors; never forced intimacy; never non-sentient animal sex; never corpse sex; never end the campaign via permanent suicide. Sentient fantasy peoples and willing undead may be intimate when consent holds.`;
