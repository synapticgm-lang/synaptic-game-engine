# Playtest 2026-08-28 — That turn did not land (twice)

**Stamp on device:** `2026-08-29g`  
**Session export:** `ea0a9a62-dab5-48c7-8d38-0dbda351487f` (Continue — buffer empty)  
**Class:** A (turn / proxy) + B (opening GM dead)

## What John saw

Chip **Speak to whoever is dealing with you** after name Jax. Toast twice: “That turn did not land. Your line is back in the box.” Hide/Show on 29g.

## What the dump actually has

Continue rotated `sessionId` and wiped TURN_START/ERROR. `recentTurns` still show:

1. Stitch opener (mass-summon + spice + What name?)
2. `My name is Jax whays yours`
3. Local `stitchOpeningContinue` 33ms later (“The room holds still… Sevenfold Circle — four rings”)
4. Player chip with no GM reply

## Owner

`useGame` opening `callGm(..., freeCallRef)` — `freeCallRef` is not defined. Every opening/continue GM throws ReferenceError, silent stitch. First real GM after that is the speak chip; fail classified as `unknown` (generic toast). Continue then erased the fail log.

## Fix (local)

- `callOpeningGm` — real `callGm` args, `result.text`
- Classify TypeError/ReferenceError / `GM proxy error` / blank
- Keep previous session buffer on Continue so the next export includes it
