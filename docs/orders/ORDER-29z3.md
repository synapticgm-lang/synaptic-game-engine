# ORDER 29z3 fix prose and make the tester catch it

We wasted time. Seed 64 was treated as a pass from scores. A full prose read then found choices that did not follow the prior line, prose that did not do the action, and stiff or broken lines. Fix the pipeline. Then make the tester fail those turns. Do not patch one story. Do not name Jax, Wayfort, or a ruin.

## Prose must follow the player

The player directs the main character. The next turn must carry out that action. Do not restate the arrival. Do not answer a different action. Do not invent a person who was not in the scene. Do not leave a Press the attack turn with no blow. Do not leave a Travel turn with no leave. Fix this in the writer facts and the turn pipeline, not with a word-block list.

Language must sound like a person telling the story. "The horizon is empty of people" is the kind of line to avoid. Prefer a natural line. Fix the third-person slip that puts "your clothes" into a Jax line. Fix broken fragments such as a missing name ("The stepped…") and mangled clauses ("Jax didn't know crossed their path").

Chips must match who is present and what the scene allows. No talk chip when nobody is there. No interior upper floor or basement on open ground unless a basement was established.

## House samples, not a blank rectangle

The game already ships house samples: placeTemplates INSIDE_TEMPLATES / VEHICLE_TEMPLATES, and mapEngine SHED_LAYOUTS / RUIN_LAYOUTS / GRAND_LAYOUTS, used by interiorGenerator.ts. A house interior must pick one of those building samples that fits the place. Do not fall back to a blank rectangle or a procedural void when a house sample exists.

A house plan must have:
- an exterior door so you can leave
- windows where a house would have them (or the layout mark for them)
- stairs or a ladder between floors when B1 / 1F / 2F exist
- rooms that share walls; doors on shared edges; no floating boxes with room-sized gaps

Live play showed rooms as islands in a void, thick walls the size of rooms, B1/1F/2F on a stone outline with no walls, and no clear way out. Fail / thumbs-down that. Constrain the existing generator and the floor-plan draw. Do not invent a new map generator. If the place is only a foundation / open ground, do not open a multi-floor interior at all unless a basement was established.

## Tester must catch it

Hook into fate-autoplay and autoThumbs. A failure is a P0 and a thumbs-down, so the writer can learn.

Fail / thumbs-down when:
1. The chosen chip does not follow from the prior prose.
2. The prose does not carry out the player's last action.
3. Stiff, abstract, or broken language.
4. A talk chip when no person is present, or an impossible chip.
5. Interior / upper floor / basement on open ground with no building, or a floor plan that is a blank rectangle / floating rooms / no exit door / multi-floor with no stairs.
6. A quest that names a place the scene never established (hidden basement only if established).

Use docs/orders/PROSE-MARKS-s64.md and docs/orders/PLAYER-WANTS-CHECK.md. No banned-phrase list. No regex of story names.

## Gates

Stamp 2026-09-29z3 the same way as 2026-09-29z1. Commit and push to main. No T10 or T100 yet. No edge deploy unless an edge file changes. tsc stays at 601. Vitest adds no new failure names. Build exits 0.

Write docs/orders/SUMMARY-29z3.md. End ALL DONE or STOPPED. Name the commit, the stamp, and which checks now fail.

## Map quality bar (WoW-style, from John's samples)

Interiors must read like a real place map, not a flowchart of boxes. Bar from the attached examples: rooms and corridors share walls; exits and stairs are obvious; a house has a door out and windows; a cave can be organic; a cathedral has a real footprint (nave, chambers), not a blank rectangle. Prefer the existing SHED / RUIN / GRAND / INSIDE samples and dungeon layouts. Fail / thumbs-down floating rooms, room-sized wall gaps, or multi-floor with no stairs. Constrain draw and layout. Do not invent a new art pipeline in this pass.


## Resident Evil house plans (added)

Houses and mansions must read like Resident Evil building maps: packed rooms, corridors, doors on walls, stairs between floors, a real footprint you could walk. Not floating boxes. Prefer SHED / GRAND / INSIDE house samples for buildings. Fail / thumbs-down a house that lacks an exit door, stairs across floors, or packed shared walls.

## Also in this update

- People remember the main character from their info sheet. The writer must use that sheet. Thumbs-down / P0 if a person who has a sheet acts as if they never met the player.
- Fallout-style skill gates. A door or a safe that needs a skill stays shut until the character has it. A level-up must change something the player can do (a new option, a door, a safe, a tool), not only raise a number. Use skills the game already has. Do not invent a new skill tree. Fail / thumbs-down a level-up that changes nothing you can do, or a locked door/safe that opens with no skill.
