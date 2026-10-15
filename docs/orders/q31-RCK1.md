# q31-RCK1: chips with no engine action never reach the offered list (Order RC-K1)

Stamp `2026-10-16h` (from `2026-10-16g`). Play change: offered chips are builder-bound only. Client-only (no edge / `gm-turn`).

## Cause

- `src/game/choicePipeline.ts` `isLegalEnginePad` (~391–401 at parent of this commit): after builder membership it still admitted a label when `inferIntent` was not OTHER, plus a travel/talk regex, plus `concreteChoiceObjects(...).length === 0`.
- `src/game/choiceWarden.ts` `filterInventedContextChoices` (~244–249): default-allow — keep if `isLegalEnginePad`, else keep unless `choiceInventsContext` proved invent. Unbound writer/spine labels ("Rob the traveler", "Map the first undercroft door", …) reached the list with no engine action (empty STATUS).

## Fix

- **`EngineChip { label, action }`** assembled once per state in `engineChips()` from compileChoices, beat/graph edges, hub pads, PYOA spine, scene fallbacks, dungeon card, opening offers, Story RPG / tabletop step, system prompt pad, journey pads.
- **`boundEngineChip` / `isLegalEnginePad`:** exact label or same action+target key only. No inferIntent-alone path.
- **Offered list = bound chips only.** Unbound candidates log `Removed unbound chip`. Writer wording kept when it binds.
- **PYOA:** every Thornferry/Umbra exit sealed with `action` (`pyoa:<id>` when omitted). Missing action throws at load.
- **Deleted** (logged in `tt-cut-log.md`): inferIntent/travel/talk/concreteChoiceObjects allow path in `isLegalEnginePad`; `CONTEXT_REQUIREMENTS` + `choiceInventsContext`; empty-research loot regex; warden’s duplicate label Set.

## Tests

- New: `ttRcK1.test.ts` (K1-a..d).
- Rewritten: `playtest02dHangDebug` legal-pad case; `choiceWarden.test.ts` to default-deny; `playTranscript` GM-offer fallback; `playtest30y` Place talk.

## Replay staging R1–R16

None belong to RC-K1 (R1–R4 road/dungeon/motive; R5 camp blocked no tape; R6 shop blocked; R7–R16 safety). No case added.

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 103 failing / 2842 (same count as q31-RCR1). 0 new from this order after fix-run 2. |
| replay bank | 62 failing / 652 (limit 64). |
| tsc (`tsconfig.app.json`) | 546 (limit 552) |
| build | green |

Two fix runs: (1) playTranscript fallback expectation; (2) playtest30y Place/panel assert under bind-only.

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before | 487 | 163110 | 6949 | 382 | 1194 (6317) | 11782 |
| after | 487 | 163096 | 6932 | 382 | 1194 (6317) | 11778 |

TOTAL did not rise.

## NEXT

- Migrate builders to return `EngineChip` natively (today labels are derived at `engineChips()`).
- RC-HF1: fold Fate’s `systemPad` branch into the one offered list (system chips already in `engineChips`).
- tt-build-chipcheck: dead-chip / missing-chip-kind flags on turnCheck.
- Stronger bind for near-synonyms that share a builder edge id (e.g. panel inspect wording) without reopening label allow lists.
