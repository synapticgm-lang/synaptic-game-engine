import type { EngineMode } from './types';

export type LitRpgArchetype =
  | 'ai_random'
  | 'system_apocalypse'
  | 'isekai'
  | 'vrmmo'
  | 'monster_reincarnation'
  | 'void_audience'
  | 'regression'
  | 'cyberpunk'
  | 'dungeon_transport';

export type DndOpening =
  | 'ai_custom'
  | 'caravan_escort'
  | 'prisoner_shipwrecked'
  | 'patrons_quest'
  | 'under_siege'
  | 'cursed_manor'
  | 'wilderness_expedition';

export type CampaignArchetype = LitRpgArchetype | DndOpening;

export interface ArchetypeOption {
  value: CampaignArchetype;
  label: string;
  description: string;
}

export const LITRPG_ARCHETYPES: ArchetypeOption[] = [
  { value: 'ai_random', label: 'AI Random Choice', description: 'AI dynamically invents or blends tropes' },
  { value: 'system_apocalypse', label: 'System Integration', description: 'Earth is forcibly integrated into a universe-wide RPG system' },
  { value: 'isekai', label: 'Hero Summoning (Isekai)', description: 'Summoned to another realm by a deity or ritual' },
  { value: 'vrmmo', label: 'VRMMO Trap', description: 'Locked inside a full-dive virtual reality game with real stakes' },
  { value: 'monster_reincarnation', label: 'Monster Reincarnation', description: 'Reborn as a weak creature/dungeon core needing to evolve' },
  { value: 'void_audience', label: 'The Void Audience', description: 'Dead in a void, negotiating stats and flaws with a cosmic entity' },
  { value: 'regression', label: 'Regression / Second Chance', description: 'Waking up years in the past with future knowledge' },
  { value: 'cyberpunk', label: 'Cyber-Neural Boot', description: 'Sci-fi setting with nanite-driven HUD interface and heat mechanics' },
  { value: 'dungeon_transport', label: 'Dungeon Transport', description: 'Accidentally stepping through a portal into a subterranean maze' },
];

export const DND_OPENINGS: ArchetypeOption[] = [
  { value: 'ai_custom', label: 'AI Custom 5e Campaign', description: 'AI generates a custom opening based on class/background' },
  { value: 'caravan_escort', label: 'Caravan Escort / Tavern Meeting', description: 'Classic low-level start guarding cargo or gathering info' },
  { value: 'prisoner_shipwrecked', label: 'Prisoner / Shipwrecked', description: 'Start stripped of gear; focus on escape and scavenging' },
  { value: 'patrons_quest', label: "Patron's Quest", description: 'Hired by a wealthy noble or wizard with specific objectives and starter gear' },
  { value: 'under_siege', label: 'Under Siege', description: 'Immediate action start; defending a village or outpost from invaders' },
  { value: 'cursed_manor', label: 'Cursed Manor / Dungeon Crawl', description: 'Exploration, traps, and ancient secrets' },
  { value: 'wilderness_expedition', label: 'Wilderness Expedition', description: 'Survival, tracking, and hazard navigation in untamed lands' },
];

/** Narrative RPG openings reuse LitRPG seeds but with story-first framing in the UI. */
export const RPG_OPENINGS: ArchetypeOption[] = [
  { value: 'ai_random', label: 'AI Story Seed', description: 'A bespoke narrative opening without system HUDs or dice math' },
  { value: 'isekai', label: 'Another World', description: 'Awaken in a strange realm — motives and bonds drive the tale' },
  { value: 'regression', label: 'Second Chance', description: 'Return to a pivotal past moment with hard-won foresight' },
  { value: 'dungeon_transport', label: 'Threshold Crossing', description: 'Step through a doorway into an unknown realm of danger' },
  { value: 'void_audience', label: 'Bargain in the Dark', description: 'Negotiate fate with a mysterious patron after death' },
  { value: 'cyberpunk', label: 'Neon Underworld', description: 'Street-level intrigue in a rain-soaked megacity' },
];

export function getArchetypeOptions(engineMode: EngineMode): ArchetypeOption[] {
  if (engineMode === 'dnd') return DND_OPENINGS;
  if (engineMode === 'rpg') return RPG_OPENINGS;
  return LITRPG_ARCHETYPES;
}

export function getDefaultArchetype(engineMode: EngineMode): CampaignArchetype {
  if (engineMode === 'dnd') return 'ai_custom';
  return 'ai_random';
}

const LITRPG_RULES: Record<LitRpgArchetype, string> = {
  ai_random: `ARCHETYPE: AI RANDOM CHOICE
You have creative freedom to invent or blend LitRPG tropes. Design a unique opening scenario that combines 2-3 classic tropes in an unexpected way. Still establish clear system mechanics, progression rules, and world consistency from turn one.`,
  system_apocalypse: `ARCHETYPE: SYSTEM APOCALYPSE
- Enforce permadeath. There are no respawns.
- Modern tech and firearms fail against mana fields — bullets misfire, electronics fry.
- Real-world geography converts into dungeon biomes and survivor hubs.
- The System broadcasts globally. Society collapses in the first hours.
- Integration events (waves, dungeons spawning) escalate over time.`,
  isekai: `ARCHETYPE: HERO SUMMONING (ISEKAI)
- Grant 1 glitched or high-tier starting passive as a "blessing" from the summoning deity.
- Require the 'Appraisal' skill to discover lore about items, NPCs, and locations.
- Allow full freedom to obey or betray the summoning kingdom — no forced allegiance.
- The summoning was for a reason (war, prophecy, ritual). Reveal stakes gradually.`,
  vrmmo: `ARCHETYPE: VRMMO TRAP
- Allow a "Log Out / Real-World Interlude" command in designated safe zones.
- Death incurs XP and durability loss instead of permadeath (unless permadeath-enabled servers).
- Include real-world economy conversion (in-game gold to real currency and back).
- Reference server patch updates, maintenance windows, and patch notes as world events.
- The player is physically logged in; real-world body needs are managed via game interface.`,
  monster_reincarnation: `ARCHETYPE: MONSTER REINCARNATION
- Replace standard gear progression with an 'Evolution Tree' unlocked via biomass or level targets.
- Enforce physical creature body mechanics: senses, diet, instincts, and biological limitations.
- The player starts as a weak creature or dungeon core and must survive and evolve.
- No human NPCs initially; ecosystem and territory dynamics dominate early game.`,
  void_audience: `ARCHETYPE: THE VOID AUDIENCE
- Game Turn 1 starts in a void negotiation phase: allocating stat points and choosing Flaws and Boons.
- Track 'Cosmic Favor' points awarded by divine viewers based on entertainment value.
- The cosmic entity sets the terms of the player's rebirth. Flaws grant extra points.
- Higher Cosmic Favor unlocks better starting conditions and interventions.`,
  regression: `ARCHETYPE: REGRESSION / SECOND CHANCE
- Allow the player to reference future events, hidden secrets, and boss mechanics from their past life.
- Trigger 'Butterfly Effect' events whenever the timeline diverges from the original path.
- Knowledge is the player's greatest asset but changes create unpredictable ripples.
- Some fixed points in time resist change; others cascade into new timelines.`,
  cyberpunk: `ARCHETYPE: CYBER-NEURAL BOOT
- Frame stats as Hardware and Software instead of traditional RPG attributes.
- Introduce a 'Thermal / Overheat' mechanic for spell and ability usage instead of standard mana decay.
- Nanite-driven HUD interface is always present; hacking and augmentation are core systems.
- Corporate dystopia setting; heat management is survival, not just combat.`,
  dungeon_transport: `ARCHETYPE: DUNGEON TRANSPORT
- Enforce strict floor-by-floor progression with resource depletion (water, light, food).
- Designated safe rooms appear between floors for rest and resupply.
- The player accidentally stepped through a portal; escape means clearing the dungeon.
- Each floor escalates in difficulty; boss floors gate progression.`,
};

const DND_RULES: Record<DndOpening, string> = {
  ai_custom: `5e TTRPG OPENING: AI CUSTOM CAMPAIGN
Generate a custom opening scene tailored to the player's chosen class and background. Establish a hook, a starting location, and an immediate objective. Integrate the character's backstory organically.`,
  caravan_escort: `5e TTRPG OPENING: CARAVAN ESCORT / TAVERN MEETING
- Classic low-level start: the party is guarding cargo or gathering information in a tavern.
- Introduce 1-2 NPCs with hooks. Present a low-stakes social or combat encounter.
- Starter gear is mundane; gold is scarce. Emphasize roleplay and investigation.`,
  prisoner_shipwrecked: `5e TTRPG OPENING: PRISONER / SHIPWRECKED
- The party starts stripped of gear; focus on escape and scavenging.
- Survival mechanics (food, water, shelter) matter immediately.
- Recover equipment gradually. The environment is the first enemy.
- No starting gold; improvised weapons only.`,
  patrons_quest: `5e TTRPG OPENING: PATRON'S QUEST
- Hired by a wealthy noble or wizard with specific objectives and starter gear.
- Provide a clear quest briefing, payment terms, and a deadline.
- Starter gear is provided by the patron (basic weapons, armor, a healing potion).
- The patron may have ulterior motives; loyalty has a price.`,
  under_siege: `5e TTRPG OPENING: UNDER SIEGE
- Immediate action start: the party is defending a village or outpost from invaders.
- Begin in media res with combat already underway. Initiative matters from turn one.
- Civilians, resources, and structural integrity are at stake.
- Victory conditions: repel the assault or evacuate survivors.`,
  cursed_manor: `5e TTRPG OPENING: CURSED MANOR / DUNGEON CRAWL
- Exploration, traps, and ancient secrets dominate.
- The manor or dungeon is the primary setpiece; rooms gate progression.
- Emphasize Investigation, Perception, and trap disarm checks.
- Treasure is hidden behind puzzles and hazards.`,
  wilderness_expedition: `5e TTRPG OPENING: WILDERNESS EXPEDITION
- Survival, tracking, and hazard navigation in untamed lands.
- Weather, terrain, and wildlife are constant threats.
- Navigation checks (Survival, Nature) determine progress and avoid getting lost.
- Resources deplete over travel days; long rests carry risk.`,
};

const DND_5E_CORE_RULES = `=== 5e TTRPG MODE CORE RULES (FIFTH EDITION COMPATIBLE / SRD 5.1) ===
Mechanics operate under the System Reference Document 5.1 ("SRD 5.1") rules:
- d20 Resolution & DCs: Resolve actions using d20 + Ability Modifier + Proficiency against standard DCs (Easy 10, Medium 15, Hard 20, Very Hard 25).
- Action Economy: Enforce strict turn structure in combat: Movement, Action (Attack, Cast Spell, Dash, Disengage, Hide, Use Object), Bonus Action, and Reaction. Show AC, HP, and Initiative order in HUD.
- Spell Slots & Cantrips: Cantrips are unlimited. Levelled spells strictly consume slots, restored only via Short Rests (1 hr) or Long Rests (8 hrs).
- Advantage / Disadvantage: Roll 2d20 and take highest/lowest based on situational positioning or status effects.
- Downed Mechanics: Reaching 0 HP triggers Death Saving Throws (3 successes to stabilize, 3 failures for character death).
- Dice Roll Logging: Format narrative action logs with explicit tabletop rolls (e.g., "[Check: Perception] Roll: 14 + 3 = 17 vs DC 15 -> Success!").

TRADEMARK SAFETY (MANDATORY):
- NEVER use the trademarked brand names "Dungeons & Dragons", "D&D", or "Dungeon Master" in any AI-generated narrative output, system status logs, or item descriptions.
- Refer to mechanics using trademark-safe phrasing only: "5e Fantasy Rules", "Fifth Edition Compatible", or "TTRPG mechanics".
- Refer to the game master role as "GM" (Game Master), never "DM" or "Dungeon Master".
- Refer to rulebooks as "the SRD" or "Fifth Edition rules", never by trademarked product names.`;

export function buildArchetypeRules(engineMode: EngineMode, archetype: CampaignArchetype): string {
  if (engineMode === 'dnd') {
    const opening = (DND_RULES as Record<string, string>)[archetype] ?? DND_RULES.ai_custom;
    return `${DND_5E_CORE_RULES}\n\n${opening}`;
  }
  const litrpgOpening = (LITRPG_RULES as Record<string, string>)[archetype] ?? LITRPG_RULES.ai_random;
  if (engineMode === 'rpg') {
    return `${litrpgOpening}

RPG NARRATIVE OVERRIDE:
- Strip LitRPG HUD language from the opening and ongoing play.
- Prefer character, place, and consequence over system panels.`;
  }
  return litrpgOpening;
}

export function buildArchetypeIntro(engineMode: EngineMode, archetype: CampaignArchetype, characterName: string): string {
  const name = characterName || 'Survivor';
  if (engineMode === 'dnd') {
    const intros: Record<DndOpening, string> = {
      ai_custom: `The story of ${name} begins. Your past is your own — class, background, and bonds shape who you are. The world awaits your first move.\n\nWhat do you do?`,
      caravan_escort: `The road stretches ahead, dusty and long. ${name} walks alongside a creaking wagon, its canvas tarps bulging with trade goods. The merchant ahead glances back nervously. Somewhere beyond the next hill, a tavern promises warm food and warmer rumors — if you make it there before nightfall.\n\nWhat do you do?`,
      prisoner_shipwrecked: `Cold brine chokes your lungs as you wake on a rocky shore. The wreck of a ship lists in the shallows, its hull split open. Your hands are empty. Your bonds are gone — snapped on the rocks. Somewhere inland, smoke rises. You are ${name}, and you are alone.\n\nWhat do you do?`,
      patrons_quest: `The study smells of old parchment and candle wax. A robed figure — your patron — slides a sealed letter across the desk. "${name}, I have a task that requires your particular skills. Complete it, and you will be well compensated." A pouch of coins and a bundle of basic gear sit beside the letter.\n\nWhat do you do?`,
      under_siege: `The gate shudders under another impact. Screams echo from the inner wall. ${name}, you grip your weapon as the village militia scrambles to position. The invaders are coming over the wall — there is no time to think, only to act.\n\nWhat do you do?`,
      cursed_manor: `The manor door groans open, revealing a foyer thick with dust and cobwebs. ${name}, you were warned: something here is wrong. The last family vanished without a trace. The air is cold, and something scratches at the floor above.\n\nWhat do you do?`,
      wilderness_expedition: `The trail ended hours ago. ${name}, you stand at the edge of an untamed forest, the map in your hand already outdated. Tracks lead deeper — some animal, some not. The weather is turning. You have rations for three days, maybe four.\n\nWhat do you do?`,
    };
    return intros[(archetype as DndOpening) ?? 'ai_custom'] ?? intros.ai_custom;
  }
  const intros: Record<LitRpgArchetype, string> = {
    ai_random: `You awaken in an unfamiliar world. The air tastes of ash and old magic. A translucent blue panel flickers into view — private, yours alone.\n\n[ SYSTEM ] Welcome, ${name}. You have been registered.\n\nWhat do you do?`,
    system_apocalypse: `The sky tears open. A voice — not human, not machine — speaks to every mind on Earth simultaneously: "Integration complete. Welcome to the System." ${name}, you stand in a city that is already changing. Concrete cracks as green crystals push through. People scream. A blue panel flickers before your eyes.\n\n[ SYSTEM ] Welcome, ${name}. You have been registered. Survive.\n\nWhat do you do?`,
    isekai: `Light consumes you — and then stone. You lie on a summoning circle, runes still glowing. Robed figures tower above, their faces a mix of awe and calculation. One speaks: "The ritual worked. Hero, we have called you here to save our world." A blue panel flickers into view.\n\n[ SYSTEM ] Welcome, ${name}. Blessing granted: [???]. You have been registered.\n\nWhat do you do?`,
    vrmmo: `The login screen fades. Your body dissolves into data — and reforms. You're standing in a starter town, the HUD alive around you. But the logout button is greyed out. A system notification pulses red: "Full-dive lock engaged. Death carries real consequences." ${name}, you are trapped.\n\n[ SYSTEM ] Welcome, ${name}. You have been registered.\n\nWhat do you do?`,
    monster_reincarnation: `Darkness. Then sensation — cold, wet, alive. You are small. You are weak. You are... different. Your body is wrong, or rather, not human. Instincts that aren't yours flood your mind: hunger, fear, the drive to survive. A blue panel flickers.\n\n[ SYSTEM ] Reincarnation complete. Species: [???]. Evolution path available. Welcome, ${name}.\n\nWhat do you do?`,
    void_audience: `You are dead. That much is certain. You float in an endless void — no body, no ground, no time. Before you, a figure of impossible geometry watches with what might be amusement. "So. You want another chance." It leans closer. "Everything has a price. Allocate your points. Choose your flaws. Entertain my audience." A panel appears.\n\n[ SYSTEM ] Negotiation phase initiated. Cosmic Favor: 0. Welcome, ${name}.\n\nWhat do you do?`,
    regression: `You gasp awake. The ceiling is wrong — too low, too familiar. The date on the calendar makes your blood run cold. You've come back. Years of memory crash into you: the war, the losses, the things you wish you'd done differently. ${name}, you have a second chance.\n\n[ SYSTEM ] Temporal anomaly detected. Welcome back, ${name}.\n\nWhat do you do?`,
    cyberpunk: `Your eyes snap open. The HUD boots in a cascade of red text — system critical, thermal warning, neural link unstable. Nanites crawl under your skin, interfacing with hardware you don't remember installing. ${name}, you're in a back alley of a city that never sleeps, and something went very wrong last night.\n\n[ SYSTEM ] Boot complete. Neural HUD online. Welcome, ${name}.\n\nWhat do you do?`,
    dungeon_transport: `One step — and the world changes. The portal snaps shut behind you with a sound like breaking glass. You're in a stone corridor, torches guttering on the walls. The air is damp and old. ${name}, there is no way back — only down.\n\n[ SYSTEM ] Welcome, ${name}. Floor 1 of [???]. Descend.\n\nWhat do you do?`,
  };
  const litrpgIntro = intros[(archetype as LitRpgArchetype) ?? 'ai_random'] ?? intros.ai_random;
  if (engineMode === 'rpg') {
    return litrpgIntro
      .replace(/\n\n\[ SYSTEM \][^\n]*/g, '')
      .replace(/A (?:translucent blue panel|blue panel|panel)[^.]*\.\s*/gi, '')
      .replace(/The HUD[^.]*\.\s*/gi, '')
      .trim()
      .replace(/\n{3,}/g, '\n\n');
  }
  return litrpgIntro;
}

