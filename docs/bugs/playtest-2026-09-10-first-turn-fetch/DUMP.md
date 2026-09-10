# Live play — cannot get turn 1 (2026-09-10g)

Save `b0320d44-6708-4301-a1f8-a3a9d540c366` · session `13c264af` · HUD `2026-09-10f` · infirmary · Jax already on the sheet.

**Typed:** `Where am whats going on`

No GM beat. Debug: `GM proxy network failure` × many → `Failed to fetch` → `contentSanitized is not defined`.

## Edge

`gm-turn` OPTIONS **503**:

`worker boot error: The requested module './searchContinuity.ts' does not provide an export named 'applySearchContinuityToFacts'` at `sceneFacts.ts:2`.

10f sent hall talk to `callGm` after name lock. Silent never called the proxy, so the boot hole stayed hidden.

## Owners

| Class | Owner |
|---|---|
| H | Edge `searchContinuity` stub + `openingEstablishment` stub so `gm-turn` boots |
| B | `shouldStitchOpeningContinue` includes hall Q&A again — turn 1 must not need the proxy |
| A | `keepSentLineOnFail(sanitizedInput \|\| lastInputRef \|\| input)` — never `contentSanitized` in the outer catch |
