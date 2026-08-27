# PART 0 — Executive

## 0.1 Boundary of this brief

Prompt 1 is assumed to have delivered WOF world variants plus a single-player monster-collecting bestiary, moves and tables. This brief does **not** regenerate those assets or touch SynapticGM live source, live Supabase paths, prompts, settings or saves. It adds a quarantined operating model for `wof/` and future title roots: reusable account/session/inventory/instance services, staged multiplayer, content waves, live operations and title-specific data packs.

## 0.2 Recommended product family map

| Root | Title | Product form | Relationship |
|---|---|---|---|
| `wof/ember-crown/` | **Ember Crown** | WOF faction-fantasy online RPG. | Core WOF world shard. |
| `wof/pactbeasts/` | **Pactbeasts of the Lanternwild** | WOF creature-collection RPG. | Core WOF, uses Prompt 1 bestiary schema only. |
| `titles/deepgate/` | **Deepgate Accord** | Expedition/dungeon online RPG. | Adjacent, separate continent. |
| `titles/salt-ledger/` | **Salt Ledger** | Coastal trade and intrigue RPG. | WOF-adjacent maritime shard. |
| `titles/sunloom/` | **Sunloom Circuit** | Experimental asynchronous civic-world hybrid. | Fully separate setting. |
| `titles/lantern-run/` | **Lantern Run Company** | Small co-op-first expedition game. | Separate, deliberately not MMO at launch. |

All titles use original names and assets. Folk/place working names such as Ash Compact, Tide Covenant, Hearthborn, Lanternfolk, Saltkin, Stonevein, Reedfen, Lampwood, Brinewatch and Granite Stair remain WOF-only data names, not external franchise references.

## 0.3 Shared engine versus per-title content split

| Shared in `platform/` | Per-title in title root | Never shared with live SynapticGM |
|---|---|---|
| Identity, accounts, session auth, character shell, entitlement, inventory ledger, collection ownership, party/friends, instance placement, telemetry, feature flags, moderation case system, support audit tools. | Regions, map graph, quests, narrative, combat ruleset, classes, creatures, moves, items, crafting, encounters, cosmetics, economy curves, seasonal events, localized strings. | Any live game code, stores, prompts, credentials, player histories, analytics, image routes, settings or databases. |

Shared engine means **protocol and operational primitive**, not shared balance. A title may not import another title’s creature, currency, item or combat table by default. Shared platform IDs are namespaced: `titleId:entityType:uuid`; high-value transactions are ledgered by title and account.

## 0.4 36-month phased roadmap

| Months | Product state | Technical scope | Player promise |
|---:|---|---|---|
| 0–6 | Ember Crown SP vertical slice. | Local save, canonical state, content tools, simulation fixtures; no public social layer. | “A single-player living-world RPG.” |
| 7–12 | SP beta plus Lantern Run private co-op proof. | Account identity, invite-only session, 2–4 player dedicated instance, server combat authority, reconnect. | “Private co-op tests; no persistent online world.” |
| 13–18 | Co-op instances and Pactbeasts closed alpha. | Character/inventory ledger, party, regional placement, moderation/reporting basics; trading disabled. | “Small-group online adventures.” |
| 19–24 | Limited public multiplayer. | One hub shard/region, capped instances, queues, regional telemetry, first season; no auction/housing. | “Online regions and scheduled events, capacity-limited.” |
| 25–30 | Multi-title platform reuse. | Deepgate pilot, content-wave tooling, persistent guild-lite, economy sinks/faucets, support runbooks. | “Shared account services; each title has its own rules.” |
| 31–36 | Fuller MMO features only if gates pass. | More regions, opt-in guilds, limited player trading, world events; auction/housing still separate go/no-go. | “Expanding online world—not unlimited global simulation.” |

## 0.5 “Not an MMO yet” honesty checklist

Do not use MMO, massively multiplayer, seamless world, global economy, live trading, persistent housing, competitive ladder, cross-title inventory, or 24/7 events in player copy until the relevant capability is live, capacity-tested and supported. A title is **not** an MMO when it has only private co-op, a single test shard, synthetic-load evidence only, no moderated public chat, a manual recovery path for economy errors, no cross-region placement, or a developer-operated event schedule. Describe the exact current capability: “solo,” “private co-op,” “scheduled 12-player expedition,” or “limited online region.”

# PART 1 — Shared multi-title engine spine

| Service | SP-only readiness | Co-op readiness | Full-MP readiness | Canonical owner | Anti-cheat / integrity boundary |
|---|---|---|---|---|---|
| Identity/accounts | Local profile import/export; no shared entitlement. | Authenticated account, device/session records. | Regional auth, rate limits, account recovery, age mode. | `platform.identity`. | Short-lived signed session tokens; no client role claims. |
| Characters | Local deterministic save. | Server character lock when joining instance. | Character ownership, name moderation, transfer policy. | `title.character`. | Character revision/version on every durable write. |
| Inventory/collections | Local ledger/snapshot. | Server write for loot/consumption. | Ledger, idempotency keys, reconciliation, quarantine. | `title.inventory`. | Server validates item source, quantity, owner and rule version. |
| World regions/travel/fog | Local map + knowledge state. | Party instance map; owner resolves discovery. | Region shard, interest set, player-specific knowledge. | `title.world`. | Client receives only entitled/observable map state. |
| Combat | Local simulation is accepted SP truth. | Dedicated instance server is authority. | Fixed-tick dedicated simulation; server hit/loot/cooldown authority. | `title.combat`. | Client submits input/ability intent only. |
| Quests/journals | Local quest state. | Server validates shared quest events. | Event log + individual/party projections. | `title.quest`. | No client grant of completion/reward. |
| Friends/party | Offline contacts only. | Invite code, party roster, presence limited to session. | Mutual friends, privacy defaults, blocks, report links. | `platform.social`. | Mutual consent and rate limits; minors restrictive defaults. |
| Guilds | None. | Optional fixed expedition group. | Late: guild service, roles, logs, moderation. | `platform.guild`. | No guild bank before economy maturity. |
| Matchmaking/instances | None. | Invite allocator + 2–4 player instance. | Region queues, capacity, fleet health, reservation token. | `platform.placement`. | Signed join token; authoritative server only. |
| Vendor/economy | Local/test currency. | Server vendor receipts. | Versioned catalogs, economy ledger, fraud signals. | `title.economy`. | Atomic debit/grant; no client prices. |
| Auction | None. | None. | Late only after escrow/fraud/recovery gates. | `platform.market`. | Listing/bid/purchase transactional state machine. |
| Housing | Cosmetic local scene only. | Inviteable private decor later. | Late, instanced and quota-controlled. | `title.housing`. | Cosmetics only; no persistent resource advantage. |
| Moderation | Name validation, local report export. | Party report/mute/block. | Case queue, sanctions, appeal/evidence retention. | `platform.trust`. | Policy/risk model is server-side and auditable. |
| Telemetry/config | Local diagnostic opt-in. | Per-session metrics/flags. | Per-title/region/shard flags, staged rollout, incident switches. | `platform.ops`. | Signed versioned flag snapshots; least-privilege changes. |

### Quarantined folder shape

```text
wof/
  ember-crown/{content,client,server,rules,tests,ops}
  pactbeasts/{content,client,server,rules,tests,ops}
titles/{deepgate,salt-ledger,sunloom,lantern-run}/...
platform/{identity,inventory,placement,trust,ops,telemetry,protocol}
shared-contracts/{events,schemas,feature-flags}
```

# PART 2 — Networking & scale architecture

## 2.1 Topology

```text
client → regional gateway → identity/session → party/placement → dedicated instance
                              │                       │                   │
                              ├→ title inventory/economy ledger ◄──────────┤
                              ├→ social/trust/reporting                    └→ event outbox
                              └→ flags/telemetry/incident control              → analytics/support
```

Start one write region, one secondary placement/failover region, and one or two activity types. Keep hubs as long-lived but capped shards and combat/dungeon work as short-lived dedicated instances. The session server is ephemeral; character/inventory/economy writes are durable services. Managed fleet capacity or Agones-class orchestration can reserve a warm pool; do not build multi-region active-active economic writes before measured need. [1] [2]

## 2.2 Authority boundaries

| Function | Client may do | Server must decide |
|---|---|---|
| Movement | Predict local reversible motion and send sequence-numbered inputs. | Final position, collision, speed/teleport validity, reconcile snapshot. |
| Combat | Render anticipation and provisional VFX. | Cooldowns, range, hit, damage, death, reward eligibility. |
| Loot | Display provisional drop signal. | Roll, owner, item instance ID, grant/consume event. |
| Quest | Show local UI progress. | Completion, branch outcome, durable journal/reward. |
| Currency/store | Request intent. | Price, entitlement, debit/grant, refund/chargeback response. |
| Social | Request friend/party/message/report. | Permission, rate, age/privacy policy, delivery/logging/enforcement. |

Use local client prediction for the controlled avatar only; server acknowledges input sequence and clients replay unacknowledged intents after correction. Render remote actors from a short interpolation buffer. Bound server-side rewind for attacks to a measured policy window; it is never a client-controlled world rollback. [3]

## 2.3 Persistence, dupe prevention and recovery

| Data class | Write pattern | Recovery rule |
|---|---|---|
| High-value item/currency/trade | Serialised/conditional transaction writes ledger event + projection + outbox atomically. | Idempotency key returns original result; compensate via new event, never edit history. |
| Combat temporary state | Instance memory plus periodic checkpoint. | Rehydrate fresh server snapshot; no reward on uncertain result until commit. |
| Quest/world progression | Event receipt plus projection/version. | Replay after verified checkpoint. |
| Configuration | Versioned flag/config snapshot. | Revert exact version; audit who/why. |

`TradeCommitted`, `ItemGranted`, `ItemConsumed`, `CurrencyDebited`, `RewardReversed` carry operation ID, actor, source/sink, quantity, rule version, previous projection version and correlation ID. A command with same idempotency key but different parameters is rejected. This avoids retry/timeout duplication and permits support reconciliation. [4] [5]

## 2.4 Lag/disconnect/rollback

- Preserve an unexpected disconnect slot for a short grace period; bind reconnect token to account, character, session and expiry.
- On reconnect, reset client scene and stream fresh authoritative snapshot; do not replay unbounded packets.
- Save no durable item/quest outcome until authoritative transaction commits.
- If instance dies before commit, restore last checkpoint and issue no compensating reward without event evidence.
- Run packet loss, jitter, duplicate command, instance crash, database failover and partition simulations before each public capacity increase.

## 2.5 Illustrative cost bands

| CCU band | Shape | Principal cost drivers | Operational rule |
|---:|---|---|---|
| 100 | One region, 1–2 warm session servers, managed DB, manual on-call. | Warm capacity, observability baseline, auth/database. | No auction, public voice or player trading. |
| 1,000 | 2–3 regions, pooled dedicated instances, read cache, 24/7 alert rotation. | Compute/player-minute, egress, logs, moderation queue, peak headroom. | Capped queues; canary every content release. |
| 10,000 | Multi-region placement, multiple shards/modes, independent telemetry pipeline and support coverage. | Warm fleet, egress, DDoS/gateway, event retention, moderation/language coverage. | Economy ledger, incident drills and data-recovery RTO/RPO proven. |

Never promise a monthly cost without measured tick/bandwidth, instance density, egress, regional cloud price, moderation and retention data. Track cost per successful player-hour, successful placement and completed instance—not only virtual-machine price.

## 2.6 Kill switches

| Switch | Degradation | Data rule |
|---|---|---|
| `mp.instances.enabled` | New placement off; SP remains playable. | Existing sessions finish/evacuate; no new rewards after safe cutoff. |
| `chat.public.enabled` | System notices/party pings only. | Preserve report evidence under retention policy. |
| `trade.enabled` | New offers/listings disabled. | Settle committed atomic transactions; cancel pending safely. |
| `auction.enabled` | Market closed. | Escrow reconciled before re-enable. |
| `reward.grant.enabled` | Cosmetic/background grants paused. | No client-side fallback grants. |
| `title.readonly` | Login/status only. | Durable writes queued only where idempotent, otherwise reject clearly. |

# PART 3 — Title family catalog

| ID / title | 30-second fantasy and relationship | Core daily / weekly loop | Unique systems | Soft launch MP → later | Soft-launch minimum | Monetization / age |
|---|---|---|---|---|---|---|
| `ember-crown` — **Ember Crown** | Join one of four WOF civic folkways, defend a living border and decide which local promises survive. Same WOF shard. | Daily 20-minute patrol/contract; weekly regional accord. | Faction promise board; fog/knowledge; public plot clocks. | Solo + 4-player expeditions → capped hubs/events. | 12 regions, 4 factions, 30 quest chains, 10 expeditions, 2 bosses. | Cosmetics, banners, emotes; teen, no public chat by default for minors. |
| `pactbeasts` — **Pactbeasts of the Lanternwild** | Build a bonded field team from original WOF creatures and solve biome expeditions. Same WOF shard. | Daily habitat survey/bond task; weekly clear-board challenge. | Bond care, expedition loadout, asynchronous clear board. | Solo + invite co-op → seasonal asynchronous ranks; no live PvP/trade at soft launch. | Existing bestiary schema + 12 biomes, 20 scenario quests, 8 expeditions. | Cosmetic habitats/gear; all-ages with child-safe social mode. |
| `deepgate` — **Deepgate Accord** | Descend shifting civic vaults where teams negotiate routes, risk and extraction. Adjacent world. | Daily 15-minute delves; weekly deepgate route. | Route voting, extraction insurance, procedural room contracts. | 1–4 private co-op → 8-player scheduled depth runs. | 12 sectors, 20 contracts, 10 expedition layouts, 5 depth clocks. | Cosmetic camp kits/portraits; teen. |
| `salt-ledger` — **Salt Ledger** | Run a small coastal consortium, read tides and outmaneuver rival houses without a full player market. WOF-adjacent maritime shard. | Daily route/order puzzle; weekly faction negotiation. | Weather ledger, reputation favours, NPC trade contracts. | Solo + party voyages → regional social harbour. | 12 ports, 20 intrigue jobs, 10 voyages, 5 crisis clocks. | Ship paint, cabin decor, emotes; teen. |
| `sunloom` — **Sunloom Circuit** | Restore a bright civic machine-world by asynchronously weaving districts with other players’ recorded choices. Separate setting. | Daily district stitch; weekly city-pattern event. | Asynchronous ghost contributions, communal map layers, no direct combat dependency. | Solo → asynchronous shared districts → limited co-op workshops. | 12 districts, 20 civic tasks, 10 anomaly sites, 5 city clocks. | Cosmetic patterns/avatars; family-safe. |
| `lantern-run` — **Lantern Run Company** | A small crew carries fragile light through weather and creature-haunted crossings. Separate co-op-first setting. | Daily route run; weekly company challenge. | Shared lantern logistics, role-lite pack system, recovery camp. | 1–4 invite co-op only → 6-player events if proven. | 12 routes, 20 jobs, 10 crossings, 5 weather clocks. | Cosmetic lanterns/capes/camp flags; family/teen. |

# PART 4 — Content pipeline

## 4.1 Taxonomy and wave template

| Type | Ownership | Core validation |
|---|---|---|
| Creature/move/item | Title content team. | Unique ID, legal type/ref, balance simulation, accessibility label. |
| Region/biome | World team. | Map connectivity, spawn budget, travel/fog graph, performance. |
| Quest/contract | Narrative systems. | Reachability, state conflicts, reward source/sink, localization. |
| Dungeon/expedition | Encounter team. | Party size, seed determinism, exploit route, checkpoint/reconnect. |
| Boss/plot clock | Live content. | Schedule, eligibility, reward cap, kill switch. |
| Cosmetic | Art/commerce. | Original rights, no power stat, entitlement/preview/refund path. |
| Season | Live ops. | Feature flag, rollback, economy forecast, support/moderation plan. |

| Wave | Purpose | Minimum output / gate |
|---|---|---|
| 0: Soft launch | Prove one loop. | Core region pack, 20 seeds, 10 expeditions, safety/support runbook. |
| 1 | Retention variety. | +2 regions, +6 quests, +2 expeditions, +1 clock, +8 cosmetics. |
| 2 | Social depth. | +2 regions, +8 quests, +2 expeditions, event tooling, localization pass. |
| 3 | Seasonal replay. | +1 biome/theme, +10 quests, +1 challenge, first opt-in community event. |
| 4 | Scale only if gates pass. | +2 regions, +10 quests, +2 dungeons, balancing and technical debt allocation. |

## 4.2 Authoring schema

```ts
interface ContentNode { id:string; titleId:string; kind:'region'|'quest'|'expedition'|'cosmetic'|'clock'; version:number; localeKey:string; releaseWave:number; status:'draft'|'review'|'approved'|'released'|'retired'; refs:string[]; flags:string[]; }
interface QuestNode extends ContentNode { kind:'quest'; entry:string[]; prerequisites:string[]; steps:Array<{id:string; event:string; target?:string; count?:number}>; rewards:Array<{kind:'currency'|'item'|'cosmetic'; id:string; qty:number}>; failStates:string[]; }
interface EconomyRule { id:string; titleId:string; source:string; sink:string; cap:number; cooldownSec:number; configVersion:string; }
interface SeasonManifest { id:string; titleId:string; start:string; end:string; contentIds:string[]; flags:string[]; rollbackPlan:string; }
```

## 4.3 Validation gates

`content lint` rejects duplicate IDs, cross-title refs, unapproved type-chart edges, missing locales, illegal rarity, no-escape quest graphs, reward without source, sink/source overflow, unflagged seasonal content, client-visible secret data, untested move coefficient and cosmetic with combat stat. `economy sim` stress-tests 30/90/365-day faucets/sinks, bot loops and event multiplier combinations. `instance test` checks seed/reconnect/checkpoint determinism. AI may draft text, variants and test cases; humans approve all canon, localized copy, currencies, move values, drop rates and production config. No balance-critical number auto-ships.

## 4.4 Localization/readability

Use message keys not embedded prose; avoid puns in quest IDs; separate display-name, grammar gender, count and cultural reference fields; screen-reader names/descriptions for each creature, item, icon and state; test text expansion, right-to-left layout, colour-independent status cues and child-readable versions.

# PART 5 — Monster-collecting MMO layer: extension only

| Area | Soft-launch policy | Later gate |
|---|---|---|
| Trading | Disabled. Allow no player-to-player creature/item transfer. | Enable only after instance inventory ledger, account recovery, fraud/quarantine and support appeal SLAs pass. |
| Binding/ownership | Each creature has immutable `instanceId`, origin event, account owner, title/season, bond state and transfer policy. | Trade creates atomic escrow + ownership transfer event, never copy/delete pairs. |
| Competition | Async clear boards: fixed seed/ruleset, server replay validation, opt-in rankings. | Live PvP only after netcode, anti-cheat, matchmaking and minor-safety review. |
| Seasons | Seasonal encounter rotations add new sources but preserve SP save access and earned creatures. | Competitive formats use borrowed/ruleset pools; never delete SP-owned instances. |
| Gaps S1 | +12 shoreline/reef creatures; +18 moves across support/status types; +2 coastal biomes. | Designed around existing Prompt 1 schema. |
| Gaps S2 | +12 granite/undercity creatures; +18 moves; +2 highland/stone biomes. | Require type coverage simulation. |
| Gaps S3 | +10 reedfen/lampwood creatures; +16 moves; +2 wetland/night biomes. | Require readability/safety review. |
| Gaps S4 | +14 seasonal anomaly creatures; +20 moves; +1 expedition biome and one non-random catch-up path. | Require economy and collection-completion analysis. |

Each collector season uses a bounded progression board: clear expedition, study habitat, bond task, cosmetic badge. Premium currency never buys catch probability, a ranked clear, competitive move, an event completion or a missing creature. 

# PART 6 — Other systems content packs

The following uses compact **pack IDs** rather than novels. Every title receives 12 regions, 20 quest seeds, 10 expeditions, 5 clocks/bosses, 15 cosmetics and 10 seasonal seeds at soft launch. IDs map to title-local names only and can be developed in Waves 0–4.

| Title | 12 regions | 20 quest seeds | 10 expeditions | 5 clocks / bosses | 15 cosmetic concepts | 10 seasonal seeds |
|---|---|---|---|---|---|---|
| Ember Crown | Lampwood, Brinewatch, Granite Stair, Reedfen, Cinder March, Ash Compact, Tide Covenant, Stonevein, Hearthborn, Lanternfolk, Northbarrow, Glassmere | EC-Q01–20: patrol, oath, ferry, census, hearth, beacon, quarry, tide, lantern, archive, market, bridge, orchard, watch, fog, envoy, repair, rescue, council, vow | EC-D01–10: root vault, salt stair, cinder pass, drowned archive, glass mine, reed maze, beacon climb, oath hall, tide lock, stone refuge | EC-C1 ember drought; C2 fog bell; C3 salt breach; C4 stair quake; C5 council fracture | capes, banners, lantern skins, camp rugs, crest pins, cloaks, masks, satchels, frames, dyes, boots, gliders, tents, emotes, nameplates | lantern week, tidewatch, hearth fair, fog chase, bridgework, seed day, bell vigil, quarry song, map month, vow renewal |
| Deepgate Accord | Gate Plaza, Brass Vein, Root Lift, Mirror Sump, Ash Lift, Ember Shelf, Blue Vault, Silt Court, Hollow Tram, Stone Choir, Driftworks, Last Door | DG-Q01–20: map, rescue, seal, salvage, escort, bargain, sample, relay, survey, repair, recover, vote, clear, witness, stabilise, decode, guide, extract, memorial, audit | DG-D01–10: tier one–ten descent routes | DG-C1 pressure rise; C2 lantern drain; C3 echo swarm; C4 seal breach; C5 last-door opening | helmets, ropes, packs, lantern frames, emotes, tags, tents, tools, trail paint, banners, capes, boots, badges, maps, pet lights | deep week, survey race, quiet hour, salvage fair, echo festival, map exchange, rope day, vault lights, repair drive, memorial run |
| Salt Ledger | Brinewatch, Red Quay, Saffron Inlet, Gull Step, Black Salt, Lantern Reef, Kelp Court, Windward Chain, Pearl Gut, Mudglass Bay, Pilgrim Dock, Crown Shoal | SL-Q01–20: manifest, courier, bargain, chart, escort, inspect, salvage, spy, mediate, ration, tide, repair, witness, audit, decode, petition, rescue, deliver, conceal, testify | SL-D01–10: reef run, fog convoy, salt vault, wreck court, tide maze, shoal chase, lantern reef, gale pier, mudglass, crown route | SL-C1 red tide; C2 tariff war; C3 storm debt; C4 reef blight; C5 harbour strike | sail paints, cabin mats, compass skins, coats, flags, ropes, cups, crew emotes, dock pets, maps, lanterns, boots, brooches, masks, nameplates | tide market, gull race, lantern flotilla, salt harvest, fog tales, chart week, reef clean, dock feast, rain trade, winter moor |
| Sunloom Circuit | Woven Gate, Prism Court, Ember Loom, Quiet Span, Verdant Coil, Glass Forum, Hush Basin, Copper Rise, Morrow Grid, Blue Canopy, Threadwell, Dawn Array | SC-Q01–20: weave, repair, translate, map, garden, bridge, tune, archive, welcome, share, balance, cleanse, signal, shelter, trace, gather, calm, build, observe, celebrate | SC-D01–10: anomaly workshop routes | SC-C1 dimming weave; C2 signal rain; C3 mirror drift; C4 thread collapse; C5 civic eclipse | pattern capes, prism masks, loom frames, badges, glow trails, tools, banners, palettes, emotes, pets, rugs, lenses, jackets, titles, frames | weave bloom, prism night, repair month, civic chorus, lantern circuit, garden pulse, quiet day, thread fair, mirror walk, dawn return |
| Lantern Run | Camp One, Moss Road, Paper Bridge, Hollow Field, Rain Shelf, Stone Mile, Glow Marsh, Wind Gate, Pine Cut, Red Ford, Sleepy Ridge, Last Camp | LR-Q01–20: carry, mend, guide, warm, scout, shelter, barter, bridge, cook, signal, rescue, map, watch, repair, listen, forage, choose, recover, escort, return | LR-D01–10: crossing routes | LR-C1 gale front; C2 lantern dim; C3 bridge washout; C4 marsh rise; C5 long night | lantern shades, capes, packs, mugs, flags, stools, boots, bedrolls, emotes, trail marks, masks, gloves, tents, pins, pets | rain run, glow week, camp songs, map swap, bridge day, trail feast, lantern repair, wind watch, quiet night, first thaw |

# PART 7 — Economy, progression, anti-P2W

| Rule | Policy |
|---|---|
| Soft currency | Earned in title-local play; no cash-out; used for ordinary NPC services, craft upkeep, travel and cosmetic variants. |
| Premium currency | Platform wallet, title-local catalog spend; transparent price/exchange/refund terms. |
| Premium never buys | Combat power, creature catch rate, raid clears, quest completion, ranked scoring, resource yield, stat reroll, PvP entry advantage, auction advantage. |
| Faucets | Quest rewards, capped daily contracts, event participation, salvage/recovery. |
| Sinks | NPC services, cosmetic crafting/dyes, travel, optional décor, repair where it does not block competitive play. |
| Collector rarity | Time/skill/biome/season variety; every competitive source has a non-paid catch-up route. |
| Auction go/no-go | No auction until ledger escrow, idempotent settlement, rate/fraud controls, reversals, support tools, child policy and economy simulation pass. |

# PART 8 — Live ops & trust

| Area | Policy |
|---|---|
| Calendar | 8–10 week seasons: 1 week preflight, 6 active, 1 catch-up, 1 review; no simultaneous major economy and combat-rule rewrite. |
| Incidents | Flag namespaces for title/region/shard/build; each switch has default-safe value, owner, expiry, re-enable check and player message. |
| Moderation | Reports at message/player/party/guild level; deterministic filters + context queue + human review; mute/block immediately available. |
| Kid/teen | Child mode: no public DMs, no trading, no voice, no adult discovery; canned/ping communication only until separately reviewed. |
| Support | Runbooks: rollback raid reward via compensating event; lost bound creature via origin-event reconciliation; dupe exploit via freeze/quarantine/replay, never ad hoc client grant. |

# PART 9 — Staffing & build order

| Stage | Roles | Founder + contractor feasible output |
|---|---|---|
| 0 / SP | Product/creative lead, gameplay engineer, content implementer, part-time art/audio, QA contractor. | Ember Crown SP vertical slice, authoring schema, tests, not online world. |
| Soft launch co-op | Add backend/network engineer, technical artist, QA lead, community/moderation contractor, DevOps/SRE fraction. | Lantern Run 1–4 invite co-op with one region and no economy/social complexity. |
| 10k CCU | Dedicated platform/network, SRE/on-call, security/economy, data, trust/safety, live content, support leads, regional moderation. | Multiple capped titles/regions only after operational evidence. |

Hard dependencies: authoritative inventory before trading; session/reconnect before public co-op; moderation before open chat; support/reconciliation before paid economy; structural metric/flag platform before regular seasons. Parallel tracks: SP content packs, art pipeline, backend contracts, synthetic load harness, localization preparation.

# PART 10 — Master checklists

## 10.1 WOF SP living world ready

- [ ] WOF title root has no live SynapticGM import, credential or save path.
- [ ] Region/quest/entity IDs are unique, localised and schema-validated.
- [ ] SP state is deterministic, recoverable and version-migrated.
- [ ] Quest reachability, reward source/sink and type rules pass CI.
- [ ] Accessibility, content rating and original-IP ban-list review pass.
- [ ] Save export/import and correction audit work offline.

## 10.2 WOF co-op instances ready

- [ ] Dedicated server owns combat, loot, cooldowns and quest completion.
- [ ] Input sequence/reconciliation, interpolation, reconnect and packet-loss tests pass.
- [ ] Item/currency writes use operation IDs, atomic ledger/projection/outbox and replay tests.
- [ ] Invite/party/privacy/block/report flows pass, including child mode.
- [ ] Instance capacity, crash recovery and kill-switch rehearsal pass.
- [ ] No trade, auction, public chat or guild bank unless separately gated.

## 10.3 Title N soft-launch ready

- [ ] 12 regions, 20 quest seeds, 10 expeditions, 5 clocks, 15 cosmetics, 10 seasonal seeds approved.
- [ ] One complete onboarding → core loop → return loop is tested with target players.
- [ ] Title config, economy tables and flags are isolated by `titleId`.
- [ ] Analytics cover login, placement, completion, correction, cost/player-hour and support contacts.
- [ ] Support, moderation, rollback and regional outage runbooks have tabletop exercise evidence.
- [ ] Capacity/release copy describes actual session cap and available social features.

## 10.4 Red lines: do not call it an MMO yet

- [ ] No seamless-world claim without persistent-region scale/load proof.
- [ ] No global-auction claim without escrow/fraud/recovery proof.
- [ ] No safe-for-kids public-chat claim without age-mode/moderation capacity.
- [ ] No PvP claim without authoritative hit validation/anti-cheat/replay support.
- [ ] No cross-title inventory/economy claim.
- [ ] No “always online” claim without on-call, recovery and status infrastructure.

# PART 11 — Open founder decisions

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| MP ambition | Ship SP then private 1–4 player co-op first. | Begin public hubs early. | Hub/moderation/network burden can consume content runway. |
| Trading | Disable through soft launch. | Low-value bound gifting only. | Early dupe/fraud/account-theft incidents damage trust. |
| PvP | Async clear boards first. | Live PvP after dedicated proof. | Netcode/balance/anti-cheat scope expands materially. |
| Auction | Late, title-local, no cash-out. | NPC market only. | Financial-system support/fraud burden overwhelms small team. |
| Universe | WOF shared only for Ember Crown/Pactbeasts/Salt Ledger; others separate. | One fully shared universe. | Cross-title canon/economy/content coupling slows iteration. |
| Kid MP | Restrictive child mode; no open chat/trade/voice. | Adult/teen-only MP. | Either moderation complexity or narrower audience. |
| Hosting | Managed sessions/fleet until measured scale justifies orchestration. | Self-operated cluster early. | Premature platform overhead and on-call risk. |

## References

[1]: https://agones.dev/site/docs/advanced/scheduling-and-autoscaling/ "Dedicated session placement and autoscaling"
[2]: https://learn.microsoft.com/en-us/xbox/playfab/multiplayer/servers/scaling-standby "Warm capacity planning"
[3]: https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html "Prediction and reconciliation"
[4]: https://www.postgresql.org/docs/current/transaction-iso.html "Transactional isolation"
[5]: https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html "Transactional outbox"
[6]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "Age-appropriate design"
[7]: https://opentelemetry.io/docs/what-is-opentelemetry/ "Telemetry architecture"
[8]: https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html "Transaction authorisation"
