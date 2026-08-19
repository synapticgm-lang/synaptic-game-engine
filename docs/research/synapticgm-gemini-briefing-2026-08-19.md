# SynapticGM — product briefing for an external model (Gemini)

**Date:** 2026-08-19  
**Audience:** Another AI helping John (founder / software engineer) think about design, copy, or research.  
**Source of truth:** Live codebase under `src/`, `supabase/`, playtest notes. Not the stale root README (still titled “Resonance” and still describes two engines).  
**Build stamp on this machine:** HUD `2026-08-19ac` (Undead Ossuary AI theme textures). Production Vercel can lag; if the live HUD stamp is older, treat this briefing as *intended current*, not necessarily what a random visitor sees.

**How to use this file:** Treat it as canon for what the game *is*. Do not invent systems, races, places, or monetization. Do not recommend adding World of Fantasy (WOF) into the live game. Do not name Dungeons & Dragons, Wizards of the Coast, SRD, or licensed LitRPG/anime titles in player-facing copy. Original tropes only.

---

## 1. What it is

**SynapticGM** (player chrome: **Synaptic GM**) is a **single-player AI Game Master** in the browser. You type what you do. Code + a hosted writer produce the next beat of story, then the app updates sheet, inventory, quests, map, and dice from structured output — not from the model “remembering” numbers.

It is **not** a multiplayer VTT, not a chat wrapper around a wiki, and not an MMO. A later isolated project called **World of Fantasy (WOF)** exists under `wof/` and `docs/research/wof/` only. WOF must never be imported into live `src/`, `supabase/`, prompts, settings, or saves.

**Live surface:** web app (Vercel: `synaptic-game-engine.vercel.app` / `synapticgm.com`). Founder is playtesting. Public store launch, Stripe live secrets, and Kid Mode as a marketed children’s product are **not** done.

**Promise the product is trying to prove:** when you say what happened, the game can show **what became true**, **why it accepted it**, **what it changed**, and **that it survives reload**. Voice/personality may change prose; they must not change facts, dice, kit, HP, or quests.

---

## 2. Four game systems (New Game)

Picked first. Each has its own campaign catalog (bibles), opening ritual, and prompt rails.

| Engine id | Player label | What it feels like |
|-----------|----------------|--------------------|
| `litrpg` | **LitRPG** | In-world System: Status panels, rarities, progression. Writer is System chrome, not a person at a table. |
| `dnd` | **Tabletop Fantasy** | Original SynapticGM d20-style rules: transparent checks, dice tray, AC, slots, rests. **Not a licensed tabletop product.** Optional player-pasted house rules on the save. |
| `rpg` | **Story RPG** | Fiction-first: heists, letters, mysteries, relationships. No LitRPG HUD, no tabletop dice math. |
| `pyoa` | **Pick Your Own Adventure** | Authored spine + forks (ally/betray, party/solo, several endings). Writer-only `styleRail` + hidden stamps (e.g. mystery killer). |

**Custom:** Simple = Blank Canvas seed (no silent System Integration). Expert = accordion (premise / lore / NPCs / quests / opening / kit / PC) with per-section Randomize; snapshot stored on the save.

**Personalities (prompt diction only — firewall):**

- LitRPG New Game shop list: **Cold registrar** (default), **Sarcastic Patch**, **Army quartermaster**, **Friendly System**. Theatrical exists on old saves, not on the shop list.
- Tabletop New Game: chilled / dry sarcastic / theatrical / army / fireside.
- Firewall: personality must never change facts, dice, inventory, HP, permits, quests, NPC presence, or location.

**Difficulty / GM strictness:** Forgiving / Standard / Hardcore (separate from voice).

---

## 3. Flagship campaigns (original bibles)

Catalog is large (~40 bibles). Flagships John actually playtests:

**LitRPG**

- **The Summoned Pact** (`summoned-pact`) — isekai: Earth clothes, summoning circle under Valespire Cathedral (or a seed-picked hook: war camp, etc.), Pactborn vs Calamity Mark. Opening is **weave** (name / look / kit in-world after Chapter One). Camera for art is **HERE in this room**, not an Earth mall flashback.
- **Hero Awakening** (`hero-awakening`) — any folk / any world-shape; not Earth-locked, not a summon. Wake Ledger rails.
- Also: System Integration, Ascending Spire, Inkbound Academy, Hollow Core, Gatebreak Ward, Void Audience, Dungeon Transport, Fabled Legacy, Blank Canvas.

**PYOA (each has its own verbs, spine, ending logic)**

- **Thornferry Road** — small-town road, Wren Holt, mill vs magistrate.
- Mysteries / romance / space / glitch: Giltwood Estate (code-picked hidden killer), Crimson Nocturne, Onyx Blood Covenant, Umbra Protocol, Resin Sonata, Null-Parameter Protocol, Vesper-Glass Cipher, Erebus-9, Rose-Gold Ultimatum.

**Story RPG:** Salt Road Heist, Glass Harbor Letters, Embercourt Oath, Rainglass Case, etc.

**Tabletop:** Cursed Keep, Millstone Road, Broken Crown Keep, Verdant Blight, Stillroot Veil, Shattered Coast, Blank Canvas (tabletop).

NSFW bibles exist for **website adult** only; Kid Mode and store builds hide them. Hard rails still forbid minors / non-consent.

---

## 4. Core loop (what happens on a send)

1. **Player** types free text or taps a choice / stance (kind / hard / talk / walk-away on non-lethal beats). Talk and protest are **dialogue**, not a physical stub.
2. **Capacity:** a text turn is spent (see §7). Opening setup answers (name chips, etc.) are **free**. Empty / abort / fail **refunds**.
3. **IntentContract** turns the send into obligations (act / answer / refuse / correct / talk / observe / open-ask). The draft must honor them or explicitly resist. Retry if missed.
4. **Code** owns math: dice, damage, HP, conditions, loot rarity, dungeon graph, XP, inventory ownership, death. Combat can be **ledger-first** (outcome token before the writer). Casual dialogue skips Social DC.
5. **Writer** (hosted OpenRouter) narrates **story first**, then System/status. Never a System-only turn. Atmosphere is free; invented kit/people/places are not.
6. **Wardens** scrub: perspective, locality (UK pavement / £ / 999 when that token is on), article collisions, “nearby building” tautology, System jargon, claim-grounding, leak scanner (no internal jargon in player prose).
7. **StateTx** + `ledgerRevision` commit what became true. Speculative retries are not world truth. HUD can show **Why?** receipts.
8. **Choices** are validated (no lunge at a corpse, no loot-again, combat buttons are fight moves). Opening choices need a **stake**.
9. Optional **fluid reveal**: post-commit sentence-by-sentence; Settings → Narrative can prefer full reply.

**Do not ask “What do you do?”** until a real beat exists.

**Opening ritual:** many LitRPG/isekai bibles **weave** remaining facts (name, Earth origin, clothes) as in-world covers with chips. After covers, the writer **continues the already-written scene** — no thin “particulars settle” lock line. Quest Unlocked toast waits until opening establishment is complete.

---

## 5. Truth stack (memory / anti-hallucination)

Authority order (high → low):

1. Player correction (pinned)
2. CampaignContract (frozen opening: name, place, kit rail, premise)
3. Accepted StateTx / ledger revision
4. SceneManifest / location sheets (current + previous)
5. Named NPC memory, unresolved consequence ledger
6. 5-turn / location micro-summaries
7. Writer draft (atmosphere only unless permitted)

**IntroductionPermit** is required before inventing a named person. HookArc is a **soft offer** — ignoring a quest must not railroad. Named NPCs remember kind/hard/talk/walk-away treatment (no karma meter).

There is **still no general “does this make sense?” LLM critic**. Continuity is rails + wardens + ledger, not a second model judging plot.

Pack 11 long-memory compression exists in code (`campaignMemory`, timeline facts). Do not recommend a new memory architecture unless John asks; the win condition is **visible durable correction**, not more retrieval.

---

## 6. Presentation

**Classic Text (default launch path):** prose-first. Optional **Memorable Moment Images** (off by default).

Memorable, when on:

- Paint: **one** ink-and-watercolor illustration **filling the frame**. Technique only — **never** a picture of an open book, two pages, or fake writing. (A 2026-08-19 playtest bug drew a literal storybook spread + a child PC; local fix is HUD `19ab`.)
- Viewpoint character is an **adult (18+)** unless appearance/bio explicitly names a child.
- **Auto:** Chapter One opener (toast “So it begins”), death, **first dungeon’s final boss only** (e.g. First Blood / Stockboy), PYOA true ending (`<campaign-ending />` once).
- **Tap-yes:** later dungeon bosses, first king/ruler audience, striking first look, writer `<milestone-event>` tag.
- **Never auto:** first fight, trash mobs, ordinary NPC meets.
- Weekly cap spends first; opener **bypasses** weekly cap. Free +1/day via rewarded ad after cap (max +3/week). Packs: Snap +10 / 99p, Album +20 / £1.99, Gallery +50 / £3.99 (cheap model, never expire).
- Fail: story stays; compact “Hosted image service is unavailable”; retry. No gold Milestone slab.

**Comic Book:** panels, bubbles, layouts exist in code. **Illustrated graphic-novel daily caps are reserved; launch is text + optional memorable art.** Full comic is a deliberate later / No-Go near-term.

**UI chrome:** HP/MP (or SP) HUD, turns left, Map, Book/journal, Inventory (paper-doll, WoW-like layout without Blizzard IP), Salvage (LitRPG — clinical System salvage, not a street shopkeeper), Settings. Left: World / Squad / Quests / Shrines. Right: Adventurer sheet.

**Maps:** street-style outdoors; indoor = floor-plan silhouette + fog (visited rooms). Entering a store can lock a First Blood dungeon graph. Map labels are **scale**, not dungeon danger. No bouncing MOVE orbs on the street. UK locality: no civilian pistols on the street.

**Themes / Shop:** race and premium kits (Vampire Nocturne, Undead Ossuary, elf/dwarf/orc sets, etc.) restyle panel textures, typefaces, dice, frames. They must look like **materials**, not Integration-teal recolors. Cosmetics never sell combat outcomes.

**Inventory pictures:** bundled original glyphs for paper-doll / item / armor / weapon. Memorable plates still use hosted Flux when opted in.

**Kid Mode:** one Google Play Families bar on prose, choices, system text, quests, TTS, and **all image prompts**. Skip unsalvageable sex/gore/drugs/gambling **before** API spend. Fun swear swap + PIN. **Not** a public children’s product until counsel; do not market it as COPPA-complete.

---

## 7. Capacity, models, money

Payments (**Stripe live**) are **not** on. Caps and models are enforced locally / ready for server auth. Settings → **Test Lab** can mark a device for unlimited QA capacity and switch hosted Free / Mid / High.

| Tier | Writer (hosted OpenRouter) | Text turns / day | Memorable / week | Notes |
|------|----------------------------|------------------|------------------|--------|
| Free | `google/gemini-2.5-flash-lite` | 12 | 5 | +8 story-start text turns once per New Game. Rewarded ads: +3 text today. |
| Mid | `anthropic/claude-haiku-4.5` | 20 | 20 | +5 story-start. No ads. |
| High | `anthropic/claude-sonnet-4.6` | 24 | 40 | +3 story-start. |
| Admin BYOK | same High writer if using hosted; else player keys | High floor | High floor | Website only. Hosted text/image keys are **not** in the browser. |

Story-start bonus: HUD shows “N start”. Opening covers do not consume daily/pack turns.

**Hosted art:** `black-forest-labs/flux.2-klein-4b` (cheap memorable / Free–Mid). High memorable plates: `flux.2-pro`. Path: Supabase `generate-image` + session/anon JWT — Free/Mid/High do **not** need a browser OpenRouter key for pictures.

**Text path:** Supabase `gm-turn` (hosted). Admin BYOK uses the player’s OpenRouter text key.

Text packs (shop UI exists; billing not live): Spark +15 £1.99, Chapter +35 £3.99, Saga +80 £7.99. Packs never expire; they use the **current** tier writer (no model upgrade).

---

## 8. Tech (for architecture questions)

- Client: React + TypeScript + Vite.
- Persistence: IndexedDB primary; optional Supabase cloud SSOT when signed in.
- Edge: `supabase/functions/gm-turn`, `generate-image`, ops schema.
- Writer output is tagged; a parser applies character updates, items, quests, `<image-prompt>`, `<milestone-event>`, `<campaign-ending />`, appearance updates.
- Tests: Vitest (including memorable/image prompt rails and fluid-chat fixtures).

---

## 9. What is live vs not

**Live / in playtest**

- Four engines, premade + custom, weave openings, ledger-first combat, IntentContract, CampaignContract, folk NPC voice banks (public-domain tropes), stance choices, Test Lab, Classic memorable splashes, theme kits, Kid Mode filter, capacity HUD, refunds on fail.

**Waiting (ops / later — not “add this next” unless John says so)**

- Stripe live secrets, server-authoritative capacity, counsel legal pack, Kid Mode **public** gate.
- Full accessibility release gate, Expert author tools, audio lite, **full comic**.
- Shop preview parity / five-rater for premium themes.
- WOF (separate later game).
- Own-model / GPU narrator (explicitly not the next architecture project).

**Known quality holes (honest)**

- Image models still over-literal (open book, child PC, Earth mall) unless prompts are brutal; 19ab/19w exist to pin Chapter One.
- No general LLM “sense” critic.
- Continuity is good when rails fire; long campaigns still need the correction-survives proof, not more lore dumps.
- Root README is outdated; this briefing beats it.

---

## 10. Product law (do not violate in suggestions)

1. **Code owns numbers.** The writer narrates the outcome token; it does not re-roll or invent loot/HP/kit.
2. **Voice ≠ rules.** Personality and folk flavor never change the ledger.
3. **Original worlds.** Genre tropes yes; named novels, anime, tabletop brands, Blizzard, Fable/Albion, Solo Leveling, etc. **no**.
4. **Player correction sticks.** Pins + revision beat retrieval.
5. **Story first, then System.** Never a System-only turn or `XP Gained: 0` as the whole beat.
6. **Memorable is rare and cheap** unless the player opts in. Stock kit art is glyphs.
7. **WOF stays sandboxed.**
8. **Do not implement playtest notes until John asks for the next update** — but you may *discuss* them.

---

## 11. One-paragraph pitch (if you need a short version)

SynapticGM is a single-player browser AI GM for original LitRPG, tabletop fantasy, story RPG, and pick-your-own-adventure campaigns. You type actions; a hosted writer (Gemini Flash Lite on Free, Claude Haiku/Sonnet on paid rungs) narrates, while code owns dice, HP, inventory, and quests. Classic play is prose with optional rare splash illustrations. The live work is making continuity *visible* (why a result happened, corrections that survive) before store billing, full comic mode, or any MMO/WOF features.
