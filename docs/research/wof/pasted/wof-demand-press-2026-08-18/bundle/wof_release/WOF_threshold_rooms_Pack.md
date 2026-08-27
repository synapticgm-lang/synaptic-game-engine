# WOF Threshold Rooms: World Pack

> **Release position:** A WOF text-world pack for **solo and private co-op**. It is not marketed as an MMO until multiplayer operation is proven. All resolution is owned by the shared engine: it commits dice, HP, ledgers, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before narration.

## 1. Header and identity

| Field | Value |
| --- | --- |
| worldId | `threshold_rooms` |
| Working display name | **Threshold Rooms** |
| Maturity | **teen+** |
| rulesModuleId | `liminal_steadfast` |
| Core promise | Liminal interiors and unsettling room logic. |
| First-hour local problem | A public obligation has failed at **Welcome Desk**; the player must choose whom to disappoint before receiving a combat or social task. |
| Originality fence | This world is an original WOF setting. It borrows no protected geography, named characters, costume codes, monster catalogues, plot arcs, slogans, or proprietary rule language. If it carries folklore-adjacent texture, it uses an invented people, place, calendar, and conflict rather than a reconstruction or claim of authority. |

## 2. Rules module — CODE fields

**Intent.** Grounding, room logic, and consentful scares.

| Contract element | Specification |
| --- | --- |
| Ledger fields | steadfast, orientation, clue, room_shift, comfort, exit_marks, battery, anchor |
| Round resolve | Read committed action order; validate resource cost; resolve status changes; commit ledger atomically; narrate only after commit. |
| Wipe / fail | Return the party to the last checkpoint, preserve earned personal loot, clear encounter-only state, and never impose permadeath. |
| Lockout | Weekly per-character boss lockout only where a boss is flagged; no purchase can bypass it. |
| Status effects (8) | rattled, guarded, focused, exposed, steadied, slowed, inspired, spent |
| Verbs (12) | ground, listen, map, open, close, call, anchor, hide, test, rest, return, leave |
| Chrome templates (5) | ledger, turn cue, party pane, checkpoint seal, loot receipt |
| Eval probes (10) | liminal_steadfast_probe_01, liminal_steadfast_probe_02, liminal_steadfast_probe_03, liminal_steadfast_probe_04, liminal_steadfast_probe_05, liminal_steadfast_probe_06, liminal_steadfast_probe_07, liminal_steadfast_probe_08, liminal_steadfast_probe_09, liminal_steadfast_probe_10 |

**Engine boundaries.** Tier-3 hubs and instanced encounters are used; party size is 2–5; lockstep applies when playing together; there is no mid-combat fill, contested open-world PvP, guild bank, global chat, permadeath, or outcome-selling store item. Presence shows only nearby count and races. English is v1.

## 3. Identity kits

| kitId | Name | Entry identity |
| --- | --- | --- |
| threshold_rooms_kit_courier | Courier | A route-reading entry kit with a non-power cosmetic wardrobe and one talk angle. |
| threshold_rooms_kit_maker | Maker | A practical entry kit with a non-power cosmetic wardrobe and one talk angle. |
| threshold_rooms_kit_scout | Scout | A observant entry kit with a non-power cosmetic wardrobe and one talk angle. |
| threshold_rooms_kit_warden | Warden | A protective entry kit with a non-power cosmetic wardrobe and one talk angle. |


Each kit begins with one garment, one instrument or tool, one non-combat emote, and a premade first line. Kits provide flavor; they never gate paid power.

## 4. Place graph

| placeId | Place | Role | Room-first problem |
| --- | --- | --- | --- |
| threshold_rooms_place_01 | Welcome Desk | hub | A local problem is visible before any creature or confrontation: a broken public promise. |
| threshold_rooms_place_02 | Carpet Hall | hub | A local problem is visible before any creature or confrontation: a missing shift roster. |
| threshold_rooms_place_03 | Blue Stair | wild | A local problem is visible before any creature or confrontation: a cracked route marker. |
| threshold_rooms_place_04 | Exit Light | wild | A local problem is visible before any creature or confrontation: an unpaid repair notice. |


**Graph.** `threshold_rooms_place_01 → threshold_rooms_place_02 → threshold_rooms_place_03 ↔ threshold_rooms_place_04 → threshold_rooms_place_04`. Optional side routes return to the first hub. A room, weather, sound, and practical obstacle are described before any creature, character threat, or encounter. Housing is labelled **private room / plot flavor**, not a claim of persistent public housing.

## 5. NPCs and premade talk

| npcId | NPC | Role | Premade talk with stake |
| --- | --- | --- | --- |
| threshold_rooms_npc_01 | Mara Vell | asks for help | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| threshold_rooms_npc_02 | Orin Pike | guards a boundary | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| threshold_rooms_npc_03 | Sable Rook | knows a rumor | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| threshold_rooms_npc_04 | Tavi Fen | offers a trade | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| threshold_rooms_npc_05 | Ione Bell | challenges a choice | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| threshold_rooms_npc_06 | Perrin Vale | needs a witness | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |


Hub talk uses canned, context-safe prompts only. Public freeform DMs, voice, and unmoderated trade are not part of this pack.

## 6. Opening choices and consequence policy

| Choice id | Opening choice | Stake | Committed outcome |
| --- | --- | --- | --- |
| `threshold_rooms_choice_01` | Take the overdue delivery. | Lose time before the first checkpoint. | Gain route access and a witness. |
| `threshold_rooms_choice_02` | Repair the public marker. | Spend 1 supplies. | Gain local trust and a repair recipe. |
| `threshold_rooms_choice_03` | Tell the truth to the waiting resident. | Risk 2 reputation marks. | Unlock a candid NPC branch. |
| `threshold_rooms_choice_04` | Keep the promise to your kit partner. | Forgo immediate gold. | Earn a cosmetic keepsake path. |

No choice deletes another player, locks a paid path, or creates a permanent punitive state. The narrator may present tone and context only after the ledger outcome is committed.

## 7. Quest catalogue

| questId | Quest | Opening stake | Numeric reward |
| --- | --- | --- | --- |
| threshold_rooms_q_01 | Inspect the First Notice | lose a daylight turn | 12 gold; 4 kit marks; 1 threshold_rooms_favor |
| threshold_rooms_q_02 | Carry the Broken Route | spend 1 supply | 15 gold; 5 kit marks; 2 threshold_rooms_favor |
| threshold_rooms_q_03 | Listen the Quiet Debt | risk a social refusal | 18 gold; 6 kit marks; 3 threshold_rooms_favor |
| threshold_rooms_q_04 | Repair the Open Door | accept a public record | 21 gold; 7 kit marks; 1 threshold_rooms_favor |
| threshold_rooms_q_05 | Escort the Weather Mark | leave a resource for another player | 24 gold; 8 kit marks; 2 threshold_rooms_favor |
| threshold_rooms_q_06 | Negotiate the Lost Shift | lose a daylight turn | 27 gold; 9 kit marks; 3 threshold_rooms_favor |
| threshold_rooms_q_07 | Track the Old Promise | spend 1 supply | 30 gold; 10 kit marks; 1 threshold_rooms_favor |
| threshold_rooms_q_08 | Prepare the Shared Table | risk a social refusal | 33 gold; 4 kit marks; 2 threshold_rooms_favor |
| threshold_rooms_q_09 | Solve the Signal Thread | accept a public record | 36 gold; 5 kit marks; 3 threshold_rooms_favor |
| threshold_rooms_q_10 | Return the First Notice | leave a resource for another player | 39 gold; 6 kit marks; 1 threshold_rooms_favor |
| threshold_rooms_q_11 | Map the Broken Route | lose a daylight turn | 42 gold; 7 kit marks; 2 threshold_rooms_favor |
| threshold_rooms_q_12 | Decide the Quiet Debt | spend 1 supply | 45 gold; 8 kit marks; 3 threshold_rooms_favor |
| threshold_rooms_q_13 | Aid the Open Door | risk a social refusal | 48 gold; 9 kit marks; 1 threshold_rooms_favor |
| threshold_rooms_q_14 | Recover the Weather Mark | accept a public record | 51 gold; 10 kit marks; 2 threshold_rooms_favor |
| threshold_rooms_q_15 | Signal the Lost Shift | leave a resource for another player | 54 gold; 4 kit marks; 3 threshold_rooms_favor |
| threshold_rooms_q_16 | Gather the Old Promise | lose a daylight turn | 57 gold; 5 kit marks; 1 threshold_rooms_favor |
| threshold_rooms_q_17 | Protect the Shared Table | spend 1 supply | 60 gold; 6 kit marks; 2 threshold_rooms_favor |
| threshold_rooms_q_18 | Celebrate the Signal Thread | risk a social refusal | 63 gold; 7 kit marks; 3 threshold_rooms_favor |


## 8. Species, companions, and collectibles

| collectibleId | Species / item | Care or discovery loop |
| --- | --- | --- |
| threshold_rooms_spec_01 | paper moth | Observe, assist, and record paper moth; completion grants a cosmetic field-note plate. |
| threshold_rooms_spec_02 | lost hound | Observe, assist, and record lost hound; completion grants a cosmetic field-note plate. |
| threshold_rooms_spec_03 | clock beetle | Observe, assist, and record clock beetle; completion grants a cosmetic field-note plate. |
| threshold_rooms_spec_04 | hush crow | Observe, assist, and record hush crow; completion grants a cosmetic field-note plate. |
| threshold_rooms_collect_01 | Welcome Desk token | Find through a non-gacha exploration, craft, talk, or instance route. |
| threshold_rooms_collect_02 | Carpet Hall token | Find through a non-gacha exploration, craft, talk, or instance route. |
| threshold_rooms_collect_03 | Blue Stair token | Find through a non-gacha exploration, craft, talk, or instance route. |
| threshold_rooms_collect_04 | Exit Light token | Find through a non-gacha exploration, craft, talk, or instance route. |
| threshold_rooms_collect_05 | Welcome Desk token | Find through a non-gacha exploration, craft, talk, or instance route. |
| threshold_rooms_collect_06 | Carpet Hall token | Find through a non-gacha exploration, craft, talk, or instance route. |
| threshold_rooms_collect_07 | Blue Stair token | Find through a non-gacha exploration, craft, talk, or instance route. |
| threshold_rooms_collect_08 | Exit Light token | Find through a non-gacha exploration, craft, talk, or instance route. |


## 9. Loot and vendors

| lootId | Rarity | Policy |
| --- | --- | --- |
| threshold_rooms_loot_01 | uncommon | Carpet Hall keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_02 | rare | Blue Stair keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_03 | keepsake | Exit Light keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_04 | common | Welcome Desk keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_05 | uncommon | Carpet Hall keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_06 | rare | Blue Stair keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_07 | keepsake | Exit Light keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_08 | common | Welcome Desk keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_09 | uncommon | Carpet Hall keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_10 | rare | Blue Stair keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_11 | keepsake | Exit Light keepsake; cosmetic or crafting-only; never a paid outcome. |
| threshold_rooms_loot_12 | common | Welcome Desk keepsake; cosmetic or crafting-only; never a paid outcome. |


Vendor `threshold_rooms_vendor_01` is at **Welcome Desk**. Gold buys cosmetics, clear utility labels, and non-power collection presentation only. Cosmetic tokens buy equivalent cosmetic presentation only. No gacha, power packs, catches, raid clears, lockout skips, or outcome modification are sold.

## 10. Instances and big night

| instanceId | Instance | Party | Boss / climax | Rules |
| --- | --- | --- | --- | --- |
| threshold_rooms_inst_01 | Exit Light: The Held Door | 2–5 | threshold_rooms_boss_01 | checkpoint on wipe; personal loot; weekly lockout only for the boss |


The scheduled **Threshold Rooms Big Night** is a 2–5 player optional event, except where a later safety and capacity review approves a 10-player skin-specific raid. It is cosmetic-only and does not claim public network scale.

## 11. Talent nodes

| talentId | Node | Lane | Effect |
| --- | --- | --- | --- |
| threshold_rooms_tal_01 | Clear Signal | talk | Gain +2 talk mark after a committed success. |
| threshold_rooms_tal_02 | Helping Hand | support | Gain +3 support mark after a committed success. |
| threshold_rooms_tal_03 | Local Memory | craft | Gain +1 craft mark after a committed success. |
| threshold_rooms_tal_04 | Steady Craft | travel | Gain +2 route mark after a committed success. |
| threshold_rooms_tal_05 | Open Route | talk | Gain +3 talk mark after a committed success. |
| threshold_rooms_tal_06 | Kind Word | support | Gain +1 support mark after a committed success. |
| threshold_rooms_tal_07 | Safe Return | craft | Gain +2 craft mark after a committed success. |
| threshold_rooms_tal_08 | Careful Step | travel | Gain +3 route mark after a committed success. |
| threshold_rooms_tal_09 | Clear Signal | talk | Gain +1 talk mark after a committed success. |
| threshold_rooms_tal_10 | Helping Hand | support | Gain +2 support mark after a committed success. |
| threshold_rooms_tal_11 | Local Memory | craft | Gain +3 craft mark after a committed success. |
| threshold_rooms_tal_12 | Steady Craft | travel | Gain +1 route mark after a committed success. |


## 12. Theme Kit

| Element | Brief |
| --- | --- |
| Font stack | System-ui, `ui-rounded`, Arial, sans-serif; no bundled or pirated font files. |
| Dice material | Tactile `leaf green, solar gold, and recycled glass` resin-and-paper token, rendered as flat text UI treatment only. |
| Chrome labels | **Ledger**, **Route**, **Talk**, **Kit**, **Pack**, **Rest**. |
| Fashion default | Layered practical travelwear with one readable local material motif; no copied silhouette. |
| Accessibility | TTS reads chrome and prose; font scale is supported; danger never uses color alone. |

## 13. Failure states and safety

| Failure id | Trigger | Resolution |
| --- | --- | --- |
| `threshold_rooms_fail_01` | Encounter HP / steadfast reaches zero. | Checkpoint return; retain personal loot; reset only encounter state. |
| `threshold_rooms_fail_02` | A timed local task expires. | Record a non-punitive alternate route; no dead-end. |
| `threshold_rooms_fail_03` | Social invitation is declined. | Respect boundary; unlock solo alternative. |
| `threshold_rooms_fail_04` | Party disconnects before combat. | End encounter safely; no mid-combat fill. |

Kid Mode is available where age-appropriate: **10 turns/day**, no public DMs, trade, or voice. Reports, mute, and block are local safety controls.

## 14. Name and visual ban-list (50)

The following are prohibited in names, prompts, art direction, data labels, store copy, and generated stills: borrowed franchise kingdom, named legacy faction, recognizable trademark crest, copyrighted character silhouette, direct map replica, copied quest text, lifted class name, licensed monster name, familiar mascot color code, signature spell wording, well-known catchphrase, named hero lineage, specific anime uniform, famous game-logo geometry, existing creature evolution chart, recognizable toy-ball device, copyrighted school-house name, known guild insignia, specific proprietary city skyline, identifiable quest giver, replicated dungeon floorplan, famous sword profile, licensed vehicle livery, brand-like companion anatomy, recognizable creature cry, existing server slogan, direct fan-server name, replicated crafting recipe, known faction motto, copied UI glyph, trademarked music motif, imitated title treatment, recognized comic emblem, borrowed national costume as uniform, religious symbol as loot, real-world sacred rite as mechanic, ethnic caricature, colonial conquest fantasy, slur or demeaning exonym, sexualized minor-coded look, non-consensual romance route, paid power item, loot-box or gacha pitch, lockout-skip sale, real-person likeness, AI imitation of living artist, gore-forward Kid art, unmoderated public chat, voice-chat dependency, external proprietary lore.
