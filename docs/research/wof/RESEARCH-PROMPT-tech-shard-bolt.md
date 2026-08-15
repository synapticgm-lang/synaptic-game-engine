# WOF — bolt.new tech / shard / presence prompt

Paste into bolt.new. Download **`WOF_TechShard_Dump.md`**. Drop it in this chat or `docs/research/wof/pasted/`.

---

```
You are doing architecture research for WOF (World of Fantasy), a later-release text MMO. NOT live SynapticGM. NO production code, NO exploits, NO PoCs. Patterns and product requirements only.

FILE OUTPUT
1. One file: WOF_TechShard_Dump.md
2. Tell the user to download it from the bolt.new file tree.

LOCKED
- Authoritative SERVER hosts the ledger (never host-client).
- World + chat = wall clock. Combat = lockstep rounds.
- Idle hub = 0 LLM unless that player acts.
- Per-player LLM budget. Seed never leaked to client.
- Late prose tagged with roundId; never rewrite HP.

FILL (copy jobs from Evennia, Nakama, Colyseus, Phoenix/LiveView, Discord presence, FFXIV duty, MUDs)

## 1) Process topology
Gateway / world sim / instance workers / LLM workers / catalog DB.
What dies if LLM is slow (combat must still resolve).

## 2) Presence
Hub occupancy list without waking LLM. Caps. Cross-region.

## 3) Sharding
One shard v1 vs many. Character stuck to shard? Why text MMOs usually start with one.

## 4) Clock + catch-up
Server tick job vs combat round job. Mail digest when offline (schema exists — wire it).

## 5) LLM queue
Priority: combat Mode A > hub talk > idle. Backpressure when budget hit.
Never block HP resolve on the writer.

## 6) Client
Phone-first chat UI (live SynapticGM is phone-shaped — method only). Reconnect / resume instance.

## 7) What NOT to build v1
Action-MMO movement, physics, contested overworld (Tier 4 deferred), client-hosted rooms.

## 8) John's calls (max 5)
Single shard yes; LLM provider abstract vs one vendor.

RULES
- Diagrams in mermaid OK. No code repos to clone. No live SynapticGM patches.
```
