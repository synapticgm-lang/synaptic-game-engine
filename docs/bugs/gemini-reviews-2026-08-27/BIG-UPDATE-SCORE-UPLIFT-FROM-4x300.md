# Big update — score uplift from 4 modes × 3 agents × 300t (26v)

**Date:** 2026-08-27  
**Batch:** `scripts/fate-autoplay/runs/modes-agents-300t-2026-08-27T07-02-01-789Z`  
**Baseline:** 2026-08-26v (Free writer)  
**Gemini packs filed:** LitRPG (chat + canvas) · `gemini-05` DnD · `gemini-06` mislabeled LitRPG · `gemini-07` RPG · `gemini-08` PYOA  
**Prior board:** `NEXT-UPDATE-FROM-3x500.md` (still valid; this doc widens it to all four modes)  
**Status:** Waiting — do **not** ship until John asks for the next update.

Gemini scores are ~1–3/10 across LitRPG / Tabletop / Story RPG / PYOA. Directionally right on “soft sandbox fails the genre promise.” Executives overstate collapse, recycle older 500t evidence, and invent cross-bible map bleed. This plan separates **confirmed engine failures** from **critic noise**, then proposes a **material** next ship (not more scrub-only fine-tunes).

---

## 1. Why scores tank (calibrated)

### 1A. Real engine failures (telemetry + transcript body)

Shared across all 12 runs:

| Failure | Evidence (12×300) | Why critics hammer it |
|---|---|---|
| **Noun mush** (`the stranger`, bare `them`, `this place`) | themWordHits 14–70; stranger body spam especially RPG/PYOA; this-place 3–13 | Prose/options read broken → “mad-libs / refund” |
| **Passive GM** | No forced combat / crisis across 300t any mode; growls walkable | Genre bar: LitRPG/DnD need danger; PYOA needs crisis forks; RPG needs leverage |
| **Pad / action recycle** | LitRPG gate-queue 40–42 + Earth-junk 37–57; RPG `Walk away` ~255; PYOA Millstone Charter 256–347 | Feels like hallway simulator |
| **Inspect XP farm** | STATUS mostly `XP Gained: 5 (studied…)`; all modes end **Level 1** (55–256/300) | “Progression systems = 2” even when XP exists |
| **No quest / branch spine** | Soft hubs; no forced next-objective after opening | “Progression (quests) = 1” |
| **Voice chrome weak** | Cold Registrar / Dry Wit / army-brief / chilled present as rails+STATUS, rarely as audible asides | “Personality absent” |
| **Bag invent still soft** | uncommonThemHits counter 1/run; hard JSON lock not shipped | Continuity / kit lies stay P0 risk |
| **Stagnation interrupt prompt-only** | maxIntentStreakSeen **4** (not 100) — soft clones still dominate feel | Near-clone retry helps; does not force world event |

Mode-shaped intensity:

| Mode | Worst measured pain | Mode-specific gap |
|---|---|---|
| **LitRPG** | Pad banks (gate/Earth); XP without level-up; no combat | System fantasy fails without fights + levels |
| **DnD** | **Worst them** (60–70); thin keep spine; 0 dice drama | Tabletop without checks/combat |
| **RPG** | stranger mush + Walk-away; soft vigil | Sandbox without NPC/leverage beats |
| **PYOA** | Cleanest them (14–29) but **no branching crisis**; charter loops | Choice-of-Games bar unmet |

### 1B. Gemini overstatements / pack bleed / wrong genre bar

| Claim pattern | Reality | Action |
|---|---|---|
| T424 / T494 / `[Uncommon] them` piles | Runs are **300t**; body uncommon-them ≈0 this pack | Old 500t bleed — discard as current evidence |
| “100+ identical-action loops” | Streak max **2–4** | Overstated severity; soft recycle still real |
| “Zero XP / STATUS missing” | STATUS 25–65 blocks; Meta XP real | Fix **drip quality + level pressure**, not “add XP” |
| UI Mustache `[Location.Name]` | No such player template | Fix proseWarden / choicePad / stranger scrub |
| Cross-bible maps (Lowmarket / Cathedral Undercroft in cape; Cape/Mask Scarf/Earth junk in Thornferry) | **0** body hits on those claims for RPG s219 + PYOA 3× | **Do not** ship “bible isolation” as P0 from these pastes |
| Mask Scarf = invent (RPG) | Equipped kit; GM-LOG confirms | Keep stranger→item mush fix; don’t strip Mask Scarf |
| Wrong voice ids (Army Quartermaster on PYOA; Friendly System on RPG) | Stamped army-brief / chilled-gm | Score cadence vs correct chrome |
| gemini-06 titled DnD | Actually LitRPG s117 (221 XP + Lowmarket) | Already filed as mislabel |

### 1C. Shared cluster vs mode-specific

```
SHARED (drives ~1–3 scores everywhere)
  mush · passive GM · pad recycle · inspect-XP · no spine · weak voice · soft bag

MODE-SPECIFIC (raises bar after shared is fixed)
  LitRPG → combat force + level curve + System cadence
  DnD    → dice-honest stakes + keep quest pressure + Dry Wit
  RPG    → NPC/leverage beats + vigil threat + Friendly Guide asides
  PYOA   → crisis fork injector + ending pressure + Mission Lead briefs
```

---

## 2. Root-cause pillars (big ship)

1. **Mush authority** — stranger/them/this-place are scrub gaps + choice assembly, not templates. Need ledger-named nouns in SNAPSHOT + hard reject broken option labels.
2. **Passive world clock** — SNAPSHOT stagnation HARD is prompt-only. Need code-owned same-action interrupt + threat-decay / ambush / crisis spawn.
3. **Pad banks without presence** — LitRPG invent-crowd pads leak; RPG/PYOA generic Walk-away / Use-item pads never cool down.
4. **XP without adventure** — FO3 drip rewards study loops; combat/quest XP too rare to level in 300t.
5. **Voice as STATUS-only** — personalities don’t append audible chrome on hub change / fail / threat.
6. **Thin flagship spines** — CK / Cape / Thornferry / SP opening→mid lack forced next beat (content + injector), not only Free writer quality.
7. **Bag soft lock** — post-hoc scrub ≠ inventory JSON authority.

Pillars 1–4 move scores most. 5–7 prevent “fixed mush, still 3/10 genre fail.”

---

## 3. Ordered work packages (P0 → P2)

Do **not** implement until John says ship. Owners are existing modules.

### P0 — Stop looking broken + stop infinite soft loops

| WP | Work | Owner | Acceptance |
|---|---|---|---|
| P0.1 | Harden stranger/them/this-place scrub; reject `Check the stranger` / `Examine them clues` options | `proseWarden` + `choicePad` / `narrativeScrub` | themWordHits ≤10 on DnD 300t; stranger body ≤20 on RPG/PYOA; 0 broken-stranger options |
| P0.2 | Same-action **hard** interrupt after ≥3 identical intents (force arrival / offer expires / danger / clerk beat) | `situationSnapshot` + turn pipeline (not prompt-only) | maxIntentStreakSeen ≤3 **and** 4th repeat ≠ soft clone prose |
| P0.3 | Presence-gated pads: drop gate-queue / invent-crowd when alone; cooldown Walk-away / Use-charter / Inspect-surroundings | `choicePad` | LitRPG gateQueueOptionHits ≤5 alone; PYOA charter-option ≤1 per 5 turns once examined |
| P0.4 | Hard bag / inventory JSON lock (LLM cannot invent/duplicate bag lines) | item authority + `situationSnapshot` + scrub | 0 `[Uncommon] them`; bag stable across 50 bag-check turns |

### P1 — Make genres feel like genres

| WP | Work | Owner | Acceptance |
|---|---|---|---|
| P1.1 | Threat decay / ambush on tagged danger + dawdle | code combat / warden + SNAPSHOT | ≥1 forced combat or crisis by **T50** on LitRPG maxlevel + DnD maxlevel |
| P1.2 | Inspect XP once-per-target/zone; shift XP to combat / quest tick / hub-first-discover | `xpCode` | maxlevel LitRPG **≥ Level 2** by T300; study-only XP share ≤30% of STATUS XP lines |
| P1.3 | Quest / crisis injector: after opening complete, force next-objective option within N turns | `questPlay` + SNAPSHOT | LitRPG: quest-tied option ≤10t after registration; PYOA: ≥1 mutually exclusive crisis fork by T30 |
| P1.4 | Voice cadence: one personality aside on hub change / XP / failed action | `gmVoiceProfile` + STATUS chrome | Cold Registrar / Dry Wit / army-brief / Friendly Guide audible ≥1 per hub change in export |
| P1.5 | Meta-input → repair path (“not gate queue”) | `useGame` repair banner | Meta complaint clears bad pad once |

### P2 — Mode depth (after P0/P1 land)

| WP | Work | Owner | Acceptance |
|---|---|---|---|
| P2.1 | Cursed Keep dice-honest challenge beats (investigate/position) | bibleContent + choice DNA | ≥3 skill-check moments by T100 DnD |
| P2.2 | Cape vigil NPC/leverage bank densify | bibleContent (RPG) | ≥5 named contact beats by T100 storyfollower |
| P2.3 | Thornferry ending-pressure rails (ally/betray forks) | bibleContent (PYOA) | agent reaches a labeled branch node by T150 ≥50% of runs |
| P2.4 | Stronger autoplay anti-loop (maxlevel door sit) | agentPolicy | optional; engine interrupt is primary |

---

## 4. Acceptance tests (measurable — re-run 12×300)

After ship, regenerate `modes-agents-300t` (or 4×1×200 smoke) and require:

| Metric | Target |
|---|---|
| DnD themWordHits | ≤10 each agent |
| RPG/PYOA `the stranger` body hits | ≤20 / 300t |
| maxIntentStreakSeen (batch) | ≤3 with forced interrupt evidence in transcript |
| LitRPG gateQueue alone + Earth junk | ≤5 / ≤10 option hits |
| LitRPG maxlevel level | ≥2 by T300 |
| Combat or crisis events | ≥1 by T50 (LitRPG + DnD maxlevel) |
| PYOA Earth junk / Lowmarket / Cape / Mask Scarf | **0** (regression lock — already 0; keep) |
| RPG Lowmarket / Cathedral Undercroft | **0** (already 0; keep) |
| Broken option labels (`Check the stranger`) | 0 |
| Gemini re-score axes (pace / mush / combat / quests / voice) | see §6 |

Critic pack: keep anti-false-positive rails (no Mustache theory; no cross-mode bleed without body quote; STATUS search required).

---

## 5. What NOT to rebuild

- Mustache / `[Location.Name]` frontend template rewrite  
- “XP doesn’t exist” / delete STATUS drip entirely  
- Nuke all regex wardens (tighten stranger→them; don’t remove invent gates)  
- Bible-isolation megaproject driven only by Gemini Lowmarket-in-cape claims (false on this pack)  
- Blame-only agentPolicy rewrite without world interrupt  
- Re-implement 26u scrubs from scratch — extend, don’t redo  
- Full Continuity-Warden LLM critic path for these classes (classifier-only; prefer `applyErrorRepairs` / code)

---

## 6. Honest expected score uplift

If **P0 + P1** ship and a fresh 12×300 is re-Gemini’d:

| Axis | Now (Gemini ~) | Expected after big ship | Notes |
|---|---|---|---|
| Mush / English / options | 1 | **4–6** | Biggest visible jump |
| Pace / long-session | 1 | **4–5** | Hard interrupt + threat |
| Combat / danger | 1 | **4–6** LitRPG/DnD; **3–4** PYOA/RPG | Mode-appropriate stakes |
| Quests / branches | 1 | **4–5** | Injector + thin bible densify |
| XP / systems | 2 | **5–6** LitRPG if level≥2; **3–4** others | Don’t expect FO3 MMO |
| Voice | 1–2 | **4–5** | Cadence, not new personality system |
| Keep playing? | 1 | **4–5** | Still not “wins vs Studio” |
| Competitive win | Loss | **Narrow loss → contested** | Honest: not FO3/CoG parity in one batch |
| **Overall critic mean** | ~1–2 | **~4–6 on fixed axes** | Executives may still be harsh; ledger rows matter more |

Remaining after one big ship (expect ~5–6 ceiling until P2 densify): outdoor encounter density, full comic, Expert tools, MMO zone art — out of scope.

---

## 7. Suggested ship sequence (when John says go)

1. P0.1 mush + broken options (fast, high critic delta)  
2. P0.3 pad presence/cooldown  
3. P0.2 hard same-action interrupt  
4. P0.4 bag lock  
5. P1.1 threat decay + P1.2 XP retarget + P1.3 quest/crisis injector (together = genre feel)  
6. P1.4 voice cadence + P1.5 meta repair  
7. Re-run 12×300 → file new Gemini packs → only then P2 bible densify if scores still spine-starved  

---

## 8. File map

| Doc | Role |
|---|---|
| `NEXT-UPDATE-FROM-3x500.md` | Seed-42 Cold Registrar board (pre-26u context) |
| `gemini-05` … `gemini-08` | Calibrated mode pastes |
| `BIG-UPDATE-SCORE-UPLIFT-FROM-4x300.md` | **This plan** — cross-mode ship |
| Canvas `modes-agents-300-review-vs-gemini.canvas.tsx` | Cursor vs Gemini compare (refresh with RPG/PYOA calibration) |
| Telemetry | `…/modes-agents-300t-…/improvement-telemetry.json` |

**Reminder:** John is still playtesting live. Merge any new issues he pastes before implementing. Wait for explicit “ship the next update.”
