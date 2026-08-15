# WOF — bolt.new remaining-holes prompt

Paste the fenced block into bolt.new. Download **`WOF_RemainingHoles_Dump.md`**. Drop that file in this chat.

Do not re-run gap-fill, go-live, playable-start, or commerce.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO platform. NOT live SynapticGM. No production code.

IP: genre PATTERNS only. No licensed settings as WOF content. You MAY name real games as SOURCES (FFXIV, WoW, Fallen London, KoL, MUDs, Hidden Door, F&F, NovelAI, Discord, mobile MMOs, Steam).

FILE OUTPUT (mandatory)
1. Create ONE new file at project root: WOF_RemainingHoles_Dump.md
2. Put the ENTIRE dump in that file, not only in chat.
3. Tell the user: "Download WOF_RemainingHoles_Dump.md from the bolt.new file tree."
4. Do not split files.

LOCKED (do not contradict)
- Code owns dice, HP, catalogs, quests, loot, gold, lockouts. LLM narrates only.
- Tier 3 hubs + instanced combat. Strangers never merge fights. Idle hub = 0 LLM unless that player acts.
- Lockstep rounds, not twitch. manual OR plan-auto. Raid size 10, weekly per-character per-boss lockout. Finder friends-first. Personal loot v1. Wipe → checkpoint.
- Dungeon narration Mode A. Raid narration later (Mode C vs A is still a John call — DESIGN TURN COST AROUND BOTH).
- AH buyout+escrow. Housing deeds v1. Personal merchant deals. Authoritative server. Per-player LLM budget (NOT host-pays).
- Never sell outcomes, lockout skips, loot luck, or random POWER packs.
- Story first, then System. Chat NEVER raw-injected into the GM prompt.
- Kid Mode: no IAP/ads; slurs masked; mature worlds locked.
- Product split: A capacity sub / B world DLC / C chrome. Ash Compact included; extra worlds buy-and-own; Theme Kit included with world.
- Dump picks (speculative, may argue): Free 15 turns/day, Mid $9.99 / 50 turns, High $19.99 unlimited-capped; 5-man ~15–25 rounds; raid night ~40–60 rounds; sessions 15/45/90/90–120 min.
- Name freeze: Circuit Arc = shonen; Starwake = space (ship_board); Stage Light = idol; Lanceyard = mecha (frame_heat); Halo Term = powers school; Hollow Term = magic school; Route Lantern = romance (bond_heart); Veil Watch = horror. Tide Covenant is a FACTION not a race. Races: Hearthborn, Lanternfolk, Saltkin, Stonevein.
- PvP = OUT for v1. No new skins. No new AH schemas. No 25-man. No UGC store.

ALREADY DONE — ≤12 lines, then DO NOT redo
EncounterLedger, BattlePlan, Millstone Hollow 3-phase, memory stores, catalogs, Reedfen first hour + Lampwood Gate, Theme Kits, entitlements sketch, 5-man phone chrome, MailDigest schema exists (wire it).

FILL THESE HOLES ONLY

## 1) Turn accounting vs group combat (biggest)
Define TurnSpend: what spends a turn (hub beat, tell, lockstep round, Mode A prose, Mode C chrome, plan-auto, idle presence = 0).
Does one lockstep round cost 1 turn per player, 1 shared turn split, or 1 turn only for the acting camera?
Table: content | rounds | turns spent FREE / MID / HIGH | can they finish in one day?
Must reconcile 15 free turns vs 5-man vs raid 10. If they cannot raid on free, SAY SO and pick: raid requires Mid+, or rounds are cheaper than hub turns, or Mode C is cheap.
Per-player LLM budget + split shared Mode A cost — numbers (speculative, mark it).
Interface: TurnLedger { accountId, dayUtc, spent, cap, reason[] }.

## 2) WOF vs live SynapticGM (product)
Recommend: separate later app vs same app with a World picker vs account-linked two clients.
Same login? Shared chrome shop? (recommend NO shared shop — already split).
Isekai Gate / Hearth Ruin must not appear inside live SynapticGM.
Store listing copy: how a player understands “solo LitRPG now” vs “text MMO later.”
What happens if they try to bring a live save into Ash Compact (recommend: never).

## 3) Raid 10 on a phone
ASCII wireframes (portrait phone):
- Raid lobby (10 names, roles, ready, lockout badge)
- During round (your action + 9 compressed ally rows, soak/interrupt flags, Stop)
- Late prose (roundId, does not rewrite HP)
- Disconnect: Hold vs last plan (already locked) — player-facing copy + what the other 9 see
- Replace/fill after disconnect: yes/no v1 (recommend no mid-combat fill)
Thumb rules: Send/Stop never moves. Min 44pt. 10 full portraits = forbidden; use compact rows.
If this UI cannot work, recommend sliding raid to F&F-only or desktop-web — do not silently keep a broken v1.

## 4) Death, wipe, repair, gold sinks
Wipe (checkpoint) vs character death vs item durability.
Repair cost? Inn rest? Corpse run FORBIDDEN (checkpoint locked).
What gold sinks actually fire in week 1 vs week 8.
LLM never mints gold, never revives by prose.

## 5) Family / Kid Mode who pays LLM
Parent account, child character, shared turn pool vs child-capped free turns vs Kid Mode text-only (no LLM / cheap model — argue).
No IAP in Kid Mode stays locked. Mature worlds stay locked.
Interface: FamilyPlan { ownerAccountId, memberIds[], sharedTurnCap, kidModeFlags }.

## 6) Week 2, zero friends
Friends-first stays. Solo-able first 5-man stays as dump pick.
v1 retention without public LFG: NPC parties? Duty NPC fillers? “Ask a friend later” mail? Daily solo loop?
v2 public LFG sketch only (role tags, no global chat). Do not invent a toxic general channel.

## 7) Live ops humans can staff
Table: incident | who | tool | SLA (speculative).
Must include: disable quest id, hotfix catalog row, add ban-list name after model swap, chat report, gold rollback, refund DLC, mute, licensed-name incident.
Eval: how you test “Reedfen never says Stormwind” after an LLM bump (checklist, not a full QA org).
World-pack versioning: live players + patched quest — migrate or grandfather.

## 8) Push / mail / return hooks
Wire MailDigest to: AH sold, farm/cozy tick, party invite, raid lockout reset, friend online (optional).
Push vs in-app mail vs both. Kid Mode: no creepy “come back and spend” copy; no IAP in pushes.
Quiet hours. What must NEVER notify (other people’s combat).

ALSO SHORT (each ≤ half page)
- Disconnect replace in 10-man (see §3)
- Theme Kit music/SFX: include 1 loop with kit vs shop extra
- Accessibility: screen reader reads System recap not prose-only; chrome contrast
- English-only v1: yes/no recommend
- Tech topology 20 lines max: gateway / instance worker / LLM queue (combat resolves if writer is slow)

## 9) Failure modes (max 12)
Free raid starvation; Mode A bankrupts host (must not — per-player); 10 portraits unreadable; live save imported; Kid Mode burns parent’s card; push during raid round; gold rollback missing; Stormwind after model swap.

## 10) John's calls (max 10)
Turn cost per lockstep round; can free finish a 5-man; is raid Mid+ only; WOF separate app vs picker; mid-combat fill; family turn pool; push on/off default; music in Theme Kit; English-only; eval owner (code CI vs human).

RULES
- TypeScript-like interfaces. Tables. Mark speculation.
- Original names only in WOF examples (Reedfen, Lampwood Gate, Millstone Hollow, Ash Compact).
- Do not redesign raid size, escrow, or Theme Kits.
- Do not change live SynapticGM.
```
