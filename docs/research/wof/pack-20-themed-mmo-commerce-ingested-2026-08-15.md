# WOF Pack 20 — Themed MMO commerce (ingested)

**Project:** WOF later release. Do not implement into live SynapticGM.  
**Status:** Commerce dump ingested 15 Aug 2026. This page is v1 picks + dump errors + remaining John calls.  
**Full dump:** [pasted/WOF_ThemedMMO_Commerce_Dump.md](./pasted/WOF_ThemedMMO_Commerce_Dump.md)

Do not re-run `RESEARCH-PROMPT-themed-mmo-commerce-bolt.md`.

---

## Locked from dump (matches Pack 19)

| Item | Decision |
|------|----------|
| Product split | **A** capacity sub · **B** world DLC · **C** chrome shop. Do not merge. |
| Sub meters | Turns / TTS / queue — **not** story quality, worlds, or dice odds |
| Worlds | Buy-and-own. Dropping sub does **not** revoke a bought world (free-tier turns still apply) |
| Theme Kit | **Included** with world: UI + 1 dice skin + 1 voice + default fashion |
| Extra chrome | À la carte. Two shop sections: WORLDS vs CUSTOMIZE |
| Kid Mode | No IAP. Mature worlds locked even if parent owns them |
| Billing | Never writes EncounterLedger. LLM cannot grant world unlocks |
| Card Vein | Seen/owned cards. **No** sealed power packs |
| Cross-world party | **No** instances together. Friends/tells/presence **yes** |
| Characters | **One identity per world**, not transferable. Gold/inventory per world; friends + cosmetic tokens on account |
| Live SGM shop | Still a different catalog |

---

## Dump v1 picks (speculative until John locks)

| Topic | Dump pick |
|-------|-----------|
| Ash Compact | Free to enter (capacity still metered) |
| Extra worlds | DLC, not buried in High sub |
| DLC price | **$12.99** (simple worlds ~$9.99, big ~$14.99) |
| Mid / High sub | $9.99 / $19.99 |
| Free turns | **15**/day (shared across worlds) |
| All-Worlds Pass | Yes **after 3+ worlds**, not v1. Dump leans **keep worlds on lapse** |
| Theme Kit | Included |
| Chrome overlay | World-locked default; cross-world toggle is a John call |
| Character slots | 1 free per world; 3 if subscribed (clashes with playable-start “3 for everyone”) |
| Cosmetic tokens | Events + achievements, not daily-login obligation |
| Crossroads hub | Social-only, no combat — **v3**, speculative |

---

## Dump errors (Pack 10 / 15 names win)

Do not lock these module/world swaps from the dump:

| Dump said | Keep |
|-----------|------|
| Halo Term = mature horror | Pack 15: **powers school**. Horror = Veil Watch |
| Hollow Term = fungal body horror | Pack 10: **magic school** |
| Route Lantern = trail/exploration maths | Pack 15: **romance / bond_heart** |
| Lanceyard = jousting | Pack 10/15: **mecha**, `frame_heat` |
| `frame_heat` on Starwake | Starwake = **`ship_board`**. `frame_heat` = Lanceyard |
| `realm_gate` on Route Lantern / Hollow Term | `realm_gate` = Circuit Arc / Sect Ascension (tournament/cultivation) |
| `bond_heart` as Menagerie partner combat | `bond_heart` = romance routes. Menagerie catch = `bond_type` |
| **Hearthstone Dice** (Ash Compact kit) | Rename — too close to Blizzard. Use **Hearth Dice** or similar |

HUD layouts + `bond_type` / `cozy_tick` / `card_lane` one-pagers are still usable. Re-map kits to the Pack 15 modules before a content bible.

---

## Still for John

1. Ash Compact free-to-enter vs paid  
2. Worlds: DLC only vs High sub includes all  
3. Theme Kit included vs extra  
4. Chrome: world-locked vs player overlay  
5. All-Worlds Pass: never / later / at 3 worlds  
6. DLC band: $8.99 / $12.99 / $14.99  
7. Pass lapse: keep worlds vs rent  
8. Free daily turns: 10 / 15 / 20  
9. Slots: 1+sub-alts vs 3 for everyone (playable-start clash)  
10. Cosmetic tokens: events+achievements vs daily login  

---

## What the dump is good for

Plan matrix, Theme Kit *idea*, phone chrome (story first, send lock stays), entitlements sketch, shop split WORLDS vs CUSTOMIZE, failure modes (wrong $2 dice vs $13 world). Full schemas in the dump; do not duplicate here.
