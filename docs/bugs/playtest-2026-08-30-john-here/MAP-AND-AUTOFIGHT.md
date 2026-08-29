# John `6d8e0b1f` — map + auto-fight (2026-08-31f)

**Save:** `6d8e0b1f-9427-48c8-ac7e-9affb67019eb` · LitRPG · The Summoned Pact · stamp on tape `2026-08-30w`  
**Pack:** no full `game_state` (places / dungeon / cameraLock missing). Map evidence is the transcript + GM traffic. Auto-fight is fully on the tape.

---

## Map bug (dump)

There is **no Map-open screenshot**. What the tape *does* show is place/graph harvest treating an atmosphere sentence as a room.

**T3 GM:** “The air in this chamber hangs heavy, thick with the scent of dust…”

**Pads / GM lists after that:**

- `Approach the doorway to This Chamber Hangs Heavy`
- Pack AI: `Investigate the doorway leading to "This Chamber Hangs Heavy."`

Location string stayed the opening essay: `alone in a building with serious damage somewhere off the Valespire roads`. Player moved rooms (doorway, hole, gap) without a short room pin.

### Why 29e / 20n / 31c missed it

| System | Why it did not stop this |
|---|---|
| `extractNamedPlaces` Title-Case / `in this chamber…` | `chamber` matches `INTERIOR_ROOM_PIN`. Clip left **This Chamber Hangs Heavy**. |
| `isGenericMapPlace` / map-pin deny | Owned Eye Level / Your Palm — not atmosphere verbs. |
| `shortRoomLabel` | Length ≤28 and no `alone in` / `somewhere` — kept the essay title. |
| `applyHarvestedRoomNames` | Renamed a generic floor-plan room to that title. |
| ChoiceCompiler / `sceneSafeFallbacks` | Offered `doorway to ${door.name}` from the graph. |
| `isInteriorPlace` / cameraLock | Ruin *is* interior. No Map-open in the dump, so we cannot prove street-vs-floor-plan. The pin name is the proven fail. |

---

## Auto-fight bug (dump)

**T9** — wood-pile search. GM: chest + tarnished silver locket. **No creature in prose.** System then: `Encounter: Pact-Hunter Skirmisher` / `Hub skirmish committed`. Pad mixed **Look around** / **Whats going on** with Flee / Parley.

**T10 player:** `[Auto-Fight] Engaging Pact-Hunter Skirmisher...`

**T10 GM:** “A blur of **fur and teeth**… **claws** raking… silenced **the beast** forever.” Ledger: VICTORY, HP 24→9, XP 30, gold 7, fists (weapon authority held).

**T11 player:** `System loot my kill`

**T11 GM:** reprints T5 threshold essay. “You note **no kill to loot**.” Chest/locket gone.

Ops: `callGmAutoFight ok in 1666ms` — not a hang.

### Why 29a / 26p / auto-fight path missed it

| System | Why it did not stop this |
|---|---|
| `encounterTerminalFsm` / `commitClear` | `runAutoFight` nulled `activeEncounter` **without** ticking the FSM. No `encounterClearedReceipts`. |
| SNAPSHOT Encounter | Next turn: `none`. No LAST KILL line. |
| `scrubInventedWeapons` | Ran. Fists stayed. Did not own body type. |
| `buildAutoFightPrompt` | Weapon authority only. “Visceral” + Flash Lite invented a beast. Pact-Hunter is a human hunter. |
| ChoiceCompiler 29a combat lock | Dropped inspect/examine — **not** “Look around” / “Whats going on”. |
| Drought spawn (B043) | By design on a search. GM beat never named the foe; auto mode then resolved instantly. |
| Gold 7 | Ledger `5 + level×2`. Not invented loot. |

---

## What 31f locked

1. **`isAtmospherePlaceName`** — hangs heavy / thick with / scent of / chamber hangs. Harvest, `isGenericMapPlace`, `shortRoomLabel`, interior present, doorway pads.
2. **`combatAuthority`** — humanoid BODY AUTHORITY; `scrubBeastifiedHumanoid`; `commitAutoFightLedger` (FSM + `sceneFacts.lastKill`); SNAPSHOT Last kill; `scrubDeniedKill`; spawn preface if last GM never named the foe.
3. **Combat pad** — look-around / where-am-I dropped while engaged.
4. **Props** — chest / locket harvest into `sceneFacts.props`.
5. **Continue rev 7** — rewrite atmosphere room pins; backfill lastKill from Auto-Resolve VICTORY log.

Mid writer OFF. HUD `2026-08-31f` / BUILD `2026-08-30y`. Vitest `playtest31fMapAutofight`.

## Residual

- No Map UI screenshot — street-vs-interior on open is inferred, not taped.
- Drought can still attach after a beat that never showed the foe; preface covers the auto-fight paragraph.
- Chest/locket already vanished on this save until Continue harvests from older GM text (new turns harvest).
- Numbered `1.` leak and reason-heard XP on scout stay 31e residuals.
