# Josie play ingest — 29 Aug 2026 / HUD 2026-08-30S

**Dumps only.** Panel/Place lock shipped: `docs/bugs/playtest-2026-08-30-blue-panel-place/FIX.md` (HUD `2026-08-30Y`).

**Player:** Josie Pilgrim · `wyattpilgrim16@gmail.com` · staff  
**Save:** `22a4f976-fc6f-467c-9af7-6927eaefd5d5`  
**Transcript stamp:** `2026-08-30l` (HUD she reported: `2026-08-30S`)  
**Exported:** 2026-08-29T12:05Z

The JSON pack is **not** a full save. It has profile, telemetry, `aiTraffic`, and session/save **metadata**. There is **no** `sceneFacts`, `openingEstablishment`, or inventory blob in the pack. Covers and crowd are reconstructed from the `.md` System lines + GM prose + `aiTraffic` / `TURN_START` payloads.

Same pack also holds an earlier **Hero Awakening** abort (`004dc417-…`, turn 2). That is a different play. Chronology below is the Summoned Pact transcript unless marked.

---

## Snapshot

| Field | Value |
|---|---|
| Mode | LitRPG (`engine: litrpg`) |
| Bible | `summoned-pact` — The Summoned Pact |
| Turn | **6** |
| Location (header) | The Sevenfold Circle under bombardment |
| Character | Josie · Level 1 · XP **0/200** |
| Name status | **Locked Josie** after a canned name-ask (~T2). Registration still incomplete. |
| Opening covers (from System lines) | Name pending → she typed `Josie`. Stamp Pactborn / Calamity Mark unresolved. Gift channel unresolved (Appraisal names it). Kit never declared on the book. |
| Quests | Circle’s Price **active** (bearings established ~T4). Otherworld Junk / Marked Child / The Other Circle / Queen’s Private Ledger still **hidden**. |
| Memorable | Plate file is **not** in this dump. Committed prose is standing on a **circular mosaic** (see plate vs mosaic). |

---

## Chronology (Josie’s reported breaks)

Times are UTC from the JSON. Turn numbers follow the `.md` headings (the exporter double-uses “Turn 2”).

### T0 — Opening (11:41) · plate vs mosaic · crowd “few”

`callOpeningGm` on `(opening)`. Prose:

> You stand on a circular mosaic of cracked stone… Jagged cracks spiderweb across the ancient tiles beneath your feet… Around you, a **scattered few individuals** in roughspun clothing huddle against unseen fortifications.

Numbered list **1.** leaked into the story body. Pad included **Inspect the immediate surroundings** (she did **not** tap it on this save).

**Plate vs mosaic:** this pack has no Chapter One image. The **committed book** is stand + circular mosaic. Josie’s report (collapsed on rectangular slabs) is the plate mismatch — screenshot lives in `docs/bugs/playtest-2026-08-30-plate-vs-prose/`, not here.

### ~T1 — Ask what is going on (11:42) · crowd “group” · clone

Player chip: `Ask what is going on`.

GM **re-prints the entire opening paragraph**, then upgrades the crowd:

> a **scattered group of individuals** in varying states of disarray… murmuring amongst themselves… **handlers** in ornate, but torn, ceremonial robes **kneels** nearby…

Robed figure: ritual gone awry, pulled through from elsewhere, “so have others.”

**Inspect → name-ask (this save):** she did **not** inspect here. Next player line is a demand, then the canned name-ask.

Same JSON, **earlier HA save** `004dc417` (11:35): `PLAYER_ACTION` **Inspect the immediate surroundings**. That GM reply is **not** in `aiTraffic`. Do not claim the HA inspect printed the name-wait line from this pack alone.

### ~T2 — Demand home (11:50) · name-ask

After a Continue (`session` `f6ecf80d…`, 11:48):

Player: `"well send me back to my world!" I demand`

GM (whole beat):

> They are still waiting for a name you will own.

She types `Josie`. `callOpeningGm` (~2s). Next beat **does not acknowledge the demand or the name**. Camera snaps to an interior **"Entry"**, flagstone + Foyer door, “what the map indicates.” Quest Unlocked: Circle’s Price. Registration still incomplete.

### ~T3 — “Run away” rewrite → safer-scene quoted as speech (11:52)

`TURN_START.input`: **`Run away `** (trailing space).

What the player bubble / `.md` shows instead:

> I scan for any hostile threat before committing — if none is present, I stay alert and choose a safer scene action.

What was actually sent to the writer (`PLAYER_ACTION` + `aiTraffic.player_input`):

> I address a bystander who is actually here, not "for any hostile threat". My words stay: I scan for any hostile threat before committing — if none is present, I stay alert and choose a safer scene action.

Raw writer (`aiTraffic`) quotes the canned line as dialogue, then:

> “The threat is the war, girl… **The King’s men** are dealing with it.”

**Displayed** `.md` (post-warden):

> “I scan **the blue panel** before committing,” you state… “if none is present, I stay alert and choose a safer scene action.”  
> …“the war, girl… **the blue panel men** are dealing with it.”

Same beat invents a **Warden** + a watching **woman**, and locks the room as:

> the **two figures** who were present when you arrived

Resolution retry: `intent: talk`, `obligationMissing: [open_ask]`.

### T4–T5 — Walk the door · blue panel / Place posture (11:59)

Player (typed, not rewritten): `I walk nervously through the door he gestures to`  
Roll: Athletics **fail** (d20=3). Another resolution retry (`intent: move`).

**Raw writer:**

> you push **it** open… **The official, Place**, remains at the threshold, **his posture tense**.  
> Pad: Ask **Place** what this room is.

**Displayed `.md`:**

> you push **the blue panel**… **the blue panel, Place**, remains at the threshold, **his posture tense**.  
> Pad: **Examine the blue panel** · Offer **handlers** honest help

### T6 — Examine room (12:04)

Player chip: `Examine the room you've just entered.`  
Story is a dim unfinished room + debris + a shut doorway. **Displayed pad still offers Examine the blue panel.** Raw pad was `Call out to Place, who is still at the threshold.`

XP still **0** after “bearings established.”

---

## Other clear breaks (same Summoned Pact play)

Do not invent. These are on the tape:

1. **Opening clone** — T0 and the “what is going on” beat share the dropped-anvil / mosaic paragraph almost verbatim.
2. **Location snap** — outdoor mosaic under fire → after `Josie`, indoor Entry / Foyer / street-outside with no travel line.
3. **Demand ignored** — “send me back” never answered; name-ask ate the turn.
4. **Name never spoken back** — header is Josie; prose never uses it.
5. **Crowd flip without enter/leave** — few (T0) → group + others pulled through (~T1) → two figures who were present when you arrived (~T3).
6. **Warden noun-swap** — Place / King’s men → blue panel in the committed book. Raw `aiTraffic` still has Place and King’s men.
7. **Choice-list in prose** — opening `1. Scan your surroundings…`
8. **Grammar** — “handlers … kneels”; lowercase “the blue panel, Place”.
9. **Continue mid-opener** — new-game session `c2ea554f…` through “ask what”; Continue `f6ecf80d…` before the demand/name-ask.

**Not in this dump (do not treat as proven here):** plate pixels; full `sceneFacts.present` / `crowdCount`; HA inspect’s GM text.

---

## Same pack, earlier abort (Hero Awakening)

Save `004dc417-1e89-432e-b59a-ff37b01d1505` · 11:34–11:36 · turn 2.

- Opening: private room, antiseptic, **Wake Residue**.
- T1 chip: Inspect the immediate surroundings (no GM line stored).
- Then `Who is waiting?` → **Meridian Clearance Authority** man with a **sidearm** in an alley. Different bible, different continuity. Left here so the inspect telemetry is not mistaken for the Pact save.
