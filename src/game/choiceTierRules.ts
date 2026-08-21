import type { EngineMode } from './types';

/** Shared grounding rules for every engine mode. */
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
* STANCE DENSITY (non-lethal beats): Typical story beats MUST offer real stance when the scene allows — not three flavours of look-around / wait / inspect. Kind/help; hard/refuse; curious/talk; walk away when legal. Combat-locked turns stay fight moves. Opening covers stay covers. There is NO numeric karma meter. Named people remember treatment.
* HONOR THE LAST ASK: If the player asked a question, the story must answer it. Numbered options and "Inquire about…" in the paragraph MUST appear as the bottom buttons (3–4, including a stake) and be stripped from the body.
* CONVERSATION: While talking with a named person, do not replace the beat with "Inspect the immediate surroundings" as the only real chip. Continue the talk (ask/refuse) plus one walk-away.
* ALONE / EMPTY: Never invent crowd, handlers, or "people who saw you arrive" as choices when Crowd is none / alone arrival.`;

const MODE_CHOICE_DNA: Record<EngineMode, string> = {
  litrpg: `ENGINE CHOICE DNA — LITRPG (BINDING)
Non-combat exploration: offer three distinct paths when the scene allows:
  - Path1 Direct / Physical — force a door, climb, clear rubble, push through
  - Path2 Diplomatic / Trade / Faction — talk, bargain, trade, hail a known presence (NEVER invent NPCs on alone/empty scenes; use solitary/explore/doorway instead)
  - Path3 Solitary / Stealth — sneak, scout alone, listen, slip past
If companions are present: include at least one party-synergy option AND keep a solitary option. Combat-locked = fight moves. Opening covers = covers.`,

  dnd: `ENGINE CHOICE DNA — TABLETOP / dnd (BINDING)
Non-combat beats: prefer three distinct lenses when the scene allows:
  - Investigate — search, ask, check a clue, test a telegraph
  - Position — move, cover, choke point, approach angle
  - Party — coordinate with a listed companion / hireling; if alone, keep a solo investigate or position option
Telegraphed danger may appear as a cautious choice. Fail-forward stakes belong in the story, not as "try again" clones. Combat-locked = fight moves. Opening covers = covers.`,

  rpg: `ENGINE CHOICE DNA — STORY RPG (BINDING)
Non-combat beats: prefer three distinct lenses when the scene allows:
  - Leverage — use a secret, debt, reputation, or scene pressure
  - Diplomatic — talk, bargain, de-escalate, ask
  - Moral / Faction — kindness, hardness, or a faction-standing consequence (honor [FACTION MATRIX] when present)
Alone / empty: swap diplomatic invent-crowd for solitary observe / doorway. Combat-locked = fight moves. Opening covers = covers.`,

  pyoa: `ENGINE CHOICE DNA — PICK YOUR OWN ADVENTURE (BINDING)
Authored forks only — not an open sandbox. Prefer three distinct lenses when the spine allows:
  - Physical — move body / force space / commit to the geography of THIS page
  - Tool / Inventory — use a carried item the ledger actually lists (inventory gating)
  - Cautious — wait, listen, double-check, refuse the obvious trap
Do NOT invent open-world walkabouts. Do NOT offer take-companion's-hand / shove-as-bait / MacGuffin tap defaults unless the style rail names them. Stay on the campaign bible's fork style.`,
};

/** Mode-specific choice lenses — append after CHOICE_TIER_PROMPT_RULES. */
export function formatChoiceTierModeDna(engineMode: EngineMode): string {
  return MODE_CHOICE_DNA[engineMode] ?? MODE_CHOICE_DNA.rpg;
}
