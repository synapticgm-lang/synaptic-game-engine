# PYOA Dice Book: design bible (draft 1, 27-28 Oct 2026)

Working title: **THE TIDE THAT DID NOT RETURN**
Type: choice-plus-dice. Offline, engine-rolled, no AI at play time. About 1,000 sections.
Sister book of Umbra (pure choice). Structure learned from classic gamebooks; no text, names or plots borrowed.

## DECISION FOR JOHN (placeholder used in all drafts)
**2d6 or d20?**
- **2d6 (placeholder, used below).** Bell-curve: results cluster at 7, so stats matter and outcomes feel fair. Three tiers fall out naturally (6 or less / 7-9 / 10+), which gives "success with a cost" instead of pass/fail. It reads well on a phone ("you rolled 8").
- **d20.** Flat odds, more swingy, classic RPG feel. Tiers would be by margin (miss by 5+, near, hit). Easier to explain to D&D players, but more frustrating failures.
- The engine takes the dice from book metadata (`"dice": "2d6"`), so switching is a data change plus re-tuned target numbers. Nothing in the section text mentions the dice type.

## Premise
Three days ago the sea left the Wrack Coast. It did not ebb; it withdrew, like a held breath. The seabed (the **Low**) lies open from the cliffs of Gullmouth to the horizon: wrecks, drowned streets, whale bones, things that were never meant to see the sun. On the third night the drowned bell of old Saint Maren rings from somewhere out on the sand.

You are a **wrecker** of Gullmouth, a licensed scavenger of what the sea gives up. Your mentor, the lighthouse keeper Orsolya Venn, is missing. In her cold lamp room you find a sealed note: the **Meridian Gear**, the great mechanism the old Tidewardens built to command the sea, has jammed at the foot of the **Sunken Stair**. When the Gear is turned again, the tide returns, and whoever turns it decides *where the sea goes first*.

You have until the tide clock runs out. Everyone else wants the Gear too.

## Original setting (no overlap with Umbra's Veridia)
- **Tone:** salt-and-bone dark fantasy, wet, strange, melancholy, some humour in the people. Low magic: bargains, relics, omens. No guns.
- **Gullmouth:** cliff-town of wreckers and net-menders. Hub of Act I. Harbour dry, boats stranded on the sand. Rival crews, the Customs-Priest, the pawn-widow, the ferryman with no river.
- **The Low:** the open seabed. Wreck-fields, a stranded leviathan carcass used as a market, salt-flats that crust over sinkholes, tide-pool shrines, the Singing Dunes.
- **Saltspire:** a city on stilts built far out on the seabed by the wealthy Brineholders, who profit from the drought (they sell water). Rooftop-and-ladder city. Hub of Act III. Factions below.
- **The Sunken Stair:** a spiral shaft down to the Meridian Gear. Inhabited by the Hollow Choir and the last Tidewarden.
- **Factions:** the Brineholders (money, order), the Gullmouth Wrecker's Guild (your own people, rough loyalty), the Drift Pilgrims (believe the sea is a god in sulk), the Hollow Choir (drowned who never left), the Last Tidewarden (an automaton-archivist, bound by oaths).
- **Rule of the world:** nobody can cross the Low after dark safely; the tide-clock makes time a resource.

## Player sheet
**Stats** (add to the roll): MIGHT, WIT, NERVE, CRAFT. Start by assigning +2, +1, +1, 0 (a choice screen).
**Resources**
- VIGOR 0-10 (start 10). Hits 0: you are *Spent*: you black out and wake somewhere worse (a recovery section, never a hard stop, but it costs Tide and a Scar).
- TIDE 0-12 (clock). Rises with travel, rest, bad luck. At 12 the water is coming: the finale is forced and the odds worsen.
- SUPPLIES 0-6 (food and water). Spent on long travel and rest. At 0, each trek check is at -1.
- COIN (no cap).
- **Tags** (carried): items (Sea-glass Key, Orsolya's Lamp...), allies, Scars (lasting injuries/fears), Favours/Debts with factions, Marks (story state used for gating and endings).
**Flags/marks** use the same `when` conditions as Umbra, so the engine's condition code is shared.

## Check format (data)
A choice can carry a `check`:
```
{ "stat": "NERVE", "target": 8, "label": "Walk the crusted flats",
  "full": "<section id>", "mixed": "<section id>", "miss": "<section id>",
  "mods": [ { "when": {"tag":"Orsolya's Lamp"}, "plus": 1 } ] }
```
- Roll = 2d6 + stat + mods. **Full** at or above target + 2 (usually 10+), **mixed** at target to target+1 (7-9), **miss** below (6 or less). Standard target is 8 (so 7 = mixed).
- **Every miss section is a recovery section**: it costs something (Vigor, Tide, Supplies, a Scar, a Debt) but always has an exit back into the story, often into a side path that rejoins. No miss is a dead end. True death endings exist only where the story itself earns them.
- Some checks are "safe": the player may spend a Resource to bump a miss to mixed (once per section). This makes failure a decision.
- Opposed or combat-style scenes are chains of 2-3 checks with a shared Vigor cost, not a hit-point grind. Each combat chain has a talk or sneak alternative.

## Rolls that a reload cannot change
The engine rolls offline from a **save seed** created when the game begins. A roll is a pure function:
`roll = hash(seed, sectionId, exitIndex, visitCount[sectionId])` -> two dice.
- The save stores the seed and each section's visit count. Reloading at the same point gives **the same roll**.
- Going back to a section later is a new visit, so it gives a **new** roll (hubs stay playable).
- Dice faces are shown to the player (so it is a game, not a hidden number) and are logged in the run transcript.
- Because the roll only depends on stored state, there is no way to re-roll by reloading, backing out, or re-entering the check chip.

## Structure map (about 1,000 sections)
Pattern used in each region: **bottleneck, hub, 3-5 branch chains with checks, rejoin at the next bottleneck.** Bottleneck sections are mandatory scenes that every path passes through (they reset confusion and carry the story). Hubs let the player choose order and revisit. Branch chains end in rewards (items, Marks, allies) that unlock options later.

| Region | Sections | Role |
|---|---|---|
| 0. The Ebb | 40 | Prologue: lamp room, note, choose stats, first scavenge, first check taught. |
| 1. Gullmouth and the Wrack Coast | 160 | Act I hub. Rival crews, the guild, the pawn-widow, finding a clue to Orsolya. Pick an ally. |
| 2. The Low | 220 | Seabed trek. Wreck-fields, the leviathan market, the Singing Dunes, the Drift Pilgrims. Resource pressure. |
| 3. Saltspire | 220 | Stilt-city intrigue. Brineholders, a heist or a bargain, a route to the Stair. |
| 4. The Sunken Stair | 200 | Descent, the Hollow Choir, the last Tidewarden, a moral trial. |
| 5. The Turn of the Tide | 120 | Finale: the Gear, the final choices, forced when Tide hits 12. |
| Endings | 40 | 12 endings, each 2-4 sections (verdict, aftermath, coda). |

Each region has about 8-10 bottlenecks (a mandatory scene every ~25 sections), 2-3 hubs, and 12-18 branch chains. Hubs have 4-6 exits; branch chains are 3-6 sections long. Cross-region callbacks use Marks.

## Endings (12)
1. **Return the Sea Gently** (restore balance; best, hard to earn: needs the Tidewarden's trust and all three oaths).
2. **Drown Saltspire** (the sea returns on the Brineholders).
3. **Drown Gullmouth** (the sea returns on your own home; tragic, but earns the Pilgrims' crown).
4. **Keep the Gear** (you become the new Tidewarden, bound to the stair).
5. **Sell the Sea** (the Brineholders pay; you rule water).
6. **The Choir's Choir** (you join the drowned and the sea never returns).
7. **The Long Dry** (you break the Gear; the sea stays gone, a new desert world).
8. **Orsolya's Way** (you find the keeper alive and do it her way).
9. **The Wreckers' Tide** (your guild takes the Stair; a rough new order).
10. **Pilgrim King** (the sea-god answers you).
11. **Spent** (a poor ending if the tide forces the finale while you are broken; recoverable by reload to an earlier hub, not a game over).
12. **The Quiet Sand** (secret ending: you walk away, leaving the sea in sulk).

## Pacing and fairness rules (for authors and the generator)
1. Teach the check in the first 10 sections with a low-stakes roll and a clear cost.
2. A section is 80-220 words of prose plus 2-4 exits. Hubs and bottlenecks may be longer.
3. At most one check per section. At most two consecutive check sections.
4. Never gate the only way forward behind an item that can be missed. Every gated route has an ungated cousin that costs Tide or Supplies.
5. Every Mark must be set on at least one reachable path, read on at least one gate, and appear in at least one ending variant (same linter rule as Umbra).
6. A reader who fails every roll can still finish, with a poorer ending.

## Build pipeline
1. `scripts/pyoa/dice-skeleton.mjs` builds the graph deterministically: IDs, regions, kinds (hub, bottleneck, branch, check, recovery, ending), links and checks. No prose.
2. The skeleton linter proves: all sections reachable, every miss section has an onward path, every ending reachable, no non-ending dead ends, count 1,000.
3. Gemini (web) fills in prose in batches of 10-14 sections with the neighbourhood context, saved raw per batch and resumable. A second pass tightens style.
4. The merged book is linted again with the dice-aware linter (new work), then a bot plays 10k random seeded runs to measure the ending distribution and how often a player is Spent.
5. Engine work (separate Cursor job): `check` on exits, resources and tags, `visitCount`, seeded roll, result panel. Not started: waits on the 2d6 vs d20 decision and on John approving the format above.
