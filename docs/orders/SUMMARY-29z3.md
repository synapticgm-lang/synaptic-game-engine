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

ALL DONE
