# Playtest — first turn no options + client_bug (2026-08-30e)

Session `c6adf30f-8b63-4397-a714-ab156cd0262b` · device `0d4efcbc-ad46-4ddc-917a-b9ef095b6f68`  
Android Chrome · 384×693 · Free · classic · `fastSetupChips: false` · stamp **2026-08-30e**

Dump: `synaptic-debug-c6adf30f.json` (if present — extracted from John's export).

## Screenshot 1 (locked after "Jax")

- Name cover answered **Jax**. Next beat landed (Registration Complete + Circle's Price).
- Textarea locked. Choice chips empty.
- Hide options / Hide text chrome visible; first shot looked like Hide options on.

## Screenshot 2 (after reload — this note)

- Options **visible** (Hide options / Hide text both showing — chips on).
- Chips: Examine the damaged building more closely / Check the contents of your bag / Inspect the immediate surroundings / Approach the doorway to Corridor / Fate's Pick
- Tapped **Examine the damaged building more closely** → player bubble
- Toast: **A client bug blocked this turn. Soft refresh and retry — report if it repeats.**
- Green **Saved** badge overlapping the toast
- **Rewind 1 Turn** visible behind the toast

## Root causes (Class A)

### C — `sendAction` client_bug after chip tap

**Thrown:** `ReferenceError: Cannot access 'nextTurn' before initialization`

Prose-warden / harvest used `nextTurn` (exit authority, recently-cleared encounter, `harvestNarrativeIntoLedger`) **before** `const nextTurn = liveCurrent.turn + 1`. Same TDZ class as 25d `establishmentChoices` / 21a `classifyStance`.

`classifyTurnFailure` maps `ReferenceError` + `/Cannot access/` → `client_bug` → that toast.

### A — opening GM empty input

`callOpeningGm(state, '', settings)` → gm-turn `400 playerInput is required` → stitch fallback.

### B — chips + locked box

`resolveOfferedChoices` returned `[]` while opening pending + `fastSetupChips: false` (ignored last GM `offeredChoices`).  
`sendAction` `finally` cleared `busy` but left `turnPhase` at `reading`/`resolving` after opening continue → textarea locked until reload.

## Fixes (not committed unless John asks)

- Move `nextTurn` above the warden/harvest block; idle `reading`/`resolving` in `finally`
- `callOpeningGm` sends `(opening)`; gm-turn accepts blank as `(opening)`
- ActionBar pad falls back to last GM `offeredChoices`
