# Owner map — 3×4 T50 (`02k` tapes, `02k3x` critic)

**Not a scorecard.** Gemini book scores stay the only 1–10 / stop-early gate.  
**Real P0** = same class in **≥2 seeds of one mode** or **≥2 modes**. One-seed CAST tokens are jitter.

Sources: `gemini-01`…`gemini-12-*-02k3x-reply.md`  
Paste: `scripts/fate-autoplay/runs/gemini-paste-2026-09-02k-3x/`  
Seed 42 runs reused from earlier today on stamp `2026-09-02k` (same tapes as `OWNER-MAP-02K-FOUR-MODE.md`). Seeds 43–44 are fresh.

Correction rule (same as 02e / 02i / 02k): Gemini defaults to `proseWarden` / `arcDirector` / `craft` for CAST / ledger / pad / chrome. Travel picks are not teleports.

| Class | Seeds / modes | Actual owner | Gemini wrong? | Real? | Ship 02l? |
|---|---|---|---|---|---|
| Charter sale-replay (clerk takes / Pell re-offers / pack still holds after T12 sale) | PYOA **s42 + s43 + s44** | Lock C. 02f kit + burn lock held; **sale/deliver** never wrote `destroyedItems`. `isFactClosedViolation` was burn-only. | Partial — said `arcDirector` | **YES** | **YES** |
| Mid-game “the panel” actor / placeholder (`the panel doesn't charge`, `Take the panel`, innkeeper → panel) | LitRPG **s43** + RPG **s43** (also original s42 smash) | `isAloneArrivalOpening` stayed true after covers → figure/speaker/someone-nearby mapped to **the panel**. Chrome-as-actor verbs not rewritten. | Partial — said `proseWarden` / `craft` | **YES** | **YES** |
| Thornferry Road as a walking person | PYOA **s43 + s44** | Lock B. Bible title / location Title-Cased into CAST. Not in location registry; `canHarvestAsNamedPerson` allowed `^[A-Z][a-z]+$`. | Partial — said `proseWarden` | **YES** | **YES** (place lock, not a token deny-list) |
| Location “teleport” / scene collage | LitRPG s44, D&D s42–s44, RPG s44, PYOA s43 | **Legal Fate travel** + hub yo-yo. Same Gemini miss as 02k D&D T44. | **Yes** — `arcDirector` | **NO** (critic) | **NO** |
| CAST `This` / `Three` / `Yours` | RPG s42 only (original 02k). **3x re-review of the same tape did not ticket it.** | Lock B deixis harvest | — | **NO** (one-seed / critic jitter) | **NO** |
| Wounded-left talk | LitRPG s42 only (original 02k). Not a 3x shared P0. | Lock C leave-close, not lastKill | — | **NO** (one-seed) | **NO** |
| `the stranger` / Argot / gender flip | LitRPG s42 P2; RPG s42 P1 | craft / CAST leftovers | — | jitter / P1 | **NO** |
| `Stalls no one the lane` hole | LitRPG s43 + RPG s43 (P1) | Possible empty-crowd rewrite; not a clean ledger owner | Partial | weak | **NO** this batch |

## Did 02k lastKill greeter still hold?

Yes across 12 cells. No mug-of-ale lastKill rez ticketed.

## 02l ship (this job)

1. **Charter closed** — sell/deliver writes `destroyedItems`; `isPyoaCharterClosed` also honors spine `resolution` + kit-empty after a use; commit gate + scrub catch clerk-takes / pack-still-holds / re-offer.
2. **Alone-opening chrome** — `isAloneArrivalOpening` is false once `openingEstablishment.complete`.
3. **Panel-as-actor** — `rewriteChromePersonClauses` rewrites panel charge/step/shatter agency.
4. **Place ≠ CAST** — `Thornferry` / `Thornferry Road` are polity/place; `canHarvestAsNamedPerson` rejects registered locations + polity tokens.

Deny-list growth (`This`/`Three`/`Yours`) **not** shipped. Wounded-left **not** shipped. No second 12×T50.
