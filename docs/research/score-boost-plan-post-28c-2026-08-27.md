# Score boost plan — post-28c (2026-08-27)

**Status:** Planning only — no game code until John authorizes ship.  
**Baseline:** 2026-08-28c worst-cells Gemini reviews (gemini-13–16) vs 27w (gemini-09–12)  
**Synthesis:** `docs/bugs/gemini-reviews-2026-08-27/GEMINI-28C-VS-27W-SYNTHESIS.md`  
**Authority model:** Manus BIG CHANGES + Path A docs (`recommended-ship-bundle-2026-08-27.md`, `path-a-ship-implementation-2026-08-28c.md`)

---

## Honest ceiling

| Horizon | Gemini band (worst cells) | What it requires |
|---|---:|---|
| **Today (28c)** | **~1–2/10** | Liveness without resolution; scrub collateral; Free hook NO all modes |
| **Next batch (29a)** — terminal + scrub scope + pad lock + leak firewall | **4–5.5/10** | Readable 50-turn windows; Free T12 **one resolved delta** |
| **29a + branch enforcement + voice pass** | **5–6.5/10** | Manus one-batch honest band; PYOA/RPG forks visible |
| **Three batches + content depth + human Free playtest** | **7–8.5/10** | Manus three-batch horizon — not autoplay alone |
| **8/10+ on Gemini autoplay** | **Not credible next batch** | Critics punish 300t completionist agents; need human retention study |
| **9–10** | **Not schedulable** | Manus T6 — human retention, rich manifests, trusted eval |

**Can we hit 6/10 on the next batch?** **Yes on isolated axes** (mush, STATUS, combat resolution) if terminal FSM + scrub scope ship together — **portfolio average ~5–6.5/10** on worst cells is the honest Manus-aligned target, not a guarantee on every axis.

**Can we hit 8/10 on the next batch?** **No** — that needs branch depth, voice, content, and clean 12×300 under manifest over multiple batches.

---

## Root cause (why 28c didn’t move Gemini)

Path A inverted **spawn authority** but not **terminal authority**:

- `receiptTotals.combat=1` = **one spawn commit**, not a fight that ends  
- `receiptTotals.crisis=3` = **fork opened**, not **branch locked**  
- `typedEntityValidator` / prose scrub runs **after** GM and **overwrites** bound ledger nouns  
- `choiceCompiler` throttles pads globally but **not under `activeEncounter`**  
- Voice cadence hints ride on sealed manifest while **player STATUS leaks raw prompt tags**

**Scrub-only or prompt-only cannot reach 4.5/10** — 27w proved this; 28c proved spawn-only is also insufficient.

---

## Ranked interventions (29a bundle)

Priority order for engineering. Each item lists **owner module**, **Gemini axes moved**, and **acceptance test**.

### P0 — Must ship together

#### 1. Encounter Terminal FSM (`encounterResolution` rebuild)

**Owner:** `encounterResolution.ts`, `arcDirector.ts`, `useGame` / `fateAutoplay` commit path  
**Problem:** LitRPG Pact-Hunter + DnD Keep Wraith — flee/parley forever; `Flee Success` without `activeEncounter` clear  
**Spec:**

- States: `idle → engaged → resolving → terminal`  
- Counters: failed flee, failed parley, rounds in `engaged`  
- **Hard terminals** (code, not prompt): after **3** failed flee **or** **8** engaged turns **or** mob HP ≤ 0 **or** PC HP ≤ 0 → commit exactly one: `escaped`, `victory`, `defeat`, `captured`, `parleyResolved`  
- Emit **`encounterCleared` receipt** + clear `activeEncounter` + unlock travel  
- Deterministic fallback prose on GM fail **preserves terminal** (28c sealed manifest pattern)

**Acceptance:** worst-cell LitRPG + DnD — `receiptTotals.combat ≥ 1` **and** `encounterCleared ≥ 1` before T50; no travel pads while `engaged`  
**Gemini axes:** 3, 6, 9, 13, 19, 20, Free hook

#### 2. Entity scrub scope fix (`typedEntityValidator` + `proseWarden`)

**Owner:** `typedEntityValidator.ts`, `proseWarden.ts`, `qualityGovernance.ts`  
**Problem:** Collateral tokens worse than `them` count — `the mark`, `nearby building`, `the panel`, inventory → stranger/guard  
**Spec:**

- **Allowlist (never scrub):** active encounter mob names + aliases, equipped inventory display names, quest items (Millstone Charter, Mask Scarf), named NPCs in `presentNames`, current `locationSheet` title  
- **Blocklist (still scrub):** orphan `[Uncommon] them`, bare `the stranger` without scene binding, `this place` when untracked  
- Bind combat prose from **`beatContract` entity registry**, not regex fallback nouns  
- Post-scrub **assertion**: if bound entity replaced → revert line + log repair once

**Acceptance:** worst cells — `the mark` / `nearby building` / charter→panel hits **→ 0**; `themWordHits` not worse than 28c on RPG  
**Gemini axes:** 14, 15, 16, 17, 11

#### 3. Combat / encounter pad lock (`choiceCompiler`)

**Owner:** `choiceCompiler.ts`, `choiceEdge.ts`  
**Problem:** Earth junk / Browse / Travel during active encounter  
**Spec:**

- When `activeEncounter`: legal pad = combat moves + one grounded interact + **no** hub travel, merchant, Earth junk, generic inspect  
- Flee/parley options **removed after terminal threshold** (pairs with FSM)  
- Travel requires `encounterCleared` or explicit disengage receipt

**Acceptance:** LitRPG `earthJunkOptionHits` during engaged turns = 0; DnD no `Travel toward Greyhollow` while Wraith engaged  
**Gemini axes:** 5, 6, 10

#### 4. STATUS prompt leak firewall (`qualityGovernance` / STATUS formatter)

**Owner:** `qualityGovernance.ts`, STATUS assembly in commit path, `systemLog` display filter  
**Problem:** `[GM_VOICE_PROFILE…]`, `[PYOA]`, `[RenderFallbackUsed]`, `[Campaign Contract]` in player-facing STATUS  
**Spec:**

- Strip lines matching internal tag patterns before player log + transcript export  
- Keep in debug export / `turns.jsonl` only  
- RenderFallback → one-line player-safe “retrying beat” copy

**Acceptance:** grep player transcript STATUS — **0** internal tag prefixes  
**Gemini axes:** 18, 17, 12

#### 5. NPC topic exhaustion → branch commit (`npcTopicFsm` + `ArcDirector`)

**Owner:** `npcTopicFsm.ts`, `arcDirector.ts`, `beatContract` registry  
**Problem:** DnD dialogue purgatory → RPG leverage loop; topics never exhaust to world change  
**Spec:**

- Each NPC topic slot: `fresh → engaged → exhausted`  
- On exhausted: **mandatory** `questStage+1`, leverage Δ, or mode crisis edge — pre-GM commit  
- `choiceCompiler` drops exhausted topic families from pad

**Acceptance:** RPG s137 — leverage/feeds topic exhausted by T25 with visible quest stage or crisis branch; no “Listen for the real answer” only pad after T40  
**Gemini axes:** 3, 6, 7, 11, Free hook

#### 6. PYOA crisis branch ledger enforcement (`pyoaBranchLedger`)

**Owner:** `pyoaBranchLedger.ts`, `arcDirector.ts`, Thornferry beat contracts  
**Problem:** crisis receipts ×3 but Charter / Buy time loop to T300  
**Spec:**

- Crisis fork → **lock** branch id on ledger (`help-overseer` | `burn-charter` | `sell-to-pell` …)  
- `<item-use Millstone Charter>` must commit **branch stage**, not narrative-only wax crumble  
- Exhaust `Buy time` / `Call for help` → overseer escalation or forced fork choice (2–4 numbered forks)

**Acceptance:** PYOA s188 — `branchLocked ≥ 1` by T30; pad families stall < 10% after T50  
**Gemini axes:** 6, 7, 9, 10, Free hook

### P1 — Same batch if capacity; else 29b

| # | Intervention | Owner | Notes |
|---|---|---|---|
| 7 | **Free T12 hook contract** | `arcDirector`, eval harness | By T12: **one of** level tick, quest stage-2 receipt, **resolved** encounter, or PYOA branch lock — not spawn-only |
| 8 | **Spatial continuity bind** | `sceneFacts`, prose rails | Exit narrated → flee prose cannot revert interior (DnD T280–281) |
| 9 | **Talk / inspect XP once-per-node** | `discoveryXpLedger` | Stops 300t talk-farm leveling (RPG L3 on 30 XP) |
| 10 | **Voice cadence in committed scenes** | `voiceCadenceSystem` | After FSM terminal + scrub — short STATUS voice lines; not Mid writer |
| 11 | **Eval harness resolution gates** | `evalHarness.ts` | Fail if `combat spawn` without `encounterCleared` by T50; fail if `crisis` without `branchLocked` by T30 (PYOA) |

### P2 — Defer

- Stagnation Mid writer (Manus Opt 10) — eloquent mush risk  
- Second LLM critic / Continuity-Warden planner  
- Random ambush timers without beat contract  
- Default stronger Free model  
- More regex mush patterns without allowlist

---

## Per-mode quick wins

| Mode | Fastest Gemini uplift | 29a must-have |
|---|---|---|
| **LitRPG** | Terminal FSM clears skirmisher; bind `Pact-Hunter` not `the mark`; combat pad lock | #1, #2, #3 |
| **DnD** | Same FSM for Wraith; scrub allowlist stops building/priest corruption; block travel in combat | #1, #2, #3 |
| **RPG** | Topic exhaust → vigil stage commit; STATUS firewall; **fix them regression** via allowlist | #2, #4, #5 |
| **PYOA** | Branch lock after crisis; Charter entity binding; stall pad exhaustion | #2, #4, #6 |

---

## What NOT to do

1. **More post-hoc mush regex without allowlist** — created `the mark` / `nearby building` / RPG them regression  
2. **Another prompt-rail “after 5 turns escalate” without commit** — 27w/28c proved SNAPSHOT mandates don’t terminate encounters  
3. **Celebrate liveness gates alone** — combat receipt ×1 is not combat  
4. **Mid writer for voice** — cost + variance; scrub collateral still reads as 1/10  
5. **Autoplay-only proof for 8/10** — completionist agents optimize loops; human Free 12-turn study required  
6. **Ship scrub before terminal FSM** — fixes readability while purgatory remains = still ~1/10 on pace/agency

---

## Suggested ship label: **29a Terminal Authority**

**Waves:**

1. Encounter terminal FSM + eval resolution gates  
2. Entity allowlist scrub + combat pad lock  
3. STATUS firewall + NPC/PYOA branch enforcement  
4. Re-run worst-cells 300t + Free 20t hook study  
5. Re-score Gemini on clean manifest

**Verify:**

```bash
npm test -- src/game/playtest28cManusComplete.test.ts  # extend for terminal FSM
npm run fate-autoplay -- --worst-cells --turns 300 --build 29a
```

**HUD stamp:** `2026-08-29a` (when authorized)

---

## John decision

| Choice | Recommendation |
|---|---|
| Ship 29a engineering bundle above | **Yes** — only credible path to Manus 4.5–6.5 band |
| Run Manus research prompt first | Optional if you want formal FSM + branch specs before code |
| Target 8/10 next batch | **Decline** — dishonest |

Related: `docs/research/manus-score-boost-research-prompt-2026-08-27.md`
