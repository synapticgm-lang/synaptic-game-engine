# Pack 1 — Loot Rarity Curves (2026-08-14)

**Status:** Captured for end-of-packs summary. Do not implement until John asks.  
**Scope:** Code-owned loot rarity for SynapticGM dungeons/chests.

Architecture already decided: code owns dice/loot rarity; LLM narrates; story before System chrome.

---

## 1) Comparison (6 games)

| Game | Rarity ladder | Pity | Guarantees | Failure mode | Copy / avoid |
|------|---------------|------|------------|--------------|--------------|
| Diablo IV | Common→Magic→Rare→Legendary→Unique→Mythic | No formal pity; rates scale with Torment | Boss-farm Uniques; Mythics gated; junk filtered at high tiers | Ultra-rare Mythics feel unobtainable; loot inflation | **Copy:** tier-gated junk filtering. **Avoid:** raw ~2% boss rates with no pity in SP text. |
| PoE 2 | Normal→Magic→Rare→Unique (+ unique sub-tiers) | No pity | Bosses never Normal; unique internal tiers | Opaque “Item Rarity” confusion | **Copy:** sub-tier within a band. **Avoid:** hiding weights. |
| Genshin | 3★→4★→5★ | Hard pity 90; soft ramp ~74+; 50/50 featured | Guaranteed 5★ by 90 | Soft pity was undocumented → trust hit | **Copy:** soft pity ramp. **Avoid:** hiding thresholds — System should announce pity. |
| Destiny 2 | Common→…→Exotic | No formal pity | Exotics activity-gated | Target-farm with no pity feels bad in SP | **Copy:** top tier only from bosses/activities. **Avoid:** no-pity target farm. |
| WoW | Poor→…→Legendary | No pity; fixed boss tables | Fixed boss pools; some first-kill 100% | World-drop epics ~0.02% lottery | **Copy:** fixed boss pools. **Avoid:** lottery world-drops. |
| Division 2 | Standard→…→Exotic | No pity | Target-farm sources; weekly cache odds | Tiny per-item odds in large pools | **Copy:** per-source pools. **Avoid:** pity split across huge item pools — guarantee **tier**, not specific item. |

---

## 2) Recommended weight tables (sum 100%)

| Tier | Common | Uncommon | Rare | Epic | Legendary | Notes |
|------|--------|----------|------|------|-----------|-------|
| T1 | 70% | 22% | 7% | 1% | 0% | No Legendary; Epic is wow |
| T2 | 50% | 30% | 15% | 4% | 1% | Legendary exists but rare |
| T3 | 30% | 32% | 25% | 10% | 3% | Rare becomes modal |
| T4 | 15% | 25% | 30% | 20% | 10% | Epic common enough to build |

Epic+ combined: T1 1% → T2 5% → T3 13% → T4 30%. Common never 0% (mats/economy).

---

## 3) Pity (code-ready)

Per player, per dungeon tier: `pity_counter[tier]` = consecutive chests at that tier without Epic+.

- If `pity_counter[T] >= threshold[T]`: force weighted Epic/Legendary only; reset counter.
- Else: full table; reset on Epic+, else increment.

| Tier | Pity threshold (chests without Epic+) |
|------|----------------------------------------|
| T1 | 50 |
| T2 | 30 |
| T3 | 20 |
| T4 | 10 |

**Soft pity (recommended):** from 80% of threshold, +5% Epic+ chance per extra chest.

**In-universe:** System announces pity (“Pity Protocol engaged…”) — narrative feature, not hidden gacha.

---

## 4) Non-random

| Category | Rule |
|----------|------|
| Quest items | 100% from designated source |
| Keys | Fixed placement; not in loot table |
| Boss first clear | Guaranteed Epic+ (+ at least one Rare+) |
| Boss repeat | Tier table + boss bonus (+1 band to highest roll) |
| Story-critical loot | Scripted in ledger before narrate |
| Crafting mats | Always present; qty ±20% |
| Gold | Fixed per tier ±20%; not rarity-weighted |

---

## 5) UI vs story

- Story beat first → System chrome second (never System-only).
- LLM: appearance/feel/power in prose only.
- System log: `[SYSTEM] Item acquired: Name — RARE`, stats, pity, first-clear.
- UI colors only (not prose glows): Common gray, Uncommon green, Rare blue, Epic purple, Legendary orange.
- LLM must **not** invent rarity tier, drop %, pity, or color-coded glows.

---

## 6) Replay fairness

- Seed-stable per chest (chestId + run/player seed).
- Per-run dungeon seed changes outcomes; table fixed by tier.
- Visible drop tables in codex/System help.
- Visible pity counter per tier.
- Guaranteed floor: T1–T3 ≥1 Rare+/run; T4 ≥1 Epic+/run.
- Boss = known pool; rarity roll picks quality/slot in pool.
- Affix rolls = real variance inside a rarity ceiling (later).

---

## Ready-to-implement block

```
T1 70/22/7/1/0   pity 50   floor 1 Rare+/run
T2 50/30/15/4/1  pity 30   floor 1 Rare+/run
T3 30/32/25/10/3 pity 20   floor 1 Rare+/run
T4 15/25/30/20/10 pity 10  floor 1 Epic+/run
```

---

## SynapticGM backlog from this pack (≤10)

1. Replace current `rollLootRarity` weights with table above.
2. Persist `pity_counter` per tier on save/character.
3. Soft pity ramp + System log line on trigger.
4. Quest/key/story loot paths bypass RNG.
5. Boss first-clear Epic+ guarantee; repeat +1 band bonus.
6. Run floor guarantees (Rare+/Epic+).
7. Prompt: LLM never states rarity/stats/pity; System log does.
8. Codex/help: show tier drop tables + pity progress.
9. Gold/mats ±20% separate from rarity roll.
10. (Later) affix rolls inside rarity ceiling.

---

## Sources (accessed Aug 14, 2026)

- Diablo 4 Season 10 loot / boss tables (Wowhead, AoeAH, Icy Veins)
- PoE 2 0.2.0g / PoE wiki rarity
- Genshin pity (Game8, HoYoLab)
- Destiny 2 Lost Sector / Exotic rates (Reddit, Blueberries)
- WoW item quality (Vanilla archive wiki)
- Division 2 exotics (Grindout)
- System Apocalypse LitRPG review (Substack) — genre tone only

---

## Delta vs current code (`dungeonSeed.ts`)

Current approximate cuts differ (esp. T1 still allows Legendary in code). Align weights + add pity/floor/boss rules when implementing this pack.
