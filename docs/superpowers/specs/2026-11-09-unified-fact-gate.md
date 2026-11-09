# Unified fact gate

Status: design only. No implementation in this change. Base: main `210e3da114f49b3ea75f78b2e3c05c6809187c93`. Audit: the 9 Nov prose-gate note. This spec replaces that stack. It does not merge, deploy, or call a model.

## One page

The writer is free to tell the story. The game decides the facts. Today those jobs are split across a prompt quota, a rewrite, a sentence repair, a clause check that drops the whole page, a warden that then sees the stub, and a readability score that marks the stub a failure. Two companion recordings show the result. On 8 Nov, 1 of 22 turns kept the writer's page. On 9 Nov, 3 of 22 did. Thirteen of the 9 Nov drops were `uncovered`: the checker named no serious lie, skipped a sentence, and the code threw away the rest, including scenery.

The replacement is one gate with two duties.

**Before the model writes,** the packet is complete. Fact sheet, cast, exits, engine result, and any memory the player's line calls back are filled by code from the save. A hole is filled, or written as an explicit empty ("exits: none"). The writer is not punished later for a fact the packet never handed over.

**After the model writes,** code splits the whole draft into sentences and clauses and numbers them. One check must return a verdict for every number. A missing verdict fails the check. A short true quote does not cover the rest of its sentence. Scenery, mood, and gesture stay. A fact the sheet allows stays. A new or wrong fact is repaired once, or that span is removed. Names, items, exits, a dead foe, unearned loot, a false arrival, and perspective are decided in that same pass, on the real draft. There is no sentence quota and no ban on smell or light. One exact repeated sentence may be trimmed. The engine page replaces the draft only when the check itself fails, or when nothing is left.

Story RPG and tabletop use this same gate. What differs is the facts in the packet (death and unconsciousness on tabletop, companions and recall on Story RPG) and, until John says otherwise, tabletop's existing word cap after the gate.

A clean turn is two model calls: write, then check. A turn with bad facts is four: write, check, one repair for every bad span, check those spans again. Today a clean companion turn is already about two calls and still loses the page. Turns that repair currently run five to seven calls and still lose the page. The gate does not buy prose by adding calls.

This document does not change code. Merging it to `main` would still publish the client, because Vercel builds production from `main`. Do not merge it for that reason until the text is accepted. The spec itself has no runtime effect.

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
 writer (1 model call)
 artistic prose, tokens for names
        │
        ▼
 render draft (code)
        │
        ▼
 segment (code)
 sentence, then clause, each with an id
        │
        ├─ local fact verdicts on the real draft
        │   names, items, exits, dead foe,
        │   unearned loot, false arrival, perspective
        │
        └─ checker (1 model call)
            must return one verdict per id
        │
        ▼
 merge verdicts
 colour or allowed → keep
 new or wrong → one repair call for every bad span
                then one recheck of those ids only
                still wrong → delete that span
 missing verdict, throw, empty, bad JSON → check failed
        │
        ▼
 exact-repeat trim (one identical sentence already on the log)
        │
        ▼
 publish kept prose
 if the check failed, or nothing is left → engine page, once
```

Live play (`useGame.ts`) and Fate (`fateAutoplay.ts`) call this one function. They do not keep a second copy of the clause check, the blocking rewrite, or the prose-warden maze.

The hosted writer stays `gm-turn`. The packet rides in the body the client already sends. The check stays one hosted check call, as `makeGmClauseChat` does today. No new model, no Fireworks, no Gemini, no edge deploy is required for the packet text. An edge deploy is required only if shared packet code under `supabase/functions/_shared/gm/` changes and must match the client. This spec does not make that edit.

## Principles, as rules

1. **The writer has the facts.** Completeness is a property of the packet, checked in code before `callGm`. The fields are the fact sheet, the present cast, the exits of here, the engine result for this action, and memory the player's words call back (a said line or an earlier player line, when that recall exists). If the save has the fact and the field is blank, code copies it in. If the world has none, the field says none. The later gate never deletes a sentence for a fact the packet left out.
2. **The check reads everything.** Code segments the draft. The checker answers by id. Validation fails closed when any id is absent, repeated, or paired with text that is not that segment. `supportedFactInsideSentence` (`src/game/clauseCheck.ts:148` on main) is removed. A quote covers only its own words. A sentence does not pass because the checker forgot it.
3. **Facts are the game's. Story is the writer's.** Verdicts are `colour`, `allowed`, or `new-or-wrong`. Colour and allowed are kept as written. `new-or-wrong` names the fact span inside the segment. Words outside that span stay, which is how a gesture survives beside a bad name. One repair, then removal of the span that is still wrong. Local ledger checks are verdicts in this same merge, not a later regex pass.
4. **Few rules.** No 4–6 line quota. No "smells are spent." No collage or atmosphere-reprint rewrite. One trim: a sentence whose text is exactly a sentence already in the recent GM log, and only when another sentence remains. Whole-page engine text only for a failed check or an empty remainder. The save, the ledger, and recall are unchanged, so consistency and memory stay.

## Packet completeness

Built where `formatWriterFacingEvent` already assembles the writer body (`src/game/completedEventPacket.ts:1455` on main).

| Field | Source today | If missing before the writer call |
|---|---|---|
| Fact sheet | `formatFactSheetForWriter`, pushed at `completedEventPacket.ts:1512` | Build it from the save. Do not call the writer with the block omitted. |
| Cast and mention list | `YOU MAY ONLY MENTION` at `:1544`, REF ENUM at `:1644` | Rebuild from present people and the sealed cast. Empty cast is the explicit list `none`. |
| Exits and map | place on the fact sheet; travel commit already moved HERE | Copy the place's exits. No exits is `none`, not a omitted line the model must guess. |
| Engine result | `:1530` | The turn spine already computed it (`fateAutoplay.ts` builds `engineFact` before the call). If that string is empty, write `none` rather than leaving the writer to invent an outcome. |
| Memory | PR 7 only: `recalledSaidLines` in `sceneBlock.ts`, earlier player lines on the scene block. Not on main `210e3da1`. | When those fields exist, a callback that matches four opening words at age 8 or more is included before the call. When they do not exist yet, the packet says nothing and the gate does not invent a memory. |

`writerLeafBlock` (`completedEventPacket.ts:1373`) may still drop a SCENE line that repeats the sheet. It may not drop a fact the sheet does not already state.

Townsfolk wants, offers, and locks (`completedEventPacket.ts:1561–1574` on the current writer body) stay. They are facts about people. "Play it, do not change it" stays a fact instruction, not a style note.

## The check

Segmentation uses the existing sentence split, then a clause split owned by code. Each piece gets an id (`s2c1`). The checker prompt is the current colour-versus-fact taxonomy in `clauseCheckPrompt.ts` (colour is light, sound, gesture, silence, the player's body, travel the beat already granted; a fact is a name, speech, item, outcome, exit, time, price, or claim about the past). The reply is JSON, one row per id: verdict, and for `new-or-wrong` the exact span and the sheet quote that was missing.

Code accepts the reply only when:

- every id is present once
- the row's text is that segment, not a paraphrase that could point at a different sentence
- a `new-or-wrong` span is a substring of that segment
- `colour` and `allowed` have no deletion

Otherwise the check has failed. `storyAfterClauseCheck` (`clauseCheck.ts:397`) already refuses to publish the draft when a check fails. That behaviour stays, and it becomes the only whole-page replacement.

Local verdicts run on the rendered draft, before the merge, using the ledger:

- a name that acts and is not on the cast (`beatContract.ts:561`, and `warden.ts` ungrounded names)
- an item the prose uses that the inventory does not have (`warden.ts` missing-item notes)
- an exit or place the map does not have (`narrativeHarvest.ts:329`)
- a dead foe acting, and loot the beat did not grant (the checks inside `proseWarden.ts` that are facts, not mad-libs)
- a sentence that arrives somewhere the engine did not move (`proseWarden.ts:128`)
- perspective: `you` versus the character's name is a mechanical substitution on the kept words (`enforcePerspective`), not a reason to delete the sentence

A local `new-or-wrong` does not ask the model for permission. The model check still must answer every id, so a local hit does not excuse a skipped sentence.

Repair is one call. The request lists every remaining bad span, the engine fact, and the instruction to change only that span. The same shape exists as `sentenceRepairRequest` in `writerTurn.ts`. The recheck sends only those ids. A span that is still `new-or-wrong`, or a recheck that fails, is deleted. Neighbours stay.

## What happens on failure

| Event | Published text | Model calls after the writer |
|---|---|---|
| Check throws, empty body, or JSON that is not the id list | Engine page, once. No second roll, no extra repair. | 1, wasted |
| Any segment id without a verdict | Same as a failed check. The draft is not partly trusted. | 1 |
| All verdicts `colour` or `allowed` | The draft, minus an exact repeated sentence if one is trimmed | 1 |
| Some spans `new-or-wrong`, repair clears them | Draft with those spans replaced | 3 (check, repair, recheck) |
| Repair still wrong, or repair text empty | Those spans removed. Rest kept. | 3 |
| Every span removed, or the draft was empty | Engine page, once | 1 or 3 |
| Writer transport failure | Today's retry of the writer call only. Not a new gate. | — |

The engine page is `pageWhenClauseWithheld` (`fateAutoplay.ts:2092`, `useGame.ts:3237`). It does not roll dice again and does not award XP. Blocked-paint continues to withhold XP only. It does not replace a non-empty page (`fateAutoplay.ts` around the `28l` comment). `ledgerActionStitch` (`completedEventPacket.ts:1303`) runs only when the page is empty, as it does now.

## Story RPG and tabletop

One function, one checker prompt, one verdict merge.

Story RPG facts in the packet include the companion's stored goal, whether they refused or disagreed, and recall of an old line when the player calls it back. Tabletop facts include unconscious and dead (`writerTurn.ts` dying checks, which stay as local verdicts: a sentence that walks a dead character is `new-or-wrong`). Tabletop's word cap, `capBeatWords` (`writerTurn.ts:652`), is not part of the fact gate. It may run after a kept page, only in `dnd`, until John retires it. It must not trigger a rewrite or an engine page.

Kid-mode gore and the gold-shape line (`fluidProseRails.ts:49`) stay prompt voice. They are not verdicts and they cannot withhold a page.

Chips stay on the button pad. They are not prose.

## Cost per turn

Counts are hosted model calls. Packet assembly is code.

| Path | Today | This gate |
|---|---|---|
| Clean page | Writer + check = 2. The page is often still replaced. | Writer + check = 2. The page is kept. |
| Bad facts | Writer, sometimes a blocking rewrite, sentence repair, clause check, clause repair, second check, sometimes a third. 9 Nov repair turns used 5–7 calls. | Writer + check + one repair + one recheck of the bad ids = 4. |
| Check failed | Writer + check, then the engine page. Often 2. | Same, 2. |
| Style rewrite | `draft-rewrite` on 2 turns of each companion tape, then the clause gate still dropped the page. | Not called. |

9 Nov tape: 76 calls across 22 turns. 8 Nov: 80 calls across 22 turns. Most of those calls did not buy a published sentence. This gate spends 2 on a clean turn and caps a dirty turn at 4, and the clean turn keeps the prose. No training call, no `calls.jsonl`, no extra critic.

## Inventory

Lines are main `210e3da1` unless marked PR 7. "Fold in" means the fact it protects becomes a verdict in the one pass, and the old rewriter stops touching prose. "Retire" means it no longer runs on the publish path.

| Layer | Where | Decision |
|---|---|---|
| Fact sheet in the prompt | `completedEventPacket.ts:1512` | Keep. Completeness fills it first. |
| Engine result line | `completedEventPacket.ts:1530` | Keep. Explicit `none` when empty. |
| Mention allowlist and `@tN` | `:1544`, `:1644` | Keep. Local name verdict uses the same list. |
| Line quota and "smells are spent" | `:1594` and the 3–5 line branch above it | Retire. |
| Townsfolk wants, offers, locks | writer body around `:1561` | Keep. Facts. |
| Recall lines | PR 7 `sceneBlock.ts` `recalledSaidLines`; not on main | Keep once present. Packet completeness includes them. Do not invent them on main before that code exists. |
| `writerLeafBlock` repeat drop | `completedEventPacket.ts:1373` | Keep. Drops a duplicate sheet line, not colour. |
| Render draft | `writerTurn.ts` `renderWriterDraft` | Keep. |
| Too thin, 4–6 sentences | `writerTurn.ts:130` | Retire. |
| Collage, atmosphere reprint, same-room essay as a rewrite | `writerTurn.ts:133–151` | Retire the rewrite. Exact-repeat trim replaces them. |
| Unresolved engine result, unsettled fight | same function | Fold in as local verdicts. |
| Echo of the typed act | `dropPlayerActEchoOpening` `writerTurn.ts:357` | Keep as a local trim of that opening sentence only. The prompt line that says the act is already on screen stays. |
| Unseated speaker, invented PC speech, dead character acting | `writerTurn.ts` seat and dying checks | Fold in as `new-or-wrong` spans. |
| Blocking rewrite and last-resort page | `runWriterTurnWithFightRetry` `writerTurn.ts:470` and `:581` | Retire the rewrite and the last-resort page. Engine page belongs only to the fact gate. |
| `normalizeCommittedProse` recycle and same-beat trim | `writerTurn.ts:1028` | Retire the fuzzy trim. Keep quote ownership (the PC's words stay theirs) and the punctuation tidy. |
| Tabletop word cap | `writerTurn.ts:652` | Leave outside the gate, `dnd` only, until John decides. |
| Clause check entry | `checkAndRepairProse` `clauseCheck.ts:246`; calls at `fateAutoplay.ts:2055`, `useGame.ts:3214` | Replace with the one gate. |
| Whole-draft withhold on a skipped sentence | `clauseCheck.ts:382` (`de4f03a6`) | Retire. A skipped id fails the check. A `new-or-wrong` span is all that is removed. |
| `supportedFactInsideSentence` | `clauseCheck.ts:148` (`58b4ff49`) | Retire. No short quote covers a sentence. |
| Empty, throw, bad parse | `645f9f578` behaviour in `runClauseCheck` | Keep as check-failed → engine page. |
| Serious fact, one repair | M4 header and `de4f03a6` | Fold in. One batched repair, then delete the span. Siblings stay. |
| Colour taxonomy | `clauseCheckPrompt.ts` | Keep as the checker's labels. |
| `runWarden` prose scrub | `warden.ts:60`, comment at `:225` | Fold name, item, and manifest hits into local verdicts on the real draft. Chip notes stay on the pad. |
| `applyProseWarden`, `scrubEntityMadLibs` | `proseWarden.ts` | Retire. Not on the live path. Do not wire them back. |
| `scrubFalseArrivalWhenHere` | `proseWarden.ts:128`, still called from Fate and live | Fold in as a verdict. Delete the later scrub. |
| Fact locks, camera, one-camera fight | `factLocks.ts:163`, `enforceCameraOnProse` | Fold move and place lies into verdicts. Camera state updates stay. They do not rewrite a kept sentence that does not claim a move. |
| Invented geography, leak scan | `narrativeHarvest.ts:329`, `fateAutoplay.ts:2357` and `:2370` | Fold geography into the exit verdict. Keep leak scan for mechanic tags only. It does not judge story. |
| Governance prose rewrite | `applyGovernanceToProse` | Retire as a prose rewrite. Notes may still withhold XP. |
| Blocked paint | Fate, `28l` comment | Keep as XP only. Stitch only an empty page. |
| Readability gate | `readabilityGate.ts:151` | Keep as a score. It must not rewrite. Its mad-lib detector stays a detector. |
| Gold shape | `fluidProseRails.ts:49` | Keep as optional prompt voice. Not a verdict. |
| Chips | choice pipeline, warden pad notes | Keep off the prose path. |
| Diagnostic withhold label | PR 7 only | Keep the idea: the tape records `check-failed`, `repaired`, `span-removed`, or `kept`. It does not change the decision. |

## Tests

Existing tests keep their spirit. They do not keep the whole-page drop.

- `clauseHoldAndTalkLeaf`: `UNCHECKED_SENTENCE_9f3c opens the vault` is not published. `Mira answers you` beside it is published when that sentence is `colour` or `allowed`. A one-word or dot claim does not cover another sentence (`UNCHECKED_VAULT_9f3c`).
- A serious unsupported fact (`A dragon lands on the furnace`) is repaired or removed. `The bathhouse waits` stays.
- A new test: "The cloak is on the peg and Mara hands you the vault key" with sheet support only for the cloak keeps the cloak words and does not keep the vault key. This locks the removal of `supportedFactInsideSentence`.
- A missing id in the checker JSON publishes the engine page, not the draft, and does not call repair.
- An explicit empty exits field does not cause a later deletion of a sentence that never named an exit.
- Colour-only draft: no repair call, prose unchanged.
- Tabletop: a sentence that walks a dead character loses that span. The word cap, if still on, does not call the model.

Replay, offline, no new model calls:

- Companion tapes stay private and gitignored. 8 Nov `turns.jsonl` sha256 `639e17cf15fd06e9719d24c5fcd1f943ac85413a9d056125a248176a7e76f6d0` (249428 bytes). 9 Nov `0310ab6f685bed17c6eddc59600bc9deef2f600a572d872809763f733780e0cb` (252983 bytes). Do not commit them. Do not point the bank at the 9 Nov tape.
- Baseline already measured. 8 Nov: 1 of 22 turns accepted, and `finishCommittedProse` to the next stage shrinks 21 turns. 9 Nov: 3 of 22 accepted, 13 `uncovered`, 5 `repair-dropped`, 1 `serious`. Checker claim lists were not stored, so a numeric "sentences that would survive" cannot be computed from those files. The implementation must not invent those lists.
- What replay can prove without a model: engine predicates on the 91 private tapes and on the companion tape still pass when the writer is the mocked tape, because those predicates read state and the packet, not the published adjective. Prose-survival improvement is measured on stubbed checks in unit tests, plus a report of the baseline counts above. A live re-score of the 91 drafts would be a new recording and is out of scope.
- Expected direction, not a promised percentage: a stub that marks only true `new-or-wrong` spans keeps the other sentences on the 13 uncovered turns. Today's code keeps none of them.

## Migration and rollback

1. Add the gate beside `checkAndRepairProse`. Fate and live call it. Do not leave the old call next to it.
2. Delete the retired prompt lines and the blocking rewrite in the same change, so a turn cannot be rewritten for thinness and then checked.
3. Move local fact checks off the post-page scrub list so they cannot run twice, once as a verdict and again as a regex on the stub.
4. Run the unit tests and the replay bank. The bank's missing-tape failure stays a hard failure.
5. Rollback is reverting that commit. There is no runtime flag to leave both stacks on. Two stacks is how the current page dies twice.
6. Do not merge to `main` until John accepts the replay report. A merge to `main` starts a Vercel production deploy of the client. Supabase `gm-turn` does not deploy by itself. This spec's merge, while it is docs only, still rides that Vercel hook if it lands on `main`.

## Open questions

1. Tabletop word cap: keep it after the gate, or drop it with the other quotas?
2. Exact-repeat trim: should "look again" keep a repeated sentence when the player's line asks to look?
3. Recall is on PR 7, not on this base. Should the gate wait for that packet, or ship and treat recall as absent until those lines exist?
4. One repair call for every bad span in the turn is what this spec prices. Is a separate repair call per span required instead?
5. Gold-shape and kid-mode stay prompt-only. Confirm they must never become verdicts.
6. Should the diagnostic tape record `check-failed`, `repaired`, `span-removed`, and `kept`, as PR 7 started to do for withhold causes?

## Out of scope

No code in this change. No model call. No edit to the companion bank coordinates. No new recording. No merge and no deploy. The 8 Nov checker replies stay missing. This spec does not reconstruct them.
