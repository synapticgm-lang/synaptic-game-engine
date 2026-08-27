# WOF Copy — Mail, UI, and Errors

**Pack:** WOF player-facing copy · **Locale:** English v1 · **Status:** Quarantined content library only

This file contains original, player-facing strings for WOF. It describes a **solo**, **private co-op**, or **limited online region** product honestly; it does not claim an MMO, open-world PvP, or live SynapticGM integration. Code commits state before any prose is shown. NPC and system copy never invents gold, damage, ownership, quest completion, lockouts, or rewards.

## 1. HUD labels and Theme Kit skinning

The base chrome uses plain Compact language. Theme Kits may replace only `publicLabel` and visual token metadata; identifiers, accessibility labels, semantics, turn costs, and safety copy remain unchanged.

| Token id | Compact default | Accessibility label | Theme Kit override rule |
|---|---|---|---|
| hud_inventory | Inventory | Inventory | Replace visible noun only; retain token id. |
| hud_journal | Journal | Journal and objectives | Replace visible noun only; retain objective semantics. |
| hud_map | Map | Map and places | Theme may call it a chart or route board. |
| hud_mail | Mail | Mail | Theme may call it letters, dispatches, or messages. |
| hud_nearby | Nearby | Nearby players | Use count plus races only; never stranger names. |
| hud_turns_left | Turns left | Turns remaining today | Never hide the number or cap. |
| hud_party | Party | Party members | No implication of public matchmaking. |
| hud_checkpoint | Checkpoint | Current checkpoint | Must remain explicit after wipe. |
| hud_lockout | Weekly access | Weekly access status | Do not imply a purchasable skip. |
| hud_gold | Gold | Gold balance | Separate from cosmetic currency. |
| hud_cosmetic_tokens | Chrome | Cosmetic token balance | Never imply power purchase. |
| hud_rest | Rest | Rest at the inn | One hub turn; free HP/STA, no repair. |
| hud_hold | Hold | Hold current plan | Used for disconnect/logout-in-combat. |
| hud_report | Report | Report a player or message | Never promises an outcome. |
| hud_help | Help | Help and support | Opens support macros and safety guidance. |

## 2. Empty and unavailable states

| id | Player-facing string | Action or CODE behavior |
|---|---|---|
| empty_bag | Your bag is empty. | Render an empty inventory; do not mint an item. |
| empty_mail | No mail here yet. | Show inbox empty state; preserve unread count at 0. |
| no_party | You are travelling alone. | Offer solo entry where allowed; do not auto-fill mid-combat. |
| ah_none | No listings match this search. | Return an empty regional buyout result; no bid flow. |
| house_none | You do not own a holding in this region. | Show available deeds or explain scarcity. |
| vendor_too_poor | You need {gold_needed} more gold. | Do not debit a partial amount or create debt. |
| overweight | Your pack is too heavy to enter an instance. | Block instance entry; hub walking remains available. |
| lockout | This character has used its weekly access for {boss_name}. | Block only the locked encounter; show reset timing. |
| kid_cap | Today’s text-turn allowance is complete. | Block additional turns; allow parent share if enabled. |
| offline_party | A party member is offline. | Show current party state; keep their last plan or Hold. |
| reconnect | Your last safe checkpoint is ready. | Offer reconnect to checkpoint; never restore uncommitted combat. |
| image_na | WOF is text-first: there is no picture to load here. | Do not show a broken-image placeholder or claim an image exists. |
| no_friends | No friends are available for this activity. | Offer private solo play or an invite link. |
| no_stash | This personal stash tab has no items. | Render tab safely; no shared or guild inventory. |
| no_deed_plot | No plot is available in this hub right now. | Show scarcity and next eligibility; do not sell priority. |
| no_vendor_stock | This stock is sold out until the next restock. | Use deterministic restock time; no random power pack. |
| no_recipe_materials | You are missing {missing_materials}. | Leave inputs unchanged; fail chance is zero at v1. |
| no_checkpoint | No checkpoint has been recorded for this instance. | Return to the instance entrance or safe hub according to state. |
| no_lockout | No weekly access is recorded for this character. | Render available status; never imply a purchase. |

## 3. Error catalog WOF-E001–WOF-E080

The error code is stable telemetry and support vocabulary. The sentence is safe to show directly. CODE must make the state transition atomically and idempotently; the language model may only narrate the committed result.

| Code | Player sentence | CODE behavior |
|---|---|---|
| WOF-E001 | We could not save that change. Please try again. | Reject stale revision; preserve prior state. |
| WOF-E002 | That action is no longer available. | Revalidate entitlement, place, and revision. |
| WOF-E003 | This place is not reachable from here. | Reject movement unless an exit exists. |
| WOF-E004 | The road is closed for now. | Return deterministic route-closed reason. |
| WOF-E005 | You cannot enter while over the carrying limit. | Block instance entry; do not delete items. |
| WOF-E006 | Your party is not ready to enter. | Require valid party size and ready state. |
| WOF-E007 | Mid-combat joining is not available. | Reject join; allow join only at checkpoint. |
| WOF-E008 | The instance is already full. | Reject join without changing party. |
| WOF-E009 | This checkpoint is not yours to use. | Validate instance token and character membership. |
| WOF-E010 | Your session has expired. | Invalidate session and require safe reconnect. |
| WOF-E011 | The combat plan arrived too late. | Apply Hold or last valid plan per reconnect state. |
| WOF-E012 | That round has already resolved. | Reject duplicate submission by ExpectedRevision. |
| WOF-E013 | The combat state changed; review your plan. | Return current revision without applying stale plan. |
| WOF-E014 | You are downed. Allies can continue until the next checkpoint. | Set downed state; disallow ordinary actions. |
| WOF-E015 | The party wiped and returned to its checkpoint. | Commit wipe, durability penalty, and checkpoint. |
| WOF-E016 | This weekly access is already used. | Enforce per-character lockout. |
| WOF-E017 | This reward was already granted. | Use idempotent loot key; do not duplicate grant. |
| WOF-E018 | That reward is not yours to claim. | Validate personal-loot eligibility. |
| WOF-E019 | The item no longer fits in your pack. | Reject grant or route to safe claim flow. |
| WOF-E020 | Your inventory is full. | Do not drop silently; hold grant pending player action. |
| WOF-E021 | That item cannot be traded. | Enforce bind rule. |
| WOF-E022 | Direct trade is limited to friends. | Reject non-friend trade request. |
| WOF-E023 | The trade window expired. | Cancel atomically and return items. |
| WOF-E024 | Please accept the trade again after reviewing it. | Restart two-minute acceptance window. |
| WOF-E025 | This item is temporarily bound after trade. | Apply one-hour high-value trade delay. |
| WOF-E026 | You do not have enough gold. | No negative balance; show shortfall. |
| WOF-E027 | Cosmetic tokens cannot pay for this purchase. | Reject wallet mismatch. |
| WOF-E028 | This purchase would grant power and is not offered. | Reject forbidden power sale. |
| WOF-E029 | Bidding is not available. Buyout only. | Reject bid path; preserve listing. |
| WOF-E030 | That listing has expired. | Close listing and return item through mail. |
| WOF-E031 | That listing is not yours. | Reject seller action. |
| WOF-E032 | The escrow is still processing. | Keep escrow pending; no duplicate payout. |
| WOF-E033 | The auction house is unavailable right now. | Kill-switch AH reads/writes safely. |
| WOF-E034 | Mail could not be delivered. | Retry idempotently; preserve attachment. |
| WOF-E035 | This attachment has already been claimed. | Reject duplicate claim. |
| WOF-E036 | Your inbox is full. | Reject send or queue safe retry; do not lose item. |
| WOF-E037 | That mail has expired. | Apply retention rule and return eligible items. |
| WOF-E038 | You cannot send mail to that recipient. | Enforce account, block, and age rules. |
| WOF-E039 | This message is rate-limited. | Throttle sender; retain moderation event. |
| WOF-E040 | You cannot use public chat in Kid Mode. | Block public DM/trade/voice surfaces. |
| WOF-E041 | That player is blocked. | Suppress delivery and presence exposure. |
| WOF-E042 | That player is muted. | Suppress their chat locally. |
| WOF-E043 | Your report was received. | Create report ticket; reveal no moderator decision. |
| WOF-E044 | You cannot report this item again yet. | Deduplicate report window. |
| WOF-E045 | The name is too short or too long. | Enforce configured length range. |
| WOF-E046 | That name contains a reserved word or prohibited term. | Reject and show neutral naming guidance. |
| WOF-E047 | That name is already reserved. | Reject duplicate reservation. |
| WOF-E048 | The name contains unsupported characters. | Enforce English v1 character set. |
| WOF-E049 | Choose an origin before continuing. | Require Compact origin selection. |
| WOF-E050 | That origin is not available in this world. | Reject cross-world race/origin selection. |
| WOF-E051 | Character creation is temporarily unavailable. | Feature-flag creation without losing draft. |
| WOF-E052 | You have reached the character-slot limit. | Enforce four slots per world. |
| WOF-E053 | This character is waiting for deletion. | Show seven-day cooldown and block reuse. |
| WOF-E054 | This action is unavailable during combat. | Reject action; keep lockstep state. |
| WOF-E055 | You cannot rest here. | Require hub inn and charge one turn. |
| WOF-E056 | Rest restored health and stamina, but not equipment. | Apply rest only to HP/STA. |
| WOF-E057 | The equipment is broken and has no stats. | Keep item repairable; do not infer stats. |
| WOF-E058 | Repair could not be completed. | Atomic ticket failure; preserve item durability. |
| WOF-E059 | That recipe needs a different station. | Reject craft without consuming inputs. |
| WOF-E060 | You are missing required materials. | Return exact missing item ids/counts. |
| WOF-E061 | This deed is not available to you. | Validate plot, region, entitlement, and ownership. |
| WOF-E062 | That holding is private. | Reject non-guest access. |
| WOF-E063 | Guests cannot take items from personal chests. | Enforce read/use permissions. |
| WOF-E064 | The owner removed your guest access. | Close housing session safely. |
| WOF-E065 | Upkeep is overdue. | Enter one-week lockout; schedule seizure week 3. |
| WOF-E066 | This holding is locked while upkeep is overdue. | Block nonessential interactions. |
| WOF-E067 | The vendor is restocking. | Show deterministic weekly restock time. |
| WOF-E068 | Merchant deals are personal copies; shared stock was not changed. | Return player-specific deal result. |
| WOF-E069 | The server clock is catching up. | Cap catch-up at four weeks and queue one digest. |
| WOF-E070 | No clock reward was created. | Keep clock and economy CODE-owned. |
| WOF-E071 | Push notifications are quiet right now. | Suppress nonessential push; preserve essential events. |
| WOF-E072 | That invite has expired. | Reject token and require a new invite. |
| WOF-E073 | A global LFG channel is not available in v1. | Offer friends-first finder or board when enabled. |
| WOF-E074 | The requested feature is not enabled yet. | Return feature-flag state, not a fake success. |
| WOF-E075 | This service is paused for safety. | Honor kill switch and show recovery-neutral copy. |
| WOF-E076 | Your account cannot use this feature. | Enforce entitlement, age gate, and moderation state. |
| WOF-E077 | This content is not available in your maturity setting. | Block and offer safe navigation. |
| WOF-E078 | We could not verify the request. | Reject ambiguous or tampered token. |
| WOF-E079 | The service could not complete that request. Try again later. | Retry only idempotent operations with backoff. |
| WOF-E080 | Something went wrong, but your items and progress were protected. | Return safe failure; reconcile ledger before retry. |

## 4. Character creation and opening copy

**Name rules.** Use 3–16 characters, letters, spaces, hyphens, and apostrophes; trim repeated whitespace; reject reserved words, licensed names, slurs, sexual terms, impersonation, and unsupported symbols. Names are unique within a world and may be renamed with a cosmetic token after the seven-day reservation rule. Filter decisions are CODE-owned and should return neutral guidance rather than repeating a prohibited term.

**Origin ask — Ash Compact.** “Where do you begin: Reedfen, Lampwood, Brinewatch, or Granite Stair? Each home has its own work, promises, and first path.” The selectable peoples are **Hearthborn**, **Lanternfolk**, **Saltkin**, and **Stonevein**. The ask is in-world and does not reference Earth. “Your first choice opens a local path, not a permanent verdict. You can still meet every Compact faction.”

**Opening stake reminder.** “The fuel lines are thinning, the water roads are breaking, and four peoples are counting on one another. Start small: keep one route safe, finish one promise, and return with what the ledger can confirm.”

## 5. Downed, wipe, repair, and inn copy

| Situation | Copy |
|---|---|
| **Downed** | You are downed, not erased. Follow the last safe plan until the party reaches a checkpoint. |
| **Wipe** | The party was forced back to the checkpoint. Your earned progress remains; review the route and try again. |
| **Durability** | The struggle left wear on your equipment. Wipe wear is 10% equipped durability; combat wear is 1% per round on weapon and armor. |
| **Broken item** | This item is broken and grants 0 stats until repaired. |
| **Repair** | Repair complete. Your equipment is ready for the road. |
| **Inn rest** | Rest complete. HP and stamina are restored. Equipment is not repaired. |
| **Weekly access** | This character’s weekly access is recorded. The next access time is shown by the ledger. |
| **Reconnect** | You are back at the last committed checkpoint. Uncommitted combat was not restored. |

## 6. Store honesty and prohibited claims

> WOF is a solo-first adventure with private co-op and limited online regions. Friends can share a party, a home visit, or a conversation where enabled. It is not an MMO and does not offer contested open-world PvP.

The store may sell cosmetic Theme Kit presentation, extra music, fashion, furniture, and other non-power chrome. It must not sell outcomes, random power packs, loot boxes, catch-rate packs, lockout skips, raid clears, combat advantages, or access that changes a character’s committed ledger. Gold and cosmetic tokens are separate wallets. Copy must never promise a drop, boss clear, faster progression, or an economy result.

**Do not claim:** “massively multiplayer,” “always-online world,” “open-world PvP,” “pay to win,” “guaranteed rare drop,” “skip your lockout,” “buy a raid clear,” “catch anything,” “permadeath,” “guild bank,” or “live SynapticGM transfer.”

## 7. Age ratings and content descriptors

| Maturity | Store/UI description | Required restrictions |
|---|---|---|
| All-ages | “Cooperative text adventure with mild peril, problem-solving, and friendship.” | No sexual content, graphic injury, gambling, public DMs, public trade, or voice for Kid Mode; parent controls available. |
| Teen | “Fantasy peril, conflict, suspense, and marketplace decisions presented in text.” | Use non-graphic defeat language; keep moderation, mute, block, and report tools visible. |
| Teen+ | “Darker themes, frightening situations, and stronger conflict in selected worlds.” | World-specific descriptors and age gate; no licensed names or prohibited gambling. |

## 8. Accessibility copy and behavior

| Setting | Copy / behavior |
|---|---|
| **Font scale** | “Text size: {percent}%. Preview readable.” Support 100–200% in 10% steps without truncating critical state. |
| **TTS** | “Read system chrome and story text aloud.” TTS order is label, value, action result, then prose. |
| **Color** | “Danger is also shown with a word and icon.” Never use color alone for HP, lockout, error, or moderation state. |
| **Motion** | “Animation is decorative and can be reduced.” No gameplay state depends on animation. |
| **Contrast** | “High contrast is on.” Preserve readable contrast for all Theme Kit overrides. |
| **Input** | “Keyboard focus is visible.” Every action has a text label and predictable focus order. |

## 9. Essential-only push copy

| id | Push text | Trigger |
|---|---|---|
| push_party_invite | {sender} invited you to a private party. | Party invite |
| push_party_ready | Your party is ready at {instance_name}. | Ready state |
| push_system_safety | A WOF system update needs your attention. | Essential system notice |
| push_mail_received | You received WOF mail. | New mail |
| push_auction_sold | Your listing sold. Proceeds are waiting in mail. | AH sale |
| push_auction_expired | Your listing expired. The item is waiting in mail. | AH expiry |
| push_reconnect | Your checkpoint is ready when you return. | Reconnect-safe state |
| push_kid_share | A parent shared text turns with your plan. | Family Plan share |
| push_deed_warning | Your holding needs upkeep attention. | Warning before lockout |
| push_moderation_action | A safety action changed your chat access. | Moderation action |
Quiet hours suppress every nonessential notification; never notify others about a player’s combat, defeat, or location.

## 10. Support macros

| Macro id | Agent-facing response | Required CODE check |
|---|---|---|
| support_progress | Your committed progress is protected. We are checking the latest ledger revision. | ExpectedRevision and event log |
| support_missing_item | We will verify the idempotent reward record before any correction. | LootGrant key |
| support_duplicate_charge | We will compare wallet events and reverse only a confirmed duplicate. | Wallet event ledger |
| support_mail | We will trace the message without exposing another player’s private details. | Mail id and delivery status |
| support_trade | We will review the trade window and acceptance timestamps. | TradeWindow audit |
| support_housing | We will verify deed ownership and guest permissions. | Deed and HousingGuest |
| support_upkeep | We will show the exact clock weeks involved; support cannot sell a lockout skip. | WorldClock and Holding |
| support_lockout | Weekly access is character-based and cannot be purchased or skipped. | Lockout key |
| support_disconnect | We will confirm whether the last plan or Hold was committed. | ReconnectState |
| support_moderation | Reports are reviewed under safety rules; we cannot reveal another player’s action history. | ReportTicket |
| support_name | We can explain the naming rule without repeating a rejected term. | NameFilter |
| support_kid | A parent can review the Family Plan share and daily cap. | AgeGate and FamilyPlan |
| support_accessibility | We can help enable font scale, TTS, contrast, and reduced motion. | Device preferences |
| support_feature | This feature may be gated or paused; we will show its current flag state. | FeatureFlag/KillSwitch |
| support_refund | We will verify the entitlement and purchase record; no support action grants combat power. | Entitlement and wallet ledger |

## 11. Implementation invariants

| Invariant | Player-facing consequence |
|---|---|
| **Turn billing** | Hub story beat costs one turn; tell, party chat, AH browse, mail, and idle cost zero. Round resolve spends the turn. |
| **Combat** | Ordinary instances are party 1–5; raid presentation is 10-person Mid+ content. No mid-combat fill. |
| **Economy** | CODE owns gold, cosmetic tokens, rent, sales, rewards, and clock catch-up. LLM prose cannot mint or alter them. |
| **Loot** | Personal loot is always used. Wipe returns the party to checkpoint; no permadeath. |
| **Presence** | Show nearbyPlayerCount and races only, such as “3 nearby (Hearthborn, Lanternfolk, Saltkin).” Never show stranger names. |
| **Privacy** | Friends-first finder, private housing, personal stash, and no guild bank v1. |
| **Content fence** | All names and copy are original WOF content; no licensed names, direct imitations, live imports, or 3D assumptions. |

## References

[1]: /home/ubuntu/upload/pasted_content_16.txt "WOF quarantined content library specification"
[2]: /home/ubuntu/WOF_Content_Packs/WOF_ash_compact_Pack.md "Ash Compact content pack"
