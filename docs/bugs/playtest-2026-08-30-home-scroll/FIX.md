# Home cannot scroll + title has no panel (Class E) — 2026-08-30U

**Live:** engine.vercel.app / Chrome Android. Josie (playtest). HUD at capture was pre-`2026-08-30U`.

**Player:** home/title cannot scroll. Active Save (“Glass Harbor Letters — 15 Aug 2026”) is cut off at the bottom of the viewport. No scrollbar. Asks: “Is there meant to be a background to the text?”

**Screenshot:** `screenshot.png` (copied from the playtest capture).

## Root cause

Class E viewport lock from the 21e/21g play shell:

1. `html, body, #root` use `height: 100svh; max-height: 100dvh; overflow: hidden` so in-play drawers and story do not bounce the page.
2. `MainMenu` sat in that locked root with `min-h-screen overflow-hidden` and no `overflow-y-auto` / `min-h-0` scroll child.

Content taller than the short Android Chrome viewport (logo + title + hub tabs + three action buttons + Active Save) was **clipped**. The page itself could not scroll.

The title panel was **missing**, not punched-through (26l Hide-text class). “SYNAPTIC GM” and the tagline sat on the landscape gradient / book art with no opaque scrim.

## Fix

- `.sgm-home` fills `#root` (`h-full min-h-0 flex-1`) and scrolls (`overflow-y-auto`) with safe-area bottom padding so Active Save + legal links stay reachable. Play-shell `#root overflow:hidden` is unchanged.
- `.sgm-home-title-panel` — theme-aware opaque panel (`--sgm-panel` / `--sgm-accent`). Material kits force `background-image: none` so atmosphere does not punch through.
- Mobile logo slightly smaller (`140px` / `220px` desktop) so the first screen is less cramped.
- HUD `2026-08-30V` / BUILD `2026-08-30o` (same batch as site-wide scroll). Mid writer OFF.

## Site-wide follow-up (John: scroll broken on other pages too)

Same `#root overflow:hidden` lock. Shop / Themes / Profile already live inside `MainMenu` (home column). Settings, GM Library, New Game, Debug, Quest Journal used `flex-1 overflow-y-auto` **without `min-h-0`**, so the body grew and the modal `overflow-hidden` clipped — no scroll. Legal / Credits / Setup used `min-h-screen` with no inner scroll.

Unlocked via `.sgm-scroll-page` + `.sgm-modal-body`. Play log and drawers already had their own scroll; 21i closed-drawer `translate` (not `w-0`) and 26l opaque story panel kept.

**Residual:** not verified on a physical Android Chrome device.
