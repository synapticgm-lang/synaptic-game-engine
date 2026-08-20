# Opening speed vs freshness — choices (2026-08-20)

John asked how to speed New Game without samey starts; floated blank-slot start cards; asked if Manus is needed.

**Verdict:** No Manus required to choose. Peers that feel fast use authored/crisis drops; we already have half the system (`OpeningBeatCard` + `fallback` + hook decks). Block on `callGm` is the slow part. Prefer **local stitch first, AI optional**.

Canvas: `opening-speed-fresh-choices`

## Choices (pick a package)

| ID | Name | Speed | Fresh | Effort |
|---|---|---|---|---|
| **A** | Instant fallback first | Fast | Med | S |
| **B** | Blank-slot mad-lib cards | Fast–med | High | M |
| **C** | Hybrid stitch (banks × banks) | Fast | High | M |
| **D** | Two-beat open (drop form) | Fast | High | M |
| **E** | Player picks opener family | Fast | Player-owned | M–L |
| **F** | Keep full AI open | Slow | Unstable | — avoid |

**Recommended:** A + C now; fold D with open tickets; E later; skip F.

## Blank-slot banks (B/C)

Per bible: Place × Presence × Pressure × Offer × Look seed × Stamp. Code fills; AI fills 0–3 blanks or Mid/High polish only.

## Manus?

Optional competitive gallery only — not blocking.
