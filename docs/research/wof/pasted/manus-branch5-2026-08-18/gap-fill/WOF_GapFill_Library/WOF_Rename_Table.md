# WOF Rename Table

**Deliverable:** `WOF_Rename_Table.md`  
**Scope:** WOF (World of Fantasy) quarantined content-library conversion only. This document is a data correction table, not production application code, not a live-game migration, and not a redesign of the shared engine. It applies to dump strings before typed ingestion. [1] [2]

> **Normalization rule.** The locked identifier, object kind, and canonical public title in the **New locked value** column are authoritative. An old dump string is never allowed to create a second object, rename a locked object, or change its kind. If a row is marked **display-only rejected**, the old title may be retained only as a rejected-dump audit value; it must not be emitted to player-facing copy or used as an identifier.

## 1. Required dump-error renames

| Old dump string / field | New locked value | Object kind | Scope | Action and reason |
|---|---|---|---|---|
| `Gloam Court Siege` | `first_song_courtfall` / **Courtfall at Vespermere** | First-Song instance | `first_song` | Rename the instance id and public name. Preserve the dumped encounter structure, phases, checkpoints, and reward semantics; remove the Gloamwild echo from the title. This is an original WOF name, not a map rewrite. |
| `instance.gloam_court_siege` | `instance.first_song_courtfall` | First-Song instance record | `first_song` | Replace the dumped slug everywhere in typed references, entrance records, checkpoint keys, and loot-source keys. Do not retain the old slug as an alias. |
| `saltwind_keeper` | `brineveil_curator` / **Brineveil Curator** | Bonded Menagerie kit | `bonded_menagerie` | Rename both id and public name because the old id is too close to the locked Ash Compact race `Saltkin`. Preserve the kit’s mechanics, start depth, and encounter structure. No Saltkin fauna or cross-world race is created. |
| `kit.saltwind_keeper` | `kit.brineveil_curator` | Bonded Menagerie identity kit | `bonded_menagerie` | Replace all typed references, start records, choice decks, reward references, and UI keys. The old slug is forbidden in generated content, fixtures, and public copy. |
| `hp_check_floor` | `hp_check_floor_flags` | Rules module | Shared WOF rules catalog | Canonicalize the module id to the locked slug. Update `rulesModuleId`, pack manifests, module references, and eval-probe fixtures. Do not create or preserve a second `hp_check_floor` module. |
| `rulesModuleId: hp_check_floor` | `rulesModuleId: hp_check_floor_flags` | Pack/module reference | Any WOF pack using the dump value | Treat as a field-value rename only. The module remains code-owned ledger resolution with floor flags; this row does not alter its defaults or combat semantics. |
| `Migration Night` used as the Bonded Menagerie “big instance” | `fair_night` / **Fair Night** | Bonded Menagerie 5-person start big night | `bonded_menagerie` | Lock **Fair Night** as the start “big night,” party size 2–5, and the primary 5-person Fair. Migration Night remains a separate optional 10-person Mid+ event; it is not “the” big instance. |
| `bonded_menagerie.big_instance = migration_night` | `bonded_menagerie.big_instance = fair_night` | Pack manifest / progression reference | `bonded_menagerie` | Replace the singular big-instance pointer. Add `migration_night` as `optionalRaidInstance`, `partySize: 10`, `tier: Mid+`; do not merge the two records. |
| `The First Wick` used for `quest_lanternfolk_race_1` | **Keep the Path Lit** | Ash Compact quest title | `ash_compact` | Display-only rejected alias. The locked quest id remains `quest_lanternfolk_race_1` and its locked code title is **Keep the Path Lit**. Never rename the quest id or emit **The First Wick** as player-facing text. |
| `quest_lanternfolk_race_1.title = The First Wick` | `quest_lanternfolk_race_1.title = Keep the Path Lit` | Ash Compact QuestDef | `ash_compact` | Replace only the dumped title. Preserve objectives, unlocks, rewards, and quest-state keys from locked code. |
| `Hearthborn` used as a region | `hearthborn` / **Hearthborn** | Race | `ash_compact` | Reclassify the value from region to race. A region field must instead reference the appropriate place or zone id, such as `reedfen_start`; do not create a Hearthborn region. |
| `Lanternfolk` used as a region | `lanternfolk` / **Lanternfolk** | Race | `ash_compact` | Reclassify the value from region to race. Region fields must use a place or zone id, such as `lampwood_start`; do not create a Lanternfolk region. |
| `Saltkin` used as a creature | `saltkin` / **Saltkin** | Race | `ash_compact` | Reclassify the value from creature/species to race. Replace any creature reference with the actual locked species id from the relevant drop table; no Saltkin-named fauna may be generated. |
| `Stonevein` used as a region | `stonevein` / **Stonevein** | Race | `ash_compact` | Reclassify the value from region to race. Region fields must use a place or zone id, such as `granite_stair_start`; do not create a Stonevein region. |
| `Tide Covenant` used as a race | `tide_covenant` / **Tide Covenant** | Faction | `ash_compact` | Reclassify the value from race/people to faction. It is a faction standing target and must not appear in species, race-start, or playable-origin fields. |
| `Ash Compact` used as a region | `ash_compact` / **Ash Compact** | Faction | `ash_compact` | Reclassify the value from region to faction. Place fields must use `poi_ash_seat`, `poi_the_divide`, or another actual place id; do not create an Ash Compact region. |

## 2. Locked Ash Compact identifiers and titles that must not be renamed

The following values are protected. A dump correction may change a mistaken title or kind only through a row in this document; it may not replace these ids with a newly invented id.

| Locked category | Canonical identifiers and titles |
|---|---|
| Races and starts | `hearthborn` at `poi_reedfen_square`; `lanternfolk` at `poi_wickhaven`; `saltkin` at `poi_brinewatch_dock`; `stonevein` at `poi_anvil_gate`. |
| Factions | `ash_compact` / **Ash Compact**; `tide_covenant` / **Tide Covenant**. These are factions, never regions or races. |
| Capital places | `poi_ash_seat` / **Ash Seat**; `poi_tidehold` / **Tidehold**. Their initially empty exits must be filled by the travel graph, not by renaming either capital. |
| Required shared route | `poi_the_divide` / **The Divide**, plus new road and ferry place ids connecting every start hub to The Divide and then to its faction capital. Travel is by place exits with gold and turn costs; no teleport is introduced. |
| Quests | `quest_hearthborn_race_1` / **The Hearthborn's Request**; `quest_lanternfolk_race_1` / **Keep the Path Lit**; `quest_saltkin_race_1` / **The Flats Are Wrong**; `quest_stonevein_race_1` / **The Stair Has a Crack**. All other locked quest ids in the `*_race_2/3`, `quest_miller_*`, `quest_reedfen_zone_*`, `quest_wick_*`, `quest_lampwood_zone_*`, `quest_fisher_*`, `quest_brinewatch_zone_*`, `quest_smith_*`, and `quest_granite_zone_*` families remain unchanged. |
| Dungeons | `dungeon_lampwood_gate`; `dungeon_unlit_hollow`; `dungeon_coil_warehouse`; `dungeon_anvil_deep`. |
| Ten-person instance | `dungeon_millstone_hollow` / **Millstone Hollow**; 10-person, three-phase, and never resized to a 5-person instance. |

## 3. Genre and public-name corrections

These are semantic dump corrections. They prevent a theme label from being ingested as the wrong genre or product pattern; they do not alter engine schemas.

| Dump interpretation or label | Canonical WOF interpretation | Required correction |
|---|---|---|
| `Circuit Arc` as science fiction | Shonen tournament pattern | Keep the world/theme name, but classify its content as tournament progression, authored rivals, and instanced combat; do not add spacefaring or science-fiction setting data. |
| `Starwake` as a ground-world adventure | Space / ship-board pattern | Keep its world namespace and use ship-board state; do not merge its maps with Ash Compact or treat it as an Ash Compact region. |
| `Stage Light` as a generic town | Idol / performance pattern | Use stage, rehearsal, concert, and public-performance terminology; do not import licensed idol identities or songs. |
| `Lanceyard` as ordinary fantasy combat | Mecha / frame-heat pattern | Use frame and heat ledger fields; do not invent meshes, navmeshes, collision, or licensed mecha names. |
| `Halo Term` as generic magic fantasy | Powers-school pattern | Use the locked powers-school module and original terminology; do not use licensed school names. |
| `Hollow Term` as generic magic fantasy | Magic-school pattern | Use the locked magic-school module and original terminology; do not use licensed school names. |
| `Route Lantern` as ordinary travel | Romance / `bond_heart` pattern | Use bond and relationship ledger fields without sexual content in Kid Mode; do not turn it into an open-world social system. |
| `Veil Watch` as ordinary patrol | Horror / `steadfast` pattern | Use horror pressure and steadfast ledger fields; do not use licensed horror settings, clans, or creatures. |

## 4. Explicitly rejected dump strings and aliases

| Rejected value | Rejection status | Replacement / handling |
|---|---|---|
| `Ember Crown` | Ignored dump title | Do not ingest as a world, faction, item, quest, instance, or public alias. No replacement object is created. |
| `Pactbeasts of the Lanternwild` | Ignored dump title | Do not ingest. Bonded Menagerie uses its own locked world and kit ids, including `brineveil_curator` for the corrected kit row above. |
| `Gloamwild` | Ignored setting/title echo | Do not use as a world, faction, region, or public title. The First-Song instance is **Courtfall at Vespermere**. |
| `Deepgate Accord` | Ignored dump title | Do not ingest or map to a faction, dungeon, or region. |
| `Salt Ledger` | Ignored dump title | Do not ingest or map to a Brinewatch item, quest, or faction. |
| `Sunloom Circuit` | Ignored dump title | Do not ingest or map to Circuit Arc. |
| `Lantern Run Company` | Ignored dump title | Do not ingest as a faction, guild, vendor, or route. Cross-world “Lantern” POIs remain valid only when namespaced by `worldId`. |
| `The First Wick` | Display-only rejected quest alias | Map to locked `quest_lanternfolk_race_1` title **Keep the Path Lit**; never emit the rejected title. |
| `Gloam Court Siege` | Rejected old First-Song instance title | Map to `first_song_courtfall` / **Courtfall at Vespermere**; never emit the old title. |
| `saltwind_keeper` | Rejected old Bonded Menagerie kit id | Map to `brineveil_curator` / **Brineveil Curator**; never emit the old id or public name. |

## 5. Collision and namespace rules

Every corrected row is applied before uniqueness validation. The resulting key is namespaced as `{worldId}:{kind}:{slug}`. A `Lantern` place name is legal only when its `worldId` is present; no place from one world may be merged into another world’s map. The four Ash Compact races remain races, `Ash Compact` and `Tide Covenant` remain factions, and `Saltkin` cannot be reused as a creature prefix.

New side, daily, hidden, road, ferry, or capital beats must receive new ids. A new id may not recycle any locked place, quest, or dungeon id. A corrected dump title is not a new beat. In particular, the First-Song rename preserves the encounter structure, the Bonded Menagerie rename preserves the kit’s mechanics, and `hp_check_floor_flags` is the sole canonical floor-flag rules-module slug.

The rename pass must not change the locked engine defaults: party size 2–5 for ordinary instances, raid size 10 for combat skins, lockstep rounds, personal loot, weekly per-character per-boss lockouts, no mid-combat fill, wipe to checkpoint, two separate wallets, no outcome-selling or lockout skips, and no live SynapticGM import. Names and classifications are corrected here; ledger behavior remains code-owned.

## 6. Ingestion acceptance checklist

| Check | Required result |
|---|---|
| Old dump values | All required old values are either mapped above or explicitly rejected; no silent alias is retained. |
| Locked Ash Compact ids | Preserved exactly, including all locked places, quests, dungeons, race starts, `poi_ash_seat`, `poi_tidehold`, and the 10-person three-phase Millstone Hollow. |
| Quest titles | Locked code titles remain authoritative; **The First Wick** is rejected and becomes **Keep the Path Lit**. |
| Module slug | Only `hp_check_floor_flags` is accepted for the floor-flag module. |
| Bonded big night | `fair_night` is the 2–5-person start big night; `migration_night` is optional Mid+ 10-person content. |
| World and region kinds | No race or faction is ingested as a region; no race is ingested as a creature. |
| Original-IP fence | No licensed names, recognizable licensed identities, or copied product terminology are introduced. |
| Live-system fence | No SynapticGM files, prompts, saves, databases, clocks, or production source paths are imported or modified. |
| Spatial fence | This table creates no 3D meshes, navmeshes, collision, or physical-world assumptions. |
| Data integrity | IDs are unique within their world and kind after the rename pass; old ids are not reused for unrelated objects. |

## References

[1]: /home/ubuntu/upload/pasted_content_16.txt "WOF maximum gap-fill generation specification"
[2]: /home/ubuntu/WOF_Content_Packs/WOF_ash_compact_Pack.md "WOF Ash Compact content pack baseline"
[3]: /home/ubuntu/WOF_Content_Packs/WOF_badge_circuit_Pack.md "WOF Badge Circuit content pack baseline"
