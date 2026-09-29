# SUMMARY 29z2 — prose follows the player

Commit `e5fe1cf` on main, local only (not pushed). Stamp **2026-09-29z2** (HUD, `index.html`, `public/version.json`, `runManifest`, stamp tests), the same way 2026-09-29z1 was stamped. No edge file changed, so the edge function was not deployed. No playtest, T10 or T100 was started. The writer and the live game are unchanged. This is tester-side only.

## Where it hooks in

- **New `src/game/turnCheck.ts`** runs once per turn in the fate-autoplay loop, next to the 29z1 `turnProgress`. It reads the state at the start of the turn, the state at the end, the chips that were offered, the player's action and the committed prose. It writes `turnCheck` onto the `turns.jsonl` row with three parts: `p0` (the turn fails), `down` (a thumbs-down that does not fail the turn) and `presentNames` (who was here at the start of the turn).
- **Run summary.** Row P0s are added to the existing `readabilityGate` in `summary.json` as `turn-<kind>` violations. They raise `p0Count` and set `pass` to false. So the P0 count the T100 orders already report now includes these.
- **`autoThumbs.mjs`** reads the row check. Every P0 becomes a thumbs-down and is listed under a new "P0 (turn fails)" section of `report.md`, and `thumbs.json` carries a `p0Count`. Older runs without the row check still score as before (checked on a copy of the seed-65 cursed-keep run).

## What fails the turn (P0)

The check uses who is present, the chip and the last action. It does not name any character or place.

- **A chip talks to someone who is not there.** The named person in "Talk to / Ask / Tell / Greet X" must be among the people present at the start of the turn. That list covers people in the scene, people remembered as present, companions, the live or pending foe, the opening cast (until the opening is complete) and unnamed roles. An unnamed ask ("Ask what they want") fails when nobody is here and there is no crowd.
- **A chip offers an action the scene made impossible:**
  - talking to the last kill;
  - "Press the attack", "Try to flee" or "Parley" with no fight;
  - looting a body that is not here;
  - travelling while the fight blocks travel.
- **The prose ignores the player's last action:**
  - A talk to a named person gets no line from them and never mentions them.
  - An unnamed talk gets no spoken line. This reuses the existing intent-contract talk check.
  - A committed travel never names where the player went.
  - Most of the beat (60% or more of its sentences) restates an earlier beat, such as the arrival, instead of doing the action. This is skipped for look, wait and travel.
- **An interior, upper floor or basement is drawn for open ground.** The check uses the same map the Map screen draws. Open ground means:
  - the camera is locked outdoors;
  - the scene is marked outdoor;
  - the player is on a road; or
  - the place is an outdoor hub that is not an interior.

  If a basement, cellar, crypt or trapdoor is in the scene, only a cellar floor is allowed. The flag fires once, when the problem first appears, not on every turn after.
- **A quest names a place the scene never established.** This checks quests that were revealed, or whose place or next step changed, this turn. Their place, and any place named in the quest's visible text, must already be one of these:
  - a world-map place or a known place;
  - a hub of this bible;
  - the current place, the previous place, or either end of the road;
  - a place mentioned in earlier prose.

## Stiff prose (thumbs-down)

- There is no list of banned words or phrases. Code only flags broken sentence shape as `broken-line`: a doubled word, an unclosed quote, a sentence that ends on "the", "a" or "of", or a sentence that starts lowercase after a full stop. A plain line such as "The horizon is empty of people." passes the code on purpose, and a test pins that.
- Stiff and abstract lines are judged by the model pass (`autoThumbs --notes`, Gemini 2.5 Pro by default). The old pass only looked at 15 turns that were otherwise unclear. The new pass reads every turn, in batches of 20, up to 300 turns. For each turn it gets the action, who is here, the chips and the prose. The rubric gives the John example: "The horizon is empty of people" is stiff, "Not a soul in sight" is the kind of line to write. The judge returns:
  - `followed=false` when the prose ignored the action, which counts as a P0;
  - up to 3 stiff, abstract or broken lines per turn, quoted exactly (quotes not found in the prose are dropped), each with a plainer rewrite.
- **For the writer to learn from:** every flagged line goes to `<runDir>/writer-lessons.jsonl` as `{turn, action, line, better, why}`, including code broken lines. The live writer prompt is not changed.
- `--notes` is still opt-in, and `run.ts` does not pass it. Without `--notes`, runs get the code P0s and broken lines, but no stiff-line judgment. That keeps the T100 "do not pass --notes" orders free of model cost.

## Tests and gates

- New test file `playtest29z2ProseFollowsPlayer.test.ts` (11 tests) covers:
  - reading a chip's addressee;
  - a ghost chip with nobody present, and the same chip passing when the person is present;
  - dead-target, no-fight and no-body chips;
  - a named talk left unanswered versus answered;
  - a restated arrival versus a real search;
  - a travel that never says where the player went;
  - an interior plan on open ground: flagged once, and the cellar allowed when a trapdoor is in the scene;
  - an unknown quest place versus a hub, or a place already said in prose;
  - broken shape flagged, while a stiff but well-formed line is left to the judge;
  - `autoThumbs` turning a row P0 into a thumbs-down, a report count and a lesson.
- The stamp tests were moved to 2026-09-29z2.
- tsc on `tsconfig.app.json`: 601 errors (unchanged).
- Vitest: 128 failures, no new failure names compared with `docs/orders/vitest.json` (1858 passed).
- `npm run build`: exit 0.

## Leftovers

- The P0 rules are code rules with no model involved. They favour missing a problem over a false fail, so a synonym ("box" for "crate") only gives a thumbs-down (`action-object-missing`), never a P0. They have not yet been measured on a live run, because the order said no playtest.
- The stiff-line judge only runs with `--notes` and a key.

ALL DONE
