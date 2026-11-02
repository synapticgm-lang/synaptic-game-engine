# XP and levelling: running log of every attempt

Owner: Grok Bot, under John's 1 Nov 2026 delegation ("Re xp ill let you be the judge of what will work best. Make notes so if it doesn't work we have a running list of whats been attempted to help find a different system").
Scope: LitRPG and Story RPG. Tabletop follows SRD 5.2.1 and is never changed by this log's designs.
Rule for this file: append only. Every new XP attempt, fix or revert gets a dated entry (what, why, outcome and problems). Never delete an entry; mark it superseded.
Sources: git history of `src/game/xpRules.ts`, `sandboxXp.ts`, `characterXp.ts`, `docs/design/litrpg-xp-review.md`, `docs/design/skill-xp-table.md`, `docs/orders/q67-xp-pacing-research.md`, `docs/orders/xp-fix.md`, `docs/orders/q69-XPSOURCES*.md`, and John's chat. Commit hashes are short ids on `main` unless noted. Where an outcome is not written down in the repo it says "not recorded".

## Standing locks (John)
- XP lock: "Make no changes on xp with confirming with me." On 1 Nov John delegated the XP/levelling design for LitRPG and RPG to Grok Bot, on condition this log is kept (message pt1712u). Tabletop XP stays SRD 5.2.1.
- Engine owns every number. The AI never decides XP (`xpRules.ts` header).
- John's quest rules (1 Nov): quest identity is giver + quest, so the same task for a different giver pays in full. Repeating it for the same giver, or doing far-below-level content, pays reduced XP (WoW-style grey). Repeatable resource quests ("gather X plants, get X potions") give identical items every time; only the XP drops.

## Timeline

### 1. 26-29 Aug 2026: drip XP (superseded by entry 2)
- What: small XP for most actions: looking around, inspecting, talking, vendor browsing, travel, bearings, daily milestone (+20 each UTC day). Commits: c4baba61 (26 Aug, "real level-ups + FO3 sandbox drip"), 059c0e61 (26 Aug, "unexplained look-around XP" fixed), a0e5f2ec (27 Aug, daily milestone), b88f6bda (29 Aug, "bearings XP"), 6d1acdbe (7 Sep, "Systems-first: L2 at 150").
- Why: make the level bar move fast so the first level-up lands early.
- Outcome and problems: about 25 separate small awards. XP came from doing nothing in particular (look, walk, survive N turns), so levels did not mean effort. Player-visible XP lines had no reason. John and the tester flagged unexplained XP.

### 2. 28 Sep: milestone lump XP (28a, 08a142b1), stamp 2026-09-28a
- What: drip XP retired. One engine function (`xpRules.milestoneXp`) pays lump sums at milestones from one table: fight 40 / mini-boss 80 / boss 150, dungeon cleared 100, quest step 50, quest complete 100, person 25, place 25, "First Steps" achievement 75. Level 2 at 150 XP, then x1.5 per level. Tabletop on SRD CR XP and thresholds. XP is paid after the turn's text commits.
- Why: fewer, larger, explainable awards; tabletop must follow the SRD.
- Outcome: level 2 lands around turn 5-6 in LitRPG. Good first-level hook, kept. Problems: some milestones were still free (see entries 5 and 6).
- Follow-ons the same week: 28d difficulty table scales XP (Hard x1.25), 28f engine-owned fights pay xpRules milestones, 28i dungeon entry/room cleared XP, 28u1 spine main-path XP (29 Sep), 29r settlement-card XP and a 5% over-level cut in every mode (a milestone in an area 6+ levels below the player pays 5%).

### 3. 29 Sep: early rewards 25 / 50 / 100 + item, and the quest-chip bug
- What: LitRPG deeds pay by count: first kill 25, 3 fights won 50, 10 fights won 100, each with one grade-1 item (29z1, 686e4205; Story RPG pays an item and no XP; tabletop half the Low budget). Settlement quest cards paid XP and a reward.
- Bug: the quest chip paid its reward when picked, before the job was done. John: quests are paid only when the job is actually done.
- Fix: 29s (5480aa83, "town quests finish on the stake"): picking a card chip only takes the card; a later turn that resolves its stake finishes it once.
- Outcome: pay on completion works. Remaining issue: deed XP stacked on top of the fight that earned it.

### 4. 7 Oct: pay only on real events
- What: eec746cb quest steps only from the giver's talk, no unpaid quest XP voice, fight chips only with a live foe. 14a0df84 "reached" XP only on real arrival.
- Outcome: cut false pays. Still open: people and places paid for being met or reached.

### 5. 11-13 Oct: per-mode clean-ups
- What: s79 (e0fb57e7) talk stage pays only when the turn asks for it. Mode lap 2 (e7f1aa76) tabletop arrivals pay no XP, tabletop encounter XP is the CR XP of each foe, Story RPG arrivals pay no XP. tt-build-7 (da99e653) LitRPG and RPG on the shared engine maths, level-up HP by Hit Die + CON; the x1.5 curve from 150 was "held for John".
- Outcome: tabletop is SRD-correct. LitRPG/RPG curve left as it was.

### 6. 14 Oct: earned-XP fix (003540e6, report 8c6bf965), stamp 2026-10-14a
- What: from `docs/design/litrpg-xp-review.md`: First Steps only on the first quest step (no turn-5 path); opening cast pays nothing; a roster person pays only after a passed rolled CHA check; a place pays only when an open quest objective names it or a rolled INT/WIS check passed; a spine fork pays 0; daily milestone removed; arc beats proven not to pay character XP; a foe 3+ levels below pays 25%; small first-time awards (people/places) capped at 3 per in-game day. Curve unchanged.
- Why: books and games pay for threat, feats and quests, not for walking, greeting or logging in.
- Outcome and problems: 85 failing tests on first run, 10 new, nine were old tests pinned to free XP, one real bug (leftover daily-milestone reference). Casual talk skips the roll, so person XP needs a real social attempt. The autoplay harness pays no person XP (no check result to pass). The old arc encounter table rose to 40/80/150 to match the one LitRPG table.

### 7. 15 Oct: levelling per mode, and the skill XP table
- Order E (0458c253): one `MODE_XP` row per mode {xp, difficulty, overLevel, lowFoe, table}. Tabletop multipliers all 1 (SRD maths only). LitRPG and Story RPG keep Hard x1.25, 5% over-level, 25% low-foe. PYOA 0 XP. Engine-made foes get a CR from the SRD XP budget.
- SK-5 (b23f6437, `docs/design/skill-xp-table.md`): skill XP and named tiers for LitRPG/Story RPG. Level-1 base 100 XP, x1.1 per level, WoW grey-level formula (a task at or below the grey cutoff gives 0), long-shot boost only for untrained Journeyman+ tasks, no x1.5 stacking, about 500 successes to Master 10.
- Outcome: skills and character XP are separate tracks. Tested as maths; not recorded as measured in play.

### 8. 16-19 Oct: bounty XP, pacing research, XP sources (partly unmerged)
- q42-OPT2m (70be899c, 17 Oct): LitRPG bounty XP/loot and Story RPG favour standing stake.
- q67-LITPACE (d437d556, 19 Oct): research note `docs/orders/q67-xp-pacing-research.md`. The L6 free-tier run reached level 2 at turn 73 and level 3 near turn 95, then nothing could be earned from turn 96 to 330 because accepted quests pointed at placeholder people/places. Fix: materialise accepted quest places and NPCs at accept; show the XP bar to next level. The curve was not the problem; completable objectives were.
- q69-XPSOURCES (bcebf97d on branch `feat/g-xpsources`, NOT merged): place activities (gather, hunt, fish) paying character XP and skill use, depleting nodes, rare fishing. Held for John's config numbers. Status: unmerged and unapproved; superseded in intent by entry 13 (wandering builds soft skills, not level). Revisit only for its skill-use hooks.

### 9. 30 Oct: social skills level by use (T10SOC, 6925d604)
- What: lying, persuasion, barter, intimidation level through real attempts with something at stake; long shots earn more; small talk earns nothing. John approved on 30 Oct.
- Outcome: shipped. Per-use progress is skill XP, not character XP.

### 10. Flat 80 XP per Story RPG fight (observed, still in place at 1 Nov)
- What: Story RPG fights pay a flat 80 in play, regardless of foe level or threat. `STORY_RPG_MILESTONE_XP.encounter` is 40 and miniBoss is 80, so the cause is likely fights classed as miniBoss, or the difficulty scale, not the intended threat scaling. Root cause to be confirmed in entry 13's build.
- Outcome and problem: fights pay the same early and late and do not scale with the player's level, so late fights give almost nothing against a growing bar and early fights give a lot.

### 11. 31 Oct - 1 Nov: T10TABFIGHT (tabletop only)
- What: the first tabletop fight now picks a weaker foe (safer first L1 telegraph and ghost chip; 3778431c, merged and live in 2026-11-01c).
- Outcome: tabletop XP is SRD CR XP, so the first fight pays a little less. No LitRPG or RPG effect. No rule change.

### 12. 1 Nov: AI-quest and reader research (read-only)
- `docs/research/litrpg-progression-research-2026-11-01.md`. Findings used below: fast early then slower; one level per 1-3 chapters early and 5-10 later (guide rule of thumb); each level costs about 1.4-1.5x the last; skills train by use with a cap (Dungeon Crawler Carl: easy to about 10, hard cap 15); every 10th/5th level unlocks something real, not just numbers; readers dislike per-use stat spam, power creep, and mastery in days; engine-owned numbers and one payout per quest id resist AI inflation.
- Outcome: informed entry 13. No code.

### 13. 1 Nov: XP-D1, the new design (this entry is the one under test)
Status: in build on branch `xp/design` (worktree `wt/XPDESIGN`). Results are appended in section "XP-D1 results" below.

Design (LitRPG and Story RPG only; tabletop unchanged):
1. Unit pay. One pure table owns every number. `xpUnit(mode, level)` = bar(level) / unitsPerLevel(mode, level). Every award is a number of units, so pacing is awards divided by bar and cannot drift from the curve. Level 1 keeps today's amounts, so level 2 still lands around turn 5-6.
2. Source mix. Quests are the main source (target 60-70% of XP): step 1 unit, complete 3 units, so a normal 2-3 step quest is 5-6 units. Fights are secondary: foe 1, mini-boss 2, boss 4. People and places stay the small capped awards. Wandering and practice build soft skills, never character XP.
3. Fights scale by threat and level. This replaces the flat 80: a fight pays by the foe's level against the player's, not by a fixed number.
4. WoW-style grey, one rule for every milestone: content within 2 levels of the player pays 100% (a small bonus above, capped); then linear down to a 5% floor at the grey gap (5 + floor(level/10)). This replaces the separate low-foe (25% at 3 below) and over-level (5% at 6 below) cuts for LitRPG/RPG with one continuous function.
5. Quest identity = giver + quest. Same task for a different giver pays full. Repeat for the same giver pays 100%, 50%, 25%, then 10%. Fights repeated at the same place against the same foe use the same ladder (anti-farm).
6. Repeatable resource quests: identical item rewards on every repeat. Only XP reduces.
7. The AI proposes, the engine pays. A quest's XP never comes from AI text: `rewards.xp` on an AI quest is ignored; payout comes from the engine table by quest tier and level, with the quest's level clamped to the player's level +/-3 (the same clamp treasure uses), so the AI cannot inflate it.
8. Pace targets. LitRPG: level 2 at turn 5-6, then 15-25 turns per level through the early levels, stretching to 40-60 later. Story RPG: same shape, about 1.5x slower from level 2. Curve: level 1 to 2 stays 150; after that a gentler x1.25 per level (was x1.5), because awards now scale with the bar.
9. Soft skills capped by level: a use-trained skill cannot pass `2 x level + 3` (level 1: 5, level 10: 23, level 24: 50). At the cap, extra practice does nothing until the next level. Per-use gains are silent; the player sees only rank-ups, tier-ups, level-ups, titles and unlocks, through the System window / notices.
10. Every 5th level a real unlock (class step, evolution or named ability) comes from a quest or trainer, not from the level-up itself. Phase B of the build; separate entry when it ships.

Why this design: it answers the repo's two recurring failures (free or flat XP, and numbers that do not track the curve) and the reader research (fast early, slow later, no stat spam, power gated by quest or trainer).

How we will measure it (per mode, T50 on LitRPG and RPG, same seeds before and after where an old run exists):
- Turns per level: turn of each level-up; target LitRPG level 2 at turn 5-6, then 15-25 turns per level.
- XP share by source: quest steps + complete, fights, deeds/achievements, people/places, other. Target quests 60-70%, fights 15-30%.
- Fight XP vs foe level: no more flat 80; pay rises and falls with foe level against player level.
- Farming: repeated same-giver quests and same-place fights must show the 100/50/25/10 ladder; resource quests keep identical items.
- Silent gains: no per-use skill lines in the chat.
- Pass line: pace and share inside target ranges and zero farming loops. A miss is logged as a failed attempt, with the numbers, before anything is retuned.

If XP-D1 fails, alternatives already researched and not yet tried here: (a) milestone levels with no XP bar (D&D milestone, Cradle style named tiers); (b) quality-based progress (Fallen London change points, 1-6 per challenge, level n costs n); (c) per-stat use progression (AI Dungeon); (d) collection and card evolution (Hidden Door); (e) kill-only scaled XP (Primal Hunter / Defiance of the Fall) with quests as titles instead of XP.

## XP-D1 results

### 1 Nov 2026 — XP-D1 phase A T50 (free path) — MISS

Runs (branch `xp/design`, build `2026-11-01f+4885a6bf`, free writer, no paid AI):
- LitRPG: `scripts/fate-autoplay/runs/2026-11-01T20-29-20-537Z_summoned-pact_cold-system_s7201` (seed 7201, Summoned Pact)
- Story RPG: `scripts/fate-autoplay/runs/2026-11-01T20-36-12-145Z_salt-road-heist_chilled-gm_s7202` (seed 7202, Salt Road Heist)

Measured from `turns.jsonl` `XP Gained:` lines (matches `xpGained` field totals) and final save sheet.

| Mode | L2 turn | L3 turn | Turns L2→L3 | Total XP | Quest steps | Quest completes | Fights | Other (achievements) | Quest share (steps+completes) |
|---|---|---|---|---|---|---|---|---|---|
| LitRPG | **33** | 49 | 16 | 386 | 81 | 93 | 112 | 100 (First Kill 25 + First Steps 75) | **45.1%** |
| Story RPG | **36** | — | — (still L2 @ T50, 42/187 into bar) | 192 | 100 | 0 | 92 | 0 | **52.1%** |

LitRPG awards by turn: T6 fight thugs 50 + First Kill 25; T33 quest step 50 + First Steps 75 (L2); T34 quest step 31 + quest complete Circle’s Price 93; T49 fight Palace Stair Warden 62 (L3). Story RPG: T7 fight thugs 50; T35–36 quest steps 50+50 (L2 at T36); T37 Road Bandit 21; T42 thugs again 21.

**Vs targets**
- LitRPG L2 at turns 4–8: **MISS** (33).
- LitRPG L3–9 ~15–25 turns/level: L2→L3 = 16 **OK** (only span reached).
- Quest XP share 60–70% (tol. 55–80%): LitRPG 45.1% **MISS**; Story RPG 52.1% **MISS**.
- Story RPG ~1.5× slower from L2: **not measurable** (no L3/L4 by T50). L2 itself also late (36).
- Farming: no full same-quest XP double-dip. Story RPG repeated “the thugs” (50 then 21) — reduced payout (grey/repeat), not a full farm. LitRPG System bounty `gen-ds-trouble-34` completed with stage lines but **no XP** (quest floor / payout hole), which starved quest share and delayed L2. Flat-80 gone (L1 fight 50; L2 grey/repeat 21; L3 warden 62).

**Verdict: MISS** — primary offs: LitRPG L2 turn 33 (want 4–8); quest share both modes below 55% tolerance.

**Next attempt (one line):** Pay starter-quest steps earlier on the free path (first real objective before ~T8) and route generated bounty completions through engine `milestoneXp` so L2 lands in 4–8 and quest share returns to ≥55%.

### 1 Nov 2026 — XP-D1 attempt 1 results (free path 4×T50) — MISS

Attempt 1 code (from `merge-logs/xp-design/a1/A1-report.md`, commit `0b2ad780` on `xp/design`): pay same-turn bounty steps/completes when the quest was missing from `questsBefore`; LitRPG/Story RPG story chip skips bearings so the first XP-paying starter step can chip; `questComplete` 3→4 units, L2+ encounter 0.85 unit, unitsPerLevel retune; `LITRPG_MILESTONE_XP.questComplete` L1 snapshot 150→200; edge xpPace/xpRules synced. Tabletop/PYOA untouched.

Runs (build `2026-11-01g+1c153125`, free writer, no paid AI):
- LitRPG 7201: `scripts/fate-autoplay/runs/2026-11-01T21-14-36-678Z_summoned-pact_cold-system_s7201`
- Story RPG 7202: `scripts/fate-autoplay/runs/2026-11-01T21-18-15-579Z_salt-road-heist_chilled-gm_s7202`
- LitRPG 7203: `scripts/fate-autoplay/runs/2026-11-01T21-22-09-003Z_summoned-pact_cold-system_s7203`
- Story RPG 7204: `scripts/fate-autoplay/runs/2026-11-01T21-25-49-630Z_salt-road-heist_chilled-gm_s7204`

Measured from `turns.jsonl` `xpGained` + `XP Gained:` systemLog + `level` / `characterXp`.

| Run | Mode | L2 | L3 | L4 | Turns/level | Total XP | Steps | Completes | Fights | Ach/other | Quest share | Fight share |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7201 | LitRPG | **42** | — | — | — | 206 | 0 | 0 | 150 | 56 | **0%** | **72.8%** |
| 7203 | LitRPG | **29** | **29** | 39 | L2→L3 **0**; L3→L4 **10** | 736 | 220 | 364 | 57 | 95 | **79.3%** | **7.7%** |
| 7202 | Story RPG | **33** | — | — | — | 224 | 11 | 0 | 213 | 0 | **4.9%** | **95.1%** |
| 7204 | Story RPG | **26** | **30** | — | L2→L3 **4** | 443 | 148 | 270 | 0 | 25 | **94.4%** | **0%** |

Per-mode averages: LitRPG L2 **35.5**, quest share **39.7%**, fight share **40.3%**. Story RPG L2 **29.5**, quest share **49.7%**, fight share **47.6%**.

Zero-pay / stuck: 7201 never left Circle’s Price bearings (0 quest XP all run). 7203 T7 bearings stage completed with 0 XP (expected no-pay step). A1 same-turn bounty pay held on 7203 (Newcomers arrive / Dangerous discovery paid steps+completes).

Farming: 7202 fight repeats reduced (Rival Heist Crew 100→22; thugs 50→10→9). 7204 **Vessa's favour** same giver+quest ×3 — completes 44→26 (~50% OK); steps 11→13→13 full unit pay on repeats (**not** 50/25/10). 7203 bounty titles differed (full pay OK under giver+quest identity).

**Vs targets:** LitRPG L2 4–8 **MISS** (35.5). L3–9 spans 15–25 **MISS** (0 / 10 / 4). Quest share 55–80% tol. **MISS** (mode avgs 39.7% / 49.7%). Fights 15–30% **MISS** (40.3% / 47.6%). Story RPG ~1.5× slower from L2 **not shown** (L2 late; only L3 is early, not slower). Farming ladder **MISS** on 7204 favour steps.

**Verdict: MISS** — offs: LitRPG L2 avg 35.5; quest-share avgs 39.7%/49.7%; fight-share avgs 40.3%/47.6%; level spans 0/4/10; 7204 favour full-pay step repeats.

**Next attempt (one line):** Auto-clear or skip no-XP bearings by ~T4 so the starter XP step can land L2 in 4–8 on free path, and apply the 100/50/25/10 identity ladder to regenerated same-giver favour/bounty clones (steps included), not only completes.

Plain summary also at `merge-logs/xp-design/a1/T50-report.md`.

### 1 Nov 2026 — XP-D1 attempt 2 results (free path 4×T50) — MISS

Attempt 2 code (from `merge-logs/xp-design/a2/A2-report.md`, commits `285aa430` / follow-ups on `xp/design`): pin quest chips (Ask fall-through, opener travel, top-3 pin); bearings/Ping pay as quest step once; single XP event ≤60% bar + one level per apply (surplus cap); `questComplete` back to 3 units; unitsPerLevel retune; same giver+quest step identity ladder 100/50/25/10; edge xpPace/xpRules synced. Tabletop/PYOA untouched.

Runs (build `2026-11-01h+f0af0417`, free writer, no paid AI):
- LitRPG 7201: `scripts/fate-autoplay/runs/2026-11-01T22-13-44-509Z_summoned-pact_cold-system_s7201`
- Story RPG 7202: `scripts/fate-autoplay/runs/2026-11-01T22-19-34-907Z_salt-road-heist_chilled-gm_s7202`
- LitRPG 7203: `scripts/fate-autoplay/runs/2026-11-01T22-23-28-230Z_summoned-pact_cold-system_s7203`
- Story RPG 7204: `scripts/fate-autoplay/runs/2026-11-01T22-29-44-652Z_salt-road-heist_chilled-gm_s7204`

Measured from `turns.jsonl` `xpGained` + `XP Gained:` systemLog + `level` / `characterXp` (parley “resolved …” counted as fight).

| Run | Mode | L2 | L3 | L4 | Turns/level | Total XP | Steps | Completes | Fights | Ach/other | Quest share | Fight share |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7201 | LitRPG | **43** | — | — | — (still L2 @ T51, 54 into bar) | 204 | 50 | 0 | 68 | 86 | **24.5%** | **33.3%** |
| 7203 | LitRPG | **39** | — | — | — (still L2 @ T50, 115 into bar) | 265 | 66 | 63 | 50 | 86 | **48.7%** | **18.9%** |
| 7202 | Story RPG | **42** | — | — | — (still L2 @ T50, 51 into bar) | 201 | 75 | 0 | 126 | 0 | **37.3%** | **62.7%** |
| 7204 | Story RPG | **26** | — | — | — (still L2 @ T50, 102 into bar) | 252 | 78 | 149 | 0 | 25 | **90.1%** | **0%** |

Per-mode averages: LitRPG L2 **41**, quest share **36.6%**, fight share **26.1%**. Story RPG L2 **34**, quest share **63.7%**, fight share **31.4%**.

Zero-pay / stuck: no quest step or complete advanced at 0 XP. Bearings paid once (7201 T21 / 7203 T24 Ping — A2 fix held) but still late for the L2 band. One-level cap held: 7204 T26 Fake Cargo 140 XP → L2 only (not A1’s same-turn double level).

Farming: 7204 **Vessa's favour** ×3 same giver+quest — steps 13→7→3 then 1/1/1 then 1/1; completes 39→20 (ladder engaged, **no full-pay repeats**). 7202 thugs 50 then 50 on different road stretches (place+foe identity differs — not scored as full farm).

**Vs targets:** LitRPG L2 4–8 **MISS** (avg 41). L3–9 spans 15–25 **MISS** (no run reached L3). Quest share 55–80% tol. **MISS** on LitRPG avg 36.6% (Story RPG avg 63.7% inside). Fights 15–30%: LitRPG avg 26.1% OK; Story RPG avg 31.4% slightly over / uneven (62.7 / 0). Story RPG ~1.5× slower from L2 **not shown** (L2 late; no L3). Farming ladder **OK** this attempt.

**Verdict: MISS** — offs: LitRPG L2 avg 41 (want 4–8); LitRPG quest-share avg 36.6% (want ≥55%); no L3–9 spans; Story RPG L2 avg 34 and fight-share avg 31.4%.

**Next attempt (one line):** Clear or skip bearings by ~T3–4 and pin Hear-reason / first paying Circle’s Price step so starter complete can land L2 inside turns 4–8 before mid-run fights or favour loops dominate.

Plain summary also at `merge-logs/xp-design/a2/T50-report.md`.

## XP-D1 build notes (phase A, 1 Nov 2026)

Branch `xp/design`. Unit table in `src/game/rules/xpPace.ts`; `milestoneXp` for litrpg/rpg reads units × xpUnit × contentScale (+ tough-foe bonus on fights); difficulty xpScale still after. Curve: levelBar L1=150 then ×1.25 (`characterXp`). LOW_FOE / OVER_LEVEL removed from MODE_XP litrpg/rpg (dnd/pyoa unchanged).

### unitsPerLevel (LitRPG; Story RPG L2+ = ceil(1.5×))

| Level band | LitRPG units | Notes |
|---|---|---|
| L1 | 3 | xpUnit=50; quest step 50, fight 50, First Steps 75 |
| L2 | 6 | |
| L3 | 8 | |
| L4 | 10 | |
| L5–6 | 12 | |
| L7–9 | 14 | |
| L10–14 | 20 | |
| L15–19 | 24 | |
| L20+ | 28 | |

### Pace model (`src/game/xpPace.test.ts`)

Assumption: one XP event every 2.2 turns; 65% quest-shaped (2–3 step then complete), 35% on-level fights; seed 42. Tolerances used: L2 at turns 4–8; L3–9 spans 5–35 turns (±10 around 15–25); L10–15 spans 25–75 (±15 around 40–60); quest XP share 55–80% (target 60–70%; completes weigh more than fights). Story RPG ~1.5× slower from L2 measured at turn-of-L4.

### Flat-80 root cause

`encounterKind` matched `\belite\b` on catalog/road `source` strings (density tier "elite" / `road-camp-elite`), so ordinary Story RPG fights paid `miniBoss` = flat 80. Pay is now units × level (miniBoss=2 units), not a second flat table.

## XP-D1 OPEN build note (1 Nov 2026) — in-tree, no T50 yet

Branch `xp/design`. LitRPG-only **Opening Rite**: one-step easy-win per scenario (`openingRiteTable.ts`); engine completes on accept chip / free-text accept / refuse→forced / turn-4 backstop; XP fill = L1 bar − current XP → Level 2 exactly (exempt from 60% event cap; one-level-per-apply stays). Writer facts via `openingRiteFacts.ts` + `completedEventPacket`; accept chip pinned first; System window shows quest + XP + Level 2; Fate `--player-profile quest`. Pace model: L2 at turns 1–3 with opening win, L3 15–25 later (no unitsPerLevel retune). Tabletop/RPG/PYOA unchanged. Report: `merge-logs/xp-design/open/OPEN-report.md`. Free-path T50 still owed after stamp/ship.

### 2 Nov 2026 — LitRPG opening-rite attempt 2 (Registration timing + loop fix) results — MISS

What changed (from `merge-logs/xp-design/open2/OPEN2-report.md`, commit `d5d4b6aa` on `xp/design`): SI Registration cover pin + backstop by rite-turn/save-turn ≥3 (was ≥4 → L2 on save turn 5); skip quest-step/complete/First-Steps on `opening-rite:*` so rite fill alone pays L1→L2; no Use chip for reward boxes / full-HP vials; `Use … Reward Box` settles as open; stall refill prefers untried and drops Use under `STALL_N`; quest profile skips last dead pick (`chipProgressScore ≤ 2`). Tabletop/RPG/PYOA untouched.

Runs (build `2026-11-02a+35816572`, free writer DeepSeek via OpenRouter/gm-turn, no paid AI; seeds 7301–7304):
- 7301 random summoned-pact: `scripts/fate-autoplay/runs/2026-11-02T07-36-34-120Z_summoned-pact_cold-system_s7301`
- 7302 random system-integration: `scripts/fate-autoplay/runs/2026-11-02T07-44-53-331Z_system-integration_cold-system_s7302`
- 7303 quest summoned-pact: `scripts/fate-autoplay/runs/2026-11-02T07-49-01-855Z_summoned-pact_cold-system_s7303_quest`
- 7304 quest system-integration: `scripts/fate-autoplay/runs/2026-11-02T07-53-07-317Z_system-integration_cold-system_s7304_quest`

Measured from `turns.jsonl` (`xpGained`, `XP Gained:` systemLog, `level`, `characterXp`, `progress`, offered/picked chips). Quest share = rite + quest steps + quest completes.

| Run | Profile | Scenario | Rite turn / how | System notice / Check System | L2 | L3 | L2→L3 | Total XP | Rite | Steps | Completes | Fights | Ach/other | Quest share | Fight share | No-prog / max streak | LOOP STOP | Dead chip repeats (picks ≥2) | Zero-pay step | Farming |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7301 | random | summoned-pact | **2** refuse→forced (Refuse the offer) | System line yes (“seals the pact… Level 2”); Check System chip **never** | **2** | 41 | **39** | 448 | 150 | 195 | 63 | 29 | 11 | **91.1%** | **6.5%** | 9 / 1 | no (50/50) | Read/Analyze Orel Vane ×2 | 0 | none; rite ×1 |
| 7302 | random | system-integration | **2** chip (Give your name and register) | System line yes (Registration complete… Level 2); Check System chip **never** | **2** | 14 | **12** | 531 | 150 | 117 | 221 | 0 | 43 | **91.9%** | **0%** | 10 / 1 | no (50/50) | Search dungeon signs ×2; Read Warden ×2 | 0 | none; rite ×1; bounty completes reduced on repeat title (63→32) |
| 7303 | quest | summoned-pact | **2** chip (Accept the offer) | System line yes (Pact sealed… Level 2); Check System chip **never** | **2** | — | — (still L2 @ T51, 174 into bar) | 324 | 150 | 37 | 63 | 20 | 54 | **77.2%** | **6.2%** | 6 / 1 | no (50/50) | Open bronze box ×2; Search area ×2 | 0 | none; rite ×1 |
| 7304 | quest | system-integration | **2** chip (Give your name and register) | System line yes (Registration complete… Level 2); Check System chip **never** | **2** | 32 | **30** | 345 | 150 | 69 | 63 | 20 | 43 | **81.7%** | **5.8%** | 9 / 1 | **no** (50/50) | Search area ×2; Search dungeon signs ×2 | 0 | none; rite ×1 |

Per-profile averages: random L2 **2**, L2→L3 **25.5** (39/12), quest share **91.5%**, fight share **3.3%**, no-prog **9.5**, max streak **1**. Quest profile L2 **2**, L2→L3 **30** (one sample; 7303 no L3), quest share **79.5%**, fight share **6.0%**, no-prog **7.5**, max streak **1**. Overall: L2 **2**, L2→L3 avg **27** (n=3), quest share **85.5%**, fight share **4.6%**.

Quest-profile chip mix: ~33/50 progress-family picks vs ~11–12 inventory/search/read; Search/Read/Analyze still **offered** 6–15× per label without effect (starve not fully closed on offers).

**Vs 1 Nov OPEN baseline (same seeds):** 7301 L2@2 held (was 2); 7302 L2 **2 chip** (was **5** backstop) and L3@14 / span 12 (was L3@8 / span **3** early chain + rite XP 213 stacked); 7303 L2@2 held, L3 not reached this time (baseline L3@35); 7304 L2@2 chip (was rite@5 / L2@4) and **completed 50, no LOOP STOP** (baseline **LOOP STOP ~T37**, max no-prog streak **5**, Use Reward Box / Health Vial spam).

**Vs targets:** Rite→L2 in turns 1–3 both scenarios **PASS**; never L3 from rite **PASS**; no L3 within ~3 turns of L2 **PASS** (OPEN2 closed 7302); L2→L3 15–25 **MISS** (12 / 39 / — / 30); quest share 60–70% (tol. 55–80%) **MISS** overall avg 85.5% (random over); fights 15–30% **MISS** avg 4.6%; no full-pay repeats **PASS**; rite once/save **PASS**; NO LOOP STOP + no 5+ no-prog streak **PASS**; quest profile prefers progress **partial** (picks OK-ish; dead Search/Read still offered repeatedly).

OpenRouter: no balance or $ cost figure in logs or run meta (writerUsage has tokens only; teacher `deepseek/deepseek-v4.1-flash`).

**Verdict: MISS** — offs: L2→L3 spans **12 / 39 / — / 30** (want 15–25); quest-share avg **85.5%** (want ≤80% tol.); fight-share avg **4.6%** (want 15–30%). OPEN2 timing/loop gates held.

**Next attempt (one line):** After rite, bias free-path pads toward on-level fights / travel-to-threat and starve Search/Read/Analyze refill so fight share rises into 15–30% and L2→L3 lands in 15–25 without another early SI chain.

Plain summary also at `merge-logs/xp-design/open2/T50-report.md`.

### 2 Nov 2026 — LitRPG XP attempt 3 (fight XP + share + Check System + filler chips) — in-tree (superseded by results below)

What (from `merge-logs/xp-design/open3/OPEN3-report.md` on `xp/design`): L2+ quest step/complete sized down; on-level fight units kept meaningful (~4–12% of bar); Seek Fight chip offered on drought; alternate-win fight pay; Check System engine inbox + fate telemetry; Search/Read/Analyze/Open suppressed after one no-progress take until scene changes. Opening rite / L1→L2 untouched. Tabletop/RPG/PYOA content untouched (Story RPG shares unit path — covered by pace tests). Free-path T50 ran; see results entry.

### 2 Nov 2026 — LitRPG XP attempt 3 results (free path 4×T50) — MISS

What changed (from `merge-logs/xp-design/open3/OPEN3-report.md`, build `2026-11-02b+afc74d3a` on `xp/design`): L2+ `QUEST_STEP_UNITS_L2_PLUS=0.65`, `QUEST_COMPLETE_UNITS_L2_PLUS=1.6`, `ENCOUNTER_UNITS_L2_PLUS=0.85` + unitsPerLevel retune; alternate-win fight pay; `systemNoticeInbox` + fate `checkSystemOffered` / `Opened` / `unopenedSystemNotices`; Search/Read/Analyze/Open → search family with scene-key block after one dead take. Opening rite L1→L2 untouched. Tabletop/RPG/PYOA untouched.

Runs (free writer DeepSeek via OpenRouter/gm-turn, no paid AI; seeds 7301–7304):
- 7301 random summoned-pact: `scripts/fate-autoplay/runs/2026-11-02T09-47-42-003Z_summoned-pact_cold-system_s7301`
- 7302 random system-integration: `scripts/fate-autoplay/runs/2026-11-02T09-52-07-377Z_system-integration_cold-system_s7302`
- 7303 quest summoned-pact: `scripts/fate-autoplay/runs/2026-11-02T09-56-14-884Z_summoned-pact_cold-system_s7303_quest`
- 7304 quest system-integration: `scripts/fate-autoplay/runs/2026-11-02T10-06-25-036Z_system-integration_cold-system_s7304_quest`

Measured from `turns.jsonl` (`xpGained`, `XP Gained:` / `defeated …` as fight, `level`, `characterXp`, Check System fields, offered chips). Quest share = rite + steps + completes.

| Run | Profile | Scenario | Rite | L2 | L3 | L2→L3 | Total XP | Rite | Steps | Completes | Fights | Ach/other | Quest share | Fight share | Fights won | Check Sys off/open/max | Filler max same-state | No-prog / max | LOOP STOP | Zero-pay win | Farming |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7301 | random | summoned-pact | **2** refuse→forced | **2** | — (143/187) | — | 293 | 150 | 58 | 41 | 32 | 12 | **85.0%** | **10.9%** | 1×32 | **6 / 6 / 3** | **2** | 13 / 1 | no | 0 | none; rite ×1 |
| 7302 | random | system-integration | **2** chip | **2** | 20 | **18** | 375 | 150 | 72 | 74 | 20 | 59 | **78.9%** | **5.3%** | 1×20 | **12 / 12 / 3** | **3** | 10 / 1 | no | 0 | none; rite ×1 |
| 7303 | quest | summoned-pact | **2** chip | **2** | — (145/187) | — | 295 | 150 | 27 | 37 | 22 | 59 | **72.5%** | **7.5%** | 1×22 | **10 / 10 / 5** | **3** | 3 / 1 | no | 0 | none; rite ×1 |
| 7304 | quest | system-integration | **2** chip | **2** | — (178/187) | — | 328 | 150 | 54 | 37 | 40 | 47 | **73.5%** | **12.2%** | 2×20 | **14 / 14 / 4** | **11** | 12 / 1 | no | 0 (T22 defeat) | none; rite ×1 |

Per-profile averages: random L2 **2**, L2→L3 **18** (n=1), quest share **82.0%**, fight share **8.1%**, Check System offered **18**. Quest profile L2 **2**, L2→L3 none, quest share **73.0%**, fight share **9.9%**, Check System offered **24**. Overall: L2 **2**, L2→L3 **18** (n=1), quest share **77.5%**, fight share **9.0%**, Check System offered **42** (apart from scene pads).

**Vs open2 baseline (same seeds):** L2@T2 held; Check System **0 → 6/12/10/14**; quest share **85.5% → 77.5%** (into 55–80% tol.); fight share **4.6% → 9.0%** (still short of 15%); L2→L3 was 39/12/—/30, now —/18/—/— (slower / underleveled); LOOP STOP still none; filler same-state max still **>2** on 3/4 runs (7304 **11×** Read-signs on stuck report-back).

**Vs targets:** Rite→L2@T2 both scenarios **PASS**; quest share tol. **PASS** (77.5%); fights 15–30% **MISS** (9.0%); L2→L3 15–25 **MISS** (only one sample); Check System offered **PASS**; filler ≤2 w/o state change **MISS**; no LOOP STOP / no 5+ streak **PASS**; no full-pay same-giver farm **PASS**; zero-pay fight wins **0**.

OpenRouter: no balance or $ cost figure in logs or run meta (`costUsd` null; teacher `deepseek/deepseek-v4.1-flash`).

**Verdict: MISS** — offs: fight-share avg **9.0%** (want 15–30%); L2→L3 only **18** once, three runs still L2 at T51; filler same-state max **2 / 3 / 3 / 11** (want ≤2).

**Next attempt (one line):** Force steadier on-level fight/threat pads after rite (without stealing Travel) and hard-cap same-scene Search/Read/Analyze/Open offers at 2 so fight share can reach 15%+ and stuck report-back turns stop re-offering filler.

Plain summary also at `merge-logs/xp-design/open3/T50-report.md`.


### 2 Nov 2026 � LitRPG XP attempt 4 (plan) � fight reach + earning rate + filler offer cap

**Found (open3 T50, build 2026-11-02b, seeds 7301�7304):**
- Seek Fight offered **0** times in all four runs. OPEN3 gate !hasProgressPad blocks injection whenever any travel/quest/fight pad is present; quest-seeking (and most free-path turns) always have a progress pad, so drought never surfaces a fight chip. Wins stayed 1�2 per 50 turns; fight share avg **9.0%**.
- Per-win pay ~20 XP (~11% of L2 bar) is fine *if* fights are reached; with 1�2 wins it cannot hit 15�30% share. Pace model used one XP event / 2.2 turns; live post-rite was ~one event / 8�10 turns � model optimistic ? projected 15�25 L2?L3 while live missed on 3/4.
- Filler max same-state **2 / 3 / 3 / 11**. Seed 7304 label **"Read the signs of the report"** offered **11** times at the same cafe. OPEN3 illerBlockedFamilies only arms after a *dead take* of the search family; the player mostly picked Ask/Talk, so the label kept reappearing. progress=true on social turns also cleared the block. Scene key included raw XP (trivial tick risk). Verbs Study/Inspect stayed outside search family.

**Will change (LitRPG engine only; rite untouched; tabletop/RPG/PYOA content untouched):**
- Fix A: inject `Look for a fight` on drought (~every 8�12 turns) even when a progress pad is present � replace a filler/social slot, never the progress/stuck-exit Travel slot; never force violence; free text always answered. Slightly raise L2+ encounter units so engaged 4�6 wins land fight share near **20%** (band 15�30%); keep farm ladder + alt-win pay.
- Fix B: do **not** flatten `unitsPerLevel` (gaps keep growing). Modest L2+ step/complete lift only if still needed after fight reach; calibrate pace model to **observed** open3 event rates (fight ~1/10 turns when engaged) so model?live gap is explained; assert non-decreasing turns-per-level L2?L3�L6?L7, L3?L4 and L4?L5 longer than L2?L3, L3 not within ~3 of L2.
- Fix D: one owner � meaningful filler scene key (place/quest/fight/kit/level, **not** raw XP); offer-count cap =2 per label until meaningful change; expand filler verbs (Examine/Inspect/Study/Listen/Investigate/Loot); freed slot ? progress chip. Fixture replay of 7304 chip stream.

**Projected (pace model after retune, engaged):** L2@T2 (rite); L2?L3 **15�25**; quest share **60�70%** (tol 55�80%); fight share **15�30%** (aim ~20%); filler same-state offers =2. Live T50 still owed to the runner after this commit.

### 2 Nov 2026 — LitRPG XP attempt 4 results (free path 4×T50) — MISS

What changed (from `merge-logs/xp-design/open4/OPEN4-report.md`, build `2026-11-02c+5d8126d2` on `xp/design`): Seek Fight on drought even with a progress pad (filler/loiter slot only); L2+ `ENCOUNTER_UNITS_L2_PLUS=1.15`, `QUEST_STEP_UNITS_L2_PLUS=1.0`, `QUEST_COMPLETE_UNITS_L2_PLUS=2.4` (unitsPerLevel rising gaps kept); filler offer-count cap ≤2 with meaningful scene key (no raw XP); Inspect/Listen/Investigate/Loot in filler family. Opening rite L1→L2 untouched. Tabletop/RPG/PYOA untouched.

Runs (free writer DeepSeek via OpenRouter/gm-turn, no paid AI; seeds 7301–7304):
- 7301 random summoned-pact: `scripts/fate-autoplay/runs/2026-11-02T10-59-00-402Z_summoned-pact_cold-system_s7301`
- 7302 random system-integration: `scripts/fate-autoplay/runs/2026-11-02T11-06-38-351Z_system-integration_cold-system_s7302`
- 7303 quest summoned-pact: `scripts/fate-autoplay/runs/2026-11-02T11-11-31-001Z_summoned-pact_cold-system_s7303_quest`
- 7304 quest system-integration: `scripts/fate-autoplay/runs/2026-11-02T11-21-09-169Z_system-integration_cold-system_s7304_quest`

Measured from `turns.jsonl` (`xpGained`, `XP Gained:` / inferred victory+quest lines, `level`, `characterXp`/`xpToNext`, Check System fields, `progress`, offered chips). Quest share = rite + steps + completes. Bars: L2 **187** → L3 **233** → L4 **291** (rising).

| Run | Profile | Scenario | Rite | L2 | L3 | L4 | L2→L3 | L3→L4 | Total XP | Rite | Steps | Completes | Fights | Ach/other | Quest share | Fight share | Fights won | Check Sys off/open/max | Filler max same-state | No-prog / max | LOOP STOP | Zero-pay win | Farming |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7301 | random | summoned-pact | **2** refuse→forced | **2** | 41 | — | **39** | — | 455 | 150 | 225 | 30 | 38 | 12 | **89.0%** | **8.4%** | 1×38 | **7 / 7 / 4** | **3** | 9 / 1 | no | 0 | none; rite ×1; Seek Fight 0 |
| 7302 | random | system-integration | **2** chip | **2** | 14 | 47 | **12** | **33** | 649 | 150 | 163 | 220 | 30 | 86 | **82.1%** | **4.6%** | 1×30 | **15 / 15 / 3** | **5** | 9 / 1 | no | 0 | none; rite ×1; Seek Fight 0 |
| 7303 | quest | summoned-pact | **2** chip | **2** | 46 | — | **44** | — | 369 | 150 | 76 | 55 | 29 | 59 | **76.2%** | **7.9%** | 1×29 | **12 / 12 / 5** | **4** | 3 / 1 | no | 0 | none; rite ×1; Seek Fight 0 |
| 7304 | quest | system-integration | **2** chip | **2** | 29 | 50 | **27** | **21** | 647 | 150 | 182 | 227 | 29 | 59 | **86.4%** | **4.5%** | 1×29 | **21 / 21 / 4** | **7** | 4 / 1 | no | 0 | none; rite ×1; Seek Fight 0 |

Per-profile averages: random L2 **2**, L2→L3 **25.5** (39/12), quest share **85.5%**, fight share **6.5%**, Check System offered **22**. Quest profile L2 **2**, L2→L3 **35.5** (44/27), quest share **81.3%**, fight share **6.2%**, Check System offered **33**. Overall: L2 **2**, L2→L3 avg **30.5**, quest share **83.4%**, fight share **6.3%**, Check System offered **55**, fights won **1/1/1/1**.

**Vs open3 baseline (same seeds):** L2@T2 held; Check System **6/12/10/14 → 7/15/12/21**; quest share **77.5% → 83.4%** (left tolerance); fight share **9.0% → 6.3%** (Seek Fight still **0** offers); L2→L3 was —/18/—/—, now **39/12/44/27** (none in 15–25); filler max **2/3/3/11 → 3/5/4/7** (cap still missed); LOOP STOP still none; rising bars held.

**Vs targets:** Rite→L2@T2 both scenarios **PASS**; quest share tol. **MISS** (83.4%); fights 15–30% **MISS** (6.3%); L2→L3 15–25 **MISS**; Check System offered **PASS**; filler ≤2 w/o state change **MISS**; no LOOP STOP / no 5+ streak **PASS**; no full-pay same-giver farm **PASS**; zero-pay fight wins **0**.

OpenRouter: no balance or $ cost figure in logs or run meta (`costUsd` null; teacher `deepseek/deepseek-v4.1-flash`).

**Verdict: MISS** — offs: L2→L3 **39 / 12 / 44 / 27** (want 15–25); fight-share avg **6.3%** (want 15–30%; Seek Fight 0); quest-share avg **83.4%** (want ≤80% tol.); filler same-state max **3 / 5 / 4 / 7** (want ≤2).

**Next attempt (one line):** Prove `turnsSinceCombatReceipt` advances on the free path so Seek Fight actually offers (~every 8–12 turns) and harden offer-cap credit on every pad commit so same-scene Search/Read cannot exceed 2.

Plain summary also at `merge-logs/xp-design/open4/T50-report.md`.



### 2 Nov 2026 - LitRPG XP attempt 5 (wilds, world creatures, gathering, equip level, OPEN4 misses) (plan)

Branch xp/wildlife (from main c0616d7a, OPEN4 shipped as 2026-11-02c). Order: merge-logs/xp-design/open5-wildlife/XPD1-OPEN5-order.md. Results are appended by the runner after the T50 runs; this entry is the plan and the root causes found before the T50.

**Found - why Seek Fight / Hunt was never offered (OPEN4: 0 offers in 7301-7304).** Real finals loaded through the Fate chip path (committed fixtures src/__tests__/fixtures/xp-open4-chipstreams/): 7301 turnsSinceCombatReceipt 12, 7303 10, litrpg, opening complete, no pendingEncounter, no lastKill. The drought gate was true; two other gates dropped the chip downstream:
1. src/game/choicePipeline.ts `threatChoiceWithoutSetup` (line 254, called from liveChips at 370 and 862): "Look for a fight" matched `\b(fight|attack|...)\b` with no threat in the story prose, so it was dropped as an invented threat right after rankChoices injected it. Fix: Seek Fight and Hunt pads are engine chips, exempt (lines 263-264).
2. src/game/choiceCompiler.ts `compileChoices` journey early-return (line 641): on the road ("On the road between places", where 7301 and 7303 ended) it returned withJourneyPads(...) and never ran rankChoices, so neither Seek Fight nor Hunt could inject. Fix: run rankChoices on the journey pads, then the director chip policy.

**Found - why the OPEN4 filler cap of 2 did not hold (3 / 5 / 4 / 7).** src/game/choiceRanking.ts creditFillerOffers / fillerOfferExhausted counted offers per label (actionKey). The compiler rotates labels inside one family ("Read the signs of the report / rumor / proof", "Search the area / scene for signs", "Read <person>", "Analyze <person>"), so every new label had its own fresh count of 0. Replaying the four real streams: one search family was offered on 7-10 pads in a row at the same scene. Fix (one owner, no second copy): the budget is also keyed by family (`fam:<actionFamily>`, FILLER_OFFER_CAP 2, lines 252-312); reaching the cap blocks the whole family via fillerBlockedFamilies until the scene key changes (place / quest stage / fight / new NPC met / kit / level; never raw XP). Hunt, Gather, Seek Fight, Check System and the free-input chips are never filler budget.

**Will change (LitRPG engine; Story RPG gets Gather only; tabletop (dnd branch of rollLoot) and PYOA untouched):**
- Hunt pad "Hunt the wildlife nearby" every outdoor turn after the opening rite (engineMode litrpg only, stock permitting, not indoors, not in a dungeon, not in a fight). It takes the least useful slot (dead filler, then idle loiter, then a social chip); never the quest-progress chip, Travel or Check System. Seek Fight hands over to it when a wilds is in reach; Seek Fight stays the rescue chip.
- Gather pad "Gather herbs and resources nearby" where the region has resource nodes in stock (LitRPG + Story RPG). Typed "I look for ore", "gather some herbs", "I go mining" are never rejected. Trade XP only (Herbalism, Mining ride the named-skill record, settleSkillUse, soft cap 2L+3, WoW grey rule); 0 character XP. Guards still alive ambush with GUARD_AMBUSH_BASE 0.35 x share alive and open a normal Hunt fight; cleared guards open a 24 world-hour grace ("the area is quiet" once).
- Region level bands and creature tables (src/data/creatureTables.ts, src/game/regionLevels.ts), wilds stock and respawn (src/game/wilds.ts, 1 unit / 6 world hours, nodes 1 unit / 8 hours), creature-level drops with itemLevel, hides on every skinnable kill.
- WoW equip rule: itemLevel <= playerLevel + EQUIP_LEVEL_MARGIN (2), LitRPG + Story RPG only; one owner src/game/rules/equipLevel.ts (canEquipAtLevel / equipBlockReason); refusal is one STATUS line, no turn cost, input never rejected; unlevelled kit has no requirement; level-up names newly wearable bag items once (src/game/gearEquip.ts).

**WoW sources (public, read 2 Nov 2026; cited in xpPace.ts comments):** S1 Mob experience (warcraft.wiki.gg/wiki/Mob_experience): base (5M)+45, +5%/level above (cap +4, red pays as +4), 1-(P-M)/ZD below, ZD table, gray level, elite x2, con colours. S2 Experience point (gray table). S3 Experience to level (bar shape; read-only comparison, our bars are NOT changed). S4 Skinning (leather tier follows mob level; skill-up colours; 2011 hotfix: gray never ranks). S5 Mining 1-300 (Copper 1, Tin 65, Iron 125, Mithril 175, Thorium 250). S6 Herbalism (Peacebloom/Silverleaf 1 ... Sungrass 230).

**Kill XP:** killXp = sameLevelKill(P) x R(P,M) x (elite ? 2 : 1), R = [(45+5M)/(45+5P)] x diff; table creatures use their real level (levelSource 'table', no +/-3 clamp, no toughFoeScale stack); gray pays 0; per-event cap 60% of bar kept. Worked R: P2: M4 1.30, M6 1.64. P5: M3 0.51, M9 1.54. P10: M6 0.34, M14 1.45. P20: M16 0.55, M24 1.37. P30: M26 0.60, M34 1.32.

**Budgets and constants:** WILDS_HUNT_BAR_SHARE 0.30 (regular), WILDS_CHALLENGE_BAR_SHARE 0.15 (M >= P+3, elite or rare), then CONTENT_SCALE_FLOOR 5% floor; gray 0; loot and resources never capped. Worst case from hunting 0.45 of a level, reached only by beating things well above you; quests stay the main road (>= 50% under max farming). EQUIP_LEVEL_MARGIN 2. NODE respawn 8h, wilds respawn 6h, CLEAR_MINE_GRACE_HOURS 24, GATHER_TIER_UNLOCK_RANKS 1/11/21/29/38/48. This supersedes entry 8's q69 character-XP-per-gather idea (gathering pays trade XP only).

**Projected (same-level kill under our bars; xpPace, litrpg, skipEventCap):** L2 bar 187, kill 26 (7.2 kills/level, WoW 16); L5 363 / 32 (11.3, WoW 40); L10 1103 / 57 (19.4, WoW 80); L20 10257 / 393 (26.1, WoW 160); L30 95518 / 3662 (26.1, WoW 243). Regular cap per level: L2 56 XP, L5 108, L10 330. Challenge cap: L2 28, L5 54, L10 165. Never-hunts mix: reach (Seek Fight + Hunt chips actually shown) is what lifts fight share from 6.3% toward 15-25% and cuts quest share from 83.4% toward 60-75%; L2->L3 15-25 turns is a TARGET, not yet measured (T50 owed to the runner). Hunt-gather profile judged separately; quests stay >= 50% by the budgets.

Not done in this slice (still owed): Leatherworking craft pad, Brew at camp, gather-quest turn-ins, a road-meeting test for the Hunt the animal pad (pad is wired, LitRPG only), pace-model re-fit tests (mixes a-d), world-coverage tests for generated atlases, grep-level equip-only-reader test.