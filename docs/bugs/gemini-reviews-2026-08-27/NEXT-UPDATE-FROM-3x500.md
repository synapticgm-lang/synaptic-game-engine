# Next-update review — Gemini 3×500 (seed 42 Cold Registrar)

**Date:** 2026-08-27  
**Packs:** gemini-02 maxlevel · gemini-03 storyfollower · gemini-04 completionist  
**Baseline of those transcripts:** pre-26t / pre-26u overnight  
**Sources:** `docs/bugs/gemini-reviews-2026-08-27/gemini-0{2,3,4}-*.md`

This is the engineering synthesis for the **next update** (do not ship until John asks). Live playtest issues he raises later merge into the same board.

---

## 1. What the three reviews agree on (signal)

All three agents on the **same seed** fail the same way. That means engine/content/pacing — not “one bad agent.”

| Failure cluster | Evidence pattern | Severity |
|---|---|---|
| Noun mush (`them`, `this place`, plaque `them-them`) | Prose + options across early→late | P0 |
| Paragraph clones (berry-juice vendor ~14 turns) | Turns ~9–22 all packs | P0 |
| Same-action loops (battlement / undercroft door / Earth junk / corner table / gate queue) | Dozens of repeats; maxlevel door ~60 turns | P0 |
| Broken option English | `Check your them`, `Examine them clues`, `merchant, dark berries` | P0 |
| Inventory string corruption / duplication | `two them`, `four [Uncommon] them` (T347/494) | P0 |
| Near-zero LitRPG chrome in *export* | Only ~T210 registration called out | P0 feel* |
| No combat / no forced danger | Growl ignored; walk-away always works | P1 |
| No quest spine after Elias/registration | Wandering hubs for hundreds of turns | P1 |
| Cold Registrar “absent” in narration | Dry 2nd-person filler | P1 |
| Meta-input ignored | “not gate queue” screams | P2 |

\*Chrome scoring was partly an **export blind spot** on older packs (STATUS stripped). Meta Level/XP and post-26t sandbox XP need a **fresh post-26u pack** before re-scoring XP as still zero.

---

## 2. What Gemini got wrong (do not rebuild on myths)

| Gemini claim | Reality | Implication |
|---|---|---|
| “UI `[Location.Name]` template broken” | No such player-facing template; mush is scrub/LLM/choice assembly | Fix **proseWarden / narrativeScrub / choicePad**, not a frontend Mustache layer |
| “Zero XP / not a LitRPG” on these packs | These runs are **pre-26t**; headless lacked sandbox XP then. Also older Gemini exports omitted STATUS | Re-run autoplay on **26t+26u** before treating XP as still broken |
| “Disable all regex / post-processing” | Scrubs stop worse invents; over-broad scrubs caused some `them` | **Tighten** stranger→them (done 26u); don’t nuke wardens |
| “Personality never wired” | Cold Registrar is mostly STATUS diction + rails | Need **visible frequency** of chrome + stronger voice check, not “wire the id” from scratch |
| “Only agent is pathological” | GM never interrupts 30–60 turn loops | Need **same-action stagnation + threat decay**, not only smarter agents |

---

## 3. Already shipped vs still open

### Likely improved by **26u** (re-verify, don’t blindly re-implement)
- stranger → bare `them` fallback removed  
- `this place` / orphan-them scrubs  
- NPC `your head/eyes` reverse + past-tense verbs  
- broken choice label reject + tighter option dedupe  
- near-clone (≥0.85) novelty retry  
- SNAPSHOT quest focus + stagnation **prompt** rail (not guaranteed combat)  
- Gemini export includes STATUS XP lines  

### Shipped by **26t** (re-verify on new maxlevel run)
- sandbox XP + level-up on headless + live  

### Still **open for next update** (priority)

1. **Inventory authority** — LLM must not narrate/duplicate bag contents; stop `[Uncommon] them`; ledger-owned item list in SNAPSHOT + scrub invent-in-bag  
2. **Same-action interrupt (hard)** — after N identical intents (battlement/door/Earth junk), force world event (arrival, danger, offer expires, quest beat) — not prompt-only  
3. **Threat decay / ambush** — opening bombardment and hostile zones cannot be walked away forever  
4. **Context-aware pads** — drop `Watch the gate queue` / invent-crowd when presence is empty/alone  
5. **Visible System chrome frequency** — ensure STATUS lines commit often enough; Cold Registrar one-liner on hub change / registration / XP  
6. **Quest spine after registration** — force next objective option within N turns of Elias/System registration  
7. **Meta / repair input** — if player text looks like UI complaint (“not gate queue”), acknowledge + clear bad pad (repair banner path)  
8. **Empty-GM forward** — already softened in 26u; confirm no “moment hangs” dead-ends  
9. **Post-26u verification autoplay** — 1×500 maxlevel + 1×500 storyfollower Summoned Pact cold-system, then re-Gemini  

---

## 4. Suggested next-update ship order (when John says go)

| Order | Item | Owner hint | Acceptance test |
|---|---|---|---|
| P0 | Re-verify 26u them/options/clones on new 200–500t run | QA autoplay | Gemini ledger rows for bare `them` / broken options drop sharply |
| P0 | Inventory string + duplicate lock | proseWarden + item authority | No `[Uncommon] them`; bag count stable across 50 bag-check turns |
| P0 | Same-action hard interrupt (≥3) | situationSnapshot + turn pipeline | 4th “Walk the battlement” cannot be identical stall prose |
| P1 | Threat decay on tagged danger | warden/code | Opening assault unresolved ≤3 turns → forced beat |
| P1 | Alone/presence pad gate for gate-queue/crowd | choicePad | Alone battlement never offers gate queue |
| P1 | Cold Registrar STATUS cadence | uiChrome + voice rail | ≥1 STATUS or registrar line per hub change / XP / registration |
| P1 | Quest pressure after registration | questPlay + SNAPSHOT | Within 10 turns of registration, a quest-tied option appears |
| P2 | Meta-input classifier → repair | useGame repair | “not gate queue” clears that pad option |
| P2 | Stronger agent anti-loop (maxlevel) | agentPolicy | maxlevel does not sit 60 turns on one door |

---

## 5. Critic pack upgrades (this pass)

Gemini files now embed:
- Anti-misdiagnosis rules (no fake `[Location.Name]` theory)  
- Explicit STATUS search instructions  
- Agent vs engine blame split  
- Allowed fix-owner vocabulary  
- Code baseline field  
- Section **G: Confidence & blind spots**  

Regenerate numbered packs after prompt change so John can re-score **or** run fresh autoplay first (preferred).

---

## 6. Recommendation

1. Keep live playtesting; paste more issues into the waiting list.  
2. Before the next big Gemini round: run **post-26u** `maxlevel` + `storyfollower` 500s and feed those numbered packs.  
3. When John calls the update: implement the **open** P0/P1 table above — don’t redo 26u scrubs from scratch.
