# WOF — Monetization notes extracted from SynapticGM Pack 9

**Project:** WOF only. Do not implement into live SynapticGM.  
**Source:** Live-game pack [`../pack-09-monetization-cosmetics-audio-iap-2026-08.md`](../pack-09-monetization-cosmetics-audio-iap-2026-08.md) (15 Aug 2026).  
**Status:** Pointer / excerpt only. Full SynapticGM IAP catalog stays in the live research tree.  
**Do not build** until a WOF monetization wave is opened.

---

## Why this file exists

SynapticGM Pack 9 is a **live-game** monetization study. It is not a WOF world/multiplayer dump. It does contain a few lines that only make sense once WOF multiplayer / social surfaces exist. Those lines are copied here so WOF research stays under `docs/research/wof/`.

---

## Explicit WOF callout (from Pack 9 idea catalog)

| ID | Offer | Layer | Sweet spot | Note in Pack 9 |
|----|------|-------|------------|----------------|
| **A29** | Chat bubble style — System-apocalypse themed | A (cosmetic) | $0.99 (too low $0.49 / too high $2.99) | “For when chat/multiplayer ships (**WOF**).” |

**WOF implication:** When party/raid chat or hub chat exists, chat-bubble / nameplate cosmetics are a natural Layer-A SKU. Same rules as live game: cosmetic only; never sells combat outcomes, loot, or raid lockout skips.

Related live SKUs that become more valuable in multiplayer identity (still Layer A):

- **A28** Nameplate color — $0.99  
- **A31** Title / flair under name — $1.99  
- **A32** Supporter badge — $4.99 tip  

Keep these in mind for WOF hub / party UI; do not implement in SynapticGM as “WOF features.”

---

## Competitor intel useful for WOF multiplayer billing

From Pack 9 competitor table / sources (Friends & Fables):

| Pattern | Sentiment | WOF caution |
|---------|-----------|-------------|
| Host pays all multiplayer credits | Polarizing | Prefer clear “who pays for LLM” rules (per-player turn budget vs host-pays) before WOF parties ship |
| Combat burns credits 2–3× faster than narrative | Polarizing | Align with WOF Mode A cost model already locked in Pack 9 MP dump (~$0.018–$0.031 per clear) — monetize **capacity**, not damage |
| Tier-gated memory / @mentions | Criticized | If WOF ever gates pins/@mentions by sub, expect the same pushback |

Source cited in Pack 9: DungeonsDeep — AI Realm vs Friends & Fables (Aug 15, 2026) — turn-sharing, friends-play-free, pricing psychology.

---

## What does **not** move to WOF

Everything else in SynapticGM Pack 9 (dice skins, TTS voices, turn packs, SynapticGM sub tiers, LitRPG “never sell outcomes”) stays live-game research. WOF themed **content skins** (genre packs) are already covered in [`pack-10-themed-skins-2026-08-15.md`](./pack-10-themed-skins-2026-08-15.md) — that is **world skins**, not cash-shop cosmetics.

If a later WOF wave needs a full cash-shop design, start a dedicated WOF monetization pack; do not fork the entire SynapticGM Pack 9 into live code.

---

## Cross-links

- Live: `docs/research/pack-09-monetization-cosmetics-audio-iap-2026-08.md`  
- WOF MP: `pack-09-dump-2026-08-15.md`, `pack-09-text-multiplayer-dungeons-raids-2026-08-14.md`  
- WOF world skins: `pack-10-themed-skins-2026-08-15.md`  
- Rule: `.cursor/rules/wof-sandbox.mdc`
