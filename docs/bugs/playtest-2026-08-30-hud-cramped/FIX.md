# HUD cramped / truncated equipped set (Class E) — 2026-08-30V

**Live:** engine.vercel.app / Chrome Android. Josie. HUD stamp in the shot was `2026-08-30S`.

**Player:** “Top section looks cramped // can’t see what that bit on the left says (can’t click on it to see the rest either)”

**Screenshot:** `screenshot.png` (copied from the playtest capture). Left chip reads **Dark Elf Umb…**

## What that field is

Not the character name and not folk. `Hud` shows `equippedSetName(settings.uiThemeId)` on mobile — the Shop theme kit. **Dark Elf Umb…** is **Dark Elf Umbrance**. Desktop already shows `equipped set: …` under Synaptic GM.

## Root cause

One-row mobile HUD: truncated `max-w-[4.5rem]` span + stamp + ∞ turns + stacked HP/MP + bug/chevron. `title=` does nothing on touch.

## Fix

- Two-row phone HUD: set / stamp / turns / bug / chevron on row 1; full-width HP + MP on row 2 (bars stay visible).
- Left label is a button. Tap opens a popover with **Equipped set** + the full kit name. Desktop row unchanged (hover `title` still works).
- Stamp HUD `2026-08-30V` / BUILD `2026-08-30o`. Mid writer OFF.

**Residual:** not verified on a physical Android Chrome device.
