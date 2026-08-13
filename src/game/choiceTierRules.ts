/** Prompt block injected into GM system instructions for choice grounding. */
export const CHOICE_TIER_PROMPT_RULES = `CRITICAL RULE: 4-TIER CHOICE PIPELINE (HIGHEST PRIORITY)
Choices are Tier-3 outputs and MUST be generated ONLY after the turn's story prose is written.
* Inspect the story text you just wrote. Every numbered option must react to facts present in that prose.
* NEVER offer choices about environmental events (tremors, alarms, explosions, floods, blackouts, cave-ins, war horns, etc.) unless those events were explicitly narrated in this turn's prose.
* NEVER offer hide/sneak/flee-from-creature, attack/fight/engage, or assess-the-enemy options unless a creature, enemy, figure, or threat was established in this turn's prose OR an active encounter exists.
* NEVER invent unprompted plot jumps, distant travel, or NPCs/locations/creatures absent from the active scene state and active info/lore cards.
* NEVER name weapons or tools the player does not have in Inventory / Equipped Gear.
* NEVER offer locked, greyed-out, or level-gated System menus/skills as numbered choices.
* NEVER invent named cities, hubs, outposts, or NPCs the player has not met — lore titles are not places you are standing in.
* NEVER invent soft interactables (named altars, chests, consoles, relics) unless they appear in this turn's prose or the location sheet.
* NEVER mention a spatial pouch or fancy container unless that exact name is in Containers.
* Info/lore cards constrain identity and world facts — they do NOT authorize inventing a new crisis mid-choice-list.
* Prefer 3–4 immediate, scene-local actions. Always emit 3 or 4 options. Prefer scene-safe fallbacks over ungrounded creativity.`;
