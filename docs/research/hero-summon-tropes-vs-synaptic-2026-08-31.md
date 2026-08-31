# Hero-summon tropes vs SynapticGM (Summoned Pact)

**Date:** 2026-08-31  
**Scope:** Compare Google’s “top ten hero summon LitRPG” opening premises to SynapticGM LitRPG hero-summoning — especially **The Summoned Pact** (`summoned-pact`) `openingHooks` deck. Hero Awakening + other LitRPG catalog decks noted only where they touch a Google slot without being summons.  
**Sources:** `src/data/campaigns/summonedPact.ts`, `heroAwakening.ts`, `openingHookDecks.ts`; `docs/research/opening-prompt-stack-litrpg-summon-2026-08-31.md`.  
**Not in scope:** Code changes, Mid writer, WOF, commit/push.

---

## One-line verdict

Our **deck is denser than Google’s list on rite-room / war-camp / alone-ruin variants**, but **live page-1 GM never sees the pointer card** — so Flash Lite often invents a vague atmosphere summon instead of the sharp trope the seed already picked.

---

## Wiring (how “live” is scored)

| Path | What the writer gets | Trope sharpness |
|------|----------------------|-----------------|
| **Live GM** (`callOpeningGm`) | Location string + bible premise snippet + thin SNAPSHOT (props, alone gate, optional `hookLock` nature). **Hook POINTER CARD / `buildOpeningSceneMandate` unwired.** | Weak — place name + generic isekai rails |
| **Save-only** | Full `pickedHook` / card text on `openingEstablishment` | Stored; not in GM prompt |
| **Stitch fallback** | Grammatical `pickedHookFallback` + sensory/pressure banks | Strongest of the three for card fidelity |

Hero Awakening is **not a summon** (`You were already here`). Its deck does not count as hero-summon coverage below unless noted as adjacent LitRPG.

---

## Coverage table (Google #1–10)

| # | Google trope | Match | Our card / premise (quote) | Live today |
|---|--------------|-------|----------------------------|------------|
| 1 | Royal Summoning Room (Group Subversion) — trash class, exile, revenge | **Partial** | **Yes on room + subversion stamp; no trash-class/exile revenge as opener.** Sevenfold Circle: *“They paid for a Pactborn champion… The Mark looks wrong.”* Mass summon: *“Four bodies. Politics… who is Pactborn, who is Marked, who was extra.”* Default hook: *“mid-rite… blue panel… refuse.”* | **Live:** location + Mark/`hookLock` only. **Save:** full card. **Stitch:** fallback rite prose. |
| 2 | Wilderness Dump (Left Behind) — lethal wilds, survival | **Partial** | Alone ruin ladder (6 cards) = left-behind, not lethal wilds. E.g. *“alone in a half-collapsed ruin on the edge of wild country”* / foundation outline / burnt husk. Wayside shrine: *“One mistake on a rural circle… miles of dust.”* | **Live:** alone invent-crowd gate **works**; sharp “wilds survival” beats **stitch-only** (fallback). **Save:** full card. |
| 3 | Failed/Corrupt Ritual (Escape) — sacrifice/battery, fugitive | **Partial** | Cell bait: *“They summoned a lure, or they are hiding a failed Mark.”* West-wall empty: *“The rite already failed for someone else. You are leftover.”* Cult: *“Wrong gods, wrong chant.”* Bombardment vault = rite under fire. **Missing:** sacrifice/battery + break-binding fugitive as the first beat. | Same as #1 — **live thin**, **stitch** uses fallback. |
| 4 | Active Battlefield (Trial by Fire) | **Yes** | War camp: *“Mud, banner-smoke, a war-camp circle. Horns.”* / *“They needed a body on the line yesterday.”* Bombardment: *“They finished the rite while the city was hit. There is no orderly welcome.”* | **Live:** distinctive location strings help a little. Full panic-grab / kit-offer beats = **stitch** or **save**. |
| 5 | Floor 1 Tutorial Tower (Solo Instance) | **No** | Not in Summoned Pact. Adjacent (other bibles, not hero-summon): `dungeon-transport` *“Floor 1 of the Abyssal Spire”*; `ascending-spire` Floor 1 gate/plaza. | N/A for SP. Catalog decks share the same **unwired POINTER** gap. |
| 6 | Wrong Target Minion Summon — bound to native master | **No** | Closest is festival **wrong catch** (still a hero-summon, not minion bind): *“You were not the name on the rite — you were in the crowd… ‘Wrong catch.’”* Harbor smugglers / treaty token = used as asset, not humorous familiar. | Wrong-catch location **live-thin**; minion-bind **absent**. |
| 7 | Post-Hero Regression (Re-Summon) | **No** | No saved-world / L1 re-summon / meta-knowledge cards in SP or HA. | Absent. |
| 8 | Interstellar / System Integration Crash | **No** *(as summon)* | SP Mark glitch ≠ cosmic format outlaw. Adjacent: `system-integration` catalog (*“Integration complete.”* / Registration panels) — Earth apocalypse, not hero summon. | SI deck exists; same live-wire gap; **not** Summoned Pact. |
| 9 | Outlaw / Monster Rebirth | **No** | No hero-soul-in-monster-carcass opener. Adjacent flavor only: `void-audience` rebirth/Auditor (death bargain, not monster body). | Absent for summon. |
| 10 | Cozy Frontier / Decommissioned Sanctuary | **Partial** | Wayside shrine = quiet rural pocket (*“One priest, one circle, miles of dust”*). Alone *“shabby-but-standing building”* can be cottage/chapel annex. **Missing:** dying deity + intentional town/farm sanctuary cozy as the opening contract. | Live-thin; stitch fallback for shrine/alone. |

---

## Scores

| Metric | Score | How counted |
|--------|-------|-------------|
| **Deck coverage (SP hero-summon)** | **6/10** | Yes (#4) + Partial (#1, #2, #3, #10) + half-credit none for #5–9. Strict full-yes only: **1–2/10**. |
| **Reachable live as sharp trope** | **~1–2/10** | Alone ruin gate (#2 family) is the only hard live constraint. Battlefield/cathedral get a **place name**, not the card’s faction/offer/beats. Pointer card = **save-only**; full scene = **stitch-only** on GM fail. |

If counting **all LitRPG premades** (not just summon): #5 and #8 appear in catalog decks → deck adjacency rises (~8/10 adjacent), but **live sharpness still ~1–2/10** because POINTER CARD is unwired everywhere.

---

## Over-index vs under-index

### Over-index (Summoned Pact deck + bible)

- **Cathedral / Sevenfold Circle / registrar-adjacent handlers** — default location, soft `openingHook`, mass-summon variant, bombardment vault still “the circle.”
- **Blue panel + Earth clothes + refuseable kit offer** — nearly every card repeats this skeleton.
- **Calamity Mark / “Mark is wrong”** as the main subversion (stamp politics, not trash-class exile revenge).
- **Alone ruin ladder** — 6/20 cards (shabby → foundation); strong left-behind density, weak “lethal wilderness” density.
- **Valespire / Pellane / Crown vs Ash** faction grammar — most crowded cards stay in that polity.

### Under-index (vs Google’s 10)

- Trash-class / exile / revenge-optimization openers (#1 full shape)
- Lethal wilderness survival dump (#2 full shape)
- Sacrifice / soul-battery / break-binding fugitive (#3 full shape)
- Sterile System tutorial tower as *summon* arrival (#5)
- Minion / familiar wrong-target bind (#6)
- Post-clear re-summon with meta-knowledge (#7)
- Cosmic / format-glitch outlaw sheet as summon (#8)
- Monster-body rebirth (#9)
- Dying-deity cozy sanctuary / farm pocket (#10 full shape)

---

## Honest: are we “leaving it too open”?

**Yes.** The rich deck was designed as *“Pointers, not a script — writer builds the page”* — that only works if the pointer reaches the writer. Per `opening-prompt-stack-litrpg-summon-2026-08-31.md`:

1. `buildOpeningSceneMandate` (HOOK POINTER CARD) is **defined and unused** by `callOpeningGm` / `callGm` / `gm-turn`.
2. Campaign contract stores `pickedHookId` but **omits** it from `formatCampaignContractForPrompt`.
3. Live stack = Master LitRPG DNA + PROSE LICENSE / VALUE FLOOR + Guide Book premise + Location + thin SNAPSHOT + `(opening)`.
4. Stitch fallback ironically **honors the card more** than the live GM path.

So Flash Lite is asked to invent a full ~100–180 word first page from a **place name and a generic isekai premise**, while MODE DNA still whispers “Modern Integration Earth.” That produces **vague atmosphere summons** (smell/light/crowd essays, panel-as-presence slips) instead of Google-sharp tropes — even when the seed already picked war-camp, cell-bait, or foundation-outline. We are not “leaving it open” as a product philosophy so much as **failing to deliver the constraint we already authored**.

Hero Awakening does not fix this for summon players: it is a different genre (in-world awakening), same unwired opening path.

---

## Optional deck gaps (list only — do not implement)

Original / copyright-safe cards that would close Google holes without copying series:

1. **Trash stamp / exile gate** — Crown rite succeeds; panel shows rejected class; handlers walk you to the gate with a one-way pass (revenge later, not opening lecture).
2. **Wilds dump** — circle haywires into marked wilderness / beast-track country; no building footprint; survival first, city rumor later.
3. **Binding break / fugitive** — you were the power source for someone else’s rite; bindings crack; chase horns before names.
4. **Front-line panic class** (tighten #4) — optional card: no handlers, only dying sergeant + open crate; class panic-grab as offer not auto-grant.
5. **Summoned into Floor 1 tutorial hall** — sterile System rooms under a failed cathedral divert (SP-flavored tower, not Abyssal Spire copy).
6. **Wrong-target familiar bind** — native mage expected a bound servant; humorous leash + slow agency (not a licensed familiar IP).
7. **Re-summon regression** — world already “saved” once; you wake L1 with sealed meta-memory pins (ledger-owned, not dump).
8. **Format outlaw sheet** — summon succeeds; System flags your sheet as illegal format / wrong cosmology (Pellane-scale, not SI Earth).
9. **Monster carcass wake** — soul lands in a marked beast/construct body; panel argues species; scavengers approach.
10. **Decommissioned sanctuary / dying Scale pocket** — quiet farm or chapel town where The Scale’s local presence is failing; cozy pressure, not Crown pageantry.

Wire gap (product, not new cards): inject POINTER CARD into live opening GM before expecting deck diversity to show up in playtests.

---

## Chat-ready summary

| # | Trope | Deck | Live |
|---|-------|------|------|
| 1 | Royal / group subversion | Partial | Thin |
| 2 | Wilderness dump | Partial (alone ruins) | Alone gate only |
| 3 | Failed ritual escape | Partial | Thin |
| 4 | Battlefield | Yes | Thin |
| 5 | Tutorial tower | No | — |
| 6 | Minion wrong-target | No | — |
| 7 | Post-hero regression | No | — |
| 8 | Integration crash | No (SI adjacent) | — |
| 9 | Monster rebirth | No | — |
| 10 | Cozy sanctuary | Partial | Thin |

**Coverage: 6/10 in SP deck (mostly partial); ~1–2/10 sharp tropes reachable live.**

**Founder conclusion:** Summoned Pact already over-indexes circle / Mark / bombardment / alone-ruin variants and under-indexes Google’s wilder shapes (trash exile, tower, minion, regression, monster body, cozy deity). The bigger issue is not missing cards — it is that the 20-card deck is save+stitch rich and **live-GM blind**, so Free Flash Lite fills the gap with atmosphere instead of the seeded trope.

*No game code changed. Mid writer OFF.*
