# WOF (World of Fantasy) — Remaining Holes Dump

**Date:** August 15, 2026
**Status:** Design research for WOF, a later-release text MMO platform. NOT live SynapticGM. No production code. No licensed settings as WOF content.
**Purpose:** Fill the remaining design holes: turn accounting vs group combat, WOF vs live SGM product split, raid-on-phone UI, death/wipe/repair/gold sinks, family/Kid Mode LLM billing, week-2 retention, live-ops staffing, push/mail hooks, failure modes, and John's calls. EXTENDS prior dumps; does not redefine locked schemas.

---

## IP Check

All names, mechanics, worlds, and examples below are original to WOF. Real games named as SOURCES only.

---

## Already Done (Do Not Redo)

1. EncounterLedger, BattlePlan, lockstep rounds, manual/plan-auto, runMode per encounter.
2. Millstone Hollow 3-phase raid script (10-player, weekly per-character per-boss lockout).
3. Four memory stores (~2k prompt, catalog lookup max 10, 1 pinned topic, never raw chat).
4. Shared catalogs (species/item/card/frame templates) + seed bands.
5. Reedfen first hour (12 tutorial beats), Lampwood Gate (5-room 5-man, solo-able).
6. Theme Kits per world (UI skin + dice + voice + fashion), entitlements schema (AccountEntitlement, WorldUnlock, ThemeKitGrant, ChromeSku, Wallet).
7. Phone chrome: hub, lockstep fight, journal, paper-doll, collection log, cozy tick, bracket (4 worlds laid out).
8. Module maths one-pagers (hp_check, bond_type, score_set, cozy_tick, card_lane, frame_heat, realm_gate, bond_heart).
9. Plan matrix (Free 15 / Mid 50 / High unlimited-capped), world DLC buy-and-own, à la carte chrome.
10. MailDigest schema exists — wire it here.
11. Social: FriendEdge, block/ignore, party, tell + hub say, sanitized presence, no global chat v1.
12. Quest DAGs, talent trees, gold sources/sinks (high level), two wallets (gold vs cosmetic tokens).

---

## 1) Turn Accounting vs Group Combat

### Goal

Define what spends a turn, how group combat costs work per player, and whether free-tier players can complete a 5-man or raid in one day.

### What Spends a Turn

```typescript
interface TurnLedger {
  accountId: string;
  dayUtc: string;                           // "2026-08-15" — resets at 00:00 UTC
  spent: number;                            // turns used today
  cap: number;                              // daily turn cap (15 / 50 / unlimited-capped)
  reasons: TurnSpendEntry[];
}

interface TurnSpendEntry {
  turnIndex: number;
  timestamp: number;
  reason: TurnSpendReason;
  instanceId: string | null;
  roundId: string | null;
  llmTokensUsed: number;                   // actual tokens billed to this player's budget
}

type TurnSpendReason =
  | "hub_beat"                              // 1 turn: player acts in a hub (talk, salvage, navigate)
  | "tell"                                  // 0 turns: tells are free (no LLM involved)
  | "hub_say"                               // 0 turns: hub say is free (code-rendered, no LLM)
  | "lockstep_round"                        // 1 turn per player per round (see below)
  | "dungeon_mode_a_prose"                  // 0 extra: already counted in lockstep_round
  | "raid_mode_a_prose"                     // 0 extra: already counted in lockstep_round
  | "raid_mode_c_chrome"                    // 0.5 turns per player per round (speculative — see below)
  | "plan_auto_round"                       // 1 turn per round (same as manual — auto doesn't save turns)
  | "idle_presence"                         // 0 turns: idle hub costs NOTHING (locked)
  | "journal_read"                          // 0 turns: reading journal/map/character sheet is free
  | "ah_browse"                             // 0 turns: browsing AH is free (code-rendered)
  | "ah_list"                               // 0 turns: listing an item is free
  | "ah_buy"                                // 0 turns: buying an item is free
  | "mail_read"                             // 0 turns: reading mail is free
  | "housing_decorate"                      // 0 turns: decorating is code-only
  | "rest_checkpoint"                       // 0 turns: resting at checkpoint is free
  | "combat_choice"                         // 0 turns: selecting your action for the round is free
  //                                           (the turn is spent when the round RESOLVES, not when you choose)
```

### Core Rule: 1 Turn per Player per Resolved Round

```
When a lockstep round resolves:
  - Each player in the instance spends 1 turn from their own TurnLedger.
  - This is PER-PLAYER, not shared. A party of 5 in a 5-man spends 5 turns total
    (1 from each player's budget), not 5 from one player.
  - This is NOT host-pays. Each player pays their own LLM cost.
  - Plan-auto rounds cost the same as manual rounds. Auto doesn't save turns.
  - Idle players in the hub spend 0 turns (no LLM call).
  - Hub beats (talk to NPC, navigate, salvage) cost 1 turn each.

Why 1 turn per round per player (not cheaper):
  - Each player gets a personalized prose narration of their action in the round.
  - The LLM writes a 2–6 sentence "camera" for each player's action result.
  - In a 5-man, the LLM makes up to 5 narration calls per round (one per player).
  - In a raid, the LLM makes up to 10 narration calls per round (Mode A)
    or 1 shared call (Mode C) — see below.
```

### Mode A vs Mode C LLM Cost

```
Mode A (dungeon narration — already locked for 5-man):
  - 1 LLM call per player per round. Each player gets unique prose.
  - Cost: 1 turn per player per round.
  - 5-man, 20 rounds: 20 turns per player. 100 LLM calls total.

Mode C (compressed raid narration — John's call, not yet decided):
  - 1 SHARED LLM call per round. All 10 players receive the same prose summary.
  - The summary names key actions ("Kael's strike staggers the Millwarden;
    Ren's ward absorbs the flood pulse") but is one paragraph, not 10 personalized views.
  - Cost: 0.5 turns per player per round (speculative).
    Rationale: the LLM cost per player is ~50% of Mode A because the call is shared.
    The 0.5 is rounded: 2 rounds = 1 turn spent.
  - Raid 10, 50 rounds: 25 turns per player (Mode C). 50 LLM calls total.
  - Raid 10, 50 rounds: 50 turns per player (Mode A). 500 LLM calls total.

Mode A for raids:
  - 10 personalized narrations per round. Dramatically more expensive.
  - 50 turns per player for a full raid clear.
  - Free-tier (15 turns) CANNOT finish a raid in Mode A.
  - Mid-tier (50 turns) can BARELY finish (50 rounds = 50 turns, exactly at cap).
  - High-tier (unlimited-capped) is fine.

Mode C for raids:
  - 1 shared narration per round. Dramatically cheaper.
  - 25 turns per player for a full raid clear.
  - Free-tier (15 turns) STILL cannot finish (25 > 15).
  - Mid-tier (50 turns) finishes easily (25 of 50 turns used).
  - High-tier is fine.

DESIGN AROUND BOTH: the turn cost table below shows both Mode A and Mode C columns.
John picks the raid narration mode; the engine supports either.
```

### Turn Cost Table

| Content | Rounds (speculative) | Turns Spent per Player (Mode A) | Turns Spent per Player (Mode C) | FREE (15/day) | MID (50/day) | HIGH (∞-capped) |
|---------|--------|--------|--------|-------|------|------|
| **Hub session (explore, talk, salvage)** | N/A | 5–8 hub beats | 5–8 hub beats | Yes (7 turns, half the budget) | Yes | Yes |
| **Solo 5-man (Lampwood Gate, 5 rooms)** | 12–18 | 12–18 | N/A (solo = Mode A always) | Tight (15 rounds max, may need 2 sessions) | Yes | Yes |
| **Party 5-man** | 15–25 | 15–25 | N/A (5-man = Mode A, locked) | NO (15 < 15–25). Can start, may not finish. | Yes | Yes |
| **Raid 10 (Millstone Hollow, 3 phases)** | 40–60 | 40–60 | 20–30 | NO (either mode) | Mode A: tight. Mode C: yes. | Yes |
| **Daily solo loop (hub + 1 short quest)** | N/A | 8–12 hub beats | N/A | Yes (8–12 of 15) | Yes | Yes |
| **Quick check-in (AH, mail, salvage)** | N/A | 2–4 hub beats | N/A | Yes (2–4 of 15) | Yes | Yes |

### Can Free-Tier Players Raid?

**No. Free-tier players cannot complete a full raid in one day under either Mode A or Mode C.**

Options:
1. **Raid requires Mid+.** Free players are told: "Raids require a subscription." Clear, honest, industry-standard (FFXIV requires a sub to raid).
2. **Rounds are cheaper than hub turns.** Combat rounds cost 0.5 turns instead of 1. This halves all costs but also doubles the effective free turn budget, which may be too generous for hub content.
3. **Mode C is cheap enough for Mid.** If Mode C costs 0.5 turns, Mid-tier (50) can easily finish a raid (25 turns). Free still cannot.

**Recommendation: Raid requires Mid+.** This is the cleanest answer. Raiding is endgame content; endgame players should be subscribers. Free-tier is for solo/casual play: hub exploration, solo 5-mans (tight but possible), daily loops.

**Can free-tier finish a 5-man?** Solo: yes (tight — 12–18 rounds, budget is 15). Party: probably not in one session (15–25 rounds > 15 turns). Recommendation: free-tier can solo the first 5-man in one session. Party 5-mans may require 2 sessions on free (or a Mid+ sub). John's call #2.

### Per-Player LLM Budget + Split Shared Mode A Cost

```
Per-player LLM budget:
  - Each player's TurnLedger tracks their own spent turns.
  - Each player's LLM token usage is metered independently.
  - In Mode A (personalized narration), each player's LLM call is billed
    to their own budget. No cross-subsidy.
  - In Mode C (shared narration), the single LLM call's cost is SPLIT
    across all participating players. Each player is billed:
    sharedCost = totalLlmTokens / partySize
    This is the 0.5 turn cost: one call costs ~5 turns of tokens total,
    split 10 ways = 0.5 per player.

Speculative token budgets (per LLM call):
  - Hub beat: ~300–500 tokens (short prose, 2–4 sentences).
  - Combat round (Mode A, per player): ~400–800 tokens (action + result + enemy tell).
  - Combat round (Mode C, shared): ~800–1200 tokens (one paragraph covering 10 players).
  - Session total (45 min, ~20 turns): ~6,000–16,000 tokens per player.
```

---

## 2) WOF vs Live SynapticGM (Product)

### Goal

Define how WOF and live SynapticGM relate as products. Separate app? Same app with a world picker? Shared login? Shared chrome shop?

### Recommendation: Separate Later App, Account-Linked

```
Option A: Same app with a World Picker.
  Player opens one app. Top screen: "Solo Adventures" (SGM) and "Worlds" (WOF).
  Pro: one install, one login, cross-promotion.
  Con: confused identity. "Is this a single-player game or an MMO?"
       SGM players who don't want multiplayer see WOF promo constantly.
       WOF has different server architecture (instance workers, presence, parties).

Option B: Separate app, shared account.
  Two apps. Same account (email/password). Same friend list.
  Chrome shop is SEPARATE (SGM cosmetics ≠ WOF cosmetics).
  Pro: clear identity for each product. No confusion.
  Con: two installs. Some players won't discover the other product.

Option C: Account-linked, two clients.
  Same as B but the apps can deep-link to each other.
  "Your friend Kael is playing Ash Compact. [Open WOF]"
  Pro: cross-promotion without confusion.
  Con: slightly more engineering (deep links, shared auth).

RECOMMENDATION: Option C — Account-linked, two clients.

Rationale:
1. Clear product identity. SGM is "your solo AI GM." WOF is "a text MMO with friends."
2. Shared account means one login, one friend list, one billing account.
3. Deep links enable cross-promotion without cluttering the main UI.
4. Chrome shops are SEPARATE. SGM dice ≠ WOF dice. SGM UI themes ≠ WOF UI themes.
   No shared chrome shop. The products have different visual pipelines.
5. Subscription is SEPARATE. SGM sub meters SGM capacity. WOF sub meters WOF capacity.
   A player may sub to one and not the other.
```

### What Must Not Cross

```
1. Isekai Gate / Hearth Ruin must not appear inside live SynapticGM.
   These are WOF world names. They do not exist in SGM's solo experience.
   If a player asks SGM to "take me to Ash Compact," the GM responds in-fiction
   but does NOT create a WOF connection.

2. Live SGM save must NEVER import into Ash Compact (or any WOF world).
   SGM characters use a different stat model (LitRPG System, Integration, Wave).
   WOF characters use world-specific modules (hp_check, bond_type, etc.).
   There is no stat conversion. No character transfer. No "bring your SGM character."
   If a player tries: "Your story in [SGM] is yours alone. Ash Compact is a new beginning."

3. SGM gold ≠ WOF gold. SGM cosmetic tokens ≠ WOF cosmetic tokens.
   No cross-wallet. No conversion. No shared economy.
```

### Store Listing Copy (How a Player Understands the Difference)

```
SynapticGM (live now):
  "Your AI Game Master. Solo adventures in a living story.
   Choose your world. Fight, explore, and level up —
   every story is unique, every choice is yours alone."

WOF — World of Fantasy (later):
  "A text MMO with friends. Pick a world — fantasy, space, school, farm —
   and play together. Dungeons, raids, trading, housing.
   Your AI GM runs the story; your friends share the adventure."

Key differentiator in the listing:
  SGM = solo, personal story, many genre modes, one player.
  WOF = multiplayer, shared worlds, parties, economy, one persistent character per world.
```

### What Happens If They Try to Bring a Save

```
UI copy (if deep-linked from SGM to WOF):
  "Welcome to World of Fantasy. This is a new adventure —
   your [SGM character name] stays in their own story.
   Create a new character to explore Ash Compact."

No import button. No "transfer character" option.
The WOF character creation flow starts fresh.
```

---

## 3) Raid 10 on a Phone

### Goal

Prove that a 10-player raid can work on a portrait phone screen. If it cannot, recommend sliding raid to F&F-only or desktop-web.

### Thumb Rules

```
1. Send / Stop button: ALWAYS bottom-right. Never moves between screens.
2. Minimum touch target: 44pt × 44pt (Apple HIG / WCAG).
3. 10 full character portraits: FORBIDDEN. They would each be ~30px wide — unreadable.
4. Compact ally rows: name + role icon + HP% bar. One line per ally. ~20pt height.
5. Story area: 40% of screen. Shorter than hub/5-man (to fit ally list).
6. System recap: collapsed by default. Expand tap to see full round detail.
7. Your action panel: same as 5-man (3–4 choice chips + free text).
8. Orientation: portrait only for v1. Landscape is not designed.
```

### Raid Lobby

```
┌─────────────────────────────────────┐
│ MILLSTONE HOLLOW · RAID 10    [×]   │
├─────────────────────────────────────┤
│ ► YOUR PARTY                        │
│  1. ★ Kael (You)   Tank    ✓ Ready  │
│  2.   Ren          Healer  ✓ Ready  │
│  3.   Mira         DPS     ○ ...    │
│  4.   Tobin        DPS     ✓ Ready  │
│  5.   Wynn         Support ✓ Ready  │
│                                     │
│ ► SECOND PARTY                      │
│  6.   Dell         Tank    ✓ Ready  │
│  7.   Fenn         Healer  ○ ...    │
│  8.   Renna        DPS     ✓ Ready  │
│  9.   Pip          DPS     ✓ Ready  │
│ 10.   Sable        Support ✓ Ready  │
│                                     │
│ Lockout: Millwarden — NOT cleared   │
│ Your lockout resets: Tue 00:00 UTC  │
├─────────────────────────────────────┤
│  [Ready ✓]  [Leave Raid]    [Chat]  │
│             (all ready → Start)     │
└─────────────────────────────────────┘

Notes:
- ★ = raid leader. Leader starts when all 10 are ready.
- Role icons: shield (tank), cross (healer), sword (DPS), link (support).
- Lockout badge: "NOT cleared" or "CLEARED" per boss.
- No portraits. Name + role icon + ready state only.
- Two sub-parties (5+5) for healing/buff targeting (speculative).
```

### During Round (Your Action + 9 Compressed Ally Rows)

```
┌─────────────────────────────────────┐
│ MILLSTONE HOLLOW · R12  Phase 2     │
├─────────────────────────────────────┤
│                                     │
│  "The Millwarden's grinding arm     │
│   sweeps low. Water surges through  │
│   the breach in the east wall."     │
│                                     │
├─────────────────────────────────────┤
│ ─── YOU (Kael · Tank) ──────────── │
│ HP ████████░░ 68%  STA ███░░░ 40%  │
│ Status: [Soak target]               │
├─────────────────────────────────────┤
│ ─── ALLIES (tap row to expand) ─── │
│ Ren   Heal  HP ██████░░ 82%   OK   │
│ Mira  DPS   HP █████░░░ 61%   OK   │
│ Tobin DPS   HP ████████░ 91%  OK   │
│ Wynn  Sup   HP ███████░ 77%   OK   │
│ Dell  Tank  HP ██████░░ 72%  SOAK  │
│ Fenn  Heal  HP █████░░░ 55%   OK   │
│ Renna DPS   HP ████████░ 88%  OK   │
│ Pip   DPS   HP ██░░░░░░ 24%  ⚠LOW │
│ Sable Sup   HP ███████░ 79%   OK   │
├─────────────────────────────────────┤
│  [Strike] [Soak] [Brace] [Stop ■]  │
│  [Free text...]            [Send ▶] │
└─────────────────────────────────────┘

Key:
- 9 ally rows are COMPACT: name (5ch) + role (4ch) + HP bar + status flag.
- Status flags: OK, SOAK (soak assigned), ⚠LOW (<30%), DOWN, DC (disconnected).
- Tap an ally row → expands to show their last action + current conditions.
- Soak/interrupt flags are on the BOSS display (collapsed by default):
  [Boss: Millwarden · Phase 2 · SOAK WINDOW ▼]
  Tapping ▼ expands: "Flood Surge — soak required. 2 players must Soak."
- [Stop ■] pauses plan-auto. Always visible during combat. Same position as 5-man.
- [Send ▶] is ALWAYS bottom-right.
- No portraits. No avatars. HP% bars only. Color-coded: green > 50%, yellow 30–50%, red < 30%.
```

### Late Prose

```
┌─────────────────────────────────────┐
│ ─── LATE PROSE · Round 11 ──────── │
│ (This narration arrived after the   │
│  round resolved. HP is unchanged.)  │
│                                     │
│  "Ren's ward flares white against   │
│   the flood. Pip staggers but       │
│   stays on their feet — barely."    │
│                                     │
│ roundId: R11 (current: R12)         │
│ ─── does not rewrite HP ────────── │
└─────────────────────────────────────┘

Rules:
- Late prose is displayed in a distinct block (dimmed border, "(Late)" label).
- It shows the roundId it belongs to. If the current round has advanced, the prose is
  informational only — it does NOT update HP, status, or the System recap.
- Late prose is always BELOW the current round's prose, never above.
- If the prose arrives more than 2 rounds late, it is silently discarded (not shown).
```

### Disconnect: Hold vs Last Plan

```
Player-facing copy (if YOUR connection drops):
┌─────────────────────────────────────┐
│ ─── CONNECTION LOST ────────────── │
│                                     │
│ Your character will follow their    │
│ last plan until you reconnect.      │
│ If no plan was set, they will       │
│ defend each round.                  │
│                                     │
│ Your allies can see:                │
│   "Kael (DC) — following last plan" │
│                                     │
│ [Reconnecting...]                   │
│ [Leave Raid — progress is saved]    │
└─────────────────────────────────────┘

What the other 9 see:
  Ally row changes to:
  Kael  Tank  HP ██████░░ 68%   DC
  (tap to expand: "Disconnected. Following last plan: Strike.")
  
  The DC'd player's character continues to act using their last BattlePlan.
  If no plan was set, the character defaults to "Defend" each round.
  The character does NOT leave the instance. They do NOT despawn.
  They DO take damage and CAN be downed.
  If the player reconnects, they resume control immediately (next round).

Replace/fill after disconnect:
  v1 RECOMMENDATION: NO mid-combat fill.
  Rationale:
  1. Mid-combat fill requires matchmaking during an active encounter.
     The replacement player enters mid-fight with no context.
  2. The replacement may have already cleared this boss (lockout conflict).
  3. The DC'd player may reconnect and find their slot taken.
  4. Better: the DC'd character follows last plan. The party can still win.
     If the party wipes, they return to checkpoint. The DC'd player can rejoin
     from checkpoint when they reconnect.
  5. v2 (speculative): allow fill from checkpoint (between encounters, not mid-combat).
```

### Can This UI Work?

```
Assessment: YES, but tightly constrained.

The 10-player raid fits on a portrait phone IF:
1. Ally rows are compact (no portraits, name+role+HP%+flag, one line each).
2. Story area is reduced to ~35–40% of screen (3–4 lines of prose).
3. System recap is collapsed by default (expand on tap).
4. Boss display is collapsed by default (expand on tap for soak/interrupt flags).
5. Your action panel is the same as 5-man (3–4 chips + free text + Send).
6. Stop button is always visible in combat.
7. Late prose is distinct and non-blocking.

Risk: if the phone screen is < 5.5 inches, the ally list may clip.
Mitigation: ally list scrolls independently of the story area. The top 4 allies
are always visible; scroll to see the rest. Or: show only flagged allies
(LOW, SOAK, DOWN, DC) and collapse OK allies into a count: "6 allies OK."

Recommendation: DO NOT slide raid to desktop-only. The UI works. It's tight,
but it works — and mobile MMOs (FFXIV companion, WoW remote) have shipped
similar-density raid frames. The key is that WOF is TEXT, not 3D — the raid
frame doesn't need a viewport, just a list.

If playtesting shows the UI is unreadable: F&F fallback is available.
But design for phone first.
```

---

## 4) Death, Wipe, Repair, Gold Sinks

### Wipe vs Character Death vs Item Durability

```typescript
interface DeathState {
  characterId: string;
  state: "alive" | "downed" | "dead_this_encounter";
  // "downed": HP ≤ 0. Character is incapacitated. Cannot act.
  //   In 5-man: party can still fight. If all party members are downed → WIPE.
  //   In raid: same rule. All 10 downed → WIPE.
  //   A healer/support CAN revive a downed player (code-owned action, costs a turn).
  //   Revive restores HP to 25% of max.
  // "dead_this_encounter": NOT A STATE IN V1.
  //   v1 has no permadeath. Downed players are revived at checkpoint on wipe.
  //   v2 (speculative): death saves (D&D-style) for high-difficulty modes.
}

interface WipeState {
  instanceId: string;
  isWiped: boolean;
  checkpointRoomIndex: number;
  clearedRooms: number[];
  // On wipe:
  //   1. All party members are teleported to the last checkpoint.
  //   2. All HP restored to 50%. STA restored to 0.
  //   3. Cleared rooms STAY cleared. The party does not redo cleared content.
  //   4. Enemies in the current room RESET to full HP.
  //   5. Loot from cleared rooms is KEPT (already in inventory).
  //   6. Item durability: ALL equipped items lose 10% durability (see below).
  //   7. The party can retry from the checkpoint.
  // Corpse run: FORBIDDEN. No running back to your body. Checkpoint only.
}

interface ItemDurability {
  itemId: string;
  characterId: string;
  maxDurability: 100;
  currentDurability: number;                // 0–100
  // Rules:
  // 1. Durability decreases on: wipe (all items -10%), combat round (equipped weapon -1%, equipped armor -1%).
  // 2. At durability 0: item is BROKEN. It gives 0 stat bonuses.
  //    Broken items are NOT destroyed. They can be repaired.
  // 3. Repair cost: (100 - currentDurability) × item.repairCostPerPoint gold.
  //    Example: T1 knife, durability 40/100, repairCostPerPoint = 1 gold.
  //    Repair cost = 60 × 1 = 60 gold.
  // 4. Repair is done at a vendor NPC (hub) or with a Salvage Kit (field, limited uses).
  // 5. LLM never repairs, never breaks, never changes durability. Code owns it.
  repairCostPerPoint: number;               // gold per durability point (tier-scaled)
}
```

### Repair Cost Table (Speculative)

| Item Tier | Repair Cost per Point | Full Repair (0→100) | Weekly Repair (typical use, ~70→100) |
|----------|----------------------|--------------------|------------------------------------|
| T1 (starter) | 0.5 gold | 50 gold | 15 gold |
| T2 (5-man drops) | 1 gold | 100 gold | 30 gold |
| T3 (raid drops) | 2 gold | 200 gold | 60 gold |
| T4 (rare crafted) | 3 gold | 300 gold | 90 gold |

### Inn Rest

```
Inn rest (hub action, 1 turn):
  - Restores HP to 100%.
  - Restores STA to 100%.
  - Does NOT repair items.
  - Does NOT cost gold (free recovery between dungeons).
  - Available at any hub NPC with the "rest" tag (Elder Mara, Hall Keeper, etc.).
  - LLM narrates the rest scene. Code handles HP/STA recovery.
```

### Gold Sinks: Week 1 vs Week 8

| Gold Sink | Week 1 (Fresh) | Week 8 (Established) | Notes |
|----------|----------------|---------------------|-------|
| **Vendor purchases** (consumables, T1 gear) | High — players buying starter gear and bandages | Low — players have dungeon/AH gear | Tapers as players gear up. |
| **Repair costs** | Low — T1 gear, few wipes | Moderate — T2/T3 gear, raid wipes | Scales with gear tier. Main ongoing sink. |
| **AH listing tax** (speculative 5%) | Zero — AH seeded weeks 1–2, player listings week 3 | Moderate — active AH economy | AH tax rate is still a John call. |
| **Housing deed purchase** | Low — few players ready for housing in week 1 | High — endgame players buying deeds | Large one-time sink. |
| **Housing upkeep** (speculative per-tick) | Zero — no housing week 1 | Low–Moderate — daily/weekly upkeep cost | Ongoing sink for homeowners. |
| **Fast travel** (speculative) | Zero — one hub, no need for fast travel | Low — between hubs if multiple zones exist | May be free in v1 (John's call from prior dump). |
| **Salvage Kit purchase** | Low — free starter kit, don't need extras yet | Low — mostly repair at vendor hub | Minor sink. |
| **Profession materials** (miller, lantern) | Low — quest-granted materials early on | Moderate — crafting consumes materials and gold | Crafting sink grows with progression. |

### LLM Never Mints Gold, Never Revives

```
Restated:
1. The LLM NEVER grants gold. Gold is minted ONLY by code (quest rewards, vendor sales, loot drops, dungeon/raid bonuses).
2. The LLM NEVER revives a downed player. Revive is a code-owned action (healer/support class ability).
3. The LLM may narrate "Ren pours warmth into your chest — you gasp and rise" but the HP restoration happened in code BEFORE the LLM wrote that line.
4. The LLM may narrate "the elder pays you for your service" but the gold is already in the wallet because CODE granted it.
```

---

## 5) Family / Kid Mode — Who Pays for LLM

### Goal

Define how a parent account, child characters, and shared turn pools work. Kid Mode stays: no IAP, mature worlds locked, slurs masked.

### Recommendation: Child Gets Capped Free Turns, Parent Can Share

```typescript
interface FamilyPlan {
  ownerAccountId: string;                   // parent's account
  memberIds: string[];                      // child account IDs (Kid Mode = true)
  sharedTurnPool: SharedTurnPool | null;    // null if parent doesn't share
  kidModeFlags: KidModeFlags;
}

interface SharedTurnPool {
  enabled: boolean;
  parentDailyTurns: number;                 // parent's sub cap (50 or unlimited)
  childDailyTurns: number;                  // per-child cap drawn from parent's pool
  // Rules:
  // 1. If enabled, each child draws turns from the parent's pool (up to childDailyTurns).
  // 2. If the parent has 50 turns/day and sets childDailyTurns = 10,
  //    the child can use up to 10 turns/day, drawn from the parent's 50.
  //    The parent has 40 remaining.
  // 3. If not enabled (null), the child gets CAPPED FREE TURNS only.
  // 4. Capped free turns: 10/day (less than adult free tier of 15).
  //    Rationale: Kid Mode is a safe sandbox. 10 turns is one short session.
  //    It's enough to explore a hub, do a few quests, and log off.
  //    It's NOT enough to solo a full 5-man (12–18 rounds), which is intentional:
  //    parents decide whether to share turns for longer play sessions.
}

interface KidModeFlags {
  noIAP: true;                              // locked — no in-app purchases
  noAds: true;                              // locked — no advertisements
  matureWorldsLocked: true;                 // locked — Halo Term, Veil Watch, Hollow Term, Blackwake hidden
  slursMasked: true;                        // locked — offensive language replaced
  funSwearSwap: boolean;                    // configurable by parent
  friendsOnlyChat: boolean;                 // configurable by parent (recommend ON)
  pinRequired: boolean;                     // PIN to exit Kid Mode (locked — always true)
  maxDailyMinutes: number | null;           // optional parent-set time limit (speculative)
}
```

### Why Not Text-Only / Cheap Model for Kids?

```
Considered: Kid Mode uses no LLM (pure code-generated text) or a smaller/cheaper model.

Rejected for v1:
1. The LLM is what makes the story unique. Code-only text would be canned / repetitive.
   Kid Mode should feel like the same game, just safer — not a worse game.
2. A cheaper model produces worse prose. Kids deserve good writing too.
   If anything, kids need BETTER writing (clearer, more engaging, less confusing).
3. Two model tiers create a maintenance burden (two prompt templates, two QA paths).
4. The cost is manageable: 10 turns/day × ~500 tokens/turn = ~5,000 tokens/day per child.
   At current rates (~$0.001–0.003 per 1K tokens, speculative), that's $0.005–0.015/day.
   The parent's subscription covers this easily.

Recommendation: Kid Mode uses the SAME model and SAME prose quality. The only differences
are content filtering (slur mask, violence level, mature world lock) and turn cap.
```

### What the Parent Controls

```
Parent dashboard (in parent account settings):
  - Add/remove child accounts
  - Set childDailyTurns (or leave at capped free 10)
  - Enable/disable sharedTurnPool
  - Set maxDailyMinutes (optional time limit)
  - Toggle funSwearSwap on/off
  - Toggle friendsOnlyChat on/off
  - View child's play history (what worlds, how many turns, who they played with)
  - Child CANNOT: purchase anything, access mature worlds, change Kid Mode settings,
    remove the PIN, or see the parent dashboard.
```

---

## 6) Week 2, Zero Friends

### Goal

A solo player in week 2 has done the tutorial, explored Reedfen, maybe solo'd Lampwood Gate. They have no friends on the platform. How do they keep playing without public LFG (which doesn't exist in v1)?

### v1 Retention Without Public LFG

```
1. DAILY SOLO LOOP (8–12 turns):
   - Daily quest tick: one new quest per day (code-generated from the quest DAG).
     Example: "Elder Mara asks you to check the marsh edge" or "Miller Tobin needs grain."
   - Hub beat: talk to NPCs, check AH (if open), salvage, craft.
   - Short combat: one encounter in the marsh or mill (2–4 rounds).
   - Session: 15–20 minutes. Satisfying. Complete in one sitting.

2. SOLO-ABLE FIRST 5-MAN (stays):
   - Lampwood Gate is solo-able with reduced mobs/boss HP.
   - Solo run: 12–18 rounds, 45 minutes. The main weekly content for a solo player.
   - Repeatable: loot drops on first clear, reduced loot on subsequent clears (weekly reset).

3. NPC PARTIES: RECOMMEND NO for v1.
   - NPC party members (AI-controlled allies in your instance) add complexity:
     turn order, targeting, HP tracking, death/revive for NPCs.
   - They also muddy the MMO identity ("Is this a single-player game?").
   - v2 (speculative): NPC hirelings for solo dungeon runs.

4. DUTY NPC FILLERS: RECOMMEND NO for v1.
   - Duty NPCs (code-controlled fillers in a party slot) have the same problems as NPC parties.
   - They also create a false sense of multiplayer (the "other player" is a bot).
   - v2 (speculative): duty NPC filler for 5-man if queue time > 5 minutes.

5. "ASK A FRIEND LATER" MAIL: RECOMMEND YES.
   - After the player solo-clears Lampwood Gate, the journal suggests:
     "You've proven yourself alone. With allies, the Lampwood holds deeper secrets.
      Invite a friend to explore together."
   - A [Share Invite Link] button generates a referral link (code-owned).
     The link sends the friend to the app store / web client with a pre-filled friend request.
   - This is the primary v1 acquisition channel: existing players invite real friends.

6. COLLECTION / EXPLORATION LOOP:
   - The collection log (species seen/caught, items found, quests completed) provides
     solo goals beyond combat. "Find all 16 Reedfen species." "Complete the miller chain."
   - This is the Fallen London / KoL model: short daily sessions, collection-driven,
     no mandatory multiplayer.

7. AH PARTICIPATION:
   - Even solo players participate in the economy by selling loot on the AH (after week 2–3).
   - Browsing and buying is social in effect (other players' listings), even without direct interaction.
```

### v2 Public LFG Sketch (Design Only — Not Built)

```typescript
interface LfgListingV2 {
  listingId: string;
  creatorId: string;
  instanceType: "5man" | "raid";
  instanceId: string;                       // which dungeon/raid
  roleSlotsOpen: RoleSlot[];
  createdAt: number;
  expiresAt: number;                        // auto-expire after 30 min (speculative)
  messagePreview: string | null;            // optional short note ("chill run, learning boss")
  // Rules:
  // 1. NO global chat. LFG is a listing board, not a chat channel.
  // 2. Listings are visible in the instance's zone only (Reedfen LFG shows in Reedfen, not globally).
  // 3. Players browse listings and tap [Join]. No real-time chat in the listing.
  // 4. Friends-first: friends' listings appear at the top, highlighted.
  // 5. Role tags: tank, healer, DPS, support. Listing shows which slots are open.
  // 6. No rating/review of other players. No karma score. No toxicity vector.
  // 7. Reporting: same report flow as chat (report button on the listing).
}

interface RoleSlot {
  role: "tank" | "healer" | "dps" | "support";
  filled: boolean;
  playerId: string | null;
}
```

---

## 7) Live Ops Humans Can Staff

### Goal

Define what live-ops incidents look like, who handles them, what tools they need, and SLAs. Plus: how to test "Reedfen never says Stormwind" after an LLM model swap.

### Incident Table

| # | Incident | Who Handles | Tool | SLA (Speculative) |
|---|---------|-------------|------|-------------------|
| 1 | **Disable quest ID** (broken quest, impossible objective) | Ops engineer | Admin panel: quest toggle (disable quest by ID, affects all players) | 1 hour to disable; fix in next patch |
| 2 | **Hotfix catalog row** (species with wrong HP, item with wrong stats) | Ops engineer | Admin panel: catalog editor (edit species/item template, live reload) | 2 hours |
| 3 | **Add ban-list name after model swap** (new LLM generates "Stormwind" for Reedfen) | Content QA + ops | Admin panel: ban-list editor + post-filter rule. Add banned name → filter rejects prose containing it. | 4 hours to detect, 1 hour to patch filter |
| 4 | **Chat report** (hate speech, harassment, sexual content) | Moderation team (human) | Moderation queue: view reported message, reporter's note, reported player's recent chat, context. Actions: warn, mute (1h/24h/7d/permanent), ban. | 24 hours for standard; 4 hours for sexual content toward minors |
| 5 | **Gold rollback** (player received duplicated gold from a bug) | Ops engineer | Admin panel: wallet editor. View player's gold transaction log. Roll back specific transactions. | 8 hours |
| 6 | **Refund DLC** (player wants refund for world DLC) | Support agent | Billing dashboard (Stripe/Apple/Google). Process refund. Revoke WorldUnlock entitlement. Keep ThemeKit (already granted, permanent). | 48 hours |
| 7 | **Mute player** (spam, repeated minor offenses) | Moderation team | Moderation queue: mute action (1h/24h/7d). Player can still play; cannot send tells or hub say. | 4 hours |
| 8 | **Licensed-name incident** (player named "Legolas," slipped past filter) | Support agent + ops | Admin panel: force rename. Player's name is changed to "Adventurer_[random]." Player is notified: "Your name was changed because it conflicts with a protected name." | 24 hours |
| 9 | **Exploit: gold dupe** (players found a way to duplicate gold) | Ops engineer | Admin panel: disable the exploit vector (e.g., disable the quest/AH interaction). Gold rollback for affected accounts. Hotfix. | 2 hours to disable; 24 hours for rollback; patch in next maintenance |
| 10 | **Server outage** (instance workers down) | Infra engineer | Monitoring dashboard (uptime, error rates, instance health). Restart workers. Player-facing: "The world is resting. Your progress is saved. We'll be back shortly." | 30 min to detect; 1 hour to resolve |
| 11 | **AH price manipulation** (player lists 1000 items at 1 gold to crash the market) | Ops engineer | Admin panel: AH listing tools. Bulk-delist by player ID. Rate limit listings per player (already speculative). | 8 hours |
| 12 | **World-pack content error** (quest text references wrong NPC or location) | Content QA | World-pack editor: edit quest text, NPC dialogue, place description. Live reload. | 24 hours (non-critical) |

### LLM Model Swap Eval: "Reedfen Never Says Stormwind"

```
When the LLM model is swapped (new version, different provider, fine-tune update),
the following eval checklist runs BEFORE the new model goes live:

EVAL CHECKLIST (automated CI + human spot-check):

1. BAN-LIST PROBE (automated):
   - Run 50 prompts that mention Reedfen, Ash Compact, Lampwood Gate, Millstone Hollow.
   - Check: no banned names in output (Stormwind, Hogwarts, Mordor, etc. — 40+ names).
   - Threshold: 0 violations in 50 runs = pass. Any violation = block deployment.

2. PLACE-NAME FIDELITY (automated):
   - Run 20 prompts with PLACE_NAME: Reedfen token.
   - Check: output contains "Reedfen" (or synonym) within the first 3 sentences.
   - Threshold: 18/20 = pass. < 18 = review.

3. LEDGER RESPECT (automated):
   - Run 10 combat prompts with outcome token = MISS.
   - Check: output does NOT contain "you hit," "they die," "damage dealt," or HP numbers.
   - Threshold: 10/10 = pass. Any violation = block.

4. CHROME LEAK (automated):
   - Run 5 D&D-mode prompts + 5 RPG-mode prompts (if SGM-relevant eval reused).
   - Check: D&D output contains no "System," "Integration," "Wave."
   - Check: RPG output contains no "System," no dice notation (unless opt-in).
   - Threshold: 10/10 = pass.

5. WORD BUDGET (automated):
   - Run 20 combat round prompts.
   - Check: output is 2–6 sentences, 40–120 words.
   - Threshold: 18/20 within range = pass.

6. HUMAN SPOT-CHECK (manual, 1 person, 30 minutes):
   - Play through the first 5 tutorial beats with the new model.
   - Play one combat encounter (3–5 rounds).
   - Read the prose. Does it feel right? Is the tone consistent?
   - Flag any: wrong era, wrong setting, wrong character, wrong weapon, canned prose.

Eval owner: John's call (#10). Recommendation: automated CI runs on every model swap.
Human spot-check on major version changes (new model family, not minor updates).
```

### World-Pack Versioning: Live Players + Patched Quest

```
Scenario: Quest "The Hearthborn's Request" is patched (objective changed from
  "kill 3 hatchlings" to "kill 5 hatchlings"). Players are mid-quest.

Policy: GRANDFATHER active quests. MIGRATE new quests.

1. If a player has already accepted the quest and is at "kill 3 hatchlings (2/3),"
   they complete it under the OLD objective (3 hatchlings).
2. If a player has NOT accepted the quest yet, they get the NEW objective (5 hatchlings).
3. The quest DAG stores a versionId. The player's QuestState stores the versionId
   they accepted under. Code resolves against the accepted version.
4. This is the FFXIV approach: don't break mid-quest players.
5. If a quest is DISABLED (broken, not just patched), mid-quest players see:
   "This quest has been temporarily suspended. Your progress is saved."
   They can resume when the quest is re-enabled.
```

---

## 8) Push / Mail / Return Hooks

### Goal

Wire MailDigest to notify players of important events. Define push vs in-app mail. Kid Mode rules. Quiet hours. What must NEVER notify.

### MailDigest Wiring

```typescript
interface MailDigest {
  playerId: string;
  entries: MailEntry[];
  deliveredAt: number | null;
}

interface MailEntry {
  entryId: string;
  type: MailEntryType;
  timestamp: number;
  read: boolean;
  payload: Record<string, unknown>;         // type-specific data
}

type MailEntryType =
  | "ah_sold"                               // "Your Reedfen Scale sold for 50 gold."
  | "ah_expired"                            // "Your listing for Marsh Grain expired."
  | "farm_tick"                             // "Your rowanberries are ready to harvest." (Hearth Season)
  | "cozy_tick"                             // "Your comfort level has dropped. Visit your cottage." (Hearth Season)
  | "party_invite"                          // "Ren invited you to a party."
  | "raid_lockout_reset"                    // "Your Millstone Hollow lockout resets tomorrow."
  | "friend_online"                         // "Your friend Ren is online." (optional — off by default)
  | "quest_update"                          // "New quest available: Warmth in the Marsh."
  | "housing_guest"                         // "Ren visited your house." (friends-only)
  | "mail_from_player"                      // "You received a message from Ren." (tell stored as mail if offline)
  | "system_announcement"                   // "Maintenance scheduled: Tue 00:00 UTC."
```

### Push vs In-App Mail

| Event | Push Notification | In-App Mail | Both |
|-------|------------------|-------------|------|
| **AH sold** | Yes (opt-in) | Yes (always) | Player chooses |
| **AH expired** | No | Yes | — |
| **Farm/cozy tick** | Yes (opt-in) | Yes | Player chooses |
| **Party invite** | Yes (if app backgrounded) | Yes | — |
| **Raid lockout reset** | Yes (opt-in, day before) | Yes | Player chooses |
| **Friend online** | No (default OFF) | No (presence list is live) | Optional: push if enabled |
| **Quest update** | No | Yes | — |
| **Housing guest** | No | Yes | — |
| **Mail from player** | Yes (if app backgrounded) | Yes | — |
| **System announcement** | Yes (mandatory — maintenance, outage) | Yes | Always |

### Kid Mode Push Rules

```
Kid Mode pushes:
  - NO "come back and spend" copy. Never.
  - NO IAP references in push notifications. Never.
  - NO urgency/FOMO language ("Your farm is DYING! Come back NOW!").
  - Allowed: "Your rowanberries are ready." (neutral, informational).
  - Allowed: "Your friend Ren is playing." (social, if friendsOnlyChat is on).
  - NOT allowed: "You're missing out on limited-time rewards!"
  - NOT allowed: any push that links to a purchase flow.
  - Kid Mode pushes respect the parent's quiet hours setting.
```

### Quiet Hours

```typescript
interface QuietHoursConfig {
  enabled: boolean;
  startHour: number;                        // 0–23 (player's local time)
  endHour: number;                          // 0–23
  // Default: enabled, 22:00–08:00 (10 PM to 8 AM local).
  // During quiet hours:
  //   - No push notifications (queued, delivered when quiet hours end).
  //   - In-app mail still accumulates (visible on next login).
  //   - System announcements (maintenance) OVERRIDE quiet hours
  //     if the maintenance is within 1 hour (urgent).
  // Kid Mode: quiet hours are ALWAYS enabled. Parent sets the hours.
  //   Default for Kid Mode: 20:00–08:00 (8 PM to 8 AM).
}
```

### What Must NEVER Notify

```
NEVER send a push notification for:
1. Other people's combat rounds. ("Ren hit a hatchling for 6 damage!")
2. Other people's loot drops. ("Mira found a Rare Sword!")
3. AH purchases by others. ("Someone bought a Reedfen Scale.")
4. Presence changes of non-friends. ("A stranger entered Reedfen Square.")
5. LLM-generated content. (Push text is always code-authored, never LLM prose.)
6. IAP prompts (in Kid Mode). Never.
7. Combat results while the player is in combat. (Don't interrupt active play.)
```

---

## Short Sections

### Disconnect Replace in 10-Man

See Section 3 for full detail. Summary:
- **v1: No mid-combat fill.** DC'd player follows last plan (or Defend). Party continues.
- **Between encounters (checkpoint):** DC'd player can rejoin. If they don't rejoin within 5 minutes (speculative), party leader CAN invite a replacement from the lobby. The replacement starts at the checkpoint with full HP.
- **v2 (speculative):** mid-combat fill from a queue. Not in v1.

### Theme Kit Music / SFX

```
Recommendation: Include 1 ambient loop with the Theme Kit. Extra music/SFX are shop items.

Included with Theme Kit:
  - 1 ambient loop (30–60 seconds, looping). Plays in the hub.
    Ash Compact: hearth fire crackle + distant wind.
    Bonded Menagerie: marsh sounds + creature calls.
    Hearth Season: birdsong + gentle breeze.
    Circuit Arc: crowd murmur + distant arena horns.
  - 1 combat SFX set: hit, miss, crit, block, ability (5 sounds).
  - 1 UI SFX set: button tap, menu open, menu close, notification (4 sounds).

Extra shop items (à la carte, speculative $1.99–$3.99 each):
  - Additional ambient loops (night variant, rain variant, festival variant).
  - Additional combat SFX packs (themed per world — "Marsh Sounds," "Arena Clash").
  - Music tracks (authored songs/scores — not AI-generated, to avoid quality issues).
```

### Accessibility

```
Screen reader support:
  1. Screen reader reads System recap (HP, damage, round result) as structured text.
     Not just "HP bar 68%" but "Your hit points: 14 out of 20."
  2. Screen reader reads prose (story text) in full.
  3. Screen reader announces choices: "Choice 1 of 4: Strike. Button."
  4. Screen reader announces ally status in raid: "Ren, Healer, HP 82%, status OK."
  5. Combat round results read in order: your action, then enemy action, then recap.

Chrome contrast:
  1. All text meets WCAG AA contrast ratio (4.5:1 for body, 3:1 for large text).
  2. HP bars: green (> 50%), yellow (30–50%), red (< 30%) — all on dark background
     for contrast. Also labeled with percentage number (not color-only).
  3. Status flags (OK, SOAK, LOW, DOWN, DC) are text labels, not color-only icons.
  4. Reduce-motion: dice tray shows result immediately (no animation).
     Panel transitions are instant. No parallax.
```

### English-Only v1

```
Recommendation: YES — English only for v1.

Rationale:
1. LLM prose quality is highest in English. Non-English generation is inconsistent
   (mixed languages, wrong grammar, cultural tone mismatches).
2. Content QA (ban-list, place-name fidelity, ledger respect) is built for English.
   Localizing the eval checklist to 5+ languages multiplies QA effort.
3. Moderation tools (slur filter, chat filter) are English-first. Non-English slurs
   require per-language filter dictionaries.
4. UI chrome (System recap, choices, journal) would need full translation.
5. v2 (speculative): add 2–3 languages (Spanish, Portuguese, Japanese — largest markets
   for text games). Requires: localized UI, per-language eval, per-language moderation.
```

### Tech Topology (20 Lines Max)

```
Client (phone/web) → API Gateway (auth, rate limit, turn accounting)
  ↓
Gateway → Hub Service (presence, chat, AH, housing — code only, 0 LLM)
  ↓
Gateway → Instance Worker (combat, quest, dungeon/raid — code owns ledger)
  ↓
Instance Worker → LLM Queue (narration request: outcome token + scene token + memory)
  ↓
LLM Queue → LLM Provider (writer call — 1 per player per round)
  ↓
LLM Provider → Instance Worker (prose response — warden validates, strips banned names)
  ↓
Instance Worker → Client (prose + system recap + choices)

If writer is slow:
  Instance Worker resolves the round immediately (code math is instant).
  Client receives: system recap + choices NOW. Prose arrives as "late prose"
  (bound to roundId, does not rewrite HP). Player can act on the next round
  without waiting for prose. Prose catches up.

Authoritative server: ALL state lives on Instance Worker / Hub Service.
Client is a thin renderer. No ledger data on the client. No client-side dice.
```

---

## 9) Failure Modes (Max 12)

| # | Failure Mode | How It Happens | Prevention |
|---|-------------|---------------|-----------|
| 1 | **Free raid starvation** | Free-tier player (15 turns) tries to raid (40–60 rounds). Runs out of turns at phase 1. Frustrated, quits. | Raid requires Mid+. Clear messaging: "Raids require a subscription. Solo dungeons are free." Gate at the raid lobby, not mid-fight. |
| 2 | **Mode A bankrupts host** | Mode A (personalized narration) costs 1 turn per player per round. In a 10-player raid, one player's turns run out before the raid ends — but it's per-player, so this only affects THEM. However, if MOST of the raid runs out, the raid stalls. | Per-player budget means no single host pays. But: if 6 of 10 players are free-tier and run out, the raid stalls. Prevention: raid requires Mid+ (all 10 players have ≥50 turns). |
| 3 | **10 portraits unreadable** | Raid UI shows 10 character portraits on a phone. Each portrait is 30px wide — unreadable, untappable, useless. | No portraits in raid UI. Compact ally rows: name + role icon + HP% + status flag. One text line per ally. |
| 4 | **Live save imported** | Player tries to bring their SynapticGM character (level 20 LitRPG, full Integration kit) into Ash Compact. Stats don't map. Game breaks. | No import. No character transfer. WOF character creation is always fresh. Deep-link copy: "Your story in [SGM] is yours alone. Ash Compact is a new beginning." |
| 5 | **Kid Mode burns parent's card** | Child in Kid Mode purchases a world DLC or chrome item. Parent's card is charged. | Kid Mode: no IAP. No purchase buttons visible. No ads. All purchases go through the parent account only. Kid Mode accounts cannot trigger any billing flow. |
| 6 | **Push during raid round** | Player is mid-combat in a raid. Phone vibrates with a push notification: "Your rowanberries are ready!" Player is distracted, misses their soak window, raid wipes. | Never push during active combat. Turn accounting knows the player is in an instance. While `isInCombat: true`, suppress all non-system pushes. System announcements (urgent maintenance) are the only exception. |
| 7 | **Gold rollback missing** | A gold dupe exploit is discovered. Ops needs to roll back gold for 50 accounts. But there's no transaction log — gold was just a number in the wallet, not a ledger. | Gold wallet stores a transaction log (TurnSpendEntry-like). Each gold change has: amount, source (quest/vendor/AH/dungeon), timestamp, transactionId. Rollback targets specific transactions. |
| 8 | **"Stormwind" after model swap** | The LLM provider updates their model. The new model generates "Stormwind" when prompted with "Reedfen." The post-filter catches it — but only if the ban-list is up to date. If the new model invents a NEW licensed name not on the ban-list, it slips through. | Eval checklist (Section 7): ban-list probe runs 50 prompts on every model swap. Human spot-check for novel names. Ban-list is reviewed and expanded after every model change. |
| 9 | **Shared turn pool drained by child** | Parent shares 50 turns/day with two kids. Kids play 25 turns each. Parent logs in — 0 turns left. Parent can't play. | SharedTurnPool has childDailyTurns cap. Parent sets a per-child limit. Default: 10 per child. Parent always keeps at least (cap - sum of childDailyTurns) turns reserved. UI shows remaining turns. |
| 10 | **Week-2 solo player churns** | Player has no friends on the platform. First 5-man was fun solo, but there's nothing new. No LFG, no matchmaking, no NPC parties. Player uninstalls. | Daily solo loop (8–12 turns): daily quest, collection hunting, AH browsing. "Ask a friend" mail with share link. Solo-able 5-man repeatable weekly. Long-term: v2 public LFG. |
| 11 | **Quiet hours block urgent maintenance** | Scheduled maintenance at 23:00 UTC. Player has quiet hours 22:00–08:00. They don't see the announcement. They try to play during maintenance — error screen, no explanation. | System announcements override quiet hours if maintenance is within 1 hour. Urgent maintenance pushes ALWAYS deliver. |
| 12 | **World-pack patch breaks mid-quest** | Quest objective changes from "kill 3" to "kill 5" while player is at 2/3. After patch, their progress shows 2/5. They need 3 more kills, not 1. | Grandfather active quests. Player completes under the version they accepted. New players get the patched version. Quest stores versionId. |

---

## 10) John's Calls (Max 10)

| # | Call | Options | Recommendation | Rationale |
|---|------|---------|---------------|----------|
| 1 | **Turn cost per lockstep round** | 1 turn per player per round / 0.5 turns / shared cost | **1 turn per player per round (Mode A). 0.5 turns per player (Mode C).** | Mode A = personalized prose = full LLM call per player. Mode C = shared prose = half cost. The engine supports both. John picks the raid narration mode, and the turn cost follows. |
| 2 | **Can free-tier finish a party 5-man?** | Yes (budget is enough) / No (requires Mid+) | **Tight — solo yes, party probably not in one session.** | Solo 5-man is 12–18 rounds (fits in 15 turns). Party 5-man is 15–25 rounds (may exceed 15). Free players can solo the first 5-man. Party 5-mans may take 2 sessions on free. John decides if this is acceptable or if free should get 20 turns. |
| 3 | **Is raid Mid+ only?** | Raid open to all tiers / Raid requires Mid+ | **Raid requires Mid+.** | Free (15 turns) cannot finish a raid under any narration mode. Gating at the lobby is clear and fair. Raiding is endgame content for subscribers. |
| 4 | **WOF: separate app, world picker in SGM, or account-linked two clients?** | Same app / Separate app / Account-linked | **Account-linked, two clients.** | Clear product identity. Shared account, shared friend list. Separate chrome shops. Deep links for cross-promotion. No Isekai Gate in SGM. |
| 5 | **Mid-combat fill after disconnect?** | Allow fill / No fill (DC follows last plan) | **No mid-combat fill v1.** | Complexity, lockout conflicts, slot-stealing risk. DC'd player follows last plan. Fill from checkpoint only (between encounters). v2: queue-based fill. |
| 6 | **Family shared turn pool or child gets capped free?** | Shared pool / Capped free only / Both options | **Both: capped free (10/day default) + optional shared pool.** | Capped free is the safe default. Shared pool is opt-in for parents who want kids to play longer. Parent always controls the cap. |
| 7 | **Push on/off default** | All pushes on / Essential only / All off | **Essential only (party invite, system announcements). Others opt-in.** | Respect the player's attention. Don't train them to disable all pushes. |
| 8 | **Music loop in Theme Kit?** | 1 loop included / All music is shop extra | **1 ambient loop + combat SFX + UI SFX included.** | The Theme Kit should feel complete. A silent world feels unfinished. Extra loops/music are shop items. |
| 9 | **English only v1?** | English only / English + 2–3 languages | **English only.** | LLM prose quality, QA coverage, moderation tools, and eval checklist are all English-first. Localization is v2. |
| 10 | **Eval owner: code CI or human?** | Fully automated CI / Human QA team / Hybrid | **Hybrid: automated CI for ban-list probe, place-name fidelity, ledger respect, chrome leak, word budget. Human spot-check for major model swaps.** | CI catches regressions fast. Humans catch subtle tone/quality issues CI can't. Minor model updates: CI only. Major version changes: CI + 30-minute human playthrough. |

---

## Sources

| Source | URL | Date Accessed | What Was Used |
|--------|-----|--------------|---------------|
| FFXIV subscription + expansion model | https://na.finalfantasyxiv.com/ | Aug 15, 2026 | Raid requires sub, expansion is content, free trial generous but limited |
| WoW raid lockout system | https://worldofwarcraft.blizzard.com/ | Aug 15, 2026 | Weekly per-boss lockout, instance-based progression |
| Fallen London daily action model | https://www.failbettergames.com/ | Aug 15, 2026 | Daily turn cap, solo retention, collection-driven |
| Kingdom of Loathing turn system | https://kol.coldfront.net/thekolwiki/ | Aug 15, 2026 | Daily adventures (turns), rollover, clan cooperation |
| Discord notification patterns | https://discord.com/ | Aug 15, 2026 | Quiet hours, notification categories, DM vs server distinction |
| Apple Human Interface Guidelines (notifications) | https://developer.apple.com/design/human-interface-guidelines/notifications | Aug 15, 2026 | Push notification best practices, quiet hours, child safety |
| WCAG 2.1 AA guidelines | https://www.w3.org/WAI/standards-guidelines/wcag/ | Aug 15, 2026 | Contrast ratios, screen reader requirements, reduce-motion |
| COPPA (Children's Online Privacy Protection) | https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa | Aug 15, 2026 | Parental consent for minors, no IAP without consent, data collection limits |
| Mobile MMO raid UIs (FFXIV Companion, WoW Remote) | Various app stores | Aug 15, 2026 | Compact raid frame patterns, list vs portrait, text-based raid status |
| Existing project file: WOF_PlayableStart_Dump.md | (project file) | Aug 15, 2026 | First hour, quest DAGs, combat feel, social/safety, economy |
| Existing project file: WOF_ThemedMMO_Commerce_Dump.md | (project file) | Aug 15, 2026 | Plan matrix, Theme Kits, entitlements schema, module maths |
| Existing project file: WOF_Multiplayer_Design_Dump.md | (project file) | Aug 15, 2026 | EncounterLedger, lockstep rounds, raid, join/loot/wipe |
| Existing project file: WOF_Gap_Fill_Dump.md | (project file) | Aug 15, 2026 | AH/escrow, deeds, tick model, MailDigest, memory stores |
| Existing project file: WOF_GoLive_Systems_Dump.md | (project file) | Aug 15, 2026 | Module extensions, catalogs, world-pack validator, go-live checklist |
| Existing project file: docs/research/pack-09-monetization-cosmetics-audio-iap-2026-08.md | (project file) | Aug 15, 2026 | SynapticGM pricing, cosmetic SKUs, Kid Mode rules |

---

## Speculation Markers

1. **Mode C turn cost 0.5 per player per round** — speculative. Depends on shared-call token cost.
2. **Combat round token budgets (400–800 Mode A, 800–1200 Mode C)** — speculative.
3. **Free-tier 15 turns/day** — carried from prior dump, still speculative.
4. **Repair cost per durability point (0.5–3 gold by tier)** — speculative.
5. **Kid Mode capped free turns: 10/day** — speculative.
6. **LFG listing expiry: 30 minutes** — speculative.
7. **Disconnect rejoin window: 5 minutes** — speculative.
8. **SLA times (1h, 4h, 8h, 24h, 48h)** — speculative. Depends on team size.
9. **Eval checklist threshold: 50 ban-list probes, 20 place-name probes** — speculative.
10. **Quiet hours default: 22:00–08:00** — speculative.
11. **Kid Mode quiet hours default: 20:00–08:00** — speculative.
12. **Push suppression during combat** — speculative (may need per-event granularity).
13. **Theme Kit ambient loop: 30–60 seconds** — speculative.
14. **Gold transaction log for rollback** — speculative implementation detail.
15. **Grandfather policy for mid-quest patches** — speculative. Could require player consent.

---

**End of Remaining Holes Dump. Combined with prior dumps (Multiplayer Design, Gap Fill, Go-Live Systems, Playable Start, Themed MMO Commerce, Visual & Tabletop), this closes the open design holes for WOF's turn accounting, product split, raid-on-phone UI, death/repair/gold sinks, family/Kid Mode billing, week-2 retention, live-ops staffing, push/mail hooks, failure modes, and remaining John's calls.**
