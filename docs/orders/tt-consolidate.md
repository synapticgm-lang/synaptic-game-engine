# tt-consolidate — Part A: pipeline consolidation (14 Oct 2026)

Order: `docs/orders/tt-consolidate-order.md`. Evidence: `docs/orders/mode-tt-lap-9.md` and the six lap-9 runs (`scripts/fate-autoplay/runs/2026-10-14T16-54-*`).

## Result

- **Shipped.** Commit `46282858` on `main`, pushed.
- **Stamp:** `2026-10-14o` → `2026-10-14p`. Live `https://www.synapticgm.com/version.json` reads `{"hud":"2026-10-14p","build":"2026-10-14p"}`.
- **Edge:** `node scripts/sync-gm-edge-shared.mjs` changed `completedEventPacket`, `engineResult`, `outdoorHubs` and `writerInfoLayer`. Deployed `gm-turn`. Boot check: OPTIONS 200; POST `{}` returns 400 `{"error":"state is required"}`.
- **Gates (all at or under baseline):**

| Gate | Baseline | After | Limit |
|---|---|---|---|
| vitest failing | 78 | 78 | no new beyond baseline + flakes |
| replay bank failing | 64 | 64 | ≤ 64 |
| tsc errors (`tsconfig.app.json`) | 570 | 570 | ≤ 570 |
| `npm run build` | green | green | green |

- **Vitest detail:**
  - One failure is new against the baseline: `seed94InfestationClear` "pays 50 XP". It is a random flake, not caused by this step.
    - The test builds its state with `createInitialState(undefined, 'litrpg')`, which rolls a random seed. That seed picks a random System housing.
    - When the housing hides experience, `applySandboxXpAwards` returns no XP notes (`notes: xpHidden ? [] : xpNotes`).
    - It passes alone. No file in this step touches that path.
  - One baseline failure passed this run: `seed94OpeningHealthPresence`, also seed-dependent.
  - Known flakes `playtest30iFogOfWar` and `playtest27aRepair1` S3 showed as before.
- **Fix run:** one. The first full run had 1 new bank failure, 1 real vitest failure and 1 tsc error. All three were fixed, then verified once:
  - bank `m55` "gave a sound": my subject-owner rule swallowed "Col gave Jax a ring";
  - vitest `27aRepair1` RC2: an explicit "Look around" lost the place description;
  - tsc: a test cast.

## Root causes and the shared mechanism for each

### Root 1 — quest steps ticked on any arrival when the step's place was unknown

- **Cause.** `tabletopStepAnchor` gave a move step `place: null` when its wording named no known place ("Follow the cart tracks toward the keep's lower bailey"). `arrivedMoveStep` then ticked the step on any arrival that was not its own pin.
  - In lap 9 A, the cart-track step ticked at the inn, and the quest completed there.
- **Mechanism.** A move step is taken where it goes: the known place its wording names.
  - A move with nowhere known to arrive is taken as a look step at its own pin, else at the quest's place. It never ticks on arrival elsewhere.
  - `arrivedMoveStep` now needs a resolved place. The `from` special case is deleted.
  - `tabletopStepPlace` reads a possessive as its place ("the inn's" → inn).
- **Files:** `src/game/tabletopQuestProgress.ts`.

### Root 2 — the gate dropped correct lines

Three separate drops had one shared cause: each gate judged a sentence without knowing it was this turn's own event or a handed name.

- **`carried` on the body (A T12, D T21).**
  - "Jax set their feet apart / square…" was read as owning a thing called "apart" / "square".
  - `lineHasUnhandedOwnThing` now reads the owned thing as the first word after the owner. Body and worn words are always held.
- **Route stops not handed (A T16 "Ahead, the Old Well…", A T19 "Leaning Gibbet").**
  - Before, a route stop was a sentence in the handed text ("A named stop on the road is …"). Only the token gate read it; the sealed-card cast check and the fact checker missed it.
  - Now there is one handed-name list. `compileNounAllowlist` carries every route stop, and the commit gate, the token gate (`handedProperNames` falls back to the allowlist when no packet is given) and the fact checker all read it.
  - The tt-fix-7 route-stop sentence is deleted from `handedWriterText`.
- **This turn's action line trimmed or dropped (E T10 "Jax asked the two militia…", F T20 "Jax kept lookout…").**
  - `finishCommittedProse` treated the player's own action line as a recycled sentence. `repairRejectedSentences` dropped it when the one repair failed.
  - One check, `thisTurnsEventCheck`, now names this turn's event: the move sentence, or a sentence with the PC as subject doing the chosen action (`playerActionSentenceCheck`).
  - The recycle trim never cuts it. A failed repair keeps it when it is the only sentence telling the event, the same way the only destination sentence was already kept.
- **Files:** `src/game/tokenProse.ts`, `src/game/completedEventPacket.ts`, `src/game/writerTurn.ts`.

### Root 3 — place card text pasted into prose

- **Cause.** The hub blurb ("Last coach stop — warm ale, cold silence.") was handed every turn as `What it is:`. Travel handed it again as `First sight of X:`, and the code stitch pasted it a third time (`hubDescriptor` / `arriveDesc`).
- **Mechanism.** `placeFirstSight` in `outdoorHubs` hands one first sentence of the card text, and only as a sight:
  - on the turn the player first comes in (the card was built this turn — arrival builds it before the packet); or
  - when the player looks the place over (the stitch's look line).

  On any other turn the place is its name, things, exits and people. The writer HERE block, the stitch descriptor and the stitch arrival all use it.
- **Deleted:** `hubDescriptor`, the travel `First sight of` fact, and its `firstSentence` helper.
- **Files:** `src/game/outdoorHubs.ts`, `src/game/writerInfoLayer.ts`, `src/game/travelJourney.ts`, `src/game/completedEventPacket.ts`.

### Root 4 — turnCheck and fact-checker false positives

- **turnCheck: things vs manners.**
  - `action-object-missing` treated every word after the verb as a thing to find: "breath", "yourself, watch", "Mage Armor".
  - New `actedOnWords` (`chipRules`): the thing acted on is the noun phrase after a determiner ("Inspect the crate" → crate). A manner, stance or spell names no thing.
  - Fixes D T14, E T19 and A T12.
- **turnCheck: nouns ending in -ed.**
  - The P0 "name missing before its verb" rule took any `-ed` word as a verb ("a bed at the inn").
  - The rule is now morphological: a stem of three or more letters plus `-ed`, not `-eed`.
- **factCheck: one handed text.**
  - `allowText` now includes the whole handed text and every open quest's title and step (fixes Lina in D T10). The route stop comes through the allowlist (A T19).
- **factCheck: meetings.**
  - A meeting on a quiet stretch needs a person word that acts, using the same `PERSON_ACTS` the person check uses (fixes "a fence", A T13).
- **factCheck: owned items.**
  - A thing a handed person handles in their own clause is theirs ("Edda rested one gloved hand flat on a folded paper", D T9). A thing given to the PC still flags.
- **Files:** `src/game/chipRules.ts`, `src/game/turnCheck.ts`, `scripts/factCheck.mjs`.

### Root 5 — fight rewrite in `runWriterTurnFightOnly`

- **Cause.**
  - The fight-outcome word list missed "knocked them flat" and "did not get up again", so the correct first draft of D T13 was rejected.
  - The rewrite then always won, even when it told less of the fight.
- **Mechanism.**
  - One went-down vocabulary (`WENT_DOWN` in `engineResult`) is shared by the victory and defeat checks.
  - `missingFightFacts` counts the settled fight facts a draft leaves out. `ignoresTerminalFight` is that count > 0.
  - The fight path keeps the rewrite only when it leaves out fewer facts than the first draft.
  - `fightRetry` is recorded on the turn row.
- **Files:** `src/game/engineResult.ts`, `src/game/beatCommitGate.ts`, `src/game/writerTurn.ts`, `src/game/fateAutoplay.ts`.

## Rule counts before / after

Counted with a TypeScript-scanner script over the writer, checker, gate, repair and chip files: regex literals, `new RegExp`, all-string arrays of 3+ entries, functions, and lines. Edge copies were counted after the sync.

| File | Lines | Regex | new RegExp | Lists (entries) | Functions |
|---|---|---|---|---|---|
| tokenProse.ts | 1458 → 1461 | 173 → 174 | 38 → 38 | 9 (50) → 9 (50) | 186 → 186 |
| engineFactPatterns.ts | 164 → 164 | 28 → 28 | 14 → 14 | 1 (35) → 1 (35) | 22 → 22 |
| engineFactGate.ts | 97 → 97 | 0 → 0 | 0 → 0 | 0 → 0 | 20 → 20 |
| writerTurn.ts | 653 → 688 | 53 → 57 | 6 → 7 | 1 (19) → 1 (19) | 102 → 110 |
| turnCheck.ts | 755 → 756 | 70 → 70 | 9 → 9 | 1 (17) → 1 (17) | 107 → 107 |
| chipLegality.ts | 312 → 312 | 27 → 27 | 1 → 1 | 1 (5) → 1 (5) | 37 → 37 |
| chipRules.ts | 97 → 114 | 22 → 24 | 1 → 1 | 0 → 0 | 16 → 19 |
| fullProseGate.ts | 55 → 55 | 3 → 3 | 0 → 0 | 0 → 0 | 8 → 8 |
| beatCommitGate.ts | 664 → 674 | 142 → 142 | 0 → 0 | 1 (16) → 1 (16) | 43 → 45 |
| tabletopQuestProgress.ts | 235 → 237 | 12 → 13 | 0 → 0 | 0 → 0 | 32 → 32 |
| scripts/factCheck.mjs | 542 → 554 | 129 → 131 | 17 → 18 | 7 (180) → 7 (180) | 86 → 88 |
| edge completedEventPacket.ts | 2758 → 2757 | 197 → 196 | 2 → 2 | 3 (36) → 3 (36) | 272 → 269 |
| edge writerInfoLayer.ts | 231 → 230 | 1 → 1 | 0 → 0 | 0 → 0 | 29 → 29 |
| edge outdoorHubs.ts | 666 → 682 | 28 → 29 | 1 → 1 | 6 (19) → 6 (19) | 91 → 92 |
| **Total** | **8687 → 8781** | **885 → 895** | **89 → 91** | **30 (377) → 30 (377)** | **1051 → 1064** |

**The totals went up, not down.** This step replaced five drop/false-positive paths with shared checks, but it did not cut the existing narrow rules:

- Deleted: `hubDescriptor`, the travel first-sight fact and its helper, the `from` branch of the quest anchor, and the route-stop sentence. No word list grew, and no phrase was added to any gate.
- Added: the new checks themselves — the event check, the determined-object reader, the fight count, the first-sight helper and the shared person-acts pattern.
- The 30 lists and ~885 regex patterns already in these files are mostly untouched. The cut has to come in a later step: for example, folding the separate "only destination" keep into the event check, and moving `engineFactPatterns` / `beatCommitGate` sentence regexes onto the handed-name list.

## Tests

`src/game/ttConsolidate.test.ts` (12 tests, all pass), one block per root:

- **Root 1:** a move with no known place anchors as a look step at the quest place; arriving at the inn does not tick it.
- **Root 2:**
  - the "feet apart / square" lines pass `carried`, and a real unhanded lantern still fails;
  - a route stop is in the allowlist and the handed names;
  - "Jax asked the two militia…" and "Jax kept lookout…" are this turn's event.
- **Root 3:** the card text is handed the turn the card is built and not two turns later, in both `placeFirstSight` and the writer HERE block.
- **Root 4:**
  - `actedOnWords` for the lap-9 chips. "Fight for breath", "Ready yourself and watch" and "Cast Mage Armor" no longer flag; a real missing crate still flags.
  - "a bed at the inn" passes `brokenProse`; "the stepped from" still flags.
  - factCheck: Lina in a quest step; "a fence" is no meeting but "A man stood…" is; Edda's paper is hers.
- **Root 5:** "knocked the dog flat… did not get up again" carries the victory, and a beat with no outcome still fails.

Existing pins still pass: `ttFix7` route stop via the allowlist, `ttFix2` anchors, `27aRepair1` RC2 look line, and the bank `m55` "gave a ring" item.

## Left open (honest)

- **"Check the exits"** told as "the ways out" plus the exit names (D T3, E T9) still flags `action-object-missing`. That is a synonym, and a word list would be a patch. It wants the turn check to read the place card's exits as the object.
- **The real F T20 "Keep lookout" flag** no longer fires from `turnCheck`, because "lookout" has no determiner. Its cause (the action line was cut) is fixed under root 2.
- **The rule-count reduction is not done** (see the counts above).

TT_DONE
