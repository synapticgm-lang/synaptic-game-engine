# Why Josie’s session drifted — architectural diagnosis

**Not a patch list.** No new NEVER-LINES. HUD she was on: **`2026-08-30S`** / BUILD `2026-08-30l`. Mid writer **OFF** (unchanged; not the fix).

**Tester:** Josie Pilgrim · `wyattpilgrim16@gmail.com` · staff  
**Save:** `22a4f976-fc6f-467c-9af7-6927eaefd5d5` · LitRPG · The Summoned Pact · seed `snhqge5c`  
**Ledger export:** turn **8** (earlier `.md` tape stopped at turn 6)  
**Dumps:** full `game_state` + fresh playtest pack (this folder). `aiTraffic` stores **player_input + ai_response only** — no SNAPSHOT body. Packet below is reconstructed from `situationPacket.ts` + this save’s ledger.

Local **30T–31b** is in the working tree and **never pushed**. Live will keep doing this until John says push — and a push still leaves travel, demand, and plate-before-prose without a pre-GM owner.

---

## 1. What the ledger believed (end of save, turn 8)

| Fact | Ledger |
|---|---|
| PC | Josie · L1 · **92 XP** / 200 · HP 24/24 · clothes + sealed Bag |
| Location string | `The Sevenfold Circle under bombardment` (never changed) |
| Camera / map | `locationSheet.mapScale = interior` · dungeon `interior-plan` @ **Entry** · visited `{entry}` · Foyer door exists |
| Indoor | `sceneFacts.indoor = true` |
| Crowd | `crowd: "present"` — **no `crowdCount`** (30X not live) |
| `present[]` | **`blue panel`, `handlers`, `bystanders`, `Place`, `Scattered Scale`** |
| Props | `blue panel`, `cracked street` |
| Opening | `complete: true` · name/look/where locked · **not alone** |
| Hook card | `Place: The Sevenfold Circle under bombardment` · rite under fire · blue panel hangs · optional salvage kit |
| Hook fallback (art) | **“You are on your back in the seven-ring circle”** |
| Pinned NPCs | **`Place`, `Scattered Scale`** |
| Hook why lock | **absent** (`sceneFacts.hookLock` not on this save) |
| Quests | Circle’s Price **active**; bearings **done**; **reason heard (stage 2)**; swear/refuse still open |
| ArcDirector | committed `sp-beat-orient` (T4), `sp-beat-hear-reason` (T7, **+45 XP**), `sp-beat-hub-pressure` (T8) |
| Social milestone | `why i was bought here` @ this location |
| Faction note (packet) | Pellane Crown: **“They paid for a Pactborn.”** |
| Sealed manifest gist (T7) | **OPENING PIN: Place, Scattered Scale remain present** |
| Manifest forbidden | quest/encounter/item/XP reversals — **not** accident↔pawn, not crowd, not indoor/outdoor |
| Kit / registration | clothes + bag · System lines still **Registration incomplete** on T0/T2 · stamp/gift unresolved |
| Memorable | Chapter One plate **did fire** (`openingSplashFired: true`) |
| Mid writer | `STAGNATION_MID_WRITER_ENABLED = false` |

Committed book (log), in order:

| Turn | Player (what she meant) | What landed on the book |
|---|---|---|
| T0 | (opening) | Stand on **circular mosaic** · **few** · **`1. Scan…` glued into the paragraph** |
| T1 | Ask what is going on | **Reprints the opening paragraph** · crowd → **group** · rite **gone awry / pulled through** |
| T2 | `"send me back to my world!" I demand` | **`They are still waiting for a name you will own.`** (no GM) |
| T2 | Josie | Camera snaps to indoor **“Entry” / Foyer / “what the map indicates”** · no travel line |
| T3 | Typed **`Run away`** | Bubble + GM input became the **safer-scene scan** template |
| T4 | (that template) | **Two figures who were present when you arrived** · quotes the template as speech · **King’s men → blue panel men** |
| T5 | Walk the door | **push the blue panel** · **the blue panel, Place, … his posture tense** |
| T6 | Examine the room | New room · pad still **Examine the blue panel** |
| T7 | Typed **`Ask why I was bought here`** | **T5 door sentence + T6 ozone/walls + new guard** · **“bought / pawn for Pellane’s game”** · **the blue panel believes** · **+80 XP** (20 daily + 15 talk + 45 arc) |
| T8 | `"I don't want to be a pawn"` | **handlers steps** · **“blue panel states”** · **“the blue panel has need”** · pad recycles T0 **Ask what is going on** / **Approach the doorway to Foyer** |

---

## 2. What the writer was told (packet vs `aiTraffic`)

`aiTraffic` for this save: 8 rows, provider label `OpenAI` (hosted proxy name, not the model). Latencies 2–6s match **Free Gemini 2.5 Flash Lite**. **No prompt / SNAPSHOT stored** (30S residual: live saves do not persist the packet).

Reconstructed SNAPSHOT the writer actually saw (from `formatSceneSnapshotForPrompt` + this ledger):

- `Location: The Sevenfold Circle under bombardment`
- `Location Type: interior` (once `indoor` flipped)
- `Crowd: present` (no locked headcount)
- `Presence: blue panel, handlers, bystanders, Place, Scattered Scale`
- `Props: blue panel, cracked street`
- `Map: interior` + dungeon **Entry / Foyer**
- `OPENING PIN: Place, Scattered Scale stay present and consequential`
- `AUTHORITY: SNAPSHOT + ledger win on facts… Do not recycle…`
- `PROSE LICENSE: Full artistic freedom…`
- `[FACTION MATRIX: Pellane Crown=neutral — They paid for a Pactborn. …]`
- Campaign contract: ritual **pulled you through**; camera HERE; do not teleport if Location is already elsewhere

What `aiTraffic` proves the writer **wrote** (raw, before warden):

| Input sent to writer | Raw reply |
|---|---|
| `(opening)` | Mosaic + **few** + proper numbered list **1–4** |
| `Ask what is going on` | **Same opening paragraph** + **group** + rite awry / pulled through |
| `Josie` | Indoor **Entry** / Foyer / map language — **no leave/reach** |
| `I address a bystander… My words stay: I scan for any hostile threat…` | Quotes that line as **“you state”** · **two figures** · **The King’s men** |
| `I walk nervously through the door…` | **push it open** · **The official, Place, … his posture tense** · pad **Ask Place** |
| `Examine the room…` | Room essay · pad **Call out to Place** |
| `Ask why I was bought here` | **Door + ozone collage** · **bought / pawn / Pellane’s game** · **The King believes** |
| `"I don't want to be a pawn" I say` | **A figure states** · **you were summoned** · **Pellane has need** · **Ash Court** |

Warden then **defeated** the raw nouns: official / King / figure / it → **blue panel**; handlers token glued onto the figure.

---

## 3. What it wrote anyway (and what the warden added)

The writer ignored AUTHORITY whenever the packet **contradicted itself** (Presence lists a panel as a person; faction says “paid”; hook card says accident; pin says Place). Flash Lite picked a sentence and continued.

The **book** is worse than the raw draft because **post-GM scrub ran and won**:

- `the official, Place` → `the blue panel, Place`
- `you push it open` → `you push the blue panel`
- `The King’s men` → `the blue panel men`
- `The King believes` → `the blue panel believes`
- `the figure states` / `Pellane has need` → `blue panel states` / `the blue panel has need`

IntentContract **did run** (resolution retry WARN on T3 talk/`open_ask`, T4 move, T6 talk, T7 talk). It asked the same planner for another pass. It did not restore flee, demand, or hook-why.

---

## 4. Why each existing system failed

Failure class: **never ran** · **mandate-only** (Free ignored) · **too late** (post-hoc after commit) · **wrong owner** (GM planner vs ledger) · **defeated by another system**.

### Chrome / site (Class E) — live 30S

| Note | System that already exists | Why it failed |
|---|---|---|
| Home cannot scroll; Active Save clipped; title has no panel | 21e `html/body/#root overflow:hidden` + `MainMenu` with no scroll child | **Never ran a page-scroll owner.** Play-shell lock leaked onto Home. **30U/30V local — unpushed.** |
| Scroll broken on other site pages | Same `#root` lock; Settings/modals `flex-1 overflow-y-auto` without `min-h-0` | **Never ran.** **30V local — unpushed.** |
| HUD cramped; `Dark Elf Umb…` not tappable | `Hud` one-row mobile + `max-w-[4.5rem]` + `title=` (no touch) | **Wrong owner:** that chip is **Dark Elf Umbrance** (equipped set), not the PC. **30V local — unpushed.** |
| Memorable images work | `memorableMoments` + hosted plate | **Worked.** Not a drift. |
| No thumbs on GM bubbles | `GmResponseFeedback` on NarrativeView only; opening turn-0 key; `bibleId` wrong field | **Never ran on classic LogRow.** **30T local — unpushed.** |

### Opening / options (Class B)

| Note | System | Why it failed |
|---|---|---|
| “Waiting for a name” after **inspect** (John / HA abort `004dc417`) | `applyOpeningAnswer` | **Wrong owner.** Inspect is not a name. After `sceneWritten`, only `isPlayerQuestion` deferred to play. Inspect stayed a failed **name cover**. **30T would catch inspect.** This Pact save’s name-ask was the **demand**, not inspect (T0 chip existed; she tapped “Ask what is going on”). |
| “Waiting for a name” after **`send me back`** (this save, T2) | Same `applyOpeningAnswer` + `registrarAside` | **Wrong owner / never deferred.** `isPlayerQuestion` needs `?` or what/how/why/who… **Demand does not match.** Cover parser ate the turn. **30T does not close this.** |
| Options not relevant to last action | `establishmentChoices`, `ChoiceCompiler`, invented-context filter, stall recycle | **Wrong owner.** Pad is compiled from last GM + leftover covers, not from the player’s last intent. T8 **re-offers T0 chips**. Diversity logged violations and still committed. Recycle **ran**, then legal-edge / hub supplements put the old chips back. |
| Numbered list in opening prose | `stripChoiceList` | **Ran but too narrow.** Raw opening had a real `1–4` list (stripped). Committed body kept a **singleton `1. Scan…` glued to the last sentence**. Line-walk + inline regex need a `2.` pair. |

### Art vs prose (Class F / D)

| Note | System | Why it failed |
|---|---|---|
| Plate: fallen on plain stone. Text: standing on circular mosaic | `pinOpeningHereScene` / hook fallback | **Wrong owner / too early.** Fallback is **on your back**. Committed GM is **stand on mosaic**. Art bound the **card**, not the book. **30W `sceneArtLock` would bind new plates to committed prose.** This plate will not regenerate. |

### Player agency

| Note | System | Why it failed |
|---|---|---|
| Typed `Run away`; bubble became safer-scene scan | `groundPlayerAction` + `CANNED_SAFER_SCENE_LINE` + flee regex | **Defeated the player.** No threat → rewrite. Became bubble **and** `PLAYER_ACTION`. **30W local — unpushed.** |
| That line quoted as speech; “if none is present”; blue panel | `isSpeechOrProtest` (scan ≠ physical) + writer + `typedEntityValidator` / official scrub | **Wrong owner then defeated.** Scan classified as **talk**. Writer quoted it. Claim-ground logged `for any hostile threat` then **noun-swapped** to the panel. **30W local.** |
| Stating actions as spoken sentences | `speechActRails` (prompt) + missing physical-verb list | **Mandate-only** on 30S. **30W expands LOOK_OR_PHYSICAL.** |

### Continuity (Class D)

| Note | System | Why it failed |
|---|---|---|
| few → group → two, no enter/leave | 24f `scrubInventedCrowdSize` | **Ran but only hundreds.** No `crowdCount`. Seed/harvest counted **blue panel + handlers** as bodies. **30X not live.** **30X would lock first class (few) and rewrite later group/pair.** Opening GM can still invent the first size. |
| Opening reprint + T7 prefix collage | 30R `semanticLoopDetector` ≥0.85 whole-beat | **Ran, missed prefix.** T1 = opening paragraph + new ritual (under the bar). T7 = T5 door + T6 ozone + new man (under the bar). Novelty budget **tracked `blue` ×8** and did not block. **30Z local would strip the recycled prefix.** |
| Outdoor mosaic → indoor Entry, no travel | 29e WORLD MAP AUTHORITY; `locationSheet`; interior-plan (20n); `callOpeningGm` after name | **Wrong owner / never a travel commit.** Location **string** stayed the Circle. Map + dungeon **Entry** became camera. Name-cover completion called opening GM again; writer followed the **floor plan**, not the committed outdoor beat. **No 30T–31b lock owns this.** |
| Accident / pulled-through → Pellane pawn | 29e map; 30d `sealedManifest`; hook card `Why this happened`; ArcDirector `sp-beat-hear-reason` | **Wrong owner.** Manifest forbids quest/enemy reverse, **not** summon-why. T1 book is accident. Faction packet says **paid**. She **typed** “bought” (T6) — `playerMayReviseHook` does **not** match that question (`they bought me` / `I am a pawn` would). ArcDirector commits hear-reason on **any talkish line or turn ≥ 6** and **pays 45 XP**. Ledger then treats pawn as **reason heard**. **31a would lock accident from T1 and scrub T7 pawn** unless a real player revise fires. Residual: faction “paid for” still sits in the packet. |
| `the blue panel, Place, … his posture` | `extractNamesFromHookText` + `ensureOpeningNpcPinned` + `scrubOfficialPlaceholder` + `personSlotFromScene` | **Ran, then defeated each other.** Hook label `Place:` harvested **Place** (30S stop list lacked it). Pin + SNAPSHOT told the writer Place is a person. Raw: **The official, Place**. `present[0]` = **blue panel** → official → **the blue panel**. **30Y local.** |
| Blue panel **states** / **has need** | 24e location-as-speaker; 21b speaker furniture | **Never owned chrome-as-speaker.** T8 raw is `the figure states` / `Pellane has need`. Displayed: **blue panel states** / **has need**. **31b local.** Residual: inspect-the-panel pads; `handlers … steps` grammar. |
| She stopped — story no longer made sense | All of the above, stacked | Not one missed regex. **Facts never had a single pre-GM owner**, then scrubs mutated the book. |

### 0 XP / registration (Class C)

| Note | System | Why it failed |
|---|---|---|
| 0 XP through T6; registration incomplete | 30S bearings/look-around XP skip; opening STATUS chrome | **Bearings skip worked** (T4 “bearings established”, no XP line). T7 then dumped **80 XP** on a **contradicted why**. Registration is STATUS copy, **not a committed beat** — name locked, stamp/gift still “unresolved”. |

---

## 5. The real pattern

This is not “Flash Lite is sloppy” and not “we need more NEVER-LINES.” **The GM is still the planner.** Path A / Manus T1 said that after 27w: we added SNAPSHOT, AUTHORITY, OPENING PIN, ArcDirector, sealedManifest, ChoiceCompiler, typedEntityValidator — and left **who may change a fact** with the writer. The packet **mandates** facts the ledger never **committed** (crowd size, summon-why, travel, demand). It also **commits the wrong facts** (Place is a person; blue panel is present; Pellane **paid**). After the writer, **scrubs mutate nouns** (official → panel) instead of rejecting the beat. IntentContract retries the same planner. ArcDirector **pays XP** when a talkish line appears, which **seals the drift**. Fluidity dies because the book and the ledger disagree, then the next packet repeats the disagreement.

Mid writer OFF is relevant only as: Free ignored contradictory mandates. A more expensive writer would still be planning on a lying Presence list.

---

## 6. What would actually stop this (pre-GM commit vs post-GM scrub)

**Owner rule:** code commits the fact **before** `callGm`. Writer dramatizes the token. Warden only repairs slips, never invents the lock.

| Hole | Pre-GM owner (needed) | Local 30T–31b | Still an architecture hole after push |
|---|---|---|---|
| Inspect → name-ask | Cover parser defers look-around | **30T closes** | — |
| Demand / send-me-back | Play obligation, not a cover | **Misses** (not a question) | **Yes — demand never becomes a beat** |
| Thumbs | LogRow + `log_entry_id` | **30T closes** (needs SQL `021`) | Admin page still unmounted |
| Home / site / HUD chrome | Scroll + set-name popover | **30U/30V close** | Not verified on her Android |
| Run away / spoken scan | Typed line stays; flee is flee | **30W closes** | Old log lines stay |
| Plate vs mosaic | Art from **committed prose** | **30W closes new plates** | **This plate will not regenerate** |
| few / group / two | `crowdCount` first lock; enter/leave to change | **30X closes after first harvest** | Opening GM can still invent size on page 1 |
| Place / blue panel person | Chrome never in `present[]` / pin | **30Y closes** | Dummy name before first harvest; inspect-panel pads |
| Prefix collage / opening reprint | Sentence overlap vs last K beats | **30Z closes** | Short shared phrases ignored |
| Accident → pawn | `hookLock` first why wins | **31a closes silent flip** | Faction **“paid for a Pactborn”** still in packet; modeled NPC lie not shipped |
| Panel states / has need | Speaker tags never on chrome | **31b closes** | `handlers` grammar |
| Outdoor → indoor, no travel | **Travel / camera commit** (leave/reach or reject) | **None** | **Yes** |
| Options vs last intent | Pad from **player intent + legal edges**, not leftover covers | Partial recycle only | **Yes** |
| Numbered leftover `1.` | Strip singleton inline | Not in 30T–31b | **Yes** (small parser) |
| Registration / stamp | Ledger stage, not STATUS wallpaper | Not in 30T–31b | **Yes** |
| ArcDirector hear-reason @ T6+ | Commit why **only** when hookLock matches | Not in 30T–31b | **Yes — still pays XP on contradicted why** |

**Do not:** Mid writer, a new Continuity-Warden LLM, more NEVER-LINES, WOF.

**Do (when John asks to ship architecture, not this note):** one owner per fact; pin/harvest/faction notes cannot contradict that owner; scrubs may not use chrome as a person slot; ArcDirector may not complete “reason heard” without a locked why.

---

## 7. What the new dumps added vs the old `.md` / first pack

| Old tape (turn 6, no `sceneFacts`) | This ledger + fresh pack (turn 8) |
|---|---|
| Crowd/present reconstructed from prose | **`present[]` is the smoking gun** — panel + Place are on the ledger |
| Hook flip only in a later screenshot | **T7 is on the log** + raw `aiTraffic` (King/pawn) vs displayed (panel/pawn) |
| T8 chrome-speaks unproven | **T8 committed + raw** (`figure`/`Pellane` → `blue panel states` / `has need`) |
| 0 XP / registration | 0 XP **through T6 is true**; **T7 paid 92 XP** on the pawn beat |
| Inspect→name-ask assumed on this save | **This save: demand→name-ask.** Inspect name-ask is the **HA abort** + John’s chip report |
| Packet unknown | Packet still not in `aiTraffic`; **reconstructed** and it **lied** (Presence, pin, paid-for, interior) |
| ArcDirector invisible | **StateTx + social milestone `bought here` + OPENING PIN in sealed gist** |

She stopped because the **ledger and the book were different worlds**, and every turn the packet taught the writer the ledger’s world.
