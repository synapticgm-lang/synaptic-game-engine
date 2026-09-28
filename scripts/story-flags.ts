/**
 * 28p — list author-note sentences the story-data boundary drops, per story, as markdown.
 * Run: node ./node_modules/vite-node/vite-node.mjs --config vite.config.ts scripts/story-flags.ts
 */
import { RAW_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { OPENING_HOOK_DECKS } from '@/data/campaigns/openingHookDecks';
import { hubsForBibleId } from '@/game/outdoorHubs';
import { sanitizeBibleForPlay, sanitizeHookCardForPlay, storyPlacesForBible, type StoryDataFlag } from '@/game/storyDataBoundary';

const out: string[] = [];
for (const bible of RAW_CAMPAIGN_BIBLES) {
  const flags: StoryDataFlag[] = [];
  sanitizeBibleForPlay(bible, flags);
  (OPENING_HOOK_DECKS[bible.id] ?? []).forEach((card, i) => sanitizeHookCardForPlay(card, flags, `hookDeck[${i}]`));
  const noHubs = hubsForBibleId(bible.id).length === 0;
  const places = noHubs ? storyPlacesForBible(bible) : [];
  if (!flags.length && !noHubs) continue;
  out.push(`## ${bible.title} (\`${bible.id}\`)`);
  if (noHubs) {
    out.push(`- No hub bank: engine derives ${places.length} place card(s) from the story's own locations${places.length ? ` (${places.map((p) => p.name).join('; ')})` : ''}.`);
  }
  for (const f of flags) out.push(`- \`${f.field}\`: ${f.sentence}`);
  out.push('');
}
console.log(out.join('\n'));
