# Synthesis: 09c Live Drive 4×T20 (Gemini Pro response + options)

**Date:** 2026-09-10  
**Stamp:** `2026-09-09c`  
**Harness:** typed cover-continue, then Silent Engine play. Seed 42.  
**Paste:** `scripts/fate-autoplay/runs/gemini-paste-2026-09-09c-livedrive-t20/`  
**Scores:** `gemini-pro-SCORES-REPLY.md`  
**Lens:** score the response, score the options, rewrite, better chips. Review only.

Do **not** paste Gemini rewrites into stitches, cards, or pads. They invent kit, treat quest titles as people, spawn Keep Wraith in the tavern, and close fights the ledger did not close.

---

## Scores

| Mode | Persona | Response mean | Options mean | Cover (resp / opts) |
|---|---|---|---|---|
| LitRPG | storyfollower | **2.05** | **2.05** | T1–T2: 3.5 / 2.0 |
| Tabletop | maxlevel | **2.15** | **1.95** | T1–T3: 3.3 / 2.0 |
| Story RPG | storyfollower | **1.90** | **1.90** | no cover (play from T1) |
| PYOA | completionist | **2.00** | **2.00** | no cover (play from T1) |
| **Overall** | | **2.03** | **1.98** | |

Cover beats are the only ones above a 3. Play is a flat ~2 because the book is Silent receipts (`HERE` / `ACT` / `CAST` / `GOLD`). Gemini is scoring a ledger dump as if it were a story.

Same ceiling as 02ac story lens (~2.00). 08a packet stitch was 1.25. Silent receipts are not worse than 08a templates; they are the same class: mechanics-as-prose.

---

## What Gemini actually caught (owners)

### 1. Silent Engine is the play writer — Class D / 08d

After covers complete, every mode prints receipts. Gemini’s play rewrites are fanfic over `ACT: inspected` / `CAST: Circle's Price`. That is expected while `SILENT_ENGINE=true`.

**Owner:** `freeMudPresentation` (`mudDisplayBody`) + `useGame` / `fateAutoplay` Silent branch.  
**Not:** a new GM prompt rule.

If John wants book English on play turns, Silent has to stop being the displayed body (authored receipt sentences, or turn flavor back on). Do not paste Gemini paragraphs.

### 2. Quest titles in CAST / Talk pads — Class D / 02aa never-CAST

Live tape: `CAST: Circle's Price` then `Offer Circle's Price honest help`. Tabletop: `Ask Greyhollow Quest`. Gemini followed the leak (`Approach Circle's Price`, `Ask Greyhollow Quest a direct question`).

**Owner:** `completedEventPacket` witnesses + `canHarvestAsNamedPerson` / entity CAST. Quest journal titles must never enter `present[]` / CAST / Talk pads.

### 3. Cover-continue stitch is generic — Class B+D / `stitchOpeningContinue`

T1–T3 ~3–4. The stitch answers why-name / search, but it does not reuse page-1 nouns (priests, handler, Mark, cracked rings, mayor, woodcutter, hearth). Ground line is the shared “still on the table” bank.

**Owner:** `stitchOpeningContinue` — verb+outcome from the player line + **this card’s** page-1 nouns only. No Gemini prose, no new kit.

### 4. Cover chips are leftover play pads — Class C / ChoiceCompiler

Name still pending, pads are `Inspect the panel` / `Check Status` / `Wait and watch`. Gemini wants Give name / Refuse / Ask who they are / Ask the mayor.

Product law is typed-only covers (`fastSetupChips` off). Live Drive still showed chips because `compileChoices` / ActionBar filled an empty pad.

**Owner:** while covers pending, do not compile play pads. If chips are on, they must be the current cover (Give name / Refuse), never Status / Wait.

### 5. Live-fight pads stay inspect / “take a stake” — Class C / graphChoices

LitRPG T8+ has a Skirmisher. Gemini wants Attack / Flee / Parley / Defend. Tape kept inspect loops and `Take a stake in what is unfolding` (choice filter even tried to drop that chip and it came back).

**Owner:** sealed-beat `compileGraphChoiceLabels` — combat pads only while encounter is live.

### 6. PYOA spine chips exist; receipts do not honor them — Class C / pyoaSpine

Early pads (`Walk the road with Wren`, Pell’s coin, chapel) are the right family. The displayed body is still `ACT: acted`. After the mill/chapel fork, pads rot into Ask / Listen / Press for leverage — RPG talk leftovers on a PYOA landing.

**Owner:** PYOA pad lock + Silent body. Ending leaf should not keep talk-loop chips.

---

## Gemini rewrite poison (do not ship)

| Invent | Why it is poison |
|---|---|
| “someone marked as Circle's Price” | Quest title → person |
| Ask for a weapon / draw a weapon | Kit invent (sealed bag) |
| Fatal blow / Skirmisher collapses on T20 | Ledger may not have lastKill |
| Keep Wraith materializes in the tavern | Drought spawn narrated as a jump-scare |
| Vessa dialogue + watchmen montage | Page-1 spice treated as live facts, then travel essay |
| “crisis brought to a close” | Ending declared in prose |
| Priest blessing / banish the Wraith | New ritual |

Use Gemini for **which slot failed** (name cover, CAST, combat pad, Silent body). Use ledger nouns for any authored stitch.

---

## If John asks to ship (recommended order)

1. **Never-CAST quest titles** — Circle's Price / Greyhollow Quest out of CAST and Talk/Offer pads.  
2. **Cover pad lock** — no play chips while name pending; optional Give / Refuse only.  
3. **Cover stitch uses this card’s nouns** — answer the typed line; no shared indoor-summon ground.  
4. **Combat graph pads only** while encounter live.  
5. **Silent display** — decide: keep receipts (honest 2/10 book) or authored 2–3 sentence receipts keyed to verb+outcome (08b stitch family), still no novelist.

No new GM prompt rules. No Continuity-Warden LLM. Mid writer stays OFF.
