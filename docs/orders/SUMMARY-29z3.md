# SUMMARY 29z3 — fix prose and make the tester catch it

Commit: `ab16818` (code + stamp) on `main`, pushed with this summary.
Stamp: `2026-09-29z3` (HUD, `index.html`, `public/version.json`, `runManifest`, stamp tests).
No playtest, no T10 / T100. No edge file changed, so no edge deploy.

## House plans (Resident Evil bar) and caves (WoW bar)

- New `floorPlan.ts`: rooms are packed onto shared walls on each floor (small gaps closed, no overlaps), doors sit on shared walls, an exterior door on the entry room, windows on outside walls, and a `floorPlanIssues` check (blank plan, overlap, floating room, room-sized gap, door off a wall, no window, no exit door, floor with no stairs).
- Existing samples kept (no new generator): fixed the gaps in the SHED / RUIN / GRAND layouts and the INSIDE / VEHICLE templates. Every sample now passes the check after packing, and built plans pass across seeds.
- Roofless places (foundation, outline, shell, husk, burnt-out, rubble) stay on one floor unless a basement is in the scene. Saved plans that fail the check, or have floors they should not, get rebuilt on Map open.
- Map draw: buildings show solid packed rooms, thick outside walls, windows, a front door marked OUT, and stair treads. Caves and dungeons draw as rounded chambers joined by tunnels.

## Prose follows the player

- Writer facts now include an ACTION line: carry out the PLAYER line, do not retell the arrival, do not answer a different action. An attack in a live fight must show the blow. Plain speech. A road meeting on this stretch must appear in the prose before a chip can meet it.
- Root causes from the seed-64 read, fixed in the pipeline, not with word lists:
  - "Name the tracked": slot glue turned `the <Name> <verb>` into "the <verb>". It now leaves plain verbs and longer held names alone.
  - "The stepped…": the claim-grounding scrub did not know the names the code paints from the ref list. It now grounds against them.
  - Token lines that point at a ref the ledger cannot paint are dropped, not painted blank.
  - Earlier in this batch: third-person "your" slip (kit display, PC possessive), crowd phrasing, `'s` key strip, and time-skip scrub narrowing.
- The chip pad now runs through `legalChips`: no talk chip with nobody there, no chip for a dead or absent person, no fight chip without a fight, no upper floor or basement on open ground, no travel chip that cannot move.

## Tester (fate-autoplay + autoThumbs)

Each of these is a P0 and a thumbs-down, and it feeds writer lessons:
1. The chosen chip does not follow the prose before it (a road-meeting chip with nobody on the page).
2. The prose does not carry out the action: named talk not answered, arrival restated, attack with no blow, travel that never left.
3. Broken language: missing-name fragments, stacked determiners, mangled clauses, third-person "your" slip. Stiff lines from the judge pass are now P0 too.
4. Ghost, impossible, or unrelated chips.
5. An interior, upper floor or basement on open ground, or a drawn floor plan with any `floorPlanIssues` result (reported the turn it appears).
6. A quest naming a place the scene never set up.

Also fixed a false P0 from 29z2: a plain "Wait" was being judged as talk.

## Checks

- tsc (`tsconfig.app.json`): 601 errors, same as before.
- vitest: 128 failures, the same names as `docs/orders/vitest.json`. No new failure names. New file `playtest29z3HousePlansProse.test.ts` (32 tests) passes.
- build: exits 0.

Checks that still fail: the same 128 baseline vitest failures and the same 601 tsc errors. Nothing new.

Leftover: the edge copies under `supabase/functions/_shared/gm/` were not synced (the order says no edge deploy unless an edge file changes). Hosted `gm-turn` still sends the client-built packet, so the new writer facts reach the writer from the client.

## Also in this update: info-sheet memory and skill gates

Commit: `8f34b5a` on `main`, pushed. Same stamp `2026-09-29z3` (no restamp). No playtest, no T10 / T100. No edge file changed, so no edge deploy.

### People remember the player from their info sheet

- Each person's info sheet (their `NpcMemory` record) now becomes a writer line when they are here: how many times they have met the player, the name they know the player by, the last things they remember, and "greet them as someone you know: no introducing yourself again, no asking the name again."
- The line goes into both writer paths: the Token Prose event packet (`INFO SHEETS`) and the info layer in the system prompt.
- Tester P0 + thumbs-down `sheet-forgotten`: someone whose sheet says they met the player introduces themselves again, asks the name they already know, or says they have never met. The check uses the sheet, not a list of names or phrases. It also goes into writer lessons.

### Fallout-style skill gates on doors and safes

- Uses the existing check skills (Athletics, Thievery, Arcana; no new skill tree). A character's rank is a granted rank if there is one, otherwise the old level-based bonus, so checks read the same until a rank is granted.
- Seeded dungeons: better chests become safes (Thievery 1 or 2; consoles need Arcana 1), and some dead-end side rooms get a stuck door (Athletics 1). The entry, the boss room and the way through are never locked. Card dungeons: the cache chest needs Thievery 1.
- A lock without the rank stays shut everywhere it can open: map moves, "Open / Pick the lock" lines, the next-room step, GM item-gain from that safe, and chips (a chip that opens a lock you can't open is an impossible chip). The receipt says what is needed, e.g. "needs Thievery 1 (you have 0); it stays shut." The writer is told which locks stay shut.
- Every level gained grants one rank. It goes to the skill of the last lock the player tried, else the lowest lock seen, else a set rotation. The receipt says what the player can now do and names any lock that is now in reach. Live play (`useGame`) and fate-autoplay both do this.
- Tester P0s + thumbs-down: `levelup-no-change` (a level-up that adds no rank, lock or option) and `lock-without-skill` (a safe or locked door opened this turn without the rank).

### Checks

- tsc (`tsconfig.app.json`): 601 errors, same as before.
- vitest: 128 failures, the same names as `docs/orders/vitest.json`. No new failure names. New file `playtest29z3SheetSkillGates.test.ts` (12 tests) passes.
- build: exits 0.

Checks that still fail: the same 128 baseline vitest failures and the same 601 tsc errors. Nothing new.

Leftover: skill ranks are only granted on level-up (no trainers or skill books). Locks exist only inside dungeons and interiors, not on street maps.

ALL DONE
