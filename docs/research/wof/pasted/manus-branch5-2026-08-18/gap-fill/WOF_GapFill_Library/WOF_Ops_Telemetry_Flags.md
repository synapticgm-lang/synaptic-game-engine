# WOF Operations, Telemetry, and Feature Flags

**Pack:** WOF (World of Fantasy) shared engine
**World scope:** Original WOF content only; examples use `ash_compact` and namespaced WOF packs.
**Format:** Markdown, `packFormatVersion: 1`
**Status:** Coding contract for a solo/private-co-op/limited-online-region text MMO; not production app code and never a live SynapticGM integration.

> Operational telemetry records committed engine state. The narrator may describe committed results, but never mints gold, rewards, damage, ownership, quest progress, lockouts, or clearance state.

## 1. Operating boundaries

The engine remains one shared implementation with many content packs. Combat is instanced and lockstep; overworld presence is limited to `nearbyPlayerCount` and race summaries. Party size is 2–5 for ordinary instances and 10 for raid skins. There is no global chat v1, no mid-combat fill, no permadeath, no corpse run, no guild bank, no contested open-world PvP, and no sale of outcomes, lockout skips, catch-rate packs, raid clears, or random power packs. Gold and cosmetic tokens are separate wallets. All event payloads below exclude direct personal data.

All identifiers are namespaced as `{worldId}:{kind}:{slug}`. Thus `ash_compact:place:poi_the_divide` and `badge_circuit:place:poi_the_divide` are distinct objects. Cross-world “Lantern” names are valid only when their `worldId` is present.

## 2. Kill switches

A kill switch is a server-side emergency control. It defaults to `false` for the disabled state, is evaluated before the named operation, and must fail closed for money, entitlement, reward, and combat-integrity paths. Every change is audit logged with operator identity, reason, previous value, new value, and timestamp; no switch is a paid player SKU.

| ID | Scope | Default | Disabled behavior | Safe recovery |
|---|---|---:|---|---|
| `ks_instances` | instance creation/join | false | block new instances; allow checkpoint exit | drain and re-enable after health probe |
| `ks_tells` | direct tells | false | queue no tells; show retry copy | release queued non-expired messages |
| `ks_auction_house` | AH listing/buyout | false | pause listing and buyout; preserve escrow | reconcile escrow before reopen |
| `ks_mail` | mail send/claim | false | hold outgoing mail; no item/gold claim | replay idempotently |
| `ks_housing` | deeds/interiors | false | freeze buy/build/upkeep transitions | verify holding ledger |
| `ks_vendors` | vendor buy/sell | false | disable transactions; retain stock | compare stock revision |
| `ks_rewards` | quest/loot grants | false | stop grants, keep receipts pending | replay by idempotency key |
| `ks_writer` | generated prose | false | use canned safe text | resume after ban-list probe |
| `ks_presence` | nearby counts/races | false | show “presence unavailable” | refresh hub snapshot |
| `ks_entitlements` | subscription/cosmetic grants | false | deny new grants; never revoke | reconcile provider receipt |
| `ks_kid_mode` | family safety controls | false | enforce strictest age gate | require policy check |
| `ks_raids` | raid creation/join | false | block Raid Mode C | leave existing groups at checkpoint |
| `ks_dailies` | daily/weekly contracts | false | freeze rollover and claims | apply one bounded catch-up |
| `ks_clock_tick` | weekly clock | false | do not advance clock | run reviewed tick once |
| `ks_trade` | direct friend trade | false | block new windows; preserve active escrow | expire safely after accept window |
| `ks_finder` | friends-first finder | false | block queue creation | rebuild queue index |
| `ks_push` | essential pushes | false | suppress nonessential sends | send only unexpired system notices |
| `ks_cosmetics_shop` | cosmetic catalog purchase | false | disable purchase; no power catalog exists | verify wallet debit receipts |
| `ks_world_unlock` | second-world access | false | deny new unlocks | replay entitlement check |
| `ks_eval_probe` | automated probes | false | stop release gate, not player traffic | rerun full suite |

## 3. Feature flags and release gates

Flags are evaluated by account, world, and environment. A flag transition is monotonic within a release wave unless an incident rollback is recorded. `friends-alpha` is the first playable gate: Reedfen loop, solo 5-man, and presence only. Housing and AH data may be shipped ahead of their gates but remain unavailable until enabled.

| Flag | Type | Default | Enables | Prerequisites / rollout |
|---|---|---:|---|---|
| `ff_friends_alpha` | release | true | Reedfen loop, solo 5-man, presence | ban-list and place probes pass |
| `ff_private_party_2_5` | capability | true | private parties of 2–5 | friends edge and reconnect tests |
| `ff_presence_race_counts` | capability | true | nearby count plus races | no stranger names |
| `ff_compact_four_starts` | content | false | Lanternfolk, Saltkin, Stonevein starts | Ash Compact typed IDs pass |
| `ff_clock_weekly` | economy | false | weekly tick and capped catch-up | digest and idempotency tests |
| `ff_inn_bind` | travel | false | regional inn-bind travel | place exit graph valid |
| `ff_housing_holdings` | economy | false | deeds, plots, interiors | clock and seizure probes |
| `ff_personal_vendor_copies` | economy | false | per-player merchant deals | no shared treasury mutation |
| `ff_direct_trade_friends` | social | false | two-minute friend trade | scam counters and item binds |
| `ff_auction_buyout_region` | economy | false | regional buyout AH | escrow, tax, mail reconciliation |
| `ff_second_world_unlock` | content | false | second WOF world access | entitlement and age gate probes |
| `ff_raid_mode_c_10` | combat | false | 10-player raid skin | Mid+ only, even-round billing |
| `ff_kid_mode` | safety | true | 10 turns/day, restricted social | family plan policy |
| `ff_cosmetic_shop` | commerce | false | cosmetics only | two-wallet and no-power audit |

## 4. Telemetry contract

Each event has envelope fields `eventId` (UUID), `eventName`, `eventVersion` (integer), `occurredAt` (UTC), `environment` (`dev|staging|production`), `worldId`, `sessionHash`, `accountHash`, `characterHash` (nullable), `correlationId`, `expectedRevision` (integer), and `schemaHash`. `accountHash`, `sessionHash`, and `characterHash` are keyed rotating hashes; raw account IDs, names, email, IP, device identifiers, chat text, payment data, and exact free-form prose are forbidden. Payload values are committed facts, bounded enums, counts, IDs, and deltas.

| # | Event name | Payload fields |
|---:|---|---|
| 1 | `session_started` | `sessionType, clientVersion, worldId` |
| 2 | `session_ended` | `durationSeconds, endReason` |
| 3 | `character_created` | `characterSlot, raceId, originPlaceId` |
| 4 | `character_deleted` | `deleteReason, cooldownUntil` |
| 5 | `character_selected` | `characterSlot, level` |
| 6 | `place_entered` | `placeId, placeKind, nearbyPlayerCount` |
| 7 | `place_exited` | `placeId, durationTurns` |
| 8 | `hub_story_turn_spent` | `placeId, turnType` |
| 9 | `presence_snapshot` | `placeId, nearbyPlayerCount, raceCounts` |
| 10 | `party_created` | `partyIdHash, size` |
| 11 | `party_member_joined` | `partyIdHash, size, joinSource` |
| 12 | `party_member_left` | `partyIdHash, size, leaveReason` |
| 13 | `instance_created` | `instanceIdHash, dungeonId, mode, partySize` |
| 14 | `instance_joined` | `instanceIdHash, tokenAgeSeconds` |
| 15 | `instance_round_resolved` | `instanceIdHash, roundNumber, spendTurns, outcome` |
| 16 | `instance_checkpoint_reached` | `instanceIdHash, checkpointId` |
| 17 | `instance_wiped` | `instanceIdHash, checkpointId, durabilityLossPercent` |
| 18 | `instance_abandoned` | `instanceIdHash, checkpointId, abandonReason` |
| 19 | `combat_plan_committed` | `instanceIdHash, roundNumber, planKind` |
| 20 | `combat_receipt_written` | `instanceIdHash, roundNumber, hpDelta, durabilityDelta` |
| 21 | `reconnect_checkpoint_used` | `instanceIdHash, checkpointId, reconnectAgeSeconds` |
| 22 | `lockout_granted` | `bossId, lockoutWeek, mode` |
| 23 | `lockout_denied` | `bossId, lockoutWeek, denialReason` |
| 24 | `loot_grant_committed` | `grantKeyHash, sourceId, itemId, quantity` |
| 25 | `loot_grant_replayed` | `grantKeyHash, replayResult` |
| 26 | `quest_progress_written` | `questId, objectiveId, currentCount, requiredCount` |
| 27 | `quest_reward_committed` | `questId, rewardGold, itemCount, cosmeticCount` |
| 28 | `vendor_copy_created` | `dealIdHash, vendorId, itemId, quantity` |
| 29 | `vendor_transaction` | `vendorId, itemId, quantity, goldDelta, direction` |
| 30 | `repair_committed` | `itemId, durabilityBefore, durabilityAfter, goldDelta` |
| 31 | `clock_tick_committed` | `tickId, weekNumber, catchUpWeeksApplied` |
| 32 | `catch_up_capped` | `requestedWeeks, appliedWeeks, capWeeks` |
| 33 | `mail_sent` | `mailTemplateId, recipientHash, itemCount, goldAmount` |
| 34 | `mail_claimed` | `mailIdHash, itemCount, goldAmount` |
| 35 | `auction_listed` | `listingIdHash, regionId, itemId, quantity, buyoutGold` |
| 36 | `auction_bought` | `listingIdHash, regionId, itemId, quantity, taxGold` |
| 37 | `auction_expired` | `listingIdHash, regionId, escrowItemCount` |
| 38 | `housing_deed_changed` | `deedIdHash, holdingId, transition, upkeepGold` |
| 39 | `trade_window_resolved` | `tradeIdHash, result, itemCountA, itemCountB, goldDelta` |
| 40 | `moderation_action_applied` | `actionType, reportCategory, durationHours, subjectHash` |

Telemetry retention is limited to operational need: raw event records 90 days, daily aggregates 13 months, and security audit records 24 months unless a documented legal hold applies. Event ingestion is append-only and duplicate-safe on `eventId`.

## 5. Capacity and budget envelope

The following are **SPEC** planning numbers, not promises or a 36-month platform plan. Capacity is measured per region and must be load-tested before a gate opens.

| Resource | SPEC target | Hard behavior at limit |
|---|---:|---|
| Concurrent ordinary instances per region | 2,000 | queue creation; never split a lockstep instance |
| Concurrent Raid Mode C instances per region | 120 | deny new raid and preserve checkpoint |
| Concurrent connected sessions per region | 25,000 | friends-first admission queue |
| Event ingestion | 8,000 events/second | bounded local buffer, then sampled presence only |
| Free narrative budget | SPEC: 40 turns/player/day | safe canned prose after budget |
| Mid narrative budget | SPEC: 120 turns/player/day | safe concise prose after budget |
| High narrative budget | SPEC: 300 turns/player/day | safe concise prose after budget |
| Kid Mode turn cap | 10 turns/player/day | deny further story-turn spend; chat restrictions remain |
| Instance round resolve latency | SPEC: p95 ≤ 2 seconds | hold round, show retry, never double-resolve |

## 6. GDPR deletion and retention fields

A deletion request removes or irreversibly anonymizes the following fields after identity verification and policy checks: `Account.email`, `Account.displayName`, `Account.externalProviderRef`, `Account.parentContact`, `Session.accountHash` mapping, `Device.pushToken`, `Character.name`, `Character.appearanceVoice`, `Character.inventoryItemIds`, `Character.questState`, `FriendsEdge.accountHashA/accountHashB`, `BlockMute.subjectHash`, `Party.memberHashes`, `TellMessage.body`, `PartyChatMessage.body`, `MailItem.body`, `MailItem.recipientHash`, `HousingGuest.accountHash`, `TradeWindow.participantHashes`, `ReportTicket.reporterHash`, `ReportTicket.subjectHash`, `SupportMacro.freeText`, and all raw moderation attachments. Public aggregate counters retain no reversible account link. Character, mail, and report retention is respectively 30 days, 30 days, and 180 days after deletion request; security audit records retain only a salted subject hash and action metadata for 24 months where required.

## 7. Admin actions

Admin operations require role permission, reason, target hash, expected revision, and an immutable audit record. Monetary or item changes are ledger transactions and cannot be performed through prose.

| ID | Action | Required data | Guardrail |
|---|---|---|---|
| `admin_grant_item` | grant an item | `characterHash,itemId,quantity,reason` | no power-pack item; idempotent request key |
| `admin_grant_cosmetic` | grant cosmetic | `accountHash,cosmeticId,reason` | account-bound only |
| `admin_unstuck_place` | move to safe hub | `characterHash,targetPlaceId,reason` | allow-listed place; no combat teleport |
| `admin_reset_lockout` | reset lockout | `characterHash,bossId,reason` | incident-only; never a paid SKU |
| `admin_repair_equipment` | restore durability | `characterHash,itemIds,reason` | receipt and revision required |
| `admin_reconcile_mail` | replay mail ledger | `mailIdHash,reason` | idempotent claim check |
| `admin_shadow_ban_chat` | suppress social output | `subjectHash,durationHours,reason` | reviewable; does not alter combat |
| `admin_mute_subject` | mute subject | `subjectHash,durationHours,reason` | appeal path |
| `admin_kick_instance` | remove at checkpoint | `instanceIdHash,subjectHash,reason` | no mid-round mutation |
| `admin_pause_world` | disable world entry | `worldId,reason` | existing sessions drain safely |
| `admin_replay_reward` | replay failed grant | `grantKeyHash,reason` | never creates a second grant |
| `admin_export_subject` | export subject data | `subjectHash,format,reason` | redaction and access audit |

## 8. Evaluation probe suite

Every release gate runs these 30 deterministic probes against a fixture pack. A probe fails if the expected ID is missing, a banned string is emitted, a ledger changes twice, or a forbidden action succeeds.

| # | Probe input | Expected result |
|---:|---|---|
| 1 | enter `ash_compact:place:poi_reedfen_square` | place resolves; no live import |
| 2 | enter `ash_compact:place:poi_wickhaven` | Lanternfolk start place resolves |
| 3 | enter `ash_compact:place:poi_brinewatch_dock` | Saltkin start place resolves |
| 4 | enter `ash_compact:place:poi_anvil_gate` | Stonevein start place resolves |
| 5 | inspect `ash_compact:quest:quest_lanternfolk_race_1` | title is “Keep the Path Lit” |
| 6 | inspect `ash_compact:quest:quest_hearthborn_race_1` | title is “The Hearthborn's Request” |
| 7 | inspect `ash_compact:quest:quest_saltkin_race_1` | title is “The Flats Are Wrong” |
| 8 | inspect `ash_compact:quest:quest_stonevein_race_1` | title is “The Stair Has a Crack” |
| 9 | resolve travel start → The Divide | travel uses exits, gold/turn cost; no teleport |
| 10 | resolve The Divide → capital | reaches `poi_ash_seat` or `poi_tidehold` by graph |
| 11 | create party with six members | rejected; maximum ordinary party is five |
| 12 | create raid with ten members | allowed only when raid flag and Mid+ pass |
| 13 | join an instance during round | rejected; no mid-combat fill |
| 14 | disconnect with Hold plan | last plan/Hold remains authoritative |
| 15 | wipe a 5-man | checkpoint restored; no permadeath; durability −10% equipped |
| 16 | resolve weapon round | weapon/armor durability −1% per round |
| 17 | claim same loot `grantKey` twice | one grant; second is replay/no-op |
| 18 | claim quest reward twice | one reward ledger entry |
| 19 | ask narrator for gold amount | narrator cannot mint; committed amount only |
| 20 | submit AH bid | rejected; v1 is buyout only |
| 21 | buyout AH listing | escrow, tax, item mail, and idempotent receipt |
| 22 | buy from vendor with 100 players | personal copies; no shared treasury drain |
| 23 | guest opens owner chest | read/loot denied; owner can kick |
| 24 | advance weekly clock four weeks | capped at four and one digest mail |
| 25 | advance weekly clock five weeks | fifth week not applied |
| 26 | kid attempts public DM | rejected and safety event recorded |
| 27 | kid attempts direct trade | rejected |
| 28 | emit event with raw email | schema validation rejects payload |
| 29 | emit banned licensed string | writer output blocked and safe copy returned |
| 30 | invoke `admin_reset_lockout` without reason | rejected; no paid reset path |

## 9. Pack manifest and migration hooks

```yaml
packManifest:
  packFormatVersion: 1
  manifestId: wof_ops_telemetry_flags
  engineFamily: wof_one_engine
  worldIds: [ash_compact, badge_circuit]
  contentMode: original_text_mmo
  liveSynapticGMImport: false
  telemetrySchemaVersion: 1
  eventIdempotency: eventId
  namespacePattern: "{worldId}:{kind}:{slug}"
  migration:
    fromVersion: 1
    toVersion: 2:
      status: empty_hook
      steps: []
      rollback: no_op_until_reviewed
```

Version 2 is intentionally an empty hook. A future migration must be additive or provide an explicit reversible transform, preserve locked Ash Compact IDs, maintain `hp_check_floor_flags` exactly where used, and include before/after fixture probes. No migration may import live SynapticGM saves, prompts, databases, clocks, or source paths.

## 10. ID namespace rules

| Rule | Requirement |
|---|---|
| Namespace shape | `{worldId}:{kind}:{slug}` with lowercase ASCII snake-case slug |
| World ownership | `worldId` must exist in the pack manifest; no unqualified cross-world ID |
| Kind ownership | `kind` is an allow-listed type such as `place`, `quest`, `item`, `instance`, `event`, or `flag` |
| Uniqueness | Full namespaced ID is unique across all loaded packs; duplicate definitions fail load |
| Locked objects | Locked Ash Compact IDs retain their object meaning and public title/rule |
| Lantern names | Allowed only with explicit world prefix; maps are never merged |
| Rename handling | Dump collisions are represented in `WOF_Rename_Table.md`, never silently aliased |
| Safety | IDs cannot contain URLs, filesystem paths, executable content, or user-entered raw names |

## 11. Ingestion checklist

| Check | Pass condition |
|---|---|
| Schema version | `packFormatVersion` equals 1 |
| Event privacy | no PII or free-form chat/prose in event payloads |
| Ledger authority | code owns all gold, rewards, combat, quest, lockout, and clock changes |
| Wallet separation | gold and cosmetic tokens are separate balances |
| Instance integrity | lockstep rounds, expected revisions, idempotent loot |
| Social limits | friends-first finder, no global chat v1, no mid-combat fill |
| Safety | Kid Mode cap and social restrictions enforced before narration |
| Content fence | original WOF names only; no licensed franchise identifiers |
| Live isolation | no SynapticGM files, saves, prompts, databases, or clocks |
| Capacity labels | all invented operational numbers marked `SPEC` |

This file is an operations contract only. It does not redesign networking, Agones, deployment, or a multi-year platform plan.

[1]: /home/ubuntu/upload/pasted_content_16.txt "WOF gap-fill specification"
[2]: /home/ubuntu/WOF_Content_Packs/WOF_ash_compact_Pack.md "WOF Ash Compact baseline pack"

## References

[1] [WOF gap-fill specification](file:///home/ubuntu/upload/pasted_content_16.txt)

[2] [WOF Ash Compact baseline pack](file:///home/ubuntu/WOF_Content_Packs/WOF_ash_compact_Pack.md)
