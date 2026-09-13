# Manus commission — AI response quality (narration + NPC), pipeline-safe

**Date:** 2026-09-13  
**Product:** SynapticGM (hosted browser RPG)  
**Job type:** NEW Manus project. Research + informed analysis only. **No game code. No Cursor implementation prompt. No second app.**  
**Filename prefix:** `SynapticGM_ai_response_pipeline_2026-09-13`  
**Author of this brief:** Cursor, from the live tree + playtest board. Treat this file as the current-state source of truth unless an attached source contradicts it.

---

## What John wants

Free-tier AI answers to a **typed player line** should feel closer to Dungeon AI / NovelAI on the turns that are allowed to write:

- Natural narration **or** a spoken NPC line that answers *this* input
- Fluid, consistent voice
- Memory of what was already said (ledger + last beats, not a new memory product)

**And** the existing anti-hallucination pipeline must stay in charge of facts:

- HERE / CAST / kit / HP / lastKill / quest titles / loot / crowd count are **code + ledger**
- The writer must not invent people, rooms, items, or reverse committed facts

This is **not** “make Free a 150–300 word novelist every turn.” Silent receipts, opening stitch, and the commit gate exist because that novelist invented clerks, living corpses, and `this room`.

**Honest ask:** how do we get better *answers* on writer-allowed turns, and (if needed) less telegram/receipt feel on talk, **without** giving the model the world again.

---

## Success for this Manus job

Deliver **analysis + ranked options that fit the owners below**. John + Cursor will pick a slice and test it on **this** tree with Fate + Gemini.

A good job:

1. Diagnoses *why* talk/narration still feels thin or off, using the **actual split** (stitch vs Silent vs `callGm`)
2. Lists what already works and must not be rebuilt
3. Offers **3–5 concrete options**, each with: owner file, what changes, what must not change, risk, how we would measure it on Fate/Gemini (we already have those tools)
4. Marks any option that needs Mid writer or new prompt-essay as **out of contract** unless it says so explicitly and John would have to approve

A failed job (do not do this):

- New `aiDirector.ts` / second GameState / Pillar 1 JSON dump
- SNAPSHOT/CRAFT essays, 100 encounter templates, 200 opening clones
- New dialogue-tree UI, new combat FSM, Playwright AI player
- Python A/B harness or 50 synthetic scenarios that invent a different game
- “Literary 150–300 words every turn” as the Free mandate
- Claiming current quality is 4/10 and Manus will add +3 (those numbers are not ours)

---

## Deploy truth (read this first)

| Surface | Stamp / commit | Notes |
|---|---|---|
| **This working tree** | HUD/BUILD **`2026-09-12e`** | Branch `fireworks-free-09a`. 12e = map **chrome only** (colors/fog/?). Does **not** change GM answers. |
| **`origin/fireworks-free-09a`** | **`36eab13`** HUD **`2026-09-12d`** | Grain-ship hall talk + catalog extras + edge sync. **Pushed. Not on `main`.** |
| **`origin/main`** | **`7911f58`** HUD **`2026-09-11f`** | Production track. |
| **synapticgm.com** | HUD **`2026-09-11f`** | Vercel follows `main`. Grain-ship + 12e **will not show** until John says merge. |
| **`gm-turn`** | Project `wzgsrpwhmgffcyohvtko`, version **80** | Deployed this cycle. `verify_jwt: false` kept. |
| **12e commit** | **Not committed** | Local only as of 2026-09-13. |

If Manus analyzes “the live site,” it is analyzing **11f**, not 12d/12e. Say which surface each claim is about.

**Local gate (12d, not live):** Fate 4×T10 seed 42 storyfollower, hosted Free writer. All 10/10, readability PASS, 0 errors. Hall talk stayed local (~70–120ms). No `this room` / `finished the beat` settle. Combat-by-T8 false (drought is 8–15; expected at T10). Pastes: `scripts/fate-autoplay/runs/12d-4xt10/`.

---

## Product (do not rename)

Four engine modes. Flagships:

| Mode | Bible id | What the book must feel like |
|---|---|---|
| LitRPG | `summoned-pact` | System chrome is UI, not a person. Combat + quest drip. |
| Tabletop | `cursed-keep` | Dice-honest. Party / investigate / position. |
| Story RPG | `salt-road-heist` (flagship; Cape exists) | Leverage, talk, moral stakes. |
| PYOA | `thornferry-road` | Forks and endings. Not an RPG talk loop. |

**Free writer now:** Fireworks DeepSeek V4 Flash (`accounts/fireworks/models/deepseek-v4-flash-0731`) via hosted `gm-turn` / OpenRouter path. Failover Llama 8B on empty/timeout only. **Mid writer OFF** (`STAGNATION_MID_WRITER_ENABLED=false`). Mid Haiku / High Sonnet stay paid tiers — do not auto-escalate Free.

**Kid Mode** still filters. Do not recommend unfiltered NovelAI.

---

## Who writes the player’s answer RIGHT NOW

This is the current game. Do not describe it as “the LLM narrates every turn.”

```
Player line
  → hard gate (invented item / absent companion / safety)
  → ArcDirector / encounter FSM / XP  (commit mechanics FIRST)
  → Completed Event Packet (verb, HERE, CAST, outcome)
  → THEN one of:

  A. Opening stitch          local, no GM
  B. Opening cover-continue  local stitchOpeningContinue
  C. Hall talk after covers  local stitch (who / want / refuse / where / panel / stay-leave / home-earth)
  D. Silent Engine receipt   no GM  (Look / Wait / travel / combat after covers, Free)
  E. callGm                  DeepSeek  (talk / leftover asks; Mid/High always writer)
  → warden + commit reject → one retry → assemblePacketStitch fallback
  → pads from graph / ledger, not from GM lists
```

### A — Page 1 (`stitchOpeningScene`)

- Prints authored `page1` (+ optional cover ask). **09b:** no extra beats, no shared indoor spice, no Title-Case invent smash.
- New Game does **not** `callOpeningGm` over the stitch (09a flash-then-swap was the bug).

### B — Cover-continue (`stitchOpeningContinue`)

- Answers why / name / where / want from **this card** (`summonIntent`, CAST). No `callOpeningGm`. No packet lecture. No pad list in prose.

### C — Hall talk (`shouldStitchOpeningContinue` / `isOpeningHallTalkTurn`)

- After covers, who / want / refuse / where / panel / name-lock / stay-leave stay **local**.
- **12d:** `You summoned me… cargo run… get back home? To earth?` is `spoke`, not Silent `acted` at `this room`. Generic HERE uses cover `answers.where`.
- Repeat who/want/refuse uses `openingAlreadyToldLine` (quote the card; do not reprint the paragraph).
- **11d:** refuse is not the want slot. Bare `refuse` is not hall talk.

### D — Silent Engine (`SILENT_ENGINE=true`, `freeMudPresentation`)

- Free, after covers: Look / Wait / travel / combat = **receipts only**. No DeepSeek micro-flavor (08d killed 08c flavor).
- Talk / ask / who / where / want **must not** Silent (10f treaty tent: Silent talk printed “Silence held” / game-over).
- Gemini 09c Live Drive scored play **~2.03** because the displayed body was `HERE` / `ACT` / `CAST` receipts. That is expected while Silent is the play writer.

### E — `callGm` (hosted DeepSeek)

- Slim packet: last **2** beats, no SNAPSHOT/CRAFT essay (`formatCraftSnapshotLines` = `[]`, 02n).
- CAST = named people on the ledger only (02j/02aa never-CAST). Quest titles are never CAST.
- Commit gate rejects invented Title-Case, living lastKill, instruction voice, numbered lists, loot-too-early, writer monologue, token salad.
- Fail → one stricter retry → **`assemblePacketStitch`** (not a copper/wet-stone vendor bank).
- **08a lesson:** if stitch becomes the novelist, Gemini story lens **1.25**. Stitch is a fallback, not the writer.

**Pads:** `choiceCompiler` / `graphChoices` from legal edges. Combat = Attack/Flee/Talk/Loot, not crate/Wait. Cover pads = Give/Refuse or one “Ask what they want” — never hub travel.

---

## Already live — do not rebuild

| System | Owner | What it already does |
|---|---|---|
| Opening stitch + covers | `openingStitch.ts`, `openingEstablishment.ts` | Page 1 + hall Q&A without GM |
| Silent Engine | `freeMudPresentation.ts` | Receipt verbs skip GM |
| Packet + verb | `completedEventPacket.ts` | Mechanics-first; 12d hall verb = `spoke` |
| ArcDirector drought | `arcDirector.ts` | Combat 8–15 turns; catalog foe, not a novel token |
| Encounter catalog + FSM | `src/data/encounters/`, `encounterTerminalFsm` | Named foes; lastKill not living Talk |
| Never-CAST / fact-close | `narrativeHarvest`, `entityCast`, `chromeAuthority` | Places/panels/quest titles are not people |
| NPC memory | `npcMemories[]` (12a/12c) | introSpoken, purchases, quest-giver exit, disposition pads |
| SP hubs + 24 Phase 4 hooks | bible + `summonedPactPhase4Hooks.ts` | Honest 24 cards, not 200 clones |
| PYOA spine | `pyoaBranchLedger` / `pyoaSpine` | Forks; Accept-ending can end |
| Fate + Gemini | `scripts/fate-autoplay/` | **This** is the simulator. Do not invent another. |
| Voice / TTS | `useVoice`, `gmVoiceProfile` | Personality is diction, not facts |
| Map floor plans | `mapEngine.ts` 20n–20q; chrome 12e | Varied footprints already; 12e is paint |

---

## Hard locks (copy into every recommendation)

1. Mid writer stays **OFF** unless John names it.
2. No new GM prompt-rule pile. Prompt fat already failed (02n diet).
3. No SNAPSHOT/CRAFT writer essays. Compiler may still pick craft internally; writer must not see a lecture.
4. Stitch is **not** the novelist (08a/08b).
5. No second director. Live `arcDirector` stays.
6. No Pillar 1 / Ultimate / 4K dialogue UI into `src/`.
7. No new combat FSM / loot RNG / 60-per-hub catalog.
8. No Playwright “AI player.” Fate is the player.
9. Do not sync full client `openingEstablishment.ts` onto edge (stub regex only).
10. Copyright-safe chrome only (no WoW/RE/Blizzard/Capcom assets).
11. WOF (`wof/`) is a later project. Ignore it.

---

## Gemini / telemetry (use these, not invented 4/10 or 8/10)

Story-lens means (approximate; one seed unless noted):

| Stamp | What was scored | Overall / notes |
|---|---|---|
| 27w | 12×300 quality-governance | ~**1/10** all modes. Pads 180–260×. Combat receipts **0**. |
| 02k 4×T50 | dead-foe greeter lock | LitRPG 3 / D&D 2 / RPG 6 / PYOA 4 · mean **3.75** |
| 02l 3×4 T50 | charter + panel | mean **3.50** |
| 02n 4×4 T30 | packet diet | mean **2.50** (Hangul/salad leftover → 02o) |
| 02q 4×T30 | one camera / one fight | mean **4.00** |
| 02r 2×4 T30 | scene tail / stale HERE | mean **3.88** (held) |
| 08a 4×T50 | packet + stitch-as-writer | story **1.25** (worse than 02ac **2.00**) |
| 08b 4×T50 | shrink gate, authored stitch | story **1.50**. Stitch still majority of turns. |
| 08d 4×T50 | Silent, no Gemini critic | 50/50 PASS systems. Flavor 0. Combat still thin. |
| 09b openings | stitch page 1 only | LitRPG **8.35** · tabletop **9.0** · RPG **9.0** · PYOA **8.33** — **page 1 is solved** |
| 09c Live Drive 4×T20 | typed cover then Silent play | response **2.03** · options **1.98** |
| 12d 4×T10 | local Fate, no Gemini | systems PASS; not a story score |

**Read this correctly:** authored openings can hit 8–9. **Play** under Silent + packet fallback sits ~2. Systems (combat spawn, no corpse-talk, L2 drip) are a different axis and have improved. Do not average 09b and 09c into “current 4.”

Honest Manus ceiling from BIG CHANGES (T6), still the planning number: one disciplined authority batch **4.5–6.5**; three batches **7.0–8.5**; **9–10 not schedulable** from writer tricks alone.

---

## History — what we tried, what failed, why (ogs)

Read newest first. Each line is **why**, not a feature ad.

### Openings (solved in code; live site may still be 11f)

| Stamp | Try | Failed / held | Why |
|---|---|---|---|
| 20f–20k | Instant stitch, alone covers | Held as fallback | GM-first opener was slow/empty |
| 25c | `callOpeningGm` page 1 | Flash-then-swap; invent | Writer ignored card |
| 09a | Invent-quota smash | `She`/`Someone` → `someone here` | Title-Case gate treated sentence-start as names |
| 09b | Page 1 = one authored paragraph | **Held** (Gemini 8–9) | Extra beats + spice + name banks were the mush |
| 09c | Cover-continue local | Held vs GM echo | `callOpeningGm` reprinted packet / empty HERE |
| 10b–10j | Cover answers typed line; CAST speaks | Held | Silent + wrong CAST (panel / Ash / priest) |
| 11b–11f | Who/want/refuse already-told; ledger deficit | Held | Want reprinted Who; name write needed empty `coversPending` |
| 12d | Grain-ship home/earth | Held in vitest + T10 | Verb `acted` + HERE `this room` → Silent settle |

### Writer / prompt (failed when the model owned facts)

| Stamp | Try | Failed / held | Why |
|---|---|---|---|
| 27w | Ten quality modules + SNAPSHOT mandates | Gemini ~1. Pads/combat unchanged | Mandates around the GM; GM still planned the world |
| 29d | Prompt diet + PROSE LICENSE | Partial | Flash Lite ignores extra sentences |
| 31g | CRAFT book (≤2 lines) | Writer ignored | Extra instruction ≠ commit |
| 02n | Drop LAST PAD / CRAFT / clerk license | Diet held; scores still ~2.5 | Less fat ≠ better novelist |
| 02z | Sealed BeatContract + slim packet | Needed | Writer was inventing HERE/CAST |
| 08a | Retrospective packet + stitch fallback | **1.25** | Stitch became the writer; identical landing stubs |
| 08b | Shrink gate, rotate stitch | 1.50 | Still stitch-majority |
| 08c | Receipt + micro-flavor | Superseded | Flavor still a GM call; 08d turned it off |
| 08d | Silent Engine | Systems PASS; story ~2 | Receipts are not NovelAI. Talk must still `callGm` (10f). |

### Continuity / hallucination (these locks stay)

| Cluster | Examples | Owner | Do not “fix” by prompt |
|---|---|---|---|
| CAST inventions | Fence, clerk, `the stranger`, quest titles, chrome panel | harvest + never-CAST + 02p occupancy | Deny-lists grow forever |
| Fact-close | Dead foe greets; burned charter clutched; copper after give | lastKill + kit + `givenAway` | |
| HERE / camera | Leave-reach + old fight; street after indoor | travel stamp + commit | |
| Token salad | Hangul/Thai empty GM; `no oneed`; `clickaire` | extract + reject | |
| Talk loops | Want Q&A ×28; corpse Talk | starve pads + lastKill graph | |
| Repair banner | Conversational `or` froze UI | 12b safety-only | Do not bring `ambiguous_action` back |

### Content (Manus clones vs honest decks)

| Try | Result | Law |
|---|---|---|
| 200 Phase 4 hook clones | Rejected | **24** unique SP cards (12c) |
| 60-per-hub encounters | Rejected | Honest extras 12d: +10 LitRPG, +4 D&D, +4 RPG, +2 PYOA. Existing FSM. |
| 5-week “complete integration” | Research only | No Pillar 1 JSON, no Ultimate director, no 4K dialogue UI |
| Map WoW/RE prompt | 12e chrome only | Original colors. No licensed art. No layout rewrite. |

### Transport / ops (not story, but they look like “AI failed”)

| Stamp | Bug | Lesson |
|---|---|---|
| 02c / 02e | Wrong Free model / empty `reasoning_*` | Hosted writer must be DeepSeek on OpenRouter key |
| 10g | Edge stub missing → 503 / `contentSanitized` | Hall talk must stay local; fail path must not TDZ |
| 11a | Founder email login | Needs Dashboard + Vercel env; not a writer issue |

---

## Files Manus should read (attach or quote; do not guess)

**Pipeline (current owners):**

- `src/game/useGame.ts` — live send path (stitch / Silent / `callGm`)
- `src/game/fateAutoplay.ts` — same owners, headless
- `src/game/freeMudPresentation.ts` — `SILENT_ENGINE`, receipt vs talk
- `src/game/completedEventPacket.ts` — verb, HERE, CAST, stitch fallback
- `src/game/openingStitch.ts` + `src/game/openingEstablishment.ts` — page 1 + hall talk
- `src/game/situationPacket.ts` — slim SNAPSHOT (facts, not CRAFT)
- `src/game/craftBookCompiler.ts` — `formatCraftSnapshotLines` → `[]`
- `src/game/proseWarden.ts` + `src/game/warden.ts` — post-write repair
- `src/game/choiceCompiler.ts` + `src/game/graphChoices.ts` — pads
- `src/game/arcDirector.ts` + `src/game/encounterBible.ts` — drought / catalog
- `src/game/masterPrompt.ts` + `src/game/systemPrompt.ts` — **secondary**. Do not treat these as the novelist spec; they lost to pipeline.
- `src/game/writerPolicy.ts` — Mid OFF
- `src/game/subscriptionTiers.ts` / `supabase/functions/_shared/playPrivileges.ts` — Free = DeepSeek V4 Flash
- `.cursor/rules/playtest-notes.mdc` — board (Open + Waiting + Done)

**Scores / why:**

- `docs/bugs/gemini-reviews-2026-09-02/SYNTHESIS-09C-LIVEDRIVE-T20.md`
- `docs/bugs/gemini-reviews-2026-09-02/SYNTHESIS-08A-VS-02AC.md`
- `docs/bugs/gemini-reviews-2026-09-02/SYNTHESIS-08B-VS-08A.md`
- `docs/research/RETROSPECTIVE-NARRATOR-08B-2026-09-08.md`
- `docs/research/SILENT-ENGINE-08D-2026-09-08.md`
- `docs/research/manus-big-changes-ingest-2026-08-27.md`
- `docs/research/CURSOR-COMPLETE-INTEGRATION-PLAN-2026-09-12.md` — **lock: do not run the 5-week prompt**

**Optional tapes (if John attaches):**

- 10 good / 10 bad **real** turns: player line + displayed GM body + whether path was stitch / Silent / `callGm` + Gemini note
- Live 11f grain-ship: save `64c739d3` (closed in 12d on this tree, **not** on synapticgm.com)
- 12d T10 folder above

**Do not prioritize:** `docs/research/manus-next-stage/`, `manus-ultimate-transformation/`, `manus-4k-plan-guide/` as “what to build.” They are rejected dumps.

---

## Recommended option space (Manus may refine, not replace)

These are the only families that fit the pipeline. Rank and sharpen; do not add a sixth architecture.

| # | Family | Idea | Fits | Risk |
|---|---|---|---|---|
| 1 | **Talk-only writer** | Keep Silent on Look/Wait/travel/combat. Spend DeepSeek only when `classifyVerb` is `spoke` / ask. Slim the talk packet to: last player line + CAST quote + last 2 beats. | Yes | Writer still invents; commit gate must stay |
| 2 | **Authored talk stitch** | First who/want/refuse already local. Extend **card-grounded** spoken lines for more hall topics (home/earth already 12d) without GM. | Yes | Becomes telegram if not card-grounded (09c leftover) |
| 3 | **08c flavor, talk-safe** | One micro-sentence on Silent verbs **or** only on talk — never a second director. | Maybe | 08d turned this off for a reason; measure Gemini + empties |
| 4 | **Display, not writer** | Keep receipts as STATUS; show a short authored sentence bank keyed by verb+outcome (08b) **only** when `callGm` fails. | Yes | 08a/08b already proved identical stubs fail if this is the common path |
| 5 | **Mid writer on talk only** | Paid/test: Haiku for `spoke` after covers. | Out of contract unless John says | Cost; still needs the same ledger |

**Out of contract unless John overrides:** restore SNAPSHOT/CRAFT, NovelAI-style raw continuation of the whole log, new memory LLM, “50 synthetic scenarios,” new combat writer.

---

## Deliverables (only these)

1. **Diagnosis (≤4 pages).** Why play narration ≠ NovelAI *given Silent + stitch + slim packet*. Separate: (a) writer never called, (b) writer called but packet/warden crushed it, (c) fallback stitch is the body, (d) live site is 11f so 12d is invisible.
2. **Hold list.** What not to touch.
3. **Ranked options (3–5).** Each: owner path, 1-week slice, Fate/Gemini measure, leftover risk. Prefer talk-path quality over “every turn is a novel.”
4. **If samples attached:** per-turn path classification (A–E above) and whether the miss is owner or writer.
5. **One paragraph** on Dungeon AI / NovelAI vs this tree (context assemblers vs ledger-first). We already know they differ; do not recommend becoming them.

**Do not deliver:** code, SQL, new Cursor 5-week prompt, token budget theater, A/B Python, “+3 Gemini points” promises.

---

## John will decide after this

Default remains **playtest 12d/12e**. Merge to `main` only if John says so (required for synapticgm.com to leave 11f). Cursor implements **one named slice**, not a roadmap dump.

**End of brief.**
