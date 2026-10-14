# tt-fix-10 — report

Order: `docs/orders/tt-fix-10-order.md`. Read first: `mode-tt-lap-13.md`, `tt-fix-9.md`, `CURSOR-STANDING-BRIEF.md`. Standing rule: root causes only, no patches, no exceptions added. Every deletion is in `docs/orders/tt-cut-log.md` under **tt-fix-10** (restore from `6869ec1b`).

## Items

### 1. turnCheck repeated-phrase check flagged normal writing

- **Cause:** `fiveGrams` read the whole beat, quoted speech included, and kept any five-word run with two 4+ letter words. That made a grammar frame ("and stopped in front of", lap 13 A T16) and a person saying their own words again (Agna, D T16) count as the narrator's habit.
- **Fix:** `src/game/turnCheck.ts:582-583` reads narration only (`narrationOf`), and a run counts only when three of its five words are content-length. No allow-list. The check is still used at `turnCheck.ts:673` (`repeated-habit`).

### 2. factCheck missed invented lone travellers and flagged "axe" for a greataxe

- **Cause:** a person word counted only when a listed verb followed it (`PERSON_ACTS`), so "a lone traveller on the road" was never checked. Who was handed was read from all handed text, including the packet's "Unnamed local who may be about: a traveler" line. An item matched only a whole handed word, so "axe" never matched "greataxe".
- **Fix:**
  - `scripts/factCheck.mjs:193` adds `peopleText`, read from the engine's records of who is here: HERE block, person and companion refs, `presentNames`, the engine result and receipts.
  - `factCheck.mjs:194` adds `itemWords`, read from the item records: inventory, gear, and non-person, non-place refs.
  - `factCheck.mjs:204` `inHanded` checks people against `peopleText`, and an item against any item record ending in the word.
  - `factCheck.mjs:429-431`: a person word referring back to someone here ("the/that/your …") or inside a comparison is not a new person.
  - `PERSON_ACTS` and the `'fence'` PEOPLE entry are deleted.
- **Verified on lap 13:** A T9 "traveller" is now flagged, and F T19 "axe" is no longer flagged.

### 3. The skirt chip attacked without a skirt roll

- **Cause:** in `resolveEngineFight`, a waiting director spawn (`pendingEncounter`) was resolved before the road meeting's own move. The chip's failure-cost tail ("…but fail and they attack") also matched the attack test on the raw input.
- **Fix:** `src/game/engineFight.ts:193` reads the road meeting's move first. `engineFight.ts:205` tests the chip's base (`meetingMoveBase`) rather than the raw input, so "Skirt around the camp" rolls the slip.

### 4. Engine errors: unanswered talk, plea left open, foe stays after escape, escort ticks without Silas

**Shared cause:** each record's terminal commit settled only one of the outcomes it offers. A meeting was settled only by Help or a fight; a foe's presence only by victory; a with-person step only at its own pin, with nobody moved; a talk answer only when exactly one speaker was declared.

**Fix at one point:** each record's own commit now settles every outcome it offers.

| Record | Fix |
|---|---|
| Meeting | `src/game/travelJourney.ts:413` `answersMeeting`, called at `travelJourney.ts:1694`. The go-by chip ("Pass them by", "Skirt around", "Give the lair a wide berth") settles a no-fight meeting as passed by; the receipt reads `; passed by …` (`:936`). |
| Fight | `src/game/encounterTerminalFsm.ts:297` `settleFoePresence`, called at `:355`. Escape and victory both drop the foe from `present`; `lastKill` is set only on victory. |
| Escort step | `src/game/tabletopQuestProgress.ts:62`: an escorted person starts where the quest starts. `:132`: a move step goes to its own anchor. `:208` `takeAlong`, called at `:236`: the escorted person goes with the player. |
| Talk | `src/game/tokenProse.ts:199-200` `parseTokenBeat`: the person the player addressed owns an untagged speech line when two speakers are declared (lap 13 B T7). Callers pass the action at `:713` and `:1285`. |

### 5. The cursed-keep quests never led into the keep

- **Cause:** every cursed-keep spine had two steps anchored at its village pin, so no quest step was ever taken at, or inside, Keep Gate.
- **Fix:**
  - `src/data/quests/tabletopMainSpines.ts:64` adds `site`. All four cursed-keep spines get `site.place 'Keep Gate'`, and `:671-682` anchors the follow-on step there and adds a last step with `room: 'inside'`.
  - `src/game/choiceRanking.ts:383`: the story chip's trip goes to where the open step is taken ("Travel toward Keep Gate").
  - At the gate, the existing `objectiveOpensInterior` path opens the keep when the inside step's chip is taken, so a dungeon fight happens in normal play.
  - The pinned tt-fix-5 rule ("no step chip outside the gate") is kept.

## ruleCount (`node scripts/ruleCount.mjs`)

| | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|
| before | 8618 | 865 | 90 | 23 (292) | 1049 |
| after | 8566 | 865 | 90 | 22 (286) | 1048 |

No total rose. The new code was offset only by deleting dead code, all logged in `tt-cut-log.md`:

- `isThornferryCluster`
- `formatOutdoorHubsForPrompt` (its only caller, `situationPacket`, is reachable from nothing)
- `attachCompletedEvent`
- `formatTokenRepairFacing`, `missingFns` and the unread `needsRepair` / `alreadyRepaired`
- `PERSON_ACTS`

## Tests

- **New:** `src/game/ttFix10.test.ts`, with 12 tests and one block per item. Item 2 runs factCheck on the lap 13 runs.
- **Pinned tests updated to the new rule:**
  - `ttFix4.test.ts`: a spine starts at its pin and, with a site, leads into it.
  - `s82RootATerminalFight.test.ts` and `playtest02gBatch02g.test.ts`: dropped uses of the deleted dead helpers.

| Gate | Result | Limit |
|---|---|---|
| vitest | 77 failing | baseline 77 |
| replay bank | 64 failing | ≤64 |
| tsc | 552 | ≤552 |
| build | green | green |

- **vitest:** the only "new" name is the known flake `playtest30iFogOfWar`, and one baseline failure (`playtest27aRepair1` S3) now passes.
- **Fix runs: 2.**
  - Run 1 found three pinned-rule conflicts, one bank failure (s75) and two tsc errors in the new test.
  - Run 2 was clean.

## Ship

- **Commit:** `ba5487e7`, pushed to `main`. It does not include `humanJudge.mjs` or any `.tmp` files.
- **Stamp:** `2026-10-14v` (after live `2026-10-14u`).
- **Edge:** `node scripts/sync-gm-edge-shared.mjs --check` reports that edge copies match. Changed edge files are `completedEventPacket`, `encounterTerminalFsm`, `outdoorHubs` and `situationPacket`. `npx supabase functions deploy gm-turn` reported "Deployed Functions", and the `gm-turn` OPTIONS check returns 200 (boots).
- **Live:** `https://www.synapticgm.com/version.json` returns `{"hud":"2026-10-14v","build":"2026-10-14v"}`.
- No laps run.

**Leftover, not changed:** the packet line "Unnamed local who may be about: a traveler" (`writerInfoLayer.ts`, via `closedScenePerson.storyMinorRoles`) still offers the writer a role that is not present. factCheck now catches the invented traveller it leads to.

TT_DONE
