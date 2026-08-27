# Gemini 29b alt-premades synthesis — 4-mode board (2026-08-27)

**Build:** **2026-08-29b** (29a terminal authority + 29b gameplay optimise)  
**Evidence batch:** `scripts/fate-autoplay/runs/alt-cells-300t-2026-08-27T18-46-38-961Z`  
**Telemetry:** `improvement-telemetry.json` (same batch · `cleanForAggregate: true` all four)  
**Authentic Gemini reviews (prefer these):**

| Mode | Cell | Prefer | Archive / notes |
|---|---|---|---|
| **LitRPG** | hero-awakening · cold-system · storyfollower · s**401** | [`gemini-21`](./gemini-21-litrpg-hero-awakening-29b-300t.md) | vs 28c SP = gemini-13 |
| **DnD** | shattered-coast · dry-wit · storyfollower · s**418** | [`gemini-22`](./gemini-22-dnd-shattered-coast-29b-300t.md) | gemini-18 = noisier 1st pass |
| **RPG** | salt-road-heist · chilled-gm · storyfollower · s**435** | [`gemini-23`](./gemini-23-rpg-salt-road-29b-300t.md) | gemini-19 = 1st pass; gemini-17/20 = **misfiles** |
| **PYOA** | vesper-glass-cipher · army-brief · storyfollower · s**452** | [`gemini-24`](./gemini-24-pyoa-vesper-glass-29b-300t.md) | gemini-20 Meta bleed only — not a PYOA score |

**Status:** Planning only — **no ship** until John asks. No game code in this doc.

**Prior synthesis:** [`GEMINI-28C-VS-27W-SYNTHESIS.md`](./GEMINI-28C-VS-27W-SYNTHESIS.md) (worst cells · different bibles).

---

## Executive verdict

29b **moved the ledger**, not the Gemini scorecard. All four alt cells pass eval liveness / clean-aggregate; LitRPG and DnD now **clear encounters** (16 / 14 clear receipts) and reach **L3**; STATUS honesty axes climb to **6–7/10** on three modes. Every mode still scores ~**1/10** overall with Free hook **NO**, because a single shared bug class — **kit/pronoun scrub** (`clothes` / `Worn Iron Shortsword` / `Crew Token` / `Oil-Stained Trench Coat`) — destroys readable English by turns 1–10, before progression chrome can matter.

Honest read for John: **29b made telemetry look like a game and prose look worse.** Do not claim score uplift from STATUS/XP alone. Next ship (**29c**) must kill scrub first, then pad/travel loops, then drought / soft-crisis feel.

---

## Per-mode: telemetry vs Gemini

Prefer v2 scorecards where listed. Gemini “overall” ≈ median of 20 play axes (exclude competitive). STATUS = axis 18.

| Mode | Cell | Metric | 29b telemetry | Gemini (prefer) | Trust call |
|---|---|---|---|---|---|
| **LitRPG** | HA s401 | XP / level | **352/450 · L3** | progression feel 4–5 | Ledger win |
| | | themWordHits | **7** | English/mush **1** | them↓ but **clothes scrub** kills prose |
| | | combat clears | **16** | combat **3** | FSM works; drought same-mob feel |
| | | beat / quest | beat **19** · questStage **2** | Free **NO** | Spine thin after T6 |
| | | STATUS blocks | **64** | STATUS **6/10** | Fair chrome credit |
| | | Kit scrub | clothes-as-NPC **~70** | mush **1** | **P0 shared** |
| **DnD** | SC s418 | XP / level | **223/450 · L3** | systems **6** | Ledger win |
| | | themWordHits | **22** | English **1** | Worn Iron dominates |
| | | combat clears | **14** | combat **3** | Clears real; Keep Wraith + drought feel |
| | | STATUS / voice | blocks **90** | STATUS **7** · Dry Wit **5** | **Best chrome honesty** in series |
| | | Kit scrub | Worn Iron **125** | mush **1** | **P0 shared** |
| **RPG** | Salt s435 | XP / level | **181/300 · L2** | progression **1–4** | Talk/travel XP farm |
| | | themWordHits | **10** | English **1** | Crew Token pronoun scrub |
| | | combat | **0** | combat **N/A** (v2 fair) | Soft world — no danger branch |
| | | crisis / beat / quest | crisis **1** · beat **4** · quest **0** | Free **NO** | Travel triangle replaces heist |
| | | STATUS blocks | **28** | STATUS **6/10** (v2) | Fair; firewall held (no GM_VOICE) |
| | | Kit scrub | Crew Token **~188** | mush **1** | **P0 shared** |
| **PYOA** | VG s452 | XP / level | **135/200 · L1** | progression systems **3** | Floor exists; spine dead |
| | | themWordHits | **5** | English **1** | Coat scrub understates body mush |
| | | crisis / branch | crisis **3** · `branchLockedByT30` ✓ | Free **NO** | **Receipt theater** — no fork feel |
| | | combat | **0** | danger **1** | Soft tease never resolves |
| | | STATUS blocks | **9** | STATUS **4/10** | Thin but honest |
| | | Kit scrub | Oil-Stained Coat **146** | mush **1** | **P0 shared** |

**Aggregate (batch):** avg `themWordHits` **11**; all four `uncommonThemHits=1`; all four `cleanForAggregate: true`; Free Gemini **NO ×4**.

---

## Shared P0 — kit / pronoun scrub (same root cause)

Blind post-GM replacement maps pronouns / loose nouns onto **starter-kit item names** (and generics like `the stranger` / `something nearby` / `the merchant`).

| Mode | Kit / phrase | Approx hits | Example |
|---|---|---:|---|
| LitRPG | `The clothes you already had on` | ~70 (45 turns) | clothes-as-NPC / possessive |
| DnD | `Worn Iron Shortsword` | 125 | “hawking Worn Iron Shortsword's wares” |
| RPG | `Crew Token` (+ `Directly's`) | ~188 | `they/their/They're` → Crew Token / `Crew Token're` |
| PYOA | `Oil-Stained Trench Coat` | 146 | “Coat's meaning just beyond your grasp” |

**Owner:** `proseWarden` / `typedEntityValidator` allowlist — **kit ≠ speaker, pronoun, or location noun**.  
**29c rule:** never replace `they/their/They're/them` (or env nouns area/surroundings/walls) with inventory display names.

This is why Gemini overall stays ~1 while STATUS climbs: critics score **sentences**, not receipts.

---

## Shared P0 — travel / wait pad loops

| Mode | Loop family | Evidence |
|---|---|---|
| LitRPG | Ward Rest ↔ Ashline Yard + Change position | Travel picks ~73; Change position offers 285 |
| DnD | Wait / Change position + market clones | Wait/Change offered heavy; clones T21–34 |
| RPG | Camp ↔ Waystation ↔ Alley travel triangle | Travel offers **339** / picks **117** |
| PYOA | Wait and watch + Inspect (same tunnel) | Wait **394** / Inspect **230** offers; 300t one room |

**Owner:** `choiceCompiler` + Forward-Progress Governor / ArcDirector scene force — exhaust reverse-travel and pad families after N no-delta turns; force beat / crisis / leave.

---

## DnD / LitRPG — drought same-mob respawn

29b **proves clears** (no longer 28c combat purgatory). Residual fail is **post-clear drought** re-forcing the **same** foe:

| Mode | Clear receipts | Drought pathology |
|---|---:|---|
| LitRPG | **16** Pact-Hunter clears | **15** drought-pressure turns → identical Skirmisher |
| DnD | **14** Keep Wraith clears | Same-mob + **bible-wrong** Keep Wraith on Shattered Coast |

Gemini combat **3/10** = fair **feel** score. Do **not** re-open “never clears” tickets on ledger.

**29c:** varied drought table + bible-aware `hubSkirmishEncounter` (no Keep Wraith on coast).

---

## RPG / PYOA — zero combat / soft crisis without branch feel

| Mode | Receipts | Gemini feel | Gap |
|---|---|---|---|
| RPG | combat **0**, crisis **1**, questStage **0** | hiking simulator | Heist never commits; travel absorbs agency |
| PYOA | combat **0**, crisis **3**, branchLocked ✓ | tunnel pad forever | Branch lock STATUS ≠ mutually exclusive playable fork |

29a/29b **gate theater** works (`crisisByT12`, `branchLockedByT30`, `freeT12DurableDelta`). Player-facing **branch consequence** still missing — same basin as 28c thornferry (Buy time loop) with a new pad family (Wait/Inspect).

---

## What 29a / 29b fixed vs still broken

### Fixed / proven on this batch

1. **Encounter terminal FSM** — LitRPG/DnD clear receipts + `encounterClearedByT50` ✓  
2. **Clear XP + STATUS chrome** — critics credit STATUS **6–7** (was 2–3 on many 27w/28c rows)  
3. **STATUS leak firewall** — salt-road has **0** GM_VOICE / RenderFallback (vs cape 28c)  
4. **Eval harness clean** — all four alt cells `cleanForAggregate`  
5. **PYOA crisis + branch gates** — pass on vesper-glass  
6. **XP / level floors** — LitRPG/DnD L3; RPG L2 181; PYOA 135/200  
7. **Partial voice** — DnD Dry Wit **5** (preserve; don’t “fix from zero”)  
8. **them-metric** modestly better on several rows (not the real mush story)

### Still broken (blocks Free)

1. **Kit/pronoun scrub** — 4/4 modes (worse English than many 28c rows)  
2. **Travel / Wait / Inspect pad loops** — 4/4  
3. **Drought same-mob** — LitRPG + DnD  
4. **Bible-wrong skirmish** — Keep Wraith on Shattered Coast  
5. **Soft crisis / zero combat feel** — RPG + PYOA  
6. **Opening NPC/crisis amnesia** — PYOA Silas; RPG heist abandon after ~T14  
7. **Paragraph clones** — DnD market; PYOA stagnant-water  
8. **Empty-GM chrome** — `(beat recovered; fail)` on RPG/PYOA  
9. **Voice weak** on LitRPG/RPG/PYOA prose (STATUS-only where present)

### Honest: did 29b move Gemini scores?

| Axis class | Moved? | Note |
|---|---|---|
| Overall / Free hook | **No** | Still ~1/10 · **NO ×4** |
| STATUS honesty | **Yes** | LitRPG 6 · DnD 7 · RPG 6 · PYOA 4 |
| Combat absolute “never resolves” | **Yes (discount)** | Clears logged; combat still low on **feel** |
| English / mush / NPC | **Worse or flat** | Kit scrub is the new dominant fail |
| Progression systems feel | **Partial** | Ledger credited; story spine still dead |

**Bottom line:** 29b moved **instrumentation and combat termination**. It did **not** move Free retention. Scrub collateral may have made Gemini English axes **worse** while the ledger got better — treat that as a ship regression on prose, not a wash.

---

## Ranked next-ship board (29c)

| Rank | Bet | Modes | Why first |
|---:|---|---|---|
| **1** | **Kill kit/pronoun scrub** — never map they/their/env nouns → kit names (`clothes`, Worn Iron, Crew Token, Oil-Stained Coat) + stranger/nearby inject | **All 4** | Single root cause of Free **NO**; STATUS uplift is wasted until English lives |
| **2** | **Pad / travel exhaustion + loiter scene-force** — reverse-travel cooldown; Wait/Inspect/Change-position family caps; >5 no-delta → forced beat | **All 4** | Shared second basin after scrub |
| **3** | **Drought mob variety + bible-aware skirmish** — no Keep Wraith on coast; no identical Pact-Hunter spam | LitRPG + DnD | Converts clear-FSM win into combat **feel** uplift |
| **4** | **Branch / heist consequence lock** — PYOA mutually exclusive fork after crisis; RPG Heat/Vigil interrupt that ends travel triangle | RPG + PYOA | Closes receipt-theater gap |
| **5** | **Opening pin + clone reject + empty-GM chrome** — Silas/heist pin; near-verbatim prose reject; strip `(beat recovered; fail)` | Cross | Free T1–12 hygiene |

**P1 after those:** voice cadence in GM prose (preserve DnD Dry Wit gains); soft-threat resolve timers; naturalize travel stitch lines.

**Do not ship Mid writer** unless John overrides — still NO per 29b policy.

---

## Review inventory confirmation

| File | Authentic 29b score? |
|---|---|
| gemini-21 LitRPG hero-awakening | **Yes** |
| gemini-18 / **22** DnD shattered-coast | **Yes** (prefer **22**) |
| gemini-19 / **23** RPG salt-road | **Yes** (prefer **23**) |
| gemini-24 PYOA vesper-glass | **Yes** (this ingest) |
| gemini-17, gemini-20 | **No** — mislabeled / contaminated |

---

## Paths

- This synthesis: `docs/bugs/gemini-reviews-2026-08-27/GEMINI-29B-ALT-PREMADES-SYNTHESIS.md`  
- 28c vs 27w: `docs/bugs/gemini-reviews-2026-08-27/GEMINI-28C-VS-27W-SYNTHESIS.md`  
- Batch: `scripts/fate-autoplay/runs/alt-cells-300t-2026-08-27T18-46-38-961Z/`  
- Playtest notes pointer: `.cursor/rules/playtest-notes.mdc`
