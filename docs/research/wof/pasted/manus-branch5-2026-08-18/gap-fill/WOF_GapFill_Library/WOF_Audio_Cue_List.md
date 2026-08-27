# WOF Audio Cue List

**Companion:** Optional WOF gap-fill library deliverable  
**Scope:** WOF Theme Kit sound-effect cue names only  
**Format:** Markdown catalog; no audio files, paths, implementation code, or licensed references

## Purpose and boundaries

This catalog defines stable, original cue identifiers and public names for the WOF Theme Kit sound-effect layer. It is intentionally **WOF-only** and contains names rather than audio assets. A cue is an event label for a short, non-verbal sound effect; it does not specify a file, synthesis recipe, middleware event, volume value, or production implementation.

The catalog covers the required shared Theme Kit SFX families—combat, traversal, interaction, social, mail, progression, auction, housing, and system feedback—while retaining the locked Ash Compact names where they are used as world-facing context. It contains no live SynapticGM content, no imported save or runtime identifiers, no 3D requirements, and no licensed intellectual property.

> **Audio policy:** One ambient loop and the SFX catalog belong to the Theme Kit baseline. Extra music is outside this file and may be offered only as a cosmetic shop item; outcomes, power, catch-rate benefits, lockout skips, and combat advantages are never audio-gated.

## Naming and ingestion contract

Every cue ID is unique within this file, lowercase, and uses the `wof_sfx_` namespace. IDs are stable data keys; the display name may be localized later without changing the key. Names are descriptive and original, not references to existing games, films, franchises, characters, or licensed music.

All cues are short event sounds. They may be triggered by committed game state or by non-stateful interface feedback. Narration may describe the resulting event after state resolution, but narration does not mint, alter, or infer rewards, turns, gold, loot, lockouts, combat results, or auction outcomes.

| Field | Meaning |
|---|---|
| `cue_id` | Stable WOF identifier. |
| `display_name` | Human-readable cue name; names only, not a filename. |
| `family` | Shared cue family used for filtering and Theme Kit mapping. |
| `trigger` | State or interface event that may request the cue. |
| `state_authority` | `CODE` for committed state, or `UI` for local interface feedback. |
| `notes` | Short usage boundary; no asset or implementation details. |

## Shared cue catalog

### Combat and instance resolution

| cue_id | display_name | family | trigger | state_authority | notes |
|---|---|---|---|---|---|
| `wof_sfx_combat_round_start` | Round Lantern | combat | A committed combat round opens. | CODE | One cue per resolved round start. |
| `wof_sfx_combat_ready` | Ready Mark | combat | All required party plans are accepted. | CODE | Does not imply a successful attack. |
| `wof_sfx_attack_light` | Kindled Strike | combat | A light attack receipt is committed. | CODE | Generic impact cue. |
| `wof_sfx_attack_heavy` | Hearthfall Impact | combat | A heavy attack receipt is committed. | CODE | Generic impact cue. |
| `wof_sfx_attack_miss` | Empty Arc | combat | A committed attack misses. | CODE | No damage is implied. |
| `wof_sfx_attack_guard` | Braced Edge | combat | A guard or mitigation result is committed. | CODE | Defensive resolution only. |
| `wof_sfx_status_apply` | Mark Settled | combat | A status effect is successfully applied. | CODE | Shared across module tags. |
| `wof_sfx_status_clear` | Mark Released | combat | A status effect is removed or expires. | CODE | Does not indicate healing. |
| `wof_sfx_target_locked` | Chosen Thread | combat | A declared target is accepted. | CODE | Lockstep target declaration. |
| `wof_sfx_ally_down` | Fallen Wick | combat | A character becomes downed. | CODE | Downed is not permadeath. |
| `wof_sfx_checkpoint_reached` | Safe Ember | instance | A checkpoint is committed. | CODE | Available before or after a wipe. |
| `wof_sfx_wipe` | Quieted Room | instance | The instance records a party wipe. | CODE | Checkpoint flow follows separately. |
| `wof_sfx_instance_clear` | Cleared Horizon | instance | Instance completion is committed. | CODE | Loot and rewards remain code-owned. |
| `wof_sfx_instance_abandon` | Unlit Retreat | instance | The party abandons an instance. | CODE | No completion reward. |
| `wof_sfx_lockout_set` | Seal Set | instance | A weekly per-character lockout is recorded. | CODE | Never a purchase prompt. |
| `wof_sfx_lockout_end` | Seal Lifted | instance | A lockout becomes available again. | CODE | Availability only. |
| `wof_sfx_reconnect_checkpoint` | Thread Rejoined | instance | A reconnect restores the checkpoint state. | CODE | No rewind beyond committed state. |
| `wof_sfx_hold_order` | Hold the Line | combat | A hold order is accepted. | CODE | Disconnect and plan-auto feedback. |
| `wof_sfx_combat_receipt` | Ledger Chime | combat | A combat receipt is displayed. | UI | Mirrors committed receipt data. |

### Travel and place interaction

| cue_id | display_name | family | trigger | state_authority | notes |
|---|---|---|---|---|---|
| `wof_sfx_place_arrive` | Threshold Welcome | travel | A character arrives at a place. | CODE | Place identity comes from the world pack. |
| `wof_sfx_place_depart` | Roadward Step | travel | A character departs through a valid exit. | CODE | No teleport implication. |
| `wof_sfx_ferry_depart` | Tidebell Departure | travel | A paid ferry exit resolves. | CODE | WOF travel graph event. |
| `wof_sfx_coach_depart` | Coachwheel Departure | travel | A paid coach exit resolves. | CODE | WOF travel graph event. |
| `wof_sfx_inn_bind` | Hearthmark Bound | travel | An inn bind is committed. | CODE | First bind costs one turn; later same-region board use does not. |
| `wof_sfx_inn_rest` | Resting Ember | travel | Hub rest completes. | CODE | Rest restores HP and STA; it does not repair. |
| `wof_sfx_door_open` | Unbarred Way | interaction | A door opens successfully. | CODE | Generic place interaction. |
| `wof_sfx_door_close` | Bar Drawn | interaction | A door closes successfully. | CODE | Generic place interaction. |
| `wof_sfx_gate_unlock` | Gate Answered | interaction | A locked gate accepts its required condition. | CODE | Does not bypass requirements. |
| `wof_sfx_lever_pull` | Iron Answer | interaction | A lever state changes. | CODE | State result is authoritative. |
| `wof_sfx_bell_ring` | Bell Across Water | interaction | A bell interaction resolves. | CODE | May be used by ferry or hall interactables. |
| `wof_sfx_note_read` | Ink Remembered | interaction | A readable note or plaque opens. | UI | Text remains the source of truth. |
| `wof_sfx_quest_offer` | Promise Offered | interaction | A valid quest offer is shown. | CODE | No reward claim. |
| `wof_sfx_quest_turnin` | Promise Fulfilled | interaction | Quest turn-in commits. | CODE | Reward data remains code-owned. |
| `wof_sfx_quest_denied` | Promise Deferred | interaction | A quest action fails its requirements. | UI | No invented explanation. |

### Ash Compact contextual cues

These names preserve the locked **Ash Compact** and place terms as public context. They do not create replacement IDs for locked places or quests.

| cue_id | display_name | family | trigger | state_authority | notes |
|---|---|---|---|---|---|
| `wof_sfx_ash_reedfen_arrival` | Reedfen Arrival | ash_compact | Arrival at the Reedfen start loop is committed. | CODE | Context for `poi_reedfen_square` and related locked places. |
| `wof_sfx_ash_wickhaven_arrival` | Wickhaven Arrival | ash_compact | Arrival at Wickhaven is committed. | CODE | Context for the Lanternfolk start. |
| `wof_sfx_ash_brinewatch_arrival` | Brinewatch Arrival | ash_compact | Arrival at Brinewatch is committed. | CODE | Context for the Saltkin start. |
| `wof_sfx_ash_anvil_gate_arrival` | Anvil Gate Arrival | ash_compact | Arrival at Anvil Gate is committed. | CODE | Context for the Stonevein start. |
| `wof_sfx_ash_lampwood_gate` | Lampwood Gate | ash_compact | Entry to `dungeon_lampwood_gate` is committed. | CODE | Locked dungeon name preserved. |
| `wof_sfx_ash_unlit_hollow` | Unlit Hollow | ash_compact | Entry to `dungeon_unlit_hollow` is committed. | CODE | Locked dungeon name preserved. |
| `wof_sfx_ash_coil_warehouse` | Coil Warehouse | ash_compact | Entry to `dungeon_coil_warehouse` is committed. | CODE | Locked dungeon name preserved. |
| `wof_sfx_ash_anvil_deep` | Anvil Deep | ash_compact | Entry to `dungeon_anvil_deep` is committed. | CODE | Locked dungeon name preserved. |
| `wof_sfx_ash_millstone_hollow` | Millstone Hollow | ash_compact | The 10-person, three-phase instance opens or advances. | CODE | Never resized or renamed. |
| `wof_sfx_ash_the_divide_crossing` | The Divide Crossing | ash_compact | Travel through `poi_the_divide` resolves. | CODE | New travel node; no teleport. |
| `wof_sfx_ash_ash_seat_arrival` | Ash Seat Arrival | ash_compact | Arrival at `poi_ash_seat` is committed. | CODE | Locked capital name preserved. |
| `wof_sfx_ash_tidehold_arrival` | Tidehold Arrival | ash_compact | Arrival at `poi_tidehold` is committed. | CODE | Locked capital name preserved. |
| `wof_sfx_ash_keep_path_lit` | Keep the Path Lit | ash_compact | Locked Lanternfolk quest title is displayed at a valid state transition. | UI | Display name preserved; no quest ID replacement. |
| `wof_sfx_ash_flats_are_wrong` | The Flats Are Wrong | ash_compact | Locked Saltkin quest title is displayed at a valid state transition. | UI | Display name preserved; no quest ID replacement. |
| `wof_sfx_ash_stair_has_crack` | The Stair Has a Crack | ash_compact | Locked Stonevein quest title is displayed at a valid state transition. | UI | Display name preserved; no quest ID replacement. |
| `wof_sfx_ash_hearthborn_request` | The Hearthborn's Request | ash_compact | Locked Hearthborn quest title is displayed at a valid state transition. | UI | Display name preserved; no quest ID replacement. |

### Social, mail, and presence

| cue_id | display_name | family | trigger | state_authority | notes |
|---|---|---|---|---|---|
| `wof_sfx_party_invite` | Company Invitation | social | A party invitation is received. | CODE | Essential push event may mirror it. |
| `wof_sfx_party_join` | Company Joined | social | A party member joins successfully. | CODE | No mid-combat fill. |
| `wof_sfx_party_leave` | Company Departed | social | A party member leaves. | CODE | Does not eject a combat instance mid-round. |
| `wof_sfx_party_ready` | Company Ready | social | Party readiness reaches the required state. | CODE | Separate from combat round start. |
| `wof_sfx_friend_request` | Hand Extended | social | A friend request arrives. | CODE | Friends-first systems only. |
| `wof_sfx_friend_accept` | Hand Accepted | social | A friend request is accepted. | CODE | Local confirmation. |
| `wof_sfx_tell_received` | Private Wick | social | A permitted tell arrives. | CODE | Kid Mode restrictions still apply. |
| `wof_sfx_tell_blocked` | Private Wick Refused | social | A tell is blocked by a mute, block, rate limit, or age rule. | CODE | No public explanation beyond UI copy. |
| `wof_sfx_presence_nearby` | Nearby Company | social | Nearby-player count refreshes. | CODE | Never names strangers. |
| `wof_sfx_emote_acknowledged` | Gesture Answered | social | A text emote is accepted locally. | UI | Animation-free text companion. |
| `wof_sfx_mail_received` | Mail at the Door | mail | New mail is committed to the inbox. | CODE | Applies to system, vendor, auction, and friend mail. |
| `wof_sfx_mail_open` | Letter Opened | mail | A mail item is opened. | UI | No reward is granted by opening sound. |
| `wof_sfx_mail_digest` | Weekly Ledger | mail | A weekly digest is delivered. | CODE | Digest content comes from committed state. |
| `wof_sfx_mail_retry` | Letter Retry | mail | A safe retry is available after a mail error. | UI | Never duplicates a grant. |
| `wof_sfx_mail_empty` | Empty Letterbox | mail | The inbox has no readable mail. | UI | Empty-state feedback. |

### Progression and character feedback

| cue_id | display_name | family | trigger | state_authority | notes |
|---|---|---|---|---|---|
| `wof_sfx_level_up` | New Measure | progression | Level advancement commits. | CODE | No power purchase implied. |
| `wof_sfx_xp_gain` | Thread of Growth | progression | XP gain is committed. | CODE | Optional low-priority feedback. |
| `wof_sfx_talent_node_unlock` | Talent Unlatched | progression | A talent node unlock commits. | CODE | Requires valid cost and prerequisites. |
| `wof_sfx_achievement_earned` | Name Entered | progression | An achievement flag commits. | CODE | Cosmetic/title tracking only unless data says otherwise. |
| `wof_sfx_title_awarded` | Title Set | progression | A title becomes available. | CODE | Cosmetic presentation. |
| `wof_sfx_item_received` | Item in Hand | progression | A personal loot or valid item grant commits. | CODE | Idempotent grant key required. |
| `wof_sfx_item_bound` | Item Bound | progression | Bind state changes to soulbound or account-bound. | CODE | No unbinding implied. |
| `wof_sfx_gold_received` | Gold Counted | progression | A valid gold grant commits. | CODE | LLM never mints gold. |
| `wof_sfx_gold_spent` | Gold Paid | progression | A valid gold spend commits. | CODE | Does not expose amount in the cue name. |
| `wof_sfx_cosmetic_unlocked` | Chrome Unlocked | progression | A cosmetic entitlement commits. | CODE | Cosmetic wallet remains separate from gold. |
| `wof_sfx_durability_warning` | Edge Worn | progression | Durability crosses the warning threshold. | CODE | Threshold is data-owned. |
| `wof_sfx_item_broken` | Edge Broken | progression | An item reaches zero durability. | CODE | Item remains repairable. |
| `wof_sfx_repair_complete` | Edge Restored | progression | A repair ticket completes. | CODE | No combat stat invention. |

### Auction, vendors, crafting, and housing

| cue_id | display_name | family | trigger | state_authority | notes |
|---|---|---|---|---|---|
| `wof_sfx_vendor_open` | Stall Awakened | commerce | A vendor interface opens. | UI | Personal copies remain separate. |
| `wof_sfx_vendor_purchase` | Stall Purchase | commerce | A vendor purchase commits. | CODE | Price and stock are code-owned. |
| `wof_sfx_vendor_sale` | Stall Sale | commerce | A valid sale commits. | CODE | No LLM in trade path. |
| `wof_sfx_craft_complete` | Work Finished | commerce | A recipe output commits. | CODE | v1 crafting fail chance is zero. |
| `wof_sfx_gather_complete` | Gathered Strand | commerce | A gathering result commits. | CODE | Daily cap and turn cost are code-owned. |
| `wof_sfx_auction_listed` | Auction Posted | auction | A buyout listing enters escrow. | CODE | Region auction house only. |
| `wof_sfx_auction_purchased` | Auction Claimed | auction | A buyout purchase commits. | CODE | No bid-war cue exists in v1. |
| `wof_sfx_auction_sold` | Auction Sold | auction | Seller sale confirmation commits. | CODE | Payout arrives through mail. |
| `wof_sfx_auction_expired` | Auction Expired | auction | A listing expires and returns through mail. | CODE | No automatic relisting. |
| `wof_sfx_auction_cancelled` | Auction Withdrawn | auction | A permitted listing cancellation commits. | CODE | Escrow rules remain authoritative. |
| `wof_sfx_auction_tax` | Auction Due | auction | Auction tax is recorded. | CODE | No hidden fee. |
| `wof_sfx_deed_granted` | Deed in Hand | housing | A housing deed is granted. | CODE | Plot scarcity is data-owned. |
| `wof_sfx_house_enter` | Holding Entered | housing | Owner or permitted guest enters a private holding. | CODE | Guests cannot loot chests. |
| `wof_sfx_house_exit` | Holding Left | housing | Character leaves a private holding. | CODE | No public-world claim. |
| `wof_sfx_furniture_placed` | Room Dressed | housing | Cosmetic or functional furniture placement commits. | CODE | Furniture provides no combat power. |
| `wof_sfx_furniture_removed` | Room Cleared | housing | Furniture removal commits. | CODE | Owner-controlled private instance. |
| `wof_sfx_upkeep_paid` | Holding Kept | housing | Weekly upkeep payment commits. | CODE | Gold amount remains data-owned. |
| `wof_sfx_upkeep_warning` | Holding at Risk | housing | Upkeep warning mail/state is committed. | CODE | Follow-up seizure rules are code-owned. |
| `wof_sfx_holding_lockout` | Holding Sealed | housing | Unpaid holding enters its one-week lockout. | CODE | No deletion cue. |
| `wof_sfx_holding_seized` | Holding Reclaimed | housing | NPC seizure in week three commits. | CODE | Cosmetic contents follow housing policy. |

### System, safety, and accessibility

| cue_id | display_name | family | trigger | state_authority | notes |
|---|---|---|---|---|---|
| `wof_sfx_ui_confirm` | Clear Confirm | system | A safe UI confirmation is accepted. | UI | Generic non-stateful feedback. |
| `wof_sfx_ui_cancel` | Clear Cancel | system | A UI action is cancelled. | UI | Generic non-stateful feedback. |
| `wof_sfx_ui_error` | Clear Error | system | A UI action cannot proceed. | UI | Pair with player-facing error code. |
| `wof_sfx_ui_locked` | Clear Lock | system | A UI action is unavailable by rule. | UI | Does not suggest a bypass. |
| `wof_sfx_turn_spent` | Turn Counted | system | A turn spend is committed. | CODE | Hub story beat and round rules remain authoritative. |
| `wof_sfx_turn_cap_warning` | Turn Horizon | system | Daily or Kid Mode turn cap warning displays. | CODE | No extra turns are sold. |
| `wof_sfx_push_essential` | Essential Chime | system | An essential party or system push is delivered. | CODE | Quiet hours apply. |
| `wof_sfx_age_gate` | Age Gate Set | system | Age gate state is accepted. | CODE | No content bypass. |
| `wof_sfx_moderation_notice` | Notice Delivered | safety | A moderation notice is committed. | CODE | No public shaming. |
| `wof_sfx_report_submitted` | Report Received | safety | A report ticket is created. | CODE | Auto versus human review is separate. |
| `wof_sfx_feature_disabled` | Feature Quieted | system | A feature kill switch is active. | CODE | Player receives text explanation. |
| `wof_sfx_save_persisted` | Chronicle Kept | system | A valid session or character persistence completes. | CODE | No live SynapticGM import. |

## Completeness and exclusion checklist

| Check | Result |
|---|---|
| Required cue families include hit, wipe, mail, level, and auction | Pass: combat impact cues, `wof_sfx_wipe`, mail cues, `wof_sfx_level_up`, and five auction cues are present. |
| Names only; no audio files or production app code | Pass. |
| WOF-only scope | Pass. The catalog uses WOF namespaces and WOF state boundaries. |
| Locked Ash Compact names preserved where relevant | Pass: Ash Compact, Reedfen, Wickhaven, Brinewatch, Anvil Gate, Lampwood Gate, Unlit Hollow, Coil Warehouse, Anvil Deep, Millstone Hollow, The Divide, Ash Seat, Tidehold, and locked quest display titles are unchanged. |
| No live SynapticGM content or import paths | Pass. |
| No licensed IP or franchise-specific names | Pass. |
| No placeholders or deferred work | Pass. |
| No outcome-selling or power-pack implication | Pass. Cues are feedback only; gold, loot, lockouts, combat, and entitlements remain code-owned. |
| No mid-combat fill, permadeath, global chat, or contested PvP assumptions | Pass. |
| Two-wallet distinction retained | Pass: gold and cosmetic entitlement cues are separate. |

## Catalog totals

The catalog contains **110 unique cue rows** across **13 families**: combat, instance, travel, interaction, ash_compact, social, mail, progression, commerce, auction, housing, system, and safety. `instance` and `ash_compact` are intentionally separated from the broader interaction and combat groups for ingestion filtering.

No row represents an audio file. Asset selection, loudness, duration, localization, accessibility behavior, and runtime routing remain outside this optional names-only companion.
