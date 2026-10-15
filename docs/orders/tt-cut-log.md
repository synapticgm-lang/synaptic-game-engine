# tt-cut log — every deleted regex, list, function, module and field

Every item below can be restored with git.

- **tt-fix-15:** deleted in the tt-fix-15 commit (stamp `2026-10-15b`). The old text lives at its parent, **`ca67deec`**. Line numbers in that section are at `ca67deec`.
- **tt-fix-13:** deleted in the tt-fix-13 commit (stamp `2026-10-14z`). The old text lives at its parent, **`16ef28f5`**. Line numbers in that section are at `16ef28f5`.
- **tt-fix-12:** deleted in the tt-fix-12 commit (stamp `2026-10-14y`). The old text lives at its parent, **`38ce08f0`**. Line numbers in that section are at `38ce08f0`.
- **tt-fix-11:** deleted in the tt-fix-11 commit (stamp `2026-10-14x`). The old text lives at its parent, **`0339063c`**. Line numbers in that section are at `0339063c`.
- **tt-library-2:** deleted in the tt-library-2 commit (stamp `2026-10-14w`). The old text lives at its parent, **`a76a19d6`**. Line numbers in that section are at `a76a19d6`.
- **tt-fix-10:** deleted in the tt-fix-10 commit (stamp `2026-10-14v`). The old text lives at its parent, **`6869ec1b`**. Line numbers in that section are at `6869ec1b`.
- **tt-fix-9:** deleted in the tt-fix-9 commit (stamp `2026-10-14u`). The old text lives at its parent, **`68d01a47`**. Line numbers in that section are at `68d01a47`.
- **tt-fix-8:** deleted in commit `8a55f995` (stamp `2026-10-14t`). The old text lives at its parent, **`e8c0e072`**. Line numbers in that section are at `e8c0e072`.
- **tt-cut 2:** deleted in commit `cd2b8724` (stamp `2026-10-14s`). The old text lives at its parent, **`0e2419cb`**. Restore one file with `git show 0e2419cb:<path> > <path>`, or one item by copying its lines from that output. Line numbers below are the line numbers at `0e2419cb`.
- **tt-cut 1:** deleted in commit `1f50ec5c` (stamp `2026-10-14r`). The old text lives at its parent, **`56c53ce5`**. Line numbers in that section are at `56c53ce5`.

A "swap" entry means the local copy was deleted and the call now uses the shared helper with the same body (`engineFactPatterns.escRe` = `s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`; `engineFactPatterns.narrationOf` = `(s ?? '').replace(/["“][^"”]*["”]/g, ' ')`). Behaviour is identical, so restoring a swap is only needed if the shared helper changes.

---

## tt-fix-15 (restore from `ca67deec`)

1. **`src/game/writerTurn.ts` lines 530-536 and 562-566**: `const destination = [...]`, `const namesDestination = (s) => ...`, `const event = thisTurnsEventCheck(check, refEnumOf(check.state, packet))`, `const only = (has) => (s, draft) => ...`, `const onlyDestination = only(namesDestination)`, `const onlyEvent = only(event)` and `const keep = unchanged || (!ok && !/@t\d+\b/.test(f.sentence) && onlyEvent(f.sentence, prose)) || (!ok && f.flag === RECORD_READOUT && onlyDestination(f.sentence, prose));` in `repairRejectedSentences`. What they did: kept a flagged sentence on the page when its repair failed or came back unchanged, if it was the only sentence telling this turn's event or naming the destination. Removed by order item 2 (whatever still fails leaves the page). `withMoveDestination` still adds the plain destination sentence when the beat no longer names it. Line 24's `RECORD_READOUT` import went with it.
2. **`src/game/writerTurn.ts` lines 458-460**: `function sentencePattern(sentence: string): RegExp { return new RegExp(sentence.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')); }`. Single use; folded into `replaceDraftSentence` as `new RegExp(sentence.trim().split(/\s+/).map(escRe).join('\\s+'))`.
3. **`src/game/writerTurn.ts` line 292 (swap)**: `const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');` in `speakerHere`. Swapped to `escRe`. The inline escapes at lines 357, 422 and 658 are swapped the same way. The `escRe` import is new at line 25.
4. **`src/game/tokenProse.ts` lines 433, 487, 491, 566, 682, 710, 854 (swap)**: seven inline `x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` copies. Swapped to `escRe(x)`, which the file already imported.
5. **`src/game/engineFactPatterns.ts` lines 33-36**: `export function factHasTimeRecord(engineResult)`, which returned whether the time/travel record regex matched the engine result. It had one caller (`travelRecordRead`, same file), so the regex now sits inline there with the same text.
6. **`src/game/engineFactGate.ts` lines 72-75**: `export function rollContradictionProblem(state, sentence) { return rollContradiction(sentence, pcSubject(state), engineFact(state)) ? ROLL_CONTRADICTION : null; }`. It had one caller (`engineFactProblems`), so the expression now sits inline in that list.
7. **`src/game/beatCommitGate.ts` lines 75-81**: `function distinctiveTokens(raw)`, which lower-cased, stripped punctuation, split and kept words of 5+ letters not in `SLOT_STOP`. It had one caller (`slotMentioned`), so the same chain now sits inline there.
8. **`src/game/chipLegality.ts` lines 37-42**: `function nameTokens(name)`, which took `low(name)`, dropped a leading article, split on space, apostrophe and hyphen, and kept 3+-letter tokens other than the/of/and. It had one caller (`mentionsName`), so the same chain now sits inline there.
9. **`src/game/types.ts` line 1060**: `TravelJourney.hoursToday?: number` (it reset with each journey). Replaced by `GameState.roadDay` on the world clock (order item 1). The `travelJourney.ts` uses at 1130, 1207, 1388-1390, 1419 and 1555 now read `roadHoursToday(state)`.

---

## tt-fix-14 (restore from `69e19dce`)

1. **`src/game/writerTurn.ts` lines 99–101 (swap)** — `function sentenceCount(prose: string): number { return (prose.match(/[^.!?]+[.!?]+["')\]]*/g) ?? []).filter((s) => s.trim().split(/\s+/).length >= 3).length; }`. What it did: counted 3+-word sentences for the "Too thin" draft check. Same body as `tokenProse.storySentences` (now exported); line 131 calls `storySentences(text)` and the line 11 import adds it.

---

## tt-fix-13 (restore from `16ef28f5`)

1. **`src/game/arcDirector.ts` lines 736–739** — `} else if (r.startsWith('Encounter:')) { lines.push(r); } else if (r.startsWith('Encounter cleared:')) { lines.push(r);` in `formatArcStatusReceipts`. What they did: let the encounter lines onto STATUS by their exact prefix, so the new "Encounter ended:" line (a fight lost or fled, lap 17 N5) would have been dropped. Folded into the engine-line prefix regex on line 740 as `Encounter(?: cleared| ended)?`; every encounter line takes the same code path.

---

## tt-fix-12 (restore from `38ce08f0`)

1. **`src/game/arcDirector.ts` lines 736–737** — `} else if (r.startsWith('XP Gained:')) { lines.push(r);` in `formatArcStatusReceipts`. What it did: let a paid XP line onto STATUS, while the engine's "XP: none (… — reason)" line on an unpaid kill fell through every branch and was dropped (lap 16 N1, F T11/T21). Folded into the engine-line prefix regex on line 742 as `XP(?: Gained)?`, so both lines pass with the same code path.

---

## tt-fix-11 (restore from `0339063c`)

1. **`src/game/choicePipeline.ts` lines 709–711** — `if (/\b(door|gate|path|corridor|alley|gap|arch|rubble)\b/i.test(storyProse)) { options.push('Force a path forward'); }` in `sceneSafeFallbacks`. What it did: offered "Force a path forward" whenever the prose named a door, gate, path or rubble. No engine action stands behind that chip (no roll, no exit, no room), so the writer improvised a dead turn (lap 15 F T4–T6, D T12). Nothing replaces it; the other scene-safe fallbacks stay.
2. **`src/game/choicePipeline.ts` line 372** — the `force a path forward|` alternative in the `isLegalEnginePad` regex. What it did: trusted that chip as an engine pad, so it skipped the grounding filter. With no engine action it is not an engine pad. The regex stays with that one alternative removed.
3. **Single-use helpers folded into their one caller** (same body, no behaviour change; restore only if a second caller appears):
   - `src/game/chipLegality.ts` `gmBodies` (lines 140–142), `cameFrom` (174–177, its doc line kept as a comment at the call), `lastPlayerLine` (300–302).
   - `src/game/engineFactGate.ts` `openQuests` (lines 42–44).
   - `src/game/tokenProse.ts` `keepCleanLines` (lines 1012–1014).

---

## tt-library-2 (restore from `a76a19d6`)

1. **`src/game/tokenProse.ts` line 58** — `const LINE_FNS = new Set<LineFn>(['place', 'action', 'speech', 'react', 'hook']);`. What it did: the line kinds a writer line may have. Replaced by the zod enum `tokenBeatSchema.LINE_FNS` (one list for the request schema and the reply reader).
2. **`src/game/tokenProse.ts` lines 61-63** — `const TOKEN_USES = new Set<TokenUse>(['speaker', 'actor', 'addressed', 'corpse', 'prop_used', 'worn', 'place']);`. Replaced by the zod enum `tokenBeatSchema.TOKEN_USES`.
3. **`src/game/tokenProse.ts` lines 65-83** — `const TOKEN_USE_ALIAS: Record<string, TokenUse> = { prop: 'prop_used', item: 'prop_used', object: 'prop_used', thing: 'prop_used', kit: 'worn', gear: 'worn', equipped: 'worn', location: 'place', setting: 'place', person: 'actor', npc: 'actor', character: 'actor', subject: 'actor', target: 'addressed', listener: 'addressed', body: 'corpse' };`. **Moved, not lost**: same 16 entries in `tokenBeatSchema.ts` (`USE_ALIAS`), read by the zod `use` field. Still needed for the no-schema Fireworks writer.
4. **`src/game/tokenProse.ts` lines 85-89** — `function readTokenUse(raw: string): TokenUse | null { const u = raw.trim().toLowerCase().replace(/[\s-]+/g, '_'); if (TOKEN_USES.has(u as TokenUse)) return u as TokenUse; return TOKEN_USE_ALIAS[u] ?? null; }`. Replaced by the zod `use` transform (same rule, default `actor`).
5. **`src/game/tokenProse.ts` lines 176-193** — the hand coercion of `parsed.refs`: `const parsed = JSON.parse(json) as { candidates?, refs?, lines? }; if (Array.isArray(parsed.candidates)) return null; if (!Array.isArray(parsed.refs) || !Array.isArray(parsed.lines)) return null; … for (const row of parsed.refs) { if (!row || typeof row !== 'object') continue; const rec = row as {…}; const tok = String(rec.tok ?? '').replace(/^@/, '').trim(); const id = String(rec.id ?? '').trim(); if (!tok) return null; const use = readTokenUse(String(rec.use ?? '')) ?? 'actor'; if (id.includes('<')) continue; refs.push({ tok, id, use }); }`. Replaced by `tokenBeatSchema.readWireBeat` (zod `WireBeat` / `WireRef`), which also collapses a ref declared twice.
6. **`src/game/tokenProse.ts` lines 203-210** — the hand coercion of `parsed.lines`: `if (!row || typeof row !== 'object') continue; const rec = row as {…}; const fn = String(rec.fn ?? '').trim() as LineFn; const text = String(rec.text ?? '').trim(); if (!LINE_FNS.has(fn) || !text || …) continue; const typed = rec.speaker_tok != null ? String(rec.speaker_tok).replace(/^@/, '').trim() : '';`. Replaced by zod `WireLine` (the two placeholder regexes stay in tokenProse).
7. **`src/game/tokenProse.ts` lines 615-619** — `export function refEnumOf(state, packet)`. **Moved, not lost** to `tokenBeatSchema.ts` (re-exported from tokenProse) so the request path can build the schema without loading tokenProse.
8. **`src/game/rules/srdMonsters.ts` line 47** — `const s = (STR, DEX, CON, INT, WIS, CHA): Attributes => ({ … });` (score helper for the hand table). Not needed: scores come from the SRD data.
9. **`src/game/rules/srdMonsters.ts` lines 49-87** — the hand-typed `SRD_MONSTERS` table: every number of the 10 blocks (cr, ac, hp, hpDice, speed, scores, passivePerception, darkvision, gear, vulnerable, attack name / toHit / damage / type / extra). They were 2014 values in places (Giant Rat DEX 15, Perception 10, +4, 1d4+2; Skeleton AC 13; Shadow 16 HP 3d8+3; Giant Spider poison 2d8). Replaced by `src/data/srd/srd521.json` (SRD 5.2.1). Kept in code as the engine overlay: id, `kind`, the attack's name, `match`, ghoul `rider`, wolf `inflicts`, zombie `undeadFortitude`.
10. **`src/game/rules/spells.ts` lines 67-117** — the `level: N, classes: [...],` fields of all 47 `SPELLS` entries and `concentration: true` on the Concentration ones. All 47 matched the SRD data exactly (checked before the cut). Replaced by `srd521.json` `spells`.
11. **`src/game/rules/magicItems.ts` lines 39-44** — `srdRarity: 'Uncommon'|'Rare', attunement: true` on Cloak of Protection, Ring of Protection and Bracers of Defense. Replaced by `srd521.json` `magicItems` (same values). Potions keep theirs: the SRD data lists them as one "Rarity Varies" entry.
12. **`src/game/openRouterChat.ts` line 348** — not a deletion: `required: ['fn', 'text']` became `['fn', 'text', 'speaker_tok']` with `speaker_tok` nullable. The old schema was invalid in strict mode (gpt-5-mini answered 400 every time and the turn re-posted without the schema).

## tt-fix-10 (restore from `6869ec1b`)

1. **`scripts/factCheck.mjs` lines 46-47** — `const PERSON_ACTS = /^\s+(?:\w+\s+)?(?:stood|said|says|watched|stepped|looked|called|asked|walked|came|sat|nodded|pointed|laughed|turned|waited|kept|held|ran|spoke|told|shouted|blocked|moved)\b/i;` and its uses at lines 422 (`if (!PERSON_ACTS.test(after)) continue;`) and 482 (quiet-stretch meeting `.find((m) => PERSON_ACTS.test(…))`). What it did: a person word counted only when a listed verb followed it, so "a lone traveller on the road" was never checked. Replaced by reading who is here from the engine's records (`peopleText`: HERE block, person/companion refs, presentNames, engine result, receipts); the meeting check reads an article or count before a person word.
2. **`scripts/factCheck.mjs` line 52** — `'fence'` in the `PEOPLE` list. What it did: counted a garden fence as a person. Dropped; nothing else covers it (it is not a person).
3. **`scripts/factCheck.mjs`** — the item check's `x.replace(/s$/, '').endsWith(w)` (written during this step, not at the parent) → `x.endsWith(w) || x.endsWith(\`${w}s\`)`. Same match, one regex fewer.
4. **`src/game/outdoorHubs.ts` lines 450-453** — `/** Thornferry mill / ford / landing / quay are one already-here cluster (02f / 02g). */ export function isThornferryCluster(s) { return /\b(thornferry|mill\s+landing|the ford|harbor quay)\b/i.test(s ?? ''); }`. Dead: no production caller; its only user was one `it` in `playtest02gBatch02g.test.ts` (removed with its import).
5. **`src/game/outdoorHubs.ts` lines 361-377** — `export function formatOutdoorHubsForPrompt(state)` (the `[OUTDOOR HUBS — travel targets…]` prompt block). Dead: its only caller was `src/game/situationPacket.ts` line 501 (and the edge copy), and `situationPacket` is imported by nothing in the app, the scripts or `gm-turn`. The call and the line 21 import were removed from `situationPacket.ts`.
6. **`src/game/completedEventPacket.ts` lines 1273-1292** — `export function attachCompletedEvent(state, playerInput?, extras?)` (built the packet and wrote the loiter streaks onto `sceneFacts`). Dead: no production caller; `s82RootATerminalFight.test.ts` now sets `completedEvent: buildCompletedEventPacket(…)` directly.
7. **`src/game/tokenProse.ts` lines 1142-1145 and 1147-1159** — `function missingFns(lines)` and `export function formatTokenRepairFacing(packet, missing)` (the `TOKEN REPAIR:` request text). Dead: `formatTokenRepairFacing` was imported by `useGame.ts` line 376 but never called; `missingFns` only fed `needsRepair`.
8. **`src/game/tokenProse.ts` lines 1289, 1367-1379 and the two `...(needsRepair ? { needsRepair } : {})` spreads** — the `needsRepair` result field, the parse/clean pass that built it, and the `alreadyRepaired` option (line 1275; passed only by `writerTurn.ts` line 107). Dead: nothing reads `needsRepair`. The `formatRefEnumForWriter` import (line 11) went with it.
9. **`src/game/travelJourney.ts` lines 409-412** — `function answersPlea(enc, input)` (only the plea's Help chip settled a meeting). Replaced by `answersMeeting`, which also settles a no-fight meeting passed by with its own go-by chip.
10. **`src/game/encounterTerminalFsm.ts`** — `attachLastKillOnVictory` renamed `settleFoePresence`; it now drops the foe from `present` on an escape as well as a victory (lastKill only on victory).
11. **`src/game/engineFight.ts` lines 202-207** — `meetingMove` was read only on the road path and after a pending spawn; the chip test ran the raw input (with the "but fail and they attack" tail) through `ATTACK_RE`. Now the meeting move is read first and the chip base is tested.
12. **`src/game/tabletopQuestProgress.ts`** — `tabletopStepChip` lost the travel-chip addition written during this step (the story chip's trip now reads the open step's anchor in `choiceRanking.storyChip`).

---

## tt-fix-9 (restore from `68d01a47`)

1. **`src/game/useGame.ts` lines 4639-4649** — `let mergedState: GameState = appendStateTxDiff(liveCurrent, mergedStateDraft, { combatSummary, why: … });` then `const turnReceipts = (mergedState.stateTxLog ?? []).filter((t) => t.turn === nextTurn).map((t) => \`Ledger: ${t.summary}\`);`. What it did: the live path's own record dump; every row this turn (HP, moved to, X is present, equipped, gained, quest complete) became a `Ledger:` STATUS line, and the headless fate path had no such step. Replaced by `stateTx.commitTurnRecord`, shared by live and fate, which reports only the record's grant rows (quest unlocked / complete / failed, item gained, condition, Heroic Inspiration) and skips one a line this turn already names. Line 292 import `appendStateTxDiff` → `commitTurnRecord`.
2. **`src/game/npcSheet.ts` lines 220-222** — `const job = memory?.sheet?.job; const where = memory?.location; const own = job ? \`I'm the ${job}${where ? \` here at ${where}\` : ''}\` : '';` and the fallback `'I have nothing to tell you'` with the bare `${name} said`. What it did: answered any talk with the sheet's engine role and place ("I'm the quest patron here at Greyhollow Church"), whatever was asked; a speaker with no sheet ("stranger") got an article-less denial. Replaced by an answer to what was asked (want → sheet motive or the road meeting's own want; who → the name), with `the` before an unnamed speaker.
3. **`src/game/rules/travelDay.ts` line 222 / 223** — `MEETING_WANT` entries `'word of someone they are looking for'` → `'word of someone gone missing'` and `'you gone from their stretch'` → `'you gone from this stretch'` (wording only, so the want reads in first person too).

---

## tt-fix-8 (commit `8a55f995`, restore from `e8c0e072`)

`src/game/choiceRanking.ts`:

1. **Lines 418-432** — `export function objectiveStepChip(description: string): string | null { const whole = objectiveChip(description); if (whole) return whole; … for (const m of text.matchAll(OBJECTIVE_PHRASE_BREAK)) { const cut = text.slice(0, m.index).trim(); if (cut.length > 60) break; if (cut.split(' ').length >= 2) best = cut; } return best; }`. What it did: built a step chip by cutting the step sentence at a phrase word. Replaced by `stepChip`, which joins the step's own `verb` and `object` (now on the step record, from `tabletopMainSpines` `steps`).
2. **Line 435** — `const OBJECTIVE_PHRASE_BREAK = new RegExp(\`${OBJECTIVE_TAIL.source}|\\s(?:around|for|with|toward|towards|leading|over|into|past|beyond|along|of|to)\\s\`, 'gi');` (one `new RegExp`). Only `objectiveStepChip` read it.
3. **Line 404** — the leading `,|` in `OBJECTIVE_TAIL` (`/,|;|\s(?:amidst|…`). What it did: cut a chip at the first comma ("Haul up the ruined"). Steps with a verb/object never reach it; a step without one (old saves, other modes) now cuts only at `;` or a clause word.
4. **Line 392** — `objectiveChip(obj.description)` in `storyChip` → `stepChip(obj)`; line 18 import gained `QuestObjective`.

`src/game/questPlay.ts`:

5. **Lines 807-817** (`asSeededQuest`) and **1008-1010** (`revealLocalStarterQuest`) — the per-field copies `...(anchor?.place ? { place: anchor.place } : {}), ...(anchor?.people?.length ? { people: [...anchor.people] } : {}), ...(anchor?.room ? { room: anchor.room } : {})`. Replaced by one `anchorFields(anchor)` helper that copies every set anchor field (now including `verb` / `object`). Line 17 anchor type gained `verb?` / `object?`.

`src/game/turnCheck.ts`:

6. **Lines 143-145** — `/** The prose moves the body: a walk can be told with any travel verb. */ const MOTION_TOLD = /\b(?:walk|stepp?|cross|pass|strode|stride|went|moved?|moving|continu|head(?:ed|ing)|made (?:their|his|her|your|my) way|kept (?:to|on|going|walking)|carried on|pressed on|wander|stroll|trudg|climb|descend|follow|leav|left|reach|enter|arriv)/i;`. What it did: guessed from prose words whether "Walk on" was told. The engine resolves its own journey chips; an engine chip it resolved is now trusted by `engineResolvedChip`.
7. **Lines 294-295** — `} else if (!words.length && MOTION_VERB.test(actionVerb(act)) && !MOTION_TOLD.test(text)) { down.push({ kind: 'action-object-missing', detail: \`player chose "${act.slice(0, 60)}"; the prose never moves them\` });`. Same reason. Line 36 `MOTION_VERB` import dropped with it.
8. **Lines 280-283** — `// "Check the exits" acts on this place's ways out: naming them is showing what was acted on. const exits = handedExits(after) ?? handedExits(before) ?? []; const shown = (w) => stemHit(text, w) || (stemHit(w, 'exits') && exits.some((e) => placeNamed(text, e))); if (words.length && !words.some(shown)) {`. What it did: a special case so the engine's "Check the exits" chip was not flagged. Covered by `engineResolvedChip`; a typed line is read as words again. Line 50 `handedExits` import dropped with it.
9. **Line 278** — `if (!talkish && !socialAct && !travel && !looking && !blowOwned) {` gained `&& !engineResolvedChip(after, act, offered)`; line 207 `prose: string` gained `offered: string[] = []`; line 441 passes `row.offeredChoices ?? []`.

`src/game/writerTurn.ts`:

10. **Lines 414-417** — `// Only a backed line may be quoted: with nothing on record for anyone here, the turn keeps its own lines.` and `if (!backed.size) return { ...turn, answerRepair: { ...missing, bug: 'skipped: no backed line for anyone here' } };`. What it did: left a talk turn with no answer when the person had no lore or quest lines. Replaced by the engine answering from the person's own sheet (`npcSheet.sheetAnswerLine`, the sheet `backedAnswerFacts` also reads); still no writer request. **Lines 454-459** (the inline return) moved into `landAnswer` (same body).

Tests (assertions replaced by the tt-fix-8 tests):

11. **`src/game/playtest29z4TesterTruth.test.ts` lines 66-75** — "a walk told as crossed / watched them pass is not a down" and "a walk the prose never moves is still a down" (pinned `MOTION_TOLD`). Replaced by the engine-chip test with `offered: ['Walk on', 'Turn back']`.
12. **`src/game/seed94RepairGaps.test.ts` line 127** — `expect(kinds(checkActionFollowed(s, s, 'Walk away / go another direction', 'Jax stayed by the stairs and thought.'))).toContain('action-object-missing');` (pinned the motion path).
13. **`src/game/ttCut1.test.ts` lines 102-113** — "naming the handed ways out shows what was acted on" (pinned the exits special case). Replaced by "the engine chip the engine resolved is trusted, not re-read"; the typed case still flags.

`src/App.tsx` / `src/components/SettingsModal.tsx`:

14. **`App.tsx` lines 168 and 259** — `engineMode={'litrpg'}` on the main-menu Settings (no save loaded). What it did: showed LitRPG-only sections as if they applied to every game. `SettingsModal` `engineMode` is now optional; mode-bound sections use `modeProfile.settingScope`.
15. **`SettingsModal.tsx` line 103** `const isDnd = engineMode === 'dnd';`, **line 864** `modeProfile(engineMode).autoFight`, **line 1102** `{!gameState && <p …>Start a story to enable export.</p>}` (the export section now hides with no save).

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

## tt-build-questtargets (commit `d71db37c`, restore from `4157bfd1`)

All in `src/game/tabletopQuestProgress.ts` (old line numbers at `4157bfd1`):

1. **Lines 144-150** - `function atPlace(state, place)`. Moved (not lost) to `src/game/questTargets.ts:27` with the same body, now exported; `tabletopQuestProgress` imports it.
2. **Lines 152-163** - `function atStepPlace(state, place, room)` (split `currentLocation` on the em dash; `room === 'inside'` or the room word in the inner label; outside the door -> `'door'`). What it did: said the player was at an inside step's spot in ANY room of the place, so the entry room ticked it. Replaced by `questTargets.targetSpot` (`:59`): inside a card the player must stand in the target's own room (`currentNodeId === target.nodeId`); outside at the place it is still `'door'`.
3. **Lines 197-211** - `function arrivedMoveStep(state, quest, hereBefore)` (a move step ticked when travel arrived at its place, with the step's person along). What it did: the arrival tick. Removed - John's rule: a step never ticks from an arrival alone. A move step now ticks when its person is met / its target is taken at that place (`findQuestTargets`).
4. **Line 240** - `const TALK_VERB = /\b(?:talk|speak|ask|tell|greet|approach|question|listen)\b/i;` (one regex). Moved to `src/game/questTargets.ts:24` (same text), used by `actionTakes`.
5. **Lines 243-269** - the body of `applyTabletopQuestTurn`: `said === chipKey(s.chip)` chip tick, the `doorBefore` walk-in guard, the `s.person && TALK_VERB` talk tick, and the `moved >= 0` arrival branch, and the single-quest objective rewrite. Replaced by `placeTabletopQuestTargets` + `questTargets.findQuestTargets` (`:85`): the tick happens only when the engine records a find / meet at the target (`target.foundTurn`), for every active quest.
6. **Line 168 type** - `type TakeableStep = { idx; chip; person: string | null; door?: boolean }` -> `{ idx; chip; door }` (the person rode only for the removed talk tick).
7. **Imports dropped** - `isJourneyUnderway` (only `arrivedMoveStep` used it), `peopleHere` and `matchHub` / `hubsForBibleId` (moved with `atPlace` / `targetSpot`).

Net in this file: lines 271 -> 236, regex 13 -> 11, fns 40 -> 31.

## q31-A SRD monster names in the combat log

1. **`src/game/tabletop/roundFight.ts` line 208 (at `e2a826a7`)** - `const statusName = (i) => (count === 1 ? enc.name : `${block.srd ? block.name : enc.name} ${i + 1}`);`. What it did: logged a lone SRD foe under the road label (`the restless dead`) while a group got the block name. Replaced by one `logged` name (block name when `block.srd`, else the encounter name) used for one foe and for numbered foes. The writer label (`writerName`) is unchanged.

## q31-P1 run-pacing flags are not writer turns

1. **`scripts/fate-autoplay/autoThumbs.mjs` lines 136-139 (at `3f499a47`)** - `down.push(same place ${sameLocRun} turns, no progress)` and `down.push(XP stall ${stall} turns)`. What they did: put run pacing (engine and autoplay) on a single turn's `down` list, so that turn's verdict became `down` and distill rejected the writer's prose. Moved, same conditions, to the run-level `circling.pacing` list in thumbs.json, and to a `Pacing:` line in report.md under Circling.
2. **`scripts/distillCollect.mjs` line 88** - `if (th?.verdict === 'down') why.push('local down flag');`. What it did: rejected a turn on any local flag, including pacing, chip and map flags. Replaced by `(th?.down ?? []).some(isWriterFlag)`, which uses the one writer-kind allowlist `WRITER_FLAG_KINDS` in `judgeNotes.mjs`. It reads old thumbs.json too, so no judge rerun is needed.
3. **autoThumbs JUNK and fight-contradiction strings** - the text is unchanged. They now carry a kind prefix (`junk: `, `prose: `), so `flagKind` reads them. Nothing was dropped.

## q31-scanner whole-tree rule scanner

1. **`scripts/ruleCount.mjs` lines 5-20 (at `82cb32b4`)** - the fixed `files` list of 14 paths as the only thing TOTAL counted. What it did: limited the "ruleCount TOTAL must not rise" gate to 14 files, so rules added anywhere else in `src/game` or `_shared/gm` went uncounted. Replaced by a walk of every source file under `src/game` and `supabase/functions/_shared/gm` (tests and `.d.ts` excluded). The 14 paths are kept as `old14` and printed as the `OLD14` line, so the old trend line continues. `src/game/fullProseGate.ts` no longer exists, so OLD14 counts 13 files, the same as before.
