# Leading-sentence collage (Class D) — 2026-08-30Z

**Live:** Josie playtest. HUD at capture was `2026-08-30S` (transcript stamp `2026-08-30l`). Dump: `docs/bugs/playtest-2026-08-30-josie/` (`synaptic-play-22a4f976-fc6f-467c-9af7-6927eaefd5d5.md`, `INGEST.md`).

**Player:** a new GM beat **repeats sentences from two different previous messages**, then continues with original text (a man with a stern face).

## Why 30R missed it

30R rejects a **near-clone of the whole beat** (fingerprint Jaccard ≥0.85). This draft’s tail is new, so whole-beat similarity stays under the bar. Only the **prefix** is recycled — a stitch of beat A + beat B.

INGEST also records a full opening reprint on “Ask what is going on” (T0↔T1). That is the whole-beat case 30R already covers. This ticket is the prefix collage that slipped.

## Overlapping sentences (from the dump + screenshot)

**Turn 5 — walk the door** (`synaptic-play-22a4f976-…md`):

> The heavy door groans in protest as you push the blue panel, its hinges protesting with a sound like a dying beast.

**Turn 6 — examine the room:**

> The air in the room hangs heavy, thick with the smell of damp earth and the faint, sharp tang of ozone, a lingering scent from the bombardment. Dust motes dance in the weak light filtering from the doorway you just passed through, illuminating the stark, unfinished nature of this space. Cracked stone walls rise around you, rough-hewn and unadorned, suggesting this is a foundational or utilitarian area rather than a place of comfort.

**Later beat (screenshot collage)** starts with Turn 5’s door sentence, then Turn 6’s ozone / dust / cracked-stone sentences, then new text:

> A man with a stern, weathered face, clad…

## Fix

Ledger only (SNAPSHOT already has NO RECYCLE — not ballooned):

- `detectLeadingCollage` — first N sentences / first ~40–80 words vs last K GM beats (sentence Jaccard / containment). Stitch = prefix from beat A + mid from beat B.
- Strip the recycled prefix when the tail has new concrete content (door / new room / new NPC).
- Retry once (same as unasked clone) when the whole draft is collage with no tail.
- Player “say that again” is allowed.
- Wired in `applyGovernanceToProse`, `useGame` quality retry, `fateAutoplay` novelty retry.

HUD `2026-08-30Z` / BUILD `2026-08-30s`. Mid writer OFF. Vitest `playtest30zCollagePrefix`.

**Residual:** short shared phrases (“the door”) are ignored on purpose so ordinary room talk is not stripped.
