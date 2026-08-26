# Playtest 2026-08-26 — Empty search → invent + crude dagger

**Stamp on device:** pre-`2026-08-26p`  
**Save:** `91848bcd-bcc8-473e-85ea-aa92170f1f37`  
**Campaign:** The Summoned Pact (alone burnt husk)  
**Class:** D (continuity / object invent) — empty-search re-loot + ungrounded combat weapon

## Evidence

- `synaptic-transcript-91848bcd-bcc8-473e-85ea-aa92170f1f37.md` (exported turn 11)

## Relevant beats

### Empty searches (turns 5–9)

- **T5** Look around husk — ash, debris, panel; no loot.
- **T6** Outside / basement ask — no basement, no features; desolation.
- **T7** Distance ask — no woods/mountains; wasteland.
- **T8** “Search the ruin again… move the dirt and ash” → **explicit empty:** “no immediate treasures”, “picked clean by time and scavengers”, exterior “no hidden compartments”.
- **T9** Clear path deeper → **rehashes empty** (still “no immediate treasures” / “picked clean”) rather than new find — then pads invite “hidden compartments” again.

### Suddenly “finds something” + dagger (turns 10–11)

- **T10** Force path → gap + rustling → Auto-Fight engages **Ravager Hatchling** (encounter invent after empty-search authority).
- **T11** Auto-resolve prose: “**Jax’s crude dagger** flashed…” — **no dagger** in starter kit (clothes + sealed Bag only), no `<item-gain>`, no bag-open declaration, no visible prop, no loot line. Weapon is **GM invent** in auto-fight narration.

## Root cause (code)

1. **Search emptiness** was not tracked on `sceneFacts` — SNAPSHOT/bindings could not forbid re-search loot invent; choice pads still offered “hidden compartments”.
2. **Auto-fight** (`buildAutoFightPrompt`) sent round math with **no equipped-weapon authority**; client skipped prose weapon scrub. `equippedWeaponName` would be `bare hands` for sealed Summoned Pact kit.

## Fix (26p)

- Track `searchedEmpty` / empty targets on `sceneFacts`; bind SNAPSHOT + binding rails; scrub invent-loot on re-search without new circumstance.
- Ground combat weapons: auto-fight prompt + `scrubInventedWeapons` (bare hands / ledger weapon only).
