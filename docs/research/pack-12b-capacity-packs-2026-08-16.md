# Capacity packs — sizes & prices (profit-first)

**Date:** 16 Aug 2026  

## Expiry rules (locked)

| Source | Expiry |
|--------|--------|
| **Monthly sub** (Free/Mid/High daily turns, weekly memorable, daily Illustrated) | **Use it or lose it** — resets; unused do not roll over |
| **Purchased packs** (text or Illustrated) | **Never expire** — you get everything you paid for until spent |
| **Rewarded ads** (+3 text) | **Today only** — use-it-or-lose-it with the day |

Spend order: burn today’s sub (+ ad) first, then pack balance.

**Pack AI (locked):** Pack turns use the player’s **current subscription tier writer** (Free / Mid / High). No model upgrade inside packs — keeps prose voice consistent mid-campaign.

Code: `capacityLedger.ts` (`textPackBalance` / `illustratedPackBalance` persist across days).

---

## Live now — text turn packs (mid-low value)

Shelf prices stay charm; counts sit between “stingy” (+10/25/60) and “aggressive” (+20/40/100).

| Pack | Contains | UK | ~profit if fully used (High, app ~70%) |
|------|----------|-----|----------------------------------------|
| **Spark** | **+15** text turns (no expiry) | **£1.99** | **~£1.23** (~11× cost) |
| **Chapter** | **+35** | **£3.99** | **~£2.41** (~7×) |
| **Saga** ★ | **+80** | **£7.99** | **~£4.71** (~6×) |

Assumes High text ~£0.011/turn. Mid/Free buyers leave more margin.

### Memorable art (not a pack)

Included when a milestone turn happens. Already paid via that text turn / sub.

---

## Later — Illustrated packs at **4×** net (`shopLive: false`)

| Pack | Contains (no expiry) | UK | Profit if fully used (app ~70%) |
|------|----------------------|-----|----------------------------------|
| **Panels** | **+10** illus turns | **£4.99** | **~£2.78** |
| **Arc** | **+20** | **£7.99** | **~£4.17** |
| **Volume** ★ | **+30** | **£12.99** | **~£6.96** |

Counts rounded to nearest 5 for shop clarity. Prices unchanged (~4× High worst-case).

---

## Combat pacing setting (product direction — shipping)

Helps free/pack players stretch turns without selling power:

| Setting | Behaviour | Turn burn |
|---------|-----------|-----------|
| **Auto Fight** | Code resolves the fight (ledger combat + outcome); writer does a short fight beat + result | **~1–2 turns** per encounter |
| **Full control** | Player picks each move / free-text each round (default) | **Many turns** (one per round / action) |

- Same dice, HP, loot — only **how many story beats** the fight costs.
- Tip popup (`AutoFightTipModal`) shows once per device in **all engine modes** when a session starts.
- Toggle also in Settings → Mechanics → Combat pacing.
- Manual Auto-Fight button still available during encounters when Full control is selected.

---

## Shop shelf

1. Text packs: Spark / Chapter / Saga  
2. Later Illustrated: Panels / Arc / Volume  
3. Subs: Free / Mid / High (daily allowances reset)  
