# Playtest 2026-08-26 — Hide options / Hide text

**Stamp on device:** `2026-08-26k`  
**Session:** `06c2d03f-4859-4873-b592-ef56b0b77139`  
**Device:** Android Chrome, viewport 384×693  
**Class:** E (chrome / HUD)

## Evidence

- `synaptic-debug-latest.json` / `synaptic-debug-session-06c2d03f.json` — New Game session, Summoned Pact opening name ask, `fastSetupChips: false`, memorable off, Phoenix Ashrise.
- Mobile screenshots: title-art bleed with **Show text**; story visible with **Hide options** / **Show options** mismatch feel.

## Symptoms

1. **Hide text** flips label to **Show text**, but center still shows full Synaptic Chronicles title art (static bg punch-through).
2. **Hide options** can say **Hide options** while no choice pads are on screen (opening chips off → empty ActionBar).
3. Toggles feel sticky-wrong after New Game / remounts during opening covers.

## Root cause (code)

1. Story panel used Tailwind `invisible` (`visibility: hidden`) to keep the flex-1 spacer so the input stays at the bottom. That hides the opaque story panel **and** its background, so `/backgrounds/bg-portrait.png` shows through at full strength — looks like "text hide failed / title art still up."
2. 25f one-time clear for opening only lived in `hideClearedForSaveRef`. Any CenterPanel remount during incomplete opening reset the ref and **re-cleared** Hide prefs from sessionStorage — undoing mid-play taps.

## Fix (26l)

- Keep flex-1 opaque panel when text is hidden; omit log children (never hide input).
- Persist "cleared for saveId" in sessionStorage so remounts do not re-clear.
- Choice pads still gate on `hideOptions` via ActionBar `hidden`.
