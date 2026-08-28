# Path A ship — implementation note (2026-08-29f)

**Stamp:** `2026-08-29f`  
**Bundle:** Hide/show chrome + stitch opener variety  
**Prior:** `docs/research/path-a-ship-implementation-2026-08-29e.md`

## Shipped

| Item | Module |
|---|---|
| Hide taps never undone by opening `saveId` flip | `CenterPanel` `userSetHideRef` |
| Hide text is a tappable restore, not a black void | `HiddenStoryRestore` |
| Hide options also hides TURN_ASK (opening has no chips) | `CenterPanel` / `NarrativeView` |
| Wider stitch banks + unused card beat + no stacked name-ask | `openingStitch` |
| Vitest | `playtest29fHideOpener` |
| Stamp | HUD / index / `BUILD_STAMP` = `2026-08-29f` |
| Mid writer | **OFF** |

## Residual

New Game still falls back to stitch when the opening GM call is empty or times out. Unique page one still needs a live writer.

## Redeploy

Client only. Hard refresh after Vercel lands.
