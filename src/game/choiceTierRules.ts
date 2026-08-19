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
* NEVER invent soft interactables (named altars, chests, consoles, relics, cars, vans, tire irons) unless they appear in this turn's prose or the location sheet.
* If the player named a specific object, the story MUST resolve that object. Do not substitute a generic look-around.
* If they ask where gear came from, answer from item provenance and equipped slots. Do not say the question is "opaque" when the sheet already knows.
* NEVER mention a spatial pouch or fancy container unless that exact name is in Containers.
* Info/lore cards constrain identity and world facts — they do NOT authorize inventing a new crisis mid-choice-list.
* Prefer 3–4 immediate, scene-local actions. Always emit 3 or 4 options. Prefer scene-safe fallbacks over ungrounded creativity.
* STANCE DENSITY (non-lethal beats, all sandbox modes): Typical story beats MUST offer real stance, not three flavours of look-around / wait / inspect surroundings. Include when the scene allows:
  - Kind / help / honest
  - Hard / selfish / threat / refuse
  - Curious / talk / ask / bargain / hang out
  - Walk away / ignore / go another direction — unless combat is locking them in
  Combat-locked turns stay fight moves. Opening cover questions stay covers. PYOA stays authored forks (talk/refuse/walk still count; do not invent a fake sandbox).
  There is NO numeric karma or alignment meter. Named people remember how they were treated.
* HONOR THE LAST ASK: If the player asked a question, the story must answer it. "You could inquire about X" is not an answer. Numbered options and "Inquire about…" in the paragraph MUST appear as the bottom buttons (3–4, including a stake) and be stripped from the body.
* CONVERSATION: While talking with a named person, do not replace the beat with "Inspect the immediate surroundings" as the only real chip. Continue the talk (ask/refuse) plus one walk-away.`;
