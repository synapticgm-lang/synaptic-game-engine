/** Content-mode safety copy shared by GM + Director. Safe to ship on client. */
export const KID_MODE_RULES = `
CONTENT MODE: KID MODE (STRICT SAFETY)
No swearing, no graphic violence, no mature themes. Family-friendly only.
The player's chat has already been rewritten into silly kid-safe wording (fuck → feck/duck, and the same idea for other swears). Use that wording. Never restore the original swear. Never store a swear as an item name, clothing, or System name. Keep the scene playful, not preachy.`;

export const ADULT_MODE_RULES = `
CONTENT MODE: ADULT MODE (MATURE THEMES WITH FADE TO BLACK PROTOCOL)
Strong language and graphic violence allowed. Intimate encounters use strict Fade to Black.`;

/** Active only when the seeded campaign bible is flagged `nsfw`. Kid Mode still wins. */
export const NSFW_CAMPAIGN_RULES = `
CONTENT MODE: NSFW CAMPAIGN (ADULT DARK ROMANCE — NOT FADE TO BLACK)
This premade is adult. Heat, sex, violence, and possessive/obsessive attraction are in-tone when the player steers there. Write explicit scenes when they choose them. Do not fade to black by default. Never involve minors. Honor PERSPECTIVE. Strong language and graphic violence allowed.`;
