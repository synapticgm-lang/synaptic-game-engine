# PYOA 2d6 dice rules (v1)

Used by every PYOA dice book (book 1 "The Tide That Did Not Return" and the later dice books). Classic gamebook feel: a few numbers, one roll, no tables. The engine rolls; the text never mentions dice, numbers or stats.

## The player sheet
- **Four stats**, named by the book (book 1: MIGHT, WIT, NERVE, CRAFT). At the start the reader assigns +2, +1, +1, 0 to them.
- **STAMINA** 10 (max 10). Your health and nerve.
- **LUCK** 3 (max 5). A spendable push (see below).
- **Keepsakes**: the item, ally or secret named by a reward section (`grant`). They are shown to the reader and used by the story. In v1 they carry no number.
- **Flags**: story state, same system as the pick books: a section exit may carry `setFlags`, an exit may carry `when`. Conditions use the shared `pyoaCond` format (`{ "flag": true }`, `{ "not": {...} }`, `{ "any": [...] }`).

## A skill test
1. The engine rolls **2d6** and adds the stat the section names. Result = total.
2. Compare with the section's **target** (7 easy, 8 standard, 9 hard, 10 desperate; never outside 7 to 10).
   - **Full success**: total is target + 2 or more.
   - **Mixed success** (you get through, at a cost): total is target or target + 1.
   - **Miss**: total is below target.
3. **Double six** is always a full success. **Double one** is always a miss.
4. **Luck push**: after seeing the roll the reader may spend 1 LUCK to move the outcome up one step (miss to mixed, mixed to full). Once per test.
5. **Spent**: at 0 STAMINA every test is at -2 until the reader has regained at least 1. STAMINA never goes below 0. Nobody dies from a roll.

Odds for a typical test (stat +1, target 8): full 28 percent, mixed 31 percent, miss 42 percent; a +2 stat at target 7 is full 58 percent, mixed 25 percent, miss 17 percent (before the double-six and double-one rules).

## What things cost and give
| Event | Effect |
|---|---|
| Mixed success (exit has `cost: true`) | lose 1 STAMINA |
| Leaving a recovery section (its exit has `cost: true`) | lose 2 STAMINA |
| Arriving at a reward section | gain 1 STAMINA (max 10), and the `grant` keepsake |
| First arrival at a bottleneck | gain 1 LUCK (max 5) |
| First arrival at a `region-gate` bottleneck | STAMINA back to 10 (a night's rest) |

## How a section marks a roll (data)
A check is its own section: `"kind": "check"`.
```
{ "id": "td-2-014", "kind": "check", "page": "...ends at the instant before the outcome...",
  "check": { "stat": "NERVE", "target": 8, "label": "Cross the crusted flats" },
  "exits": [
    { "label": "check-full",  "to": "<reward>",   "result": "full",  "stat": "NERVE", "target": 8 },
    { "label": "check-mixed", "to": "<reward>",   "result": "mixed", "stat": "NERVE", "target": 8, "cost": true },
    { "label": "check-miss",  "to": "<recovery>", "result": "miss",  "stat": "NERVE", "target": 8 } ] }
```
- Exactly one test per check section, exactly three exits in the order full, mixed, miss, all repeating the section's stat and target. The `check-*` labels are internal and never shown; the reader sees `check.label` and the dice.
- Full and mixed normally lead to the same reward section; the only difference is the mixed `cost`.
- **Miss always leads to a `recovery` section** that continues the story. A recovery section has one or more exits, each `cost: true`, and rejoins the story (usually the same reward). No dead ends.
- A reward section has `grant`. Its exits may carry `setFlags`.
- At most two check sections in a row on any path.
- The text before a check describes the danger and ends before the outcome; recovery text says what went wrong and what it cost; reward text must read right after either result.

## Endings
- The ending selector section has one gated exit per ending, gated on a flag `end-<key>` (`"when": { "end-<key>": true }`) that was set by `setFlags` on the exit leaving some earlier reward section, plus one ungated fallback ending, so nobody is ever stuck.
- The exit label is the line the reader sees ("Gently return the waiting sea").
- Every ending flag is set on at least one path and read by exactly one selector exit.

## Rolls a reload cannot change
The engine creates a save seed at the start. `roll = hash(seed, sectionId, visitCount[sectionId])`, two dice. Reloading the same point gives the same roll; going back to a section later is a new visit and a new roll.

## Book metadata
Every dice `book.json` starts:
```
"dice": "2d6",
"rules": { "system": "2d6", "version": 1, "stats": ["..4 names.."], "statSpread": [2,1,1,0], "stamina": 10, "luck": 3, "luckMax": 5, "targets": [7,10] }
```
