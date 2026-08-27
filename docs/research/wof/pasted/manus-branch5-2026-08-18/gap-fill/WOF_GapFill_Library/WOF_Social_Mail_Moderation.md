# WOF Social, Mail, and Moderation

**File:** `WOF_Social_Mail_Moderation.md`  
**Pack scope:** WOF shared services and original world-facing copy only  
**Format:** Markdown data specification, English v1  
**Product label:** solo, private co-op, or limited online region; never “MMO”

## 1. Scope and locked service policy

This document specifies typed, implementation-ready social, mail, presence, moderation, and finder behavior for the quarantined WOF content library. It does not contain production app code, does not import live SynapticGM state, and does not alter any world bible. The engine remains authoritative for turns, gold, tokens, entitlements, inventories, reports, mutes, blocks, mail delivery, lockouts, and presence counts. Narrative text may describe only committed state.

| Policy | Locked value |
|---|---|
| Chat channels v1 | Tell, party chat, canned hub say, canned emote; no global chat or global LFG chat |
| Social graph | Friends-first; shared friends across two clients on one account; blocks and mutes are account-scoped |
| Party size | 2–5 for ordinary instances; raid combat skin supports 10; no mid-combat fill |
| Presence | `nearbyPlayerCount` plus race labels only; never stranger names |
| Mail | System, player, auction, entitlement, and support templates; code-owned delivery and retry |
| Safety | Report, mute, block, family controls, Kid Mode, human review escalation |
| Commerce | Gold and cosmetic tokens remain separate; no outcome sales, power packs, loot boxes, or lockout skips |
| Push | Essential only: party invite and system notices; quiet hours apply; never notify others’ combat |
| Language | English v1; no licensed names or imported live copy |

## 2. Canned hub say and emote catalog

The following 40 lines are animation-less text. They are selectable canned actions, not free-form chat, and cost **0 turns**. `say` is visible in the current hub region; `emote` is visible to nearby players in the same hub. The client renders the selected public name and exact text; no LLM generation is involved.

| ID | Kind | Public label | Exact text |
|---|---|---|---|
| `hub_say_001` | say | Greeting | “Safe roads to you.” |
| `hub_say_002` | say | Thanks | “Much appreciated.” |
| `hub_say_003` | say | Ready | “Ready when the group is.” |
| `hub_say_004` | say | Wait | “One moment at the board.” |
| `hub_say_005` | say | Follow | “I will follow your lead.” |
| `hub_say_006` | say | Lead | “I can lead this route.” |
| `hub_say_007` | say | Help | “Could someone help with this task?” |
| `hub_say_008` | say | Welcome | “Welcome to the hub.” |
| `hub_say_009` | say | Good work | “Good work, everyone.” |
| `hub_say_010` | say | Well done | “That was well done.” |
| `hub_say_011` | say | Camp | “I am taking a short rest.” |
| `hub_say_012` | say | Trade | “I am looking for a fair trade.” |
| `hub_say_013` | say | Craft | “The workbench is free.” |
| `hub_say_014` | say | Ferry | “The next ferry is posted.” |
| `hub_say_015` | say | Inn | “The inn has room.” |
| `hub_say_016` | say | Farewell | “Until the next road.” |
| `hub_say_017` | say | Sorry | “Sorry; I misread the route.” |
| `hub_say_018` | say | No thanks | “No thank you.” |
| `hub_say_019` | say | Private group | “I am keeping this group friends-first.” |
| `hub_say_020` | say | Quiet | “Let us keep the hub calm.” |
| `hub_emote_001` | emote | Wave | “*waves from the path marker*” |
| `hub_emote_002` | emote | Nod | “*nods once*” |
| `hub_emote_003` | emote | Bow | “*offers a respectful bow*” |
| `hub_emote_004` | emote | Cheer | “*raises both hands in cheer*” |
| `hub_emote_005` | emote | Point | “*points toward the posted road*” |
| `hub_emote_006` | emote | Think | “*rests a hand on the chin*” |
| `hub_emote_007` | emote | Laugh | “*shares a warm laugh*” |
| `hub_emote_008` | emote | Shrug | “*gives an apologetic shrug*” |
| `hub_emote_009` | emote | Clap | “*claps twice*” |
| `hub_emote_010` | emote | Salute | “*salutes the road crew*” |
| `hub_emote_011` | emote | Rest | “*settles beside the safe lantern*” |
| `hub_emote_012` | emote | Inspect | “*studies the notice board*” |
| `hub_emote_013` | emote | Invite | “*gestures toward an open place*” |
| `hub_emote_014` | emote | Wait | “*waits patiently*” |
| `hub_emote_015` | emote | Celebrate | “*turns in a small circle*” |
| `hub_emote_016` | emote | Encourage | “*offers an open palm*” |
| `hub_emote_017` | emote | Caution | “*holds up one steady finger*” |
| `hub_emote_018` | emote | Listen | “*cups a hand beside one ear*” |
| `hub_emote_019` | emote | Point up | “*points to the road marker above*” |
| `hub_emote_020` | emote | Farewell wave | “*waves until the path turns*” |

### Per-world public-name remaps

All rows retain the same `hub_say_*` or `hub_emote_*` identifier and exact safety behavior. The public label may be skinned by the world pack; the line remains original and animation-free.

| World family | `hub_say_001` | `hub_say_007` | `hub_say_014` | `hub_emote_001` | `hub_emote_010` | `hub_emote_015` | `hub_emote_017` | `hub_emote_019` | `hub_emote_020` | Kid Mode extra restriction |
|---|---|---|---|---|---|---|---|---|---|---|
| Ash Compact | Safe road | Ask for help | Ferry board | Wick wave | Oath salute | Compact cheer | Careful sign | Marker point | Road goodbye | No change |
| First-Song | Clear refrain | Ask for a hand | Crossing call | Court wave | Chorus salute | Ensemble cheer | Quiet cue | Beacon point | Final refrain | No romantic targeting |
| Isekai Gate | Stable crossing | Request aid | Gate schedule | Waymark wave | Guide salute | Arrival cheer | Rule cue | Gate point | Return wave | No Earth references |
| Bonded Menagerie | Good trail | Ask the keep | Coach board | Keeper wave | Herd salute | Safe-arrival cheer | Animal-care cue | Trail point | Trail goodbye | No animal sale language |
| Circuit Arc | Good round | Request a teammate | Match board | Corner wave | Sportsman salute | Match cheer | Safety cue | Bracket point | Match goodbye | No betting language |
| Halo Term | Good term | Ask a classmate | Shuttle board | Hall wave | Faculty salute | Term cheer | Study cue | Bell point | Term goodbye | No romance targeting |
| Hollow Term | Calm study | Request assistance | Coach board | Cloister wave | Tutor salute | Lesson cheer | Ward cue | Lantern point | Study goodbye | No occult self-harm language |
| Starwake | Clear orbit | Request crew aid | Dock schedule | Deck wave | Captain salute | Launch cheer | Hull cue | Dock point | Safe watch | No stranger location |
| Lanceyard | Cool frame | Request a pilot | Rail schedule | Hangar wave | Crew salute | Test cheer | Heat cue | Bay point | Clear sortie | No real-weapon sales |
| Quarry Pact | Sound stone | Request a crew | Lift board | Quarry wave | Guildless salute | Work cheer | Crack cue | Seam point | Safe descent | No guild recruitment spam |
| Sect Ascension | Steady breath | Request a companion | Procession board | Courtyard wave | Vow salute | Practice cheer | Restraint cue | Gate point | Next lesson | No coercive devotion |
| Gridrun | Clean route | Request a runner | Transit board | Grid wave | Marshal salute | Run cheer | Hazard cue | Node point | Route goodbye | No doxxing or route stalking |
| Blackwake | Watchful waters | Request a deckhand | Tide board | Deckhand wave | Watch salute | Safe-watch cheer | Storm cue | Buoy point | Blackwater goodbye | No real-world threats |
| Night Charter | Quiet night | Request a witness | Charter board | Watch wave | Lantern salute | Case cheer | Boundary cue | Sign point | Watch-end wave | No graphic horror |
| Badge Circuit | Good patrol | Request a partner | Patrol board | Cape wave | Team salute | Clear-case cheer | Perimeter cue | Hub point | Patrol goodbye | No hero-license claims |
| Dust Line | Firm ground | Request a route hand | Coach board | Trail wave | Caravan salute | Camp cheer | Dust cue | Ridge point | Trail goodbye | No real-world migration claims |
| Veil Watch | Keep watch | Request a witness | Watch board | Veil wave | Steadfast salute | Case-close cheer | Silence cue | Marker point | Watch-end wave | No self-harm imagery |
| Crew Score | Good score | Request a crew | Fixture board | Crew wave | Fair-play salute | Score cheer | Rule cue | Field point | Fixture goodbye | No gambling |
| Hearth Season | Warm season | Request a neighbor | Market board | Hearth wave | Guest salute | Feast cheer | Fire cue | Harvest point | Season goodbye | No romantic targeting |
| Stage Light | Good show | Request a castmate | Call board | Curtain wave | Company salute | Encore cheer | Cue-light sign | Stage point | Curtain-close wave | No sexualized minors |
| Pitch League | Fair play | Request a teammate | Fixture board | Club wave | Sports salute | Match cheer | Sideline cue | Pitch point | Final-whistle wave | No betting |
| Route Lantern | Kind route | Request a companion | Coach board | Route wave | Promise salute | Journey cheer | Boundary cue | Signpost point | Safe-arrival wave | Crushes allowed; no sexual content |
| Card Vein | Good hand | Request a tablemate | Table board | Table wave | Fair-deal salute | Round cheer | Stop cue | Lane point | Table goodbye | No betting or cash-card play |

## 3. Tell and party chat

Tell and party chat are text channels with code-enforced authorization. Sending a message costs **0 turns** and never changes combat, loot, gold, quest state, or lockouts.

| Channel | Audience | Eligibility | Rate limit | Retention | Default moderation |
|---|---|---|---|---|---|
| Tell | One friend or an explicitly accepted party member | Friends-first, or same current party | 12 messages/minute/account; burst 4 | 30 days, then deletion or aggregate safety record | Block and mute immediately hide delivery; report preserves evidence |
| Party chat | Current party members, 2–5; raid members 1–10 | Party membership only | 30 messages/minute/party; burst 8/player | Instance session plus 30 days safety retention | Leader cannot bypass blocks; blocked player’s messages are hidden |
| Hub say | Current hub region | Canned catalog only | 6 selections/minute/player | Not retained as player text | Canned text cannot be edited |
| Hub emote | Nearby hub players | Canned catalog only | 10 selections/minute/player | Not retained as player text | Animation-less exact strings |
| System mail | Account or character | Code-generated recipient | No player send path | Per mail retention policy | Immutable template and localization key |

A Tell recipient can accept, mute, block, or report. A blocked sender receives the neutral result “Message could not be delivered.” The system never confirms that a block exists. Party chat shows a local “Hidden by your block or mute settings” placeholder only to the receiving player. A player may leave a party without deleting an already submitted report.

### Social controls

| Action | Code behavior | Player-facing result |
|---|---|---|
| Mute account | Hide Tell and party messages from account for 24 hours, 7 days, or until removed | “Messages from this account are muted.” |
| Block account | Prevent Tell, friend requests, party invites, direct trade, and finder invites | “This account cannot contact you.” |
| Report message | Preserve message, sender hash, channel, timestamp, world, and context | “Report received. You do not need to reply.” |
| Report player | Preserve recent eligible interaction evidence and selected category | “Report received for review.” |
| Unfriend | Remove both friend edges; no notification | “Friend removed.” |
| Leave party | Remove player at once in hub; in combat, mark leave and resolve at checkpoint | “You will leave at the next safe point.” |
| Privacy mode | Allow friends-only or no direct invites | “Invite settings updated.” |

### Invite links

Finder and party invite links are opaque, single-use or party-reusable tokens with `expiresAt`, `createdByAccountHash`, `worldId`, `partyId`, `maxUses`, and `uses`. Default expiry is **30 minutes**; a party leader may choose 5, 15, or 30 minutes. Links never grant account access, bypass age gates, reveal player location, or join an active combat round. Expired links return “This invitation has expired.”

## 4. Reports and moderation workflow

Reports are safety records, not public accusations. The reporter selects one of the 12 categories below and may add up to 500 characters. Auto moderation may limit reach or queue evidence; only authorized human review may impose a long-term account sanction. No vigilante PvP, public naming, or retaliatory system is permitted.

| Category ID | Category | Automatic action | Human review |
|---|---|---|---|
| `report_harassment` | Repeated targeted abuse | Rate-limit suspect after threshold 8 reports/10 min | Confirm context and intent |
| `report_hate` | Attack on protected identity | Hide message pending review | Required; urgent queue |
| `report_sexual` | Sexual content or solicitation | Block delivery and freeze outbound Tell for 10 min | Required |
| `report_child_safety` | Sexualization, grooming, or contact with a minor | Immediate block, preserve evidence | Required; priority queue |
| `report_threat` | Credible threat or extortion | Hide message; account contact cooldown | Required; priority queue |
| `report_self_harm` | Self-harm encouragement or graphic solicitation | Hide message and show support-safe response | Required; safety-trained review |
| `report_gore` | Graphic violence in a restricted context | Hide message for Kid Mode recipients | Review if repeated |
| `report_drugs` | Drug sale, encouragement, or evasion | Filter message and rate-limit | Review on repeat |
| `report_gambling` | Betting, cash wagering, or card-cash promotion | Block message | Review on repeat |
| `report_scam_trade` | Fraud, impersonation, or unsafe trade pressure | Freeze current trade window; no item movement | Review transaction evidence |
| `report_spam_bot` | Repeated unsolicited promotion or automation | Progressive rate limit | Review account signals |
| `report_privacy_doxxing` | Personal data or location exposure | Hide message and block sender | Required |

### Sanction ladder

| Level | Trigger and duration | Scope | Appeal / expiry |
|---|---|---|---|
| `notice` | First low-confidence or low-severity event | In-client education only | No sanction; record 30 days |
| `chat_cooldown` | Auto threshold or confirmed minor spam | Tell, party, and finder outbound disabled 10 minutes | Automatic expiry |
| `social_mute` | Confirmed harassment or repeated spam | Social outbound disabled 24 hours | Human review available |
| `temporary_social_ban` | Serious or repeated confirmed abuse | Social and trade disabled 7 days | Human review and appeal |
| `account_suspension` | Severe child safety, credible threat, or repeated evasion | Account access disabled 24 hours to 30 days | Human review required |
| `permanent_ban` | Confirmed severe abuse or sanction evasion | Account access disabled permanently | Human appeal process |

Auto moderation must not invent evidence, infer protected identity, or sanction solely from race, world, play style, refusal to chat, or a single ambiguous phrase. Account hashes and minimal evidence are retained according to the report retention window; support staff see only the data needed for the case.

## 5. Mail templates

All templates are code-owned. Each row has a stable `templateId`, a subject key, a body with typed placeholders, and delivery conditions. Mail does not cost turns. A failed delivery is retried with exponential backoff at 1, 5, and 30 minutes, then placed in an error queue; code never mints gold or items during a retry.

| # | `templateId` | Subject | Body / typed placeholders | Trigger |
|---:|---|---|---|---|
| 1 | `mail_weekly_digest` | Weekly account digest | “Your weekly summary: turns used `{turnsUsed}`, contracts completed `{contractsCompleted}`, and unclaimed mail `{unclaimedCount}`.” | Weekly clock tick |
| 2 | `mail_upkeep_warning` | Upkeep due soon | “Your `{holdingName}` requires `{upkeepGold}` gold by `{dueAt}`.” | 7 days before due |
| 3 | `mail_seize_warning` | Holding seizure warning | “The unpaid holding will be locked on `{lockAt}` and may be seized on `{seizeAt}`.” | Week 2 unpaid |
| 4 | `mail_ah_sold` | Auction sold | “Your listing `{listingId}` sold for `{saleGold}` gold. Tax `{taxGold}` was withheld.” | Buyout settlement |
| 5 | `mail_ah_expired` | Auction expired | “Your listing `{listingId}` expired. The item is returned to your mailbox.” | Listing expiry |
| 6 | `mail_lockout_available` | Instance lockout available | “Your lockout for `{instanceName}` is available again after the weekly reset.” | Lockout reset |
| 7 | `mail_party_invite` | Party invitation | “`{inviterPublicName}` invited you to `{partyName}` in `{worldName}`. Expires `{expiresAt}`.” | Invite created |
| 8 | `mail_friend_request` | Friend request | “`{requesterPublicName}` sent a friend request. Review it in Friends.” | Request created |
| 9 | `mail_repair_done` | Repair complete | “Repair ticket `{ticketId}` is complete. Cost `{costGold}` gold.” | Repair settlement |
| 10 | `mail_deal_payout` | Deal payout | “Your personal deal copy `{dealId}` paid `{payoutGold}` gold.” | Deal completion |
| 11 | `mail_catchup_cap_hit` | Clock catch-up capped | “Your clock caught up `{weeksApplied}` weeks; the remaining elapsed time was capped at four weeks.” | Login catch-up |
| 12 | `mail_kid_share_turns` | Turns shared | “A family plan shared `{turnsShared}` text turns with `{characterName}`.” | Parent share |
| 13 | `mail_entitlement_granted` | Entitlement granted | “Entitlement `{entitlementId}` is now active for `{worldName}`.” | Verified grant |
| 14 | `mail_refund` | Refund processed | “Refund `{refundId}` returned `{refundAmount}` cosmetic tokens or gold as recorded.” | Authorized refund |
| 15 | `mail_ban` | Account action | “Your account has been restricted for `{duration}` because of a confirmed rules violation. Case `{caseId}`.” | Human sanction |
| 16 | `mail_mute` | Social action | “Social messaging is restricted until `{endsAt}`. Case `{caseId}`.” | Mute sanction |
| 17 | `mail_raid_lockout` | Raid lockout recorded | “Your weekly lockout for `{instanceName}`, phase `{phaseNumber}`, is recorded.” | Phase clear |
| 18 | `mail_inn_bind` | Inn bind confirmed | “Your return point is now `{innName}` in `{regionName}`.” | Successful bind |
| 19 | `mail_deed_granted` | Deed granted | “Deed `{deedId}` grants your private holding at `{placeName}`.” | Verified deed |
| 20 | `mail_vendor_restock` | Vendor restock | “`{vendorName}` has restocked its listed goods.” | Weekly restock |
| 21 | `mail_festival_start` | Festival begins | “`{festivalName}` begins in `{worldName}` and ends at `{endsAt}`.” | Calendar start |
| 22 | `mail_reconnect_checkpoint` | Reconnect checkpoint | “Your interrupted instance is waiting at checkpoint `{checkpointId}`. No round was advanced while you were away.” | Reconnect state |
| 23 | `mail_empty_inbox` | No new mail | “Your inbox is clear.” | Empty inbox view |
| 24 | `mail_error_retry` | Delivery retry | “A system delivery is retrying for `{objectType}` `{objectId}`. No reward was duplicated.” | Retry queue |
| 25 | `mail_support_case` | Support case update | “Case `{caseId}` is `{caseStatus}`. Reply through Support if more information is needed.” | Support workflow |

Mail constraints: `fromSystem` is true for all rows above; player-authored mail is not a v1 feature. Auction mail may contain an item return or escrow settlement only when the ledger has an idempotent grant key. Child accounts receive no public direct mail from strangers, no trade mail, and no player-authored content. System mail may be shared with a parent under Family Plan rules, subject to privacy settings.

## 6. Presence and finder copy

Presence is deliberately coarse. A hub presence response exposes `worldId`, `placeId`, `nearbyPlayerCount`, and a sorted set of public race labels capped at three distinct labels. It never exposes names, account identifiers, exact coordinates, combat state, party composition, or stranger location history.

**Canonical presence string:** “3 nearby (Hearthborn, Lanternfolk, Saltkin).”  
**Zero string:** “No nearby players.”  
**More-than-three-races string:** “7 nearby (Hearthborn, Lanternfolk, Saltkin, and others).”  
**Private mode string:** “Nearby presence hidden by privacy settings.”

Finder copy is friends-first and honest: **“Find a friends-first group for this activity. You can invite friends, accept a private link, or continue solo. No global LFG chat is available in v1.”** The finder filters by world, activity, party size, maturity eligibility, language, and approximate readiness. It does not rank by skill, win rate, wealth, race, or social popularity. A listing board schema may exist in v2 with `listingId`, `worldId`, `activityId`, `leaderAccountHash`, `partySize`, `openSlots`, `maturityBand`, `language`, `createdAt`, `expiresAt`, `voiceRequired=false`, and `status`; v2 has no global chat copy and no direct stranger messaging.

## 7. Kid Mode and family safety

Kid Mode permits **10 text turns per day**, with the same model quality, and allows a parent to share turns from the parent pool. It disables public direct messages, public trade, voice, gambling, cash-card play, sexual content, graphic gore, drug promotion, and contact from unknown accounts. Route Lantern may contain age-appropriate crushes but no sexual content. Canned hub say and emote remain available after safety filtering. A parent can review shared-turn events and system mail, but cannot read another adult account’s private Tell without an explicitly granted family setting.

| Control | Default | Code behavior |
|---|---:|---|
| `kidDailyTextTurns` | 10 | Hard daily cap; shared parent turns are ledger entries |
| `publicTell` | false | Reject unknown-account Tell |
| `publicTrade` | false | Reject direct trade and public listings |
| `voiceChat` | false | No voice channel exists for the account |
| `gamblingContent` | false | Reject betting and card-cash prompts |
| `sexualContent` | false | Rewrite or skip; never display raw content |
| `graphicGore` | false | Rewrite or skip |
| `unknownInvite` | false | Reject party/finder invites from non-friends |
| `parentShare` | true | Parent may transfer a counted turn allocation |

## 8. Data contracts and failure behavior

| Record | Required fields | Invariants |
|---|---|---|
| `TellMessage` | `messageId`, `senderAccountHash`, `recipientAccountHash`, `body`, `createdAt`, `worldId`, `channel`, `moderationState` | Recipient must be eligible; body length ≤500; idempotent delivery |
| `PartyChatMessage` | `messageId`, `partyId`, `senderAccountHash`, `body`, `createdAt`, `moderationState` | Sender is current party member; no mid-combat membership mutation |
| `PresenceHub` | `worldId`, `placeId`, `nearbyPlayerCount`, `raceLabels[]`, `privacyMode`, `updatedAt` | Count is approximate; names never serialized |
| `FriendEdge` | `edgeId`, `accountAHash`, `accountBHash`, `status`, `createdAt`, `updatedAt` | Symmetric; blocked edge cannot become active |
| `BlockMute` | `ownerAccountHash`, `targetAccountHash`, `kind`, `expiresAt`, `createdAt` | Block supersedes mute; no target notification |
| `ReportTicket` | `reportId`, `reporterAccountHash`, `targetAccountHash?`, `categoryId`, `evidenceRefs[]`, `createdAt`, `priority`, `status` | One category per ticket; evidence immutable; no public accusation |
| `ModerationAction` | `actionId`, `accountHash`, `actionType`, `scope`, `startsAt`, `endsAt?`, `caseId`, `actorType` | Auto actions are reversible; permanent bans require human actor |
| `MailItem` | `mailId`, `templateId`, `recipientAccountHash`, `payload`, `createdAt`, `deliveryState`, `idempotencyKey` | Unique idempotency key; no duplicate grants |
| `MailDigest` | `digestId`, `accountHash`, `periodStart`, `periodEnd`, `itemRefs[]`, `sentAt` | One digest per account and period |
| `InviteLink` | `inviteId`, `partyId`, `worldId`, `createdByAccountHash`, `expiresAt`, `maxUses`, `uses`, `status` | Expiry and max uses enforced server-side |

Failures must be neutral and non-leaky. A Tell to a blocked account, expired invite, hidden presence request, and unavailable recipient use messages that do not reveal security settings. If a mail retry fails, the original idempotency key remains reserved. If moderation is unavailable, new player-authored channels fail closed while system mail, party membership, combat, and already committed rewards continue through their own code paths. No LLM is allowed to create a report sanction, friend edge, mail reward, gold amount, item grant, or presence name.

## 9. Acceptance checklist

| Check | Required result |
|---:|---|
| 1 | Exactly 40 shared canned hub say/emote rows exist |
| 2 | Twenty-three world families have ten public-name remap values and a Kid Mode note |
| 3 | Tell and party chat are rate-limited and cost 0 turns |
| 4 | Mute, block, report, friend, privacy, and leave-party behavior is defined |
| 5 | Twelve report categories distinguish automatic action from human review |
| 6 | Twenty-five mail templates exist with typed placeholders and triggers |
| 7 | Presence uses nearby count and race labels only; stranger names are forbidden |
| 8 | Friends-first finder copy explicitly says no global LFG chat v1 |
| 9 | Invite link expiry is defined as 5, 15, or 30 minutes, default 30 |
| 10 | Kid Mode has a 10 text-turn cap and required safety restrictions |
| 11 | Two wallets remain separate and no power, outcome, or lockout sales are described |
| 12 | No production code, live SynapticGM import, live path, or licensed IP appears |
| 13 | Mail retry and idempotency behavior prevents duplicate rewards |
| 14 | Moderation failure behavior fails closed for player-authored channels |
| 15 | Presence never reveals stranger names, exact locations, or combat state |

## References

[1]: /home/ubuntu/upload/pasted_content_16.txt "WOF quarantined content library task specification"
[2]: /home/ubuntu/WOF_Content_Packs/WOF_ash_compact_Pack.md "Ash Compact factual baseline"
