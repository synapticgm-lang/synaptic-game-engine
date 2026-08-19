/** Edge-safe NSFW check — no catalog import (Deno cannot resolve `@/data/campaigns`). */
const NSFW_CATALOG_IDS = new Set(['onyx-blood-covenant']);

export function campaignIsNsfw(state: {
  campaignBibleId?: string | null;
  campaignBibleSnapshot?: { nsfw?: boolean } | null;
}): boolean {
  if (state.campaignBibleSnapshot?.nsfw === true) return true;
  return NSFW_CATALOG_IDS.has((state.campaignBibleId ?? '').trim());
}
