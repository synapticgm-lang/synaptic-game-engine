# ORDER 29u travel between places

Chip-only play must still read as a journey. Right now an exit can stitch "You leave X behind and reach Y" (outdoorHubs.ts) and the next paragraph is already there. The LitRPG 100-turn run (seed 62, summoned-pact) left the grain-ship hold and was in Lowmarket with no road, then later left Lowmarket and opened back in the hold.

The map already has space between towns, villages, and other places. Use that. Do not add a second map. Do not hardcode story names, Elara, or place names from a bible. The writer names people and fills the prose. The code does not write story sentences.

When the player takes an exit from one outdoor place to another:
- Do not arrive in the same turn if the map distance is more than a step.
- Put the ground between them on the map as the place they are now: a path, road, or the terrain that actually sits there.
- Time passes by a real amount tied to that distance (hours, or a part of the day). Show it. A short step is a short time. A forest or a gap between towns is longer.
- That ground has its own chips. Walking on, talking to someone met on the path, and dealing with what lives there. A forest has animals. A road has travelers. A chip-only player can cross it by pressing options. They are not dropped at the far gate.
- The writer narrates those turns. Remove the leave-and-reach stitch as the whole journey. No canned travel paragraph.

Tests: a mapped gap is not one stitch. Time moves. The in-between place has a chip that is not "arrive". A forest gap can offer an animal. Gates: tsc 601 same set, vitest no new failure names (128 baseline), build exit 0. If you change a file the edge function copies, sync it and deploy gm-turn. Otherwise do not deploy. No T10 and no T100.

Stamp 2026-09-29u1. Commit and push only the named files. Write docs/orders/SUMMARY-29u.md and end with ALL DONE or STOPPED.

# ADDENDUM (John, same order)

Encounters on the ground between places must fit that ground, not one generic event.

- Forest, wilds, marsh: wildlife.
- Road: travelers, a random meeting, thugs.
- Near a ruin, graveyard, crypt, or old battlefield: undead.
- A camp can sit on a road or at the edge of wilds.
- A villain or a monster only where that area would actually have one. A village path does not spawn a dragon. A high-level wild does not spawn a harmless rabbit as the only threat.
- Level of the encounter follows the area level, same rule as treasure.
- The writer names them. The code picks the kind from the terrain and the area, and offers it as a chip. No canned prose. No hardcoded story names.
