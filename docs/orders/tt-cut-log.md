# tt-cut log — every deleted regex, list, function, module and field

Every item below can be restored with git.

- **tt-cut 2:** deleted in commit `cd2b8724` (stamp `2026-10-14s`). The old text lives at its parent, **`0e2419cb`**. Restore one file with `git show 0e2419cb:<path> > <path>`, or one item by copying its lines from that output. Line numbers below are the line numbers at `0e2419cb`.
- **tt-cut 1:** deleted in commit `1f50ec5c` (stamp `2026-10-14r`). The old text lives at its parent, **`56c53ce5`**. Line numbers in that section are at `56c53ce5`.

A "swap" entry means the local copy was deleted and the call now uses the shared helper with the same body (`engineFactPatterns.escRe` = `s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`; `engineFactPatterns.narrationOf` = `(s ?? '').replace(/["“][^"”]*["”]/g, ' ')`). Behaviour is identical, so restoring a swap is only needed if the shared helper changes.

---

## tt-cut 2 (commit `cd2b8724`, restore from `0e2419cb`)

### A. Dead modules (whole files)

Each one had no importer anywhere in `src/`, `supabase/` or `scripts/` except its own tests. Restore with `git show 0e2419cb:<path> > <path>`. For the three with edge copies, also put the name back in `scripts/sync-gm-edge-shared.mjs` (old lines 46, 47, 60) and re-run the sync.

1. **`src/game/socialStakes.ts`** (404 lines). First line: `WS-7 Wave C: Social Stakes Templates and Non-Combat Resolution`. What it did: per-mode social stakes templates (`STAKES_TEMPLATES`, `OUTCOME_CATALOG`), `templatesForMode`, `validateOutcome`, `applyOutcomeMutations`, `getLeverageCooldown`, `enforceLeverageCooldown`. Safe because no game code imported it; it was a WS-7 prototype that only its test read. Live social play runs through `socialCrisis` / `socialSkills` / `npcRelationships`.
2. **`src/game/leverageMechanics.ts`** (294 lines). First line: `WS-7 Wave 1: Leverage Mechanics`. What it did: `registerLeverageAsset`, `exhaustLeverageAsset`, `isLeverageExhausted`, `getPressureProfile`, `resolveLeverage`, `getLeverageTypeName`, `getLeverageTypeDescription`. Safe because only tests imported it.
3. **`src/game/encounterStakes.ts`** (264 lines). First line: `WS-4 Wave 1: Encounter Stakes System`. What it did: `materializeStakes`, `isApproachLegal`, `getLegalApproaches`, `validateActionHonesty` over encounter templates. Safe because only its test imported it; live encounters run through `encounterBible` (catalog) and `encounterTerminalFsm`.
4. **`src/game/fullProseGate.ts`** (54 lines, 3 regex). First line: `Day-1 full-prose gate — shared by NarratorProvider and edge gm-turn policy.` What it did: `MIN_PROSE_WORDS` / `MIN_PROSE_SENTENCES` / `MIN_TOKEN_PROSE_LINES`, `countProseWords`, `countProseSentences`, `isFullProseNarration`. Safe because nothing imported it (the header's claim was stale); the commit gate (`classifyBeatCommit`: atmosphere-only, drought stub, recycle) and the writer turn decide a thin beat now.
5. **`src/game/folkVoiceExpectations.ts`** (354 lines) **and edge copy `supabase/functions/_shared/gm/folkVoiceExpectations.ts`**. First line: `Folk / peoples voice expectations — public-domain folklore tropes + original SynapticGM LitRPG folk.` What it did: `FOLK_VOICE_PROFILES`, `detectActiveFolkIds`, `formatFolkVoiceForPrompt` (a prompt rail). Safe because neither the client nor any edge file imported it; the writer packet no longer includes it.
6. **`src/game/speechActRails.ts`** (21 lines) **and edge copy**. First line: `Compact speech-act rails from fluid-chat F5 — social fluidity without ritual ack.` What it did: `formatSpeechActRailsForPrompt` (prompt text). Safe because nothing imported it on either side.
7. **`src/game/claimGrounding.ts`** (14 lines) **and edge copy**. First line: `Pack 11 claim-grounding directive — keep prose fluid; block invented named entities.` What it did: `formatClaimGroundingDirective` (prompt text). Safe because nothing imported it; invented names are decided by the handed-names list (`compileNounAllowlist` / `handedProperNames`) and the sealed card.
8. **`scripts/sync-gm-edge-shared.mjs`** lines 46 `'folkVoiceExpectations.ts',`, 47 `'speechActRails.ts',`, 60 `'claimGrounding.ts',`. What they did: copied the three modules above to the edge. Safe because the modules are gone.

Not deleted, although tt-sweep listed them:
- `pyoaEndingGates` is live: `mainQuestEnd.ts:10` and `storyRpgProgress.ts:33` import it.
- `qualityGovernance.turnsSinceLastEncounter` is read: `buildGovernanceSnapshotLines` (`qualityGovernance.ts:255`), which the edge `situationPacket` calls.

### B. Stale tests of the dead modules

Restore with `git show 0e2419cb:<path> > <path>` (these files had no other change this step, except `playtest02nBatch02n` below).

9. `src/game/__tests__/ws7Complete.test.ts` lines 39-50 (socialStakes import), 66-75 (leverageMechanics import), 163-267 (`describe('WS-7 Wave A: Leverage Mechanics')`), 671-758 (`describe('WS-7 Wave C: Social Stakes Templates')`), 1033-1098 (`describe('WS-7 Integration: Full Social Resolution Flow')`; it was built on leverage assets and the stakes cooldown — the relationship and social-XP parts it touched keep their own describes in the same file).
10. `src/game/playtest31aWave1Social.test.ts` line 10 (leverage import) and 136-262 (`Leverage Registry`, `Leverage Exhaustion`).
11. `src/game/playtest31bWave1Encounter.test.ts` lines 25-30 (encounterStakes import) and 363-429 (`describe('WS-4 Wave 1 — Stakes Materialization')`, B006–B010).
12. `src/game/fluidChatEval.test.ts` lines 4 and 8 (imports), 54-104 (`describe('folkVoiceExpectations')`, 5 tests), 115-121 (`describe('speechActRails')`).
13. `src/game/playtestDay1Checklist.test.ts` line 15 (import) and 112-122 (`describe('day-1 — full-prose gate')`).
14. `src/game/playtest02nBatch02n.test.ts` line 10 (`import { formatClaimGroundingDirective } from './claimGrounding';`), line 72 (`const claim = formatClaimGroundingDirective();`), lines 84-88 (five `expect(claim)…` lines: no clerk / aisle / hatchling / unnamed crowds; MUST NOT invent). The rest of that test (SNAPSHOT / packet diet) is unchanged.

### C. Never-read save fields (`src/game/qualityGovernance.ts`)

Old saves still carry these values (`{ ...prevQg }` copies them forward); nothing reads them.

15. Line 123 `lastHubLocation?: string;` and lines 658-661 `const hubLoc = nextWithNpc.currentLocation ?? ''; if (hubLoc && hubLoc !== prevQg.lastHubLocation) { qualityGovernance.lastHubLocation = hubLoc; }`. What it did: stored the last location. Safe because its only read was its own change test; the location lives on `state.currentLocation` / `journey`.
16. Line 133 `recentXpAwards?: Array<{ amount: number; reason: string; type: string; turn: number }>;` and lines 641-644 `qualityGovernance.recentXpAwards = [...(prevQg.recentXpAwards ?? []).slice(-99), { amount, reason, type, turn }];`. What it did: a rolling list of discovery XP awards. Safe because no code read it; discovery XP is retired (28a) and the find is still recorded in `discoveryLedger`.
17. Lines 134-135 `/** Last-turn craft flags … */ craftSignals?: CraftSignal[];` and line 680 `qualityGovernance.craftSignals = signals;`. What it did: stored the turn's craft flags. Safe because no code read the stored copy; the same `signals` still feed `applyCraftLearning` → `craftLedger` on the same turn.

### D. Regexes, lists and functions that duplicated the handed-names list or a shared helper

`src/game/completedEventPacket.ts` (edge copy `supabase/functions/_shared/gm/completedEventPacket.ts` re-synced with the same lines removed):

18. Lines 262-263 `const TITLE_NAME = /\b((?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?\s+){0,2}[A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/g;` — the Title-Case name regex for the scanner in 21. Safe: only 21 used it.
19. Lines 265-270 `const SENTENCE_STARTERS = new Set(['the','a','an','your','you','then',…,'first']);` (list of 33) — sentence-start stop words for the scanner in 21. Safe: only 21 used it.
20. Lines 1471-1473 `function allowlistHas(allowlist, token) { return mentionAllowlistHas(allowlist, token); }` — wrapper. Safe: only 21 called it; `mentionAllowlistHas` stays.
21. Lines 1475-1494 `export function inventedTitleCaseNotOnAllowlist(prose: string, allowlist: string[]): string[]` — scanned prose for Title-Case names not on the allowlist. Safe: no caller anywhere (including tests). The same decision is made by the handed-names list on the commit path: `inventedCastNamesInProse` (`beatContract.ts`, sealed cast + `completedEvent.allowlist`) via `isSealedCardViolation` in `classifyBeatCommit` / `sentenceGateProblems`, and `ledgerNounObey` via `mentionAllowlistHas`.
22. Lines 2394-2396 `function ledgerAdvanceBeat(state, packet?, playerInput?) { return topicAdvanceStitch(state, packet, playerInput); }` — pass-through. Safe: no caller; `topicAdvanceStitch` stays.

`src/game/tokenProse.ts`:

23. Lines 109-148 `export const TOKEN_PROSE_JSON_SCHEMA = { … } as const;` — the strict `{ refs, lines }` JSON schema. Safe: no reference; the schema actually sent is typed inline in `openRouterChat.ts` (same fields and enums).
24. Lines 1024-1026 `function escRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }` — swap to `engineFactPatterns.escRe` (identical body).
25. Line 312 and line 534 `const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');` (two local copies) — swap to `escRe`.
26. Quote-mask copies `.replace(/["“][^"”]*["”]/g, ' ')` at lines 464, 514, 537, 570 (`lineHasWrongTimeOfDay`, `lineHasUnhandedCarriedThing`, `lineHasUnhandedOwnThing`, `lineHasUnhandedFind`), 768 (local `narrationOf(line)`) and 962 (`beatPcPossessive`) — swap to `engineFactPatterns.narrationOf`, imported as `narratorWords` (the file has its own `narrationOf(line)`, which keeps its speech-line blanking).

`src/game/turnCheck.ts`:

27. Lines 94-112 `export const TURN_CHECK_P0_KINDS: ReadonlySet<TurnCheckKind> = new Set(['ghost-chip','impossible-chip','unrelated-chip','ignored-action','open-ground-interior','bad-floor-plan','unestablished-quest-place','broken-prose','sheet-forgotten','levelup-no-change','lock-without-skill','plays-player','absent-speaker','wrong-voice','lecture-ending','ghost-talk','window-touched']);` (list of 17) — the P0 kind names. Safe: no reference; `checkPlayerTurn` builds its p0 list directly.
28. Line 590 `const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');` and line 371 inline `${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` — swap to `escRe`.
29. Quote-mask copies at lines 307 (`checkActionFollowed`), 355 (`brokenProse`), 524 (`checkEmptyRoomTalk`), 559 (`checkSystemWindow`), 628 (`checkPlayCrimes`) — swap to `narrationOf`.

`scripts/factCheck.mjs`:

30. Line 316 `const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');` and the inline escapes at lines 229 (`who`), 367 (`handedWhole`), 395 (`subjectOwns`), 466 (`namesPlace`) — swap to `escRe` (imported from `engineFactPatterns`, which the checker already loaded).
31. Line 493 `HIT_WORDS.test(prose.replace(/["“][^"”]*["”]/g, ' '))` — swap to `narrationOf(prose)`.

`src/game/beatCommitGate.ts`:

32. Lines 253-256 `/** Lock C — prose that reopens a ledger-closed fact. */ export function isFactClosedViolation(state, text): boolean { return factClosedViolationReason(state, text) !== null; }` — boolean wrapper. Safe: production calls `factClosedViolationReason` directly; the 12 tests that used it now call `!!factClosedViolationReason(...)` (02aa, 02j, 02k, 02l, 02p, 02q, 02r, 02t, 02v, 02x, 02y, 02z).
33. Lines 338-341 `/** @deprecated alias — use codedSceneMove */ export function stitchCommitDelta(state) { return codedSceneMove(state); }` — deprecated alias. Safe: tests only (31p, 31r, 31t), which now call `codedSceneMove`.

### E. Looked at and kept (partial overlap; no deletion)

`proseViolatesEventPacket` and its sub-checks (instruction voice, choice list, alive-vs-dead, premature loot, wrong HERE), `isWriterMonologueLeak`, `isDirectorChromeLeak`, `isTokenSaladLeak`, `isHudCombatChromeLeak`, the charter regex in `factClosedViolationReason`, tokenProse `BODY_PART` / `PC_SPEAKS` / `lineOpensOnFactLabel` / `lineHasWrongTimeOfDay` / `lineHasUnhandedFind` / `handedRoleNouns` / `knownProperNames`, turnCheck `PROMPT_ENDING` / plays-player / destination / `BLOW`, factCheck lists and exit logic. Each covers a case the shared mechanisms do not (see `tt-cut-2.md`). `isVerbatimStallStub` and `isStitchBankFingerprint` are phrase deny-lists for old stitch text; they are not covered by the handed-names list, `thisTurnsEventCheck` or the engine records (only by the recycle window), so they stay for a later step.

---

## tt-cut 1 (commit `1f50ec5c`, restore from `56c53ce5`)

1. **`src/game/tokenProse.ts` lines 502-506** — `/** What anyone wears or is … */ const WORN_OR_BODY = /^(?:clothes|coat|cloak|hood|collar|sleeves?|…|head|hair)$/;` and `/** A handed bag covers its other names. */ const BAG_WORD = /^(?:pack|packs|backpack|satchel|knapsack|rucksack)$/;`. What they did: worn / body words and bag synonyms for the carried-thing check. Moved (not lost) to `src/game/engineFactPatterns.ts` with the same text; tokenProse imports them.
2. **`scripts/factCheck.mjs` lines 44-47** — `const GARMENTS = new Set(['boots','boot','belt','coat','cloak','hat','hood','gloves','tunic','jerkin']);` and `const BAG_WORDS = new Set(['pack','backpack','satchel']);`. What they did: let a handed "clothes" row cover garments and a handed "Bag" row cover bag words. Covered by `engineFactPatterns.WORN_OR_BODY` / `BAG_WORD` (the game gate's list).
3. **`scripts/factCheck.mjs` lines 386-387** — `if (GARMENTS.has(w) && /\bclothes\b/.test(facts.handedText)) continue;` and `if (BAG_WORDS.has(w) && /\bbag\b/.test(facts.allowText)) continue;`. Replaced by the shared-list checks.
4. **`scripts/factCheck.mjs` lines 39-42, `ITEMS` list entries removed:** `'boots'`, `'boot'`, `'cloak'`, `'coat'`, `'gloves'`, `'jerkin'`, `'tunic'`, `'hat'`, `'hood'`, `'belt'` (worn words; the list went from 180 to 157 entries across the checker). Covered by `WORN_OR_BODY` (worn things are not new items).
5. **`scripts/factCheck.mjs` line 17** — the separate import line of the shared patterns was rewritten to add `BAG_WORD`, `WORN_OR_BODY` (no logic lost).
6. **`scripts/factCheck.mjs` line 253** — `const exitClauses = s.split(…).filter(…)` over the raw sentence; and **line 311** `if (EXIT_CLAIM.test(s) && !/\b(?:counting|watching|eyeing|checking) the exits\b/i.test(s))`. Rewritten to read narration with speech masked (same masking as the item check); restore from `56c53ce5` if needed.
7. **`src/game/ledgerNounObey.ts` lines 101-107** — `function dropOrRewriteInvented(sent, invented) { for (const name of invented) { if (!name) continue; if (new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(sent)) return ''; } return sent; }` (one `new RegExp`). What it did: dropped any sentence with an invented name. Replaced by the clause cut that keeps this turn's event (`isThisTurnsEvent` from `thisTurnsEventCheck`). Line 111 doc comment `Never swap the paragraph for a drought bank.` and line 136 call `.map((s) => dropOrRewriteInvented(s, invented))` changed with it; line 116 signature `packet?: CompletedEventPacket` gained the event-check option.
8. **`src/data/campaigns/cursedKeep.ts` line 203** — `'Speak with Oskar at the Greyhollow Tavern',` → `'Speak with Oskar at the Greyhollow Inn',` (one hub name; the hub's real name).
9. **`src/game/choiceRanking.ts` line 308** — `return pick ? \`Nudge: someone nearby mentions ${pick.name}: ${pick.blurb.replace(/[.!?]+$/, '')}.\` : '';` (pasted the hub blurb every time). Replaced by `placeFirstSight`; line 19 import changed with it.
10. **`src/game/turnCheck.ts` line 299** — `if (words.length && !words.some((w) => stemHit(text, w))) {` (action-object check without exits). Replaced by the check that also reads `handedExits`.
