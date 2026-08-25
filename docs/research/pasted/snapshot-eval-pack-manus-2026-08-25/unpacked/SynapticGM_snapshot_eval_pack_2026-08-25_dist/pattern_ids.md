# SynapticGM Prose-Warden Pattern IDs

**Pack prefix:** `SynapticGM_snapshot_eval_pack_2026-08-25`  
**Authority stamp:** `2026-08-25b`

> **EVIDENCED:** The engine-owned `SNAPSHOT` and ledger are authoritative. The prose warden repairs GM output after generation and must not block the entire turn. **SPECULATIVE:** The concrete replacement wording below is a fixture contract proposed for deterministic tests; production wording may differ if it preserves the same grounded meaning.

| Pattern ID | Trigger class | Required `SNAPSHOT` fields | Deterministic repair objective |
|---|---|---|---|
| `PW_LAST_CONTAINER_UNGROUNDED` | Unsupported “last/final/remaining” box, crate, or chest in GM prose | `props`, `inventory` | Remove unsupported uniqueness or replace the container reference with “the area.” |
| `PW_CROWD_SIZE_OVERSTATE` | Large invented crowd count contradicts a small tracked crowd | `crowd`, `crowdSize` | Replace the invented number with an approximate phrase consistent with `crowdSize`. |
| `PW_CROWD_ABSENCE_CONTRADICTION` | “Empty,” “no crowd,” or “all alone” contradicts `crowd=present` | `crowd`, `crowdSize` | Preserve scene action while acknowledging that a few or the tracked people remain. |
| `PW_CROWD_PRESENCE_INVENTION` | GM invents bystanders or a crowd when arrival is explicitly alone and `crowd=none` | `crowd`, `crowdSize`, `aloneArrival` | Remove invented people while preserving atmosphere and player action. |
| `PW_STEP_OUTSIDE_WHILE_INDOOR` | Narration says the player steps outside although the authoritative location remains indoors | `location`, `indoor` | Replace boundary crossing with movement inside the current location. |
| `PW_ENTER_BUILDING_WHILE_OUTDOOR` | Narration says the player enters the building although the authoritative location remains outdoors | `location`, `indoor` | Replace entry with movement within the current outdoor location. |
| `PW_UNTRACKED_TIME_SKIP` | “Hours later” or equivalent passage appears without a tracked time advance | `timeOfDay` | Remove the time jump and retain immediate continuity. |
| `PW_EVENT_OVER_RETCON` | An event is declared over without tracked time progression | `timeOfDay` | Keep the event ongoing or make no claim about its completion. |
| `PW_UNGROUNDED_PAST_RETCON` | “Was not always so” or similar history is asserted without ledger support | `location`, `timeOfDay` plus applicable ledger facts | Remove the unsupported historical assertion while preserving present-tense texture. |
| `PW_TENSION_DROP_CONTRADICTION` | Prose says danger passes while tension remains high | `tension` | Replace relief with language that keeps the tracked danger, combat, or tension active. |
| `PW_LOCATION_AS_SPEAKER` | A place, room, hall, street, or similar location literally answers or speaks | `location`, `present` | Attribute any actual speech to a present character, or rewrite the effect as an echo or sound. |
| `PW_EXIT_WHITELIST_VIOLATION` | GM prose invents a door, window, hatch, stair, or passage not in `exits` | `location`, `exits` | Remove the invented route or substitute a whitelisted exit without altering the whitelist. |
| `PW_INVENTORY_FACT_CONTRADICTION` | GM prose adds, removes, renames, or miscounts authoritative inventory | `inventory` | Restore the exact item names and ownership state from the snapshot. |
| `PW_LEDGER_NUMBER_CONTRADICTION` | HP, MP, XP, gold, level, damage, or another tracked number conflicts with the ledger | Applicable ledger fields embedded in the snapshot | Replace the number with the authoritative ledger value; do not infer arithmetic not supplied by the fixture. |
| `PW_PRESENCE_ROSTER_CONTRADICTION` | GM prose adds an absent named character or removes a tracked present character | `present`, `companions` | Restore the authoritative roster while allowing unnamed ambient references only when crowd state supports them. |
| `PW_LOCATION_FACT_CONTRADICTION` | GM prose changes the named current location without an engine transition | `location` | Keep the authoritative location name and remove the untracked transition. |
| `PW_WEATHER_FACT_CONTRADICTION` | GM prose changes tracked weather rather than adding compatible sensory texture | `weather`, `indoor` | Restore tracked weather and retain only texture compatible with it. |
| `PW_QUEST_FACT_CONTRADICTION` | GM prose changes a tracked quest target, status, count, or objective | Applicable quest ledger object | Restore the exact quest facts from the ledger.

## Rewrite contracts and boundary examples

### `PW_LAST_CONTAINER_UNGROUNDED`

**Template.** **SPECULATIVE:** Rewrite “the last/final/remaining [box|crate|chest]” as “the area” when no such container exists, or as “a [container]” when a matching non-unique prop exists. **EVIDENCED:** This requires `props` and `inventory` to show whether the container is grounded.

**Fail examples:** “You search the last box.” “The final chest clicks open.”  
**Leave alone:** “Musty oak breathes its cellar smell into the room.” “Her apology arrives boxed in careful phrases.”

### `PW_CROWD_SIZE_OVERSTATE`

**Template.** **SPECULATIVE:** Replace a large invented count with “a few people” or a phrase derived from the small tracked `crowdSize`. **EVIDENCED:** A small tracked crowd cannot become “a hundred people” in renderer prose.

**Fail examples:** “A hundred people fill the lane” with `crowdSize: 4`. “Hundreds roar” with `crowdSize: 7`.  
**Leave alone:** “The four onlookers shift uneasily.” “The applause sounds like a hundred hands” when clearly marked as simile.

### `PW_CROWD_ABSENCE_CONTRADICTION`

**Template.** **SPECULATIVE:** Replace “empty/all alone/no crowd” with “quiet, though a few people remain” or an equivalent grounded clause. **EVIDENCED:** `crowd=present` is authoritative.

**Fail examples:** “The market is empty” with a present crowd. “You are all alone” with six tracked people nearby.  
**Leave alone:** “An empty cup rocks on the sill.” “Loneliness settles over you like dust” as an emotion, not a headcount.

### `PW_CROWD_PRESENCE_INVENTION`

**Template.** **SPECULATIVE:** Delete invented bystanders and retain non-human ambience or the player’s action. **EVIDENCED:** `aloneArrival=true`, `crowd=none`, and `crowdSize=0` ground an explicitly solitary arrival.

**Fail examples:** “A pair of locals greet you” in an alone arrival. “Bystanders gather behind you” with no crowd.  
**Leave alone:** “Painted faces on the mural seem to watch.” “Rain applauds on the roof.”

### `PW_STEP_OUTSIDE_WHILE_INDOOR`

**Template.** **SPECULATIVE:** Replace “step outside” with “step across the room” or another interior movement that does not cross a boundary. **EVIDENCED:** `indoor=true` remains authoritative unless the engine changed it.

**Fail examples:** “You step outside into the rain” while still in the archive. “You leave the building” while the location remains the inn room.  
**Leave alone:** “Outside, rain ticks against the glass.” “She thinks outside the usual categories.”

### `PW_ENTER_BUILDING_WHILE_OUTDOOR`

**Template.** **SPECULATIVE:** Replace “enter the building” with movement along or within the current outdoor location. **EVIDENCED:** `indoor=false` remains authoritative unless the engine changed it.

**Fail examples:** “You enter the building” while still on the bridge. “Inside the inn, you cross the lobby” while the tracked location remains the street.  
**Leave alone:** “The building’s shadow reaches the curb.” “Music leaks from inside the inn.”

### `PW_UNTRACKED_TIME_SKIP`

**Template.** **SPECULATIVE:** Remove the skip marker and connect the clauses with “moments later” only if immediate continuity is intended; otherwise use present-tense sequence. **EVIDENCED:** Tracked `timeOfDay` did not advance.

**Fail examples:** “Hours later, dawn arrives” while time remains evening. “By the next morning” while time remains night.  
**Leave alone:** “The hourglass motif repeats on the rug.” “It feels as if hours could pass here.”

### `PW_EVENT_OVER_RETCON`

**Template.** **SPECULATIVE:** Replace “the festival/battle/ceremony is over” with a clause keeping the tracked event active or making no completion claim. **EVIDENCED:** Event completion cannot be invented without tracked progression.

**Fail examples:** “The festival is over now.” “The ceremony has ended” with no ledger update.  
**Leave alone:** “A torn festival ribbon sticks to your boot.” “She worries it will be over too soon.”

### `PW_UNGROUNDED_PAST_RETCON`

**Template.** **SPECULATIVE:** Delete unsupported historical certainty and retain present visual detail. **EVIDENCED:** “Was not always so” is explicitly listed as a sudden unsupported retcon.

**Fail examples:** “The ruin was not always so.” “This inn once belonged to a king” without ledger support.  
**Leave alone:** “Old brushstrokes suggest repeated repairs.” “Mara claims the inn once belonged to a king” when framed as NPC speech, not fact.

### `PW_TENSION_DROP_CONTRADICTION`

**Template.** **SPECULATIVE:** Replace “danger passes/everything is safe” with “danger still presses close” or equivalent continuity. **EVIDENCED:** High tracked tension cannot be lowered by renderer prose.

**Fail examples:** “The danger passes” with `tension=danger`. “At last, everything is safe” with `tension=combat`.  
**Leave alone:** “A safe is bolted beneath the desk.” “He says, ‘Everything is safe,’ but keeps shaking.”

### `PW_LOCATION_AS_SPEAKER`

**Template.** **SPECULATIVE:** Rewrite “the hall answers” as “an echo returns” unless a present speaker can be attributed. **EVIDENCED:** Locations are places, not speakers.

**Fail examples:** “The hall answers your question.” “The street whispers your name” when presented literally.  
**Leave alone:** “Your answer echoes through the hall.” “The street seems to whisper beneath the wind,” as explicit metaphor.

### `PW_EXIT_WHITELIST_VIOLATION`

**Template.** **SPECULATIVE:** Substitute an exact string from `exits`, or remove the route if no exit is semantically appropriate. **EVIDENCED:** Interior doors and passages are snapshot authority.

**Fail examples:** “A west door swings open” when only north door and east passage exist. “You climb a hidden stair” when no stair is whitelisted.  
**Leave alone:** “Rust freckles the north door’s hinge.” “A door-shaped stain marks the plaster” when it is clearly not asserted as an exit.

### `PW_INVENTORY_FACT_CONTRADICTION`

**Template.** **SPECULATIVE:** Restore exact item spelling and possession state from `inventory`. **EVIDENCED:** Inventory item names are snapshot authority.

**Fail examples:** “Your travel bag contains a silver sword” when no sword is listed. “The phone is gone” while `phone` remains listed.  
**Leave alone:** “Your travel bag smells faintly of cedar.” “The phone’s dark screen mirrors your face.”

### `PW_LEDGER_NUMBER_CONTRADICTION`

**Template.** **SPECULATIVE:** Replace only the conflicting numeric token and its unit label with the authoritative ledger value. **EVIDENCED:** HP, MP, XP, damage, stats, and quest facts must match the ledger.

**Fail examples:** “You have 90 gold” when ledger gold is 12. “Your HP rises to 40” when ledger HP is 18.  
**Leave alone:** “A hundred tiny scratches web the wall” when scratches are untracked texture. “Your heart seems to beat twice for every step” as metaphor.

### `PW_PRESENCE_ROSTER_CONTRADICTION`

**Template.** **SPECULATIVE:** Remove absent named characters and retain present names exactly. **EVIDENCED:** `present`, `companions`, and encounter membership are authoritative.

**Fail examples:** “Mara joins you” when Mara is absent. “Ivo vanishes” while Ivo remains tracked present.  
**Leave alone:** “Someone may have used this chair.” “A portrait bears a stranger’s face.”

### `PW_LOCATION_FACT_CONTRADICTION`

**Template.** **SPECULATIVE:** Replace the invented place name with the current `location` and remove transition verbs. **EVIDENCED:** Current location is snapshot authority.

**Fail examples:** “Now in Ember Square” while the location remains North Archive. “You arrive at the river dock” without a transition.  
**Leave alone:** “A map labels a distant place Ember Square.” “The archive smells faintly of river mud.”

### `PW_WEATHER_FACT_CONTRADICTION`

**Template.** **SPECULATIVE:** Restore the tracked weather term and keep compatible sensory details. **EVIDENCED:** Tracked weather must remain unchanged when set.

**Fail examples:** “Snow begins falling” when weather is clear. “The storm stops” when weather remains rain.  
**Leave alone:** “Cloud-shaped stains mark the ceiling.” “Rain-colored light lies across the floor” while tracked weather is clear and the phrase is explicitly color texture.

### `PW_QUEST_FACT_CONTRADICTION`

**Template.** **SPECULATIVE:** Restore exact quest target, count, objective, and status from the ledger object. **EVIDENCED:** Quest facts must match the ledger.

**Fail examples:** “You have found all three seals” when found count is one. “The courier quest is complete” while status is active.  
**Leave alone:** “Three seal motifs decorate the lintel” when not described as collected quest items. “Mara guesses the courier may already be done” as uncertain NPC speech.

## Interpretation rule

**EVIDENCED:** A sentence is not scrubbed merely because it contains a keyword. The automated assertion must establish a factual contradiction against the supplied snapshot or ledger. **SPECULATIVE:** Implementations should match a narrow factual clause, preserve surrounding legal prose, and prefer no repair when metaphor, quotation, hypothetical speech, negation, or object polysemy prevents a reliable contradiction determination.

## References

This fixture pack uses only the user-supplied product law and mission brief; it has no external factual dependencies.
