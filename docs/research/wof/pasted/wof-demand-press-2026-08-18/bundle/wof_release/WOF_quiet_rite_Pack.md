# WOF Quiet Rite: World Pack

> **Release position:** A WOF text-world pack for **solo and private co-op**. It is not marketed as an MMO until multiplayer operation is proven. All resolution is owned by the shared engine: it commits dice, HP, ledgers, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before narration.

## 1. Header and identity

| Field | Value |
| --- | --- |
| worldId | `quiet_rite` |
| Working display name | **Quiet Rite** |
| Maturity | **teen** |
| rulesModuleId | `steadfast` |
| Core promise | Household haunt care and original exorcist practice. |
| First-hour local problem | A public obligation has failed at **Rite House**; the player must choose whom to disappoint before receiving a combat or social task. |
| Originality fence | This world is an original WOF setting. It borrows no protected geography, named characters, costume codes, monster catalogues, plot arcs, slogans, or proprietary rule language. If it carries folklore-adjacent texture, it uses an invented people, place, calendar, and conflict rather than a reconstruction or claim of authority. |

## 2. Rules module — CODE fields

| Contract element | Specification |
| --- | --- |
| Ledger fields | steadfast, clue, ward, safety, checkpoint, lockout, party |
| Resolve | Code validates, rolls, commits, then narration describes the committed result. |
| Wipe / fail | Checkpoint return; personal loot remains; no permadeath in v1. |
| Lockout | Weekly per-character boss lockout when the world has a boss flag. |
| Status effects | guarded, exposed, focused, slowed, steadied, rattled, inspired, spent |
| Verbs | inspect, travel, act, brace, help, rest, trade, talk, use, retreat, claim, report |
| Chrome templates | ledger, turn cue, party pane, checkpoint seal, loot receipt |
| Eval probes | steadfast_probe_01, steadfast_probe_02, steadfast_probe_03, steadfast_probe_04, steadfast_probe_05, steadfast_probe_06, steadfast_probe_07, steadfast_probe_08, steadfast_probe_09, steadfast_probe_10 |

**Engine boundaries.** Tier-3 hubs and instanced encounters are used; party size is 2–5; lockstep applies when playing together; there is no mid-combat fill, contested open-world PvP, guild bank, global chat, permadeath, or outcome-selling store item. Presence shows only nearby count and races. English is v1.

## 3. Identity kits

| kitId | Name | Entry identity |
| --- | --- | --- |
| quiet_rite_kit_courier | Courier | A route-reading entry kit with a non-power cosmetic wardrobe and one talk angle. |
| quiet_rite_kit_maker | Maker | A practical entry kit with a non-power cosmetic wardrobe and one talk angle. |
| quiet_rite_kit_scout | Scout | A observant entry kit with a non-power cosmetic wardrobe and one talk angle. |
| quiet_rite_kit_warden | Warden | A protective entry kit with a non-power cosmetic wardrobe and one talk angle. |


Each kit begins with one garment, one instrument or tool, one non-combat emote, and a premade first line. Kits provide flavor; they never gate paid power.

## 4. Place graph

| placeId | Place | Role | Room-first problem |
| --- | --- | --- | --- |
| quiet_rite_place_01 | Rite House | hub | A local problem is visible before any creature or confrontation: a broken public promise. |
| quiet_rite_place_02 | Candle Street | hub | A local problem is visible before any creature or confrontation: a missing shift roster. |
| quiet_rite_place_03 | Sigh Garden | wild | A local problem is visible before any creature or confrontation: a cracked route marker. |
| quiet_rite_place_04 | Bell Cellar | wild | A local problem is visible before any creature or confrontation: an unpaid repair notice. |


**Graph.** `quiet_rite_place_01 → quiet_rite_place_02 → quiet_rite_place_03 ↔ quiet_rite_place_04 → quiet_rite_place_04`. Optional side routes return to the first hub. A room, weather, sound, and practical obstacle are described before any creature, character threat, or encounter. Housing is labelled **private room / plot flavor**, not a claim of persistent public housing.

## 5. NPCs and premade talk

| npcId | NPC | Role | Premade talk with stake |
| --- | --- | --- | --- |
| quiet_rite_npc_01 | Mara Vell | asks for help | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| quiet_rite_npc_02 | Orin Pike | guards a boundary | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| quiet_rite_npc_03 | Sable Rook | knows a rumor | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| quiet_rite_npc_04 | Tavi Fen | offers a trade | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| quiet_rite_npc_05 | Ione Bell | challenges a choice | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |
| quiet_rite_npc_06 | Perrin Vale | needs a witness | ‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies] |


Hub talk uses canned, context-safe prompts only. Public freeform DMs, voice, and unmoderated trade are not part of this pack.

## 6. Opening choices and consequence policy

| Choice id | Opening choice | Stake | Committed outcome |
| --- | --- | --- | --- |
| `quiet_rite_choice_01` | Take the overdue delivery. | Lose time before the first checkpoint. | Gain route access and a witness. |
| `quiet_rite_choice_02` | Repair the public marker. | Spend 1 supplies. | Gain local trust and a repair recipe. |
| `quiet_rite_choice_03` | Tell the truth to the waiting resident. | Risk 2 reputation marks. | Unlock a candid NPC branch. |
| `quiet_rite_choice_04` | Keep the promise to your kit partner. | Forgo immediate gold. | Earn a cosmetic keepsake path. |

No choice deletes another player, locks a paid path, or creates a permanent punitive state. The narrator may present tone and context only after the ledger outcome is committed.

## 7. Quest catalogue

| questId | Quest | Opening stake | Numeric reward |
| --- | --- | --- | --- |
| quiet_rite_q_01 | Inspect the First Notice | lose a daylight turn | 12 gold; 4 kit marks; 1 quiet_rite_favor |
| quiet_rite_q_02 | Carry the Broken Route | spend 1 supply | 15 gold; 5 kit marks; 2 quiet_rite_favor |
| quiet_rite_q_03 | Listen the Quiet Debt | risk a social refusal | 18 gold; 6 kit marks; 3 quiet_rite_favor |
| quiet_rite_q_04 | Repair the Open Door | accept a public record | 21 gold; 7 kit marks; 1 quiet_rite_favor |
| quiet_rite_q_05 | Escort the Weather Mark | leave a resource for another player | 24 gold; 8 kit marks; 2 quiet_rite_favor |
| quiet_rite_q_06 | Negotiate the Lost Shift | lose a daylight turn | 27 gold; 9 kit marks; 3 quiet_rite_favor |
| quiet_rite_q_07 | Track the Old Promise | spend 1 supply | 30 gold; 10 kit marks; 1 quiet_rite_favor |
| quiet_rite_q_08 | Prepare the Shared Table | risk a social refusal | 33 gold; 4 kit marks; 2 quiet_rite_favor |
| quiet_rite_q_09 | Solve the Signal Thread | accept a public record | 36 gold; 5 kit marks; 3 quiet_rite_favor |
| quiet_rite_q_10 | Return the First Notice | leave a resource for another player | 39 gold; 6 kit marks; 1 quiet_rite_favor |
| quiet_rite_q_11 | Map the Broken Route | lose a daylight turn | 42 gold; 7 kit marks; 2 quiet_rite_favor |
| quiet_rite_q_12 | Decide the Quiet Debt | spend 1 supply | 45 gold; 8 kit marks; 3 quiet_rite_favor |
| quiet_rite_q_13 | Aid the Open Door | risk a social refusal | 48 gold; 9 kit marks; 1 quiet_rite_favor |
| quiet_rite_q_14 | Recover the Weather Mark | accept a public record | 51 gold; 10 kit marks; 2 quiet_rite_favor |
| quiet_rite_q_15 | Signal the Lost Shift | leave a resource for another player | 54 gold; 4 kit marks; 3 quiet_rite_favor |
| quiet_rite_q_16 | Gather the Old Promise | lose a daylight turn | 57 gold; 5 kit marks; 1 quiet_rite_favor |
| quiet_rite_q_17 | Protect the Shared Table | spend 1 supply | 60 gold; 6 kit marks; 2 quiet_rite_favor |
| quiet_rite_q_18 | Celebrate the Signal Thread | risk a social refusal | 63 gold; 7 kit marks; 3 quiet_rite_favor |


## 8. Species, companions, and collectibles

| collectibleId | Species / item | Care or discovery loop |
| --- | --- | --- |
| quiet_rite_spec_01 | bell moth | Observe, assist, and record bell moth; completion grants a cosmetic field-note plate. |
| quiet_rite_spec_02 | salt dog | Observe, assist, and record salt dog; completion grants a cosmetic field-note plate. |
| quiet_rite_spec_03 | porch owl | Observe, assist, and record porch owl; completion grants a cosmetic field-note plate. |
| quiet_rite_spec_04 | thread fish | Observe, assist, and record thread fish; completion grants a cosmetic field-note plate. |
| quiet_rite_collect_01 | Rite House token | Find through a non-gacha exploration, craft, talk, or instance route. |
| quiet_rite_collect_02 | Candle Street token | Find through a non-gacha exploration, craft, talk, or instance route. |
| quiet_rite_collect_03 | Sigh Garden token | Find through a non-gacha exploration, craft, talk, or instance route. |
| quiet_rite_collect_04 | Bell Cellar token | Find through a non-gacha exploration, craft, talk, or instance route. |
| quiet_rite_collect_05 | Rite House token | Find through a non-gacha exploration, craft, talk, or instance route. |
| quiet_rite_collect_06 | Candle Street token | Find through a non-gacha exploration, craft, talk, or instance route. |
| quiet_rite_collect_07 | Sigh Garden token | Find through a non-gacha exploration, craft, talk, or instance route. |
| quiet_rite_collect_08 | Bell Cellar token | Find through a non-gacha exploration, craft, talk, or instance route. |


## 9. Loot and vendors

| lootId | Rarity | Policy |
| --- | --- | --- |
| quiet_rite_loot_01 | uncommon | Candle Street keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_02 | rare | Sigh Garden keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_03 | keepsake | Bell Cellar keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_04 | common | Rite House keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_05 | uncommon | Candle Street keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_06 | rare | Sigh Garden keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_07 | keepsake | Bell Cellar keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_08 | common | Rite House keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_09 | uncommon | Candle Street keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_10 | rare | Sigh Garden keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_11 | keepsake | Bell Cellar keepsake; cosmetic or crafting-only; never a paid outcome. |
| quiet_rite_loot_12 | common | Rite House keepsake; cosmetic or crafting-only; never a paid outcome. |


Vendor `quiet_rite_vendor_01` is at **Rite House**. Gold buys cosmetics, clear utility labels, and non-power collection presentation only. Cosmetic tokens buy equivalent cosmetic presentation only. No gacha, power packs, catches, raid clears, lockout skips, or outcome modification are sold.

## 10. Instances and big night

| instanceId | Instance | Party | Boss / climax | Rules |
| --- | --- | --- | --- | --- |
| quiet_rite_inst_01 | Bell Cellar: The Held Door | 2–5 | quiet_rite_boss_01 | checkpoint on wipe; personal loot; weekly lockout only for the boss |


The scheduled **Quiet Rite Big Night** is a 2–5 player optional event, except where a later safety and capacity review approves a 10-player skin-specific raid. It is cosmetic-only and does not claim public network scale.

## 11. Talent nodes

| talentId | Node | Lane | Effect |
| --- | --- | --- | --- |
| quiet_rite_tal_01 | Clear Signal | talk | Gain +2 talk mark after a committed success. |
| quiet_rite_tal_02 | Helping Hand | support | Gain +3 support mark after a committed success. |
| quiet_rite_tal_03 | Local Memory | craft | Gain +1 craft mark after a committed success. |
| quiet_rite_tal_04 | Steady Craft | travel | Gain +2 route mark after a committed success. |
| quiet_rite_tal_05 | Open Route | talk | Gain +3 talk mark after a committed success. |
| quiet_rite_tal_06 | Kind Word | support | Gain +1 support mark after a committed success. |
| quiet_rite_tal_07 | Safe Return | craft | Gain +2 craft mark after a committed success. |
| quiet_rite_tal_08 | Careful Step | travel | Gain +3 route mark after a committed success. |
| quiet_rite_tal_09 | Clear Signal | talk | Gain +1 talk mark after a committed success. |
| quiet_rite_tal_10 | Helping Hand | support | Gain +2 support mark after a committed success. |
| quiet_rite_tal_11 | Local Memory | craft | Gain +3 craft mark after a committed success. |
| quiet_rite_tal_12 | Steady Craft | travel | Gain +1 route mark after a committed success. |


## 12. Theme Kit

| Element | Brief |
| --- | --- |
| Font stack | System-ui, `ui-rounded`, Arial, sans-serif; no bundled or pirated font files. |
| Dice material | Tactile `warm terracotta and river blue` resin-and-paper token, rendered as flat text UI treatment only. |
| Chrome labels | **Ledger**, **Route**, **Talk**, **Kit**, **Pack**, **Rest**. |
| Fashion default | Layered practical travelwear with one readable local material motif; no copied silhouette. |
| Accessibility | TTS reads chrome and prose; font scale is supported; danger never uses color alone. |

## 13. Failure states and safety

| Failure id | Trigger | Resolution |
| --- | --- | --- |
| `quiet_rite_fail_01` | Encounter HP / steadfast reaches zero. | Checkpoint return; retain personal loot; reset only encounter state. |
| `quiet_rite_fail_02` | A timed local task expires. | Record a non-punitive alternate route; no dead-end. |
| `quiet_rite_fail_03` | Social invitation is declined. | Respect boundary; unlock solo alternative. |
| `quiet_rite_fail_04` | Party disconnects before combat. | End encounter safely; no mid-combat fill. |

Kid Mode is available where age-appropriate: **10 turns/day**, no public DMs, trade, or voice. Reports, mute, and block are local safety controls.

## 14. Name and visual ban-list (50)

The following are prohibited in names, prompts, art direction, data labels, store copy, and generated stills: borrowed franchise kingdom, named legacy faction, recognizable trademark crest, copyrighted character silhouette, direct map replica, copied quest text, lifted class name, licensed monster name, familiar mascot color code, signature spell wording, well-known catchphrase, named hero lineage, specific anime uniform, famous game-logo geometry, existing creature evolution chart, recognizable toy-ball device, copyrighted school-house name, known guild insignia, specific proprietary city skyline, identifiable quest giver, replicated dungeon floorplan, famous sword profile, licensed vehicle livery, brand-like companion anatomy, recognizable creature cry, existing server slogan, direct fan-server name, replicated crafting recipe, known faction motto, copied UI glyph, trademarked music motif, imitated title treatment, recognized comic emblem, borrowed national costume as uniform, religious symbol as loot, real-world sacred rite as mechanic, ethnic caricature, colonial conquest fantasy, slur or demeaning exonym, sexualized minor-coded look, non-consensual romance route, paid power item, loot-box or gacha pitch, lockout-skip sale, real-person likeness, AI imitation of living artist, gore-forward Kid art, unmoderated public chat, voice-chat dependency, external proprietary lore.
