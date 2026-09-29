# ORDER 29w chance encounters on the road

29u is done (travelJourney.ts). Do not redo it. A trip already puts HERE on the ground, moves worldHour, and offers Walk on, Turn back, a talk chip, and a "what lives here" chip on every stretch. That last pair is always there. John wants a chance, not a guaranteed meeting.

Each stretch rolls once.
- Sometimes only Walk on and Turn back. The walk and the time are the turn.
- Sometimes one chance encounter, of a kind that fits that ground:
  - forest, wilds, marsh: wildlife
  - road: a traveler, a random meeting, or thugs
  - ruin, graveyard, crypt, old battlefield: undead
  - a camp may sit on a road or at the edge of wilds
  - a villain or a monster only where that area would have one. A village path does not spawn a dragon. A high wild does not spawn only a harmless rabbit.
- The encounter's level follows the area level, same rule as treasure.
- Not every step. Not so rare that a long journey never meets one.
- The player deals with it by chips, then the road continues.
- The writer names them. No canned prose. No hardcoded story names.

Tests: one stretch can have no encounter. A forest chance is wildlife, not town thugs. A ruin chance can be undead. The level follows the area. Gates: tsc 601 same set, vitest no new failure names (128), build exit 0. Deploy gm-turn only if an edge file changed. No T10, no T100.

Stamp 2026-09-29w1. Commit and push only the named files. Write docs/orders/SUMMARY-29w.md and end with ALL DONE or STOPPED.

# ADDENDUM (John, same order)

Chance encounters also include rare spawns. A rare spawn is uncommon, not every stretch. Its loot is slightly better than a normal encounter of the same area level. It still scales to the area. Do not drop endgame loot on a low-level path.

A camp can hold a mini-boss. The mini-boss is a real fight, harder than the ordinary encounter on that ground, still scaled to the area level. Beating it is a challenge, not a one-line win. The writer names the rare spawn and the mini-boss. No canned prose. No hardcoded story names.
