# Research: multi-starter openings + story personality (2026-08-17)

John asked why Hero Summon always starts the same, wants starter variety + narrator/System personality, and whether we have a hero-awakening / vampire-system / Solo-Leveling-style premade. Inspiration only — never ship licensed names into play.

## Why Hero Summon feels identical

- UI “Hero Summoning” = archetype `isekai`.
- Only LitRPG bible with that archetype is `summoned-pact`.
- Custom Hero Summon and Premade Summoned Pact both seed that bible.
- Fixed `openingHook` always: seven-ring circle under cathedral, robed figures, blue panel, Pactborn whisper.
- AI is told to rewrite the hook, but ingredients are so specific every run lands on the same beat.
- Weave covers (name / Earth place / clothes / pockets) reinforce the same day-one shape.

## Do we have “hero awakening”?

| Wanted vibe | In SynapticGM today |
|-------------|---------------------|
| Solo Leveling / hunter gates | Closest: **Gatebreak Ward** (tropes only; license note blocks named series) |
| Earth System awakening | **System Integration** |
| Hero summon isekai | **Summoned Pact** / Hero Summon |
| Gothic / romance vampire | PYOA **Crimson Nocturne**, **Onyx Blood Covenant** |
| Vampire cosmetic kit | Theme `vampire-nocturne` only |
| Dedicated LitRPG “awakened vampire system on Earth” or pure SL clone | **No** |

Tutorial beat named `awakening` is UI tutorial, not a campaign.

## What already exists for tone

- `gmStrictness`, perspective, violence/cursing, maturity
- TTS voice packs (cosmetic — not GM personality)
- Bible `premise` / `styleRail` / registrar voice

**Missing:** story personality picker, sarcastic System, jester GM, army-strict narrator, multi-starter deck per bible.

## Proposed product (not built yet)

1. **Starter deck** per bible (8–20 ingredients) — code picks one (or invents a hybrid) at New Game.
2. **Story personality** enum (System + Narrator/GM axes) injected into system prompt for the whole run.
3. Optional New Game UI: “Surprise me” vs pick personality / pick opener family.
4. New LitRPG bible: **Hero Awakening** (Earth gates + private System) — original names only.
5. Optional: Vampire System LitRPG bible (Earth + bloodline System) — distinct from PYOA gothic.

## Inspiration banks (titles = research only; do not emit in play)

### Hero summon / isekai openings (variants to steal as *shapes*)
1. Deliberate kingdom ritual — politics first (Shield Hero-shaped)
2. Class summon / accidental catch-up (peace festival / wrong person)
3. Second summon / returning hero
4. Botched / wrong stamp (already Summoned Pact DNA)
5. Truck / death → rebirth (not circle)
6. VRMMO trap / no logout
7. Portal / door / sleep
8. Demon bargain summon
9. Mass class summon (school class)
10. Peaceful world after demon lord already dead
11. Summon as sacrifice / bait
12. Summon into a war camp not a cathedral
13. Summon mid-battle (circle under fire)
14. Summon into a cell / interrogation
15. Summon by cult not crown
16. Summon by rival nation framing the crown
17. Summon as entertainment / arena
18. Summon with three others (party politics day one)
19. Failed return — stuck after “tour”
20. Quiet rural shrine, not capital

### System apocalypse / awakening (System Integration + Gatebreak DNA)
Countdown panels; street Integration; dungeon-in-shop; E-rank humiliation; glitch Player-only System; early adopter info broker; business/shop survival; portal flood; class vs cultivation fork; registrar cold vs sarcastic Patch AI.

### Vampire / dark system
Gothic PC (already PYOA); Earth awakening bloodline System; academy reincarnated vampire lord; antihero revenge System — **new LitRPG bible if John wants**, not copy titles.

### Narrator / System personalities (prompt rails)
- Cold registrar (default LitRPG)
- Sarcastic Patch / DCC-adjacent System
- Strict army quartermaster
- Chilled tabletop friend GM
- Jester / theatrical GM
- Warm bard / chronicle
- Clinical Auditor (Void Audience)
- Grim war correspondent

## Build order (when John says implement)

1. Types: `storyPersonality`, `starterDeck[]` on bible + GameState
2. `pickOpeningStarter(bible, seed)` + invent hybrid from deck
3. Inject personality into `systemPrompt` / opening mandate
4. Diversify `summoned-pact` starter deck (keep circle as *one* option)
5. **Shipped (2026-08-17):** **Hero Awakening** (`hero-awakening`) — not Earth-locked / not a summon; opening asks folk + world-shape + look + kit; seed-picked `openingHooks` deck (8 shapes) with rewrite license. Vampire LitRPG still open if wanted (PYOA gothic forks are not that genre).
6. Remaining: story personality enum + New Game UI.
7. **Shipped (2026-08-19w):** `openingHooks` on **Summoned Pact** (10 shapes; circle is one option) plus catalog decks for the other ready-mades. Chapter One art pins HERE (person on the floor), not the Earth-origin ask.

Source: codebase explore 2026-08-17 + public trope/series research (inspiration only).
