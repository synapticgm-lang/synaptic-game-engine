# Opening prompt stack — LitRPG summon (Summoned Pact)

**Date:** 2026-08-31  
**Scope:** Read-only compile of what the AI sees on **New Game / page 1 / opening covers** for LitRPG **The Summoned Pact** (`summoned-pact`), plus Hero Awakening diffs and shared LitRPG pipeline notes.  
**Not in scope:** Mid writer (OFF), WOF, game-code changes, stamp/commit.

---

## Verdict (one line)

The opening is **over-open on invent axes the ledger does not yet lock** (crowd headcount, named cast beyond thin pins, atmosphere essay length), and the **rich hook pointer card is stored on the save but not injected into the live GM call** — only location, premise, thin SNAPSHOT, and `(opening)` as player action.

---

## Ordered stack (what the model sees)

Live hosted path: `callOpeningGm` → `callGm` → Supabase `gm-turn` → `assembleSystemPrompt` (`masterPrompt.buildMasterPrompt`) + `buildContextPrompt` (user).

| # | Layer | Source | Opening-specific? |
|---|--------|--------|-------------------|
| 1 | Master / system prompt | `src/game/masterPrompt.ts` (`buildMasterPrompt`) via edge `_shared/gm/masterPrompt.ts` | Shared; LitRPG MODE block always on |
| 2 | Fluid + MODE AUTHORITY / CRAFT | `fluidProseRails.ts`, `craftBookCompiler.formatCraftSnapshotLines` (inside SNAPSHOT) | CRAFT may pick `litrpg-opening-scene` when intent=`opening` |
| 3 | Guide Book / premise + OPENING KIT | `campaignSeed` → `state.campaignPremise` → `formatCampaignRails` | Bible text; kit rail; Summoned Pact LOCATION LANGUAGE |
| 4 | Situation / SNAPSHOT | `situationPacket.formatSceneSnapshotForPrompt` + `formatSituationForPrompt` | Turn 0 seed facts; HOOK WHY; COVER CHROME; alone gate |
| 5 | Campaign contract (thin) | `formatCampaignContractForPrompt` | Start place + kit names + premise snippet — **not** full pointer card |
| 6 | Ground-truth ledger + voice + folk rails | `masterPrompt` / `systemPrompt` | Character Unknown / sealed bag / clothes |
| 7 | User context | `buildContextPrompt` | `PLAYER ACTION: (opening)` |
| 8 | **Intended** OPENING (BINDING) + Hook POINTER CARD | `buildOpeningSceneMandate` in `openingEstablishment.ts` | **Defined but not called from `callOpeningGm` / `callGm` / `gm-turn`** |
| 9 | Fallback (no network) | `stitchOpeningScene` / `stitchOpeningContinue` | Uses `pickedHookFallback` + sensory/pressure banks |

`callOpeningGm` (`aiService.ts` ~94–107): empty input becomes `"(opening)"`; then normal `callGm`.

---

## 1. System / master prompt slices (opening-relevant)

### Live assembler

Hosted Free/Mid/High use **`buildMasterPrompt`** (re-exported as `buildSystemPrompt`), not the older giant `systemPrompt.ts` BASE alone. Client direct (dev) can still use `systemPrompt.buildSystemPrompt`. Edge: `supabase/functions/gm-turn/index.ts` → `masterPrompt.ts`.

### LitRPG mode DNA (always for Summoned Pact)

From `masterPrompt.ts` `MODE_LITRPG` (~128–138):

```
ENGINE MODE DNA — LITRPG (BINDING)
【 CORE IDENTITY 】
Modern Integration Earth. Blue System panels. Dungeon cores. Wave threats.
Visceral physics: weight, impact, stamina. Zone threat is HONEST — no soft-scaling.
```

**Founder note:** Summoned Pact is **isekai / other-world summon**, not System Integration Earth. This CORE IDENTITY line is a **cross-bible default** that can pull the writer toward “modern street + Integration” unless Guide Book LOCATION LANGUAGE wins. Older `systemPrompt.ts` `LITRPG_RULES` (~240–256) is less Earth-locked but still generic LitRPG.

### Alone invent-crowd (system)

`masterPrompt` CRITICAL / alone (~95–97) and mirrored in `systemPrompt.ts` `WORLD_STATE_INTEGRITY_RULES` (~31):

```
* ALONE ARRIVAL: When openingEstablishment.aloneArrival is true / Scene Manifest Crowd is none for an alone ruin,
  do NOT invent handlers, bystanders, "people who saw you arrive", voices outside, or a gathered handful watching through damage.
```

### Atmosphere / invent license (system)

Fluid rails (`fluidProseRails.ts` GLOBAL_RAILS ~29–44):

```
* VALUE FLOOR (EVERY PAID TURN): Default to a full standard beat — roughly two short paragraphs (~100–180 words …)
* MAP / ALONE / FACTIONS: … Atmosphere (smell, rust, cadence, metaphor, NPC mannerism) is free.
```

`formatFullMemoryBlock` / situation RAILS close with:

```
PROSE LICENSE: Full artistic freedom on sensory detail, metaphor, pacing, and NPC manner.
Descriptive engaging language and narrative flair are required.
```

SNAPSHOT twin (`situationPacket.ts` ~347–351):

```
AUTHORITY: SNAPSHOT + ledger win on facts (kit, exits, presence, HP, crowd count, hook why, outcomes). …
PROSE LICENSE: Full artistic freedom on sensory detail, metaphor, pacing, and NPC manner —
  dramatize the OUTCOME token; never invert it. Stakes stay honest (no auto-win, no invented kit).
```

### Numbered choices in prose pressure

Older BASE / tone rules still demand story then numbered choices (`systemPrompt.ts` TONE ~69–74; master TURN STRUCTURE similarly). Opening stitch/mandate (when used) also ask for **3–4 local choices**. UI ChoiceCompiler pads after commit; Flash Lite can still print `1.` lists in story (Class D residual; 31h `stripChoiceList`).

### MODE AUTHORITY (LitRPG)

Default when CRAFT does not replace (`fluidProseRails.ts` ~13–26):

```
MODE AUTHORITY (litrpg): Resolve the story beat first; then report only earned, ledger-backed System changes,
and make repeat inspection yield a new fact, a brief reminder, or honest exhaustion—never the same essay.
```

Opening CRAFT candidates (`craftBookCompiler.ts` ~106–128):

- `litrpg-opening-scene`: `Scene first; weave covers in. Do not lead with registration chrome or a canned name form.`
- `litrpg-hook-why`: `Honor the locked summon-why; …`
- `litrpg-name-defer`: `Place words (here/you/panel) are not a name; …`

---

## 2. Opening-specific contract

### Runtime path (`useGame` New Game)

1. Seed bible → pick `openingHooks` card (`resolveOpeningHookPick`).
2. `applyOpeningContract` — drop Earth-origin location covers; seed-vary name/look/kit ask wording; alone re-voices name to panel.
3. `pendingRequiredCovers` — **kit prompts filtered out** (`filterOpeningPrompts`: `if (p.kind === 'kit') return false`).
4. `ensureSealedOpeningBag` — grant undeclared `Bag`.
5. Stamp `openingEstablishment.pickedHook` / `pickedHookFallback` / `aloneArrival` / `hookLock`.
6. `ensureOpeningNpcPinned` — Title-Case names from hook + bible key NPCs → `pinnedNpcNames` + `sceneFacts.present`.
7. `ensureCampaignContract` — freeze start place / kit / premise snippet.
8. `callOpeningGm(state, '')` → `(opening)`.
9. On fail/empty → `stitchOpeningScene(state)`.

### `buildOpeningSceneMandate` (intended, **unwired**)

`openingEstablishment.ts` ~1846–1895. Would inject:

```
=== OPENING (BINDING) ===
Hook POINTER CARD (expand into a unique first page — do not reprint as a script, do not lecture the player):
<Location / Who / Why / Opening offer / beats>

Write THIS run's first page from the pointer card and the campaign bible. …
- LitRPG / System apocalypse: ordinary street first, then the panel as a moment. Earth is NOT being ingested.
- Isekai summon: arrive in THIS run's picked place … Alone cards: no welcoming NPC on page one; …
3) End by weaving this ONE in-world question into the scene …: <pending cover.question>
4) Do not add weapons or rare items to the sheet. NPCs may OFFER gear …
7) LitRPG: emit one short <system> registration ping …
8) Then 3–4 local choices …
```

**Grep evidence:** only definition site + research mention; **no import/call** from `aiService`, `useGame`, `gm-turn`, or `masterPrompt`. So the live model never sees this block unless something else reprints the same text (it does not).

### Cover prompts (Summoned Pact bible)

`summonedPact.ts` `openingPrompts` (~327–340): name, wear (appearance), pockets (kit). After filters: typically **name + look** pending; kit sealed. Earth “where were you” deferred (`applyOpeningContract` + no Earth location prompt on SP list).

In-world overrides (`BIBLE_INWORLD['summoned-pact']`):

```
name: Someone in the scene needs a name for you. What do they call you?
appearance: You look down. You are still wearing what the light stole you in. What is it?
```

Alone (`SUMMONED_ALONE_COVERS`):

```
name: Your blue panel waits on a designation. What name should it show?
```

### Stitch fallback (`openingStitch.ts`)

Uses **`pickedHookFallback`** (grammatical scene), not the pointer-line dump; adds sensory + pressure banks; may append unused card beat. Continue stitch: no name/look/kit rehash.

---

## 3. Situation packet / SNAPSHOT at turn 0

Built into system memory via `formatFullMemoryBlock` → `formatSituationForPrompt` → `formatSceneSnapshotForPrompt`.

### Seed facts (`sceneFacts.seedOpeningSceneFacts`)

Non-alone Summoned Pact:

```
crowd: 'present'
noise: 'voices'
present: []          // until pin / harvest
props: ['blue panel']
lastBeat: 'People are present.'
// hookLock from card if nature regex matched
```

Alone: empty / quiet path; ALONE ARRIVAL rail in situation packet.

### SNAPSHOT lines the writer sees (shape)

```
### SNAPSHOT
- Location: <picked card location, e.g. Sevenfold Circle / war camp / alone ruin …>
- Crowd: present / <band> (~N)   // or "none" if alone; headcount often unlocked at T0
- Presence: <pinned names or "none established" / alone line>
- Props: blue panel
- Inventory: clothes + Bag (sealed)
- …
- HOOK WHY: not yet locked — …     OR   HOOK WHY (BINDING): <nature>. Locked line: …
- COVER CHROME (BINDING): The name/look cover panel may hum … Slot labels (Place, Name, Look, Registration) are not NPC names. …
- AUTHORITY: SNAPSHOT + ledger win on facts …
- CRAFT: …   OR   MODE AUTHORITY (litrpg): …
- PROSE LICENSE: Full artistic freedom …
- OPENING PIN: <names> …           // if pinned && turn≤20 && !alone
```

Crowd binding (`crowdAuthority`): if present but **not locked**, writer may invent size class until harvest — warden rewrites later; **first page can still invent**.

### Campaign rails (`formatCampaignRails`)

Includes `campaignPremise` (title + bible premise + OPENING KIT + quest rail, truncated ~2200) and Summoned Pact:

```
LOCATION LANGUAGE (BINDING): Camera is HERE — the seeded summon place for this run
(cathedral circle, war camp, cell, arena, … or alone-arrival ruin …).
Alone-arrival cards: no summoners, handlers, or watchers on page one …
Never call this interior "a nearby building." "The court" is Pellane's Crown …
```

### Campaign contract in packet

```
=== CAMPAIGN CONTRACT (IMMUTABLE OPENING RAILS) ===
Story / Bible / Hero / Start place / Kit rail / Premise (220 chars)
```

`pickedHook` is stored as `campaignContract.pickedHookId` on freeze but **omitted from the prompt formatter**.

---

## 4. Hook cards — Summoned Pact deck

**20** seed-picked cards in `src/data/campaigns/summonedPact.ts` (`openingHooks`). Code formats each via `normalizeOpeningHookCard`:

```
Location: …
Who is here / who summoned: …
Why this happened: …
Opening offer (optional — player may refuse): …
- <beat>
- <beat>
…
```

(Labels were historically `Place:`; live code uses **`Location:`** — chrome/person bug class addressed in 30Y.)

### Card families (summary)

| Family | Example locations | Crowd / alone |
|--------|-------------------|---------------|
| Crown rite | Sevenfold Circle, mass summon (4 rings) | Handlers / Chanter present |
| War / camp | Pellane war camp, bombardment vault | Handlers / soldiers |
| Coercion | Undercroft cell, arena, treaty tent | Handler / crowd betting |
| Fringe | Lowmarket cult, wayside shrine, harbor hold, Ash hall, infirmary, west-wall ruin | Varied |
| Festival / wrong catch | Peace-festival square | Crowd + handlers |
| **Alone ruin ladder** | shabby-standing → damaged → half-collapsed → wall-shell → burnt husk → foundation | `aloneArrival=true` |

Static soft default `openingHook` (if deck miss): mid-rite + blue panel + Earth clothes + refuseable offer.

Comment in bible: *“Pointers, not a script — writer builds the page.”* That design assumes the POINTER CARD reaches the writer; **live GM path currently does not pass it.**

---

## 5. Hero Awakening — same path, different bible

| Axis | Summoned Pact | Hero Awakening |
|------|---------------|----------------|
| Bible id | `summoned-pact` | `hero-awakening` |
| Premise | Earth → Pellane summon; Pactborn / Calamity Mark | Already in-world; Wake Ledger; not summoned |
| Hook shape | Rich objects (location/faction/intent/offer/beats) | **String** cameras (~8) |
| Covers | name + look (kit sealed); Earth origin deferred | name + **world-shape/location** + look + folk/species (+ kit sealed) |
| Alone | Explicit alone ruin cards | Some “alone shrine” strings; no SP alone ladder |
| Image/world | Fantasy arrival HERE | Must match player world-shape (no forced Earth jeans) |
| Pipeline | Same `callOpeningGm` / weave / SNAPSHOT | Same unwired `buildOpeningSceneMandate` gap |

---

## 6. Locked vs intentionally open

### Locked (code / rails)

| Item | How |
|------|-----|
| Arrival **place string** | Card `location` → `currentLocation` / answers.where |
| **Alone** invent-crowd gate | `aloneArrival` + SNAPSHOT Crowd=none + rails |
| **Kit sheet** | Sealed Bag; no kit questionnaire; no offered gear until accept |
| Earth origin ask | Deferred / filtered off opening covers |
| Opening kit clothes | Starter “clothes you had on…” + OPENING KIT rail |
| Hook **why nature** (when regex matches card text) | `hookLock` → SNAPSHOT HOOK WHY BINDING |
| Cover chrome ≠ person | COVER CHROME BINDING (Place/Name/Look not NPC) |
| Name deny-list (here/you/panel…) | `pcNameAuthority` (post-31e) — harvest/warden, not invent-prevent on first ask |

### Intentionally / accidentally open

| Item | Effect |
|------|--------|
| Full pointer card (who/why/offer/beats) | On save; **not in live GM prompt** |
| Crowd **headcount** | `present` crowd without lock → invent size |
| Named cast beyond pins | Empty `present[]` until pin/harvest; “People are present” invites roles |
| Name | Optional; weave cover question; player can say “I'm here” (31e) |
| Atmosphere / sensory essay | PROSE LICENSE + VALUE FLOOR 100–180 words |
| Building type on alone cards | Writer picks cottage/barn/… inside ruin level |
| Numbered option lists | Prompt asks 3–4 choices; may leak into prose |
| LitRPG CORE IDENTITY “Modern Integration Earth” | Conflicts with isekai Guide Book |

---

## 7. Other LitRPG premades — shared pipeline

Same New Game → weave (unless bible `openingMode: 'scene'`) → `callOpeningGm` → SNAPSHOT stack.

| Bible | Hook entry |
|-------|------------|
| `summoned-pact` | Inline rich `openingHooks` (20) |
| `hero-awakening` | Inline string `openingHooks` |
| `system-integration`, `gatebreak-ward`, `ascending-spire`, `inkbound-academy`, `hollow-core`, `void-audience`, `dungeon-transport`, `fabled-legacy`, … | Catalog `OPENING_HOOK_DECKS` in `openingHookDecks.ts` (location+text cameras) |
| `blank-canvas` | Thin / custom |

Difference is **bible premise + deck richness**, not a separate opening compiler.

---

## Honest diagnosis — is the opening over-open?

**Yes, on specific axes** — and John’s suspicion matches the code: we leave invent room where ledger locks are thin, and we under-deliver the one artifact meant to constrain page 1 (the pointer card).

### 1. Hook POINTER CARD never reaches the live GM (prompt openness + missing wire)

- **Evidence:** `buildOpeningSceneMandate` unused; `formatCampaignContractForPrompt` drops `pickedHookId`; SNAPSHOT has Location + optional HOOK WHY nature only.
- **Effect:** Writer expands from **generic premise** (“Sevenfold Circle…”) + **place name** + “People are present” + blue panel — not from the card’s faction/offer/beats.
- **Vs stitch:** Fallback *does* use grammatical `fallback` prose — GM path is ironically **less constrained** than offline stitch.

### 2. Crowd present, headcount unlocked → invent size (Josie / 30X)

- Seed: `crowd: 'present'`, `present: []`, lastBeat “People are present.”
- PROSE LICENSE invites sensory crowd color; binding only hardens after harvest.
- **Cross-link:** “scattered group” vs “two figures” — prompt openness **plus** missing early `crowdCount` lock.

### 3. Place / blue panel as person (Josie / 30Y)

- Cover weave + “Someone in the scene needs a name” + panel as prop.
- Historical `Place:` label (now `Location:`) + chrome slots harvesting as NPCs.
- COVER CHROME BINDING now present; **first invent** still possible before harvest/warden.
- **Cross-link:** “the blue panel, Place, remains at the threshold, his posture tense.”

### 4. Name = here / atmosphere loop (Josie / 31e)

- Open: name optional; cover still asks; VALUE FLOOR + PROSE LICENSE encourage smell/light essays.
- SNAPSHOT BEAT DELTA only after look/wait — **not** on opening page 1.
- **Cross-link:** `I'm here` harvested as name; T12 second atmosphere essay — openness + delayed ledger.

### 5. Mosaic vs plate / fallen-hook art (30w)

- Memorable `pinOpeningHereScene` can prefer committed standing/mosaic over fallen-hook “on your back” card.
- Prompt stack for **art** is separate; story GM still free to contradict card posture if POINTER never injected.
- **Cross-link:** plate rewrite tests — authority is post-commit sceneFacts, not pre-GM pointer.

### 6. Mixed genre instructions (when mandate were wired / MODE block)

- Unwired mandate still says LitRPG = “ordinary street first” beside isekai summon — mixed DNA.
- Live `MODE_LITRPG` “Modern Integration Earth” reinforces wrong default for Summoned Pact.

---

## What is *not* “too open” (already tightened)

- Kit invent onto sheet (sealed bag + kit authority).
- Alone ruin invent-crowd (hard gate when `aloneArrival`).
- Silent summon-why flip after lock (31a hookLock + CRAFT `litrpg-hook-why`).
- Chrome speaker tags (31b).
- Mid writer OFF (no extra rewrite pass inventing recovery chrome as story).

---

## Founder takeaway

1. **Ordered stack:** Master LitRPG DNA → fluid/PROSE LICENSE → Guide Book + KIT → SNAPSHOT/AUTHORITY/CRAFT/HOOK WHY/COVER → thin Campaign Contract → user `(opening)`.  
2. **The deck is good; the wire is not** — 20 Summoned Pact pointer cards exist; live page-1 GM does not see them.  
3. **Biggest “too open?” findings:** (a) unwired POINTER CARD, (b) crowd present without count, (c) atmosphere VALUE FLOOR with free sensory license, (d) LitRPG CORE IDENTITY = Integration Earth on an isekai bible, (e) name/cover weave without hard deny until post-hoc wardens.

**File:** `docs/research/opening-prompt-stack-litrpg-summon-2026-08-31.md`

*No game code changed. Mid writer remains OFF.*
