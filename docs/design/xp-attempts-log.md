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
(Appended after the T50 runs. Empty until then.)

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

