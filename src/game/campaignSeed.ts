import type { CampaignBible } from '@/data/campaigns/types';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import type { CampaignArchetype } from './archetypes';
import type { EngineMode, GameState, Item, LoreCard, LoreCardType, Quest } from './types';

function snippetType(category: string): LoreCardType {
  if (category === 'faction') return 'faction';
  if (category === 'history') return 'lore';
  if (category === 'mechanic') return 'lore';
  if (category === 'culture') return 'lore';
  return 'location';
}

export function findBibleForArchetype(
  engineMode: EngineMode,
  archetype?: CampaignArchetype
): CampaignBible | undefined {
  if (!archetype || archetype === 'ai_random') {
    return ALL_CAMPAIGN_BIBLES.find((b) => b.engineMode === (engineMode === 'rpg' ? 'litrpg' : engineMode));
  }
  const exact = ALL_CAMPAIGN_BIBLES.find(
    (b) => b.archetype === archetype && (engineMode === 'rpg' ? b.engineMode === 'litrpg' : b.engineMode === engineMode)
  );
  if (exact) return exact;
  return ALL_CAMPAIGN_BIBLES.find((b) => b.archetype === archetype);
}

/**
 * Seed lorebook, quests, and optional starter items from a CampaignBible.
 * Called at new-game start so Guide Book content is actually in runtime state.
 */
export function seedStateFromCampaignBible(
  state: GameState,
  bible: CampaignBible
): GameState {
  const lorebook: LoreCard[] = [
    ...state.lorebook,
    ...bible.loreSnippets.map((s) => ({
      id: s.id,
      name: s.title,
      type: snippetType(s.category),
      keywords: [...s.tags, s.title],
      summary: s.body.slice(0, 600),
      lastSeenTurn: 0,
    })),
    ...bible.keyNPCs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      type: 'npc' as const,
      keywords: [npc.name, npc.role, npc.disposition, ...npc.hooks.slice(0, 3)],
      summary: `${npc.role}. Disposition: ${npc.disposition}. ${npc.description}`.slice(0, 600),
      visualAnchor: npc.description.slice(0, 160),
      lastSeenTurn: 0,
    })),
  ];

  // Dedupe by id
  const seen = new Set<string>();
  const dedupedLore = lorebook.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  // Only the first level-appropriate quest starts active. The rest stay hidden until the
  // story/System reveals them — so the quest log doesn't dump the whole campaign at once.
  const playerLevel = state.character?.level ?? 1;
  const starterQuests: Quest[] = bible.starterQuests.map((q, index) => {
    const levelOk = (q.recommendedLevel ?? 1) <= playerLevel;
    const status = index === 0 && levelOk ? ('active' as const) : ('hidden' as const);
    return {
      id: q.id,
      name: q.title,
      description: q.description,
      status,
      // Seeded quests start unrevealed so Guide Book hooks cannot steal scene focus.
      revealed: false,
      type: 'main' as const,
      recommendedLevel: q.recommendedLevel,
      objectives: q.objectives.map((desc, i) => ({
        id: `${q.id}-obj-${i + 1}`,
        description: desc,
        completed: false,
      })),
      rewards: { items: q.rewards ? [q.rewards] : undefined },
    };
  });

  const existingQuestIds = new Set((state.quests ?? []).map((q) => q.id));
  const quests = [
    ...(state.quests ?? []),
    ...starterQuests.filter((q) => !existingQuestIds.has(q.id)),
  ];

  // Only add bible starter items that aren't already present by name.
  const invNames = new Set(state.inventory.map((i) => i.name.toLowerCase()));
  const starterItems: Item[] = bible.starterItems
    .filter((si) => !invNames.has(si.name.toLowerCase()))
    .slice(0, 3)
    .map((si) => ({
      id: si.id,
      name: si.name,
      rarity: si.rarity,
      quantity: 1,
      itemType: si.itemType,
      itemLevel: si.itemLevel,
      description: si.description,
      provenance: `Campaign: ${bible.title}`,
    }));

  const activeQuest = quests.find((q) => q.status === 'active');
  const questRail = activeQuest
    ? `BACKGROUND QUEST (Guide Book only — NEVER railroad): "${activeQuest.name}" is tracked in the quest log. Do NOT narrate quest markers, dungeons, shops, or objectives unless the player asks about the quest or travels there. Always resolve the player's immediate action first. Hidden quests stay unspoken.`
    : 'No opening quest yet — do not invent quest log entries.';

  return {
    ...state,
    campaignBibleId: bible.id,
    campaignPremise: `${bible.title}: ${bible.premise}\n\n${questRail}`.slice(0, 1600),
    storyName: state.storyName,
    lorebook: dedupedLore,
    quests,
    inventory: [...state.inventory, ...starterItems],
    currentLocation: state.currentLocation || inferStartingLocation(bible),
    timeline: [
      ...(state.timeline ?? []),
      {
        id: crypto.randomUUID(),
        turn: 0,
        kind: 'discovery',
        text: `Campaign seeded: ${bible.title}`,
        at: Date.now(),
      },
      ...(activeQuest
        ? [
            {
              id: crypto.randomUUID(),
              turn: 0,
              kind: 'quest' as const,
              text: `Quest logged (background): ${activeQuest.name}. Do not force the player toward it.`,
              at: Date.now(),
            },
          ]
        : []),
    ],
  };
}

function inferStartingLocation(bible: CampaignBible): string {
  const loc = bible.loreSnippets.find((s) => s.category === 'world');
  return loc?.title ?? bible.title;
}

export function seedStateFromArchetype(
  state: GameState,
  engineMode: EngineMode,
  archetype?: CampaignArchetype
): GameState {
  const bible = findBibleForArchetype(engineMode, archetype);
  if (!bible) return state;
  return seedStateFromCampaignBible(state, bible);
}
