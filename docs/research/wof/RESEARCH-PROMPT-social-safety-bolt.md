# WOF — bolt.new social + safety prompt

Paste into bolt.new. Download **`WOF_SocialSafety_Dump.md`**. Drop it in this chat or `docs/research/wof/pasted/`.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO. NOT live SynapticGM. No production code. Original names only in WOF examples. You MAY name real games as sources.

FILE OUTPUT
1. One file: WOF_SocialSafety_Dump.md
2. Tell the user to download it from the bolt.new file tree.

LOCKED
- Friends-first finder. Hub NPCs durable. Strangers never merge fights.
- Housing guests friends-only v1. Chat exists. Per-player LLM budget.
- Kid Mode: no IAP/ads; slurs masked; fun swear swap + PIN.
- Never sell combat outcomes. Authoritative server.
- Text is uniquely abusable (names, tells, housing, AH scam). Design for that.

ALREADY DONE
Combat instances, AH escrow (anti-scam start), personal loot.

FILL

## 1) Social graph v1
Objects: Account, Character, FriendEdge, Ignore/Block, Party, (Guild later).
What v1 MUST have vs v2 (guilds, officer chat, events calendar).
Copy jobs from Discord, WoW friends, FFXIV, MUDs, F&F parties — not their brands.

## 2) Chat channels
Hub say / party / tell / (guild later).
Rate limits. Link rules. Licensed-name filter on character names AND chat? (recommend).
Proximity vs global. Why global general chat destroys new text MMOs (cite MUDs / early WoW / Discord-attached games).

## 3) Grief vectors + mitigations
Table: vector | where | v1 mitigation | never allow.
Must include: kill-steal (N/A if instances), AH scam (escrow already), name impersonation, spam, hate speech, sexual content toward minors, housing trolling, lure-out-of-instance, LLM-jailbreak via player chat injected into GM prompt.

CRITICAL: player chat must NEVER be raw-injected into the GM prompt. Schema for sanitized “nearby speech” (max N chars, filtered).

## 4) Reporting + moderation
Report reasons. Evidence snapshot (chat log window). Human vs auto.
Kid Mode extra: stricter, no public global, friends-only chat option.

## 5) Guilds (v2 schema only)
Guild, rank, motd, bank (careful: item duplication). Recommend NO guild bank at v1.
Recruitment without a toxic global chat.

## 6) Presence
Who is in Millcross: friends only vs everyone in shard. Cap the list.
Idle hub = 0 LLM unless that player acts (already locked) — how presence list works without waking LLM.

## 7) Romance / school skins
bond_heart routes: consent, block, no NSFW default, age-gate. Public design from dating sims / school games as PATTERNS only. No licensed academies.

## 8) John's calls (max 8)
Global chat v1 yes/no; friends-only hub presence vs public; guilds at F&F vs later; report SLA (not a legal promise — product intent).

RULES
- TypeScript-like interfaces.
- Mark speculation.
- Do not write exploit PoCs. Describe harms at product level only.
- Do not change live SynapticGM.
```
