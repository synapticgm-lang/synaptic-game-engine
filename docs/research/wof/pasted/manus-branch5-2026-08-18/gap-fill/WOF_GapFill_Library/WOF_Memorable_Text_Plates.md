# WOF Memorable Text Plates

**Companion type:** Optional WOF text-only book plates  
**Format:** Markdown  
**Scope:** Ash Compact / WOF only  
**Version:** `packFormatVersion: 1`  
**Author:** Manus AI

## Purpose and ingestion contract

These plates are short, durable prose artifacts for the **WOF** gap-fill library. They are intended for a text-book, journal, or completion-gallery surface and may be shown after a qualifying state transition has been committed by the game’s code. They do not define quests, rewards, combat outcomes, travel, clocks, inventory, or progression. A plate is unlocked only by its exact `plateId` trigger; the text itself never mints gold, items, reputation, turns, access, or achievements.

The plates use original WOF language and the locked Ash Compact names and identifiers where applicable. They contain no image directions, audio directions, production code, live-service references, licensed names, or claims that WOF is an MMO. WOF is described honestly as a **solo / private co-op / limited online region** experience.

## Plate catalog

| plateId | Title | Trigger kind | Trigger key | Availability | Text length target |
|---|---|---|---|---|---:|
| `plate_ash_opening_wick` | The Wick at the Window | opening | `poi_reedfen_square` | All players after the Ash Compact opening beat | 118 words |
| `plate_ash_first_crossing` | Where the Roads Agree | travel | `poi_the_divide` | Character has reached The Divide from a start hub | 104 words |
| `plate_ash_first_5man_clear` | Five Lamps in the Hollow | instance_clear | `dungeon_unlit_hollow` | Party has cleared the solo or private co-op five-person instance | 132 words |
| `plate_ash_first_death` | The Quiet After the Fall | downed | `first_character_downed` | First character downed in combat; once per character | 121 words |
| `plate_ash_millstone_hollow_clear` | The Millwarden Remembers | raid_clear | `dungeon_millstone_hollow` | Ten-person, three-phase Millstone Hollow clear | 146 words |
| `plate_ash_tidehold_promise` | A Promise at Tidehold | board_complete | `poi_tidehold` | A capital promise-board quest is completed | 116 words |
| `plate_ash_true_ending` | Ash, Tide, and the Kept Light | ending | `ash_compact_true_ending` | The Ash Compact true-ending state is committed | 178 words |

## Rendering rules

A renderer should display the title, the body, and the small attribution line **“Ash Compact field plate”**. The body must remain selectable text. A plate may be read again from the journal after it is unlocked. Re-reading has zero turn cost and does not alter state. The renderer should preserve paragraph breaks and punctuation, but it may apply the active WOF typography skin.

A plate should not appear before its trigger is committed. If a trigger is reversed, rolled back, or found to have an invalid revision, the plate remains hidden until the valid trigger is committed again. Duplicate grants are prevented by the pair `{characterId, plateId}`.

## Plate 01 — The Wick at the Window

> **The Wick at the Window**
>
> Reedfen Square is smaller than the stories made of it. A bell, a well, a row of doors, and the patient faces of people who have learned to measure weather by the color of a wick. At the edge of the square, one lamp burns in a window that has no room behind it.
>
> Someone has set it there anyway.
>
> The flame leans when the marsh wind passes, then gathers itself. It does not promise safety. It marks a place where a person has chosen to stay awake long enough for another person to find the path home.
>
> Beyond the square, the roads divide toward Reedfen, Lampwood, Brinewatch, and the Granite Stair. For now, there is only the first step, the first name spoken aloud, and the light waiting in the window.
>
> *Ash Compact field plate*

**Unlock record:** `plate_ash_opening_wick`  
**Associated place:** `poi_reedfen_square`  
**Associated opening races:** Hearthborn, Lanternfolk, Saltkin, Stonevein

## Plate 02 — Where the Roads Agree

> **Where the Roads Agree**
>
> The Divide is not a wall and not a gate. It is the brief, wind-scoured place where roads from different lives share the same stones.
>
> A ferry rope sings somewhere below. A coach wheel answers from the higher road. Behind you are the familiar lamps of a start hub: the square, the loft, the dock, or the gate. Ahead, the capital roads rise toward Ash Seat and Tidehold.
>
> No road erases the one behind it. Reedfen remains Reedfen. Wickhaven remains Wickhaven. Brinewatch keeps its tide, and Anvil Gate keeps its oath. The crossing only makes their distances legible.
>
> Travelers leave marks here in practical ways: a repaired strap, a dry wick, a handprint in road dust. The marks say the same thing in four different accents: someone came through, and someone else can follow.
>
> *Ash Compact field plate*

**Unlock record:** `plate_ash_first_crossing`  
**Associated place:** `poi_the_divide`  
**Travel note:** Ferry and coach routes remain ordinary place exits with their committed gold and turn costs.

## Plate 03 — Five Lamps in the Hollow

> **Five Lamps in the Hollow**
>
> The Unlit Hollow did not become less dark when the five of you entered it. Darkness is not a door that opens because a party arrives. It waited in the stone, under the stair, and behind every silence that came too quickly.
>
> What changed was the shape of the light.
>
> One lamp found the next handhold. One voice called the safe edge of the floor. One blade turned a creature away from a fallen companion. One person held the checkpoint while another searched the room. The fifth lamp was not carried at all; it was the decision to keep moving together.
>
> Outside, the road will look almost unchanged. That is the way of first victories. They do not rebuild the world. They make the next crossing possible.
>
> *Ash Compact field plate*

**Unlock record:** `plate_ash_first_5man_clear`  
**Associated dungeon:** `dungeon_unlit_hollow`  
**Mode note:** The plate applies to a completed solo run or private co-op party clear; it does not imply a public MMO instance.

## Plate 04 — The Quiet After the Fall

> **The Quiet After the Fall**
>
> The first fall is quieter than expected.
>
> There is no grand verdict in it. The room does not become a legend because one person is downed. Dust settles. A weapon lies where a hand cannot reach it. Somewhere, a companion is still counting breaths and looking for the safest next order.
>
> Then the world offers its smallest mercy: the fight is not the whole story.
>
> A held plan can carry the next moment. A companion can protect the route. A checkpoint can remember what the body cannot. When the party returns to the road, the fall remains true, but it is no longer the final sentence.
>
> Keep this plate for the day a harder room asks what you learned. The answer is not that you never fell. The answer is that falling changed the plan, and the plan continued.
>
> *Ash Compact field plate*

**Unlock record:** `plate_ash_first_death`  
**State note:** Downed characters are recoverable; a wipe returns the party to a checkpoint. No permadeath is implied.

## Plate 05 — The Millwarden Remembers

> **The Millwarden Remembers**
>
> Millstone Hollow keeps time in three movements: the opening grind of stone, the long strain beneath the old beams, and the final turn when every hidden weight finds its answer. The Hollow is built for ten, but its memory is larger than ten names.
>
> It remembers who held the stair. It remembers who returned for the last lantern. It remembers the order in which fear became work, and work became a promise made without ceremony.
>
> At the end, the mill does not cheer. Its wheel slows. Dust settles across the grooves. A single grain slips from the stone and lands where the floor has been swept clean.
>
> That is enough. The work is finished, the checkpoint is safe, and the road can carry the news without embellishment: the Millwarden stood, the Hollow opened, and ten travelers brought one another home.
>
> *Ash Compact field plate*

**Unlock record:** `plate_ash_millstone_hollow_clear`  
**Associated dungeon:** `dungeon_millstone_hollow`  
**Encounter lock:** Ten-person, three-phase structure; this plate does not resize or redesign the encounter.

## Plate 06 — A Promise at Tidehold

> **A Promise at Tidehold**
>
> Tidehold is loud at the edges and solemn at its center. Ropes knock against posts below the hall. Salt dries white on the stone. Above the market paths, a promise board gathers the work that cannot be finished by one household alone.
>
> A promise is a modest word for a difficult thing. It asks for a name, a place, and a return. It asks that the person who posts it believe the person who accepts it will still care after the first inconvenience.
>
> When the work is done, the board does not shine. The pin remains a pin. The ink remains ink. But a small space has opened between need and answer, and that space is where a region becomes a community.
>
> The tide will change before the next promise is written. The board will fill again. That is not failure. It is proof that the harbor is still asking, and people are still answering.
>
> *Ash Compact field plate*

**Unlock record:** `plate_ash_tidehold_promise`  
**Associated place:** `poi_tidehold`  
**Interaction note:** The promise board is a data-backed interactable; this plate is purely commemorative.

## Plate 07 — Ash, Tide, and the Kept Light

> **Ash, Tide, and the Kept Light**
>
> At the end of the road, no single banner covers the sky.
>
> Ash Seat holds the weight of decisions. Tidehold holds the patience of return. Between them, the Divide keeps its wind, and the older roads continue toward Reedfen Square, Wickhaven, Brinewatch Dock, and Anvil Gate. The capitals are not made whole by choosing one over the other. They endure because people carry what each place cannot carry alone.
>
> The Hearthborn bring the courage to begin again. The Lanternfolk keep watch over the paths that disappear at dusk. The Saltkin read the water’s changes. The Stonevein hear the fracture before the stair gives way. None of these gifts is sufficient by itself. Together, they make a light that can survive being handed from one person to another.
>
> The true ending is not a crown, a conquest, or an empty road. It is the kept light: the proof that a promise traveled, that a crossing remained possible, and that home became larger without becoming less itself.
>
> When the final lamp is lowered, it still burns.
>
> *Ash Compact field plate*

**Unlock record:** `plate_ash_true_ending`  
**Associated capitals:** `poi_ash_seat`, `poi_tidehold`  
**Ending note:** This plate records a committed WOF completion state; it grants no reward and does not alter the world clock.

## Integrity checklist

| Check | Result |
|---|---|
| WOF-only scope | Pass — all plates are Ash Compact / WOF content. |
| Locked names preserved | Pass — Ash Compact, Hearthborn, Lanternfolk, Saltkin, Stonevein, The Divide, Ash Seat, Tidehold, Reedfen Square, Wickhaven, Brinewatch Dock, Anvil Gate, Unlit Hollow, and Millstone Hollow are used consistently. |
| Locked IDs preserved | Pass — referenced IDs are copied exactly and no locked ID is reassigned. |
| Original names and prose | Pass — all plate titles and body text are original. |
| Live-service content | Pass — no live content, import, source path, or clock reference is used. |
| Licensed IP | Pass — no licensed characters, settings, brands, or franchise terminology are used. |
| Placeholder content | Pass — every plate has a finished title, trigger, and body. |
| Image pipeline | Pass — plates are selectable text only; no image or 3D pipeline is required. |
| Production app code | Pass — the file contains only content and ingestion notes, not executable code. |
| Economy and progression safety | Pass — plates grant no gold, items, turns, reputation, access, or power. |
| Honest product framing | Pass — the file explicitly preserves solo / private co-op / limited online region language. |
| Duplicate safety | Pass — the `{characterId, plateId}` unlock pair is specified. |

## Plate index for a journal surface

| Order | plateId | Journal section |
|---:|---|---|
| 1 | `plate_ash_opening_wick` | Beginnings |
| 2 | `plate_ash_first_crossing` | Roads |
| 3 | `plate_ash_first_5man_clear` | Deeds |
| 4 | `plate_ash_first_death` | Lessons |
| 5 | `plate_ash_millstone_hollow_clear` | Deeds |
| 6 | `plate_ash_tidehold_promise` | Promises |
| 7 | `plate_ash_true_ending` | Kept Lights |

_End of WOF_Memorable_Text_Plates.md._
