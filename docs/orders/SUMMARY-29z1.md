# SUMMARY 29z1 — achievement scale and circling

Commit `686e420` on main (code, tests, stamp). This summary is a follow-up commit. Stamp **2026-09-29z1** (HUD, `index.html`, `public/version.json`, `runManifest`, stamp tests), the same way 2026-09-29y1 was stamped. No edge file changed, so the edge function was not deployed. No T10 or T100 was started. PYOA was not edited.

## What each mode pays

All deed pay goes through `milestoneXp` (new `deedXp` in `xpRules.ts` picks the kind by mode). Each deed has one award key, so it never pays twice. The writer awards nothing. Hardcore scale and the 6-level 5 percent cut still apply (they run inside `milestoneXp`).

| Deed (engine-seen) | Key | LitRPG | Tabletop (D&D) | Story RPG |
|---|---|---|---|---|
| First kill | `achv:first-kill` | 25 XP (significant-place amount) | half the level Low budget (level 1 = 25) | 0 XP + one grade-1 item |
| 3 fights won | `achv:fights-won-3` | 50 XP (quest-step amount) | half Low (level 1 = 25) | 0 XP |
| 10 fights won | `achv:fights-won-10` | 100 XP (quest-complete amount) + one grade-1 item | half Low (level 1 = 25) | 0 XP |

- LitRPG First Steps (`achv:first-steps`, 75) is unchanged and still once. No other 75 was added. The flat-table `achievement` stays 75, and D&D `achievement` stays 0.
- Tabletop deeds never grant a level and never use the flat 75. The new `deed` kind pays `floor(Low / 2)` for the player's level.
- Story RPG deeds never pay XP, so they cannot level RPG mode. There is no barter system to hook. Weapon familiarity exists, but the order preferred a better tool, so RPG gets a better tool: one grade-1 item, once, on the first kill.
- The item is rolled the same way a finished settlement card rolls its item: the grade-1 chest roll at the local area level, seeded, up to 12 tries. If the player owns a weapon (equipped first), the roll prefers a better-rarity item of the same kind, then the same kind, then the first roll. There is no new loot currency.
- The fight count uses paid `encounter:<id>:<turn>` award keys, one per fight. `engineFight` writes two ids on the same turn, so the count goes by turn. It counts fights won or talked down (a parley that resolves the fight counts), because those are the fights the engine already pays for. A first kill is a victory this turn, `sceneFacts.lastKill` with outcome victory, or a victory receipt.

## Deed examples with nothing to hook

- **Survived the opening:** the engine has no such flag, so it is not paid. `openingEstablishment.complete` only means the setup covers are done.
- **Chop, plank, barter:** there is no woodcutting, crafting or barter action or count, so none were invented. There is no forestry or crafting simulation.
- **RPG barter or skill bump:** there is no barter system. Weapon familiarity exists, but a better tool was chosen instead of a familiarity bump.

## Circling

1. **One progress meaning.** `turnProgress(before, after, receipts)` in `choiceRanking.ts` counts any of: an XP or level change, loot gained, a quest change, a progress receipt (fight won, parley success, dungeon find, and so on), a move that is not a bounce, or a committed social change. A social change is a new person remembered, a new fact or topic on a memory, a met / disposition / relationship change, a topic commit, a social milestone, or a change in NPC relationships. A new chip label is not progress. All three users now share this meaning:
   - `recordCirclingTurn` takes the turn-start state (live `useGame` and the harness).
   - `creditCommittedProgress` runs after the writer's facts are committed. A talk whose fact lands after circling recorded the turn still resets the stuck count and clears the "tried with nothing" memory.
   - The harness loop stop reads `turnProgress` for each turn and writes `progress` / `progressReasons` on the `turns.jsonl` row. The "no new chip" check is gone.
   - `autoThumbs.mjs` counts no-progress turns from that row flag. Older runs without the flag keep the old count.
2. **The auto player stays on talk.** It only leaves a talk when that same ask was already tried at this place and nothing new came of it. Having met the person is not enough (the old met-NPC rule was removed). A run of look picks does not replace a talk pick. The "Look for a fight" chip is not added when standing still while an unanswered talk is on offer. A human tap is never rewritten.
3. **Bounce.** A move counts only when the place, or the far end of the road being walked, is not among the last few places. Going between two places, road included, with no other change is no movement.
4. **Writer fact.** On a talk, ask or offer turn with no move, the "No move this turn" fact adds: "A talk, ask or offer with no move is valid play: answer it in dialogue here and do not travel." No regex runs over the prose and there is no word-block filter. The stuck nudge does not fire on a talk turn that committed a new fact, because that turn counts as progress.

## Tests and gates

- New `playtest29z1AchievementCircling.test.ts` covers:
  - mode pay (LitRPG 25/50/100 plus one item only on the 100 step, with a better-weapon preference; tabletop 25 per deed at level 1, plus the hardcore and over-level cases; RPG 0 XP with one item once), and keys not paying twice;
  - the bounce, including the road and five bounce turns;
  - a real talk counting as progress while a new chip alone does not, with no nudge fired;
  - a late writer fact being credited;
  - the auto player staying on an unanswered talk;
  - the talk writer fact.
- Existing tests updated for intended behaviour:
  - 28a D&D first victory now also shows the first-kill deed (75 = 50 + 25).
  - 29x "heard talk" now means the same ask was tried, not that the person was met.
  - 29y opening-cast test now builds both states from one initial state. Its random seed picked a different opening card per call, so it flaked at HEAD too.
- tsc on `tsconfig.app.json`: 601 errors (unchanged).
- Vitest: 128 failures, no new failure names compared with `docs/orders/vitest.json`.
- `npm run build`: exit 0.

ALL DONE
