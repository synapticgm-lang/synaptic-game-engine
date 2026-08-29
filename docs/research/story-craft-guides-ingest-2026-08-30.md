# Story-craft guides ingest — 2026-08-30

**Zip:** `How to Write a Complete Guide.zip` (178 KB, 2026-08-30)  
**Verbatim dump:** `docs/research/pasted/manus-story-craft-guides-2026-08-30/`  
**Commission:** `docs/research/MANUS-PROMPT-story-craft-guides-2026-08-30.txt`  
**Status:** Research ingested. **SC-001 shipped 2026-08-30S** (four mode AUTHORITY sentences). **Path A compiler shipped 2026-08-31g** (`craftBookCompiler` — ≤2 CRAFT lines/turn; full D2 still research-only). Mid writer stays OFF. No new LLM critic. No WOF.

This is the commissioned **WS-STORY** pack (filename prefix `SynapticGM_story_craft_guides_2026-08-30`), not a generic “how to write” dump.

---

## Verdict

**It fills the missing writing-craft gap.** Live rails as of 30R are one AUTHORITY recycle sentence + fluid `NO RECYCLE` — diction and clone-detect, not a how-to for LitRPG vs tabletop vs story RPG vs PYOA. This pack is that how-to, already thinned to **four AUTHORITY sentences** (one per mode).

It does **not** replace Path A (`ArcDirector` / `BeatContract` / `ChoiceCompiler`). It does **not** replace T1 quality-governance. Treat D2–D6 as a human writer’s constitution; treat D7–D8 as “paste four lines, then tighten ledgers we already have.”

Honest ceiling in the pack (design estimate, not scored): **6–7/10** if we only add the four lines; **8–9/10** if we also ship three ledger families. **That 8–9 is too optimistic vs Path A T6** (7.0–8.5 after three architectural batches). Four sentences will not make Flash Lite remember branch locks.

---

## File manifest

Outer zip (saved as-is). Nested `SynapticGM_story_craft_guides_2026-08-30_package.zip` extracted under `package/` — same core docs with the requested filename prefix.

| File | Purpose |
|---|---|
| `SynapticGM Story-Craft Constitution.md` | **Main deliverable.** D1–D10 in one file. Canonical copy also at `package/SynapticGM_story_craft_guides_2026-08-30.md`. |
| `SynapticGM Story-Craft Guides — Executive Summary.md` | D10 one-pager. Same text as `package/…_executive_summary.md`. |
| `SynapticGM_story_craft_guides_2026-08-30_backlog.csv` | D8. 18 items (SC-001–SC-018). Required columns present. |
| `Validation Report.md` | Self-check: 59/59 PASS (counts, 240-char AUTHORITY, shared hard rule, 15 D6 rows, 80 D7 maps, 12 D9 gates). |
| `Reference Link Check.md` | 27/27 cited URLs reachable. |
| `synapticgm_research_notes.md` | Working notes + ChooseCo omission + IlorisNovel blocked. |
| `research_story_craft_domains.json` | Raw research scrape (5 domains). **Scratch, not the constitution.** Some AUTHORITY lines here are generic junk. |
| `pasted_content.txt` | The commission prompt, pasted into the Manus project. |
| `validate_synapticgm_guide.py` / `check_synapticgm_links.py` | Their validators. |
| Nested `package/` | Renamed subset of the above. No extra PDFs/CSVs beyond the backlog. |

No licensed-setting bibles. No game-code patches. No WOF.

---

## Commission match (D1–D10)

| ID | Asked | Delivered? | Note |
|---|---|---|---|
| D1 | 8–15 public sources / mode | **Yes** (11 / 10 / 9 / 10) | ChooseCo omitted with justification (trademark + no free craft manual). **Inform / IFComp / Monsterhearts / dedicated OSR essays** live in the JSON scrape, not the constitution tables — Emily Short, Ashwell, Twine, Alexandrian, Blades SRD, PbtA 201, Fate SRD cover the function. |
| D2 | 8–12 DO/DON’T + example + 3 AUTHORITY ≤240 | **Yes** (10/10 each mode) | Shared hard recycle rule exact. Examples use original names only; LitRPG “after” wrongly sits in a **Vesper-Glass cell** (PYOA bible). |
| D3 | Choice grammar | **Yes** | Real fork / fake / delay-crisis / lock / exhaustible inquiry + per-mode pads. |
| D4 | 5-line turn skeletons | **Yes** | Story first; chrome after. |
| D5 | Anti-repetition craft | **Yes** | Recap vs continuation; location-by-state; NPC tactic; hot crisis. |
| D6 | Top 15 writing anti-patterns | **Yes** | Craft, not detector design. |
| D7 | Thinning map | **Yes** (80 rules) | Honest: keep **four sentences**, rest ledger/eval/drop. |
| D8 | CSV + markdown backlog | **Yes** (18 rows) | No Mid writer, no WOF, no Continuity-Warden LLM. |
| D9 | 12 yes/no critic gates | **Yes** | Offline transcript scoring only. |
| D10 | One-page exec | **Yes** | Wire-this-week vs research-only. |

**Success test from the prompt:** John can paste four short AUTHORITY lines and keep a one-page do/don’t for humans. Met.

---

## Recommended AUTHORITY lines (paste candidates)

Shared hard rule (already live 30R — do not restack):

> Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate.

Mode sentences (pack recommended; all ≤240 chars):

| Mode | Line |
|---|---|
| LitRPG | Resolve the story beat first; then report only earned, ledger-backed System changes, and make repeat inspection yield a new fact, a brief reminder, or honest exhaustion—never the same essay. |
| Tabletop (`dnd`) | Portray the changed situation, honor the declared action and fair ruling, let success stand with fiction-led consequences, share spotlight, then ask what the player does. |
| Story RPG | Advance one relationship through leverage, loyalty, or moral cost; change the NPC’s tactic, preserve the player’s interiority, and leave at least two socially distinct futures. |
| PYOA | Resolve the chosen fork, lock what it closed, change the page-local crisis, then offer 2–4 choices that lead to distinct futures—never four phrasings of the same delay. |

Editorial reject (D6, useful for humans / Gemini packs, not a live mandate):

> If deleting the player’s last input would leave the reply substantially unchanged, reject the turn unless the player explicitly requested a recap or status-only response.

---

## Anti-repetition (writer craft, not a new detector)

- **Recap is correct** only when the player asked (“say that again” / recap). Shorter restatement; world does not advance.
- **Continuation is not recap.** “Keep searching / keep walking / keep talking / wait” needs a **delta**: new fact, cost, external change, or honest exhaustion.
- **Location advances by state**, not a new map pin (who is present, what is open, time, threat).
- **NPC stays by changing tactic** (explain → bargain → warn → expose → leave), not by reprinting the first speech.
- **PYOA crisis stays hot** by shrinking affordances, not reprinting the danger paragraph louder.
- Synonym swap of the same beat is still a recycle.

D6 rank 1–6 (the ones Flash Lite actually does): prior-beat replay, crisis reprint, choice-pad paraphrase, inspect drip, Wait-Wait-Wait, NPC first-speech loop.

---

## Research-only vs ready to thin

**Ready to thin into live rails:** SC-001 **shipped 2026-08-30S** — four mode AUTHORITY sentences in SNAPSHOT + fluid rails. No new critic. No Mid writer.

**Already owned by code (do not invent a second stack):** clone reject + `playerAsksRepeat`, stall-pad recycle, inspect exhaustion / discovery uniqueness, `npcTopicFsm`, `pyoaBranchLedger`, `ChoiceCompiler` diversity, kit/presence/XP ledgers. SC-002–SC-005 and SC-015 are **tighten-existing**, not greenfield ledgers.

**Research / eval only:** full D2 lists, worked examples, D1 commentary, D3 terminology, D6 ranking, D9 12-gate critic JSON, JSON scrape AUTHORITY lines.

**Drop / junk:**

- `research_story_craft_domains.json` AUTHORITY lines (“Your choices shape the narrative”, “You are a SynapticGM…”) — generic and unused by the constitution.
- JSON “Wait, Wait, Wait…” Totem Arts forum hit — wrong Wait-Wait-Wait.
- IlorisNovel System-message essay: blocked; constitution correctly did not rely on it.
- LitRPG example setting mix (Vesper-Glass as a LitRPG cell).
- Score ceiling **8–9/10** after three small ledgers vs Path A honest **7.0–8.5** after three architectural batches.

---

## Path A / product constraints

Honored: no WOF, Mid writer OFF, no Continuity-Warden LLM, no licensed IP, points at T1 instead of rewriting it, names `ArcDirector` / `BeatContract` / `ChoiceCompiler` as already existing.

Tension: backlog still *sounds* like “add three ledger families.” Those families already shipped in 28a–29a / 30R. If John applies this, the honest next step is **four sentences + eval gates**, then only ledger work that current transcripts still fail.

---

## Next step if John wants to apply

1. Ship **SC-001** only: one sentence per saved mode key (`litrpg` / `dnd` / `rpg` / `pyoa`) in `situationPacket` AUTHORITY (or the existing mode-DNA slot). Leave the global recycle line as-is.  
2. Point Gemini / human reviews at D9 gates 1–4 and 6–8.  
3. Do **not** paste D2 into the live prompt. Flash Lite will ignore an 80-rule pile (27w lesson; D7 agrees).  
4. Re-open SC-002–SC-005 only where 30R still fails on a real transcript (locked PYOA route returning, inspect essay reprint, NPC first-speech loop).
