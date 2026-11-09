# Unified fact gate

Status: design only. No implementation in this change. Base: main `210e3da114f49b3ea75f78b2e3c05c6809187c93`. Audit: the 9 Nov prose-gate note. This revision makes the code check the primary design. An AI check of every draft is kept only as an alternative. It does not merge, deploy, or call a model.

## One page

The writer should get the facts first, and then be left alone. A second model pass over prose the game could have judged itself is a cost, not a safety property.

Today the page dies after the writer has already been paid. On 8 Nov, 1 of 22 turns kept the writer's page. On 9 Nov, 3 of 22 did. Thirteen of the 9 Nov drops were `uncovered`: the checker named no serious lie, skipped a sentence, and the code threw the rest away, including scenery.

The primary design is code, in three steps.

1. Before the model writes, the packet is complete. Fact sheet, cast, exits, engine result, and any memory the player's line calls back are filled from the save. A hole is filled, or written as an explicit empty ("exits: none"). The writer is not punished later for a fact the packet never handed over.
2. After the draft, code splits every sentence and clause. Each span is checked against that packet. The verdict is `colour`, `allowed`, `new/wrong`, or `UNSURE`. Names, items, exits, a dead foe, loot, arrivals, perspective, and outcome verbs are this check. No model call. Scenery, mood, and gesture are `colour` and stay. An allowed fact stays. A `new/wrong` span is removed, or repaired once. There is no sentence quota.
3. A cheap AI check runs only on `UNSURE` spans, never on the whole draft, and only when a feature flag is on. The flag defaults off. While it is off, an `UNSURE` span is removed, because it was not cleared. The engine page is used only when nothing remains.

A clean turn is one model call: the writer. That is the whole design.

Code cannot see a fact that is only implied. "She quietly pockets the key" is a theft if the verb list does not contain "pockets", and it is only a theft the code knows about if "key" is checked against the gear. A paraphrase with none of the gain/loss verbs, and no name outside the packet, is classified `colour` and kept. The limit is that closed verb list, not a second reading of the whole page. The optional checker sees only the spans the list already marked `UNSURE`.

An offline probe of the two companion tapes, using the packet stored beside them, is in the measurement section. It is not a percentage for the older tapes. Those drafts are stored. The fact sheet is not.

Story RPG and tabletop use the same code check. The packet facts differ. Tabletop's word cap stays outside the gate until John retires it.

Merging this file to `main` would still publish the client, because Vercel builds production from `main`. The spec itself has no runtime effect. Do not merge it until the text is accepted.

## Architecture

```
save + this turn's engine result
        │
        ▼
 packet completeness (code, no model)
 fact sheet, cast, exits, engine result, recall
 missing field → fill from the save, or write "none"
        │
        ▼
 writer (the only model call on a clean turn)
        │
        ▼
 segment the real draft (code)
 every sentence and clause gets an id
        │
        ▼
 deterministic verdict for every id
 colour | allowed | new/wrong | UNSURE
 names, items, exits, dead foe, loot,
 arrival, perspective, outcome verbs
        │
        ├─ colour, allowed → keep
        ├─ new/wrong → remove the span
        │              (one repair call is optional, then the same code check)
        └─ UNSURE → flag off: remove the span
                    flag on: one cheap check of those spans only
        │
        ▼
 one exact-repeat trim
        │
        ▼
 publish what remains
 engine page only if nothing remains
```

Live play (`useGame.ts`) and Fate (`fateAutoplay.ts`) call this one function. They do not keep a second clause check, a thinness rewrite, or the prose-warden maze.

The hosted writer stays `gm-turn`. The packet rides in the body the client already sends. No new model, no Fireworks, no Gemini, and no edge deploy is required for the packet text. An edge deploy is required only if shared packet code under `supabase/functions/_shared/gm/` changes. This spec does not make that edit.

## What the code decides

Segmentation uses the existing sentence split, then a clause split owned by code (a quoted line is its own span; a speech line from the token JSON is its own span). A short true quote covers only its own words. `supportedFactInsideSentence` (`src/game/clauseCheck.ts:148` on main) is not used.

| Verdict | Rule | What happens |
|---|---|---|
| `colour` | No name outside the packet, no gain/loss verb, no outcome verb, no move, no narrator "you" in third person. | Keep the words. |
| `allowed` | Every name is on the mention list or the REF ENUM. An item that is taken or given is on the gear, the ledger, or the beat. A move matches a move the beat recorded. An outcome verb agrees with the engine result (a disagree beat is not narrated as obedience). | Keep the words. |
| `new/wrong` | A name or token that is not on the packet. A move or arrival when the beat says no move. A dead name doing an action. Loot the beat did not grant. Narrator "you" on a non-speech line when the mode is third person. Obedience when the beat says the person disagrees. | Remove that span. Optionally one repair call, then run this same table on the new words. No second repair. |
| `UNSURE` | A gain/loss verb whose object is a pronoun or a noun the packet does not name. A world-claim word (`trade`, `secret`, `worth`, `killed`) that is not in the packet. Dialogue the code cannot separate from narration. | Flag off: remove the span. Flag on: the only AI call besides the writer, and only these spans. |

The mention list, the REF ENUM, the fact sheet, and the engine result are the only allow-set. A place name on the mention list may be spoken. It may not be an arrival unless it is an exit of here or the beat says the player moved there.

Perspective is a substitution when it is only `you` versus the character's name on a kept sentence, and a `new/wrong` when the mode forbids narrator "you". It does not delete a sentence that is otherwise colour.

## What code cannot catch

The check is a closed list of names and verbs against a closed list of facts. It does not understand a scene.

- "She quietly pockets the key" is caught only if "pockets" is on the gain/loss list and "key" is checked against gear. If the verb is missing from the list, the sentence is `colour` and the key leaves the room in the prose while the inventory does not change. The inventory still does not gain the key. The lie is in the story, not in the save.
- "The key finds her belt" has no gain verb. It stays, unless "key" is treated as a possession claim. A possession rule ("has", "finds", "wears" plus an item noun) can move some of these to `allowed` or `new/wrong`. It will also flag innocent lines ("the room has a smell of bread") unless the noun has to be an item. That rule is worth adding. It is still not an understanding of the sentence.
- A true fact said in words the sheet does not share ("the west road", when the sheet says "Lowmarket") becomes `UNSURE` or `new/wrong` even when a person would see the match. The optional checker is for that residue, not for reading the draft again from the top.
- The probe below did not implement a full possession rule. Its `colour` bucket therefore includes at least one real possession line ("Mara Vell still has the room key…", 8 Nov turn 10) because "has" was not on the verb list. That line is the evidence for this gap, not a sign the gap is rare in general.

The design limits the damage. The save is not updated from prose. A span the code cannot clear is removed when the flag is off, so an implied theft is published only when the verb list missed it entirely. Turning the flag on spends a call on the unsure spans. It does not spend a call on the scenery.

## Packet completeness

Built where `formatWriterFacingEvent` already assembles the writer body (`src/game/completedEventPacket.ts:1455` on main).

| Field | Source today | If missing before the writer call |
|---|---|---|
| Fact sheet | `formatFactSheetForWriter`, pushed at `completedEventPacket.ts:1512` | Build it from the save. Do not call the writer with the block omitted. |
| Cast and mention list | `YOU MAY ONLY MENTION` at `:1544`, REF ENUM at `:1644` | Rebuild from present people, the sealed cast, and the places the bible already allows. Empty cast is the explicit list `none`. |
| Exits and map | place on the fact sheet; travel commit already moved HERE | Copy the place's exits. No exits is `none`. |
| Engine result | `:1530` | The turn spine already computed it. If that string is empty, write `none`. |
| Memory | PR 7 only: `recalledSaidLines` in `sceneBlock.ts`, earlier player lines on the scene block. Not on main `210e3da1`. | When those fields exist, a callback of four opening words at age 8 or more is included before the call. When they do not exist yet, the packet says nothing and the gate does not invent a memory. |

`writerLeafBlock` (`completedEventPacket.ts:1373`) may still drop a SCENE line that repeats the sheet. It may not drop a fact the sheet does not already state.

Townsfolk wants, offers, and locks stay. They are facts. "Play it, do not change it" stays a fact instruction.

## How often the optional check would fire

Measured offline. No model was called. The script was not committed and is not part of the game.

Rules the probe actually used, against the writer prompt stored for that turn (mention list, REF ENUM, world-facts block, engine result):

- Resolve `@tN` with the REF ENUM. A token not in the enum is `new/wrong`.
- A name outside the mention list and the fact block is `new/wrong`. A single capitalized word at the start of a sentence is not treated as a name.
- A move phrase (`set out for`, `arrived at`, `walked toward`, `the trail lay open`, and the same family) while the packet says "No move this turn" is `new/wrong`.
- `obeyed` / `agreed to` / `complied` while the packet says `disagrees` is `new/wrong`.
- Narrator `you` on a line whose token role is not `speech` is `UNSURE` (it may be unmarked dialogue).
- `picked up`, `pocketed`, `stole`, `took the`, `handed`, `received` with no packet noun is `UNSURE`. With a packet noun it is `allowed`.
- `worth`, `secret`, `trade`, `killed`, `dead`, `owns` not already in the packet is `UNSURE`.
- Anything else with no outcome verb is `colour`. A sentence whose names sit on the packet is `allowed`.

This is a sentence split of the token lines, not a full clause split. A finer split could move some of these spans. It would not create a score for tapes that have no packet.

**9 Nov tape** `2026-11-09T05-44-59-560Z_summoned-pact_chilled-gm_s36`, drafts in `writerRaw`, packet in `writer-prompts/`. 22 turns, 84 spans.

| Verdict | Spans |
|---|---:|
| colour | 61 |
| allowed | 22 |
| new/wrong | 0 |
| UNSURE | 1 |

21 of 22 turns had no `UNSURE` span. The one `UNSURE` span is game turn 7: "Folks there trade in things they shouldn't." `trade` is not in that turn's packet. Under the flag-off rule that span is removed and the other three sentences of the line stay, still one writer call. Under the flag-on rule that one span is the only extra model input.

**8 Nov tape** `2026-11-08T23-52-11-338Z_summoned-pact_chilled-gm_s36`, same probe, same kind of stored packet. 22 turns, 81 spans: 64 colour, 17 allowed, 0 new/wrong, 0 UNSURE. 22 of 22 turns would stay one writer call. The probe's `colour` bucket still swallowed "Mara Vell still has the room key…" because "has" was not on the verb list. That is a miss, recorded above. It is not an `UNSURE`.

**Older recovered tapes.** 90 run folders contain `turns.jsonl`. All 1799 rows have `writerRaw`. 88 of those folders, 1755 rows, do not store a fact sheet and do not store `writer-prompts/`. Two further run folders have no `turns.jsonl` at all (`…s7301`, `…s7307`). The probe cannot check a draft against a packet that was not saved. No percentage is given for them.

These two recordings are also a narrow sample: one bible, one seed, Story RPG, the writer mostly describing a room. A fight, a loot beat, or a tabletop death would produce more `new/wrong` hits. The numbers are the hits of this rule list on these 44 turns, not a forecast for every future turn.

## Cost

| Path | Primary (code first) | Alternative (AI checks every draft) |
|---|---|---|
| Clean turn | 1. The writer. | 2. Writer, then a check of the whole draft. |
| Code finds `new/wrong`, span removed | 1. | 4. Writer, full check, repair, recheck. |
| Code finds `new/wrong`, and a repair is requested | 2. Writer, then one repair. Code checks the new words. | 4. |
| `UNSURE`, flag off | 1. The span is removed. | Not a separate path. The full check already ran. |
| `UNSURE`, flag on | 2. Writer, then one call whose input is only the unsure spans. | — |
| Nothing left, or the writer call failed | Engine page. Writer retries follow today's transport rule only. | Engine page, after the failed check as well. |

9 Nov used 76 model calls for 22 turns. 8 Nov used 80. Most of those calls were checks and repairs of pages that were then discarded. On these 44 turns the primary design would have been 44 writer calls, plus one optional call if the flag had been on for the single `trade` sentence. That comparison holds only for these tapes and this probe.

Today's repair turns on 9 Nov used 5 to 7 calls and still lost the page. The alternative column is the previous revision of this spec: every draft is checked by a model, coverage is by id, and a bad span is repaired once.

## Inventory

Lines are main `210e3da1` unless marked PR 7. "Fold in" means the fact becomes a code verdict and the old rewriter stops touching prose. "Retire" means it no longer runs on the publish path.

| Layer | Where | Decision |
|---|---|---|
| Fact sheet in the prompt | `completedEventPacket.ts:1512` | Keep. Completeness fills it first. |
| Engine result line | `completedEventPacket.ts:1530` | Keep. Explicit `none` when empty. |
| Mention allowlist and `@tN` | `:1544`, `:1644` | Keep. The code verdict uses the same lists. |
| Line quota and "smells are spent" | `:1594` and the 3–5 line branch above it | Retire. |
| Townsfolk wants, offers, locks | writer body around `:1561` | Keep. Facts. |
| Recall lines | PR 7 `sceneBlock.ts` `recalledSaidLines`; not on main | Keep once present. Do not invent them on main before that code exists. |
| `writerLeafBlock` repeat drop | `completedEventPacket.ts:1373` | Keep. |
| Render draft | `writerTurn.ts` `renderWriterDraft` | Keep. |
| Too thin, 4–6 sentences | `writerTurn.ts:130` | Retire. |
| Collage, atmosphere reprint, same-room essay as a rewrite | `writerTurn.ts:133–151` | Retire the rewrite. Exact-repeat trim replaces them. |
| Unresolved engine result, unsettled fight | same function | Fold in as code verdicts. |
| Echo of the typed act | `dropPlayerActEchoOpening` `writerTurn.ts:357` | Keep as a trim of that opening only. |
| Unseated speaker, invented PC speech, dead character acting | `writerTurn.ts` seat and dying checks | Fold in as `new/wrong`. |
| Blocking rewrite and last-resort page | `runWriterTurnWithFightRetry` `writerTurn.ts:470` and `:581` | Retire. The engine page belongs only to an empty remainder. |
| `normalizeCommittedProse` recycle and same-beat trim | `writerTurn.ts:1028` | Retire the fuzzy trim. Keep quote ownership and the punctuation tidy. |
| Tabletop word cap | `writerTurn.ts:652` | Leave outside the gate, `dnd` only, until John decides. |
| Clause check of every draft | `checkAndRepairProse` `clauseCheck.ts:246`; calls at `fateAutoplay.ts:2055`, `useGame.ts:3214` | Retire as a whole-draft model pass. The alternative section is the only place it survives. |
| Whole-draft withhold on a skipped sentence | `clauseCheck.ts:382` (`de4f03a6`) | Retire. Code labels every span. A span it cannot label `colour` or `allowed` does not stay by default. |
| `supportedFactInsideSentence` | `clauseCheck.ts:148` (`58b4ff49`) | Retire. No short quote covers a sentence. |
| Empty, throw, bad parse of a checker | `645f9f578` | Applies only when the `UNSURE` flag is on and that call fails. Then those spans are removed. The rest of the draft stays. |
| Serious fact, one repair | M4 header and `de4f03a6` | Fold in as optional one repair of `new/wrong` spans. Default is removal, which costs nothing. |
| Colour taxonomy in the checker prompt | `clauseCheckPrompt.ts` | Used only for the optional `UNSURE` call. The code's own colour rule is the verb-and-name table above. |
| `runWarden` prose scrub | `warden.ts:60`, comment at `:225` | Fold name, item, and manifest hits into the code verdicts, on the real draft. Chip notes stay on the pad. |
| `applyProseWarden`, `scrubEntityMadLibs` | `proseWarden.ts` | Retire. Not on the live path. Do not wire them back. |
| `scrubFalseArrivalWhenHere` | `proseWarden.ts:128`, still called from Fate and live | Fold in as a `new/wrong` move. Delete the later scrub. |
| Fact locks, camera, one-camera fight | `factLocks.ts:163`, `enforceCameraOnProse` | Fold move and place lies into verdicts. Camera state updates stay. |
| Invented geography, leak scan | `narrativeHarvest.ts:329`, `fateAutoplay.ts:2357` and `:2370` | Fold geography into the exit verdict. Keep leak scan for mechanic tags only. |
| Governance prose rewrite | `applyGovernanceToProse` | Retire as a prose rewrite. Notes may still withhold XP. |
| Blocked paint | Fate, `28l` comment | Keep as XP only. Stitch only an empty page (`ledgerActionStitch`, `completedEventPacket.ts:1303`). |
| Readability gate | `readabilityGate.ts:151` | Keep as a score. It must not rewrite. |
| Gold shape | `fluidProseRails.ts:49` | Keep as optional prompt voice. Not a verdict. |
| Chips | choice pipeline | Keep off the prose path. |

## Alternative: a model checks every draft

The previous revision of this spec sent every draft to a checker. Code numbered the spans. The model had to return one verdict per id. A missing id failed the whole check and the engine page replaced the draft. A `new/wrong` span was repaired once and rechecked. Colour was kept. `supportedFactInsideSentence` was still forbidden.

Call count for that alternative: 2 on a clean turn, 4 when any span needs repair. It catches paraphrase the verb list misses, because a model reads the span. It costs a call on every turn, including the turns where the probe above found nothing but scenery. It is not the primary design. If the code-first flag for `UNSURE` proves too blunt, this alternative is the documented step up, not a second stack running beside it.

## Story RPG and tabletop

One function, one verdict table.

Story RPG facts in the packet include the companion's stored goal, whether they refused or disagreed, and recall of an old line when the player calls it back. Tabletop facts include unconscious and dead: a sentence that walks a dead character is `new/wrong`. Tabletop's word cap, `capBeatWords` (`writerTurn.ts:652`), is not part of the fact gate. It may run after a kept page, only in `dnd`, and it must not call a model.

Kid-mode gore and the gold-shape line stay prompt voice. They are not verdicts.

Chips stay on the button pad.

## Tests

Existing tests keep their spirit. They do not keep the whole-page drop.

- `clauseHoldAndTalkLeaf`: `UNCHECKED_SENTENCE_9f3c opens the vault` is `new/wrong` or `UNSURE` and is not published. `Mira answers you` beside it stays when that sentence is `colour` or `allowed`. A one-word or dot claim does not cover another sentence.
- A serious unsupported fact (`A dragon lands on the furnace`) is `new/wrong`. It is removed, or repaired once. `The bathhouse waits` stays.
- "The cloak is on the peg and Mara hands you the vault key", with the sheet supporting only the cloak, keeps the cloak words and does not keep the vault key.
- "She quietly pockets the key", with the key not in gear, is `new/wrong` once "pockets" is on the gain/loss list. A test where the verb is outside the list is expected to miss. That test documents the limit. It does not weaken the list.
- Flag off: an `UNSURE` span is absent from the page, and no checker call is made.
- Flag on: the checker payload contains only the `UNSURE` ids. A failed or empty reply removes those spans and keeps the others.
- An explicit empty exits field does not delete a sentence that never named an exit.
- Tabletop: a sentence that walks a dead character loses that span. The word cap, if still on, does not call the model.

Replay, offline, no new model calls:

- Do not commit the tapes. 8 Nov `turns.jsonl` sha256 `639e17cf15fd06e9719d24c5fcd1f943ac85413a9d056125a248176a7e76f6d0` (249428 bytes). 9 Nov `0310ab6f685bed17c6eddc59600bc9deef2f600a572d872809763f733780e0cb` (252983 bytes). Do not point the bank at the 9 Nov tape.
- The baseline stays: 8 Nov kept 1 of 22 writer pages, 9 Nov kept 3 of 22. Checker claim lists were not stored. Do not invent them.
- Engine predicates on the recovered tapes still pass when the writer is the mocked tape. Those predicates read state and the packet, not the published adjective. 1755 older rows cannot be run through this classifier until a packet is stored with the draft.
- The prose-survival check on the two companion tapes is the probe table above, re-run as a unit test once the verb list is the one in the implementation. Success is: the vault sentence is absent, colour sentences remain, and the call count on a fixture with no `UNSURE` and no repair is one.

## Migration and rollback

1. Add the code verdict function. Fate and live call it instead of `checkAndRepairProse`. Do not leave both on the publish path.
2. Delete the retired prompt lines and the blocking rewrite in the same change.
3. Default the `UNSURE` model flag to off.
4. Run the unit tests and the replay bank. A missing private tape stays a hard failure.
5. Rollback is reverting that commit. Two stacks on at once is how the current page dies twice.
6. Do not merge to `main` until John accepts the text. A merge starts a Vercel production deploy of the client, even for a docs-only file. Supabase `gm-turn` does not deploy by itself.

## Open questions

1. Tabletop word cap: keep it after the gate, or drop it with the other quotas?
2. Exact-repeat trim: should "look again" keep a repeated sentence when the player asked to look?
3. Recall is on PR 7, not on this base. Should the gate wait for that packet?
4. Flag off removes `UNSURE` spans. Is that the default you want, or should the flag ship on for the first recordings?
5. Default for `new/wrong` is removal with no repair call. Do you want the one repair on by default instead, knowing it adds a call whenever a span is wrong?
6. Gold-shape and kid-mode stay prompt-only. Confirm they must never become verdicts.

## Out of scope

No game code in this change. No model call. No edit to the companion bank. No new recording. No merge and no deploy. The 8 Nov checker replies stay missing. The 1755 older drafts stay unscored.
