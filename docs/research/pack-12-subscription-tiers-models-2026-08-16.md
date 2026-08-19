# Pack 12 — Subscription tiers, models & Flux (locked 16 Aug 2026)

**Status:** Wired in code (`subscriptionTiers.ts`, `capacityLedger.ts`, `fluxDirect.ts`). Catalog refreshed **2026-08-19u** (Flash Lite / Haiku / Sonnet 4.6 + Klein 4B). Billing UI not live — tier stored locally.

## Flux routing

**Now:** `imageProvider: 'flux'` → **OpenRouter** (`flux.2-klein-4b` Free/Mid memorable; `flux.2-pro` High plates).  
**Later:** flip to `imageProvider: 'flux-direct'` + `fluxApiKey` → same tier map hits BFL (`flux-2-klein-*` / `flux-2-pro`). Callers unchanged (`generateComicImage`).

`fluxDirect.ts` stays ready; not used until you switch the provider flag.

## Tiers (launch = text + memorable; Illustrated caps reserved)

| | Free | Mid £14.99 | High £29.99 |
|--|------|------------|-------------|
| Writer (OpenRouter) | `google/gemini-2.5-flash-lite` | `anthropic/claude-haiku-4.5` | `anthropic/claude-sonnet-4.6` |
| Text turns/day | 12 | 20 | 24 |
| Memorable/week | 5 | 20 | 40 |
| Illustrated/day (later) | trial 10 once | 6 | 10 |
| Max panels/turn (later) | 1 | 2 | 3 |
| Flux direct | klein-4b | klein-9b (+ pro hero) | pro (+ pro-preview hero) |
| Ads | +3 text (opt-in); optional +1 memorable | none | none |
| Packs | See [pack-12b](./pack-12b-capacity-packs-2026-08-16.md) — Spark/Chapter/Saga + Echoes/Gallery live; Illustrated packs reserved |

Choices / regen always use **Free writer** (cheap).

## Code map

- `src/game/subscriptionTiers.ts` — catalog + model resolve  
- `src/game/capacityLedger.ts` — daily/weekly meters, ads, packs  
- `src/services/fluxDirect.ts` — BFL client (ready; unused until `flux-direct`)  
- `src/services/openRouterService.ts` — **default Flux via OpenRouter**; optional `flux-direct`  
- Settings: `subscriptionTier`, `fluxApiKey` (for later), default `imageProvider: 'flux'` (OR), classic + memorable on  

## Still to ship (product)

- Shop UI for Mid/High + packs + “watch ad”  
- Server-authoritative ledger (anti-cheat)  
- Full Illustrated campaign gate (no text fallback)  
- Graphic novel download  

Payments remain offline until you greenlight IAP.
